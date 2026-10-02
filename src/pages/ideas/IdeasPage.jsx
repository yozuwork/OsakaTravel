import { useTripStore } from '../../stores/tripStore';
import Icon from '../../components/common/Icon';
import Fab, { addActions } from '../../components/common/Fab';
import { ideaToTrip, openIdeaEditor } from './ideaEditor';
import { openVoiceIdea } from './voiceIdea';

const metaText = (d) => [d.category, d.desc].filter(Boolean).join('・');
const cover = (d) => d.images?.[0] || d.image;

const ideaActions = addActions({
  voiceDesc: '用說的快速記下想法', textDesc: '手動輸入想法內容',
  onText: () => openIdeaEditor(null), onVoice: () => openVoiceIdea(() => openIdeaEditor(null))
});

export default function IdeasPage() {
  const ideas = useTripStore((s) => s.ideas);
  return (
    <>
      <header className="page-head"><h1 className="page-title">想法收集箱</h1></header>
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
