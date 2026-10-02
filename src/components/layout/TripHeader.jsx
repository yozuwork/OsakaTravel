import { useEffect, useRef, useState } from 'react';
import { useTripStore } from '../../stores/tripStore';
import { modal } from '../../stores/modalStore';
import { openDialogue } from '../../stores/dialogueStore';
import { openSettings } from '../settings/SettingsModal';
import { openDialogueEditor } from '../dialogue/DialogueEditor';
import { useAuth } from '../../auth/AuthContext';
import Icon from '../common/Icon';
import { openTripForm } from '../../pages/itinerary/tripForm';

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

  return (
    <header className="page-head page-head--flush">
      <div className="page-head__row page-head__row--center">
        <button className="trip-title" onClick={openTripForm} aria-label="編輯旅程資訊">
          <Icon name="plane" />
          <span className="trip-title__name">{trip.name}</span>
        </button>
        <div className="avatar-wrap" ref={wrapRef}>
          <button className="avatar" onClick={() => setMenuOpen((v) => !v)} aria-label={`${name}的選單：和角色對話、編輯對話、設定、登出`}
            aria-haspopup="menu" aria-expanded={menuOpen} title={name}>
            {user?.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <Icon bi="person-fill" />}
          </button>
          {menuOpen && (
            <div className="avatar-menu" role="menu" aria-label={`${name}的選單`}>
              <button type="button" role="menuitem" className="avatar-menu__item" onClick={talk}><Icon bi="chat-quote-fill" />和角色對話</button>
              <button type="button" role="menuitem" className="avatar-menu__item" onClick={editDialogue}><Icon bi="pencil-square" />編輯對話</button>
              <button type="button" role="menuitem" className="avatar-menu__item" onClick={settings}><Icon bi="gear-fill" />設定</button>
              <button type="button" role="menuitem" className="avatar-menu__item" onClick={confirmLogout}><Icon bi="box-arrow-right" />登出</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
