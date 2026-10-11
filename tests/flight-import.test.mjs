import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { applyFlightImport } from '../src/utils/flightImport.js';

const payload = { type: 'osaka-flight-booking', importId: 'test-flight-import', flights: [
  { leg: '去程', date: '2026-12-21', airline: 'Test Airline', flightNo: 'TEST100', from: 'AAA', fromName: 'Airport A T1', to: 'BBB', toName: 'Airport B T2', dep: '09:00', arr: '12:00', duration: '2 hours', cover: 'peach' },
  { leg: '回程', date: '2026-12-25', airline: 'Test Airline', flightNo: 'TEST200', from: 'BBB', fromName: 'Airport B T2', to: 'AAA', toName: 'Airport A T1', dep: '15:00', arr: '17:00', duration: '3 hours', cover: 'peach' }
] };
const initial = () => ({ trip: { startDate: '2026-12-21', days: 5 }, flights: [{ id: 'out', leg: '去程', airline: 'Old Airline', seat: 'keep-seat', pnr: 'keep-pnr', ticket: 'keep-ticket' }], items: [
  { id: 'out-stop', day: 0, time: '09:20', title: 'Old Airline 起飛', image: '/covers/d1-starlux.jpg', images: ['/covers/d1-starlux.jpg', 'personal-photo'], order: 2 },
  { id: 'back-stop', day: 4, title: 'Old Airline 起飛', image: 'my-uploaded-photo', order: 5 },
  { id: 'keep', day: 0, title: 'My custom stop', order: 3 }
], stays: [{ orderNo: 'stay-order' }], shareLink: { token: 'keep-share' } });

test('flight import updates both legs and matching stops, preserves booking fields, IDs, order and custom photos, and is idempotent', () => {
  let seq = 0;
  const before = initial();
  const next = applyFlightImport(before, payload, () => `id-${++seq}`);
  assert.equal(before.flights[0].airline, 'Old Airline');
  assert.equal(next.flights[0].flightNo, 'TEST100');
  assert.equal(next.flights[0].seat, 'keep-seat');
  assert.equal(next.flights[0].pnr, 'keep-pnr');
  assert.equal(next.flights[0].ticket, 'keep-ticket');
  assert.equal(next.flights[1].flightNo, 'TEST200');
  assert.equal(next.items[0].time, '09:00');
  assert.equal(next.items[0].id, 'out-stop');
  assert.equal(next.items[0].order, 2);
  assert.deepEqual(next.items[0].images, ['covers/stable/peach.webp', 'personal-photo']);
  assert.equal(next.items[1].image, 'my-uploaded-photo');
  assert.equal(next.items[2].title, 'My custom stop');
  assert.deepEqual(next.stays, before.stays);
  assert.deepEqual(next.shareLink, before.shareLink);
  assert.equal(applyFlightImport(next, payload, () => 'unused'), next);
  assert.throws(() => applyFlightImport(before, { ...payload, flights: [{ ...payload.flights[0], date: '2027-01-01' }, payload.flights[1]] }, () => 'new-id'), /date/);
});

test('authenticated importer reads back the remote write and never reports success for a rejected transaction', async () => {
  const source = readFileSync(new URL('../scripts/private-flight-upload.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '');
  const nodes = Object.fromEntries(['#login', '#status', '#done'].map(key => [key, { hidden: true }]));
  let data = initial(), reject = false;
  const context = vm.createContext({ document: { querySelector: key => nodes[key] }, auth: {}, database: {}, databasePath: 'test',
    applyFlightImport, crypto: { randomUUID: () => 'new-id' }, GoogleAuthProvider: class {}, signInWithPopup: async () => {}, onAuthStateChanged: () => {},
    fetch: async () => ({ ok: true, json: async () => payload }), ref: () => ({}), get: async () => ({ val: () => data }),
    runTransaction: async (_, change) => { if (reject) throw Error('PERMISSION_DENIED'); data = change(data); return { committed: true }; }
  });
  vm.runInContext(source, context);
  await vm.runInContext('writeFlights({getIdToken:async()=>"test-token"})', context);
  assert.match(nodes['#status'].textContent, /讀回確認成功/);
  assert.equal(nodes['#done'].hidden, false);
  reject = true;
  vm.runInContext('working=false', context);
  await vm.runInContext('writeFlights({getIdToken:async()=>"test-token"})', context);
  assert.match(nodes['#status'].textContent, /尚未完成/);
});
