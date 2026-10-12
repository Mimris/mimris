import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { getDragProtection } from '@mimris/modelling-editor';
import { mergeIncomingNodeDataWithLocalState as merge } from '@mimris/modelling-editor/gojs';

const host = () => {
  const diagram = new go.Diagram();
  diagram.nodeTemplate = new go.Node();
  return diagram;
};

test('active saved-alias locks preserve geometry only in their host without mutating incoming records', () => {
  const first = host(), second = host();
  const incoming = { key: 'new-key', objviewRef: 'saved', loc: '1 2', unknown: 'keep' };
  const local = { key: 'old-key', objviewRef: 'saved', loc: '40 50', group: 'parent', scale: 2, scale1: 3 };
  getDragProtection(first).locations.set('saved', { loc: '80 90', until: Date.now() + 60000 });
  assert.deepEqual(merge([incoming], [local], first)[0], { ...incoming, loc: '80 90', group: 'parent', scale: 2, scale1: 3 });
  assert.equal(merge([incoming], [local], second)[0], incoming);
  assert.equal(incoming.loc, '1 2');
});

test('expired protection is cleared and no longer overrides saved positions', () => {
  const diagram = host(), protection = getDragProtection(diagram);
  protection.preserve.set('a', Date.now() - 1);
  protection.locations.set('a', { loc: '80 90', until: Date.now() - 1 });
  const incoming = { key: 'a', loc: '1 2' };
  assert.equal(merge([incoming], [{ key: 'a', loc: '40 50' }], diagram)[0], incoming);
  assert.equal(protection.preserve.size, 0);
  assert.equal(protection.locations.size, 0);
});

test('live geometry wins until an explicit new layout revision arrives', () => {
  const diagram = host();
  diagram.model = new go.GraphLinksModel([{ key: 'live', objviewRef: 'saved', layoutRevision: 'old', group: 'parent', scale: 2 }]);
  diagram.findNodeForKey('live').location = new go.Point(40, 50);
  const incoming = { key: 'new', objviewRef: 'saved', loc: '1 2', layoutRevision: 'old', unknown: 'keep' };
  assert.equal(merge([incoming], [], diagram)[0].loc, '40 50');
  const revised = { ...incoming, layoutRevision: 'new' };
  assert.equal(merge([revised], [], diagram)[0], revised);
});

test('blank incoming names retain local defaults while explicit names and unknown fields survive', () => {
  const incoming = { key: 'a', name: '', text: '', object: { id: 'object', custom: 1 }, objectview: { id: 'view', custom: 2 }, unknown: 'keep' };
  const result = merge([incoming], [{ key: 'a', name: 'Default' }])[0];
  assert.equal(result.name, 'Default');
  assert.equal(result.text, 'Default');
  assert.equal(result.object.name, 'Default');
  assert.equal(result.objectview.custom, 2);
  assert.equal(result.unknown, 'keep');
  assert.equal(incoming.object.name, undefined);
  const named = { ...incoming, name: 'Explicit' };
  assert.equal(merge([named], [{ key: 'a', name: 'Default' }])[0], named);
});

test('a second user drag supersedes the first location lock without releasing other nodes or hosts', async () => {
  const { releaseNodeDragProtection } = await import('@mimris/modelling-editor/gojs');
  const first = host(), second = host();
  const data = { key: 'group', objviewRef: 'saved-view', object: { id: 'object' } };
  for (const diagram of [first, second]) {
    const protection = getDragProtection(diagram);
    for (const alias of ['group', 'saved-view', 'object', 'other']) {
      protection.locations.set(alias, { loc: '40 50', until: Date.now() + 12000 });
      protection.preserve.set(alias, Date.now() + 15000);
    }
  }
  assert.equal(merge([{ ...data, loc: '80 90' }], [], first)[0].loc, '40 50');
  releaseNodeDragProtection(first, data);
  assert.equal(merge([{ ...data, loc: '80 90' }], [], first)[0].loc, '80 90');
  assert.equal(getDragProtection(first).locations.has('other'), true);
  assert.equal(getDragProtection(first).preserve.has('saved-view'), false);
  assert.equal(getDragProtection(second).locations.has('group'), true);
  getDragProtection(first).locations.set('group', { loc: '80 90', until: Date.now() + 12000 });
  assert.equal(merge([{ ...data, loc: '40 50' }], [], first)[0].loc, '80 90');
});

test('standalone drag activation releases selection locks before GoJS activation', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../src/components/DiagramEditor.tsx', import.meta.url), 'utf8');
  const activation = source.slice(source.indexOf('override doActivate() {'), source.indexOf('override doDeactivate()', source.indexOf('override doActivate() {')));
  assert.ok(activation.indexOf('diagram?.selection.each(releasePart)') < activation.indexOf('super.doActivate()'));
  assert.ok(activation.includes('releaseNodeDragProtection(diagram, it.key?.data)'));
  const capture = source.slice(source.indexOf('private captureLinkRoutesAtDragStart()'), source.indexOf('private reanchorRouteToCurrentEndpoints'));
  assert.equal(capture.includes('releaseNodeDragProtection'), false);
});
