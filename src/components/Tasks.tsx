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
import { addLinkToDataArray } from '../akmm/ui_common';
import { group } from 'console';

const debug = false;

interface ObjView {
  id: number;
  group: number;
}


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
      // find mv.objectviews that has no parent objectview and not of type Label i.e. top containers(groups)

  const taskItem = (task) => 
    <li
      key={task?.id}
      className="li bg-transparent border-secondary p-0 me-0"
      onClick={() => setSelectedTask(task)}
    >
      <details className="m-y p-0 pe-1">
        <summary
          className="text-success d-flex align-items-top p-0 m-0"
          onClick={toggleOpen}
        >
          <img
            className="ms-0"
            src="/images/Task.png"
            alt="Details Arrow"
            title="Details Arrow"
            width="16"
            height="22"
          />
          <span className="ms-2">{task?.name}</span>
          <span className="d-flex my-0 ms-auto me-0 align-items-center">
            <button 
              className="btn bg-light text-success mx-0 px-1 pt-0 fs-5"

              onClick={() =>
                dispatch({
                  type: "SET_FOCUS_TASK",
                  data: { id: task.id, name: task.name },
                })
              }
              style={{
                border: "1px solid #ccc",
                borderRadius: "5px",
                backgroundColor: "#fff",
                scale: "0.7",
              }}
            >
              ✵
            </button>
            {/* <img
              className=""
              src="/images/info.svg"
              alt="Details Arrow"
              title="Details info"
              width="18"
              height="24"
              style={{backgroundColor: "gray"}}
            /> */}
          </span>
        </summary>
        <div className="selected-task bg-transparent border border-light p-1">
          <div className="m-0 p-0 bg-white">
            <ReactMarkdown>{task?.description}</ReactMarkdown>
          </div>
        </div>
      </details>
    </li>

  const containerItem = (container) =>
    <>
      <details>
        <summary className="text-success d-flex align-items-center">
          <span className="ms-0">- {container?.name}</span>
          {/* {container?.description !== "" && (
             <img className="bg-secondary ms-auto me-1" src="/images/info.svg" alt="Details Arrow" title="Details info" width="12" height="16" />
            )} */}
        </summary>
        <ReactMarkdown className="bg-light px-2">
          {container?.description}
        </ReactMarkdown>
      </details>
    </>

  const groupObjvDiv = (ov, oType, parentType) => {
    if (debug) console.log('361 gcObjv', ov, oType, parentType);
    const obj = motherobjects.find((o) => o.id === ov.objectRef);
    const itemDiv = (oType === 'Task') 
      ? taskItem(obj) 
      : (oType === 'Container') 
        ? containerItem(obj) 
        : null;

    if (debug) console.log('242 gcObjv', ov, itemDiv)

    return (oType === 'Task')  
        ? (parentType === 'Task') 
          ? (
            <div className="ms-2 " style={{ backgroundColor: "lightyellow"}}>
              {itemDiv}
            </div> 
          )
          : (
            <div className="ms-0 " style={{ backgroundColor: "lightyellow"}}>
              {itemDiv}
            </div> 
          )
        : (parentType === 'Task') 
          ? (
            <div className="ms-2 " style={{ backgroundColor: "lightyellow"}}>
              {itemDiv}
            </div> 
          )
          : (
            <div className="bg-white ms-0 " >
              {itemDiv}
            </div> 
          )

  }

  const findChildrenvs = (objviews, ov) => {
    return objviews?.filter(
      (ov2) => ov2?.group === ov?.id && !motherobjects?.find((o) => (o.id === ov?.objectRef) && (o.typeName === 'Label')) && ov2);
  };

  //  Render top containers of this modelview and all their children recursively -------------------------------
  const renderItems = (mv, notLabelOvs, obvs, parentType) => {

    const items2 = obvs?.map((ov) => {

      const childrenvs = findChildrenvs(notLabelOvs, ov);
      
      if (debug) console.log('354 renderItems', ov, obvs, childrenvs)
      const oType = motherobjects.find((o) => o.id === ov.objectRef)?.typeName;
      const itemDiv = (
        (childrenvs.length === 0 && parentType !== 'Task')
        ? <div className=" p-0"> {groupObjvDiv(ov, oType, parentType)} </div>
        : <div className=" p-1"> {groupObjvDiv(ov, oType, parentType)} </div>
      );
      const childItems = renderItems(mv, notLabelOvs, childrenvs, oType); // recursively render all children of this ov
      if (debug) console.log('390 renderItems', ov, childrenvs, childItems);

      return (
        <>
          {itemDiv}
          {childItems}
        </>
      );
    });
    return (
      <>
        {items2}
      </>
    );
  };



  const genTasksDiv = mothermodelviews?.map((mv) => { // map over all modelviews of this model

  
    if (mv.objectviews.length > 0) {

      const motherobjviews = mv?.objectviews; // all objectviews of this modelview
      if (debug) console.log('237 Tasks', mv, motherobjviews);
    
      const noparentovs = mv?.objectviews?.filter(ov => (!motherobjviews?.find(ov2 => ov2?.id === ov?.group))); // objectviews that has no parent objectview
      const labelos = motherobjects?.filter(o => o.typeName === 'Label' && o);
      const notLabelOvs = mv.objectviews?.filter(ov => !labelos?.find(o => o?.id === ov?.objectRef) && ov); // remove Label objects from topGroupOvs
      
      const topGroupOvs = noparentovs?.filter(ov => !labelos?.find(o => o?.id === ov?.objectRef)); // remove Label objects from topGroupOvs
      // const topGroupOvs = mv?.objectviews?.filter(ov => (!motherobjviews?.find(ov2 => ov2?.id === ov?.group)))?.filter(ov => !motherobjects?.filter(o => o.typeName === 'Label' && o)?.find(o => o?.id === ov?.objectRef));
      if (debug) console.log('375 noparents', noparentovs, labelos, topGroupOvs);
      if (debug) console.log('376 renderItems', mv, mv?.objectviews, topGroupOvs);


      const topGroupOvsDiv = topGroupOvs?.map((ov: any) => { // we start with the top containers of this modelview
        const oType = motherobjects.find((o) => o.id === ov.objectRef)?.typeName;
        if (oType === 'Task' || oType === 'Container') {
          const curChildrenvs = findChildrenvs(notLabelOvs, ov);
          if (debug) console.log('379 curChildrenvs', notLabelOvs, ov, curChildrenvs);
          const parentType = 'Container'
          return (
            <div>
              <div className="my-1 mx-0">- {ov.name}</div> 
                {renderItems(mv, notLabelOvs, curChildrenvs, parentType)} {/*  render all children of this ov */}
  
            </div>
          )
        }
      })


      return (
        <>
          <hr className="my-0"/>
          <details className="my-1 mx-0"><summary className="bg-light">{mv.name}</summary>  {/* To level is the modelview */}
            {topGroupOvsDiv} {/* Render the top containers of this modelview */}
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
        style={{ backgroundColor: "white", width: "25rem", 
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
        <div className=" m-1" style={{ backgroundColor: "lightyellow" }}> 
          {genTasksDiv} 
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
