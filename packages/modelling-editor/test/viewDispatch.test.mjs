import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { bindEditorHost, safeJsonCloneForDispatch, queueObjectViewDispatch, queueRelshipViewDispatch, disposeQueuedViewDispatches, flushQueuedDiagramDispatches } from '@mimris/modelling-editor';

const settle = () => new Promise(resolve => setTimeout(resolve, 20));
const editor = () => ({ state: { myMetis: { gojsModel: { nodes: [{ key: 'ov', objectview: {} }], links: [{ key: 'rv', relshipview: {} }] } } }, setState(update) { Object.assign(this.state, update); } });

test('public dispatch clone detaches saved geometry and strips runtime objects and cycles', () => {
  const payload = { id: 'ov', points: [1, 2, 3, 4], unknown: { keep: true }, diagram: new go.Diagram(), callback() {} };
  payload.self = payload;
  const result = safeJsonCloneForDispatch(payload);
  assert.deepEqual(result, { id: 'ov', points: [1, 2, 3, 4], unknown: { keep: true } });
  assert.notEqual(result.points, payload.points);
  assert.notEqual(result.unknown, payload.unknown);
});

test('public queues coalesce edits and update host runtime and optional draft', async () => {
  const instance = editor(), actions = [], saves = [];
  const draft = { phData: { metis: { models: [{ modelviews: [{ id: 'mv', objectviews: [{ id: 'ov', unknown: 'keep' }] }] }] } } };
  const unbind = bindEditorHost(instance.state.myMetis, { getState: () => draft, dispatch() {}, persistence: { readDraft: () => structuredClone(draft), saveDraft: value => saves.push(value), saveCurrentDraftAfter() {} } });
  const model = new go.GraphLinksModel([{ key: 'ov' }], [{ key: 'rv' }]);
  model.linkKeyProperty = 'key';
  try {
    queueObjectViewDispatch(instance, action => actions.push(action), { id: 'ov', modelviewId: 'mv', loc: '1 2' }, { model });
    queueObjectViewDispatch(instance, action => actions.push(action), { id: 'ov', modelviewId: 'mv', loc: '3 4', name: 'Renamed' });
    queueRelshipViewDispatch(instance, action => actions.push(action), { id: 'rv', points: [1, 2, 3, 4] }, { model });
    await settle();
    assert.equal(actions.length, 2);
    assert.equal(actions[0].data.loc, '3 4');
    assert.equal(model.findNodeDataForKey('ov').name, 'Renamed');
    assert.equal(instance.state.myMetis.gojsModel.nodes[0].objectview.loc, '3 4');
    assert.notEqual(instance.state.myMetis.gojsModel.links[0].points, actions[1].data.points);
    assert.equal(saves.length, 1);
    assert.equal(saves[0].phData.metis.models[0].modelviews[0].objectviews[0].unknown, 'keep');
  } finally { disposeQueuedViewDispatches(instance); unbind(); }
});

test('public teardown cancels one host without canceling another and prevents later edits', async () => {
  const first = editor(), second = editor(), actions = [];
  queueObjectViewDispatch(first, action => actions.push(action), { id: 'ov', loc: '1 2' });
  queueRelshipViewDispatch(first, action => actions.push(action), { id: 'rv', points: [1, 2] });
  queueObjectViewDispatch(second, action => actions.push(action), { id: 'ov', loc: '3 4' });
  disposeQueuedViewDispatches(first);
  queueObjectViewDispatch(first, action => actions.push(action), { id: 'ov', loc: '5 6' });
  await settle();
  assert.equal(actions.length, 1);
  assert.equal(actions[0].data.loc, '3 4');
  assert.equal(first.state.myMetis.gojsModel.nodes[0].loc, undefined);
  disposeQueuedViewDispatches(second);
});

test('public immediate flush cancels duplicate callbacks and separates equal view IDs by modelview', async () => {
  const instance = editor(), actions = [], dispatch = action => actions.push(action);
  queueObjectViewDispatch(instance, dispatch, { id: 'ov', modelviewId: 'a', loc: '1 2' });
  queueObjectViewDispatch(instance, dispatch, { id: 'ov', modelviewId: 'b', loc: '3 4' });
  const points = [1, 2, 3, 4];
  queueRelshipViewDispatch(instance, dispatch, { id: 'rv', points });
  flushQueuedDiagramDispatches(instance, dispatch);
  points[0] = 99;
  await settle();
  assert.equal(actions.length, 3);
  assert.deepEqual(actions.slice(0, 2).map(action => action.data.modelviewId), ['a', 'b']);
  assert.equal(actions[2].data.points[0], 1);
  disposeQueuedViewDispatches(instance);
});
