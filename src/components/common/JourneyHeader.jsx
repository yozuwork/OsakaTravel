import Icon from './Icon';
import { useEffect, useRef } from 'react';
import { addDays, mdw } from '../../utils/date';
import '../../styles/journey.css';

export default function JourneyHeader({ kind, trip, day, onDay, count, stamped, photos = 0, image }) {
  const map = kind === 'map';
  const daysRef = useRef(null);
  useEffect(() => {
    const nav = daysRef.current;
    const reveal = () => {
      const selected = nav?.querySelector('[aria-pressed="true"]');
      if (!selected) return;
      const bounds = nav.getBoundingClientRect(), button = selected.getBoundingClientRect();
      if (button.left < bounds.left || button.right > bounds.right) nav.scrollTo({ left: nav.scrollLeft + button.left - bounds.left - (nav.clientWidth - button.width) / 2, behavior: 'instant' });
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    if (nav) observer.observe(nav);
    return () => observer.disconnect();
  }, [day]);
  return <>
    <header className="journey-hero">
      <div className="journey-hero__copy"><span className="journey-eyebrow">OSAKA / {map ? 'EXPLORE THE CITY' : 'COLLECT THE MOMENTS'}</span><h1>{map ? '跟著路線，' : '把這一刻，'}<br /><span>{map ? '遇見大阪。' : '留在旅途中。'}</span></h1><p>{map ? '每天一段冒險，每一站都有故事。選一站，看看下一個目的地。' : '拍張照片、蓋個章，讓走過的地方成為可以帶回家的回憶。'}</p><div className="journey-stats"><div><strong>{String(count).padStart(2, '0')}</strong><span>今日行程</span></div><div><strong>{String(stamped).padStart(2, '0')}</strong><span>已打卡</span></div>{!map && <div><strong>{String(photos).padStart(2, '0')}</strong><span>明信片</span></div>}</div></div>
      <div className={`journey-art journey-art--${kind}`} aria-hidden="true">{map ? <><svg viewBox="0 0 320 240"><path d="M45 180C45 80 145 220 165 120S290 170 280 45" /><circle cx="45" cy="180" r="9" /><circle cx="165" cy="120" r="9" /><circle cx="280" cy="45" r="12" /><text x="26" y="210">START</text><text x="235" y="25">OSAKA</text></svg><span className="journey-art__label">A LITTLE ADVENTURE</span><Icon name="pin" /></> : <><div className="journey-art__postcard">{image ? <img src={image} alt="" /> : <div className="journey-art__blank"><Icon name="camera" /></div>}<span>Dear Osaka,</span><small>A MOMENT TO KEEP.</small></div><span className="journey-art__stamp">OSAKA<br />旅の記憶</span></>}</div>
    </header>
    <nav className="journey-days" ref={daysRef} aria-label="選擇旅程日期">{Array.from({ length: trip.days }, (_, index) => <button key={index} type="button" aria-pressed={index === day} onClick={() => onDay(index)}><span>DAY {String(index + 1).padStart(2, '0')}</span><strong>{mdw(addDays(trip.startDate, index))}</strong><span className="journey-days__arrow" aria-hidden="true">↗</span></button>)}</nav>
  </>;
}
