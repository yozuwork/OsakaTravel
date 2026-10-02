/* =========================================================
   開啟畫面（index.html 的 #splash）
   確認登入狀態後淡出移除；至少顯示 MIN_MS，避免一閃而過
   ========================================================= */

const MIN_MS = 1200;  // 從頁面開始載入算起，至少顯示多久
const FADE_MS = 500;  // 和 index.html 的 transition 一致

let resolveGone;
/** 開啟畫面完全消失後 resolve（角色對話等它結束才自動播放） */
export const splashGone = new Promise((r) => { resolveGone = r; });

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
  }, Math.max(0, MIN_MS - performance.now()));
}
