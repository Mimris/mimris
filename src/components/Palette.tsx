// @ts-nocheck
const debug = false;
import React, { useState } from "react";
// import { Collapse, Button } from 'reactstrap'
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import { connect, useSelector } from 'react-redux';
import Page from './page';
import GoJSApp from "./gojs/GoJSApp";
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
import { setGojsModelObjects } from "../actions/actions";

const Palette = (props) => {
  const debug = false
  if (debug) console.log('13 Palette ',  props );

  let focusModel = props.phFocus?.focusModel
  const models = props.metis?.models
  const metamodels = props.metis?.metamodels
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const mmodel = metamodels?.find((m: any) => m?.id === model?.metamodelRef)
  // console.log('16', props, mmodel.name, model.metamodelRef);
  
  const unsorted = props.gojsMetamodel
  if (debug) console.log('25', unsorted);

  //rearrange sequence
  let ndarr = unsorted?.nodeDataArray
  let ldarr = unsorted?.linkDataArra
  let gojstypes = []
  let tmpndarr = ndarr
  if (ndarr) {
    if (debug) console.log('32 Palette', ndarr);
    const indexValue = ndarr?.findIndex(i => i?.typename === 'Value')
    ndarr = (indexValue > 0) ? [ndarr[indexValue], ...ndarr.slice(0,indexValue), ...ndarr.slice(indexValue+1, ndarr.length)] : ndarr
    const indexDatatype = ndarr?.findIndex(i => i?.typename === 'Datatype')
    ndarr = (indexDatatype > 0) ? [ndarr[indexDatatype], ...ndarr.slice(0,indexDatatype), ...ndarr.slice(indexDatatype+1, ndarr.length)] : ndarr
    const indexProperty = ndarr?.findIndex(i => i?.typename === 'Property')
    ndarr = (indexProperty > 0) ? [ndarr[indexProperty], ...ndarr.slice(0,indexProperty), ...ndarr.slice(indexProperty+1, ndarr.length)] : ndarr
    const indexView = ndarr?.findIndex(i => i?.typename === 'View')
    ndarr = (indexView > 0) ? [ndarr[indexView], ...ndarr.slice(0,indexView), ...ndarr.slice(indexView+1, ndarr.length)] : ndarr
    const indexTask = (ndarr) && ndarr.findIndex(i => i?.typename === 'Task')
    ndarr = (indexTask > 0) ? [ndarr[indexTask], ...ndarr.slice(0,indexTask), ...ndarr.slice(indexTask+1, ndarr.length)] : ndarr
    const indexRole = (ndarr) && ndarr.findIndex(i => i?.typename === 'Role')
    ndarr = (indexRole > 0) ? [ndarr[indexRole], ...ndarr.slice(0,indexRole), ...ndarr.slice(indexRole+1, ndarr.length)] : ndarr
    const indexInfo = (ndarr) && ndarr?.findIndex(i => i?.typename === 'Information')
    ndarr =  (indexInfo > 0) ? [ndarr[indexInfo], ...ndarr.slice(0,indexInfo), ...ndarr.slice(indexInfo+1, ndarr.length)] : ndarr
    const indexContainer = (ndarr) && ndarr?.findIndex(i => i?.typename === 'Container')
    ndarr = (indexContainer > 0) ? [ndarr[indexContainer], ...ndarr.slice(0,indexContainer), ...ndarr.slice(indexContainer+1, ndarr.length)] : ndarr
    const indexGeneric = (ndarr) && ndarr?.findIndex(i => i?.typename === 'Generic')
    ndarr = (indexGeneric > 0) ? [ndarr[indexGeneric], ...ndarr.slice(0,indexGeneric), ...ndarr.slice(indexGeneric+1, ndarr.length)] : ndarr
    if (debug) console.log('47 Palette', ndarr);
    gojstypes = {nodeDataArray: ndarr, linkDataArray: ldarr}
    // gojstypes = (ndarr) ? {nodeDataArray: ndarr, linkDataArray: ldarr} : unsorted
  }

  if (debug) console.log('37 Palette', gojstypes, ndarr);

  const nodeArray_all = props.gojsModelObjects?.nodeDataArray 
  if (debug) console.log('27 Palette', nodeArray_all);
  const objectsNodeDataArray = nodeArray_all?.filter(node => node.object && node.object.deleted === false)
  if (debug) console.log('29 Palette objectsNodeDataArray', nodeArray_all?.filter(n => n.deleted === false) );

  // /** Toggle divs */
  const [visiblePalette, setVisiblePalette] = useState(true)
  function togglePalette() { setVisiblePalette(!visiblePalette); }
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen); 

  const [refresh, setRefresh] = useState(true)
  function toggleRefresh() { setRefresh(!refresh); }

  const [activeTab, setActiveTab] = useState('1');
  const toggleTab = tab => { if (activeTab !== tab) setActiveTab(tab); }
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const toggleTip = () => setTooltipOpen(!tooltipOpen);
  /**  * Get the state and metie from the store,  */
    // const gojstypes = props.phFocus.gojsMetamodel
    if (debug) console.log('48 Palette', gojstypes);
    if (debug) console.log('49 Palette', gojstypes.nodeDataArray);
    if (debug) console.log('50 Palette', gojstypes.linkDataArray);
    
    // const gojsapp = (gojstypes?.nodeDataArray && gojstypes?.nodeDataArray[0]?.typename) &&
    const gojsapp = (gojstypes?.nodeDataArray) && 
    <>
      <Nav tabs >
        <NavItem >
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px", paddingLeft: "1px", color: "black" }}
            className={classnames({ active: activeTab === '1' })}
            onClick={() => { toggleTab('1'); toggleRefresh() }}
          >
            Types
          </NavLink>
        </NavItem>
        <NavItem >
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px", paddingLeft: "1px" , color: "black"}}
            className={classnames({ active: activeTab === '2' })}
            onClick={() => { toggleTab('2'); toggleRefresh() }}
          >
            Objects
          </NavLink>
        </NavItem>
      </Nav>
      <TabContent activeTab={activeTab} >
        {/* TYPES */}
        <TabPane tabId="1">
          <div className="workpad p-1 pt-2 bg-white" >
            {/* <Row >
              <Col xs="auto ml-3 mr-0 pr-0 pl-0"> */}
                {/* <div className="myPalette pl-1 mb-1 pt-2 text-white" style={{ maxWidth: "150px", minHeight: "8vh", height: "100%", marginRight: "2px", backgroundColor: "#999", border: "solid 1px black" }}> */}
                  < GoJSPaletteApp
                    nodeDataArray={gojstypes.nodeDataArray}
                    linkDataArray={[]}
                    // linkDataArray={gojstypes.linkDataArray}
                    metis={props.metis}
                    myMetis={props.myMetis}
                    myGoModel={props.myGoModel}
                    phFocus={props.phFocus}
                    dispatch={props.dispatch}
                  />
                </div>
              {/* </Col>
            </Row> */}
          {/* </div> */}
        </TabPane>
        {/* OBJECTS */}
        <TabPane tabId="2">
          <div className="workpad p-1 pt-2 bg-white">
            {/* <Row >
              <Col xs="auto m-0 p-0 pl-3"> */}
                {/* <div className="myPalette pl-1 mb-1 pt-2 text-white" style={{ maxWidth: "150px", minHeight: "8vh", height: "100%", marginRight: "2px", backgroundColor: "#999", border: "solid 1px black" }}> */}
                  < GoJSPaletteApp
                    nodeDataArray={objectsNodeDataArray}
                    linkDataArray={[]}
                    // linkDataArray={gojstypes.linkDataArray}
                    metis={props.metis}
                    myMetis={props.myMetis}
                    myGoModel={props.myGoModel}
                    phFocus={props.phFocus}
                    dispatch={props.dispatch}
                  />
                </div>
              {/* </Col>
            </Row> */}
          {/* </div> */}
        </TabPane>
      </TabContent>
    </>
    
    const mmnamediv = (mmodel) ? <span>{mmodel?.name}</span> : <span>No metamodel</span> 

   const palette =
      <> 
        <button className="btn-sm p-0 m-0" style={{ backgroundColor: "#7ac", outline: "0", borderStyle: "none"}}
          onClick={togglePalette}> {visiblePalette ? <span> &lt;- Palette </span> : <span>&gt;</span>} 
        </button>
        {/* <span>{props.focusMetamodel?.name}</span> */}
        <div>
        {/* <div style={{ minWidth: "140px" }}> */}
          {visiblePalette 
            ?  (refresh) 
                  ? <><div className="mmname bg-light text-secondary mx-4 px-4 mb-1" style={{fontSize: "8px", maxWidth: "120px"}}>{mmnamediv}</div>{ gojsapp }</> 
                  : <><div className="mmname bg-light text-secondary mx-4 px-4 mb-1" style={{fontSize: "8px", maxWidth: "120px"}}>{mmnamediv}</div>{ gojsapp }</>
              // ? <div> {gojsapp} <div style={{ minWidth: "140px" }}></div></div>
            : <div className="btn-vertical m-0 pl-1 p-0" style={{ maxWidth: "4px", padding: "0px" }}><span> P a l e t t e </span> </div>
          }
        </div>
      </>  
  
  return (
    <>
      {palette}
      {/* <style jsx>{`
        .diagram-component {
          height: 100%;
          width: 100%;
        }
       `}</style> */}
    </>
  )
}

export default Palette;
