// @ts-nocheck
// modelling

const debug = false;

// import React from "react";
import { useRouter } from "next/router";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import Page from './page';
import Palette from "./Palette";
import Modeller from "./Modeller";
import TargetModeller from "./TargetModeller";
import TargetMeta from "./TargetMeta";
import GenGojsModel from './GenGojsModel'
import LoadServer from '../components/loadModelData/LoadServer'
import LoginServer from './loadModelData/LoginServer'
// import LoadLocal from '../components/loadModelData/LoadLocal'
import LoadRecovery from '../components/loadModelData/LoadRecovery'
import LoadFile from './loadModelData/LoadFile'
import LoadGitHub from '../components/loadModelData/LoadGitHub'
// import LoadSaveGit from '../components/loadModelData/LoadSaveGit'
import LoadJsonFile from '../components/loadModelData/LoadJsonFile'
import { ReadModelFromFile, SaveAllToFile, SaveAllToFileDate } from './utils/SaveModelToFile';

// import ImpExpJSONFile from '../components/loadModelData/ImpExpJSONFile'
import useLocalStorage  from '../hooks/use-local-storage'
import EditFocusModal from '../components/EditFocusModal'
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
// import loadModel from "./utils/LoadGithubmodel";
// import EditFocusMetamodel from '../components/loadModelData/EditFocusMetamodel'
// import Tab from '../components/loadModelData/Tab'
// import {loadDiagram} from './akmm/diagram/loadDiagram'


const clog = console.log.bind(console, '%c %s', // green colored cosole log
    'background: blue; color: white');
const useEfflog = console.log.bind(console, '%c %s', // green colored cosole log
    'background: red; color: white');
const ctrace = console.trace.bind(console, '%c %s',
    'background: blue; color: white');


