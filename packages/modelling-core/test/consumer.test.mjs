import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { configureStore } from '@reduxjs/toolkit';
import { universeReducer, openLegacyUniverseSnapshot, updateUniverseObject, selectMimrisCompatibilityProps } from '@mimris/modelling-core';

test('public ESM package works without a DOM and supports independent host-owned stores', () => {
  assert.equal(typeof window, 'undefined');
  assert.equal(typeof document, 'undefined');
  const createHost = () => configureStore({ reducer: {
    workspace: (state = { selected: undefined, hostMetadata: 'keep' }, action) => ({
      ...state, selected: universeReducer(state.selected, action),
    }),
  } });
  const first = createHost(), second = createHost();
  const snapshot = { phData: { customVersion: 'v1', metis: { models: [{ id: 'm', objects: [], relships: [], modelviews: [{ id: 'mv', objectviews: [], relshipviews: [] }] }], metamodels: [] } }, phFocus: { focusModel: { id: 'm' }, focusModelview: { id: 'mv' } } };
  first.dispatch(openLegacyUniverseSnapshot(snapshot));
  second.dispatch(openLegacyUniverseSnapshot(snapshot));
  first.dispatch(updateUniverseObject({ id: 'o', name: 'first only' }));
  const project = host => selectMimrisCompatibilityProps({ universe: host.getState().workspace.selected });
  assert.equal(project(first).phData.metis.models[0].objects[0].name, 'first only');
  assert.equal(project(second).phData.metis.models[0].objects.length, 0);
  assert.equal(project(first).phData.customVersion, 'v1');
  assert.equal(first.getState().workspace.hostMetadata, 'keep');
  assert.equal(Object.isFrozen(first.getState().workspace.selected), true);
});
test('core source imports only package-local modules and the Toolkit peer', () => {
  for (const name of readdirSync(new URL('../src/', import.meta.url))) {
    const source = readFileSync(new URL('../src/' + name, import.meta.url), 'utf8');
    for (const [, dependency] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      assert.ok(dependency.startsWith('./') || dependency === '@reduxjs/toolkit', name + ': ' + dependency);
      assert.equal(dependency.includes('/src/'), false);
    }
  }
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(manifest.peerDependencies), ['@reduxjs/toolkit']);
});
