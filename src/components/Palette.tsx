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

const Palette = (props) => {
  const debug = false
  if (debug) console.log('13 Palette ',  props );

  let focusModel = props.phFocus?.focusModel
  const models = props.metis?.models
  const metamodels = props.metis?.metamodels
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const mmodel = metamodels?.find((m: any) => m?.id === model?.metamodelRef)
  // console.log('16', props, mmodel.name, model.metamodelRef);
  
  
  const gojstypes = props.gojsMetamodel
  const gojsmodelobjects_all = props.gojsModelObjects // has to be: props.gojsObjects
  if (!debug) console.log('16 Palette', gojsmodelobjects_all);
  const gojsmodelobjects = gojsmodelobjects_all?.filter(node => node.object && node.object.deleted === false)
  if (!debug) console.log('16 Palette gojsobjects', gojsmodelobjects );


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
    if (debug) console.log(' Palette', gojstypes);
    if (debug) console.log('12 Palette', gojstypes.nodeDataArray);
    if (debug) console.log('13 Palette', gojstypes.linkDataArray);
    
    const gojsapp = (gojstypes) &&
    <>
      <Nav tabs >
        <NavItem >
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px", paddingLeft: "1px" }}
            className={classnames({ active: activeTab === '1' })}
            onClick={() => { toggleTab('1'); toggleRefresh() }}
          >
            Types
          </NavLink>
        </NavItem>
        <NavItem >
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px", paddingLeft: "1px" }}
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
                    nodeDataArray={gojsmodelobjects?.nodeDataArray}
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
        <button className="btn-sm p-0 pr-2 mr-2 pt-2" style={{ backgroundColor: "#999", outline: "0", borderStyle: "none"}}
          onClick={togglePalette}> {visiblePalette ? <span> &lt;- Palette </span> : <span>&gt;</span>} 
        </button>
        {/* <span>{props.focusMetamodel?.name}</span> */}
        <div>
        {/* <div style={{ minWidth: "140px" }}> */}
          {visiblePalette 
            ?  (refresh) 
                  ? <><div className="mmname bg-light text-secondary mx-1 px-1 mb-1" style={{fontSize: "8px"}}>{mmnamediv}</div>{ gojsapp } </> 
                  : <><div className="mmname bg-light text-secondary mx-1 px-1 mb-1" style={{fontSize: "8px"}}>{mmnamediv}</div>{ gojsapp }</>
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
