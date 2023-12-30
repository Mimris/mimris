import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import useLocalStorage  from '../../hooks/use-local-storage'
import useSessionStorage from "../../hooks/use-session-storage";

import { SaveModelToLocState } from "../utils/SaveModelToLocState";
// import { set } from "immer/dist/internal";

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
  const [file, setFile] = useState( props.props.phData.metis.name || props.props.phFocus?.focusProj.file || props.props.phSource+'.json');
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

    
if (debug)console.log("14 ProjectDetailsForm", org, repo, path, file, branch, focusModel, focusModelview, focusObject, focusObjectview, focusOrg, focusProj, focusRole, focusTask, focusIssue);

  useEffect(() => {
    // setOrg(props.phFocus?.focusOrg.org);
    // setRepo(props.phFocus?.focusProj.name);
    // setPath(props.phFocus?.focusProj.path);
    // setFile(props.phFocus?.focusProj.file);
    // setBranch(props.phFocus?.focusProj.branch);
    // setFocusProj(props.props.phData?.metis.name)
  }, []);

  const idnew = (props.props.phFocus?.focusProj.id) ? props.props.phFocus?.focusProj.id : org+repo+path+file+branch;
  const namenew = (props.props.phFocus?.focusProj.name) ? props.props.phFocus?.focusProj.name : repo;

      const updateFocusProj = (value) => {
      setFocusProj(value);
      // update metis object
      //dialog box and ask for description and update metis object
      const dialog = window.confirm("Pls update name and descr of the project?");
      if (dialog) {
        const namenew = window.prompt("Please enter the name of the project", "Name");
        const descriptionnew = window.prompt("Please enter the description of the project", "Description");
        props.props.phData.metis.name = namenew;
        props.props.phData.metis.description = descriptionnew;
      }
    }

  const handleSubmit = (event) => {
    event.preventDefault();
    // props.onSubmit({ org, repo, path, file, branch });
    const data = { id: idnew, name: namenew, org, repo, path, file, branch, projectNumber };

    // Todo: has to set id but show name in the list  ( look at Context button)
    const contextData = { focusModel: focusModel, focusOrg: focusOrg, focusProj: data, focusModelview: focusModelview, focusObject: focusObject, focusObjectview: focusObjectview, focusRole: focusRole, focusTask: focusTask, focusIssue: focusIssue }
    
    dispatch({ type: 'SET_FOCUS_PROJ', data });
    const timer = setTimeout(() => {
      console.log("44 ProjectDetailsForm", props.props.phFocus);
      SaveModelToLocState(props.props, memoryLocState, setMemoryLocState)
    }, 200);
    return () => clearTimeout(timer);
  };

    
  return (
    <>  
      <div>Project:</div>
      <div>id: {idnew}</div>
      <div>name: {namenew}</div>
      <hr />
        <form onSubmit={handleSubmit}>
          <div className='d-flex justify-content-between'>
            <div>
              <div>GitHub Repository:</div>
              <div>
                <label>Project Number (github):</label>
                <input className='rounded bg-white px-1'
                  type="text"
                  value={projectNumber}
                  onChange={(e) => setProjectNumber(e.target.value)}
                /> 
                <div> --- </div>
              </div>
              <div>
                <label>Organisation:</label>
                <input className='rounded bg-white px-1'
                  type="text"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                /> 
              </div>
              <div>
                <label>Repo:</label>
                <input className='rounded bg-white px-1'
                  type="text"
                  value={(repo !== '') ? repo : props.props.phFocus?.focusProj.name}
                  onChange={(e) => setRepo(e.target.value)}
                />
              </div>
              <div>
                <label>Path:</label>
                <input className='rounded bg-white px-1'
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                />
              </div>
              <div>
                <label>File:</label>
                <input className='rounded bg-white'
                  type="text"
                  value={file}
                  onChange={(e) => setFile(e.target.value)}
                />
              </div>
              <div>
                <label>Branch:</label>
                <input className='rounded bg-white px-1'
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                />
              </div>
            </div>
            <div>
              {/* <div>Context Focus:</div>
              <div>
                <div>
                  <label>Model:</label>
                  <input className='rounded bg-white px-1'
                    type="text"
                    value={focusModel?.name}
                    onChange={(e) => setFocusModel(e.target.value)}
                  /> 
                </div>
                <div>
                  <label>Modelview:</label> 
                  <input className='rounded bg-white px-1'
                    type="text"
                    value={focusModelview?.name}
                    onChange={(e) => setFocusModelview(e.target.value)}
                  />
                </div>
                <div>
                  <label>Object:</label>
                  <input className='rounded bg-white px-1'
                    type="text"
                    value={focusObject?.name}
                    onChange={(e) => setFocusObject(e.target.value)}
                  />
                </div>
                <div>
                  <label>Objectview:</label>
                  <input className='rounded bg-white'
                    type="text"
                    value={focusObjectview?.name}
                    onChange={(e) => setFocusObjectview(e.target.value)}
                  />
                </div>
                <div>
                  <label>Org:</label>
                  <input className='rounded bg-white px-1'
                    type="text"
                    value={focusOrg?.name}
                    onChange={(e) => setFocusOrg(e.target.value)}
                  />
                </div>
                <div>
                  <label>Project:</label>
                  <input className='rounded bg-white px-1'
                    type="text"
                    value={focusProj?.name}
                    onChange={(e) => setFocusProj(e.target.value)}
                  />
                </div>
                <div>
                  <label>Role:</label>
                  <input className='rounded bg-white px-1'
                    type="text"
                    value={focusRole?.name}
                    onChange={(e) => setFocusRole(e.target.value)}
                  />
                </div>
                <div>
                  <label>Task:</label>
                  <input className='rounded bg-white px-1'
                    type="text"
                    value={focusTask?.name}
                    onChange={(e) => setFocusTask(e.target.value)}
                  />
                </div>
                <div>
                  <label>Issue:</label>
                  <input className='rounded bg-white px-1'
                    type="text"
                    value={focusIssue?.name}
                    onChange={(e) => setFocusIssue(e.target.value)}
                  />
                </div>
              </div> */}
            </div>
          </div>
          <button type="submit">Save</button>
        </form>
    </>
  );
}

export default ProjectDetailsForm;