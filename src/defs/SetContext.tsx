// import SelectContext from '../components/SelectContext'
// Todo:  change name to ViewContext
import { useState } from 'react'
import Link from 'next/link';
import { useRouter } from "next/router";

const debug = false

const SetContext = (props: any) =>  {
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

  const contextRepoDiv = 
    <div className="context-list d-flex justify-content-between align-items-center ps-2 pt-0" style={{ backgroundColor: "#e5e5e5" }}>
        <span className="mx-1 bg-">
        <i className="fas fa-copy fa-lg text-secondary " 
          data-toggle="tooltip" data-placement="top" data-bs-html="true" 
          title="Copy current focus/context to clipboard as a link that can be sent to others by e-mail etc."        
          style={{ }} 
          onClick={copyToClipboard}>
        </i>
      </span>
      <span className="border rounded-2">
        Proj:
        <span
          className="border rounded-2 px-1"
          style={{ backgroundColor: "#fff"  }}
        >
          <Link
            className="text-primary"
            href={`https:/github.com/orgs/${org}/projects/${projectNumber}`}
            target="_blank"
          >
            <span >
              {phFocus.focusProj?.name}
            </span>
          </Link>
        </span>
      </span>
      <span className="border rounded-2">
        Repo:
        <span
          className="border rounded-2 px-1"
          style={{ backgroundColor: "#fff" }}
        >
          <Link
            className="text-primary"
            href={`https:/github.com/${org}/${repo}/tree/${branch}/${path}`}
            target="_blank"
          >
            <span >{repo}</span>
          </Link>
        </span>
      </span>
      <span className="context-item">
        <span className="px-1 border rounded-2">
          Model:
        </span>
        <span
          className="border rounded-2 px-1"
          style={{ backgroundColor: "#fff" }}
        >
          {phFocus?.focusModel?.name}
        </span>
      </span>
      <span 
        className="border rounded-2">
        Modelview:
        <span
          className="border rounded-2 px-1"
          style={{ backgroundColor: "#fff" }}
        >
          {phFocus?.focusModelview?.name}
        </span>
      </span>
      <span 
        className="border rounded-2">
        Object:
        <span
          className="border rounded-2 px-1"
          style={{ backgroundColor: "#fff" }}
        >
          {phFocus?.focusObject?.name}
        </span>
      </span>
      <span 
        className="border rounded-2">
        Objectview:
        <span
          className="border rounded-2 px-1"
          style={{ backgroundColor: "#fff" }}
        >
          {phFocus?.focusObjectview?.name}
        </span>
      </span>
      <span 
        className="border rounded-2"
        >
        Role:
        <span
          className="border rounded-2 px-1"
          style={{ backgroundColor: "#fff" }}
        >
          {phFocus?.focusRole?.name}
        </span>
      </span>
      <span
        className="border rounded-2"
        >
        Task:
        <span
          className="border rounded-2 px-1"
          style={{ backgroundColor: "#fff" }}
          >
          {phFocus?.focusTask?.name}
        </span>
      </span>

    </div>

  return (
    <>
      <div className="d-flex justify-content-left align-items-center ms-0" >
        <span className="text-primary " onClick={toggleMinimized}>
          {(minimized) 
            ? <span className="fs-5"><i className="fas fa-caret-down fa-lg fs-4"> </i> Focus : </span>
            : <span className="fs-5"><i className="fas fa-caret-up fa-lg fs-4"> </i> Focus : </span>
          }
        </span>
        {(minimized) 
          ? <span className="ms-3">{contextRepoDiv}</span>
          : <div className=""><span className="ms-3">{contextRepoDiv}</span></div>
        }
      </div>
    </>
  )
}

export default SetContext