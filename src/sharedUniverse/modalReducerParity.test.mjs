import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const nativeRequire = createRequire(import.meta.url);
const cache = new Map();
function load(path) {
  if (cache.has(path)) return cache.get(path).exports;
  if (path.endsWith('.json')) return JSON.parse(readFileSync(path, 'utf8'));
  const module = { exports: {} };
  cache.set(path, module);
  vm.runInNewContext(ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, {
    module, exports: module.exports, console: { log() {} }, process,
    require: specifier => {
      if (specifier === 'next-redux-wrapper') return { createWrapper: () => ({}) };
      if (!specifier.startsWith('.')) return nativeRequire(specifier);
      const base = resolve(dirname(path), specifier.replace(/\.js$/, ''));
      return load(['', '.ts', '.tsx', '.js'].map(ext => base + ext).find(existsSync));
    },
  }, { filename: path });
  return module.exports;
}
const base = dirname(fileURLToPath(import.meta.url));
const { universeReducer, buildUniverseStateFromLegacy } = load(resolve(base, 'universeSlice.ts'));
const { rootReducer } = load(resolve(base, '../store.tsx'));
const compat = load(resolve(base, 'selectors.ts')).selectMimrisCompatibilityProps;
const plain = value => JSON.parse(JSON.stringify(value));
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
const fixture = () => ({
  phData: { domain: { name: 'domain' }, documents: [], metis: {
    models: [{ id: 'm', metamodelRef: 'mm', objects: [], relships: [], modelviews: [
      { id: 'mv', objectviews: [{ id: 'ov', objectRef: 'o', loc: '10 20', fillcolor: '', custom: 'keep' }], relshipviews: [{ id: 'rv', relshipRef: 'r', fromobjviewRef: 'ov', toobjviewRef: 'ov', points: [1, 2, 3, 4], curve: '', custom: 'keep' }] },
      { id: 'other', objectviews: [{ id: 'other-ov', loc: '5 6' }], relshipviews: [] },
    ] }],
    metamodels: [{ id: 'mm', relshiptypes: [{ id: 'rt', name: 'type', cardinalityTo: '1', custom: 'keep' }], relshiptypeviews: [{ id: 'rtv', strokecolor: 'black', custom: 'keep' }] }],
  } },
  phFocus: { focusModel: { id: 'm' }, focusModelview: { id: 'mv' } },
  phUser: { name: 'user' }, phSource: 'source', unrelated: { keep: true },
});
const actions = [
  { type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: { id: 'ov', fillcolor: 'red', size: '80 40' } },
  { type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data: { id: 'rv', toArrow: 'Diamond', strokewidth: 2 } },
  { type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data: { id: 'rt', name: 'depends on', cardinalityTo: '1..*' } },
  { type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data: { id: 'rtv', strokecolor: 'blue', toArrow: 'Diamond' } },
];
for (const action of actions) test(`${action.type}: characterized saved-shape parity and immutable root integration`, () => {
  const input = freeze(fixture()), frozenAction = freeze(plain(action));
  const original = plain(input);
  let expected;
  if (action.type === 'UPDATE_OBJECTVIEW_PROPERTIES' || action.type === 'UPDATE_RELSHIPVIEW_PROPERTIES') {
    expected = plain(input);
    const view = expected.phData.metis.models[0].modelviews[0];
    if (action.type === 'UPDATE_OBJECTVIEW_PROPERTIES') Object.assign(view.objectviews[0], plain(action.data));
    else { Object.assign(view.relshipviews[0], plain(action.data)); delete view.relshipviews[0].curve; }
  } else {
    expected = plain(input);
    const metamodel = expected.phData.metis.metamodels[0];
    Object.assign(action.type === 'UPDATE_RELSHIPTYPE_PROPERTIES' ? metamodel.relshiptypes[0] : metamodel.relshiptypeviews[0], plain(action.data));
  }
  const canonical = buildUniverseStateFromLegacy(input);
  const result = universeReducer(canonical, frozenAction);
  assert.deepEqual(plain(result.world.worldModel.metis), plain(expected.phData.metis));
  assert.deepEqual(plain(input), original);
  const root = rootReducer({ ...input, universe: canonical }, frozenAction);
  assert.deepEqual(plain(compat(root).phData.metis), plain(expected.phData.metis));
  assert.equal(compat(root).phData.metis, root.universe.world.worldModel.metis);
  assert.equal(root.unrelated, input.unrelated);
  assert.equal(compat(root).phUser, input.phUser);
  assert.equal(result.world.worldModel.metis.models[0].modelviews[1], canonical.world.worldModel.metis.models[0].modelviews[1]);
});
test('canonical relationship-type-view updates preserve trailing entries lost by the legacy reducer', () => {
  const input = fixture();
  input.phData.metis.metamodels[0].relshiptypeviews.push({ id: 'tail', strokecolor: 'green' });
  freeze(input);
  // Historical handler dropped the tail; canonical regression keeps it.
  const canonical = buildUniverseStateFromLegacy(input);
  const result = universeReducer(canonical, actions[3]);
  assert.equal(result.world.worldModel.metis.metamodels[0].relshiptypeviews.length, 2);
  assert.equal(result.world.worldModel.metis.metamodels[0].relshiptypeviews[1], canonical.world.worldModel.metis.metamodels[0].relshiptypeviews[1]);
});

const preferences = load(resolve(base, 'diagramPreferences.ts'));
for (const [typed, legacy, field] of [
  [preferences.setDiagramShowDeleted, 'SET_USER_SHOWDELETED', 'showDeleted'],
  [preferences.setDiagramShowModified, 'SET_USER_SHOWMODIFIED', 'showModified'],
]) test(`${field}: typed RTK and compatibility actions preserve user metadata and root no-op identity`, () => {
  const input = fixture();
  input.phUser = { account: 'keep', focusUser: { name: 'keep user', custom: 'keep', diagram: { showDeleted: false, showModified: false, scale: 2 } } };
  const state = rootReducer(input, { type: '@@INIT' });
  const result = rootReducer(state, typed(true));
  const compatible = rootReducer(state, { type: legacy, data: true });
  assert.deepEqual(plain(result.universe.user), plain(compatible.universe.user));
  assert.equal(compat(result).phUser.focusUser.diagram[field], true);
  assert.equal(compat(result).phUser.focusUser.name, 'keep user');
  assert.equal(compat(result).phUser.focusUser.custom, 'keep');
  assert.equal(compat(result).phUser.focusUser.diagram.scale, 2);
  assert.equal(result.universe.world, state.universe.world);
  assert.equal(compat(result).phData.metis, compat(state).phData.metis);
  assert.equal(Object.isFrozen(compat(result).phData.metis), true);
  assert.equal(rootReducer(result, typed(true)), result);
  assert.equal(rootReducer(result, { type: legacy, data: true }), result);
  const cleared = rootReducer(result, typed(false));
  assert.equal(compat(cleared).phUser.focusUser.diagram[field], false);
  assert.equal(JSON.parse(JSON.stringify(compat(cleared))).phUser.focusUser.diagram[field], false);
});

