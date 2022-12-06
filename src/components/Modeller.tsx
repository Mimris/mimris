
//modeller
// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useDispatch } from 'react-redux';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import GoJSApp from "./gojs/GoJSApp";
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
import Selector from './utils/Selector'
import genGojsModel from './GenGojsModel'
// import genRoleTasks from "./utils/SetRoleTaskFilter";
// import { addNodeToDataArray } from "../akmm/ui_common";

const debug = false;

const Modeller = (props: any) => {

  if (!debug) console.log('19 Modeller: props', props);
  if (!props.metis) return <> not found</>

  const dispatch = useDispatch();

  // if (!props.gojsModel)  return <></>

  const gojsmodel = props.gojsModel;
  if (debug) console.log('22 Modeller: gojsmodel', gojsmodel);
  
  let myMetis = props.myMetis;
  let activetabindex = 0
  let seltasks = props.phFocus?.focusRole?.tasks || []
  let focusTask = props.phFocus?.focusTask
  const [refresh, setRefresh] = useState(false)
  const [activeTab, setActiveTab] = useState();
  const showDeleted = props.phUser?.focusUser?.diagram?.showDeleted

  const [ofilter, setOfilter] = useState('All')
  const [visibleObjects, setVisiblePalette] = useState(false)

  function toggleObjects() { setVisiblePalette(!visibleObjects); } 
  function toggleRefreshObjects() { setRefresh(!refresh); if (debug) console.log('25', refresh);
   }

  if (debug) console.log('27 Modeller: props, refresh', props, refresh);

  let focusModel = props.phFocus?.focusModel
  let focusModelview = props.phFocus?.focusModelview
  const models = props.metis?.models
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const modelindex = models?.findIndex((m: any) => m?.id === focusModel?.id)
  const modelviews = model?.modelviews
  const modelview = modelviews?.find((m: any) => m?.id === focusModelview?.id)
  const modelviewindex = modelviews?.findIndex((m: any, index) => index && (m?.id === focusModelview?.id))
  const metamodels = props.metis?.metamodels
  const mmodel = metamodels?.find((m: any) => m?.id === model?.metamodelRef)

  // const selmods = {models, model}//(models) && { models: [ ...models?.slice(0, modelindex), ...models?.slice(modelindex+1) ] }
  // const selmodviews = {modelviews, modelview}//(modelviews) && { modelviews: [ ...modelviews?.slice(0, modelviewindex), ...modelviews?.slice(modelviewindex+1) ] }
  
  // put current modell on top 
  const selmods = [
    models[modelindex],
    ...models.slice(0, modelindex),
    ...models.slice(modelindex+1, models.length)
  ]
  const selmodviews = modelviews
  
  if (debug) console.log('36 Modeller', mmodel, focusModelview, selmods, selmodviews);
  let selmodels = selmods?.filter((m: any) => m && (!m.markedAsDeleted))
  // let selmodelviews = selmodviews?.map((mv: any) => mv && (!mv.markedAsDeleted))
  // if (debug) console.log('48 Modeller', focusModel.name, focusModelview.name);
  // if (debug) console.log('49 Modeller', selmods, selmodels, modelviews, selmodviews);

  const gojsapp = (gojsmodel) && 
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

  const handleChange = (e) => {
    if (debug) console.log('69 Modeller: handleChange', e);
    dispatch({ type: 'UPDATE_PROJECT_PROPERTIES', data: { name: e.value } });
  }
  const handleSelectModelChange = (event: any) => {
    if (debug) console.log('19 Selector', JSON.parse(event.value).name);
    const id = JSON.parse(event.value).id
    const name = JSON.parse(event.value).name
    const selObj = models.find( (obj: any) => obj.id === id ) 
    if (debug) console.log('86 Selector', selObj);
    // const workOnTypes = selObj.workOnTypes
    // const focustype = { id: id, name: name, workOnTypes: workOnTypes }
    const data = (selObj) ? { id: id, name: name} : { id: id, name: name }
    // if (debug) console.log('26 selector', JSON.parse(event.value), data, type);
    dispatch({  type: 'UPDATE_PROJECT_PROPERTIES', data: data })
    // setRefresh(!refresh)
  }
  // const handleMVDoubleClick = (e) => {
  //   <input type="text" value={e.value} onChange={handleMVChange} />
  // }

  // const handleMVChange = (e) => {
  //   if (debug) console.log('69 Modeller: handleMVChange', e);
  //   dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data: { name: e.value } });
  // }
  const type='SET_FOCUS_MODEL'
  const  options = selmodels && ( //sf TODO:  modelview is mapped 2 times 
    selmodels.map((m: any, index) => (m) && (m.name !== 'Select '+props.selName+'...') &&
    <option key={m.id+index} value={JSON.stringify({id: m.id, name: m.name})}>{m.name}</option>)
  )


  const selector = //(props.modelType === 'model' || props.modelType === 'modelview' ) 
    <div >
      <label className="Selector--menu-label "   
        data-toggle="tooltip" data-placement="top" data-bs-html="true" 
        title =  {
`Description : ${props.metis.description} 

To change Project Name : 
Edit this field and click on the Save button.

or Right-click the background below and select 'Edit Project Name'. 

The suffix '.json' will be added to the filename.`
        }> Project :  
        <input className="ml-2" type="text" defaultValue={props.metis.name} onBlur={(event) => handleChange({ value: event.target.value })} style={{ minWidth: "36%"}} />
        <span className="model-selection" data-toggle="tooltip" data-placement="top" data-bs-html="true"  style={{width: "100%"}}
        title={
`Description: ${model?.description}
    
To change Model name, rigth click the background below and select 'Edit Model'.`
        }> Model :
          <select key='select-title' className="list-obj mx-2" style={{ minWidth: "32%"}}
          onChange={(event) => handleSelectModelChange({ value: event.target.value })} name={`Focus ${props.selName} ...`}>
          {options}
          </select>
        </span> 
      </label>
    </div>


  activetabindex = (modelviewindex < 0) ? 0 : modelviewindex  // if no focus modelview, then set to 0
  // ToDo: remember last current modelview for each model, so that we can set focus to it when we come back to the that model 
  // activetabindex = (modelviewindex < 0) ? 0 : (modelviewindex) ? modelviewindex : focusModelviewIndex //selmodelviews?.findIndex(mv => mv.name === modelview?.name)
  if (debug) console.log('78 Modeller', focusModel.name, focusModelview.name, activetabindex);

  useEffect(() =>  {
    if (selmodviews?.length>0)
      if (activeTab != undefined || 0) {
        const data = {id: selmodviews[0].id, name: selmodviews[0].name}
        dispatch({ type: 'SET_FOCUS_MODELVIEW', data }) ;
        // setActiveTab(0)
        genGojsModel(props, dispatch);
    }
    if (debug) console.log('89 Modeller useEffect 1', activeTab); 
  }, [focusModel])

  useEffect(() => {
    if (debug) console.log('172 Modeller useEffect 3', props, activeTab); 
    // genGojsModel(props, dispatch);
    const model = models.find(m => m.id === focusModel?.id)
    if (model) {
      const modelviews = model.modelviews;
      if (modelviews?.length > 0) {
        if (debug) console.log('178 model', model);
        if (activeTab === 0) {
          const data = {id: model.modelviews[0].id, name: model.modelviews[0].name}
          if (debug) console.log('181 modelview', data);
          dispatch({ type: 'SET_FOCUS_MODELVIEW', data }) ;   
          if (debug) console.log('183 after dispatch');
          const timer = setTimeout(() => {
            setRefresh(!refresh)
          }, 1000);
          if (debug) console.log('187 after refresh: data', data);
          return () => clearTimeout(timer);
        }
      }
      if (debug) console.log('191 ', activeTab, activetabindex)
      setActiveTab(activetabindex)
    }
  }, [activeTab && (activeTab) && (activeTab !== activetabindex)])

  useEffect(() => {
    if (debug) console.log('195 Modeller useEffect 5', props); 
    genGojsModel(props, dispatch)
  }, [refresh])

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
  
  if (debug) console.log('165  gojsobjects', gojsobjects.nodeDataArray);
  
  useEffect(() => { // -----------------------------------------------------------------------------
    if (debug) console.log('86 Palette useEffect 2', props.phFocus.focusTask);
    taskNodeDataArray = props.phFocus.focusTask?.workOnTypes?.map((wot: any) => 
      ndarr?.find((i: { typename: any; }) => {
        return (i?.typename === wot) && i 
      })
    )
    seltasks = props.phFocus.focusRole?.tasks
    if (debug) console.log('151 seltasks', props.phFocus.focusRole, props.phFocus.focusRole?.tasks, seltasks)
    const timer = setTimeout(() => {
      toggleRefreshObjects() 
    }, 1000);
    return () => clearTimeout(timer);
}, [props.phFocus.focusTask?.id])

  const objArr = taskNodeDataArray
  // Hack: if viewkind === 'Container' then set isGroup to true
  if (debug) console.log('269 objArr', props.gojsModel, objArr)
  for (let i = 0; i < objArr?.length; i++) {
    if (objArr[i]?.viewkind === 'Container') {
      objArr[i].isGroup = true;
    }
  }
  if (debug) console.log('274 objArr', objArr)


  const navitemDiv = (!selmodviews) ? <></> : selmodviews.map((mv, index) => {
    if (mv && !mv.markedAsDeleted) { 
        const strindex = index.toString()
        const data = {id: mv.id, name: mv.name}
        const data2 = {id: Math.random().toString(36).substring(7), name: strindex+'name'}
        // genGojsModel(props, dispatch);
        // if (debug) console.log('90 Modeller', activeTab, activetabindex , index, strindex, data)
        return (
          <NavItem key={strindex} className="model-selection" data-toggle="tooltip" data-placement="top" data-bs-html="true" 
              title={
`Description: ${modelview?.description}

To change Modelview name, rigth click the background below and select 'Edit Modelview'.`
              }>
            <NavLink style={{ paddingTop: "0px", paddingBottom: "0px", border: "solid 1px", borderBottom: "none", borderColor: "#eee gray white #eee", color: "black" }}
              className={classnames({ active: activeTab == strindex })}
              onClick={() => { dispatch({ type: 'SET_FOCUS_MODELVIEW', data }); dispatch({ type: 'SET_FOCUS_REFRESH', data: {id: Math.random().toString(36).substring(7), name: strindex+'name'} }) }}
              // onDoubleClick={() => {handleMVDoubleClick({ value: data })}}
            > 
              {mv.name}
            </NavLink>
          </NavItem>
        )
    }
  })

  const modelviewTabDiv = 
    <>
      <Nav tabs >
        {navitemDiv}  
        <NavItem >
        <button className="btn-sm bg-warning text-white py-0 ml-3 float-right"  data-toggle="tooltip" data-placement="top" data-bs-html="true" 
          title=" Modelling:&#013;Insert an Object: Click on an Object Type in the Palette (the left) and drag and drop it into the Modelling area below.&#013;&#013;
                  Connect two objects: &#013;Position the cursor on on the edge of one object (An arrow appears) and drag and drop to another object to make a relationshop between them.">i
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
  
  return (
    (props.modelType === 'model') 
    ? // modelling
      <div className="modeller-workarea mt-2 ml-1 mb-1 " >
        <div className="modeller--topbar m-0 p-0" >
          <span className="--heading float-left text-dark m-0 p-0 ml-2 mr-2 fs-6 fw-bold lh-2" style={{ minWidth: "10%"}} >Modeller </span>
          <div className="modeller--heading-selector" style={{ transform: "scale(0.9)", transformOrigin: "right", minWidth: "100%" }}>{selector}</div>
        </div>
        <div className="modeller--workarea m-0 p-0" style={{ minWidth: "90%" }}>
          <Row className="m-0">
            <Col className="modeller--workarea-objects mx-0 px-0 mt-0 col-auto " style={{ margin: "-14px", maxWidth: "166px"}}>
              <div className="modeller--workarea-objects-content mt-2 border border-dark" style={{    height: "81vh"}} >
                <button className="btn-sm px-1 m-0 text-left w-100" style={{ backgroundColor: "#a0caca",  outline: "0", borderStyle: "none"}}
                  onClick={toggleObjects}> {visibleObjects ? <span> &lt;- Objects </span> : <span> -&gt;</span>} 
                </button>
                {/* <div className="myModeller mb-1 pl-1 pr-1" style={{ backgroundColor: "#ddd", height: "100%", border: "solid 1px black" }}> */}
                  {visibleObjects 
                    ? (objectsTabDiv) 
                      ? <><div className="btn-horizontal bg-light mx-0 px-1 mb-1" style={{  fontSize: "11px", minWidth: "166px", maxWidth: "166px"}}></div>{ objectsTabDiv }</> 
                      : <><div className="btn-horizontal bg-light mx-0 px-1 mb-1" style={{  fontSize: "11px", minWidth: "166px", maxWidth: "166px"}}></div>{ objectsTabDiv }</>
                    : <div className="btn-vertical px-1 text-center" style={{ height: "78vh", maxWidth: "20px", padding: "0px" }}><span> O b j e c t s </span> </div>
                  }
                {/* </div> */}
              </div>
            </Col>
            <Col className="modeller--workarea-modelling px-1 ">
            {/* <Col className="modelller--workarea-modelling w-100"> */}
              <div className="mt-2">
                {modelviewTabDiv} 
              </div>
              <div className="modeller--footer-buttons">
                <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Zoom all diagram">Zoom All</button>
                <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle relationhip layout routing">Toggle relationship layout</button>
                <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle relationhip show relship name">Toggle relationships name</button>
                <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Zoom to objectview in focus">Zoom to Focus</button>
                <button className="btn-sm  py-0" 
                  data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle show/ hide deleted objectviews" 
                  onClick={() =>     { dispatch({ type: 'SET_USER_SHOWDELETED', data: !showDeleted }) ; dispatch({ type: 'SET_FOCUS_REFRESH', data: {id: Math.random().toString(36).substring(7), name: 'name'} })}} > {(showDeleted) ? ' Hide deleted' : 'Show deleted' }
                  {/* onClick={() => { toggleShowDeleted(showDeleted); dispatch({ type: 'SET_USER_SHOWDELETED', data: showDeleted }) ; toggleRefresh() }}>{(showDeleted) ? 'Hide deleted' : 'Show deleted' } */}
                </button>
                {/* <button className="btn-sm text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="&#013;"></button> */}
              <span className="sourceName pl-1 pr-1 ml-1 mt-1 mr-1 float-right" style={{ minWidth: "130px", maxHeight: "22px", backgroundColor: "#eee", fontSize: "small"}}>
                  Current source:  {props.phSource} 
                </span> 
              </div>
            </Col>
          </Row>
        </div>
      </div>
    : // palette
      <div className="mt-2 mb-2" style={{backgroundColor: "#7ac", minWidth: "100%" }}>
        <span className="modeller--heading float-left text-dark m-0 p-0 ml-2 mr-2 fs-6 fw-bold lh-2" style={{ minWidth: "8%"}}>Metamodeller</span>
        <div className="modeller--heading-selector" style={{ transform: "scale(0.9)", transformOrigin: "right", minWidth: "100%" }}>{selector}</div>
        {metamodelTabDiv} 
        <style jsx>{`
        // .diagram-component {
        //   height: 80%;
        // }
        `}</style>
      </div>
  )
}

