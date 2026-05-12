const toSingleValue = (value) => Array.isArray(value) ? value[0] : value;

export const normalizeGithubSource = (focusProj = {}) => {
  const rawOrg = toSingleValue(focusProj.org);
  const rawRepo = toSingleValue(focusProj.repo);
  const org = rawOrg ? String(rawOrg) : '';
  const repo = rawRepo ? String(rawRepo) : '';

  if (repo.includes('/')) {
    const [repoOrg, ...repoParts] = repo.split('/');
    const repoName = repoParts.join('/');
    return {
      org: org || repoOrg,
      repo: repoName || repo,
      repoPath: repo,
    };
  }

  return {
    org,
    repo,
    repoPath: org && repo ? `${org}/${repo}` : repo,
  };
};

export const buildFocusShareParams = (phFocus) => {
  const focusProj = phFocus?.focusProj || {};
  const githubSource = normalizeGithubSource(focusProj);
  const params = new URLSearchParams();

  const values = {
    org: githubSource.org,
    repo: githubSource.repo,
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

export const buildSnapshotSharePath = (shareId) => `/model?share=${encodeURIComponent(shareId)}`;

export const buildSnapshotShareAbsoluteUrl = (shareId, origin) => {
  const sharePath = buildSnapshotSharePath(shareId);
  if (!origin) return sharePath;
  return new URL(sharePath, origin).toString();
};

export const buildFocusShareAbsoluteUrl = (phFocus, origin) => {
  const sharePath = buildFocusSharePath(phFocus);
  if (!origin) return sharePath;
  return new URL(sharePath, origin).toString();
};

export const createSnapshotShare = async (snapshot, origin) => {
  const response = await fetch('/api/share', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ snapshot }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || 'Unable to create share snapshot.');
  }

  const payload = await response.json();
  return buildSnapshotShareAbsoluteUrl(payload.id, origin);
};

export const readShareQueryValue = (value) => {
  const resolved = toSingleValue(value);
  return typeof resolved === 'string' ? resolved : '';
};
