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

export const readRemoteUniverseId = (value: any) => {
  const resolved = toSingleValue(value);
  return typeof resolved === "string" ? resolved.trim() : "";
};

export const getDefaultRemoteUniverseBaseUrl = () =>
  normalizeRemoteUniverseBaseUrl(DEFAULT_REMOTE_UNIVERSE_BASE_URL);
