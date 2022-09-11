// @ts-nocheck

const debug = false;

import React, { useState, useEffect } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
import Page from './page';
import GoJSApp from "./gojs/GoJSApp";
import GoJSPaletteTargetApp from "./gojs/GoJSPaletteTargetApp";

const TargetMeta = (props) => {
  const dispatch = useDispatch();
  if (debug) console.log('10 TargetMeta', props);
  let focusModel = props.phFocus?.focusModel
  const models = props.metis?.models
  const metamodels = props.metis?.metamodels
  const model = models?.find((m: any) => m?.id === focusModel?.id)

  let targetmetamodel = metamodels?.find((m: any) => m?.id === model?.targetMetamodelRef)
  const targetmodel = models?.find((m: any) => m?.id === model?.targetModelRef)
  // console.log('16', props, targetmodel?.name, model.targetModelRef);
  
  
  const gojstypes = props.gojsTargetMetamodel
  
  // /** Toggle divs */
  const [visiblePalette, setVisiblePalette] = useState(false)
  function togglePalette() { setVisiblePalette(!visiblePalette); }
  
  // const [refresh, setRefresh] = useState(true)
  // function toggleRefresh() { setRefresh(!refresh); }
  
  useEffect(() => { 
    if (debug) console.log('35 TargetMeta useEffect', model?.targetMetamodelRef, 'targetmm', targetmetamodel?.id, targetmetamodel?.name);
    // genGojsModel(props, dispatch);
    // targetmetamodel = metamodels?.find((m: any) => m?.id === model?.targetMetamodelRef)
    // (model?.targetMetamodelRef && targetmetamodel) && 
    if (targetmetamodel?.id === undefined) {
      if (debug) console.log('39 TargetMeta useEffect', targetmetamodel?.id, targetmetamodel?.name);
    } else if (targetmetamodel?.id === "") {
      if (debug) console.log('41 TargetMeta useEffect', targetmetamodel?.id, targetmetamodel?.name);
    } else {
      if (debug) console.log('43 TargetMeta useEffect', targetmetamodel?.id, targetmetamodel?.name);
      dispatch({ type: 'SET_FOCUS_TARGETMETAMODEL', data: {id: targetmetamodel?.id, name: targetmetamodel?.name} })
    }
    // const timer = setTimeout(() => {
      //   setRefresh(!refresh)
      // }, 3000);
      // return () => clearTimeout(timer);
    }, [(targetmetamodel !== undefined && targetmetamodel.id !== "")]);
    

  /**  * Get the state and metie from the store,  */
  // const gojstypes = props.phFocus.gojsMetamodel
  // console.log('18 Palette', gojstypes, props);
  // console.log('24 TargetMeta', gojstypes);
  if (debug) console.log('33 TargetMeta', props, gojstypes, gojstypes.nodeDataArray);
  
  // const toglRefreshid = () => {
  //   console.log('53 togRefreshid', props);
  //   if (visiblePalette) {
  //     dispatch({ type: 'SET_FOCUS_REFRESH', data: {id: 1, name: 'name'}})
  //   }
  // }

  if (!model?.targetMetamodelRef) return <></>


  const gojsapp = (gojstypes) &&
    < GoJSPaletteTargetApp
      nodeDataArray={gojstypes.nodeDataArray}
      linkDataArray={[]}
      // linkDataArray={gojstypes.linkDataArray}
      metis={props.metis}
      myMetis={props.myMetis}
      myGoModel={props.myGoModel}
      phFocus={props.phFocus}
      dispatch={props.dispatch}
    />

  const targetmmnamediv = (targetmetamodel) ? <span>{targetmetamodel?.name}</span> : <span>No target metamodel</span> 
  const targetmnamediv = (targetmodel) ? <span>Target model: {targetmodel?.name}</span> : <span>No target model</span>

  const palette =
    <>
      <button className="btn-sm pt-2 pr-1 b-0 mt-0 mb-0 mr-2 " style={{ textAlign: "left",  backgroundColor: "#8ce", outline: "0", borderStyle: "none" }}
        onClick={togglePalette}> {visiblePalette ? <span> -&gt; Target Metamodel</span> : <span>&lt;</span>}
      </button>
      {/* <button className="btn-sm pt-2 pr-1 b-0 mt-0 mb-0 mr-2 " style={{ textAlign: "left",  backgroundColor: "#8ce", outline: "0", borderStyle: "none" }}
        onChange={toglRefreshid()} 
        >Refresh
      </button> */}
      {visiblePalette
        ? <>
            <div className="mmname bg-light mx-1 px-1" style={{fontSize: "8px"}}>{targetmmnamediv}</div>
            <div className="m-1"> {gojsapp} </div>
            <div className="mmname bg-light mx-1 px-1" style={{fontSize: "8px"}}>{targetmnamediv}</div>
          </>
        : <div className="btn-vertical m-0 pl-1 p-0" style={{ textAlign: "center", verticalAlign: "baseline", maxWidth: "3px", padding: "0px" }}><span> T a r g e t </span></div>
      }
    </>

  return (
    <>
      {/* {refresh ? <> {palette} </> : <>{palette}</>} */}
      {palette} 
      <style jsx>{`
        .diagram-component {
          height: 101%;
          width: 98%;
        }
       `}</style>
    </>
  )
}

export default TargetMeta;
