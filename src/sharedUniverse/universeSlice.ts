import { createAction, type AnyAction } from '@reduxjs/toolkit';

export type LegacyUniverseRoot = {
    universe?: SharedUniverseState;
    phList?: unknown;
    phData?: {
        domain?: unknown;
        metis?: unknown;
        documents?: unknown;
    };
    phFocus?: unknown;
    phUser?: unknown;
    phSource?: unknown;
};

type LegacyPhData = {
    domain?: unknown;
    metis?: unknown;
    documents?: unknown;
};

export type SharedUniverseState = {
    world: {
        worldDefinition: {
            domain: unknown;
        };
        worldModel: {
            metis: unknown;
        };
        focus: unknown;
    };
    user: unknown;
    source: unknown;
    compatibility: {
        documents: unknown[];
        modelList: unknown;
    };
};

export type LegacyUniverseSnapshot = {
    phData?: unknown;
    phFocus?: unknown;
    phUser?: unknown;
    phSource?: unknown;
};

const EMPTY_DOCUMENTS: unknown[] = [];

const mergeDomainPatch = (domain: unknown, patch: unknown) => {
    if (
        domain &&
        patch &&
        typeof domain === 'object' &&
        typeof patch === 'object' &&
        !Array.isArray(domain) &&
        !Array.isArray(patch)
    ) {
        return {
            ...(domain as Record<string, unknown>),
            ...(patch as Record<string, unknown>),
        };
    }

    return patch;
};

const mergeObjectPatch = (value: unknown, patch: Record<string, unknown>) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return {
            ...(value as Record<string, unknown>),
            ...patch,
        };
    }

    return patch;
};

const legacyFocusFieldByActionType: Record<string, string> = {
    SET_FOCUS_TAB: 'focusTab',
    SET_FOCUS_MODEL: 'focusModel',
    SET_FOCUS_MODELVIEW: 'focusModelview',
    SET_FOCUS_TARGETMETAMODEL: 'focusTargetMetamodel',
    SET_FOCUS_TARGETMODEL: 'focusTargetModel',
    SET_FOCUS_TARGETMODELVIEW: 'focusTargetModelview',
    SET_FOCUS_OBJECT: 'focusObject',
    SET_FOCUS_OBJECTVIEW: 'focusObjectview',
    SET_FOCUS_RELSHIP: 'focusRelship',
    SET_FOCUS_RELSHIPVIEW: 'focusRelshipview',
    SET_FOCUS_OBJECTTYPE: 'focusObjecttype',
    SET_FOCUS_RELSHIPTYPE: 'focusRelshiptype',
    SET_FOCUS_PROJ: 'focusProj',
    SET_FOCUS_ORG: 'focusOrg',
    SET_FOCUS_ROLE: 'focusRole',
    SET_FOCUS_COLLECTION: 'focusCollection',
    SET_FOCUS_TASK: 'focusTask',
    SET_FOCUS_ISSUE: 'focusIssue',
    SET_FOCUS_SOURCE: 'focusSource',
    SET_FOCUS_REFRESH: 'focusRefresh',
};

const asRecord = (value: unknown): Record<string, any> =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, any>
        : {};

const replaceArrayItem = <T,>(items: T[], index: number, item: T) => [
    ...items.slice(0, index),
    item,
    ...items.slice(index + 1),
];

const makeUniqueViewId = (id: string, modelviewId: string, usedIds: Set<string>) => {
    const baseId = id || 'objectview';
    const scopedBaseId = `${baseId}-${modelviewId || 'modelview'}`;
    let candidateId = scopedBaseId;
    let index = 2;
    while (usedIds.has(candidateId)) {
        candidateId = `${scopedBaseId}-${index}`;
        index += 1;
    }
    return candidateId;
};

export const normalizeModelviewObjectviewIdentities = (metis: unknown) => {
    const metisRecord = asRecord(metis);
    const models: any[] = Array.isArray(metisRecord.models) ? metisRecord.models : [];
    if (!models.length) return metis;

    let didChange = false;
    const usedObjectviewIds = new Set<string>();

    const normalizedModels = models.map((model) => {
        const modelviews: any[] = Array.isArray(model?.modelviews) ? model.modelviews : [];
        if (!modelviews.length) return model;

        let modelDidChange = false;
        const normalizedModelviews = modelviews.map((modelview) => {
            const objectviews: any[] = Array.isArray(modelview?.objectviews) ? modelview.objectviews : [];
            if (!objectviews.length) return modelview;

            const idMap = new Map<string, string>();
            let modelviewDidChange = false;

            const normalizedObjectviews = objectviews.map((objectview) => {
                const currentId = objectview?.id;
                if (!currentId || usedObjectviewIds.has(currentId) || currentId === objectview?.objectRef) {
                    const nextId = makeUniqueViewId(currentId, modelview?.id, usedObjectviewIds);
                    if (currentId) idMap.set(currentId, nextId);
                    usedObjectviewIds.add(nextId);
                    modelviewDidChange = true;
                    return {
                        ...objectview,
                        id: nextId,
                    };
                }

                usedObjectviewIds.add(currentId);
                return objectview;
            });
            const normalizedObjectviewsWithGroups = idMap.size
                ? normalizedObjectviews.map((objectview) => {
                    const group = idMap.get(objectview?.group);
                    if (!group) return objectview;
                    modelviewDidChange = true;
                    return {
                        ...objectview,
                        group,
                    };
                })
                : normalizedObjectviews;

            const relshipviews: any[] = Array.isArray(modelview?.relshipviews) ? modelview.relshipviews : [];
            const normalizedRelshipviews = idMap.size
                ? relshipviews.map((relshipview) => {
                    const fromobjviewRef = idMap.get(relshipview?.fromobjviewRef);
                    const toobjviewRef = idMap.get(relshipview?.toobjviewRef);
                    if (!fromobjviewRef && !toobjviewRef) return relshipview;
                    modelviewDidChange = true;
                    return {
                        ...relshipview,
                        ...(fromobjviewRef ? { fromobjviewRef } : {}),
                        ...(toobjviewRef ? { toobjviewRef } : {}),
                    };
                })
                : relshipviews;

            if (!modelviewDidChange) return modelview;
            modelDidChange = true;
            didChange = true;
            return {
                ...modelview,
                objectviews: normalizedObjectviewsWithGroups,
                ...(Array.isArray(modelview?.relshipviews) ? { relshipviews: normalizedRelshipviews } : {}),
            };
        });

        if (!modelDidChange) return model;
        return {
            ...model,
            modelviews: normalizedModelviews,
        };
    });

    if (!didChange) return metis;
    return {
        ...metisRecord,
        models: normalizedModels,
    };
};

