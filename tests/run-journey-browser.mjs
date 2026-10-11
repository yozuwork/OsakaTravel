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
  const target = await command('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await command('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const evaluate = async expression => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId)).result;
  for (const page of ['map', 'checkin']) {
    await command('Page.navigate', { url: `http://127.0.0.1:5173/tests/journey-preview.html?page=${page}` }, sessionId);
    for (let attempt = 0; attempt < 100; attempt++) {
      if ((await evaluate('Boolean(document.querySelector(".journey-hero"))')).value) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    for (const width of [320, 390, 768, 1440]) {
      await command('Emulation.setDeviceMetricsOverride', {width, height: 1000, deviceScaleFactor: 1, mobile: width < 900}, sessionId);
      await new Promise(resolve => setTimeout(resolve, 800));
      const metrics = JSON.parse((await evaluate('JSON.stringify({width:innerWidth,scroll:document.documentElement.scrollWidth,hero:!!document.querySelector(".journey-hero")})')).value);
      console.log(page, width, metrics);
      if (!metrics.hero || metrics.scroll > metrics.width) throw new Error('Layout overflow');
      if (!(await evaluate('(()=>{const nav=document.querySelector(".journey-days").getBoundingClientRect();const selected=document.querySelector(".journey-days [aria-pressed=true]").getBoundingClientRect();return selected.left>=nav.left-1 && selected.right<=nav.right+1})()')).value) throw new Error('Selected day is offscreen');
      if (width === 390 || width === 1440) {
        await evaluate('document.querySelectorAll("img").forEach(image => image.loading = "eager")');
        await new Promise(resolve => setTimeout(resolve, 1600));
        const screenshot = await command('Page.captureScreenshot', {format: 'png', captureBeyondViewport: true}, sessionId);
        await writeFile(join(tmpdir(), `osaka-${page}-${width}.png`), Buffer.from(screenshot.data, 'base64'));
      }
    }
    if (page === 'map') {
      await command('Emulation.setDeviceMetricsOverride', {width: 390, height: 844, deviceScaleFactor: 1, mobile: true}, sessionId);
      await evaluate('document.querySelectorAll(".journey-switch button")[1].click()');
      await new Promise(resolve => setTimeout(resolve, 100));
      const count = (await evaluate('document.querySelectorAll(".journey-route-list li").length')).value;
      if (count !== 11) throw new Error('Route list missing stops');
      await evaluate('document.querySelectorAll(".journey-route-list button")[1].click()');
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!(await evaluate('document.querySelector(".qm-sheet__stage").textContent')).value.includes('2')) throw new Error('Selected stop failed');
      await new Promise(resolve => setTimeout(resolve, 300));
      if (!(await evaluate('(()=>{const bounds=document.querySelector(".map-sheet").getBoundingClientRect();return bounds.top>=0 && bounds.bottom<=innerHeight && bounds.width<=innerWidth})()')).value) throw new Error('Mobile detail panel is offscreen');
      await command('Input.dispatchKeyEvent', {type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27}, sessionId);
      await new Promise(resolve => setTimeout(resolve, 100));
      if ((await evaluate('document.querySelector(".map-sheet").classList.contains("is-open")')).value) throw new Error('Mobile detail Escape failed');
      await evaluate('document.querySelectorAll(".journey-days button")[4].click()');
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!(await evaluate('document.querySelector(".qm-head__world").textContent')).value.includes('5')) throw new Error('Day change failed');
    } else {
      await evaluate('document.querySelectorAll(".journey-filters button")[2].click()');
      await new Promise(resolve => setTimeout(resolve, 100));
      if ((await evaluate('document.querySelectorAll(".ck-stop").length')).value !== 1) throw new Error('Stamped filter failed');
      await evaluate('document.querySelectorAll(".journey-filters button")[1].click()');
      await new Promise(resolve => setTimeout(resolve, 100));
      if ((await evaluate('document.querySelectorAll(".ck-stop").length')).value !== 10) throw new Error('Pending filter failed');
      await evaluate('document.querySelector(".ck-stampbtn").click()');
      await new Promise(resolve => setTimeout(resolve, 200));
      if ((await evaluate('document.querySelector(".journey-progress").getAttribute("aria-valuenow")')).value !== '2') throw new Error('Stamp progress failed');
      if ((await evaluate('document.querySelectorAll(".ck-stop").length')).value !== 9) throw new Error('Live filter failed');
    }
    await command('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: 'reduce'}]}, sessionId);
    if ((await evaluate('getComputedStyle(document.querySelector(".journey-art")).animationName')).value !== 'none') throw new Error('Reduced motion failed');
  }
  console.log('PASS: map/checkin responsive widths, route mode, selection, day changes, filters, stamp progress, reduced motion');
} finally {
  socket?.close(); processHandle.kill();
}


