import test from 'node:test';
import assert from 'node:assert/strict';

import {
  describeMetisAvailability,
  METIS_SCOPE_WORLD_MODEL,
  readMetisForScope,
  normalizeMetisScope,
  resolveActiveMetisScope,
  setActiveMetisScope,
  writeMetisForScope,
} from './workspaceMetisResolver.js';

const createMetis = (name) => ({
  id: `${name}-id`,
  name,
  description: `${name} description`,
  models: [{ id: `${name}-model`, name: `${name} model`, modelviews: [] }],
  metamodels: [{ id: `${name}-metamodel`, name: `${name} metamodel` }],
});

test('defaults to world.worldModel.metis when present', () => {
  const snapshot = {
    world: {
      worldModel: {
        metis: createMetis('world'),
      },
    },
  };

  const resolved = readMetisForScope(snapshot);

  assert.equal(resolveActiveMetisScope(snapshot), METIS_SCOPE_WORLD_MODEL);
  assert.equal(resolved.scope, METIS_SCOPE_WORLD_MODEL);
  assert.equal(resolved.source, 'world.worldModel.metis');
  assert.equal(resolved.metis.name, 'world');
});

test('normalizes legacy foundation scopes to world-model', () => {
  const snapshot = {
    world: {
      worldModel: {
        metis: createMetis('world'),
      },
    },
  };

  const typeResolved = readMetisForScope(snapshot, 'origin-type-foundation');
  const templateResolved = readMetisForScope(snapshot, 'origin-template-foundation');

  assert.equal(typeResolved.scope, METIS_SCOPE_WORLD_MODEL);
  assert.equal(templateResolved.scope, METIS_SCOPE_WORLD_MODEL);
  assert.equal(typeResolved.source, 'world.worldModel.metis');
  assert.equal(templateResolved.source, 'world.worldModel.metis');
  assert.equal(typeResolved.metis.name, 'world');
  assert.equal(templateResolved.metis.name, 'world');
});

test('falls back to legacy origin paths when canonical foundation paths are missing', () => {
  const snapshot = {
    worldModel: {
      metis: createMetis('world'),
    },
    origin: {
      typeDefinition: { metis: createMetis('legacy-type') },
      template: { metis: createMetis('legacy-template') },
    },
  };

  const typeResolved = readMetisForScope(snapshot, 'origin-type-foundation');
  const templateResolved = readMetisForScope(snapshot, 'origin-template-foundation');

  assert.equal(typeResolved.metis.name, 'world');
  assert.equal(templateResolved.metis.name, 'world');
});

test('supports canonical world branch when the branch itself is the metis object', () => {
  const snapshot = {
    world: {
      worldModel: createMetis('world-direct'),
    },
  };

  const resolved = readMetisForScope(snapshot);

  assert.equal(resolved.metis.name, 'world-direct');
});

test('falls back to legacy top-level metis when canonical sources are missing', () => {
  const snapshot = {
    metis: createMetis('legacy'),
  };

  const resolved = readMetisForScope(snapshot);

  assert.equal(resolveActiveMetisScope(snapshot), METIS_SCOPE_WORLD_MODEL);
  assert.equal(resolved.scope, METIS_SCOPE_WORLD_MODEL);
  assert.equal(resolved.source, 'metis');
  assert.equal(resolved.metis.name, 'legacy');
});

test('prefers canonical world.worldModel.metis over legacy top-level metis when both exist', () => {
  const snapshot = {
    world: {
      worldModel: {
        metis: createMetis('world'),
      },
    },
    metis: createMetis('legacy'),
  };

  const resolved = readMetisForScope(snapshot);

  assert.equal(resolveActiveMetisScope(snapshot), METIS_SCOPE_WORLD_MODEL);
  assert.equal(resolved.source, 'world.worldModel.metis');
  assert.equal(resolved.metis.name, 'world');
});

test('reports only world model as available when using legacy top-level metis fallback', () => {
  const snapshot = {
    metis: createMetis('legacy'),
  };

  const availability = describeMetisAvailability(snapshot);

  assert.equal(availability.availableScopes[METIS_SCOPE_WORLD_MODEL], true);
  assert.equal(availability.availableScopes['origin-type-foundation'], false);
  assert.equal(availability.availableScopes['origin-template-foundation'], false);
  assert.equal(availability.usingLegacyFallback, true);
  assert.equal(availability.defaultSource.source, 'metis');
});

test('writes world model edits to world.worldModel.metis', () => {
  const nextMetis = createMetis('edited-world');
  const snapshot = setActiveMetisScope({ metis: createMetis('legacy') }, METIS_SCOPE_WORLD_MODEL);

  const written = writeMetisForScope(snapshot, METIS_SCOPE_WORLD_MODEL, nextMetis);

  assert.deepEqual(written.world.worldModel.metis, nextMetis);
  assert.equal(written.workspace.activeMetisScope, METIS_SCOPE_WORLD_MODEL);
  assert.equal('metis' in written, false);
});

test('writes legacy requested foundation scope to world metis path', () => {
  const nextMetis = createMetis('edited-world');
  const snapshot = {
    metis: createMetis('legacy'),
  };

  const written = writeMetisForScope(snapshot, 'origin-type-foundation', nextMetis);

  assert.deepEqual(written.world.worldModel.metis, nextMetis);
  assert.equal(written.workspace.activeMetisScope, METIS_SCOPE_WORLD_MODEL);
  assert.equal('metis' in written, false);
});

test('normalizes explicit query values without defaulting back to world model', () => {
  assert.equal(normalizeMetisScope('worldModel'), METIS_SCOPE_WORLD_MODEL);
  assert.equal(normalizeMetisScope('typeDefinition'), METIS_SCOPE_WORLD_MODEL);
  assert.equal(normalizeMetisScope('templateDefinition'), METIS_SCOPE_WORLD_MODEL);
});
