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

const debug = false;

export const ProjectMenuBar = (props: any) => {
    if (!debug) console.log('18 ProjectMenuBar', props);
    const dispatch = useDispatch();

    const project = props.props.phData.metis;
    const source = props.props.phSource;
    // const refresh = props.props.toggleRefresh;
    // const toggleRefresh = props.props.setRefresh;
    const [minimized, setMinimized] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [projectname, setProjectname] = useState(props.props.phFocus.focusProj.name);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isRightDropdownOpen, setIsRightDropdownOpen] = useState(false);
    const [activeItem, setActiveItem] = useState(null);
    const [activeRightItem, setActiveRightItem] = useState(null);   

    const handleItemClick = (item) => {
        setActiveItem(item);
    };

    const handleRightItemClick = (item) => {
        setActiveRightItem(item);
    };  

    if (debug) console.log('5 ProjectMenuBar', project.name, project, props);

    const projectModalRef = useRef(null);

    // const handleToggleDropdown = () => {
    // setIsDropdownOpen(!isDropdownOpen);
    // };

    const handleReadProjectFile = (e: any) => {
        ReadModelFromFile(props.props, dispatch, e);
    }   

    const handleSaveAllToFile = () => {
        setProjectname(props.props.phFocus.focusProj.name);
        const data = `${projectname}_PR`
        dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data })
        if (!debug) console.log('57 handleSaveAllToFile', props, projectname, props.props.phFocus)
        SaveAllToFile({ phData: props.props.phData, phFocus: props.props.phFocus, phSource: props.props.phSource, phUser: props.props.phUser }, projectname, '_PR')
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

    const loadGitHub = <LoadGitHub buttonLabel='Open GitHub file' className='ContextModal' ph={props.props} refresh={props.toggleRefresh} setRefresh={props.toggleRefresh} />;
    const loadNewModelProject =  <LoadNewModelProjectFromGitHub buttonLabel='New from Template' className='ContextModal' ph={props} refresh={props.toggleRefresh} toggleRefresh={props.toggleRefresh} />;
    const loadfile = <LoadFile buttonLabel='Import/Export File' className='ContextModal' ph={props} refresh={props.toggleRefresh} setRefresh={props.toggleRefresh} />
    const loadjsonfile = <LoadJsonFile buttonLabel='OSDU JSON Import' className='ContextModal' ph={props} refresh={props.toggleRefresh} setRefresh={props.toggleRefresh} />
    const reload = <span className="btn ps-auto mt-0 pt-1 text-dark w-100" onClick={props.setToggleRefresh} data-toggle="tooltip" data-placement="top" title="Reload the model" > {props.toggleRefresh ? 'Reload models' : 'Reload models'} </span>

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
                <i className="fa fa-folder fa-lg pe-1"></i>Open local file
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
                <i className="fa fa-save fa-lg"></i> Save to local file
            </button>
        </>
    )

    const dropLeftMenuDiv =  (isDropdownOpen) &&
        <div className="bg-light rounded-2 p-1" 
        style={{ whiteSpace: "nowrap", position: "relative", top: "5px",left: "-10px", width: "20rem", height: "100%", 
            backgroundColor: "#b0cfcf", zIndex: "9"}}
        >
            <ul className="bg-light mx-1 rounded">
                {['Open', 'New', 'File', 'Save'].map((item, index) => (
                    <li className={`context-item border p-1 rounded-2 ${item === activeItem ? 'active' : ''}`}
                    key={index}
                    >
                    <div onClick={() => handleItemClick(item)}
                        style={{ backgroundColor: item === activeRightItem ? 'blue' : 'white' }}
                    >
                        {item === 'Open' 
                            ?  <div className="bg-secondary rounded text-white"><i className="fa fa-folder fa-lg mx-1 mt-3"></i>{loadGitHub}</div>
                            : item === 'New'
                                ? <div className="bg-secondary rounded text-white"><i className="fa fa-folder fa-lg mx-1 mt-3"></i>{loadNewModelProject}</div>
                                : item === 'File'
                                    ? <div className="bg-light rounded ">{loadFile}</div>
                                    : item === 'Save'
                                    ? <div className="bg-light rounded ">{saveFile}</div>
                                    : item    
                        }
                    </div>
                    </li>
                ))}
            </ul>
    </div>

    const dropRightMenuDiv =  (isRightDropdownOpen) &&
        <div className="bg-light " 
            style={{ whiteSpace: "nowrap", position: "absolute", top: "32px", right: "-12px", width: "16rem", height: "100%", 
            backgroundColor: "#b0cfcf", zIndex: "99"}}
        >
            <ul className="bg-light mx-1 rounded">
                {['EditProjectDetails', 'Import/Export', 'OSDU Import', 'Reload models'].map((item, index) => (
                <li className={`context-item border p-1 rounded-2 ${item === activeItem ? 'active' : ''}`}
                    key={index}
                    >
                    <div
                        onClick={() => handleRightItemClick(item)}
                        style={{ backgroundColor: item === activeRightItem ? 'blue' : 'white' }}
                    >
                        {(item === 'EditProjectDetails') 
                            ?   <div className="btn rounded-2 m-1 bg-light text-secondary" 
                                    style={{ whiteSpace: "nowrap", width: "100%", 
                                    textAlign: "left", padding: "0px 0px 0px 6px", margin: "0px"
                                    }}
                                    data-toggle="tooltip" data-placement="top" data-bs-html="true"
                                    title="Edit the Project details like the Project Name, GitHub Repository, Branch, File, etc."
                                    onClick={handleShowProjectModal} >
                                    <i className="fa fa-edit fa-lg"> </i> Project Details
                                </div> 
                            : (item === 'Import/Export')
                                ? <div className="bg-light rounded w-100 "> {loadfile}</div>     
                                : (item === 'OSDU Import')
                                    ? <div className="bg-light rounded w-100"> {loadjsonfile}</div>
                                    // : (item === 'Reload models')
                                    //     ? <div className="bg-light rounded w-100">{reload} </div> //{props.setToggleRefresh(!toggleRefresh)}</div>
                                        : <> more to come</>
                        }
                    </div>
                </li>
            ))}
            </ul> 
        </div>

    const menubarDiv =   (props.expanded) 
        ?   <>
                <div className="bar-menu-left bg-transparent p-1"
                    style={{ 
                        position: "absolute",     
                        top: "4px", 
                        left: "3px",
                        zIndex: "999"
                     }}
                    onClick={() => setIsDropdownOpen(true)}
                >
                    <i className="fa fa-bars fa-lg"></i>
                    {dropLeftMenuDiv}
                </div>
                 <div className="bar-menu-right px-2" 
                    style={{ 
                        position: "absolute",     
                        top: "6px", 
                        right: "8px",
                        zIndex: "999"
                     }}
                    onClick={() => setIsRightDropdownOpen(true)}
                >
                    <i className="fa fa-ellipsis-v fa-lg"></i>
                    {dropRightMenuDiv}
                </div>

                <div className="project-menu-bar d-flex justify-content-between align-items-center px-1 pt-1 pb-1" 
                    style={{ backgroundColor: "#b0cfcf", transition: "height 1s ease-out" }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <details className="mx-0 p-0"> <summary><i className="fa fa-ellipsis-h fa-lg"></i></summary>
                            <div className="bar-buttons" >
                                <span className="ms-1">{loadGitHub}</span>
                                <span className="ms-1">{loadNewModelProject}</span>
                                {/* ><i className="fab fa-github fa-lg me-2 ms-0 "></i>GitHub</button> */}
                                <span className="ms-1">{loadFile}</span>
                                <span className="ms-2">{saveFile}</span>
                            </div>
                        </details>
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
                    <div className="ms-auto d-flex justify-content-between align-items-top"
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
                        <div className="context-item border d-flex justify-content-end align-items-center rounded-2 mx-2 mt-4">
                            <label className="ps-1" style={{ backgroundColor: "#ded", padding: "2px 4px" }}>File:</label>
                            <span className="px-1 ms-1" style={{ backgroundColor: "#efe", whiteSpace: "nowrap"}}
                                data-toggle="tooltip" data-placement="top" data-bs-html="true"
                                title="This is the Project File name"
                                > {props.props.phFocus.focusProj.file}</span>
                        </div>
                        <div className="d-fle justify-content-end align-items-top rounded-2 my-0 px-1" 
                            style={{ whiteSpace: "nowrap"}}
                            onClick={() => props.setExpanded(!props.expanded)}
                            >
                            <i className="fa fa-arrow-up fa-sm"></i> Project-bar
                        </div>
                        <div 
                            onClick={() => props.setFocusExpanded(!props.focusExpanded)}
                        >
                            <div className="ms-auto me-5 px-1 rounded-2" 
                                style={{ whiteSpace: "nowrap", position: "relative", top: "0px", right: "-4px", width: "22px", height: "2px", transition: "height 1s ease-in-out"}}
                            >
                                <i className="fa fa-arrow-down fa-sm"></i> Focus-bar
                            </div>
                        </div>
                    </div>
                </div>
            </>
        :  
            <>
                <div className="bar-menu-left bg-transparent p-1"
                    style={{ 
                        position: "absolute",     
                        top: "4px", 
                        left: "3px",
                        zIndex: "99"
                     }}
                    onClick={() => setIsDropdownOpen(true)}
                >
                    <i className="fa fa-bars fa-lg"></i>
                    {dropLeftMenuDiv}
                </div>
                <div className="bar-menu-right px-2"
                    style={{ 
                        position: "absolute",     
                        top: "6px", 
                        right: "8px",
                        zIndex: "999"
                    }}
                    onClick={() => setIsRightDropdownOpen(true)}
                    // onClick={() => setIsRightDropdownOpen(!isRightDropdownOpen)}
                    >
                    <i className="fa fa-ellipsis-v fa-lg"> </i> 
                    {dropRightMenuDiv}
                </div>
                <div className="d-flex"
                    onClick={() => props.setExpanded(true)}
                >
                    <div className="ms-auto me-5 mt-1 rounded-2" 
                        style={{ whiteSpace: "nowrap", position: "relative", top: "-8px", right: "0px", width: "22px", height: "2px", transform: "scale(0.8)", transition: "height 1s ease-in-out"}}
                    >
                        Project file: {props.props.phFocus.focusProj.file}
                    </div>             
                    <div className="ms-auto me-5 px-1 rounded-2" 
                        style={{ whiteSpace: "nowrap", position: "relative", top: "-5px", right: "120px", width: "22px", height: "2px", transform: "scale(0.8)", transition: "height 1s ease-in-out"}}
                    >
                        <i className="fa fa-arrow-down fa-sm"></i> Project-bar
                    </div>
                </div>
                <div 
                    onClick={() => props.setFocusExpanded(!props.focusExpanded)}
                >
                    <div className="ms-auto me-5 px-1 rounded-2" 
                        style={{ whiteSpace: "nowrap", position: "relative", top: "-11px", right: "20px", width: "22px", height: "2px", transform: "scale(0.8)", transition: "height 1s ease-in-out"}}
                    >
                        {(props.focusExpanded) ? <i className="fa fa-arrow-up fa-sm"></i> : <i className="fa fa-arrow-down fa-sm"></i>} Focus-bar
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
