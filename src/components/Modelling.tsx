// modelling
// @ts- nocheck
// Diagram.tsx
const debug = false;

// import React from "react";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import Page from './page';
import Palette from "./Palette";
import Modeller from "./Modeller";
import TargetModeller from "./TargetModeller";
import TargetMeta from "./TargetMeta";
import genGojsModel from './GenGojsModel'
import LoadServer from '../components/LoadServer'
import LoginServer from '../components/LoginServer'
import LoadLocal from '../components/LoadLocal'
import LoadRecovery from '../components/LoadRecovery'
import LoadFile from '../components/LoadFile'
import LoadGitHub from '../components/LoadGitHub'
// import LoadSaveGit from '../components/LoadSaveGit'
import LoadJsonFile from '../components/LoadJsonFile'
import { ReadModelFromFile, SaveAllToFile, SaveAllToFileDate } from './utils/SaveModelToFile';

// import ImpExpJSONFile from '../components/ImpExpJSONFile'
import useLocalStorage  from '../hooks/use-local-storage'
import EditFocusModal from '../components/EditFocusModal'
// import EditFocusMetamodel from '../components/EditFocusMetamodel'
// import Tab from '../components/Tab'
// import {loadDiagram} from './akmm/diagram/loadDiagram'


const clog = console.log.bind(console, '%c %s', // green colored cosole log
    'background: blue; color: white');
const ctrace = console.trace.bind(console, '%c %s',
    'background: blue; color: white');

