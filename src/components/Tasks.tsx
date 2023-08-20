import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import Selector from './utils/Selector';
import ReactMarkdown from 'react-markdown';

function Tasks() {
  const state = useSelector((state: any) => state);
  const [selectedTask, setSelectedTask] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const dispatch = useDispatch();

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
  const taskmodelview = mothermodelviews?.find(mv => mv.name === '01-HealthRecords'); //Todo: we have to find the modelview that contains the tasks
  const objectviews = taskmodelview?.objectviews;
  const objectviews2 = mothermodelviews?.flatMap(mv => mv.objectviews);
  const uniqueovs = objectviews2?.filter((ov, index, self) =>
    index === self.findIndex(t => t.place === ov.place && t.id === ov.id)
  );

  // useEffect(() => {
  // }, []);

  console.log('40 Tasks', curmodel.metamodelRef, metamodels, curmetamodel.generatedFromModelRef, mothermodel, models);

  const seltasks = uniqueovs?.filter(ov => type(metamodels, mothermodel, motherobjects, ov) === 'Task');

  const handleMinimize = () => {
    setMinimized(true);
    setMaximized(false);
  };

  const handleRestore = () => {
    setMinimized(false);
    setMaximized(false);
  };

  if (minimized) {
    return (
      <div className="minimized-task" onClick={handleRestore}>
        {/* <h2>{focusTask?.name}</h2> */}
        <div className="buttons">
            {/* <button onClick={handleMinimize}>-</button> */}
            <button className="bg-light" onClick={handleRestore}>&lt;-</button>
          </div>
      </div>
    );
  }

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

  const tasksDiv =  (seltasks) 
    ? seltasks?.map(t => { 
      const taskobj = motherobjects?.find(o => o.id === (taskmodelview.objectviews.find(ov => ov.id === t?.id)?.objectRef));
      console.log('91 taskobj', taskobj, t);
      return (
          <li key={t.id} className="li bg-transparent" onClick={() => setSelectedTask(t)}>
            <hr className="m-0"/>
            <details >
              <summary>{t?.name}</summary>
              <button className="checkbox" onClick={() => dispatch({ type: 'SET_FOCUS_TASK', data: t })}>Set Focus: </button>
              {focusTask && (
                <div className="selected-task bg-transparent">
                  <ReactMarkdown>{taskobj?.description}</ReactMarkdown>
              </div>
            )}
            </details>
          </li>)
    })
    : <div>No generated task for this model</div>
  return (
    <div className="tasklist">
      <div className="header">
        <div>Modelling Guide with suggested Tasks</div>
        <div className="buttons">
              <button onClick={handleMinimize}>-&gt;</button>
              {/* <button onClick={handleMaximize}>+</button> */}
        </div>
      </div>
      <div className="flex-d w-100">
      <div>Role: <span className="font-weight-bold text-success bg-white p-1">{focusRole.name}</span></div>
      <div>Task: <span className="font-weight-bold text-success bg-white p-1">{focusTask.name}</span></div>
          <hr className="m-0"/>
      </div>
      {/* <Selector key='Tasks1' type='SET_FOCUS_TASK' selArray={seltasks} selName='Tasks' focustype='focusTask' /> */}
      <div className="task">
        <div className="bg-light"> Default Tasks: </div> 
        <details>
          <summary>Create a new Object:</summary>
          <ReactMarkdown>{basicTask1}</ReactMarkdown>
        </details>            
        <hr className="m-0"/>
        <details>
          <summary>Create a new Relatinship:</summary>
          <ReactMarkdown>{basicTask2}</ReactMarkdown>
        </details>            
        <hr className="m-0"/>
        <details>
          <summary>Make a new Objectview of existing object</summary>
          <ReactMarkdown>{basicTask3}</ReactMarkdown>
        </details>
        <hr className="my-2 p-0 border-light"/>
      </div>     <div className="bg-light"> Generated Tasks: </div> 
      <ul>{tasksDiv}</ul>
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

function type(metamodels, model, motherobjects, curov) {
  return metamodels?.find(mm => mm.id === model?.metamodelRef)
    ?.objecttypes?.find(ot => ot.id === motherobjects?.find(o => o.id === curov.objectRef)?.typeRef)?.name;
}

export default Tasks;