const { setUniverseFocusField, legacyFocusFieldByActionType } = load(resolve(base, 'universeSlice.ts'));
for (const [legacy, field] of Object.entries(legacyFocusFieldByActionType)) {
  test(`${field}: typed focus action and raw compatibility preserve snapshots and independent stores`, () => {
    const input = fixture();
    input.phFocus.custom = 'keep';
    const state = rootReducer(input, { type: '@@INIT' });
    const otherInput = fixture();
    const other = rootReducer(otherInput, { type: '@@INIT' });
    const otherBefore = plain(other);
    const value = { id: 'selected', name: 'selection', custom: { keep: true } };
    const before = plain(state);
    const result = rootReducer(state, setUniverseFocusField({ field, value }));
    const compatible = rootReducer(state, { type: legacy, data: value });
    assert.deepEqual(plain(compat(result).phFocus), { ...plain(state.universe.world.focus), [field]: plain(value) });
    assert.deepEqual(plain(compat(result).phFocus), plain(compat(compatible).phFocus));
    assert.deepEqual(plain(state), before);
    assert.equal(compat(result).phFocus, result.universe.world.focus);
    assert.equal(compat(result).phData.metis, compat(state).phData.metis);
    assert.equal(compat(result).phUser, compat(state).phUser);
    assert.equal(compat(result).phFocus.custom, 'keep');
    assert.equal(Object.isFrozen(value), true);
    assert.equal(Object.isFrozen(compat(result).phData.metis), true);
    assert.equal(rootReducer(result, setUniverseFocusField({ field, value })), result);
    assert.equal(rootReducer(result, { type: legacy, data: value }), result);
    assert.deepEqual(plain(other), otherBefore);
    const cleared = rootReducer(result, setUniverseFocusField({ field, value: null }));
    assert.equal(compat(cleared).phFocus[field], null);
    assert.equal(JSON.parse(JSON.stringify(compat(cleared))).phFocus[field], null);
  });
}

const sessionActions = load(resolve(base, 'universeSlice.ts'));
for (const [typed, raw, value, select] of [
  [sessionActions.setUniverseFocus, 'SET_FOCUS_PHFOCUS', { custom: 'new focus' }, state => compat(state).phFocus],
  [sessionActions.setUniverseFocusUser, 'SET_FOCUS_USER', { id: 'user', unknown: 'keep' }, state => compat(state).phUser.focusUser],
  [sessionActions.setUniverseVisibleContext, 'SET_VISIBLE_CONTEXT', false, state => compat(state).phUser.appSkin.visibleContext],
]) test(`${raw}: typed/raw session ownership preserves immutable snapshots and no-op identity`, () => {
  const input = fixture();
  input.phUser = { name: 'keep', appSkin: { theme: 'keep', visibleContext: true }, focusUser: { id: 'old' } };
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  freeze(value);
  const before = plain(state);
  const result = rootReducer(state, typed(value));
  const compatible = rootReducer(state, { type: raw, data: value });
  assert.deepEqual(plain(select(result)), plain(value));
  assert.deepEqual(plain(result), plain(compatible));
  assert.deepEqual(plain(state), before);
  assert.equal(compat(result).phData.metis, compat(state).phData.metis);
  assert.equal(compat(result).phUser.name, 'keep');
  assert.equal(compat(result).phUser.appSkin.theme, 'keep');
  assert.equal(rootReducer(result, typed(value)), result);
  assert.equal(rootReducer(result, { type: raw, data: value }), result);
});
test('whole-focus clearing removes stale compatibility focus and remains cleared across later actions', () => {
  const input = fixture();
  const state = rootReducer(input, { type: '@@INIT' });
  for (const action of [sessionActions.setUniverseFocus(null), { type: 'SET_FOCUS_PHFOCUS', data: null }]) {
    const cleared = rootReducer(state, action);
    assert.equal(cleared.universe.world.focus, null);
    assert.equal(compat(cleared).phFocus, null);
    assert.equal(JSON.parse(JSON.stringify(compat(cleared))).phFocus, null);
    assert.equal(rootReducer(cleared, action), cleared);
    const next = rootReducer(cleared, sessionActions.setUniverseVisibleContext(false));
    assert.equal(compat(next).phFocus, null);
    assert.equal(next.universe.world.focus, null);
  }
});

for (const [typed, raw, views] of [
  [sessionActions.reorderUniverseModels, 'REORDER_MODELS', false],
  [sessionActions.reorderUniverseModelviews, 'REORDER_MODELVIEWS', true],
]) test(`${raw}: typed/raw reordering preserves focus, records, geometry and invalid no-op identity`, () => {
  const input = fixture();
  const first = input.phData.metis.models[0];
  first.modelviews.push({ id: 'third', objectviews: [], relshipviews: [], custom: 'keep' });
  input.phData.metis.models.push({ id: 'second-model', modelviews: [], custom: 'keep' }, { id: 'third-model', modelviews: [] });
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const before = plain(state);
  const getItems = root => views ? compat(root).phData.metis.models[0].modelviews : compat(root).phData.metis.models;
  const items = getItems(state);
  const move = { sourceId: items[0].id, targetId: items[2].id };
  const result = rootReducer(state, typed(move));
  const compatible = rootReducer(state, { type: raw, data: move });
  assert.deepEqual(plain(getItems(result).map(item => item.id)), [items[1].id, items[2].id, items[0].id]);
  assert.deepEqual(plain(result), plain(compatible));
  assert.equal(getItems(result)[2], items[0]);
  assert.equal(compat(result).phFocus, state.universe.world.focus);
  assert.equal(compat(result).phData.metis, result.universe.world.worldModel.metis);
  assert.equal(first.modelviews[0].objectviews[0].loc, '10 20');
  assert.deepEqual(plain(state), before);
  const reversed = rootReducer(result, typed({ sourceId: items[0].id, targetId: items[1].id }));
  assert.deepEqual(plain(getItems(reversed).map(item => item.id)), plain(items.map(item => item.id)));
  for (const invalid of [{ sourceId: 'missing', targetId: items[0].id }, { sourceId: items[0].id, targetId: 'missing' }, { sourceId: items[0].id, targetId: items[0].id }]) {
    assert.equal(rootReducer(state, typed(invalid)), state);
    assert.equal(rootReducer(state, { type: raw, data: invalid }), state);
  }
  assert.equal(rootReducer(state, { type: raw }), state);
});

