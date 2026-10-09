import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const load = (name, dependencies = {}) => {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`./${name}.ts`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, exports: module.exports, require: name => dependencies[name] });
  return module.exports;
};
const access = load('access');
const { persistObjectViewDraft } = load('objectViewDraft', { './access': access });
const snapshot = name => ({ phSource: name, phData: { metis: { models: [{ id: 'm', modelviews: [
  { id: 'first', objectviews: [{ id: 'same', loc: '1 2' }] },
  { id: 'second', objectviews: [{ id: 'same', loc: '3 4', custom: 'preserved' }] },
] }] } } });
test('object-view draft patches target the owning host and requested modelview with detached nested values', () => {
  const a = {}, b = {}, original = snapshot('A'), savesA = [], savesB = [];
  const host = (data, saves) => ({ getState: () => data, dispatch() {}, persistence: {
    readDraft: () => JSON.parse(JSON.stringify(data)), saveDraft: value => saves.push(value), saveCurrentDraftAfter() {},
  } });
  const detachA = access.bindEditorHost(a, host(original, savesA));
  const detachB = access.bindEditorHost(b, host(snapshot('B'), savesB));
  const patch = { id: 'same', modelviewId: 'second', loc: '10 20', appearanceOverrides: { fillcolor: 'red' } };
  persistObjectViewDraft(a, patch);
  assert.equal(savesA.length, 1);
  assert.equal(savesB.length, 0);
  const views = savesA[0].phData.metis.models[0].modelviews;
  assert.equal(views[0].objectviews[0].loc, '1 2');
  assert.equal(views[1].objectviews[0].loc, '10 20');
  assert.equal(views[1].objectviews[0].custom, 'preserved');
  assert.equal(views[1].objectviews[0].modelviewId, undefined);
  patch.appearanceOverrides.fillcolor = 'blue';
  assert.equal(views[1].objectviews[0].appearanceOverrides.fillcolor, 'red');
  assert.equal(original.phData.metis.models[0].modelviews[1].objectviews[0].loc, '3 4');
  detachA(); detachB();
});
test('absent host capabilities and missing drafts never choose a browser storage fallback', () => {
  persistObjectViewDraft({}, { id: 'same', loc: '10 20' });
  const editor = {};
  const detach = access.bindEditorHost(editor, { getState: () => snapshot('host'), dispatch() {} });
  persistObjectViewDraft(editor, { id: 'same' });
  detach();
  let writes = 0;
  const cleanup = access.bindEditorHost(editor, { getState: () => snapshot('host'), dispatch() {}, persistence: {
    readDraft: () => undefined, saveDraft: () => writes++, saveCurrentDraftAfter() {},
  } });
  persistObjectViewDraft(editor, { id: 'same' });
  assert.equal(writes, 0);
  cleanup();
});
