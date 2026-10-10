/* 打卡資料存本機 IndexedDB；開不起來時退回記憶體（重新整理就會不見） */
const DB = "checkin-postcards", STORE = "cards";
let dbp = null;
function open() {
  return dbp || (dbp = new Promise((res) => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id" });
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    } catch { res(null); }
  }));
}
const memory = new Map();
async function run(mode, fn) {
  const db = await open();
  if (!db) return fn(null);
  return new Promise((res) => {
    try {
      const t = db.transaction(STORE, mode), q = fn(t.objectStore(STORE));
      t.oncomplete = () => res(q && q.result);
      t.onerror = () => res(null);
    } catch { res(null); }
  });
}
export async function loadAll() {
  const all = await run("readonly", (s) => (s ? s.getAll() : { result: [...memory.values()] }));
  const cards = [], stopStamps = new Map();
  for (const r of all || []) {
    if (r.kind === "stopstamp") stopStamps.set(r.stopId, r);
    else cards.push({ orient: "port", stamps: [], msg: "", ...r, stopId: r.stopId || r.id });
  }
  return { cards, stopStamps };
}
export async function save(rec) { memory.set(rec.id, rec); await run("readwrite", (s) => s && s.put(rec)); }
export async function remove(id) { memory.delete(id); await run("readwrite", (s) => s && s.delete(id)); }
