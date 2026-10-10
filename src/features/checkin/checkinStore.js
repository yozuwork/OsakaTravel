/* =========================================================
   打卡狀態（明信片、行程蓋章）
   - 明信片：只存這台裝置的 IndexedDB（storage.js），照片不上傳
   - 行程蓋章：存 Firebase（每個帳號一份：osakaTravelCheckin/{uid}/stamps/{itemId}），
     IndexedDB 當離線快取；登入後以雲端為準
   - 讀取：useCheckinStore((s) => s.cards)、cardsOf(cards, itemId)
   - 修改：saveCard / removeCard / stampStop / unstampStop
   ========================================================= */
import { create } from 'zustand';
import { onValue, ref, remove, set, update } from 'firebase/database';
import { database, databasePath } from '../../services/firebase';
import { toast } from '../../stores/uiStore';
import { deleteRecord, getAllRecords, putRecord, stopStampId } from './storage';

export const useCheckinStore = create(() => ({
  ready: false,
  cards: {},   // 明信片：id → 紀錄
  stamps: {}   // 行程蓋章：itemId → 紀錄
}));

const toStamp = (itemId, { at, rot }) => ({ id: stopStampId(itemId), kind: 'stopstamp', itemId, at, rot });

let loading = null;
let cloudLoaded = false; // 雲端資料到了之後，IndexedDB 的蓋章就不再覆蓋

/** 從 IndexedDB 載入（只載一次） */
export function loadCheckin() {
  if (loading) return loading;
  loading = getAllRecords().then((all) => {
    const cards = {}, stamps = {};
    for (const r of all) {
      if (r.kind === 'stopstamp') stamps[r.itemId] = r;
      else cards[r.id] = { orient: 'port', stamps: [], msg: '', ...r };
    }
    useCheckinStore.setState(cloudLoaded ? { ready: true, cards } : { ready: true, cards, stamps });
  });
  return loading;
}

/** 某站的明信片（依拍攝時間排序） */
export const cardsOf = (cards, itemId) =>
  Object.values(cards).filter((r) => r.itemId === itemId).sort((a, b) => a.at - b.at);

export async function saveCard(rec) {
  useCheckinStore.setState((s) => ({ cards: { ...s.cards, [rec.id]: rec } }));
  await putRecord(rec);
}

export async function removeCard(id) {
  useCheckinStore.setState((s) => {
    const cards = { ...s.cards };
    delete cards[id];
    return { cards };
  });
  await deleteRecord(id);
}

/* ---------- 行程蓋章（Firebase 同步） ---------- */
let stampsRef = null;   // 登入後才有
let stopCloudListener;

const cloudFail = () => toast('打卡章雲端儲存失敗，已先保存在此裝置');

/** 行程蓋章：記下蓋章當下的時間，角度隨機一點 */
export async function stampStop(itemId) {
  const rec = toStamp(itemId, { at: Date.now(), rot: (Math.random() - 0.5) * 0.5 });
  useCheckinStore.setState((s) => ({ stamps: { ...s.stamps, [itemId]: rec } }));
  if (stampsRef) set(ref(database, `${stampsRef}/${itemId}`), { at: rec.at, rot: rec.rot }).catch(cloudFail);
  await putRecord(rec);
  return rec;
}

/** 取消行程蓋章（可一次多站） */
export async function unstampStop(...itemIds) {
  useCheckinStore.setState((s) => {
    const stamps = { ...s.stamps };
    itemIds.forEach((id) => delete stamps[id]);
    return { stamps };
  });
  if (stampsRef) {
    const job = itemIds.length === 1
      ? remove(ref(database, `${stampsRef}/${itemIds[0]}`))
      : update(ref(database, stampsRef), Object.fromEntries(itemIds.map((id) => [id, null])));
    job.catch(cloudFail);
  }
  await Promise.all(itemIds.map((id) => deleteRecord(stopStampId(id))));
}

/** 雲端資料寫進 IndexedDB 快取：雲端沒有的刪掉、有的覆蓋 */
function mirrorToCache(prev, next) {
  Object.keys(prev).filter((id) => !next[id]).forEach((id) => deleteRecord(stopStampId(id)));
  Object.values(next).forEach((r) => putRecord(r));
}

/** 登入後開始同步：雲端有資料以雲端為準；雲端還沒有就把這台裝置的蓋章傳上去 */
export function startCheckinSync(uid) {
  if (stopCloudListener) return;
  const path = `${databasePath}Checkin/${uid}/stamps`;
  let firstSnapshot = true;

  stopCloudListener = onValue(
    ref(database, path),
    async (snapshot) => {
      stampsRef = path;
      if (snapshot.exists()) {
        const stamps = Object.fromEntries(Object.entries(snapshot.val()).map(([id, v]) => [id, toStamp(id, v)]));
        mirrorToCache(useCheckinStore.getState().stamps, stamps);
        cloudLoaded = true;
        useCheckinStore.setState({ stamps });
      } else if (firstSnapshot) {
        // 第一次用雲端：把之前只存在這台裝置的蓋章傳上去
        await loadCheckin();
        cloudLoaded = true;
        const local = useCheckinStore.getState().stamps;
        if (Object.keys(local).length) {
          set(ref(database, path), Object.fromEntries(Object.values(local).map((r) => [r.itemId, { at: r.at, rot: r.rot }]))).catch(cloudFail);
        }
      } else {
        // 其他裝置把章全部清掉了
        mirrorToCache(useCheckinStore.getState().stamps, {});
        useCheckinStore.setState({ stamps: {} });
      }
      firstSnapshot = false;
    },
    () => { toast('打卡章無法從雲端讀取，已改用此裝置的資料'); }
  );
}

/** 登出時停止同步 */
export function stopCheckinSync() {
  stopCloudListener?.();
  stopCloudListener = undefined;
  stampsRef = null;
}
