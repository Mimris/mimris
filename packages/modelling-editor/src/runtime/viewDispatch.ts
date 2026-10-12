/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import { persistObjectViewDraft } from '../host/objectViewDraft.js';

type ViewDispatchQueue = Map<string, any> & { __diagram?: any };

export function safeJsonCloneForDispatch(value: any): any {
  const seen = new WeakSet<object>();
  return JSON.parse(JSON.stringify(value, (_key, current) => {
    if (typeof current === "function") return undefined;
    if (!current || typeof current !== "object") return current;
    if (seen.has(current)) return undefined;
    seen.add(current);
    const ctor = current.constructor?.name || "";
    if (
      ctor === "Diagram" ||
      ctor === "AnimationManager" ||
      ctor === "ToolManager" ||
      ctor === "DraggingTool" ||
      ctor === "CommandHandler" ||
      ctor === "GraphObject" ||
      ctor === "Part" ||
      ctor === "Node" ||
      ctor === "Link" ||
      ctor === "Group" ||
      ctor === "Panel" ||
      ctor === "Shape" ||
      ctor === "Adornment" ||
      ctor === "InputEvent"
    ) {
      return undefined;
    }
    return current;
  }));
}

export function disposeQueuedViewDispatches(instance: any) {
  instance.__viewDispatchDisposed = true;
  for (const kind of ['Object', 'Relship']) {
    const timerKey = `__queued${kind}ViewDispatchTimer`;
    if (instance[timerKey] != null) clearTimeout(instance[timerKey]);
    instance[timerKey] = null;
    instance[`__queued${kind}ViewDispatches`]?.clear();
    instance[`__queued${kind}ViewDispatches`] = new Map();
  }
}

export function queueObjectViewDispatch(instance: any, dispatch: any, data: any, diagram?: any) {
  if (!instance || instance.__viewDispatchDisposed || typeof dispatch !== "function" || !data?.id) return;
  if (!(instance as any).__queuedObjectViewDispatches) {
    (instance as any).__queuedObjectViewDispatches = new Map<string, any>();
  }
  const queue: ViewDispatchQueue = (instance as any).__queuedObjectViewDispatches;
  const modelviewId = data.modelviewId || data.modelviewRef || "";
  const queueKey = `${modelviewId}:${data.id}`;
  const prev = queue.get(queueKey) || {};
  queue.set(queueKey, { ...prev, ...data, ...(modelviewId ? { modelviewId } : {}) });
  // Store the diagram reference for use in the flush
  if (diagram && !queue.__diagram) {
    queue.__diagram = diagram;
  }
  if ((instance as any).__queuedObjectViewDispatchTimer) return;
  (instance as any).__queuedObjectViewDispatchTimer = setTimeout(() => {
    const pendingQueue: ViewDispatchQueue = (instance as any).__queuedObjectViewDispatches || new Map();
    const storedDiagram = pendingQueue.__diagram;
    (instance as any).__queuedObjectViewDispatches = new Map();
    (instance as any).__queuedObjectViewDispatchTimer = null;
    pendingQueue.forEach((payload) => {
      try {
        dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: safeJsonCloneForDispatch(payload) });
        persistObjectViewDraft(instance.state?.myMetis, payload);

        // CRITICAL: Update myMetis nodes AND their objectviews with new positions
        // BEFORE calling setState, so React has the correct data to render
        if (instance.state?.myMetis?.gojsModel?.nodes) {
          const nodes = instance.state.myMetis.gojsModel.nodes;
          const node = nodes.find((n: any) => n.id === payload.id || n.key === payload.id || n.objviewRef === payload.id);
          if (node) {
            if (payload.name !== undefined) node.name = payload.name;
            if (payload.text !== undefined) node.text = payload.text;
            if (payload.loc) node.loc = payload.loc;
            if (payload.size) node.size = payload.size;
            if (payload.fillcolor !== undefined) node.fillcolor = payload.fillcolor;
            if (payload.strokecolor !== undefined) node.strokecolor = payload.strokecolor;
            if (payload.strokewidth !== undefined) node.strokewidth = payload.strokewidth;
            if (payload.icon !== undefined) node.icon = payload.icon;
            // Update the underlying objectview as well
            if (node.objectview) {
              if (payload.name !== undefined) node.objectview.name = payload.name;
              if (payload.text !== undefined) node.objectview.text = payload.text;
              if (payload.loc) node.objectview.loc = payload.loc;
              if (payload.size) node.objectview.size = payload.size;
              if (payload.fillcolor !== undefined) node.objectview.fillcolor = payload.fillcolor;
              if (payload.strokecolor !== undefined) node.objectview.strokecolor = payload.strokecolor;
              if (payload.strokewidth !== undefined) node.objectview.strokewidth = payload.strokewidth;
              if (payload.icon !== undefined) node.objectview.icon = payload.icon;
            }
          }
        }
      } catch (err) {
        console.error('Error updating node in queue:', err);
      }
    });
    // Force React state update to immediately reflect position changes
    if (instance && typeof instance.setState === 'function' && instance.state?.myMetis?.gojsModel) {
      const nodes = instance.state.myMetis.gojsModel.nodes;
      if (Array.isArray(nodes)) {
        instance.setState({ nodeDataArray: [...nodes], skipsDiagramUpdate: true });
      }
    }

    // CRITICAL: Also update the GoJS diagram's model directly
    if (storedDiagram && storedDiagram.model) {
      storedDiagram.model.commit((m: any) => {
        pendingQueue.forEach((payload) => {
          const nodeData = m.findNodeDataForKey(payload.id);
          if (nodeData) {
            if (payload.name !== undefined) m.set(nodeData, 'name', payload.name);
            if (payload.text !== undefined) m.set(nodeData, 'text', payload.text);
            if (payload.loc) m.set(nodeData, 'loc', payload.loc);
            if (payload.size) m.set(nodeData, 'size', payload.size);
            if (payload.fillcolor !== undefined) m.set(nodeData, 'fillcolor', payload.fillcolor);
            if (payload.strokecolor !== undefined) m.set(nodeData, 'strokecolor', payload.strokecolor);
            if (payload.strokewidth !== undefined) m.set(nodeData, 'strokewidth', payload.strokewidth);
            if (payload.icon !== undefined) m.set(nodeData, 'icon', payload.icon);
          }
        });
      }, 'update positions from queue');
    }
  }, 0);
}

