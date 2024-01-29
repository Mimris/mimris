import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router'
import Link from 'next/link';
import { Modal, Button } from 'react-bootstrap';
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

// import { fetchIssues } from '../api/github';

const debug = false;

const Issues = (props) => {
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
  const [project, setProject] = useState([]);
  const [comments, setComments] = useState([]);
  // const [showModal, setShowModal] = useState(false);
  
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
  }, []);
  
  if (debug) console.log('39 project', org, repo, path, file, branch, focus, ghtype, projectNumber)
  // const issueUrl = `https://api.github.com/repos/${org}/${repo}/˝`
  const issueUrl = `https://api.github.com/repos/${org}/${repo}/issues`
  // fetch done issues
  const issueUrlDone = `https://api.github.com/repos/${org}/${repo}/issues?state=closed`   
  const collabUrl = `https://api.github.com/repos/${org}/${repo}/collaborators`
  const projectUrl = `https://api.github.com/repos/${org}/${repo}/projects/${projectNumber}`
  const projectFileUrl = `https://api.github.com/repos/${org}/${repo}/contents/${path}/${file}?ref=${branch}`

    const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        handleMinimize();
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleMinimize = () => {
      setMinimized(!minimized);
      // setMaximized(false);
  };

  const handleMaximize = () => {
      setMinimized(false);
      // setMaximized(true);
  };

  // get the project object from github
  const fetchProject = async (url) => {
    try {
      if (debug) console.log('75 project fetch', url)
      const res = await fetch(url);
      const data = await res.json();
      if (!debug) console.log('105 project', res, data)
      if (data.length === 0) { // if there is an error
        console.error('Error fetching project:', data.message);
        setProject([]);
      } else {
        setProject(data);
      }
      if (debug) console.log('58 project', data)
      if (debug) console.log('59 project', project)
    } catch (error) {
      console.error('Error fetching project:', error);
    }
    if (debug) console.log('72 project', project)
  }

