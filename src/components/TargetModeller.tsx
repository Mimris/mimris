// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useDispatch } from 'react-redux';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import { createHook } from "async_hooks";
import classnames from 'classnames';

import GoJSApp from "./gojs/GoJSApp";
import Selector from '../utils/Selector'
import GenGojsModel from './GenGojsModel'


const TargetModeller = (props: any) => {

  const dispatch = useDispatch();
  // console.log('14 TargetMOdeller', props);
  

  const gojsmodel = props.gojsTargetModel;
  let myMetis = props.myMetis;
  const phFocus = props.phFocus || {};
  const models = Array.isArray(props.metis?.models) ? props.metis.models.filter(Boolean) : []
  
  const [refresh, setRefresh] = useState(true)
  function toggleRefresh() { setRefresh(!refresh); }
  
  
  let focusTargetModel = phFocus?.focusTargetModel
  let focusTargetModelview = phFocus?.focusTargetModelview
  
  // console.log('28 TargetModeller', props, focusTargetModel, focusTargetModelview);
  const model = models?.find((m: any) => m?.id === focusTargetModel?.id)
  const modelindex = models?.findIndex((m: any) => m?.id === focusTargetModel?.id)
  const modelviews = Array.isArray(model?.modelviews) ? model.modelviews.filter(Boolean) : []
  const modelview = modelviews?.find((m: any) => m?.id === focusTargetModelview?.id)
  const modelviewindex = modelviews?.findIndex((m: any) => m?.id === focusTargetModelview?.id)
  
  // put current modell on top  
  const selmods = modelindex >= 0
    ? [
      models[modelindex],
      ...models.slice(0, modelindex),
      ...models.slice(modelindex+1, models.length)
    ]
    : models
  const selmodviews = modelviews

  // const selmods = {models, model}//(models) && { models: [ ...models?.slice(0, modelindex), ...models?.slice(modelindex+1) ] }
  // const selmodviews = {modelviews, modelview}//(modelviews) && { modelviews: [ ...modelviews?.slice(0, modelviewindex), ...modelviews?.slice(modelviewindex+1) ] }
  // console.log('36 TargetModeller', focusTargetModelview, selmods, modelviews);
  let selmodels = selmods
  let selmodelviews = selmodviews
  // console.log('33 Modeller', focusModel.name, focusModelview.name);
  // useEffect(() => {
  //   console.log('34 Modeller', focusModel.name, focusModelview.name);
  //   focusModel = props.phFocus?.focusModel
  //   focusModelview = props.phFocus?.focusModelview
  //   console.log('37 Modeller', focusModel.name, focusModelview.name);
  //   selmodels = selmods?.models?.map((m: any) => m)
  //   selmodelviews = selmods?.modelviews?.map((m: any) => m)
  // }, [modelviews])
  // useEffect(() => {
  //   console.log('46 TargetModeller useEffect 1', props);
  //   // focusModel = props.phFocus?.focusModel
  //   // focusModelview = props.phFocus?.focusModelview
  //   // console.log('37 Modeller', focusModel.name, focusModelview.name);
  // }, [models, modelviews])
  // // console.log('37 Modeller', selmodels);
  // // console.log('23 Modeller myMetis', props.myMetis);
  // useEffect(() => {
  //   setRefresh(!refresh)
  //   console.log('54 TargetModeller useEffect 2', props );
  // }, [focusModelview?.id])
  
  const gojsapp = (gojsmodel) &&
    < GoJSApp
      nodeDataArray={gojsmodel.nodeDataArray}
      linkDataArray={gojsmodel.linkDataArray}
      metis={props.metis}
      myMetis={props.myMetis}
      myGoModel={props.myGoModel}
      myGoMetamodel={props.myGoMetamodel}
      phFocus={phFocus}
      dispatch={props.dispatch}
    />

  const selector = (props.modelType === 'model' || props.modelType === 'modelview') 
      ? <>
          {/* <div className="modeller-selection float-right" > */}
            <Selector type='SET_FOCUS_MODELVIEW' selArray={selmodelviews} selName='Modelviews' focusModelview={phFocus?.focusModelview} focustype='focusModelview' refresh={refresh} setRefresh={setRefresh} />
            <Selector type='SET_FOCUS_MODEL' selArray={selmodels} selName='Model' focusModel={phFocus?.focusModel} focustype='focusModel' refresh={refresh} setRefresh={setRefresh} />
          {/* </div>  */}
        </>
      :
      <div className="modeller-selection float-right" >
      </div> 

    const [activeTab, setActiveTab] = useState('0');
    const activetabindex = selmodelviews?.findIndex(mv => mv.name === modelview?.name)
      
    // console.log('79 Modeller', gojsmodel);
    // if (gojsmodel) {console.log('89 Modeller', activetabindex, modelview, props.gojsModel)}

    useEffect(() => {
      // console.log('101 TargetModeller useEffect 1',activetabindex);
      setActiveTab(activetabindex)
      // toggleTab(activetabindex)
    }, [activetabindex])

    const navitemDiv = (!selmodviews) ? <></> : selmodviews.map((mv, index) => {
      if (mv) { 
          const strindex = index.toString()
          const data = {id: mv.id, name: mv.name}
          if (debug) console.log('110 TargetModeller GenGojsModel run')
          GenGojsModel(props, dispatch);
         
          return (
            <NavItem key={strindex}>
              <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" }}
                className={classnames({ active: activeTab == strindex })}
                onClick={() => {  dispatch({ type: 'SET_FOCUS_MODELVIEW', data }) }}
                // onClick={() => { toggleTab(strindex); dispatch({ type: 'SET_FOCUS_MODELVIEW', data }); toggleRefresh() }}
              >
                {mv.name}
              </NavLink>
            </NavItem>
          )
      }
    })
    
    const modelviewTabDiv = //(model === )
      <>
        <Nav tabs >
          {navitemDiv} 
        </Nav>
        <TabContent   > 
          <TabPane  >
            <div className="workpad p-1 pt-2 bg-white"> 
              {refresh ? <> {gojsapp} </> : <>{gojsapp}</>}
            </div>         
          </TabPane>
        </TabContent>
      </>

    // console.log('129', activetabindex, modelviewTabDiv);
    // setDispatchdone(true)

    // console.log('130 Modeller', focusModelview, props);
    useEffect(() => {
      focusTargetModelview = phFocus?.focusTargetModelview
      console.log('147 TargetModeller GenGojsModel run');
      GenGojsModel(props, dispatch);
      setRefresh(!refresh)
    }, [focusTargetModelview?.id])

  return (
    <>
       <div className="modeller-heading"
        style={{ margin: "4px", paddingLeft: "2px", zIndex: "99", position: "relative", overflow: "hidden" }}>Target Modeller
       <span className="float-right">{focusTargetModel?.name}</span>
        {/* {selector} */}
        {modelviewTabDiv} 
      </div>
      <style jsx>{`
        // .diagram-component {
        //   height: 80%;
        // }
       `}</style>
    </>
  )
}

export default TargetModeller;
