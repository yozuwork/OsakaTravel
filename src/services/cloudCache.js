// IndexedDB 只用於離線快取與待同步資料，Firebase 才是主要資料來源。
let opening;
function open() {
  if (!opening) opening = new Promise((resolve) => {
    try {
      const request = indexedDB.open('osaka-cloud-cache', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('documents');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
  return opening;
}

async function transaction(mode, action) {
  const db = await open();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('documents', mode);
      const request = action(tx.objectStore('documents'));
      tx.oncomplete = () => resolve(request.result ?? true);
      tx.onerror = tx.onabort = () => resolve(null);
    } catch { resolve(null); }
  });
}

export const readCloudCache = (key) => transaction('readonly', (store) => store.get(key));
export const writeCloudCache = (key, value) => transaction('readwrite', (store) => store.put(value, key));
