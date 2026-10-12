import { MEMORY_STATE_STORAGE_KEY, persistMemoryState } from '../components/utils/memoryStateStorage';
const LAST_FOCUS_MODEL_STORAGE_KEY = 'mimris.modelling.focusModelId';
const WORKSPACE_SNAPSHOT_META_KEY = '__workspaceUniverse';

export const trimPersistedStateForBrowserStorage = (state: any) => {
  const phUser = state?.phUser || {};
  const workspaceMeta = phUser?.[WORKSPACE_SNAPSHOT_META_KEY];
  if (!workspaceMeta) return state;

  return {
    ...state,
    phUser: {
      ...phUser,
      [WORKSPACE_SNAPSHOT_META_KEY]: {
        ...workspaceMeta,
        snapshot: undefined,
        worldOperation: undefined,
      },
    },
  };
};

const countRenderableModelviewItems = (state: any) => {
  const models = state?.phData?.metis?.models;
  if (!Array.isArray(models)) return 0;
  return models.reduce((count: number, model: any) => {
    const modelviews = Array.isArray(model?.modelviews) ? model.modelviews : [];
    return count + modelviews.reduce((viewCount: number, modelview: any) => {
      const objectviews = Array.isArray(modelview?.objectviews) ? modelview.objectviews.filter(Boolean) : [];
      const relshipviews = Array.isArray(modelview?.relshipviews) ? modelview.relshipviews.filter(Boolean) : [];
      return viewCount + objectviews.length + relshipviews.length;
    }, 0);
  }, 0);
};

const readStoredMemoryState = (storage: Storage | undefined) => {
  if (!storage) return null;
  try {
    const raw = storage.getItem(MEMORY_STATE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

export const shouldSkipSparseStartupPersist = (nextState: any) => {
  if (typeof window === 'undefined') return false;
  if (nextState?.phFocus?.focusRefresh?.id) return false;
  const nextScore = countRenderableModelviewItems(nextState);
  const storedStates = [
    readStoredMemoryState(window.sessionStorage),
    readStoredMemoryState(window.localStorage),
  ];
  const storedScore = Math.max(0, ...storedStates.map(countRenderableModelviewItems));
  return storedScore > nextScore;
};

export const persistStandaloneModellingState = (state: any): boolean => {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).get('workspaceAuthority') === 'redux') return false;
  const snapshot = trimPersistedStateForBrowserStorage(state);
  if (shouldSkipSparseStartupPersist(snapshot)) return false;
  const result = persistMemoryState(snapshot);
  return result.sessionSaved || result.localSaved;
};
export const rememberStandaloneModel = (id: string): void => {
  if (typeof window !== 'undefined') window.localStorage.setItem(LAST_FOCUS_MODEL_STORAGE_KEY, id);
};
