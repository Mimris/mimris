import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLinkPoints, normalizeLinkPortData, pickBestLinkPoints, pickFirstNonEmptyLinkPoints, hasExplicitSavedLinkPath } from '@mimris/modelling-editor';

function iterable(values) {
  return { get iterator() { let index = -1; return { next() { return ++index < values.length; }, get value() { return values[index]; } }; } };
}

test('link point conversion preserves saved arrays and flattens mutable runtime iterators', () => {
  const saved = [10, 20, 30, 40];
  assert.equal(normalizeLinkPoints(saved), saved);
  assert.deepEqual(normalizeLinkPoints(iterable([{ x: 10, y: 20 }, { x: 30, y: 40 }])), saved);
  assert.deepEqual(normalizeLinkPoints(iterable(saved)), saved);
  assert.deepEqual(normalizeLinkPoints(iterable([])), []);
  assert.equal(normalizeLinkPoints(undefined), undefined);
});

test('link path selection retains longest versus first-saved path policies', () => {
  const short = [1, 2, 3, 4], long = [1, 2, 3, 4, 5, 6];
  assert.equal(pickBestLinkPoints(short, long), long);
  assert.equal(pickFirstNonEmptyLinkPoints(undefined, short, long), short);
  assert.equal(hasExplicitSavedLinkPath(undefined, [1, 2]), false);
  assert.equal(hasExplicitSavedLinkPath(iterable([{ x: 1, y: 2 }, { x: 3, y: 4 }])), true);
});

test('link normalization preserves identifiers, unknown fields and valid ports while detaching changed records', () => {
  const unknown = { version: 'legacy' };
  const link = { key: 'saved-link', from: 'a', to: 'b', fromPort: 'source-id', toPort: null, points: iterable([{ x: 1, y: 2 }, { x: 3, y: 4 }]), routing: 'Normal', unknown, visible: null };
  const result = normalizeLinkPortData([link])[0];
  assert.notEqual(result, link);
  assert.equal(result.fromPort, 'source-id');
  assert.equal(result.toPort, '');
  assert.equal(link.toPort, null);
  assert.equal(result.unknown, unknown);
  assert.equal(result.key, 'saved-link');
  assert.equal(result.routing, 'Normal');
  assert.deepEqual(result.points, [1, 2, 3, 4]);
  assert.equal(link.visible, false);
  assert.equal(normalizeLinkPortData([result])[0], result);
  assert.deepEqual(normalizeLinkPortData([null, 'opaque']), [null, 'opaque']);
});
