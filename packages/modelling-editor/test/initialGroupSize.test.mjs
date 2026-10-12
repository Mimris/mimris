import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { ensureInitialGroupSize, refreshGroupPartRendering } from '@mimris/modelling-editor/gojs';
test('initial sizing uses viewport minimums and fallback dimensions without changing unknown fields', () => {
  const data = { id: 'group', unknown: 'keep' };
  ensureInitialGroupSize({ viewportBounds: new go.Rect(0, 0, 1000, 500) }, null, data);
  assert.equal(data.size, '720 360');
  assert.equal(data.desiredSize, '720 360');
  assert.equal(data.unknown, 'keep');
  const fallback = {};
  ensureInitialGroupSize(null, null, fallback);
  assert.equal(fallback.size, '480 320');
});
test('valid saved sizes survive and preferred dimensions retain existing clamp policy', () => {
  const saved = { size: '800 600' };
  ensureInitialGroupSize(null, null, saved);
  assert.deepEqual(saved, { size: '800 600' });
  ensureInitialGroupSize(null, null, saved, { minWidth: 100, minHeight: 100, preferredWidth: 400, preferredHeight: 200 });
  assert.equal(saved.size, '400 200');
  ensureInitialGroupSize(null, null, null);
});
test('native group sizing updates model data and resize object with guarded refresh', () => {
  const diagram = new go.Diagram(); diagram.groupTemplate = new go.Group();
  diagram.model = new go.GraphLinksModel([{ key: 'group', isGroup: true, size: '10 20' }]);
  const group = diagram.findNodeForKey('group');
  ensureInitialGroupSize(diagram, group, group.data, { minWidth: 300, minHeight: 200, preferredWidth: 300, preferredHeight: 200 });
  assert.equal(group.data.size, '300 200');
  assert.equal(group.data.desiredSize, '300 200');
  assert.equal(group.resizeObject.desiredSize.width, 300);
  refreshGroupPartRendering(diagram, group);
  refreshGroupPartRendering(null, null);
});
