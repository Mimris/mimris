/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import * as go from 'gojs';

export interface CenterNodeOptions {
  offset?: { x?: number; y?: number };
  padding?: number;
  fillParent?: boolean;
}

export function centerNodeInGroup(
  diagram: go.Diagram | null,
  node: go.Node | null,
  groupKey: string | number | null,
  options?: CenterNodeOptions
): void {
  if (!diagram || !node || groupKey === null || groupKey === undefined) {
    return;
  }
  const group = diagram.findNodeForKey(groupKey);
  if (!(group instanceof go.Group)) {
    return;
  }
  const bounds = group.actualBounds;
  if (!bounds) {
    return;
  }
  if (node?.data) {
    const existingFill = node.data.fillcolor || node.data.fill || node.data.color;
    const validFill = existingFill && go.Brush.isValidColor(existingFill)
      ? existingFill
      : '#ffffff';
    if (typeof diagram.model.setDataProperty === 'function') {
      diagram.model.setDataProperty(node.data, 'fillcolor', validFill);
    } else {
      node.data.fillcolor = validFill;
    }
  }
  const padding = options?.padding ?? 20;
  const offsetX = options?.offset?.x ?? 0;
  const offsetY = options?.offset?.y ?? 0;
  const nodeSizeData = parseSizeString(node?.data?.size);

  let desiredWidth: number;
  let desiredHeight: number;

  if (options?.fillParent) {
    desiredWidth = Math.max(0, bounds.width - padding * 2);
    desiredHeight = Math.max(0, bounds.height - padding * 2);
  } else {
    desiredWidth =
      nodeSizeData?.width ??
      Math.max(0, bounds.width - padding * 2);
    desiredHeight = nodeSizeData?.height ?? 200;
  }

  const centerX = bounds.centerX + offsetX;
  const centerY = bounds.centerY + offsetY;
  const locPoint = new go.Point(centerX, centerY);
  if (typeof diagram.model.setDataProperty === 'function' && node.data) {
    diagram.model.setDataProperty(node.data, 'loc', go.Point.stringify(locPoint));
  } else if (node.data) {
    node.data.loc = go.Point.stringify(locPoint);
  }
  node.location = locPoint;
  const resizeObj = node.resizeObject || (node as any).reshapeObject || node;
  if (resizeObj) {
    resizeObj.desiredSize = new go.Size(desiredWidth, desiredHeight);
  }
  if (node.data) {
    const sizeString = `${desiredWidth} ${desiredHeight}`;
    if (typeof diagram.model.setDataProperty === 'function') {
      diagram.model.setDataProperty(node.data, 'size', sizeString);
    } else {
      node.data.size = sizeString;
    }
  }
  node.ensureBounds();
}

export function parseSizeString(value: any) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const parts = value
    .split(/[\s,]+/)
    .map(token => parseFloat(token))
    .filter(num => !isNaN(num));
  if (parts.length >= 2) {
    return { width: parts[0], height: parts[1] };
  }
  return null;
}

export function getPersistedGroupSize(part: any): string {
  if (!part) return "";
  const data: any = part.data || {};
  const resizeObject = part.resizeObject || part.findObject?.("SHAPE") || part.findObject?.("BODY") || null;
  const desiredWidth = Number(resizeObject?.desiredSize?.width);
  const desiredHeight = Number(resizeObject?.desiredSize?.height);
  const actualWidth = Number(resizeObject?.actualBounds?.width);
  const actualHeight = Number(resizeObject?.actualBounds?.height);
  const category = String(data?.category || data?.template || part.category || "");
  if (category === "Lane" || category === "Lane_w_handles" || category === "Pool") {
    return String(data?.size || part.size || "");
  }
  if (Number.isFinite(desiredWidth) && desiredWidth > 0 && Number.isFinite(desiredHeight) && desiredHeight > 0) {
    return `${desiredWidth} ${desiredHeight}`;
  }
  if (Number.isFinite(actualWidth) && actualWidth > 0 && Number.isFinite(actualHeight) && actualHeight > 0) {
    return `${actualWidth} ${actualHeight}`;
  }
  return String(data?.size || part.size || "");
}
