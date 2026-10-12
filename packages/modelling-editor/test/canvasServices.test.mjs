import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createCanvasHostServices } from '@mimris/modelling-editor';
test('canvas host bindings preserve constructors, receiver behavior and independent service sets', () => {
  class Runtime {}
  const firstNamespace = { value: 'first', get() { return this.value; } };
  const first = createCanvasHostServices({ akm: { Runtime }, common: firstNamespace });
  const second = createCanvasHostServices({ common: { value: 'second', get() { return this.value; } } });
  assert.equal(Object.isFrozen(first), true);
  assert.equal(first.akm.Runtime, Runtime);
  assert.ok(new first.akm.Runtime() instanceof Runtime);
  assert.equal(first.common.get(), 'first');
  firstNamespace.value = 'updated';
  assert.equal(first.common.get(), 'updated');
  assert.equal(second.common.get(), 'second');
});
test('canvas contract covers actual runtime namespace members without importing host modules', () => {
  const source = readFileSync(new URL('../src/components/ModellingCanvas.tsx', import.meta.url), 'utf8');
  const runtime = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } }).outputText;
  const parsed = ts.createSourceFile('canvas.js', runtime, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const contract = readFileSync(new URL('../src/host/canvasServices.ts', import.meta.url), 'utf8');
  const contractParsed = ts.createSourceFile('contract.ts', contract, ts.ScriptTarget.Latest, true);
  const shape = contractParsed.statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === 'CanvasHostServices');
  const members = new Map(shape.members.map(group => [group.name.getText(contractParsed), new Set(group.type.members.map(member => member.name.getText(contractParsed)))]));
  function visit(node) {
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && members.has(node.expression.text)) {
      assert.ok(members.get(node.expression.text).has(node.name.text), `${node.expression.text}.${node.name.text}`);
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  assert.equal(/from ['"].*akmm\//.test(source), false);
  assert.equal(/import .*from/.test(contract), false);
});
