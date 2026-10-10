import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const load = path => {
  const module = { exports: {} };
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, exports: module.exports, require });
  return module.exports;
};
const { bindEditorHost, getEditorHost, resolveEditorDispatch } = load('../../packages/modelling-editor/src/host/access.ts');
const { selectMimrisCompatibilityProps } = load('../../packages/modelling-core/src/selectors.ts');

const host = (name, nest) => {
  let root = nest({
    world: { worldDefinition: { domain: null }, worldModel: { metis: { name } }, focus: null },
    user: null, source: name, compatibility: { documents: [], modelList: null },
  });
  const actions = [];
  return {
    actions,
    access: {
      getState: () => selectMimrisCompatibilityProps({ universe: root.workspace.selectedUniverse }),
      dispatch: action => actions.push(action),
    },
    update: name => { root.workspace.selectedUniverse.world.worldModel.metis = { name }; },
  };
};
const nest = universe => ({ workspace: { selectedUniverse: universe }, unrelated: { keep: true } });

test('editor instances read fresh projections and dispatch to their own differently shaped hosts', () => {
  const first = {}, second = {};
  const a = host('A', nest), b = host('B', nest);
  const detachA = bindEditorHost(first, a.access);
  const detachB = bindEditorHost(second, b.access);
  a.update('A edited');
  assert.equal(getEditorHost(first).getState().phData.metis.name, 'A edited');
  assert.equal(getEditorHost(second).getState().phData.metis.name, 'B');
  const edit = { type: 'UPDATE_OBJECT_PROPERTIES', data: { id: 'object-1', name: 'Changed' } };
  getEditorHost(first).dispatch(edit);
  assert.deepEqual(a.actions, [edit]);
  assert.deepEqual(b.actions, []);
  detachA();
  assert.equal(getEditorHost(first), undefined);
  assert.equal(getEditorHost(second), b.access);
  detachB();
});

test('stale cleanup cannot detach a remounted editor and unbound editors have no global fallback', () => {
  const editor = {}, a = host('A', nest), b = host('B', nest);
  const oldCleanup = bindEditorHost(editor, a.access);
  const cleanup = bindEditorHost(editor, b.access);
  oldCleanup();
  assert.equal(getEditorHost(editor), b.access);
  cleanup();
  assert.equal(getEditorHost(editor), undefined);
  assert.equal(getEditorHost({}), undefined);
  assert.equal(getEditorHost(null), undefined);
});

test('dispatch chooses the scoped host once and preserves legacy method receivers', () => {
  const editor = {}, actions = [], fallbackActions = [];
  const legacy = { dispatch(action) { assert.equal(this, legacy); fallbackActions.push(action); } };
  const action = { type: 'EDIT' };
  const detach = bindEditorHost(editor, { getState: () => ({}), dispatch: value => actions.push(value) });
  resolveEditorDispatch(editor, legacy, legacy)(action);
  assert.deepEqual(actions, [action]);
  assert.deepEqual(fallbackActions, []);
  detach();
  resolveEditorDispatch(editor, undefined, legacy, legacy)(action);
  assert.deepEqual(fallbackActions, [action]);
  assert.equal(resolveEditorDispatch(editor, {}), undefined);
});

test('a failed authoritative dispatch does not retry another store', () => {
  const editor = {};
  let fallbackCalls = 0;
  const detach = bindEditorHost(editor, { getState: () => ({}), dispatch: () => { throw new Error('rejected'); } });
  assert.throws(() => resolveEditorDispatch(editor, { dispatch: () => fallbackCalls++ })({ type: 'EDIT' }), /rejected/);
  assert.equal(fallbackCalls, 0);
  detach();
});
