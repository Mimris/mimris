import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterPaletteForModelview,
  isAutomaticallyDroppedSelfRelationship,
} from './modelviewPalette.js';

const nodes = [
  { key: 'goal-type', objtypeRef: 'goal-type' },
  { key: 'process-type', objtypeRef: 'process-type' },
];
const links = [
  { from: 'goal-type', to: 'goal-type', reltypeRef: 'supports-type' },
  { from: 'goal-type', to: 'process-type', reltypeRef: 'motivates-type' },
];

test('missing and empty Modelview allowlists leave the palette unrestricted', () => {
  assert.deepEqual(filterPaletteForModelview({ nodes, links, modelview: {} }), { nodes, links });
  assert.deepEqual(filterPaletteForModelview({
    nodes,
    links,
    modelview: { allowedObjectTypeRefs: [], allowedRelshipTypeRefs: [] },
  }), { nodes, links });
});

test('a non-empty object-type allowlist filters nodes and incompatible relationships', () => {
  assert.deepEqual(filterPaletteForModelview({
    nodes,
    links,
    modelview: { allowedObjectTypeRefs: ['goal-type'] },
  }), {
    nodes: [nodes[0]],
    links: [links[0]],
  });
});

test('a non-empty relationship-type allowlist further filters visible relationships', () => {
  assert.deepEqual(filterPaletteForModelview({
    nodes,
    links,
    modelview: { allowedRelshipTypeRefs: ['motivates-type'] },
  }), {
    nodes,
    links: [links[1]],
  });
});

test('only automatically dropped self-links are identified for suppression', () => {
  assert.equal(isAutomaticallyDroppedSelfRelationship({ from: 'goal', to: 'goal' }), true);
  assert.equal(isAutomaticallyDroppedSelfRelationship({ fromNode: { key: 7 }, toNode: { key: 7 } }), true);
  assert.equal(isAutomaticallyDroppedSelfRelationship({ from: 'goal', to: 'problem' }), false);
  assert.equal(isAutomaticallyDroppedSelfRelationship({ from: 'goal' }), false);
});
