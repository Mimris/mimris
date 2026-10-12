import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { applyNestedGroupHalfSize, isGroupLikeNode, NESTED_GROUP_SIZE_RATIO } from '@mimris/modelling-editor/gojs';

function host(size = '400 200') {
  const diagram = new go.Diagram();
  diagram.nodeTemplate = new go.Node();
  diagram.groupTemplate = new go.Group();
  diagram.model = new go.GraphLinksModel([
    { key: 'parent', isGroup: true, size },
    { key: 'child', isGroup: true, objectview: { id: 'child', unknown: 'keep' } },
    { key: 'ordinary' },
  ]);
  return diagram;
}

test('nested groups retain the existing 35 percent size and synchronize runtime projections', () => {
  const diagram = host(), other = host();
  const child = diagram.findNodeForKey('child');
  const view = { id: 'child', unknown: 'keep' }, runtime = { objectview: { id: 'child' } };
  applyNestedGroupHalfSize(diagram, child, diagram.findNodeForKey('parent'), view, runtime);
  assert.equal(NESTED_GROUP_SIZE_RATIO, 0.35);
  assert.equal(child.data.size, '140 70');
  assert.equal(child.data.desiredSize, '140 70');
  assert.equal(view.size, '140 70');
  assert.equal(runtime.size, '140 70');
  assert.equal(runtime.objectview.size, '140 70');
  assert.equal(child.resizeObject.desiredSize.width, 140);
  assert.equal(child.data.objectview.unknown, 'keep');
  assert.equal(other.findNodeForKey('child').data.size, undefined);
});

test('implicit objectview sizing clamps small groups and ignores invalid parent dimensions', () => {
  const diagram = host('1 2'), child = diagram.findNodeForKey('child'), parent = diagram.findNodeForKey('parent');
  applyNestedGroupHalfSize(diagram, child, parent);
  assert.equal(child.data.objectview.size, '1 1');
  for (const size of ['0 20', '20 0', 'invalid']) {
    parent.data.size = size;
    applyNestedGroupHalfSize(diagram, child, parent);
    assert.equal(child.data.size, '1 1');
  }
  assert.equal(child.data.objectview.id, 'child');
});

test('group recognition preserves native, persisted and template-based cases', () => {
  assert.equal(isGroupLikeNode(new go.Group()), true);
  for (const data of [{ isGroup: true }, { objectview: { isGroup: true } }, { template: 'groupWithMembers' }, { category: 'groupPanel' }]) {
    assert.equal(isGroupLikeNode(new go.Node(), data), true);
  }
  assert.equal(isGroupLikeNode(new go.Node(), { template: 'ordinary' }), false);
  assert.equal(isGroupLikeNode(null), false);
});

test('ordinary nodes and missing contexts remain unchanged', () => {
  const diagram = host(), node = diagram.findNodeForKey('ordinary');
  applyNestedGroupHalfSize(diagram, node, diagram.findNodeForKey('parent'));
  assert.equal(node.data.size, undefined);
  applyNestedGroupHalfSize(null, null, null);
});
