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
  const target = await command('Target.createTarget', {url:'http://localhost:5174/tests/public-share-preview.html'});
  const {sessionId} = await command('Target.attachToTarget',{targetId:target.targetId,flatten:true});
  const evaluate = async expression => (await command('Runtime.evaluate',{expression,returnByValue:true},sessionId)).result.value;
  for(let i=0;i<100&&!await evaluate('Boolean(document.querySelector(".public-journey"))');i++)await new Promise(resolve=>setTimeout(resolve,100));
  for(const width of [320,390,768,1440]){
    await command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<900},sessionId);
    await new Promise(resolve=>setTimeout(resolve,150));
    if(await evaluate('document.documentElement.scrollWidth>innerWidth'))throw Error('Overflow '+width);
    if(await evaluate('Boolean(document.querySelector("input,textarea,[contenteditable=true],.tabbar,.avatar"))'))throw Error('Private/edit UI present');
    const shot=await command('Page.captureScreenshot',{format:'png'},sessionId);await writeFile(join(tmpdir(),'osaka-public-'+width+'.png'),Buffer.from(shot.data,'base64'));
    await evaluate('document.querySelectorAll(".public-days button")[3].click()');await new Promise(resolve=>setTimeout(resolve,100));
    if(!await evaluate('document.querySelectorAll(".public-days button")[3].getAttribute("aria-pressed")==="true"&&document.querySelector(".public-day .share-eyebrow").textContent.includes("04")'))throw Error('Day selection failed');
    console.log('PASS public readonly layout, no overflow and day selection:',width);
  }
  await command('Page.navigate',{url:'http://localhost:5174/#/share/invalid'},sessionId);
  for(let i=0;i<100&&!await evaluate('Boolean(document.querySelector(".public-message"))');i++)await new Promise(resolve=>setTimeout(resolve,100));
  if(!await evaluate('Boolean(document.querySelector(".public-message"))&&!document.querySelector(".auth-page,.app,.avatar")'))throw Error('Anonymous public route failed: '+await evaluate('JSON.stringify({hash:location.hash,url:location.href,body:document.body.innerText.slice(0,1200)})'));
  console.log('PASS anonymous public route bypasses private application');

} finally {
  socket?.close(); processHandle.kill();
}


