import { useEffect, useRef, useState } from 'react';
import { modal } from '../../stores/modalStore';
import { useModalContext } from '../modal/ModalContext';
import Button from '../common/Button';
import Icon from '../common/Icon';

const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

const ERROR_TEXT = {
  'not-allowed': '無法使用麥克風，請在瀏覽器設定允許麥克風權限',
  'service-not-allowed': '無法使用麥克風，請在瀏覽器設定允許麥克風權限',
  'audio-capture': '找不到麥克風，請確認裝置有麥克風',
  network: '語音服務連線失敗，請確認網路後再試'
};
const MISHEARD = '沒有聽清楚，再說一次看看';

/**
 * 開啟語音輸入彈窗（行程、待辦、行李、住宿、收集箱共用）
 * @param {object} o
 * @param {string} o.title 彈窗標題
 * @param {string} [o.placeholder] 聆聽時的範例句
 * @param {() => void} o.onText 不支援語音時「改用文字新增」
 * @param {(transcript: string, ctx: { retry: () => void, close: () => void }) => React.ReactNode} o.render
 *   辨識完成後要顯示的確認卡
 */
export function openVoice({ title, ...props }) {
  modal.open({ title, content: <VoiceInput {...props} /> });
}

/**
 * 語音輸入：聆聽中 → 辨識完成（交給 render 顯示確認卡）／辨識失敗
 * 使用瀏覽器原生 Web Speech API，不需後端
 */
export default function VoiceInput({ placeholder, onText, render }) {
  const { close } = useModalContext();
  // listening | result | error | unsupported
  const [status, setStatus] = useState(SpeechRecognition ? 'listening' : 'unsupported');
  const [live, setLive] = useState('');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recRef = useRef(null);

  function start() {
    if (!SpeechRecognition) return;
    recRef.current?.abort();

    const rec = new SpeechRecognition();
    rec.lang = 'zh-TW';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    recRef.current = rec;

    let finalText = '';
    let lastText = '';
    let errCode = '';

    rec.onresult = (e) => {
      let fin = '', interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) fin += r[0].transcript; else interim += r[0].transcript;
      }
      finalText = fin;
      lastText = fin + interim;
      setLive(lastText);
    };
    rec.onerror = (e) => { errCode = e.error; };
    rec.onend = () => {
      // 已被新的辨識取代或元件已關閉（abort）時忽略
      if (recRef.current !== rec) return;
      recRef.current = null;
      // 部分瀏覽器（如 iOS Safari）不一定會標記 isFinal，退回用最後一次的辨識文字
      const text = (finalText || lastText).trim();
      if (text && !ERROR_TEXT[errCode]) {
        setTranscript(text);
        setStatus('result');
      } else {
        setError(ERROR_TEXT[errCode] || MISHEARD);
        setStatus('error');
      }
    };

    setLive('');
    setError('');
    setStatus('listening');
    try {
      rec.start();
    } catch {
      recRef.current = null;
      setError(MISHEARD);
      setStatus('error');
    }
  }

  useEffect(() => {
    start();
    return () => {
      const rec = recRef.current;
      recRef.current = null;
      rec?.abort();
    };
  }, []);

  // 講完後辨識會自動結束；也可以手動按「說完了」提早結束
  const finish = () => recRef.current?.stop();

  if (status === 'unsupported') {
    return (
      <div className="voice">
        <span className="voice__mic voice__mic--off"><Icon bi="mic-mute-fill" /></span>
        <p className="voice__msg">此瀏覽器暫不支援語音輸入，請改用文字新增</p>
        <Button variant="primary" block onClick={() => { close(); onText?.(); }}><Icon bi="keyboard" />改用文字新增</Button>
      </div>
    );
  }

  if (status === 'result') return render(transcript, { retry: start, close });

  if (status === 'error') {
    return (
      <div className="voice">
        <span className="voice__mic voice__mic--off"><Icon bi="mic-fill" /></span>
        <p className="voice__msg">{error}</p>
        {live && <p className="voice__quote">「{live}」</p>}
        <div className="btn-row">
          <Button onClick={close}>取消</Button>
          <Button variant="primary" onClick={start}><Icon bi="arrow-counterclockwise" />重新說一次</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="voice" aria-live="polite">
      <span className="voice__mic is-listening"><Icon bi="mic-fill" /></span>
      <span className="voice__wave" aria-hidden="true"><i /><i /><i /><i /><i /></span>
      <p className="voice__status">正在聆聽…</p>
      <p className={'voice__quote' + (live ? '' : ' is-placeholder')}>
        {live ? `「${live}」` : placeholder}
      </p>
      <div className="btn-row">
        <Button onClick={close}>取消</Button>
        <Button variant="primary" onClick={finish}><Icon name="check" />說完了</Button>
      </div>
    </div>
  );
}

/** 確認卡上方的「你說：「…」」 */
export function VoiceSaid({ text }) {
  return (
    <div className="voice-said">
      <span className="voice-said__label"><Icon bi="mic-fill" />你說</span>
      <p className="voice-said__text">「{text}」</p>
    </div>
  );
}

/** 確認卡底部的「重新說一次／確認新增」 */
export function VoiceActions({ onRetry, submitText = '確認新增' }) {
  return (
    <div className="btn-row">
      <Button onClick={onRetry}><Icon bi="arrow-counterclockwise" />重新說一次</Button>
      <Button type="submit" variant="primary"><Icon name="check" />{submitText}</Button>
    </div>
  );
}
