// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as go from 'gojs';
import * as React from 'react';
import Select, { components } from "react-select"
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { SelectedConnectedObjectsDialog } from './SelectedConnectedObjectsDialog';
import { read } from 'fs';

import { DiagramWrapper } from './components/Diagram';
import { SelectionInspector } from './components/SelectionInspector';
import * as akm from '../../akmm/metamodeller';
import * as gjs from '../../akmm/ui_gojs';
import * as jsn from '../../akmm/ui_json';
import * as uic from '../../akmm/ui_common';
import * as uid from '../../akmm/ui_diagram';
import * as uim from '../../akmm/ui_modal';
import * as constants from '../../akmm/constants';
import * as utils from '../../akmm/utilities';
import { applyDropLayout, deriveDropLayoutConfig, applyDropLayoutToGroup } from './layout/DropLayoutManager';

const debug = false;
const debugPorts = true;
const linkToLink = false;
const NESTED_GROUP_SCALE_MULTIPLIER = 0.65;
const MIN_NESTED_GROUP_SCALE = 0.05;

function getEffectiveParentMemberScale(
  parentPart: go.Group | null | undefined,
  model: any
): number {
  if (!(parentPart instanceof go.Group)) return 1.0;
  const parentData: any = parentPart.data || {};
  const parentMemberScale = Math.max(
    0.01,
    Number(parentData?.memberscale ?? parentData?.objectview?.memberscale ?? parentData?.typeview?.memberscale) || 1.0
  );
  let parentVisualScale = Math.max(
    0.01,
    Number(
      parentPart.scale ??
      parentData?.scale1 ??
      parentData?.scale ??
      parentData?.objectview?.scale
    ) || 1.0
  );
  try {
    const modelNode = model?.findNodeByViewId?.(parentPart.data?.key) || model?.findNode?.(parentPart.data?.key);
    const modelNodeScale = Number(
      modelNode?.scale1 ??
      modelNode?.scale ??
      modelNode?.objectview?.scale
    );
    if (
      (!Number.isFinite(parentPart.scale) || Number(parentPart.scale) <= 0) &&
      Number.isFinite(modelNodeScale) &&
      modelNodeScale > 0
    ) {
      parentVisualScale = Math.max(0.01, modelNodeScale);
    }
  } catch (_) {
  }
  return parentVisualScale * parentMemberScale;
}

function getLiveParentInheritedScale(parentPart: go.Group | null | undefined): number {
  if (!(parentPart instanceof go.Group)) return 1.0;
  const parentData: any = parentPart.data || {};
  const parentMemberScale = Math.max(
    0.01,
    Number(parentData?.memberscale ?? parentData?.objectview?.memberscale ?? parentData?.typeview?.memberscale) || 1.0
  );
  const parentScale = Math.max(0.01, Number(parentPart.scale) || 1.0);
  return parentScale * parentMemberScale;
}

function getStoredGroupVisibleScale(part: go.Group | null | undefined): number {
  if (!(part instanceof go.Group)) return 1.0;
  const data: any = part.data || {};
  const raw =
    data?.scale1 ??
    data?.scale ??
    data?.objectview?.scale ??
    part.scale ??
    1.0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1.0;
}

function isGroupLikeNode(part: any, data?: any): boolean {
  const source = data || part?.data || part || {};
  const templateName = String(source?.template || source?.category || "");
  return Boolean(
    part instanceof go.Group ||
    source?.isGroup === true ||
    source?.objectview?.isGroup === true ||
    templateName.startsWith("group")
  );
}

function wouldCreateGroupCycle(movingGroup: go.Group | null | undefined, targetGroup: go.Group | null | undefined): boolean {
  if (!(movingGroup instanceof go.Group) || !(targetGroup instanceof go.Group)) return false;
  if (movingGroup === targetGroup) return true;
  let current: go.Group | null = targetGroup;
  while (current instanceof go.Group) {
    if (current === movingGroup) return true;
    current = current.containingGroup;
  }
  return false;
}

