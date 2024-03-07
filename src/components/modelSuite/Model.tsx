import React, { useState, useEffect } from 'react';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';

import Page from '../page';
import Palette from "../Palette";
import Modeller from "../Modeller";
import { loadMyModeldata } from "./LoadMyModeldata";
import classnames from 'classnames';
import { connect, useSelector, useDispatch } from 'react-redux';
import * as uib from '../../akmm/ui_buildmodels';

import GenGojsModel from "../GenGojsModel";
import useLocalStorage from '../../hooks/use-local-storage'

const debug = false;

const page = (props) => {
  console.log('11 Model props', props);

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
  const phMymetis = modelData.phMymetis;

  const metis = phData.metis;
  const models = metis?.models;

  const curmod = (models && phFocus.focusModel?.id) && models?.find((m: any) => m?.id === phFocus.focusModel?.id) || models[0] // find the current model
  const curmodview = (curmod && phFocus.focusModelview?.id && curmod.modelviews?.find((mv: any) => mv.id === phFocus.focusModelview.id))
    ? curmod?.modelviews?.find((mv: any) => mv.id === phFocus.focusModelview.id)
    : curmod?.modelviews[0] // if focusmodview does not exist set it to the first

  
  console.log('32 Model props', phMymetis);
  const modelview = phData?.focusView?.name;

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
    let  activetabindex = (sortedmodels.length < 0) ? 0 : sortedmodels.findIndex(sm => sm.id === phFocus.focusModel.id) // if no model in focus, set the active tab to 0

  useEffect(() => {
      // if (!debug) console.log('125 Modelling useEffect 1 [] : ',  activeTab, activetabindex ,props);
      // set the focusModel and focusModelview to the first model and modelview if they are not set
      GenGojsModel(props, dispatch);
      // setMount(true);
      setActiveTab(activetabindex);
      // loadMyModeldata();
  }, []);

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


  function loadMyModeldata() {
    myMetis = props.phMymetis?.myMetis // get the myMetis object from  the store
    if (!myMetis) return <></>
    myModel = myMetis?.findModel(curmod?.id);
    myModelview = (curmodview) && myMetis?.findModelView(curmodview?.id);
    myMetamodel = myModel?.metamodel;
    myMetamodel = (myMetamodel) ? myMetis.findMetamodel(myMetamodel?.id) : null;
    myTargetModel = myMetis?.findModel(curtargetmodel?.id);
    myTargetModelview = (curtargetmodelview) && myMetis.findModelView(focusTargetModelview?.id)
    myTargetMetamodel = (myMetis) && myMetis.findMetamodel(curmod?.targetMetamodelRef) || null;
    myTargetMetamodelPalette = (myTargetMetamodel) && uib.buildGoPalette(myTargetMetamodel, myMetis);

    if (!debug) console.log('211 Modelling ', props, myMetis, myModel, myModelview, myMetamodel);
    if (!myMetis && !myModel && !myModelview && !myMetamodel) {
      console.error('187 One of the required variables is undefined: myMetis: ', myMetis, 'myModel: ', 'myModelview: ', myModelview, 'myMetamodel: ', myMetamodel);
      return null;
    }
    myGoModel = uib.buildGoModel(myMetis, myModel, myModelview, includeDeleted, includeNoObject, showModified) //props.phMyGoModel?.myGoModel
    myGoMetamodel = uib.buildGoMetaPalette() //props.phMyGoMetamodel?.myGoMetamodel
    myGoMetamodelModel = uib.buildGoMetaModel(myMetamodel, includeDeleted, showModified) //props.phMyGoMetamodelModel?.myGoMetamodelModel
    myGoMetamodelPalette = uib.buildGoPalette(myMetamodel, myMetis) //props.phMyGoMetamodelPalette?.myGoMetamodelPalette
    myGoObjectPalette = (myModel?.objects) ? uib.buildObjectPalette(myModel?.objects, myMetis) : [] //props.phMyGoObjectPalette?.myGoObjectPalette
    if (!myModel?.objects) { console.log('196 myModel.objects is undefined', myMetis);
      // return null
    } else { myGoObjectPalette = uib.buildObjectPalette(myModel.objects, myMetis);}
    if (!myGoObjectPalette) { console.log('202 myGoObjectPalette is undefined after function call'); }
    // myGoRelshipPalette = uib.buildRelshipPalette(myModel?.relships, myMetis) //props.phMyGoRelshipPalette?.myGoRelshipPalette  Todo: build this
    if (debug) console.log('188 Modelling ', myGoObjectPalette);

    gojsmetamodelpalette = (myGoMetamodel) &&  {nodeDataArray: myGoMetamodel?.nodes,linkDataArray: myGoMetamodel?.links }  // props.phGojs?.gojsMetamodelPalette 
    gojsmetamodelmodel = (myGoMetamodelModel) && { nodeDataArray: myGoMetamodelModel?.nodes, linkDataArray: myGoMetamodelModel?.links}
    gojsmodel = (myGoModel) && { nodeDataArray: myGoModel.nodes, linkDataArray: myGoModel.links }
    gojsmetamodel = (myGoMetamodelPalette) && { nodeDataArray: myGoMetamodelPalette?.nodes, linkDataArray: myGoMetamodelPalette?.links}// props.phGojs?.gojsMetamodel 
    gojsmodelobjects = (myGoModel) && { nodeDataArray: myGoObjectPalette, linkDataArray: myGoRelshipPalette || [] } // props.phGojs?.gojsModelObjects // || []
    gojstargetmodel = (myTargetModel) &&  { nodeDataArray: myGoModel.nodes, linkDataArray: myGoModel.links }//props.phGojs?.gojsTargetModel 
    gojstargetmetamodel = (myTargetMetamodel) && { nodeDataArray: uib.buildGoPalette(myTargetMetamodel, myMetis).nodes,linkDataArray: uib.buildGoPalette(myTargetMetamodel, myMetis).links} // props.phGojs?.gojsTargetMetamodel || [] // this is the generated target metamodel
  };

  loadMyModeldata()
    
    const doRefresh = () => {
      console.log('doRefresh')
    }

  useEffect(() => { // Genereate GoJs node model when the focusRefresch.id changes
    GenGojsModel(props, dispatch);
    const timer = setTimeout(() => {
      setRefresh(!refresh)
    }, 50);
    return () => clearTimeout(timer);
  }, [props.phFocus?.focusModelview?.id])

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
                        userSettings={null}
                        />
                    </div>
                    </Col>
                </Row>
                </div>
            </TabPane>
            </TabContent>
        </>
    return (
        <div className="p-1" style={{backgroundColor: "#eee"}}>
          {modellingtabs}
          {/* {refresh ? <> {modellingtabs} </> : <>{modellingtabs}</>} */}
        </div>
    )
}

export default Page(connect(state => state)(page));