import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
function loadComponent(name, dependencies) {
  const module = { exports: {} };
  const source = readFileSync(new URL(`./${name}.tsx`, import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, { module, exports: module.exports, console, require: path => dependencies[path] ?? require(path) });
  return module.exports;
}
const modules = new Map();
function loadKernel(name) {
  if (modules.has(name)) return modules.get(name).exports;
  const module = { exports: {} };
  modules.set(name, module);
  const source = readFileSync(new URL(`../../../akmm/${name}.ts`, import.meta.url), 'utf8');
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
const gjs = loadKernel('ui_gojs');
const { InspectorRow } = loadComponent('InspectorRow', {});
const { SelectionInspector } = loadComponent('SelectionInspector', {
  './InspectorRow': { InspectorRow },
  '../../../akmm/metamodeller': akm,
  '../../../akmm/ui_common': loadKernel('ui_common'),
  '../../../akmm/ui_templates': {
    getGroupTemplateNames: () => ['groupNoPorts', 'groupWithPorts'],
    getFigureNames: () => ['Rectangle'],
  },
  '../../../akmm/utilities': loadKernel('utilities'),
  '../../../akmm/constants': loadKernel('constants'),
  '../../../akmm/viewAppearance': loadKernel('viewAppearance'),
  'cheerio/lib/api/traversing': {},
});

for (const category of ['Object', 'Container', 'Pool', 'Lane', 'Lane_w_handles']) {
  test(`${category} view editor renders appearance and container settings`, () => {
    const data = { viewkind: 'Container', fillcolor: 'white', groupLayout: 'None', memberscale: 1, grabIsAllowed: true };
    const typeview = { data: { ...data } };
    const objecttype = { name: 'Container', typeview };
    const object = { type: objecttype };
    const objectview = { ...data, object };
    const selectedData = { ...data, category };
    const props = {
      selectedData, activeTab: '0', onInputChange() {},
      myMetis: { findRelationshipType() {}, findRelationshipTypeView() {} },
      context: { what: 'editObjectview', myContext: {
        object, objectview, objecttype, objecttypeview: typeview,
        model: {}, metamodel: { findDatatypeByName() {} },
      } },
    };
    const inspector = new SelectionInspector(props);
    const rows = inspector.renderObjectDetails2([]);
    assert.deepEqual(Array.from(rows, row => row.props.id), Object.keys(data));
    assert.equal(rows.find(row => row.props.id === 'memberscale').props.disabled, false);
    assert.equal(rows.find(row => row.props.id === 'grabIsAllowed').props.value, true);
    assert.equal(selectedData.category, category, 'inspecting preserves the diagram template category');
    const html = renderToStaticMarkup(React.createElement(SelectionInspector, props));
    assert.match(html, /fillcolor/);
    assert.match(html, /groupLayout/);
    if (category === 'Container' && process.env.INSPECTOR_PREVIEW) {
      writeFileSync(process.env.INSPECTOR_PREVIEW, `<html><head><link rel="stylesheet" href="file://${process.cwd()}/node_modules/bootstrap/dist/css/bootstrap.min.css"></head><body style="padding:24px"><h4>Edit Object View: Container</h4>${html}</body></html>`);
    }
  });
}

// Use the production materializer: Container categories are template keys such as
// groupNoPorts, rather than the literal Container used in the original fixture.
for (const template of ['', 'groupWithPorts', 'customContainerTemplate']) {
  test(`materialized Container (${template || 'default template'}) opens a populated editor`, () => {
    const objecttype = new akm.cxObjectType('container-type', 'Container', '');
    const typeview = new akm.cxObjectTypeView('container-style', 'Container style', objecttype, '');
    typeview.setViewKind('Container');
    typeview.data.template = template;
    typeview.template = template;
    objecttype.typeview = typeview;
    const object = new akm.cxObject('container', 'Container', objecttype, '');
    const modelview = new akm.cxModelView('modelview', 'Model view', null, '');
    const objectview = new akm.cxObjectView('container-view', 'Container view', object, '', modelview);
    const model = new gjs.goModel('diagram', 'diagram', modelview);
    const selectedData = new gjs.goObjectNode(objectview.id, model, objectview);
    selectedData.loadNodeContent(model);
    assert.equal(selectedData.category, template || 'groupNoPorts');
    const props = {
      selectedData, activeTab: '0', onInputChange() {},
      myMetis: { findRelationshipType() {}, findRelationshipTypeView() {} },
      context: { what: 'editObjectview', myContext: {
        object, objectview, objecttype, objecttypeview: typeview,
        model: {}, metamodel: { findDatatypeByName() {} },
      } },
    };
    const rows = new SelectionInspector(props).renderObjectDetails2([]);
    assert.ok(rows?.length > 0, 'Container editor must contain fields');
    for (const field of ['fillcolor', 'groupLayout', 'grabIsAllowed', 'memberscale']) {
      assert.ok(rows.some(row => row.props.id === field), field);
    }
    const html = renderToStaticMarkup(React.createElement(SelectionInspector, props));
    assert.match(html, /groupLayout/);
    assert.equal(selectedData.category, template || 'groupNoPorts');
    if (!template && process.env.INSPECTOR_PREVIEW) {
      writeFileSync(process.env.INSPECTOR_PREVIEW, `<html><head><link rel="stylesheet" href="file://${process.cwd()}/node_modules/bootstrap/dist/css/bootstrap.min.css"></head><body style="padding:24px"><h4>Edit Object View: Container</h4>${html}</body></html>`);
    }
  });
}
