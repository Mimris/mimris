// import SelectContext from '../components/SelectContext'
// Todo:  change name to ViewContext
import { useState } from 'react'
import Link from 'next/link';
import { useRouter } from "next/router";
import SelectContext from '../components/utils/SelectContext'

const debug = false

const ContextView = (props: any) =>  {
  const { query } = useRouter(); // example: http://localhost:3000/modelling?repo=Kavca/kavca-akm-models&path=models&file=AKM-IRTV-Startup.json 

  const [minimized, setMinimized] = useState(true);
  const toggleMinimized = () => setMinimized(!minimized);
 
  const phFocus = props.ph?.phFocus;
  const repo = (phFocus?.focusProj?.repo) && phFocus.focusProj?.repo;
  const org = (phFocus?.focusProj?.org) && phFocus.focusProj?.org;
  const branch = (phFocus?.focusProj?.branch) && phFocus.focusProj?.branch;
  const path = (phFocus?.focusProj?.path) && phFocus.focusProj?.path;
  const projectNumber = (phFocus?.focusProj?.projectNumber) && phFocus.focusProj?.projectNumber;

  if (!phFocus) return null;
  // if phFocus is change then refresh the page
  if (phFocus !== props.ph.phFocus) {
    console.log('phFocus', phFocus, props.ph.phFocus);
    window.location.reload();
  }

    const handleShowModal = () => {
    // if (minimized) {
    //   setMinimized(true);
    // }
    props.setShowModal(true);
  };

  const copyToClipboard = async () => { 
    const host = window.location.host;
    const paramFocus = {
      githubFile: {
        org: phFocus.focusProj.org,
        repo: phFocus.focusProj.repo, 
        branch: phFocus.focusProj.branch, 
        path: phFocus.focusProj.path,
        filename: phFocus.focusProj.file,
      },
      // focusModel: (phFocus.focusModel.description) ? {id: phFocus.focusModel.id, name:phFocus.focusModel.name} : phFocus.focusModel, // just in case the whole model is written to the focus
      // focusModelview: phFocus.focusModelview,
      // focusObject: phFocus.focusObject,
      // focusObjectview: phFocus.focusObjectview,
      // focusRole: '', //phFocus.focusRole,
      // focusTask: '' //phFocus.focusTask,
    };
    const urlParams = encodeURIComponent(JSON.stringify(paramFocus));
    console.log('27 paramFocus', paramFocus, phFocus.focusProj);
    const tmphost = (host === 'localhost:3000') ? host : 'akmmclient-beta.vercel.app'
    // const focus = await navigator.clipboard.writeText(`http://akmmclient-beta.vercel.app/modelling?focus=${JSON.stringify(paramFocus)}`);
    const focusUrl = `http://${tmphost}/modelling?focus=${urlParams}`;
    if (debug) console.log('42 focus', focusUrl);
    const focus = await navigator.clipboard.writeText(focusUrl);
    if (debug) console.log('44 focus', focus);
    // return focus    
  }

  const statusField = (name, field) => {
    return (
      <span className="context-item border rounded-2 mx-1">
        <span className="px-1 ">
          {name}:
        </span>
        <span className="px-1 text-success" style={{ backgroundColor: "#fff", whiteSpace: "nowrap" }}>
          {field}
        </span>
      </span>
    );
  }
  const statusFieldLink = (name, field, link) => {  
    return (
      <span className="context-item border rounded-2 mx-1">
        <span className="px-2">
          {name}:
        </span>
        <span
          className="px-2"
          style={{ backgroundColor: "#fff", whiteSpace: "nowrap"  }}
        >
          <Link
            className="text-primary"
            href={link}
            target="_blank"
          >
            <span >{field}</span>
          </Link>
        </span>
      </span>
    );
  }

  const contextRepoDiv = 
    <div className="context-list">
      <div className="">
        <div className="d-flex justify-content-between align-items-center bg-transparent">
          {/* <div>{statusFieldLink('Repo', repo, )}</div> */}
          {/* <div>{statusFieldLink('Project', phFocus.focusProj?.`https:/github.com/${org}/${repo}/tree/${branch}/${path}`name, `https:/github.com/orgs/${org}/projects/${projectNumber}`)}</div> */}
          <div>{statusField('Role', props.ph?.phFocus?.focusRole?.name)}</div>
          <div className="me-auto">{statusField('User', (props.ph?.phUser?.focusUser?.name === 'No GitHub User identified') ? 'Not logged in!' : props.ph?.phUser?.focusUser?.name )}</div>
        </div>
        {/* <div className="font-weight-bold  border fs-6">
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
        </div> */}
        {/* <hr className="m-1 bg-primary " style={{ height: "4px" }} /> */}
        {(!minimized) && 
            <div className="d-flex justify-content-between align-items-center">
              <div>{statusField('Model', props.ph?.phFocus?.focusModel?.name)}</div>
              <div>{statusField('Modelview', props.ph?.phFocus?.focusModelview?.name)}</div>
              <div>{statusField('Object', props.ph?.phFocus?.focusObject?.name)}</div>
              <div>{statusField('Objectview', props.ph?.phFocus?.focusObjectview?.name)}</div>
            </div>
        }
    </div>
  </div>

  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);

  return (
    <>
        {/* <div className="pt-1" style={{backgroundColor: "#b0cfcf"}}></div> */}
      <div className="d-flex justify-content-start align-items-center mx-0" style={{  backgroundColor: "#dee" }}>
        <div className="border"style={{  backgroundColor: "#cdd" }}
        >
          {statusFieldLink('Issue', props.ph?.phFocus?.focusIssue?.name, `https:/github.com/${org}/${repo}/issues/${props.ph?.phFocus?.focusIssue?.id}`)}</div>
        <button className="btn btn-sm bg-transparent py-0 ms-1 text-primary " onClick={toggleMinimized}>
          {(minimized) 
            ? <span className="" style={{whiteSpace: 'nowrap',}}>Focus : <i className="fas fa-caret-right fa-lg me-2"></i></span>
            : <span className="" style={{whiteSpace: 'nowrap',}}>Focus : <i className="fas fa-caret-up   fa-lg me-2"></i></span>
          }
        </button> 
        {/* <button className="btn btn-sm bg-transparent text-primary px-2 mt-1 pt-0 mx-0"  style={{height: "24px"}} onClick={toggle}>
          <i className="fas fa-edit fa-lg"
            data-toggle="tooltip" data-placement="top" data-bs-html="true" 
            title="Copy current focus/context to clipboard as a link that can be sent to others by e-mail etc."     
            ></i>   
        </button> */}
        <SelectContext className='ContextModal' phData={props.ph.phData} phFocus={props.ph.phFocus} modal={modal} toggle={toggle} />
        <button className="btn btn-sm bg-transparent text-primary mt-1 pt-0 mx-0" style={{height: "24px"}} onClick={copyToClipboard}>
          <i className="fas fa-copy fa-lg " 
            data-toggle="tooltip" data-placement="top" data-bs-html="true" 
            title="Copy current focus/context to clipboard. The link can be used in documents,sent to others by e-mail etc."        
          ></i>
        </button>
        <div className="ms-3 w-100">{contextRepoDiv}</div>
        {/* <div className="ms-auto me-1">{statusField('TargetModel', (props.ph?.phFocus?.focusTargetModel) && props.ph?.phFocus?.focusTargetModel)}</div> */}
        <div className="me-auto"
            style={{  backgroundColor: "#cdd" }}
        >{statusField('Task', props.ph?.phFocus?.focusTask?.name)}</div>      </div>
    </>
  )
}

export default ContextView