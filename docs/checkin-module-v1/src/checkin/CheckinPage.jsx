import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./checkin.css";
import {
  setTrip, pad, fmtTime, COMPOSE, STYLE_NAME, STAMPS, stampCanvas, loadFonts,
  blobToImage, normalize, canvasBlob, renderCard, buildReport, pagesToPdf,
} from "./engine.js";
import * as db from "./storage.js";

/* ---------- 版型清單（照片類在前，預設經典拍立得） ---------- */
const PHOTO_STYLES = ["polaroid", "horizon", "kraft", "doodle", "clip", "vintage", "retro"];
const ILLUST_STYLES = ["split", "splitink", "ink"];
const SHORT = { vintage: "老派雙面", retro: "復古雙面", split: "照片＋像素 16 色", splitink: "照片＋藍墨", ink: "藍墨漫畫封面" };
const label = (k) => SHORT[k] || STYLE_NAME[k];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const Icon = {
  cam: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.2" /></svg>,
  stamp: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M9 3h6v5l-1 3h4a2 2 0 0 1 2 2v3H4v-3a2 2 0 0 1 2-2h4L9 8z" /><path d="M4 20h16" /></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  flip: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9a8 8 0 0 1 14-3l2 2M20 15a8 8 0 0 1-14 3l-2-2" /><path d="M20 4v4h-4M4 20v-4h4" /></svg>,
  lib: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 16l5-5 4 4 3-3 6 6" /></svg>,
  dl: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>,
  pdf: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 13h6M9 17h6" /></svg>,
};

/* Blob → object URL，元件卸載或 blob 換掉時自動釋放 */
function useBlobUrl(blob) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!blob) { setUrl(""); return; }
    const u = URL.createObjectURL(blob); setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}
function BlobImg({ blob, ...rest }) { const u = useBlobUrl(blob); return u ? <img src={u} alt="" {...rest} /> : null; }

function saveBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ================================================================
   打卡頁
   props:
     trip  = { name, date: "2026.12.23", day: 3, weekday: "三" }
     stops = [{ id, no, time, category, title }]   ← 由 App 的 store 轉換
   ================================================================ */
