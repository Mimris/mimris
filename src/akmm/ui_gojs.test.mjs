import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as go from 'gojs';

const load = (name, dependencies = {}) => {
  const module = { exports: {} };
  const source = readFileSync(new URL(`./${name}.ts`, import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    module, exports: module.exports,
    require: (name) => dependencies[name] || {},
    console,
  });
  return module.exports;
};
const constants = load('constants');
const { goRelshipTypeLink } = load('ui_gojs', {
  './constants': constants,
});

for (const endpoints of [{ from: undefined, to: undefined }, { from: '', to: '' }, { from: 'old-a', to: 'old-b' }]) {
  test(`relationship type styling cannot replace diagram endpoints: ${JSON.stringify(endpoints)}`, () => {
    const nodes = [{ key: 'node-a' }, { key: 'node-b' }];
    const typeview = { getData: () => ({ ...endpoints, strokecolor: 'blue' }) };
    const reltype = {
      markedAsDeleted: false,
      getName: () => 'supports', getDefaultTypeView: () => typeview,
      getFromObjType: () => ({ id: 'type-a' }),
      getToObjType: () => ({ id: 'type-b' }),
    };
    const model = { findTypeNode: (id) => nodes[id === 'type-a' ? 0 : 1] };
    const link = new goRelshipTypeLink('rel', model, reltype);
    assert.equal(link.loadLinkContent(), true);
    assert.equal(link.from, 'node-a');
    assert.equal(link.to, 'node-b');
    assert.equal(link.strokecolor, 'blue');
    const diagram = new go.Diagram();
    diagram.model = new go.GraphLinksModel(nodes, [link]);
    const rendered = diagram.findLinkForKey('rel') || diagram.links.first();
    assert.equal(rendered.fromNode.key, 'node-a');
    assert.equal(rendered.toNode.key, 'node-b');
  });
}
