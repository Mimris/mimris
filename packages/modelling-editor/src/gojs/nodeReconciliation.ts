/*
 * Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 */
import * as go from 'gojs';
import { getDragProtection } from '../runtime/dragProtection.js';
import { getNodeIdentityAliases, findLiveNodeByAliases } from './nodeIdentity.js';

export function mergeIncomingNodeDataWithLocalState(
  incomingNodes: any[] | undefined,
  localNodes: any[] | undefined,
  diagram?: go.Diagram | null
): any[] {
  if (!Array.isArray(incomingNodes)) return incomingNodes as any;

  // Keep drag protection within this diagram across React rerenders.
  const preserveByKey = getDragProtection(diagram).preserve;
  const lockByKey = getDragProtection(diagram).locations;

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
