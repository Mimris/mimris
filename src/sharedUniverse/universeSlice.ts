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
    return state;
};
