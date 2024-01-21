// @ts- nocheck
// modelling

const debug = false;

// import React from "react";
import { useRouter } from "next/router";
import { useState, useEffect, useLayoutEffect, useRef, use } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';

import Page from './page';
// import StartInitStateJson from '../startupModel/AKM-INIT-Startup_PR.json'
// import StartStateJson from '../startupModel/AKM-Start-IRTV_PR.json'
import Palette from "./Palette";
import Modeller from "./Modeller";
import TargetModeller from "./TargetModeller";
import TargetMeta from "./TargetMeta";
import GenGojsModel from './GenGojsModel'
import LoadServer from '../components/loadModelData/LoadServer'
import LoginServer from './loadModelData/LoginServer'
import LoadRecovery from '../components/loadModelData/LoadRecovery'
import LoadFile from './loadModelData/LoadFile'
import LoadGitHub from '../components/loadModelData/LoadGitHub'
import LoadNewModelProjectFromGithub from './loadModelData/LoadNewModelProjectFromGitHub'
import LoadMetamodelFromGithub from './loadModelData/LoadMetamodelFromGitHub'
import LoadJsonFile from '../components/loadModelData/LoadJsonFile'
import { ReadModelFromFile } from './utils/ReadModelFromFile';
import { SaveAllToFile, SaveAllToFileDate } from './utils/SaveModelToFile';
import { SaveModelToLocState } from "./utils/SaveModelToLocState";
import { SaveAkmmUser } from "./utils/SaveAkmmUser";
import ReportModule from "./ReportModule";
import ProjectDetailsModal from "./modals/ProjectDetailsModal";
import useLocalStorage from '../hooks/use-local-storage'
import EditFocusModal from '../components/EditFocusModal'
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
import CreateNewModel  from './akmm-api/CreateNewModel';
import ModellingHeaderButtons from "./utils/ModellingHeaderButtons";


import * as akm from '../akmm/metamodeller';
import * as uib from '../akmm/ui_buildmodels';
import { set } from "immer/dist/internal";
const constants = require('../akmm/constants');

const clog = console.log.bind(console, '%c %s', // green colored cosole log
  'background: blue; color: white');
const useEfflog = console.log.bind(console, '%c %s', // green colored cosole log
  'background: red; color: white');
const ctrace = console.trace.bind(console, '%c %s',
  'background: blue; color: white');

