import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { bindEditorHost, getEditorHost, persistObjectViewDraft, resolveEditorDispatch, hydrateEditorRuntime, getDragProtection, clearDragProtection, createDeferredCallbacks } from '@mimris/modelling-editor';

test('public editor helpers import without DOM and isolate host access and mutable runtimes', () => {
  assert.equal(typeof window, 'undefined');
  const first = {}, second = {}, actions = [];
  const release = bindEditorHost(first, { getState: () => ({ phSource: 'first' }), dispatch: action => actions.push(action) });
  bindEditorHost(second, { getState: () => ({ phSource: 'second' }), dispatch() {} });
  resolveEditorDispatch(first)({ type: 'edit' });
  assert.equal(actions.length, 1);
  assert.equal(getEditorHost(second).getState().phSource, 'second');
  const snapshot = Object.freeze({ models: [Object.freeze({ id: 'm', name: 'original' })] });
  const runtime = { importData(data) { data.models[0].name = 'runtime'; this.data = data; } };
  hydrateEditorRuntime(runtime, snapshot, false);
  assert.equal(runtime.data.models[0].name, 'runtime');
  assert.equal(snapshot.models[0].name, 'original');
  getDragProtection(first).preserve.set('same', 1);
  assert.equal(getDragProtection(second).preserve.size, 0);
  clearDragProtection(first);
  release();
  assert.equal(getEditorHost(first), undefined);
});
test('public lifecycle helpers cancel only the disposed editor pending work', () => {
  let id = 0; const jobs = new Map();
  const schedule = fn => { jobs.set(++id, fn); return id; };
  const first = createDeferredCallbacks(schedule, key => jobs.delete(key));
  const second = createDeferredCallbacks(schedule, key => jobs.delete(key));
  first.schedule(() => {}, 1); second.schedule(() => {}, 1);
  first.dispose();
  assert.equal(jobs.size, 1);
  second.dispose();
  assert.equal(jobs.size, 0);
});
test('editor foundation imports only its public peers and local modules', () => {
  for (const area of ['host', 'runtime']) for (const name of readdirSync(new URL('../src/' + area + '/', import.meta.url))) {
    const source = readFileSync(new URL('../src/' + area + '/' + name, import.meta.url), 'utf8');
    for (const [, dependency] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const packageSource = new URL('../src/', import.meta.url);
      const sourceFile = new URL(area + '/' + name, packageSource);
      const local = dependency.startsWith('.') && new URL(dependency, sourceFile).href.startsWith(packageSource.href);
      const reactTypeOnly = dependency === 'react' && /import type \{ ComponentType \} from ['"]react['"]/.test(source);
      assert.ok(local || reactTypeOnly || ['@mimris/modelling-core', '@reduxjs/toolkit'].includes(dependency), dependency);
    }
    assert.equal(/(?:window|document)\.|(?:localStorage|sessionStorage)/.test(source), false, name);
  }
});

test('public draft helpers share the same scoped host registry as host bindings', () => {
  const editor = {}, saves = [];
  const snapshot = { phData: { metis: { models: [{ id: 'm', modelviews: [{ id: 'mv', objectviews: [{ id: 'ov', loc: '1 2', custom: 'keep' }] }] }] } } };
  const release = bindEditorHost(editor, { getState: () => snapshot, dispatch() {}, persistence: {
    readDraft: () => JSON.parse(JSON.stringify(snapshot)), saveDraft: value => saves.push(value), saveCurrentDraftAfter() {},
  } });
  persistObjectViewDraft(editor, { id: 'ov', modelviewId: 'mv', loc: '10 20' });
  assert.equal(saves.length, 1);
  assert.equal(saves[0].phData.metis.models[0].modelviews[0].objectviews[0].loc, '10 20');
  assert.equal(snapshot.phData.metis.models[0].modelviews[0].objectviews[0].loc, '1 2');
  release();
});

test('React entry and CSS assets are emitted separately from the Node-safe root', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(manifest.exports['./react'].import, './dist/components/index.js');
  assert.equal(manifest.exports['./relationship-type-editor.css'].default, './dist/components/RelationshipTypeEditor.module.css');
  assert.equal(manifest.exports['./relationship-type-editor.css'].types, './dist/components/RelationshipTypeEditorStyles.d.ts');
  assert.ok(readFileSync(new URL('../dist/components/RelationshipTypeEditorStyles.d.ts', import.meta.url), 'utf8').includes('export default styles'));
  assert.equal(readFileSync(new URL('../dist/components/RelationshipTypeEditor.module.css', import.meta.url), 'utf8'), readFileSync(new URL('../src/components/RelationshipTypeEditor.module.css', import.meta.url), 'utf8'));
  const reactEntry = readFileSync(new URL('../dist/components/index.js', import.meta.url), 'utf8');
  assert.match(reactEntry, /^['"]use client['"]/);
  const rootEntry = readFileSync(new URL('../dist/index.js', import.meta.url), 'utf8');
  assert.equal(rootEntry.includes('components/'), false);
});

test('catalog identifiers remain portable and packaged assets match their declared names', async () => {
  const { iconList, iconList2, imageLibrary, bundledEditorAssetNames, unresolvedEditorAssetNames, resolveEditorAssetUrl } = await import('@mimris/modelling-editor');
  const choices = [...iconList(), ...iconList2(), ...imageLibrary()];
  assert.equal(iconList().find(item => item.label === 'Property').value, 'property.png');
  assert.deepEqual([...unresolvedEditorAssetNames], ['property.png']);
  assert.equal(resolveEditorAssetUrl('default.png', '/editor-assets'), '/editor-assets/default.png');
  assert.equal(resolveEditorAssetUrl('/images/default.png', '/editor-assets/'), '/editor-assets/default.png');
  assert.equal(resolveEditorAssetUrl('unknown.png', '/editor-assets'), 'unknown.png');
  const remote = choices.find(item => item.value.startsWith('https://')).value;
  assert.equal(resolveEditorAssetUrl(remote, '/editor-assets'), remote);
  const localNames = choices.filter(item => !item.value.startsWith('http')).map(item => item.value.replace(/^\/images\//, ''));
  assert.equal(new Set(localNames).size, 44);
  assert.equal(bundledEditorAssetNames.length, 43);
  assert.deepEqual(readdirSync(new URL('../dist/assets/', import.meta.url)).sort(), [...bundledEditorAssetNames].sort());
  for (const name of bundledEditorAssetNames) {
    const owned = readFileSync(new URL('../assets/' + name, import.meta.url));
    assert.deepEqual(readFileSync(new URL('../dist/assets/' + name, import.meta.url)), owned);
    assert.deepEqual(readFileSync(new URL('../../../public/images/' + name, import.meta.url)), owned, 'Standalone asset contract: ' + name);
  }
});
