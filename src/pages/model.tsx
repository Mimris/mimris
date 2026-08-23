import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import Modelling from '../components/Modelling';
import Layout from '../components/Layout';
import { searchGithub } from '../components/githubServices/githubService';
import { InitialState } from '../reducers/reducer';
import { normalizeGithubSource, readShareQueryValue } from '../components/utils/focusShare';
import { readJsonResponse, readJsonResponseError } from '../components/utils/httpResponse';
import {
    buildRemoteMetisProxyPath,
    buildRemoteMetisResourceUri,
    normalizeRemoteUniverseBaseUrl,
    readRemoteUniverseId,
    readRemoteUniverseSlug,
    type RemoteMetisFocusQuery,
} from '../components/utils/remoteUniverse';
import { buildMimrisStateFromWorkspaceSnapshot, isWorkspaceUniverseSnapshot } from '../components/utils/workspaceUniverseAdapter';
import { saveRemoteUniverseProject } from '../components/utils/remoteUniverseProject';
import { normalizeMetisScope, setActiveMetisScope } from '../components/utils/workspaceMetisResolver.js';
import { buildUniverseStateFromLegacy, selectMimrisCompatibilityProps, setUniverseState, setUniverseUser } from '../sharedUniverse';
import { MEMORY_STATE_STORAGE_KEY, persistMemoryState } from '../components/utils/memoryStateStorage';
import { hydrateRemoteMetisReferences } from '../components/utils/remoteMetisHydration.js';

