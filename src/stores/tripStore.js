/* =========================================================
   旅程資料（共用狀態），自動同步到 localStorage
   - 讀取：const trip = useTripStore((s) => s.trip)
   - 修改：updateTrip((s) => { s.trip.name = 'xxx'; })  ← Immer，可直接改
   ========================================================= */
import { create } from 'zustand';
import { produce } from 'immer';
import { onValue, ref, set } from 'firebase/database';
import { STORAGE_KEY } from '../data/constants';
import { defaultState, FLIGHTS, HOTEL, PEACH_BAGGAGE_TODO, SAMPLE_SEED, seed4Items, withCovers } from '../data/defaultState';
import { uid } from '../utils/helpers';
import { DEFAULT_CHARACTERS } from '../data/dialogueScript';
import { database, databasePath } from '../services/firebase';
import { toast } from './uiStore';

/* 舊版（seed 1）範例行程的標題，用來判斷使用者是否還沒改過範例 */
const SEED1_TITLES = ['抵達關西機場第一航廈', '南海電鐵售票處兌換 rapi:t 車票', '搭乘南海 rapi:t 前往難波', '難波站步行至飯店入住'];

/** 資料仍是未修改的舊範例時，換成新版範例；使用者改過的資料不動（依 seed 逐版升級） */
function upgradeSample(saved, base) {
  let next = saved;
  if ((next.seed || 1) < 2) next = upgradeToSeed2(next, base);
  if ((next.seed || 1) < 3) next = upgradeToSeed3(next, base);
  if ((next.seed || 1) < 4) next = upgradeToSeed4(next);
  if ((next.seed || 1) < 5) next = upgradeToSeed5(next);
  return next;
}

/** seed 1 → 2：整套換成新版範例行程／班機，補上新的待辦 */
function upgradeToSeed2(saved, base) {
  const next = { ...saved, seed: 2 };
  const items = saved.items || [];
  const untouchedItems = items.length === SEED1_TITLES.length && items.every((it) => SEED1_TITLES.includes(it.title));
  if (untouchedItems) {
    next.items = base.items;
    const untouchedFlights = (saved.flights || []).every((f) => !f.dep && !f.arr && !f.flightNo);
    if (untouchedFlights) next.flights = base.flights;
    const texts = new Set((saved.todos || []).map((t) => t.text));
    next.todos = [...(saved.todos || []), ...base.todos.filter((t) => !texts.has(t.text))];
  }
  return next;
}

/* seed 2 範例的回程是神戶機場；seed 3 改成關西機場。key 是舊標題，只改「還是原本範例內容」的那幾筆 */
const KOBE_ITEMS = {
  '前往神戶機場': { time: '09:15', title: '搭乘南海 rapi:t 前往關西機場', place: 'なんば駅（南海）', note: '約 35 分鐘抵達關西空港駅' },
  '抵達神戶機場辦理報到': { time: '10:00', title: '抵達關西機場第一航廈辦理報到', place: '關西國際機場 第一航廈', note: '起飛前 2 小時到；退稅商品放隨身行李' },
  '星宇航空 UKB → TPE 起飛': { title: '星宇航空 KIX → TPE 起飛', place: '關西國際機場', note: '直飛，抵達時間請以實際機票為準' }
};
const KOBE_NOTES = {
  '回程改從神戶機場出發，買單程票即可': '回程也從關西機場出發，可一併規劃回程車票'
};
const KOBE_TODOS = { '確認神戶機場回程交通': '確認回程前往關西機場的交通' };

/** seed 2 → 3：回程神戶機場改成關西機場 */
function upgradeToSeed3(saved) {
  const items = (saved.items || []).map((it) => {
    if (KOBE_ITEMS[it.title]) return { ...it, ...KOBE_ITEMS[it.title] };
    if (KOBE_NOTES[it.note]) return { ...it, note: KOBE_NOTES[it.note] };
    return it;
  });
  const flights = (saved.flights || []).map((f) => (f.from === 'UKB'
    ? { ...f, from: 'KIX', fromName: f.fromName === '神戶機場' ? '關西 第一航廈' : f.fromName, arr: f.arr === '15:05' ? '' : f.arr }
    : f));
  const todos = (saved.todos || []).map((t) => (KOBE_TODOS[t.text] ? { ...t, text: KOBE_TODOS[t.text] } : t));
  return { ...saved, seed: 3, items, flights, todos };
}

