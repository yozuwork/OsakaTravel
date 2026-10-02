import { useState } from 'react';
import { useTripStore } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { openVoice, VoiceActions, VoiceSaid } from '../../components/voice/VoiceInput';
import Icon from '../../components/common/Icon';
import TimeField from '../../components/common/TimeField';
import { parseListVoice, parseStayVoice } from '../../utils/parseVoice';
import { tripYear } from '../../utils/date';
import { addBagItems, addStay, addTodos } from './todoActions';

/* ---------- 待辦 ---------- */
export function openVoiceTodo(onText) {
  openVoice({
    title: '語音新增待辦',
    placeholder: '例如：「記得換日幣、買藥妝還有預約美容院」',
    onText,
    render: (transcript, { retry, close }) => (
      <VoiceListConfirm transcript={transcript} kind="todo" onRetry={retry}
        onConfirm={(texts) => { addTodos(texts); toast(`已新增 ${texts.length} 項待辦`); close(); }} />
    )
  });
}

/* ---------- 行李 ---------- */
export function openVoiceBag(onText) {
  openVoice({
    title: '語音加入行李',
    placeholder: '例如：「要帶充電器、牙刷還有拖鞋」',
    onText,
    render: (transcript, { retry, close }) => (
      <VoiceListConfirm transcript={transcript} kind="bag" onRetry={retry}
        onConfirm={(texts, gid) => { addBagItems(gid, texts); toast(`已加入 ${texts.length} 項行李`); close(); }} />
    )
  });
}

/**
 * 待辦／行李確認卡：一句話拆成多個項目，可修改、刪除，行李另外選分類
 */
function VoiceListConfirm({ transcript, kind, onRetry, onConfirm }) {
  const bag = useTripStore((s) => s.bag);
  const [items, setItems] = useState(() => parseListVoice(transcript, kind));
  const [gid, setGid] = useState(() => bag[0]?.id || '');
  const noun = kind === 'bag' ? '行李' : '待辦';

  const setAt = (i, v) => setItems((list) => list.map((x, j) => (j === i ? v : x)));
  const removeAt = (i) => setItems((list) => list.filter((_, j) => j !== i));

  function submit(e) {
    e.preventDefault();
    const texts = items.map((t) => t.trim()).filter(Boolean);
    if (!texts.length) { toast(`沒有可新增的${noun}，再說一次看看`); return; }
    onConfirm(texts, gid || null);
  }

  return (
    <form className="form" noValidate onSubmit={submit}>
      <VoiceSaid text={transcript} />
      {kind === 'bag' && (
        <label className="field">
          <span className="field__label">加入分類</span>
          <select className="field__input" value={gid} onChange={(e) => setGid(e.target.value)}>
            {bag.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            <option value="">＋ 建立新分類</option>
          </select>
        </label>
      )}
      <div className="field">
        <span className="field__label">聽到 {items.length} 項{noun}</span>
        <div className="list">
          {items.map((t, i) => (
            <div className="voice-item" key={i}>
              <label className="sr-only" htmlFor={`voice_item_${i}`}>{noun} {i + 1}</label>
              <input id={`voice_item_${i}`} className="field__input" value={t} onChange={(e) => setAt(i, e.target.value)} />
              <button type="button" className="check-row__del" aria-label={`移除：${t}`} onClick={() => removeAt(i)}><Icon name="x" /></button>
            </div>
          ))}
          {!items.length && <span className="small muted">沒有聽到項目</span>}
        </div>
      </div>
      <VoiceActions onRetry={onRetry} submitText={items.length > 1 ? `確認新增 ${items.length} 項` : '確認新增'} />
    </form>
  );
}

/* ---------- 住宿 ---------- */
export function openVoiceStay(onText) {
  openVoice({
    title: '語音新增住宿',
    placeholder: '例如：「12月21號下午三點入住難波東急飯店，住四晚」',
    onText,
    render: (transcript, { retry, close }) => <VoiceStayConfirm transcript={transcript} onRetry={retry} onDone={close} />
  });
}

function VoiceStayConfirm({ transcript, onRetry, onDone }) {
  const trip = useTripStore((s) => s.trip);
  const [draft, setDraft] = useState(() => parseStayVoice(transcript, { year: tripYear(trip) }));
  const change = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));
  const missing = (v) => (v ? '' : ' is-missing');

  function submit(e) {
    e.preventDefault();
    const name = draft.name.trim();
    if (!name) { toast('請填寫「飯店名稱」'); e.currentTarget.elements.name.focus(); return; }
    if (draft.checkIn && draft.checkOut && draft.checkOut < draft.checkIn) { toast('退房日期不能早於入住日期'); return; }
    addStay({ ...draft, name });
    toast('已新增住宿');
    onDone();
  }

  return (
    <form className="form" noValidate onSubmit={submit}>
      <VoiceSaid text={transcript} />
      <div className="form__grid">
        <label className={'field field--full' + missing(draft.name)}>
          <span className="field__label">飯店名稱</span>
          <input className="field__input" name="name" value={draft.name} onChange={change} placeholder="例如：難波東急飯店" required />
        </label>
        <label className={'field' + missing(draft.checkIn)}>
          <span className="field__label">入住日期</span>
          <input className="field__input" type="date" name="checkIn" value={draft.checkIn} onChange={change} />
          {!draft.checkIn && <span className="field__hint voice-warn">沒聽到，請選擇</span>}
        </label>
        <div className="field">
          <span className="field__label">入住時間</span>
          <TimeField value={draft.checkInTime} onChange={(t) => setDraft((d) => ({ ...d, checkInTime: t }))} />
        </div>
        <label className={'field' + missing(draft.checkOut)}>
          <span className="field__label">退房日期</span>
          <input className="field__input" type="date" name="checkOut" value={draft.checkOut} onChange={change} />
          {!draft.checkOut && <span className="field__hint voice-warn">沒聽到，請選擇</span>}
        </label>
        <div className="field">
          <span className="field__label">退房時間</span>
          <TimeField value={draft.checkOutTime} onChange={(t) => setDraft((d) => ({ ...d, checkOutTime: t }))} />
        </div>
      </div>
      <p className="small muted" style={{ margin: 0 }}>地址、訂單編號等其他資料，新增後可在「編輯住宿資訊」補上</p>
      <VoiceActions onRetry={onRetry} />
    </form>
  );
}