for (const raw of ['UPDATE_MODEL_PROPERTIES', 'UPDATE_TARGETMODEL_PROPERTIES', 'UPDATE_MODELVIEW_PROPERTIES']) test(`${raw}: typed canonical property patch preserves saved fields, collections and focus`, () => {
  const input = fixture();
  const view = raw === 'UPDATE_MODELVIEW_PROPERTIES';
  const typed = view ? sessionActions.updateUniverseModelview : sessionActions.updateUniverseModel;
  const patch = { id: view ? 'mv' : 'm', name: 'renamed', customMetadata: 'new' };
  if (view) { patch.objectviews = []; patch.relshipviews = []; }
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const before = plain(state);
  freeze(patch);
  const expectedData = plain(input.phData);
  const expectedModel = expectedData.metis.models[0];
  const durablePatch = plain(patch);
  if (view) { delete durablePatch.objectviews; delete durablePatch.relshipviews; }
  Object.assign(view ? expectedModel.modelviews[0] : expectedModel, durablePatch);
  const result = rootReducer(state, typed(patch));
  const compatible = rootReducer(state, { type: raw, data: patch });
  assert.deepEqual(plain(compat(result).phData), plain(expectedData));
  assert.deepEqual(plain(result), plain(compatible));
  const model = compat(result).phData.metis.models[0];
  const record = view ? model.modelviews[0] : model;
  assert.equal(record.name, 'renamed');
  assert.equal(record.customMetadata, 'new');
  assert.equal(model.modelviews[0].objectviews[0].loc, '10 20');
  assert.equal(model.modelviews[0].objectviews, input.phData.metis.models[0].modelviews[0].objectviews);
  assert.equal(compat(result).phFocus[view ? 'focusModelview' : 'focusModel'].name, 'renamed');
  assert.equal(compat(result).phData.metis, result.universe.world.worldModel.metis);
  assert.deepEqual(plain(state), before);
});

test('typed model edits target explicit IDs and leave unrelated models and focus untouched', () => {
  const input = fixture();
  input.phData.metis.models.push({ id: 'second', name: 'old', unknown: 'keep', modelviews: [] });
  const state = rootReducer(input, { type: '@@INIT' });
  const result = rootReducer(state, sessionActions.updateUniverseModel({ id: 'second', name: 'new' }));
  assert.equal(compat(result).phData.metis.models[0], compat(state).phData.metis.models[0]);
  assert.equal(compat(result).phData.metis.models[1].name, 'new');
  assert.equal(compat(result).phData.metis.models[1].unknown, 'keep');
  assert.equal(compat(result).phFocus, state.universe.world.focus);
  assert.equal(Object.isFrozen(compat(result).phData.metis), true);
  assert.equal(input.phData.metis.models[1].name, 'old');
});
test('typed model-view creation appends a view without importing stale collections', () => {
  const input = fixture();
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const result = rootReducer(state, sessionActions.updateUniverseModelview({ id: 'added', name: 'new view', objectviews: [{ id: 'stale' }], custom: 'keep' }));
  const views = compat(result).phData.metis.models[0].modelviews;
  assert.equal(views.length, 3);
  assert.equal(views[0], input.phData.metis.models[0].modelviews[0]);
  assert.deepEqual(plain(views[2]), { id: 'added', name: 'new view', custom: 'keep' });
});
test('typed model property actions keep empty-universe no-ops out of legacy fallback', () => {
  const input = fixture(); input.phData.metis.models = [];
  const state = rootReducer(input, { type: '@@INIT' });
  for (const [typed, raw] of [[sessionActions.updateUniverseModel, 'UPDATE_MODEL_PROPERTIES'], [sessionActions.updateUniverseModelview, 'UPDATE_MODELVIEW_PROPERTIES']]) {
    assert.equal(rootReducer(state, typed({ id: 'missing' })), state);
    assert.equal(rootReducer(state, { type: raw, data: { id: 'missing' } }), state);
  }
});

for (const id of ['r', 'added']) test(`relationship ${id}: typed/raw patches preserve endpoints, metadata and untouched records`, () => {
  const input = fixture();
  input.phData.metis.models[0].relships = [{ id: 'r', name: 'old', fromobjectRef: 'a', toobjectRef: 'b', custom: 'keep' }, { id: 'tail', name: 'tail' }];
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const patch = freeze({ id, name: 'new', customPatch: 'keep' });
  const expectedData = plain(input.phData);
  const expectedRelationships = expectedData.metis.models[0].relships;
  const index = expectedRelationships.findIndex(item => item.id === id);
  if (index < 0) expectedRelationships.push(plain(patch));
  else Object.assign(expectedRelationships[index], plain(patch));
  const result = rootReducer(state, sessionActions.updateUniverseRelationship(patch));
  const compatible = rootReducer(state, { type: 'UPDATE_RELSHIP_PROPERTIES', data: patch });
  assert.deepEqual(plain(compat(result).phData), plain(expectedData));
  assert.deepEqual(plain(result), plain(compatible));
  const relships = compat(result).phData.metis.models[0].relships;
  const record = relships.find(item => item.id === id);
  assert.equal(record.name, 'new');
  assert.equal(record.customPatch, 'keep');
  assert.equal(relships[1], input.phData.metis.models[0].relships[1]);
  assert.equal(compat(result).phData.metis.models[0].modelviews, input.phData.metis.models[0].modelviews);
  if (id === 'r') {
    assert.equal(record.fromobjectRef, 'a'); assert.equal(record.toobjectRef, 'b'); assert.equal(record.custom, 'keep');
  }
});

test('relationship property updates keep independent canonical graphs readonly and empty-state no-ops canonical', () => {
  const input = fixture();
  const state = rootReducer(input, { type: '@@INIT' });
  const result = rootReducer(state, sessionActions.updateUniverseRelationship({ id: 'r', name: 'new' }));
  assert.equal(input.phData.metis.models[0].relships.length, 0);
  assert.equal(compat(result).phData.metis.models[0].relships.length, 1);
  assert.equal(Object.isFrozen(compat(result).phData.metis), true);
  assert.equal(Object.isFrozen(compat(result).phData.metis.models[0].relships[0]), true);
  const emptyInput = fixture(); emptyInput.phData.metis.models = [];
  const empty = rootReducer(emptyInput, { type: '@@INIT' });
  assert.equal(rootReducer(empty, sessionActions.updateUniverseRelationship({ id: 'r' })), empty);
  assert.equal(rootReducer(empty, { type: 'UPDATE_RELSHIP_PROPERTIES', data: { id: 'r' } }), empty);
});

for (const name of ['new name', '', undefined]) test(`object rename ${String(name)}: legacy parity preserves explicit labels and updates inherited labels across views`, () => {
  const input = fixture();
  const model = input.phData.metis.models[0];
  model.objects = [{ id: 'o', name: 'old name', custom: 'keep' }];
  model.modelviews[0].objectviews = [undefined, null, '', 'old name', 'custom label'].map((label, index) => ({ id: `v${index}`, objectRef: 'o', name: label, loc: '10 20', size: '80 40', custom: 'keep' }));
  model.modelviews[1].objectviews.push({ id: 'second', objectRef: 'o', name: 'old name', loc: '30 40' });
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const patch = freeze({ id: 'o', name, description: 'changed' });
  const expectedData = plain(input.phData);
  Object.assign(expectedData.metis.models[0].objects[0], patch);
  if (name) {
    for (const modelview of expectedData.metis.models[0].modelviews) {
      for (const objectview of modelview.objectviews) {
        if (objectview.objectRef === 'o' && [undefined, null, '', 'old name'].includes(objectview.name)) objectview.name = name;
      }
    }
  }
  const result = rootReducer(state, sessionActions.updateUniverseObject(patch));
  assert.deepEqual(plain(compat(result).phData), plain(expectedData));
  assert.deepEqual(plain(result), plain(rootReducer(state, { type: 'UPDATE_OBJECT_PROPERTIES', data: patch })));
  const views = compat(result).phData.metis.models[0].modelviews;
  assert.equal(views[0].objectviews[4], model.modelviews[0].objectviews[4]);
  assert.equal(views[0].objectviews[4].name, 'custom label');
  assert.equal(views[0].objectviews[0].loc, '10 20');
  assert.equal(views[0].objectviews[0].size, '80 40');
  assert.equal(model.objects[0].name, 'old name');
  if (name) { assert.equal(views[0].objectviews[0].name, name); assert.equal(views[1].objectviews[1].name, name); }
  else assert.equal(views, model.modelviews);
});

