import { getDragProtection } from '../runtime/dragProtection.js';
/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import * as go from 'gojs';

export function getNodeIdentityAliases(data: any): string[] {
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

export function findLiveNodeByAliases(diagram: go.Diagram | null | undefined, data: any): go.Node | null {
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

export function hasStructuralNodeArrayDiff(incomingNodes: any[] | undefined, currentNodes: any[] | undefined): boolean {
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

/** A new user drag supersedes the previous completed move for this node. */
export function releaseNodeDragProtection(diagram: object | null | undefined, data: any): void {
  if (!diagram) return;
  const protection = getDragProtection(diagram);
  for (const alias of getNodeIdentityAliases(data)) {
    protection.preserve.delete(alias);
    protection.locations.delete(alias);
  }
}
