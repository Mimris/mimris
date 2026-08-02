import assert from 'node:assert/strict';
import test from 'node:test';

import {
  hasExplicitModelRequest,
  shouldOpenFreshStartupProject,
} from './modellingStartup.js';

test('plain Mimris modelling opens a fresh startup project', () => {
  assert.equal(shouldOpenFreshStartupProject({}), true);
});

test('reloading plain Mimris modelling restores the current tab project', () => {
  assert.equal(shouldOpenFreshStartupProject({}, 'reload'), false);
});

test('explicit project and workspace links keep their requested model', () => {
  assert.equal(hasExplicitModelRequest({ project: 'demo' }), true);
  assert.equal(hasExplicitModelRequest({ universeSlug: '4em' }), true);
  assert.equal(hasExplicitModelRequest({ org: 'Mimris', repo: 'models', file: 'type.json' }), true);
  assert.equal(shouldOpenFreshStartupProject({ file: 'type.json' }), false);
});
