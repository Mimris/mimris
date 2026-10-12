import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const setup = (search = '') => {
  const saved = [], jobs = new Map();
  let counter = 0, raw;
  const module = { exports: {} };
  const source = readFileSync(new URL('./editorPersistence.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    module, exports: module.exports, URLSearchParams,
    require: () => ({ MEMORY_STATE_STORAGE_KEY: 'memorystate', persistMemoryState: value => saved.push(value) }),
    window: { location: { search }, sessionStorage: { getItem: () => raw }, localStorage: { getItem: () => null } },
    setTimeout: fn => { const id = ++counter; jobs.set(id, fn); return id; },
    clearTimeout: id => jobs.delete(id),
  });
  return { create: module.exports.createStandaloneEditorPersistence, saved, jobs,
    stored: value => { raw = JSON.stringify(value); },
    flush: () => { for (const [id, job] of [...jobs.entries()]) { jobs.delete(id); job(); } },
  };
};

test('host draft persistence reads saved data and deferred saves use the latest owning state', () => {
  const fixture = setup();
  let a = { phSource: 'A' }, b = { phSource: 'B' };
  const first = fixture.create(() => a), second = fixture.create(() => b);
  fixture.stored({ phSource: 'saved draft' });
  assert.equal(first.persistence.readDraft().phSource, 'saved draft');
  first.persistence.saveCurrentDraftAfter(100);
  second.persistence.saveCurrentDraftAfter(150);
  a = { phSource: 'A updated' };
  fixture.flush();
  assert.deepEqual(fixture.saved, [a, b]);
  assert.equal(fixture.jobs.size, 0);
});

test('disposing one editor cancels only its pending persistence and prevents further writes', () => {
  const fixture = setup();
  const a = fixture.create(() => ({ phSource: 'A' }));
  const b = fixture.create(() => ({ phSource: 'B' }));
  a.persistence.saveCurrentDraftAfter(100);
  b.persistence.saveCurrentDraftAfter(100);
  a.dispose();
  a.persistence.saveDraft({ phSource: 'stale' });
  a.persistence.saveCurrentDraftAfter(100);
  fixture.flush();
  assert.equal(fixture.saved.length, 1);
  assert.equal(fixture.saved[0].phSource, 'B');
  assert.equal(a.persistence.readDraft(), undefined);
});

test('Workspace Redux authority prevents local draft reads, writes and scheduled saves', () => {
  const fixture = setup('?workspaceAuthority=redux');
  fixture.stored({ phSource: 'stale local' });
  const host = fixture.create(() => ({ phSource: 'workspace' }));
  assert.equal(host.persistence.readDraft(), undefined);
  host.persistence.saveDraft({ phSource: 'workspace' });
  host.persistence.saveCurrentDraftAfter(100);
  assert.equal(fixture.jobs.size, 0);
  assert.equal(fixture.saved.length, 0);
});
