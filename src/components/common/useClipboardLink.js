import { useEffect } from 'react';
import { modal } from '../../stores/modalStore';
import { toast } from '../../stores/uiStore';
import { fetchLinkImage, isUrl } from '../../utils/linkPreview';
import { askImageMode, mergeImages } from './ImageGallery';

// 本次使用中已詢問過的剪貼簿連結（不論貼不貼，同一個連結不再重複詢問）
let lastOfferedLink = '';

/** 讀剪貼簿文字；必須在點擊當下呼叫（瀏覽器要求使用者操作才能讀），讀不到回傳空字串 */
export const readClipboard = () =>
  (navigator.clipboard?.readText ? navigator.clipboard.readText().catch(() => '') : Promise.resolve(''));

/**
 * 編輯畫面開啟時，剪貼簿有連結就詢問是否貼上；貼上後自動抓連結的預覽圖
 * - 連結：第一個欄位是空的就填進去，已有連結就加在下一個
 * - 預覽圖：沒有封面就當封面；已有封面就詢問覆蓋或放入參考圖片
 * @param {object} o
 * @param {Promise<string>} [o.clipboard] readClipboard() 的結果
 * @param {React.MutableRefObject<{ links: string[], images: string[] }>} o.draftRef 最新的草稿
 * @param {(update: (links: string[]) => string[]) => void} o.setLinks
 * @param {(update: (images: string[]) => string[]) => void} o.setImages
 */
export function useClipboardLink({ clipboard, draftRef, setLinks, setImages }) {
  useEffect(() => {
    let cancelled = false;
    clipboard?.then(async (raw) => {
      const url = String(raw || '').trim();
      if (cancelled || !isUrl(url) || url === lastOfferedLink) return;
      if (draftRef.current.links.some((l) => l.trim() === url)) return;
      lastOfferedLink = url;
      const ok = await modal.confirm({
        title: '貼上剪貼簿的連結？', message: url, confirmText: '貼上連結', cancelText: '不用', danger: false
      });
      if (!ok || cancelled) return;
      setLinks((links) => [...links.filter((l) => l.trim()), url]);
      toast('已貼上連結，正在抓取封面圖…');
      const img = await fetchLinkImage(url);
      if (cancelled) return;
      if (!img) { toast('這個連結沒有可用的封面圖'); return; }
      const mode = await askImageMode(draftRef.current.images.length > 0, [img]);
      if (!mode || cancelled) return;
      setImages((cur) => mergeImages(cur, [img], mode));
      toast(mode === 'cover' ? '已用連結圖片當封面' : '已加入參考圖片');
    });
    return () => { cancelled = true; };
  }, [clipboard, draftRef, setLinks, setImages]);
}

/** 舊資料只有單張圖片欄位（image／photo）；新資料用 images，第一張是封面 */
export const toImages = (images, single) => (images?.length ? images : single ? [single] : []);
/** 舊資料只有單一連結欄位；新資料用 links，至少顯示一個輸入框 */
export const toLinks = (links, single) => (links?.length ? links : single ? [single] : ['']);
