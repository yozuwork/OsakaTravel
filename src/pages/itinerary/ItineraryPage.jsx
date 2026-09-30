import { useMemo } from 'react';
import { useTripStore, updateTrip } from '../../stores/tripStore';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import TripHeader from '../../components/layout/TripHeader';
import { mapsUrl } from '../../utils/helpers';
import { addDays, md, mdw, period } from '../../utils/date';
import { openItemForm } from './itemForm';
import { openItemDetail } from './itemDetail';

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
      <TripHeader />

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
                <div className="tl-card" role="button" tabIndex={0} aria-label={`查看：${it.title}`}
                  onClick={() => openItemDetail(it.id)}
                  onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openItemDetail(it.id); } }}>
                  <span className="tl-left">
                    <span className="tl-time">
                      <span className="tl-time__period">{period(it.time)}</span>
                      <span className="tl-time__clock">{it.time || '--:--'}</span>
                    </span>
                    <a className="chip" href={mapsUrl(it.place || it.title)} target="_blank" rel="noopener"
                      onClick={(e) => e.stopPropagation()} aria-label={`在 Google 地圖查看：${it.place || it.title}`}>
                      <Icon name="map" />地圖
                    </a>
                  </span>
                  <span className="tl-right">
                    <span className="tl-title">{it.title}</span>
                    {it.place && <span className="tl-meta"><Icon name="pin" /><span>{it.place}</span></span>}
                    {it.note && <span className="tl-meta"><Icon name="alert" /><span>{it.note}</span></span>}
                  </span>
                </div>
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
