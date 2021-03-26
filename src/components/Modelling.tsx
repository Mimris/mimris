// @ts-nocheck
// Diagram.tsx
const debug = false;

// import React from "react";
import { useState, useEffect, useLayoutEffect } from "react";
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
import LoadFile from '../components/LoadFile'
import useLocalStorage  from '../hooks/use-local-storage'
import EditFocusModal from '../components/EditFocusModal'
import EditFocusMetamodel from '../components/EditFocusMetamodel'
// import {loadDiagram} from './akmm/diagram/loadDiagram'


const page = (props:any) => {

  if (!debug) console.log('28 Modelling', props, props.phUser.focusUser.diagram);
  const dispatch = useDispatch();
  const [refresh, setRefresh] = useState(true);
  // const refresh = props.refresh
  // const setRefresh = props.setRefresh
  const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', null); //props);
  if (!memoryLocState) {setMemoryLocState(props)}

  /**  * Get the state from the store  */
  // const state = useSelector((state: any) => state) // Selecting the whole redux store
  let focusModel = useSelector(focusModel => props.phFocus?.focusModel) 
  let focusModelview = useSelector(focusModelview => props.phFocus?.focusModelview) 
  const focusObjectview = useSelector(focusObjectview => props.phFocus?.focusObjectview) 
  const focusRelshipview = useSelector(focusRelshipview => props.phFocus?.focusRelshipview) 
  const focusObjecttype = useSelector(focusObjecttype => props.phFocus?.focusObjecttype) 
  const focusRelshiptype = useSelector(focusRelshiptype => props.phFocus?.focusRelshiptype) 
  // if (debug) console.log('37 Modelling', props.phFocus, focusRelshiptype?.name);

  let gojsmetamodelpalette =  props.phGojs?.gojsMetamodelPalette 
  let gojsmetamodelmodel =  props.phGojs?.gojsMetamodelModel 
  let gojsmodelobjects = props.phGojs?.gojsModelObjects || []
  let gojstargetmetamodel = props.phGojs?.gojsTargetMetamodel || [] // this is the generated target metamodel
  let gojsmodel =  props.phGojs?.gojsModel 
  let gojstargetmodel =  props.phGojs?.gojsTargetModel 
  let gojsmetamodel =  props.phGojs?.gojsMetamodel 

  if (debug) console.log('49 Modelling', gojsmodel, gojsmodelobjects, props);
  
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

  // if (debug) console.log('54 Modelling', props.phGojs, gojsmodelobjects);

    useEffect(() => {
      genGojsModel(props, dispatch);
      //focusModel = props.phFocus?.focusModel
      if (debug) console.log('68 Modelling useEffect 1 ', curmodview ); 
      function refres() {
        setRefresh(!refresh)
      }
      setTimeout(refres, 1);
    }, [curmod])

    useEffect(() => {
      if (debug) console.log('76 Modelling useEffect 2', props); 
      genGojsModel(props, dispatch);
      function refres() {
        setRefresh(!refresh)
      }
      setTimeout(refres, 1);
    }, [focusModelview?.id, focusModel?.id])

    useEffect(() => {
      if (debug) console.log('85 Modelling useEffect 3', props); 
      genGojsModel(props, dispatch);
      function refres() {
        setRefresh(!refresh)
      }
      setTimeout(refres, 10);
    }, [props.phFocus?.focusRefresh?.id])

    // useEffect(() => {
    //   if (debug) console.log('94 Modelling useEffect 4', props); 
    //   genGojsModel(props, dispatch);
    //   function refres() {
    //     setRefresh(!refresh)
    //   }
    //   setTimeout(refres, 1);
    // }, [props.metis])

    useEffect(() => {
      if (debug) console.log('103 Modelling useEffect 5', props); 
      genGojsModel(props, dispatch)
      setRefresh(!refresh)
    }, [props.phSource])

  
  function toggleRefresh() {
    if (!debug) console.log('116 Modelling',  props.phUser.focusUser.diagram);
    const data = {
      phData: props.phData,
      phFocus: props.phFocus,
      phUser: props.phUser,
      phSource: 'localStore'
    };
    // setTimeout(refres, 1);
    if (!debug) console.log('123 Modelling', props.phUser.focusUser, data);
    setMemoryLocState(data) // Save Project to Memorystate in LocalStorage at every refresh
    genGojsModel(props, dispatch)
    function refres() {
      setRefresh(!refresh)
    }
    setTimeout(refres, 100);
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

  const modellingtabs = (<>
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
      {/* Template */}
      {/* <TabPane tabId="0">
          <div className="workpad p-1 pt-2 bg-white">
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
          </div>         
        </TabPane> */}
        {/* Metamodelling */}
        <TabPane  tabId="1">
          <div className="workpad p-1" >
            <Row >
              <Col xs="auto ml-3 mr-0 pr-0 pl-0">
                <div className="myPalette pl-1 mb-2 pt-0" style={{ minHeight: "vh", height: "96%", marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
                  {/* <div className="myPalette pl-1 text-white bg-secondary" id="lighten" style={{ maxWidth: "100px", minHeight: "10vh", height: "100%", marginRight: "2px", backgroundColor: "whitesmoke", border: "solid 1px black" }}> */}
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
                </div>
              </Col>
              <Col style={{ paddingLeft: "1px", marginLeft: "1px" }}>
              <div className="myModeller  " style={{ backgroundColor: "#ddd", width: "100%", height: "96%", border: "solid 1px black", backgroundColor: "#7ac" }}>
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
        {/* Modelling */}
        <TabPane tabId="2">
          <div className="workpad p-1 pt-2 bg-white">
            <Row >
            <Col xs="auto m-0 p-0 pl-3">
              {/* <div className="myPalette pl-1 pr-1 text-white bg-secondary" id="lighten" style={{ maxWidth: "100px", height: "100%", marginRight: "2px", backgroundColor: "whitesmoke", border: "solid 1px black" }}> */}
              <div className="myPalette px-1 mt-0 mb-0 pt-0  pb-1" style={{ height: "100%", marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
              {/* <div className="myPalette pl-1 pr-1 text-white bg-secondary" id="lighten" style={{ maxWidth: "170px", minHeight: "10vh", height: "100%", marginRight: "2px", border: "solid 1px black" }}> */}
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
                {/* <div className="instances"> area for all instance or result of query 
                {instances}
                 </div> */}
              </div>
              </Col>
            <Col style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}>
                <div className="myModeller pl-0 mb-0 pr-1" style={{ backgroundColor: "#acc", minHeight: "7vh", width: "100%", height: "100%", border: "solid 1px black" }}>
                {/* <div className="myModeller m-0 pl-1 pr-1" style={{ width: "100%", height: "100%", border: "solid 1px black" }}> */}
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
                    phUser={phUser}
                  />
                </div>
              </Col>
            <Col xs="auto m-0 p-0 pr-0">
              <div className="myTargetMeta pl-0 mb-1 mr-3 pt-0 float-right" style={{ minHeight: "7vh", height: "100%", marginRight: "4px", backgroundColor: "#8ce", border: "solid 1px black" }}>
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
            </Row>
          </div>         
        </TabPane>
        {/* Solution Modelling */}
        <TabPane tabId="3">
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
                {/* <div className="myModeller m-0 pl-1 pr-1" style={{ width: "100%", height: "100%", border: "solid 1px black" }}> */}
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
        </TabPane>
      </TabContent>
    </>
    )      

  if (debug) console.log('383 Modelling', activeTab);
  const loginserver = (process.browser) && <LoginServer buttonLabel='Login to Server' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} /> 
  const loadserver = (process.browser) && <LoadServer buttonLabel='Server' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} /> 
  const loadlocal =  (process.browser) && <LoadLocal  buttonLabel='Local'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
  const loadfile =  (process.browser) && <LoadFile  buttonLabel='File'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 

  const modelType = (activeTab === '1') ? 'metamodel' : 'model'
  const EditFocusModalMDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModal buttonLabel='Model' className='ContextModal' modelType={'modelview'} ph={props} refresh={refresh} setRefresh={setRefresh} />
  // const EditFocusModalDiv = <EditFocusModal buttonLabel='Edit' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
  const EditFocusModalODiv = (focusObjectview?.name || focusObjecttype?.name ) && <EditFocusModal buttonLabel='Object' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
  const EditFocusModalRDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModal buttonLabel='Relship' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
    // : (focusObjectview.name) && <EditFocusMetamodel buttonLabel='Edit' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
  // if (debug) console.log('177 Modelling', EditFocusModalDiv);
  const editLabel = <span className="text-gray m-1">Edit : </span>

  return (
    <>
      <span id="lighten" className="btn-link btn-sm" style={{ float: "right" }} onClick={toggleRefresh}
        data-toggle="tooltip" data-placement="top" title="Refresh the modelview"
      >{refresh ? 'refresh' : 'refresh'} </span>
      <div className="diagramtabs pl-1 pb-1 " style={{  backgroundColor: "#ddd", minWidth: "200px" }}>
        <div style={{ transform: "scale(0.9)"}}>
          <span className="sourceName pr-1 float-right mr-0 mt-1" 
            style={{ backgroundColor: "#fff", color: "#b00", transform: "scale(0.9)",  fontWeight: "bolder"}}>
              Current source: {props.phSource}
          </span> 
          <span className="loadmodel float-right"  style={{ padding: "1px", backgroundColor: "#ccc", transform: "scale(0.7)",  fontWeight: "bolder"}}>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from the model repository server (Firebase)" >
              {loadserver} 
            </span>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Login to the model repository server (Firebase)" >
             {loginserver} 
            </span>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from localStore or download/upload file" >
             {loadlocal}  
            </span>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from file" >
             {loadfile}  
            </span>
          </span> 
          <span className="editfocus float-right d-flex"   
            data-bs-toggle="tooltip" data-bs-placement="top" title="Select an Object or Relationship and click to edit properties" 
            style={{ padding: "1px", backgroundColor: "#ccc", transform: "scale(0.7)",  fontWeight: "bolder"}}>
            {editLabel} {EditFocusModalRDiv} {EditFocusModalODiv}{EditFocusModalMDiv}
          </span>
        </div> 
        {/* <div className="modellingContent pt-1" > */}
        <div className="modellingContent pt-1 pr-2"  >
          {/* {modellingtabs} */}
          {refresh ? <> {modellingtabs} </> : <>{modellingtabs}</>}
        </div>
        <style jsx>{`

        `}</style>
      </div>
    </>
  )
} 
export default Page(connect(state => state)(page));