const VIEW_GEOMETRY_FIELDS = ['loc', 'group', 'scale', 'scale1', 'size'];

const buildScopedViewPatchMap = (
    metis: unknown,
    collectionName: 'objectviews' | 'relshipviews',
    fields: string[],
) => {
    const patches = new Map<string, Record<string, unknown>>();
    const models: any[] = Array.isArray(asRecord(metis).models) ? asRecord(metis).models : [];

    models.forEach((model) => {
        const modelviews: any[] = Array.isArray(model?.modelviews) ? model.modelviews : [];
        modelviews.forEach((modelview) => {
            const collection: any[] = Array.isArray(modelview?.[collectionName]) ? modelview[collectionName] : [];
            collection.forEach((item) => {
                if (!item?.id || !modelview?.id) return;
                const patch: Record<string, unknown> = {};
                fields.forEach((field) => {
                    if (item[field] !== undefined) patch[field] = item[field];
                });
                if (Object.keys(patch).length > 0) {
                    patches.set(`${modelview.id}:${item.id}`, patch);
                }
            });
        });
    });

    return patches;
};

const preserveCurrentViewGeometryForMatchingItems = (
    incomingMetis: unknown,
    currentMetis: unknown,
) => {
    const incoming = asRecord(incomingMetis);
    const models: any[] = Array.isArray(incoming.models) ? incoming.models : [];
    if (!models.length) return incomingMetis;

    const objectviewPatches = buildScopedViewPatchMap(currentMetis, 'objectviews', VIEW_GEOMETRY_FIELDS);
    if (!objectviewPatches.size) return incomingMetis;

    let didChange = false;
    const nextModels = models.map((model) => {
        const modelviews: any[] = Array.isArray(model?.modelviews) ? model.modelviews : [];
        if (!modelviews.length) return model;

        let modelDidChange = false;
        const nextModelviews = modelviews.map((modelview) => {
            const objectviews: any[] = Array.isArray(modelview?.objectviews) ? modelview.objectviews : [];
            if (!objectviews.length || !modelview?.id) return modelview;

            let modelviewDidChange = false;
            const nextObjectviews = objectviews.map((objectview) => {
                const patch = objectview?.id ? objectviewPatches.get(`${modelview.id}:${objectview.id}`) : null;
                if (!patch) return objectview;
                let itemDidChange = false;
                for (const [key, value] of Object.entries(patch)) {
                    if (objectview?.[key] !== value) {
                        itemDidChange = true;
                        break;
                    }
                }
                if (!itemDidChange) return objectview;
                modelviewDidChange = true;
                modelDidChange = true;
                didChange = true;
                return {
                    ...objectview,
                    ...patch,
                };
            });

            return modelviewDidChange
                ? {
                    ...modelview,
                    objectviews: nextObjectviews,
                }
                : modelview;
        });

        return modelDidChange
            ? {
                ...model,
                modelviews: nextModelviews,
            }
            : model;
    });

    return didChange
        ? {
            ...incoming,
            models: nextModels,
        }
        : incomingMetis;
};

const updateMetis = (
    state: SharedUniverseState,
    metis: unknown,
    focus = state.world.focus,
): SharedUniverseState => ({
    ...state,
    world: {
        ...state.world,
        worldModel: {
            ...state.world.worldModel,
            metis: normalizeModelviewObjectviewIdentities(metis),
        },
        focus,
    },
});

const findModelIndex = (
    models: any[],
    focus: Record<string, any>,
    modelId?: string,
) => {
    const explicitIndex = modelId
        ? models.findIndex((model) => model?.id === modelId)
        : -1;
    if (explicitIndex >= 0) return explicitIndex;

    const focusModelId = focus?.focusModel?.id;
    const focusIndex = focusModelId
        ? models.findIndex((model) => model?.id === focusModelId)
        : -1;

    return focusIndex >= 0 ? focusIndex : 0;
};

const hasRenderableModelviewContent = (modelview: any) => {
    const objectviews: any[] = Array.isArray(modelview?.objectviews) ? modelview.objectviews.filter(Boolean) : [];
    const relshipviews: any[] = Array.isArray(modelview?.relshipviews) ? modelview.relshipviews.filter(Boolean) : [];
    return objectviews.length > 0 || relshipviews.length > 0;
};

