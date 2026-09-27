import { useEffect, useRef, useState } from 'react';
import { cx } from '../../utils/helpers';
import { toast } from '../../stores/uiStore';

/**
 * 共用按鈕（內建 loading）
 * - variant: 'primary' | 'danger' | 'dashed'
 * - size: 'sm'；block：滿版
 * - loading：外部控制的 loading
 * - onClick 回傳 Promise 時，會自動顯示 loading 並防止重複點擊
 */
export default function Button({
  variant, size, block, loading = false, loadingText, disabled,
  type = 'button', className, onClick, children, ...rest
}) {
  const [pending, setPending] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const busy = loading || pending;

  async function handleClick(e) {
    if (busy) { e.preventDefault(); return; }
    const result = onClick?.(e);
    if (result && typeof result.then === 'function') {
      setPending(true);
      try {
        await result;
      } catch (err) {
        console.error(err);
        toast(err?.message || '發生錯誤，請再試一次');
      } finally {
        if (mounted.current) setPending(false);
      }
    }
  }

  return (
    <button
      type={type}
      className={cx('btn', variant && `btn--${variant}`, size && `btn--${size}`, block && 'btn--block', busy && 'is-loading', className)}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      onClick={handleClick}
      {...rest}
    >
      {busy && <span className="spinner" aria-hidden="true" />}
      {busy && loadingText ? loadingText : children}
    </button>
  );
}
