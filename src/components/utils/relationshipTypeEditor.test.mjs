import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { applyRelationshipTypeDraft, createRelationshipTypeDraft, isValidCardinality, validateRelationshipTypeDraft } from './relationshipTypeEditor.js';

const modules = new Map();
function loadKernel(name) {
  if (modules.has(name)) return modules.get(name).exports;
  const module = { exports: {} };
  modules.set(name, module);
  const source = readFileSync(new URL(`../../akmm/${name}.ts`, import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    module, exports: module.exports, console,
    require: path => {
      const dependency = path.split('/').pop();
      return ['constants', 'utilities', 'metamodeller', 'ui_gojs', 'ui_json', 'viewAppearance', 'ui_common', 'ui_buildmodels', 'ui_modal'].includes(dependency) ? loadKernel(dependency) : {};
    },
  });
  return module.exports;
}
const akm = loadKernel('metamodeller');
const jsn = loadKernel('ui_json');
const appearance = loadKernel('viewAppearance');
const gjs = loadKernel('ui_gojs');
const setup = () => {
  const types = ['a', 'b', 'c'].map(id => new akm.cxObjectType(id, id, ''));
  const type = new akm.cxRelationshipType('rel', 'supports', types[0], types[1], 'original');
  const view = new akm.cxRelationshipTypeView('view', 'supports view', type, '');
  type.typeview = view;
  types[0].addOutputreltype(type);
  types[1].addInputreltype(type);
  return { types, type, view };
};

test('editing and discarding a draft does not mutate the live definition or appearance', () => {
  const { type, view } = setup();
  const draft = createRelationshipTypeDraft(type);
  draft.name = 'changed';
  draft.strokecolor = 'blue';
  assert.equal(type.name, 'supports');
  assert.equal(view.getStrokecolor(), 'black');
});

test('cardinalities accept blank, exact, unlimited, and ordered ranges', () => {
  for (const value of ['', '0', '1', '*', '0..1', '1..*', '2..10', ' 0..* ']) assert.equal(isValidCardinality(value), true, value);
  for (const value of ['-1', '1.5', '2..1', '*..1', 'abc', '1..', '9007199254740992']) assert.equal(isValidCardinality(value), false, value);
});

test('legacy endpoint references use the repaired runtime types in the editor', () => {
  const { type } = setup();
  type.fromobjtypeRef = 'old-a';
  type.toobjtypeRef = 'old-b';
  const draft = createRelationshipTypeDraft(type);
  assert.equal(draft.fromobjtypeRef, 'a');
  assert.equal(draft.toobjtypeRef, 'b');
  assert.equal(type.fromobjtypeRef, 'old-a');
});

test('invalid drafts report errors and leave runtime objects untouched', () => {
  const { type, types } = setup();
  const draft = { ...createRelationshipTypeDraft(type), name: '', fromobjtypeRef: 'missing', cardinalityTo: '2..1', strokewidth: 0 };
  assert.deepEqual(Object.keys(validateRelationshipTypeDraft(draft, types)).sort(), ['cardinalityTo', 'fromobjtypeRef', 'name', 'strokewidth']);
  assert.ok(applyRelationshipTypeDraft(type, draft, types).errors.name);
  assert.equal(type.name, 'supports');
  assert.equal(type.fromobjtypeRef, 'a');
  types[2].markedAsDeleted = true;
  assert.ok(validateRelationshipTypeDraft({ ...createRelationshipTypeDraft(type), toobjtypeRef: 'c' }, types).toobjtypeRef);
});