export default function CheckinPage({ trip, stops, header = true }) {
  setTrip(trip);
  const [cards, setCards] = useState([]);
  const [stopStamps, setStopStamps] = useState(new Map());
  const [camStop, setCamStop] = useState(null);
  const [busy, setBusy] = useState("");
  const [cur, setCur] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [toastText, setToastText] = useState("");
  const [justStamped, setJustStamped] = useState(null);
  const last = useRef({ style: "polaroid", orient: "port" });
  const toastT = useRef(0);

  const toast = useCallback((t) => { setToastText(t); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToastText(""), 2200); }, []);
  useEffect(() => { db.loadAll().then(({ cards, stopStamps }) => { setCards(cards); setStopStamps(stopStamps); }); loadFonts(); }, []);

  const cardsOf = useCallback((id) => cards.filter((r) => r.stopId === id).sort((a, b) => a.at - b.at), [cards]);
  const stopIds = useMemo(() => new Set(stops.map((s) => s.id)), [stops]);
  const stampedCount = stops.filter((s) => stopStamps.has(s.id)).length;
  const totalCards = cards.filter((r) => stopIds.has(r.stopId)).length;

  /* ---------- 行程蓋章 ---------- */
  async function stampStop(s) {
    const rec = { id: "stamp:" + s.id, kind: "stopstamp", stopId: s.id, at: Date.now(), rot: (Math.random() - 0.5) * 0.5 };
    await db.save(rec); setStopStamps((m) => new Map(m).set(s.id, rec)); setJustStamped(s.id);
    toast(`${s.title} ${fmtTime(rec.at)} 打卡`);
  }
  async function unstampStop(s) {
    if (!confirm(`取消「${s.title}」的打卡章？`)) return;
    await db.remove("stamp:" + s.id); setStopStamps((m) => { const n = new Map(m); n.delete(s.id); return n; });
  }

  /* ---------- 明信片 ---------- */
  const stopFor = (s) => ({ ...s, stampAt: stopStamps.get(s.id)?.at });
  async function develop(photoCanvas, stop) {
    setBusy("沖洗中…");
    const t0 = performance.now();
    const orient = photoCanvas.width > photoCanvas.height * 1.15 ? "land" : last.current.orient;
    const next = { id: uid(), stop, photoCanvas, photo: await canvasBlob(photoCanvas), style: last.current.style, orient, msg: "", stamps: [], saved: false, at: Date.now() };
    next.card = await renderCard({ ...next, src: photoCanvas, stop: stopFor(stop) });
    const wait = 900 - (performance.now() - t0); if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    setBusy(""); setCur(next);
  }
  async function persist(c) {
    const rec = { id: c.id, stopId: c.stop.id, style: c.style, orient: c.orient, msg: c.msg, stamps: c.stamps, photo: c.photo, card: c.card, at: Date.now() };
    await db.save(rec);
    setCards((list) => [...list.filter((r) => r.id !== rec.id), rec]);
  }
  async function update(patch, { rerender = true } = {}) {
    const c = { ...cur, ...patch };
    if (patch.style) last.current.style = patch.style;
    if (patch.orient) last.current.orient = patch.orient;
    setCur({ ...c, refreshing: true });
    if (rerender) c.card = await renderCard({ ...c, src: c.photoCanvas, stop: stopFor(c.stop) });
    if (c.saved) await persist(c);
    setCur({ ...c, refreshing: false });
  }
  async function openCard(rec) {
    const stop = stops.find((s) => s.id === rec.stopId); if (!stop) return;
    const photoCanvas = await normalize(await blobToImage(rec.photo));
    const c = { ...rec, stop, photoCanvas, saved: true, style: COMPOSE[rec.style] ? rec.style : "polaroid" };
    if (!COMPOSE[rec.style]) { c.card = await renderCard({ ...c, src: photoCanvas, stop: stopFor(stop) }); await persist(c); }
    setCur(c);
  }
  async function deleteCard() {
    if (!confirm("確定刪除這張明信片？")) return;
    await db.remove(cur.id); setCards((l) => l.filter((r) => r.id !== cur.id)); setCur(null); toast("已刪除");
  }

  /* ---------- PDF ---------- */
  async function exportPdf() {
    if (!stampedCount && !totalCards) { toast("先蓋個章或拍張照，才有東西可以匯出"); return; }
    setBusy("排版中…");
    try {
      const pages = await buildReport({ stops: stops.map(stopFor), stopStamps, cardsOf });
      setPdf({ pages: pages.map((p) => p.toDataURL("image/jpeg", 0.85)), blob: null });
      setBusy("");
      const blob = await pagesToPdf(pages);
      setPdf((p) => p && { ...p, blob });
    } catch (e) { console.error(e); setBusy(""); toast("PDF 產生失敗，請再試一次"); }
  }

  return (
    <div className="ck-root ck-app">
      {header && (
        <header className="ck-head"><div><h1>打卡</h1><p>拍照、蓋章、寫幾句話，每站留一張明信片</p></div></header>
      )}
      <div className="ck-day">
        <span className="ck-day__chip">DAY {trip.day}</span>
        <span className="ck-day__date">{trip.date}{trip.weekday ? `（${trip.weekday}）` : ""} {trip.name}</span>
        <span className="ck-day__count">已蓋章 {stampedCount}/{stops.length}</span>
        <button className="ck-pdfbtn" onClick={exportPdf}>{Icon.pdf}匯出 PDF</button>
      </div>

      {!stops.length && <div className="ck-empty">這天還沒有行程，先到「行程」新增吧</div>}
      <ul className="ck-list">
        {stops.map((s) => (
          <StopRow key={s.id} stop={s} recs={cardsOf(s.id)} stamp={stopStamps.get(s.id)} isNew={justStamped === s.id}
            onStamp={() => stampStop(s)} onUnstamp={() => unstampStop(s)} onShoot={() => setCamStop(s)} onOpen={openCard} />
        ))}
      </ul>

      <div className="ck-sec"><h2>明信片集</h2><span>{totalCards ? `共 ${totalCards} 張` : "拍過的都收在這裡"}</span></div>
      {totalCards ? stops.map((s) => {
        const recs = cardsOf(s.id); if (!recs.length) return null;
        return (
          <div className="ck-grp" key={s.id}>
            <div className="ck-grp__h"><span>{pad(s.no)}</span><b>{s.title}</b><em>{recs.length} 張</em></div>
            <div className="ck-album">{recs.map((r) => <button key={r.id} aria-label={s.title} onClick={() => openCard(r)}><BlobImg blob={r.card} /></button>)}</div>
          </div>
        );
      }) : <div className="ck-empty">還沒有明信片，先去第一站拍一張吧</div>}

      {camStop && <CameraSheet stop={camStop} count={cardsOf(camStop.id).length} onClose={() => setCamStop(null)}
        onPhoto={(c) => { const s = camStop; setCamStop(null); develop(c, s); }} onError={() => toast("這張照片讀不出來，換一張試試")} />}

      {busy && <section className="ck-ov ck-lab ck-is-on" aria-live="polite"><div className="ck-lab__tray" /><b>{busy}</b></section>}

      {cur && <PostcardViewer cur={cur} count={cardsOf(cur.stop.id)} onUpdate={update}
        onClose={() => setCur(null)}
        onAgain={() => { const s = cur.stop; setCur(null); setCamStop(s); }}
        onDone={async () => { if (!cur.saved) { await persist(cur); toast(`第 ${cur.stop.no} 站已收進 ${cardsOf(cur.stop.id).length + 1} 張`); } setCur(null); }}
        onDelete={deleteCard}
        onSave={() => saveBlob(cur.card, `postcard-${pad(cur.stop.no)}-${cur.stop.title}-${cur.orient === "land" ? "橫" : "直"}.jpg`)} />}

      {pdf && (
        <section className="ck-ov ck-view ck-is-on" aria-label="PDF 預覽">
          <div className="ck-view__in">
            <div className="ck-view__top"><div><b>今日打卡紀錄</b><div className="ck-view__count">共 {pdf.pages.length} 頁 · A4</div></div>
              <button className="ck-icon" aria-label="關閉" onClick={() => setPdf(null)}>{Icon.x}</button></div>
            <div className="ck-pdfpages">{pdf.pages.map((u, i) => <img key={i} src={u} alt={`第 ${i + 1} 頁`} />)}</div>
            <div className="ck-acts">
              <button className="ck-btn ck-btn--red" disabled={!pdf.blob}
                onClick={() => saveBlob(pdf.blob, `${trip.name}-DAY${trip.day}-打卡紀錄.pdf`)}>{Icon.dl}{pdf.blob ? "下載 PDF" : "產生中…"}</button>
            </div>
          </div>
        </section>
      )}

      {toastText && <div className="ck-toast ck-is-on">{toastText}</div>}
    </div>
  );
}

