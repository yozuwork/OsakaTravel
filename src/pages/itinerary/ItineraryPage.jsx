import { useCallback, useMemo, useRef } from 'react';
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
import { openItemForm } from './itemForm';
import { openItemDetail } from './itemDetail';
import { openVoiceTrip } from './VoiceTripInput';

// 手機版 + 按鈕的選項
const itemActions = addActions({ voiceDesc: '用說的快速建立行程', textDesc: '手動輸入詳細內容', onText: () => openItemForm(null), onVoice: openVoiceTrip });

export default function ItineraryPage() {
  const trip = useTripStore((s) => s.trip);
  const allItems = useTripStore((s) => s.items);
  const uiDay = useTripStore((s) => s.ui.day);
  const day = Math.min(uiDay, trip.days - 1);

  const items = useMemo(
    () => dayItems(allItems, day),
    [allItems, day]
  );

  const tabsRef = useRef(null);
  const listRef = useRef(null);
  const applyDay = useCallback((i) => updateTrip((s) => { s.ui.day = i; }), []);
  // 漫畫分格上的文字：D2／DAY 2 · 星期二／12/22／當天第一個行程
  const dayInfo = useCallback((i) => {
    const date = addDays(trip.startDate, i);
    const first = dayItems(allItems, i)[0];
    return {
      d: `D${i + 1}`,
      tag: `DAY ${i + 1} · 星期${WEEK[parseDate(date).getDay()]}`,
      date: md(date),
      caption: first ? `${first.time || '--:--'}　${first.title}` : ''
    };
  }, [trip.startDate, allItems]);
  // 切換日期：漫畫斜切轉場，只蓋住日期按鈕下方的列表區
  const { pressedDay, switchDay, overlay } = useMangaDaySwitch({
    current: day, onSwitch: applyDay, getInfo: dayInfo, anchorRef: tabsRef, boundsRef: tabsRef, listRef
  });

  // 拖曳排序：滑鼠移動 6px 才算拖曳；手機要長按 250ms，避免和捲動、點擊衝突
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } })
  );
  const dragged = useRef(false);

  function dragEnd({ active, over }) {
    // 放開後瀏覽器仍會觸發一次 click，延遲清掉旗標以略過它
    setTimeout(() => { dragged.current = false; });
    if (!over || active.id === over.id) return;
    const index = items.findIndex((it) => it.id === over.id);
    updateTrip((s) => placeItem(s, active.id, index));
  }

  function open(id) {
    if (!dragged.current) openItemDetail(id);
  }

  return (
    <>
      <TripHeader />

      <div className="day-tabs" role="group" aria-label="選擇日期" ref={tabsRef}>
        {Array.from({ length: trip.days }, (_, i) => (
          <button key={i} type="button" className="day-tab" aria-pressed={i === pressedDay} onClick={() => switchDay(i)}>
            <span className="day-tab__date">{md(addDays(trip.startDate, i))}</span>
            <span className="day-tab__label">D{i + 1}</span>
          </button>
        ))}
      </div>

      <main className="content content--itinerary" ref={listRef}>
        <div className="row-between" style={{ maxWidth: 884 }}>
          <h2 className="section-title">D{day + 1} · {mdw(addDays(trip.startDate, day))}</h2>
          <span className="small muted">{items.length} 個行程</span>
        </div>

        {items.length ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => { dragged.current = true; }} onDragEnd={dragEnd} onDragCancel={dragEnd}>
            <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
              <div className="timeline">
                {items.map((it) => <TimelineRow key={it.id} it={it} onOpen={open} />)}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="empty">
            <Icon name="calendar" />
            <span className="empty__title">這天還沒有行程</span>
            <span className="small muted">點「＋」新增行程開始安排</span>
          </div>
        )}

        <Button variant="dashed" className="add-inline" onClick={() => openItemForm(null)}><Icon name="plus" />新增行程</Button>
        <Fab label="新增行程" actions={itemActions} />
      </main>
      {overlay}
    </>
  );
}

/** 時間軸上的一張行程卡（可拖曳排序） */
function TimelineRow({ it, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: it.id });
  // 只允許上下移動
  const style = { transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined, transition };

  return (
    <div className={cx('tl-row', isDragging && 'is-dragging')} ref={setNodeRef} style={style}>
      <span className="tl-time">
        <span className="tl-time__period">{period(it.time)}</span>
        <span className="tl-time__clock">{it.time || '--:--'}</span>
      </span>
      <span className="tl-dot" />
      <div className="tl-card" {...attributes} {...listeners} role="button" tabIndex={0} aria-label={`查看：${it.title}`}
        aria-roledescription="可拖曳排序的行程"
        onClick={() => onOpen(it.id)}
        onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(it.id); } }}>
        {it.image ? (
          <span className="tl-thumb">
            <img src={it.image} alt="" draggable="false" />
            <a className="tl-thumb__map" href={mapsUrl(it.place || it.title)} target="_blank" rel="noopener"
              onClick={(e) => e.stopPropagation()} aria-label={`在 Google 地圖查看：${it.place || it.title}`}>
              <Icon name="map" />
            </a>
          </span>
        ) : (
          <span className="tl-thumb tl-thumb--icon">
            <Icon name={catIcon(it.category)} />
            <span className="tl-thumb__label">{it.category || '其他'}</span>
          </span>
        )}
        <span className="tl-right">
          <span className="tl-title">{it.title}</span>
          {it.place && <span className="tl-meta"><Icon name="pin" /><span>{it.place}</span></span>}
          {it.note && <span className="tl-meta"><Icon name="alert" /><span>{it.note}</span></span>}
        </span>
      </div>
    </div>
  );
}
