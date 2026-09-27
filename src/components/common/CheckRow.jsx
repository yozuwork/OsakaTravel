import Icon from './Icon';
import { cx } from '../../utils/helpers';

/** 勾選列：onToggle 切換、onDelete（選填）顯示刪除鈕 */
export default function CheckRow({ text, done, onToggle, onDelete }) {
  return (
    <div className={cx('check-row', done && 'is-done')}>
      <button type="button" className="check-row__box" role="checkbox" aria-checked={!!done} aria-label={text} onClick={onToggle}>
        <Icon name="check" />
      </button>
      <span className="check-row__text" onClick={onToggle}>{text}</span>
      {onDelete && (
        <button type="button" className="check-row__del" aria-label={`刪除：${text}`} onClick={onDelete}>
          <Icon name="x" />
        </button>
      )}
    </div>
  );
}
