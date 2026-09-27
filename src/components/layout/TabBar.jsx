import { NavLink } from 'react-router';
import { useTripStore } from '../../stores/tripStore';
import { NAV_ITEMS } from '../../data/constants';
import Icon from '../common/Icon';

/** 手機：底部選單；桌機（≥ 900px）：左側選單 */
export default function TabBar() {
  const trip = useTripStore((s) => s.trip);
  return (
    <nav className="tabbar" aria-label="主選單">
      <div className="tabbar__brand">
        <Icon name="plane" />
        <span><strong>{trip.name}</strong><small>{trip.from} → {trip.to}</small></span>
      </div>
      {NAV_ITEMS.map((n) => (
        <NavLink key={n.to} to={n.to} className="tabbar__item">
          <span className="tabbar__icon"><Icon name={n.icon} /></span>
          <span className="tabbar__label">{n.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
