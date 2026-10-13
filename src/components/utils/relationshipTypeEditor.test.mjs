import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as go from 'gojs';
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
  relationshipview.points = [100, 100, 160, 100, 160, 40, 260, 40, 260, 100, 320, 100];
  relationshipview.__manualPath = true;
  objectview.loc = '20 30'; objectview.size = '90 45'; objectview.scale = 2;
  const objectSaved = JSON.parse(JSON.stringify(new jsn.jsnObjectView(objectview)));
  const relationshipSaved = JSON.parse(JSON.stringify(new jsn.jsnRelshipView(relationshipview)));
  metis.importObjectView(objectSaved, modelview);
  metis.importRelshipView(relationshipSaved, modelview);
  const restored = modelview.findObjectView(objectview.id);
  const relRestored = modelview.findRelationshipView(relationshipview.id);
  assert.equal(restored.fillcolor, 'blue'); assert.equal(restored.loc, '20 30'); assert.equal(restored.scale, 2);
  assert.equal(relRestored.toArrow, ''); assert.equal(relRestored.strokewidth, 0);
  assert.equal(relationshipSaved.__manualPath, true);
  assert.equal(relRestored.__manualPath, true);
  assert.deepEqual(relRestored.points, relationshipSaved.points);
  const built = loadKernel('ui_buildmodels').buildGoModel(metis, model, modelview, false, false, false);
  assert.equal(built.links.length, 1);
  assert.equal(built.links[0].toArrow, ''); assert.equal(built.links[0].fromArrow, ''); assert.equal(built.links[0].strokewidth, 0);
  assert.equal(relRestored.toArrow, ''); assert.equal(relRestored.strokewidth, 0);
  assert.equal(built.links[0].__manualPath, true);
  assert.deepEqual(built.links[0].points, relationshipSaved.points);
  // Older saved paths have points but no intent marker. Keep their bends;
  // an explicit false marker still permits automatic routing.
  const legacy = { ...relationshipSaved };
  delete legacy.__manualPath;
  metis.importRelshipView(legacy, modelview);
  assert.equal(modelview.findRelationshipView(relationshipview.id).__manualPath, true);
  metis.importRelshipView({ ...relationshipSaved, __manualPath: false }, modelview);
  assert.equal(modelview.findRelationshipView(relationshipview.id).__manualPath, false);
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

test('objectview edits update rendered GoJS bindings and templates before Reload', () => {
  const { objectview, objectstyle } = appearanceSetup();
  const diagram = new go.Diagram();
  const makeNode = label => new go.Node('Auto').add(
    new go.Shape('Rectangle', { name: 'BODY' }).bind('fill', 'fillcolor'),
    new go.TextBlock(label, { name: 'LABEL' }),
  );
  diagram.nodeTemplateMap.add('original', makeNode('original'));
  diagram.nodeTemplateMap.add('alternate', makeNode('alternate'));
  const data = { key: objectview.id, template: 'original', fillcolor: 'white', objectview };
  diagram.model = new go.GraphLinksModel([data]);
  diagram.model.nodeCategoryProperty = 'template';
  const mirror = { key: objectview.id, fillcolor: 'white', template: 'original' };
  const actions = [];
  diagram.dispatch = action => actions.push(action);
  const metis = {
    myDiagram: diagram, currentNode: mirror,
    gojsModel: { findNodeByViewId: () => mirror },
    findObjectView: () => objectview,
  };
  const props = { id: 'fillcolor', obj: objectview, context: { what: 'editObjectview', myDiagram: diagram, myContext: { objectview } } };
  const change = loadKernel('ui_modal').handleInputChange;
  change(metis, props, 'blue');
  assert.equal(diagram.findNodeForKey(objectview.id).findObject('BODY').fill, 'blue');
  assert.equal(data.fillcolor, 'blue'); assert.equal(mirror.fillcolor, 'blue');
  assert.equal(objectstyle.data.fillcolor, 'white');
  assert.equal(actions[0].data.appearanceOverrides.fillcolor, 'blue');
  change(metis, { ...props, id: 'template' }, 'alternate');
  assert.equal(diagram.findNodeForKey(objectview.id).findObject('LABEL').text, 'alternate');
  assert.equal(mirror.template, 'alternate');
  assert.equal(actions[1].data.template, 'alternate');
});

