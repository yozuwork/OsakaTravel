import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { modal } from '../../stores/modalStore';
import { toast } from '../../stores/uiStore';
import { cardsOf, removeCard, saveCard, useCheckinStore } from '../../features/checkin/checkinStore';
import { COMPOSE, STAMPS, STYLE_NAME, pad, renderCard, stampCanvas } from '../../features/checkin/engine';
import { cx } from '../../utils/helpers';
import Icon from '../common/Icon';
import BlobImg from './BlobImg';
import { StampIcon } from './StopRow';

/* 版型清單（照片類在前，預設經典拍立得）；名稱太長的用短的 */
export const PHOTO_STYLES = ['polaroid', 'horizon', 'kraft', 'doodle', 'clip', 'vintage', 'retro'];
export const ILLUST_STYLES = ['split', 'splitink', 'ink'];
export const DEFAULT_STYLE = 'polaroid';
const SHORT = { vintage: '老派雙面', retro: '復古雙面', split: '照片＋像素 16 色', splitink: '照片＋藍墨', ink: '藍墨漫畫封面' };
const styleLabel = (k) => SHORT[k] || STYLE_NAME[k];
const ORIENTS = [['port', '直式'], ['land', '橫式']];
const MSG_MAX = 40;

/** 明信片紀錄（存進 IndexedDB 的欄位） */
export const toRecord = (d) => ({
  id: d.id, itemId: d.itemId, style: d.style, orient: d.orient, msg: d.msg, stamps: d.stamps, photo: d.photo, card: d.card, at: d.at
});

/** 依草稿畫出明信片 JPEG（版型＋印章；照片效果在 engine 裡依照片快取） */
export const drawCard = (d) => renderCard({ src: d.photoCanvas, stop: d.stop, style: d.style, orient: d.orient, msg: d.msg, stamps: d.stamps });

export const knownStyle = (k) => (COMPOSE[k] ? k : DEFAULT_STYLE);

function saveBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/**
 * 明信片預覽與編輯：換版型、直式／橫式、留言、蓋章；已收進的明信片改了會直接存
 * @param {object} p
 * @param {object} p.draft { id, itemId, stop, photoCanvas, photo, style, orient, msg, stamps, card, saved, at }
 * @param {(patch: { style?, orient? }) => void} p.onRemember 記住上次選的版型、方向
 * @param {() => void} p.onRetake 重拍／再拍一張
 * @param {() => void} p.onClose
 */
