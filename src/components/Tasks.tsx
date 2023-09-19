// @ts-nocheck
import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch} from 'react-redux';
import Selector from './utils/Selector';
import ReactMarkdown from 'react-markdown';
import { wrapper } from '../store'; // import RootState type

import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import taskIcon from "/public/images/task.png";

import ReportModule from "./ReportModule";
import {ObjDetailTable} from './forms/ObjDetailTable';

const debug = false;

function Tasks(props) {


  console.log('20 Tasks', require('/public/images/Task.png'));
  if (debug) console.log('18 Tasks props', props, props.props.phData);

  const state = useSelector((state) => state); // use RootState type
  if (debug) console.log('24 Tasks state', state);
  const [selectedTask, setSelectedTask] = useState(null);
  const [minimized, setMinimized] = useState(true);
  const [maximized, setMaximized] = useState(false);
  const dispatch = useDispatch();

  const [showModal, setShowModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
 

  const containerRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const modal = modalRef.current;
      if (containerRef.current && !containerRef.current.contains(event.target) && (!modal || !modal.contains(event.target))) {
        setMinimized(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
  const focusModel = useSelector(state => state.phFocus?.focusModel);
  const focusModelview = useSelector(state => state.phFocus.focusModelview);
  const focusTask = useSelector(state => state.phFocus.focusTask);
  const focusRole = useSelector(state => state.phFocus.focusRole);

  const curmodel = models?.find(m => m?.id === focusModel?.id);
  const curmetamodel = metamodels?.find(m => m?.id === curmodel?.metamodelRef);
  // const mothermodel = models?.find(m => m?.name.endsWith('_TD'));
  // set mothermodel to generatedRef in cur metamodel
  const mothermodel = models?.find(m => m?.id === curmetamodel?.generatedFromModelRef);
  const mothermodelviews = mothermodel?.modelviews;
  const modelviews = curmodel?.modelviews;
  const motherobjects = mothermodel?.objects;





  const handleMinimize = () => {
    setMinimized(true);
    setMaximized(false);
  };

  const handleMaximize = () => {
    setMinimized(false);
    setMaximized(true);
  };

  if (minimized) {
    return (
      <div className="minimized-task not-visible">
        <div className="buttons position-absolute me-3 end-0"  style={{ scale: "0.7",marginTop: "-28px" }}>
          <button
            className="btn text-success ps-1 pe-1 py-0 btn-sm"
            data-toggle="tooltip"
            data-placement="top"
            data-bs-html="true"
            title="Toggle Context & Focus Modal for current task!"
            onClick={handleShowModal}
            style={{ backgroundColor: "lightyellow" }}
          >
            ✵
          </button>
          <button 
            className="btn text-success me-0 px-1 py-0 btn-sm" 
            data-toggle="tooltip"
            data-placement="top"
            data-bs-html="true"
            title="Minimize"
            onClick={handleMaximize}
            style={{ backgroundColor: "lightyellow"}}
          >
            &lt;-
          </button>
        </div>
        <Modal show={showModal} onHide={handleCloseModal}  style={{ marginLeft: "200px", marginTop: "100px", backgroundColor: "lightyellow" }} >
            <Modal.Header closeButton>
              <Modal.Title>Focus details:</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-transparent">
              <ReportModule props={props.props} reportType="task" modelInFocusId={mothermodel?.id} />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Close
              </Button>
            </Modal.Footer>
        </Modal>
      </div>
    );
  }

  let taskEntries: string = '';
  let uniqueovs: any[] = [];
  let curParentObj: any = null;
  
  const mvtasks = (seltasks, parentTask) =>  (seltasks?.length > 0) ? (

    <>
      {/* <h6 className="bg-transparent">Modelview Tasks: {modelviews.name}</h6> */}
      <ul>
      {
          seltasks.map((taskObj, index) => {
          if (!debug) console.log("148 taskobj", taskObj, 'parenTask:', parentTask);
          // const taskmetamodel = metamodels?.find(mm => mm.id === mothermodel?.metamodelRef);
          // find parent container of taskObj
 
          const taskEntriesArr = Object.entries(taskObj || {})
          .filter(([key]) => !['id', 'description'].includes(key))
          .map(([key, value]) => `- **${key}:** ${value}\n`);
          
          taskEntries = taskEntriesArr.join('');
          const includedKeysMain = ['id', 'name', 'description', 'proposedType', 'typeName', 'typeDescription'];
          
          const objectPropertiesMain = (taskObj) && Object.keys(taskObj).filter(key => includedKeysMain.includes(key));

          if (debug) console.log('140 taskEntries', taskEntries)
          
          const taskEntriesDiv = (
            <>
              <details>
                <summary>Task Properties:</summary>
                <ReactMarkdown>{`${taskEntries}`}</ReactMarkdown>
              </details>
            </>
          )
        
        if (debug) console.log('147 taskEntries', taskEntries, taskEntriesArr, taskEntriesDiv)

        return (
          <>
            {(parentTask && index === 0) &&
              <details>
                <summary className="text-success d-flex align-items-center">
                  <span className="ms-2"> - {parentTask?.name}</span>
                  {(parentTask?.description !== "") && <img className="bg-secondary ms-auto me-2" src='/images/info.svg' alt="Details Arrow" title="Details info" width="12" height="16" />}
                </summary> 
                <ReactMarkdown className="bg-light px-2" >{parentTask.description}</ReactMarkdown>
              </details>
            }
            {(taskObj.id !== parentTask?.id) &&
            <li key={taskObj.id} className="li bg-transparent border-secondary p-0 me-0" onClick={() => setSelectedTask(taskObj)}>
              {/* <hr className="m-0" /> */}       
              <details className="m-y p-0 pe-1 border">
                <summary className="text-success d-flex align-items-center" onClick={toggleOpen}>
                  <img className="ms-2"  src='/images/Task.png' alt="Details Arrow" title="Details Arrow" width="12" height="16" />
                  <span className="ms-2">{taskObj?.name}</span>
                  <span className="d-flex my-0 ms-auto me-0 align-items-center">
                    <button
                      className="btn btn-sm bg-light text-success mx-0 px-1 " 
                      onClick={() => dispatch({ type: "SET_FOCUS_TASK", data: {id: taskObj.id, name: taskObj.name }}) } // && handleShowModal()}
                      style={{
                        border: "1px solid #ccc",
                        borderRadius: "5px",
                        backgroundColor: "#fff",
                        scale: "0.7",
                      }}
                      >
                      Set Focus
                    </button>
                    <img className="bg-secondary" src='/images/info.svg' alt="Details Arrow" title="Details info" width="12" height="16" />
                    </span>
                </summary>
                {/* <div className="bg-light ms-0 me-0 mt-1 px-2"> */}
                  {/* {taskObj?.description}</div>  */}
                  <div className="selected-task bg-transparent border border-light p-1">
                  {/* <div className="bg-light">
                    {taskEntriesDiv}
                  </div> */}
                  <div className="bg-light">
                    {/* <details><summary>Description:</summary> */}
                      <ReactMarkdown>{taskObj?.description}</ReactMarkdown>
                    {/* </details> */}
                  </div>
                </div>         
              </details>
            </li>
            }
          </>
        )}
      )}
      </ul>
    </>
    ) : (
    <div>No generated task for this model</div>
    );

  const tasksDiv = mothermodelviews?.map((mv) => {
    // const objectviews2 = mothermodelviews?.flatMap(mv => mv.objectviews);
    const objectviews2 = mv?.objectviews;
    //   uniqueovs = objectviews2?.filter((ov, index, self) =>
    //   index === self.findIndex(t => t.place === ov.place && t.id === ov.id)
    // );
    console.log('202 Tasks',  uniqueovs, objectviews2, mv);
    // const seltaskObjviews = uniqueovs?.filter(ov => motherobjects.find(o => o.id === ov.objectRef)?.typeName === 'Task' && ov);
    const seltaskObjs = motherobjects?.filter(o => objectviews2.find(ov => o.id === ov.objectRef));
    const seltasks = seltaskObjs?.filter(o => o.typeName === 'Task');
    if (debug) console.log('203 Tasks', seltasks, seltaskObjs);
  
    if (seltasks.length > 0) {

      // find parent objectview (group) of taskObj
      const taskObjView = mv?.objectviews?.find(ov => ov?.objectRef === seltasks[0].id);
      const parent = mv?.objectviews?.find(ov => ov?.id === taskObjView?.group) || null;
      const parentObj = motherobjects.find(o => o.id === parent?.objectRef) || null;
      const grandParent = mv?.objectviews?.find(ov => ov?.id === parent?.group) || null;
      const grandParentObj = motherobjects.find(o => o.id === grandParent?.objectRef) || null;
      console.log('248 Tasks', parent, parentObj, grandParentObj);

      return (
        <>
          <hr className="my-0"/>
          <details className="my-1 mx-0"><summary className="bg-transparent">{mv.name}</summary>        
          {(grandParentObj) && 
            <details className="mx-0 px-0">
              <summary className="text-success d-flex align-items-center">
                <span className=""> -- {grandParentObj?.name}</span>
                {(grandParentObj?.description !== "") && <img className="bg-secondary ms-auto" src='/images/info.svg' alt="Details Arrow" title="Details Arrow" width="12" height="16" />}
              </summary>
              <ReactMarkdown className="bg-light py-0 px-2" >{grandParentObj.description}</ReactMarkdown>
            </details>
          }
          <ul>
            {mvtasks(seltasks, parentObj)}
          </ul>
          </details> 
        </>
      );
      } else {
        return (<> </>)
      }
    }
  );




  const basicTask1 = `
    - From the Palette on left side, drag the object type
      you want to create into the canvas.
    - Click on the name to edit.
    - Double-click on the object to open 
      the properties panel, where you can edit 
      Name, description etc.
  `;
  const basicTask2= `
    - Click on the edge of an Object and 
      drag the cursor to another object.
    - Click on the name of the Relationship to edit.
    - Right-Click or Double-click on the 
      relationship to open the properties panel, 
      where you can edit Name, description etc.
  `;
  const basicTask3 = `
    - Open the Object panel to the left. Drag one 
      or more objects into the canvas.
      (Note: if you change name or other properties 
      of the object, all other objectviews of the 
      same object will also be changed)
  `;

  return (
    <>
      <div className="tasklist p-1 " 
        ref={containerRef}
        style={{ backgroundColor: "lightyellow", width: "25rem", 
        position: "absolute", height: "100%", top: "50%", right: "0%", transform: "translate(-0%, -50%)", zIndex: 9999 }}
      >
        <div className="header m-0 p-0">
            <div className="ps-2 text-success font-weight-bold fs-6" >Modelling Guide with suggested Tasks</div>
          <div className="buttons position-relative end-0" style={{ scale: "0.7"}}>
            <button 
              className="btn text-success mt-0 pe-2 py-0 btn-sm"
              data-toggle="tooltip" data-placement="top" data-bs-html="true"
              title="Toggle Context & Focus Modal!"
              onClick={handleShowModal} 
              style={{ backgroundColor: "lightyellow"}} >✵
            </button> 
            <button 
              className="btn text-success me-0 px-1 py-0 btn-sm" 
              onClick={handleMinimize} 
              style={{ backgroundColor: "lightyellow"}}>-&gt;</button>
            {/* <button onClick={handleMaximize}>+</button> */}
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
          <hr className="m-0" />
        </div>
        {/* <Selector key='Tasks1' type='SET_FOCUS_TASK' selArray={seltasks} selName='Tasks' focustype='focusTask' /> */}
        <div className="task">
          <details>
            <summary className="bg-light px-1"> Default Modelling Tasks: </summary>
              <details className="mx-2">
                <summary>Create a new Object:</summary>
                <ReactMarkdown>{basicTask1}</ReactMarkdown>
              </details>
              <hr className="m-0" />
              <details className="mx-2">
                <summary>Create a new Relatinship:</summary>
                <ReactMarkdown>{basicTask2}</ReactMarkdown>
              </details>
              <hr className="m-0" />
              <details className="mx-2">
                <summary>Make a new Objectview of existing object</summary>
                <ReactMarkdown>{basicTask3}</ReactMarkdown>
              </details>
            </details>
          <hr className="my-1 p-0 border-light" />
        </div>
        <div className="bg-light p-1"> Generated Tasks from: <span className="bg-transparent px-1 text-success"> {mothermodel?.name}</span> </div>
        <div className="bg-transparent m-1"> 
          {tasksDiv} 
        </div>

        <Modal show={showModal} onHide={handleCloseModal}  style={{ marginLeft: "10%", marginTop: "200px", backgroundColor: "lightyellow" }} >
            <Modal.Header closeButton>
              <Modal.Title>Focus details ::</Modal.Title>
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
      </div>
      <style jsx>{`
          .tasklist {
            width: 100%;
            height: 100%;
            overflow: auto;
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
    ?.objecttypes?.find(ot => ot.id === motherobjects?.find(o => o.id === curov.objectRef)?.typeRef)?.name;
    if (debug) console.log('377 Tasks ', retval);
    return retval;
}

export default Tasks;