test('appearance-only prop updates replace child render state after repeated edits and reset', () => {
  const source = readFileSync(new URL('../gojs/GoJSApp.tsx', import.meta.url), 'utf8');
  const start = source.indexOf('  public componentDidUpdate(prevProps: any)');
  const end = source.indexOf('  public handleOpenModal', start);
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(`class Harness { ${source.slice(start, end)} }\nmodule.exports = Harness;`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    module, go, console, debug: false,
    hasStructuralNodeArrayDiff: () => false,
    normalizeNodeCategoryData: nodes => nodes,
    mergeIncomingNodeDataWithLocalState: nodes => nodes,
  });
  const diagram = new go.Diagram();
  diagram.model = new go.GraphLinksModel([{ key: 'view', fillcolor: 'white', loc: '120 80' }]);
  const harness = new module.exports();
  const metis = { myDiagram: diagram };
  harness.state = { myMetis: metis, nodeDataArray: [{ key: 'view', fillcolor: 'white' }] };
  harness.props = { myMetis: metis, nodeDataArray: harness.state.nodeDataArray };
  harness.setState = patch => { harness.state = { ...harness.state, ...patch }; };
  for (const color of ['green', 'blue', 'white']) {
    const previous = harness.props;
    harness.props = { ...previous, nodeDataArray: [{ key: 'view', fillcolor: color }] };
    harness.componentDidUpdate(previous);
    assert.equal(harness.state.nodeDataArray[0].fillcolor, color);
    assert.equal(diagram.findNodeForKey('view').data.fillcolor, color);
    assert.equal(diagram.findNodeForKey('view').data.loc, '120 80');
  }
});

test('drop reanchors saved paths to moved ports without changing straight links or interior bends', () => {
  const source = readFileSync(new URL('../gojs/GoJSApp.tsx', import.meta.url), 'utf8');
  const start = source.indexOf('function reanchorManualLinkPoints(');
  const end = source.indexOf('function shiftManualLinkEndpointSegments(', start);
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(`${source.slice(start, end)}\nmodule.exports = reanchorManualLinkPoints;`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, go, normalizeLinkPoints: points => points });
  const reanchor = module.exports;
  const diagram = new go.Diagram();
  diagram.nodeTemplate = new go.Node('Auto', { locationSpot: go.Spot.Center }).add(
    new go.Shape('Rectangle', { width: 100, height: 60, portId: '' }),
  ).bind('location', 'loc', go.Point.parse);
  diagram.model = new go.GraphLinksModel([
    { key: 'start', loc: '100 100' }, { key: 'task', loc: '140 260' },
  ], [{ key: 'link', from: 'start', to: 'task' }]);
  diagram.nodes.each(node => node.ensureBounds());
  const link = diagram.links.first();
  const task = diagram.findNodeForKey('task');
  const old = [100, 130, 140, 230];
  task.move(new go.Point(task.position.x, task.position.y + 120));
  task.ensureBounds();
  const result = reanchor(link, old, { anchorFrom: false });
  assert.deepEqual(Array.from(result.slice(0, 2)), old.slice(0, 2));
  assert.ok(Math.abs(result[3] - task.actualBounds.top) < 1, 'arrow attaches to the moved Task');
  assert.equal(result.length, 4, 'a straight route stays straight');
  // Normal multi-segment routes retain every user-authored interior bend.
  const bent = [100, 130, 180, 170, 180, 210, 140, 230];
  const adjusted = reanchor(link, bent, { anchorFrom: false });
  assert.deepEqual(Array.from(adjusted.slice(2, -2)), bent.slice(2, -2));
});