const resolveFocusableModelview = (model: any, requestedModelview: any = null) => {
    const modelviews: any[] = Array.isArray(model?.modelviews) ? model.modelviews.filter(Boolean) : [];
    if (!modelviews.length) return null;

    const requested = requestedModelview
        ? modelviews.find((modelview) => (
            modelview?.id === requestedModelview?.id ||
            modelview?.name === requestedModelview?.name
        ))
        : null;
    if (requested) return requested;

    return modelviews.find(hasRenderableModelviewContent) || modelviews[0] || null;
};

const normalizeFocusForMetis = (metis: unknown, focus: unknown) => {
    const focusRecord = asRecord(focus);
    if (!Object.keys(focusRecord).length) return focus;

    const metisRecord = asRecord(metis);
    const models: any[] = Array.isArray(metisRecord.models) ? metisRecord.models : [];
    if (!models.length) return focus;

    const requestedModel = focusRecord.focusModel;
    const resolvedModel = requestedModel
        ? models.find((model) => (
            model?.id === requestedModel?.id ||
            model?.name === requestedModel?.name
        ))
        : null;
    const focusModel = resolvedModel || models[0] || focusRecord.focusModel;
    const focusModelview = resolveFocusableModelview(focusModel, focusRecord.focusModelview)
        || focusRecord.focusModelview;

    return {
        ...focusRecord,
        focusModel,
        focusModelview,
    };
};

const updateFocusedItem = (
    focus: Record<string, any>,
    field: string,
    patch: Record<string, unknown>,
) => {
    const currentValue = focus?.[field];
    if (!currentValue?.id || currentValue.id !== patch?.id) return focus;

    return {
        ...focus,
        [field]: {
            ...currentValue,
            ...patch,
        },
    };
};

const reorderById = (items: any[], sourceId?: string, targetId?: string) => {
    const sourceIndex = items.findIndex((item) => item?.id === sourceId);
    const targetIndex = items.findIndex((item) => item?.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return items;

    const reorderedItems = [...items];
    const [movedItem] = reorderedItems.splice(sourceIndex, 1);
    reorderedItems.splice(targetIndex, 0, movedItem);

    return reorderedItems;
};

const sanitizeModelviewPatch = (patch: Record<string, unknown>) => {
    const sanitizedPatch = { ...patch };
    delete sanitizedPatch.objectviews;
    delete sanitizedPatch.relshipviews;
    delete sanitizedPatch.objecttypeviews;
    delete sanitizedPatch.relshiptypeviews;
    return sanitizedPatch;
};

const OPTIONAL_OBJECTVIEW_FIELDS = [
    'text', 'template', 'template2', 'figure', 'figure2', 'geometry',
    'group', 'groupLayout', 'icomStyle',
    'fillcolor', 'fillcolor1', 'fillcolor2', 'strokecolor', 'strokecolor2', 'strokewidth',
    'textcolor', 'textcolor2', 'textscale', 'memberscale', 'arrowscale',
    'icon', 'iconpath', 'icon1', 'icon2', 'icon3', 'image',
    'size', 'scale',
];

const OPTIONAL_RELSHIPVIEW_FIELDS = [
    'template2', 'arrowscale', 'strokecolor', 'strokewidth',
    'textcolor', 'textscale', 'dash', 'routing', 'curve', 'corner',
    'fromArrow', 'toArrow', 'fromArrowColor', 'toArrowColor',
];

const mergeAndPruneOptionalEmptyFields = (
    currentItem: Record<string, any> | undefined,
    patch: Record<string, unknown>,
    optionalFields: string[],
) => {
    const merged = {
        ...(currentItem || {}),
        ...patch,
    };

    optionalFields.forEach((field) => {
        if (!Object.prototype.hasOwnProperty.call(patch, field)) {
            if (merged[field] === undefined || merged[field] === null || merged[field] === '') {
                delete merged[field];
            }
        }
    });

    return merged;
};

const updateCurrentModelCollection = (
    state: SharedUniverseState,
    collectionName: 'objects' | 'relships',
    patch: Record<string, unknown>,
) => {
    const metis = asRecord(state.world.worldModel.metis);
    const models: any[] = Array.isArray(metis.models) ? metis.models : [];
    if (!models.length) return state;

    const focus = asRecord(state.world.focus);
    const modelIndex = findModelIndex(models, focus);
    const model = models[modelIndex];
    if (!model) return state;

    const collection: any[] = Array.isArray(model?.[collectionName]) ? model[collectionName] : [];
    const itemIndex = patch.id
        ? collection.findIndex((item) => item?.id === patch.id)
        : -1;
    const targetIndex = itemIndex >= 0 ? itemIndex : collection.length;
    const nextCollection = replaceArrayItem(collection, targetIndex, {
        ...(collection[targetIndex] || {}),
        ...patch,
    });
    const nextModels = replaceArrayItem(models, modelIndex, {
        ...model,
        [collectionName]: nextCollection,
    });

    return updateMetis(state, {
        ...metis,
        models: nextModels,
    });
};

const findModelviewForItem = (
    models: any[],
    collectionName: 'objectviews' | 'relshipviews',
    itemId?: string,
    focus?: Record<string, any>,
    modelviewId?: string,
) => {
    if (modelviewId) {
        for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
            const modelviews: any[] = Array.isArray(models[modelIndex]?.modelviews)
                ? models[modelIndex].modelviews
                : [];
            const modelviewIndex = modelviews.findIndex((modelview) => modelview?.id === modelviewId);
            if (modelviewIndex >= 0) {
                const collection: any[] = Array.isArray(modelviews[modelviewIndex]?.[collectionName])
                    ? modelviews[modelviewIndex][collectionName]
                    : [];
                const itemIndex = itemId
                    ? collection.findIndex((item) => item?.id === itemId)
                    : -1;
                return { modelIndex, modelviewIndex, itemIndex };
            }
        }
    }

    const focusedModelIndex = findModelIndex(models, focus || {});
    const focusedModel = models[focusedModelIndex];
    const focusedModelviews: any[] = Array.isArray(focusedModel?.modelviews) ? focusedModel.modelviews : [];
    const focusedModelviewIndex = focus?.focusModelview?.id
        ? focusedModelviews.findIndex((modelview) => modelview?.id === focus.focusModelview.id)
        : 0;
    const normalizedFocusedModelviewIndex = focusedModelviewIndex >= 0 ? focusedModelviewIndex : 0;
    const focusedModelview = focusedModelviews[normalizedFocusedModelviewIndex];
    const focusedCollection: any[] = Array.isArray(focusedModelview?.[collectionName])
        ? focusedModelview[collectionName]
        : [];
    const focusedItemIndex = itemId
        ? focusedCollection.findIndex((item) => item?.id === itemId)
        : -1;
    if (focusedItemIndex >= 0 || !itemId) {
        return {
            modelIndex: focusedModelIndex,
            modelviewIndex: normalizedFocusedModelviewIndex,
            itemIndex: focusedItemIndex,
        };
    }

    for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
        const modelviews: any[] = Array.isArray(models[modelIndex]?.modelviews)
            ? models[modelIndex].modelviews
            : [];
        for (let modelviewIndex = 0; modelviewIndex < modelviews.length; modelviewIndex += 1) {
            const collection: any[] = Array.isArray(modelviews[modelviewIndex]?.[collectionName])
                ? modelviews[modelviewIndex][collectionName]
                : [];
            const itemIndex = collection.findIndex((item) => item?.id === itemId);
            if (itemIndex >= 0) return { modelIndex, modelviewIndex, itemIndex };
        }
    }

    return {
        modelIndex: focusedModelIndex,
        modelviewIndex: normalizedFocusedModelviewIndex,
        itemIndex: -1,
    };
};

