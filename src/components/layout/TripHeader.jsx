import { useTripStore } from '../../stores/tripStore';
import { useAuth } from '../../auth/AuthContext';
import Icon from '../common/Icon';
import { tripRangeText } from '../../utils/date';
import { openTripForm } from '../../pages/itinerary/tripForm';

/** 旅程標題區＋工具列（行程頁、交通頁共用） */
export default function TripHeader() {
  const trip = useTripStore((s) => s.trip);
  const { user, logout } = useAuth();

  async function confirmLogout() {
    if (window.confirm('要登出這個 Google 帳號嗎？')) await logout();
  }

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
        <button className="avatar" onClick={confirmLogout} aria-label={`${user?.displayName || 'Google 帳號'}，按一下登出`} title="登出 Google 帳號">
          {user?.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <Icon bi="person-fill" />}
        </button>
      </div>
    </header>
  );
}
