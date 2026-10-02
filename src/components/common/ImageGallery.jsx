import { useCallback, useEffect, useRef, useState } from 'react';
import { modal } from '../../stores/modalStore';
import { toast } from '../../stores/uiStore';
import { useModalContext } from '../modal/ModalContext';
import { choose } from '../modal/choose';
import { compressImage } from '../../utils/file';
import { cx } from '../../utils/helpers';
import Button from './Button';
import Icon from './Icon';

/**
 * 已經有封面時，詢問新圖片要覆蓋封面還是加入參考圖片
 * @returns {Promise<'cover' | 'ref' | null>} 沒有封面時直接回傳 'cover'
 */
export async function askImageMode(hasCover, incoming) {
  if (!incoming.length) return null;
  if (!hasCover) return 'cover';
  return choose({
    title: '已經有封面圖',
    message: incoming.length > 1 ? `要怎麼放這 ${incoming.length} 張圖片？` : '要怎麼放這張圖片？',
    detail: <img className="choose__preview" src={incoming[0]} alt="" />,
    options: [
      { value: 'cover', label: '覆蓋原本的封面', icon: 'image', variant: 'primary' },
      { value: 'ref', label: '放入下方參考圖片', icon: 'images' }
    ]
  });
}

/** 依選擇合併圖片：cover → 取代第一張（其餘新圖接在最後）；ref → 全部接在最後 */
export function mergeImages(current, incoming, mode) {
  if (mode === 'cover') return [incoming[0], ...current.slice(1), ...incoming.slice(1)];
  if (mode === 'ref') return [...current, ...incoming];
  return current;
}

/**
 * 多張圖片：第一張是封面，其餘是參考圖片
 * 可上傳（多選）、按「貼上」讀剪貼簿、Ctrl/Cmd+V 貼上（同 YozuManga 作法）、拖曳；點圖片可放大、設為封面或刪除
 * @param {string[]} value 圖片（data URL 或網址）
 * @param {(update: (images: string[]) => string[]) => void} onChange 以「更新函式」回傳，避免非同步時蓋掉較新的值
 * @param {React.ReactNode} [placeholder] 沒有封面時顯示（例如類別圖示）
 */
export default function ImageGallery({ value, onChange, placeholder, max = 600, quality = 0.75 }) {
  const images = value || [];
  const inputRef = useRef(null);
  const countRef = useRef(images.length);
  countRef.current = images.length;
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const addFiles = useCallback(async (files) => {
    const list = files.filter((f) => f?.type?.startsWith('image/'));
    if (!list.length) { toast('這不是圖片檔'); return; }
    setBusy(true);
    let incoming;
    try {
      incoming = await Promise.all(list.map((f) => compressImage(f, max, quality)));
    } catch {
      toast('圖片讀取失敗');
      return;
    } finally {
      setBusy(false);
    }
    const mode = await askImageMode(countRef.current > 0, incoming);
    if (!mode) return;
    onChange((cur) => mergeImages(cur, incoming, mode));
    toast(mode === 'cover' ? '已設為封面' : `已加入 ${incoming.length} 張參考圖片`);
  }, [onChange, max, quality]);

  // 鍵盤貼上：焦點在輸入框時不攔截，避免影響一般文字貼上
  useEffect(() => {
    function onPaste(e) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) || e.target?.isContentEditable) return;
      const files = [...(e.clipboardData?.items || [])].filter((x) => x.type?.startsWith('image/')).map((x) => x.getAsFile()).filter(Boolean);
      if (!files.length) return;
      e.preventDefault();
      addFiles(files);
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles]);

  async function pasteFromClipboard() {
    if (!navigator.clipboard?.read) { toast('此瀏覽器不支援讀取剪貼簿，請按 Ctrl/Cmd+V 或改用上傳'); return; }
    try {
      const files = [];
      for (const entry of await navigator.clipboard.read()) {
        const type = entry.types.find((t) => t.startsWith('image/'));
        if (type) files.push(new File([await entry.getType(type)], 'pasted', { type }));
      }
      if (files.length) addFiles(files); else toast('剪貼簿裡沒有圖片');
    } catch {
      toast('無法讀取剪貼簿，請允許權限或改用上傳');
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setOver(false);
    addFiles([...(e.dataTransfer?.files || [])]);
  }

  function view(i) {
    modal.open({
      title: i === 0 ? '封面圖' : `參考圖片 ${i}`,
      content: (
        <ImageView src={images[i]} isCover={i === 0}
          onCover={() => onChange((cur) => [cur[i], ...cur.filter((_, j) => j !== i)])}
          onDelete={() => onChange((cur) => cur.filter((_, j) => j !== i))} />
      )
    });
  }

  return (
    <div className="gallery">
      <div className={cx('gallery__grid', over && 'is-over')}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop}>
        {images.length === 0 && (
          <div className="gallery__tile gallery__tile--cover is-empty">{placeholder}<span className="gallery__badge">封面</span></div>
        )}
        {images.map((src, i) => (
          <button type="button" key={i + src.slice(-24)} className={cx('gallery__tile', i === 0 && 'gallery__tile--cover')}
            onClick={() => view(i)} aria-label={i === 0 ? '查看封面圖' : `查看參考圖片 ${i}`}>
            <img src={src} alt="" referrerPolicy="no-referrer" />
            {i === 0 && <span className="gallery__badge">封面</span>}
          </button>
        ))}
        <button type="button" className="gallery__tile gallery__add" onClick={() => inputRef.current?.click()} disabled={busy} aria-label="上傳圖片">
          {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="plus" />}
        </button>
      </div>
      <div className="gallery__bar">
        <button type="button" className="btn btn--sm" onClick={() => inputRef.current?.click()} disabled={busy}><Icon bi="upload" />上傳</button>
        <button type="button" className="btn btn--sm" onClick={pasteFromClipboard} disabled={busy}><Icon bi="clipboard-plus" />貼上</button>
        <span className="field__hint">第一張是封面；也可以 Ctrl/Cmd+V 貼上或拖曳圖片</span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden
        onChange={(e) => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) addFiles(fs); }} />
    </div>
  );
}

function ImageView({ src, isCover, onCover, onDelete }) {
  const { close } = useModalContext();
  return (
    <>
      <img className="gallery__full" src={src} alt="" referrerPolicy="no-referrer" />
      <div className="btn-row">
        {isCover
          ? <Button disabled><Icon bi="star-fill" />目前的封面</Button>
          : <Button variant="primary" onClick={() => { onCover(); close(); toast('已設為封面'); }}><Icon bi="star" />設為封面</Button>}
        <Button variant="danger" onClick={() => { onDelete(); close(); toast('已刪除圖片'); }}><Icon name="trash" />刪除</Button>
      </div>
    </>
  );
}
