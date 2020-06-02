// @ts-nocheck
import { useEffect, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux'
import { loadState, saveState } from './utils/LocalStorage'
import { FaJoint } from 'react-icons/fa';

const SelectContext = (props: any) => {
  // console.log('8 8', props.modal);
  let state = useSelector((state:any) => state) // Selecting the whole redux store
  const models = useSelector(models => state.phData?.metis?.models)  // selecting the models array
  const focusModel = useSelector(focusModel => state.phFocus?.focusModel) 
  const focusUser = useSelector(focusUser => state.phUser?.focusUser)
  // const focusModelview = useSelector(focusModelview => state.phFocus.focusModelview)
  
  // const [model, setModel] = useState(focusModel)
  // console.log('16 Sel', models, focusModel, state);

  const dispatch = useDispatch()
  // const { register, handleSubmit, errors } = useForm()

  let optionModel

  const handlePhDataChange = (event:any) => {
    // const id = JSON.parse(event.value).id
    // const name = JSON.parse(event.value).name
    // console.log('25 selcon', id, name);
    const phData = JSON.parse(event.value)
    const data = phData
    // console.log('38 sel', data);
    (data) && dispatch({ type: 'SET_FOCUS_PHDATA', data })
  }
  const handleSessionChange = (event:any) => {
    const id = JSON.parse(event.value).id
    const name = JSON.parse(event.value).name
    // console.log('25 selcon', id, name);
    
    const focusSession = {id: id, name: name}
    const data = focusSession
    // console.log('38 sel', data);
    (data) && dispatch({ type: 'SET_FOCUS_PHFOCUS', data })
  }
  const handleModelChange = (event:any) => {
    const id = JSON.parse(event.value).id
    const name = JSON.parse(event.value).name
    const focusModel = {id: id, name: name}
    const data = focusModel
    // console.log('38 sel', data);
    dispatch({ type: 'SET_FOCUS_MODEL', data })
  }
  const handleModelviewChange = (event: any) => {
    const id = JSON.parse(event.value).id
    const name = JSON.parse(event.value).name
    const focusModelview = { id: id, name: name }
    const data = focusModelview
    // console.log('62 sel', data);
    dispatch({ type: 'SET_FOCUS_MODELVIEW', data })
  }
  const handleObjectChange = (event: any) => {
    const id = JSON.parse(event.value).id
    const name = JSON.parse(event.value).name
    const data ={focusObject:{id:id,name:name}}
    dispatch({ type: 'SET_FOCUS_OBJECT', data })
  }
  const handleOrgChange = (event: any) => {
    const id = JSON.parse(event.value).id
    const name = JSON.parse(event.value).name
    const data ={focusObject:{id:id,name:name}}
    dispatch({ type: 'SET_FOCUS_ORG', data })
  }
  const handleProjChange = (event: any) => {
    const id = JSON.parse(event.value).id
    const name = JSON.parse(event.value).name
    const data ={focusProj:{id:id,name:name}}
    dispatch({ type: 'SET_FOCUS_PROJ', data })
  }
  let usession, testsession

  useEffect(() => {
      const fU = async () => await focusUser;
      testsession = fU().session;
      // console.log('69', focusUser, testsession);
        try {
          usession =  (testsession) && JSON.parse(testsession);
          // console.log('71', usession);
          
        } catch (error) {
        {console.error('parserror');
        }
      }
  }, [focusUser])

    // /**
    // * Build the selection options for all context (focus) objects,
    // */
    // const optionSession = sessions && [<option key={991009} value='Select Session ...' disabled > Select Modelview ...</option>, <option key={991010} value={JSON.stringify(sessions)} > {focusUser.name} </option> ]
    // console.log('72', optionSession);
    
    
    // const defaultSession = {focusUser: {id: 1, name: 'Snorre', email: 'sf@sf.com', session: '{\"id\": 1, \"name\": \"2nd Session\", \"focus\": \"{\"gojsModel\":{\"nodeDataArray\":[{\"key\":0,\"text\":\"Dummy StartObject 1\",\"color\":\"lightblue\",\"loc\":\"0 0\"},{\"key\":1,\"text\":\"Dummy StartObject 2\",\"color\":\"lightgreen\",\"loc\":\"0 -50\"}],\"linkDataArray\":[{\"key\":-1,\"from\":0,\"to\":1}]},\"gojsMetamodel\":{\"nodeDataArray\":[{\"key\":0,\"text\":\"Dummy Type 1\",\"color\":\"orange\",\"loc\":\"0 0\"},{\"key\":1,\"text\":\"Dummy Type 2\",\"color\":\"red\",\"loc\":\"0 -80\"}],\"linkDataArray\":[]},\"focusModel\":{\"id\":\"39177a38-73b1-421f-f7bf-b1597dcc73e8\",\"name\":\"SF test solution model\"},\"focusObject\":{\"id\":\"UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656\",\"name\":\"Default\",\"sourceName\":\"test\",\"status\":null},\"focusModelview\":{\"id\":\"48913559-2476-4d8e-7faa-a4777553bb0b\",\"name\":\"Main\"},\"focusOrg\":{\"id\":0,\"name\":\"Default\"},\"focusProj\":{\"id\":0,\"name\":\"Default\"},\"focusRole\":{\"id\":\"UUID4_93ABC7D8-2840-41EE-90F5-042E4A7F9FFF\",\"name\":\"Default\"},\"focusCollection\":null,\"focusTask\":{\"id\":\"UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656\",\"name\":\"Default\",\"focus\":{\"focusObject\":{\"id\":\"UUID4_A416FE57-F1A3-4D56-A534-E43C87508465\",\"name\":\"Default\"},\"focusSource\":{\"id\":999,\"name\":\"traversed\"},\"focusCollection\":[]}},\"focusSource\":{\"id\":8,\"name\":\"objectviews\"},\"ownerId\": 1]}}}'
    // }}
    const defaultSession = '{\"session\": {\"id\": 1, \"name\": \"2nd Session\", \"focus\": {\"gojsModel\":{\"nodeDataArray\":[{\"key\":0,\"text\":\"Dummy StartObject 1\",\"color\":\"lightblue\",\"loc\":\"0 0\"},{\"key\":1,\"text\":\"Dummy StartObject 2\",\"color\":\"lightgreen\",\"loc\":\"0 -50\"}],\"linkDataArray\":[{\"key\":-1,\"from\":0,\"to\":1}]},\"gojsMetamodel\":{\"nodeDataArray\":[{\"key\":0,\"text\":\"Dummy Type 1\",\"color\":\"orange\",\"loc\":\"0 0\"},{\"key\":1,\"text\":\"Dummy Type 2\",\"color\":\"red\",\"loc\":\"0 -80\"}],\"linkDataArray\":[]},\"focusModel\":{\"id\":\"39177a38-73b1-421f-f7bf-b1597dcc73e8\",\"name\":\"SF test solution model\"},\"focusObject\":{\"id\":\"UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656\",\"name\":\"Default\",\"sourceName\":\"test\",\"status\":null},\"focusModelview\":{\"id\":\"48913559-2476-4d8e-7faa-a4777553bb0b\",\"name\":\"Main\"},\"focusOrg\":{\"id\":0,\"name\":\"Default\"},\"focusProj\":{\"id\":0,\"name\":\"Default\"},\"focusRole\":{\"id\":\"UUID4_93ABC7D8-2840-41EE-90F5-042E4A7F9FFF\",\"name\":\"Default\"},\"focusCollection\":null,\"focusTask\":{\"id\":\"UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656\",\"name\":\"Default\",\"focus\":{\"focusObject\":{\"id\":\"UUID4_A416FE57-F1A3-4D56-A534-E43C87508465\",\"name\":\"Default\"},\"focusSource\":{\"id\":999,\"name\":\"traversed\"},\"focusCollection\":[]}},\"focusSource\":{\"id\":8,\"name\":\"objectviews\"}},\"ownerId\": 1}}'

    // const focuser = (focusUser.name !== 'Not logged in') ? focusUser?.session : defaultSession

    const focuser = defaultSession
    const session0 = JSON.parse(focuser) 
    const session = session0.session.focus
    const phFocus = {phFocus: session}
    // console.log('91', testsession, usession);

    // console.log('79', session);
    function handleSetSession() {
      const data = phFocus.phFocus
      // console.log('87', data);
      dispatch({ type: 'SET_FOCUS_PHFOCUS', data })
      dispatch({ type: 'SET_FOCUS_PHSOURCE', sourceFlag })

    }
    // console.log('114', loadState());
    
    // function handleSaveLocalStore() {
    //   // console.log('119 SelectContext', state);
      
    //   const data = {
    //     phData: state.phData,
    //     phFocus: state.phFocus,
    //     phUser: state.phUser,
    //     phSource: 'localStore'
    //   }
    //   // console.log('131', data);
      
    //   saveState(data)
    // }

    // function handleLoadLocalStore() {
    //   const locState = loadState()
    //   const phData = locState.phData
    //   const phFocus = locState.phFocus
    //   const phUser = locState.phUser
    //   const phSource = 'localStore' //locState.sourceFlag
    //   // console.log('142', phData);   
    //   if (locState.phData) {
    //     let data = phData
    //     dispatch({ type: 'SET_FOCUS_PHDATA', data })
    //     data = phFocus
    //     dispatch({ type: 'SET_FOCUS_PHFOCUS', data })
    //     data = phUser
    //     dispatch({ type: 'SET_FOCUS_PHUSER', data })
    //     data = phSource
    //     dispatch({ type: 'SET_FOCUS_PHSOURCE', data })
    //   } 
    //   // console.log('130', props.phFocus);
    //   // optionModel = models && [<option key={991011} value='Select Model ...' disabled > Select Model ...</option>, ...models.map((m: any) => <option key={m.id} value={JSON.stringify(m)} > {m.name} </option>)]
      
    // }

  // const buttonDiv =  <button className="float-right bg-light" onClick={handleSetSession} > Get Saved Session</button >
  // const buttonSaveLocalStoreDiv =  <button className="float-left bg-light" onClick={handleSaveLocalStore} > Save to localStore </button >
  // const buttonLoadLocalStoreDiv =  <button className="float-left bg-light" onClick={handleLoadLocalStore} > Load from localStore </button >

  optionModel = models && [<option key={991011} value='Select Model ...' disabled > Select Model ...</option>, ...models.map((m:any) => <option key={ m.id } value = { JSON.stringify(m) } > { m.name } </option> )]
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  // console.log('79', modelviews);
  
  const modelviews = (model) && model.modelviews.map((o:any) => o)
  const optionModelviews = modelviews && [<option key={991012} value='Select Modelview ...'  > Select Modelview ...</option>, ...modelviews.map((m:any) => <option key={ m.id } value = { JSON.stringify(m) }  > { m.name } </option> )]
  
  const objects = (model) && model.objects.map((o:any) => o)
  const optionObject = (objects) && [<option key={991013} value='Select Object ...' disabled > Select Objects ...</option>, ...objects.map((m: any) => <option key={m.id} value={JSON.stringify(m)}  > { m.name } </option> )]
    
  const orgs = (model) && model.objects.map((o:any) => o)
  const optionOrg = (objects) && [<option key={991014} value='Select Organization ...' disabled > Select Organization ...</option>, ...orgs.map((m: any) => <option key={m.id} value={JSON.stringify(m)}  > { m.name } </option> )]

  const projs = (model) && model.objects.map((o:any) => o)
  const optionProj = (objects) && [<option key={991015} value='Select Project ...' disabled > Select Project ...</option>, ...projs.map((m: any) => <option key={m.id} value={JSON.stringify(m)}  > { m.name } </option> )]

  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  
  return (
    <>
      <button className="btn-context btn-link float-right mb-0 pr-2" size="sm" color="link" onClick={toggle}>{buttonLabel}
      </button>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={toggle}>Set Context: </ModalHeader>
        <ModalBody className="pt-0">
          <div className="edit bg-light pt-2 ">
    
            {/* <hr style={{ borderTop: "1px solid #8c8b8" , backgroundColor: "#ccc", padding: "1px", marginTop: "5px", marginBottom: "0px" }} /> */}
            <h6>Model repository (Firebase) </h6>
             <div className="select" style={{ paddingTop: "4px" }}>Model: 
                <select className="list-obj bg-link float-right" defaultValue="Select Model ..." style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
                  onChange={(event) => handleModelChange({ value: event.target.value })} name="Focus Model">
                  {optionModel}
                </select>
            </div>
            <div className="select" style={{ paddingTop: "4px" }}>Modelview:
              <select className="list-obj bg-link float-right" defaultValue="Select Modelview ..." style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
                onChange={(event) => handleModelviewChange({ value: event.target.value })} name="Focus Modelview ...">
                {optionModelviews}
              </select>
            </div>

            <hr style={{ backgroundColor: "#ccc", padding: "1px", marginTop: "5px", marginBottom: "0px" }} />

            <div className="select" style={{ paddingTop: "4px" }}>Object:
              <select className="list-obj float-right" defaultValue="Select Fccusobject..." style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
                onChange={(event) => handleObjectChange({ value: event.target.value })} name="Focus Object">
                {optionObject}
              </select>
            </div>
            <div className="select" style={{ paddingTop: "4px" }}>Organization:
                  <select className="list-obj float-right" defaultValue="Select Organization ..." style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
                onChange={(event) => handleOrgChange({ value: event.target.value })} name="Focus Organization">
                {optionOrg}
              </select>
            </div>
            <div className="select" style={{ paddingTop: "4px" }}>Project:
                  <select className="list-obj float-right" defaultValue="Select Project ..." style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
                onChange={(event) => handleProjChange({ value: event.target.value })} name="Focus Project ">
                {optionProj}
              </select>
            </div>
          </div>
 
 
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={toggle}>Set</Button>{' '}
          <Button color="secondary" onClick={toggle}>Exit</Button>
        </ModalFooter>
      </Modal>
    
   
      <style jsx>{`
            .list-obj {
              min-Width: 90px;
            }
            /*******************************
            * MODAL AS LEFT/RIGHT SIDEBAR
            * Add "left" or "right" in modal parent div, after className="modal".
            * Get free snippets on bootpen.com
            *******************************/
            .modal {
                z-index: 1;
                margin-top: 8%;
            }
            .modal.right .modal-dialog {
              position: fixed;
              margin: 150px auto 200px auto;
              width: 380px;
              height: 80%;
              color: black;
              -webkit-transform: translate3d(0%, 0, 0);
              -ms-transform: translate3d(0%, 0, 0);
              -o-transform: translate3d(0%, 0, 0);
              transform: translate3d(0%, 0, 0);
            }

            .modal.right .modal-content {
              height: 100%;
              overflow-y: auto;
            }

            .modal.right .modal-body {
              padding: 15px 15px 80px;
              color: #444;
              
            }

            .modal.right.fade .modal-dialog {
              right: 320px;
              -webkit-transition: opacity 0.3s linear, left 0.3s ease-out;
              -moz-transition: opacity 0.3s linear, left 0.3s ease-out;
              -o-transition: opacity 0.3s linear, left 0.3s ease-out;
              transition: opacity 0.3s linear, left 0.3s ease-out;
            }
            .modal.fade.in {
              opacity: 1;
            }
            .modal.right.fade.show .modal-dialog {
              right: 0;
              transform: translate(0,0);
            }

            /* ----- MODAL STYLE ----- */
            .modal-content {
              border-radius: 0;
              border: none;
            }

            .modal-header {
              border-bottom-color: #eeeeee;
              background-color: #fafafa;
            }
            .modal-body {
              // width: 400px;
            }
            .modal-backdrop .fade .in {
              /* display: none; */
              /* opacity: 0; */
              /* opacity: 0.5; */
              /* filter: alpha(opacity=50) !important; */
              /* background: #fff; */
                    }
            .modal-background {
              display: none;
            }
            .btn-context {
              // font-size: 80%;
              font-weight: bold;
            }
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
