/* =========================================================
   印章：郵戳（圓）、打卡印（方）、票根章（長）
   都印上真正蓋下去的日期時間；邊緣有印泥沒沾勻的斑駁感
   ========================================================= */
import { LEX, SANS } from './fonts';
import { fitText } from './draw';
import { fmtDate, fmtTime, pad } from './photo';

export const STAMP_RED = '#c8392f';

export const STAMP_DESIGNS = [
  { id: 'post', name: '郵戳' },
  { id: 'seal', name: '打卡印' },
  { id: 'ticket', name: '票根章' }
];

/**
 * 畫一個章
 * @param {'post'|'seal'|'ticket'} design
 * @param {{ at: number, title: string, no: number }} info 蓋章時間、站名、第幾站
 * @param {number} S 大小（票根章寬 1.45S、高 0.72S）
 */
export function stampCanvas(design, info, S) {
  const W = design === 'ticket' ? Math.round(S * 1.45) : S;
  const H = design === 'ticket' ? Math.round(S * 0.72) : S;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.strokeStyle = g.fillStyle = STAMP_RED;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const date = fmtDate(info.at), time = fmtTime(info.at);

  if (design === 'post') {
    const R = S / 2 - S * 0.04, cx = S / 2, cy = S / 2;
    g.lineWidth = S * 0.045;
    g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
    g.lineWidth = S * 0.016;
    g.beginPath(); g.arc(cx, cy, R * 0.84, 0, 7); g.stroke();
    g.font = `800 ${S * 0.085}px ${LEX}`;
    g.fillText(date, cx, cy - R * 0.5);
    g.lineWidth = S * 0.014;
    g.beginPath();
    g.moveTo(cx - R * 0.8, cy - R * 0.28); g.lineTo(cx + R * 0.8, cy - R * 0.28);
    g.moveTo(cx - R * 0.8, cy + R * 0.28); g.lineTo(cx + R * 0.8, cy + R * 0.28);
    g.stroke();
    g.font = `900 ${S * 0.2}px ${LEX}`;
    g.fillText(time, cx, cy + S * 0.01);
    const fs = fitText(g, info.title, `900 {s}px ${SANS}`, Math.round(S * 0.1), R * 1.15);
    g.font = `900 ${fs}px ${SANS}`;
    g.fillText(info.title, cx, cy + R * 0.52);
  } else if (design === 'seal') {
    const m = S * 0.06, w = S - 2 * m;
    g.lineWidth = S * 0.05;
    g.beginPath(); g.roundRect(m, m, w, w, S * 0.09); g.stroke();
    g.lineWidth = S * 0.014;
    g.beginPath(); g.roundRect(m + S * 0.05, m + S * 0.05, w - S * 0.1, w - S * 0.1, S * 0.06); g.stroke();
    g.font = `900 ${S * 0.25}px ${SANS}`;
    g.fillText('打卡', S / 2, S * 0.37);
    g.fillRect(S * 0.24, S * 0.53, S * 0.52, S * 0.016);
    g.font = `900 ${S * 0.15}px ${LEX}`;
    g.fillText(time, S / 2, S * 0.66);
    g.font = `700 ${S * 0.075}px ${LEX}`;
    g.fillText(date, S / 2, S * 0.8);
  } else {
    const m = S * 0.05;
    g.lineWidth = S * 0.04;
    g.beginPath(); g.roundRect(m, m, W - 2 * m, H - 2 * m, H * 0.2); g.stroke();
    g.setLineDash([S * 0.03, S * 0.03]);
    g.lineWidth = S * 0.012;
    g.beginPath(); g.moveTo(W * 0.3, m * 2.2); g.lineTo(W * 0.3, H - m * 2.2); g.stroke();
    g.setLineDash([]);
    g.save();
    g.translate(W * 0.17, H / 2);
    g.rotate(-Math.PI / 2);
    g.font = `900 ${S * 0.085}px ${LEX}`;
    g.fillText(`STAGE ${pad(info.no)}`, 0, 0);
    g.restore();
    g.font = `800 ${S * 0.075}px ${LEX}`;
    g.fillText('CHECK-IN', W * 0.65, H * 0.26);
    g.font = `900 ${S * 0.2}px ${LEX}`;
    g.fillText(time, W * 0.65, H * 0.53);
    g.font = `700 ${S * 0.07}px ${LEX}`;
    g.fillText(date, W * 0.65, H * 0.78);
  }

  // 印泥沒沾勻的斑駁感（依蓋章時間固定，重畫不會變）
  g.globalCompositeOperation = 'destination-out';
  let x = (info.at % 9973) + 11;
  const next = () => (x = (x * 16807) % 2147483647);
  for (let i = 0; i < (W * H) / 55; i++) {
    const px = next() % W, py = next() % H;
    next();
    g.globalAlpha = 0.25 + (x % 60) / 100;
    g.fillRect(px, py, 1 + (x % 3), 1 + (x % 2));
  }
  for (let i = 0; i < 6; i++) {
    const px = next() % W, py = next() % H;
    g.globalAlpha = 0.35;
    g.beginPath(); g.arc(px, py, S * (0.02 + (x % 5) / 100), 0, 7); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  return c;
}

const urlCache = new Map();

/** 章的圖片網址（給 <img> 用，同樣內容只畫一次） */
export function stampUrl(design, info, S = 180) {
  const key = `${design}|${info.at}|${info.title}|${info.no}|${S}`;
  if (!urlCache.has(key)) urlCache.set(key, stampCanvas(design, info, S).toDataURL());
  return urlCache.get(key);
}
