import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as go from 'gojs';
function load(name) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../../packages/modelling-editor/src/runtime/${name}.ts`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, exports: module.exports });
  return module.exports;
}
const { getDragProtection, clearDragProtection } = load('dragProtection');
const { reconcileLiveNode, getEditedObjectViews } = load('reconcileNode');
test('drag protection is independent for diagrams with identical IDs and teardown clears retained references', () => {
  const first = {}, second = {};
  const a = getDragProtection(first), b = getDragProtection(second);
  a.preserve.set('same-id', 100);
  a.locations.set('same-id', { loc: '10 20', until: 100 });
  assert.equal(getDragProtection(first), a);
  assert.equal(first.__preserveIncomingNodeStateByKey, a.preserve);
  assert.equal(b.preserve.size, 0);
  b.locations.set('same-id', { loc: '30 40', until: 200 });
  clearDragProtection(first);
  assert.equal(a.preserve.size, 0);
  assert.equal(a.locations.size, 0);
  assert.equal(b.locations.get('same-id').loc, '30 40');
  assert.notEqual(getDragProtection(first), a);
});
test('live label reconciliation updates a stale diagram while preserving dragged geometry and blank-name defaults', () => {
  const model = new go.GraphLinksModel([{ key: 'ov', name: 'Old', text: 'Old', loc: '400 200', size: '80 40', object: { id: 'o', name: 'Old' } }]);
  const diagram = new go.Diagram();
  diagram.nodeTemplate = new go.Node().add(new go.TextBlock().bind('text', 'name'));
  diagram.model = model;
  const incoming = Object.freeze({ key: 'ov', name: 'Renamed', text: 'Renamed', loc: '0 0', size: '20 20', object: Object.freeze({ id: 'o', name: 'Renamed' }) });
  model.commit(m => reconcileLiveNode(m, incoming), 'reconcile');
  const live = model.findNodeDataForKey('ov');
  assert.equal(live.name, 'Renamed');
  assert.equal(diagram.findNodeForKey('ov').elt(0).text, 'Renamed');
  assert.equal(live.object.name, 'Renamed');
  assert.equal(live.loc, '400 200');
  assert.equal(live.size, '80 40');
  model.commit(m => reconcileLiveNode(m, { key: 'ov', name: '', text: '', object: { name: '' } }), 'stale blank');
  assert.equal(live.name, 'Renamed');
  assert.equal(live.text, 'Renamed');
  assert.equal(live.object.name, 'Renamed');
});

test('rename includes the current view when importer reverse indexes are empty or stale', () => {
  const edited = { id: 'ov', name: 'Current' }, duplicate = { id: 'ov', name: 'Stale' }, other = { id: 'other' };
  assert.equal(getEditedObjectViews({ objectviews: [] }, edited)[0], edited);
  const views = getEditedObjectViews({ objectviews: [duplicate, other] }, edited);
  assert.equal(views.length, 2);
  assert.equal(views[0], edited);
  assert.equal(views[1], other);
});
