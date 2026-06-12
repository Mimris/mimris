import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);

const transpileCommonJs = (url) => {
  const source = readFileSync(url, 'utf8');
  return ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.React,
    },
  }).outputText;
};

const loadUniverseSlice = () => {
  const module = { exports: {} };
  vm.runInNewContext(transpileCommonJs(new URL('./universeSlice.ts', import.meta.url)), {
    exports: module.exports,
    module,
    require,
  }, { filename: 'universeSlice.ts' });
  return module.exports;
};

const createLegacyInitialState = () => ({
  phData: {
    domain: { name: 'Legacy domain' },
    metis: {
      models: [
        {
          id: 'model-1',
          name: 'Model 1',
          objects: [],
          relships: [],
          modelviews: [
            {
              id: 'view-1',
              name: 'View 1',
              objectviews: [],
              relshipviews: [],
            },
          ],
        },
      ],
      metamodels: [],
    },
    documents: [],
  },
  phFocus: {
    focusModel: { id: 'model-1', name: 'Model 1' },
    focusModelview: { id: 'view-1', name: 'View 1' },
  },
  phUser: { focusUser: { name: 'Legacy user' } },
  phSource: 'legacy-source',
  phGojs: { keep: true },
});

const legacyReducer = (state = createLegacyInitialState(), action) => {
  if (action.type === 'UPDATE_OBJECTVIEW_PROPERTIES') {
    return {
      ...state,
      phData: {
        ...state.phData,
        metis: {
          ...state.phData.metis,
          legacyMutationShouldBeMirroredAway: true,
        },
      },
    };
  }

  if (action.type === 'LEGACY_ONLY_SOURCE') {
    return {
      ...state,
      phSource: action.data,
    };
  }

  if (action.type === 'SET_GOJS_MODEL') {
    return {
      ...state,
      phGojs: {
        ...state.phGojs,
        gojsModel: action.gojsModel,
      },
    };
  }

  return state;
};

const loadStoreModule = () => {
  const universeSlice = loadUniverseSlice();
  const module = { exports: {} };
  const storeRequire = (specifier) => {
    if (specifier === './reducers/reducer') {
      return { __esModule: true, default: legacyReducer };
    }
    if (specifier === './sharedUniverse/universeSlice') {
      return universeSlice;
    }
    if (specifier === 'next-redux-wrapper') {
      return { createWrapper: () => ({}) };
    }
    return require(specifier);
  };

  vm.runInNewContext(transpileCommonJs(new URL('../store.tsx', import.meta.url)), {
    exports: module.exports,
    module,
    require: storeRequire,
  }, { filename: 'store.tsx' });

  return module.exports;
};

const { rootReducer } = loadStoreModule();

test('root reducer mirrors shared objectview updates back to legacy phData', () => {
  const initialState = rootReducer(undefined, { type: '@@INIT' });
  const nextState = rootReducer(initialState, {
    type: 'UPDATE_OBJECTVIEW_PROPERTIES',
    data: {
      id: 'ov-new',
      modelviewId: 'view-1',
      objectRef: 'object-new',
      loc: '10 20',
    },
  });
  const sharedObjectviews = nextState.universe.world.worldModel.metis.models[0].modelviews[0].objectviews;

  assert.equal(sharedObjectviews.length, 1);
  assert.equal(sharedObjectviews[0].id, 'ov-new');
  assert.equal(nextState.phData.metis.models[0].modelviews[0].objectviews[0].id, 'ov-new');
  assert.equal(nextState.phData.metis.legacyMutationShouldBeMirroredAway, undefined);
});

test('root reducer rebuilds shared universe from legacy-only state changes', () => {
  const initialState = rootReducer(undefined, { type: '@@INIT' });
  const nextState = rootReducer(initialState, {
    type: 'LEGACY_ONLY_SOURCE',
    data: 'legacy-only-source',
  });

  assert.equal(nextState.phSource, 'legacy-only-source');
  assert.equal(nextState.universe.source, 'legacy-only-source');
  assert.equal(nextState.phGojs.keep, true);
});

test('root reducer mirrors direct legacy phData loads to compatibility props', () => {
  const initialState = rootReducer(undefined, { type: '@@INIT' });
  const nextState = rootReducer(initialState, {
    type: 'LOAD_TOSTORE_PHDATA',
    data: {
      domain: { name: 'Loaded domain' },
      metis: {
        models: [
          {
            id: 'loaded-model',
            modelviews: [{ id: 'loaded-view', objectviews: [], relshipviews: [] }],
          },
        ],
      },
      documents: [{ id: 'doc-1' }],
    },
  });

  assert.equal(nextState.universe.world.worldDefinition.domain.name, 'Loaded domain');
  assert.equal(nextState.phData.domain.name, 'Loaded domain');
  assert.equal(nextState.phData.metis.models[0].id, 'loaded-model');
  assert.equal(nextState.phData.documents[0].id, 'doc-1');
});

test('root reducer mirrors shared model list loads to legacy phList', () => {
  const initialState = rootReducer(undefined, { type: '@@INIT' });
  const modelList = { modList: [{ id: 'model-list-item', name: 'Listed model' }] };
  const nextState = rootReducer(initialState, {
    type: 'LOAD_DATAMODELLIST_SUCCESS',
    data: modelList,
  });

  assert.deepEqual(nextState.universe.compatibility.modelList, modelList);
  assert.deepEqual(nextState.phList, modelList);
});

test('root reducer mirrors legacy objectview name updates to legacy phData', () => {
  const initialState = rootReducer(undefined, { type: '@@INIT' });
  const nextState = rootReducer(initialState, {
    type: 'UPDATE_OBJECTVIEW_NAME',
    data: {
      id: 'ov-renamed',
      modelviewId: 'view-1',
      objectRef: 'object-renamed',
      name: 'Renamed object view',
    },
  });
  const sharedObjectview = nextState.universe.world.worldModel.metis.models[0].modelviews[0].objectviews[0];
  const legacyObjectview = nextState.phData.metis.models[0].modelviews[0].objectviews[0];

  assert.equal(sharedObjectview.name, 'Renamed object view');
  assert.equal(legacyObjectview.name, 'Renamed object view');
});

test('root reducer keeps runtime GoJS actions out of shared universe', () => {
  const initialState = rootReducer(undefined, { type: '@@INIT' });
  const gojsModel = { nodeDataArray: [{ key: 'node-1' }], linkDataArray: [] };
  const nextState = rootReducer(initialState, {
    type: 'SET_GOJS_MODEL',
    gojsModel,
  });

  assert.deepEqual(nextState.phGojs.gojsModel, gojsModel);
  assert.equal(nextState.universe, initialState.universe);
});
