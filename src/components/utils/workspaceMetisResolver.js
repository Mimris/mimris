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

const readScope = (value) => {
  if (value === "current" || value === "next") return METIS_SCOPE_WORLD_MODEL;
  if (value === "type-definition") return METIS_SCOPE_ORIGIN_TYPE_FOUNDATION;
  if (value === "template") return METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION;
  return typeof value === "string" && METIS_SCOPES.has(value) ? value : DEFAULT_METIS_SCOPE;
};

export const normalizeMetisScope = (value) => readScope(value);

const isMetisRecord = (value) => {
  const record = asRecord(value);
  return Array.isArray(record.metamodels) || Array.isArray(record.models);
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
  const originWorld = asRecord(canonical.originWorld);
  const foundationModels = asRecord(originWorld.foundationModels);
  const world = asRecord(canonical.world);

  const worldModelCandidate =
    asRecord(asRecord(world.worldModel).metis) ||
    asRecord(asRecord(canonical.worldModel).metis);
  const typeFoundationCandidate =
    asRecord(asRecord(asRecord(foundationModels.typeDefinition).metis)) ||
    asRecord(asRecord(asRecord(canonical.origin).typeDefinition).metis);
  const templateFoundationCandidate =
    asRecord(asRecord(asRecord(foundationModels.templateDefinition).metis)) ||
    asRecord(asRecord(asRecord(canonical.origin).template).metis);
  const legacyCandidate = asRecord(canonical.metis);

  return {
    canonical,
    worldModelCandidate,
    typeFoundationCandidate,
    templateFoundationCandidate,
    legacyCandidate,
  };
};

const resolveDefaultMetisSource = (snapshot) => {
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

export const describeMetisAvailability = (snapshot) => {
  const {
    worldModelCandidate,
    typeFoundationCandidate,
    templateFoundationCandidate,
    legacyCandidate,
  } = getMetisCandidates(snapshot);

  return {
    [METIS_SCOPE_WORLD_MODEL]: isMetisRecord(worldModelCandidate) || isMetisRecord(legacyCandidate),
    [METIS_SCOPE_ORIGIN_TYPE_FOUNDATION]: isMetisRecord(typeFoundationCandidate),
    [METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION]: isMetisRecord(templateFoundationCandidate),
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
  const { worldModelCandidate, typeFoundationCandidate, templateFoundationCandidate } = getMetisCandidates(canonical);

  if (requestedScope === METIS_SCOPE_WORLD_MODEL && isMetisRecord(worldModelCandidate)) return requestedScope;
  if (requestedScope === METIS_SCOPE_ORIGIN_TYPE_FOUNDATION && isMetisRecord(typeFoundationCandidate)) return requestedScope;
  if (requestedScope === METIS_SCOPE_ORIGIN_TEMPLATE_FOUNDATION && isMetisRecord(templateFoundationCandidate)) return requestedScope;

  return resolveDefaultMetisSource(canonical).scope;
};

export const readMetisForScope = (snapshot, scope) => {
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

export const writeMetisForScope = (snapshot, scope, metis) => {
  const canonical = readUniverseSnapshot(snapshot);
  const resolvedScope = readScope(scope);
  const nextMetis = normalizeMetisRecord(metis);
  const nextSnapshot = {
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