test('Apply preserves IDs, updates endpoint membership, and serializes definition and appearance', () => {
  const { type, types, view } = setup();
  const unrelated = new akm.cxRelationshipType('other', 'other', types[0], types[1], '');
  types[1].addInputreltype(unrelated);
  const draft = { ...createRelationshipTypeDraft(type), name: ' depends on ', toobjtypeRef: 'c', cardinalityFrom: '0..1', cardinalityTo: '1..*', nameFrom: 'owner', nameTo: 'items', strokecolor: '#2563eb', strokewidth: '2.5', dash: 'Dashed', toArrow: 'Diamond' };
  const result = applyRelationshipTypeDraft(type, draft, types);
  assert.deepEqual(result.errors, {});
  assert.equal(type.id, 'rel');
  assert.equal(view.id, 'view');
  assert.equal(type.toObjtype.id, 'c');
  assert.equal(types[1].inputreltypes.length, 1);
  assert.equal(types[1].inputreltypes[0].id, 'other');
  assert.equal(types[2].inputreltypes[0].id, 'rel');
  applyRelationshipTypeDraft(type, draft, types);
  assert.equal(types[2].inputreltypes.length, 1);
  const savedType = JSON.parse(JSON.stringify(new jsn.jsnRelationshipType(type, true)));
  const savedView = JSON.parse(JSON.stringify(new jsn.jsnRelshipTypeView(view)));
  assert.equal(savedType.name, 'depends on');
  assert.equal(savedType.toobjtypeRef, 'c');
  assert.equal(savedType.typeviewRef, 'view');
  assert.equal(savedType.cardinalityTo, '1..*');
  assert.equal(savedView.strokecolor, '#2563eb');
  assert.equal(savedView.strokewidth, 2.5);
  assert.equal(savedView.toArrow, 'Diamond');
  // Reopen using the production importer, rather than treating JSON alone as persistence proof.
  const metis = new akm.cxMetis('project', 'project', '');
  const metamodel = new akm.cxMetaModel('mm', 'mm', '');
  for (const object of types) { metamodel.addObjectType(object); metis.addObjectType(object); }
  metis.importRelshipType(savedType, metamodel);
  const reopened = metamodel.findRelationshipType('rel');
  metis.addRelationshipType(reopened);
  metis.importRelshipTypeView(savedView, metamodel);
  assert.equal(reopened.name, 'depends on');
  assert.equal(reopened.toObjtype.id, 'c');
  assert.equal(reopened.cardinalityFrom, '0..1');
  assert.equal(reopened.typeview.getStrokecolor(), '#2563eb');
  assert.equal(reopened.typeview.getToArrow(), 'Diamond');
});

