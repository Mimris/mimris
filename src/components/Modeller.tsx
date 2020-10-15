// @ts-nocheck
import React, { useState, useEffect } from "react";
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import GoJSApp from "./gojs/GoJSApp";
import Selector from './utils/Selector'


const Modeller = (props: any) => {
  // console.log('8 Modeller', props);
  let prevgojsmodel = null
  let gojsmodel = {}
  gojsmodel = props.gojsModel;

  let myMetis = props.myMetis;

  const [refresh, setRefresh] = useState(true)
  function toggleRefresh() { setRefresh(!refresh); }

  // console.log('28 Modeller', gojsmodel?.nodeDataArray);

  const models = props.metis?.models
  let focusModel = props.phFocus?.focusModel
  let focusModelview = props.phFocus?.focusModelview
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const modelviews = model?.modelviews
  const modelindex = models?.findIndex((m: any) => m?.id === focusModel?.id)
  const modelview = modelviews?.find((m: any) => m?.id === focusModelview?.id)
  const modelviewindex = modelviews?.findIndex((m: any) => m?.id === focusModelview?.id)

  const selmods = {models, model}//(models) && { models: [ ...models?.slice(0, modelindex), ...models?.slice(modelindex+1) ] }
  const selmodviews = {modelviews, modelview}//(modelviews) && { modelviews: [ ...modelviews?.slice(0, modelviewindex), ...modelviews?.slice(modelviewindex+1) ] }
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
  // useEffect(() => {
  //   console.log('46 Modeller useEffect 1', props);
  //   focusModel = props.phFocus?.focusModel
  //   focusModelview = props.phFocus?.focusModelview
  //   // console.log('37 Modeller', focusModel.name, focusModelview.name);
  // }, [models, modelviews])
  // console.log('37 Modeller', selmodels);
  // console.log('23 Modeller myMetis', props.myMetis);
  // useEffect(() => {
  //   setRefresh(!refresh)
  //   console.log('54 Modeller useEffect 2', props );
  // }, [focusModelview?.id])
  
  const gojsapp = (gojsmodel && !prevgojsmodel) &&
    < GoJSApp
      nodeDataArray={gojsmodel.nodeDataArray}
      linkDataArray={gojsmodel.linkDataArray}
      // nodeDataArray={gojsmodel.nodes}
      // linkDataArray={gojsmodel.links}
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

return (
  <>
      {/* <span id="lighten" className="btn-link btn-sm" style={{ float: "right" }} onClick={toggleRefresh}>{refresh ? 'refresh' : 'refresh'} </span> */}
      <div className="modeller-heading" style={{ margin: "4px", paddingLeft: "2px", zIndex: "99", position: "relative", overflow: "hidden" }}>Model:  <strong className="ml-2 ">{focusModel.name}</strong>
        {selector}
      </div>
        {/* {gojsapp} */}
        {refresh ? <> {gojsapp} </> : <>{gojsapp}</>}
      <style jsx>{`
        // .diagram-component {
        //   height: 80%;
        // }
       `}</style>
    </>
  )
}

export default Modeller;