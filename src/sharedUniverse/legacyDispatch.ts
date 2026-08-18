import type { AnyAction, Dispatch } from '@reduxjs/toolkit';
import {
    loadLegacyUniverseSnapshot,
    setUniverseDomain,
    setUniverseFocus,
    setUniversePhData,
    setUniverseSource,
    setUniverseUser,
} from './universeSlice';

type LegacyDispatch = Dispatch<AnyAction>;

export const toSharedUniverseAction = (action: AnyAction): AnyAction => {
    switch (action?.type) {
        case 'LOAD_TOSTORE_DATA':
            return loadLegacyUniverseSnapshot(action.data) as AnyAction;
        case 'LOAD_TOSTORE_PHDATA':
            return setUniversePhData(action.data) as AnyAction;
        case 'LOAD_TOSTORE_PHFOCUS':
        case 'SET_FOCUS_PHFOCUS':
            return setUniverseFocus(action.data) as AnyAction;
        case 'LOAD_TOSTORE_PHUSER':
            return setUniverseUser(action.data) as AnyAction;
        case 'LOAD_TOSTORE_PHSOURCE':
            return setUniverseSource(action.data) as AnyAction;
        case 'UPDATE_DOMAIN_PROPERTIES':
            return setUniverseDomain(action.data) as AnyAction;
        default:
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
