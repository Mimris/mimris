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
import { ReadConvertJSONFromFile } from './utils/ConvertJSONToModel';
import { WriteConvertModelToJSONFile } from './utils/ConvertModelToJSON';

const LoadJsonFile = (props: any) => {
    
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
        
        SaveAllToFile(data, projectname, 'Project')
        // SaveAllToFile(data, projectname, 'AKMM-Project')
      } 
      // Save all models and metamodels in current project to a file with date and time in the name to the downloads folder
      function handleSaveAllToFileDate() {
        const projectname = props.ph.phData.metis.name
        console.log('37 LoadFile', data);
        
        SaveAllToFileDate(data, projectname, 'Project')
        // SaveAllToFileDate(data, projectname, 'AKMM-Project')
      }
      
    
      // Save current modelview (without instances) to a file in downloads foler 
      function handleSaveModelviewToFile() {  // Todo:  Save objects and relships with the objectviews ???
        const projectname = props.ph.phData.metis.name
        const model = props.ph?.phData?.metis?.models?.find(m => m.id === props.ph?.phFocus?.focusModel?.id) 
        const focusModelviewIndex = model.modelviews?.findIndex(m => m.id === props.ph?.phFocus?.focusModelview?.id) 
        const modelview = model.modelviews[focusModelviewIndex]
        console.log('43', focusModelviewIndex, modelview);
        
        SaveModelToFile({modelview: modelview}, modelview.name, 'Modelview')
        // SaveModelToFile({modelview: modelview}, modelview.name, 'AKMM-Modelview')
        // SaveModelToFile(model, projectname+'.'+model.name, 'AKMM-Model')
      }
    
      // Save current model to a file with date and time in the name to the downloads folder
      function handleSaveModelToFile() {
        const projectname = props.ph.phData.metis.name
        const model = props.ph?.phData?.metis?.models?.find(m => m.id === props.ph?.phFocus?.focusModel?.id) 
        SaveModelToFile(model, model.name, 'Model')
        // SaveModelToFile(model, model.name, 'AKMM-Model')
        // SaveModelToFile(model, projectname+'.'+model.name, 'AKMM-Model')
      }
      
      // Save current metamodel to a file with date and time in the name to the downloads folder
      function handleSaveMetamodelToFile() {
        const model = props.ph?.phData?.metis?.models?.find(m => m.id === props.ph?.phFocus?.focusModel?.id) 
        const metamodel = props.ph?.phData?.metis?.metamodels?.find(m => m.id === model?.metamodelRef) 
        SaveModelToFile(metamodel, metamodel.name, 'Metamodel')
        // SaveModelToFile(metamodel, metamodel.name, 'AKMM-Metamodel')
      }
      
      // Save current model to a OSDU JSON file with date and time in the name to the downloads folder
      function handleSaveJSONToFile() {
        const projectname = props.ph.phData.metis.name
        const model = props.ph?.phData?.metis?.models?.find(m => m.id === props.ph?.phFocus?.focusModel?.id) 
        const modelview = model.modelviews?.find(mv=> mv && (mv.id === props.ph?.phFocus?.focusModelview?.id))
        WriteConvertModelToJSONFile(model, modelview, model.name, 'Json')
        // WriteConvertModelToJSONFile(model, model.name, 'AKMM-Model')
        // SaveModelToFile(model, projectname+'.'+model.name, 'AKMM-Model')
      }
    
      const { buttonLabel, className } = props;
      const [modal, setModal] = useState(false);
      const toggle = () => setModal(!modal);
    
      // const buttonrefresh = <button className="btn-context btn-primary float-right mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button>

      const [inclProps, setInclProps ] = useState(false)

      const handleInclPropChange = () => {
        setInclProps(!inclProps);
      };
    
 
      const buttonSaveJSONToFileDiv = 
        <button className="btn-success text-white-50 btn-sm mr-2 w-100  " 
          data-toggle="tooltip" data-placement="top" data-bs-html="true" 
          title="Click here to download current model as JSON to file&#013;(in Downloads folder)"
          onClick={handleSaveJSONToFile}>Save Current Model to File 
        </button >
   
      if (debug) console.log('172', buttonLabel);
      
      return (
        <>
          <button className="btn-context btn-success float-right mr-2 mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button>
          <Modal isOpen={modal} toggle={toggle} className={className} >
            <ModalHeader toggle={() => { toggle(); toggleRefresh() }}>Export/Import: </ModalHeader>
            <ModalBody className="pt-0">
              Current Source: <strong> {props.ph.phSource}</strong>
              <div className="source bg-light p-2 "> Models: <strong> {modelNames}</strong></div>
              <div className="source bg-light p-2 "> Metamodels: <strong> {metamodelNames}</strong></div>
              <div className="source bg-light p-2 ">
                <hr style={{ borderTop: "1px solid #8c8b8", backgroundColor: "#9cf", padding: "2px", margin: "1px", marginBottom: "1px" }} />
       
                <form className="loadsave--JsonToFile select bg-primary mb-1 p-2  border border-dark">
                    {/* <hr style={{ borderTop: "4px solid #8c8b8", backgroundColor: "#9cf", padding: "2px",  marginTop: "3px" , marginBottom: "3px" }} /> */}
                    <h5>AKM objecttypes</h5>
                    <div className="selectbox3 mb-2 border">
                      <h6>Import OSDU JSON-file as AKM model types</h6>
                      <h6>(This will import the OSDU Types as AKM EntityType and Property)</h6>
                      <input className="select-input w-100" type="file" accept=".json" onClick={(e) => {"this.value=null;"}} onChange={(e) => ReadConvertJSONFromFile("AKM", inclProps, props.ph, dispatch, e)} />
                      <label className="pt-3" htmlFor="inclProps ">Include Properties 
                        <input className="ml-3 mt-2 " type="checkbox" checked={inclProps} onChange={handleInclPropChange}/>
                      </label>
                      {/* <input className="select-input w-100" type="file" accept=".json" onChange={(e) => ReadModelFromFile(props.ph, dispatch, e)} /> */}
                    </div>


                </form>
                <div className="loadsave--JsonToFile select bg-success mb-1 p-2  border border-dark">
                    <h5>OSDU JSON filestructure</h5>
                    <div className="selectbox3 mb-2 border">
                      <h6>Import OSDU Json file as a Json model </h6>
                      <h6>(This will import the OSDU Json structure)</h6>
                      <input className="select-input w-100" type="file" accept=".json" onClick={(e) => {"this.value=null;"}} onChange={(e) => ReadConvertJSONFromFile("JSON", inclProps, props.ph, dispatch, e)} />
                      {/* <input className="select-input w-100" type="file" accept=".json" onChange={(e) => ReadModelFromFile(props.ph, dispatch, e)} /> */}
                 
                    </div>
                    <div className="selectbox2 mb-2 border">
                      <h6>Export model as OSDU Json file </h6>
                      <h6>(The file will be found in the download folder)</h6>
                      {buttonSaveJSONToFileDiv}
                    </div>
                    
                      {/* <h6>Send Project by mail </h6>
                      <div className="selectbox bg-white mb-2 border">
                        <div className="ml-2">{emailDivGmail}</div>
                        <div className="ml-2">{emailDivMailto}</div>
                      </div> */}
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
                .selectbox2 {
                    background-color: rgba(0, 0, 0, 0.3) ;
                    border: 20px;
                    border-color: tomato;
                    padding: 1%;
                }
                .selectbox3 {
                    background-color: rgba(100, 100, 100, 0.1) ;
                    border: 20px;
                    border-color: tomato;
                    padding: 1%;
                }
          
                `}</style>
        </>
      )
    }
    
    export default LoadJsonFile
    
    