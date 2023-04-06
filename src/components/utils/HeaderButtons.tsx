// make modul for header buttons

import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { Container, Row, Col } from 'react-bootstrap';

import EditFocusModal from '../EditFocusModal'
import LoginServer from '../loadModelData/LoginServer'
import LoadServer from '../loadModelData/LoadServer'
import LoadLocal from '../loadModelData/LoadLocal'
import LoadFile from '../loadModelData/LoadFile'
import LoadJsonFile from '../loadModelData/LoadJsonFile'
import LoadGitHub from '../loadModelData/LoadGitHub'
import LoadRecovery from '../loadModelData/LoadRecovery';
import { ReadModelFromFile} from './ReadModelFromFile';


import { SaveAllToFile, SaveAllToFileDate } from './SaveModelToFile';

const debug = false;
export default {}

// export default function HeaderButtons(props) {

//     if (!debug) console.log('HeaderButtons', props);
    
//     let focusModel = useSelector(focusModel => props.phFocus?.focusModel) 
//     let focusModelview = useSelector(focusModelview => props.phFocus?.focusModelview) 
//     const focusObjectview = useSelector(focusObjectview => props.phFocus?.focusObjectview) 
//     const focusRelshipview = useSelector(focusRelshipview => props.phFocus?.focusRelshipview) 
//     const focusObjecttype = useSelector(focusObjecttype => props.phFocus?.focusObjecttype) 
//     const focusRelshiptype = useSelector(focusRelshiptype => props.phFocus?.focusRelshiptype) 
//     const phSource = useSelector(phSource => props.phSource) 
//     if (debug) console.log('69 Modelling', focusModel, focusModelview);

//     const refresh = useSelector(refresh => props.refresh)
//     const setRefresh = useSelector(setRefresh => props.setRefresh)

//     function handleSaveAllToFileDate() {
//         const projectname = props.phData.metis.name
//         SaveAllToFileDate({phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser}, projectname, '_PR')
//       }
  
  
//       function handleSaveAllToFile() {
//         const projectname = props.phData.metis.name
//         SaveAllToFile({phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser}, projectname, '_PR')
//       }
      
//       const modelType = 'model'
   
//       const loginserver = (typeof window !== 'undefined') && <LoginServer buttonLabel='Login to Server' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} /> 
//       const loadserver = (typeof window !== 'undefined') && <LoadServer buttonLabel='Server' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} /> 
//       // const loadlocal =  (typeof window !== 'undefined') && <LoadLocal  buttonLabel='Local'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
//       // const loadgitlocal =  (typeof window !== 'undefined') && <LoadSaveGit  buttonLabel='GitLocal'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
//       const loadfile =  (typeof window !== 'undefined') && <LoadFile  buttonLabel='Modelfile'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
//       const loadjsonfile =  (typeof window !== 'undefined') && <LoadJsonFile  buttonLabel='OSDU'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
//       const loadgithub =  (typeof window !== 'undefined') && <LoadGitHub  buttonLabel='GitHub'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
//       const loadrecovery =  (typeof window !== 'undefined') && <LoadRecovery  buttonLabel='Recovery'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
      

//       const EditFocusModalMDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModal buttonLabel='M' className='ContextModal' modelType={'modelview'} ph={props} refresh={refresh} setRefresh={setRefresh} />
//       // const EditFocusModalDiv = <EditFocusModal buttonLabel='Edit' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
//       const EditFocusModalODiv = (focusObjectview?.name || focusObjecttype?.name ) && <EditFocusModal buttonLabel='O' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
//       const EditFocusModalRDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModal className="ContextModal" buttonLabel='R' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
//         // : (focusObjectview.name) && <EditFocusMetamodel buttonLabel='Edit' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
   
  


//     return (
//         <div  style={{  marginLeft: "auto", backgroundColor: "#ddd"}}>

//             <div className="header-buttons" style={{  transform: "scale(0.7)", transformOrigin: "center",  backgroundColor: "#ddd" }}>
//             {/* <span className="spacer m-0 p-0 w-50"></span> */}
//             <span className="buttonrow mr-4 d-flex justify-content-between" style={{ width: "66rem", maxHeight: "9px", minHeight: "30px" }}> 
//             {/* <div className="loadmodel"  style={{ paddingBottom: "2px", backgroundColor: "#ccc", transform: "scale(0.7)",  fontWeight: "bolder"}}> */}
//             {/* <span className=" m-0 px-0 bg-secondary " style={{ minWidth: "125px", maxHeight: "28px", backgroundColor: "#fff"}} > Edit selected :  </span> */}
//             {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Select an Relationship and click to edit properties" > {EditFocusModalRDiv} </span>
//             <span data-bs-toggle="tooltip" data-bs-placement="top" title="Select an Object and click to edit properties" > {EditFocusModalODiv} </span>
//             <span data-bs-toggle="tooltip" data-bs-placement="top" title="Click to edit Model and Modelview properties" > {EditFocusModalMDiv} </span> */}
//             {/* <span className="pt-1 pr-1" > </span> */}
//             <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from file" style={{ minWidth: "108px"}}> {loadfile} </span>
//             <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from OSDU Json file" > {loadjsonfile} </span>
//             {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from localStore or download/upload file" > {loadlocal} </span> */}
//             {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Login to the model repository server (Firebase)" > {loginserver} </span>
//             <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from the model repository server (Firebase)" > {loadserver} </span> */}
//             <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from GitHub" > {loadgithub} </span>
//             <span className="pt" style={{transform: "scale(0.9)",minWidth: "96px"}} >Project files:</span>
//             <span className="  " style={{ minWidth: "220px", maxHeight: "22px", backgroundColor: "#fff"}}>
//                 <input className="select-input" type="file" accept=".json" onChange={(e) => ReadModelFromFile(props, props.dispatch, e)} />
//             </span>
//             <span >
//                 <button 
//                 className="btn-secondary ml-2 mr-2 mb-3 " 
//                 data-toggle="tooltip" data-placement="top" data-bs-html="true" 
//                 title="Click here to Save the Project&#013;(all models and metamodels) to file &#013;(in Downloads folder)"
//                 onClick={handleSaveAllToFile}>Save
//                 </button >
//             </span> 
//             {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from Local Repo" > {loadgitlocal} </span> */}
//             <span data-bs-toggle="tooltip" data-bs-placement="top" title="Recover project from last refresh" > {loadrecovery} </span>
//             <span className="btn px-2 py-0 mt-0 pt-1 bg-light text-secondary float-right"  onClick={props.toggleRefresh} data-toggle="tooltip" data-placement="top" title="Reload the model" > {refresh ? 'reload' : 'reload'} </span>
//             </span> 
//         </div>
//     </div>
//     )
// }