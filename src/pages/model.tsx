import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useRouter } from 'next/router';
import useLocalStorage from '../hooks/use-local-storage';
import Modelling from '../components/Modelling';
import Page from '../components/page';
import { searchGithub } from '../components/githubServices/githubService';
import { InitialState } from '../reducers/reducer';
import { readShareQueryValue } from '../components/utils/focusShare';

const page = (props: any) => {
    const router = useRouter();
    const { query, isReady } = router;
    const [memoryLocState] = useLocalStorage('memorystate', []);
    const [data, setData] = useState(() => {
        try {
            return memoryLocState && typeof memoryLocState === 'string'
                ? JSON.parse(memoryLocState)
                : {};
        } catch (error) {
            console.error('Error parsing initial memoryLocState:', error);
            return {};
        }
    });
    const [isLoading, setIsLoading] = useState(() => {
        if (typeof window === 'undefined') return false;
        const params = new URLSearchParams(window.location.search);
        return Boolean(params.get('org') && params.get('repo') && params.get('file'));
    });
    const [loadError, setLoadError] = useState('');

    const normalizeModels = (items: any) => Array.isArray(items) ? items.filter(Boolean) : [];

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
        let parsedMemoryLocState = null;

        try {
            // Parse memoryLocState if it's a string
            parsedMemoryLocState = memoryLocState && typeof memoryLocState === 'string'
                ? JSON.parse(memoryLocState)
                : memoryLocState;
        } catch (error) {
            console.error('Error parsing memoryLocState:', error);
        }

        if (parsedMemoryLocState) {
            const newData = {
                phData: parsedMemoryLocState.phData || {},
                phFocus: parsedMemoryLocState.phFocus || {},
                phUser: parsedMemoryLocState.phUser || {},
                phSource: parsedMemoryLocState.phSource || '',
            };
            setData(newData);
        }
    }, [memoryLocState]);

    useEffect(() => {
        const org = readShareQueryValue(query.org);
        const repo = readShareQueryValue(query.repo);
        const file = readShareQueryValue(query.file);
        if (!isReady || !org || !repo || !file) return;

        const loadSharedModel = async () => {
            setIsLoading(true);
            setLoadError('');
            try {
                const path = readShareQueryValue(query.path);
                const branch = readShareQueryValue(query.branch) || 'main';
                const response = await searchGithub(`${org}/${repo}`, path, file, branch, 'file');
                if (!response?.data) {
                    throw new Error('Unable to load shared model file.');
                }
                setData(buildSharedData(response.data, query));
            } catch (error: any) {
                console.error('Error loading shared model:', error);
                setLoadError(error?.message || 'Unable to load shared model file.');
            } finally {
                setIsLoading(false);
            }
        };

        loadSharedModel();
    }, [isReady, query]);

    if (isLoading) {
        return <div className="workarea p-3 w-100" style={{ backgroundColor: "#bcc" }}>Loading shared model...</div>;
    }

    if (loadError) {
        return <div className="workarea p-3 w-100" style={{ backgroundColor: "#bcc" }}>{loadError}</div>;
    }

    if (Array.isArray(data?.phData?.metis?.models) && data.phData.metis.models.length === 0) {
        return <div className="workarea p-3 w-100" style={{ backgroundColor: "#bcc" }}>No models in this file.</div>;
    }

    return (
        <div className="workarea p-1 w-100" style={{ backgroundColor: "#bcc" }}>
            <Modelling {...data}
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
