import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTripStore, updateTrip } from '../../stores/tripStore';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import Fab, { addActions } from '../../components/common/Fab';
import TripHeader from '../../components/layout/TripHeader';
import { useMangaDaySwitch } from '../../components/transition/MangaDaySwitch';
import { cx, mapsUrl } from '../../utils/helpers';
import { WEEK, catIcon } from '../../data/constants';
import { addDays, md, mdw, parseDate, period } from '../../utils/date';
import { dayItems, placeItem } from '../../utils/itinerary';
import { openItemDetail, openItemForm } from './itemEditor';
import { openVoiceTrip } from './VoiceTripInput';

// 手機版 + 按鈕的選項
const itemActions = addActions({ voiceDesc: '用說的快速建立行程', textDesc: '手動輸入詳細內容', onText: () => openItemForm(null), onVoice: openVoiceTrip });

const PERIOD_EN = { 上午: 'MORNING', 下午: 'AFTERNOON', 晚上: 'EVENING', 未定: 'TBD' };
/** 右欄類別比例條的顏色（只用主色的深淺） */
const CAT_COLOR = { 交通: 'var(--navy)', 景點: 'var(--red)', 餐廳: 'var(--red-dark)', 住宿: 'var(--navy-light)', 購物: 'var(--red-line)', 其他: 'var(--navy-line)' };

const toMin = (t) => (/^\d{1,2}:\d{2}$/.test(t || '') ? Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]) : null);
const durText = (m) => (m >= 60 ? `${Math.floor(m / 60)} 小時${m % 60 ? ` ${m % 60} 分` : ''}` : `${m} 分鐘`);
const weekday = (iso) => `週${WEEK[parseDate(iso).getDay()]}`;

/** 每一列上方要顯示的分段標題（上午／下午／晚上）或與上一站的間隔 */
function leadsOf(items) {
  return items.map((it, i) => {
    const p = period(it.time);
    if (i === 0 || p !== period(items[i - 1].time)) return { type: 'period', label: p };
    const a = toMin(items[i - 1].time), b = toMin(it.time);
    return a !== null && b !== null && b > a ? { type: 'gap', mins: b - a } : null;
  });
}

