import { Link } from 'react-router';
import { useTripStore } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import Icon from '../common/Icon';
import { tripRangeText } from '../../utils/date';
import { openTripForm } from '../../pages/itinerary/tripForm';

/** 旅程標題區＋工具列（行程頁、交通頁共用） */
export default function TripHeader() {
  const trip = useTripStore((s) => s.trip);
  return (
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
  );
}
