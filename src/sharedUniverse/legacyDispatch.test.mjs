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
    },
  }).outputText;
};

const loadUniverseSlice = () => {
  const module = { exports: {} };
  vm.runInNewContext(transpileCommonJs(new URL('../../packages/modelling-core/src/universeSlice.ts', import.meta.url)), {
    exports: module.exports,
    module,
    require: specifier => {
      if (specifier === './diagramPreferences.js') {
        const preferenceModule = { exports: {} };
        vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../../packages/modelling-core/src/diagramPreferences.ts', import.meta.url), 'utf8'), {
          compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
        }).outputText, { module: preferenceModule, exports: preferenceModule.exports, require });
        return preferenceModule.exports;
      }
      if (specifier !== './viewAppearance.js') return require(specifier);
      const appearanceModule = { exports: {} };
      const appearanceSource = readFileSync(new URL('../../packages/modelling-core/src/viewAppearance.ts', import.meta.url), 'utf8');
      vm.runInNewContext(ts.transpileModule(appearanceSource, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
      }).outputText, { module: appearanceModule, exports: appearanceModule.exports });
      return appearanceModule.exports;
    },
  }, { filename: 'universeSlice.ts' });
  return module.exports;
};

const loadLegacyDispatch = () => {
  const universeSlice = loadUniverseSlice();
  const module = { exports: {} };
  const legacyRequire = (specifier) => {
    if (specifier === './universeSlice.js') return universeSlice;
    return require(specifier);
  };
  vm.runInNewContext(transpileCommonJs(new URL('../../packages/modelling-core/src/legacyDispatch.ts', import.meta.url)), {
    exports: module.exports,
    module,
    require: legacyRequire,
  }, { filename: 'legacyDispatch.ts' });
  return module.exports;
};

const { dispatchUniversePhData, toSharedUniverseAction } = loadLegacyDispatch();

test('dispatchUniversePhData dispatches explicit universe phData action', () => {
  const actions = [];
  const phData = { metis: { name: 'Shared metis' } };
  dispatchUniversePhData((action) => actions.push(action), phData);

  assert.equal(actions.length, 1);
  assert.equal(actions[0].type, 'universe/setUniversePhData');
  assert.deepEqual(actions[0].payload, phData);
});

test('legacy phData load action still maps to universe phData action', () => {
  const phData = { metis: { name: 'Legacy metis' } };
  const action = toSharedUniverseAction({ type: 'LOAD_TOSTORE_PHDATA', data: phData });

  assert.equal(action.type, 'universe/setUniversePhData');
  assert.deepEqual(action.payload, phData);
});

test('legacy session adapter routes focus fields and preferences to typed Toolkit actions without altering payloads', () => {
  const { legacyFocusFieldByActionType } = loadUniverseSlice();
  const value = Object.freeze({ id: 'selected', extra: 'keep' });
  for (const [type, field] of Object.entries(legacyFocusFieldByActionType)) {
    const action = toSharedUniverseAction({ type, data: value });
    assert.equal(action.type, 'universe/setFocusField');
    assert.equal(action.payload.field, field);
    assert.equal(action.payload.value, value);
  }
  const user = toSharedUniverseAction({ type: 'SET_FOCUS_USER', data: value });
  assert.equal(user.type, 'universe/setFocusUser');
  assert.equal(user.payload, value);
  const context = toSharedUniverseAction({ type: 'SET_VISIBLE_CONTEXT', data: false });
  assert.equal(context.type, 'universe/setVisibleContext');
  assert.equal(context.payload, false);
  const unrelated = { type: 'EXTERNAL_ACTION', data: value };
  assert.equal(toSharedUniverseAction(unrelated), unrelated);
});

test('legacy reorder adapter retains source and target IDs', () => {
  for (const [raw, typed] of [['REORDER_MODELS', 'universe/reorderModels'], ['REORDER_MODELVIEWS', 'universe/reorderModelviews']]) {
    const data = Object.freeze({ sourceId: 'a', targetId: 'b' });
    const result = toSharedUniverseAction({ type: raw, data });
    assert.equal(result.type, typed);
    assert.equal(result.payload, data);
  }
});

test('model property compatibility adapter selects typed model and model-view actions', () => {
  for (const [raw, typed] of [['UPDATE_MODEL_PROPERTIES', 'universe/updateModel'], ['UPDATE_TARGETMODEL_PROPERTIES', 'universe/updateModel'], ['UPDATE_MODELVIEW_PROPERTIES', 'universe/updateModelview']]) {
    const data = Object.freeze({ id: 'saved', custom: 'keep' });
    const action = toSharedUniverseAction({ type: raw, data });
    assert.equal(action.type, typed);
    assert.equal(action.payload, data);
  }
});

