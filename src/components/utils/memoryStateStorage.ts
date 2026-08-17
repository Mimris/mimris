export const MEMORY_STATE_STORAGE_KEY = 'memorystate';

type StorageLike = Pick<Storage, 'setItem' | 'removeItem'>;

const isQuotaExceededError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  const domError = error as DOMException;
  return (
    domError.name === 'QuotaExceededError' ||
    domError.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    domError.code === 22 ||
    domError.code === 1014
  );
};

const setStoredValue = (storage: StorageLike | undefined, value: string) => {
  if (!storage) return false;
  storage.setItem(MEMORY_STATE_STORAGE_KEY, value);
  return true;
};

export const persistMemoryState = (snapshot: unknown) => {
  const serialized = JSON.stringify(snapshot);
  let sessionSaved = false;
  let sessionQuotaExceeded = false;
  let localSaved = false;
  let localQuotaExceeded = false;

  if (typeof window === 'undefined') {
    return { sessionSaved, sessionQuotaExceeded, localSaved, localQuotaExceeded };
  }

  try {
    sessionSaved = setStoredValue(window.sessionStorage, serialized);
  } catch (error) {
    if (!isQuotaExceededError(error)) throw error;
    sessionQuotaExceeded = true;
  }

  try {
    localSaved = setStoredValue(window.localStorage, serialized);
  } catch (error) {
    if (!isQuotaExceededError(error)) throw error;
    localQuotaExceeded = true;
    try {
      window.localStorage.removeItem(MEMORY_STATE_STORAGE_KEY);
    } catch (_) {
      // Ignore cleanup failures; session storage still has the current draft.
    }
  }

  return { sessionSaved, sessionQuotaExceeded, localSaved, localQuotaExceeded };
};
