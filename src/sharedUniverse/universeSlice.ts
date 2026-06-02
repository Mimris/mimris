import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

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

const universeSlice = createSlice({
    name: 'universe',
    initialState: initialUniverseState,
    reducers: {
        setUniverseState: (_state, action: PayloadAction<SharedUniverseState>) => action.payload,
        setUniverseUser: (state, action: PayloadAction<unknown>) => {
            state.user = action.payload;
        },
        setUniverseSource: (state, action: PayloadAction<unknown>) => {
            state.source = action.payload;
        },
    },
});

export const {
    setUniverseState,
    setUniverseUser,
    setUniverseSource,
} = universeSlice.actions;

export const universeReducer = universeSlice.reducer;
