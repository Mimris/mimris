import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { bindEditorHost } from '@mimris/modelling-editor';
import { groupAllowsGrab, getMetisModels } from '@mimris/modelling-editor/gojs';

const group = () => { const result = new go.Group(); result.data = { key: 'group', objviewRef: 'view' }; return result; };
const state = allowed => ({ phData: { metis: { models: [{ modelviews: [{ objectviews: [{ id: 'view', grabIsAllowed: allowed }] }] }] } } });

test('group permissions use only the supplied host registry with saved-reference fallback', () => {
  const first = {}, second = {}, part = group();
  const releaseFirst = bindEditorHost(first, { getState: () => state(true), dispatch() {} });
  const releaseSecond = bindEditorHost(second, { getState: () => state(false), dispatch() {} });
  assert.equal(groupAllowsGrab(part, null, first), true);
  assert.equal(groupAllowsGrab(part, null, second), false);
  releaseFirst();
  assert.equal(groupAllowsGrab(part, null, first), false);
  assert.equal(groupAllowsGrab(part, null, second), false);
  releaseSecond();
});

test('runtime objectview precedence and explicit boolean flags retain existing policies', () => {
  const part = group(), editor = {};
  const release = bindEditorHost(editor, { getState: () => state(true), dispatch() {} });
  try {
    part.data.objectview = { grabIsAllowed: false };
    assert.equal(groupAllowsGrab(part, null, editor), false);
    part.data.grabIsAllowed = true;
    assert.equal(groupAllowsGrab(part, null, editor), true);
    part.data.grabIsAllowed = 'true';
    assert.equal(groupAllowsGrab(part, null, editor), false);
    part.grabIsAllowed = true;
    assert.equal(groupAllowsGrab(part, null, editor), true);
  } finally { release(); }
});

test('modelview and metis lookup retain receiver binding and identifier preference', () => {
  const part = group();
  const modelview = { findObjectView(id) { assert.equal(this, modelview); assert.equal(id, 'group'); return { grabIsAllowed: true }; } };
  assert.equal(groupAllowsGrab(part, modelview), true);
  const metis = { findObjectView(id) { assert.equal(this, metis); assert.equal(id, 'view'); return { grabIsAllowed: true }; } };
  assert.equal(groupAllowsGrab(part, null, metis), true);
  assert.equal(groupAllowsGrab(new go.Node()), false);
  assert.equal(groupAllowsGrab(null), false);
});

test('model projection filters missing entries without modifying host data', () => {
  const model = { id: 'model', unknown: 'keep' }, models = [null, model, undefined];
  assert.deepEqual(getMetisModels({ metis: { models } }), [model]);
  assert.equal(models.length, 3);
  assert.deepEqual(getMetisModels({ metis: { models: {} } }), []);
  assert.deepEqual(getMetisModels(null), []);
});