export default Modeller;
















// // @ts-nocheck
// import React, { useState, useEffect } from "react";
// import { useDispatch } from 'react-redux';
// import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip, ModalFooter } from 'reactstrap';
// import classnames from 'classnames';
// import GoJSApp from "./gojs/GoJSApp";
// import Selector from '../utils/Selector'
// import genGojsModel from './GenGojsModel'
// import genRoleTasks from "./utils/SetRoleTaskFilter";
// import { addNodeToDataArray } from "../akmm/ui_common";
// import { setfocusRefresh, setFocusTab } from "../actions/actions";

// const debug = false;

// const Modeller = (props: any) =>  {
//   const gojsmodel = props.gojsModel;
//   if (!gojsmodel)  return <></>

//   const dispatch = useDispatch();
//   if (debug) console.log('18 Modeller: props', props);



  
//   let myMetis = props.myMetis;
//   let activetabindex = 0
//   const [refresh, setRefresh] = useState(false)
//   const [activeTab, setActiveTab] = useState(0);
//   const showDeleted = props.phUser?.focusUser?.diagram?.showDeleted

//   // function toggleRefresh() { setRefresh(!refresh); console.log('25', refresh);
//   //  }
  
  
//   if (debug) console.log('27 Modeller: props, refresh', props, refresh);
  
