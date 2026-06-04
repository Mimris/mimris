import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);

const loadUniverseSlice = () => {
  const source = readFileSync(new URL('./universeSlice.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };

  vm.runInNewContext(outputText, {
    exports: module.exports,
    module,
    require,
  }, { filename: 'universeSlice.ts' });

  return module.exports;
};

const { universeReducer, normalizeModelviewObjectviewIdentities, setUniversePhData } = loadUniverseSlice();

const createState = () => ({
  world: {
    worldDefinition: {
      domain: { name: 'Domain' },
    },
    worldModel: {
      metis: {
        id: 'metis',
        name: 'Metis',
        models: [
          {
            id: 'model-1',
            name: 'Model 1',
            metamodelRef: 'meta-1',
            targetMetamodelRef: 'meta-target',
            objects: [{ id: 'object-1', name: 'Object 1' }],
            relships: [{ id: 'rel-1', name: 'Rel 1' }],
            modelviews: [
              {
                id: 'view-1',
                name: 'View 1',
                objectviews: [{ id: 'ov-1', name: 'Object view 1', fillcolor: '' }],
                relshipviews: [{ id: 'rv-1', name: 'Rel view 1', curve: '' }],
              },
            ],
          },
          {
            id: 'model-2',
            name: 'Model 2',
            metamodelRef: 'meta-1',
            modelviews: [],
          },
        ],
        metamodels: [
          {
            id: 'meta-1',
            name: 'Meta 1',
            objecttypes: [{ id: 'ot-1', name: 'Object type 1' }],
            relshiptypes: [{ id: 'rt-1', name: 'Rel type 1' }],
            properties: [{ id: 'prop-1', name: 'Property 1' }],
            methods: [{ id: 'method-1', name: 'Method 1' }],
            viewstyles: [{ id: 'style-1', name: 'Style 1' }],
          },
          {
            id: 'meta-target',
            name: 'Target meta',
            objecttypes: [{ id: 'tot-1', name: 'Target object type 1' }],
            properties: [{ id: 'target-prop-1', name: 'Target property 1' }],
            datatypes: [{ id: 'datatype-1', name: 'Datatype 1' }],
            methods: [{ id: 'target-method-1', name: 'Target method 1' }],
            methodtypes: [{ id: 'methodtype-1', name: 'Method type 1' }],
          },
        ],
      },
    },
    focus: {
      focusModel: { id: 'model-1', name: 'Model 1' },
      focusModelview: { id: 'view-1', name: 'View 1' },
    },
  },
  user: { focusUser: { name: 'User' } },
  source: 'source',
  compatibility: {
    documents: [],
  },
});

test('legacy focus actions update shared universe focus', () => {
  const nextState = universeReducer(createState(), {
    type: 'SET_FOCUS_MODEL',
    data: { id: 'model-2', name: 'Model 2' },
  });

  assert.deepEqual(nextState.world.focus.focusModel, { id: 'model-2', name: 'Model 2' });
});

test('model property mutations update shared metis and focused model', () => {
  const nextState = universeReducer(createState(), {
    type: 'UPDATE_MODEL_PROPERTIES',
    data: { id: 'model-1', name: 'Renamed model' },
  });

  assert.equal(nextState.world.worldModel.metis.models[0].name, 'Renamed model');
  assert.equal(nextState.world.focus.focusModel.name, 'Renamed model');
});

test('GoJS objectview mutations update shared modelview collections', () => {
  const nextState = universeReducer(createState(), {
    type: 'UPDATE_OBJECTVIEW_PROPERTIES',
    data: { id: 'ov-1', name: 'Renamed object view', strokecolor: 'red' },
  });
  const objectview = nextState.world.worldModel.metis.models[0].modelviews[0].objectviews[0];

  assert.equal(objectview.name, 'Renamed object view');
  assert.equal(objectview.strokecolor, 'red');
  assert.equal('fillcolor' in objectview, false);
});

test('normalizes generated modelviews so shared objects have distinct objectview ids', () => {
  const metis = {
    models: [
      {
        id: 'model-1',
        objects: [{ id: 'object-1', name: 'Object 1' }],
        modelviews: [
          {
            id: 'view-1',
            objectviews: [{ id: 'object-1', objectRef: 'object-1', loc: '0 0' }],
            relshipviews: [],
          },
          {
            id: 'view-2',
            objectviews: [
              { id: 'object-1', objectRef: 'object-1', loc: '100 100' },
              { id: 'object-2', objectRef: 'object-2', loc: '200 200' },
            ],
            relshipviews: [
              {
                id: 'rv-1',
                fromobjviewRef: 'object-1',
                toobjviewRef: 'object-2',
              },
            ],
          },
        ],
      },
    ],
  };

  const normalized = normalizeModelviewObjectviewIdentities(metis);
  const [view1, view2] = normalized.models[0].modelviews;

  assert.equal(view1.objectviews[0].objectRef, 'object-1');
  assert.equal(view2.objectviews[0].objectRef, 'object-1');
  assert.notEqual(view1.objectviews[0].id, 'object-1');
  assert.notEqual(view2.objectviews[0].id, 'object-1');
  assert.notEqual(view1.objectviews[0].id, view2.objectviews[0].id);
  assert.equal(view2.relshipviews[0].fromobjviewRef, view2.objectviews[0].id);
  assert.equal(view2.relshipviews[0].toobjviewRef, view2.objectviews[1].id);
});

test('objectview updates are scoped by modelview id when ids are reused', () => {
  const state = createState();
  state.world.worldModel.metis.models[0].modelviews = [
    {
      id: 'draft-view',
      name: 'Draft',
      objectviews: [{ id: 'shared-role-view', objectRef: 'role-1', loc: '0 0' }],
      relshipviews: [],
    },
    {
      id: 'workbench-view',
      name: 'Workbench',
      objectviews: [{ id: 'shared-role-view', objectRef: 'role-1', loc: '100 100' }],
      relshipviews: [],
    },
  ];
  state.world.focus.focusModelview = { id: 'workbench-view', name: 'Workbench' };

  const nextState = universeReducer(state, {
    type: 'UPDATE_OBJECTVIEW_PROPERTIES',
    data: { id: 'shared-role-view', modelviewId: 'draft-view', loc: '20 80' },
  });

  const [draftView, workbenchView] = nextState.world.worldModel.metis.models[0].modelviews;
  assert.equal(draftView.objectviews[0].loc, '20 80');
  assert.equal(workbenchView.objectviews[0].loc, '100 100');
  assert.equal('modelviewId' in draftView.objectviews[0], false);
});

test('shared phData load actions normalize objectview identities', () => {
  const nextState = universeReducer(createState(), setUniversePhData({
    metis: {
      models: [
        {
          id: 'model-1',
          modelviews: [
            {
              id: 'view-1',
              objectviews: [{ id: 'object-1', objectRef: 'object-1' }],
            },
          ],
        },
      ],
    },
  }));

  assert.equal(
    nextState.world.worldModel.metis.models[0].modelviews[0].objectviews[0].id,
    'object-1-view-1',
  );
});

test('metamodel collection mutations update current and target metamodels', () => {
  const stateWithCurrentType = universeReducer(createState(), {
    type: 'UPDATE_OBJECTTYPE_PROPERTIES',
    data: { id: 'ot-1', name: 'Renamed object type' },
  });
  const stateWithTargetProperty = universeReducer(stateWithCurrentType, {
    type: 'UPDATE_TARGETPROPERTY_PROPERTIES',
    data: { id: 'target-prop-1', name: 'Renamed target property' },
  });

  assert.equal(
    stateWithTargetProperty.world.worldModel.metis.metamodels[0].objecttypes[0].name,
    'Renamed object type',
  );
  assert.equal(
    stateWithTargetProperty.world.worldModel.metis.metamodels[1].properties[0].name,
    'Renamed target property',
  );
});
