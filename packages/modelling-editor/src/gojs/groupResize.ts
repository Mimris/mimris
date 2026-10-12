import * as go from 'gojs';

/** Resizing a container changes its boundary, not its contents' document coordinates. */
export function resizeGroupWithoutMovingMembers(group: go.Group, resize: () => void): void {
  const positions: Array<{ node: go.Node; position: go.Point }> = [];
  const capture = (parent: go.Group) => parent.memberParts.each(part => {
    if (!(part instanceof go.Node)) return;
    if (part.position.isReal()) positions.push({ node: part, position: part.position.copy() });
    if (part instanceof go.Group) capture(part);
  });
  capture(group);
  resize();
  group.ensureBounds();
  // Restore parents first: moving a nested group also moves its descendants.
  for (const { node, position } of positions) {
    if (!node.position.equals(position)) node.move(position);
  }
}
