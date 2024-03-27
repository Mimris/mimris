import React, { useState, useEffect } from 'react';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';

import Page from '../page';
import Palette from "../Palette";
import Modeller from "../Modeller";
import { loadMyModeldata } from "./LoadMyModeldata";
import classnames from 'classnames';
import { connect, useSelector, useDispatch } from 'react-redux';
import * as akm from '../../akmm/metamodeller';
// import * as uib from '../../akmm/ui_buildmodels';

import GenGojsModel from "../GenGojsModel";
import useLocalStorage from '../../hooks/use-local-storage'


const debug = false;

const page = (props) => {
  if (debug) console.log('11 Model props', props);

  const dispatch = useDispatch();

  if (!props) return <>file not found</>;

  const [refresh, setRefresh] = useState(false);
    // const [memoryAkmmUser, setMemoryAkmmUser] = useLocalStorage('akmmUser', ''); //props);

  // const [mmToggle, setMmToggle] = useState(false);
  const [activeTab, setActiveTab] = useState('0');
  // const toggle = (tab) => {
  //   if (activeTab !== tab) setActiveTab(tab);
  // }

  const modelData = props ?? {};
  const phData = modelData.phData;
  const phFocus = modelData.phFocus;
  const phUser = modelData.phUser;
  const phSource = modelData.phSource;

  const [mount, setMount] = useState(false)
  const metis = phData.metis;
  const models = metis?.models;
  const curmod = (models && phFocus.focusModel?.id) && models?.find((m: any) => m?.id === phFocus.focusModel?.id) || models[0] // find the current model
  const curmodview = (curmod && phFocus.focusModelview?.id && curmod.modelviews?.find((mv: any) => mv.id === phFocus.focusModelview.id))
    ? curmod?.modelviews?.find((mv: any) => mv.id === phFocus.focusModelview.id)
    : curmod?.modelviews[0] // if focusmodview does not exist set it to the first


  const focusTargetModel = (props.phFocus) && props.phFocus.focusTargetModel
  const focusTargetModelview = (props.phFocus) && props.phFocus.focusTargetModelview
  const curtargetmodel = (models && focusTargetModel?.id) && models.find((m: any) => m.id === curmod?.targetModelRef)
  const focustargetmodelview = (curtargetmodel && focusTargetModelview?.id) && curtargetmodel.modelviews.find((mv: any) => mv.id === focusTargetModelview?.id)
  const curtargetmodelview = focustargetmodelview || curtargetmodel?.modelviews[0]


  // const includeDeleted = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  // const includeNoObject = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  // const includeInstancesOnly = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  // const showModified = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showModified : false;

  // let gojsmetamodelpalette, gojsmetamodelmodel, gojsmodel, gojsmetamodel, gojsmodelobjects, gojstargetmodel, gojstargetmetamodel
  let myGoModel, myGoObjectPalette, myGoRelshipPalette, myGoMetamodel, myGoMetamodelModel, myGoMetamodelPalette

  const [gojsmodel, setGojsmodel] = useState(null)
  const [gojsmetamodel, setGojsmetamodel] = useState(null)
  const [gojsmodelobjects, setGojsmodelobjects] = useState(null)
  const [gojstargetmodel, setGojstargetmodel] = useState(null)
  const [gojstargetmetamodel, setGojstargetmetamodel] = useState(null)
  const [gojsmetamodelpalette, setGojsmetamodelpalette] = useState(null)
  const [gojsmetamodelmodel, setGojsmetamodelmodel] = useState(null)

  // const modelview = phData?.focusView?.name;

  const sortedmodels = (models) && models
    .sort((a, b) => {
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

  let activetabindex = (sortedmodels.length < 0) ? 0 : sortedmodels.findIndex(sm => sm.id === phFocus.focusModel.id) // if no model in focus, set the active tab to 0

  let myMetis = new akm.cxMetis();
  let goParams = {}

  async function loadMyModeldata(myMetis: akm.cxMetis, goParams: any) {
    goParams = await GenGojsModel(props, myMetis, goParams);
    if (!debug) console.log('84 Model', goParams);
    setGojsmodel({ nodeDataArray: goParams.myGoModel.nodes, linkDataArray: goParams.myGoModel.links });
    setGojsmetamodelpalette({ nodeDataArray: goParams.myGoMetamodelPalette.nodes, linkDataArray: goParams.myGoMetamodelPalette.links });
    setGojsmetamodelmodel({ nodeDataArray: goParams.myGoMetamodelModel.nodes, linkDataArray: goParams.myGoMetamodelModel.links });
    setGojsmetamodel({ nodeDataArray: goParams.myGoMetamodel.nodes, linkDataArray: goParams.myGoMetamodel.links });
    setGojsmodelobjects({ nodeDataArray: goParams.myGoObjectPalette, linkDataArray: goParams.myGoRelshipPalette });
    setGojstargetmodel({ nodeDataArray: goParams.myGoModel.nodes, linkDataArray: goParams.myGoModel.links });
    setGojstargetmetamodel({ nodeDataArray: goParams.myGoTargetMetamodel.nodes, linkDataArray: goParams.myGoTargetMetamodel.links });
  };
  goParams = GenGojsModel(props, myMetis, goParams);

  useEffect(() => {
    setActiveTab(activetabindex);
      setRefresh(!refresh)
    setMount(true);
  }, []);

  useEffect(() => {
    if (debug) console.log('207 Modeller useEffect 2 [props.phFocus.focusModelview?.id] : ', activeTab, props.phFocus.focusModel?.name);
    setActiveTab(activetabindex);
    loadMyModeldata(myMetis, goParams)
  }, [props.phFocus?.focusModel?.id]);

  useEffect(() => { // Genereate GoJs node model when the focusRefresch.id changes
    if (debug) console.log('223 Model useEffect 4 [props.phFocus?.focusModelview.id]', props.phFocus.focusModel?.name, props.phFocus.focusModelview?.name, props.phFocus?.focusRefresh?.name);
    // GenGojsModel(props, myMetis)
    loadMyModeldata(myMetis, goParams)
    const timer = setTimeout(() => {
      if (debug) console.log('226 ', props.phFocus.focusModel?.name, props.phFocus.focusModelview?.name, props.phFocus?.focusRefresh?.name);
      setRefresh(!refresh)
    }, 50);
    return () => clearTimeout(timer);
  }, [props.phFocus?.focusModelview?.id])

  const doRefresh = () => {
    console.log('doRefresh')
  }

  const selmods = (sortedmodels) ? sortedmodels.filter((m: any) => m?.markedAsDeleted === false): []

  const modelindex =  models.findIndex((m: any) => m?.id === phFocus.focusModel?.id)

  const navmodelDiv = (!selmods) ? <></> : selmods.map((m, index) => {
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
          title={`Description: ${m?.description}\n\nTo change Modelview name, right click the background below and select 'Edit Modelview'.`}
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
            }}
          >
            {(m.name.startsWith('_A'))? <span className="text-secondary" style={{scale: "0.8", whiteSpace: "nowrap"}} data-toggle="tooltip" data-placement="top" data-bs-html="_ADMIN_MODEL">_AM</span> : m.name}
          </NavLink>
        </NavItem>
      );
    }
  });

  const modellingtabs =
      <>
          <Nav tabs style={{ minWidth: "50px", borderBottom: "white"}} >
          {navmodelDiv}
          </Nav>
          <TabContent  >
          <TabPane >   {/* Model ---------------------------------------*/}
              <div className="workpad p-1 pt-2 bg-white">
              <Row className="row1">

                  <Col className="col2" style={{ paddingLeft: "1px", marginLeft: "1px", paddingRight: "1px", marginRight: "1px" }}>
                  <div className="modelling-area myModeller pl-0 mb-0 pr-1" style={{ backgroundColor: "#acc", minHeight: "7vh", width: "100%", height: "100%", border: "solid 1px black" }}>
                      <Modeller 
                        gojsModelObjects={null} // do not use/show gojsmodelobjects
                        // gojsModelObjects={gojsmodelobjects}
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
                        userSettings={null}
                      />
                  </div>
                  </Col>
              </Row>
              </div>
          </TabPane>
          </TabContent>
      </>
  return (mount) && (
      <div className="p-1" style={{backgroundColor: "#eee"}}>
        {/* {modellingtabs} */}
        {refresh ? <> {modellingtabs} </> : <>{modellingtabs}</>}
      </div>
  )
}

export default Page(connect(state => state)(page));