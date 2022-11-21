// @ts-snocheck
import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';
import { useDispatch } from 'react-redux'
import Select from "react-select"
// import { loadData } from '../actions/actions'
// import { loadState, saveState } from '../utils/LocalStorage'
import useLocalStorage  from '../../hooks/use-local-storage'
// import { FaJoint } from 'react-icons/fa';
// import DispatchLocal  from '../utils/SetStoreFromLocalStorage'
// import genGojsModel from '../GenGojsModel'
// import { SaveModelToFile, SaveAllToFile, ReadModelFromFile, ReadMetamodelFromFile } from '../utils/SaveModelToFile';

const LoadLocal = (props: any) => {
  
  const debug = false
  const dispatch = useDispatch()  
  const refresh = props.refresh
  const setRefresh = props.setRefresh
  function toggleRefresh() { setRefresh(!refresh); }

  const modelNames = props.ph.phData?.metis?.models.map(mn => <span key={mn.id}>{mn.name} | </span>)
  const metamodelNames = props.ph.phData?.metis?.metamodels.map(mn => (mn) && <span key={mn.id}>{mn.name} | </span>)
  if (debug) console.log('24 LoadLocal', props.ph.phData, modelNames, metamodelNames);
  
  if (typeof window === 'undefined') return

  const [locState, setLocState] = useLocalStorage('state', null);

  const [memoryState] = useLocalStorage('memorystate', null);
  // let locStatus = false
  // let memoryStatus = false

  function handleDispatchToStoreFromLocal() {  // load redux store from the whole LocalStore, i.e. the total project
    // locStatus = true
    // console.log('43 LoadLocal', locState);
    let data: string;
    if (locState) {
      const phData = locState.phData
      const phFocus = locState.phFocus
      const phUser = locState.phUser
      const phSource = (locState.phSource === "") ? phData.metis.name : locState.phSource 

      if (locState) {
        // console.log('91 SelectSource', locState);
        data = phData
        dispatch({ type: 'LOAD_TOSTORE_PHDATA', data });
        data = phFocus;
        (phFocus) && dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data });
        data = phUser;
        (phUser) && dispatch({ type: 'LOAD_TOSTORE_PHUSER', data });
        data = phSource;
        (phSource) && dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data });
      }
    } else alert('No Modeles saved to Local Storage')
  }

  function handleSelectLocalModelDropdownChange(e) { // load reduxstore from selected model
    if (debug) console.log('57 LoadLocal', e);
    const metis = locState.phData.metis
    // find model in localStore
    const localModel = metis.models.find(m => m && m.id === e.value)
    const localMetamodel = metis.metamodel?.find(mm => mm && mm.id === localModel.metamodelRef)
    // check if metamodel exist in redux
    const reduxMetamodel = props.ph.phData.metis.metamodels.find(mm => mm && mm.id === localModel.metamodelRef)
    if (reduxMetamodel) {
      dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: localModel })
    } else {
      dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data: localMetamodel })
      dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: localModel })
    } 
      if (debug) console.log('59 LoadLocal', localMetamodel, localModel);
  }

  //
  // Reset store (Redux) to last memoryModel in localStore
  //
  function handleSelectMemoryModelDropdownChange(e) { // load reduxstore from memoryStore, i.e. the whole project
    if (debug) console.log('73 LoadMemory', e);
    const metis = memoryState.phData.metis
    // find the selected model in memoryStore
    const memoryModel = metis.models.find(m => m && m.id === e.value)
    dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: memoryModel })
  }
  
  const options = locState?.phData.metis.models.map(o => o && {'label': o.name, 'value': o.id});
  if (debug) console.log('61 LoadLocal', options);
  
  let loadSelectedFromLocalStoreDiv = <></>
  // if (options) 
  //   loadSelectedFromLocalStoreDiv = 
  //     <div className="loadstore selection d-flex justify-content-center border border-dark  pt-3 px-2">
  //       <p>Model to import</p>
  //       <Select className="modal-select"
  //         options={options}
  //         onChange={value => handleSelectLocalModelDropdownChange(value)}
  //         // value={value}
  //       />
  //     </div>

  const optionsMemory = memoryState[0]?.phData.metis.models.map(o => o && {'label': o.name, 'value': o.id});
  if (debug) console.log('61 LoadLocal', optionsMemory);
  
  let loadSelectedFromMemoryStoreDiv = <></>
  // if (optionsMemory) 
  //   loadSelectedFromMemoryStoreDiv = 
  //     <div className="loadstore selection d-flex justify-content-center border border-dark  pt-3 px-2">
  //       <p>Select Recovery Model to import</p>
  //       <Select className="modal-select"
  //         options={optionsMemory}
  //         onChange={value => handleSelectMemoryModelDropdownChange(value)}
  //         // value={value}
  //       />
  //     </div>
    
  //
  // load to Redux-store from memoryState in localStorage. This is save for every refresh)
  //
  function handleDispatchToStoreFromMemory() {  
    // memoryStatus = true
    if (debug) console.log('63 LoadLocal', memoryState);
    const phData = memoryState[0].phData
    const phFocus = memoryState[0].phFocus
    const phUser = memoryState[0].phUser
    const phSource = memoryState[0].phSource //locState.sourceFlag
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
    if (debug) console.log('83 SelectSource',  props.ph.phData);
    const data = {
      phData:   props.ph.phData,
      phFocus:  props.ph.phFocus,
      phUser:   props.ph.phUser,
      phSource: props.ph.phSource,
      lastUpdate: new Date().toISOString()
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
        phSource: props.ph.phSource,
        lastUpdate: new Date().toISOString()
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

  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);

  // const buttonrefresh = <button className="btn-context btn-primary float-right mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button>

  const buttonLoadLocalStoreDiv = 
    <button 
      className="btn-info bg-info btn-sm mb-2 w-100" 
      data-toggle="tooltip" data-placement="top" data-bs-html="true" 
      title="Click here to load the Project&#013;(all models and metamodels)&#013;from Local Storage&#013;(localStore in browser)"
      onClick={handleDispatchToStoreFromLocal}>Load the project from LocalStorage 
    </button >
  const buttonSaveToLocalStoreDiv = 
    <button 
      className="btn-primary btn-sm mb-2 w-100" 
      data-toggle="tooltip" data-placement="top" data-bs-html="true" 
      title="Click here to save the Project&#013;(all models and metamodels)&#013;to Local Storage&#013;(localStore in browser)"
      onClick={handleSaveAllToLocalStore}>Save the Project to LocalStorage 
    </button >
  const buttonSaveCurrentToLocalStoreDiv = 
    <button 
      className="btn-primary btn-sm mb-2 w-100"
      data-toggle="tooltip" data-placement="top" data-bs-html="true" 
      title="Click here to save current model to Local Storage (localStore in browser)" 
      onClick={handleSaveCurrentModelToLocalStore}>Save Current model to LocalStorage 
    </button >


  const buttonLoadMemoryStoreDiv = 
    <button 
      className="btn-dark btn-sm mr-2 w-100 " 
      data-toggle="tooltip" data-placement="top" data-bs-html="true" 
      title="Click here to recover unsaved model after crash&#013;(this has to be done imediately after reload, before any refresh)"     
      onClick={handleDispatchToStoreFromMemory}>Recover Project (last refreshed version) <br />
    </button >
  if (debug) console.log('172', buttonLabel);
  
  return (
    <>
      <button className="btn-context btn-light float-right mr-2 mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={() => { toggle(); toggleRefresh() }}>Export/Import: </ModalHeader>
        <ModalBody className="pt-0">
          Current Source: <strong> {props.ph.phSource}</strong>
          <div className="source bg-light p-2 "> Models: <strong> {modelNames}</strong></div>
          <div className="source bg-light p-2 "> Metamodels: <strong> {metamodelNames}</strong></div>
          <div className="source bg-light p-2 ">
            <hr style={{ borderTop: "1px solid #8c8b8", backgroundColor: "#9cf", padding: "2px", margin: "1px", marginBottom: "1px" }} />
            <div className="loadsave px-2 pb-1 mb-0">
              <div className="loadsave--localStore select border border-dark">
                <h6>Local Store </h6>
                  <div className="selectbox mb-2 border"> 
                  <h6>Import from local (will overwrite current)</h6>
                    {buttonLoadLocalStoreDiv}
                    {loadSelectedFromLocalStoreDiv}
                </div>
                  {/* <hr style={{ borderTop: "4px solid #8c8b8", backgroundColor: "#aaa", padding: "2px",  marginTop: "1px" , marginBottom: "6px" }} /> */}
                  <div className="selectbox mb-2 border"> 
                  <h6>Export to local</h6>
                  {buttonSaveToLocalStoreDiv}
                  {buttonSaveCurrentToLocalStoreDiv} 
                </div>
              </div>
              {/* <div className="loadsave--momoryStore select  mb-1 p-2  border border-dark">
                 <h6>Crash Recovery </h6>
                <div className="footer--text mb-2" style={{ fontSize: "smaller" }}>
                  If the browser hang or crash, or you made a mistake, you can go back to an earlier version
                  by clicking on the button below!
                  <br />(This version is updated each time you select a new modelview tab or clicked on refresh)
                </div>
                {buttonLoadMemoryStoreDiv}
              </div> */}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button className="modal--footer m-0 py-1 px-2" color="primary" data-toggle="tooltip" data-placement="top" data-bs-html="true" 
            title="Click here when done!" onClick={() => {toggle(); toggleRefresh()}}>Done</Button>
          <div className="footer--text mb-2" style={{ fontSize: "smaller" }}>
            Local Storage is controlled by the Internet Browser, and may at some point be deleted, if not enough memory.
            <br />NB! Loding models from LocalStorage will overwrite current memory store.  To keep current work, click "Save all to LocalStorage.
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

