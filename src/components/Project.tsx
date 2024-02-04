import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router'
import Link from 'next/link';
import { Modal, Button } from 'react-bootstrap';import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from "rehype-raw";
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import StartInitStateJson from '../startupModel/AKM-INIT-Startup_PR.json';
// import StartCOREStateJson from '../startupModel/AKM-Start-CORE_PR.json';
// import StartIRTVStateJson from '../startupModel/AKM-Start-IRTV_PR.json';
// import StartOSDUStateJson from '../startupModel/AKM-Start-OSDU_PR.json';

// import ProjectDetailsModal from './modals/ProjectDetailsModal';
import ProjectDetailsForm from "./forms/ProjectDetailsForm";
import { setfocusRefresh } from '../actions/actions';
import ModellingHeaderButtons from "./utils/ModellingHeaderButtons";
import { get } from 'http';
// import { searchUser } from './githubServices/githubService';

// import { fetchIssues } from '../api/github';

const debug = false;

const Project = (props) => {
  if (debug) console.log('25 Tasks props', props.props.phData, props);
  
  const dispatch = useDispatch();

  const router = useRouter();
	const currentRoute = router.pathname;

  const containerRef = useRef(null);
  const modalRef = useRef(null);
  const projectModalRef = useRef(null);
  
  const [minimized, setMinimized] = useState(false);
  // const [maximized, setMaximized] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [issues, setIssues] = useState([]);
  const [projectFile, setProjectFile] = useState([]);
  const [comments, setComments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [refresh, setRefresh] = useState(false);
  // const [toggleRefresh, setToggleRefresh] = useState(false);


  const [org, setOrg] = useState(props.props.phFocus.focusProj?.org)
  const [repo, setRepo] = useState(props.props.phFocus.focusProj?.repo)
  const [path, setPath] = useState(props.props.phFocus.focusProj?.path)
  const [file, setFile] = useState(props.props.phFocus.focusProj?.file)
  const [branch, setBranch] = useState(props.props.phFocus.focusProj?.branch)
  const [focus, setFocus] = useState(props.props.phFocus.focusProj?.focus)
  const [ghtype, setGhtype] = useState(props.props.phFocus.focusProj?.ghtype)
  const [projectNumber, setProjectNumber] = useState(props.props.phFocus.focusProj?.projectNumber) // this is the project number in the list of github projects
  
  useEffect(() => {
  if (currentRoute === '/modelling') setMinimized(true);
  if (!debug) console.log('62 Project', currentRoute, minimized, props.props.phFocus.focusProj)
  }, []);
  
  if (debug) console.log('39 project', org, repo, path, file, branch, focus, ghtype, projectNumber)
  // const issueUrl = `https://api.github.com/repos/${org}/${repo}/˝`
  const issueUrl = `https://api.github.com/repos/${org}/${repo}/issues`
  const collabUrl = `https://api.github.com/repos/${org}/${repo}/collaborators`
  const projectUrl = `https://api.github.com/repos/${org}/${repo}/projects/${projectNumber}`
  const projectFileUrl = `https://api.github.com/repos/${org}/${repo}/contents/${path}/${file}?ref=${branch}`

  const handleMinimize = () => {
      setMinimized(true);
      // setMaximized(false);
  };

  const handleMaximize = () => {
      setMinimized(false);
      // setMaximized(true);
  };

  const handleSubmit = (details) => {
    props.onSubmit(details);
    handleCloseProjectModal();
  };

  const handleShowProjectModal = () => {
    if (minimized) {
      setMinimized(true);
    }
    setShowProjectModal(true);
  };

  const handleCloseProjectModal = () => setShowProjectModal(false);

  // if (minimized) {
  //   return (
  //       <div className="minimized-task " >
  //         <div 
  //           className="buttons position-absolute mt-1 ms-1 start-0" 
  //           // style={{ scale: "0.9", marginTop: "px", marginLeft: "-px"}}
  //         >
  //           <button
  //             className="btn bg-transparent text-success m-0 p-1"
  //             data-toggle="tooltip"
  //             data-placement="top"
  //             data-bs-html="true"
  //             title="Open Project!"
  //             onClick={handleMaximize}
  //           >
  //             <span className="fs-6"><i className="fa fa-lg fa-angle-right pull-right-container"></i>  Project</span>
  //           </button>
  //         </div>
  //       </div>
  //     );
  // }

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


  const modellingButtonsDiv = 
    <>
      <ModellingHeaderButtons props= {props}  />
    </>

  return (
      <div className="project p-1" 
        ref={containerRef}
        style={{height: "100%", backgroundColor: "#eef", borderRadius: "5px 5px 5px 5px"}}
      >
      {/* <div className="project p-1" 
        ref={containerRef}
        style={{height: "100%", width: "25rem", backgroundColor: "#eef", borderRadius: "5px 5px 5px 5px",
        position: "absolute", top: "50%", left: "0%", transform: "translate(-0%, -50%)", zIndex: 9999 }}
      > */}
      {/* <div className="p-2 d-flex justify-content-between">
        {(refresh) ? <> {modellingButtonsDiv} </> : (<>{modellingButtonsDiv}</>)}
      </div> 
      {/* <div className="issueslist p-1" style={{ backgroundColor: "lightyellow", width: "26rem", position: "absolute", height: "94%", top: "50%", right: "0%", transform: "translate(-0%, -45%)", zIndex: 9999 }}> */}
      <div className="header d-flex justify-content-between align-items-center border-bottom border-success mb-2"
        // style={{ position: "relative",  height: "100%", top: "44%", right: "0%", transform: "translate(-1%, -10%)", overflow: "hidden", zIndex: 9999 }}
        >
        {/* <div className="buttons me-1 float-start" style={{ transform: "scale(0.9)"}}> */}
          {/* <button 
            className="btn text-success me-0 px-1 py-0 btn-sm bg-light" 
            data-toggle="tooltip" data-placement="top" data-bs-html="true"
            title="Close Task pane!"
            onClick={handleMinimize} 
            >
              <span className="fs-8"><i className="fa fa-lg fa-angle-left pull-left-container"></i>  Project </span>
          </button> */}
          <span className="fs-4 text-success px-2">Active Project (current) </span>
            { (currentRoute === '/') &&
              <div className="d-flex justify-content-between align-items-center me-2">
                <button className="button rounded m-1 px-2 text-light" 
                  style={{backgroundColor: "steelblue", whiteSpace: "nowrap"}}
                  onClick={handleShowProjectModal} >
                  Edit Project Details
                </button>
              </div>
            } 
        {/* </div> */}
      </div>        
      <div className="row">
        <div className="col">
          <div className="my-1 px-1 fs-6">Name:</div>
          <div className="my-1 px-1 fs-6">Description:</div>
          <div className="my-1 px-1 fs-6">GitHub Proj. no.:</div>
          <div className="my-1 px-1 fs-6">Repository:</div>
          <div className="my-1 px-1 fs-6">GitHub Path:</div>
          <div className="my-1 px-1 fs-6">GitHub Branch:</div>
          <div className="my-1 px-1 fs-6">GitHub File:</div>
        </div>
        <div className="col-8"> {/* Updated: Set the column width to col-8 */}
          <div className="my-1 px-1 fs-6" style={{backgroundColor: "#eff"}}> {props.props.phData.metis.name}</div>
          <div className="my-1 px-1 fs-6" style={{backgroundColor: "#eff"}}> {props.props.phData.metis.description}</div>
          <div className="my-1 px-1 fs-6" style={{backgroundColor: "#eff"}}> {props.props.phFocus.focusProj.projectNumber}</div>
          <div className="my-1 px-1 fs-6" style={{backgroundColor: "#eff"}}> {props.props.phFocus.focusProj.repo ||'Add repo-name (Edit Project Details above)'}</div>
          <div className="my-1 px-1 fs-6" style={{backgroundColor: "#eff"}}> {(props.props.phFocus.focusProj.path) ? props.props.phFocus.focusProj.path : '/'}</div>
          <div className="my-1 px-1 fs-6" style={{backgroundColor: "#eff"}}> {props.props.phFocus.focusProj.branch}</div>
          <div className="my-1 px-1 fs-6" style={{backgroundColor: "#eff"}}> {props.props.phFocus.focusProj.file}</div>
        </div>
      </div>

      <div className="mx-3 my-3">
        (Click Edit Project Details above to change the project details.)
      </div>

      <hr className="mt-5 bg-success" style={{ height: "4px" }} />
      <details className="m-1 p-1"  style={{backgroundColor: "#eee"}}><summary>GitHub links</summary>
        <div className="aside-left fs-6 m-1 p-2 " style={{ backgroundColor: "transparent", borderRadius: "5px 5px 5px 5px" }} >
            <div className='bg-light my-1 px-2 '> 
              <div className='text-muted'>Repository :</div>
              {(repo) && <Link className='text-primary ' href={`https:/github.com/${org}/${repo}`} target="_blank"> {org}/{repo}</Link>}
            </div>
            <div className='bg-light my-1 px-2'> 
              <div className='text-muted'>GitHub Docs :</div>
              {(repo) && <Link className='text-primary ' href={`https:/${org}.github.io/${repo}`} target="_blank"> {repo}</Link>}
            </div>

            <div className='bg-light my-1 px-2'> 
              <div className='text-muted'>Project Canban for this repo:</div>
              {(org) && <Link className='text-primary ' href={`https:/github.com/orgs/${org}/projects/${projectNumber}`} target="_blank"> {org}/{repo}/project/{projectNumber}</Link>}
            </div>
        </div>
      </details>
      {projectModalDiv}
    </div>
  );
  return null;
};

export default Project;
