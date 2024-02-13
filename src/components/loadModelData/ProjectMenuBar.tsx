import { SaveAllToFile } from '../utils/SaveModelToFile';

export const ProjectMenuBar = (props) => {
    const project = props.props.phData.metis;
    const source = props.props.phSource;

    const handleSaveAllToFile = () => {
        const projectname = props.phData.metis.name
        SaveAllToFile({ phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser }, projectname, '_PR')
        const data = `${projectname}_PR`
        if (debug) console.log('343 handleSaveAllToFile', data)
        dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data })
    }

    console.log('5 ProjectMenuBar', project.name, project, props);
    return (
        <div className="project-menu-bar d-flex align-items-center p-1" style={{ backgroundColor: "#b0cfcf" }}>
            <div className="menu-buttons">
                <button className="btn bg-secondary py-1 pe-2 ps-1 me-1"><i className="fab fa-github fa-lg me-2 ms-0 "></i>GitHub</button>
                <button className="btn bg-light text-dark px-1 py-1 pe-2 ps- me-1"><i className="fa fa-folder text-dark pe-1"></i>Open</button>
                <button className="btn bg-light text-dark px-1 py-1 pe-2 ps- me-1"><i className="far fa-save"></i> Save</button>
            </div>
            <div className="menu-buttons d-flex justify-content-between align-items-center">
                <label htmlFor="project-name-input">Project: </label>
                <input id="project-name-input" className="project-name-input bg-light ps-1 border border-secondary rounded" type="text" placeholder="Project Name" value={project.name} />
                <span className="w-100 ps-2">Source:  {source} </span>
            </div>
            <button className="btn btn-sm menu-button ms-auto me-1">Reload</button>
        </div>
    );
}

{/* 
    const handleSaveAllToFile = () => {
      const projectname = props.phData.metis.name
      SaveAllToFile({ phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser }, projectname, '_PR')
      const data = `${projectname}_PR`
      if (debug) console.log('343 handleSaveAllToFile', data)
      dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data })
    }

<button className="border border-solid border-radius-4 px-2 mx-0 py-0"
    data-toggle="tooltip" data-placement="top" data-bs-html="true"
    title="Click here to Save the Project file &#013;(all models and metamodels) to file &#013;(in Downloads folder)"
    onClick={handleSaveAllToFile}>Save
</button> 
<div className="">
    <div className="input text-primary" style={{ maxHeight: "32px", backgroundColor: "transparent" }} data-bs-toggle="tooltip" data-bs-placement="top" title="Choose a local Project file to load">
    <input className="select-input" type="file" accept=".json" onChange={(e) => ReadModelFromFile(props, dispatch, e)} style={{width: "580px"}}/>
    </div>
</div>
*/}