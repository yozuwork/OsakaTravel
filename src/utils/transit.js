/* =========================================================
   交通：搜尋正規化、路線圖、Dijkstra 最短路徑
   - 節點：「路線|車站」
   - 邊：ride（行車）、transfer（同站轉乘）、walk（步行轉乘）
   - 每條邊有 min（實際分鐘，顯示用）與 rank（排序用權重，≥ min）
   ========================================================= */
import { LINES, T_TRANSFER, T_WALK, FEW_PENALTY } from '../data/transit/lines';
import { STATION_META, WALK_GROUPS } from '../data/transit/stations';

const nodeId = (line, st) => `${line}|${st}`;
const stationOf = (node) => node.slice(node.indexOf('|') + 1);

/* ---------- 車站 → 路線 ---------- */
export const STATION_LINES = {};
for (const [id, L] of Object.entries(LINES)) {
  for (const s of L.stations) {
    const list = (STATION_LINES[s] ||= []);
    if (!list.includes(id)) list.push(id);
  }
}
export const STATIONS = Object.keys(STATION_LINES);

const WALK_OF = {};
for (const g of WALK_GROUPS) for (const s of g) WALK_OF[s] = g.filter((x) => x !== s);

/** 可轉乘站：多條路線，或屬於步行轉乘群組 */
export const isInterchange = (s) => (STATION_LINES[s]?.length || 0) > 1 || !!WALK_OF[s];

/* ---------- 建圖 ---------- */
const segMin = (L, i) => (L.times ? L.times[i] : L.hop);

function buildGraph() {
  const adj = {};
  const add = (a, b, e) => (adj[a] ||= []).push({ to: b, ...e });

  for (const [id, L] of Object.entries(LINES)) {
    const st = L.stations;
    st.forEach((s) => { adj[nodeId(id, s)] ||= []; });
    const penalty = L.rankPenalty || 0;

    if (L.longHaulAfter) {
      // 特急／機場快速：每組上下車站直接連一條邊，且至少一端要在 longHaulAfter 之後
      // → 大阪→関西空港 是「一班車」；大阪→天王寺 這種市區短程根本不會產生邊
      const limit = st.indexOf(L.longHaulAfter);
      for (let i = 0; i < st.length; i++) {
        for (let j = i + 1; j < st.length; j++) {
          if (j <= limit) continue;
          let min = 0;
          for (let k = i; k < j; k++) min += segMin(L, k);
          const stops = st.slice(i, j + 1);
          add(nodeId(id, st[i]), nodeId(id, st[j]), { type: 'ride', line: id, min, rank: min + penalty, stops });
          add(nodeId(id, st[j]), nodeId(id, st[i]), { type: 'ride', line: id, min, rank: min + penalty, stops: [...stops].reverse() });
        }
      }
      continue;
    }

    const hops = L.cyclic ? st.length : st.length - 1;
    for (let i = 0; i < hops; i++) {
      const a = st[i], b = st[(i + 1) % st.length], min = segMin(L, i);
      add(nodeId(id, a), nodeId(id, b), { type: 'ride', line: id, min, rank: min, stops: [a, b] });
      add(nodeId(id, b), nodeId(id, a), { type: 'ride', line: id, min, rank: min, stops: [b, a] });
    }
  }

  for (const [s, ls] of Object.entries(STATION_LINES)) {
    for (const a of ls) for (const b of ls) {
      if (a !== b) add(nodeId(a, s), nodeId(b, s), { type: 'transfer', min: T_TRANSFER, rank: T_TRANSFER });
    }
  }
  for (const [s, others] of Object.entries(WALK_OF)) {
    for (const t of others) {
      for (const la of STATION_LINES[s] || []) for (const lb of STATION_LINES[t] || []) {
        add(nodeId(la, s), nodeId(lb, t), { type: 'walk', min: T_WALK, rank: T_WALK });
      }
    }
  }
  return adj;
}

const GRAPH = buildGraph();

/* ---------- 最短路徑 ---------- */
/**
 * @param {string} from 出發站
 * @param {string} to   抵達站
 * @param {{ fewTransfers?: boolean }} [opt]
 * @returns {null | { total:number, transfers:number, segs:Array }}
 *   segs：{ kind:'ride', line, stops, min } | { kind:'transfer'|'walk', from, to, min }
 */
