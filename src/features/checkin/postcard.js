/* =========================================================
   明信片沖洗：照片 → 版型底圖（base）→ 輸出 JPEG（card）
   base 只在換版型／方向／留言時重畫；之後蓋章只要在 base 上疊章
   ========================================================= */
import { fontsOk } from './fonts';
import { layoutOf } from './layouts';
import { canvasBlob } from './photo';

/**
 * 明信片草稿（PostcardViewer 編輯中的狀態）
 * @typedef {object} PostcardDraft
 * @property {string} id
 * @property {string} itemId
 * @property {{ no, title, time, category }} stop
 * @property {{ name, date, day }} trip
 * @property {HTMLCanvasElement} photoCanvas 照片（效果快取以它為 key，編輯期間要沿用同一個）
 * @property {Blob} photo
 * @property {string} style
 * @property {'port'|'land'} orient
 * @property {string} msg
 * @property {object[]} stamps
 * @property {HTMLCanvasElement|null} base
 * @property {Blob|null} card
 * @property {boolean} saved 已收進明信片集
 * @property {number} at
 */

/** 畫版型底圖 */
export async function composeBase(d) {
  await fontsOk();
  return layoutOf(d.style).compose(d.photoCanvas, d.stop, d.trip, d.orient, d.msg);
}

/** 底圖（沒有就先畫）→ 輸出明信片 JPEG；回傳 { base, card } */
export async function renderCard(d) {
  const base = d.base || await composeBase(d);
  const c = document.createElement('canvas');
  c.width = base.width;
  c.height = base.height;
  c.getContext('2d').drawImage(base, 0, 0);
  return { base, card: await canvasBlob(c, 0.92) };
}

/** 橫的照片自動用橫式，其他沿用上次選的方向 */
export const autoOrient = (photoCanvas, last) => (photoCanvas.width > photoCanvas.height * 1.15 ? 'land' : last);

/** 存進 IndexedDB 的欄位 */
export const toRecord = (d) => ({
  id: d.id, itemId: d.itemId, style: d.style, orient: d.orient, msg: d.msg,
  stamps: d.stamps, photo: d.photo, card: d.card, at: d.at
});
