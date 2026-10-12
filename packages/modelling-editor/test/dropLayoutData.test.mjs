import test from 'node:test';
import assert from 'node:assert/strict';
import { getObjectTypesForDropLayout, uniqueStringValues, normalizeToKey, getNodeTypeRef } from '@mimris/modelling-editor';
test('type lookup retains host method precedence and copies arrays without cloning runtime types', () => {
  const type = { id: 'saved', unknown: 'keep' }, types = [type];
  const runtime = { objecttypes: [{ id: 'fallback' }], getObjectTypes() { assert.equal(this, runtime); return types; } };
  const result = getObjectTypesForDropLayout(runtime);
  assert.deepEqual(result, types); assert.notEqual(result, types); assert.equal(result[0], type);
  assert.deepEqual(getObjectTypesForDropLayout({ objecttypes: types }), types);
  assert.deepEqual(getObjectTypesForDropLayout({ currentMetamodel: { getObjectTypes: () => types } }), types);
  assert.deepEqual(getObjectTypesForDropLayout(null), []);
});
test('layout key normalization keeps sorted unique saved values and ignores absent values', () => {
  assert.deepEqual(uniqueStringValues(['b', 0, '0', null, undefined, 'a', 'b']), ['0', 'a', 'b']);
  assert.equal(normalizeToKey(' POOL '), 'pool');
  assert.equal(normalizeToKey(null), '');
  assert.equal(normalizeToKey(0), '0');
});
test('node type lookup preserves reference precedence and legacy runtime representations', () => {
  assert.equal(getNodeTypeRef({ data: { objtypeRef: 'first', typeRef: 'second' } }), 'first');
  for (const data of [{ objecttype: { typeRef: 'type' } }, { object: { type: { id: 'type' } } }, { objtype: { id: 'type' } }, { objTypeRef: 'type' }]) assert.equal(getNodeTypeRef({ data }), 'type');
  assert.equal(getNodeTypeRef(null), undefined);
  assert.equal(getNodeTypeRef({ data: {} }), undefined);
});
