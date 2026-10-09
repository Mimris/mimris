import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function setup() {
  const imports = [], exports = [], module = { exports: {} };
  const readers = Object.fromEntries(['ReadModelFromFile', 'ReadMetamodelFromFile'].map(name => [name, async (...args) => imports.push({ name, args })]));
  const writers = Object.fromEntries(['SaveAllToFile', 'SaveAllToFileDate', 'SaveModelToFile', 'SaveModelviewToFile', 'SaveMetamodelToFile'].map(name => [name, (...args) => exports.push({ name, args })]));
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./fileCommands.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, exports: module.exports, require: name => name.endsWith('ReadModelFromFile') ? readers : writers });
  return { create: module.exports.createStandaloneFileCommands, imports, exports };
}
test('file imports use current owning state, preserve dispatch receiver and hand asynchronous reads the host', async () => {
  const fixture = setup(), actions = [];
  let state = { phSource: 'A' };
  const host = { getState: () => state, dispatch(action) { assert.equal(this, host); actions.push(action); } };
  const other = { getState: () => ({ phSource: 'B' }), dispatch: () => { throw new Error('wrong host'); } };
  const commands = fixture.create(host), second = fixture.create(other), file = { name: 'project.json' };
  state = { phSource: 'A updated' };
  await commands.importFile(file, 'model');
  await second.importFile(file, 'metamodel');
  assert.equal(fixture.imports[0].name, 'ReadModelFromFile');
  assert.equal(fixture.imports[0].args[0].phSource, 'A updated');
  assert.equal(fixture.imports[1].name, 'ReadMetamodelFromFile');
  assert.equal(fixture.imports[1].args[0].phSource, 'B');
  assert.equal(fixture.imports[0].args[2].target.files[0], file);
  assert.equal(fixture.imports[0].args[3], host);
  fixture.imports[0].args[1]({ type: 'IMPORTED' });
  assert.equal(actions[0].type, 'IMPORTED');
});
test('file exports retain each existing format writer and filename arguments', () => {
  const fixture = setup(), commands = fixture.create({ getState() {}, dispatch() {} });
  const data = { preserve: true };
  for (const request of [
    { kind: 'project' }, { kind: 'project', dated: true }, { kind: 'model' }, { kind: 'modelview' }, { kind: 'metamodel' },
  ]) commands.exportJson({ ...request, data, name: 'Fixture', type: '_PR', universe: 'Universe' });
  assert.deepEqual(fixture.exports.map(call => call.name), ['SaveAllToFile', 'SaveAllToFileDate', 'SaveModelToFile', 'SaveModelviewToFile', 'SaveMetamodelToFile']);
  for (const call of fixture.exports) {
    assert.equal(call.args[0], data);
    assert.equal(call.args[1], 'Fixture');
    assert.equal(call.args[2], '_PR');
    assert.equal(call.args[3], 'Universe');
  }
});
