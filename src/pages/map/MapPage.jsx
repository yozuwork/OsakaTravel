import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTripStore, updateTrip } from '../../stores/tripStore';
import Icon from '../../components/common/Icon';
import { cx, mapsUrl } from '../../utils/helpers';
import { catIcon } from '../../data/constants';
import { addDays, mdw, parseDate } from '../../utils/date';
import { dayItems } from '../../utils/itinerary';
import { charImgSrc, stageChar, stageLine } from '../../utils/dialogueText';
import { prefersReducedMotion } from '../../components/transition/PageTransition';
import { openItemDetail, openStageSay } from '../itinerary/itemEditor';

/* =========================================================
   地圖：遊戲「關卡選擇」風格
   每天是一個 WORLD，當天行程依序變成關卡，用蜿蜒的路連起來；
   位置只依順序排列（不是真實距離），所以點跟點的間距永遠平均
   角色站在目前的關卡上，選別的關卡會沿著路走過去
   ========================================================= */

const ROW = 136;          // 關卡上下間距
const TOP = 150;          // 第一關離頂端（上方留給角色和台詞）
const BOTTOM = 110;       // 最後一關下方留白（GOAL 旗子）
const NODE = 60;          // 關卡圓點直徑
const WAVE = [0.24, 0.5, 0.76, 0.5]; // 關卡橫向位置（佔寬度比例），循環成 S 形
const BOARD_MAX = 620;    // 桌機版路線區最寬

/** 台詞片段 → 文字，【】的部分紅底 */
const Say = ({ line }) => line.map(([t, hi], i) => (hi ? <em key={i}>{t}</em> : <span key={i}>{t}</span>));

/** 行程開始的時間點（沒填時間就當作當天結束） */
function itemTime(startDate, it) {
  const d = parseDate(addDays(startDate, it.day));
  const [h, m] = (it.time || '23:59').split(':').map(Number);
  d.setHours(h, m || 0, 0, 0);
  return d;
}

