import { useState } from 'react'
import Link from 'next/link';
import { useSelector } from 'react-redux';
import SelectContext from '../components/utils/SelectContext'
import { createSnapshotShare } from '../components/utils/focusShare';
import { selectSharedUniverseState } from '../sharedUniverse';

const debug = false

const ContextView = (props: any) => {
  const sharedUniverse = useSelector(selectSharedUniverseState);
  const [minimized, setMinimized] = useState(true);
  const toggleMinimized = () => setMinimized(!minimized);
  const [modal, setModal] = useState(false);

  const legacyPh = props.ph?.phData || props.ph?.phFocus || props.ph?.phUser || props.ph?.phSource
    ? props.ph
    : {};
  const phData = {
    domain: sharedUniverse.world.worldDefinition.domain ?? legacyPh.phData?.domain,
    metis: sharedUniverse.world.worldModel.metis ?? legacyPh.phData?.metis,
    documents: sharedUniverse.compatibility.documents ?? legacyPh.phData?.documents,
  };
  const phFocus = sharedUniverse.world.focus || legacyPh.phFocus || props.phF || props.ph;
  const phUser = sharedUniverse.user || legacyPh.phUser;
  const phSource = sharedUniverse.source || legacyPh.phSource || '';
  const repo = (phFocus?.focusProj?.repo) && phFocus.focusProj?.repo;
  const org = (phFocus?.focusProj?.org) && phFocus.focusProj?.org;

  if (!phFocus) return null;

  const handleShowModal = () => {
    // if (minimized) {
    //   setMinimized(true);
    // }
    props.setShowModal(true);
  };

  const handleShowIssueModal = () => {
    if (props.focusIssue === null) {
      props.setFocusIssue({ id: 0, name: 'REFRESH ISSUES', description: '', status: '', labels: [], assignees: [] })
    }
    props.setShowIssueModal(true);
  };

  const copyToClipboard = async () => {
    const snapshot = {
      phData,
      phFocus,
      phUser: phUser || {},
      phSource,
    };
    const focusUrl = await createSnapshotShare(snapshot, window.location.origin);
    if (debug) console.log('42 focus', focusUrl);
    await navigator.clipboard.writeText(focusUrl);
  }

  const statusField = (name: string, field: any) => {
    return (
      <span className="context-item border rounded-2 mx-1">
        <span className="px-1 ">
          {name}:
        </span>
        <span className="px-1 text-success" style={{ backgroundColor: "#fff", whiteSpace: "nowrap" }}>
          {field}
        </span>
      </span>
    );
  }
  const statusFieldLink = (name: string, field: any, link: string) => {
    return (
      <span className="context-item  m-0 p-1">
        <span className="px-2">
          {name}:
        </span>
        <span
          className="px-2 "
        >
          <Link
            className="text-primary"
            href={link}
            target="_blank"
          >
            <span style={{ maxWidth: "300px", backgroundColor: "#fff" }}>{field}</span>
          </Link>
        </span>
      </span>
    );
  }

  const contextRepoDiv =
    <div className="context-list">
      <div className="d-flex flex-wrap justify-content-between align-items-center">
        <div>{statusField('Model', phFocus?.focusModel?.name)}</div>
        <div>{statusField('Modelview', phFocus?.focusModelview?.name)}</div>
        <div>{statusField('Object', phFocus?.focusObject?.name)}</div>
        <div>{statusField('Objectview', phFocus?.focusObjectview?.name)}</div>
      </div>
      {/* <div className="font-weight-bold  border fs-6">
          <button
            className="btn text-success m-0 px-2 py-0 btn-sm float-end"
            data-toggle="tooltip"
            data-placement="top"
            data-bs-html="true"
            title="Open Modal with the FocusIssue!"
            onClick={handleShowModal}
            style={{ backgroundColor: "#fff" }}
          >
            <i className="fa fa- fa-bullseye"></i> 
          </button>
        </div> */}
    </div>


  const toggle = () => setModal(!modal);

  return (
    <>
      {/* <div className="pt-1" style={{backgroundColor: "#b0cfcf"}}></div> */}
      <SelectContext className='ContextModal' phData={phData} phFocus={phFocus} modal={modal} toggle={toggle} />
      <div className="d-flex justify-content-between align-items-center m-0 p-0 " style={{ backgroundColor: "#ffffed" }}>
        <div className="d-flex border rounded me-1 pe-1" style={{ backgroundColor: "#fffff3" }}>
          {statusFieldLink('Issue', (phFocus?.focusIssue) && '#' + phFocus?.focusIssue?.id + ' ' + phFocus?.focusIssue?.name, `http://github.com/${org}/${repo}/issues/${phFocus?.focusIssue?.id}`)}
          {/* <button
                className="btn btn-sm text-success m-0 px-0 py-0  float-end"
                data-toggle="tooltip"
                data-placement="top"
                data-bs-html="true"
                title="Open a Modal with the FocusIssue!"
                onClick={() =>handleShowIssueModal}
                // onClick={() =>{props.setShowIssueModal(true)}}
                style={{ backgroundColor: "#fff" }}
              >
              <i className="fa fa- fa-plus"></i> 
            </button> */}
        </div>
        <div className="bg-secondary ms-5">|</div>
        {/* <button className="btn btn-sm bg-transparent py-0 ms-1 text-primary " onClick={toggleMinimized}>
          {(minimized) 
            ? <span className="" style={{whiteSpace: 'nowrap',}}>Focus : <i className="fas fa-caret-right fa-lg me-2"></i></span>
            : <span className="" style={{whiteSpace: 'nowrap',}}>Focus : <i className="fas fa-caret-up   fa-lg me-2"></i></span>
          }
        </button>  */}
        {/* <button className="btn btn-sm bg-transparent text-primary px-2 mt-1 pt-0 mx-0"  style={{height: "24px"}} onClick={toggle}>
          <i className="fas fa-edit fa-lg"
          data-toggle="tooltip" data-placement="top" data-bs-html="true" 
          title="Copy current focus/context to clipboard as a link that can be sent to others by e-mail etc."     
          ></i>   
        </button> */}
        <button className="btn btn-sm bg-transparent text-primary py-0 mx-1" onClick={copyToClipboard}>
          <i className="fas fa-copy fa-lg"
            data-toggle="tooltip" data-placement="top" data-bs-html="true"
            title="Copy current focus/context to clipboard. The link can be used in documents,sent to others by e-mail etc."
          ></i>
        </button>
        <span className="" style={{ whiteSpace: 'nowrap' }}>Focus : </span>
        <div className="m-0 p-0">{contextRepoDiv}</div>
        {/* <div className="ms-auto me-1">{statusField('TargetModel', (props.ph?.phFocus?.focusTargetModel) && props.ph?.phFocus?.focusTargetModel)}</div> */}
        <div className="bg-secondary">|</div>
        <div className=" d-flex flex-wrap  ms-0 p-1" style={{ backgroundColor: "#ffffed" }}>
          {statusField('Role', phFocus?.focusRole?.name)}
          {statusField('Task', phFocus?.focusTask?.name)}
        </div>

      </div>
    </>
  )
}

export default ContextView
