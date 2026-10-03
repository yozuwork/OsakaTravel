import { useRef, useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { modal } from '../../stores/modalStore';
import { toast } from '../../stores/uiStore';
import { openDialogue } from '../../stores/dialogueStore';
import { useTripStore, updateTrip } from '../../stores/tripStore';
import { useModalContext } from '../modal/ModalContext';
import { defaultDialogue } from '../../data/dialogueScript';
import { charImgSrc, lineToText, textToLine } from '../../utils/dialogueText';
import { compressImage } from '../../utils/file';
import { cx, uid } from '../../utils/helpers';
import Button from '../common/Button';
import Icon from '../common/Icon';

/* =========================================================
   對話編輯器：台詞新增／編輯／刪除／拖曳排序／隱藏、換角色；角色可自行新增（上傳去背立繪）
   資料存在 state.dialogue，會跟帳號同步
   ========================================================= */

const LIFT_OPTIONS = [['-2%', '不抬高（預設）'], ['6%', '抬高一點'], ['12%', '抬高（橫幅圖）'], ['20%', '抬高很多']];
const SIDE_LABEL = { left: '左側切入', right: '右側切入' };

export function openDialogueEditor() {
  modal.open({ title: '編輯對話', content: <DialogueEditor /> });
}

/** 角色頭像（圓形，取上方臉的位置） */
export function Avatar({ char, size = 44 }) {
  return (
    <span className="dlg-avatar" style={{ width: size, height: size }}>
      {char ? <img src={charImgSrc(char.img)} alt="" draggable="false" /> : <Icon bi="question-lg" />}
    </span>
  );
}

/** 台詞預覽：【】的部分紅底 */
function LinePreview({ line }) {
  return (
    <span className="dlg-preview">
      {line.map(([t, hi], i) => (hi ? <em key={i}>{t}</em> : <span key={i}>{t}</span>))}
    </span>
  );
}

function DialogueEditor() {
  const { close } = useModalContext();
  const { characters, script } = useTripStore((s) => s.dialogue);
  const charOf = (id) => characters.find((c) => c.id === id);

  const hiddenCount = script.filter((l) => l.hidden).length;

  // 只從把手拖曳，移動 4px 才開始，避免和點擊、捲動衝突；鍵盤：聚焦把手按空白鍵拿起、方向鍵移動
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function dragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    updateTrip((s) => {
      const list = s.dialogue.script;
      s.dialogue.script = arrayMove(list, list.findIndex((l) => l.id === active.id), list.findIndex((l) => l.id === over.id));
    });
  }

  const toggleHidden = (id) => updateTrip((s) => {
    const l = s.dialogue.script.find((x) => x.id === id);
    if (!l) return;
    if (l.hidden) delete l.hidden; else l.hidden = true;
  });

  async function removeLine(l) {
    if (!(await modal.confirm({ message: `刪除這句台詞？\n「${lineToText(l.line).slice(0, 30)}」` }))) return;
    updateTrip((s) => { s.dialogue.script = s.dialogue.script.filter((x) => x.id !== l.id); });
    toast('已刪除台詞');
  }

  async function resetAll() {
    if (!(await modal.confirm({ title: '恢復預設對話', message: '所有台詞和自己新增的角色都會被清除，確定嗎？', confirmText: '恢復預設' }))) return;
    updateTrip((s) => { s.dialogue = defaultDialogue(); });
    toast('已恢復預設對話');
  }

  function preview() {
    if (script.length === hiddenCount) { toast(script.length ? '台詞都被隱藏了' : '還沒有台詞'); return; }
    close();
    openDialogue();
  }

  return (
    <div className="form">
      <section className="setting-group">
        <div className="row-between">
          <h3 className="setting-group__title"><Icon bi="chat-quote-fill" />對話（依序播放）</h3>
          <span className="small muted">{script.length} 句{hiddenCount > 0 && `（${hiddenCount} 句隱藏）`}</span>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}>
          <SortableContext items={script.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <ol className="dlg-lines">
              {script.map((l, i) => (
                <LineRow key={l.id} l={l} i={i} char={charOf(l.charId)} onToggle={toggleHidden} onRemove={removeLine} />
              ))}
              {!script.length && <li className="small muted">還沒有台詞，按下方「新增一句」</li>}
            </ol>
          </SortableContext>
        </DndContext>
        <button type="button" className="btn btn--sm btn--dashed" onClick={() => openLineEditor(null)}><Icon name="plus" />新增一句</button>
      </section>

      <section className="setting-group">
        <h3 className="setting-group__title"><Icon bi="people-fill" />角色（頭像）</h3>
        <div className="dlg-chars">
          {characters.map((c) => (
            <button type="button" key={c.id} className="dlg-char" onClick={() => openCharEditor(c.id)} aria-label={`編輯角色：${c.name}`}>
              <Avatar char={c} size={56} />
              <span>{c.name}</span>
              {c.builtin && <span className="dlg-char__tag">預設</span>}
            </button>
          ))}
          <button type="button" className="dlg-char dlg-char--add" onClick={() => openCharEditor(null)}>
            <span className="dlg-avatar" style={{ width: 56, height: 56 }}><Icon name="plus" /></span>
            <span>新增角色</span>
          </button>
        </div>
      </section>

      <div className="btn-row">
        <Button onClick={resetAll}><Icon bi="arrow-counterclockwise" />恢復預設</Button>
        <Button variant="primary" onClick={preview}><Icon bi="play-fill" />預覽播放</Button>
      </div>
    </div>
  );
}