/* ---------- 單一行程列 ---------- */
function StopRow({ stop: s, recs, stamp, isNew, onStamp, onUnstamp, onShoot, onOpen }) {
  const stampUrl = useMemo(() => stamp && stampCanvas("post", { at: stamp.at, title: s.title, no: s.no }, 180).toDataURL(), [stamp, s.title, s.no]);
  const done = recs.length || stamp;
  return (
    <li className={`ck-stop${done ? " ck-is-done" : ""}`}>
      <div className="ck-stop__row">
        <span className="ck-stop__no">{s.no}</span>
        <div className="ck-stop__body">
          <div className="ck-stop__time">{s.time || "--:--"}</div>
          <div className="ck-stop__title">{s.title}</div>
          <div className="ck-stop__cat">{[s.category, recs.length ? `${recs.length} 張` : "", stamp ? `${fmtTime(stamp.at)} 打卡` : ""].filter(Boolean).join(" · ")}</div>
        </div>
        {stamp && (
          <button className={`ck-rowstamp${isNew ? " ck-is-new" : ""}`} style={{ transform: `rotate(${stamp.rot}rad)` }}
            aria-label={`${s.title} 已於 ${fmtTime(stamp.at)} 打卡，點一下可以取消`} onClick={onUnstamp}><img alt="" src={stampUrl} /></button>
        )}
        <div className="ck-stop__btns">
          {!stamp && <button className="ck-stampbtn" onClick={onStamp} aria-label={`在 ${s.title} 蓋打卡章`}>{Icon.stamp}蓋章</button>}
          <button className={`ck-shoot${recs.length ? " ck-shoot--sm" : ""}`} onClick={onShoot}>{Icon.cam}{recs.length ? "再拍" : "拍照"}</button>
        </div>
      </div>
      {recs.length > 0 && (
        <div className="ck-strip">
          {recs.map((r) => (
            <button key={r.id} className={`ck-thumb${r.orient === "land" ? " ck-is-land" : ""}`} aria-label={`看 ${s.title} 的明信片`} onClick={() => onOpen(r)}><BlobImg blob={r.card} /></button>
          ))}
        </div>
      )}
    </li>
  );
}

