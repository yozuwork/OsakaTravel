import { useCallback, useRef, useState } from 'react';
import { modal } from '../../stores/modalStore';
import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { useModalContext } from '../../components/modal/ModalContext';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import TimeField from '../../components/common/TimeField';
import ImageGallery from '../../components/common/ImageGallery';
import { readClipboard, toImages, toLinks, useClipboardLink } from '../../components/common/useClipboardLink';
import LinkList, { cleanLinks, normalizeUrl } from '../../components/common/LinkList';
import { CATEGORIES, catIcon } from '../../data/constants';
import { addDays, mdw } from '../../utils/date';
import { cx, mapsUrl, uid } from '../../utils/helpers';
import { autoStageLine, dayChar } from '../../utils/dialogueText';
import { Avatar } from '../../components/dialogue/DialogueEditor';
import { dayItems, placeItem, timeIndex } from '../../utils/itinerary';

/* =========================================================
   行程編輯器：新增、複製、從收集箱加入、查看／編輯都用同一個畫面
   ========================================================= */

/**
 * 新增一筆行程並插入當天第 index 個位置（預設依時間排序），切到那一天
 * 文字、語音新增共用
 * @param {{ day: number, time: string, category: string, title: string, place: string, note: string, image?: string, images?: string[], links?: string[] }} data
 * @param {number} [index]
 */
export function addItem(data, index) {
  const id = uid();
  updateTrip((s) => {
    const at = index ?? timeIndex(s.items, data.day, data.time, id);
    s.items.push({ ...data, id });
    placeItem(s, id, at);
    s.ui.day = data.day;
  });
  return id;
}

/** 查看／編輯既有行程 */
export function openItemDetail(id) {
  modal.open({ title: '行程詳情', content: <ItemEditor id={id} clipboard={readClipboard()} /> });
}

/**
 * 新增行程（id 為 null）；傳入既有 id 時等同開啟行程詳情
 * @param {string|null} id
 * @param {object} [preset] 預填資料（例如從收集箱加入、複製行程）
 * @param {{ copy?: boolean }} [opts]
 */
export function openItemForm(id, preset, { copy = false } = {}) {
  if (id) { openItemDetail(id); return; }
  const title = copy ? '複製行程' : preset ? '加入行程' : '新增行程';
  modal.open({ title, content: <ItemEditor preset={preset} copy={copy} clipboard={readClipboard()} /> });
}

function initialDraft(existing, preset) {
  const base = existing || {
    day: useTripStore.getState().ui.day, time: '', category: '交通', title: '', place: '', note: '', ...preset
  };
  return { ...base, images: toImages(base.images, base.image), links: toLinks(base.links) };
}

/**
 * @param {object} p
 * @param {string} [p.id] 既有行程；沒有就是新增
 * @param {object} [p.preset] 新增時的預填資料
 * @param {boolean} [p.copy] 從既有行程複製
 * @param {Promise<string>} [p.clipboard] 開啟時讀到的剪貼簿文字
 */
