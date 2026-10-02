import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { cx } from '../../utils/helpers';
import { toast } from '../../stores/uiStore';

const CLOSE_MS = 220;

/** 「語音新增／文字新增」兩個選項；沒有 onVoice 的頁面先顯示「即將推出」 */
export const addActions = ({ voiceDesc, textDesc, onText, onVoice = () => toast('語音新增即將推出') }) => [
  { bi: 'mic-fill', title: '語音新增', desc: voiceDesc, onClick: onVoice },
  { bi: 'keyboard', title: '文字新增', desc: textDesc, onClick: onText }
];

/**
 * 右下角的「新增」浮動按鈕（手機版、電腦版都有）
 * 會一併放一個佔位區塊，避免最後一筆內容被按鈕擋住
 * - onClick：直接執行
 * - actions：[{ icon, bi, title, desc, onClick }]，點按鈕先彈出選單（女神異聞錄風格對話框）
 */
export default function Fab({ label, onClick, actions }) {
  // closed → open → closing → closed（closing 期間播放收合動畫）
  const [phase, setPhase] = useState('closed');
  const timer = useRef(null);
  const shown = phase !== 'closed';

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (phase !== 'open') return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  function close() {
    setPhase('closing');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPhase('closed'), CLOSE_MS);
  }

  function toggle() {
    if (!actions) return onClick?.();
    if (phase === 'open') close();
    else { clearTimeout(timer.current); setPhase('open'); }
  }

  function pick(a) {
    close();
    a.onClick?.();
  }

  return (
    <>
      <div className="fab-spacer" aria-hidden="true" />
      {shown && (
        <div className={cx('fab-menu', phase === 'closing' && 'is-closing')}>
          <div className="fab-menu__backdrop" onClick={close} />
          <div className="fab-menu__slash" aria-hidden="true" />
          <div className="fab-menu__list" role="menu" aria-label={label}>
            {actions.map((a, i) => (
              <button key={a.title} type="button" role="menuitem" className="fab-action" style={{ '--i': i }} onClick={() => pick(a)}>
                <span className="fab-action__face" aria-hidden="true" />
                <span className="fab-action__icon"><Icon name={a.icon} bi={a.bi} /></span>
                <span className="fab-action__text">
                  <strong className="fab-action__title">{a.title}</strong>
                  {a.desc && <span className="fab-action__desc">{a.desc}</span>}
                </span>
                <Icon name="chevronRight" className="fab-action__arrow" />
              </button>
            ))}
          </div>
        </div>
      )}
      <button type="button" className={cx('fab', phase === 'open' && 'is-open')} onClick={toggle}
        aria-label={phase === 'open' ? '關閉選單' : label} title={label}
        aria-haspopup={actions ? 'menu' : undefined} aria-expanded={actions ? phase === 'open' : undefined}>
        <Icon name="plus" />
      </button>
    </>
  );
}
