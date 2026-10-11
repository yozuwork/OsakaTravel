// Explicit allowlist: never spread a private trip or itinerary record into a public document.
export function publicSnapshot(state, now = Date.now()) {
  const text = (value, max) => typeof value === 'string' ? value.slice(0, max) : '';
  const trip = state.trip || {};
  const days = Math.min(60, Math.max(1, Number(trip.days) || 1));
  return {
    version: 1, publishedAt: now,
    trip: { name: text(trip.name, 120), startDate: text(trip.startDate, 10), days },
    items: (state.items || []).filter(item => Number.isInteger(item.day) && item.day >= 0 && item.day < days).map((item, index) => ({
      id: `stop-${index}`, day: item.day, order: Number.isFinite(item.order) ? item.order : index,
      title: text(item.title, 200), time: text(item.time, 5), category: text(item.category, 30), place: text(item.place, 250)
    }))
  };
}
