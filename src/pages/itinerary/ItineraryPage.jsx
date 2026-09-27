import { useMemo } from 'react';
import { Link } from 'react-router';
import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { catIcon } from '../../data/constants';
import { addDays, md, mdw, period, tripRangeText } from '../../utils/date';
import { openItemForm } from './itemForm';
import { openTripForm } from './tripForm';

export default function ItineraryPage() {
  const trip = useTripStore((s) => s.trip);
  const allItems = useTripStore((s) => s.items);
  const uiDay = useTripStore((s) => s.ui.day);
  const day = Math.min(uiDay, trip.days - 1);

  const items = useMemo(
    () => allItems.filter((it) => it.day === day).sort((a, b) => (a.time || '99').localeCompare(b.time || '99')),
    [allItems, day]
  );

  const setDay = (i) => updateTrip((s) => { s.ui.day = i; });

  return (
    <>
      <header className="page-head page-head--flush">
        <div className="page-head__row">
          <div>
            <button className="trip-title" onClick={openTripForm} aria-label="編輯旅程資訊">
              <Icon name="plane" />
              <span><span className="trip-title__name">{trip.name}</span><span className="trip-title__en">{trip.en}</span></span>
            </button>
            <div className="page-sub">{tripRangeText(trip)}</div>
          </div>
          <nav className="tools" aria-label="行程工具">
            <a className="tools__btn" href="https://translate.google.com/?sl=zh-TW&tl=ja&op=translate" target="_blank" rel="noopener" aria-label="翻譯（開新分頁）"><Icon name="translate" /></a>
            <Link className="tools__btn" to="/todo" aria-label="行前待辦"><Icon name="calendar" /></Link>
            <Link className="tools__btn" to="/map" aria-label="地圖"><Icon name="map" /></Link>
            <button className="tools__btn" onClick={() => toast('記帳功能規劃中')} aria-label="記帳"><Icon name="dollar" /></button>
          </nav>
        </div>
      </header>

      <div className="day-tabs" role="tablist" aria-label="選擇日期">
        {Array.from({ length: trip.days }, (_, i) => (
          <button key={i} className="day-tab" role="tab" aria-selected={i === day} onClick={() => setDay(i)}>
            <span className="day-tab__date">{md(addDays(trip.startDate, i))}</span>
            <span className="day-tab__label">D{i + 1}</span>
          </button>
        ))}
      </div>

      <main className="content content--itinerary">
        <div className="row-between" style={{ maxWidth: 884 }}>
          <h2 className="section-title">D{day + 1} · {mdw(addDays(trip.startDate, day))}</h2>
          <span className="small muted">{items.length} 個行程</span>
        </div>

        {items.length ? (
          <div className="timeline">
            {items.map((it) => (
              <div className="tl-row" key={it.id}>
                <span className="tl-dot" />
                <button className="tl-card" onClick={() => openItemForm(it.id)} aria-label={`編輯：${it.title}`}>
                  <span className="tl-left">
                    <span className="tl-time">
                      <span className="tl-time__period">{period(it.time)}</span>
                      <span className="tl-time__clock">{it.time || '--:--'}</span>
                    </span>
                    <span className="chip"><Icon name={catIcon(it.category)} />{it.category}</span>
                  </span>
                  <span className="tl-right">
                    <span className="tl-title">{it.title}</span>
                    {it.place && <span className="tl-meta"><Icon name="pin" /><span>{it.place}</span></span>}
                    {it.note && <span className="tl-meta"><Icon name="alert" /><span>{it.note}</span></span>}
                  </span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <Icon name="calendar" />
            <span className="empty__title">這天還沒有行程</span>
            <span className="small muted">點下方「新增行程」開始安排</span>
          </div>
        )}

        <Button variant="dashed" onClick={() => openItemForm(null)}><Icon name="plus" />新增行程</Button>
      </main>
    </>
  );
}
