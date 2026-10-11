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
    const job = pending.get(message.id);
    if (job) { pending.delete(message.id); message.error ? job.reject(message.error) : job.resolve(message.result); }
  };
  const command = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++nextId; pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const target = await command('Target.createTarget', {url:'http://localhost:5174/tests/avatar-preview.html'});
  const {sessionId} = await command('Target.attachToTarget',{targetId:target.targetId,flatten:true});
  const evaluate = async expression => (await command('Runtime.evaluate',{expression,returnByValue:true},sessionId)).result.value;
  for (let i=0;i<80 && !await evaluate('Boolean(document.querySelector(".avatar"))');i++) await new Promise(resolve=>setTimeout(resolve,100));
  for (const width of [320,390,1440]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<900},sessionId);
    await evaluate('document.querySelector(".avatar").click()');
    await new Promise(resolve=>setTimeout(resolve,200));
    const visible = await evaluate('[...document.querySelectorAll(".avatar-menu__item")].every(button=>{const r=button.getBoundingClientRect();return button.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))})');
    if (!visible) throw Error('Menu obscured at '+width);
    await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27},sessionId);
    await new Promise(resolve=>setTimeout(resolve,100));
    if (await evaluate('Boolean(document.querySelector(".avatar-menu"))')) throw Error('Escape failed');
    console.log('PASS avatar menu stacking and Escape:',width);
  }
} finally {
  socket?.close(); processHandle.kill();
}