const page = (props:any) => {

  if (typeof window === 'undefined') return <></>
  if (debug) clog('40 Modelling:', props);

  const dispatch = useDispatch();
  const [mount, setMount] = useState(false)
  const [refresh, setRefresh] = useState(true);



  useEffect(() => {
    setMount(true)
  }, [])

  let isRendered = useRef(false);

  if (debug) console.log('33 Modelling', props, props.phUser.focusUser.diagram);

  // const refresh = props.refresh
  // const setRefresh = props.setRefresh
 
  const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', null); //props);
  if (!memoryLocState && (typeof window != 'undefined')) {setMemoryLocState([props])}
  

  /**  * Get the state from the store  */
  // const state = useSelector((state: any) => state) // Selecting the whole redux store
  let focusModel = useSelector(focusModel => props.phFocus?.focusModel) 
  let focusModelview = useSelector(focusModelview => props.phFocus?.focusModelview) 
  const focusObjectview = useSelector(focusObjectview => props.phFocus?.focusObjectview) 
  const focusRelshipview = useSelector(focusRelshipview => props.phFocus?.focusRelshipview) 
  const focusObjecttype = useSelector(focusObjecttype => props.phFocus?.focusObjecttype) 
  const focusRelshiptype = useSelector(focusRelshiptype => props.phFocus?.focusRelshiptype) 
  const phSource = useSelector(phSource => props.phSource) 
  // if (debug) console.log('37 Modelling', props.phFocus, focusRelshiptype?.name);

  let gojsmetamodelpalette =  props.phGojs?.gojsMetamodelPalette 
  let gojsmetamodelmodel =  props.phGojs?.gojsMetamodelModel 
  let gojsmodelobjects = props.phGojs?.gojsModelObjects // || []
  let gojstargetmetamodel = props.phGojs?.gojsTargetMetamodel || [] // this is the generated target metamodel
  let gojsmodel =  props.phGojs?.gojsModel 
  let gojstargetmodel =  props.phGojs?.gojsTargetModel 
  let gojsmetamodel =  props.phGojs?.gojsMetamodel 

  if (debug) console.log('57 Modelling: gojsmodel', props);
  
  let metis = props.phData?.metis
  let myMetis = props.phMymetis?.myMetis
  let myGoModel = props.phMyGoModel?.myGoModel
  let myGoMetamodel = props.phMyGoMetamodel?.myGoMetamodel
  const curmod = metis.models.find(m => m.i === focusModel?.id)
  const curmodview = curmod?.modelviews.find(mv => mv.id = focusModelview?.id)
  const curobjviews = curmodview?.objectviews

  //let myGoMetamodel = props.phGojs?.gojsMetamodel
  let phFocus = props.phFocus;
  let phData = props.phData
  let phUser = props.phUser

  if (debug) console.log('90 Modelling', metis.metamodels, metis.models, curmod, curmodview, focusModel);

  const data = {
    phData:   props.phData,
    phFocus:  props.phFocus,
    phUser:   props.phUser,
    // phSource: props.phSource,
    phSource: (phSource === "") && phData.metis.name  || phSource,
    lastUpdate: new Date().toISOString()
  }

  useEffect(() => {
    if (debug) console.log('111 Modelling useEffect', data);
    genGojsModel(props, dispatch);
    
    const timer = setTimeout(() => {
      // genGojsModel(props, dispatch);
      setRefresh(!refresh)
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [focusModelview?.id, focusModel?.id, props.phFocus.focusTargetMetamodel?.id, curmod])

  useEffect(() => { // refresch the model when the focusRefresch changes
    if (debug) console.log('123 Modelling useEffect', memoryLocState, data);
    genGojsModel(props, dispatch);
    function refres() {
      setRefresh(!refresh)
    }
    setTimeout(refres, 1);
  }, [props.phFocus?.focusRefresh?.id])


  function toggleRefresh() {
    if (debug) console.log('152 Modelling', data, memoryLocState, (Array.isArray(memoryLocState)));
    let mdata = (Array.isArray(memoryLocState)) ? [data, ...memoryLocState] : [data];
    // put currentdata in the first position of the array data
    if (mdata.length > 9) { mdata.shift() }
    if (debug) console.log('161 Modelling refresh', mdata);
    // setTimeout(refres, 1);
    (typeof window !== 'undefined') && setMemoryLocState(mdata) // Save Project to Memorystate in LocalStorage at every refresh
    genGojsModel(props, dispatch)
    function refres() {
      setRefresh(!refresh)
    }
    setTimeout(refres, 100);
    setMemoryLocState(data) // Save Project to Memorystate in LocalStorage at every refresh
  }

  if (debug) console.log('174 Modelling', curmod, curmodview);

    function handleSaveAllToFileDate() {
      const projectname = props.phData.metis.name
      SaveAllToFileDate(data, projectname, 'Project')
    }
    function handleSaveAllToFile() {
      const projectname = props.phData.metis.name
      SaveAllToFile(data, projectname, 'Project')
    }
    
    const [activeTab, setActiveTab] = useState('2');
    const toggleTab = tab => { if (activeTab !== tab) setActiveTab(tab);
      const data = (tab === '1') ? 'Metamodelling' : 'Modelling'
      // console.log('159', data, dispatch({ type: 'SET_FOCUS_TAB', data }));
      dispatch({ type: 'SET_FOCUS_TAB', data })
    }

    const [tooltipOpen, setTooltipOpen] = useState(false);
    const toggleTip = () => setTooltipOpen(!tooltipOpen);
    
    const [visibleTasks, setVisibleTasks] = useState(true)
    
    function toggleTasks() {
      setVisibleTasks(!visibleTasks);
    }

  // ===================================================================
  // Divs
  if (debug) console.log('Modelling: gojsmodel', gojsmodelobjects);
  const paletteDiv = (gojsmetamodelmodel) // this is the div for the palette with the types tab and the objects tab
    ?
      <Palette
        gojsModel={gojsmetamodelmodel}
        gojsMetamodel={gojsmetamodelpalette}
        myMetis={myMetis}
        myGoModel={myGoModel}
        myGoMetamodel={myGoMetamodel}
        metis={metis}
        phFocus={phFocus}
        dispatch={dispatch}
        // modelType='metamodel'
      /> 
    : <></>;

    const paletteMetamodelDiv = (gojsmetamodelmodel) 
      ?
        <Modeller
        gojsModel={gojsmetamodelmodel}
        gojsMetamodel={gojsmetamodelpalette}
        myMetis={myMetis}
        myGoModel={myGoModel}
        myGoMetamodel={myGoMetamodel}
        metis={metis}
        phFocus={phFocus}
        dispatch={dispatch}
        modelType='metamodel'
        phUser={phUser}
      />
      : <></>;

  const targetmetamodelDiv = (curmod?.targetMetamodelRef !== "")
    ?
      <TargetMeta
        gojsModel={gojsmodel}
        gojsMetamodel={gojsmetamodel}
        gojsTargetMetamodel={gojstargetmetamodel}
        myMetis={myMetis}
        myGoModel={myGoModel}
        myGoMetamodel={myGoMetamodel}
        phFocus={phFocus}
        metis={metis}
        dispatch={dispatch}
        modelType='model'
      />
    : <></>;

  const modellingtabs =  (<>
      <Nav tabs style={{ minWidth: "170px" }}>
        {/* <NavItem className="text-danger" >
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" }}
            className={classnames({ active: activeTab === '0' })}
            onClick={() => { toggleTab('0'); toggleRefresh() }}
          >
            {(activeTab === "0") ? 'Template' : 'T'}
          </NavLink>
        </NavItem> */}
        <NavItem>
        {/* <NavItem className="text-danger" > */}
          <NavLink style={{  paddingTop: "0px", paddingBottom: "0px", borderColor: "#eee gray white #eee" , color: "black"}}
            className={classnames({ active: activeTab === '1' })}
            onClick={() => { toggleTab('1'); toggleRefresh() }}
          >
            {(activeTab === "1") ? 'Metamodelling' : 'MM'}
          </NavLink>
        </NavItem>
        <NavItem >
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" , borderColor: "#eee gray white #eee", color: "black"}}
            className={classnames({ active: activeTab === '2' })}
            onClick={() => { toggleTab('2'); toggleRefresh() }}
          >
            {(activeTab === "2") ? 'Modelling' : 'Modelling'}
          </NavLink>
        </NavItem>
        {/* <NavItem >
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" }}
            className={classnames({ active: activeTab === '3' })}
            onClick={() => { toggleTab('3'); toggleRefresh() }}
          >
            {(activeTab === "3") ? 'Solution Modelling' : 'SM'}
          </NavLink>
        </NavItem> */}
      </Nav>
      <TabContent  activeTab={activeTab} >  
        {/* Template ------------------------------------------*/}
        {/* <TabPane tabId="0">
          <Tab /> */}
            {/* <div className="workpad p-1 pt-2 bg-white">
              <Row >
              <Col xs="auto m-0 p-0 pl-3">
                <div className="myPalette pl-1 mb-1 pt-0 text-white" style={{ maxWidth: "150px", minHeight: "8vh", height: "100%", marginRight: "2px", backgroundColor: "#999", border: "solid 1px black" }}>
                  <Palette
                    gojsModel={gojsmodel}
                    gojsMetamodel={gojsmetamodel}
                    gojsModelObjects={gojsmodelobjects}
                    myMetis={myMetis}
                    myGoModel={myGoModel}
                    myGoMetamodel={myGoMetamodel}
                    metis={metis}
                    phFocus={phFocus}
                    dispatch={dispatch}
                    modelType='model'
                  />
                </div>
                </Col>
              <Col style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}>
                  <div className="myModeller mb-1 pl-1 pr-1" style={{ backgroundColor: "#ddd", width: "100%", height: "100%", border: "solid 1px black" }}>
                    <Modeller
                      gojsModel={gojsmodel}
                      gojsMetamodel={gojsmetamodel}
                      myMetis={myMetis}
                      myGoModel={myGoModel}
                      myGoMetamodel={myGoMetamodel}
                      metis={metis}
                      phFocus={phFocus}
                      dispatch={dispatch}
                      modelType='model'
                      />
                  </div>
                </Col>
              </Row>
            </div>          */}
        {/* </TabPane>  */}
        {/* Metamodelling --------------------------------*/}
        <TabPane  tabId="1">
          <div className="workpad p-1 pt-2 bg-white" >
            <Row className="row" style={{ height: "100%", marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
              <Col className="col1 m-0 p-0 pl-3" xs="auto">
                <div className="myPalette px-1 mt-0 mb-0 pt-0 pb-1" style={{ height: "100%", marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
                  {paletteDiv}
                </div>
              </Col>
              <Col className="col2" style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}>
                <div className="myModeller pl-0 mb-0 pr-1" style={{ backgroundColor: "#7ac", minHeight: "7vh", width: "100%", height: "100%", border: "solid 1px black" }}>
                  {paletteMetamodelDiv}
                </div>
              </Col>
            </Row>
          </div>         
        </TabPane>
        {/* Modelling ---------------------------------------*/}
        <TabPane tabId="2">
          <div className="workpad p-1 pt-2 bg-white">
            <Row className="row d-flex flex-nowrap h-100">
              <Col className="col1 m-0 p-0 pl-3" xs="auto">
                <div className="myPalette px-1 mt-0 mb-0 pt-0 pb-1" style={{ height: "100%", marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
                 <Palette
                    gojsModelObjects={gojsmodelobjects}
                    gojsModel={gojsmodel}
                    gojsMetamodel={gojsmetamodel}
                    myMetis={myMetis}
                    myGoModel={myGoModel}
                    myGoMetamodel={myGoMetamodel}
                    metis={metis}
                    phFocus={phFocus}
                    dispatch={dispatch}
                    modelType='model'
                  />
                  {/* <div className="instances"> area for all instance or result of query 
                  {instances}
                  </div> */}
                </div>
              </Col>
              <Col className="col2" style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}>
                <div className="myModeller pl-0 mb-0 pr-1" style={{ backgroundColor: "#acc", minHeight: "7vh", width: "100%", height: "100%", border: "solid 1px black" }}>
                {/* <div className="myModeller m-0 pl-1 pr-1" style={{ width: "100%", height: "100%", border: "solid 1px black" }}> */}              
                  <Modeller
                    gojsModel={gojsmodel}
                    gojsMetamodel={gojsmetamodel}
                    myMetis={myMetis}
                    myGoModel={myGoModel}
                    myGoMetamodel={myGoMetamodel}
                    phFocus={phFocus}
                    phUser={phUser}
                    phSource={phSource}
                    metis={metis}
                    dispatch={dispatch}
                    modelType='model'
                  />
                </div>
              </Col>
              <Col className="col3 mr-0 p-0 " xs="auto">
                <div className="myTargetMeta px-0 mb-1 mr-3 pt-0 float-right" style={{ minHeight: "7vh", height: "100%", marginRight: "0px", backgroundColor: "#8ce", border: "solid 1px black" }}>
                  {targetmetamodelDiv}
                </div>
              </Col>
            </Row>
          </div>         
        </TabPane>
        {/* Solution Modelling ------------------------------------*/}
        {/* <TabPane tabId="3">
          <div className="workpad p-1 pt-2 bg-white">
            <Row >
              <Col xs="auto m-0 p-0 pr-0">
                <div className="myTargetMeta pl-0 mb-1 pt-0 text-white float-right" style={{ minHeight: "8vh", height: "100%", marginRight: "4px", backgroundColor: "#9a9", border: "solid 1px black" }}>
                  <TargetMeta
                    gojsModel={gojsmodel}
                    gojsMetamodel={gojsmetamodel}
                    gojsTargetMetamodel={gojstargetmetamodel}
                    myMetis={myMetis}
                    myGoModel={myGoModel}
                    myGoMetamodel={myGoMetamodel}
                    metis={metis}
                    phFocus={phFocus}
                    dispatch={dispatch}
                    modelType='model'
                  />
                </div>
              </Col>
              <Col style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}>
                <div className="myModeller mb-1 pt-3 pl-1 pr-1" style={{ backgroundColor: "#ddd", width: "100%", height: "100%", border: "solid 1px black" }}>

                  <TargetModeller
                    gojsModel={gojsmodel}
                    gojsTargetModel={gojstargetmodel}
                    gojsMetamodel={gojsmetamodel}
                    myMetis={myMetis}
                    myGoModel={myGoModel}
                    myGoMetamodel={myGoMetamodel}
                    metis={metis}
                    phFocus={phFocus}
                    dispatch={dispatch}
                    modelType='model'
                  />
                </div>
              </Col>
            </Row>
          </div>         
        </TabPane> */}
      </TabContent>
    </>
    )      

  if (debug) console.log('383 Modelling', activeTab);
  const loginserver = (process.browser) && <LoginServer buttonLabel='Login to Server' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} /> 
  const loadserver = (process.browser) && <LoadServer buttonLabel='Server' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} /> 
  // const loadlocal =  (process.browser) && <LoadLocal  buttonLabel='Local'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
  // const loadgitlocal =  (process.browser) && <LoadSaveGit  buttonLabel='GitLocal'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
  const loadfile =  (process.browser) && <LoadFile  buttonLabel='Model file'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
  const loadjsonfile =  (process.browser) && <LoadJsonFile  buttonLabel='OSDU'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
  const loadgithub =  (process.browser) && <LoadGitHub  buttonLabel='GitHub'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
  const loadrecovery =  (process.browser) && <LoadRecovery  buttonLabel='Recovery'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
  
  const modelType = (activeTab === '1') ? 'metamodel' : 'model'
  const EditFocusModalMDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModal buttonLabel='M' className='ContextModal' modelType={'modelview'} ph={props} refresh={refresh} setRefresh={setRefresh} />
  // const EditFocusModalDiv = <EditFocusModal buttonLabel='Edit' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
  const EditFocusModalODiv = (focusObjectview?.name || focusObjecttype?.name ) && <EditFocusModal buttonLabel='O' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
  const EditFocusModalRDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModal className="ContextModal" buttonLabel='R' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
    // : (focusObjectview.name) && <EditFocusMetamodel buttonLabel='Edit' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
  // if (debug) console.log('177 Modelling', EditFocusModalDiv);

  return  mount && (
    <>
      <div className="header-buttons mt-1 p-0 pt-1 d-inline-flex float-right" style={{ transform: "scale(0.6)", transformOrigin: "right", backgroundColor: "#ddd" }}>
        {/* <span className="spacer m-0 p-0 w-50"></span> */}
        <span className="buttonrow m-0 d-inline-flex" style={{ maxHeight: "9px" }}> 
          {/* <div className="loadmodel"  style={{ paddingBottom: "2px", backgroundColor: "#ccc", transform: "scale(0.7)",  fontWeight: "bolder"}}> */}
          {/* <span className=" m-0 px-0 bg-secondary " style={{ minWidth: "125px", maxHeight: "28px", backgroundColor: "#fff"}} > Edit selected :  </span> */}
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="Select an Relationship and click to edit properties" > {EditFocusModalRDiv} </span>
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="Select an Object and click to edit properties" > {EditFocusModalODiv} </span>
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="Click to edit Model and Modelview properties" > {EditFocusModalMDiv} </span>
          {/* <span className="pt-1 pr-1" > </span> */}
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from file" style={{ minWidth: "108px"}}> {loadfile} </span>
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from OSDU Json file" > {loadjsonfile} </span>
          {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from localStore or download/upload file" > {loadlocal} </span> */}
          {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Login to the model repository server (Firebase)" > {loginserver} </span>
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from the model repository server (Firebase)" > {loadserver} </span> */}
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from GitHub" > {loadgithub} </span>
          <span className="m-0 p-0" style={{transform: "scale(0.9)",minWidth: "96px"}} >Project files:</span>
          <span className="  " style={{ minWidth: "220px", maxHeight: "22px", backgroundColor: "#fff"}}>
            <input className="select-input" type="file" accept=".json" onChange={(e) => ReadModelFromFile(props, dispatch, e)} />
          </span>
          <span >
            <button 
              className="btn-secondary ml-2 mr-2 mb-3 " 
              data-toggle="tooltip" data-placement="top" data-bs-html="true" 
              title="Click here to Save the Project&#013;(all models and metamodels) to file &#013;(in Downloads folder)"
              onClick={handleSaveAllToFile}>Save
            </button >
          </span> 
          {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from Local Repo" > {loadgitlocal} </span> */}
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="Recover project from last refresh" > {loadrecovery} </span>
          <span className="btn btn-link float-right"  onClick={toggleRefresh} data-toggle="tooltip" data-placement="top" title="Refresh the modelview" > {refresh ? 'refresh' : 'refresh'} </span>
        </span> 
  
      </div>
      <div className="diagramtabs pl-1 pb-0 " >
        <div className="modellingContent mt-1 " >
          {refresh ? <> {modellingtabs} </> : <>{modellingtabs}</>}
        </div>
      </div>
    </>
  )
} 
export default Page(connect(state => state)(page));





// // @ts- nocheck
// // Diagram.tsx
// const debug = false;

// // import React from "react";
// import { useState, useEffect, useLayoutEffect, useRef } from "react";
// import { connect, useSelector, useDispatch } from 'react-redux';
// import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
// import classnames from 'classnames';
// import Page from './page';
// import Palette from "./Palette";
// import Modeller from "./Modeller";
// import TargetModeller from "./TargetModeller";
// import TargetMeta from "./TargetMeta";
// import genGojsModel from './GenGojsModel'
// import LoadServer from '../components/LoadServer'
// import LoginServer from '../components/LoginServer'
// import LoadLocal from '../components/LoadLocal'
// import LoadRecovery from '../components/LoadRecovery'
// import LoadFile from '../components/LoadFile'
// import LoadGitHub from '../components/LoadGitHub'
// // import LoadSaveGit from '../components/LoadSaveGit'
// import LoadJsonFile from '../components/LoadJsonFile'
// import { ReadModelFromFile, SaveAllToFile, SaveAllToFileDate } from './utils/SaveModelToFile';

// // import ImpExpJSONFile from '../components/ImpExpJSONFile'
// import useLocalStorage  from '../hooks/use-local-storage'
// import EditFocusModal from '../components/EditFocusModal'
// // import EditFocusMetamodel from '../components/EditFocusMetamodel'
// // import Tab from '../components/Tab'
// // import {loadDiagram} from './akmm/diagram/loadDiagram'


// const clog = console.log.bind(console, '%c %s', // green colored cosole log
//     'background: blue; color: white');
// const ctrace = console.trace.bind(console, '%c %s',
//     'background: blue; color: white');

// const page = (props:any) => {

//   if (typeof window === 'undefined') return <></>
//   if (debug) clog('40 Modelling:', props);

//   const dispatch = useDispatch();
//   const [mount, setMount] = useState(false)
//   const [refresh, setRefresh] = useState(true);

//   useEffect(() => { // make sure its mounted before rendering
//     setMount(true)
//   }, [])

//   if (debug) console.log('33 Modelling', props, props.phUser.focusUser.diagram);
 
//   const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', null); //props);
//   if (!memoryLocState && (typeof window != 'undefined')) {setMemoryLocState([props])}
  

//   /**  * Get the state from the store  */
//   // const state = useSelector((state: any) => state) // Selecting the whole redux store
//   let focusModel = useSelector(focusModel => props.phFocus?.focusModel) 
//   let focusModelview = useSelector(focusModelview => props.phFocus?.focusModelview) 
//   const focusObjectview = useSelector(focusObjectview => props.phFocus?.focusObjectview) 
//   const focusRelshipview = useSelector(focusRelshipview => props.phFocus?.focusRelshipview) 
//   const focusObjecttype = useSelector(focusObjecttype => props.phFocus?.focusObjecttype) 
//   const focusRelshiptype = useSelector(focusRelshiptype => props.phFocus?.focusRelshiptype) 
//   const phSource = useSelector(phSource => props.phSource) 
//   // if (debug) console.log('37 Modelling', props.phFocus, focusRelshiptype?.name);

//   let gojsmetamodelpalette =  props.phGojs?.gojsMetamodelPalette 
//   let gojsmetamodelmodel =  props.phGojs?.gojsMetamodelModel 
//   let gojsmodelobjects = props.phGojs?.gojsModelObjects // || []
//   let gojstargetmetamodel = props.phGojs?.gojsTargetMetamodel || [] // this is the generated target metamodel
//   let gojsmodel =  props.phGojs?.gojsModel 
//   let gojstargetmodel =  props.phGojs?.gojsTargetModel 
//   let gojsmetamodel =  props.phGojs?.gojsMetamodel 

//   if (debug) console.log('57 Modelling: gojsmodel', props);
  
//   let metis = props.phData?.metis
//   let myMetis = props.phMymetis?.myMetis
//   let myGoModel = props.phMyGoModel?.myGoModel
//   let myGoMetamodel = props.phMyGoMetamodel?.myGoMetamodel
//   const curmod = metis.models.find(m => m.id === focusModel?.id)
//   const curmodview = curmod?.modelviews.find(mv => mv.id = focusModelview?.id)
//   const curobjviews = curmodview?.objectviews

//   //let myGoMetamodel = props.phGojs?.gojsMetamodel
//   let phFocus = props.phFocus;
//   let phData = props.phData
//   let phUser = props.phUser
//   let ph = props

//   if (debug) console.log('90 Modelling', metis.metamodels, metis.models, curmod, curmodview, focusModel);

//   const [activeTab, setActiveTab] = useState('2');
//   const toggleTab = tab => { if (activeTab !== tab) setActiveTab(tab);
//     const data = (tab === '1') ? 'Metamodelling' : 'Modelling'
//     // console.log('159', data, dispatch({ type: 'SET_FOCUS_TAB', data }));
//     dispatch({ type: 'SET_FOCUS_TAB', data })
//   }
//   const [tooltipOpen, setTooltipOpen] = useState(false);
//   const toggleTip = () => setTooltipOpen(!tooltipOpen);
//   const [visibleTasks, setVisibleTasks] = useState(true)
//   function toggleTasks() {
//     setVisibleTasks(!visibleTasks);
//   }

//   const data = {
//     phData:   props.phData,
//     phFocus:  props.phFocus,
//     phUser:   props.phUser,
//     // phSource: props.phSource,
//     phSource: (phSource === "") && phData.metis.name  || phSource,
//     lastUpdate: new Date().toISOString()
//   }
//   // ask the user if he wants to reload the last state
//   useEffect(() => { // load local storage if it exists and dispatch the first model project
//     if (window.confirm("Do you want to reload your last model project?")) {
//       ph = memoryLocState[0]
//     }
//     // set the first modelview  as the focus
//     const id = curmod.modelviews[0].id
//     const name = curmod.modelviews[0].name
//     dispatch({ type: 'SET_FOCUS_MODELVIEW', data: {id: id, name: name}  })
//     genGojsModel(props, dispatch);
//   }, []) 

//   function  dispatchToStore() {  
//    if (debug) console.log('104 dispatchToStore memoryLocState ', memoryLocState);
//     const phData = ph?.phData
//     const phFocus = ph?.phFocus
//     const phUser = ph?.phUser
//     const phSource = (ph?.phSource === "") && phData.metis.name  || ph?.phSource 
//     dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: phData })
//     dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: phFocus })
//     dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: phUser })
//     let data = (phSource === "") ? phData.metis.name : phSource
//     dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data })
//   }

//   useEffect(() => {  // refresh the diagram when the focus changes
    
//     genGojsModel(props, dispatch);
//     const timer = setTimeout(() => {
//       if (!debug) console.log('142 Modelling useEffect focus', props.phFocus.focusModel, props.phFocus.focusModelview );
//     }, 1000); 
//     return () => clearTimeout(timer);
//   }, [focusModelview?.id])
//   // }, [focusModelview?.id, focusModel?.id, props.phFocus.focusTargetMetamodel?.id])

//   useEffect(() => {  // save to local storage when the focus changes
//     dispatchToStore()  
//   }, [focusModelview?.id])

//   useEffect(() => { // refresch the model when the focusRefresch changes
//   //   if (!debug) console.log('151 Modelling useEffect refreshid', props.phFocus.focusModel, props.phFocus.focusModelview);
//   //   if (!debug) console.log('159 Modelling useEffect refreshid', props.phData.metis.models);
//   //   saveMemoryLocState()
//     genGojsModel(props, dispatch)
//     function refres() {
//       setRefresh(!refresh)
//     }
//     setTimeout(refres, 1000);

//     genGojsModel(props, dispatch);
//   }, [props.phFocus?.focusRefresh?.id])

//   function toggleRefresh() {
//     // genGojsModel(props, dispatch)
//     function refres() {
//       setRefresh(!refresh)
//     }
//     setTimeout(refres, 100);

//     // saveMemoryLocState()
//     if (debug) console.log('167 Modelling refresh', props.phFocus.focusModel, props.phFocus.focusModelview);
//   }

//   let mdata = null;
//   const  saveMemoryLocState = () => {
//     // if (true) { 
//     if (debug) console.log('152 Modelling', data, memoryLocState, (Array.isArray(memoryLocState)));
//     if (data.phSource == 'INIT-Startup_Project.json') return;  // do not save the startup project
//     if (data.phSource == undefined) return;  // do not save 
//     if (data.phSource === '') return;  // do not save the project
//     if (!Array.isArray(memoryLocState)) return; // do not save the project
//     if (debug) console.log('169 Modelling refresh', data, memoryLocState, );
//     mdata = memoryLocState.filter(m => m.phSource !== data.phSource)
//     if (debug) console.log('171 Modelling refresh', mdata);
//     mdata = [data, ...mdata] // add the new data to the beginning of the array
//     if (debug) console.log('173 Modelling refresh', mdata);
//     mdata = mdata.slice(0, 4); // keep only the last 4 projects
//     if (debug) console.log('175 Modelling refresh', mdata);
//     (typeof window !== 'undefined') && setMemoryLocState(mdata) // Save Project to Memorystate in LocalStorage at every refresh
//     // }
//   }

//   if (debug) console.log('174 Modelling', curmod, curmodview);
//     function handleSaveAllToFileDate() {
//       const projectname = props.phData.metis.name
//       SaveAllToFileDate(data, projectname, 'Project')
//     }
//     function handleSaveAllToFile() {
//       const projectname = props.phData.metis.name
//       SaveAllToFile(data, projectname, 'Project')
//     }


//   // ===================================================================
//   // Divs
//   if (debug) console.log('Modelling: gojsmodel', gojsmodelobjects);
//   const paletteDiv = (gojsmetamodelmodel) // this is the div for the palette with the types tab and the objects tab
//     ?
//       <Palette
//         gojsModel={gojsmetamodelmodel}
//         gojsMetamodel={gojsmetamodelpalette}
//         myMetis={myMetis}
//         myGoModel={myGoModel}
//         myGoMetamodel={myGoMetamodel}
//         metis={metis}
//         phFocus={phFocus}
//         dispatch={dispatch}
//         // modelType='metamodel'
//       /> 
//     : <></>;

//     const paletteMetamodelDiv = (gojsmetamodelmodel) 
//       ?
//         <Modeller
//         gojsModel={gojsmetamodelmodel}
//         gojsMetamodel={gojsmetamodelpalette}
//         myMetis={myMetis}
//         myGoModel={myGoModel}
//         myGoMetamodel={myGoMetamodel}
//         metis={metis}
//         phFocus={phFocus}
//         dispatch={dispatch}
//         modelType='metamodel'
//         phUser={phUser}
//       />
//       : <></>;

//   const targetmetamodelDiv = (curmod?.targetMetamodelRef !== "")
//     ?
//       <TargetMeta
//         gojsModel={gojsmodel}
//         gojsMetamodel={gojsmetamodel}
//         gojsTargetMetamodel={gojstargetmetamodel}
//         myMetis={myMetis}
//         myGoModel={myGoModel}
//         myGoMetamodel={myGoMetamodel}
//         phFocus={phFocus}
//         metis={metis}
//         dispatch={dispatch}
//         modelType='model'
//       />
//     : <></>;

//   const modellingtabs =  (<>
//       <Nav tabs style={{ minWidth: "170px" }}>
//         {/* <NavItem className="text-danger" >
//           <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" }}
//             className={classnames({ active: activeTab === '0' })}
//             onClick={() => { toggleTab('0'); toggleRefresh() }}
//           >
//             {(activeTab === "0") ? 'Template' : 'T'}
//           </NavLink>
//         </NavItem> */}
//         <NavItem>
//         {/* <NavItem className="text-danger" > */}
//           <NavLink style={{  paddingTop: "0px", paddingBottom: "0px", borderColor: "#eee gray white #eee" , color: "black"}}
//             className={classnames({ active: activeTab === '1' })}
//             onClick={() => { toggleTab('1'); toggleRefresh() }}
//           >
//             {(activeTab === "1") ? 'Metamodelling' : 'MM'}
//           </NavLink>
//         </NavItem>
//         <NavItem >
//           <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" , borderColor: "#eee gray white #eee", color: "black"}}
//             className={classnames({ active: activeTab === '2' })}
//             onClick={() => { toggleTab('2'); toggleRefresh() }}
//           >
//             {(activeTab === "2") ? 'Modelling' : 'Modelling'}
//           </NavLink>
//         </NavItem>
//         {/* <NavItem >
//           <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" }}
//             className={classnames({ active: activeTab === '3' })}
//             onClick={() => { toggleTab('3'); toggleRefresh() }}
//           >
//             {(activeTab === "3") ? 'Solution Modelling' : 'SM'}
//           </NavLink>
//         </NavItem> */}
//       </Nav>
//       <TabContent  activeTab={activeTab} >  
//         {/* Template ------------------------------------------*/}
//         {/* <TabPane tabId="0">
//           <Tab /> */}
//             {/* <div className="workpad p-1 pt-2 bg-white">
//               <Row >
//               <Col xs="auto m-0 p-0 pl-3">
//                 <div className="myPalette pl-1 mb-1 pt-0 text-white" style={{ maxWidth: "150px", minHeight: "8vh", height: "100%", marginRight: "2px", backgroundColor: "#999", border: "solid 1px black" }}>
//                   <Palette
//                     gojsModel={gojsmodel}
//                     gojsMetamodel={gojsmetamodel}
//                     gojsModelObjects={gojsmodelobjects}
//                     myMetis={myMetis}
//                     myGoModel={myGoModel}
//                     myGoMetamodel={myGoMetamodel}
//                     metis={metis}
//                     phFocus={phFocus}
//                     dispatch={dispatch}
//                     modelType='model'
//                   />
//                 </div>
//                 </Col>
//               <Col style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}>
//                   <div className="myModeller mb-1 pl-1 pr-1" style={{ backgroundColor: "#ddd", width: "100%", height: "100%", border: "solid 1px black" }}>
//                     <Modeller
//                       gojsModel={gojsmodel}
//                       gojsMetamodel={gojsmetamodel}
//                       myMetis={myMetis}
//                       myGoModel={myGoModel}
//                       myGoMetamodel={myGoMetamodel}
//                       metis={metis}
//                       phFocus={phFocus}
//                       dispatch={dispatch}
//                       modelType='model'
//                       />
//                   </div>
//                 </Col>
//               </Row>
//             </div>          */}
//         {/* </TabPane>  */}
//         {/* Metamodelling --------------------------------*/}
//         <TabPane  tabId="1">
//           <div className="workpad p-1 pt-2 bg-white" >
//             <Row className="row" style={{ height: "100%", marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
//               <Col className="col1 m-0 p-0 pl-3" xs="auto">
//                 <div className="myPalette px-1 mt-0 mb-0 pt-0 pb-1" style={{ height: "100%", marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
//                   {paletteDiv}
//                 </div>
//               </Col>
//               <Col className="col2" style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}>
//                 <div className="myModeller pl-0 mb-0 pr-1" style={{ backgroundColor: "#7ac", minHeight: "7vh", width: "100%", height: "100%", border: "solid 1px black" }}>
//                   {paletteMetamodelDiv}
//                 </div>
//               </Col>
//             </Row>
//           </div>         
//         </TabPane>
//         {/* Modelling ---------------------------------------*/}
//         <TabPane tabId="2">
//           <div className="workpad p-1 pt-2 bg-white">
//             <Row className="row d-flex flex-nowrap h-100">
//               <Col className="col1 m-0 p-0 pl-3" xs="auto">
//                 <div className="myPalette px-1 mt-0 mb-0 pt-0 pb-1" style={{ height: "100%", marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
//                  <Palette
//                     gojsModelObjects={gojsmodelobjects}
//                     gojsModel={gojsmodel}
//                     gojsMetamodel={gojsmetamodel}
//                     myMetis={myMetis}
//                     myGoModel={myGoModel}
//                     myGoMetamodel={myGoMetamodel}
//                     metis={metis}
//                     phFocus={phFocus}
//                     dispatch={dispatch}
//                     modelType='model'
//                   />
//                   {/* <div className="instances"> area for all instance or result of query 
//                   {instances}
//                   </div> */}
//                 </div>
//               </Col>
//               <Col className="col2" style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}>
//                 <div className="myModeller pl-0 mb-0 pr-1" style={{ backgroundColor: "#acc", minHeight: "7vh", width: "100%", height: "100%", border: "solid 1px black" }}>
//                 {/* <div className="myModeller m-0 pl-1 pr-1" style={{ width: "100%", height: "100%", border: "solid 1px black" }}> */}              
//                   <Modeller
//                     gojsModel={gojsmodel}
//                     gojsMetamodel={gojsmetamodel}
//                     myMetis={myMetis}
//                     myGoModel={myGoModel}
//                     myGoMetamodel={myGoMetamodel}
//                     phFocus={phFocus}
//                     phUser={phUser}
//                     phSource={phSource}
//                     metis={metis}
//                     dispatch={dispatch}
//                     modelType='model'
//                   />
//                 </div>
//               </Col>
//               <Col className="col3 mr-0 p-0 " xs="auto">
//                 <div className="myTargetMeta px-0 mb-1 mr-3 pt-0 float-right" style={{ minHeight: "7vh", height: "100%", marginRight: "0px", backgroundColor: "#8ce", border: "solid 1px black" }}>
//                   {targetmetamodelDiv}
//                 </div>
//               </Col>
//             </Row>
//           </div>         
//         </TabPane>
//         {/* Solution Modelling ------------------------------------*/}
//         {/* <TabPane tabId="3">
//           <div className="workpad p-1 pt-2 bg-white">
//             <Row >
//               <Col xs="auto m-0 p-0 pr-0">
//                 <div className="myTargetMeta pl-0 mb-1 pt-0 text-white float-right" style={{ minHeight: "8vh", height: "100%", marginRight: "4px", backgroundColor: "#9a9", border: "solid 1px black" }}>
//                   <TargetMeta
//                     gojsModel={gojsmodel}
//                     gojsMetamodel={gojsmetamodel}
//                     gojsTargetMetamodel={gojstargetmetamodel}
//                     myMetis={myMetis}
//                     myGoModel={myGoModel}
//                     myGoMetamodel={myGoMetamodel}
//                     metis={metis}
//                     phFocus={phFocus}
//                     dispatch={dispatch}
//                     modelType='model'
//                   />
//                 </div>
//               </Col>
//               <Col style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}>
//                 <div className="myModeller mb-1 pt-3 pl-1 pr-1" style={{ backgroundColor: "#ddd", width: "100%", height: "100%", border: "solid 1px black" }}>

//                   <TargetModeller
//                     gojsModel={gojsmodel}
//                     gojsTargetModel={gojstargetmodel}
//                     gojsMetamodel={gojsmetamodel}
//                     myMetis={myMetis}
//                     myGoModel={myGoModel}
//                     myGoMetamodel={myGoMetamodel}
//                     metis={metis}
//                     phFocus={phFocus}
//                     dispatch={dispatch}
//                     modelType='model'
//                   />
//                 </div>
//               </Col>
//             </Row>
//           </div>         
//         </TabPane> */}
//       </TabContent>
//     </>
//     )      

//   if (debug) console.log('383 Modelling', activeTab);
//   const loginserver = (process.browser) && <LoginServer buttonLabel='Login to Server' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} /> 
//   const loadserver = (process.browser) && <LoadServer buttonLabel='Server' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} /> 
//   // const loadlocal =  (process.browser) && <LoadLocal  buttonLabel='Local'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
//   // const loadgitlocal =  (process.browser) && <LoadSaveGit  buttonLabel='GitLocal'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
//   const loadfile =  (process.browser) && <LoadFile  buttonLabel='Model file'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
//   const loadjsonfile =  (process.browser) && <LoadJsonFile  buttonLabel='OSDU'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
//   const loadgithub =  (process.browser) && <LoadGitHub  buttonLabel='GitHub'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
//   const loadrecovery =  (process.browser) && <LoadRecovery  buttonLabel='Recovery'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
  
//   const modelType = (activeTab === '1') ? 'metamodel' : 'model'
//   const EditFocusModalMDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModal buttonLabel='M' className='ContextModal' modelType={'modelview'} ph={props} refresh={refresh} setRefresh={setRefresh} />
//   // const EditFocusModalDiv = <EditFocusModal buttonLabel='Edit' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
//   const EditFocusModalODiv = (focusObjectview?.name || focusObjecttype?.name ) && <EditFocusModal buttonLabel='O' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
//   const EditFocusModalRDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModal className="ContextModal" buttonLabel='R' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
//     // : (focusObjectview.name) && <EditFocusMetamodel buttonLabel='Edit' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
//   // if (debug) console.log('177 Modelling', EditFocusModalDiv);

//   return  mount && (
//     <>
//       <div className="header-buttons mt-1 p-0 pt-1 d-inline-flex float-right" style={{ transform: "scale(0.6)", transformOrigin: "right", backgroundColor: "#ddd" }}>
//         {/* <span className="spacer m-0 p-0 w-50"></span> */}
//         <span className="buttonrow m-0 d-inline-flex" style={{ maxHeight: "9px" }}> 
//           {/* <div className="loadmodel"  style={{ paddingBottom: "2px", backgroundColor: "#ccc", transform: "scale(0.7)",  fontWeight: "bolder"}}> */}
//           {/* <span className=" m-0 px-0 bg-secondary " style={{ minWidth: "125px", maxHeight: "28px", backgroundColor: "#fff"}} > Edit selected :  </span> */}
//           <span data-bs-toggle="tooltip" data-bs-placement="top" title="Select an Relationship and click to edit properties" > {EditFocusModalRDiv} </span>
//           <span data-bs-toggle="tooltip" data-bs-placement="top" title="Select an Object and click to edit properties" > {EditFocusModalODiv} </span>
//           <span data-bs-toggle="tooltip" data-bs-placement="top" title="Click to edit Model and Modelview properties" > {EditFocusModalMDiv} </span>
//           {/* <span className="pt-1 pr-1" > </span> */}
//           <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from file" style={{ minWidth: "108px"}}> {loadfile} </span>
//           <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from OSDU Json file" > {loadjsonfile} </span>
//           {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from localStore or download/upload file" > {loadlocal} </span> */}
//           {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Login to the model repository server (Firebase)" > {loginserver} </span>
//           <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from the model repository server (Firebase)" > {loadserver} </span> */}
//           <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from GitHub" > {loadgithub} </span>
//           <span className="m-0 p-0" style={{transform: "scale(0.9)",minWidth: "96px"}} >Project files:</span>
//           <span className="  " style={{ minWidth: "220px", maxHeight: "22px", backgroundColor: "#fff"}}>
//             <input className="select-input" type="file" accept=".json" onChange={(e) => ReadModelFromFile(props, dispatch, e)} />
//           </span>
//           <span >
//             <button 
//               className="btn-secondary ml-2 mr-2 mb-3 " 
//               data-toggle="tooltip" data-placement="top" data-bs-html="true" 
//               title="Click here to Save the Project&#013;(all models and metamodels) to file &#013;(in Downloads folder)"
//               onClick={handleSaveAllToFile}>Save
//             </button >
//           </span> 
//           {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from Local Repo" > {loadgitlocal} </span> */}
//           {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Recover project from last refresh" > {loadrecovery} </span> */}
//           <span className="btn btn-link float-right"  onClick={toggleRefresh} data-toggle="tooltip" data-placement="top" title="Refresh the modelview" > {refresh ? 'refresh' : 'refresh'} </span>
//         </span> 
  
//       </div>
//       <div className="diagramtabs pl-1 pb-0 " >
//         <div className="modellingContent mt-1 " >
//           {refresh ? <> {modellingtabs} </> : <>{modellingtabs}</>}
//         </div>
//       </div>
//     </>
//   )
// } 
// export default Page(connect(state => state)(page));


