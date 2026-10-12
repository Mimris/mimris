import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { applyDerivedScaleToPart, syncRelationshipTextScaleForObjectView } from '@mimris/modelling-editor/gojs';

function host() {
  const diagram = new go.Diagram();
  diagram.nodeTemplate = new go.Node();
  diagram.groupTemplate = new go.Group();
  diagram.linkTemplate = new go.Link();
  diagram.model = new go.GraphLinksModel([
    { key: 'group', isGroup: true, memberscale: 2 },
    { key: 'a', objectview: { id: 'a', unknown: 'keep' } },
    { key: 'b', textscale: 2 },
  ], [{ key: 'link', from: 'a', to: 'b', unknown: 'keep' }]);
  diagram.model.linkKeyProperty = 'key';
  return diagram;
}

test('applying derived scale synchronizes live part, model and detached runtime projections', () => {
  const diagram = host(), other = host();
  const part = diagram.findNodeForKey('a'), group = diagram.findNodeForKey('group');
  const objectview = { id: 'a', unknown: 'keep' }, runtime = { objectview: { id: 'a' } };
  assert.equal(applyDerivedScaleToPart(diagram, part, group, objectview, runtime), 2);
  assert.equal(part.scale, 2);
  assert.equal(part.data.scale, 2);
  assert.equal(part.data.scale1, 2);
  assert.equal(objectview.scale, 2);
  assert.equal(runtime.scale, 2);
  assert.equal(runtime.objectview.scale, 2);
  assert.equal(part.data.objectview.unknown, 'keep');
  assert.equal(other.findNodeForKey('a').scale, 1);
});

test('relationship scales update each referenced link once and use scaled live endpoints', () => {
  const diagram = host(), part = diagram.findNodeForKey('a');
  const relation = { id: 'link', fromObjview: { id: 'a' }, toObjview: { id: 'b' }, unknown: 'keep' };
  const view = { id: 'a', inputrelviews: [relation], outputrelviews: [relation, null, {}] };
  const link = diagram.findLinkForKey('link');
  let updates = 0;
  const setDataProperty = diagram.model.setDataProperty.bind(diagram.model);
  diagram.model.setDataProperty = (data, property, value) => {
    if (data === link.data && property === 'textscale') updates++;
    setDataProperty(data, property, value);
  };
  applyDerivedScaleToPart(diagram, part, diagram.findNodeForKey('group'), view);
  assert.equal(relation.textscale, 2);
  assert.equal(link.data.textscale, 2);
  assert.equal(link.data.unknown, 'keep');
  assert.equal(updates, 1);
});

test('ungrouping restores scale one and implicit objectview fallback retains saved fields', () => {
  const diagram = host(), part = diagram.findNodeForKey('a');
  applyDerivedScaleToPart(diagram, part, diagram.findNodeForKey('group'));
  assert.equal(part.data.objectview.scale, 2);
  applyDerivedScaleToPart(diagram, part, null);
  assert.equal(part.scale, 1);
  assert.equal(part.data.scale1, 1);
  assert.equal(part.data.objectview.scale, 1);
  assert.equal(part.data.objectview.id, 'a');
  assert.equal(part.data.objectview.unknown, 'keep');
});

test('missing contexts are harmless and missing live links still update detached relation views', () => {
  assert.equal(applyDerivedScaleToPart(null, null, null), 1);
  syncRelationshipTextScaleForObjectView(null, {});
  const diagram = host();
  const relation = { id: 'missing', fromObjview: { id: 'a' }, toObjview: { id: 'b' } };
  syncRelationshipTextScaleForObjectView(diagram, { outputrelviews: [relation] });
  assert.equal(relation.textscale, 1.5);
});