/** 台詞列表的一列（可拖曳排序） */
function LineRow({ l, i, char, onToggle, onRemove }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: l.id });
  // 只允許上下移動
  const style = { transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined, transition };

  return (
    <li ref={setNodeRef} style={style} className={cx('dlg-line', l.hidden && 'is-hidden', isDragging && 'is-dragging')}>
      <button type="button" ref={setActivatorNodeRef} className="dlg-line__grip" {...attributes} {...listeners} aria-label={`拖曳排序第 ${i + 1} 句`}>
        <Icon bi="grip-vertical" />
      </button>
      <button type="button" className="dlg-line__main" onClick={() => openLineEditor(l.id)} aria-label={`編輯第 ${i + 1} 句`}>
        <Avatar char={char} />
        <span className="dlg-line__text">
          <span className="dlg-line__name">
            {char?.name || '（角色已刪除）'}<span className="small muted">・{SIDE_LABEL[l.side || char?.side] || ''}</span>
            {l.hidden && <span className="dlg-line__tag">已隱藏</span>}
          </span>
          <LinePreview line={l.line} />
        </span>
      </button>
      <span className="dlg-line__tools">
        <button type="button" className="link-row__btn" onClick={() => onToggle(l.id)} aria-pressed={!!l.hidden}
          aria-label={l.hidden ? '顯示這句' : '隱藏這句'} title={l.hidden ? '顯示這句' : '隱藏這句'}>
          <Icon bi={l.hidden ? 'eye-slash' : 'eye'} />
        </button>
        <button type="button" className="link-row__btn link-row__btn--del" onClick={() => onRemove(l)} aria-label="刪除這句"><Icon name="trash" /></button>
      </span>
    </li>
  );
}

/* ---------- 編輯一句台詞 ---------- */
function openLineEditor(id) {
  modal.open({ title: id ? '編輯台詞' : '新增台詞', content: <LineEditor id={id} /> });
}

function LineEditor({ id }) {
  const { close } = useModalContext();
  const { characters, script } = useTripStore((s) => s.dialogue);
  const existing = id ? script.find((l) => l.id === id) : null;
  // 新增時預設用上一句的角色，方便連續編同一個人的台詞
  const [charId, setCharId] = useState(existing?.charId || script.at(-1)?.charId || characters[0]?.id || '');
  const [side, setSide] = useState(existing?.side || '');
  const [text, setText] = useState(existing ? lineToText(existing.line) : '');
  const char = characters.find((c) => c.id === charId);
  const line = textToLine(text);

  function save(e) {
    e.preventDefault();
    if (!char) { toast('請選擇角色'); return; }
    if (!text.trim()) { toast('請填寫台詞'); return; }
    const data = { charId, line, ...(side ? { side } : {}) };
    updateTrip((s) => {
      const list = s.dialogue.script;
      const t = existing && list.find((l) => l.id === id);
      if (t) { Object.assign(t, data); if (!side) delete t.side; } else list.push({ id: uid(), ...data });
    });
    toast(existing ? '已更新台詞' : '已新增台詞');
    close();
  }

  return (
    <form className="form" noValidate onSubmit={save}>
      <div className="field">
        <span className="field__label">角色</span>
        <div className="dlg-chars dlg-chars--pick" role="radiogroup" aria-label="選擇角色">
          {characters.map((c) => (
            <button type="button" key={c.id} role="radio" aria-checked={c.id === charId}
              className={cx('dlg-char', c.id === charId && 'is-selected')} onClick={() => setCharId(c.id)}>
              <Avatar char={c} size={52} /><span>{c.name}</span>
            </button>
          ))}
          <button type="button" className="dlg-char dlg-char--add" onClick={() => openCharEditor(null, setCharId)}>
            <span className="dlg-avatar" style={{ width: 52, height: 52 }}><Icon name="plus" /></span><span>新增角色</span>
          </button>
        </div>
      </div>
      <label className="field">
        <span className="field__label">立繪方向</span>
        <select className="field__input" value={side} onChange={(e) => setSide(e.target.value)}>
          <option value="">跟角色設定（{SIDE_LABEL[char?.side] || '右側切入'}）</option>
          <option value="right">右側切入</option>
          <option value="left">左側切入</option>
        </select>
      </label>
      <label className="field">
        <span className="field__label">台詞</span>
        <textarea className="field__input" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="例如：對了，可以去【無印良品】嗎？" />
        <span className="field__hint">用【】括起來的字會用紅底強調；按 Enter 換行</span>
      </label>
      {text.trim() && (
        <div className="dlg-sample" aria-label="預覽">
          <span className="dlg-sample__name">{char?.name}</span>
          <p className="dlg-sample__line">{line.map(([t, hi], i) => {
            const parts = t.split('\n').flatMap((p, k) => (k ? [<br key={`b${k}`} />, p] : [p]));
            return hi ? <em key={i}>{parts}</em> : <span key={i}>{parts}</span>;
          })}</p>
        </div>
      )}
      <Button type="submit" variant="primary" block><Icon name="check" />{existing ? '儲存' : '新增'}</Button>
    </form>
  );
}

