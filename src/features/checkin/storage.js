/* =========================================================
   打卡資料的 IndexedDB 存取（照片只存在這台裝置，不上傳 Firebase）
   一個 object store「records」，兩種資料：
   - 明信片：{ id, itemId, style, orient, msg, stamps[], photo: Blob, card: Blob, at }
   - 行程蓋章：{ id: 'stamp:' + itemId, kind: 'stopstamp', itemId, at, rot }
   打不開資料庫（無痕模式等）時所有操作都回傳 null，資料只留在記憶體
   ========================================================= */

const DB_NAME = 'osaka-checkin';
const STORE = 'records';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

/** 執行一次交易，完成後回傳 request 的結果 */
async function tx(mode, fn) {
  const db = await openDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const t = db.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(req?.result ?? null);
      t.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export const stopStampId = (itemId) => `stamp:${itemId}`;

export const getAllRecords = async () => (await tx('readonly', (s) => s.getAll())) || [];
export const putRecord = (rec) => tx('readwrite', (s) => s.put(rec));
export const deleteRecord = (id) => tx('readwrite', (s) => s.delete(id));
