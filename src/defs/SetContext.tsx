
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
    <div className="context-list d-flex justify-content-around flex-grow-1 px-1"> Context :
      <span className="context-item"> Model: <strong>{ phFocus?.focusModel?.name }</strong> </span> |
      <span className="context-item "> Modelview: <strong>{ phFocus?.focusModelview?.name } </strong> </span> 
      <span className="context-item"> Object: <strong>{phFocus?.focusObject?.name}</strong> </span> |
      <span className="context-item"> Role: <strong>{phFocus?.focusRole?.name}</strong> </span> |
      <span className="context-item"> Task: <strong>{phFocus?.focusTask?.name}</strong> </span>
    </div>

  const contextModelDiv = 
    <div className="context-list d-flex justify-content-around align-items-center flex-grow-1"> Context 2:
      <span className="context-item"> Org: <strong>{phFocus?.focusProj?.org}</strong> </span> | 
      <span  data-bs-toggle="tooltip" data-bs-placement="top" title="Link to GitHub Repo for this model" > Repo: <Link className='text-primary ' href={`https:/github.com/${org}/${repo}`} target="_blank"> <strong>{repo}</strong> </Link></span> |
      <span data-bs-toggle="tooltip" data-bs-placement="top" title="Link to GitHub Project for this model" > Proj: {<Link className='text-primary ' href={`https:/github.com/orgs/${org}/projects/${projectNumber}`} target="_blank">  <strong>{phFocus.focusProj.name}</strong></Link>}</span> |
      <span className="context-item"> Model: <strong>{ phFocus?.focusModel?.name }</strong> </span> |
      <span className="context-item"> Objectview: <strong>{phFocus?.focusObjectview?.name}</strong> </span> |

  </div>

  const contextDiv = (toggle) ? {contextRepoDiv} : {contextModelDiv}
  
  return (
    <>
      {toggle ? contextRepoDiv : contextModelDiv}
      <button className="btn btn-sm my-0 py-0 bg-light text-dark" onClick={toggleContext} style={{height: "24px", backgroundColor: "#cdd"}}>
        {(toggle) ? <span>&gt;</span> : <span >&lt;</span> }
        {/* {(toggle) ? <span className="toggle-btn.active arrow arrow::before active">  </span> : <span className="toggle-btn arrow arrow::after"></span> } */}
      </button> 
    </>
  )
}
          
export default SetContext



      // {/* <span className="context-item">Objecttype: <strong>{phFocus?.focusObjecttype?.name}</strong> </span>| */}
      // {/* <span className="context-item">Objecttypeview: <strong>{phFocus?.focusObjecttypeview?.name}</strong> </span>| */}
      // {/* <span className="context-item">Relshipview: <strong>{phFocus?.focusRelshipview?.name}</strong> </span>| */}
      // {/* <span className="context-item">Relship: <strong>{phFocus?.focusRelship?.name}</strong> </span>| */}
      // {/* <span className="context-item">Relshiptype: <strong>{phFocus?.focusRelshiptype?.name}</strong> </span>| */}
      // {/* <span className="context-item"><SelectContext buttonLabel='Context' className='ContextModal' phFocus={phFocus} /> </span>| */}
      // {/* <span className="context-item">FocusModel: <strong>{phFocus?.focusModel?.name}</strong> </span>|
      // <span className="context-item">FocusModelview: <strong>{phFocus?.focusModelview?.name}</strong> </span>| */}
      // {/* <span className="context-item">Tab: <strong>{phFocus?.focusTab}</strong> </span>  */}
      // {/* <span className="context-item">Template: <strong>{phFocus?.focusTemplateModel?.name}</strong> </span>|
      // <span className="context-item">TemplateModelview: <strong>{phFocus?.focusTemplateModelview?.name}</strong> </span>|
      // <span className="context-item">TargetModel: <strong>{phFocus?.focusTargetModel?.name}</strong> </span>|
      // <span className="context-item">TargetModelview: <strong>{phFocus?.focusTargetModelview?.name}</strong> </span>| */}