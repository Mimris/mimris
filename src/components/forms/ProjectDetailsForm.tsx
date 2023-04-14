import { useState } from "react";

function ProjectDetailsForm(props) {
  const [org, setOrg] = useState(props.phFocus?.focusProj.org || "");
  const [repo, setRepo] = useState(props.phFocus?.focusProj.repo || "");
  const [path, setPath] = useState(props.phFocus?.focusProj.path || "");
  const [file, setFile] = useState(props.phFocus?.focusProj.file || "");
  const [branch, setBranch] = useState(props.phFocus?.focusProj.branch || "main");

  const handleSubmit = (event) => {
    event.preventDefault();
    props.onSubmit({ org, repo, path, file, branch });
  };

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