// @ts-nocheck
import React, { useState, useEffect } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';

import Page from './page';
import GoJSApp from "./gojs/GoJSApp";
import GoJSPaletteTargetApp from "./gojs/GoJSPaletteTargetApp";
import * as uib from '../akmm/ui_buildmodels';

const debug = false;

const TargetMeta = (props) => {
  const dispatch = useDispatch();
  if (debug) console.log('10 TargetMeta', props);
  let focusModel = props.phFocus?.focusModel
  const models = props.metis?.models
  const metamodels = props.metis?.metamodels
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  let targetmetamodel = metamodels?.find((m: any) => m?.id === model?.targetMetamodelRef)
  const targetmodel = models?.find((m: any) => m?.id === model?.targetModelRef)


  const myTargetMetamodel = props.myMetis.findMetamodel(model.targetMetamodelRef)
  const gojstypes = uib.buildGoPalette(myTargetMetamodel, props.myMetis)
  if (debug) console.log('22 TargetMeta', gojstypes, gojstypes.nodes)

  const wotArr = ['Container', 'OSDUType', 'Property', 'Proxy', 'DataType', 'Value', 'Fieldtype', 'InputPattern', 'ViewFormat'];

  const otsArrSorted = gojstypes.nodes.sort((a, b) => {
    const aIndex = wotArr.indexOf(a?.name);
    const bIndex = wotArr.indexOf(b?.name);

    if (aIndex === -1) return 1; // a is not found in wotArr, sort a to the end
    if (bIndex === -1) return -1; // b is not found in wotArr, sort b to the end

    return aIndex - bIndex; // both a and b are found in wotArr, sort them based on their indices
  });



  // const gojstypes = props.gojsTargetMetamodel
  // if (debug) console.log('27 TargetMeta', otsArr, otsArrSorted);
  const [visiblePalette, setVisiblePalette] = useState(false)
  function togglePalette() { setVisiblePalette(!visiblePalette); }

  useEffect(() => {
    if (debug) console.log('35 TargetMeta useEffect', model?.targetMetamodelRef, 'targetmm', targetmetamodel?.id, targetmetamodel?.name);
    // GenGojsModel(props, dispatch);
    // targetmetamodel = metamodels?.find((m: any) => m?.id === model?.targetMetamodelRef)
    // (model?.targetMetamodelRef && targetmetamodel) && 
    if (targetmetamodel?.id === undefined) {
      if (debug) console.log('39 TargetMeta useEffect', targetmetamodel?.id, targetmetamodel?.name);
    } else if (targetmetamodel?.id === "") {
      if (debug) console.log('41 TargetMeta useEffect', targetmetamodel?.id, targetmetamodel?.name);
    } else {
      if (debug) console.log('43 TargetMeta useEffect', targetmetamodel?.id, targetmetamodel?.name);
      dispatch({ type: 'SET_FOCUS_TARGETMETAMODEL', data: { id: targetmetamodel?.id, name: targetmetamodel?.name } })
    }
    // const timer = setTimeout(() => {
    //   setRefresh(!refresh)
    // }, 3000);
    // return () => clearTimeout(timer);
  }, [(targetmetamodel !== undefined && targetmetamodel?.id !== "")]);

  if (debug) console.log('33 TargetMeta', props, gojstypes, gojstypes.nodeDataArray);
  if (!model?.targetMetamodelRef) return <></>

  const gojsapp = (gojstypes) &&
    < GoJSPaletteTargetApp
      nodeDataArray={gojstypes.nodes}
      linkDataArray={[]}
      // linkDataArray={gojstypes.linkDataArray}
      metis={props.metis}
      myMetis={props.myMetis}
      myGoModel={props.myGoModel}
      phFocus={props.phFocus}
      dispatch={props.dispatch}
    />

  const targetmmnamediv = (targetmetamodel)
    ? <div className="mmname bg-transparent mx-0 px-1 my-0" >{targetmetamodel?.name}</div>
    : <span>No target metamodel</span>

  const targetmnamediv = (targetmodel) ? <span>Target model: {targetmodel?.name}</span> : <span>No target model</span>

  const palette =
    <>
      <button className="btn-sm text-light bg-transparent border border-0 border-transparent"
        onClick={togglePalette}> {visiblePalette
          ? <span className="ps-1 fs-8"><i className="fa fa-lg fa-angle-right pull-right-container"></i>  Target Metamodel - -</span>
          // ? <span> &lt;- Palette: Src Metamodel</span> 
          : <i className="fa fa-lg fa-angle-left pull-right-container"></i>
        }
      </button>
      {visiblePalette
        ? <>
          <div className="mmname bg-transparent fs-6" style={{ fontSize: "10px" }}>{targetmmnamediv}</div>
          <div className="m-1"> {gojsapp} </div>
          <div className="mmname bg-light m-0 mx-1" style={{ fontSize: "10px" }}>{targetmnamediv}</div>
        </>
        : <div className="btn-vertical m-0 pl-2"
          style={{ textAlign: "center", verticalAlign: "baseline", maxWidth: "3px", paddingLeft: "1px", fontSize: "12px", display: "flex", alignItems: "center" }}><span> T a r g e t - M e t a m o d e l</span></div>
      }
    </>

  return (
    <div className="py-1">
      {/* {refresh ? <> {palette} </> : <>{palette}</>} */}
      {palette}
      <style jsx>{`
        // .diagram-component {
        //   height: 101%;
        //   width: 98%;
        // }
       `}</style>
    </div>
  )
}

export default TargetMeta;