const page = (props:any) => {

  if (typeof window === 'undefined') return <></>
  
  // if (!props) return <></>
  
  if (debug) clog('52 Modelling:', props);

        
  const dispatch = useDispatch();
  
  const [refresh, setRefresh] = useState(true);
  const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', null); //props);

  const [activeTab, setActiveTab] = useState('2');
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [visibleTasks, setVisibleTasks] = useState(true)


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

  const [mount, setMount] = useState(false)


  function toggleRefresh() { // when refresh is toggled, first change focusModel if not exist then  save the current state to memoryLocState, then refresh
    if (debug) console.log('80 Modelling', props) //, memoryLocState, (Array.isArray(memoryLocState)));
    if (memoryLocState && Array.isArray(memoryLocState) && memoryLocState.length > 0) {
      // set focusOrg and focusProj to focusProj.org and focusProj.proj
      if (props.phFocus.focusOrg.name !== props.phFocus.focusProj.org ) {
        props.phFocus.focusOrg = props.phFocus.focusProj.org || props.phFocus.focusOrg
      }
      if (props.phFocus.focusProj.name !== props.phFocus.focusProj.proj) {
        props.phFocus.focusProj = props.phFocus.focusProj.proj || props.phFocus.focusProj
      }
      // check if focusModel exists in one of the current models. If not, set it to the first model
      let found = false;
      for (let i = 0; i < props.phData?.metis.models.length; i++) {
        if (props.phFocus.focusModel.id === props.phData?.metis.models[i]) {
          found = true;
          break;
        }
      }
      if (!found) {
        props.phFocus.focusModel = props.phData.metis.models[0]
      }
      // put currentdata in the first position of the array data
      let mdata = (memoryLocState && Array.isArray(memoryLocState)) ? [{phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser}, ...memoryLocState] : [{phData: props.phData, phFocus: props.phFocus,phSource: props.phSource, phUser: props.phUser}];
      if (!debug) console.log('84 Modelling refresh', mdata);
      // if mdata is longer than 10, remove the last 2 elements
      if (mdata.length > 2) {mdata = mdata.slice(0, 2)}
      if (mdata.length > 2) { mdata.pop() }
      if (debug) console.log('88 Modelling refresh', mdata);
      (typeof window !== 'undefined') && setMemoryLocState(mdata) // Save Project to Memorystate in LocalStorage at every refresh
    } else {
      if (!debug) console.log('91 Modelling refresh', props);
      setMemoryLocState([{phData: props.phData, phFocus: props.phFocus,phSource: props.phSource, phUser: props.phUser}]) // Save Project to Memorystate in LocalStorage at every refresh
    }
    GenGojsModel(props, dispatch)
    const timer = setTimeout(() => {
      if (debug) console.log('90 Modelling toggleRefresH', props);
      setRefresh(!refresh)
    }, 10);
    return () => clearTimeout(timer);
  } 

  useEffect(() => {
    useEfflog('103 Modelling useEffect 1', props);
    GenGojsModel(props, dispatch);
    setMount(true)
  }, [])

  useEffect(() => {
    useEfflog('109 Modelling useEffect 2', props);
    GenGojsModel(props, dispatch);
    const timer = setTimeout(() => {
      setRefresh(!refresh)
    }, 1000);
    return () => clearTimeout(timer);
  }, [props.phFocus.focusModelview.id && (props.phFocus.focusModel.id !== props.phData?.metis?.models[0].id)])

  // useEffect(() => {
  //   useEfflog('115 Modelling useEffect 3', props, props.phData?.metis?.name);
  //   // GenGojsModel(props, dispatch);
  //   dispatch({type: 'SET_FOCUS_PHFOCUS', data: props.phFocus })
  //   const timer = setTimeout(() => {
  //     setRefresh(!refresh)
  //     }, 1000);
  //     return () => clearTimeout(timer);
  // }, [props.metis?.name])

    useEffect(() => { // Genereate GoJs node model when the focusRefresch.id changes
      useEfflog('125 Modelling useEffect 4', props);
      // dispatch({type: 'SET_FOCUS_PHFOCUS', data: props.phFocus })
      GenGojsModel(props, dispatch);
      const timer = setTimeout(() => {
        setRefresh(!refresh)
      }
      , 10);
      return () => clearTimeout(timer);
    }, [props.phFocus?.focusRefresh?.id])

  if (!mount) {
    return <></>
  } else {
    let metis = props.phData?.metis
    let myMetis = props.phMymetis?.myMetis
    let myGoModel = props.phMyGoModel?.myGoModel
    let myGoMetamodel = props.phMyGoMetamodel?.myGoMetamodel

    let gojsmetamodelpalette =  props.phGojs?.gojsMetamodelPalette 
    let gojsmetamodelmodel =  props.phGojs?.gojsMetamodelModel 
    let gojsmodelobjects = props.phGojs?.gojsModelObjects // || []
    let gojstargetmetamodel = props.phGojs?.gojsTargetMetamodel || [] // this is the generated target metamodel
    let gojsmodel =  props.phGojs?.gojsModel 
    let gojsmetamodel =  props.phGojs?.gojsMetamodel 

    let gojstargetmodel =  props.phGojs?.gojsTargetModel 

    if (debug) console.log('93 Modelling: gojsmodel', props, gojsmodel, props.phGojs?.gojsModel);
    
    const curmod = metis?.models?.find(m => m.i === focusModel?.id)
    const curmodview = curmod?.modelviews.find(mv => mv.id = focusModelview?.id)
    const curobjviews = curmodview?.objectviews

    //let myGoMetamodel = props.phGojs?.gojsMetamodel
    let phFocus = props.phFocus;
    let phData = props.phData
    let phUser = props.phUser

    if (debug) console.log('90 Modelling', metis.metamodels, metis.models, curmod, curmodview, focusModel);
    if (debug) console.log('174 Modelling', curmod, curmodview);

    function handleSaveAllToFileDate() {
      const projectname = props.phData.metis.name
      SaveAllToFileDate({phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser}, projectname, 'Project')
    }

    function handleSaveAllToFile() {
      const projectname = props.phData.metis.name
      SaveAllToFile({phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser}, projectname, 'Project')
    }
    
    const toggleTab = tab => { if (activeTab !== tab) setActiveTab(tab);
      const data = (tab === '1') ? 'Metamodelling' : 'Modelling'
      // console.log('159', store, dispatch({ type: 'SET_FOCUS_TAB', store }));
      dispatch({ type: 'SET_FOCUS_TAB', data })
    }
  
    const toggleTip = () => setTooltipOpen(!tooltipOpen);
    
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


  

    const modellingtabs =  (
      <>
        <Nav tabs >
          {/* <NavItem className="text-danger" >  // this is the tab for the template
            <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" }}
              className={classnames({ active: activeTab === '0' })}
              onClick={() => { toggleTab('0'); toggleRefresh() }}
            >
              {(activeTab === "0") ? 'Template' : 'T'}
            </NavLink>
          </NavItem> */}
          <NavItem > {/*this is the tab for the metamodel */}
          {/* <NavItem className="text-danger" > */}
            <NavLink style={{  paddingTop: "0px", paddingBottom: "0px", borderColor: "#eee gray white #eee" , color: "black"}}
              className={classnames({ active: activeTab === '1' })}
              onClick={() => { toggleTab('1'); toggleRefresh() }}
            >
              {(activeTab === "1") ? 'Metamodelling' : 'Metamodelling'}
            </NavLink>
          </NavItem>
          <NavItem > {/* this is the tab for the model */}
            <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" , borderColor: "#eee gray white #eee", color: "black"}}
              className={classnames({ active: activeTab === '2' })}
              onClick={() => { toggleTab('2'); toggleRefresh() }}
            >
              {(activeTab === "2") ? 'Modelling' : 'Modelling'}
            </NavLink>
          </NavItem>
          {/* <NavItem > // this is the tab for the solution modelling 
            <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" }}
              className={classnames({ active: activeTab === '3' })}
              onClick={() => { toggleTab('3'); toggleRefresh() }}
            >
              {(activeTab === "3") ? 'Solution Modelling' : 'SM'}
            </NavLink>
          </NavItem> */}
        </Nav>
        <TabContent  activeTab={activeTab} >  
          <>
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

          </>

          <TabPane  tabId="1">   {/* Metamodelling --------------------------------*/}
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

          <TabPane tabId="2">   {/* Modelling ---------------------------------------*/}
            <div className="workpad p-1 pt-2 bg-white">
              <Row className="row1">
                <Col className="col1 m-0 p-0 pl-3" xs="auto"> {/* Object Intances */}
                  <div className="myPalette px-1 mt-0 mb-0 pt-0 pb-1" style={{  marginRight: "2px", minHeight: "7vh", backgroundColor: "#7ac", border: "solid 1px black" }}>
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
                  {/* <Col style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}>
                    <div className="mmname mx-0 px-1 mb-1" style={{fontSize: "16px", minWidth: "184px", maxWidth: "212px"}}>{objectsnamediv}</div>
                    <div className="myModeller mb-1 pl-1 pr-1" style={{ backgroundColor: "#ddd", width: "100%", height: "100%", border: "solid 1px black" }}>
                      <GoJSPaletteApp // this is the Objects list
                      nodeDataArray={gojsobjects.nodeDataArray}
                      linkDataArray={[]}
                      metis={props.metis}
                      myMetis={props.myMetis}
                      myGoModel={props.myGoModel}
                      phFocus={props.phFocus}
                      dispatch={props.dispatch}
                      />
                    </div>
                </Col> */}

                <Col className="col2" style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}> {/* Modelling area */}
                  <div className="myModeller pl-0 mb-0 pr-1" style={{ backgroundColor: "#acc", minHeight: "7vh", width: "100%", height: "100%", border: "solid 1px black" }}>
                  {/* <div className="mmname mx-0 px-1 mb-1" style={{fontSize: "16px", minWidth: "184px", maxWidth: "212px"}}>{objectsnamediv}</div> */}
                  {/* <div className="myModeller m-0 pl-1 pr-1" style={{ width: "100%", height: "100%", border: "solid 1px black" }}> */}              
                    <Modeller // this is the Modeller ara
                      gojsModelObjects={gojsmodelobjects}
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
                <Col className="col3 mr-0 p-0 " xs="auto"> {/* Targetmodel area */}
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
    const loginserver = (typeof window !== 'undefined') && <LoginServer buttonLabel='Login to Server' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} /> 
    const loadserver = (typeof window !== 'undefined') && <LoadServer buttonLabel='Server' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} /> 
    // const loadlocal =  (typeof window !== 'undefined') && <LoadLocal  buttonLabel='Local'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
    // const loadgitlocal =  (typeof window !== 'undefined') && <LoadSaveGit  buttonLabel='GitLocal'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
    const loadfile =  (typeof window !== 'undefined') && <LoadFile  buttonLabel='Modelfile'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
    const loadjsonfile =  (typeof window !== 'undefined') && <LoadJsonFile  buttonLabel='OSDU'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
    const loadgithub =  (typeof window !== 'undefined') && <LoadGitHub  buttonLabel='GitHub'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
    const loadrecovery =  (typeof window !== 'undefined') && <LoadRecovery  buttonLabel='Recovery'  className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh} /> 
    
    const modelType = (activeTab === '1') ? 'metamodel' : 'model'
    const EditFocusModalMDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModal buttonLabel='M' className='ContextModal' modelType={'modelview'} ph={props} refresh={refresh} setRefresh={setRefresh} />
    // const EditFocusModalDiv = <EditFocusModal buttonLabel='Edit' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
    const EditFocusModalODiv = (focusObjectview?.name || focusObjecttype?.name ) && <EditFocusModal buttonLabel='O' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
    const EditFocusModalRDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModal className="ContextModal" buttonLabel='R' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
      // : (focusObjectview.name) && <EditFocusMetamodel buttonLabel='Edit' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
    if (debug) console.log('460 Modelling', gojsmodelobjects);

  
    // return  (mount && (gojsmodelobjects?.length > 0)) ? (
    return  (
      <>
        <div className="header-buttons float-end" style={{  transform: "scale(0.7)", transformOrigin: "center",  backgroundColor: "#ddd" }}>
          {/* <span className="spacer m-0 p-0 w-50"></span> */}
          <span className="buttonrow mr-4 d-flex justify-content-between" style={{ width: "66rem", maxHeight: "9px", minHeight: "30px" }}> 
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
            <span className="pt" style={{transform: "scale(0.9)",minWidth: "96px"}} >Project files:</span>
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
            <span className="btn px-2 py-0 mt-0 pt-1 bg-light text-primary float-right"  onClick={toggleRefresh} data-toggle="tooltip" data-placement="top" title="Refresh the modelview" > {refresh ? 'refresh' : 'refresh'} </span>
          </span> 
        </div>
        
        <div className="diagramtabs pb-0" >
          <div className="modellingContent mt-1">
            {refresh ? <> {modellingtabs} </> : <>{modellingtabs}</>}
          </div>
        </div>
      </>
    )
 }
} 

export default Page(connect(state => state)(page));
