import test from 'node:test';
import assert from 'node:assert/strict';
import * as go from 'gojs';
import { getTypeDeletionBlocker } from './typeDeletionPreflight.js';
const type = { id: 'type' };
const metis = replacement => ({ findRelationshipType: () => type, getRelationshipsByType: () => [{}], findRelationshipTypeByName: () => replacement, findObjectType: () => type, getObjectsByType: () => [{}], findObjectTypeByName: () => replacement });
const check = (data, runtime) => getTypeDeletionBlocker([data], runtime, 'object', 'relationship', 'generic');
test('missing, deleted and self replacement types block reassignment before mutation', () => {
  for (const replacement of [null, { id: 'type' }, { id: 'generic', markedAsDeleted: true }]) {
    assert.ok(check({ category: 'relationship', reltype: type }, metis(replacement)));
    assert.ok(check({ category: 'object', objecttype: type }, metis(replacement)));
  }
  assert.equal(check({ category: 'relationship', reltype: type }, metis({ id: 'generic' })), undefined);
});
test('types without instances need no replacement', () => {
  const runtime = metis(null);
  runtime.getRelationshipsByType = runtime.getObjectsByType = () => [];
  assert.equal(check({ category: 'relationship', reltype: type }, runtime), undefined);
  assert.equal(check({ category: 'object', objecttype: type }, runtime), undefined);
});
test('clearing selection in GoJS SelectionDeleting cancels removal before mutation', () => {
  const diagram = new go.Diagram();
  diagram.nodeTemplate = new go.Node();
  diagram.model = new go.GraphLinksModel([{ key: 'type', unknown: 'keep' }]);
  diagram.select(diagram.findNodeForKey('type'));
  diagram.addDiagramListener('SelectionDeleting', () => diagram.clearSelection());
  diagram.commandHandler.deleteSelection();
  assert.equal(diagram.model.nodeDataArray.length, 1);
  assert.equal(diagram.model.nodeDataArray[0].unknown, 'keep');
});
