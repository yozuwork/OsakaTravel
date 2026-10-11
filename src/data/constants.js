export const STORAGE_KEY = 'travel-planner:v1';
export const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

export const CATEGORIES = [
  { id: '交通', icon: 'bus' },
  { id: '景點', icon: 'camera' },
  { id: '餐廳', icon: 'food' },
  { id: '住宿', icon: 'bed' },
  { id: '購物', icon: 'bag' },
  { id: '其他', icon: 'dot' }
];
export const catIcon = (c) => (CATEGORIES.find((x) => x.id === c) || CATEGORIES[5]).icon;

/** 主選單（底部固定 4 格 + 「更多」；左側選單全部列出）；en 是切換分頁時轉場動畫上的英文標題 */
/* icon 用 icons.js 的名稱，bi 用 Bootstrap Icons */
export const NAV_ITEMS = [
  { to: '/itinerary', label: '行程', en: 'ITINERARY', icon: 'suitcase' },
  { to: '/todo', label: '待辦', en: 'CHECKLIST', icon: 'checklist' },
  { to: '/checkin', label: '打卡', en: 'CHECK-IN', bi: 'geo-alt' },
  { to: '/ideas', label: '收集', en: 'INBOX', icon: 'inbox' }
];

/** 「更多」面板裡的分頁（3 欄格線，之後加頁直接往後排） */
export const MORE_ITEMS = [
  { to: '/stay', label: '住宿', en: 'STAY', icon: 'bed' },
  { to: '/map', label: '地圖', en: 'MAP', icon: 'map' },
  { to: '/transit', label: '交通', en: 'TRANSIT', icon: 'train' },
  { to: '/booking', label: '機票', en: 'BOOKING', bi: 'airplane' }
];

/** 待辦與清單的子分頁（對應 /todo/*） */
export const TODO_TABS = [
  { id: 'todo', path: '/todo', label: '行前待辦' },
  { id: 'flight', path: '/todo/flight', label: '班機' },
  { id: 'entry', path: '/todo/entry', label: '入國登記' },
  { id: 'stay', path: '/todo/stay', label: '住宿' },
  { id: 'bag', path: '/todo/bag', label: '行李' },
  { id: 'usj', path: '/todo/usj', label: '環球影城' }
];

/** 交通的子分頁（對應 /transit/*） */
export const TRANSIT_TABS = [
  { id: 'route', path: '/transit', label: '路線查詢', sub: 'A 到 B' },
  { id: 'airport', path: '/transit/airport', label: '機場交通', sub: 'KIX / ITM' },
  { id: 'lines', path: '/transit/lines', label: '路線圖例', sub: '顏色對照' }
];

export const ENTRY_STEPS = ['建立帳號並登入', '登錄本人（及同行家人）護照資料', '登錄入境、回國預定', '填寫入境審查與海關申報', '取得 QR Code 並截圖保存'];
