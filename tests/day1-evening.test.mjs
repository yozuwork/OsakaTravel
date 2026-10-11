import test from 'node:test';
import assert from 'node:assert/strict';
import { addDay1Evening, day1EveningItems } from '../src/data/day1Evening.js';
import { dayItems } from '../src/utils/itinerary.js';

test('DAY1 migration preserves airport travel, other days and custom data, and adds ordered evening stops once', () => {
  const saved = { items: [
    { id: 'arrival', day: 0, time: '13:10', title: '抵達關西機場第二航廈', note: '入境提示', order: 0 },
    { id: 'train', day: 0, time: '14:30', title: '搭乘南海 rapi:t 前往難波', note: '原本交通', order: 1 },
    { id: 'hotel', day: 0, time: '15:45', title: '心齋橋長堀通哈頓飯店 入住', note: '原本提醒', order: 2 },
    { id: 'custom', day: 0, time: '18:45', title: '自己的行程', image: 'custom-photo', order: 3 },
    { id: 'day4', day: 3, time: '12:00', title: '中之島', note: '保留', order: 0 }
  ] };
  const updated = addDay1Evening(saved);
  assert.equal(updated.items.length, saved.items.length + 7);
  assert.deepEqual(updated.items.find(item => item.id === 'day4'), saved.items[4]);
  assert.equal(updated.items.find(item => item.id === 'train').note, '原本交通');
  assert.equal(updated.items.find(item => item.id === 'custom').image, 'custom-photo');
  assert.match(updated.items.find(item => item.id === 'hotel').note, /原本提醒.*\n15:45–16:20/);
  assert.equal(dayItems(updated.items, 0).at(-1).time, '20:30');
  assert.deepEqual(addDay1Evening(updated), updated);
  assert.equal(saved.items.length, 5);
});

test('existing matching DAY1 stops keep edits and are not duplicated', () => {
  const existing = { ...day1EveningItems()[1], id: 'my-animate', time: '17:00', note: '自訂備註' };
  const updated = addDay1Evening({ items: [existing] });
  assert.equal(updated.items.filter(item => item.title === existing.title).length, 1);
  assert.equal(updated.items.find(item => item.id === existing.id).note, '自訂備註');
  assert.equal(updated.items.find(item => item.id === existing.id).time, '17:00');
});
