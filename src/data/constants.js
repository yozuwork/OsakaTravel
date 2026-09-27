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

/** 主選單（底部 / 左側） */
export const NAV_ITEMS = [
  { to: '/itinerary', label: '行程', icon: 'suitcase' },
  { to: '/todo', label: '待辦與清單', icon: 'checklist' },
  { to: '/map', label: '地圖', icon: 'map' },
  { to: '/ideas', label: '收集箱', icon: 'inbox' }
];

/** 待辦與清單的子分頁（對應 /todo/*） */
export const TODO_TABS = [
  { id: 'todo', path: '/todo', label: '行前待辦' },
  { id: 'flight', path: '/todo/flight', label: '班機' },
  { id: 'entry', path: '/todo/entry', label: '入國登記' },
  { id: 'stay', path: '/todo/stay', label: '住宿' },
  { id: 'bag', path: '/todo/bag', label: '行李' }
];

export const ENTRY_STEPS = ['建立帳號並登入', '登錄本人（及同行家人）護照資料', '登錄入境、回國預定', '填寫入境審查與海關申報', '取得 QR Code 並截圖保存'];
