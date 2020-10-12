// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useDispatch } from 'react-redux';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import GoJSApp from "./gojs/GoJSApp";
import Selector from './utils/Selector'
import genGojsModel from './GenGojsModel'
import { createHook } from "async_hooks";


const TargetModeller = (props: any) => {

  const dispatch = useDispatch();
  console.log('14 TargetMOdeller', props);
  

  const gojsmodel = props.gojsTargetModel;
  let myMetis = props.myMetis;
  
  const [refresh, setRefresh] = useState(true)
  function toggleRefresh() { setRefresh(!refresh); }
  
  console.log('28 TargetModeller', props, gojsmodel?.nodeDataArray);
  
  let focusModel = props.phFocus?.focusModel
  let focusModelview = props.phFocus?.focusModelview

  const models = props.metis?.models
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const modelindex = models?.findIndex((m: any) => m?.id === focusModel?.id)
  const modelviews = model?.modelviews
  const modelview = modelviews?.find((m: any) => m?.id === focusModelview?.id)
  const modelviewindex = modelviews?.findIndex((m: any) => m?.id === focusModelview?.id)
  
  // put current modell on top 
  const selmods = [
    models[modelindex],
    ...models.slice(0, modelindex),
    ...models.slice(modelindex+1, models.length)
  ]
  const selmodviews = modelviews

  // const selmods = {models, model}//(models) && { models: [ ...models?.slice(0, modelindex), ...models?.slice(modelindex+1) ] }
  // const selmodviews = {modelviews, modelview}//(modelviews) && { modelviews: [ ...modelviews?.slice(0, modelviewindex), ...modelviews?.slice(modelviewindex+1) ] }
  // console.log('36 Modeller', focusModelview, selmods, modelviews);
  let selmodels = selmods?.models?.map((m: any) => m)
  let selmodelviews = selmodviews?.modelviews?.map((mv: any) => mv)
  // console.log('33 Modeller', focusModel.name, focusModelview.name);
  // useEffect(() => {
  //   console.log('34 Modeller', focusModel.name, focusModelview.name);
  //   focusModel = props.phFocus?.focusModel
  //   focusModelview = props.phFocus?.focusModelview
  //   console.log('37 Modeller', focusModel.name, focusModelview.name);
  //   selmodels = selmods?.models?.map((m: any) => m)
  //   selmodelviews = selmods?.modelviews?.map((m: any) => m)
  // }, [modelviews])
  useEffect(() => {
    console.log('46 Modeller useEffect 1', props);
    focusModel = props.phFocus?.focusModel
    focusModelview = props.phFocus?.focusModelview
    // console.log('37 Modeller', focusModel.name, focusModelview.name);
  }, [models, modelviews])
  // console.log('37 Modeller', selmodels);
  // console.log('23 Modeller myMetis', props.myMetis);
  useEffect(() => {
    setRefresh(!refresh)
    console.log('54 Modeller useEffect 2', props );
  }, [focusModelview?.id])
  
  const gojsapp = (gojsmodel) &&
    < GoJSApp
      nodeDataArray={gojsmodel.nodeDataArray}
      linkDataArray={gojsmodel.linkDataArray}
      metis={props.metis}
      myMetis={props.myMetis}
      myGoModel={props.myGoModel}
      myGoMetamodel={props.myGoMetamodel}
      phFocus={props.phFocus}
      dispatch={props.dispatch}
    />

  const selector = (props.modelType === 'model' || props.modelType === 'modelview') 
      ? <>
          {/* <div className="modeller-selection float-right" > */}
            <Selector type='SET_FOCUS_MODELVIEW' selArray={selmodelviews} selName='Modelviews' focusModelview={props.phFocus?.focusModelview} focustype='focusModelview' refresh={refresh} setRefresh={setRefresh} />
            <Selector type='SET_FOCUS_MODEL' selArray={selmodels} selName='Model' focusModel={props.phFocus?.focusModel} focustype='focusModel' refresh={refresh} setRefresh={setRefresh} />
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
      setActiveTab(activetabindex)
      // toggleTab(activetabindex)
    }, [activetabindex])

    const navitemDiv = (!selmodviews) ? <></> : selmodviews.map((mv, index) => {
      if (mv) { 
          const strindex = index.toString()
          const data = {id: mv.id, name: mv.name}
          genGojsModel(props, dispatch);
          // console.log('90 Modeller', activeTab, activetabindex , index, strindex, data)
         
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
      focusModelview = props.phFocus?.focusModelview
      genGojsModel(props, dispatch);
      setRefresh(!refresh)
      // console.log('135 Modeller', focusModelview, props);
    }, [focusModelview?.id])

  return (
    <>
       <div className="modeller-heading" style={{ margin: "4px", paddingLeft: "2px", zIndex: "99", position: "relative", overflow: "hidden" }}>Modeller
        {selector}
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