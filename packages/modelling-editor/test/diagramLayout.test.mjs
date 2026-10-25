import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { applyDiagramLayout } from '@mimris/modelling-editor/gojs';

function fixture() {
  const diagram = new go.Diagram();
  const points = [0, 0, 30, 0, 30, 50, 100, 50];
  const data = { from: 1, to: 2, points: [...points], relshipview: { points: [...points], unknown: 'keep' } };
  diagram.model = new go.GraphLinksModel([{ key: 1 }, { key: 2 }], [data]);
  let layoutCalls = 0;
  diagram.layoutDiagram = () => { layoutCalls++; };
  return { diagram, data, points, calls: () => layoutCalls };
}

test('Manual and unsupported layout names preserve authored model and runtime routes', () => {
  for (const name of ['Manual', undefined, null, '', 'GridLayout', 'unknown']) {
    const { diagram, data, points, calls } = fixture();
    const previousLayout = diagram.layout;
    assert.equal(applyDiagramLayout(diagram, name), false);
    assert.equal(diagram.layout, previousLayout);
    assert.deepEqual(data.points, points);
    assert.deepEqual(data.relshipview.points, points);
    assert.equal(calls(), 0);
  }
});

test('recognized automatic layouts clear both route representations and run once', () => {
  for (const name of ['Circular', 'Grid', 'Tree', 'ForceDirected', 'LayeredDigraph']) {
    const { diagram, data, calls } = fixture();
    assert.equal(applyDiagramLayout(diagram, name), true);
    assert.deepEqual(data.points, []);
    assert.deepEqual(data.relshipview.points, []);
    assert.equal(data.relshipview.unknown, 'keep');
    assert.equal(diagram.layout.isInitial, false);
    assert.equal(diagram.layout.isOngoing, false);
    assert.equal(calls(), 1);
    assert.equal(diagram.undoManager.isInTransaction, false);
  }
});
