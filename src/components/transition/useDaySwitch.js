import { useCallback, useLayoutEffect, useRef } from 'react';
import { FX_EASE, prefersReducedMotion, usePageTransition } from './PageTransition';

const ROT = 'rotate(-12deg)';

/**
 * 切換日期動畫：紅色網點斜帶從左劃到右（共 520ms，中段停一下），
 * 劃到中間時切換資料，新的列依序從右側斜滑進場
 *
 * @param {object} o
 * @param {number} o.current 目前選取的日期
 * @param {(next: number) => void} o.onSwitch 實際切換資料
 * @param {React.RefObject<HTMLElement>} o.slashRef 斜帶元素
 * @param {React.RefObject<HTMLElement>} o.listRef 列表容器（底下的 rowSelector 會做進場動畫）
 * @param {string} [o.rowSelector]
 * @returns {(next: number) => void} 取代原本的 setDay
 */
export function useDaySwitch({ current, onSwitch, slashRef, listRef, rowSelector = '.tl-row' }) {
  const { runLocked } = usePageTransition();
  const enterNext = useRef(false);

  // 資料切換後（DOM 已更新、尚未繪製），讓新的列依序斜滑進來
  useLayoutEffect(() => {
    if (!enterNext.current) return;
    enterNext.current = false;
    const rows = listRef.current?.querySelectorAll(rowSelector) || [];
    rows.forEach((el, k) => {
      el.animate(
        [{ opacity: 0, transform: 'translateX(40px) skewX(-8deg)' }, { opacity: 1, transform: 'none' }],
        { duration: 260, delay: 80 + k * 45, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' }
      ).finished.then((a) => a.cancel(), () => {});
    });
  }, [current, listRef, rowSelector]);

  return useCallback((next) => {
    if (next === current) return;
    runLocked(async () => {
      const slash = slashRef.current;
      if (prefersReducedMotion() || !slash) { onSwitch(next); return; }

      const all = [];
      const run = (keyframes, opts) => { const a = slash.animate(keyframes, opts); all.push(a); return a.finished; };
      let switched = false;
      slash.classList.add('is-on');
      try {
        // 劃進來：0 → 45%（約 234ms）
        await run([{ transform: `translateX(-120%) ${ROT}` }, { transform: `translateX(0) ${ROT}` }],
          { duration: 234, easing: FX_EASE, fill: 'forwards' });
        // 停在中間時切換當天資料
        enterNext.current = true;
        onSwitch(next);
        switched = true;
        // 中段停一下：45% → 55%（52ms）
        await run([{ transform: `translateX(0) ${ROT}` }, { transform: `translateX(0) ${ROT}` }],
          { duration: 52, fill: 'forwards' });
        // 劃出去：55% → 100%（234ms）
        await run([{ transform: `translateX(0) ${ROT}` }, { transform: `translateX(120%) ${ROT}` }],
          { duration: 234, easing: FX_EASE, fill: 'forwards' });
      } catch {
        if (!switched) onSwitch(next);
      } finally {
        slash.classList.remove('is-on');
        all.forEach((a) => a.cancel());
      }
    });
  }, [current, onSwitch, runLocked, slashRef]);
}
