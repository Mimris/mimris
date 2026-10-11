import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { getNodeIdentityAliases, findLiveNodeByAliases, hasStructuralNodeArrayDiff } from '@mimris/modelling-editor/gojs';

test('node aliases preserve saved identifiers and ordered deduplication', () => {
  assert.deepEqual(getNodeIdentityAliases({ key: 0, objviewRef: 'view', objectview: { id: 'view' }, objRef: 'object', object: { id: 'object' }, __dragSessionToken: 'session' }), ['0', 'view', 'object', 'session']);
  assert.deepEqual(getNodeIdentityAliases({ key: '', objRef: null }), []);
  assert.deepEqual(getNodeIdentityAliases(undefined), []);
});

test('structural comparison ignores ordering and geometry but detects changed node membership', () => {
  const original = [{ key: 'a', loc: '1 2' }, { key: 'b' }];
  assert.equal(hasStructuralNodeArrayDiff([{ key: 'b' }, { key: 'a', loc: '10 20', name: 'new' }], original), false);
  assert.equal(hasStructuralNodeArrayDiff([{ key: 'a' }, { key: 'c' }], original), true);
  assert.equal(hasStructuralNodeArrayDiff([{ key: 'a' }], original), true);
  assert.equal(hasStructuralNodeArrayDiff(undefined, []), false);
  assert.equal(hasStructuralNodeArrayDiff([{}], [{}]), true);
});

test('live node lookup resolves keys and saved aliases within the supplied host diagram only', () => {
  const first = new go.Diagram(), second = new go.Diagram();
  first.nodeTemplate = new go.Node();
  second.nodeTemplate = new go.Node();
  first.model = new go.GraphLinksModel([{ key: 'live', objviewRef: 'saved-view', objRef: 'saved-object' }]);
  second.model = new go.GraphLinksModel([{ key: 'live', objviewRef: 'other-view' }]);
  const node = first.findNodeForKey('live');
  assert.ok(node instanceof go.Node);
  assert.equal(findLiveNodeByAliases(first, { key: 'live' }), node);
  assert.equal(findLiveNodeByAliases(first, { objectview: { id: 'saved-view' } }), node);
  assert.equal(findLiveNodeByAliases(first, { object: { id: 'saved-object' } }), node);
  assert.equal(findLiveNodeByAliases(second, { objviewRef: 'saved-view' }), null);
  assert.equal(findLiveNodeByAliases(null, { key: 'live' }), null);
});
