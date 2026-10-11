import { useEffect, useRef, useState } from 'react';
import { useCloudStatus } from '../../services/cloudSync';
import Icon from './Icon';

const SAVED_MS = 1600; // 「已儲存」停留多久後收起

/**
 * 雲端同步狀態：浮在畫面上方的小膠囊，不佔版面
 * - 有寫入（saving）時才出現「同步中…」，完成後顯示「已儲存到雲端」再自動收起
 * - 開 App 時的讀取（loading）不顯示，避免每次打開都跳一下
 * - 同步失敗會一直顯示，直到重試成功
 */
export default function CloudSyncStatus() {
  const documents = useCloudStatus((s) => s.documents);
  const values = Object.values(documents);
  const failed = values.includes('error');
  const saving = values.includes('saving');
  const [phase, setPhase] = useState('hidden'); // hidden | saving | saved
  const timer = useRef(null);

  const wasSaving = useRef(false);

  useEffect(() => {
    clearTimeout(timer.current);
    if (saving) { wasSaving.current = true; setPhase('saving'); return; }
    if (!wasSaving.current) return;
    wasSaving.current = false;
    setPhase('saved');
    timer.current = setTimeout(() => setPhase('hidden'), SAVED_MS);
  }, [saving]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const state = failed ? 'error' : phase;
  return (
    <div className={'sync-pill' + (state !== 'hidden' ? ' is-show' : '')} data-state={state}
      role={failed ? 'alert' : 'status'} aria-live="polite">
      {state === 'error' && <><Icon bi="exclamation-triangle-fill" />雲端同步失敗，會自動重試；請確認網路</>}
      {state === 'saving' && <><span className="sync-pill__spin" aria-hidden="true" />同步中…</>}
      {state === 'saved' && <><Icon bi="cloud-check-fill" />已儲存到雲端</>}
    </div>
  );
}
