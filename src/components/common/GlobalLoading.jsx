import { useLoading } from '../../stores/uiStore';

/** 全局 Loading 遮罩：由 loading.show() / loading.run() 控制 */
export default function GlobalLoading() {
  const { count, text } = useLoading();
  if (!count) return null;
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-box">
        <span className="spinner spinner--lg" aria-hidden="true" />
        <span>{text || '處理中…'}</span>
      </div>
    </div>
  );
}

/** 頁面切換（lazy load）時的區塊 loading */
export function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="spinner spinner--lg" aria-hidden="true" />
      <span className="small muted">載入中…</span>
    </div>
  );
}
