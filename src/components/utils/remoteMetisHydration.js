const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];

const normalizeName = (value) => typeof value === 'string'
  ? value.trim().toLowerCase()
  : '';

const copyModelview = (modelview) => ({
  ...modelview,
  objectviews: asArray(modelview?.objectviews).map((objectview) => ({ ...objectview })),
  relshipviews: asArray(modelview?.relshipviews).map((relshipview) => ({ ...relshipview })),
});

const findModelMetamodel = (model, metamodels) => {
  const exact = metamodels.find((metamodel) =>
    metamodel?.id === model?.metamodelRef || metamodel?.id === model?.metamodelId
  );
  if (exact) return exact;

  const modelName = normalizeName(model?.name);
  const schemaName = normalizeName(model?.schemaName).replace(/metismodel.*$/, '');
  return metamodels.find((metamodel) => {
    const metamodelName = normalizeName(metamodel?.name).replace(/_meta$/, '');
    return metamodelName && (metamodelName === modelName || metamodelName === schemaName);
  });
};

const buildRegistries = (metamodels) => {
  const objectTypeviews = metamodels.flatMap((metamodel) => asArray(metamodel?.objecttypeviews));
  const relshipTypes = metamodels.flatMap((metamodel) => asArray(metamodel?.relshiptypes));
  const relshipTypeviews = metamodels.flatMap((metamodel) => asArray(metamodel?.relshiptypeviews));
  const relshipTypesByName = new Map();

  relshipTypes.forEach((type) => {
    const name = normalizeName(type.name);
    if (!name) return;
    const matches = relshipTypesByName.get(name) || [];
    if (!matches.some((match) => match.id === type.id)) matches.push(type);
    relshipTypesByName.set(name, matches);
  });

  return {
    objectTypeviewById: new Map(objectTypeviews.map((typeview) => [typeview.id, typeview])),
    objectTypeviewByType: new Map(objectTypeviews.map((typeview) => [typeview.typeRef, typeview])),
    relshipTypeById: new Map(relshipTypes.map((type) => [type.id, type])),
    relshipTypeviewById: new Map(relshipTypeviews.map((typeview) => [typeview.id, typeview])),
    relshipTypesByName,
  };
};

const hydrateModel = (model, metamodel, registries) => {
  if (!metamodel) return {
    ...model,
    objects: asArray(model?.objects).map((object) => ({ ...object })),
    relships: asArray(model?.relships).map((relship) => ({ ...relship })),
    modelviews: asArray(model?.modelviews).map(copyModelview),
  };

  const objectTypes = asArray(metamodel.objecttypes);
  const relshipTypes = asArray(metamodel.relshiptypes);
  const objectTypeById = new Map(objectTypes.map((type) => [type.id, type]));
  const objectTypeByName = new Map(objectTypes.map((type) => [normalizeName(type.name), type]));
  const {
    objectTypeviewById,
    objectTypeviewByType,
    relshipTypeById,
    relshipTypeviewById,
    relshipTypesByName,
  } = registries;
  const localRelshipTypesByName = new Map();

  relshipTypes.forEach((type) => {
    const name = normalizeName(type.name);
    if (!name) return;
    const matches = localRelshipTypesByName.get(name) || [];
    matches.push(type);
    localRelshipTypesByName.set(name, matches);
  });

  const objects = asArray(model?.objects).map((object) => {
    const type = objectTypeById.get(object?.typeRef) || objectTypeByName.get(normalizeName(object?.typeName));
    return type ? { ...object, typeRef: type.id, typeName: object.typeName || type.name } : { ...object };
  });
  const objectById = new Map(objects.map((object) => [object.id, object]));

  const relships = asArray(model?.relships).map((relship) => {
    let type = relshipTypeById.get(relship?.typeRef);
    if (!type) {
      const typeName = normalizeName(relship?.typeName || relship?.name);
      const localCandidates = localRelshipTypesByName.get(typeName) || [];
      const candidates = [
        ...localCandidates,
        ...(relshipTypesByName.get(typeName) || []).filter((candidate) =>
          !localCandidates.some((localCandidate) => localCandidate.id === candidate.id)
        ),
      ];
      const fromTypeRef = objectById.get(relship?.fromobjectRef)?.typeRef;
      const toTypeRef = objectById.get(relship?.toobjectRef)?.typeRef;
      type = candidates.find((candidate) =>
        candidate.fromobjtypeRef === fromTypeRef && candidate.toobjtypeRef === toTypeRef
      ) || candidates.find((candidate) =>
        candidate.typeviewRef && relshipTypeviewById.has(candidate.typeviewRef)
      ) || candidates[0];
    }
    return type ? { ...relship, typeRef: type.id, typeName: relship.typeName || type.name } : { ...relship };
  });
  const relshipById = new Map(relships.map((relship) => [relship.id, relship]));

  const modelviews = asArray(model?.modelviews).map((modelview) => ({
    ...modelview,
    objectviews: asArray(modelview?.objectviews).map((objectview) => {
      const object = objectById.get(objectview?.objectRef);
      const objectType = objectTypeById.get(object?.typeRef);
      const typeview = objectTypeviewById.get(objectview?.typeviewRef) ||
        objectTypeviewById.get(objectType?.typeviewRef) ||
        objectTypeviewByType.get(objectType?.id);
      if (!typeview) return { ...objectview };
      return {
        ...objectview,
        typeviewRef: typeview.id,
        viewkind: objectview.viewkind || typeview.viewkind,
      };
    }),
    relshipviews: asArray(modelview?.relshipviews).map((relshipview) => {
      const relship = relshipById.get(relshipview?.relshipRef);
      const relshipType = relshipTypeById.get(relship?.typeRef);
      const typeview = relshipTypeviewById.get(relshipview?.typeviewRef) ||
        relshipTypeviewById.get(relshipType?.typeviewRef);
      return typeview ? { ...relshipview, typeviewRef: typeview.id } : { ...relshipview };
    }),
  }));

  return {
    ...model,
    metamodelRef: metamodel.id,
    metamodelId: metamodel.id,
    objects,
    relships,
    modelviews,
  };
};

/**
 * Restores references omitted by lightweight workspace model exports. The
 * workspace payload keeps stable type names, while Mimris needs type and
 * typeview IDs to construct runtime objects and render their visual styles.
 */
export const hydrateRemoteMetisReferences = (metis, metamodels) => {
  const resolvedMetamodels = asArray(metamodels);
  const registries = buildRegistries(resolvedMetamodels);
  return {
    ...metis,
    metamodels: resolvedMetamodels,
    models: asArray(metis?.models).map((model) =>
      hydrateModel(model, findModelMetamodel(model, resolvedMetamodels), registries)
    ),
  };
};
