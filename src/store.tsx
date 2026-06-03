import { configureStore, type AnyAction } from '@reduxjs/toolkit';
import { Context, createWrapper } from 'next-redux-wrapper';
import legacyReducer from './reducers/reducer';
import {
    buildUniverseStateFromLegacy,
    setUniversePhData,
    setUniverseState,
    setUniverseSource,
    setUniverseFocus,
    setUniverseUser,
    universeReducer,
    type LegacyUniverseRoot,
    type SharedUniverseState,
} from './sharedUniverse/universeSlice';

type RootReducerState = LegacyUniverseRoot & {
    universe: SharedUniverseState;
};

const reduceLegacyState = legacyReducer as (state: LegacyUniverseRoot | undefined, action: AnyAction) => LegacyUniverseRoot;

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
});

const rootReducer = (state: RootReducerState | undefined, action: AnyAction): RootReducerState => {
    const legacyState = reduceLegacyState(state, action);
    const previousUniverse = state?.universe ?? buildUniverseStateFromLegacy(legacyState);
    const reducedUniverse = universeReducer(previousUniverse, action);
    const nextUniverse = reducedUniverse !== previousUniverse
        ? reducedUniverse
        : buildUniverseStateFromLegacy({ ...legacyState, universe: undefined });
    const nextLegacyState = (
        setUniverseState.match(action) ||
        setUniversePhData.match(action) ||
        setUniverseUser.match(action) ||
        setUniverseSource.match(action) ||
        setUniverseFocus.match(action)
    )
        ? mirrorUniverseToLegacy(legacyState, nextUniverse)
        : legacyState;

    return {
        ...nextLegacyState,
        universe: nextUniverse,
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
