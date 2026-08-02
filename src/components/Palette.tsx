// @ts-nocheck
import React, { useState, useEffect, useRef, useImperativeHandle } from "react";
import { useDispatch } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { set } from "immer/dist/internal";

import { gojs } from "../akmm/constants";
import * as uib from '../akmm/ui_buildmodels';
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
import genRoleTasks from "./utils/SetRoleTaskFilter";
import Tasks from '../components/Tasks'


const debug = false;
const includeMetamodelSelector = true;

const clog = console.log.bind(console, '%c %s',
  'background: blue; color: white');
const useEfflog = console.log.bind(console, '%c %s', // green colored cosole log
  'background: red; color: white');
const ctrace = console.trace.bind(console, '%c %s',
  'background: blue; color: white');

const PALETTE_VISIBLE_STORAGE_KEY = 'mimris.palette.visible';
const PALETTE_TYPES_VISIBLE_STORAGE_KEY = 'mimris.palette.visibleTypes';
const PALETTE_EXPANDED_STORAGE_KEY = 'mimris.palette.expanded';

function readStoredBoolean(key: string, fallback: boolean) {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    if (value === null) return fallback;
    return value === 'true';
  } catch (_) {
    return fallback;
  }
}

const Palette = React.forwardRef((props: any, ref: any) => {

  if (debug) clog('22 Palette', props);
  const dispatch = useDispatch();
  const prevDeps = useRef({ role: null, task: null, metamodelList: null, types: null });
  const phFocus = props.phFocus || {};

  const [visiblePalette, setVisiblePalette] = useState(() => readStoredBoolean(PALETTE_VISIBLE_STORAGE_KEY, true))
  const [refresh, setRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState('1');
  const [filteredOtNodeDataArray, setFilteredOtNodeDataArray] = useState([])
  const [filteredLinkDataArray, setFilteredLinkDataArray] = useState([])
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

  const [visibleTypes, setVisibleTypes] = useState(() => readStoredBoolean(PALETTE_TYPES_VISIBLE_STORAGE_KEY, true))
  const [isExpanded, setIsExpanded] = useState(() => readStoredBoolean(PALETTE_EXPANDED_STORAGE_KEY, false))

  const handleToggle = (id: string) => {
    setOpenDetail(id);
    // setOpenDetail(openDetail === id ? null : id);
  };

  let focusModel = phFocus?.focusModel

  const models = Array.isArray(props.metis?.models) ? props.metis.models.filter(Boolean) : []
  const metamodels = Array.isArray(props.metis?.metamodels) ? props.metis.metamodels.filter(Boolean) : []
  if (!metamodels) return null;
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const mmodel = metamodels?.find((m: any) => m?.id === model?.metamodelRef)
  // const mmodelRefs = mmodel?.metamodelRefs;

  const metamodelList = metamodels?.filter((m: any) => m?.id !== undefined && m?.name !== 'ADMIN_META')?.map((m: any) => ({ id: m?.id, name: m?.name })); // exclude admin metamodel

  if (debug) console.log('47', model, mmodel, metamodels, metamodelList);

  // const gojsmodel = (props.myGoModel?.nodes) ? {nodeDataArray: props.myGoModel?.nodes, linkDataArray: props.myGoModel?.links} : [];
  const gojsmetamodel = props.gojsMetaModel //(props.myGoMetamodel?.nodes) ? {nodeDataArray: props.myGoMetamodel?.nodes, linkDataArray: props.myGoMetamodel?.links} : [];
  if (debug) console.log('69 Palette start', gojsmetamodel, props)

  // hardcoded for now
  let tasks = []

  let focusTask = phFocus?.focusTask

  // function toggleRefresh() { setRefresh(!refresh); }
  function togglePalette() { setVisiblePalette(!visiblePalette); }
  // function toggleRefreshPalette() { setRefreshPalette(!refreshPalette); }

  if (debug) console.log('85 Palette', role, task, metamodelList, types, tasks);

  useEffect(() => {
    const model = props.metis?.models?.find((m: any) => m?.id === focusModel?.id);
    // const mmodel = props.metis?.metamodels?.find((m: any) => m?.id === props.metis?.currentMetamodel);
    const mmodel = props.metis?.metamodels?.find((m: any) => m?.id === model?.metamodelRef);
    if (props.myMetis && props.metis) {
      props.myMetis.importData(props.metis, true);
    }
    setSelMetamodelName(mmodel?.name);
    if (debug) useEfflog('91 Palette useEffect 1 ', model, mmodel, phFocus);
    if (props.visiblePalette) setVisiblePalette(visiblePalette);
    if (mmodel?.name === 'OSDU_META') setVisiblePalette(true);
    const { focusRole, focusTask } = phFocus;
    const objecttypes = mmodel?.objecttypes;
    if (!metamodels) return null;
    if (props.modelType === 'metamodel') setVisiblePalette(false);
    setRole(focusRole);
    setTask(focusTask);
    const types = objecttypes?.map((t: any) => t?.name);
    setTypes(types);
    const { nodes, links } = buildFilterOtNodeDataArray(types, mmodel);
    setFilteredOtNodeDataArray(nodes);
    setFilteredLinkDataArray(links);
    if (debug) console.log('106 Palette useEffect 2', types, mmodel.name, filteredOtNodeDataArray, props.metis);
    
    if (debug) console.log('110 Palette useEffect 3', mmodel?.name, filteredOtNodeDataArray);
  }, [focusModel?.id, model?.metamodelRef]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PALETTE_VISIBLE_STORAGE_KEY, String(visiblePalette));
    } catch (_) {
      // ignore storage errors
    }
  }, [visiblePalette]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PALETTE_TYPES_VISIBLE_STORAGE_KEY, String(visibleTypes));
    } catch (_) {
      // ignore storage errors
    }
  }, [visibleTypes]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PALETTE_EXPANDED_STORAGE_KEY, String(isExpanded));
    } catch (_) {
      // ignore storage errors
    }
  }, [isExpanded]);

  function toggleTypes() {
    setVisibleTypes(!visibleTypes);
  }

  useImperativeHandle(ref, () => ({
    toggleAll: () => {
      setVisibleTypes(v => !v);
      setVisiblePalette(p => !p);
    },
    setVisibleAll: (v: boolean) => {
      setVisibleTypes(v);
      setVisiblePalette(v);
    }
  }), [visibleTypes, visiblePalette]);

  if (!metamodels) return null;

  const buildFilterOtNodeDataArray = (types, mmodel) => { // build the palette for the selected metamodel
    if (debug) console.log('118 Palette', mmodel, props.myMetis);

    const curMyMetamodel = props.myMetis?.findMetamodel(mmodel?.id)
    if (debug) console.log('121 Palette', props.myMetis, curMyMetamodel)
    const curPalette = props.modelType === 'metamodel'
      ? uib.buildGoMetaPalette()
      : uib.buildGoPalette(curMyMetamodel, props.myMetis);
    const paletteNodes = curPalette?.nodes ?? [];
    const paletteLinks = curPalette?.links ?? [];
    setTypes(paletteNodes?.map((t: any) => t?.name));
    if (debug) console.log('123 Palette', curPalette?.nodes?.map((t: any) => t?.name), curPalette);

    if (debug) console.log('124 Palette', types, curMyMetamodel, curPalette, curPalette?.nodes);

    if (props.modelType === 'metamodel') {
      return { nodes: paletteNodes, links: paletteLinks };
    }

    let filteredNodes = paletteNodes;
    if (types?.length > 0) {
      const otsArr = types.map(wot =>
        curPalette?.nodes.find(i => {
          if (debug) console.log('123 Palette', i?.name, wot, i?.name === wot);
          return (i?.name === wot) ? i : undefined;
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

      filteredNodes = otsArrSorted;
    }

    const nodeKeys = new Set(
      filteredNodes
        ?.map((n: any) => n?.key ?? n?.objecttype?.id ?? n?.objecttype?.key)
        ?.filter(Boolean)
    );

    const filteredLinks = paletteLinks.filter(
      (link: any) => nodeKeys.has(link?.from) && nodeKeys.has(link?.to)
    );

    return { nodes: filteredNodes, links: filteredLinks };
  };

  if (debug) console.log('159 Palette useEffect 2', phFocus.focusTask?.workOnTypes);

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
    const { nodes, links } = buildFilterOtNodeDataArray(types, mmodel);
    if (debug) console.log('171 Palette', mmodel.name, nodes, links);
    setFilteredOtNodeDataArray(nodes);
    setFilteredLinkDataArray(links);
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
          {(selMetamodelName) ? selMetamodelName : "Change Metamodel"}
        </option>
        {metamodelList?.map((t, i) => (
          <option key={i} value={i}>
            {t?.name}
          </option>
        ))}
      </select>
    </>
  );
  // Relationship types are part of the metamodel contract, not an expanded-view
  // decoration. Keep them available and visible in the normal palette as well.
  const paletteLinkData = filteredLinkDataArray;

    // const gojsappPaletteTopDiv = (mmodel && filteredNewtypesNodeDataArray) && // this is the palette with the current metamodel
    const gojsappPaletteTopDiv = (mmodel && filteredOtNodeDataArray) && // this is the palette with the current metamodel
    (
      <div className="metamodel-pad pt-2">
        {/* <detail open={openDetail === 'top'} onClick={() => handleToggle('top')} className="metamodel-pad">*/}
        {/* <summary className="mmname mx-0 px-1 my-0" style={{ fontSize: "16px", backgroundColor: "#9cd", minWidth: "184px", maxWidth: "212px" }}>{mmodel?.name}</summary> */}
        {/* Top palette with current metamodelpalette */}
        <GoJSPaletteApp
          key={`${focusModel?.id ?? 'palette-default'}-${mmodel?.id ?? props.myMetis?.currentMetamodel?.id ?? 'metamodel'}`}
          nodeDataArray={filteredOtNodeDataArray}
          linkDataArray={paletteLinkData}
          metis={props.metis}
          myMetis={props.myMetis}
          phFocus={phFocus}
          dispatch={props.dispatch}
          divClassName={props.modelType === 'model' ? 'diagram-component-objects' : 'diagram-component-palette'}
          diagramStyle={{ height: '76vh' }}
          noOfCols={isExpanded ? 4 : 1}
        />
      {/* </detail> */}
      </div>
    )

  const metamodelTasks = <Tasks taskFocusModel={undefined} asPage={false} visible={true} props={props} />

  let gojsappPaletteDiv = null; // Initialize with a default value
  if (includeMetamodelSelector) {
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

  const paletteControls = // Palette controls: toggle palette visibility and width
    <div
      className="palette-top d-flex pl-1 pr-2 py-0 mb-1 w-100"
      style={{
        backgroundColor: "#9cd",
        width: "100%",
      }}
    >
      <div className="d-flex align-items-center justify-content-between w-100" style={{ columnGap: '0.5rem', minWidth: 0 }}>
        <button
          className="btn-sm p-0 m-0 text-light bg-transparent border-0"
          style={{ minWidth: 0, flex: "1 1 auto", textAlign: "left" }}
          onClick={togglePalette}
          data-toggle="tooltip"
          data-placement="top"
          title="Show or hide palette content"
        >
          {visiblePalette
          ? <span className="fs-8 px-1 palette-label" style={{ whiteSpace: "nowrap", fontSize: "0.82rem" }}><i className="fa fa-lg fa-angle-left pull-right-container me-1"></i> 
          Palette: Obj. Types
          </span>
          : <i className="fa fa-angle-right text-white pull-right-container ps-1"></i>}
        </button>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", flex: "0 0 auto" }}>
          <button
          className="btn-sm ps-0 pe-2 m-0 text-right bg-transparent h-50"
          style={{ backgroundColor: "#9cd", outline: "0", borderStyle: "none" }}
          onClick={() => { setIsExpanded(!isExpanded); }}
          data-toggle="tooltip"
          data-placement="top"
          title="Toggle palette width"
          disabled={!visiblePalette}
          >
            {visiblePalette ? (isExpanded ? <span>&lt; --</span> : <span>-- &gt;</span>) : <span></span>}
          </button>
        </div>
      </div>
    </div>

  const paletteBody =
    <div
      className="d-flex flex-column px-2"
      style={{ flexGrow: 1 }}
    >
      {gojsappPaletteDiv}
  </div>

  const collapsedPaletteSidebar =
    <div
      className="palette-sidebar d-flex flex-column"
      style={{
        width: 16,
        minWidth: 16,
        maxWidth: 16,
        transition: 'width 0.2s ease',
        backgroundColor: '#9cd',
      }}
    >
      <button
        className="btn-sm p-0 m-0 text-light bg-transparent border-0"
        onClick={togglePalette}
        data-toggle="tooltip"
        data-placement="top"
        title="Show or hide palette content"
      >
        <i className="fa fa-angle-right text-white pull-right-container ps-1"></i>
      </button>
      <div
        className="d-flex flex-column align-items-start"
        style={{
          flexGrow: 1,
          width: "12px",
          minWidth: "16px",
          maxWidth: "16px",
          padding: 0,
          overflow: "hidden",
          color: "#ffffffff",
        }}
      >
        <span className="palette-label ms-1 palette-label-spaced"> T y p e - P a l e t t e</span>
      </div>
    </div>

  const paletteSidebarWidth = visiblePalette
    ? (isExpanded ? 600 : 220)
    : 16

  const paletteSidebar =
    <div
      className="palette-sidebar d-flex flex-column"
      style={{
        width: paletteSidebarWidth,
        minWidth: paletteSidebarWidth,
        maxWidth: paletteSidebarWidth,
        transition: 'width 0.2s ease',
        backgroundColor: '#9cd',
        // height: '100vh', // <-- ensure full viewport height
      }}
    >
      {paletteControls}
      {paletteBody}
    </div>

  const paletteGuide =
    <div
      className="palette--workarea flex-grow-1"
      style={{
        minWidth: 0,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        backgroundColor: 'rgba(255, 253, 229, 1)',
        height: '89vh', // <-- ensure full viewport height
      }}
    >
      {metamodelTasks}
    </div>

  return (props.metis) ? (
    <div className="palette-workarea d-flex flex-row" style={{ height: 'calc(100vh - 11vh)' }}>
      {paletteGuide}
      {visiblePalette ? paletteSidebar : collapsedPaletteSidebar}
    </div>
  ) : <>No metamodels found</>;
});

export default Palette; 
