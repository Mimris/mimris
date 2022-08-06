// @ts-snocheck
import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';
import { useDispatch } from 'react-redux'
import Select from "react-select"
// import { loadData } from '../actions/actions'
// import { loadState, saveState } from './utils/LocalStorage'
import useLocalStorage  from '../hooks/use-local-storage'
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
  function toggleRefresh() { setRefresh(!refresh); }
  
  if (typeof window === 'undefined') return

  const [memoryState] = useLocalStorage('memorystate', null);
  if (!Array.isArray(memoryState)) return

  // if memoryState is not an array then make it one
  let memoryStateTmp
  if (debug) console.log('22 LoadRecovery', memoryState, memoryStateTmp);

  let optionsMemory = memoryState?.map((o, idx) => o && {value: idx, label: o.lastUpdate  +' | '+o.phSource});
  if (debug) console.log('25 LoadRecovery', optionsMemory);
  if (optionsMemory === undefined || optionsMemory?.length === 0) optionsMemory = [{value: 0, label: 'No recovery model'}]

  const [selected, setSelected] = useState(optionsMemory[0].value);

  //
  // load to Redux-store from memoryState in localStorage. This is save for every refresh)
  //
  function handleChange(e: any) {  
    // memoryStatus = true

    if (debug) console.log('35 LoadRecovery', e, memoryState[e.target.value]);
    if (debug) console.log('36 LoadRecovery', props, );

    if (memoryState) {
  

      const ph = memoryState[e.target.value]
      const phData = ph?.phData
      const phFocus = ph?.phFocus
      const phUser = ph?.phUser
      const phSource = (ph?.phSource === "") && phData.metis.name  || ph?.phSource 
      // console.log('91 SelectSource', locState);
      let data = phData
      dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
      data = phFocus
      dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data })
      data = phUser
      dispatch({ type: 'LOAD_TOSTORE_PHUSER', data })
      data = (phSource === "") ? phData.metis.name : phSource
      dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data })
      console.log('99 LoadRecovery', ph);
    }
    function refres() {
      setRefresh(!refresh)
    }
    setTimeout(refres, 100);
  }


  let loadSelectedFromMemoryStoreDiv = <></>
  if (optionsMemory) 
    loadSelectedFromMemoryStoreDiv = 
      <div className="loadstore selection d-flex justify-content-center border border-dark  ">
        {/* <p className='py-2 pr-4'>Select Model to recover:</p> */}
        <select className="modal-select w-100"  
            // defaultValue={optionsMemory[0].value}
            // style={{ color: selected === defaultSelectValue ? "gray" : "black" }}
            placeholder='Select Model to recover : '
            // onChange={event => console.log('67',optionsMemory, (event))}>
            onChange={handleChange}>
            <option>Select model to recover from last refresh</option>
            {optionsMemory.map(option => (
                <option key={option.value} value={option.value} title={option.label}>
                  {option.label} 
                </option>))}
        </select>
      </div>
 
  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);

  return (
    <>
      <button className="btn-context btn-warning float-right mr-2 mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button>
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

