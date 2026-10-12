import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { centerNodeInGroup, parseSizeString, getPersistedGroupSize } from '@mimris/modelling-editor/gojs';
test('saved size parsing retains separators, extra tokens and absent-value behavior', () => {
  assert.deepEqual(parseSizeString('100, 200'), { width: 100, height: 200 });
  assert.deepEqual(parseSizeString('100 invalid 200 300'), { width: 100, height: 200 });
  assert.equal(parseSizeString('100'), null);
  assert.equal(parseSizeString(null), null);
});
test('group size precedence retains lane/pool saved geometry over rendered dimensions', () => {
  const part = { data: { size: '50 60' }, resizeObject: { desiredSize: { width: 100, height: 200 }, actualBounds: { width: 300, height: 400 } } };
  assert.equal(getPersistedGroupSize(part), '100 200');
  part.resizeObject.desiredSize.width = NaN;
  assert.equal(getPersistedGroupSize(part), '300 400');
  for (const category of ['Lane', 'Lane_w_handles', 'Pool']) {
    part.data.category = category;
    assert.equal(getPersistedGroupSize(part), '50 60');
  }
  assert.equal(getPersistedGroupSize(null), '');
});
test('centering preserves saved size unless filling parent, with detached host geometry', () => {
  const diagram = new go.Diagram(); diagram.nodeTemplate = new go.Node(); diagram.groupTemplate = new go.Group();
  diagram.model = new go.GraphLinksModel([{ key: 'parent', isGroup: true }, { key: 'node', size: '80 40', fillcolor: '#ffffff', unknown: 'keep' }]);
  const parent = diagram.findNodeForKey('parent'), node = diagram.findNodeForKey('node');
  Object.defineProperty(parent, 'actualBounds', { get: () => new go.Rect(10, 20, 400, 300) });
  centerNodeInGroup(diagram, node, 'parent', { offset: { x: 5, y: -5 } });
  assert.equal(node.data.loc, '215 165');
  assert.equal(node.data.size, '80 40');
  assert.equal(node.data.fillcolor, '#ffffff');
  assert.equal(node.data.unknown, 'keep');
  centerNodeInGroup(diagram, node, 'parent', { fillParent: true, padding: 10 });
  assert.equal(node.data.size, '380 280');
  assert.equal(node.resizeObject.desiredSize.width, 380);
  centerNodeInGroup(diagram, node, 'missing');
  assert.equal(node.data.size, '380 280');
});
