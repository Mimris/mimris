import React, { useState, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import Modelling from '../components/Modelling';
import Page from '../components/page';
import { searchGithub } from '../components/githubServices/githubService';
import { InitialState } from '../reducers/reducer';
import { normalizeGithubSource, readShareQueryValue } from '../components/utils/focusShare';
import { readJsonResponse, readJsonResponseError } from '../components/utils/httpResponse';
import { normalizeRemoteUniverseBaseUrl, readRemoteUniverseId } from '../components/utils/remoteUniverse';
import { buildMimrisStateFromWorkspaceSnapshot, isWorkspaceUniverseSnapshot } from '../components/utils/workspaceUniverseAdapter';

const page = (props: any) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const { query, isReady } = router;
    const [hasMounted, setHasMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const normalizeModels = (items: any) => Array.isArray(items) ? items.filter(Boolean) : [];
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
    const dispatchLoadedState = (snapshot: any) => {
        const normalized = normalizeSnapshotData(snapshot);
        dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: normalized.phData });
        dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: normalized.phFocus });
        dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: normalized.phUser });
        dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: normalized.phSource });
    };
    const loadLocalMemoryState = () => {
        try {
            const stored = window.localStorage.getItem('memorystate');
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
        if (!hasMounted) return;

        const shareId = readShareQueryValue(query.share);
        const universeId = readRemoteUniverseId(query.universe);
        const universeSlug = readShareQueryValue(query.universeSlug);
        const universeApi = readShareQueryValue(query.universeApi);
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

            if (isReady && universeId) {
                try {
                    const baseUrl = normalizeRemoteUniverseBaseUrl(universeApi);
                    const response = await fetch(`/api/universes/${encodeURIComponent(universeId)}?baseUrl=${encodeURIComponent(baseUrl)}`);
                    const { payload, text } = await readJsonResponse(response);
                    if (!response.ok || !payload?.snapshot) {
                        throw new Error(
                            readJsonResponseError(response, payload, text,
                            (response.status === 404
                                ? 'Universe not found.'
                                : 'Unable to load remote universe.')),
                        );
                    }
                    dispatchLoadedState(
                        isWorkspaceUniverseSnapshot(payload.snapshot)
                            ? buildMimrisStateFromWorkspaceSnapshot(payload.snapshot, {
                                sourceName: payload?.snapshot?.focus?.project?.name || universeId,
                                sourcePath: payload?.snapshot?.focus?.project?.file || universeId,
                                universeId,
                                universeApiBaseUrl: baseUrl,
                            })
                            : payload.snapshot,
                    );
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
                    const response = await fetch(`/api/universe/library/${encodeURIComponent(universeSlug)}?baseUrl=${encodeURIComponent(baseUrl)}`);
                    const { payload, text } = await readJsonResponse(response);
                    if (!response.ok || payload?.error || !payload) {
                        throw new Error(readJsonResponseError(response, payload, text, 'Unable to load remote universe.'));
                    }
                    dispatchLoadedState(
                        isWorkspaceUniverseSnapshot(payload)
                            ? buildMimrisStateFromWorkspaceSnapshot(payload, {
                                sourceName: payload?.name || universeSlug,
                                sourcePath: payload?.slug || universeSlug,
                                universeApiBaseUrl: baseUrl,
                            })
                            : payload,
                    );
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
                    if (!loadLocalMemoryState()) {
                        setLoadError(error?.message || 'Unable to load shared model file.');
                    }
                }
                setIsLoading(false);
                return;
            }

            const hasLocalState = loadLocalMemoryState();
            if (!hasLocalState) {
                setLoadError('Unable to load shared model file.');
            }
            setIsLoading(false);
        };

        loadModel();
    }, [hasMounted, isReady, query]);

    if (!hasMounted) {
        return <div className="workarea p-3 w-100" style={{ backgroundColor: "#bcc" }}>Loading shared model...</div>;
    }

    if (isLoading) {
        return <div className="workarea p-3 w-100" style={{ backgroundColor: "#bcc" }}>Loading shared model...</div>;
    }

    if (loadError) {
        return <div className="workarea p-3 w-100" style={{ backgroundColor: "#bcc" }}>{loadError}</div>;
    }

    return (
        <div className="workarea p-1 w-100" style={{ backgroundColor: "#bcc" }}>
            <Modelling {...props}
                visibleFocusDetails={false}
                setVisibleFocusDetails={false}
                exportTab={false}
                visiblePalette={false}
            />
            {/* <Modelling toggleRefresh={toggleRefresh} /> */}
        </div>
    )
};

export default Page(connect(state => state)(page));
