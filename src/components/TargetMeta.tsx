// @ts-nocheck
import React, { useState } from "react";
import { connect, useSelector } from 'react-redux';
import Page from './page';
import GoJSApp from "./gojs/GoJSApp";
import GoJSPaletteTargetApp from "./gojs/GoJSPaletteTargetApp";

const TargetMeta = (props) => {
  // const page = (props) => {

  const gojstypes = props.gojsTargetMetamodel

  // /** Toggle divs */
  const [visiblePalette, setVisiblePalette] = useState(false)
  function togglePalette() { setVisiblePalette(!visiblePalette); }

  const [refresh, setRefresh] = useState(true)
  function toggleRefresh() { setRefresh(!refresh); }

  /**  * Get the state and metie from the store,  */
  // const gojstypes = props.phFocus.gojsMetamodel
  // console.log('18 Palette', gojstypes, props);
  // console.log('11 Palette', gojstypes);
  // console.log('12 Palette', gojstypes.nodeDataArray);
  // console.log('13 Palette', gojstypes.linkDataArray);

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

  const palette =
    <>
      <button className="btn-sm pt-0 pb-0 b-0 mt-0 mr-2" style={{ backgroundColor: "#9a9", outline: "0", borderStyle: "none" }}
        onClick={togglePalette}> {visiblePalette ? <span>&gt;PaletteTargetMeta</span> : <span>&lt;</span>}
      </button>
      {visiblePalette
        ? <div> {gojsapp} <div style={{ minWidth: "290px" }}></div></div>
        : <div className="btn-vertical m-0 pl-2 p-0" style={{ verticalAlign: "middle", maxWidth: "4px", padding: "0px" }}><span> P a l e t t e - T a r g e t - M e t a m o d e l</span> </div>
      }
    </>

  return (
    <>
      {palette}
      <style jsx>{`
        // .diagram-component {
        //   height: 100%;
        // }
       `}</style>
    </>
  )
}

export default TargetMeta;
