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

const {
  universeReducer,
  normalizeModelviewObjectviewIdentities,
  loadLegacyUniverseSnapshot,
  setUniversePhData,
  setUniverseState,
} = loadUniverseSlice();

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
    modelList: null,
  },
});

test('legacy focus actions update shared universe focus', () => {
  const nextState = universeReducer(createState(), {
    type: 'SET_FOCUS_MODEL',
    data: { id: 'model-2', name: 'Model 2' },
  });

  assert.deepEqual(nextState.world.focus.focusModel, { id: 'model-2', name: 'Model 2' });
});

test('legacy user display actions update shared universe user', () => {
  const stateWithDeleted = universeReducer(createState(), {
    type: 'SET_USER_SHOWDELETED',
    data: true,
  });
  const stateWithModified = universeReducer(stateWithDeleted, {
    type: 'SET_USER_SHOWMODIFIED',
    data: false,
  });
  const stateWithContext = universeReducer(stateWithModified, {
    type: 'SET_VISIBLE_CONTEXT',
    data: true,
  });

  assert.equal(stateWithContext.user.focusUser.diagram.showDeleted, true);
  assert.equal(stateWithContext.user.focusUser.diagram.showModified, false);
  assert.equal(stateWithContext.user.appSkin.visibleContext, true);
});