const updateModelviewCollection = (
    state: SharedUniverseState,
    collectionName: 'objectviews' | 'relshipviews',
    patch: Record<string, unknown>,
    optionalFields: string[],
) => {
    const metis = asRecord(state.world.worldModel.metis);
    const models: any[] = Array.isArray(metis.models) ? metis.models : [];
    if (!models.length) return state;

    const focus = asRecord(state.world.focus);
    const sanitizedPatch = { ...patch };
    const rawModelviewId = sanitizedPatch.modelviewId || sanitizedPatch.modelviewRef;
    const modelviewId = typeof rawModelviewId === 'string' ? rawModelviewId : undefined;
    delete sanitizedPatch.modelviewId;
    delete sanitizedPatch.modelviewRef;
    const target = findModelviewForItem(models, collectionName, sanitizedPatch.id as string | undefined, focus, modelviewId);
    const model = models[target.modelIndex];
    const modelviews: any[] = Array.isArray(model?.modelviews) ? model.modelviews : [];
    const modelview = modelviews[target.modelviewIndex];
    if (!model || !modelview) return state;

    const collection: any[] = Array.isArray(modelview?.[collectionName]) ? modelview[collectionName] : [];
    const targetIndex = target.itemIndex >= 0 ? target.itemIndex : collection.length;
    const nextCollection = replaceArrayItem(
        collection,
        targetIndex,
        mergeAndPruneOptionalEmptyFields(collection[targetIndex], sanitizedPatch, optionalFields),
    );
    const nextModelviews = replaceArrayItem(modelviews, target.modelviewIndex, {
        ...modelview,
        [collectionName]: nextCollection,
    });
    const nextModels = replaceArrayItem(models, target.modelIndex, {
        ...model,
        modelviews: nextModelviews,
    });

    return updateMetis(state, {
        ...metis,
        models: nextModels,
    });
};

const findFocusedModel = (metis: Record<string, any>, focus: Record<string, any>) => {
    const models: any[] = Array.isArray(metis.models) ? metis.models : [];
    const modelIndex = findModelIndex(models, focus);
    return models[modelIndex] || null;
};

const findMetamodelIndex = (
    metamodels: any[],
    metamodelId?: string,
) => metamodelId
    ? metamodels.findIndex((metamodel) => metamodel?.id === metamodelId)
    : -1;

const updateMetamodelAtIndex = (
    state: SharedUniverseState,
    metamodelIndex: number,
    updater: (metamodel: Record<string, any>) => Record<string, any>,
) => {
    const metis = asRecord(state.world.worldModel.metis);
    const metamodels: any[] = Array.isArray(metis.metamodels) ? metis.metamodels : [];
    if (metamodelIndex < 0) return state;

    const targetIndex = metamodelIndex >= 0 ? metamodelIndex : metamodels.length;
    const nextMetamodels = replaceArrayItem(
        metamodels,
        targetIndex,
        updater(asRecord(metamodels[targetIndex])),
    );

    return updateMetis(state, {
        ...metis,
        metamodels: nextMetamodels,
    });
};

const updateMetamodelPatch = (
    state: SharedUniverseState,
    metamodelId: string | undefined,
    patch: Record<string, unknown>,
) => {
    const metis = asRecord(state.world.worldModel.metis);
    const metamodels: any[] = Array.isArray(metis.metamodels) ? metis.metamodels : [];
    const metamodelIndex = findMetamodelIndex(metamodels, metamodelId);
    const targetIndex = metamodelIndex >= 0 ? metamodelIndex : metamodels.length;

    return updateMetamodelAtIndex(state, targetIndex, (metamodel) => ({
        ...metamodel,
        ...patch,
    }));
};

