import * as go from 'gojs';

function nearestEdgePort(node: go.Node, point: go.Point, excluded?: go.GraphObject | null): go.GraphObject | null {
  let closest: go.GraphObject | null = null;
  let distance = Infinity;
  node.ports.each(port => {
    if (!port.portId.startsWith('edge-') || port === excluded ||
        !port.fromLinkable || !port.toLinkable ||
        !port.fromLinkableSelfNode || !port.toLinkableSelfNode) return;
    const bounds = port.getDocumentBounds();
    const dx = Math.max(bounds.left - point.x, 0, point.x - bounds.right);
    const dy = Math.max(bounds.top - point.y, 0, point.y - bounds.bottom);
    const candidate = dx * dx + dy * dy;
    if (candidate < distance) {
      closest = port;
      distance = candidate;
    }
  });
  return closest;
}

/** Prefer distinct side ports when drawing a relationship back to its node. */
export class SelfLinkingTool extends go.LinkingTool {
  findTargetPort(toend: boolean): go.GraphObject | null {
    const target = super.findTargetPort(toend);
    const node = toend ? this.originalFromNode : this.originalToNode;
    const origin = toend ? this.originalFromPort : this.originalToPort;
    if (!target || !node || target.part !== node) return target;
    const candidate = nearestEdgePort(node, this.diagram.lastInput.documentPoint, origin);
    if (!candidate) return target;
    return (toend ? this.isValidLink(node, origin, node, candidate)
      : this.isValidLink(node, candidate, node, origin)) ? candidate : target;
  }

  insertLink(fromnode: go.Node, fromport: go.GraphObject, tonode: go.Node, toport: go.GraphObject): go.Link | null {
    if (fromnode === tonode) {
      // The body port covers the whole node. Convert it to the side at which
      // the user started, then choose a different side for the destination.
      const fromPoint = this.isForwards ? this.diagram.firstInput.documentPoint : this.diagram.lastInput.documentPoint;
      const toPoint = this.isForwards ? this.diagram.lastInput.documentPoint : this.diagram.firstInput.documentPoint;
      const source = fromport.portId.startsWith('edge-') ? fromport : nearestEdgePort(fromnode, fromPoint);
      const target = toport.portId.startsWith('edge-') && toport !== source
        ? toport : nearestEdgePort(tonode, toPoint, source);
      if (source && target && this.isValidLink(fromnode, source, tonode, target)) {
        fromport = source;
        toport = target;
      }
    }
    return super.insertLink(fromnode, fromport, tonode, toport);
  }
}
