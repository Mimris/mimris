import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDiagramEditor } from '@mimris/modelling-editor/diagram';
const options = () => ({ services: { constants: { admin: { AKM_ADMIN_MODEL: 'Admin' }, gojs: { C_NODETEMPLATE: 'textAndIcon', C_LINKEMPLATE: 'linkTemplate1' } } }, components: {}, projects: {} });
const props = () => ({ myMetis: { findModelByName: () => null }, nodeDataArray: [], linkDataArray: [], modelType: 'Modelling', dispatch() {} });
test('public diagram factory retains independent runtime, state and React refs', () => {
  const First = createDiagramEditor(options()), Second = createDiagramEditor(options());
  const first = new First(props()), second = new Second(props());
  assert.notEqual(First, Second); assert.notEqual(first.state, second.state);
  assert.notEqual(first.myMetis, second.myMetis); assert.notEqual(first.diagramRef, second.diagramRef);
  assert.equal(first.myMetis.modelType, 'Modelling');
});
test('diagram package contains no application imports or host file selection implementation', () => {
  const source = readFileSync(new URL('../src/components/DiagramEditor.tsx', import.meta.url), 'utf8');
  const root = new URL('../src/', import.meta.url), file = new URL('components/DiagramEditor.tsx', root);
  for (const [, dependency] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) assert.ok(['react', 'gojs', 'gojs-react', 'regex-parser', '@mimris/modelling-core'].includes(dependency) || (dependency.startsWith('.') && new URL(dependency, file).href.startsWith(root.href)), dependency);
  assert.equal(source.includes("input.type = 'file'"), false);
  assert.equal(source.includes('URL.createObjectURL'), false);
  assert.equal(/require\s*\(/.test(source), false);
  assert.equal(source.includes('<style jsx>'), false);
});

test('focus highlighting does not rebind geometry during a live resize', async () => {
  const go = await import('gojs');
  const Editor = createDiagramEditor(options());
  const editor = new Editor(props());
  const diagram = new go.Diagram();
  diagram.currentTool = diagram.toolManager.resizingTool;
  diagram.currentTool.isActive = true;
  diagram.model.setDataProperty = () => assert.fail('no binding updates while resize is active');
  diagram.requestUpdate = () => assert.fail('no forced redraw while resize is active');
  editor.updateFocusPeerHighlight(diagram);
});
