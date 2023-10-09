// @ts-nocheck
import { useEffect, useState, useRef} from 'react';
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
  const [minimized, setMinimized] = useState(true);
  const [maximized, setMaximized] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    setMinimized(false);
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
  const curmodel = (taskFocusModel) ?  models?.find(m => m?.id === taskFocusModel?.id) : models?.find(m => m?.id === focusModel?.id);
  const curmetamodel = metamodels?.find(m => m?.id === curmodel?.metamodelRef);
  // const mothermodel = models?.find(m => m?.name.endsWith('_TD'));
  // set mothermodel to generatedRef in cur metamodel
  const mothermodel = models?.find(m => m?.id === curmetamodel?.generatedFromModelRef);
  const mothermodelviews = mothermodel?.modelviews;
  const modelviews = curmodel?.modelviews;
  const motherobjects = mothermodel?.objects;
  const motherobjviews = mothermodel?.objectviews;
  const motherrelships = mothermodel?.relshipviews;

  console.log('104 Tasks', curmodel, curmetamodel, mothermodel, mothermodelviews, motherobjects, motherobjviews, motherrelships);

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

const handleNewWindow = () => {
  const curmodId = String(curmodel?.id);
  const parameter = '/tasks?taskFocusModel=' + curmodId;
  console.log('116 handleNewWindow', curmodId, parameter);
  window.open(parameter, '_blank');
}

  if (minimized) {
    return (
      <div className="minimized-task">
        <div
          className="buttons position-absolute p-0 m-0 me-1 end-0"
          style={{ scale: "0.8", marginTop: "-25px", marginLeft: "-2px"}}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          >
           <button
            className="btn text-success m-0 px-1 py-0 btn-sm fs-4"
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
              className="btn bg-light text-success mx-0 p-1 pt-0 fs-5"

              onClick={() =>
                dispatch({
                  type: "SET_FOCUS_TASK",
                  data: { id: task.id, name: task.name },
                }),
                (role) && dispatch({
                  type: "SET_FOCUS_ROLE",
                  data: { id: role.id, name: role.name },
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
        <div className="selected-task bg-transparent ps-0">
          <div className="m-0 p-2 bg-white">
            <ReactMarkdown rehypePlugins={[rehypeRaw]} >{task?.description}</ReactMarkdown>
          </div>
        </div>
      </details>
    </li>

  const containerItem = (container) =>
    <>
      <details>
        {/* <summary className="text-success d-flex align-items-center m-0 bg-light" > */}
        <summary
          className="text-success d-flex align-items-center m-0 bg-light"
          onClick={toggleOpen}
        >
          <span className="ms-2" >{container.name} </span>
            <img
              className="d-flex my-0 ms-auto me-0 align-items-center"
              src="/images/info.svg"
              alt="Details Arrow"
              title="Details info"
              width="18"
              height="24"
              style={{ width: "2rem", color: "success" }}
              // style={{ backgroundColor: "warning", width: "5rem", 
              //   position: "relative",  top: "0%", right: "0%", transform: "translate(50%, -125%)", zIndex: 9999 }}
            />
        </summary>
        <ReactMarkdown rehypePlugins={[rehypeRaw]} className="bg-light ps-2" source={container?.description} />
      </details>
    </>

  const renderItem = (ov: any, oType: string) => {
    if (debug) console.log('352 gcObjv', ov, oType);
    if (!ov) return null;
    const obj = motherobjects.find((o) => o.id === ov?.objectRef);
    const role = '' // Todo: find role obj referenced to this objectview
    if (debug) console.log('253 ', role);

    return (oType === 'Task')
      ? taskItem(obj, role)
      : (oType === 'Container')
        ? containerItem(obj)
        : null;
  };

  //  Render top containers of this modelview and all their children recursively -------------------------------
  const renderTree = (item) => {
    if (debug) console.log('325 renderItems', item);
    if (!item) return null;
    const children = item.children;
    const itemDiv = renderItem(item, item.typeName);
    if (debug) console.log('306 renderItem',item,  children);
        
    const childItems = children?.map((child, index) => {
      if (debug) console.log('308 renderItems', child);
      return (item.typeName === 'Task')
      ? <div className="ps-2">{renderTree(child)}</div> 
      : <div className="ps-1">{renderTree(child)}</div> 
    });
    return (
      <>
        {itemDiv}
        {childItems}
      </>
    );
  };


const genTasksDiv = mothermodelviews?.map((mv: any, index: number) => { // map over all modelviews of this model
  if (debug) console.log('371 Tasks', mv);

  const parent = mv;

  // nolabel objectviews that has no parent objectview i.e. top containers(groups)
  const noLabelovs = mv?.objectviews?.filter((ov: any) =>
    (!motherobjects?.filter((o: any) => o.typeName === 'Label').find((o: any) => o.id === ov?.objectRef) && ov)
  );
  const topObjviews = noLabelovs?.filter((ov: any) =>
    (!mv.objectviews?.find((ov2: any) => ov2?.id === ov?.group) && ov)
  );
  if (debug) console.log('305 buildTree', parent, mv, mv.objectviews, noLabelovs, topObjviews);

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
  if (debug) console.log('347 buildTree', ovsTree, topObjviews, parent);

  const topGroupOvsDiv = 
    <details>
      <summary className="text-success d-flex align-items-center m-0 bg-light" >
        <span className="ms-2 d-flex justify-content-between" >
           <div className="d-flex" >
            <img
              className="ms-0"
              src="/images/folder.svg"
              alt="Details Arrow"
              title="Details Arrow"
              width="16"
              height="22"
            />
          <span className="ms-2 me-2"><span style={{ fontWeight: "bold" }}>{mv.description}</span>  ({mv.name})</span>
          </div>
          {/* <div className="ms-4" style={{ whiteSpace: "nowrap" }}>{mv.description} </div> */}
        </span>
          {/* <img
            className="d-flex my-0 ms-auto me-0 align-items-center"
            src="/images/info.svg"
            alt="Details Arrow"
            title="Details info"
            width="18"
            height="24"
            style={{ width: "2rem", color: "success" }}
            // style={{ backgroundColor: "warning", width: "5rem", 
            //   position: "relative",  top: "0%", right: "0%", transform: "translate(50%, -125%)", zIndex: 9999 }}
          /> */}
      </summary>
      {renderTree(ovsTree)}
    </details>

  return (
    <>
      <hr className="my-0"/>
        {/* Render the top containers of this modelview */}
        <div className=" m-1" style={{ backgroundColor: "lightyellow" }}> 
          {topGroupOvsDiv}
        </div>
    </>
  );
});

  const basicTask1 = `

1.  1 - From the Palette (left pane) drag the Object Type and drop it into the modelling area. Give the type a name and description. (canvas).
<a href="images/help/Create-EntityType-2023-10-05.png" target="_blank"><code style="color: blue"> <font size="2" weight="bold">![image001](images/help/Create-EntityType-2023-10-05.png)</font></code>
</span>Click on the picture to open in New Tab!</a><hr />

1.  2 - Click on the name to edit and give the Object a new name.<hr />

1.  3 - Right-Click or Double-Click on the object to open the properties panel, where you can edit: Name, description etc.
<a href="images/help/Edit-Attributes-2023-10-05.png" target="_blank"><code style="color: blue"> <font size="2" weight="bold">![image001](images/help/Edit-Attributes-2023-10-05.png)</font></code>
</span>Click on the picture to open in New Tab!</a><hr />

  `;
  const basicTask2= `

1.  1 - Click on the edge of an Object and drag the cursor to another object.
<a href="images/help/Add-Property-2023-10-05.png" target="_blank"><code style="color: blue"> <font size="2" weight="bold">![image001](images/help/Add-Property-2023-10-05.png)</font></code>
</span>Click on the picture to open in New Tab...</a><hr />

1.  2 - Click on the name of the Relationship to edit.<hr />

1.  3 - Right-Click on the relationship to open the properties panel, where you can edit Name, description etc.<hr />

  `;
  const basicTask3 = `

1.  1 - Open the Object panel to the left. Drag one 
      or more objects into the canvas.<hr />
      


1.  (Note: if you change name or other properties 
      of the object, all other objectviews of the 
      same object will also be changed)<hr />
      
  `;
  const basicTask4 = `

  ##### Naming conventions for Models and Metamodels

  ###### Models

    -Concept models:  modelname_CM
    -Type-Definitions: modelname_TD
    -Solution models: modelname_SM

  ##### Metamodels

    -metamodelname_MM
<hr />
  
  ### Type-Definitions_TD Model

  To make a new Metamodel, we need to define the Object- and Relationship types we want to be in the Metamodel.
  
  In order to create these types, we use the EntityType and RelshipType from the 
  ##### AKM-CORE_MM Metamodel
  
  ![image001](images/posts/CustomMeta/Picture1.png)
  
  
  More info : 
  <a href="http://localhost:3000/helpblog/002-BuildCustomMetamodels#AKMM%20Help" target="_blank"><code style="color: blue"> <font size="2" weight="bold"> How to make Custom Metamodels...</font></code>
  </span></a> <hr />
  `;

  const genTasksHeaderDiv  =  
    <>
        <div className="tasklist p-1 "
          style={{  width: "26rem"}} 
          ref={containerRef}
          >
        {(props.asPage)
          ? <></>
          : 
          <div className="header m-0 p-0 "
            style={{ backgroundColor: "lightyellow", position: "relative", height: "100%", top: "44%", right: "1%", transform: "translate(-1%, -5%)", zIndex: 9999 }}
            >
              <div className="buttons position-relative me-3 float-end" style={{ scale: "0.9"}}>
                <button 
                  className="btn text-success mt-0 pe-2 py-0 btn-sm"
                  data-toggle="tooltip" data-placement="top" data-bs-html="true"
                  title="Open Modal with current task!"
                  onClick={handleShowModal} 
                  style={{ backgroundColor: "lightyellow"}} >
                  ✵
                </button> 
                <button 
                  className="btn text-success mt-0 pe-2 py-0 btn-sm"
                  data-toggle="tooltip" data-placement="top" data-bs-html="true"
                  title="Open Modal with current task!"
                  onClick={handleNewWindow} 
                  style={{ backgroundColor: "lightyellow"}} >
                  ✵
                </button> 
                <button 
                  className="btn text-success me-0 px-1 py-0 btn-sm" 
                  data-toggle="tooltip" data-placement="top" data-bs-html="true"
                  title="Close Task pane!"
                  onClick={handleMinimize} 
                  style={{ backgroundColor: "lightyellow"}}>-&gt;</button>
                {/* <button onClick={handleMaximize}>+</button> */}
              </div>
              <div className="ps-2 text-success font-weight-bold fs-6" >Modelling Guide with suggested Tasks</div>
            </div>
        }
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
              <summary className="bg-light px-1"> Default Modelling Tasks:(See also Help in top menu)</summary>
                <details className="mx-2" style={{ whiteSpace: "wrap" }}>
                  <summary>Create a new Object:</summary>
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>{basicTask1}</ReactMarkdown>
                </details>
                <hr className="m-0" />
                <details className="mx-2">
                  <summary>Create a new Relationship:</summary>
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>{basicTask2}</ReactMarkdown>
                </details>
                <hr className="m-0" />
                <details className="mx-2">
                  <summary>Make a new Objectview of existing object</summary>
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>{basicTask3}</ReactMarkdown>
                </details>
                <hr className="m-0 pt-1 bg-warning" />
                <details className="mx-2">
                  <summary>Build custom Metamodels in AKMM</summary>
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>{basicTask4}</ReactMarkdown>
                </details>
              </details>
            <hr className="my-1 pt-1 bg-success" />
          </div>
        </div>
    </>
  ;

  return (
    <>

      {genTasksHeaderDiv}
      <div className="bg-light p-1"> Generated Tasks from: <span className="bg-transparent px-1 text-success"> {mothermodel?.name}</span> </div>
      {genTasksDiv}

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