/** Catmull-Rom 轉成每一段的三次貝茲曲線，讓路線平滑 */
function roadSegments(pts) {
  return pts.slice(0, -1).map((p1, i) => {
    const p0 = pts[i - 1] || p1, p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    return `M${p1.x} ${p1.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
  });
}

function useWidth(ref) {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

export default function MapPage() {
  const trip = useTripStore((s) => s.trip);
  const allItems = useTripStore((s) => s.items);
  const characters = useTripStore((s) => s.dialogue.characters);
  const uiDay = useTripStore((s) => s.ui.day);
  const day = Math.min(uiDay, trip.days - 1);
  const items = useMemo(() => dayItems(allItems, day), [allItems, day]);
  // 手機版的關卡資訊預設收起，點了關卡才顯示（桌機版一直顯示在右側）
  const [sheetOpen, setSheetOpen] = useState(false);
  const setDay = (i) => { setSheetOpen(false); updateTrip((s) => { s.ui.day = i; }); }; // 和行程頁共用選到的日期

  const now = Date.now();
  const cleared = items.map((it) => itemTime(trip.startDate, it).getTime() < now);
  const firstOpen = cleared.indexOf(false);
  const defaultSel = firstOpen === -1 ? Math.max(items.length - 1, 0) : firstOpen;

  // 每天記住各自選到的關卡
  const [selByDay, setSelByDay] = useState({});
  const sel = Math.min(selByDay[day] ?? defaultSel, Math.max(items.length - 1, 0));
  const cur = items[sel];
  const select = (i) => setSelByDay((m) => ({ ...m, [day]: (i + items.length) % items.length }));

  const curChar = cur && stageChar(characters, cur, day);

  return (
    <>
      <header className="page-head" style={{ paddingTop: 28 }}>
        <div className="page-head__row" style={{ alignItems: 'flex-end' }}>
          <div>
            <h1 className="page-title">地圖</h1>
            <div className="page-sub">每天一個世界 · 行程就是關卡，點關卡讓角色走過去</div>
          </div>
        </div>
      </header>

      <div className="day-tabs" role="group" aria-label="選擇日期">
        {Array.from({ length: trip.days }, (_, i) => (
          <button key={i} type="button" className="day-tab" aria-pressed={i === day} onClick={() => setDay(i)}>
            <span className="day-tab__date">WORLD</span>
            <span className="day-tab__label">{i + 1}</span>
          </button>
        ))}
      </div>

      <div className="map-page">
        <div className="qm-wrap">
          <div className="qm-head">
            <span className="qm-head__world">WORLD {day + 1}</span>
            <span className="qm-head__date">{mdw(addDays(trip.startDate, day))}</span>
            {items.length > 0 && (
              <span className="qm-head__stars"><Icon bi="star-fill" />{cleared.filter(Boolean).length}/{items.length} CLEAR</span>
            )}
          </div>
          {items.length
            ? <QuestBoard key={day} day={day} items={items} cleared={cleared} sel={sel} onSelect={(i) => { select(i); setSheetOpen(true); }} characters={characters} />
            : (
              <div className="empty">
                <Icon name="map" />
                <span className="empty__title">這個世界還沒有關卡</span>
                <span className="small muted">到「行程」新增這天的行程，就會出現在地圖上</span>
              </div>
            )}
        </div>

        {cur && (
          <section className={cx('map-sheet qm-sheet', sheetOpen && 'is-open')} aria-label="關卡資訊" aria-live="polite">
            <div className="map-sheet__handle" />
            <div className="qm-sheet__top">
              <span className={cx('qm-sheet__stage', cleared[sel] && 'is-clear')}>
                STAGE {sel + 1}{cleared[sel] && <><Icon bi="star-fill" />CLEAR</>}
              </span>
              <span className="qm-sheet__nav">
                <button className="icon-btn" onClick={() => select(sel - 1)} aria-label="上一關"><Icon name="chevronLeft" /></button>
                <button className="icon-btn" onClick={() => select(sel + 1)} aria-label="下一關"><Icon name="chevronRight" /></button>
                <button className="icon-btn qm-sheet__close" onClick={() => setSheetOpen(false)} aria-label="收起關卡資訊"><Icon name="x" /></button>
              </span>
            </div>
            <div className="qm-sheet__title">
              <span className="qm-sheet__icon"><Icon name={catIcon(cur.category)} /></span>
              <div style={{ minWidth: 0 }}>
                <div className="small muted">{cur.time || '時間未定'} · {cur.category || '其他'}</div>
                <div className="map-sheet__name">{cur.title}</div>
              </div>
            </div>
            {cur.place && <div className="qm-sheet__meta"><Icon name="pin" /><span>{cur.place}</span></div>}
            {cur.note && <div className="qm-sheet__meta qm-sheet__note"><Icon name="alert" /><span>{cur.note}</span></div>}
            {curChar && (
              <div className="qm-sheet__say">
                <img src={charImgSrc(curChar.img)} alt="" draggable="false" />
                <span><strong>{curChar.name}</strong><span className="qm-say-text"><Say line={stageLine(cur, sel)} /></span></span>
              </div>
            )}
            <div className="btn-row qm-sheet__btns">
              <a className="btn btn--primary btn--sm" href={mapsUrl(cur.place || cur.title)} target="_blank" rel="noopener"><Icon name="nav" />導航</a>
              <button type="button" className="btn btn--sm" onClick={() => openStageSay(cur.id)}><Icon bi="chat-quote" />編輯台詞</button>
              <button type="button" className="btn btn--sm" onClick={() => openItemDetail(cur.id)}>行程詳情</button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

/** 關卡路線圖本體 */
function QuestBoard({ day, items, cleared, sel, onSelect, characters }) {
  const boardRef = useRef(null);
  const roadRefs = useRef([]);
  const avatarRef = useRef(null);
  const posRef = useRef(sel);    // 角色目前站的關卡
  const walkRef = useRef(0);     // requestAnimationFrame id
  const [walking, setWalking] = useState(false);
  const [at, setAt] = useState(sel);         // 角色抵達的關卡（換角色、台詞以這個為準）
  const [say, setSay] = useState(true);      // 是否顯示台詞泡泡
  const player = stageChar(characters, items[at], day);
  const W = useWidth(boardRef);

  const inner = Math.min(W, BOARD_MAX);
  const left = (W - inner) / 2;
  const pts = items.map((_, i) => ({ x: Math.round(left + inner * WAVE[i % WAVE.length]), y: TOP + i * ROW }));
  const segs = pts.length > 1 ? roadSegments(pts) : [];
  const height = TOP + (items.length - 1) * ROW + BOTTOM;

  function placeAvatar(x, y, flip) {
    const el = avatarRef.current;
    if (!el) return;
    el.style.transform = `translate(${x}px, ${y}px)`;
    if (flip !== undefined) el.dataset.flip = flip ? '1' : '0';
  }

  // 尺寸變動（換螢幕寬度）時直接把角色放回所在關卡
  useLayoutEffect(() => {
    if (!W || walkRef.current) return;
    const p = pts[posRef.current] || pts[0];
    placeAvatar(p.x, p.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W]);

  // 選了別的關卡：沿路走過去
  useEffect(() => {
    if (!W) return;
    const from = posRef.current, to = sel;
    if (from === to) return;
    cancelAnimationFrame(walkRef.current);
    posRef.current = to;
    setSay(false);

    const arrive = () => {
      walkRef.current = 0;
      setWalking(false);
      setAt(to);
      setSay(true);
    };
    if (prefersReducedMotion() || !segs.length) { placeAvatar(pts[to].x, pts[to].y); arrive(); return; }

    // 要經過的路段（往回走就反向）
    const dir = to > from ? 1 : -1;
    const legs = [];
    for (let i = from; i !== to; i += dir) {
      const path = roadRefs.current[dir > 0 ? i : i - 1];
      if (path) legs.push({ path, len: path.getTotalLength(), reverse: dir < 0 });
    }
    const total = legs.reduce((s, l) => s + l.len, 0);
    const duration = Math.min(2200, Math.max(500, total * 2.4));
    const start = performance.now();
    setWalking(true);

    const step = (t) => {
      const k = Math.min(1, (t - start) / duration);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2; // ease-in-out
      let d = e * total;
      let leg = legs[0];
      for (const l of legs) { leg = l; if (d <= l.len) break; d -= l.len; }
      const at = Math.min(d, leg.len);
      const p = leg.path.getPointAtLength(leg.reverse ? leg.len - at : at);
      const ahead = leg.path.getPointAtLength(Math.min(leg.len, Math.max(0, leg.reverse ? leg.len - at - 2 : at + 2)));
      placeAvatar(p.x, p.y, ahead.x < p.x - 0.1 ? true : ahead.x > p.x + 0.1 ? false : undefined);
      if (k < 1) walkRef.current = requestAnimationFrame(step);
      else arrive();
    };
    walkRef.current = requestAnimationFrame(step);

    // 關卡不在畫面內就捲過去
    const node = boardRef.current?.querySelectorAll('.qm-node')[to];
    const r = node?.getBoundingClientRect();
    if (r && (r.top < 80 || r.bottom > window.innerHeight - 200)) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, W]);

  useEffect(() => () => cancelAnimationFrame(walkRef.current), []);

  // 台詞顯示幾秒後收起
  useEffect(() => {
    if (!say) return;
    const t = setTimeout(() => setSay(false), 3600);
    return () => clearTimeout(t);
  }, [say]);

  const last = items.length - 1;

  return (
    <div className="qm-board" ref={boardRef} style={{ height }}>
      {W > 0 && (
        <>
          <svg className="qm-road" width={W} height={height} aria-hidden="true">
            {segs.map((d, i) => <path key={'o' + i} d={d} className="qm-road__edge" />)}
            {segs.map((d, i) => (
              <path key={'r' + i} d={d} ref={(el) => { roadRefs.current[i] = el; }}
                className={cx('qm-road__lane', cleared[i] && cleared[i + 1] && 'is-done')} />
            ))}
            {segs.map((d, i) => <path key={'s' + i} d={d} className={cx('qm-road__steps', cleared[i] && cleared[i + 1] && 'is-done')} />)}
          </svg>

          <span className="qm-flag qm-flag--start" style={{ left: pts[0].x, top: pts[0].y + 44 }}>START</span>
          {last > 0 && <span className="qm-flag qm-flag--goal" style={{ left: pts[last].x, top: pts[last].y + 44 }}><Icon bi="flag-fill" />GOAL</span>}

          {items.map((it, i) => {
            const p = pts[i];
            const labelLeft = p.x > left + inner * 0.6 || (p.x > left + inner * 0.4 && (pts[i + 1]?.x ?? 0) > p.x);
            const room = labelLeft ? p.x - NODE / 2 - 22 - left : left + inner - p.x - NODE / 2 - 22;
            return (
              <button key={it.id} type="button" style={{ left: p.x, top: p.y }}
                className={cx('qm-node', cleared[i] && 'is-clear', i === sel && 'is-current')}
                onClick={() => onSelect(i)} aria-pressed={i === sel}
                aria-label={`第 ${i + 1} 關：${it.time || '時間未定'} ${it.title}${cleared[i] ? '（已完成）' : ''}`}>
                <span className="qm-node__dot">
                  <Icon name={catIcon(it.category)} />
                  <span className="qm-node__no">{i + 1}</span>
                  {cleared[i] && <span className="qm-node__star"><Icon bi="star-fill" /></span>}
                </span>
                <span className={cx('qm-node__label', labelLeft && 'is-left')} style={{ maxWidth: Math.max(110, Math.min(room, 220)) }}>
                  <span className="qm-node__time">{it.time || '--:--'}</span>
                  <span className="qm-node__title">{it.title}</span>
                </span>
              </button>
            );
          })}

          {player && (
            <div className={cx('qm-avatar', walking && 'is-walking')} ref={avatarRef} aria-hidden="true">
              <span className="qm-avatar__body">
                {say && !walking && items[at] && <span className="qm-avatar__say qm-say-text"><Say line={stageLine(items[at], at)} /></span>}
                <span className="qm-avatar__face" key={player.id}><img src={charImgSrc(player.img)} alt="" draggable="false" /></span>
              </span>
              <span className="qm-avatar__shadow" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
