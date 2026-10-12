import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { getPreservedRouting, sanitizeModifiedLinkDataForReact, reanchorManualLinkPoints, shiftManualLinkEndpointSegments } from '@mimris/modelling-editor/gojs';

test('routing enum and saved-string values preserve the first supported routing', () => {
  assert.equal(getPreservedRouting('unknown', go.Link.Orthogonal, 'Normal'), 'Orthogonal');
  assert.equal(getPreservedRouting(go.Link.AvoidsNodes), 'AvoidsNodes');
  assert.equal(getPreservedRouting(' Normal '), 'Normal');
  assert.equal(getPreservedRouting(null), 'Normal');
});

test('automatic routing points are excluded while explicit saved paths and unknown fields survive', () => {
  const points = [0, 0, 10, 0, 10, 20];
  const link = { key: 'saved', fromPort: 'named-port', toPort: null, routing: go.Link.Orthogonal, points, custom: 'keep' };
  const automatic = sanitizeModifiedLinkDataForReact(link);
  assert.equal('points' in automatic, false);
  assert.equal(link.points, points);
  assert.equal(automatic.fromPort, 'named-port');
  assert.equal(automatic.toPort, '');
  assert.equal(automatic.custom, 'keep');
  assert.equal(sanitizeModifiedLinkDataForReact({ ...link, __manualPath: true }).points, points);
  assert.equal(sanitizeModifiedLinkDataForReact({ ...link, routing: 'Normal' }).points, points);
});

test('joint endpoint movement translates the whole manual route without mutating saved points', () => {
  const points = [0, 0, 10, 0, 10, 20, 30, 20];
  assert.deepEqual(shiftManualLinkEndpointSegments(points, { moveFrom: { dx: 4, dy: 6 }, moveTo: { dx: 4, dy: 6 } }), [4, 6, 14, 6, 14, 26, 34, 26]);
  assert.deepEqual(shiftManualLinkEndpointSegments(points, { moveFrom: { dx: 4, dy: 6 } }), points);
  assert.deepEqual(points, [0, 0, 10, 0, 10, 20, 30, 20]);
  assert.equal(shiftManualLinkEndpointSegments([1, 2], {}), null);
});

test('endpoint reanchoring preserves orthogonal segment direction and untouched interior bends', () => {
  const points = [0, 0, 10, 0, 10, 20, 30, 20];
  const link = { fromNode: { port: {} }, toNode: { port: {} }, getLinkPointFromPoint(_node, _port, _current, _adjacent, from, output) { output.x = from ? 2 : 32; output.y = from ? 3 : 23; } };
  assert.deepEqual(reanchorManualLinkPoints(link, points), [2, 3, 10, 3, 10, 23, 32, 23]);
  assert.deepEqual(reanchorManualLinkPoints(link, points, { anchorFrom: false }), [0, 0, 10, 0, 10, 23, 32, 23]);
  assert.deepEqual(points, [0, 0, 10, 0, 10, 20, 30, 20]);
  assert.equal(reanchorManualLinkPoints(link, null), null);
});
