import { useState } from 'react';
import { Link } from 'react-router';
import { useTripStore } from '../../stores/tripStore';
import Icon from '../../components/common/Icon';
import Fab, { addActions } from '../../components/common/Fab';
import { ideaToTrip, openIdeaEditor } from './ideaEditor';
import { openVoiceIdea } from './voiceIdea';
import DealCard from '../booking/DealCard';

const metaText = (d) => [d.category, d.desc].filter(Boolean).join('・');
const cover = (d) => d.images?.[0] || d.image;

const ideaActions = addActions({
  voiceDesc: '用說的快速記下想法', textDesc: '手動輸入想法內容',
  onText: () => openIdeaEditor(null), onVoice: () => openVoiceIdea(() => openIdeaEditor(null))
});

/** 行程區：想去的店、景點（可轉成行程） */
function IdeaGrid({ ideas }) {
  return (
    <>
      <main className="idea-grid">
        {ideas.map((d) => (
          <article className="idea" key={d.id}>
            <span className="idea__pin" aria-hidden="true" />
            {/* 點圖片或標題：開啟想法（新增與編輯同一個畫面） */}
            <button type="button" className="idea__open" onClick={() => openIdeaEditor(d.id)} aria-label={`查看：${d.title}`}>
              <span className="idea__img">
                {cover(d) ? <img src={cover(d)} alt="" referrerPolicy="no-referrer" /> : <span className="idea__img-label">{d.title}</span>}
              </span>
              <span className="idea__body">
                <span className="idea__title">{d.title}</span>
                <span className="idea__meta">{metaText(d) || '未分類'}</span>
              </span>
            </button>
            <div className="idea__actions">
              <button type="button" className="btn btn--primary" onClick={() => ideaToTrip(d)}><Icon name="calendar" />轉成行程</button>
            </div>
          </article>
        ))}
        {!ideas.length && (
          <div className="empty" style={{ gridColumn: '1 / -1' }}>
            <Icon name="inbox" />
            <span className="empty__title">收集箱是空的</span>
            <span className="small muted">按右下角的「＋」記下想去的店或景點</span>
          </div>
        )}
      </main>
      <Fab label="新增想法" actions={ideaActions} />
    </>
  );
}

/** 機票與飯店區：在「機票與飯店」頁按喜歡的方案 */
function FavDeals({ deals }) {
  return (
    <main className="content content--booking">
      {deals.map((d) => <DealCard key={d.id} d={d} />)}
      {!deals.length && (
        <div className="empty">
          <Icon bi="heart" />
          <span className="empty__title">還沒有喜歡的機票或飯店</span>
          <span className="small muted">到「更多 › 機票」按 ♡ 收進這裡</span>
          <Link to="/booking" className="btn btn--sm" style={{ marginTop: 6 }}><Icon bi="airplane" />去看機票與飯店</Link>
        </div>
      )}
    </main>
  );
}

export default function IdeasPage() {
  const ideas = useTripStore((s) => s.ideas);
  const favDeals = useTripStore((s) => s.favDeals || []);
  const [tab, setTab] = useState('ideas');
  const tabs = [
    { id: 'ideas', label: '行程區', count: ideas.length },
    { id: 'deals', label: '機票與飯店區', count: favDeals.length }
  ];
  return (
    <>
      <header className="page-head page-head--flush"><h1 className="page-title">想法收集箱</h1></header>
      <div className="seg-tabs" role="tablist" aria-label="收集箱分類">
        {tabs.map((t) => (
          <button key={t.id} type="button" className="seg-tab" role="tab" aria-selected={t.id === tab} onClick={() => setTab(t.id)}>
            {t.label}{t.count > 0 && <span className="seg-tab__count">{t.count}</span>}
          </button>
        ))}
      </div>
      {tab === 'deals' ? <FavDeals deals={favDeals} /> : <IdeaGrid ideas={ideas} />}
    </>
  );
}
