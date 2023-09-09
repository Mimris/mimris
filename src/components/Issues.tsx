import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { Modal, Button } from 'react-bootstrap';
import { set } from 'immer/dist/internal';
// import { fetchIssues } from '../api/github';

const debug = false;

const Issues = (props) => {

    if (!debug) console.log('18 Tasks props', props.props.phData, props);

    const dispatch = useDispatch();
    

    const [minimized, setMinimized] = useState(true);
    const [maximized, setMaximized] = useState(true);

    const handleMinimize = () => {
        setMinimized(true);
        setMaximized(false);
    };

    const handleMaximize = () => {
        setMinimized(false);
        setMaximized(true);
    };

    const [org, setOrg] = useState(props.props.phFocus.focusProj.org)
    const [repo, setRepo] = useState(props.props.phFocus.focusProj.repo)
    const [path, setPath] = useState(props.props.phFocus.focusProj.path)
    const [file, setFile] = useState(props.props.phFocus.focusProj.file)
    const [branch, setBranch] = useState(props.props.phFocus.focusProj.branch)
    const [focus, setFocus] = useState(props.props.phFocus.focusProj.focus)
    const [ghtype, setGhtype] = useState(props.props.phFocus.focusProj.ghtype)
    const [projectNumber, setProjectNumber] = useState(props.props.phFocus.focusProj.projectNumber) // this is the project number in the list of github projects


    console.log('39 project', org, repo, path, file, branch, focus, ghtype, projectNumber)
    // const issueUrl = `https://api.github.com/repos/${org}/${repo}/˝`
    const issueUrl = `https://api.github.com/repos/${org}/${repo}/issues`
    const collabUrl = `https://api.github.com/repos/${org}/${repo}/collaborators`
    const projectUrl = `https://api.github.com/repos/${org}/${repo}/projects/${projectNumber}`

    const [issues, setIssues] = useState([]);

    // list issues form github
    const fetchIssues = async () => {
      try {
        const res = await fetch(issueUrl);
        const data = await res.json();
        console.log('54 issues', data)
        if (data.length === 0 ) { // if there is an error
          console.error('Error fetching issues:', data.message);
          setIssues( [{ number: 'Error', title: 'Error fetching issues:'}]);
        }
        console.log('58 issues', data)
        setIssues(data);
      } catch (error) {
        console.error('Error fetching issues:', error);
      }
      console.log('59 issues', issues)
    };

    useEffect(() => {
        fetchIssues();
    }, []);

const [showModal, setShowModal] = useState(false);

const handleShowModal = () => {
  if (minimized) {
    setMinimized(true);
  }
  setShowModal(true);
};
const handleCloseModal = () => setShowModal(false);

const modalDiv = (
  <Modal show={showModal} onHide={handleCloseModal}  style={{ marginLeft: "200px", marginTop: "100px", backgroundColor: "#fee" }} >
    <Modal.Header closeButton>
      <Modal.Title>Issue in focus:</Modal.Title>
    </Modal.Header>
    <Modal.Body className="bg-transparent">
      <div className='bg-light px-2 m-1 w-100'> {/*link to Issues */}
        {/* <div className='text-muted'>Issues for this repo:</div> */}
        {(issues.length > 0) 
          ? issues?.map((issue) => (issue.number === props.props.phFocus.focusIssue?.id) && (   
            <div>{issue.number}, {issue.title} <br />
              User login: {issue.user.login} <br />
              Assignee: {issue.assignees[0]?.login}  <br />                
              {/* Body:  {issue.body}, User name: {issue.user.name} */}
            </div>
            ) )
          : <div className='text-muted'>Unable to get issues for this repo!</div>
        }
        <>
        <hr />
        <h6 className="border" >Check on GitHub!</h6>
        <Link className='text-primary ' href={`https:/github.com/${org}/${repo}/issues`} target="_blank">{org}/{repo}/issues</Link>
        </>
      </div>
      {/* <ReportModule props={props.props} reportType="task" modelInFocusId={mothermodel?.id} /> */}
    </Modal.Body>˝
    <Modal.Footer>
      <Button variant="secondary" onClick={handleCloseModal}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>
)

  if (minimized) {
    return (
        <div className="minimized-task " >
          <div className="buttons position-absolute start-0" style={{ scale: "0.7", marginTop: "-26px"}}>
            <button
              className="btn text-success m-0 px-1 py-0 btn-sm"
              data-toggle="tooltip"
              data-placement="top"
              data-bs-html="true"
              title="Open focusIssue!"
              onClick={handleShowModal}
              style={{ backgroundColor: "#fee" }}
            >
              ✵
            </button>
  
            <button 
              className="btn text-success me-2 px-1 py-0 btn-sm" 
              data-toggle="tooltip"
              data-placement="top"
              data-bs-html="true"
              title="Minimize Issues list for this modelling project!"
              onClick={handleMaximize}
            style={{ backgroundColor: "#fee" }}
            >
              -&gt;
            </button>
          </div>
          {modalDiv}
        </div>
      );
  }

    return (
      <>
        <div className="issueslist" style={{ width: "22rem"}}>
            <div className="header m-0 p-0 d-flex justify-content-between align-items-center" style={{ minWidth: "8rem"}}>
                <div className="ps-2 text-success font-weight-bold fs-6" >List of Issues</div>
                <div className="buttons position-relative end-0" style={{ scale: "0.7"}}>
                <button
                  className="btn text-success m-0 px-2 py-0 btn-sm"
                  data-toggle="tooltip"
                  data-placement="top"
                  data-bs-html="true"
                  title="Open focusIssue!"
                  onClick={handleShowModal}
                  style={{ backgroundColor: "#fee" }}
                >
                ✵
                </button>
                    <button 
                        className="btn text-success me-0 px-1 py-0 btn-sm" 
                        onClick={handleMinimize} 
                        style={{backgroundColor: "#fef"}}>
                        &lt;-
                    </button>
                </div>
            </div>

            {/* Listing GitHub Issues */}
            <div className="m-0 p-0" style={{backgroundColor: "#fee" }}>
                <h2 className='text-muted fs-6 p-2'>GitHub Issues :</h2>
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
            </div>
            {modalDiv}
        </div>
        <style jsx>{`
        `}</style>
      </>
    );
  

  return null;
};

export default Issues;
