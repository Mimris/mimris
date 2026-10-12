/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import { normalizeEmptyBooleanFieldsInPlace } from './paletteData.js';

export function normalizeLinkPortData(linkDataArray: any[] | undefined): any[] {
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

export function normalizeLinkPoints(points: any): any {
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

export function pickBestLinkPoints(...sources: any[]): number[] {
  let best: number[] = [];
  for (let i = 0; i < sources.length; i++) {
    const normalized = normalizeLinkPoints(sources[i]);
    if (Array.isArray(normalized) && normalized.length > best.length) {
      best = normalized;
    }
  }
  return best;
}

export function pickFirstNonEmptyLinkPoints(...sources: any[]): number[] {
  for (let i = 0; i < sources.length; i++) {
    const normalized = normalizeLinkPoints(sources[i]);
    if (Array.isArray(normalized) && normalized.length > 0) {
      return normalized;
    }
  }
  return [];
}

export function hasExplicitSavedLinkPath(...sources: any[]): boolean {
  for (let i = 0; i < sources.length; i++) {
    const normalized = normalizeLinkPoints(sources[i]);
    if (Array.isArray(normalized) && normalized.length >= 4) {
      return true;
    }
  }
  return false;
}
