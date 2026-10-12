/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import * as go from 'gojs';
import { normalizeLinkPoints } from '../runtime/linkData.js';

export function isTransientRoutedLink(routing: any): boolean {
  if (routing === go.Link.Orthogonal || routing === go.Link.AvoidsNodes) return true;
  const normalized = String(routing || "").trim();
  return normalized === "Orthogonal" || normalized === "AvoidsNodes";
}

export function getPreservedRouting(...sources: any[]): string {
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

export function sanitizeModifiedLinkDataForReact(link: any): any {
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
    Boolean(nextLink.__manualPath) &&
    Array.isArray(nextLink.points) &&
    nextLink.points.length >= 4;
  // For routed links, ignore default auto-route geometry, but keep explicit reshaped paths.
  if (isRoutedLink && !hasPersistableManualPoints) {
    delete nextLink.points;
  }
  return nextLink;
}

export function reanchorManualLinkPoints(
  link: go.Link,
  rawPoints: any,
  options: { anchorFrom?: boolean; anchorTo?: boolean } = {}
): number[] | null {
  const points = normalizeLinkPoints(rawPoints);
  if (!Array.isArray(points) || points.length < 4) return null;
  const nextPoints = [...points];
  const fromNode = link.fromNode;
  const toNode = link.toNode;
  const fromPort = (link.fromPort as any) || fromNode?.port || fromNode;
  const toPort = (link.toPort as any) || toNode?.port || toNode;

  if (options.anchorFrom !== false && fromNode && fromPort && nextPoints.length >= 4) {
    const currentFrom = new go.Point(nextPoints[0], nextPoints[1]);
    const nextAfterFrom = new go.Point(nextPoints[2], nextPoints[3]);
    const anchoredFrom = new go.Point(currentFrom.x, currentFrom.y);
    try {
      link.getLinkPointFromPoint(fromNode, fromPort, currentFrom, nextAfterFrom, true, anchoredFrom);
      nextPoints[0] = anchoredFrom.x;
      nextPoints[1] = anchoredFrom.y;
      // Preserve the direction of the first user-authored segment. Moving the
      // adjacent bend in both axes turns an orthogonal segment into a diagonal.
      if (Math.abs(nextAfterFrom.y - currentFrom.y) <= Math.abs(nextAfterFrom.x - currentFrom.x)) {
        nextPoints[3] = anchoredFrom.y;
      } else {
        nextPoints[2] = anchoredFrom.x;
      }
    } catch (_) {
    }
  }

  if (options.anchorTo !== false && toNode && toPort && nextPoints.length >= 4) {
    const last = nextPoints.length - 2;
    const prev = nextPoints.length - 4;
    const beforeTo = new go.Point(nextPoints[prev], nextPoints[prev + 1]);
    const currentTo = new go.Point(nextPoints[last], nextPoints[last + 1]);
    const anchoredTo = new go.Point(currentTo.x, currentTo.y);
    try {
      link.getLinkPointFromPoint(toNode, toPort, currentTo, beforeTo, false, anchoredTo);
      nextPoints[last] = anchoredTo.x;
      nextPoints[last + 1] = anchoredTo.y;
      // Preserve the direction of the final user-authored segment too.
      if (Math.abs(beforeTo.y - currentTo.y) <= Math.abs(beforeTo.x - currentTo.x)) {
        nextPoints[prev + 1] = anchoredTo.y;
      } else {
        nextPoints[prev] = anchoredTo.x;
      }
    } catch (_) {
    }
  }

  return nextPoints;
}

export function shiftManualLinkEndpointSegments(
  rawPoints: any,
  options: {
    moveFrom?: { dx: number; dy: number } | null;
    moveTo?: { dx: number; dy: number } | null;
  }
): number[] | null {
  const points = normalizeLinkPoints(rawPoints);
  if (!Array.isArray(points) || points.length < 4) return null;
  const nextPoints = [...points];
  // When both endpoints move together (a Pool/Lane drag), translate the full
  // route.  For one-endpoint drags, preserve the user’s bends and only
  // re-anchor the endpoint segment afterwards.
  if (options.moveFrom && options.moveTo &&
      Math.abs(options.moveFrom.dx - options.moveTo.dx) < 0.01 &&
      Math.abs(options.moveFrom.dy - options.moveTo.dy) < 0.01) {
    for (let i = 0; i + 1 < nextPoints.length; i += 2) {
      nextPoints[i] += options.moveFrom.dx;
      nextPoints[i + 1] += options.moveFrom.dy;
    }
  }
  return nextPoints;
}