const updateMetamodelCollection = (
    state: SharedUniverseState,
    metamodelRef: 'current' | 'target',
    collectionName: string,
    patch: Record<string, unknown>,
) => {
    const metis = asRecord(state.world.worldModel.metis);
    const focus = asRecord(state.world.focus);
    const model = findFocusedModel(metis, focus);
    const metamodelId = metamodelRef === 'target'
        ? model?.targetMetamodelRef
        : model?.metamodelRef;
    const metamodels: any[] = Array.isArray(metis.metamodels) ? metis.metamodels : [];
    const metamodelIndex = findMetamodelIndex(metamodels, metamodelId);
    if (metamodelIndex < 0) return state;

    return updateMetamodelAtIndex(state, metamodelIndex, (metamodel) => {
        const collection: any[] = Array.isArray(metamodel?.[collectionName])
            ? metamodel[collectionName]
            : [];
        const itemIndex = patch.id
            ? collection.findIndex((item) => item?.id === patch.id)
            : -1;
        const targetIndex = itemIndex >= 0 ? itemIndex : collection.length;

        return {
            ...metamodel,
            [collectionName]: replaceArrayItem(collection, targetIndex, {
                ...(collection[targetIndex] || {}),
                ...patch,
            }),
        };
    });
};

export const initialUniverseState: SharedUniverseState = {
    world: {
        worldDefinition: {
            domain: null,
        },
        worldModel: {
            metis: null,
        },
        focus: null,
    },
    user: null,
    source: null,
    compatibility: {
        documents: EMPTY_DOCUMENTS,
        modelList: null,
    },
};

export const buildUniverseStateFromLegacy = (state?: LegacyUniverseRoot | null): SharedUniverseState => {
    const documents = Array.isArray(state?.phData?.documents) ? state.phData.documents : EMPTY_DOCUMENTS;
    const metis = state?.universe?.world?.worldModel?.metis ?? state?.phData?.metis ?? null;
    const normalizedMetis = normalizeModelviewObjectviewIdentities(metis);
    const modelList = state?.universe?.compatibility?.modelList ?? state?.phList ?? null;
    const focus = normalizeFocusForMetis(
        normalizedMetis,
        state?.universe?.world?.focus ?? state?.phFocus ?? null,
    );

    return {
        world: {
            worldDefinition: {
                domain: state?.universe?.world?.worldDefinition?.domain ?? state?.phData?.domain ?? null,
            },
            worldModel: {
                metis: normalizedMetis,
            },
            focus,
        },
        user: state?.universe?.user ?? state?.phUser ?? null,
        source: state?.universe?.source ?? state?.phSource ?? null,
        compatibility: {
            documents,
            modelList,
        },
    };
};

export const loadLegacyUniverseSnapshot = (snapshot: LegacyUniverseSnapshot) =>
    setUniverseState(buildUniverseStateFromLegacy(snapshot as LegacyUniverseRoot));

// Explicit file opens must use the coordinates stored in the file. Ordinary
// refreshes keep using loadLegacyUniverseSnapshot/setUniversePhData so a stale
// background response cannot undo an in-progress diagram edit.
export const openLegacyUniverseSnapshot = (snapshot: LegacyUniverseSnapshot) =>
    replaceUniverseState(buildUniverseStateFromLegacy(snapshot as LegacyUniverseRoot));

export const setUniverseState = createAction<SharedUniverseState>('universe/setUniverseState');
export const replaceUniverseState = createAction<SharedUniverseState>('universe/replaceUniverseState');
export const setUniversePhData = createAction<LegacyPhData>('universe/setUniversePhData');
export const replaceUniversePhData = createAction<LegacyPhData>('universe/replaceUniversePhData');
export const setUniverseDomain = createAction<unknown>('universe/setUniverseDomain');
export const setUniverseUser = createAction<unknown>('universe/setUniverseUser');
export const setUniverseSource = createAction<unknown>('universe/setUniverseSource');
export const setUniverseFocus = createAction<unknown>('universe/setUniverseFocus');

