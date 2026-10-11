/* =========================================================
   交通頁狀態：出發／抵達站、偏好、最近查詢
   站點、偏好與最近查詢存到 Firebase（每個帳號一份）
   ========================================================= */
import { create } from 'zustand';
import { createCloudSync } from '../services/cloudSync';
import { databasePath } from '../services/firebase';
import { readCloudCache, writeCloudCache } from '../services/cloudCache';

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

const transitSync = createCloudSync({
  name: 'transit', store: useTransitStore,
  select: ({ from, to, fewTransfers, recent }) => ({ from, to, fewTransfers, recent }),
  normalize: (data) => ({ from: data.from ?? '関西空港', to: data.to ?? '心斎橋', fewTransfers: Boolean(data.fewTransfers), recent: data.recent || [] }),
  apply: (data) => set(data),
  async migrate(path) {
    if (await readCloudCache(`legacy-transit-migrated:${path}`)) return null;
    return { recent: loadRecent() };
  },
  onMigrated: (path) => writeCloudCache(`legacy-transit-migrated:${path}`, true)
});
export const startTransitSync = (uid) => transitSync.start(`${databasePath}Transit/${uid}`);
export function stopTransitSync() {
  transitSync.stop();
  set({ from: '関西空港', to: '心斎橋', fewTransfers: false, recent: [], pendingPick: null });
}
