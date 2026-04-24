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
const METIS_SCOPE_QUERY_VALUES = {
  [METIS_SCOPE_WORLD_MODEL]: "worldModel",
};

const toArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  if (typeof value === "object") {
    if ("id" in value) return [value];
    return Object.values(value).filter(Boolean);
  }
  return [value];
};

const asRecord = (value) => (value && typeof value === "object" ? value : {});
const pickFirstRecord = (...values) => {
  for (const value of values) {
    if (value && typeof value === "object") return value;
  }
  return {};
};

const readScope = (value) => {
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

export const normalizeMetisScope = (value) => readScope(value);
export const getMetisScopeQueryValue = (scope) =>
  METIS_SCOPE_QUERY_VALUES[readScope(scope)] || METIS_SCOPE_QUERY_VALUES[DEFAULT_METIS_SCOPE];

const isMetisRecord = (value) => {
  const record = asRecord(value);
  return Array.isArray(record.metamodels) || Array.isArray(record.models);
};

const resolveMetisNode = (value) => {
  const record = asRecord(value);
  if (isMetisRecord(record)) return record;
  if (isMetisRecord(record.metis)) return record.metis;
  return null;
};

const normalizeMetisRecord = (value) => {
  const resolved = asRecord(value);
  return {
    ...resolved,
    name: typeof resolved.name === "string" ? resolved.name : "",
    description: typeof resolved.description === "string" ? resolved.description : "",
    models: toArray(resolved.models),
    metamodels: toArray(resolved.metamodels),
  };
};

export const readUniverseSnapshot = (raw) => {
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

const getMetisCandidates = (snapshot) => {
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

const resolveDefaultMetisSource = (snapshot) => {
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

export const getAvailableMetisScopes = (snapshot) => {
  const {
    worldModelCandidate,
    legacyCandidate,
  } = getMetisCandidates(snapshot);

  return {
    [METIS_SCOPE_WORLD_MODEL]: isMetisRecord(worldModelCandidate) || isMetisRecord(legacyCandidate),
    [METIS_SCOPE_ORIGIN_TYPE_FOUNDATION]: false,
    [METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION]: false,
  };
};

export const describeMetisAvailability = (snapshot) => {
  const availableScopes = getAvailableMetisScopes(snapshot);
  const defaultSource = resolveDefaultMetisSource(snapshot);
  const usingLegacyFallback = defaultSource.source === "metis";

  return {
    availableScopes,
    defaultSource,
    usingLegacyFallback,
    hasScopedWorldModel: availableScopes[METIS_SCOPE_WORLD_MODEL] && !usingLegacyFallback,
    hasOriginTypeFoundation: availableScopes[METIS_SCOPE_ORIGIN_TYPE_FOUNDATION],
    hasOriginTemplateFoundation: availableScopes[METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION],
  };
};

export const getMetisScopeLabel = (scope) =>
  METIS_SCOPE_LABELS[readScope(scope)] || METIS_SCOPE_LABELS[DEFAULT_METIS_SCOPE];

export const setActiveMetisScope = (snapshot, scope) => {
  const canonical = readUniverseSnapshot(snapshot);
  return {
    ...canonical,
    workspace: {
      ...asRecord(canonical.workspace),
      activeMetisScope: readScope(scope),
    },
  };
};

export const resolveActiveMetisScope = (snapshot) => {
  const canonical = readUniverseSnapshot(snapshot);
  const workspace = asRecord(canonical.workspace);
  const requestedScope = readScope(workspace.activeMetisScope);
  const { worldModelCandidate } = getMetisCandidates(canonical);

  if (requestedScope === METIS_SCOPE_WORLD_MODEL && isMetisRecord(worldModelCandidate)) return requestedScope;

  return resolveDefaultMetisSource(canonical).scope;
};

export const readMetisForScope = (snapshot, scope) => {
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

export const writeMetisForScope = (snapshot, scope, metis) => {
  const canonical = readUniverseSnapshot(snapshot);
  const resolvedScope = METIS_SCOPE_WORLD_MODEL;
  const nextMetis = normalizeMetisRecord(metis);
  const nextSnapshot = {
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