test('object creation and description-only updates preserve unrelated views and keep canonical graphs readonly', () => {
  const input = fixture();
  input.phData.metis.models[0].objects = [{ id: 'o', name: 'old' }];
  const state = rootReducer(input, { type: '@@INIT' });
  const result = rootReducer(state, sessionActions.updateUniverseObject({ id: 'o', description: 'new' }));
  assert.equal(compat(result).phData.metis.models[0].modelviews, input.phData.metis.models[0].modelviews);
  assert.equal(input.phData.metis.models[0].objects[0].description, undefined);
  assert.equal(Object.isFrozen(compat(result).phData.metis), true);
  const added = rootReducer(result, sessionActions.updateUniverseObject({ id: 'added', name: 'new', unknown: 'keep' }));
  assert.equal(compat(added).phData.metis.models[0].objects.length, 2);
  assert.equal(compat(added).phData.metis.models[0].modelviews, compat(result).phData.metis.models[0].modelviews);
  assert.equal(compat(added).phData.metis.models[0].objects[1].unknown, 'keep');
});
test('object properties in an empty model list retain canonical no-op identity', () => {
  const input = fixture(); input.phData.metis.models = [];
  const state = rootReducer(input, { type: '@@INIT' });
  assert.equal(rootReducer(state, sessionActions.updateUniverseObject({ id: 'o' })), state);
  assert.equal(rootReducer(state, { type: 'UPDATE_OBJECT_PROPERTIES', data: { id: 'o' } }), state);
});

for (const [typed, raw, collection, id, patch] of [
  [sessionActions.updateUniverseObjectview, 'UPDATE_OBJECTVIEW_PROPERTIES', 'objectviews', 'ov', { loc: '50 60', size: '90 40', fillcolor: 'red' }],
  [sessionActions.updateUniverseObjectview, 'UPDATE_OBJECTVIEW_NAME', 'objectviews', 'ov', { name: 'custom view name' }],
  [sessionActions.updateUniverseRelationshipview, 'UPDATE_RELSHIPVIEW_PROPERTIES', 'relshipviews', 'rv', { points: [10, 20, 30, 40], toArrow: 'Diamond' }],
]) test(`${raw}: typed view operations preserve geometry, references and unknown properties`, () => {
  const input = fixture();
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const data = freeze({ id, ...patch });
  const result = rootReducer(state, typed(data));
  assert.deepEqual(plain(result), plain(rootReducer(state, { type: raw, data })));
  const record = compat(result).phData.metis.models[0].modelviews[0][collection][0];
  assert.equal(record.custom, 'keep');
  for (const [key, value] of Object.entries(patch)) assert.deepEqual(plain(record[key]), plain(value));
  assert.equal(compat(result).phData.metis.models[0].modelviews[1], input.phData.metis.models[0].modelviews[1]);
  if (collection === 'objectviews') assert.equal(record.objectRef, 'o');
  else { assert.equal(record.relshipRef, 'r'); assert.equal(record.fromobjviewRef, 'ov'); assert.equal(record.toobjviewRef, 'ov'); }
});

for (const [typed, raw, collection, id] of [
  [sessionActions.updateUniverseObjectview, 'UPDATE_OBJECTVIEW_PROPERTIES', 'objectviews', 'ov'],
  [sessionActions.updateUniverseRelationshipview, 'UPDATE_RELSHIPVIEW_PROPERTIES', 'relshipviews', 'rv'],
]) test(`${raw}: explicit view targeting handles normalized saved IDs without persisting routing metadata`, () => {
  const input = fixture();
  const model = input.phData.metis.models[0];
  model.modelviews[1][collection] = [{ ...model.modelviews[0][collection][0], custom: 'second' }];
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const targetId = state.universe.world.worldModel.metis.models[0].modelviews[1][collection][0].id;
  const data = freeze({ id: targetId, modelviewId: 'other', name: 'second only', fillcolor: 'blue' });
  const result = rootReducer(state, typed(data));
  assert.deepEqual(plain(result), plain(rootReducer(state, { type: raw, data })));
  const views = compat(result).phData.metis.models[0].modelviews;
  assert.equal(views[0], model.modelviews[0]);
  assert.equal(views[1][collection][0].name, 'second only');
  assert.equal(views[1][collection][0].custom, 'second');
  assert.equal(views[1][collection][0].modelviewId, undefined);
  assert.equal(views[1][collection][0].modelviewRef, undefined);
});
test('typed view inheritance prunes overrides while preserving durable geometry and no-op ownership', () => {
  const input = fixture();
  const state = rootReducer(input, { type: '@@INIT' });
  const result = rootReducer(state, sessionActions.updateUniverseObjectview({ id: 'ov', appearanceMode: 'inherit', fillcolor: 'red' }));
  const view = compat(result).phData.metis.models[0].modelviews[0].objectviews[0];
  assert.equal(view.fillcolor, undefined);
  assert.equal(view.loc, '10 20');
  assert.equal(view.custom, 'keep');
  assert.equal(Object.isFrozen(compat(result).phData.metis), true);
  const emptyInput = fixture(); emptyInput.phData.metis.models = [];
  const empty = rootReducer(emptyInput, { type: '@@INIT' });
  for (const typed of [sessionActions.updateUniverseObjectview, sessionActions.updateUniverseRelationshipview]) assert.equal(rootReducer(empty, typed({ id: 'missing' })), empty);
});

for (const [typed, raw, target] of [
  [sessionActions.updateUniverseMetamodel, 'UPDATE_METAMODEL_PROPERTIES', false],
  [sessionActions.updateUniverseTargetMetamodel, 'UPDATE_TARGETMETAMODEL_PROPERTIES', true],
]) test(`${raw}: typed patches preserve current/target metamodel selection and saved collections`, () => {
  const input = fixture();
  input.phData.metis.models[0].targetMetamodelRef = 'target';
  input.phData.metis.metamodels.push({ id: 'target', name: 'target', custom: 'keep', objecttypes: [{ id: 'type', custom: 'keep' }] });
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const patch = freeze({ id: target ? 'target' : 'mm', name: 'renamed', extra: 'new' });
  const expectedData = plain(input.phData);
  Object.assign(expectedData.metis.metamodels[target ? 1 : 0], patch);
  const result = rootReducer(state, typed(patch));
  assert.deepEqual(plain(compat(result).phData), plain(expectedData));
  assert.deepEqual(plain(result), plain(rootReducer(state, { type: raw, data: patch })));
  const index = target ? 1 : 0;
  const record = compat(result).phData.metis.metamodels[index];
  assert.equal(record.name, 'renamed');
  assert.equal(record.extra, 'new');
  assert.equal(compat(result).phData.metis.metamodels[1 - index], input.phData.metis.metamodels[1 - index]);
  assert.equal(compat(result).phData.metis.models, input.phData.metis.models);
  if (target) assert.equal(record.objecttypes, input.phData.metis.metamodels[index].objecttypes);
  else assert.equal(record.relshiptypes, input.phData.metis.metamodels[index].relshiptypes);
});