//   // let focusModel = props.phFocus?.focusModel
//   // let focusModelview = props.phFocus?.focusModelview
//   // const models = props.metis?.models
//   // const model = models?.find((m: any) => m?.id === focusModel?.id)
//   // const modelindex = models?.findIndex((m: any) => m?.id === focusModel?.id)
//   // const modelviews = model?.modelviews
//   // const modelview = modelviews?.find((m: any) => m?.id === focusModelview?.id)
//   // const modelviewindex = modelviews?.findIndex((m: any, index) => index && (m?.id === focusModelview?.id))
//   // const metamodels = props.metis?.metamodels
//   // const mmodel = metamodels?.find((m: any) => m?.id === model?.metamodelRef)

//   const [focusModel, setFocusModel] = useState(props.phFocus?.focusModel)
//   const [focusModelview, setFocusModelview] = useState(props.phFocus?.focusModelview)
//   const [models, setModels] = useState(props.metis?.models)
//   const [model, setModel] = useState(models?.find((m: any) => m?.id === focusModel?.id))
//   const [modelindex, setModelindex] = useState(models?.findIndex((m: any) => m?.id === focusModel?.id))
//   const [modelviews, setModelviews] = useState(model?.modelviews)
//   const [modelview, setModelview] = useState(modelviews?.find((m: any) => m?.id === focusModelview?.id))
//   const [modelviewindex, setModelviewindex] = useState(modelviews?.findIndex((m: any, index) => index && (m?.id === focusModelview?.id)))
//   const [metamodels, setMetamodels] = useState(props.metis?.metamodels)
//   const [mmodel, setMmodel] = useState(metamodels?.find((m: any) => m?.id === model?.metamodelRef))


  
//   if (debug) console.log('47 Modeller focusMV : ', props.phFocus.focusModelview.name,  'objvs', modelview ,'mygoModel', props.myGoModel, 'gojsmodel', gojsmodel?.nodeDataArray);



