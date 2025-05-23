// @ts-nocheck
// modelling

const debug = false;

// import React from "react";
import { useRouter } from "next/router";
import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
import { Modal, Button } from 'react-bootstrap';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import { type } from "os";
import classnames from 'classnames';

import Page from './page';
import Palette from "./Palette";
import Modeller from "./Modeller";
import TargetModeller from "./TargetModeller";
import TargetMeta from "./TargetMetaPalette";
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
import ProjectDetailsForm from "./forms/ProjectDetailsForm";
// import { SaveModelToLocState } from "./utils/SaveModelToLocState";
// import { SaveAkmmUser } from "./utils/SaveAkmmUser";
// import ReportModule from "./ReportModule";
// import ProjectDetailsModal from "./modals/ProjectDetailsModal";
import useLocalStorage from '../hooks/use-local-storage'
import useSessionStorage from '../hooks/use-session-storage'
import * as akm from '../akmm/metamodeller';
import genGqlSchema from "../../pagestmp/genGqlSchema";

const clog = console.log.bind(console, '%c %s', // green colored cosole log
  'background: blue; color: white');
const useEfflog = console.log.bind(console, '%c %s', // green colored console log
  'background: red; color: white');
const ctrace = console.trace.bind(console, '%c %s',
  'background: blue; color: white');