test('stale move locks cannot restore an earlier position over a live node after Reload', () => {
  const source = readFileSync(new URL('../gojs/GoJSApp.tsx', import.meta.url), 'utf8');
  const start = source.indexOf('function getNodeIdentityAliases(');
  const end = source.indexOf('function isTransientRoutedLink(', start);
  const locks = new Map([['task-view', { loc: '140 260', until: Date.now() + 12000 }]]);
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(`${source.slice(start, end)}\nmodule.exports = mergeIncomingNodeDataWithLocalState;`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    module, go, Map, console: { log() {} },
    globalPreserveNodeStateByKey: new Map(), globalLockMovedNodeLocByKey: locks,
  });
  const merge = module.exports;
  const diagram = new go.Diagram();
  diagram.nodeTemplate = new go.Node().add(new go.Shape('Rectangle', { width: 100, height: 60 }));
  const original = { key: 'task-view', loc: '140 260', group: '', scale: 1 };
  diagram.model = new go.GraphLinksModel([original]);
  const node = diagram.findNodeForKey('task-view');
  for (const location of ['140 380', '180 500']) {
    node.location = go.Point.parse(location);
    const result = merge([{ ...original }], [{ ...original }], diagram);
    assert.equal(result[0].loc, location, 'the visible node wins over stale Redux data and an old lock');
  }
  assert.equal(merge([{ ...original, loc: '0 0' }], [], null)[0].loc, '140 260', 'a lock still protects a temporarily missing Part');
  assert.equal(merge([{ ...original, loc: '20 30', layoutRevision: 'new' }], [], diagram)[0].loc, '20 30', 'an explicit new layout remains authoritative');
});

test('location write guard accepts another live drag before the prior drop lock expires', () => {
  const source = readFileSync(new URL('../gojs/components/Diagram.tsx', import.meta.url), 'utf8');
  const start = source.indexOf('      const modelAny: any = diagram.model as any;');
  const marker = '        modelAny.__locWriteLockGuardInstalled = true;\n      }';
  const end = source.indexOf(marker, start) + marker.length;
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(`function install(diagram) { ${source.slice(start, end)} }\nmodule.exports = install;`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, Map });
  const diagram = new go.Diagram();
  diagram.nodeTemplate = new go.Node().add(new go.Shape('Rectangle', { width: 100, height: 60 }))
    .bind(new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify));
  const data = { key: 'task', loc: '100 200' };
  diagram.model = new go.GraphLinksModel([data]);
  const lock = { loc: '100 200', until: Date.now() + 3500 };
  diagram.__lockMovedNodeLocByKey = new Map([['task', lock]]);
  module.exports(diagram);
  const node = diagram.findNodeForKey('task');
  for (const location of ['100 300', '120 400']) {
    node.location = go.Point.parse(location);
    assert.equal(data.loc, location, 'two-way binding accepts the live moved position');
    assert.equal(lock.loc, location, 'the lock follows the new drag');
    diagram.model.setDataProperty(data, 'loc', '100 200');
    assert.equal(data.loc, location, 'an old incoming snapshot is still rejected');
  }
});

