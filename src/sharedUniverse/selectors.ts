import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { LegacyUniverseRoot, SharedUniverseState } from './universeSlice';

const EMPTY_DOCUMENTS: unknown[] = [];

const asLegacyRoot = (state: RootState | LegacyUniverseRoot): LegacyUniverseRoot => state as LegacyUniverseRoot;

export const selectPhData = (state: RootState | LegacyUniverseRoot) => asLegacyRoot(state).phData;

export const selectPhFocus = (state: RootState | LegacyUniverseRoot) => asLegacyRoot(state).phFocus;

export const selectPhUser = (state: RootState | LegacyUniverseRoot) => asLegacyRoot(state).phUser;

export const selectPhSource = (state: RootState | LegacyUniverseRoot) => asLegacyRoot(state).phSource;

export const selectWorldDefinitionDomain = (state: RootState | LegacyUniverseRoot) => {
    const legacyRoot = asLegacyRoot(state);
    return legacyRoot.universe?.world?.worldDefinition?.domain ?? legacyRoot.phData?.domain ?? null;
};

export const selectWorldModelMetis = (state: RootState | LegacyUniverseRoot) => {
    const legacyRoot = asLegacyRoot(state);
    return legacyRoot.universe?.world?.worldModel?.metis ?? legacyRoot.phData?.metis ?? null;
};

const selectUniverseFocus = (state: RootState | LegacyUniverseRoot) => {
    const legacyRoot = asLegacyRoot(state);
    return legacyRoot.universe?.world?.focus ?? legacyRoot.phFocus ?? null;
};

const selectUniverseUser = (state: RootState | LegacyUniverseRoot) => {
    const legacyRoot = asLegacyRoot(state);
    return legacyRoot.universe?.user ?? legacyRoot.phUser ?? null;
};

const selectUniverseSource = (state: RootState | LegacyUniverseRoot) => {
    const legacyRoot = asLegacyRoot(state);
    return legacyRoot.universe?.source ?? legacyRoot.phSource ?? null;
};

const selectCompatibilityDocuments = (state: RootState | LegacyUniverseRoot) => {
    const legacyRoot = asLegacyRoot(state);
    const documents = legacyRoot.universe?.compatibility?.documents ?? legacyRoot.phData?.documents;
    return Array.isArray(documents) ? documents : EMPTY_DOCUMENTS;
};

const selectCompatibilityModelList = (state: RootState | LegacyUniverseRoot) => {
    const legacyRoot = asLegacyRoot(state);
    return legacyRoot.universe?.compatibility?.modelList ?? legacyRoot.phList ?? null;
};

export const selectSharedUniverseState = createSelector(
    [
        selectWorldDefinitionDomain,
        selectWorldModelMetis,
        selectUniverseFocus,
        selectUniverseUser,
        selectUniverseSource,
        selectCompatibilityDocuments,
        selectCompatibilityModelList,
    ],
    (domain, metis, focus, user, source, documents, modelList): SharedUniverseState => ({
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
        },
    }),
);

export const selectMimrisCompatibilityProps = createSelector(
    [selectSharedUniverseState],
    (sharedUniverse) => ({
        phData: {
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