//   // const selmods = {models, model}//(models) && { models: [ ...models?.slice(0, modelindex), ...models?.slice(modelindex+1) ] }
//   // const selmodviews = {modelviews, modelview}//(modelviews) && { modelviews: [ ...modelviews?.slice(0, modelviewindex), ...modelviews?.slice(modelviewindex+1) ] }
  
//   // put current modell on top 
//   const selmods = [
//     models[modelindex],
//     ...models.slice(0, modelindex),
//     ...models.slice(modelindex+1, models.length)
//   ]
//   const selmodviews = modelviews
  
//   if (debug) console.log('58 Modeller', mmodel, focusModelview, selmods, selmodviews);
//   if (debug) console.log('59 Modeller', modelviewindex, activeTab);
//   let selmodels = selmods?.filter((m: any) => m && (!m.markedAsDeleted))
//   // let selmodelviews = selmodviews?.map((mv: any) => mv && (!mv.markedAsDeleted))

//   // ToDo: remember last current modelview for each model, so that we can set focus to it when we come back to the that model 
//   // activetabindex = (modelviewindex < 0) ? 0 : (modelviewindex) ? modelviewindex : focusModelviewIndex //selmodelviews?.findIndex(mv => mv.name === modelview?.name)
//   // useEffect(() => {
//   //   if (debug) console.log('65 Modeller', focusModel.name, focusModelview.name);
//   //   // activetabindex = (modelviewindex < 0) ? 0 : modelviewindex  // if no focus modelview, then set to 0

