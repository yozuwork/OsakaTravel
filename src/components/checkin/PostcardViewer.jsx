import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { modal } from '../../stores/modalStore';
import { toast } from '../../stores/uiStore';
import { cardsOf, removeCard, saveCard, useCheckinStore } from '../../features/checkin/checkinStore';
import { LAYOUTS, layoutOf } from '../../features/checkin/layouts';
import { renderCard, toRecord } from '../../features/checkin/postcard';
import { nextFrame, pad } from '../../features/checkin/photo';
import { cx } from '../../utils/helpers';
import Icon from '../common/Icon';
import BlobImg from './BlobImg';

const GROUPS = [
  { id: 'photo', label: '照片' },
  { id: 'art', label: '插畫' }
];

/**
 * 明信片預覽與編輯（換版型；已收進的明信片改了會直接存）
 * @param {object} p
 * @param {import('../../features/checkin/postcard').PostcardDraft} p.draft
 * @param {(style: string) => void} p.onStyle 記住上次選的版型
 * @param {() => void} p.onRetake 重拍／再拍一張
 * @param {() => void} p.onClose
 */
export default function PostcardViewer({ draft, onStyle, onRetake, onClose }) {
  const [d, setD] = useState(draft);
  const [busy, setBusy] = useState(false);
  const dRef = useRef(d);
  dRef.current = d;
  const allCards = useCheckinStore((s) => s.cards);
  const siblings = useMemo(() => cardsOf(allCards, d.itemId), [allCards, d.itemId]);
  const idx = siblings.findIndex((r) => r.id === d.id);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /** 改設定後重畫；rebuild：版型／方向／留言變了，底圖要重畫 */
  async function update(patch, rebuild) {
    const next = { ...dRef.current, ...patch, ...(rebuild && { base: null }) };
    setD(next);
    setBusy(true);
    await nextFrame();
    const out = await renderCard(next);
    const done = { ...next, ...out, ...(next.saved && { at: Date.now() }) };
    setD(done);
    setBusy(false);
    if (done.saved) await saveCard(toRecord(done));
  }

  async function collect() {
    if (!d.saved) {
      await saveCard(toRecord(d));
      toast(`第 ${d.stop.no} 站已收進 ${siblings.length + 1} 張`);
    }
    onClose();
  }

  async function remove() {
    if (!await modal.confirm({ message: '確定刪除這張明信片？' })) return;
    await removeCard(d.id);
    toast('已刪除');
    onClose();
  }

  const layout = layoutOf(d.style);

  return createPortal(
    <section className="ck-ov ck-view" aria-label="明信片">
      <div className="ck-view__in">
        <div className="ck-view__top">
          <div>
            <b>STAGE {pad(d.stop.no)}・{d.stop.title}</b>
            <div className="ck-view__count">
              {d.saved ? `這站第 ${idx + 1} / ${siblings.length} 張` : `這站第 ${siblings.length + 1} 張（尚未收進）`}
            </div>
          </div>
          <button type="button" className="ck-icon" onClick={onClose} aria-label="關閉"><Icon name="x" /></button>
        </div>

        <div className={cx('ck-card', d.orient === 'land' && 'is-land', busy && 'is-busy')}>
          <BlobImg blob={d.card} alt={`${d.stop.title} 的${layout.name}明信片`} />
        </div>

        <div className="ck-opts">
          {GROUPS.map((grp) => {
            const list = LAYOUTS.filter((l) => l.group === grp.id);
            if (!list.length) return null;
            return (
              <div key={grp.id} className="ck-opts__grp">
                <span className="ck-opts__label">{grp.label}</span>
                <div className="ck-chips" role="group" aria-label={`${grp.label}版型`}>
                  {list.map((l) => (
                    <button key={l.id} type="button" className="ck-chip" aria-pressed={l.id === d.style} disabled={busy}
                      onClick={() => { if (l.id !== d.style) { onStyle(l.id); update({ style: l.id }, true); } }}>
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="ck-acts">
          <button type="button" className="ck-btn" onClick={onRetake}><Icon bi="camera" />{d.saved ? '再拍一張' : '重拍'}</button>
          <button type="button" className="ck-btn is-red" onClick={collect} disabled={busy}>{d.saved ? '完成' : '收進明信片集'}</button>
        </div>
        {d.saved && <button type="button" className="ck-btn is-ghost" onClick={remove}>刪除這張</button>}
      </div>
    </section>,
    document.body
  );
}
