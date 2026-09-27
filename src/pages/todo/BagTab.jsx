import { useState } from 'react';
import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { modal } from '../../stores/modalStore';
import { useModalContext } from '../../components/modal/ModalContext';
import ProgressCard from '../../components/common/ProgressCard';
import CheckRow from '../../components/common/CheckRow';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import { uid } from '../../utils/helpers';

const openBagGroup = (gid) => modal.open({ title: '管理行李清單', content: <BagGroupModal gid={gid} /> });

export default function BagTab() {
  const bag = useTripStore((s) => s.bag);
  let done = 0, total = 0;
  bag.forEach((g) => g.items.forEach((it) => { total++; if (it.done) done++; }));

  const toggle = (gid, id) => updateTrip((s) => {
    const it = s.bag.find((x) => x.id === gid)?.items.find((x) => x.id === id);
    if (it) it.done = !it.done;
  });

  function addGroup() {
    const id = uid();
    updateTrip((s) => { s.bag.push({ id, name: '新分類', items: [] }); });
    openBagGroup(id);
  }

  return (
    <>
      <ProgressCard label="打包進度" done={done} total={total} unit="已打包" />
      {bag.map((g) => (
        <section key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="row-between">
            <h2 className="section-title" style={{ fontSize: 16 }}>
              {g.name} <span className="small muted" style={{ fontWeight: 500 }}>{g.items.filter((i) => i.done).length} / {g.items.length}</span>
            </h2>
            <Button size="sm" onClick={() => openBagGroup(g.id)} aria-label={`管理 ${g.name}`}><Icon name="edit" />管理</Button>
          </div>
          <div className="bag-grid">
            {g.items.map((it) => <CheckRow key={it.id} text={it.text} done={it.done} onToggle={() => toggle(g.id, it.id)} />)}
          </div>
        </section>
      ))}
      <Button variant="dashed" onClick={addGroup}><Icon name="plus" />新增分類</Button>
    </>
  );
}

/** 彈窗內容：直接訂閱 store，刪除項目會即時更新 */
function BagGroupModal({ gid }) {
  const { close } = useModalContext();
  const g = useTripStore((s) => s.bag.find((x) => x.id === gid));
  const [name, setName] = useState(g?.name || '');
  const [newItem, setNewItem] = useState('');
  if (!g) return null;

  const removeItem = (id) => updateTrip((s) => {
    const grp = s.bag.find((x) => x.id === gid);
    grp.items = grp.items.filter((x) => x.id !== id);
  });

  function save(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) { toast('請填寫分類名稱'); return; }
    const texts = newItem.split(/[,，、\n]/).map((s) => s.trim()).filter(Boolean);
    updateTrip((s) => {
      const grp = s.bag.find((x) => x.id === gid);
      grp.name = n;
      texts.forEach((text) => grp.items.push({ id: uid(), text, done: false }));
    });
    close();
    toast('已更新行李清單');
  }

  async function removeGroup() {
    if (!(await modal.confirm({ message: `確定要刪除「${g.name}」分類？` }))) return;
    close();
    updateTrip((s) => { s.bag = s.bag.filter((x) => x.id !== gid); });
    toast('已刪除分類');
  }

  return (
    <form className="form" onSubmit={save}>
      <div className="field">
        <label className="field__label" htmlFor="bag_name">分類名稱</label>
        <input className="field__input" id="bag_name" value={name} onChange={(e) => setName(e.target.value)} required />
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
        <label className="field__label" htmlFor="bag_new">新增項目</label>
        <input className="field__input" id="bag_new" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="可用逗號一次加多個，例如：襪子, 睡衣" />
      </div>
      <div className="form__actions">
        <Button type="submit" variant="primary" block>儲存</Button>
        <Button variant="danger" block onClick={() => { removeGroup(); }}><Icon name="trash" />刪除此分類</Button>
      </div>
    </form>
  );
}
