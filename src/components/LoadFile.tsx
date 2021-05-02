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
import genGojsModel from './GenGojsModel'
import { SaveModelToFile, SaveAllToFile, SaveAllToFileDate, ReadModelFromFile, ReadMetamodelFromFile } from './utils/SaveModelToFile';

const LoadFile = (props: any) => {
  
  const debug = false
  const dispatch = useDispatch()  
  const refresh = props.refresh
  const setRefresh = props.setRefresh
  function toggleRefresh() { setRefresh(!refresh); }

  const modelNames = props.ph.phData?.metis?.models.map(mn => <span key={mn.id}>{mn.name} | </span>)
  const metamodelNames = props.ph.phData?.metis?.metamodels.map(mn => (mn) && <span key={mn.id}>{mn.name} | </span>)
  if (debug) console.log('20 LoadLocal', props.ph.phData, modelNames, metamodelNames);
  
  if (typeof window === 'undefined') return

  const data = {
      phData:   props.ph.phData,
      phFocus:  props.ph.phFocus,
      phUser:   props.ph.phUser,
      phSource: 'localFile'
    }


  // Save all models and metamodels in current project to a file (no date in name) to the downloads folder
  function handleSaveAllToFile() {
    const projectname = props.ph.phData.metis.name
    console.log('37 LoadFile', data);
    
    SaveAllToFile(data, projectname, 'AKMM-Project')
  } 
  // Save all models and metamodels in current project to a file with date and time in the name to the downloads folder
  function handleSaveAllToFileDate() {
    const projectname = props.ph.phData.metis.name
    console.log('37 LoadFile', data);
    
    SaveAllToFileDate(data, projectname, 'AKMM-Project')
  }
  

  // Save current modelview (without instances) to a file in downloads foler 
  function handleSaveModelviewToFile() {  // Todo:  Save objects and relships with the objectviews ???
    const projectname = props.ph.phData.metis.name
    const model = props.ph?.phData?.metis?.models?.find(m => m.id === props.ph?.phFocus?.focusModel?.id) 
    const focusModelviewIndex = model.modelviews?.findIndex(m => m.id === props.ph?.phFocus?.focusModelview?.id) 
    const modelview = model.modelviews[focusModelviewIndex]
    console.log('43', focusModelviewIndex, modelview);
    
    SaveModelToFile({modelview: modelview}, modelview.name, 'AKMM-Modelview')
    // SaveModelToFile(model, projectname+'.'+model.name, 'AKMM-Model')
  }

  // Save current model to a file with date and time in the name to the downloads folder
  function handleSaveModelToFile() {
    const projectname = props.ph.phData.metis.name
    const model = props.ph?.phData?.metis?.models?.find(m => m.id === props.ph?.phFocus?.focusModel?.id) 
    SaveModelToFile(model, model.name, 'AKMM-Model')
    // SaveModelToFile(model, projectname+'.'+model.name, 'AKMM-Model')
  }
  
  // Save current metamodel to a file with date and time in the name to the downloads folder
  function handleSaveMetamodelToFile() {
    const model = props.ph?.phData?.metis?.models?.find(m => m.id === props.ph?.phFocus?.focusModel?.id) 
    const metamodel = props.ph?.phData?.metis?.metamodels?.find(m => m.id === model?.metamodelRef) 
    SaveModelToFile(metamodel, metamodel.name, 'AKMM-Metamodel')
  }

 


  const { buttonLabel, className } = props;
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);

  // const buttonrefresh = <button className="btn-context btn-primary float-right mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button>


  const buttonSaveAllToFileDiv = 
    <button 
      className="btn-primary  mr-2 mb-3 w-100  " 
      data-toggle="tooltip" data-placement="top" data-bs-html="true" 
      title="Click here to download the Project&#013;(all models and metamodels) to file &#013;(in Downloads folder)"
      onClick={handleSaveAllToFile}>Save Project (all) to File without date
    </button >
  const buttonSaveAllToFileDateDiv = 
    <button 
      className="btn-primary  mr-2 mb-3 w-100  " 
      data-toggle="tooltip" data-placement="top" data-bs-html="true" 
      title="Click here to download the Project&#013;(all models and metamodels) to file &#013;(in Downloads folder)"
      onClick={handleSaveAllToFileDate}>Save Project (all) to File
    </button >
  const buttonSaveModelToFileDiv = 
    <button className="btn-primary text-white-50 btn-sm mr-2 w-100  " 
      data-toggle="tooltip" data-placement="top" data-bs-html="true" 
      title="Click here to download current model to file&#013;(in Downloads folder)"
      onClick={handleSaveModelToFile}>Save Current Model to File 
    </button >
  const buttonSaveModelviewToFileDiv = 
    <button className="btn-primary text-white-50 btn-sm mr-2  w-100  " 
      data-toggle="tooltip" data-placement="top" data-bs-html="true" 
      title="Click here to download current modelview to file&#013;(in Downloads folder)"
      onClick={handleSaveModelviewToFile}>Save Current Modelview to File 
    </button >
  const buttonSaveMetamodelToFileDiv = 
    <button 
      className="btn-primary btn-sm mr-2  w-100  " 
      data-toggle="tooltip" data-placement="top" data-bs-html="true" 
      title="Click here to download the current Metamodel to file&#013;(in Downloads folder)&#013;The current Metamoel is the Metamodel of the current Model."     
      onClick={handleSaveMetamodelToFile}>Save Current Metamodel to File (Downloads)
    </button >
  

  // const projectname = props.ph.phData.metis.name
  // const today = new Date().toISOString().slice(0, 19)
  // const emailAddress = 'snorres@gmail.com'
  // const subject = `Project_${projectname}_${today} (AKM Models)`
  // const body = JSON.stringify(data)
  // const hrefGmail = 'https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to=' + emailAddress+'&subject=' + subject + '&body=' + body
  // const hrefEmail = 'mailto:' + emailAddress+'?subject=' + subject + '&body=' + body
  // const emailDivGmail = <a href={hrefGmail} target="_blank">Gmail: Send Context (using your Gmail)</a>
  // const emailDivMailto = <a href={hrefEmail} target="_blank">Email: Send Context (using your Email)</a>
  

  if (debug) console.log('172', buttonLabel);
  
  return (
    <>
      <button className="btn-context btn-primary float-right mr-2 mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button>
      <Modal isOpen={modal} toggle={toggle} className={className} >
        <ModalHeader toggle={() => { toggle(); toggleRefresh() }}>Export/Import: </ModalHeader>
        <ModalBody className="pt-0">
          Current Source: <strong> {props.ph.phSource}</strong>
          <div className="source bg-light p-2 "> Models: <strong> {modelNames}</strong></div>
          <div className="source bg-light p-2 "> Metamodels: <strong> {metamodelNames}</strong></div>
          <div className="source bg-light p-2 ">
            <hr style={{ borderTop: "1px solid #8c8b8", backgroundColor: "#9cf", padding: "2px", margin: "1px", marginBottom: "1px" }} />
            <div className="loadsave px-2 pb-1 mb-0">
            <div className="loadsave--modelToFile select mb-1 p-2  border border-dark">
                {/* <hr style={{ borderTop: "4px solid #8c8b8", backgroundColor: "#9cf", padding: "2px",  marginTop: "3px" , marginBottom: "3px" }} /> */}
                  <h5>Model</h5>
                <div className="selectbox mb-2 border">
                  <h6>Import from file (will overwrite current) </h6>
                  <input className="select-input w-100" type="file" onChange={(e) => ReadModelFromFile(props.ph, dispatch, e)} />
             
                </div>
                <div className="selectbox mb-2 border">
                  <h6>Export to file </h6>
                  {/* {buttonSaveAllToFileDiv} */}
                  {buttonSaveAllToFileDateDiv}
                  {buttonSaveModelToFileDiv}
                  {buttonSaveModelviewToFileDiv}
                </div>
                  {/* <h6>Send Project by mail </h6>
                  <div className="selectbox bg-white mb-2 border">
                    <div className="ml-2">{emailDivGmail}</div>
                    <div className="ml-2">{emailDivMailto}</div>
                  </div> */}
              </div>
              <div className="loadsave--metamodelToFile select mb-1 p-2 border border-dark">
                {/* <hr style={{ borderTop: "4px solid #8c8b8", backgroundColor: "#9cf", padding: "2px",  marginTop: "3px" , marginBottom: "3px" }} /> */}
                 <h5>Metamodel </h5>
                <div className="selectbox mb-2 border"> 
                 <h6>Import from file (will overwrite current)</h6>
                  <input className="select-input" type="file" onChange={(e) => ReadMetamodelFromFile(props.ph, dispatch, e)} />
                </div>
                <div className="selectbox mb-2 border"> 
                  <h6>Export to file </h6>
                  {buttonSaveMetamodelToFileDiv}
                </div>
              </div>
            </div>
          </div>

        </ModalBody>
        {/* <div className="ml-2">{emailDivMailto}</div> */}
        <ModalFooter>
          <Button className="modal--footer m-0 py-1 px-2" color="primary" data-toggle="tooltip" data-placement="top" data-bs-html="true" 
            title="Click here when done!" onClick={() => {toggle(); toggleRefresh()}}>Done</Button>
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

export default LoadFile

