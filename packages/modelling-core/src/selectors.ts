import { createSelector } from '@reduxjs/toolkit';
import type { LegacyUniverseRoot, SharedUniverseState } from './universeSlice.js';

const EMPTY_DOCUMENTS: unknown[] = [];

const asLegacyRoot = (state: LegacyUniverseRoot): LegacyUniverseRoot => state as LegacyUniverseRoot;

export const selectPhData = (state: LegacyUniverseRoot) => selectMimrisCompatibilityProps(state).phData;

export const selectPhFocus = (state: LegacyUniverseRoot) => selectSharedUniverseState(state).world.focus;

export const selectPhUser = (state: LegacyUniverseRoot) => selectSharedUniverseState(state).user;

export const selectPhSource = (state: LegacyUniverseRoot) => selectSharedUniverseState(state).source;

export const selectWorldDefinitionDomain = (state: LegacyUniverseRoot) => {
    const legacyRoot = asLegacyRoot(state);
    return legacyRoot.universe ? legacyRoot.universe.world.worldDefinition.domain : legacyRoot.phData?.domain ?? null;
};

export const selectWorldModelMetis = (state: LegacyUniverseRoot) => {
    const legacyRoot = asLegacyRoot(state);
    return legacyRoot.universe ? legacyRoot.universe.world.worldModel.metis : legacyRoot.phData?.metis ?? null;
};

const selectUniverseFocus = (state: LegacyUniverseRoot) => {
    const legacyRoot = asLegacyRoot(state);
    return legacyRoot.universe ? legacyRoot.universe.world.focus : legacyRoot.phFocus ?? null;
};

const selectUniverseUser = (state: LegacyUniverseRoot) => {
    const legacyRoot = asLegacyRoot(state);
    return legacyRoot.universe ? legacyRoot.universe.user : legacyRoot.phUser ?? null;
};

const selectUniverseSource = (state: LegacyUniverseRoot) => {
    const legacyRoot = asLegacyRoot(state);
    return legacyRoot.universe ? legacyRoot.universe.source : legacyRoot.phSource ?? null;
};

const selectCompatibilityDocuments = (state: LegacyUniverseRoot) => {
    const legacyRoot = asLegacyRoot(state);
    const documents = legacyRoot.universe ? legacyRoot.universe.compatibility.documents : legacyRoot.phData?.documents;
    return Array.isArray(documents) ? documents : EMPTY_DOCUMENTS;
};

const selectCompatibilityModelList = (state: LegacyUniverseRoot) => {
    const legacyRoot = asLegacyRoot(state);
    return legacyRoot.universe ? legacyRoot.universe.compatibility.modelList : legacyRoot.phList ?? null;
};

const selectPhDataMetadata = createSelector([(state: LegacyUniverseRoot) => state.universe, (state: LegacyUniverseRoot) => state.phData], (universe, phData) => {
    if (universe) return universe.compatibility.phDataMetadata;
    const { domain, metis, documents, ...metadata } = phData ?? {};
    return Object.keys(metadata).length ? metadata : undefined;
});

const selectLegacyUniverseProjection = createSelector(
    [
        selectWorldDefinitionDomain,
        selectWorldModelMetis,
        selectUniverseFocus,
        selectUniverseUser,
        selectUniverseSource,
        selectCompatibilityDocuments,
        selectCompatibilityModelList,
        selectPhDataMetadata,
    ],
    (domain, metis, focus, user, source, documents, modelList, phDataMetadata): SharedUniverseState => ({
        world: {
            worldDefinition: {
                domain,
            },
            worldModel: {
                metis,
            },
            focus,
        },
        user,
        source,
        compatibility: {
            documents,
            modelList,
            ...(phDataMetadata ? { phDataMetadata } : {}),
        },
    }),
);

/** A present canonical universe is authoritative, including intentional null values. */
export const selectSharedUniverseState = (state: LegacyUniverseRoot): SharedUniverseState =>
    state.universe ?? selectLegacyUniverseProjection(state);

export const selectMimrisCompatibilityProps = createSelector(
    [selectSharedUniverseState],
    (sharedUniverse) => ({
        phData: {
            ...sharedUniverse.compatibility.phDataMetadata,
            domain: sharedUniverse.world.worldDefinition.domain,
            metis: sharedUniverse.world.worldModel.metis,
            documents: sharedUniverse.compatibility.documents,
        },
        phFocus: sharedUniverse.world.focus,
        phUser: sharedUniverse.user,
        phSource: sharedUniverse.source,
        phList: sharedUniverse.compatibility.modelList,
    }),
);
