import { useEffect, useState } from 'react';
import { get, ref, update } from 'firebase/database';
import { auth, database, databasePath } from '../../services/firebase';
import { modal } from '../../stores/modalStore';
import { useTripStore } from '../../stores/tripStore';
import { publishSnapshot, revokeSnapshot } from './shareActions';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import './share.css';

export function openShare() { modal.open({ title: '分享公開', content: <ShareModal /> }); }
export const shareUrl = token => `${location.origin}${location.pathname}#/share/${token}`;
const errorText = '分享未完成。請確認網路與 Firebase 公開分享節點的權限設定，再重試。';

function ShareModal() {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let active = true;
    get(ref(database, `${databasePath}/shareLink`)).then(snapshot => { if (active) setMeta(snapshot.val()); })
      .catch(() => { if (active) setError(errorText); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function publish() {
    if (!auth.currentUser) { setError('請先登入再分享。'); return; }
    setBusy(true); setError(''); setCopied(false);
    try {
      const token = meta?.token || Array.from(crypto.getRandomValues(new Uint8Array(24)), n => n.toString(16).padStart(2, '0')).join('');
      const next = await publishSnapshot({ path: databasePath, state: useTripStore.getState(), token, write: changes => update(ref(database), changes) });
      setMeta(next);
    } catch { setError(errorText); } finally { setBusy(false); }
  }
  async function revoke() {
    if (!await modal.confirm({ title: '停止公開分享', message: '停止後，原本的分享連結將無法查看行程。', confirmText: '停止分享' })) return;
    setBusy(true); setError('');
    try {
      await revokeSnapshot({ path: databasePath, token: meta.token, write: changes => update(ref(database), changes) });
      setMeta(null); setCopied(false);
    } catch { setError(errorText); } finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(shareUrl(meta.token)); setCopied(true); }
    catch { setError('無法自動複製，請選取下方連結手動複製。'); }
  }
  return <div className="share-settings">
    <span className="share-eyebrow">SHARE YOUR JOURNEY</span>
    <h3>把旅程，分享出去。</h3>
    <p>任何取得連結的人都能查看行程，不需要登入，僅能瀏覽。</p>
    <div className="share-scope"><strong>公開內容</strong><p>旅程名稱、日期，以及各站的標題、時間、類別與地點。</p><small>住宿訂單、機票資料、備註、照片、打卡、待辦、角色對話與帳號資訊不會加入公開頁。行程標題及地點會公開，發布前請先確認。</small></div>
    <p className="share-version">採手動發布：修改行程後，按「更新公開行程」才會更新分享頁。</p>
    {loading ? <p role="status">正在讀取分享狀態…</p> : <>
      {meta?.token && <><label className="field"><span className="field__label">唯讀分享連結</span><input className="field__input" readOnly value={shareUrl(meta.token)} onFocus={e => e.target.select()} /></label>
        <div className="btn-row"><Button onClick={copy} disabled={busy}>{copied ? '已複製連結' : '複製連結'}</Button><a className="btn" href={shareUrl(meta.token)} target="_blank" rel="noopener noreferrer">查看公開頁</a></div>
        <small>上次發布：{new Date(meta.publishedAt).toLocaleString('zh-TW')}</small></>}
      <Button variant="primary" onClick={publish} disabled={busy || loading} block><Icon bi="globe2" />{busy ? '處理中…' : meta?.token ? '更新公開行程' : '發布公開行程'}</Button>
      {meta?.token && <Button onClick={revoke} disabled={busy} block>停止分享</Button>}
    </>}
    {error && <p className="share-error" role="alert">{error}</p>}
  </div>;
}
