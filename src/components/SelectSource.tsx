// @ts-snocheck
import { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux'
import { loadData } from '../actions/actions'
import { loadState, saveState } from './utils/LocalStorage'
// import { FaJoint } from 'react-icons/fa';

const SelectSource = (props: any) => {
  // console.log('8 8', props.modal);
  let state = useSelector((state: any) => state) // Selecting the whole redux store
  // const models = useSelector(models => state.phData?.metis?.models)  // selecting the models array
  // const focusModel = useSelector(focusModel => state.phFocus?.focusModel)
  // const focusUser = useSelector(focusUser => state.phUser?.focusUser)
  // const focusModelview = useSelector(focusModelview => state.phFocus.focusModelview)

  // const [model, setModel] = useState(focusModel)
  // console.log('16 Sel', models, focusModel, state);

  const dispatch = useDispatch()
  // const { register, handleSubmit, errors } = useForm()

  // let optionModel


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

  function handleSaveLocalStore() {
    console.log('72 SelectSource', state);

    const data = {
      phData: state.phData,
      phFocus: state.phFocus,
      phUser: state.phUser,
      phSource: 'localStore'
    }
    // console.log('131', data);
    saveState(data)
  }

  function handleLoadLocalStore() {
    console.log('86 SelectSource', loadState());   
    const locState = loadState()
    const phData = locState?.phData
    const phFocus = locState?.phFocus
    const phUser = locState?.phUser
    const phSource = 'localStore' //locState.sourceFlag
    if (locState) {
      console.log('91 SelectSource', locState);   
      let data = phData
      dispatch({ type: 'SET_FOCUS_PHDATA', data })
      data = phFocus
      dispatch({ type: 'SET_FOCUS_PHFOCUS', data })
      data = phUser
      dispatch({ type: 'SET_FOCUS_PHUSER', data })
      data = phSource
      dispatch({ type: 'SET_FOCUS_PHSOURCE', data })
    }
  }

  function handleSaveModelStore() {
    console.log('72 SelectSource', state);
    alert('Save ModelStore not implemented yet');

  }

  function handleLoadModelStore() {
    console.log('111 SelectSource');   
      dispatch(loadData())
    
  }

  function handleSaveToFile() {
    console.log('72 SelectSource', state);
    alert('Save ModelStore not implemented yet');

  }

  function handleLoadFromFile() {
    console.log('111 SelectSource');   
      dispatch(loadData())
    
  }

  // const buttonDiv = <button className="float-right bg-light" onClick={handleSetSession} > Get Saved Session</button >
  const buttonSaveLocalStoreDiv = <button className="bg-light ml-1" onClick={handleSaveLocalStore} > Save </button >
  const buttonLoadLocalStoreDiv = <button className="bg-light mr-1 float-right " onClick={handleLoadLocalStore} > Load </button >
  
  const buttonSaveModelStoreDiv = <button className="bg-light ml-1" onClick={handleSaveModelStore} > Save (not working yet)</button >
  const buttonLoadModelStoreDiv = <button className="bg-light mr-1 float-right" onClick={handleLoadModelStore} > Load </button >
  
  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  
// console.log('131', state);


  return (
    <>
      <button className="btn-context btn-link float-right mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={toggle}>Model Source: </ModalHeader>
        <ModalBody className="pt-0">
          <div>Current Source:  {state.phSource}</div>
          <div className="source bg-light pt-2 ">
            <div className="localstore pb-1 mb-0">
              <hr style={{ borderTop: "1px solid #8c8b8", backgroundColor: "#9cf", padding: "2px", margin: "1px", marginBottom: "1px" }} />
              <h6>Local Store </h6>
              <div className="select" style={{ paddingTop: "4px" }}>
                {buttonSaveLocalStoreDiv} {buttonLoadLocalStoreDiv}
              </div>
            </div>
            <hr style={{ borderTop: "1px solid #8c8b8", backgroundColor: "#9cf", padding: "2px", margin: "1px", marginBottom: "1px" }} />
            <h6>Model repository (Firebase) </h6>
            {buttonSaveModelStoreDiv}  {buttonLoadModelStoreDiv}
          </div>
        </ModalBody>
        <ModalFooter>
          <div>
            <p>Clicking "Load" will load the models into the "memory" (Redux Store) and overwrite current memory store</p>
            (To save latest changes please "Save" to Local Store before "Load" from Model Store)
            <p></p>
            <p></p>
          </div>
            {/* <Button color="primary" onClick={toggle}>Set</Button>{' '} */}
          <Button className="modal-footer m-0 py-1 px-2" color="secondary" onClick={toggle}>Exit</Button>
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

