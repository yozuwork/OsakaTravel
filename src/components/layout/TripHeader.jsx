import { useEffect, useRef, useState } from 'react';
import { useTripStore } from '../../stores/tripStore';
import { modal } from '../../stores/modalStore';
import { openDialogue } from '../../stores/dialogueStore';
import { openSettings } from '../settings/SettingsModal';
import { openDialogueEditor } from '../dialogue/DialogueEditor';
import { useAuth } from '../../auth/AuthContext';
import Icon from '../common/Icon';
import { openTripForm } from '../../pages/itinerary/tripForm';
import { openShare } from '../../pages/share/ShareModal';
import { addDays, diffDays, md, parseDate, toISO } from '../../utils/date';

/** 出發倒數：出發前「倒數 N 天」、旅程中「旅程第 N 天」、結束後不顯示 */
function countdownText(startDate, days) {
  const n = diffDays(toISO(new Date()), startDate);
  if (n > 0) return <>倒數 <b>{n}</b> 天</>;
  if (n > -days) return <>旅程第 <b>{1 - n}</b> 天</>;
  return null;
}

/** 旅程標題區＋工具列（行程頁、交通頁共用） */
export default function TripHeader() {
  const trip = useTripStore((s) => s.trip);
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);
  const name = user?.displayName || 'Google 帳號';

  // 選單開啟時：點外面或按 Esc 關閉，並聚焦第一個選項
  useEffect(() => {
    if (!menuOpen) return;
    const wrap = wrapRef.current;
    wrap.querySelector('[role="menuitem"]')?.focus();
    const onDown = (e) => { if (!wrap.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') { setMenuOpen(false); wrap.querySelector('.avatar')?.focus(); } };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  function talk() {
    setMenuOpen(false);
    openDialogue();
  }

  function editDialogue() {
    setMenuOpen(false);
    openDialogueEditor();
  }

  function settings() {
    setMenuOpen(false);
    openSettings();
  }

  async function confirmLogout() {
    setMenuOpen(false);
    if (await modal.confirm({ title: '登出', message: `要登出「${name}」嗎？`, confirmText: '登出' })) await logout();
  }

  const end = addDays(trip.startDate, trip.days - 1);
  const countdown = countdownText(trip.startDate, trip.days);

  return (
    <header className={`page-head page-head--flush trip-head${menuOpen ? ' trip-head--menu-open' : ''}`}>
      {trip.en && <span className="trip-head__mark" aria-hidden="true">{trip.en.toUpperCase()}</span>}
      <div className="page-head__row page-head__row--center">
        <div className="trip-head__main">
          <p className="trip-head__eyebrow"><Icon name="plane" />{trip.from} → {trip.to} · {parseDate(trip.startDate).getFullYear()}</p>
          <button className="trip-title" onClick={openTripForm} aria-label="編輯旅程資訊">
            <span className="trip-title__name">{trip.name}</span>
            <Icon name="edit" className="trip-title__edit" />
          </button>
          <div className="trip-head__meta">
            <span>{md(trip.startDate)} – {md(end)}</span>
            <i aria-hidden="true" />
            <span>{trip.days} 天 {Math.max(trip.days - 1, 0)} 夜</span>
            {countdown && <><i aria-hidden="true" /><span className="trip-head__count">{countdown}</span></>}
          </div>
        </div>
        <div className="avatar-wrap" ref={wrapRef}>
          <button className="avatar" onClick={() => setMenuOpen((v) => !v)} aria-label={`${name}的選單：和角色對話、編輯對話、分享公開、設定、登出`}
            aria-haspopup="menu" aria-expanded={menuOpen} title={name}>
            {user?.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <Icon bi="person-fill" />}
          </button>
          {menuOpen && (
            <div className="avatar-menu" role="menu" aria-label={`${name}的選單`}>
              <button type="button" role="menuitem" className="avatar-menu__item" onClick={talk}><Icon bi="chat-quote-fill" />和角色對話</button>
              <button type="button" role="menuitem" className="avatar-menu__item" onClick={editDialogue}><Icon bi="pencil-square" />編輯對話</button>
              <button type="button" role="menuitem" className="avatar-menu__item" onClick={() => { setMenuOpen(false); openShare(); }}><Icon bi="globe2" />分享公開</button>
              <button type="button" role="menuitem" className="avatar-menu__item" onClick={settings}><Icon bi="gear-fill" />設定</button>
              <button type="button" role="menuitem" className="avatar-menu__item" onClick={confirmLogout}><Icon bi="box-arrow-right" />登出</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
