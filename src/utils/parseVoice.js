/* =========================================================
   待辦、行李、收集箱、住宿的語音解析（第一版：純 Regex）
   行程請用 parseTripVoice.js；資訊不足的欄位留空，不猜測
   ========================================================= */
import { NUM, guessCategory, parseDatePart, parseTimePart, toNum } from './parseTripVoice';

const TAIL = /(?:吧|喔|哦|囉|啦|了|一下)+$/;
const SPLIT = /[，,、。！!？?；;\n]+|還有|然後|另外|以及/;

/**
 * 一句話拆成多個項目
 * parseListVoice('記得換日幣、買藥妝還有預約美容院', 'todo') → ['換日幣', '買藥妝', '預約美容院']
 * @param {'todo' | 'bag'} kind todo：保留「買」等動詞；bag：去掉「要帶」「準備」等
 */
export function parseListVoice(text, kind = 'todo') {
  const head = kind === 'bag'
    ? /^(?:我|我們)?(?:還)?(?:要|需要|記得|別忘了|不要忘記)?(?:帶|準備|放|加入|新增|加)?/
    : /^(?:我|我們)?(?:還)?(?:要記得|記得|別忘了|不要忘記|幫我|提醒我)?(?:新增|加入|加)?(?:待辦)?(?:要)?/;
  return String(text || '')
    .split(SPLIT)
    .map((s) => s.trim().replace(head, '').replace(TAIL, '').trim())
    .filter(Boolean);
}

/**
 * 收集箱：想法
 * parseIdeaVoice('想去黑門市場吃海鮮，聽說早上去人比較少')
 * → { title: '黑門市場吃海鮮', category: '餐廳', desc: '聽說早上去人比較少' }
 */
export function parseIdeaVoice(text) {
  const clauses = String(text || '').split(/[，,。！!？?；;\n]+/).map((s) => s.trim()).filter(Boolean);
  const title = (clauses[0] || '')
    .replace(/^(?:我|我們)?(?:有空|有機會|之後|可以)?(?:想要|想|要|記下|記得|收藏|新增|加入)?(?:去|到|前往)?/, '')
    .replace(TAIL, '').trim();
  return {
    title,
    category: guessCategory({ title: clauses[0] || '' }),
    desc: clauses.slice(1).join('，')
  };
}

const HOTEL = /(?:飯店|酒店|旅館|旅店|民宿|青旅|青年旅館|膠囊旅館|hotel|inn|hostel)/i;
const RE_NIGHTS = new RegExp(`(?:住|待)?\\s*(${NUM})\\s*(?:晚|個晚上|夜)`);
// 只講「25號退房」沒講月份
const RE_DAY_ONLY = new RegExp(`(${NUM})\\s*[日號号]`);

/**
 * 住宿
 * parseStayVoice('12月21號下午三點入住難波東急飯店，住四晚', { year: 2026 })
 * → { name: '難波東急飯店', checkIn: '2026-12-21', checkInTime: '15:00', checkOut: '2026-12-25', checkOutTime: '' }
 * @param {{ today?: Date, year?: number | Function }} [opts] 同 parseTripVoice
 */
export function parseStayVoice(text, { today = new Date(), year } = {}) {
  const r = { name: '', checkIn: '', checkInTime: '', checkOut: '', checkOutTime: '' };
  const clauses = String(text || '').split(/[，,。！!？?；;\n]+/).map((s) => s.trim()).filter(Boolean);
  const loose = [];   // 沒標「入住／退房」的日期，依序補上
  let nights = null;
  const nameParts = [];

  for (let c of clauses) {
    const isOut = /退房|check\s*out/i.test(c);
    const isIn = !isOut && /入住|check\s*in/i.test(c);

    const n = c.match(RE_NIGHTS);
    if (n && !Number.isNaN(toNum(n[1]))) { nights = toNum(n[1]); c = c.replace(n[0], ''); }

    let date = parseDatePart(c, { today, year });
    if (!date && isOut && r.checkIn) {
      // 「25號退房」：沿用入住的年月
      const d = c.match(RE_DAY_ONLY);
      if (d) {
        const day = String(toNum(d[1])).padStart(2, '0');
        date = { value: `${r.checkIn.slice(0, 8)}${day}`, match: d[0] };
      }
    }
    if (date) c = c.replace(date.match, '');
    const time = parseTimePart(c);
    if (time) c = c.replace(time.match, '');

    if (isOut) { if (date) r.checkOut = date.value; if (time) r.checkOutTime = time.value; }
    else if (isIn) { if (date) r.checkIn = date.value; if (time) r.checkInTime = time.value; }
    else if (date) {
      loose.push(date.value);
      // 「12月22號到12月24號」：同一句的第二個日期
      const second = parseDatePart(c, { today, year });
      if (second) { loose.push(second.value); c = c.replace(second.match, ''); }
    }

    const rest = c.replace(/入住|退房|check\s*(?:in|out)|住在|住進|住到|住/gi, '').replace(/^(?:我|我們)?(?:要|會)?(?:在)?(?:到|至|~|-)?/, '').replace(TAIL, '').trim();
    if (rest) nameParts.push(rest);
  }

  if (!r.checkIn && loose.length) r.checkIn = loose.shift();
  if (!r.checkOut && loose.length) r.checkOut = loose.shift();
  if (!r.checkOut && r.checkIn && nights) {
    const [y, m, d] = r.checkIn.split('-').map(Number);
    const out = new Date(y, m - 1, d + nights);
    r.checkOut = `${out.getFullYear()}-${String(out.getMonth() + 1).padStart(2, '0')}-${String(out.getDate()).padStart(2, '0')}`;
  }
  // 優先用含「飯店／酒店…」的片段當名稱
  r.name = nameParts.find((p) => HOTEL.test(p)) || nameParts[0] || '';
  return r;
}
