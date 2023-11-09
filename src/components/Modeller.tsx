// modeller
// @ts-nocheck

import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from 'react-redux';
import useLocalStorage from '../hooks/use-local-storage'
import useSessionStorage from "../hooks/use-session-storage";

import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';

import StartInitStateJson from '../startupModel/AKM-INIT-Startup_PR.json'
import GoJSApp from "./gojs/GoJSApp";
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
import Selector from './utils/Selector'
import GenGojsModel from './GenGojsModel'
import { handleInputChange } from "../akmm/ui_modal";
import { disconnect } from "process";
import { SaveModelToLocState } from "./utils/SaveModelToLocState";
import { SaveModelviewToSvgFile, SaveModelviewToSvgFileAuto } from "./utils/SaveModelToFile";
import { SaveAkmmUser } from "./utils/SaveAkmmUser";
import ReportModule from "./ReportModule";
import { gojs } from "../akmm/constants";

import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { eventChannel } from "redux-saga";

const debug = false;

const clog = console.log.bind(console, '%c %s', // green colored cosole log
  'background: blue; color: white');
const useEfflog = console.log.bind(console, '%c %s', // green colored cosole log
  'background: red; color: white');
const ctrace = console.trace.bind(console, '%c %s',
  'background: green; color: white');

const Modeller = (props: any) => {

  if (debug) console.log('19 Modeller: props', props);
  if (!props.metis) return <> not found</>

  const dispatch = useDispatch();

  const [showModal, setShowModal] = useState(false);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const [refresh, setRefresh] = useState(false)
  const [activeTab, setActiveTab] = useState();
  const [ofilter, setOfilter] = useState('All')
  const [visibleObjects, setVisiblePalette] = useState(false)
  const [visibleContext, setVisibleContext] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputValue, setInputValue] = useState(props.metis.name); // initial value is an empty string
  const [displayValue, setDisplayValue] = useState(props.metis.name); // the value to be displayed
  const [projectName, setProjectName] = useState(props.metis.name); // the value to be displayed
  const [mvName, setMvName] = useState(); // the value to be displayed

  const [memoryLocState, setMemoryLocState] = useSessionStorage('memorystate', null); //props);
  // const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', null); //props);
  const [memoryAkmmUser, setMemoryAkmmUser] = useLocalStorage('akmmUser', ''); //props);

  const [exportSvg, setExportSvg] = useState(null);
  const [diagramReady, setDiagramReady] = useState(false);
  const [selectedOption, setSelectedOption] = useState('Objects in this Modelview');
  const [ofilteredArr, setOfilteredArr] = useState([]);
  const [gojsobjects, setGojsobjects] = useState({ nodeDataArray: [], linkDataArray: [] });



  const diagramRef = useRef(null);

  let focusModel = props.phFocus?.focusModel
  let focusModelview = props.phFocus?.focusModelview
  let activetabindex = 0

  const models = props.metis?.models
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const modelindex = models?.findIndex((m: any) => m?.id === focusModel?.id)
  const modelviews = model?.modelviews
  const modelview = modelviews?.find((m: any) => m?.id === focusModelview?.id)
  const modelviewindex = modelviews?.findIndex((m: any, index) => index && (m?.id === focusModelview?.id))
  const metamodels = props.metis?.metamodels
  const mmodel = metamodels?.find((m: any) => m?.id === model?.metamodelRef)

  const toggleShowContext = () => {
    // dispatch({ type: 'SET_VISIBLE_CONTEXT', data: !props.phUser.appSkin.visibleContext  })
    // setVisibleContext(!visibleContext)
    SaveAkmmUser({ ...memoryAkmmUser, visibleContext }, locStateKey = 'akmmUser')
    // setMemoryAkmmUser({...memoryAkmmUser, visibleContext: !visibleContext})
    if (debug) console.log('182 toggleShowContext', memoryAkmmUser, visibleContext)
  }

  const toggleIsExpanded = () => { setIsExpanded(!isExpanded) }

  useEffect(() => { // set activTab when focusModelview.id changes
    if (debug) useEfflog('55 Modeller useEffect 1 [props.phFocus.focusModelview?.id] : ', activeTab, activetabindex, props.phFocus.focusModel?.name);
    setActiveTab(activetabindex)
  }, [props.phFocus?.focusModelview?.id])
  // }, [props.phFocus.focusModelview?.id])

  // ------------------------------
  // const gojsmodel = (props.myGoModel?.nodes) ? {nodeDataArray: props.myGoModel?.nodes, linkDataArray: props.myGoModel?.links} : [];
  const gojsmodel = props.gojsModel;
  if (debug) console.log('65 Modeller: gojsmodel', props, gojsmodel?.nodeDataArray);

  let seltasks = props.phFocus?.focusRole?.tasks || []
  let focusTask = props.phFocus?.focusTask
  let locStateKey
  const showDeleted = props.phUser?.focusUser?.diagram?.showDeleted
  const showModified = props.phUser?.focusUser?.diagram?.showModified

  function dispatchLocalStore(locStore) {
    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: locStore.phData })
    dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: locStore.phFocus })
    dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: locStore.phSource })
    dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: locStore.phUser })
  }

  function toggleObjects() { setVisiblePalette(!visibleObjects); }

  function toggleRefreshObjects() {
    if (debug) console.log('75 Modeller: toggleRefreshObjects', memoryLocState.phFocus);
    saveModelsToLocState(props, memoryLocState, setMemoryLocState)
    if (debug) console.log('78 Modeller: toggleRefreshObjects', props);
    if (debug) console.log('79 Modeller: toggleRefreshObjects', memoryLocState.phFocus);
    setRefresh(!refresh)
  }

  // function loadLocalStorageModel() {
  //   if (debug) console.log('94 Modeller: loadLocalStorageModel', memoryLocState);
  //   if (Array.isArray(memoryLocState) && memoryLocState[0]) {
  //     const locStore = (memoryLocState[1])
  //     if (locStore) {
  //       dispatchLocalStore(locStore) // dispatch to store the lates [0] from local storage
  //       // data = {id: locStore.phFocus.focusModelview.id, name: locStore.phFocus.focusModelview.name}
  //       // console.log('modelling 73 ', data)
  //     }
  //   }
  //   if (debug) console.log('97 Modeller: loadLocalStorageModel', memoryLocState[0].phFocus);
  //   setRefresh(!refresh)
  // }

  // if (debug) console.log('83 Modeller: props, refresh', props, refresh);

  // function saveModelsToLocState(props: any, memoryLocState: any, setMemoryLocState: any) {
  //   const propps = {
  //     phData: props.phData,
  //     phFocus: props.phFocus,
  //     phUser: props.phUser,
  //     phSource: props.phSource,
  //   }
  //   setMemoryLocState(SaveModelToLocState(propps, memoryLocState))
  //   SaveAkmmUser(props, 'akmmUser')
  // }

  useEffect(() => {
    const propps = {
      phData: props.phData,
      phFocus: props.phFocus,
      phUser: props.phUser,
      phSource: props.phSource,
    }
    if (debug) console.log('163 Modeller useEffect 2, props.phFocus.focusModelview?.id] : ', props.phFocus.focusModelview?.id, propps);
    setMemoryLocState(propps)

    // setMemoryLocState(SaveModelToLocState(propps, memoryLocState))
    const timer = setTimeout(() => {
      SaveAkmmUser(props, 'akmmUser')
    }, 250);
    return () => clearTimeout(timer);
  }, [props.phFocus?.focusObjectview?.id])

  // const selmods = {models, model}//(models) && { models: [ ...models?.slice(0, modelindex), ...models?.slice(modelindex+1) ] }
  // const selmodviews = {modelviews, modelview}//(modelviews) && { modelviews: [ ...modelviews?.slice(0, modelviewindex), ...modelviews?.slice(modelviewindex+1) ] }

  // put current modell on top 
  const selmods = (models) ? [
    models[modelindex],
    ...models.slice(0, modelindex),
    ...models.slice(modelindex + 1, models.length)
  ]
    : []
  const selmodviews = modelviews

  if (debug) console.log('180 Modeller', mmodel, focusModelview, selmods, selmodviews);
  let selmodels = selmods?.filter((m: any) => m && (!m.markedAsDeleted))
  // let selmodelviews = selmodviews?.map((mv: any) => mv && (!mv.markedAsDeleted))
  // if (debug) console.log('48 Modeller', focusModel?.name, focusModelview?.name);

  const handleProjectChange = (event) => { // Editing project name
    if (debug) console.log('186 Modeller: handleProjectChange', event);
    setProjectName(event.target.value);
  }
  const handleProjectBlur = () => { // finish editing project name
    if (debug) console.log('190 Modeller: handleProjectChange', projectName);
    dispatch({ type: 'UPDATE_PROJECT_PROPERTIES', data: { name: projectName } }); // update project name
    // dispatch({ type: 'UPDATE_PROJECT_PROPERTIES', data: { name: displayValue } }); // update project name
    dispatch({ type: 'SET_FOCUS_PROJ', data: { id: displayValue, name: displayValue } }); // set focus project
  }

  const handleModelviewChange = (event) => { // Editing project name
    if (debug) console.log('186 Modeller: handleProjectChange', event);
    setMvName(event.target.value);
  }

  const handleModelviewBlur = () => { // finish editing project name
    if (debug) console.log('190 Modeller: handleProjectChange', displayValue);
    dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data: { name: displayValue } }); // update project name
    dispatch({ type: 'SET_FOCUS_MODELVIEW', data: { id: displayValue, name: displayValue } }); // set focus project
  }

  const handleSelectModelChange = (event: any) => { // Setting focus model
    if (debug) console.log('196 Selector', JSON.parse(event.value).name);
    const id = JSON.parse(event.value).id
    const name = JSON.parse(event.value).name
    const selObj = models.find((obj: any) => obj.id === id)
    if (debug) console.log('200 Selector', selObj);
    let data
    if (selObj && selObj.name !== 'Select ' + props.selName + '...') {
      if (debug) console.log('203 Selector', selObj.name);
      data = { id: id, name: name }
      dispatch({ type: 'SET_FOCUS_MODEL', data: data })
      const mv = selObj.modelviews[0]
      const data2 = { id: mv.id, name: mv.name }
      dispatch({ type: 'SET_FOCUS_MODELVIEW', data: data2 })
      if (debug) console.log('209 Selector', data, data2);
      // const timer = setTimeout(() => {
      //   GenGojsModel(props, dispatch);
      // }, 1000);
      // setRefresh(!refresh)
      // return () => clearTimeout(timer);
    }
  }

  // const handleMVDoubleClick = (e) => {
  //   <input type="text" value={e.value} onChange={handleMVChange} />
  // }

  const options = selmodels && ( //sf TODO:  modelview is mapped 2 times 
    selmodels.map((m: any, index) => (m) && (m.name !== 'Select ' + props.selName + '...') &&
      <option key={m.id + index} value={JSON.stringify({ id: m.id, name: m.name })}>{m.name}</option>)
  )

  // Selector for selecting models ---------------------------------------------------------
  const selector = //(props.modelType === 'model' || props.modelType === 'modelview' ) 
    // <div className="Selector--menu d-flex gap-1 border border-rounded rounded-4 border-4">
    <div className="Selector--menu d-flex justify-content-between gap-2 pt-1">
      <div className="d-flex ">
        <label className="Selector--menu-label border-top border-bottom border-success bg-light px-2 pt-1 text-nowrap "
          data-toggle="tooltip" data-placement="top" data-bs-html="true"
          title={
            `Description : ${props.metis.description} 
            
            To change Project Name : 
            Edit this field and click on the Save button.
            
            or Right-click the background below and select 'Edit Project Name'. 
            
            The suffix '.json' will be added to the filename.`
          }><span className="bg-light"> Project : </span>
        </label>
        <input
          className=" px-2"
          style={{ width: '300px' }}
          type="text"
          value={projectName}
          onChange={handleProjectChange}
          onBlur={handleProjectBlur}
        />
        {/* <input className=" px-2" style={{ width: '300px' }} label="test" type="text" value={props.metis.name} onBlur={(event) => handleProjectChange({ value: event.target.value })} onChange={(event) => handleProjectChange({ value: event.target.value })} /> */}
      </div>

      <span className="model-selection border-top border-bottom border-success bg-light px-2 text-nowrap" data-toggle="tooltip" data-placement="top" data-bs-html="true"
        title={
          `Description: ${model?.description}
    
To change Model name, rigth click the background below and select 'Edit Model'.`
        }> <span className="bg-light"> Model : </span>
        <select key='select-title' className="list-obj" style={{ minWidth: "32%" }}
          value={JSON.stringify({ id: focusModel?.id, name: focusModel?.name })}
          onChange={(event) => handleSelectModelChange({ value: event.target.value })}
        >
          {/* onChange={(event) => handleSelectModelChange({ value: event.target.value })} name={`Focus ${props.selName} ...`}> */}
          {options}
        </select>
      </span>
    </div>

  activetabindex = (modelviewindex < 0) ? 0 : modelviewindex  // if no focus modelview, then set to 0
  // ToDo: remember last current modelview for each model, so that we can set focus to it when we come back to the that model 
  // activetabindex = (modelviewindex < 0) ? 0 : (modelviewindex) ? modelviewindex : focusModelviewIndex //selmodelviews?.findIndex(mv => mv.name === modelview?.name)
  if (debug) console.log('78 Modeller', focusModel?.name, focusModelview?.name, activetabindex);

  let ndarr = props.gojsMetamodel?.nodeDataArray
  let taskNodeDataArray: any[] = ndarr

  if (debug) console.log('176 taskNodeDataArray', taskNodeDataArray, ndarr, props.gojsMetamodel);
  // ================================================================================================
  // Show all the objects in this model
  // const gojsmodelObjects = props.gojsModelObjects
  // const exportToSvg = () => {
  //   if (!this.diagramRef.current) return;
  //   const diagram = this.diagramRef.current.getDiagram();
  //   if (!diagram) return;
  //   console.log('3521 Diagram :', myModel.name);
  //   const svg = diagram.makeSvg({ scale: .4, background: 'lightgray' });
  //   const svgString = new XMLSerializer().serializeToString(svg).replace(/'/g, "\\'");;
  //   console.log('SVG string:', svgString);
  //   // Create a Blob from the SVG string
  //   const blob = new Blob([svgString], { type: 'image/svg+xml' });
  //   SaveModelviewToSvgFile(blob, myModel.name, "_MV.", "image/svg+xml")
  //   // Revoke the old Blob URL and create a new one
  //   // if (downloadUrl) {
  //   //   URL.revokeObjectURL(downloadUrl);
  //   // }
  //   // setDownloadUrl(URL.createObjectURL(blob))
  // };
  // let objArr = props.myMetis.gojsModel?.model.objects

  const handleExportSvgReady = (exportSvgFunction, isReady) => {
    setExportSvg(() => exportSvgFunction);
    setDiagramReady(isReady);
  };

  const handleExportClick = async () => {
    console.log('294 handleExportClick', exportSvg);
    if (exportSvg) {
      const svg = await exportSvg();
      if (svg) {
        const svgString = new XMLSerializer().serializeToString(svg).replace(/'/g, "\\'");;
        // console.log('SVG string:', svgString);
        // Create a Blob from the SVG string
        // const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const proj = props.phFocus.focusProj.name
        const model = focusModel.name
        const modelview = focusModelview?.name
        const filename = `${proj}_${model}_${modelview}`.replace(/ /g, "-")
        alert('A SVG-file of this modelview will be downloaded to your computer make sure you save it with the name: \n ' + filename + '.svg')
        SaveModelviewToSvgFile(svgString, filename)
      } else {
        console.log('SVG is not ready yet');
      }
    }
  };

  seltasks = (props.phFocus?.focusRole?.tasks) && props.phFocus?.focusRole?.tasks?.map((t: any) => t)
  let ndArr = props.gojsModelObjects?.nodeDataArray
  let ldArr = props.gojsModelObjects?.linkDataArray || []

  const ndTypes = ndArr?.map((nd: any) => nd.typename)
  const uniqueTypes = [...new Set(ndTypes)].sort();

  if (debug) console.log('349 Modeller ndTypes', uniqueTypes);
  // let ndArr = props.gojsModel?.nodeDataArray
  const nodeArray_all = ndArr
  // filter out the objects that are marked as deleted
  const objectsNotDeleted = nodeArray_all?.filter((node: { markedAsDeleted: boolean; }) => node && node.markedAsDeleted === false)
  if (debug) console.log('365 nodeArray_all', nodeArray_all, objectsNotDeleted);

 

  const handleSetObjFilter = (filter: React.SetStateAction<string>) => {
    if (debug) console.log('Palette handleSetOfilter', filter);
    setOfilter(filter)
    // gojstypes =  {nodeDataArray: filteredArr, linkDataArray: ldarr}
    toggleRefreshObjects()
  }

  {/* <div style={{transform: "scale(0.9)" }}> */ }
  // const selectedObjDiv = (
  //   <div >
  //     {<button className="btn bg-light btn-sm " onClick={() => { handleSetObjFilter('EntityType') }}>EntityType</button>}
  //     {<button className="btn bg-light btn-sm " onClick={() => { handleSetObjFilter('Property') }}>Property</button>}
  //   </div>
  // )

  let selectTaskDiv =
    <>
      <details><summary markdown="span"  >Modelling Task : </summary>
        <div className="seltask w-100">
          <Selector type='SET_FOCUS_TASK' selArray={seltasks} selName='Task' focusTask={focusTask} focustype='focusTask' refresh={refresh} setRefresh={setRefresh} />
        </div>
      </details>
      <div>{focusTask?.name}</div>
    </>

  // // filter out all objects of type 
  // setOfilteredArr(objectsNotDeleted?.filter((node: { typename: string; }) => node && (node.typename !== 'Container')))
  if (debug) console.log('354 Palette ofilteredArr', ofilteredArr, objectsNotDeleted, ndArr);
  // if (ofilter === 'Sorted') setOfilteredArr = roleTaskObj
  // if (ofilter === '!Property') ofilteredArr = noPropertyObj
  // let gojsobjects =  {nodeDataArray: ndArr, linkDataArray: []}

  // setGojsobjects({ nodeDataArray: ofilteredArr, linkDataArray: ldArr })

  useEffect(() => {
    const initialArr = objectsNotDeleted?.filter((node: { typename: string; name: string; }) => node);
    const sortedArr = initialArr?.sort((a: { name: string; }, b: { name: string; }) => (a.name > b.name) ? 1 : -1);
    const sortedByType = uniqueTypes.map((t: any) => initialArr?.filter((node: { typename: string; }) => node && (node.typename === t)))
    console.log('403 Palette ofilteredOnTypes', initialArr, sortedArr, sortedByType, uniqueTypes, selectedOption);

    if  (selectedOption === 'Objects in this Modelview') {
      const nodesInThisModelview = props.gojsModelObjects?.nodeDataArray?.filter((node: { modelviewRef: any; }) => node && (node.modelviewRef === focusModelview?.id))
      const nodeArr = nodesInThisModelview;
      setGojsobjects({ nodeDataArray: nodeArr, linkDataArray: ldArr });
    } else if (selectedOption === 'All Sorted Alphabetical') {
      setGojsobjects({ nodeDataArray: sortedArr, linkDataArray: ldArr });
    } else if (selectedOption === 'All Sorted by Type') {
      const nodeArr = sortedByType.flat();
      console.log('409 Palette ofilteredOnTypes', sortedByType, nodeArr);
      setGojsobjects({ nodeDataArray: nodeArr, linkDataArray: ldArr });
    } else {
      const selOfilteredArr = objectsNotDeleted?.filter((node: { typename: string; }) => node && (node.typename === uniqueTypes[selectedOption]));
      if (debug) console.log('394 Palette ofilteredOnTypes', selOfilteredArr, uniqueTypes[selectedOption]);
      // setOfilteredArr(selOfilteredArr);
      setGojsobjects({ nodeDataArray: selOfilteredArr, linkDataArray: ldArr });
      if (debug) console.log('407 Palette ofilteredOnTypes', selOfilteredArr, gojsobjects);
      setRefresh(!refresh)
    }
    if (gojsobjects?.nodeDataArray?.length > 0) setVisiblePalette(true)
  }, [selectedOption])

  if (debug) console.log('360  Modeller', gojsobjects.nodeDataArray, gojsobjects.linkDataArray, gojsobjects);

  const objArr = taskNodeDataArray
  // Hack: if viewkind === 'Container' then set isGroup to true
  if (debug) console.log('269 objArr', props.gojsModel, objArr)
  for (let i = 0; i < objArr?.length; i++) {
    if (objArr[i]?.viewkind === 'Container') {
      objArr[i].isGroup = true;
    }
  }
  if (debug) console.log('274 objArr', objArr)

  const navitemDiv = (!selmodviews) ? <></> : selmodviews.map((mv, index) => {  // map over the modelviews and create a tab for each
    if (mv && !mv.markedAsDeleted) {
      const strindex = index.toString()
      const data = { id: mv.id, name: mv.name }
      const data2 = { id: Math.random().toString(36).substring(7), name: strindex + 'name' }
      // GenGojsModel(props, dispatch);
      // if (debug) console.log('90 Modeller', activeTab, activetabindex , index, strindex, data)
      return (
        <NavItem key={strindex} className="model-selection" data-toggle="tooltip" data-placement="top" data-bs-html="true"
          title={
            `Description: ${modelview?.description}

To change Modelview name, rigth click the background below and select 'Edit Modelview'.`
          }>
          <NavLink style={{ paddingTop: "0px", paddingBottom: "6px", border: "solid 1px", borderBottom: "none", borderColor: "#eee gray white #eee", color: "black" }}
            className={classnames({ active: activeTab == strindex })}
            onClick={() => { dispatch({ type: 'SET_FOCUS_MODELVIEW', data }) }}
          >
          {/* <input
            className="form-control form-control-sm"
            // style={{ width: '300px' }}
            type="text"
            value={data.name}
            onChange={handleModelviewChange}
            onBlur={handleModelviewBlur}
          /> */}
            {mv.name}
          </NavLink>
        </NavItem>
      )
    }
  })

  const gojsapp = (gojsmodel) && // this is used both for the metamodelview and the modelview
    <GoJSApp
      nodeDataArray={gojsmodel.nodeDataArray}
      linkDataArray={gojsmodel.linkDataArray}
      metis={props.metis}
      myMetis={props.myMetis}
      myGoModel={props.myGoModel}
      myGoMetamodel={props.myGoMetamodel}
      phFocus={props.phFocus}
      dispatch={props.dispatch}
      modelType={props.phFocus.focusTab}
      onExportSvgReady={handleExportSvgReady}
    />

  const handleSelectOTypes = (event: any) => {
    if (debug) console.log('Palette handleSelectOTypes', event.target.value);
    setSelectedOption(event)
   
  }

    const  SelectOTypes =  (
      <>
        <select
          className="select-field mx-1 text-secondary"
          style={{ width: "98%" }}
          // value={uniqueTypes[selectedOption]}
          onChange={(e) => handleSelectOTypes(e.target.value)}
        >
          <option value="" key="01">
            Filter/Sort Objects
          </option>
          <option key="02">
            Objects in this Modelview
          </option>
          <option key="03">
            All Sorted Alphabetical
          </option>
          <option key="04">
            All Sorted by Type
          </option>
          {uniqueTypes.map((t: any, index) => (
            <option key={index} value={index}>{t}</option>
          ))}
        </select>
      </>
    );

  const modelviewTabDiv = // this is the modelview tabs
    <>
      <Nav tabs >
        {navitemDiv}
        <NavItem >
          <button className="btn px-2 border-white text-white float-right" data-toggle="tooltip" data-placement="top" data-bs-html="true"
            title=" Modelling:&#013;Insert an Object: Click on an Object Type in the Palette (the left) and drag and drop it into the Modelling area below.&#013;&#013;
                    Connect two objects: &#013;Position the cursor on on the edge of one object (An arrow appears) and drag and drop to another object to make a relationshop between them."
            style={{ background: "#aaccdd" }}> ?
          </button>
        </NavItem>
      </Nav>
      <TabContent >
        <TabPane  >
          <div className="workpad bg-white border-light mt-0 p-1 ">
            {gojsapp}
            {/* {refresh ? <> {gojsapp} </> : <>{gojsapp}</>} */}
          </div>
        </TabPane>
      </TabContent>
    </>

  const metamodelTabDiv =
    <>
      <div className="workpad p-1">
        {gojsapp}
        {/* {refresh ? <> {gojsapp} </> : <>{gojsapp}</>} */}
      </div>
    </>

  const objectsTabDiv =
    <>
      {/* <div className="mmname mx-0 px-1 mb-1" style={{fontSize: "16px", minWidth: "184px", maxWidth: "212px"}}>{selectedObjDiv}</div> */}
      <div className="workpad p-1 pt-2 bg-white">
        {/* {selectTaskDiv} */}
          <div className="modellingtask bg-light w-100" >
        {SelectOTypes}
          <div className="mmname mx-0 px-3 my-1 bg-light" style={{ fontSize: "16px", minWidth: "184px", maxWidth: "212px" }}>{uniqueTypes[selectedOption]}</div>
        </div>
        <GoJSPaletteApp // this is the Objects list
          divClassName="diagram-component-objects"
          nodeDataArray={gojsobjects.nodeDataArray}
          linkDataArray={gojsobjects.linkDataArray}
          metis={props.metis}
          myMetis={props.myMetis}
          myGoModel={props.myGoModel}
          phFocus={props.phFocus}
          dispatch={props.dispatch}
          diagramStyle={{ height: "82vh" }}
        />
      </div>
    </>



  const footerButtonsDiv =
    <div className="modeller--footer-buttons d-flex justify-content-end" data-placement="top" title="Modelview footer area" >
      <span className="btn mx-2 py-0 mt-1 pt-1 bg-gray border" onClick={handleExportClick} data-toggle="tooltip" data-placement="top" title="Export to Svg file" style={{ fontSize: "12px" }}>Export Modelview to Svg </span>
      {/* <span className="btn mx-2 py-0 mt-1 pt-1 bg-light text-secondary" onClick={toggleRefreshObjects} data-toggle="tooltip" data-placement="top" title="Save current state to LocalStorage" style={{ fontSize: "12px" }}> {refresh ? 'save2memory' : 'save2memory'} </span>
      <span className="btn mx-2 py-0 mt-1 pt-1 bg-light text-secondary" onClick={loadLocalStorageModel} data-toggle="tooltip" data-placement="top" title="Get last saved from LocalStorage" style={{ fontSize: "12px" }}> {refresh ? 'getMemory' : 'getmemory'} </span> */}
      {/* <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Zoom all diagram">Zoom All</button>
    <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle relationhip layout routing">Toggle relationship layout</button>
    <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle relationhip show relship name">Toggle relationships name</button>
    <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Zoom to objectview in focus">Zoom to Focus</button> */}
      <button className="btn bg-secondary mt-1 py-0 mx-2 px-2 "
        data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle show/ hide modified object/relship-views" style={{ fontSize: "12px" }}
        onClick={() => {
          dispatch({ type: 'SET_USER_SHOWMODIFIED', data: !showModified });
          dispatch({ type: 'SET_FOCUS_REFRESH', data: { id: Math.random().toString(36).substring(7), name: 'name' } })
        }} > {(showModified) ? ' Hide modified' : 'Show modified'}
      </button>
      <button className="btn bg-secondary mt-1 py-0 mx-1 px-2"
        data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle show/ hide deleted object/relship-views" style={{ fontSize: "12px" }}
        onClick={() => {
          dispatch({ type: 'SET_USER_SHOWDELETED', data: !showDeleted });
          dispatch({ type: 'SET_FOCUS_REFRESH', data: { id: Math.random().toString(36).substring(7), name: 'name' } })
        }} > {(showDeleted) ? ' Hide deleted' : 'Show deleted'}
      </button>
      {/* <button className="btn-sm text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="&#013;"></button> */}
      <span className="sourceName m-2 px-2" style={{ textAlign: "right", minWidth: "130px", maxHeight: "22px", backgroundColor: "#eee" }}>
        Current source:  {props.phSource}
      </span>
    </div>

  if (debug) console.log('372 Modeller ', props.modelType)


  const modellerDiv =
    (props.modelType === 'model')
      ? // modelling
      <div className="modeller-workarea w-100" >
        <div className="modeller--topbar d-flex justify-content-between mt-1 p-0 ">
          <span className="--heading d-flex text-dark fw-bold px-2" style={{ minWidth: "15%" }} > Modeller </span>
          <div className="d-flex justify-content-around align-items-center me-4">
            <div className="modeller--heading-selector">{selector}</div>
            {/* <span className="btn px- py-0 mt-0 pt-1 bg-light text-secondary" 
              style={{scale: "0.8"}} onClick={toggleRefreshObjects} data-toggle="tooltip" data-placement="top" title="Refresh the modelview" > 
              {refresh ? 'save2memory' : 'save2memory'} 
            </span> */}
            <button className="btn bg-light text-success ms-2 btn-sm"
              data-toggle="tooltip" data-placement="top" data-bs-html="true"
              title="Open the Focus Object in a Modal window!"
              onClick={handleShowModal} style={{ scale: "0.9" }} 
              >
              <i className="fa fa-lg fa-external-link"></i> 
            </button>  {/* show Context ---------------------------------------------------   */}
              {/*  onClick={toggleShowContext} style={{ scale: "0.9" }} >✵</button>  */}
          </div>
        </div>
        <div className="modeller--workarea-objects m-0 p-0" >
          <Row className="m-0">           
            <Col className="modeller--workarea-objects mx-0 px-0 mt-0 col-auto "> {/* Objects pane  column */}
              <div className="modeller--workarea-objects-content mt-2 border border-secondary" style={{ height: "82vh" }} >
                <div className="d-flex justify-content-between">
                  <button 
                    className="btn-sm px-1 m-0 text-left " style={{ backgroundColor: "#a0caca", outline: "0", borderStyle: "none" }}
                    onClick={toggleObjects} 
                    data-toggle="tooltip" 
                    data-placement="top" 
                    title="List of all the Objects in this Model (This also include object with no Objectviews) &#013;&#013;Drag objects from here to the modelling area to include it in current Objectview"> 
                    {visibleObjects ? <span> &lt;- Objects </span> : <span> -&gt;</span>}
                  </button>
                  <button 
                    className="btn-sm px-1 m-0 text-left " 
                    style={{ backgroundColor: "#a0caca", outline: "0", borderStyle: "none" }}
                    onClick={toggleIsExpanded} 
                    data-toggle="tooltip" data-placement="top" title=" &#013;&#013;"> 
                    {visibleObjects ? (isExpanded) ? <span> &lt; - &gt; </span> : <span>&lt; -- &gt;</span> : <span></span>}
                  </button>
                </div>
                {(visibleObjects)
                  ? (objectsTabDiv)
                    ? (isExpanded)
                      ? <><div className="btn-horizontal bg-light mx-0 px-1 mb-1" style={{ fontSize: "11px", minWidth: "466px", maxWidth: "666px" }}></div>{objectsTabDiv}</>
                      : <><div className="btn-horizontal bg-light mx-0 px-1 mb-1" style={{ fontSize: "11px", minWidth: "166px", maxWidth: "166px" }}></div>{objectsTabDiv}</>
                    : <div className="btn-horizontal bg-light mx-0 px-1 mb-1" style={{ fontSize: "11px", minWidth: "166px", maxWidth: "166px" }}></div>
                  : <div className="btn-vertical px-1 text-center " style={{ height: "78vh", maxWidth: "20px", padding: "0px", fontSize: "12px" }}><span> O b j e c t s </span> </div>
                }
              </div>
            </Col>
            <Col className="modeller--workarea-modelling px-1 "> {/* Modelview tabs and footer buttons  column */}
              <div className="mt-2">
                {modelviewTabDiv}
              </div>
              {footerButtonsDiv}
            </Col>
            {/* show Context ------------------------------------------------------------------------------ */}
            <Col className="col3 mx-0 my-2 p-0 " xs="auto" style={{ backgroundColor: "#cdd" }}>
              {/* {(visibleContext) ? <ReportModule props={props} /> : <></>} */}
            </Col>
          </Row>
        </div>

          <Modal show={showModal} onHide={handleCloseModal}  style={{ marginLeft: "200px", marginTop: "100px", backgroundColor: "#acc" }} >
            <Modal.Header closeButton>
              <Modal.Title>Report Module</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-transparent">
              <ReportModule props={props} reportType="object" edit={true} modelInFocusId={props.phFocus.focusModel.id} edit={true}/>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>

      </div >
      : // metamodelling
      <div className="modeller-workarea w-100" > {/*data-placement="top" title="Modelling workarea" > */}
        <div className="modeller--topbar  mt-1 p-0 ">
          <span className="modeller--heading float-left text-dark m-0 p-0 ms-2 mr-2 fs-6 fw-bold lh-2" style={{ minWidth: "8%" }}>Meta-Modeller</span>
          <div className="">
            <div className="modeller--heading-selector d-flex justify-content-between me-4" title="Modeller heading area" > <span className="mt-1 ms-2 px-2 " style={{ backgroundColor: '#bcd' }} >Metamodel : {mmodel.name}</span> {selector}</div>
          </div>
          <div>
            {metamodelTabDiv}
          </div>
        </div>
        {footerButtonsDiv}
      </div>

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }} >
      {refresh ? <> {modellerDiv} </> : <>{modellerDiv}</>}
    </div>
  )
}

export default Modeller;



