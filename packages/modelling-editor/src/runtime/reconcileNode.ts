const visualFields = ['name', 'text', 'fillcolor', 'strokecolor', 'strokewidth', 'icon'];
/** Compare against the live model: React's projection can already contain the edit. */
export const reconcileLiveNode = (model: {
    findNodeDataForKey(key: unknown): any;
    set(data: any, field: string, value: unknown): void;
}, incoming: any): void => {
    if (incoming?.key == null) return;
    const live = model.findNodeDataForKey(incoming.key);
    if (!live) return;
    const defaultName = String(live.name || live.object?.name || live.typename || live.objecttype?.name || '').trim();
    for (const field of visualFields) {
        if (incoming[field] === undefined || incoming[field] === live[field]) continue;
        if ((field === 'name' || field === 'text') && !String(incoming[field] ?? '').trim() && defaultName) continue;
        model.set(live, field, incoming[field]);
    }
    for (const field of ['object', 'objectview']) {
        if (incoming[field]?.name === undefined || incoming[field].name === live[field]?.name) continue;
        if (!String(incoming[field].name).trim() && String(live[field]?.name || defaultName).trim()) continue;
        model.set(live, field, { ...(live[field] || {}), ...incoming[field] });
    }
};

/** Imported runtime reverse indexes can be incomplete; always include the edited view. */
export const getEditedObjectViews = (object: { objectviews?: any[] }, edited: any): any[] => {
    const seen = new Set<unknown>();
    return [edited, ...(Array.isArray(object.objectviews) ? object.objectviews : [])].filter(view => {
        if (!view || seen.has(view.id)) return false;
        seen.add(view.id);
        return true;
    });
};
