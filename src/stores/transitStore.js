/* =========================================================
   交通頁狀態：出發／抵達站、偏好、最近查詢
   最近查詢只存在這台裝置的 localStorage（不同步 Firebase）
   ========================================================= */
import { create } from 'zustand';

const RECENT_KEY = 'travel-planner:transit-recent';
const RECENT_MAX = 5;

function loadRecent() {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(list) ? list.filter((x) => x?.from && x?.to).slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function saveRecent(list) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* 無痕模式等情況存不了，不影響查詢 */ }
}

export const useTransitStore = create(() => ({
  from: '関西空港',
  to: '心斎橋',
  fewTransfers: false,
  /** 切到路線查詢頁時要自動打開的選站面板：'from' | 'to' | null */
  pendingPick: null,
  recent: loadRecent()
}));

const set = useTransitStore.setState;

/** 出發、抵達都選好時記進最近查詢 */
function remember() {
  const { from, to, recent } = useTransitStore.getState();
  if (!from || !to || from === to) return;
  const next = [{ from, to }, ...recent.filter((x) => !(x.from === from && x.to === to))].slice(0, RECENT_MAX);
  set({ recent: next });
  saveRecent(next);
}

export const transit = {
  setStation(which, station) {
    set({ [which]: station });
    remember();
  },
  setRoute(from, to) {
    set({ from, to });
    remember();
  },
  swap() {
    const { from, to } = useTransitStore.getState();
    set({ from: to, to: from });
    remember();
  },
  setFewTransfers(v) { set({ fewTransfers: v }); },
  /** 機場頁：設好出發站，回到路線查詢時自動開啟抵達站面板 */
  startFrom(station) { set({ from: station, to: null, pendingPick: 'to' }); },
  clearPendingPick() { set({ pendingPick: null }); }
};