test('typed metamodel creation appends durable records and preserves the original graph', () => {
  const input = fixture();
  const state = rootReducer(input, { type: '@@INIT' });
  const patch = { id: 'added', name: 'new', custom: 'keep', objecttypes: [{ id: 'new-type' }] };
  const result = rootReducer(state, sessionActions.updateUniverseMetamodel(patch));
  assert.equal(compat(result).phData.metis.metamodels.length, 2);
  assert.equal(input.phData.metis.metamodels.length, 1);
  assert.equal(compat(result).phData.metis.metamodels[0], input.phData.metis.metamodels[0]);
  assert.deepEqual(plain(compat(result).phData.metis.metamodels[1]), patch);
  assert.equal(Object.isFrozen(compat(result).phData.metis), true);
  assert.equal(Object.isFrozen(patch.objecttypes), true);
});
test('typed target-metamodel patch follows the selected model target rather than current metamodel', () => {
  const input = fixture();
  input.phData.metis.models[0].targetMetamodelRef = 'target';
  input.phData.metis.metamodels.push({ id: 'target', name: 'old', custom: 'keep' });
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const result = rootReducer(state, sessionActions.updateUniverseTargetMetamodel({ description: 'new' }));
  assert.equal(compat(result).phData.metis.metamodels[0], input.phData.metis.metamodels[0]);
  assert.equal(compat(result).phData.metis.metamodels[1].id, 'target');
  assert.equal(compat(result).phData.metis.metamodels[1].description, 'new');
  assert.equal(compat(result).phData.metis.metamodels[1].custom, 'keep');
});

const metamodelRoutes = [
  ['UPDATE_OBJECTTYPE_PROPERTIES', 'current', 'objecttypes'],
  ['UPDATE_TARGETOBJECTTYPE_PROPERTIES', 'target', 'objecttypes'],
  ['UPDATE_OBJECTTYPEVIEW_PROPERTIES', 'current', 'objecttypeviews'],
  ['UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES', 'target', 'objecttypeviews'],
  ['UPDATE_OBJECTTYPEGEOS_PROPERTIES', 'current', 'objtypegeos'],
  ['UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES', 'target', 'objtypegeos'],
  ['UPDATE_RELSHIPTYPE_PROPERTIES', 'current', 'relshiptypes'],
  ['UPDATE_TARGETRELSHIPTYPE_PROPERTIES', 'target', 'relshiptypes'],
  ['UPDATE_RELSHIPTYPEVIEW_PROPERTIES', 'current', 'relshiptypeviews'],
  ['UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES', 'current', 'relshiptypeviews'],
  ['UPDATE_VIEWSTYLE_PROPERTIES', 'current', 'viewstyles'],
  ['UPDATE_PROPERTY_PROPERTIES', 'current', 'properties'],
  ['UPDATE_TARGETPROPERTY_PROPERTIES', 'target', 'properties'],
  ['UPDATE_DATATYPE_PROPERTIES', 'target', 'datatypes'],
  ['UPDATE_TARGETDATATYPE_PROPERTIES', 'target', 'datatypes'],
  ['UPDATE_METHOD_PROPERTIES', 'current', 'methods'],
  ['UPDATE_TARGETMETHOD_PROPERTIES', 'target', 'methods'],
  ['UPDATE_METHODTYPE_PROPERTIES', 'target', 'methodtypes'],
  ['UPDATE_VALUE_PROPERTIES', 'current', 'objecttypes'],
  ['UPDATE_TARGETVALUE_PROPERTIES', 'current', 'objecttypes'],
];
for (const [raw, scope, collection] of metamodelRoutes) test(`${raw}: typed/raw collection routes preserve characterized saved records`, () => {
  const input = fixture();
  input.phData.metis.models[0].targetMetamodelRef = 'target';
  input.phData.metis.metamodels = ['mm', 'target'].map(id => ({ id, [collection]: [{ id: 'item', name: 'old', custom: 'keep' }] }));
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const patch = freeze({ id: 'item', name: 'new', extra: 'keep' });
  const result = rootReducer(state, sessionActions.updateUniverseMetamodelItem({ scope, collection, patch }));
  assert.deepEqual(plain(result), plain(rootReducer(state, { type: raw, data: patch })));
  const expectedData = plain(input.phData);
  Object.assign(expectedData.metis.metamodels[scope === 'current' ? 0 : 1][collection][0], patch);
  assert.deepEqual(plain(compat(result).phData), expectedData);
});

for (const [raw, scope, collection] of metamodelRoutes) test(`${raw}: merges/appends preserve collection tails, independent metamodels and missing-target no-ops`, () => {
  const input = fixture();
  input.phData.metis.models[0].targetMetamodelRef = 'target';
  input.phData.metis.metamodels = ['mm', 'target'].map(id => ({ id, custom: 'keep', [collection]: [{ id: 'head' }, { id: 'item', name: 'old', unknown: 'keep' }, { id: 'tail' }] }));
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const index = scope === 'current' ? 0 : 1;
  const oldItems = input.phData.metis.metamodels[index][collection];
  const result = rootReducer(state, sessionActions.updateUniverseMetamodelItem({ scope, collection, patch: { id: 'item', name: 'new' } }));
  const metamodel = compat(result).phData.metis.metamodels[index];
  assert.equal(metamodel.custom, 'keep');
  assert.equal(metamodel[collection].length, 3);
  assert.equal(metamodel[collection][0], oldItems[0]);
  assert.equal(metamodel[collection][2], oldItems[2]);
  assert.equal(metamodel[collection][1].unknown, 'keep');
  assert.equal(metamodel[collection][1].name, 'new');
  assert.equal(oldItems[1].name, 'old');
  assert.equal(compat(result).phData.metis.metamodels[1 - index], input.phData.metis.metamodels[1 - index]);
  assert.equal(compat(result).phData.metis.models, input.phData.metis.models);
  const added = rootReducer(result, sessionActions.updateUniverseMetamodelItem({ scope, collection, patch: { id: 'added', custom: 'keep' } }));
  assert.equal(compat(added).phData.metis.metamodels[index][collection].length, 4);
  assert.deepEqual(plain(compat(added).phData.metis.metamodels[index][collection][3]), { id: 'added', custom: 'keep' });
  const missingInput = fixture(); missingInput.phData.metis.metamodels = [];
  const missing = rootReducer(missingInput, { type: '@@INIT' });
  assert.equal(rootReducer(missing, sessionActions.updateUniverseMetamodelItem({ scope, collection, patch: { id: 'item' } })), missing);
  assert.equal(rootReducer(missing, { type: raw, data: { id: 'item' } }), missing);
});

