import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { allowedFirebaseUid, auth } from '../services/firebase';
import { startTripSync, stopTripSync } from '../stores/tripStore';

const AuthContext = createContext(null);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function isAllowed(user) {
  const usesGoogle = user?.providerData?.some((provider) => provider.providerId === 'google.com');
  return Boolean(allowedFirebaseUid && user?.uid === allowedFirebaseUid && usesGoogle && user.emailVerified);
}

function authErrorMessage(error) {
  if (error?.code === 'auth/popup-closed-by-user') return '登入視窗已關閉，請再試一次。';
  if (error?.code === 'auth/popup-blocked') return '瀏覽器阻擋了登入視窗，請允許彈出式視窗後重試。';
  if (error?.code === 'auth/operation-not-allowed') return '請先在 Firebase Authentication 啟用 Google 登入。';
  if (error?.code === 'auth/unauthorized-domain') return '目前網域尚未加入 Firebase 授權網域。';
  return 'Google 登入失敗，請稍後再試。';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser && !isAllowed(nextUser)) {
        stopTripSync();
        setUser(null);
        setError('此 Google 帳號沒有行程存取權限。');
        await signOut(auth);
      } else {
        setUser(nextUser);
        setError('');
        if (nextUser) startTripSync();
        else stopTripSync();
      }
      setChecking(false);
    });

    return () => {
      unsubscribe();
      stopTripSync();
    };
  }, []);

  async function login() {
    if (!allowedFirebaseUid) {
      setError('登入功能尚未完成設定，請聯絡管理者。');
      return;
    }

    setError('');
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, googleProvider);
      if (!isAllowed(result.user)) {
        await signOut(auth);
        setError('此 Google 帳號沒有行程存取權限。');
      }
    } catch (loginError) {
      setError(authErrorMessage(loginError));
    }
  }

  async function logout() {
    stopTripSync();
    await signOut(auth);
  }

  const value = useMemo(
    () => ({ user, checking, error, login, logout, isConfigured: Boolean(allowedFirebaseUid) }),
    [user, checking, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth 必須在 AuthProvider 內使用');
  return context;
}
