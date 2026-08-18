// @ts-nocheck
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { Modal, Button } from 'react-bootstrap';

import useLocalStorage from '../../hooks/use-local-storage'
import useSessionStorage from "../../hooks/use-session-storage";
import { SaveAllToFile } from '../utils/SaveModelToFile';
import { setFocusIssue } from "@/actions/actions";
import { setUniverseSource } from "../../sharedUniverse";


// import { SaveModelToLocState } from "../utils/SaveModelToLocState";

const debug = false;

function ProjectDetailsForm(props: any) {
  const dispatch = useDispatch();
  // console.log("7 ProjectDetailsForm", props.props.phFocus);
  const legacyProps = props.props || {};
  const phData = legacyProps.phData || {};
  const phFocus = legacyProps.phFocus || {};
  const phUser = legacyProps.phUser || {};
  const phSource = legacyProps.phSource;
  const focusProj = phFocus.focusProj || {};
  const focusOrg = phFocus.focusOrg || {};
  const metis = phData.metis || {};

  const [projectName, setProjectName] = useState(focusProj.name);

  const [projectNumber, setProjectNumber] = useState(focusProj.projectNumber);
  const [id, setId] = useState(focusProj.id);
  const [name, setName] = useState(focusProj.name);
  const [org, setOrg] = useState(focusProj.org || focusOrg.name);
  const [repo, setRepo] = useState(focusProj.repo);
  const [path, setPath] = useState(focusProj.path);
  const [file, setFile] = useState(phSource || focusProj.file || `${metis.name || 'model'}.json`);
  const [source, setSource] = useState(phSource);
  const [branch, setBranch] = useState(focusProj.branch);

  const [focusModel, setFocusModel] = useState(phFocus.focusModel);
  const [focusModelview, setFocusModelview] = useState(phFocus.focusModelview);
  const [focusObject, setFocusObject] = useState(phFocus.focusObject);
  const [focusObjectview, setFocusObjectview] = useState(phFocus.focusObjectview);
  const [focusOrgState, setFocusOrg] = useState(phFocus.focusOrg);
  const [focusProjState, setFocusProj] = useState(phFocus.focusProj);
  const [focusRole, setFocusRole] = useState(phFocus.focusRole);
  const [focusTask, setFocusTask] = useState(phFocus.focusTask);
  const [focusIssue, setFocusIssue] = useState(phFocus.focusIssue);
  const [memoryLocState, setMemoryLocState] = useSessionStorage('memorystate', []);

  useEffect(() => {
    console.log("53 ProjectDetailsForm useEffect 1", phFocus);
    setId(id);
    setName(name);
    setOrg(org || '');
    setRepo(repo ||  '');
    setPath(path || '');
    setBranch(branch || 'main');
    setFile(file);
    setSource(`${org}/${repo}${(!path || path === '') ? '/' : `/${path.toString()}/`}${file}`);
    setProjectNumber(projectNumber || "1");
    setFocusIssue(phFocus.focusIssue);
  }, [file, name, org, repo, path, branch, projectNumber, focusIssue, phFocus, id]);

  useEffect(() => {
    console.log("57 ProjectDetailsForm useEffect 2", phFocus);
    setFile(focusProj.file || file);
    setName(focusProj.name || name);
  }, []);

  const idnew = focusProj.id ? focusProj.id : org + repo + path + file + branch;
  const namenew = focusProj.name ? focusProj.name : repo;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // props.onSubmit({ org, repo, path, file, branch });
    const data = { id: name, name, org, repo, path, file, branch, projectNumber };
    const datasource = source;

    // Todo: has to set id but show name in the list  ( look at Context button)
    const contextData = { focusModel: focusModel, focusOrg: focusOrg, focusProj: data, focusModelview: focusModelview, focusObject: focusObject, focusObjectview: focusObjectview, focusRole: focusRole, focusTask: focusTask, focusIssue: focusIssue }
    console.log("79 ProjectDetailsForm", data, datasource);
    dispatch({ type: 'SET_FOCUS_PROJ', data });
    dispatch(setUniverseSource(file));

    const timer = setTimeout(() => {
      console.log("44 ProjectDetailsForm", phFocus);
      // SaveModelToLocState(props.props, memoryLocState, setMemoryLocState)
      setMemoryLocState(legacyProps);
    }, 2000);
    return () => clearTimeout(timer);
  };

  const handleSaveAllToFile = () => {
    console.log('projectDetailsForm 97', file)
    // setProjectName(props.props.phFocus.focusProj.name);
    const data = `${file}`
    // const data = `${projectName}_PR`
    dispatch(setUniverseSource(data)) // setting the new project source filename
    console.log("ProjectDetailsForm 100", file);
    SaveAllToFile({ phData, phFocus, phSource, phUser }, file, '_PR')
  }
  const saveFile = (
    <>
      <button
        className="btn btn-sm rounded bg-primary text-light w-100 d-flex justify-content-center align-items-center"
        data-toggle="tooltip"
        data-placement="top"
        data-bs-html="true"
        title="Click here to Save the Project file to the local file system"
        onClick={handleSaveAllToFile}
      >
        <i className="fa fa-save fa-lg pe-2"></i> Save to local file
      </button>
    </>
  )


  
  return (
    <>
      <div className="h5 w-100">Model Domain name : <span className="bg-light ms-2 px-2 w-100"> {namenew}</span></div>
      <hr />
      <div className='d-flex justify-content-around '>
        GitHub repository parameters necessary to access the repository and the project file.
      </div>
      {/* <hr /> */}
      <form onSubmit={handleSubmit}>
        <div className='d-flex flex-column justify-content-end border ms-auto  p-1 mx-2'>
          {/* <div>GitHub Repository:</div> */}
          <div className='d-flex justify-content-between mb-2'>
            <label>Model Domain:</label>
            <input className='rounded bg-white px-1 border-light w-75'
              placeholder="My Domain name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setFile(e.target.value + '_PR.json'); }}
              title='Project name'
            />
          </div>
          <div className='d-flex justify-content-between mb-2'>
            <label>Organisation:</label>
            <input className='rounded bg-white px-1 border-light w-75'
             placeholder="My GitHub Organisation name"
              type="text"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              title='Organisation name'
            />
          </div>
          <div className='d-flex justify-content-between mb-2'>
            <label>Repo:</label>
            <input className='rounded bg-white px-1 border-light w-75'
              placeholder="My GitHub Repository name"
              type="text"
              value={(repo !== '') ? repo : focusProj.name}
              onChange={(e) => setRepo(e.target.value)}
              title='Repository name'
            />
          </div>
          <div className='d-flex justify-content-between mb-2'>
            <label>Path:</label>
            <input className='rounded bg-white px-1 border-light w-75'
              placeholder="My Path to the project file in the GitHub repository"
              type="text"
              // placeholder="models"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              title='Path to the project file in the GitHub repository'
            />
          </div>
          <div className='d-flex justify-content-between mb-2'>
            <label>Branch:</label>
            <input className='rounded bg-white border-light px-1 w-75'
              placeholder="Branch name"
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              title='Branch name'
            />
          </div>
          <div className='d-flex justify-content-between mb-2'>
            <label>Filename:</label>
            <input className='rounded bg-light border-light px-1 w-75'
              type="text"
              // readOnly
              // defaultValue={file}
              value={file}
              onChange={(e) => { setFile(e.target.value) }}
              title='Project filename'
            />
          </div>
          <hr />
          <div className=' mb-2'>
            Project File Source full path:
            <label>github.com/</label>
            <input className='rounded bg-white px-1 border-light w-100'
              placeholder="github.com/organisation/repo/path/file"
              type="text"
              // defaultValue={source}
              defaultValue={`${org || ''}/${repo || ''}${(!path || path === '') ? '/' : `/${path.toString()}/`}${file}`}
              title="File path to the project file in the GitHub repository"
            // onChange={(e) => setSource(e.target.value)}
            />
          </div>
          <div className='d-flex justify-content-between mb-2'>
            <label>Project Number (github):</label>
            <input className='rounded bg-white px-1 border-light w-25'
              placeholder="GitHub Project number"
              type="text"
              value={projectNumber}
              onChange={(e) => setProjectNumber(e.target.value)}
              title="Project number in the GitHub repository"
            />
          </div>
          <div className="d-flex justify-content-end">
            <button className="button btn bg-success btn-sm mt-4 px-3"
              type="submit"
              data-toggle="tooltip"
              data-placement="top"
              data-bs-html="true"
              title="Click here to save the above GitHub settings"
            >Save GitHub settings</button>
          </div>
        </div>
        <hr className="mt-2 pt-2" />
        {/* <p>Change the name of the Project from &quot;...-Template to your Project-name and save the file.</p> */}
        {/* {saveFile} */}
      </form>
    </>
  );
}

export default ProjectDetailsForm;
