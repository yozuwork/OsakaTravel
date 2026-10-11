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
  const target = await command('Target.createTarget', {url:'http://localhost:5174/tests/item-editor-preview.html'});
  const {sessionId} = await command('Target.attachToTarget',{targetId:target.targetId,flatten:true});
  const evaluate = async expression => (await command('Runtime.evaluate',{expression,returnByValue:true},sessionId)).result.value;
  for (let i=0;i<100 && !await evaluate('Boolean(document.querySelector(".item-workspace"))');i++) await new Promise(resolve=>setTimeout(resolve,100));
  for (const width of [320,390,768,1440]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<900},sessionId);
    await new Promise(resolve=>setTimeout(resolve,250));
    const layout=await evaluate('(()=>{const s=document.querySelector(".sheet--fullscreen"),r=s.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,top:r.top,overflow:s.scrollWidth>s.clientWidth,bodyOverflow:document.querySelector(".sheet__body").scrollWidth>document.querySelector(".sheet__body").clientWidth}})()');
    if(layout.width!==width||layout.height!==844||layout.left!==0||layout.top!==0||layout.overflow||layout.bodyOverflow) throw Error(JSON.stringify(layout));
    const screenshot=await command('Page.captureScreenshot',{format:'png'},sessionId);await writeFile(join(tmpdir(),'osaka-item-'+width+'.png'),Buffer.from(screenshot.data,'base64'));
    console.log('PASS fullscreen and no horizontal overflow:',width);
  }
  await evaluate('document.querySelector(".item-workspace").requestSubmit()');await new Promise(resolve=>setTimeout(resolve,100));
  if(!await evaluate('document.activeElement.name === "title"')) throw Error('Empty title validation failed');
  await evaluate('(()=>{const input=document.querySelector("input[name=title]");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,"UI test destination");input.dispatchEvent(new Event("input",{bubbles:true}));const day=document.querySelector("select[name=day]");Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(day,"2");day.dispatchEvent(new Event("change",{bubbles:true}));})()');
  await new Promise(resolve=>setTimeout(resolve,100));
  await evaluate('document.querySelector(".item-workspace").requestSubmit()');await new Promise(resolve=>setTimeout(resolve,150));
  if(!await evaluate('window.tripStore.getState().items.some(item=>item.title==="UI test destination"&&item.day===2)')) throw Error('Item not added to chosen day');
  if(await evaluate('Boolean(document.querySelector(".sheet"))')) throw Error('Save did not close');
  console.log('PASS required title validation and new item save to selected day');

} finally {
  socket?.close(); processHandle.kill();
}


