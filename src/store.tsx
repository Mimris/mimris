import { configureStore, type AnyAction } from '@reduxjs/toolkit';
import { Context, createWrapper } from 'next-redux-wrapper';
import legacyReducer from './reducers/reducer';
import {
    buildUniverseStateFromLegacy,
    universeReducer,
    type LegacyUniverseRoot,
    type SharedUniverseState,
} from './sharedUniverse/universeSlice';

type RootReducerState = LegacyUniverseRoot & {
    universe: SharedUniverseState;
};

const reduceLegacyState = legacyReducer as (state: LegacyUniverseRoot | undefined, action: AnyAction) => LegacyUniverseRoot;

const legacyRuntimeActionTypes = new Set([
    'SET_MYMETIS_MODEL',
    'SET_MYMETIS_PARAMETER',
    'SET_MY_GOMODEL',
    'SET_MY_GOMETAMODEL',
    'SET_GOJS_MODEL',
    'SET_GOJS_TARGETMODEL',
    'SET_GOJS_MODELOBJECTS',
    'SET_GOJS_METAMODEL',
    'SET_GOJS_METAMODELPALETTE',
    'SET_GOJS_METAMODELMODEL',
    'SET_GOJS_TARGETMETAMODEL',
]);

const mirrorUniverseToLegacy = (
    legacyState: LegacyUniverseRoot,
    universe: SharedUniverseState,
): LegacyUniverseRoot => ({
    ...legacyState,
    phData: {
        ...legacyState.phData,
        ...(universe.world.worldDefinition.domain !== null && universe.world.worldDefinition.domain !== undefined
            ? { domain: universe.world.worldDefinition.domain }
            : {}),
        ...(universe.world.worldModel.metis !== null && universe.world.worldModel.metis !== undefined
            ? { metis: universe.world.worldModel.metis }
            : {}),
        ...(Array.isArray(universe.compatibility.documents)
            ? { documents: universe.compatibility.documents }
            : {}),
    },
    ...(universe.world.focus !== null && universe.world.focus !== undefined
        ? { phFocus: universe.world.focus }
        : {}),
    ...(universe.user !== null && universe.user !== undefined
        ? { phUser: universe.user }
        : {}),
    ...(universe.source !== null && universe.source !== undefined
        ? { phSource: universe.source }
        : {}),
    ...(universe.compatibility.modelList !== null && universe.compatibility.modelList !== undefined
        ? { phList: universe.compatibility.modelList }
        : {}),
});

export const rootReducer = (state: RootReducerState | undefined, action: AnyAction): RootReducerState => {
    const legacyBaseState = state ?? reduceLegacyState(undefined, { type: '@@INIT' });
    const previousUniverse = state?.universe ?? buildUniverseStateFromLegacy(legacyBaseState);
    const reducedUniverse = universeReducer(previousUniverse, action);

    if (reducedUniverse !== previousUniverse) {
        return {
            ...mirrorUniverseToLegacy(legacyBaseState, reducedUniverse),
            universe: reducedUniverse,
        } as RootReducerState;
    }

    const legacyState = reduceLegacyState(state, action);
    if (legacyRuntimeActionTypes.has(action.type)) {
        return {
            ...legacyState,
            universe: previousUniverse,
        } as RootReducerState;
    }

    return {
        ...legacyState,
        universe: buildUniverseStateFromLegacy({ ...legacyState, universe: undefined }),
    } as RootReducerState;
};

export const makeStore = (_context?: Context) => {
    const store = configureStore({
        reducer: rootReducer,
        devTools: process.env.NODE_ENV !== 'production',
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                immutableCheck: false,
                serializableCheck: false,
            }),
    });

    currentStore = store;

    return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

let currentStore: AppStore | null = null;

export const getCurrentStore = (): AppStore | null => currentStore;

export const wrapper = createWrapper<AppStore>(makeStore as any);
