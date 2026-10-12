import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createDiagramHostServices } from '@mimris/modelling-editor';
test('diagram services retain template receiver and constructor identity in separate hosts', () => {
  class Runtime {}
  const templates = { value: 'first', getIconSource() { return this.value; } };
  const first = createDiagramHostServices({ akm: { cxModel: Runtime }, uit: templates });
  const second = createDiagramHostServices({ uit: { getIconSource: () => 'second' } });
  assert.equal(first.akm.cxModel, Runtime);
  assert.ok(new first.akm.cxModel() instanceof Runtime);
  assert.equal(first.uit.getIconSource(), 'first');
  templates.value = 'updated';
  assert.equal(first.uit.getIconSource(), 'updated');
  assert.equal(second.uit.getIconSource(), 'second');
  assert.equal(Object.isFrozen(first), true);
});
test('diagram service contract covers transpiled runtime member access', () => {
  const source = readFileSync(new URL('../src/components/DiagramEditor.tsx', import.meta.url), 'utf8');
  const runtime = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.Preserve } }).outputText;
  const parsed = ts.createSourceFile('diagram.js', runtime, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const contract = readFileSync(new URL('../src/host/diagramServices.ts', import.meta.url), 'utf8');
  const contractParsed = ts.createSourceFile('contract.ts', contract, ts.ScriptTarget.Latest, true);
  const shape = contractParsed.statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === 'DiagramHostServices');
  const members = new Map(shape.members.map(group => [group.name.getText(contractParsed), new Set(group.type.members.map(member => member.name.getText(contractParsed)))]));
  function walk(node) {
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && members.has(node.expression.text)) assert.ok(members.get(node.expression.text).has(node.name.text), node.getText(parsed));
    ts.forEachChild(node, walk);
  }
  walk(parsed);
  assert.equal(/^import \* as .*from ['"].*akmm\//m.test(source), false);
});
