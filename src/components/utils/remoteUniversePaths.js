import { normalizeMetisScope } from "./workspaceMetisResolver.js";

const DEFAULT_REMOTE_UNIVERSE_BASE_URL =
  process.env.NEXT_PUBLIC_SHARED_UNIVERSE_BASE_URL || "http://localhost:3001";

const toSingleValue = (value) => (Array.isArray(value) ? value[0] : value);

export const normalizeRemoteUniverseBaseUrl = (value) => {
  const rawValue = toSingleValue(value);
  const baseUrl = typeof rawValue === "string" && rawValue.trim() ? rawValue.trim() : DEFAULT_REMOTE_UNIVERSE_BASE_URL;
  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new Error("Invalid remote universe base URL.");
  }
  return baseUrl.replace(/\/+$/, "");
};

export const buildRemoteUniversePath = (universeId, baseUrl, metisScope, universeSlug) => {
  const query = new URLSearchParams();
  query.set("universe", universeId);
  if (typeof universeSlug === "string" && universeSlug.trim()) {
    query.set("universeSlug", universeSlug.trim());
  }
  const normalizedBaseUrl = normalizeRemoteUniverseBaseUrl(baseUrl);
  if (normalizedBaseUrl !== normalizeRemoteUniverseBaseUrl(DEFAULT_REMOTE_UNIVERSE_BASE_URL)) {
    query.set("universeApi", normalizedBaseUrl);
  }
  if (typeof metisScope === "string" && metisScope.trim()) {
    query.set("metisScope", normalizeMetisScope(metisScope));
  }
  return `/model?${query.toString()}`;
};

export const readRemoteUniverseSlug = (value) => {
  const resolved = toSingleValue(value);
  return typeof resolved === "string" ? resolved.trim() : "";
};

export const buildRemoteMetisResourceUri = (universeSlug, metisScope, baseUrl) => {
  const slug = readRemoteUniverseSlug(universeSlug);
  if (!slug) {
    throw new Error("Missing universe slug.");
  }
  const normalizedBaseUrl = normalizeRemoteUniverseBaseUrl(baseUrl);
  const normalizedScope = typeof metisScope === "string" && metisScope.trim() ? metisScope.trim() : "world-model";
  return `${normalizedBaseUrl}/api/remote-universe/${encodeURIComponent(slug)}/metis/${encodeURIComponent(normalizedScope)}`;
};

export const buildRemoteMetisProxyPath = (universeSlug, metisScope, baseUrl) => {
  const slug = readRemoteUniverseSlug(universeSlug);
  if (!slug) {
    throw new Error("Missing universe slug.");
  }
  const query = new URLSearchParams();
  const normalizedBaseUrl = normalizeRemoteUniverseBaseUrl(baseUrl);
  if (normalizedBaseUrl) {
    query.set("baseUrl", normalizedBaseUrl);
  }
  return `/api/remote-universe/${encodeURIComponent(slug)}/metis/${encodeURIComponent(metisScope)}?${query.toString()}`;
};

export const readRemoteUniverseId = (value) => {
  const resolved = toSingleValue(value);
  return typeof resolved === "string" ? resolved.trim() : "";
};

export const getDefaultRemoteUniverseBaseUrl = () =>
  normalizeRemoteUniverseBaseUrl(DEFAULT_REMOTE_UNIVERSE_BASE_URL);
