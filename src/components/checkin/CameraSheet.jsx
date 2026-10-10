import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from '../../stores/uiStore';
import { blobToPhotoCanvas, toPhotoCanvas } from '../../features/checkin/photo';
import Icon from '../common/Icon';

/**
 * 網頁相機（getUserMedia，只能在 https 或 localhost 使用）
 * 可切換前後鏡頭、從相簿選；相機被擋時改用系統相機（input capture）
 * @param {object} p
 * @param {string} p.title 上方標題
 * @param {() => void} p.onClose
 * @param {(photo: HTMLCanvasElement) => void} p.onPhoto 拍好（已縮到最長邊 1600）
 */
export default function CameraSheet({ title, onClose, onPhoto }) {
  const videoRef = useRef(null);
  const camInputRef = useRef(null);
  const libInputRef = useRef(null);
  const [facing, setFacing] = useState('environment');
  const [fail, setFail] = useState(''); // 開不了相機時的說明

  // 開相機；換鏡頭或關閉時停掉舊的串流
  useEffect(() => {
    let stream = null;
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setFail('這個瀏覽器不讓網頁直接開相機，可以改用手機相機拍，拍完會自動帶回來。');
      return;
    }
    setFail('');
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false
    }).then((s) => {
      if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
      stream = s;
      const v = videoRef.current;
      if (v) { v.srcObject = s; v.play().catch(() => {}); }
    }).catch((e) => {
      if (cancelled) return;
      setFail(e?.name === 'NotAllowedError'
        ? '相機權限被擋住了。可以改用手機相機拍，拍完會自動帶回來。'
        : '這個瀏覽器不讓網頁直接開相機，可以改用手機相機拍，拍完會自動帶回來。');
    });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [facing]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function shoot() {
    const v = videoRef.current;
    if (!v?.videoWidth) return;
    onPhoto(toPhotoCanvas(v, v.videoWidth, v.videoHeight, facing === 'user'));
  }

  const onFile = useCallback(async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      onPhoto(await blobToPhotoCanvas(f));
    } catch {
      toast('這張照片讀不出來，換一張試試');
    }
  }, [onPhoto]);

  return createPortal(
    <section className={`ck-ov ck-cam${fail ? ' is-fail' : ''}`} aria-label="相機">
      <div className="ck-cam__top">
        <button type="button" className="ck-icon" onClick={onClose} aria-label="關閉相機"><Icon name="x" /></button>
        <b>{title}</b>
        <button type="button" className="ck-icon" onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
          aria-label="切換前後鏡頭" disabled={!!fail}><Icon bi="arrow-repeat" /></button>
      </div>
      <div className="ck-cam__view">
        <video ref={videoRef} playsInline muted autoPlay />
        <div className="ck-cam__frame" />
        {fail && (
          <div className="ck-cam__fail">
            <p>{fail}</p>
            <button type="button" className="ck-pick is-solid" onClick={() => camInputRef.current?.click()}>
              <Icon bi="camera" />用手機相機拍
            </button>
          </div>
        )}
      </div>
      <div className="ck-cam__bar">
        <button type="button" className="ck-pick" onClick={() => libInputRef.current?.click()}><Icon bi="images" />相簿</button>
        <button type="button" className="ck-shutter" onClick={shoot} aria-label="拍照" />
        <span className="ck-cam__spacer" />
      </div>
      <input ref={camInputRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
      <input ref={libInputRef} type="file" accept="image/*" hidden onChange={onFile} />
    </section>,
    document.body
  );
}