const page = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const { query, isReady } = router;
    const [hasMounted, setHasMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [isSavingRemote, setIsSavingRemote] = useState(false);
    const [isRefreshingRemote, setIsRefreshingRemote] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [visibleFocusDetails, setVisibleFocusDetails] = useState(false);
    const [exportTab, setExportTab] = useState(0);
    const [fetchedUsername, setFetchedUsername] = useState<string | null>(null);
    const compatibilityProps = useSelector(selectMimrisCompatibilityProps) as any;
    const phFocus = compatibilityProps.phFocus as any;
    const phUser = compatibilityProps.phUser as any;
    const phSource = compatibilityProps.phSource as any;
    const phData = compatibilityProps.phData as any;
    const universeName = phFocus?.focusProj?.name || '';
    const metisSuiteName = phData?.metis?.name || '';
    const headerLabel = [universeName, metisSuiteName].filter(Boolean).join(' / ');
    const LAST_FOCUS_MODEL_STORAGE_KEY = 'mimris.modelling.focusModelId';

    const normalizeModels = (items: any) => Array.isArray(items) ? items.filter(Boolean) : [];
    const asRecord = (value: any) => (value && typeof value === 'object' ? value : {});
    const unwrapRemotePayload = (value: any) => {
        let current = value;
        for (let index = 0; index < 6; index += 1) {
            const record = asRecord(current);
            if (!record || Object.keys(record).length === 0) break;
            if (Array.isArray(record.models) || Array.isArray(record.metamodels)) return record;
            if (record.metis && typeof record.metis === 'object') {
                current = record.metis;
                continue;
            }
            if (record.payload && typeof record.payload === 'object') {
                current = record.payload;
                continue;
            }
            if (isWorkspaceUniverseSnapshot(record)) return record;
            return record;
        }
        return asRecord(current);
    };
    const normalizeSnapshotData = (snapshot: any) => ({
        ...(isWorkspaceUniverseSnapshot(snapshot)
            ? buildMimrisStateFromWorkspaceSnapshot(snapshot)
            : {
                phData: snapshot?.phData || {},
                phFocus: snapshot?.phFocus || {},
                phUser: snapshot?.phUser || {},
                phSource: snapshot?.phSource || '',
            }),
    });
    const dispatchLoadedState = (snapshot: any, options?: { replaceGeometry?: boolean }) => {
        const normalized = normalizeSnapshotData(snapshot);
        if (options?.replaceGeometry) {
            dispatch({ type: 'LOAD_TOSTORE_DATA', data: normalized });
            return;
        }
        dispatch(setUniverseState(buildUniverseStateFromLegacy(normalized)));
    };
    const clearStoredMemoryState = () => {
        if (typeof window === 'undefined') return;
        try { window.sessionStorage.removeItem(MEMORY_STATE_STORAGE_KEY); } catch (_) { }
        try { window.localStorage.removeItem(MEMORY_STATE_STORAGE_KEY); } catch (_) { }
    };
    const resolveUniverseIdFromLibrarySlug = async (slug: string, baseUrl: string) => {
        if (!slug) return '';
        try {
            const response = await fetch(`/api/universe/library?baseUrl=${encodeURIComponent(baseUrl)}`);
            const { payload } = await readJsonResponse(response);
            const universes = Array.isArray(payload?.universes) ? payload.universes : [];
            const match = universes.find((item: any) => item?.slug === slug);
            return typeof match?.universeId === 'string'
                ? match.universeId
                : typeof match?.id === 'string'
                    ? match.id
                    : '';
        } catch (error) {
            console.error('Unable to resolve universe id from library slug:', error);
            return '';
        }
    };
    const hasRequestedRemoteMetisFocus = (focusQuery?: RemoteMetisFocusQuery) =>
        Boolean(
            focusQuery?.modelScope === 'current' ||
            focusQuery?.currentModelRef ||
            focusQuery?.currentModelviewRef ||
            focusQuery?.currentMetamodelRef,
        );
    const appendRemoteMetisFocusRouteParams = (params: URLSearchParams, focusQuery?: RemoteMetisFocusQuery) => {
        if (!focusQuery) return;
        ([
            'currentMetamodelRef',
            'currentModelRef',
            'currentModelviewRef',
            'currentTargetMetamodelRef',
            'targetMetamodelRefs',
            'currentTargetModelRef',
            'currentTargetModelviewRef',
            'initialModelviews',
            'modelScope',
            'workItemId',
            'saveTarget',
            'revision',
            'workspaceAuthority',
        ] as const).forEach(key => {
            const value = focusQuery[key];
            if (typeof value === 'string' && value.trim()) params.set(key, value.trim());
        });
    };
    const buildModelRoute = (options: { universeId?: string; universeSlug?: string; baseUrl?: string; metisScope?: string; focusQuery?: RemoteMetisFocusQuery }) => {
        const params = new URLSearchParams();
        const normalizedBaseUrl = options.baseUrl ? normalizeRemoteUniverseBaseUrl(options.baseUrl) : '';
        if (options.universeId) {
            params.set('universe', options.universeId);
        } else if (options.universeSlug) {
            params.set('universeSlug', options.universeSlug);
        }
        if (normalizedBaseUrl) {
            params.set('universeApi', normalizedBaseUrl);
        }
        if (options.metisScope) {
            params.set('metisScope', normalizeMetisScope(options.metisScope));
        }
        appendRemoteMetisFocusRouteParams(params, options.focusQuery);
        return `/model?${params.toString()}`;
    };
    const updateModelRoute = (options: { universeId?: string; universeSlug?: string; baseUrl?: string; metisScope?: string; focusQuery?: RemoteMetisFocusQuery }) => {
        const nextRoute = buildModelRoute(options);
        const currentPath = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : router.asPath;
        if (currentPath === nextRoute) return;
        router.replace(nextRoute, undefined, { shallow: true, scroll: false });
    };
    const loadLocalMemoryState = (focusQuery?: RemoteMetisFocusQuery) => {
        if (hasRequestedRemoteMetisFocus(focusQuery)) return false;
        try {
            const stored = window.sessionStorage.getItem(MEMORY_STATE_STORAGE_KEY) || window.localStorage.getItem(MEMORY_STATE_STORAGE_KEY);
            const parsed = stored ? JSON.parse(stored) : null;
            if (parsed) {
                dispatchLoadedState(parsed);
                return true;
            }
        } catch (error) {
            console.error('Error parsing memoryLocState:', error);
        }
        return false;
    };
    const readStoredMemoryState = () => {
        if (typeof window === 'undefined') return null;
        try {
            const stored = window.sessionStorage.getItem(MEMORY_STATE_STORAGE_KEY) || window.localStorage.getItem(MEMORY_STATE_STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error parsing memoryLocState:', error);
            return null;
        }
    };
    const readStoredRemoteMeta = (stored: any) => {
        const storedPhUser = stored?.phUser || stored?.universe?.user || {};
        return storedPhUser?.__workspaceUniverse || {};
    };
    const loadMatchingRemoteMemoryState = (options: { universeId?: string; universeSlug?: string; baseUrl?: string; metisScope?: string; remoteUri?: string; focusQuery?: RemoteMetisFocusQuery }) => {
        if (options.focusQuery?.workspaceAuthority === 'redux') return false;
        if (hasRequestedRemoteMetisFocus(options.focusQuery)) return false;
        const stored = readStoredMemoryState();
        if (!stored) return false;
        const meta = readStoredRemoteMeta(stored);
        const storedFocusProj = stored?.phFocus?.focusProj || stored?.universe?.world?.focus?.focusProj || {};
        const storedSource = stored?.phSource || stored?.universe?.source || '';
        const requestedScope = normalizeMetisScope(options.metisScope);
        const storedScope = normalizeMetisScope(meta?.activeMetisScope || stored?.workspace?.activeMetisScope);
        const requestedBaseUrl = normalizeRemoteUniverseBaseUrl(options.baseUrl);
        const storedBaseUrl = normalizeRemoteUniverseBaseUrl(meta?.universeApiBaseUrl || storedFocusProj?.universeApiBaseUrl);
        const matchesScope = storedScope === requestedScope;
        const matchesBaseUrl = !requestedBaseUrl || !storedBaseUrl || storedBaseUrl === requestedBaseUrl;
        const matchesId = options.universeId
            ? (meta?.universeId === options.universeId || storedFocusProj?.universeId === options.universeId)
            : true;
        const matchesSlug = options.universeSlug
            ? (
                meta?.universeSlug === options.universeSlug ||
                storedFocusProj?.slug === options.universeSlug ||
                (typeof storedSource === 'string' && storedSource.includes(`/remote-universe/${encodeURIComponent(options.universeSlug)}/`)) ||
                (typeof storedSource === 'string' && storedSource.includes(`/remote-universe/${options.universeSlug}/`))
            )
            : true;
        const matchesRemoteUri = options.remoteUri
            ? (meta?.remoteModelUri === options.remoteUri || storedSource === options.remoteUri)
            : true;

        if (!matchesScope || !matchesBaseUrl || !matchesId || !matchesSlug || !matchesRemoteUri) {
            return false;
        }

        dispatchLoadedState(stored);
        return true;
    };
    const remoteMemoryMatchesRoute = (stored: any, options: { universeId?: string; universeSlug?: string; baseUrl?: string; metisScope?: string; remoteUri?: string; focusQuery?: RemoteMetisFocusQuery }) => {
        if (options.focusQuery?.workspaceAuthority === 'redux') return false;
        if (hasRequestedRemoteMetisFocus(options.focusQuery)) return false;
        if (!stored) return false;
        const meta = readStoredRemoteMeta(stored);
        const storedFocusProj = stored?.phFocus?.focusProj || stored?.universe?.world?.focus?.focusProj || {};
        const storedSource = stored?.phSource || stored?.universe?.source || '';
        const requestedScope = normalizeMetisScope(options.metisScope);
        const storedScope = normalizeMetisScope(meta?.activeMetisScope || stored?.workspace?.activeMetisScope);
        const requestedBaseUrl = normalizeRemoteUniverseBaseUrl(options.baseUrl);
        const storedBaseUrl = normalizeRemoteUniverseBaseUrl(meta?.universeApiBaseUrl || storedFocusProj?.universeApiBaseUrl);
        const matchesScope = storedScope === requestedScope;
        const matchesBaseUrl = !requestedBaseUrl || !storedBaseUrl || storedBaseUrl === requestedBaseUrl;
        const matchesId = options.universeId
            ? (meta?.universeId === options.universeId || storedFocusProj?.universeId === options.universeId)
            : true;
        const matchesSlug = options.universeSlug
            ? (
                meta?.universeSlug === options.universeSlug ||
                storedFocusProj?.slug === options.universeSlug ||
                (typeof storedSource === 'string' && storedSource.includes(`/remote-universe/${encodeURIComponent(options.universeSlug)}/`)) ||
                (typeof storedSource === 'string' && storedSource.includes(`/remote-universe/${options.universeSlug}/`))
            )
            : true;
        const matchesRemoteUri = options.remoteUri
            ? (meta?.remoteModelUri === options.remoteUri || storedSource === options.remoteUri)
            : true;
        return matchesScope && matchesBaseUrl && matchesId && matchesSlug && matchesRemoteUri;
    };
    const loadNonMatchingLocalMemoryState = (options: { universeId?: string; universeSlug?: string; baseUrl?: string; metisScope?: string; remoteUri?: string; focusQuery?: RemoteMetisFocusQuery }) => {
        if (options.focusQuery?.workspaceAuthority === 'redux') return false;
        if (hasRequestedRemoteMetisFocus(options.focusQuery)) return false;
        const stored = readStoredMemoryState();
        if (!stored?.phData?.metis && !stored?.universe?.world?.worldModel?.metis) return false;
        if (remoteMemoryMatchesRoute(stored, options)) return false;
        dispatchLoadedState(stored);
        return true;
    };
    const resolveLoadError = (response: Response, payload: any, text: string, fallbackMessage: string) =>
        readJsonResponseError(response, payload, text, fallbackMessage);
    const buildScopedRemoteLoadError = (scope: string, universeSlug: string, remoteUri: string, detail?: string) => {
        const prefix = `Unable to load remote model resource '${scope}' for universe '${universeSlug}'.`;
        if (detail && detail.trim()) {
            return `${prefix} ${detail.trim()} URI: ${remoteUri}`;
        }
        return `${prefix} URI: ${remoteUri}`;
    };
    const buildRemoteMetisState = (metisPayload: any, options: { universeId?: string; universeSlug?: string; baseUrl?: string; metisScope?: string; remoteUri?: string; focusQuery?: RemoteMetisFocusQuery }) => {
        const resolvedMetisPayload = unwrapRemotePayload(metisPayload);
        const normalizedMetis = {
            ...InitialState.phData?.metis,
            ...resolvedMetisPayload,
        };
        const remoteMetamodels = normalizeModels(resolvedMetisPayload.metamodels);
        const metamodels = remoteMetamodels.length > 0
            ? remoteMetamodels
            : normalizeModels(InitialState.phData?.metis?.metamodels);
        const hydratedMetis = hydrateRemoteMetisReferences(normalizedMetis, metamodels);
        const models = normalizeModels(hydratedMetis.models);
        const requestedModelRef = readShareQueryValue(options.focusQuery?.currentModelRef) ||
            readShareQueryValue(normalizedMetis.currentModelRef);
        const requestedModelviewRef = readShareQueryValue(options.focusQuery?.currentModelviewRef) ||
            readShareQueryValue(normalizedMetis.currentModelviewRef);
        const requestedMetamodelRef = readShareQueryValue(options.focusQuery?.currentMetamodelRef) ||
            readShareQueryValue(normalizedMetis.currentMetamodelRef);
        const resolvedModel =
            models.find((model: any) => model?.id === requestedModelRef || model?.name === requestedModelRef) ||
            models.find((model: any) => requestedMetamodelRef && model?.metamodelRef === requestedMetamodelRef) ||
            models[0] ||
            null;
        const resolvedModelviews = normalizeModels(resolvedModel?.modelviews);
        const resolvedModelview =
            resolvedModelviews.find((modelview: any) => modelview?.id === requestedModelviewRef || modelview?.name === requestedModelviewRef) ||
            resolvedModelviews[0] ||
            null;
        const projectName = phFocus?.focusProj?.name || options.universeSlug || options.universeId || 'Remote universe';

        return {
            phData: {
                ...InitialState.phData,
                ...phData,
                metis: {
                    ...hydratedMetis,
                    models,
                    metamodels,
                },
            },
            phFocus: {
                ...InitialState.phFocus,
                ...phFocus,
                focusProj: {
                    ...InitialState.phFocus.focusProj,
                    ...phFocus?.focusProj,
                    name: projectName,
                    file: options.remoteUri || options.universeSlug || options.universeId || '',
                    universeId: options.universeId || phFocus?.focusProj?.universeId || '',
                    universeApiBaseUrl: options.baseUrl || phFocus?.focusProj?.universeApiBaseUrl || '',
                },
                focusModel: resolvedModel ? { id: resolvedModel.id, name: resolvedModel.name } : null,
                focusModelview: resolvedModelview ? { id: resolvedModelview.id, name: resolvedModelview.name } : null,
            },
            phUser: {
                ...InitialState.phUser,
                ...phUser,
                __workspaceUniverse: {
                    ...(phUser?.__workspaceUniverse || {}),
                    activeMetisScope: normalizeMetisScope(options.metisScope),
                    remoteModelUri: options.remoteUri || '',
                    universeId: options.universeId || phFocus?.focusProj?.universeId || '',
                    universeSlug: options.universeSlug || '',
                    universeApiBaseUrl: options.baseUrl || phFocus?.focusProj?.universeApiBaseUrl || '',
                },
            },
            phSource: options.remoteUri || options.universeSlug || options.universeId || phSource,
        };
    };
    const resolveUniverseSlugFromLibraryId = async (universeId: string, baseUrl: string) => {
        if (!universeId) return '';
        try {
            const response = await fetch(`/api/universe/library?baseUrl=${encodeURIComponent(baseUrl)}`);
            const { payload } = await readJsonResponse(response);
            const universes = Array.isArray(payload?.universes) ? payload.universes : [];
            const match = universes.find((item: any) =>
                item?.id === universeId || item?.universeId === universeId || item?.slug === universeId,
            );
            return typeof match?.slug === 'string' ? match.slug : '';
        } catch (error) {
            console.error('Unable to resolve universe slug from library id:', error);
            return '';
        }
    };
    const loadExplicitRemoteMetisScope = async (options: { universeSlug: string; universeId?: string; baseUrl: string; metisScope: string; focusQuery?: RemoteMetisFocusQuery; preferRemote?: boolean }) => {
        const remoteUri = buildRemoteMetisResourceUri(options.universeSlug, options.metisScope, options.baseUrl);
        const isWorkspaceAuthoritative = options.focusQuery?.workspaceAuthority === 'redux';
        if (isWorkspaceAuthoritative) clearStoredMemoryState();
        if (!options.preferRemote && loadMatchingRemoteMemoryState({ ...options, remoteUri })) {
            if (!isWorkspaceAuthoritative) {
                updateModelRoute({
                    universeId: options.universeId,
                    universeSlug: options.universeSlug,
                    baseUrl: options.baseUrl,
                    metisScope: options.metisScope,
                    focusQuery: options.focusQuery,
                });
            }
            dispatch({
                type: 'SET_FOCUS_REFRESH',
                data: {
                    id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
                        ? crypto.randomUUID()
                        : `${Date.now()}`,
                    name: 'Open local draft',
                },
            });
            return true;
        }

        const response = await fetch(buildRemoteMetisProxyPath(options.universeSlug, options.metisScope, options.baseUrl, options.focusQuery));
        const { payload, text } = await readJsonResponse(response);
        if (!response.ok || payload?.error || !payload?.payload) {
            try {
                const fallbackResponse = await fetch(`/api/universe/library/${encodeURIComponent(options.universeSlug)}?baseUrl=${encodeURIComponent(options.baseUrl)}`);
                const fallback = await readJsonResponse(fallbackResponse);
                if (fallbackResponse.ok && fallback.payload && !fallback.payload?.error) {
                    const fallbackRawPayload = fallback.payload;
                    const fallbackState = isWorkspaceUniverseSnapshot(fallbackRawPayload)
                        ? buildMimrisStateFromWorkspaceSnapshot(setActiveMetisScope(fallbackRawPayload, options.metisScope), {
                            sourceName: fallbackRawPayload?.focus?.project?.name || options.universeSlug,
                            sourcePath: remoteUri,
                            universeId: options.universeId,
                            universeApiBaseUrl: options.baseUrl,
                        })
                        : buildRemoteMetisState(fallbackRawPayload, {
                            universeId: options.universeId,
                            universeSlug: options.universeSlug,
                            baseUrl: options.baseUrl,
                            metisScope: options.metisScope,
                            remoteUri,
                            focusQuery: options.focusQuery,
                        });

                    clearStoredFocusModel();
                    if (isWorkspaceAuthoritative) clearStoredMemoryState();
                    dispatchLoadedState(fallbackState, { replaceGeometry: isWorkspaceAuthoritative });
                    if (!isWorkspaceAuthoritative) {
                        updateModelRoute({
                            universeId: options.universeId,
                            universeSlug: options.universeSlug,
                            baseUrl: options.baseUrl,
                            metisScope: options.metisScope,
                            focusQuery: options.focusQuery,
                        });
                    }
                    dispatch({
                        type: 'SET_FOCUS_REFRESH',
                        data: {
                            id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
                                ? crypto.randomUUID()
                                : `${Date.now()}`,
                            name: 'Open remote model',
                        },
                    });
                    return fallbackState;
                }
            } catch (fallbackError) {
                console.error('Fallback remote universe load failed:', fallbackError);
            }

            const detail = resolveLoadError(
                response,
                payload,
                text,
                `Remote endpoint returned an error for scope '${options.metisScope}'.`,
            );
            setLoadError(buildScopedRemoteLoadError(options.metisScope, options.universeSlug, remoteUri, detail));
            return null;
        }

        const rawPayload = unwrapRemotePayload(payload.payload);
        const nextState = isWorkspaceUniverseSnapshot(rawPayload)
            ? buildMimrisStateFromWorkspaceSnapshot(setActiveMetisScope(rawPayload, options.metisScope), {
                sourceName: rawPayload?.focus?.project?.name || options.universeSlug,
                sourcePath: remoteUri,
                universeId: options.universeId,
                universeApiBaseUrl: options.baseUrl,
            })
            : buildRemoteMetisState(rawPayload, {
                universeId: options.universeId,
                universeSlug: options.universeSlug,
                baseUrl: options.baseUrl,
                metisScope: options.metisScope,
                remoteUri,
                focusQuery: options.focusQuery,
            });

        clearStoredFocusModel();
        if (isWorkspaceAuthoritative) clearStoredMemoryState();
        dispatchLoadedState(nextState, { replaceGeometry: isWorkspaceAuthoritative });
        if (!isWorkspaceAuthoritative) {
            updateModelRoute({
                universeId: options.universeId,
                universeSlug: options.universeSlug,
                baseUrl: options.baseUrl,
                metisScope: options.metisScope,
                focusQuery: options.focusQuery,
            });
        }
        dispatch({
            type: 'SET_FOCUS_REFRESH',
            data: {
                id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
                    ? crypto.randomUUID()
                    : `${Date.now()}`,
                name: 'Open remote model',
            },
        });
        return nextState;
    };
    const canSaveRemote = Boolean(
        phFocus?.focusProj?.universeId ||
        phFocus?.focusProj?.universeApiBaseUrl ||
        phUser?.__workspaceUniverse?.universeId ||
        phUser?.__workspaceUniverse?.universeApiBaseUrl,
    );
    const currentRemoteUniverseSlug = readRemoteUniverseSlug(query.universeSlug) || phUser?.__workspaceUniverse?.universeSlug || '';
    const currentRemoteUniverseApi = readShareQueryValue(query.universeApi) || phUser?.__workspaceUniverse?.universeApiBaseUrl || '';
    const currentRemoteMetisScope = normalizeMetisScope(readShareQueryValue(query.metisScope) || phUser?.__workspaceUniverse?.activeMetisScope);
    const currentRemoteFocusQuery: RemoteMetisFocusQuery = {
        currentMetamodelRef: readShareQueryValue(query.currentMetamodelRef),
        currentModelRef: readShareQueryValue(query.currentModelRef),
        currentModelviewRef: readShareQueryValue(query.currentModelviewRef),
        currentTargetMetamodelRef: readShareQueryValue(query.currentTargetMetamodelRef),
        targetMetamodelRefs: readShareQueryValue(query.targetMetamodelRefs),
        currentTargetModelRef: readShareQueryValue(query.currentTargetModelRef),
        currentTargetModelviewRef: readShareQueryValue(query.currentTargetModelviewRef),
        initialModelviews: readShareQueryValue(query.initialModelviews),
        modelScope: readShareQueryValue(query.modelScope),
        workItemId: readShareQueryValue(query.workItemId),
        saveTarget: readShareQueryValue(query.saveTarget),
        revision: readShareQueryValue(query.revision),
        workspaceAuthority: readShareQueryValue(query.workspaceAuthority),
    };
    const focusedModel = normalizeModels(phData?.metis?.models).find((model: any) => model?.id === phFocus?.focusModel?.id) ||
        normalizeModels(phData?.metis?.models)[0] ||
        null;
    const focusedMetamodelRef = focusedModel?.metamodelRef || focusedModel?.metamodelId || currentRemoteFocusQuery.currentMetamodelRef || '';
    const focusedMetamodel = normalizeModels(phData?.metis?.metamodels).find((metamodel: any) => metamodel?.id === focusedMetamodelRef) || null;
    const focusedModelview = normalizeModels(focusedModel?.modelviews).find((modelview: any) => modelview?.id === phFocus?.focusModelview?.id) ||
        normalizeModels(focusedModel?.modelviews)[0] ||
        null;
    const canSaveFocusedModelToWorkspace = Boolean(currentRemoteUniverseSlug && currentRemoteUniverseApi && focusedModel?.id);
    const canRefreshFocusedModelFromWorkspace = Boolean(currentRemoteUniverseSlug && currentRemoteUniverseApi);
    const handleRefreshFocusedModelFromWorkspace = async () => {
        if (!canRefreshFocusedModelFromWorkspace) return;
        setIsRefreshingRemote(true);
        setSaveStatus('');
        setLoadError('');
        try {
            const currentMetamodelRef = focusedMetamodelRef || focusedMetamodel?.id || currentRemoteFocusQuery.currentMetamodelRef || '';
            const currentModelRef = focusedModel?.id || currentRemoteFocusQuery.currentModelRef || '';
            const currentModelviewRef = focusedModelview?.id || currentRemoteFocusQuery.currentModelviewRef || '';
            await loadExplicitRemoteMetisScope({
                universeSlug: currentRemoteUniverseSlug,
                baseUrl: normalizeRemoteUniverseBaseUrl(currentRemoteUniverseApi),
                metisScope: currentRemoteMetisScope,
                focusQuery: {
                    ...currentRemoteFocusQuery,
                    currentMetamodelRef,
                    currentModelRef,
                    currentModelviewRef,
                    modelScope: currentRemoteFocusQuery.modelScope || (currentModelRef ? 'current' : ''),
                },
                preferRemote: true,
            });
            setSaveStatus('Refreshed from workspace. Local changes were discarded.');
        } catch (error: any) {
            console.error('Error refreshing focused model from workspace:', error);
            setLoadError(error?.message || 'Unable to refresh model from workspace.');
        } finally {
            setIsRefreshingRemote(false);
        }
    };
    const handleSaveFocusedModelToWorkspace = async () => {
        if (!canSaveFocusedModelToWorkspace || !focusedModel?.id) return;
        setIsSavingRemote(true);
        setSaveStatus('');
        try {
            const currentMetamodelRef = focusedMetamodelRef || focusedMetamodel?.id || '';
            const currentModelRef = focusedModel.id;
            const currentModelviewRef = focusedModelview?.id || '';
            const metisPatch = {
                name: phData?.metis?.name || '',
                description: phData?.metis?.description || '',
                ...(currentMetamodelRef ? { currentMetamodelRef } : {}),
                currentModelRef,
                ...(currentModelviewRef ? { currentModelviewRef } : {}),
                metamodels: focusedMetamodel ? [focusedMetamodel] : [],
                models: [focusedModel],
            };
            const response = await fetch(
                buildRemoteMetisProxyPath(
                    currentRemoteUniverseSlug,
                    currentRemoteMetisScope,
                    currentRemoteUniverseApi,
                    {
                        ...currentRemoteFocusQuery,
                        currentMetamodelRef,
                        currentModelRef,
                        currentModelviewRef,
                        modelScope: 'current',
                    },
                ),
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode: 'merge', metis: metisPatch }),
                },
            );
            const { payload, text } = await readJsonResponse(response);
            if (!response.ok || payload?.error) {
                throw new Error(readJsonResponseError(response, payload, text, 'Unable to save model to workspace.'));
            }
            const savedMetis = payload?.payload?.metis || payload?.metis || null;
            if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'mimris:model-saved',
                    universeSlug: currentRemoteUniverseSlug,
                    metisScope: currentRemoteMetisScope,
                    workItemId: currentRemoteFocusQuery.workItemId || '',
                    saveTarget: currentRemoteFocusQuery.saveTarget || 'workItem',
                    metis: savedMetis || metisPatch,
                    model: focusedModel,
                    metamodel: focusedMetamodel || undefined,
                    focus: {
                        focusModel: { id: currentModelRef, name: focusedModel?.name || '' },
                        focusModelview: { id: currentModelviewRef, name: focusedModelview?.name || '' },
                    },
                    revision: currentRemoteFocusQuery.revision || '',
                    nextRevision: new Date().toISOString(),
                }, '*');
            }
            setSaveStatus('Saved model to workspace');
        } catch (error: any) {
            console.error('Error saving focused model to workspace:', error);
            setSaveStatus(error?.message || 'Unable to save model to workspace');
        } finally {
            setIsSavingRemote(false);
        }
    };
    const clearStoredFocusModel = () => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.removeItem(LAST_FOCUS_MODEL_STORAGE_KEY);
        } catch (error) {
            console.error('Unable to clear stored focus model:', error);
        }
    };
    const handleSaveToServer = async () => {
        setIsSavingRemote(true);
        setSaveStatus('');
        try {
            const result = await saveRemoteUniverseProject({
                phData,
                phFocus,
                phSource,
                phUser,
            });
            const adaptedState = buildMimrisStateFromWorkspaceSnapshot(result.snapshot, {
                sourceName: result.snapshot?.focus?.project?.name || phFocus?.focusProj?.name || result.id,
                sourcePath: result.snapshot?.focus?.project?.file || phFocus?.focusProj?.file || result.id,
                universeId: result.id,
                universeApiBaseUrl: result.baseUrl,
            });
            dispatch(setUniverseState(buildUniverseStateFromLegacy(adaptedState)));
            dispatch({ type: 'SET_FOCUS_REFRESH', data: { id: result.id, name: 'Server save' } });
            setSaveStatus('Saved to server');
        } catch (error: any) {
            console.error('Error saving remote universe:', error);
            setSaveStatus(error?.message || 'Unable to save to server');
        } finally {
            setIsSavingRemote(false);
        }
    };

    const buildSharedData = (rawData: any, shareQuery: any) => {
        const importedProject = rawData?.phData ? rawData : { phData: rawData };
        const rawPhData = importedProject?.phData || {};
        const importedMetis = rawPhData?.metis || {};
        const models = normalizeModels(importedMetis.models || rawData?.models);
        const metamodels = normalizeModels(importedMetis.metamodels || rawData?.metamodels);
        const phData = {
            ...InitialState.phData,
            ...rawPhData,
            ...(rawData?.domain ? { domain: rawData.domain } : {}),
            metis: {
                ...InitialState.phData?.metis,
                ...importedMetis,
                models,
                metamodels,
            },
        };
        const requestedModel = readShareQueryValue(shareQuery.model);
        const requestedModelview = readShareQueryValue(shareQuery.modelview);
        const resolvedModel = models.find((model: any) => model?.id === requestedModel || model?.name === requestedModel) || models[0] || null;
        const modelviews = normalizeModels(resolvedModel?.modelviews);
        const resolvedModelview = modelviews.find((modelview: any) => modelview?.id === requestedModelview || modelview?.name === requestedModelview) || modelviews[0] || null;

        return {
            phData,
            phFocus: {
                ...InitialState.phFocus,
                ...importedProject?.phFocus,
                focusProj: {
                    ...InitialState.phFocus?.focusProj,
                    ...importedProject?.phFocus?.focusProj,
                    org: readShareQueryValue(shareQuery.org) || importedProject?.phFocus?.focusProj?.org || null,
                    repo: readShareQueryValue(shareQuery.repo) || importedProject?.phFocus?.focusProj?.repo || null,
                    branch: readShareQueryValue(shareQuery.branch) || importedProject?.phFocus?.focusProj?.branch || 'main',
                    path: readShareQueryValue(shareQuery.path) || importedProject?.phFocus?.focusProj?.path || '',
                    file: readShareQueryValue(shareQuery.file) || importedProject?.phFocus?.focusProj?.file || '',
                },
                focusModel: resolvedModel ? { id: resolvedModel.id, name: resolvedModel.name } : null,
                focusModelview: resolvedModelview ? { id: resolvedModelview.id, name: resolvedModelview.name } : null,
            },
            phUser: importedProject?.phUser || InitialState.phUser,
            phSource: importedProject?.phSource || readShareQueryValue(shareQuery.file) || InitialState.phSource,
        };
    };

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        const fetchUsername = async () => {
            try {
                const response = await fetch('/api/user');
                const data = await response.json();
                const username = typeof data?.username === 'string' && data.username
                    ? data.username.charAt(0).toUpperCase() + data.username.slice(1)
                    : 'Guest';
                setFetchedUsername(username);
            } catch (error) {
                console.error('Error fetching username:', error);
            }
        };

        fetchUsername();
    }, []);

    useEffect(() => {
        if (!fetchedUsername) return;
        if (phUser?.focusUser?.name === fetchedUsername) return;

        dispatch(setUniverseUser({
            ...(phUser || {}),
            focusUser: {
                ...(phUser?.focusUser || {}),
                name: fetchedUsername,
            },
        }));
    }, [dispatch, fetchedUsername, phUser]);

    useEffect(() => {
        if (!hasMounted) return;

        const shareId = readShareQueryValue(query.share);
        const universeId = readRemoteUniverseId(query.universe);
        const universeSlug = readShareQueryValue(query.universeSlug);
        const universeApi = readShareQueryValue(query.universeApi);
        const requestedMetisScope = normalizeMetisScope(readShareQueryValue(query.metisScope));
        const focusQuery: RemoteMetisFocusQuery = {
            currentMetamodelRef: readShareQueryValue(query.currentMetamodelRef),
            currentModelRef: readShareQueryValue(query.currentModelRef),
            currentModelviewRef: readShareQueryValue(query.currentModelviewRef),
            currentTargetMetamodelRef: readShareQueryValue(query.currentTargetMetamodelRef),
            targetMetamodelRefs: readShareQueryValue(query.targetMetamodelRefs),
            currentTargetModelRef: readShareQueryValue(query.currentTargetModelRef),
            currentTargetModelviewRef: readShareQueryValue(query.currentTargetModelviewRef),
            initialModelviews: readShareQueryValue(query.initialModelviews),
            modelScope: readShareQueryValue(query.modelScope),
            workItemId: readShareQueryValue(query.workItemId),
            saveTarget: readShareQueryValue(query.saveTarget),
            revision: readShareQueryValue(query.revision),
            workspaceAuthority: readShareQueryValue(query.workspaceAuthority),
        };
        const projectId = readShareQueryValue(query.project);
        const org = readShareQueryValue(query.org);
        const repo = readShareQueryValue(query.repo);
        const file = readShareQueryValue(query.file);

        const loadModel = async () => {
            setIsLoading(true);
            setLoadError('');
            if (isReady && shareId) {
                try {
                    const response = await fetch(`/api/share/${encodeURIComponent(shareId)}`);
                    const { payload, text } = await readJsonResponse(response);
                    if (!response.ok || !payload?.snapshot) {
                        throw new Error(readJsonResponseError(response, payload, text, 'Share not found.'));
                    }
                    dispatchLoadedState(payload.snapshot);
                } catch (error: any) {
                    console.error('Error loading snapshot share:', error);
                    setLoadError(error?.message || 'Unable to load shared snapshot.');
                }
                setIsLoading(false);
                return;
            }

            if (
                isReady &&
                (universeId || universeSlug) &&
                loadNonMatchingLocalMemoryState({
                    universeId,
                    universeSlug,
                    baseUrl: normalizeRemoteUniverseBaseUrl(universeApi),
                    metisScope: requestedMetisScope,
                    focusQuery,
                })
            ) {
                dispatch({
                    type: 'SET_FOCUS_REFRESH',
                    data: {
                        id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
                            ? crypto.randomUUID()
                            : `${Date.now()}`,
                        name: 'Restore local draft',
                    },
                });
                setIsLoading(false);
                return;
            }

            if (isReady && universeId) {
                try {
                    const baseUrl = normalizeRemoteUniverseBaseUrl(universeApi);
                    const resolvedSlug = universeSlug || await resolveUniverseSlugFromLibraryId(universeId, baseUrl);

                    if (resolvedSlug) {
                        try {
                            await loadExplicitRemoteMetisScope({
                                universeSlug: resolvedSlug,
                                universeId,
                                baseUrl,
                                metisScope: requestedMetisScope,
                                focusQuery,
                            });
                            setIsLoading(false);
                            return;
                        } catch (error: any) {
                            setLoadError(error?.message || 'Unable to load remote model resource.');
                            setIsLoading(false);
                            return;
                        }
                    }

                    setLoadError('Unable to resolve a universe slug for the selected remote model resource.');
                    setIsLoading(false);
                    return;
                } catch (error: any) {
                    console.error('Error loading remote universe:', error);
                    setLoadError(error?.message || 'Unable to load remote universe.');
                }
                setIsLoading(false);
                return;
            }

            if (isReady && universeSlug) {
                try {
                    const baseUrl = normalizeRemoteUniverseBaseUrl(universeApi);
                    const resolvedId = await resolveUniverseIdFromLibrarySlug(universeSlug, baseUrl);
                    await loadExplicitRemoteMetisScope({
                        universeSlug,
                        universeId: resolvedId,
                        baseUrl,
                        metisScope: requestedMetisScope,
                        focusQuery,
                    });
                } catch (error: any) {
                    console.error('Error loading remote universe library entry:', error);
                    setLoadError(error?.message || 'Unable to load remote universe.');
                }
                setIsLoading(false);
                return;
            }

            if (isReady && projectId) {
                try {
                    const response = await fetch(`/api/workbench/${encodeURIComponent(projectId)}`);
                    const { payload, text } = await readJsonResponse(response);
                    if (!response.ok || !payload?.snapshot) {
                        throw new Error(readJsonResponseError(response, payload, text, 'Project not found.'));
                    }
                    dispatchLoadedState(
                        isWorkspaceUniverseSnapshot(payload.snapshot)
                            ? buildMimrisStateFromWorkspaceSnapshot(payload.snapshot, {
                                sourceName: payload?.snapshot?.focus?.project?.name || projectId,
                                sourcePath: payload?.snapshot?.focus?.project?.file || projectId,
                            })
                            : payload.snapshot,
                    );
                } catch (error: any) {
                    console.error('Error loading server project:', error);
                    setLoadError(error?.message || 'Unable to load server project.');
                }
                setIsLoading(false);
                return;
            }

            if (isReady && org && repo && file) {
                try {
                    const path = readShareQueryValue(query.path);
                    const branch = readShareQueryValue(query.branch) || 'main';
                    const githubSource = normalizeGithubSource({ org, repo });
                    const response = await searchGithub(githubSource.repoPath, path, file, branch, 'file');
                    if (!response?.data) {
                        throw new Error('Unable to load shared model file.');
                    }
                    const nextData = isWorkspaceUniverseSnapshot(response.data)
                        ? buildMimrisStateFromWorkspaceSnapshot(response.data, {
                            sourceName: file,
                            sourcePath: file,
                        })
                        : buildSharedData(response.data, query);
                    dispatchLoadedState(nextData);
                } catch (error: any) {
                    console.error('Error loading shared model:', error);
                    if (!loadLocalMemoryState(focusQuery)) {
                        setLoadError(error?.message || 'Unable to load shared model file.');
                    }
                }
                setIsLoading(false);
                return;
            }

            const hasLocalState = loadLocalMemoryState(focusQuery);
            if (!hasLocalState) {
                setLoadError('Unable to load shared model file.');
            }
            setIsLoading(false);
        };

        loadModel();
    }, [hasMounted, isReady, query]);

    const asPathQuery = typeof router.asPath === 'string' && router.asPath.includes('?')
        ? router.asPath.slice(router.asPath.indexOf('?') + 1)
        : '';
    const asPathParams = new URLSearchParams(asPathQuery);
    const pendingShareId = asPathParams.get('share') || '';
    const pendingUniverseId = asPathParams.get('universe') || '';
    const pendingUniverseSlug = asPathParams.get('universeSlug') || '';
    const pendingProjectId = asPathParams.get('project') || '';
    const pendingGithubOrg = asPathParams.get('org') || '';
    const pendingGithubRepo = asPathParams.get('repo') || '';
    const pendingGithubFile = asPathParams.get('file') || '';
    const hasExplicitLoadRequest = Boolean(
        pendingShareId ||
        pendingUniverseId ||
        pendingUniverseSlug ||
        pendingProjectId ||
        (pendingGithubOrg && pendingGithubRepo && pendingGithubFile)
    );
    const hasRenderableModels = Array.isArray(phData?.metis?.models) && phData.metis.models.some(Boolean);
    const waitingForRequestedModel = hasExplicitLoadRequest && (!isReady || isLoading);
    const shouldRenderModel = hasRenderableModels && !waitingForRequestedModel;

    useEffect(() => {
        if (!hasMounted || isLoading || loadError || !hasRenderableModels) return;
        if (typeof window === 'undefined') return;

        if (currentRemoteFocusQuery.workspaceAuthority === 'redux') return;

        const snapshot = {
            phData,
            phFocus,
            phUser,
            phSource,
            universe: buildUniverseStateFromLegacy(compatibilityProps),
            lastUpdate: new Date().toISOString(),
        };

        try {
            const result = persistMemoryState(snapshot);
            if (result.sessionQuotaExceeded && result.localQuotaExceeded) {
                console.warn('Model draft exceeded both browser storage quotas; the current draft could not be cached.');
            } else if (result.localQuotaExceeded) {
                console.warn('Local model draft exceeded localStorage quota; kept the current draft in sessionStorage only.');
            } else if (result.sessionQuotaExceeded) {
                console.warn('Local model draft exceeded sessionStorage quota; kept the current draft in localStorage only.');
            }
        } catch (error) {
            console.error('Unable to persist local model draft:', error);
        }
    }, [hasMounted, isLoading, loadError, hasRenderableModels, phData, phFocus, phUser, phSource, compatibilityProps]);

    if ((!hasMounted || waitingForRequestedModel) && !hasRenderableModels) {
        return <div className="workarea p-3 w-100">Loading shared model...</div>;
    }

    if (loadError && !hasRenderableModels) {
        return <div className="workarea p-3 w-100">{loadError}</div>;
    }

    return (
        <Layout
            user={phUser?.focusUser}
            hideTopMenu
            navbarProps={{
                variant: 'mini-model',
                suiteLabel: headerLabel,
                canSaveToServer: canSaveRemote,
                isSavingToServer: isSavingRemote,
                onSaveToServer: handleSaveToServer,
            }}
        >
            <div className="workarea p-1 w-100 position-relative" style={{ backgroundColor: "#bcc" }}>
                {canSaveFocusedModelToWorkspace && (
                    <div className="px-3 py-2 small text-muted d-flex gap-3 align-items-center" style={{ backgroundColor: 'rgba(255,255,255,0.82)' }}>
                        <button
                            type="button"
                            className="btn btn-success btn-sm"
                            disabled={isSavingRemote || isRefreshingRemote}
                            onClick={handleSaveFocusedModelToWorkspace}
                        >
                            {isSavingRemote ? 'Saving model...' : 'Save model to workspace'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            disabled={isSavingRemote || isRefreshingRemote}
                            onClick={handleRefreshFocusedModelFromWorkspace}
                            title="Reload the current model from workspace and discard local unsaved changes"
                        >
                            {isRefreshingRemote ? 'Refreshing...' : 'Refresh from workspace'}
                        </button>
                        <span>{focusedModel?.name || focusedModel?.id}</span>
                    </div>
                )}
                {(isLoading || loadError) && (
                    <div
                        className="px-3 py-2 small text-muted d-flex gap-3 align-items-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.72)' }}
                    >
                        {isLoading && <span>Loading shared model...</span>}
                        {loadError && <span>{loadError}</span>}
                    </div>
                )}
                {saveStatus && (
                    <div className="px-3 py-2 small text-muted d-flex gap-3 align-items-center" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
                        {saveStatus && <span>{saveStatus}</span>}
                    </div>
                )}
                {shouldRenderModel && (
                    <Modelling
                        {...compatibilityProps}
                        visibleFocusDetails={visibleFocusDetails}
                        setVisibleFocusDetails={setVisibleFocusDetails}
                        exportTab={exportTab}
                        visiblePalette={false}
                    />
                )}
            </div>
        </Layout>
    )
};

export default page;
