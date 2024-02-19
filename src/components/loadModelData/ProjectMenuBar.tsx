import { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Modal, Button } from 'react-bootstrap';
import Link from 'next/link';

import { ReadModelFromFile } from '../utils/ReadModelFromFile';
import { SaveAllToFile } from '../utils/SaveModelToFile';
import LoadGitHub from './LoadGitHub';
import LoadNewModelProjectFromGitHub from './LoadNewModelProjectFromGitHub';
import ProjectDetailsForm from "../forms/ProjectDetailsForm";

const debug = false;

export const ProjectMenuBar = (props: any) => {
    if ((debug)) console.log('15 ProjectMenuBar', props);
    const dispatch = useDispatch();



    const project = props.props.phData.metis;
    const source = props.props.phSource;
    const refresh = props.props.refresh;
    const toggleRefresh = props.props.setRefresh;
    const [minimized, setMinimized] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [projectModalOpen, setProjectModalOpen] = useState(false);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [expanded, setExpanded] = useState(true);


    if (debug) console.log('5 ProjectMenuBar', project.name, project, props);

    const projectModalRef = useRef(null);

    const handleToggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleReadProjectFile = (e: any) => {
        ReadModelFromFile(props.props, dispatch, e);
    }   

    const handleSaveAllToFile = () => {
        const projectname = props.props.phData?.metis.name
        if (!debug) console.log('46 handleSaveAllToFile', props, projectname, props.props.phData, props.props.phFocus, props.props.phSource, props.props.phUser)
        SaveAllToFile({ phData: props.props.phData, phFocus: props.props.phFocus, phSource: props.props.phSource, phUser: props.props.phUser }, projectname, '_PR')
        const data = `${projectname}_PR`
        if ((!debug)) console.log('48 handleSaveAllToFile', data)
            dispatch({ type: 'LOAD_TO_STORE_PHSOURCE', data: data })
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

    const handleSubmit = (details) => {
        props.onSubmit(details);
        // handleCloseProjectModal();
    };

    const projectModalDiv = (
        <Modal show={showProjectModal} onHide={handleCloseProjectModal} 
        className={`projectModalOpen ${!projectModalOpen ? "d-block" : "d-none"}`} style={{ marginLeft: "200px", marginTop: "100px", backgroundColor: "#fee", zIndex:"9999" }} ref={projectModalRef}>
        <Modal.Header closeButton>Set Context: </Modal.Header>
        <Modal.Body >
            <ProjectDetailsForm props={props.props} onSubmit={handleSubmit} />
        </Modal.Body>
        <Modal.Footer>
            <Button color="link" onClick={handleCloseProjectModal} >Exit</Button>
        </Modal.Footer>
        </Modal>
    );

    const handleExpandDiv = () => {
        setExpanded(true);
    };

    const handleContractDiv = () => {
        setExpanded(false);
        // const timer = setTimeout(() => {
        //  setExpanded(false);
        // } , 20000);
    };

    const loadGitHub = <LoadGitHub buttonLabel='Open' className='ContextModal' ph={props.props} refresh={refresh} setRefresh={toggleRefresh} />;
    const loadNewModelProject =  <LoadNewModelProjectFromGitHub buttonLabel='New' className='ContextModal' ph={props} refresh={refresh} toggleRefresh={toggleRefresh} />;
        
    const menuArrowText =
        <div className="d-flex justify-content-end align-items-center me-2 pt-0" 
            style={{ height: "2px", transform: "scale(0.8)", transition: "height 1s ease-in-out" }} //,  maxWidth: "100px", lineHeight: "0.9" }}
            onClick={() => setExpanded(false)}
        >
            <i className="fa fa-arrow-up fa-sm pt-1 me-1"></i>
                Project menubar
        </div>;



    const menubarDiv =   (expanded) 
        ?   <>   
                <div className="project-menu-bar d-flex justify-content-between align-items-center px-1 pt-1 pb-0" 
                    style={{ height: "26px", backgroundColor: "#b0cfcf", transition: "height 1s ease-out" }}
                >
                    <div className="menu-buttons ">
                        <span className="ms-1">{loadGitHub}</span>
                        <span className="ms-1">{loadNewModelProject}</span>
                        {/* ><i className="fab fa-github fa-lg me-2 ms-0 "></i>GitHub</button> */}
                        <button
                            className="btn btn-sm rounded bg-light text-dark px-1 py-1 pe-2 ps- me-1"
                            data-toggle="tooltip"
                            data-placement="top"
                            data-bs-html="true"
                            title="Click here to Open a Project file from local file system"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <i className="fa fa-folder pe-1"></i>Open
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
                        <button className="btn btn-sm rounded bg-light text-dark px-1 py-1 pe-2 ps- me-1" 
                            data-toggle="tooltip" data-placement="top" data-bs-html="true"
                            title="Click here to Save the Project file to the local file system"
                            onClick={handleSaveAllToFile}><i className="far fa-save"></i> Save
                        </button>
                    </div>
                    <div className="menu-buttons d-flex justify-content-between align-items-center ms-2">
                        <span className="context-item border rounded-2 " style={{  backgroundColor: "#ded",whiteSpace: "nowrap"  }}
                            data-toggle="tooltip" data-placement="top" data-bs-html="true"
                            title="Project Number in the GitHub Repository"
                        >
                            <span className="px-1">
                            Project :
                            </span>
                            <span
                                className="pe-1"
                                style={{  whiteSpace: "nowrap"  }}
                                >
                                <Link
                                    className="text-primary"
                                    href={`https:/github.com/orgs/${props.props.phFocus.focusProj.org}/projects/${props.props.phFocus.focusProj.projectNumber}`}
                                    target="_blank"
                                >
                                    <button className="px-2 text-primary border-light rounded" style={{  backgroundColor: "#efe" }} > {props.props.phFocus.focusProj.projectNumber} </button>
                                </Link>
                            </span>
                        </span>
                        <span className="context-item border rounded-2 " style={{  backgroundColor: "#ded",whiteSpace: "nowrap"  }}
                            data-toggle="tooltip" data-placement="top" data-bs-html="true"
                            title="GitHub Repository name"
                        >
                            <span className="px-1">
                                Repo :
                            </span>
                            <span
                                className="pe-1"
                                style={{  whiteSpace: "nowrap"  }}
                                >
                                <Link
                                    className="text-primary"
                                    href={`https:/github.com/${props.props.phFocus.focusProj.org}/${props.props.phFocus.focusProj.repo}/tree/${props.props.phFocus.focusProj.branch}/${props.props.phFocus.focusProj.path}`}
                                    target="_blank"
                                >
                                    <button className="px-2 text-primary border-light rounded" style={{  backgroundColor: "#efe" }}> {props.props.phFocus.focusProj.repo} </button>
                                </Link>
                            </span>
                        </span>     
                        {/* <span className="px-1" style={{ backgroundColor: "#ded", whiteSpace: "nowrap" }}>{project.name}</span> */}
                        {/* <input id="project-name-input" className="project-name-input bg-light ps-1 border border-secondary rounded" type="text" placeholder="Project Name" value={project.name} /> */}
                        <span className="context-item border d-flex align-items-center rounded-2 mx-1" style={{  backgroundColor: "#ded", whiteSpace: "nowrap" }}>
                            <label className="ps-" style={{ backgroundColor: "#ded" }}>Branch:</label>
                            <span className="px-1 ms-1" style={{ backgroundColor: "#efe"}}
                                data-toggle="tooltip" data-placement="top" data-bs-html="true"
                                title="This is the Branch name in the GitHub Repository"
                            > {props.props.phFocus.focusProj.branch}</span>
                        </span>
                        <span className="context-item border d-flex align-items-center rounded-2 mx-1" style={{  backgroundColor: "#ded", whiteSpace: "nowrap" }}>
                            <label className="ps-" style={{ backgroundColor: "#ded" }}>File:</label>
                            <span className="px-1 ms-1" style={{ backgroundColor: "#efe"}}
                                data-toggle="tooltip" data-placement="top" data-bs-html="true"
                                title="This is the File name in the GitHub Repository"
                            > {props.props.phFocus.focusProj.file}</span>
                        </span>
                    </div>
                    <button className="button rounded mx-1 px-2 text-light me-auto" 
                        style={{backgroundColor: "steelblue", whiteSpace: "nowrap"}}
                        data-toggle="tooltip" data-placement="top" data-bs-html="true"
                        title="Edit the Project details like the Project Name, GitHub Repository, Branch, File, etc."
                        onClick={handleShowProjectModal} >
                        <i className="fa fa-edit text-light pe-1"></i>Project
                    </button>
                    {/* <button className="btn btn-sm menu-button me-3">Reload</button> */}
                </div>
                {/* modal for open file */}
                <div className="modal fade" id="openFileModal" aria-labelledby="openFileModalLabel" aria-hidden="true">
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
                                <input className="select-input" type="file" accept=".json" onChange={(e) => ReadModelFromFile(props.props, dispatch, e)} style={{ width: "580px" }} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal"
                                onClick={handleCloseModal}
                            >Close</button>
                        </div>
                    </div>
                </div>
                </div>
                {projectModalDiv}
                {menuArrowText}
            </>
        :   <div className="d-flex justify-content-end align-items-center ms-auto me-2 pt-0" 
                style={{ height: "2px", transform: "scale(0.8)", transition: "height 1s ease-in-out"}}
                onClick={() => setExpanded(true)}
            >
                <i className="fa fa-arrow-left fa-sm pt-1"></i>Project menubar
            </div>



    return (
        <>
            <div
                className={`project-menu-bar d-flex justify-content-between align-items-center p-1 pb-2 ${expanded ? 'expanded' : ''}`}
                style={{ backgroundColor: "#b0cfcf" }}
                // onMouseEnter={handleExpandDiv}
                // onMouseLeave={handleContractDiv}
                // onClick={handleContractDiv}
            >
                {menubarDiv}
            </div>
        </>
    );
}
