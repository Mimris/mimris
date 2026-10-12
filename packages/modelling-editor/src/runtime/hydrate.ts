/** The legacy importer mutates records and retains nested arrays. Give it session-owned data. */
export const hydrateEditorRuntime = <T>(
    runtime: { importData(data: T, includeDeleted: boolean): void },
    snapshot: T,
    includeDeleted: boolean,
): void => {
    const detached = typeof structuredClone === 'function'
        ? structuredClone(snapshot)
        : JSON.parse(JSON.stringify(snapshot)) as T;
    runtime.importData(detached, includeDeleted);
};
