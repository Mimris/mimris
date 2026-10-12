import test from 'node:test';
import assert from 'node:assert/strict';
import { getSizeOptionsForType, getDefaultRoutingForRelshipType } from '@mimris/modelling-editor';
test('sizing policies retain pool, lane and process dimensions without shared mutable options', () => {
  assert.deepEqual(getSizeOptionsForType('POOL'), { minWidth: 1600, minHeight: 900 });
  assert.deepEqual(getSizeOptionsForType('Lane'), { minWidth: 1400, minHeight: 260 });
  assert.deepEqual(getSizeOptionsForType('process'), { minWidth: 920, minHeight: 560, preferredWidth: 920, preferredHeight: 560 });
  const options = getSizeOptionsForType('Pool'); options.minWidth = 1;
  assert.equal(getSizeOptionsForType('Pool').minWidth, 1600);
  assert.equal(getSizeOptionsForType('unknown'), undefined);
  assert.equal(getSizeOptionsForType(null), undefined);
});
test('relationship routing defaults retain explicit routing and unknown saved values', () => {
  for (const name of [' isFollowedBy ', 'TRIGGERS']) {
    assert.equal(getDefaultRoutingForRelshipType(name, 'Normal'), 'AvoidsNodes');
    assert.equal(getDefaultRoutingForRelshipType(name, ''), 'AvoidsNodes');
    assert.equal(getDefaultRoutingForRelshipType(name, 'Orthogonal'), 'Orthogonal');
    assert.equal(getDefaultRoutingForRelshipType(name, 'custom-routing'), 'custom-routing');
  }
  assert.equal(getDefaultRoutingForRelshipType('other', ''), 'Normal');
  assert.equal(getDefaultRoutingForRelshipType(null, 'Orthogonal'), 'Orthogonal');
});
