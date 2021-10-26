// @ts-nocheck
const debug = false;

import React, { useState , useEffect} from "react";
// import { Collapse, Button } from 'reactstrap'
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import { connect, useSelector, useDispatch } from 'react-redux';
import Page from './page';
import GoJSApp from "./gojs/GoJSApp";
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
import { setGojsModelObjects } from "../actions/actions";

const Palette = (props) => {
  const dispatch = useDispatch();
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
  let ldarr = unsorted?.linkDataArray
  let filteredArr = ndarr
  
  let gojstypes = []
  let tmpndarr = ndarr
  if (ndarr) {
    if (debug) console.log('32 Palette', ndarr);

    const indexInputPattern = (ndarr) && ndarr?.findIndex(i => i?.typename === 'InputPatatern')
    ndarr = (indexInputPattern > 0) ? [ndarr[indexInputPattern], ...ndarr.slice(0,indexInputPattern), ...ndarr.slice(indexInputPattern+1, ndarr.length)] : ndarr
    const indexViewFormat = (ndarr) && ndarr?.findIndex(i => i?.typename === 'ViewFormat')
    ndarr = (indexViewFormat > 0) ? [ndarr[indexViewFormat], ...ndarr.slice(0,indexViewFormat), ...ndarr.slice(indexViewFormat+1, ndarr.length)] : ndarr
    const indexMethodType = (ndarr) && ndarr?.findIndex(i => i?.typename === 'MethodType')
    ndarr = (indexMethodType > 0) ? [ndarr[indexMethodType], ...ndarr.slice(0,indexMethodType), ...ndarr.slice(indexMethodType+1, ndarr.length)] : ndarr
    const indexMethod = (ndarr) && ndarr?.findIndex(i => i?.typename === 'Method')
    ndarr = (indexMethod > 0) ? [ndarr[indexMethod], ...ndarr.slice(0,indexMethod), ...ndarr.slice(indexMethod+1, ndarr.length)] : ndarr
    const indexValue = ndarr?.findIndex(i => i?.typename === 'Value')
    ndarr = (indexValue > 0) ? [ndarr[indexValue], ...ndarr.slice(0,indexValue), ...ndarr.slice(indexValue+1, ndarr.length)] : ndarr
    const indexDatatype = ndarr?.findIndex(i => i?.typename === 'Datatype')
    ndarr = (indexDatatype > 0) ? [ndarr[indexDatatype], ...ndarr.slice(0,indexDatatype), ...ndarr.slice(indexDatatype+1, ndarr.length)] : ndarr
    const indexProperty = ndarr?.findIndex(i => i?.typename === 'Property')
    ndarr = (indexProperty > 0) ? [ndarr[indexProperty], ...ndarr.slice(0,indexProperty), ...ndarr.slice(indexProperty+1, ndarr.length)] : ndarr
    const indexEntityType = (ndarr) && ndarr?.findIndex(i => i?.typename === 'EntityType')
    ndarr = (indexEntityType > 0) ? [ndarr[indexEntityType], ...ndarr.slice(0,indexEntityType), ...ndarr.slice(indexEntityType+1, ndarr.length)] : ndarr
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
    if (debug) console.log('47 Palette', ndarr);
    // gojstypes = {nodeDataArray: ndarr, linkDataArray: ldarr}
    // gojstypes = (ndarr) ? {nodeDataArray: ndarr, linkDataArray: ldarr} : unsorted
  }
  // select some nodeDataArray elements to be the irtv
  if (debug) console.log('55 Palette', ndarr);
  const irtvNodeDataArray = ndarr?.filter(i => 
      i?.typename === 'Container'
    || i?.typename === 'Information'
    || i?.typename === 'Task'
    || i?.typename === 'Role'
    || i?.typename === 'View'
    || i?.typename === 'EntityType'
    && i
  )
  const initNodeDataArray = ndarr?.filter(i => 
      i?.typename === 'EntityType'
    || i?.typename === 'Container'
    || i?.typename === 'Property'
    || i?.typename === 'Datatype'
    || i?.typename === 'Value'
    || i?.typename === 'FieldType'
    || i?.typename === 'InputPattern'
    || i?.typename === 'ViewFormat'
    || i?.typename === 'Method'
    || i?.typename === 'Label'
    
    && i
  )
  const osduNodeDataArray = ndarr?.filter(i => 
      i?.typename === 'EntityType'
    || i?.typename === 'Container'
    || i?.typename === 'Property'
    || i?.typename === 'Datatype'
    || i?.typename === 'Value'
    || i?.typename === 'FieldType'
    || i?.typename === 'InputPattern'
    || i?.typename === 'ViewFormat'
    || i?.typename === 'Method'
    || i?.typename === 'Properties'
    || i?.typename === 'JsonArray'
    || i?.typename === 'JsonObject'
    
    && i
  )
  const hasIrtv = ndarr?.find(i => i?.typename === 'Role')
  const hasOsdu = ndarr?.find(i => i?.typename === 'JsonObject')
  
  const [selectedIrtvMM, setSelectedIrtvMM] = useState(false)
  const [filter, setFilter] = useState('All')
  const [refreshPalette, setRefreshPalette] = useState(true)
  function toggleRefreshPalette() { setRefreshPalette(!refreshPalette); }

  const handleSetFilter = (filter) => {
    if (debug) console.log('Palette handleSetFilter', filter);
    setFilter(filter)
    // gojstypes =  {nodeDataArray: filteredArr, linkDataArray: ldarr}
    toggleRefreshPalette()
  }

  const selectedMMDiv = (
    <div>
      { (!hasOsdu) && <button className= "btn bg-light btn-sm " onClick={() => { handleSetFilter('INIT') }}>INIT</button>}
      { (hasIrtv) && <button className= "btn bg-light btn-sm " onClick={() => { handleSetFilter('IRTV') }}>IRTV</button>}
      { (hasOsdu) && <button className= "btn bg-light btn-sm " onClick={() => { handleSetFilter('OSDU') }}>OSDU</button>}
      <button className= "btn bg-light btn-sm " onClick={() => { handleSetFilter('All') }}>All</button>
    </div>
  )

  if (filter === 'All') filteredArr = ndarr
  if (filter === 'IRTV') filteredArr = irtvNodeDataArray
  if (filter === 'INIT') filteredArr = initNodeDataArray
  if (filter === 'OSDU') filteredArr = osduNodeDataArray

  gojstypes =  {nodeDataArray: filteredArr, linkDataArray: ldarr}

  if (debug) console.log('37 Palette', gojstypes);

  const nodeArray_all = props.gojsModelObjects?.nodeDataArray 
  if (debug) console.log('27 Palette', nodeArray_all);
  const objectsNodeDataArray = nodeArray_all?.filter(node => node.object && node.object.markedAsDeleted === false)
  if (debug) console.log('29 Palette objectsNodeDataArray', nodeArray_all?.filter(n => n.markedAsDeleted === false) );

  // /** Toggle divs */
  const [visiblePalette, setVisiblePalette] = useState(true)
  function togglePalette() { setVisiblePalette(!visiblePalette); }
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen); 

  const [refresh, setRefresh] = useState(true)
  function toggleRefresh() { setRefresh(!refresh); }

  useEffect(() => { // toggle refresh when loading
    toggleRefreshPalette()
  }, [])

  const [activeTab, setActiveTab] = useState('1');
  const toggleTab = tab => { if (activeTab !== tab) setActiveTab(tab); }
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const toggleTip = () => setTooltipOpen(!tooltipOpen);
  /**  * Get the state and metie from the store,  */
  // const gojstypes = props.phFocus.gojsMetamodel
  if (debug) console.log('48 Palette', gojstypes);
  if (debug) console.log('49 Palette', gojstypes.nodeDataArray);
  if (debug) console.log('50 Palette', gojstypes.linkDataArray);

  const mmnamediv = (mmodel) ? <span className="metamodel-name">{mmodel?.name}</span> : <span>No metamodel</span> 
  
  // const gojsapp = (gojstypes?.nodeDataArray && gojstypes?.nodeDataArray[0]?.typename) &&
  const gojsappPalette = 
    <>
      <Nav tabs >
        <NavItem >
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px", paddingLeft: "1px", borderColor: "#eee gray white #eee", color: "black" }}
            className={classnames({ active: activeTab === '1' })}
            onClick={() => { toggleTab('1'); toggleRefreshPalette() }}
          >
            Types
          </NavLink>
        </NavItem>
        <NavItem >
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px", paddingLeft: "1px", borderColor: "#eee gray white #eee", color: "black"}}
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
                <div className="mmname mx-0 px-1 mb-1" style={{fontSize: "11px", minWidth: "156px", maxWidth: "160px"}}>{mmnamediv}</div>
                {selectedMMDiv}
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
    
   const palette =
      <> 
        <button className="btn-sm px-0 m-0" style={{ backgroundColor: "#7ac", outline: "0", borderStyle: "none"}}
          onClick={togglePalette}> {visiblePalette ? <span> &lt;- Palette </span> : <span>&gt;</span>} 
        </button>
        {/* <span>{props.focusMetamodel?.name}</span> */}
        <div>
        {/* <div style={{ minWidth: "140px" }}> */}
          {visiblePalette 
            ? (refreshPalette) 
              ? <><div className="btn-horizontal bg-light mx-0 px-1 mb-1" style={{fontSize: "11px", minWidth: "166px", maxWidth: "160px"}}></div>{ gojsappPalette }</> 
              : <div><div className="btn-horizontal bg-light mx-0 px-1 mb-1" style={{fontSize: "11px", minWidth: "166px", maxWidth: "160px"}}></div>{ gojsappPalette }</div>
            : <div className="btn-vertical m-0 pl-1 p-0" style={{ maxWidth: "4px", padding: "0px" }}><span> P a l e t t e </span> </div>
          }
        </div>
      </>  
  
  return (
    <>
      {palette} 
      {/* {refreshPalette ? <> {palette} </> : <> {palette} </>} */}
        {/* <style jsx>{`

       `}</style> */}
    </>
  )
}

export default Palette;
