// @ts-nocheck
import React, { useState , useEffect, useRef } from "react";
import { useDispatch } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
// import { setGojsModelObjects } from "../actions/actions";
import Selector from './utils/Selector'
import genRoleTasks from "./utils/SetRoleTaskFilter";
import { KnownTypeNamesRule } from "graphql";
// import { setMyMetisParameter } from "../actions/actions";

import * as uib from '../akmm/ui_buildmodels';
import { gojs } from "../akmm/constants";

const debug = false;

const clog = console.log.bind(console, '%c %s',
    'background: blue; color: white');
const useEfflog = console.log.bind(console, '%c %s', // green colored cosole log
    'background: red; color: white');
const ctrace = console.trace.bind(console, '%c %s',
    'background: blue; color: white');

const Palette = (props: any) => {

  if (debug) clog('22 Palette', props);

  const dispatch = useDispatch();
  let isRendered = useRef(false);

  const [visiblePalette, setVisiblePalette] = useState(true)
  const [refreshPalette, setRefreshPalette] = useState(true)
  const [refresh, setRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState('1');
  const [filteredOtNodeDataArray, setFilteredOtNodeDataArray] = useState([])
  const [filteredNewtypesNodeDataArray, setFilteredNewtypesNodeDataArray] = useState([])
  const [modellingtasks, setModellingtasks] = useState(null)
  const [types, setTypes] = useState([])
  const [role, setRole] = useState(null)
  const [task, setTask] = useState(null)


  if (debug) console.log('43 Palette', role, task, types, tasks, modellingtasks)

  let focusModel = props.phFocus?.focusModel
  const models = props.metis?.models
  const metamodels = props.metis?.metamodels
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const mmodel = metamodels?.find((m: any) => m?.id === model?.metamodelRef)
  if (debug) console.log('47', props, mmodel?.name, model?.metamodelRef);

  // const gojsmodel = (props.myGoModel?.nodes) ? {nodeDataArray: props.myGoModel?.nodes, linkDataArray: props.myGoModel?.links} : [];
  const gojsmetamodel =  props.gojsMetaModel //(props.myGoMetamodel?.nodes) ? {nodeDataArray: props.myGoMetamodel?.nodes, linkDataArray: props.myGoMetamodel?.links} : [];
  if (debug) console.log('50 Palette start', gojsmetamodel, props)
  const gojsmodel = props.gojsModel;
  
  // hardcoded for now
  let tasks = []

  let focusTask = props.phFocus?.focusTask
  let seltasks = props.phFocus?.focusRole?.tasks || []
  if (debug) console.log('52 seltasks', props.phFocus.focusRole, props.phFocus.focusRole?.tasks, seltasks)
  
  function toggleRefresh() { setRefresh(!refresh); } 
  
  const toggleTab = (tab: React.SetStateAction<string>) => { 
    if (activeTab !== tab)  setActiveTab(tab); 
    // setOfilter('All')
    const timer = setTimeout(() => {
      toggleRefreshPalette() 
    }, 100);
    return () => clearTimeout(timer);
  }

  function togglePalette() { setVisiblePalette(!visiblePalette); } 
  function toggleRefreshPalette() { setRefreshPalette(!refreshPalette);}
  
  let ndarr = props.gojsMetamodel?.nodeDataArray // error first render???
  let ndarr1 = props.gojsMetaModel?.nodeDataArray // error first render???

  // let ndarr = gojsmetamodel?.nodeDataArray // error first render???
  if (debug) console.log('65 Palette', model?.name, mmodel?.name, ndarr);
  let taskNodeDataArray: any[] = ndarr

  if (focusTask) {
    const taskNodeDataArray0 = props.phFocus.focusTask?.workOnTypes?.map((wot: any) => 
      ndarr?.find((i: { typename: any; }) => {
        return (i?.name === wot) && i 
      })
    ).filter(Boolean)
    taskNodeDataArray = taskNodeDataArray0 || []
    if (debug) console.log('73 taskNodeDataArray',  taskNodeDataArray0)
  } 

  useEffect(() => {
    if ((props.modelType !== 'metamodel') && ndarr) {
      if (!debug) console.log('98 Palette useEffect 1', role, task, tasks, types);
      const foundRTTs = findCurRoleTaskTypes(role, task, tasks, types, mmodel, dispatch)
      const IRTVPOPSTask = { id: 'AKM-IRTV-POPS_MM', name: 'AKM-IRTV-POPS_MM'}
      const newTypes = findCurRoleTaskTypes(role, IRTVPOPSTask, tasks, types, mmodel, dispatch)
      if (!debug) console.log('103 Palette useEffect 1', newTypes, foundRTTs);
      const timer = setTimeout(() => {
        setFilteredOtNodeDataArray(buildFilterOtNodeDataArray(foundRTTs?.types, ndarr))
        setFilteredNewtypesNodeDataArray(buildFilterOtNodeDataArray(newTypes?.types, ndarr))

        if (!debug) console.log('108 Palette useEffect 1 []', foundRTTs?.types, newTypes);
      }, 1000);
      return () => { isRendered = false;  clearTimeout(timer); }
    }
  }, [])

  useEffect(() => {
    buildFilterOtNodeDataArray(types, ndarr)
    if (debug) console.log('111 Palette useEffect 2 [types]', types, ndarr)
    const timer = setTimeout(() => {
      setFilteredOtNodeDataArray(buildFilterOtNodeDataArray(types, ndarr))
      // setFilteredNewtypesNodeDataArray(buildFilterOtNodeDataArray(newTypes?.types, ndarr))
      // buildFilterOtNodeDataArray(foundRTTs?.types, ndarr)
      setRefreshPalette(!refreshPalette)   // set current palette accrording to selected modellingtask
      if (debug) console.log('88 Palette useEffect 2 []', types, modellingtasks);
      }, 100);
      return () => { clearTimeout(timer); }
  }, [types?.length > 0 && ndarr?.length > 0])

 
  const myPalettes =  props.myMetis?.metamodels?.map(mm =>  {
    if (mm.name === 'AKM-ADMIN_MM' || mm.name === 'AKM-IRTV-POPS_MM')  return null
      const palette = uib.buildGoPalette(mm, props.myMetis);  
      if (!debug) console.log('144 palette', palette); 
      return palette; // or any other condition you want to use
  }).filter(Boolean);
  
  if (debug) (myPalettes) && console.log('147 Palette', myPalettes[0]);
  let myPaletteArrays = myPalettes?.map(mp => ( {  
      nodeDataArray: mp?.nodes,
      linkDataArray: mp?.links 
  }))
  if (!debug)(myPalettes) && console.log('154 Palette', myPalettes, myPaletteArrays[0]);
  const gojsPalettes = (myPaletteArrays && (myPaletteArrays.length !== 0)) && myPaletteArrays[0]

  const IRTVPOPSPalette = props.myMetis?.metamodels?.find(mm =>  {
    (mm.name === 'AKM-IRTV-POPS_MM') &&
      uib.buildGoPalette(mm, props.myMetis);
      if (debug) console.log('153 Palette', mm);
      return {
        nodeDataArray: mm?.nodeDataArray,
        linkDataArray: mm?.linkDataArray
      }
  }); 


  const buildFilterOtNodeDataArray = (types, ndarr) => {
    if (types?.length > 0) {
      const otsArr = types.map((wot) =>
        ndarr?.find((i) => {
          if (debug) console.log('105 ', i?.name, wot, i?.name === wot);
          return i?.name === wot && i;
        })
      ).filter(Boolean);
  
      if (debug) console.log('106 ', types, otsArr, ndarr);
      return otsArr
      // setFilteredOtNodeDataArray(otsArr);
    } else {
      return ndarr
      // setFilteredOtNodeDataArray(ndarr);
    }
  };
  
  const findCurRoleTaskTypes = (role, task, tasks, types, mmodel, dispatch) => {
    if (props.modelType === 'metamodel') {
      setTask({ id: 'Metamodelling', name: 'Metamodelling' });
    }
  
    if (debug) {
      console.log('162 Palette ', task);
      console.log('163 Palette ', role, task, types, mmodel, modellingtasks);
    }
  
    const foundRTTs = genRoleTasks(role, task, tasks, types, mmodel, dispatch);
  
    if (debug) {
      clog('123 Palette ', foundRTTs, foundRTTs.filterRole, foundRTTs.filterTask, foundRTTs.filterTasks, foundRTTs.filterTypes);
      console.log('131  Palette findCurRoleTaskTypes ', task, types, modellingtasks, foundRTTs);
    }
  
    setRole(foundRTTs?.currole);
    setTask(foundRTTs?.curtask);
    setModellingtasks(foundRTTs?.curtasks);
    setTypes(foundRTTs?.curtypes);
  
    if (debug) console.log('135 Palette findCurRoleTaskTypes ', task, types, modellingtasks);
  
    return {
      role: foundRTTs?.currole,
      task: foundRTTs?.curtask,
      tasks: foundRTTs?.curtasks,
      types: foundRTTs?.curtypes,
    };
  };
  
  if (debug) console.log('139 Palette useEffect 2', props.phFocus.focusTask.workOnTypes);
  
  const otDiv = (
    <>
      <label className='label-field px-1'>Modelling tasks:</label>
      <select className='select-field mx-1 text-secondary' style={{ width: "96%" }} onChange={(e) => setModellingTask(modellingtasks[e.target.value])}>
        {modellingtasks?.map((t, i) => <option key={i} value={i}>{t?.name}</option>)}
      </select>
    </>
  );
  
  function setModellingTask(taskObj) {
    if (debug) console.log('199 Palette setModellingTask', taskObj);
  
    const task1 = { id: taskObj.id, name: taskObj.name };
  
    if (debug) console.log('156 Palette setModellingTask', task1);
  
    const foundRTTs = findCurRoleTaskTypes(role, task1, tasks, types, mmodel, dispatch);
  
    if (debug) console.log('158 Palette setModellingTask', foundRTTs.task, foundRTTs.types);
  
    setRole(foundRTTs?.role);
    setTask(foundRTTs?.task);
    setModellingtasks(foundRTTs?.tasks);
    setTypes(foundRTTs?.types);
  
    if (debug) console.log('163 Palette setModellingTask', task, types);
  
    buildFilterOtNodeDataArray(foundRTTs?.types, ndarr);
  }
  if (debug) console.log('165 filteredOtNodeDataArray', filteredOtNodeDataArray, ndarr)

  
  // ------------------   ------------------
  const mmnamediv = (mmodel) ? <span className="metamodel-name">{mmodel?.name}</span> : <span>No metamodel</span> 
  const mnamediv = (mmodel) ? <span className="metamodel-name">{model?.name}</span> : <span>No model</span> 
  seltasks = (props.phFocus.focusRole?.tasks) && props.phFocus.focusRole?.tasks?.map((t: any) => t)

  if (debug) console.log('220 Palette', props.phFocus?.focusRole,'tasks:', props.phFocus?.focusRole?.tasks, 'task: ', props.phFocus?.focusTask, 'seltasks :', seltasks);
 
  const diagramStyle = {
    height: '36vh', // Set the desired height here
  };

  const gojsappPalette =
    <>
      <Tabs onSelect={index => setActiveTab(index)} >
        <TabList style={{  margin: '0px' }}>
          {/* <Tab>{(activeTab !== 1)? 'MM1' : '1'} </Tab> */}
          <Tab>MM1</Tab>
          {/* <Tab>{(activeTab !== 2)? 'MM2' : '2'}</Tab> */}
          <Tab>MM2</Tab>
        </TabList>
        <TabPanel className='pt-1 border border-white bg-light' >
          {((filteredNewtypesNodeDataArray.length === 0) ||  (filteredNewtypesNodeDataArray === undefined) || (task?.name === 'AKM-IRTV-POPS_MM') )
            ? <div className="metamodel-pad mt-3 p-1 pt-0 bg-white" style={{height: "0vh"}}> 1</div> 
            : <div className="metamodel-pad mt-3 p-1 pt-0 bg-white" style={{height: "36vh"}}> 2
                <div className="mmname mx-0 px-1 my-0" style={{fontSize: "16px", backgroundColor: "#8bc", minWidth: "184px", maxWidth: "212px"}}>{props.myMetis?.metamodels[1]?.name}</div>
                <div className="modellingtask bg-light w-100" >
                  {(myPalettes) && (myPalettes[0]?.nodeDataArray) &&  myPalettes[0]?.nodeDataArray[0].name}
                  {otDiv}
                </div>
                <GoJSPaletteApp
                  nodeDataArray= {filteredNewtypesNodeDataArray}
                  linkDataArray={[]}
                  metis={props.metis}
                  myMetis={props.myMetis}
                  myGoModel={props.myGoModel}
                  phFocus={props.phFocus}
                  dispatch={props.dispatch}
                  diagramStyle= {{height: "34vh"}}
                />
              </div>
          }
          {(filteredOtNodeDataArray.length === 0)
            ? <div className="metamodel-pad mt-3 p-1 pt-0 bg-white" >no new types</div> 
            : <div className="metamodel-pad mt-3 p-1 pt-0 bg-white" style={{height: "44vh"}} >new types
            <div className="mmname mx-0 px-1 my-0" style={{fontSize: "16px", backgroundColor: "#8bc", minWidth: "184px", maxWidth: "212px"}}>{mmnamediv}</div>
            <div className="modellingtask bg-light w-100" >
              {otDiv}
            </div>
            <GoJSPaletteApp
              nodeDataArray={filteredOtNodeDataArray}
              linkDataArray={[]}
              myMetis={props.myMetis}
              metis={props.metis}
              myGoModel={props.myGoModel}
              phFocus={props.phFocus}
              dispatch={props.dispatch}
              diagramStyle={{height: "38vh"}}
            />
            </div> 
          }
        </TabPanel>
      </Tabs>   
    </>

   const palette = // this is the left pane with the palette and toggle for refreshing
      <> 
        <button className="btn-sm " style={{ backgroundColor: "#8bc", outline: "0", borderStyle: "none"}}
          onClick={togglePalette}> {visiblePalette ? <span> &lt;- Palette: Src Metamodel</span> : <span> -&gt;</span>} 
        </button>

        {/* <span>{props.focusMetamodel?.name}</span> */}
        <div>
        {/* <div style={{ minWidth: "140px" }}> */}

          {visiblePalette 
            ? (refreshPalette) 
              ? <>{ gojsappPalette }</> // these two lines needs to be different to refresh the palette
              : <><div className="btn-horizontal bg-light mx-0 px-0 mb-0" style={{ fontSize: "11px", minWidth: "166px", maxWidth: "160px"}}></div>{ gojsappPalette }</>
            : <div className="btn-vertical px-1 " style={{ height: "82vh", maxWidth: "4px", padding: "2px", fontSize: "12px" }}><span> P a l e t t e - S o u r c e - M e t a m o d e l</span> </div>
          } 
        </div>
      </>  
  
  if (debug) clog('265 Palette', props);
  // return  isRendered && (
  return (
    <>
      {palette} 
    </>
  )
}

export default Palette;



