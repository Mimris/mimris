import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { Modal, Button } from 'react-bootstrap';
import { is, set } from 'immer/dist/internal';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from "rehype-raw";
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import StartInitStateJson from '../startupModel/AKM-INIT-Startup_PR.json';
import StartCOREStateJson from '../startupModel/AKM-Start-CORE_PR.json';
import StartIRTVStateJson from '../startupModel/AKM-Start-IRTV_PR.json';
import StartOSDUStateJson from '../startupModel/AKM-Start-OSDU_PR.json';

// import ProjectDetailsModal from './modals/ProjectDetailsModal';
import ProjectDetailsForm from "./forms/ProjectDetailsForm";
import { setfocusRefresh } from '../actions/actions';
import { start } from 'repl';

// import { fetchIssues } from '../api/github';

const debug = false;

const Project = (props) => {
  if (debug) console.log('18 Tasks props', props.props.phData, props);
  const dispatch = useDispatch();

  const containerRef = useRef(null);
  const modalRef = useRef(null);
  const projectModalRef = useRef(null);
  
  const [minimized, setMinimized] = useState(true);
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


  const [org, setOrg] = useState(props.props.phFocus.focusProj.org)
  const [repo, setRepo] = useState(props.props.phFocus.focusProj.repo)
  const [path, setPath] = useState(props.props.phFocus.focusProj.path)
  const [file, setFile] = useState(props.props.phFocus.focusProj.file)
  const [branch, setBranch] = useState(props.props.phFocus.focusProj.branch)
  const [focus, setFocus] = useState(props.props.phFocus.focusProj.focus)
  const [ghtype, setGhtype] = useState(props.props.phFocus.focusProj.ghtype)
  const [projectNumber, setProjectNumber] = useState(props.props.phFocus.focusProj.projectNumber) // this is the project number in the list of github projects


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

  // list issues form github
  const fetchIssues = async () => {
    try {
      if (debug) console.log('89 issues fetch', issueUrl)
      const res = await fetch(issueUrl);
      const data = await res.json();
      if (debug) console.log('54 issues', res, data)
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
    <Modal  show={showModal} onHide={handleCloseModal} ref={modalRef} className={`modal ${!modalOpen ? "d-block" : "d-none"}`} style={{ marginRight: "20px", backgroundColor: "#fee"}} >
      <Modal.Header closeButton>
        <Modal.Title>Issue in focus:</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-transparent"  style={{ overflowY: 'scroll', maxHeight: '80vh' }}>
        <div className='bg-light p-2 m-0'> {/*link to Issues */}
          {/* <div className='text-muted'>Issues for this repo:</div> */}
          {(issues.length > 0) 
            ? issues?.map((issue) => (issue.number === props.props.phFocus.focusIssue?.id) && (   
              <div key={issue.number}>
                <Link className='text-primary fs-4' href={`https:/github.com/${org}/${repo}/issues/${issue.number}`} target="_blank" style={{ textDecoration: 'underline' }}>
                  {issue.number}, {issue.title}
                </Link> <br />
                User login: {issue.user.login} <br />
                Assignee: {issue.assignees[0]?.login}  <br />      
                State: {issue.state} <br />
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

  if (minimized) {
    return (
        <div className="minimized-task " >
          <div 
            className="buttons position-absolute" 
            style={{ scale: "0.8", marginTop: "-28px", marginLeft: "-8px"}}
          >
            <button
              className="btn bg-light text-secondary m-0 p-1 btn-sm fs-6"
              data-toggle="tooltip"
              data-placement="top"
              data-bs-html="true"
              title="Open focusIssue!"
              onClick={handleMaximize}
              style={{ backgroundColor: "#fff" }}
            >
              <i className="fas fa-poll-h text-primary fa-lg me-1" aria-hidden="true"></i>
              Project
            </button>
          </div>
        </div>
      );
  }

  return (
      <div className="project p-1" 
        ref={containerRef}
        style={{height: "100%", width: "25rem", backgroundColor: "#eef", borderRadius: "5px 5px 5px 5px",
        position: "absolute", top: "50%", left: "0%", transform: "translate(-0%, -50%)", zIndex: 9999 }}
      >
        {/* <div className="issueslist p-1" style={{ backgroundColor: "lightyellow", width: "26rem", position: "absolute", height: "94%", top: "50%", right: "0%", transform: "translate(-0%, -45%)", zIndex: 9999 }}> */}
        <div className="header m-0 p-0 d-flex justify-content-between align-items-center" style={{backgroundColor: "#eee", minWidth: "8rem"}}>
          <div className="ps-2 text-success font-weight-bold fs-3" >Project </div>
          <div className="buttons position-relative end-0" style={{ scale: "0.9"}}>
            <button 
                className="btn text-success m-1 px-1 py-0 btn-sm" 
                data-toggle="tooltip"
                data-placement="top"
                data-bs-html="true"
                title="Close Project Pane!"
                onClick={handleMinimize} 
                style={{backgroundColor: "#fff"}}
                >
                <i className="fa fa-lg fa-arrow-left"></i>
            </button>
          </div>
        </div>               
        <div className="m-1 p-1 fs-5" style={{backgroundColor: "#eef"}}>Name:  {props.props.phFocus.focusProj.name}</div>
        <div className="d-flex justify-content-between align-items-center">
          <button className="button rounded m-1 px-2 text-light" 
            style={{backgroundColor: "steelblue", whiteSpace: "nowrap"}}
            onClick={handleShowProjectModal} >
            Edit Project Details
          </button>
        </div>
        {/* <details className="m-1 p-1"  style={{backgroundColor: "#eee"}}><summary>GitHub links</summary>
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
        </details> */}
        <hr className="m-1"/>
        <div className="issueslist" >
            <button className="button bg-secondary rounded me-auto m-1 px-2 text-light" 
              style={{ whiteSpace: "nowrap", maxHeight: "1.5rem"}}
              onClick={fetchIssues} >
              <i className="fab fa-github fa-lg me-2"></i>
              Fetch Issues from GitHub
            </button>
            <div className="d-flex ms-auto position-relative m-0 p-0 end-0">
              <div className="ps-2 font-weight-bold fs-4" >Issues:</div>
            </div>
          <div className="header m-0 p-0">
            <div className="font-weight-bold px-2 py-2 border fs-6">
              In Focus:
              <button
                className="btn text-success m-0 px-2 py-0 btn-sm float-end"
                data-toggle="tooltip"
                data-placement="top"
                data-bs-html="true"
                title="Open focusIssue!"
                onClick={handleShowModal}
                style={{ backgroundColor: "#fff" }}
              >
              <i className="fa fa- fa-bullseye"></i> 
              </button>
            </div>
            <div className="font-weight-bold px-1 text-success fs-6"> # {props.props.phFocus.focusIssue?.id}: {props.props.phFocus.focusIssue?.name}</div>
          </div>
          {/* Listing GitHub Issues */}
          {/* make a button for fetching Issues */}
          <div className="m-0 p-0">
              <hr className="m-0"/>
              <details className='text-muted fs-6 p-2'><summary>GitHub Issues:</summary>
              {(issues.length > 0) && issues.map((issue) => (
                  <div className='bg-light fs-6  m-2 p-2' key={issue.id}>
                  <div className='d-flex justify-content-between'>
                    <Link className='text-primary' href={issue.html_url} target="_blank"># {issue.number} - {issue.state} - {issue.created_at.slice(0, 10)}</Link>
                  <button
                      className="btn btn-sm checkbox bg-transparent text-success position-relative" 
                      onClick={() => dispatch({ type: "SET_FOCUS_ISSUE", data: {id: issue.number, name: issue.title}}) } // && handleShowModal()}
                      style={{
                          float: "right",
                          border: "1px solid #ccc",
                          borderRadius: "3px",
                          backgroundColor: "#fff",
                          // width: "20px",
                          // height: "20px",
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
              </details>
          </div>
          <hr className="m-1" />
          <div className='px-2 m-1'> {/*link to Issues */}
              <div className='text-muted'>Link to GitHub:</div>
              {(repo) && <Link className='text-primary ' href={`https:/github.com/${org}/${repo}/issues`} target="_blank">{org}/{repo}/issues</Link>}
          </div>
        </div>
        {modalDiv}
        {projectModalDiv}
      </div>
  );
  return null;
};

export default Project;
