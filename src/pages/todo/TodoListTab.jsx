import { useRef, useState } from 'react';
import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { openForm } from '../../components/form/openForm';
import ProgressCard from '../../components/common/ProgressCard';
import CheckRow from '../../components/common/CheckRow';
import Icon from '../../components/common/Icon';
import Fab, { addActions } from '../../components/common/Fab';
import { addTodos } from './todoActions';
import { openVoiceTodo } from './voiceTodo';

export default function TodoListTab() {
  const todos = useTripStore((s) => s.todos);
  const showDone = useTripStore((s) => s.ui.showDone);
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const pending = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  const toggle = (id) => updateTrip((s) => { const t = s.todos.find((x) => x.id === id); if (t) t.done = !t.done; });
  const remove = (id) => { updateTrip((s) => { s.todos = s.todos.filter((x) => x.id !== id); }); toast('已刪除待辦'); };
  const edit = (id, text) => {
    updateTrip((s) => { const t = s.todos.find((x) => x.id === id); if (t) t.text = text; });
    toast('已更新待辦');
  };

  function add(e) {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    addTodos([v]);
    setText('');
    inputRef.current?.focus();
  }

  // 手機版：右下角按鈕開表單新增
  function openAdd() {
    openForm({
      title: '新增待辦',
      fields: [{ name: 'text', label: '待辦事項', value: '', required: true, full: true, placeholder: '例如：預約美容院' }],
      onSave: (v) => {
        const t = v.text.trim();
        if (!t) { toast('請填寫待辦事項'); return false; }
        addTodos([t]);
        toast('已新增待辦');
      }
    });
  }

  const row = (t) => <CheckRow key={t.id} text={t.text} done={t.done} onToggle={() => toggle(t.id)} onDelete={() => remove(t.id)} onEdit={(text) => edit(t.id, text)} />;

  return (
    <>
      <ProgressCard label="行前準備進度" done={done.length} total={todos.length} unit="已完成" />
      <div className="row-between">
        <h2 className="section-title">待辦事項（{pending.length}）</h2>
        <button className="switch" role="switch" aria-checked={showDone} onClick={() => updateTrip((s) => { s.ui.showDone = !s.ui.showDone; })}>
          顯示已完成<span className="switch__track"><span className="switch__knob" /></span>
        </button>
      </div>
      <div className="list">
        {pending.map(row)}
        {!pending.length && <div className="empty"><span className="empty__title">待辦都完成了，準備出發！</span></div>}
      </div>
      {showDone && done.length > 0 && (
        <>
          <h2 className="section-title small muted" style={{ fontSize: 15 }}>已完成（{done.length}）</h2>
          <div className="list">{done.map(row)}</div>
        </>
      )}
      {!showDone && done.length > 0 && <p className="small muted" style={{ textAlign: 'center', margin: 0 }}>已隱藏 {done.length} 項已完成待辦</p>}
      <form className="row-between add-inline" style={{ gap: 8 }} onSubmit={add}>
        <label htmlFor="todoInput" className="sr-only">新增待辦</label>
        <input id="todoInput" ref={inputRef} className="field__input" placeholder="新增待辦，例如：預約美容院" autoComplete="off"
          value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn--primary" type="submit" aria-label="新增待辦"><Icon name="plus" /></button>
      </form>
      <Fab label="新增待辦" actions={addActions({ voiceDesc: '用說的快速新增待辦', textDesc: '手動輸入待辦內容', onText: openAdd, onVoice: () => openVoiceTodo(openAdd) })} />
    </>
  );
}
