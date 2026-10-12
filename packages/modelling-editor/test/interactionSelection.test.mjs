import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { resolveClickedPortGraphObject, syncFocusedObjectPeerFlags } from '@mimris/modelling-editor/gojs';
test('port lookup walks panels, recognizes native node ports and bounds traversal', () => {
  const port = { data: { id: 'port', side: 'left' } };
  assert.equal(resolveClickedPortGraphObject({ panel: port }), port);
  const native = new go.Shape({ portId: 'out' });
  new go.Node().add(native);
  assert.equal(resolveClickedPortGraphObject(native), native);
  let nested = port;
  for (let i = 0; i < 8; i++) nested = { panel: nested };
  assert.equal(resolveClickedPortGraphObject(nested), null);
  assert.equal(resolveClickedPortGraphObject(null), null);
});
test('focus peers match conceptual object across saved aliases and stay within host', () => {
  const host = () => {
    const diagram = new go.Diagram(); diagram.nodeTemplate = new go.Node();
    diagram.model = new go.GraphLinksModel([{ key: 'a', object: { id: 'object' }, unknown: 'keep' }, { key: 'b', objectview: { object: { id: 'object' } } }, { key: 'c', objRef: 'other', isFocusPeer: true }]);
    return diagram;
  };
  const first = host(), second = host();
  syncFocusedObjectPeerFlags(first, 'object', 'a');
  assert.equal(first.findNodeForKey('a').data.isFocusPeer, true);
  assert.equal(first.findNodeForKey('b').data.isFocusPeer, true);
  assert.equal(first.findNodeForKey('c').data.isFocusPeer, false);
  assert.equal(first.findNodeForKey('a').data.unknown, 'keep');
  assert.equal(second.findNodeForKey('a').data.isFocusPeer, undefined);
  syncFocusedObjectPeerFlags(first, null, null);
  assert.equal(first.findNodeForKey('a').data.isFocusPeer, false);
  syncFocusedObjectPeerFlags(null, null, null);
});
