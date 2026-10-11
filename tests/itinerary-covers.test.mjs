import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { day1EveningItems } from '../src/data/day1Evening.js';

test('all new DAY1 stops receive relevant covers, with sources, while custom photos remain intact', () => {
  const read = (file) => JSON.parse(readFileSync(new URL(`../src/data/${file}`, import.meta.url), 'utf8'));
  const context = vm.createContext({ baseCovers: read('itineraryCoverLinks.json'), day1Covers: read('day1CoverLinks.json') });
  const source = readFileSync(new URL('../src/data/itineraryCovers.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '').replace('export function', 'function');
  vm.runInContext(source, context);
  const items = day1EveningItems();
  const patched = context.withOnlineCovers(items);
  assert.equal(patched.length, 7);
  assert.ok(patched.every(item => item.image && item.images[0] === item.image && item.coverCredit.source));
  assert.match(patched[1].image, /animate/);
  assert.match(patched[2].image, /mandarake/);
  assert.match(patched[4].coverCredit.license, /示意/);
  assert.match(patched[6].image, /hearton/);
  const custom = { ...items[1], image: 'my-own-cover', images: ['my-own-cover', 'my-photo'] };
  assert.equal(context.withOnlineCovers([custom])[0], custom);
});
