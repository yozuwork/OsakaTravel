import { SCRIPT } from '../fonts';
import { grainBg, lines, newCard, polaroid, subLine } from '../draw';

/** 經典拍立得：相紙下方手寫留言（沒有留言就寫站名）；橫式右側再寫站名和時間 */
export default function composePolaroid(src, stop, trip, orient, msg) {
  const { c, g, W, H, port } = newCard(orient);
  grainBg(g, W, H, '#e7e4dd', 61);
  const ink = '#1d2440';
  const text = msg || stop.title;
  const [cx, cy, w, h, pad, bottom] = port ? [540, 665, 880, 1100, 48, 250] : [420, 500, 640, 800, 36, 180];

  polaroid(g, cx, cy, w, h, 0.012, src, pad, bottom, (x, y, ww, hh, pw, ph) => {
    g.fillStyle = ink;
    g.font = `600 ${port ? 66 : 54}px ${SCRIPT}`;
    g.textAlign = 'center';
    const ls = lines(g, text, ww - 120, 2);
    ls.forEach((l, i) => g.fillText(l, 0, y + pad + ph + (port ? 104 : 80) + i * (port ? 70 : 58) - (ls.length - 1) * (port ? 22 : 18)));
  });

  if (!port) {
    g.fillStyle = ink;
    g.textAlign = 'left';
    g.font = `600 76px ${SCRIPT}`;
    lines(g, stop.title, 560, 2).forEach((l, i) => g.fillText(l, 840, 400 + i * 90));
    g.font = `600 44px ${SCRIPT}`;
    g.globalAlpha = 0.75;
    g.fillText(subLine(stop, trip), 840, 560);
    g.globalAlpha = 1;
  }
  return c;
}
