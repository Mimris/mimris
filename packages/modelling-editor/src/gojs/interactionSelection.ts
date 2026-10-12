/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import * as go from 'gojs';

export function resolveClickedPortGraphObject(subject: any): go.GraphObject | null {
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

export function syncFocusedObjectPeerFlags(
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
