import assert from 'node:assert/strict';
import test from 'node:test';

import { hydrateRemoteMetisReferences } from './remoteMetisHydration.js';

const metamodel = {
  id: 'irtv-meta',
  name: 'IRTV_META',
  objecttypes: [
    { id: 'container-type', name: 'Container', typeviewRef: 'container-view' },
    { id: 'task-type', name: 'Task', typeviewRef: 'task-view' },
  ],
  objecttypeviews: [
    { id: 'task-view', typeRef: 'task-type', viewkind: 'Object' },
  ],
  relshiptypes: [
    { id: 'contains-type', name: 'contains', fromobjtypeRef: 'container-type', toobjtypeRef: 'task-type', typeviewRef: 'contains-view' },
  ],
  relshiptypeviews: [
    { id: 'contains-view', typeRef: 'contains-type' },
  ],
};

const supportingMetamodel = {
  id: 'core-meta',
  name: 'CORE_META',
  objecttypes: [],
  objecttypeviews: [
    { id: 'container-view', typeRef: 'container-type', viewkind: 'Container' },
  ],
  relshiptypes: [],
  relshiptypeviews: [],
};

const remoteMetis = {
  metamodels: [],
  models: [{
    id: 'coffee-shop',
    name: 'IRTV',
    metamodelRef: 'irtv-meta',
    objects: [
      { id: 'shop', name: 'Coffee Shop', typeRef: '', typeName: 'Container' },
      { id: 'serve', name: 'Serve customer', typeRef: '', typeName: 'Task' },
    ],
    relships: [{
      id: 'contains', name: 'contains', typeName: 'contains', typeRef: '',
      fromobjectRef: 'shop', toobjectRef: 'serve',
    }],
    modelviews: [{
      id: 'flow',
      objectviews: [
        { id: 'shop-view', objectRef: 'shop', typeviewRef: '', viewkind: 'Container' },
        { id: 'serve-view', objectRef: 'serve', typeviewRef: '', viewkind: 'Object' },
      ],
      relshipviews: [{ id: 'contains-view-instance', relshipRef: 'contains', typeviewRef: '' }],
    }],
  }],
};

test('hydrates object, objectview, relationship, and relationship-view references by type name', () => {
  const hydrated = hydrateRemoteMetisReferences(remoteMetis, [metamodel, supportingMetamodel]);
  const model = hydrated.models[0];

  assert.deepEqual(model.objects.map(({ typeRef }) => typeRef), ['container-type', 'task-type']);
  assert.deepEqual(model.modelviews[0].objectviews.map(({ typeviewRef }) => typeviewRef), ['container-view', 'task-view']);
  assert.equal(model.relships[0].typeRef, 'contains-type');
  assert.equal(model.modelviews[0].relshipviews[0].typeviewRef, 'contains-view');
});

test('does not mutate the remote workspace payload', () => {
  hydrateRemoteMetisReferences(remoteMetis, [metamodel, supportingMetamodel]);
  assert.equal(remoteMetis.models[0].objects[0].typeRef, '');
  assert.equal(remoteMetis.models[0].modelviews[0].objectviews[0].typeviewRef, '');
});
