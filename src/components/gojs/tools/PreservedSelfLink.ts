import * as go from 'gojs';

// Setting points alone does not prevent GoJS from recomputing an invalidated
// route when a node's bindings and bounds settle after a drop.
export class PreservedSelfLink extends go.Link {
  override computePoints(): boolean {
    const translated = (this.diagram as any)?.__translatedSelfLoopRoutes?.get(String(this.data?.key));
    const hasManualPath = this.data?.__manualPath || this.data?.relshipview?.__manualPath;
    const route = [translated, ...(hasManualPath ? [this.data?.points, this.data?.relshipview?.points] : [])]
      .map(source => source instanceof go.List
        ? source.toArray().flatMap((point: go.Point) => [point.x, point.y]) : source)
      .find(points => Array.isArray(points) && points.length >= 4 &&
        points.length % 2 === 0 && points.every(Number.isFinite));
    if (this.fromNode && this.fromNode === this.toNode &&
        Array.isArray(route) && route.length >= 4 && route.length % 2 === 0 &&
        route.every(Number.isFinite)) {
      this.clearPoints();
      for (let index = 0; index < route.length; index += 2) {
        this.addPoint(new go.Point(route[index], route[index + 1]));
      }
      return true;
    }
    return super.computePoints();
  }
}
