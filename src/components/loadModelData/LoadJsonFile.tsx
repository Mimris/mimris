// @ts-nocheck
import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';
// import Draggable from "react-draggable";
import { useDispatch } from 'react-redux'
import Select from "react-select"
// import { loadData } from '../actions/actions'
// import { loadState, saveState } from '../utils/LocalStorage'
import useLocalStorage  from '../hooks/use-local-storage'
// import { FaJoint } from 'react-icons/fa';
// import DispatchLocal  from '../utils/SetStoreFromLocalStorage'
import GenGojsModel from './GenGojsModel'
import { SaveModelToFile, SaveAllToFile, SaveAllToFileDate, ReadModelFromFile, ReadMetamodelFromFile } from '../utils/SaveModelToFile';
import { ReadConvertJSONFromFileToAkm } from '../utils/ConvertJSONToAkmModel';
import { ReadConvertJSONFromFile } from '../utils/ConvertJSONToModel';
import { ConnectImportedTopEntityTypes } from '../utils/ConnectImportedTopEntityTypes';
import SetColorsTopEntityTypes from '../utils/SetColorsTopEntityTypes';
import { WriteConvertModelToJSONFile } from '../utils/ConvertModelToJSON';
// import LoadOpenSubsurfaceDataUniverseJson from './LoadGitLabJson'



const LoadJsonFile = (props: any) => { // loads the selected OSDU JSON file(s)
    
  if (!props.ph.phData?.metis.models) return null
  
  const debug = false
  const dispatch = useDispatch()  
  const refresh = props.refresh
  const setRefresh = props.setRefresh
  function toggleRefresh() { setRefresh(!refresh); }

  const modelNames = props.ph.phData?.metis?.models.map((mn,index) => <span key={mn.id+index}>{mn.name} | </span>)
  const metamodelNames = props.ph.phData?.metis?.metamodels.map((mn,index) => (mn) && <span key={mn.id+index}>{mn.name} | </span>)
  if (debug) console.log('20 LoadLocal', props.ph.phData, modelNames, metamodelNames);
  
  if (typeof window === 'undefined') return

  const data = {
      phData:   props.ph.phData,
      phFocus:  props.ph.phFocus,
      phUser:   props.ph.phUser,
      phSource: props.phSource,
      lastUpdate: new Date().toISOString()
  }

  // Save all models and metamodels in current project to a file (no date in name) to the downloads folder
  function handleSaveAllToFile() {
    const projectname = props.ph.phData.metis.name
    console.log('37 LoadFile', data);
    
    SaveAllToFile(data, projectname, 'Project')
    // SaveAllToFile(data, projectname, 'AKMM-Project')
  }

  // Save all models and metamodels in current project to a file with date and time in the name to the downloads folder
  // function handleSaveAllToFileDate() {
  //   const projectname = props.ph.phData.metis.name
  //   console.log('37 LoadFile', data);   
  //   SaveAllToFileDate(data, projectname, 'Project')
  //   // SaveAllToFileDate(data, projectname, 'AKMM-Project')
  // }
  // Save current modelview (without instances) to a file in downloads folder

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
  const [gitLabJson, setGitLabJson] = useState(null);

  // const buttonrefresh = <button className="btn-context btn-primary float-right mb-0 pr-2" color="link" onClick={toggle}>{buttonLabel}</button>

  const [inclProps, setInclProps ] = useState(false)
  const [inclPropLinks, setInclPropLinks ] = useState(true)
  const [inclAbstractPropLinks, setInclAbstractPropLinks ] = useState(false)
  const [inclGeneric, setInclGeneric ] = useState(false)
  const [inclAbstract, setInclAbstract ] = useState(false)
  const [inclReference, setInclReference ] = useState(false)
  const [inclMasterdata, setInclMasterdata ] = useState(false)
  const [inclWorkProductComponent, setInclWorkProductComponent ] = useState(false)
  

  const handleInclProps = () => { setInclProps(!inclProps);};
  const handleInclPropLinks = () => { setInclPropLinks(!inclPropLinks);};
  const handleInclAbstractPropLinks = () => { setInclAbstractPropLinks(!inclAbstractPropLinks);};
  const handleInclGeneric = () => { setInclGeneric(!inclGeneric);};
  const handleInclAbstract = () => { setInclAbstract(!inclAbstract);};
  const handleInclReference = () => { setInclReference(!inclReference);};
  const handleInclMasterdata = () => { setInclMasterdata(!inclMasterdata);};
  const handleInclWorkProductComponent = () => { setInclWorkProductComponent(!inclWorkProductComponent);};


// const fetchData = async () => {
//   try {
//     const response = await fetch('https://community.opengroup.org/osdu/data/data-definitions/-/raw/master/Generated/master-data/ActivityPlan.1.2.0.json', { mode: 'no-cors' });
//     console.log('128 LoadJsonfile', response); // Do something with the data
//     if (response.ok) {
//       const data = await response.json();
//       console.log('129 LoadJsonfile', data); // Do something with the data
//     } else {
//       console.log('131 Error fetching data: ' + response);
//       throw new Error('132 Error fetching data: ' + response.status);
//     }
//   } catch (error) {
//     console.error(error);
//   }
// };

// const handleLoadGitLabJson = async () => {
//   fetchData();
// };


  const buttonSaveJSONToFileDiv = 
    <button className="btn-success btn-sm text-secondary fs-5 w-100  " 
      data-toggle="tooltip" data-placement="top" data-bs-html="true" 
      title="Click here to download current model as JSON to file&#013;(in Downloads folder)"
      >Save Current Model to Excel-file (not implemented yet)
      {/* onClick={handleSaveJSONToFile}>Save Current Model to File  */}
    </button >

  if (debug) console.log('172', buttonLabel);

  // import files and import them as objects to the project 
const importFilesRecursive = async (files) => {
  for (const file of files) {
    if (file.isDirectory) {
      const subFiles = await file.getFiles();
      await importFilesRecursive(subFiles);
    } else if (file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileContent = reader.result;
        ReadConvertJSONFromFileToAkm("AKM", inclProps, inclPropLinks, inclAbstractPropLinks, inclGeneric, props.ph, dispatch, fileContent);
      };
      reader.readAsText(file);
    }
  }
};

