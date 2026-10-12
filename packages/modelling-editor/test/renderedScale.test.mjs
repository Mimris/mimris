import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { getGroupMemberScale, getAncestorMemberScaleProduct, getDerivedScaleForGroup, getRenderedPartScale, getRenderedTextScale, getRelationshipTextScale } from '@mimris/modelling-editor/gojs';

const diagram = () => {
  const host = new go.Diagram();
  host.nodeTemplate = new go.Node();
  host.groupTemplate = new go.Group();
  host.model = new go.GraphLinksModel([
    { key: 'outer', isGroup: true, memberscale: 2 },
    { key: 'inner', isGroup: true, group: 'outer', objectview: { memberscale: '0.5' } },
    { key: 'a', textscale: 3 }, { key: 'b', textscale: 0.5 },
  ]);
  return host;
};

test('group member scale retains field precedence and rejects invalid saved values', () => {
  const group = new go.Group();
  group.data = { memberscale: '2', objectview: { memberscale: 3 }, typeview: { memberscale: 4 } };
  assert.equal(getGroupMemberScale(group), 2);
  group.data = { objectview: { memberscale: '3' }, typeview: { memberscale: 4 } };
  assert.equal(getGroupMemberScale(group), 3);
  group.data = { typeview: { memberscale: 4 } };
  assert.equal(getGroupMemberScale(group), 4);
  for (const memberscale of [0, -1, 'invalid', Infinity]) {
    group.data = { memberscale, objectview: { memberscale: 3 } };
    assert.equal(getGroupMemberScale(group), 1);
  }
  assert.equal(getGroupMemberScale(new go.Node()), 1);
  assert.equal(getGroupMemberScale(null), 1);
});

test('ancestor scaling multiplies only the supplied host hierarchy without changing persisted data', () => {
  const first = diagram(), second = diagram();
  second.findNodeForKey('outer').data.memberscale = 4;
  const inner = first.findNodeForKey('inner');
  const original = structuredClone(first.model.nodeDataArray);
  assert.equal(getAncestorMemberScaleProduct(inner), 1);
  assert.equal(getDerivedScaleForGroup(inner), 1);
  assert.equal(getDerivedScaleForGroup(second.findNodeForKey('inner')), 2);
  assert.equal(getDerivedScaleForGroup(null), 1);
  assert.deepEqual(first.model.nodeDataArray, original);
});

test('rendered text scale uses the live part scale and valid text multiplier', () => {
  const part = new go.Node();
  part.data = { scale: 9, scale1: 8, textscale: '3' };
  part.scale = 2;
  assert.equal(getRenderedPartScale(part), 2);
  assert.equal(getRenderedTextScale(part), 6);
  part.data.textscale = -1;
  assert.equal(getRenderedTextScale(part), 2);
  assert.equal(getRenderedTextScale(null), 1);
  assert.equal(getRenderedPartScale({ scale: 2 }), 1);
});

test('relationship text scale averages live endpoints and preserves missing-endpoint fallback', () => {
  const host = diagram();
  host.findNodeForKey('a').scale = 2;
  host.findNodeForKey('b').scale = 4;
  const view = { id: 'relationship', fromObjview: { id: 'a' }, toObjview: { id: 'b' }, unknown: 'keep' };
  const original = structuredClone(view);
  assert.equal(getRelationshipTextScale(host, view), 4);
  assert.equal(getRelationshipTextScale(host, { fromObjview: { id: 'a' }, toObjview: { id: 'missing' } }), 3.5);
  assert.equal(getRelationshipTextScale(null, view), 1);
  assert.equal(getRelationshipTextScale(host, null), 1);
  assert.deepEqual(view, original);
});