export function queueRelshipViewDispatch(instance: any, dispatch: any, data: any, diagram?: any) {
  if (!instance || instance.__viewDispatchDisposed || typeof dispatch !== "function" || !data?.id) return;
  if (!(instance as any).__queuedRelshipViewDispatches) {
    (instance as any).__queuedRelshipViewDispatches = new Map<string, any>();
  }
  const queue: ViewDispatchQueue = (instance as any).__queuedRelshipViewDispatches;
  const prev = queue.get(data.id) || {};
  queue.set(data.id, { ...prev, ...data });
  // Store the diagram reference for use in the flush
  if (diagram && !queue.__diagram) {
    queue.__diagram = diagram;
  }
  if ((instance as any).__queuedRelshipViewDispatchTimer) return;
  (instance as any).__queuedRelshipViewDispatchTimer = setTimeout(() => {
    const pendingQueue: ViewDispatchQueue = (instance as any).__queuedRelshipViewDispatches || new Map();
    const storedDiagram = pendingQueue.__diagram;
    (instance as any).__queuedRelshipViewDispatches = new Map();
    (instance as any).__queuedRelshipViewDispatchTimer = null;
    pendingQueue.forEach((payload) => {
      try {
        dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data: safeJsonCloneForDispatch(payload) });

        // CRITICAL: Update myMetis links with new data
        if (instance.state?.myMetis?.gojsModel?.links) {
          const links = instance.state.myMetis.gojsModel.links;
          const link = links.find((l: any) => l.id === payload.id || l.key === payload.id || l.relviewRef === payload.id);
          if (link) {
            if (payload.points) link.points = payload.points;
            if (payload.routing) link.routing = payload.routing;
            if (payload.strokecolor !== undefined) link.strokecolor = payload.strokecolor;
            if (payload.strokewidth !== undefined) link.strokewidth = payload.strokewidth;
            // Update the underlying relshipview as well
            if (link.relshipview) {
              if (payload.points) link.relshipview.points = payload.points;
              if (payload.routing) link.relshipview.routing = payload.routing;
              if (payload.strokecolor !== undefined) link.relshipview.strokecolor = payload.strokecolor;
              if (payload.strokewidth !== undefined) link.relshipview.strokewidth = payload.strokewidth;
            }
          }
        }
      } catch (err) {
        console.error('[Queue] Error updating link:', err);
      }
    });

    // Force React state update
    if (instance && typeof instance.setState === 'function' && instance.state?.myMetis?.gojsModel) {
      const links = instance.state.myMetis.gojsModel.links;
      if (Array.isArray(links)) {
        instance.setState({ linkDataArray: [...links], skipsDiagramUpdate: true });
      }
    }

    // Update the GoJS diagram's model directly
    if (storedDiagram && storedDiagram.model) {
      storedDiagram.model.commit((m: any) => {
        pendingQueue.forEach((payload) => {
          // SAFETY CHECK: Make sure this is actually a link, not a node
          const nodeData = m.findNodeDataForKey(payload.id);
          if (nodeData) return; // Skip this update

          const linkData = m.findLinkDataForKey(payload.id);
          if (linkData) {
            if (payload.points) m.set(linkData, 'points', payload.points);
            if (payload.routing) m.set(linkData, 'routing', payload.routing);
            if (payload.strokecolor !== undefined) m.set(linkData, 'strokecolor', payload.strokecolor);
            if (payload.strokewidth !== undefined) m.set(linkData, 'strokewidth', payload.strokewidth);
          }
        });
      }, 'update link paths from queue');
    }
  }, 0);
}

export function flushQueuedDiagramDispatches(instance: any, dispatch: any) {
  if (!instance || instance.__viewDispatchDisposed || typeof dispatch !== "function") return;

  const objectTimer = (instance as any).__queuedObjectViewDispatchTimer;
  if (objectTimer) {
    clearTimeout(objectTimer);
    (instance as any).__queuedObjectViewDispatchTimer = null;
  }
  const pendingObjectQueue: ViewDispatchQueue = (instance as any).__queuedObjectViewDispatches || new Map();
  (instance as any).__queuedObjectViewDispatches = new Map();
  pendingObjectQueue.forEach((payload) => {
    try {
      dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: safeJsonCloneForDispatch(payload) });
      persistObjectViewDraft(instance.state?.myMetis, payload);
    } catch (_) {
    }
  });

  const relTimer = (instance as any).__queuedRelshipViewDispatchTimer;
  if (relTimer) {
    clearTimeout(relTimer);
    (instance as any).__queuedRelshipViewDispatchTimer = null;
  }
  const pendingRelQueue: ViewDispatchQueue = (instance as any).__queuedRelshipViewDispatches || new Map();
  (instance as any).__queuedRelshipViewDispatches = new Map();
  pendingRelQueue.forEach((payload) => {
    try {
      dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data: safeJsonCloneForDispatch(payload) });
    } catch (_) {
    }
  });
}
