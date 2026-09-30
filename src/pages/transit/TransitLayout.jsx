import { Suspense } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { TRANSIT_TABS } from '../../data/constants';
import TripHeader from '../../components/layout/TripHeader';
import { PageLoader } from '../../components/common/GlobalLoading';

export default function TransitLayout() {
  const { pathname } = useLocation();
  const current = TRANSIT_TABS.find((t) => t.path === pathname.replace(/\/$/, '')) || TRANSIT_TABS[0];

  return (
    <>
      <TripHeader />
      <div className="day-tabs day-tabs--transit" role="tablist" aria-label="交通分類">
        {TRANSIT_TABS.map((t) => (
          <Link key={t.id} to={t.path} replace className="day-tab" role="tab" aria-selected={t.id === current.id}>
            <span className="day-tab__date">{t.sub}</span>
            <span className="day-tab__label">{t.label}</span>
          </Link>
        ))}
      </div>
      <main className={`content content--transit content--transit-${current.id}`}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}
