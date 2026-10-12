/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
export function getNodeKey(node: any) {
  if (!node) {
    return undefined;
  }
  if (node.data && node.data.key !== undefined && node.data.key !== null) {
    return node.data.key;
  }
  if (node.key !== undefined && node.key !== null) {
    return node.key;
  }
  return undefined;
}

export function getGroupKeyFromData(data: any) {
  if (!data) {
    return null;
  }
  const groupKey = data.group;
  if (groupKey === undefined || groupKey === null) {
    return null;
  }
  return groupKey;
}

export function ensureNodeIsGroup(diagram: any, node: any) {
  if (!diagram || !node || !node.data) {
    return;
  }
  if (node.data.isGroup) {
    return;
  }
  node.data.isGroup = true;
  node.isSubGraphExpanded = true;
}

export function setNodeGroup(diagram: any, node: any, groupKey: any) {
  if (!diagram || !node || !node.data) {
    return;
  }
  const normalizedKey = groupKey === undefined ? null : groupKey;
  const nodeKey = getNodeKey(node);
  if (
    nodeKey !== undefined &&
    nodeKey !== null &&
    normalizedKey !== null &&
    normalizedKey !== undefined &&
    nodeKey === normalizedKey
  ) {
    return;
  }
  const currentKey = getGroupKeyFromData(node.data);
  const model = diagram.model;
  if (model && typeof model.setGroupKeyForNodeData === 'function') {
    model.setGroupKeyForNodeData(node.data, normalizedKey);
  } else if (model && typeof model.setDataProperty === 'function') {
    model.setDataProperty(node.data, 'group', normalizedKey);
  } else {
    node.data.group = normalizedKey;
  }
}
