import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Modal, Button } from 'react-bootstrap';
import Link from 'next/link';

import { ReadModelFromFile } from '../utils/ReadModelFromFile';
import { SaveAllToFile } from '../utils/SaveModelToFile';
import LoadGitHub from './LoadGitHub';
import LoadFile from './LoadFile';
import LoadJsonFile from './LoadJsonFile'
import LoadNewModelProjectFromGitHub from './LoadNewModelProjectFromGitHub';
import ProjectDetailsForm from "../forms/ProjectDetailsForm";
import { is } from 'cheerio/lib/api/traversing';
import { bottom } from '@popperjs/core';

const debug = false;

export const ProjectMenuBar = (props: any) => {
    if (debug) console.log('18 ProjectMenuBar', props);
    const dispatch = useDispatch();
    if (!props.phData) return null;
    const project = props.phData.metis;
    const source = props.phSource;
    // const refresh = props.toggleRefresh;
    // const toggleRefresh = props.setRefresh;
    const [minimized, setMinimized] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [projectname, setProjectname] = useState(props.phFocus.focusProj.name);

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

    const handleReadProjectFile = (e: any) => {
        ReadModelFromFile(props, dispatch, e);
    }

    const handleSaveAllToFile = () => {
        setProjectname(props.phFocus.focusProj.name);
        const data = `${projectname}_PR`
        dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data })
        if (!debug) console.log('57 handleSaveAllToFile', props, projectname, props.phFocus)
        SaveAllToFile({ phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser }, projectname, '_PR')
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
                <ProjectDetailsForm props={props} onSubmit={handleSubmit} />
            </Modal.Body>
            <Modal.Footer>
                <Button color="link" onClick={handleCloseProjectModal} >Exit</Button>
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

    const loadGitHub = <LoadGitHub buttonLabel=' Open Project File' className='ContextModal' ph={props} toggleRefresh={props.refresh} setRefresh={props.setRefresh} path='' />;
    const loadNewModelProject = <LoadNewModelProjectFromGitHub buttonLabel=' New Project' className='ContextModal' ph={props} refresh={props.toggleRefresh} setRefresh={props.setRefresh} />;
    const loadjsonfile = <LoadJsonFile buttonLabel='OSDU Import' className='ContextModal' ph={props} refresh={props.refresh} setRefresh={props.setRefresh} />
    const loadGitHubMetamodel = <LoadGitHub buttonLabel='Update Metamodel' className='ContextModal' ph={props} refresh={props.refresh} setRefresh={props.setRefresh} path='akm-metamodels' />;
    const loadfile = <LoadFile buttonLabel='Import/Export File' className='ContextModal' ph={props} refresh={props.refresh} setRefresh={props.setRefresh} />
    const reload = <span className="btn ps-auto mt-0 pt-1 text-dark w-100" onClick={props.setRefresh} data-toggle="tooltip" data-placement="top" title="Reload the model" > {props.refresh ? 'Reload models' : 'Reload models'} </span>

    function handleItemClick(item: any) {
        // Check if the action is 'Open' or 'New'
        if (item === 'Open' || item === 'New') {
            // Ask the user to save before opening or creating new
            const userWantsToSave = window.confirm('Have you save your current project? Click OK to proceed without saving, or Cancel to save first.');
            if (userWantsToSave) {
                setActiveItem(null);
            } else {
                setActiveItem(item);
            }
        }
    }

    const loadFile = (
        <>
            <button
                className="btn rounded bg-light d-flex justify-content-start align-items-center text-dark px-1 my-0 py-0 pe-2 me-auto w-100"
                data-toggle="tooltip"
                data-placement="top"
                data-bs-html="true"
                title="Click here to Open a Project file from local file system"
                onClick={() => fileInputRef.current?.click()}
            >
                <i className="fa fa-folder fa-lg pe-2 me-4"></i>Open local file
            </button>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => {
                    // Handle the selected file here
                    handleReadProjectFile(e);
                }}
            />
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
        </>
    )

    function MenuItem({ item, activeItem, activeRightItem, handleItemClick }: { item: any, activeItem: any, activeRightItem: any, handleItemClick: (event: any) => void }) {
        const getItemContent = (item: any) => {
            switch (item) {
                case 'New':
                    return <div className="bg-secondary border rounded text-white ps-1"><i className="fa fa-folder fa-lg mx-1 mt-3"></i>{loadNewModelProject}</div>;
                case 'Open':
                    return <div className="bg-secondary border rounded text-white ps-1"><i className="fa fa-folder fa-lg mx-1 mt-3"></i>{loadGitHub}</div>;
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
                    AKM Modeller
                </strong>
                {/* {(isLeftDropdownOpen) && */}
                <div
                    className="d-flex justify-content-around p-1 m-0 w-100"
                    style={{ position: "relative", top: "-4px", left: "0px" }}
                >
                    <Link className="mt-3 bg-transparent" href="http://www.kavca.no" target="_blank">
                        <div className="d-flex ms-1 justify-content-end align-items-baseline">
                            <img src="images/Kavca-logo2.png" width="18" height="18" className="" alt="Kavca logo" />
                            <span className="fw-bold fs-5" style={{ color: "#0083e2" }}>
                                avca AS
                            </span>
                        </div>
                    </Link>
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
                {["Open", "New", "File", "Save", "Import", "Metamodel"].map((item) => (
                    <MenuItem key={item} item={item} activeItem={activeItem} activeRightItem={activeRightItem} handleItemClick={handleItemClick} />
                ))}
            </ul>
            <div className='bg-light'>
                <hr className="bg-light py-1 my-0" />
                <div className="bg-light d-flex flex-wrap border border-2 rounded mx-1 ps-2 ">
                    GitHub Repo:
                    {(props.phFocus.focusProj.org !== '' && props.phFocus.focusProj.repo !== '' && props.phFocus.focusProj.branch !== '') &&
                        <Link
                            className="text-primary ms-1"
                            href={`https://github.com/${props.phFocus.focusProj.org}/${props.phFocus.focusProj.repo}/tree/${props.phFocus.focusProj.branch}/${props.phFocus.focusProj.path}`}
                            target="_blank"
                        >
                            {props.phFocus.focusProj.repo}
                        </Link>
                    }
                </div>
                <div className="bg-light d-flex justify-content-between  border border-2 rounded mx-1 ps-2">
                    GitHub Project No. :
                    <Link
                        className="text-primary"
                        href={`https://github.com/orgs/${props.phFocus.focusProj.org}/projects/${props.phFocus.focusProj.projectNumber}`}
                        target="_blank"
                    >
                        <button className="text-primary border rounded bg-transparent px-5" >{props.phFocus.focusProj.projectNumber} </button>
                    </Link>
                </div>
            </div>
        </div>
    );

    const dropRightMenuDiv = (isRightDropdownOpen || isRightHovered) &&
        <div className="bg-light "
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
                                Project : <span className="px-1">{props.phFocus.focusProj.name} </span>
                            </span>
                            <span
                                className="pe-1"
                                style={{ whiteSpace: "nowrap" }}
                            >
                                <Link
                                    className="text-primary"
                                    href={`https://github.com/orgs/${props.phFocus.focusProj.org}/projects/${props.phFocus.focusProj.projectNumber}`}

                                    target="_blank"
                                >
                                    <button className="px-2 text-primary border-light rounded" style={{ backgroundColor: "#efe" }} >
                                        no. {props.phFocus.focusProj.projectNumber}
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
                                {(props.phFocus.focusProj.org !== '' && props.phFocus.focusProj.repo !== '') &&
                                    <Link
                                        className="text-primary"
                                        href={`https://github.com/${props.phFocus.focusProj.org}/${props.phFocus.focusProj.repo}/tree/${props.phFocus.focusProj.branch}/${props.phFocus.focusProj.path}`}
                                        target="_blank"
                                    >
                                        <button className="px-2 text-primary border-light rounded" style={{ backgroundColor: "#efe" }}> {props.phFocus.focusProj.repo} </button>
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
                            > {props.phFocus.focusProj.branch}</span>
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
                        > {props.phFocus.focusProj.file}</span>
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
                                <input className="select-input" type="file" accept=".json" onChange={(e) => ReadModelFromFile(props, dispatch, e)} style={{ width: "580px" }} />
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
            </div>
        </>
    );
}
