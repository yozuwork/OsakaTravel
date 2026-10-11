import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database, databasePath } from '../../services/firebase';
import { addDays, mdw } from '../../utils/date';
import { mapsUrl } from '../../utils/helpers';
import Icon from '../../components/common/Icon';
import { catIcon } from '../../data/constants';
import './share.css';

export function PublicJourney({ data }) {
  const [day, setDay] = useState(0);
  const days = Math.min(60, Math.max(1, Number(data.trip.days) || 1));
  const items = Object.values(data.items || {});
  const stops = items.filter(item => item.day === day).sort((a, b) => a.order - b.order);
  return <main className="public-journey">
    <header className="public-hero"><span className="share-eyebrow">A JOURNEY TO REMEMBER</span><span className="public-readonly"><Icon bi="eye" />公開行程 · 唯讀</span>
      <h1>{data.trip.name}</h1><p>{mdw(data.trip.startDate)} — {mdw(addDays(data.trip.startDate, days - 1))}<span>{days} 天的旅行提案</span></p>
      <div className="public-hero-mark" aria-hidden="true">旅</div></header>
    <nav className="public-days" aria-label="選擇行程日期">{Array.from({ length: days }, (_, index) => <button key={index} onClick={() => setDay(index)} aria-pressed={day === index}><span>DAY {String(index + 1).padStart(2, '0')}</span><strong>{mdw(addDays(data.trip.startDate, index))}</strong></button>)}</nav>
    <section className="public-day"><header><span className="share-eyebrow">THE ITINERARY / {String(day + 1).padStart(2, '0')}</span><h2>{mdw(addDays(data.trip.startDate, day))}<small>{stops.length} 個行程</small></h2></header>
      <ol className="public-stops">{stops.map((item, index) => <li key={item.id}>
        <div className="public-time"><span>{item.time || '時間彈性'}</span><small>{String(index + 1).padStart(2, '0')}</small></div>
        <article><div className="public-category"><Icon name={catIcon(item.category)} />{item.category}</div><h3>{item.title}</h3>{item.place && <p><Icon name="pin" />{item.place}</p>}
          {(item.place || item.title) && <a href={mapsUrl(item.place || item.title)} target="_blank" rel="noopener noreferrer" aria-label={`在 Google 地圖查看${item.title}`}><Icon name="map" />查看地圖</a>}</article>
      </li>)}</ol>{!stops.length && <p className="public-empty">這一天留給自由探索，尚未安排行程。</p>}
    </section><footer className="public-footer">分享旅程，收藏期待。<span>更新於 {new Date(data.publishedAt).toLocaleDateString('zh-TW')}</span></footer>
  </main>;
}

export default function PublicSharePage({ token }) {
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    const previous = document.title;
    const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex,nofollow'; document.head.append(robots);
    setState({ loading: true });
    if (!/^[a-f0-9]{48}$/.test(token)) { setState({ error: true }); return () => { robots.remove(); }; }
    const stop = onValue(ref(database, `${databasePath}Public/${token}`), snapshot => {
      const data = snapshot.val();
      if (!data?.trip?.startDate || data.version !== 1) setState({ error: true });
      else { setState({ data }); document.title = `${data.trip.name} · 公開行程`; }
    }, () => setState({ error: true }));
    return () => { stop(); robots.remove(); document.title = previous; };
  }, [token]);
  if (state.loading) return <main className="public-message" role="status">正在打開這段旅程…</main>;
  if (state.error) return <main className="public-message"><span className="share-eyebrow">PRIVATE / UNAVAILABLE</span><h1>這段旅程目前沒有公開。</h1><p>連結可能已停止分享或暫時無法讀取，請聯絡分享者。</p></main>;
  return <PublicJourney key={token} data={state.data} />;
}