export const universeReducer = (
    state: SharedUniverseState = initialUniverseState,
    action: AnyAction,
): SharedUniverseState => {
    if (replaceUniverseState.match(action)) {
        const normalizedMetis = normalizeModelviewObjectviewIdentities(
            action.payload.world.worldModel.metis,
        );

        return {
            ...action.payload,
            world: {
                ...action.payload.world,
                worldModel: {
                    ...action.payload.world.worldModel,
                    metis: normalizedMetis,
                },
                focus: normalizeFocusForMetis(normalizedMetis, action.payload.world.focus),
            },
        };
    }
    if (setUniverseState.match(action)) {
        const nextMetis = preserveCurrentViewGeometryForMatchingItems(
            action.payload.world.worldModel.metis,
            state.world.worldModel.metis,
        );
        const normalizedMetis = normalizeModelviewObjectviewIdentities(nextMetis);

        return {
            ...action.payload,
            world: {
                ...action.payload.world,
                worldModel: {
                    ...action.payload.world.worldModel,
                    metis: normalizedMetis,
                },
                focus: normalizeFocusForMetis(normalizedMetis, action.payload.world.focus),
            },
        };
    }
    if (replaceUniversePhData.match(action)) {
        const payload = action.payload as LegacyPhData;
        const documents = Array.isArray(payload?.documents)
            ? payload.documents
            : state.compatibility.documents;

        return {
            ...state,
            world: {
                ...state.world,
                worldDefinition: {
                    ...state.world.worldDefinition,
                    ...(payload?.domain !== undefined ? { domain: payload.domain } : {}),
                },
                worldModel: {
                    ...state.world.worldModel,
                    ...(payload?.metis !== undefined
                        ? { metis: normalizeModelviewObjectviewIdentities(payload.metis) }
                        : {}),
                },
            },
            compatibility: {
                ...state.compatibility,
                documents,
            },
        };
    }
    if (setUniversePhData.match(action)) {
        const payload = action.payload as LegacyPhData;
        const documents = Array.isArray(payload?.documents)
            ? payload.documents
            : state.compatibility.documents;
        const nextMetis = payload?.metis !== undefined
            ? preserveCurrentViewGeometryForMatchingItems(payload.metis, state.world.worldModel.metis)
            : undefined;

        return {
            ...state,
            world: {
                ...state.world,
                worldDefinition: {
                    ...state.world.worldDefinition,
                    ...(payload?.domain !== undefined ? { domain: payload.domain } : {}),
                },
                worldModel: {
                    ...state.world.worldModel,
                    ...(payload?.metis !== undefined
                        ? { metis: normalizeModelviewObjectviewIdentities(nextMetis) }
                        : {}),
                },
            },
            compatibility: {
                ...state.compatibility,
                documents,
            },
        };
    }
    if (action.type === 'LOAD_TOSTORE_DATA') {
        return buildUniverseStateFromLegacy(action.data as LegacyUniverseRoot);
    }
    if (action.type === 'LOAD_DATA_SUCCESS') {
        return {
            ...universeReducer(state, setUniversePhData(asRecord(action.data) as LegacyPhData)),
            source: 'Model server',
        };
    }
    if (action.type === 'LOAD_DATAGITHUB_SUCCESS') {
        const data = asRecord(action.data);
        const githubState = asRecord(data.data) as LegacyUniverseRoot;
        return buildUniverseStateFromLegacy(githubState);
    }
    if (action.type === 'LOAD_DATAMODEL_SUCCESS') {
        const data = asRecord(action.data);
        const metis = asRecord(state.world.worldModel.metis);
        const models: any[] = Array.isArray(metis.models) ? metis.models : [];
        const incomingModels = Array.isArray(data.model)
            ? data.model
            : data.model
                ? [data.model]
                : [];
        if (!incomingModels.length) {
            return {
                ...state,
                source: 'Model server',
                world: {
                    ...state.world,
                    worldDefinition: {
                        ...state.world.worldDefinition,
                        domain: mergeDomainPatch(state.world.worldDefinition.domain, data.domain),
                    },
                },
            };
        }

        const targetId = typeof data.id === 'string' ? data.id : incomingModels[0]?.id;
        const targetIndex = targetId ? models.findIndex((model) => model?.id === targetId) : -1;
        const nextIndex = targetIndex >= 0 ? targetIndex : models.length;
        const nextModels = [
            ...models.slice(0, nextIndex),
            ...incomingModels,
            ...models.slice(nextIndex + 1),
        ];
        const nextMetis = normalizeModelviewObjectviewIdentities({
            ...metis,
            models: nextModels,
        });

        return {
            ...state,
            source: 'Model server',
            world: {
                ...state.world,
                worldDefinition: {
                    ...state.world.worldDefinition,
                    domain: mergeDomainPatch(state.world.worldDefinition.domain, data.domain),
                },
                worldModel: {
                    ...state.world.worldModel,
                    metis: nextMetis,
                },
            },
        };
    }
    if (action.type === 'LOAD_DATAMODELLIST_SUCCESS') {
        return {
            ...state,
            compatibility: {
                ...state.compatibility,
                modelList: action.data,
            },
        };
    }
    if (action.type === 'LOAD_TOSTORE_PHDATA') {
        return universeReducer(state, setUniversePhData(asRecord(action.data) as LegacyPhData));
    }
    if (action.type === 'LOAD_TOSTORE_PHFOCUS') {
        return {
            ...state,
            world: {
                ...state.world,
                focus: normalizeFocusForMetis(state.world.worldModel.metis, action.data),
            },
        };
    }
    if (action.type === 'LOAD_TOSTORE_PHUSER') {
        return {
            ...state,
            user: action.data,
        };
    }
    if (action.type === 'LOAD_TOSTORE_PHSOURCE') {
        return {
            ...state,
            source: action.data,
        };
    }
    if (action.type === 'LOAD_TOSTORE_NEWMODEL') {
        const metis = asRecord(state.world.worldModel.metis);
        const models = Array.isArray(metis.models) ? metis.models : [];
        const patch = asRecord(action.data);
        const nextMetis = {
            ...metis,
            models: [...models, patch],
        };
        return {
            ...updateMetis(state, nextMetis),
            world: {
                ...state.world,
                worldDefinition: {
                    ...state.world.worldDefinition,
                    ...(patch.domain !== undefined
                        ? { domain: mergeDomainPatch(state.world.worldDefinition.domain, patch.domain) }
                        : {}),
                },
                worldModel: {
                    ...state.world.worldModel,
                    metis: normalizeModelviewObjectviewIdentities(nextMetis),
                },
            },
        };
    }
    if (action.type === 'LOAD_TOSTORE_NEWMODELVIEW') {
        const metis = asRecord(state.world.worldModel.metis);
        const models = Array.isArray(metis.models) ? metis.models : [];
        const patch = asRecord(action.data);
        const modelIndex = patch.id
            ? models.findIndex((model) => model?.id === patch.id)
            : -1;
        const targetIndex = modelIndex >= 0 ? modelIndex : models.length;
        return updateMetis(state, {
            ...metis,
            models: replaceArrayItem(models, targetIndex, patch),
        });
    }
    if (setUniverseDomain.match(action)) {
        return {
            ...state,
            world: {
                ...state.world,
                worldDefinition: {
                    ...state.world.worldDefinition,
                    domain: mergeDomainPatch(state.world.worldDefinition.domain, action.payload),
                },
            },
        };
    }
    if (setUniverseUser.match(action)) {
        return {
            ...state,
            user: action.payload,
        };
    }
    if (setUniverseSource.match(action)) {
        return {
            ...state,
            source: action.payload,
        };
    }
    if (setUniverseFocus.match(action)) {
        return {
            ...state,
            world: {
                ...state.world,
                focus: action.payload,
            },
        };
    }
    if (action.type === 'SET_FOCUS_PHFOCUS') {
        return {
            ...state,
            world: {
                ...state.world,
                focus: action.data,
            },
        };
    }
    if (action.type === 'SET_FOCUS_USER') {
        return {
            ...state,
            user: mergeObjectPatch(state.user, { focusUser: action.data }),
        };
    }
    if (action.type === 'SET_USER_SHOWDELETED' || action.type === 'SET_USER_SHOWMODIFIED') {
        const user = asRecord(state.user);
        const focusUser = asRecord(user.focusUser);
        const diagram = asRecord(focusUser.diagram);
        return {
            ...state,
            user: {
                ...user,
                focusUser: {
                    ...focusUser,
                    diagram: {
                        ...diagram,
                        ...(action.type === 'SET_USER_SHOWDELETED'
                            ? { showDeleted: action.data }
                            : { showModified: action.data }),
                    },
                },
            },
        };
    }
    if (action.type === 'SET_VISIBLE_CONTEXT') {
        const user = asRecord(state.user);
        const appSkin = asRecord(user.appSkin);
        return {
            ...state,
            user: {
                ...user,
                appSkin: {
                    ...appSkin,
                    visibleContext: action.data,
                },
            },
        };
    }
    const legacyFocusField = legacyFocusFieldByActionType[action.type];
    if (legacyFocusField) {
        return {
            ...state,
            world: {
                ...state.world,
                focus: mergeObjectPatch(state.world.focus, { [legacyFocusField]: action.data }),
            },
        };
    }
    if (action.type === 'UPDATE_DOMAIN_PROPERTIES') {
        return {
            ...state,
            world: {
                ...state.world,
                worldDefinition: {
                    ...state.world.worldDefinition,
                    domain: mergeDomainPatch(state.world.worldDefinition.domain, asRecord(action.data)),
                },
            },
        };
    }
    if (action.type === 'UPDATE_PROJECT_PROPERTIES') {
        const metis = asRecord(state.world.worldModel.metis);
        return updateMetis(state, {
            ...metis,
            ...asRecord(action.data),
        });
    }
    if (action.type === 'SET_CURRENT_METAMODEL') {
        const metis = asRecord(state.world.worldModel.metis);
        if (!Object.keys(metis).length) return state;

        return updateMetis(state, {
            ...metis,
            currentMetamodelRef: asRecord(action.data).id,
        });
    }
    if (action.type === 'UPDATE_MODEL_PROPERTIES' || action.type === 'UPDATE_TARGETMODEL_PROPERTIES') {
        const metis = asRecord(state.world.worldModel.metis);
        const models: any[] = Array.isArray(metis.models) ? metis.models : [];
        if (!models.length) return state;

        const patch = asRecord(action.data);
        const modelIndex = findModelIndex(models, asRecord(state.world.focus), patch.id);
        if (modelIndex < 0 || !models[modelIndex]) return state;

        const nextModels = replaceArrayItem(models, modelIndex, {
            ...models[modelIndex],
            ...patch,
        });
        const focus = updateFocusedItem(asRecord(state.world.focus), 'focusModel', patch);

        return updateMetis(state, {
            ...metis,
            models: nextModels,
        }, focus);
    }
    if (action.type === 'REORDER_MODELS') {
        const metis = asRecord(state.world.worldModel.metis);
        const models: any[] = Array.isArray(metis.models) ? metis.models : [];
        const reorderedModels = reorderById(models, action?.data?.sourceId, action?.data?.targetId);
        if (reorderedModels === models) return state;

        return updateMetis(state, {
            ...metis,
            models: reorderedModels,
        });
    }
    if (action.type === 'UPDATE_MODELVIEW_PROPERTIES') {
        const metis = asRecord(state.world.worldModel.metis);
        const models: any[] = Array.isArray(metis.models) ? metis.models : [];
        if (!models.length) return state;

        const focus = asRecord(state.world.focus);
        const modelIndex = findModelIndex(models, focus);
        const model = models[modelIndex];
        const modelviews: any[] = Array.isArray(model?.modelviews) ? model.modelviews : [];
        const patch = sanitizeModelviewPatch(asRecord(action.data));
        const modelviewIndex = patch.id
            ? modelviews.findIndex((modelview) => modelview?.id === patch.id)
            : -1;
        const targetIndex = modelviewIndex >= 0 ? modelviewIndex : modelviews.length;
        const nextModelviews = replaceArrayItem(modelviews, targetIndex, {
            ...(modelviews[targetIndex] || {}),
            ...patch,
        });
        const nextModels = replaceArrayItem(models, modelIndex, {
            ...model,
            modelviews: nextModelviews,
        });
        const nextFocus = updateFocusedItem(focus, 'focusModelview', patch);

        return updateMetis(state, {
            ...metis,
            models: nextModels,
        }, nextFocus);
    }
    if (action.type === 'REORDER_MODELVIEWS') {
        const metis = asRecord(state.world.worldModel.metis);
        const models: any[] = Array.isArray(metis.models) ? metis.models : [];
        if (!models.length) return state;

        const focus = asRecord(state.world.focus);
        const modelIndex = findModelIndex(models, focus);
        const model = models[modelIndex];
        const modelviews: any[] = Array.isArray(model?.modelviews) ? model.modelviews : [];
        const reorderedModelviews = reorderById(modelviews, action?.data?.sourceId, action?.data?.targetId);
        if (reorderedModelviews === modelviews) return state;

        const nextModels = replaceArrayItem(models, modelIndex, {
            ...model,
            modelviews: reorderedModelviews,
        });

        return updateMetis(state, {
            ...metis,
            models: nextModels,
        });
    }
    if (action.type === 'UPDATE_OBJECT_PROPERTIES') {
        return updateCurrentModelCollection(state, 'objects', asRecord(action.data));
    }
    if (action.type === 'UPDATE_RELSHIP_PROPERTIES') {
        return updateCurrentModelCollection(state, 'relships', asRecord(action.data));
    }
    if (action.type === 'UPDATE_OBJECTVIEW_PROPERTIES' || action.type === 'UPDATE_OBJECTVIEW_NAME') {
        return updateModelviewCollection(
            state,
            'objectviews',
            asRecord(action.data),
            OPTIONAL_OBJECTVIEW_FIELDS,
        );
    }
    if (action.type === 'UPDATE_RELSHIPVIEW_PROPERTIES') {
        return updateModelviewCollection(
            state,
            'relshipviews',
            asRecord(action.data),
            OPTIONAL_RELSHIPVIEW_FIELDS,
        );
    }
    if (action.type === 'UPDATE_METAMODEL_PROPERTIES') {
        const patch = asRecord(action.data);
        return updateMetamodelPatch(state, patch.id, patch);
    }
    if (action.type === 'UPDATE_TARGETMETAMODEL_PROPERTIES') {
        const metis = asRecord(state.world.worldModel.metis);
        const model = findFocusedModel(metis, asRecord(state.world.focus));
        return updateMetamodelPatch(state, model?.targetMetamodelRef, asRecord(action.data));
    }
    if (action.type === 'UPDATE_OBJECTTYPE_PROPERTIES') {
        return updateMetamodelCollection(state, 'current', 'objecttypes', asRecord(action.data));
    }
    if (action.type === 'UPDATE_TARGETOBJECTTYPE_PROPERTIES') {
        return updateMetamodelCollection(state, 'target', 'objecttypes', asRecord(action.data));
    }
    if (action.type === 'UPDATE_OBJECTTYPEVIEW_PROPERTIES') {
        return updateMetamodelCollection(state, 'current', 'objecttypeviews', asRecord(action.data));
    }
    if (action.type === 'UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES') {
        return updateMetamodelCollection(state, 'target', 'objecttypeviews', asRecord(action.data));
    }
    if (action.type === 'UPDATE_OBJECTTYPEGEOS_PROPERTIES') {
        return updateMetamodelCollection(state, 'current', 'objtypegeos', asRecord(action.data));
    }
    if (action.type === 'UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES') {
        return updateMetamodelCollection(state, 'target', 'objtypegeos', asRecord(action.data));
    }
    if (action.type === 'UPDATE_RELSHIPTYPE_PROPERTIES') {
        return updateMetamodelCollection(state, 'current', 'relshiptypes', asRecord(action.data));
    }
    if (action.type === 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES') {
        return updateMetamodelCollection(state, 'target', 'relshiptypes', asRecord(action.data));
    }
    if (action.type === 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES') {
        return updateMetamodelCollection(state, 'current', 'relshiptypeviews', asRecord(action.data));
    }
    if (action.type === 'UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES') {
        return updateMetamodelCollection(state, 'current', 'relshiptypeviews', asRecord(action.data));
    }
    if (action.type === 'UPDATE_VIEWSTYLE_PROPERTIES') {
        return updateMetamodelCollection(state, 'current', 'viewstyles', asRecord(action.data));
    }
    if (action.type === 'UPDATE_PROPERTY_PROPERTIES') {
        return updateMetamodelCollection(state, 'current', 'properties', asRecord(action.data));
    }
    if (action.type === 'UPDATE_TARGETPROPERTY_PROPERTIES') {
        return updateMetamodelCollection(state, 'target', 'properties', asRecord(action.data));
    }
    if (action.type === 'UPDATE_DATATYPE_PROPERTIES') {
        return updateMetamodelCollection(state, 'target', 'datatypes', asRecord(action.data));
    }
    if (action.type === 'UPDATE_TARGETDATATYPE_PROPERTIES') {
        return updateMetamodelCollection(state, 'target', 'datatypes', asRecord(action.data));
    }
    if (action.type === 'UPDATE_METHOD_PROPERTIES') {
        return updateMetamodelCollection(state, 'current', 'methods', asRecord(action.data));
    }
    if (action.type === 'UPDATE_TARGETMETHOD_PROPERTIES') {
        return updateMetamodelCollection(state, 'target', 'methods', asRecord(action.data));
    }
    if (action.type === 'UPDATE_METHODTYPE_PROPERTIES') {
        return updateMetamodelCollection(state, 'target', 'methodtypes', asRecord(action.data));
    }
    if (action.type === 'UPDATE_VALUE_PROPERTIES') {
        return updateMetamodelCollection(state, 'current', 'objecttypes', asRecord(action.data));
    }
    if (action.type === 'UPDATE_TARGETVALUE_PROPERTIES') {
        return updateMetamodelCollection(state, 'current', 'objecttypes', asRecord(action.data));
    }
    return state;
};
