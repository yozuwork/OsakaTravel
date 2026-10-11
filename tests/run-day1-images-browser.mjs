import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
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
    if(message.method==='Runtime.exceptionThrown') console.log(JSON.stringify(message.params.exceptionDetails));const job = pending.get(message.id);
    if (job) { pending.delete(message.id); message.error ? job.reject(message.error) : job.resolve(message.result); }
  };
  const command = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++nextId; pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const target=await command('Target.createTarget',{url:'http://localhost:5174/tests/day1-images-preview.html'});const {sessionId}=await command('Target.attachToTarget',{targetId:target.targetId,flatten:true});
  const evaluate=async expression=>(await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId)).result.value;
  await command('Runtime.enable',{},sessionId);await command('Network.enable',{},sessionId);
  await command('Network.setBlockedURLs',{urls:['https://*.wikimedia.org/*','https://*.animate.co.jp/*','https://*.mandarake.co.jp/*','https://*.osaka-info.jp/*','https://*.hearton.co.jp/*']},sessionId);
  for(const page of ['itinerary','checkin'])for(const width of [390,1440]){
    await command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<900},sessionId);
    await command('Page.navigate',{url:'http://localhost:5174/tests/day1-images-preview.html?'+page},sessionId);
    for(let i=0;i<100&&!await evaluate('document.querySelectorAll("img[src*=covers]").length>0');i++)await new Promise(resolve=>setTimeout(resolve,100));
    const result=await evaluate('(async()=>{const images=[...document.querySelectorAll("img[src*=covers]")];for(const img of images)img.loading="eager";await Promise.all(images.map(img=>img.decode().catch(()=>{})));return {count:images.length,failed:images.filter(img=>!img.naturalWidth).map(img=>img.src)}})()');
    if(!result.count||result.failed.length)throw Error(JSON.stringify(result)+await evaluate('document.body.innerText.slice(0,2000)'));console.log('PASS DAY1 covers with external sites blocked:',page,width,result.count);
  }

} finally {
  socket?.close(); processHandle.kill();
}


