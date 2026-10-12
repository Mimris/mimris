import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { GuidedDraggingTool, cloneDropLayoutConfig, defaultDropLayoutConfig, mergeDropLayoutConfig, resolveDropLayoutPreset } from '@mimris/modelling-editor/gojs';

test('packaged dragging tools use the host GoJS peer and isolate instance configuration', () => {
  const first = new GuidedDraggingTool(), second = new GuidedDraggingTool();
  assert.ok(first instanceof go.DraggingTool);
  first.isGuidelineEnabled = false;
  assert.equal(second.isGuidelineEnabled, true);
  const diagram = new go.Diagram();
  diagram.toolManager.draggingTool = first;
  assert.equal(first.diagram, diagram);
  assert.doesNotThrow(() => first.clearGuidelines());
});
test('packaged drop-layout configuration preserves defaults and isolates nested changes', () => {
  const first = cloneDropLayoutConfig(defaultDropLayoutConfig), second = cloneDropLayoutConfig(defaultDropLayoutConfig);
  first.grid.columns = 9;
  assert.equal(second.grid.columns, 3);
  assert.equal(defaultDropLayoutConfig.grid.columns, 3);
  const merged = mergeDropLayoutConfig(second, { grid: { columns: 2 } });
  assert.equal(merged.grid.columns, 2);
  assert.equal(merged.grid.spacingX, defaultDropLayoutConfig.grid.spacingX);
  assert.equal(resolveDropLayoutPreset('circle').pattern, 'circle');
});
