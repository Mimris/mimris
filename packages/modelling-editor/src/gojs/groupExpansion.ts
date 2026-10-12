/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import * as go from 'gojs';

export function setGroupMemberVisibilityRecursive(group: go.Group, visible: boolean) {
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

export function getGroupMemberLocSnapshots(diagram: any): Map<string, Map<string, string>> {
  if (!diagram) return new Map();
  if (!(diagram as any).__groupMemberLocSnapshots) {
    (diagram as any).__groupMemberLocSnapshots = new Map<string, Map<string, string>>();
  }
  return (diagram as any).__groupMemberLocSnapshots;
}

export function snapshotGroupMemberLocations(diagram: go.Diagram, group: go.Group) {
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

export function restoreGroupMemberLocations(diagram: go.Diagram, group: go.Group) {
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

export function syncLiveGroupExpandedState(diagram: go.Diagram, group: go.Group, expanded: boolean) {
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
  try { (group as any).updateAdornments(); } catch (_) { }
  try { group.ensureBounds(); } catch (_) { }
  try { diagram.requestUpdate(); } catch (_) { }
}
