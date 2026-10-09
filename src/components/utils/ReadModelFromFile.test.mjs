import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const loadTs = (path, dependencies = {}, extra = {}) => {
  const module = { exports: {} };
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    module, exports: module.exports,
    require: name => name in dependencies ? dependencies[name] : require(name),
    ...extra,
  });
  return module.exports;
};
const selectors = loadTs('../../sharedUniverse/selectors.ts');
const readers = [];
class Reader {
  constructor() { readers.push(this); }
  readAsText() {}
}
const slice = loadTs('../../sharedUniverse/universeSlice.ts', { '../akmm/viewAppearance': loadTs('../../akmm/viewAppearance.ts'), './diagramPreferences': loadTs('../../sharedUniverse/diagramPreferences.ts') });
const { ReadMetamodelFromFile, ReadModelFromFile } = loadTs('./ReadModelFromFile.ts', {
  '../../reducers/reducer': { InitialState: {} },
  '../../actions/actions': {}, './SvgLetters': {}, './workspaceUniverseAdapter': { isWorkspaceUniverseSnapshot: () => false },
  '../../editorHost/access': { getEditorHost: () => undefined },
  '../../sharedUniverse': { ...slice, ...selectors },
}, { FileReader: Reader, console: { log() {} } });
const event = () => ({ preventDefault() {}, target: { files: [{}] } });
const state = name => ({
  phData: { metis: { models: [{ id: name }], metamodels: [{ id: 'existing', name }] } },
});

test('delayed metamodel imports read the supplied host state and dispatch to that host only', async () => {
  let a = state('A'), b = state('B');
  const actionsA = [], actionsB = [];
  const hostA = { getState: () => a, dispatch: action => actionsA.push(action) };
  const hostB = { getState: () => b, dispatch: action => actionsB.push(action) };
  await ReadMetamodelFromFile(state('stale A'), hostA.dispatch, event(), hostA);
  await ReadMetamodelFromFile(state('stale B'), hostB.dispatch, event(), hostB);
  a = state('fresh A');
  await readers[0].onload({ target: { result: JSON.stringify({ id: 'imported-A' }) } });
  await readers[1].onload({ target: { result: JSON.stringify({ id: 'imported-B' }) } });
  assert.equal(actionsA.length, 1);
  assert.equal(actionsB.length, 1);
  assert.equal(actionsA[0].payload.metis.models[0].id, 'fresh A');
  assert.equal(actionsB[0].payload.metis.models[0].id, 'B');
  assert.equal(actionsA[0].payload.metis.metamodels[1].id, 'imported-A');
  assert.equal(actionsB[0].payload.metis.metamodels[1].id, 'imported-B');
  assert.equal(a.phData.metis.metamodels.length, 1);
  assert.equal(b.phData.metis.metamodels.length, 1);
});

test('unbound legacy file callers use their supplied props without an application singleton', async () => {
  const actions = [];
  const props = state('props only');
  await ReadMetamodelFromFile(props, action => actions.push(action), event());
  await readers.at(-1).onload({ target: { result: JSON.stringify({ id: 'existing', name: 'replacement' }) } });
  assert.equal(actions[0].payload.metis.models[0].id, 'props only');
  assert.equal(actions[0].payload.metis.metamodels[0].name, 'replacement');
  assert.equal(props.phData.metis.metamodels[0].name, 'props only');
});

test('production project exporter and file reader restore labels, identity, geometry and unknown fields', async () => {
  const snapshot = {
    phData: { metis: { name: 'Fixture', models: [{ id: 'm', name: 'Model', metamodelRef: 'mm', customModelField: 'preserve', objects: [{ id: 'o', name: 'Saved object' }], relships: [], modelviews: [{ id: 'mv', name: 'Main', objectviews: [{ id: 'ov', objectRef: 'o', name: 'Saved object', loc: '120 240', size: '160 70', customViewField: 'preserve' }], relshipviews: [] }] }], metamodels: [{ id: 'mm', name: 'Meta' }] } },
    phFocus: { focusModel: { id: 'm' }, focusModelview: { id: 'mv' } }, phUser: { name: 'user' }, phSource: 'fixture',
  };
  let blob;
  const exporter = loadTs('./SaveModelToFile.ts', {}, {
    Blob, URL: { createObjectURL: value => { blob = value; return 'blob:test'; } },
    document: { createElement: () => ({ click() {} }), body: { appendChild() {}, removeChild() {} } }, console: { log() {} },
  });
  exporter.SaveAllToFile(snapshot, 'Fixture', '_PR');
  const text = await blob.text();
  let universe = slice.buildUniverseStateFromLegacy(state('empty target'));
  const actions = [];
  const host = { getState: () => ({ universe }), dispatch: action => { actions.push(action); universe = slice.universeReducer(universe, action); } };
  const input = { preventDefault() {}, target: { files: [{ name: 'Fixture_PR.json' }], value: 'selected' } };
  await ReadModelFromFile(state('stale'), host.dispatch, input, host);
  await readers.at(-1).onload({ target: { result: text } });
  assert.equal(actions.length, 2);
  assert.equal(actions[0].type, slice.replaceUniverseState.type);
  const model = universe.world.worldModel.metis.models[0];
  const view = model.modelviews[0].objectviews[0];
  assert.equal(model.id, 'm');
  assert.equal(model.customModelField, 'preserve');
  assert.equal(view.id, 'ov');
  assert.equal(view.objectRef, 'o');
  assert.equal(view.name, 'Saved object');
  assert.equal(view.loc, '120 240');
  assert.equal(view.size, '160 70');
  assert.equal(view.customViewField, 'preserve');
  assert.equal(universe.world.focus.focusModelview.id, 'mv');
  assert.equal(universe.world.worldModel.metis.metamodels[0].id, 'mm');
  assert.equal(input.target.value, '');
});
