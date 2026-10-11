import { create } from 'zustand';
import { databasePath } from '../services/firebase';
import { createCloudSync } from '../services/cloudSync';

/* =========================================================
   使用者設定：存到 Firebase（每個帳號一份），localStorage 當快取
   開啟畫面在登入、雲端資料載入前就要用到，所以先讀本機快取；
   登入後以雲端為準並寫回快取，下次打開就會套用
   ========================================================= */

const KEY = 'osaka-settings';

export const DEFAULT_SETTINGS = {
  splashMs: 1200,          // 開啟畫面至少停留多久（毫秒，從頁面開始載入算起）
  splashFirstOnly: false,  // true：只有第一次打開停 splashMs，之後用預設 1.2 秒
  dialogueAutoplay: true,  // 開啟畫面消失後自動播放角色對話
  splashMobile: '',        // 自訂開啟畫面（直式，data URL）；空字串＝內建圖片
  splashDesktop: ''        // 自訂開啟畫面（橫式）；index.html 在 JS 載入前就讀這兩個
};

/** 只留認得的欄位，缺的補預設值 */
function pick(saved) {
  const next = { ...DEFAULT_SETTINGS };
  for (const k of Object.keys(DEFAULT_SETTINGS)) {
    if (typeof saved?.[k] === typeof DEFAULT_SETTINGS[k]) next[k] = saved[k];
  }
  return next;
}

function load() {
  try {
    return pick(JSON.parse(localStorage.getItem(KEY) || '{}'));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export const useSettingsStore = create(() => load());

/** 讀目前設定（非 React 程式用） */
export const getSettings = () => useSettingsStore.getState();

// Only small startup preferences are cached in localStorage. Images live in Firebase.
function saveLocal() {
  const { splashMobile, splashDesktop, ...preferences } = getSettings();
  try { localStorage.setItem(KEY, JSON.stringify(preferences)); } catch { /* optional cache */ }
}
export const useSettingsSyncStore = create(() => ({ ready: false }));
const settingsSync = createCloudSync({
  name: 'settings', store: useSettingsStore, normalize: pick,
  apply: (state) => { useSettingsStore.setState(state, true); saveLocal(); },
  onReady: (ready) => useSettingsSyncStore.setState({ ready })
});
export function setSettings(patch) {
  useSettingsStore.setState(patch);
  saveLocal();
}
export const startSettingsSync = (uid) => settingsSync.start(databasePath + 'Settings/' + uid);
export function stopSettingsSync() {
  const wasReady = useSettingsSyncStore.getState().ready;
  settingsSync.stop();
  if (wasReady) useSettingsStore.setState({ ...DEFAULT_SETTINGS }, true);
}
