import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { resizeGroupToHalfParent, syncLiveGroupExpandedState, getGroupMemberLocSnapshots } from '@mimris/modelling-editor/gojs';
function host() {
  const diagram = new go.Diagram(); diagram.nodeTemplate = new go.Node(); diagram.groupTemplate = new go.Group();
  diagram.model = new go.GraphLinksModel([{ key: 'parent', isGroup: true, size: '400 200' }, { key: 'group', isGroup: true, objectview: { id: 'group' } }, { key: 'node', group: 'group', loc: '40 50', objectview: { id: 'node', unknown: 'keep' } }]);
  return diagram;
}
test('parent-relative size fills missing dimensions while preserving saved child sizes', () => {
  const diagram = host(), group = diagram.findNodeForKey('group');
  resizeGroupToHalfParent(diagram, group.data, group, diagram.findNodeForKey('parent'));
  assert.equal(group.data.size, '140 70'); assert.equal(group.data.objectview.size, '140 70');
  group.data.size = '80 90';
  resizeGroupToHalfParent(diagram, group.data, group, diagram.findNodeForKey('parent'));
  assert.equal(group.data.size, '80 90');
});
test('collapse and expansion retain member position snapshots and runtime flags within the host', () => {
  const diagram = host(), other = host(), group = diagram.findNodeForKey('group'), node = diagram.findNodeForKey('node');
  syncLiveGroupExpandedState(diagram, group, false);
  assert.equal(group.data.isExpanded, false); assert.equal(node.visible, false);
  assert.equal(getGroupMemberLocSnapshots(other).size, 0);
  node.data.loc = '100 200'; node.location = new go.Point(100, 200);
  syncLiveGroupExpandedState(diagram, group, true);
  assert.equal(node.visible, true); assert.equal(node.data.loc, '40 50');
  assert.equal(node.data.objectview.loc, '40 50'); assert.equal(node.data.objectview.unknown, 'keep');
  assert.equal(group.data.objectview.isExpanded, true);
});
