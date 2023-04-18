import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

function ProjectDetailsForm(props) {
  const dispatch = useDispatch();
  console.log("7 ProjectDetailsForm", props.phFocus?.focusProj);

  const [org, setOrg] = useState(props.phFocus?.focusProj.org);
  const [repo, setRepo] = useState(props.phFocus?.focusProj.repo);
  const [path, setPath] = useState(props.phFocus?.focusProj.path);
  const [file, setFile] = useState(props.phFocus?.focusProj.file);
  const [branch, setBranch] = useState(props.phFocus?.focusProj.branch);



  useEffect(() => {
    // setOrg(props.phFocus?.focusOrg.org);
    // setRepo(props.phFocus?.focusProj.name);
    // setPath(props.phFocus?.focusProj.path);
    // setFile(props.phFocus?.focusProj.file);
    // setBranch(props.phFocus?.focusProj.branch);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    props.onSubmit({ org, repo, path, file, branch });
    const data = { org, repo, path, file, branch };
    dispatch({ type: 'SET_FOCUS_PROJ', data });
  };

  return (
    <>  
     {props.phFocus?.focusProj.name}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Organisation:</label>
          <input className='rounded bg-white'
            type="text"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
          /> 
        </div>
        <div>
          <label>Repo:</label>
          <input className='rounded bg-white'
            type="text"
            value={(repo !== '') ? repo : props.phFocus?.focusProj.name}
            onChange={(e) => setRepo(e.target.value)}
          />
        </div>
        <div>
          <label>Path:</label>
          <input className='rounded bg-white'
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
          <input className='rounded bg-white'
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
        </div>
        {/* <button type="submit">Save</button> */}
      </form>
    </>
  );
}

export default ProjectDetailsForm;