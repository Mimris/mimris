/** Validate reassignment before deletion mutates any runtime records. */
export function getTypeDeletionBlocker(items, metis, objectCategory, relationshipCategory, genericRelationshipName) {
  for (const data of items) {
    if (data?.category === relationshipCategory) {
      const type = metis.findRelationshipType(data.reltype?.id);
      if (type && metis.getRelationshipsByType(type, false)?.length > 0) {
        const replacement = metis.findRelationshipTypeByName(genericRelationshipName);
        if (!replacement || replacement.markedAsDeleted || replacement.id === type.id) {
          return 'Cannot delete this type while keeping its instances: a different active generic relationship type is required.';
        }
      }
    }
    if (data?.category === objectCategory) {
      const type = metis.findObjectType(data.objecttype?.id);
      if (type && metis.getObjectsByType(type, true)?.length > 0) {
        const replacement = metis.findObjectTypeByName('Generic');
        if (!replacement || replacement.markedAsDeleted || replacement.id === type.id) {
          return 'Cannot delete this type while keeping its instances: a different active Generic object type is required.';
        }
      }
    }
  }
  return undefined;
}
