import { useMemo, useRef, useState } from 'react';
import { modal } from '../../stores/modalStore';
import { useModalContext } from '../../components/modal/ModalContext';
import { STATION_META } from '../../data/transit/stations';
import { STATION_LINES, searchStations } from '../../utils/transit';
import LineBadge from './LineBadge';

/** 開啟選站面板（Esc、點背景都可關閉；關閉後焦點回到原本的欄位） */
export function openStationPicker({ title, onPick }) {
  modal.open({ title, content: <StationPicker onPick={onPick} /> });
}

function StationPicker({ onPick }) {
  const { close } = useModalContext();
  const [q, setQ] = useState('');
  const hits = useMemo(() => searchStations(q), [q]);
  const listRef = useRef(null);

  const pick = (s) => { close(); onPick(s); };

  // ↑↓ 在搜尋框與清單之間移動；搜尋框按 Enter 直接選第一個結果
  const onKeyDown = (e) => {
    const items = [...(listRef.current?.querySelectorAll('button') || [])];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(i + 1, items.length - 1)]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); (i <= 0 ? e.currentTarget.querySelector('input') : items[i - 1])?.focus(); }
    else if (e.key === 'Enter' && e.target.tagName === 'INPUT' && hits[0]) { e.preventDefault(); pick(hits[0]); }
  };

  return (
    <div className="station-picker" onKeyDown={onKeyDown}>
      <div className="station-picker__search">
        <label className="sr-only" htmlFor="station-q">搜尋車站</label>
        <input id="station-q" className="field__input" type="search" autoComplete="off" value={q}
          placeholder="站名：難波、心齋橋、USJ、Umeda…" onChange={(e) => setQ(e.target.value)} />
      </div>
      {hits.length ? (
        <ul className="station-list" ref={listRef} aria-label="車站">
          {hits.map((s) => {
            const m = STATION_META[s];
            const sub = m && [m.zh !== s && m.zh, m.en, ...(m.spots || [])].filter(Boolean).join(' · ');
            return (
              <li key={s}>
                <button type="button" className="station-list__item" onClick={() => pick(s)}>
                  <span className="station-list__name">{s}{sub && <small>{sub}</small>}</span>
                  <span className="station-list__lines">
                    {STATION_LINES[s].map((l) => <LineBadge key={l} line={l} compact />)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="small muted" role="status">找不到「{q}」。試試日文站名、中文景點或英文，例如「難波」「Umeda」。</p>
      )}
    </div>
  );
}
