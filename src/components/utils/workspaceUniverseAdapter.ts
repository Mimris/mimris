// @ts-nocheck

import { InitialState } from "../../reducers/reducer.js";

const WORKSPACE_SNAPSHOT_META_KEY = "__workspaceUniverse";
export const METIS_SCOPE_WORLD_MODEL = "world-model";
export const METIS_SCOPE_ORIGIN_TYPE_FOUNDATION = "origin-type-foundation";
export const METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION = "origin-template-foundation";
const DEFAULT_METIS_SCOPE = METIS_SCOPE_WORLD_MODEL;
const METIS_SCOPES = new Set([
  METIS_SCOPE_WORLD_MODEL,
]);
const METIS_SCOPE_LABELS = {
  [METIS_SCOPE_WORLD_MODEL]: "World Model",
  [METIS_SCOPE_ORIGIN_TYPE_FOUNDATION]: "Origin TYPE Foundation",
  [METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION]: "Origin TEMPLATE Foundation",
};

const createId = (prefix: string) => {
  const randomValue =
    typeof globalThis !== "undefined" &&
      globalThis.crypto &&
      typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomValue}`;
};

const toArray = (value: any) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  if (typeof value === "object") {
    if ("id" in value) return [value];
    return Object.values(value).filter(Boolean);
  }
  return [value];
};

const asRecord = (value: any) => (value && typeof value === "object" ? value : {});
const pickFirstRecord = (...values: any[]) => {
  for (const value of values) {
    if (value && typeof value === "object") return value;
  }
  return {};
};

const readScope = (value: any) => {
  if (value === "current" || value === "next") return METIS_SCOPE_WORLD_MODEL;
  if (value === "type-definition") return METIS_SCOPE_WORLD_MODEL;
  if (value === "typeDefinition") return METIS_SCOPE_WORLD_MODEL;
  if (value === "template") return METIS_SCOPE_WORLD_MODEL;
  if (value === "templateDefinition") return METIS_SCOPE_WORLD_MODEL;
  if (value === METIS_SCOPE_ORIGIN_TYPE_FOUNDATION) return METIS_SCOPE_WORLD_MODEL;
  if (value === METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION) return METIS_SCOPE_WORLD_MODEL;
  if (value === "worldModel") return METIS_SCOPE_WORLD_MODEL;
  return typeof value === "string" && METIS_SCOPES.has(value) ? value : DEFAULT_METIS_SCOPE;
};

export const normalizeMetisScope = (value: any) => readScope(value);

const isMetisRecord = (value: any) => {
  const record = asRecord(value);
  return Array.isArray(record.metamodels) || Array.isArray(record.models);
};

const resolveMetisNode = (value: any) => {
  const record = asRecord(value);
  if (isMetisRecord(record)) return record;
  if (isMetisRecord(record.metis)) return record.metis;
  return null;
};

const normalizeMetisRecord = (value: any) => {
  const resolved = asRecord(value);
  return {
    ...resolved,
    name: typeof resolved.name === "string" ? resolved.name : "",
    description: typeof resolved.description === "string" ? resolved.description : "",
    models: toArray(resolved.models),
    metamodels: toArray(resolved.metamodels),
  };
};

const getMetisCandidates = (snapshot: any) => {
  const canonical = readUniverseSnapshot(snapshot);
  const world = asRecord(canonical.world);

  const worldModelCandidate = pickFirstRecord(
    resolveMetisNode(world.worldModel),
    resolveMetisNode(canonical.worldModel),
  );
  const legacyCandidate = asRecord(canonical.metis);

  return {
    canonical,
    worldModelCandidate,
    legacyCandidate,
  };
};

const resolveDefaultMetisSource = (snapshot: any) => {
  const {
    worldModelCandidate,
    legacyCandidate,
  } = getMetisCandidates(snapshot);

  if (isMetisRecord(worldModelCandidate)) {
    return { scope: METIS_SCOPE_WORLD_MODEL, metis: normalizeMetisRecord(worldModelCandidate), source: "world.worldModel.metis" };
  }
  if (isMetisRecord(legacyCandidate)) {
    return { scope: METIS_SCOPE_WORLD_MODEL, metis: normalizeMetisRecord(legacyCandidate), source: "metis" };
  }
  return { scope: DEFAULT_METIS_SCOPE, metis: normalizeMetisRecord({}), source: null };
};

export const getMetisScopeOptions = () => [
  { value: METIS_SCOPE_WORLD_MODEL, label: METIS_SCOPE_LABELS[METIS_SCOPE_WORLD_MODEL] },
];

export const getMetisScopeLabel = (scope: string) =>
  METIS_SCOPE_LABELS[readScope(scope)] || METIS_SCOPE_LABELS[DEFAULT_METIS_SCOPE];

export const setActiveMetisScope = (snapshot: any, scope: string) => {
  const canonical = readUniverseSnapshot(snapshot);
  return {
    ...canonical,
    workspace: {
      ...asRecord(canonical.workspace),
      activeMetisScope: readScope(scope),
    },
  };
};

const readFocusRef = (primary: any, fallback?: any) => {
  const source = asRecord(primary);
  if (source.id || source.name) {
    return {
      id: typeof source.id === "string" ? source.id : "",
      name: typeof source.name === "string" ? source.name : "",
    };
  }
  const alt = asRecord(fallback);
  if (alt.id || alt.name) {
    return {
      id: typeof alt.id === "string" ? alt.id : "",
      name: typeof alt.name === "string" ? alt.name : "",
    };
  }
  return null;
};

const createEmptyModelview = () => ({
  id: createId("modelview"),
  name: "0-Main",
  description: "Main view",
  objectviews: [],
  relshipviews: [],
});

const createEmptyModel = (metamodelRef = "") => ({
  id: createId("model"),
  name: "01-Empty_Model",
  description: "Empty model",
  metamodelRef,
  sourceMetamodelRef: "",
  targetMetamodelRef: "",
  targetModelRef: "",
  includeSystemtypes: false,
  isTemplate: false,
  templates: [],
  objects: [],
  relships: [],
  modelviews: [createEmptyModelview()],
  markedAsDeleted: false,
  modified: false,
});

export const isWorkspaceUniverseSnapshot = (value: any) => {
  if (!value || typeof value !== "object") return false;
  if (value.phData) return false;
  return Boolean(
    value.snapshot ||
    value.world ||
    value.worldOperation ||
    value.worldDefinition ||
    value.worldModel ||
    value.operationalModel ||
    value.metis ||
    value.executionModel ||
    value.focus,
  );
};

export const readUniverseSnapshot = (raw: any) => {
  const record = asRecord(raw);
  const nestedSnapshot = asRecord(record.snapshot);
  if (
    nestedSnapshot.world ||
    nestedSnapshot.worldDefinition ||
    nestedSnapshot.worldModel ||
    nestedSnapshot.worldOperation ||
    nestedSnapshot.operationalModel ||
    nestedSnapshot.executionModel ||
    nestedSnapshot.metis ||
    nestedSnapshot.focus
  ) {
    return {
      ...record,
      ...nestedSnapshot,
    };
  }
  return record;
};

export const resolveUniverseOperation = (snapshot: any) => {
  const canonical = readUniverseSnapshot(snapshot);
  return asRecord(
    canonical.worldOperation ??
    canonical.operationalModel ??
    canonical.executionModel,
  );
};

export const writeUniverseOperation = (snapshot: any, operation: any) => {
  const canonical = readUniverseSnapshot(snapshot);
  const resolvedOperation = asRecord(operation);
  const nextSnapshot: any = {
    ...canonical,
    worldOperation: resolvedOperation,
  };
  if ("operationalModel" in canonical) {
    nextSnapshot.operationalModel = resolvedOperation;
  }
  return nextSnapshot;
};

export const resolveActiveMetisScope = (snapshot: any) => {
  const canonical = readUniverseSnapshot(snapshot);
  const workspace = asRecord(canonical.workspace);
  const requestedScope = readScope(workspace.activeMetisScope);
  const { worldModelCandidate } = getMetisCandidates(canonical);

  if (requestedScope === METIS_SCOPE_WORLD_MODEL && isMetisRecord(worldModelCandidate)) return requestedScope;

  return resolveDefaultMetisSource(canonical).scope;
};

export const readMetisForScope = (snapshot: any, scope?: string) => {
  const requestedScope = readScope(scope || resolveActiveMetisScope(snapshot));
  const { worldModelCandidate } = getMetisCandidates(snapshot);
  const scopedCandidate = worldModelCandidate;

  if (isMetisRecord(scopedCandidate)) {
    return {
      scope: requestedScope,
      metis: normalizeMetisRecord(scopedCandidate),
      source: "world.worldModel.metis",
    };
  }

  return resolveDefaultMetisSource(snapshot);
};

export const writeMetisForScope = (snapshot: any, scope: string, metis: any) => {
  const canonical = readUniverseSnapshot(snapshot);
  const resolvedScope = METIS_SCOPE_WORLD_MODEL;
  const nextMetis = normalizeMetisRecord(metis);
  const nextSnapshot: any = {
    ...canonical,
    workspace: {
      ...asRecord(canonical.workspace),
      activeMetisScope: resolvedScope,
    },
  };

  if ("metis" in nextSnapshot) {
    delete nextSnapshot.metis;
  }

  nextSnapshot.world = {
    ...asRecord(canonical.world),
    worldModel: {
      ...asRecord(asRecord(canonical.world).worldModel),
      metis: nextMetis,
    },
  };

  return nextSnapshot;
};

export const buildMimrisStateFromWorkspaceSnapshot = (
  snapshot: any,
  options: { sourceName?: string; sourcePath?: string; universeId?: string; universeApiBaseUrl?: string } = {},
) => {
  const canonical = readUniverseSnapshot(snapshot);
  const worldDefinition = asRecord(canonical.worldDefinition);
  const { scope: activeMetisScope, metis: metisSource } = readMetisForScope(canonical);
  const worldOperation = resolveUniverseOperation(canonical);
  const focusSource = asRecord(canonical.focus);
  const worldModelFocus = asRecord(focusSource.worldModel);
  const projectFocus = asRecord(focusSource.project || focusSource.focusProj);
  const documentFocus = asRecord(focusSource.document);
  const operationalFocus = asRecord(focusSource.operational);

  const baseModels = toArray(metisSource.models);
  const metamodels = toArray(metisSource.metamodels);
  const models =
    baseModels.length > 0
      ? baseModels
      : [createEmptyModel(metamodels[0]?.id || "")];
  const requestedModel =
    readFocusRef(worldModelFocus.model, focusSource.focusModel) ||
    readFocusRef(canonical.focusModel) ||
    null;
  const resolvedModel =
    models.find((model: any) => model?.id === requestedModel?.id || model?.name === requestedModel?.name) ||
    models[0] ||
    null;
  const modelviews = toArray(resolvedModel?.modelviews);
  const requestedModelview =
    readFocusRef(worldModelFocus.modelview, focusSource.focusModelview) ||
    readFocusRef(canonical.focusModelview) ||
    null;
  const resolvedModelview =
    modelviews.find((modelview: any) => modelview?.id === requestedModelview?.id || modelview?.name === requestedModelview?.name) ||
    modelviews[0] ||
    null;

  return {
    ...InitialState,
    phData: {
      ...InitialState.phData,
      ...(worldDefinition.domain ? { domain: worldDefinition.domain } : {}),
      metis: {
        ...InitialState.phData?.metis,
        ...metisSource,
        models,
        metamodels,
      },
    },
    phFocus: {
      ...InitialState.phFocus,
      focusProj: {
        ...InitialState.phFocus?.focusProj,
        id: projectFocus.id || "",
        projectId: canonical.projectId || projectFocus.projectId || "",
        universeId: options.universeId || canonical.universeId || projectFocus.universeId || "",
        universeApiBaseUrl: options.universeApiBaseUrl || projectFocus.universeApiBaseUrl || "",
        name: projectFocus.name || canonical.name || options.sourceName || "",
        description: projectFocus.description || "",
        slug: canonical.slug || "",
        kind: canonical.kind || "",
        savedAt: canonical.savedAt || "",
        universeCoordination: canonical.universeCoordination,
        org: projectFocus.org || "",
        repo: projectFocus.repo || "",
        branch: projectFocus.branch || "",
        path: projectFocus.path || "",
        file: projectFocus.file || options.sourcePath || "",
      },
      focusModel: resolvedModel ? { id: resolvedModel.id, name: resolvedModel.name } : null,
      focusModelview: resolvedModelview ? { id: resolvedModelview.id, name: resolvedModelview.name } : null,
      focusObject: readFocusRef(worldModelFocus.object, focusSource.focusObject),
      focusObjectview: readFocusRef(worldModelFocus.objectview, focusSource.focusObjectview),
      focusRelship: readFocusRef(worldModelFocus.relship, focusSource.focusRelship),
      focusRelshipview: readFocusRef(worldModelFocus.relshipview, focusSource.focusRelshipview),
      focusTargetModel: readFocusRef(worldModelFocus.targetModel, focusSource.focusTargetModel),
      focusTargetModelview: readFocusRef(worldModelFocus.targetModelview, focusSource.focusTargetModelview),
      focusTask: readFocusRef(operationalFocus.task, focusSource.focusTask),
      focusRole: readFocusRef(operationalFocus.role, focusSource.focusRole),
      focusDoc: readFocusRef(documentFocus.doc, focusSource.focusDoc),
    },
    phUser: {
      ...(canonical.phUser || InitialState.phUser),
      [WORKSPACE_SNAPSHOT_META_KEY]: {
        snapshot: canonical,
        activeMetisScope,
        universeId: options.universeId || canonical.universeId || projectFocus.universeId || "",
        universeApiBaseUrl: options.universeApiBaseUrl || projectFocus.universeApiBaseUrl || "",
        worldOperation,
        loadedAt: new Date().toISOString(),
      },
    },
    phSource:
      canonical.slug ||
      canonical.name ||
      options.sourceName ||
      projectFocus.file ||
      projectFocus.name ||
      canonical.systemPrompt ||
      InitialState.phSource,
    lastUpdate: new Date().toISOString(),
  };
};

const cleanObject = (value: any) =>
  Object.fromEntries(Object.entries(asRecord(value)).filter(([, entry]) => entry !== undefined));

const ensureArray = (value: any) => (Array.isArray(value) ? value.filter(Boolean) : []);

const toFocusEntity = (value: any) => {
  const record = asRecord(value);
  if (!record.id && !record.name) return null;
  return cleanObject({
    id: record.id || "",
    name: record.name || "",
    description: record.description,
    org: record.org,
    repo: record.repo,
    branch: record.branch,
    path: record.path,
    file: record.file,
  });
};

export const getWorkspaceSnapshotMeta = (phUser: any) =>
  asRecord(asRecord(phUser)[WORKSPACE_SNAPSHOT_META_KEY]);

export const buildWorkspaceUniverseSnapshotFromMimrisState = (
  mimrisState: any,
  options: { projectId?: string; universeId?: string } = {},
) => {
  const phData = asRecord(mimrisState?.phData);
  const phFocus = asRecord(mimrisState?.phFocus);
  const phUser = asRecord(mimrisState?.phUser);
  const meta = getWorkspaceSnapshotMeta(phUser);
  const original = readUniverseSnapshot(meta.snapshot);
  const originalWorldDefinition = asRecord(original.worldDefinition);
  const originalWorldOperation = resolveUniverseOperation(original);
  const originalFocus = asRecord(original.focus);
  const projectFocus = asRecord(phFocus.focusProj);
  const activeMetisScope = readScope(meta.activeMetisScope || resolveActiveMetisScope(original));

  const baseSnapshot = {
    ...Object.fromEntries(
      Object.entries(original).filter(([key]) => !["executionModel", "focusModel", "focusModelview"].includes(key)),
    ),
  };

  const nextProjectId =
    options.projectId ||
    projectFocus.projectId ||
    original.projectId ||
    meta.projectId ||
    "";
  const nextUniverseId =
    options.universeId ||
    projectFocus.universeId ||
    original.universeId ||
    meta.universeId ||
    "";

  const withScopedMetis = writeMetisForScope(baseSnapshot, activeMetisScope, phData.metis);
  const withOperation = writeUniverseOperation(withScopedMetis, meta.worldOperation || originalWorldOperation);

  return {
    ...withOperation,
    universeId: nextUniverseId || undefined,
    projectId: nextProjectId || undefined,
    worldDefinition: {
      ...originalWorldDefinition,
      domain: phData.domain || originalWorldDefinition.domain || {},
    },
    focus: {
      ...originalFocus,
      scope: originalFocus.scope || "world-model",
      project: cleanObject({
        ...asRecord(originalFocus.project),
        ...projectFocus,
        projectId: nextProjectId || projectFocus.projectId || originalFocus?.project?.projectId,
        universeId: nextUniverseId || projectFocus.universeId || originalFocus?.project?.universeId,
        universeApiBaseUrl: projectFocus.universeApiBaseUrl || originalFocus?.project?.universeApiBaseUrl,
      }),
      worldModel: {
        ...asRecord(originalFocus.worldModel),
        model: toFocusEntity(phFocus.focusModel),
        modelview: toFocusEntity(phFocus.focusModelview),
        object: toFocusEntity(phFocus.focusObject),
        objectview: toFocusEntity(phFocus.focusObjectview),
        relship: toFocusEntity(phFocus.focusRelship),
        relshipview: toFocusEntity(phFocus.focusRelshipview),
        targetModel: toFocusEntity(phFocus.focusTargetModel),
        targetModelview: toFocusEntity(phFocus.focusTargetModelview),
      },
      operational: {
        ...asRecord(originalFocus.operational),
        task: toFocusEntity(phFocus.focusTask),
        role: toFocusEntity(phFocus.focusRole),
      },
      document: {
        ...asRecord(originalFocus.document),
        doc: toFocusEntity(phFocus.focusDoc),
      },
      meta: {
        ...asRecord(originalFocus.meta),
        source: mimrisState?.phSource || originalFocus?.meta?.source || "",
        updatedAt: new Date().toISOString(),
      },
    },
  };
};
