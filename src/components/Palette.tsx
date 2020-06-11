// @ts-nocheck
import React, { useState } from "react";
import { connect, useSelector } from 'react-redux';
import Page from './page';
import GoJSApp from "./gojs/GoJSApp";
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";

const Palette = (props) => {
// const page = (props) => {
  
  const gojstypes = props.gojsMetamodel

  // /** Toggle divs */
  const [visiblePalette, setVisiblePalette] = useState(true)
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
    < GoJSPaletteApp
    nodeDataArray={gojstypes.nodeDataArray}
    linkDataArray={gojstypes.linkDataArray}
    metis={props.metis}
    myMetis={props.myMetis}
    myGoModel={props.myGoModel}
    phFocus={props.phFocus}
    dispatch={props.dispatch}
    />
    
    const palette =
    <> 
      <button className="btn-sm pt-0 pb-0 b-0 mt-0" style={{ backgroundColor: "#999", outline: "0", borderStyle: "none"}}
        onClick={togglePalette}> {visiblePalette ? <span> &lt;  Palette </span> : <span>&gt;</span>} 
      </button>
        {visiblePalette 
          ? <span className="btn-link btn-sm pl-2 pr-0 " style={{ color: "white" }} onClick={toggleRefresh}>{refresh ? 'refresh' : 'refresh'} </span>
          : <div className="btn-vertical m-0 p-0" style={{ maxWidth: "4px", padding: "0px" }}><span> P a l e t t e</span> 
        </div>}
        {/* ? 'Palette <' 
        :  'Palette >' } 
      </div> */}
         {/* <div  style={{paddingLeft: "2px"}} onClick={togglePalette}>{visiblePalette ? 'Palette <' :  'Palette >' } </div> */}
        <div className="togglePalette" >
          {visiblePalette ? <> {refresh ? <> {gojsapp} </> : <>{gojsapp}</>}</> : <><span style={{ width: "100%", minHeight: "100px", minWidth: "290"}}></span></> }
        </div>
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

export default Palette;
