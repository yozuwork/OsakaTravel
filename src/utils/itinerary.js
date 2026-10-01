/* 行程排序：有手動序號（order）的依序號，沒有的依時間 */
const byTime = (a, b) => (a.time || '99').localeCompare(b.time || '99');
const byOrder = (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || byTime(a, b);

/** 取得某天的行程（已排序） */
export function dayItems(items, day) {
  return items.filter((it) => it.day === day).sort(byOrder);
}

/** 依時間推算行程在當天應排的位置（0 起算） */
export function timeIndex(items, day, time, excludeId) {
  const list = dayItems(items, day).filter((it) => it.id !== excludeId);
  const i = list.findIndex((it) => byTime({ time }, it) < 0);
  return i === -1 ? list.length : i;
}

/** 把行程放到當天第 index 個位置，並重新編號當天所有行程（需在 updateTrip 內呼叫） */
export function placeItem(state, id, index) {
  const target = state.items.find((it) => it.id === id);
  if (!target) return;
  const list = dayItems(state.items, target.day).filter((it) => it.id !== id);
  list.splice(Math.max(0, Math.min(index, list.length)), 0, target);
  list.forEach((it, i) => { it.order = i; });
}
