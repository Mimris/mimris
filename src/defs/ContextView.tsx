// import SelectContext from '../components/SelectContext'
// Todo:  change name to ViewContext
import { useState } from 'react'
import Link from 'next/link';
import { useRouter } from "next/router";
import SelectContext from '../components/utils/SelectContext'
import { URLPattern } from 'next/server';

const debug = false

const ContextView = (props: any) => {
  const { query } = useRouter(); // example: http://localhost:3000/modelling?repo=Kavca/kavca-akm-models&path=models&file=SELL-A-CAR_PR.json
  const [minimized, setMinimized] = useState(true);
  const toggleMinimized = () => setMinimized(!minimized);
  const [modal, setModal] = useState(false);

  const phFocus = props.ph?.phFocus;
  const repo = (phFocus?.focusProj?.repo) && phFocus.focusProj?.repo;
  const org = (phFocus?.focusProj?.org) && phFocus.focusProj?.org;
  const branch = (phFocus?.focusProj?.branch) && phFocus.focusProj?.branch;
  const path = (phFocus?.focusProj?.path) && phFocus.focusProj?.path;
  const projectNumber = (phFocus?.focusProj?.projectNumber) && phFocus.focusProj?.projectNumber;

  if (!phFocus) return null;
  // if phFocus is change then refresh the page
  if (phFocus !== props.ph.phFocus) {
    if(debug) console.log('phFocus', phFocus, props.ph.phFocus);
    window.location.reload();
  }

  const handleShowModal = () => {
    // if (minimized) {
    //   setMinimized(true);
    // }
    props.setShowModal(true);
  };

  const handleShowIssueModal = () => {
    if (props.focusIssue === null) {
      props.setFocusIssue({ id: 0, name: 'REFRESH ISSUES', description: '', status: '', labels: [], assignees: [] })
    }
    props.setShowIssueModal(true);
  };

  let focusUrl = '';
  let urlParams = '';
  const copyToClipboard = async () => {
    const host = window.location.host;
    urlParams = `
        org=${phFocus.focusProj.org}&
        repo=${phFocus.focusProj.repo}& 
        branch=${phFocus.focusProj.branch}& 
        path=${phFocus.focusProj.path}&
        file=${phFocus.focusProj.file}
        model=${phFocus.focusModel.id || phFocus.focusModel.name}&
        modelview=${phFocus.focusModelview.id || phFocus.focusModelview.name}
      `;
    if (debug) console.log('27 paramFocus', urlParams, phFocus.focusProj);
    const tmphost = (host === 'localhost:3000') ? host : 'akmmclient-alfa.vercel.app'
    focusUrl = `http://${tmphost}/model?${urlParams}`;
    if (debug) console.log('42 focus', focusUrl);
    const focus = await navigator.clipboard.writeText(focusUrl);
    if (debug) console.log('44 focus', focus);
    // return focus    
  }

  const statusField = (name: string, field: any) => {
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
  const statusFieldLink = (name: string, field: any, link: string) => {
    return (
      <span className="context-item  m-0 p-1">
        <span className="px-2">
          {name}:
        </span>
        <span
          className="px-2 "
        >
          <Link
            className="text-primary"
            href={link}
            target="_blank"
          >
            <span style={{ maxWidth: "300px", backgroundColor: "#fff" }}>{field}</span>
          </Link>
        </span>
      </span>
    );
  }

  const contextRepoDiv =
    <div className="context-list">
      <div className="d-flex flex-wrap justify-content-between align-items-center">
        <div>{statusField('Model', props.ph?.phFocus?.focusModel?.name)}</div>
        <div>{statusField('Modelview', props.ph?.phFocus?.focusModelview?.name)}</div>
        <div>{statusField('Object', props.ph?.phFocus?.focusObject?.name)}</div>
        <div>{statusField('Objectview', props.ph?.phFocus?.focusObjectview?.name)}</div>
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
    </div>


  const toggle = () => setModal(!modal);

  return (
    <>
      {/* <div className="pt-1" style={{backgroundColor: "#b0cfcf"}}></div> */}
      <SelectContext className='ContextModal' phData={props.ph.phData} phFocus={props.ph.phFocus} modal={modal} toggle={toggle} />
      <div className="d-flex justify-content-between align-items-center m-0 p-0 " style={{ backgroundColor: "#ffffed" }}>
        <div className="d-flex border rounded me-1 pe-1" style={{ backgroundColor: "#fffff3" }}>
          {statusFieldLink('Issue', (props.ph?.phFocus?.focusIssue) && '#' + props.ph?.phFocus?.focusIssue?.id + ' ' + props.ph?.phFocus?.focusIssue?.name, `http://github.com/${org}/${repo}/issues/${props.ph?.phFocus?.focusIssue?.id}`)}
          {/* <button
                className="btn btn-sm text-success m-0 px-0 py-0  float-end"
                data-toggle="tooltip"
                data-placement="top"
                data-bs-html="true"
                title="Open a Modal with the FocusIssue!"
                onClick={() =>handleShowIssueModal}
                // onClick={() =>{props.setShowIssueModal(true)}}
                style={{ backgroundColor: "#fff" }}
              >
              <i className="fa fa- fa-plus"></i> 
            </button> */}
        </div>
        <div className="bg-secondary ms-5">|</div>
        {/* <button className="btn btn-sm bg-transparent py-0 ms-1 text-primary " onClick={toggleMinimized}>
          {(minimized) 
            ? <span className="" style={{whiteSpace: 'nowrap',}}>Focus : <i className="fas fa-caret-right fa-lg me-2"></i></span>
            : <span className="" style={{whiteSpace: 'nowrap',}}>Focus : <i className="fas fa-caret-up   fa-lg me-2"></i></span>
          }
        </button>  */}
        {/* <button className="btn btn-sm bg-transparent text-primary px-2 mt-1 pt-0 mx-0"  style={{height: "24px"}} onClick={toggle}>
          <i className="fas fa-edit fa-lg"
          data-toggle="tooltip" data-placement="top" data-bs-html="true" 
          title="Copy current focus/context to clipboard as a link that can be sent to others by e-mail etc."     
          ></i>   
        </button> */}
        <button className="btn btn-sm bg-transparent text-primary py-0 mx-1" onClick={copyToClipboard}>
          <i className="fas fa-copy fa-lg"
            data-toggle="tooltip" data-placement="top" data-bs-html="true"
            title="Copy current focus/context to clipboard. The link can be used in documents,sent to others by e-mail etc."
          ></i>
        </button>
        <span className="" style={{ whiteSpace: 'nowrap' }}>Focus : </span>
        <div className="m-0 p-0">{contextRepoDiv}</div>
        {/* <div className="ms-auto me-1">{statusField('TargetModel', (props.ph?.phFocus?.focusTargetModel) && props.ph?.phFocus?.focusTargetModel)}</div> */}
        <div className="bg-secondary">|</div>
        <div className=" d-flex flex-wrap  ms-0 p-1" style={{ backgroundColor: "#ffffed" }}>
          {statusField('Role', props.ph?.phFocus?.focusRole?.name)}
          {statusField('Task', props.ph?.phFocus?.focusTask?.name)}
        </div>

      </div>
    </>
  )
}

export default ContextView