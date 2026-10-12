/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import * as go from 'gojs';

export function getGroupMemberScale(part: go.Group | null | undefined): number {
  if (!(part instanceof go.Group)) return 1.0;
  const data: any = part.data || {};
  const raw =
    data?.memberscale ??
    data?.objectview?.memberscale ??
    data?.typeview?.memberscale ??
    1.0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1.0;
}

export function getAncestorMemberScaleProduct(group: go.Group | null | undefined): number {
  let current = group instanceof go.Group ? group : null;
  let product = 1.0;
  while (current instanceof go.Group) {
    product *= getGroupMemberScale(current);
    current = current.containingGroup;
  }
  return product;
}

export function getDerivedScaleForGroup(targetGroup: go.Group | null | undefined): number {
  return getAncestorMemberScaleProduct(targetGroup);
}

export function getRenderedPartScale(part: go.Part | null | undefined): number {
  if (!(part instanceof go.Part)) return 1.0;
  const raw = Number(part.scale ?? part.data?.scale1 ?? part.data?.scale ?? 1.0);
  return Number.isFinite(raw) && raw > 0 ? raw : 1.0;
}

export function getRenderedTextScale(part: go.Part | null | undefined): number {
  if (!(part instanceof go.Part)) return 1.0;
  const partScale = getRenderedPartScale(part);
  const textScaleRaw = Number(part.data?.textscale ?? 1.0);
  const textScale = Number.isFinite(textScaleRaw) && textScaleRaw > 0 ? textScaleRaw : 1.0;
  return partScale * textScale;
}

export function getRelationshipTextScale(diagram: go.Diagram | null | undefined, relview: any): number {
  if (!diagram || !relview) return 1.0;
  const fromId = relview?.fromObjview?.id;
  const toId = relview?.toObjview?.id;
  const fromPart = fromId ? (diagram.findNodeForKey(fromId) as go.Part | null) : null;
  const toPart = toId ? (diagram.findNodeForKey(toId) as go.Part | null) : null;
  const fromScale = getRenderedTextScale(fromPart);
  const toScale = getRenderedTextScale(toPart);
  return (fromScale + toScale) / 2;
}