//   //   setActiveTab(activeTab)
//   // }, [activeTab])

//   // useEffect(() => {
//   //   if (debug) console.log('78 Modeller', focusModel.name, focusModelview.name, props.phFocus);
//   //   const mv = modelviews[0]
//   //   if (focusModelview.id !== modelview[0]?.id) return
//   //   dispatchFocusModelview( { id: mv.id, name: mv.name })
//   //   const timer = setTimeout(() => {
//   //     genGojsModel(props, dispatch);
//   //     setRefresh(!refresh)
//   //   }, 1000);
  
//   //   if (debug) console.log('88 Modeller', focusModel.name, focusModelview.name, props.phFocus);
//   //   return () => clearTimeout(timer);
//   // },[])
//   useEffect(() =>  {
//     // if (selmodviews?.length>0)
//     if (activeTab != undefined || 0) {
//       if (debug) console.log('111 Modeller useEffect focusModel', activeTab); 
//       const data = {id: selmodviews[0].id, name: selmodviews[0].name}
//       dispatch({ type: 'SET_FOCUS_MODELVIEW', data }) ;
//       // setActiveTab(0)
//       genGojsModel(props, dispatch);
//     }
//   }, [focusModel.id])

//   const dispatchFocusModel = (id: string, name: string) => {
//     if (debug) console.log('81 Selector', id, name, selObj);
//     dispatch({ type: 'SET_FOCUS_MODEL', data: { id: id, name: name}  })
//   }

