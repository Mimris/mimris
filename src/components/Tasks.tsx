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

  const curmodel = models?.find(m => m?.id === focusModel?.id);
  const curmetamodel = metamodels?.find(m => m?.id === curmodel?.metamodelRef);
  // const mothermodel = models?.find(m => m?.name.endsWith('_TD'));
  // set mothermodel to generatedRef in cur metamodel
  const mothermodel = models?.find(m => m?.id === curmetamodel?.generatedFromModelRef);
  const mothermodelviews = mothermodel?.modelviews;
  const modelviews = curmodel?.modelviews;
  const motherobjects = mothermodel?.objects;
  const taskmodelview = mothermodelviews?.find(mv => mv.name === '01-HealthRecords');
  const objectviews2 = taskmodelview?.objectviews;
  const objectviews = modelviews?.find(mv => mv.id === focusModelview?.id)?.objectviews;
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

  const handleMaximize = () => {
    setMinimized(false);
    setMaximized(true);
  };

  const handleRestore = () => {
    setMinimized(false);
    setMaximized(false);
  };

  if (minimized) {
    return (
      <div className="minimized-task" onClick={handleRestore}>
        <h2>{focusTask?.name}</h2>
      </div>
    );
  }

  if (maximized) {
    return (
      <div className="maximized-task">
        <div className="header">
          <h2>{focusTask?.name}</h2>
          <div className="buttons">
            <button onClick={handleMinimize}>-</button>
            <button onClick={handleRestore}>+</button>
          </div>
        </div>
        <div className="content">
          <ReactMarkdown>{taskobj?.description}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="tasklist">
      <ul>{tasksDiv}</ul>
      <Selector key='Tasks1' type='SET_FOCUS_TASK' selArray={seltasks} selName='Tasks' focustype='focusTask' /><br />
      {focusTask && (
        <div className="selected-task">
          <div className="header">
            <h2>{focusTask.name}</h2>
            <div className="buttons">
              <button onClick={handleMinimize}>-</button>
              <button onClick={handleMaximize}>+</button>
            </div>
          </div>
          <ReactMarkdown>{taskobj?.description}</ReactMarkdown>
        </div>
      )}
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
        .buttons {
          display: flex;
          gap: 5px;
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