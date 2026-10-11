import { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { hideSplash } from '../utils/splash';
import { useCloudStatus } from '../services/cloudSync';
import { useSettingsStore } from '../stores/settingsStore';

export default function AuthGate({ children }) {
  const { user, checking, error, login, isConfigured } = useAuth();
  const tripReady = useCloudStatus((s) => s.readyDocuments.trip);
  const tripStatus = useCloudStatus((s) => s.documents.trip);
  const settingsReady = useCloudStatus((s) => s.readyDocuments.settings);
  const settingsStatus = useCloudStatus((s) => s.documents.settings);
  const splashMobile = useSettingsStore((s) => s.splashMobile);
  const splashDesktop = useSettingsStore((s) => s.splashDesktop);

  // 確認完登入狀態（不論已登入或要顯示登入畫面）就淡出開啟畫面
  useEffect(() => {
    const picture = document.querySelector('#splash picture');
    if (picture && settingsReady) {
      if (splashMobile) picture.querySelector('img').src = splashMobile;
      if (splashDesktop) picture.querySelector('source').srcset = splashDesktop;
    }
    if (!checking && (!user || settingsReady || settingsStatus === 'error')) hideSplash();
  }, [checking, user, settingsReady, settingsStatus, splashMobile, splashDesktop]);

  if (checking) {
    return (
      <main className="auth-screen" aria-busy="true">
        <div className="auth-card">
          <span className="spinner spinner--lg" aria-hidden="true" />
          <p>確認登入狀態中…</p>
        </div>
      </main>
    );
  }

  if (user && !tripReady) return (
    <main className="auth-screen" aria-busy={tripStatus !== 'error'}>
      <div className="auth-card">
        {tripStatus === 'error' ? <p role="alert">無法讀取雲端行程，正在重試。請確認網路連線及資料庫存取權限。</p> : <><span className="spinner spinner--lg" aria-hidden="true" /><p>讀取雲端行程中…</p></>}
      </div>
    </main>
  );
  if (user) return children;

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-mark" aria-hidden="true">大阪</div>
        <div>
          <p className="auth-eyebrow">PRIVATE TRIP</p>
          <h1 id="auth-title">大阪旅行手帳</h1>
          <p className="auth-copy">這是私人行程，請使用已授權的 Google 帳號登入。</p>
        </div>
        <button className="btn btn--google btn--block" type="button" onClick={login} disabled={!isConfigured}>
          <span className="google-g" aria-hidden="true">G</span>
          使用 Google 帳號登入
        </button>
        {!isConfigured && <p className="auth-error">登入功能尚未完成設定，請聯絡管理者。</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <p className="auth-note">只有指定帳號能讀取或修改雲端行程。</p>
      </section>
    </main>
  );
}