//   const dispatchFocusModelview = (id: string, name: string, tabidx) => {
//     if (debug) console.log('86 Selector', name, props.phFocus.focusModelview.name, activetabindex, activeTab);
//      dispatch({ type: 'SET_FOCUS_MODELVIEW', data: {id: id, name: name}  })
//      setFocusModelview({id: id, name: name})
//      setActiveTab(tabidx)

//     if (debug) console.log('89 Selector', name, props.phFocus.focusModelview, tabidx);
//     const timer = setTimeout(() => {
      
//       genGojsModel(props, dispatch);
//       setRefresh(!refresh)
//     }, 1000);
    
//     if (debug) console.log('98 Selector', name, props.phFocus.focusModelview, tabidx);
//     // dispatch({ type: 'SET_FOCUS_REFRESH', data: {id: Math.random().toString(36).substring(7), name: 'name'}})
//     return () => clearTimeout(timer);
//     // setActiveTab(tabidx)
//   }

//   const handleChange = (e) => {
//     if (debug) console.log('95 Modeller: handleChange', e);
//     dispatch({ type: 'UPDATE_PROJECT_PROPERTIES', data: { name: e.value } });
//   }

//   const handleSelectModelChange = (event: any) => {
//     const id = JSON.parse(event.value).id
//     const name = JSON.parse(event.value).name
//     const selObj = models.find( (obj: any) => obj.id === id ) // check if exists
//     if (debug) console.log('98 Mmodeller', id, name, activeTab);
//     // dispatch both model and modelview[0] for the selected model
//     if (selObj) dispatchFocusModel(id, name)
//     // if (selObj) dispatchFocusModelview(selObj.modelviews[0].id, selObj.modelviews[0].name)
//     // setActiveTab(0)
//   }