test('self-link drawing chooses separate edge ports and keeps ordinary links unchanged', () => {
  const module = { exports: {} };
  const source = readFileSync(new URL('../gojs/tools/SelfLinkingTool.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, exports: module.exports, require: () => go });
  const diagram = new go.Diagram();
  const $ = go.GraphObject.make;
  const portProps = { fromLinkable: true, toLinkable: true, fromLinkableSelfNode: true, toLinkableSelfNode: true, fromLinkableDuplicates: true, toLinkableDuplicates: true };
  diagram.nodeTemplate = $(go.Node, 'Spot',
    $(go.Shape, 'Rectangle', { width: 160, height: 80, portId: '', ...portProps }),
    ...[['left', go.Spot.Left], ['right', go.Spot.Right], ['top', go.Spot.Top], ['bottom', go.Spot.Bottom]].map(([side, spot]) =>
      $(go.Shape, 'Rectangle', { width: 12, height: 12, alignment: spot, portId: `edge-${side}`, fromSpot: spot, toSpot: spot, ...portProps })),
  );
  diagram.model = new go.GraphLinksModel([{ key: 'task' }, { key: 'other' }]);
  diagram.model.linkFromPortIdProperty = 'fromPort';
  diagram.model.linkToPortIdProperty = 'toPort';
  const node = diagram.findNodeForKey('task');
  const other = diagram.findNodeForKey('other');
  node.ensureBounds(); other.ensureBounds();
  other.location = new go.Point(400, 0);
  const tool = new module.exports.SelfLinkingTool();
  diagram.toolManager.linkingTool = tool;
  const start = new go.InputEvent(); start.diagram = diagram;
  start.documentPoint = node.findPort('edge-right').getDocumentPoint(go.Spot.Center);
  const end = start.copy(); end.documentPoint = node.findPort('edge-bottom').getDocumentPoint(go.Spot.Center);
  diagram.firstInput = start; diagram.lastInput = end;
  tool.originalFromNode = node; tool.originalFromPort = node.findPort('');
  assert.equal(tool.findTargetPort(true).portId, 'edge-bottom');
  const loop = tool.insertLink(node, node.findPort(''), node, node.findPort(''));
  assert.equal(loop.data.fromPort, 'edge-right');
  assert.equal(loop.data.toPort, 'edge-bottom');
  assert.equal(loop.fromNode, loop.toNode);
  const explicit = tool.insertLink(node, node.findPort('edge-right'), node, node.findPort('edge-left'));
  assert.equal(explicit.data.fromPort, 'edge-right'); assert.equal(explicit.data.toPort, 'edge-left');
  const ordinary = tool.insertLink(node, node.findPort(''), other, other.findPort(''));
  assert.equal(ordinary.data.fromPort, ''); assert.equal(ordinary.data.toPort, '');
});

test('self-link corner dragging preserves orthogonal shape and attached endpoints', () => {
  const module = { exports: {} };
  const source = readFileSync(new URL('../gojs/tools/SelfLinkReshapingTool.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, exports: module.exports, require: () => go });
  const diagram = new go.Diagram();
  diagram.nodeTemplate = new go.Node().add(new go.Shape('Rectangle', { width: 100, height: 60 }));
  diagram.model = new go.GraphLinksModel([{ key: 'task' }], [{ from: 'task', to: 'task', routing: 'Orthogonal', relshipview: { routing: 'Orthogonal' } }]);
  const link = diagram.links.first();
  const route = [new go.Point(100, 30), new go.Point(130, 30), new go.Point(150, 30), new go.Point(150, 110), new go.Point(50, 110), new go.Point(50, 60)];
  link.routing = go.Link.Orthogonal;
  link.points = new go.List().addAll(route);
  const tool = new module.exports.SelfLinkReshapingTool();
  diagram.toolManager.linkReshapingTool = tool;
  Object.defineProperty(tool, 'adornedLink', { value: link });
  const handle = new go.Shape({ segmentIndex: 3 });
  new go.Adornment().add(handle);
  tool.handle = handle;
  for (const target of [new go.Point(220, 160), new go.Point(270, 190)]) {
    assert.ok(tool.computeReshape(target).equals(target));
    tool.reshape(target);
    assert.ok(link.getPoint(3).equals(target));
    for (const index of [0, 1, 5]) assert.ok(link.getPoint(index).equals(route[index]));
    assert.equal(link.getPoint(2).x, target.x);
    assert.equal(link.getPoint(2).y, 30);
    assert.equal(link.getPoint(4).x, 50);
    assert.equal(link.getPoint(4).y, target.y);
    for (let i = 1; i < link.pointsCount; i++) {
      const a = link.getPoint(i - 1), b = link.getPoint(i);
      assert.ok(a.x === b.x || a.y === b.y, 'each segment remains horizontal or vertical');
    }
    assert.equal(link.routing, go.Link.Orthogonal);
    assert.equal(link.data.routing, 'Orthogonal');
    assert.equal(link.data.relshipview.routing, 'Orthogonal');
  }
});

test('node dragging translates every edited self-loop point and preserves the translated route for drop callbacks', () => {
  const source = readFileSync(new URL('../gojs/components/Diagram.tsx', import.meta.url), 'utf8');
  const start = source.indexOf('private keepLinkRoutesDuringDrag()');
  const end = source.indexOf('private restoreLaneContentAfterLayout(', start);
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(`class Harness { ${source.slice(start, end)} }\nmodule.exports = Harness;`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, go, Map });
  const diagram = new go.Diagram();
  diagram.nodeTemplate = new go.Node().add(new go.Shape('Rectangle', { width: 100, height: 60 }));
  diagram.model = new go.GraphLinksModel([{ key: 'task' }], [{ key: 'loop', from: 'task', to: 'task', relshipview: {} }]);
  diagram.model.linkKeyProperty = 'key';
  const node = diagram.findNodeForKey('task');
  node.location = new go.Point(100, 100);
  const route = [200, 130, 230, 130, 280, 130, 280, 250, 150, 250, 150, 160];
  const harness = new module.exports();
  harness.diagram = diagram;
  harness.linkRoutesAtDragStart = new Map([['loop', route]]);
  harness.linkRouteEndpointsAtDragStart = new Map([['loop', { from: node.location.copy(), to: node.location.copy() }]]);
  diagram.__manualLinkMovePreview = new Map();
  diagram.__reshapedLinkRoutes = new Map();
  for (const [dx, dy] of [[40, 60], [80, 120]]) {
    node.location = new go.Point(100 + dx, 100 + dy);
    harness.keepLinkRoutesDuringDrag();
    const expected = route.map((value, index) => value + (index % 2 === 0 ? dx : dy));
    const link = diagram.findLinkForKey('loop');
    assert.deepEqual(link.points.toArray().flatMap(p => [p.x, p.y]), expected);
    assert.deepEqual(Array.from(diagram.__translatedSelfLoopRoutes.get('loop')), expected);
    assert.deepEqual(Array.from(diagram.__reshapedLinkRoutes.get('loop')), expected);
    assert.deepEqual(Array.from(link.data.relshipview.points), expected);
  }
});

test('queued relationship saves use the translated self-loop rather than a stale drop snapshot', () => {
  const source = readFileSync(new URL('../gojs/GoJSApp.tsx', import.meta.url), 'utf8');
  const start = source.indexOf('function queueRelshipViewDispatch(');
  const end = source.indexOf('function flushQueuedDiagramDispatches(', start);
  const module = { exports: {} };
  let flush;
  vm.runInNewContext(ts.transpileModule(`${source.slice(start, end)}\nmodule.exports = queueRelshipViewDispatch;`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, Map, console, setTimeout: callback => { flush = callback; return 1; } });
  const diagram = new go.Diagram();
  diagram.model = new go.GraphLinksModel();
  const expected = [140, 160, 280, 160, 280, 310, 140, 310];
  diagram.__translatedSelfLoopRoutes = new Map([['loop', expected]]);
  const actions = [];
  module.exports({}, action => actions.push(action), { id: 'loop', points: [0, 0, 20, 20] }, diagram);
  flush();
  assert.deepEqual(Array.from(actions[0].data.points), expected);
});

test('dragging captures a fresh self-loop before GoJS can reshape its endpoints', () => {
  const source = readFileSync(new URL('../gojs/components/Diagram.tsx', import.meta.url), 'utf8');
  const start = source.indexOf('private captureManualLinkRoutesAtDragStart()');
  const end = source.indexOf('private reanchorRouteToCurrentEndpoints(', start);
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(`class Harness { ${source.slice(start, end)} }\nmodule.exports = Harness;`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, go, Map });
  const diagram = new go.Diagram();
  diagram.nodeTemplate = new go.Node().add(new go.Shape('Rectangle', { width: 100, height: 60 }));
  diagram.model = new go.GraphLinksModel([{ key: 'task' }], [{ key: 'loop', from: 'task', to: 'task', __manualPath: false, relshipview: { points: [], __manualPath: false } }]);
  diagram.model.linkKeyProperty = 'key';
  const node = diagram.findNodeForKey('task'), link = diagram.findLinkForKey('loop');
  node.ensureBounds();
  const points = [50, 60, 50, 80, 50, 140, 180, 140, 180, 30, 100, 30];
  link.points = new go.List().addAll(points.reduce((values, value, i) => {
    if (i % 2 === 0) values.push(new go.Point(value, points[i + 1]));
    return values;
  }, []));
  const harness = new module.exports();
  harness.diagram = diagram;
  harness.draggedParts = new go.Map().add(node, { point: node.location.copy() });
  harness.linkRoutesAtDragStart = new Map();
  harness.linkRouteEndpointsAtDragStart = new Map();
  harness.captureManualLinkRoutesAtDragStart();
  assert.deepEqual(Array.from(harness.linkRoutesAtDragStart.get('loop')), points);
  assert.equal(link.data.__manualPath, true);
  assert.equal(link.data.relshipview.__manualPath, true);
  assert.equal(link.adjusting, go.Link.None);
  assert.deepEqual(Array.from(link.data.relshipview.points), points);
});

test('manual self-loop adjustment stays disabled when two-way points are a GoJS List', () => {
  const source = readFileSync(new URL('../../akmm/ui_templates.ts', import.meta.url), 'utf8');
  const start = source.indexOf('function getLinkAdjusting('), end = source.indexOf('function getEffectiveLinkRouting(', start);
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(`${source.slice(start, end)}\nmodule.exports = getLinkAdjusting;`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, go });
  const points = new go.List().addAll([new go.Point(0, 0), new go.Point(100, 100)]);
  assert.equal(module.exports({ from: 'task', to: 'task', points, __manualPath: true }, go.Link.End), go.Link.None);
  assert.equal(module.exports({ from: 'task', to: 'other', points, __manualPath: true }, go.Link.End), go.Link.End);
});

test('mouse-up queue flush preserves translated loop points despite a stale queued snapshot', () => {
  const source = readFileSync(new URL('../gojs/GoJSApp.tsx', import.meta.url), 'utf8');
  const start = source.indexOf('function flushQueuedDiagramDispatches('), end = source.indexOf('function getGroupMemberScale(', start);
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(`${source.slice(start, end)}\nmodule.exports = flushQueuedDiagramDispatches;`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, Map, clearTimeout() {}, persistObjectViewPatchToMemoryState() {} });
  const expected = [140, 160, 280, 160, 280, 310, 140, 310];
  const queue = new Map([['loop', { id: 'loop', points: [0, 0, 20, 20] }]]);
  queue.__diagram = { __translatedSelfLoopRoutes: new Map([['loop', expected]]) };
  const actions = [];
  module.exports({ __queuedRelshipViewDispatches: queue, __queuedRelshipViewDispatchTimer: 1 }, action => actions.push(action));
  assert.deepEqual(Array.from(actions[0].data.points), expected);
});

