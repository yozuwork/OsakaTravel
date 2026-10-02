import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { prefersReducedMotion, usePageTransition } from './PageTransition';
import {
  BURST_POINTS, EASE_CUT, EASE_IN, EASE_OUT, EASE_POP, HOLD_MS, SPEED_LINES,
  layoutPanels, toClipPath, toPoints
} from './mangaShapes';

/**
 * 切換日期：黑白漫畫斜切轉場（約 0.85 秒）
 * 白紙斜切蓋上 → 黑線劃過 → 上下兩格沿斜線滑入（集中線＋爆炸框／日期大字）
 * → 停留 HOLD_MS 後才切換資料 → 兩格錯開滑出，新的列依序斜滑進來
 *
 * @param {object} o
 * @param {number} o.current 目前選取的日期
 * @param {(next: number) => void} o.onSwitch 實際切換資料
 * @param {(next: number) => { d: string, tag: string, date: string, caption: string }} o.getInfo 分格上的文字
 * @param {React.RefObject<HTMLElement>} o.anchorRef 轉場層從這個元素的下緣開始蓋（日期按鈕列）
 * @param {React.RefObject<HTMLElement>} o.boundsRef 轉場層左右對齊這個元素（內容區）
 * @param {React.RefObject<HTMLElement>} o.listRef 列表容器，切換後捲回頂部並讓 rowSelector 進場
 * @returns {{ pressedDay: number, switchDay: (next: number) => void, overlay: JSX.Element }}
 */