function objectContainsDescendant(
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

function resolveDeepestValidGroupAtPoint(
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

function resolveDeepestDropTargetGroup(
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

function getGroupBodyBounds(grp: go.Group | null | undefined): go.Rect | null {
  if (!(grp instanceof go.Group)) return null;
  const back =
    grp.findObject("SHAPE") ||
    grp.findObject("LANE_BODY_SHAPE") ||
    grp.findObject("BODY") ||
    grp.resizeObject;
  if (!back) return null;
  return back.getDocumentBounds();
}

function isPartVisuallyInsideGroup(part: go.Part | null | undefined, grp: go.Group | null | undefined): boolean {
  if (!(part instanceof go.Part) || !(grp instanceof go.Group)) return false;
  const groupBounds = getGroupBodyBounds(grp) || grp.actualBounds;
  const partBounds = part.actualBounds;
  if (!groupBounds || !partBounds) return false;
  const center = partBounds.center;
  return groupBounds.containsPoint(center);
}

function isAncestorGroupKey(
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

function clearPartGroupState(
  diagram: go.Diagram | null | undefined,
  part: go.Part | null | undefined,
  data?: any
) {
  if (!diagram || !(part instanceof go.Part)) return;
  const nodeData = data || part.data;
  if (nodeData) {
    try { diagram.model.setGroupKeyForNodeData(nodeData, undefined); } catch (_) {}
    try { diagram.model.setDataProperty(nodeData, "group", ""); } catch (_) {}
    try { nodeData.group = ""; } catch (_) {}
  }
  try { part.containingGroup = null; } catch (_) {}
  try { (part as any).group = ""; } catch (_) {}
  try { (part as any).data.group = ""; } catch (_) {}
}

function detachPartToTopLevel(
  diagram: go.Diagram | null | undefined,
  part: go.Part | null | undefined,
  data?: any
) {
  if (!diagram || !(part instanceof go.Part)) return;
  const previousContainingGroup = part.containingGroup;
  clearPartGroupState(diagram, part, data);
  if (previousContainingGroup instanceof go.Group) {
    const detachSet = new go.Set<go.Part>();
    detachSet.add(part);
    try { previousContainingGroup.removeMembers(detachSet, false); } catch (_) {}
  }
  const topLevelSet = new go.Set<go.Part>();
  topLevelSet.add(part);
  try { diagram.commandHandler.addTopLevelParts(topLevelSet, false); } catch (_) {}
  clearPartGroupState(diagram, part, data);
}

function attachPartToGroup(
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
  try { part.containingGroup = targetGroup; } catch (_) {}
  const nodeData = data || part.data;
  if (nodeData) {
    try { diagram.model.setGroupKeyForNodeData(nodeData, targetGroup.key); } catch (_) {}
    try { diagram.model.setDataProperty(nodeData, "group", targetGroup.key); } catch (_) {}
    try { nodeData.group = targetGroup.key; } catch (_) {}
  }
  try { (part as any).group = targetGroup.key; } catch (_) {}
  try { (part as any).data.group = targetGroup.key; } catch (_) {}
  return true;
}

function assertPartGroupConsistency(
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

const systemtypes = ['Element', 'Entity', 'Property', 'Datatype', 'Method', 'Unittype',
  'Value', 'FieldType', 'InputPattern', 'ViewFormat',
  'Generic', 'Container'];

function buildDropLayoutOverridesFromMetis(myMetis) {
  const objectTypes = getObjectTypesForDropLayout(myMetis);
  if (!objectTypes.length) {
    return undefined;
  }

  const containerIds = [];
  const poolIds = [];
  const laneIds = [];
  const eventIds = [];
  const gatewayIds = [];
  const taskIds = [];

  const containerViewkind = normalizeToKey(constants.viewkinds && constants.viewkinds.CONT);
  const poolViewkind = normalizeToKey(constants.viewkinds && constants.viewkinds.POOL);
  const laneViewkind = normalizeToKey(constants.viewkinds && constants.viewkinds.LANE);

  for (let i = 0; i < objectTypes.length; i++) {
    const type = objectTypes[i];
    if (!type || type.markedAsDeleted) continue;
    const id = type.id;
    if (!id) continue;
    const viewkind = normalizeToKey(type.viewkind);
    const nameKey = normalizeToKey(type.name);
    const isContainerType =
      (containerViewkind && viewkind === containerViewkind) ||
      (typeof type.isContainer === 'function' && type.isContainer());
    if (isContainerType) {
      containerIds.push(id);
      continue;
    }
    if (poolViewkind && viewkind === poolViewkind) {
      poolIds.push(id);
      continue;
    }
    if (laneViewkind && viewkind === laneViewkind) {
      laneIds.push(id);
      continue;
    }
    if (nameKey.indexOf('gateway') !== -1 || nameKey.indexOf('gate') !== -1) {
      gatewayIds.push(id);
      continue;
    }
    const isEventType =
      nameKey.indexOf('event') !== -1 ||
      nameKey.indexOf('start') !== -1 ||
      nameKey === 'end' ||
      nameKey.endsWith(' end') ||
      nameKey.startsWith('end ');
    if (isEventType) {
      eventIds.push(id);
      continue;
    }
    if (
      nameKey.indexOf('task') !== -1 ||
      nameKey.indexOf('activity') !== -1 ||
      nameKey.indexOf('process') !== -1
    ) {
      taskIds.push(id);
      continue;
    }
  }

  const rules = [];

  const pools = uniqueStringValues(poolIds);
  if (pools.length) {
    rules.push({
      id: 'drop-rule-pools',
      order: -40,
      matchProperty: 'objtypeRef',
      matchValues: pools,
      anchor: 'dropPoint',
      layout: {
        pattern: 'grid',
        padding: 3,
        grid: {
          columns: 1,
          spacingX: 220,
          spacingY: 360,
          align: 'topLeft',
        },
      },
    });
  }

  const lanes = uniqueStringValues(laneIds);
  if (lanes.length) {
    rules.push({
      id: 'drop-rule-lanes',
      order: -35,
      matchProperty: 'objtypeRef',
      matchValues: lanes,
      anchor: 'dropPoint',
      layout: {
        pattern: 'grid',
        padding: 2,
        grid: {
          columns: 1,
          spacingX: 140,
          spacingY: 260,
          align: 'topLeft',
        },
      },
    });
  }

  const containers = uniqueStringValues(containerIds);
  if (containers.length) {
    rules.push({
      id: 'drop-rule-containers',
      order: -30,
      matchProperty: 'objtypeRef',
      matchValues: containers,
      anchor: 'dropPoint',
      layout: {
        pattern: 'grid',
        padding: 2,
        grid: {
          columns: 2,
          spacingX: 240,
          spacingY: 200,
          align: 'center',
        },
      },
    });
  }

  const gateways = uniqueStringValues(gatewayIds);
  if (gateways.length) {
    rules.push({
      id: 'drop-rule-gateways',
      order: 5,
      matchProperty: 'objtypeRef',
      matchValues: gateways,
      layout: {
        pattern: 'circle',
        circle: {
          radius: 140,
          radiusStep: 40,
          startAngle: -90,
          clockwise: true,
        },
      },
    });
  }

  const events = uniqueStringValues(eventIds);
  if (events.length) {
    rules.push({
      id: 'drop-rule-events',
      order: 10,
      matchProperty: 'objtypeRef',
      matchValues: events,
      layout: {
        pattern: 'circle',
        circle: {
          radius: 110,
          radiusStep: 30,
          startAngle: -90,
          clockwise: true,
        },
      },
    });
  }

  const tasks = uniqueStringValues(taskIds);
  if (tasks.length) {
    rules.push({
      id: 'drop-rule-tasks',
      order: 20,
      matchProperty: 'objtypeRef',
      matchValues: tasks,
      anchor: 'dropPoint',
      layout: {
        pattern: 'grid',
        grid: {
          columns: 4,
          spacingX: 200,
          spacingY: 160,
          align: 'center',
        },
      },
    });
  }

  if (!rules.length) {
    if (!pools.length && !lanes.length && !containers.length) {
      return undefined;
    }
  }

  return {
    rules,
    metadata: {
      poolTypeIds: pools,
      laneTypeIds: lanes,
      containerTypeIds: containers,
      poolPadding: 80,
    },
  };
}

function getObjectTypesForDropLayout(myMetis) {
  if (!myMetis) {
    return [];
  }
  if (typeof myMetis.getObjectTypes === 'function') {
    const types = myMetis.getObjectTypes();
    if (Array.isArray(types)) {
      return types.slice();
    }
  }
  if (Array.isArray(myMetis.objecttypes)) {
    return myMetis.objecttypes.slice();
  }
  const metamodel = myMetis.currentMetamodel;
  if (metamodel && typeof metamodel.getObjectTypes === 'function') {
    const metaTypes = metamodel.getObjectTypes();
    if (Array.isArray(metaTypes)) {
      return metaTypes.slice();
    }
  }
  return [];
}

function uniqueStringValues(values) {
  const result = [];
  const seen = Object.create(null);
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value === undefined || value === null) continue;
    const key = String(value);
    if (seen[key]) continue;
    seen[key] = true;
    result.push(key);
  }
  result.sort();
  return result;
}

function normalizeToKey(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim().toLowerCase();
}

function getNodeTypeRef(node) {
  if (!node || !node.data) {
    return undefined;
  }
  const data = node.data;
  return (
    data.objtypeRef ||
    data.typeRef ||
    (data.objecttype && (data.objecttype.typeRef || data.objecttype.id)) ||
    (data.object && (data.object.typeRef || (data.object.type && data.object.type.id))) ||
    (data.type && data.type.id) ||
    (data.objtype && data.objtype.id) ||
    data.objTypeRef ||
    undefined
  );
}

function getNodeKey(node) {
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

function getGroupKeyFromData(data) {
  if (!data) {
    return null;
  }
  const groupKey = data.group;
  if (groupKey === undefined || groupKey === null) {
    return null;
  }
  return groupKey;
}

function getSizeOptionsForType(typeName: string | undefined | null) {
  if (!typeName) {
    return undefined;
  }
  const normalized = typeName.toString().toLowerCase();
  switch (normalized) {
    case 'pool':
      return { minWidth: 1600, minHeight: 900 };
    case 'lane':
      return { minWidth: 1400, minHeight: 260 };
    case 'process':
      return { minWidth: 920, minHeight: 560, preferredWidth: 920, preferredHeight: 560 };
    default:
      return undefined;
  }
}

interface CenterNodeOptions {
  offset?: { x?: number; y?: number };
  padding?: number;
  fillParent?: boolean;
}

function centerNodeInGroup(
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
  const resizeObj = node.resizeObject || node.reshapeObject || node;
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

function parseSizeString(value) {
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

function ensureInitialGroupSize(diagram, node, data, options) {
  if (!data) {
    return;
  }
  const defaults = { minWidth: 800, minHeight: 460, preferredWidth: undefined, preferredHeight: undefined };
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
    const resizeObj = node.resizeObject || node.reshapeObject || node;
    if (resizeObj) {
      resizeObj.desiredSize = desired;
    } else {
      node.desiredSize = desired;
    }
    node.ensureBounds();
  }
}

function resizeGroupToHalfParent(diagram: go.Diagram, childData: any, childPart: go.Part | null, parentPart: go.Part | null) {
  if (!diagram || !childData || !parentPart) return;
  const parentSize =
    parseSizeString(parentPart.data?.size) || {
      width: parentPart.actualBounds?.width || 0,
      height: parentPart.actualBounds?.height || 0,
    };
  if (!parentSize.width || !parentSize.height) return;

  const width = Math.max(1, parentSize.width / 2);
  const height = Math.max(1, parentSize.height / 2);
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
    const resizeObj = childPart.resizeObject || childPart.reshapeObject || childPart;
    if (resizeObj) {
      resizeObj.desiredSize = new go.Size(width, height);
    } else {
      childPart.desiredSize = new go.Size(width, height);
    }
    childPart.ensureBounds();
  }
}

function ensureNodeIsGroup(diagram, node) {
  if (!diagram || !node || !node.data) {
    return;
  }
  if (node.data.isGroup) {
    return;
  }
  node.data.isGroup = true;
  node.isSubGraphExpanded = true;
}

function setNodeGroup(diagram, node, groupKey) {
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

/**
 * Use a linkDataArray since we'll be using a GraphLinksModel,
 * and modelData for demonstration purposes. Note, though, that
 * both are optional props in ReactDiagram.
 */
interface AppState {
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
  selectedData: go.ObjectData | null;
  editedData: go.ObjectData | null;
  skipsDiagramUpdate: boolean;
  metis: any;
  myMetis: akm.cxMetis;
  phFocus: any;
  dispatch: any;
  modelType: any;
  showModal: boolean;
  modalContext: any;
  selectedOption: any;
  diagramStyle: any;
  onExportSvgReady: any;
  showConnectedObjectsDialog: boolean;
  connectedObjectsDialogMode: string;
  connectedObjectsContext: any;
}

class GoJSApp extends React.Component<{}, AppState> {
  constructor(props: object) {
    super(props);
    if (debug) console.log('62 GoJSApp', this.props.nodeDataArray, this.props);
    const initialDropLayout = buildDropLayoutOverridesFromMetis(this.props?.myMetis);
    this.state = {
      nodeDataArray: this.props?.nodeDataArray,
      linkDataArray: this.props?.linkDataArray,
      modelData: {
        canRelink: true,
        ...(initialDropLayout ? { dropLayout: initialDropLayout } : {})
      },
      selectedData: null,
      editedData: null,
      skipsDiagramUpdate: false,
      metis: this.props.metis,
      myMetis: this.props.myMetis,
      phFocus: this.props.phFocus,
      dispatch: this.props.dispatch,
      modelType: this.props.phFocus.focusTab,
      showModal: false,
      modalContext: null,
      selectedOption: null,
      diagramStyle: this.props.diagramStyle,
      onExportSvgReady: this.props.onExportSvgReady,
      showConnectedObjectsDialog: false,
      connectedObjectsDialogMode: '', // 'add' or 'select'
      connectedObjectsContext: null,
    };
    this.handleDiagramEvent = this.handleDiagramEvent.bind(this);
    this.handleModelChange = this.handleModelChange.bind(this);
    // ...existing code...
  }

  openConnectedObjectsDialog = (mode = 'select', context: any = null) => {
    this.setState({
      showConnectedObjectsDialog: true,
      connectedObjectsDialogMode: mode,
      connectedObjectsContext: context,
    });
  }

  closeConnectedObjectsDialog = () => {
    this.setState({ showConnectedObjectsDialog: false, connectedObjectsDialogMode: '', connectedObjectsContext: null });
  }

  handleConnectedObjectsDialogApply = (params) => {
    const ctx = this.state.connectedObjectsContext;
    if (!ctx || !ctx.diagram || !ctx.part) {
      this.closeConnectedObjectsDialog();
      return;
    }

    if (params?.mode === 'follow') {
      const rel = (params?.relationshipToFollow || '').trim();
      if (rel) {
        this.runSelectConnectedFromContext(ctx, {
          levels: 1,
          reltypes: rel,
          reldir: 'All',
        });
      }
      this.closeConnectedObjectsDialog();
      return;
    }

    // Traverse options
    const levels = Math.max(1, Math.floor(Number(params?.steps) || 1));
    const reltypes = (params?.selectedTypes && params.selectedTypes.length)
      ? params.selectedTypes.join(',')
      : '';
    const reldir = params?.direction || 'All';
    this.runSelectConnectedFromContext(ctx, {
      levels,
      reltypes,
      reldir,
    });
    this.closeConnectedObjectsDialog();
  }

  renderConnectedObjectsDialog = () => {
    // Prefer context-provided rel options; fallback to metamodel
    const relOptionsFromContext = this.state.connectedObjectsContext?.relOptions;
    const relationshipTypes = (relOptionsFromContext && relOptionsFromContext.length
      ? relOptionsFromContext
      : (this.state.myMetis?.currentMetamodel?.relationshiptypes || []).map(rt => rt.name)
    );
    return (
      <SelectedConnectedObjectsDialog
        isOpen={this.state.showConnectedObjectsDialog}
        toggle={this.closeConnectedObjectsDialog}
        onApply={this.handleConnectedObjectsDialogApply}
        relationshipTypes={relationshipTypes}
      />
    );
  }

  // ...existing code...
  private runSelectConnectedFromContext = (
    ctx: { diagram: go.Diagram; part: go.Part },
    params: { levels: number; reltypes: string; reldir: string }
  ) => {
    const diagram = ctx?.diagram;
    const part = ctx?.part;
    if (!diagram || !part || !part.data || part.data.category !== constants.gojs.C_OBJECT) return;

    const nodeData: any = part.data;
    const myMetis = this.state.myMetis;
    let modelview = myMetis?.currentModelview;
    if (!modelview) return;
    modelview = myMetis.findModelView(modelview.id);
    const goModel = myMetis.gojsModel;
    const objview = myMetis.findObjectView(nodeData.key);
    if (!objview) return;

    const levels = Math.max(1, Math.floor(Number(params.levels) || 1));
    const reltypes = params.reltypes === 'All' ? '' : (params.reltypes || '').trim();
    const dir = (params.reldir || 'All').toLowerCase();
    const viewCollection = new akm.cxCollectionOfViews(modelview as any);

    if (dir === 'all') {
      uid.selectConnectedObjects1(modelview, objview, goModel, myMetis, levels, reltypes, 'out', viewCollection);
      uid.selectConnectedObjects1(modelview, objview, goModel, myMetis, levels, reltypes, 'in', viewCollection);
    } else if (dir === 'out' || dir === 'in') {
      uid.selectConnectedObjects1(modelview, objview, goModel, myMetis, levels, reltypes, dir, viewCollection);
    } else {
      uid.selectConnectedObjects1(modelview, objview, goModel, myMetis, levels, reltypes, 'out', viewCollection);
      uid.selectConnectedObjects1(modelview, objview, goModel, myMetis, levels, reltypes, 'in', viewCollection);
    }

    const mySelection = new go.Set<go.Part | go.Link>();
    const objviews = viewCollection.objectviews || [];
    const relviews = viewCollection.relshipviews || [];

    for (let i = 0; i < objviews.length; i++) {
      const ov = objviews[i];
      if (!ov || ov.id === nodeData.key) continue;
      const goNode = goModel.findNodeByViewId(ov.id);
      const gjsNode = diagram.findNodeForKey(goNode?.key) || diagram.findNodeForData(goNode);
      if (gjsNode) mySelection.add(gjsNode);
    }

    for (let i = 0; i < relviews.length; i++) {
      const rv = relviews[i];
      if (!rv) continue;
      const goLink = goModel.findLinkByViewId(rv.id);
      const gjsLink = diagram.findLinkForKey(goLink?.key);
      if (gjsLink) mySelection.add(gjsLink);
    }

    const allowedReltypes = (params.reltypes || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
    const allowAll = allowedReltypes.length === 0;
    const matchesReltype = (rv: any) => {
      if (allowAll) return true;
      const rel = rv?.relship || rv?.relationship;
      const tname = rel?.type?.name;
      const tid = rel?.type?.id;
      return allowedReltypes.includes(tname) || allowedReltypes.includes(tid);
    };

    const rootObjview = objview;
    const firstHopRelviews = (modelview?.relshipviews || []).filter((rv: any) => {
      const fromId = rv?.fromObjview?.id;
      const toId = rv?.toObjview?.id;
      const touchesRoot = fromId === rootObjview?.id || toId === rootObjview?.id;
      return touchesRoot && matchesReltype(rv);
    });
    for (let i = 0; i < firstHopRelviews.length; i++) {
      const rv = firstHopRelviews[i];
      if (!rv) continue;
      // Add the link
      const goLink = goModel.findLinkByViewId(rv.id);
      const gjsLink = diagram.findLinkForKey(goLink?.key);
      if (gjsLink) mySelection.add(gjsLink);

      // Add the counterpart node(s)
      const fromId = rv?.fromObjview?.id;
      const toId = rv?.toObjview?.id;
      const otherIds = [fromId, toId].filter(id => id && id !== rootObjview?.id);
      for (let j = 0; j < otherIds.length; j++) {
        const oid = otherIds[j];
        const goNode = goModel.findNodeByViewId(oid);
        const gjsNode = diagram.findNodeForKey(goNode?.key) || diagram.findNodeForData(goNode);
        if (gjsNode) mySelection.add(gjsNode);
      }
    }

    const rootPart = diagram.findPartForKey(nodeData.key) || diagram.findNodeForKey(nodeData.key);
    if (rootPart) mySelection.add(rootPart as any);

    if (mySelection.count > 0) {
      diagram.selectCollection(mySelection);
    } else {
      diagram.clearSelection();
    }
  }

  public componentDidUpdate() {
    const nextDropLayout = buildDropLayoutOverridesFromMetis(this.props?.myMetis);
    const currentDropLayout = this.state?.modelData?.dropLayout;
    const currentSerialized = currentDropLayout ? JSON.stringify(currentDropLayout) : '';
    const nextSerialized = nextDropLayout ? JSON.stringify(nextDropLayout) : '';
    if (nextSerialized !== currentSerialized) {
      this.setState(state => {
        const updatedModelData = { ...(state.modelData || {}) };
        if (nextDropLayout) {
          updatedModelData.dropLayout = nextDropLayout;
        } else if (updatedModelData.dropLayout) {
          delete updatedModelData.dropLayout;
        }
        return { modelData: updatedModelData };
      });
    }
  }

  public handleOpenModal = (node: any, modalContext: any) => {
    this.setState({
      selectedData: node,
      modalContext: modalContext,
      selectedOption: null,
      showModal: true
    });
    if (debug) console.log('90 node', this.state.selectedData);
  }

  public handleSelectDropdownChange = (selected: any) => {
    if (debug) console.log('94 handleSelectDropdownChange', this.state.myMetis);
    const myMetis = this.state.myMetis;
    const modalContext = this.state.modalContext;
    const context = {
      "myMetis": myMetis,
      "myMetamodel": modalContext.myMetamodel,
      "myModel": myMetis.currentModel,
      "myModelview": myMetis.currentModelview,
      "myGoModel": myMetis.gojsModel,
      "myDiagram": myMetis.myDiagram,
      "modalContext": modalContext
    }
    uim.handleSelectDropdownChange(selected, context);
  }

  public handleCloseModal = (e) => {
    if (debug) console.log('109 handleCloseModal');
    const modalContext = this.state.modalContext;
    if (!modalContext) return;
    const myDiagram = modalContext.context?.myDiagram;
    const gjsLink = modalContext.context?.link;
    const data = gjsLink.data;
    if (e === 'x') {
      myDiagram.remove(gjsLink);
      this.setState({ showModal: false, selectedData: null, modalContext: null });
      return;
    }
    const props = this.props;
    let typename = modalContext.selected?.value;
    if (!typename) typename = modalContext.typename;
    if (debug) console.log('113 typename: ', typename);
    if (debug) console.log('122 modalContext', modalContext);
    const args = {
      data: data,
      metamodel: modalContext.myMetamodel,
      typename: typename,
      fromType: modalContext.fromType,
      toType: modalContext.toType,
      nodeFrom: modalContext.nodeFrom,
      nodeTo: modalContext.nodeTo,
      fromPort: data.fromPort,
      toPort: data.toPort,
      context: modalContext.context
    }
    if (debug) console.log('128 args', args);
    uic.createRelshipCallback(args);
    this.setState({ showModal: false, selectedData: null, modalContext: null });
  }

  /**
   * Handle GoJS model changes, which output an object of data changes via Model.toIncrementalData.
   * This method should iterate over those changes and update state to keep in sync with the GoJS model.
   * This can be done via setState in React or another preferred state management method.
   * @param obj a JSON-formatted string
   */
  public handleModelChange(obj: go.IncrementalData) {
    const insertedNodeKeys = obj.insertedNodeKeys;
    const modifiedNodeData = obj.modifiedNodeData;
    const removedNodeKeys = obj.removedNodeKeys;
    const insertedLinkKeys = obj.insertedLinkKeys;
    const modifiedLinkData = obj.modifiedLinkData;
    const removedLinkKeys = obj.removedLinkKeys;
    const modifiedModelData = obj.modelData;


  }

  public addToNode(myToNodes: any, n: any) {
    const myToNode = {
      "key": n.data.key,
      "name": n.data.name,
      "loc": new String(n.data.loc),
      "scale": Number(n.data.scale),
      "size": new String(n.data.size),
      "template": n.data.template,
      "figure": n.data.figure,
      "geometry": n.data.geometry,
      "fillcolor": n.data.fillcolor,
      "fillcolor2": n.data.fillcolor2,
      "strokecolor": n.data.strokecolor,
      "strokecolor2": n.data.strokecolor2,
      "textcolor": n.data.textcolor,
      "strokewidth": Number(n.data.strokewidth),
      "textscale": Number(n.data.textscale),
      "icon": n.data.icon,
    }
    myToNodes.push(myToNode);
    if (n.data.isGroup) {
      for (let it2 = n.memberParts.iterator; it2?.next();) {
        let n2 = it2.value;
        if (!(n2 instanceof go.Node)) continue;
        if (n2) {
          this.addToNode(myToNodes, n2);
        }
      }
    }
  }

  private getNode(goModel: gjs.goModel, key: string): gjs.goObjectNode {
    const nodes = goModel?.nodes;
    if (nodes) {
      for (let i = 0; i < nodes?.length; i++) {
        const node = nodes[i];
        if (node) {
          if (node.key === key)
            return node;
        }
      }
    }
    return null;
  }

  private getLink(goModel: any, key: string) {
    const links = goModel.links;
    if (links) {
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        if (link) {
          if (link.key === key)
            return link;
        }
      }
    }
    return null;
  }

  private isSystemType(type) {
    for (let i = 0; i < systemtypes.length; i++) {
      const systype = systemtypes[i];
      if (type.name === systype)
        return true;
    }
    return false;
  }

  private isMetamodelType(category) {
    let retval = false;
    if (
      (category === constants.types.OBJECTTYPE)
      ||
      (category === constants.types.RELATIONSHIPTYPE)
    )
      retval = true;
    return retval;
  }

  private isSourceNode(mySourceNodes: any, key: string,) {
    let retval = false;
    for (let j = 0; j < mySourceNodes.length; j++) {
      const node = mySourceNodes[j];
      let myKey = key;
      if (node.key === myKey) {
        retval = true;
        break;
      }
    }
    return retval;
  }

  /**
   * Handle any relevant DiagramEvents, in this case just selection changes.
   * On ChangedSelection, find the corresponding data and set the selectedData state.
   * @param e a GoJS DiagramEvent
   */
  public handleDiagramEvent(e: go.DiagramEvent) {
    const dispatch = this.state.dispatch;
    const name = e.name;
    const myDiagram = e.diagram;
    const myMetis = this.state.myMetis;
    myMetis.relinked = false;
    const myModel = myMetis?.findModel(this.state.phFocus?.focusModel?.id);
    let myModelview = myMetis?.findModelView(this.state.phFocus?.focusModelview?.id);
    if (!myModelview) myModelview = myMetis?.currentModelview;
    const myMetamodel = myModel?.getMetamodel();
    let myGoModel: gjs.goModel = this.state.myMetis.gojsModel;
    const nodes = new Array();
    let modifiedObjectTypes = new Array();
    let modifiedObjectTypeViews = new Array();
    let modifiedObjectTypeGeos = new Array();
    let modifiedRelshipTypes = new Array();
    let modifiedRelshipTypeViews = new Array();
    let modifiedObjects = new Array();
    let modifiedRelships = new Array();
    let modifiedObjectViews = new Array();
    let modifiedRelshipViews = new Array();
    let modifiedMetamodels = new Array();
    let done = false;
    let pasted = false;

    const context = {
      "myMetis": myMetis,
      "myMetamodel": myMetamodel,
      "myModel": myModel,
      "myModelview": myModelview,
      "myGoModel": myMetis.gojsModel,
      // "myGoMetamodel": myGoMetamodel,
      "myDiagram": myDiagram,
      "dispatch": dispatch,
      "pasted": pasted,
      "done": done,
      // "askForRelshipName": myModelview?.askForRelshipName,
      "askForRelshipName": false,
      "includeInheritedReltypes": myModelview?.includeInheritedReltypes,
      "handleOpenModal": this.handleOpenModal,
      "modifiedObjects": [],
      "modifiedRelships": [],
      "modifiedObjectViews": [],
      "modifiedRelshipViews": [],
      "modifiedObjectTypes": [],
      "modifiedRelshipTypes": [],
      "modifiedObjectTypeViews": [],
      "modifiedRelshipTypeViews": [],
      "modifiedObjectTypeGeos": [],
      "modifiedModelviews": [],
    }
    if (debug) console.log('265 handleDiagramEvent - context', name, this.state, context);
    if (debug) console.log('266 handleEvent', myMetis);
    if (debug) console.log('267 this', this);
    if (debug) console.log('268 event name', name);

    const relayoutPoolByKey = (poolKey: string) => {
      if (!poolKey) return;
      let poolObjview = myMetis.findObjectView(poolKey);
      if (!poolObjview) poolObjview = myModelview.findObjectView(poolKey);
      if (!poolObjview) {
        const poolNode = myDiagram.findNodeForKey(poolKey);
        poolObjview = poolNode?.data?.objectview || null;
      }
      if (poolObjview?.isGroup) uid.doGroupLayout(poolObjview, myDiagram, myMetis);
    };
    const relayoutPoolsByKeys = (keys: Set<string>) => {
      if (keys.size === 0) return;
      if ((myDiagram as any).__isPoolRelayoutInProgress) return;
      (myDiagram as any).__isPoolRelayoutInProgress = true;
      try {
        keys.forEach((poolKey) => relayoutPoolByKey(poolKey));
      } finally {
        (myDiagram as any).__isPoolRelayoutInProgress = false;
      }
    };

    switch (name) {
      case "InitialLayoutCompleted": {
        if (debug) console.log("Begin: After Reload:");
        let objviews = myModelview.objectviews;
        myModelview.objectviews = utils.removeArrayDuplicates(objviews);
        objviews = myModelview.objectviews;
        for (let i = 0; i < objviews?.length; i++) {
          const objview = objviews[i];
          if (!objview.typeview) {
            const obj = myModel.findObject(objview.objectRef);
            if (obj) {
              const objtype = myMetamodel.findObjectType(obj.typeRef);
              if (objtype) {
                const typeview = myMetamodel.findObjectTypeView(objtype.typeviewRef);
                objview.typeview = typeview;
                objview.typeviewRef = typeview?.id;
              }
            }
          }
        }
        const focusObjectView  = myMetis.currentModelview?.focusObjectview;
        if (true) {
        for (let i = 0; i < objviews?.length; i++) {
          let resetToTypeview = true;
          let isGroup = false;
          const objview = objviews[i];
          if (objview.isGroup) {
            isGroup = true;
          }
          const obj = objview.object;
          if (!obj) continue;
          let type = obj.type;
          if (!type) {
            type = myMetamodel.findObjectTypeByName(obj.typeName);
            obj.type = type;
            resetToTypeview = true;
          }
          const goNode = myGoModel?.findNodeByViewId(objview.id);
          if (goNode) {
            for (let it = myDiagram.nodes; it?.next();) {
              const n = it.value;
              const data = n.data;
              if (data.key === goNode.key) {
                data.scale = Number(goNode.scale);
                if (debug) console.log('300 objview, goNode, node: ', objview, goNode, n, data);
                data.textcolor = 'black';
              }
            }
            const gjsNode = myDiagram.findNodeForKey(goNode?.key)
            if (gjsNode) {
              if (goNode.scale) gjsNode.scale = Number(goNode.scale);
              if (isGroup) gjsNode.expandTree();
            }
          }
          // Set focus object view
          if (objview.id === focusObjectView?.id) {
            const node = myGoModel.findNodeByViewId(objview.id);
            if (node) {
              const gjsNode = myDiagram.findNodeForKey(node?.key)
              myDiagram.select(gjsNode);
            }
          }
        }
        }

        if (debug) console.log("End: After Reload:");
        uic.purgeDuplicatedRelshipViews(myModelview);
        const links = myDiagram.model.linkDataArray;
        if (links.length > 0) {
          const modelview = myMetis.currentModelview;
          const objviews = modelview.objectviews;
          const nodes = myDiagram.nodes;
          // Fix nodes (scale, loc and size, ++)
          const modifiedObjViews = new Array();
          for (let it = nodes.iterator; it?.next();) {
            const node = it.value;
            const data = node.data;
            if (data.category === "Object type")
              continue;
            //node.scale = Number(data.scale);
            node.loc = data.loc;
            node.size = data.size;
            node.fillcolor = data.fillcolor;
            node.strokecolor = data.strokecolor;
            const object = data.object;
            let objview = data.objectview;
            // objview = uic.setObjviewColors(data, myDiagram);          
            const image = object?.image ? object.image : objview?.image;
            if (image) {
              myDiagram.model.setDataProperty(data, "image", image);
            }
            uic.addItemToList(modifiedObjectViews, {
              id: objview?.id,
              loc: objview?.loc,
              size: objview?.size,
              scale: objview?.scale,
              group: objview?.group,
              isExpanded: objview?.isExpanded,
            });
          }
          // Fix links 
          const linksToRemove = [];
          const links = myDiagram.model.linkDataArray;
          for (let it = links.iterator; it?.next();) {
            const link = it.value;
            const data = link.data;
            if (data.category === "Relationship") {
              let relview: akm.cxRelationshipView = data.relshipview;
              relview = myModelview.findRelationshipView(data.key);
              if (!relview)
                relview = myMetis.findRelationshipView(data.key);
              if (relview) {
                relview.markedAsDeleted = data.markedAsDeleted;
                relview.visible = !relview.markedAsDeleted
                if (relview.visible === false) {
                  linksToRemove.push(link);
                } else {
                  const points = relview.points;
                  if (points?.length == 0 || points?.length == 4) {
                    link.points = [];
                    relview.points = [];
                  }
                }
              }
            }
          }
          for (let i=0; i<linksToRemove.length; i++) {
            const link = linksToRemove[i];
            myDiagram.remove(link);
          }
        }
        break;
      }
      case 'TextEdited': {
        const sel = e.subject.part;
        const gjsData = sel.data;
        let textvalue = gjsData.name;
        if (gjsData.typename === 'Label'){
          textvalue = gjsData.text;
        }
        let field = e.subject.name;
        if (field === "") field = "name";
        // Object type or Object
        if (sel instanceof go.Node) {
          const key: string = gjsData.key;
          const goNode = myGoModel.findNode(key);
          let text: string = textvalue;
          const category: string = gjsData.category;
          // Object type
          if (category === constants.gojs.C_OBJECTTYPE) {
            if (text === 'Edit name') {
              text = prompt('Enter name');
            }
            if (gjsData) {
              gjsData.name = text;
              uic.updateObjectType(gjsData, field, text, context);
              const objtype = myMetis.findObjectType(gjsData.objecttype?.id);
              if (objtype) {
                let data = { id: objtype.id, name: text };
                myDiagram.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data });
              }
            }
          } else { // Object           
            if (text === 'Edit name') {
              text = prompt('Enter name');
              gjsData.name = text;
            }
            const objview = myModelview.findObjectView(key);
            if (objview) {
              let obj = objview.object;
              if (obj) {
                goNode.objRef = obj.id;
                goNode.text = textvalue;
                goNode.name = text;
                obj = uic.updateObject(goNode, field, text, context);
                if (obj) {
                  obj.name = text;
                  obj.text = textvalue;
                  const objviews = obj.objectviews;
                  for (let i = 0; i < objviews.length; i++) {
                    const objview = objviews[i];
                    objview.name = text;
                    objview.text = textvalue;
                    let node = myGoModel.findNodeByViewId(objview?.id);
                    if (node) {
                      const gjsNodeData = myDiagram.findNodeForKey(node.key);
                      if (gjsNodeData) {
                        gjsNodeData.text = textvalue;
                        gjsNodeData.name = text;
                        const jsnObjview = new jsn.jsnObjectView(objview);
                        jsnObjview.name = text;
                        jsnObjview.text = text;
                        modifiedObjectViews.push(jsnObjview);
                        let data = JSON.parse(JSON.stringify(jsnObjview));
                        context.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
                      }
                    }
                  }
                }
                if (obj) {
                  const jsnObj = new jsn.jsnObject(obj);
                  jsnObj.text = textvalue;
                  modifiedObjects.push(jsnObj);
                  let data = JSON.parse(JSON.stringify(jsnObj));
                  context.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
                }
              }
            }
          }
          const goNodes = myGoModel?.nodes;
          for (let i = 0; i < goNodes?.length; i++) {
            const goNode = goNodes[i];
            if (goNode.key === gjsData.key) {
              goNode.name = gjsData.name;
              break;
            }
          }
        }
        // Relationship or Relationship type
        if (sel instanceof go.Link) {
          let key = gjsData.key;
          let text = gjsData.nameFrom ? gjsData.nameFrom : gjsData.name;
          let typename = gjsData.typename;
          // Relationship type
          if (typename === constants.gojs.C_RELSHIPTYPE) {
            const myLink = this.getLink(context.myGoMetamodel, key);
            if (myLink) {
              if (text === 'Edit name') {
                text = prompt('Enter name');
                typename = text;
                gjsData.name = text;
              }
              uic.updateRelationshipType(myLink, "name", text, context);
              gjsData.name = myLink.name;
              if (myLink.reltype) {
                const jsnReltype = new jsn.jsnRelationshipType(myLink.reltype, true);
                modifiedRelshipTypes.push(jsnReltype);
              }
              myDiagram.model?.setDataProperty(myLink.data, "name", myLink.name);
            }
          }
          else { // Relationship
            let relview = gjsData.relshipview;
            if (!relview) {
              relview = myModelview.findRelationshipView(key);
            }
            if (relview) {
              if (text === 'Edit name') {
                text = prompt('Enter name');
                gjsData.name = text;
              }
              let rel = relview.relship as akm.cxRelationship;
              if (rel) {
                rel = myModel.findRelationship(rel.id);
                if (rel) rel.name = text;
                // rel.name = rel.type.name;
                const draftProp = constants.props.DRAFT;
                rel.setStringValue2(draftProp, text);
                const relviews = rel.relshipviews;
                for (let i = 0; i < relviews?.length; i++) {
                  const relview = relviews[i];
                  relview.name = text;
                  if (text === 'Is') {
                    rel.relshipkind = 'Generalization';
                    relview.toArrow = 'Triangle';
                    gjsData.toArrow = 'Triangle';
                    // This doesn't work:
                    let link = myDiagram.findLinkForKey(gjsData.key);
                    myDiagram.model.setDataProperty(link.data, 'toArrow', gjsData.toArrow);
                  }
                  const jsnRelview = new jsn.jsnRelshipView(relview);
                  modifiedRelshipViews.push(jsnRelview);
                  const jsnRel = new jsn.jsnRelationship(rel);
                  modifiedRelships.push(jsnRel);
                  // Dispatches

      // const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
      // let data = { metis: jsnMetis }
      // data = JSON.parse(JSON.stringify(data));
      // myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data });

                  modifiedRelships.map(mn => {
                    let data = mn;
                    data = JSON.parse(JSON.stringify(data));
                    (mn) && myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
                  })
                  modifiedRelshipViews.map(mn => {
                    let data = mn;
                    data = JSON.parse(JSON.stringify(data));
                    (mn) && myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
                  })
                }
              }
            }
          }
        }
        return;
      }
      case "SelectionMoved": {
        let myGoModel = context.myGoModel;
        const myModelview = context.myModelview;
        const selectionShiftPressed = Boolean(myDiagram?.lastInput?.shift);
        const affectedTopLevelGroupKeys = new Set<string | number>();
        let relshipviews = myModelview.relshipviews;
        myModelview.relshipviews = utils.removeArrayDuplicates(relshipviews);
        let objectviews = myModelview.objectviews;
        // Identify selected groups
        const selectedGroupNodes = [];
        let nodes = myGoModel.nodes;
        for (let i=0; i<nodes.length; i++) {
          const node = nodes[i];
          if (node.isGroup) {
            const gjsNode = myDiagram.findNodeForKey(node.key);
            if (gjsNode) {
              if (myDiagram.selection.contains(gjsNode)) {
                selectedGroupNodes.push(node);
              }
            }
          }
        }
        // Add nodes contained in selected groups to the selection
        const additionalSelectedNodes = [];
        for (let i=0; i<selectedGroupNodes.length; i++) {
          const groupNode = selectedGroupNodes[i];
          const gjsGroupNode = myDiagram.findNodeForKey(groupNode.key);
          if (gjsGroupNode) {
            for (let it = gjsGroupNode.memberParts.iterator; it?.next();) {
              let n = it.value;
              if (n instanceof go.Node) {
                if (!myDiagram.selection.contains(n)) {
                  additionalSelectedNodes.push(n);
                }
              }
            }
          }
        }
        // First remember the original locs and scales
  const dragTool = myDiagram.toolManager.draggingTool;
  const previousDragsTree = dragTool.dragsTree;
  dragTool.dragsTree = true;
        const myParts = dragTool.draggedParts;
        dragTool.dragsTree = previousDragsTree;
        const myFromNodes = [];
        for (let it = myParts.iterator; it?.next();) {
          let n = it.value;
          let loc = it.value.point.x + " " + it.value.point.y;
          if (!(it.key.data.category === 'Object'))
            continue;
          let objectview = myModelview.findObjectView(it.key.data.key);
          if (!objectview)
            continue;
          myModelview.repairObjectView(objectview);
          let object = objectview.object;
          object = myModel.findObject(object?.id);
          let scale = Number(objectview.scale);
          if (!scale) scale = 1.0;
          let groupKey = "";
          if (it.key.data.group)
            groupKey = it.key.data.group;
          const myFromNode = {
            "key": it.key.data.key,
            "name": it.key.data.name,
            "group": groupKey,
            "isGroup": it.key.data.isGroup,
            "loc": objectview.loc,
            "size": objectview.size,
            "scale": scale,
            "object": object,
            "objectview": objectview,
          }
          myFromNodes.push(myFromNode);
        }
        // Then remember the new locs
        let myToNodes = [];
        const selection = e.subject;
        for (let it = selection.iterator; it?.next();) {
          let n = it.value;
          if (n instanceof go.Link) continue;
          // Group moves are persisted in a dedicated block later; keep this path
          // scoped to regular nodes to avoid accidental group membership rewrites.
          if (n instanceof go.Group) continue;
          const loc = n.data.loc;
          const goNode = myGoModel.findNode(n.data.key);
          if (!goNode) continue;
          goNode.loc = loc;
          const size = n.actualBounds.width + " " + n.actualBounds.height;
          const currentGroupKey = String(goNode.objectview?.group || goNode.group || n.data.group || "");
          let groupKey = "";
          let group = uic.getGroupByLocation(myGoModel, loc, size, goNode); // goNode
          const containingGroupKey =
            n?.containingGroup instanceof go.Group && n.containingGroup.key !== undefined && n.containingGroup.key !== null
              ? n.containingGroup.key
              : "";
          // Prefer GoJS' resolved membership after a drag over the geometry heuristic.
          // The heuristic can lag when moving a node between groups, which causes the
          // persisted group to be cleared and prevents the child from inheriting scale.
          if (containingGroupKey) {
            const containingGroupNode = myGoModel.findNode(containingGroupKey);
            if (containingGroupNode) {
              group = containingGroupNode;
              groupKey = containingGroupKey;
            }
          } else if (group) {
            groupKey = group.key;
          }
          if (!selectionShiftPressed) {
            groupKey = currentGroupKey;
            goNode.group = currentGroupKey;
            goNode.scale = Number(
              goNode.scale1 ??
              goNode.scale ??
              goNode.objectview?.scale ??
              n.data?.scale1 ??
              n.data?.scale ??
              1.0
            ) || 1.0;
          } else if (!group) {
            goNode.scale = 1.0; 
          } else {
            goNode.group = groupKey;
            goNode.scale = goNode.getMyScale(myGoModel);
          }
          // Avoid self- or cyclic grouping
          if (groupKey && groupKey === n.data.key) {
            groupKey = "";
            goNode.group = "";
          }
          const myToNode = {
            "n": n,
            "gjsData": n.data,
            "key": n.data.key,
            "name": n.data.name,
            "group": groupKey,
            "visualGroup": group?.key || containingGroupKey || "",
            "isGroup": n.data.isGroup,
            "loc": goNode.loc,
            "size": size,
            "scale": Number(goNode.scale),
            "object": goNode.object,
            "objectview": goNode.objectview,
            "objecttype": goNode.objecttype,
            "typeview": goNode.typeview,
          }
          myToNodes.push(myToNode);
          if (selectionShiftPressed && groupKey && (n.data.group !== groupKey)) {
            try {
              myDiagram.model.setDataProperty(n.data, 'group', groupKey);
            } catch (error) {
            }
          }
        }
        // Walk through the from nodes and find the corresponding to nodes
        for (let i = 0; i < myFromNodes.length; i++) {
          const myFromNode = myFromNodes[i];
          for (let j = 0; j < myToNodes.length; j++) {
            const myToNode = myToNodes[j];
            if (myFromNode.key === myToNode.key) {
              const myGoNode = myGoModel.findNode(myToNode.key);
              const myObject: akm.cxObject = myFromNode.object;
              const myObjectview: akm.cxObjectView = myFromNode.objectview;
              myObjectview.loc = myToNode.loc;
              myObjectview.group = myToNode.group;
              myObjectview.scale = myToNode.scale;
              // Move the object
              let goToNode = uic.changeNodeSizeAndPos(myToNode.gjsData, myFromNode.loc, myToNode.loc, 
                                                      myGoModel, myDiagram, myMetis, modifiedObjectViews) as gjs.goObjectNode;
              if (goToNode) {
                goToNode = myGoModel.findNode(goToNode.key);
                if (!goToNode instanceof gjs.goObjectNode) {
                  myGoModel = myGoModel.fixGoModel();
                }
                goToNode.loc = myToNode.loc;
                goToNode.size = myToNode.size;
                goToNode.scale = myToNode.scale;
                goToNode.objectview = myObjectview;
                goToNode.object = myObject;
                goToNode.objecttype = myToNode.objecttype || myObject?.type || goToNode.objecttype;
                if (goToNode.object?.id) goToNode.objRef = goToNode.object.id;
                if (goToNode.objecttype?.id) goToNode.objtypeRef = goToNode.objecttype.id;
                if (myObjectview?.id) goToNode.objviewRef = myObjectview.id;
              }
              // Check if the MOVED node (goToNode) is member of a group
              let goParentGroup = selectionShiftPressed
                ? uic.getGroupByLocation(myGoModel, goToNode.loc, goToNode.size, goToNode)
                : (myToNode.group ? myGoModel.findNode(myToNode.group) as gjs.goObjectNode : null);
              if (!selectionShiftPressed && myToNode.n?.containingGroup instanceof go.Group) {
                const containingKey = myToNode.n.containingGroup.key;
                if (containingKey) {
                  goParentGroup = myGoModel.findNode(containingKey) as gjs.goObjectNode;
                }
              }
              const previousVisualGroupKey = myFromNode.group || "";
              const resolvedGroupKey = goParentGroup?.key || "";
              if (
                previousVisualGroupKey &&
                resolvedGroupKey &&
                resolvedGroupKey !== previousVisualGroupKey &&
                isAncestorGroupKey(myDiagram, resolvedGroupKey, previousVisualGroupKey)
              ) {
                goParentGroup = null;
              }
              let parentObjview = goParentGroup?.objectview; // The container objectview
              if (!parentObjview) {
                parentObjview = myModelview.findObjectView(goParentGroup?.key);
              }
              if (goParentGroup && parentObjview) { // the container (group)
                // goToNode IS member of a group
                // First handle the object (node)
                const gjsPart = myToNode.gjsData; // The object (node) to be moved
                const diagramGroup = myDiagram.findNodeForKey(goParentGroup.key) as go.Group | null;
                if (diagramGroup instanceof go.Group) {
                  attachPartToGroup(myDiagram, myToNode.n, diagramGroup, myToNode.n.data);
                }
                myToNode.group = goParentGroup.key;
                myToNode.gjsData.group = goParentGroup.key;
                goToNode.group = goParentGroup.key; // Make the node a member of the group (container)
                parentObjview.isExpanded = true;
                myObjectview.group = goParentGroup.key;
                myDiagram.model.setDataProperty(gjsPart, "group", goToNode.group);
                goToNode.scale = goToNode.getMyScale(myGoModel);
                gjsPart.scale = Number(goToNode.scale);
                myObjectview.scale = Number(goToNode.scale);
                let loc = uic.scaleNodeLocation1(goParentGroup, goToNode);
                if (loc) {
                  myToNode.loc = loc;
                  myToNode.gjsData.loc = loc;
                  goToNode.loc = myToNode.loc;
                  myObjectview.loc = myToNode.loc;
                  myDiagram.model.setDataProperty(gjsPart, "loc", myToNode.loc);
                }
                goToNode.objectview = myObjectview;
                goToNode.object = myObject;
                goToNode.objecttype = myToNode.objecttype || myObject?.type || goToNode.objecttype;
                if (goToNode.object?.id) goToNode.objRef = goToNode.object.id;
                if (goToNode.objecttype?.id) goToNode.objtypeRef = goToNode.objecttype.id;
                if (myObjectview?.id) goToNode.objviewRef = myObjectview.id;
                gjsPart.objectview = myObjectview;
                gjsPart.object = goToNode.object;
                if (goToNode.object?.id) gjsPart.objRef = goToNode.object.id;
                if (goToNode.objecttype?.id) gjsPart.objtypeRef = goToNode.objecttype.id;
                if (myObjectview?.id) gjsPart.objviewRef = myObjectview.id;
                if (goToNode.objecttype) {
                  myDiagram.model.setDataProperty(gjsPart, "objecttype", goToNode.objecttype);
                }
                myDiagram.model.setDataProperty(gjsPart, "scale", gjsPart.scale);
                myDiagram.model.setDataProperty(gjsPart, "objectview", myObjectview);
                if (goToNode.object) {
                  myDiagram.model.setDataProperty(gjsPart, "object", goToNode.object);
                }
                //
                // const objvIdName = { id: goToNode.key, name: goToNode.name };
                // const objIdName = { id: goToNode.object.id, name: goToNode.object.name };
                // myDiagram.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: objvIdName });
                // myDiagram.dispatch({ type: 'SET_FOCUS_OBJECT', data: objIdName });
    
                // Check if the moved node (goToNode) has a relationship from a group
                // If so, relocate the node to its new parent group (from myObjectview to parentObjview)
                let inoutRelviews = new Array();
                let inputRelviews = myObjectview?.inputrelviews; // Possibly a member relship
                if (inputRelviews?.length > 0) {
                  myObjectview.purgeInputRelviews();
                  inputRelviews = myObjectview.inputrelviews;
                } else {

                  const parentObj = parentObjview?.object;
                  const childObj = goToNode.object;
                  const myHasPartReltype = myMetamodel.findRelationshipTypeByName(constants.types.AKM_CONTAINS);
                  const existingRel = parentObj ? myModel.findRelationship1(parentObj, childObj, myHasPartReltype, null, null) : null;
                  if (!existingRel) {
                    // Create only if it does not already exist.
                    const relId = utils.createGuid();
                    const relName = constants.types.AKM_CONTAINS;
                    const hasPartRelship = new akm.cxRelationship(relId, myHasPartReltype, parentObj, childObj, relName, "");
                    hasPartRelship.parentModelRef = myModel.id;
                    myModel.addRelationship(hasPartRelship);
                    parentObj?.addOutputrel(hasPartRelship);
                    childObj?.addInputrel(hasPartRelship);
                    myMetis.addRelationship(hasPartRelship);
                    // Prepare dispatch
                    const jsnRel = new jsn.jsnRelationship(hasPartRelship);
                    modifiedRelships.push(jsnRel);
                  }
                }
                for (let i = 0; i < inputRelviews?.length; i++) {
                  let relview = inputRelviews[i];
                  if (relview) {
                    let fromObjview = relview.fromObjview; 
                    // Handle the relationship from group to its member
                    if (true && fromObjview?.isGroup) {
                      const relship = relview.relship;
                      const reltype = relship.type;
                      if (
                        reltype && (
                          reltype.name === constants.types.AKM_HAS_MEMBER ||
                          reltype.name === constants.types.AKM_HAS_PART ||
                          reltype.name === constants.types.AKM_CONTAINS
                        )
                      ) {
                        relview = uic.ensureContainsRelationshipView(
                          myModelview,
                          myMetis,
                          relship,
                          parentObjview,
                          myObjectview,
                          false
                        ) || relview;
                        const link = myDiagram.findLinkForKey(relview?.id);
                        if (link) {
                          link.visible = false;
                        }
                      }                        
                      inoutRelviews.push(relview);
                      const jsnRelview = new jsn.jsnRelshipView(relview);
                      uic.addItemToList(modifiedRelshipViews, jsnRelview);
                      const jsnRelship = new jsn.jsnRelationship(relview.relship);
                      uic.addItemToList(modifiedRelships, jsnRelship);
                    }
                  }
                }
                let outputRelviews = myObjectview?.outputrelviews;
                if (outputRelviews?.length > 0) {
                  myObjectview.purgeOutputRelviews();
                  outputRelviews = myObjectview.outputrelviews;
                }                
                for (let i = 0; i < outputRelviews?.length; i++) {
                  let relview = outputRelviews[i];
                  if (relview) {
                    let toObjview = relview.toObjview; 
                    // Handle the relationship from group to its member
                    if (toObjview?.isGroup) {
                      // Relocate
                      const relship = relview.relship;
                      const oldFromObj = relship.fromObject;
                      const newFromObj = parentObjview?.object;
                      const oldToObj = relship.toObject;
                      const newToObj = goToNode.object;
                      if (parentObjview && oldFromObj?.id !== newFromObj?.id) {
                        relship.relocate(oldFromObj, newFromObj, oldToObj, newToObj);
                        relview.relocate(toObjview, parentObjview);
                      }
                      relview = uic.ensureContainsRelationshipView(
                        myModelview,
                        myMetis,
                        relship,
                        parentObjview,
                        myObjectview,
                        false
                      ) || relview;
                    }
                    inoutRelviews.push(relview);
                    const lnk = myDiagram.findLinkForKey(relview.id);
                    if (lnk) {
                      lnk.visible = false;
                    }
                    const jsnRelview = new jsn.jsnRelshipView(relview);
                    uic.addItemToList(modifiedRelshipViews, jsnRelview);
                  }

                  const linkDataArray = myDiagram.model.linkDataArray;
                  for (let i = 0; i < linkDataArray.length; i++) {
                    const linkData = linkDataArray[i];
                    if (linkData.key === relview.id) {
                      break;
                    }
                  }                  
                  const jsnRelship = new jsn.jsnRelationship(relview.relship);
                  uic.addItemToList(modifiedRelships, jsnRelship);                 
                }                
              } else {
                myMetis.purgeInputRelships(myModel);
                // goToNode is NOT visually member of a group.
                // Structural containment may still exist, but it must not force group membership.
                if (selectionShiftPressed && myToNode.n?.containingGroup instanceof go.Group) {
                  detachPartToTopLevel(myDiagram, myToNode.n, myToNode.n.data);
                  const detachedLoc = `${myToNode.n.location.x} ${myToNode.n.location.y}`;
                  myToNode.loc = detachedLoc;
                  myToNode.gjsData.loc = detachedLoc;
                  goToNode.loc = detachedLoc;
                  myObjectview.loc = detachedLoc;
                }
                goToNode.group = "";
                let movedObj = goToNode.object;
                if (!movedObj) {
                  movedObj = myModel.findObject(goToNode.objRef);
                }
                let movedObjview = goToNode.objectview;
                if (!movedObjview) {
                  movedObjview = myModelview.findObjectView(goToNode.objviewRef);
                }
                const gjsPart = myToNode.gjsData;
                myToNode.group = goToNode.group; // ""
                try {
                  myDiagram.model.setDataProperty(gjsPart, "group", myToNode.group);
                  myObjectview.group = myToNode.group;
                } catch (error) {
                }
                let scale = Number(goToNode.scale); // Not part of group
                if (!scale || scale === 0) scale = 1.0;
                gjsPart.scale = scale;
                myObjectview.scale = gjsPart.scale;
                goToNode.objectview = myObjectview;
                goToNode.object = myObject;
                goToNode.objecttype = myToNode.objecttype || myObject?.type || goToNode.objecttype;
                if (goToNode.object?.id) goToNode.objRef = goToNode.object.id;
                if (goToNode.objecttype?.id) goToNode.objtypeRef = goToNode.objecttype.id;
                if (myObjectview?.id) goToNode.objviewRef = myObjectview.id;
                gjsPart.objectview = myObjectview;
                gjsPart.object = goToNode.object;
                if (goToNode.object?.id) gjsPart.objRef = goToNode.object.id;
                if (goToNode.objecttype?.id) gjsPart.objtypeRef = goToNode.objecttype.id;
                if (myObjectview?.id) gjsPart.objviewRef = myObjectview.id;
                if (goToNode.objecttype) {
                  myDiagram.model.setDataProperty(gjsPart, "objecttype", goToNode.objecttype);
                }
                myDiagram.model.setDataProperty(gjsPart, "scale", gjsPart.scale);
                myDiagram.model.setDataProperty(gjsPart, "objectview", myObjectview);
                if (goToNode.object) {
                  myDiagram.model.setDataProperty(gjsPart, "object", goToNode.object);
                }
                // Check if the node has a relationship FROM a group
                let inputRelviews = movedObjview?.inputrelviews;
                if (inputRelviews?.length > 0) {
                  movedObjview.purgeInputRelviews();
                }
                const inputRelships = movedObj?.inputrels;
                for (let i = 0; i < inputRelships?.length; i++) {
                  const relship = inputRelships[i];
                  const fromObj = relship.fromObject;
                  if (!fromObj?.objectviews) 
                    continue;
                  const fromObjviews = myModelview.findObjectViewsByObject(fromObj) as akm.cxObjectView;
                  const fromObjview = fromObjviews[0];
                  if (fromObjview?.isGroup) {
                    // YES
                    myModel.purgeInputRelships(myModel);
                    const fromGroup = fromObjview.object;
                    const fromGroupView = fromObjview;
                    if (selectionShiftPressed) {
                      relship.markedAsDeleted = true;
                      fromGroup?.removeOutputrel?.(relship);
                      movedObj?.removeInputrel?.(relship);
                      const relviewsToDelete = [...(relship.relshipviews || [])];
                      for (let j = 0; j < relviewsToDelete.length; j++) {
                        const relviewToDelete = relviewsToDelete[j];
                        if (!relviewToDelete) continue;
                        relviewToDelete.markedAsDeleted = true;
                        relviewToDelete.visible = false;
                        const link = myDiagram.findLinkForKey(relviewToDelete.id);
                        if (link) {
                          link.visible = false;
                        }
                        const jsnRelview = new jsn.jsnRelshipView(relviewToDelete);
                        uic.addItemToList(modifiedRelshipViews, jsnRelview);
                      }
                      const jsnRelship = new jsn.jsnRelationship(relship);
                      uic.addItemToList(modifiedRelships, jsnRelship);
                      continue;
                    }
                    // Reuse any existing relview for this relationship+target in the current modelview.
                    let relviews = myModelview.findRelationshipViewsByRel2(relship, fromObjview, movedObjview, true);
                    if (!relviews || relviews.length === 0) {
                      const allRelviews = myModelview.findRelationshipViewsByRel(relship, true) || [];
                      relviews = allRelviews.filter((rv: any) =>
                        rv?.toObjview?.id === movedObjview?.id && rv?.fromObjview?.isGroup
                      );
                    }
                    let relview: akm.cxRelationshipView;
                    if (relviews?.length > 0) {
                      relview = relviews[0];
                      relview = uic.ensureContainsRelationshipView(
                        myModelview,
                        myMetis,
                        relship,
                        fromObjview,
                        movedObjview,
                        true
                      ) || relview;
                      // const fromObjview = relview.fromObjview; // Container
                      movedObjview.group = goToNode.group;
                      uic.addItemToList(modifiedObjectViews, {
                        id: movedObjview?.id,
                        group: movedObjview?.group,
                      });
                      relview.toObjview = movedObjview;
                      relview.points = [];
                      const fromNode = myGoModel.findNodeByViewId(fromObjview.id);
                      const toNode = myGoModel.findNodeByViewId(movedObjview.id);   
                      if (fromNode && toNode) {
                        toNode.group = goToNode.group; 
                        const gjsToNode = myDiagram.findNodeForKey(toNode.key);
                        gjsToNode.group = goToNode.group; 
                        gjsToNode.data.group = goToNode.group; 
                        myDiagram.model.setDataProperty(gjsToNode, "group", gjsToNode.group);
                      }
                    } else if (movedObjview) {
                      // The relview does not exist - create it
                      relview = uic.ensureContainsRelationshipView(
                        myModelview,
                        myMetis,
                        relship,
                        fromGroupView,
                        movedObjview,
                        true
                      );
                      const jsnRelship = new jsn.jsnRelationship(relship);
                      if (jsnRelship) {
                        uic.addItemToList(modifiedRelships, jsnRelship);
                      }
                    }
                    if (relview) {
                      const jsnRelview = new jsn.jsnRelshipView(relview);
                      uic.addItemToList(modifiedRelshipViews, jsnRelview);
                    }
                    const lnk = myDiagram.findLinkForKey(relview?.id);
                    // Regression guard: never create a second diagram link for the same
                    // relationship id while moving members in/out of groups.
                    let existingRelLink: go.Link | null = null;
                    if (relship?.id) {
                      myDiagram.links.each((ll: go.Link) => {
                        if (existingRelLink) return;
                        if (ll?.data?.relshipRef === relship.id) existingRelLink = ll;
                      });
                    }
                    if (!lnk && !existingRelLink && relview) {                    
                      // Create a new gojs link
                      myDiagram.startTransaction('AddLink');
                      const link = new gjs.goRelshipLink(relview.id, myGoModel, relview);
                      link.loadLinkContent(myGoModel);
                      link.fromNode = uid.getNodeByViewId(fromGroupView.id, myDiagram);
                      link.from = link.fromNode?.key;
                      link.toNode = uid.getNodeByViewId(movedObjview.id, myDiagram);
                      link.to = link.toNode?.key;
                      if (!link.to) link.to = movedObjview.id;
                      link.points = []; 
                      myGoModel.addLink(link);
                      myDiagram.model.addLinkData(link);   
                      uid.clearPath(myDiagram.links, myMetis, myDiagram);
                      myDiagram.commitTransaction('AddLink');
                    } else if (lnk || existingRelLink) {
                      uid.clearPath(myDiagram.links, myMetis, myDiagram);
                    }
                  } else {
                    // NO
                    const relviews = myModelview.findRelationshipViewsByRel(relship, true);
                    let relview: akm.cxRelationshipView;
                    if (relviews?.length > 0) {
                      relview = relviews[0];
                      relview.visible = true;
                      relview.markedAsDeleted = false;
                      relview.toObjview = movedObjview;
                      relview.points = [];
                      const link = myDiagram.findLinkForKey(relview?.id);
                      if (link) {
                        link.visible = true;
                        link.points = []; 
                        myGoModel.addLink(link);
                        // myDiagram.model.addLinkData(link);   
                        uid.clearPath(myDiagram.links, myMetis, myDiagram);
                      }
                      const jsnRelview = new jsn.jsnRelshipView(relview);
                      uic.addItemToList(modifiedRelshipViews, jsnRelview);
                    }
                  }
                }
              }
              if (myGoNode.key !== myToNode.group) {
                myGoNode.scale = myToNode.scale;
                myGoNode.loc = myToNode.loc;
                myGoNode.group = myToNode.group;
              }
              if (myGoNode.object) {
                const objvIdName = { id: myGoNode.key, name: myGoNode.name };
                const objIdName = { id: myGoNode.object.id, name: myGoNode.object.name };
                myDiagram.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: objvIdName });
                myDiagram.dispatch({ type: 'SET_FOCUS_OBJECT', data: objIdName });
              }
              // Prepare dispatch
              uic.addItemToList(modifiedObjectViews, {
                id: myObjectview?.id,
                loc: myObjectview?.loc,
                group: myObjectview?.group,
                scale: myObjectview?.scale,
              });
            }
          }
        }
        // Persist manual moves for groups (lanes/pools); the object-only block above
        // does not capture group objectviews.
        for (let it = selection.iterator; it?.next();) {
          const sel = it.value;
          if (!(sel instanceof go.Group)) continue;
          const data = sel.data;
          const objview = myModelview.findObjectView(data?.key) || data?.objectview;
          if (!objview) continue;
          const shiftPressed = selectionShiftPressed;
          const isLaneGroup =
            data?.category === "Lane" ||
            data?.category === "Lane_w_handles" ||
            data?.template === "Lane" ||
            data?.template === "Lane_w_handles";
          const previousGroup = objview.group || "";
          if (previousGroup) {
            affectedTopLevelGroupKeys.add(previousGroup);
          }
          const newLoc = `${sel.location.x} ${sel.location.y}`;
          objview.loc = newLoc;
          if (data) {
            myDiagram.model.setDataProperty(data, "loc", newLoc);
          }
          if (data?.size) objview.size = data.size;
          let persistedGroup = objview.group;
          if (isLaneGroup) {
            // Resolve lane membership from the actual drop position.
            // This avoids stale containingGroup values when dragging in/out of pools.
            const dropPoint = (myDiagram.lastInput?.documentPoint as go.Point | undefined)
              || sel.actualBounds.center;
            let targetPool: go.Group | null = null;
            const topGroups = myDiagram.findTopLevelGroups();
            topGroups.each((g: go.Group) => {
              if (targetPool) return;
              const gdata = g?.data;
              const isPool =
                gdata?.category === "Pool" ||
                gdata?.template === "Pool" ||
                g?.category === "Pool";
              if (!isPool) return;
              const poolShape = g.findObject("POOL_SHAPE") as go.GraphObject | null;
              const poolBounds = poolShape ? poolShape.getDocumentBounds() : g.actualBounds;
              if (poolBounds.containsPoint(dropPoint)) targetPool = g;
            });

            persistedGroup = targetPool ? String(targetPool.key) : "";

            // Force membership to match resolved target.
            if (!targetPool && sel.containingGroup instanceof go.Group) {
              const topLevelSet = new go.Set<go.Part>();
              topLevelSet.add(sel);
              myDiagram.commandHandler.addTopLevelParts(topLevelSet, true);
            } else if (targetPool && sel.containingGroup !== targetPool) {
              const memberSet = new go.Set<go.Part>();
              memberSet.add(sel);
              targetPool.addMembers(memberSet, true);
            }
          } else {
            if (!shiftPressed) {
              if (previousGroup && previousGroup !== data?.key) {
                persistedGroup = previousGroup;
              } else if (data?.group && data.group !== data?.key) {
                persistedGroup = data.group;
              } else {
                persistedGroup = "";
              }
            } else {
              const currentSize = data?.size || objview.size || `${sel.actualBounds.width} ${sel.actualBounds.height}`;
              const centerPoint = sel.actualBounds?.center || null;
              const dropPoint = (myDiagram.lastInput?.documentPoint as go.Point | undefined) || null;
              const previousParentPart = previousGroup
                ? myDiagram.findNodeForKey(previousGroup) as go.Group | null
                : null;
              const dropOutsidePreviousParent =
                previousParentPart instanceof go.Group &&
                dropPoint instanceof go.Point &&
                !(getGroupBodyBounds(previousParentPart) || previousParentPart.actualBounds)?.containsPoint?.(dropPoint);
              const pointResolvedGroup =
                resolveDeepestValidGroupAtPoint(myDiagram, sel, centerPoint) ||
                resolveDeepestValidGroupAtPoint(myDiagram, sel, dropPoint);
              const resolvedGroup =
                (pointResolvedGroup
                  ? myGoModel.findNode(pointResolvedGroup.key)
                  : uic.getGroupByLocation(myGoModel, newLoc, currentSize, sel)) as gjs.goObjectNode | null;
              const resolvedGroupPart = resolvedGroup?.key ? myDiagram.findNodeForKey(resolvedGroup.key) as go.Group | null : null;
              const containsType = myMetamodel.findRelationshipTypeByName(constants.types.AKM_CONTAINS);
              const movedObj = objview?.object || myModel?.findObject?.(objview?.objectRef);
              const targetObj = resolvedGroup?.object || myModel?.findObject?.(resolvedGroup?.objRef);
              const invalidResolvedGroup =
                wouldCreateGroupCycle(sel, resolvedGroupPart) ||
                resolvedGroup?.key === data?.key ||
                objectContainsDescendant(movedObj, targetObj, containsType);
              if (dropOutsidePreviousParent && (!resolvedGroup?.key || resolvedGroup?.key === previousGroup)) {
                persistedGroup = "";
              } else if (resolvedGroup?.key && !invalidResolvedGroup) {
                persistedGroup = resolvedGroup.key;
              } else {
                persistedGroup = "";
              }
            }
          }
          if (!isLaneGroup) {
            if (!shiftPressed) {
              // Normal group drags should only reposition the group, not change membership.
            } else if (persistedGroup) {
              const targetGroup = myDiagram.findNodeForKey(persistedGroup) as go.Group | null;
              if (targetGroup instanceof go.Group && !wouldCreateGroupCycle(sel, targetGroup) && sel.containingGroup !== targetGroup) {
                const added = attachPartToGroup(myDiagram, sel, targetGroup, data);
                if (!added) {
                  persistedGroup = "";
                } else {
                  persistedGroup = targetGroup.key;
                }
              }
              if (wouldCreateGroupCycle(sel, targetGroup)) {
                persistedGroup = "";
              }
            } else if (sel.containingGroup instanceof go.Group) {
              persistedGroup = "";
              detachPartToTopLevel(myDiagram, sel, data);
              const detachedLoc = `${sel.location.x} ${sel.location.y}`;
              objview.loc = detachedLoc;
              if (data) {
                myDiagram.model.setDataProperty(data, "loc", detachedLoc);
              }
              try {
                sel.invalidateLayout();
                sel.updateTargetBindings();
                sel.updateAllTargetBindings();
                myDiagram.updateAllTargetBindings();
                myDiagram.requestUpdate();
              } catch (error) {
              }
            }
          }
          if (persistedGroup !== undefined) {
            if (!isLaneGroup && persistedGroup) {
              const persistedTarget = myDiagram.findNodeForKey(persistedGroup) as go.Group | null;
              const containsType = myMetamodel.findRelationshipTypeByName(constants.types.AKM_CONTAINS);
              const movedObj = objview?.object || myModel?.findObject?.(objview?.objectRef);
              const targetObj = persistedTarget?.data?.object || myModel?.findObject?.(persistedTarget?.data?.objRef);
              if (
                wouldCreateGroupCycle(sel, persistedTarget) ||
                objectContainsDescendant(movedObj, targetObj, containsType)
              ) {
                persistedGroup = "";
              }
            }
            if (persistedGroup) {
              affectedTopLevelGroupKeys.add(persistedGroup);
            }
            if (isLaneGroup && persistedGroup === "" && sel.containingGroup instanceof go.Group) {
              // Force detach from pool membership before persisting;
              // otherwise subsequent pool relayout can pull the lane back in.
              const topLevelSet = new go.Set<go.Part>();
              topLevelSet.add(sel);
              myDiagram.commandHandler.addTopLevelParts(topLevelSet, true);
            }
            objview.group = persistedGroup;
            if (data) {
              if (isLaneGroup) {
                myDiagram.model.setGroupKeyForNodeData(data, persistedGroup || undefined);
              } else {
                myDiagram.model.setGroupKeyForNodeData(data, persistedGroup || undefined);
                myDiagram.model.setDataProperty(data, "group", persistedGroup || "");
              }
              (data as any).__previousGroup = previousGroup;
            }
            if (!persistedGroup) {
              objview.group = "";
              clearPartGroupState(myDiagram, sel, data);
            }
          }
          const gnode = myGoModel.findNodeByViewId(objview.id);
          if (gnode) {
            gnode.loc = objview.loc;
            if (objview.size) gnode.size = objview.size;
            if (persistedGroup !== undefined) {
              gnode.group = persistedGroup;
              if (!persistedGroup) {
                gnode.group = "";
                clearPartGroupState(myDiagram, sel, data);
              }
            }
            if (!isLaneGroup && isGroupLikeNode(sel, data || objview)) {
              objview.isGroup = true;
              if (data) {
                data.isGroup = true;
              }
              let nextScale = Number(gnode.scale) || 1.0;
              if (persistedGroup) {
                const parentPart = myDiagram.findNodeForKey(persistedGroup) as go.Group | null;
                const parentVisibleScale = getStoredGroupVisibleScale(parentPart);
                nextScale = Math.max(
                  MIN_NESTED_GROUP_SCALE,
                  parentVisibleScale * NESTED_GROUP_SCALE_MULTIPLIER
                );
                resizeGroupToHalfParent(myDiagram, data, sel, parentPart);
              } else if (!persistedGroup) {
                nextScale = Math.max(
                  MIN_NESTED_GROUP_SCALE,
                  Number(data?.scale1 ?? data?.scale ?? objview?.scale ?? sel.scale ?? gnode.scale) || 1.0
                );
              }
              gnode.scale = nextScale;
              try {
                sel.scale = nextScale;
              } catch (error) {
              }
              objview.scale = nextScale;
              if (data) {
                data.scale = nextScale;
                data.scale1 = nextScale;
                myDiagram.model.setDataProperty(data, "scale", nextScale);
                myDiagram.model.setDataProperty(data, "scale1", nextScale);
              }
              try {
                myDiagram.updateAllTargetBindings();
                myDiagram.requestUpdate();
              } catch (error) {
              }
            }
          }
          assertPartGroupConsistency(myDiagram, sel, persistedGroup);
          if (!isLaneGroup) {
            const movedObj = objview?.object || myModel?.findObject?.(objview?.objectRef);
            const containsType = myMetamodel.findRelationshipTypeByName(constants.types.AKM_CONTAINS);
            const previousParentObjview = previousGroup
              ? (myModelview.findObjectView(previousGroup) || myMetis.findObjectView(previousGroup))
              : null;
            const nextParentObjview = persistedGroup
              ? (myModelview.findObjectView(persistedGroup) || myMetis.findObjectView(persistedGroup))
              : null;
            const previousRel = (movedObj && containsType && previousParentObjview?.object)
              ? myModel.findRelationship1(previousParentObjview.object, movedObj, containsType, null, null)
              : null;
            if (
              previousRel &&
              previousParentObjview?.object &&
              previousGroup &&
              persistedGroup &&
              previousGroup === persistedGroup &&
              !shiftPressed
            ) {
              const parentPart = myDiagram.findNodeForKey(previousGroup) as go.Group | null;
              const visuallyInsideParent = isPartVisuallyInsideGroup(sel, parentPart);
              const nextVisible = !visuallyInsideParent;
              const existingRelviews = myModelview.findRelationshipViewsByRel2(previousRel, previousParentObjview, objview, true)
                || myModelview.findRelationshipViewsByRel(previousRel, true)
                || [];
              const previousVisible = existingRelviews.find((rv: any) =>
                rv?.fromObjview?.id === previousParentObjview.id && rv?.toObjview?.id === objview.id
              )?.visible;
              const currentRelview = uic.ensureContainsRelationshipView(
                myModelview,
                myMetis,
                previousRel,
                previousParentObjview,
                objview,
                nextVisible
              );
              if (currentRelview) {
                const visibilityChanged = previousVisible === undefined ? true : previousVisible !== nextVisible;
                currentRelview.visible = nextVisible;
                let existingRelLink: go.Link | null = myDiagram.findLinkForKey(currentRelview.id);
                if (!existingRelLink && previousRel?.id) {
                  myDiagram.links.each((ll: go.Link) => {
                    if (existingRelLink) return;
                    if (ll?.data?.relshipRef === previousRel.id) existingRelLink = ll;
                  });
                }
                if (existingRelLink) {
                  existingRelLink.visible = nextVisible;
                } else if (nextVisible) {
                  const linkModel = myGoModel || myMetis.gojsModel;
                  if (linkModel) {
                    const goLink = new gjs.goRelshipLink(currentRelview.id, linkModel, currentRelview);
                    goLink.loadLinkContent(linkModel);
                    goLink.fromNode = uid.getNodeByViewId(previousParentObjview.id, myDiagram);
                    goLink.from = goLink.fromNode?.key;
                    goLink.toNode = uid.getNodeByViewId(objview.id, myDiagram);
                    goLink.to = goLink.toNode?.key || objview.id;
                    goLink.points = currentRelview.points || [];
                    linkModel.addLink(goLink);
                    myDiagram.model.addLinkData(goLink);
                  }
                }
                if (visibilityChanged) {
                  const jsnRelview = new jsn.jsnRelshipView(currentRelview);
                  uic.addItemToList(modifiedRelshipViews, jsnRelview);
                  const jsnRelship = new jsn.jsnRelationship(previousRel);
                  uic.addItemToList(modifiedRelships, jsnRelship);
                }
              }
            }
            if (
              previousRel &&
              movedObj &&
              containsType &&
              previousParentObjview?.object &&
              nextParentObjview?.object &&
              previousGroup &&
              persistedGroup &&
              previousGroup !== persistedGroup &&
              !objectContainsDescendant(movedObj, nextParentObjview.object, containsType)
            ) {
              previousRel.relocate(
                previousParentObjview.object,
                nextParentObjview.object,
                movedObj,
                movedObj
              );
              const relocatedRelview = uic.ensureContainsRelationshipView(
                myModelview,
                myMetis,
                previousRel,
                nextParentObjview,
                objview,
                false
              );
              if (relocatedRelview) {
                const link = myDiagram.findLinkForKey(relocatedRelview.id);
                if (link) {
                  link.visible = false;
                }
                const jsnRelview = new jsn.jsnRelshipView(relocatedRelview);
                uic.addItemToList(modifiedRelshipViews, jsnRelview);
              }
              const jsnRelship = new jsn.jsnRelationship(previousRel);
              uic.addItemToList(modifiedRelships, jsnRelship);
            } else if (shiftPressed && movedObj && containsType && previousParentObjview?.object && !persistedGroup) {
              const relsToDelete = new Set<any>();
              const prevRel = myModel.findRelationship1(previousParentObjview.object, movedObj, containsType, null, null);
              if (prevRel) {
                relsToDelete.add(prevRel);
              }
              const inputRels = [...(movedObj.inputrels || [])];
              for (let i = 0; i < inputRels.length; i++) {
                const rel = inputRels[i];
                if (!rel || rel.markedAsDeleted) continue;
                if (rel.type?.name !== containsType.name) continue;
                if (!rel.fromObject?.objectviews?.some?.((ov: any) => ov?.isGroup)) continue;
                relsToDelete.add(rel);
              }
              relsToDelete.forEach((rel: any) => {
                rel.markedAsDeleted = true;
                rel.fromObject?.removeOutputrel?.(rel);
                movedObj?.removeInputrel?.(rel);
                const prevRelviews = [...(rel.relshipviews || [])];
                for (let i = 0; i < prevRelviews.length; i++) {
                  const prevRelview = prevRelviews[i];
                  if (!prevRelview) continue;
                  prevRelview.markedAsDeleted = true;
                  prevRelview.visible = false;
                  const link = myDiagram.findLinkForKey(prevRelview.id);
                  if (link) {
                    link.visible = false;
                  }
                  const jsnRelview = new jsn.jsnRelshipView(prevRelview);
                  uic.addItemToList(modifiedRelshipViews, jsnRelview);
                }
                const jsnRelship = new jsn.jsnRelationship(rel);
                uic.addItemToList(modifiedRelships, jsnRelship);
              });
              if (relsToDelete.size > 0) {
                try {
                  myDiagram.updateAllTargetBindings();
                  myDiagram.requestUpdate();
                } catch (error) {
                }
              }
            }
            if (
              shiftPressed &&
              movedObj &&
              containsType &&
              nextParentObjview?.object &&
              persistedGroup &&
              (!previousRel || previousGroup === persistedGroup || !previousParentObjview?.object) &&
              !objectContainsDescendant(movedObj, nextParentObjview.object, containsType)
            ) {
              let nextRel = myModel.findRelationship1(nextParentObjview.object, movedObj, containsType, null, null);
              if (!nextRel) {
                nextRel = new akm.cxRelationship(
                  utils.createGuid(),
                  containsType,
                  nextParentObjview.object,
                  movedObj,
                  constants.types.AKM_CONTAINS,
                  ""
                );
                nextRel.parentModelRef = myModel.id;
                myModel.addRelationship(nextRel);
                nextParentObjview.object?.addOutputrel(nextRel);
                movedObj?.addInputrel(nextRel);
                myMetis.addRelationship(nextRel);
              }
              const nextRelview = uic.ensureContainsRelationshipView(
                myModelview,
                myMetis,
                nextRel,
                nextParentObjview,
                objview,
                false
              );
              if (nextRelview) {
                const link = myDiagram.findLinkForKey(nextRelview.id);
                if (link) {
                  link.visible = false;
                }
                const jsnRelview = new jsn.jsnRelshipView(nextRelview);
                uic.addItemToList(modifiedRelshipViews, jsnRelview);
              }
              const jsnRelship = new jsn.jsnRelationship(nextRel);
              uic.addItemToList(modifiedRelships, jsnRelship);
            }
            if (shiftPressed && movedObj && containsType && nextParentObjview?.object && persistedGroup) {
              const inputRels = [...(movedObj.inputrels || [])];
              for (let i = 0; i < inputRels.length; i++) {
                const rel = inputRels[i];
                if (!rel || rel.markedAsDeleted) continue;
                if (rel.type?.name !== containsType.name) continue;
                const fromObj = rel.fromObject;
                if (!fromObj?.id || fromObj.id === nextParentObjview.object.id) continue;
                rel.markedAsDeleted = true;
                fromObj.removeOutputrel?.(rel);
                movedObj.removeInputrel?.(rel);
                const relviews = [...(rel.relshipviews || [])];
                for (let j = 0; j < relviews.length; j++) {
                  const relview = relviews[j];
                  if (!relview) continue;
                  relview.markedAsDeleted = true;
                  relview.visible = false;
                  const link = myDiagram.findLinkForKey(relview.id);
                  if (link) {
                    link.visible = false;
                  }
                  const jsnRelview = new jsn.jsnRelshipView(relview);
                  uic.addItemToList(modifiedRelshipViews, jsnRelview);
                }
                const jsnRelship = new jsn.jsnRelationship(rel);
                uic.addItemToList(modifiedRelships, jsnRelship);
              }
            }
          }
          uic.addItemToList(modifiedObjectViews, {
            id: objview?.id,
            loc: objview?.loc,
            size: objview?.size,
            scale: objview?.scale,
            group: objview?.group,
            isExpanded: objview?.isExpanded,
          });
        }
        affectedTopLevelGroupKeys.forEach((groupKey) => {
          const groupPart = myDiagram.findNodeForKey(groupKey) as go.Group | null;
          if (!(groupPart instanceof go.Group)) return;
          if (groupPart.containingGroup instanceof go.Group) return;
          const groupData: any = groupPart.data || {};
          const groupObjview = myModelview.findObjectView(groupData?.key) || groupData?.objectview;
          groupPart.scale = 1.0;
          if (groupData) {
            groupData.scale = 1.0;
            groupData.scale1 = 1.0;
            myDiagram.model.setDataProperty(groupData, "scale", 1.0);
            myDiagram.model.setDataProperty(groupData, "scale1", 1.0);
          }
          if (groupObjview) {
            groupObjview.scale = 1.0;
            uic.addItemToList(modifiedObjectViews, {
              id: groupObjview?.id,
              scale: 1.0,
            });
          }
        });
        { // links
          const links = myDiagram.links;
          for (let it = links.iterator; it?.next();) {
            const link = it.value;
            const rview = myModelview.findRelationshipView(link.data.key);
            if (!rview) continue;
            const ldata = link.data;
            if (rview.fromPortid && ldata?.fromPort !== rview.fromPortid) {
              myDiagram.model.setDataProperty(ldata, "fromPort", rview.fromPortid);
            }
            if (rview.toPortid && ldata?.toPort !== rview.toPortid) {
              myDiagram.model.setDataProperty(ldata, "toPort", rview.toPortid);
            }
            const relviews = myModelview.relshipviews;
            for (let i = 0; i < relviews?.length; i++) {
              const relview = relviews[i];
              if (relview.id === rview.id) {
                const points = [];
                for (let it = link.points.iterator; it?.next();) {
                  const point = it.value;
                  points.push(point.x)
                  points.push(point.y)
                }
                relview.points = points;
                // myModelview.addRelationshipView(relview);
              }
            }
          }
        }
        // Dispatch relshipviews
        myModelview.relshipviews = utils.removeArrayDuplicates(relshipviews);
        const relviews = myModelview.relshipviews;
        for (let i = 0; i < relviews?.length; i++) {
          const relview = relviews[i];
          relview.visible = !relview.markedAsDeleted
          const jsnRelview = new jsn.jsnRelshipView(relview);
          modifiedRelshipViews.push(jsnRelview);
        }
        // Dispatch modelview
        const modifiedModelviews = new Array();
        const jsnModelview = new jsn.jsnModelView(myModelview);
        modifiedModelviews.push(jsnModelview);
        modifiedModelviews.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data });
        });
        if (myDiagram) {
          const toolManager = myDiagram.toolManager;
          const activeTool = toolManager.currentTool;
          if (activeTool && activeTool.isActive) {
            if (activeTool instanceof go.DraggingTool) {
              activeTool.stopTool();
            } else if (typeof activeTool.doCancel === 'function') {
              activeTool.doCancel();
            }
          }
          const dropDragTool = toolManager.draggingTool;
          if (dropDragTool && dropDragTool.isActive) {
            dropDragTool.stopTool();
          }
          const dropDraggedParts = dropDragTool?.draggedParts;
          if (dropDraggedParts?.count > 0) {
            dropDraggedParts.clear();
          }
          const dropCopiedParts = dropDragTool?.copiedParts;
          if (dropCopiedParts?.count > 0) {
            dropCopiedParts.clear();
          }
          // myDiagram.toolManager.draggingTool.reset();
          myDiagram.toolManager.currentTool = myDiagram.defaultTool;
        }

        // Auto-relayout affected pools after lane moves.
        if (!(myDiagram as any).__isPoolRelayoutFromMove) {
          const poolsToRelayout = new Set<string>();
          const movedSelection = e.subject;
          for (let it = movedSelection?.iterator; it?.next();) {
            const part = it.value;
            if (!(part instanceof go.Group)) continue;
            const pdata = part.data;
            const isPool = pdata?.category === 'Pool' || pdata?.template === 'Pool';
            const isLane =
              pdata?.category === 'Lane' ||
              pdata?.category === 'Lane_w_handles' ||
              pdata?.template === 'Lane' ||
              pdata?.template === 'Lane_w_handles';
            if (isPool && pdata?.key) poolsToRelayout.add(pdata.key);
            if (isLane && pdata?.group) poolsToRelayout.add(pdata.group);
            if (isLane && pdata?.__previousGroup) poolsToRelayout.add(pdata.__previousGroup);
            if (isLane && pdata) delete (pdata as any).__previousGroup;
          }
          if (poolsToRelayout.size > 0) {
            (myDiagram as any).__isPoolRelayoutFromMove = true;
            relayoutPoolsByKeys(poolsToRelayout);
            (myDiagram as any).__isPoolRelayoutFromMove = false;

            // Replace stale pre-relayout objectview updates with current post-relayout values.
            const refreshedKeys = new Set<string>();
            poolsToRelayout.forEach((poolKey) => {
              refreshedKeys.add(poolKey);
              const poolNode = myDiagram.findNodeForKey(poolKey);
              if (poolNode instanceof go.Group) {
                poolNode.memberParts.each((part: go.Part) => {
                  if (part instanceof go.Group && part.data?.key) refreshedKeys.add(part.data.key);
                });
              }
            });
            modifiedObjectViews = modifiedObjectViews.filter((ov: any) => !refreshedKeys.has(ov?.id));
            refreshedKeys.forEach((key) => {
              const ov = myMetis.findObjectView(key) || myModelview.findObjectView(key);
              if (!ov) return;
              const node = myDiagram.findNodeForKey(key);
              if (node && node.data) {
                ov.loc = node.data.loc ? String(node.data.loc) : `${node.location.x} ${node.location.y}`;
                if (node.data.size) ov.size = node.data.size;
              }
              const jsnObjview = new jsn.jsnObjectView(ov);
              uic.addItemToList(modifiedObjectViews, jsnObjview);
            });
          }
        }
        break;
      }
      case "SelectionDeleting": {
        // const newNode = myMetis.currentNode;
        const deletedFlag = true;
        let renameTypes = false;
        const selection = e.subject;
        const data = selection.first().data;
        const isMetamodel = this.isMetamodelType(data.category);
        if (isMetamodel) {
          if (confirm("If instances exists, do you want to change their types instead of deleting?")) {
            renameTypes = true;
          }
          // If an object type, identify connected relationship types
          const reltypes = [];
          for (let it = selection?.iterator; it?.next();) {
            const sel = it.value;
            const data = sel.data;
            if (data.markedAsDeleted) continue;
            if (data.category === constants.gojs.C_OBJECTTYPE) {
              const objtype = myMetis.findObjectType(data.objecttype?.id);
              if (objtype) {
                const inputReltypes = objtype.inputreltypes;
                for (let i = 0; i < inputReltypes?.length; i++) {
                  const reltype = inputReltypes[i];
                  if (reltypes.indexOf(reltype) === -1) reltypes.push(reltype);
                }
                const outputReltypes = objtype.outputreltypes;
                for (let i = 0; i < outputReltypes?.length; i++) {
                  const reltype = outputReltypes[i];
                  if (reltypes.indexOf(reltype) === -1) reltypes.push(reltype);
                }
              }
            }
            else if (data.category === constants.gojs.C_RELSHIPTYPE) {
              const reltype = myMetis.findRelationshipType(data.reltype?.id);
              if (reltype) {
                if (reltypes.indexOf(reltype) === -1) reltypes.push(reltype);
              }
            }
            // Handle relationship types
            for (let it = selection?.iterator; it?.next();) {
              const sel = it.value;
              const data = sel.data;
              const key = data.key;
              const typename = data.type;
              if (data.category === constants.gojs.C_RELSHIPTYPE) {
                const defRelType = myMetis.findRelationshipTypeByName(constants.types.AKM_GENERIC_REL);
                const reltype = myMetis.findRelationshipType(data.reltype?.id);
                if (reltype) {
                  // Check if reltype instances exist
                  const rels = myMetis.getRelationshipsByType(reltype, false);
                  if (rels.length > 0) {
                    if (renameTypes) {
                      for (let i = 0; i < rels.length; i++) {
                        const rel = rels[i];
                        rel.type = defRelType;
                        rel.typeview = defRelType.typeview;
                        const jsnRel = new jsn.jsnRelationship(rel);
                        modifiedRelships.push(jsnRel);
                      }
                    } else { // delete the corresponding relationships
                      for (let i = 0; i < rels.length; i++) {
                        const rel = rels[i];
                        rel.markedAsDeleted = deletedFlag;
                        const jsnRel = new jsn.jsnRelationship(rel);
                        modifiedRelships.push(jsnRel);
                      }
                    }
                  }
                  reltype.markedAsDeleted = deletedFlag;
                  uic.deleteRelationshipType(reltype, deletedFlag);
                  let reltypeview = reltype.typeview as akm.cxRelationshipTypeView;
                  if (reltypeview) {
                    reltypeview.markedAsDeleted = deletedFlag;
                    const jsnReltypeView = new jsn.jsnRelshipTypeView(reltypeview);
                    modifiedRelshipTypeViews.push(jsnReltypeView);
                  }
                  const jsnReltype = new jsn.jsnRelationshipType(reltype, true);
                  modifiedRelshipTypes.push(jsnReltype);
                }
              }
            }
            // Handle objecttypes
            let count = 0;
            for (let it = selection?.iterator; it?.next();) {
              count++;
              const sel = it.value;
              const data = sel.data;
              const key = data.key;
              const typename = data.type;
              if (data.category === constants.gojs.C_OBJECTTYPE) {
                const defObjType = myMetis.findObjectTypeByName('Generic');
                const objtype = myMetis.findObjectType(data.objecttype?.id);
                if (objtype) {
                  // Check if objtype instances exist
                  const objects = myMetis.getObjectsByType(objtype, true);
                  if (objects.length > 0) {
                    if (renameTypes) {
                      for (let i = 0; i < objects.length; i++) {
                        const obj = objects[i];
                        obj.type = defObjType;
                        obj.typeview = defObjType.typeview;
                        const jsnObj = new jsn.jsnObject(obj);
                        modifiedObjects.push(jsnObj);
                      }
                    } else { // delete the corresponding objects
                      for (let i = 0; i < objects.length; i++) {
                        const obj = objects[i];
                        obj.markedAsDeleted = deletedFlag;
                        const jsnObj = new jsn.jsnObject(obj);
                        modifiedObjects.push(jsnObj);
                      }
                    }
                  }
                  let objtypeview = objtype.typeview as akm.cxObjectTypeView;
                  if (objtypeview) {
                    objtypeview.markedAsDeleted = deletedFlag;
                    const jsnObjtypeview = new jsn.jsnObjectTypeView(objtypeview);
                    modifiedObjectTypeViews.push(jsnObjtypeview);
                  }
                  const geo = context.myMetamodel.findObjtypeGeoByType(objtype);
                  if (geo) {
                    geo.markedAsDeleted = deletedFlag;
                    const jsnObjtypegeo = new jsn.jsnObjectTypegeo(geo);
                    modifiedObjectTypeGeos.push(jsnObjtypegeo);
                  }
                  objtype.markedAsDeleted = deletedFlag;
                  const jsnObjtype = new jsn.jsnObjectType(objtype);
                  modifiedObjectTypes.push(jsnObjtype);
                }
              }
            }
          }
          if (isMetamodel) {
            uic.purgeModelDeletions(myMetis, myDiagram);
            return;
          }
        } else {
          // Handle relationships
          for (let it = selection?.iterator; it?.next();) {
            const sel = it.value;
            const data = sel.data;
            const key = data.key;
            if (data.category === constants.gojs.C_RELATIONSHIP) {
              const relview = myModelview.findRelationshipView(key);
              if (relview && relview.category === constants.gojs.C_RELSHIPVIEW) {
                relview.markedAsDeleted = deletedFlag;
                const relship = relview.relship;
                if (myMetis.deleteViewsOnly)
                  relship.markedAsDeleted = false;
                else
                  relship.markedAsDeleted = deletedFlag;
                const jsnRelship = new jsn.jsnRelationship(relship);
                modifiedRelships.push(jsnRelship);
                const jsnRelview = new jsn.jsnRelshipView(relview);
                modifiedRelshipViews.push(jsnRelview);
              }
            }
          }
          // Handle relationship views marked as deleted in the modelview
          const relshipviews = myModelview.relshipviews;
          for (let i=0; i<relshipviews.length; i++) {
            const relview = relshipviews[i];
            if (relview.markedAsDeleted) {
              let fromView = relview.fromObjview;
              let toView = relview.toObjview;
              if (fromView && fromView.isGroup) {
                toView.group = "";
                const jsnObjview = new jsn.jsnObjectView(toView);
                modifiedObjectViews.push(jsnObjview);
              }
              toView = relview.toObjview;
              const gjsData = myDiagram.findLinkForKey(relview.id);
              if (gjsData) 
                uic.deleteLink(gjsData, true, context);
            }
            const jsnRelview = new jsn.jsnRelshipView(relview);
            modifiedRelshipViews.push(jsnRelview);
          }
          // Handle objects
          for (let it = selection?.iterator; it?.next();) {
            const sel = it.value;
            const data = sel.data;
            if (data.category === constants.gojs.C_OBJECT) {
              const key = data.key;
              const myNode = this.getNode(context.myGoModel, key);  // Get nodes !!!
              if (myNode) {
                const objview = myModelview.findObjectView(myNode.key);
                const object = objview?.object;
                if (object) {
                  object.markedAsDeleted = !myMetis.deleteViewsOnly;
                  objview.markedAsDeleted = true;
                  const jsnObject = new jsn.jsnObject(object);
                  modifiedObjects.push(jsnObject);
                  const jsnObjview = new jsn.jsnObjectView(objview);
                  modifiedObjectViews.push(jsnObjview);
                }
              }
            }
          }
        }
        for (let i=0; i<modifiedObjectViews.length; i++) {
          const objview = modifiedObjectViews[i];
          if (objview.markedAsDeleted) {
            const myNode = this.getNode(context.myGoModel, objview.id);  
            if (myNode) {
                uic.deleteNode(myNode, deletedFlag, context);
              }
            }
        }
        break;
      }
      case 'ExternalObjectsDropped': {
        const droppedRelLinks: go.ObjectData[] = [];
        const droppedNodesForLayout: go.Node[] = [];
        const poolNodes: go.Node[] = [];
        const poolKeys: Array<string | number> = [];
        const affectedPoolKeys = new Set<string | number>();
        const registerPoolKey = (group: go.Group | null | undefined) => {
          if (!(group instanceof go.Group)) {
            return;
          }
          const poolKey = getNodeKey(group);
          if (poolKey === undefined || poolKey === null) {
            return;
          }
          if (!affectedPoolKeys.has(poolKey)) {
            affectedPoolKeys.add(poolKey);
          }
        };
        let shouldZoomToFitAfterDrop = false;
        let lanesDroppedIntoPool = false;
        const nodeIterator = e.subject.iterator;
        while (nodeIterator?.next()) {
          const part = nodeIterator.value;
          if (part instanceof go.Node) {
            droppedNodesForLayout.push(part);
          }
        }
  if (droppedNodesForLayout.length) {
          const primaryDiagram = e.diagram || myDiagram;
          const dropPoint =
            primaryDiagram?.lastInput?.documentPoint?.copy() ||
            myDiagram?.lastInput?.documentPoint?.copy() ||
            null;

          const modelData = (myDiagram?.model as any)?.modelData ?? {};
          const dropOverrides = modelData?.dropLayout && typeof modelData.dropLayout === 'object'
            ? modelData.dropLayout
            : undefined;
          const presetName = dropOverrides?.preset ?? myModelview?.layout;
          const layoutConfig = deriveDropLayoutConfig(presetName, dropOverrides);

          const metadata = layoutConfig?.metadata || {};
          const poolTypeIds = Array.isArray(metadata.poolTypeIds) ? metadata.poolTypeIds : [];
          const laneTypeIds = Array.isArray(metadata.laneTypeIds) ? metadata.laneTypeIds : [];
          const containerTypeIds = Array.isArray(metadata.containerTypeIds) ? metadata.containerTypeIds : [];
          if (myDiagram) {
            const shouldCommitGrouping = !myDiagram.isInTransaction;
            if (shouldCommitGrouping) {
              myDiagram.startTransaction('assign-drop-groups');
            }
            try {
              const laneNodes: go.Node[] = [];
              const containerNodes: go.Node[] = [];
              const otherNodes: go.Node[] = [];

              for (let i = 0; i < droppedNodesForLayout.length; i++) {
                // if (droppedNodesForLayout.length < 2) return; // No need to group a single node and try to avoid existing nodes, let the user handle that
                const node = droppedNodesForLayout[i];
                const typeRef = getNodeTypeRef(node);
                const data: any = node?.data || {};
                const viewkind = (data.viewkind || data.viewKind || '').toString().toLowerCase();
                const templateName = (data.template || data.category || '').toString().toLowerCase();
                const name = (data.name || '').toString().toLowerCase();
                const isPool =
                  (typeRef && poolTypeIds.includes(typeRef)) ||
                  viewkind === 'pool' ||
                  templateName.includes('pool') ||
                  name.includes('pool');
                if (isPool) {
                  poolNodes.push(node);
                  shouldZoomToFitAfterDrop = true;
                  registerPoolKey(node instanceof go.Group ? node : node.containingGroup);
                  continue;
                }
                const isLane =
                  (typeRef && laneTypeIds.includes(typeRef)) ||
                  viewkind === 'lane' ||
                  templateName.includes('lane') ||
                  name.includes('lane');
                if (isLane) {
                  laneNodes.push(node);
                  lanesDroppedIntoPool = true;
                  continue;
                }
                const isContainer =
                  (typeRef && containerTypeIds.includes(typeRef)) ||
                  viewkind === 'container' ||
                  templateName.includes('container');
                if (isContainer) {
                  containerNodes.push(node);
                  continue;
                }
                otherNodes.push(node);
              }

              if (poolNodes.length) {
                const uniquePoolKeys = new Set<string | number>();
                for (let i = 0; i < poolNodes.length; i++) {
                  const poolNode = poolNodes[i];
                  ensureNodeIsGroup(myDiagram, poolNode);
                  const poolKey = getNodeKey(poolNode);
                  if (poolKey !== undefined && poolKey !== null && !uniquePoolKeys.has(poolKey)) {
                    uniquePoolKeys.add(poolKey);
                    poolKeys.push(poolKey);
                    registerPoolKey(myDiagram.findNodeForKey(poolKey) as go.Group | null);
                  }
                }

              if (poolKeys.length) {
                  for (let i = 0; i < laneNodes.length; i++) {
                    const laneNode = laneNodes[i];
                    ensureNodeIsGroup(myDiagram, laneNode);
                    const existing = getGroupKeyFromData(laneNode?.data);
                    const poolKey = poolKeys[i % poolKeys.length];
                    if (existing === null || existing === undefined) {
                      setNodeGroup(myDiagram, laneNode, poolKey);
                    }
                    ensureInitialGroupSize(
                      myDiagram,
                      laneNode,
                      laneNode?.data,
                      getSizeOptionsForType('lane')
                    );
                    const targetPool = myDiagram.findNodeForKey(poolKey);
                    registerPoolKey(targetPool as go.Group | null);
                    lanesDroppedIntoPool = true;
                  }

                  const laneKeys: Array<string | number> = [];
                  const laneKeySet = new Set<string | number>();
                  for (let i = 0; i < laneNodes.length; i++) {
                    const laneKey = getNodeKey(laneNodes[i]);
                    if (laneKey !== undefined && laneKey !== null && !laneKeySet.has(laneKey)) {
                      laneKeySet.add(laneKey);
                      laneKeys.push(laneKey);
                    }
                  }

                  for (let i = 0; i < containerNodes.length; i++) {
                    const containerNode = containerNodes[i];
                    ensureNodeIsGroup(myDiagram, containerNode);
                    const existing = getGroupKeyFromData(containerNode?.data);
                    if (existing !== null && existing !== undefined) {
                      continue;
                    }
                    const poolKey = poolKeys[i % poolKeys.length];
                    setNodeGroup(myDiagram, containerNode, poolKey);
                  }

                  for (let i = 0; i < otherNodes.length; i++) {
                    const node = otherNodes[i];
                    const existing = getGroupKeyFromData(node?.data);
                    if (existing !== null && existing !== undefined) {
                      continue;
                    }
                    let assignedKey = null;
                    if (laneKeys.length) {
                      assignedKey = laneKeys[i % laneKeys.length];
                    } else if (poolKeys.length) {
                      assignedKey = poolKeys[i % poolKeys.length];
                    }
                    if (assignedKey !== null && assignedKey !== undefined) {
                      setNodeGroup(myDiagram, node, assignedKey);
                    }
                  }
                }
              }
            } finally {
              if (shouldCommitGrouping && myDiagram.isInTransaction) {
                myDiagram.commitTransaction('assign-drop-groups');
              }
            }
          }

        const buckets = new Map< // Map to hold node buckets for layout
          string,
          { nodes: go.Node[]; targetGroup: go.Group | null; groupKey: string | number | null }
        >();

          for (let i = 0; i < droppedNodesForLayout.length; i++) {
            const node = droppedNodesForLayout[i];
            const containingGroup = node?.containingGroup instanceof go.Group ? node.containingGroup : null;
            const nodeCenter = node?.actualBounds?.center || null;
            const pointGroup =
              resolveDeepestDropTargetGroup(myDiagram, node, dropPoint || null) ||
              resolveDeepestDropTargetGroup(myDiagram, node, nodeCenter);
            let resolvedTargetGroup = containingGroup;
            if (pointGroup instanceof go.Group) {
              if (
                !containingGroup ||
                containingGroup === pointGroup ||
                isAncestorGroupKey(myDiagram, containingGroup.key, pointGroup.key)
              ) {
                resolvedTargetGroup = pointGroup;
              }
            }
            const dataGroupKey = getGroupKeyFromData(node?.data);
            const groupKey =
              resolvedTargetGroup
                ? getNodeKey(resolvedTargetGroup)
                : (dataGroupKey !== null && dataGroupKey !== undefined ? dataGroupKey : null);
            const bucketKey = groupKey === null ? '__drop-root__' : String(groupKey);
            if (!buckets.has(bucketKey)) {
              const groupPart =
                resolvedTargetGroup ||
                (groupKey !== null && myDiagram
                  ? myDiagram.findNodeForKey(groupKey)
                  : null);
              buckets.set(bucketKey, {
                nodes: [],
                targetGroup: groupPart instanceof go.Group ? groupPart : null,
                groupKey: groupKey,
              });
            }
            const bucket = buckets.get(bucketKey);
            if (bucket) {
              if (
                bucket.targetGroup instanceof go.Group &&
                node.containingGroup !== bucket.targetGroup
              ) {
                const memberSet = new go.Set<go.Part>();
                memberSet.add(node);
                bucket.targetGroup.addMembers(memberSet, true);
                setNodeGroup(myDiagram, node, bucket.targetGroup.key);
              }
              bucket.nodes.push(node);
            }
          }

          const bucketList = Array.from(buckets.values());
          const groupsForFollowUp = new Set<go.Group>();
          bucketList.sort((a, b) => {
            const aRoot = a.groupKey === null || a.groupKey === undefined;
            const bRoot = b.groupKey === null || b.groupKey === undefined;
            if (aRoot && !bRoot) return -1;
            if (!aRoot && bRoot) return 1;
            return 0;
          });

          for (let i = 0; i < bucketList.length; i++) {
            const bucket = bucketList[i];
            if (!bucket.nodes.length) continue;
            let bucketDropPoint: go.Point | null = null;
            if (bucket.targetGroup && bucket.targetGroup.actualBounds) {
              const bounds = bucket.targetGroup.actualBounds;
              if (bounds && bounds.center) {
                bucketDropPoint = bounds.center.copy();
              }
            }
            if (!bucketDropPoint && dropPoint) {
              bucketDropPoint = dropPoint.copy ? dropPoint.copy() : dropPoint;
            }
            // Only apply automated drop layout if explicitly enabled by the model or layout config.
            // Default behaviour is to NOT change node positions automatically on drop so the user
            // can choose when to run layouts.
            const modelData: any = myDiagram?.model?.modelData || {};
            const autoApplyFromModel = modelData?.autoApplyDropLayout === true || modelData?.autoApply === true;
            const autoApplyFromLayout = (layoutConfig as any)?.autoApply === true || (layoutConfig as any)?.autoApplyDrop === true;
            const autoApplyLayout = Boolean(autoApplyFromModel || autoApplyFromLayout);
            if (autoApplyLayout) {
              applyDropLayout({
                diagram: myDiagram,
                parts: bucket.nodes,
                dropPoint: bucketDropPoint,
                config: layoutConfig,
                targetGroup: bucket.targetGroup,
              });
            }
            if (bucket.targetGroup instanceof go.Group) {
              const parentVisibleScale = getStoredGroupVisibleScale(bucket.targetGroup);
              const inheritedScale = getEffectiveParentMemberScale(bucket.targetGroup, myGoModel);
              for (let j = 0; j < bucket.nodes.length; j++) {
                const node = bucket.nodes[j];
                const nodeData: any = node?.data || {};
                const currentObjview = nodeData.objectview || myModelview?.findObjectView(nodeData?.key);
                let nextScale = inheritedScale;
                if (isGroupLikeNode(node, nodeData)) {
                  nextScale = Math.max(MIN_NESTED_GROUP_SCALE, parentVisibleScale * NESTED_GROUP_SCALE_MULTIPLIER);
                  resizeGroupToHalfParent(myDiagram, nodeData, node, bucket.targetGroup);
                }
                node.scale = nextScale;
                if (nodeData) {
                  nodeData.scale = nextScale;
                  nodeData.scale1 = nextScale;
                  myDiagram.model.setDataProperty(nodeData, "scale", nextScale);
                  myDiagram.model.setDataProperty(nodeData, "scale1", nextScale);
                }
                if (currentObjview) {
                  const nextObjview = new jsn.jsnObjectView(currentObjview);
                  nextObjview.group = String(bucket.groupKey ?? "");
                  nextObjview.scale = nextScale;
                  if (nodeData) {
                    nodeData.objectview = nextObjview;
                    myDiagram.model.setDataProperty(nodeData, "objectview", nextObjview);
                  }
                  uic.addItemToList(modifiedObjectViews, nextObjview);
                }
              }
              groupsForFollowUp.add(bucket.targetGroup);
              const container = bucket.targetGroup.containingGroup;
              if (container instanceof go.Group) {
                groupsForFollowUp.add(container);
              }
            } else {
              for (let j = 0; j < bucket.nodes.length; j++) {
                const node = bucket.nodes[j];
                if (!(node instanceof go.Group)) continue;
                const nodeData: any = node?.data || {};
                const currentObjview = nodeData.objectview || myModelview?.findObjectView(nodeData?.key);
                node.scale = 1.0;
                if (nodeData) {
                  nodeData.scale = 1.0;
                  nodeData.scale1 = 1.0;
                  myDiagram.model.setDataProperty(nodeData, "scale", 1.0);
                  myDiagram.model.setDataProperty(nodeData, "scale1", 1.0);
                }
                if (currentObjview) {
                  const nextObjview = new jsn.jsnObjectView(currentObjview);
                  nextObjview.group = "";
                  nextObjview.scale = 1.0;
                  if (nodeData) {
                    nodeData.objectview = nextObjview;
                    myDiagram.model.setDataProperty(nodeData, "objectview", nextObjview);
                  }
                  uic.addItemToList(modifiedObjectViews, nextObjview);
                }
              }
            }
          }

          // Only apply follow-up group layouts if auto-apply is enabled.
          if (Boolean(((myDiagram?.model as any)?.modelData?.autoApplyDropLayout === true) || ((layoutConfig as any)?.autoApply === true))) {
            groupsForFollowUp.forEach(group => {
              if (!isPoolLike(group.data)) {
                applyDropLayoutToGroup(myDiagram, group);
              }
              if (group.containingGroup instanceof go.Group && !isPoolLike(group.containingGroup.data)) {
                applyDropLayoutToGroup(myDiagram, group.containingGroup);
              }
            });
          }

        }

        const applyGroupTemplateToDiagram = (part: go.Node | null, template: string | null) => {
          if (!myDiagram || !part || !template) return;
          myDiagram.startTransaction('apply-drop-group-template');
          try {
            const data = part.data;
            if (!data) return;
            data.isGroup = true;
            data.viewkind = constants.viewkinds.CONT;
            data.template = template;
            if (typeof myDiagram.model.setCategoryForNodeData === 'function') {
              myDiagram.model.setCategoryForNodeData(data, template);
            } else {
              myDiagram.model.setDataProperty(data, 'category', template);
            }
            myDiagram.model.updateTargetBindings(data);
            part.updateTargetBindings();
            part.ensureBounds();
          } finally {
            myDiagram.commitTransaction('apply-drop-group-template');
          }
          myDiagram.layoutDiagram(true);
        };
        const clearGroupTemplateFromDiagram = (part: go.Node | null) => {
          if (!myDiagram || !part) return;
          myDiagram.startTransaction('revert-drop-to-node');
          try {
            const data = part.data;
            if (!data) return;
            data.isGroup = false;
            data.viewkind = constants.viewkinds.OBJ;
            data.template = data.template || constants.gojs.C_NODETEMPLATE;
            myDiagram.model.setCategoryForNodeData(data, data.template || constants.gojs.C_NODETEMPLATE);
            myDiagram.model.updateTargetBindings(data);
            part.updateTargetBindings();
            part.ensureBounds();
          } finally {
            myDiagram.commitTransaction('revert-drop-to-node');
          }
          myDiagram.layoutDiagram(true);
        };
        const isPoolLike = (data: any): boolean => {
          if (!data) return false;
          const viewkind = (data.viewkind || data.viewKind || '').toString().toLowerCase();
          const templateName = (data.template || data.category || '').toString().toLowerCase();
          const name = (data.name || '').toString().toLowerCase();
          const typeName = (data.objecttype?.name || data.objecttype?.typename || '').toString().toLowerCase();
          return [viewkind, templateName, name, typeName].some((val) => val.includes('pool'));
        };
        const isLaneLike = (data: any): boolean => {
          if (!data) return false;
          const explicitFlag = Boolean(data.isLane === true || data.lane === true || data.laneGroup === true);
          if (explicitFlag) {
            return true;
          }
          const viewkind = (data.viewkind || data.viewKind || '').toString().toLowerCase();
          if (viewkind === 'lane' || viewkind === 'swimlane') {
            return true;
          }
          const templateName = (data.template || '').toString().toLowerCase();
          if (templateName.includes('lane')) {
            return true;
          }
          const categoryName = (data.category || '').toString().toLowerCase();
          if (categoryName.includes('lane')) {
            return true;
          }
          const typeName = (data.objecttype?.name || data.objecttype?.typename || '').toString().toLowerCase();
          if (typeName.includes('lane')) {
            return true;
          }
          return false;
        };
        const findContainingPool = (part: go.Part | null | undefined): go.Group | null => {
          let current: go.Group | null = null;
          if (part instanceof go.Node) {
            current = part.containingGroup;
          } else if (part instanceof go.Group) {
            current = part;
          }
          while (current) {
            if (current.category && current.category.toString().toLowerCase().includes('pool')) {
              return current;
            }
            if (isPoolLike(current.data)) {
              return current;
            }
            current = current.containingGroup;
          }
          return null;
        };
        const registerPoolFromPart = (part: go.Part | null | undefined) => {
          const pool = findContainingPool(part);
          if (pool) {
            registerPoolKey(pool);
          }
        };

        const relayoutPoolGroupAfterLaneChanges = (
          diagram: go.Diagram | null | undefined,
          poolGroup: go.Group | null | undefined,
          laneSpacing = 4
        ) => {
          if (!diagram || !(poolGroup instanceof go.Group)) {
            return;
          }

          const laneGroups: go.Group[] = [];
          poolGroup.memberParts.each((member: go.Part) => {
            if (member instanceof go.Group && isLaneLike(member.data)) {
              laneGroups.push(member);
            }
          });

          if (!laneGroups.length) {
            return;
          }

          const detectPoolLeftHeaderReserve = (group: go.Group | null | undefined): number => {
            if (!(group instanceof go.Group)) {
              return 0;
            }
            let maxWidth = 0;
            const candidateNames = [
              'LEFT_HEADER',
              'leftHeader',
              'poolLeftHeader',
              'leftLabel',
              'HEADER_LEFT',
              'poolHeaderLeft',
              'POOL_LEFT_HEADER',
              'poolLeftLabel',
              'leftHeaderPanel',
            ];
            for (let i = 0; i < candidateNames.length; i++) {
              try {
                const obj = group.findObject(candidateNames[i]);
                const bounds = obj?.actualBounds;
                if (bounds && bounds.width) {
                  maxWidth = Math.max(maxWidth, bounds.width);
                }
              } catch (err) {
                // ignore lookup issues and continue
              }
            }
            const dataWidth = (() => {
              const d: any = group.data;
              if (!d) return 0;
              const candidates = [d.leftHeaderWidth, d.headerWidth, d.poolHeaderWidth];
              for (let i = 0; i < candidates.length; i++) {
                const value = candidates[i];
                if (typeof value === 'number' && !Number.isNaN(value)) {
                  return value;
                }
              }
              return 0;
            })();
            const fallbackReserve = 28;
            return Math.max(maxWidth, dataWidth, fallbackReserve);
          };

          const updateGroupObjectView = (
            group: go.Group | null | undefined,
            locationPoint: go.Point | null,
            sizeValue: go.Size | null
          ) => {
            if (!(group instanceof go.Group)) {
              return;
            }
            const modelview = myMetis?.currentModelview;
            if (!modelview) {
              return;
            }
            const data: any = group.data;
            if (!data) {
              return;
            }
            let objview = data.objectview;
            if (!objview && data.objviewRef) {
              objview = modelview.findObjectView(data.objviewRef);
            }
            if (!objview && data.key !== undefined) {
              objview = modelview.findObjectView(data.key);
            }
            if (!objview) {
              return;
            }
            if (locationPoint) {
              const locString = go.Point.stringify(locationPoint);
              objview.loc = locString;
            }
            if (sizeValue) {
              const sizeString = `${sizeValue.width} ${sizeValue.height}`;
              objview.size = sizeString;
            }
            const marker = objview as any;
            if (marker && typeof marker.setModified === 'function') {
              try {
                marker.setModified();
              } catch (err) {
                // ignore if objectview does not support setModified
              }
            }
            try {
              const jsnObjview = new jsn.jsnObjectView(objview);
              uic.addItemToList(modifiedObjectViews, jsnObjview);
            } catch (err) {
              // ignore serialization issues
            }
          };

          const getLaneSortValue = (lane: go.Group): number => {
            const rawLoc = lane?.data?.loc;
            if (typeof rawLoc === 'string' && rawLoc.trim().length) {
              try {
                const parsed = go.Point.parse(rawLoc);
                if (parsed) {
                  return parsed.y;
                }
              } catch (err) {
                // ignore parse errors and continue
              }
            }
            if (lane.location) {
              return lane.location.y;
            }
            const bounds = lane.actualBounds;
            if (bounds) {
              return bounds.y;
            }
            return 0;
          };

          laneGroups.sort((a, b) => {
            const diff = getLaneSortValue(a) - getLaneSortValue(b);
            if (Math.abs(diff) < 0.5) {
              const aKey = getNodeKey(a);
              const bKey = getNodeKey(b);
              if (aKey !== undefined && aKey !== null && bKey !== undefined && bKey !== null) {
                return String(aKey).localeCompare(String(bKey));
              }
            }
            return diff;
          });

          let poolLocation = poolGroup.location?.copy() || null;
          if (!poolLocation) {
            const rawPoolLoc = typeof poolGroup?.data?.loc === 'string' ? poolGroup.data.loc : '';
            if (rawPoolLoc && rawPoolLoc.trim().length) {
              try {
                poolLocation = go.Point.parse(rawPoolLoc);
              } catch (err) {
                poolLocation = null;
              }
            }
          }
          if (!poolLocation) {
            poolLocation = new go.Point(0, 0);
          }

          const poolBounds = poolGroup.actualBounds?.copy();
          const poolSize = parseSizeString(poolGroup?.data?.size);
          const poolResizeObject = poolGroup.resizeObject || poolGroup.placeholder || null;
          const poolWidthCandidates: number[] = [];
          if (poolResizeObject?.desiredSize?.width) {
            poolWidthCandidates.push(poolResizeObject.desiredSize.width);
          }
          if (poolSize?.width) {
            poolWidthCandidates.push(poolSize.width);
          }
          if (poolBounds?.width) {
            poolWidthCandidates.push(poolBounds.width);
          }
          let poolWidth = poolWidthCandidates.length ? Math.max(...poolWidthCandidates) : 1400;

          const poolLeftReserve = detectPoolLeftHeaderReserve(poolGroup);
          const lanePaddingLeft = 8;
          const lanePaddingRight = 8;
          const laneTopMargin = 12;
          const laneBottomMargin = 8;
          const minLaneWidth = 120;

          const model = diagram.model;
          const initialLaneWidthAvailable = Math.max(
            poolWidth - poolLeftReserve - lanePaddingLeft - lanePaddingRight,
            minLaneWidth
          );

          const laneLayouts: Array<{
            lane: go.Group;
            height: number;
            storedWidth: number;
            contentWidth: number;
            hasStoredWidth: boolean;
            topY: number;
          }> = [];

          let maxLaneWidthUsed = 0;

          laneGroups.forEach((lane) => {
            const laneSizeData = parseSizeString(lane?.data?.size);
            const resizeObject = lane.resizeObject || lane.placeholder || lane;
            const laneBounds = lane.actualBounds?.copy();
            const desiredSize = resizeObject?.desiredSize;

            const laneHeightCandidates: number[] = [];
            if (typeof desiredSize?.height === 'number' && Number.isFinite(desiredSize.height) && desiredSize.height > 0) {
              laneHeightCandidates.push(desiredSize.height);
            }
            if (typeof laneSizeData?.height === 'number' && Number.isFinite(laneSizeData.height) && laneSizeData.height > 0) {
              laneHeightCandidates.push(laneSizeData.height);
            }
            if (typeof laneBounds?.height === 'number' && Number.isFinite(laneBounds.height) && laneBounds.height > 0) {
              laneHeightCandidates.push(laneBounds.height);
            }
            const laneHeight = laneHeightCandidates.length ? Math.max(...laneHeightCandidates) : 260;

            const laneWidthCandidates: number[] = [];
            if (typeof desiredSize?.width === 'number' && Number.isFinite(desiredSize.width) && desiredSize.width > 0) {
              laneWidthCandidates.push(desiredSize.width);
            }
            if (typeof laneSizeData?.width === 'number' && Number.isFinite(laneSizeData.width) && laneSizeData.width > 0) {
              laneWidthCandidates.push(laneSizeData.width);
            }
            if (typeof laneBounds?.width === 'number' && Number.isFinite(laneBounds.width) && laneBounds.width > 0) {
              laneWidthCandidates.push(laneBounds.width);
            }

            let laneMemberContentWidth = 0;
            if (lane.memberParts) {
              lane.memberParts.each((member: go.Part) => {
                if (!(member instanceof go.Node || member instanceof go.Group)) {
                  return;
                }
                const memberBounds = member.actualBounds;
                if (!memberBounds) {
                  return;
                }
                const memberWidth = memberBounds.width;
                if (typeof memberWidth !== 'number' || !Number.isFinite(memberWidth) || memberWidth <= 0) {
                  return;
                }
                laneMemberContentWidth = Math.max(laneMemberContentWidth, memberWidth);
              });
            }

            const storedWidth = laneWidthCandidates.length ? Math.max(...laneWidthCandidates) : 0;
            const hasStoredWidth = storedWidth > 0;
            const contentWidthWithPadding = laneMemberContentWidth > 0
              ? laneMemberContentWidth + lanePaddingLeft + lanePaddingRight
              : 0;

            const desiredLaneWidth = Math.max(
              initialLaneWidthAvailable,
              contentWidthWithPadding,
              hasStoredWidth ? storedWidth : 0
            );
            maxLaneWidthUsed = Math.max(maxLaneWidthUsed, desiredLaneWidth);

            laneLayouts.push({
              lane,
              height: laneHeight,
              storedWidth: storedWidth,
              contentWidth: contentWidthWithPadding,
              hasStoredWidth,
              topY: 0,
            });
          });

          let currentY = poolLocation.y + laneTopMargin;
          laneLayouts.forEach((layout, index) => {
            layout.topY = currentY;
            currentY += layout.height;
            if (index < laneLayouts.length - 1) {
              currentY += laneSpacing;
            }
          });
          currentY += laneBottomMargin;

          const totalHeight = currentY - poolLocation.y;
          const requiredPoolWidth = poolLeftReserve + lanePaddingLeft + Math.max(
            maxLaneWidthUsed,
            initialLaneWidthAvailable,
            minLaneWidth
          ) + lanePaddingRight;
          poolWidth = Math.max(poolWidth, requiredPoolWidth);
          const finalLaneWidthAvailable = Math.max(
            poolWidth - poolLeftReserve - lanePaddingLeft - lanePaddingRight,
            minLaneWidth
          );

          laneLayouts.forEach((layout) => {
            const lane = layout.lane;
            const laneHeight = layout.height;
            let laneWidth = finalLaneWidthAvailable;
            if (layout.hasStoredWidth && layout.storedWidth > 0) {
              laneWidth = Math.max(laneWidth, layout.storedWidth);
            }
            if (layout.contentWidth > 0) {
              laneWidth = Math.max(laneWidth, layout.contentWidth);
            }

            const laneTopLeftX = poolLocation.x + poolLeftReserve + lanePaddingLeft;
            const laneTopLeft = new go.Point(laneTopLeftX, layout.topY);
            let laneLocationPoint = laneTopLeft;
            try {
              const spot = lane.locationSpot;
              if (spot && typeof spot.equals === 'function' && spot.equals(go.Spot.Center)) {
                laneLocationPoint = new go.Point(
                  laneTopLeftX + laneWidth / 2,
                  layout.topY + laneHeight / 2
                );
              }
            } catch (err) {
              laneLocationPoint = laneTopLeft;
            }

            lane.location = laneLocationPoint;
            if (lane.data) {
              const locString = go.Point.stringify(laneLocationPoint);
              if (model && typeof model.setDataProperty === 'function') {
                model.setDataProperty(lane.data, 'loc', locString);
              } else {
                lane.data.loc = locString;
              }
            }

            const newLaneSize = new go.Size(laneWidth, laneHeight);
            const resizeObject = lane.resizeObject || lane.placeholder || lane;
            if (resizeObject) {
              resizeObject.desiredSize = newLaneSize;
            }
            try {
              lane.desiredSize = newLaneSize;
            } catch (err) {
              // ignore if lane does not support desiredSize assignment
            }
            if (lane.data) {
              const sizeString = `${newLaneSize.width} ${newLaneSize.height}`;
              if (model && typeof model.setDataProperty === 'function') {
                model.setDataProperty(lane.data, 'size', sizeString);
              } else {
                lane.data.size = sizeString;
              }
            }
            updateGroupObjectView(lane, laneLocationPoint, newLaneSize);

            lane.ensureBounds();
          });

          if (poolResizeObject instanceof go.GraphObject) {
            const poolHeightCandidates: number[] = [];
            if (poolResizeObject.desiredSize?.height) {
              poolHeightCandidates.push(poolResizeObject.desiredSize.height);
            }
            if (poolSize?.height) {
              poolHeightCandidates.push(poolSize.height);
            }
            if (poolBounds?.height) {
              poolHeightCandidates.push(poolBounds.height);
            }
            const desiredHeight = Math.max(
              totalHeight,
              poolHeightCandidates.length ? Math.max(...poolHeightCandidates) : totalHeight
            );
            const newPoolSize = new go.Size(poolWidth, desiredHeight);
            poolResizeObject.desiredSize = newPoolSize;
            try {
              poolGroup.desiredSize = newPoolSize;
            } catch (err) {
              // ignore if pool group does not allow desiredSize assignment
            }
            if (poolGroup.data) {
              const sizeString = `${poolWidth} ${desiredHeight}`;
              if (model && typeof model.setDataProperty === 'function') {
                model.setDataProperty(poolGroup.data, 'size', sizeString);
              } else {
                poolGroup.data.size = sizeString;
              }
            }
            updateGroupObjectView(poolGroup, poolGroup.location || poolLocation, newPoolSize);
          } else {
            const fallbackPoolSize = new go.Size(poolWidth, totalHeight);
            try {
              poolGroup.desiredSize = fallbackPoolSize;
            } catch (err) {
              // ignore if pool group does not allow desiredSize assignment
            }
            if (poolGroup.data) {
              const sizeString = `${fallbackPoolSize.width} ${fallbackPoolSize.height}`;
              if (model && typeof model.setDataProperty === 'function') {
                model.setDataProperty(poolGroup.data, 'size', sizeString);
              } else {
                poolGroup.data.size = sizeString;
              }
            }
            updateGroupObjectView(poolGroup, poolGroup.location || poolLocation, fallbackPoolSize);
          }

          poolGroup.ensureBounds();
        };

        e.subject.each(function (n) {
          const partData = n?.data;
          if (!partData) {
            return;
          }
          if (n instanceof go.Link) {
            droppedRelLinks.push(partData);
            return;
          }
          if (!shouldZoomToFitAfterDrop && isPoolLike(partData)) {
            shouldZoomToFitAfterDrop = true;
          }
          if (isLaneLike(partData)) {
            lanesDroppedIntoPool = true;
            registerPoolFromPart(n);
          }
          const node = partData.key !== undefined ? myDiagram.findNodeForKey(partData.key) : null;
          const diagramNode = n instanceof go.Node ? n : node instanceof go.Node ? node : null;
          const gjsNode = node?.data || partData;
          let type: akm.cxObjectType = partData.objecttype;
          let typeview: akm.cxObjectTypeView = partData.typeview;
          let objview: akm.cxObjectView;
          let objId: string;
          let object: akm.cxObject;
          let objName: string;
          let objDescr: string;
          if (!type || !typeview) { // An object has been dropped (dragged from object palette)
            const resolvedType = partData.objtypeRef ? myMetis.findObjectType(partData.objtypeRef) : null;
            if (resolvedType) {
              type = resolvedType;
            }
            if (!type) {
              return;
            }
            typeview = type.typeview || typeview || partData.typeview;
            if (!typeview && typeof (type as any)?.getDefaultTypeView === 'function') {
              typeview = (type as any).getDefaultTypeView();
            }
            if (!typeview) {
              return;
            }
            objId = partData.objRef;
            object = myMetis.findObject(objId);
            if (object) {
              myModel.addObject(object);
              const key = partData.key;
              objview = new akm.cxObjectView(key, partData.name, object, object.description, myModelview);
              const isContainer = Boolean(
                partData.viewkind === constants.viewkinds.CONT ||
                type?.viewkind === constants.viewkinds.CONT ||
                (typeof (type as any)?.isContainer === 'function' && (type as any).isContainer())
              );
              objview.isGroup = isContainer;
              objview.viewkind = isContainer ? constants.viewkinds.CONT : constants.viewkinds.OBJ;
              const templateName =
                partData.template ||
                partData.category ||
                (isContainer ? constants.gojs.C_CONTAINER : constants.gojs.C_NODETEMPLATE);
              const typeName = type?.name || objview?.object?.type?.name;
              partData.isGroup = isContainer;
              if (isContainer) {
                partData.viewkind = constants.viewkinds.CONT;
              } else if (!partData.viewkind || partData.viewkind === constants.viewkinds.CONT) {
                partData.viewkind = constants.viewkinds.OBJ;
              }
              if (diagramNode) {
                diagramNode.isGroup = isContainer;
                if (diagramNode.data) {
                  diagramNode.data.isGroup = isContainer;
                }
              }
              if (isContainer) {
                if (typeof myDiagram?.model?.setCategoryForNodeData === 'function') {
                  myDiagram.model.setCategoryForNodeData(partData, templateName);
                } else {
                  partData.category = templateName;
                }
                if (diagramNode?.data) {
                  diagramNode.data.category = templateName;
                }
                ensureInitialGroupSize(
                  myDiagram,
                  diagramNode,
                  partData,
                  getSizeOptionsForType(typeName)
                );
              } else {
                if (typeof myDiagram?.model?.setCategoryForNodeData === 'function') {
                  myDiagram.model.setCategoryForNodeData(
                    partData,
                    templateName || constants.gojs.C_NODETEMPLATE
                  );
                } else if (templateName) {
                  partData.category = templateName;
                }
                if (diagramNode?.data && (templateName || constants.gojs.C_NODETEMPLATE)) {
                  diagramNode.data.category = templateName || constants.gojs.C_NODETEMPLATE;
                }
              }
              objview.size = partData.size;
              objview = uic.setObjviewColors(partData, object, objview, typeview, myDiagram);
              object.addObjectView(objview);
              myModelview.addObjectView(objview);
              myModelview.setFocusObjectview(objview);
              myMetis.addObjectView(objview);
              let goNode = myGoModel.findNode(key);
              if (!goNode) {
                goNode = new gjs.goObjectNode(key, myGoModel, objview);
                goNode.loadNodeContent(myGoModel);
                myGoModel.addNode(goNode);
              }
              if (isContainer) {
                applyGroupTemplateToDiagram(diagramNode, templateName);
              } else {
                clearGroupTemplateFromDiagram(diagramNode);
              }
              // Dispatch modelview
              const modifiedModelviews = new Array();
              const jsnModelview = new jsn.jsnModelView(myModelview);
              modifiedModelviews.push(jsnModelview);
              modifiedModelviews.map(mn => {
                  let data = mn;
                  data = JSON.parse(JSON.stringify(data));
                  myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data });
              });
            }
            if (objview && object) {
              const objvIdName = { id: objview.id, name: objview.name };
              const objIdName = { id: object.id, name: object.name };
              myDiagram.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: objvIdName });
              myDiagram.dispatch({ type: 'SET_FOCUS_OBJECT', data: objIdName });
            }
          } else { // An object type has been dropped - create an object
            // i.e. new object, new objectview, 
            objName = node?.data?.object?.name
              || partData.object?.name
              || partData.name
              || type?.name;
            if (!objName || objName?.trim().length === 0) {
              objName = type?.name || 'Object';
            }
            objDescr = node?.data?.object?.description
              || partData.object?.description
              || partData.description
              || type?.description
              || '';
            type = myMetis.findObjectType(type?.id);
            typeview = type?.typeview || typeview || partData.typeview;
            if (type.name === 'Datatype' && objName === 'Datatype') {
              let found = true;
              while (found) {
                objName = 'datatype' + Math.floor(Math.random() * 100);
                found = myMetis.findDatatype(objName);
              }
              if (!found)
                objName = prompt("Enter Datatype name;", objName);
              partData.name = objName;
            }
            // Create a new object
            objId = utils.createGuid();
            object = new akm.cxObject(objId, objName, type, objDescr);
            object.parentModelRef = myModel.id;
            myModel.addObject(object);
            myMetis.addObject(object);
            console.log('1241 node, data', node, partData);
            // Find the objectview
            objview = myModelview.findObjectView(partData.key);
            if (!objview) {
              objview = new akm.cxObjectView(partData.key, partData.name, object, partData.description, myModelview);
              const isContainer = Boolean(
                partData.viewkind === constants.viewkinds.CONT ||
                type?.viewkind === constants.viewkinds.CONT ||
                (typeof (type as any)?.isContainer === 'function' && (type as any).isContainer())
              );
              objview.isGroup = isContainer;
              const typeName = type?.name || objview?.object?.type?.name;
              const templateName =
                partData.template ||
                partData.category ||
                (isContainer ? constants.gojs.C_CONTAINER : constants.gojs.C_NODETEMPLATE);
              partData.isGroup = isContainer;
              if (isContainer) {
                partData.viewkind = constants.viewkinds.CONT;
              } else if (!partData.viewkind || partData.viewkind === constants.viewkinds.CONT) {
                partData.viewkind = constants.viewkinds.OBJ;
              }
              if (diagramNode) {
                diagramNode.isGroup = isContainer;
                if (diagramNode.data) {
                  diagramNode.data.isGroup = isContainer;
                }
              }
              if (isContainer) {
                if (typeof myDiagram?.model?.setCategoryForNodeData === 'function') {
                  myDiagram.model.setCategoryForNodeData(partData, templateName);
                } else {
                  partData.category = templateName;
                }
                if (diagramNode?.data) {
                  diagramNode.data.category = templateName;
                }
                ensureInitialGroupSize(
                  myDiagram,
                  diagramNode,
                  partData,
                  getSizeOptionsForType(typeName)
                );
              } else {
                if (typeof myDiagram?.model?.setCategoryForNodeData === 'function') {
                  myDiagram.model.setCategoryForNodeData(
                    partData,
                    templateName || constants.gojs.C_NODETEMPLATE
                  );
                } else if (templateName) {
                  partData.category = templateName;
                }
                if (diagramNode?.data && (templateName || constants.gojs.C_NODETEMPLATE)) {
                  diagramNode.data.category = templateName || constants.gojs.C_NODETEMPLATE;
                }
              }
              objview.objectRef = object.id;
              objview.groupLayout = partData.groupLayout;
              object.addObjectView(objview);
              myModelview.addObjectView(objview);
              myMetis.addObjectView(objview);
              if (isContainer) {
                applyGroupTemplateToDiagram(diagramNode, templateName);
              } else {
                clearGroupTemplateFromDiagram(diagramNode);
              }
            }
            myModelview.setFocusObjectview(objview);
          }
          const syncDroppedPartRefs = (data: any) => {
            if (!data || !object || !objview) return;
            const setProp = (prop: string, value: any) => {
              try {
                myDiagram?.model?.setDataProperty?.(data, prop, value);
              } catch (_) {
                try { data[prop] = value; } catch (_) { /* ignore */ }
              }
            };
            setProp('object', object);
            setProp('objectview', objview);
            setProp('objRef', object.id);
            setProp('objviewRef', objview.id);
            setProp('objecttype', type);
            setProp('typeview', typeview);
            if (data.category === constants.gojs.C_OBJECTTYPE) {
              setProp('category', data.template || constants.gojs.C_NODETEMPLATE);
            }
          };

          syncDroppedPartRefs(partData);
          if (diagramNode?.data && diagramNode.data !== partData) {
            syncDroppedPartRefs(diagramNode.data);
          }
          let fillcolor = "";
          let strokecolor = "";
          let textcolor = "";
          let part = partData;
          const templateName = String(part.template || "");
          const isContainerLike =
            part.isGroup === true ||
            part.viewkind === constants.viewkinds.CONT ||
            type?.viewkind === constants.viewkinds.CONT ||
            templateName.startsWith("group");
          if (isContainerLike) {
            part.isGroup = true;
            part.viewkind = constants.viewkinds.CONT;
            // Ensure fresh container-like drops render with the same group template/state.
            if (!templateName.startsWith("group")) {
              part.template = "groupWithPorts";
            }
            part.isExpanded = true;
            part.isSubGraphExpanded = true;
            part.scale = Number(part.scale) || Number(part.scale1) || Number(part.objectview?.scale) || 1;
            if ((!part.name || String(part.name).trim() === "") && (part.typename || type?.name)) {
              part.name = String(part.typename || type?.name);
            }
          }
          if (!isContainerLike) {
            part.scale = Number(n.scale);
          }
          if (part.size === "" || !part.size) {
            if (part.isGroup) {
              part.size = "200 100";
            } else {
              part.size = "160 70";
            }
          }

          if (object) {
            fillcolor = object.fillcolor ? object.fillcolor : part.fillcolor;
            strokecolor = object.strokecolor ? object.strokecolor : part.strokecolor;
            textcolor = object.textcolor ? object.textcolor : part.textcolor;
          }
          if (!object) {
            object = new akm.cxObject(objId, objName, type, objDescr);
            uic.copyProperties(object, part);
            object.setModified();
            myModel.addObject(object);
            myMetis.addObject(object);
          }
          if (!objview || !(objview instanceof akm.cxObjectView)) {
            objview = new akm.cxObjectView(part.key, part.name, object, part.description, myModelview);
            const isContainer = Boolean(
              part.viewkind === constants.viewkinds.CONT ||
              type?.viewkind === constants.viewkinds.CONT ||
              (typeof (type as any)?.isContainer === 'function' && (type as any).isContainer())
            );
            objview.isGroup = isContainer;
            objview = uic.setObjviewColors(part, object, objview, typeview, myDiagram);
            objview.loc = part.loc;
            objview.viewkind = isContainer ? constants.viewkinds.CONT : type.viewkind;
            objview.scale = Number(part.scale);
            objview.size = part.size;
            objview.setModified();
            myModelview.addObjectView(objview);
            myMetis.addObjectView(objview);
          } else {
            objview.loc = part.loc;
            objview.size = part.size;
          }
          if (part.isGroup) {
            objview.isGroup = true;
            objview.viewkind = constants.viewkinds.CONT;
            if (!objview.template || !String(objview.template).startsWith("group")) {
              objview.template = String(part.template || "groupWithPorts");
            }
            objview.isExpanded = true;
            objview.scale = Number(part.scale) || Number(part.scale1) || Number(objview.scale) || 1;
          }
          let goNode = myGoModel.findNodeByViewId(objview.id);
          if (!goNode) {
            goNode = new gjs.goObjectNode(objview.id, myGoModel, objview);
            goNode.loadNodeContent(myGoModel);
            // uic.updateNode(goNode, typeview, myDiagram, myGoModel);
            myGoModel.addNode(goNode);
            // myDiagram.model.addNodeData(goNode);
          }
          // Check if goNode is member of a group. Prefer the actual GoJS membership/data
          // resolved during the drop before falling back to geometry.
          const containingGroupKey =
            node?.containingGroup instanceof go.Group && node.containingGroup.key !== undefined && node.containingGroup.key !== null
              ? node.containingGroup.key
              : (part?.group || part?.data?.group || "");
          let group = containingGroupKey
            ? myGoModel.findNode(containingGroupKey)
            : null;
          if (!group) {
            group = uic.getGroupByLocation(myGoModel, part.loc, part.size, goNode);
          }
          if (group) {
            const parentgroup = group;
            goNode.group = parentgroup.key;
            goNode.objectview.group = parentgroup.objviewRef;
            myDiagram.model.setDataProperty(part, "group", goNode.group);
            let nextScale = Number(goNode.getMyScale(myGoModel));
            if (isGroupLikeNode(goNode, part)) {
              const parentPart = myDiagram.findNodeForKey(parentgroup.key) as go.Group | null;
              const parentVisibleScale = getStoredGroupVisibleScale(parentPart);
              nextScale = Math.max(
                MIN_NESTED_GROUP_SCALE,
                parentVisibleScale * NESTED_GROUP_SCALE_MULTIPLIER
              );
              resizeGroupToHalfParent(myDiagram, part, node, parentPart);
            }
            goNode.scale = nextScale;
            part.scale = Number(nextScale);
            gjsNode.scale = part.scale
            goNode.objectview.scale = part.scale;
            if (node?.data) {
              myDiagram.model.setDataProperty(node.data, "scale", part.scale);
              myDiagram.model.setDataProperty(node.data, "scale1", part.scale);
            }
            // Check if the node has a relationship (contains) FROM a group, if not create it
            const myHasPartReltype = myMetamodel.findRelationshipTypeByName(constants.types.AKM_CONTAINS);
            const parenttype = parentgroup.objecttype;
            const parentObj = parentgroup.object;
            const childtype = type;
            const childObj = object;
            const myHasPartRelship = myModel.findRelationship1(parentObj, childObj, myHasPartReltype, null, null);
            if (!myHasPartRelship && parentObj && childObj) {
              // Create the relationship
              const relId = utils.createGuid();
              const relName = constants.types.AKM_CONTAINS;
              const hasPartRelship = new akm.cxRelationship(relId, myHasPartReltype, parentObj, childObj, relName, "");
              hasPartRelship.parentModelRef = myModel.id;
              myModel.addRelationship(hasPartRelship);
              parentObj.addOutputrel(hasPartRelship);
              childObj.addInputrel(hasPartRelship);
              myMetis.addRelationship(hasPartRelship);
              // Prepare dispatch
              const jsnRel = new jsn.jsnRelationship(hasPartRelship);
              modifiedRelships.push(jsnRel);
             }
          }
          // if (goNode) {
          //   goNode.object = null;
          //   goNode.objecttype = null;
          //   goNode.objectview = null;
          // }
          const isLabel = (part.typename === 'Label');
          if (isLabel) {
            part.text = "Label";
          }
          // Prepare dispatch
          if (part.type === 'objecttype') {
            const otype = uic.createObjectType(part, context);
            if (otype) {
              otype.typename = constants.types.OBJECTTYPE_NAME;
              const jsnObjtype = new jsn.jsnObjectType(otype, true);
              modifiedObjectTypes.push(jsnObjtype);

              const jsnObjtypeView = new jsn.jsnObjectTypeView(otype.typeview);
              modifiedObjectTypeViews.push(jsnObjtypeView);

              const loc = part.loc;
              const size = part.size;
              const objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), context.myMetamodel, otype, loc, size);
              const jsnObjtypeGeo = new jsn.jsnObjectTypegeo(objtypeGeo);
              modifiedObjectTypeGeos.push(jsnObjtypeGeo);
            }
          } else // object
          {
            modifiedObjectViews.push({
              id: objview?.id,
              loc: objview?.loc,
              size: objview?.size,
              scale: objview?.scale,
              group: objview?.group,
              isExpanded: objview?.isExpanded,
            });
            const jsnObj = new jsn.jsnObject(object);
            modifiedObjects.push(jsnObj);
            const objvIdName = { id: objview.id, name: objview.name };
            const objIdName = { id: objview.object.id, name: objview.object.name };
            myDiagram.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: objvIdName });
            myDiagram.dispatch({ type: 'SET_FOCUS_OBJECT', data: objIdName });
          }
          node?.updateTargetBindings();
          if (part.isGroup) {
            const droppedPart = (myDiagram.findPartForKey(part.key) || n) as go.Part;
            const droppedGroup = droppedPart instanceof go.Group ? droppedPart : null;
            if (droppedGroup) {
              droppedGroup.isSubGraphExpanded = true;
            }
            const d = droppedPart?.data || n?.data;
            if (d) {
              const persistedScale = Number(objview?.scale ?? part.scale ?? d.scale ?? 1);
              myDiagram.model.setDataProperty(d, "isExpanded", true);
              myDiagram.model.setDataProperty(d, "isSubGraphExpanded", true);
              myDiagram.model.setDataProperty(d, "scale", persistedScale);
              myDiagram.model.setDataProperty(d, "scale1", persistedScale);
            }
          }
        })

        droppedRelLinks.forEach((linkData: any) => {
          const fromKey = linkData?.from || linkData?.fromNode?.key;
          const toKey = linkData?.to || linkData?.toNode?.key;
          if (!fromKey || !toKey) {
            return;
          }

          const fromObjview = myModelview?.findObjectView(fromKey);
          const toObjview = myModelview?.findObjectView(toKey);
          const fromObject = fromObjview?.object;
          const toObject = toObjview?.object;
          if (!fromObjview || !toObjview || !fromObject || !toObject) {
            return;
          }

          const fromType = fromObject.type || (fromObject.typeRef ? myMetamodel?.findObjectType(fromObject.typeRef) : null);
          const toType = toObject.type || (toObject.typeRef ? myMetamodel?.findObjectType(toObject.typeRef) : null);
          if (!fromType || !toType) {
            return;
          }

          let reltype = linkData?.reltype || linkData?.relshiptype;
          if (!reltype && linkData?.reltypeRef) {
            reltype = myMetamodel?.findRelationshipType(linkData.reltypeRef) || myMetis.findRelationshipType(linkData.reltypeRef);
          }
          const relName = (reltype && reltype.name) || linkData?.name;
          if (!reltype && relName) {
            reltype = myMetamodel?.findRelationshipTypeByName2(relName, fromType, toType)
              || myMetis.findRelationshipTypeByName2(relName, fromType, toType);
          }
          if (!reltype) {
            return;
          }

          const relContext = {
            ...context,
            gjsData: linkData,
          };

          const args = {
            data: linkData,
            metamodel: myMetamodel,
            typename: reltype.name,
            fromType,
            toType,
            nodeFrom: null,
            nodeTo: null,
            fromPort: linkData?.fromPort || linkData?.portFrom,
            toPort: linkData?.toPort || linkData?.portTo,
            context: relContext,
          };

          uic.createRelshipCallback(args);
        });

        // Dispatch modelview
        const modifiedModelviews = new Array();
        const jsnModelview = new jsn.jsnModelView(myModelview);
        modifiedModelviews.push(jsnModelview);
        modifiedModelviews.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data });
        });
        if (myDiagram) {
          const toolManager = myDiagram.toolManager;
          const activeTool = toolManager.currentTool;
          if (activeTool && activeTool.isActive) {
            if (activeTool instanceof go.DraggingTool) {
              activeTool.stopTool();
            } else if (typeof activeTool.doCancel === 'function') {
              activeTool.doCancel();
            }
          }
          const dropDragTool = toolManager.draggingTool;
          if (dropDragTool && dropDragTool.isActive) {
            dropDragTool.stopTool();
          }
          const dropDraggedParts = dropDragTool?.draggedParts;
          if (dropDraggedParts?.count > 0) {
            dropDraggedParts.clear();
          }
          const dropCopiedParts = dropDragTool?.copiedParts;
          if (dropCopiedParts?.count > 0) {
            dropCopiedParts.clear();
          }
        }
        if (lanesDroppedIntoPool && myDiagram && affectedPoolKeys.size > 0) {
          const shouldStart = !myDiagram.isInTransaction;
          if (shouldStart) {
            myDiagram.startTransaction('relayout-pools-after-lane-drop');
          }
          try {
            affectedPoolKeys.forEach((poolKey) => {
              const poolPart = myDiagram.findNodeForKey(poolKey);
              if (poolPart instanceof go.Group) {
                if (poolPart.layout) {
                  if (typeof poolPart.layout.invalidateLayout === 'function') {
                    poolPart.layout.invalidateLayout();
                  } else {
                    poolPart.layout.isValidLayout = false;
                  }
                }
                relayoutPoolGroupAfterLaneChanges(myDiagram, poolPart);
              }
            });
          } finally {
            if (shouldStart && myDiagram.isInTransaction) {
              myDiagram.commitTransaction('relayout-pools-after-lane-drop');
            }
          }
          myDiagram.layoutDiagram(true);
        }
        if (shouldZoomToFitAfterDrop && myDiagram) {
          myDiagram.commandHandler.zoomToFit();
        }
        break;
      }
      case "ObjectDoubleClicked": {
        let sel = e.subject.part;
        const node = sel.data;
        if (debug) console.log('981 node', node);
        const category = node.category;
        switch (category) {
          case constants.gojs.C_OBJECTTYPE:
            uid.editObjectType(node, myMetis, myDiagram);
            break;
          case constants.gojs.C_OBJECT:
            if (debug) console.log('988 myMetis', myMetis);
            uid.editObject(node, myMetis, myDiagram);
            if (debug) console.log('990 myMetis', myMetis);
            break;
        }
        break;
      }
      case "ObjectSingleClicked": {
        const sel = e.subject.part;
        let data = sel.data;
        // sel.location = data.loc;
        if (debug) console.log('1313 selected', data, sel);
        let objectview = myModelview.findObjectView(data?.key);
        if (!objectview) objectview = myModelview.findObjectView(data?.fromNode?.key);
        const object = objectview?.object;
        console.log('1360 object, objectview', object, objectview);
        for (let it = myDiagram.nodes; it?.next();) {
          const n = it.value;
          const data = n.data;
          if (data.isSelected) {
            if (debug) console.log('1319 goNode', data);
          }
        }
        {
          const goNode: gjs.goObjectNode = myGoModel.findNode(data.key);
          if (debug) console.log('1319 myGoModel, goNode', myGoModel, goNode);
        }
        if (objectview && object) {
          const objvIdName = { id: objectview.id, name: objectview.name };
          const objIdName = { id: object.id, name: object.name };

          if (debug) console.log('1072 SET_FOCUS_OBJECTVIEW', objvIdName, objIdName)
          context.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: objvIdName });
          context.dispatch({ type: 'SET_FOCUS_OBJECT', data: objIdName });
        }
        for (let it = sel.memberParts; it?.next();) {
          let n = it.value;
          if (n instanceof go.Link) continue;
          if (debug) console.log('1079 n', n.data);
        }
        break;
      }
      case "ObjectContextClicked": { // right clicked
        const sel = e.subject.part;
        const data = sel.data;
        // dispatch to focusCollection here ???
        if (debug) console.log('1316 selected', data, sel);
        break;
      }
      case "PartResized": {
        const affectedPoolKeys = new Set<string>();
        const resizedPoolKeys = new Set<string>();
        const resizedParts = new go.Set<go.Part>();
        const subjectPart = (e.subject as any)?.part || e.subject;
        if (subjectPart instanceof go.Part) {
          resizedParts.add(subjectPart);
        }
        const selection = e.diagram.selection;
        for (let it = selection.iterator; it?.next();) {
          const p = it.value;
          if (p instanceof go.Part) resizedParts.add(p);
        }
        for (let it = resizedParts.iterator; it?.next();) {
          let n = it.value;
          if (n.data.isGroup) {
            let objview: akm.cxObjectView;
            objview = myModelview.findObjectView(n.data.key);
            if (!objview) 
              continue;
            const category = n.data?.category || n.data?.template;
            if (category === 'Lane' || category === 'Lane_w_handles') {
              const laneBody = n.findObject("LANE_BODY_SHAPE") as go.GraphObject | null;
              if (laneBody) {
                const bodySize = `${laneBody.actualBounds.width} ${laneBody.actualBounds.height}`;
                myDiagram.model.setDataProperty(n.data, "size", bodySize);
              }
            }
            objview.loc = n.data.loc;
            objview.size = n.data.size;
            let myNode = myGoModel.findNodeByViewId(n.data.key);
            myNode.size = objview.size;
            myNode.key = objview.id;
            if (category === 'Lane' || category === 'Lane_w_handles') {
              if (n.data?.group) affectedPoolKeys.add(n.data.group);
            } else if (category === 'Pool') {
              affectedPoolKeys.add(n.data.key);
              resizedPoolKeys.add(n.data.key);
            }
            const jsnObjview = new jsn.jsnObjectView(objview);
            uic.addItemToList(modifiedObjectViews, jsnObjview);
            let children = n.memberParts;
            for (let it = children.iterator; it?.next();) {
              let c = it.value;
              if (c instanceof go.Node) {
                let data = c.data;
                const objview = data.objectview;
                if (objview) {
                  objview.loc = data.loc;
                  objview.size = data.size;
                  const jsnObjview = new jsn.jsnObjectView(objview);
                  uic.addItemToList(modifiedObjectViews, jsnObjview);
                }
              }
            }
          }
        }
        if (resizedPoolKeys.size > 0) {
          (myDiagram as any).__preserveResizedPoolWidths = resizedPoolKeys;
        }
        relayoutPoolsByKeys(affectedPoolKeys);
        if (resizedPoolKeys.size > 0) {
          delete (myDiagram as any).__preserveResizedPoolWidths;
        }
        break;
      }
      case 'ClipboardChanged': {
        const nodes = e.subject;
        if (debug) console.log('nodes', nodes);
        break;
      }
      case 'ClipboardPasted': { 
        const selection = e.subject;
        let pasteAnotherModelview = false;
        let pasteViewsOnly = myMetis.pasteViewsOnly;
        let readOnly = false
        let fromModel = myModel;
        let toModel   = myModel;
        let fromGoModel = myMetis.gojsModel;
        let toGoModel   = myMetis.gojsModel;
        let fromModelview = myModelview;
        let toModelview = myModelview;
        let copiedNodes = new Array();
        let pastedNodes = new Array();
        // Remember copied nodes
        let it = selection.iterator;
        while (it.next()) { 
          if (it.value instanceof go.Node) {
            let objtype: akm.cxObjectType;
            // Filter out copied (source) nodes
            let gjsNode = it.value.data;  
            fromModelview = gjsNode.fromModelview;
            fromGoModel = gjsNode.fromGoModel;
            let gjsCopiedNode = gjsNode.fromNode;
            if (!gjsCopiedNode)
              continue;
            let copiedNodeKey = gjsCopiedNode.key;
            let pastedNodeKey = copiedNodeKey;
            if (copiedNodeKey?.length == gjsNode.key.length) {
              pasteAnotherModelview = true;
              pastedNodeKey = utils.createGuid();
              gjsNode.key = pastedNodeKey;
              toModelview = myModelview;
              toGoModel = myGoModel;
              // toGoModel = new gjs.goModel(utils.createGuid(), toModelview.name, toModelview);
            }
            const myCopiedNode = new akm.cxNode();
            myCopiedNode.name = gjsNode.name;
            myCopiedNode.objId = gjsCopiedNode.objid;
            myCopiedNode.object = myMetis.findObject(myCopiedNode.objId);
            myCopiedNode.descr = myCopiedNode.object?.description;
            myCopiedNode.objecttype = myCopiedNode.object?.type;
            myCopiedNode.objviewId = gjsCopiedNode.objviewid;;
            myCopiedNode.objectview = fromModelview.findObjectView(myCopiedNode.objviewId);
            myCopiedNode.gjsKey = copiedNodeKey;
            myCopiedNode.gjsNode = gjsCopiedNode;
            myCopiedNode.memberscale = Number(gjsCopiedNode.memberscale);
            myCopiedNode.loc = gjsCopiedNode.loc;
            myCopiedNode.size = gjsCopiedNode.size;
            myCopiedNode.group = gjsCopiedNode.group; // Group key
            myCopiedNode.isGroup = gjsCopiedNode.isGroup;
            myCopiedNode.goNodeId = copiedNodeKey;
            let myCopiedGoNode: gjs.goObjectNode = fromGoModel.findNode(myCopiedNode.goNodeId);
            myCopiedNode.goNode = myCopiedGoNode;
            copiedNodes.push(myCopiedNode);

            const myPastedNode = new akm.cxNode();
            myPastedNode.name = myCopiedNode.name;
            myPastedNode.objecttype = myCopiedNode.objecttype;
            if (pasteViewsOnly)
              myPastedNode.object = myCopiedNode.object;
            else {
              myPastedNode.objId = utils.createGuid();
              myPastedNode.object = new akm.cxObject(myPastedNode.objId, myPastedNode.name, myPastedNode.objecttype, myCopiedNode.descr);
              // Paste all object attributes
              uic.copyProperties(myPastedNode.object, myCopiedNode.object);
              myPastedNode.object.setModified();
              myModel.addObject(myPastedNode.object);
              myMetis.addObject(myPastedNode.object);
            }
            myPastedNode.objviewId = utils.createGuid();
            myPastedNode.goNodeId = myPastedNode.objviewId;
            myPastedNode.objectview = new akm.cxObjectView(myPastedNode.objviewId, myPastedNode.name,
                                                           myPastedNode.object, myCopiedNode.descr, toModelview);
            gjsNode.key = myPastedNode.objviewId;
            uic.copyObjviewAttributes(myPastedNode.objectview, myCopiedNode.objectview);                                        
            myPastedNode.loc = gjsNode.loc;
            myPastedNode.size = gjsNode.size;
            myPastedNode.gjsKey = gjsNode.key;
            myPastedNode.group = gjsNode.group;
            myPastedNode.isGroup = gjsNode.isGroup;
            myPastedNode.objectview.loc = myPastedNode.loc;
            myPastedNode.objectview.size = myPastedNode.size;
            myPastedNode.objectview.readOnly = readOnly;
            myPastedNode.objecttype = myCopiedNode.objecttype;
            myPastedNode.goNode = new gjs.goObjectNode(myPastedNode.goNodeId, toGoModel, myPastedNode.objectview);
            toGoModel.addNode(myPastedNode.goNode);
            toModelview.addObjectView(myPastedNode.objectview);
            myMetis.addObjectView(myPastedNode.objectview);
            myMetis.setGojsModel(toGoModel);
            pastedNodes.push(myPastedNode);
            if (debug) console.log('Checkpoint');
          }
        }
        for (let i=0; i < copiedNodes.length; i++) {
          const cNode1 = copiedNodes[i];
          const cGroup = myMetis.getNodeGroup(cNode1);
          if (cGroup?.length > 0) { // group key
            const pNode = myMetis.getNodeByGroup(pastedNodes, cGroup);
            if (pNode) {
              pNode.group = "";
              // Find pnode
              let childNodeView = toModelview.findObjectViewByName(pNode.name);
              childNodeView.group = pNode.objviewId;    
            } 
          }
        }

        // Now handle the relationships
        let it2 = selection.iterator;
        while (it2.next()) { 
          let n = it2.value;
          if (n instanceof go.Node) 
            continue;
          
          if (it2.value instanceof go.Link) {
            let gjsLink = it2.value.data; // The copied (source) link (i.e. the relationship)
            if (!gjsLink.fromLink) 
              continue;

            const copiedRelviewid = gjsLink.fromLink.key;
            const copiedRelview = myMetis.findRelationshipView(copiedRelviewid);

            let copiedRelship = copiedRelview?.relship;
            const copiedFromObject = copiedRelship.fromObject;
            const copiedToObject = copiedRelship.toObject;
            
            let pastedFromObject = null;
            let pastedFromObjview = null;
            for (let i=0; i < pastedNodes.length; i++) {
              const node = pastedNodes[i];
              const objtype = node.objecttype;
              const objname = node.name;
              if (objtype && copiedFromObject.name === objname) {
                if (copiedFromObject.type.id === objtype.id) {
                  pastedFromObject = node.object;
                  pastedFromObjview = node.objectview;
                }
              }
            }
            let pastedToObject = null;
            let pastedToObjview = null;
            for (let i=0; i < pastedNodes.length; i++) {
              const node = pastedNodes[i];
              const objtype = node.objecttype;
              const objname = node.name;
              if (objtype && copiedToObject.name === objname) {
                if (copiedToObject.type.id === objtype.id) {
                  pastedToObject = node.object;
                  pastedToObjview = node.objectview;
                }
              }
            }

            let pastedRelship = new akm.cxRelationship(utils.createGuid(), copiedRelship.type, pastedFromObject, pastedToObject, copiedRelship.name, copiedRelship.description);

            const relviewId = utils.createGuid();
            gjsLink.key = relviewId;
            let pastedRelview = new akm.cxRelationshipView(relviewId, copiedRelview.name, pastedRelship, copiedRelview.description);
            pastedRelview.fromObjview = pastedFromObjview;
            pastedRelview.toObjview   = pastedToObjview;
            const pastedLink = new gjs.goRelshipLink(relviewId, toGoModel, pastedRelview);
            uic.copyRelviewAttributes(pastedRelview, copiedRelview); 

            // Handle points
            const points = [];
            for (let it = gjsLink.points.iterator; it?.next();) {
                const point = it.value;
                points.push(point.x)
                points.push(point.y)
            }
            pastedRelview.points = points;

            toGoModel.addLink(pastedLink);
            toModelview.addRelationshipView(pastedRelview);
            myMetis.addRelationshipView(pastedRelview);
            const jsnRelship = new jsn.jsnRelationship(pastedRelship);
            uic.addItemToList(modifiedRelships, jsnRelship);
            const jsnRelview = new jsn.jsnRelshipView(pastedRelview);
            uic.addItemToList(modifiedRelshipViews, jsnRelview);
          
          }
        }
        
        // Finally handle groups
        const nodes = toGoModel.nodes;
        for (let i=0; i<nodes.length; i++) {
          const myGoNode = nodes[i];
          const myObjectview: akm.cxObjectView = myGoNode.objectview;
          // Check if the node (myGoNode) is member of a group
          const goParentGroup = uic.getGroupByLocation(myGoModel, myGoNode.loc, myGoNode.size, myGoNode);
          let parentObjview = goParentGroup?.objectview; // The container objectview
          if (!parentObjview) {
            parentObjview = myModelview.findObjectView(goParentGroup?.objviewRef);
          }
          if (goParentGroup && parentObjview) { // the container (group)
            myGoNode.group = goParentGroup.key; // Make the node a member of the group (container)
            parentObjview.isExpanded = true;
            myObjectview.group = goParentGroup.key;
            let scale = Number(myGoNode.getMyScale(myGoModel));
            if (isGroupLikeNode(myGoNode, myObjectview)) {
              const parentPart = myDiagram.findNodeForKey(goParentGroup.key) as go.Group | null;
              const parentVisibleScale = getStoredGroupVisibleScale(parentPart);
              scale = Math.max(MIN_NESTED_GROUP_SCALE, parentVisibleScale * NESTED_GROUP_SCALE_MULTIPLIER);
              resizeGroupToHalfParent(myDiagram, myToNode.gjsData, myToNode.n, parentPart);
            }
            myGoNode.scale = scale;
            myObjectview.scale = scale;
            myObjectview.loc = myGoNode.loc;
          }
        }
        // Dispatch metis
        const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
        let data = { metis: jsnMetis }
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data }) // Todo: shoud not dispatch the whole phData????
        if (false) {
            // Dispatch modelview
            const modifiedModelviews = new Array();
            const jsnModelview = new jsn.jsnModelView(myModelview);
            modifiedModelviews.push(jsnModelview);
            modifiedModelviews.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data });
            });
            // Dispatch model
            const modifiedModels = new Array();
            const jsnModel = new jsn.jsnModel(myModel);
            modifiedModels.push(jsnModel);
            modifiedModels.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data });
            });
        }
        
        if (debug) console.log('1770 pastedNodes', pastedNodes);
        break;
      }      
      case 'LayoutCompleted': {
        // Persist node/link positions after layout so positions survive reloads
        if (true) {
          const nodes = myDiagram.nodes;
          for (let it = nodes.iterator; it?.next();) {
            const node = it.value;
            const nodeData = node?.data;
            if (!nodeData) continue;
            const objectview = nodeData.objectview;
            if (!objectview) {
              // Optionally log or handle nodes without objectview
              // console.warn('Node missing objectview:', node.data);
              continue;
            }
            objectview.loc = nodeData.loc;
            const jsnObjview = new jsn.jsnObjectView(objectview);
            modifiedObjectViews.push(jsnObjview);
            myModelview.addObjectView(objectview);
          }
          const links = myDiagram.links;
          for (let it = links.iterator; it?.next();) {
            const link = it.value;
            const relview = link.data.relshipview;
            if (!relview) continue;
            const points = [];
            for (let it = link.points.iterator; it?.next();) {
              const point = it.value;
              if (debug) console.log('1603 point', point.x, point.y);
              points.push(point.x)
              points.push(point.y)
            }
            relview.points = points;
            const jsnRelview = new jsn.jsnRelshipView(relview);
            modifiedRelshipViews.push(jsnRelview);
            myModelview.addRelationshipView(relview);
          }
        }
        break;
      }
      case 'LinkDrawn': {
        const link = e.subject;
        const gjsData = link.data;
        context.link = link;
        context.gjsData = gjsData;
        context.goModel = myGoModel;
        if (debug) console.log('1498 link', link.data, link.data.from, link.data.to);
        let gjsFromNode, gjsToNode;
        const isObjectNode = (n: any) =>
          !!n && (n.category === constants.gojs.C_OBJECT || n.object || n.objectview);
        for (let it = myDiagram.nodes; it?.next();) {
          const n = it.value;
          if (n.data?.key === gjsData.from) {
            gjsFromNode = n.data;
          }
          if (n.data?.key === gjsData.to) {
            gjsToNode = n.data;
          }
        }
        let goFromNode: gjs.goObjectNode;
        let goToNode: gjs.goObjectNode;
        let fromObjView: akm.cxObjectView;
        let toObjView: akm.cxObjectView;
        if (gjsFromNode) {
          fromObjView = myModelview.findObjectView(gjsFromNode.key);
          goFromNode = myGoModel.findNode(gjsFromNode.key);
          context.goFromNode = goFromNode;
          context.fromObjView = fromObjView;
          uic.updateNode(goFromNode, fromObjView?.typeview, myDiagram, myGoModel);
        }
        if (gjsToNode) {
          toObjView = myModelview.findObjectView(gjsToNode.key);
          goToNode = myGoModel.findNode(gjsToNode.key);
          context.goToNode = goToNode;
          context.toObjView = toObjView;
          uic.updateNode(goToNode, toObjView?.typeview, myDiagram, myGoModel);
        }
        // Ensure freshly dropped nodes carry object/objectview refs for relationship menus
        const ensureNodeRefs = (gjsNode: any, objview: any) => {
          if (!gjsNode) return;
          const setProp = (prop: string, val: any) => {
            if (val === undefined || val === null) return;
            try {
              gjsNode[prop] = val;
            } catch (_) { /* ignore */ }
          };
          if (objview) {
            setProp('objectview', objview);
            setProp('objviewRef', objview.id);
            if (!objview.object && gjsNode.object) {
              objview.object = gjsNode.object;
            }
            setProp('object', objview.object || gjsNode.object);
            setProp('objRef', objview.object?.id);
          }
        };
        ensureNodeRefs(gjsFromNode, context.fromObjView);
        ensureNodeRefs(gjsToNode, context.toObjView);
        // Handle relationship types
        if (gjsFromNode?.category === constants.gojs.C_OBJECTTYPE) {
          gjsData.category = constants.gojs.C_RELSHIPTYPE;
          if (debug) console.log('1523 link', fromNode, toNode);
          // link.category = constants.gojs.C_RELSHIPTYPE;
          const reltype = uic.createRelationshipType(gjsFromNode.data, gjsToNode.data, gjsData, context);
          if (reltype) {
            if (debug) console.log('1527 reltype', reltype);
            const jsnType = new jsn.jsnRelationshipType(reltype, true);
            modifiedRelshipTypes.push(jsnType);
            if (debug) console.log('1530 jsnType', jsnType);
            const reltypeview = reltype.typeview;
            if (reltypeview) {
              const jsnTypeView = new jsn.jsnRelshipTypeView(reltypeview);
              modifiedRelshipTypeViews.push(jsnTypeView);
              if (debug) console.log('1535 jsnTypeView', jsnTypeView);
              const myGoModel = myMetis.gojsModel;
              let goLink = new gjs.goRelshipTypeLink(utils.createGuid(), myGoModel, reltype);
              goLink.fromNode = gjsFromNode.data;
              goLink.toNode = gjsToNode.data
              goLink.loadLinkContent(myGoModel);
              myGoModel.addLink(goLink);
              goLink.name = reltype.name;
              if (debug) console.log('1543 goLink, myGoModel, reltype', goLink, myGoModel, reltype);
              const gjsLink = myDiagram.findLinkForKey(goLink.key);
              myDiagram.model.addLinkData(gjsLink);
              if (debug) console.log('1546 lnk, reltype', gjsLink, reltype);
              myDiagram.model.setDataProperty(gjsLink.data, 'name', reltype.name);
            }
          }
          myDiagram.requestUpdate();
        }
        // Handle relationships
        if (isObjectNode(gjsFromNode)) {
          // gjsData.category = constants.gojs.C_RELATIONSHIP;
          context.handleOpenModal = this.handleOpenModal;
          if (gjsFromNode && gjsToNode)
            uic.createRelationship(gjsFromNode, gjsToNode, context);
        }
        myDiagram.requestUpdate();
        break;
      }
      case "LinkRelinked": {
        const gjsLink = e.subject;
        const key = gjsLink.key;
        const gjsLinkData = gjsLink.data;
        const myGoModel = myMetis.gojsModel;
        const goLink = myGoModel.findLink(key);        
        let fromNode = gjsLinkData.from; // gjsLinkData.fromNode;
        let fromPort = gjsLinkData.fromPort;
        let toNode = gjsLinkData.to; // gjsLinkData.toNode;
        let toPort = gjsLinkData.toPort;
        let goFromNode = myGoModel.findNode(fromNode);
        let goToNode = myGoModel.findNode(toNode);
        const relshipRef = goLink.relshipRef;
        const relship = myModel.findRelationship(relshipRef);
        let fromObject = goFromNode.object;
        if (!fromObject) fromObject = myModel.findObject(goFromNode.objRef);
        relship.fromObject = fromObject;
        let toObject = goToNode.object;
        if (!toObject) toObject = myModel.findObject(goToNode.objRef);
        relship.toObject = toObject;
        const relviewRef = goLink.relviewRef;
        let relview = myModelview.findRelationshipView(relviewRef);
        if (!relview) relview = myModelview.findRelationshipView(relviewRef);
        if (!relview) 
          break;
        let fromObjview = goFromNode.fromObjview;
        if (!fromObjview) fromObjview = myModelview.findObjectView(goFromNode.objviewRef);
        relview.fromObjview = fromObjview;
        let toObjview = goToNode.toObjview;
        if (!toObjview) toObjview = myModelview.findObjectView(goToNode.objviewRef);
        relview.toObjview = toObjview;
        relview.toPortid = toPort;
        relview.fromPortid = fromPort;
        let points = [];
        for (let it = gjsLinkData.points.iterator; it?.next();) {
          const point = it.value;
          if (debug) console.log('1603 point', point.x, point.y);
          points.push(point.x)
          points.push(point.y)
        }
        relview.points = gjsLinkData.points;

        // Update link data
        uid.updateLinkAndView(gjsLinkData, goLink, relview, myDiagram);

        // Prepare for dispatch
        const jsnRelship = new jsn.jsnRelationship(relship);
        modifiedRelships.push(jsnRelship);
        const jsnRelview = new jsn.jsnRelshipView(relview);
        modifiedRelshipViews.push(jsnRelview);
        break;
      }
      case "LinkReshaped": {

        const myGoModel = myMetis.gojsModel;
        const gjsLink = e.subject;
        const key = gjsLink.key;
        const link = myDiagram.findLinkForKey(key);
        const goLink = myGoModel.findLink(key);        
        const data = goLink?.data;
        if (debug) console.log('1596 link, data', link, data);
        let relview = data?.relshipview;
        relview = myModelview.findRelationshipView(data?.key);
        if (relview) {
          const points = [];
          myDiagram.model.setDataProperty(data, "points", []);
          for (let it = data.points.iterator; it?.next();) {
            const point = it.value;
            if (debug) console.log('1603 point', point.x, point.y);
            points.push(point.x)
            points.push(point.y)
          }
          relview.points = points;
          const jsnRelview = new jsn.jsnRelshipView(relview);
          if (debug) console.log('1609 relview, jsnRelview', relview, jsnRelview);
          modifiedRelshipViews.push(jsnRelview);

          uid.updateLinkAndView(data, goLink, relview, myDiagram);
        }
        break;
      }
      case "SubGraphCollapsed":
      case "SubGraphExpanded": {
        const affectedPoolKeys = new Set<string>();
        e.subject.each(function (n) {
          const data = n.data;
          const objview = data?.objectview;
          if (objview) {
            objview.isExpanded = data.isExpanded;
            const jsnObjview = new jsn.jsnObjectView(objview);
            modifiedObjectViews.push(jsnObjview);
          }
          const category = data?.category || data?.template;
          if (category === 'Lane' || category === 'Lane_w_handles') {
            if (data?.group) affectedPoolKeys.add(data.group);
          } else if (category === 'Pool') {
            if (data?.key) affectedPoolKeys.add(data.key);
          }
        });
        relayoutPoolsByKeys(affectedPoolKeys);
        break;
      }
      case "BackgroundSingleClicked": {
        if (debug) console.log('1615 myMetis', myMetis);
        uid.clearFocus(myModelview);
        let data = { id: myModelview.id, name: myModelview.name }
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data })
        let data2 = { id: myModel.id, name: myModel.name }
        data2 = JSON.parse(JSON.stringify(data2));
        context.dispatch({ type: 'SET_FOCUS_OBJECT', data2 })

        break;
      }
      case "BackgroundDoubleClicked": {
        if (debug) console.log('1619 BackgroundDoubleClicked', e, e.diagram);
        break;
      }
      case "ModelChanged": {
        // if (e.isTransactionFinished) {
        console.log("Transaction Finished");
        // }
      }
      default: {
        if (debug) console.log('1399 GoJSApp event name: ', name);
        break;
      }
    }

    // uic.handleContainedObjectViews(myModelview, myDiagram, myMetis);
    
    // Dispatches
    if (true) { // Dispatches to store individual objects/types
      if (debug) console.log('1928 modifiedObjectViews', modifiedObjectViews);
      modifiedObjectViews.map(mn => {
        let data = (mn) && mn
        if (mn.id) {
          data = JSON.parse(JSON.stringify(data));
          context.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
        }
      })

      modifiedObjectTypes?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data })
      })

      modifiedObjectTypeViews?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
      })

      modifiedObjectTypeGeos?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_OBJECTTYPEGEOS_PROPERTIES', data })
      })

      if (debug) console.log('1955 modifiedRelshipViews', modifiedRelshipViews);
      modifiedRelshipViews.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
      })

      modifiedRelshipTypes?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
      })

      // if (debug) console.log('1450 modifiedRelshipTypeViews', modifiedRelshipTypeViews);
      modifiedRelshipTypeViews?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
      })

      modifiedObjects?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
      })

      modifiedRelships?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
      })
    } else {
      const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
      let data = { metis: jsnMetis }
      data = JSON.parse(JSON.stringify(data));
      myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
    }
    if (debug) console.log('1704 myMetis', myMetis);
  }

  public render() {
    const selectedData = this.state.selectedData;
    if (debug) console.log('1777 selectedData', selectedData, this.props);
    let modalContent, inspector, selector, header, category, typename;
    const modalContext = this.state.modalContext;
    if (debug) console.log('1780 modalContext ', modalContext);
    if (modalContext?.what === 'selectDropdown') {
      let options = ''
      let comps = ''
      const { Option } = components
      const CustomSelectOption = props =>
      (
        <Option {...props}>
          <img className="option-img mr-2" src={props.data.value} />
          {props.data.label}
        </Option>
      )
      const CustomSelectValue = props => (
        <div>
          {/* <i className={`icon icon-${props.data.icon}`} /> */}
          <img className="option-img mr-2" src={props.data.value} />
          {props.data.label}
        </div>
      )
      options = this.state.selectedData.map(o => o && { 'label': o, 'value': o });
      comps = null
      if (debug) console.log('1507 options', options, this.state);
      const { selectedOption } = this.state;
      if (debug) console.log('1509 selectedOption', selectedOption, this.state);

      const value = (selectedOption) ? selectedOption.value : options[0];
      const label = (selectedOption) ? selectedOption.label : options[0];
      if (debug) console.log('1513 selectedOption, value, label ', selectedOption, value, label);
      header = modalContext.title;
      modalContent =
        <div className="modal-selection d-flex justify-content-center">
          <Select className="modal-select"
            options={options}
            components={comps}
            onChange={value => this.handleSelectDropdownChange(value)}
          />
        </div>
      {/* <option value={option.value}>{label: option.label, option.value}</option>
        */}
    } else {
      if (selectedData !== null) {
        if (debug) console.log('1527 selectedData', selectedData);
        inspector =
          <div className="p-2" style={{ backgroundColor: "#ddd" }}>
            <p>Selected Object Properties:</p>
            <SelectionInspector
              myMetis={this.state.myMetis}
              selectedData={this.state.selectedData}
              context={this.state.context}
              onInputChange={this.handleInputChange}
            />
          </div>
      }
    }

    if (this.state.myMetis) { this.state.myMetis.dispatch = this.state.dispatch };
    if (debug) console.log('1542 dispatch', this.state.myMetis.dispatch);
    if (debug) console.log('1837 dataarray:', this.state);
    if (debug) console.log('1838 dataarray:', this.state.nodeDataArray, this.state.linkDataArray);
    return ((this.state) &&
      <div className="diagramwrapper">
        <DiagramWrapper
          nodeDataArray={this.state.nodeDataArray}
          linkDataArray={this.state.linkDataArray}
          modelData={this.state.modelData}
          modelType={this.state.modelType}
          skipsDiagramUpdate={this.state.skipsDiagramUpdate}
          onDiagramEvent={this.handleDiagramEvent}
          onModelChange={this.handleModelChange}
          onInputChange={this.handleInputChange}
          myMetis={this.state.myMetis}
          dispatch={this.state.dispatch}
          diagramStyle={this.state.diagramStyle}
          onExportSvgReady={this.state.onExportSvgReady}
          onOpenSelectConnectedObjects={(payload) => this.openConnectedObjectsDialog('select', payload)}
        />
        {this.renderConnectedObjectsDialog()}

        <Modal className="" isOpen={this.state.showModal}  >
          {/* <div className="modal-dialog w-100 mt-5">
            <div className="modal-content"> */}
          <div className="modal-head">
            <Button className="modal-button btn-sm float-right m-1" color="link"
              onClick={() => { this.handleCloseModal('x') }} ><span>x</span>
            </Button>
            <ModalHeader className="modal-header" >
              <span className="text-secondary">{header} </span>
              <span className="modal-name " >{this.state.selectedData?.name} </span>
              <span className="modal-objecttype float-right"> {typename} </span>
            </ModalHeader>
          </div>
          <ModalBody >
            <div className="modal-body1">
              {/* <div className="modal-pict"><img className="modal-image" src={icon}></img></div> */}
              {modalContent}
            </div>
          </ModalBody>
          <ModalFooter className="modal-footer">
            <Button className="modal-button bg-link m-0 p-0" color="link" onClick={() => { this.handleCloseModal() }}>Done</Button>
          </ModalFooter>
          {/* </div>
          </div> */}
        </Modal>
      </div>

    );
  }
}

export default GoJSApp;