/* ---------- 相機 ---------- */
function CameraSheet({ stop, count, onClose, onPhoto, onError }) {
  const video = useRef(null), fileCam = useRef(null), fileLib = useRef(null);
  const [facing, setFacing] = useState("environment");
  const [fail, setFail] = useState("");
  useEffect(() => {
    let stream = null, dead = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setFail("這個瀏覽器不讓網頁直接開相機，可以改用手機相機拍，拍完會自動帶回來。"); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
        if (dead) { stream.getTracks().forEach((t) => t.stop()); return; }
        setFail(""); video.current.srcObject = stream; await video.current.play().catch(() => {});
      } catch (e) {
        setFail(e?.name === "NotAllowedError" ? "相機權限被擋住了。可以改用手機相機拍，拍完會自動帶回來。" : "這個瀏覽器不讓網頁直接開相機，可以改用手機相機拍，拍完會自動帶回來。");
      }
    })();
    return () => { dead = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [facing]);
  function shoot() {
    const v = video.current; if (!v?.videoWidth) return;
    const c = document.createElement("canvas"), s = Math.min(1, 1600 / Math.max(v.videoWidth, v.videoHeight));
    c.width = Math.round(v.videoWidth * s); c.height = Math.round(v.videoHeight * s);
    const g = c.getContext("2d"); if (facing === "user") { g.translate(c.width, 0); g.scale(-1, 1); }
    g.drawImage(v, 0, 0, c.width, c.height); onPhoto(c);
  }
  async function onFile(e) {
    const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
    try { onPhoto(await normalize(await blobToImage(f))); } catch { onError(); }
  }
  return (
    <section className={`ck-ov ck-cam ck-is-on${fail ? " ck-is-fail" : ""}`} aria-label="相機">
      <div className="ck-cam__top">
        <button className="ck-icon" aria-label="關閉相機" onClick={onClose}>{Icon.x}</button>
        <b>{pad(stop.no)}・{stop.title}{count ? `（第 ${count + 1} 張）` : ""}</b>
        <button className="ck-icon" aria-label="切換前後鏡頭" onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}>{Icon.flip}</button>
      </div>
      <div className="ck-cam__view">
        <video ref={video} playsInline muted autoPlay />
        <div className="ck-cam__frame" />
        <div className="ck-cam__fail"><p>{fail}</p><button className="ck-pick ck-pick--solid" onClick={() => fileCam.current.click()}>{Icon.cam}用手機相機拍</button></div>
      </div>
      <div className="ck-cam__bar">
        <button className="ck-pick" onClick={() => fileLib.current.click()}>{Icon.lib}相簿</button>
        <button className="ck-shutter" aria-label="拍照" onClick={shoot} />
        <span style={{ width: 84 }} />
      </div>
      <input ref={fileCam} type="file" accept="image/*" capture="environment" className="ck-sr" tabIndex={-1} onChange={onFile} />
      <input ref={fileLib} type="file" accept="image/*" className="ck-sr" tabIndex={-1} onChange={onFile} />
    </section>
  );
}

