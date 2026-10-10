/* =========================================================
   明信片版型清單
   每個版型一個檔，統一簽名：(src, stop, trip, orient, msg) => canvas
   - src：照片 canvas（最長邊 1600）
   - stop：{ no, title, time, category }（photo.js 的 toStop）
   - trip：{ name, date, day }（photo.js 的 toTripInfo）
   - orient：'port' 直式 1080×1350｜'land' 橫式 1500×1000
   - msg：留言（最多 40 字，可空白）
   新增版型：寫一個檔，在下面 LAYOUTS 加一筆；group 決定出現在「照片」還是「插畫」
   ========================================================= */
import composePolaroid from './polaroid';

export const LAYOUTS = [
  { id: 'polaroid', name: '經典拍立得', group: 'photo', compose: composePolaroid }
];

export const DEFAULT_LAYOUT = 'polaroid';

export const layoutOf = (id) => LAYOUTS.find((l) => l.id === id) || LAYOUTS.find((l) => l.id === DEFAULT_LAYOUT);
