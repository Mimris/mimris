import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { resizeGroupWithoutMovingMembers } from '@mimris/modelling-editor/gojs';

test('container resize preserves nested member coordinates and leaves other groups alone', () => {
  const diagram = new go.Diagram();
  diagram.nodeTemplate = new go.Node().add(new go.Shape({ width: 20, height: 20 })).bindTwoWay('position', 'loc', go.Point.parse, go.Point.stringify);
  diagram.groupTemplate = new go.Group().add(new go.Shape({ width: 100, height: 100 })).bindTwoWay('position', 'loc', go.Point.parse, go.Point.stringify);
  diagram.model = new go.GraphLinksModel([
    { key: 'container', isGroup: true, loc: '10 20' },
    { key: 'nested', isGroup: true, group: 'container', loc: '30 40' },
    { key: 'child', group: 'nested', loc: '50 60', unknown: 'keep' },
    { key: 'other', loc: '400 500' },
  ]);
  const container = diagram.findNodeForKey('container');
  resizeGroupWithoutMovingMembers(container, () => {
    container.move(new go.Point(80, 90));
    container.resizeObject.desiredSize = new go.Size(200, 180);
  });
  assert.equal(diagram.findNodeForKey('nested').data.loc, '30 40');
  assert.equal(diagram.findNodeForKey('child').data.loc, '50 60');
  assert.equal(diagram.findNodeForKey('child').data.unknown, 'keep');
  assert.equal(diagram.findNodeForKey('other').data.loc, '400 500');
  assert.equal(container.resizeObject.desiredSize.width, 200);
});

test('left/top resize releases previous move locks before location reconciliation', async () => {
  const { releaseNodeDragProtection } = await import('@mimris/modelling-editor/gojs');
  const { getDragProtection } = await import('@mimris/modelling-editor');
  const diagram = new go.Diagram();
  const data = { key: 'container', objviewRef: 'saved-container', isGroup: true, loc: '100 100' };
  const protection = getDragProtection(diagram);
  protection.locations.set('container', { loc: '100 100', until: Date.now() + 12000 });
  protection.preserve.set('saved-container', Date.now() + 12000);
  releaseNodeDragProtection(diagram, data);
  assert.equal(protection.locations.has('container'), false);
  assert.equal(protection.preserve.has('saved-container'), false);
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../../../src/akmm/ui_templates.ts', import.meta.url), 'utf8');
  const tool = source.slice(source.indexOf('class LaneResizingTool extends'), source.indexOf('isLengthening()', source.indexOf('class LaneResizingTool extends')));
  assert.ok(tool.includes('public doActivate()'));
  assert.ok(tool.includes('releaseNodeDragProtection(this.diagram, this.adornedObject.part.data)'));
});
