/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import * as go from 'gojs';

export function wouldCreateGroupCycle(movingGroup: go.Group | null | undefined, targetGroup: go.Group | null | undefined): boolean {
  if (!(movingGroup instanceof go.Group) || !(targetGroup instanceof go.Group)) return false;
  if (movingGroup === targetGroup) return true;
  let current: go.Group | null = targetGroup;
  while (current instanceof go.Group) {
    if (current === movingGroup) return true;
    current = current.containingGroup;
  }
  return false;
}

export function objectContainsDescendant(
  containerObj: any,
  candidateDescendantObj: any,
  containsType: any
): boolean {
  if (!containerObj?.id || !candidateDescendantObj?.id || !containsType?.name) return false;
  if (containerObj.id === candidateDescendantObj.id) return true;
  const visited = new Set<string>();
  const stack = [containerObj];
  while (stack.length) {
    const current = stack.pop();
    if (!current?.id || visited.has(current.id)) continue;
    visited.add(current.id);
    const outputRels = Array.isArray(current.outputrels) ? current.outputrels : [];
    for (let i = 0; i < outputRels.length; i++) {
      const rel = outputRels[i];
      if (!rel || rel.markedAsDeleted) continue;
      if (rel.type?.name !== containsType.name) continue;
      const childObj = rel.toObject;
      if (!childObj?.id) continue;
      if (childObj.id === candidateDescendantObj.id) return true;
      if (!visited.has(childObj.id)) stack.push(childObj);
    }
  }
  return false;
}
