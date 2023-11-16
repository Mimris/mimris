// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
import genRoleTasks from "./utils/SetRoleTaskFilter";

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
  const [addMetamodelName, setAddMetamodelName] = useState(false)
  const [selMetamodelName, setSelMetamodelName] = useState('')

  let focusModel = props.phFocus?.focusModel

  const models = props.metis?.models
  const metamodels = props.metis?.metamodels || [];
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const mmodel = metamodels?.find((m: any) => m?.id === model?.metamodelRef)
  // const mmodelRefs = mmodel?.metamodelRefs;
  
  const metamodelList = metamodels?.filter((m: any) => m?.id !== undefined)?.map((m: any) => ({ id: m?.id, name: m?.name }));

  // const metamodelList = mmodel.submetamodels?.map((m: any) => ({ id: m?.id, name: m?.name }));
  if (debug) console.log('47', model, mmodel, metamodels,  metamodelList);

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
    const objecttypes  = mmodel?.objecttypes;
    if (!metamodels) return null;
  
    setRole(focusRole);
    setTask(focusTask);
    setTypes(objecttypes?.map((t: any) => t?.name));
  
    setFilteredNewtypesNodeDataArray(buildFilterOtNodeDataArray(types, mmodel));  // build the palette for current metamodel
    // setFilteredNewtypesNodeDataArray(buildFilter(focusRole, focusTask, metamodelList, types, mmodel));  // build the palette for current metamodel

    // const seltypes = (mmodel.submetamodels) &&  mmodel.submetamodels[0]?.objecttypes.map((t: any) => t?.name);
    if (debug) console.log('89 Palette useEffect 1',  mmodel);
    const coremetamodel = props.myMetis?.metamodels.find(m => m?.name === 'AKM-Core_MM')
    const irtvmetamodel = metamodels.find(m => m?.name === 'AKM-IRTV_MM')
    const additionalmetamodel = (coremetamodel?.name !== mmodel?.name) ? coremetamodel : irtvmetamodel
    const seltypes =  additionalmetamodel?.objecttypes.map((t: any) => t?.name);
    setSelMetamodelName(additionalmetamodel?.name)
    if (debug) console.log('115 Palette', additionalmetamodel);
    setAddMetamodelName(additionalmetamodel?.name)

    setFilteredOtNodeDataArray(buildFilterOtNodeDataArray(seltypes, additionalmetamodel));  // build the palette for current metamodel
    if (debug) console.log('92 Palette useEffect 2', filteredOtNodeDataArray, buildFilterOtNodeDataArray(seltypes, mmodel));
    // setFilteredOtNodeDataArray(buildFilter(role, task, metamodelList, seltypes, mmodel.submetamodels[0]));  // build the palette for current metamodel

    const timer = setTimeout(() => {
      setRefreshPalette(!refreshPalette);
    }, 1000);
  
    return () => clearTimeout(timer);
  // }, [props.phFocus, mmodel]);
  }, []);

  // if (!metamodels) return null;
  const buildFilterOtNodeDataArray = (types, mmodel) => { // build the palette for the selected metamodel
    if (debug) console.log('106 Palette', mmodel, props.myMetis);

    const curMyMetamodel = props.myMetis?.findMetamodel(mmodel?.id)
    if (debug) console.log('109 Palette', props.myMetis, curMyMetamodel)
    const curPalette = uib.buildGoPalette(curMyMetamodel, props.myMetis);

    if (debug) console.log('118 Palette', types, curMyMetamodel, curPalette, curPalette?.nodes);

    if (types?.length > 0) {
      const otsArr = types.map(wot =>
        curPalette?.nodes.find(i => {
          if (debug) console.log('123 Palette', i?.name, wot, i?.name === wot);
          return i?.name === wot && i;
        })
      ).filter(Boolean);
      if (debug) console.log('122 Palette', otsArr);
      return otsArr
    } else { return ndarr }
  };

  // const buildFilter = (role, task, metamodelList, types, metamodel) => {
  //   if (debug) console.log('102 Palette useEffect 1', role, task, metamodelList, types, metamodel);
  //   // setTypes(metamodel?.objecttypes.map((t: any) => t?.name));
  //     return buildFilterOtNodeDataArray(types, metamodel);
  // };

  if (debug) console.log('127 Palette useEffect 2', props.phFocus.focusTask.workOnTypes);

  function getMetamodels(selectedIndex) {
    setSelMetamodelName(metamodelList[selectedIndex].name)
    console.log('143 Palette', selectedIndex, metamodelList[selectedIndex], selMetamodelName);
    const selmmodel = metamodelList[selectedIndex];
    const mmodel = metamodels.find(m => m.id === selmmodel?.id);
    const types = mmodel?.objecttypes?.map((t: any) => t?.name) || [];
    if (debug) console.log('147 Palette', selectedIndex, metamodelList[selectedIndex], selMetamodelName, selmmodel, types, mmodel);
    const filteredNodeDataArray = buildFilterOtNodeDataArray(types, mmodel);
    if (debug) console.log('149 Palette', filteredNodeDataArray);
    const timer = setTimeout(() => {
      setFilteredOtNodeDataArray(filteredNodeDataArray);
      setRefreshPalette(!refreshPalette);
    }, 200);
    return () => clearTimeout(timer);
  }

  const otDiv = (metamodelList && metamodelList.length > 0) && (
    <>
      {/* <label className="label-field px-1">Additional Metamodels:</label> */}
      <select
        className="select-field mx-1 text-secondary"
        style={{ width: "98%" }}
        // value={selMetamodelName}
        // value={metamodelList?.findIndex((t) => t?.id === task.id)}
        onChange={(e) => getMetamodels(e.target.value)}
      >
        <option value="" key="-1">
          Additional Metamodels
        </option>
        {metamodelList?.map((t, i) => (t?.name !== mmodel?.name) && (
          <option key={i} value={i}>
            {t?.name}
          </option>
        ))}
      </select>
    </>
  );

  const gojsappPaletteTopDiv = (mmodel && filteredNewtypesNodeDataArray) && // this is the palette with the current metamodel
      <div className="metamodel-pad mt-0 p-1  bg-white" style={{ height: "39vh" }}>
        <div className="mmname mx-0 px-1 my-0" style={{ fontSize: "16px", backgroundColor: "#8bc", minWidth: "184px", maxWidth: "212px" }}>{mmodel.name}</div>
        <div className="modellingtask bg-light w-100" >
        </div>
        {/* Top palette with current metamodelpalette */}
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

    const gojsappPaletteBottomDiv = (mmodel && filteredOtNodeDataArray) && // this is the palette with the current metamodel
      <div className="metamodel-pad mt-1 p-1 pt-1 bg-white" style={(filteredOtNodeDataArray?.length === 0) ? { height: "80vh" } : { height: "45vh" }} >
        <div className="modellingtask bg-light w-100" >
          {otDiv}
          <div className="mmname mx-0 px-1 my-1" style={{ fontSize: "16px", backgroundColor: "#8bc", minWidth: "184px", maxWidth: "212px" }}>{selMetamodelName}</div>
        </div>
        {/* Lower palette with selected metamodel or first metamodel */}
        <GoJSPaletteApp
          nodeDataArray={filteredOtNodeDataArray}
          linkDataArray={[]}
          myMetis={props.myMetis}
          metis={props.metis}
          myGoModel={props.myGoModel}
          phFocus={props.phFocus}
          dispatch={props.dispatch}
          diagramStyle={{ height: "39vh" }}
        />
      </div>
    
    const gojsappPaletteDiv = 
          <>
            {gojsappPaletteTopDiv}
            {gojsappPaletteBottomDiv}
          </>

  const palette = // this is the left pane with the palette and toggle for refreshing
    <>
      <button className="btn-sm " style={{ backgroundColor: "#8bc", outline: "0", borderStyle: "none" }}
        onClick={togglePalette}> {visiblePalette ? <span> &lt;- Palette: Src Metamodel</span> : <span> -&gt;</span>}
      </button>
      <div>
        {visiblePalette
          ? (refreshPalette)
            ? <>
                {gojsappPaletteDiv}  
              </> // these two lines needs to be different to refresh the palette
            : <div>
                {/* <div className="btn-horizontal bg-light mx-0 px-0 mb-0" style={{ fontSize: "11px", minWidth: "166px", maxWidth: "160px" }}> */}
                  {gojsappPaletteDiv} 
                {/* </div> */}
              </div>
          : <div className="btn-vertical px-1 " style={{ height: "82vh", maxWidth: "4px", padding: "2px", fontSize: "12px" }}><span> P a l e t t e - S o u r c e - M e t a m o d e l</span> </div>
        }
      </div>
    </>

  if (debug) clog('244 Palette', props);
  return (props.metis) ? (
    <>
      {palette}
    </>
  ) : <>No metamodels found</>;
}

export default Palette;