export function findRoute(from, to, { fewTransfers = false } = {}) {
  if (!STATION_LINES[from] || !STATION_LINES[to] || from === to) return null;
  const dist = {}, real = {}, prev = {}, done = new Set(), open = new Set();
  for (const l of STATION_LINES[from]) {
    const n = nodeId(l, from);
    dist[n] = 0; real[n] = 0; open.add(n);
  }

  let end = null;
  while (open.size) {
    let u = null;
    for (const n of open) if (u === null || dist[n] < dist[u] || (dist[n] === dist[u] && real[n] < real[u])) u = n;
    open.delete(u); done.add(u);
    if (stationOf(u) === to) { end = u; break; }
    for (const e of GRAPH[u] || []) {
      if (done.has(e.to)) continue;
      const w = e.rank + (e.type !== 'ride' && fewTransfers ? FEW_PENALTY : 0);
      const d = dist[u] + w;
      if (dist[e.to] === undefined || d < dist[e.to]) {
        dist[e.to] = d; real[e.to] = real[u] + e.min; prev[e.to] = { from: u, e }; open.add(e.to);
      }
    }
  }
  if (!end) return null;

  const chain = [];
  for (let c = end; prev[c]; c = prev[c].from) chain.unshift(prev[c]);

  // 同一條線連續的站合併成一個路段
  const segs = [];
  let cur = null;
  for (const { from: f, e } of chain) {
    if (e.type === 'ride') {
      if (cur && cur.line === e.line) {
        cur.stops.push(...e.stops.slice(1));
        cur.min += e.min;
      } else {
        cur = { kind: 'ride', line: e.line, stops: [...e.stops], min: e.min };
        segs.push(cur);
      }
    } else {
      segs.push({ kind: e.type, from: stationOf(f), to: stationOf(e.to), min: e.min });
      cur = null;
    }
  }
  const rides = segs.filter((s) => s.kind === 'ride').length;
  return { total: Math.round(real[end]), transfers: Math.max(0, rides - 1), segs };
}

/** 路段方向：一般線「往 終點 方向」、環狀線「經 下一站 方向（外回り）」 */
export function directionText(seg) {
  const L = LINES[seg.line];
  const [a, b] = seg.stops;
  if (L.cyclic) {
    const n = L.stations.length;
    const forward = (L.stations.indexOf(a) + 1) % n === L.stations.indexOf(b);
    const label = L.cycleLabels ? `（${forward ? L.cycleLabels.forward : L.cycleLabels.backward}）` : '';
    return `經 ${b} 方向${label}`;
  }
  const up = L.stations.indexOf(b) > L.stations.indexOf(a);
  return `往 ${up ? L.stations.at(-1) : L.stations[0]} 方向`;
}

/* ---------- 搜尋 ---------- */
// 繁體／簡體 → 日文新字體；最後統一轉成平假名、小寫、去空白
const CHAR_MAP = {
  齋: '斎', 斋: '斎', 關: '関', 关: '関', 櫻: '桜', 樱: '桜', 條: '条', 國: '国', 綠: '緑', 绿: '緑',
  濱: '浜', 滨: '浜', 邊: '辺', 边: '辺', 豐: '豊', 丰: '豊', 內: '内', 戶: '戸', 户: '戸', 惠: '恵',
  區: '区', 滿: '満', 满: '満', 螢: '蛍', 萤: '蛍', 辨: '弁', 廣: '広', 广: '広', 岛: '島',
  桥: '橋', 园: '園', 东: '東', 长: '長', 难: '難', 宫: '宮', 场: '場', 阳: '陽', 蘆: '芦',
  门: '門', 铁: '鉄', 鐵: '鉄', 线: '線', 车: '車', 驛: '駅', 驿: '駅',
  觀: '観', 观: '観', 馆: '館', 黑: '黒', 鹤: '鶴', 见: '見'
};
const WORD_MAP = [['機場', '空港'], ['机场', '空港'], ['車站', ''], ['车站', ''], ['站', ''], ['駅', ''], ['station', '']];

export function normalize(s) {
  let t = String(s || '').normalize('NFKC').toLowerCase().replace(/[\s\-・·.]/g, '');
  for (const [a, b] of WORD_MAP) t = t.split(a).join(b);
  t = [...t].map((c) => CHAR_MAP[c] || c).join('');
  // カタカナ → ひらがな（「ナンバ」也能找到「なんば」）
  return t.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

const SEARCH_INDEX = STATIONS.map((s) => {
  const m = STATION_META[s] || {};
  const names = [s, m.zh, m.en, ...(m.spots || [])].filter(Boolean).map(normalize);
  return { id: s, names };
});

/** 依關鍵字搜尋車站：完全符合 > 開頭符合 > 包含；同分時轉乘路線多的在前 */
export function searchStations(q) {
  const nq = normalize(q);
  const score = (names) => {
    if (!nq) return 1;
    if (names.some((n) => n === nq)) return 3;
    if (names.some((n) => n.startsWith(nq))) return 2;
    if (names.some((n) => n.includes(nq))) return 1;
    return 0;
  };
  return SEARCH_INDEX
    .map((x) => ({ id: x.id, score: score(x.names) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || STATION_LINES[b.id].length - STATION_LINES[a.id].length)
    .map((x) => x.id);
}

/** 車站的中文副標（例：なんば → 難波） */
export const stationZh = (s) => {
  const zh = STATION_META[s]?.zh;
  return zh && zh !== s ? zh : '';
};
