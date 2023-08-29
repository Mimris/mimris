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
import { set } from "immer/dist/internal";

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

  const prevDeps = useRef({ role: null, task: null, metamodelList: null, types: null });

  const [visiblePalette, setVisiblePalette] = useState(true)
  const [refreshPalette, setRefreshPalette] = useState(true)
  const [refresh, setRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState('1');
  const [filteredOtNodeDataArray, setFilteredOtNodeDataArray] = useState([])
  const [filteredNewtypesNodeDataArray, setFilteredNewtypesNodeDataArray] = useState([])
  // const [metamodelList, setMetamodelList] = useState([])
  const [role, setRole] = useState('')
  const [task, setTask] = useState('')
  const [types, setTypes] = useState([])


  if (debug) console.log('43 Palette', role, task, types, tasks, metamodelList)

  let focusModel = props.phFocus?.focusModel

  const models = props.metis?.models
  const metamodels = props.metis?.metamodels
  const metamodelList = metamodels.map((m: any) => ({ id: m?.id, name: m?.name }));
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const mmodel = metamodels?.find((m: any) => m?.id === model?.metamodelRef)
  if (debug) console.log('47', props, mmodel?.name, model?.metamodelRef);

  // const gojsmodel = (props.myGoModel?.nodes) ? {nodeDataArray: props.myGoModel?.nodes, linkDataArray: props.myGoModel?.links} : [];
  const gojsmetamodel = props.gojsMetaModel //(props.myGoMetamodel?.nodes) ? {nodeDataArray: props.myGoMetamodel?.nodes, linkDataArray: props.myGoMetamodel?.links} : [];
  if (debug) console.log('50 Palette start', gojsmetamodel, props)

  // hardcoded for now
  let tasks = []

  let focusTask = props.phFocus?.focusTask

  function toggleRefresh() { setRefresh(!refresh); }

  function togglePalette() { setVisiblePalette(!visiblePalette); }
  function toggleRefreshPalette() { setRefreshPalette(!refreshPalette); }

  let ndarr = props.gojsMetamodel?.nodeDataArray // error first render???
  //let ndarr1 = props.gojsMetaModel?.nodeDataArray // error first render???

  if (debug) console.log('65 Palette', model?.name, mmodel?.name, ndarr);
  let taskNodeDataArray: any[] = ndarr

  if (debug) console.log('76 Palette', role, task, metamodelList, types, tasks);

  useEffect(() => {
    const { focusRole, focusTask } = props.phFocus;
    const { objecttypes } = mmodel;
  
    setRole(focusRole);
    setTask(focusTask);
    setTypes(objecttypes.map((t: any) => t?.name));
  
    setFilteredNewtypesNodeDataArray(buildFilter(focusRole, focusTask, metamodelList, types, mmodel));  // build the palette for current metamodel
    console.log('85 Palette useEffect 1', focusRole, focusTask, metamodelList, types, mmodel);
  
    const timer = setTimeout(() => {
      setRefreshPalette(!refreshPalette);
    }, 1500);
  
    return () => clearTimeout(timer);
  // }, [props.phFocus, mmodel]);
  }, []);

  // if (!metamodels) return null;

  const buildFilter = (role, task, metamodelList, types, metamodel) => {
    if (!debug) console.log('102 Palette useEffect 1', role, task, metamodelList, types, metamodel);
    // setTypes(metamodel?.objecttypes.map((t: any) => t?.name));
      return buildFilterOtNodeDataArray(types, metamodel);
  };


  const buildFilterOtNodeDataArray = (types, mmodel) => { // build the palette for the selected metamodel
    if (!debug) console.log('108 ', types, mmodel);

    const curMyMetamodel = props.myMetis?.findMetamodel(mmodel?.id)
    const curPalette = uib.buildGoPalette(curMyMetamodel, props.myMetis);

    if (!debug) console.log('113 ', types, curMyMetamodel, curPalette?.nodes);

    if (types?.length > 0) {
      const otsArr = types.map(wot =>
        curPalette?.nodes.find(i => {
          if (debug) console.log('118 ', i?.name, wot, i?.name === wot);
          return i?.name === wot && i;
        })
      ).filter(Boolean);
      if (!debug) console.log('122 ', otsArr);
      return otsArr
    } else { return ndarr }
  };

  if (debug) console.log('127 Palette useEffect 2', props.phFocus.focusTask.workOnTypes);

  function getModellingTask(selectedIndex) { // set the modellingtask and refresh the palette
    if (debug) console.log('130 Palette setModellingTask', selectedIndex);
    const taskObj = metamodelList[selectedIndex];
    if (debug) console.log('132 Palette setModellingTask', taskObj, metamodelList);
    setTask(taskObj);
    const curmm = { id: taskObj?.id, name: taskObj?.name };
    // find the metamodel
    const curmmodel = metamodels?.find((m: any) => m?.id === curmm?.id);
    console.log('137 Palette setModellingTask', types, curmm, curmmodel);
    const thistypes = curmmodel.objecttypes.map((t: any) => t?.name);
    const filteredNodeDataArray = buildFilter(role, task, metamodelList, thistypes, curmmodel);
    console.log('140 getModellingTask :', role, task, metamodelList, thistypes, curmmodel);
    console.log('141 getModellingTask filteredNodeDataArray:', filteredNodeDataArray);
    setFilteredOtNodeDataArray(filteredNodeDataArray);
    const timer = setTimeout(() => {
      setRefreshPalette(!refreshPalette);
      console.log('145 Palette setModellingTask', metamodelList, thistypes, filteredNodeDataArray, filteredOtNodeDataArray);
    }, 200);
    return () => { clearTimeout(timer); };
  }

  if (debug) console.log('150 filteredOtNodeDataArray', filteredOtNodeDataArray, ndarr)

  if (debug) console.log('152 Palette', props.phFocus?.focusRole, 'tasks:', props.phFocus?.focusRole?.tasks, 'task: ', props.phFocus?.focusTask, 'metamodelList', metamodelList, 'types', types, 'filteredOtNodeDataArray', filteredOtNodeDataArray);

  const otDiv = (
    <>
      <label className='label-field px-1'>Modelling tasks:</label>
      <select
        className='select-field mx-1 text-secondary'
        style={{ width: "96%" }}
        value={metamodelList?.findIndex(t => t.id === task.id)}
        onChange={(e) => getModellingTask(e.target.value)}
      >
        {/* <option value="" key="-1" disabled hidden> */}
        <option value="" key="-1" >
          Select Modellingtask
        </option>
        {metamodelList?.map((t, i) => (
          <option key={i} value={i}>
            {t?.name}
          </option>
        ))}
      </select>
    </>
  );

  const gojsappPaletteDiv = (mmodel) &&
    <>
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
        <div className="mmname mx-0 px-1 my-0" style={{ fontSize: "16px", backgroundColor: "#8bc", minWidth: "184px", maxWidth: "212px" }}>{(filteredOtNodeDataArray.length === 1) ? 'Basic Object' : task?.name}</div>
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



