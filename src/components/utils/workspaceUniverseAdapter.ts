// @ts-nocheck

import { InitialState } from "../../reducers/reducer.js";

const WORKSPACE_SNAPSHOT_META_KEY = "__workspaceUniverse";
export const METIS_SCOPE_WORLD_MODEL = "world-model";
export const METIS_SCOPE_ORIGIN_TYPE_FOUNDATION = "origin-type-foundation";
export const METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION = "origin-template-foundation";
const DEFAULT_METIS_SCOPE = METIS_SCOPE_WORLD_MODEL;
const METIS_SCOPES = new Set([
  METIS_SCOPE_WORLD_MODEL,
  METIS_SCOPE_ORIGIN_TYPE_FOUNDATION,
  METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION,
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
const hasKeys = (value: any) => Object.keys(asRecord(value)).length > 0;
const hasRenderableModelviewContent = (modelview: any) => {
  const objectviews = Array.isArray(modelview?.objectviews) ? modelview.objectviews.filter(Boolean) : [];
  const relshipviews = Array.isArray(modelview?.relshipviews) ? modelview.relshipviews.filter(Boolean) : [];
  return objectviews.length > 0 || relshipviews.length > 0;
};

const resolveFocusableModelview = (modelviews: any[], requestedModelview: any = null) => {
  const requested = requestedModelview
    ? modelviews.find((modelview: any) => modelview?.id === requestedModelview?.id || modelview?.name === requestedModelview?.name)
    : null;
  if (requested) return requested;
  return modelviews.find(hasRenderableModelviewContent) || modelviews[0] || null;
};

const readScope = (value: any) => {
  if (value === "current" || value === "next") return METIS_SCOPE_WORLD_MODEL;
  if (value === "type-definition") return METIS_SCOPE_ORIGIN_TYPE_FOUNDATION;
  if (value === "template") return METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION;
  return typeof value === "string" && METIS_SCOPES.has(value) ? value : DEFAULT_METIS_SCOPE;
};

export const normalizeMetisScope = (value: any) => readScope(value);

const isMetisRecord = (value: any) => {
  const record = asRecord(value);
  return Array.isArray(record.metamodels) || Array.isArray(record.models);
};

const firstMetisRecord = (...values: any[]) => {
  for (const value of values) {
    if (isMetisRecord(value)) return asRecord(value);
  }
  return {};
};

const firstRecord = (...values: any[]) => {
  for (const value of values) {
    const record = asRecord(value);
    if (hasKeys(record)) return record;
  }
  return {};
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
  const originWorld = asRecord(canonical.originWorld);
  const foundationModels = asRecord(originWorld.foundationModels);
  const world = asRecord(canonical.world);

  const worldModelCandidate = firstMetisRecord(
    asRecord(world.worldModel).metis,
    asRecord(canonical.worldModel).metis,
  );
  const typeFoundationCandidate =
    asRecord(asRecord(asRecord(foundationModels.typeDefinition).metis)) ||
    asRecord(asRecord(asRecord(canonical.origin).typeDefinition).metis);
  const templateFoundationCandidate =
    asRecord(asRecord(asRecord(foundationModels.templateDefinition).metis)) ||
    asRecord(asRecord(asRecord(canonical.origin).template).metis);
  const legacyCandidate = isMetisRecord(canonical.metis) ? asRecord(canonical.metis) : {};

  return {
    canonical,
    worldModelCandidate,
    typeFoundationCandidate,
    templateFoundationCandidate,
    legacyCandidate,
  };
};

const resolveDefaultMetisSource = (snapshot: any) => {
  const {
    worldModelCandidate,
    typeFoundationCandidate,
    templateFoundationCandidate,
    legacyCandidate,
  } = getMetisCandidates(snapshot);

  if (isMetisRecord(worldModelCandidate)) {
    return { scope: METIS_SCOPE_WORLD_MODEL, metis: normalizeMetisRecord(worldModelCandidate), source: "world.worldModel.metis" };
  }
  if (isMetisRecord(typeFoundationCandidate)) {
    return {
      scope: METIS_SCOPE_ORIGIN_TYPE_FOUNDATION,
      metis: normalizeMetisRecord(typeFoundationCandidate),
      source: "originWorld.foundationModels.typeDefinition.metis",
    };
  }
  if (isMetisRecord(templateFoundationCandidate)) {
    return {
      scope: METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION,
      metis: normalizeMetisRecord(templateFoundationCandidate),
      source: "originWorld.foundationModels.templateDefinition.metis",
    };
  }
  if (isMetisRecord(legacyCandidate)) {
    return { scope: METIS_SCOPE_WORLD_MODEL, metis: normalizeMetisRecord(legacyCandidate), source: "metis" };
  }
  return { scope: DEFAULT_METIS_SCOPE, metis: normalizeMetisRecord({}), source: null };
};

export const getMetisScopeOptions = () => [
  { value: METIS_SCOPE_WORLD_MODEL, label: METIS_SCOPE_LABELS[METIS_SCOPE_WORLD_MODEL] },
  { value: METIS_SCOPE_ORIGIN_TYPE_FOUNDATION, label: METIS_SCOPE_LABELS[METIS_SCOPE_ORIGIN_TYPE_FOUNDATION] },
  { value: METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION, label: METIS_SCOPE_LABELS[METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION] },
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
    nestedSnapshot.worldDefinition ||
    nestedSnapshot.worldModel ||
    nestedSnapshot.worldOperation ||
    nestedSnapshot.operationalModel ||
    nestedSnapshot.executionModel ||
    nestedSnapshot.metis ||
    nestedSnapshot.focus ||
    nestedSnapshot.world
  ) {
    return {
      ...record,
      ...nestedSnapshot,
    };
  }
  return record;
};

const resolveWorldDefinition = (snapshot: any) => {
  const canonical = readUniverseSnapshot(snapshot);
  return firstRecord(
    asRecord(asRecord(canonical.world).worldDefinition),
    canonical.worldDefinition,
  );
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
  const { worldModelCandidate, typeFoundationCandidate, templateFoundationCandidate } = getMetisCandidates(canonical);

  if (requestedScope === METIS_SCOPE_WORLD_MODEL && isMetisRecord(worldModelCandidate)) return requestedScope;
  if (requestedScope === METIS_SCOPE_ORIGIN_TYPE_FOUNDATION && isMetisRecord(typeFoundationCandidate)) return requestedScope;
  if (requestedScope === METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION && isMetisRecord(templateFoundationCandidate)) return requestedScope;

  return resolveDefaultMetisSource(canonical).scope;
};

export const readMetisForScope = (snapshot: any, scope?: string) => {
  const requestedScope = readScope(scope || resolveActiveMetisScope(snapshot));
  const {
    worldModelCandidate,
    typeFoundationCandidate,
    templateFoundationCandidate,
  } = getMetisCandidates(snapshot);

  const scopedCandidate =
    requestedScope === METIS_SCOPE_ORIGIN_TYPE_FOUNDATION
      ? typeFoundationCandidate
      : requestedScope === METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION
        ? templateFoundationCandidate
        : worldModelCandidate;

  if (isMetisRecord(scopedCandidate)) {
    return {
      scope: requestedScope,
      metis: normalizeMetisRecord(scopedCandidate),
      source:
        requestedScope === METIS_SCOPE_ORIGIN_TYPE_FOUNDATION
          ? "originWorld.foundationModels.typeDefinition.metis"
          : requestedScope === METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION
            ? "originWorld.foundationModels.templateDefinition.metis"
            : "world.worldModel.metis",
    };
  }

  return resolveDefaultMetisSource(snapshot);
};

export const writeMetisForScope = (snapshot: any, scope: string, metis: any) => {
  const canonical = readUniverseSnapshot(snapshot);
  const resolvedScope = readScope(scope);
  const nextMetis = normalizeMetisRecord(metis);
  const nextSnapshot: any = {
    ...canonical,
    workspace: {
      ...asRecord(canonical.workspace),
      activeMetisScope: resolvedScope,
    },
  };

  if (resolvedScope === METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION) {
    nextSnapshot.originWorld = {
      ...asRecord(canonical.originWorld),
      foundationModels: {
        ...asRecord(asRecord(canonical.originWorld).foundationModels),
        templateDefinition: {
          ...asRecord(asRecord(asRecord(canonical.originWorld).foundationModels).templateDefinition),
          metis: nextMetis,
        },
      },
    };
    return nextSnapshot;
  }

  if (resolvedScope === METIS_SCOPE_ORIGIN_TYPE_FOUNDATION) {
    nextSnapshot.originWorld = {
      ...asRecord(canonical.originWorld),
      foundationModels: {
        ...asRecord(asRecord(canonical.originWorld).foundationModels),
        typeDefinition: {
          ...asRecord(asRecord(asRecord(canonical.originWorld).foundationModels).typeDefinition),
          metis: nextMetis,
        },
      },
    };
    return nextSnapshot;
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
  const worldDefinition = resolveWorldDefinition(canonical);
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
  const resolvedModelview = resolveFocusableModelview(modelviews, requestedModelview);

  const source =
    (canonical.source ??
    canonical.phSource ??
    canonical.slug) ||
    canonical.name ||
    options.sourceName ||
    projectFocus.file ||
    projectFocus.name ||
    canonical.systemPrompt ||
    InitialState.phSource;
  const phFocus = {
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
  };

  return {
    ...InitialState,
    universe: {
      world: {
        worldDefinition: {
          domain: worldDefinition.domain ?? null,
        },
        worldModel: {
          metis: {
            ...InitialState.phData?.metis,
            ...metisSource,
            models,
            metamodels,
          },
        },
        focus: phFocus,
      },
      user: canonical.user ?? canonical.phUser ?? InitialState.phUser,
      source,
      compatibility: {
        documents: toArray(canonical.compatibility?.documents || canonical.documents || canonical.phData?.documents),
        modelList: canonical.compatibility?.modelList || canonical.phList || null,
      },
    },
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
    phFocus,
    phUser: {
      ...(canonical.phUser || canonical.user || InitialState.phUser),
      [WORKSPACE_SNAPSHOT_META_KEY]: {
        snapshot: canonical,
        activeMetisScope,
        universeId: options.universeId || canonical.universeId || projectFocus.universeId || "",
        universeApiBaseUrl: options.universeApiBaseUrl || projectFocus.universeApiBaseUrl || "",
        worldOperation,
        loadedAt: new Date().toISOString(),
      },
    },
    phSource: source,
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
  const universe = asRecord(mimrisState?.universe);
  const universeWorld = asRecord(universe.world);
  const universeWorldDefinition = asRecord(universeWorld.worldDefinition);
  const universeWorldModel = asRecord(universeWorld.worldModel);
  const domain = universeWorldDefinition.domain ?? phData.domain ?? {};
  const metis = universeWorldModel.metis ?? phData.metis;
  const meta = getWorkspaceSnapshotMeta(phUser);
  const original = readUniverseSnapshot(meta.snapshot);
  const originalWorldDefinition = resolveWorldDefinition(original);
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

  const withScopedMetis = writeMetisForScope(baseSnapshot, activeMetisScope, metis);
  const withOperation = writeUniverseOperation(withScopedMetis, meta.worldOperation || originalWorldOperation);
  const nextWorldDefinition = {
    ...originalWorldDefinition,
    domain: domain || originalWorldDefinition.domain || {},
  };
  const nextWorld = {
    ...asRecord(withOperation.world),
    worldDefinition: nextWorldDefinition,
  };

  return {
    ...withOperation,
    universeId: nextUniverseId || undefined,
    projectId: nextProjectId || undefined,
    ...(hasKeys(asRecord(withOperation.worldDefinition)) ? { worldDefinition: nextWorldDefinition } : {}),
    world: nextWorld,
    user: universe.user ?? phUser ?? undefined,
    source: universe.source ?? mimrisState?.phSource ?? undefined,
    compatibility: {
      ...asRecord(universe.compatibility),
      documents: ensureArray(asRecord(universe.compatibility).documents || phData.documents),
      modelList: asRecord(universe.compatibility).modelList || mimrisState?.phList || null,
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
