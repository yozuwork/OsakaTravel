import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

test('private booking upload preserves photos and other stays, verifies the remote write, and does not report success on failure', async () => {
  const source = readFileSync(new URL('../scripts/private-stay-upload.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '');
  const booking = { name: '測試飯店', orderNo: 'TEST-ORDER', checkIn: '2026-12-21', confirmationNo: 'TEST-CONFIRM', roomType: '三人房' };
  let stays = [{ id: 'stay', name: booking.name, checkIn: booking.checkIn, photo: 'keep-photo', images: ['keep-photo'], platform: 'keep-platform' }, {id: 'other', name: '另一間飯店'}];
  const nodes = Object.fromEntries(['#login', '#status', '#done'].map(id => [id, {hidden:true}]));
  let reject = false;
  const context = vm.createContext({
    document: {querySelector: id => nodes[id]}, auth: {}, database: {}, databasePath: 'test', crypto: {randomUUID: () => 'new-id'},
    GoogleAuthProvider: class {}, signInWithPopup: async () => {}, onAuthStateChanged: () => {},
    fetch: async () => ({ok:true,json:async()=>({type:'osaka-stay-booking',stay:booking})}),
    ref: () => ({}), runTransaction: async (_, update) => { if (reject) throw Error('PERMISSION_DENIED'); stays = update(stays);return {committed:true}; },
    get: async () => ({val: () => stays})
  });
  vm.runInContext(source, context);
  await vm.runInContext('writeBooking({getIdToken: async () => "test-token"})', context);
  assert.equal(stays.length, 2);
  assert.equal(stays[0].photo, 'keep-photo');
  assert.equal(stays[0].platform, 'keep-platform');
  assert.equal(stays[0].confirmationNo, booking.confirmationNo);
  assert.equal(stays[1].name, '另一間飯店');
  assert.match(nodes['#status'].textContent, /讀回確認成功/);
  assert.equal(nodes['#done'].hidden, false);
  reject = true;
  vm.runInContext('working = false', context);
  await vm.runInContext('writeBooking({getIdToken: async () => "test-token"})', context);
  assert.match(nodes['#status'].textContent, /尚未完成/);
  assert.equal(nodes['#login'].disabled, false);
});
