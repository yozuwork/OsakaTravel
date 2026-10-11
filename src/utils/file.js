/**
 * 圖片壓縮（存進 Firebase 前先縮小，預設 WebP 保留透明背景）
 * @param {string} [type] 輸出格式；去背立繪用 'image/webp' 或 'image/png' 才能保留透明
 */
export function compressImage(file, max = 1920, quality = 0.9, type = 'image/webp') {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('不是圖片檔'));
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * s));
        c.height = Math.max(1, Math.round(img.height * s));
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, c.width, c.height);
        let output = c.toDataURL(type, quality);
        // 不為了追求檔案大小犧牲文字與細節：品質最低維持 0.84。
        for (let q = quality - 0.03; type !== 'image/png' && output.length > 800000 && q >= 0.84; q -= 0.03) {
          output = c.toDataURL(type, q);
        }
        resolve(output);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function blobDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataURLBlob(url) {
  const [header, data] = url.split(',');
  const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: header.slice(5, header.indexOf(';')) });
}

const imageCache = new Map();
const blobCache = new WeakMap();
async function shrinkLegacyImage(url) {
  if (url.length < 450000 || !url.startsWith('data:image/')) return url;
  if (imageCache.has(url)) return imageCache.get(url);
  const job = new Promise((resolve, reject) => {
    const image = new Image();
    image.onerror = reject;
    image.onload = async () => {
      try {
        // 已經適合螢幕顯示的圖片不反覆壓縮。
        resolve(Math.max(image.width, image.height) <= 1920 ? url : await compressImage(dataURLBlob(url)));
      } catch (error) { reject(error); }
    };
    image.src = url;
  });
  imageCache.set(url, job);
  if (imageCache.size > 24) imageCache.delete(imageCache.keys().next().value);
  return job;
}

/** Firebase 不接受 Blob；用有標記的資料網址保存，載入時還原供明信片編輯／匯出。 */
export async function encodeCloudImages(value, key = '') {
  if (value instanceof Blob) {
    if (!blobCache.has(value)) blobCache.set(value,
      key === 'qr' || key === 'ticket' ? blobDataURL(value)
        : value.type === 'image/webp' ? blobDataURL(value).then(shrinkLegacyImage)
          : compressImage(value));
    return { __imageBlob: await blobCache.get(value) };
  }
  if (typeof value === 'string') return key === 'qr' || key === 'ticket' ? value : shrinkLegacyImage(value);
  if (Array.isArray(value)) {
    const result = [];
    for (const entry of value) result.push(await encodeCloudImages(entry, key));
    return result;
  }
  if (value && typeof value === 'object') {
    const result = {};
    for (const [name, entry] of Object.entries(value)) {
      if (entry !== undefined) result[name] = await encodeCloudImages(entry, name);
    }
    return result;
  }
  return value;
}

export async function decodeCloudImages(value) {
  if (value?.__imageBlob) return dataURLBlob(value.__imageBlob);
  if (Array.isArray(value)) return Promise.all(value.map(decodeCloudImages));
  if (value && typeof value === 'object') {
    return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key, entry]) => [key, await decodeCloudImages(entry)])));
  }
  return value;
}

export function readText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
