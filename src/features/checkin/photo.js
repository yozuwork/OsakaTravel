/* =========================================================
   打卡頁和 engine.js 之間的轉接：照片讀取、行程資料轉成 engine 要的格式
   影像效果、版型、印章、PDF 都在 engine.js（checkin-module-v1 原檔，不要改）
   ========================================================= */
import { addDays, parseDate } from '../../utils/date';
import { WEEK } from '../../data/constants';
import { blobToImage, normalize } from './engine';

export const PHOTO_MAX = 1600; // 照片最長邊（影像運算很吃效能，先縮小再處理）

/** 等畫面先更新一格（顯示「沖洗中」再開始重運算） */
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 16)));

/** 相機畫面 → canvas，最長邊縮到 PHOTO_MAX；mirror：前鏡頭左右翻轉 */
export function videoToCanvas(v, mirror = false) {
  const s = Math.min(1, PHOTO_MAX / Math.max(v.videoWidth, v.videoHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(v.videoWidth * s);
  c.height = Math.round(v.videoHeight * s);
  const g = c.getContext('2d');
  if (mirror) { g.translate(c.width, 0); g.scale(-1, 1); }
  g.drawImage(v, 0, 0, c.width, c.height);
  return c;
}

/** 照片檔 / Blob → canvas（engine 的 normalize 會縮到最長邊 1600） */
export const blobToPhotoCanvas = async (blob) => normalize(await blobToImage(blob));

/**
 * 行程 → engine 的 stop
 * @returns {{ id, no, time, category, title, stampAt? }} stampAt：這站的打卡時間（復古雙面版型背面的郵戳會用）
 */
export const toStop = (item, index, stamp) => ({
  id: item.id, no: index + 1, time: item.time || '--:--', category: item.category || '其他',
  title: item.title || '未命名行程', stampAt: stamp?.at
});

/** 旅程 → engine 的 TRIP：{ name, date: 'YYYY.MM.DD', day（從 1 起算）, weekday } */
export function toTripInfo(trip, day) {
  const iso = addDays(trip.startDate, day);
  return { name: trip.name, date: iso.replace(/-/g, '.'), day: day + 1, weekday: WEEK[parseDate(iso).getDay()] };
}
