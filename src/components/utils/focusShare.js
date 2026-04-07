const toSingleValue = (value) => Array.isArray(value) ? value[0] : value;

export const buildFocusShareParams = (phFocus) => {
  const focusProj = phFocus?.focusProj || {};
  const params = new URLSearchParams();

  const values = {
    org: toSingleValue(focusProj.org),
    repo: toSingleValue(focusProj.repo),
    branch: toSingleValue(focusProj.branch),
    path: toSingleValue(focusProj.path),
    file: toSingleValue(focusProj.file),
    model: toSingleValue(phFocus?.focusModel?.id || phFocus?.focusModel?.name),
    modelview: toSingleValue(phFocus?.focusModelview?.id || phFocus?.focusModelview?.name),
  };

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  return params;
};

export const buildFocusSharePath = (phFocus) => {
  const query = buildFocusShareParams(phFocus).toString();
  return query ? `/model?${query}` : '/model';
};

export const buildFocusShareAbsoluteUrl = (phFocus, origin) => {
  const sharePath = buildFocusSharePath(phFocus);
  if (!origin) return sharePath;
  return new URL(sharePath, origin).toString();
};

export const readShareQueryValue = (value) => {
  const resolved = toSingleValue(value);
  return typeof resolved === 'string' ? resolved : '';
};
