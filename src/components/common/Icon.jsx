import { ICONS } from './icons';
import { cx } from '../../utils/helpers';

/**
 * 圖示
 * - 既有圖示：<Icon name="plane" />
 * - 之後新增的圖示請用 Bootstrap Icons：<Icon bi="airplane" />
 *   （名稱查 https://icons.getbootstrap.com/ ，去掉前綴 bi-）
 */
export default function Icon({ name, bi, className }) {
  if (bi) return <i className={cx('bi', `bi-${bi}`, 'i-bi', className)} aria-hidden="true" />;
  return (
    <svg className={cx('i', className)} viewBox="0 0 24 24" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }} />
  );
}
