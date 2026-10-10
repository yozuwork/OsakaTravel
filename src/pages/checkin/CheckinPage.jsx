import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTripStore, updateTrip } from '../../stores/tripStore';
import { modal } from '../../stores/modalStore';
import { toast } from '../../stores/uiStore';
import { addDays, mdw } from '../../utils/date';
import { dayItems } from '../../utils/itinerary';
import { uid } from '../../utils/helpers';
import { cardsOf, loadCheckin, saveCard, stampStop, unstampStop, useCheckinStore } from '../../features/checkin/checkinStore';
import { buildReport, canvasBlob, fmtTime, loadFonts, pad, pagesToPdf, setTrip } from '../../features/checkin/engine';
import { blobToPhotoCanvas, nextFrame, toStop, toTripInfo } from '../../features/checkin/photo';
import Icon from '../../components/common/Icon';
import StopRow from '../../components/checkin/StopRow';
import CameraSheet from '../../components/checkin/CameraSheet';
import LabOverlay from '../../components/checkin/LabOverlay';
import PostcardViewer, { DEFAULT_STYLE, drawCard, knownStyle, toRecord } from '../../components/checkin/PostcardViewer';
import PostcardAlbum from '../../components/checkin/PostcardAlbum';
import PdfPreview from '../../components/checkin/PdfPreview';

/* =========================================================
   打卡：每站蓋章、拍照，照片沖洗成明信片，可匯出當天的 A4 PDF
   - 影像、版型、印章、PDF：features/checkin/engine.js（checkin-module-v1 原檔）
   - 明信片只存這台裝置的 IndexedDB；行程蓋章同步到 Firebase
   ========================================================= */

const DEVELOP_MS = 900; // 沖洗畫面至少停留，看得到動畫