/* seed 3 → 4：換成實際訂到的樂桃航班與飯店。key 是 seed 3 範例的標題，value 是 seed 4 範例的標題 */
const SEED4_TITLES = {
  '抵達桃園機場辦理報到': '抵達桃園機場第一航廈辦理報到',
  '星宇航空 TPE → KIX 起飛': '樂桃 MM024 TPE → KIX 起飛',
  '抵達關西機場第一航廈': '抵達關西機場第二航廈',
  '南海電鐵售票處兌換 rapi:t 車票': '南海電鐵售票處兌換 rapi:t 車票',
  '搭乘南海 rapi:t 前往難波': '搭乘南海 rapi:t 前往難波',
  '難波站步行至飯店入住': '從難波前往飯店',
  '從難波出發前往環球影城': '從飯店出發前往環球影城',
  '搭車返回難波飯店': '搭車返回飯店',
  '飯店退房': '飯店退房',
  '搭乘南海 rapi:t 前往關西機場': '搭乘南海 rapi:t 前往關西機場',
  '抵達關西機場第一航廈辦理報到': '抵達關西機場第二航廈辦理報到',
  '星宇航空 KIX → TPE 起飛': '樂桃 MM027 KIX → TPE 起飛'
};
/* seed 4 新增、seed 3 沒有的項目（D1 有改到範例時才補） */
const SEED4_NEW_TITLES = ['搭免費接駁巴士到關西空港駅', `${HOTEL.name} 入住`];

/** seed 3 → 4：只改還是範例內容的行程；班機只改還沒填航班編號的星宇範例；住宿只填空白的 */
function upgradeToSeed4(saved) {
  const seed4 = seed4Items();
  const byTitle = (title, day) => seed4.find((it) => it.title === title && it.day === day);
  const touchedDays = new Set();

  let items = (saved.items || []).map((it) => {
    const target = SEED4_TITLES[it.title] && byTitle(SEED4_TITLES[it.title], it.day);
    if (!target) return it;
    touchedDays.add(it.day);
    return { ...it, ...target };
  });
  if (touchedDays.has(0)) {
    const have = new Set(items.map((it) => it.title));
    items.push(...SEED4_NEW_TITLES.filter((t) => !have.has(t)).map((t) => ({ id: uid(), ...byTitle(t, 0) })));
  }
  // D1、D5 時間大改，清掉手動序號，改回依時間排序（D2 只改文字，保留順序）
  items = items.map((it) => {
    if (![0, 4].includes(it.day) || !touchedDays.has(it.day) || it.order === undefined) return it;
    const { order: _order, ...rest } = it;
    return rest;
  });

  const flights = (saved.flights || []).map((f) => {
    if (f.airline !== '星宇航空' || f.flightNo) return f;
    const real = f.leg === '去程' ? FLIGHTS.out : f.leg === '回程' ? FLIGHTS.back : null;
    return real ? { ...f, ...real } : f;
  });

  const stays = (saved.stays || []).map((s, i) => (i === 0 && !s.name && !s.address ? { ...s, name: HOTEL.name, address: HOTEL.address } : s));

  const todos = saved.todos || [];
  const nextTodos = todos.some((t) => t.text === PEACH_BAGGAGE_TODO) ? todos : [...todos, { id: uid(), text: PEACH_BAGGAGE_TODO, done: false }];

  return { ...saved, seed: 4, items, flights, stays, todos: nextTodos };
}

/** seed 4 → 5：D1 行程補上封面圖（已經有圖片的不動） */
function upgradeToSeed5(saved) {
  return { ...saved, seed: 5, items: withCovers(saved.items || []) };
}

