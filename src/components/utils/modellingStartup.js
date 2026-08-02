const EXPLICIT_MODEL_QUERY_KEYS = [
  'share',
  'universe',
  'universeSlug',
  'project',
  'org',
  'repo',
  'file',
];

export const hasExplicitModelRequest = (query = {}) =>
  EXPLICIT_MODEL_QUERY_KEYS.some(key => {
    const value = query?.[key];
    return Array.isArray(value) ? value.some(Boolean) : Boolean(value);
  });

export const shouldOpenFreshStartupProject = (query = {}, navigationType = 'navigate') =>
  !hasExplicitModelRequest(query) && navigationType !== 'reload';
