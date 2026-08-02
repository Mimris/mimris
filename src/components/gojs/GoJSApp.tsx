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
import * as uit from '../../akmm/ui_templates';
import * as constants from '../../akmm/constants';
import * as utils from '../../akmm/utilities';
import { applyDropLayout, deriveDropLayoutConfig, applyDropLayoutToGroup } from './layout/DropLayoutManager';
import { getCurrentStore } from '../../store';

const debug = false;
const debugPorts = true;
const linkToLink = false;
const NESTED_GROUP_SIZE_RATIO = 0.35;

function installSafeNodeCategoryGuard() {
  const proto: any = go.GraphLinksModel && (go.GraphLinksModel as any).prototype;
  if (!proto || proto.__safeNodeCategoryGuardInstalled) return;
  const original = proto.setCategoryForNodeData;
  if (typeof original !== 'function') return;
  proto.setCategoryForNodeData = function (data: any, cat: any) {
    const safeCategory =
      typeof cat === 'string' && cat.length > 0
        ? cat
        : (typeof data?.template === 'string' && data.template.length > 0
            ? data.template
            : (typeof data?.category === 'string' && data.category.length > 0
                ? data.category
                : constants.gojs.C_NODETEMPLATE));
    return original.call(this, data, safeCategory);
  };
  proto.__safeNodeCategoryGuardInstalled = true;
}

function installSafeLinkCategoryGuard() {
  const proto: any = go.GraphLinksModel && (go.GraphLinksModel as any).prototype;
  if (!proto || proto.__safeLinkCategoryGuardInstalled) return;
  const original = proto.setCategoryForLinkData;
  if (typeof original !== 'function') return;
  proto.setCategoryForLinkData = function (data: any, cat: any) {
    const safeCategory =
      typeof cat === 'string' && cat.length > 0
        ? cat
        : (typeof data?.template === 'string' && data.template.length > 0
            ? data.template
            : (typeof data?.category === 'string' && data.category.length > 0
                ? data.category
                : constants.gojs.C_LINKEMPLATE));
    return original.call(this, data, safeCategory);
  };
  proto.__safeLinkCategoryGuardInstalled = true;
}

installSafeNodeCategoryGuard();
installSafeLinkCategoryGuard();

// Module-level lock storage - survives component state changes, focus changes, etc.
// These Maps are never cleared by React re-renders or diagram instance changes
const globalPreserveNodeStateByKey = new Map<string, number>();
const globalLockMovedNodeLocByKey = new Map<string, { loc: string; until: number }>();

function isBooleanLikeKey(key: string): boolean {
  return /^(is[A-Z_]|has[A-Z_]|can[A-Z_]|allow[A-Z_]|show[A-Z_]|include[A-Z_])/.test(key) ||
    key === "visible" ||
    key === "readOnly" ||
    key === "markedAsDeleted" ||
    key === "selectable" ||
    key === "deletable" ||
    key === "reshapable" ||
    key === "resegmentable" ||
    key === "relinkableFrom" ||
    key === "relinkableTo" ||
    key === "avoidable" ||
    key === "shadowVisible";
}

function normalizeEmptyBooleanFieldsInPlace(value: any, seen = new WeakSet<object>()): any {
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item) => normalizeEmptyBooleanFieldsInPlace(item, seen));
    return value;
  }
  Object.keys(value).forEach((key) => {
    const current = value[key];
    if (isBooleanLikeKey(key) && (current === "" || current === null)) {
      value[key] = false;
      return;
    }
    if (current && typeof current === "object") {
      normalizeEmptyBooleanFieldsInPlace(current, seen);
    }
  });
  return value;
}

function normalizeLinkPortData(linkDataArray: any[] | undefined): any[] {
  if (!Array.isArray(linkDataArray)) return linkDataArray as any;
  return linkDataArray.map((link) => {
    if (!link || typeof link !== "object") return link;
    normalizeEmptyBooleanFieldsInPlace(link);
    const normalizedFromPort = typeof link.fromPort === "string" ? link.fromPort : "";
    const normalizedToPort = typeof link.toPort === "string" ? link.toPort : "";
    const normalizedPoints = normalizeLinkPoints(link.points);
    if (
      link.fromPort === normalizedFromPort &&
      link.toPort === normalizedToPort &&
      normalizedPoints === link.points
    ) {
      return link;
    }
    return {
      ...link,
      fromPort: normalizedFromPort,
      toPort: normalizedToPort,
      points: normalizedPoints,
    };
  });
}

function normalizeLinkPoints(points: any): any {
  if (Array.isArray(points)) return points;
  const flattened: number[] = [];
  try {
    if (points?.iterator) {
      for (let it = points.iterator; it?.next();) {
        const point = it.value;
        if (point && typeof point.x === "number" && typeof point.y === "number") {
          flattened.push(point.x, point.y);
        } else if (typeof point === "number") {
          flattened.push(point);
        }
      }
      return flattened.length > 0 ? flattened : [];
    }
  } catch (_) {
  }
  return points;
}

function pickBestLinkPoints(...sources: any[]): number[] {
  let best: number[] = [];
  for (let i = 0; i < sources.length; i++) {
    const normalized = normalizeLinkPoints(sources[i]);
    if (Array.isArray(normalized) && normalized.length > best.length) {
      best = normalized;
    }
  }
  return best;
}

function pickFirstNonEmptyLinkPoints(...sources: any[]): number[] {
  for (let i = 0; i < sources.length; i++) {
    const normalized = normalizeLinkPoints(sources[i]);
    if (Array.isArray(normalized) && normalized.length > 0) {
      return normalized;
    }
  }
  return [];
}

function hasExplicitSavedLinkPath(...sources: any[]): boolean {
  for (let i = 0; i < sources.length; i++) {
    const normalized = normalizeLinkPoints(sources[i]);
    if (Array.isArray(normalized) && normalized.length >= 4) {
      return true;
    }
  }
  return false;
}

function mergeIncomingLinkDataWithLocalState(incomingLinks: any[] | undefined, localLinks: any[] | undefined): any[] {
  if (!Array.isArray(incomingLinks)) return incomingLinks as any;
  const localMap = new Map((Array.isArray(localLinks) ? localLinks : []).map((link: any) => [link?.key, link]));
  return incomingLinks.map((incoming: any) => {
    if (!incoming || typeof incoming !== "object" || !incoming.key) return incoming;
    const local = localMap.get(incoming.key);
    if (!local || typeof local !== "object") return incoming;
    const incomingPoints = normalizeLinkPoints(incoming.points);
    const localPoints = normalizeLinkPoints(local.points);
    const incomingHasManualPoints = Array.isArray(incomingPoints) && incomingPoints.length >= 4;
    const localHasManualPoints = Array.isArray(localPoints) && localPoints.length >= 4;
    if (!localHasManualPoints) return incoming;
    if (incomingHasManualPoints) return incoming;
    try {
      console.warn("[MANUAL_MOVE_PROP_SYNC]", JSON.stringify({
        key: incoming.key,
        incomingPoints,
        localPoints,
        incomingRouting: incoming.routing || "",
        localRouting: local.routing || "",
      }));
    } catch (_) {
    }
    return {
      ...incoming,
      points: localPoints,
      routing: local.routing || incoming.routing,
      relshipview: local.relshipview || incoming.relshipview,
    };
  });
}

function getNodeIdentityAliases(data: any): string[] {
  if (!data || typeof data !== 'object') return [];
  const aliases = [
    data?.key,
    data?.objviewRef,
    data?.objectview?.id,
    data?.objRef,
    data?.object?.id,
    data?.__dragSessionToken,
  ]
    .filter((v: any) => v !== undefined && v !== null && String(v).length > 0)
    .map((v: any) => String(v));
  return Array.from(new Set(aliases));
}

function findLiveNodeByAliases(diagram: go.Diagram | null | undefined, data: any): go.Node | null {
  if (!(diagram instanceof go.Diagram)) return null;
  const aliases = getNodeIdentityAliases(data);
  if (aliases.length === 0) return null;
  for (let i = 0; i < aliases.length; i++) {
    const n = diagram.findNodeForKey(aliases[i]);
    if (n instanceof go.Node) return n;
  }
  for (let it = diagram.nodes.iterator; it?.next();) {
    const node = it.value as go.Node;
    const liveAliases = getNodeIdentityAliases(node?.data);
    for (let i = 0; i < aliases.length; i++) {
      if (liveAliases.includes(aliases[i])) return node;
    }
  }
  return null;
}

function hasStructuralNodeArrayDiff(incomingNodes: any[] | undefined, currentNodes: any[] | undefined): boolean {
  const incoming = Array.isArray(incomingNodes) ? incomingNodes : [];
  const current = Array.isArray(currentNodes) ? currentNodes : [];
  if (incoming.length !== current.length) return true;
  const incomingIds = new Set<string>();
  const currentIds = new Set<string>();
  incoming.forEach((node: any, index: number) => {
    const aliases = getNodeIdentityAliases(node);
    const id = aliases[0] || `incoming:${index}`;
    incomingIds.add(String(id));
  });
  current.forEach((node: any, index: number) => {
    const aliases = getNodeIdentityAliases(node);
    const id = aliases[0] || `current:${index}`;
    currentIds.add(String(id));
  });
  if (incomingIds.size !== currentIds.size) return true;
  for (const id of incomingIds) {
    if (!currentIds.has(id)) return true;
  }
  return false;
}

function mergeIncomingNodeDataWithLocalState(
  incomingNodes: any[] | undefined,
  localNodes: any[] | undefined,
  diagram?: go.Diagram | null
): any[] {
  if (!Array.isArray(incomingNodes)) return incomingNodes as any;

  // Use GLOBAL lock maps instead of diagram instance properties
  // This survives React re-renders, focus changes, and state updates
  const preserveByKey = globalPreserveNodeStateByKey;
  const lockByKey = globalLockMovedNodeLocByKey;

  const now = Date.now();
  const localMap = new Map<string, any>();
  (Array.isArray(localNodes) ? localNodes : []).forEach((node: any) => {
    if (!node || typeof node !== 'object') return;
    const ids = getNodeIdentityAliases(node);
    ids.forEach((id: any) => {
      localMap.set(String(id), node);
    });
  });

  return incomingNodes.map((incoming: any) => {
    if (!incoming || typeof incoming !== 'object' || incoming.key === undefined || incoming.key === null) return incoming;
    const incomingIds = getNodeIdentityAliases(incoming);

    // Debug: log what we're checking
    const hasPreserveMap = preserveByKey instanceof Map;
    const hasLockMap = lockByKey instanceof Map;
    const preserveCount = hasPreserveMap ? preserveByKey.size : 0;
    const lockCount = hasLockMap ? lockByKey.size : 0;

    if (incoming.key && String(incoming.key).includes('05898170')) {
      console.log(`[MERGE-CHECK] key=${incoming.key}, preserveMap exists: ${hasPreserveMap}, lockMap exists: ${hasLockMap}, preserve count: ${preserveCount}, lock count: ${lockCount}`);
      if (hasLockMap && lockCount > 0) {
        console.log(`[MERGE-CHECK] Lock map contents:`, Array.from(lockByKey.entries()).map(([k, v]) => `${k}=${v.loc} (expires ${v.until > now ? 'active' : 'expired'})`));
      }
    }

    // Check for preserve window
    let preserveUntil = 0;
    let matchedPreserveKey = '';
    for (let i = 0; i < incomingIds.length; i++) {
      const id = incomingIds[i];
      const candidate = Number((preserveByKey instanceof Map ? preserveByKey.get(id) : 0) || 0);
      if (candidate > preserveUntil) {
        preserveUntil = candidate;
        matchedPreserveKey = id;
      }
    }
    const preserveWindowActive = preserveUntil > now;

    // Check for explicit position lock
    let lockedPosition: string | null = null;
    let lockMatchedKey = '';
    for (let i = 0; i < incomingIds.length; i++) {
      const id = incomingIds[i];
      const lockEntry = lockByKey instanceof Map ? lockByKey.get(id) : null;
      if (lockEntry && lockEntry.until > now) {
        lockedPosition = lockEntry.loc;
        lockMatchedKey = id;
        break;
      }
    }

    // Clean up expired entries
    if (!preserveWindowActive) {
      incomingIds.forEach((id) => {
        if (preserveByKey instanceof Map && preserveByKey.has(id) && Number(preserveByKey.get(id) || 0) <= now) {
          preserveByKey.delete(id);
        }
      });
    }
    if (!lockedPosition) {
      incomingIds.forEach((id) => {
        if (lockByKey instanceof Map && lockByKey.has(id)) {
          const entry = lockByKey.get(id);
          if (entry && entry.until <= now) {
            lockByKey.delete(id);
          }
        }
      });
    }

    const liveNode = findLiveNodeByAliases(diagram, incoming);
    const local =
      localMap.get(matchedPreserveKey || String(incoming.key)) ||
      incomingIds.map((id) => localMap.get(id)).find((candidate) => candidate && typeof candidate === 'object');
    const liveDataForName: any = liveNode?.data || local;
    const liveDefaultName = String(
      liveDataForName?.name ||
      liveDataForName?.object?.name ||
      liveDataForName?.objectview?.name ||
      liveDataForName?.typename ||
      liveDataForName?.objecttype?.name ||
      ''
    ).trim();
    const incomingNameIsBlank = !String(
      incoming?.name || incoming?.object?.name || incoming?.objectview?.name || ''
    ).trim();
    const preserveLiveDefaultName = (candidate: any) => {
      if (!incomingNameIsBlank || !liveDefaultName) return candidate;
      return {
        ...candidate,
        name: liveDefaultName,
        text: String(candidate?.text || '').trim() ? candidate.text : liveDefaultName,
        object: candidate?.object
          ? { ...candidate.object, name: liveDefaultName }
          : candidate?.object,
        objectview: candidate?.objectview
          ? { ...candidate.objectview, name: liveDefaultName }
          : candidate?.objectview,
      };
    };

    // If we have an explicit locked position, use it!
    if (lockedPosition) {
      console.log(`[MERGE-USE-LOCK] key=${incoming.key} using locked position: ${lockedPosition} (from ${lockMatchedKey}), incoming was: ${incoming.loc}`);

      const liveGroup = liveNode instanceof go.Node ? liveNode.data?.group : local?.group;
      const liveScale = liveNode instanceof go.Node ? liveNode.data?.scale : local?.scale;
      const liveScale1 = liveNode instanceof go.Node ? liveNode.data?.scale1 : local?.scale1;

      return preserveLiveDefaultName({
        ...incoming,
        loc: lockedPosition,
        group: liveGroup ?? incoming.group,
        scale: liveScale ?? incoming.scale,
        scale1: liveScale1 ?? incoming.scale1,
      });
    }

    // Authoritative live node geometry always wins for the same conceptual node.
    // If there is no live node, only preserve local geometry during an active drag-protection window.
    if (!(liveNode instanceof go.Node) && !(preserveWindowActive && local && typeof local === 'object')) {
      return preserveLiveDefaultName(incoming);
    }

    const liveData: any = liveNode?.data || local;
    const incomingLayoutRevision =
      incoming?.layoutRevision !== undefined && incoming?.layoutRevision !== null
        ? String(incoming.layoutRevision)
        : "";
    const liveLayoutRevision =
      liveData?.layoutRevision !== undefined && liveData?.layoutRevision !== null
        ? String(liveData.layoutRevision)
        : "";
    if (incomingLayoutRevision && incomingLayoutRevision !== liveLayoutRevision) {
      return preserveLiveDefaultName(incoming);
    }
    const liveLoc =
      liveNode instanceof go.Node
        ? `${liveNode.location.x} ${liveNode.location.y}`
        : (typeof liveData?.loc === 'string' && liveData.loc.length > 0 ? liveData.loc : local?.loc);

    const liveGroup =
      liveData?.group !== undefined
        ? liveData.group
        : local?.group;
    const liveScale =
      liveData?.scale !== undefined
        ? liveData.scale
        : local?.scale;
    const liveScale1 =
      liveData?.scale1 !== undefined
        ? liveData.scale1
        : local?.scale1;

    const incomingMatchesLive =
      (incoming.loc || '') === (liveLoc || '') &&
      String(incoming.group ?? '') === String(liveGroup ?? '') &&
      Number(incoming.scale ?? liveScale ?? 1) === Number(liveScale ?? 1);

    if (incomingMatchesLive) {
      incomingIds.forEach((id) => {
        if (preserveByKey instanceof Map) {
          preserveByKey.delete(id);
        }
      });
      return preserveLiveDefaultName(incoming);
    }

    console.log(`[MERGE-USE-LIVE] key=${incoming.key} using live position: ${liveLoc}, incoming was: ${incoming.loc}`);

    return preserveLiveDefaultName({
      ...incoming,
      loc: liveLoc ?? incoming.loc,
      group: liveGroup ?? incoming.group,
      scale: liveScale ?? incoming.scale,
      scale1: liveScale1 ?? incoming.scale1,
    });
  });
}

function isTransientRoutedLink(routing: any): boolean {
  if (routing === go.Link.Orthogonal || routing === go.Link.AvoidsNodes) return true;
  const normalized = String(routing || "").trim();
  return normalized === "Orthogonal" || normalized === "AvoidsNodes";
}

function getPreservedRouting(...sources: any[]): string {
  for (let i = 0; i < sources.length; i++) {
    const value = sources[i];
    if (value === go.Link.Orthogonal) return "Orthogonal";
    if (value === go.Link.AvoidsNodes) return "AvoidsNodes";
    if (value === go.Link.Normal) return "Normal";
    const normalized = String(value || "").trim();
    if (normalized === "Orthogonal" || normalized === "AvoidsNodes" || normalized === "Normal") {
      return normalized;
    }
  }
  return "Normal";
}

function sanitizeModifiedLinkDataForReact(link: any): any {
  if (!link || typeof link !== "object") return link;
  const normalizedFromPort = typeof link.fromPort === "string" ? link.fromPort : "";
  const normalizedToPort = typeof link.toPort === "string" ? link.toPort : "";
  const isRoutedLink = isTransientRoutedLink(link.routing);
  const nextLink: any = {
    ...link,
    fromPort: normalizedFromPort,
    toPort: normalizedToPort,
    points: normalizeLinkPoints(link.points),
  };
  const hasPersistableManualPoints =
    Array.isArray(nextLink.points) &&
    nextLink.points.length >= 4;
  // For routed links, ignore default auto-route geometry, but keep explicit reshaped paths.
  if (isRoutedLink && !hasPersistableManualPoints) {
    delete nextLink.points;
  }
  return nextLink;
}

function reanchorManualLinkPoints(link: go.Link, rawPoints: any): number[] | null {
  const points = normalizeLinkPoints(rawPoints);
  if (!Array.isArray(points) || points.length < 4) return null;
  const nextPoints = [...points];
  const fromNode = link.fromNode;
  const toNode = link.toNode;
  const fromPort = (link.fromPort as any) || fromNode?.port || fromNode;
  const toPort = (link.toPort as any) || toNode?.port || toNode;

  if (fromNode && fromPort && nextPoints.length >= 4) {
    const currentFrom = new go.Point(nextPoints[0], nextPoints[1]);
    const nextAfterFrom = new go.Point(nextPoints[2], nextPoints[3]);
    const anchoredFrom = new go.Point(currentFrom.x, currentFrom.y);
    try {
      link.getLinkPointFromPoint(fromNode, fromPort, currentFrom, nextAfterFrom, true, anchoredFrom);
      const dx = anchoredFrom.x - currentFrom.x;
      const dy = anchoredFrom.y - currentFrom.y;
      nextPoints[0] = anchoredFrom.x;
      nextPoints[1] = anchoredFrom.y;
      nextPoints[2] += dx;
      nextPoints[3] += dy;
    } catch (_) {
    }
  }

  if (toNode && toPort && nextPoints.length >= 4) {
    const last = nextPoints.length - 2;
    const prev = nextPoints.length - 4;
    const beforeTo = new go.Point(nextPoints[prev], nextPoints[prev + 1]);
    const currentTo = new go.Point(nextPoints[last], nextPoints[last + 1]);
    const anchoredTo = new go.Point(currentTo.x, currentTo.y);
    try {
      link.getLinkPointFromPoint(toNode, toPort, currentTo, beforeTo, false, anchoredTo);
      const dx = anchoredTo.x - currentTo.x;
      const dy = anchoredTo.y - currentTo.y;
      nextPoints[last] = anchoredTo.x;
      nextPoints[last + 1] = anchoredTo.y;
      nextPoints[prev] += dx;
      nextPoints[prev + 1] += dy;
    } catch (_) {
    }
  }

  return nextPoints;
}

function shiftManualLinkEndpointSegments(
  rawPoints: any,
  options: {
    moveFrom?: { dx: number; dy: number } | null;
    moveTo?: { dx: number; dy: number } | null;
  }
): number[] | null {
  const points = normalizeLinkPoints(rawPoints);
  if (!Array.isArray(points) || points.length < 4) return null;
  const nextPoints = [...points];
  const pointCount = Math.floor(nextPoints.length / 2);
  if (options.moveFrom && nextPoints.length >= 4) {
    const { dx, dy } = options.moveFrom;
    const movedPointCount = Math.max(2, Math.ceil(pointCount / 2));
    for (let i = 0; i < movedPointCount; i++) {
      nextPoints[i * 2] += dx;
      nextPoints[i * 2 + 1] += dy;
    }
  }
  if (options.moveTo && nextPoints.length >= 4) {
    const { dx, dy } = options.moveTo;
    const movedPointCount = Math.max(2, Math.ceil(pointCount / 2));
    for (let i = 0; i < movedPointCount; i++) {
      const pointIndex = pointCount - 1 - i;
      nextPoints[pointIndex * 2] += dx;
      nextPoints[pointIndex * 2 + 1] += dy;
    }
  }
  return nextPoints;
}

function sanitizeObjectViewDispatchData(data: any): any {
  if (!data || typeof data !== "object") return data;
  const nextData = { ...data };
  delete nextData.modified;
  delete nextData.isSelected;
  return nextData;
}

function getMetisModels(phData: any): any[] {
  return Array.isArray(phData?.metis?.models) ? phData.metis.models.filter(Boolean) : [];
}

const MEMORY_STATE_STORAGE_KEY = 'memorystate';

function applyObjectViewPatchToPhData(phData: any, patch: any): boolean {
  if (!patch?.id) return false;
  const modelviewId = patch.modelviewId || patch.modelviewRef || "";
  const sanitizedPatch = { ...patch };
  delete sanitizedPatch.modelviewId;
  delete sanitizedPatch.modelviewRef;
  const models = getMetisModels(phData);

  for (let mi = 0; mi < models.length; mi += 1) {
    const modelviews = models[mi]?.modelviews || [];
    for (let mvi = 0; mvi < modelviews.length; mvi += 1) {
      const modelview = modelviews[mvi];
      if (modelviewId && modelview?.id !== modelviewId) continue;
      const objectviews = modelview?.objectviews || [];
      for (let ovi = 0; ovi < objectviews.length; ovi += 1) {
        const objectview = objectviews[ovi];
        if (objectview?.id !== patch.id) continue;
        objectviews[ovi] = {
          ...objectview,
          ...sanitizedPatch,
        };
        return true;
      }
    }
  }

  return false;
}

function persistObjectViewPatchToMemoryState(patch: any) {
  if (typeof window === "undefined" || !patch?.id) return;
  if (new URLSearchParams(window.location.search).get("workspaceAuthority") === "redux") return;
  try {
    const rawStored =
      window.sessionStorage?.getItem(MEMORY_STATE_STORAGE_KEY) ||
      window.localStorage?.getItem(MEMORY_STATE_STORAGE_KEY);
    if (!rawStored) return;

    const parsed = JSON.parse(rawStored);
    const didUpdate = applyObjectViewPatchToPhData(parsed?.phData, patch);
    if (!didUpdate) return;

    const serialized = JSON.stringify(parsed);
    try { window.sessionStorage?.setItem(MEMORY_STATE_STORAGE_KEY, serialized); } catch (_) { }
    try { window.localStorage?.setItem(MEMORY_STATE_STORAGE_KEY, serialized); } catch (_) { }
  } catch (_) {
    // Best-effort draft persistence; Redux remains authoritative in memory.
  }
}

function safeJsonCloneForDispatch(value: any): any {
  const seen = new WeakSet<object>();
  return JSON.parse(JSON.stringify(value, (_key, current) => {
    if (typeof current === "function") return undefined;
    if (!current || typeof current !== "object") return current;
    if (seen.has(current)) return undefined;
    seen.add(current);
    const ctor = current.constructor?.name || "";
    if (
      ctor === "Diagram" ||
      ctor === "AnimationManager" ||
      ctor === "ToolManager" ||
      ctor === "DraggingTool" ||
      ctor === "CommandHandler" ||
      ctor === "GraphObject" ||
      ctor === "Part" ||
      ctor === "Node" ||
      ctor === "Link" ||
      ctor === "Group" ||
      ctor === "Panel" ||
      ctor === "Shape" ||
      ctor === "Adornment" ||
      ctor === "InputEvent"
    ) {
      return undefined;
    }
    return current;
  }));
}

function queueObjectViewDispatch(instance: any, dispatch: any, data: any, diagram?: any) {
  if (!instance || typeof dispatch !== "function" || !data?.id) return;
  if (!(instance as any).__queuedObjectViewDispatches) {
    (instance as any).__queuedObjectViewDispatches = new Map<string, any>();
  }
  const queue: Map<string, any> = (instance as any).__queuedObjectViewDispatches;
  const modelviewId = data.modelviewId || data.modelviewRef || "";
  const queueKey = `${modelviewId}:${data.id}`;
  const prev = queue.get(queueKey) || {};
  queue.set(queueKey, { ...prev, ...data, ...(modelviewId ? { modelviewId } : {}) });
  // Store the diagram reference for use in the flush
  if (diagram && !queue.__diagram) {
    queue.__diagram = diagram;
  }
  if ((instance as any).__queuedObjectViewDispatchTimer) return;
  (instance as any).__queuedObjectViewDispatchTimer = setTimeout(() => {
    const pendingQueue: Map<string, any> = (instance as any).__queuedObjectViewDispatches || new Map();
    const storedDiagram = pendingQueue.__diagram;
    (instance as any).__queuedObjectViewDispatches = new Map();
    (instance as any).__queuedObjectViewDispatchTimer = null;
    pendingQueue.forEach((payload) => {
      try {
        dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: payload });
        persistObjectViewPatchToMemoryState(payload);

        // CRITICAL: Update myMetis nodes AND their objectviews with new positions
        // BEFORE calling setState, so React has the correct data to render
        if (instance.state?.myMetis?.gojsModel?.nodes) {
          const nodes = instance.state.myMetis.gojsModel.nodes;
          const node = nodes.find((n: any) => n.id === payload.id || n.key === payload.id || n.objviewRef === payload.id);
          if (node) {
            if (payload.loc) node.loc = payload.loc;
            if (payload.size) node.size = payload.size;
            if (payload.fillcolor !== undefined) node.fillcolor = payload.fillcolor;
            if (payload.strokecolor !== undefined) node.strokecolor = payload.strokecolor;
            if (payload.strokewidth !== undefined) node.strokewidth = payload.strokewidth;
            if (payload.icon !== undefined) node.icon = payload.icon;
            // Update the underlying objectview as well
            if (node.objectview) {
              if (payload.loc) node.objectview.loc = payload.loc;
              if (payload.size) node.objectview.size = payload.size;
              if (payload.fillcolor !== undefined) node.objectview.fillcolor = payload.fillcolor;
              if (payload.strokecolor !== undefined) node.objectview.strokecolor = payload.strokecolor;
              if (payload.strokewidth !== undefined) node.objectview.strokewidth = payload.strokewidth;
              if (payload.icon !== undefined) node.objectview.icon = payload.icon;
            }
          }
        }
      } catch (err) {
        console.error('Error updating node in queue:', err);
      }
    });
    // Force React state update to immediately reflect position changes
    if (instance && typeof instance.setState === 'function' && instance.state?.myMetis?.gojsModel) {
      const nodes = instance.state.myMetis.gojsModel.nodes;
      if (Array.isArray(nodes)) {
        instance.setState({ nodeDataArray: [...nodes], skipsDiagramUpdate: true });
      }
    }

    // CRITICAL: Also update the GoJS diagram's model directly
    if (storedDiagram && storedDiagram.model) {
      storedDiagram.model.commit((m: any) => {
        pendingQueue.forEach((payload) => {
          const nodeData = m.findNodeDataForKey(payload.id);
          if (nodeData) {
            if (payload.loc) m.set(nodeData, 'loc', payload.loc);
            if (payload.size) m.set(nodeData, 'size', payload.size);
            if (payload.fillcolor !== undefined) m.set(nodeData, 'fillcolor', payload.fillcolor);
            if (payload.strokecolor !== undefined) m.set(nodeData, 'strokecolor', payload.strokecolor);
            if (payload.strokewidth !== undefined) m.set(nodeData, 'strokewidth', payload.strokewidth);
            if (payload.icon !== undefined) m.set(nodeData, 'icon', payload.icon);
          }
        });
      }, 'update positions from queue');
    }
  }, 0);
}

function queueRelshipViewDispatch(instance: any, dispatch: any, data: any, diagram?: any) {
  if (!instance || typeof dispatch !== "function" || !data?.id) return;
  if (!(instance as any).__queuedRelshipViewDispatches) {
    (instance as any).__queuedRelshipViewDispatches = new Map<string, any>();
  }
  const queue: Map<string, any> = (instance as any).__queuedRelshipViewDispatches;
  const prev = queue.get(data.id) || {};
  queue.set(data.id, { ...prev, ...data });
  // Store the diagram reference for use in the flush
  if (diagram && !queue.__diagram) {
    queue.__diagram = diagram;
  }
  if ((instance as any).__queuedRelshipViewDispatchTimer) return;
  (instance as any).__queuedRelshipViewDispatchTimer = setTimeout(() => {
    const pendingQueue: Map<string, any> = (instance as any).__queuedRelshipViewDispatches || new Map();
    const storedDiagram = pendingQueue.__diagram;
    (instance as any).__queuedRelshipViewDispatches = new Map();
    (instance as any).__queuedRelshipViewDispatchTimer = null;
    pendingQueue.forEach((payload) => {
      try {
        dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data: payload });

        // CRITICAL: Update myMetis links with new data
        if (instance.state?.myMetis?.gojsModel?.links) {
          const links = instance.state.myMetis.gojsModel.links;
          const link = links.find((l: any) => l.id === payload.id || l.key === payload.id || l.relviewRef === payload.id);
          if (link) {
            if (payload.points) link.points = payload.points;
            if (payload.routing) link.routing = payload.routing;
            if (payload.strokecolor !== undefined) link.strokecolor = payload.strokecolor;
            if (payload.strokewidth !== undefined) link.strokewidth = payload.strokewidth;
            // Update the underlying relshipview as well
            if (link.relshipview) {
              if (payload.points) link.relshipview.points = payload.points;
              if (payload.routing) link.relshipview.routing = payload.routing;
              if (payload.strokecolor !== undefined) link.relshipview.strokecolor = payload.strokecolor;
              if (payload.strokewidth !== undefined) link.relshipview.strokewidth = payload.strokewidth;
            }
          }
        }
      } catch (err) {
        console.error('[Queue] Error updating link:', err);
      }
    });

    // Force React state update
    if (instance && typeof instance.setState === 'function' && instance.state?.myMetis?.gojsModel) {
      const links = instance.state.myMetis.gojsModel.links;
      if (Array.isArray(links)) {
        instance.setState({ linkDataArray: [...links], skipsDiagramUpdate: true });
      }
    }

    // Update the GoJS diagram's model directly
    if (storedDiagram && storedDiagram.model) {
      storedDiagram.model.commit((m: any) => {
        pendingQueue.forEach((payload) => {
          // SAFETY CHECK: Make sure this is actually a link, not a node
          const nodeData = m.findNodeDataForKey(payload.id);
          if (nodeData) return; // Skip this update

          const linkData = m.findLinkDataForKey(payload.id);
          if (linkData) {
            if (payload.points) m.set(linkData, 'points', payload.points);
            if (payload.routing) m.set(linkData, 'routing', payload.routing);
            if (payload.strokecolor !== undefined) m.set(linkData, 'strokecolor', payload.strokecolor);
            if (payload.strokewidth !== undefined) m.set(linkData, 'strokewidth', payload.strokewidth);
          }
        });
      }, 'update link paths from queue');
    }
  }, 0);
}

