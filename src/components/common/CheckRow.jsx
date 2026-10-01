import { useEffect, useState } from 'react';
import Icon from './Icon';
import { cx } from '../../utils/helpers';

/** 勾選列：onEdit 有傳入時，文字可直接編輯並在 Enter／失焦時儲存。 */
export default function CheckRow({ text, done, onToggle, onDelete, onEdit }) {
  const [draft, setDraft] = useState(text);

  useEffect(() => { setDraft(text); }, [text]);

  function commit() {
    const next = draft.trim();
    if (!next) {
      setDraft(text);
      return;
    }
    if (next !== text) onEdit?.(next);
    if (next !== draft) setDraft(next);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setDraft(text);
      e.currentTarget.blur();
    }
  }

  return (
    <div className={cx('check-row', done && 'is-done')}>
      <button type="button" className="check-row__box" role="checkbox" aria-checked={!!done} aria-label={text} onClick={onToggle}>
        <Icon name="check" />
      </button>
      {onEdit ? (
        <input className="check-row__edit" value={draft} onChange={(e) => setDraft(e.target.value)}
          onBlur={commit} onKeyDown={handleKeyDown} aria-label={`編輯待辦：${text}`} />
      ) : (
        <span className="check-row__text" onClick={onToggle}>{text}</span>
      )}
      {onDelete && (
        <button type="button" className="check-row__del" aria-label={`刪除：${text}`} onClick={onDelete}>
          <Icon name="x" />
        </button>
      )}
    </div>
  );
}
