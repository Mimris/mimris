import * as go from 'gojs';

/** Apply a known automatic layout once. Manual and unknown values retain routes. */
export function applyDiagramLayout(diagram: go.Diagram, name: unknown): boolean {
  if (name === 'Manual') {
    diagram.layout.isInitial = false;
    diagram.layout.isOngoing = false;
    return false;
  }
  let layout: go.Layout;
  switch (name) {
    case 'Circular': layout = new go.CircularLayout(); break;
    case 'Grid': layout = new go.GridLayout(); break;
    case 'Tree': layout = new go.TreeLayout(); break;
    case 'ForceDirected': layout = new go.ForceDirectedLayout(); break;
    case 'LayeredDigraph': layout = new go.LayeredDigraphLayout(); break;
    default: return false;
  }
  layout.isInitial = false;
  layout.isOngoing = false;
  diagram.commit(() => {
    diagram.layout = layout;
    diagram.links.each(link => {
      if (link.data) diagram.model.setDataProperty(link.data, 'points', []);
      // This is the editor's mutable runtime projection, never Redux-owned data.
      if (link.data?.relshipview) link.data.relshipview.points = [];
      link.points = new go.List<go.Point>();
      link.invalidateRoute();
    });
    diagram.layoutDiagram(true);
  }, 'automatic diagram layout');
  return true;
}
