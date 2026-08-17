import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);

const transpileCommonJs = (url) => ts.transpileModule(readFileSync(url, 'utf8'), {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const loadActions = () => {
  const typesModule = { exports: {} };
  vm.runInNewContext(transpileCommonJs(new URL('./types.js', import.meta.url)), {
    exports: typesModule.exports,
    module: typesModule,
    require,
  }, { filename: 'types.js' });

  const actionsModule = { exports: {} };
  const actionsRequire = (specifier) => {
    if (specifier === './types') return typesModule.exports;
    return require(specifier);
  };
  vm.runInNewContext(transpileCommonJs(new URL('./actions.js', import.meta.url)), {
    exports: actionsModule.exports,
    module: actionsModule,
    require: actionsRequire,
  }, { filename: 'actions.js' });

  return actionsModule.exports;
};

const actions = loadActions();

const encoded = (value) => ({ value: JSON.stringify(value) });

test('persistent target metamodel action creators return defined action types', () => {
  const patch = { id: 'item-1', name: 'Item 1' };

  assert.equal(
    actions.update_targetobjecttypegeos_properties(encoded(patch)).type,
    'UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES',
  );
  assert.equal(
    actions.update_targetvalue_properties(encoded(patch)).type,
    'UPDATE_TARGETVALUE_PROPERTIES',
  );
  assert.equal(
    actions.update_relshiptypeviews_properties(encoded(patch)).type,
    'UPDATE_RELSHIPTYPEVIEW_PROPERTIES',
  );
});
