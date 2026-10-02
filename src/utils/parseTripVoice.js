/* =========================================================
   語音行程解析（第一版：純 Regex，不用 AI）
   parseTripVoice('12月23日下午三點去梅田藍天大廈，預計待兩個小時', { year: 2026 })
   → { date: '2026-12-23', time: '15:00', title: '梅田藍天大廈', location: '梅田藍天大廈', durationMinutes: 120, note: '' }
   資訊不足的欄位回傳 null，不猜測
   ========================================================= */

const CN = { 零: 0, 〇: 0, 一: 1, 二: 2, 兩: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
// 阿拉伯數字或中文數字（最多到「九十九」）
const NUM = '[0-9０-９]+|[零〇一二兩两三四五六七八九十]+';

/** "23"、"二十三"、"十二"、"兩" → 數字；無法辨識回傳 NaN */
export function toNum(s) {
  if (s == null) return NaN;
  const t = String(s).replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  if (!/^[零〇一二兩两三四五六七八九十]+$/.test(t)) return NaN;
  const i = t.indexOf('十');
  if (i === -1) return t.split('').reduce((n, c) => n * 10 + CN[c], 0);
  const tens = i === 0 ? 1 : CN[t[i - 1]];
  const ones = i === t.length - 1 ? 0 : CN[t[i + 1]];
  return tens * 10 + ones;
}

const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const validDate = (y, m, d) => {
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

/* ---------- 日期 ---------- */
const RELATIVE = { 今天: 0, 今日: 0, 明天: 1, 明日: 1, 後天: 2, 后天: 2, 大後天: 3, 大后天: 3 };
const RE_REL = /大後天|大后天|今天|今日|明天|明日|後天|后天/;
const RE_MD = new RegExp(`(${NUM})\\s*月\\s*(${NUM})\\s*[日號号]?`);
const RE_SLASH = /(\d{1,2})\s*[/／]\s*(\d{1,2})(?!\s*[:：點点])/;

function parseDatePart(s, { today, year }) {
  let m = s.match(RE_REL);
  if (m) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + RELATIVE[m[0]]);
    return { value: iso(d.getFullYear(), d.getMonth() + 1, d.getDate()), match: m[0] };
  }
  m = s.match(RE_MD) || s.match(RE_SLASH);
  if (m) {
    const mo = toNum(m[1]), d = toNum(m[2]);
    const y = typeof year === 'function' ? year(mo, d) : year ?? today.getFullYear();
    if (validDate(y, mo, d)) return { value: iso(y, mo, d), match: m[0] };
  }
  return null;
}

/* ---------- 時間 ---------- */
const PERIODS = '凌晨|清晨|早上|早晨|上午|中午|下午|傍晚|晚上|夜晚|半夜';
const RE_TIME = new RegExp(
  `(${PERIODS})?\\s*(${NUM})\\s*(?:[點点時]\\s*(?:(半)|(一刻)|(三刻)|(${NUM})\\s*分?|整)?|[:：]\\s*(\\d{1,2}))`
);

function parseTimePart(s) {
  const m = s.match(RE_TIME);
  if (!m) return null;
  const [all, per, hs, half, q1, q3, minCn, minColon] = m;
  let h = toNum(hs);
  let min = half ? 30 : q1 ? 15 : q3 ? 45 : minCn ? toNum(minCn) : minColon ? toNum(minColon) : 0;
  if (Number.isNaN(h) || Number.isNaN(min) || h > 24 || min > 59) return null;
  if (/下午|傍晚|晚上|夜晚/.test(per || '') && h < 12) h += 12;
  else if (per === '中午' && h < 11) h += 12;          // 中午一點 → 13:00
  else if (/凌晨|清晨|半夜/.test(per || '') && h === 12) h = 0;
  else if (/早上|早晨|上午/.test(per || '') && h === 12) h = 12;
  if (h === 24) h = 0;
  return { value: `${pad(h)}:${pad(min)}`, match: all };
}

/* ---------- 停留時間 ---------- */
const RE_HOURS = new RegExp(`(${NUM}|半)\\s*(?:個|个)?\\s*(半)?\\s*(?:小時|小时|鐘頭|钟头)(半)?`);
const RE_MINS = new RegExp(`(${NUM})\\s*分鐘|(${NUM})\\s*分钟`);