export default function PostcardViewer({ draft, onRemember, onRetake, onClose }) {
  const [d, setD] = useState(draft);
  const [busy, setBusy] = useState(false);
  const [stamping, setStamping] = useState(false);
  const [design, setDesign] = useState('post');
  const [msg, setMsg] = useState(draft.msg || '');
  const dRef = useRef(d);
  const msgTimer = useRef(0);
  const allCards = useCheckinStore((s) => s.cards);
  const siblings = useMemo(() => cardsOf(allCards, d.itemId), [allCards, d.itemId]);
  const idx = siblings.findIndex((r) => r.id === d.id);
  // 印章選單的預覽用現在時間；打開蓋章模式時重畫
  const choices = useMemo(() => STAMPS.map((s) => ({
    ...s, url: stampCanvas(s.id, { at: Date.now(), title: d.stop.title, no: d.stop.no }, 140).toDataURL()
  })), [d.stop, stamping]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => () => clearTimeout(msgTimer.current), []);

  /** 改設定後重畫；已收進的直接存 */
  async function update(patch) {
    const next = { ...dRef.current, ...patch };
    dRef.current = next;
    setD(next);
    setBusy(true);
    const card = await drawCard(next);
    if (dRef.current !== next) return; // 已經有更新的修改在畫了
    const done = { ...next, card, ...(next.saved && { at: Date.now() }) };
    dRef.current = done;
    setD(done);
    setBusy(false);
    if (done.saved) await saveCard(toRecord(done));
  }

  function onMsg(e) {
    const v = [...e.target.value].slice(0, MSG_MAX).join('');
    setMsg(v);
    clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => update({ msg: v }), 450); // 打字停一下才重畫
  }

  /** 蓋章模式：點明信片任一處蓋下去；位置存相對座標，離邊緣留一點空間 */
  function onCardClick(e) {
    if (!stamping) return;
    const r = e.currentTarget.getBoundingClientRect(), land = d.orient === 'land';
    const clamp = (v, m) => Math.min(1 - m, Math.max(m, v));
    const st = {
      design, x: clamp((e.clientX - r.left) / r.width, land ? 0.09 : 0.12), y: clamp((e.clientY - r.top) / r.height, land ? 0.13 : 0.09),
      rot: (Math.random() - 0.5) * 0.55, at: Date.now()
    };
    navigator.vibrate?.(18);
    update({ stamps: [...dRef.current.stamps, st] });
  }

  function pickStyle(k) {
    if (k === d.style) return;
    onRemember({ style: k });
    update({ style: k });
  }

  function pickOrient(k) {
    if (k === d.orient) return;
    onRemember({ orient: k });
    update({ orient: k });
  }

  async function collect() {
    setStamping(false);
    // 留言還在等重畫：先畫進去再存
    clearTimeout(msgTimer.current);
    if (msg !== dRef.current.msg) await update({ msg });
    if (!dRef.current.saved) {
      await saveCard(toRecord(dRef.current));
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

  const styleChips = (list) => list.map((k) => (
    <button key={k} type="button" className="ck-chip" aria-pressed={d.style === k} onClick={() => pickStyle(k)}>{styleLabel(k)}</button>
  ));

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

        <div className={cx('ck-card', d.orient === 'land' && 'is-land', busy && 'is-busy', stamping && 'is-stamping')}>
          <BlobImg blob={d.card} alt={`${d.stop.title} 的${STYLE_NAME[d.style]}明信片`} onClick={onCardClick} />
        </div>

        {stamping && (
          <div className="ck-stampbar">
            <span className="ck-stampbar__hint">選一個印章，點明信片任一處蓋下去</span>
            <div className="ck-stampbar__row">
              {choices.map((s) => (
                <button key={s.id} type="button" className="ck-stampchip" aria-label={s.name} aria-pressed={design === s.id} onClick={() => setDesign(s.id)}>
                  <img src={s.url} alt="" draggable="false" />
                </button>
              ))}
            </div>
            <div className="ck-stampbar__row">
              <button type="button" className="ck-btn is-ghost" disabled={!d.stamps.length} onClick={() => update({ stamps: d.stamps.slice(0, -1) })}>復原上一個</button>
              <button type="button" className="ck-btn" onClick={() => setStamping(false)}>蓋好了</button>
            </div>
          </div>
        )}

        <div className="ck-msg">
          <label htmlFor="ck-msg">寫在明信片上</label>
          <textarea id="ck-msg" rows={2} maxLength={MSG_MAX} placeholder={`寫幾句話…（最多 ${MSG_MAX} 字）`} value={msg} onChange={onMsg} />
          <span className="ck-msg__count">{[...msg].length} / {MSG_MAX}</span>
        </div>

        <div className="ck-opts">
          <span className="ck-opts__label">照片</span>
          <div className="ck-chips" role="group" aria-label="照片版型">{styleChips(PHOTO_STYLES)}</div>
          <span className="ck-opts__label">插畫</span>
          <div className="ck-chips" role="group" aria-label="插畫版型">{styleChips(ILLUST_STYLES)}</div>
          <div className="ck-chips" role="group" aria-label="方向">
            {ORIENTS.map(([k, t]) => (
              <button key={k} type="button" className="ck-chip is-sm" aria-pressed={d.orient === k} onClick={() => pickOrient(k)}>{t}</button>
            ))}
          </div>
        </div>

        <div className="ck-acts">
          <button type="button" className="ck-btn" onClick={onRetake}><Icon bi="camera" />{d.saved ? '再拍一張' : '重拍'}</button>
          <button type="button" className={cx('ck-btn', stamping && 'is-on')} onClick={() => setStamping((v) => !v)}><StampIcon />蓋章</button>
          <button type="button" className="ck-btn" disabled={!d.card}
            onClick={() => saveBlob(d.card, `postcard-${pad(d.stop.no)}-${d.stop.title}-${d.orient === 'land' ? '橫' : '直'}.jpg`)}>
            <Icon bi="download" />存到手機
          </button>
          <button type="button" className="ck-btn is-red" onClick={collect} disabled={busy}>{d.saved ? '完成' : '收進明信片集'}</button>
        </div>
        {d.saved && <button type="button" className="ck-btn is-ghost" onClick={remove}>刪除這張</button>}
      </div>
    </section>,
    document.body
  );
}
