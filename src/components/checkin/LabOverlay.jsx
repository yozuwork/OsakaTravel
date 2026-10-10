import { createPortal } from 'react-dom';

/** 「沖洗中…」等待畫面 */
export default function LabOverlay({ text = '沖洗中…' }) {
  return createPortal(
    <section className="ck-ov ck-lab" aria-live="polite">
      <div className="ck-lab__tray" />
      <b>{text}</b>
    </section>,
    document.body
  );
}