const importDirectory = async (fileOrDirectory) => {
  const files = Array.from(fileOrDirectory.target.files);
  if (files.length === 0) return;

  for (const file of files) {
    if (file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileContent = reader.result;
        ReadConvertJSONFromFileToAkm(
          fileContent, 
          dispatch, 
          props.ph,
          inclProps, 
          inclPropLinks, 
          inclAbstractPropLinks, 
          inclGeneric,
          inclAbstract,
          inclReference,
          inclMasterdata,
          // inclWorkProduct,
          inclWorkProductComponent,
           
          "AKM", 
        );
      };
      reader.readAsText(file);
    } else {
      console.log("File is not a JSON file.");
    }
  }
}

const importFile = async (e) => {
     
        // Convert the FileList into an array and iterate
        let files = Array.from(e.target.files)
        console.log('125', files);
        let filess = files.map(file => {
          if (debug) console.log('126 file', file);          
            let reader = new FileReader();
            return new Promise((resolve) => {              
                reader.onload = () => resolve(reader.result);              
                reader.readAsText(file);             
            });        
        });
        if (debug) console.log('12 files', filess);
        let res = await Promise.all(filess);
        res.map(r => {
          ReadConvertJSONFromFileToAkm(
            r,          
            dispatch, 
            props.ph,
            inclProps, 
            inclPropLinks, 
            inclAbstractPropLinks, 
            inclGeneric, 

            "AKM", 
          ) 
        })
      
}

  if (false) {
    // const openDirectoryPicker = async () => {
    //   try {
    //     const fileHandle = await window.showDirectoryPicker();
    //     const entries = await getDirectoryEntries(fileHandle);
    //     await importFilesRecursive(entries);
    //   } catch (error) {
    //     console.error("Error selecting directory:", error);
    //   }
    // };

    // const directoryButton = document.createElement('button');
    // directoryButton.style.display = 'none';
    // document.body.appendChild(directoryButton);

    // directoryButton.addEventListener('click', openDirectoryPicker);

    // directoryButton.click();
    // };

    // const getDirectoryEntry = async (directory) => {
    //   const fileHandle = await window.showDirectoryPicker();
    //   const entry = await fileHandle.getDirectoryHandle(directory);
    //   return entry;
    // };



    // const getDirectoryEntries = async (entry) => {
    //   const entries = [];
    //   for await (const item of entry.values()) {
    //     entries.push(item);
    //   }
    //   return entries;
    // };
  }

  return (
    <>
      <button className="btn bg-primary py-1 px-2 " onClick={toggle} ><i className="fa fa-house-tsunami me-2 ms-0 "></i>{buttonLabel}</button>
      {/* <Draggable handle=".handle"> */}
      <Modal size="lg" isOpen={modal} toggle={function noRefCheck(){}} >
        <ModalHeader className="handle" toggle={() => { toggle(); toggleRefresh(); function noRefCheck(){}} }>Export/Import OSDU Schema (JSON-files): </ModalHeader>
          {/* <Modal isOpen={modal} toggle={toggle} className={{className}} > */}
            {/* <ModalHeader toggle={() => { toggle(); toggleRefresh() }}>Export/Import: </ModalHeader> */}
        <ModalBody className="d-flex flex-column bg-primary">
          {/* <span className="text-light">Current Source: <strong> {props.ph.phSource}</strong></span> */}
          {/* <div className="source bg-light p-2 "> Models: <strong> {modelNames}</strong></div>
          <div className="source bg-light p-2 "> Metamodels: <strong> {metamodelNames}</strong></div> */}
          <div className="source bg-light p-2 ">
            <hr style={{ borderTop: "1px solid #8c8b8", backgroundColor: "#9cf", padding: "2px", margin: "1px", marginBottom: "1px" }} />
    
            <div className="loadsave--JsonToFile select bg-light mb-1 p-2  border border-dark">
                {/* <hr style={{ borderTop: "4px solid #8c8b8", backgroundColor: "#9cf", padding: "2px",  marginTop: "3px" , marginBottom: "3px" }} /> */}
                <h5>AKM objecttypes</h5>
                <div className="selectbox3 mb-2 border">
                  <h6>Import OSDU JSON-file as AKM model types</h6>
                  <h6>(This will import the OSDU Types as AKM EntityTypes, PropertyLinks, PropertyCollections and Property)</h6>
                  <label className="pt-3" htmlFor="directory">File(s)</label>
                  <input className="select-input w-100" type="file" accept=".json" onChange={ importFile } multiple />
                  <label className="pt-3" htmlFor="directory">or Directory</label>
                  <input
                    className="select-input w-100"
                    type="file"
                    accept=".json"
                    onChange={importDirectory}
                    webkitdirectory="true"
                    directory="true"
                  />
                  {/* <input className="select-input w-100" type="file" accept=".json" onClick={(e) => {"this.value=null;"}} onChange={(e) => ReadConvertJSONFromFileToAkm("AKM", inclProps, props.ph, dispatch, e)} multiple /> */}
                  <div className='mt-2'> Include EntityTypes:</div>
                  <div className="d-flex justify-content-between align-items-center my-2 border label-input-container"> 
                    <span className="bg-light d-flex align-items-center pe-1" style={{ height: "100%" }} >
                      <label className="flex-grow-1 text-secondary" htmlFor="inclMasterdata">Master data</label>
                      <input className="checkbox-input" type="checkbox" checked={inclMasterdata} onChange={handleInclMasterdata} />
                    </span>
                    <span className="bg-light d-flex align-items-center m-1 pe-1" style={{ height: "100%" }} >
                      <label className="flex-grow-1 text-secondary " htmlFor="inclWorkProductComp" >Work Product Components</label>
                      <input className="checkbox-input" type="checkbox" checked={inclWorkProductComponent} onChange={handleInclWorkProductComponent} />
                    </span>
                    <span className="bg-light d-flex align-items-center m-1 pe-1" style={{ height: "100%" }} >
                      <label className="flex-grow-1 text-secondary" htmlFor="inclAbstract">Abstract Components</label>
                      <input className="checkbox-input" type="checkbox" checked={inclAbstract} onChange={handleInclAbstract} />
                    </span>
                    <span className="bg-light d-flex align-items-center m-2 pe-1" style={{ height: "100%" }} >
                      <label className="flex-grow-1 text-secondary" htmlFor="inclReference">Reference Components</label>
                      <input className="checkbox-input" type="checkbox" checked={inclReference} onChange={handleInclReference} />
                    </span>
                    <span className="bg-light d-flex align-items-center pe-1" style={{ height: "100%" }}>
                      <label className="flex-grow-1 text-secondary" htmlFor="inclPropLinks">Debug (Generic objects)</label>
                      <input className="checkbox-input" type="checkbox" checked={inclGeneric} onChange={handleInclGeneric} />
                    </span>
                  </div>
                  <hr style={{ borderTop: "4px solid #8c8b8", backgroundColor: "#9cf", padding: "2px",  marginTop: "3px" , marginBottom: "3px" }} />
                  <div className='mt-2'> Include Properties and Links (relationships):</div>
                  <div className="d-flex justify-content-between align-items-center my-2 border label-input-container">
                    <span className="bg-light d-flex align-items-center" style={{ height: "100%" }}>
                      <label className="flex-grow-1" htmlFor="inclProps">Properties</label>
                      <input className="checkbox-input" type="checkbox" checked={inclProps} onChange={handleInclProps} />
                    </span>
                    <span className="bg-light d-flex align-items-center pe-1" style={{ height: "100%" }}>
                      <label className="flex-grow-1 text-secondary" htmlFor="inclPropLinks">Property Links</label>
                      <input className="checkbox-input" type="checkbox" checked={inclPropLinks} onChange={handleInclPropLinks} />
                    </span>
                    <span className="bg-light d-flex align-items-center pe-1" style={{ height: "100%" }}>
                      <label className="flex-grow-1 text-secondary" htmlFor="inclAbstractPropLinks">Abstract Property Links</label>
                      <input className="checkbox-input" type="checkbox" checked={inclAbstractPropLinks} onChange={handleInclAbstractPropLinks} />
                    </span>

                  </div>
                  {/* <input className="select-input w-100" type="file" accept=".json" onChange={(e) => ReadModelFromFile(props.ph, dispatch, e)} /> */}
                </div>
                {/* <div className="selectbox3 mb-2 border bg-secondary">
                  <h6>Import OSDU JSON-file as AKM model types</h6>
                  <h6>(This will import the OSDU Types as AKM EntityType and Property)</h6>
                  <input className="select-input w-100" type="file" accept=".json" onClick={(e) => {"this.value=null;"}} onChange={(e) => ReadConvertJSONFromFile("AKM", inclProps, props.ph, dispatch, e)} />
                  <label className="pt-3" htmlFor="inclProps ">Include Properties 
                    <input className="ml-3 mt-2 " type="checkbox" checked={inclProps} onChange={handleInclPropChange}/>
                  </label>
                </div> */}
                    {/* <LoadGitLabJsonButton /> */}
                {/* <button className="btn bg-primary py-1 px-2" onClick={handleLoadGitLabJson}>
                  Load GitLab JSON
                </button> */}
                {/* <hr style={{ borderTop: "4px solid #8c8b8", backgroundColor: "#9cf", padding: "2px",  marginTop: "3px" , marginBottom: "3px" }} /> */}
                <div className="selectbox3 mb-2">
                  <h6>Connect imported EntityTypes</h6> 
                  <Button className="modal--footer m-0 py-1 px-2 w-100" color="primary" data-toggle="tooltip" data-placement="top" data-bs-html="true" 
                    title="Picking Propertylinks and convert to relatioships!" onClick={() => { ConnectImportedTopEntityTypes("JSON", props.ph, dispatch) }}>Generate Relationships between EntityTypes (Propertylinks)
                  </Button>
                </div>
                {/* <div className="selectbox3 mb-2">
                  <h6>Set colors on EntityTypes</h6> 
                  <Button className="modal--footer m-0 py-1 px-2 w-100" color="primary" data-toggle="tooltip" data-placement="top" data-bs-html="true" 
                    title="Setting colors on EntityTypes!" 
                    onClick={() => { SetColorsTopEntityTypes(props.ph, dispatch)}}
                  >
                    Set OSDU Colors
                  </Button>
                </div> */}
            </div>
            <div className="loadsave--JsonToFile select mb-1 p-2  border border-dark" >
                {/* <h5>OSDU JSON filestructure</h5>
                <div className="selectbox3 mb-2 border">
                  <h6>Import OSDU Json file as a Json model </h6>
                  <h6>(This will import the OSDU Json structure)</h6>
                  <input className="select-input w-100" type="file" accept=".json" onClick={(e) => {"this.value=null;"}} onChange={(e) => ReadConvertJSONFromFile("JSON", inclProps, props.ph, dispatch, e)} />                 
                </div> */}
                <div className="selectbox2 mb-2 border">
                  <h6>Export model as OSDU Json file </h6>
                  <h6>(The file will be found in the download folder)</h6>
                  {buttonSaveJSONToFileDiv}
                </div>
            </div>
                <div className="selectbox2 mb-2 border bg-light">
                  <h6>Link to the OSDU Open Subsurface Data Universe - Software Data Definitions and Services - Data Definitions</h6>
                  <h6>(This will open a new tab in your browser)</h6>
                  <a className="text-primary" href="https://community.opengroup.org/osdu/data/data-definitions/-/tree/master/Generated" target="_blank">https://community.opengroup.org/osdu/data/data-definitions/-/tree/master/Generated</a>               
                </div>
          </div>
        </ModalBody>
        {/* <div className="ml-2">{emailDivMailto}</div> */}
        <ModalFooter>
          <Button className="modal--footer m-0 py-0 px-2" data-toggle="tooltip" data-placement="top" data-bs-html="true" 
            title="Click here when done!" onClick={() => {toggle(); toggleRefresh()}}>Done
          </Button>
        </ModalFooter>
      </Modal>
      {/* </Draggable> */}
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
    
    