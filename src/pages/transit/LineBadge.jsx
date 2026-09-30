import { LINES } from '../../data/transit/lines';
import { cx } from '../../utils/helpers';

/** 路線徽章：官方色底＋白底代號（compact 只顯示代號） */
export default function LineBadge({ line, compact }) {
  const L = LINES[line];
  if (!L) return null;
  return (
    <span className={cx('line-badge', compact && 'line-badge--code', L.light && 'is-light')}
      style={{ '--line': L.color }} title={compact ? L.name : undefined}>
      <b>{L.code}</b>
      {compact ? <span className="sr-only">{L.name}</span> : L.name}
    </span>
  );
}
