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
    return legacyRoot.universe?.world?.worldDefinition?.domain ?? null;
};

export const selectWorldModelMetis = (state: RootState | LegacyUniverseRoot) => {
    const legacyRoot = asLegacyRoot(state);
    return legacyRoot.universe?.world?.worldModel?.metis ?? null;
};

export const selectSharedUniverseState = (state: RootState | LegacyUniverseRoot): SharedUniverseState => {
    const phData = selectPhData(state);
    const documents = Array.isArray(phData?.documents) ? phData.documents : EMPTY_DOCUMENTS;

    return {
        world: {
            worldDefinition: {
                domain: selectWorldDefinitionDomain(state),
            },
            worldModel: {
                metis: selectWorldModelMetis(state),
            },
            focus: selectPhFocus(state) ?? null,
        },
        user: selectPhUser(state) ?? null,
        source: selectPhSource(state) ?? null,
        compatibility: {
            documents,
        },
    };
};
