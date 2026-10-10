import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../common/Icon';

/**
 * 匯出 PDF 前的預覽：A4 頁面圖片＋下載按鈕（blob 還在產生時按鈕顯示「產生中」）
 * @param {{ pages: string[], blob: Blob|null }} p.pdf
 */
export default function PdfPreview({ pdf, filename, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function download() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(pdf.blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  return createPortal(
    <section className="ck-ov ck-view" aria-label="PDF 預覽">
      <div className="ck-view__in">
        <div className="ck-view__top">
          <div><b>今日打卡紀錄</b><div className="ck-view__count">共 {pdf.pages.length} 頁 · A4</div></div>
          <button type="button" className="ck-icon" onClick={onClose} aria-label="關閉"><Icon name="x" /></button>
        </div>
        <div className="ck-pdfpages">
          {pdf.pages.map((u, i) => <img key={i} src={u} alt={`第 ${i + 1} 頁`} />)}
        </div>
        <div className="ck-acts">
          <button type="button" className="ck-btn is-red" disabled={!pdf.blob} onClick={download}>
            <Icon bi="download" />{pdf.blob ? '下載 PDF' : '產生中…'}
          </button>
        </div>
      </div>
    </section>,
    document.body
  );
}
