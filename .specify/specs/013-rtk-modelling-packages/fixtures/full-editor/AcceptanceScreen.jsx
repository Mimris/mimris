// Temporary acceptance app: copy this file to the root of an isolated Mimris checkout.
import React, {useEffect, useRef, useState} from 'react';
import {configureStore} from '@reduxjs/toolkit';
import {universeReducer, openLegacyUniverseSnapshot, selectMimrisCompatibilityProps, bindLegacyUniverseDispatch} from '@mimris/modelling-core';
import {bindEditorHost, hydrateEditorRuntime} from '@mimris/modelling-editor';
import {createModellingCanvas} from '@mimris/modelling-editor/canvas';
import {standaloneCanvasHostServices} from './src/editorHost/canvasServices';
import {standaloneCanvasHostComponents} from './src/editorHost/canvasComponents';
import GenGojsModel from './src/components/GenGojsModel';
import initial from './src/modelProjects/Basic/INIT-Startup_Project.json';

function fresh(label) {
  const snapshot = structuredClone(initial), model = snapshot.phData.metis.models[0], view = model.modelviews[0];
  const container = view.objectviews.find(item => item.isGroup), car = view.objectviews.find(item => item.name === 'Car');
  container.name = label + ' container'; container.loc = '350 150'; container.size = '450 280';
  container.template = 'groupWithPorts';
  container.grabIsAllowed = true; container.group = ''; container.isExpanded = true; container.unknownAcceptance = 'keep';
  car.loc = '40 80'; car.group = ''; car.unknownAcceptance = 'keep';
  view.objectviews = [container, car]; view.relshipviews = [];
  snapshot.phFocus = {...snapshot.phFocus, focusModel: {id:model.id}, focusModelview:{id:view.id}, focusTab:'model'};
  return snapshot;
}
const project = state => selectMimrisCompatibilityProps({universe:state.modelling});
const ProbeContext = React.createContext(null);
function ProbeDiagram(props) {
  const onProbe = React.useContext(ProbeContext);
  const ref = useRef(null);
  const movement = useRef(null);
  useEffect(() => {
    let watchedDiagram = null;
    const onMoved = event => { movement.current = {shift:event.diagram.lastInput.shift, time:Date.now()}; };
    const timer = setInterval(() => {
      const diagram = ref.current?.diagramRef?.current?.getDiagram();
      if (!diagram) return;
      if (watchedDiagram !== diagram) { watchedDiagram?.removeDiagramListener('SelectionMoved',onMoved); watchedDiagram=diagram; diagram.addDiagramListener('SelectionMoved',onMoved); }
      const rows = [];
      diagram.nodes.each(node => rows.push({key:node.key, name:node.data?.name, loc:`${node.location.x} ${node.location.y}`, group:node.containingGroup?.key || '', expanded:node.isSubGraphExpanded, visible:node.visible,movable:node.movable,canMove:node.canMove(),readOnly:diagram.isReadOnly,dragEnabled:diagram.toolManager.draggingTool.isEnabled,lastMove:movement.current}));
      onProbe?.(rows);
    }, 250);
    return () => { clearInterval(timer); watchedDiagram?.removeDiagramListener('SelectionMoved',onMoved); };
  }, [onProbe]);
  const Diagram = standaloneCanvasHostComponents.DiagramWrapper;
  return <Diagram {...props} ref={ref}/>;
}
const Canvas = createModellingCanvas({services:standaloneCanvasHostServices, components:{...standaloneCanvasHostComponents, DiagramWrapper:ProbeDiagram}, isAutomaticallyDroppedSelfRelationship:()=>false});
const StableCanvas = React.memo(Canvas);
const diagramStyle = {height:'460px'};
function Editor({label}) {
  const [snapshot,setSnapshot] = useState(()=>fresh(label)), [session,setSession] = useState(null), [rows,setRows] = useState([]), [state,setState] = useState(null), [message,setMessage] = useState('Ready');
  const probe = React.useCallback(next => setRows(old => JSON.stringify(old)===JSON.stringify(next) ? old : next), []);
  useEffect(() => {
    let disposed = false;
    const store = configureStore({reducer:{modelling:universeReducer, hostOwned:(value={label})=>value}});
    store.dispatch(openLegacyUniverseSnapshot(snapshot));
    const dispatch = bindLegacyUniverseDispatch(store.dispatch);
    const runtime = new standaloneCanvasHostServices.akm.cxMetis();
    const release = bindEditorHost(runtime,{getState:()=>project(store.getState()),dispatch});
    hydrateEditorRuntime(runtime, project(store.getState()).phData.metis, true);
    const unsubscribe=store.subscribe(()=>setState(store.getState()));
    setState(store.getState());
    GenGojsModel(project(store.getState()),runtime,{skipImport:true}).then(()=>{
      if (disposed) return;
      runtime.modelType='Modelling';
      setSession({store,dispatch,runtime,nodes:runtime.gojsModel.nodes,links:runtime.gojsModel.links,focus:project(store.getState()).phFocus,metis:project(store.getState()).phData.metis});
    });
    return ()=>{disposed=true;unsubscribe();release();setSession(null);};
  },[snapshot,label]);
  const view = state?.modelling?.world?.worldModel?.metis?.models?.[0]?.modelviews?.[0];
  return <section style={{border:'1px solid #777',padding:8,marginBottom:12}}>
    <h2>Full editor {label}</h2>
    <button onClick={()=>{localStorage.setItem('acceptance-'+label,JSON.stringify(project(session.store.getState())));setMessage('Saved '+label);}}>Save {label}</button>{' '}
    <button onClick={()=>{const saved=localStorage.getItem('acceptance-'+label);if(saved){const restored=JSON.parse(saved); restored.phFocus={...restored.phFocus,focusRefresh:{id:'reload-'+Date.now()}}; setSnapshot(restored);setMessage('Reloaded '+label);}}}>Reload {label}</button>
    <div>{message}</div>
    <pre style={{whiteSpace:"pre-wrap",fontSize:10}} data-testid={'saved-'+label}>{JSON.stringify(view?.objectviews?.map(item=>({id:item.id,name:item.name,loc:item.loc,group:item.group,unknown:item.unknownAcceptance})))}</pre>
    <pre style={{whiteSpace:"pre-wrap",fontSize:10}} data-testid={'live-'+label}>{JSON.stringify(rows)}</pre>
    {session && <ProbeContext.Provider value={probe}><StableCanvas key={snapshot===initial?'initial':JSON.stringify(snapshot.phFocus)} nodeDataArray={session.nodes} linkDataArray={session.links} metis={session.metis} myMetis={session.runtime} phFocus={session.focus} dispatch={session.dispatch} modelType="Modelling" diagramStyle={diagramStyle} onProbe={probe}/></ProbeContext.Provider>}
  </section>;
}
export default function AcceptanceScreen(){return <main style={{padding:12}}><h1>Full modelling editor acceptance</h1><p>Separate host stores, identical saved IDs. Live membership and saved fields are visible below.</p><Editor label="A"/><Editor label="B"/></main>;}
