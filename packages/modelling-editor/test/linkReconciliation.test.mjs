import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeIncomingLinkDataWithLocalState as merge } from '@mimris/modelling-editor';

test('background link updates preserve local manual routes and incoming unknown fields without mutation', () => {
  const points = [0, 0, 20, 30];
  const view = { id: 'saved-view', custom: 'keep' };
  const local = { key: 'link', __manualPath: true, points, routing: 'Orthogonal', relshipview: view };
  const incoming = { key: 'link', points: [], routing: 'Normal', unknown: 'keep' };
  const result = merge([incoming], [local])[0];
  assert.deepEqual(result, { ...incoming, points, routing: 'Orthogonal', relshipview: view });
  assert.equal(result.points, points);
  assert.equal(result.relshipview, view);
  assert.deepEqual(incoming.points, []);
});

test('an incoming explicit manual route wins and automatic local routes do not override updates', () => {
  const incoming = { key: 'link', __manualPath: true, points: [1, 2, 3, 4] };
  const local = { key: 'link', __manualPath: true, points: [5, 6, 7, 8] };
  assert.equal(merge([incoming], [local])[0], incoming);
  const automatic = { key: 'link', points: [10, 20, 30, 40] };
  assert.equal(merge([incoming], [automatic])[0], incoming);
  assert.equal(merge([incoming], [{ ...local, key: 'other' }])[0], incoming);
});

test('manual flags with absent, malformed or short points do not crash or replace a valid route', () => {
  const valid = { key: 'link', __manualPath: true, points: [0, 0, 20, 30] };
  for (const points of [undefined, null, {}, 'path', [1, 2]]) {
    const malformed = { key: 'link', __manualPath: true, points };
    assert.equal(merge([malformed], [valid])[0].points, valid.points);
    assert.equal(merge([valid], [malformed])[0], valid);
    assert.equal(merge([malformed], [malformed])[0], malformed);
  }
});

test('iterator routes normalize and missing local metadata retains incoming values', () => {
  const iterator = () => {
    let index = -1;
    const values = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
    return { next() { index++; return index < values.length; }, get value() { return values[index]; } };
  };
  const incoming = { key: 'link', routing: 'Normal', relshipview: { id: 'incoming' } };
  const local = { key: 'link', __manualPath: true, points: { get iterator() { return iterator(); } } };
  assert.deepEqual(merge([incoming], [local])[0], { ...incoming, points: [1, 2, 3, 4] });
  assert.equal(merge(undefined, []), undefined);
  assert.deepEqual(merge([null, {}], undefined), [null, {}]);
});
