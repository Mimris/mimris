import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

  import useLocalStorage  from '../../hooks/use-local-storage'
  import { SaveModelToLocState } from "../utils/SaveModelToLocState";

function ProjectDetailsForm(props) {
  const dispatch = useDispatch();
  console.log("7 ProjectDetailsForm", props.props.phFocus);

  const [projectNumber, setProjectNumber] = useState(props.props.phFocus?.focusProj.projectNumber);
  const [id, setId] = useState(props.props.phFocus?.focusProj.id);
  const [name, setName] = useState(props.props.phFocus?.focusProj.name); 
  const [org, setOrg] = useState(props.props.phFocus?.focusProj.org || props.props.phFocus.focusOrg.name);
  const [repo, setRepo] = useState(props.props.phFocus?.focusProj.repo);
  const [path, setPath] = useState(props.props.phFocus?.focusProj.path);
  const [file, setFile] = useState(props.props.phFocus?.focusProj.file);
  const [branch, setBranch] = useState(props.props.phFocus?.focusProj.branch);


  const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', null); //props);

    


console.log("14 ProjectDetailsForm", org, repo, path, file, branch);

  useEffect(() => {
    // setOrg(props.phFocus?.focusOrg.org);
    // setRepo(props.phFocus?.focusProj.name);
    // setPath(props.phFocus?.focusProj.path);
    // setFile(props.phFocus?.focusProj.file);
    // setBranch(props.phFocus?.focusProj.branch);
  }, []);

  const idnew = (props.props.phFocus?.focusProj.id) ? props.props.phFocus?.focusProj.id : org+repo+path+file+branch;
  const namenew = (props.props.phFocus?.focusProj.name) ? props.props.phFocus?.focusProj.name : repo;

  const handleSubmit = (event) => {
    event.preventDefault();
    // props.onSubmit({ org, repo, path, file, branch });
    const data = { id: idnew, name: namenew, org, repo, path, file, branch, projectNumber };
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
      <div>GitHub Repository:</div>
        <form onSubmit={handleSubmit}>
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
          <button type="submit">Save</button>
        </form>
    </>
  );
}

export default ProjectDetailsForm;