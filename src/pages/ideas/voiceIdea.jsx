import { useState } from 'react';
import { updateTrip } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { openVoice, VoiceActions, VoiceSaid } from '../../components/voice/VoiceInput';
import { CATEGORIES } from '../../data/constants';
import { uid } from '../../utils/helpers';
import { parseIdeaVoice } from '../../utils/parseVoice';

/** 新增想法（文字、語音新增共用），新的放最前面 */
export function addIdea(data) {
  updateTrip((s) => { s.ideas.unshift({ title: '', category: '景點', desc: '', link: '', image: '', ...data, id: uid() }); });
}

/** 語音新增想法 */
export function openVoiceIdea(onText) {
  openVoice({
    title: '語音新增想法',
    placeholder: '例如：「想去黑門市場吃海鮮，聽說早上人比較少」',
    onText,
    render: (transcript, { retry, close }) => <VoiceIdeaConfirm transcript={transcript} onRetry={retry} onDone={close} />
  });
}

function VoiceIdeaConfirm({ transcript, onRetry, onDone }) {
  const [draft, setDraft] = useState(() => {
    const p = parseIdeaVoice(transcript);
    return { title: p.title, category: p.category || '景點', desc: p.desc };
  });
  const change = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    const title = draft.title.trim();
    if (!title) { toast('請填寫「標題」'); e.currentTarget.elements.title.focus(); return; }
    addIdea({ ...draft, title, desc: draft.desc.trim() });
    toast('已儲存想法');
    onDone();
  }

  return (
    <form className="form" noValidate onSubmit={submit}>
      <VoiceSaid text={transcript} />
      <div className="form__grid">
        <label className={'field field--full' + (draft.title ? '' : ' is-missing')}>
          <span className="field__label">標題</span>
          <input className="field__input" name="title" value={draft.title} onChange={change} placeholder="例如：黑門市場吃海鮮" required />
        </label>
        <label className="field">
          <span className="field__label">分類</span>
          <select className="field__input" name="category" value={draft.category} onChange={change}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field__label">說明</span>
          <input className="field__input" name="desc" value={draft.desc} onChange={change} placeholder="選填" />
        </label>
      </div>
      <p className="small muted" style={{ margin: 0 }}>參考連結、圖片可在新增後按「開始 → 編輯」補上</p>
      <VoiceActions onRetry={onRetry} />
    </form>
  );
}
