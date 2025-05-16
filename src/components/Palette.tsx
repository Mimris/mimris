// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { set } from "immer/dist/internal";

import { gojs } from "../akmm/constants";
import * as uib from '../akmm/ui_buildmodels';
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
import genRoleTasks from "./utils/SetRoleTaskFilter";
import Tasks from '../components/Tasks'


const debug = false;
const includeCoreAndIRTVAndPOPS = true;

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
  // const [IRTVOtNodeDataArray, setIRTVOtNodeDataArray] = useState([])
  // const [POPSOtNodeDataArray, setPOPSOtNodeDataArray] = useState([])
  // const [BPMNOtNodeDataArray, setBPMNOtNodeDataArray] = useState([])
  // const [CoreOtNodeDataArray, setCoreOtNodeDataArray] = useState([])
  const [currentMetamodelRef, setCurrentMetamodelRef] = useState('')
  const [filteredNewtypesNodeDataArray, setFilteredNewtypesNodeDataArray] = useState([])
  // const [metamodelList, setMetamodelList] = useState([])
  const [role, setRole] = useState('')
  const [task, setTask] = useState('')
  const [types, setTypes] = useState([])
  const [addMetamodelName, setAddMetamodelName] = useState(false)
  const [selMetamodelName, setSelMetamodelName] = useState('')
  const [openDetail, setOpenDetail] = useState<string | null>('top');

  const handleToggle = (id: string) => {
    setOpenDetail(id);
    // setOpenDetail(openDetail === id ? null : id);
  };

  let focusModel = props.phFocus?.focusModel

  const models = props.metis?.models
  const metamodels = props.metis?.metamodels
  if (!metamodels) return null;
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const mmodel = metamodels?.find((m: any) => m?.id === model?.metamodelRef)
  // const mmodelRefs = mmodel?.metamodelRefs;

  const metamodelList = metamodels?.filter((m: any) => m?.id !== undefined && m?.name !== 'ADMIN_META')?.map((m: any) => ({ id: m?.id, name: m?.name })); // exclude admin metamodel

  if (debug) console.log('47', model, mmodel, metamodels, metamodelList);

  // const gojsmodel = (props.myGoModel?.nodes) ? {nodeDataArray: props.myGoModel?.nodes, linkDataArray: props.myGoModel?.links} : [];
  const gojsmetamodel = props.gojsMetaModel //(props.myGoMetamodel?.nodes) ? {nodeDataArray: props.myGoMetamodel?.nodes, linkDataArray: props.myGoMetamodel?.links} : [];
  if (debug) console.log('50 Palette start', gojsmetamodel, props)

  // hardcoded for now
  let tasks = []

  let focusTask = props.phFocus?.focusTask

  // function toggleRefresh() { setRefresh(!refresh); }
  function togglePalette() { setVisiblePalette(!visiblePalette); }
  // function toggleRefreshPalette() { setRefreshPalette(!refreshPalette); }

  // let ndarr = props.gojsMetamodel?.nodeDataArray
  let ndarr = uib.buildGoPalette(props.myMetis.currentMetamodel, props.myMetis).nodes;

  let taskNodeDataArray: any[] = ndarr

  if (debug) console.log('76 Palette', role, task, metamodelList, types, tasks);

  useEffect(() => {
    const model = props.metis?.models?.find((m: any) => m?.id === focusModel?.id);
    // const mmodel = props.metis?.metamodels?.find((m: any) => m?.id === props.metis?.currentMetamodel);
    const mmodel = props.metis?.metamodels?.find((m: any) => m?.id === model?.metamodelRef);
    if (!debug) useEfflog('89 Palette useEffect 1 ', model, mmodel, props.phFocus);
    if (props.visiblePalette) setVisiblePalette(visiblePalette);
    if (mmodel?.name === 'OSDU_META') setVisiblePalette(true);
    const { focusRole, focusTask } = props.phFocus;
    const objecttypes = mmodel?.objecttypes;
    if (!metamodels) return null;
    if (props.modelType === 'metamodel') setVisiblePalette(false);
    setRole(focusRole);
    setTask(focusTask);
    const types = objecttypes?.map((t: any) => t?.name);
    setTypes(types);

    // setFilteredNewtypesNodeDataArray(buildFilterOtNodeDataArray(types, mmodel));  // build the palette for current metamodel
    const newFilteredData = buildFilterOtNodeDataArray(types, mmodel);
    setFilteredOtNodeDataArray(newFilteredData);
    if (!debug) console.log('106 Palette useEffect 2', types, mmodel.name, filteredOtNodeDataArray, props.metis);
    
    const timer = setTimeout(() => {
      setRefreshPalette(!refreshPalette);
      if (!debug) console.log('110 Palette useEffect 3', mmodel.name, filteredOtNodeDataArray);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!metamodels) return null;

  const buildFilterOtNodeDataArray = (types, mmodel) => { // build the palette for the selected metamodel
    if (debug) console.log('118 Palette', mmodel, props.myMetis);

    const curMyMetamodel = props.myMetis?.findMetamodel(mmodel?.id)
    if (debug) console.log('121 Palette', props.myMetis, curMyMetamodel)
    const curPalette = uib.buildGoPalette(curMyMetamodel, props.myMetis);

    if (debug) console.log('124 Palette', types, curMyMetamodel, curPalette, curPalette?.nodes);

    if (types?.length > 0) {
      const otsArr = types.map(wot =>
        curPalette?.nodes.find(i => {
          if (debug) console.log('123 Palette', i?.name, wot, i?.name === wot);
          return i?.name === wot && i;
        })
      ).filter(Boolean);
      if (debug) console.log('122 Palette', otsArr);
      // sort the array by order with these first: Container, EntityType, Property, Datatype, Value, FieldType, InputPattern, ViewFormat
      const wotArr = (mmodel.name === 'CORE_META')
        ? ['Container', 'EntityType', 'RelshipType', 'Property', 'Datatype', 'Value', 'Fieldtype', 'InputPattern', 'ViewFormat', 'Method', 'MethodType']
        : (mmodel.name === 'IRTV_META')
          ? ['Container', 'Information', 'Role', 'Task', 'View']
          : (mmodel.name === 'POPS_META')
            ? ['Container', 'Product', 'Facility', 'Equipment', 'Material', 'Geobody', 'DistributNetwork', 'Organisation', 'Process', 'Event', 'Data', 'Service', 'System', 'Software', 'Device']
            : (mmodel.name === 'BPMN_META')
              ? ['Pool', 'Lane', 'Start', 'Activity', 'Task','Event', 'ParallelGate', 'InclusiveGate', 'ExclusiveGate', 'End', 'DataObject', 'DataStore', 'Container']
              : (mmodel.name === 'OSDU_META')
                ? ['Container', 'OSDUType', 'Property', 'Proxy', 'Array', 'Item']
                : ['Container']

      const otsArrSorted = otsArr.sort((a, b) => {
        const aIndex = wotArr.indexOf(a?.name);
        const bIndex = wotArr.indexOf(b?.name);
        if (aIndex === -1) return 1; // a is not found in wotArr, sort a to the end
        if (bIndex === -1) return -1; // b is not found in wotArr, sort b to the end
        return aIndex - bIndex; // both a and b are found in wotArr, sort them based on their indices
      });

      return otsArr
    } else { return ndarr }
  };

  if (debug) console.log('159 Palette useEffect 2', props.phFocus.focusTask.workOnTypes);

  function getMetamodels(selectedIndex) {
    setSelMetamodelName(metamodelList[selectedIndex].name)
    console.log('163 Palette', selectedIndex, metamodelList[selectedIndex], selMetamodelName);
    const selmmodel = metamodelList[selectedIndex];
    const mmodel = metamodels.find(m => m.id === selmmodel?.id);
    const types = mmodel?.objecttypes?.map((t: any) => t?.name) || [];
    setTypes(types);
    dispatch({ type: 'SET_CURRENT_METAMODEL', data: mmodel });
    setCurrentMetamodelRef(mmodel?.id);
    if (debug) console.log('169 Palette', selectedIndex, metamodelList[selectedIndex], selMetamodelName, selmmodel, types, mmodel);
    const filteredNodeDataArray = buildFilterOtNodeDataArray(types, mmodel);
    if (!debug) console.log('171 Palette', mmodel.name, filteredNodeDataArray);
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
          Change Metamodel
        </option>
        {metamodelList?.map((t, i) => (
          <option key={i} value={i}>
            {t?.name}
          </option>
        ))}
      </select>
    </>
  );


    // const gojsappPaletteTopDiv = (mmodel && filteredNewtypesNodeDataArray) && // this is the palette with the current metamodel
    const gojsappPaletteTopDiv = (mmodel && filteredOtNodeDataArray) && // this is the palette with the current metamodel
    (
      <details open={openDetail === 'top'} onClick={() => handleToggle('top')} className="metamodel-pad">
        <summary className="mmname mx-0 px-1 my-0" style={{ fontSize: "16px", backgroundColor: "#9cd", minWidth: "184px", maxWidth: "212px" }}>{mmodel?.name}</summary>
        {/* Top palette with current metamodelpalette */}
        <GoJSPaletteApp
          nodeDataArray={filteredOtNodeDataArray}
          linkDataArray={[]}
          metis={props.metis}
          myMetis={props.myMetis}
          phFocus={props.phFocus}
          dispatch={props.dispatch}
          diagramStyle={{ height: "76vh" }}
        />
      </details>
    )

  //   let gojsappPaletteIRTVDiv = null; // Initialize with a default value
  //   if (includeCoreAndIRTVAndPOPS) {
  //     gojsappPaletteIRTVDiv = (mmodel && (mmodel?.name !== 'IRTV_META') && IRTVOtNodeDataArray) && // this is the palette with the IRTV metamodel
  //     <details open={openDetail === 'irtv'} onClick={() => handleToggle('irtv')} className="metamodel-pad">
  //       <summary className="mmname mx-0 px-1" style={{ fontSize: "16px", backgroundColor: "#9cd", minWidth: "184px", maxWidth: "212px" }}>{irtvmetamodel?.name}</summary>
  //       <GoJSPaletteApp
  //         nodeDataArray={IRTVOtNodeDataArray}
  //         linkDataArray={[]}
  //         myMetis={props.myMetis}
  //         metis={props.metis}
  //         phFocus={props.phFocus}
  //         dispatch={props.dispatch}
  //         diagramStyle={{ height: "76vh" }}
  //       />
  //     </details>
  // }
  //   let gojsappPalettePOPSDiv = null; // Initialize with a default value
  //   if (includeCoreAndIRTVAndPOPS) {
  //     gojsappPalettePOPSDiv = (mmodel && (mmodel?.name !== 'POPS_META') && POPSOtNodeDataArray) && // this is the palette with the IRTV metamodel
  //     <details open={openDetail === 'irtv'} onClick={() => handleToggle('irtv')} className="metamodel-pad">
  //       <summary className="mmname mx-0 px-1" style={{ fontSize: "16px", backgroundColor: "#9cd", minWidth: "184px", maxWidth: "212px" }}>{popsmetamodel?.name}</summary>
  //       <GoJSPaletteApp
  //         nodeDataArray={POPSOtNodeDataArray}
  //         linkDataArray={[]}
  //         myMetis={props.myMetis}
  //         metis={props.metis}
  //         phFocus={props.phFocus}
  //         dispatch={props.dispatch}
  //         diagramStyle={{ height: "76vh" }}
  //       />
  //     </details>
  // }

  //   let gojsappPaletteMETADiv = null; // Initialize with a default value
  // gojsappPaletteMETADiv = (mmodel && (mmodel?.name !== 'CORE_META') && CoreOtNodeDataArray) && // this is the palette with the coret metamodel
  //     <details open={openDetail === 'core'} onClick={() => handleToggle('core')} className="metamodel-pad">
  //       <summary className="mmname mx-0 px-1 my-1" style={{ fontSize: "16px", backgroundColor: "#9cd", minWidth: "184px", maxWidth: "212px" }}>{coremetamodel?.name}</summary>
  //       <GoJSPaletteApp
  //         nodeDataArray={CoreOtNodeDataArray}
  //         linkDataArray={[]}
  //         myMetis={props.myMetis}
  //         metis={props.metis}
  //         phFocus={props.phFocus}
  //         dispatch={props.dispatch}
  //         diagramStyle={{ height: "76vh" }}
  //       />
  //   </details>


  const metamodelTasks = <Tasks taskFocusModel={undefined} asPage={false} visible={true} props={props} />

  let gojsappPaletteDiv = null; // Initialize with a default value
  if (includeCoreAndIRTVAndPOPS) {
    gojsappPaletteDiv =
    <>
      {otDiv}
      {gojsappPaletteTopDiv}
    </>
  } else {
    gojsappPaletteDiv =
    <>
      <div>
      {gojsappPaletteTopDiv}
      </div>
    </>
  }

  const palette = // this is the left pane with the palette and toggle for refreshing
    <>
      <button className="btn-sm text-light bg-transparent border border-0 border-transparent"
        onClick={togglePalette}> {visiblePalette
          ? <span className="fs-8"><i className="fa fa-lg fa-angle-left pull-right-container"></i>  Palette: Obj. Types </span>
          // ? <span> &lt;- Palette: Src Metamodel</span> 
          : <i className="fa fa-lg fa-angle-right pull-right-container"></i>
        }
      </button>
      <div className="d-flex justify-content-left">
        <div>
          {visiblePalette
            ? (refreshPalette)
              ? <>{gojsappPaletteDiv}</>
              : <> {gojsappPaletteDiv}  </>
            : <div className="btn-vertical d-flex justify-content-between fs-7" style={{ height: "82vh", maxWidth: "4px", padding: "2px", fontSize: "12px", fontWeight: "bold" }}><span> P a l e t t e - S o u r c e - M e t a m o d e l</span> </div>
          }
        </div>
        <div
          className="ps-1 m-0 bg-transparent"
        // style={{ position: "relative", marginRight: "0px", marginTop: "-32px", marginLeft: "0", right: "10", top: "4", color: "lightgray" }}
        >
          {metamodelTasks}
        </div>
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



