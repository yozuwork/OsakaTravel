import { useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { modal, useModalStore } from '../../stores/modalStore';
import { ModalContext } from './ModalContext';
import Icon from '../common/Icon';
import Button from '../common/Button';

/** 放在 App 最外層一次即可，負責渲染所有彈出視窗 */
export default function ModalRoot() {
  const stack = useModalStore((s) => s.stack);

  useEffect(() => {
    document.body.style.overflow = stack.length ? 'hidden' : '';
  }, [stack.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (e.target.closest?.('.MuiDialog-root')) return; // MUI 選擇器自己處理 Esc

      const top = useModalStore.getState().stack.at(-1);
      if (top?.dismissible) modal.close(top.id);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return createPortal(
    stack.map((m, i) => <Modal key={m.id} entry={m} z={40 + i * 2} />),
    document.body
  );
}

function Modal({ entry, z }) {
  const { id, title, content, variant, dismissible, confirm } = entry;
  const ref = useRef(null);
  const close = useCallback(() => modal.close(id), [id]);
  const ctx = useMemo(() => ({ id, close }), [id, close]);
  const titleId = `modal-title-${id}`;
  const isConfirm = variant === 'confirm';

  // 開啟時聚焦第一個欄位，關閉後把焦點還給原本的按鈕
  useEffect(() => {
    const prev = document.activeElement;
    const t = setTimeout(() => {
      const el = ref.current?.querySelector('.sheet__body input, .sheet__body select, .sheet__body textarea, .sheet__body button');
      el?.focus();
    }, 50);
    return () => { clearTimeout(t); prev?.focus?.(); };
  }, []);

  return (
    <ModalContext.Provider value={ctx}>
      <div className="sheet-backdrop" style={{ zIndex: z }} onClick={dismissible ? close : undefined} />
      <section ref={ref} className={'sheet' + (isConfirm ? ' sheet--dialog' : '')} style={{ zIndex: z + 1 }}
        role={isConfirm ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby={titleId}>
        {!isConfirm && <div className="sheet__handle" />}
        <div className="sheet__head">
          <h2 className="sheet__title" id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={close} aria-label="關閉"><Icon name="x" /></button>
        </div>
        <div className="sheet__body">
          {isConfirm ? <ConfirmBody {...confirm} onCancel={close} /> : content}
        </div>
      </section>
    </ModalContext.Provider>
  );
}

function ConfirmBody({ message, confirmText, cancelText, danger, resolve, onCancel }) {
  return (
    <>
      <p className="confirm__msg">{message}</p>
      <div className="confirm__actions">
        <Button onClick={onCancel}>{cancelText}</Button>
        <Button variant={danger ? 'danger-fill' : 'primary'} onClick={() => { resolve(true); onCancel(); }}>{confirmText}</Button>
      </div>
    </>
  );
}
