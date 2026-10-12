import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as go from 'gojs';

// Execute the production queue functions without mounting the application shell.
const source = readFileSync(new URL('../../packages/modelling-editor/src/components/ModellingCanvas.tsx', import.meta.url), 'utf8');
const parsed = ts.createSourceFile('GoJSApp.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = ['safeJsonCloneForDispatch', 'disposeQueuedViewDispatches', 'queueObjectViewDispatch', 'queueRelshipViewDispatch', 'flushQueuedDiagramDispatches'];
const queueSource = readFileSync(new URL('../../packages/modelling-editor/src/runtime/viewDispatch.ts', import.meta.url), 'utf8');
const queueParsed = ts.createSourceFile('viewDispatch.ts', queueSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const functions = queueParsed.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name?.text));
assert.equal(functions.length, names.length);
let editorClass;
function findEditor(node) { if (ts.isClassDeclaration(node) && node.members.some(member => member.name?.getText(parsed) === 'syncNodeNameToState')) editorClass = node; ts.forEachChild(node, findEditor); }
findEditor(parsed);
const syncMethod = editorClass.members.find(member => member.name?.getText(parsed) === 'syncNodeNameToState');
const syncCode = syncMethod.getText(parsed).replace('private syncNodeNameToState', 'function syncNodeNameToState');
const code = functions.map(node => node.getText(queueParsed).replace(/^export /, '')).join('\n') + '\n' + syncCode + '\nmodule.exports = { queueObjectViewDispatch, queueRelshipViewDispatch, disposeQueuedViewDispatches, syncNodeNameToState, flushQueuedDiagramDispatches };';
function setup() {
  const jobs = new Map(), errors = [], module = { exports: {} };
  let next = 0;
  vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, {
    module, setTimeout: fn => { const id = ++next; jobs.set(id, fn); return id; }, clearTimeout: id => jobs.delete(id),
    persistObjectViewDraft() {}, console: { error: (...args) => errors.push(args) },
  });
  return { ...module.exports, jobs, errors, flush: () => { for (const [id, fn] of [...jobs]) { jobs.delete(id); fn(); } } };
}
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
function instance() {
  return { state: { myMetis: { gojsModel: { nodes: [{ key: 'ov', objectview: {} }], links: [{ key: 'rv', relshipview: {} }] } } }, setState(value) { Object.assign(this.state, value); } };
}
test('coalesced view updates dispatch once and runtime arrays remain detached from frozen actions', () => {
  const queue = setup(), editor = instance(), actions = [];
  const model = new go.GraphLinksModel([{ key: 'ov', name: 'Old' }], [{ key: 'rv' }]);
  model.linkKeyProperty = 'key';
  const diagram = { model };
  const dispatch = action => { freeze(action); actions.push(action); };
  queue.queueObjectViewDispatch(editor, dispatch, { id: 'ov', modelviewId: 'mv', loc: '10 20' }, diagram);
  queue.queueObjectViewDispatch(editor, dispatch, { id: 'ov', modelviewId: 'mv', loc: '30 40', size: '80 40', name: 'Renamed', text: 'Renamed' }, diagram);
  queue.queueRelshipViewDispatch(editor, dispatch, { id: 'rv', points: [1, 2, 3, 4] }, diagram);
  queue.flush();
  assert.equal(actions.length, 2);
  assert.equal(actions[0].data.loc, '30 40');
  assert.equal(editor.state.myMetis.gojsModel.nodes[0].objectview.loc, '30 40');
  assert.equal(editor.state.myMetis.gojsModel.nodes[0].name, 'Renamed');
  assert.equal(editor.state.myMetis.gojsModel.nodes[0].objectview.name, 'Renamed');
  const link = editor.state.myMetis.gojsModel.links[0];
  assert.notEqual(link.points, actions[1].data.points);
  link.points[0] = 99;
  assert.equal(actions[1].data.points[0], 1);
  assert.equal(model.findNodeDataForKey('ov').name, 'Renamed');
  assert.equal(model.findNodeDataForKey('ov').loc, '30 40');
  assert.notEqual(model.findLinkDataForKey('rv').points, actions[1].data.points);
  assert.equal(queue.errors.length, 0);
});
test('teardown cancels only the owning editor queues and rejects new queued edits', () => {
  const queue = setup(), first = instance(), second = instance(), actions = [];
  queue.queueObjectViewDispatch(first, action => actions.push(action), { id: 'ov', loc: '1 2' });
  queue.queueRelshipViewDispatch(first, action => actions.push(action), { id: 'rv', points: [1, 2] });
  queue.queueObjectViewDispatch(second, action => actions.push(action), { id: 'ov', loc: '3 4' });
  queue.disposeQueuedViewDispatches(first);
  queue.queueObjectViewDispatch(first, action => actions.push(action), { id: 'ov', loc: '5 6' });
  queue.flush();
  assert.equal(actions.length, 1);
  assert.equal(actions[0].data.loc, '3 4');
  assert.equal(first.state.myMetis.gojsModel.nodes[0].loc, undefined);
  assert.equal(queue.jobs.size, 0);
});

test('completed rename updates the React node projection without replacing dragged geometry or unrelated nodes', () => {
  const queue = setup();
  const original = { key: 'ov', name: 'Old', loc: '400 200', size: '80 40', object: { id: 'o', name: 'Old' }, objectview: { id: 'ov', name: 'Old' } };
  const other = { key: 'other', name: 'Other' };
  const editor = { state: { nodeDataArray: [original, other], selectedData: original }, setState(update) { Object.assign(this.state, update(this.state)); } };
  queue.syncNodeNameToState.call(editor, { key: 'ov', object: { id: 'o' } }, 'Renamed');
  assert.equal(editor.state.nodeDataArray[0].name, 'Renamed');
  assert.equal(editor.state.nodeDataArray[0].objectview.name, 'Renamed');
  assert.equal(editor.state.nodeDataArray[0].loc, '400 200');
  assert.equal(editor.state.nodeDataArray[0].size, '80 40');
  assert.equal(editor.state.nodeDataArray[1], other);
  assert.equal(editor.state.selectedData.name, 'Renamed');
  assert.equal(editor.state.skipsDiagramUpdate, false);
  assert.equal(original.name, 'Old');
});

test('immediate transaction flush detaches action arrays and cancels deferred duplicates', () => {
  const queue = setup(), editor = instance(), actions = [];
  const points = [1, 2, 3, 4];
  const dispatch = action => { freeze(action); actions.push(action); };
  queue.queueObjectViewDispatch(editor, dispatch, { id: 'ov', loc: '10 20' });
  queue.queueRelshipViewDispatch(editor, dispatch, { id: 'rv', points });
  queue.flushQueuedDiagramDispatches(editor, dispatch);
  queue.flush();
  assert.equal(actions.length, 2);
  assert.equal(queue.jobs.size, 0);
  assert.notEqual(actions[1].data.points, points);
  points[0] = 99;
  assert.equal(actions[1].data.points[0], 1);
  assert.equal(queue.errors.length, 0);
});
