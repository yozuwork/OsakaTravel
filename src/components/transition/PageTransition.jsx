import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router';

/* =========================================================
   頁面轉場：鋸齒碎片（紅黑白）
   - 底部分頁／左側選單切換時，三層碎片從右側斜切進場，蓋滿後才換頁，再往左退場
   - 全程用 Web Animations API，結束後 cancel 所有動畫
   - busy 鎖與「切換日期」動畫共用，避免連點重疊
   ========================================================= */

export const FX_EASE = 'cubic-bezier(.75,0,.2,1)';
const POP_EASE = 'cubic-bezier(.2,1.4,.4,1)';
const SKEW = 'skewX(-14deg)';
const TITLE_Y = 'translateY(-50%)';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PageTransitionContext = createContext(null);

/** { goPage(to, { en, label }), runLocked(fn), isBusy() } */
export const usePageTransition = () => useContext(PageTransitionContext);

export function PageTransitionProvider({ children }) {
  const navigate = useNavigate();
  const busy = useRef(false);
  const layerRef = useRef(null);
  const stageRef = useRef(null);
  const titleRef = useRef(null);
  const [title, setTitle] = useState({ en: '', zh: '' });

  const isBusy = useCallback(() => busy.current, []);

  /** 取得鎖後執行 fn（動畫中再呼叫會直接略過），回傳是否有執行 */
  const runLocked = useCallback(async (fn) => {
    if (busy.current) return false;
    busy.current = true;
    try { await fn(); } finally { busy.current = false; }
    return true;
  }, []);

  const goPage = useCallback((to, { en = '', label = '' } = {}) => runLocked(async () => {
    if (prefersReducedMotion()) { navigate(to); return; }

    // 先把標題字塊畫出來，動畫才抓得到元素
    flushSync(() => setTitle({ en, zh: label }));
    const layer = layerRef.current;
    const stage = stageRef.current;
    const titleEl = titleRef.current;
    const shards = [...stage.querySelectorAll('.shard')];
    const all = [];
    const track = (a) => { all.push(a); return a; };
    let navigated = false;

    layer.classList.add('is-on');
    try {
      // 1. 三層碎片從右側依序斜切進場
      const ins = shards.map((el, i) => track(el.animate(
        [{ transform: `translateX(130%) ${SKEW}` }, { transform: `translateX(0) ${SKEW}` }],
        { duration: 280, delay: i * 55, easing: FX_EASE, fill: 'forwards' }
      )));
      // 2. 標題字塊彈出
      const pop = track(titleEl.animate([
        { opacity: 0, transform: `${TITLE_Y} scale(1.7) rotate(6deg)` },
        { opacity: 1, transform: `${TITLE_Y} scale(.94) rotate(-2deg)`, offset: 0.7 },
        { opacity: 1, transform: `${TITLE_Y} scale(1) rotate(0)` }
      ], { duration: 260, delay: 200, easing: POP_EASE, fill: 'forwards' }));
      // 3. 畫面輕震
      track(stage.animate([
        { transform: 'translate(0, 0)' }, { transform: 'translate(-4px, 2px)' },
        { transform: 'translate(3px, -2px)' }, { transform: 'translate(0, 0)' }
      ], { duration: 180, delay: 300 }));

      await Promise.all([...ins, pop].map((a) => a.finished));

      // 4. 碎片全部到位才換頁，停留 220ms（用一段靜止動畫計時）
      navigate(to);
      navigated = true;
      await track(titleEl.animate(
        [{ opacity: 1, transform: TITLE_Y }, { opacity: 1, transform: TITLE_Y }],
        { duration: 220 }
      )).finished;

      // 5. 碎片反向依序往左退場，標題往左斜滑淡出
      const outs = [...shards].reverse().map((el, i) => track(el.animate(
        [{ transform: `translateX(0) ${SKEW}` }, { transform: `translateX(-130%) ${SKEW}` }],
        { duration: 300, delay: i * 50, easing: FX_EASE, fill: 'forwards' }
      )));
      const fade = track(titleEl.animate([
        { opacity: 1, transform: `${TITLE_Y} translateX(0)` },
        { opacity: 0, transform: `${TITLE_Y} translateX(-60%) skewX(-20deg)` }
      ], { duration: 200, easing: FX_EASE, fill: 'forwards' }));

      await Promise.all([...outs, fade].map((a) => a.finished));
    } catch {
      // 動畫被中斷（例如分頁切到背景後被取消）時，至少確保已換頁
      if (!navigated) navigate(to);
    } finally {
      layer.classList.remove('is-on');
      all.forEach((a) => a.cancel());
    }
  }), [navigate, runLocked]);

  const value = useMemo(() => ({ goPage, runLocked, isBusy }), [goPage, runLocked, isBusy]);

  return (
    <PageTransitionContext.Provider value={value}>
      {children}
      <div className="xfx" ref={layerRef} aria-hidden="true">
        <div className="xfx__stage" ref={stageRef}>
          <div className="shard shard--black" />
          <div className="shard shard--red" />
          <div className="shard shard--white" />
          <div className="xtitle" ref={titleRef}>
            <span className="xtitle__en">{[...title.en].map((c, i) => <i key={i}>{c}</i>)}</span>
            {title.zh && <span className="xtitle__zh">{title.zh}</span>}
          </div>
        </div>
      </div>
    </PageTransitionContext.Provider>
  );
}