test('legacy domain mutations update shared universe world definition domain', () => {
  const nextState = universeReducer(createState(), {
    type: 'UPDATE_DOMAIN_PROPERTIES',
    data: {
      name: 'Renamed domain',
      description: 'Updated description',
      presentation: 'Updated presentation',
    },
  });

  assert.equal(nextState.world.worldDefinition.domain.name, 'Renamed domain');
  assert.equal(nextState.world.worldDefinition.domain.description, 'Updated description');
  assert.equal(nextState.world.worldDefinition.domain.presentation, 'Updated presentation');
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

test('GoJS objectview mutations append new objectviews to the target modelview', () => {
  const nextState = universeReducer(createState(), {
    type: 'UPDATE_OBJECTVIEW_PROPERTIES',
    data: {
      id: 'ov-new',
      modelviewId: 'view-1',
      objectRef: 'object-new',
      name: 'New object view',
      loc: '40 80',
    },
  });
  const objectviews = nextState.world.worldModel.metis.models[0].modelviews[0].objectviews;

  assert.equal(objectviews.length, 2);
  assert.equal(objectviews[1].id, 'ov-new');
  assert.equal(objectviews[1].objectRef, 'object-new');
  assert.equal(objectviews[1].name, 'New object view');
  assert.equal(objectviews[1].loc, '40 80');
  assert.equal('modelviewId' in objectviews[1], false);
});

test('legacy objectview name action updates shared modelview objectview', () => {
  const nextState = universeReducer(createState(), {
    type: 'UPDATE_OBJECTVIEW_NAME',
    data: {
      id: 'ov-1',
      name: 'Renamed object view',
      modelviewId: 'view-1',
    },
  });
  const [objectview] = nextState.world.worldModel.metis.models[0].modelviews[0].objectviews;

  assert.equal(objectview.id, 'ov-1');
  assert.equal(objectview.name, 'Renamed object view');
  assert.equal('modelviewId' in objectview, false);
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

test('normalizes objectview group refs when generated ids are rewritten', () => {
  const metis = {
    models: [
      {
        id: 'model-1',
        objects: [
          { id: 'group-object', name: 'Group' },
          { id: 'child-object', name: 'Child' },
        ],
        modelviews: [
          {
            id: 'draft-view',
            objectviews: [
              { id: 'group-object', objectRef: 'group-object', loc: '0 0', isGroup: true },
              { id: 'child-object', objectRef: 'child-object', loc: '10 10', group: 'group-object' },
            ],
            relshipviews: [],
          },
        ],
      },
    ],
  };

  const normalized = normalizeModelviewObjectviewIdentities(metis);
  const [groupView, childView] = normalized.models[0].modelviews[0].objectviews;

  assert.notEqual(groupView.id, 'group-object');
  assert.notEqual(childView.id, 'child-object');
  assert.equal(childView.group, groupView.id);
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

test('legacy phData load action updates shared universe data', () => {
  const nextState = universeReducer(createState(), {
    type: 'LOAD_TOSTORE_PHDATA',
    data: {
      domain: { name: 'Loaded domain' },
      documents: [{ id: 'doc-1', title: 'Doc 1' }],
      metis: {
        models: [
          {
            id: 'loaded-model',
            modelviews: [
              {
                id: 'loaded-view',
                objectviews: [{ id: 'loaded-object', objectRef: 'loaded-object' }],
              },
            ],
          },
        ],
      },
    },
  });

  assert.equal(nextState.world.worldDefinition.domain.name, 'Loaded domain');
  assert.equal(nextState.compatibility.documents[0].id, 'doc-1');
  assert.equal(
    nextState.world.worldModel.metis.models[0].modelviews[0].objectviews[0].id,
    'loaded-object-loaded-view',
  );
});

test('server data load success updates shared universe data and source', () => {
  const nextState = universeReducer(createState(), {
    type: 'LOAD_DATA_SUCCESS',
    data: {
      domain: { name: 'Server domain' },
      documents: [{ id: 'doc-server', title: 'Server doc' }],
      metis: {
        models: [
          {
            id: 'server-model',
            modelviews: [
              {
                id: 'server-view',
                objectviews: [{ id: 'server-object', objectRef: 'server-object' }],
              },
            ],
          },
        ],
      },
    },
  });

  assert.equal(nextState.world.worldDefinition.domain.name, 'Server domain');
  assert.equal(nextState.compatibility.documents[0].id, 'doc-server');
  assert.equal(nextState.source, 'Model server');
  assert.equal(
    nextState.world.worldModel.metis.models[0].modelviews[0].objectviews[0].id,
    'server-object-server-view',
  );
});

test('github data load success updates shared universe root fields', () => {
  const nextState = universeReducer(createState(), {
    type: 'LOAD_DATAGITHUB_SUCCESS',
    data: {
      data: {
        phData: {
          domain: { name: 'GitHub domain' },
          documents: [{ id: 'doc-github', title: 'GitHub doc' }],
          metis: {
            models: [
              {
                id: 'github-model',
                modelviews: [
                  {
                    id: 'github-view',
                    objectviews: [{ id: 'github-object', objectRef: 'github-object' }],
                  },
                ],
              },
            ],
          },
        },
        phFocus: {
          focusModel: { id: 'github-model', name: 'GitHub model' },
          focusModelview: { id: 'github-view', name: 'GitHub view' },
        },
        phUser: { focusUser: { name: 'GitHub user' } },
        phSource: 'GitHub',
        lastUpdate: 'not-part-of-shared-universe',
      },
    },
  });

  assert.equal(nextState.world.worldDefinition.domain.name, 'GitHub domain');
  assert.equal(nextState.compatibility.documents[0].id, 'doc-github');
  assert.equal(nextState.world.focus.focusModel.id, 'github-model');
  assert.equal(nextState.user.focusUser.name, 'GitHub user');
  assert.equal(nextState.source, 'GitHub');
  assert.equal(
    nextState.world.worldModel.metis.models[0].modelviews[0].objectviews[0].id,
    'github-object-github-view',
  );
});

test('legacy universe snapshot preserves an explicitly focused empty modelview', () => {
  const nextState = universeReducer(createState(), loadLegacyUniverseSnapshot({
    phData: {
      metis: {
        models: [
          {
            id: 'model-1',
            name: 'Model 1',
            modelviews: [
              {
                id: 'empty-view',
                name: 'Empty view',
                objectviews: [],
                relshipviews: [],
              },
              {
                id: 'populated-view',
                name: 'Populated view',
                objectviews: [{ id: 'objectview-1', objectRef: 'object-1' }],
                relshipviews: [],
              },
            ],
          },
        ],
      },
    },
    phFocus: {
      focusModel: { id: 'model-1', name: 'Model 1' },
      focusModelview: { id: 'empty-view', name: 'Empty view' },
    },
  }));

  assert.equal(nextState.world.focus.focusModelview.id, 'empty-view');
});

test('legacy universe snapshot uses the first populated modelview only when none is requested', () => {
  const nextState = universeReducer(createState(), loadLegacyUniverseSnapshot({
    phData: {
      metis: {
        models: [
          {
            id: 'model-1',
            name: 'Model 1',
            modelviews: [
              {
                id: 'empty-view',
                name: 'Empty view',
                objectviews: [],
                relshipviews: [],
              },
              {
                id: 'populated-view',
                name: 'Populated view',
                objectviews: [{ id: 'objectview-1', objectRef: 'object-1' }],
                relshipviews: [],
              },
            ],
          },
        ],
      },
    },
    phFocus: {
      focusModel: { id: 'model-1', name: 'Model 1' },
    },
  }));

  assert.equal(nextState.world.focus.focusModelview.id, 'populated-view');
});

test('model load success replaces matching shared model and merges domain', () => {
  const nextState = universeReducer(createState(), {
    type: 'LOAD_DATAMODEL_SUCCESS',
    data: {
      id: 'model-1',
      domain: { description: 'Loaded model domain description' },
      model: [
        {
          id: 'model-1',
          name: 'Loaded model',
          modelviews: [
            {
              id: 'loaded-model-view',
              objectviews: [{ id: 'loaded-model-object', objectRef: 'loaded-model-object' }],
            },
          ],
        },
      ],
    },
  });

  assert.equal(nextState.world.worldModel.metis.models.length, 2);
  assert.equal(nextState.world.worldModel.metis.models[0].name, 'Loaded model');
  assert.equal(nextState.world.worldModel.metis.models[1].id, 'model-2');
  assert.equal(nextState.world.worldDefinition.domain.name, 'Domain');
  assert.equal(nextState.world.worldDefinition.domain.description, 'Loaded model domain description');
  assert.equal(nextState.source, 'Model server');
  assert.equal(
    nextState.world.worldModel.metis.models[0].modelviews[0].objectviews[0].id,
    'loaded-model-object-loaded-model-view',
  );
});

test('model load success appends missing shared model', () => {
  const nextState = universeReducer(createState(), {
    type: 'LOAD_DATAMODEL_SUCCESS',
    data: {
      id: 'model-new',
      model: [{ id: 'model-new', name: 'New loaded model', modelviews: [] }],
    },
  });

  assert.equal(nextState.world.worldModel.metis.models.length, 3);
  assert.equal(nextState.world.worldModel.metis.models[2].id, 'model-new');
  assert.equal(nextState.source, 'Model server');
});

test('model list load success updates shared compatibility model list', () => {
  const modelList = { modList: [{ id: 'server-model', name: 'Server model' }] };
  const nextState = universeReducer(createState(), {
    type: 'LOAD_DATAMODELLIST_SUCCESS',
    data: modelList,
  });

  assert.deepEqual(nextState.compatibility.modelList, modelList);
});

test('current metamodel action updates shared metis current metamodel ref', () => {
  const nextState = universeReducer(createState(), {
    type: 'SET_CURRENT_METAMODEL',
    data: { id: 'meta-target', name: 'Target meta' },
  });

  assert.equal(nextState.world.worldModel.metis.currentMetamodelRef, 'meta-target');
});

test('legacy phData load preserves current objectview geometry for matching views', () => {
  const movedState = universeReducer(createState(), {
    type: 'UPDATE_OBJECTVIEW_PROPERTIES',
    data: {
      id: 'ov-1',
      modelviewId: 'view-1',
      loc: '300 400',
      group: 'group-1',
      scale: 1.5,
    },
  });
  const staleLoadedState = universeReducer(movedState, {
    type: 'LOAD_TOSTORE_PHDATA',
    data: {
      metis: {
        models: [
          {
            id: 'model-1',
            name: 'Model 1',
            modelviews: [
              {
                id: 'view-1',
                name: 'View 1',
                objectviews: [
                  {
                    id: 'ov-1',
                    name: 'Object view 1',
                    loc: '0 0',
                    group: '',
                    scale: 1,
                  },
                ],
                relshipviews: [],
              },
            ],
          },
        ],
      },
    },
  });
  const objectview = staleLoadedState.world.worldModel.metis.models[0].modelviews[0].objectviews[0];

  assert.equal(objectview.loc, '300 400');
  assert.equal(objectview.group, 'group-1');
  assert.equal(objectview.scale, 1.5);
});

test('full universe reload preserves current objectview geometry for matching views', () => {
  const movedState = universeReducer(createState(), {
    type: 'UPDATE_OBJECTVIEW_PROPERTIES',
    data: {
      id: 'ov-1',
      modelviewId: 'view-1',
      loc: '300 400',
      group: 'group-1',
      scale: 1.5,
    },
  });
  const staleUniverseState = createState();
  staleUniverseState.world.worldModel.metis.models[0].modelviews[0].objectviews[0] = {
    id: 'ov-1',
    name: 'Object view 1',
    loc: '0 0',
    group: '',
    scale: 1,
  };

  const reloadedState = universeReducer(movedState, setUniverseState(staleUniverseState));
  const objectview = reloadedState.world.worldModel.metis.models[0].modelviews[0].objectviews[0];

  assert.equal(objectview.loc, '300 400');
  assert.equal(objectview.group, 'group-1');
  assert.equal(objectview.scale, 1.5);
});

test('legacy new model load action appends to shared metis and merges domain', () => {
  const nextState = universeReducer(createState(), {
    type: 'LOAD_TOSTORE_NEWMODEL',
    data: {
      id: 'model-3',
      name: 'Model 3',
      domain: { description: 'Model domain detail' },
      modelviews: [],
    },
  });

  assert.equal(nextState.world.worldModel.metis.models.length, 3);
  assert.equal(nextState.world.worldModel.metis.models[2].id, 'model-3');
  assert.equal(nextState.world.worldDefinition.domain.name, 'Domain');
  assert.equal(nextState.world.worldDefinition.domain.description, 'Model domain detail');
});

test('legacy new modelview load action replaces matching shared model', () => {
  const nextState = universeReducer(createState(), {
    type: 'LOAD_TOSTORE_NEWMODELVIEW',
    data: {
      id: 'model-1',
      name: 'Model 1 with new view',
      modelviews: [{ id: 'view-new', name: 'New view', objectviews: [], relshipviews: [] }],
    },
  });

  assert.equal(nextState.world.worldModel.metis.models.length, 2);
  assert.equal(nextState.world.worldModel.metis.models[0].name, 'Model 1 with new view');
  assert.equal(nextState.world.worldModel.metis.models[0].modelviews[0].id, 'view-new');
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