for (const [typed, raw, patch] of [
  [sessionActions.updateUniverseProject, 'UPDATE_PROJECT_PROPERTIES', { name: 'renamed', custom: 'keep' }],
  [sessionActions.setUniverseDomain, 'UPDATE_DOMAIN_PROPERTIES', { name: 'domain name', description: 'description', presentation: 'presentation' }],
  [sessionActions.setUniverseCurrentMetamodel, 'SET_CURRENT_METAMODEL', { id: 'mm' }],
]) test(`${raw}: typed/raw project operations preserve saved model collections and domain metadata`, () => {
  const input = fixture(); input.phData.domain.custom = 'keep';
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const result = rootReducer(state, typed(patch));
  assert.deepEqual(plain(result), plain(rootReducer(state, { type: raw, data: patch })));
  const expectedData = plain(input.phData);
  if (raw === 'UPDATE_DOMAIN_PROPERTIES') Object.assign(expectedData.domain, patch);
  else if (raw === 'SET_CURRENT_METAMODEL') expectedData.metis.currentMetamodelRef = patch.id;
  else Object.assign(expectedData.metis, patch);
  assert.deepEqual(plain(compat(result).phData), expectedData);
  assert.equal(compat(result).phData.metis.models, input.phData.metis.models);
  assert.equal(compat(result).phData.metis.metamodels, input.phData.metis.metamodels);
  assert.equal(compat(result).phData.domain.custom, 'keep');
});
test('unknown root actions preserve state, focus and graph identity', () => {
  const input = fixture();
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  assert.equal(rootReducer(state, { type: 'EXTERNAL/UNKNOWN' }), state);
  assert.equal(rootReducer(state, { type: 'universe/unknown' }), state);
});

test('unknown actions still initialize a canonical projection when supplied only a legacy root', () => {
  const input = fixture();
  const result = rootReducer(input, { type: 'EXTERNAL/UNKNOWN' });
  assert.ok(result.universe);
  assert.equal(result.universe.world.worldModel.metis, input.phData.metis);
});

test('partial focus load normalizes selected model/view IDs through typed and raw routes', () => {
  const input = fixture();
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const focus = freeze({ focusModel: { id: 'missing' }, focusModelview: { id: 'missing-view' }, extra: 'keep' });
  const result = rootReducer(state, sessionActions.loadUniverseFocus(focus));
  assert.deepEqual(plain(result), plain(rootReducer(state, { type: 'LOAD_TOSTORE_PHFOCUS', data: focus })));
  assert.equal(compat(result).phFocus.focusModel.id, 'm');
  assert.equal(compat(result).phFocus.focusModelview.id, 'mv');
  assert.equal(compat(result).phFocus.extra, 'keep');
  assert.equal(focus.focusModel.id, 'missing');
  assert.equal(compat(result).phData.metis, input.phData.metis);
});
for (const [typed, raw, field] of [[sessionActions.setUniverseUser, 'LOAD_TOSTORE_PHUSER', 'phUser'], [sessionActions.setUniverseSource, 'LOAD_TOSTORE_PHSOURCE', 'phSource']]) test(`${raw}: null clears compatibility state and repeated loads preserve identity`, () => {
  const input = fixture();
  const state = rootReducer(input, { type: '@@INIT' });
  const cleared = rootReducer(state, typed(null));
  assert.equal(compat(cleared)[field], null);
  assert.equal(JSON.parse(JSON.stringify(compat(cleared)))[field], null);
  assert.deepEqual(plain(cleared), plain(rootReducer(state, { type: raw, data: null })));
  assert.equal(rootReducer(cleared, typed(null)), cleared);
  assert.equal(rootReducer(cleared, { type: raw, data: null }), cleared);
  assert.equal(compat(rootReducer(cleared, sessionActions.setUniverseVisibleContext(false))).phSource, field === 'phSource' ? null : compat(state).phSource);
  assert.equal(compat(cleared).phData.metis, input.phData.metis);
});

test('partial phData refresh preserves current view geometry while explicit replacement accepts file geometry', () => {
  const input = fixture();
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const stale = plain(input.phData);
  stale.metis.models[0].modelviews[0].objectviews[0].loc = '100 200';
  stale.metis.models[0].modelviews[0].objectviews[0].name = 'new label';
  const refreshed = rootReducer(state, sessionActions.setUniversePhData(stale));
  assert.deepEqual(plain(refreshed), plain(rootReducer(state, { type: 'LOAD_TOSTORE_PHDATA', data: stale })));
  const record = compat(refreshed).phData.metis.models[0].modelviews[0].objectviews[0];
  assert.equal(record.loc, '10 20');
  assert.equal(record.name, 'new label');
  assert.equal(record.custom, 'keep');
  const replaced = rootReducer(state, sessionActions.replaceUniversePhData(stale));
  assert.equal(compat(replaced).phData.metis.models[0].modelviews[0].objectviews[0].loc, '100 200');
  assert.equal(stale.metis.models[0].modelviews[0].objectviews[0].loc, '100 200');
});

const loadCases = [
  ['legacySnapshot', 'LOAD_TOSTORE_DATA', fixture()],
  ['serverData', 'LOAD_DATA_SUCCESS', fixture().phData],
  ['githubSnapshot', 'LOAD_DATAGITHUB_SUCCESS', { data: fixture() }],
  ['model', 'LOAD_DATAMODEL_SUCCESS', { id: 'm', model: [{ id: 'm', name: 'loaded', modelviews: [] }], domain: { custom: 'keep' } }],
  ['modelList', 'LOAD_DATAMODELLIST_SUCCESS', [{ id: 'saved', unknown: 'keep' }]],
  ['newModel', 'LOAD_TOSTORE_NEWMODEL', { id: 'added', modelviews: [], unknown: 'keep', domain: { extra: 'keep' } }],
  ['modelWithNewView', 'LOAD_TOSTORE_NEWMODELVIEW', { id: 'm', unknown: 'keep', modelviews: [{ id: 'new-view', objectviews: [], relshipviews: [] }] }],
];
for (const [kind, raw, data] of loadCases) test(`${raw}: typed load results preserve existing canonical snapshot behavior`, () => {
  const input = fixture();
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  freeze(data);
  const before = plain(state);
  const result = rootReducer(state, sessionActions.loadUniverseResult({ kind, data }));
  assert.deepEqual(plain(result), plain(rootReducer(state, { type: raw, data })));
  assert.equal(compat(result).phData.metis, result.universe.world.worldModel.metis);
  assert.deepEqual(plain(state), before);
  if (kind === 'serverData' || kind === 'model') assert.equal(compat(result).phSource, 'Model server');
  if (kind === 'newModel') {
    assert.equal(compat(result).phData.metis.models.length, 2);
    assert.equal(compat(result).phData.metis.models[1].unknown, 'keep');
    assert.equal(compat(result).phData.domain.extra, 'keep');
  }
  if (kind === 'modelWithNewView') assert.equal(compat(result).phData.metis.models[0].modelviews[0].id, 'new-view');
  if (kind === 'modelList') assert.deepEqual(plain(compat(result).phList), data);
});
test('model-list load clears null compatibility list without retaining stale entries', () => {
  const input = fixture(); input.phList = [{ id: 'stale' }];
  const state = rootReducer(input, { type: '@@INIT' });
  const result = rootReducer(state, sessionActions.loadUniverseResult({ kind: 'modelList', data: null }));
  assert.equal(compat(result).phList, null);
  assert.equal(result.universe.compatibility.modelList, null);
});

