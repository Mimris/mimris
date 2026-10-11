/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import * as go from 'gojs';
import { wouldCreateGroupCycle } from './groupContainment.js';

export function resolveDeepestValidGroupAtPoint(
  diagram: go.Diagram | null | undefined,
  movingGroup: go.Group | null | undefined,
  point: go.Point | null | undefined
): go.Group | null {
  if (!diagram || !(movingGroup instanceof go.Group) || !point) return null;
  const candidates: Array<{ group: go.Group; area: number }> = [];
  const it = diagram.nodes.iterator;
  while (it?.next()) {
    const part = it.value;
    if (!(part instanceof go.Group)) continue;
    if (part === movingGroup) continue;
    if (wouldCreateGroupCycle(movingGroup, part)) continue;
    const bounds = getGroupBodyBounds(part) || part.actualBounds;
    if (!bounds?.containsPoint?.(point)) continue;
    candidates.push({ group: part, area: Math.max(1, bounds.width * bounds.height) });
  }
  candidates.sort((a, b) => a.area - b.area);
  return candidates.length ? candidates[0].group : null;
}

export function resolveDeepestDropTargetGroup(
  diagram: go.Diagram | null | undefined,
  part: go.Part | null | undefined,
  point: go.Point | null | undefined
): go.Group | null {
  if (!diagram || !point) return null;
  const movingGroup = part instanceof go.Group ? part : null;
  const candidates: Array<{ group: go.Group; area: number }> = [];
  const it = diagram.nodes.iterator;
  while (it?.next()) {
    const grp = it.value;
    if (!(grp instanceof go.Group)) continue;
    if (grp === part) continue;
    if (movingGroup && wouldCreateGroupCycle(movingGroup, grp)) continue;
    const bounds = getGroupBodyBounds(grp) || grp.actualBounds;
    if (!bounds?.containsPoint?.(point)) continue;
    candidates.push({ group: grp, area: Math.max(1, bounds.width * bounds.height) });
  }
  candidates.sort((a, b) => a.area - b.area);
  return candidates.length ? candidates[0].group : null;
}

export function getGroupBodyBounds(grp: go.Group | null | undefined): go.Rect | null {
  if (!(grp instanceof go.Group)) return null;
  const back =
    grp.findObject("SHAPE") ||
    grp.findObject("LANE_BODY_SHAPE") ||
    grp.findObject("BODY") ||
    grp.resizeObject;
  if (!back) return null;
  return back.getDocumentBounds();
}

export function isPartVisuallyInsideGroup(part: go.Part | null | undefined, grp: go.Group | null | undefined): boolean {
  if (!(part instanceof go.Part) || !(grp instanceof go.Group)) return false;
  const groupBounds = getGroupBodyBounds(grp) || grp.actualBounds;
  const partBounds = part.actualBounds;
  if (!groupBounds || !partBounds) return false;
  if (groupBounds.containsRect(partBounds)) return true;
  const center = partBounds.center;
  if (groupBounds.containsPoint(center)) return true;
  const overlapLeft = Math.max(partBounds.x, groupBounds.x);
  const overlapTop = Math.max(partBounds.y, groupBounds.y);
  const overlapRight = Math.min(partBounds.right, groupBounds.right);
  const overlapBottom = Math.min(partBounds.bottom, groupBounds.bottom);
  const overlapWidth = Math.max(0, overlapRight - overlapLeft);
  const overlapHeight = Math.max(0, overlapBottom - overlapTop);
  const overlapArea = overlapWidth * overlapHeight;
  const partArea = Math.max(1, partBounds.width * partBounds.height);
  const overlapRatio = overlapArea / partArea;
  return overlapRatio >= 0.45;
}
