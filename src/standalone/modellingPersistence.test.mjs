import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function setup(search = '') {
  const session = new Map(), local = new Map(), saved = [], module = { exports: {} };
  const storage = map => ({ getItem: key => map.get(key), setItem: (key, value) => map.set(key, value) });
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./modellingPersistence.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, exports: module.exports, URLSearchParams,
    window: { location: { search }, sessionStorage: storage(session), localStorage: storage(local) },
    require: () => ({ MEMORY_STATE_STORAGE_KEY: 'memorystate', persistMemoryState: value => { saved.push(value); return { sessionSaved: true, localSaved: true }; } }),
  });
  return { ...module.exports, session, local, saved };
}
const snapshot = count => ({ phData: { metis: { models: [{ modelviews: [{ objectviews: Array.from({ length: count }, (_, id) => ({ id })), relshipviews: [] }] }] } }, phFocus: {} });
test('standalone persistence preserves the richer saved draft until an explicit refresh', () => {
  const host = setup();
  host.session.set('memorystate', JSON.stringify(snapshot(2)));
  assert.equal(host.persistStandaloneModellingState(snapshot(0)), false);
  assert.equal(host.saved.length, 0);
  const explicit = snapshot(0); explicit.phFocus.focusRefresh = { id: 'open-file' };
  assert.equal(host.persistStandaloneModellingState(explicit), true);
  assert.equal(host.saved.length, 1);
});
test('browser persistence strips embedded Workspace snapshot payloads without mutating source metadata', () => {
  const host = setup(), state = snapshot(1);
  state.phUser = { keep: 'user', __workspaceUniverse: { id: 'universe', snapshot: { huge: true }, worldOperation: { huge: true }, other: 'keep' } };
  assert.equal(host.persistStandaloneModellingState(state), true);
  const meta = host.saved[0].phUser.__workspaceUniverse;
  assert.equal(meta.snapshot, undefined);
  assert.equal(meta.worldOperation, undefined);
  assert.equal(meta.other, 'keep');
  assert.equal(state.phUser.__workspaceUniverse.snapshot.huge, true);
});
test('Workspace authority suppresses standalone draft persistence and remembered tabs keep their existing key', () => {
  const host = setup('?workspaceAuthority=redux');
  assert.equal(host.persistStandaloneModellingState(snapshot(1)), false);
  assert.equal(host.saved.length, 0);
  host.rememberStandaloneModel('model-id');
  assert.equal(host.local.get('mimris.modelling.focusModelId'), 'model-id');
});
