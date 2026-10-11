/** Generic import logic only. Actual booking details are supplied by the private local file. */
export function applyFlightImport(current, payload, makeId) {
  if (!current?.trip || payload?.type !== 'osaka-flight-booking' || !Array.isArray(payload.flights) || payload.flights.length !== 2 || !payload.importId) throw Error('Invalid flight import');
  if (current.flightImportId === payload.importId) return current;
  const next = { ...current, flights: Object.values(current.flights || {}).map(f => ({ ...f })), items: Object.values(current.items || {}).map(item => ({ ...item })) };
  const fields = ['leg', 'date', 'airline', 'flightNo', 'from', 'fromName', 'to', 'toName', 'dep', 'arr', 'cabin', 'aircraft', 'duration', 'timeZoneNote'];
  for (const input of payload.flights) {
    const flight = Object.fromEntries(fields.filter(key => typeof input[key] === 'string').map(key => [key, input[key]]));
    if (!['去程', '回程'].includes(flight.leg) || !flight.flightNo || !/^\d{4}-\d{2}-\d{2}$/.test(flight.date || '') || !/^\d{2}:\d{2}$/.test(flight.dep || '') || !/^\d{2}:\d{2}$/.test(flight.arr || '')) throw Error('Incomplete flight');
    const day = Math.round((Date.parse(`${flight.date}T00:00:00Z`) - Date.parse(`${current.trip.startDate}T00:00:00Z`)) / 86400000);
    if (!Number.isInteger(day) || day < 0 || day >= current.trip.days) throw Error('Flight date does not match the current trip');
    let record = next.flights.find(f => f.leg === flight.leg);
    if (record) Object.assign(record, flight);
    else { record = { id: makeId(), ...flight, pnr: '', seat: '', baggage: '', ticket: '' }; next.flights.push(record); }
    let stop = next.items.find(item => item.flightId === record.id || (item.day === day && /起飛|去程航班|回程航班/.test(item.title || '')));
    const image = input.cover === 'peach' ? 'covers/stable/peach.webp' : '';
    const patch = { day, time: flight.dep, category: '交通', title: `${flight.airline} ${flight.flightNo} ${flight.from} → ${flight.to} 起飛`, place: flight.fromName, flightId: record.id };
    if (!stop) { stop = { id: makeId(), ...patch, note: '', order: next.items.filter(item => item.day === day).length }; next.items.push(stop); }
    else Object.assign(stop, patch);
    const summary = `${flight.arr} 抵達 ${flight.toName}；${flight.duration || ''}；所有時間為機場當地時間`;
    stop.note = stop.note ? `${summary}\n${stop.note.replace(/(?:星宇航空|星宇)/g, flight.airline).replace(/直飛[，,]?\s*約?\s*\d+\s*小時\s*\d*\s*分鐘/g, '').trim()}` : summary;
    if (image) {
      const wrongCover = value => typeof value === 'string' && /(?:d1-starlux|starlux)/i.test(value);
      const old = stop.image;
      if (!old || wrongCover(old) || stop.coverCredit?.image === old) {
        stop.image = image;
        stop.images = [image, ...(stop.images || []).filter(value => value !== old && value !== image && !wrongCover(value))];
        delete stop.coverCredit;
      }
    }
    // The arrival/check-in stop's terminal also comes from the supplied booking.
    for (const item of next.items) {
      if (item.day !== day || item.id === stop.id) continue;
      if (flight.leg === '去程' && /抵達.*(?:關西|関西).*機場/.test(item.title || '') && !/辦理報到/.test(item.title)) {
        item.time = flight.arr; item.title = `抵達${flight.toName}`; item.place = flight.toName;
      }
      if (flight.leg === '回程' && /抵達.*(?:關西|関西).*機場.*報到/.test(item.title || '')) {
        item.title = `抵達${flight.fromName}辦理報到`; item.place = flight.fromName;
      }
    }
  }
  next.flightImportId = payload.importId;
  return next;
}
