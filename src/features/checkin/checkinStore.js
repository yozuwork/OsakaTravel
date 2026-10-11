import { create } from 'zustand';
import { databasePath } from '../../services/firebase';
import { createCloudSync } from '../../services/cloudSync';
import { readCloudCache, writeCloudCache } from '../../services/cloudCache';
import { getAllRecords } from './storage';

export const useCheckinStore = create(() => ({ ready: false, cards: {}, stamps: {} }));
const toStamp = (itemId, { at, rot }) => ({ at, rot });
export const loadCheckin = () => Promise.resolve();
export const cardsOf = (cards, itemId) => Object.values(cards).filter((r) => r.itemId === itemId).sort((a, b) => a.at - b.at);

export async function saveCard(rec) {
  useCheckinStore.setState((s) => ({ cards: { ...s.cards, [rec.id]: rec } }));
}
export async function removeCard(id) {
  useCheckinStore.setState((s) => {
    const cards = { ...s.cards };
    delete cards[id];
    return { cards };
  });
}
export async function stampStop(itemId) {
  const rec = toStamp(itemId, { at: Date.now(), rot: (Math.random() - 0.5) * 0.5 });
  useCheckinStore.setState((s) => ({ stamps: { ...s.stamps, [itemId]: rec } }));
  return rec;
}
export async function unstampStop(...itemIds) {
  useCheckinStore.setState((s) => {
    const stamps = { ...s.stamps };
    itemIds.forEach((id) => delete stamps[id]);
    return { stamps };
  });
}
let activeUid;
const checkinSync = createCloudSync({
  name: 'checkin', store: useCheckinStore,
  select: ({ cards, stamps }) => ({ cards, stamps }),
  normalize: (data) => ({
    cards: Object.fromEntries(Object.entries(data.cards || {}).map(([id, rec]) => [id, { orient: 'port', msg: '', stamps: [], ...rec }])),
    stamps: Object.fromEntries(Object.entries(data.stamps || {}).map(([id, rec]) => [id, toStamp(id, rec)]))
  }),
  apply: (data) => useCheckinStore.setState(data),
  onReady: (ready) => useCheckinStore.setState({ ready }),
  async migrate() {
    const uid = activeUid;
    const migrated = await readCloudCache('legacy-checkin-owner');
    if (migrated) return null;
    const records = await getAllRecords();
    if (activeUid !== uid) return null;
    const cards = {}, stamps = {};
    for (const record of records) {
      if (record.kind === 'stopstamp') stamps[record.itemId] = toStamp(record.itemId, record);
      else cards[record.id] = { orient: 'port', stamps: [], msg: '', ...record };
    }
    // The old records remain untouched as a recovery copy.
    return { cards, stamps };
  },
  onMigrated: (path) => writeCloudCache('legacy-checkin-owner', { uid: path.split('/').at(-1) })
});
export function startCheckinSync(uid) {
  activeUid = uid;
  return checkinSync.start(databasePath + 'Checkin/' + uid);
}
export function stopCheckinSync() {
  activeUid = null;
  checkinSync.stop();
  useCheckinStore.setState({ cards: {}, stamps: {}, ready: false });
}
