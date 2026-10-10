import { configureStore, createNextState, type AnyAction, type Middleware } from '@reduxjs/toolkit';
import { Context, createWrapper } from 'next-redux-wrapper';
import legacyReducer from './reducers/reducer';
import {
    buildUniverseStateFromLegacy,
    isUniverseOwnedAction,
    universeReducer,
    type LegacyUniverseRoot,
    type SharedUniverseState,
} from './sharedUniverse/universeSlice';

export type RootReducerState = { universe: SharedUniverseState; [key: string]: unknown };

const reduceLegacyState = legacyReducer as (state: LegacyUniverseRoot | undefined, action: AnyAction) => LegacyUniverseRoot;

const retiredLegacyRuntimeActionTypes = new Set([
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

const legacyAliasKeys = ['phData', 'phFocus', 'phUser', 'phSource', 'phList', 'phMymetis', 'phGojs', 'phMyGoModel', 'phMyGoMetamodel'];
const canonicalRoot = (root: LegacyUniverseRoot, universe: SharedUniverseState): RootReducerState => {
    if (root.universe && !legacyAliasKeys.some(key => Object.prototype.hasOwnProperty.call(root, key))) return root as RootReducerState;
    const metadata = { ...root } as Record<string, unknown>;
    for (const key of legacyAliasKeys) delete metadata[key];
    return { ...metadata, universe };
};

/** Redux stores one durable universe; legacy file/editor shapes are selector projections. */
export const rootReducer = (state: RootReducerState | LegacyUniverseRoot | undefined, action: AnyAction): RootReducerState => {
    const seed = state ?? reduceLegacyState(undefined, { type: '@@INIT' });
    const previousUniverse = seed.universe ?? buildUniverseStateFromLegacy(seed);
    const base = canonicalRoot(seed, previousUniverse);
    if (retiredLegacyRuntimeActionTypes.has(action.type)) return base;
    const reducedUniverse = universeReducer(previousUniverse, action);
    if (reducedUniverse !== previousUniverse) return { ...base, universe: reducedUniverse };
    if (isUniverseOwnedAction(action)) return base;
    const hostState = reduceLegacyState(base, action);
    return hostState === base ? base : { ...hostState, universe: previousUniverse } as RootReducerState;
};

/** Drop retired runtime writes before diagnostic middleware traverses their instance payloads. */
const discardRetiredRuntimeWrites: Middleware = () => next => action => {
    if (action && typeof action === 'object' && 'type' in action
        && retiredLegacyRuntimeActionTypes.has((action as AnyAction).type)) return action;
    return next(action);
};

/** Freeze durable store snapshots; mutable runtimes hydrate detached data at the host boundary. */
export const readonlyRootReducer = (state: RootReducerState | undefined, action: AnyAction): RootReducerState => {
    const next = rootReducer(state, action);
    return next === state ? next : createNextState(next, () => {});
};

export const makeStore = (_context?: Context) => {
    const store = configureStore({
        reducer: readonlyRootReducer,
        devTools: process.env.NODE_ENV !== 'production',
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().prepend(discardRetiredRuntimeWrites),
    });

    return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const wrapper = createWrapper<AppStore>(makeStore as any);
