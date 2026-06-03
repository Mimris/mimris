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
export const setUniverseUser = createAction<unknown>('universe/setUniverseUser');
export const setUniverseSource = createAction<unknown>('universe/setUniverseSource');
export const setUniverseFocus = createAction<unknown>('universe/setUniverseFocus');

export const universeReducer = (
    state: SharedUniverseState = initialUniverseState,
    action: AnyAction,
): SharedUniverseState => {
    if (setUniverseState.match(action)) return action.payload;
    if (setUniversePhData.match(action)) {
        const documents = Array.isArray(action.payload?.documents)
            ? action.payload.documents
            : state.compatibility.documents;

        return {
            ...state,
            world: {
                ...state.world,
                worldDefinition: {
                    ...state.world.worldDefinition,
                    ...(action.payload?.domain !== undefined ? { domain: action.payload.domain } : {}),
                },
                worldModel: {
                    ...state.world.worldModel,
                    ...(action.payload?.metis !== undefined ? { metis: action.payload.metis } : {}),
                },
            },
            compatibility: {
                ...state.compatibility,
                documents,
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
    return state;
};
