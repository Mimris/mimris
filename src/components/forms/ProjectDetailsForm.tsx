import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import useLocalStorage from '../../hooks/use-local-storage'
import useSessionStorage from "../../hooks/use-session-storage";

// import { SaveModelToLocState } from "../utils/SaveModelToLocState";

const debug = false;

function ProjectDetailsForm(props) {
  const dispatch = useDispatch();
  console.log("7 ProjectDetailsForm", props.props.phFocus);

  const [projectNumber, setProjectNumber] = useState(props.props.phFocus?.focusProj.projectNumber);
  const [id, setId] = useState(props.props.phFocus?.focusProj.id);
  const [name, setName] = useState(props.props.phFocus?.focusProj.name);
  const [org, setOrg] = useState(props.props.phFocus?.focusProj?.org || props.props.phFocus?.focusOrg.name);
  const [repo, setRepo] = useState(props.props.phFocus?.focusProj.repo);
  const [path, setPath] = useState(props.props.phFocus?.focusProj.path);
  const [file, setFile] = useState(props.props.phFocus?.focusProj.file || props.props.phData.metis.name || props.props.phSource + '.json');
  const [source, setSource] = useState(props.props.phSource);
  const [branch, setBranch] = useState(props.props.phFocus?.focusProj.branch);

  const [focusModel, setFocusModel] = useState(props.props.phFocus?.focusModel);
  const [focusModelview, setFocusModelview] = useState(props.props.phFocus?.focusModelview);
  const [focusObject, setFocusObject] = useState(props.props.phFocus?.focusObject);
  const [focusObjectview, setFocusObjectview] = useState(props.props.phFocus?.focusObjectview);
  const [focusOrg, setFocusOrg] = useState(props.props.phFocus?.focusOrg);
  const [focusProj, setFocusProj] = useState(props.props.phFocus?.focusProj);
  const [focusRole, setFocusRole] = useState(props.props.phFocus?.focusRole);
  const [focusTask, setFocusTask] = useState(props.props.phFocus?.focusTask);
  const [focusIssue, setFocusIssue] = useState(props.props.phFocus?.focusIssue);


  const [memoryLocState, setMemoryLocState] = useSessionStorage('memorystate', null); //props);


  if (debug) console.log("14 ProjectDetailsForm", org, repo, path, file, branch, focusModel, focusModelview, focusObject, focusObjectview, focusOrg, focusProj, focusRole, focusTask, focusIssue);

  useEffect(() => {
    // setOrg(props.phFocus?.focusOrg.org);
    // setRepo(props.phFocus?.focusProj.name);
    // setPath(props.phFocus?.focusProj.path);
    // setFile(props.phFocus?.focusProj.file);
    // setBranch(props.phFocus?.focusProj.branch);
    // setFocusProj(props.props.phData?.metis.name)
  }, []);

  useEffect(() => {
    console.log("53 ProjectDetailsForm", props.props.phFocus);
    setId(id);
    setName(name);
    setOrg(org);
    setRepo(repo);
    setPath(path);
    setBranch(branch);
    setFile(file);
    setSource(org + '/' + repo + '/' + path + '/' + file);
    setProjectNumber(projectNumber);
  }, [file, name, org, repo, path, branch, projectNumber]);

  useEffect(() => {
    console.log("57 ProjectDetailsForm", props.props.phFocus);
    setFile(props.props.phFocus?.focusProj.file);
    setName(props.props.phFocus?.focusProj.name);
  }, []);

  const idnew = (props.props.phFocus?.focusProj.id) ? props.props.phFocus?.focusProj.id : org + repo + path + file + branch;
  const namenew = (props.props.phFocus?.focusProj.name) ? props.props.phFocus?.focusProj.name : repo;

  const handleSubmit = (event) => {
    event.preventDefault();
    // props.onSubmit({ org, repo, path, file, branch });
    const data = { id: name, name, org, repo, path, file, branch, projectNumber };
    const datasource = source;

    // Todo: has to set id but show name in the list  ( look at Context button)
    const contextData = { focusModel: focusModel, focusOrg: focusOrg, focusProj: data, focusModelview: focusModelview, focusObject: focusObject, focusObjectview: focusObjectview, focusRole: focusRole, focusTask: focusTask, focusIssue: focusIssue }
    console.log("79 ProjectDetailsForm", data, datasource);
    dispatch({ type: 'SET_FOCUS_PROJ', data });
    dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: datasource });

    const timer = setTimeout(() => {
      console.log("44 ProjectDetailsForm", props.props.phFocus);
      // SaveModelToLocState(props.props, memoryLocState, setMemoryLocState)
      setMemoryLocState(props.props);
    }, 2000);
    return () => clearTimeout(timer);
  };

  return (
    <>
      <div className="h5 w-100">Project name : <span className="bg-light ms-2 px-2 w-100"> {namenew}</span></div>
      <hr />
      <div className='d-flex justify-content-around '>
        GitHub repository parameters necessary to access the repository and the project file.
      </div>
      <hr />
      <form onSubmit={handleSubmit}>
        <div className='d-flex flex-column justify-content-between border mx-2'>
          {/* <div>GitHub Repository:</div> */}
          <div className='d-flex justify-content-between mb-2'>
            <label>Project:</label>
            <input className='rounded bg-white px-1 border-light w-75'
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setFile(e.target.value + '_PR.json'); }}
            />
          </div>
          <div className='d-flex justify-content-between mb-2'>
            <label>Organisation:</label>
            <input className='rounded bg-white px-1 border-light w-75'
              type="text"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
            />
          </div>
          <div className='d-flex justify-content-between mb-2'>
            <label>Repo:</label>
            <input className='rounded bg-white px-1 border-light w-75'
              type="text"
              value={(repo !== '') ? repo : props.props.phFocus?.focusProj.name}
              onChange={(e) => setRepo(e.target.value)}
            />
          </div>
          <div className='d-flex justify-content-between mb-2'>
            <label>Path:</label>
            <input className='rounded bg-white px-1 border-light w-75'
              type="text"
              placeholder="models"
              value={path}
              onChange={(e) => setPath(e.target.value)}
            />
          </div>
          <div className='d-flex justify-content-between mb-2'>
            <label>Branch:</label>
            <input className='rounded bg-white border-light px-1 w-75'
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />
          </div>
          <div className='d-flex justify-content-between mb-2'>
            <label>Filename:</label>
            <input className='rounded bg-light border-light px-1 w-75'
              type="text"
              readOnly
              value={file}
            // onChange={(e) => {setFile(e.target.value)}}
            />
          </div>
          <hr />
          <div className=' mb-2'>
            Project File Source full path:
            <label>github.com/</label>
            <input className='rounded bg-white px-1 border-light w-100'
              type="text"
              value={org+'/'+repo+'/'+path+'/'+file}
              // onChange={(e) => setSource(e.target.value)}
            />
          </div>
          <div className='d-flex justify-content-between mb-2'>
            <label>Project Number (github):</label>
            <input className='rounded bg-white px-1 border-light w-25'
              type="text"
              value={projectNumber}
              onChange={(e) => setProjectNumber(e.target.value)}
            />
          </div>
        </div>
        <button className="button btn bg-success btn-sm  w-100 ms-auto mt-4" type="submit">Save</button>
      </form>
    </>
  );
}

export default ProjectDetailsForm;