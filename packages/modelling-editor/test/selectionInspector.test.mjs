import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSelectionInspector } from '@mimris/modelling-editor/selection-inspector';

function fixture(allowed) {
  const services = {
    runtime: { cxProperty: class {} },
    common: { getNameList: () => [], isPropIncluded: key => allowed.includes(key) },
    templates: Object.fromEntries(['getGroupTemplateNames', 'getLinkTemplateNames', 'getNodeTemplateNames', 'getFigureNames', 'getFigure2Names'].map(key => [key, () => []])),
    utilities: { createGuid: () => 'host-id', isNumeric: value => !Number.isNaN(Number(value)) },
    constants: { gojs: { C_OBJECT: 'Object', C_OBJECTVIEW: 'ObjectView', C_RELATIONSHIP: 'Relationship', C_RELSHIPVIEW: 'RelationshipView', C_OBJECTTYPE: 'ObjectType', C_OBJECTTYPEVIEW: 'ObjectTypeView', C_RELSHIPTYPE: 'RelationshipType', C_RELSHIPTYPEVIEW: 'RelationshipTypeView' }, types: { AKM_PORT: 'Port' } },
    isAppearanceField: () => false,
  };
  const typeview = { data: { memberscale: 1, groupLayout: '', template: '' } };
  const type = { name: 'Information', typeview };
  const runtime = { findRelationshipType() {}, findRelationshipTypeView() {} };
  const props = { myMetis: runtime, selectedData: { category: 'Object', memberscale: 2, groupLayout: 'LegacyLayout' }, activeTab: '0', context: { what: 'editObjectview', myContext: { objecttype: type, objecttypeview: typeview, objectview: { memberscale: 1, groupLayout: 'LegacyLayout' }, object: {} } }, onInputChange() {} };
  return { Inspector: createSelectionInspector(services), props, runtime };
}

test('packaged selection inspector preserves host row policy and saved layout values', () => {
  const first = fixture(['memberscale', 'groupLayout']);
  const second = fixture(['template']);
  const render = ({ Inspector, props }) => renderToStaticMarkup(React.createElement(Inspector, props));
  const markup = render(first);
  assert.match(markup, /id="memberscale"[^>]*value="2"/);
  assert.match(markup, /value="LegacyLayout" selected/);
  assert.doesNotMatch(markup, /id="template"/);
  assert.match(render(second), /id="template"/);
  assert.doesNotMatch(render(second), /id="memberscale"/);
  assert.notEqual(first.Inspector, second.Inspector);
  assert.notEqual(first.runtime.submodels, second.runtime.submodels);
});

test('packaged selection inspector leaves absent context empty', () => {
  const { Inspector, props } = fixture([]);
  assert.equal(renderToStaticMarkup(React.createElement(Inspector, { ...props, context: null })), '');
});
