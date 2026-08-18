const normalizedRefs = (value) => Array.isArray(value)
  ? value
      .map((candidate) => typeof candidate === 'string' ? candidate.trim() : '')
      .filter(Boolean)
  : [];

const nodeTypeRef = (node) =>
  node?.objtypeRef ?? node?.objecttype?.id ?? node?.key;

const linkTypeRef = (link) =>
  link?.reltypeRef ?? link?.relshiptype?.id ?? link?.typeRef;

export const isAutomaticallyDroppedSelfRelationship = (link) => {
  const fromKey = link?.from ?? link?.fromNode?.key;
  const toKey = link?.to ?? link?.toNode?.key;
  return fromKey !== undefined &&
    fromKey !== null &&
    toKey !== undefined &&
    toKey !== null &&
    String(fromKey) === String(toKey);
};

export const filterPaletteForModelview = ({ nodes = [], links = [], modelview } = {}) => {
  const allowedObjectTypeRefs = normalizedRefs(modelview?.allowedObjectTypeRefs);
  const allowedObjectRefs = new Set(allowedObjectTypeRefs);
  const filteredNodes = allowedObjectRefs.size === 0
    ? nodes
    : nodes.filter((node) => allowedObjectRefs.has(nodeTypeRef(node)));
  const visibleNodeKeys = new Set(
    filteredNodes.map((node) => node?.key ?? node?.objecttype?.id ?? node?.objecttype?.key).filter(Boolean),
  );
  const allowedRelshipRefs = new Set(normalizedRefs(modelview?.allowedRelshipTypeRefs));
  const filteredLinks = links.filter((link) =>
    visibleNodeKeys.has(link?.from) &&
    visibleNodeKeys.has(link?.to) &&
    (allowedRelshipRefs.size === 0 || allowedRelshipRefs.has(linkTypeRef(link))),
  );

  return { nodes: filteredNodes, links: filteredLinks };
};
