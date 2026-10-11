import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Uses a separate temporary profile; never opens the user's browser profile.
const profile = await mkdtemp(join(tmpdir(), 'osaka-images-'));
const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const processHandle = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run',
  '--allow-file-access-from-files', '--remote-debugging-port=0', `--user-data-dir=${profile}`],
{ windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
try {
  const address = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Chrome startup timed out')), 10000);
    processHandle.on('error', reject);
    processHandle.stderr.on('data', (data) => {
      output += data;
      const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
  });
  socket = new WebSocket(address);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const job = pending.get(message.id);
    if (job) { pending.delete(message.id); message.error ? job.reject(message.error) : job.resolve(message.result); }
  };
  const command = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++nextId; pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const target=await command('Target.createTarget',{url:'http://localhost:5174/tests/dialogue-preview.html'});
  const {sessionId}=await command('Target.attachToTarget',{targetId:target.targetId,flatten:true});
  await new Promise(resolve=>setTimeout(resolve,800));
  const covers={...JSON.parse(await readFile('src/data/itineraryCoverLinks.json','utf8')),...JSON.parse(await readFile('src/data/day1CoverLinks.json','utf8'))};
  for(const key of Object.keys(covers)){
    const result=await command('Runtime.evaluate',{expression: '(async()=>{const img=new Image();img.src="/covers/stable/'+key+'.jpg";await img.decode();const canvas=document.createElement("canvas");const scale=Math.min(1,1200/Math.max(img.naturalWidth,img.naturalHeight));canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL("image/webp",.88)})()',awaitPromise:true,returnByValue:true},sessionId);
    const data=result.result.value;if(!data?.startsWith('data:image/webp'))throw Error('Compression failed '+key);
    await writeFile('public/covers/stable/'+key+'.webp',Buffer.from(data.split(',')[1],'base64'));await unlink('public/covers/stable/'+key+'.jpg');console.log(key+': compressed');
  }

} finally {
  socket?.close(); processHandle.kill();
}


