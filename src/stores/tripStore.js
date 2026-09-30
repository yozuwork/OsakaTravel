/* =========================================================
   旅程資料（共用狀態），自動同步到 localStorage
   - 讀取：const trip = useTripStore((s) => s.trip)
   - 修改：updateTrip((s) => { s.trip.name = 'xxx'; })  ← Immer，可直接改
   ========================================================= */
import { create } from 'zustand';
import { produce } from 'immer';
import { onValue, ref, set } from 'firebase/database';
import { STORAGE_KEY } from '../data/constants';
import { defaultState, SAMPLE_SEED } from '../data/defaultState';
import { database, databasePath } from '../services/firebase';
import { toast } from './uiStore';

/* 舊版（seed 1）範例行程的標題，用來判斷使用者是否還沒改過範例 */
const SEED1_TITLES = ['抵達關西機場第一航廈', '南海電鐵售票處兌換 rapi:t 車票', '搭乘南海 rapi:t 前往難波', '難波站步行至飯店入住'];

/** 資料仍是未修改的舊範例時，換成新版範例的行程／班機／待辦；使用者改過的資料不動 */
function upgradeSample(saved, base) {
  if ((saved.seed || 1) >= SAMPLE_SEED) return saved;
  const next = { ...saved, seed: SAMPLE_SEED };
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

function normalize(saved) {
  const base = defaultState();
  if (!saved) return base;
  saved = upgradeSample(saved, base);
  return {
    ...base, ...saved,
    trip: { ...base.trip, ...saved.trip },
    ui: { ...base.ui, ...saved.ui },
    entry: { ...base.entry, ...saved.entry }
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
        applyingCloudState = true;
        useTripStore.setState(normalize(snapshot.val()), true);
        applyingCloudState = false;
        cloudReady = true;
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
