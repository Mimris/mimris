import { useState, useEffect, useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
import Link from 'next/link';
import { useRouter } from 'next/router'; // Add this import
import { useSelector } from 'react-redux';

import { InitialState } from '../../reducers/reducer';
import { ReadModelFromFile } from '../utils/ReadModelFromFile';
import { buildRemoteUniversePath, getDefaultRemoteUniverseBaseUrl, normalizeRemoteUniverseBaseUrl } from '../utils/remoteUniverse';
import { readJsonResponse, readJsonResponseError } from '../utils/httpResponse';
import { SaveAllToFile } from '../utils/SaveModelToFile';
import { buildMimrisStateFromWorkspaceSnapshot, getWorkspaceSnapshotMeta } from '../utils/workspaceUniverseAdapter';
import { getMetisScopeLabel, getMetisScopeOptions, normalizeMetisScope, setActiveMetisScope } from '../utils/workspaceMetisResolver.js';
import { saveRemoteUniverseProject } from '../utils/remoteUniverseProject';
import { loadLegacyUniverseSnapshot, selectSharedUniverseState, setUniverseSource } from '../../sharedUniverse';
import LoadGitHub from './LoadGitHub';
import LoadFile from './LoadFile';
import LoadJsonFile from './LoadJsonFile'
import LoadNewModelProjectFromGitHub from './LoadNewModelProjectFromGitHub';
import ProjectDetailsForm from "../forms/ProjectDetailsForm";
// import { is } from 'cheerio/lib/api/traversing';
// import { bottom } from '@popperjs/core';

const debug = false;

const buildGithubTreeHref = (focusProj: any) => {
    const org = focusProj?.org || '';
    const repo = focusProj?.repo || '';
    const branch = focusProj?.branch || 'main';
    const path = String(focusProj?.path || '').replace(/^\/+|\/+$/g, '');
    if (!org || !repo) return '#';
    const segments = ['https://github.com', org, repo, 'tree', branch];
    if (path) segments.push(path);
    return segments.join('/');
};

export const ProjectMenuBar = (props: any) => {
    if (debug) console.log('18 ProjectMenuBar', props);
    const dispatch = props.dispatch;
    const router = useRouter(); // Initialize router
    const sharedUniverse = useSelector(selectSharedUniverseState);
    const phProps = {
        ...props,
        phData: {
            ...props.phData,
            domain: sharedUniverse.world.worldDefinition.domain ?? props.phData?.domain,
            metis: sharedUniverse.world.worldModel.metis ?? props.phData?.metis,
            documents: sharedUniverse.compatibility.documents ?? props.phData?.documents,
        },
        phFocus: sharedUniverse.world.focus || props.phFocus || {},
        phUser: sharedUniverse.user || props.phUser || {},
        phSource: sharedUniverse.source ?? props.phSource,
        phList: sharedUniverse.compatibility.modelList ?? props.phList,
    };
    if (!phProps.phData) return null;
    const project = phProps.phData.metis;
    const source = phProps.phSource;
    const activeMetisScope = normalizeMetisScope(getWorkspaceSnapshotMeta(phProps.phUser)?.activeMetisScope);
    const metisScopeOptions = getMetisScopeOptions();
    const remoteUniverseBaseUrl =
        phProps.phFocus?.focusProj?.universeApiBaseUrl ||
        getWorkspaceSnapshotMeta(phProps.phUser)?.universeApiBaseUrl ||
        getDefaultRemoteUniverseBaseUrl();
    // const refresh = props.toggleRefresh;
    // const toggleRefresh = props.setRefresh;
    const [minimized, setMinimized] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [showRemoteUniverseModal, setShowRemoteUniverseModal] = useState(false);
    const [projectname, setProjectname] = useState(phProps.phFocus?.focusProj?.name);
    const [remoteUniverseBaseUrlInput, setRemoteUniverseBaseUrlInput] = useState(remoteUniverseBaseUrl);
    const [remoteUniverseIdInput, setRemoteUniverseIdInput] = useState(phProps.phFocus?.focusProj?.universeId || '');
    const [remoteUniverseList, setRemoteUniverseList] = useState<Array<{ slug: string; name?: string; kind?: string }>>([]);
    const [remoteUniverseLoading, setRemoteUniverseLoading] = useState(false);
    const [remoteUniverseError, setRemoteUniverseError] = useState('');

    const [isLeftDropdownOpen, setIsLeftDropdownOpen] = useState(false);
    const [isRightDropdownOpen, setIsRightDropdownOpen] = useState(false);
    const [activeItem, setActiveItem] = useState(null);
    const [activeRightItem, setActiveRightItem] = useState(null);
    const [isLeftHovered, setIsLeftHovered] = useState(false);
    const [isRightHovered, setIsRightHovered] = useState(false);
    const [hover, setHover] = useState(false);
    // const [exportTab, setExportTab] = useState(false);

    const handleRightItemClick = (item: any) => {
        setActiveRightItem(item);
    };

    if (debug) console.log('5 ProjectMenuBar', project.name, project, props);

    const projectModalRef = useRef(null);

    // const handleToggleDropdown = () => {
    // setIsLeftDropdownOpen(!isLeftDropdownOpen);
    // };

    const loadInitialProject = () => {
        dispatch(loadLegacyUniverseSnapshot(InitialState));
        dispatch({
            type: 'SET_FOCUS_REFRESH',
            data: { id: crypto.randomUUID(), name: 'InitialState' },
        });
        router.push('/modelling');
    };

    function handleItemClick(item: any) {
        // Check if the action is 'Open' or 'New'
        if (item === 'Open' || item === 'New') {
            // Ask the user to save before opening or creating new
            const userWantsToSave = window.confirm('Have you saved your current project? Click OK to proceed without saving, or Cancel to save first.');
            if (userWantsToSave) {
                setActiveItem(null);
                // router.push('/modelling'); // Navigate to the modelling page
            } else {
                setActiveItem(item);
            }
        }
    }

    const handleReadProjectFile = (e: any) => {
        if (!debug) console.log('82 handleReadProjectFile', e);
        ReadModelFromFile(phProps, dispatch, e);
        if (router.pathname !== '/modelling') {
            router.push('/modelling');
        }
    }

    const handleSaveAllToFile = () => {
        setProjectname(phProps.phFocus.focusProj.name);
        const data = `${projectname}_PR`
        dispatch(setUniverseSource(data))

        if (!debug) console.log('94 handleSaveAllToFile', phProps, projectname, phProps.phFocus)
        SaveAllToFile({ phData: phProps.phData, phFocus: phProps.phFocus, phSource: phProps.phSource, phUser: phProps.phUser }, projectname, '_PR')
    }

    const handleSaveToServer = async () => {
        try {
            const result = await saveRemoteUniverseProject({
                phData: phProps.phData,
                phFocus: phProps.phFocus,
                phSource: phProps.phSource,
                phUser: phProps.phUser,
            });
            const adaptedState = buildMimrisStateFromWorkspaceSnapshot(result.snapshot, {
                sourceName: result.snapshot?.focus?.project?.name || phProps.phFocus?.focusProj?.name || result.id,
                sourcePath: result.snapshot?.focus?.project?.file || phProps.phFocus?.focusProj?.file || result.id,
                universeId: result.id,
                universeApiBaseUrl: result.baseUrl,
            });
            dispatch(loadLegacyUniverseSnapshot(adaptedState));
            dispatch({ type: 'SET_FOCUS_REFRESH', data: { id: result.id, name: 'Server save' } });
            window.alert(`Saved remote universe ${result.id}`);
        } catch (error: any) {
            console.error('Error saving remote universe:', error);
            window.alert(error?.message || 'Unable to save remote universe.');
        }
    }

    const handleOpenServerProject = () => {
        setRemoteUniverseBaseUrlInput(remoteUniverseBaseUrl);
        setRemoteUniverseIdInput(phProps.phFocus?.focusProj?.universeId || '');
        setRemoteUniverseError('');
        setShowRemoteUniverseModal(true);
    }

    const handleMetisScopeChange = (nextScope: string) => {
        const meta = getWorkspaceSnapshotMeta(phProps.phUser);
        const snapshot = meta?.snapshot;
        if (!snapshot) return;

        const nextState = buildMimrisStateFromWorkspaceSnapshot(
            setActiveMetisScope(snapshot, nextScope),
            {
                sourceName: phProps.phFocus?.focusProj?.name || phProps.phSource,
                sourcePath: phProps.phFocus?.focusProj?.file || phProps.phSource,
                universeId: phProps.phFocus?.focusProj?.universeId || meta?.universeId,
                universeApiBaseUrl: phProps.phFocus?.focusProj?.universeApiBaseUrl || meta?.universeApiBaseUrl,
            },
        );

        dispatch(loadLegacyUniverseSnapshot(nextState));
    };

    const resolveRemoteUniverseBaseUrl = () => {
        try {
            return normalizeRemoteUniverseBaseUrl(remoteUniverseBaseUrlInput);
        } catch (error: any) {
            throw new Error(error?.message || 'Invalid remote universe base URL.');
        }
    };

    const handleLoadRemoteUniverseOptions = async () => {
        setRemoteUniverseLoading(true);
        setRemoteUniverseError('');
        try {
            const baseUrl = resolveRemoteUniverseBaseUrl();
            const response = await fetch(`/api/universe/library?baseUrl=${encodeURIComponent(baseUrl)}`);
            const { payload, text } = await readJsonResponse(response);
            if (!response.ok || payload?.error || !payload) {
                throw new Error(readJsonResponseError(response, payload, text, 'Unable to list remote universes.'));
            }
            setRemoteUniverseList(Array.isArray(payload?.universes) ? payload.universes : []);
        } catch (error: any) {
            setRemoteUniverseError(error?.message || 'Unable to list remote universes.');
            setRemoteUniverseList([]);
        } finally {
            setRemoteUniverseLoading(false);
        }
    }

    useEffect(() => {
        if (!showRemoteUniverseModal) return;
        handleLoadRemoteUniverseOptions();
    }, [showRemoteUniverseModal]);

    useEffect(() => {
        setRemoteUniverseBaseUrlInput(remoteUniverseBaseUrl);
    }, [remoteUniverseBaseUrl]);

    const openRemoteUniverseById = () => {
        const universeId = remoteUniverseIdInput.trim();
        if (!universeId) return;
        let baseUrl = '';
        try {
            baseUrl = resolveRemoteUniverseBaseUrl();
        } catch (error: any) {
            setRemoteUniverseError(error?.message || 'Invalid remote universe base URL.');
            return;
        }
        setShowRemoteUniverseModal(false);
        router.push(buildRemoteUniversePath(universeId, baseUrl));
    }

    const openRemoteUniverseBySlug = (slug: string) => {
        let baseUrl = '';
        try {
            baseUrl = resolveRemoteUniverseBaseUrl();
        } catch (error: any) {
            setRemoteUniverseError(error?.message || 'Invalid remote universe base URL.');
            return;
        }
        const query = new URLSearchParams({
            universeSlug: slug,
            universeApi: baseUrl,
        });
        setShowRemoteUniverseModal(false);
        router.push(`/model?${query.toString()}`);
    }

    const handleCloseModal = () => {
        const openFileModal = document.getElementById('openFileModal');
        if (openFileModal) {
            openFileModal.classList.remove('show');
            openFileModal.style.display = 'none';
        }
    }

    const fileInputRef = useRef<HTMLInputElement>(null); // Declare fileInputRef variable

    function handleOpenFile() {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    }

    const handleShowProjectModal = () => {
        if (minimized) {
            setMinimized(true);
        }
        setShowProjectModal(true);
    };
    
    const handleCloseProjectModal = () => setShowProjectModal(false);

    const handleSubmit = (details: any) => {
        props.onSubmit(details);
        // handleCloseProjectModal();
    };

    const projectModalDiv = (
        <Modal show={showProjectModal} onHide={handleCloseProjectModal}
            className={`projectModalOpen ${!projectModalOpen ? "d-block" : "d-none"}`} style={{ marginLeft: "200px", marginTop: "100px", backgroundColor: "#fee", zIndex: "9999" }} ref={projectModalRef}>
            <Modal.Header closeButton>GitHub Settings: </Modal.Header>
            <Modal.Body >
                <ProjectDetailsForm props={phProps} onSubmit={handleSubmit} />
            </Modal.Body>
            <Modal.Footer>
                <Button color="link" onClick={handleCloseProjectModal} >Exit</Button>
            </Modal.Footer>
        </Modal>
    );

    const remoteUniverseModalDiv = (
        <Modal
            show={showRemoteUniverseModal}
            onHide={() => setShowRemoteUniverseModal(false)}
            size="xl"
            centered
            scrollable
            style={{ zIndex: "9999" }}
        >
            <Modal.Header closeButton>
                <div>
                    <div className="fw-semibold">Open Remote Universe</div>
                    <div className="small text-muted">Browse a shared universe or open one directly by id.</div>
                </div>
            </Modal.Header>
            <Modal.Body>
                <div className="container-fluid px-0">
                    <div className="row g-3 mb-3">
                        <div className="col-12 col-lg-5">
                            <div className="border rounded-3 p-3 h-100 bg-light-subtle">
                                <label className="form-label fw-bold mb-2">Universe API</label>
                                <input
                                    className="form-control"
                                    value={remoteUniverseBaseUrlInput}
                                    onChange={(event) => setRemoteUniverseBaseUrlInput(event.target.value)}
                                    placeholder="http://localhost:3001"
                                />
                                <div className="small text-muted mt-2">
                                    Remote universes are loaded from this API endpoint. Change it if your shared universe server runs elsewhere.
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-lg-7">
                            <div className="border rounded-3 p-3 h-100">
                                <label className="form-label fw-bold mb-2">Open By Universe Id</label>
                                <div className="row g-2 align-items-start">
                                    <div className="col-12 col-md">
                                        <input
                                            className="form-control"
                                            value={remoteUniverseIdInput}
                                            onChange={(event) => setRemoteUniverseIdInput(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') openRemoteUniverseById();
                                            }}
                                            placeholder="universe_abc123"
                                        />
                                    </div>
                                    <div className="col-12 col-md-auto">
                                        <button className="btn btn-primary w-100 px-4" onClick={openRemoteUniverseById}>
                                            Open
                                        </button>
                                    </div>
                                </div>
                                <div className="small text-muted mt-2">
                                    Paste a known universe id to jump directly to that workspace.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-3 overflow-hidden">
                        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-light">
                            <div>
                                <div className="fw-bold">Remote Universe Library</div>
                                <div className="small text-muted">Select a published universe from the remote catalog.</div>
                            </div>
                            <button className="btn btn-sm btn-outline-secondary" onClick={handleLoadRemoteUniverseOptions}>
                                {remoteUniverseLoading ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>

                        {remoteUniverseError && (
                            <div className="alert alert-danger rounded-0 border-0 border-bottom mb-0">
                                {remoteUniverseError}
                            </div>
                        )}

                        <div style={{ maxHeight: "420px", overflowY: "auto", backgroundColor: "#f8fafc" }}>
                            {remoteUniverseLoading && (
                                <div className="px-3 py-4 text-muted">Loading universes...</div>
                            )}

                            {!remoteUniverseLoading && !remoteUniverseError && remoteUniverseList.length === 0 && (
                                <div className="px-3 py-4 text-muted">No remote universes found.</div>
                            )}

                            {!remoteUniverseLoading && remoteUniverseList.length > 0 && (
                                <div className="p-3 d-grid gap-2">
                                    {remoteUniverseList.map((item) => (
                                        <button
                                            key={item.slug}
                                            className="btn btn-light border rounded-3 text-start px-3 py-3"
                                            onClick={() => openRemoteUniverseBySlug(item.slug)}
                                        >
                                            <div className="d-flex justify-content-between align-items-start gap-3">
                                                <div className="min-w-0">
                                                    <div className="fw-bold text-dark text-truncate">
                                                        {item.name || item.slug}
                                                    </div>
                                                    <div className="small text-muted text-break">
                                                        {item.slug}
                                                        {item.kind ? ` • ${item.kind}` : ''}
                                                    </div>
                                                </div>
                                                <span className="small fw-semibold text-primary text-nowrap mt-1">
                                                    Open
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button color="link" onClick={() => setShowRemoteUniverseModal(false)}>Close</Button>
            </Modal.Footer>
        </Modal>
    );

    // const handleExpandDiv = () => {
    //     props.setExpanded(true);
    // };

    // const handleContractDiv = () => {
    //     props.setExpanded(false);
    //     // const timer = setTimeout(() => {
    //     //  setExpanded(false);
    //     // } , 20000);
    // };

    // const handleLeftMenuLeave = () => {
    //     setIsLeftDropdownOpen(false);
    //     setIsLeftHovered(false);
    // };

    // const handleRightMenuLeave = () => {
    //     setIsRightDropdownOpen(false);
    //     setIsRightHovered(false);
    // };

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (
            !target.closest('.bg-light') &&
            !target.closest('.fa-bars') &&
            !target.closest('.fa-ellipsis-v')
        ) {
            setIsLeftDropdownOpen(false);
            setIsLeftHovered(false);
            setIsRightDropdownOpen(false);
            setIsRightHovered(false);
        }
    };

    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const loadGitHub = <LoadGitHub buttonLabel=' Open Project File' className='ContextModal' ph={phProps} toggleRefresh={props.refresh} setRefresh={props.setRefresh} path='' />;
    const loadNewModelProject = <LoadNewModelProjectFromGitHub buttonLabel=' New Project' className='ContextModal' ph={phProps} refresh={props.toggleRefresh} setRefresh={props.setRefresh} />;
    const loadjsonfile = <LoadJsonFile buttonLabel='OSDU Import' className='ContextModal' ph={phProps} refresh={props.refresh} setRefresh={props.setRefresh} />
    const loadGitHubMetamodel = <LoadGitHub buttonLabel='Update Metamodel' className='ContextModal' ph={phProps} refresh={props.refresh} setRefresh={props.setRefresh} path='akm-metamodels' />;
    const loadfile = <LoadFile buttonLabel='Import/Export File' className='ContextModal' ph={phProps} refresh={props.refresh} setRefresh={props.setRefresh} />
    
    const reload = <span className="btn ps-auto mt-0 pt-1 text-dark w-100" onClick={props.setRefresh} data-toggle="tooltip" data-placement="top" title="Reload the model" > {props.refresh ? 'Reload models' : 'Reload models'} </span>
    const loadMimrisTemplates = <span className="btn ms-3 bg-light text-dark ps-auto mt-0 pt-1 " onClick={loadInitialProject} data-toggle="tooltip" data-placement="top" title="Load Mimris Modeller templates from Kavca/Equinor GitHub repo" > Mimris templates </span>;

    const loadFile = (
        <>
            <button
                className="btn rounded bg-light d-flex justify-content-start align-items-center text-dark px-1 my-0 py-0 pe-2 me-auto w-100"
                data-toggle="tooltip"
                data-placement="top"
                data-bs-html="true"
                title="Click here to Open a Project file from local file system"
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleOpenFile();
                }}
            >
                <i className="fa fa-folder fa-lg pe-2 me-4"></i>Open local file
            </button>
        </>
    )

    const saveFile = (
        <>
            <button
                className="btn btn-sm rounded bg-primary text-light w-100 px-2 d-flex justify-content-start align-items-center"
                data-toggle="tooltip"
                data-placement="top"
                data-bs-html="true"
                title="Click here to Save the Project file to the local file system"
                onClick={handleSaveAllToFile}
            >
                <i className="fa fa-save fa-lg pe-2"></i> Save to local file
            </button>
            <button
                className="btn btn-sm rounded bg-success text-light w-100 px-2 mt-2 d-flex justify-content-start align-items-center"
                data-toggle="tooltip"
                data-placement="top"
                data-bs-html="true"
                title="Save the current project to the remote shared universe API"
                onClick={handleSaveToServer}
            >
                <i className="fa fa-cloud-upload fa-lg pe-2"></i> Save remote universe
            </button>
            <button
                className="btn btn-sm rounded bg-light text-dark border w-100 px-2 mt-2 d-flex justify-content-start align-items-center"
                data-toggle="tooltip"
                data-placement="top"
                data-bs-html="true"
                title="Open a remote shared universe by universe id"
                onClick={handleOpenServerProject}
            >
                <i className="fa fa-cloud fa-lg pe-2"></i> Open remote universe
            </button>
        </>
    )

    function MenuItem({ item, activeItem, activeRightItem, handleItemClick }: { item: any, activeItem: any, activeRightItem: any, handleItemClick: (event: any) => void }) {
        const getItemContent = (item: any) => {
            switch (item) {
                case 'New':
                    return <div className="bg-secondary border rounded text-white ps-1"><i className="fa fa-folder fa-lg mx-1 mt-3"></i>{loadNewModelProject}</div>;
                case 'Open':
                    return <div className="bg-secondary border rounded text-white ps-1"><i className="fa fa-folder fa-lg mx-1 mt-3"></i>{loadGitHub}</div>;
                case 'Mimristemplates':
                    return <div className="bg-light border border-4 rounded "><i className="fa fa-folder fa-lg mx-1 mt-3"></i>{loadMimrisTemplates}</div>;
                case 'File':
                    return <div className="bg-light border border-4 rounded ">{loadFile}</div>;
                case 'Save':
                    return <div className="bg-light border border-4 rounded">{saveFile}</div>;
                case 'Metamodel':
                    return (
                        <details className="bg-secondary border rounded text-dark px-1">
                            <summary className="bg-light my-1 ps-1 text-dark ">File Import/Export</summary>
                            <div className="bg-secondary border border-2 rounded text-light" data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (import/export) from/to files">{loadfile}</div>
                            <div className="bg-secondary border border-2 rounded text-light"><i className="fa fa-folder fa-lg mx-1 ms-2 mt-3"></i>{loadGitHubMetamodel}</div>
                        </details>
                    );
                case 'Import':
                    return (
                        <>
                            <details className="bg-success border rounded text-white ps-1 pe-2">
                                <summary className="bg-success my-1 me-1 ps-1">OSDU Import/Export</summary>
                                <div className="bg-success border rounded border-warning ps-2 mb-1 me-"><i className="fa fa-house-tsunami me-2 ms-0"></i>{loadjsonfile}</div>
                                <button className="bg-success text-light text-start border rounded border-warning my-1 py-1 ps-2 mb-1 w-100" onClick={() => { props.setVisibleFocusDetails(true); props.setExportTab(2) }} style={{ background: hover ? 'red' : 'blue' }}>
                                    <i className="fa fa-house-tsunami me-2"></i>EXPORT CSV TO OSDU
                                </button>
                            </details>
                        </>
                    );
                default:
                    return null;
            }
        };

        const style = {
            backgroundColor: item === activeRightItem ? 'blue' : 'white',
        };

        return (
            <li className={`context-item border p-1 rounded-2 ${item === activeItem ? "active" : ""}`} key={item}>
                <div onClick={() => handleItemClick(item)} style={style}>
                    {getItemContent(item)}
                </div>
            </li>
        );
    }

    const dropLeftMenuDiv = (isLeftDropdownOpen || isLeftHovered) && (
        <div
            // onMouseLeave={handleLeftMenuLeave}
            className="bg-light rounded-2"
            style={{
                whiteSpace: "nowrap",
                position: "absolute",
                top: "36px",
                left: "-2px",
                width: "260px", //!isLeftDropdownOpen ? "5vw" : "16vw",
                height: "30vh",
                backgroundColor: "#b0cfcf",
                zIndex: "99",
            }}
        >
            <div className="context-item bg-white m-1">
                <strong className="bg-light text-success ps-2 fs-4 d-flex" style={{ whiteSpace: "nowrap" }}>
                    Mimris Modeller
                </strong>
                {/* {(isLeftDropdownOpen) && */}
                <div
                    className="d-flex justify-content-around p-1 m-0 w-100"
                    style={{ position: "relative", top: "-4px", left: "0px" }}
                >
                    <Link className="mb-" href="#">
                        <img
                            src="images/equinor-logo.svg"
                            width="110px"
                            height="40px"
                            className="d-inline-block align-top"
                            alt="Equinor logo"
                        />
                    </Link>
                </div>
                {/* } */}
            </div>
            <ul className="bg-light mx- rounded w-100">
                {["Open", "New", "Mimristemplates","File", "Save", "Import", "Metamodel"].map((item) => (
                    <MenuItem key={item} item={item} activeItem={activeItem} activeRightItem={activeRightItem} handleItemClick={handleItemClick} />
                ))}
            </ul>
            <div className='bg-light'>
                <hr className="bg-light py-1 my-0" />
                <div className="bg-light d-flex flex-wrap border border-2 rounded mx-1 ps-2 ">
                    GitHub Repo:
                    {(phProps.phFocus.focusProj?.org !== '' && phProps.phFocus.focusProj?.repo !== '' && phProps.phFocus.focusProj?.branch !== '') &&
                        <Link
                            className="text-primary ms-1"
                            href={buildGithubTreeHref(phProps.phFocus.focusProj)}
                            target="_blank"
                        >
                            {phProps.phFocus.focusProj?.repo}
                        </Link>
                    }
                </div>
                <div className="bg-light d-flex justify-content-between  border border-2 rounded mx-1 ps-2">
                    GitHub Project No. :
                    <Link
                        className="text-primary"
                        href={phProps.phFocus.focusProj?.org ? `https://github.com/orgs/${phProps.phFocus.focusProj?.org}/projects/${phProps.phFocus.focusProj?.projectNumber}` : "#"}
                        target="_blank"
                    >
                        <button className="text-primary border rounded bg-transparent px-5" >{phProps.phFocus.focusProj?.projectNumber} </button>
                    </Link>
                </div>
            </div>
        </div>
    );

    const dropRightMenuDiv = (isRightDropdownOpen || isRightHovered) &&
        <div className="bg-light "
            // onMouseLeave={handleRightMenuLeave}
            style={{
                whiteSpace: "nowrap", position: "absolute", top: "32px", right: "-12px", width: "18rem", height: "100%",
                backgroundColor: "#b0cfcf", zIndex: "99"
            }}
        >
            <ul className="bg-light p-1 mx-1 rounded">
                {['EditProjectDetails'].map((item, index) => (
                    <li className={`context-item m-1 p-1 rounded-2 ${item === activeRightItem ? 'active' : ''}`}
                        key={index}
                        style={{ whiteSpace: "nowrap", backgroundColor: item === activeRightItem ? 'blue' : 'white' }}
                    >
                        <div
                            onClick={() => handleRightItemClick(item)}
                            style={{ backgroundColor: "#ddd" }}
                        >
                            {(item === 'EditProjectDetails')
                                ? <div className="btn rounded m-1 p-1 bg-white text-secondary "
                                    style={{
                                        whiteSpace: "nowrap", width: "96%",
                                        textAlign: "left", padding: "0px 8px 0px 6px", margin: "0px"
                                    }}
                                    data-toggle="tooltip" data-placement="top" data-bs-html="true"
                                    title="Edit the Project details like the Project Name, GitHub Repository, Branch, File, etc."
                                    onClick={handleShowProjectModal} >
                                    <i className="fa fa-edit fa-lg"></i> Project Settings
                                </div>
                                : <></>
                            }
                        </div>
                    </li>
                ))}
            </ul>
        </div>

    const menubarDiv = (props.expanded)
        ? <>
            <div className="project-menu-bar d-flex justify-content-between align-items-center px-1 pt-1 pb-"
                style={{ backgroundColor: "#b0cfcf", transition: "height 1s ease-out" }}
            >
                <div className="d-flex justify-content-between align-items-center">
                    {/* <details className="mx-0 p-0"> <summary><i className="fa fa-ellipsis-h fa-lg"></i></summary>
                        <div className="bar-buttons" >
                            <span className="ms-1">{loadGitHub}</span>
                            <span className="ms-1">{loadNewModelProject}</span>
                            <span className="ms-1">{loadFile}</span>
                            <span className="ms-2">{saveFile}</span>
                        </div>
                    </details> */}
                    <div className="menu-buttons d-flex flex-wrap justify-content-end align-items-center ms-2">
                        <span className="context-item border rounded-2 " style={{ backgroundColor: "#ded" }}
                            data-toggle="tooltip" data-placement="top" data-bs-html="true"
                            title="Project Number in the GitHub Repository"
                        >
                            <span className="px-1">
                                Project : <span className="px-1">{phProps.phFocus.focusProj.name} </span>
                            </span>
                            <span className="px-2 py-0 rounded-pill"
                                style={{ backgroundColor: "#cfe6d5", fontSize: "0.72rem", letterSpacing: "0.01em" }}
                                title="Active Metis source"
                            >
                                {getMetisScopeLabel(activeMetisScope)}
                            </span>
                            <span
                                className="pe-1"
                                style={{ whiteSpace: "nowrap" }}
                            >
                                <Link
                                    className="text-primary"
                                    href={`https://github.com/orgs/${phProps.phFocus.focusProj.org}/projects/${phProps.phFocus.focusProj.projectNumber}`}

                                    target="_blank"
                                >
                                    <button className="px-2 text-primary border-light rounded" style={{ backgroundColor: "#efe" }} >
                                        no. {phProps.phFocus.focusProj.projectNumber}
                                    </button>
                                </Link>
                            </span>
                        </span>
                        <span className="context-item border rounded-2 " style={{ backgroundColor: "#ded", whiteSpace: "nowrap" }}
                            data-toggle="tooltip" data-placement="top" data-bs-html="true"
                            title="GitHub Repository name"
                        >
                            <span className="px-1">
                                Repo :
                            </span>
                            <span
                                className="pe-1"
                                style={{ whiteSpace: "nowrap" }}
                            >
                                {(phProps.phFocus.focusProj.org !== '' && phProps.phFocus.focusProj.repo !== '') &&
                                    <Link
                                        className="text-primary"
                                        href={buildGithubTreeHref(phProps.phFocus.focusProj)}
                                        target="_blank"
                                    >
                                        <button className="px-2 text-primary border-light rounded" style={{ backgroundColor: "#efe" }}> {phProps.phFocus.focusProj.repo} </button>
                                    </Link>
                                }
                            </span>
                        </span>
                        {/* <span className="px-1" style={{ backgroundColor: "#ded", whiteSpace: "nowrap" }}>{project.name}</span> */}
                        {/* <input id="project-name-input" className="project-name-input bg-light ps-1 border border-secondary rounded" type="text" placeholder="Project Name" value={project.name} /> */}
                        <span className="context-item border d-flex align-items-center rounded-2 mx-1" style={{ backgroundColor: "#ded", whiteSpace: "nowrap" }}>
                            <label className="ps-" style={{ backgroundColor: "#ded" }}>Branch:</label>
                            <span className="px-1 ms-1" style={{ backgroundColor: "#efe" }}
                                data-toggle="tooltip" data-placement="top" data-bs-html="true"
                                title="This is the Branch name in the GitHub Repository"
                            > {phProps.phFocus.focusProj.branch}</span>
                        </span>
                        <span className="context-item border d-flex align-items-center rounded-2 mx-1 px-1" style={{ backgroundColor: "#ded", whiteSpace: "nowrap" }}>
                            <label className="me-2 mb-0" title="Choose which Metis source to open and edit">Metis:</label>
                            <select
                                className="form-select form-select-sm"
                                style={{ minWidth: "220px", backgroundColor: "#efe" }}
                                value={activeMetisScope}
                                onChange={(event) => handleMetisScopeChange(event.target.value)}
                            >
                                {metisScopeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </span>
                    </div>
                </div>
                <div className="ms-auto d-flex justify-content-between align-items-top"
                    style={{
                        position: "relative",
                        top: "-12px",
                        // left: "0px",
                        right: "-58px",
                        height: "30px",
                        // width: "0%", // reduce width to 60%
                        transform: "scale(0.8)",
                        transition: "height 1s ease-in-out"
                    }}
                >

                    <div className="rounded-2 my-0 px-1"
                        style={{ whiteSpace: "nowrap" }}
                        onClick={() => props.setExpanded(!props.expanded)}
                    >
                        <i className="fa fa-arrow-up fa-sm"></i> Project-bar
                    </div>
                    <div
                        onClick={() => props.setFocusExpanded(!props.focusExpanded)}
                    >
                        <div className="ms-auto me-5 pe-5 rounded-2"
                            style={{ whiteSpace: "nowrap", position: "relative", top: "0px", right: "-4px", width: "22px", height: "2px", transition: "height 1s ease-in-out" }}
                        >
                            {(props.focusExpanded) ? <i className="fa fa-arrow-up fa-sm"></i> : <i className="fa fa-arrow-down fa-sm"></i>} Focus-bar
                        </div>
                    </div>
                    <div className="context-item border d-flex justify-content-end align-items-center rounded-2 mx-2 mt-3">
                        <label className="ps-1" style={{ backgroundColor: "#ded", padding: "2px 4px" }}>File:</label>
                        <span className="px-1 ms-1" style={{ backgroundColor: "#efe", whiteSpace: "nowrap" }}
                            data-toggle="tooltip" data-placement="top" data-bs-html="true"
                            title="This is the Project File name"
                        > {phProps.phFocus.focusProj.file}</span>
                    </div>
                </div>
            </div>
        </>
        :
        <>
            <div className="d-flex"
                style={{ backgroundColor: "#b0cfcf", transition: "height 1s ease-out" }}
                onClick={() => props.setExpanded(true)}
            >
                <div className="ms-auto me-5 mt-1 rounded-2"
                    style={{ whiteSpace: "nowrap", position: "relative", top: "-8px", right: "-58px", width: "22px", height: "7px", transform: "scale(0.8)", transition: "height 1s ease-in-out" }}
                >
                    {/* Project file: {props.phFocus.focusProj.file} */}
                </div>
                <div className="ms-auto me-5 px-1 rounded-2"
                    style={{ whiteSpace: "nowrap", position: "relative", top: "-5px", right: "345px", width: "22px", height: "2px", transform: "scale(0.8)", transition: "height 1s ease-in-out" }}
                >
                    <i className="fa fa-arrow-down fa-sm"></i> Project-bar
                </div>
                <div
                    onClick={() => props.setFocusExpanded(!props.focusExpanded)}
                >
                    <div className="ms-auto me-5 px-1 rounded-2"
                        style={{ whiteSpace: "nowrap", position: "relative", top: "-6px", right: "320px", width: "22px", height: "2px", transform: "scale(0.8)", transition: "height 1s ease-in-out" }}
                    >
                        {(props.focusExpanded) ? <i className="fa fa-arrow-up fa-sm"></i> : <i className="fa fa-arrow-down fa-sm"></i>} Focus-bar
                    </div>
                </div>
            </div>
        </>

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                style={{ display: 'none' }}
                onClick={(event) => {
                    event.currentTarget.value = '';
                }}
                onChange={(e) => {
                    handleReadProjectFile(e);
                }}
            />
            <div
                className={`project-menu-bar ${props.expanded ? 'expanded' : ''} context-item`}
                style={{
                    width: "10hw",
                    marginBottom: "-3px",
                }}
            >
                <div className="bar-menu-left bg-transparent"
                    style={{
                        position: "absolute",
                        top: "5px",
                        left: "5px",
                        padding: "1px",
                        zIndex: "99"
                    }}
                    onMouseEnter={() => setIsLeftHovered(true)}
                    // onMouseLeave={() => {
                    //     const timer = setTimeout(() => {
                    //         setIsLeftHovered(false)
                    //     }
                    //     , 5000); 
                    // }}
                    onClick={() => { setIsLeftHovered((isLeftDropdownOpen) && false), setIsLeftDropdownOpen(!isLeftDropdownOpen) }}
                >
                    <i className={`${isLeftDropdownOpen ? 'fa fa-bars fa-lg' : 'fa fa-bars bg-dark fa-lg'}`}></i>
                </div>
                <div style={{
                    position: "absolute",
                    top: "3px",
                    left: "3px",
                    // zIndex: "99",
                }}>{dropLeftMenuDiv}</div>

                <div className="bar-menu-right px-2 pt-1 pb-2 ps-4 bg-transparent"
                    style={{
                        position: "absolute",
                        top: "5px",
                        right: "8px",
                        zIndex: "999"
                    }}
                    onMouseEnter={() => setIsRightHovered(true)}
                    onMouseLeave={() => setIsRightHovered(false)}
                    onClick={() => setIsRightDropdownOpen(!isRightDropdownOpen)}
                >
                    <i className="fa fa-ellipsis-v fa-lg"></i>
                    <span className="bg-transparent mb- rounded p-1 ms-4 pe-2"
                        // type="button"
                        data-toggle="tooltip" data-placement="top" data-bs-html="true"
                        title={props.projName}
                        style={{
                            fontSize: "1rem", color: "gray", fontWeight: "normal", fontStretch: "condensed",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            position: "absolute",
                            top: "0px",
                            right: "28px",
                            padding: "14px",
                            maxWidth: "24vw",
                            direction: "rtl",
                            // zIndex: "99"
                        }}
                    >
                    </span>
                    {dropRightMenuDiv}
                </div>
                {menubarDiv}
            </div>
            <div className="modal fade" id="openFileModal" aria-labelledby="openFileModalLabel" aria-hidden="true">                {/* modal for open file */}
                {/* <div className="modal fade" id="openFileModal" tabIndex="-1" aria-labelledby="openFileModalLabel" aria-hidden="true"> */}
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="openFileModalLabel">Open Project File</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"
                                onClick={handleCloseModal}
                            ></button>
                        </div>
                        <div className="modal-body">
                            <div className="input text-primary" style={{ maxHeight: "32px", backgroundColor: "transparent" }} data-bs-toggle="tooltip" data-bs-placement="top" title="Choose a local Project file to load">
                                <input className="select-input" type="file" accept=".json" onChange={(e) => ReadModelFromFile(phProps, dispatch, e)} style={{ width: "580px" }} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal"
                                onClick={handleCloseModal}
                            >Close</button>
                        </div>
                    </div>
                </div>
                {projectModalDiv}
                {remoteUniverseModalDiv}
            </div>
        </>
    );
}
