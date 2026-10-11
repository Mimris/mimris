/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import * as go from 'gojs';
import { getDerivedScaleForGroup, getRelationshipTextScale } from './renderedScale.js';

export function syncRelationshipTextScaleForObjectView(
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

export function applyDerivedScaleToPart(
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
