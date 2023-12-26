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

function Tasks(props: { taskFocusModel: any; asPage: any; visible: unknown; props: any; }) {

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

  // useEffect(() => {
  //   if (props.asPage) {
  //   setExpandedTaskPane(true);
  //   }
  //   openOneLevel();
  // } , []);

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
  const curmodel = models?.find((m: { id: any; }) => m?.id === focusModel?.id);
  // const curmodel = (taskFocusModel?.id) ?  models?.find((m: { id: any; }) => m?.id === taskFocusModel?.id) : models?.find((m: { id: any; }) => m?.id === focusModel?.id);
  if  (debug) console.log('95 Tasks', models, focusModel, taskFocusModel, curmodel);
  const curmetamodel = metamodels?.find((m: { id: any; }) => m?.id === curmodel?.metamodelRef);


  // set  submodel
  const subModels = curmetamodel?.subModels;
  if (!subModels) return null;
  // const subModel = subModels[0];
  if (debug) console.log('100 Tasks', models,  curmodel, curmetamodel);
  // const subModelviews = subModel?.modelviews;
  const modelviews = curmodel?.modelviews;
  // const subModelObjects = subModel?.objects;
  // const subModelobjviews = subModel?.objectviews;
  // const subModelrelships = subModel?.relshipviews;

  // if (debug) console.log('107 Tasks', subModel, subModelviews);

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

  const handleClick = (task: { id: any; name: any; }, role: { id: any; name: any; }) => {
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
      // find to.objectviews that has no parent objectview and not of type Label i.e. top containers(groups)
  // Define a type for the item
  type ItemType = {
    id: string;
    name: string;
    description: string;
    typeName: string;
    children: ItemType[];
  };

  const taskItem = (task: ItemType) => 
    <li
      key={task?.id}
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

  const renderItem = (o: ItemType) => {
    if (debug) console.log('273 gcObj', o);
    if (!o) return null;
    const obj = o;
    if (debug) console.log('276 ', obj);
    const oDiv = taskItem(obj)
    if (debug) console.log('286 renderItem', oDiv);
    return oDiv;
  };

  const genTasksDiv = (): JSX.Element | null => { 
    return subModels?.map((sm: any, index: number) => { 
      if (!debug) console.log('274 Tasks', sm);
      const sourceMetamodel = metamodels?.find((mm: { id: any; }) => mm.id === sm.metamodelRef);

      let subTasks = sm.objects;
      if (debug) console.log('278 Tasks', subTasks);

      const tasksDiv = subTasks.map((subtask: ItemType) => {
        return renderItem(subtask);
      });
      
      return (
        <details key={index}>
          <summary className="text-success d-flex align-items-center m-0 bg-light" >
            <span className="ms-0 d-flex justify-content-between" >
              <div key={index} className="" >
                <i className="fa fa-folder mt-1" aria-hidden="true"></i>
                <span className="ms-2 me-2"><span style={{ fontWeight: "bold" }}>{sm.name}</span> ()
                {/* ({sourceMetamodel?.name}) */}
                </span>
              </div>
            </span>
          </summary>
          <div key={index} className="m-0 p-2">
            {tasksDiv}
          </div>
        </details>
      );
    })
  }


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
                {focusRole?.name}
              </span>
            </div>
            <div>
              Task:{" "}
              <span className="font-weight-bold text-success bg-white p-1">
                {focusTask?.name}
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
             <div className="bg-light p-1 "> Generated Tasks from: <span className="bg-transparent px-1 text-success"> {subModels[0]?.name}</span> 
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
          <ReportModule props={props.props} reportType="task" edit={false} />
         {/* modelInFocusId={subModels[0].id} /> */}
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


function type(metamodels: any[], model: { metamodelRef: any; }, subModelobjects: any[], curov: { objectRef: any; }) {
  const retval = metamodels?.find((mm: { id: any; }) => mm.id === model?.metamodelRef)
    ?.objecttypes?.find((ot: { id: any; }) => ot.id === subModelobjects?.find((o: { id: any; }) => o.id === curov?.objectRef)?.typeRef)?.name;
  if (debug) console.log('377 Tasks ', retval);
  return retval;
}

export default Tasks;
