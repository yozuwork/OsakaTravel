import { WEEK } from '../data/constants';

export function parseDate(iso) {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  return y ? new Date(y, (m || 1) - 1, d || 1) : new Date();
}
export function toISO(dt) {
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}
export function addDays(iso, n) { const d = parseDate(iso); d.setDate(d.getDate() + n); return toISO(d); }
export function md(iso) { const d = parseDate(iso); return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`; }
export function mdw(iso) { return iso ? `${md(iso)}（${WEEK[parseDate(iso).getDay()]}）` : ''; }
export function diffDays(a, b) { return Math.round((parseDate(b) - parseDate(a)) / 86400000); }
export function period(t) {
  if (!t) return '未定';
  const h = parseInt(t.split(':')[0], 10);
  return h < 12 ? '上午' : h < 18 ? '下午' : '晚上';
}

/** 沒講年份的「12月23日」：優先選落在旅程期間內的年份（跨年旅程也能對上） */
export function tripYear(trip) {
  const startYear = parseDate(trip.startDate).getFullYear();
  return (month, day) => {
    for (const y of [startYear, startYear + 1]) {
      const d = diffDays(trip.startDate, `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
      if (d >= 0 && d < trip.days) return y;
    }
    return startYear;
  };
}

/** 例：DEC 21 - DEC 25, 2026 */
export function tripRangeText(trip) {
  const s = parseDate(trip.startDate);
  const e = parseDate(addDays(trip.startDate, trip.days - 1));
  const mon = (d) => d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const dd = (d) => String(d.getDate()).padStart(2, '0');
  return `${mon(s)} ${dd(s)} - ${mon(e)} ${dd(e)}, ${e.getFullYear()}`;
}
