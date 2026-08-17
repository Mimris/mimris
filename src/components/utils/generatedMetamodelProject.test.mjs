import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGenerationProvenance,
  createGeneratedMetamodelProject,
  generatedProjectFileName,
  inspectGeneratedProjectTarget,
  normalizeGeneratedMetamodel,
  updateGeneratedMetamodelProject,
} from './generatedMetamodelProject.js';

const provenance = buildGenerationProvenance({
  sourceProjectId: 'source-project',
  sourceModelId: 'type-model',
  sourceModelviewId: 'main-view',
  sourceMetamodelObjectId: 'metamodel-object-a',
});
const generated = { id: 'new-mm-id', name: 'Sales Meta', objecttypes: [{ id: 'type-1', metamodelRef: 'new-mm-id' }] };

test('creates a generated project with an empty model based on the generated metamodel', () => {
  const project = createGeneratedMetamodelProject({
    serializedMetamodel: generated,
    provenance,
    projectId: 'project-1',
    projectName: 'Sales Project',
    modelId: 'model-1',
    modelName: 'Sales Model',
    modelviewId: 'view-1',
  });
  assert.equal(project.phData.metis.metamodels[0].generationProvenance.sourceMetamodelObjectId, 'metamodel-object-a');
  assert.equal(project.phData.metis.models[0].metamodelRef, 'new-mm-id');
  assert.equal(project.phData.metis.models[0].modelviews[0].name, 'Main');
});

test('normalizes primary types and restores default type-view references', () => {
  const normalized = normalizeGeneratedMetamodel({
    id: 'mm', name: 'Meta',
    objecttypes: [{ id: 'object-type', name: 'Goal' }],
    objecttypes0: [],
    objecttypeviews: [{ id: 'object-view', typeRef: 'object-type', name: '', template: '' }],
    relshiptypes: [],
    relshiptypes0: [{ id: 'rel-type', name: 'depends on' }],
    relshiptypeviews: [{ id: 'rel-view', typeRef: 'rel-type', name: '' }],
  });
  assert.equal(normalized.objecttypes[0].typeviewRef, 'object-view');
  assert.equal(normalized.objecttypeviews[0].name, 'Goal');
  assert.equal(normalized.objecttypeviews[0].template, 'textAndIcon');
  assert.equal(normalized.relshiptypes[0].id, 'rel-type');
  assert.equal(normalized.relshiptypes0[0].id, 'rel-type');
  assert.equal(normalized.relshiptypes[0].typeviewRef, 'rel-view');
});

test('includes supporting metamodels in a new generated project', () => {
  const project = createGeneratedMetamodelProject({
    serializedMetamodel: generated,
    provenance,
    projectId: 'project-1', projectName: 'Sales Project', modelId: 'model-1', modelName: 'Sales Model', modelviewId: 'view-1',
    supportingMetamodels: [{ id: 'admin-mm', name: '_ADMIN_METAMODEL' }],
  });
  assert.deepEqual(project.phData.metis.metamodels.map((item) => item.id), ['new-mm-id', 'admin-mm']);
});

test('updates by provenance while preserving the established metamodel id and project models', () => {
  const project = createGeneratedMetamodelProject({
    serializedMetamodel: { ...generated, id: 'established-mm-id' },
    provenance,
    projectId: 'project-1', projectName: 'Sales Project', modelId: 'model-1', modelName: 'Sales Model', modelviewId: 'view-1',
  });
  project.phData.metis.models[0].objects.push({ id: 'customer-1' });
  const updated = updateGeneratedMetamodelProject({
    project,
    serializedMetamodel: generated,
    provenance,
    supportingMetamodels: [{ id: 'admin-mm', name: '_ADMIN_METAMODEL' }],
  });
  assert.equal(updated.phData.metis.metamodels[0].id, 'established-mm-id');
  assert.equal(updated.phData.metis.metamodels[0].objecttypes[0].metamodelRef, 'established-mm-id');
  assert.deepEqual(updated.phData.metis.models[0].objects, [{ id: 'customer-1' }]);
  assert.deepEqual(updated.phData.metis.metamodels.map((item) => item.id), ['established-mm-id', 'admin-mm']);
  assert.equal(project.phData.metis.metamodels[0].objecttypes[0].metamodelRef, 'new-mm-id');
});

test('requires confirmation before using a legacy same-name match', () => {
  const project = { phData: { metis: { metamodels: [{ id: 'legacy-id', name: 'Sales Meta' }], models: [] } } };
  assert.equal(inspectGeneratedProjectTarget(project, generated, provenance).matchType, 'legacy-name');
  assert.throws(() => updateGeneratedMetamodelProject({ project, serializedMetamodel: generated, provenance }), { code: 'LEGACY_NAME_MATCH' });
  const updated = updateGeneratedMetamodelProject({ project, serializedMetamodel: generated, provenance, allowLegacyNameMatch: true });
  assert.equal(updated.phData.metis.metamodels[0].id, 'legacy-id');
});

test('rejects a project generated from another Metamodel object', () => {
  const other = { ...provenance, sourceMetamodelObjectId: 'metamodel-object-b' };
  const project = { generationProvenance: other, phData: { metis: { metamodels: [{ ...generated, generationProvenance: other }], models: [] } } };
  assert.throws(() => inspectGeneratedProjectTarget(project, generated, provenance), /does not contain/);
});

test('creates consistent project file names', () => {
  assert.equal(generatedProjectFileName('Sales Project_PR.json'), 'Sales-Project_PR.json');
});
