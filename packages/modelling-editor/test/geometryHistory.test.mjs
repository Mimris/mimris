import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { installGeometryHistory } from '@mimris/modelling-editor/gojs';
import { getDragProtection } from '@mimris/modelling-editor';

test('undo and redo restore geometry and notify persistence after releasing move locks', () => {
  const diagram = new go.Diagram();
  diagram.model = new go.GraphLinksModel([{ key: 'container', isGroup: true, loc: '10 20', size: '100 80', unknown: 'keep' }]);
  const persisted = [], order = [];
  const dispose = installGeometryHistory(diagram, () => order.push('flush'), () => { order.push('persist'); persisted.push({ ...diagram.model.nodeDataArray[0] }); });
  const data = diagram.model.nodeDataArray[0];
  diagram.model.commit(m => { m.set(data, 'loc', '30 40'); m.set(data, 'size', '120 90'); }, 'Resizing');
  assert.equal(diagram.commandHandler.canUndo(), true);
  getDragProtection(diagram).locations.set('container', { loc: '30 40', until: Date.now() + 12000 });
  diagram.commandHandler.undo();
  assert.equal(data.loc, '10 20'); assert.equal(data.size, '100 80');
  assert.equal(getDragProtection(diagram).locations.size, 0);
  assert.equal(diagram.commandHandler.canRedo(), true);
  diagram.commandHandler.redo();
  assert.equal(data.loc, '30 40'); assert.equal(data.size, '120 90');
  assert.equal(data.unknown, 'keep');
  assert.deepEqual(order, ['flush', 'persist', 'flush', 'persist']);
  assert.deepEqual(persisted.map(p => p.loc), ['10 20', '30 40']);
  dispose();
});

test('semantic insertion, deletion and rename cannot be partially undone through geometry history', () => {
  for (const edit of [
    m => m.addNodeData({ key: 'new' }),
    m => m.removeNodeData(m.nodeDataArray[0]),
    m => m.set(m.nodeDataArray[0], 'name', 'Changed'),
  ]) {
    const diagram = new go.Diagram();
    diagram.model = new go.GraphLinksModel([{ key: 'one', name: 'Original' }]);
    installGeometryHistory(diagram, () => assert.fail('unsupported history'), () => assert.fail('unsupported history'));
    diagram.model.commit(edit, 'semantic edit');
    assert.equal(diagram.commandHandler.canUndo(), false);
    diagram.commandHandler.undo();
  }
});

test('geometry history handles cyclic runtime references without enabling GoJS serialization', () => {
  const runtime = {}; runtime.self = runtime;
  const diagram = new go.Diagram();
  diagram.model = new go.GraphLinksModel([{ key: 'one', loc: '0 0', object: runtime }]);
  installGeometryHistory(diagram, () => {}, () => {});
  diagram.model.commit(m => m.set(m.nodeDataArray[0], 'loc', '20 30'), 'Dragging');
  diagram.commandHandler.undo();
  assert.equal(diagram.model.nodeDataArray[0].loc, '0 0');
  assert.equal(diagram.undoManager.isEnabled, false);
  assert.equal(diagram.model.nodeDataArray[0].object, runtime);
});

test('native GoJS point lists are normalized into detached bend coordinates', () => {
  const points = new go.List().add(new go.Point(1, 2)).add(new go.Point(3, 4));
  const diagram = new go.Diagram();
  diagram.model = new go.GraphLinksModel([{ key: 'one', loc: '0 0' }], [{ key: 'link', from: 'one', to: 'one', points }]);
  diagram.model.linkKeyProperty = 'key';
  installGeometryHistory(diagram, () => {}, () => {});
  diagram.model.commit(m => m.set(m.linkDataArray[0], 'points', [5, 6, 7, 8]), 'Reshaping');
  diagram.commandHandler.undo();
  assert.deepEqual(diagram.model.linkDataArray[0].points, [1, 2, 3, 4]);
});

