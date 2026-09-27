export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const safeUrl = (u) => (/^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '');
export const mapsUrl = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
export const cx = (...list) => list.filter(Boolean).join(' ');
