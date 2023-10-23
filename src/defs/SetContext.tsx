// import SelectContext from '../components/SelectContext'
// Todo:  change name to ViewContext
import { useState } from 'react'
import Link from 'next/link';
import { useRouter } from "next/router";

const SetContext = (props: any) =>  {
  const { query } = useRouter(); // example: http://localhost:3000/modelling?repo=Kavca/kavca-akm-models&path=models&file=AKM-IRTV-Startup.json 
 
  const phFocus = props.ph?.phFocus;
  const repo = (phFocus?.focusProj?.repo) && phFocus.focusProj?.repo;
  const org = (phFocus?.focusProj?.org) && phFocus.focusProj?.org;
  const projectNumber = (phFocus?.focusProj?.projectNumber) && phFocus.focusProj?.projectNumber;

  if (!phFocus) return null;

  const copyToClipboard = async () => { 
    const host = window.location.host;
    const paramFocus = {
      // githubFile: phFocus.focusProj.repo+phFocus.focusProj.branch+phFocus.focusProj.path+phFocus.focusProj.file,
      // focusProj: phFocus.focusProj.id,
      githubFile: {
        org: phFocus.focusProj.org,
        repo: phFocus.focusProj.repo, 
        branch: phFocus.focusProj.branch, 
        path: phFocus.focusProj.path,
        filename: phFocus.focusProj.file,
      },
      focusModel: phFocus.focusModel,
      focusModelview: phFocus.focusModelview,
      focusObject: phFocus.focusObject,
      focusObjectview: phFocus.focusObjectview,
      focusRole: phFocus.focusRole,
      focusTask: phFocus.focusTask,
    };
    console.log('27 paramFocus', paramFocus, phFocus.focusProj);
    const focus = await navigator.clipboard.writeText(`http://${host}/modelling?focus=${JSON.stringify(paramFocus)}`);
    return focus    
  }

  const contextRepoDiv = 
  <div className="context-list d-flex justify-content-between align-items-center px-5 pt-0" style={{ backgroundColor: "#e5e5e5", whiteSpace: "nowrap" }}>
    Focus :
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
            {phFocus.focusProj.name}
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
          href={`https:/github.com/${org}/${repo}`}
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
      <div className="d-flex justify-content-between align-items-center ms-2" >
        <span className="ms-5 bg-light">{contextRepoDiv}</span>
      </div>
      <span className="me-2 bg-light">
        <i className="fas fa-copy fa-lg text-secondary " 
          data-toggle="tooltip" data-placement="top" data-bs-html="true" 
          title="Copy current focus/context to clipboard as a link that can be sent to others by e-mail etc."        
          style={{ }} 
          onClick={copyToClipboard}>
        </i>      
      </span>
    </>
  )
}
          

export default SetContext