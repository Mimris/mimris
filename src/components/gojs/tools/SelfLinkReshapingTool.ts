import * as go from 'gojs';

/** Let users place self-link breakpoints in both axes instead of sliding segments. */
export class SelfLinkReshapingTool extends go.LinkReshapingTool {
  private isSelfLink(): boolean {
    const link = this.adornedLink;
    return !!link?.fromNode && link.fromNode === link.toNode;
  }

  computeReshape(point: go.Point): go.Point {
    return this.isSelfLink() && this.handle?.segmentFraction === 0 ? point : super.computeReshape(point);
  }

  reshape(point: go.Point): void {
    const link = this.adornedLink;
    const index = this.handle?.segmentIndex ?? -1;
    if (!this.isSelfLink() || !link || this.handle?.segmentFraction !== 0 || index <= 1 || index >= link.pointsCount - 2) {
      super.reshape(point);
      return;
    }
    const points = link.points.copy();
    if (link.isOrthogonal) {
      const original = points.elt(index);
      for (const adjacent of [index - 1, index + 1]) {
        const neighbor = points.elt(adjacent).copy();
        if (Math.abs(neighbor.x - original.x) < Math.abs(neighbor.y - original.y)) {
          neighbor.x = point.x;
        } else {
          neighbor.y = point.y;
        }
        points.setElt(adjacent, neighbor);
      }
    }
    points.setElt(index, point.copy());
    link.points = points;
  }
}
