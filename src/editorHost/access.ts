import type { AnyAction } from '@reduxjs/toolkit';
import type { LegacyUniverseRoot } from '../sharedUniverse/universeSlice';

/** A host projects its own root into the editor's current compatibility view. */
export interface EditorHostAccess {
    getState(): LegacyUniverseRoot;
    dispatch(action: AnyAction): unknown;
    persistence?: EditorDraftPersistence;
}

/** Optional host capability; editor helpers never choose a storage backend. */
export interface EditorDraftPersistence {
    /** Return a detached draft that compatibility helpers may patch. */
    readDraft(): LegacyUniverseRoot | undefined;
    saveDraft(snapshot: LegacyUniverseRoot): void;
    saveCurrentDraftAfter(delayMs: number): void;
}

const hosts = new WeakMap<object, EditorHostAccess>();

/** Bind runtime access to one editor instance; cleanup cannot detach a newer binding. */
export const bindEditorHost = (editor: object, host: EditorHostAccess): (() => void) => {
    hosts.set(editor, host);
    return () => {
        if (hosts.get(editor) === host) hosts.delete(editor);
    };
};

export const getEditorHost = (editor: object | null | undefined): EditorHostAccess | undefined =>
    editor ? hosts.get(editor) : undefined;

/** Choose one route, retaining receiver binding for legacy diagram methods. */
export const resolveEditorDispatch = (
    editor: object | null | undefined,
    ...fallbacks: Array<{ dispatch?: (action: AnyAction) => unknown } | null | undefined>
): ((action: AnyAction) => unknown) | undefined => {
    const owner = [getEditorHost(editor), ...fallbacks].find(candidate => typeof candidate?.dispatch === 'function');
    return owner ? action => owner.dispatch!(action) : undefined;
};
