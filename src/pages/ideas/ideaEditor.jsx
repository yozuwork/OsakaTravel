import { useCallback, useRef, useState } from 'react';
import { modal } from '../../stores/modalStore';
import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { useModalContext } from '../../components/modal/ModalContext';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import ImageGallery from '../../components/common/ImageGallery';
import LinkList, { cleanLinks, normalizeUrl } from '../../components/common/LinkList';
import { readClipboard, toImages, toLinks, useClipboardLink } from '../../components/common/useClipboardLink';
import { CATEGORIES, catIcon } from '../../data/constants';
import { openItemForm } from '../itinerary/itemEditor';
import { addIdea } from './voiceIdea';

/* =========================================================
   想法編輯器：新增與查看／編輯共用同一個畫面
   ========================================================= */

/** 開啟想法：id 為 null 時是新增 */
export function openIdeaEditor(id) {
  modal.open({ title: id ? '想法詳情' : '新增想法', content: <IdeaEditor id={id} clipboard={readClipboard()} /> });
}

/** 想法 → 行程：打開已預填的行程編輯畫面（標題、類別、說明、圖片、連結都帶入） */
export function ideaToTrip(d) {
  const images = toImages(d.images, d.image);
  openItemForm(null, {
    category: CATEGORIES.some((c) => c.id === d.category) ? d.category : '景點',
    title: d.title,
    note: d.desc || '',
    images,
    image: images[0] || '',
    links: cleanLinks(toLinks(d.links, d.link))
  });
}

const initialDraft = (d) => ({
  title: '', category: '景點', desc: '',
  ...d,
  images: toImages(d?.images, d?.image),
  links: toLinks(d?.links, d?.link)
});

function IdeaEditor({ id, clipboard }) {
  const { close } = useModalContext();
  const existing = useTripStore((s) => (id ? s.ideas.find((x) => x.id === id) : null));
  const [draft, setDraft] = useState(() => initialDraft(existing));
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const setImages = useCallback((update) => setDraft((d) => ({ ...d, images: update(d.images) })), []);
  const setLinks = useCallback((update) => setDraft((d) => ({ ...d, links: update(d.links) })), []);
  useClipboardLink({ clipboard, draftRef, setLinks, setImages });

  if (id && !existing) return <p className="muted">此想法已刪除</p>;

  // 舊資料若是自由輸入的分類（不在清單內），保留成一個選項，避免存檔時被默默改掉
  const categoryOptions = CATEGORIES.map((c) => c.id);
  if (draft.category && !categoryOptions.includes(draft.category)) categoryOptions.push(draft.category);
  const change = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));

  /** 整理成要存的資料；image／link 保留第一張／第一個，相容舊畫面 */
  function toData() {
    const links = cleanLinks(draft.links).map((u) => normalizeUrl(u) || u);
    return { ...draft, title: draft.title.trim(), desc: draft.desc.trim(), images: draft.images, image: draft.images[0] || '', links, link: links[0] || '' };
  }

  function save(e) {
    e.preventDefault();
    if (!draft.title.trim()) { toast('請填寫「標題」'); e.currentTarget.elements.title.focus(); return; }
    const data = toData();
    if (existing) updateTrip((s) => { const t = s.ideas.find((x) => x.id === id); if (t) Object.assign(t, data); });
    else addIdea(data);
    toast('已儲存想法');
    close();
  }

  function toTrip() {
    if (!draft.title.trim()) { toast('請先填寫「標題」'); return; }
    close();
    ideaToTrip(toData());
  }

  async function remove() {
    if (!(await modal.confirm({ message: `確定要刪除「${existing.title}」？` }))) return;
    updateTrip((s) => { s.ideas = s.ideas.filter((x) => x.id !== id); });
    toast('已刪除想法');
    close();
  }

  return (
    <form className="form" noValidate onSubmit={save}>
      <div className="form__grid">
        <div className="field field--full">
          <span className="field__label">圖片</span>
          <ImageGallery value={draft.images} onChange={setImages} max={700}
            placeholder={<span className="tl-thumb--icon gallery__placeholder"><Icon name={catIcon(draft.category)} /><span className="tl-thumb__label">{draft.category || '其他'}</span></span>} />
        </div>
        <label className="field field--full">
          <span className="field__label">標題</span>
          <input className="field__input" name="title" value={draft.title} onChange={change} placeholder="例如：黑門市場吃海鮮" required />
        </label>
        <label className="field">
          <span className="field__label">分類</span>
          <select className="field__input" name="category" value={draft.category} onChange={change}>
            {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field__label">說明</span>
          <input className="field__input" name="desc" value={draft.desc} onChange={change} placeholder="一句話備註" />
        </label>
        <div className="field field--full">
          <span className="field__label">超連結</span>
          <LinkList value={draft.links} onChange={(links) => setDraft((d) => ({ ...d, links }))} idPrefix={`idea_link_${id || 'new'}`} />
        </div>
      </div>
      <Button variant="primary" block onClick={toTrip}><Icon name="calendar" />轉成行程</Button>
      {existing ? (
        <div className="btn-row">
          <Button variant="danger" onClick={remove}><Icon name="trash" />刪除</Button>
          <Button type="submit"><Icon name="check" />確定</Button>
        </div>
      ) : (
        <Button type="submit" block><Icon name="check" />儲存</Button>
      )}
    </form>
  );
}
