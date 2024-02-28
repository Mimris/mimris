import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Modal, Button } from 'react-bootstrap';
import Link from 'next/link';

import { ReadModelFromFile } from '../utils/ReadModelFromFile';
import { SaveAllToFile } from '../utils/SaveModelToFile';
import LoadGitHub from './LoadGitHub';
import LoadFile from './LoadFile';
import LoadNewModelProjectFromGitHub from './LoadNewModelProjectFromGitHub';
import ProjectDetailsForm from "../forms/ProjectDetailsForm";
import { is } from 'cheerio/lib/api/traversing';

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
    const [projectname, setProjectname] = useState(props.props.phFocus.focusProj.name);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isRightDropdownOpen, setIsRightDropdownOpen] = useState(false);
    const [activeItem, setActiveItem] = useState(null);

    const handleItemClick = (item) => {
        setActiveItem(item);
    };

    if (debug) console.log('5 ProjectMenuBar', project.name, project, props);

    const projectModalRef = useRef(null);

    // const handleToggleDropdown = () => {
    //     setIsDropdownOpen(!isDropdownOpen);
    // };

    const handleReadProjectFile = (e: any) => {
        ReadModelFromFile(props.props, dispatch, e);
    }   

    const handleSaveAllToFile = () => {
        setProjectname(props.props.phFocus.focusProj.name);
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
        <Modal.Header closeButton>Set GitHub data: </Modal.Header>
        <Modal.Body >
            <ProjectDetailsForm props={props.props} onSubmit={handleSubmit} />
        </Modal.Body>
        <Modal.Footer>
            <Button color="link" onClick={handleCloseProjectModal} >Exit</Button>
        </Modal.Footer>
        </Modal>
    );

    // const handleExpandDiv = () => {
    //     props.setExpanded(true);
    // };

    const handleContractDiv = () => {
        props.setExpanded(false);
        // const timer = setTimeout(() => {
        //  setExpanded(false);
        // } , 20000);
    };

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (
            !target.closest('.bg-light') &&
            !target.closest('.fa-bars') &&
            !target.closest('.fa-ellipsis-v')
        ) {
            setIsDropdownOpen(false);
            setIsRightDropdownOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);



    const loadGitHub = <LoadGitHub buttonLabel='Open' className='ContextModal' ph={props.props} refresh={refresh} setRefresh={toggleRefresh} />;
    const loadNewModelProject =  <LoadNewModelProjectFromGitHub buttonLabel='New' className='ContextModal' ph={props} refresh={refresh} toggleRefresh={toggleRefresh} />;
    const loadfile = <LoadFile buttonLabel='Import/Export File' className='ContextModal' ph={props} refresh={refresh} setRefresh={toggleRefresh} />
 
    const loadFile = (
        <>
            <button
                className="btn rounded bg-light text-dark px-1 my-0 py-0 pe-2 me-auto"
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
        </>
    )
    const saveFile = (
        <>
            <button
                className="btn btn-sm rounded bg-light text-dark px-1 my-0 py-0 pe-2 ps- me-1"
                data-toggle="tooltip"
                data-placement="top"
                data-bs-html="true"
                title="Click here to Save the Project file to the local file system"
                onClick={handleSaveAllToFile}
                >
                <i className="fa fa-save"></i> Save
            </button>
        </>
    )

    const dropLeftMenuDiv =  (isDropdownOpen) &&
        <div className="bg-light p-1" 
        style={{ whiteSpace: "nowrap", position: "relative", top: "5px",left: "-10px", width: "12rem", height: "100%", backgroundColor: "#b0cfcf", zIndex: "9999"}}
        >
        <ul className="bg-light mx-1 rounded">
        {['Open', 'New', 'File', 'Save'].map((item, index) => (
            <li className="context-item border rounded-2"
            key={index}
            onClick={() => handleItemClick(item)}
            style={{ backgroundColor: item === activeItem ? 'blue' : 'white' }}
            >
            {item === 'Open' 
                ? <div className="bg-secondary rounded ">{loadGitHub} </div>
                : item === 'New'
                    ? <div className="bg-secondary rounded">{loadNewModelProject}</div>
                    : item === 'File'
                        ? <div className="bg-light rounded">{loadFile}</div>
                        : item === 'Save'
                        ? <div className="bg-light rounded">{saveFile}</div>
                        : item    
            }
            </li>
        ))}
        </ul> 
    </div>

    const dropRightMenuDiv =  (isRightDropdownOpen) &&
        <div className="bg-light rounded-2 p-1" 
        style={{ whiteSpace: "nowrap", position: "absolute", top: "32px", right: "-10px", width: "14rem",  backgroundColor: "#b0cfcf", zIndex: "9999"}}
        >
        <ul className="bg-light rounded">
            {['Edit Project Details', 'Import/Export', 'OSDU Import'].map((item, index) => (
                <li className="context-item d-flex justify-content-start align-items-center border rounded-2"
                    key={index}
                    onClick={() => handleItemClick(item)}
                    style={{ backgroundColor: item === activeItem ? 'blue' : 'white' }}
                >
                    {item === 'Edit Project Details' 
                        ?   <button className="btn rounded-2 bg-light text-secondary" 
                                style={{ whiteSpace: "nowrap", width: "100%", 
                                    textAlign: "left", padding: "0px 0px 0px 6px", margin: "0px"
                                }}
                                data-toggle="tooltip" data-placement="top" data-bs-html="true"
                                title="Edit the Project details like the Project Name, GitHub Repository, Branch, File, etc."
                                onClick={handleShowProjectModal} >
                                <i className="fa fa-edit fa-lg"> </i> Project Details
                            </button> 
                        : (item === 'Import/Export')
                            ?  <div className="bg-light rounded w-100 ">{loadfile}</div>
                            : (item === 'OSDU Import')  
                                ?   <button className="btn rounded-2 bg-primary text-light" 
                                    style={{ whiteSpace: "nowrap", width: "100%", 
                                        textAlign: "left", padding: "0px 0px 0px 6px", margin: "0px"
                                    }}
                                    data-toggle="tooltip" data-placement="top" data-bs-html="true"
                                    title="Edit the Project details like the Project Name, GitHub Repository, Branch, File, etc."
                                    onClick={handleShowProjectModal} >
                                    <i className="fa fa-file-import fa-lg"></i> OSDU JSON Import
                                </button>     
                                : item
                }
            </li>
        ))}
        </ul> 
    </div>


    const menubarDiv =   (props.expanded) 
        ?   <>
                <div className="bg-transparent p-1"
                    style={{ 
                        position: "absolute",     
                        top: "4px", 
                        left: "3px",
                        zIndex: "9999"
                     }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <i className="fa fa-bars fa-lg"></i>
                    {dropLeftMenuDiv}
                </div>
                <div className="bg-light"
                    style={{ 
                        position: "absolute",     
                        top: "6px", 
                        right: "18px",
                        zIndex: "999"
                     }}
                    onClick={() => setIsRightDropdownOpen(!isRightDropdownOpen)}
                >
                    <i className="fa fa-ellipsis-v fa-lg"></i>
                    {dropRightMenuDiv}
                </div>
                <div className="project-menu-bar d-flex justify-content-between align-items-center px-1 pt-1 pb-1" 
                    style={{ backgroundColor: "#b0cfcf", transition: "height 1s ease-out" }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="menu-buttons"
                            style={{  minWidth: "300px", whiteSpace: "nowrap"}}
                        >
                            <span className="ms-0">{loadGitHub}</span>
                            <span className="ms-1">{loadNewModelProject}</span>
                            {/* ><i className="fab fa-github fa-lg me-2 ms-0 "></i>GitHub</button> */}
                            {loadFile}
                            {saveFile}
                        </div>
                        <div className="menu-buttons d-flex flex-wrap justify-content-between align-items-center ms-2">
                            <span className="context-item border rounded-2 " style={{  backgroundColor: "#ded" }}
                                data-toggle="tooltip" data-placement="top" data-bs-html="true"
                                title="Project Number in the GitHub Repository"
                            >
                                <span className="px-1">
                                    Project : <span className="px-1">{props.props.phFocus.focusProj.name} </span>
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
                                        <button className="px-2 text-primary border-light rounded" style={{  backgroundColor: "#efe" }} >no. {props.props.phFocus.focusProj.projectNumber} </button>
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
                        </div>
                    </div>
                    <div className="ms-auto"
                        style={{  
                            position: "relative", 
                            top: "-10px", 
                            // left: "0px",
                            right: "-20px", 
                            height: "30px", 
                            // width: "0%", // reduce width to 60%
                            transform: "scale(0.8)", 
                            transition: "height 1s ease-in-out"  
                        }}
                        >
                        <div className="d-flex justify-content-end align-items-center rounded-2 my-0 px-1" 
                            onClick={() => props.setExpanded(false)}
                            >
                            <i className="fa fa-arrow-up fa-sm"></i> Menubar
                        </div>
                        <div className="context-item border d-flex justify-content-end align-items-center rounded-2 my-0">
                            <label className="ps-1" style={{ backgroundColor: "#ded", padding: "2px 4px" }}>File:</label>
                            <span className="px-1 ms-1" style={{ backgroundColor: "#efe", whiteSpace: "nowrap"}}
                                data-toggle="tooltip" data-placement="top" data-bs-html="true"
                                title="This is the Project File name"
                                > {props.props.phFocus.focusProj.file}</span>
                        </div>
                    </div>
                </div>
            </>
        :  
            <>
                <div className="bg-transparent p-1"
                    style={{ 
                        position: "absolute",     
                        top: "4px", 
                        left: "3px",
                        zIndex: "9999"
                     }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <i className="fa fa-bars fa-lg"></i>
                    {dropLeftMenuDiv}
                </div>
                <div className="bg-transparent p-1"
                    style={{ 
                        position: "absolute",     
                        top: "3px", 
                        right: "15px",
                        zIndex: "99999"
                    }}
                    onClick={() => setIsRightDropdownOpen(!isRightDropdownOpen)}
                    >
                    <i className="fa fa-ellipsis-v fa-lg"></i>
                    {dropRightMenuDiv}
                </div>
                <div 
                    onClick={() => props.setExpanded(true)}
                >
                    <div className="ms-auto me-5 pb-1 px-1 pt-0 rounded-2 mt-0" 
                        style={{ whiteSpace: "nowrap", position: "relative", top: "-5px", right: "20px", width: "22px",height: "7px", transform: "scale(0.8)", transition: "height 1s ease-in-out"}}
                    >
                        <i className="fa fa-arrow-left fa-sm"></i> Menubar
                    </div>
                </div>
            </>


    return (
        <>
            <div
                className={`project-menu-bar ${props.expanded ? 'expanded' : ''}`}
                style={{ backgroundColor: "#b0cfcf" }}
            >
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
            {projectModalDiv}
        </div>
        </>
    );
}
