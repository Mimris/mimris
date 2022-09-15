// @ts- nocheck
import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';
import { useDispatch } from 'react-redux'
import Select from "react-select"
// import { loadData } from '../actions/actions'
// import { loadState, saveState } from './utils/LocalStorage'
import useLocalStorage  from '../hooks/use-local-storage'
import { i } from './utils/SvgLetters';
// import { FaJoint } from 'react-icons/fa';
// import DispatchLocal  from './utils/SetStoreFromLocalStorage'

const LoadRecovery = (props: any) => {

  const dispatch = useDispatch()
  const debug = false
  const refresh = props.refresh
  const setRefresh = props.setRefresh
  const today = new Date().toISOString()
  // today as year, month and day
  // const dd = String(today.getDate()).padStart(2, '0')

  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  
  if (typeof window === 'undefined') return

  const [memoryState, setMemoryLocState] = useLocalStorage('memorystate', null);
  const [inputValue, setInputValue] = useState('');
  function toggleRefresh() { setRefresh(!refresh); }

  // if memorytState is an object
  let memoryTmp = memoryState
  if (!Array.isArray(memoryState)) { memoryTmp = [memoryState] } else { memoryTmp = memoryState }
  if (debug) console.log('31 memoryTmp', memoryTmp.map((item: any) => {return { value: item.phSource, label: item.lastUpdate }}))

  // if memoryState is not an array then make it one

  // if memorytState is an object
  // if (typeof memoryTmp === 'object') memoryTmp = [memoryState] 
  // console.log('31 memoryTmp', Array.isArray(memoryTmp))
  
  const optionsMemory = memoryTmp.map((item: any, idx) =>  {return {  value: item.lastUpdate, label: idx+ ' '+item.phSource+ ' Saved : ' + item.lastUpdate }})

  // if memoryState is not an array then make it one

  if (!debug) console.log('46 LoadRecovery',memoryState, optionsMemory);

  // if (optionsMemory == undefined || optionsMemory?.length === 0) optionsMemory = [{value: 0, label: 'No recovery model'}]

  //
  // load to Redux-store from memoryState in localStorage. This is saved for every refresh)
  //
  function onChangeHandler(e: any) {  
    // setInputValue(e.target.value)
    const inputValue = e.target.value

    function cleanMemoryState(memState) { // if metis name is undefined then remove from localStorage
      console.log('59 cleanMemoryState', memState)
      const cleanMemState =  memState?.filter((item: any) => item.phSource !== undefined)
      setMemoryLocState(cleanMemState) 
    } 
    // if (debug) console.log('57 LoadRecovery', inputValue, e.target.value , e);
    if (debug) console.log('58 LoadRecovery',  inputValue, 'memval ', memoryState[inputValue], 'mem ', memoryState);

   
    function  dispatchToStore() {
      if (!debug) console.log('62 LoadRecovery', inputValue, memoryState);
      if (inputValue !== '') {
        if (memoryState[inputValue] !== undefined) {
          if (inputValue > memoryState.length) return;
          const ipVal= inputValue
          const ph = memoryState[ipVal]
          if (!debug) console.log('74 LoadRecovery', ipVal, memoryState[ipVal], memoryState);
          const phData = ph?.phData
          const phFocus = ph?.phFocus
          const phUser = ph?.phUser
          const phSource = (ph?.phSource === "") && phData.metis.name  || ph?.phSource 
          // console.log('91 SelectSource', locState);
          dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: phData })
          dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: phFocus })
          dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: phUser })
          let data = (phSource === "") ? phData.metis.name : phSource
          dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data })
        }
      }
    }
    
    cleanMemoryState(memoryTmp)
    dispatchToStore()

    // setTimeout(waitforInputValue, 1)

    // function refres() {
    //   setRefresh(!refresh)
    // }
    // setTimeout(refres, 1000);
  }

  let loadSelectedFromMemoryStoreDiv = <></>

  // if (optionsMemory) {
    // console.log('92 LoadRecovery', optionsMemory);
    loadSelectedFromMemoryStoreDiv = 
      <div className="loadstore selection d-flex justify-content-center border border-dark  ">
        <select className="modal-select w-100"  
          placeholder='Select Model to recover : '
          onChange={onChangeHandler}>
          <option>Select model to recover from last refresh</option>
          {optionsMemory.map((option, idx) => (
            <option key={idx} value={idx} title={option.label}>
              {option.label} 
            </option>))}
        </select>
      </div>
  // } else {
  //   loadSelectedFromMemoryStoreDiv = <></>  
  // }
 
 

  return (
    <>
      <button className="btn-transparent text-warning float-right ml-2 mr-2 mb-0 pr-2" onClick={toggle}>{buttonLabel}</button>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader className="bg-warning pl-2" toggle={() => { toggle(); toggleRefresh() }}> Recover from last refresh: </ModalHeader>
        <ModalBody className="pt-0 bg-warning">
          {/* Current Source: <strong> {props.ph.phSource}</strong> */}

          <div className="source bg-warning p-2">
            <hr style={{ borderTop: "1px solid #8c8b8", backgroundColor: "#9cf", padding: "2px", margin: "1px", marginBottom: "1px" }} />
            <div className="loadsave px-2 pb-1 mb-0 bg-warning">
            
              <div className="loadsave--memoryStore select mb-1 p-2  bg-secondary border border-dark">
                {/* <hr style={{ borderTop: "4px solid #8c8b8", backgroundColor: "#9cf", padding: "2px",  marginTop: "3px" , marginBottom: "3px" }} /> */}
                <h5 className='text-warning'>Crash Recovery </h5>
                <div className="footer--text mb-2" style={{ fontSize: "smaller" }}>
                  If the browser hang or crash, or you made a mistake, you can go back to an earlier version
                  by select a recovery version below!
                  <br />(The recovery version is updated each time you select a new modelview tab or click refresh)
                </div>
                {/* {buttonLoadMemoryStoreDiv} */}
                {loadSelectedFromMemoryStoreDiv}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="bg-warning">
          <div className="footer--text mb-2" style={{ fontSize: "smaller" }}>
            Local Storage is controlled by the Internet Browser, and may at some point be deleted.
          </div>
          <Button className="modal--footer m-0 py-1 px-2" color="secondary" data-toggle="tooltip" data-placement="top" data-bs-html="true" 
            title="Click here when done!" onClick={() => {toggle(); toggleRefresh()}}>Done</Button>
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

export default LoadRecovery

