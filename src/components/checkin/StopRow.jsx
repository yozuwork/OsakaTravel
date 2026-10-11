import { useMemo } from 'react';
import { cx } from '../../utils/helpers';
import { fmtTime, stampCanvas } from '../../features/checkin/engine';
import Icon from '../common/Icon';
import BlobImg from './BlobImg';

/** 印章圖示（Bootstrap Icons 沒有） */
export const StampIcon = () => (
  <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <path d="M9 3h6v5l-1 3h4a2 2 0 0 1 2 2v3H4v-3a2 2 0 0 1 2-2h4L9 8z" /><path d="M4 20h16" />
  </svg>
);

/**
 * 打卡頁的一站：編號、時間、站名、蓋章／拍照按鈕；蓋過章顯示郵戳（排在 flex 裡，不用絕對定位）；下方是明信片縮圖列
 * @param {object} p
 * @param {{ no, title, time, category }} p.stop
 * @param {object[]} p.cards 這站的明信片
 * @param {object} [p.stamp] 行程蓋章紀錄
 * @param {boolean} p.isNew 剛蓋的章（播放蓋下去的動畫）
 */
export default function StopRow({ stop, cards, stamp, isNew, cover, onStamp, onUnstamp, onShoot, onOpenCard }) {
  const stampSrc = useMemo(() => stamp && stampCanvas('post', { at: stamp.at, title: stop.title, no: stop.no }, 180).toDataURL(), [stamp, stop.title, stop.no]);
  const meta = [stop.category, cards.length && `${cards.length} 張`, stamp && `${fmtTime(stamp.at)} 打卡`].filter(Boolean).join(' · ');

  return (
    <li className={cx('ck-stop', (cards.length || stamp) && 'is-done')}>
      <div className="ck-stop__row">
        {cover && <div className="ck-stop__cover"><img src={cover} alt="" loading="lazy" /><span>{String(stop.no).padStart(2, '0')}</span></div>}
        <span className="ck-stop__no">{stop.no}</span>
        <div className="ck-stop__body">
          <div className="ck-stop__time">{stop.time}</div>
          <div className="ck-stop__title">{stop.title}</div>
          <div className="ck-stop__meta">{meta}</div>
        </div>
        {stamp && (
          <button type="button" className={cx('ck-rowstamp', isNew && 'is-new')} style={{ '--rot': `${stamp.rot}rad` }}
            onClick={onUnstamp} title="點一下取消打卡" aria-label={`${stop.title} 已於 ${fmtTime(stamp.at)} 打卡，點一下可以取消`}>
            <img src={stampSrc} alt="" draggable="false" />
          </button>
        )}
        <div className="ck-stop__btns">
          {!stamp && (
            <button type="button" className="ck-stampbtn" onClick={onStamp} aria-label={`在 ${stop.title} 蓋打卡章`}>
              <StampIcon />蓋章
            </button>
          )}
          <button type="button" className={cx('ck-shoot', cards.length > 0 && 'is-sm')} onClick={onShoot}>
            <Icon bi="camera" />{cards.length ? '再拍' : '拍照'}
          </button>
        </div>
      </div>
      {cards.length > 0 && (
        <div className="ck-strip">
          {cards.map((r) => (
            <button key={r.id} type="button" className={cx('ck-thumb', r.orient === 'land' && 'is-land')}
              onClick={() => onOpenCard(r)} aria-label={`看 ${stop.title} 的明信片`}>
              <BlobImg blob={r.card} />
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