const Modelling = (props: any) => {

  if (typeof window === 'undefined') return <></>
  // if (!props) return <></>
  if (debug) console.log('55 Modelling:', props)//, props);        
  const dispatch = useDispatch();

  const projectModalRef = useRef(null);

  const [refresh, setRefresh] = useState(true);
  const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', null);
  const [memorySessionState, setMemorySessionState] = useSessionStorage('memorystate', {});
  const [memoryAkmmUser, setMemoryAkmmUser] = useLocalStorage('akmmUser', '');

  const [activeTab, setActiveTab] = useState();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [visibleTasks, setVisibleTasks] = useState(true)
  const [mmToggle, setMmToggle] = useState(true)
  const [mount, setMount] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  // const [visibleContext, setVisibleContext] = useState(true)
  // const [visibleFocusDetails, setVisibleFocusDetails] = useState(true) // show/hide the focus details (right side)

  let focusModel = useSelector(focusModel => props.phFocus?.focusModel)
  let focusModelview = useSelector(focusModelview => props.phFocus?.focusModelview)
  const focusObjectview = useSelector(focusObjectview => props.phFocus?.focusObjectview)
  const focusRelshipview = useSelector(focusRelshipview => props.phFocus?.focusRelshipview)
  const focusObjecttype = useSelector(focusObjecttype => props.phFocus?.focusObjecttype)
  const focusRelshiptype = useSelector(focusRelshiptype => props.phFocus?.focusRelshiptype)
  const phSource = useSelector(phSource => props.phSource)
  if (debug) console.log('69 Modelling', focusModel, focusModelview);

  const ph = props
  const metis = ph.phData?.metis

  const models = metis?.models?.filter((m: any) => m); // Filter out empty models
  let curmod = (models && focusModel?.id) && models?.find((m: any) => m?.id === focusModel?.id)
  if (!curmod) curmod = models[0] || null

  const modelviews = curmod?.modelviews?.filter((mv: any) => mv)
  let curmodview = (curmod && modelviews && focusModelview?.id) && modelviews.find((mv: any) => mv.id === focusModelview.id)
  if (!curmodview) curmodview = modelviews[0]


  if (debug) console.log('130 Modelling curmodview', curmod, curmodview, models, focusModel?.name, focusModelview?.name);

  const focusTargetModel = (props.phFocus) && props.phFocus.focusTargetModel
  const focusTargetModelview = (props.phFocus) && props.phFocus.focusTargetModelview
  const curtargetmodel = (models && focusTargetModel?.id) && models.find((m: any) => m.id === curmod?.targetModelRef)
  const focustargetmodelview = (curtargetmodel && focusTargetModelview?.id) && curtargetmodel.modelviews.find((mv: any) => mv.id === focusTargetModelview?.id)
  const curtargetmodelview = focustargetmodelview || curtargetmodel?.modelviews[0]

  const sortedmodels = (models) && models.sort((a, b) => {
    if (a.name.startsWith('_') && !b.name.startsWith('_')) {
      return 1;
    } else if (!a.name.startsWith('_') && b.name.startsWith('_')) {
      return -1;
    } else if (a.name.endsWith('_SM') && !b.name.endsWith('_SM')) {
      return 1;
    } else if (!a.name.endsWith('_SM') && b.name.endsWith('_SM')) {
      return -1;
    } else {
      return a.name.localeCompare(b.name);
    }
  })

  let activetabindex = (sortedmodels.length < 0) ? 0 : sortedmodels.findIndex(sm => sm.id === focusModel?.id) // if no model in focus, set the active tab to 0

  let myMetis = new akm.cxMetis();
  GenGojsModel(props, myMetis)

  // const myMetis = useMemo(() => {
  //   const metisInstance = new akm.cxMetis();
  //   if (curmod?.objects) {
  //     GenGojsModel(props, metisInstance);
  //   }
  //   return metisInstance;
  // }, [metis]);  // Only execute when objects or relationships change
  

  useEffect(() => {
    if (debug) console.log('Modelling 126', mmToggle)
    dispatch({ type: 'TAB', data: (!mmToggle) ? 'metamodel' : 'model' });
  }, [mmToggle])





  useEffect(() => { // Genereate GoJs node model 
    if (debug) useEfflog('223 Modelling useEffect 1 []', myMetis)
    if (debug) console.log('131 Modelling useEffect 2 ', myMetis, activeTab, activetabindex);
    GenGojsModel(props, myMetis)
    setRefresh(!refresh)
    setActiveTab(activetabindex)
    setMount(true);
  }, [])


  const handleShowProjectModal = () => {
    // if (minimized) {
    //   setMinimized(true);
    // }
    setShowProjectModal(true);
  };

  const handleCloseProjectModal = () => setShowProjectModal(false);

  const handleSubmit = (details: any) => {
    props.onSubmit(details);
  };

  const projectModalDiv = (
    <Modal show={showProjectModal} onHide={handleCloseProjectModal}
      className={`projectModalOpen ${!projectModalOpen ? "d-block" : "d-none"}`} style={{ marginLeft: "200px", marginTop: "100px", backgroundColor: "#fee", zIndex: "9999" }} ref={projectModalRef}>
      <Modal.Header closeButton>GitHub Settings: </Modal.Header>
      <Modal.Body >
        <ProjectDetailsForm props={props} onSubmit={handleSubmit} />
      </Modal.Body>
      <Modal.Footer>
        <Button color="link" onClick={handleCloseProjectModal} >Exit</Button>
      </Modal.Footer>
    </Modal>
  );

  useEffect(() => {
    if (debug) useEfflog('157 Modelling useEffect 2 [props.phSource]', props.phSource)
    // if (props.phFocus.focusProj.name ===('')) handleShowProjectModal(true)
    if (props.phSource.includes('-Template')) handleShowProjectModal(true)
  }, [props.phSource]) // Show project modal when the phSource is a template project

  useEffect(() => {
    if (debug) useEfflog('163 Modelling useEffect 3 [props.phSource]', props.phSource)
    const timer = setTimeout(() => {
      doRefresh()
      if (debug) console.log('226 ', props.phFocus.focusModel?.name, props.phFocus.focusModelview?.name, props.phFocus?.focusRefresh?.name);
      // setRefresh(!refresh)
    }, 50);
  }, [props.phFocus?.focusRefresh?.id])

  useEffect(() => { // Genereate GoJs node model when the focusRefresch.id changes
    if (debug) useEfflog('223 Modelling useEffect 4 [props.phFocus?.focusModelview.id]', props.phFocus.focusModel?.name, props.phFocus.focusModelview?.name, props.phFocus?.focusRefresh?.name);
    const timer = setTimeout(() => {
      if (debug) console.log('226 ', props.phFocus.focusModel?.name, props.phFocus.focusModelview?.name, props.phFocus?.focusRefresh?.id);
      setRefresh(!refresh)
    }, 50);
    return () => clearTimeout(timer);
  }, [props.phFocus?.focusModelview?.id])

  function doRefresh() { // 
    setMemorySessionState(props)
    setMemoryLocState(props)
    const timer = setTimeout(() => {
      setRefresh(!refresh)
    }, 1000);
    return () => clearTimeout(timer);
  }

  // Function to export curmod.objects to clipboard
  const exportToClipboard = () => {
    if (curmod && curmod.objects) {
      const objectsText = curmod.objects.map(obj => ` - "${obj.id}" | "${obj.name}" | "${obj.description ? obj.description : '(empty)'}" | "(${obj.typeName})"`).join('\n').replace(/\|/g, ',') + '\n'
      const relshipsText = curmod.relships.map(rel => ` - "${rel.id}" | "${rel.name}" | "${rel.description ? rel.description : '(empty)'}" | "(${rel.typeName})"`).join('\n').replace(/\|/g, ',') + '\n';
      navigator.clipboard.writeText(`Objects: ${objectsText} \n Relships: ${relshipsText}\n`).then(() => {
        alert('Objects and relships copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy objects to clipboard: ', err);
      });
    }
  };

  if (mount) {
    let phFocus = props.phFocus;
    let phData = props.phData
    let phUser = props.phUser
    if (debug) console.log('255 Modelling', metis.metamodels, metis.models, curmod, curmodview, focusModel);
    if (debug) console.log('256 Modelling', curmod, curmodview);
    // function handleSaveAllToFileDate() {
    //   const projectname = props.phData.metis.name
    //   SaveAllToFileDate({ phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser }, projectname, '_PR')
    // }
    // const handleGetNewProject = () => {
    //   alert('Deprecated: Use the "New" button in Project-bar at top-left')
    // }
    // const handleSaveAllToFile = () => {
    //   let projectname = props.phSource
    //   if (props.phFocus.focusProj.name === '' || undefined) {
    //     projectname = props.phFocus.focusProj.name
    //     const data = `${projectname}_PR`
    //     if ((debug)) console.log('275 handleSaveAllToFile', data)
    //     dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data })
    //   }
    //   if (debug) console.log('278 handleSaveAllToFile', projectname, props.phData, props.phFocus, props.phSource, props.phUser)
    //   SaveAllToFile({ phData: props.phData, phFocus: props.phFocus, phSource: projectname, phUser: props.phUser }, projectname, '_PR')
    // }
    const selmods = (sortedmodels) ? sortedmodels.filter((m: any) => m?.markedAsDeleted === false) : []
    
    const modelTabsDiv = (!selmods) ? <></> : selmods.map((m, index) => {
      if (m && !m.markedAsDeleted) {
        const strindex = index.toString();
        const data = { id: m.id, name: m.name };
        const modelview0 = m.modelviews ? m.modelviews[0] : null;
        const data2 = { id: modelview0?.id, name: modelview0?.name };
        return (
          <NavItem
            key={strindex}
            className="model-selection"
            data-toggle="tooltip"
            data-placement="top"
            data-bs-html="true"
            title={`Description: ${m?.description}\n\nTo change Model name, right click the background below and select 'Edit Model'.`}
          >
            <NavLink
              style={{
                paddingTop: "0px",
                paddingBottom: "2px",
                paddingLeft: "8px",
                paddingRight: "8px",
                border: "solid 1px",
                borderBottom: "none",
                borderColor: "#eee gray white #eee",
                color: "black",
              }}
              className={classnames({ active: activeTab == strindex })}
              onClick={() => {
                dispatch({ type: "SET_FOCUS_MODEL", data });
                dispatch({ type: "SET_FOCUS_MODELVIEW", data: data2 });
                doRefresh();
                setActiveTab(index);
              }}
            >
              {(m.name.startsWith('_A')) ? <span className="text-secondary" style={{ scale: "0.8", whiteSpace: "nowrap" }} data-toggle="tooltip" data-placement="top" data-bs-html="_ADMIN_MODEL">_AM</span> : m.name}
            </NavLink>
          </NavItem>
        );
      }
    });

    // ===================================================================
    // Divs

    const paletteDiv = // this is the div for the palette with the types tab and the objects tab
      <Palette
        myMetis={myMetis}
        metis={metis}
        phFocus={phFocus}
        dispatch={dispatch}
        modelType='metamodel'
      />


    const paletteMetamodelDiv =  // this is the metamodel modelling area
      <Modeller
        myMetis={myMetis}
        metis={metis}
        phData={phData}
        phFocus={phFocus}
        dispatch={dispatch}
        phUser={phUser}
        modelType='metamodel'
        phSource={phSource}
        userSettings={memoryAkmmUser}
        visibleFocusDetails={props.visibleFocusDetails}
        setVisibleFocusDetails={props.setVisibleFocusDetails}
      />

    const targetmetamodelDiv = (curmod?.targetMetamodelRef !== "")
      ?
      <TargetMeta // maybe replaced by Palette?
        // gojsModel={gojsmodel}
        // gojsMetamodel={gojsmetamodel}
        // gojsTargetMetamodel={gojstargetmetamodel}
        myMetis={myMetis}
        phFocus={phFocus}
        metis={metis}
        dispatch={dispatch}
        modelType='model'
      />
      : <></>;

    const metamodellingtabs = (
      <>
        <Nav tabs style={{ minWidth: "350px" }} >
          <span className="ms-1 me-5">
            <button className="mb-1 pb-4 ms-0 me-5"
              data-toggle="tooltip" data-placement="top" title="Click to toggle between Metamodel and Model"
              onClick={() => setMmToggle(!mmToggle)}
              style={{ borderColor: "transparent", width: "116px", height: "20px", fontSize: "16px", backgroundColor: "#77aacc" }}
            >{(mmToggle) ? '< Metamodel >' : '< Metamodel >'}</button>
          </span>
        </Nav>
        <TabPane tabId="1">   {/* Metamodel --------------------------------*/}
          <div className="workpad p-1 pt-2 bg-white" >
            <Row className="row" style={{ height: "100%", marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
              <Col className="col1 m-0 p-0 pl-3" xs="auto">
                <div className="myPalette px-1 mt-0 mb-0 pt-0 pb-1" style={{ marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
                  {paletteDiv}
                </div>
              </Col>
              <Col className="col2" style={{ paddingLeft: "1px", marginLeft: "1px", paddingRight: "1px", marginRight: "1px" }}>
                <div className="myModeller pl-0 mb-0 pr-1" style={{ backgroundColor: "#7ac", width: "100%", border: "solid 1px black" }}>
                  {paletteMetamodelDiv}
                </div>
              </Col>
            </Row>
          </div>
        </TabPane>
      </>
    )

    const templatemodellingDiv = (
      <>
        {/* Template ------------------------------------------*/}
        {/* <TabPane tabId="0">
              <Tab /> */}
        {/* <div className="workpad p-1 pt-2 bg-white">
                  <Row >
                  <Col xs="auto m-0 p-0 pl-3">
                    <div className="myPalette pl-1 mb-1 pt-0 text-white" style={{ maxWidth: "150px", minHeight: "8vh", height: "100%", marginRight: "2px", backgroundColor: "#999", border: "solid 1px black" }}>
                      <Palette
                        // gojsModel={gojsmodel}
                        // gojsMetamodel={gojsmetamodel}
                        // gojsModelObjects={gojsmodelobjects}
                        myMetis={myMetis}
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
                          // gojsModel={gojsmodel}
                          // gojsMetamodel={gojsmetamodel}
                          myMetis={myMetis}
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
    )

    const modellingtabs = (
      <>
        <Nav tabs style={{ minWidth: "50px", borderBottom: "white" }} >
          <span className="ms-1 me-5">
            <button className="p-0 ms-0 me-5"
              data-toggle="tooltip" data-placement="top" title="Click to toggle between Metamodel and Model"
              onClick={() => setMmToggle(!mmToggle)}
              style={{ borderColor: "transparent", width: "116px", height: "24px", fontSize: "16px", backgroundColor: "#a0caca" }}
            >{(mmToggle) ? '< Model >' : '< Model >'}</button>
          </span>
          {modelTabsDiv}
        </Nav>
        <TabContent  >
          <TabPane >   {/* Model ---------------------------------------*/}
            <div className="workpad p-1 pt-2 bg-white">
              <Row className="row1">
                {/* Palette area */}
                <Col className="col1 m-0 p-0 pl-0" xs="auto"> {/* Objects Palette */}
                  <div className="myPalette px-1 mt-0 mb-0 pt-0 pb-1" style={{ marginRight: "2px", minHeight: "7vh", backgroundColor: "#7ac", border: "solid 1px black" }}>
                    <Palette // this is the Objects Palette area
                      // gojsModelObjects={gojsmodelobjects}
                      // gojsModel={gojsmodel}
                      // gojsMetamodel={gojsmetamodel}
                      myMetis={myMetis}
                      metis={metis}
                      phFocus={phFocus}
                      dispatch={dispatch}
                      modelType='model'
                      phUser={phUser}
                      setVisiblePalette={props.setVisiblePalette}
                    />
                  </div>
                </Col>
                {/* Modelling area */}
                <Col className="col2" style={{ paddingLeft: "1px", marginLeft: "1px", paddingRight: "1px", marginRight: "1px" }}>
                  <div className="myModeller pl-0 mb-0 pr-1" style={{ backgroundColor: "#acc", minHeight: "7vh", width: "100%", height: "100%", border: "solid 1px black" }}>
                    <Modeller // this is the Modeller ara
                      myMetis={myMetis}
                      metis={metis}
                      phData={phData}
                      phFocus={phFocus}
                      dispatch={dispatch}
                      phUser={phUser}
                      modelType='model'
                      phSource={phSource}
                      userSettings={memoryAkmmUser}
                      visibleFocusDetails={props.visibleFocusDetails}
                      setVisibleFocusDetails={props.setVisibleFocusDetails}
                      exportTab={props.exportTab}
                    />
                  </div>
                </Col>
                {/* <Col className="col3 mr-0 p-0 " xs="auto"> 
                 {(visibleContext) ? <ReportModule  props={props}/> : <></>}
                </Col> */}
                <Col className="col3 mr-0 p-0 " xs="auto"> {/* Targetmodel area */}
                  <div className="myTargetMeta px-0 mb-1 mr-3 pt-0 float-right"
                    style={{ minHeight: "6h", height: "100%", marginRight: "0px", backgroundColor: "#8ce", border: "solid 1px black" }}>
                    {targetmetamodelDiv}
                  </div>
                </Col>
              </Row>
            </div>
          </TabPane>
        </TabContent>
      </>
    )

    const solutionModellingDiv = (
      <>
        {/* <TabContent> */}
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
        {/* </TabContent> */}
      </>
    )

    if (debug) console.log('583 Modelling', activeTab);
    const loadjsonfile = (typeof window !== 'undefined') && <LoadJsonFile buttonLabel='OSDU Import' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
    const loadgithub = (typeof window !== 'undefined') && <LoadGitHub buttonLabel='GitHub' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
    const loadnewModelproject = (typeof window !== 'undefined') && <LoadNewModelProjectFromGithub buttonLabel='New Modelproject' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
    const loadMetamodel = (typeof window !== 'undefined') && <LoadMetamodelFromGithub buttonLabel='Load Metamodel' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
    const loadfile = (typeof window !== 'undefined') && <LoadFile buttonLabel='' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
    const loadrecovery = (typeof window !== 'undefined') && <LoadRecovery buttonLabel='Recovery' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />

    const modellingDiv =
      <>
        <div className="buttonrow d-flex justify-content-between align-items-center" style={{ maxHeight: "22px", minHeight: "18px", whiteSpace: "nowrap" }}>
          <div className="d-flex justify-content-between align-items-center">
            {/* <button className="btn bg-secondary py-1 pe-2 ps-1" data-bs-toggle="tooltip" data-bs-placement="top" title="Use the 'New' button in the Project-bar at top-left" 
              onClick={handleGetNewProject}
              ><i className="fab fa-github fa-lg me-2 ms-0 "></i> New Modelproject </button> */}
            <span className="btn bg-success me-1 d-flex justify-content-center align-items-center"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Load downloaded Schema from OSDU (Jsonfiles)"
              // style={{ backgroundColor: "#b0b", color: "#cdc"}} 
            >
              {/* <i className="fa fa-house-tsunami fa-lg"></i> */}
              {loadjsonfile}
            </span>
            <span
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Save and Load models (import/export) from/to files"
              style={{ whiteSpace: "nowrap", marginRight: "6px" }}
            >
              {loadfile}
            </span>
          </div>
          <span className="btn ps-auto mt-0 pt-1 text-light" onClick={doRefresh} data-toggle="tooltip" data-placement="top" title="Reload the model" > {refresh ? 'reload' : 'reload'} </span>

            {/* <span className="btn me-1 d-flex justify-content-center align-items-center bg-secondary" onClick={exportToClipboard}>
            <i className="fas fa-copy me-2"></i> Objects
            </span> */}
          {/* <span className=" m-0 px-0 bg-secondary " style={{ minWidth: "125px", maxHeight: "28px", backgroundColor: "#fff"}} > Edit selected :  </span> */}
          {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Select an Relationship and click to edit properties" > {EditFocusModalRDiv} </span>
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="Select an Object and click to edit properties" > {EditFocusModalODiv} </span>
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="Click to edit Model and Modelview properties" > {EditFocusModalMDiv} </span> */}
          {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from localStore or download/upload file" > {loadlocal} </span> */}
          {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Login to the model repository server (Firebase)" > {loginserver} </span>
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from the model repository server (Firebase)" > {loadserver} </span> */}
          {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from Local Repo" > {loadgitlocal} </span> */}
          {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Recover project from last refresh" > {loadrecovery} </span> */}
          {/* <button className="btn bg-light text-primary btn-sm" onClick={toggleShowContext}>✵</button>  */}
          {/* <ProjectDetailsModal props={props} /> */}
        </div>
      </>

    const metamodellingDiv = (myMetis) &&
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
          <span className="btn px-4 me-4 py-0 ps-auto mt-0 pt-1 bg-light text-secondary"
            onClick={doRefresh} data-toggle="tooltip" data-placement="top" title="Reload the model" > {refresh ? 'reload' : 'reload'} 
          </span>
        </div>
      </>


    // return (models.length > 0) && (
    // return (mount && (gojsmodelobjects?.length > 0)) && (
    if (!curmod || !curmod.modelviews) {
      return <div>Loading model data...</div>;
      }

    return ((mmToggle)
      ? (myMetis) &&
        <>
          <div className="diagramtabs pb-0" >
            {mount && (
            <>
              <div className="position-relative float-end" style={{ transform: "scale(0.8)", marginRight: "64px" }}>
                {modellingDiv}
              </div>
              <div className="modellingContent mt-1 ">
                {/* {modellingtabs} */}
                {refresh ? <> {modellingtabs} </> : <>{modellingtabs}</>}
              </div>
            </>
         )}
        </div>
        {projectModalDiv}
      </>
      : <>
        <div className="diagramtabs pb-0 " >
          <div className="modellingContent mt-1">
            {refresh ? <> {metamodellingtabs} </> : <>{metamodellingtabs}</>}
          </div>
        </div>
      </>
    )
  }
}

export default Modelling;
// export default Page(connect(state => state)(page));



