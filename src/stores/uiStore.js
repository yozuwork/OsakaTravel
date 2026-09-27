/* =========================================================
   共用 UI 狀態：Toast、全局 Loading
   任何地方（元件內外）都可以直接呼叫 toast() / loading.xxx()
   ========================================================= */
import { create } from 'zustand';

export const useUiStore = create(() => ({
  toast: { msg: '', show: false },
  loading: { count: 0, text: '' }
}));

/* ---------- Toast ---------- */
let toastTimer;
export function toast(msg) {
  useUiStore.setState({ toast: { msg, show: true } });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    useUiStore.setState((s) => ({ toast: { ...s.toast, show: false } }));
  }, 2200);
}

/* ---------- 全局 Loading（計數制，多個任務同時進行也不會提早關閉） ---------- */
export const loading = {
  show(text = '處理中…') {
    useUiStore.setState((s) => ({ loading: { count: s.loading.count + 1, text } }));
  },
  hide() {
    useUiStore.setState((s) => ({ loading: { ...s.loading, count: Math.max(0, s.loading.count - 1) } }));
  },
  /** 包住一個 Promise 或 async 函式，期間顯示全局 Loading */
  async run(task, text) {
    loading.show(text);
    try {
      return await (typeof task === 'function' ? task() : task);
    } finally {
      loading.hide();
    }
  }
};

/** 在元件中讀取全局 Loading 狀態 */
export const useLoading = () => useUiStore((s) => s.loading);
