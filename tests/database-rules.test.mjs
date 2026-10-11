import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const rules = JSON.parse(readFileSync(new URL('../firebase-database-rules.template.json', import.meta.url))).rules;

test('root denies access and the existing music app remains owner-only', () => {
  assert.equal(rules['.read'], false);
  assert.equal(rules['.write'], false);
  for (const action of ['.read', '.write']) {
    const evaluate = (auth) => vm.runInNewContext(rules.yozuMusic[action], { auth });
    assert.equal(evaluate({ uid: 'K6DbALyBPVdX8SkUf36TnyF20433' }), true);
    assert.equal(evaluate({ uid: 'another-user' }), false);
    assert.equal(evaluate(null), false);
  }
});
const snapshot = (value) => ({
  val: () => value, isString: () => typeof value === 'string',
  isNumber: () => typeof value === 'number', isBoolean: () => typeof value === 'boolean',
  hasChild: (key) => value?.[key] != null,
  hasChildren: (keys) => keys.every((key) => value?.[key] != null),
  child: (key) => snapshot(value?.[key])
});
function validate(node, value, variables = {}) {
  if (value == null) return true;
  if (node['.validate'] === false) return false;
  if (node['.validate']) {
    // Firebase's beginsWith is equivalent to JavaScript's startsWith.
    const expression = node['.validate'].replaceAll('.beginsWith(', '.startsWith(');
    if (!vm.runInNewContext(expression, { newData: snapshot(value), ...variables })) return false;
  }
  if (typeof value !== 'object') return true;
  return Object.entries(value).every(([key, child]) => {
    const wildcard = Object.keys(node).find((entry) => entry.startsWith('$') && entry !== '$other');
    const rule = node[key] || node[wildcard] || node.$other;
    return !rule || validate(rule, child, { ...variables, ...(wildcard ? { [wildcard]: key } : {}) });
  });
}

test('postcard schema accepts encoded images and rejects unknown fields', () => {
  const image = { __imageBlob: 'data:image/webp;base64,AAAA' };
  const card = { id: 'card-1', itemId: 'stop-1', style: 'polaroid', orient: 'port', msg: '', photo: image, card: image, at: 1000,
    stamps: [{ id: 'post', x: 0.2, y: 0.3, rot: 0.1, at: 1000 }] };
  const schema = rules.osakaTravelCheckin.$uid.cards;
  assert.equal(validate(schema, { 'card-1': card }), true);
  assert.equal(validate(schema, { 'card-1': { ...card, unsafe: true } }), false);
  assert.equal(validate(schema, { 'card-1': { ...card, photo: { __imageBlob: 'https://unknown/image' } } }), false);
  assert.equal(validate(schema, { 'wrong-id': card }), false);
});

test('transit and postcard access remain limited to the authenticated owner', () => {
  for (const node of [rules.osakaTravelCheckin.$uid, rules.osakaTravelTransit.$uid]) {
    for (const action of ['.read', '.write']) {
      const allowed = { uid: 'K6DbALyBPVdX8SkUf36TnyF20433', token: {} };
      assert.equal(vm.runInNewContext(node[action], { auth: allowed, $uid: allowed.uid }), true);
      assert.equal(vm.runInNewContext(node[action], { auth: allowed, $uid: 'another-user' }), false);
      assert.equal(vm.runInNewContext(node[action], { auth: null, $uid: allowed.uid }), false);
    }
  }
});
