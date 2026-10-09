import type { EditorDraftPersistence } from '../editorHost/access';
import type { LegacyUniverseRoot } from '../sharedUniverse/universeSlice';
import { MEMORY_STATE_STORAGE_KEY, persistMemoryState } from '../components/utils/memoryStateStorage';

/** Standalone browser persistence. Timers are owned and cancelled by the host session. */
export const createStandaloneEditorPersistence = (getState: () => LegacyUniverseRoot) => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let disposed = false;
    const enabled = () => !disposed && (typeof window === 'undefined'
        || new URLSearchParams(window.location?.search || '').get('workspaceAuthority') !== 'redux');
    const persistence: EditorDraftPersistence = {
        readDraft() {
            if (!enabled() || typeof window === 'undefined') return undefined;
            const raw = window.sessionStorage.getItem(MEMORY_STATE_STORAGE_KEY)
                || window.localStorage.getItem(MEMORY_STATE_STORAGE_KEY);
            return raw ? JSON.parse(raw) as LegacyUniverseRoot : undefined;
        },
        saveDraft(snapshot) {
            if (enabled()) persistMemoryState(snapshot);
        },
        saveCurrentDraftAfter(delayMs) {
            if (!enabled()) return;
            const timer = setTimeout(() => {
                timers.delete(timer);
                if (enabled()) persistence.saveDraft(getState());
            }, delayMs);
            timers.add(timer);
        },
    };
    return {
        persistence,
        dispose() {
            disposed = true;
            timers.forEach(clearTimeout);
            timers.clear();
        },
    };
};
