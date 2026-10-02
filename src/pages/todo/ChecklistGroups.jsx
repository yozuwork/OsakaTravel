import { useState } from 'react';
import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { modal } from '../../stores/modalStore';
import { useModalContext } from '../../components/modal/ModalContext';
import ProgressCard from '../../components/common/ProgressCard';
import CheckRow from '../../components/common/CheckRow';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import { openForm } from '../../components/form/openForm';
import { uid } from '../../utils/helpers';
import { addBagItems } from './todoActions';

/* =========================================================
   分類勾選清單（行李、環球影城共用）
   資料放在 state[listKey]：[{ id, name, items: [{ id, text, done }] }]
   ========================================================= */

/** 開啟「管理分類」彈窗 */
export const openGroupModal = (listKey, gid, title = '管理清單') =>
  modal.open({ title, content: <GroupModal listKey={listKey} gid={gid} /> });

/** 新增一個空分類並打開管理彈窗 */
export function addGroup(listKey, title) {
  const id = uid();
  updateTrip((s) => { s[listKey].push({ id, name: '新分類', items: [] }); });
  openGroupModal(listKey, id, title);
}

const NEW_GROUP = '__new__';

/** 新增項目表單：選分類（或建立新分類）＋項目（可用逗號一次加多個） */
export function openAddItemsForm(listKey, { title = '新增項目', placeholder = '例如：A, B' } = {}) {
  const groups = useTripStore.getState()[listKey] || [];
  openForm({
    title,
    fields: [
      { name: 'gid', label: '分類', type: 'select', full: true, value: groups[0]?.id || NEW_GROUP,
        options: [...groups.map((g) => ({ value: g.id, label: g.name })), { value: NEW_GROUP, label: '＋ 建立新分類' }] },
      { name: 'texts', label: '項目', full: true, required: true, placeholder, hint: '可用逗號一次加多個' }
    ],
    onSave: (v) => {
      const texts = v.texts.split(/[,，、\n]/).map((s) => s.trim()).filter(Boolean);
      if (!texts.length) { toast('請填寫項目'); return false; }
      addBagItems(v.gid === NEW_GROUP ? null : v.gid, texts, listKey);
      toast(`已新增 ${texts.length} 項`);
    }
  });
}

/**
 * @param {object} p
 * @param {string} p.listKey state 裡的清單欄位（'bag'、'usjList'）
 * @param {string} p.progressLabel 進度卡標題
 * @param {string} p.unit 進度卡單位（例如「已打包」）
 * @param {string} [p.modalTitle] 管理彈窗標題
 */
export default function ChecklistGroups({ listKey, progressLabel, unit, modalTitle }) {
  const groups = useTripStore((s) => s[listKey]) || [];
  let done = 0, total = 0;
  groups.forEach((g) => g.items.forEach((it) => { total++; if (it.done) done++; }));

  const toggle = (gid, id) => updateTrip((s) => {
    const it = s[listKey].find((x) => x.id === gid)?.items.find((x) => x.id === id);
    if (it) it.done = !it.done;
  });

  return (
    <>
      <ProgressCard label={progressLabel} done={done} total={total} unit={unit} />
      {groups.map((g) => (
        <section key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="row-between">
            <h2 className="section-title" style={{ fontSize: 16 }}>
              {g.name} <span className="small muted" style={{ fontWeight: 500 }}>{g.items.filter((i) => i.done).length} / {g.items.length}</span>
            </h2>
            <Button size="sm" onClick={() => openGroupModal(listKey, g.id, modalTitle)} aria-label={`管理 ${g.name}`}><Icon name="edit" />管理</Button>
          </div>
          <div className="bag-grid">
            {g.items.map((it) => <CheckRow key={it.id} text={it.text} done={it.done} onToggle={() => toggle(g.id, it.id)} />)}
          </div>
        </section>
      ))}
    </>
  );
}

/** 彈窗內容：直接訂閱 store，刪除項目會即時更新 */
function GroupModal({ listKey, gid }) {
  const { close } = useModalContext();
  const g = useTripStore((s) => s[listKey].find((x) => x.id === gid));
  const [name, setName] = useState(g?.name || '');
  const [newItem, setNewItem] = useState('');
  if (!g) return null;

  const findGroup = (s) => s[listKey].find((x) => x.id === gid);
  const removeItem = (id) => updateTrip((s) => {
    const grp = findGroup(s);
    grp.items = grp.items.filter((x) => x.id !== id);
  });

  function save(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) { toast('請填寫分類名稱'); return; }
    const texts = newItem.split(/[,，、\n]/).map((s) => s.trim()).filter(Boolean);
    updateTrip((s) => {
      const grp = findGroup(s);
      grp.name = n;
      texts.forEach((text) => grp.items.push({ id: uid(), text, done: false }));
    });
    close();
    toast('已更新清單');
  }

  async function removeGroup() {
    if (!(await modal.confirm({ message: `確定要刪除「${g.name}」分類？` }))) return;
    close();
    updateTrip((s) => { s[listKey] = s[listKey].filter((x) => x.id !== gid); });
    toast('已刪除分類');
  }

  const idBase = `${listKey}_${gid}`;
  return (
    <form className="form" onSubmit={save}>
      <div className="field">
        <label className="field__label" htmlFor={`${idBase}_name`}>分類名稱</label>
        <input className="field__input" id={`${idBase}_name`} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="field">
        <span className="field__label">項目</span>
        <div className="list">
          {g.items.length ? g.items.map((it) => (
            <div className="check-row" key={it.id}>
              <span className="check-row__text">{it.text}</span>
              <button type="button" className="check-row__del" aria-label={`刪除：${it.text}`} onClick={() => removeItem(it.id)}><Icon name="x" /></button>
            </div>
          )) : <span className="small muted">還沒有項目</span>}
        </div>
      </div>
      <div className="field">
        <label className="field__label" htmlFor={`${idBase}_new`}>新增項目</label>
        <input className="field__input" id={`${idBase}_new`} value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="可用逗號一次加多個" />
      </div>
      <div className="form__actions">
        <Button type="submit" variant="primary" block>儲存</Button>
        <Button variant="danger" block onClick={() => { removeGroup(); }}><Icon name="trash" />刪除此分類</Button>
      </div>
    </form>
  );
}
