interface DragProtection {
    preserve: Map<string, number>;
    locations: Map<string, { loc: string; until: number }>;
}
const sessions = new WeakMap<object, DragProtection>();
export const getDragProtection = (diagram?: object | null): DragProtection => {
    if (!diagram) return { preserve: new Map(), locations: new Map() };
    let state = sessions.get(diagram);
    if (!state) {
        state = { preserve: new Map(), locations: new Map() };
        sessions.set(diagram, state);
        // Existing transaction callbacks use these per-diagram fields.
        Object.assign(diagram, { __preserveIncomingNodeStateByKey: state.preserve, __lockMovedNodeLocByKey: state.locations });
    }
    return state;
};
export const clearDragProtection = (diagram?: object | null): void => {
    if (!diagram) return;
    const state = sessions.get(diagram);
    state?.preserve.clear();
    state?.locations.clear();
    sessions.delete(diagram);
};