export default function ItineraryPage() {
  const trip = useTripStore((s) => s.trip);
  const allItems = useTripStore((s) => s.items);
  const stays = useTripStore((s) => s.stays);
  const uiDay = useTripStore((s) => s.ui.day);
  const day = Math.min(uiDay, trip.days - 1);
  const date = addDays(trip.startDate, day);

  const items = useMemo(() => dayItems(allItems, day), [allItems, day]);
  const leads = useMemo(() => leadsOf(items), [items]);
  const counts = useMemo(
    () => Array.from({ length: trip.days }, (_, i) => allItems.filter((it) => it.day === i).length),
    [allItems, trip.days]
  );

  const tabsRef = useRef(null);
  const listRef = useRef(null);
  const applyDay = useCallback((i) => updateTrip((s) => { s.ui.day = i; }), []);
  // 漫畫分格上的文字：D2／DAY 2 · 星期二／12/22／當天第一個行程
  const dayInfo = useCallback((i) => {
    const d = addDays(trip.startDate, i);
    const first = dayItems(allItems, i)[0];
    return {
      d: `D${i + 1}`,
      tag: `DAY ${i + 1} · 星期${WEEK[parseDate(d).getDay()]}`,
      date: md(d),
      caption: first ? `${first.time || '--:--'}　${first.title}` : '這天還沒有行程'
    };
  }, [trip.startDate, allItems]);
  // 切換日期：漫畫斜切轉場，只蓋住日期按鈕下方的列表區
  const { pressedDay, switchDay, overlay } = useMangaDaySwitch({
    current: day, onSwitch: applyDay, getInfo: dayInfo, anchorRef: tabsRef, boundsRef: tabsRef, listRef,
    rowSelector: '.it-dayhead, .it-row, .it-empty'
  });

  // 日期列吸頂時加分隔線
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const onScroll = () => setStuck((tabsRef.current?.getBoundingClientRect().top ?? 1) <= 0 && window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 選取的日期按鈕捲進可視範圍
  useEffect(() => {
    tabsRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [pressedDay]);

  // 拖曳排序：滑鼠移動 6px 才算拖曳；手機要長按 250ms，避免和捲動、點擊衝突
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } })
  );
  const dragged = useRef(false);
  const [sorting, setSorting] = useState(false);

  function dragEnd({ active, over }) {
    setSorting(false);
    // 放開後瀏覽器仍會觸發一次 click，延遲清掉旗標以略過它
    setTimeout(() => { dragged.current = false; });
    if (!over || active.id === over.id) return;
    const index = items.findIndex((it) => it.id === over.id);
    updateTrip((s) => placeItem(s, active.id, index));
  }

  function open(id) {
    if (!dragged.current) openItemDetail(id);
  }

  // 手機：在列表上左右滑動切換日期（拖曳排序中不觸發）
  const touch = useRef(null);
  function touchStart(e) {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, at: Date.now() };
  }
  function touchEnd(e) {
    const s = touch.current;
    touch.current = null;
    if (!s || dragged.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.6 || Date.now() - s.at > 600) return;
    const next = pressedDay + (dx < 0 ? 1 : -1);
    if (next >= 0 && next < trip.days) switchDay(next);
  }

  const first = items.find((it) => toMin(it.time) !== null);
  const last = [...items].reverse().find((it) => toMin(it.time) !== null);
  const span = first && last ? `${first.time}–${last.time}` : '';

  return (
    <>
      <TripHeader />

      <div className={cx('it-days-wrap', stuck && 'is-stuck')} ref={tabsRef}>
        <div className="it-days" role="group" aria-label="選擇日期">
          {Array.from({ length: trip.days }, (_, i) => {
            const d = addDays(trip.startDate, i);
            return (
              <button key={i} type="button" className="it-day" aria-pressed={i === pressedDay} onClick={() => switchDay(i)}
                aria-label={`D${i + 1} ${mdw(d)}，${counts[i]} 個行程`}>
                <span className="it-day__num">D{i + 1}</span>
                <span className="it-day__date">{md(d)} {weekday(d)}</span>
                {counts[i] > 0 && <span className="it-day__count" aria-hidden="true">{counts[i]}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <main className="content content--itinerary" ref={listRef} onTouchStart={touchStart} onTouchEnd={touchEnd}>
        <div className="it-layout">
          <div className="it-main">
            <div className="it-dayhead">
              <span className="it-dayhead__big" aria-hidden="true">{String(day + 1).padStart(2, '0')}</span>
              <div className="it-dayhead__text">
                <p className="it-dayhead__label">DAY {day + 1}</p>
                <h2 className="it-dayhead__title">{md(date)} {weekday(date)}</h2>
              </div>
              <p className="it-dayhead__sub">
                <span><Icon name="pin" />{items.length} 個行程</span>
                {span && <span><Icon name="calendar" />{span}</span>}
              </p>
            </div>

            {items.length ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter}
                onDragStart={() => { dragged.current = true; setSorting(true); }} onDragEnd={dragEnd} onDragCancel={dragEnd}>
                <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
                  <div className={cx('it-tl', sorting && 'is-sorting')}>
                    {items.map((it, i) => <TimelineRow key={it.id} it={it} lead={leads[i]} onOpen={open} />)}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="empty it-empty">
                <div className="it-empty__art" aria-hidden="true"><i /><i><Icon name="plus" /></i></div>
                <span className="empty__title">這天還沒有行程</span>
                <span className="small muted">留白也很好；想到要去哪再加進來就行。</span>
                <div className="it-empty__btns">
                  <Button variant="primary" onClick={() => openItemForm(null)}><Icon name="plus" />新增行程</Button>
                  <Button onClick={openVoiceTrip}><Icon bi="mic-fill" />語音新增</Button>
                </div>
              </div>
            )}
          </div>

          <DayRail items={items} span={span} date={date} stays={stays} />
        </div>

        <Fab label="新增行程" actions={itemActions} />
      </main>
      {overlay}
    </>
  );
}

/** 時間軸上的一列：分段標題／間隔＋行程卡（可拖曳排序） */
function TimelineRow({ it, lead, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: it.id });
  // 只允許上下移動
  const style = { transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined, transition };
  const transit = it.category === '交通';
  const p = period(it.time);
  const mapQuery = it.place || (it.image ? it.title : '');
  // 地圖按鈕不要觸發卡片的拖曳與點擊
  const stop = (e) => e.stopPropagation();

  return (
    <div className={cx('it-row', isDragging && 'is-dragging')} ref={setNodeRef} style={style}>
      {lead?.type === 'period' && (
        <div className="it-period"><span /><span className="it-period__mark" /><b>{lead.label} · {PERIOD_EN[lead.label]}</b></div>
      )}
      {lead?.type === 'gap' && (
        <div className={cx('it-gap', lead.mins >= 120 && 'it-gap--long')} aria-hidden="true">
          <span /><span /><span><Icon name="chevronDown" />{durText(lead.mins)}</span>
        </div>
      )}
      <div className="it-stop">
        <span className="it-time">
          <span className="it-time__clock">{it.time || '--:--'}</span>
          <span className="it-time__period">{p}</span>
        </span>
        <span className="it-dot" />
        <div className={cx('it-card', mapQuery && 'it-card--map')} {...attributes} {...listeners} role="button" tabIndex={0}
          aria-label={`查看：${it.title}`} aria-roledescription="可拖曳排序的行程"
          onClick={() => onOpen(it.id)}
          onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(it.id); } }}>
          {it.image ? (
            <span className="it-thumb"><img src={it.image} alt="" draggable="false" referrerPolicy="no-referrer" /></span>
          ) : (
            <span className={cx('it-thumb', 'it-thumb--icon', transit && 'it-thumb--transit')}>
              <Icon name={transit && /起飛|航班|班機/.test(it.title) ? 'plane' : catIcon(it.category)} />
            </span>
          )}
          <span className="it-body">
            <span className={cx('it-tag', transit && 'it-tag--transit')}><Icon name={catIcon(it.category)} />{it.category || '其他'}</span>
            <span className="it-title">{it.title}</span>
            {it.place && <span className="it-meta"><Icon name="pin" /><span>{it.place}</span></span>}
            {it.note && <span className="it-meta it-meta--note"><Icon name="alert" /><span>{it.note}</span></span>}
          </span>
          {mapQuery && (
            <a className="it-map" href={mapsUrl(mapQuery)} target="_blank" rel="noopener"
              onClick={stop} onMouseDown={stop} onTouchStart={stop} onKeyDown={stop}
              aria-label={`在 Google 地圖查看：${mapQuery}`}>
              <Icon name="map" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/** 寬螢幕右欄：當日概要＋當晚住宿 */
function DayRail({ items, span, date, stays }) {
  const counts = {};
  items.forEach((it) => { const c = it.category || '其他'; counts[c] = (counts[c] || 0) + 1; });
  const cats = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [from, to] = span ? span.split('–').map(toMin) : [0, 0];
  const hours = span ? Math.round((to - from) / 6) / 10 : 0;
  // 當晚住宿：入住日 ≤ 當天 < 退房日，找不到就用第一筆
  const stay = stays.find((s) => s.checkIn && s.checkOut && s.checkIn <= date && date < s.checkOut) || stays[0];
  const stayName = stay?.name || '';

  return (
    <aside className="it-rail" aria-label="當日概要">
      <div className="it-rail__inner">
        <section className="it-panel">
          <p className="it-panel__title">TODAY</p>
          <div className="it-stats">
            <div><b>{items.length}</b><span>行程</span></div>
            <div><b>{hours}</b><span>小時</span></div>
            <div><b>{counts.景點 || 0}</b><span>景點</span></div>
          </div>
          {cats.length > 0 && (
            <>
              <div className="it-mix" aria-hidden="true">
                {cats.map(([k, v]) => <i key={k} style={{ flexGrow: v, background: CAT_COLOR[k] || CAT_COLOR.其他 }} />)}
              </div>
              <div className="it-mix__legend">
                {cats.map(([k, v]) => <span key={k}><i style={{ background: CAT_COLOR[k] || CAT_COLOR.其他 }} />{k} {v}</span>)}
              </div>
            </>
          )}
        </section>
        {stayName && (
          <section className="it-panel">
            <p className="it-panel__title">STAY</p>
            <div className="it-stay">
              <span className="it-stay__icon"><Icon name="bed" /></span>
              <div>
                <strong>{stayName}</strong>
                {stay.address && <small>{stay.address}</small>}
                <a href={mapsUrl(stay.address || stayName)} target="_blank" rel="noopener">在地圖開啟 <Icon name="external" /></a>
              </div>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
