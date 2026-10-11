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
  const target = await command('Target.createTarget', { url: 'http://127.0.0.1:5173/tests/stay-preview.html' });
  const { sessionId } = await command('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const evaluate = async expression => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId)).result;
  for (let attempt = 0; attempt < 80; attempt++) {
    if ((await evaluate('Boolean(document.querySelector(".stay-hero"))')).value) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  for (const width of [320, 390, 768, 1440]) {
    await command('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 900 }, sessionId);
    await new Promise(resolve => setTimeout(resolve, 800));
    await evaluate('document.querySelectorAll("img").forEach(image => image.loading = "eager")');
    if (width === 320) {
      const deadline = Date.now() + 20000;
      while (Date.now() < deadline && !(await evaluate('[...document.images].every(image => image.complete)')).value) await new Promise(resolve => setTimeout(resolve, 250));
      console.log('Image loading:', (await evaluate('JSON.stringify([...document.images].map(image => ({loaded:image.naturalWidth>0,complete:image.complete})))')).value);
    }
    const metrics = (await evaluate('JSON.stringify({width:innerWidth,scroll:document.documentElement.scrollWidth,hero:!!document.querySelector(".stay-hero"),cards:document.querySelectorAll(".stay-area__card").length})')).value;
    console.log(metrics);
    const m = JSON.parse(metrics);
    if (!m.hero || m.cards !== 6 || m.scroll > m.width) throw new Error('Layout overflow or missing content');
    if (width === 390 || width === 1440) {
      const screenshot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId);
      await writeFile(join(tmpdir(), `osaka-stay-${width}.png`), Buffer.from(screenshot.data, 'base64'));
    }
  }
  await evaluate('document.querySelector(".stay-area__image").click()');
  await new Promise(resolve => setTimeout(resolve, 100));
  if (!(await evaluate('Boolean(document.querySelector(".stay-lightbox"))')).value) throw new Error('Lightbox did not open');
  await evaluate('document.querySelectorAll(".stay-lightbox__controls button")[1].click()');
  await new Promise(resolve => setTimeout(resolve, 100));
  if (!(await evaluate('document.querySelector(".stay-lightbox__caption span").textContent')).value.includes('2 /')) throw new Error('Next photo failed');
  await command('Input.dispatchKeyEvent', { type:'keyDown', key:'Escape', code:'Escape', windowsVirtualKeyCode:27 }, sessionId);
  await new Promise(resolve => setTimeout(resolve, 100));
  if ((await evaluate('Boolean(document.querySelector(".stay-lightbox"))')).value) throw new Error('Escape did not close lightbox');
  await command('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'reduce'}] }, sessionId);
  if ((await evaluate('getComputedStyle(document.querySelector(".stay-hero__copy")).animationName')).value !== 'none') throw new Error('Reduced motion failed');
  console.log('PASS: four viewport widths, gallery navigation, Escape close, reduced motion');
} finally {
  socket?.close(); processHandle.kill();
}

