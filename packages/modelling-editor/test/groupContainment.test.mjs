import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { wouldCreateGroupCycle, objectContainsDescendant } from '@mimris/modelling-editor/gojs';

function host() {
  const diagram = new go.Diagram();
  diagram.groupTemplate = new go.Group();
  diagram.model = new go.GraphLinksModel([
    { key: 'outer', isGroup: true },
    { key: 'inner', isGroup: true, group: 'outer' },
    { key: 'deep', isGroup: true, group: 'inner' },
    { key: 'other', isGroup: true },
  ]);
  return diagram;
}

test('native group containment rejects self and descendants but permits ancestors and separate groups', () => {
  const diagram = host();
  const outer = diagram.findNodeForKey('outer'), inner = diagram.findNodeForKey('inner'), deep = diagram.findNodeForKey('deep');
  assert.equal(wouldCreateGroupCycle(outer, outer), true);
  assert.equal(wouldCreateGroupCycle(outer, deep), true);
  assert.equal(wouldCreateGroupCycle(inner, deep), true);
  assert.equal(wouldCreateGroupCycle(deep, outer), false);
  assert.equal(wouldCreateGroupCycle(outer, diagram.findNodeForKey('other')), false);
  assert.equal(wouldCreateGroupCycle(outer, host().findNodeForKey('inner')), false);
  assert.equal(wouldCreateGroupCycle(null, outer), false);
});

const relation = (child, name = 'Contains', markedAsDeleted = false) => ({ type: { name }, toObject: child, markedAsDeleted });

test('object containment follows active matching relationships and terminates on existing cycles', () => {
  const a = { id: 'a' }, b = { id: 'b' }, c = { id: 'c' };
  a.outputrels = [relation(b)]; b.outputrels = [relation(c)]; c.outputrels = [relation(a)];
  const type = { name: 'Contains' };
  assert.equal(objectContainsDescendant(a, c, type), true);
  assert.equal(objectContainsDescendant(a, { id: 'a' }, type), true);
  assert.equal(objectContainsDescendant(a, { id: 'absent' }, type), false);
  assert.equal(a.outputrels[0].toObject, b);
  assert.equal(c.outputrels[0].toObject, a);
});

test('deleted, unrelated and malformed relationships do not establish containment', () => {
  const child = { id: 'child' }, root = { id: 'root', outputrels: [null, {}, relation(child, 'Other'), relation(child, 'Contains', true), relation({})] };
  assert.equal(objectContainsDescendant(root, child, { name: 'Contains' }), false);
  assert.equal(objectContainsDescendant(null, child, { name: 'Contains' }), false);
  assert.equal(objectContainsDescendant(root, child, {}), false);
  assert.equal(objectContainsDescendant({ id: 'root', outputrels: {} }, child, { name: 'Contains' }), false);
});