test('the legacy relationship Typeview Done handler saves a link without a matching node', () => {
  const { type, view } = setup();
  view.setStrokecolor('blue');
  view.setToArrow('Diamond');
  const selected = { key: 'link', category: 'Relationship type', reltype: type, typeview: view, from: 'node-a', to: 'node-b', relshipkind: 'Association' };
  const actions = [];
  let persisted;
  const snapshot = { phData: { metis: { metamodels: [{ id: 'mm', relshiptypeviews: [{ id: view.id, strokecolor: 'black' }] }] } } };
  const module = { exports: {} };
  const source = readFileSync(new URL('../../akmm/ui_modal.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    module, exports: module.exports,
    console: { log() {} },
    window: { sessionStorage: { getItem: () => JSON.stringify(snapshot) } },
    require: path => {
      const dependency = path.split('/').pop();
      if (dependency === 'store') return { getCurrentStore: () => null };
      if (dependency === 'memoryStateStorage') return { MEMORY_STATE_STORAGE_KEY: 'memorystate', persistMemoryState: value => { persisted = value; } };
      return ['constants', 'utilities', 'metamodeller', 'ui_gojs', 'ui_json', 'viewAppearance', 'ui_common', 'ui_buildmodels', 'ui_modal'].includes(dependency) ? loadKernel(dependency) : {};
    },
  });
  const metamodel = {
    findRelationshipType: () => type,
    findRelationshipTypeView: () => view,
    addRelationshipTypeView() {},
  };
  const diagram = {
    selection: {},
    findNodeForKey: () => null,
    findLinkForKey: () => ({ data: selected }),
    model: { setDataProperty: (data, key, value) => { data[key] = value; } },
    dispatch: action => actions.push(action),
    clearSelection() {},
  };
  const metis = { currentMetamodel: metamodel, addRelationshipTypeView() {} };
  module.exports.handleCloseModal(selected, { myMetis: metis }, { what: 'editTypeview', myDiagram: diagram, myContext: { relshiptype: type } });
  const action = actions.find(item => item.type === 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES');
  assert.ok(action, 'Done must dispatch a persisted typeview update');
  assert.equal(action.data.id, 'view');
  assert.equal(action.data.strokecolor, 'blue');
  assert.equal(action.data.toArrow, 'Diamond');
  assert.equal(selected.from, 'node-a');
  assert.equal(selected.to, 'node-b');
  assert.equal(persisted.phData.metis.metamodels[0].relshiptypeviews[0].strokecolor, 'blue');
});

function appearanceSetup() {
  const { types, type, view } = setup();
  types[0].typeview = new akm.cxObjectTypeView('object-style', 'object style', types[0], '');
  types[0].typeview.data.fillcolor = 'white';
  const object = new akm.cxObject('object', 'Object', types[0], '');
  const modelview = new akm.cxModelView('modelview', 'Model view', null, '');
  const objectview = new akm.cxObjectView('object-view', 'Object view', object, '', modelview);
  const relationship = new akm.cxRelationship('relationship', type, object, object, 'supports', '');
  const relationshipview = new akm.cxRelationshipView('relationship-view', 'supports', relationship, '');
  relationshipview.fromObjview = relationshipview.toObjview = objectview;
  return { object, objectview, relationship, relationshipview, modelview, objectstyle: types[0].typeview, relationshipstyle: view };
}

test('new instance views inherit changing type appearance and persist no copied styles', () => {
  const { objectview, relationshipview, objectstyle, relationshipstyle } = appearanceSetup();
  assert.equal(Object.keys(objectview.appearanceOverrides).length, 0);
  assert.equal(Object.keys(relationshipview.appearanceOverrides).length, 0);
  objectstyle.data.fillcolor = 'blue';
  relationshipstyle.data.strokecolor = 'red';
  // Existing code sometimes copies materialized defaults back into views.
  objectview.fillcolor = objectstyle.data.fillcolor;
  relationshipview.strokecolor = relationshipstyle.data.strokecolor;
  assert.equal(Object.keys(objectview.appearanceOverrides).length, 0);
  assert.equal(Object.keys(relationshipview.appearanceOverrides).length, 0);
  objectstyle.data.fillcolor = 'green';
  relationshipstyle.data.strokecolor = 'purple';
  assert.equal(objectview.fillcolor, 'green');
  assert.equal(relationshipview.strokecolor, 'purple');
  for (const [view, Serialized] of [[objectview, jsn.jsnObjectView], [relationshipview, jsn.jsnRelshipView]]) {
    const saved = JSON.parse(JSON.stringify(new Serialized(view)));
    assert.equal(saved.appearanceMode, 'inherit');
    assert.equal(Object.keys(saved.appearanceOverrides).length, 0);
    for (const field of appearance.appearanceFields(view)) assert.equal(Object.hasOwn(saved, field), false, field);
  }
});

test('equal, empty, zero and false overrides survive serialization and reset preserves geometry', () => {
  const { objectview, relationshipview, objectstyle, relationshipstyle } = appearanceSetup();
  objectview.loc = '20 30'; objectview.size = '90 45'; objectview.scale = 2; objectview.memberscale = 0.5; objectview.group = 'parent';
  relationshipview.points = [1, 2, 3, 4, 5, 6]; relationshipview.fromPortid = 'port-a'; relationshipview.routing = 'Normal';
  appearance.setAppearanceOverride(objectview, 'fillcolor', objectstyle.data.fillcolor);
  appearance.setAppearanceOverride(objectview, 'icon', '');
  appearance.setAppearanceOverride(objectview, 'textscale', 0);
  appearance.setAppearanceOverride(relationshipview, 'strokecolor', relationshipstyle.data.strokecolor);
  appearance.setAppearanceOverride(relationshipview, 'toArrow', '');
  appearance.setAppearanceOverride(relationshipview, 'dash', false);
  objectstyle.data.fillcolor = 'blue'; relationshipstyle.data.strokecolor = 'red';
  assert.equal(objectview.fillcolor, 'white'); assert.equal(relationshipview.strokecolor, 'black');
  for (const [view, Serialized] of [[objectview, jsn.jsnObjectView], [relationshipview, jsn.jsnRelshipView]]) {
    const saved = JSON.parse(JSON.stringify(new Serialized(view)));
    appearance.initializeAppearance(view, saved);
    assert.deepEqual(JSON.parse(JSON.stringify(view.appearanceOverrides)), saved.appearanceOverrides);
  }
  assert.equal(objectview.textscale, 0); assert.equal(relationshipview.toArrow, ''); assert.equal(relationshipview.dash, false);
  objectview.clearViewdata(); relationshipview.clearViewdata();
  assert.equal(objectview.fillcolor, 'blue'); assert.equal(relationshipview.strokecolor, 'red');
  assert.equal(objectview.loc, '20 30'); assert.equal(objectview.size, '90 45'); assert.equal(objectview.scale, 2);
  assert.equal(objectview.memberscale, 0.5); assert.equal(objectview.group, 'parent');
  assert.equal(relationshipview.fromPortid, 'port-a'); assert.equal(relationshipview.fromObjview, objectview);
  assert.deepEqual(relationshipview.points, [1, 2, 3, 4, 5, 6]);
});

test('legacy saved views retain effective appearance after type edits and another reload', () => {
  const { objectview, relationshipview, objectstyle, relationshipstyle } = appearanceSetup();
  appearance.initializeAppearance(objectview, { fillcolor: 'white', icon: '', textscale: 2 });
  appearance.initializeAppearance(relationshipview, { strokecolor: 'black', toArrow: '' });
  objectstyle.data.fillcolor = 'red'; objectstyle.data.icon = 'new-icon';
  relationshipstyle.data.strokecolor = 'blue'; relationshipstyle.data.toArrow = 'Diamond';
  const objectSaved = JSON.parse(JSON.stringify(new jsn.jsnObjectView(objectview)));
  const relationshipSaved = JSON.parse(JSON.stringify(new jsn.jsnRelshipView(relationshipview)));
  appearance.initializeAppearance(objectview, objectSaved); appearance.initializeAppearance(relationshipview, relationshipSaved);
  assert.equal(objectview.fillcolor, 'white'); assert.equal(objectview.icon, ''); assert.equal(objectview.textscale, 2);
  assert.equal(relationshipview.strokecolor, 'black'); assert.equal(relationshipview.toArrow, 'OpenTriangle');
});

test('GoJS materialization respects empty arrow overrides and zero textscale', () => {
  const { objectview, relationshipview, modelview } = appearanceSetup();
  appearance.setAppearanceOverride(objectview, 'textscale', 0);
  appearance.setAppearanceOverride(relationshipview, 'fromArrow', '');
  appearance.setAppearanceOverride(relationshipview, 'toArrow', '');
  const model = new gjs.goModel('diagram', 'diagram', modelview);
  const node = new gjs.goObjectNode(objectview.id, model, objectview);
  node.loadNodeContent(model);
  const link = new gjs.goRelshipLink(relationshipview.id, model, relationshipview);
  link.fromNode = link.toNode = node;
  link.loadLinkContent(model);
  assert.equal(node.textscale, 0);
  assert.equal(link.fromArrow, ''); assert.equal(link.toArrow, '');
});

test('production import and model building retain sparse overrides without regenerating arrows', () => {
  const { object, objectview, relationship, relationshipview, modelview, objectstyle, relationshipstyle } = appearanceSetup();
  const metis = new akm.cxMetis();
  const metamodel = new akm.cxMetaModel('metamodel', 'metamodel', '');
  const model = new akm.cxModel('model', 'model', metamodel, '');
  modelview.model = model;
  model.addModelView(modelview);
  model.addObject(object); model.addRelationship(relationship);
  metis.addObject(object); metis.addRelationship(relationship);
  metis.addObjectType(object.type); metis.addRelationshipType(relationship.type);
  metamodel.addObjectType(object.type); metamodel.addRelationshipType(relationship.type);
  metis.addObjectTypeView(objectstyle); metis.addRelationshipTypeView(relationshipstyle);
  metamodel.addObjectTypeView(objectstyle); metamodel.addRelationshipTypeView(relationshipstyle);
  appearance.setAppearanceOverride(objectview, 'fillcolor', 'blue');
  appearance.setAppearanceOverride(relationshipview, 'fromArrow', '');
  appearance.setAppearanceOverride(relationshipview, 'toArrow', '');
  appearance.setAppearanceOverride(relationshipview, 'strokewidth', 0);
  objectview.loc = '20 30'; objectview.size = '90 45'; objectview.scale = 2;
  const objectSaved = JSON.parse(JSON.stringify(new jsn.jsnObjectView(objectview)));
  const relationshipSaved = JSON.parse(JSON.stringify(new jsn.jsnRelshipView(relationshipview)));
  metis.importObjectView(objectSaved, modelview);
  metis.importRelshipView(relationshipSaved, modelview);
  const restored = modelview.findObjectView(objectview.id);
  const relRestored = modelview.findRelationshipView(relationshipview.id);
  assert.equal(restored.fillcolor, 'blue'); assert.equal(restored.loc, '20 30'); assert.equal(restored.scale, 2);
  assert.equal(relRestored.toArrow, ''); assert.equal(relRestored.strokewidth, 0);
  const built = loadKernel('ui_buildmodels').buildGoModel(metis, model, modelview, false, false, false);
  assert.equal(built.links.length, 1);
  assert.equal(built.links[0].toArrow, ''); assert.equal(built.links[0].fromArrow, ''); assert.equal(built.links[0].strokewidth, 0);
  assert.equal(relRestored.toArrow, ''); assert.equal(relRestored.strokewidth, 0);
});

test('Change Relationship Type opens its chooser after resolving endpoint types', () => {
  const source = readFileSync(new URL('../gojs/components/Diagram.tsx', import.meta.url), 'utf8');
  const start = source.indexOf('      const handleChangeRelationshipType =');
  const end = source.indexOf('      const handleDeletePart =', start);
  const { types, type } = setup();
  const relationship = { fromObject: { type: types[0] }, toObject: { type: types[1] } };
  class Link { constructor() { this.data = { category: 'Relationship', relshipRef: 'relationship' }; } }
  const modelview = {};
  const lookups = [];
  const metis = {
    currentModelview: modelview,
    currentMetamodel: {
      findObjectType: id => types.find(t => t.id === id),
      findRelationshipTypesBetweenTypes: (from, to, inherited) => { lookups.push([from.id, to.id, inherited]); return [type]; },
    },
    findRelationship: () => relationship,
    findRelationshipTypesBetweenTypes: () => [],
  };
  let opened;
  const diagram = { handleOpenModal: (choices, context) => { opened = { choices, context }; } };
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(`${source.slice(start, end)}\nmodule.exports = handleChangeRelationshipType;`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    module, myMetis: metis, go: { Link }, constants: loadKernel('constants'), utils: loadKernel('utilities'), console,
  });
  module.exports(diagram, new Link());
  assert.deepEqual(lookups, [['a', 'b', true]]);
  assert.equal(modelview.includeInheritedReltypes, true);
  assert.equal(opened.choices[0], 'supports');
  assert.equal(opened.context.title, 'Select Relationship Type');
  assert.equal(opened.context.case, 'Change Relationship type');
});

