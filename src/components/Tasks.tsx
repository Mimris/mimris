// @ts-nocheck
import { useEffect, useState, useRef, use} from 'react';
import { useSelector, useDispatch} from 'react-redux';

import Selector from './utils/Selector';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from "rehype-raw";
import { wrapper } from '../store'; // import RootState type

import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import taskIcon from "/public/images/task.png";
import ReportModule from "./ReportModule";

// import {ObjDetailTable} from './forms/ObjDetailTable';
// import { set } from 'immer/dist/internal';
// import { addLinkToDataArray } from '../akmm/ui_common';
// import { group } from 'console';

const debug = false;

interface ObjView {
  id: number;
  group: number;
}

function Tasks(props) {

  // console.log('20 Tasks', require('/public/images/Task.png'));
  if (debug) console.log('18 Tasks props', props);
  const dispatch = useDispatch();


  const [taskFocusModel, setTaskFocusModel] = useState(props.taskFocusModel);



  const state = useSelector((state) => state); // use RootState type
  if (debug) console.log('24 Tasks state', state);
  const [selectedTask, setSelectedTask] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [showButton, setShowButton] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedTaskPane, setExpandedTaskPane] = useState(false);

  useEffect(() => {
    if (props.asPage) {
    setExpandedTaskPane(true);
    }
    openOneLevel();
  } , []);

  useEffect(() => {
    setMinimized(true);
  }, [props.visible]);

  const handleMouseEnter = () => {
    setShowButton(true);
  };

  const handleMouseLeave = () => {
    setShowButton(false);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const containerRef = useRef(null);
  const modalRef = useRef(null);

  const handleShowModal = () => {
    if (minimized) {
      setMinimized(true);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const [formValues, setFormValues] = useState({});

  const metamodels = useSelector(state => state.phData?.metis?.metamodels);
  const models = useSelector(state => state.phData?.metis?.models);
  let focusModel = useSelector(state => state.phFocus?.focusModel);
  const focusModelview = useSelector(state => state.phFocus.focusModelview);
  const focusTask = useSelector(state => state.phFocus.focusTask);
  const focusRole = useSelector(state => state.phFocus.focusRole);
  const curmodel = (taskFocusModel?.id) ?  models?.find(m => m?.id === taskFocusModel?.id) : models?.find(m => m?.id === focusModel?.id);
  if  (debug) console.log('91 Tasks', models, focusModel, taskFocusModel, curmodel);
  const curmetamodel = metamodels?.find(m => m?.id === curmodel?.metamodelRef);
  // const mothermodel = models?.find(m => m?.name.endsWith('_TD'));
  // set  metamodel
  const mothermodel = (curmetamodel?.subModels) && curmetamodel?.subModels[0];
  if (debug) console.log('91 Tasks', models,  curmodel, curmetamodel, mothermodel);
  const mothermodelviews = mothermodel?.modelviews;
  const modelviews = curmodel?.modelviews;
  const motherobjects = mothermodel?.objects;
  const motherobjviews = mothermodel?.objectviews;
  const motherrelships = mothermodel?.relshipviews;

  if (debug) console.log('93 Tasks', mothermodel, mothermodelviews);

  let parentTask: any = null;
  // useEffect(() => {
  //    setPrevParentTask(parentTask);
  // }, [parentTask]);

  const handleExpandedTaskPane = () => {
    setExpandedTaskPane(!expandedTaskPane);
    // setMaximized(false);
  };
  const handleMinimize = () => {
    setMinimized(true);
    setMaximized(false);
  };

  const handleMaximize = () => {
    setMinimized(false);
    setMaximized(true);
  };

  const handleNewWindow = () => {
    const curmodId = String(curmodel?.id);
    const parameter = '/tasks?taskFocusModel=' + curmodId;
    if (debug) console.log('116 handleNewWindow', curmodId, parameter);
    window.open(parameter, '_blank', 'width=644,height=800');
    setMinimized(true);
  }

  const closeAllDetails = () => {
    const detailsElements = document.querySelectorAll("details");
    detailsElements.forEach((detailsElement) => {
      const summaryElement = detailsElement.querySelector("summary");
      if (summaryElement) {
        detailsElement.removeAttribute("open");
      }
    });
    setCollapsed(!collapsed);
  };

  const openAllDetails = () => {
    const detailsElements = document.querySelectorAll("details");
    detailsElements.forEach((detailsElement) => {
      const summaryElement = detailsElement.querySelector("summary");
      if (summaryElement) {
        detailsElement.setAttribute("open", "");
      }
    });
    setCollapsed(!collapsed);
  };

  const openOneLevel = () => {
    const detailsElements = document.querySelectorAll("details");
    detailsElements.forEach((detailsElement, index) => {
      const summaryElement = detailsElement.querySelector("summary");
      if (summaryElement) {
        if (index === 1) {
          detailsElement.setAttribute("open", "");
        } else {
          detailsElement.removeAttribute("open");
        }
      }
    });
  };

  const handleClick = (task, role) => {
    if (task) {
      dispatch({
        type: "SET_FOCUS_TASK",
        data: { id: task.id, name: task.name },
      });
    } else if (role) {
      dispatch({
        type: "SET_FOCUS_ROLE",
        data: { id: role.id, name: role.name },
      });
    }
  };

  if (minimized) {
    return (
      <div className="minimized-task">
        <div
          className="buttons position-absolute p-0 m-0 me-1 end-0"
          style={{ transform: "scale(0.7)", marginTop: "-25px", marginLeft: "-2px"}}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          >
           <button
            className="btn text-success m-0 px-1 py-0 btn-sm fs-5"
            onClick={handleMaximize}
            style={{ backgroundColor: "lightyellow" }}
          >
            <i className="fas fa-tasks me-1" aria-hidden="true"></i>
            Tasks
          </button>
        </div>
      </div>
    );
  }

  let taskEntries: string = '';
  let uniqueovs: any[] = [];
  let curParentObj: any = null;
      // find mv.objectviews that has no parent objectview and not of type Label i.e. top containers(groups)

  const taskItem = (task, role, index) => 
    <li
      key={task?.id+index}
      className="p-0 me-0"
      onClick={() => setSelectedTask(task)}
      style={{backgroundColor: "lightyellow" }}
    >
      <hr className="py-1 bg-success" />
      <details className="m-y p-0 pe-1">
        <summary
          className="text-success d-flex align-items-top p-0 m-0"

        >
          <i className="fa fa-tasks mt-1 ms-2" aria-hidden="true"></i>
          <span className="ms-2">{task?.name}</span>
          <span className="d-flex my-0 ms-auto me-0 align-items-center justify-items-center">
            <button 
              className="btn bg-light text-success mx-0 p-1 pt-0 fs-5"
              onClick={handleClick}
              style={{
                border: "1px solid #ccc",
                borderRadius: "5px",
                backgroundColor: "#fff",
                transform: "scale(0.7)",
              }}
            >
              {/* <i className="fa fa-lg fa-check"></i>   */}
            </button>
          </span>
        </summary>
        <div className="selected-task bg-transparent ps-0">
          <div className="m-0 p-2">
            <ReactMarkdown rehypePlugins={[rehypeRaw]} >{task?.description}</ReactMarkdown>
            <hr />
          </div>
        </div>
      </details>
    </li>

  const containerItem = (container) =>
    <div >
      <details>
        {/* <summary className="text-success d-flex align-items-center m-0 bg-light" > */}
        <summary
          className="text-success d-flex align-items-center m-0 bg-light"

        >
          <i className="fa fa-folder mt- ms-2" aria-hidden="true"></i>
          <span className="ms-2" >{container.name} </span>
        </summary>
        <div className="m-0 p-2 bg-ligt">
          <ReactMarkdown rehypePlugins={[rehypeRaw]} >{container?.description}</ReactMarkdown>
          <hr />
        </div>
      </details>
    </div>

  const renderItem = (ov: any, oType: string) => {
    if (debug) console.log('352 gcObjv', ov, oType);
    if (!ov) return null;
    if (!oType) return null;
    const obj = motherobjects.find((o) => o.id === ov?.objectRef);
    const role = '' // Todo: find role obj referenced to this objectview
    if (debug) console.log('281 ', obj, oType, role);

    return (oType === 'Task')
      ? taskItem(obj, role, ov?.id)
      : (oType === 'Container')
        ? containerItem(obj)
        : null;
  };

  //  Render top containers of this modelview and all their children recursively -------------------------------
  const renderTree = (item) => {
    if (debug) console.log('325 renderItems', item);
    if (!item) return null;
    const itemDiv = renderItem(item, item.typeName);
    const children = item.children;
    if (debug) console.log('306 renderItem',item,  children);

    if (children?.length === 0) return renderItem(item, item.typeName)
        
    const childItems = children?.map((child, index) => {
      if (debug) console.log('308 renderItems', child);
      return (item.typeName === 'Task')
      ? <div key={index} className="ps-2">{renderTree(child)}</div> 
      : <div key={index} className="ps-1">{renderTree(child)}</div> 
    });

    return (
      <>
        {itemDiv}
        {childItems}
      </>
    );
  };

  const genTasksDiv = () => {
    let parent, topGroupOvsDiv;
    if (!mothermodelviews) return null;
    console.log('371 Tasks', mothermodelviews, mothermodel.objects);
    const modview = 
      mothermodelviews?.map((mv: any, index: number) => { // map over all modelviews of this model
        if (debug) console.log('371 Tasks', mv);
        parent = mv;
        // nolabel objectviews that has no parent objectview i.e. top containers(groups)
        const noLabelovs = mv?.objectviews?.filter((ov: any) =>
          (!motherobjects?.filter((o: any) => o.typeName === 'Label').find((o: any) => o.id === ov?.objectRef) && ov)
        );
        let topObjviews = noLabelovs?.filter((ov: any) =>
          (!mv.objectviews?.find((ov2: any) => ov2?.id === ov?.group) && ov)
        );
        if (debug) console.log('305 buildTree', parent, mv, mv.objectviews, noLabelovs, topObjviews);
        if (!topObjviews) topObjviews = mothermodel.objects ;  
        //  build a tree of the objectviews in this modelview  
        const buildTree = (parent: any, children: any) => {  // build a tree of the objectviews in this modelview (children is the children of the parent)
          if (debug) console.log('308 buildTree', parent.name, children);
          const ovs = children;

          const parentobj = (parent === mv) ? {id: mv.id, name: mv.name, description: mv.description} : motherobjects?.find((o: any) => o.id === parent.objectRef); // find the object of this parent objectview
          if (debug) console.log('314 buildTree', mv.name, parent, children, parentobj);

          // children are the objectviews that has this parent objectview as group
          const children2 = children.map((ov: any) =>  {
            const grandchildren = mv.objectviews?.filter((ov2: any) => ov2.group === ov.id);
            const simplifiedChild = {
              id: ov.id, 
              name: ov.name, 
              description: motherobjects?.find((o: any) => o.id === ov.objectRef)?.description, 
              typeName: motherobjects?.find((o: any) => o.id === ov.objectRef)?.typeName,
              objectRef: ov.objectRef,
              children: grandchildren
            };
            if (debug) console.log('321 buildTree', ov, grandchildren, simplifiedChild);
          return  buildTree(simplifiedChild, grandchildren); // recursively build the tree for all children with children
          }) ; //
          if (debug) console.log('332 buildTree', children2);

          const parent1 = { id: parent.id, name: parent.name, description: parentobj?.description, typeName: parentobj?.typeName,  objectRef: parent.objectRef, children: children2 };  // convert parent object with id, name, description, typeName, objectRef (from object) and children
          if (debug) console.log('337 buildTree', parentobj, parent1,  children2);
          if (debug) console.log('342 buildTree', parent1);
          return parent1;
        };    
        const ovsTree = buildTree(parent, topObjviews);
        if (debug) console.log('355 buildTree', ovsTree, parent, topObjviews);
        topGroupOvsDiv = 
          <details key={index}>
            <summary className="text-success d-flex align-items-center m-0 bg-light" >
              <span className="ms-0 d-flex justify-content-between" >
                <div key={index} className="" >
                  <i className="fa fa-folder mt-1" aria-hidden="true"></i>
                  <span className="ms-2 me-2"><span style={{ fontWeight: "bold" }}>{mv.description}</span>  ({mv.name})</span>
                </div>
                {/* <div className="ms-4" style={{ whiteSpace: "nowrap" }}>{mv.description} </div> */}
              </span>
            </summary>
            <div key={index} className="m-0 p-2">
              {renderTree(ovsTree)}
            </div>
          </details>;
        return (
          <div  key={index}>
            <hr className="my-0"/>
              {/* Render the top containers of this modelview */}
              <div  key={index} className=" m-1" style={{ backgroundColor: "lightyellow"}}> 
                {topGroupOvsDiv}
              </div>
          </div>
        );
      })
    return (
      <div  >
        <hr className="my-0"/>
          {/* Render the top containers of this modelview */}
          <div  className=" m-1" style={{ backgroundColor: "lightyellow"}}> 
            {topGroupOvsDiv}
          </div>
      </div>
    );
  };

  const genTasksHeaderDiv  =  
    <>
        <div className="tasklist p-1 "
          style={{ backgroundColor: "lightyellow"}} 
          ref={containerRef}
          >
          <div className="header d-flex justify-content-between align-items-center border-bottom border-success mb-2"
            style={{ backgroundColor: "lightyellow", position: "relative",  height: "100%", top: "44%", right: "0%", transform: "translate(-1%, -5%)", overflow: "hidden", zIndex: 9999 }}
            >
              <div className="ps-2 text-success font-weight-bold fs-5 " >Modelling Tasks</div>
              <div className="buttons me-1 float-start" style={{ transform: "scale(0.9)"}}>
                {/* <button 
                  className="btn text-success mt-0 pe-2 py-0 btn-sm"
                  data-toggle="tooltip" data-placement="top" data-bs-html="true"
                  title="Open Modal with current task!"
                  onClick={handleShowModal} 
                  style={{ backgroundColor: "lightyellow"}} >
                  <i className="fas fa-lg fa-share-square"></i>  
                </button> 
                <button 
                  className="btn text-success mt-0 pe-2 py-0 btn-sm"
                  data-toggle="tooltip" data-placement="top" data-bs-html="true"
                  title="Open Modal with current task!"
                  onClick={handleNewWindow} 
                  style={{ backgroundColor: "lightyellow"}} >
                  <i className="fa fa-lg fa-external-link-alt"></i>
                </button>  */}
                {/* <button 
                  className="btn text-success me-0 px-1 py-0 btn-sm" 
                  data-toggle="tooltip" data-placement="top" data-bs-html="true"
                  title="Close Task pane!"
                  onClick={handleExpandedTaskPane}
                  style={{ backgroundColor: "lightyellow"}}
                  >
                    {(!expandedTaskPane) ? <i className="fa fa-lg fa-arrow-left"></i> : <i className="fa fa-lg fa-arrow-right"></i>}
                </button> */}
                <button 
                  className="btn text-success me-0 px-1 py-0 btn-sm bg-light" 
                  data-toggle="tooltip" data-placement="top" data-bs-html="true"
                  title="Close Task pane!"
                  onClick={handleMinimize} 
                  // style={{ backgroundColor: "lightyellow"}}
                  >
                    <i className="fa fa-lg fa-arrow-right bg-"></i>
                </button>
              </div>
          </div>
          <div className="flex-d">
            <div>
              Role:{" "}
              <span className="font-weight-bold text-success bg-white p-1">
                {focusRole.name}
              </span>
            </div>
            <div>
              Task:{" "}
              <span className="font-weight-bold text-success bg-white p-1">
                {focusTask.name}
              </span>
            </div>
            <div className="mb-3">
              {(!collapsed) // collapsed task container
                ? 
                  <button 
                    className="btn text-success mt-0 pe-2 py-0 btn-sm float-end"
                    data-toggle="tooltip" data-placement="top" data-bs-html="true"
                    title="Close all!"
                    onClick={closeAllDetails}
                    style={{ backgroundColor: "transparent"}}
                  >
                    <i className="fa fa-lg fa-folder-open"></i>
                  </button>
                :
                  <button 
                    className="btn text-success mt-0 pe-2 py-0 btn-sm float-end"
                    data-toggle="tooltip" data-placement="top" data-bs-html="true"
                    title="Open all!"
                    onClick={openAllDetails}
                    style={{ backgroundColor: "transparent"}}
                  >
                    <i className="fa fa-lg fa-folder-closed"></i>
                  </button>
              }
            </div>
            <hr className="m-0 p-2" />          
          </div>
          <div className="tasks" style={{maxHeight: "80vh" ,overflow: "scroll"}}>
             <div className="bg-light p-1 "> Generated Tasks from: <span className="bg-transparent px-1 text-success"> {mothermodel?.name}</span> 
              {genTasksDiv()}
            </div>
          </div>
        </div>
    </> 
  ;
    
  return (
    <>
      <div className="tasklist p-1 " style={{ width: (expandedTaskPane ? "40vh" : "40vh")  }}>
        {genTasksHeaderDiv}
      </div>
      <Modal className="ps-auto" show={showModal} onHide={handleCloseModal}  style={{ marginLeft: "10%", marginTop: "200px", backgroundColor: "lightyellow" }} >
        <Modal.Header className="mx-2 bg-transparent" closeButton>
          <Modal.Title>Focus task </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-transparent">
          <ReportModule props={props.props} reportType="task" edit={false} modelInFocusId={mothermodel?.id} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>   
      <style jsx>{`
          .tasklist {
            width: 100%;
            height: 100%;
            // overflow: auto;
            padding: 0;
            margin: 0;
          }
          .selected-task {
            font-size: 10px;
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            padding: 10px;
            margin-top: 10px;
            min-width: 400px;
          }
          .li {
            list-style-type: none;
            padding: 5px;
            margin: 0;
          }
          .li:hover {
            background-color: #ddd;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #f0f0f0;
            padding: 5px;
          }
        .selected-task {
          font-size: 10px;
          background-color: #f0f0f0;
          border: 1px solid #ccc;
          padding: 10px;
          margin-top: 10px;
          min-width: 400px;
        }
        .li {
          list-style-type: none;
          padding: 5px;
          margin: 0;
        }
        .li:hover {
          background-color: #ddd;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #f0f0f0;
          padding: 5px;
          min-width: 400px;
        }
        .mr-auto {
          margin-right: auto;
        }
        .buttons {
          display: flex;
          gap: 5px;
          align-self: flex-end;
          margin-left: auto;
        }
        .minimized-task {
          position: fixed;
          bottom: 0;
          right: 0;
          background-color: #f0f0f0;
          border: 1px solid #ccc;
          padding: 5px;
          cursor: pointer;
        }
        .maximized-task {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: #fff;
          border: 1px solid #ccc;
          padding: 10px;
        }
        li button.checkbox {
          display: inline-block;
          width: 20px;
          height: 20px;
          margin-left: auto;
          background-color: #fff;
          border: 1px solid #ccc;
          border-radius: 3px;
        }
        
        li button.checkbox::before {
          content: "";
          display: block;
          width: 10px;
          height: 10px;
          margin: 4px auto;
          border-radius: 2px;
          background-color: #ccc;
        }
        
        li button.checkbox:checked::before {
          background-color: #007bff;
        }
      `}
      </style>
    </>
  );
}


function type(metamodels, model, motherobjects, curov) {
  const retval = metamodels?.find(mm => mm.id === model?.metamodelRef)
    ?.objecttypes?.find(ot => ot.id === motherobjects?.find(o => o.id === curov?.objectRef)?.typeRef)?.name;
  if (debug) console.log('377 Tasks ', retval);
  return retval;
}

export default Tasks;
