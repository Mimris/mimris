import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { resolveDeepestValidGroupAtPoint, resolveDeepestDropTargetGroup, getGroupBodyBounds, isPartVisuallyInsideGroup } from '@mimris/modelling-editor/gojs';

function host() {
  const diagram = new go.Diagram();
  diagram.nodeTemplate = new go.Node();
  diagram.groupTemplate = new go.Group().add(new go.Shape({ name: 'BODY' }));
  diagram.model = new go.GraphLinksModel([
    { key: 'outer', isGroup: true }, { key: 'inner', isGroup: true, group: 'outer' },
    { key: 'moving', isGroup: true }, { key: 'node' },
  ]);
  diagram.findNodeForKey('outer').findObject('BODY').getDocumentBounds = () => new go.Rect(0, 0, 200, 200);
  diagram.findNodeForKey('inner').findObject('BODY').getDocumentBounds = () => new go.Rect(20, 20, 50, 50);
  diagram.findNodeForKey('moving').findObject('BODY').getDocumentBounds = () => new go.Rect(0, 0, 1, 1);
  return diagram;
}

test('drop targeting chooses smallest containing body and excludes descendant cycle targets', () => {
  const diagram = host(), point = new go.Point(40, 40);
  assert.equal(resolveDeepestDropTargetGroup(diagram, diagram.findNodeForKey('node'), point), diagram.findNodeForKey('inner'));
  assert.equal(resolveDeepestValidGroupAtPoint(diagram, diagram.findNodeForKey('moving'), point), diagram.findNodeForKey('inner'));
  assert.equal(resolveDeepestValidGroupAtPoint(diagram, diagram.findNodeForKey('outer'), point), null);
  assert.equal(resolveDeepestDropTargetGroup(diagram, diagram.findNodeForKey('inner'), point), diagram.findNodeForKey('outer'));
  assert.equal(resolveDeepestDropTargetGroup(diagram, null, new go.Point(500, 500)), null);
});

test('body bounds retain named shape precedence and resize-object fallback', () => {
  const group = new go.Group().add(new go.Shape({ name: 'BODY' }), new go.Shape({ name: 'LANE_BODY_SHAPE' }), new go.Shape({ name: 'SHAPE' }));
  for (const [name, width] of [['BODY', 10], ['LANE_BODY_SHAPE', 20], ['SHAPE', 30]]) {
    group.findObject(name).getDocumentBounds = () => new go.Rect(0, 0, width, width);
  }
  assert.equal(getGroupBodyBounds(group).width, 30);
  const bare = new go.Group();
  bare.getDocumentBounds = () => new go.Rect(0, 0, 40, 40);
  assert.equal(getGroupBodyBounds(bare).width, 40);
  assert.equal(getGroupBodyBounds(new go.Node()), null);
});

test('visual containment retains full, center and 45 percent overlap policies', () => {
  const group = new go.Group().add(new go.Shape({ name: 'BODY' }));
  group.findObject('BODY').getDocumentBounds = () => new go.Rect(0, 0, 100, 100);
  const part = new go.Node();
  Object.defineProperty(part, 'actualBounds', { get: () => bounds });
  let bounds = new go.Rect(10, 10, 20, 20);
  assert.equal(isPartVisuallyInsideGroup(part, group), true);
  bounds = new go.Rect(-10, -10, 120, 120);
  assert.equal(isPartVisuallyInsideGroup(part, group), true);
  bounds = new go.Rect(55, 10, 100, 20);
  assert.equal(isPartVisuallyInsideGroup(part, group), true);
  bounds = new go.Rect(56, 10, 100, 20);
  assert.equal(isPartVisuallyInsideGroup(part, group), false);
  bounds = new go.Rect(200, 200, 10, 10);
  assert.equal(isPartVisuallyInsideGroup(part, group), false);
});

test('geometry queries stay within their host and tolerate missing context', () => {
  const first = host(), second = host(), point = new go.Point(40, 40);
  assert.notEqual(resolveDeepestDropTargetGroup(first, null, point), resolveDeepestDropTargetGroup(second, null, point));
  assert.equal(resolveDeepestDropTargetGroup(null, null, point), null);
  assert.equal(resolveDeepestValidGroupAtPoint(first, new go.Node(), point), null);
  assert.equal(isPartVisuallyInsideGroup(null, null), false);
});
