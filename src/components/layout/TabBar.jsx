import { NavLink, useLocation } from 'react-router';
import { useTripStore } from '../../stores/tripStore';
import { NAV_ITEMS } from '../../data/constants';
import Icon from '../common/Icon';
import { usePageTransition } from '../transition/PageTransition';

/** 手機：底部選單；桌機（≥ 900px）：左側選單 */
export default function TabBar() {
  const trip = useTripStore((s) => s.trip);
  const { pathname } = useLocation();
  const { goPage, isBusy } = usePageTransition();

  // 切換到其他分頁：先播轉場動畫，碎片蓋滿畫面時才換頁
  function go(e, n) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // 開新分頁等照瀏覽器預設
    if (isBusy()) { e.preventDefault(); return; }
    const isCurrent = pathname === n.to || pathname.startsWith(n.to + '/');
    if (isCurrent) return; // 目前分頁：不播動畫，照原本行為導頁
    e.preventDefault();
    goPage(n.to, n);
  }

  return (
    <nav className="tabbar" aria-label="主選單">
      <div className="tabbar__brand">
        <Icon name="plane" />
        <span><strong>{trip.name}</strong><small>{trip.from} → {trip.to}</small></span>
      </div>
      {NAV_ITEMS.map((n) => (
        <NavLink key={n.to} to={n.to} className="tabbar__item" onClick={(e) => go(e, n)}>
          <span className="tabbar__icon"><Icon name={n.icon} /></span>
          <span className="tabbar__label">{n.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
