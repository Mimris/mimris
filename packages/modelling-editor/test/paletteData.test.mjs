import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmptyBooleanFieldsInPlace, normalizePaletteNodeCategoryData, normalizePaletteLinkData, arePaletteArraysEquivalent } from '@mimris/modelling-editor';

test('palette normalization preserves identifiers, geometry and unknown fields while retaining category defaults', () => {
  const extra = { visible: null, title: '', isEnabled: '', includeChildren: null };
  const node = { key: 'saved-id', template: 'custom', loc: '10 20', extra };
  const nodes = normalizePaletteNodeCategoryData([node, { category: 'existing', template: 'other' }, null]);
  assert.deepEqual(nodes[0], { ...node, category: 'custom' });
  assert.equal(nodes[0].extra, extra);
  assert.deepEqual(extra, { visible: false, title: '', isEnabled: false, includeChildren: false });
  assert.equal(nodes[1].category, 'existing');
  assert.equal(nodes[2], null);
  assert.equal(normalizePaletteNodeCategoryData([{}])[0].category, 'textAndIcon');
  const link = { key: 'link-id', category: 'saved', points: [1, 2], readOnly: '' };
  assert.deepEqual(normalizePaletteLinkData([link])[0], { ...link, category: '' });
  assert.equal(link.category, 'saved');
  assert.equal(link.readOnly, false);
});

test('mutable palette normalization handles cycles and keeps non-empty boolean values unchanged', () => {
  const data = { visible: true, selectable: 'false', isEnabled: 0, description: null };
  data.children = [data, { hasValue: null }];
  assert.equal(normalizeEmptyBooleanFieldsInPlace(data), data);
  assert.equal(data.children[0], data);
  assert.equal(data.children[1].hasValue, false);
  assert.equal(data.selectable, 'false');
  assert.equal(data.isEnabled, 0);
  assert.equal(data.description, null);
});

test('palette change detection preserves shallow runtime comparison and NaN semantics', () => {
  const geometry = [1, 2];
  assert.equal(arePaletteArraysEquivalent([{ key: 'a', geometry }], [{ key: 'a', geometry }]), true);
  assert.equal(arePaletteArraysEquivalent([{ key: 'a', geometry }], [{ key: 'a', geometry: [1, 2] }]), false);
  assert.equal(arePaletteArraysEquivalent([NaN], [NaN]), true);
  assert.equal(arePaletteArraysEquivalent(undefined, []), true);
  assert.equal(arePaletteArraysEquivalent([{ key: 'a' }], [{ key: 'b' }]), false);
  assert.equal(arePaletteArraysEquivalent([{}], []), false);
});
