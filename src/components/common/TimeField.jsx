import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// 下拉選項：每 30 分鐘一格，00:00 ~ 23:30
const OPTIONS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);

/** 把輸入整理成 "HH:mm"：接受 1835、18:35、18.35、930、9:5、9；無法辨識回傳 null */
function parseTime(raw) {
  const s = raw.trim().replace(/[：.．\s]/g, ':');
  if (!s) return '';
  let h, m;
  if (s.includes(':')) [h, m] = s.split(':');
  else if (/^\d{1,2}$/.test(s)) [h, m] = [s, '0'];
  else if (/^\d{3,4}$/.test(s)) [h, m] = [s.slice(0, -2), s.slice(-2)];
  else return null;
  if (!/^\d{1,2}$/.test(h) || !/^\d{1,2}$/.test(m || '0')) return null;
  const hh = Number(h), mm = Number(m || 0);
  if (hh > 23 || mm > 59) return null;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// 最接近（不晚於）此時間的選項，用來決定下拉打開時捲到哪
const nearestIndex = (hhmm) => {
  if (!hhmm) return -1;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 2 + (m >= 30 ? 1 : 0);
};

/**
 * 時間欄位（24 小時制）：可直接輸入，也可從下拉挑選（每 30 分鐘一格），值為 "HH:mm" 字串
 * - 受控：傳 value + onChange(text)
 * - 非受控（FormModal 用）：傳 defaultValue + name，值放在隱藏 input 給表單讀
 */
export default function TimeField({ id, name, value, defaultValue, onChange }) {
  const [inner, setInner] = useState(defaultValue || '');
  const text = value !== undefined ? value : inner;
  const [typed, setTyped] = useState(text);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigated = useRef(false); // 有用方向鍵選才讓 Enter 套用反白項目

  useEffect(() => { setTyped(text); }, [text]);

  function commit(next) {
    setTyped(next);
    if (next === text) return;
    if (value === undefined) setInner(next);
    onChange?.(next);
  }

  function openList(from = typed) {
    const r = inputRef.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    setPos({ left: r.left, width: r.width, ...(below < 220 && r.top > below ? { bottom: window.innerHeight - r.top } : { top: r.bottom }) });
    setActive(nearestIndex(parseTime(from) || text));
    navigated.current = false;
    setOpen(true);
  }

  function close() { setOpen(false); }

  function finishTyping() {
    const parsed = parseTime(typed);
    commit(parsed === null ? text : parsed); // 打錯就還原
  }

  function pick(i) {
    commit(OPTIONS[i]);
    close();
  }

  // 打開時把目前值捲到清單中間
  useLayoutEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[Math.max(active, 0)];
    if (el) listRef.current.scrollTop = el.offsetTop - listRef.current.clientHeight / 2 + el.offsetHeight / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || active < 0) return;
    const list = listRef.current, el = list?.children[active];
    if (!el) return;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
  }, [open, active]);

  // 外層捲動或縮放時位置會跑掉，直接收起
  useEffect(() => {
    if (!open) return;
    const onScroll = (e) => { if (!listRef.current?.contains(e.target)) close(); };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => { window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', close); };
  }, [open]);

  function onKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { openList(); return; }
      navigated.current = true;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => Math.min(OPTIONS.length - 1, Math.max(0, (i < 0 ? 0 : i + step))));
    } else if (e.key === 'Enter') {
      e.preventDefault(); // 別送出表單
      if (open && navigated.current && active >= 0) pick(active);
      else { finishTyping(); close(); }
    } else if (e.key === 'Escape' && open) {
      e.nativeEvent.stopPropagation(); // 只收下拉，不關整個視窗
      setTyped(text);
      close();
    }
  }

  function onType(e) {
    const v = e.target.value;
    setTyped(v);
    if (!open) openList(v);
    else if (parseTime(v)) setActive(nearestIndex(parseTime(v)));
    navigated.current = false;
  }

  return (
    <>
      <input ref={inputRef} id={id} className="field__input time-field" type="text" inputMode="numeric" autoComplete="off"
        role="combobox" aria-expanded={open} aria-autocomplete="list" placeholder="--:--"
        value={typed} onChange={onType} onClick={() => { if (!open) openList(); }} onKeyDown={onKeyDown}
        onBlur={() => { finishTyping(); close(); }} />
      {open && pos && createPortal(
        <ul ref={listRef} className="time-field__list" role="listbox" style={pos}
          onMouseDown={(e) => e.preventDefault() /* 保持輸入框焦點 */}>
          {OPTIONS.map((t, i) => (
            <li key={t} role="option" aria-selected={t === text}
              className={'time-field__option' + (i === active ? ' is-active' : '')}
              onMouseEnter={() => { setActive(i); navigated.current = true; }} onClick={() => pick(i)}>{t}</li>
          ))}
        </ul>,
        document.body
      )}
      {name && <input type="hidden" name={name} value={text} />}
    </>
  );
}
