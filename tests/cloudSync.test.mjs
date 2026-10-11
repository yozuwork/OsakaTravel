import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function harness(initial = {}, saved, options = {}) {
  const listeners = [], writes = [], timers = new Map(), caches = new Map();
  let timerId = 0;
  if (saved) caches.set('test/user', saved);
  const create = (init) => {
    let state = init();
    const subscribers = new Set();
    const store = () => state;
    store.getState = () => state;
    store.setState = (patch, replace) => {
      const previous = state;
      const value = typeof patch === 'function' ? patch(state) : patch;
      state = replace ? value : { ...state, ...value };
      subscribers.forEach((fn) => fn(state, previous));
    };
    store.subscribe = (fn) => { subscribers.add(fn); return () => subscribers.delete(fn); };
    return store;
  };
  let nextWrite = () => Promise.resolve();
  const context = vm.createContext({ create, database: {},
    ref: (_, path) => path,
    onValue: (path, callback, error) => { listeners.push({ path, callback, error }); return () => {}; },
    update: (path, data) => { writes.push({ path, data }); return nextWrite(); },
    readCloudCache: async (key) => structuredClone(caches.get(key)),
    writeCloudCache: async (key, value) => { caches.set(key, structuredClone(value)); return true; },
    encodeCloudImages: async (value) => value, decodeCloudImages: async (value) => value,
    setTimeout: (fn, delay) => { timers.set(++timerId, { fn, delay }); return timerId; },
    clearTimeout: (id) => timers.delete(id)
  });
  const source = readFileSync(new URL('../src/services/cloudSync.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
  vm.runInContext(source + '\nglobalThis.api = { createCloudSync, useCloudStatus };', context);
  const store = create(() => initial);
  const sync = context.api.createCloudSync({ name: 'test', store, apply: (value) => store.setState(value, true), ...options });
  const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  return { store, sync, listeners, writes, caches, timers, status: context.api.useCloudStatus,
    setWrite: (fn) => { nextWrite = fn; }, settle,
    async snapshot(data, index = listeners.length - 1) {
      await listeners[index].callback({ exists: () => data !== null, val: () => data });
      await settle();
    },
    async timer() {
      const entry = timers.entries().next().value;
      if (!entry) return;
      timers.delete(entry[0]); entry[1].fn(); await settle();
    }
  };
}

test('a toggle during slow cloud loading survives and is written as a partial update', async () => {
  const h = harness({ dialogueAutoplay: true, splashMs: 1200 });
  await h.sync.start('test/user');
  h.store.setState({ dialogueAutoplay: false });
  await h.snapshot({ dialogueAutoplay: true, splashMs: 3000 });
  assert.equal(h.store.getState().dialogueAutoplay, false);
  assert.equal(h.store.getState().splashMs, 3000);
  await h.timer();
  assert.deepEqual(Object.keys(h.writes[0].data), ['dialogueAutoplay']);
  assert.equal(h.writes[0].data.dialogueAutoplay, false);
  assert.equal(h.status.getState().documents.test, 'synced');
});

test('unsent changes are restored after reopening while unrelated cloud data wins', async () => {
  const h = harness({}, { data: { title: 'Cached', images: ['photo'] }, pending: { images: ['photo'] } });
  await h.sync.start('test/user');
  await h.snapshot({ title: 'Cloud', images: [] });
  assert.equal(h.store.getState().title, 'Cloud');
  assert.deepEqual(h.store.getState().images, ['photo']);
  await h.timer();
  assert.equal(h.writes[0].data.images[0], 'photo');
  assert.equal(Object.keys(h.caches.get('test/user').pending).length, 0);
});

test('a rejected write remains pending and is retried instead of reporting success', async () => {
  const h = harness({ title: 'Before' });
  await h.sync.start('test/user');
  await h.snapshot({ title: 'Before' });
  h.store.setState({ title: 'After' });
  h.setWrite(() => Promise.reject(new Error('permission-denied')));
  await h.timer();
  assert.equal(h.status.getState().documents.test, 'error');
  assert.equal(h.caches.get('test/user').pending.title, 'After');
  h.setWrite(() => Promise.resolve());
  await h.timer();
  assert.equal(h.status.getState().documents.test, 'synced');
  assert.equal(Object.keys(h.caches.get('test/user').pending).length, 0);
});

test('an older write acknowledgement cannot clear a newer change', async () => {
  const h = harness({ title: 'Before' });
  await h.sync.start('test/user');
  await h.snapshot({ title: 'Before' });
  let acknowledge;
  h.setWrite(() => new Promise((resolve) => { acknowledge = resolve; }));
  h.store.setState({ title: 'First' });
  await h.timer();
  h.store.setState({ title: 'Second' });
  acknowledge(); await h.settle();
  assert.equal(h.caches.get('test/user').pending.title, 'Second');
  h.setWrite(() => Promise.resolve());
  await h.timer();
  assert.equal(h.writes.at(-1).data.title, 'Second');
});

test('stopped sessions ignore late snapshots and pending timers', async () => {
  const h = harness({ title: 'Before' });
  await h.sync.start('test/user');
  await h.snapshot({ title: 'Before' });
  h.store.setState({ title: 'Pending' });
  h.sync.stop();
  await h.snapshot({ title: 'Stale' });
  await h.timer();
  assert.equal(h.store.getState().title, 'Pending');
  assert.equal(h.writes.length, 0);
});

test('an empty cloud document is created from existing data', async () => {
  const h = harness({ cards: { a: { id: 'a' } }, stamps: {} });
  await h.sync.start('test/user');
  await h.snapshot(null);
  await h.timer();
  assert.equal(h.writes[0].data.cards.a.id, 'a');
});

test('read permission errors leave the document unready and schedule a retry', async () => {
  const h = harness({ title: 'Local' });
  await h.sync.start('test/user');
  h.listeners[0].error(new Error('permission-denied'));
  assert.equal(h.status.getState().documents.test, 'error');
  assert.equal(h.status.getState().readyDocuments.test, false);
  await h.timer();
  assert.equal(h.listeners.length, 2);
});

test('empty collections omitted by Firebase do not cause endless normalization writes', async () => {
  const h = harness({ cards: {} }, undefined, { normalize: (data) => ({ cards: data.cards || {} }) });
  await h.sync.start('test/user');
  await h.snapshot({});
  await h.timer();
  const count = h.writes.length;
  await h.snapshot({});
  await h.timer();
  assert.equal(h.writes.length, count);
});

test('legacy migration preserves cloud edits, recovers missing photos, and runs once', async () => {
  const h = harness({ items: [] }, undefined, {
    migrate: async () => ({ items: [{ id: 'a', title: 'Old title', images: ['saved-photo'] }, { id: 'b', title: 'Local only' }] })
  });
  await h.sync.start('test/user');
  await h.snapshot({ items: [{ id: 'a', title: 'Cloud title' }] });
  assert.equal(h.store.getState().items[0].title, 'Cloud title');
  assert.equal(h.store.getState().items[0].images[0], 'saved-photo');
  assert.equal(h.store.getState().items[1].id, 'b');
  await h.timer();
  await h.snapshot({ items: [{ id: 'a', title: 'Cloud title', images: ['saved-photo'] }] });
  assert.equal(h.store.getState().items.length, 1);
});