/** 角色對話：沒有資料就用預設；內建角色一定存在（圖片檔名、builtin 以程式內建為準） */
function normalizeDialogue(saved, base) {
  if (!saved?.script || !saved?.characters) return base;
  const custom = saved.characters.filter((c) => !DEFAULT_CHARACTERS.some((d) => d.id === c.id));
  const builtins = DEFAULT_CHARACTERS.map((d) => {
    const s = saved.characters.find((c) => c.id === d.id);
    return s ? { ...s, img: d.img, builtin: true } : { ...d };
  });
  return { characters: [...builtins, ...custom], script: saved.script };
}

function normalize(saved) {
  const base = defaultState();
  if (!saved) return base;
  saved = upgradeSample(saved, base);
  return {
    ...base, ...saved,
    trip: { ...base.trip, ...saved.trip },
    ui: { ...base.ui, ...saved.ui },
    entry: { ...base.entry, ...saved.entry },
    usj: { ...base.usj, ...saved.usj },
    dialogue: normalizeDialogue(saved.dialogue, base.dialogue)
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalize(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultState();
  }
}

export const useTripStore = create(() => load());

/** 以 Immer recipe 修改資料 */
export function updateTrip(recipe) {
  useTripStore.setState((s) => produce(s, recipe), true);
}

/** 整包取代（匯入備份用） */
export function replaceTrip(data) {
  if (!data || !data.trip || !Array.isArray(data.items)) throw new Error('格式不符');
  useTripStore.setState(normalize(data), true);
}

/** 清除資料，恢復範例 */
export function resetTrip() {
  useTripStore.setState(defaultState(), true);
}

/* ---------- 儲存（資料有變動就寫入） ---------- */
function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    toast('儲存失敗：瀏覽器空間可能不足（圖片太多？）');
  }
}
useTripStore.subscribe(save);
save(useTripStore.getState()); // 載入時若有升級範例資料，立即寫回

/* ---------- Firebase Realtime Database 雲端同步 ---------- */
let cloudReady = false;
let applyingCloudState = false;
let cloudSaveTimer;
let stopCloudListener;

function saveToCloud(state) {
  if (!cloudReady || applyingCloudState) return;

  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(() => {
    set(ref(database, databasePath), state).catch(() => {
      toast('雲端儲存失敗，資料仍已保存在此裝置');
    });
  }, 400);
}

useTripStore.subscribe(saveToCloud);

/**
 * 啟動 Realtime Database 同步。
 * 雲端已有資料時以雲端為準；若節點不存在，會用目前本機資料建立節點。
 */
export function startTripSync() {
  if (stopCloudListener) return stopCloudListener;

  const tripRef = ref(database, databasePath);
  let firstSnapshot = true;

  stopCloudListener = onValue(
    tripRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const cloud = snapshot.val();
        const next = normalize(cloud);
        applyingCloudState = true;
        useTripStore.setState(next, true);
        applyingCloudState = false;
        cloudReady = true;
        // 雲端還是舊版範例：升級後寫回，其他裝置才會拿到同一份（新增項目的 id 也才固定）
        if ((cloud.seed || 1) < SAMPLE_SEED) {
          set(tripRef, next).catch(() => toast('雲端儲存失敗，資料仍已保存在此裝置'));
        }
      } else if (firstSnapshot) {
        cloudReady = true;
        set(tripRef, useTripStore.getState()).catch(() => {
          toast('無法建立雲端旅程，資料仍已保存在此裝置');
        });
      }

      firstSnapshot = false;
    },
    () => {
      toast('Firebase 連線失敗，已改用此裝置的資料');
    }
  );

  return stopCloudListener;
}

/** 登出時停止監聽與寫入，避免未授權狀態存取雲端。 */
export function stopTripSync() {
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = undefined;
  cloudReady = false;
  applyingCloudState = false;
  stopCloudListener?.();
  stopCloudListener = undefined;
}
