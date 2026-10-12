/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import { normalizeLinkPoints } from './linkData.js';

const debug = false;

export function mergeIncomingLinkDataWithLocalState(incomingLinks: any[] | undefined, localLinks: any[] | undefined): any[] {
  if (!Array.isArray(incomingLinks)) return incomingLinks as any;
  const localMap = new Map((Array.isArray(localLinks) ? localLinks : []).map((link: any) => [link?.key, link]));
  return incomingLinks.map((incoming: any) => {
    if (!incoming || typeof incoming !== "object" || !incoming.key) return incoming;
    const local = localMap.get(incoming.key);
    if (!local || typeof local !== "object") return incoming;
    const incomingPoints = normalizeLinkPoints(incoming.points);
    const localPoints = normalizeLinkPoints(local.points);
    const incomingHasManualPoints = Boolean(incoming.__manualPath) && Array.isArray(incomingPoints) && incomingPoints.length >= 4;
    const localHasManualPoints = Boolean(local.__manualPath) && Array.isArray(localPoints) && localPoints.length >= 4;
    if (!localHasManualPoints) return incoming;
    if (incomingHasManualPoints) return incoming;
    if (debug) {
      console.debug("[MANUAL_MOVE_PROP_SYNC]", {
        key: incoming.key,
        incomingPoints,
        localPoints,
        incomingRouting: incoming.routing || "",
        localRouting: local.routing || "",
      });
    }
    return {
      ...incoming,
      points: localPoints,
      routing: local.routing || incoming.routing,
      relshipview: local.relshipview || incoming.relshipview,
    };
  });
}
