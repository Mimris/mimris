// @ts-nocheck
import { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
// import { useSelector, useDispatch } from 'react-redux'
import { useDispatch } from 'react-redux'
import { loadData } from '../actions/actions'
import Selector from './utils/Selector'
import SaveModelData from './utils/SaveModelData'
// import GetStoreFromHtml from './utils/GetStoreFromHtml'
// import { FaJoint } from 'react-icons/fa';

const SelectSource = (props: any) => {
  // console.log('12 LoadServer', props);
  // let state = useSelector((state: any) => state) // Selecting the whole redux store

  const dispatch = useDispatch()
  const refresh = props.refresh
  const setRefresh = props.setRefresh
  function toggleRefresh() { setRefresh(!refresh); }

  const modelNames = props.ph?.phData?.metis?.models.map(mn => <span key={mn.id}>{mn.name} | </span>)
  const metamodelNames = props.ph?.phData?.metis?.metamodels.map(mn => <span key={mn.id}>{mn.name} | </span>)
  // console.log('20 LoadLocal', modelNames, metamodelNames);

  function handleSaveModelStore() {
    // saving current model and metamodel
    const focusmodel = props.phFocus.focusModel
    const model = props.phData.metis.models.find(m => m.id === focusmodel.id)
    const metamodel = props.phData.metis.metamodels.find(mm => mm.id === model.metamodelRef)
    // const phData = props.phData
    const data = {
      metis: {
        metamodels: [
          metamodel
        ],
        models: [
          model
        ]
      }
    }
    // console.log('72 LoadServer', data);
    SaveModelData(data)
  }

  function handleLoadModelStore() { 
      dispatch(loadData())
  }
 
  const models = props.phData?.metis?.models
  const focusModel = props.phFocus?.focusModel
  const model = models?.find((m: any) => m?.id === focusModel?.id) // || models[0]
  const selmodels = models?.map((m: any) => m) 
  const selmodelviews = model?.modelviews?.map((mv: any) => mv)

  const buttonSaveModelStoreDiv = <button className="btn-primary btn-sm ml-2 float-right" onClick={handleSaveModelStore} > Save current to Server</button >
  // const buttonSaveModelStoreDiv = <button className="btn-light btn-sm ml-2 float-right" onClick={handleSaveModelStore} > Save to Server (not working yet)</button >
  const buttonLoadModelStoreDiv = <button className="btn-link btn-sm mr-2" onClick={handleLoadModelStore} > Load from Server </button >
  
  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  
// console.log('42 LoadServer', selmodels, selmodelviews);

  const frameId = 'myFrame'
  // let iframe = {}
  console.log('67 LoadServer', selmodels, selmodelviews);
  console.log('68 LoadServer', props.ph.phSource);
  // console.log('45 LoadServer', frames[frameId]?.documentElement.innerHTML)
  const selectorDiv = (props.ph?.phSource === 'Model server') && (selmodels && selmodelviews) &&
    <div className="modeller-selection p-2 " >
      <Selector type='SET_FOCUS_MODEL' selArray={selmodels} selName='Model' focustype='focusModel' refresh={refresh} setRefresh={setRefresh} /> <br /><hr />
      <Selector type='SET_FOCUS_MODELVIEW' selArray={selmodelviews} selName='Modelviews' focustype='focusModelview' refresh={refresh} setRefresh={setRefresh} />  <br />
    </div> 
  console.log('75 selectorDiv', selectorDiv);
  const buttonDiv = 
      <>
        <hr style={{ borderTop: "1px solid #8c8b8", backgroundColor: "#9cf", padding: "2px", margin: "1px", marginBottom: "1px" }} />
        <div className="store-div pb-1 mb-0">
          <h6>Model repository (Firebase) </h6>
          <div className="select px-2" style={{ paddingTop: "4px" }}>
            {buttonSaveModelStoreDiv}  {buttonLoadModelStoreDiv}
            <hr />
          <p> Server access  (wait for the json-file to appear below) : </p>
          {/* <iframe style={{width:"100%", height:"33vh"}} src="http://localhost:4000/profile" name="myFrame"></iframe> */}
          <iframe style={{width:"100%", height:"33vh"}} src="http://localhost:4000/akmmodels" name={frameId}></iframe>
          {/* {GetStoreFromHtml} */}
          {/* <IframeHelper /> */}
          {/* <p href="http://localhost:4000/profile" target="myFrame" >Click to Login</p> */}
          {/* <p><a href="http://localhost:4000/profile" target="myFrame" >Click to Login</a></p> */}
          </div>
          {selectorDiv}
        </div>
      </>


  return (
    <>
      <button className="btn-context btn-link float-right mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={() => { toggle(); toggleRefresh() }}>Model Server: </ModalHeader>
        <ModalBody className="pt-0">
          Current Source: <strong>{props.ph?.phSource}</strong>
          <div className="source bg-light pt-2 "> Models: <strong> {modelNames}</strong></div>
          <div className="source bg-light pt-2 "> Metamodels: <strong> {metamodelNames}</strong></div>
          <div className="source bg-light pt-2 ">
             {buttonDiv}
          </div>
          {/* <Button className="modal-footer m-0 py-1 px-2" color="link" onClick={modeldata} >Load</Button> */}
        </ModalBody>
        <ModalFooter>
          <div style={{ fontSize: "smaller" }}>
            NB! Clicking "Load" will overwrite current store (memory).
            To keep current version, exit and go to "Local" then click "Save" to save to LocalStore.
          </div>
          {/* <Button color="primary" onClick={toggle}>Set</Button>{' '} */}
          <Button className="modal-footer m-0 py-1 px-2" color="link" onClick={() => { toggle(); toggleRefresh() }}>Done</Button>
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

export default SelectSource




  // function handleSaveToFile() {
  //   console.log('72 SelectSource', state);
  //   alert('Save ModelStore not implemented yet');

  // }

  // function handleLoadFromFile() {
  //   console.log('111 SelectSource');   
  //     dispatch(loadData())

  // }



 // let optionModel
  // const models = useSelector(models => state.phData?.metis?.models)  // selecting the models array
  // const focusModel = useSelector(focusModel => state.phFocus?.focusModel)
  // const focusUser = useSelector(focusUser => state.phUser?.focusUser)

  // let usession, testsession

  // useEffect(() => {
  //   const fU = async () => await focusUser;
  //   testsession = fU().session;
  //   // console.log('69', focusUser, testsession);
  //   try {
  //     usession = (testsession) && JSON.parse(testsession);
  //     // console.log('71', usession);

  //   } catch (error) {
  //     {
  //       console.error('parserror');
  //     }
  //   }
  // }, [focusUser])

  // /**
  // * Build the selection options for all context (focus) objects,
  // */
  // const optionSession = sessions && [<option key={991009} value='Select Session ...' disabled > Select Modelview ...</option>, <option key={991010} value={JSON.stringify(sessions)} > {focusUser.name} </option> ]
  // console.log('72', optionSession);


  // const defaultSession = {focusUser: {id: 1, name: 'Snorre', email: 'sf@sf.com', session: '{\"id\": 1, \"name\": \"2nd Session\", \"focus\": \"{\"gojsModel\":{\"nodeDataArray\":[{\"key\":0,\"text\":\"Dummy StartObject 1\",\"color\":\"lightblue\",\"loc\":\"0 0\"},{\"key\":1,\"text\":\"Dummy StartObject 2\",\"color\":\"lightgreen\",\"loc\":\"0 -50\"}],\"linkDataArray\":[{\"key\":-1,\"from\":0,\"to\":1}]},\"gojsMetamodel\":{\"nodeDataArray\":[{\"key\":0,\"text\":\"Dummy Type 1\",\"color\":\"orange\",\"loc\":\"0 0\"},{\"key\":1,\"text\":\"Dummy Type 2\",\"color\":\"red\",\"loc\":\"0 -80\"}],\"linkDataArray\":[]},\"focusModel\":{\"id\":\"39177a38-73b1-421f-f7bf-b1597dcc73e8\",\"name\":\"SF test solution model\"},\"focusObject\":{\"id\":\"UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656\",\"name\":\"Default\",\"sourceName\":\"test\",\"status\":null},\"focusModelview\":{\"id\":\"48913559-2476-4d8e-7faa-a4777553bb0b\",\"name\":\"Main\"},\"focusOrg\":{\"id\":0,\"name\":\"Default\"},\"focusProj\":{\"id\":0,\"name\":\"Default\"},\"focusRole\":{\"id\":\"UUID4_93ABC7D8-2840-41EE-90F5-042E4A7F9FFF\",\"name\":\"Default\"},\"focusCollection\":null,\"focusTask\":{\"id\":\"UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656\",\"name\":\"Default\",\"focus\":{\"focusObject\":{\"id\":\"UUID4_A416FE57-F1A3-4D56-A534-E43C87508465\",\"name\":\"Default\"},\"focusSource\":{\"id\":999,\"name\":\"traversed\"},\"focusCollection\":[]}},\"focusSource\":{\"id\":8,\"name\":\"objectviews\"},\"ownerId\": 1]}}}'
  // }}
  // const defaultSession = '{\"session\": {\"id\": 1, \"name\": \"2nd Session\", \"focus\": {\"gojsModel\":{\"nodeDataArray\":[{\"key\":0,\"text\":\"Dummy StartObject 1\",\"color\":\"lightblue\",\"loc\":\"0 0\"},{\"key\":1,\"text\":\"Dummy StartObject 2\",\"color\":\"lightgreen\",\"loc\":\"0 -50\"}],\"linkDataArray\":[{\"key\":-1,\"from\":0,\"to\":1}]},\"gojsMetamodel\":{\"nodeDataArray\":[{\"key\":0,\"text\":\"Dummy Type 1\",\"color\":\"orange\",\"loc\":\"0 0\"},{\"key\":1,\"text\":\"Dummy Type 2\",\"color\":\"red\",\"loc\":\"0 -80\"}],\"linkDataArray\":[]},\"focusModel\":{\"id\":\"39177a38-73b1-421f-f7bf-b1597dcc73e8\",\"name\":\"SF test solution model\"},\"focusObject\":{\"id\":\"UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656\",\"name\":\"Default\",\"sourceName\":\"test\",\"status\":null},\"focusModelview\":{\"id\":\"48913559-2476-4d8e-7faa-a4777553bb0b\",\"name\":\"Main\"},\"focusOrg\":{\"id\":0,\"name\":\"Default\"},\"focusProj\":{\"id\":0,\"name\":\"Default\"},\"focusRole\":{\"id\":\"UUID4_93ABC7D8-2840-41EE-90F5-042E4A7F9FFF\",\"name\":\"Default\"},\"focusCollection\":null,\"focusTask\":{\"id\":\"UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656\",\"name\":\"Default\",\"focus\":{\"focusObject\":{\"id\":\"UUID4_A416FE57-F1A3-4D56-A534-E43C87508465\",\"name\":\"Default\"},\"focusSource\":{\"id\":999,\"name\":\"traversed\"},\"focusCollection\":[]}},\"focusSource\":{\"id\":8,\"name\":\"objectviews\"}},\"ownerId\": 1}}'

  // const focuser = (focusUser.name !== 'Not logged in') ? focusUser?.session : defaultSession

  // const focuser = defaultSession
  // const session0 = JSON.parse(focuser)
  // const ses|||||||||||sion = session0.session.focus
  // const phFocus = { phFocus: session }
  // console.log('91', testsession, usession);

  // console.log('79', session);
  // console.log('114', loadState());