test('relationship compatibility adapter retains the durable patch', () => {
  const patch = Object.freeze({ id: 'r', fromobjectRef: 'a', toobjectRef: 'b', custom: 'keep' });
  const result = toSharedUniverseAction({ type: 'UPDATE_RELSHIP_PROPERTIES', data: patch });
  assert.equal(result.type, 'universe/updateRelationship');
  assert.equal(result.payload, patch);
});

test('object compatibility adapter retains name and unknown properties', () => {
  const patch = Object.freeze({ id: 'o', name: 'new', custom: 'keep' });
  const result = toSharedUniverseAction({ type: 'UPDATE_OBJECT_PROPERTIES', data: patch });
  assert.equal(result.type, 'universe/updateObject');
  assert.equal(result.payload, patch);
});

test('view compatibility adapter retains geometry, appearance and view-target metadata', () => {
  for (const [raw, typed] of [['UPDATE_OBJECTVIEW_PROPERTIES', 'universe/updateObjectview'], ['UPDATE_OBJECTVIEW_NAME', 'universe/updateObjectview'], ['UPDATE_RELSHIPVIEW_PROPERTIES', 'universe/updateRelationshipview']]) {
    const data = Object.freeze({ id: 'view', modelviewId: 'target', loc: '10 20', custom: 'keep' });
    const action = toSharedUniverseAction({ type: raw, data });
    assert.equal(action.type, typed);
    assert.equal(action.payload, data);
  }
});

test('metamodel adapter keeps current and target update routes distinct', () => {
  for (const [raw, typed] of [['UPDATE_METAMODEL_PROPERTIES', 'universe/updateMetamodel'], ['UPDATE_TARGETMETAMODEL_PROPERTIES', 'universe/updateTargetMetamodel']]) {
    const data = Object.freeze({ id: 'mm', custom: 'keep' });
    const result = toSharedUniverseAction({ type: raw, data });
    assert.equal(result.type, typed);
    assert.equal(result.payload, data);
  }
});

test('all metamodel collection aliases adapt to typed actions without changing historical routing', () => {
  const { legacyMetamodelCollectionRoutes } = loadUniverseSlice();
  const patch = Object.freeze({ id: 'item', name: 'new', extra: 'keep' });
  for (const [raw, route] of Object.entries(legacyMetamodelCollectionRoutes)) {
    const action = toSharedUniverseAction({ type: raw, data: patch });
    assert.equal(action.type, 'universe/updateMetamodelItem');
    assert.equal(action.payload.scope, route.scope);
    assert.equal(action.payload.collection, route.collection);
    assert.equal(action.payload.patch, patch);
  }
});

test('project/domain/current-metamodel adapter routes preserve their patches', () => {
  for (const [raw, typed] of [['UPDATE_PROJECT_PROPERTIES', 'universe/updateProject'], ['UPDATE_DOMAIN_PROPERTIES', 'universe/setUniverseDomain'], ['SET_CURRENT_METAMODEL', 'universe/setCurrentMetamodel']]) {
    const data = Object.freeze({ id: 'mm', name: 'new', custom: 'keep' });
    const result = toSharedUniverseAction({ type: raw, data });
    assert.equal(result.type, typed);
    assert.equal(result.payload, data);
  }
});

test('partial focus adapter normalizes loads separately from direct focus replacement', () => {
  const focus = Object.freeze({ focusModel: { id: 'saved' }, extra: 'keep' });
  const loaded = toSharedUniverseAction({ type: 'LOAD_TOSTORE_PHFOCUS', data: focus });
  const replaced = toSharedUniverseAction({ type: 'SET_FOCUS_PHFOCUS', data: focus });
  assert.equal(loaded.type, 'universe/loadFocus');
  assert.equal(replaced.type, 'universe/setUniverseFocus');
  assert.equal(loaded.payload, focus);
  assert.equal(replaced.payload, focus);
});

test('load-result adapter preserves transport payloads and retains background snapshot refresh distinction', () => {
  const { universeLoadTypes } = loadUniverseSlice();
  const data = Object.freeze({ custom: 'keep' });
  for (const [kind, raw] of Object.entries(universeLoadTypes)) {
    if (kind === 'legacySnapshot') continue;
    const result = toSharedUniverseAction({ type: raw, data });
    assert.equal(result.type, 'universe/loadResult');
    assert.equal(result.payload.kind, kind);
    assert.equal(result.payload.data, data);
  }
  const snapshot = { phData: { metis: { models: [] } } };
  assert.equal(toSharedUniverseAction({ type: 'LOAD_TOSTORE_DATA', data: snapshot }).type, 'universe/setUniverseState');
});
