// @ts-nocheck
import React, { useState, useEffect } from "react";
import GoJSApp from "./gojs/GoJSApp";
import Selector from './utils/Selector'

const Modeller = (props: any) => {
  // console.log('8 Modeller', props);
  
  let gojsmodel = props.gojsModel;
  let myMetis = props.myMetis;

  const [refresh, setRefresh] = useState(true)
  function toggleRefresh() { setRefresh(!refresh); }
  // console.log('11 Modeller', gojsmodel?.nodeDataArray);

  const models = props.metis?.models
  const modelviews = props.metis?.modelviews
  const focusModel = props.phFocus?.focusModel
  const focusModelview = props.phFocus?.focusModelview
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const selmodels = models?.map((m: any) => m)
  const selmodelviews = model?.modelviews?.map((mv: any) => mv)
  // console.log('23 Modeller', models);
  // console.log('23 Modeller myMetis', props.myMetis);
  
  const gojsapp = (gojsmodel) &&
    < GoJSApp
      nodeDataArray={gojsmodel.nodeDataArray}
      linkDataArray={gojsmodel.linkDataArray}
      metis={props.metis}
      myMetis={props.myMetis}
      myGoModel={props.myGoModel}
      phFocus={props.phFocus}
      dispatch={props.dispatch}
    />
  
  return (
    <>
      <span id="lighten" className="btn-link btn-sm" style={{ float: "right" }} onClick={toggleRefresh}>{refresh ? 'refresh' : 'refresh'} </span>
      <div className="modeller-heading float-lwft" style={{ margin: "4px", paddingLeft: "2px", zIndex: "99", position: "relative", overflow: "hidden" }}>Modeller
        <div className="modeller-selection float-right" > 
          <Selector type='SET_FOCUS_MODEL' selArray={selmodels} selName='Model' focustype='focusModel' focusname={focusModel.name}/>
          <Selector type='SET_FOCUS_MODELVIEW' selArray={selmodelviews} selName='Modelviews' focustype='focusModelview' focusname={focusModel.name} />
        </div> 
      </div>
        {refresh ? <> {gojsapp} </> : <>{gojsapp}</>}
      <style jsx>{`
        .diagram-component {
          height: 100%;
        }
       `}</style>
    </>
  )
}

export default Modeller;