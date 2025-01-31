// @ts-nocheck
import { useEffect, useState, useRef, use } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import Selector from './utils/Selector';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from "rehype-raw";
import { wrapper } from '../store'; // import RootState type

import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import taskIcon from "/public/images/task.png";
import ReportModule from "./export/ReportModule";

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
  const [minimizedTask, setMinimizedTask] = useState(true);
  const [maximizedTask, setMaximizedTask] = useState(false);

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
    if (debug) useEfflog('59 Tasks useEffect 1 [props.visible]');
    setMinimizedTask(true);
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
    if (minimizedTask) {
      setMinimizedTask(true);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => { setShowModal(false); setMinimizedTask(false); };

  const [formValues, setFormValues] = useState({});

  const metamodels = useSelector(state => state.phData?.metis?.metamodels);
  const models = useSelector(state => state.phData?.metis?.models);
  let focusModel = useSelector(state => state.phFocus?.focusModel);
  const focusModelview = useSelector(state => state.phFocus.focusModelview);
  const focusTask = useSelector(state => state.phFocus.focusTask);
  const focusRole = useSelector(state => state.phFocus.focusRole);
  const curmodel = models?.find((m: { id: any; }) => m?.id === focusModel?.id);
  // const curmodel = (taskFocusModel?.id) ?  models?.find((m: { id: any; }) => m?.id === taskFocusModel?.id) : models?.find((m: { id: any; }) => m?.id === focusModel?.id);
  if (debug) console.log('95 Tasks', models, focusModel, taskFocusModel, curmodel);
  const curmetamodel = metamodels?.find((m: { id: any; }) => m?.id === curmodel?.metamodelRef);


  // set  submodel
  const subModels = curmetamodel?.subModels;
  if (!subModels) return null;
  // const subModel = subModels[0];
  if (debug) console.log('100 Tasks', models, curmodel, curmetamodel, subModels);
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
    // setMaximizedTask(false);
  };

  const handleMinimize = () => {
    setMinimizedTask(true);
    setMaximizedTask(false);
  };

  const handleMaximize = () => {
    setMinimizedTask(false);
    setMaximizedTask(true);
  };

  const handleNewWindow = () => {
    const curmodId = String(curmodel?.id);
    const parameter = '/tasks?taskFocusModel=' + curmodId;
    if (debug) console.log('116 handleNewWindow', curmodId, parameter);
    window.open(parameter, '_blank', 'width=644,height=800');
    setMinimizedTask(true);
  }

  const closeAllDetails = () => {
    const detailsElements = document.querySelectorAll("details");
    detailsElements.forEach((detailsElement) => {
      const summaryElement = detailsElement.querySelector("summary");
      if (summaryElement && summaryElement.getAttribute("id") === "task") {
        detailsElement.removeAttribute("open");
      }
    });
    setCollapsed(!collapsed);
  };

  const openAllDetails = () => {
    const detailsElements = document.querySelectorAll("details");
    detailsElements.forEach((detailsElement) => {
      const summaryElement = detailsElement.querySelector("summary");
      if (summaryElement && summaryElement.getAttribute("id") === "task") {
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
        if (index === 1 && !detailsElement.hasAttribute("open")) {
          detailsElement.setAttribute("open", "");
        } else {
          detailsElement.removeAttribute("open");
        }
      }
    });
  };

  const handleClick = (task: { id: any; name: any; }, role: { id: any; name: any; }) => {
    if (debug) console.log('178 handleClick', task, role);
    if (task) {
      dispatch({
        type: "SET_FOCUS_TASK",
        data: { id: task.id, name: task.name },
      });
    }
    if (role) {
      dispatch({
        type: "SET_FOCUS_ROLE",
        data: { id: role.id, name: role.name },
      });
    }
  };

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

  const taskItem = (task: ItemType, role: ItemType) =>
    <li
      key={task?.id}
      className="p-0 me-0"
      onClick={() => setSelectedTask(task)}
      style={{ backgroundColor: "lightyellow" }}
    >
      <hr className="py-1 bg-success" />
      <details className="m-y p-0 pe-1">
        <summary id='task'
          className="text-success d-flex align-items-top p-0 m-0"
        >
          <i className="fa fa-tasks mt-1 ms-2" aria-hidden="true"></i>
          <span className="ms-2">{task?.name}</span>
          <span className="d-flex my-0 ms-auto me-0 align-items-center justify-items-center"
            style={{ minWidth: "100px", whiteSpace: "nowrap" }}
          >
            <button
              className="btn bg-light text-success mx-0 p-1 pt-0 fs-5 ms-auto"
              data-toggle="tooltip"
              data-placement="top"
              data-bs-html="true"
              title="Set this task as focus!"
              onClick={handleClick.bind(this, task, role)}
              style={{
                border: "1px solid #ccc",
                borderRadius: "5px",
                backgroundColor: "#fff",
                transform: "scale(0.7)",
              }}
            >Focus
              {/* <i className={`fa fa-sm fa-bullseye`}></i>   */}
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

  const renderItem = (task: ItemType, role: ItemType) => {
    if (debug) console.log('273 gcObj', o);
    if (!task && !role) return null;
    if (!role) role = { id: 0, name: "Modeller" };
    // const obj = task;
    if (debug) console.log('276 ', obj);
    const oDiv = taskItem(task, role)
    if (debug) console.log('286 renderItem', oDiv);
    return oDiv;
  };

  const genTasksDiv = (): JSX.Element | null => {
    return subModels?.map((sm: any, index: number) => {
      if (debug) console.log('276 Tasks', sm);
      const sourceMetamodel = metamodels?.find((mm: { id: any; }) => mm.id === sm.metamodelRef);

      let filteredTasks = sm.objects.filter(o => o.typeName === "Task")
      let subTasks = filteredTasks.sort((a, b) => a.name.localeCompare(b.name));
      let subRoles = sm.objects.filter((o: { typeRef: any; }) => o.typeName === "Role");
      if (debug) console.log('280 Tasks', subTasks);

      const tasksDiv = subTasks.map((subtask: ItemType) => {
        return renderItem(subtask, subRoles[0]);
      });

      return (
        <details key={index}>
          <summary id='task' className="text-success d-flex align-items-center m-0 bg-light" >
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

  const genTasksHeaderDiv =
    <>
      <div className="tasklist p-1 mt-2 me-2"
        style={{ backgroundColor: "lightyellow", relative: "fixed", top: "0px", right: "0%", width: "400px", height: "78vh", zIndex: "999" }}
        // style={{  backgroundColor: "lightyellow", position: "relative",   top: "34%", right: "0%", transform: "translate(-1%, -10%)", overflow: "hidden", zIndex: 9999 }}
        ref={containerRef}
      >
        <button
          className="btn btn-sm bg-light text-dark float-end"
          onClick={setMinimizedTask}
        >
          X
        </button>
        <div className="fle-d">
          <div className="ps-2 text-success font-weight-bold fs-5 " >Modelling Guide</div>
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
                style={{ backgroundColor: "transparent" }}
              >
                <i className="fa fa-lg fa-folder-open"></i>
              </button>
              :
              <button
                className="btn text-success mt-0 pe-2 py-0 btn-sm float-end"
                data-toggle="tooltip" data-placement="top" data-bs-html="true"
                title="Open all!"
                onClick={openAllDetails}
                style={{ backgroundColor: "transparent" }}
              >
                <i className="fa fa-lg fa-folder-closed"></i>
              </button>
            }
          </div>
          <hr className="m-0 p-2" />
        </div>
        <div className="tasks" style={{ maxHeight: "70vh", overflow: "scroll" }}>
          <div className="bg-light p-1 "> Generated Tasks from: <span className="bg-transparent px-1 text-success"> {subModels[0]?.name}</span>
            {genTasksDiv()}
          </div>
        </div>
      </div>
    </>
    ;

  const modalDiv =
    <Modal className="ps-auto" show={showModal} onHide={handleCloseModal}
      style={{ marginLeft: "0%", marginTop: "240px", backgroundColor: "lightyellow" }} >
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


  if (minimizedTask) {
    return (
      <button
        className="btn btn-sm border text-success px-0 py-0 float-end"
        style={{ backgroundColor: "#ffffdd" }}
        onClick={() => setMinimizedTask(false)}
      >
        <span className="fs-0" style={{ whiteSpace: "nowrap" }}><i className="fa fa-question pull-right-container"></i></span>
      </button>
    );
  } else {
    return (
      <div className="tasklist">
        <button
          className="btn btn-sm border text-success px-1 py-0 float-end"
          style={{ backgroundColor: "#ffffdd", whiteSpace: "nowrap" }}
          data-toggle="tooltip" data-placement="top" data-bs-html="true"
          title="Close Task pane!"
          onClick={() => setMinimizedTask(true)}
        >
          <span className="fs-0" style={{ whiteSpace: "nowrap" }}><i className="fa fa-sm fa-angle-left pull-left-container"></i></span>
        </button>
        <div 
          className="tasklist">
          {genTasksHeaderDiv}
        </div>
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
      </div>
    );
  }
}

function type(metamodels: any[], model: { metamodelRef: any; }, subModelobjects: any[], curov: { objectRef: any; }) {
  const retval = metamodels?.find((mm: { id: any; }) => mm.id === model?.metamodelRef)
    ?.objecttypes?.find((ot: { id: any; }) => ot.id === subModelobjects?.find((o: { id: any; }) => o.id === curov?.objectRef)?.typeRef)?.name;
  if (debug) console.log('377 Tasks ', retval);
  return retval;
}

export default Tasks;
