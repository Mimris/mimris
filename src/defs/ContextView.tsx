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
          <span className="context-item">
            <span className="px-1 border rounded-2">
              {name}:
            </span>
            <span className="border rounded-2 px-1" style={{ backgroundColor: "#fff", whiteSpace: "nowrap" }}>
              {field}
            </span>
          </span>
        );
      }
      const statusFieldLink = (name, field, link) => {  
        return (
          <span className="context-item">
            <span className="px-2 border rounded-2">
              {name}:
            </span>
            <span
              className="border rounded-2 px-2"
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
    <div className="context-list bg-transparent pt-0" style={{ backgroundColor: "#e5e5e5" }}>
      <div className="d-flex justify-contents-between align-items-center">
        {statusFieldLink('Repo', repo, `https:/github.com/${org}/${repo}/tree/${branch}/${path}`)}
        {statusFieldLink('Project', phFocus.focusProj?.name, `https:/github.com/orgs/${org}/projects/${projectNumber}`)}
        {statusField('Role', props.ph?.phFocus?.focusRole?.name)}
        {statusField('Task', props.ph?.phFocus?.focusTask?.name)}
        {statusFieldLink('Issues', props.ph?.phFocus?.focusIssue?.name, `https:/github.com/${org}/${repo}/issues/${props.ph?.phFocus?.focusIssue?.id}`)}
      </div>
      <hr className="m-1 bg-primary" style={{ height: "4px" }} />
      {(!minimized) && 
        <div className="d-flex ps-1 pb-1 justify-contents-between align-items-center">
          {statusField('Model', props.ph?.phFocus?.focusModel?.name)}
          {statusField('Modelview', props.ph?.phFocus?.focusModelview?.name)}
          {statusField('Object', props.ph?.phFocus?.focusObject?.name)}
          {statusField('Objectview', props.ph?.phFocus?.focusObjectview?.name)}
        </div>
      }
    </div>

  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);

  return (
    <>
      <div className="d-flex justify-content-left align-items-center bg-transparent m-0" >
        <SelectContext className='ContextModal' phData={props.ph.phData} phFocus={props.ph.phFocus} modal={modal} toggle={toggle} />
        <button className="btn btn-sm bg-transparent text-primary ms-1 px-2 pt-0 " style={{height: "20px"}} onClick={toggleMinimized}>
          {(minimized) 
            ? <span className=""><i className="fas fa-caret-down fa-lg"></i> Focus : </span>
            : <span className=""><i className="fas fa-caret-up   fa-lg"></i> Focus : </span>
          }
        </button> 
        <button className="btn btn-sm bg-transparent text-primary px-2 mt-1 pt-0 mx-0"  style={{height: "24px"}} onClick={toggle}>
          <i className="fas fa-edit fa-lg"
            data-toggle="tooltip" data-placement="top" data-bs-html="true" 
            title="Copy current focus/context to clipboard as a link that can be sent to others by e-mail etc."     
          ></i>   
        </button>
        <button className="btn btn-sm bg-transparent text-primary mt-1 pt-0 mx-0" style={{height: "24px"}} onClick={copyToClipboard}>
          <i className="fas fa-copy fa-lg " 
            data-toggle="tooltip" data-placement="top" data-bs-html="true" 
            title="Copy current focus/context to clipboard as a link that can be sent to others by e-mail etc."        
          ></i>
        </button>
        <span className="ms-3">{contextRepoDiv}</span>
      </div>
    </>
  )
}

export default ContextView