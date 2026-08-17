const PROJECT_FORMAT = 'mimris-generated-metamodel-project/v1';

const clone = (value) => JSON.parse(JSON.stringify(value));

export const buildGenerationProvenance = ({ sourceProjectId, sourceModelId, sourceModelviewId, sourceMetamodelObjectId }) => ({
  format: PROJECT_FORMAT,
  sourceProjectId: sourceProjectId || '',
  sourceModelId: sourceModelId || '',
  sourceModelviewId: sourceModelviewId || '',
  sourceMetamodelObjectId: sourceMetamodelObjectId || '',
});

const sameSource = (left, right) => Boolean(
  left?.sourceMetamodelObjectId &&
  right?.sourceMetamodelObjectId &&
  left.sourceMetamodelObjectId === right.sourceMetamodelObjectId &&
  (!left.sourceProjectId || !right.sourceProjectId || left.sourceProjectId === right.sourceProjectId)
);

const rewriteReference = (value, fromId, toId) => {
  if (Array.isArray(value)) return value.map((item) => rewriteReference(item, fromId, toId));
  if (!value || typeof value !== 'object') return value;
  const result = {};
  Object.entries(value).forEach(([key, item]) => {
    if ((key === 'id' || key.endsWith('Ref')) && item === fromId) result[key] = toId;
    else result[key] = rewriteReference(item, fromId, toId);
  });
  return result;
};

const getMetis = (project) => project?.phData?.metis;

