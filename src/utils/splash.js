/* =========================================================
   開啟畫面（index.html 的 #splash）
   確認登入狀態後淡出移除；停留時間在「設定」裡調整（settingsStore.js）
   ========================================================= */
import { DEFAULT_SETTINGS, getSettings } from '../stores/settingsStore';

const FADE_MS = 500;            // 和 index.html 的 transition 一致
const SEEN_KEY = 'splashSeen';  // 記住這台裝置看過開啟畫面

let resolveGone;
/** 開啟畫面完全消失後 resolve（角色對話等它結束才自動播放） */
export const splashGone = new Promise((r) => { resolveGone = r; });

/** 這次要停多久：設定成「只有第一次」時，看過之後改用預設 1.2 秒 */
function minMs() {
  const { splashMs, splashFirstOnly } = getSettings();
  if (!splashFirstOnly) return splashMs;
  try {
    if (localStorage.getItem(SEEN_KEY)) return DEFAULT_SETTINGS.splashMs;
    localStorage.setItem(SEEN_KEY, '1');
  } catch { /* 讀不到時當作第一次 */ }
  return splashMs;
}

/** 清掉「看過」紀錄，下次打開會再停一次設定的秒數 */
export function resetSplashSeen() {
  try { localStorage.removeItem(SEEN_KEY); } catch { /* 略過 */ }
}

let hiding = false;

export function hideSplash() {
  if (hiding) return;
  hiding = true;
  const el = document.getElementById('splash');
  if (!el) { resolveGone(); return; }

  setTimeout(() => {
    el.classList.add('is-hidden');
    // 減少動態效果時沒有 transition，所以用計時器收尾，不依賴 transitionend
    setTimeout(() => { el.remove(); resolveGone(); }, FADE_MS);
  }, Math.max(0, minMs() - performance.now()));
}
