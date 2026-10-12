import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../../packages/modelling-editor/src/runtime/deferredCallbacks.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { module, exports: module.exports, setTimeout, clearTimeout });
const { createDeferredCallbacks } = module.exports;
test('teardown cancels deferred work only for its owning editor and rejects future work', () => {
  const jobs = new Map(); let id = 0;
  const schedule = fn => { jobs.set(++id, fn); return id; };
  const cancel = key => jobs.delete(key);
  const first = createDeferredCallbacks(schedule, cancel), second = createDeferredCallbacks(schedule, cancel);
  const calls = [];
  first.schedule(() => calls.push('first'), 50);
  second.schedule(() => calls.push('second'), 50);
  first.dispose();
  assert.equal(first.schedule(() => calls.push('late'), 0), undefined);
  assert.equal(jobs.size, 1);
  for (const fn of jobs.values()) fn();
  assert.deepEqual(calls, ['second']);
});
test('callbacks already delivered to the event loop are guarded after disposal', () => {
  let queued, cancelled = 0, called = 0;
  const callbacks = createDeferredCallbacks(fn => { queued = fn; return 1; }, () => cancelled++);
  callbacks.schedule(() => called++, 0);
  callbacks.dispose();
  queued();
  assert.equal(called, 0);
  assert.equal(cancelled, 1);
});