const mergeById = (...collections) => {
  const merged = [];
  const seen = new Set();
  collections.flat().filter(Boolean).forEach((item) => {
    const key = item?.id || `${item?.name || ''}:${merged.length}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });
  return merged;
};

export const normalizeGeneratedMetamodel = (serializedMetamodel) => {
  const metamodel = clone(serializedMetamodel);
  metamodel.objecttypes = mergeById(metamodel.objecttypes || [], metamodel.objecttypes0 || []);
  metamodel.relshiptypes = mergeById(metamodel.relshiptypes || [], metamodel.relshiptypes0 || []);
  metamodel.objecttypes0 = mergeById(metamodel.objecttypes0 || []);
  metamodel.relshiptypes0 = mergeById(metamodel.relshiptypes0 || []);
  if (metamodel.relshiptypes0.length === 0) {
    metamodel.relshiptypes0 = mergeById(metamodel.relshiptypes);
  }
  metamodel.objecttypeviews = mergeById(metamodel.objecttypeviews || []);
  metamodel.relshiptypeviews = mergeById(metamodel.relshiptypeviews || []);

  const objectViewByType = new Map(metamodel.objecttypeviews.map((view) => [view?.typeRef, view]));
  metamodel.objecttypes.forEach((type) => {
    const view = objectViewByType.get(type?.id);
    if (!type.typeviewRef && view?.id) type.typeviewRef = view.id;
    if (view) {
      if (!view.name) view.name = type.name;
      if (!view.template) view.template = 'textAndIcon';
      if (!view.viewkind) view.viewkind = type.viewkind || 'Object';
    }
  });

  const relationshipViewByType = new Map(metamodel.relshiptypeviews.map((view) => [view?.typeRef, view]));
  metamodel.relshiptypes.forEach((type) => {
    const view = relationshipViewByType.get(type?.id);
    if (!type.typeviewRef && view?.id) type.typeviewRef = view.id;
    if (view && !view.name) view.name = type.name;
  });
  return metamodel;
};

const withProvenance = (metamodel, provenance) => ({
  ...normalizeGeneratedMetamodel(metamodel),
  generationProvenance: clone(provenance),
});

export const createGeneratedMetamodelProject = ({
  serializedMetamodel,
  provenance,
  projectId,
  projectName,
  modelId,
  modelName,
  modelviewId,
  modelviewName = 'Main',
  supportingMetamodels = [],
}) => {
  if (!serializedMetamodel?.id || !serializedMetamodel?.name) throw new Error('The generated metamodel is missing an id or name.');
  if (!provenance?.sourceMetamodelObjectId) throw new Error('The source Metamodel object is missing.');
  const metamodel = withProvenance(serializedMetamodel, provenance);
  const model = {
    id: modelId,
    name: modelName,
    description: '',
    metamodelRef: metamodel.id,
    sourceMetamodelRef: '',
    targetMetamodelRef: '',
    sourceModelRef: '',
    targetModelRef: '',
    isTemplate: false,
    includeSystemtypes: false,
    includeRelshipkind: false,
    templates: [],
    objects: [],
    relships: [],
    modelviews: [{
      id: modelviewId,
      name: modelviewName,
      description: '',
      layout: '',
      routing: '',
      linkcurve: '',
      modelRef: modelId,
      objectviews: [],
      relshipviews: [],
      objecttypeviews: [],
      relshiptypeviews: [],
      focusObjectviewRef: '',
      markedAsDeleted: false,
      modified: false,
    }],
    markedAsDeleted: false,
    modified: false,
    args1: [],
    args2: [],
  };
  return {
    generationProvenance: clone(provenance),
    phData: {
      metis: {
        id: projectId,
        name: projectName,
        description: `Generated from ${serializedMetamodel.name}`,
        metamodels: mergeById(metamodel, supportingMetamodels.map(clone)),
        models: [model],
        submodels: [],
        currentMetamodelRef: metamodel.id,
        currentModelRef: model.id,
        currentModelviewRef: modelviewId,
        currentTargetMetamodelRef: '',
        currentTargetModelRef: '',
        currentTargetModelviewRef: '',
      },
      domain: {},
      documents: [],
    },
    phFocus: {
      focusModel: { id: model.id },
      focusModelview: { id: modelviewId },
      focusMetamodel: { id: metamodel.id },
    },
    phUser: {},
    phSource: '.json',
    lastUpdate: new Date().toISOString(),
  };
};

export const inspectGeneratedProjectTarget = (project, serializedMetamodel, provenance) => {
  const metis = getMetis(project);
  if (!metis || !Array.isArray(metis.metamodels)) throw new Error('The selected JSON file is not a compatible Mimris project.');
  const provenanceMatch = metis.metamodels.find((item) => sameSource(item?.generationProvenance, provenance));
  if (provenanceMatch) return { match: provenanceMatch, matchType: 'provenance' };
  const projectMatch = sameSource(project?.generationProvenance, provenance);
  if (projectMatch && metis.metamodels.length === 1) return { match: metis.metamodels[0], matchType: 'project-provenance' };
  const nameMatch = metis.metamodels.find((item) => item?.name === serializedMetamodel?.name);
  if (nameMatch && !nameMatch.generationProvenance) return { match: nameMatch, matchType: 'legacy-name' };
  throw new Error(`The selected project does not contain a generated metamodel for “${serializedMetamodel?.name || ''}”.`);
};

export const updateGeneratedMetamodelProject = ({
  project,
  serializedMetamodel,
  provenance,
  allowLegacyNameMatch = false,
  supportingMetamodels = [],
}) => {
  const inspected = inspectGeneratedProjectTarget(project, serializedMetamodel, provenance);
  if (inspected.matchType === 'legacy-name' && !allowLegacyNameMatch) {
    const error = new Error('The selected project has a same-named metamodel but no generation provenance.');
    error.code = 'LEGACY_NAME_MATCH';
    throw error;
  }
  const output = clone(project);
  const metis = getMetis(output);
  const targetIndex = metis.metamodels.findIndex((item) => item?.id === inspected.match.id);
  const establishedId = inspected.match.id;
  const normalizedMetamodel = normalizeGeneratedMetamodel(serializedMetamodel);
  const generatedId = normalizedMetamodel.id;
  const rewritten = generatedId === establishedId
    ? normalizedMetamodel
    : rewriteReference(normalizedMetamodel, generatedId, establishedId);
  rewritten.id = establishedId;
  rewritten.generationProvenance = clone(provenance);
  metis.metamodels[targetIndex] = rewritten;
  metis.metamodels = mergeById(metis.metamodels, supportingMetamodels.map(clone));
  if (sameSource(output.generationProvenance, provenance) || metis.metamodels.length === 1) {
    output.generationProvenance = clone(provenance);
  }
  output.lastUpdate = new Date().toISOString();
  return output;
};

export const generatedProjectFileName = (name) => {
  const safe = String(name || 'Generated-Project')
    .trim()
    .replace(/\.json$/i, '')
    .replace(/_PR$/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-');
  return `${safe || 'Generated-Project'}_PR.json`;
};
