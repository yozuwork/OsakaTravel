import { Suspense, useEffect } from 'react';
import { Outlet, useLocation, useMatches } from 'react-router';
import { useTripStore } from '../../stores/tripStore';
import TabBar from './TabBar';
import ModalRoot from '../modal/ModalRoot';
import Toast from '../common/Toast';
import GlobalLoading, { PageLoader } from '../common/GlobalLoading';
import { PageTransitionProvider } from '../transition/PageTransition';
import CharacterDialogue from '../dialogue/CharacterDialogue';
import { openDialogue } from '../../stores/dialogueStore';
import { splashGone } from '../../utils/splash';
import { DIALOGUE_SCRIPT } from '../../data/dialogueScript';

export default function AppLayout() {
  const tripName = useTripStore((s) => s.trip.name);
  const { pathname } = useLocation();
  const matches = useMatches();
  const pageTitle = [...matches].reverse().find((m) => m.handle?.title)?.handle.title;

  useEffect(() => {
    document.title = pageTitle ? `${tripName}｜${pageTitle}` : tripName;
  }, [tripName, pageTitle]);

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  // 開啟畫面消失約 0.5 秒後自動播放角色對話（之後可從頭像選單重新開啟）
  useEffect(() => {
    let t;
    let cancelled = false;
    splashGone.then(() => { if (!cancelled) t = setTimeout(openDialogue, 500); });
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  return (
    <PageTransitionProvider>
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
      <CharacterDialogue script={DIALOGUE_SCRIPT} />
    </PageTransitionProvider>
  );
}
