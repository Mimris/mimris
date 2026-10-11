import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { isAncestorGroupKey, clearPartGroupState, detachPartToTopLevel, attachPartToGroup } from '@mimris/modelling-editor/gojs';
function host() {
  const diagram = new go.Diagram();
  diagram.nodeTemplate = new go.Node();
  diagram.groupTemplate = new go.Group();
  diagram.model = new go.GraphLinksModel([{ key: 'outer', isGroup: true }, { key: 'inner', isGroup: true, group: 'outer' }, { key: 'node', group: 'inner', unknown: 'keep' }]);
  diagram.findNodeForKey('node').location = new go.Point(40, 50);
  return diagram;
}
test('detaching clears runtime/model membership while retaining saved geometry and fields', () => {
  const diagram = host(), node = diagram.findNodeForKey('node'), other = host();
  detachPartToTopLevel(diagram, node, node.data);
  assert.equal(node.containingGroup, null);
  assert.equal(node.data.group, '');
  assert.equal(node.data.loc, '40 50');
  assert.equal(node.location.x, 40);
  assert.equal(node.data.unknown, 'keep');
  assert.equal(other.findNodeForKey('node').data.group, 'inner');
});
test('reattaching synchronizes new parent and model membership without losing location', () => {
  const diagram = host(), node = diagram.findNodeForKey('node'), parent = diagram.findNodeForKey('outer');
  assert.equal(attachPartToGroup(diagram, node, parent, node.data), true);
  assert.equal(node.containingGroup, parent);
  assert.equal(node.data.group, 'outer');
  assert.equal(node.location.y, 50);
  assert.equal(node.data.unknown, 'keep');
});
test('ancestor lookup uses host hierarchy and clear membership tolerates missing contexts', () => {
  const diagram = host();
  assert.equal(isAncestorGroupKey(diagram, 'outer', 'node'), true);
  assert.equal(isAncestorGroupKey(diagram, 'inner', 'node'), true);
  assert.equal(isAncestorGroupKey(diagram, 'node', 'outer'), false);
  assert.equal(isAncestorGroupKey(diagram, 'outer', 'outer'), false);
  assert.equal(isAncestorGroupKey(null, 'outer', 'node'), false);
  clearPartGroupState(diagram, diagram.findNodeForKey('node'));
  assert.equal(diagram.findNodeForKey('node').containingGroup, null);
  clearPartGroupState(null, null);
  assert.equal(attachPartToGroup(null, null, null), false);
});
test('rejected membership reports failure after retained detach-first policy', () => {
  const diagram = host(), node = diagram.findNodeForKey('node'), parent = diagram.findNodeForKey('outer');
  parent.addMembers = () => false;
  assert.equal(attachPartToGroup(diagram, node, parent, node.data), false);
  assert.equal(node.containingGroup, null);
  assert.equal(node.data.group, '');
});