function parseDurationPart(s) {
  let minutes = 0;
  const parts = [];
  const h = s.match(RE_HOURS);
  if (h) {
    const n = h[1] === '半' ? 0.5 : toNum(h[1]);
    if (!Number.isNaN(n)) { minutes += n * 60 + (h[2] || h[3] ? 30 : 0); parts.push(h[0]); }
  }
  const rest = h ? s.replace(h[0], '') : s;
  const mm = rest.match(RE_MINS);
  if (mm) {
    const n = toNum(mm[1] || mm[2]);
    if (!Number.isNaN(n)) { minutes += n; parts.push(mm[0]); }
  }
  return minutes > 0 ? { value: Math.round(minutes), parts } : null;
}

/* ---------- 地點／行程名稱 ---------- */
// 地點後面接的動作：「去道頓堀吃飯」→ 地點「道頓堀」，行程「道頓堀吃飯」
const RE_ACTION = /^(.+?)(吃|喝|買|逛|玩|看|拍|參觀|散步|泡湯|泡|搭|坐|集合|入住|退房|購物|拜拜|參拜)(.*)$/;
const RE_GO = /(?:前往|出發去|出發到|去|到)\s*([^，,。！!？?、\s]+)/;
// 說話時的贅字（只在句首或句尾移除）
const FILLER_HEAD = /^(?:然後|接著|再來|再|我們|我|要|想要|想|會|就|預計|大概|大約|約)+/;
const FILLER_TAIL = /(?:吧|喔|哦|囉|啦|了|一下|看看)+$/;
const RE_STAY_VERB = /(?:預計|大概|大約|約)?\s*(?:待|停留|玩|逛|安排)\s*$/;

const clean = (s) => s.replace(FILLER_HEAD, '').replace(FILLER_TAIL, '').trim();

/**
 * 解析語音文字
 * @param {string} text 語音辨識結果
 * @param {{ today?: Date, year?: number | ((month: number, day: number) => number) }} [opts]
 *   today：「今天／明天」的基準日；year：「12月23日」這種沒講年份時要用的年份
 */
export function parseTripVoice(text, { today = new Date(), year } = {}) {
  const raw = String(text || '').trim();
  const result = { date: null, time: null, title: null, location: null, durationMinutes: null, note: '' };
  if (!raw) return result;

  let rest = raw;
  const cut = (s) => { rest = rest.replace(s, '，'); };

  const date = parseDatePart(rest, { today, year });
  if (date) { result.date = date.value; cut(date.match); }

  // 停留時間要比時間先抓，避免「兩個小時」被當成「兩點」
  const duration = parseDurationPart(rest);
  if (duration) {
    result.durationMinutes = duration.value;
    duration.parts.forEach((p) => {
      // 一併移除前面的「預計待」「停留」
      const i = rest.indexOf(p);
      const before = rest.slice(0, i).replace(RE_STAY_VERB, '');
      rest = before + '，' + rest.slice(i + p.length);
    });
  }

  const time = parseTimePart(rest);
  if (time) { result.time = time.value; cut(time.match); }

  // 剩下的文字依標點切成片段
  const clauses = rest.split(/[，,。！!？?；;\n]+/).map(clean).filter(Boolean);

  let mainIdx = clauses.findIndex((c) => RE_GO.test(c));
  if (mainIdx !== -1) {
    const seg = clauses[mainIdx].match(RE_GO)[1].replace(FILLER_TAIL, '');
    const act = seg.match(RE_ACTION);
    result.location = act ? act[1] : seg;
    result.title = seg;
  } else if (clauses.length) {
    // 沒有「去／到」：第一段當行程名稱，地點不猜
    mainIdx = 0;
    result.title = clauses[0];
  }

  result.note = clauses.filter((_, i) => i !== mainIdx).join('，');
  return result;
}

/** 依文字猜類別（使用者可在確認卡修改）；猜不到回傳 null */
export function guessCategory({ title = '', location = '' } = {}) {
  const s = `${title || ''}${location || ''}`;
  // 住宿要先判斷，避免「飯店」被當成餐廳
  if (/飯店|酒店|旅館|民宿|入住|退房|check/i.test(s)) return '住宿';
  if (/吃|喝|餐|飯|麵|拉麵|燒肉|壽司|咖啡|甜點|居酒屋|早餐|午餐|晚餐|宵夜/.test(s)) return '餐廳';
  if (/買|購物|商場|百貨|藥妝|市場|商店街|outlet/i.test(s)) return '購物';
  if (/機場|車站|站$|搭|坐|電車|新幹線|巴士|JR|地鐵/i.test(s)) return '交通';
  return null;
}

/** 停留時間轉成備註文字：120 → "預計停留 2 小時" */
export function durationText(min) {
  if (!min) return '';
  const h = Math.floor(min / 60), m = min % 60;
  return `預計停留 ${h ? `${h} 小時` : ''}${h && m ? ' ' : ''}${m ? `${m} 分鐘` : ''}`;
}
