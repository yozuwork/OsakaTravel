import { Suspense, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { useTripStore } from '../../stores/tripStore';
import { TODO_TABS } from '../../data/constants';
import { tripRangeText } from '../../utils/date';
import { PageLoader } from '../../components/common/GlobalLoading';

export default function TodoLayout() {
  const trip = useTripStore((s) => s.trip);
  const { pathname } = useLocation();
  const current = TODO_TABS.find((t) => t.path === pathname.replace(/\/$/, '')) || TODO_TABS[0];
  const tabsRef = useRef(null);

  // 小螢幕子分頁可左右滑動：切換後把目前的分頁捲進畫面
  useEffect(() => {
    const bar = tabsRef.current;
    const el = bar?.querySelector('[aria-selected="true"]');
    if (!bar || !el) return;
    const left = el.offsetLeft - bar.offsetLeft;
    if (left < bar.scrollLeft || left + el.offsetWidth > bar.scrollLeft + bar.clientWidth) {
      bar.scrollTo({ left: left - 16, behavior: 'smooth' });
    }
  }, [current.id]);

  return (
    <>
      <header className="page-head page-head--flush">
        <h1 className="page-title">待辦與清單</h1>
        <div className="page-sub">{trip.name} · {tripRangeText(trip)}</div>
      </header>
      <div className="seg-tabs" role="tablist" aria-label="清單分類" ref={tabsRef}>
        {TODO_TABS.map((t) => (
          <Link key={t.id} to={t.path} replace className="seg-tab" role="tab" aria-selected={t.id === current.id}>{t.label}</Link>
        ))}
      </div>
      <main className={`content content--${current.id}`}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}
