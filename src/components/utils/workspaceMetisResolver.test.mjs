import test from 'node:test';
import assert from 'node:assert/strict';

import {
  METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION,
  METIS_SCOPE_ORIGIN_TYPE_FOUNDATION,
  METIS_SCOPE_WORLD_MODEL,
  readMetisForScope,
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
    originWorld: {
      foundationModels: {
        typeDefinition: { metis: createMetis('type') },
        templateDefinition: { metis: createMetis('template') },
      },
    },
  };

  const resolved = readMetisForScope(snapshot);

  assert.equal(resolveActiveMetisScope(snapshot), METIS_SCOPE_WORLD_MODEL);
  assert.equal(resolved.scope, METIS_SCOPE_WORLD_MODEL);
  assert.equal(resolved.source, 'world.worldModel.metis');
  assert.equal(resolved.metis.name, 'world');
});

test('loads origin TYPE foundation when selected', () => {
  const snapshot = {
    world: {
      worldModel: {
        metis: createMetis('world'),
      },
    },
    originWorld: {
      foundationModels: {
        typeDefinition: { metis: createMetis('type') },
        templateDefinition: { metis: createMetis('template') },
      },
    },
  };

  const resolved = readMetisForScope(snapshot, METIS_SCOPE_ORIGIN_TYPE_FOUNDATION);

  assert.equal(resolved.scope, METIS_SCOPE_ORIGIN_TYPE_FOUNDATION);
  assert.equal(resolved.source, 'originWorld.foundationModels.typeDefinition.metis');
  assert.equal(resolved.metis.name, 'type');
});

test('loads origin TEMPLATE foundation when selected', () => {
  const snapshot = {
    world: {
      worldModel: {
        metis: createMetis('world'),
      },
    },
    originWorld: {
      foundationModels: {
        typeDefinition: { metis: createMetis('type') },
        templateDefinition: { metis: createMetis('template') },
      },
    },
  };

  const resolved = readMetisForScope(snapshot, METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION);

  assert.equal(resolved.scope, METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION);
  assert.equal(resolved.source, 'originWorld.foundationModels.templateDefinition.metis');
  assert.equal(resolved.metis.name, 'template');
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

test('writes world model edits to world.worldModel.metis', () => {
  const nextMetis = createMetis('edited-world');
  const snapshot = setActiveMetisScope({}, METIS_SCOPE_WORLD_MODEL);

  const written = writeMetisForScope(snapshot, METIS_SCOPE_WORLD_MODEL, nextMetis);

  assert.deepEqual(written.world.worldModel.metis, nextMetis);
  assert.equal(written.workspace.activeMetisScope, METIS_SCOPE_WORLD_MODEL);
  assert.equal('metis' in written, false);
});
