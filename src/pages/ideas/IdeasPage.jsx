import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { modal } from '../../stores/modalStore';
import { useModalContext } from '../../components/modal/ModalContext';
import { openForm } from '../../components/form/openForm';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import Fab, { addActions } from '../../components/common/Fab';
import { CATEGORIES } from '../../data/constants';
import { safeUrl, uid } from '../../utils/helpers';
import { compressImage } from '../../utils/file';
import { openItemForm } from '../itinerary/itemForm';

const metaText = (d) => [d.category, d.desc].filter(Boolean).join('・');

function editIdea(id) {
  const existing = id ? useTripStore.getState().ideas.find((x) => x.id === id) : null;
  const d = existing ? { ...existing } : { title: '', category: '景點', desc: '', link: '', image: '' };
  // 舊資料若是自由輸入的分類（不在清單內），保留成一個選項，避免存檔時被默默改掉
  const categoryOptions = CATEGORIES.map((c) => c.id);
  if (d.category && !categoryOptions.includes(d.category)) categoryOptions.push(d.category);
  openForm({
    title: existing ? '編輯想法' : '新增想法',
    fields: [
      { name: 'title', label: '標題', value: d.title, required: true, full: true, placeholder: '例如：黑門市場吃海鮮' },
      { name: 'category', label: '分類', type: 'select', options: categoryOptions, value: d.category || '景點' },
      { name: 'desc', label: '說明', value: d.desc, placeholder: '一句話備註' },
      { name: 'link', label: '參考連結', type: 'url', value: d.link, placeholder: 'https://', full: true },
      { name: 'image', label: '圖片', type: 'file', full: true, hint: d.image ? '已有圖片，選新檔會取代' : '選填' }
    ],
    onSave: async (v) => {
      const { image: file, ...rest } = v;
      const data = { ...d, ...rest };
      if (file) {
        try { data.image = await compressImage(file, 700, 0.75); } catch { toast('圖片讀取失敗'); return false; }
      }
      updateTrip((s) => {
        const target = existing && s.ideas.find((x) => x.id === id);
        if (target) Object.assign(target, data); else s.ideas.unshift({ ...data, id: uid() });
      });
      toast('已儲存想法');
    },
    onDelete: existing ? () => {
      updateTrip((s) => { s.ideas = s.ideas.filter((x) => x.id !== id); });
      toast('已刪除想法');
    } : undefined
  });
}

const ideaActions = addActions({ voiceDesc: '用說的快速記下想法', textDesc: '手動輸入想法內容', onText: () => editIdea(null) });

function IdeaDetail({ id }) {
  const { close } = useModalContext();
  const d = useTripStore((s) => s.ideas.find((x) => x.id === id));
  if (!d) return null;

  function toTrip() {
    close();
    const category = CATEGORIES.some((c) => c.id === d.category) ? d.category : '景點';
    openItemForm(null, { category, title: d.title, note: d.desc || '', image: d.image || '' });
  }

  return (
    <>
      {d.image && <img src={d.image} alt="" style={{ border: 'var(--border)', borderRadius: 12, maxHeight: 220, objectFit: 'cover', width: '100%' }} />}
      {metaText(d) && <p className="muted" style={{ margin: 0 }}>{metaText(d)}</p>}
      <div className="menu-list">
        <Button variant="primary" block onClick={toTrip}><Icon name="calendar" />加入行程</Button>
        {safeUrl(d.link) && <a className="btn btn--block" href={safeUrl(d.link)} target="_blank" rel="noopener"><Icon name="link" />開啟參考連結</a>}
        <Button block onClick={() => { close(); editIdea(d.id); }}><Icon name="edit" />編輯</Button>
      </div>
    </>
  );
}

export default function IdeasPage() {
  const ideas = useTripStore((s) => s.ideas);
  return (
    <>
      <header className="page-head"><h1 className="page-title">想法收集箱</h1></header>
      <main className="idea-grid">
        {ideas.map((d) => (
          <article className="idea" key={d.id}>
            <span className="idea__pin" aria-hidden="true" />
            <div className="idea__img">{d.image ? <img src={d.image} alt="" /> : <span className="idea__img-label">{d.title}</span>}</div>
            <div className="idea__body">
              <h2 className="idea__title">{d.title}</h2>
              <span className="idea__meta">{metaText(d) || '未分類'}</span>
              <Button variant="primary" onClick={() => modal.open({ title: d.title, content: <IdeaDetail id={d.id} /> })}>開始</Button>
            </div>
          </article>
        ))}
        <button className="idea idea--add add-inline" onClick={() => editIdea(null)}><Icon name="plus" />新增想法</button>
      </main>
      <Fab label="新增想法" actions={ideaActions} />
    </>
  );
}
