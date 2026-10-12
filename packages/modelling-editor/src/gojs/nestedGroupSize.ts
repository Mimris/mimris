/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import * as go from 'gojs';

export const NESTED_GROUP_SIZE_RATIO = 0.35;

export function applyNestedGroupHalfSize(
  diagram: go.Diagram | null | undefined,
  part: go.Part | null | undefined,
  targetGroup: go.Group | null | undefined,
  objectview?: any,
  goNode?: any
) {
  if (!diagram || !(part instanceof go.Part) || !(targetGroup instanceof go.Group)) return;
  if (!isGroupLikeNode(part, part.data || objectview)) return;

  const parentSize = targetGroup.data?.size
    ? go.Size.parse(String(targetGroup.data.size))
    : new go.Size(targetGroup.actualBounds.width, targetGroup.actualBounds.height);
  if (!(parentSize.width > 0) || !(parentSize.height > 0)) return;

  const nextSize = new go.Size(
    Math.max(1, parentSize.width * NESTED_GROUP_SIZE_RATIO),
    Math.max(1, parentSize.height * NESTED_GROUP_SIZE_RATIO)
  );
  const sizeString = go.Size.stringify(nextSize);
  const data: any = part.data || {};
  const resizeObj = (part as any).resizeObject || (part as any).reshapeObject || part;

  try { resizeObj.desiredSize = nextSize; } catch (_) { }
  data.size = sizeString;
  data.desiredSize = sizeString;
  if (typeof diagram.model?.setDataProperty === 'function') {
    try { diagram.model.setDataProperty(data, "size", sizeString); } catch (_) { }
    try { diagram.model.setDataProperty(data, "desiredSize", sizeString); } catch (_) { }
  }
  if (objectview) {
    objectview.size = sizeString;
  } else if (data.objectview) {
    data.objectview.size = sizeString;
  }
  if (goNode) {
    goNode.size = sizeString;
    if (goNode.objectview) {
      goNode.objectview.size = sizeString;
    }
  }
}

export function isGroupLikeNode(part: any, data?: any): boolean {
  const source = data || part?.data || part || {};
  const templateName = String(source?.template || source?.category || "");
  return Boolean(
    part instanceof go.Group ||
    source?.isGroup === true ||
    source?.objectview?.isGroup === true ||
    templateName.startsWith("group")
  );
}
