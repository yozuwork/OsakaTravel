import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { closeDialogue, useDialogueStore } from '../../stores/dialogueStore';
import { prefersReducedMotion, usePageTransition } from '../transition/PageTransition';
import { cx } from '../../utils/helpers';

/* =========================================================
   角色立繪對話（劇本由 script prop 傳入，元件不寫死任何角色）
   開啟：背景淡入 → 碎片＋立繪切入 → 對話框彈出 → 名字牌滑入 → 逐字打出台詞
   點擊：打字中 → 直接顯示完整台詞；打完 → 下一位角色，沒有下一位就關閉
   ========================================================= */

const EASE_CUT = 'cubic-bezier(.75,0,.2,1)';
const EASE_BACK = 'cubic-bezier(.2,.9,.3,1)';
const EASE_OUT = 'cubic-bezier(.7,0,.85,.4)';
const TYPE_MS = 55;        // 每字間隔
const TYPE_START_MS = 420; // 開啟後多久開始打字
const NEXT_TYPE_MS = 260;  // 換角色後多久開始打字

const sameSpeaker = (a, b) => a && b && a.name === b.name && a.img === b.img && a.side === b.side;

/**
 * @param {{ script: Array<{ name: string, img: string, side?: 'left'|'right', lift?: string, line: Array<[string, boolean?]> }> }} props
 *   img 是完整網址（utils/dialogueText.js 的 resolveScript 會轉好）
 */
