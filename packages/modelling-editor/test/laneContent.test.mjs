import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { laneMemberGeometryPatch } from '@mimris/modelling-editor/gojs';
import { universeReducer, loadLegacyUniverseSnapshot, updateUniverseObjectview } from '@mimris/modelling-core';

test('lane restoration persists geometry without leaking circular runtime objects into saved state', () => {
  const type = { id: 'type', supertypes: [] };
  type.supertypes.push(type);
  const node = new go.Node();
  node.data = { key: 'view', group: 'lane', objectview: { id: 'view', object: { type } } };
  node.location = new go.Point(40, 80);
  const savedView = { id: 'view', objectRef: 'object', loc: '0 0', group: 'lane', custom: { keep: true } };
  const initial = universeReducer(undefined, loadLegacyUniverseSnapshot({
    phData: { metis: { models: [{ id: 'model', modelviews: [{ id: 'mv', objectviews: [savedView] }] }] } },
    phFocus: { focusModel: { id: 'model' }, focusModelview: { id: 'mv' } },
  }));
  const patch = laneMemberGeometryPatch(node);
  const next = universeReducer(initial, updateUniverseObjectview(patch));
  const reopened = JSON.parse(JSON.stringify(next));
  const view = reopened.world.worldModel.metis.models[0].modelviews[0].objectviews[0];
  assert.equal(view.loc, '40 80');
  assert.equal(view.group, 'lane');
  assert.equal(view.objectRef, 'object');
  assert.deepEqual(view.custom, { keep: true });
  assert.equal(view.object, undefined);
  assert.equal(savedView.loc, '0 0');
  node.data.group = '';
  assert.equal(laneMemberGeometryPatch(node).group, '');
  node.location = new go.Point(NaN, NaN);
  assert.equal(laneMemberGeometryPatch(node), undefined);
});
