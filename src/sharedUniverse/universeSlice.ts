import { createAction, type AnyAction } from '@reduxjs/toolkit';

export type LegacyUniverseRoot = {
    universe?: SharedUniverseState;
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
            metis,
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
) => {
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
    const target = findModelviewForItem(models, collectionName, patch.id as string | undefined, focus);
    const model = models[target.modelIndex];
    const modelviews: any[] = Array.isArray(model?.modelviews) ? model.modelviews : [];
    const modelview = modelviews[target.modelviewIndex];
    if (!model || !modelview) return state;

    const collection: any[] = Array.isArray(modelview?.[collectionName]) ? modelview[collectionName] : [];
    const targetIndex = target.itemIndex >= 0 ? target.itemIndex : collection.length;
    const nextCollection = replaceArrayItem(
        collection,
        targetIndex,
        mergeAndPruneOptionalEmptyFields(collection[targetIndex], patch, optionalFields),
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
    },
};

export const buildUniverseStateFromLegacy = (state?: LegacyUniverseRoot | null): SharedUniverseState => {
    const documents = Array.isArray(state?.phData?.documents) ? state.phData.documents : EMPTY_DOCUMENTS;

    return {
        world: {
            worldDefinition: {
                domain: state?.universe?.world?.worldDefinition?.domain ?? state?.phData?.domain ?? null,
            },
            worldModel: {
                metis: state?.universe?.world?.worldModel?.metis ?? state?.phData?.metis ?? null,
            },
            focus: state?.universe?.world?.focus ?? state?.phFocus ?? null,
        },
        user: state?.universe?.user ?? state?.phUser ?? null,
        source: state?.universe?.source ?? state?.phSource ?? null,
        compatibility: {
            documents,
        },
    };
};

export const loadLegacyUniverseSnapshot = (snapshot: LegacyUniverseSnapshot) =>
    setUniverseState(buildUniverseStateFromLegacy(snapshot as LegacyUniverseRoot));

export const setUniverseState = createAction<SharedUniverseState>('universe/setUniverseState');
export const setUniversePhData = createAction<LegacyPhData>('universe/setUniversePhData');
export const setUniverseDomain = createAction<unknown>('universe/setUniverseDomain');
export const setUniverseUser = createAction<unknown>('universe/setUniverseUser');
export const setUniverseSource = createAction<unknown>('universe/setUniverseSource');
export const setUniverseFocus = createAction<unknown>('universe/setUniverseFocus');

export const universeReducer = (
    state: SharedUniverseState = initialUniverseState,
    action: AnyAction,
): SharedUniverseState => {
    if (setUniverseState.match(action)) return action.payload;
    if (setUniversePhData.match(action)) {
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
                    ...(payload?.metis !== undefined ? { metis: payload.metis } : {}),
                },
            },
            compatibility: {
                ...state.compatibility,
                documents,
            },
        };
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
    if (action.type === 'UPDATE_PROJECT_PROPERTIES') {
        const metis = asRecord(state.world.worldModel.metis);
        return updateMetis(state, {
            ...metis,
            ...asRecord(action.data),
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
    if (action.type === 'UPDATE_OBJECTVIEW_PROPERTIES') {
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
    return state;
};
