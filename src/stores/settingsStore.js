import { create } from 'zustand';
import { onValue, ref, set, update } from 'firebase/database';
import { database, databasePath } from '../services/firebase';
import { toast } from './uiStore';

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

function saveLocal() {
  const s = getSettings();
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // 空間不夠（圖片太大）時先不存圖片，其他設定照存；開啟畫面會用內建圖片
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...s, splashMobile: '', splashDesktop: '' }));
    } catch { /* 無痕模式等無法儲存時，只在這次使用中生效 */ }
  }
}

/* ---------- Firebase 雲端同步 ---------- */
let settingsRef = null;   // 登入後才有：osakaTravelSettings/{uid}
let stopCloudListener;
let pendingPatch = {};
let activeUid = null;
let awaitingSnapshot = false;
export const useSettingsSyncStore = create(() => ({ ready: false }));

/** 寫到雲端：給 patch 時只更新那幾個欄位（圖片很大，切換開關時不要整包重傳） */
function saveToCloud(patch) {
  if (!settingsRef) return;
  const job = patch ? update(settingsRef, patch) : set(settingsRef, pick(getSettings()));
  job.catch(() => {
    toast('設定雲端儲存失敗，已先保存在此裝置');
  });
}

/** 更新設定：存到本機快取，登入中也寫到雲端 */
export function setSettings(patch) {
  useSettingsStore.setState(patch);
  saveLocal();
  if (activeUid && awaitingSnapshot) {
    pendingPatch = { ...pendingPatch, ...patch };
    return;
  }
  saveToCloud(patch);
}

/** 登入後開始同步：雲端有資料以雲端為準；沒有就用本機設定建立 */
export function startSettingsSync(uid) {
  if (activeUid === uid) return;
  stopSettingsSync();
  activeUid = uid;
  const cloudRef = ref(database, `${databasePath}Settings/${uid}`);
  settingsRef = cloudRef;
  awaitingSnapshot = true;
  let firstSnapshot = true;

  stopCloudListener = onValue(
    cloudRef,
    (snapshot) => {
      if (activeUid !== uid) return;
      awaitingSnapshot = false;
      settingsRef = cloudRef;
      const queued = pendingPatch;
      pendingPatch = {};
      if (snapshot.exists()) {
        useSettingsStore.setState({ ...pick(snapshot.val()), ...queued });
        saveLocal();
        if (Object.keys(queued).length) saveToCloud(queued);
      } else if (firstSnapshot) {
        saveToCloud();
      }
      firstSnapshot = false;
      useSettingsSyncStore.setState({ ready: true });
    },
    () => {
      if (activeUid !== uid) return;
      awaitingSnapshot = false;
      if (Object.keys(pendingPatch).length) {
        const queued = pendingPatch;
        pendingPatch = {};
        saveToCloud(queued);
      }
      toast('設定無法從雲端讀取，已改用此裝置的設定');
    }
  );
}

/** 登出時停止同步 */
export function stopSettingsSync() {
  stopCloudListener?.();
  stopCloudListener = undefined;
  settingsRef = null;
  activeUid = null;
  awaitingSnapshot = false;
  pendingPatch = {};
  useSettingsSyncStore.setState({ ready: false });
}