//   const  options = selmodels && ( //sf TODO:  modelview is mapped 2 times 
//     selmodels.map((m: any, index) => (m) && (m.name !== 'Select '+props.selName+'...') &&
//     <option key={m.id+index} value={JSON.stringify({id: m.id, name: m.name})}>{m.name}</option>)
//   )

//   const selector = //(props.modelType === 'model' || props.modelType === 'modelview' ) 
//     <div >
//       <label className="Selector--menu-label "   
//         data-toggle="tooltip" data-placement="top" data-bs-html="true" 
//         title =  {
// `Description : ${props.metis.description} 

// To change Project Name : 
// Edit this field and click on the Save button.

// or Right-click the background below and select 'Edit Project Name'. 

// The text 'Project_<currentdate>' will be added to the filename.`
//         }> Project : 
//         <input className="ml-2" type="text" defaultValue={props.metis.name} onBlur={(event) => handleChange({ value: event.target.value })} style={{ minWidth: "36%"}} />
//         <span className="model-selection" data-toggle="tooltip" data-placement="top" data-bs-html="true"  style={{width: "100%"}}
//           title={
// `Description: ${model?.description}

// To change Model name, rigth click the background below and select 'Edit Model'.`
//           }>Model :
//           <select key='select-title' className="list-obj mx-2" style={{ minWidth: "32%"}}
//             onChange={(event) => handleSelectModelChange({ value: event.target.value }) } name={`Focus ${props.selName} ...`}>
//             {options}
//           </select>
//         </span> 
//       </label>
//     </div>

  
//   const navitemDiv = (!selmodviews) ? <></> : selmodviews.map((mv, index) => {
//       const strindex = index.toString()
//       if (debug) console.log('187 Modeller', mv.name, index, strindex, activeTab);
//       return (
//           <NavItem key={strindex} className="model-selection" data-toggle="tooltip" data-placement="top" data-bs-html="true" 
//               title={
// `Description: ${modelview?.description}

// To change Modelview name, rigth click the background below and select 'Edit Modelview'.`
//               }>
//             <NavLink style={{ paddingTop: "0px", paddingBottom: "0px", border: "solid 1px", borderBottom: "none", borderColor: "#eee gray white #eee", color: "black" }}
//               className={classnames({ active: activeTab == strindex })}
//               // onClick={() => { dispatchFocusModelview(mv.id, mv.name);  }}
//               onClick={() => { setActiveTab(strindex); dispatchFocusModelview(mv.id, mv.name, strindex)  }}
//               // onClick={() => {handleMVDoubleClick} ; dispatch({ type: 'SET_FOCUS_REFRESH', data: {id: Math.random().toString(36).substring(7), name: strindex+'name'} }) }}
//               // onClick={() => { dispatch({ type: 'SET_FOCUS_MODELVIEW', data }); dispatch({ type: 'SET_FOCUS_REFRESH', data: {id: Math.random().toString(36).substring(7), name: strindex+'name'} }) }}
//               // onDoubleClick={() => {handleMVDoubleClick({ value: data })}}
//             >
//               {mv.name} {activeTab} {strindex}
//             </NavLink>
//           </NavItem>
//       )
//   })

//   const gojsapp = (gojsmodel) && 
//     <GoJSApp
//       nodeDataArray={gojsmodel.nodeDataArray}
//       linkDataArray={gojsmodel.linkDataArray}
//       metis={props.metis}
//       myMetis={props.myMetis}
//       myGoModel={props.myGoModel}
//       myGoMetamodel={props.myGoMetamodel}
//       phFocus={props.phFocus}
//       dispatch={props.dispatch}
//       modelType={props.phFocus.focusTab}
//     />

