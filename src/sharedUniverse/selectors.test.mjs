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

const loadSelectors = () => {
  const module = { exports: {} };
  vm.runInNewContext(transpileCommonJs(new URL('./selectors.ts', import.meta.url)), {
    exports: module.exports,
    module,
    require,
  }, { filename: 'selectors.ts' });
  return module.exports;
};

const { selectMimrisCompatibilityProps } = loadSelectors();

test('compatibility selector reads canonical universe before stale legacy props', () => {
  const selected = selectMimrisCompatibilityProps({
    phData: {
      domain: { name: 'Legacy domain' },
      metis: { name: 'Legacy metis' },
      documents: [{ id: 'legacy-doc' }],
    },
    phFocus: { focusModel: { id: 'legacy-model' } },
    phUser: { focusUser: { name: 'Legacy user' } },
    phSource: 'legacy-source',
    phList: ['legacy-model-list'],
    universe: {
      world: {
        worldDefinition: { domain: { name: 'Shared domain' } },
        worldModel: { metis: { name: 'Shared metis' } },
        focus: { focusModel: { id: 'shared-model' } },
      },
      user: { focusUser: { name: 'Shared user' } },
      source: 'shared-source',
      compatibility: {
        documents: [{ id: 'shared-doc' }],
        modelList: ['shared-model-list'],
      },
    },
  });

  assert.equal(selected.phData.domain.name, 'Shared domain');
  assert.equal(selected.phData.metis.name, 'Shared metis');
  assert.equal(selected.phData.documents[0].id, 'shared-doc');
  assert.equal(selected.phFocus.focusModel.id, 'shared-model');
  assert.equal(selected.phUser.focusUser.name, 'Shared user');
  assert.equal(selected.phSource, 'shared-source');
  assert.deepEqual(selected.phList, ['shared-model-list']);
});

test('compatibility selector falls back to legacy props when universe is absent', () => {
  const selected = selectMimrisCompatibilityProps({
    phData: {
      domain: { name: 'Legacy domain' },
      metis: { name: 'Legacy metis' },
      documents: [{ id: 'legacy-doc' }],
    },
    phFocus: { focusModel: { id: 'legacy-model' } },
    phUser: { focusUser: { name: 'Legacy user' } },
    phSource: 'legacy-source',
    phList: ['legacy-model-list'],
  });

  assert.equal(selected.phData.domain.name, 'Legacy domain');
  assert.equal(selected.phData.metis.name, 'Legacy metis');
  assert.equal(selected.phData.documents[0].id, 'legacy-doc');
  assert.equal(selected.phFocus.focusModel.id, 'legacy-model');
  assert.equal(selected.phUser.focusUser.name, 'Legacy user');
  assert.equal(selected.phSource, 'legacy-source');
  assert.deepEqual(selected.phList, ['legacy-model-list']);
});
