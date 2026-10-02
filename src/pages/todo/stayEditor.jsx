import { useCallback, useRef, useState } from 'react';
import { modal } from '../../stores/modalStore';
import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { useModalContext } from '../../components/modal/ModalContext';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import TimeField from '../../components/common/TimeField';
import ImageGallery from '../../components/common/ImageGallery';
import LinkList, { cleanLinks, normalizeUrl } from '../../components/common/LinkList';
import { readClipboard, toImages, toLinks, useClipboardLink } from '../../components/common/useClipboardLink';
import { addDays } from '../../utils/date';
import { EMPTY_STAY, addStay } from './todoActions';

/* =========================================================
   住宿編輯器：新增與編輯共用同一個畫面
   ========================================================= */

/** 開啟住宿：id 為 null 時是新增 */
export function openStayEditor(id) {
  modal.open({ title: id ? '編輯住宿' : '新增住宿', content: <StayEditor id={id} clipboard={readClipboard()} /> });
}

function initialDraft(existing) {
  const { trip } = useTripStore.getState();
  const base = existing || { ...EMPTY_STAY, checkIn: trip.startDate, checkOut: addDays(trip.startDate, 1) };
  return { ...EMPTY_STAY, ...base, images: toImages(base.images, base.photo), links: toLinks(base.links) };
}

const TEXT_FIELDS = [
  { name: 'orderNo', label: '訂單編號' },
  { name: 'roomType', label: '房型' },
  { name: 'phone', label: '電話', type: 'tel' },
  { name: 'platform', label: '訂房平台' }
];

function StayEditor({ id, clipboard }) {
  const { close } = useModalContext();
  const existing = useTripStore((s) => (id ? s.stays.find((x) => x.id === id) : null));
  const [draft, setDraft] = useState(() => initialDraft(existing));
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const setImages = useCallback((update) => setDraft((d) => ({ ...d, images: update(d.images) })), []);
  const setLinks = useCallback((update) => setDraft((d) => ({ ...d, links: update(d.links) })), []);
  useClipboardLink({ clipboard, draftRef, setLinks, setImages });

  if (id && !existing) return <p className="muted">此住宿已刪除</p>;

  const change = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));
  const setTime = (name) => (t) => setDraft((d) => ({ ...d, [name]: t }));

  function save(e) {
    e.preventDefault();
    const name = draft.name.trim();
    if (!name) { toast('請填寫「飯店名稱」'); e.currentTarget.elements.name.focus(); return; }
    if (draft.checkIn && draft.checkOut && draft.checkOut < draft.checkIn) { toast('退房日期不能早於入住日期'); return; }
    const data = {
      ...draft,
      name,
      address: draft.address.trim(),
      links: cleanLinks(draft.links).map((u) => normalizeUrl(u) || u),
      // 第一張是封面；住宿卡片讀 photo
      images: draft.images,
      photo: draft.images[0] || ''
    };
    if (existing) updateTrip((st) => { const t = st.stays.find((x) => x.id === id); if (t) Object.assign(t, data); });
    else addStay(data);
    toast('已儲存住宿');
    close();
  }

  async function remove() {
    if (!(await modal.confirm({ message: `確定要刪除「${existing.name || '這筆住宿'}」？` }))) return;
    updateTrip((st) => { st.stays = st.stays.filter((x) => x.id !== id); });
    toast('已刪除住宿');
    close();
  }

  return (
    <form className="form" noValidate onSubmit={save}>
      <div className="form__grid">
        <div className="field field--full">
          <span className="field__label">飯店照片</span>
          <ImageGallery value={draft.images} onChange={setImages} max={900} quality={0.78}
            placeholder={<span className="tl-thumb--icon gallery__placeholder"><Icon name="bed" /><span className="tl-thumb__label">住宿</span></span>} />
        </div>
        <label className="field field--full">
          <span className="field__label">飯店名稱</span>
          <input className="field__input" name="name" value={draft.name} onChange={change} placeholder="例如：難波東急飯店" required />
        </label>
        <label className="field field--full">
          <span className="field__label">地址</span>
          <input className="field__input" name="address" value={draft.address} onChange={change} />
          <span className="field__hint">導航會用這個地址搜尋 Google 地圖</span>
        </label>
        <label className="field">
          <span className="field__label">入住日期</span>
          <input className="field__input" type="date" name="checkIn" value={draft.checkIn} onChange={change} />
        </label>
        <div className="field">
          <span className="field__label">入住時間</span>
          <TimeField value={draft.checkInTime} onChange={setTime('checkInTime')} />
        </div>
        <label className="field">
          <span className="field__label">退房日期</span>
          <input className="field__input" type="date" name="checkOut" value={draft.checkOut} onChange={change} />
        </label>
        <div className="field">
          <span className="field__label">退房時間</span>
          <TimeField value={draft.checkOutTime} onChange={setTime('checkOutTime')} />
        </div>
        {TEXT_FIELDS.map((f) => (
          <label className="field" key={f.name}>
            <span className="field__label">{f.label}</span>
            <input className="field__input" type={f.type || 'text'} name={f.name} value={draft[f.name] || ''} onChange={change} />
          </label>
        ))}
        <div className="field field--full">
          <span className="field__label">超連結</span>
          <LinkList value={draft.links} onChange={(links) => setDraft((d) => ({ ...d, links }))} idPrefix={`stay_link_${id || 'new'}`} />
        </div>
      </div>
      {existing ? (
        <div className="btn-row">
          <Button variant="danger" onClick={remove}><Icon name="trash" />刪除</Button>
          <Button type="submit" variant="primary"><Icon name="check" />確定</Button>
        </div>
      ) : (
        <Button type="submit" variant="primary" block><Icon name="check" />儲存</Button>
      )}
    </form>
  );
}
