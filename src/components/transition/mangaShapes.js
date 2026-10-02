/* =========================================================
   漫畫斜切轉場：常數與形狀（MangaDaySwitch.jsx 使用）
   ========================================================= */

/** 斜切線：左側在高度 62%、右側在高度 38% */
export const SPLIT_LEFT = 0.62;
export const SPLIT_RIGHT = 0.38;
/** 外邊距、兩格之間的白色間隙（px） */
export const MARGIN = 12;
export const GAP = 14;
/** 從開始到切換行程資料的停留時間（ms） */
export const HOLD_MS = 560;

export const EASE_IN = 'cubic-bezier(.2,.9,.25,1)';
export const EASE_OUT = 'cubic-bezier(.7,0,.85,.4)';
export const EASE_CUT = 'cubic-bezier(.6,0,.3,1)';
export const EASE_POP = 'cubic-bezier(.2,1.3,.4,1)';

/**
 * 依容器實際寬高算出兩格的四個頂點與斜切黑線
 * @returns {{ top: number[][], bottom: number[][], line: { x1, y1, x2, y2, len }, dy: number }}
 */
export function layoutPanels(W, H, { left = SPLIT_LEFT, right = SPLIT_RIGHT, m = MARGIN, g = GAP } = {}) {
  const yl = H * left, yr = H * right;
  const dy = yl - yr;
  const top = [[m, m], [W - m, m], [W - m, yr - g / 2], [m, yl - g / 2]];
  const bottom = [[m, yl + g / 2], [W - m, yr + g / 2], [W - m, H - m], [m, H - m]];
  // 黑線兩端各延伸 20px，沿斜率補上高度差
  const ext = (20 * dy) / W;
  const line = { x1: -20, y1: yl + ext, x2: W + 20, y2: yr - ext, len: Math.hypot(W + 40, dy) };
  return { top, bottom, line, dy };
}

export const toClipPath = (pts) => `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(',')})`;
export const toPoints = (pts) => pts.map((p) => p.join(',')).join(' ');

/** 集中線：110 條細長三角形從中心往外放射（固定 seed，每次形狀一致；viewBox -100 -100 200 200） */
export const SPEED_LINES = (() => {
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const p = (ang, r) => `${(Math.cos(ang) * r).toFixed(2)},${(Math.sin(ang) * r).toFixed(2)}`;
  let d = '';
  for (let i = 0; i < 110; i++) {
    const a = (i / 110) * Math.PI * 2 + rnd() * 0.04;
    const r0 = 30 + rnd() * 18, w = 0.006 + rnd() * 0.014;
    d += `M${p(a, r0)}L${p(a - w, 100)}L${p(a + w, 100)}Z`;
  }
  return d;
})();

/** 爆炸對話框：22 個尖角、長短交錯（viewBox 0 0 240 200） */
export const BURST_POINTS = '235.0,100.0 195.1,107.7 230.3,123.1 199.5,125.9 216.7,144.3 177.4,135.4 195.3,162.0 167.3,152.4 167.8,174.6 141.4,151.9 136.4,181.2 120.0,162.3 103.6,181.2 98.6,151.9 72.2,174.6 72.7,152.4 44.7,162.0 62.6,135.4 23.3,144.3 40.5,125.9 9.7,123.1 44.9,107.7 5.0,100.0 33.5,91.1 9.7,76.9 51.0,77.5 23.3,55.7 53.9,59.2 44.7,38.0 79.0,54.5 72.2,25.4 95.4,40.2 103.6,18.8 120.0,45.9 136.4,18.8 144.6,40.2 167.8,25.4 161.0,54.5 195.3,38.0 186.1,59.2 216.7,55.7 189.0,77.5 230.3,76.9 206.5,91.1';
