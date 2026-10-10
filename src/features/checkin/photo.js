/* =========================================================
   照片讀取與共用小工具
   ========================================================= */
import { addDays } from '../../utils/date';

export const PHOTO_MAX = 1600; // 照片最長邊（影像運算很吃效能，先縮小再處理）

export const pad = (n) => String(n).padStart(2, '0');
export const fmtDate = (t) => { const d = new Date(t); return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`; };
export const fmtTime = (t) => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/** 等畫面先更新一格（顯示「沖洗中」再開始重運算） */
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 16)));

export function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

/** 畫到 canvas，最長邊縮到 PHOTO_MAX；mirror：前鏡頭左右翻轉 */
export function toPhotoCanvas(src, w = src.width, h = src.height, mirror = false) {
  const s = Math.min(1, PHOTO_MAX / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * s);
  c.height = Math.round(h * s);
  const g = c.getContext('2d');
  if (mirror) { g.translate(c.width, 0); g.scale(-1, 1); }
  g.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

export const blobToPhotoCanvas = async (blob) => toPhotoCanvas(await blobToImage(blob));

export const canvasBlob = (c, quality = 0.9) => new Promise((r) => c.toBlob(r, 'image/jpeg', quality));

/**
 * 明信片上要印的行程資訊
 * @returns {{ no: number, title: string, time: string, category: string }} stop
 */
export const toStop = (item, index) => ({
  no: index + 1, title: item.title || '未命名行程', time: item.time || '--:--', category: item.category || '其他'
});

/**
 * 明信片上要印的旅程資訊
 * @returns {{ name: string, date: string, day: number }} date 是 YYYY.MM.DD，day 從 1 起算
 */
export const toTripInfo = (trip, day) => ({
  name: trip.name, date: addDays(trip.startDate, day).replace(/-/g, '.'), day: day + 1
});
