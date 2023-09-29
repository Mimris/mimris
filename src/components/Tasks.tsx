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
import { set } from 'immer/dist/internal';

const debug = false;

function Tasks(props) {


  console.log('20 Tasks', require('/public/images/Task.png'));
  if (debug) console.log('18 Tasks props', props, props.props.phData);
  const dispatch = useDispatch();

  const state = useSelector((state) => state); // use RootState type
  if (debug) console.log('24 Tasks state', state);
  const [selectedTask, setSelectedTask] = useState(null);
  const [minimized, setMinimized] = useState(true);
  const [maximized, setMaximized] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [taskObj, setTaskObj] = useState(null);
  const [parentObj, setParentObj] = useState(null);
  const [grandParentObj, setGrandParentObj] = useState(null);
  const [greatGrandParentObj, setGreatGrandParentObj] = useState(null);
  const [prevParentObj, setPrevParentObj] = useState(null);
  const [prevGrandParentObj, setPrevGrandParentObj] = useState(null);
  const [prevGreatGrandParentObj, setPrevGreatGrandParentObj] = useState(null);


// useEffect(() => {
//   console.log('40 Tasks', taskObj, parentObj,  prevParentObj);
//   if (parentObj && parentObj !== prevParentObj) {
//    setPrevParentObj(parentObj);
//   } else {
//     setPrevParentObj(null);
//   }
//   // if (grandParentObj !== prevGrandParentObj) setPrevGrandParentObj(grandParentObj);
//   // if (greatGrandParentObj !== prevGreatGrandParentObj) setPrevGreatGrandParentObj(greatGrandParentObj);
// }, [taskObj && taskObj.id ]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
 

  const containerRef = useRef(null);
  const modalRef = useRef(null);

  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     const modal = modalRef.current;
  //     if (containerRef.current && !containerRef.current.contains(event.target) && (!modal || !modal.contains(event.target))) {
  //       setMinimized(true);
  //     }
  //   };
  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

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

  let parentTask: any = null;
  // useEffect(() => {
  //    setPrevParentTask(parentTask);
  // }, [parentTask]);

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


  
  const mvtasks = (taskovs, mv) => {


    return 
      <>
        <ul>
          {taskovs.map((taskov, index) => {
            if (!debug) console.log('151 Tasks', taskovs, taskov.name, index);
            // find parent objectview (group) of taskObj
            const parentObjView = mv?.objectviews?.find(ov => ov?.id === taskov?.group) || null; // find parent objectview of taskov
            const grandparentObjView = mv?.objectviews?.find(ov => ov?.id === parentObjView?.group) || null; // find grandparent objectview of taskov
            const greatGrandParentObjView = mv?.objectviews?.find(ov => ov?.id === grandparentObjView?.group) || null; // find grandparent objectview of taskov
            // find parent objects of taskObj
            setTaskObj(motherobjects.find(o => o.id === taskov?.objectRef)) || null;
            setParentObj(motherobjects.find(o => o.id === parentObjView?.objectRef)) || null; // find parent object of taskov
            setGrandParentObj(motherobjects.find(o => o.id === grandparentObjView?.objectRef)) || null; // find grandparent object of taskov
            setGreatGrandParentObj(motherobjects.find(o => o.id === greatGrandParentObjView?.objectRef)) || null; // find grandparent object of taskov
  
            if (!debug) console.log("165 taskobj", parentObj, grandParentObj, greatGrandParentObj, prevParentObj, prevGrandParentObj, prevGreatGrandParentObj, taskObj, index);
  
            return (
              <>
                {grandParentObj && parentObj !== prevParentObj ? (
                  <details>
                    <summary className="text-success d-flex align-items-center">
                      <span className="ms-2"> - {greatGrandParentObj?.name}</span>
                      {greatGrandParentObj?.description !== "" && (
                        <img
                          className="bg-secondary ms-auto me-1"
                          src="/images/info.svg"
                          alt="Details Arrow"
                          title="Details info"
                          width="12"
                          height="16"
                        />
                      )}
                    </summary>
                    <ReactMarkdown className="bg-light px-2">
                      {greatGrandParentObj?.description}
                    </ReactMarkdown>
                  </details>
                ) : null}
                {taskObj && (
                  <details>
                    <summary className="text-success d-flex align-items-center">
                      <span className="ms-2"> - {grandParentObj?.name}</span>
                      {grandParentObj?.description !== "" && (
                        <img
                          className="bg-secondary ms-auto me-1"
                          src="/images/info.svg"
                          alt="Details Arrow"
                          title="Details info"
                          width="12"
                          height="16"
                        />
                      )}
                    </summary>
                    <ReactMarkdown className="bg-light px-2">
                      {grandParentObj?.description}
                    </ReactMarkdown>
                  </details>
                )}
                {parentObj && parentObj !== prevParentObj ? (
                  <details>
                    <summary className="text-success d-flex align-items-center">
                      <span className="ms-2"> - {parentObj?.name}</span>
                      {parentObj?.description !== "" && (
                        <img
                          className="bg-secondary ms-auto me-1"
                          src="/images/info.svg"
                          alt="Details Arrow"
                          title="Details info"
                          width="12"
                          height="16"
                        />
                      )}
                    </summary>
                    <ReactMarkdown className="bg-light px-2">
                      {parentObj?.description}
                    </ReactMarkdown>
                  </details>
                ) : null}
                {taskObj && taskObj.id !== parentTask?.id && (
                  <li
                    key={taskObj.id}
                    className="li bg-transparent border-secondary p-0 me-0"
                    onClick={() => setSelectedTask(taskObj)}
                  >
                    <details className="m-y p-0 pe-1 border">
                      <summary
                        className="text-success d-flex align-items-center"
                        onClick={toggleOpen}
                      >
                        <img
                          className="ms-2"
                          src="/images/Task.png"
                          alt="Details Arrow"
                          title="Details Arrow"
                          width="12"
                          height="16"
                        />
                        <span className="ms-2">{taskObj?.name}</span>
                        <span className="d-flex my-0 ms-auto me-0 align-items-center">
                          <button
                            className="btn btn-sm bg-light text-success mx-0 px-1 fs-6  "
                            onClick={() =>
                              dispatch({
                                type: "SET_FOCUS_TASK",
                                data: { id: taskObj.id, name: taskObj.name },
                              })
                            }
                            style={{
                              border: "1px solid #ccc",
                              borderRadius: "5px",
                              backgroundColor: "#fff",
                              scale: "0.9",
                            }}
                          >
                            *
                          </button>
                          <img
                            className="bg-secondary"
                            src="/images/info.svg"
                            alt="Details Arrow"
                            title="Details info"
                            width="12"
                            height="16"
                          />
                        </span>
                      </summary>
                      <div className="selected-task bg-transparent border border-light p-1">
                        <div className="bg-light">
                          <ReactMarkdown>{taskObj?.description}</ReactMarkdown>
                        </div>
                      </div>
                    </details>
                  </li>
                )}
              </>
            );
          })}
        </ul>
      </> 
  }

  const tasksDiv = mothermodelviews?.map((mv) => { // map over all modelviews of this model

    const motherobjviews = mv?.objectviews; // all objectviews of this modelview
    if (debug) console.log('237 Tasks', mv, motherobjviews);
    
    // const seltaskovs = uniqueovs?.filter(ov => motherobjects.find(o => o.id === ov.objectRef)?.typeName === 'Task' && ov);
    // const objs = motherobjects?.filter(o => motherobjviews.find(ov => o.id === ov.objectRef) && o); // objects of this modelview
    // const taskobjvs = motherobjviews?.map(ov => (ov.objectRef === (objs.find(o => o.typeName === 'Task')?.id)) && ov) // objectviews of type Task of this modelview
    // const taskobjvstmp = mv.objectviews?.map(ov => objs.find(o => o.typeName === 'Task' && ov.objectRef === o.id) && ov).filter(Boolean);
    // const taskobjvs = taskobjvstmp?.filter(ov => taskobjvstmp.find(ov2 => ov2.id === ov.group) && ov); // remove duplicates
    // if (!debug) console.log('245 Tasks',mv.name, motherobjviews, objs, taskobjvs);
    if (mv.objectviews.length > 0) {

      // find mv.objectviews that has no parent objectview and not of type Label
      const noparentovs = mv?.objectviews?.filter(ov => (!motherobjviews?.find(ov2 => ov2?.id === ov?.group)));
      const labelos = motherobjects?.filter(o => o.typeName === 'Label' && o);
      const topGroupOvs = noparentovs?.filter(ov => !labelos?.find(o => o?.id === ov?.objectRef));
      // const topGroupOvs = mv?.objectviews?.filter(ov => (!motherobjviews?.find(ov2 => ov2?.id === ov?.group)))?.filter(ov => !motherobjects?.filter(o => o.typeName === 'Label' && o)?.find(o => o?.id === ov?.objectRef));
      if (debug) console.log('331 noparents', topGroupOvs);

      const topGroupOvsDiv = topGroupOvs?.map(ov => {
        // find childrenv of this ov
        const childrenv = mv?.objectviews?.filter(ov2 => ov2?.group === ov?.id);
        const grandchildrenv = childrenv?.map(child => mv?.objectviews?.filter(ov2 => ov2?.group === child?.id));

        const grandchildrenvDiv = grandchildrenv?.map(gc => {
          const gcObjv = motherobjects?.find(o => o?.id === gc?.objectRef);
          const gcType = motherobjects.find(o => o.id === ov.objectRef)?.typeName;
          if (!debug) console.log('338 gcObjv', gcObjv, gcType);
          
          return (gcObjv) && (
            <details>
              <summary className="text-success d-flex align-items-center">
                <span className="ms-2"> - {gcObjv?.name}</span>
                {gcObjv?.description !== "" && (
                  <img className="bg-secondary ms-auto me-1" src="/images/info.svg" alt="Details Arrow" title="Details info" width="12" height="16" />
                )}
              </summary>
              <ReactMarkdown className="bg-light px-2">
                {gcObjv?.description}
              </ReactMarkdown>
            </details>
          )
        })
        const childrenvDiv = childrenv?.map(child => {
          const childObjv = motherobjects?.find(o => o?.id === child?.objectRef);
          const childType = motherobjects.find(o => o.id === ov.objectRef)?.typeName;
          if (!debug) console.log('356 childObj', childObjv, childType);
          return (childObjv) && (
            <>
            <details>
              <summary className="text-success d-flex align-items-center">
                <span className="ms-2"> - {childObjv?.name}</span>
                {childObjv?.description !== "" && (
                  <img className="bg-secondary ms-auto me-1" src="/images/info.svg" alt="Details Arrow" title="Details info" width="12" height="16" />
                  )}
              </summary>
              <ReactMarkdown className="bg-light px-2">
                {childObjv?.description}
              </ReactMarkdown>
            </details>
            {grandchildrenvDiv}
            </>
          )
        })
        return (
          <>
            <details>
              <summary className="text-success d-flex align-items-center">
                <span className="ms-2"> - {motherobjects?.find(o => o?.id === ov?.objectRef)?.name}</span>
                {motherobjects?.find(o => o?.id === ov?.objectRef)?.description !== "" && (
                  <img className="bg-secondary ms-auto me-1" src="/images/info.svg" alt="Details Arrow" title="Details info" width="12" height="16" />
                )}
              </summary>
              <ReactMarkdown className="bg-light px-2">
                {motherobjects?.find(o => o?.id === ov?.objectRef)?.description}
              </ReactMarkdown>
            </details>
            {childrenvDiv}
          </>
        )
      })


      return (
        <>
          <hr className="my-0"/>
          <details className="my-1 mx-0"><summary className="bg-transparent">{mv.name}</summary>         
            top:{topGroupOvsDiv}
            <ul>
              {mvtasks(mv.objectviews, mv)}
            </ul>
          </details> 
        </>
      );
      

    } else {
      return (<> </>)
    }
  });

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
          <div className="buttons position-relative me-3" style={{ scale: "0.7"}}>
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
        {/* <Selector key='Tasks1' type='SET_FOCUS_TASK' selArray={taskovs} selName='Tasks' focustype='focusTask' /> */}
        <div className="task">
          <details>
            <summary className="bg-light px-1"> Default Modelling Tasks: </summary>
              <details className="mx-2">
                <summary>Create a new Object:</summary>
                <ReactMarkdown>{basicTask1}</ReactMarkdown>
              </details>
              <hr className="m-0" />
              <details className="mx-2">
                <summary>Create a new Relationship:</summary>
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
    ?.objecttypes?.find(ot => ot.id === motherobjects?.find(o => o.id === curov?.objectRef)?.typeRef)?.name;
  if (debug) console.log('377 Tasks ', retval);
  return retval;
}

export default Tasks;




 
// const taskEntriesArr = Object.entries(taskObj || {})  // task properties 
// .filter(([key]) => !['id', 'description'].includes(key))
// .map(([key, value]) => `- **${key}:** ${value}\n`);

// taskEntries = taskEntriesArr.join('');
// const includedKeysMain = ['id', 'name', 'description', 'proposedType', 'typeName', 'typeDescription'];

// const objectPropertiesMain = (taskObj) && Object.keys(taskObj).filter(key => includedKeysMain.includes(key));

// if (debug) console.log('140 taskEntries', taskEntries)

// const taskEntriesDiv = (
//   <>
//     <details>
//       <summary>Task Properties:</summary>
//       <ReactMarkdown>{`${taskEntries}`}</ReactMarkdown>
//     </details>
//   </>
// )

// if (debug) console.log('147 taskEntries', taskEntries, taskEntriesArr, taskEntriesDiv)