test('background geometry synchronization adds no extra undo step and unrelated fields are not rebound', () => {
  const diagram = new go.Diagram();
  diagram.model = new go.GraphLinksModel([{ key: 'one', loc: '0 0', size: '100 80', unknown: 'keep' }]);
  installGeometryHistory(diagram, () => {}, () => {});
  diagram.model.commit(m => m.set(m.nodeDataArray[0], 'loc', '20 30'), 'Dragging');
  diagram.model.commit(m => m.set(m.nodeDataArray[0], 'isFocusPeer', true), 'focus highlight');
  const writes = [], original = diagram.model.set.bind(diagram.model);
  diagram.model.set = (data, field, value) => { writes.push(field); return original(data, field, value); };
  diagram.commandHandler.undo();
  assert.deepEqual(writes, ['loc']);
  assert.equal(diagram.commandHandler.canUndo(), false);
  assert.equal(diagram.commandHandler.canRedo(), true);
  assert.equal(diagram.model.nodeDataArray[0].size, '100 80');
});

test('geometry history persists undo and redo into the host RTK store', async () => {
  const { configureStore } = await import('@reduxjs/toolkit');
  const { universeReducer, openLegacyUniverseSnapshot, bindLegacyUniverseDispatch, selectMimrisCompatibilityProps } = await import('@mimris/modelling-core');
  const store = configureStore({ reducer: { universe: universeReducer } });
  store.dispatch(openLegacyUniverseSnapshot({ phData: { metis: { models: [{ id: 'm', objects: [], relships: [], modelviews: [{ id: 'mv', objectviews: [{ id: 'one', loc: '0 0', size: '100 80', unknown: 'keep' }], relshipviews: [] }] }], metamodels: [] } }, phFocus: { focusModel: { id: 'm' }, focusModelview: { id: 'mv' } } }));
  const dispatch = bindLegacyUniverseDispatch(store.dispatch);
  const diagram = new go.Diagram();
  diagram.model = new go.GraphLinksModel([{ key: 'one', loc: '0 0', size: '100 80' }]);
  installGeometryHistory(diagram, () => {}, () => {
    const { loc, size } = diagram.model.nodeDataArray[0];
    dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: { id: 'one', modelviewId: 'mv', loc, size } });
  });
  diagram.model.commit(m => { m.set(m.nodeDataArray[0], 'loc', '20 30'); m.set(m.nodeDataArray[0], 'size', '120 90'); }, 'Resizing');
  diagram.commandHandler.undo();
  const saved = () => selectMimrisCompatibilityProps(store.getState()).phData.metis.models[0].modelviews[0].objectviews[0];
  assert.equal(saved().loc, '0 0'); assert.equal(saved().size, '100 80');
  diagram.commandHandler.redo();
  assert.equal(saved().loc, '20 30'); assert.equal(saved().size, '120 90');
  assert.equal(saved().unknown, 'keep');
});

test('a complete resize gesture including final size adjustment produces one undo step', () => {
  const diagram = new go.Diagram();
  diagram.model = new go.GraphLinksModel([{ key: 'one', loc: '0 0', size: '100 80' }]);
  const tool = diagram.toolManager.resizingTool;
  tool.doActivate = () => { tool.isActive = true; };
  tool.doDeactivate = () => { diagram.model.commit(m => m.set(m.nodeDataArray[0], 'size', '121 91'), 'final resize dimensions'); tool.isActive = false; };
  let notifications = 0;
  const dispose = installGeometryHistory(diagram, () => {}, () => {}, () => notifications++);
  tool.doActivate();
  diagram.model.commit(m => { m.set(m.nodeDataArray[0], 'loc', '-20 -10'); m.set(m.nodeDataArray[0], 'size', '120 90'); }, 'Resizing');
  tool.doDeactivate();
  assert.equal(diagram.commandHandler.canUndo(), true);
  diagram.commandHandler.undo();
  assert.equal(diagram.model.nodeDataArray[0].size, '100 80');
  assert.equal(diagram.model.nodeDataArray[0].loc, '0 0');
  assert.equal(diagram.commandHandler.canUndo(), false);
  diagram.commandHandler.redo();
  assert.equal(diagram.model.nodeDataArray[0].size, '121 91');
  assert.ok(notifications > 0);
  dispose();
});

test('history persistence converts native bend points into a serializable payload', async () => {
  const { plainHistoryLinkPoints } = await import('@mimris/modelling-editor/gojs');
  const points = new go.List().add(new go.Point(10, 20)).add(new go.Point(30, 40));
  const payload = { id: 'link-view', points: plainHistoryLinkPoints(points) };
  assert.deepEqual(JSON.parse(JSON.stringify(payload)), { id: 'link-view', points: [10, 20, 30, 40] });
  assert.equal(plainHistoryLinkPoints(undefined), undefined);
});