function ItemEditor({ id, preset, copy = false, clipboard }) {
  const { close } = useModalContext();
  const trip = useTripStore((s) => s.trip);
  const items = useTripStore((s) => s.items);
  const it = id ? items.find((x) => x.id === id) : null;
  const isNew = !id;

  const [draft, setDraft] = useState(() => initialDraft(it, preset));
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const setImages = useCallback((update) => setDraft((d) => ({ ...d, images: update(d.images) })), []);
  const setLinks = useCallback((update) => setDraft((d) => ({ ...d, links: update(d.links) })), []);

  // 序號：既有行程用目前位置；新增時預設依時間排，使用者改過就照選的
  const [pos, setPos] = useState(() => (it
    ? dayItems(items, it.day).findIndex((x) => x.id === id)
    : timeIndex(items, Number(draft.day), draft.time)));
  const [posTouched, setPosTouched] = useState(false);

  // 剪貼簿有連結時，詢問是否貼上並自動抓封面圖
  useClipboardLink({ clipboard, draftRef, setLinks, setImages });

  if (!isNew && !it) return <p className="muted">此行程已刪除</p>;

  const q = draft.place || draft.title;
  const draftDay = Number(draft.day);
  // 同一天可選 1…n；換到別天（或新增）則多一個位置可插入
  const posCount = dayItems(items, draftDay).filter((x) => x.id !== id).length + 1;

  function change(e) {
    const { name, value } = e.target;
    setDraft((current) => ({ ...current, [name]: value }));
    if (name === 'day') {
      const day = Number(value);
      setPosTouched(false);
      setPos(it && day === it.day ? dayItems(items, day).findIndex((x) => x.id === id) : timeIndex(items, day, draft.time, id));
    }
  }

  function changeTime(time) {
    setDraft((current) => ({ ...current, time }));
    if (isNew && !posTouched) setPos(timeIndex(items, draftDay, time));
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
      note: draft.note.trim(),
      charId: draft.charId || '',
      say: (draft.say || '').trim(),
      // 「www.xxx.com」補上 https://；不像網址的照原樣保留
      links: cleanLinks(draft.links).map((u) => normalizeUrl(u) || u),
      // 第一張是封面；行程卡片讀 image
      images: draft.images,
      image: draft.images[0] || ''
    };

    if (isNew) {
      addItem(data, Math.min(pos, posCount - 1));
      toast(copy ? `已複製到 D${data.day + 1}` : preset ? `已加入 D${data.day + 1} 行程` : '已新增行程');
    } else {
      updateTrip((state) => {
        const target = state.items.find((item) => item.id === id);
        if (target) Object.assign(target, data);
        placeItem(state, id, pos);
        state.ui.day = data.day;
      });
      toast('已更新行程');
    }
    close();
  }

  function copyItem() {
    const { id: _id, order: _order, ...rest } = draft;
    close();
    openItemForm(null, { ...rest, day: Number(rest.day) }, { copy: true });
  }

  return (
    <form className="form" noValidate onSubmit={save}>
      <div className="form__grid">
        <div className="field field--full">
          <span className="field__label">圖片</span>
          <ImageGallery value={draft.images} onChange={setImages}
            placeholder={<span className="tl-thumb--icon gallery__placeholder"><Icon name={catIcon(draft.category)} /><span className="tl-thumb__label">{draft.category || '其他'}</span></span>} />
        </div>
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
          <TimeField value={draft.time} onChange={changeTime} />
        </div>
        <label className="field">
          <span className="field__label">類別</span>
          <select className="field__input" name="category" value={draft.category} onChange={change}>
            {CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.id}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field__label">序號</span>
          <select className="field__input" value={Math.min(pos, posCount - 1)} onChange={(e) => { setPos(Number(e.target.value)); setPosTouched(true); }}>
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
        <div className="field field--full">
          <span className="field__label">超連結</span>
          <LinkList value={draft.links} onChange={(links) => setDraft((d) => ({ ...d, links }))} idPrefix={`item_link_${id || 'new'}`} />
        </div>
        <label className="field field--full">
          <span className="field__label">備註</span>
          <textarea className="field__input" name="note" value={draft.note} onChange={change} placeholder="換票、轉乘、訂位資訊…" />
        </label>
        <StageDialogueField draft={draft} setDraft={setDraft} index={pos} />
      </div>
      {q.trim() && <a className="btn btn--primary btn--block" href={mapsUrl(q)} target="_blank" rel="noopener"><Icon name="map" />在 Google 地圖查看</a>}
      {isNew ? (
        <Button type="submit" variant="primary" block><Icon name="check" />{preset && !copy ? '加入行程' : '儲存'}</Button>
      ) : (
        <div className="btn-row">
          <Button onClick={copyItem}><Icon name="plus" />複製行程</Button>
          <Button type="submit" variant="primary"><Icon name="check" />確定</Button>
        </div>
      )}
    </form>
  );
}

/** 地圖上這一關的角色與台詞（都可留「自動」） */
function StageDialogueField({ draft, setDraft, index }) {
  const characters = useTripStore((s) => s.dialogue.characters);
  const day = Number(draft.day);
  const auto = dayChar(characters, day);
  const charId = characters.some((c) => c.id === draft.charId) ? draft.charId : '';
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div className="field field--full stage-say">
      <span className="field__label">地圖角色與對話</span>
      <div className="dlg-chars dlg-chars--pick" role="radiogroup" aria-label="這一關的角色">
        <button type="button" role="radio" aria-checked={!charId}
          className={cx('dlg-char', !charId && 'is-selected')} onClick={() => set({ charId: '' })}>
          <Avatar char={auto} size={44} /><span>自動</span>
        </button>
        {characters.map((c) => (
          <button type="button" key={c.id} role="radio" aria-checked={c.id === charId}
            className={cx('dlg-char', c.id === charId && 'is-selected')} onClick={() => set({ charId: c.id })}>
            <Avatar char={c} size={44} /><span>{c.name}</span>
          </button>
        ))}
      </div>
      <textarea className="field__input" rows={2} value={draft.say || ''} onChange={(e) => set({ say: e.target.value })}
        placeholder={`自動：${autoStageLine(draft, index)}`} aria-label="到達這一關時說的話" />
      <span className="field__hint">走到這一關時角色說的話；留空會依類別自動產生，用【】括起來的字會紅底強調</span>
    </div>
  );
}

/** 只編輯這一關的角色與台詞（地圖上的「編輯台詞」用） */
export function openStageSay(id) {
  modal.open({ title: '編輯台詞', content: <StageSayEditor id={id} /> });
}

function StageSayEditor({ id }) {
  const { close } = useModalContext();
  const items = useTripStore((s) => s.items);
  const it = items.find((x) => x.id === id);
  const [draft, setDraft] = useState(() => ({ ...it, charId: it?.charId || '', say: it?.say || '' }));
  if (!it) return <p className="muted">此行程已刪除</p>;
  const index = dayItems(items, it.day).findIndex((x) => x.id === id);

  function save(e) {
    e.preventDefault();
    updateTrip((s) => {
      const t = s.items.find((x) => x.id === id);
      if (t) Object.assign(t, { charId: draft.charId || '', say: draft.say.trim() });
    });
    toast('已更新台詞');
    close();
  }

  return (
    <form className="form" noValidate onSubmit={save}>
      <div className="small muted">{it.time || '時間未定'} · {it.title}</div>
      <StageDialogueField draft={draft} setDraft={setDraft} index={index} />
      <Button type="submit" variant="primary" block><Icon name="check" />儲存</Button>
    </form>
  );
}