export function useMangaDaySwitch({ current, onSwitch, getInfo, anchorRef, boundsRef, listRef, rowSelector = '.tl-row' }) {
  const { runLocked } = usePageTransition();
  const [pending, setPending] = useState(null);
  const [info, setInfo] = useState({ d: '', tag: '', date: '', caption: '' });
  const enterNext = useRef(false);
  const r = {
    root: useRef(null), paper: useRef(null), top: useRef(null), bottom: useRef(null),
    topEdge: useRef(null), bottomEdge: useRef(null), burst: useRef(null), lineSvg: useRef(null), line: useRef(null)
  };

  // 資料切換後（DOM 已更新、尚未繪製），新的列依序斜滑進來
  useLayoutEffect(() => {
    if (!enterNext.current) return;
    enterNext.current = false;
    (listRef.current?.querySelectorAll(rowSelector) || []).forEach((el, k) => {
      el.animate(
        [{ opacity: 0, transform: 'translateX(24px) skewX(-6deg)' }, { opacity: 1, transform: 'none' }],
        { duration: 200, delay: 110 + k * 35, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' }
      ).finished.then((a) => a.cancel(), () => {});
    });
  }, [current, listRef, rowSelector]);

  /** 量出列表區的位置，並依實際寬高重新計算分格座標 */
  function measure() {
    const root = r.root.current;
    const anchor = anchorRef.current.getBoundingClientRect();
    const bounds = boundsRef.current.getBoundingClientRect();
    const top = Math.max(0, anchor.bottom);
    const W = bounds.width, H = window.innerHeight - top;
    Object.assign(root.style, { top: `${top}px`, left: `${bounds.left}px`, width: `${W}px`, height: `${H}px` });

    const { top: tp, bottom: bp, line, dy } = layoutPanels(W, H);
    r.top.current.style.clipPath = toClipPath(tp);
    r.bottom.current.style.clipPath = toClipPath(bp);
    r.topEdge.current.setAttribute('points', toPoints(tp));
    r.bottomEdge.current.setAttribute('points', toPoints(bp));
    const ln = r.line.current;
    ln.setAttribute('x1', line.x1); ln.setAttribute('y1', line.y1);
    ln.setAttribute('x2', line.x2); ln.setAttribute('y2', line.y2);
    ln.style.strokeDasharray = line.len;
    return { W, dy, len: line.len };
  }

  const switchDay = useCallback((next) => {
    if (next === current) return;
    runLocked(async () => {
      if (prefersReducedMotion() || !r.root.current || !anchorRef.current || !boundsRef.current) { onSwitch(next); return; }

      // 按下就更新按鈕狀態與分格文字
      flushSync(() => { setPending(next); setInfo(getInfo(next)); });
      const { W, dy, len } = measure();
      const along = (f) => `translate(${W * f}px, ${-dy * f}px)`;   // 沿斜線方向移動
      const all = [];
      const run = (ref, keyframes, opts) => { const a = ref.current.animate(keyframes, { fill: 'both', ...opts }); all.push(a); return a; };
      let switched = false;

      r.root.current.classList.add('is-on');
      try {
        // 1. 白紙從右側斜切蓋上，一道黑線沿斜切線劃過
        run(r.paper, [
          { clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 130% 100%)' },
          { clipPath: 'polygon(-30% 0, 100% 0, 100% 100%, 0% 100%)' }
        ], { duration: 150, easing: EASE_CUT });
        run(r.line, [{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 150, delay: 30, easing: EASE_CUT });
        run(r.lineSvg, [{ opacity: 1 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: 260, delay: 30 });

        // 2. 兩格沿斜線反方向滑進來，爆炸框彈出
        run(r.top, [{ transform: along(1.1) }, { transform: 'none' }], { duration: 190, delay: 90, easing: EASE_IN });
        run(r.bottom, [{ transform: along(-1.1) }, { transform: 'none' }], { duration: 190, delay: 130, easing: EASE_IN });
        run(r.burst, [
          { transform: 'translate(-50%,-50%) scale(0) rotate(-20deg)' },
          { transform: 'translate(-50%,-50%) scale(1.1) rotate(3deg)', offset: 0.7 },
          { transform: 'translate(-50%,-50%) scale(1) rotate(0)' }
        ], { duration: 200, delay: 200, easing: EASE_POP });

        // 3. 停留到 HOLD_MS 才切換行程資料（用一段靜止動畫計時），列表捲回頂部
        await run(r.root, [{ opacity: 1 }, { opacity: 1 }], { duration: HOLD_MS, fill: 'none' }).finished;
        enterNext.current = true;
        onSwitch(next);
        switched = true;
        const listTop = listRef.current?.getBoundingClientRect().top ?? 0;
        if (listTop < 0) window.scrollBy(0, listTop);

        // 4. 兩格沿斜線錯開滑出，白紙淡出
        const outs = [
          run(r.top, [{ transform: 'none' }, { transform: along(-1.15) }], { duration: 230, easing: EASE_OUT }),
          run(r.bottom, [{ transform: 'none' }, { transform: along(1.15) }], { duration: 230, delay: 30, easing: EASE_OUT }),
          run(r.paper, [{ opacity: 1 }, { opacity: 0 }], { duration: 120, delay: 60 })
        ];
        await Promise.all(outs.map((a) => a.finished));
      } catch {
        if (!switched) onSwitch(next);
      } finally {
        r.root.current?.classList.remove('is-on');
        all.forEach((a) => a.cancel());
        setPending(null);
      }
    });
  }, [current, onSwitch, getInfo, runLocked, anchorRef, boundsRef, listRef]);

  const overlay = (
    <div className="manga" ref={r.root} aria-hidden="true">
      <div className="manga__paper" ref={r.paper} />
      <div className="manga__pn manga__pn--top" ref={r.top}>
        <svg className="manga__lines" viewBox="-100 -100 200 200"><path d={SPEED_LINES} /></svg>
        <div className="manga__burst" ref={r.burst}>
          <svg viewBox="0 0 240 200">
            <polygon points={BURST_POINTS} />
            <text x="120" y="122" textAnchor="middle" transform="rotate(-6 120 100)">{info.d}</text>
          </svg>
        </div>
        <svg className="manga__edge"><polygon ref={r.topEdge} /></svg>
      </div>
      <div className="manga__pn manga__pn--bottom" ref={r.bottom}>
        <div className="manga__tone" />
        <span className="manga__tag">{info.tag}</span>
        <span className="manga__big">{info.date}</span>
        {info.caption && <span className="manga__cap">{info.caption}</span>}
        <svg className="manga__edge"><polygon ref={r.bottomEdge} /></svg>
      </div>
      <svg className="manga__slashline" ref={r.lineSvg}><line ref={r.line} /></svg>
    </div>
  );

  return { pressedDay: pending ?? current, switchDay, overlay };
}
