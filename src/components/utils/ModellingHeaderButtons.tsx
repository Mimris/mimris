// make modul for header buttons

import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { Container, Row, Col } from 'react-bootstrap';

import EditFocusModal from '../EditFocusModal'
import LoginServer from '../loadModelData/LoginServer'
import LoadServer from '../loadModelData/LoadServer'
import LoadLocal from '../loadModelData/LoadLocal'
import LoadFile from '../loadModelData/LoadFile'
import LoadJsonFile from '../loadModelData/LoadJsonFile'
import LoadGitHub from '../loadModelData/LoadGitHub'
import LoadRecovery from '../loadModelData/LoadRecovery';
import { ReadModelFromFile } from './ReadModelFromFile';
import LoadNewModelProjectFromGithub from '../loadModelData/LoadNewModelProjectFromGitHub';
import LoadMetamodelFromGithub from '../loadModelData/LoadMetamodelFromGitHub';


import { SaveAllToFile, SaveAllToFileDate } from './SaveModelToFile';

const debug = false;
// export default {}

export default function HeaderButtons(props) {

  if (debug) console.log('HeaderButtons', props);

  const toggleRefresh = props.toggleRefresh

  let focusModel = useSelector(focusModel => props.phFocus?.focusModel)
  let focusModelview = useSelector(focusModelview => props.phFocus?.focusModelview)
  if (debug) console.log('69 Modelling', focusModel, focusModelview);

  const refresh = useSelector(refresh => props.refresh)
  const setRefresh = useSelector(setRefresh => props.setRefresh)

  function handleSaveAllToFileDate() {
    const projectname = props.phData.metis.name
    SaveAllToFileDate({ phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser }, projectname, '_PR')
  }

  function handleSaveAllToFile() {
    const projectname = props.phData.metis.name
    SaveAllToFile({ phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser }, projectname, '_PR')
  }


  const modelType = 'model'

  // if (debug) console.log('383 Modelling', activeTab);

  const loadlocal = (typeof window !== 'undefined') && <LoadLocal buttonLabel='Localfile' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
  // const loadgitlocal =  (typeof window !== 'undefined') && <LoadSaveGit  buttonLabel='GitLocal'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
  const loadgithub = (typeof window !== 'undefined') && <LoadGitHub buttonLabel='GitHub' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
  const loadnewModelproject = (typeof window !== 'undefined') && <LoadNewModelProjectFromGithub buttonLabel='New Modelproject' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
  const loadjsonfile = (typeof window !== 'undefined') && <LoadJsonFile buttonLabel='OSDU' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
  const loadfile = (typeof window !== 'undefined') && <LoadFile buttonLabel='Imp/Exp' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />

  if (typeof window !== 'undefined') <> not found </>

  return (
    <div className="buttonrow d-flex justify-content-between align-items-center " style={{ maxHeight: "29px", minHeight: "30px", whiteSpace: "nowrap" }}>
      <div className="me-4">

        <span className="" data-bs-toggle="tooltip" data-bs-placement="top" title="Load models from GitHub" > {loadgithub} </span>
        <span data-bs-toggle="tooltip" data-bs-placement="top" title="Load a new Model Project template from GitHub" > {loadnewModelproject} </span>
        <span data-bs-toggle="tooltip" data-bs-placement="top" title="Load downloaded Schema from OSDU (Jsonfiles)"  > {loadjsonfile} </span>
        <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (import/export) from/to files" style={{ whiteSpace: "nowrap" }}> {loadfile} </span>
      </div>
      <div className="d-flex justify-content-end align-items-center bg-light border border-2 p-1 border-solid border-primary py-1 mt-0 mx-2" style={{ minHeight: "34px" }}>
        <div className=" d-flex align-items-center me-0 pe-0">
          <i className="fa fa-folder text-secondary px-1"></i>
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from localStore or download/upload file" > {loadlocal} </span>
          <div className="" style={{ whiteSpace: "nowrap" }}></div>
        </div>
        {/* <div className="">
              <div className="input text-primary" style={{ maxHeight: "32px", backgroundColor: "transparent" }} data-bs-toggle="tooltip" data-bs-placement="top" title="Choose a local Project file to load">
                <input className="select-input" type="file" accept=".json" onChange={(e) => ReadModelFromFile(props, props.dispatch, e)} style={{width: "380px"}}/>
              </div>
            </div> */}
        <button className="border border-solid border-radius-4 px-2 mx-0 py-0"
          data-toggle="tooltip" data-placement="top" data-bs-html="true"
          title="Click here to Save the Project file &#013;(all models and metamodels) to file &#013;(in Downloads folder)"
          onClick={handleSaveAllToFile}><i className="fa fa-save me-2 ms-0 "></i>Save
        </button>
      </div>
      <span className="btn px- py-0 ps-auto mt-0 pt-1 bg-light text-secondary" onClick={toggleRefresh} data-toggle="tooltip" data-placement="top" title="Reload the model" > {refresh ? 'reload' : 'reload'} </span>

    </div>
  )

}