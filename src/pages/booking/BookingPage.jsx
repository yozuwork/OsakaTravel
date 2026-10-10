import { useTripStore } from '../../stores/tripStore';
import { tripRangeText } from '../../utils/date';
import FlightTab from '../todo/FlightTab';

/** 機票：顯示我的航班（和「待辦 › 班機」同一份資料、同一個卡片） */
export default function BookingPage() {
  const trip = useTripStore((s) => s.trip);
  return (
    <>
      <header className="page-head">
        <h1 className="page-title">機票</h1>
        <div className="page-sub">{trip.name} · {tripRangeText(trip)}</div>
      </header>
      <main className="content content--flight">
        <FlightTab />
      </main>
    </>
  );
}
