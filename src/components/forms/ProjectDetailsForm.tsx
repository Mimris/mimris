import { useEffect, useState } from "react";

function ProjectDetailsForm(props) {

const [org, setOrg] = useState("");
const [repo, setRepo] = useState("");
const [path, setPath] = useState("");
const [file, setFile] = useState("");
const [branch, setBranch] = useState("");

useEffect(() => {
  setOrg(props.phFocus?.focusProj.org)
  setRepo(props.phFocus?.focusProj.repo)
  setPath(props.phFocus?.focusProj.path)
  setFile(props.phFocus?.focusProj.file)
  setBranch(props.phFocus?.focusProj.branch)
}, [])

  const handleSubmit = (event) => {
    event.preventDefault();
    props.onSubmit({ org, repo, path, file, branch });
  };

  console.log("13 ProjectDetailsForm", props);
  console.log("14 ProjectDetailsForm", org, repo, path, file, branch);
  console.log("15 ProjectDetailsForm", props.phFocus?.focusProj.org);
  return (
    <form onSubmit={handleSubmit}>
      <label>
        Organisation:
        <input type="text" value={org} onChange={(e) => setOrg(e.target.value)} />
      </label>
      <label>
        Repo:
        <input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} />
      </label>
      <label>
        Path:
        <input type="text" value={path} onChange={(e) => setPath(e.target.value)} />
      </label>
      <label>
        File:
        <input type="text" value={file} onChange={(e) => setFile(e.target.value)} />
      </label>
      <label>
        Branch:
        <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} />
      </label>
      <button type="submit">Save</button>
    </form>
  );
}

export default ProjectDetailsForm;