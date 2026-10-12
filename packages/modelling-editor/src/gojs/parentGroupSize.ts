/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import * as go from 'gojs';
import { parseSizeString } from './groupSizing.js';
import { refreshGroupPartRendering } from './initialGroupSize.js';
import { NESTED_GROUP_SIZE_RATIO } from './nestedGroupSize.js';

export function resizeGroupToHalfParent(diagram: go.Diagram, childData: any, childPart: go.Part | null, parentPart: go.Part | null) {
  if (!diagram || !childData || !parentPart) return;
  const existingSize = parseSizeString(childData?.size) || parseSizeString(childData?.objectview?.size);
  if (existingSize && existingSize.width > 0 && existingSize.height > 0) {
    return;
  }
  const parentSize =
    parseSizeString(parentPart.data?.size) || {
      width: parentPart.actualBounds?.width || 0,
      height: parentPart.actualBounds?.height || 0,
    };
  if (!parentSize.width || !parentSize.height) return;

  const width = Math.max(1, parentSize.width * NESTED_GROUP_SIZE_RATIO);
  const height = Math.max(1, parentSize.height * NESTED_GROUP_SIZE_RATIO);
  const sizeString = `${width} ${height}`;

  if (typeof diagram.model?.setDataProperty === 'function') {
    if (childData.size !== sizeString) diagram.model.setDataProperty(childData, 'size', sizeString);
    diagram.model.setDataProperty(childData, 'desiredSize', sizeString);
  } else {
    childData.size = sizeString;
    childData.desiredSize = sizeString;
  }
  if (childData.objectview) {
    childData.objectview.size = sizeString;
  }
  if (childPart instanceof go.Part) {
    const resizeObj = childPart.resizeObject || (childPart as any).reshapeObject || childPart;
    if (resizeObj) {
      resizeObj.desiredSize = new go.Size(width, height);
    } else {
      (childPart as go.Part).desiredSize = new go.Size(width, height);
    }
    childPart.ensureBounds();
    refreshGroupPartRendering(diagram, childPart, childData);
  }
}
