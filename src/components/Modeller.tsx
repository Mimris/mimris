// @ts-nocheck
import React, { useState, useEffect } from "react";
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
  const focusModel = props.phFocus?.focusModel
  const focusModelview = props.phFocus?.focusModelview
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const modelviews = model?.modelviews
  const modelindex = models?.findIndex((m: any) => m?.id === focusModel?.id)
  const modelview = modelviews?.find((m: any) => m?.id === focusModelview?.id)
  const modelviewindex = modelviews?.findIndex((m: any) => m?.id === focusModelview?.id)
  const selmods = {models}//(models) && { models: [ ...models?.slice(0, modelindex), ...models?.slice(modelindex+1) ] }
  const selmodviews = {modelviews}//(modelviews) && { modelviews: [ ...modelviews?.slice(0, modelviewindex), ...modelviews?.slice(modelviewindex+1) ] }
  // console.log('36 Modeller', focusModelview, selmods, modelviews);

  let selmodels = selmods?.models?.map((m: any) => m)
  let selmodelviews = selmodviews?.modelviews?.map((mv: any) => mv)
  useEffect(() => {
    selmodels = selmods?.models?.map((m: any) => m)
  }, [modelviews])
  // console.log('37 Modeller', selmodels);
  // console.log('23 Modeller myMetis', props.myMetis);
  
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
  
  const selector =  (props.modelType ==='model') 
    ?
    <div className="modeller-selection float-right" >
      <Selector type='SET_FOCUS_MODELVIEW' selArray={selmodelviews} selName='Modelviews' focusModelview={props.phFocus?.focusModelview} focustype='focusModelview' refresh={refresh} setRefresh={setRefresh} />
      <Selector type='SET_FOCUS_MODEL' selArray={selmodels} selName='Model' focusModel={props.phFocus?.focusModel} focustype='focusModel' refresh={refresh} setRefresh={setRefresh} />
    </div> 
    :
    <div className="modeller-selection float-right" >
      {/* <Selector type='SET_FOCUS_MODELVIEW' selArray={selmodelviews} selName='Modelviews' focustype='focusModelview' />
      <Selector type='SET_FOCUS_MODEL' selArray={selmodels} selName='Model' focustype='focusModel' /> */}
    </div> 

  return (
    <>
      {/* <span id="lighten" className="btn-link btn-sm" style={{ float: "right" }} onClick={toggleRefresh}>{refresh ? 'refresh' : 'refresh'} </span> */}
      <div className="modeller-heading" style={{ margin: "4px", paddingLeft: "2px", zIndex: "99", position: "relative", overflow: "hidden" }}>Modeller
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