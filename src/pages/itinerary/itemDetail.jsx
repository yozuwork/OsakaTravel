import { useState } from 'react';
import { modal } from '../../stores/modalStore';
import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { useModalContext } from '../../components/modal/ModalContext';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import TimeField from '../../components/common/TimeField';
import { CATEGORIES } from '../../data/constants';
import { addDays, mdw } from '../../utils/date';
import { mapsUrl } from '../../utils/helpers';
import { dayItems, placeItem, timeIndex } from '../../utils/itinerary';
import { openItemForm } from './itemForm';

/** 行程詳情：可開啟地圖、複製成新行程或編輯 */
export function openItemDetail(id) {
  modal.open({ title: '行程詳情', content: <ItemDetail id={id} /> });
}

function ItemDetail({ id }) {
  const { close } = useModalContext();
  const trip = useTripStore((s) => s.trip);
  const items = useTripStore((s) => s.items);
  const it = items.find((x) => x.id === id);
  const [draft, setDraft] = useState(() => ({ ...it }));
  const [pos, setPos] = useState(() => (it ? dayItems(items, it.day).findIndex((x) => x.id === id) : 0));
  if (!it) return <p className="muted">此行程已刪除</p>;

  const q = draft.place || draft.title;
  const draftDay = Number(draft.day);
  // 同一天可選 1…n；換到別天則多一個位置可插入
  const posCount = dayItems(items, draftDay).filter((x) => x.id !== id).length + 1;

  function change(e) {
    const { name, value } = e.target;
    setDraft((current) => ({ ...current, [name]: value }));
    if (name === 'day') {
      const day = Number(value);
      setPos(day === it.day ? dayItems(items, day).findIndex((x) => x.id === id) : timeIndex(items, day, draft.time, id));
    }
  }

  async function copyPlace() {
    const place = draft.place.trim();
    if (!place) return toast('沒有可複製的地點');
    try {
      await navigator.clipboard.writeText(place);
      toast('已複製地點');
    } catch {
      toast('複製失敗，請手動選取');
    }
  }

  function save(e) {
    e.preventDefault();
    const title = draft.title.trim();
    if (!title) {
      toast('請填寫「標題」');
      e.currentTarget.elements.title.focus();
      return;
    }

    const data = {
      ...draft,
      day: Number(draft.day),
      title,
      place: draft.place.trim(),
      note: draft.note.trim()
    };
    updateTrip((state) => {
      const target = state.items.find((item) => item.id === id);
      if (target) Object.assign(target, data);
      placeItem(state, id, pos);
      state.ui.day = data.day;
    });
    toast('已更新行程');
    close();
  }

  function copyItem() {
    const { id: _id, ...copy } = draft;
    close();
    openItemForm(null, { ...copy, day: Number(copy.day) }, { copy: true });
  }

  return (
    <form className="form" noValidate onSubmit={save}>
      <div className="form__grid">
        <label className="field field--full">
          <span className="field__label">標題</span>
          <input className="field__input" name="title" value={draft.title} onChange={change} placeholder="例如：大阪城天守閣" required />
        </label>
        <label className="field">
          <span className="field__label">日期</span>
          <select className="field__input" name="day" value={draft.day} onChange={change}>
            {Array.from({ length: trip.days }, (_, day) => (
              <option key={day} value={day}>D{day + 1} · {mdw(addDays(trip.startDate, day))}</option>
            ))}
          </select>
        </label>
        <div className="field">
          <span className="field__label">時間</span>
          <TimeField value={draft.time} onChange={(time) => setDraft((current) => ({ ...current, time }))} />
        </div>
        <label className="field">
          <span className="field__label">類別</span>
          <select className="field__input" name="category" value={draft.category} onChange={change}>
            {CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.id}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field__label">序號</span>
          <select className="field__input" value={pos} onChange={(e) => setPos(Number(e.target.value))}>
            {Array.from({ length: posCount }, (_, i) => <option key={i} value={i}>第 {i + 1} 個</option>)}
          </select>
        </label>
        <label className="field field--full">
          <span className="field__label">地點</span>
          <span className="place-input-row">
            <input className="field__input" name="place" value={draft.place} onChange={change} placeholder="例如：大阪城公園駅"
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />
            <button type="button" className="place-input-row__copy" onClick={copyPlace} aria-label="複製地點" title="複製地點">
              <Icon bi="copy" />
            </button>
          </span>
        </label>
        <label className="field field--full">
          <span className="field__label">備註</span>
          <textarea className="field__input" name="note" value={draft.note} onChange={change} placeholder="換票、轉乘、訂位資訊…" />
        </label>
      </div>
      <a className="btn btn--primary btn--block" href={mapsUrl(q)} target="_blank" rel="noopener"><Icon name="map" />在 Google 地圖查看</a>
      <div className="btn-row">
        <Button onClick={copyItem}><Icon name="plus" />複製行程</Button>
        <Button type="submit"><Icon name="check" />確定</Button>
      </div>
    </form>
  );
}
