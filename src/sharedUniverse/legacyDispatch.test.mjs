import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);

const transpileCommonJs = (url) => {
  const source = readFileSync(url, 'utf8');
  return ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
};

const loadUniverseSlice = () => {
  const module = { exports: {} };
  vm.runInNewContext(transpileCommonJs(new URL('./universeSlice.ts', import.meta.url)), {
    exports: module.exports,
    module,
    require,
  }, { filename: 'universeSlice.ts' });
  return module.exports;
};

const loadLegacyDispatch = () => {
  const universeSlice = loadUniverseSlice();
  const module = { exports: {} };
  const legacyRequire = (specifier) => {
    if (specifier === './universeSlice') return universeSlice;
    return require(specifier);
  };
  vm.runInNewContext(transpileCommonJs(new URL('./legacyDispatch.ts', import.meta.url)), {
    exports: module.exports,
    module,
    require: legacyRequire,
  }, { filename: 'legacyDispatch.ts' });
  return module.exports;
};

const { dispatchUniversePhData, toSharedUniverseAction } = loadLegacyDispatch();

test('dispatchUniversePhData dispatches explicit universe phData action', () => {
  const actions = [];
  const phData = { metis: { name: 'Shared metis' } };
  dispatchUniversePhData((action) => actions.push(action), phData);

  assert.equal(actions.length, 1);
  assert.equal(actions[0].type, 'universe/setUniversePhData');
  assert.deepEqual(actions[0].payload, phData);
});

test('legacy phData load action still maps to universe phData action', () => {
  const phData = { metis: { name: 'Legacy metis' } };
  const action = toSharedUniverseAction({ type: 'LOAD_TOSTORE_PHDATA', data: phData });

  assert.equal(action.type, 'universe/setUniversePhData');
  assert.deepEqual(action.payload, phData);
});
