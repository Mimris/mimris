import { useSelector } from 'react-redux';
import { useState } from 'react';
import Selector from './utils/Selector';
import ReactMarkdown from 'react-markdown';

function Tasks() {
  const state = useSelector((state: any) => state);
  const [selectedTask, setSelectedTask] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

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
  const seltasks = uniqueovs?.filter(ov => type(metamodels, mothermodel, motherobjects, ov) === 'Task');
  const tasksDiv = seltasks?.map(t => (
    <li key={t.id} className="li bg-light" onClick={() => setSelectedTask(t)}>
      {t.name} {t.description}
    </li>
  ));

  const taskobj = motherobjects?.find(o => o.id === (taskmodelview.objectviews.find(ov => ov.id === focusTask?.id)?.objectRef));
  console.log('40 Tasks', curmodel.metamodelRef, metamodels, curmetamodel.generatedFromModelRef, mothermodel, taskobj, models);

  const handleMinimize = () => {
    setMinimized(true);
    setMaximized(false);
  };

  // const handleMaximize = () => {
  //   setMinimized(false);
  //   setMaximized(true);
  // };

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

  // if (maximized) {
  //   return (
  //     <div className="maximized-task">
  //         <h2 className="mr-auto">{focusTask?.name}</h2>
  //         <div className="buttons flex-d align-items-end ml-auto">
  //           <button onClick={handleMinimize}>-&gt;</button>
  //           {/* <button onClick={handleRestore}>+</button> */}
  //         </div>
  //       <div className="content">
  //         <ReactMarkdown>{taskobj?.description}</ReactMarkdown>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="tasklist">
      {/* <ul>{tasksDiv}</ul> */}
      <div className="header">
        <div>Modelling Tasks</div>
        <div className="buttons">
              <button onClick={handleMinimize}>-&gt;</button>
              {/* <button onClick={handleMaximize}>+</button> */}
        </div>
      </div>
      <div className="">
          <div>Role: {focusRole.name}</div><div> Task: {focusTask.name}</div>
      </div>
      <Selector key='Tasks1' type='SET_FOCUS_TASK' selArray={seltasks} selName='Tasks' focustype='focusTask' />
      {focusTask && (
        <div className="selected-task bg-light">
          <ReactMarkdown>{taskobj?.description}</ReactMarkdown>
        </div>
      )}
      <style jsx>{`
        .taskarea {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;

          overflow: auto;
          padding: 0;
          margin: 0;
        }
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