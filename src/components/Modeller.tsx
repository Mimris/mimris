// modeller
// @ts-nocheck

import React, { useState, useEffect } from "react";
import { useDispatch } from 'react-redux';
import useLocalStorage  from '../hooks/use-local-storage'
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import GoJSApp from "./gojs/GoJSApp";
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
import Selector from './utils/Selector'
import GenGojsModel from './GenGojsModel'
import { handleInputChange } from "../akmm/ui_modal";
import { disconnect } from "process";
import { SaveModelToLocState } from "./utils/SaveModelToLocState";
// import { addNodeToDataArray } from "../akmm/ui_common";

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

  const [refresh, setRefresh] = useState(false)
  const [activeTab, setActiveTab] = useState();
  const [ofilter, setOfilter] = useState('All')
  const [visibleObjects, setVisiblePalette] = useState(false)

  const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', null); //props);

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

  // ---------------------  useEffects --------------------------------
  // useEffect(() =>  { // when focusModel changes
  //   if (debug) useEfflog('39 Modeller useEffect 1 doing nothing', activeTab, props.phFocus.focusModel); 
  // //   const timer = setTimeout(() => {
  // //     setRefresh(!refresh)
  // //   }, 5000);
  // //   return () => clearTimeout(timer);
  // }, [focusModel.id])

  useEffect(() => { // set activTab when focusModelview.id changes
    // GenGojsModel(props, dispatch)
    setActiveTab(activetabindex)
  //   if (props.phFocus.focusModelview.id !== modelviews[0].id) {
      if (debug) useEfflog('50 Modeller useEffect 2', modelviews[0].id, props.phFocus.focusModelview?.id); 
  //     const timer = setTimeout(() => {
  //       setRefresh(!refresh)
  //       dispatch({type: 'SET_FOCUS_REFRESH', data:  {id: Math.random().toString(36).substring(7), name: 'refresh'}})
  //     }, 2000);
  //     return () => clearTimeout(timer);
  //   } 
  }, [props.phFocus.focusModelview?.id])
  
  // useEffect(() => { // when project changes
  //   if (debug) useEfflog('100 Modeller useEffect 3', props, props.metis.name);
  //   // // GenGojsModel(props, dispatch)
  //   // // dispatch({ type: 'SET_FOCUS_MODEL', data: {id: props.metis?.models[0]?.id, name: props.metis?.models[0]?.name} })
  //   // // dispatch({ type: 'SET_FOCUS_MODELVIEW', data: {id: props.metis?.models[0]?.modelviews[0]?.id, name: props.metis?.models[0]?.modelviews[0]?.name} })
  //   // const timer = setTimeout(() => {
  //   //   // toggleRefreshObjects()
  //     GenGojsModel(props, dispatch)
  //   //   // setRefresh(!refresh)
  //   // }, 100);
  //   // const timer2 = setTimeout(() => {
  //   //   // toggleRefreshObjects()
  //   //   // GenGojsModel(props, dispatch)
  //   //   // setRefresh(!refresh)
  //   // }, 1000);

  //   // return () => clearTimeout(timer,timer2); 
  // }, [props.phData?.metis.name])
  
  // ------------------------------

  const gojsmodel = props.gojsModel;
  if (debug) console.log('78 Modeller: gojsmodel', props, gojsmodel?.nodeDataArray);
  
  let myMetis = props.myMetis;
 
  let seltasks = props.phFocus?.focusRole?.tasks || []
  let focusTask = props.phFocus?.focusTask
  const showDeleted = props.phUser?.focusUser?.diagram?.showDeleted
  
  function toggleObjects() { setVisiblePalette(!visibleObjects); } 
  
  function toggleRefreshObjects() { 

    if (debug) console.log('89 Modeller: toggleRefreshObjects', props, memoryLocState, setMemoryLocState);

    SaveModelToLocState(props, memoryLocState, setMemoryLocState)

    GenGojsModel(props, dispatch)

    // save current state to memory
    let mdata = (memoryLocState && Array.isArray(memoryLocState)) ? [{phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser}, ...memoryLocState] : [{phData: props.phData, phFocus: props.phFocus,phSource: props.phSource, phUser: props.phUser}];
    if (debug) console.log('84 Modelling save memoryState', mdata);
    // if mdata is longer than 10, remove the last 2 elements
    if (mdata.length > 2) {mdata = mdata.slice(0, 2)}
    if (mdata.length > 2) { mdata.pop() }
    if (debug) console.log('88 Modelling refresh', mdata);
    (typeof window !== 'undefined') && setMemoryLocState(mdata) // Save Project to Memorystate in LocalStorage at every refresh


    setTimeout(() => {
    dispatch({ type: 'SET_FOCUS_REFRESH', data: {id: Math.random().toString(36).substring(7), name: 'refresh'} })}
    , 1000);
  }
  // function toggleRefreshObjects() { setRefresh(!refresh); if (debug) console.log('25 Modeller toggleRefreshObjects', refresh);}

  if (debug) console.log('121 Modeller: props, refresh', props, refresh);

  // const selmods = {models, model}//(models) && { models: [ ...models?.slice(0, modelindex), ...models?.slice(modelindex+1) ] }
  // const selmodviews = {modelviews, modelview}//(modelviews) && { modelviews: [ ...modelviews?.slice(0, modelviewindex), ...modelviews?.slice(modelviewindex+1) ] }
  
  // put current modell on top 
  const selmods = (models) ? [
    models[modelindex],
    ...models.slice(0, modelindex),
    ...models.slice(modelindex+1, models.length)
  ]
  : []
  const selmodviews = modelviews
  
  if (debug) console.log('126 Modeller', mmodel, focusModelview, selmods, selmodviews);
  let selmodels = selmods?.filter((m: any) => m && (!m.markedAsDeleted))
  // let selmodelviews = selmodviews?.map((mv: any) => mv && (!mv.markedAsDeleted))
  // if (debug) console.log('48 Modeller', focusModel?.name, focusModelview?.name);
  // if (debug) console.log('49 Modeller', selmods, selmodels, modelviews, selmodviews);
  

  const handleProjectChange = (e) => { // Editing project name
    if (debug) console.log('69 Modeller: handleProjectChange', e);
    dispatch({ type: 'UPDATE_PROJECT_PROPERTIES', data: { name: e.value } }); // update project name
    dispatch({ type: 'SET_FOCUS_PROJ', data: { id: e.value, name: e.value } }); // set focus project
    }

  const handleSelectModelChange = (event: any) => { // Setting focus model
    if (debug) console.log('19 Selector', JSON.parse(event.value).name);
    const id = JSON.parse(event.value).id
    const name = JSON.parse(event.value).name
    const selObj = models.find( (obj: any) => obj.id === id ) 
    if (debug) console.log('86 Selector', selObj);
    // const workOnTypes = selObj.workOnTypes
    // const focustype = { id: id, name: name, workOnTypes: workOnTypes }
    const data = (selObj) ? { id: id, name: name} : { id: id, name: name }
    // if (debug) console.log('26 selector', JSON.parse(event.value), data, type);
    // dispatch({  type: 'UPDATE_MODEL_PROPERTIES', data: data })
    dispatch({  type: 'SET_FOCUS_MODEL', data: data })
    dispatch({ type: 'SET_FOCUS_REFRESH', data: {id: Math.random().toString(36).substring(7), name: 'refresh'} })
    const mv = selObj.modelviews[0]
    dispatch({ type: 'SET_FOCUS_MODELVIEW', data: {id: mv.id, name: mv.name} })
    // setRefresh(!refresh)
  }

  // const handleMVDoubleClick = (e) => {
  //   <input type="text" value={e.value} onChange={handleMVChange} />
  // }

  // const handleMVChange = (e) => {
  //   if (debug) console.log('69 Modeller: handleMVChange', e);
  //   dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data: { name: e.value } });
  // }

  const  options = selmodels && ( //sf TODO:  modelview is mapped 2 times 
    selmodels.map((m: any, index) => (m) && (m.name !== 'Select '+props.selName+'...') &&
    <option key={m.id+index} value={JSON.stringify({id: m.id, name: m.name})}>{m.name}</option>)
  )

  // Selector for selecting models
  const selector = //(props.modelType === 'model' || props.modelType === 'modelview' ) 
    <div className="Selector--menu  " >
      <label className="Selector--menu-label d-flex pt-2 justify-content-end gap-2"   
        data-toggle="tooltip" data-placement="top" data-bs-html="true" 
        title =  {
`Description : ${props.metis.description} 

To change Project Name : 
Edit this field and click on the Save button.

or Right-click the background below and select 'Edit Project Name'. 

The suffix '.json' will be added to the filename.`
        }> Project :  
        <input className="ml-2 w-50 px-1 " type="text" value={props.metis.name} onChange={(event) => handleProjectChange({value: event.target.value})} onBlur={(event) => handleProjectChange({ value: event.target.value })} style={{ minWidth: "26%"}} />
        <span className="model-selection  w-25" data-toggle="tooltip" data-placement="top" data-bs-html="true"  style={{width: "100%"}}
        title={
`Description: ${model?.description}
    
To change Model name, rigth click the background below and select 'Edit Model'.`
        }> Model :
          <select key='select-title' className="list-obj mx-2 " style={{ minWidth: "32%"}}
            value={JSON.stringify({id: focusModel?.id, name: focusModel?.name})}
            onChange={(event) => handleSelectModelChange({ value: event.target.value })} 
          >
          {/* onChange={(event) => handleSelectModelChange({ value: event.target.value })} name={`Focus ${props.selName} ...`}> */}
          {options}
          </select>
        </span> 
      </label>
    </div>

  activetabindex = (modelviewindex < 0) ? 0 : modelviewindex  // if no focus modelview, then set to 0
  // ToDo: remember last current modelview for each model, so that we can set focus to it when we come back to the that model 
  // activetabindex = (modelviewindex < 0) ? 0 : (modelviewindex) ? modelviewindex : focusModelviewIndex //selmodelviews?.findIndex(mv => mv.name === modelview?.name)
  if (debug) console.log('78 Modeller', focusModel?.name, focusModelview?.name, activetabindex);



  let ndarr = props.gojsMetamodel?.nodeDataArray
  let taskNodeDataArray: any[] = ndarr

  // ================================================================================================
  // Show all the objects in this model
  // const gojsmodelObjects = props.gojsModelObjects


  // let objArr = props.myMetis.gojsModel?.model.objects

  seltasks = (props.phFocus.focusRole?.tasks) && props.phFocus.focusRole?.tasks?.map((t: any) => t)
  let ndArr = props.gojsModelObjects?.nodeDataArray
  // let ndArr = props.gojsModel?.nodeDataArray
  const nodeArray_all = ndArr 
  // filter out the objects that are marked as deleted
  const objectsNotDeleted = nodeArray_all?.filter((node: { markedAsDeleted: boolean; }) => node && node.markedAsDeleted === false)
  if (debug) console.log('209 nodeArray_all', nodeArray_all, objectsNotDeleted);
  
  // // filter out all objects of type Property
  const roleTaskObj = objectsNotDeleted?.filter((node: { typename: string; }) => node && (node.typename === 'EntityType' ))
  const noPropertyObj = objectsNotDeleted?.filter((node: { typename: string; }) => node && (node.typename !== 'Property' ))
  if (debug) console.log('185 Palette noPropertyObj', noPropertyObj);

  const handleSetObjFilter = (filter: React.SetStateAction<string>) => {
    if (debug) console.log('Palette handleSetOfilter', filter);
    setOfilter(filter)
    // gojstypes =  {nodeDataArray: filteredArr, linkDataArray: ldarr}
    toggleRefreshObjects()
  }

  {/* <div style={{transform: "scale(0.9)" }}> */}
  const selectedObjDiv = (
    <div >
      { <button className= "btn bg-light btn-sm " onClick={() => { handleSetObjFilter('EntityType') }}>EntityType</button>}
      { <button className= "btn bg-light btn-sm " onClick={() => { handleSetObjFilter('Property') }}>Property</button>}
    </div>
  )

  let selectTaskDiv = 
  <>
    <details><summary markdown="span"  >Modelling Task : </summary>
      <div className="seltask w-100">
        <Selector type='SET_FOCUS_TASK' selArray={seltasks} selName='Task' focusTask={focusTask} focustype='focusTask'  refresh={refresh} setRefresh={setRefresh} />
      </div>
      </details>
    <div>{focusTask?.name}</div>
  </>

  // // filter out all objects of type 
  let ofilteredArr = objectsNotDeleted?.filter((node: { typename: string; }) => node && (node.typename !== 'Container' ))
  if (ofilter === 'Sorted') ofilteredArr = roleTaskObj
  if (ofilter === '!Property') ofilteredArr = noPropertyObj
  // let gojsobjects =  {nodeDataArray: ndArr, linkDataArray: []}
  let gojsobjects =  {nodeDataArray: ofilteredArr, linkDataArray: []}
  
  if (debug) console.log('253  Modeller', gojsobjects.nodeDataArray);

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
        const data = {id: mv.id, name: mv.name}
        const data2 = {id: Math.random().toString(36).substring(7), name: strindex+'name'}
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
              onClick={() => { dispatch({ type: 'SET_FOCUS_MODELVIEW', data }); toggleRefreshObjects() }}
              // onClick={() => { dispatch({ type: 'SET_FOCUS_MODELVIEW', data }); dispatch({ type: 'SET_FOCUS_REFRESH', data: {id: Math.random().toString(36).substring(7), name: strindex+'name'} }) }}
              // onDoubleClick={() => {handleMVDoubleClick({ value: data })}}
            > 
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
    />

  const modelviewTabDiv = // this is the modelview tabs
    <>
      <Nav tabs >
        {navitemDiv}  
        <NavItem >
          <button className="btn bg-warning text-white float-right"  data-toggle="tooltip" data-placement="top" data-bs-html="true" 
            title=" Modelling:&#013;Insert an Object: Click on an Object Type in the Palette (the left) and drag and drop it into the Modelling area below.&#013;&#013;
                    Connect two objects: &#013;Position the cursor on on the edge of one object (An arrow appears) and drag and drop to another object to make a relationshop between them.">?
          </button>
        </NavItem>
      </Nav>
      <TabContent > 
        <TabPane  >
          <div className="workpad bg-white mt-0 p-1 pt-2"> 
            {gojsapp}
            {/* {refresh ? <> {gojsapp} </> : <>{gojsapp}</>} */}
          </div>         
        </TabPane>
      </TabContent>
    </>

  const metamodelTabDiv = 
    <>
      <div className="workpad p-1 pt-2"> 
        {gojsapp}
        {/* {refresh ? <> {gojsapp} </> : <>{gojsapp}</>} */}
      </div>         
    </>

  const objectsTabDiv = 
    <>
      {/* <div className="mmname mx-0 px-1 mb-1" style={{fontSize: "16px", minWidth: "184px", maxWidth: "212px"}}>{selectedObjDiv}</div> */}
      <div className="workpad p-1 pt-2 bg-white">
        {/* {selectTaskDiv} */}
        <GoJSPaletteApp // this is the Objects list
          divClassName="diagram-component-objects"
          nodeDataArray={gojsobjects.nodeDataArray}
          linkDataArray={[]}
          metis={props.metis}
          myMetis={props.myMetis}
          myGoModel={props.myGoModel}
          phFocus={props.phFocus}
          dispatch={props.dispatch}
        />
      </div>
    </>

  if (debug) console.log('372 Modeller ', props.modelType) 

  const modellerDiv = 
    (props.modelType === 'model') 
    ? // modelling
      <div className="modeller-workarea" >
        <div className="modeller--topbar d-flex justify-content-between m-0 p-0 " >
          <span className="--heading text-dark m-0 p-1 ml-4 mr-4 fw-bold ph-2" >Modeller </span>
          <div className="modeller--heading-selector w-100">{selector}</div>
          <span className="btn px-2 py-0 mt-0 pt-1 bg-light text-secondary fs-7"  onClick={toggleRefreshObjects} data-toggle="tooltip" data-placement="top" title="Refresh the modelview" > {refresh ? 'refresh' : 'refresh'} </span>
        </div>
        <div className="modeller--workarea m-0 p-0">
          <Row className="m-0">
            <Col className="modeller--workarea-objects mx-0 px-0 mt-0 col-auto "> 
              <div className="modeller--workarea-objects-content mt-2 border border-dark" style={{    height: "81vh"}} >
                <button className="btn-sm px-1 m-0 text-left " style={{ backgroundColor: "#a0caca",  outline: "0", borderStyle: "none"}}
                  onClick={toggleObjects} data-toggle="tooltip" data-placement="top" title="List of all the Objects in this Model (This also include object with no Objectviews) &#013;&#013;
                  Drag objects from here to the modelling area to include it in current Objectview"> {visibleObjects ? <span> &lt;- Objects </span> : <span> -&gt;</span>} 
                </button>
                {/* <div className="myModeller mb-1 pl-1 pr-1" style={{ backgroundColor: "#ddd", height: "100%", border: "solid 1px black" }}> */}
                  {visibleObjects 
                    ? (objectsTabDiv) 
                      ? <><div className="btn-horizontal bg-light mx-0 px-1 mb-1" style={{  fontSize: "11px", minWidth: "166px", maxWidth: "166px"}}></div>{ objectsTabDiv }</> 
                      : <><div className="btn-horizontal bg-light mx-0 px-1 mb-1" style={{  fontSize: "11px", minWidth: "166px", maxWidth: "166px"}}></div>{ objectsTabDiv }</>
                    : <div className="btn-vertical px-1 text-center " style={{ height: "78vh", maxWidth: "20px", padding: "0px", fontSize: "12px"}}><span> O b j e c t s </span> </div>
                  }
                {/* </div> */}
              </div>
            </Col>
            <Col className="modeller--workarea-modelling px-1 ">
            {/* <Col className="modelller--workarea-modelling w-100"> */}
              <div className="mt-2">
                {modelviewTabDiv}
              </div>
              <div className="modeller--footer-buttons d-flex justify-content-end">
                {/* <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Zoom all diagram">Zoom All</button>
                <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle relationhip layout routing">Toggle relationship layout</button>
                <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle relationhip show relship name">Toggle relationships name</button>
                <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Zoom to objectview in focus">Zoom to Focus</button> */}
                <button className="btn bg-secondary mt-1 py-0 px-1" 
                  data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle show/ hide deleted objectviews" 
                  onClick={() =>     { dispatch({ type: 'SET_USER_SHOWDELETED', data: !showDeleted }) ; dispatch({ type: 'SET_FOCUS_REFRESH', data: {id: Math.random().toString(36).substring(7), name: 'name'} })}} > {(showDeleted) ? ' Hide deleted' : 'Show deleted' }
                  {/* onClick={() => { toggleShowDeleted(showDeleted); dispatch({ type: 'SET_USER_SHOWDELETED', data: showDeleted }) ; toggleRefresh() }}>{(showDeleted) ? 'Hide deleted' : 'Show deleted' } */}
                </button>
                {/* <button className="btn-sm text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="&#013;"></button> */}
                <span className="sourceName m-2 px-2" style={{ textAlign: "right", minWidth: "130px", maxHeight: "22px", backgroundColor: "#eee"}}>
                    Current source:  {props.phSource} 
                </span> 
              </div>
            </Col>
          </Row>
        </div>
      </div>
    : // metamodelling
      <div className="metamodeller-workarea mt-2 mb-2" style={{backgroundColor: "#7ac", minWidth: "100%" }}>
        <span className="btn px-2 py-0 mt-0 pt-1 bg-light text-primary"  onClick={toggleRefreshObjects} data-tog gle="tooltip" data-placement="top" title="Refresh the modelview" > {refresh ? 'refresh' : 'refresh'} </span>
        <span className="modeller--heading float-left text-dark m-0 p-0 ml-2 mr-2 fs-6 fw-bold lh-2" style={{ minWidth: "8%"}}>Metamodeller</span>
        <div className="modeller--heading-selector" style={{ transform: "scale(0.9)", transformOrigin: "right", minWidth: "100%" }}>{selector}</div>
        {metamodelTabDiv} 
        <style jsx>{`
        // .diagram-component {
          //   height: 80%;
          // }
          `}</style>
      </div>
  
  return (
    <div>
      {refresh ? modellerDiv : modellerDiv}
    </div>
  )
}

export default Modeller;
