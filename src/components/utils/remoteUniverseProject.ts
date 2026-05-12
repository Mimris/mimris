import { buildWorkspaceUniverseSnapshotFromMimrisState, getWorkspaceSnapshotMeta } from "./workspaceUniverseAdapter";
import { buildRemoteUniversePath, getDefaultRemoteUniverseBaseUrl, normalizeRemoteUniverseBaseUrl } from "./remoteUniverse";

const readString = (value: any) => (typeof value === "string" ? value.trim() : "");

export const saveRemoteUniverseProject = async (mimrisState: any) => {
  const meta = getWorkspaceSnapshotMeta(mimrisState?.phUser);
  const universeId =
    readString(mimrisState?.phFocus?.focusProj?.universeId) ||
    readString(meta.universeId);
  const universeApiBaseUrl = normalizeRemoteUniverseBaseUrl(
    mimrisState?.phFocus?.focusProj?.universeApiBaseUrl ||
      meta.universeApiBaseUrl ||
      getDefaultRemoteUniverseBaseUrl(),
  );
  const snapshot = buildWorkspaceUniverseSnapshotFromMimrisState(mimrisState, { universeId });
  const endpoint = universeId ? `/api/universes/${encodeURIComponent(universeId)}` : "/api/universes";
  const method = universeId ? "PUT" : "POST";

  const response = await fetch(endpoint, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ snapshot, baseUrl: universeApiBaseUrl }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.id) {
    const fallbackMessage =
      response.status === 404
        ? "Universe not found."
        : response.status === 400
          ? "Invalid remote universe request."
          : "Unable to save remote universe.";
    throw new Error(payload?.error || fallbackMessage);
  }

  const savedSnapshot = {
    ...(payload.snapshot || snapshot),
    universeId: payload.id,
    updatedAt: new Date().toISOString(),
    focus: {
      ...((payload.snapshot || snapshot).focus || {}),
      project: {
        ...((((payload.snapshot || snapshot).focus || {}).project) || {}),
        universeId: payload.id,
        universeApiBaseUrl,
      },
    },
  };

  return {
    id: payload.id,
    snapshot: savedSnapshot,
    baseUrl: universeApiBaseUrl,
    url: buildRemoteUniversePath(payload.id, universeApiBaseUrl),
  };
};
