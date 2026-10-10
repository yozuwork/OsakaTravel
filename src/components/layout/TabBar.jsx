import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router';
import { useTripStore } from '../../stores/tripStore';
import { NAV_ITEMS } from '../../data/constants';
import { cx } from '../../utils/helpers';
import Icon from '../common/Icon';
import { usePageTransition } from '../transition/PageTransition';

const MORE_ITEMS = NAV_ITEMS.filter((n) => n.more);

const NavIcon = ({ n }) => <Icon name={n.icon} bi={n.bi} />;

/** 手機：底部選單（more 的項目收進「更多」）；桌機（≥ 900px）：左側選單全部列出 */
export default function TabBar() {
  const trip = useTripStore((s) => s.trip);
  const { pathname } = useLocation();
  const { goPage, isBusy } = usePageTransition();
  const [moreOpen, setMoreOpen] = useState(false);
  const isCurrent = (n) => pathname === n.to || pathname.startsWith(n.to + '/');
  const moreCurrent = MORE_ITEMS.some(isCurrent);

  // 換頁後收起「更多」
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMoreOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  // 切換到其他分頁：先播轉場動畫，碎片蓋滿畫面時才換頁
  function go(e, n) {
    setMoreOpen(false);
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // 開新分頁等照瀏覽器預設
    if (isBusy()) { e.preventDefault(); return; }
    if (isCurrent(n)) return; // 目前分頁：不播動畫，照原本行為導頁
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
        <NavLink key={n.to} to={n.to} className={cx('tabbar__item', n.more && 'tabbar__item--more')} onClick={(e) => go(e, n)}>
          <span className="tabbar__icon"><NavIcon n={n} /></span>
          <span className="tabbar__label">{n.label}</span>
        </NavLink>
      ))}

      {/* 手機版才有：「更多」按鈕與彈出選單 */}
      <button type="button" className={cx('tabbar__item tabbar__more', moreCurrent && 'is-current')}
        aria-expanded={moreOpen} aria-haspopup="true" onClick={() => setMoreOpen((v) => !v)}>
        <span className="tabbar__icon"><Icon bi="grid-fill" /></span>
        <span className="tabbar__label">更多</span>
      </button>
      {/* 掛到 body：.tabbar 有 transform，裡面的 position: fixed 會被侷限在選單列內 */}
      {moreOpen && createPortal(
        <>
          <div className="tabbar__more-backdrop" onClick={() => setMoreOpen(false)} />
          <div className="tabbar__more-menu" role="menu" aria-label="更多">
            {MORE_ITEMS.map((n) => (
              <NavLink key={n.to} to={n.to} role="menuitem" className="tabbar__more-link" onClick={(e) => go(e, n)}>
                <NavIcon n={n} />{n.label}
              </NavLink>
            ))}
          </div>
        </>,
        document.body
      )}
    </nav>
  );
}
