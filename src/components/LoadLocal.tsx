// @ts-snocheck
import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useDispatch } from 'react-redux'
// import { loadData } from '../actions/actions'
// import { loadState, saveState } from './utils/LocalStorage'
import useLocalStorage  from '../hooks/use-local-storage'
// import { FaJoint } from 'react-icons/fa';
// import DispatchLocal  from './utils/SetStoreFromLocalStorage'
import genGojsModel from './GenGojsModel'
import { SaveModelToFile, ReadModelFromFile, ReadMetamodelFromFile } from './utils/SaveModelToFile';

const LoadLocal = (props: any) => {
  
  const debug = false
  const dispatch = useDispatch()  
  const refresh = props.refresh
  const setRefresh = props.setRefresh
  function toggleRefresh() { setRefresh(!refresh); }

  const modelNames = props.ph.phData?.metis?.models.map(mn => <span key={mn.id}>{mn.name} | </span>)
  const metamodelNames = props.ph.phData?.metis?.metamodels.map(mn => (mn) && <span key={mn.id}>{mn.name} | </span>)
  if (debug) console.log('20 LoadLocal',  modelNames, metamodelNames);
  
  if (typeof window === 'undefined') return

  const [locState, setLocState] = useLocalStorage('state', null);

  const [memoryState] = useLocalStorage('memorystate', null);
  let locStatus = false
  // let memoryStatus = false

  function handleDispatchToStoreFromLocal() {  // load store from LocalStore (state)
    locStatus = true
    // console.log('43 LoadLocal', locState);
    if (locState) {
      const phData = locState.phData
      const phFocus = locState.phFocus
      const phUser = locState.phUser
      const phSource = 'localStore' //locState.sourceFlag
      if (locState) {
        // console.log('91 SelectSource', locState);
        let data = phData
        dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
        data = phFocus
        dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data })
        data = phUser
        dispatch({ type: 'LOAD_TOSTORE_PHUSER', data })
        data = phSource
        dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data })
      }
    } else alert('No Modeles saved to Local Storage')
  }
  
  function handleDispatchToStoreFromMemory() {  // load store from LocalStore (memoryState)
    // memoryStatus = true
    if (debug) console.log('63 LoadLocal', memoryState);
    const phData = memoryState.phData
    const phFocus = memoryState.phFocus
    const phUser = memoryState.phUser
    const phSource = 'localStore' //locState.sourceFlag
    if (memoryState) {
      // console.log('91 SelectSource', locState);
      let data = phData
      dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
      data = phFocus
      dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data })
      data = phUser
      dispatch({ type: 'LOAD_TOSTORE_PHUSER', data })
      data = phSource
      dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data })
    }
  }

  // useEffect(() => {
  //   // console.log('59 LoadLocal', props);
  //   genGojsModel(props, dispatch);
  //   // setRefresh(!refresh)
  // }, [locStatus])

  function handleSaveAllToLocalStore() {
    // const [state, setState] = useLocalStorage('state', {});
    if (debug) console.log('72 SelectSource',  props.ph);
    const data = {
      phData:   props.ph.phData,
      phFocus:  props.ph.phFocus,
      phUser:   props.ph.phUser,
      phSource: 'localStore'
    }
    if (debug) console.log('90 LoadLocal', data);
    setLocState(data)
  }

  function handleSaveCurrentModelToLocalStore() {
    if (debug) console.log('95', locState, props.ph);
    
    if (!locState) {
      const data = {
        phData:   props.ph.phData,
        phFocus:  props.ph.phFocus,
        phUser:   props.ph.phUser,
        phSource: 'localStore'
      }
      if (debug) console.log('104 LoadLocal', data);
      setLocState(data)
      if (debug) console.log('106 LoadLocal', locState);
    }
  
    if (debug) console.log('108', locState, props.ph);
    
    // first find current model which is in reduxStore
    let reduxmod = props.ph?.phData?.metis?.models?.find(m => m.id === props.ph?.phFocus?.focusModel?.id) // current model index
    let curmindex = locState?.phData?.metis?.models?.findIndex(m => m?.id === reduxmod?.id) // current model index
    // find lenght of modellarray in lodalStore
    const curmlength = locState?.phData?.metis.models?.length   
    if (curmindex < 0) { curmindex = curmlength } // rvindex = -1, i.e.  not fond, which means adding a new model
    // then find metamodel which is in reduxStore
    let reduxmmod = props.ph?.phData?.metis?.metamodels?.find(mm => mm.id === reduxmod?.metamodelRef) // current metamodel index
    let curmmindex = locState?.phData?.metis?.metamodels?.findIndex(mm=> mm?.id === reduxmmod?.id) // current model index
    // then find lenght of modellarray in lodalStore
    const curmmlength = locState?.phData?.metis.metamodels?.length   
    if (curmmindex < 0) { curmmindex = curmmlength } // rvindex = -1, i.e.  not fond, which means adding a new model
    
    // then find currentTargetMetamodel
    let reduxtmmod = props.ph?.phData?.metis?.metamodels?.find(mm => mm?.id === reduxmod?.targetMetamodelRef) // current targetmetamodel index
    let curtmmindex = locState?.phData?.metis?.metamodels?.findIndex(mm=> mm?.id === reduxtmmod?.id) // current model index
    const curtmmlength = locState?.phData?.metis.metamodels?.length   
    if (curtmmindex < 0) { curtmmindex = curtmmlength } // rvindex = -1, i.e.  not fond, which means adding a new model
    if (debug) console.log('130', reduxmmod, reduxmod);

    const data = (locState) && {
      phData: {
        ...locState.phData,
        metis: {
          ...locState.phData.metis,
          models: [
            ...locState.phData.metis.models.slice(0, curmindex),     
            reduxmod,
            ...locState.phData.metis.models.slice(curmindex + 1),
          ],
          metamodels: [
            ...locState.phData.metis.metamodels.slice(0, curmmindex),     
            reduxmmod,
            ...locState.phData.metis.metamodels.slice(curmmindex + 1, locState.phData.metis.metamodels.length),
          ]
        },
      },
      phFocus:  props.ph.phFocus,
      phUser:   props.ph.phUser,
      phSource: 'localStore'
    };
    if (debug) console.log('140 LoadLocal', data, locState);
    (reduxmod) && setLocState(data)
  }

  function handleSaveModelToFile() {
    const model = props.ph?.phData?.metis?.models?.find(m => m.id === props.ph?.phFocus?.focusModel?.id) // current model index
    SaveModelToFile(model, model.name, 'Model')
  }
  function handleSaveMetamodelToFile() {
    const model = props.ph?.phData?.metis?.models?.find(m => m.id === props.ph?.phFocus?.focusModel?.id) // current model index
    const metamodel = props.ph?.phData?.metis?.metamodels?.find(m => m.id === model?.metamodelRef) // current model index
    SaveModelToFile(metamodel, metamodel.name, 'Metamodel')
  }

  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);

  // const buttonrefresh = <button className="btn-context btn-primary float-right mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button>

  const buttonLoadLocalStoreDiv = <button className="btn-link btn-sm mb-2 w-100" onClick={handleDispatchToStoreFromLocal} > Load all models from LocalStorage </button >
  const buttonSaveCurrentToLocalStoreDiv = <button className="btn-primary btn-sm mb-2 w-100" onClick={handleSaveCurrentModelToLocalStore} > Save current model to LocalStorage </button >
  const buttonSaveToLocalStoreDiv = <button className="btn-primary btn-sm mb-2 w-100" onClick={handleSaveAllToLocalStore} > Save all to LocalStorage </button >

  const buttonSaveModelToFileDiv = <button className="btn-primary btn-sm mr-2  w-100  " onClick={handleSaveModelToFile} > Save Current Model to File (Downloads) </button >
  const buttonSaveMetamodelToFileDiv = <button className="btn-primary btn-sm mr-2  w-100  " onClick={handleSaveMetamodelToFile} > Save Current Metamodel to File (Downloads)</button >

  const buttonLoadMemoryStoreDiv = <button className="btn-info btn-sm mr-2 w-100 " onClick={handleDispatchToStoreFromMemory} > Recover Unsaved Models from LocalStorage </button >
  if (debug) console.log('172', buttonLabel);
  

  return (
    <>
      <button className="btn-context btn-primary float-right mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={() => { toggle(); toggleRefresh() }}>LocalStorage: </ModalHeader>
        <ModalBody className="pt-0">
          Current Source: <strong> {props.ph.phSource}</strong>
          <div className="source bg-light pt-2 "> Models: <strong> {modelNames}</strong></div>
          <div className="source bg-light pt-2 "> Metamodels: <strong> {metamodelNames}</strong></div>
          <div className="source bg-light pt-2 ">
            <hr style={{ borderTop: "1px solid #8c8b8", backgroundColor: "#9cf", padding: "2px", margin: "1px", marginBottom: "1px" }} />
            <div className="store-div px-2 pb-1 mb-0">
              <h6>Local Store </h6>
              <div className="select bg-light mb-1 p-2  border border-dark">
                {buttonLoadLocalStoreDiv}
                <hr style={{ borderTop: "4px solid #8c8b8", backgroundColor: "#aaa", padding: "2px",  marginTop: "1px" , marginBottom: "6px" }} />
                {buttonSaveCurrentToLocalStoreDiv} 
                {buttonSaveToLocalStoreDiv}
              </div>
              <div className="select bg-light mb-1 p-2 border border-dark">
                <h6>Import Metamodel from file </h6>
                {/* <hr style={{ borderTop: "4px solid #8c8b8", backgroundColor: "#9cf", padding: "2px",  marginTop: "3px" , marginBottom: "3px" }} /> */}
                <div className="mb-2"> 
                  <input type="file" onChange={(e) => ReadMetamodelFromFile(props.ph, dispatch, e)} />
                </div>
                {buttonSaveMetamodelToFileDiv}
              </div>
              <div className="select bg-light mb-1 p-2  border border-dark">
                <h6>Import Model from file </h6>
                {/* <hr style={{ borderTop: "4px solid #8c8b8", backgroundColor: "#9cf", padding: "2px",  marginTop: "3px" , marginBottom: "3px" }} /> */}
                <div className="mb-2">
                  <input type="file" onChange={(e) => ReadModelFromFile(props.ph, dispatch, e)} />
                </div>
                {buttonSaveModelToFileDiv}
              </div>
              <div className="select bg-light mb-1 p-2  border border-dark">
                {/* <hr style={{ borderTop: "4px solid #8c8b8", backgroundColor: "#9cf", padding: "2px",  marginTop: "3px" , marginBottom: "3px" }} /> */}
                <h6>Crash Recover </h6>
                <div className="footer--text mb-2" style={{ fontSize: "smaller" }}>
                  If the browser hang or crash, first reload the page and before any other actions, click on the button below to recover your last work !
                </div>
                {buttonLoadMemoryStoreDiv}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button className="modal--footer m-0 py-1 px-2" color="primary" onClick={() => {toggle(); toggleRefresh()}}>Done</Button>
          <div className="footer--text mb-2" style={{ fontSize: "smaller" }}>
            Local Storage is controlled by the Internet Browser, and may at some point be deleted, if not enough memory.
            <br />NB! Loding models from LocalStorage will overwrite current memory store.  To keep current work, click "Save all to LocalStorage".
          </div>
          {/* <Button color="primary" onClick={toggle}>Set</Button>{' '} */}
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

export default LoadLocal