export default function CheckinPage() {
  const trip = useTripStore((s) => s.trip);
  const allItems = useTripStore((s) => s.items);
  const uiDay = useTripStore((s) => s.ui.day);
  const day = Math.min(uiDay, trip.days - 1);
  const setDay = (i) => updateTrip((s) => { s.ui.day = i; }); // 和行程頁、地圖共用選到的日期

  const cards = useCheckinStore((s) => s.cards);
  const stamps = useCheckinStore((s) => s.stamps);
  useEffect(() => { loadCheckin(); loadFonts(); }, []);

  // engine 的版型、PDF 會印上旅程名稱與日期
  const tripInfo = useMemo(() => toTripInfo(trip, day), [trip, day]);
  setTrip(tripInfo);

  const stops = useMemo(() => dayItems(allItems, day).map((item, i) => ({
    item, stop: toStop(item, i, stamps[item.id]), cards: cardsOf(cards, item.id), stamp: stamps[item.id]
  })), [allItems, day, cards, stamps]);
  const stampedCount = stops.filter((s) => s.stamp).length;
  const totalCards = stops.reduce((n, s) => n + s.cards.length, 0);

  const [camFor, setCamFor] = useState(null);   // 開著相機的站（itemId）
  const [busy, setBusy] = useState('');         // 沖洗中／排版中
  const [draft, setDraft] = useState(null);     // 預覽中的明信片
  const [pdf, setPdf] = useState(null);         // { pages: dataURL[], blob }
  const [justStamped, setJustStamped] = useState(null);
  const last = useRef({ style: DEFAULT_STYLE, orient: 'port' }); // 沿用上次選的版型與方向（預設直式）

  const stopOf = (itemId) => stops.find((s) => s.item.id === itemId);

  async function onStamp({ item, stop }) {
    const rec = await stampStop(item.id);
    setJustStamped(item.id);
    toast(`${stop.title} ${fmtTime(rec.at)} 打卡`);
  }

  async function onUnstamp({ item, stop }) {
    if (!await modal.confirm({ message: `取消「${stop.title}」的打卡章？`, confirmText: '取消打卡', cancelText: '保留' })) return;
    await unstampStop(item.id);
  }

  /** 清掉這天所有的行程蓋章（明信片不受影響） */
  async function clearStamps() {
    const ids = stops.filter((s) => s.stamp).map((s) => s.item.id);
    if (!await modal.confirm({ message: `清除 DAY ${day + 1} 的 ${ids.length} 個打卡章？明信片不會被刪除。`, confirmText: '清除' })) return;
    await unstampStop(...ids);
    toast('已清除打卡章');
  }

  /** 拍好 → 沖洗 → 預覽 */
  const develop = useCallback(async (photoCanvas) => {
    const s = stops.find((x) => x.item.id === camFor);
    setCamFor(null);
    if (!s) return;
    setBusy('沖洗中…');
    await nextFrame();
    const t0 = performance.now();
    const d = {
      id: uid(), itemId: s.item.id, stop: s.stop, photoCanvas, photo: await canvasBlob(photoCanvas),
      style: last.current.style, orient: last.current.orient, msg: '', stamps: [], card: null, saved: false, at: Date.now()
    };
    d.card = await drawCard(d);
    const wait = DEVELOP_MS - (performance.now() - t0);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    setBusy('');
    setDraft(d);
  }, [stops, camFor]);

  /** 打開已收進的明信片 */
  async function openCard(rec, s) {
    const d = { ...rec, stop: s.stop, photoCanvas: await blobToPhotoCanvas(rec.photo), saved: true, style: knownStyle(rec.style) };
    // 版型已經不存在（舊資料）：換成預設版型重畫並存起來
    if (d.style !== rec.style) {
      d.card = await drawCard(d);
      await saveCard(toRecord(d));
    }
    setDraft(d);
  }

  /** 匯出當天的 A4 PDF：先預覽頁面，背景再產生 PDF 檔 */
  async function exportPdf() {
    if (!stampedCount && !totalCards) { toast('先蓋個章或拍張照，才有東西可以匯出'); return; }
    setBusy('排版中…');
    await nextFrame();
    try {
      const stopStamps = new Map(stops.filter((s) => s.stamp).map((s) => [s.item.id, s.stamp]));
      const pages = await buildReport({ stops: stops.map((s) => s.stop), stopStamps, cardsOf: (id) => cardsOf(cards, id) });
      setPdf({ pages: pages.map((p) => p.toDataURL('image/jpeg', 0.85)), blob: null });
      setBusy('');
      const blob = await pagesToPdf(pages);
      setPdf((p) => p && { ...p, blob });
    } catch (e) {
      console.error(e);
      setBusy('');
      toast('PDF 產生失敗，請再試一次');
    }
  }

  const closeCam = useCallback(() => setCamFor(null), []);
  const closeDraft = useCallback(() => setDraft(null), []);
  const closePdf = useCallback(() => setPdf(null), []);
  const camStop = camFor && stopOf(camFor);

  return (
    <>
      <header className="page-head" style={{ paddingTop: 28 }}>
        <h1 className="page-title">打卡</h1>
        <div className="page-sub">拍照、蓋章、寫幾句話，每站留一張明信片</div>
      </header>

      <div className="day-tabs" role="group" aria-label="選擇日期">
        {Array.from({ length: trip.days }, (_, i) => (
          <button key={i} type="button" className="day-tab" aria-pressed={i === day} onClick={() => setDay(i)}>
            <span className="day-tab__date">DAY</span>
            <span className="day-tab__label">{i + 1}</span>
          </button>
        ))}
      </div>

      <div className="ck-page">
        <div className="ck-day">
          <span className="ck-day__chip">DAY {day + 1}</span>
          <span className="ck-day__date">{mdw(addDays(trip.startDate, day))} {trip.name}</span>
          {stops.length > 0 && <span className="ck-day__count">已蓋章 {stampedCount}/{stops.length}</span>}
          {stops.length > 0 && (
            <button type="button" className="ck-pdfbtn" onClick={exportPdf}><Icon bi="file-earmark-pdf" />匯出 PDF</button>
          )}
          {stampedCount > 0 && (
            <button type="button" className="ck-day__clear" onClick={clearStamps}><Icon bi="eraser" />清除蓋章</button>
          )}
        </div>

        {stops.length ? (
          <>
            <ul className="ck-list">
              {stops.map((s) => (
                <StopRow key={s.item.id} stop={s.stop} cards={s.cards} stamp={s.stamp} isNew={justStamped === s.item.id}
                  onStamp={() => onStamp(s)} onUnstamp={() => onUnstamp(s)} onShoot={() => setCamFor(s.item.id)}
                  onOpenCard={(r) => openCard(r, s)} />
              ))}
            </ul>
            <PostcardAlbum groups={stops.filter((s) => s.cards.length)} onOpenCard={(r) => openCard(r, stopOf(r.itemId))} />
          </>
        ) : (
          <div className="empty">
            <Icon bi="geo-alt" />
            <span className="empty__title">這天還沒有行程</span>
            <span className="small muted">到「行程」新增這天的行程，就可以在這裡打卡</span>
          </div>
        )}
      </div>

      {camStop && (
        <CameraSheet title={`${pad(camStop.stop.no)}・${camStop.stop.title}${camStop.cards.length ? `（第 ${camStop.cards.length + 1} 張）` : ''}`}
          onClose={closeCam} onPhoto={develop} />
      )}
      {busy && <LabOverlay text={busy} />}
      {draft && (
        <PostcardViewer key={draft.id} draft={draft}
          onRemember={(patch) => Object.assign(last.current, patch)}
          onRetake={() => { const id = draft.itemId; setDraft(null); setCamFor(id); }}
          onClose={closeDraft} />
      )}
      {pdf && <PdfPreview pdf={pdf} filename={`${trip.name}-DAY${day + 1}-打卡紀錄.pdf`} onClose={closePdf} />}
    </>
  );
}
