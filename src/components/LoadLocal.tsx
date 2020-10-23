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
import { SaveModelToFile, ReadModelFromFile } from './utils/SaveModelToFile';



// const os = require('os');
// const ostype = os.platform();
// const file = (ostype === 'darwin')
//  ? import modeldata from 'C://downloads/modelfile.json'
//  : import modeldata from '/downloads/modelfile.json'

const LoadLocal = (props: any) => {
  const debug = true
  const dispatch = useDispatch()  
  const refresh = props.refresh
  const setRefresh = props.setRefresh
  function toggleRefresh() { setRefresh(!refresh); }

  const modelNames = props.ph.phData?.metis?.models.map(mn => <span key={mn.id}>{mn.name} | </span>)
  const metamodelNames = props.ph.phData?.metis?.metamodels.map(mn => (mn) && <span key={mn.id}>{mn.name} | </span>)
  // console.log('20 LoadLocal',  modelNames, metamodelNames);
  
  // try {  
  //   if (typeof window === 'undefined'){
  //     console.log('14', props);
  //     return <></>
  //   }
  // } catch (error) {
  //   console.log('18 LoadLocal error', error);
  //   return <> </>
  // }

  // const [state, setState] = useLocalStorage('state',  window.localStorage.getItem('state') || null);
  if (typeof window === 'undefined') return
  const [locState, setLocState] = useLocalStorage('state', null);
  const [memoryState] = useLocalStorage('memorystate', null);
  let locStatus = false
  // let memoryStatus = false
  // console.log('25 LoadLocal', locState.phData.metis.models[0].modelviews[0].objectviews[0].loc);
  
  function handleDispatchToStoreFromLocal() {  // load store from Local
    locStatus = true

    // console.log('43 LoadLocal', locState);
    
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
  }
  function handleDispatchToStoreFromMemory() {  // load store from localmemorystate
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

  useEffect(() => {
    // console.log('59 LoadLocal', props);
    genGojsModel(props, dispatch);
    // setRefresh(!refresh)
  }, [locStatus])

  function handleSaveAllToLocalStore() {
    // const [state, setState] = useLocalStorage('state', {});
    // console.log('72 SelectSource', state, props.ph);
    const data = {
      phData:   props.ph.phData,
      phFocus:  props.ph.phFocus,
      phUser:   props.ph.phUser,
      phSource: 'localStore'
    }
    // console.log('59 LoadLocal', data);
    setLocState(data)
    // console.log('62 LoadLocal', state);
  }

  function handleSaveCurrentModelToLocalStore() {
    // first find current model which is in reduxStore
    let reduxmod = props.ph?.phData?.metis?.models?.find(m => m.id === props.ph?.phFocus?.focusModel?.id) // current model index
    let curmindex = locState.phData?.metis?.models?.findIndex(m => m?.id === reduxmod?.id) // current model index
    // find lenght of modellarray in lodalStore
    const curmlength = locState.phData.metis.models?.length   
    if (curmindex < 0) { curmindex = curmlength } // rvindex = -1, i.e.  not fond, which means adding a new model
    // then find metamodel which is in reduxStore
    let reduxmmod = props.ph?.phData?.metis?.metamodels?.find(mm => mm.id === reduxmod?.metamodelRef) // current metamodel index
    let curmmindex = locState.phData?.metis?.metamodels?.findIndex(mm=> mm?.id === reduxmmod?.id) // current model index
    // then find lenght of modellarray in lodalStore
    const curmmlength = locState.phData.metis.metamodels?.length   
    if (curmmindex < 0) { curmmindex = curmmlength } // rvindex = -1, i.e.  not fond, which means adding a new model
    
    // then find currentTargetMetamodel
    let reduxtmmod = props.ph?.phData?.metis?.metamodels?.find(mm => mm?.id === reduxmod?.targetMetamodelRef) // current targetmetamodel index
    let curtmmindex = locState.phData?.metis?.metamodels?.findIndex(mm=> mm?.id === reduxtmmod?.id) // current model index
    const curtmmlength = locState.phData.metis.metamodels?.length   
    if (curtmmindex < 0) { curtmmindex = curtmmlength } // rvindex = -1, i.e.  not fond, which means adding a new model

    const data = {
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
    // console.log('59 LoadLocal', data);
    (reduxmod) && setLocState(data)
    // console.log('62 LoadLocal', state);
  }

  function handleSaveToFile() {
    let reduxmod = props.ph?.phData?.metis?.models?.find(m => m.id === props.ph?.phFocus?.focusModel?.id) // current model index
    // console.log('160 LoadLocal', reduxmod);
    
    SaveModelToFile(reduxmod)
  }

 
  const buttonLoadMemoryStoreDiv = <button className="btn-info w-100 btn-sm mr-2 " onClick={handleDispatchToStoreFromMemory} > Recover Unsaved Models from localStorage </button >
  const buttonSaveModelToFileDiv = <button className="btn-secondary text-secondary w-100 btn-sm mr-2 " onClick={handleSaveToFile} > Download Current Model to File </button >
  // const handleReadModelFromFileDiv = <button className="btn-info w-100 btn-sm mr-2 " onClick={handleReadModelFromFile} > Save Current Model to File </button >
 
  const handleReadModelFromFileDiv = 
    <div> Import Model from File (json) :
      <input type="file" onChange={(e) => ReadModelFromFile(props.ph, dispatch, e)} />
    </div>

  // const buttonDiv = <button className="float-right bg-light" onClick={handleSetSession} > Get Saved Session</button >
  const buttonSaveToLocalStoreDiv = <button className="btn-primary btn-sm ml-2 float-right w-50" onClick={handleSaveAllToLocalStore} > Save all to localStorage </button >
  const buttonLoadLocalStoreDiv = <button className="btn-link btn-sm mr-2 " onClick={handleDispatchToStoreFromLocal} > Load all from localStorage </button >
  const buttonSaveCurrentToLocalStoreDiv = <button className="btn-primary btn-sm mt-1 ml-2 float-right w-50" onClick={handleSaveCurrentModelToLocalStore} > Save current model to memoryStorage </button >
  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  // console.log('131', state);

  const buttonDiv = 
    <>
      <hr style={{ borderTop: "1px solid #8c8b8", backgroundColor: "#9cf", padding: "2px", margin: "1px", marginBottom: "1px" }} />
      <div className="store-div px-2 pb-4 mb-0">
        <h6>Local Store Actions</h6>
        <div className="select pb-5" >
          {buttonLoadLocalStoreDiv}
          {buttonSaveCurrentToLocalStoreDiv} 
          {buttonSaveToLocalStoreDiv}
        </div>
          <br />
        <div className="select pt-9">
          <hr style={{ borderTop: "4px solid #8c8b8", backgroundColor: "#9cf", padding: "2px",  marginTop: "3px" , marginBottom: "3px" }} />
          {buttonSaveModelToFileDiv}
          {handleReadModelFromFileDiv}
        </div>
        <div className="select pt-0">
          <hr style={{ borderTop: "4px solid #8c8b8", backgroundColor: "#9cf", padding: "2px",  marginTop: "3px" , marginBottom: "3px" }} />
          {buttonLoadMemoryStoreDiv}
        </div>
      </div>
    </>

  return (
    <>
      <button className="btn-context btn-link float-right mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={() => { toggle(); toggleRefresh() }}>LocalStorage: </ModalHeader>
        <ModalBody className="pt-0">
          Current Source: <strong> {props.ph.phSource}</strong>
          <div className="source bg-light pt-2 "> Models: <strong> {modelNames}</strong></div>
          <div className="source bg-light pt-2 "> Metamodels: <strong> {metamodelNames}</strong></div>
          <div className="source bg-light pt-2 ">
            {buttonDiv}
          </div>
        </ModalBody>
        <ModalFooter>
          <div style={{ fontSize: "smaller" }}>
            NB! Clicking "Load local" will overwrite current store (memory).
            To keep current version, click "Save to Local" to save to LocalStore before "Load local" .
          </div>
          {/* <Button color="primary" onClick={toggle}>Set</Button>{' '} */}
          <Button className="modal-footer m-0 py-1 px-2" color="link" onClick={() => {toggle(); toggleRefresh()}}>Done</Button>
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



// function handleSaveLocalStore() {
//       // console.log('72 SelectSource', state, props.ph);
//       const data = {
//         phData: props.ph.phData,
//         phFocus: props.ph.phFocus,
//         phUser: props.ph.phUser,
//         phSource: 'localStore'
//       }
//       // console.log('37', data);
//       setState(data)
//     }

// function handleLoadLocalStore() {
//       // console.log('42 LoadLocal', state);
//       // const locState = loadState()
//       const locState = state
//       const phData = locState?.phData
//       const phFocus = locState?.phFocus
//       const phUser = locState?.phUser
//       const phSource = 'localStore' //locState.sourceFlag
//       if (locState) {
//         console.log('91 SelectSource', locState);
//         let data = phData
//         dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
//         data = phFocus
//       dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data })
//       data = phUser
//       dispatch({ type: 'LOAD_TOSTORE_PHUSER', data })
//       data = phSource
//       dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data })
//     }
//   }








// // @ts-snocheck
// import { useState, useEffect } from 'react';
// import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
// import { useDispatch } from 'react-redux'
// // import { loadData } from '../actions/actions'
// // import { loadState, saveState } from './utils/LocalStorage'
// import useLocalStorage  from '../hooks/use-local-storage'
// // import { FaJoint } from 'react-icons/fa';
// // import DispatchLocal  from './utils/SetStoreFromLocalStorage'
// import genGojsModel from './GenGojsModel'

// const LoadLocal = (props: any) => {

//   const dispatch = useDispatch()  
//   const refresh = props.refresh
//   const setRefresh = props.setRefresh
//   function toggleRefresh() { setRefresh(!refresh); }

//   const modelNames = props.ph.phData?.metis?.models.map(mn => <span key={mn.id}>{mn.name} | </span>)
//   const metamodelNames = props.ph.phData?.metis?.metamodels.map(mn => (mn) && <span key={mn.id}>{mn.name} | </span>)
//   // console.log('20 LoadLocal',  modelNames, metamodelNames);
  
//   // try {  
//   //   if (typeof window === 'undefined'){
//   //     console.log('14', props);
//   //     return <></>
//   //   }
//   // } catch (error) {
//   //   console.log('18 LoadLocal error', error);
//   //   return <> </>
//   // }

//   // const [state, setState] = useLocalStorage('state',  window.localStorage.getItem('state') || null);
//   const [locState, setLocState] = useLocalStorage('state', null);
//   let locStatus = false
//   // console.log('25 LoadLocal', locState.phData.metis.models[0].modelviews[0].objectviews[0].loc);
  
//   function handleDispatchToStoreFromLocal() {  // Set storeFromLocal
//     locStatus = true
//     console.log('38 LoadLocal', locState);
    
//     const phData = locState.phData
//     const phFocus = locState.phFocus
//     const phUser = locState.phUser
//     const phSource = 'localStore' //locState.sourceFlag
//     if (locState) {
//       // console.log('91 SelectSource', locState);
//       let data = phData
//       dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
//       data = phFocus
//       dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data })
//       data = phUser
//       dispatch({ type: 'LOAD_TOSTORE_PHUSER', data })
//       data = phSource
//       dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data })
//     }
//   }

//   useEffect(() => {
//     // console.log('59 LoadLocal', props);
//     genGojsModel(props, dispatch);
//     // setRefresh(!refresh)
//   }, [locStatus])

//   function handleSaveAllToLocalStore() {
//     // const [state, setState] = useLocalStorage('state', {});
//     // console.log('72 SelectSource', state, props.ph);
//     const data = {
//       phData:   props.ph.phData,
//       phFocus:  props.ph.phFocus,
//       phUser:   props.ph.phUser,
//       phSource: 'localStore'
//     }
//     console.log('59 LoadLocal', data);
//     setLocState(data)
//     // console.log('62 LoadLocal', state);
//   }

//   function handleSaveCurrentModelToLocalStore() {
//     // first find current model which is in reduxStore
//     let reduxmod = props.ph?.phData?.metis?.models?.find(m => m.id === props.ph?.phFocus?.focusModel?.id) // current model index
//     let curmindex = locState.phData?.metis?.models?.findIndex(m => m?.id === reduxmod?.id) // current model index
//     // find lenght of modellarray in lodalStore
//     const curmlength = locState.phData.metis.models?.length   
//     if (curmindex < 0) { curmindex = curmlength } // rvindex = -1, i.e.  not fond, which means adding a new model
//     // then find metamodel which is in reduxStore
//     let reduxmmod = props.ph?.phData?.metis?.metamodels?.find(mm => mm.id === reduxmod?.metamodelRef) // current metamodel index
//     let curmmindex = locState.phData?.metis?.metamodels?.findIndex(mm=> mm?.id === reduxmmod?.id) // current model index
//     // then find lenght of modellarray in lodalStore
//     const curmmlength = locState.phData.metis.metamodels?.length   
//     if (curmmindex < 0) { curmmindex = curmmlength } // rvindex = -1, i.e.  not fond, which means adding a new model
//     let metamodels = [
//       ...locState.phData.metis.metamodels.slice(0, curmmindex),     
//       reduxmmod,
//       ...locState.phData.metis.metamodels.slice(curmmindex + 1),
//     ]
//     console.log('97 LoadLocal', metamodels);
    
//     // then find currentTargetMetamodel
//     let reduxtmmod = props.ph?.phData?.metis?.metamodels?.find(mm => mm.id === reduxmod?.targetMetamodelRef) // current targetmetamodel index
//     let curtmmindex = locState.phData?.metis?.metamodels?.findIndex(mm=> mm?.id === reduxtmmod?.id) // current model index
//     const curtmmlength = locState.phData.metis.metamodels?.length   
//     if (curtmmindex < 0) { curtmmindex = curtmmlength } // rvindex = -1, i.e.  not fond, which means adding a new model
//     metamodels = [
//       ...metamodels.slice(0, curtmmindex),     
//       reduxtmmod,
//       ...metamodels.slice(curtmmindex + 1),
//     ]
//     console.log('73 LoadLocal', metamodels, curtmmindex, reduxtmmod);
//     const data = {
//       phData: {
//         ...locState.phData,
//         metis: {
//           ...locState.phData.metis,
//           models: [
//             ...locState.phData.metis.models.slice(0, curmindex),     
//             reduxmod,
//             ...locState.phData.metis.models.slice(curmindex + 1),
//           ],
//           // metamodels: [
//             metamodels
//           //   ...locState.phData.metis.metamodels.slice(0, curmmindex),     
//           //   reduxmmod,
//           //   ...locState.phData.metis.metamodels.slice(curmmindex + 1),
//           // ]
//         },
//       },
//       phFocus:  props.ph.phFocus,
//       phUser:   props.ph.phUser,
//       phSource: 'localStore'
//     };
//     // console.log('59 LoadLocal', data);
//     (reduxmod) && setLocState(data)
//     // console.log('62 LoadLocal', state);
//   }
  
//   // const buttonDiv = <button className="float-right bg-light" onClick={handleSetSession} > Get Saved Session</button >
//   const buttonSaveToLocalStoreDiv = <button className="btn-primary btn-sm ml-2 float-right w-50" onClick={handleSaveAllToLocalStore} > Save all to localStorage </button >
//   const buttonLoadLocalStoreDiv = <button className="btn-link btn-sm mr-2 " onClick={handleDispatchToStoreFromLocal} > Load all from localStorage </button >
//   const buttonSaveCurrentToLocalStoreDiv = <button className="btn-primary btn-sm mt-1 ml-2 float-right w-50" onClick={handleSaveCurrentModelToLocalStore} > Add current model to localStorage </button >
//   const { buttonLabel, className } = props;
//   const [modal, setModal] = useState(false);
//   const toggle = () => setModal(!modal);
//   // console.log('131', state);

//   const buttonDiv = 
//     <>
//       <hr style={{ borderTop: "1px solid #8c8b8", backgroundColor: "#9cf", padding: "2px", margin: "1px", marginBottom: "1px" }} />
//       <div className="store-div px-2 pb-4 mb-0">
//         <h6>Local Store Actions</h6>
//         <div className="select pb-5" style={{ paddingTop: "4px" }}>
//           {buttonSaveToLocalStoreDiv}
//           {buttonLoadLocalStoreDiv}
//           {buttonSaveCurrentToLocalStoreDiv} 
//         </div>
//       </div>
//     </>

//   return (
//     <>
//       <button className="btn-context btn-link float-right mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button>
//       <Modal isOpen={modal} toggle={toggle} className={className} >
//         <ModalHeader toggle={() => { toggle(); toggleRefresh() }}>LocalStorage: </ModalHeader>
//         <ModalBody className="pt-0">
//           Current Source: <strong> {props.ph.phSource}</strong>
//           <div className="source bg-light pt-2 "> Models: <strong> {modelNames}</strong></div>
//           <div className="source bg-light pt-2 "> Metamodels: <strong> {metamodelNames}</strong></div>
//           <div className="source bg-light pt-2 ">
//             {buttonDiv}
//           </div>
//         </ModalBody>
//         <ModalFooter>
//           <div style={{ fontSize: "smaller" }}>
//             NB! Clicking "Load local" will overwrite current store (memory).
//             To keep current version, click "Save to Local" to save to LocalStore before "Load local" .
//           </div>
//           {/* <Button color="primary" onClick={toggle}>Set</Button>{' '} */}
//           <Button className="modal-footer m-0 py-1 px-2" color="link" onClick={() => {toggle(); toggleRefresh()}}>Done</Button>
//         </ModalFooter>
//       </Modal>
//       <style jsx>{`
//       .list-obj {
//               min-Width: 90px;
//             }
//             /*******************************
//             * MODAL AS LEFT/RIGHT SIDEBAR
//             * Add "left" or "right" in modal parent div, after className="modal".
//             * Get free snippets on bootpen.com
//             *******************************/
//             .modal {
//                 z-index: 1;
//                 margin-top: 8%;
//             }
//             .modal.right .modal-dialog {
//               position: fixed;
//               margin: 150px auto 200px auto;
//               width: 380px;
//               height: 80%;
//               color: black;
//               -webkit-transform: translate3d(0%, 0, 0);
//               -ms-transform: translate3d(0%, 0, 0);
//               -o-transform: translate3d(0%, 0, 0);
//               transform: translate3d(0%, 0, 0);
//             }

//             .modal.right .modal-content {
//               height: 100%;
//               overflow-y: auto;
//             }

//             .modal.right .modal-body {
//               padding: 15px 15px 80px;
//               color: #444;
              
//             }

//             .modal.right.fade .modal-dialog {
//               right: 320px;
//               -webkit-transition: opacity 0.3s linear, left 0.3s ease-out;
//               -moz-transition: opacity 0.3s linear, left 0.3s ease-out;
//               -o-transition: opacity 0.3s linear, left 0.3s ease-out;
//               transition: opacity 0.3s linear, left 0.3s ease-out;
//             }
//             .modal.fade.in {
//               opacity: 1;
//             }
//             .modal.right.fade.show .modal-dialog {
//               right: 0;
//               transform: translate(0,0);
//             }

//             /* ----- MODAL STYLE ----- */
//             .modal-content {
//               border-radius: 0;
//               border: none;
//             }

//             .modal-header {
//               border-bottom-color: #eeeeee;
//               background-color: #fafafa;
//             }
//             .modal-body {
//               // width: 400px;
//             }
//             .modal-backdrop .fade .in {
//               /* display: none; */
//               /* opacity: 0; */
//               /* opacity: 0.5; */
//               /* filter: alpha(opacity=50) !important; */
//               /* background: #fff; */
//                     }
//             .modal-background {
//               display: none;
//             }
//             .btn-context {
//               // font-size: 80%;
//               font-weight: bold;
//             }
//             `}</style>
//     </>
//   )
// }

// export default LoadLocal



// // function handleSaveLocalStore() {
// //       // console.log('72 SelectSource', state, props.ph);
// //       const data = {
// //         phData: props.ph.phData,
// //         phFocus: props.ph.phFocus,
// //         phUser: props.ph.phUser,
// //         phSource: 'localStore'
// //       }
// //       // console.log('37', data);
// //       setState(data)
// //     }

// // function handleLoadLocalStore() {
// //       // console.log('42 LoadLocal', state);
// //       // const locState = loadState()
// //       const locState = state
// //       const phData = locState?.phData
// //       const phFocus = locState?.phFocus
// //       const phUser = locState?.phUser
// //       const phSource = 'localStore' //locState.sourceFlag
// //       if (locState) {
// //         console.log('91 SelectSource', locState);
// //         let data = phData
// //         dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
// //         data = phFocus
// //       dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data })
// //       data = phUser
// //       dispatch({ type: 'LOAD_TOSTORE_PHUSER', data })
// //       data = phSource
// //       dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data })
// //     }
// //   }
