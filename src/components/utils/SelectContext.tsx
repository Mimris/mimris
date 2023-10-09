// @ts-nocheck
import { useEffect, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux'
import '@fortawesome/fontawesome-free/css/all.css';
import Selector from './Selector'
import Context from '../Context'
import EditFocusParameter from '../forms/EditFocusParameter'
// import { loadState, saveState } from '../utils/LocalStorage'
// import { FaJoint } from 'react-icons/fa';

const debug = false;

const SelectContext = (props: any) => {
  if (debug) console.log('12 ', props);
  const dispatch = useDispatch();
  let state = useSelector((state:any) => state) // Selecting the whole redux store

  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
 
  const models = useSelector(models =>  state.phData?.metis?.models)  // selecting the models array 
  const { buttonLabel, className } = props;

  

  return (models) && (
    < >
      <button className="btn-sm bg-light mt-0 p-1 pt-0 mr-2 border rounded " style={{height: "24px"}} color="link" onClick={toggle}>{buttonLabel}
      </button>
      <Modal isOpen={modal} toggle={toggle}  >
        <ModalHeader toggle={toggle}>Set Context: </ModalHeader>
        <ModalBody >
          <EditFocusParameter phFocus={props.phFocus} models={props.phData.metis.models}/>
          {/* <Context /> */}
        </ModalBody>
          {/* <div className="ml-2">{emailDivGmail}</div>
        <div className="ml-2">{emailDivMailto}</div> */}
        <ModalFooter>
          {/* <Button color="primary" onClick={toggle}>Set</Button>{' '} */}
          <Button color="link" onClick={toggle}>Exit</Button>
        </ModalFooter>
      </Modal>
    
   
      <style jsx>{`
    
            `}</style> 
    </>
  )
}
    
export default SelectContext




{/* <form>
<div className="context-list1 border-bottom border-dark">
  <h4>Current Context / Focus:</h4>
  <div className="form-group row">
    <label htmlFor="model" className="col-sm-3 col-form-label">Model:</label>
    <div className="col-sm-8">
      <input type="text" className="form-control" id="model" value={model} readOnly={!isEditing} onChange={(event) => setModel(event.target.value)} />
    </div>
    <div className="col-sm-1 pt-1 px-0">
      {isEditing ? (
        <button type="button" className="btn btn-sm btn-primary" onClick={() => handleSave('model')} data-toggle="tooltip" data-placement="top" title="Save">
          <i className="fas fa-save fa-fw"></i>
        </button>
      ) : (
        <button type="button" className="btn btn-sm btn-primary" onClick={() => handleEdit('model')} data-toggle="tooltip" data-placement="top" title="Edit">
          <i className="fas fa-edit fa-fw"></i>
        </button>
      )}
    </div>
  </div>
  <div className="form-group row">
    <label htmlFor="modelview" className="col-sm-3 col-form-label">Modelview:</label>
    <div className="col-sm-9">
      <input type="text" className="form-control" id="modelview" value={props.phFocus?.focusModelview?.name} />
    </div>
  </div>
  <div className="form-group row">
    <label htmlFor="objectview" className="col-sm-3 col-form-label">Objectview:</label>
    <div className="col-sm-9">
      <input type="text" className="form-control" id="objectview" value={props.phFocus?.focusObjectview?.name} />
    </div>
  </div>
  <div className="form-group row">
    <label htmlFor="focusObject" className="col-sm-3 col-form-label">Focus Object:</label>
    <div className="col-sm-9">
      <input type="text" className="form-control" id="focusObject" value={props.phFocus?.focusObject?.name} />
    </div>
  </div>
  <div className="form-group row">
    <label htmlFor="org" className="col-sm-3 col-form-label">Org:</label>
    <div className="col-sm-9">
      <input type="text" className="form-control" id="org" value={props.phFocus?.focusOrg?.name} />
    </div>
  </div>
  <div className="form-group row">
    <label htmlFor="proj" className="col-sm-3 col-form-label">Proj:</label>
    <div className="col-sm-9">
      <input type="text" className="form-control" id="proj" value={props.phFocus?.focusProj?.name} />
    </div>
  </div>
  <div className="form-group row">
    <label htmlFor="role" className="col-sm-3 col-form-label">Role:</label>
    <div className="col-sm-9">
      <input type="text" className="form-control" id="role" value={props.phFocus?.focusRole?.name} />
    </div>
  </div>
  <div className="form-group row">
    <label htmlFor="task" className="col-sm-3 col-form-label">Task:</label>
    <div className="col-sm-9">
      <input type="text" className="form-control" id="task" value={props.phFocus?.focusTask?.name} />
    </div>
  </div>
  <div className="form-group row">
    <label htmlFor="template" className="col-sm-3 col-form-label">Template:</label>
    <div className="col-sm-9">
      <input type="text" className="form-control" id="template" value={props.phFocus?.focusTemplateModel?.name} />
    </div>
  </div>
  <div className="form-group row">
    <label htmlFor="templateModelview" className="col-sm-3 col-form-label">TemplateModelview:</label>
    <div className="col-sm-9">
      <input type="text" className="form-control" id="templateModelview" value={props.phFocus?.focusTemplateModelview?.name} />
    </div>
  </div>
  <div className="form-group row">
    <label htmlFor="targetModel" className="col-sm-3 col-form-label">TargetModel:</label>
    <div className="col-sm-9">
      <input type="text" className="form-control" id="targetModel" value={props.phFocus?.focusTargetModel?.name} />
    </div>
  </div>
  <div className="form-group row">
    <label htmlFor="targetModelview" className="col-sm-3 col-form-label">TargetModelview:</label>
    <div className="col-sm-9">
      <input type="text" className="form-control" id="targetModelview" value={props.phFocus?.focusTargetModelview?.name} />
    </div>
  </div>
</div>
</form> */}









  // const handlePhDataChange = (event:any) => {
  //   // const id = JSON.parse(event.value).id
  //   // const name = JSON.parse(event.value).name
  //   // if (debug) console.log('25 selcon', id, name);
  //   const phData = JSON.parse(event.value)
  //   let data = phData
  //   // if (debug) console.log('38 sel', data);
  //   (data) && dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
  // }

  // const handleSessionChange = (event:any) => {
  //   const id = JSON.parse(event.value).id
  //   const name = JSON.parse(event.value).name
  //   // if (debug) console.log('25 selcon', id, name);
    
  //   const focusSession = {id: id, name: name}
  //   const data = focusSession
  //   // if (debug) console.log('38 sel', data);
  //   (data) && dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data })
  // }
  // function handleSendContextAsEmail() {
  //   const emailAddress = 'snorres@gmail.com'
  //   const subject = "Context subject"
  //   const bodyFocus = JSON.stringify(props.phFocus)
  //   // const bodyData = JSON.stringify(state.phData)
  //   const body = bodyFocus
  // const hrefGmail = 'https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to=' + emailAddress+'&subject=' + subject + '&body=' + body
  // const hrefEmail = 'mailto:' + emailAddress+'?subject=' + subject + '&body=' + body
  // const emailDivGmail = <a href={hrefGmail} target="_blank">Gmail: Send Context (using your Gmail)</a>
  // const emailDivMailto = <a href={hrefEmail} target="_blank">Email: Send Context (using your Email)</a>
  // const emailDiv = <a href="mailto:${emailAddress}?subject=${subject}&body=${body}">Send mail with Link to  context</a>
  //https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to=target@email.com&subject=MISSED%20CALL%20EZTRADER&body=Hello%2C%0A%0AI%20tried%20contacting%20you%20today%20but%20you%20seem%20to%20have%20missed%20my%20call.%20%0A%0APlease%20return%20my%20call%20as%20soon%20as%20you%E2%80%99re%20available.%20%0A%0AIn%20any%20case%2C%20I%20will%20try%20ringing%20you%20at%20a%20later%20time.%0A%0A%0ATy%2C%0A%0A%0A%0A
  // if (debug) console.log('51 SelectContext', emailDivMailto);
  // }
  // const buttonSaveModelStoreDiv = <button className="btn-primary btn-sm ml-2 float-right" onClick={handleSendContextAsEmail} > Save to Server</button >

  // const selroles = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Role')
  // const seltasks = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Task')
  // const selorgs = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Organisation')
  // // const selprojs = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Projects')
  // const selobjviews = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) != null)
  // const selPers = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Person')
  // const selproperties = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Property')
  // const selInfo = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Information')

  // if (debug) console.log('76', uniqueovs, selobjviews);
  
  // let optionModel


  // useEffect(() => {
  //   const fU = async () => await focusUser;
  //   testsession = fU().session;
  //   // if (debug) console.log('69', focusUser, testsession);
  //   try {
  //     usession =  (testsession) && JSON.parse(testsession);
  //     // if (debug) console.log('71', usession);
  //   } catch (error) {
  //     {console.error('parserror');}
  //   }
  // }, [focusUser])

  // let usession, testsession
  //   const defaultSession = '{\"session\": {\"id\": 1, \"name\": \"2nd Session\", \"focus\": {\"gojsModel\":{\"nodeDataArray\":[{\"key\":0,\"text\":\"Dummy StartObject 1\",\"color\":\"lightblue\",\"loc\":\"0 0\"},{\"key\":1,\"text\":\"Dummy StartObject 2\",\"color\":\"lightgreen\",\"loc\":\"0 -50\"}],\"linkDataArray\":[{\"key\":-1,\"from\":0,\"to\":1}]},\"gojsMetamodel\":{\"nodeDataArray\":[{\"key\":0,\"text\":\"Dummy Type 1\",\"color\":\"orange\",\"loc\":\"0 0\"},{\"key\":1,\"text\":\"Dummy Type 2\",\"color\":\"red\",\"loc\":\"0 -80\"}],\"linkDataArray\":[]},\"focusModel\":{\"id\":\"39177a38-73b1-421f-f7bf-b1597dcc73e8\",\"name\":\"SF test solution model\"},\"focusObject\":{\"id\":\"UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656\",\"name\":\"Default\",\"sourceName\":\"test\",\"status\":null},\"focusModelview\":{\"id\":\"48913559-2476-4d8e-7faa-a4777553bb0b\",\"name\":\"Main\"},\"focusOrg\":{\"id\":0,\"name\":\"Default\"},\"focusProj\":{\"id\":0,\"name\":\"Default\"},\"focusRole\":{\"id\":\"UUID4_93ABC7D8-2840-41EE-90F5-042E4A7F9FFF\",\"name\":\"Default\"},\"focusCollection\":null,\"focusTask\":{\"id\":\"UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656\",\"name\":\"Default\",\"focus\":{\"focusObject\":{\"id\":\"UUID4_A416FE57-F1A3-4D56-A534-E43C87508465\",\"name\":\"Default\"},\"focusSource\":{\"id\":999,\"name\":\"traversed\"},\"focusCollection\":[]}},\"focusSource\":{\"id\":8,\"name\":\"objectviews\"}},\"ownerId\": 1}}'
  //   const focuser = defaultSession
  //   const session0 = JSON.parse(focuser) 
  //   const session = session0.session.focus
  //   const phFocus = {phFocus: session}
  //   function handleSetSession() {
  //     const data = phFocus.phFocus
  //     // if (debug) console.log('87', data);
  //     dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data })
  //     dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', sourceFlag })  
  //   }
    // /**
    // * Build the selection options for all context (focus) objects,
  // */
  // const optionModel = models && [<option key={991011} value='Select Model ...' disabled > Select Model ...</option>, ...models.map((m: any) => <option key={m.id} value={JSON.stringify(m)} > {m.name} </option>)]
  // const model = models?.find((m: any) => m?.id === focusModel?.id)
  // // if (debug) console.log('79', modelviews);

  // // const modelviews = (model) && model.modelviews.map((o: any) => o)
  // const optionModelviews = modelviews && [<option key={991012} value='Select Modelview ...'  > Select Modelview ...</option>, ...modelviews.map((m: any) => <option key={m.id} value={JSON.stringify(m)}  > {m.name} </option>)]





// // <div className="modal fade" id="SelectContext">         {/* <!-- The Modal --> */}
// <div>
//   <div className="modal" id="SelectContext">
//     <div className="modal-dialog" >
//       <div className="modal-content" >
//         <div className="modal-header" style={{ paddingBottom: "2px" }}>
//           <h4 className="modal-title">Select Context Items</h4>
//           <button type="button" className="close" data-dismiss="modal">×</button>
//         </div>
//         {/* <!-- Modal body --> */}
//         <div className="modal-body" style={{ paddingTop: "0px" }}>
//           <div className="edit bg-light pt-2 ">
//             <div className="select" style={{ paddingTop: "4px" }}>Model:
//                   <select className="list-obj bg-link float-right" defaultValue="Select Model ..." style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
//                 onChange={(event) => handleModelChange({ value: event.target.value })} name="Focus Model">
//                 {optionModel}
//               </select>
//             </div>
//             <div className="select" style={{ paddingTop: "4px" }}>Modelview:
//                   <select className="list-obj bg-link float-right" defaultValue="Select Modelview ..." style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
//                 onChange={(event) => handleModelviewChange({ value: event.target.value })} name="Focus Modelview ...">
//                 {optionModelviews}
//               </select>
//             </div>

//             <hr style={{ backgroundColor: "#ccc", padding: "1px", marginTop: "5px", marginBottom: "0px" }} />

//             <div className="select" style={{ paddingTop: "4px" }}>Object:
//                   <select className="list-obj float-right" defaultValue="Select Fccusobject..." style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
//                 onChange={(event) => handleObjectChange({ value: event.target.value })} name="Focus Object">
//                 {optionObject}
//               </select>
//             </div>
//             <div className="select" style={{ paddingTop: "4px" }}>Organization:
//                   <select className="list-obj float-right" defaultValue="Select Organization ..." style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
//                 onChange={(event) => handleOrgChange({ value: event.target.value })} name="Focus Organization">
//                 {optionOrg}
//               </select>
//             </div>
//             <div className="select" style={{ paddingTop: "4px" }}>Project:
//                   <select className="list-obj float-right" defaultValue="Select Project ..." style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
//                 onChange={(event) => handleProjChange({ value: event.target.value })} name="Focus Project ">
//                 {optionProj}
//               </select>
//             </div>
//           </div>
//           {/* {editColl} */}
//         </div>
//         {/* <!-- Modal footer --> */}
//         <div className="modal-footer" style={{ padding: "0px" }}>
//           <button type="button" className="btn-link btn-sm" data-dismiss="modal" >Close</button>
//         </div>
//       </div>
//     </div>
//   </div>




// // const GenGojsModel =  async () => {
// if (debug) console.log('44', focusModel);

// const curmod = models.find((m: any) => m.id === focusModel.id)
// // const curmodview= curmod.modelviews.find((mv:any) => mv.id === focusModelview.id)
// if (debug) console.log('47 sel', curmod, focusModelview.id);
// const nodedataarray = await(curmod.objects) && curmod.objects.map((mv: any, index: any) =>
//   // const nodedataarray = await (curmodview.objectviews) && curmodview.objectviews.map((mv:any, index:any) => 
//   ({ key: index, text: mv.name, color: 'orange', loc: `${index} ${-index * 38}` }
//     // { key: index, text: m.name, label: m.id, color: 'orange', loc: `${index} ${-index} `, group: 0}
//   ))
// const gojsModel = {
//   nodeDataArray: nodedataarray,
//   linkDataArray: []
// }
// if (debug) console.log('49', gojsModel);
// dispatch({ type: 'SET_GOJS_MODEL', gojsModel })
//   // }
