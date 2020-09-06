// @ts-snocheck
import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useDispatch } from 'react-redux'
// import { loadData } from '../actions/actions'
// import { loadState, saveState } from './utils/LocalStorage'
import useLocalStorage  from '../hooks/use-local-storage'
// import { FaJoint } from 'react-icons/fa';
// import DispatchLocal  from './utils/SetStoreFromLocalStorage'

const LoadLocal = (props: any) => {

  const dispatch = useDispatch()  
  const refresh = props.refresh
  const setRefresh = props.setRefresh
  function toggleRefresh() { setRefresh(!refresh); }

  const modelNames = props.ph.phData?.metis?.models.map(mn => <span>{mn.name} | </span>)
  const metamodelNames = props.ph.phData?.metis?.metamodels.map(mn => <span>{mn.name} | </span>)
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
  const [locState, setLocState] = useLocalStorage('state', null);

  // console.log('25 LoadLocal', locState.phData.metis.models[0].modelviews[0].objectviews[0].loc);
  function handleDispatchToStoreFromLocal() {  // Set storeFromLocal
    // const locState = state
    console.log('38 LoadLocal', props);
    
    const phData = props.ph?.phData
    const phFocus = props.ph?.phFocus
    const phUser = props.ph?.phUser
    const phSource = 'localStore' //locState.sourceFlag
    if (locState) {
      console.log('91 SelectSource', locState);
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

  function handleSaveToLocalStore() {
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

  function handleSaveCurrentToLocalStore() {
    // first find current model which is in reduxStore
    let reduxmod = props.ph?.phData?.metis?.models?.find(m => m.id === props.ph?.phFocus?.focusModel?.id) // current model index
    let curmindex = locState.phData?.metis?.models?.findIndex(m => m?.id === reduxmod?.id) // current model index
    // find lenght of modellarray in lodalStore
    const curmlength = locState.phData.metis.models?.length   
    if (curmindex < 0) { curmindex = curmlength } // rvindex = -1, i.e.  not fond, which means adding a new model
    // then find metamodel which is in reduxStore
    let reduxmmod = props.ph?.phData?.metis?.metamodels?.find(mm => mm.id === reduxmod?.metamodelRef) // current model index
    let curmmindex = locState.phData?.metis?.models?.findIndex(mm=> mm?.id === reduxmod?.id) // current model index
    // then find lenght of modellarray in lodalStore
    const curmmlength = locState.phData.metis.metamodels?.length   
    if (curmmindex < 0) { curmmindex = curmmlength } // rvindex = -1, i.e.  not fond, which means adding a new model
    console.log('73 LoadLocal', curmindex, reduxmod);
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
            ...locState.phData.metis.models.slice(0, curmmindex),     
            reduxmmod,
            ...locState.phData.metis.models.slice(curmmindex + 1),
          ]
        },
      },
      phFocus:  props.ph.phFocus,
      phUser:   props.ph.phUser,
      phSource: 'localStore'
    };
    console.log('59 LoadLocal', data);
    (reduxmod) && setLocState(data)
    // console.log('62 LoadLocal', state);
  }
  
  // const buttonDiv = <button className="float-right bg-light" onClick={handleSetSession} > Get Saved Session</button >
  const buttonSaveToLocalStoreDiv = <button className="btn-primary btn-sm ml-2 float-right w-50" onClick={handleSaveToLocalStore} > Save all to localStorage </button >
  const buttonLoadLocalStoreDiv = <button className="btn-link btn-sm mr-2 " onClick={handleDispatchToStoreFromLocal} > Load all from localStorage </button >
  const buttonSaveCurrentToLocalStoreDiv = <button className="btn-primary btn-sm mt-1 ml-2 float-right w-50" onClick={handleSaveCurrentToLocalStore} > Add current model to localStorage </button >
  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  // console.log('131', state);

  const buttonDiv = 
    <>
      <hr style={{ borderTop: "1px solid #8c8b8", backgroundColor: "#9cf", padding: "2px", margin: "1px", marginBottom: "1px" }} />
      <div className="store-div px-2 pb-4 mb-0">
        <h6>Local Store Actions</h6>
        <div className="select pb-5" style={{ paddingTop: "4px" }}>
          {buttonSaveToLocalStoreDiv}
          {buttonLoadLocalStoreDiv}
          {buttonSaveCurrentToLocalStoreDiv} 
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
