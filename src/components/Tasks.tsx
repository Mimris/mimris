// @ts-nocheck
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import Selector from './utils/Selector';
import ReactMarkdown from 'react-markdown';
import { wrapper } from '../store'; // import RootState type

import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

import ReportModule from "./ReportModule";
import {ObjDetailTable} from './forms/ObjDetailTable';

const debug = false;

function Tasks(props) {

  if (debug) console.log('18 Tasks props', props.props.phData);

  const state = useSelector((state) => state); // use RootState type
  if (debug) console.log('24 Tasks state', state);
  const [selectedTask, setSelectedTask] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const dispatch = useDispatch();

  const [showModal, setShowModal] = useState(false);

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
  const objectviews2 = mothermodelviews?.flatMap(mv => mv.objectviews);

  const uniqueovs = objectviews2?.filter((ov, index, self) =>
    index === self.findIndex(t => t.place === ov.place && t.id === ov.id)
  );
  
  const seltasks = uniqueovs?.filter(ov => motherobjects.find(o => o.id === ov.objectRef).typeName === 'Task' && ov);
  if (!debug) console.log('63 Tasks', uniqueovs, seltasks, showModal);


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
      <div className="minimized-task " >
        <div className="buttons position-absolute end-0">
          <button
            className="btn text-success me-0 px-2 py-0 btn-sm"
            data-toggle="tooltip"
            data-placement="top"
            data-bs-html="true"
            title="Toggle Context & Focus Modal for current task!"
            onClick={handleShowModal}
            style={{ scale: "0.9", backgroundColor: "lightyellow" }}
          >
            ✵
          </button>

          <button 
            className="btn text-success me-2 px-2 py-0 btn-sm" 
            data-toggle="tooltip"
            data-placement="top"
            data-bs-html="true"
            title="Minimize"
            onClick={handleMaximize}
            style={{ scale: "0.9", backgroundColor: "lightyellow", relativePosition: "-116" }}
          >
            &lt;-
          </button>
        </div>
        <Modal show={showModal} onHide={handleCloseModal}  style={{ marginLeft: "200px", marginTop: "100px", backgroundColor: "lightyellow" }} >
            <Modal.Header closeButton>
              <Modal.Title>Report Module</Modal.Title>
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

  const tasksDiv = seltasks ? (
    <ul>
    {seltasks.map((t) => {
      const taskObj = motherobjects?.find(
        (o) =>
          o.id ===
          uniqueovs.find((ov) => ov.id === t?.id)?.objectRef
      );
      if (debug) console.log("91 taskobj", taskObj, t);
      const taskmetamodel = metamodels?.find(mm => mm.id === mothermodel?.metamodelRef);
  
      const taskEntriesArr = Object.entries(taskObj || {})
        .filter(([key]) => !['id', 'description'].includes(key))
        .map(([key, value]) => `- **${key}:** ${value}\n`);
        
      taskEntries = taskEntriesArr.join('');
      const includedKeysMain = ['id', 'name', 'description', 'proposedType', 'typeName', 'typeDescription'];

      const objectPropertiesMain = (taskObj) && Object.keys(taskObj).filter(key => includedKeysMain.includes(key));
      
      const taskEntriesDiv = (
        <details>
          <summary>Task Properties:</summary>
          <ReactMarkdown>{`${taskEntries}`}</ReactMarkdown>
        </details>
      )

      if (debug) console.log('104 taskEntries', taskEntries, taskEntriesArr, taskEntriesDiv)
  
      return (
        <>
          <li key={t.id} className="li bg-transparent border-secondary p-1 border border-success" onClick={() => setSelectedTask(t)}>
            {/* <hr className="m-0" /> */}       
            <details>
              <summary>{t?.name}</summary>
              <button
                className="btn btn-sm checkbox bg-transparent text-success" 
                onClick={() => dispatch({ type: "SET_FOCUS_TASK", data: t }) } // && handleShowModal()}
                style={{
                  float: "right",
                  border: "1px solid #ccc",
                  borderRadius: "3px",
                  backgroundColor: "#fff",
                  // width: "20px",
                  // height: "20px",
                  marginTop: "-25px",
                  marginLeft: "auto",
                  display: "inline-block",
                  position: "relative",
                }}
              >Set Focus
              </button>
              <div className="bg-transparent ms-1">{taskObj?.description}</div> {/*} .slice(0, 48)} . . . </div> */}
              {taskObj && (
                <div className="selected-task bg-transparent border border-light p-1">
                  <div className="bg-light">
                    {taskEntriesDiv}
                  </div>
                  <div className="bg-light">
                    <details><summary>Description:</summary>
                      <ReactMarkdown>{taskObj?.description}</ReactMarkdown>
                    </details>
                  </div>
                </div>
              )}
            </details>
          </li>
        </>
      );
    })}
  </ul>
  ) : (
    <div>No generated task for this model</div>
  );


  const basicTask1 = `
    - From the Palette, drag the object type
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
      <div className="tasklist">
        <div className="header m-0 p-0">
          <div className="ps-2 text-success font-weight-bold fs-6" >Modelling Guide with suggested Tasks</div>
          <div className="buttons">
            <button className="btn text-success ms-1 mt-1 pt-1 btn-sm"
              data-toggle="tooltip" data-placement="top" data-bs-html="true"
              title="Toggle Context & Focus Modal!"
              onClick={handleShowModal} style={{ scale: "0.9", backgroundColor: "lightyellow" }} >✵
            </button> 
            <button className="btn text-success m-1 ms-0 py-0 btn-sm" onClick={handleMinimize} style={{ backgroundColor: "lightyellow"}}>-&gt;</button>
            {/* <button onClick={handleMaximize}>+</button> */}
          </div>
        </div>
        <div className="flex-d w-100">
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
          <div className="bg-light"> Default Tasks: </div>
          <details>
            <summary>Create a new Object:</summary>
            <ReactMarkdown>{basicTask1}</ReactMarkdown>
          </details>
          <hr className="m-0" />
          <details>
            <summary>Create a new Relatinship:</summary>
            <ReactMarkdown>{basicTask2}</ReactMarkdown>
          </details>
          <hr className="m-0" />
          <details>
            <summary>Make a new Objectview of existing object</summary>
            <ReactMarkdown>{basicTask3}</ReactMarkdown>
          </details>
          <hr className="my-2 p-0 border-light" />
        </div>
        <div className="bg-transparent"> Generated Tasks from: <span className="bg-transparent px-1 text-success"> {mothermodel?.name}</span> </div>

        {tasksDiv}
        <Modal show={showModal} onHide={handleCloseModal}  style={{ marginLeft: "10%", marginTop: "200px", backgroundColor: "lightyellow" }} >
            <Modal.Header closeButton>
              <Modal.Title>Report Module</Modal.Title>
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