import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useTripStore } from '../../stores/tripStore';
import { useUiStore, setMoreOpen } from '../../stores/uiStore';
import { NAV_ITEMS, MORE_ITEMS } from '../../data/constants';
import Icon from '../common/Icon';
import { cx } from '../../utils/helpers';
import { usePageTransition } from '../transition/PageTransition';

const MORE_COLS = 3;
const isAt = (pathname, to) => pathname === to || pathname.startsWith(to + '/');

/**
 * 手機：底部選單（固定 4 格 + 「更多」面板）；桌機（≥ 900px）：左側選單，全部分頁直接列出
 */
export default function TabBar() {
  const trip = useTripStore((s) => s.trip);
  const open = useUiStore((s) => s.moreOpen);
  const { pathname } = useLocation();
  const { goPage, isBusy } = usePageTransition();
  const moreBtn = useRef(null);
  const panel = useRef(null);

  const moreCurrent = MORE_ITEMS.find((n) => isAt(pathname, n.to)); // 目前頁面在「更多」裡
  const placeholders = (MORE_COLS - (MORE_ITEMS.length % MORE_COLS)) % MORE_COLS; // 補滿最後一排

  // 換頁就收起面板；離開元件時也重設（避免 FAB 一直被藏住）
  useEffect(() => { setMoreOpen(false); }, [pathname]);
  useEffect(() => () => setMoreOpen(false), []);

  // 面板打開：Esc 關閉、焦點移到第一個項目
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector('.more-item')?.focus();
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function close() {
    setMoreOpen(false);
    moreBtn.current?.focus();
  }

  // 切換到其他分頁：先播轉場動畫，碎片蓋滿畫面時才換頁
  function go(e, n) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // 開新分頁等照瀏覽器預設
    setMoreOpen(false);
    if (isBusy()) { e.preventDefault(); return; }
    if (isAt(pathname, n.to)) return; // 目前分頁：不播動畫，照原本行為導頁
    e.preventDefault();
    goPage(n.to, n);
  }

  const link = (n, extra) => (
    <NavLink key={n.to} to={n.to} className={cx('tabbar__item', extra && 'tabbar__item--extra')} onClick={(e) => go(e, n)}>
      <span className="tabbar__icon"><Icon name={n.icon} bi={n.bi} /></span>
      <span className="tabbar__label">{n.label}</span>
    </NavLink>
  );

  return (
    <>
      {open && (
        <div className="more-panel" id="more-panel">
          <div className="more-panel__backdrop" onClick={close} />
          <div className="more-panel__card" ref={panel} role="dialog" aria-label="更多功能">
            <div className="more-panel__head">
              <h2 className="more-panel__title">更多功能</h2>
              <button type="button" className="more-panel__close" onClick={close} aria-label="關閉"><Icon name="x" /></button>
            </div>
            <div className="more-panel__grid" style={{ '--cols': MORE_COLS }}>
              {MORE_ITEMS.map((n) => (
                <NavLink key={n.to} to={n.to} className="more-item" onClick={(e) => go(e, n)}>
                  <span className="more-item__icon"><Icon name={n.icon} bi={n.bi} /></span>
                  <span className="more-item__label">{n.label}</span>
                </NavLink>
              ))}
              {Array.from({ length: placeholders }, (_, i) => (
                <div key={i} className="more-item more-item--empty" aria-hidden="true">
                  <span className="more-item__icon"><Icon name="plus" /></span>
                  <span className="more-item__label">預留位置</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <nav className="tabbar" aria-label="主選單">
        <div className="tabbar__brand">
          <Icon name="plane" />
          <span><strong>{trip.name}</strong><small>{trip.from} → {trip.to}</small></span>
        </div>
        {NAV_ITEMS.map((n) => link(n))}
        {MORE_ITEMS.map((n) => link(n, true))}
        <button type="button" ref={moreBtn}
          className={cx('tabbar__item', 'tabbar__more', open && 'is-open', moreCurrent && 'is-current')}
          onClick={() => setMoreOpen(!open)}
          aria-haspopup="dialog" aria-expanded={open} aria-controls="more-panel"
          aria-label={moreCurrent ? `更多（目前：${moreCurrent.label}）` : '更多'}>
          <span className="tabbar__icon"><Icon bi="three-dots" /></span>
          <span className="tabbar__label">更多</span>
          {moreCurrent && <span className="tabbar__badge" aria-hidden="true">{moreCurrent.label}</span>}
        </button>
      </nav>
    </>
  );
}