test('model-result load supports replacement, append and missing-model domain updates', () => {
  const input = fixture();
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const appended = rootReducer(state, sessionActions.loadUniverseResult({ kind: 'model', data: { id: 'added', model: { id: 'added', unknown: 'keep', modelviews: [] } } }));
  assert.equal(compat(appended).phData.metis.models.length, 2);
  assert.equal(compat(appended).phData.metis.models[0], input.phData.metis.models[0]);
  assert.equal(compat(appended).phData.metis.models[1].unknown, 'keep');
  const domainOnly = rootReducer(state, sessionActions.loadUniverseResult({ kind: 'model', data: { domain: { description: 'new' } } }));
  assert.equal(compat(domainOnly).phData.metis, input.phData.metis);
  assert.equal(compat(domainOnly).phData.domain.name, 'domain');
  assert.equal(compat(domainOnly).phData.domain.description, 'new');
});
test('typed snapshot replacement loads saved geometry while background snapshot refresh keeps current geometry', () => {
  const input = fixture();
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const snapshot = fixture(); snapshot.phData.metis.models[0].modelviews[0].objectviews[0].loc = '70 80';
  const replaced = rootReducer(state, sessionActions.loadUniverseResult({ kind: 'legacySnapshot', data: snapshot }));
  const refreshed = rootReducer(state, sessionActions.loadLegacyUniverseSnapshot(snapshot));
  assert.equal(compat(replaced).phData.metis.models[0].modelviews[0].objectviews[0].loc, '70 80');
  assert.equal(compat(refreshed).phData.metis.models[0].modelviews[0].objectviews[0].loc, '10 20');
  assert.equal(replaced.unrelated, input.unrelated);
});

for (const type of ['SET_MYMETIS_MODEL', 'SET_MYMETIS_PARAMETER', 'SET_MY_GOMODEL', 'SET_MY_GOMETAMODEL', 'SET_GOJS_MODEL', 'SET_GOJS_TARGETMODEL', 'SET_GOJS_MODELOBJECTS', 'SET_GOJS_METAMODEL', 'SET_GOJS_METAMODELPALETTE', 'SET_GOJS_METAMODELMODEL', 'SET_GOJS_TARGETMETAMODEL']) test(`${type}: retired runtime writes are harmless no-ops even with cyclic instance payloads`, () => {
  const input = fixture();
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const runtime = { mutable: true }; runtime.self = runtime;
  const result = rootReducer(state, { type, data: runtime, myMetis: runtime, gojsModel: runtime });
  assert.equal(result, state);
  assert.doesNotThrow(() => JSON.stringify(result));
  assert.equal(Object.isFrozen(runtime), false);
  const initialized = rootReducer(undefined, { type, data: runtime });
  assert.ok(initialized.universe);
  assert.equal(initialized.phMymetis, undefined);
  assert.equal(initialized.phGojs, undefined);
  assert.doesNotThrow(() => JSON.stringify(initialized));
});
test('host error handling preserves the canonical model graph and independent roots', () => {
  const input = fixture();
  const state = freeze(rootReducer(input, { type: '@@INIT' }));
  const result = rootReducer(state, { type: 'FAILURE', error: 'host failure' });
  assert.equal(result.error, 'host failure');
  assert.equal(result.universe, state.universe);
  assert.equal(compat(result).phData, compat(state).phData);
  assert.equal(state.error, undefined);
});

const selectors = load(resolve(base, 'selectors.ts'));
test('canonical-only roots project all editor compatibility fields without stored mirrors', () => {
  const universe = freeze(buildUniverseStateFromLegacy(fixture()));
  const root = freeze({ universe, hostMetadata: 'keep' });
  const projected = selectors.selectMimrisCompatibilityProps(root);
  assert.equal(selectors.selectSharedUniverseState(root), universe);
  assert.equal(selectors.selectPhData(root), projected.phData);
  assert.equal(selectors.selectPhFocus(root), universe.world.focus);
  assert.equal(selectors.selectPhUser(root), universe.user);
  assert.equal(selectors.selectPhSource(root), universe.source);
  assert.equal(projected.phData.metis, universe.world.worldModel.metis);
  assert.equal(projected.phData.documents, universe.compatibility.documents);
  assert.equal(root.phData, undefined);
  assert.equal(selectors.selectMimrisCompatibilityProps({ universe, hostMetadata: 'changed' }), projected);
});
test('intentional canonical nulls cannot revive stale mirrored focus, models, user, source or lists', () => {
  const stale = fixture(); stale.phList = [{ id: 'stale' }];
  const universe = freeze({ world: { worldDefinition: { domain: null }, worldModel: { metis: null }, focus: null }, user: null, source: null, compatibility: { documents: [], modelList: null } });
  const root = freeze({ ...stale, universe });
  const projected = selectors.selectMimrisCompatibilityProps(root);
  assert.equal(projected.phData.domain, null);
  assert.equal(projected.phData.metis, null);
  assert.equal(projected.phFocus, null);
  assert.equal(projected.phUser, null);
  assert.equal(projected.phSource, null);
  assert.equal(projected.phList, null);
  assert.equal(projected.phData.documents, universe.compatibility.documents);
  assert.deepEqual(plain(buildUniverseStateFromLegacy(root)), plain(universe));
});
test('legacy-only roots still project persisted files and canonical-only rehydration retains documents', () => {
  const input = fixture(); input.phData.documents = [{ id: 'document', custom: 'keep' }];
  const projected = selectors.selectMimrisCompatibilityProps(input);
  assert.equal(projected.phData.metis, input.phData.metis);
  assert.equal(projected.phFocus, input.phFocus);
  const universe = buildUniverseStateFromLegacy(input);
  const rehydrated = buildUniverseStateFromLegacy({ universe });
  assert.equal(rehydrated.compatibility.documents, universe.compatibility.documents);
  assert.deepEqual(plain(rehydrated), plain(universe));
});

