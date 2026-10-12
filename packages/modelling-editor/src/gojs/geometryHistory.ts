import * as go from 'gojs';
import { clearDragProtection } from '../runtime/dragProtection.js';

export function plainHistoryLinkPoints(value: unknown): number[] | undefined {
  const points = value instanceof go.List ? value.toArray() : value;
  if (!Array.isArray(points)) return undefined;
  return points.flatMap(point => typeof point === 'number' ? [point] : [point.x, point.y]);
}

/** Semantic create/delete operations need their own durable inverse commands. */
export function installGeometryHistory(diagram: go.Diagram, before: () => void, after: () => void, changed: () => void = () => {}): () => void {
  // The legacy model contains cyclic runtime objects. Keep history detached
  // from GoJS incremental serialization, which cannot serialize those objects.
  type Entry = { nodes: any[]; links: any[]; semantic: string };
  const snapshot = (): Entry => {
    const model = diagram.model as go.GraphLinksModel;
    const geometry = (data: any) => {
      const result: any = { key: data.key };
      for (const field of ['loc', 'size', 'points', 'scale', 'scale1']) {
        const value = data[field];
        if (value === undefined) continue;
        if (field === 'points') {
          const points = plainHistoryLinkPoints(value);
          if (points) result.points = points;
        } else if (value instanceof go.Point) result[field] = go.Point.stringify(value);
        else if (value instanceof go.Size) result[field] = go.Size.stringify(value);
        else if (value === null || ['number', 'string', 'boolean'].includes(typeof value)) result[field] = value;
      }
      return result;
    };
    const nodes = model.nodeDataArray || [], links = model.linkDataArray || [];
    return { nodes: nodes.map(geometry), links: links.map(geometry),
      semantic: JSON.stringify([nodes.map(d => [d.key, d.group, d.name, d.category]), links.map(d => [d.key, d.from, d.to, d.name])]) };
  };
  let previous = snapshot(), applying = false, gestureStart: Entry | null = null;
  const past: Array<{ before: Entry; after: Entry }> = [], future: typeof past = [];
  const listener = (event: go.ChangedEvent) => {
    if (!event.isTransactionFinished || applying || gestureStart) return;
    const next = snapshot();
    const tool = diagram.currentTool;
    const gesture = (tool.isActive && (tool instanceof go.DraggingTool || tool instanceof go.ResizingTool || tool instanceof go.LinkReshapingTool)) ||
      /dragging|resizing|reshaping/i.test(String((event.object as go.Transaction)?.name || event.oldValue || ''));
    if (next.semantic !== previous.semantic) { past.length = 0; future.length = 0; }
    else if (gesture && JSON.stringify(next) !== JSON.stringify(previous)) {
      past.push({ before: previous, after: next });
      if (past.length > 100) past.shift();
      future.length = 0;
    }
    previous = next;
    changed();
  };
  diagram.addModelChangedListener(listener);
  // Capture one step around the entire tool gesture, including its final size
  // adjustment. Intermediate transactions must not become separate Undo steps.
  const restoreTools = [diagram.toolManager.draggingTool, diagram.toolManager.resizingTool, diagram.toolManager.linkReshapingTool].map(tool => {
    const activate = tool.doActivate, deactivate = tool.doDeactivate;
    const start = function (this: go.Tool) { gestureStart = snapshot(); activate.call(this); };
    const finish = function (this: go.Tool) {
      try { deactivate.call(this); }
      finally {
        const baseline = gestureStart;
        gestureStart = null;
        if (baseline) {
          previous = baseline;
          listener({ isTransactionFinished: true, oldValue: 'Dragging' } as go.ChangedEvent);
        }
      }
    };
    tool.doActivate = start; tool.doDeactivate = finish;
    return () => { if (tool.doActivate === start) tool.doActivate = activate; if (tool.doDeactivate === finish) tool.doDeactivate = deactivate; };
  });
  const reset = () => { past.length = 0; future.length = 0; previous = snapshot(); changed(); };
  diagram.addDiagramListener('InitialLayoutCompleted', reset);
  const handler = diagram.commandHandler;
  const canUndo = handler.canUndo.bind(handler), canRedo = handler.canRedo.bind(handler);
  const undo = handler.undo.bind(handler), redo = handler.redo.bind(handler);
  handler.canUndo = () => !diagram.isReadOnly && past.length > 0;
  handler.canRedo = () => !diagram.isReadOnly && future.length > 0;
  const run = (redoing: boolean) => {
    if (!(redoing ? handler.canRedo() : handler.canUndo())) return;
    before();
    const source = redoing ? future : past, target = redoing ? past : future;
    const entry = source.pop();
    if (!entry) return;
    clearDragProtection(diagram);
    (diagram as any).__watchdogGeneration = ((diagram as any).__watchdogGeneration || 0) + 1;
    delete (diagram as any).__suppressNodeModelSyncUntil;
    delete (diagram as any).__suppressPropSyncUntil;
    applying = true;
    try {
      const restored = redoing ? entry.after : entry.before;
      const current = snapshot();
      diagram.model.commit(model => {
        const graph = model as go.GraphLinksModel;
        for (const [values, currentValues, find] of [[restored.nodes, current.nodes, (key: any) => graph.findNodeDataForKey(key)], [restored.links, current.links, (key: any) => graph.findLinkDataForKey(key)]] as const) {
          for (const saved of values) {
            const data = find(saved.key);
            if (!data) continue;
            const live = currentValues.find(value => value.key === saved.key);
            for (const field of ['loc', 'size', 'points', 'scale', 'scale1']) {
              if (JSON.stringify(live?.[field]) !== JSON.stringify(saved[field])) model.set(data, field, saved[field]);
            }
          }
        }
      }, redoing ? 'Redo geometry' : 'Undo geometry');
      previous = snapshot();
      target.push(entry);
      after();
      changed();
    } finally { applying = false; }
  };
  handler.undo = () => run(false);
  handler.redo = () => run(true);
  return () => {
    diagram.removeModelChangedListener(listener);
    restoreTools.forEach(restore => restore());
    diagram.removeDiagramListener('InitialLayoutCompleted', reset);
    handler.undo = undo; handler.redo = redo; handler.canUndo = canUndo; handler.canRedo = canRedo;
  };
}
