import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router'
import Link from 'next/link';
import { Modal, Button } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from "rehype-raw";
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import ModellingHeaderButtons from "./utils/ModellingHeaderButtons";

// import { fetchIssues } from '../api/github';

const debug = false;

const Issues = (props: any) => {
  if (debug) console.log('25 Tasks props', props.phData, props);

  const dispatch = useDispatch();

  const router = useRouter();
  const currentRoute = router.pathname;

  const containerRef = useRef(null);
  const modalRef = useRef(null);
  const projectModalRef = useRef(null);

  // const [minimized, setMinimized] = useState(false);
  // const [maximized, setMaximized] = useState(true);
  // const [modalOpen, setModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [issues, setIssues] = useState([]);
  const [project, setProject] = useState([]);
  const [comments, setComments] = useState([]);
  // const [showIssueModal, setShowModal] = useState(false);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [refresh, setRefresh] = useState(false);
  // const [toggleRefresh, setToggleRefresh] = useState(false);
  const [focusIssue, setFocusIssue] = useState(props.phFocus.focusIssue);


  const [org, setOrg] = useState(props.phFocus.focusProj?.org)
  const [repo, setRepo] = useState(props.phFocus.focusProj?.repo)
  const [path, setPath] = useState(props.phFocus.focusProj?.path)
  const [file, setFile] = useState(props.phFocus.focusProj?.file)
  const [branch, setBranch] = useState(props.phFocus.focusProj?.branch)
  const [focus, setFocus] = useState(props.phFocus.focusProj?.focus)
  const [ghtype, setGhtype] = useState(props.phFocus.focusProj?.ghtype)
  const [projectNumber, setProjectNumber] = useState(props.phFocus.focusProj?.projectNumber) // this is the project number in the list of github projects

  // useEffect(() => {
  // if (currentRoute === '/modelling') setMinimized(true);
  // }, []);

  if (debug) console.log('39 project', org, repo, path, file, branch, focus, ghtype, projectNumber)
  // const issueUrl = `https://api.github.com/repos/${org}/${repo}/˝`
  let issueUrl = `https://api.github.com/repos/${org}/${repo}/issues`
  // fetch done issues
  let issueUrlDone = `https://api.github.com/repos/${org}/${repo}/issues?state=closed`
  let collabUrl = `https://api.github.com/repos/${org}/${repo}/collaborators`
  let projectUrl = `https://api.github.com/repos/${org}/${repo}/projects/${projectNumber}`
  let projectFileUrl = `https://api.github.com/repos/${org}/${repo}/contents/${path}/${file}?ref=${branch}`

  const panelRef = useRef(null);

  useEffect(() => {
    // const handleClickOutside = (event) => {
    //   if (containerRef.current && !containerRef.current.contains(event.target)) {
    //     toggleMinimize();
    //   }
    // };
    setOrg(props.phFocus.focusProj?.org);
    setRepo(props.phFocus.focusProj?.repo);
    setPath(props.phFocus.focusProj?.path);
    setFile(props.phFocus.focusProj?.file);
    setBranch(props.phFocus.focusProj?.branch);
    setFocus(props.phFocus.focusProj?.focus);
    setGhtype(props.phFocus.focusProj?.ghtype);
    setProjectNumber(props.phFocus.focusProj?.projectNumber);

    issueUrl = `https://api.github.com/repos/${org}/${repo}/issues`
    issueUrlDone = `https://api.github.com/repos/${org}/${repo}/issues?state=closed`
    collabUrl = `https://api.github.com/repos/${org}/${repo}/collaborators`
    projectUrl = `https://api.github.com/repos/${org}/${repo}/projects/${projectNumber}`
    projectFileUrl = `https://api.github.com/repos/${org}/${repo}/contents/${path}/${file}?ref=${branch}`

    // document.addEventListener('click', handleClickOutside);
    // return () => {
    //   document.removeEventListener('click', handleClickOutside);
    // };' 
  }, [repo, org, path, file, branch, focus, ghtype, projectNumber]);

  const toggleMinimize = () => {
    props.setMinimized(!props.minimized);
    // setMaximized(false);
  };

  // const handleMaximize = () => {
  //     props.setMinimized(false);
  //     // setMaximized(true);
  // };

  // list issues form github
  const fetchIssues = async (url: string | URL | Request) => {
    try {
      if ((debug)) console.log('132 issues fetch', url)
      const res = await fetch(url);
      const data = await res.json();
      if ((debug)) console.log('135 issues', res, data)
      if (data.length === 0) { // if there is an error
        console.error('Error fetching issues:', data.message);
        setIssues([]);
      } else {
        setIssues(data);
      }
      if (debug) console.log('142 issues', data)
      if (debug) console.log('143 issues', issues)

    } catch (error) {
      console.error('Error fetching comments:', error);
    }
    if (debug) console.log('148 comments', issues)
  }

  // const CommentsComponent = (issue: any) => {'
  //   if (issue.comments_url === undefined) return null;
  //   if (issue.comments === 0) return null;
  //   console.log('153 comments', issue, issue.body, issue.comments_url);
  //   fetchComments(issue.comments_url)
  //     .then((comments: any[]) => {
  //       if ((debug)) console.log('156 comments', comments);
  //       if (comments.length === 0) return [];
  //       return comments.map((comment: any) => (comment.issue_url === issue.comments_url) && (comment.body));
  //     })
  //     .catch((error) => {
  //       console.error('Error fetching comments:', error, issue.comments_url);
  //     });
  //     return (
  //       <div>
  //         {(comments && comments.length > 0) && comments.map((comment) => {
  //           if ((debug)) console.log('167 comments', comment)
  //           return (
  //             <div>
  //               <div key={comment.id}>
  //                 <p>{comment.body}</p>
  //               </div>
  //             </div>
  //           );
  //         })}
  //       </div>
  //     );
  //   };

  // const fetchComments = async (url) => {
  //   const comments = [];
  //   if (issues.length > 0) {
  //     await Promise.all(issues.map(async (issue) => {
  //       const res = await fetch(issue.comments_url);
  //       const data = await res.json();
  //       if ((debug)) console.log('176 comments', res, data)
  //       if (data.length === 0) { // if there is an error
  //         console.error('Error fetching comments:', data.message, data, res, issues);
  //       } else {
  //         comments.push(...data);
  //       }
  //       if ((debug)) console.log('183 comments', data, comments)
  //     }));
  //   }
  //   setComments(comments);
  //   return comments;
  // }

  const handleSetFocusIssue = (e: any) => {
    if (debug) console.log('190 setFocusIssue', e)
    setFocusIssue(e);
  };

  const handleSubmit = (details: any) => {
    props.onSubmit(details);
    handleCloseModal();
  };

  const handleShowModal = () => {
    if (debug) console.log('183 showModal', props.showIssueModal, props.minimized)
    // if (props.minimized) {
    //   props.setMinimized(false);
    // }
    props.setShowIssueModal(true);
    if (debug) console.log('188 showModal', props.showIssueModal)
  };

  const handleCloseModal = () => props.setShowIssueModal(false);

  const modalDiv = (focusIssue) && (
    <Modal show={props.showIssueModal} onHide={handleCloseModal} ref={modalRef}
      className={`modal ${!props.modalOpen ? "d-block" : "d-none"}`} style={{ marginRight: "0px", backgroundColor: "#ffffed", zIndex: "9199" }} >
      <Modal.Header closeButton>
        <Modal.Title>Issue in focus:</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-transparent" style={{ overflowY: 'scroll', maxHeight: '72vh' }}>
        <div className='bg-light p-2 m-0'>
          {(focusIssue.number)
            ? (
              <div key={focusIssue.number}>
                <Link className='text-primary fs-4' href={`http://github.com/${org}/${repo}/issues/${focusIssue?.number}`} target="_blank" style={{ textDecoration: 'underline' }}>
                  {focusIssue.number}, {focusIssue.title}
                </Link> <br />
                User login: {focusIssue.user.login} <br />
                Assignee: {focusIssue.assignees[0]?.login}  <br />
                State: {focusIssue.state} <br />
                Status: {focusIssue.status} <br />
                Priority: {focusIssue.priority} <br /> // Add this line

                Created: {focusIssue.created_at.slice(0, 10)} <br />
                Updated: {focusIssue.updated_at.slice(0, 10)} <br />
                Closed: {focusIssue.closed_at?.slice(0, 10)} <br />
                Labels: {focusIssue.labels.map((label: { name: string; }) => (label.name + ', '))} <br />
                <div className="bg-white border border-secondary p-2">
                  Details:
                  <ReactMarkdown plugins={[remarkGfm, rehypeSlug]}>{focusIssue.body}</ReactMarkdown>
                </div>
                {/* Comments: {comments.map((comment) => (comment.map((c) => (c.issue_url === issue.comments_url) && (c.body))))} <br /> */}
                {/* {focusIssue(issue)} */}
                {/* Body:  {issue.body}, User name: {issue.user.name} */}
                <>
                  <hr />
                  <h6 className="border" >Open Issue on GitHub!</h6>
                  <Link className='text-primary ' href={`http://github.com/${org}/${repo}/issues/${focusIssue.number}`} target="_blank">{org}/{repo}/issues/{focusIssue.number}</Link>
                </>
              </div>
            )
            : <div >No Issue in focus!</div>
          }
          {/* : <div className='text-muted'>Unable to get issues for this repo!</div> */}
        </div>

        {/* <ReportModule props={props} reportType="task" modelInFocusId={mothermodel?.id} /> */}
      </Modal.Body>˝
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseModal}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )

  // const modellingButtonsDiv =
  //   <>
  //     <ModellingHeaderButtons props={props} />
  //   </>

  //refresh={refresh} setRefresh={setRefresh}
  // const statusFieldLink = (name, field, link) => {
  //   return (
  //     <span className="context-item border rounded-2 mx-1">
  //       <span className="px-2">
  //         {name}:
  //       </span>
  //       <span
  //         className="px-2"
  //         style={{ backgroundColor: "#fff", whiteSpace: "nowrap" }}
  //       >
  //         <Link
  //           className="text-primary"
  //           href={link}
  //           target="_blank"
  //         >
  //           <span >{field}</span>
  //         </Link>
  //       </span>
  //     </span>
  //   );
  // }

  if (debug) console.log('266 Issues', props.minimized)
  if (props.minimized) {
    return (
      <div
        className="btn btn-sm text-success ms-1 p-1 d-flex justify-content-center align-items-center"
        style={{ backgroundColor: "#ffffed",whiteSpace: "nowrap" }}
      // style={{ scale: "0.9", marginTop: "px", marginLeft: "-px"}}
      >
        <button
          className="btn btn-sm text-success m-0 p-1"
          style={{ backgroundColor: "#ffffdd", whiteSpace: "nowrap" }}
          data-toggle="tooltip"
          data-placement="top"
          data-bs-html="true"
          title="Open Issues left side-panel!"
          onClick={() => props.setMinimized(false)}
        >
          <span className="fs-6"><i className="fa fa-lg fa-angle-right pull-right-container"></i> Issues</span>
        </button>
        {/* <div className="float-end" >{statusFieldLink('Issue', props.ph?.phFocus?.focusIssue?.name, `http://github.com/${org}/${repo}/issues/${props.ph?.phFocus?.focusIssue?.id}`)}</div> */}
      </div>
    );
  } else {
    return (
      <>
        <div className="buttons rounded mt-1 ms-1"
          style={{ backgroundColor: "#ffffed", minWidth: "106px", whiteSpace: "nowrap" }} >
          <button
            className="btn btn-sm border text-success m-0 p-1"
            style={{ backgroundColor: "#ffffdd", whiteSpace: "nowrap" }}
            data-toggle="tooltip"
            data-placement="top"
            data-bs-html="true"
            title="Open Issues in left side-panel!"
            onClick={() => props.setMinimized(true)}
          >
            <span className="fs-6 me-0 pe-4"><i className="fa fa-lg fa-angle-left pull-left-container"></i> Issues</span>
          </button>
        </div>
        <div className="issues p-1 mt-1"
          // ref={containerRef}
          style={{
            position: "fixed", top: "156px", left: "0", width: "400px", height: "82vh", zIndex: "99",
            backgroundColor: "#ffffea", overflow: "auto", border: "1px solid #ccc", borderRadius: "5px 5px 5px 5px"
          }}
        >
          <div className="issues-list side-panel border border-success">
            <button
              className="btn btn-sm bg-light text-dark float-end"
              onClick={() => props.setMinimized(true)}
            >
              X
            </button>
            <div className="ps-2 font-weight-bold fs-4" >Issues:
              <span>
                {/* {(repo) && <Link className='text-primary ms-4 fs-6' href={`http://github.com/${org}/${repo}/issues`} target="_blank">{org}/{repo}/issues</Link>} */}
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
                Fetch Issues from GitHub
              </button>
            </div>
            <div className="header m-0 p-0">
              <div className="font-weight-bold  border fs-6">
                <button
                  className="btn text-success m-0 px-2 py-0 btn-sm float-end"
                  data-toggle="tooltip"
                  data-placement="top"
                  data-bs-html="true"
                  title="Open issueModal with the FocusIssue!"
                  onClick={() => { props.setShowIssueModal(true) }}
                  style={{ backgroundColor: "#fff" }}
                >
                  <i className="fa fa- fa-plus"></i>
                </button>
              </div>
              <div className="font-weight-bold p-1 text-success fs-6"> # {props.phFocus.focusIssue?.id}: {props.phFocus.focusIssue?.name}</div>
            </div>
            <div className="m-0 p-0 bg-light scroll" style={{ overflow: "auto", height: "64vh" }}>
              <hr className="m-0" />
              <div>GitHub Open Issues:</div>
              {(issues.length > 0) && issues.map((issue: any) => (
                <div className='bg-light fs-6  m-2 p-2' key={issue.id}>
                  <div className='d-flex justify-content-between'>
                    <Link className='text-primary' href={issue.html_url} target="_blank"># {issue.number} - {issue.state} - {issue.created_at.slice(0, 10)}</Link>
                    <button
                      className="btn btn-sm checkbox bg-light text-success position-relative"
                      onClick={() => dispatch({ type: "SET_FOCUS_ISSUE", data: { id: issue.number, name: issue.title } }) && handleSetFocusIssue(issue)}
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
                  <div className='text-muted'>Created by: {issue.user.login} - Assignee: {issue.assignees[0]?.login} </div>
                </div>
              ))}
            </div>
            <hr className="m-1 p-0" />
            <div className='p-2 m-1'> {/*link to Issues */}
              <div className='text-muted'>Link to GitHub Issues:</div>
              {(repo) && <Link className='text-primary ' href={`http://github.com/${org}/${repo}/issues`} target="_blank">{org}/{repo}/issues</Link>}
              {<Link className='text-primary ' href={`http://github.com/kavca/kavca-akm-models/issues`} target="_blank">kavca/kavca-akm-models/issues</Link>}
            </div>
            <hr className="m-1" />
          </div>
          {modalDiv}
          {/* {projectModalDiv} */}
        </div>
      </>
  }
    );
  return null;
};

export default Issues;
