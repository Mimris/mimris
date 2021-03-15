// @ts-nocheck
import { useEffect, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux'
import Selector from './utils/Selector'
import { loadState, saveState } from './utils/LocalStorage'
import { FaJoint } from 'react-icons/fa';

const debug = false;

const SelectContext = (props: any) => {
  // console.log('8 8', props.modal);
  const dispatch = useDispatch()
  let state = useSelector((state:any) => state) // Selecting the whole redux store
  if (debug) console.log('12 state', state);
  const metamodels = useSelector(metamodels => state.phData?.metis?.metamodels)  // selecting the models array
  const models = useSelector(models => state.phData?.metis?.models)  // selecting the models array
  const focusModel = useSelector(focusModel => state.phFocus?.focusModel) 
  const focusUser = useSelector(focusUser => state.phUser?.focusUser)
  const focusModelview = useSelector(focusModelview => state.phFocus?.focusModelview)
  
  // const [model, setModel] = useState(focusModel)
  
  const curmodel = models?.find((m: any) => m?.id === focusModel?.id) || models[0]
  const modelviews = curmodel?.modelviews //.map((mv: any) => mv)
  const objects = curmodel?.objects //.map((o: any) => o)
  // const objectviews = curmodel?.objectviews //.map((o: any) => o)
  
  // find object with type
  const objectviews = modelviews?.find(mv => mv.id === focusModelview?.id)?.objectviews || []
  // console.log('25 Sel', curmodel, modelviews, objects, objectviews);
  
  // remove duplicate objects
  const uniqueovs = objectviews?.filter((ov, index, self) =>
    index === self.findIndex((t) => (
      t.place === ov.place && t.id === ov.id
    ))
  ) || []
  const curmm = metamodels?.find(mm => (mm) && mm.id === (curmodel?.metamodelRef))
  
  // find object with type
  const type = (metamodels, model, objects, curov) => {                                                                                                                                                                                          
    const mmod = metamodels?.find(mm => (mm) && mm.id === model.metamodelRef)
    const o = objects.find(o => o.id === curov.objectRef)
    // console.log('37 SelectContext :', curov.objectRef, objects, o, mmod.objecttypes.find(ot => ot.id === o?.typeRef === ot.id));
    const type = mmod?.objecttypes?.find(ot => ot.name && o?.typeRef === ot.id)?.name
    // console.log('43 SelectContext', mmod.objecttypes.name, o, type);
    return type
  }

  // function handleSendContextAsEmail() {
    const emailAddress = 'snorres@gmail.com'
    const subject = "Context subject"
    const bodyFocus = JSON.stringify(props.phFocus)
    // const bodyData = JSON.stringify(state.phData)
    const body = bodyFocus
  const hrefGmail = 'https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to=' + emailAddress+'&subject=' + subject + '&body=' + body
  const hrefEmail = 'mailto:' + emailAddress+'?subject=' + subject + '&body=' + body
  const emailDivGmail = <a href={hrefGmail} target="_blank">Gmail: Send Context (using your Gmail)</a>
  const emailDivMailto = <a href={hrefEmail} target="_blank">Email: Send Context (using your Email)</a>
  // const emailDiv = <a href="mailto:${emailAddress}?subject=${subject}&body=${body}">Send mail with Link to  context</a>
  //https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to=target@email.com&subject=MISSED%20CALL%20EZTRADER&body=Hello%2C%0A%0AI%20tried%20contacting%20you%20today%20but%20you%20seem%20to%20have%20missed%20my%20call.%20%0A%0APlease%20return%20my%20call%20as%20soon%20as%20you%E2%80%99re%20available.%20%0A%0AIn%20any%20case%2C%20I%20will%20try%20ringing%20you%20at%20a%20later%20time.%0A%0A%0ATy%2C%0A%0A%0A%0A
  // console.log('51 SelectContext', emailDivMailto);
  // }
  // const buttonSaveModelStoreDiv = <button className="btn-primary btn-sm ml-2 float-right" onClick={handleSendContextAsEmail} > Save to Server</button >

  const selroles = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Role')
  const seltasks = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Task')
  const selorgs = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Organisation')
  const selprojs = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Projects')
  const selobjviews = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) != null)
  const selPers = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Person')
  const selproperties = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Property')
  const selInfo = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Information')

  console.log('76', uniqueovs, selobjviews);
  
  // let optionModel
  const handlePhDataChange = (event:any) => {
    // const id = JSON.parse(event.value).id
    // const name = JSON.parse(event.value).name
    // console.log('25 selcon', id, name);
    const phData = JSON.parse(event.value)
    const data = phData
    // console.log('38 sel', data);
    (data) && dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
  }
  const handleSessionChange = (event:any) => {
    const id = JSON.parse(event.value).id
    const name = JSON.parse(event.value).name
    // console.log('25 selcon', id, name);
    
    const focusSession = {id: id, name: name}
    const data = focusSession
    // console.log('38 sel', data);
    (data) && dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data })
  }

  useEffect(() => {
    const fU = async () => await focusUser;
    testsession = fU().session;
    // console.log('69', focusUser, testsession);
    try {
      usession =  (testsession) && JSON.parse(testsession);
      // console.log('71', usession);
    } catch (error) {
      {console.error('parserror');}
    }
  }, [focusUser])

  let usession, testsession
    const defaultSession = '{\"session\": {\"id\": 1, \"name\": \"2nd Session\", \"focus\": {\"gojsModel\":{\"nodeDataArray\":[{\"key\":0,\"text\":\"Dummy StartObject 1\",\"color\":\"lightblue\",\"loc\":\"0 0\"},{\"key\":1,\"text\":\"Dummy StartObject 2\",\"color\":\"lightgreen\",\"loc\":\"0 -50\"}],\"linkDataArray\":[{\"key\":-1,\"from\":0,\"to\":1}]},\"gojsMetamodel\":{\"nodeDataArray\":[{\"key\":0,\"text\":\"Dummy Type 1\",\"color\":\"orange\",\"loc\":\"0 0\"},{\"key\":1,\"text\":\"Dummy Type 2\",\"color\":\"red\",\"loc\":\"0 -80\"}],\"linkDataArray\":[]},\"focusModel\":{\"id\":\"39177a38-73b1-421f-f7bf-b1597dcc73e8\",\"name\":\"SF test solution model\"},\"focusObject\":{\"id\":\"UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656\",\"name\":\"Default\",\"sourceName\":\"test\",\"status\":null},\"focusModelview\":{\"id\":\"48913559-2476-4d8e-7faa-a4777553bb0b\",\"name\":\"Main\"},\"focusOrg\":{\"id\":0,\"name\":\"Default\"},\"focusProj\":{\"id\":0,\"name\":\"Default\"},\"focusRole\":{\"id\":\"UUID4_93ABC7D8-2840-41EE-90F5-042E4A7F9FFF\",\"name\":\"Default\"},\"focusCollection\":null,\"focusTask\":{\"id\":\"UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656\",\"name\":\"Default\",\"focus\":{\"focusObject\":{\"id\":\"UUID4_A416FE57-F1A3-4D56-A534-E43C87508465\",\"name\":\"Default\"},\"focusSource\":{\"id\":999,\"name\":\"traversed\"},\"focusCollection\":[]}},\"focusSource\":{\"id\":8,\"name\":\"objectviews\"}},\"ownerId\": 1}}'
    const focuser = defaultSession
    const session0 = JSON.parse(focuser) 
    const session = session0.session.focus
    const phFocus = {phFocus: session}
    function handleSetSession() {
      const data = phFocus.phFocus
      // console.log('87', data);
      dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data })
      dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', sourceFlag })  
    }
    // /**
    // * Build the selection options for all context (focus) objects,
  // */
  // const optionModel = models && [<option key={991011} value='Select Model ...' disabled > Select Model ...</option>, ...models.map((m: any) => <option key={m.id} value={JSON.stringify(m)} > {m.name} </option>)]
  // const model = models?.find((m: any) => m?.id === focusModel?.id)
  // // console.log('79', modelviews);

  // // const modelviews = (model) && model.modelviews.map((o: any) => o)
  // const optionModelviews = modelviews && [<option key={991012} value='Select Modelview ...'  > Select Modelview ...</option>, ...modelviews.map((m: any) => <option key={m.id} value={JSON.stringify(m)}  > {m.name} </option>)]

  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  
  return (
    <>
      <button className="btn-context btn-link btn-sm float-right mb-0 py-0 pr-2" style={{height: "22px"}} color="link" onClick={toggle}>{buttonLabel}
      </button>
      <Modal isOpen={modal} toggle={toggle}  >
        <ModalHeader toggle={toggle}>Set Context: </ModalHeader>
        <ModalBody >
          <div className="context-list1 border-bottom border-dark">Current Context / Focus :<br />
            <span className="context-item">Model: <strong className="focusValue">{ props.phFocus?.focusModel?.name }</strong> </span><br />
            <span className="context-item">Modelview: <strong className="focusValue">{props.phFocus?.focusModelview?.name}</strong> </span><br />
            <span className="context-item">Objectview: <strong className="focusValue">{props.phFocus?.focusObjectview?.name}</strong> </span><br />
            <span className="context-item">Focus Object: <strong className="focusValue">{props.phFocus?.focusObject?.name}</strong> </span><br />
            {/* <span className="context-item">Objecttype: <strong className="focusValue">{props.phFocus?.focusObjecttype?.name}</strong> </span> */}
            {/* <span className="context-item">Objecttypeview: <strong className="focusValue">{props.phFocus?.focusObjecttypeview?.name}</strong> </span> */}
            {/* <span className="context-item">Relshipview: <strong className="focusValue">{props.phFocus?.focusRelshipview?.name}</strong> </span> */}
            {/* <span className="context-item">Relship: <strong className="focusValue">{props.phFocus?.focusRelship?.name}</strong> </span> */}
            {/* <span className="context-item">Relshiptype: <strong className="focusValue"{props.phFocus?.focusRelshiptype?.name}</strong> </span> */}
            <span className="context-item">Org: <strong className="focusValue">{props.phFocus?.focusOrg?.name}</strong> </span><br />
            <span className="context-item">Proj: <strong className="focusValue">{props.phFocus?.focusProj?.name}</strong> </span><br />
            <span className="context-item">Role: <strong className="focusValue">{props.phFocus?.focusRole?.name}</strong> </span><br />
            <span className="context-item">Task: <strong className="focusValue">{props.phFocus?.focusTask?.name}</strong> </span><br />
            {/* <span className="context-item"><SelectContext buttonLabel='Context' className='ContextModal' phFocus={phFocus} /> </span> */}
            {/* <span className="context-item">FocusModel: <strong className="focusValue">{props.phFocus?.focusModel?.name}</strong> </span><br />
            <span className="context-item">FocusModelview: <strong className="focusValue">{props.phFocus?.focusModelview?.name}</strong> </span><br /> */}
            {/* <span className="context-item">Tab: <strong className="focusValue">{pprops.hFocus?.focusTab}</strong> </span> */}
            <span className="context-item">Template: <strong className="focusValue">{props.phFocus?.focusTemplateModel?.name}</strong> </span><br />
            <span className="context-item">TemplateModelview: <strong className="focusValue">{props.phFocus?.focusTemplateModelview?.name}</strong> </span><br />
            <span className="context-item">TargetModel: <strong className="focusValue">{props.phFocus?.focusTargetModel?.name}</strong> </span><br />
            <span className="context-item">TargetModelview: <strong className="focusValue">{props.phFocus?.focusTargetModelview?.name}</strong> </span><br />
          </div>
          <div className="select bg-light pt-0 ">
            <Selector key='Tab' type='SET_FOCUS_TAB' selArray={seltasks} selName='Tab' focustype='focusTab' />
            <Selector key='Task' type='SET_FOCUS_TASK' selArray={seltasks} selName='Tasks' focustype='focusTask' />
            <Selector key='Role'  type='SET_FOCUS_ROLE' selArray={selroles} selName='Roles' focustype='focusRole' />
            {/* <Selector key='Tab'  type='SET_FOCUS_ROLE' selArray={selroles} selName='Roles' focustype='focusRole' /> */}
            {/* <Selector key={selName}  type='SET_FOCUS_ORG' selArray={selorgs} selName='Orgs' focustype='focusOrg'  /> */}
            {/* <Selector key={selName} ' type='SET_FOCUS_ORG' selArray={selorgs} selName='Orgs' focustype='focusOrg' focus={state.phFocus.focusOrg.name} /> */}
            {/* <Selector key={selName}  type='SET_FOCUS_PROJ' selArray={selprojs} selName='Projects' focustype='focusProj' /> */}
            {/* <Selector type='SET_FOCUS_PROJ' selArray={seloprojs} selName='Projects' focustype='focusProj' /> */}
            <Selector key='Objectview'  type='SET_FOCUS_OBJECTVIEW' selArray={selobjviews} selName='Object(view)' focustype='focusObjectview'/>
            {/* <hr style={{ borderTop: "1px solid #8c8b8" , backgroundColor: "#ccc", padding: "1px", marginTop: "5px", marginBottom: "0px" }} /> */}
            {/* <h6>Model repository (Firebase) </h6> */}
            <hr style={{ backgroundColor: "#ccc", padding: "1px", marginTop: "5px", marginBottom: "0px" }} />
          </div>
 
 
        </ModalBody>
          <div className="ml-2">{emailDivGmail}</div>
        <div className="ml-2">{emailDivMailto}</div>
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




// // const genGojsModel =  async () => {
// console.log('44', focusModel);

// const curmod = models.find((m: any) => m.id === focusModel.id)
// // const curmodview= curmod.modelviews.find((mv:any) => mv.id === focusModelview.id)
// console.log('47 sel', curmod, focusModelview.id);
// const nodedataarray = await(curmod.objects) && curmod.objects.map((mv: any, index: any) =>
//   // const nodedataarray = await (curmodview.objectviews) && curmodview.objectviews.map((mv:any, index:any) => 
//   ({ key: index, text: mv.name, color: 'orange', loc: `${index} ${-index * 38}` }
//     // { key: index, text: m.name, label: m.id, color: 'orange', loc: `${index} ${-index} `, group: 0}
//   ))
// const gojsModel = {
//   nodeDataArray: nodedataarray,
//   linkDataArray: []
// }
// console.log('49', gojsModel);
// dispatch({ type: 'SET_GOJS_MODEL', gojsModel })
//   // }