useEffect(() => {
  const curProject = fetchProject(projectUrl)
  if (!debug) console.log('75 project', curProject)
  //find the Issue status in the project

}, [props.props.phFocus.focusIssue?.id])  


  // list issues form github
  const fetchIssues = async (url) => {
    try {
      if (debug) console.log('75 issues fetch', url)
      const res = await fetch(url);
      const data = await res.json();
      if (!debug) console.log('105 issues', res, data)
      if (data.length === 0) { // if there is an error
        console.error('Error fetching issues:', data.message);
        setIssues([]);
      } else {
        setIssues(data);
      }
      if (debug) console.log('58 issues', data)
      if (debug) console.log('59 issues', issues)

      if (issues.length > 0) {
        issues.map(async (issue) => {
          const res = await fetch(issue.comments_url);
          const data = await res.json();
          if (debug) console.log('67 comments', res, data)
          if (data.length === 0) { // if there is an error
            console.error('Error fetching comments:', data.message);
            setComments([]);
          } else {
            setComments((comments) => [...comments, data]);
          }
          if (debug) console.log('71 comments', data)
        })
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
    if (debug) console.log('72 comments', issues)
  }


  const handleSubmit = (details) => {
    props.onSubmit(details);
    handleCloseModal();
  };


  const handleShowModal = () => {
    if (minimized) {
      setMinimized(true);
    }
    setShowModal(true);
  };
  
  const handleCloseModal = () => setShowModal(false);



  const handleShowProjectModal = () => {
    if (minimized) {
      setMinimized(true);
    }
    setShowProjectModal(true);
  };

  const handleCloseProjectModal = () => setShowProjectModal(false);


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

  const modalDiv = (
    <Modal  show={showModal} onHide={handleCloseModal} ref={modalRef} className={`modal ${!modalOpen ? "d-block" : "d-none"}`} style={{ marginRight: "0px", backgroundColor: "#fee"}} >
      <Modal.Header closeButton>
        <Modal.Title>Issue in focus:</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-transparent"  style={{ overflowY: 'scroll', maxHeight: '80vh' }}>
        {/* <div className='bg-light p-2 m-0'> 
          {(project.length > 0)
            ? project?.map((proj) => (proj.number === props.props.phFocus.focusProj?.projectNumber) && (
              <div key={proj.number}>
                <Link className='text-primary fs-4' href={`https:/github.com/${org}/${repo}/projects/${proj.number}`} target="_blank" style={{ textDecoration: 'underline' }}>
                  {proj.number}, {proj.name}
                </Link> <br />
                User login: {proj.user.login} <br />
                State: {proj.state} <br />
                Status: {proj.state.status} <br />
                Created: {proj.created_at.slice(0, 10)} <br />
                Updated: {proj.updated_at.slice(0, 10)} <br />
                Closed: {proj.closed_at?.slice(0, 10)} <br />
                <div className="bg-white border border-secondary p-2">
                  Details:
                  <ReactMarkdown plugins={[remarkGfm, rehypeSlug]}>{proj.body}</ReactMarkdown>
                </div>
                <>
                  <hr />
                  <h6 className="border" >Open Project on GitHub!</h6>
                  <Link className='text-primary ' href={`https:/github.com/${org}/${repo}/projects/${proj.number}`} target="_blank">{org}/{repo}/projects/{proj.number}</Link>
                </>
              </div>
              ))
            : <div className='text-muted'>Unable to get project for this repo!</div>
          }      */}
      
        <div className='bg-light p-2 m-0'>
          {(issues.length > 0) 
            ? issues?.map((issue) => (issue.number === props.props.phFocus.focusIssue?.id) && (   
              <div key={issue.number}>
                <Link className='text-primary fs-4' href={`https:/github.com/${org}/${repo}/issues/${issue.number}`} target="_blank" style={{ textDecoration: 'underline' }}>
                  {issue.number}, {issue.title}
                </Link> <br />
                User login: {issue.user.login} <br />
                Assignee: {issue.assignees[0]?.login}  <br />      
                State: {issue.state} <br />
                Status: {issue.state.status} <br />
                Created: {issue.created_at.slice(0, 10)} <br />      
                Updated: {issue.updated_at.slice(0, 10)} <br />
                Closed: {issue.closed_at?.slice(0, 10)} <br />
                Labels: {issue.labels.map((label) => (label.name))} <br />
                <div className="bg-white border border-secondary p-2">
                  Details:
                  <ReactMarkdown plugins={[remarkGfm, rehypeSlug]}>{issue.body}</ReactMarkdown>
                </div>
                Comments: {comments.map((comment) => (comment.map((c) => (c.issue_url === issue.comments_url) && (c.body))))} <br />

                {/* Body:  {issue.body}, User name: {issue.user.name} */}
                <>
                  <hr />
                  <h6 className="border" >Open Issue on GitHub!</h6>
                  <Link className='text-primary ' href={`https:/github.com/${org}/${repo}/issues/${issue.number}`} target="_blank">{org}/{repo}/issues/{issue.number}</Link>
                </>
              </div>
              ) )
            : <div className='text-muted'>Unable to get issues for this repo!</div>
          }
        </div>
        {/* <ReportModule props={props.props} reportType="task" modelInFocusId={mothermodel?.id} /> */}
      </Modal.Body>˝
      <Modal.Footer>
        <Button variant="secondary" onClick={ handleCloseModal}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )

  const modellingButtonsDiv = 
    <>
      <ModellingHeaderButtons props= {props}  />
    </>
  //refresh={refresh} setRefresh={setRefresh}

  if (minimized) {
    return (
      <div className=" " >
      <div 
          className="buttons position-absolute mt-1 ms-1 start-0" 
          // style={{ scale: "0.9", marginTop: "px", marginLeft: "-px"}}
      >
          <button
              className="btn bg-transparent text-success m-0 p-1"
              data-toggle="tooltip"
              data-placement="top"
              data-bs-html="true"
              title="Open Issues/Issues left side-panel!"
              onClick={handleMinimize}
          >
          <span className="fs-6"><i className="fa fa-lg fa-angle-right pull-right-container"></i> Issues</span>
          </button>
      </div>
      </div>
   );
  } else  {
    return (
      <div className="project p-1 mt-1" 
          ref={containerRef}
          style={{ position: "fixed", top: "70px", left: "0",  width: "400px",  height: "72vh",  zIndex: "99" }}
      >       
        <div  className="buttons bg-transparent mt-1 ms-1 start-0"  >
          <button
              className="btn bg-transparent text-success m-0 p-1"
              data-toggle="tooltip"
              data-placement="top"
              data-bs-html="true"
              title="Open Issues/Issues left side-panel!"
              onClick={() => setMinimized(true)}
          >
          <span className="fs-6"><i className="fa fa-lg fa-angle-left pull-left-container"></i> Issues</span>
          </button>
        </div>
        <hr className="m-1"/>
        <div className="issues-list side-panel bg-light border border-success">
            <div className="ps-2 font-weight-bold fs-4" >Issues: 
                    <span>
                    {/* {(repo) && <Link className='text-primary ms-4 fs-6' href={`https:/github.com/${org}/${repo}/issues`} target="_blank">{org}/{repo}/issues</Link>} */}
                    </span>
            </div>
            <div className="d-flex justify-content-center">
              <button 
                className="button bg-success rounded m- m-1 px-2 text-light w-100"
                    data-toggle="tooltip"
                    data-placement="top"
                    data-bs-html="true"
                    title="Getting the Issues for current repository!"
                style={{ filter: 'brightness(120%)' }}
                onClick={() => fetchIssues(issueUrl)}>
                <i className="fab fa-github fa-lg me-2"></i>
                Get Issues from GitHub
              </button>
            </div>
            <div className="header m-0 p-0">
              <div className="font-weight-bold  border fs-6">
                <button
                    className="btn text-success m-0 px-2 py-0 btn-sm float-end"
                    data-toggle="tooltip"
                    data-placement="top"
                    data-bs-html="true"
                    title="Open Modal with the FocusIssue!"
                    onClick={handleShowModal}
                    style={{ backgroundColor: "#fff" }}
                  >
                  <i className="fa fa- fa-bullseye"></i> 
                </button>
              </div>
            <div className="font-weight-bold p-1 text-success fs-6"> # {props.props.phFocus.focusIssue?.id}: {props.props.phFocus.focusIssue?.name}</div>
          </div>
          {/* Listing GitHub Issues */}
          {/* make a button for fetching Issues */}
            <div className="m-0 p-0 bg-light scroll" style={{ overflow: "auto", height: "68vh"}}>
              <hr className="m-0"/> 
              {/* <details className='text-muted fs-6 p-2'><summary>GitHub Open Issues:</summary> */}
              <div>GitHub Open Issues:</div>
              {(issues.length > 0) && issues.map((issue) => (
                  <div className='bg-light fs-6  m-2 p-2' key={issue.id}>
                  <div className='d-flex justify-content-between'>
                    <Link className='text-primary' href={issue.html_url} target="_blank"># {issue.number} - {issue.state} - {issue.created_at.slice(0, 10)}</Link>
                  <button
                      className="btn btn-sm checkbox bg-light text-success position-relative" 
                      onClick={() => dispatch({ type: "SET_FOCUS_ISSUE", data: {id: issue.number, name: issue.title}}) } // && handleShowModal()}
                      style={{
                          float: "right",
                          border: "1px solid #ccc",
                          borderRadius: "3px",
                          backgroundColor: "#fff",
                          marginTop: "-5px",
                          marginLeft: "auto",
                          display: "inline-block",
                          position: "relative",
                          scale: "0.7"
                      }}
                      >Set Focus
                  </button>
                    <div className='text-muted'>{issue.user.name}</div>
                  </div>
                  <h6>{issue.title}</h6>
                  {/* <p className='text-secondary m-2'>{issue.body}</p> */}
                  <div className='text-muted'>Created by: {issue.user.login} - Assignee: {issue.assignees[0]?.login} </div>
                  </div>
              ))}
              {/* </details> */}
          </div>
          <hr className="m-4 p-4" />
          <div className='p-2 m-1'> {/*link to Issues */}
              <div className='text-muted'>Link to GitHub Issues:</div>
              {(repo) && <Link className='text-primary ' href={`https:/github.com/${org}/${repo}/issues`} target="_blank">{org}/{repo}/issues</Link>}
          </div>
          <hr className="m-1 p-" />
        </div>
        {modalDiv}
        {projectModalDiv}
      </div>
    );
  }
  return null;
};

export default Issues;
