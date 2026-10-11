import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { publicSnapshot } from '../src/pages/share/publicSnapshot.js';
import { publishSnapshot, revokeSnapshot } from '../src/pages/share/shareActions.js';

test('public snapshot uses a strict allowlist and removes private data and internal IDs', () => {
  const snapshot = publicSnapshot({ trip: { name: '大阪旅行', startDate: '2026-12-21', days: 5, secret: 'private' },
    stays: [{ orderNo: 'secret booking' }], flights: [{ seat: '21A' }], dialogue: { secret: true },
    items: [{ id: 'private-id', day: 0, order: 1, title: '日本橋', time: '16:50', category: '景點', place: '大阪', note: 'private note', image: 'private image', links: ['private link'], say: 'private dialogue' }] }, 123);
  assert.deepEqual(Object.keys(snapshot), ['version', 'publishedAt', 'trip', 'items']);
  assert.deepEqual(Object.keys(snapshot.items[0]), ['id', 'day', 'order', 'title', 'time', 'category', 'place']);
  assert.equal(JSON.stringify(snapshot).includes('private'), false);
  assert.equal(snapshot.publishedAt, 123);
});

test('publication and revocation write atomically and rejected writes never report success', async () => {
  const token = 'a'.repeat(48);
  const writes = [];
  const args = { path: 'travel', token, state: { trip: { name: 'Trip', startDate: '2026-12-21', days: 5 }, items: [] }, now: 123, write: async change => writes.push(change) };
  assert.deepEqual(await publishSnapshot(args), { token, publishedAt: 123 });
  assert.equal(writes[0][`travelPublic/${token}`].trip.name, 'Trip');
  assert.deepEqual(writes[0]['travel/shareLink'], { token, publishedAt: 123 });
  await revokeSnapshot(args);
  assert.deepEqual(writes[1], { [`travelPublic/${token}`]: null, 'travel/shareLink': null });
  const reject = async () => { throw Error('permission denied'); };
  await assert.rejects(publishSnapshot({ ...args, write: reject }), /permission denied/);
  await assert.rejects(revokeSnapshot({ ...args, write: reject }), /permission denied/);
});

test('public rules allow direct anonymous reads, deny collection enumeration and unauthorized writes', () => {
  const { rules } = JSON.parse(readFileSync(new URL('../firebase-database-rules.template.json', import.meta.url), 'utf8'));
  const collection = rules.osakaTravelPublic;
  assert.equal(rules['.read'], false);
  assert.equal(collection['.read'], undefined);
  assert.equal(collection.$token['.read'], true);
  const canWrite = new Function('auth', `return (${collection.$token['.write']})`);
  assert.equal(canWrite(null), false);
  assert.equal(canWrite({ uid: 'stranger', token: { email_verified: true, email: 'stranger@example.com' } }), false);
  assert.equal(canWrite({ uid: 'stranger', token: { email_verified: false, email: 'stupid1111174@gmail.com' } }), false);
  assert.equal(collection.$token['$other']['.validate'], false);
  assert.equal(collection.$token.items.$index['$other']['.validate'], false);
});