const page = (props: any) => {

  if (typeof window === 'undefined') return <></>
  // if (!props) return <></>
  if (debug) console.log('57 Modelling:', props)//, props);        
  const dispatch = useDispatch();

  const [refresh, setRefresh] = useState(true);
  // const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', null); //props);
  const [memoryAkmmUser, setMemoryAkmmUser] = useLocalStorage('akmmUser', ''); //props);

  const [activeTab, setActiveTab] = useState('2');
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [visibleTasks, setVisibleTasks] = useState(true)
  // const [visibleContext, setVisibleContext] = useState(true)

  /**  * Get the state from the store  */
  // const state = useSelector((state: any) => state) // Selecting the whole redux store
  // let phFocus = useSelector(phFocus => props.phFocus)
  // let phData = useSelector(phData => props.phData)
  // let phUser = useSelector(phUser => props.phUser)

  let focusModel = useSelector(focusModel => props.phFocus?.focusModel)
  let focusModelview = useSelector(focusModelview => props.phFocus?.focusModelview)
  const focusObjectview = useSelector(focusObjectview => props.phFocus?.focusObjectview)
  const focusRelshipview = useSelector(focusRelshipview => props.phFocus?.focusRelshipview)
  const focusObjecttype = useSelector(focusObjecttype => props.phFocus?.focusObjecttype)
  const focusRelshiptype = useSelector(focusRelshiptype => props.phFocus?.focusRelshiptype)
  const phSource = useSelector(phSource => props.phSource)
  if (debug) console.log('69 Modelling', focusModel, focusModelview);

  const [mount, setMount] = useState(false)
  const ph = props
  const metis = ph.phData?.metis
  const models = metis?.models || []

  const curmod = (models && focusModel?.id) && models?.find((m: any) => m.id === focusModel.id)  // find the current model
  const curmodview = (curmod && focusModelview?.id && curmod.modelviews?.find((mv: any) => mv.id === focusModelview.id))
    ? curmod?.modelviews?.find((mv: any) => mv.id === focusModelview.id)
    : curmod?.modelviews[0] // if focusmodview does not exist set it to the first
  if (debug) console.log('169 Modelling curmodview', curmod, curmodview, models, focusModel?.name, focusModelview?.name);

  function toggleRefresh() { // when refresh is toggled, first change focusModel if not exist then  save the current state to memoryLocState, then refresh
    if (debug) console.log('71 Modelling GenGojsModel run') //, memoryLocState, (Array.isArray(memoryLocState)));
    GenGojsModel(props, dispatch)
    // SaveModelToLocState(props, memoryLocState, setMemoryLocState)  // this does not work
    const timer = setTimeout(() => {
      setRefresh(!refresh)
    }, 100);
    return () => clearTimeout(timer);
  }

  useEffect(() => {
    if (debug) useEfflog('106 Modelling useEffect 1 [] : ', props);
    GenGojsModel(props, dispatch);
    setMount(true)
  }, [])

  useEffect(() => {
    if (debug) useEfflog('112 Modelling useEffect 2 [activTab]', props);
    GenGojsModel(props, dispatch);
  }, [activeTab])

  useEffect(() => {
    if (debug) useEfflog('117 Modelling useEffect 3 [curmodview?.objectviews.length]', props);
    GenGojsModel(props, dispatch);
  }, [curmodview?.objectviews.length])


  useEffect(() => { // Genereate GoJs node model when the focusRefresch.id changes
    if (debug) useEfflog('122 Modelling useEffect 4 [props.phFocus?.focusModelview.id]',
      props.phFocus.focusModel?.name,
      props.phFocus.focusModelview?.name,
      props.phFocus?.focusRefresh?.name,
    );
    GenGojsModel(props, dispatch);
    const timer = setTimeout(() => {
      if (debug) console.log('134 ',
        props.phFocus.focusModel?.name,
        props.phFocus.focusModelview?.name,
        props.phFocus?.focusRefresh?.name,
      );
      setRefresh(!refresh)
    }, 50);
    return () => clearTimeout(timer);
  }, [props.phFocus?.focusModelview?.id])

  // useEffect(() => {
  //   if (debug) useEfflog('149 Modelling useEffect 5 [memoryAkmmUser]', memoryAkmmUser);
  //   setRefresh(!refresh)
  // }, [memoryAkmmUser])

  // useEffect(() => {
  //   if (debug) useEfflog('154 Modelling useEffect 6 [props.phFocus?.focusRefresh?.id]');
  //   GenGojsModel(props, dispatch);
  //   const timer = setTimeout(() => {
  //     setRefresh(!refresh)
  //   }, 200);
  //   return () => clearTimeout(timer);
  // }, [props.phFocus?.focusRefresh?.id])

  const focusTargetModel = (props.phFocus) && props.phFocus.focusTargetModel
  const focusTargetModelview = (props.phFocus) && props.phFocus.focusTargetModelview
  const curtargetmodel = (models && focusTargetModel?.id) && models.find((m: any) => m.id === curmod?.targetModelRef)
  const focustargetmodelview = (curtargetmodel && focusTargetModelview?.id) && curtargetmodel.modelviews.find((mv: any) => mv.id === focusTargetModelview?.id)
  const curtargetmodelview = focustargetmodelview || curtargetmodel?.modelviews[0]


  const includeDeleted = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const includeNoObject = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const includeInstancesOnly = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const showModified = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showModified : false;

  let gojsmetamodelpalette, gojsmetamodelmodel, gojsmodel, gojsmetamodel, gojsmodelobjects, gojstargetmodel, gojstargetmetamodel
  let myMetis, myModel, myGoModel, myGoObjectPalette, myGoRelshipPalette, myGoMetamodel, myGoMetamodelModel, myGoMetamodelPalette
  let myMetamodel, myTargetModel, myTargetModelview, myTargetMetamodel, myTargetMetamodelPalette
  let myModelview, myGoModelview, myGoMetamodelView, myGoMetamodelModelview, myGoMetamodelPaletteview

  myMetis = props.phMymetis?.myMetis // get the myMetis object from  the store
  // myModel = myMetis?.currentModel;
  myModel = myMetis?.findModel(curmod?.id);

  myModelview = (curmodview) && myMetis?.findModelView(curmodview?.id);
  myMetamodel = myModel?.metamodel;
  myMetamodel = (myMetamodel) ? myMetis.findMetamodel(myMetamodel?.id) : null;

  myTargetModel = myMetis?.findModel(curtargetmodel?.id);
  myTargetModelview = (curtargetmodelview) && myMetis.findModelView(focusTargetModelview?.id)
  myTargetMetamodel = (myMetis) && myMetis.findMetamodel(curmod?.targetMetamodelRef) || null;
  myTargetMetamodelPalette = (myTargetMetamodel) && uib.buildGoPalette(myTargetMetamodel, myMetis);

  if (debug) console.log('178 Modelling ', props, myMetis, myModel, myModelview, myMetamodel);

  if (!myMetis || !myModel || !myModelview || !myMetamodel) {
    console.error('188 One of the required variables is undefined: myMetis: ', myMetis,  'myModel: ', 'myModelview: ', myModelview, 'myMetamodel: ', myMetamodel);
    return;
  }
  myGoModel = uib.buildGoModel(myMetis, myModel, myModelview, includeDeleted, includeNoObject, showModified) //props.phMyGoModel?.myGoModel
  myGoMetamodel = uib.buildGoMetaPalette() //props.phMyGoMetamodel?.myGoMetamodel
  myGoMetamodelModel = uib.buildGoMetaModel(myMetamodel, includeDeleted, showModified) //props.phMyGoMetamodelModel?.myGoMetamodelModel
  myGoMetamodelPalette = uib.buildGoPalette(myMetamodel, myMetis) //props.phMyGoMetamodelPalette?.myGoMetamodelPalette
  // myGoObjectPalette = uib.buildObjectPalette(myModel?.objects, myMetis) //props.phMyGoObjectPalette?.myGoObjectPalette
  if (!myModel.objects) {
    console.log('196 myModel.objects is undefined');
  } else {
    myGoObjectPalette = uib.buildObjectPalette(myModel.objects, myMetis);
  }

  if (!myGoObjectPalette) {
    console.log('202 myGoObjectPalette is undefined after function call');
  }
  // myGoRelshipPalette = uib.buildRelshipPalette(myModel?.relships, myMetis) //props.phMyGoRelshipPalette?.myGoRelshipPalette  Todo: build this
  if (debug) console.log('188 Modelling ', myGoObjectPalette);
  myMetis?.setGojsModel(myGoModel);
  myMetis?.setCurrentMetamodel(myMetamodel);
  myMetis?.setCurrentModel(myModel);
  myMetis?.setCurrentModelview(myModelview);
  (myTargetModel) && myMetis?.setCurrentTargetModel(myTargetModel);
  (myTargetModelview) && myMetis?.setCurrentTargetModelview(myTargetModelview);

  // set the gojs objects from the myMetis objects
  gojsmetamodelpalette = (myGoMetamodel) &&   // props.phGojs?.gojsMetamodelPalette 
  {
    nodeDataArray: myGoMetamodel?.nodes,
    linkDataArray: myGoMetamodel?.links
  }

  gojsmetamodelmodel = (myGoMetamodelModel) &&
  {
    nodeDataArray: myGoMetamodelModel?.nodes,
    linkDataArray: myGoMetamodelModel?.links
  }
  gojsmodel = (myGoModel) && //props.phGojs?.gojsModel 
  {
    nodeDataArray: myGoModel.nodes,
    linkDataArray: myGoModel.links
  }
  if (debug) console.log('213 Modelling: gojsmodel', gojsmodel)
  gojsmetamodel = (myGoMetamodelPalette) &&   // props.phGojs?.gojsMetamodel 
  {
    nodeDataArray: myGoMetamodelPalette?.nodes,
    linkDataArray: myGoMetamodelPalette?.links
  }

  gojsmodelobjects = (myGoModel) &&// props.phGojs?.gojsModelObjects // || []
  {
    nodeDataArray: myGoObjectPalette,
    linkDataArray: myGoRelshipPalette || []
  }
  if (debug) console.log('225 Modelling: gojsmodelobjects', gojsmodelobjects)
  gojstargetmodel = (myTargetModel) && //props.phGojs?.gojsTargetModel 
  {
    nodeDataArray: myGoModel.nodes,
    linkDataArray: myGoModel.links 
  }
  gojstargetmetamodel = (myTargetMetamodel) &&    // props.phGojs?.gojsTargetMetamodel || [] // this is the generated target metamodel
  {
    nodeDataArray: uib.buildGoPalette(myTargetMetamodel, myMetis).nodes,
    linkDataArray: uib.buildGoPalette(myTargetMetamodel, myMetis).links
  }

  if (debug) console.log('233 Modelling: ', refresh, gojsmodelobjects, myModel, myModelview);

  if (!mount) {
    return <></>
  } else {

    if (debug) console.log('185 Modelling myModel', myMetis, myModel);

    //let myGoMetamodel = props.phGojs?.gojsMetamodel
    let phFocus = props.phFocus;
    let phData = props.phData
    let phUser = props.phUser

    if (debug) console.log('130 Modelling', metis.metamodels, metis.models, curmod, curmodview, focusModel);
    if (debug) console.log('131 Modelling', curmod, curmodview);

    function handleSaveAllToFileDate() {
      const projectname = props.phData.metis.name
      SaveAllToFileDate({ phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser }, projectname, '_PR')
    }

    const handleGetNewProject = () => {
      // CreateNewModel(ph)//,  curmodel, curmodelview)
      
    

      // dispatch initial state 
      // dispatch({ type: "LOAD_TOSTORE_DATA", data: StartStateJson })
      // const timer = setTimeout(() => {
      //   setRefresh(!refresh)
      // }
      //   , 1000);
    }

    function handleSaveAllToFile() {
      const projectname = props.phData.metis.name
      SaveAllToFile({ phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser }, projectname, '_PR')
      const data = `${projectname}_PR`
      if (debug) console.log('343 handleSaveAllToFile', data)
      dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data })
    }

    const toggleTab = tab => {
      if (activeTab !== tab) setActiveTab(tab);
      const data = (tab === '1') ? 'Metamodelling' : 'Modelling'
      // console.log('159', store, dispatch({ type: 'SET_FOCUS_TAB', store }));
      dispatch({ type: 'SET_FOCUS_TAB', data })
      // dispatch  the nodel and modelview also
      dispatch({ type: 'SET_FOCUS_MODELVIEW', data: curmodview })
      dispatch({ type: 'SET_FOCUS_MODEL', data: curmod })
      // GenGojsModel(props, dispatch)
    }

    const toggleTip = () => setTooltipOpen(!tooltipOpen);

    function toggleTasks() {
      setVisibleTasks(!visibleTasks);
    }

    // let locStateKey
    // const toggleShowContext = () => {
    //   // dispatch({ type: 'SET_VISIBLE_CONTEXT', data: !props.phUser.appSkin.visibleContext  })
    //   setVisibleContext(!visibleContext)
    //   SaveAkmmUser({...memoryAkmmUser, visibleContext}, locStateKey='akmmUser')
    //   // setMemoryAkmmUser({...memoryAkmmUser, visibleContext: !visibleContext})
    //   console.log('182 toggleShowContext', memoryAkmmUser, visibleContext)
    // }

    // ===================================================================
    // Divs
    if (debug) console.log('162 Modelling: ', gojsmetamodelpalette);
    if (debug) console.log('163 Modelling: ', gojsmetamodelmodel);
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
        modelType='metamodel'
      />
      : <></>;

    const paletteMetamodelDiv = (gojsmetamodelmodel) // this is the metamodel modelling area
      ?
      <Modeller
        gojsModel={gojsmetamodelmodel}
        gojsMetamodel={gojsmetamodelpalette}
        myMetis={myMetis}
        myGoModel={myGoModel}
        myGoMetamodel={myGoMetamodel}
        metis={metis}
        phData={phData}
        phFocus={phFocus}
        dispatch={dispatch}
        modelType='metamodel'
        phUser={phUser}
        phSource={phSource}
        userSettings={memoryAkmmUser}
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

    const modellingtabs = (
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
            <NavLink style={{ paddingTop: "0px", paddingBottom: "0px", borderColor: "#eee gray white #eee", color: "black" }}
              className={classnames({ active: activeTab === '1' })}
              onClick={() => { toggleTab('1'); toggleRefresh() }}
            >
              {(activeTab === "1") ? 'Metamodelling' : 'Metamodelling'}
            </NavLink>
          </NavItem>
          <NavItem > {/* this is the tab for the model */}
            <NavLink style={{ paddingTop: "0px", paddingBottom: "0px", borderColor: "#eee gray white #eee", color: "black" }}
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
        <TabContent activeTab={activeTab} >
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
                          phData={phData}
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
          <TabPane tabId="1">   {/* Metamodelling --------------------------------*/}
            <div className="workpad p-1 pt-2 bg-white" >
              <Row className="row" style={{ height: "100%", marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
                <Col className="col1 m-0 p-0 pl-3" xs="auto">
                  <div className="myPalette px-1 mt-0 mb-0 pt-0 pb-1" style={{ height: "100%", marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
                    {paletteDiv}
                  </div>
                </Col>
                <Col className="col2" style={{ paddingLeft: "1px", marginLeft: "1px", paddingRight: "1px", marginRight: "1px" }}>
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
                {/* Objects Palette area */}
                <Col className="col1 m-0 p-0 pl-0" xs="auto"> {/* Objects Palette */}
                  <div className="myPalette px-1 mt-0 mb-0 pt-0 pb-1" style={{ marginRight: "2px", minHeight: "7vh", backgroundColor: "#7ac", border: "solid 1px black" }}>
                    <Palette // this is the Objects Palette area
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
                      phUser={phUser}
                    />
                  </div>
                </Col>
                {/* Modelling area */}
                <Col className="col2" style={{ paddingLeft: "1px", marginLeft: "1px", paddingRight: "1px", marginRight: "1px" }}> 
                  <div className="myModeller pl-0 mb-0 pr-1" style={{ backgroundColor: "#acc", minHeight: "7vh", width: "100%", height: "100%", border: "solid 1px black" }}>
                    <Modeller // this is the Modeller ara
                      gojsModelObjects={gojsmodelobjects}
                      gojsModel={gojsmodel}
                      gojsMetamodel={gojsmetamodel}
                      myMetis={myMetis}
                      myGoModel={myGoModel}
                      myGoMetamodel={myGoMetamodel}
                      phData={phData}
                      phFocus={phFocus}
                      phUser={phUser}
                      phSource={phSource}
                      metis={metis}
                      dispatch={dispatch}
                      modelType='model'
                      userSettings={memoryAkmmUser}
                    />
                  </div>
                </Col>
                {/* <Col className="col3 mr-0 p-0 " xs="auto"> 
                 {(visibleContext) ? <ReportModule  props={props}/> : <></>}
                </Col> */}
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
    const loadjsonfile = (typeof window !== 'undefined') && <LoadJsonFile buttonLabel='OSDU' className='ContextModal' ph={props} refresh={refresh} setRefresh={toggleRefresh} />
    const loadgithub = (typeof window !== 'undefined') && <LoadGitHub buttonLabel='GitHub' className='ContextModal' ph={props} refresh={refresh} setRefresh={toggleRefresh} />
    const loadnewModelproject = (typeof window !== 'undefined') && <LoadNewModelProjectFromGithub buttonLabel='New Modelproject' className='ContextModal' ph={props} refresh={refresh}toggleRefresh={toggleRefresh} />
    const loadMetamodel = (typeof window !== 'undefined') && <LoadMetamodelFromGithub buttonLabel='Load Metamodel' className='ContextModal' ph={props} refresh={refresh} setRefresh={toggleRefresh} />
    const loadfile = (typeof window !== 'undefined') && <LoadFile buttonLabel='Imp/Exp' className='ContextModal' ph={props} refresh={refresh} setRefresh={toggleRefresh} />
    const loadrecovery = (typeof window !== 'undefined') && <LoadRecovery buttonLabel='Recovery' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />

    const modelType = (activeTab === '1') ? 'metamodel' : 'model'
    const EditFocusModalMDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModal buttonLabel='M' className='ContextModal' modelType={'modelview'} ph={props} refresh={refresh} setRefresh={setRefresh} />
    // const EditFocusModalDiv = <EditFocusModal buttonLabel='Edit' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
    const EditFocusModalODiv = (focusObjectview?.name || focusObjecttype?.name) && <EditFocusModal buttonLabel='O' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
    const EditFocusModalRDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModal className="ContextModal" buttonLabel='R' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
    // : (focusObjectview.name) && <EditFocusMetamodel buttonLabel='Edit' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />

    if (debug) console.log('460 Modelling', gojsmodelobjects);

    const modellingDiv = 
      <>
        <div className="buttonrow d-flex justify-content-between align-items-center " style={{ maxHeight: "29px", minHeight: "30px", whiteSpace: "nowrap" }}>            
          <div className="me-4">
            {/* <div className="loadmodel"  style={{ paddingBottom: "2px", backgroundColor: "#ccc", transform: "scale(0.7)",  fontWeight: "bolder"}}> */}
            {/* <span className=" m-0 px-0 bg-secondary " style={{ minWidth: "125px", maxHeight: "28px", backgroundColor: "#fff"}} > Edit selected :  </span> */}
            {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Select an Relationship and click to edit properties" > {EditFocusModalRDiv} </span>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Select an Object and click to edit properties" > {EditFocusModalODiv} </span>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Click to edit Model and Modelview properties" > {EditFocusModalMDiv} </span> */}
            {/* <span className="pt-1 pr-1" > </span> */}
            {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from localStore or download/upload file" > {loadlocal} </span> */}
            {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Login to the model repository server (Firebase)" > {loginserver} </span>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from the model repository server (Firebase)" > {loadserver} </span> */}
            <span className="" data-bs-toggle="tooltip" data-bs-placement="top" title="Load models from GitHub" > {loadgithub} </span>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Load a new Model Project template from GitHub" > {loadnewModelproject} </span>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Load downloaded Schema from OSDU (Jsonfiles)"  > {loadjsonfile} </span>
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (import/export) from/to files" style={{ whiteSpace: "nowrap" }}> {loadfile} </span>
          </div>
          <div className="d-flex justify-content-end align-items-center bg-secondary border border-2 p-1 border-solid border-primary py-1 mt-0 mx-2" style={{ minHeight: "34px" }}>
            <div className=" d-flex align-items-center me-0 pe-0">
              <i className="fa fa-folder text-light pe-1"></i>
              <div className=""  style={{ whiteSpace: "nowrap" }}></div>
            </div>
            <div className="">
              <div className="input text-primary" style={{ maxHeight: "32px", backgroundColor: "transparent" }} data-bs-toggle="tooltip" data-bs-placement="top" title="Choose a local Project file to load">
                <input className="select-input" type="file" accept=".json" onChange={(e) => ReadModelFromFile(props, dispatch, e)} style={{width: "580px"}}/>
              </div>
            </div>
            <button className="border border-solid border-radius-4 px-2 mx-0 py-0"
              data-toggle="tooltip" data-placement="top" data-bs-html="true"
              title="Click here to Save the Project file &#013;(all models and metamodels) to file &#013;(in Downloads folder)"
              onClick={handleSaveAllToFile}>Save
            </button>
          </div>
          <span className="btn ps-auto mt-0 pt-1 text-light" onClick={toggleRefresh} data-toggle="tooltip" data-placement="top" title="Reload the model" > {refresh ? 'reload' : 'reload'} </span>
          {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from Local Repo" > {loadgitlocal} </span> */}
          {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Recover project from last refresh" > {loadrecovery} </span> */}
          {/* <button className="btn bg-light text-primary btn-sm" onClick={toggleShowContext}>✵</button>  */}
          {/* <ProjectDetailsModal props={props} /> */}
        </div>
      </>

    const metamodellingDiv = 
      <>
        <div className="buttonrow d-flex justify-content-end align-items-center me-4" style={{ maxHeight: "29px", minHeight: "30px", whiteSpace: "nowrap" }}>            
          <div className="me-4">
            {/* <span className="" data-bs-toggle="tooltip" data-bs-placement="top" title="Load models from GitHub" > {loadgithub} </span> */}
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Load a Metamodel from GitHub" > {loadMetamodel} </span>
            {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Load downloaded Schema from OSDU (Jsonfiles)"  > {loadjsonfile} </span> */}
            <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (import/export) from/to files" style={{ whiteSpace: "nowrap" }}> {loadfile} </span>
          </div>
          {/* <div className="d-flex justify-content-end align-items-center bg-light border border-2 p-1 border-solid border-primary py-1 mt-0 mx-2" style={{ minHeight: "34px" }}>
            <div className=" d-flex align-items-center me-0 pe-0">
              <i className="fa fa-folder text-secondary px-1"></i>
              <div className=""  style={{ whiteSpace: "nowrap" }}></div>
            </div>
            <div className="">
              <div className="input text-primary" style={{ maxHeight: "32px", backgroundColor: "transparent" }} data-bs-toggle="tooltip" data-bs-placement="top" title="Choose a local Project file to load">
                <input className="select-input" type="file" accept=".json" onChange={(e) => ReadModelFromFile(props, dispatch, e)} style={{width: "380px"}}/>
              </div>
            </div>
            <button className="border border-solid border-radius-4 px-2 mx-0 py-0"
              data-toggle="tooltip" data-placement="top" data-bs-html="true"
              title="Click here to Save the Project file &#013;(all models and metamodels) to file &#013;(in Downloads folder)"
              onClick={handleSaveAllToFile}>Save
            </button>
          </div> */}
          <span className="btn px-4 me-4 py-0 ps-auto mt-0 pt-1 bg-light text-secondary" onClick={toggleRefresh} data-toggle="tooltip" data-placement="top" title="Reload the model" > {refresh ? 'reload' : 'reload'} </span>
        </div>
      </>

    // return (models.length > 0) && (
    // return (mount && (gojsmodelobjects?.length > 0)) && (
    return (
      <>
        <div className="header-buttons float-end mt-0 " style={{ scale: "0.8", minHeight: "34px", backgroundColor: "#ddd" }}>
          {/* <span className="spacer m-0 p-0 w-50"></span> */}
          {(activeTab === "2") ? modellingDiv : metamodellingDiv}
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
