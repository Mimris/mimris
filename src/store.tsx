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

const rootReducer = (state: RootReducerState | undefined, action: AnyAction): RootReducerState => {
    const legacyState = reduceLegacyState(state, action);
    const previousUniverse = state?.universe ?? buildUniverseStateFromLegacy(legacyState);
    const nextUniverse = action.type.startsWith('universe/')
        ? universeReducer(previousUniverse, action)
        : buildUniverseStateFromLegacy({ ...legacyState, universe: undefined });

    return {
        ...legacyState,
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
