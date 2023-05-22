// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
// import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
// import classnames from 'classnames';
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
// import { setGojsModelObjects } from "../actions/actions";
// import Selector from './utils/Selector'
import genRoleTasks from "./utils/SetRoleTaskFilter";
// import { KnownTypeNamesRule } from "graphql";
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

  const prevDeps = useRef({ role: null, task: null, modellingtasks: null, types: null });

  const [visiblePalette, setVisiblePalette] = useState(true)
  const [refreshPalette, setRefreshPalette] = useState(true)
  const [refresh, setRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState('1');
  const [filteredOtNodeDataArray, setFilteredOtNodeDataArray] = useState([])
  const [filteredNewtypesNodeDataArray, setFilteredNewtypesNodeDataArray] = useState([])
  const [modellingtasks, setModellingtasks] = useState([])
  const [role, setRole] = useState('')
  const [task, setTask] = useState('')
  const [types, setTypes] = useState([])


  if (debug) console.log('43 Palette', role, task, types, tasks, modellingtasks)

  let focusModel = props.phFocus?.focusModel
  const models = props.metis?.models
  const metamodels = props.metis?.metamodels
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const mmodel = metamodels?.find((m: any) => m?.id === model?.metamodelRef)
  if (debug) console.log('47', props, mmodel?.name, model?.metamodelRef);



  // const gojsmodel = (props.myGoModel?.nodes) ? {nodeDataArray: props.myGoModel?.nodes, linkDataArray: props.myGoModel?.links} : [];
  const gojsmetamodel = props.gojsMetaModel //(props.myGoMetamodel?.nodes) ? {nodeDataArray: props.myGoMetamodel?.nodes, linkDataArray: props.myGoMetamodel?.links} : [];
  if (debug) console.log('50 Palette start', gojsmetamodel, props)


  // hardcoded for now
  let tasks = []

  let focusTask = props.phFocus?.focusTask
  // let seltasks = props.phFocus?.focusRole?.tasks || []
  // if (debug) console.log('52 seltasks', props.phFocus.focusRole, props.phFocus.focusRole?.tasks, seltasks)

  function toggleRefresh() { setRefresh(!refresh); }

  // const toggleTab = (tab: React.SetStateAction<string>) => { 
  //   if (activeTab !== tab)  setActiveTab(tab); 
  //   // setOfilter('All')
  //   const timer = setTimeout(() => {
  //     toggleRefreshPalette() 
  //   }, 100);
  //   return () => clearTimeout(timer);
  // }

  function togglePalette() { setVisiblePalette(!visiblePalette); }
  function toggleRefreshPalette() { setRefreshPalette(!refreshPalette); }

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
    if (debug) console.log('73 taskNodeDataArray', taskNodeDataArray0)
  }

  const IRTVPOPSTask = { id: 'AKM-IRTV-POPS_MM', name: 'AKM-IRTV-POPS_MM' }
  const newTask = { id: 'New-types', name: 'New-types' }
  const propsTask = { id: 'Property', name: 'Property Modelling' }
  const allTask = { id: 'All-types', name: 'All-types' }
  const irtvpopsmm = metamodels?.find((m: any) => m?.name === 'AKM-IRTV-POPS_MM')
  const irtvpopsarr = irtvpopsmm?.nodeDataArray

  if (debug) console.log('101 Palette', role, task, modellingtasks, types, tasks);

  const buildFilter = (role, task, modellingtasks, types, mmodel) => {
    const newTypes = findCurRoleTaskTypes(role, task, modellingtasks, types, mmodel, dispatch);
    const irtvpopstypes = findCurRoleTaskTypes(role, IRTVPOPSTask, modellingtasks, types, mmodel, dispatch);
    const allTypes = findCurRoleTaskTypes(role, allTask, modellingtasks, types, mmodel, dispatch);

    if (debug) console.log('117 Palette useEffect 1', newTypes);
    const foundIrtvPopsTypes = findCurRoleTaskTypes(role, task, irtvpopstypes, types, mmodel, dispatch);

    if (props.modelType === 'metamodel') {
      return buildFilterOtNodeDataArray(mmodel?.nodeDataArray, mmodel);
    } else if (mmodel?.name === 'AKM-IRTV-POPS_MM') {
      if (debug) console.log('124 Palette useEffect 1', foundIrtvPopsTypes);
      return buildFilterOtNodeDataArray(foundIrtvPopsTypes?.types, mmodel);
    } else {
      if (debug) console.log('127 Palette useEffect 1', newTypes);
      return buildFilterOtNodeDataArray(newTypes?.types, mmodel);
    }
  };

  useEffect(() => {
    setRole(props.phFocus?.focusRole);
    setTask(props.phFocus?.focusTask);
    setModellingtasks(props.phFocus?.focusRole?.tasks);
    setTypes(props.phFocus.focusRole?.tasks[0].workOnTypes); // ???

    const filteredNodeDataArraynew = buildFilter(role, task, modellingtasks, types, mmodel);
    const filteredNodeDataArrayot = buildFilter(role, IRTVPOPSTask, modellingtasks, types, irtvpopsmm);
    // const filteredNodeDataArrayotprops = buildFilter(role, propsTask, modellingtasks, types, irtvpopsmm);

    (filteredNodeDataArraynew?.length > 1) ? setFilteredNewtypesNodeDataArray(filteredNodeDataArraynew) : setFilteredNewtypesNodeDataArray(filteredNodeDataArrayot);
    setFilteredOtNodeDataArray(filteredNodeDataArrayot);

    // const filteredNodeDataArray = buildFilter(role, 'Property', modellingtasks, types, irtvpopsmm, dispatch, ndarr, debug);
    //  (filteredNodeDataArraynew.length === 1 ) && setFilteredOtNodeDataArray(filteredNodeDataArray);

    const timer = setTimeout(() => {
      if (debug) console.log('140 Palette useEffect 1 []', setFilteredOtNodeDataArray(filteredNodeDataArrayot), filteredNodeDataArrayot);
      setRefreshPalette(!refreshPalette); // set current palette according to selected modellingtask
      if (debug) console.log('143 Palette useEffect 1 []', filteredNewtypesNodeDataArray, filteredOtNodeDataArray);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!metamodels) return null;

  const buildFilterOtNodeDataArray = (types, mmodel) => {
    if (debug) console.log('151 ', types, mmodel);

    const curMyMetamodel = props.myMetis?.findMetamodel(mmodel?.id)
    const curPalette = uib.buildGoPalette(curMyMetamodel, props.myMetis);

    if (debug) console.log('151 ', types, curPalette?.nodes);

    if (types?.length > 0) {
      const otsArr = types.map(wot =>
        curPalette?.nodes.find(i => {
          if (debug) console.log('156 ', i?.name, wot, i?.name === wot);
          return i?.name === wot && i;
        })
      ).filter(Boolean);
      if (debug) console.log('160 ', otsArr);
      return otsArr
    } else { return ndarr }
  };

  const findCurRoleTaskTypes = (crole, ctask, ctasks, ctypes, cmetmodel, dispatch) => {
    if (debug) console.log('166 Palette findCurRoleTaskTypes ', crole, ctask, ctasks, ctypes, cmetmodel);
    if (props.modelType === 'metamodel') {
      setTask({ id: 'Metamodelling', name: 'Metamodelling' });
    }

    if (debug) console.log('171 Palette ', crole, ctask, ctasks, ctypes);
    const foundRTTs = genRoleTasks(crole, ctask, ctasks, ctypes, cmetmodel, dispatch);
    if (debug) console.log('172 Palette ', foundRTTs);

    if (debug) {
      // clog('123 Palette ', foundRTTs, foundRTTs.filterRole, foundRTTs.filterTask, foundRTTs.filterTasks, foundRTTs.filterTypes);
      console.log('177  Palette findCurRoleTaskTypes ', crole, ctask, ctasks, ctypes, modellingtasks, foundRTTs);
    }

    if (debug) console.log('180 Palette findCurRoleTaskTypes ', modellingtasks);

    return {
      role: foundRTTs?.currole,
      task: foundRTTs?.curtask,
      tasks: foundRTTs?.curtasks,
      types: foundRTTs?.curtypes,
    };
  };

  if (debug) console.log('211 Palette useEffect 2', props.phFocus.focusTask.workOnTypes);

  function getModellingTask(selectedIndex) {
    if (debug) console.log('214 Palette setModellingTask', selectedIndex);
    const taskObj = modellingtasks[selectedIndex];
    if (debug) console.log('200 Palette setModellingTask', taskObj);
    setTask(taskObj);
    const task1 = { id: taskObj?.id, name: taskObj?.name };
    console.log('201 Palette setModellingTask', task1);
    const irtvpopsMyMetamodel = props.myMetis?.findMetamodel(irtvpopsmm?.id)
    const irtvpopsPalette = uib.buildGoPalette(irtvpopsMyMetamodel, props.myMetis);

    const foundRTTs = findCurRoleTaskTypes(role, task1, tasks, types, irtvpopsmm, dispatch);


    console.log('210 getModellingTask foundRTTs:', foundRTTs);
    console.log('211 getModellingTask foundRTTs.types:', foundRTTs.types);

    // buildFilterOtNodeDataArray(foundRTTs?.types, irtvpopsPalette);
    // setFilteredOtNodeDataArray(buildFilterOtNodeDataArray(foundRTTs?.types, irtvpopsPalette));

    const filteredNodeDataArray = buildFilter(role, taskObj, modellingtasks, types, irtvpopsmm, dispatch, ndarr, debug);
    setFilteredOtNodeDataArray(filteredNodeDataArray);
    const timer = setTimeout(() => {
      setRefreshPalette(!refreshPalette);
      console.log('233 Palette setModellingTask', foundRTTs?.types, modellingtasks, types);
    }, 500);
    return () => { clearTimeout(timer); };
  }

  if (debug) console.log('238 filteredOtNodeDataArray', filteredOtNodeDataArray, ndarr)

  if (debug) console.log('236 Palette', props.phFocus?.focusRole, 'tasks:', props.phFocus?.focusRole?.tasks, 'task: ', props.phFocus?.focusTask, 'modellingtasks', modellingtasks, 'types', types, 'filteredOtNodeDataArray', filteredOtNodeDataArray);

  const otDiv = (
    <>
      <label className='label-field px-1'>Modelling tasks:</label>
      <select
        className='select-field mx-1 text-secondary'
        style={{ width: "96%" }}
        value={modellingtasks?.findIndex(t => t.id === task.id)}
        onChange={(e) => getModellingTask(e.target.value)}
      >
        {/* <option value="" key="-1" disabled hidden> */}
        <option value="" key="-1" >
          Select Modellingtask
        </option>
        {modellingtasks?.map((t, i) => (
          <option key={i} value={i}>
            {t?.name}
          </option>
        ))}
      </select>
    </>
  );

  const gojsappPaletteDiv = (mmodel) &&
    <>
      {/* <Tabs onSelect={index => setActiveTab(index)} > */}
      {/* <TabList style={{  margin: '0px' }}> */}
      {/* <Tab>{(activeTab !== 1)? 'MM1' : '1'} </Tab> */}
      {/* <Tab style={{  margin: '0px' }}>Metamodel</Tab> */}

      {/* <Tab>{(activeTab !== 2)? 'MM2' : '2'}</Tab> */}
      {/* <Tab>MM2</Tab> */}
      {/* </TabList> */}
      {/* <TabPanel className='pt-1 border border-white bg-light' > */}
      {/* {(filteredNewtypesNodeDataArray?.length > 0 )  */}
      <div className="metamodel-pad mt-0 p-1  bg-white" style={{ height: "39vh" }}>
        <div className="mmname mx-0 px-1 my-0" style={{ fontSize: "16px", backgroundColor: "#8bc", minWidth: "184px", maxWidth: "212px" }}>{mmodel.name}</div>
        <div className="modellingtask bg-light w-100" >
          {/* {otDiv} */}
        </div>
        {/* filteredNewtypesNodeDataArray */}
        <GoJSPaletteApp
          nodeDataArray={filteredNewtypesNodeDataArray}
          linkDataArray={[]}
          metis={props.metis}
          myMetis={props.myMetis}
          myGoModel={props.myGoModel}
          phFocus={props.phFocus}
          dispatch={props.dispatch}
          diagramStyle={{ height: "36vh" }}
        />
      </div>
      {/*   : <div className="metamodel-pad mt-0 p-1 pt-0 bg-white" style={{height: "0vh"}}></div> 
          } */}
      {/* { (filteredOtNodeDataArray?.length > 0 ) */}
      <div className="metamodel-pad mt-1 p-1 pt-1 bg-white" style={(filteredNewtypesNodeDataArray?.length === 0) ? { height: "80vh" } : { height: "45vh" }} >
        <div className="mmname mx-0 px-1 my-0" style={{ fontSize: "16px", backgroundColor: "#8bc", minWidth: "184px", maxWidth: "212px" }}>{(filteredOtNodeDataArray.length === 1) ? 'Basic Object' : IRTVPOPSTask.name}</div>
        <div className="modellingtask bg-light w-100" >
          {otDiv}
        </div>
        {/* filteredOtNodeDataArray */}
        <GoJSPaletteApp
          nodeDataArray={filteredOtNodeDataArray}
          linkDataArray={[]}
          myMetis={props.myMetis}
          metis={props.metis}
          myGoModel={props.myGoModel}
          phFocus={props.phFocus}
          dispatch={props.dispatch}
          diagramStyle={{ height: "39vh" }}
        // diagramStyle={(filteredNewtypesNodeDataArray?.length === 0) ? {height: "75vh"} : {height: "40vh"}}
        />
      </div>
      {/* : <div className="metamodel-pad mt-0 p-1 pt-0 bg-light" style={{height: "82vh"}}></div> 
          } */}
      {/* </TabPanel> */}
      {/* </Tabs>    */}
    </>

  const palette = // this is the left pane with the palette and toggle for refreshing
    <>
      <button className="btn-sm " style={{ backgroundColor: "#8bc", outline: "0", borderStyle: "none" }}
        onClick={togglePalette}> {visiblePalette ? <span> &lt;- Palette: Src Metamodel</span> : <span> -&gt;</span>}
      </button>

      {/* <span>{props.focusMetamodel?.name}</span> */}
      <div>
        {/* <div style={{ minWidth: "140px" }}> */}

        {visiblePalette
          ? (refreshPalette)
            ? <>{gojsappPaletteDiv}</> // these two lines needs to be different to refresh the palette
            : <><div className="btn-horizontal bg-light mx-0 px-0 mb-0" style={{ fontSize: "11px", minWidth: "166px", maxWidth: "160px" }}></div>{gojsappPaletteDiv}</>
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



