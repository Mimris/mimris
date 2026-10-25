import * as go from 'gojs';

/** Lane restoration changes geometry only; runtime references must never enter Redux. */
export function laneMemberGeometryPatch(node: go.Node) {
  const data = node.data;
  const id = data?.objectview?.id || data?.objviewRef || data?.key;
  if (!id || !node.location?.isReal()) return undefined;
  return {
    id,
    loc: go.Point.stringify(node.location),
    ...(typeof data?.group === 'string' ? { group: data.group } : {}),
  };
}
