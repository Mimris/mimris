// @ts-nocheck

function parseMaybeJson(value: any) {
  if (!value) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
}

export function isPersistedAppState(value: any): boolean {
  return !!(
    value &&
    typeof value === 'object' &&
    value.phData?.metis &&
    Array.isArray(value.phData.metis.models) &&
    Array.isArray(value.phData.metis.metamodels) &&
    value.phFocus
  );
}

export function normalizePersistedAppState(value: any) {
  const parsed = parseMaybeJson(value);
  if (isPersistedAppState(parsed)) {
    return parsed;
  }
  if (Array.isArray(parsed)) {
    for (let i = parsed.length - 1; i >= 0; i--) {
      const candidate = parseMaybeJson(parsed[i]);
      if (isPersistedAppState(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}

export function selectPersistedAppState(sessionState: any, localState: any) {
  return normalizePersistedAppState(sessionState) || normalizePersistedAppState(localState);
}
