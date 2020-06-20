// @ts-snocheck
import { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useDispatch } from 'react-redux'
// import { loadData } from '../actions/actions'
// import { loadState, saveState } from './utils/LocalStorage'
import useLocalStorage  from '../hooks/use-local-storage'
// import { FaJoint } from 'react-icons/fa';
// import DispatchLocal  from './utils/SetStoreFromLocalStorage'

const LoadLocal = (props: any) => {

  const dispatch = useDispatch()  

  // try {  
  //   if (!window){
  //     console.log('14', props);
  //     return <></>
  //   }
  // } catch (error) {
  //   console.log('18 LoadLocal error', error);
  //   return <> </>
  // }

  const [state, setState] = useLocalStorage('state',  window?.localStorage.getItem('state') || null);
   
  console.log('25', state);
  function handleDispatchStoreFromLocal() {  // Set storeFromLocal
    const locState = state
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

  function handleSaveLocalStore() {
    // const [state, setState] = useLocalStorage('state', {});
    console.log('72 SelectSource', state, props.ph);
    const data = {
      phData:   props.ph.phData,
      phFocus:  props.ph.phFocus,
      phUser:   props.ph.phUser,
      phSource: 'localStore'
    }
    // console.log('37', data);
    setState(data)
  }
  
  
  // const buttonDiv = <button className="float-right bg-light" onClick={handleSetSession} > Get Saved Session</button >
  const buttonSaveLocalStoreDiv = <button className="btn-primary btn-sm ml-2" onClick={handleSaveLocalStore} > Save to localStorage </button >
  const buttonLoadLocalStoreDiv = <button className="btn-primary btn-sm mr-2 float-right " onClick={handleDispatchStoreFromLocal} > Load from localStorage </button >
  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);

  // console.log('131', state);

  const buttonDiv = 
    <>
      <hr style={{ borderTop: "1px solid #8c8b8", backgroundColor: "#9cf", padding: "2px", margin: "1px", marginBottom: "1px" }} />
      <div className="store-div pb-1 mb-0">
        <h6>Local Store </h6>
        <div className="select" style={{ paddingTop: "4px" }}>
          {buttonSaveLocalStoreDiv} {buttonLoadLocalStoreDiv}
        </div>
      </div>
    </>


  return (
    <>
      <button className="btn-context btn-link float-right mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={toggle}>LocalStorage: </ModalHeader>
        <ModalBody className="pt-0">
          <strong>Current Source:  {props.phSource}</strong>
          <div className="source bg-light pt-2 ">
            {/* <table>
              <tr> */}
            {buttonDiv}
            {/* </tr>
            </table> */}
          </div>
        </ModalBody>
        <ModalFooter>
          <div style={{ fontSize: "smaller" }}>
            NB! Clicking "Load local" will overwrite current store (memory).
            To keep current version, click "Save to Local" to save to LocalStore before "Load local" .
          </div>
          {/* <Button color="primary" onClick={toggle}>Set</Button>{' '} */}
          <Button className="modal-footer m-0 py-1 px-2" color="link" onClick={toggle}>Exit</Button>
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
//         dispatch({ type: 'SET_FOCUS_PHDATA', data })
//         data = phFocus
//       dispatch({ type: 'SET_FOCUS_PHFOCUS', data })
//       data = phUser
//       dispatch({ type: 'SET_FOCUS_PHUSER', data })
//       data = phSource
//       dispatch({ type: 'SET_FOCUS_PHSOURCE', data })
//     }
//   }