export default function CharacterDialogue({ script }) {
  const isOpen = useDialogueStore((s) => s.isOpen);
  const { isBusy } = usePageTransition();
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(false);

  const rootRef = useRef(null);
  const bgRef = useRef(null);
  const cutinRef = useRef(null);
  const imgRef = useRef(null);
  const redRef = useRef(null);
  const blackRef = useRef(null);
  const whiteRef = useRef(null);
  const boxRef = useRef(null);
  const nameRef = useRef(null);
  const lineRef = useRef(null);
  const nextRef = useRef(null);

  // 不需要觸發重新渲染的執行狀態
  const st = useRef({ open: false, switching: false, anims: [], typing: null, finish: null, timers: new Set(), idx: 0, returnFocus: null });

  const sp = script[idx] || script[0];
  const isLast = idx >= script.length - 1;

  /* ---------- 工具 ---------- */
  const anim = (ref, keyframes, opts) => {
    const a = ref.current.animate(keyframes, { fill: 'both', ...opts });
    st.current.anims.push(a);
    return a;
  };
  const cancelAnims = () => { st.current.anims.forEach((a) => a.cancel()); st.current.anims = []; };
  /** 可在關閉時清掉的計時器 */
  const later = (ms, fn) => {
    const t = setTimeout(() => { st.current.timers.delete(t); fn(); }, ms);
    st.current.timers.add(t);
  };
  const wait = (ms) => new Promise((res) => later(ms, res));
  const clearTimers = () => {
    clearTimeout(st.current.typing);
    st.current.typing = null;
    st.current.finish = null;
    st.current.timers.forEach(clearTimeout);
    st.current.timers.clear();
  };

  /* ---------- 台詞逐字打出 ---------- */
  function typeLine(line) {
    const box = lineRef.current, next = nextRef.current;
    const chars = [];
    line.forEach(([t, hi], seg) => [...t].forEach((c) => chars.push([c, hi, seg])));
    box.textContent = '';
    next.classList.remove('is-shown');
    let k = 0, curEm = null, curSeg = -1;

    // 打完時顯示完整台詞（強調片段用 <em>，\n 用 <br>）
    const renderFull = () => {
      box.textContent = '';
      line.forEach(([t, hi]) => {
        const host = hi ? box.appendChild(document.createElement('em')) : box;
        t.split('\n').forEach((part, i) => {
          if (i) host.appendChild(document.createElement('br'));
          host.appendChild(document.createTextNode(part));
        });
      });
    };
    const done = () => { st.current.typing = null; st.current.finish = null; next.classList.add('is-shown'); };
    st.current.finish = () => { clearTimeout(st.current.typing); renderFull(); done(); };

    const step = () => {
      if (k >= chars.length) { done(); return; }
      const [c, hi, seg] = chars[k++];
      if (c === '\n') box.appendChild(document.createElement('br'));
      else if (hi) {
        if (curSeg !== seg) { curEm = box.appendChild(document.createElement('em')); curSeg = seg; }
        curEm.textContent += c;
      } else box.appendChild(document.createTextNode(c));
      st.current.typing = setTimeout(step, TYPE_MS);
    };
    st.current.typing = setTimeout(step, 0);
  }

  /* ---------- 立繪＋碎片切入（left 時碎片容器鏡像，同一組 keyframes 會從左邊進來） ---------- */
  function enterCutin(delay, side) {
    const dir = side === 'left' ? -1 : 1;
    anim(redRef, [{ transform: 'translateX(110%) skewX(-12deg)' }, { transform: 'none' }], { duration: 200, delay, easing: EASE_CUT });
    anim(blackRef, [{ transform: 'translateX(110%) skewX(-12deg)' }, { transform: 'none' }], { duration: 200, delay: delay + 50, easing: EASE_CUT });
    anim(whiteRef, [{ transform: 'translateX(140%)' }, { transform: 'none' }], { duration: 200, delay: delay + 80, easing: EASE_CUT });
    anim(imgRef, [
      { transform: `translateX(${dir * 70}%)`, opacity: 0 },
      { transform: `translateX(${dir * -4}%)`, opacity: 1, offset: 0.75 },
      { transform: 'none', opacity: 1 }
    ], { duration: 300, delay: delay + 80, easing: EASE_BACK });
    anim(nameRef, [{ transform: 'translateX(-140%) rotate(-6deg)' }, { transform: 'rotate(-6deg)' }],
      { duration: 200, delay: delay + 180, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
  }

  /* ---------- 開啟 ---------- */
  function openTalk() {
    if (st.current.open || !script.length) return;
    if (isBusy()) { closeDialogue(); return; } // 轉場中不開，和原型的 busy 判斷相同
    st.current.open = true;
    st.current.idx = 0;
    st.current.returnFocus = document.activeElement;
    flushSync(() => { setIdx(0); setShown(true); });
    rootRef.current.focus({ preventScroll: true });

    if (prefersReducedMotion()) { typeLine(script[0].line); st.current.finish(); return; }
    anim(bgRef, [
      { opacity: 0, backgroundPosition: '-60px 0, 0 0' },
      { opacity: 1, backgroundPosition: '0 0, 0 0' }
    ], { duration: 300, easing: 'ease-out' });
    enterCutin(40, script[0].side);
    anim(boxRef, [
      { transform: 'scale(.4) rotate(-14deg)', opacity: 0 },
      { transform: 'scale(1.06) rotate(1deg)', opacity: 1, offset: 0.7 },
      { transform: 'none', opacity: 1 }
    ], { duration: 240, delay: 220, easing: 'cubic-bezier(.2,1.3,.4,1)' });
    later(TYPE_START_MS, () => { if (st.current.open) typeLine(script[0].line); });
  }

  /* ---------- 換下一句：同一個角色只換台詞；換角色時舊立繪甩出 → 對話框震一下 → 新立繪從新的一側切入 ---------- */
  async function nextSpeaker() {
    const s = st.current;
    s.switching = true;
    const reduced = prefersReducedMotion();
    const dir = script[s.idx].side === 'left' ? -1 : 1;
    const same = sameSpeaker(script[s.idx], script[s.idx + 1]);
    nextRef.current.classList.remove('is-shown');
    try {
      if (same) {
        // 同一個角色接著說：台詞淡出後直接打下一句，對話框輕輕跳一下
        if (!reduced) {
          const fade = lineRef.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' });
          await fade.finished;
          fade.cancel();
        }
        if (!s.open) return;
        s.idx += 1;
        flushSync(() => setIdx(s.idx));
        lineRef.current.textContent = '';
        if (!reduced) {
          anim(boxRef, [{ transform: 'none' }, { transform: 'translateY(-4px) rotate(-.6deg)', offset: 0.4 }, { transform: 'none' }], { duration: 180 });
          await wait(120);
        }
        if (!s.open) return;
        typeLine(script[s.idx].line);
        if (reduced) s.finish();
        return;
      }
      if (!reduced) {
        const out = cutinRef.current.animate(
          [{ transform: 'none', opacity: 1 }, { transform: `translateX(${dir * 60}%) skewX(-10deg)`, opacity: 0 }],
          { duration: 160, easing: EASE_OUT, fill: 'forwards' }
        );
        const fade = lineRef.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' });
        await out.finished;
        cancelAnims();
        out.cancel();
        fade.cancel();
      }
      if (!s.open) return;
      s.idx += 1;
      flushSync(() => setIdx(s.idx));
      lineRef.current.textContent = '';
      if (!reduced) {
        enterCutin(0, script[s.idx].side);
        anim(boxRef, [
          { transform: 'none' }, { transform: 'translate(-6px,3px) rotate(-1.5deg)', offset: 0.3 },
          { transform: 'translate(4px,-2px) rotate(1deg)', offset: 0.6 }, { transform: 'none' }
        ], { duration: 220, delay: 60 });
        await wait(NEXT_TYPE_MS);
      }
      if (!s.open) return;
      typeLine(script[s.idx].line);
      if (reduced) s.finish();
    } catch {
      // 動畫被取消（例如中途關閉）時不處理
    } finally {
      s.switching = false;
    }
  }

  /* ---------- 關閉：整層往左斜滑淡出 ---------- */
  async function closeTalk() {
    const s = st.current;
    if (!s.open) return;
    s.open = false;
    clearTimers();
    // fill: forwards 停在透明，等隱藏後再 cancel，避免結束瞬間閃一下
    const fade = rootRef.current.animate(
      [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-8%) skewX(-6deg)' }],
      { duration: prefersReducedMotion() ? 1 : 180, easing: EASE_OUT, fill: 'forwards' }
    );
    try { await fade.finished; } catch { /* 被取消也照樣收尾 */ }
    flushSync(() => setShown(false));
    fade.cancel();
    cancelAnims();
    if (lineRef.current) lineRef.current.textContent = '';
    nextRef.current?.classList.remove('is-shown');
    closeDialogue();
    s.returnFocus?.focus?.({ preventScroll: true });
  }

  function onTalkClick() {
    const s = st.current;
    if (!s.open || s.switching) return;
    if (s.finish) { s.finish(); return; }                 // 打字中：先把字打完
    if (s.idx < script.length - 1) { nextSpeaker(); return; } // 還有下一句：換角色
    closeTalk();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeTalk(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTalkClick(); }
  }

  useEffect(() => { if (isOpen) openTalk(); }, [isOpen]);
  // 卸載時清掉計時器與動畫，避免記憶體洩漏
  useEffect(() => () => { clearTimers(); cancelAnims(); }, []);

  return (
    <div ref={rootRef} className={cx('talk', shown && 'is-on', sp?.side === 'left' && 'is-left')}
      role="dialog" aria-modal="true" aria-label="角色對話" aria-hidden={!shown} tabIndex={-1}
      onClick={onTalkClick} onKeyDown={onKeyDown}>
      <div className="talk__bg" ref={bgRef} />
      <div className="talk__stage">
        <div className="cutin" ref={cutinRef}>
          <div className="ci-flip">
            <div className="ci-shard ci-shard--red" ref={redRef} />
            <div className="ci-shard ci-shard--black" ref={blackRef} />
            <div className="ci-shard ci-shard--white" ref={whiteRef} />
          </div>
          {sp && <img ref={imgRef} src={sp.img} alt={sp.name} style={{ bottom: sp.lift || '-2%' }} draggable="false" />}
        </div>
        <div className="dbox" ref={boxRef}>
          <svg className="dbox__shape" viewBox="0 0 360 170" preserveAspectRatio="none" aria-hidden="true">
            {/* 尖角指向立繪那側 */}
            <g className="tail-r"><polygon className="dbox__frame" points="262,4 300,-46 296,10" /></g>
            <g className="tail-l"><polygon className="dbox__frame" points="98,4 60,-46 64,10" /></g>
            <polygon className="dbox__frame" points="0,14 356,0 360,158 6,170" />
            <g className="tail-r"><polygon className="dbox__ink" points="270,12 296,-30 290,16" /></g>
            <g className="tail-l"><polygon className="dbox__ink" points="90,12 64,-30 70,16" /></g>
            <polygon className="dbox__ink" points="9,22 348,9 351,150 14,161" />
          </svg>
          <div className="dname" ref={nameRef} aria-label={sp?.name}>
            {sp && [...sp.name].map((c, i) => <i key={i} aria-hidden="true">{c}</i>)}
          </div>
          <p className="dline" ref={lineRef} aria-live="polite" />
          <span className="dnext" ref={nextRef} aria-hidden="true" />
        </div>
        <div className="thint">{isLast ? '點一下關閉' : '點一下繼續'}</div>
      </div>
    </div>
  );
}
