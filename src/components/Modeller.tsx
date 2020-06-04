// @ts-nocheck
import React, { useState } from "react";
import GoJSApp from "./gojs/GoJSApp";


const Modeller = (props) => {

  let gojsmodel = props.gojsModel;
  let myMetis = props.myMetis;

  const [refresh, setRefresh] = useState(true)
  function toggleRefresh() { setRefresh(!refresh); }
  console.log('11 Modeller', props.gojsModel.nodeDataArray);

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
      <span style={{ paddingLeft: "2px" }} > Model 
        <strong style={{ paddingLeft: "2px", color: "#a00", fontSize: "90%" }} > {props.phFocus.focusModel.name} </strong> 
        <span style={{ paddingLeft: "2px", fontSize: "90%" }} >Modelview:</span> 
        <strong style={{ paddingLeft: "2px", color: "#a00", fontSize: "90%" }}>  {props.phFocus.focusModelview.name} </strong>
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
