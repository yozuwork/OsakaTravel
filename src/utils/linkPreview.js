/* =========================================================
   連結預覽圖：貼上連結時自動抓封面圖
   瀏覽器不能直接讀其他網站的 og:image（CORS），所以透過免費的 microlink 服務查詢
   （不需金鑰；每天有免費額度，網址會送到 microlink）
   ========================================================= */

const PREVIEW_API = 'https://api.microlink.io/?url=';
const TIMEOUT_MS = 8000;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|bmp)(?:[?#].*)?$/i;

/** 剪貼簿文字是不是單一網址 */
export const isUrl = (text) => /^https?:\/\/\S+$/i.test(String(text || '').trim());

/**
 * 取得連結的預覽圖網址；網址本身就是圖片時直接回傳，抓不到回傳空字串
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function fetchLinkImage(url) {
  if (IMAGE_EXT.test(url)) return url;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(PREVIEW_API + encodeURIComponent(url), { signal: ctrl.signal });
    if (!res.ok) return '';
    const { data } = await res.json();
    return data?.image?.url || data?.screenshot?.url || data?.logo?.url || '';
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}
