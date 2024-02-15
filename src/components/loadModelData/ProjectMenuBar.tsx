import { useDispatch } from 'react-redux';
import { ReadModelFromFile } from '../utils/ReadModelFromFile';
import { SaveAllToFile } from '../utils/SaveModelToFile';

export const ProjectMenuBar = (props: any) => {

    const debug = false;
    const dispatch = useDispatch();
    const project = props.props.phData.metis;
    const source = props.props.phSource;

    const handleSaveAllToFile = () => {
        const projectname = props.phData?.metis.name
        SaveAllToFile({ phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser }, projectname, '_PR')
        const data = `${projectname}_PR`
        if (debug) console.log('343 handleSaveAllToFile', data)
        dispatch({ type: 'LOAD_TO_STORE_PHSOURCE', data: data })
    }

    const handleCloseModal = () => {
        const openFileModal = document.getElementById('openFileModal');
        if (openFileModal) {
            openFileModal.classList.remove('show');
            openFileModal.style.display = 'none';
        }
    }

    console.log('5 ProjectMenuBar', project.name, project, props);

    function handleOpenFile() {
        const openFileModal = document.getElementById('openFileModal');
        if (openFileModal) {
            openFileModal.classList.add('show');
            openFileModal.style.display = 'block';
        }

    }

    return (
        <>
            <div className="project-menu-bar d-flex align-items-center p-1" style={{ backgroundColor: "#b0cfcf" }}>
                <div className="menu-buttons">
                    <button className="btn bg-secondary py-1 pe-2 ps-1 me-1"><i className="fab fa-github fa-lg me-2 ms-0 "></i>GitHub</button>
                    <button className="btn bg-light text-dark px-1 py-1 pe-2 ps- me-1"
                        data-toggle="tooltip" data-placement="top" data-bs-html="true"
                        title="Click here to Open a Project file from local file system"
                        onClick={() => handleOpenFile()}
                    ><i className="fa fa-folder text-dark pe-1"></i>Open</button>
                    <button className="btn bg-light text-dark px-1 py-1 pe-2 ps- me-1" onClick={handleSaveAllToFile}><i className="far fa-save"></i> Save</button>
                </div>
                <div className="menu-buttons d-flex justify-content-between align-items-center">
                    <label htmlFor="project-name-input">Project: </label>
                    <input id="project-name-input" className="project-name-input bg-light ps-1 border border-secondary rounded" type="text" placeholder="Project Name" value={project.name} />
                    <span className="w-100 ps-2">Source:  {source} </span>
                </div>
                {/* <button className="btn btn-sm menu-button ms-auto me-1">Reload</button> */}
            </div>
            {/* modal for open file */}
            <div className="modal fade" id="openFileModal" aria-labelledby="openFileModalLabel" aria-hidden="true">
                {/* <div className="modal fade" id="openFileModal" tabIndex="-1" aria-labelledby="openFileModalLabel" aria-hidden="true"> */}
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="openFileModalLabel">Open Project File</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className="input text-primary" style={{ maxHeight: "32px", backgroundColor: "transparent" }} data-bs-toggle="tooltip" data-bs-placement="top" title="Choose a local Project file to load">
                                <input className="select-input" type="file" accept=".json" onChange={(e) => ReadModelFromFile(props.props, dispatch, e)} style={{ width: "580px" }} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal"
                                onClick={handleCloseModal}
                            >Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}