import { create } from 'zustand';

/* =========================================================
   本機設定（存在這台裝置的瀏覽器 localStorage，不跟帳號同步）
   開啟畫面在登入、雲端資料載入前就要用到，所以不能放在行程資料裡
   ========================================================= */

const KEY = 'osaka-settings';

export const DEFAULT_SETTINGS = {
  splashMs: 1200,          // 開啟畫面至少停留多久（毫秒，從頁面開始載入算起）
  splashFirstOnly: false,  // true：只有第一次打開停 splashMs，之後用預設 1.2 秒
  dialogueAutoplay: true   // 開啟畫面消失後自動播放角色對話
};

function load() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export const useSettingsStore = create(() => load());

/** 讀目前設定（非 React 程式用） */
export const getSettings = () => useSettingsStore.getState();

/** 更新設定並存到 localStorage */
export function setSettings(patch) {
  useSettingsStore.setState(patch);
  try {
    localStorage.setItem(KEY, JSON.stringify(useSettingsStore.getState()));
  } catch { /* 無痕模式等無法儲存時，只在這次使用中生效 */ }
}
