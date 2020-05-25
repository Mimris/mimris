// @ts-nocheck
import React, { useState } from "react";
import GoJSApp from "./gojs/GoJSApp";

const Modeller = (props) => {

  let gojsmodel = props.gojsModel;
  let myMetis = props.myMetis;

  const [refresh, setRefresh] = useState(true)
  function toggleRefresh() { setRefresh(!refresh); }
  console.log('11 Modeller', props);

  const gojsapp = (gojsmodel && myMetis) &&
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
      <span style={{ float: "right" }} onClick={toggleRefresh}>{refresh ? 'refresh' : 'refresh'} </span>
      <span style={{ paddingLeft: "2px" }} > Model</span>
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
