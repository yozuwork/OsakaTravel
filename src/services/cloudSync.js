import { create } from 'zustand';
import { onValue, ref, update } from 'firebase/database';
import { database } from './firebase';
import { readCloudCache, writeCloudCache } from './cloudCache';
import { encodeCloudImages, decodeCloudImages } from '../utils/file';

export const useCloudStatus = create(() => ({ documents: {}, readyDocuments: {} }));

/** 雲端文件同步：先讀雲端、局部更新、保留未確認的操作、重試失敗的寫入。 */
export function createCloudSync({ name, store, select = (s) => s, normalize = (s) => s, apply, migrate, onMigrated = () => {}, onReady = () => {} }) {
  let session;
  function status(value) {
    useCloudStatus.setState((s) => ({ documents: { ...s.documents, [name]: value } }));
  }
  function ready(value) {
    useCloudStatus.setState((s) => ({ readyDocuments: { ...s.readyDocuments, [name]: value } }));
    onReady(value);
  }
  function cache(s) {
    return writeCloudCache(s.path, { data: select(store.getState()), pending: s.pending });
  }
  function applyState(s, data) {
    s.applying = true;
    try { apply(data); } finally { s.applying = false; }
  }
  function schedule(s, delay = 350) {
    clearTimeout(s.timer);
    s.timer = setTimeout(() => flush(s), delay);
  }
  async function flush(s) {
    if (session !== s || !s.ready || s.writing || !Object.keys(s.pending).length) return;
    s.writing = true;
    const patch = { ...s.pending };
    status('saving');
    try {
      // 待同步紀錄先落地，頁面關閉後仍能重送。
      await cache(s);
      const encoded = await encodeCloudImages(patch);
      if (session !== s) return;
      await update(ref(database, s.path), encoded);
      if (session !== s) return;
      for (const key of Object.keys(patch)) {
        if (s.pending[key] === patch[key]) delete s.pending[key];
      }
      await cache(s);
      status(Object.keys(s.pending).length ? 'saving' : 'synced');
    } catch {
      if (session === s) { status('error'); schedule(s, 5000); }
    } finally {
      s.writing = false;
      if (session === s && Object.keys(s.pending).length && useCloudStatus.getState().documents[name] !== 'error') schedule(s);
    }
  }
  store.subscribe((state, previous) => {
    const s = session;
    if (!s || s.applying) return;
    const next = select(state), before = select(previous);
    for (const key of new Set([...Object.keys(next), ...Object.keys(before)])) {
      if (next[key] !== before[key]) s.pending[key] = next[key] ?? null;
    }
    if (!Object.keys(s.pending).length) return;
    status('saving');
    cache(s);
    schedule(s);
  });
  return {
    async start(path) {
      if (session?.path === path) return;
      this.stop();
      const s = { path, pending: {}, applying: false, ready: false, writing: false, snapshot: 0 };
      session = s;
      status('loading');
      const saved = await readCloudCache(path);
      if (session !== s) return;
      s.pending = { ...(saved?.pending || {}), ...s.pending };
      if (saved?.data) applyState(s, normalize({ ...saved.data, ...s.pending }));
      const legacy = migrate ? await migrate(path) : null;
      let legacyProcessed = false;
      let legacyFinished = false;
      if (session !== s) return;
      const listen = () => {
        if (session !== s) return;
        s.stop = onValue(ref(database, path), async (snapshot) => {
          const version = ++s.snapshot;
          try {
            const cloud = snapshot.exists() ? await decodeCloudImages(snapshot.val()) : null;
            if (session !== s || version !== s.snapshot) return;
            const raw = cloud || saved?.data || select(store.getState());
            const normalized = normalize(raw);
            const prepared = !s.ready ? await encodeCloudImages(normalized) : null;
            if (session !== s || version !== s.snapshot) return;
            const existingPending = new Set(Object.keys(s.pending));
            // 資料升級與舊版僅存本機的紀錄也要寫回 Firebase。
            if (!s.ready && (!cloud || JSON.stringify(snapshot.val()) !== JSON.stringify(prepared))) {
              for (const key of Object.keys(normalized)) {
                if (!cloud || JSON.stringify(snapshot.val()[key]) !== JSON.stringify(prepared[key])) {
                  if (!(key in s.pending)) s.pending[key] = normalized[key];
                }
              }
            }
            if (legacy && !legacyProcessed) {
              for (const [key, value] of Object.entries(legacy)) {
                if (Array.isArray(value) && value.every((entry) => entry?.id)) {
                  const current = s.pending[key] || normalized[key] || [];
                  const merged = current.map((entry) => ({ ...entry }));
                  for (const entry of value) {
                    const found = merged.find((item) => item.id === entry.id);
                    if (!found) merged.push(entry);
                    else for (const imageKey of ['image', 'images', 'photo', 'qr', 'ticket']) {
                      if ((!found[imageKey] || (Array.isArray(found[imageKey]) && !found[imageKey].length)) && entry[imageKey]) found[imageKey] = entry[imageKey];
                    }
                  }
                  if (JSON.stringify(merged) !== JSON.stringify(current)) s.pending[key] = merged;
                } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                  const merged = { ...value, ...(normalized[key] || {}), ...(s.pending[key] || {}) };
                  if (Object.keys(value).some((id) => !(id in (normalized[key] || {})))) s.pending[key] = merged;
                } else if (!(key in (cloud || {})) && !existingPending.has(key)) s.pending[key] = value;
              }
              legacyProcessed = true;
            }
            applyState(s, normalize({ ...normalized, ...s.pending }));
            s.ready = true;
            ready(true);
            cache(s).then((result) => {
              if (result && legacyProcessed && !legacyFinished && session === s) {
                legacyFinished = true;
                onMigrated(path);
              }
            });
            status(Object.keys(s.pending).length ? 'saving' : 'synced');
            schedule(s, 0);
          } catch { if (session === s) status('error'); }
        }, () => {
          if (session !== s) return;
          status('error');
          s.retry = setTimeout(listen, 5000);
        });
      };
      listen();
    },
    stop() {
      if (session) { clearTimeout(session.timer); clearTimeout(session.retry); session.stop?.(); }
      session = undefined;
      ready(false);
      status('idle');
    }
  };
}
