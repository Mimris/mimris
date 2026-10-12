import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function setup(search = '') {
  const module = { exports: {} }, jobs = new Map(), saves = [];
  let id = 0;
  const window = { location: { search } };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./userSettings.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, exports: module.exports, window, URLSearchParams,
    require: () => ({ SaveAkmmUser: (...args) => saves.push(args) }),
    setTimeout: (fn, delay) => { assert.equal(delay, 250); jobs.set(++id, fn); return id; },
    clearTimeout: key => jobs.delete(key),
  });
  return { ...module.exports, jobs, saves, window };
}
test('standalone user-settings saves retain the existing writer, snapshot and key', () => {
  const host = setup(); const snapshot = { phUser: { custom: 'keep' } };
  host.scheduleStandaloneUserSettingsSave(snapshot);
  for (const callback of host.jobs.values()) callback();
  assert.equal(host.saves.length, 1);
  assert.equal(host.saves[0][0], snapshot);
  assert.equal(host.saves[0][1], 'akmmUser');
});
test('canceling one delayed save leaves other hosts alone and guards callbacks already queued', () => {
  const host = setup();
  const cancel = host.scheduleStandaloneUserSettingsSave({ phSource: 'first' });
  const stale = [...host.jobs.values()][0];
  host.scheduleStandaloneUserSettingsSave({ phSource: 'second' });
  cancel(); stale();
  for (const callback of host.jobs.values()) callback();
  assert.equal(host.saves.length, 1);
  assert.equal(host.saves[0][0].phSource, 'second');
});
test('Workspace authority suppresses initial and late standalone user-settings writes', () => {
  const blocked = setup('?workspaceAuthority=redux');
  blocked.scheduleStandaloneUserSettingsSave({});
  assert.equal(blocked.jobs.size, 0);
  const host = setup(); host.scheduleStandaloneUserSettingsSave({});
  host.window.location.search = '?workspaceAuthority=redux';
  for (const callback of host.jobs.values()) callback();
  assert.equal(host.saves.length, 0);
});
