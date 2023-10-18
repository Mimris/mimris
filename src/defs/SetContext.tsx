
// import SelectContext from '../components/SelectContext'
// Todo:  change name to ViewContext
import { useState } from 'react'
import Link from 'next/link';

const SetContext = (props: any) =>  {
 
  const phFocus = props.ph?.phFocus;
  const phData = props.ph?.phData;
  const repo = (phFocus?.focusProj?.repo) && phFocus.focusProj?.repo;
  const org = (phFocus?.focusProj?.org) && phFocus.focusProj?.org;
  const projectNumber = (phFocus?.focusProj?.projectNumber) && phFocus.focusProj?.projectNumber;

  //  dconsole.log('11 SetContext: phFocus', props.ph.phFocus.focusObject?.name, phFocus.focusObject?.name, props);
  const [toggle, setToggle] = useState(true);

  const toggleContext = () => {
    setToggle(!toggle);
  }

  const contextRepoDiv = 
  <div className="context-list d-flex justify-content-between align-items-center px-4 pt-0" style={{ backgroundColor: "#e5e5e5", whiteSpace: "nowrap" }}>
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
      className="border rounded-2 px-1gi"
       style={{ backgroundColor: "#fff" }}
      >
      {phFocus?.focusTask?.name}
    </span>
  </span>
</div>

  // const contextModelDiv = 
  //   <div className="context-list d-flex justify-content-between align-items-center flex-grow-1">Context 2:
  //     <span className="context-item"> Org: <span>{phFocus?.focusProj?.org}</span> </span> | 
  //     <span  data-bs-toggle="tooltip" data-bs-placement="top" title="Link to GitHub Repo for this model" > Repo: <Link className='text-primary ' href={`https:/github.com/${org}/${repo}`} target="_blank"> <span>{repo}</span> </Link></span> |
  //     <span data-bs-toggle="tooltip" data-bs-placement="top" title="Link to GitHub Project for this model" > Proj: {<Link className='text-primary ' href={`https:/github.com/orgs/${org}/projects/${projectNumber}`} target="_blank">  <span>{phFocus.focusProj.name}</span></Link>}</span>
  // </div>

  // const contextDiv = (toggle) ? {contextRepoDiv} : {contextModelDiv}
  
  return (
    <>
      <div className="d-flex justify-content-between align-items-center ms-2" >
        {/* <span className="ms-5">{toggle ? contextRepoDiv : contextModelDiv}</span> */}
        <span className="ms-5 bg-light">{contextRepoDiv}</span>

        {/* <button className="btn btn-sm my-0 mx-1 py-0 bg-light text-dark" onClick={toggleContext} style={{height: "24px", backgroundColor: "#cdd"}}> */}
          {/* {(toggle) ? <span>&gt;</span> : <span >&lt;</span> } */}
          {/* {(toggle) ? <span className="toggle-btn.active arrow arrow::before active">  </span> : <span className="toggle-btn arrow arrow::after"></span> } */}
        {/* </button>  */}
      </div>
    </>
  )
}
          
export default SetContext



      // {/* <span className="context-item">Objecttype: <span>{phFocus?.focusObjecttype?.name}</span> </span>| */}
      // {/* <span className="context-item">Objecttypeview: <span>{phFocus?.focusObjecttypeview?.name}</span> </span>| */}
      // {/* <span className="context-item">Relshipview: <span>{phFocus?.focusRelshipview?.name}</span> </span>| */}
      // {/* <span className="context-item">Relship: <span>{phFocus?.focusRelship?.name}</span> </span>| */}
      // {/* <span className="context-item">Relshiptype: <span>{phFocus?.focusRelshiptype?.name}</span> </span>| */}
      // {/* <span className="context-item"><SelectContext buttonLabel='Context' className='ContextModal' phFocus={phFocus} /> </span>| */}
      // {/* <span className="context-item">FocusModel: <span>{phFocus?.focusModel?.name}</span> </span>|
      // <span className="context-item">FocusModelview: <span>{phFocus?.focusModelview?.name}</span> </span>| */}
      // {/* <span className="context-item">Tab: <span>{phFocus?.focusTab}</span> </span>  */}
      // {/* <span className="context-item">Template: <span>{phFocus?.focusTemplateModel?.name}</span> </span>|
      // <span className="context-item">TemplateModelview: <span>{phFocus?.focusTemplateModelview?.name}</span> </span>|
      // <span className="context-item">TargetModel: <span>{phFocus?.focusTargetModel?.name}</span> </span>|
      // <span className="context-item">TargetModelview: <span>{phFocus?.focusTargetModelview?.name}</span> </span>| */}