/* =========================================================
   共用彈出視窗（可堆疊）
   - modal.open({ title, content })      一般底部彈出表單（桌機為置中對話框）
   - modal.close(id?)                     關閉指定或最上層
   - modal.closeAll()
   - await modal.confirm({ message })    取代 window.confirm，回傳 true / false
   content 內的元件可用 useModalContext() 取得 close()
   ========================================================= */
import { create } from 'zustand';

let seq = 0;

export const useModalStore = create(() => ({ stack: [] }));

export const modal = {
  open({ title = '', content = null, variant = 'sheet', dismissible = true, onClose, confirm } = {}) {
    const id = ++seq;
    useModalStore.setState((s) => ({ stack: [...s.stack, { id, title, content, variant, dismissible, onClose, confirm }] }));
    return id;
  },

  close(id) {
    const { stack } = useModalStore.getState();
    const target = id == null ? stack[stack.length - 1] : stack.find((m) => m.id === id);
    if (!target) return;
    useModalStore.setState({ stack: stack.filter((m) => m !== target) });
    target.onClose?.();
  },

  closeAll() {
    const { stack } = useModalStore.getState();
    useModalStore.setState({ stack: [] });
    stack.forEach((m) => m.onClose?.());
  },

  confirm({ title = '請確認', message = '確定要刪除嗎？', confirmText = '確定', cancelText = '取消', danger = true } = {}) {
    return new Promise((resolve) => {
      let settled = false;
      const settle = (v) => { if (!settled) { settled = true; resolve(v); } };
      modal.open({
        title,
        variant: 'confirm',
        confirm: { message, confirmText, cancelText, danger, resolve: settle },
        onClose: () => settle(false)
      });
    });
  }
};
