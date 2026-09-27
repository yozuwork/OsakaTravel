import { Suspense, useEffect } from 'react';
import { Outlet, useLocation, useMatches } from 'react-router';
import { useTripStore } from '../../stores/tripStore';
import TabBar from './TabBar';
import ModalRoot from '../modal/ModalRoot';
import Toast from '../common/Toast';
import GlobalLoading, { PageLoader } from '../common/GlobalLoading';

export default function AppLayout() {
  const tripName = useTripStore((s) => s.trip.name);
  const { pathname } = useLocation();
  const matches = useMatches();
  const pageTitle = [...matches].reverse().find((m) => m.handle?.title)?.handle.title;

  useEffect(() => {
    document.title = pageTitle ? `${tripName}｜${pageTitle}` : tripName;
  }, [tripName, pageTitle]);

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <>
      <div className="app">
        <div className="view">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
        <TabBar />
      </div>
      {/* 全站共用：彈出視窗、Toast、全局 Loading */}
      <ModalRoot />
      <Toast />
      <GlobalLoading />
    </>
  );
}