/* ---------- 明信片檢視：換版型、直橫、留言、蓋章 ---------- */
function PostcardViewer({ cur, count, onUpdate, onClose, onAgain, onDone, onDelete, onSave }) {
  const [stamping, setStamping] = useState(false);
  const [design, setDesign] = useState("post");
  const [msg, setMsg] = useState(cur.msg || "");
  const msgT = useRef(0);
  const url = useBlobUrl(cur.card);
  const idx = count.findIndex((r) => r.id === cur.id);
  const choices = useMemo(() => STAMPS.map((d) => ({ ...d, url: stampCanvas(d.id, { at: Date.now(), title: cur.stop.title, no: cur.stop.no }, 140).toDataURL() })), [cur.stop, stamping]);
  useEffect(() => setMsg(cur.msg || ""), [cur.id]);

  function onMsg(e) {
    const v = [...e.target.value].slice(0, 40).join(""); setMsg(v);
    clearTimeout(msgT.current); msgT.current = setTimeout(() => onUpdate({ msg: v }), 450);
  }
  function onCardClick(e) {
    if (!stamping) return;
    const r = e.currentTarget.getBoundingClientRect(), land = cur.orient === "land";
    const cl = (v, m) => Math.min(1 - m, Math.max(m, v));
    const st = { design, x: cl((e.clientX - r.left) / r.width, land ? 0.09 : 0.12), y: cl((e.clientY - r.top) / r.height, land ? 0.13 : 0.09), rot: (Math.random() - 0.5) * 0.55, at: Date.now() };
    navigator.vibrate?.(18); onUpdate({ stamps: [...cur.stamps, st] });
  }
  const Chip = ({ k }) => <button className="ck-chip" aria-pressed={cur.style === k} onClick={() => cur.style !== k && onUpdate({ style: k })}>{label(k)}</button>;

  return (
    <section className="ck-ov ck-view ck-is-on" aria-label="明信片">
      <div className="ck-view__in">
        <div className="ck-view__top">
          <div><b>STAGE {pad(cur.stop.no)}・{cur.stop.title}</b>
            <div className="ck-view__count">{cur.saved ? `這站第 ${idx + 1} / ${count.length} 張` : `這站第 ${count.length + 1} 張（尚未收進）`}</div></div>
          <button className="ck-icon" aria-label="關閉" onClick={onClose}>{Icon.x}</button>
        </div>
        <div className={`ck-card${cur.orient === "land" ? " ck-is-land" : ""}${cur.refreshing ? " ck-is-busy" : ""}${stamping ? " ck-is-stamping" : ""}`}>
          {url && <img src={url} alt={`${cur.stop.title} 的${STYLE_NAME[cur.style]}明信片`} onClick={onCardClick} />}
        </div>
        {stamping && (
          <div className="ck-stampbar ck-is-on">
            <span className="ck-stampbar__hint">選一個印章，點明信片任一處蓋下去</span>
            <div className="ck-stampbar__row">{choices.map((d) => <button key={d.id} className="ck-stampchip" aria-label={d.name} aria-pressed={design === d.id} onClick={() => setDesign(d.id)}><img alt="" src={d.url} /></button>)}</div>
            <div className="ck-stampbar__row">
              <button className="ck-btn ck-btn--ghost" disabled={!cur.stamps.length} onClick={() => onUpdate({ stamps: cur.stamps.slice(0, -1) })}>復原上一個</button>
              <button className="ck-btn" onClick={() => setStamping(false)}>蓋好了</button>
            </div>
          </div>
        )}
        <div className="ck-msg">
          <label htmlFor="ck-msg">寫在明信片上</label>
          <textarea id="ck-msg" rows={2} maxLength={40} placeholder="寫幾句話…（最多 40 字）" value={msg} onChange={onMsg} />
          <span className="ck-msg__count">{[...msg].length} / 40</span>
        </div>
        <div className="ck-opts">
          <span className="ck-opts__label">照片</span>
          <div className="ck-styles" role="group" aria-label="照片版型">{PHOTO_STYLES.map((k) => <Chip key={k} k={k} />)}</div>
          <span className="ck-opts__label">插畫</span>
          <div className="ck-styles" role="group" aria-label="插畫版型">{ILLUST_STYLES.map((k) => <Chip key={k} k={k} />)}</div>
          <div className="ck-styles" role="group" aria-label="方向">
            {[["port", "直式"], ["land", "橫式"]].map(([k, t]) => <button key={k} className="ck-chip ck-chip--sm" aria-pressed={cur.orient === k} onClick={() => cur.orient !== k && onUpdate({ orient: k })}>{t}</button>)}
          </div>
        </div>
        <div className="ck-acts">
          <button className="ck-btn" onClick={onAgain}>{Icon.cam}{cur.saved ? "再拍一張" : "重拍"}</button>
          <button className={`ck-btn${stamping ? " ck-is-on" : ""}`} onClick={() => setStamping((v) => !v)}>{Icon.stamp}蓋章</button>
          <button className="ck-btn" onClick={onSave}>{Icon.dl}存到手機</button>
          <button className="ck-btn ck-btn--red" onClick={onDone}>{cur.saved ? "完成" : "收進明信片集"}</button>
        </div>
        {cur.saved && <button className="ck-btn ck-btn--ghost" onClick={onDelete}>刪除這張</button>}
      </div>
    </section>
  );
}
