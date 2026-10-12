import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { getNodeKey, getGroupKeyFromData, ensureNodeIsGroup, setNodeGroup } from '@mimris/modelling-editor';
test('node and group keys preserve zero, empty and saved-key precedence', () => {
  assert.equal(getNodeKey({ data: { key: 0 }, key: 'fallback' }), 0);
  assert.equal(getNodeKey({ key: 'fallback' }), 'fallback');
  assert.equal(getNodeKey(null), undefined);
  assert.equal(getGroupKeyFromData({ group: '' }), '');
  assert.equal(getGroupKeyFromData({ group: 0 }), 0);
  assert.equal(getGroupKeyFromData({}), null);
});
test('group assignment updates native membership and guards direct self assignment', () => {
  const diagram = new go.Diagram(); diagram.nodeTemplate = new go.Node(); diagram.groupTemplate = new go.Group();
  diagram.model = new go.GraphLinksModel([{ key: 'parent', isGroup: true }, { key: 'node', unknown: 'keep' }]);
  const node = diagram.findNodeForKey('node');
  setNodeGroup(diagram, node, 'parent');
  assert.equal(node.containingGroup, diagram.findNodeForKey('parent'));
  assert.equal(node.data.group, 'parent');
  setNodeGroup(diagram, node, 'node');
  assert.equal(node.data.group, 'parent');
  setNodeGroup(diagram, node, undefined);
  assert.equal(node.containingGroup, null);
  assert.equal(node.data.unknown, 'keep');
});
test('legacy fallback assignment and group promotion retain existing behavior', () => {
  const node = { data: { key: 'node', unknown: 'keep' } };
  setNodeGroup({}, node, 'parent');
  assert.equal(node.data.group, 'parent');
  ensureNodeIsGroup({}, node);
  assert.equal(node.data.isGroup, true); assert.equal(node.isSubGraphExpanded, true);
  node.isSubGraphExpanded = false;
  ensureNodeIsGroup({}, node);
  assert.equal(node.isSubGraphExpanded, false);
  setNodeGroup(null, null, null); ensureNodeIsGroup(null, null);
});