function flushQueuedDiagramDispatches(instance: any, dispatch: any) {
  if (!instance || typeof dispatch !== "function") return;

  const objectTimer = (instance as any).__queuedObjectViewDispatchTimer;
  if (objectTimer) {
    clearTimeout(objectTimer);
    (instance as any).__queuedObjectViewDispatchTimer = null;
  }
  const pendingObjectQueue: Map<string, any> = (instance as any).__queuedObjectViewDispatches || new Map();
  (instance as any).__queuedObjectViewDispatches = new Map();
  pendingObjectQueue.forEach((payload) => {
    try {
      dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: payload });
      persistObjectViewPatchToMemoryState(payload);
    } catch (_) {
    }
  });

  const relTimer = (instance as any).__queuedRelshipViewDispatchTimer;
  if (relTimer) {
    clearTimeout(relTimer);
    (instance as any).__queuedRelshipViewDispatchTimer = null;
  }
  const pendingRelQueue: Map<string, any> = (instance as any).__queuedRelshipViewDispatches || new Map();
  (instance as any).__queuedRelshipViewDispatches = new Map();
  pendingRelQueue.forEach((payload) => {
    try {
      dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data: payload });
    } catch (_) {
    }
  });
}

function getGroupMemberScale(part: go.Group | null | undefined): number {
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

function getAncestorMemberScaleProduct(group: go.Group | null | undefined): number {
  let current = group instanceof go.Group ? group : null;
  let product = 1.0;
  while (current instanceof go.Group) {
    product *= getGroupMemberScale(current);
    current = current.containingGroup;
  }
  return product;
}

function getDerivedScaleForGroup(targetGroup: go.Group | null | undefined): number {
  return getAncestorMemberScaleProduct(targetGroup);
}

function getRenderedPartScale(part: go.Part | null | undefined): number {
  if (!(part instanceof go.Part)) return 1.0;
  const raw = Number(part.scale ?? part.data?.scale1 ?? part.data?.scale ?? 1.0);
  return Number.isFinite(raw) && raw > 0 ? raw : 1.0;
}

function getRenderedTextScale(part: go.Part | null | undefined): number {
  if (!(part instanceof go.Part)) return 1.0;
  const partScale = getRenderedPartScale(part);
  const textScaleRaw = Number(part.data?.textscale ?? 1.0);
  const textScale = Number.isFinite(textScaleRaw) && textScaleRaw > 0 ? textScaleRaw : 1.0;
  return partScale * textScale;
}

function getRelationshipTextScale(diagram: go.Diagram | null | undefined, relview: any): number {
  if (!diagram || !relview) return 1.0;
  const fromId = relview?.fromObjview?.id;
  const toId = relview?.toObjview?.id;
  const fromPart = fromId ? (diagram.findNodeForKey(fromId) as go.Part | null) : null;
  const toPart = toId ? (diagram.findNodeForKey(toId) as go.Part | null) : null;
  const fromScale = getRenderedTextScale(fromPart);
  const toScale = getRenderedTextScale(toPart);
  return (fromScale + toScale) / 2;
}

function syncRelationshipTextScaleForObjectView(
  diagram: go.Diagram | null | undefined,
  objectview: any
) {
  if (!diagram || !objectview) return;
  const relviews = [
    ...(Array.isArray(objectview.inputrelviews) ? objectview.inputrelviews : []),
    ...(Array.isArray(objectview.outputrelviews) ? objectview.outputrelviews : []),
  ];
  const seen = new Set<string>();
  for (let i = 0; i < relviews.length; i++) {
    const relview = relviews[i];
    if (!relview?.id || seen.has(relview.id)) continue;
    seen.add(relview.id);
    const nextScale = getRelationshipTextScale(diagram, relview);
    relview.textscale = nextScale;
    const link = diagram.findLinkForKey(relview.id);
    const linkData: any = link?.data || null;
    if (linkData && typeof diagram.model?.setDataProperty === 'function') {
      try { diagram.model.setDataProperty(linkData, "textscale", nextScale); } catch (_) { }
    } else if (linkData) {
      linkData.textscale = nextScale;
    }
    try { link?.updateTargetBindings(); } catch (_) { }
  }
}

function applyDerivedScaleToPart(
  diagram: go.Diagram | null | undefined,
  part: go.Part | null | undefined,
  targetGroup: go.Group | null | undefined,
  objectview?: any,
  goNode?: any
) {
  if (!diagram || !(part instanceof go.Part)) return 1.0;
  const nextScale = getDerivedScaleForGroup(targetGroup);
  const data: any = part.data || {};
  try { part.scale = nextScale; } catch (_) { }
  data.scale = nextScale;
  data.scale1 = nextScale;
  if (typeof diagram.model?.setDataProperty === 'function') {
    try { diagram.model.setDataProperty(data, "scale", nextScale); } catch (_) { }
    try { diagram.model.setDataProperty(data, "scale1", nextScale); } catch (_) { }
  }
  if (objectview) {
    objectview.scale = nextScale;
  } else if (data.objectview) {
    data.objectview.scale = nextScale;
  }
  if (goNode) {
    goNode.scale = nextScale;
    if (goNode.objectview) {
      goNode.objectview.scale = nextScale;
    }
  }
  syncRelationshipTextScaleForObjectView(diagram, objectview || data.objectview);
  return nextScale;
}

function applyNestedGroupHalfSize(
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

function groupAllowsGrab(
  group: go.Group | null | undefined,
  myModelview?: any,
  myMetis?: any
): boolean {
  if (!(group instanceof go.Group)) return false;
  const data: any = group.data || {};
  const storeState = getCurrentStore?.()?.getState?.();
  let storedObjview: any = null;
  const storeModels = getMetisModels(storeState?.phData);
  if (storeModels.length) {
    outer: for (let mi = 0; mi < storeModels.length; mi++) {
      const model = storeModels[mi];
      const modelviews = model?.modelviews || [];
      for (let mvi = 0; mvi < modelviews.length; mvi++) {
        const modelview = modelviews[mvi];
        const objectviews = modelview?.objectviews || [];
        for (let ovi = 0; ovi < objectviews.length; ovi++) {
          const candidate = objectviews[ovi];
          if (candidate?.id === data?.key || candidate?.id === data?.objviewRef) {
            storedObjview = candidate;
            break outer;
          }
        }
      }
    }
  }
  const objview =
    data.objectview ||
    myModelview?.findObjectView?.(data?.key) ||
    myMetis?.findObjectView?.(data?.objviewRef || data?.key) ||
    storedObjview;
  return (
    objview?.grabIsAllowed === true ||
    data?.grabIsAllowed === true ||
    (group as any)?.grabIsAllowed === true ||
    (group as any)?.objectview?.grabIsAllowed === true
  );
}

function isPartVisuallyInsideGroup(part: go.Part | null | undefined, grp: go.Group | null | undefined): boolean {
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

function resolveClickedPortGraphObject(subject: any): go.GraphObject | null {
  let probe: any = subject;
  for (let depth = 0; probe && depth < 8; depth++) {
    const data = probe?.data;
    if (data && (data.id || data.portId) && data.side) {
      return probe as go.GraphObject;
    }
    if (probe?.portId && probe?.part instanceof go.Node) {
      return probe as go.GraphObject;
    }
    probe = probe.panel;
  }
  return null;
}

function syncFocusedObjectPeerFlags(
  diagram: go.Diagram | null | undefined,
  focusObjectId: string | null | undefined,
  _focusObjectviewId: string | null | undefined
) {
  if (!diagram) return;
  const normalizedObjectId = focusObjectId ? String(focusObjectId) : "";
  const it = diagram.nodes.iterator;
  while (it?.next()) {
    const node = it.value as go.Node;
    const data: any = node?.data || {};
    const objectId =
      data?.object?.id ||
      data?.objectview?.object?.id ||
      data?.objRef ||
      data?.objectRef ||
      "";
    const isFocusPeer = Boolean(normalizedObjectId) && String(objectId) === normalizedObjectId;
    const hadDataFlag = Boolean(data.isFocusPeer);
    if (hadDataFlag === isFocusPeer) continue;
    data.isFocusPeer = isFocusPeer;
    try { node.updateTargetBindings(); } catch (_) { }
  }
  try { diagram.requestUpdate(); } catch (_) { }
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
    try { diagram.model.setGroupKeyForNodeData(nodeData, undefined); } catch (_) { }
    try { diagram.model.setDataProperty(nodeData, "group", ""); } catch (_) { }
    try { nodeData.group = ""; } catch (_) { }
  }
  try { part.containingGroup = null; } catch (_) { }
  try { (part as any).group = ""; } catch (_) { }
  try { (part as any).data.group = ""; } catch (_) { }
}

function detachPartToTopLevel(
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
    try { previousContainingGroup.removeMembers(detachSet, true); } catch (_) { }
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
  try { part.updateAllTargetBindings(); } catch (_) { }
  try { diagram.updateAllTargetBindings(); } catch (_) { }
  try { diagram.requestUpdate(); } catch (_) { }
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
  try { part.containingGroup = targetGroup; } catch (_) { }
  const nodeData = data || part.data;
  if (nodeData) {
    try { diagram.model.setGroupKeyForNodeData(nodeData, targetGroup.key); } catch (_) { }
    try { diagram.model.setDataProperty(nodeData, "group", targetGroup.key); } catch (_) { }
    try { nodeData.group = targetGroup.key; } catch (_) { }
  }
  try { (part as any).group = targetGroup.key; } catch (_) { }
  try { (part as any).data.group = targetGroup.key; } catch (_) { }
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

function isMetamodelSelection(myMetis: any, selection: any) {
  if (myMetis?.modelType === 'Metamodelling') return true;
  try {
    for (let it = selection?.iterator; it?.next();) {
      const part = it.value;
      const data = part?.data;
      // Only return true if the object IS an objecttype (category check), not just because it HAS an objecttype property
      if (data?.category === constants.gojs.C_OBJECTTYPE) return true;
    }
  } catch (_) {
  }
  return false;
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

function getDefaultRoutingForRelshipType(typeName: string | undefined | null, fallback: string) {
  const normalized = String(typeName || "").trim().toLowerCase();
  if ((normalized === "isfollowedby" || normalized === "triggers") && (!fallback || fallback === "Normal")) {
    return "AvoidsNodes";
  }
  return fallback || "Normal";
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

function getPersistedGroupSize(part: any): string {
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

function ensureInitialGroupSize(diagram, node, data, options) {
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
    const resizeObj = node.resizeObject || node.reshapeObject || node;
    if (resizeObj) {
      resizeObj.desiredSize = desired;
    } else {
      node.desiredSize = desired;
    }
    node.ensureBounds();
    refreshGroupPartRendering(diagram, node, data);
  }
}

function refreshGroupPartRendering(diagram: go.Diagram | null | undefined, part: go.Part | null | undefined, data?: any) {
  if (!diagram || !(part instanceof go.Part)) return;
  const targetData = data || part.data;
  if (targetData && typeof diagram.model?.updateTargetBindings === 'function') {
    try { diagram.model.updateTargetBindings(targetData); } catch (_) { }
  }
  try { diagram.updateAllTargetBindings("scale"); } catch (_) { }
  try { part.updateTargetBindings(); } catch (_) { }
  try { part.ensureBounds(); } catch (_) { }
  try { part.updateAdornments(); } catch (_) { }
  try { diagram.requestUpdate(); } catch (_) { }
}

function resizeGroupToHalfParent(diagram: go.Diagram, childData: any, childPart: go.Part | null, parentPart: go.Part | null) {
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
    const resizeObj = childPart.resizeObject || childPart.reshapeObject || childPart;
    if (resizeObj) {
      resizeObj.desiredSize = new go.Size(width, height);
    } else {
      childPart.desiredSize = new go.Size(width, height);
    }
    childPart.ensureBounds();
    refreshGroupPartRendering(diagram, childPart, childData);
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

function setGroupMemberVisibilityRecursive(group: go.Group, visible: boolean) {
  if (!(group instanceof go.Group)) return;
  try {
    group.memberParts.each((member: go.Part) => {
      try { member.visible = visible; } catch (_) { }
      try { member.updateTargetBindings(); } catch (_) { }
      if (member instanceof go.Node) {
        try { member.invalidateConnectedLinks(); } catch (_) { }
      }
      if (member instanceof go.Link && visible) {
        try { member.invalidateRoute(); } catch (_) { }
        try { member.updateRoute(); } catch (_) { }
      }
      if (member instanceof go.Group) {
        setGroupMemberVisibilityRecursive(member, visible);
      }
    });
  } catch (_) {
  }
}

function getGroupMemberLocSnapshots(diagram: any): Map<string, Map<string, string>> {
  if (!diagram) return new Map();
  if (!(diagram as any).__groupMemberLocSnapshots) {
    (diagram as any).__groupMemberLocSnapshots = new Map<string, Map<string, string>>();
  }
  return (diagram as any).__groupMemberLocSnapshots;
}

function snapshotGroupMemberLocations(diagram: go.Diagram, group: go.Group) {
  if (!diagram || !(group instanceof go.Group) || !group.data?.key) return;
  const snapshots = getGroupMemberLocSnapshots(diagram);
  const memberLocs = new Map<string, string>();
  try {
    group.memberParts.each((member: go.Part) => {
      const key = member?.data?.key;
      if (!key || !(member instanceof go.Node)) return;
      const locString =
        typeof member.data?.loc === "string"
          ? member.data.loc
          : `${member.location.x} ${member.location.y}`;
      memberLocs.set(String(key), locString);
    });
  } catch (_) {
  }
  snapshots.set(String(group.data.key), memberLocs);
}

function restoreGroupMemberLocations(diagram: go.Diagram, group: go.Group) {
  if (!diagram || !(group instanceof go.Group) || !group.data?.key) return;
  const snapshots = getGroupMemberLocSnapshots(diagram);
  const memberLocs = snapshots.get(String(group.data.key));
  if (!memberLocs || memberLocs.size === 0) return;
  try {
    group.memberParts.each((member: go.Part) => {
      const key = member?.data?.key;
      if (!key || !(member instanceof go.Node)) return;
      const savedLoc = memberLocs.get(String(key));
      if (!savedLoc) return;
      try { member.location = go.Point.parse(savedLoc); } catch (_) { }
      try { diagram.model.setDataProperty(member.data, "loc", savedLoc); } catch (_) {
        try { member.data.loc = savedLoc; } catch (_err) { }
      }
      try {
        const objview = member.data?.objectview;
        if (objview) objview.loc = savedLoc;
      } catch (_) { }
    });
  } catch (_) {
  }
}

function syncLiveGroupExpandedState(diagram: go.Diagram, group: go.Group, expanded: boolean) {
  if (!diagram || !(group instanceof go.Group)) return;
  const data: any = group.data || {};
  if (!expanded) {
    snapshotGroupMemberLocations(diagram, group);
  }
  try { group.isSubGraphExpanded = expanded; } catch (_) { }
  try { diagram.model.setDataProperty(data, "isExpanded", expanded); } catch (_) { data.isExpanded = expanded; }
  try { diagram.model.setDataProperty(data, "isSubGraphExpanded", expanded); } catch (_) { data.isSubGraphExpanded = expanded; }
  try {
    const objview = data?.objectview;
    if (objview) objview.isExpanded = expanded;
  } catch (_) { }
  setGroupMemberVisibilityRecursive(group, expanded);
  if (expanded) {
    restoreGroupMemberLocations(diagram, group);
  }
  try { group.updateTargetBindings(); } catch (_) { }
  try { group.updateAdornments(); } catch (_) { }
  try { group.ensureBounds(); } catch (_) { }
  try { diagram.requestUpdate(); } catch (_) { }
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

function normalizeNodeCategoryData(nodeDataArray: any[] | undefined): any[] {
  if (!Array.isArray(nodeDataArray)) return nodeDataArray as any;
  return nodeDataArray.map((node) => {
    if (!node || typeof node !== 'object') return node;
    normalizeEmptyBooleanFieldsInPlace(node);
    const category = node.category || node.template || constants.gojs.C_NODETEMPLATE;
    if (typeof category === 'string' && category.length > 0 && node.category === category) {
      return node;
    }
    return {
      ...node,
      category,
    };
  });
}

class GoJSApp extends React.Component<{}, AppState> {
  constructor(props: object) {
    super(props);
    if (debug) console.log('62 GoJSApp', this.props.nodeDataArray, this.props);
    const initialDropLayout = buildDropLayoutOverridesFromMetis(this.props?.myMetis);
    this.state = {
      nodeDataArray: normalizeNodeCategoryData(this.props?.nodeDataArray),
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
    this._ownDiagram = null;
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
        const firstHopRelIds = rel.startsWith('rel:') ? [rel.slice(4)] : [];
        this.runSelectConnectedFromContext(ctx, {
          levels: 1,
          reltypes: firstHopRelIds.length > 0 ? '' : rel,
          reldir: 'All',
          firstHopRelIds,
          createMissingViews: !!params?.createMissingViews,
        });
      }
      this.closeConnectedObjectsDialog();
      return;
    }

    // Traverse options
    const levels = Math.max(1, Math.floor(Number(params?.steps) || 1));
    const selectedTypes = params?.selectedTypes || [];
    const firstHopRelIds = selectedTypes
      .filter((value: string) => value.startsWith('rel:'))
      .map((value: string) => value.slice(4))
      .filter(Boolean);
    const reltypes = selectedTypes.length
      ? selectedTypes
        .filter((value: string) => !value.startsWith('rel:'))
        .join(',')
      : '';
    const reldir = params?.direction || 'All';
    this.runSelectConnectedFromContext(ctx, {
      levels,
      reltypes,
      reldir,
      firstHopRelIds,
      createMissingViews: !!params?.createMissingViews,
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
    params: { levels: number; reltypes: string; reldir: string; firstHopRelIds?: string[]; createMissingViews?: boolean }
  ) => {
    const diagram = ctx?.diagram;
    const part = ctx?.part;
    if (!diagram || !part || !part.data || part.data.category !== constants.gojs.C_OBJECT) return;

    const nodeData: any = part.data;
    const myMetis = this.state.myMetis;
    myMetis.myDiagram = diagram;
    let modelview = myMetis?.currentModelview;
    if (!modelview) return;
    modelview = myMetis.findModelView(modelview.id);
    let goModel = myMetis.gojsModel;
    if (!goModel) {
      goModel = new gjs.goModel(modelview.id, "myModel", modelview);
      myMetis.setGojsModel(goModel);
    }
    const objview = myMetis.findObjectView(nodeData.key);
    if (!objview) return;

    const levels = Math.max(1, Math.floor(Number(params.levels) || 1));
    const reltypes = params.reltypes === 'All' ? '' : (params.reltypes || '').trim();
    const dir = (params.reldir || 'All').toLowerCase();
    const viewCollection = new akm.cxCollectionOfViews(modelview as any);

    uid.selectConnectedObjects1(modelview, objview, goModel, myMetis, levels, reltypes, dir, viewCollection, {
      firstHopRelIds: params.firstHopRelIds || [],
      createMissingViews: !!params.createMissingViews,
    });

    const mySelection = new go.Set<go.Part | go.Link>();
    const objviews = viewCollection.objectviews || [];
    const relviews = viewCollection.relshipviews || [];

    for (let i = 0; i < objviews.length; i++) {
      const ov = objviews[i];
      if (!ov || ov.id === nodeData.key) continue;
      const goNode = goModel.findNodeByViewId(ov.id);
      const gjsNode = diagram.findNodeForKey(goNode?.key || ov.id) ||
        (goNode ? diagram.findNodeForData(goNode) : null);
      if (gjsNode) mySelection.add(gjsNode);
    }

    for (let i = 0; i < relviews.length; i++) {
      const rv = relviews[i];
      if (!rv) continue;
      const goLink = goModel.findLinkByViewId(rv.id);
      const gjsLink = diagram.findLinkForKey(goLink?.key || rv.id);
      if (gjsLink) mySelection.add(gjsLink);
    }

    const rootPart = diagram.findPartForKey(nodeData.key) || diagram.findNodeForKey(nodeData.key);
    if (rootPart) mySelection.add(rootPart as any);

    if (mySelection.count > 0) {
      diagram.selectCollection(mySelection);
    } else {
      diagram.clearSelection();
    }
  }

  public componentDidUpdate(prevProps: any) {
    const nextState: any = {};
    let shouldSyncFromProps = false;
    const diagram = this.state?.myMetis?.myDiagram;
    const focusModelChanged =
      this.props.phFocus?.focusModel?.id !== prevProps.phFocus?.focusModel?.id;
    const focusModelviewChanged =
      this.props.phFocus?.focusModelview?.id !== prevProps.phFocus?.focusModelview?.id;
    const metisChanged = this.props.myMetis !== prevProps.myMetis;
    const isChoosingRelationshipType =
      this.state.showModal &&
      this.state.modalContext?.what === 'selectDropdown' &&
      this.state.modalContext?.case === 'Create Relationship';

    if (this.props.nodeDataArray !== prevProps.nodeDataArray) {
      const structuralNodeDiff = hasStructuralNodeArrayDiff(this.props.nodeDataArray, this.state.nodeDataArray);
      if (debug) console.log(`[COMPONENT-UPDATE] nodeDataArray changed, structural diff: ${structuralNodeDiff}, diagram exists: ${!!diagram}`);

      if (diagram && !structuralNodeDiff) {
        // Keep live diagram node geometry authoritative when structure is unchanged.
        // But still apply visual property changes (fillcolor, strokecolor, etc.)
        if (debug) console.log('[COMPONENT-UPDATE] No structural change - checking visual props only');
        try {
          const incomingNodes = this.props.nodeDataArray || [];
          const currentNodes = this.state.nodeDataArray || [];
          const liveUpdateProps = ['name', 'text', 'fillcolor', 'strokecolor', 'strokewidth', 'icon'];

          diagram.model.commit((m: any) => {
            incomingNodes.forEach((incomingNode: any) => {
              if (!incomingNode || !incomingNode.key) return;
              const currentNode = currentNodes.find((n: any) =>
                n?.key === incomingNode.key ||
                n?.id === incomingNode.id ||
                n?.objviewRef === incomingNode.objviewRef
              );

              // Check if any live-bound label or visual properties changed.
              const hasLiveUpdate = liveUpdateProps.some(prop =>
                incomingNode[prop] !== undefined &&
                incomingNode[prop] !== currentNode?.[prop]
              );

              if (hasLiveUpdate) {
                const nodeData = m.findNodeDataForKey(incomingNode.key);
                if (nodeData) {
                  liveUpdateProps.forEach(prop => {
                    if (incomingNode[prop] !== undefined && incomingNode[prop] !== currentNode?.[prop]) {
                      const incomingText = prop === 'name' || prop === 'text'
                        ? String(incomingNode[prop] ?? '').trim()
                        : '';
                      const currentDefaultName = String(
                        nodeData.name || nodeData.object?.name || nodeData.typename || nodeData.objecttype?.name || ''
                      ).trim();
                      // A generated palette may publish one stale blank node
                      // snapshot immediately after the drop. Do not let it erase
                      // the ObjectType-name default already assigned live.
                      if ((prop === 'name' || prop === 'text') && !incomingText && currentDefaultName) {
                        return;
                      }
                      m.set(nodeData, prop, incomingNode[prop]);
                    }
                  });
                  if (incomingNode.object?.name !== undefined &&
                      (String(incomingNode.object.name).trim() || !String(nodeData.object?.name || nodeData.name || nodeData.typename || '').trim()) &&
                      incomingNode.object?.name !== nodeData.object?.name) {
                    m.set(nodeData, 'object', { ...(nodeData.object || {}), ...incomingNode.object });
                  }
                  if (incomingNode.objectview?.name !== undefined &&
                      (String(incomingNode.objectview.name).trim() || !String(nodeData.objectview?.name || nodeData.name || nodeData.typename || '').trim()) &&
                      incomingNode.objectview?.name !== nodeData.objectview?.name) {
                    m.set(nodeData, 'objectview', { ...(nodeData.objectview || {}), ...incomingNode.objectview });
                  }
                }
              }
            });
          }, 'apply live label and visual property changes');
        } catch (err) {
          console.error('Error applying visual updates:', err);
        }
      } else {
      if (debug) console.log('[COMPONENT-UPDATE] Structural change OR no diagram - running MERGE');
      const mergedNodes = mergeIncomingNodeDataWithLocalState(
          this.props.nodeDataArray,
          this.state.nodeDataArray,
          diagram
        );
      if (debug) console.log('[COMPONENT-UPDATE] Merge complete, merged count:', mergedNodes?.length);
      nextState.nodeDataArray = normalizeNodeCategoryData(mergedNodes);
      shouldSyncFromProps = true;
      }
    }
    if (this.props.linkDataArray !== prevProps.linkDataArray) {
      // Apply visual property changes to links even if no structural change
      if (diagram) {
        try {
          const incomingLinks = this.props.linkDataArray || [];
          const currentLinks = this.state.linkDataArray || [];
          const visualProps = ['strokecolor', 'strokewidth'];

          diagram.model.commit((m: any) => {
            incomingLinks.forEach((incomingLink: any) => {
              if (!incomingLink || !incomingLink.key) return;
              const currentLink = currentLinks.find((l: any) =>
                l?.key === incomingLink.key ||
                l?.id === incomingLink.id ||
                l?.relviewRef === incomingLink.relviewRef
              );

              // Check if any visual properties changed
              const hasVisualChange = visualProps.some(prop =>
                incomingLink[prop] !== undefined &&
                incomingLink[prop] !== currentLink?.[prop]
              );

              if (hasVisualChange) {
                const linkData = m.findLinkDataForKey(incomingLink.key);
                if (linkData) {
                  visualProps.forEach(prop => {
                    if (incomingLink[prop] !== undefined && incomingLink[prop] !== currentLink?.[prop]) {
                      m.set(linkData, prop, incomingLink[prop]);
                    }
                  });
                }
              }
            });
          }, 'apply link visual property changes');
        } catch (err) {
          console.error('Error applying link visual updates:', err);
        }
      }

      // Parent persistence is intentionally one step behind LinkDrawn while
      // the type chooser is open. Keep the local array containing the pending
      // link until accept/cancel resolves it.
      nextState.linkDataArray = isChoosingRelationshipType
        ? this.state.linkDataArray
        : mergeIncomingLinkDataWithLocalState(
            this.props.linkDataArray,
            this.state.linkDataArray
          );
      shouldSyncFromProps = true;
    }
    if (metisChanged) {
      // Check if there are active position locks - if so, defer myMetis update
      const now = Date.now();
      let hasActiveLocks = false;
      globalLockMovedNodeLocByKey.forEach((lockInfo) => {
        if (lockInfo.until > now) hasActiveLocks = true;
      });

      if (hasActiveLocks) {
        console.log('[METIS-UPDATE-SUPPRESSED] Active locks present, deferring myMetis update');
        // Don't update myMetis while positions are locked
        // The locks will expire and positions will be persisted to Redux already
        return;
      }

      nextState.myMetis = this.props.myMetis;
      shouldSyncFromProps = true;
    }
    if (focusModelChanged || focusModelviewChanged) {
      nextState.phFocus = this.props.phFocus;
      shouldSyncFromProps = true;
    }
    if (shouldSyncFromProps) {
      const activeTool = diagram?.currentTool;
      const suppressPropSyncUntil = Number((diagram as any)?.__suppressPropSyncUntil || 0);
      const suppressPropSync =
        (activeTool instanceof go.DraggingTool && activeTool.isActive === true) ||
        suppressPropSyncUntil > Date.now();
      if (suppressPropSync) {
        return;
      }
    }
    if (shouldSyncFromProps) {
      nextState.skipsDiagramUpdate = isChoosingRelationshipType;
      this.setState(nextState);
      // Auto-layout metamodel when nodeDataArray changes and all nodes are unpositioned
      const incomingNodes = this.props.nodeDataArray;
      if (
        Array.isArray(incomingNodes) &&
        incomingNodes.length > 1 &&
        incomingNodes.some((n) => n?.objecttype) &&
        incomingNodes.every((n) => !n?.loc)
      ) {
        setTimeout(() => this._applyMetamodelAutoLayoutIfNeeded(this._ownDiagram), 200);
      }
      return;
    }
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
    const focusObjectId = this.props?.phFocus?.focusObject?.id || "";
    const focusObjectviewId = this.props?.phFocus?.focusObjectview?.id || "";
    syncFocusedObjectPeerFlags(this.props?.myMetis?.myDiagram, focusObjectId, focusObjectviewId);
  }

  public handleOpenModal = (node: any, modalContext: any) => {
    const isRelationshipTypeChooser =
      modalContext?.what === 'selectDropdown' &&
      modalContext?.case === 'Create Relationship';
    const provisionalLinkData = isRelationshipTypeChooser
      ? modalContext?.context?.gjsData
      : null;
    this.setState({
      selectedData: node,
      modalContext: modalContext,
      selectedOption: null,
      showModal: true,
      skipsDiagramUpdate: isRelationshipTypeChooser ? true : this.state.skipsDiagramUpdate
    }, () => {
      // Opening the chooser must not replace React's model state with a live
      // GoJS snapshot (that prevented the modal from opening). If a render did
      // remove the provisional link, restore just that link after the modal is
      // mounted and keep it until accept/cancel handles it.
      if (!isRelationshipTypeChooser || !provisionalLinkData) return;
      const diagram = modalContext?.myDiagram || modalContext?.context?.myDiagram;
      if (!diagram?.model) return;
      const key = provisionalLinkData.key;
      const liveLink = key ? diagram.findLinkForKey(key) : null;
      if (!liveLink) {
        try { diagram.model.addLinkData(provisionalLinkData); } catch (_) {}
      }
      try { diagram.requestUpdate(); } catch (_) {}
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
    // Keep the chosen type in React state as well as the legacy mutable modal
    // context. This makes Done deterministic across intervening Redux renders.
    this.setState({
      selectedOption: selected,
      modalContext: { ...modalContext },
      skipsDiagramUpdate: true,
    });
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
      this.setState({ showModal: false, selectedData: null, modalContext: null, skipsDiagramUpdate: false });
      return;
    }
    const props = this.props;
    let typename = this.state.selectedOption?.value || modalContext.selected?.value;
    if (!typename) typename = modalContext.typename;
    if (debug) console.log('113 typename: ', typename);
    if (debug) console.log('122 modalContext', modalContext);
    const previewKey = data?.key;
    const previewData = data ? { ...data } : data;
    if (previewKey) {
      try {
        const previewLink = myDiagram.findLinkForKey(previewKey);
        if (previewLink?.data) {
          myDiagram.model.removeLinkData(previewLink.data);
        } else if (data) {
          myDiagram.model.removeLinkData(data);
        }
      } catch (_) {}
    }
    if (
      modalContext?.what === 'selectDropdown' &&
      modalContext?.case === 'Create Relationship' &&
      !typename
    ) {
      try { myDiagram?.clearSelection?.(); } catch (_) {}
      this.setState({ showModal: false, selectedData: null, modalContext: null, skipsDiagramUpdate: false });
      return;
    }
    const args = {
      data: previewData,
      metamodel: modalContext.myMetamodel,
      typename: typename,
      reltype: modalContext.relshiptype,
      fromType: modalContext.fromType,
      toType: modalContext.toType,
      nodeFrom: modalContext.nodeFrom,
      nodeTo: modalContext.nodeTo,
      fromPort: data.fromPort,
      toPort: data.toPort,
      context: modalContext.context
    }
    if (debug) console.log('128 args', args);
    const createdRelview = uic.createRelshipCallback(args);
    try {
      const nextKey = createdRelview?.id;
      if (nextKey) {
        const rerouteFinalLink = () => {
          const nextLink = myDiagram.findLinkForKey(nextKey);
          if (!nextLink) return;
          const nextRouting = getDefaultRoutingForRelshipType(
            typename,
            createdRelview?.routing || createdRelview?.typeview?.routing || "Normal"
          );
          const nextCurve = createdRelview?.curve || createdRelview?.typeview?.linkcurve || "None";
          const nextCorner = createdRelview?.corner ?? createdRelview?.typeview?.corner ?? 10;
          try { myDiagram.clearSelection(); } catch (_) {}
          try { myDiagram.model.setDataProperty(nextLink.data, "template", "linkTemplate1"); } catch (_) {}
          try { myDiagram.model.setDataProperty(nextLink.data, "routing", nextRouting); } catch (_) {}
          try { myDiagram.model.setDataProperty(nextLink.data, "curve", nextCurve); } catch (_) {}
          try { myDiagram.model.setDataProperty(nextLink.data, "corner", nextCorner); } catch (_) {}
          try { myDiagram.model.setDataProperty(nextLink.data, "points", []); } catch (_) {}
          try { nextLink.points = new go.List<go.Point>(); } catch (_) {}
          try { nextLink.invalidateRoute(); } catch (_) {}
          try { nextLink.updateRoute(); } catch (_) {}
          try { nextLink.updateTargetBindings(); } catch (_) {}
          try { myDiagram.layoutDiagram(true); } catch (_) {}
          try { myDiagram.requestUpdate(); } catch (_) {}
          try { myDiagram.select(nextLink); } catch (_) {}
        };
        rerouteFinalLink();
        setTimeout(rerouteFinalLink, 0);
        setTimeout(rerouteFinalLink, 50);
      }
      try { myDiagram.layoutDiagram(true); } catch (_) {}
      try { myDiagram.requestUpdate(); } catch (_) {}
    } catch (_) {}
    const completedLinkDataArray = Array.isArray((myDiagram?.model as any)?.linkDataArray)
      ? [...(myDiagram.model as any).linkDataArray]
      : this.state.linkDataArray;
    this.setState({
      showModal: false,
      selectedData: null,
      selectedOption: null,
      modalContext: null,
      linkDataArray: normalizeLinkPortData(completedLinkDataArray),
      skipsDiagramUpdate: true,
    }, () => {
      // Let the completed GoJS transaction and its structural model-change
      // event settle before parent reconciliation is allowed again.
      setTimeout(() => this.setState({ skipsDiagramUpdate: false }), 0);
    });
  }

  /**
   * Handle GoJS model changes, which output an object of data changes via Model.toIncrementalData.
   * This method should iterate over those changes and update state to keep in sync with the GoJS model.
   * This can be done via setState in React or another preferred state management method.
   * @param obj a JSON-formatted string
   */
  public handleModelChange(obj: go.IncrementalData) {
    const insertedNodeKeys = obj.insertedNodeKeys;
    const modifiedNodeData = (obj as any).modifiedNodeData;
    const removedNodeKeys = obj.removedNodeKeys;
    const insertedLinkKeys = obj.insertedLinkKeys;
    const modifiedLinkData = obj.modifiedLinkData;
    const removedLinkKeys = obj.removedLinkKeys;
    const modifiedModelData = obj.modelData;
    const diagram = this.state?.myMetis?.myDiagram;
    const activeTool = diagram?.currentTool;
    const isActiveDrag =
      activeTool instanceof go.DraggingTool &&
      activeTool.isActive === true;
    const isActiveLinkReshape =
      activeTool instanceof go.LinkReshapingTool &&
      activeTool.isActive === true;
    const isActiveRelink =
      activeTool instanceof go.RelinkingTool &&
      activeTool.isActive === true;
    const suppressNodeModelSyncUntil = Number((diagram as any)?.__suppressNodeModelSyncUntil || 0);
    const suppressNodeModelSync = suppressNodeModelSyncUntil > Date.now();
    const hasMeaningfulModelDataChanges =
      !!modifiedModelData &&
      typeof modifiedModelData === 'object' &&
      Object.keys(modifiedModelData).length > 0;
    const hasStructuralModelChanges =
      (Array.isArray(insertedNodeKeys) && insertedNodeKeys.length > 0) ||
      (Array.isArray(removedNodeKeys) && removedNodeKeys.length > 0) ||
      (Array.isArray(insertedLinkKeys) && insertedLinkKeys.length > 0) ||
      (Array.isArray(removedLinkKeys) && removedLinkKeys.length > 0) ||
      hasMeaningfulModelDataChanges;

    if (
      (isActiveDrag || isActiveLinkReshape || isActiveRelink) &&
      !hasStructuralModelChanges
    ) {
      return;
    }

    let nextNodeDataArray = this.state.nodeDataArray;
    let nextLinkDataArray = this.state.linkDataArray;
    let shouldUpdate = false;

    // Keep GoJS as the source of truth for ordinary model mutations such as drag
    // location/size/group updates. Feeding those changes back into React state can
    // cause ReactDiagram to re-drive the live diagram and make dragging appear to
    // advance in delayed steps. Structural changes are still mirrored below.
    const hasStructuralNodeChanges =
      (Array.isArray(insertedNodeKeys) && insertedNodeKeys.length > 0) ||
      (Array.isArray(removedNodeKeys) && removedNodeKeys.length > 0);
    const hasStructuralLinkChanges =
      (Array.isArray(insertedLinkKeys) && insertedLinkKeys.length > 0) ||
      (Array.isArray(removedLinkKeys) && removedLinkKeys.length > 0);

    if (hasStructuralNodeChanges && Array.isArray((diagram?.model as any)?.nodeDataArray)) {
      nextNodeDataArray = [...(diagram.model as any).nodeDataArray];
      shouldUpdate = true;
    }

    if (!isActiveDrag && !suppressNodeModelSync && Array.isArray(modifiedNodeData) && modifiedNodeData.length > 0) {
      const skipPostPasteNodeSyncKeys: Set<string> | undefined = (diagram as any)?.__skipNextPostPasteNodeSyncKeys;
      const preserveByKey: Map<string, number> | undefined = (diagram as any)?.__preserveIncomingNodeStateByKey;
      const now = Date.now();
      const nodeMap = new Map((nextNodeDataArray || []).map((node: any) => [node?.key, node]));
      modifiedNodeData.forEach((node: any) => {
        if (!node?.key) return;
        const liveNodeForPatch = findLiveNodeByAliases(diagram, node);
        if (liveNodeForPatch) {
          node = {
            ...node,
            loc: `${liveNodeForPatch.location.x} ${liveNodeForPatch.location.y}`,
            group: liveNodeForPatch?.data?.group ?? node.group,
            scale: liveNodeForPatch?.data?.scale ?? node.scale,
            scale1: liveNodeForPatch?.data?.scale1 ?? node.scale1,
          };
        }
        const nodeKey = String(node.key);
        if (skipPostPasteNodeSyncKeys?.has(nodeKey)) {
          skipPostPasteNodeSyncKeys.delete(nodeKey);
          if (skipPostPasteNodeSyncKeys.size === 0) {
            try { delete (diagram as any).__skipNextPostPasteNodeSyncKeys; } catch (_) { }
          }
          return;
        }
        if (preserveByKey instanceof Map) {
          const nodeAliases = getNodeIdentityAliases(node);
          let preserveUntil = 0;
          for (let i = 0; i < nodeAliases.length; i++) {
            const candidate = Number(preserveByKey.get(nodeAliases[i]) || 0);
            if (candidate > preserveUntil) preserveUntil = candidate;
          }
          if (preserveUntil > now) {
            const liveNode = findLiveNodeByAliases(diagram, node);
            if (liveNode) {
              const liveLoc = `${liveNode.location.x} ${liveNode.location.y}`;
              node = {
                ...node,
                loc: liveLoc,
                group: liveNode?.data?.group ?? node.group,
                scale: liveNode?.data?.scale ?? node.scale,
                scale1: liveNode?.data?.scale1 ?? node.scale1,
              };
            }
          } else {
            nodeAliases.forEach((id) => {
              if (preserveByKey.has(id) && Number(preserveByKey.get(id) || 0) <= now) {
                preserveByKey.delete(id);
              }
            });
          }
        }
        const prev = nodeMap.get(node.key) || {};
        nodeMap.set(node.key, { ...prev, ...node });
      });
      nextNodeDataArray = Array.from(nodeMap.values());
      shouldUpdate = true;
    }

    if (hasStructuralLinkChanges && Array.isArray((diagram?.model as any)?.linkDataArray)) {
      nextLinkDataArray = [...(diagram.model as any).linkDataArray];
      shouldUpdate = true;
    }

    if (!isActiveDrag && !isActiveLinkReshape && !isActiveRelink && Array.isArray(modifiedLinkData) && modifiedLinkData.length > 0) {
      const linkMap = new Map((nextLinkDataArray || []).map((link: any) => [link?.key, link]));
      modifiedLinkData.forEach((link: any) => {
        if (!link?.key) return;
        const normalizedPoints = normalizeLinkPoints(link.points);
        const hasManualPoints = Array.isArray(normalizedPoints) && normalizedPoints.length >= 4;
        // Manual link paths are persisted through relshipview updates and should not be
        // continuously re-driven through React state on incidental link mutations such as selection.
        if (hasManualPoints) return;
        const prev = linkMap.get(link.key) || {};
        const sanitizedLink = sanitizeModifiedLinkDataForReact(link);
        linkMap.set(link.key, { ...prev, ...sanitizedLink });
      });
      nextLinkDataArray = Array.from(linkMap.values());
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      this.setState({
        nodeDataArray: normalizeNodeCategoryData(nextNodeDataArray),
        linkDataArray: normalizeLinkPortData(nextLinkDataArray),
        skipsDiagramUpdate: true,
      });
    }
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
    if (!goModel?.links || !key) {
      return null;
    }
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
  _applyMetamodelAutoLayoutIfNeeded(diagram) {
    if (!(diagram instanceof go.Diagram)) return;
    const myMetis = this.state?.myMetis;
    // Only auto-layout when all nodes have no saved position (stacked at origin)
    let count = 0;
    let allAtOrigin = true;
    for (let it = diagram.nodes.iterator; it.next();) {
      count++;
      const loc = it.value.data?.loc;
      if (loc && loc !== '') { allAtOrigin = false; break; }
    }
    if (!allAtOrigin || count <= 1) return;
    const preferredLayout = myMetis?.currentMetamodel?.layout || 'LayeredDigraph';
    switch (preferredLayout) {
      case 'Circular':
        diagram.layout = new go.CircularLayout({ isInitial: false, isOngoing: false });
        break;
      case 'Grid':
        diagram.layout = new go.GridLayout({ isInitial: false, isOngoing: false });
        break;
      case 'Tree':
        diagram.layout = new go.TreeLayout({ isInitial: false, isOngoing: false });
        break;
      case 'ForceDirected':
        diagram.layout = new go.ForceDirectedLayout({ isInitial: false, isOngoing: false });
        break;
      case 'Manual': {
        const layout = diagram.layout;
        if (layout) {
          layout.isInitial = false;
          layout.isOngoing = false;
        }
        break;
      }
      case 'LayeredDigraph':
      default:
        diagram.layout = new go.LayeredDigraphLayout({
          isInitial: false,
          isOngoing: false,
          direction: 0,
          layerSpacing: 80,
          columnSpacing: 40,
          setsPortSpots: false,
        });
        break;
    }
    diagram.layoutDiagram(true);
    diagram.zoomToFit();
    // Persist the computed positions to objtypegeos so parent re-renders don't reset the layout
    this._saveMetamodelAutoLayoutPositions(diagram);
  }

  _saveMetamodelAutoLayoutPositions(diagram) {
    const myMetis = this.state?.myMetis;
    const dispatch = this.state?.dispatch;
    if (!myMetis || !dispatch) return;
    const myMetamodel = myMetis.currentMetamodel;
    if (!myMetamodel) return;
    let updatedAnyGeo = false;
    for (let it = diagram.nodes.iterator; it.next();) {
      const node = it.value;
      const data = node.data;
      const objtype = data?.objecttype;
      if (!objtype) continue;
      // Prefer data.loc (two-way binding), fall back to live location
      const pt = node.location;
      const loc = (data.loc && data.loc !== '')
        ? data.loc
        : `${Math.round(pt.x)} ${Math.round(pt.y)}`;
      if (!loc) continue;
      let geo = myMetamodel.findObjtypeGeoByType(objtype);
      if (!geo) {
        geo = new akm.cxObjtypeGeo(utils.createGuid(), myMetamodel, objtype, loc, '');
        myMetamodel.addObjtypeGeo(geo);
        myMetis.addObjtypeGeo(geo);
      } else {
        geo.loc = loc;
      }
      const jsnGeo = new jsn.jsnObjectTypegeo(geo);
      const geoData = JSON.parse(JSON.stringify(jsnGeo));
      dispatch({ type: 'UPDATE_OBJECTTYPEGEOS_PROPERTIES', data: geoData });
      updatedAnyGeo = true;
    }
    if (updatedAnyGeo) {
      try {
        const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
        let data = { metis: jsnMetis };
        data = JSON.parse(JSON.stringify(data));
        dispatch({ type: 'LOAD_TOSTORE_PHDATA', data });
      } catch (_) {
      }
    }
  }

  public handleDiagramEvent(e: go.DiagramEvent) {
    const dispatch = this.state.dispatch;
    const name = e.name;
    const myDiagram = e.diagram;
    // Capture this GoJSApp's own diagram reference (used for auto-layout)
    if (!this._ownDiagram && myDiagram) this._ownDiagram = myDiagram;
    // Auto-layout metamodel on first diagram load when no positions are saved
    if (name === 'InitialLayoutCompleted') {
      this._applyMetamodelAutoLayoutIfNeeded(myDiagram);
    }
    const myMetis = this.state.myMetis;
    myMetis.relinked = false;
    const myModel = myMetis?.findModel(this.state.phFocus?.focusModel?.id);
    let myModelview = myMetis?.findModelView(this.state.phFocus?.focusModelview?.id);
    if (!myModelview) myModelview = myMetis?.currentModelview;
    const myMetamodel = myModel?.getMetamodel();
    let myGoModel: gjs.goModel = this.state.myMetis.gojsModel;
    if (!myGoModel && myModelview) {
      myGoModel = new gjs.goModel(myModelview.id, "myModel", myModelview);
      myMetis.setGojsModel(myGoModel);
    }
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
      "myGoModel": myGoModel,
      "myGoMetamodel": (myDiagram as any)?.myGoMetamodel || null,
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
      const poolNode = myDiagram.findNodeForKey(poolKey);
      let poolObjview = myMetis.findObjectView(poolKey);
      if (!poolObjview) poolObjview = myModelview.findObjectView(poolKey);
      if (!poolObjview) {
        poolObjview = poolNode?.data?.objectview || null;
      }
      if (poolObjview && poolNode?.data) {
        if (typeof poolNode.data.loc === 'string') {
          poolObjview.loc = poolNode.data.loc;
        }
        if (typeof poolNode.data.size === 'string') {
          poolObjview.size = poolNode.data.size;
        }
        if (typeof poolNode.data.group === 'string') {
          poolObjview.group = poolNode.data.group;
        }
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
    const syncPoolLaneWidthsToPool = (poolKey: string) => {
      if (!poolKey) return;
      const poolNode = myDiagram.findNodeForKey(poolKey);
      if (!(poolNode instanceof go.Group)) return;
      const resolvePoolLeftHeaderReserve = (group: go.Group | null | undefined): number => {
        if (!(group instanceof go.Group)) return 34;
        try {
          const poolHeader = group.findObject("POOL_HEADER_STRIP");
          const poolHeaderWidth = poolHeader?.actualBounds?.width;
          if (typeof poolHeaderWidth === "number" && Number.isFinite(poolHeaderWidth) && poolHeaderWidth > 0) {
            return poolHeaderWidth;
          }
        } catch (_) {
        }
        let maxWidth = 0;
        const candidateNames = [
          'POOL_HEADER_STRIP',
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
            if (bounds?.width) maxWidth = Math.max(maxWidth, bounds.width);
          } catch (_) {
          }
        }
        const d: any = group.data;
        const dataWidth = [d?.leftHeaderWidth, d?.headerWidth, d?.poolHeaderWidth]
          .find((value) => typeof value === 'number' && !Number.isNaN(value)) || 0;
        return Math.max(maxWidth, dataWidth, 34);
      };
      const poolSize = parseSizeString(poolNode.data?.size);
      const poolWidth = Number(poolSize?.width) || Number(poolNode.findObject("POOL_SHAPE")?.actualBounds?.width) || 0;
      if (!Number.isFinite(poolWidth) || poolWidth <= 0) return;
      const poolLeftReserve = resolvePoolLeftHeaderReserve(poolNode);
      const lanePaddingLeft = 0;
      const lanePaddingRight = 0;
      const laneRightVisualInset = 0;
      const finalLaneWidth = Math.max(
        poolWidth - poolLeftReserve - lanePaddingLeft - lanePaddingRight - laneRightVisualInset,
        120
      );
      const candidateLanes: go.Group[] = [];
      const seenLaneKeys = new Set<string>();
      const poolBounds = poolNode.actualBounds;
      myDiagram.nodes.each((part: go.Part) => {
        if (!(part instanceof go.Group)) return;
        const c = String(part.data?.category || part.data?.template || part.category || "");
        if (!(c === "Lane" || c === "Lane_w_handles")) return;
        const laneKey = String(part.data?.key || part.key || "");
        if (!laneKey || seenLaneKeys.has(laneKey)) return;
        const groupedToPool = String(part.data?.group || "") === String(poolKey);
        const containedByPool = part.containingGroup === poolNode;
        const overlapsPool = !!poolBounds?.intersectsRect?.(part.actualBounds);
        if (!(groupedToPool || containedByPool || overlapsPool)) return;
        seenLaneKeys.add(laneKey);
        candidateLanes.push(part);
      });
      candidateLanes.forEach((part) => {
        const laneHeader = part.findObject("LANE_HEADER_STRIP") as go.GraphObject | null;
        const laneHeaderWidth =
          (typeof laneHeader?.actualBounds?.width === "number" && Number.isFinite(laneHeader.actualBounds.width) && laneHeader.actualBounds.width > 0)
            ? laneHeader.actualBounds.width
            : 36;
        const laneBodyWidth = Math.max(20, finalLaneWidth - laneHeaderWidth);
        const laneMain = part.findObject("LANE_MAIN") as go.GraphObject | null;
        const laneMainShape = part.findObject("LANE_MAIN_SHAPE") as go.GraphObject | null;
        const laneBodyPanel = part.findObject("BODY") as go.GraphObject | null;
        const laneBody = part.findObject("LANE_BODY_SHAPE") as go.GraphObject | null;
        const laneHeight = parseSizeString(part.data?.size)?.height || part.actualBounds.height || 260;
        const resizeObject = part.resizeObject || part.placeholder || part;
        if (resizeObject) {
          (resizeObject as any).desiredSize = new go.Size(finalLaneWidth, laneHeight);
        }
        if (laneMain) {
          (laneMain as any).desiredSize = new go.Size(finalLaneWidth, laneHeight);
          (laneMain as any).width = finalLaneWidth;
          (laneMain as any).height = laneHeight;
        }
        if (laneMainShape) {
          (laneMainShape as any).desiredSize = new go.Size(finalLaneWidth, laneHeight);
          (laneMainShape as any).width = finalLaneWidth;
          (laneMainShape as any).height = laneHeight;
        }
        if (laneBodyPanel) {
          (laneBodyPanel as any).desiredSize = new go.Size(laneBodyWidth, laneHeight);
          (laneBodyPanel as any).width = laneBodyWidth;
          (laneBodyPanel as any).height = laneHeight;
        }
        if (laneBody) {
          (laneBody as any).desiredSize = new go.Size(laneBodyWidth, laneHeight);
          (laneBody as any).width = laneBodyWidth;
          (laneBody as any).height = laneHeight;
        }
        try { part.desiredSize = new go.Size(finalLaneWidth, laneHeight); } catch (_) { }
        if (part.data) {
          myDiagram.model.setDataProperty(part.data, "size", `${laneBodyWidth} ${laneHeight}`);
          try { myDiagram.model.updateTargetBindings(part.data); } catch (_) { }
        }
        const laneObjview = myModelview.findObjectView(part.data?.key);
        if (laneObjview) {
          laneObjview.size = `${laneBodyWidth} ${laneHeight}`;
          const payload = JSON.parse(JSON.stringify(new jsn.jsnObjectView(laneObjview)));
          myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: payload });
        }
        try { part.updateTargetBindings(); } catch (_) { }
        try { part.ensureBounds(); } catch (_) { }
      });
      try { myDiagram.updateAllTargetBindings("size"); } catch (_) { }
      try { myDiagram.requestUpdate(); } catch (_) { }
    };

	    const normalizeSwimlanePool = (poolKey: string) => {
	      if (!poolKey) return;
	      if ((myDiagram as any).__isSwimlaneNormalizeInProgress) return;
	      const poolNode = myDiagram.findNodeForKey(poolKey);
	      if (!(poolNode instanceof go.Group)) return;
      const pdata = poolNode.data;
      const isPool = pdata?.category === "Pool" || pdata?.template === "Pool" || poolNode.category === "Pool";
      if (!isPool) return;

      (myDiagram as any).__isSwimlaneNormalizeInProgress = true;
      try {
        myDiagram.model.startTransaction("normalizeSwimlanePool");
        const isLaneGroup = (part: go.Part | null | undefined): part is go.Group => {
          if (!(part instanceof go.Group)) return false;
          const ldata = part.data;
          const c = String(ldata?.category || "");
          const t = String(ldata?.template || "");
          return (
            c === "Lane" ||
            c === "Lane_w_handles" ||
            c === "Lane9" ||
            c === "Lane9_legacy" ||
            t === "Lane" ||
            t === "Lane_w_handles" ||
            t === "Lane9" ||
            t === "Lane9_legacy" ||
            part.category === "Lane" ||
            part.category === "Lane_w_handles"
          );
        };
        const getLaneInfo = (part: go.Group) => {
          const laneKey = String(part.data?.key || part.key || "");
          if (!laneKey) return null;
          const laneMain = (part.findObject("LANE_MAIN_SHAPE") || part.findObject("LANE_MAIN")) as go.GraphObject | null;
          const laneBody = part.findObject("LANE_BODY_SHAPE") as go.GraphObject | null;
          const mainBounds = laneMain ? laneMain.getDocumentBounds() : part.actualBounds;
          const bodyBounds = laneBody ? laneBody.getDocumentBounds() : null;
          const area = Math.max(1, mainBounds.width * mainBounds.height);
          return { key: laneKey, lane: part, mainBounds, bodyBounds, area };
        };
        const horizontalAlignmentScore = (a: go.Rect, b: go.Rect): number => {
          const overlapLeft = Math.max(a.x, b.x);
          const overlapRight = Math.min(a.right, b.right);
          const overlap = Math.max(0, overlapRight - overlapLeft);
          const baseline = Math.max(1, Math.min(a.width, b.width));
          const xDelta = Math.abs(a.x - b.x);
          return Math.max(overlap / baseline, xDelta <= 8 ? 1 : 0);
        };
        const isVerticallyAdjacent = (candidate: go.Rect, existing: go.Rect): boolean => {
          const gapAbove = Math.abs(candidate.bottom - existing.y);
          const gapBelow = Math.abs(existing.bottom - candidate.y);
          return gapAbove <= 12 || gapBelow <= 12;
        };

        // Precompute lane structural/body bounds so we can fix mis-parented nodes that
        // visually sit in a Lane but are grouped directly to the Pool.
        const laneInfos: Array<{
          key: string;
          lane: go.Group;
          mainBounds: go.Rect | null;
          bodyBounds: go.Rect | null;
          area: number;
        }> = [];
        const seenLaneKeys = new Set<string>();
        const registerLaneInfo = (part: go.Group) => {
          const info = getLaneInfo(part);
          if (!info || seenLaneKeys.has(info.key)) return;
          laneInfos.push(info);
          seenLaneKeys.add(info.key);
        };
        poolNode.memberParts.each((part: go.Part) => {
          if (!isLaneGroup(part)) return;
          registerLaneInfo(part);
        });

        if (laneInfos.length > 0) {
          let expanded = true;
          while (expanded) {
            expanded = false;
            myDiagram.nodes.each((part: go.Part) => {
              if (!isLaneGroup(part)) return;
              const info = getLaneInfo(part);
              if (!info || seenLaneKeys.has(info.key) || !info.mainBounds) return;
              const groupedToPool = String(part.data?.group || "") === poolKey;
              const containedByPool = part.containingGroup === poolNode;
              const matchesSeedLane = laneInfos.some((existing) => {
                if (!existing.mainBounds) return false;
                return (
                  horizontalAlignmentScore(info.mainBounds!, existing.mainBounds) >= 0.85 &&
                  isVerticallyAdjacent(info.mainBounds!, existing.mainBounds)
                );
              });
              if (!(groupedToPool || containedByPool || matchesSeedLane)) return;
              registerLaneInfo(part);
              expanded = true;
            });
          }
        }

        laneInfos.forEach((info) => {
          const part = info.lane;
          const laneKey = info.key;
          const bodyBounds = info.bodyBounds;
          if (poolKey && part.data?.group !== poolKey) {
            if (typeof (myDiagram.model as any)?.setGroupKeyForNodeData === "function") {
              (myDiagram.model as any).setGroupKeyForNodeData(part.data, poolKey);
            } else {
              myDiagram.model.setDataProperty(part.data, "group", poolKey);
            }
          }

          part.memberParts.each((mp: go.Part) => {
            if (!(mp instanceof go.Node) || mp instanceof go.Group) return;
            if (!mp.data) return;

            // Keep membership explicit: nodes belong to their Lane, never directly to the Pool.
            if (typeof mp.data.group === "string" && mp.data.group !== laneKey) {
              if (typeof (myDiagram.model as any)?.setGroupKeyForNodeData === "function") {
                (myDiagram.model as any).setGroupKeyForNodeData(mp.data, laneKey);
              } else {
                myDiagram.model.setDataProperty(mp.data, "group", laneKey);
              }
            }

            // Ensure the model loc matches what the user sees.
            const locStr = `${mp.location.x} ${mp.location.y}`;
            myDiagram.model.setDataProperty(mp.data, "loc", locStr);

            // Safety clamp: if a node ended up outside its lane body due to stale loc or relayout timing,
            // move it back inside so subsequent drags are constrained correctly.
            if (bodyBounds) {
              const b = mp.actualBounds;
              if (!bodyBounds.containsRect(b)) {
                const x = Math.max(bodyBounds.x + 2, Math.min(b.x, bodyBounds.right - b.width - 2));
                const y = Math.max(bodyBounds.y + 2, Math.min(b.y, bodyBounds.bottom - b.height - 2));
                mp.moveTo(x, y);
                myDiagram.model.setDataProperty(mp.data, "loc", `${mp.location.x} ${mp.location.y}`);
              }
            }
          });
        });

        // Fix nodes that are direct Pool members but clearly inside a Lane: assign them to the smallest
        // containing lane (usually the row they are in), then clamp into the lane body.
	        if (laneInfos.length > 0) {
          // Sort smallest-first to pick the most specific lane if bounds overlap.
          laneInfos.sort((a, b) => a.area - b.area);
          poolNode.memberParts.each((part: go.Part) => {
            if (!(part instanceof go.Node) || part instanceof go.Group) return;
            const d: any = part.data;
            if (!d) return;
            const currentGroup = typeof d.group === "string" ? d.group : "";
            if (currentGroup !== poolKey) return; // only repair pool-level members
            const center = part.actualBounds.center;
            let chosen: (typeof laneInfos)[number] | null = null;
            for (let i = 0; i < laneInfos.length; i++) {
              const li = laneInfos[i];
              if (li.mainBounds && li.mainBounds.containsPoint(center)) {
                chosen = li;
                break;
              }
            }
            if (!chosen) return;
            if (typeof (myDiagram.model as any)?.setGroupKeyForNodeData === "function") {
              (myDiagram.model as any).setGroupKeyForNodeData(d, chosen.key);
            } else {
              myDiagram.model.setDataProperty(d, "group", chosen.key);
            }
            myDiagram.model.setDataProperty(d, "loc", `${part.location.x} ${part.location.y}`);
            if (chosen.bodyBounds) {
              const b = part.actualBounds;
              if (!chosen.bodyBounds.containsRect(b)) {
                const x = Math.max(chosen.bodyBounds.x + 2, Math.min(b.x, chosen.bodyBounds.right - b.width - 2));
                const y = Math.max(chosen.bodyBounds.y + 2, Math.min(b.y, chosen.bodyBounds.bottom - b.height - 2));
                part.moveTo(x, y);
                myDiagram.model.setDataProperty(d, "loc", `${part.location.x} ${part.location.y}`);
              }
            }
	          });
	        }
	        const normalizedViews = new Set<string>();
	        const dispatchNormalizedObjectView = (part: go.Part | null | undefined) => {
	          if (!(part instanceof go.Node) || !part.data?.key) return;
	          const key = String(part.data.key);
	          if (normalizedViews.has(key)) return;
	          let objview =
	            myModelview.findObjectView(key) ||
	            myMetis.findObjectView(key) ||
	            part.data.objectview;
	          if (!objview) return;
	          if (typeof part.data.loc === "string") objview.loc = part.data.loc;
	          if (typeof part.data.size === "string") objview.size = part.data.size;
	          if (typeof part.data.group === "string") objview.group = part.data.group;
	          const payload = JSON.parse(JSON.stringify(new jsn.jsnObjectView(objview)));
	          myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: payload });
	          normalizedViews.add(key);
	        };
	        dispatchNormalizedObjectView(poolNode);
	        laneInfos.forEach((info) => dispatchNormalizedObjectView(info.lane));
	        poolNode.memberParts.each((part: go.Part) => {
	          if (part instanceof go.Node && !(part instanceof go.Group)) {
	            dispatchNormalizedObjectView(part);
	          }
	        });
	        myDiagram.model.commitTransaction("normalizeSwimlanePool");
	      } finally {
	        (myDiagram as any).__isSwimlaneNormalizeInProgress = false;
	      }
	    };
    const resolveContainingGroup = (nodePart: go.Part): gjs.goObjectNode | null => {
      if (!(nodePart instanceof go.Node) || nodePart instanceof go.Group) return null;
      const nodeBounds = nodePart.actualBounds;
      const nodeCenter = nodeBounds.center;
      const candidates: Array<{ area: number; key: string }> = [];
      myDiagram.nodes.each((part: go.Node) => {
        if (!(part instanceof go.Group)) return;
        if (part === nodePart) return;
        const pdata = part.data;
        const c = String(pdata?.category || "");
        const t = String(pdata?.template || "");
        const isLane = c.startsWith("Lane") || t.startsWith("Lane") || part.category.startsWith("Lane");
        // For containment decisions, consider the whole lane (header strip + body). This prevents
        // nodes dropped near the left edge from being incorrectly parented to the Pool.
        const laneMain = isLane ? (part.findObject("LANE_MAIN_SHAPE") || part.findObject("LANE_MAIN")) : null;
        const probe = (laneMain || part.findObject("SHAPE") || part.findObject("POOL_SHAPE")) as go.GraphObject | null;
        const groupBounds = probe ? probe.getDocumentBounds() : part.actualBounds;
        if (!groupBounds.containsPoint(nodeCenter)) return;
        const area = Math.max(1, groupBounds.width * groupBounds.height);
        const key = String(pdata?.key || "");
        if (key) candidates.push({ area, key });
      });
      if (candidates.length === 0) return null;
      candidates.sort((a, b) => a.area - b.area);
      return myGoModel.findNode(candidates[0].key) || null;
    };

    // When the user Shift-drags across lanes, the intended target is the lane under the mouse on drop.
    // Using nodeCenter can fail when a node straddles a lane border (looks "in" the neighbor lane but
    // center is still in the source lane). This resolves the lane/pool containing a point.
    const getStructuralGroupBounds = (part: go.Group, isLane: boolean): go.Rect => {
      // For lanes, use the lane BODY bounds (not the whole group bounds) so containment is stable and
      // not influenced by member nodes or selection adornments.
      // For pools, use POOL_SHAPE (or fallback to SHAPE) for the same reason.
      if (isLane) {
        const body =
          (part.findObject("LANE_BODY_SHAPE") ||
            part.findObject("BODY")) as go.GraphObject | null;
        if (body) return body.getDocumentBounds();
      }
      const probe = (part.findObject("POOL_SHAPE") || part.findObject("SHAPE")) as go.GraphObject | null;
      return probe ? probe.getDocumentBounds() : part.actualBounds;
    };
    const resolveContainingGroupAtPoint = (pt: go.Point): gjs.goObjectNode | null => {
      const candidates: Array<{ area: number; key: string; isLane: boolean }> = [];
      myDiagram.nodes.each((part: go.Node) => {
        if (!(part instanceof go.Group)) return;
        const pdata = part.data;
        const c = String(pdata?.category || "");
        const t = String(pdata?.template || "");
        const isLane = c.startsWith("Lane") || t.startsWith("Lane") || part.category.startsWith("Lane");
        const groupBounds = getStructuralGroupBounds(part, isLane);
        if (!groupBounds.containsPoint(pt)) return;
        const area = Math.max(1, groupBounds.width * groupBounds.height);
        const key = String(pdata?.key || "");
        if (key) candidates.push({ area, key, isLane });
      });
      if (candidates.length === 0) return null;
      // Prefer lanes over pools when both contain the point.
      candidates.sort((a, b) => {
        if (a.isLane !== b.isLane) return a.isLane ? -1 : 1;
        return a.area - b.area;
      });
      return myGoModel.findNode(candidates[0].key) || null;
    };

    // More robust than point/center containment: pick the lane/group with the largest overlap
    // with the moved node's bounds. This avoids "looks in neighbor lane but still grouped to old lane"
    // when the node straddles the border at drop.
    const resolveContainingGroupByOverlap = (nodePart: go.Part): gjs.goObjectNode | null => {
      if (!(nodePart instanceof go.Node) || nodePart instanceof go.Group) return null;
      const nb = nodePart.actualBounds;
      const candidates: Array<{ overlap: number; area: number; key: string; isLane: boolean }> = [];
      myDiagram.nodes.each((part: go.Node) => {
        if (!(part instanceof go.Group)) return;
        if (part === nodePart) return;
        const pdata = part.data;
        const c = String(pdata?.category || "");
        const t = String(pdata?.template || "");
        const isLane = c.startsWith("Lane") || t.startsWith("Lane") || part.category.startsWith("Lane");
        const gb = getStructuralGroupBounds(part, isLane);
        // NOTE: avoid using Rect.intersectRect here because `actualBounds` can be a frozen/shared Rect
        // in some GoJS builds; intersectRect mutates the Rect instance.
        const ix1 = Math.max(nb.x, gb.x);
        const iy1 = Math.max(nb.y, gb.y);
        const ix2 = Math.min(nb.right, gb.right);
        const iy2 = Math.min(nb.bottom, gb.bottom);
        const overlap = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
        if (overlap <= 0) return;
        const area = Math.max(1, gb.width * gb.height);
        const key = String(pdata?.key || "");
        if (key) candidates.push({ overlap, area, key, isLane });
      });
      if (candidates.length === 0) return null;
      candidates.sort((a, b) => {
        if (a.isLane !== b.isLane) return a.isLane ? -1 : 1;
        if (b.overlap !== a.overlap) return b.overlap - a.overlap;
        return a.area - b.area;
      });
      return myGoModel.findNode(candidates[0].key) || null;
    };

    // Swimlane rule: "contains" membership relationships (Lane -> member) are structural and should
    // remain hidden when the member is actually grouped into that Lane. Some code paths were
    // resetting relview.visible=true after moves; this helper re-applies the hide rule deterministically.
	    const applySwimlaneContainsVisibility = () => {
	      if (!myDiagram) return;

	      const isSwimlaneGroupKey = (k: any): boolean => {
	        if (!k) return false;
	        const n = myDiagram.findNodeForKey(k);
	        const c = String(n?.data?.category || n?.data?.template || n?.category || "");
	        return c === "Pool" || c.startsWith("Lane");
	      };
	      // Only apply this rule in actual swimlane diagrams. In other diagrams (e.g. Metamodelling),
	      // "contains" can be a meaningful relationship that users expect to see.
	      let isSwimlaneDiagram = false;
	      myDiagram.nodes.each((n: go.Node) => {
	        if (isSwimlaneDiagram) return;
	        if (!(n instanceof go.Group)) return;
	        const c = String(n?.data?.category || n?.data?.template || n?.category || "");
	        if (c === "Pool" || c.startsWith("Lane")) isSwimlaneDiagram = true;
	      });
	      if (!isSwimlaneDiagram) return;

	      myDiagram.links.each((l: go.Link) => {
	        const d: any = l.data;
	        if (!d) return;
        const typeName =
          d?.typename ||
          d?.name ||
          d?.relship?.type?.name ||
          d?.relshipview?.relship?.type?.name ||
          "";
	        // Only touch membership links.
	        if (typeName !== constants.types.AKM_CONTAINS) return;

	        const fromKey = d.from;
	        const toKey = d.to;
	        const fromIsSwim = isSwimlaneGroupKey(fromKey);
	        const toIsSwim = isSwimlaneGroupKey(toKey);
	        // In swimlanes, always keep membership links hidden (Pool->Lane and Lane->Member).
	        const hide = fromIsSwim || toIsSwim;
	        if (hide) {
	          // Force-hide at the data level so it stays hidden across refreshes.
	          if (d.visible !== false) myDiagram.model.setDataProperty(d, "visible", false);
	        }
	        l.updateTargetBindings();
	      });
	    };

	    // In metamodelling views, "contains" is often meaningful (Metamodel -> EntityType, etc).
	    // Past swimlane fixes may have persisted `link.data.visible = false` for AKM_CONTAINS links.
	    // Restore those links to visible in Metamodelling mode unless they involve Pool/Lane groups.
	    const restoreMetamodelContainsVisibility = () => {
	      if (!myDiagram) return;
	      if (String((myMetis as any)?.modelType || "") !== "Metamodelling") return;
	      const isSwimlaneNodeKey = (k: any): boolean => {
	        if (!k) return false;
	        const n = myDiagram.findNodeForKey(k);
	        const c = String(n?.data?.category || n?.data?.template || n?.category || "");
	        return c === "Pool" || c.startsWith("Lane");
	      };
	      myDiagram.links.each((l: go.Link) => {
	        const d: any = l.data;
	        if (!d) return;
	        const typeName =
	          d?.typename ||
	          d?.name ||
	          d?.relship?.type?.name ||
	          d?.relshipview?.relship?.type?.name ||
	          "";
	        if (typeName !== constants.types.AKM_CONTAINS) return;
	        if (isSwimlaneNodeKey(d.from) || isSwimlaneNodeKey(d.to)) return;
	        if (d.visible === false) myDiagram.model.setDataProperty(d, "visible", true);
	        l.updateTargetBindings();
	      });
	    };

	    // In Metamodelling views, we want metamodel "contains" to use the template defaults
	    // (straight lines). If routing/curve were previously persisted as "Orthogonal", clear them.
	    const normalizeMetamodelContainsRouting = () => {
	      if (!myDiagram) return;
	      if (String((myMetis as any)?.modelType || "") !== "Metamodelling") return;
	      const isSwimlaneNodeKey = (k: any): boolean => {
	        if (!k) return false;
	        const n = myDiagram.findNodeForKey(k);
	        const c = String(n?.data?.category || n?.data?.template || n?.category || "");
	        return c === "Pool" || c.startsWith("Lane");
	      };
	      myDiagram.links.each((l: go.Link) => {
	        const d: any = l.data;
	        if (!d) return;
	        const typeName =
	          d?.typename ||
	          d?.name ||
	          d?.relship?.type?.name ||
	          d?.relshipview?.relship?.type?.name ||
	          "";
	        if (typeName !== constants.types.AKM_CONTAINS) return;
	        if (isSwimlaneNodeKey(d.from) || isSwimlaneNodeKey(d.to)) return;

	        // Clear default-looking persisted routing so our metamodel defaults can apply.
	        if (typeof d.routing === "string" && d.routing.trim() === "Orthogonal") {
	          myDiagram.model.setDataProperty(d, "routing", "");
	        }
	        if (typeof d.curve === "string" && d.curve.trim() !== "") {
	          myDiagram.model.setDataProperty(d, "curve", "");
	        }
	        if (d.corner != null) {
	          myDiagram.model.setDataProperty(d, "corner", "");
	        }

	        const relview = d.relshipview || myModelview.findRelationshipView(d.key);
	        if (relview) {
	          if (String((relview as any).routing || "").trim() === "Orthogonal") (relview as any).routing = "";
	          if (String((relview as any).curve || "").trim() !== "") (relview as any).curve = "";
	          if ((relview as any).corner != null) (relview as any).corner = "";
	          try {
	            const jsnRelview = new jsn.jsnRelshipView(relview);
	            let rvData: any = jsnRelview;
	            rvData = JSON.parse(JSON.stringify(rvData));
	            myDiagram.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data: rvData });
	          } catch (_) { }
	        }

	        l.updateTargetBindings();
	      });
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
        // Metamodel diagrams often use "contains" as a meaningful relationship that should be shown.
        restoreMetamodelContainsVisibility();
        normalizeMetamodelContainsRouting();
        try {
          const poolKeysToNormalize = new Set<string>();
          myDiagram.nodes.each((part: go.Part) => {
            if (!(part instanceof go.Group)) return;
            if (!isPoolLike(part.data)) return;
            const poolKey = String(part.data?.key || part.key || "");
            if (!poolKey) return;
            poolKeysToNormalize.add(poolKey);
          });
          poolKeysToNormalize.forEach((poolKey) => {
            normalizeSwimlanePool(poolKey);
            const poolPart = myDiagram.findNodeForKey(poolKey);
            if (poolPart instanceof go.Group) {
              relayoutPoolGroupAfterLaneChanges(myDiagram, poolPart);
            }
          });
        } catch (_) {
        }
        const activeFocusModelviewId = this.props?.phFocus?.focusModelview?.id || "";
        const focusObjectViewId = this.props?.phFocus?.focusObjectview?.id || "";
        const shouldApplyRealSelection = Boolean(activeFocusModelviewId) && activeFocusModelviewId === myModelview?.id;
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
            if (shouldApplyRealSelection && objview.id === focusObjectViewId) {
              const node = myGoModel.findNodeByViewId(objview.id);
              if (node) {
                const gjsNode = myDiagram.findNodeForKey(node?.key)
                myDiagram.select(gjsNode);
              }
            }
          }
        }

        if (debug) console.log("End: After Reload:");
        const reloadPoolKeys = new Set<string>();
        for (let it = myDiagram.nodes; it?.next();) {
          const node = it.value;
          if (!(node instanceof go.Group)) continue;
          const data = node.data;
          const category = String(data?.category || data?.template || node.category || "");
          if ((category === "Pool" || category.toLowerCase().includes("pool")) && data?.key) {
            reloadPoolKeys.add(String(data.key));
          }
        }
        if (reloadPoolKeys.size > 0) {
          const scheduledPoolKeys = Array.from(reloadPoolKeys);
          if (!(myDiagram as any).__pendingReloadPoolNormalizeTimer) {
            (myDiagram as any).__pendingReloadPoolNormalizeTimer = setTimeout(() => {
              delete (myDiagram as any).__pendingReloadPoolNormalizeTimer;
              const stablePoolKeys = new Set<string>(scheduledPoolKeys);
              stablePoolKeys.forEach((poolKey) => normalizeSwimlanePool(poolKey));
              try { myDiagram.requestUpdate(); } catch (_) { }
            }, 0);
          }
        }
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
            const category = String(data?.category || data?.template || "");
            if (!(category === "Pool" || category === "Lane" || category === "Lane_w_handles")) {
              node.size = data.size;
            }
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
                // Do not force visible=true here; visibility can be intentionally false (e.g., swimlane contains).
                relview.visible = (relview.visible !== false) && !relview.markedAsDeleted;
                if (relview.visible === false) {
                  linksToRemove.push(link);
                } else {
                  const points = relview.points;
                  if (points?.length == 0) {
                    link.points = [];
                    relview.points = [];
                  }
                }
              }
            }
          }
          for (let i = 0; i < linksToRemove.length; i++) {
            const link = linksToRemove[i];
            myDiagram.remove(link);
          }
        }
        // Re-apply swimlane contains hiding after initial load.
        applySwimlaneContainsVisibility();
        break;
      }
      case 'TextEdited': {
        const editedTextBlock: any = e.subject;
        let editedPortItem: any = null;
        let probe: any = editedTextBlock;
        for (let depth = 0; probe && depth < 8; depth++) {
          const data = probe?.data;
          if (data && (data.id || data.portId) && data.side) {
            editedPortItem = data;
            break;
          }
          probe = probe.panel;
        }
        if (editedPortItem) {
          const nodePart = editedTextBlock?.part as go.Node;
          const nodeData: any = nodePart?.data;
          const objectRef = nodeData?.objRef || nodeData?.object?.id;
          const object = objectRef ? myMetis.findObject(objectRef) : null;
          const nextName = (editedPortItem.name ?? '').toString().trim();
          if (!object || !nextName) break;
          const portId = editedPortItem.id || editedPortItem.portId;
          const currentPort = Array.isArray(object.ports)
            ? object.ports.find((p: any) => (p?.id || p?.portId) === portId)
            : null;
          if (!currentPort) break;
          currentPort.name = nextName;
          try { uit.changePortName(editedTextBlock, nextName, myDiagram); } catch (_) { }
          try {
            const connectedLinks: go.Link[] = [];
            if (nodePart && portId) {
              nodePart.findLinksConnected(String(portId)).each((l: go.Link) => connectedLinks.push(l));
            }
            connectedLinks.forEach((link: go.Link) => {
              try { link.invalidateRoute(); } catch (_) { }
              try {
                if (link.data) {
                  myDiagram.model.setDataProperty(link.data, "points", []);
                }
              } catch (_) { }
              try {
                const relview = link.data?.relshipview || myModelview.findRelationshipView(link.data?.key);
                if (relview) {
                  relview.points = [];
                  const jsnRelview = new jsn.jsnRelshipView(relview);
                  let relData: any = jsnRelview;
                  relData = JSON.parse(JSON.stringify(relData));
                  myDiagram.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data: relData });
                }
              } catch (_) { }
            });
          } catch (_) { }
          try {
            const jsnObj = new jsn.jsnObject(object);
            let data: any = jsnObj;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch?.({ type: 'UPDATE_OBJECT_PROPERTIES', data });
          } catch (_) { }
          myDiagram.requestUpdate();
          break;
        }
        const sel = e.subject.part;
        const gjsData = sel.data;
        let textvalue = gjsData.name;
        if (gjsData.typename === 'Label') {
          textvalue = gjsData.text;
        }
        let field = e.subject.name;
        if (field === "") field = "name";
        // Object type or Object
        if (sel instanceof go.Node) {
          const key: string = gjsData.key;
          let goNode = myGoModel.findNode(key);
          let text: string = textvalue;
          const category: string = gjsData.category;
          const isMetamodelObjectTypeNode =
            myMetis?.modelType === 'Metamodelling' &&
            (!!gjsData.objecttype || !!gjsData.objtypeRef);
          // Object type
          if (category === constants.gojs.C_OBJECTTYPE || isMetamodelObjectTypeNode) {
            if (text === 'Edit name') {
              text = prompt('Enter name');
            }
            if (gjsData) {
              gjsData.name = text;
              uic.updateObjectType(gjsData, field, text, context);
              const objtype = myMetis.findObjectType(gjsData.objecttype?.id || gjsData.objtypeRef);
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
              if (!goNode) {
                goNode = myGoModel.findNodeByViewId(objview.id);
              }
              let obj = objview.object;
              if (obj) {
                if (goNode) {
                  goNode.objRef = obj.id;
                  goNode.text = textvalue;
                  goNode.name = text;
                  obj = uic.updateObject(goNode, field, text, context) || obj;
                } else {
                  obj[field] = text;
                }
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
          const category = gjsData.category;
          // Relationship type
          if (category === constants.gojs.C_RELSHIPTYPE || typename === constants.gojs.C_RELSHIPTYPE) {
            const myLink = this.getLink(context.myGoMetamodel, key) || sel;
            if (myLink) {
              if (text === 'Edit name') {
                text = prompt('Enter name');
                typename = text;
                gjsData.name = text;
              }
              uic.updateRelationshipType(myLink.data || myLink, "name", text, context);
              const reltype =
                myMetis.findRelationshipType(myLink?.reltype?.id || myLink?.data?.reltype?.id || gjsData?.reltype?.id || gjsData?.relshiptype?.id || gjsData?.reltypeRef) ||
                myLink?.reltype ||
                myLink?.data?.reltype ||
                gjsData?.reltype ||
                gjsData?.relshiptype;
              gjsData.name = reltype?.name || text;
              if (reltype) {
                const jsnReltype = new jsn.jsnRelationshipType(reltype, true);
                let data: any = jsnReltype;
                data = JSON.parse(JSON.stringify(data));
                context.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data });
              }
              myDiagram.model?.setDataProperty(gjsData, "name", gjsData.name);
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
        const selectionFirstConstructorName = myDiagram.selection.first().constructor.name;
        console.log("SelectionMoved event, first selected part constructor: %s", selectionFirstConstructorName);
        // Metamodelling: persist dragged objecttype node positions to objtypegeos
        const isMetamodelMove = isMetamodelSelection(myMetis, e.subject);
        console.log("isMetamodelMove: %s", isMetamodelMove);
        if (isMetamodelMove) {
          const currentMetamodel = myMetis.currentMetamodel;
          if (currentMetamodel) {
            let updatedAnyGeo = false;
            for (let it = e.subject?.iterator; it?.next();) {
              const part = it.value;
              if (!(part instanceof go.Node)) continue;
              const data = part.data || {};
              const typeRef =
                data?.objecttype?.id ||
                getNodeTypeRef(part) ||
                data?.objtypeRef ||
                data?.typeRef ||
                undefined;
              const objtype =
                data?.objecttype ||
                (typeRef ? currentMetamodel.findObjectType(typeRef) : null) ||
                (typeRef ? myMetis.findObjectType(typeRef) : null);
              if (!objtype) continue;
              const loc = `${Math.round(part.location.x)} ${Math.round(part.location.y)}`;
              // Update data.loc so GoJS stays in sync
              try { myDiagram.model.setDataProperty(data, 'loc', loc); } catch (_) {}
              let geo = currentMetamodel.findObjtypeGeoByType(objtype);
              if (!geo) {
                geo = new akm.cxObjtypeGeo(utils.createGuid(), currentMetamodel, objtype, loc, '');
                currentMetamodel.addObjtypeGeo(geo);
                myMetis.addObjtypeGeo(geo);
              } else {
                geo.loc = loc;
              }
              const jsnGeo = new jsn.jsnObjectTypegeo(geo);
              const geoData = JSON.parse(JSON.stringify(jsnGeo));
              dispatch({ type: 'UPDATE_OBJECTTYPEGEOS_PROPERTIES', data: geoData });
              updatedAnyGeo = true;
            }
            if (updatedAnyGeo) {
              try {
                const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
                let data = { metis: jsnMetis };
                data = JSON.parse(JSON.stringify(data));
                dispatch({ type: 'LOAD_TOSTORE_PHDATA', data });
              } catch (_) {
              }
            }
          }
          break;
        }
        let myGoModel = context.myGoModel;
        const myModelview = context.myModelview;
        const selectionShiftPressed = Boolean(myDiagram?.lastInput?.shift);
        const dragAllowKeys: Set<string> | undefined = (myDiagram as any)?.__dragAllowReparentKeys;
        const dragAllowGlobal: boolean = !!(myDiagram as any)?.__dragAllowReparent;
        (myDiagram as any).__movedAffectedTopLevelGroupKeys = new Set<string | number>();
        let relshipviews = myModelview.relshipviews;
        myModelview.relshipviews = utils.removeArrayDuplicates(myModelview.relshipviews);
        let objectviews = myModelview.objectviews;
        // Identify selected groups
        const selectedGroupNodes = [];
        let nodes = myGoModel.nodes;
        for (let i = 0; i < nodes.length; i++) {
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
        for (let i = 0; i < selectedGroupNodes.length; i++) {
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
          const dragStartGroupKey =
            typeof it.key?.data?.__dragStartGroup === "string"
              ? String(it.key.data.__dragStartGroup)
              : "";
          const liveContainingGroupKey =
            it.key?.containingGroup instanceof go.Group &&
            it.key.containingGroup.key !== undefined &&
            it.key.containingGroup.key !== null
              ? String(it.key.containingGroup.key)
              : "";
          let groupKey = dragStartGroupKey || liveContainingGroupKey || String(it.key.data.group || objectview.group || "");
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
        const movedSelection = e.subject;
        const movedGroupSelection = e.subject;
        for (let it = movedGroupSelection?.iterator; it?.next();) {
          let n = it.value;
          if (n instanceof go.Link) continue;
          // Group moves are persisted in a dedicated block later; keep this path
          // scoped to regular nodes to avoid accidental group membership rewrites.
          // Use the Part.location, not `data.loc`. After group drags, `data.loc` can lag behind
          // the rendered position and cause membership/loc persistence to drift.
          const loc = `${n.location.x} ${n.location.y}`;
          console.log(`[BUILD-TONODE] key=${n.data.key}, n.location=${loc}, containingGroup=${n.containingGroup ? n.containingGroup.key : 'none'}, data.loc=${n.data.loc}`);
          const goNode = myGoModel.findNode(n.data.key);
          if (!goNode) continue;
          goNode.loc = loc;
          const size = n.actualBounds.width + " " + n.actualBounds.height;
          const currentGroupKey = String(goNode.objectview?.group || goNode.group || n.data.group || "");
          let groupKey = "";
          const nodeCenter = n.actualBounds?.center || null;
          const dropPoint = (myDiagram.lastInput?.documentPoint as go.Point | undefined) || null;
          let group =
            resolveDeepestDropTargetGroup(myDiagram, n, dropPoint) ||
            resolveDeepestDropTargetGroup(myDiagram, n, nodeCenter) ||
            uic.getGroupByLocation(myGoModel, loc, size, goNode); // goNode
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
            const groupPart = myDiagram.findNodeForKey(group.key) as go.Group | null;
            if (!groupAllowsGrab(groupPart, myModelview, myMetis)) {
              group = null;
              groupKey = "";
            } else {
              groupKey = group.key;
            }
          }
          const adoptResolvedContainingGroup =
            Boolean(containingGroupKey) &&
            String(containingGroupKey) !== String(currentGroupKey || "");
          const adoptResolvedVisualGroup =
            !containingGroupKey &&
            Boolean(groupKey) &&
            String(groupKey) !== String(currentGroupKey || "");
          if (!selectionShiftPressed && !adoptResolvedContainingGroup && !adoptResolvedVisualGroup) {
            groupKey = currentGroupKey;
            goNode.group = currentGroupKey;
            goNode.scale = currentGroupKey
              ? getDerivedScaleForGroup(myDiagram.findNodeForKey(currentGroupKey) as go.Group | null)
              : 1.0;
          } else if (!selectionShiftPressed && (adoptResolvedContainingGroup || adoptResolvedVisualGroup)) {
            goNode.group = groupKey;
            goNode.scale = groupKey
              ? getDerivedScaleForGroup(myDiagram.findNodeForKey(groupKey) as go.Group | null)
              : 1.0;
          } else if (!group) {
            goNode.scale = 1.0;
          } else {
            goNode.group = groupKey;
            goNode.scale = getDerivedScaleForGroup(myDiagram.findNodeForKey(groupKey) as go.Group | null);
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
          const reparentAllowedForNode =
            selectionShiftPressed ||
            dragAllowGlobal ||
            !!(n?.data?.key != null && dragAllowKeys?.has(String(n.data.key)));
          if (reparentAllowedForNode && groupKey && (n.data.group !== groupKey)) {
            try {
              myDiagram.model.setDataProperty(n.data, 'loc', loc);
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
              const groupKey = myToNode.n.containingGroup ? myToNode.n.containingGroup.key : 'NONE';
              const groupName = myToNode.n.containingGroup ? myToNode.n.containingGroup.data?.text : 'none';
              console.log(`[NODE-MOVE-MATCH] key=${myToNode.key}, fromLoc=${myFromNode.loc}, toLoc=${myToNode.loc}, group=${groupKey}(${groupName})`);
              const myGoNode = myGoModel.findNode(myToNode.key);
              const myObject: akm.cxObject = myFromNode.object;
              const myObjectview: akm.cxObjectView = myFromNode.objectview;

              if (!myObjectview) {
                console.error(`[NODE-MOVE-ERROR] No objectview for key=${myToNode.key}, skipping`);
                continue;
              }

              myObjectview.loc = myToNode.loc;
              myObjectview.group = myToNode.group;
              myObjectview.scale = myToNode.scale;
              // Move the object
              let goToNode = uic.changeNodeSizeAndPos(myToNode.gjsData, myFromNode.loc, myToNode.loc,
                myGoModel, myDiagram, myMetis, modifiedObjectViews) as gjs.goObjectNode;

              // CRITICAL: Update lock from PRE-DRAG to POST-DRAG position
              // SelectionMoving set lock to protect during drag, now update to final position
              const liveNode = myDiagram.findNodeForKey(myToNode.key);
              const actualLoc = liveNode ? `${liveNode.location.x} ${liveNode.location.y}` : myToNode.loc;
              const liveGroupKey = liveNode?.containingGroup ? liveNode.containingGroup.key : 'NONE';

              console.log(`[NODE-LOCK-UPDATE-END] key=${myToNode.key} group=${liveGroupKey} updating lock from PRE-DRAG to POST-DRAG position: ${actualLoc}`);

              // Use GLOBAL lock maps - survives React re-renders and focus changes
              const preserveIncomingNodeStateByKey = globalPreserveNodeStateByKey;
              const lockMovedNodeLocByKey = globalLockMovedNodeLocByKey;

              const preserveNodeStateUntil = Date.now() + 15000; // 15 seconds - survive focus changes
              const lockNodeLocUntil = Date.now() + 12000; // 12 seconds - protect through multiple operations
              const aliases = [
                myToNode.key,
                myToNode.gjsData?.objviewRef,
                myObjectview?.id,
                myToNode.gjsData?.objRef,
                myObject?.id,
              ].filter((v: any) => v !== undefined && v !== null && String(v).length > 0)
                .map((v: any) => String(v));
              aliases.forEach((id) => preserveIncomingNodeStateByKey.set(id, preserveNodeStateUntil));
              const lockedLoc = actualLoc; // Use the ACTUAL live position, not myToNode.loc
              aliases.forEach((id) => lockMovedNodeLocByKey.set(id, { loc: lockedLoc, until: lockNodeLocUntil }));

              // Debug: verify locks were set
              console.log(`[NODE-LOCK-SET] GLOBAL lock map size:`, lockMovedNodeLocByKey.size, 'Aliases:', aliases);
              console.log(`[NODE-LOCK-VERIFY] Lock entry for key ${myToNode.key}:`, lockMovedNodeLocByKey.get(myToNode.key));

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
              const reparentAllowedForNode =
                selectionShiftPressed ||
                dragAllowGlobal ||
                !!(myToNode.key != null && dragAllowKeys?.has(String(myToNode.key)));
              const movedNodeCenter = myToNode.n.actualBounds?.center || null;
              const movedDropPoint = (myDiagram.lastInput?.documentPoint as go.Point | undefined) || null;
              let goParentGroup = reparentAllowedForNode
                ? (
                  resolveDeepestDropTargetGroup(myDiagram, myToNode.n, movedDropPoint) ||
                  resolveDeepestDropTargetGroup(myDiagram, myToNode.n, movedNodeCenter) ||
                  uic.getGroupByLocation(myGoModel, goToNode.loc, goToNode.size, goToNode)
                )
                : (myToNode.group ? myGoModel.findNode(myToNode.group) as gjs.goObjectNode : null);
              if (!reparentAllowedForNode && myToNode.n?.containingGroup instanceof go.Group) {
                const containingKey = myToNode.n.containingGroup.key;
                if (containingKey) {
                  goParentGroup = myGoModel.findNode(containingKey) as gjs.goObjectNode;
                }
              } else if (goParentGroup) {

                const goParentGroupPart = myDiagram.findNodeForKey(goParentGroup.key) as go.Group | null;
                if (!groupAllowsGrab(goParentGroupPart, myModelview, myMetis)) {
                  goParentGroup = null;
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
                const nextScale = applyDerivedScaleToPart(myDiagram, myToNode.n, diagramGroup, myObjectview, goToNode);
                gjsPart.scale = Number(nextScale);
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

                  // Check if metamodel allows "contains" relationship between these specific object types
                  const parentObjType = parentObj?.type;
                  const childObjType = childObj?.type;
                  const isAllowedByMetamodel =
                    myHasPartReltype &&
                    parentObjType &&
                    childObjType &&
                    myHasPartReltype.isAllowedFromType(parentObjType, true) &&
                    myHasPartReltype.isAllowedToType(childObjType, true);

                  if (!existingRel && isAllowedByMetamodel) {
                    // Create only if it does not already exist AND metamodel allows it.
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
                  } else if (!existingRel && !isAllowedByMetamodel) {
                    console.log(`[CONTAINS-BLOCKED] Metamodel does not allow "contains" from ${parentObjType?.name} to ${childObjType?.name}, skipping auto-creation`);
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
                      const isContainsRel = reltype?.name === constants.types.AKM_CONTAINS;
                      if (isContainsRel) {
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
                      } else {
                        relview.visible = true;
                        const link = myDiagram.findLinkForKey(relview?.id);
                        if (link) {
                          link.visible = true;
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
                    const relship = relview.relship;
                    const isContainsRel = relship?.type?.name === constants.types.AKM_CONTAINS;
                    if (toObjview?.isGroup && isContainsRel) {
                      // Relocate
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
                      lnk.visible = !isContainsRel;
                    }
                    relview.visible = !isContainsRel;
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
                if (reparentAllowedForNode && myToNode.n?.containingGroup instanceof go.Group) {
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
                const scale = applyDerivedScaleToPart(myDiagram, myToNode.n, null, myObjectview, goToNode);
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
                try {
                  myToNode.n?.findLinksConnected()?.each?.((liveLink: go.Link) => {
                    if (!(liveLink instanceof go.Link) || !liveLink.data?.key) return;
                    const liveRelview = myModelview.findRelationshipView(liveLink.data.key);
                    if (liveRelview) {
                      liveRelview.points = [];
                    }
                    try { myDiagram.model.setDataProperty(liveLink.data, "points", []); } catch (_) {
                      try { liveLink.data.points = []; } catch (_err) {}
                    }
                  });
                } catch (_) {
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
                  const isContainsRel = relship?.type?.name === constants.types.AKM_CONTAINS;
                  if (fromObjview?.isGroup && isContainsRel) {
                    // YES
                    myModel.purgeInputRelships(myModel);
                    const fromGroup = fromObjview.object;
                    const fromGroupView = fromObjview;
                    if (reparentAllowedForNode) {
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
            } // end !inSwimlaneContext
            const myGoNode = myGoModel.findNode(myToNode.key);
            if (myGoNode && myGoNode.key !== myToNode.group) {
              myGoNode.scale = myToNode.scale;
              myGoNode.loc = myToNode.loc;
              myGoNode.group = myToNode.group;
            }
            // DISABLED: These focus dispatches might trigger unnecessary rebuilds during drag
            // if (myGoNode?.object) {
            //   const objvIdName = { id: myGoNode.key, name: myGoNode.name };
            //   const objIdName = { id: myGoNode.object.id, name: myGoNode.object.name };
            //   myDiagram.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: objvIdName });
            //   myDiagram.dispatch({ type: 'SET_FOCUS_OBJECT', data: objIdName });
            // }
            // Prepare dispatch
            uic.addItemToList(modifiedObjectViews, {
              id: myToNode.objectview?.id,
              loc: myToNode.objectview?.loc,
              group: myToNode.objectview?.group,
              scale: myToNode.objectview?.scale,
            });
          }
        }
      }
        // Persist manual moves for groups (lanes/pools); the object-only block above
        // does not capture group objectviews.
        const movedGroupSelection = e.subject;
        for (let it = movedGroupSelection?.iterator; it?.next();) {
          const sel = it.value;
          if (!(sel instanceof go.Group)) continue;
          const data = sel.data;
          const storeState = getCurrentStore?.()?.getState?.();
          let storedGroupObjview: any = null;
          const storeModels = getMetisModels(storeState?.phData);
          if (storeModels.length) {
            outer: for (let mi = 0; mi < storeModels.length; mi++) {
              const model = storeModels[mi];
              const modelviews = model?.modelviews || [];
              for (let mvi = 0; mvi < modelviews.length; mvi++) {
                const modelview = modelviews[mvi];
                const objectviews = modelview?.objectviews || [];
                for (let ovi = 0; ovi < objectviews.length; ovi++) {
                  const candidate = objectviews[ovi];
                  if (candidate?.id === data?.key || candidate?.id === data?.objviewRef) {
                    storedGroupObjview = candidate;
                    break outer;
                  }
                }
              }
            }
          }
          const objview =
            data?.objectview ||
            myModelview.findObjectView(data?.key) ||
            myMetis?.findObjectView?.(data?.objviewRef || data?.key) ||
            storedGroupObjview;
          if (!objview) continue;
          const shiftPressed = Boolean(myDiagram?.lastInput?.shift);
          const isLaneGroup =
            data?.category === "Lane" ||
            data?.category === "Lane_w_handles" ||
            data?.template === "Lane" ||
            data?.template === "Lane_w_handles";
          const previousGroup = objview.group || "";
          if (previousGroup) {
            (myDiagram as any).__movedAffectedTopLevelGroupKeys.add(previousGroup);
          }
          const newLoc = `${sel.location.x} ${sel.location.y}`;
          const currentGroupSize = getPersistedGroupSize(sel);
          objview.loc = newLoc;
          objview.size = currentGroupSize;
          if (data) {
            myDiagram.model.setDataProperty(data, "loc", newLoc);
            myDiagram.model.setDataProperty(data, "size", currentGroupSize);
          }

          // CRITICAL: Update lock from PRE-DRAG to POST-DRAG position
          // Use GLOBAL lock maps - survives React re-renders and focus changes
          const preserveIncomingNodeStateByKey = globalPreserveNodeStateByKey;
          const lockMovedNodeLocByKey = globalLockMovedNodeLocByKey;

          const preserveNodeStateUntil = Date.now() + 15000; // 15 seconds - survive focus changes
          const lockNodeLocUntil = Date.now() + 12000; // 12 seconds - protect through multiple operations
          const aliases = [
            data?.key,
            data?.objviewRef,
            objview?.id,
            data?.objRef,
            data?.object?.id,
          ].filter((v: any) => v !== undefined && v !== null && String(v).length > 0)
            .map((v: any) => String(v));
          aliases.forEach((id) => preserveIncomingNodeStateByKey.set(id, preserveNodeStateUntil));
          const lockedLoc = newLoc; // Use the newLoc we just set, not sel.location which might change
          console.log(`[GROUP-LOCK-UPDATE-END] ${data?.key || sel.key}: updating lock to POST-DRAG position: ${lockedLoc}`);
          aliases.forEach((id) => lockMovedNodeLocByKey.set(id, { loc: lockedLoc, until: lockNodeLocUntil }));

          const isPlainTopLevelGroupMove =
            !isLaneGroup &&
            !shiftPressed &&
            !(sel.containingGroup instanceof go.Group) &&
            !previousGroup &&
            !(typeof data?.group === "string" && data.group);
          if (isPlainTopLevelGroupMove) {
            objview.group = "";
            objview.isGroup = true;
            if (data) {
              data.isGroup = true;
            }
            const gnode = myGoModel.findNodeByViewId(objview.id);
            if (gnode) {
              gnode.loc = objview.loc;
              if (objview.size) gnode.size = objview.size;
              gnode.group = "";
            }
            const nextScale = applyDerivedScaleToPart(myDiagram, sel, null, objview, gnode);
            objview.scale = nextScale;
            uic.addItemToList(modifiedObjectViews, {
              id: objview?.id,
              loc: objview?.loc,
              size: objview?.size,
              group: "",
              scale: objview?.scale,
            });
            continue;
          }
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
              (myDiagram as any).__movedAffectedTopLevelGroupKeys.add(persistedGroup);
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
              let nextScale = 1.0;
              if (persistedGroup) {
                const parentPart = myDiagram.findNodeForKey(persistedGroup) as go.Group | null;
                const parentChanged = previousGroup !== persistedGroup;
                if (shiftPressed && parentChanged && parentPart instanceof go.Group) {
                  applyNestedGroupHalfSize(myDiagram, sel, parentPart, objview, gnode);
                }
                // Keep an explicitly resized group at its current size when it is moved.
                // The half-parent default should only be applied on initial grouping paths.
                nextScale = applyDerivedScaleToPart(myDiagram, sel, parentPart, objview, gnode);
              } else {
                nextScale = applyDerivedScaleToPart(myDiagram, sel, null, objview, gnode);
              }
              try {
                sel.scale = nextScale;
              } catch (error) {
              }
              try {
                myDiagram.updateAllTargetBindings();
                myDiagram.requestUpdate();
              } catch (error) {
              }
            }
          }
          if (!isLaneGroup && groupAllowsGrab(sel, myModelview, myMetis)) {
            const parentObj = objview?.object || myModel?.findObject?.(objview?.objectRef);
            const containsType = myMetamodel.findRelationshipTypeByName(constants.types.AKM_CONTAINS);
            const grabCandidates: go.Node[] = [];
            myDiagram.nodes.each((candidate: go.Node) => {
              if (!(candidate instanceof go.Node) || candidate instanceof go.Group) return;
              if (myDiagram.selection.contains(candidate)) return;
              if (!isPartVisuallyInsideGroup(candidate, sel)) return;
              grabCandidates.push(candidate);
            });
            grabCandidates.forEach((candidate: go.Node) => {
              const candidateData: any = candidate.data || {};
              const candidateObjview =
                myModelview.findObjectView(candidateData?.key) ||
                candidateData?.objectview;
              if (!candidateObjview) return;
              if (String(candidateObjview.group || "") === String(sel.key)) return;
              const candidateObj = candidateObjview.object || myModel?.findObject?.(candidateObjview?.objectRef);
              if (parentObj?.id && candidateObj?.id && parentObj.id === candidateObj.id) {
                return;
              }
              if (
                containsType &&
                (wouldCreateGroupCycle(candidate as any, sel) ||
                  objectContainsDescendant(candidateObj, parentObj, containsType))
              ) {
                return;
              }
              const attached = attachPartToGroup(myDiagram, candidate, sel, candidateData);
              if (!attached) return;

              const goCandidate = myGoModel.findNode(candidateData?.key);
              if (goCandidate) {
                goCandidate.group = String(sel.key);
                goCandidate.objectview = candidateObjview;
              }
              candidateObjview.group = String(sel.key);
              const nextScale = applyDerivedScaleToPart(myDiagram, candidate, sel, candidateObjview, goCandidate);
              candidateObjview.scale = nextScale;
              candidateData.group = String(sel.key);
              candidateData.scale = nextScale;
              try {
                myDiagram.model.setDataProperty(candidateData, "group", String(sel.key));
                myDiagram.model.setDataProperty(candidateData, "scale", nextScale);
              } catch (_) {
              }
              const nextLoc = uic.scaleNodeLocation1(gnode, goCandidate || candidateData);
              if (nextLoc) {
                candidateObjview.loc = nextLoc;
                if (goCandidate) goCandidate.loc = nextLoc;
                candidateData.loc = nextLoc;
                try {
                  myDiagram.model.setDataProperty(candidateData, "loc", nextLoc);
                } catch (_) {
                }
              }
              uic.addItemToList(modifiedObjectViews, {
                id: candidateObjview?.id,
                group: candidateObjview?.group,
                loc: candidateObjview?.loc,
                scale: candidateObjview?.scale,
              });

              if (parentObj && candidateObj && containsType) {
                // Check if metamodel allows "contains" relationship between these specific object types
                const parentObjType = parentObj?.type;
                const candidateObjType = candidateObj?.type;
                const isAllowedByMetamodel =
                  parentObjType &&
                  candidateObjType &&
                  containsType.isAllowedFromType(parentObjType, true) &&
                  containsType.isAllowedToType(candidateObjType, true);

                if (!isAllowedByMetamodel) {
                  console.log(`[GRAB-CONTAINS-BLOCKED] Metamodel does not allow "contains" from ${parentObjType?.name} to ${candidateObjType?.name}, skipping auto-creation on grab`);
                  // Continue without creating the relationship
                } else {
                  let nextRel = myModel.findRelationship1(parentObj, candidateObj, containsType, null, null);
                  if (!nextRel) {
                    nextRel = new akm.cxRelationship(
                      utils.createGuid(),
                      containsType,
                      parentObj,
                      candidateObj,
                      constants.types.AKM_CONTAINS,
                      ""
                    );
                    nextRel.parentModelRef = myModel.id;
                    myModel.addRelationship(nextRel);
                    parentObj?.addOutputrel(nextRel);
                    candidateObj?.addInputrel(nextRel);
                    myMetis.addRelationship(nextRel);
                  }
                  const nextRelview = uic.ensureContainsRelationshipView(
                    myModelview,
                    myMetis,
                    nextRel,
                    objview,
                    candidateObjview,
                    false
                  );
                  if (nextRelview) {
                    nextRelview.visible = false;
                    nextRelview.points = [];
                    const link = myDiagram.findLinkForKey(nextRelview.id);
                    if (link) {
                      link.visible = false;
                    }
                    myDiagram.links.each((ll: go.Link) => {
                      if (ll?.data?.relshipRef === nextRel.id) {
                        ll.visible = false;
                      }
                    });
                    const jsnRelview = new jsn.jsnRelshipView(nextRelview);
                    uic.addItemToList(modifiedRelshipViews, jsnRelview);
                  }
                  const jsnRelship = new jsn.jsnRelationship(nextRel);
                  uic.addItemToList(modifiedRelships, jsnRelship);
                }
              }
            });
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
              const nextVisible = false;
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
              movedObj.id !== nextParentObjview.object.id &&
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
              movedObj &&
              containsType &&
              nextParentObjview?.object &&
              movedObj.id !== nextParentObjview.object.id &&
              persistedGroup &&
              (!previousRel || previousGroup === persistedGroup || !previousParentObjview?.object) &&
              !objectContainsDescendant(movedObj, nextParentObjview.object, containsType)
            ) {
              // Check if metamodel allows "contains" relationship between these specific object types
              const parentObjType = nextParentObjview?.object?.type;
              const movedObjType = movedObj?.type;
              const isAllowedByMetamodel =
                parentObjType &&
                movedObjType &&
                containsType.isAllowedFromType(parentObjType, true) &&
                containsType.isAllowedToType(movedObjType, true);

              if (!isAllowedByMetamodel) {
                console.log(`[MOVE-CONTAINS-BLOCKED] Metamodel does not allow "contains" from ${parentObjType?.name} to ${movedObjType?.name}, skipping auto-creation on group change`);
                // Continue without creating the relationship
              } else {
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
            }
            if (movedObj && containsType && nextParentObjview?.object && persistedGroup) {
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
        ((myDiagram as any).__movedAffectedTopLevelGroupKeys as Set<string | number>).forEach((groupKey) => {
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
        // Ensure ordinary object drags are persisted even when GoJS no longer exposes
        // the moved parts through draggingTool.draggedParts at SelectionMoved time.
        for (let it = e.subject?.iterator; it?.next();) {
          const part = it.value;
          if (!(part instanceof go.Node) || part instanceof go.Group) continue;
          const data: any = part.data || {};
          if (data.category === constants.gojs.C_OBJECTTYPE || data.category === constants.gojs.C_RELATIONSHIP) continue;
          const objview =
            myModelview.findObjectView(data?.objviewRef || data?.key) ||
            myMetis.findObjectView(data?.objviewRef || data?.key) ||
            data?.objectview;
          if (!objview?.id) continue;
          const loc = `${part.location.x} ${part.location.y}`;
          objview.loc = loc;
          if (typeof data.group === "string") objview.group = data.group;
          if (data.scale !== undefined) objview.scale = data.scale;
          try { myDiagram.model.setDataProperty(data, "loc", loc); } catch (_) { data.loc = loc; }
          uic.addItemToList(modifiedObjectViews, {
            id: objview.id,
            loc: objview.loc,
            group: objview.group,
            scale: objview.scale,
            modelviewId: myModelview?.id,
          });
        }
        { // links
          const movedNodeDeltas = new Map<string, { dx: number; dy: number }>();
          try {
            for (let it = myParts.iterator; it?.next();) {
              const part = it.key;
              const original = it.value?.point;
              if (!(part instanceof go.Node) || !part.data?.key || !original) continue;
              const dx = Number(part.location?.x) - Number(original.x);
              const dy = Number(part.location?.y) - Number(original.y);
              if (Number.isFinite(dx) && Number.isFinite(dy) && (dx !== 0 || dy !== 0)) {
                movedNodeDeltas.set(String(part.data.key), { dx, dy });
              }
            }
          } catch (_) {
          }
          const movedNodeKeys = new Set<string>();
          const movedLinksToClear: go.Link[] = [];
          const movedLinkKeysToRefresh = new Set<string>();
          const movedManualLinkKeys = new Set<string>();
          const movedSelfLoopKeysWithPersistedPath = new Set<string>();
          const movedSelection = e.subject;
          const movePreviewPointsByLinkKey: Map<string, number[]> =
            ((myDiagram as any)?.__manualLinkMovePreview instanceof Map)
              ? (myDiagram as any).__manualLinkMovePreview
              : new Map<string, number[]>();
          for (let it = movedSelection?.iterator; it?.next();) {
            const part = it.value;
            if (part instanceof go.Node && part.data?.key) {
              movedNodeKeys.add(String(part.data.key));
            }
          }
          const links = myDiagram.links;
          for (let it = links.iterator; it?.next();) {
            const link = it.value;
            const rview =
              myModelview.findRelationshipView(link.data?.relviewRef || link.data?.key) ||
              link.data?.relshipview;
            if (!rview) continue;
            const ldata = link.data;
            let resetRoute = false;
            const linkTouchesMovedNode =
              (link.fromNode?.data?.key && movedNodeKeys.has(String(link.fromNode.data.key))) ||
              (link.toNode?.data?.key && movedNodeKeys.has(String(link.toNode.data.key)));
            const movedEndpointInsideSameGroup =
              !!linkTouchesMovedNode &&
              !!rview?.fromObjview?.group &&
              String(rview?.fromObjview?.group || "") === String(rview?.toObjview?.group || "");
            const isSelfLoop =
              (link.fromNode && link.toNode && link.fromNode === link.toNode) ||
              (rview?.fromObjview?.id && rview?.toObjview?.id && rview.fromObjview.id === rview.toObjview.id) ||
              (rview?.fromObjview?.object?.id && rview?.toObjview?.object?.id && rview.fromObjview.object.id === rview.toObjview.object.id);
            const normalizedFromPort = typeof rview.fromPortid === "string" ? rview.fromPortid : "";
            const normalizedToPort = typeof rview.toPortid === "string" ? rview.toPortid : "";
            const liveRouting = ldata?.routing || rview?.routing || myModelview?.routing || "";
            const preservedRouting = getPreservedRouting(
              ldata?.routing,
              rview?.routing,
              rview?.typeview?.routing,
              myModelview?.routing
            );
            const isRoutedLink = isTransientRoutedLink(liveRouting);
            const previewPoints =
              ldata?.key ? normalizeLinkPoints(movePreviewPointsByLinkKey.get(String(ldata.key))) : null;
            const persistedPointsBeforeMove = pickFirstNonEmptyLinkPoints(ldata?.points, rview?.points);
            const livePoints = pickFirstNonEmptyLinkPoints(
              previewPoints,
              link?.points,
              ldata?.points,
              rview?.points
            );
            const hasManualPoints = Array.isArray(livePoints) && livePoints.length >= 4;
            const hadPersistedManualPath =
              Array.isArray(persistedPointsBeforeMove) && persistedPointsBeforeMove.length >= 4;
            const hasManualPathMarker = Boolean(ldata?.__manualPath || rview?.__manualPath);
            const preserveSelfLoopPathOnMove = isSelfLoop && hadPersistedManualPath;
            const preserveManualPathOnMove = preserveSelfLoopPathOnMove || (!isSelfLoop && hadPersistedManualPath && hasManualPathMarker);
            if (isSelfLoop && hadPersistedManualPath && ldata?.key) {
              movedSelfLoopKeysWithPersistedPath.add(String(ldata.key));
            }
            const liveFromKey = link.fromNode?.data?.key ? String(link.fromNode.data.key) : "";
            const liveToKey = link.toNode?.data?.key ? String(link.toNode.data.key) : "";
            if (linkTouchesMovedNode && isSelfLoop && hadPersistedManualPath) {
              const selfLoopPoints = pickFirstNonEmptyLinkPoints(link?.points, previewPoints, ldata?.points, rview?.points);
              if (Array.isArray(selfLoopPoints) && selfLoopPoints.length >= 4) {
                try { myDiagram.model.setDataProperty(ldata, "points", selfLoopPoints); } catch (_) { ldata.points = selfLoopPoints; }
                try { myDiagram.model.setDataProperty(ldata, "routing", preservedRouting); } catch (_) { ldata.routing = preservedRouting; }
                try { link.routing = uit.getRouting(preservedRouting); } catch (_) { }
                rview.points = selfLoopPoints;
                rview.routing = preservedRouting;
                try {
                  if (ldata?.relshipview) {
                    ldata.relshipview.points = selfLoopPoints;
                    ldata.relshipview.routing = preservedRouting;
                    if (ldata.relshipview.id !== rview.id) ldata.relshipview = rview;
                  }
                } catch (_) { }
                try {
                  const liveGoLink = myGoModel?.findLink?.(ldata?.key);
                  if (liveGoLink) {
                    liveGoLink.points = selfLoopPoints;
                    liveGoLink.routing = preservedRouting;
                    liveGoLink.relshipview = rview;
                    liveGoLink.relviewRef = rview?.id || liveGoLink.relviewRef;
                    if (liveGoLink.data) {
                      liveGoLink.data.points = selfLoopPoints;
                      liveGoLink.data.routing = preservedRouting;
                      liveGoLink.data.relshipview = rview;
                      liveGoLink.data.relviewRef = rview?.id || liveGoLink.data.relviewRef;
                    }
                  }
                } catch (_) { }
                if (ldata?.key) movedManualLinkKeys.add(String(ldata.key));
                try {
                  const jsnRelview = new jsn.jsnRelshipView(rview);
                  let data: any = jsnRelview;
                  data = JSON.parse(JSON.stringify(data));
                  queueRelshipViewDispatch(this, context.dispatch || myDiagram.dispatch || this.state.dispatch, data, myDiagram);
                } catch (_) { }
                try {
                  const nextLinkDataArray = (Array.isArray(this.state.linkDataArray) ? this.state.linkDataArray : []).map((entry: any) => {
                    if (!entry || entry.key !== ldata?.key) return entry;
                    return {
                      ...entry,
                      points: [...selfLoopPoints],
                      routing: preservedRouting,
                      relshipview: rview,
                      relviewRef: rview?.id || entry.relviewRef,
                    };
                  });
                  this.setState({
                    linkDataArray: normalizeLinkPortData(nextLinkDataArray),
                    skipsDiagramUpdate: true,
                  });
                } catch (_) { }
              }
            }
            if (liveFromKey && ldata?.from !== liveFromKey) {
              try { myDiagram.model.setDataProperty(ldata, "from", liveFromKey); } catch (_) { ldata.from = liveFromKey; }
              if (!preserveManualPathOnMove) resetRoute = true;
            }
            if (liveToKey && ldata?.to !== liveToKey) {
              try { myDiagram.model.setDataProperty(ldata, "to", liveToKey); } catch (_) { ldata.to = liveToKey; }
              if (!preserveManualPathOnMove) resetRoute = true;
            }
            if (ldata?.fromPort !== normalizedFromPort) {
              myDiagram.model.setDataProperty(ldata, "fromPort", normalizedFromPort);
              if (!preserveManualPathOnMove) resetRoute = true;
            }
            if (ldata?.toPort !== normalizedToPort) {
              myDiagram.model.setDataProperty(ldata, "toPort", normalizedToPort);
              if (!preserveManualPathOnMove) resetRoute = true;
            }
            if (movedEndpointInsideSameGroup) {
              if (!preserveManualPathOnMove) {
                const desiredRouting = getDefaultRoutingForRelshipType(
                  rview?.name || rview?.relship?.name || rview?.typeview?.name,
                  rview?.routing || rview?.typeview?.routing || myModelview?.routing || "Normal"
                );
                rview.routing = desiredRouting;
                try { myDiagram.model.setDataProperty(ldata, "routing", desiredRouting); } catch (_) { }
                resetRoute = true;
              }
            }
            if (linkTouchesMovedNode && !preserveManualPathOnMove) {
              resetRoute = true;
            }
            if (linkTouchesMovedNode && isRoutedLink && !preserveManualPathOnMove) {
              try { myDiagram.model.setDataProperty(ldata, "points", []); } catch (_) { ldata.points = []; }
              try { link.points = new go.List<go.Point>(); } catch (_) { }
              rview.points = [];
            }
            if (linkTouchesMovedNode && preserveManualPathOnMove) {
              const directLivePoints = pickFirstNonEmptyLinkPoints(previewPoints, link?.points);
              const shiftedPoints =
                Array.isArray(directLivePoints) && directLivePoints.length >= 4
                  ? directLivePoints
                  : shiftManualLinkEndpointSegments(
                      livePoints,
                      {
                        moveFrom: liveFromKey ? movedNodeDeltas.get(liveFromKey) || null : null,
                        moveTo: liveToKey ? movedNodeDeltas.get(liveToKey) || null : null,
                      }
                    );
              const adjustedPoints =
                (Array.isArray(directLivePoints) && directLivePoints.length >= 4)
                  ? directLivePoints
                  : (reanchorManualLinkPoints(link, shiftedPoints) || shiftedPoints);
              if (Array.isArray(adjustedPoints) && adjustedPoints.length >= 4) {
                if (ldata?.key) movedManualLinkKeys.add(String(ldata.key));
                try { myDiagram.model.setDataProperty(ldata, "points", adjustedPoints); } catch (_) { ldata.points = adjustedPoints; }
                try { myDiagram.model.setDataProperty(ldata, "routing", preservedRouting); } catch (_) { ldata.routing = preservedRouting; }
                try {
                  const pointList = new go.List<go.Point>();
                  for (let i = 0; i + 1 < adjustedPoints.length; i += 2) {
                    pointList.add(new go.Point(adjustedPoints[i], adjustedPoints[i + 1]));
                  }
                  link.points = pointList;
                } catch (_) { }
                try { link.routing = uit.getRouting(preservedRouting); } catch (_) { }
                rview.routing = preservedRouting;
                rview.points = adjustedPoints;
                try {
                  if (ldata?.relshipview) {
                    ldata.relshipview.points = adjustedPoints;
                    ldata.relshipview.routing = preservedRouting;
                    if (ldata.relshipview.id !== rview.id) ldata.relshipview = rview;
                  }
                } catch (_) { }
                try {
                  const liveGoLink = myGoModel?.findLink?.(ldata?.key);
                  if (liveGoLink) {
                    liveGoLink.points = adjustedPoints;
                    liveGoLink.routing = preservedRouting;
                    liveGoLink.relshipview = rview;
                    liveGoLink.relviewRef = rview?.id || liveGoLink.relviewRef;
                    if (liveGoLink.data) {
                      liveGoLink.data.points = adjustedPoints;
                      liveGoLink.data.routing = preservedRouting;
                      liveGoLink.data.relshipview = rview;
                      liveGoLink.data.relviewRef = rview?.id || liveGoLink.data.relviewRef;
                    }
                  }
                } catch (_) { }
                try { link.updateTargetBindings(); } catch (_) { }
                try { myDiagram.requestUpdate(); } catch (_) { }
              }
            }
            if (resetRoute) {
              movedLinksToClear.push(link);
              if (ldata?.key) movedLinkKeysToRefresh.add(String(ldata.key));
              try { myDiagram.model.setDataProperty(ldata, "__manualPath", false); } catch (_) { ldata.__manualPath = false; }
              try { rview.__manualPath = false; } catch (_) { }
              try { myDiagram.model.setDataProperty(ldata, "points", []); } catch (_) { }
              try { myDiagram.model.setDataProperty(ldata, "visible", rview.visible !== false); } catch (_) { }
              try { link.points = new go.List<go.Point>(); } catch (_) { }
              try { link.invalidateRoute(); } catch (_) { }
              try { link.updateRoute(); } catch (_) { }
              rview.points = [];
            }
            const relviews = myModelview.relshipviews;
            for (let i = 0; i < relviews?.length; i++) {
              const relview = relviews[i];
              if (relview.id === rview.id) {
                if (liveFromKey) {
                  const liveFromObjview = myModelview.findObjectView(liveFromKey);
                  if (liveFromObjview) relview.fromObjview = liveFromObjview;
                }
                if (liveToKey) {
                  const liveToObjview = myModelview.findObjectView(liveToKey);
                  if (liveToObjview) relview.toObjview = liveToObjview;
                }
                relview.fromPortid = normalizedFromPort;
                relview.toPortid = normalizedToPort;
                const relviewRouting = relview?.routing || rview?.routing || myModelview?.routing || "";
                const shouldPersistPoints = !isTransientRoutedLink(relviewRouting);
                if (resetRoute || (linkTouchesMovedNode && !shouldPersistPoints && !preserveManualPathOnMove)) {
                  relview.points = [];
                } else {
                  const points = pickFirstNonEmptyLinkPoints(link?.points, ldata?.points, relview?.points);
                  relview.points = points;
                }
                // myModelview.addRelationshipView(relview);
              }
            }
          }
          if (movedLinksToClear.length > 0) {
            const rerouteMovedLinks = () => {
              try {
                movedLinkKeysToRefresh.forEach((linkKey) => {
                  const liveLink = myDiagram.findLinkForKey(linkKey);
                  if (!(liveLink instanceof go.Link) || !liveLink.data) return;
                  try { liveLink.fromNode?.ensureBounds(); } catch (_) { }
                  try { liveLink.toNode?.ensureBounds(); } catch (_) { }
                  try { liveLink.fromNode?.updateTargetBindings(); } catch (_) { }
                  try { liveLink.toNode?.updateTargetBindings(); } catch (_) { }
                  try { liveLink.fromNode?.invalidateConnectedLinks(); } catch (_) { }
                  try { liveLink.toNode?.invalidateConnectedLinks(); } catch (_) { }
                  const liveRelview =
                    myModelview.findRelationshipView(liveLink.data?.relviewRef || linkKey) ||
                    liveLink.data?.relshipview;
                  const desiredRouting = getDefaultRoutingForRelshipType(
                    liveRelview?.name || liveRelview?.relship?.name || liveRelview?.typeview?.name,
                    liveRelview?.routing || liveRelview?.typeview?.routing || myModelview?.routing || "Normal"
                  );
                  try { myDiagram.model.setDataProperty(liveLink.data, "routing", desiredRouting); } catch (_) { }
                  try { myDiagram.model.setDataProperty(liveLink.data, "points", []); } catch (_) { }
                  try { liveLink.points = new go.List<go.Point>(); } catch (_) { }
                  try { liveLink.invalidateRoute(); } catch (_) { }
                  try { liveLink.updateRoute(); } catch (_) { }
                  try { liveLink.updateTargetBindings(); } catch (_) { }
                });
                // Recompute routes only. Forcing a full layout here can move nodes
                // back to algorithmic positions immediately after user drag.
                myDiagram.requestUpdate();
                const liveNodeDataArray = Array.isArray((myDiagram?.model as any)?.nodeDataArray)
                  ? [...(myDiagram.model as any).nodeDataArray]
                  : this.state.nodeDataArray;
                const liveLinkDataArray = Array.isArray((myDiagram?.model as any)?.linkDataArray)
                  ? [...(myDiagram.model as any).linkDataArray]
                  : this.state.linkDataArray;
                this.setState({
                  nodeDataArray: normalizeNodeCategoryData(liveNodeDataArray),
                  linkDataArray: normalizeLinkPortData(liveLinkDataArray),
                  skipsDiagramUpdate: true,
                });
              } catch (_) {
              }
            };
            try {
              // Keep node positions user-driven on drag; do not trigger full layout.
              myDiagram.requestUpdate();
              const liveNodeDataArray = Array.isArray((myDiagram?.model as any)?.nodeDataArray)
                ? [...(myDiagram.model as any).nodeDataArray]
                : this.state.nodeDataArray;
              const liveLinkDataArray = Array.isArray((myDiagram?.model as any)?.linkDataArray)
                ? [...(myDiagram.model as any).linkDataArray]
                : this.state.linkDataArray;
              this.setState({
                nodeDataArray: normalizeNodeCategoryData(liveNodeDataArray),
                linkDataArray: normalizeLinkPortData(liveLinkDataArray),
                skipsDiagramUpdate: true,
              });
            } catch (_) {
            }
            setTimeout(rerouteMovedLinks, 0);
            setTimeout(rerouteMovedLinks, 50);
          }
          const rerouteConnectedLinksForMovedNodes = () => {
            try {
              const touchedLinkKeys = new Set<string>();
              for (let it = movedSelection?.iterator; it?.next();) {
                const part = it.value;
                if (!(part instanceof go.Node)) continue;
                try { part.ensureBounds(); } catch (_) { }
                try { part.updateTargetBindings(); } catch (_) { }
                try { part.invalidateConnectedLinks(); } catch (_) { }
                part.findLinksConnected().each((liveLink: go.Link) => {
                  if (!(liveLink instanceof go.Link) || !liveLink.data) return;
                  const linkKey = String(liveLink.data?.key || liveLink.key || "");
                  if (!linkKey || touchedLinkKeys.has(linkKey)) return;
                  touchedLinkKeys.add(linkKey);
                  const liveRelview =
                    myModelview.findRelationshipView(liveLink.data?.relviewRef || linkKey) ||
                    liveLink.data?.relshipview;
                  const isSelfLoop =
                    (liveLink.fromNode && liveLink.toNode && liveLink.fromNode === liveLink.toNode) ||
                    (liveRelview?.fromObjview?.id && liveRelview?.toObjview?.id && liveRelview.fromObjview.id === liveRelview.toObjview.id);
                  const keepSelfLoopManualPath =
                    isSelfLoop && Boolean(liveLink.data?.__manualPath || liveRelview?.__manualPath);
                  if (keepSelfLoopManualPath) {
                    try { liveLink.invalidateRoute(); } catch (_) { }
                    try { liveLink.updateRoute(); } catch (_) { }
                    return;
                  }
                  const liveFromKey = liveLink.fromNode?.data?.key ? String(liveLink.fromNode.data.key) : "";
                  const liveToKey = liveLink.toNode?.data?.key ? String(liveLink.toNode.data.key) : "";
                  if (liveFromKey) {
                    try { myDiagram.model.setDataProperty(liveLink.data, "from", liveFromKey); } catch (_) { liveLink.data.from = liveFromKey; }
                  }
                  if (liveToKey) {
                    try { myDiagram.model.setDataProperty(liveLink.data, "to", liveToKey); } catch (_) { liveLink.data.to = liveToKey; }
                  }
                  const desiredRouting = getDefaultRoutingForRelshipType(
                    liveRelview?.name || liveRelview?.relship?.name || liveRelview?.typeview?.name,
                    liveRelview?.routing || liveRelview?.typeview?.routing || myModelview?.routing || "Normal"
                  );
                  try { myDiagram.model.setDataProperty(liveLink.data, "routing", desiredRouting); } catch (_) { }
                  try { myDiagram.model.setDataProperty(liveLink.data, "__manualPath", false); } catch (_) { liveLink.data.__manualPath = false; }
                  try { myDiagram.model.setDataProperty(liveLink.data, "points", []); } catch (_) { liveLink.data.points = []; }
                  try {
                    if (liveRelview) {
                      liveRelview.points = [];
                      liveRelview.__manualPath = false;
                      liveRelview.routing = desiredRouting;
                    }
                  } catch (_) { }
                  try { liveLink.points = new go.List<go.Point>(); } catch (_) { }
                  try { liveLink.invalidateRoute(); } catch (_) { }
                  try { liveLink.updateRoute(); } catch (_) { }
                  try { liveLink.updateTargetBindings(); } catch (_) { }
                });
              }
              if (touchedLinkKeys.size > 0) {
                try { myDiagram.requestUpdate(); } catch (_) { }
                const liveNodeDataArray = Array.isArray((myDiagram?.model as any)?.nodeDataArray)
                  ? [...(myDiagram.model as any).nodeDataArray]
                  : this.state.nodeDataArray;
                const liveLinkDataArray = Array.isArray((myDiagram?.model as any)?.linkDataArray)
                  ? [...(myDiagram.model as any).linkDataArray]
                  : this.state.linkDataArray;
                this.setState({
                  nodeDataArray: normalizeNodeCategoryData(liveNodeDataArray),
                  linkDataArray: normalizeLinkPortData(liveLinkDataArray),
                  skipsDiagramUpdate: true,
                });
              }
            } catch (_) {
            }
          };
          setTimeout(rerouteConnectedLinksForMovedNodes, 0);
          setTimeout(rerouteConnectedLinksForMovedNodes, 60);
          if (movedManualLinkKeys.size > 0) {
            try {
              const liveNodeDataArray = Array.isArray((myDiagram?.model as any)?.nodeDataArray)
                ? [...(myDiagram.model as any).nodeDataArray]
                : this.state.nodeDataArray;
              const liveLinkDataArray = Array.isArray((myDiagram?.model as any)?.linkDataArray)
                ? [...(myDiagram.model as any).linkDataArray]
                : this.state.linkDataArray;
              this.setState({
                nodeDataArray: normalizeNodeCategoryData(liveNodeDataArray),
                linkDataArray: normalizeLinkPortData(liveLinkDataArray),
                skipsDiagramUpdate: true,
              });
            } catch (_) {
            }
            const persistMovedManualLinks = () => {
              try {
                movedManualLinkKeys.forEach((linkKey) => {
                  const liveLink = myDiagram.findLinkForKey(linkKey);
                  if (!(liveLink instanceof go.Link) || !liveLink.data) return;
                  const relview =
                    myModelview.findRelationshipView(liveLink.data?.relviewRef || linkKey) ||
                    liveLink.data?.relshipview;
                  if (!relview) return;
                  const livePoints = pickFirstNonEmptyLinkPoints(liveLink.points, liveLink.data?.points);
                  if (!Array.isArray(livePoints) || livePoints.length < 4) return;
                  relview.points = livePoints;
                  relview.routing = getPreservedRouting(
                    liveLink.data?.routing,
                    relview?.routing,
                    relview?.typeview?.routing,
                    myModelview?.routing
                  );
                  const jsnRelview = new jsn.jsnRelshipView(relview);
                  let data: any = jsnRelview;
                  data = JSON.parse(JSON.stringify(data));
                  queueRelshipViewDispatch(this, context.dispatch || myDiagram.dispatch || this.state.dispatch, data, myDiagram);
                });
              } catch (_) {
              }
            };
            setTimeout(persistMovedManualLinks, 0);
            setTimeout(persistMovedManualLinks, 50);
          }
          let persistedTouchedSelfLoop = false;
          const movedSelfLoopKeys = new Set<string>();
          try {
            myDiagram.links.each((liveLink: go.Link) => {
              if (!(liveLink instanceof go.Link) || !liveLink.data) return;
              const touchesMovedNode =
                (liveLink.fromNode?.data?.key && movedNodeKeys.has(String(liveLink.fromNode.data.key))) ||
                (liveLink.toNode?.data?.key && movedNodeKeys.has(String(liveLink.toNode.data.key)));
              if (!touchesMovedNode) return;
              const relview =
                myModelview.findRelationshipView(liveLink.data?.relviewRef || liveLink.data?.key) ||
                liveLink.data?.relshipview;
              const isSelfLoop =
                (liveLink.fromNode && liveLink.toNode && liveLink.fromNode === liveLink.toNode) ||
                (relview?.fromObjview?.id && relview?.toObjview?.id && relview.fromObjview.id === relview.toObjview.id) ||
                (relview?.fromObjview?.object?.id && relview?.toObjview?.object?.id && relview.fromObjview.object.id === relview.toObjview.object.id);
              if (!isSelfLoop || !relview) return;
              if (!movedSelfLoopKeysWithPersistedPath.has(String(liveLink.data?.key || ""))) return;
              const livePoints = pickFirstNonEmptyLinkPoints(liveLink.points, liveLink.data?.points, relview?.points);
              if (!Array.isArray(livePoints) || livePoints.length < 4) return;
              if (liveLink.data?.key) movedSelfLoopKeys.add(String(liveLink.data.key));
              const liveRoutingName = getPreservedRouting(
                liveLink.data?.routing,
                relview?.routing,
                relview?.typeview?.routing,
                myModelview?.routing
              );
              relview.points = livePoints;
              relview.routing = liveRoutingName;
              try { myDiagram.model.setDataProperty(liveLink.data, "points", livePoints); } catch (_) { liveLink.data.points = livePoints; }
              try { myDiagram.model.setDataProperty(liveLink.data, "routing", liveRoutingName); } catch (_) { liveLink.data.routing = liveRoutingName; }
              try {
                if (liveLink.data?.relshipview) {
                  liveLink.data.relshipview.points = livePoints;
                  liveLink.data.relshipview.routing = liveRoutingName;
                  if (liveLink.data.relshipview.id !== relview.id) liveLink.data.relshipview = relview;
                }
              } catch (_) { }
              try {
                const goLink = myGoModel?.findLink?.(liveLink.data?.key);
                if (goLink) {
                  goLink.points = livePoints;
                  goLink.routing = liveRoutingName;
                  goLink.relshipview = relview;
                  goLink.relviewRef = relview?.id || goLink.relviewRef;
                  if (goLink.data) {
                    goLink.data.points = livePoints;
                    goLink.data.routing = liveRoutingName;
                    goLink.data.relshipview = relview;
                    goLink.data.relviewRef = relview?.id || goLink.data.relviewRef;
                  }
                }
              } catch (_) { }
              try {
                const jsnRelview = new jsn.jsnRelshipView(relview);
                let data: any = jsnRelview;
                data = JSON.parse(JSON.stringify(data));
                queueRelshipViewDispatch(this, context.dispatch || myDiagram.dispatch || this.state.dispatch, data, myDiagram);
              } catch (_) { }
              persistedTouchedSelfLoop = true;
            });
          } catch (_) { }
          if (movedSelfLoopKeys.size > 0) {
            const persistMovedSelfLoops = () => {
              try {
                movedSelfLoopKeys.forEach((linkKey) => {
                  if (!movedSelfLoopKeysWithPersistedPath.has(String(linkKey))) return;
                  const liveLink = myDiagram.findLinkForKey(linkKey);
                  if (!(liveLink instanceof go.Link) || !liveLink.data) return;
                  const relview =
                    myModelview.findRelationshipView(liveLink.data?.relviewRef || linkKey) ||
                    liveLink.data?.relshipview;
                  if (!relview) return;
                  const livePoints = pickFirstNonEmptyLinkPoints(liveLink.points, liveLink.data?.points, relview?.points);
                  if (!Array.isArray(livePoints) || livePoints.length < 4) return;
                  const liveRoutingName = getPreservedRouting(
                    liveLink.data?.routing,
                    relview?.routing,
                    relview?.typeview?.routing,
                    myModelview?.routing
                  );
                  relview.points = livePoints;
                  relview.routing = liveRoutingName;
                  try { myDiagram.model.setDataProperty(liveLink.data, "points", livePoints); } catch (_) { liveLink.data.points = livePoints; }
                  try { myDiagram.model.setDataProperty(liveLink.data, "routing", liveRoutingName); } catch (_) { liveLink.data.routing = liveRoutingName; }
                  try {
                    if (liveLink.data?.relshipview) {
                      liveLink.data.relshipview.points = livePoints;
                      liveLink.data.relshipview.routing = liveRoutingName;
                      if (liveLink.data.relshipview.id !== relview.id) liveLink.data.relshipview = relview;
                    }
                  } catch (_) { }
                  try {
                    const goLink = myGoModel?.findLink?.(linkKey);
                    if (goLink) {
                      goLink.points = livePoints;
                      goLink.routing = liveRoutingName;
                      goLink.relshipview = relview;
                      goLink.relviewRef = relview?.id || goLink.relviewRef;
                      if (goLink.data) {
                        goLink.data.points = livePoints;
                        goLink.data.routing = liveRoutingName;
                        goLink.data.relshipview = relview;
                        goLink.data.relviewRef = relview?.id || goLink.data.relviewRef;
                      }
                    }
                  } catch (_) { }
                  try {
                    const jsnRelview = new jsn.jsnRelshipView(relview);
                    let data: any = jsnRelview;
                    data = JSON.parse(JSON.stringify(data));
                    queueRelshipViewDispatch(this, context.dispatch || myDiagram.dispatch || this.state.dispatch, data, myDiagram);
                  } catch (_) { }
                });
              } catch (_) { }
            };
            setTimeout(persistMovedSelfLoops, 0);
            setTimeout(persistMovedSelfLoops, 50);
          }
          if (persistedTouchedSelfLoop) {
            try {
              const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
              let data: any = { metis: jsnMetis };
              data = JSON.parse(JSON.stringify(data));
              (context.dispatch || myDiagram.dispatch || this.state.dispatch)?.({ type: 'LOAD_TOSTORE_PHDATA', data });
            } catch (_) { }
          }
          try { delete (myDiagram as any).__manualLinkMovePreview; } catch (_) {}
        }
        // Dispatch relshipviews
        myModelview.relshipviews = utils.removeArrayDuplicates(myModelview.relshipviews);
        const relviews = myModelview.relshipviews;
        for (let i = 0; i < relviews?.length; i++) {
          const relview = relviews[i];
          // Preserve explicit hidden state; only ensure deleted links are not visible.
          relview.visible = (relview.visible !== false) && !relview.markedAsDeleted;
          const jsnRelview = new jsn.jsnRelshipView(relview);
          modifiedRelshipViews.push(jsnRelview);
        }
        // Dispatch modelview
        const modifiedModelviews = new Array();
        const jsnModelview = new jsn.jsnModelView(myModelview);
        modifiedModelviews.push(jsnModelview);
        modifiedModelviews.map(mn => {
          let data = mn;
          data = safeJsonCloneForDispatch(data);
          // SelectionMoved persists object/relationship view changes through their dedicated
          // UPDATE_*VIEW_PROPERTIES actions. Re-sending the full modelview snapshot here can
          // replay stale objectviews/relshipviews arrays and snap nodes back after a drag.
          delete data.objectviews;
          delete data.relshipviews;
          delete data.objecttypeviews;
          delete data.relshiptypeviews;
          myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data });
        });
        // Auto-relayout affected pools after lane moves.
        if (!(myDiagram as any).__isPoolRelayoutFromMove) {
          const poolsToRelayout = new Set<string>();
          const movedSelection = e.subject;
          // When dragging a Pool, its Lane members move too; don't treat that as an intentional lane move
          // that should trigger a pool relayout/resize.
          const movedPoolKeys = new Set<string>();
          for (let it = movedSelection?.iterator; it?.next();) {
            const part = it.value;
            if (!(part instanceof go.Group)) continue;
            const pdata = part.data;
            const isPool = pdata?.category === 'Pool' || pdata?.template === 'Pool' || part.category === 'Pool';
            if (isPool && pdata?.key) movedPoolKeys.add(pdata.key);
          }
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
            const parentIsPool =
              part.containingGroup instanceof go.Group &&
              (part.containingGroup.data?.category === 'Pool' ||
                part.containingGroup.data?.template === 'Pool' ||
                part.containingGroup.category === 'Pool');
            // Moving a Pool should be a pure translation; don't relayout pool structure on pool moves.
            // Relayout is triggered for lane moves/drops (pool membership/order changes) and for resizes.
            // Exception: a Pool nested inside a parent Pool behaves like a structural row and should
            // trigger parent pool relayout when moved.
            if (isPool && parentIsPool && part.containingGroup?.data?.key && !movedPoolKeys.has(String(part.containingGroup.data.key))) {
              poolsToRelayout.add(String(part.containingGroup.data.key));
            }
            // Do not relayout a pool just because a lane was dragged inside it.
            // Pool relayout here should only happen for structural changes such as
            // reparenting between pools (tracked via __previousGroup), lane drops, or pool moves/resizes.
            if (isLane && pdata?.__previousGroup && !movedPoolKeys.has(String(pdata.__previousGroup))) poolsToRelayout.add(pdata.__previousGroup);
            if (
              isLane &&
              pdata?.__previousGroup &&
              pdata?.group &&
              String(pdata.__previousGroup) !== String(pdata.group) &&
              !movedPoolKeys.has(String(pdata.group))
            ) {
              poolsToRelayout.add(pdata.group);
            }
            if (isLane && pdata) delete (pdata as any).__previousGroup;
          }
          if (poolsToRelayout.size > 0) {
            (myDiagram as any).__isPoolRelayoutFromMove = true;
            const forcedPoolSizes = (myDiagram as any).__forcedPoolLayoutSizes || {};
            const preservedMovePoolKeys = new Set<string>();
            const normalMovePoolKeys = new Set<string>();
            poolsToRelayout.forEach((poolKey) => {
              if (forcedPoolSizes[String(poolKey)]) {
                preservedMovePoolKeys.add(String(poolKey));
              } else {
                normalMovePoolKeys.add(String(poolKey));
              }
            });
            if (preservedMovePoolKeys.size > 0) {
              (myDiagram as any).__preserveResizedPoolWidths = preservedMovePoolKeys;
            }
            if (normalMovePoolKeys.size > 0) {
              relayoutPoolsByKeys(normalMovePoolKeys);
            }
            // For manually resized pools, do not run width-recomputing relayout on lane moves.
            // Just normalize membership/loc and fit lanes back to the pool width.
            preservedMovePoolKeys.forEach((poolKey) => syncPoolLaneWidthsToPool(poolKey));
            poolsToRelayout.forEach((poolKey) => normalizeSwimlanePool(poolKey));
            preservedMovePoolKeys.forEach((poolKey) => syncPoolLaneWidthsToPool(poolKey));
            if (preservedMovePoolKeys.size > 0) {
              delete (myDiagram as any).__preserveResizedPoolWidths;
            }
            (myDiagram as any).__isPoolRelayoutFromMove = false;

            // Replace stale pre-relayout objectview updates with current post-relayout values.
            const refreshedKeys = new Set<string>();
            poolsToRelayout.forEach((poolKey) => {
              refreshedKeys.add(poolKey);
              const poolNode = myDiagram.findNodeForKey(poolKey);
              if (poolNode instanceof go.Group) {
                poolNode.memberParts.each((part: go.Part) => {
                  if (part instanceof go.Group && part.data?.key) refreshedKeys.add(part.data.key);
                  // Persist member node locations too: pool relayout moves lanes, which moves their members.
                  // If we don't dispatch these updates, a later reload/refresh can "snap" nodes back to stale
                  // objectview.loc values, making it look like they drift out of lanes after repeated pool moves.
                  if (part instanceof go.Group) {
                    part.memberParts.each((mp: go.Part) => {
                      if (mp instanceof go.Node && !(mp instanceof go.Group) && mp.data?.key) {
                        refreshedKeys.add(mp.data.key);
                      }
                    });
                  }
                });
              }
            });
            modifiedObjectViews = modifiedObjectViews.filter((ov: any) => !refreshedKeys.has(ov?.id));
            refreshedKeys.forEach((key) => {
              const ov = myMetis.findObjectView(key) || myModelview.findObjectView(key);
              if (!ov) return;
              const node = myDiagram.findNodeForKey(key);
              if (node && node.data) {
                // After a pool/lane relayout or group drag, member Nodes can move without their `data.loc`
                // being updated reliably. Persist what the user actually sees: the Part.location.
                ov.loc = `${node.location.x} ${node.location.y}`;
                if (node.data.size) ov.size = node.data.size;
                // Keep persisted group membership in sync for nodes moved indirectly by group relayout.
                if (typeof node.data.group === "string") ov.group = node.data.group;
              }
              const jsnObjview = new jsn.jsnObjectView(ov);
              uic.addItemToList(modifiedObjectViews, jsnObjview);
            });
          }
        }

        // Refresh moved/affected groups so port itemArrays (left/top/right/bottom ICOMs)
        // are rebound immediately after drag instead of waiting for a full reload.
        const groupsToRefresh = new Set<string>();
        ((myDiagram as any).__movedAffectedTopLevelGroupKeys as Set<string | number>).forEach((key) => groupsToRefresh.add(String(key)));
        const movedSelection = e.subject;
        for (let it = movedSelection?.iterator; it?.next();) {
          const part = it.value;
          if (part instanceof go.Group && part.data?.key) {
            groupsToRefresh.add(String(part.data.key));
          }
          if (part instanceof go.Node) {
            const containing = part.containingGroup;
            if (containing instanceof go.Group && containing.data?.key) {
              groupsToRefresh.add(String(containing.data.key));
            }
          }
        }
        groupsToRefresh.forEach((groupKey) => {
          const groupPart = myDiagram.findNodeForKey(groupKey);
          if (!(groupPart instanceof go.Group)) return;
          const groupData: any = groupPart.data || {};
          const isSwimlaneStructure =
            groupData?.category === "Pool" ||
            groupData?.template === "Pool" ||
            groupData?.category === "Lane" ||
            groupData?.template === "Lane" ||
            groupData?.category === "Lane_w_handles" ||
            groupData?.template === "Lane_w_handles";
          // Generic groups should keep their explicit size after a move.
          // Invalidating their layout here can trigger a recompute from groupLayout/member bounds.
          if (isSwimlaneStructure) {
            try { groupPart.invalidateLayout(); } catch (_) { }
          }
          try { groupPart.updateTargetBindings(); } catch (_) { }
          try { groupPart.updateAllTargetBindings(); } catch (_) { }
          try {
            const names = ["BODY", "LEFTPORTS", "TOPPORTS", "RIGHTPORTS", "BOTTOMPORTS"];
            names.forEach((name) => {
              const obj = groupPart.findObject(name);
              try { obj?.updateTargetBindings?.(); } catch (_) { }
            });
          } catch (_) { }
        });
        try { myDiagram.updateAllTargetBindings(); } catch (_) { }
        try { myDiagram.requestUpdate(); } catch (_) { }
        try {
          const movedAnyGroup = (() => {
            for (let it = movedSelection?.iterator; it?.next();) {
              if (it.value instanceof go.Group) return true;
            }
            return false;
          })();
          if (movedAnyGroup) {
            (myDiagram as any).__suppressSyncForNextNodeDrag = true;
          }
          flushQueuedDiagramDispatches(this, context.dispatch || myDiagram.dispatch || this.state.dispatch);
        } catch (_) {
        }
        try {
          const movedAnyGroup = (() => {
            for (let it = movedSelection?.iterator; it?.next();) {
              if (it.value instanceof go.Group) return true;
            }
            return false;
          })();
          const preserveIncomingNodeStateByKey: Map<string, number> =
            (myDiagram as any).__preserveIncomingNodeStateByKey instanceof Map
              ? (myDiagram as any).__preserveIncomingNodeStateByKey
              : new Map<string, number>();
          const lockMovedNodeLocByKey: Map<string, { loc: string; until: number }> =
            (myDiagram as any).__lockMovedNodeLocByKey instanceof Map
              ? (myDiagram as any).__lockMovedNodeLocByKey
              : new Map<string, { loc: string; until: number }>();

          const desiredMovedNodeLocByKey = new Map<string, { x: number; y: number }>();
          // Ordinary node drags can still receive delayed Redux/modelview refreshes
          // after drop; keep the loc replay guard up long enough to avoid snap-back.
          const postMoveSuppressUntil = Date.now() + 2000;
          const preserveNodeStateUntil = Date.now() + 5000;
          const lockNodeLocUntil = Date.now() + 3500;
          for (let it = movedSelection?.iterator; it?.next();) {
            const part = it.value;
            // Skip groups - they already set their locks during group processing
            if (part instanceof go.Group) continue;
            if (part instanceof go.Node && part.data?.key !== undefined && part.data?.key !== null) {
              // Skip nodes that already have locks (set during changeNodeSizeAndPos processing)
              const hasExistingLock = preserveIncomingNodeStateByKey.has(String(part.data?.key)) ||
                preserveIncomingNodeStateByKey.has(String(part.data?.objviewRef)) ||
                preserveIncomingNodeStateByKey.has(String(part.data?.objectview?.id));
              if (hasExistingLock) continue;
              const aliases = [
                part.data?.key,
                part.data?.objviewRef,
                part.data?.objectview?.id,
                part.data?.objRef,
                part.data?.object?.id,
                part.data?.__dragSessionToken,
              ].filter((v: any) => v !== undefined && v !== null && String(v).length > 0)
                .map((v: any) => String(v));
              aliases.forEach((id) => preserveIncomingNodeStateByKey.set(id, preserveNodeStateUntil));
              const lockedLoc = `${part.location.x} ${part.location.y}`;
              aliases.forEach((id) => lockMovedNodeLocByKey.set(id, { loc: lockedLoc, until: lockNodeLocUntil }));
              // Reinforcement lookup must survive possible node rebind/rekey.
              aliases.forEach((id) => desiredMovedNodeLocByKey.set(id, { x: part.location.x, y: part.location.y }));
            }
          }
          (myDiagram as any).__preserveIncomingNodeStateByKey = preserveIncomingNodeStateByKey;
          (myDiagram as any).__lockMovedNodeLocByKey = lockMovedNodeLocByKey;
          (myDiagram as any).__suppressNodeModelSyncUntil = Date.now() + 180;
          (myDiagram as any).__suppressNodeModelSyncUntil = postMoveSuppressUntil;
          (myDiagram as any).__suppressPropSyncUntil = postMoveSuppressUntil;
          (myDiagram as any).__suppressAutoLayoutUntil = Date.now() + 5000;

          // Stop any existing watchdog - including callbacks already queued
          const existingWatchdog: any = (myDiagram as any).__movedNodeLockWatchdog;
          if (existingWatchdog) {
            try { clearTimeout(existingWatchdog); } catch (_) { }
            try { delete (myDiagram as any).__movedNodeLockWatchdog; } catch (_) { }
          }
          // Increment generation to invalidate old watchdog closures
          const watchdogGeneration = ((myDiagram as any).__watchdogGeneration || 0) + 1;
          (myDiagram as any).__watchdogGeneration = watchdogGeneration;

          // WATCHDOG DISABLED - Testing if it's causing swapback issues
          // The merge function should be sufficient to protect live positions
          /*
          const reinforceMovedNodeLocations = () => {
            try {
              // Stop if this watchdog is from an old generation
              if ((myDiagram as any).__watchdogGeneration !== watchdogGeneration) return;
              const activeTool = myDiagram?.currentTool;
              if (activeTool instanceof go.DraggingTool && activeTool.isActive === true) return;
              const dispatchFn = context.dispatch || myDiagram.dispatch || this.state.dispatch;
              const processedNodeKeys = new Set<string>();
              desiredMovedNodeLocByKey.forEach((desired, key) => {
                const livePart = findLiveNodeByAliases(myDiagram, { key }) as go.Node | null;
                if (!(livePart instanceof go.Node)) return;
                const liveKey = String(livePart?.data?.key || livePart?.key || "");
                if (liveKey && processedNodeKeys.has(liveKey)) return;
                if (liveKey) processedNodeKeys.add(liveKey);
                const desiredPoint = new go.Point(desired.x, desired.y);
                const dx = Math.abs((livePart.location?.x ?? desired.x) - desired.x);
                const dy = Math.abs((livePart.location?.y ?? desired.y) - desired.y);
                if (dx > 0.5 || dy > 0.5) {
                  try { livePart.move(desiredPoint); } catch (_) { }
                }
                const liveData: any = livePart.data || {};
                const loc = `${desired.x} ${desired.y}`;
                try { myDiagram.model.setDataProperty(liveData, 'loc', loc); } catch (_) { liveData.loc = loc; }
                const ov =
                  myModelview.findObjectView(liveData?.objviewRef || key) ||
                  myMetis.findObjectView(liveData?.objviewRef || key) ||
                  liveData.objectview;
                if (!ov) return;
                ov.loc = loc;
                if (typeof liveData.group === 'string') ov.group = liveData.group;
                if (liveData.scale !== undefined) ov.scale = liveData.scale;
                // DON'T dispatch from watchdog - position was already dispatched at end of SelectionMoved.
                // Dispatching here creates infinite loops as each dispatch triggers re-renders.
              });
              try { myDiagram.requestUpdate(); } catch (_) { }
            } catch (_) {
            }
          };
          const watchdogUntil = Date.now() + 12000;
          const runMovedNodeWatchdog = () => {
            try {
              // Stop if this watchdog is from an old generation
              if ((myDiagram as any).__watchdogGeneration !== watchdogGeneration) {
                try { delete (myDiagram as any).__movedNodeLockWatchdog; } catch (_) { }
                return;
              }
              reinforceMovedNodeLocations();
            } catch (_) {
            }
            if (Date.now() >= watchdogUntil) {
              try { delete (myDiagram as any).__movedNodeLockWatchdog; } catch (_) { }
              return;
            }
            // Only reschedule if still the current generation
            if ((myDiagram as any).__watchdogGeneration === watchdogGeneration) {
              (myDiagram as any).__movedNodeLockWatchdog = window.setTimeout(runMovedNodeWatchdog, 120);
            }
          };
          window.setTimeout(reinforceMovedNodeLocations, 0);
          (myDiagram as any).__movedNodeLockWatchdog = window.setTimeout(runMovedNodeWatchdog, 120);
          */
          if (movedAnyGroup) {
            (myDiagram as any).__suppressObjectSingleClickUntil = Math.max(
              Number((myDiagram as any).__suppressObjectSingleClickUntil || 0),
              postMoveSuppressUntil
            );
          }
          // Temporary drag tracing removed.
        } catch (_) {
        }
        try {
          delete (myDiagram as any).__dragAllowReparent;
          delete (myDiagram as any).__dragAllowReparentKeys;
        } catch (_) {
        }
        // Forced array reference change removed - locks should be sufficient to prevent swapback
        // The merge function will protect positions via locks when Redux updates arrive naturally
        // if (myGoModel && myGoModel.nodes) {
        //   myGoModel.nodes = [...myGoModel.nodes];
        // }
        break;
      case "SelectionDeleting": {
      // const newNode = myMetis.currentNode;
      const deletedFlag = true;
      let renameTypes = false;
      const selection = e.subject;
      const data = selection.first().data;
      const isMetamodel = this.isMetamodelType(data.category);
      const nodeDataToForceRemove: any[] = [];
      const linkDataToForceRemove: any[] = [];
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
        try {
          delete (myDiagram as any).__dragAllowReparent;
          delete (myDiagram as any).__dragAllowReparentKeys;
        } catch (_) {
        }
      }
      if (isMetamodel) {
        uic.purgeModelDeletions(myMetis, myDiagram);
        return;
      }
      if (!isMetamodel) {
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
            linkDataToForceRemove.push(data);
          }
        }
      }
      // Handle relationship views marked as deleted in the modelview
      const relshipviews = myModelview.relshipviews;
      for (let i = 0; i < relshipviews.length; i++) {
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
        const isPersistedObjectNode =
          sel instanceof go.Node &&
          data?.category !== constants.gojs.C_OBJECTTYPE &&
          data?.category !== constants.gojs.C_RELATIONSHIP &&
          (
            data?.category === constants.gojs.C_OBJECT ||
            data?.objectview ||
            data?.objviewRef ||
            data?.object ||
            data?.objRef
          );
        if (isPersistedObjectNode) {
          const key = data.key;
          const myNode = this.getNode(context.myGoModel, key);  // Get nodes !!!
          const objview =
            myModelview.findObjectView(myNode?.key || key) ||
            myMetis.findObjectView(data?.objviewRef || key) ||
            data?.objectview;
          const object =
            objview?.object ||
            myNode?.object ||
            data?.object ||
            myModel.findObject(objview?.objectRef || data?.objRef);
          if (objview) {
            objview.markedAsDeleted = true;
            const jsnObjview = new jsn.jsnObjectView(objview);
            modifiedObjectViews.push(jsnObjview);
          }
          if (object) {
            object.markedAsDeleted = !myMetis.deleteViewsOnly;
            const jsnObject = new jsn.jsnObject(object);
            modifiedObjects.push(jsnObject);
          }
          nodeDataToForceRemove.push(data);
        }
      }
    }
    for (let i = 0; i < modifiedObjectViews.length; i++) {
      const objview = modifiedObjectViews[i];
      if (objview.markedAsDeleted) {
        const myNode =
          this.getNode(context.myGoModel, objview.id) ||
          context.myGoModel?.findNodeByViewId?.(objview.id) ||
          context.myGoModel?.findNode?.(objview.id);
        if (myNode) {
          uic.deleteNode(myNode, deletedFlag, context);
          continue;
        }
        const liveDiagramNode =
          myDiagram.findNodeForKey(objview.id) ||
          myDiagram.findPartForKey(objview.id);
        if (liveDiagramNode) {
          try { myDiagram.remove(liveDiagramNode); } catch (_) { }
        }
      }
    }
    for (let i = 0; i < linkDataToForceRemove.length; i++) {
      const linkData = linkDataToForceRemove[i];
      try {
        const liveLinkData = myDiagram.findLinkForKey(linkData?.key)?.data || linkData;
        myDiagram.model.removeLinkData(liveLinkData);
      } catch (_) { }
    }
    for (let i = 0; i < nodeDataToForceRemove.length; i++) {
      const nodeData = nodeDataToForceRemove[i];
      try {
        const liveNodeData = myDiagram.findNodeForKey(nodeData?.key)?.data || nodeData;
        myDiagram.model.removeNodeData(liveNodeData);
      } catch (_) { }
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
      for (let j = 0; j < bucket.nodes.length; j++) {
        const node = bucket.nodes[j];
        const nodeData: any = node?.data || {};
        const currentObjview = nodeData.objectview || myModelview?.findObjectView(nodeData?.key);
        if (isGroupLikeNode(node, nodeData)) {
          resizeGroupToHalfParent(myDiagram, nodeData, node, bucket.targetGroup);
        }
        const nextScale = applyDerivedScaleToPart(myDiagram, node, bucket.targetGroup, currentObjview);
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
        applyDerivedScaleToPart(myDiagram, node, null, currentObjview);
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
    refreshGroupPartRendering(myDiagram, part, data);
  } finally {
    myDiagram.commitTransaction('apply-drop-group-template');
  }
  try {
    myDiagram.layoutDiagram(true);
  } catch (_) {
    try { myDiagram.requestUpdate(); } catch (_) { }
  }
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
    refreshGroupPartRendering(myDiagram, part, data);
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
const resolvePersistentGroupTemplate = (data: any): string => {
  if (isPoolLike(data)) return 'Pool';
  if (isLaneLike(data)) {
    const raw = String(data?.template || data?.category || '');
    return raw === 'Lane_w_handles' ? 'Lane_w_handles' : 'Lane';
  }
  const raw = String(data?.template || data?.category || '');
  return raw || 'groupWithPorts';
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
  laneSpacing = 0
) => {
  if (!diagram || !(poolGroup instanceof go.Group)) {
    return;
  }

  const structuralGroups: Array<{ group: go.Group; kind: 'lane' | 'pool' }> = [];
  const seenStructuralKeys = new Set<string>();
  const registerStructuralGroup = (member: go.Part) => {
    if (!(member instanceof go.Group) || member === poolGroup) return;
    const memberKey = String(member.data?.key || member.key || "");
    if (!memberKey || seenStructuralKeys.has(memberKey)) return;
    if (isLaneLike(member.data)) {
      structuralGroups.push({ group: member, kind: 'lane' });
      seenStructuralKeys.add(memberKey);
      return;
    }
    if (isPoolLike(member.data)) {
      structuralGroups.push({ group: member, kind: 'pool' });
      seenStructuralKeys.add(memberKey);
    }
  };
  poolGroup.memberParts.each((member: go.Part) => {
    registerStructuralGroup(member);
  });
  const poolBounds = poolGroup.actualBounds?.copy();
  if (poolBounds) {
    diagram.nodes.each((member: go.Part) => {
      if (!(member instanceof go.Group) || member === poolGroup) return;
      const groupedToPool = String(member.data?.group || "") === String(poolGroup.data?.key || "");
      const containedByPool = member.containingGroup === poolGroup;
      const overlapsPool = !!member.actualBounds?.intersectsRect?.(poolBounds);
      if (!(groupedToPool || containedByPool || overlapsPool)) return;
      registerStructuralGroup(member);
    });
  }

  if (!structuralGroups.length) {
    return;
  }

  const detectPoolLeftHeaderReserve = (group: go.Group | null | undefined): number => {
    if (!(group instanceof go.Group)) {
      return 34;
    }
    try {
      const poolHeader = group.findObject("POOL_HEADER_STRIP");
      const poolHeaderWidth = poolHeader?.actualBounds?.width;
      if (typeof poolHeaderWidth === "number" && Number.isFinite(poolHeaderWidth) && poolHeaderWidth > 0) {
        return poolHeaderWidth;
      }
    } catch (err) {
      // ignore lookup issues and continue
    }
    let maxWidth = 0;
    const candidateNames = [
      'POOL_HEADER_STRIP',
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
    const fallbackReserve = 34;
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

  structuralGroups.sort((a, b) => {
    const diff = getLaneSortValue(a.group) - getLaneSortValue(b.group);
    if (Math.abs(diff) < 0.5) {
      const aKey = getNodeKey(a.group);
      const bKey = getNodeKey(b.group);
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

  const forcedPoolSizes = (diagram as any).__forcedPoolLayoutSizes || {};
  const forcedPoolSize = forcedPoolSizes[String(poolGroup.data?.key || "")] || null;
  const isNestedInPool = poolGroup.containingGroup instanceof go.Group && isPoolLike(poolGroup.containingGroup.data);
  const effectiveForcedPoolSize = isNestedInPool ? null : forcedPoolSize;
  const poolSize = parseSizeString(poolGroup?.data?.size);
  const poolResizeObject = poolGroup.resizeObject || poolGroup.placeholder || null;
  const poolWidthCandidates: number[] = [];
  if (effectiveForcedPoolSize?.width) {
    poolWidthCandidates.push(effectiveForcedPoolSize.width);
  }
  if (poolResizeObject?.desiredSize?.width) {
    poolWidthCandidates.push(poolResizeObject.desiredSize.width);
  }
  if (poolSize?.width) {
    poolWidthCandidates.push(poolSize.width);
  }
  const poolLeftReserve = detectPoolLeftHeaderReserve(poolGroup);
  const poolContentPanel = poolGroup.findObject("POOL_CONTENT_PANEL") as go.GraphObject | null;
  const poolContentAnchor = poolGroup.findObject("POOL_CONTENT_ANCHOR") as go.GraphObject | null;
  const lanePaddingLeft = 0;
  const lanePaddingRight = 0;
  const laneRightVisualInset = 0;
  const laneTopMargin = 0;
  const laneBottomMargin = 0;
  const minLaneWidth = 120;
  const minPoolWidth = poolLeftReserve + lanePaddingLeft + minLaneWidth + lanePaddingRight + laneRightVisualInset;
  const preservePoolWidths = (diagram as any).__preserveResizedPoolWidths as Set<string> | undefined;
  const preserveWidth =
    !!preservePoolWidths?.has(String(poolGroup.data?.key || "")) ||
    !!effectiveForcedPoolSize;
  let measuredLaneStackWidth = 0;
  structuralGroups.forEach(({ group, kind }) => {
    const laneSizeData = parseSizeString(group?.data?.size);
    const resizeObject = group.resizeObject || group.placeholder || group;
    const laneBounds = group.actualBounds?.copy();
    const baseWidth =
      (typeof laneSizeData?.width === 'number' && Number.isFinite(laneSizeData.width) && laneSizeData.width > 0)
        ? laneSizeData.width
        : Math.max(
            (typeof resizeObject?.desiredSize?.width === 'number' && Number.isFinite(resizeObject.desiredSize.width) && resizeObject.desiredSize.width > 0) ? resizeObject.desiredSize.width : 0,
            (typeof laneBounds?.width === 'number' && Number.isFinite(laneBounds.width) && laneBounds.width > 0) ? laneBounds.width : 0,
            120
          );
    if (kind === 'lane') {
      const laneHeader = group.findObject("LANE_HEADER_STRIP") as go.GraphObject | null;
      const laneHeaderWidth =
        (typeof laneHeader?.actualBounds?.width === 'number' && Number.isFinite(laneHeader.actualBounds.width) && laneHeader.actualBounds.width > 0)
          ? laneHeader.actualBounds.width
          : 36;
      measuredLaneStackWidth = Math.max(measuredLaneStackWidth, baseWidth + laneHeaderWidth);
    } else {
      measuredLaneStackWidth = Math.max(measuredLaneStackWidth, baseWidth);
    }
  });
  let poolWidth = preserveWidth
    ? Math.max(effectiveForcedPoolSize?.width || 0, poolSize?.width || 0, minPoolWidth)
    : Math.max(
        effectiveForcedPoolSize?.width || 0,
        measuredLaneStackWidth + poolLeftReserve + lanePaddingLeft + lanePaddingRight + laneRightVisualInset,
        minPoolWidth
      );

  const model = diagram.model;
  const measuredInnerWidth = (() => {
    if (preserveWidth) return 0;
    const bounds = (poolContentAnchor || poolContentPanel)?.getDocumentBounds?.();
    if (bounds?.width && Number.isFinite(bounds.width) && bounds.width > 0) return bounds.width;
    return 0;
  })();
  const initialLaneWidthAvailable = Math.max(
    (measuredInnerWidth > 0 ? measuredInnerWidth : (poolWidth - poolLeftReserve)) - lanePaddingLeft - lanePaddingRight - laneRightVisualInset,
    minLaneWidth
  );

  const laneLayouts: Array<{
    group: go.Group;
    kind: 'lane' | 'pool';
    height: number;
    topY: number;
  }> = [];
  const nestedPoolsToRelayout: go.Group[] = [];

  structuralGroups.forEach(({ group, kind }) => {
    const laneSizeData = parseSizeString(group?.data?.size);
    const resizeObject = group.resizeObject || group.placeholder || group;
    const laneBounds = group.actualBounds?.copy();
    const desiredSize = resizeObject?.desiredSize;

    const laneHeight =
      (typeof laneSizeData?.height === 'number' && Number.isFinite(laneSizeData.height) && laneSizeData.height > 0)
        ? laneSizeData.height
        : Math.max(
            (typeof desiredSize?.height === 'number' && Number.isFinite(desiredSize.height) && desiredSize.height > 0) ? desiredSize.height : 0,
            (typeof laneBounds?.height === 'number' && Number.isFinite(laneBounds.height) && laneBounds.height > 0) ? laneBounds.height : 0,
            260
          );

    laneLayouts.push({
      group,
      kind,
      height: laneHeight,
      topY: 0,
    });
  });

  const finalLaneWidthAvailable = Math.max(
    poolWidth - poolLeftReserve - lanePaddingLeft - lanePaddingRight - laneRightVisualInset,
    minLaneWidth
  );

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

  laneLayouts.forEach((layout) => {
    const lane = layout.group;
    const laneHeight = layout.height;
    const laneTotalWidth = finalLaneWidthAvailable;
    const isLaneGroup = layout.kind === 'lane';
    const laneHeader = isLaneGroup ? lane.findObject("LANE_HEADER_STRIP") as go.GraphObject | null : null;
    const laneHeaderWidth =
      isLaneGroup && typeof laneHeader?.actualBounds?.width === 'number' && Number.isFinite(laneHeader.actualBounds.width) && laneHeader.actualBounds.width > 0
        ? laneHeader.actualBounds.width
        : 36;
    const laneBodyWidth = isLaneGroup ? Math.max(20, laneTotalWidth - laneHeaderWidth) : laneTotalWidth;
    const laneMain = lane.findObject("LANE_MAIN") as go.GraphObject | null;
    const laneBodyPanel = lane.findObject("BODY") as go.GraphObject | null;
    const laneBody = lane.findObject("LANE_BODY_SHAPE") as go.GraphObject | null;
    const laneMainShape = lane.findObject("LANE_MAIN_SHAPE") as go.GraphObject | null;
    const childPoolShape = !isLaneGroup ? lane.findObject("POOL_SHAPE") as go.GraphObject | null : null;

    const laneTopLeftX = poolLocation.x + poolLeftReserve + lanePaddingLeft;
    const laneTopLeft = new go.Point(laneTopLeftX, layout.topY);
    let laneLocationPoint = laneTopLeft;
    try {
      const spot = lane.locationSpot;
      if (spot && typeof spot.equals === 'function' && spot.equals(go.Spot.Center)) {
        laneLocationPoint = new go.Point(
          laneTopLeftX + laneTotalWidth / 2,
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

    const newLaneMainSize = new go.Size(laneTotalWidth, laneHeight);
    const resizeObject = lane.resizeObject || lane.placeholder || lane;
    if (resizeObject) {
      resizeObject.desiredSize = newLaneMainSize;
    }
    if (isLaneGroup && laneMain) {
      (laneMain as any).desiredSize = newLaneMainSize;
      (laneMain as any).width = laneTotalWidth;
      (laneMain as any).height = laneHeight;
    }
    if (isLaneGroup && laneMainShape) {
      (laneMainShape as any).desiredSize = newLaneMainSize;
      (laneMainShape as any).width = laneTotalWidth;
      (laneMainShape as any).height = laneHeight;
    }
    if (isLaneGroup && laneBodyPanel) {
      (laneBodyPanel as any).desiredSize = new go.Size(laneBodyWidth, laneHeight);
      (laneBodyPanel as any).width = laneBodyWidth;
      (laneBodyPanel as any).height = laneHeight;
    }
    if (isLaneGroup && laneBody) {
      (laneBody as any).desiredSize = new go.Size(laneBodyWidth, laneHeight);
      (laneBody as any).width = laneBodyWidth;
      (laneBody as any).height = laneHeight;
    }
    if (!isLaneGroup && childPoolShape) {
      (childPoolShape as any).desiredSize = newLaneMainSize;
      (childPoolShape as any).width = laneTotalWidth;
      (childPoolShape as any).height = laneHeight;
      nestedPoolsToRelayout.push(lane);
    }
    try {
      lane.desiredSize = newLaneMainSize;
    } catch (err) {
      // ignore if lane does not support desiredSize assignment
    }
    if (lane.data) {
      const sizeString = `${laneBodyWidth} ${laneHeight}`;
      if (model && typeof model.setDataProperty === 'function') {
        model.setDataProperty(lane.data, 'size', sizeString);
        if (poolGroup.data?.key && lane.data.group !== poolGroup.data.key) {
          if (typeof (model as any).setGroupKeyForNodeData === 'function') {
            (model as any).setGroupKeyForNodeData(lane.data, poolGroup.data.key);
          } else {
            model.setDataProperty(lane.data, 'group', poolGroup.data.key);
          }
        }
      } else {
        lane.data.size = sizeString;
        if (poolGroup.data?.key) lane.data.group = poolGroup.data.key;
      }
    }
    updateGroupObjectView(lane, laneLocationPoint, new go.Size(laneBodyWidth, laneHeight));

    lane.ensureBounds();
  });

  if (poolResizeObject instanceof go.GraphObject) {
    const desiredHeight = Math.max(totalHeight, 80);
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
  nestedPoolsToRelayout.forEach((nestedPool) => {
    if (nestedPool !== poolGroup) {
      relayoutPoolGroupAfterLaneChanges(diagram, nestedPool, laneSpacing);
    }
  });
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
  if (isLaneLike(partData) && diagramNode instanceof go.Group) {
    const targetLane = diagramNode.containingGroup instanceof go.Group && isLaneLike(diagramNode.containingGroup.data)
      ? diagramNode.containingGroup
      : null;
    const targetPool = targetLane?.containingGroup instanceof go.Group && isPoolLike(targetLane.containingGroup.data)
      ? targetLane.containingGroup
      : (diagramNode.containingGroup instanceof go.Group && isPoolLike(diagramNode.containingGroup.data)
        ? diagramNode.containingGroup
        : null);
    if (targetPool instanceof go.Group) {
      const memberSet = new go.Set<go.Part>();
      memberSet.add(diagramNode);
      try {
        targetPool.addMembers(memberSet, true);
      } catch (_) {
      }
      if (diagramNode.data) {
        try {
          myDiagram.model.setGroupKeyForNodeData(diagramNode.data, String(targetPool.key));
        } catch (_) {
          try { myDiagram.model.setDataProperty(diagramNode.data, 'group', String(targetPool.key)); } catch (_) { }
        }
      }
      affectedPoolKeys.add(String(targetPool.key));
      lanesDroppedIntoPool = true;
    }
  }
  const gjsNode = node?.data || partData;
  const isMetamodelTypeDrop = partData?.type === constants.types.OBJECTTYPE_ID;

  if (isMetamodelTypeDrop) {
    try {
      myDiagram.model.setDataProperty(partData, 'category', constants.gojs.C_OBJECTTYPE);
      myDiagram.model.setDataProperty(partData, 'type', constants.types.OBJECTTYPE_ID);
    } catch (_) {
      partData.category = constants.gojs.C_OBJECTTYPE;
      partData.type = constants.types.OBJECTTYPE_ID;
    }
    if (!partData.name || String(partData.name).trim() === '') {
      partData.name = 'New Object Type';
    }
    if (!partData.viewkind) {
      partData.viewkind = constants.viewkinds.OBJ;
    }
    if (!partData.size || partData.size === '') {
      partData.size = '160 70';
    }

    const otype = uic.createObjectType(partData, context);
    if (otype) {
      otype.typename = constants.types.OBJECTTYPE_NAME;
      const jsnObjtype = new jsn.jsnObjectType(otype, true);
      modifiedObjectTypes.push(jsnObjtype);

      const jsnObjtypeView = new jsn.jsnObjectTypeView(otype.typeview);
      modifiedObjectTypeViews.push(jsnObjtypeView);

      const loc = partData.loc;
      const size = partData.size;
      const objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), context.myMetamodel, otype, loc, size);
      const jsnObjtypeGeo = new jsn.jsnObjectTypegeo(objtypeGeo);
      modifiedObjectTypeGeos.push(jsnObjtypeGeo);

      partData.objecttype = otype;
      partData.objtypeRef = otype.id;
      partData.typeview = otype.typeview;
      uid.editObjectType(partData, myMetis, myDiagram);
    }
    return;
  }

  let type: akm.cxObjectType = partData.objecttype;
  let typeview: akm.cxObjectTypeView = partData.typeview;
  let objview: akm.cxObjectView;
  let objId: string;
  let object: akm.cxObject;
  let objName: string;
  let objDescr: string;
  let droppedModelObject = false;
  const isObjectTypeDrop = Boolean(
    partData.category === constants.gojs.C_OBJECTTYPE ||
    partData.type === constants.types.OBJECTTYPE_ID ||
    ((partData.objecttype || partData.objtypeRef) &&
      (!partData.objRef || String(partData.objRef) === String(partData.objtypeRef)))
  );
  if (isObjectTypeDrop) {
    type = (partData.objtypeRef ? myMetis.findObjectType(partData.objtypeRef) : null) || type;
    typeview = type?.typeview || typeview || partData.typeview;
    if (!typeview && typeof (type as any)?.getDefaultTypeView === 'function') {
      typeview = (type as any).getDefaultTypeView();
    }
    if (!typeview && type && typeof (type as any)?.newDefaultTypeView === 'function') {
      typeview = (type as any).newDefaultTypeView(type.viewkind || constants.viewkinds.OBJ);
      type.setDefaultTypeView(typeview);
    }
  }
  if (!isObjectTypeDrop) { // An existing object has been dropped from the object palette
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
      const templateName = isContainer
        ? resolvePersistentGroupTemplate(partData)
        : (partData.template || partData.category || constants.gojs.C_NODETEMPLATE);
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
        objview.template = templateName;
        partData.template = templateName;
        if (typeof myDiagram?.model?.setCategoryForNodeData === 'function') {
          myDiagram.model.setCategoryForNodeData(partData, templateName);
        } else {
          partData.category = templateName;
        }
        if (diagramNode?.data) {
          diagramNode.data.template = templateName;
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
      objview.size = isContainer
        ? getPersistedGroupSize(diagramNode || partData)
        : partData.size;
      objview = uic.setObjviewColors(partData, object, objview, typeview, myDiagram);
      object.addObjectView(objview);
      myModelview.addObjectView(objview);
      myModelview.setFocusObjectview(objview);
      myMetis.addObjectView(objview);
      droppedModelObject = true;
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
        data = safeJsonCloneForDispatch(data);
        myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data });
      });
    }
    if (objview && object) {
      const objvIdName = { id: objview.id, name: objview.name };
      const objIdName = { id: object.id, name: object.name };
      myDiagram.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: objvIdName });
      myDiagram.dispatch({ type: 'SET_FOCUS_OBJECT', data: objIdName });
    }
  } else { // An ObjectType has been dropped - create a new typed object
    if (!type || !typeview) return;
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
    object.setType(type);
    partData.name = objName;
    if (node?.data) {
      myDiagram.model.setDataProperty(node.data, 'name', objName);
    }
    object.parentModelRef = myModel.id;
    myModel.addObject(object);
    myMetis.addObject(object);
    console.log('1241 node, data', node, partData);
    // Find the objectview
    objview = myModelview.findObjectView(partData.key);
    if (!objview) {
      objview = new akm.cxObjectView(partData.key, objName, object, partData.description, myModelview);
      objview.name = objName;
      objview.objectRef = object.id;
      objview.setTypeView(typeview);
      const isContainer = Boolean(
        partData.viewkind === constants.viewkinds.CONT ||
        type?.viewkind === constants.viewkinds.CONT ||
        (typeof (type as any)?.isContainer === 'function' && (type as any).isContainer())
      );
      objview.isGroup = isContainer;
      const typeName = type?.name || objview?.object?.type?.name;
      const templateName = isContainer
        ? resolvePersistentGroupTemplate(partData)
        : (partData.template || partData.category || constants.gojs.C_NODETEMPLATE);
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
        objview.template = templateName;
        partData.template = templateName;
        if (typeof myDiagram?.model?.setCategoryForNodeData === 'function') {
          myDiagram.model.setCategoryForNodeData(partData, templateName);
        } else {
          partData.category = templateName;
        }
        if (diagramNode?.data) {
          diagramNode.data.template = templateName;
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
      objview.groupLayout = partData.groupLayout;
      object.addObjectView(objview);
      myModelview.addObjectView(objview);
      myMetis.addObjectView(objview);
      droppedModelObject = true;
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
    const persistentTemplate = objview.isGroup ? resolvePersistentGroupTemplate(objview.template ? objview : data) : '';
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
    setProp('typeviewRef', typeview?.id || '');
    setProp('name', object.name || type?.name || 'Object');
    setProp('text', object.name || type?.name || 'Object');
    setProp('typename', type?.name || '');
    setProp('typeName', type?.name || '');
    if (persistentTemplate) {
      setProp('template', persistentTemplate);
      setProp('category', persistentTemplate);
    }
    if (data.category === constants.gojs.C_OBJECTTYPE) {
      setProp('category', data.template || constants.gojs.C_NODETEMPLATE);
    }
  };

  syncDroppedPartRefs(partData);
  if (diagramNode?.data && diagramNode.data !== partData) {
    syncDroppedPartRefs(diagramNode.data);
  }
  // The palette copy and template swap happen inside the same drop event.
  // Refresh both text bindings immediately so the instance name and typename
  // do not wait for another model change or selection cycle to appear.
  try { diagramNode?.updateTargetBindings?.('name'); } catch (_) {}
  try { diagramNode?.updateTargetBindings?.('text'); } catch (_) {}
  try { diagramNode?.updateTargetBindings?.('typename'); } catch (_) {}
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
    part.template = resolvePersistentGroupTemplate(part);
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
    objview.size = part.isGroup ? getPersistedGroupSize(part) : part.size;
    objview.setModified();
    myModelview.addObjectView(objview);
    myMetis.addObjectView(objview);
    droppedModelObject = true;
  } else {
    objview.loc = part.loc;
    objview.size = part.isGroup ? getPersistedGroupSize(part) : part.size;
  }
  if (part.isGroup) {
    objview.isGroup = true;
    objview.viewkind = constants.viewkinds.CONT;
    objview.template = resolvePersistentGroupTemplate(part);
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
  const droppedPartIsGroup = Boolean(part?.isGroup) || isGroupLikeNode(goNode, part);
  let group = containingGroupKey
    ? myGoModel.findNode(containingGroupKey)
    : null;
  if (!group && !droppedPartIsGroup) {
    group = uic.getGroupByLocation(myGoModel, part.loc, part.size, goNode);
  }
  if (group) {
    const parentgroup = group;
    goNode.group = parentgroup.key;
    goNode.objectview.group = parentgroup.objviewRef;
    myDiagram.model.setDataProperty(part, "group", goNode.group);
    let nextScale = 1.0;
    if (isGroupLikeNode(goNode, part)) {
      const parentPart = myDiagram.findNodeForKey(parentgroup.key) as go.Group | null;
      resizeGroupToHalfParent(myDiagram, part, node, parentPart);
      nextScale = applyDerivedScaleToPart(myDiagram, node, parentPart, goNode.objectview, goNode);
    } else {
      nextScale = applyDerivedScaleToPart(myDiagram, node, myDiagram.findNodeForKey(parentgroup.key) as go.Group | null, goNode.objectview, goNode);
    }
    part.scale = Number(nextScale);
    gjsNode.scale = part.scale
    goNode.objectview.scale = part.scale;
    // Check if the node has a relationship (contains) FROM a group, if not create it
    const myHasPartReltype = myMetamodel.findRelationshipTypeByName(constants.types.AKM_CONTAINS);
    const parenttype = parentgroup.objecttype;
    const parentObj = parentgroup.object;
    const childtype = type;
    const childObj = object;
    const myHasPartRelship = myModel.findRelationship1(parentObj, childObj, myHasPartReltype, null, null);

    // Check if metamodel allows "contains" relationship between these specific object types
    const parentObjType = parentObj?.type;
    const childObjType = childObj?.type;
    const isAllowedByMetamodel =
      myHasPartReltype &&
      parentObjType &&
      childObjType &&
      myHasPartReltype.isAllowedFromType(parentObjType, true) &&
      myHasPartReltype.isAllowedToType(childObjType, true);

    if (!myHasPartRelship && parentObj && childObj && isAllowedByMetamodel) {
      // Create the relationship only if metamodel allows it
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
    } else if (!myHasPartRelship && parentObj && childObj && !isAllowedByMetamodel) {
      console.log(`[DROP-CONTAINS-BLOCKED] Metamodel does not allow "contains" from ${parentObjType?.name} to ${childObjType?.name}, skipping auto-creation on drop`);
    }
  } else {
    goNode.group = "";
    goNode.objectview.group = "";
    try { myDiagram.model.setDataProperty(part, "group", ""); } catch (_) { part.group = ""; }
    objview.group = "";
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
  if (!droppedModelObject && part.type === 'objecttype') {
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

      part.objecttype = otype;
      part.objtypeRef = otype.id;
      part.typeview = otype.typeview;
      uid.editObjectType(part, myMetis, myDiagram);
    }
  } else if (object && objview) { // object
    const jsnObjview = new jsn.jsnObjectView(objview);
    (jsnObjview as any).modelviewId = myModelview?.id;
    modifiedObjectViews.push(jsnObjview);
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
  data = safeJsonCloneForDispatch(data);
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
  try {
    myDiagram.layoutDiagram(true);
  } catch (_) {
    try { myDiagram.requestUpdate(); } catch (_) { }
  }
}
if (shouldZoomToFitAfterDrop && myDiagram) {
  myDiagram.commandHandler.zoomToFit();
}
break;
      }
      case "ObjectDoubleClicked": {
  const clickedPortObject = resolveClickedPortGraphObject(e.subject);
  if (clickedPortObject) {
    break;
  }
  const suppressUntil = Number((myDiagram as any)?._suppressObjectDoubleClickUntil || 0);
  if (suppressUntil > Date.now()) {
    try { (myDiagram as any)._suppressObjectDoubleClickUntil = 0; } catch (_) { }
    break;
  }
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
  const suppressUntil = Number((myDiagram as any)?.__spacePanSuppressClickUntil || 0);
  const suppressObjectSingleClickUntil = Number((myDiagram as any)?.__suppressObjectSingleClickUntil || 0);
  const activeTool = myDiagram?.currentTool;
  const suppressObjectSingleClick =
    suppressUntil > Date.now() ||
    suppressObjectSingleClickUntil > Date.now() ||
    (activeTool instanceof go.DraggingTool && activeTool.isActive === true);
  if (suppressObjectSingleClick) {
    break;
  }
  const clickedPortObject = resolveClickedPortGraphObject(e.subject);
  if (clickedPortObject) {
    break;
  }
  const sel = e.subject.part;
  let data = sel.data;
  // sel.location = data.loc;
  if (debug) console.log('1313 selected', data, sel);
  if (data?.category === constants.gojs.C_RELATIONSHIP) {
    const relview =
      myModelview.findRelationshipView(data?.relviewRef || data?.key) ||
      myMetis.findRelationshipView(data?.relviewRef || data?.key) ||
      data?.relshipview;
    const relship =
      myModel.findRelationship(data?.relshipRef) ||
      myMetis.findRelationship(data?.relshipRef) ||
      relview?.relship;
    const reltype =
      relship?.type ||
      myMetamodel?.findRelationshipType(relship?.typeRef) ||
      myMetis.findRelationshipType(data?.reltypeRef);
    if (relview) {
      context.dispatch({ type: 'SET_FOCUS_RELSHIPVIEW', data: { id: relview.id, name: relview.name || '' } });
    }
    if (relship) {
      context.dispatch({ type: 'SET_FOCUS_RELSHIP', data: { id: relship.id, name: relship.name || '' } });
    }
    if (reltype) {
      context.dispatch({ type: 'SET_FOCUS_RELSHIPTYPE', data: { id: reltype.id, name: reltype.name || '' } });
    }
    break;
  }
  let objectview = myModelview.findObjectView(data?.key);
  if (!objectview) objectview = myModelview.findObjectView(data?.fromNode?.key);
  const object = objectview?.object;
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
    const objtype = object?.type || myMetamodel?.findObjectType(object?.typeRef);
    const objtypeIdName = objtype ? { id: objtype.id, name: objtype.name } : { id: '', name: '' };

    if (debug) console.log('1072 SET_FOCUS_OBJECTVIEW', objvIdName, objIdName)
    context.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: objvIdName });
    context.dispatch({ type: 'SET_FOCUS_OBJECT', data: objIdName });
    context.dispatch({ type: 'SET_FOCUS_OBJECTTYPE', data: objtypeIdName });
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
        const laneMain = n.findObject("LANE_MAIN_SHAPE") as go.GraphObject | null;
        const laneHeader = n.findObject("LANE_HEADER_STRIP") as go.GraphObject | null;
        const laneBody = n.findObject("LANE_BODY_SHAPE") as go.GraphObject | null;
        if (laneBody || laneMain) {
          const headerWidth = laneHeader ? laneHeader.actualBounds.width : 36;
          const resizedMain = n.resizeObjectName === "LANE_MAIN";
          const sourceWidth = resizedMain
            ? Math.max(20, (laneMain?.actualBounds.width || 0) - headerWidth)
            : (laneBody ? laneBody.actualBounds.width : Math.max(20, (laneMain?.actualBounds.width || 0) - headerWidth));
          const sourceHeight = resizedMain
            ? (laneMain?.actualBounds.height || 0)
            : (laneBody ? laneBody.actualBounds.height : (laneMain?.actualBounds.height || 0));
          const nextBodyWidth = Math.max(20, sourceWidth);
          const nextBodyHeight = Math.max(20, sourceHeight);
          if (laneBody) {
            (laneBody as any).width = nextBodyWidth;
            (laneBody as any).height = nextBodyHeight;
          }
          const bodySize = `${nextBodyWidth} ${nextBodyHeight}`;
          myDiagram.model.setDataProperty(n.data, "size", bodySize);
        }
      } else if (category === 'Pool') {
        const poolShape = n.findObject("POOL_SHAPE") as go.GraphObject | null;
        const resizedWidth =
          (typeof poolShape?.actualBounds?.width === 'number' && Number.isFinite(poolShape.actualBounds.width) && poolShape.actualBounds.width > 0)
            ? poolShape.actualBounds.width
            : (typeof n.actualBounds?.width === 'number' && Number.isFinite(n.actualBounds.width) ? n.actualBounds.width : 0);
        const resizedHeight =
          (typeof poolShape?.actualBounds?.height === 'number' && Number.isFinite(poolShape.actualBounds.height) && poolShape.actualBounds.height > 0)
            ? poolShape.actualBounds.height
            : (typeof n.actualBounds?.height === 'number' && Number.isFinite(n.actualBounds.height) ? n.actualBounds.height : 0);
        if (resizedWidth > 0 && resizedHeight > 0) {
          myDiagram.model.setDataProperty(n.data, "size", `${resizedWidth} ${resizedHeight}`);
          const forcedPoolSizes = (myDiagram as any).__forcedPoolLayoutSizes || {};
          forcedPoolSizes[String(n.data.key)] = { width: resizedWidth, height: resizedHeight };
          (myDiagram as any).__forcedPoolLayoutSizes = forcedPoolSizes;
          syncPoolLaneWidthsToPool(String(n.data.key));
        }
      } else {
        const resizeObject = (n.resizeObject || n.findObject?.("SHAPE") || n.findObject?.("BODY")) as go.GraphObject | null;
        const resizedWidth =
          (typeof resizeObject?.desiredSize?.width === 'number' && Number.isFinite(resizeObject.desiredSize.width) && resizeObject.desiredSize.width > 0)
            ? resizeObject.desiredSize.width
            : (typeof resizeObject?.actualBounds?.width === 'number' && Number.isFinite(resizeObject.actualBounds.width) && resizeObject.actualBounds.width > 0)
              ? resizeObject.actualBounds.width
              : (typeof n.actualBounds?.width === 'number' && Number.isFinite(n.actualBounds.width))
                ? n.actualBounds.width
            : 0;
        const resizedHeight =
          (typeof resizeObject?.desiredSize?.height === 'number' && Number.isFinite(resizeObject.desiredSize.height) && resizeObject.desiredSize.height > 0)
            ? resizeObject.desiredSize.height
            : (typeof resizeObject?.actualBounds?.height === 'number' && Number.isFinite(resizeObject.actualBounds.height) && resizeObject.actualBounds.height > 0)
              ? resizeObject.actualBounds.height
              : (typeof n.actualBounds?.height === 'number' && Number.isFinite(n.actualBounds.height))
                ? n.actualBounds.height
            : 0;
        if (resizedWidth > 0 && resizedHeight > 0) {
          myDiagram.model.setDataProperty(n.data, "size", `${resizedWidth} ${resizedHeight}`);
        }
      }
      objview.loc = n.data.loc;
      objview.size = n.data.size;
      let myNode = myGoModel.findNodeByViewId(n.data.key);
      myNode.size = objview.size;
      myNode.key = objview.id;
      if (category === 'Pool') {
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
    const pendingPoolKeys = new Set<string>((myDiagram as any).__pendingResizedPoolKeys || []);
    resizedPoolKeys.forEach((key) => pendingPoolKeys.add(String(key)));
    (myDiagram as any).__pendingResizedPoolKeys = pendingPoolKeys;
    if ((myDiagram as any).__pendingPoolResizeRelayoutTimer) {
      clearTimeout((myDiagram as any).__pendingPoolResizeRelayoutTimer);
    }
    (myDiagram as any).__pendingPoolResizeRelayoutTimer = setTimeout(() => {
      delete (myDiagram as any).__pendingPoolResizeRelayoutTimer;
      const pendingKeys = new Set<string>((myDiagram as any).__pendingResizedPoolKeys || []);
      delete (myDiagram as any).__pendingResizedPoolKeys;
      if (pendingKeys.size === 0) return;
      (myDiagram as any).__preserveResizedPoolWidths = pendingKeys;
      pendingKeys.forEach((poolKey) => syncPoolLaneWidthsToPool(poolKey));
      pendingKeys.forEach((poolKey) => normalizeSwimlanePool(poolKey));
      delete (myDiagram as any).__preserveResizedPoolWidths;
    }, 60);
    if (affectedPoolKeys.size > resizedPoolKeys.size) {
      const nonResizedAffectedPoolKeys = new Set<string>();
      affectedPoolKeys.forEach((key) => {
        if (!resizedPoolKeys.has(key)) nonResizedAffectedPoolKeys.add(key);
      });
      relayoutPoolsByKeys(nonResizedAffectedPoolKeys);
    }
  } else {
    if (resizedPoolKeys.size > 0) {
      (myDiagram as any).__preserveResizedPoolWidths = resizedPoolKeys;
      resizedPoolKeys.forEach((poolKey) => syncPoolLaneWidthsToPool(poolKey));
      resizedPoolKeys.forEach((poolKey) => normalizeSwimlanePool(poolKey));
    }
    const nonResizedAffectedPoolKeys = new Set<string>();
    affectedPoolKeys.forEach((key) => {
      if (!resizedPoolKeys.has(key)) nonResizedAffectedPoolKeys.add(key);
    });
    relayoutPoolsByKeys(nonResizedAffectedPoolKeys);
    if (resizedPoolKeys.size > 0) {
      delete (myDiagram as any).__preserveResizedPoolWidths;
    }
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
  let toModel = myModel;
  let fromGoModel = myMetis.gojsModel;
  let toGoModel = myMetis.gojsModel;
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
      const pastedLiveGroupKey =
        typeof gjsNode?.group === "string" && gjsNode.group.length > 0
          ? String(gjsNode.group)
          : "";
      const copiedGroupKey =
        typeof myCopiedNode?.group === "string" && myCopiedNode.group.length > 0
          ? String(myCopiedNode.group)
          : "";
      const copiedObjectviewGroupKey =
        typeof myCopiedNode?.objectview?.group === "string" && myCopiedNode.objectview.group.length > 0
          ? String(myCopiedNode.objectview.group)
          : "";
      myPastedNode.group = pastedLiveGroupKey || copiedGroupKey || copiedObjectviewGroupKey || "";
      myPastedNode.isGroup = gjsNode.isGroup;
      myPastedNode.objectview.loc = myPastedNode.loc;
      myPastedNode.objectview.size = myPastedNode.size;
      myPastedNode.objectview.group = myPastedNode.group;
      myPastedNode.objectview.readOnly = readOnly;
      myPastedNode.objecttype = myCopiedNode.objecttype;
      try {
        myDiagram.model.setDataProperty(gjsNode, "key", myPastedNode.objviewId);
      } catch (_) {
        try { gjsNode.key = myPastedNode.objviewId; } catch (_err) { }
      }
      try { myDiagram.model.setDataProperty(gjsNode, "objectview", myPastedNode.objectview); } catch (_) { gjsNode.objectview = myPastedNode.objectview; }
      try { myDiagram.model.setDataProperty(gjsNode, "object", myPastedNode.object); } catch (_) { gjsNode.object = myPastedNode.object; }
      try { myDiagram.model.setDataProperty(gjsNode, "objecttype", myPastedNode.objecttype); } catch (_) { gjsNode.objecttype = myPastedNode.objecttype; }
      try { myDiagram.model.setDataProperty(gjsNode, "objviewRef", myPastedNode.objectview?.id); } catch (_) { gjsNode.objviewRef = myPastedNode.objectview?.id; }
      try { myDiagram.model.setDataProperty(gjsNode, "objRef", myPastedNode.object?.id); } catch (_) { gjsNode.objRef = myPastedNode.object?.id; }
      try { myDiagram.model.setDataProperty(gjsNode, "objtypeRef", myPastedNode.objecttype?.id); } catch (_) { gjsNode.objtypeRef = myPastedNode.objecttype?.id; }
      try { myDiagram.model.setDataProperty(gjsNode, "group", myPastedNode.group || ""); } catch (_) { gjsNode.group = myPastedNode.group || ""; }
      try { myDiagram.model.setDataProperty(gjsNode, "fromNode", null); } catch (_) { gjsNode.fromNode = null; }
      try { myDiagram.model.setDataProperty(gjsNode, "fromModelview", null); } catch (_) { gjsNode.fromModelview = null; }
      try { myDiagram.model.setDataProperty(gjsNode, "fromGoModel", null); } catch (_) { gjsNode.fromGoModel = null; }
      const livePastedPart = it.value as go.Node;
      if (livePastedPart?.data) {
        livePastedPart.data.objectview = myPastedNode.objectview;
        livePastedPart.data.object = myPastedNode.object;
        livePastedPart.data.objecttype = myPastedNode.objecttype;
        livePastedPart.data.objviewRef = myPastedNode.objectview?.id;
        livePastedPart.data.objRef = myPastedNode.object?.id;
        livePastedPart.data.objtypeRef = myPastedNode.objecttype?.id;
        livePastedPart.data.group = myPastedNode.group || "";
        livePastedPart.data.fromNode = null;
        livePastedPart.data.fromModelview = null;
        livePastedPart.data.fromGoModel = null;
      }
      let existingPastedGoNode = toGoModel.findNode(myPastedNode.goNodeId) || toGoModel.findNodeByViewId?.(myPastedNode.objviewId);
      if (!existingPastedGoNode && gjsNode?.key) {
        existingPastedGoNode = toGoModel.findNode(gjsNode.key) || toGoModel.findNodeByViewId?.(gjsNode.key);
      }
      if (existingPastedGoNode) {
        existingPastedGoNode.key = myPastedNode.goNodeId;
        existingPastedGoNode.loc = myPastedNode.loc;
        existingPastedGoNode.size = myPastedNode.size;
        existingPastedGoNode.group = myPastedNode.group;
        existingPastedGoNode.objectview = myPastedNode.objectview;
        existingPastedGoNode.object = myPastedNode.object;
        existingPastedGoNode.objecttype = myPastedNode.objecttype;
        existingPastedGoNode.objRef = myPastedNode.object?.id;
        existingPastedGoNode.objviewRef = myPastedNode.objectview?.id;
        existingPastedGoNode.objtypeRef = myPastedNode.objecttype?.id;
        myPastedNode.goNode = existingPastedGoNode;
      } else {
        myPastedNode.goNode = new gjs.goObjectNode(myPastedNode.goNodeId, toGoModel, myPastedNode.objectview);
        myPastedNode.goNode.group = myPastedNode.group;
        toGoModel.addNode(myPastedNode.goNode);
      }
      toModelview.addObjectView(myPastedNode.objectview);
      myMetis.addObjectView(myPastedNode.objectview);
      myMetis.setGojsModel(toGoModel);
      pastedNodes.push(myPastedNode);
      if (debug) console.log('Checkpoint');
    }
  }
  for (let i = 0; i < copiedNodes.length; i++) {
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
      for (let i = 0; i < pastedNodes.length; i++) {
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
      for (let i = 0; i < pastedNodes.length; i++) {
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
      pastedRelview.toObjview = pastedToObjview;
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

  // Finally handle groups for the pasted nodes only.
  for (let i = 0; i < pastedNodes.length; i++) {
    const pastedNode = pastedNodes[i];
    const myGoNode = pastedNode?.goNode || toGoModel.findNode(pastedNode?.goNodeId) || toGoModel.findNodeByViewId?.(pastedNode?.objviewId);
    if (!myGoNode) continue;
    const myObjectview: akm.cxObjectView = myGoNode.objectview;
    const liveNodePart = myDiagram.findNodeForKey(myGoNode.key) as go.Node | null;
    const liveContainingGroupKey =
      liveNodePart?.containingGroup instanceof go.Group && liveNodePart.containingGroup.key !== undefined && liveNodePart.containingGroup.key !== null
        ? String(liveNodePart.containingGroup.key)
        : "";
    const liveDataGroupKey =
      typeof liveNodePart?.data?.group === "string" && liveNodePart.data.group.length > 0
        ? String(liveNodePart.data.group)
        : "";
    const persistedGroupKey =
      typeof myObjectview?.group === "string" && myObjectview.group.length > 0
        ? String(myObjectview.group)
        : "";
    // Check if the node (myGoNode) is member of a group
    const goParentGroup =
      (liveContainingGroupKey ? myGoModel.findNode(liveContainingGroupKey) : null) ||
      (liveDataGroupKey ? myGoModel.findNode(liveDataGroupKey) : null) ||
      (persistedGroupKey ? myGoModel.findNode(persistedGroupKey) : null) ||
      uic.getGroupByLocation(myGoModel, myGoNode.loc, myGoNode.size, myGoNode);
    let parentObjview = goParentGroup?.objectview; // The container objectview
    if (!parentObjview) {
      parentObjview = myModelview.findObjectView(goParentGroup?.objviewRef);
    }
    if (goParentGroup && parentObjview) { // the container (group)
      myGoNode.group = goParentGroup.key; // Make the node a member of the group (container)
      pastedNode.group = goParentGroup.key;
      parentObjview.isExpanded = true;
      myObjectview.group = goParentGroup.key;
      const liveGroupPart = myDiagram.findNodeForKey(goParentGroup.key) as go.Group | null;
      if (liveNodePart instanceof go.Node && liveGroupPart instanceof go.Group) {
        attachPartToGroup(myDiagram, liveNodePart, liveGroupPart, liveNodePart.data);
      } else if (liveNodePart?.data) {
        try {
          if (typeof (myDiagram.model as any)?.setGroupKeyForNodeData === "function") {
            (myDiagram.model as any).setGroupKeyForNodeData(liveNodePart.data, goParentGroup.key);
          } else {
            myDiagram.model.setDataProperty(liveNodePart.data, "group", goParentGroup.key);
          }
        } catch (_) {
          try { liveNodePart.data.group = goParentGroup.key; } catch (_err) { }
        }
      }
      let scale = 1.0;
      if (isGroupLikeNode(myGoNode, myObjectview)) {
        const parentPart = myDiagram.findNodeForKey(goParentGroup.key) as go.Group | null;
        resizeGroupToHalfParent(myDiagram, myGoNode, myGoNode, parentPart);
        scale = applyDerivedScaleToPart(myDiagram, myGoNode, parentPart, myObjectview, myGoNode);
      } else {
        scale = applyDerivedScaleToPart(myDiagram, myGoNode, myDiagram.findNodeForKey(goParentGroup.key) as go.Group | null, myObjectview, myGoNode);
      }
      myObjectview.scale = scale;
      const scaledLoc = uic.scaleNodeLocation1(goParentGroup, myGoNode);
      if (scaledLoc) {
        myGoNode.loc = scaledLoc;
        myObjectview.loc = scaledLoc;
        if (liveNodePart?.data) {
          try { myDiagram.model.setDataProperty(liveNodePart.data, "loc", scaledLoc); } catch (_) { }
        }
      } else {
        myObjectview.loc = myGoNode.loc;
      }
      if (liveNodePart?.data) {
        try { myDiagram.model.setDataProperty(liveNodePart.data, "group", goParentGroup.key); } catch (_) { }
        try { myDiagram.model.setDataProperty(liveNodePart.data, "scale", scale); } catch (_) { }
      }
    }
  }
  // Dispatch metis
  const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
  let data = { metis: jsnMetis }
  data = JSON.parse(JSON.stringify(data));
  myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data }) // Todo: shoud not dispatch the whole phData????
  try {
    const pastedNodeKeys = new Set<string>();
    for (let i = 0; i < pastedNodes.length; i++) {
      const pastedNode = pastedNodes[i];
      if (pastedNode?.objviewId) pastedNodeKeys.add(String(pastedNode.objviewId));
      if (pastedNode?.goNodeId) pastedNodeKeys.add(String(pastedNode.goNodeId));
    }
    if (pastedNodeKeys.size > 0) {
      (myDiagram as any).__skipNextPostPasteNodeSyncKeys = pastedNodeKeys;
    }
    myDiagram.dispatch({
      type: 'SET_FOCUS_REFRESH',
      data: { id: utils.createGuid(), name: 'ClipboardPasted' }
    });
  } catch (_) {
  }
  if (false) {
    // Dispatch modelview
    const modifiedModelviews = new Array();
    const jsnModelview = new jsn.jsnModelView(myModelview);
    modifiedModelviews.push(jsnModelview);
    modifiedModelviews.map(mn => {
      let data = mn;
      data = safeJsonCloneForDispatch(data);
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
      // Persist what is actually rendered; `nodeData.loc` can lag after move/layout churn.
      const liveLoc = node?.location ? `${node.location.x} ${node.location.y}` : nodeData.loc;
      objectview.loc = liveLoc;
      if (liveLoc && nodeData.loc !== liveLoc) {
        try { myDiagram.model.setDataProperty(nodeData, "loc", liveLoc); } catch (_) { nodeData.loc = liveLoc; }
      }
      objectview.size = nodeData.size;
      if (typeof nodeData.group === "string") objectview.group = nodeData.group;
      const jsnObjview = new jsn.jsnObjectView(objectview);
      modifiedObjectViews.push(jsnObjview);
      myModelview.addObjectView(objectview);
    }
    const links = myDiagram.links;
    for (let it = links.iterator; it?.next();) {
      const link = it.value;
      const linkData = link?.data;
      if (!linkData) continue;
      const relview = linkData.relshipview;
      if (!relview) continue;
      const hadExplicitSavedPath =
        hasExplicitSavedLinkPath(relview?.points, linkData?.points) ||
        !!linkData?.__manualLinkMovePreview;
      if (!hadExplicitSavedPath) {
        relview.points = [];
        continue;
      }
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

  // Wrap ENTIRE LinkDrawn operation in one transaction to prevent any intermediate rendering
  myDiagram.startTransaction("link-drawn");
  try {
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
      if (!gjsFromNode || !gjsToNode) {
        try { myDiagram.model.removeLinkData(gjsData); } catch (_) {}
        break;
      }
      gjsData.category = constants.gojs.C_RELSHIPTYPE;
      if (debug) console.log('1523 link', fromNode, toNode);
      // link.category = constants.gojs.C_RELSHIPTYPE;
      const reltype = uic.createRelationshipType(gjsFromNode, gjsToNode, gjsData, context);
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
          const linkData = link?.data || gjsData;
          if (debug) console.log('1546 lnk, reltype', linkData, reltype);
          myDiagram.model.setDataProperty(linkData, 'category', constants.gojs.C_RELSHIPTYPE);
          myDiagram.model.setDataProperty(linkData, 'name', reltype.name);
          myDiagram.model.setDataProperty(linkData, 'reltype', reltype);
          myDiagram.model.setDataProperty(linkData, 'relshiptype', reltype);
          myDiagram.model.setDataProperty(linkData, 'typeview', reltypeview);
          uid.editRelationshipType(linkData, myMetis, myDiagram);
        }
      }
      // myDiagram.requestUpdate();  // Commented out - model changes auto-update, full refresh can cause visual glitches
    }
    // Handle relationships
    if (isObjectNode(gjsFromNode)) {
      // gjsData.category = constants.gojs.C_RELATIONSHIP;
      context.handleOpenModal = this.handleOpenModal;
      if (gjsFromNode && gjsToNode) {
        try {
          myDiagram.model.setDataProperty(gjsData, 'template', 'previewRelationship');
          myDiagram.model.setDataProperty(gjsData, 'strokecolor', '#2d9cdb');
          myDiagram.model.setDataProperty(gjsData, 'textcolor', 'black');
          myDiagram.model.setDataProperty(gjsData, 'name', '');
        } catch (_) {}
        uic.createRelationship(gjsFromNode, gjsToNode, context);
      }
    }
    // myDiagram.requestUpdate();  // Commented out - model changes auto-update, full refresh can cause visual glitches
  } finally {
    myDiagram.commitTransaction("link-drawn");
  }
  break;
}
      case "LinkRelinked": {
  const gjsLink = e.subject;
  const key = gjsLink.key;
  const gjsLinkData = gjsLink.data;
  const myGoModel = myMetis.gojsModel;
  const goLink = myGoModel.findLink(key);
  let fromNode = gjsLinkData.from; // gjsLinkData.fromNode;
  let fromPort = typeof gjsLinkData.fromPort === "string" ? gjsLinkData.fromPort : "";
  let toNode = gjsLinkData.to; // gjsLinkData.toNode;
  let toPort = typeof gjsLinkData.toPort === "string" ? gjsLinkData.toPort : "";
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
  try { myDiagram.model.setDataProperty(gjsLinkData, "from", fromNode); } catch (_) { gjsLinkData.from = fromNode; }
  try { myDiagram.model.setDataProperty(gjsLinkData, "to", toNode); } catch (_) { gjsLinkData.to = toNode; }
  try { myDiagram.model.setDataProperty(gjsLinkData, "fromPort", fromPort); } catch (_) { gjsLinkData.fromPort = fromPort; }
  try { myDiagram.model.setDataProperty(gjsLinkData, "toPort", toPort); } catch (_) { gjsLinkData.toPort = toPort; }
  try { myDiagram.model.setDataProperty(gjsLinkData, "points", []); } catch (_) { gjsLinkData.points = []; }
  try { gjsLink.points = new go.List<go.Point>(); } catch (_) { }
  relview.points = [];

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
  const data = link?.data || goLink?.data;
  if (debug) console.log('1596 link, data', link, data);
  let relview = myModelview.findRelationshipView(data?.relviewRef || data?.key);
  if (!relview) {
    relview = data?.relshipview;
  }
  if (relview) {
    const points = [];
    const livePoints = link?.points || gjsLink?.points || data?.points;
    for (let it = livePoints?.iterator; it?.next();) {
      const point = it.value;
      if (debug) console.log('1603 point', point.x, point.y);
      points.push(point.x)
      points.push(point.y)
    }
    const currentRouting = String(relview?.routing || data?.routing || "").trim();
    const shouldFreezeManualRoute =
      points.length >= 4 &&
      (currentRouting === "Orthogonal" || currentRouting === "AvoidsNodes");
    const hasManualPath = points.length >= 4;
    try { if (data?.relshipview) data.relshipview.points = points; } catch (_) {}
    try { if (data?.relshipview && data.relshipview.id !== relview.id) data.relshipview = relview; } catch (_) {}
    try {
      if (goLink) {
        goLink.points = points;
        goLink.relshipview = relview;
        goLink.relviewRef = relview.id;
        if (goLink.data) {
          goLink.data.points = points;
          goLink.data.relshipview = relview;
          goLink.data.relviewRef = relview.id;
        }
      }
    } catch (_) {}
    if (shouldFreezeManualRoute) {
      const preservedRouting = currentRouting || "Orthogonal";
      relview.routing = preservedRouting;
      try { myDiagram.model.setDataProperty(data, "routing", preservedRouting); } catch (_) {
        try { data.routing = preservedRouting; } catch (_err) {}
      }
      try { link.routing = uit.getRouting(preservedRouting); } catch (_) { }
      try { link.adjusting = go.Link.End; } catch (_) { }
    }
    try { myDiagram.model.setDataProperty(data, "__manualPath", hasManualPath); } catch (_) {
      try { data.__manualPath = hasManualPath; } catch (_err) {}
    }
    try { relview.__manualPath = hasManualPath; } catch (_) { }
    try { myDiagram.model.setDataProperty(data, "points", points); } catch (_) { }
    relview.points = points;
    const jsnRelview = new jsn.jsnRelshipView(relview);
    if (debug) console.log('1609 relview, jsnRelview', relview, jsnRelview);
    modifiedRelshipViews.push(jsnRelview);
    try {
      const nextLinkDataArray = (Array.isArray(this.state.linkDataArray) ? this.state.linkDataArray : []).map((entry: any) => {
        if (!entry || entry.key !== data?.key) return entry;
        return {
          ...entry,
          points: [...points],
          routing: data?.routing || entry.routing,
          relshipview: relview,
          relviewRef: relview?.id || entry.relviewRef,
        };
      });
      this.setState({
        linkDataArray: normalizeLinkPortData(nextLinkDataArray),
        skipsDiagramUpdate: true,
      });
    } catch (_) {}
    try { link?.updateTargetBindings?.(); } catch (_) { }
  }
  break;
}
      case "SubGraphCollapsed":
	      case "SubGraphExpanded": {
  const affectedPoolKeys = new Set<string>();
  const expanded = name === "SubGraphExpanded";
  const affectedParts: go.Part[] = [];
  if (e.subject instanceof go.Part) {
    affectedParts.push(e.subject);
  } else if (e.subject?.iterator) {
    for (let it = e.subject.iterator; it?.next();) {
      if (it.value instanceof go.Part) affectedParts.push(it.value);
    }
  } else if (typeof e.subject?.each === "function") {
    e.subject.each((n: go.Part) => {
      if (n instanceof go.Part) affectedParts.push(n);
    });
  }
  affectedParts.forEach(function (n) {
    const data = n.data;
    if (n instanceof go.Group) {
      syncLiveGroupExpandedState(myDiagram, n, expanded);
      setTimeout(() => {
        try {
          const liveGroup = (data?.key !== undefined ? myDiagram.findPartForKey(data.key) : null) as go.Group | null;
          if (liveGroup instanceof go.Group) {
            syncLiveGroupExpandedState(myDiagram, liveGroup, expanded);
            try { liveGroup.invalidateConnectedLinks(); } catch (_) { }
          }
        } catch (_) {
        }
      }, 0);
      if (expanded) {
        setTimeout(() => {
          try {
            const liveGroup = (data?.key !== undefined ? myDiagram.findPartForKey(data.key) : null) as go.Group | null;
            if (liveGroup instanceof go.Group) {
              restoreGroupMemberLocations(myDiagram, liveGroup);
              setGroupMemberVisibilityRecursive(liveGroup, true);
              try { liveGroup.ensureBounds(); } catch (_) { }
              try { myDiagram.requestUpdate(); } catch (_) { }
            }
          } catch (_) {
          }
        }, 50);
      }
    }
    const objview = data?.objectview;
    if (objview) {
      objview.isExpanded = expanded;
      uic.addItemToList(modifiedObjectViews, {
        id: objview?.id,
        isExpanded: expanded,
      });
    }
    const category = data?.category || data?.template;
    if (category === 'Lane' || category === 'Lane_w_handles') {
      if (data?.group) affectedPoolKeys.add(data.group);
    } else if (category === 'Pool') {
      if (data?.key) affectedPoolKeys.add(data.key);
    }
  });
  relayoutPoolsByKeys(affectedPoolKeys);
  // Fix any nodes that were mistakenly parented to the Pool (won't hide on collapse)
  // and clamp all lane members back into their lane bodies.
  affectedPoolKeys.forEach((poolKey) => normalizeSwimlanePool(poolKey));
  try {
    const liveNodeDataArray = Array.isArray((myDiagram?.model as any)?.nodeDataArray)
      ? [...(myDiagram.model as any).nodeDataArray]
      : this.state.nodeDataArray;
    const liveLinkDataArray = Array.isArray((myDiagram?.model as any)?.linkDataArray)
      ? [...(myDiagram.model as any).linkDataArray]
      : this.state.linkDataArray;
    this.setState({
      nodeDataArray: normalizeNodeCategoryData(liveNodeDataArray),
      linkDataArray: normalizeLinkPortData(liveLinkDataArray),
    });
  } catch (_) {
  }
  break;
}
	      case "BackgroundSingleClicked": {
	  if (debug) console.log('1615 myMetis', myMetis);
	  if (myModelview) {
	    uid.clearFocus(myModelview);
	    let data = { id: myModelview.id, name: myModelview.name }
	    data = JSON.parse(JSON.stringify(data));
	    context.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data })
	  }
	  if (myModel) {
	    let data2 = { id: myModel.id, name: myModel.name }
	    data2 = JSON.parse(JSON.stringify(data2));
	    context.dispatch({ type: 'SET_FOCUS_OBJECT', data2 })
	  }

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

// Dispatches
if (true) { // Dispatches to store individual objects/types
  if (debug) console.log('1928 modifiedObjectViews', modifiedObjectViews);
  const dispatchedObjectViewPayloads = new Set<string>();
  const storeState = getCurrentStore?.()?.getState?.();
  const sharedMetis = storeState?.universe?.world?.worldModel?.metis;
  const storedMetis = sharedMetis || storeState?.phData?.metis || {};
  const coalescedObjectViews = new Map<string, any>();
  modifiedObjectViews.forEach((mn: any) => {
    if (!mn?.id) return;
    const modelviewId = mn.modelviewId || myModelview?.id || "";
    const coalesceKey = `${modelviewId}:${mn.id}`;
    const prev = coalescedObjectViews.get(coalesceKey) || {};
    coalescedObjectViews.set(coalesceKey, { ...prev, ...mn, ...(modelviewId ? { modelviewId } : {}) });
  });
  if (!(this as any).__dispatchingObjectViewUpdates) {
    (this as any).__dispatchingObjectViewUpdates = true;
    try {
      Array.from(coalescedObjectViews.values()).map(mn => {
        let data = (mn) && mn
        if (mn.id) {
          data = sanitizeObjectViewDispatchData(safeJsonCloneForDispatch(data));
          const dispatchKey = JSON.stringify(data);
          if (dispatchedObjectViewPayloads.has(dispatchKey)) return;
          dispatchedObjectViewPayloads.add(dispatchKey);
          queueObjectViewDispatch(this, context.dispatch, data, myDiagram)
        }
      })
    } finally {
      (this as any).__dispatchingObjectViewUpdates = false;
    }
  }

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
  const dispatchedRelshipViewPayloads = new Set<string>();
  const coalescedRelshipViews = new Map<string, any>();
  modifiedRelshipViews.forEach((mn: any) => {
    if (!mn?.id) return;
    const prev = coalescedRelshipViews.get(mn.id) || {};
    coalescedRelshipViews.set(mn.id, { ...prev, ...mn });
  });
  const findStoredRelshipViewById = (id: string) => {
    const models = storedMetis?.models || [];
    for (let mi = 0; mi < models.length; mi++) {
      const modelviews = models[mi]?.modelviews || [];
      for (let mvi = 0; mvi < modelviews.length; mvi++) {
        const relshipviews = modelviews[mvi]?.relshipviews || [];
        for (let rvi = 0; rvi < relshipviews.length; rvi++) {
          const relshipview = relshipviews[rvi];
          if (relshipview?.id === id) return relshipview;
        }
      }
    }
    return null;
  };
  if (!(this as any).__dispatchingRelshipViewUpdates) {
    (this as any).__dispatchingRelshipViewUpdates = true;
    try {
      Array.from(coalescedRelshipViews.values()).map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        const dispatchKey = JSON.stringify(data);
        if (dispatchedRelshipViewPayloads.has(dispatchKey)) return;
        const storedRelshipView = findStoredRelshipViewById(data.id);
        if (storedRelshipView) {
          let hasMeaningfulDiff = false;
          for (const key of Object.keys(data)) {
            if (JSON.stringify(storedRelshipView?.[key]) !== JSON.stringify(data[key])) {
              hasMeaningfulDiff = true;
              break;
            }
          }
          if (!hasMeaningfulDiff) return;
        }
        dispatchedRelshipViewPayloads.add(dispatchKey);
        queueRelshipViewDispatch(this, context.dispatch, data, myDiagram)
      })
    } finally {
      (this as any).__dispatchingRelshipViewUpdates = false;
    }
  }

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
  const normalizedLinkDataArray = normalizeLinkPortData(this.state.linkDataArray);
  return ((this.state) &&
    <div className="diagramwrapper">
      <DiagramWrapper
        nodeDataArray={this.state.nodeDataArray}
        linkDataArray={normalizedLinkDataArray}
        modelData={this.state.modelData}
        modelType={this.state.modelType}
        skipsDiagramUpdate={this.state.skipsDiagramUpdate}
        onDiagramEvent={this.handleDiagramEvent}
        onModelChange={this.handleModelChange}
        onInputChange={this.handleInputChange}
        myMetis={this.state.myMetis}
        dispatch={this.state.dispatch}
        phFocus={this.props?.phFocus}
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
