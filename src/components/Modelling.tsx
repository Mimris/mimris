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
import LoadJsonFile from '../components/LoadJsonFile'
import { ReadModelFromFile, SaveAllToFileDate } from './utils/SaveModelToFile';

// import ImpExpJSONFile from '../components/ImpExpJSONFile'
import useLocalStorage  from '../hooks/use-local-storage'
import EditFocusModal from '../components/EditFocusModal'
// import EditFocusMetamodel from '../components/EditFocusMetamodel'
// import Tab from '../components/Tab'
// import {loadDiagram} from './akmm/diagram/loadDiagram'


const page = (props:any) => {

  if (typeof window === 'undefined') return <></>

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
  let debugdelobjects = props.phGojs?.gojsModelObjects || []
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

  if (!debug) console.log('90 Modelling', metis.metamodels, metis.models, curmod, curmodview, focusModel);

    // useEffect(() => {
    //   genGojsModel(props, dispatch);
    //   //focusModel = props.phFocus?.focusModel
    //   if (debug) console.log('68 Modelling useEffect 1 ', curmodview ); 
    //   function refres() {
    //     setRefresh(!refresh)
    //   }
    //   setTimeout(refres, 1);
    // }, [cdebug)

  useEffect(() => {
    if (debug) console.log('99 Modelling useEffect', props); 
    const data = {
      phData: props.phData,
      phFocus: props.phFocus,
      phUser: props.phUser,
      phSource: props.phSource,
      lastUpdate: new Date().toISOString()
    };
    if (debug) console.log('107 Modelling useEffect', data);
    genGojsModel(props, dispatch);
    
    const timer = setTimeout(() => {
      genGojsModel(props, dispatch);
      setRefresh(!refresh)
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [focusModelview?.id, focusModel?.id, props.phFocus.focusTargetMetamodel?.id, curmod])

  useEffect(() => {
    if (debug) console.log('121 Modelling useEffect', props, memoryLocState); 
    const currentdata = {
      phData: props.phData,
      phFocus: props.phFocus,
      phUser: props.phUser,
      phSource: props.phSource,
      lastUpdate: new Date().toISOString()
    };
    if (!debug) console.log('129 Modelling useEffect', memoryLocState, currentdata);

    genGojsModel(props, dispatch);
    
    function refres() {
      setRefresh(!refresh)
    }
    setTimeout(refres, 1);

  }, [props.phFocus?.focusRefresh?.id])


  function toggleRefresh() {

    const currentdata = {
      phData: props.phData,
      phFocus: props.phFocus,
      phUser: props.phUser,
      phSource: (phSource === "") && phData.metis.name  || phSource,
      ladebugte: new Date().toISOString()
    };
    if (debug) console.log('152 Modelling', currentdata, memoryLocState, (Array.isArray(memoryLocState)));
    let data = (Array.isArray(memoryLocState)) ? [currentdata, ...memoryLocState] : [currentdata];
    // put currentdata in the first position of the array data
debug
    if (data.length > 9) { data.shift() }
    if (debug) console.log('161 Modelling', data);


    // setTimeout(refres, 1);
    (typeof window !== 'undefined') && setMemoryLocState(data) // Save Project to Memorystate in LocalStorage at every refresh

    genGojsModel(props, dispatch)

    function refres() {
      setRefresh(!refresh)
    }
    setTimeout(refres, 100);

    setMemoryLocState(data) // Save Project to Memorystate in LocalStorage at every refresh

  }

  if (debug) console.log('174 Modelling', curmod, curmodview);
    // useEffect(() => {
    //   if (debug) console.log('106 Modelling useEffect 4', props); 
    //   genGojsModel(props, dispatch);
    //   function refres() {
    //     setRefresh(!refresh)
    //   }
    //   setTimeout(refres, 1);
    // }, [props.metis])

    // useEffect(() => {
    //   if (debug) console.log('115 Modelling useEffect 5', props); 
    //   genGojsModel(props, dispatch)
    //   setRefresh(!refresh)
    // }, [props.phSource])

    // useEffect(() => {
    //   if (debug) console.log('121 Modelling useEffect 6', props); 
    //   genGojsModel(props, dispatch)
    //   function refres() {
    //     setRefresh(!refresh)
    //   }
    //   setTimeout(refres, 1);
    // }, [props.phUser.focusUser])
    
    const data = {
      phData:   props.phData,
      phFocus:  props.phFocus,
      phUser:   props.phUser,
      phSource: props.phSource,
      lastUpdate: new Date().toISOString()
    }


    function handleSaveAllToFileDate() {
      const projectname = props.phData.metis.name
      // console.log('37 LoadFile', data);
      // SaveAllToFileDate(data, projectname, 'Project')
      SaveAllToFileDate(data, projectname, 'Project')
    }

    let recoveryDiv = <></>;
    function HandleRecoveryFile() {
      recoveryDiv =
        <div>
         
        </div>
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

  const paletteDiv = (gojsmetamodelmodel) 
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
        modelType='metamodel'
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
      <Nav tabs >
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
          {/* <div className="workpad p-1" > */}
            <Row className="row" style={{ height: "100%", marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
              <Col className="col1 m-0 p-0 pl-3" xs="auto">
              {/* <Col xs="ml-3 mr-0 pr-0 pl-0 " sm={8}> */}
              <div className="myPalette px-1 mt-0 mb-0 pt-0 pb-1" style={{ height: "100%", marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
               {/* <div className="myPalette pl-1 mb-2 pt-0" style={{ minHeight: "vh", height: "96%", marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}> */}
                  {/* <div className="myPalette pl-1 text-white bg-secondary" id="lighten" style={{ maxWidth: "100px", minHeight: "10vh", height: "100%", marginRight: "2px", backgroundColor: "whitesmoke", border: "solid 1px black" }}> */}
                  {paletteDiv}
                  {/* <Palette
                    gojsModel={gojsmetamodelmodel}
                    gojsMetamodel={gojsmetamodelpalette}
                    myMetis={myMetis}
                    myGoModel={myGoModel}
                    myGoMetamodel={myGoMetamodel}
                    metis={metis}
                    phFocus={phFocus}
                    dispatch={dispatch}
                    modelType='metamodel'
                    /> */}
                </div>
              </Col>
              <Col className="col2" style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}>
                <div className="myModeller pl-0 mb-0 pr-1" style={{ backgroundColor: "#7ac", minHeight: "7vh", width: "100%", height: "100%", border: "solid 1px black" }}>
                {/* <Col className="col2" style={{ paddingLeft: "1px", marginLeft: "1px" }}> */}
                {/* <div className="myModeller  " style={{ backgroundColor: "#ddd", width: "100%", height: "96%", border: "solid 1px black", backgroundColor: "#7ac" }}> */}
                {/* <div className="myModeller m-0 pl-1 pr-1" style={{ width: "100%", height: "100%", border: "solid 1px black" }}> */}
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
                {/* <div className="myPalette pl-1 pr-1 text-white bg-secondary" id="lighten" style={{ maxWidth: "100px", height: "100%", marginRight: "2px", backgroundColor: "whitesmoke", border: "solid 1px black" }}> */}
                <div className="myPalette px-1 mt-0 mb-0 pt-0 pb-1" style={{ height: "100%", marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
                {/* <div className="myPalette pl-1 pr-1 text-white bg-secondary" id="lighten" style={{ maxWidth: "170px", minHeight: "10vh", height: "100%", marginRight: "2px", border: "solid 1px black" }}> */}
                  <Palette
                    gojsModel={gojsmodel}
                    gojsMetamodel={gojsmetamodel}
                    // gojsModelObjects={gojsmodelobjects}
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
                  {/* <TargetMeta
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
                  /> */}
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
  const loadlocal =  (process.browser) && <LoadLocal  buttonLabel='Local'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
  const loadrecovery =  (process.browser) && <LoadRecovery  buttonLabel='Recovery'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
  const loadfile =  (process.browser) && <LoadFile  buttonLabel='Model file'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
  const loadjsonfile =  (process.browser) && <LoadJsonFile  buttonLabel='OSDU'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 

  const modelType = (activeTab === '1') ? 'metamodel' : 'model'
  const EditFocusModalMDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModal buttonLabel='Model' className='ContextModal' modelType={'modelview'} ph={props} refresh={refresh} setRefresh={setRefresh} />
  // const EditFocusModalDiv = <EditFocusModal buttonLabel='Edit' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
  const EditFocusModalODiv = (focusObjectview?.name || focusObjecttype?.name ) && <EditFocusModal buttonLabel='Object' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
  const EditFocusModalRDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModal className="ContextModal m-0 p-0" buttonLabel='Relship' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
    // : (focusObjectview.name) && <EditFocusMetamodel buttonLabel='Edit' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
  // if (debug) console.log('177 Modelling', EditFocusModalDiv);

  return  mount && (
    <>
      <div className="diagramtabs pl-1 pb-0">
        {/* <div className="diagramtabs pl-1 pb-1 " style={{  backgroundColor: "#ddd", minWidth: "100px" , whitespace: "nowrap"}}> */}
        <span className="btn-link btn-sm float-right"  onClick={toggleRefresh} data-toggle="tooltip" data-placement="top" title="Refresh the modelview" > {refresh ? 'refresh' : 'refresh'} </span>
        <div className="buttonrow m-0 d-inline-flex float-right" style={{transform: "scale(0.6)", position: "relative", top: 0, right: 0 }}>
          {/* <div className="loadmodel"  style={{ paddingBottom: "2px", backgroundColor: "#ccc", transform: "scale(0.7)",  fontWeight: "bolder"}}> */}
            <span className="pt-1 pb-1 m-0 pr-2 bg-secondary " style={{ minWidth: "125px", maxHeight: "28px", backgroundColor: "#fff"}} > Edit selected :  </span>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Select an Relationship and click to edit properties" > {EditFocusModalRDiv} </span>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Select an Object and click to edit properties" > {EditFocusModalODiv} </span>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Click to edit Model and Modelview properties" > {EditFocusModalMDiv} </span>

            <span className="pt-1 pr-1" > </span>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from file" > {loadfile} </span>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from OSDU Json file" > {loadjsonfile} </span>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from localStore or download/upload file" > {loadlocal} </span>
            {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Login to the model repository server (Firebase)" > {loginserver} </span>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from the model repository server (Firebase)" > {loadserver} </span> */}
            Project: 
            <span className="sourceName p-0 ml-2 mb-1 " style={{ minWidth: "130px", maxHeight: "22px", backgroundColor: "#fff"}}>
              <input className="select-input" type="file" accept=".json" onChange={(e) => ReadModelFromFile(props, dispatch, e)}  />
            </span>
            <span >
              <button 
                className="btn-primary ml-2 mr-2 mb-3 " 
                data-toggle="tooltip" data-placement="top" data-bs-html="true" 
                title="Click here to Save the Project&#013;(all models and metamodels) to file &#013;(in Downloads folder)"
                onClick={handleSaveAllToFileDate}>Save
              </button >
            </span> 
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Recover project from last refresh" > {loadrecovery} </span>
          {/* </div>  */}
        </div> 
        <div className="modellingContent pt-3 pr-2"  >
          {refresh ? <> {modellingtabs} </> : <>{modellingtabs}</>}
        </div>
      </div>
    </>
  )
} 
export default Page(connect(state => state)(page));
