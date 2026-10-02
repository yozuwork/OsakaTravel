import { toast } from '../../stores/uiStore';
import Icon from './Icon';

/** 補上 https://（使用者常直接貼「www.xxx.com」），不是網址的回傳空字串 */
export function normalizeUrl(u) {
  const s = String(u || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  return /^[\w-]+(\.[\w-]+)+([/?#].*)?$/.test(s) ? `https://${s}` : '';
}

/** 存檔前整理：去空白、去空白列 */
export const cleanLinks = (links) => (links || []).map((s) => String(s).trim()).filter(Boolean);

/**
 * 多筆超連結：可新增、修改、刪除，每筆可複製或前往
 * @param {string[]} value 至少會顯示一列
 * @param {(links: string[]) => void} onChange
 */
export default function LinkList({ value, onChange, idPrefix = 'link' }) {
  const links = value?.length ? value : [''];

  const setAt = (i, v) => onChange(links.map((x, j) => (j === i ? v : x)));
  // 只剩一列時改成清空，保留預設的一個輸入框
  const removeAt = (i) => onChange(links.length > 1 ? links.filter((_, j) => j !== i) : ['']);

  async function copy(u) {
    if (!u.trim()) { toast('沒有可複製的連結'); return; }
    try { await navigator.clipboard.writeText(u.trim()); toast('已複製連結'); } catch { toast('複製失敗，請手動選取'); }
  }

  return (
    <div className="link-list">
      {links.map((u, i) => {
        const href = normalizeUrl(u);
        return (
          <div className="link-row" key={i}>
            <label className="sr-only" htmlFor={`${idPrefix}_${i}`}>超連結 {i + 1}</label>
            <input id={`${idPrefix}_${i}`} className="field__input" type="url" inputMode="url" value={u} placeholder="https://"
              onChange={(e) => setAt(i, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />
            <button type="button" className="link-row__btn" onClick={() => copy(u)} aria-label={`複製超連結 ${i + 1}`} title="複製"><Icon bi="copy" /></button>
            {href
              ? <a className="link-row__btn" href={href} target="_blank" rel="noopener noreferrer" aria-label={`前往超連結 ${i + 1}`} title="前往"><Icon bi="box-arrow-up-right" /></a>
              : <button type="button" className="link-row__btn" disabled aria-label={`前往超連結 ${i + 1}（尚未填寫網址）`} title="請先填寫網址"><Icon bi="box-arrow-up-right" /></button>}
            <button type="button" className="link-row__btn link-row__btn--del" onClick={() => removeAt(i)} aria-label={`刪除超連結 ${i + 1}`} title="刪除"><Icon name="trash" /></button>
          </div>
        );
      })}
      <button type="button" className="btn btn--sm btn--dashed" onClick={() => onChange([...links, ''])}><Icon name="plus" />新增連結</button>
    </div>
  );
}
