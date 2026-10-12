import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDropLayoutOverridesFromMetis as build } from '@mimris/modelling-editor';
const kinds = { CONT: 'Container', POOL: 'Pool', LANE: 'Lane' };
test('host viewkinds produce existing ordered rules and metadata without altering saved types', () => {
  const types = [{ id: 'c', viewkind: ' Container ' }, { id: 'p', viewkind: 'Pool' }, { id: 'l', viewkind: 'Lane' }, { id: 'g', name: 'Gateway' }, { id: 'e', name: 'Start event' }, { id: 't', name: 'Task' }];
  const original = structuredClone(types);
  const result = build({ objecttypes: types }, kinds);
  assert.deepEqual(result.rules.map(rule => rule.order), [-40, -35, -30, 5, 10, 20]);
  assert.deepEqual(result.metadata, { poolTypeIds: ['p'], laneTypeIds: ['l'], containerTypeIds: ['c'], poolPadding: 80 });
  assert.equal(result.rules[0].layout.grid.spacingY, 360);
  assert.equal(result.rules[2].layout.grid.columns, 2);
  assert.equal(result.rules[3].layout.circle.radius, 140);
  assert.deepEqual(types, original);
});
test('classification precedence, deleted types and runtime container policy remain unchanged', () => {
  const type = { id: 'container', name: 'Task gateway', isContainer() { assert.equal(this, type); return true; } };
  const result = build({ objecttypes: [type, type, { id: 'deleted', name: 'Task', markedAsDeleted: true }, { name: 'Task' }] }, kinds);
  assert.equal(result.rules.length, 1);
  assert.deepEqual(result.rules[0].matchValues, ['container']);
  assert.equal(result.rules[0].id, 'drop-rule-containers');
});
test('independent host viewkind settings change classification without shared configuration', () => {
  const runtime = { objecttypes: [{ id: 'custom', viewkind: 'Special' }] };
  assert.equal(build(runtime, kinds), undefined);
  assert.deepEqual(build(runtime, { POOL: 'Special' }).metadata.poolTypeIds, ['custom']);
  assert.equal(build(runtime, kinds), undefined);
  assert.equal(build(null, kinds), undefined);
});