test('real Redux roots contain one canonical universe and no durable or runtime aliases', () => {
  const input = fixture();
  const runtime = {}; runtime.self = runtime;
  input.phGojs = runtime; input.phMymetis = runtime;
  const state = rootReducer(input, { type: '@@INIT' });
  for (const key of ['phData', 'phFocus', 'phUser', 'phSource', 'phList', 'phGojs', 'phMymetis', 'phMyGoModel', 'phMyGoMetamodel']) assert.equal(Object.hasOwn(state, key), false, key);
  assert.equal(state.unrelated, input.unrelated);
  assert.doesNotThrow(() => JSON.stringify(state));
  for (const action of [sessionActions.updateUniverseObject({ id: 'o', name: 'new' }), sessionActions.setUniverseFocus(null), sessionActions.setUniverseUser(null), sessionActions.loadUniverseResult({ kind: 'modelList', data: [{ id: 'm' }] })]) {
    const next = rootReducer(state, action);
    assert.ok(next.universe);
    for (const key of ['phData', 'phFocus', 'phUser', 'phSource', 'phList']) assert.equal(Object.hasOwn(next, key), false, key);
  }
});
test('unknown saved phData metadata round-trips through the canonical root and legacy file projection', () => {
  const input = fixture();
  input.phData.customVersion = 'v1'; input.phData.extension = { nested: 'keep' };
  const state = rootReducer(freeze(input), { type: '@@INIT' });
  assert.equal(state.phData, undefined);
  assert.equal(state.universe.compatibility.phDataMetadata.customVersion, 'v1');
  const saved = JSON.parse(JSON.stringify(compat(state)));
  assert.equal(saved.universe, undefined);
  assert.equal(saved.phData.customVersion, 'v1');
  assert.deepEqual(saved.phData.extension, { nested: 'keep' });
  const reopened = rootReducer(state, sessionActions.openLegacyUniverseSnapshot(saved));
  assert.deepEqual(plain(compat(reopened)), saved);
  assert.equal(reopened.phData, undefined);
  assert.equal(reopened.unrelated, state.unrelated);
});
test('partial phData metadata updates preserve unknown keys without duplicating the canonical model graph', () => {
  const input = fixture(); input.phData.extension = { custom: 'keep' };
  const state = rootReducer(input, { type: '@@INIT' });
  const result = rootReducer(state, sessionActions.setUniversePhData({ customVersion: 'v2' }));
  assert.deepEqual(plain(compat(result).phData.extension), { custom: 'keep' });
  assert.equal(compat(result).phData.customVersion, 'v2');
  assert.equal(result.universe.world.worldModel.metis, state.universe.world.worldModel.metis);
  assert.equal(result.universe.compatibility.phDataMetadata.metis, undefined);
  assert.equal(result.universe.compatibility.phDataMetadata.domain, undefined);
});

const { makeStore } = load(resolve(base, '../store.tsx'));
const { findNonSerializableValue } = nativeRequire('@reduxjs/toolkit');
test('actual Toolkit store checks representative model/session/load edits without serialization errors', () => {
  const errors = []; const previousError = console.error;
  console.error = (...args) => errors.push(args);
  try {
    const store = makeStore();
    store.dispatch(sessionActions.openLegacyUniverseSnapshot(fixture()));
    store.dispatch(sessionActions.updateUniverseObject({ id: 'o', name: 'new', custom: 'keep' }));
    store.dispatch(sessionActions.updateUniverseRelationship({ id: 'r', fromobjectRef: 'o', toobjectRef: 'o' }));
    store.dispatch(sessionActions.updateUniverseObjectview({ id: 'ov', loc: '30 40' }));
    store.dispatch(sessionActions.setUniverseFocusField({ field: 'focusObject', value: { id: 'o', name: 'new' } }));
    store.dispatch(sessionActions.loadUniverseResult({ kind: 'modelList', data: [{ id: 'm' }] }));
    assert.equal(findNonSerializableValue(store.getState()), false);
    assert.equal(store.getState().phData, undefined);
    assert.equal(compat(store.getState()).phData.metis.models[0].objects[0].name, 'new');
    assert.deepEqual(errors, []);
  } finally { console.error = previousError; }
});
test('retired cyclic runtime writes are discarded before serialization diagnostics', () => {
  const errors = []; const previousError = console.error;
  console.error = (...args) => errors.push(args);
  try {
    const store = makeStore(); const before = store.getState();
    const runtime = {}; runtime.self = runtime;
    store.dispatch({ type: 'SET_GOJS_MODEL', gojsModel: runtime });
    assert.equal(store.getState(), before);
    assert.deepEqual(errors, []);
  } finally { console.error = previousError; }
});
test('read-only store snapshots reject external mutation before dispatch', () => {
  const store = makeStore();
  store.dispatch(sessionActions.openLegacyUniverseSnapshot(fixture()));
  const model = store.getState().universe.world.worldModel.metis.models[0];
  assert.equal(Object.isFrozen(model), true);
  assert.throws(() => { model.name = 'external mutation'; }, /read only|extensible|assign/i);
  assert.doesNotThrow(() => store.dispatch({ type: 'EXTERNAL/UNKNOWN' }));
});

test('read-only updates preserve sharing and isolated editor runtimes can still mutate detached geometry', () => {
  const store = makeStore();
  store.dispatch(sessionActions.openLegacyUniverseSnapshot(fixture()));
  const before = store.getState();
  assert.equal(Object.isFrozen(before), true);
  const { hydrateEditorRuntime } = load(resolve(base, '../editorRuntime/hydrate.ts'));
  const imported = [];
  const runtime = { importData(data) { imported.push(data); data.models[0].modelviews[0].objectviews[0].loc = '90 100'; } };
  hydrateEditorRuntime(runtime, before.universe.world.worldModel.metis, false);
  assert.equal(before.universe.world.worldModel.metis.models[0].modelviews[0].objectviews[0].loc, '10 20');
  assert.equal(imported[0].models[0].modelviews[0].objectviews[0].loc, '90 100');
  store.dispatch(sessionActions.setUniverseSource('new source'));
  assert.equal(store.getState().universe.world, before.universe.world);
  assert.equal(Object.isFrozen(store.getState()), true);
  const current = store.getState();
  store.dispatch({ type: 'EXTERNAL/UNKNOWN' });
  assert.equal(store.getState(), current);
});

test('Toolkit universe reducer owns readonly finalization and preserves unknown-action identity', () => {
  assert.equal(typeof sessionActions.universeReducer.getInitialState, 'function');
  const initial = sessionActions.universeReducer.getInitialState();
  assert.equal(Object.isFrozen(initial), true);
  const state = buildUniverseStateFromLegacy(fixture());
  const next = sessionActions.universeReducer(state, sessionActions.updateUniverseObject({ id: 'o', name: 'new' }));
  assert.equal(Object.isFrozen(next), true);
  assert.equal(Object.isFrozen(next.world.worldModel.metis.models[0].objects[0]), true);
  assert.equal(sessionActions.universeReducer(next, { type: 'EXTERNAL/UNKNOWN' }), next);
  const imported = [];
  const { hydrateEditorRuntime } = load(resolve(base, '../editorRuntime/hydrate.ts'));
  hydrateEditorRuntime({ importData(data) { imported.push(data); data.models[0].objects[0].name = 'runtime-only'; } }, next.world.worldModel.metis, false);
  assert.equal(imported[0].models[0].objects[0].name, 'runtime-only');
  assert.equal(next.world.worldModel.metis.models[0].objects[0].name, 'new');
});
