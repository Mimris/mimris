// @ts-nocheck
import React, { useState } from "react";
import GoJSApp from "./gojs/GoJSApp";
import Selector from './utils/Selector'


const Modeller = (props) => {
  console.log('8 Modeller', props);
  
  let gojsmodel = props.gojsModel;
  let myMetis = props.myMetis;

  const [refresh, setRefresh] = useState(true)
  function toggleRefresh() { setRefresh(!refresh); }
  console.log('11 Modeller', gojsmodel.nodeDataArray);

  const models = props.metis?.models
  const modelviews = props.metis?.modelviews
  const focusModel = props.phFocus?.focusModel
  const focusModelview = props.phFocus?.focusModelview
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const selmodels = models?.map((m: any) => m)
  const selmodelviews = model?.modelviews?.map((mv: any) => mv)
  console.log('23 Modeller', models);
  

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
      <span style={{ paddingLeft: "2px" }} >
        {/* <strong style={{ paddingLeft: "2px", color: "#a00", fontSize: "90%" }} > {props.phFocus.focusModel.name} </strong>  */}
        {/* <span style={{ paddingLeft: "2px", fontSize: "90%" }} >Modelview:</span>  */}
        {/* <strong style={{ paddingLeft: "2px", color: "#a00", fontSize: "90%" }}>  {props.phFocus.focusModelview.name} </strong> */}
        {/* <Selector type='SET_FOCUS_MODEL' selArray={selmodels} selName='Model' focustype='focusModel' focusName={props.phFocus.focusModel.name} /> */}
        {/* <Selector type='SET_FOCUS_MODELVIEW' selArray={selmodelviews} selName='Modelviews' focustype='focusModelview' focusName={props.phFocus.focusModelview.name} /> */}
        <Selector type='SET_FOCUS_MODEL' selArray={selmodels} selName='Model' focustype='focusModel'/>
        <Selector type='SET_FOCUS_MODELVIEW' selArray={selmodelviews} selName='Modelviews' focustype='focusModelview' />
      </span> 
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


// let gojsapp =
//   < GoJSApp
//     nodeDataArray={gojsmodel.nodeDataArray}
//     linkDataArray={gojsmodel.linkDataArray}
//     skipsDiagramUpdate={false}
//   />

// useEffect(() => {
//   gojsmodel = props.gojsModel
//   gojsapp =
//     < GoJSApp
//       nodeDataArray={gojsmodel.nodeDataArray}
//       linkDataArray={gojsmodel.linkDataArray}
//       skipsDiagramUpdate={false}
//     />
//   console.log('26', gojsapp);

// }, [props])
