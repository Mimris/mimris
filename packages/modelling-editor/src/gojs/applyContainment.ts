/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import * as go from 'gojs';

export function isAncestorGroupKey(
  diagram: go.Diagram | null | undefined,
  ancestorKey: string | number | null | undefined,
  descendantKey: string | number | null | undefined
): boolean {
  if (!diagram || ancestorKey === null || ancestorKey === undefined || descendantKey === null || descendantKey === undefined) {
    return false;
  }
  const descendant = diagram.findNodeForKey(descendantKey) as go.Group | null;
  let current = descendant?.containingGroup || null;
  while (current instanceof go.Group) {
    if (current.key === ancestorKey) return true;
    current = current.containingGroup;
  }
  return false;
}

export function clearPartGroupState(
  diagram: go.Diagram | null | undefined,
  part: go.Part | null | undefined,
  data?: any
) {
  if (!diagram || !(part instanceof go.Part)) return;
  const nodeData = data || part.data;
  if (nodeData) {
    try { (diagram.model as go.GraphLinksModel).setGroupKeyForNodeData(nodeData, undefined); } catch (_) { }
    try { diagram.model.setDataProperty(nodeData, "group", ""); } catch (_) { }
    try { nodeData.group = ""; } catch (_) { }
  }
  try { part.containingGroup = null; } catch (_) { }
  try { (part as any).group = ""; } catch (_) { }
  try { (part as any).data.group = ""; } catch (_) { }
}

export function detachPartToTopLevel(
  diagram: go.Diagram | null | undefined,
  part: go.Part | null | undefined,
  data?: any
) {
  if (!diagram || !(part instanceof go.Part)) return;
  const detachedLocation = part.location?.copy ? part.location.copy() : new go.Point(part.location.x, part.location.y);
  const previousContainingGroup = part.containingGroup;
  clearPartGroupState(diagram, part, data);
  if (previousContainingGroup instanceof go.Group) {
    const detachSet = new go.Set<go.Part>();
    detachSet.add(part);
    try { (previousContainingGroup as any).removeMembers(detachSet, true); } catch (_) { }
  }
  const topLevelSet = new go.Set<go.Part>();
  topLevelSet.add(part);
  try { diagram.commandHandler.addTopLevelParts(topLevelSet, true); } catch (_) { }
  clearPartGroupState(diagram, part, data);
  try { part.location = detachedLocation; } catch (_) { }
  if (data) {
    const detachedLocString = `${detachedLocation.x} ${detachedLocation.y}`;
    try { diagram.model.setDataProperty(data, "loc", detachedLocString); } catch (_) { }
    try { data.loc = detachedLocString; } catch (_) { }
  }
  try { part.invalidateLayout(); } catch (_) { }
  try { part.updateTargetBindings(); } catch (_) { }
  try { (part as any).updateAllTargetBindings(); } catch (_) { }
  try { diagram.updateAllTargetBindings(); } catch (_) { }
  try { diagram.requestUpdate(); } catch (_) { }
}

export function attachPartToGroup(
  diagram: go.Diagram | null | undefined,
  part: go.Part | null | undefined,
  targetGroup: go.Group | null | undefined,
  data?: any
): boolean {
  if (!diagram || !(part instanceof go.Part) || !(targetGroup instanceof go.Group)) return false;
  if (part.containingGroup !== targetGroup) {
    detachPartToTopLevel(diagram, part, data);
  }
  const memberSet = new go.Set<go.Part>();
  memberSet.add(part);
  let added = false;
  try {
    added = targetGroup.addMembers(memberSet, false);
  } catch (_) {
    added = false;
  }
  if (!added) return false;
  try { part.containingGroup = targetGroup; } catch (_) { }
  const nodeData = data || part.data;
  if (nodeData) {
    try { (diagram.model as go.GraphLinksModel).setGroupKeyForNodeData(nodeData, targetGroup.key); } catch (_) { }
    try { diagram.model.setDataProperty(nodeData, "group", targetGroup.key); } catch (_) { }
    try { nodeData.group = targetGroup.key; } catch (_) { }
  }
  try { (part as any).group = targetGroup.key; } catch (_) { }
  try { (part as any).data.group = targetGroup.key; } catch (_) { }
  return true;
}

export function assertPartGroupConsistency(
  diagram: go.Diagram | null | undefined,
  part: go.Part | null | undefined,
  expectedGroupKey?: string | number | null
) {
  if (!diagram || !(part instanceof go.Part) || !part.data) return;
  const actualContainingKey = part.containingGroup?.key ?? "";
  const actualDataKey = part.data.group ?? "";
  const normalizedExpected = expectedGroupKey ?? "";
  if (normalizedExpected === "" && actualContainingKey) {
    console.warn("Group consistency mismatch: expected top-level but part still has containingGroup", {
      key: part.data.key,
      containingGroup: actualContainingKey,
      dataGroup: actualDataKey
    });
  }
  if (normalizedExpected !== "" && String(actualDataKey ?? "") !== String(normalizedExpected)) {
    console.warn("Group consistency mismatch: data.group differs from expected target", {
      key: part.data.key,
      expectedGroup: normalizedExpected,
      containingGroup: actualContainingKey,
      dataGroup: actualDataKey
    });
  }
}
