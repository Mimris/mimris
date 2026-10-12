import type { AnyAction, Dispatch } from '@reduxjs/toolkit';
import {
    loadLegacyUniverseSnapshot,
    loadUniverseResult,
    universeLoadTypes,
    type UniverseLoadKind,
    setUniverseDomain,
    setUniverseFocus,
    loadUniverseFocus,
    setUniverseFocusField,
    setUniverseFocusUser,
    setUniverseVisibleContext,
    legacyFocusFieldByActionType,
    reorderUniverseModels,
    updateUniverseModel,
    updateUniverseRelationship,
    updateUniverseObject,
    updateUniverseObjectview,
    updateUniverseMetamodel,
    updateUniverseProject,
    setUniverseCurrentMetamodel,
    updateUniverseMetamodelItem,
    legacyMetamodelCollectionRoutes,
    updateUniverseTargetMetamodel,
    updateUniverseRelationshipview,
    updateUniverseModelview,
    reorderUniverseModelviews,
    setUniversePhData,
    setUniverseSource,
    setUniverseUser,
} from './universeSlice.js';

type LegacyDispatch = Dispatch<AnyAction>;

export const toSharedUniverseAction = (action: AnyAction): AnyAction => {
    switch (action?.type) {
        case 'LOAD_TOSTORE_DATA':
            return loadLegacyUniverseSnapshot(action.data) as AnyAction;
        case 'LOAD_TOSTORE_PHDATA':
            return setUniversePhData(action.data) as AnyAction;
        case 'LOAD_TOSTORE_PHFOCUS':
            return loadUniverseFocus(action.data);
        case 'SET_FOCUS_PHFOCUS':
            return setUniverseFocus(action.data) as AnyAction;
        case 'UPDATE_PROJECT_PROPERTIES':
            return updateUniverseProject(action.data);
        case 'SET_CURRENT_METAMODEL':
            return setUniverseCurrentMetamodel(action.data);
        case 'UPDATE_METAMODEL_PROPERTIES':
            return updateUniverseMetamodel(action.data);
        case 'UPDATE_TARGETMETAMODEL_PROPERTIES':
            return updateUniverseTargetMetamodel(action.data);
        case 'UPDATE_OBJECTVIEW_PROPERTIES':
        case 'UPDATE_OBJECTVIEW_NAME':
            return updateUniverseObjectview(action.data);
        case 'UPDATE_RELSHIPVIEW_PROPERTIES':
            return updateUniverseRelationshipview(action.data);
        case 'UPDATE_OBJECT_PROPERTIES':
            return updateUniverseObject(action.data);
        case 'UPDATE_RELSHIP_PROPERTIES':
            return updateUniverseRelationship(action.data);
        case 'UPDATE_MODEL_PROPERTIES':
        case 'UPDATE_TARGETMODEL_PROPERTIES':
            return updateUniverseModel(action.data);
        case 'UPDATE_MODELVIEW_PROPERTIES':
            return updateUniverseModelview(action.data);
        case 'REORDER_MODELS':
            return reorderUniverseModels(action.data);
        case 'REORDER_MODELVIEWS':
            return reorderUniverseModelviews(action.data);
        case 'SET_FOCUS_USER':
            return setUniverseFocusUser(action.data);
        case 'SET_VISIBLE_CONTEXT':
            return setUniverseVisibleContext(action.data);
        case 'LOAD_TOSTORE_PHUSER':
            return setUniverseUser(action.data) as AnyAction;
        case 'LOAD_TOSTORE_PHSOURCE':
            return setUniverseSource(action.data) as AnyAction;
        case 'UPDATE_DOMAIN_PROPERTIES':
            return setUniverseDomain(action.data) as AnyAction;
        default:
            for (const [kind, type] of Object.entries(universeLoadTypes)) {
                if (action?.type === type) return loadUniverseResult({ kind: kind as UniverseLoadKind, data: action.data });
            }
            if (Object.prototype.hasOwnProperty.call(legacyMetamodelCollectionRoutes, action?.type)) {
                const route = legacyMetamodelCollectionRoutes[action.type as keyof typeof legacyMetamodelCollectionRoutes];
                return updateUniverseMetamodelItem({ ...route, patch: action.data });
            }
            if (Object.prototype.hasOwnProperty.call(legacyFocusFieldByActionType, action?.type)) {
                const field = legacyFocusFieldByActionType[action.type as keyof typeof legacyFocusFieldByActionType];
                return setUniverseFocusField({ field, value: action.data });
            }
            return action;
    }
};

export const dispatchLegacyUniverseAction = (
    dispatch: LegacyDispatch | undefined,
    action: AnyAction,
) => dispatch?.(toSharedUniverseAction(action));

export const dispatchUniversePhData = (
    dispatch: LegacyDispatch | undefined,
    phData: Parameters<typeof setUniversePhData>[0],
) => dispatch?.(setUniversePhData(phData) as AnyAction);

export const bindLegacyUniverseDispatch = (
    dispatch?: LegacyDispatch,
): LegacyDispatch => {
    if (!dispatch) return (((action: AnyAction) => action) as LegacyDispatch);

    const wrappedDispatch = ((action: AnyAction) =>
        dispatch(toSharedUniverseAction(action))) as LegacyDispatch;

    return wrappedDispatch;
};