/* ---------- 新增／編輯角色 ---------- */
/** @param {(id: string) => void} [onCreated] 新增完成後回傳新角色 id（台詞編輯器用來自動選取） */
function openCharEditor(id, onCreated) {
  modal.open({ title: id ? '編輯角色' : '新增角色', content: <CharEditor id={id} onCreated={onCreated} /> });
}

function CharEditor({ id, onCreated }) {
  const { close } = useModalContext();
  const { characters, script } = useTripStore((s) => s.dialogue);
  const existing = id ? characters.find((c) => c.id === id) : null;
  const [draft, setDraft] = useState(() => existing ? { ...existing } : { name: '', img: '', side: 'right', lift: '-2%' });
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const usedBy = existing ? script.filter((l) => l.charId === id).length : 0;

  async function pick(file) {
    if (!file?.type?.startsWith('image/')) { toast('這不是圖片檔'); return; }
    setBusy(true);
    try {
      // 存成 WebP（不支援的瀏覽器會改存 PNG），保留去背的透明
      const img = await compressImage(file, 800, 0.9, 'image/webp');
      setDraft((d) => ({ ...d, img }));
    } catch {
      toast('圖片讀取失敗');
    } finally {
      setBusy(false);
    }
  }

  function save(e) {
    e.preventDefault();
    const name = draft.name.trim();
    if (!name) { toast('請填寫角色名字'); return; }
    if (!draft.img) { toast('請上傳角色立繪'); return; }
    const data = { name, img: draft.img, side: draft.side, lift: draft.lift };
    const newId = existing ? id : uid();
    updateTrip((s) => {
      const t = existing && s.dialogue.characters.find((c) => c.id === id);
      if (t) Object.assign(t, existing.builtin ? { name, side: data.side, lift: data.lift } : data);
      else s.dialogue.characters.push({ id: newId, ...data });
    });
    toast(existing ? '已更新角色' : '已新增角色');
    close();
    if (!existing) onCreated?.(newId);
  }

  async function remove() {
    const msg = usedBy ? `「${existing.name}」還有 ${usedBy} 句台詞，刪除角色會一起刪掉這些台詞，確定嗎？` : `確定要刪除「${existing.name}」？`;
    if (!(await modal.confirm({ message: msg }))) return;
    updateTrip((s) => {
      s.dialogue.characters = s.dialogue.characters.filter((c) => c.id !== id);
      s.dialogue.script = s.dialogue.script.filter((l) => l.charId !== id);
    });
    toast('已刪除角色');
    close();
  }

  const change = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));

  return (
    <form className="form" noValidate onSubmit={save}>
      <div className="dlg-portrait">
        <div className={cx('dlg-portrait__box', !draft.img && 'is-empty')}>
          {draft.img ? <img src={charImgSrc(draft.img)} alt="" /> : <Icon bi="person-bounding-box" />}
          {busy && <span className="img-busy"><span className="spinner" aria-hidden="true" /></span>}
        </div>
        <div className="dlg-portrait__side">
          {existing?.builtin
            ? <span className="field__hint">預設角色的立繪不能更換；想用其他圖片可以「新增角色」</span>
            : <>
              <button type="button" className="btn btn--sm" onClick={() => inputRef.current?.click()} disabled={busy}>
                <Icon bi="upload" />{draft.img ? '更換立繪' : '上傳立繪'}
              </button>
              <span className="field__hint">建議用已去背的 PNG／WebP，人物上半身、臉在上方</span>
            </>}
        </div>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) pick(f); }} />
      </div>
      <div className="form__grid">
        <label className="field field--full">
          <span className="field__label">名字</span>
          <input className="field__input" name="name" value={draft.name} onChange={change} placeholder="例如：小美" maxLength={6} />
          <span className="field__hint">名字牌每個字一個方塊，建議 2～4 個字</span>
        </label>
        <label className="field">
          <span className="field__label">預設方向</span>
          <select className="field__input" name="side" value={draft.side} onChange={change}>
            <option value="right">右側切入</option>
            <option value="left">左側切入</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">立繪高度</span>
          <select className="field__input" name="lift" value={draft.lift} onChange={change}>
            {LIFT_OPTIONS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </label>
      </div>
      {existing && !existing.builtin ? (
        <div className="btn-row">
          <Button variant="danger" onClick={remove}><Icon name="trash" />刪除角色</Button>
          <Button type="submit" variant="primary"><Icon name="check" />儲存</Button>
        </div>
      ) : (
        <Button type="submit" variant="primary" block><Icon name="check" />{existing ? '儲存' : '新增角色'}</Button>
      )}
    </form>
  );
}
