const DEFAULT_REMOTE_UNIVERSE_BASE_URL =
  process.env.NEXT_PUBLIC_SHARED_UNIVERSE_BASE_URL || "http://localhost:3001";

const toSingleValue = (value: any) => (Array.isArray(value) ? value[0] : value);

export const normalizeRemoteUniverseBaseUrl = (value?: any) => {
  const rawValue = toSingleValue(value);
  const baseUrl = typeof rawValue === "string" && rawValue.trim() ? rawValue.trim() : DEFAULT_REMOTE_UNIVERSE_BASE_URL;
  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new Error("Invalid remote universe base URL.");
  }
  return baseUrl.replace(/\/+$/, "");
};

export const buildRemoteUniversePath = (universeId: string, baseUrl?: string) => {
  const query = new URLSearchParams();
  query.set("universe", universeId);
  const normalizedBaseUrl = normalizeRemoteUniverseBaseUrl(baseUrl);
  if (normalizedBaseUrl !== normalizeRemoteUniverseBaseUrl(DEFAULT_REMOTE_UNIVERSE_BASE_URL)) {
    query.set("universeApi", normalizedBaseUrl);
  }
  return `/model?${query.toString()}`;
};

export const buildRemoteMetisResourceUri = (universeSlug: string, metisScope?: string, baseUrl?: string) => {
  const normalizedBaseUrl = normalizeRemoteUniverseBaseUrl(baseUrl);
  const scopePath = metisScope ? `/${encodeURIComponent(metisScope)}` : "";
  return `${normalizedBaseUrl}/api/remote-universe/${encodeURIComponent(universeSlug)}/metis${scopePath}`;
};

export type RemoteMetisFocusQuery = {
  currentMetamodelRef?: string;
  currentModelRef?: string;
  currentModelviewRef?: string;
  currentTargetMetamodelRef?: string;
  currentTargetModelRef?: string;
  currentTargetModelviewRef?: string;
  modelScope?: string;
  workItemId?: string;
  saveTarget?: string;
  revision?: string;
  workspaceAuthority?: string;
};

const appendRemoteMetisFocusQuery = (query: URLSearchParams, focusQuery?: RemoteMetisFocusQuery) => {
  if (!focusQuery) return;
  ([
    "currentMetamodelRef",
    "currentModelRef",
    "currentModelviewRef",
    "currentTargetMetamodelRef",
    "currentTargetModelRef",
    "currentTargetModelviewRef",
    "modelScope",
    "workItemId",
    "saveTarget",
    "revision",
    "workspaceAuthority",
  ] as const).forEach(key => {
    const value = focusQuery[key];
    if (typeof value === "string" && value.trim()) query.set(key, value.trim());
  });
};

export const buildRemoteMetisProxyPath = (
  universeSlug: string,
  metisScope?: string,
  baseUrl?: string,
  focusQuery?: RemoteMetisFocusQuery,
) => {
  const query = new URLSearchParams();
  query.set("baseUrl", normalizeRemoteUniverseBaseUrl(baseUrl));
  if (metisScope) {
    query.set("scope", metisScope);
  }
  appendRemoteMetisFocusQuery(query, focusQuery);
  return `/api/remote-universe/${encodeURIComponent(universeSlug)}/metis?${query.toString()}`;
};

export const readRemoteUniverseId = (value: any) => {
  const resolved = toSingleValue(value);
  return typeof resolved === "string" ? resolved.trim() : "";
};

export const readRemoteUniverseSlug = (value: any) => {
  const resolved = toSingleValue(value);
  return typeof resolved === "string" ? resolved.trim() : "";
};

export const getDefaultRemoteUniverseBaseUrl = () =>
  normalizeRemoteUniverseBaseUrl(DEFAULT_REMOTE_UNIVERSE_BASE_URL);
