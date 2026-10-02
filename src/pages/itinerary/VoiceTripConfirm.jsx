import { useState } from 'react';
import { useTripStore } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { VoiceActions, VoiceSaid } from '../../components/voice/VoiceInput';
import TimeField from '../../components/common/TimeField';
import { CATEGORIES } from '../../data/constants';
import { addDays, diffDays, md, mdw, tripYear } from '../../utils/date';
import { durationText, guessCategory, parseTripVoice } from '../../utils/parseTripVoice';
import { addItem } from './itemEditor';

/** 把解析結果轉成現有行程欄位（day / time / category / title / place / note） */
function toDraft(parsed, trip) {
  const dayIndex = parsed.date ? diffDays(trip.startDate, parsed.date) : null;
  const inTrip = dayIndex !== null && dayIndex >= 0 && dayIndex < trip.days;
  return {
    draft: {
      day: inTrip ? String(dayIndex) : '',
      time: parsed.time || '',
      category: guessCategory(parsed) || '景點',
      title: parsed.title || '',
      place: parsed.location || '',
      // 資料格式沒有「停留時間」欄位，寫進備註
      note: [durationText(parsed.durationMinutes), parsed.note].filter(Boolean).join('，')
    },
    // 有講日期但不在旅程內（例如今天還沒出發時說「明天」）
    outOfTrip: parsed.date && !inTrip ? parsed.date : null
  };
}

/**
 * 語音辨識結果確認卡：顯示原句與解析結果，可補日期／時間後再新增
 * 不會自動新增，按「確認新增」才呼叫 addItem
 */
export default function VoiceTripConfirm({ transcript, onRetry, onDone }) {
  const trip = useTripStore((s) => s.trip);
  const [{ draft: initial, outOfTrip }] = useState(() =>
    toDraft(parseTripVoice(transcript, { year: tripYear(trip) }), trip)
  );
  const [draft, setDraft] = useState(initial);
  const change = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));

  function confirm(e) {
    e.preventDefault();
    const title = draft.title.trim();
    if (!title) { toast('請填寫「行程」名稱'); e.currentTarget.elements.title.focus(); return; }
    if (draft.day === '') { toast('請選擇日期'); e.currentTarget.elements.day.focus(); return; }
    const day = Number(draft.day);
    addItem({ day, time: draft.time, category: draft.category, title, place: draft.place.trim(), note: draft.note.trim() });
    toast(`已新增到 D${day + 1} 行程`);
    onDone();
  }

  const missing = (v) => (v === '' ? ' is-missing' : '');

  return (
    <form className="form" noValidate onSubmit={confirm}>
      <VoiceSaid text={transcript} />

      <div className="form__grid">
        <label className={'field' + missing(draft.day)}>
          <span className="field__label">日期</span>
          <select className="field__input" name="day" value={draft.day} onChange={change}>
            <option value="" disabled>請選擇日期</option>
            {Array.from({ length: trip.days }, (_, i) => (
              <option key={i} value={i}>D{i + 1} · {mdw(addDays(trip.startDate, i))}</option>
            ))}
          </select>
          {outOfTrip
            ? <span className="field__hint voice-warn">聽到的是 {md(outOfTrip)}，不在旅程期間內，請重新選擇</span>
            : draft.day === '' && <span className="field__hint voice-warn">沒聽到日期，請選擇</span>}
        </label>
        <div className={'field' + missing(draft.time)}>
          <span className="field__label">時間</span>
          <TimeField value={draft.time} onChange={(time) => setDraft((d) => ({ ...d, time }))} />
          {!draft.time && <span className="field__hint voice-warn">沒聽到時間，可補上或留空</span>}
        </div>
        <label className={'field field--full' + missing(draft.title)}>
          <span className="field__label">行程</span>
          <input className="field__input" name="title" value={draft.title} onChange={change} placeholder="例如：梅田藍天大廈" required />
        </label>
        <label className="field">
          <span className="field__label">地點</span>
          <input className="field__input" name="place" value={draft.place} onChange={change} placeholder="選填" />
        </label>
        <label className="field">
          <span className="field__label">類別</span>
          <select className="field__input" name="category" value={draft.category} onChange={change}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}
          </select>
        </label>
        <label className="field field--full">
          <span className="field__label">備註</span>
          <textarea className="field__input" name="note" value={draft.note} onChange={change} placeholder="選填" />
        </label>
      </div>

      <VoiceActions onRetry={onRetry} />
    </form>
  );
}