test('relationship type confirmation uses dialog identity when currentLink has been cleared', () => {
  const { type, types } = setup();
  const previous = new akm.cxRelationshipType('previous', 'previous', types[0], types[1], '');
  const rel = new akm.cxRelationship('relationship', previous, null, null, 'previous', '');
  const data = { key: 'view', relshipRef: rel.id };
  const actions = [];
  const metis = {
    currentLink: null,
    currentMetamodel: { findRelationshipTypeByName: () => type },
    currentModel: { findRelationship: () => null },
    findRelationship: id => id === rel.id ? rel : null,
  };
  const diagram = {
    selection: {}, findLinkForKey: key => key === 'view' ? { data } : null,
    model: { setDataProperty: (data, key, value) => { data[key] = value; } },
    dispatch: action => actions.push(action),
  };
  const context = {
    what: 'selectDropdown', case: 'Change Relationship type', myDiagram: diagram,
    relationshipViewRef: 'view', relationshipRef: rel.id, selected: { value: type.name },
  };
  const close = loadKernel('ui_modal').handleCloseModal;
  close([], { myMetis: metis }, context);
  assert.equal(rel.type.id, type.id);
  assert.equal(rel.name, type.name);
  assert.equal(actions[0].type, 'UPDATE_RELSHIP_PROPERTIES');
  assert.equal(actions[0].data.typeRef, type.id);
  // A removed link or dismissed choice must leave the relationship untouched.
  close([], { myMetis: metis }, { ...context, relationshipViewRef: 'removed' });
  close([], { myMetis: metis }, { ...context, selected: undefined });
  assert.equal(actions.length, 1);
});
