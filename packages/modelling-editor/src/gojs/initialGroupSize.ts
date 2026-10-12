/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import * as go from 'gojs';
import { parseSizeString } from './groupSizing.js';

export function ensureInitialGroupSize(diagram: any, node: any, data: any, options?: any) {
  if (!data) {
    return;
  }
  const viewportBounds = diagram?.viewportBounds;
  const viewportWidth = Number(viewportBounds?.width) || 0;
  const viewportHeight = Number(viewportBounds?.height) || 0;
  const viewportBasedMinWidth = viewportWidth > 0 ? Math.max(240, Math.floor(viewportWidth * 0.72)) : 480;
  const viewportBasedMinHeight = viewportHeight > 0 ? Math.max(160, Math.floor(viewportHeight * 0.72)) : 320;
  const defaults = {
    minWidth: viewportBasedMinWidth,
    minHeight: viewportBasedMinHeight,
    preferredWidth: undefined,
    preferredHeight: undefined
  };
  const merged = { ...defaults, ...(options || {}) };
  let minWidth = merged.minWidth;
  let minHeight = merged.minHeight;
  const preferredWidth = typeof merged.preferredWidth === 'number' ? merged.preferredWidth : undefined;
  const preferredHeight = typeof merged.preferredHeight === 'number' ? merged.preferredHeight : undefined;
  const parsed = parseSizeString(data.size);
  let width = parsed?.width ?? 0;
  let height = parsed?.height ?? 0;

  if (preferredWidth !== undefined && (width <= 0 || width > preferredWidth)) {
    width = preferredWidth;
  }
  if (preferredHeight !== undefined && (height <= 0 || height > preferredHeight)) {
    height = preferredHeight;
  }

  if (width >= minWidth && height >= minHeight && preferredWidth === undefined && preferredHeight === undefined) {
    return;
  }

  if (width < minWidth) {
    width = minWidth;
  }
  if (height < minHeight) {
    height = minHeight;
  }

  const sizeString = `${width} ${height}`;
  if (typeof diagram?.model?.setDataProperty === 'function') {
    if (data.size !== sizeString) {
      diagram.model.setDataProperty(data, 'size', sizeString);
    }
    diagram.model.setDataProperty(data, 'desiredSize', sizeString);
  } else {
    data.size = sizeString;
    data.desiredSize = sizeString;
  }

  if (node instanceof go.Part) {
    const desired = new go.Size(width, height);
    const resizeObj = node.resizeObject || (node as any).reshapeObject || node;
    if (resizeObj) {
      resizeObj.desiredSize = desired;
    } else {
      (node as go.Part).desiredSize = desired;
    }
    node.ensureBounds();
    refreshGroupPartRendering(diagram, node, data);
  }
}

export function refreshGroupPartRendering(diagram: go.Diagram | null | undefined, part: go.Part | null | undefined, data?: any) {
  if (!diagram || !(part instanceof go.Part)) return;
  const targetData = data || part.data;
  if (targetData && typeof diagram.model?.updateTargetBindings === 'function') {
    try { diagram.model.updateTargetBindings(targetData); } catch (_) { }
  }
  try { diagram.updateAllTargetBindings("scale"); } catch (_) { }
  try { part.updateTargetBindings(); } catch (_) { }
  try { part.ensureBounds(); } catch (_) { }
  try { (part as any).updateAdornments(); } catch (_) { }
  try { diagram.requestUpdate(); } catch (_) { }
}