//   const modelviewTabDiv = 
//     <>
//       <Nav tabs >
//         {navitemDiv}  
//         <NavItem >
//         <button className="btn-sm bg-warning text-white py-0 ml-3 float-right"  data-toggle="tooltip" data-placement="top" data-bs-html="true" 
//           title=" Modelling:&#013;Insert an Object: Click on an Object Type in the Palette (the left) and drag and drop it into the Modelling area below.&#013;&#013;
//                   Connect two objects: &#013;Position the cursor on on the edge of one object (An arrow appears) and drag and drop to another object to make a relationshop between them.">i
//         </button>
         
//         </NavItem>
//       </Nav>
//       <TabContent > 
//         <TabPane  >
//           <div className="workpad bg-white mt-0 p-1 pt-2"> 
//             {/* {gojsapp} */}   
//             {`Refresh: ${refresh}`}

//             {refresh ? <> {gojsapp} </> : <>{gojsapp}</>}
//           </div>  
//         </TabPane>
//       </TabContent>
//     </>


//   const metamodelTabDiv = 
//     <>
//       <div className="workpad p-1 pt-2"> 
//         {gojsapp}
//         {/* {refresh ? <> {gojsapp} </> : <>{gojsapp}</>} */}
//       </div>         
//     </>

//   return (
//     (props.modelType === 'model') 
//     ? // modelling
//       <div className="modeller-workarea mt-2 ml-1 mb-1 " >
//         <div className="modeller--topbar m-0 p-0" style={{ minWidth: "100%" }}>
//           <span className="--heading float-left text-dark m-0 p-0 ml-2 mr-2 fs-6 fw-bold lh-2" style={{ minWidth: "10%"}} >Modeller </span>
//           <div className="modeller--heading-selector" style={{ transform: "scale(0.9)", transformOrigin: "right", minWidth: "100%" }}>{selector}</div>
//         </div>
//         <div className="mt-2">
//           {modelviewTabDiv} 
//         </div>
//         <div className="modeller--footer-buttons">
//           <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Zoom all diagram">Zoom All</button>
//           <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle relationhip layout routing">Toggle relationship layout</button>
//           <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle relationhip show relship name">Toggle relationships name</button>
//           <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Zoom to objectview in focus">Zoom to Focus</button>
//           <button className="btn-sm  py-0" 
//             data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle show/ hide deleted objectviews" 
//             onClick={() =>     { dispatch({ type: 'SET_USER_SHOWDELETED', data: !showDeleted }) ; dispatch({ type: 'SET_FOCUS_REFRESH', data: {id: Math.random().toString(36).substring(7), name: 'name'} })}} > {(showDeleted) ? ' Hide deleted' : 'Show deleted' }
//             {/* onClick={() => { toggleShowDeleted(showDeleted); dispatch({ type: 'SET_USER_SHOWDELETED', data: showDeleted }) ; toggleRefresh() }}>{(showDeleted) ? 'Hide deleted' : 'Show deleted' } */}
//           </button>
//           {/* <button className="btn-sm text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="&#013;"></button> */}
//         <span className="sourceName pl-1 pr-1 ml-1 mt-1 mr-1 float-right" style={{ minWidth: "130px", maxHeight: "22px", backgroundColor: "#eee", fontSize: "small"}}>
//             Current source:  {props.phSource} 
//           </span> 
//         </div>
//       </div>
//     : // palette
//       <div className="mt-2 mb-2" style={{backgroundColor: "#7ac", minWidth: "100%" }}>
//         <span className="--heading float-left text-dark m-0 p-0 ml-2 mr-2 fs-6 fw-bold lh-2" style={{ minWidth: "8%"}}>Metamodeller</span>
//         <div className="modeller--heading-selector" style={{ transform: "scale(0.9)", transformOrigin: "right", minWidth: "100%" }}>{selector}</div>
//         {metamodelTabDiv} 
//         <style jsx>{`
//         // .diagram-component {
//         //   height: 80%;
//         // }
//         `}</style>
//       </div>
//   )
// }

// export default Modeller;