test('React link reconciliation restores the captured translated loop when its live route was recalculated', () => {
  const source = readFileSync(new URL('../gojs/components/Diagram.tsx', import.meta.url), 'utf8');
  const start = source.indexOf('function normalizeLiveLinkPoints('), end = source.indexOf('interface DiagramProps', start);
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(`${source.slice(start, end)}\nmodule.exports = mergeIncomingDiagramLinkDataWithLiveState;`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, go });
  const diagram = new go.Diagram();
  diagram.nodeTemplate = new go.Node().add(new go.Shape('Rectangle', { width: 100, height: 60 }));
  diagram.model = new go.GraphLinksModel([{ key: 'task' }], [{ key: 'loop', from: 'task', to: 'task' }]);
  diagram.model.linkKeyProperty = 'key';
  const expected = [140, 160, 280, 160, 280, 310, 140, 310];
  diagram.__translatedSelfLoopRoutes = new Map([['loop', expected]]);
  const result = module.exports([{ key: 'loop', from: 'task', to: 'task', points: [0, 0, 20, 20] }], diagram);
  assert.deepEqual(Array.from(result[0].points), expected);
});

test('self-loop keeps its translated path when GoJS invalidates it after a drop', () => {
  const source = readFileSync(new URL('../gojs/tools/PreservedSelfLink.ts', import.meta.url), 'utf8');
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, exports: module.exports, require: () => go });
  const diagram = new go.Diagram();
  diagram.nodeTemplate = new go.Node('Auto').add(new go.Shape('Rectangle', { width: 200, height: 70 }));
  diagram.linkTemplate = new module.exports.PreservedSelfLink({ routing: go.Link.Orthogonal });
  diagram.model = new go.GraphLinksModel([{ key: 'task' }, { key: 'other' }], [{ key: 'loop', from: 'task', to: 'task' }]);
  diagram.model.linkKeyProperty = 'key';
  const node = diagram.findNodeForKey('task');
  node.location = new go.Point(100, 100);
  node.ensureBounds();
  const link = diagram.findLinkForKey('loop');
  const expected = [200, 170, 200, 190, 200, 260, 370, 260, 370, 135, 300, 135];
  diagram.__translatedSelfLoopRoutes = new Map([['loop', expected]]);
  link.invalidateRoute();
  link.updateRoute();
  assert.deepEqual(link.points.toArray().flatMap(p => [p.x, p.y]), expected);
  // Repeated bounds/binding invalidations must not shrink the loop either.
  node.updateTargetBindings();
  node.invalidateConnectedLinks();
  link.updateRoute();
  assert.deepEqual(link.points.toArray().flatMap(p => [p.x, p.y]), expected);
  // Rebuilding a link after Redux updates/Reload loses the in-memory map.
  // Persisted manual points must still take precedence over the router.
  diagram.__translatedSelfLoopRoutes.clear();
  link.data.__manualPath = true;
  for (const points of [expected, new go.List().addAll(expected.reduce((result, value, index) => {
    if (index % 2 === 0) result.push(new go.Point(value, expected[index + 1]));
    return result;
  }, []))]) {
    link.data.points = points;
    link.invalidateRoute();
    link.updateRoute();
    assert.deepEqual(link.points.toArray().flatMap(p => [p.x, p.y]), expected);
  }
  link.data.points = [];
  link.data.relshipview = { __manualPath: true, points: expected };
  link.invalidateRoute();
  link.updateRoute();
  assert.deepEqual(link.points.toArray().flatMap(p => [p.x, p.y]), expected);
  link.toNode = diagram.findNodeForKey('other');
  const computePoints = go.Link.prototype.computePoints;
  let ordinaryRouterCalled = false;
  try {
    go.Link.prototype.computePoints = function () { ordinaryRouterCalled = true; return false; };
    assert.equal(link.computePoints(), false);
    assert.equal(ordinaryRouterCalled, true);
  } finally {
    go.Link.prototype.computePoints = computePoints;
  }
});

test('every editable relationship template installs the self-loop route guard', () => {
  const source = readFileSync(new URL('../../akmm/ui_templates.ts', import.meta.url), 'utf8');
  for (const name of ['linkTemplate', 'linkTemplate2', 'annotationLinkTemplate', 'sequenceLinkTemplate']) {
    assert.match(source, new RegExp(`const ${name}\\s*=\\s*\\$\\(PreservedSelfLink,`), name);
  }
});
