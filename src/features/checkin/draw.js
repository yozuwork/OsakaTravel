/* =========================================================
   明信片共用的 canvas 畫法（紙張、文字排版、拍立得框…）
   都是純函式：吃 2D context（g）和座標，直接畫上去
   ========================================================= */

/** 明信片尺寸：直式 1080×1350、橫式 1500×1000 */
export const SIZE = { port: [1080, 1350], land: [1500, 1000] };

/** 建一張明信片大小的 canvas */
export function newCard(orient) {
  const [W, H] = SIZE[orient];
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return { c, g: c.getContext('2d'), W, H, port: orient === 'port' };
}

/** 固定種子的亂數（同一張卡每次畫出來都一樣） */
export const rnd = (seed) => {
  let x = (seed % 2147483646) + 1;
  return () => (x = (x * 16807) % 2147483647) / 2147483647;
};

/** 紙張底色＋細顆粒 */
export function grainBg(g, W, H, base, seed, amt = 1) {
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  const r = rnd(seed);
  for (let i = 0; i < (W * H) / 260 * amt; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(90,70,50,.07)' : 'rgba(255,255,255,.4)';
    g.fillRect(r() * W, r() * H, 1.5, 1.5);
  }
}

/** 字太長就縮小，直到寬度 ≤ max（最小 18px）；font 裡的 {s} 會換成字級，回傳字級 */
export function fitText(g, text, font, size, max) {
  let s = size;
  do {
    g.font = font.replace('{s}', s);
    if (g.measureText(text).width <= max) break;
    s -= 2;
  } while (s > 18);
  return s;
}

/** 置中、加字距畫一行字 */
export function spaced(g, text, x, y, track) {
  const ch = [...text];
  const ws = ch.map((c) => g.measureText(c).width);
  const total = ws.reduce((a, b) => a + b, 0) + track * (ch.length - 1);
  let cx = x - total / 2;
  g.textAlign = 'left';
  ch.forEach((c, i) => { g.fillText(c, cx, y); cx += ws[i] + track; });
  g.textAlign = 'center';
}

/** 圖片裁切填滿矩形（object-fit: cover） */
export function drawCover(g, src, x, y, w, h) {
  const s = Math.max(w / src.width, h / src.height), dw = src.width * s, dh = src.height * s;
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.drawImage(src, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  g.restore();
}

/** 依寬度斷行，最多 n 行，放不下的最後一行加「…」 */
export function lines(g, text, max, n) {
  const out = [];
  let line = '';
  for (const ch of [...text.replace(/\s+/g, ' ').trim()]) {
    if (g.measureText(line + ch).width > max && line) {
      out.push(line);
      line = ch;
      if (out.length === n) break;
    } else line += ch;
  }
  if (out.length < n && line) out.push(line);
  else if (out.length === n && line && out.join('').length < [...text].length) out[n - 1] = out[n - 1].slice(0, -1) + '…';
  return out;
}

/** 有陰影地畫 */
export function shadowed(g, fn, blur = 24, oy = 10, alpha = 0.22) {
  g.save();
  g.shadowColor = `rgba(20,25,35,${alpha})`;
  g.shadowBlur = blur;
  g.shadowOffsetY = oy;
  fn();
  g.restore();
}

/** 以 (cx, cy) 為中心旋轉 rot 再畫 */
export function around(g, cx, cy, rot, fn) {
  g.save();
  g.translate(cx, cy);
  g.rotate(rot);
  fn();
  g.restore();
}

/**
 * 拍立得相紙：白框＋照片；fn(x, y, w, h, 照片寬, 照片高) 在相紙座標系（中心為原點）裡畫下方文字
 */
export function polaroid(g, cx, cy, w, h, rot, src, pad, bottom, fn) {
  around(g, cx, cy, rot, () => {
    shadowed(g, () => { g.fillStyle = '#fbfaf7'; g.fillRect(-w / 2, -h / 2, w, h); }, 28, 12, 0.25);
    const pw = w - pad * 2, ph = h - pad - bottom;
    drawCover(g, src, -w / 2 + pad, -h / 2 + pad, pw, ph);
    g.strokeStyle = 'rgba(0,0,0,.08)';
    g.lineWidth = 2;
    g.strokeRect(-w / 2 + pad, -h / 2 + pad, pw, ph);
    fn?.(-w / 2, -h / 2, w, h, pw, ph);
  });
}

/** 「09:30 · 第 2 站 · 大阪冬旅」 */
export const subLine = (stop, trip) => `${stop.time} · 第 ${stop.no} 站 · ${trip.name}`;
