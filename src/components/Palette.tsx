// @ts-nocheck
import React, { useState , useEffect} from "react";
import { useDispatch } from 'react-redux';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
// import { setGojsModelObjects } from "../actions/actions";
import Selector from './utils/Selector'

const debug = false;

const Palette = (props: any) => {
  const dispatch = useDispatch();
  if (debug) console.log('13 Palette ',  props );

  let focusModel = props.phFocus?.focusModel
  const models = props.metis?.models
  const metamodels = props.metis?.metamodels
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const mmodel = metamodels?.find((m: any) => m?.id === model?.metamodelRef)
  // console.log('16', props, mmodel.name, model.metamodelRef);
  const focusTask = props.phFocus?.focusTask
  const focusRole = props.phFocus?.focusRole
  
  const unsorted = props.gojsMetamodel
  if (!debug) console.log('25 propsMetamodel', unsorted);

  //rearrange sequence
  let ndarr = unsorted?.nodeDataArray
  let ldarr = unsorted?.linkDataArray
  let filteredArr = ndarr
  
  let gojstypes = {nodeDataArray: filteredArr, linkDataArray: []}

  let tasksNodeDataArray: any[] 
  
  const hasIrtv = ndarr?.find(i => i?.typename === 'Role')
  const hasOsdu = ndarr?.find(i => i?.typename === 'JsonObject')

  const [otfilter, setOtfilter] = useState('All')
  const [ofilter, setOfilter] = useState('All')
  const [refreshPalette, setRefreshPalette] = useState(true)
  function toggleRefreshPalette() { setRefreshPalette(!refreshPalette); }

  // const handleSetFilter = (filter: React.SetStateAction<string>) => {
  //   // if (!debug) console.log('148 Palette handleSetFilter', filter, focusTask.workOnTypes[1]);
  //   setOtfilter(filter)
  //   gojstypes =  {nodeDataArray: filteredArr, linkDataArray: ldarr}
  //   toggleRefreshPalette()
  // }

  let seltasks = focusRole?.tasks?.map(t => t)
  
  console.log('54 Palette', focusRole, 'task: ', props.phFocus?.focusTask, 'seltasks :', seltasks);

  const selectTaskDiv = (seltasks)
    ?
      <div className="seltask w-100">
        <Selector type='SET_FOCUS_TASK' selArray={seltasks} selName='Task' focusTask={focusTask} focustype='focusTask'  refresh={refresh} setRefresh={setRefresh} />
      </div>
    :
      <div className="seltask w-100"></div>

    let GoJSPaletteAppDiv = < GoJSPaletteApp
      nodeDataArray={gojstypes.nodeDataArray}
      linkDataArray={[]}
      // linkDataArray={gojstypes.linkDataArray}
      metis={props.metis}
      myMetis={props.myMetis}
      myGoModel={props.myGoModel}
      phFocus={props.phFocus}
      dispatch={props.dispatch}
    />
  // -----------------------------------------------------
  useEffect(() => {

    console.log('66 useEffect', focusTask);

    setOtfilter(focusTask?.workOnTypes)
    
    const tasksNodeDataArray = focusTask?.workOnTypes?.map(wot => 
      filteredArr?.find(i => {
        // console.log('72 Palette', i?.typename, wot)
        // console.log('74 Palette', (i?.typename === wot) && i)
        return (i?.typename === wot) && i
      })
    )
    console.log('77 useEffect', otfilter, tasksNodeDataArray);
    gojstypes = {nodeDataArray: tasksNodeDataArray, linkDataArray: []} 

    console.log('79 useEffect', gojstypes);
    
    function refres() {
      
      console.log('95 useEffect', gojstypes);
      GoJSPaletteAppDiv = < GoJSPaletteApp
        nodeDataArray={tasksNodeDataArray}
        linkDataArray={[]}
        // linkDataArray={gojstypes.linkDataArray}
        metis={props.metis}
        myMetis={props.myMetis}
        myGoModel={props.myGoModel}
        phFocus={props.phFocus}
        dispatch={props.dispatch}
      />
      setRefreshPalette(!refreshPalette)
    }
    setTimeout(refres, 10000);

  }, [focusTask])
 


  console.log('182 Palette filteredArr', filteredArr, tasksNodeDataArray);

  // set nodeDataArray = fileredArr and linkDataArray = ldarr

  // gojstypes = {nodeDataArray: {filteredArr: nodeDataArray}, linkDataArray: ldarr} 
  

  
  // ================================================================================================
  // Show all the objects in this model
  const gojsmodelObjects = props.gojsModelObjects

  let unsortedObj = gojsmodelObjects
  if (debug) console.log('172 unsorted gojsModelobjects', props, gojsmodelObjects, unsortedObj);

  //rearrange sequence
  let objArr = unsortedObj?.nodeDataArray

  const nodeArray_all = objArr 
  if (debug) console.log('178 nodeArray_all', nodeArray_all);
  // filter out the objects that are marked as deleted
  const objectsNotDeleted = nodeArray_all?.filter(node => node && node.markedAsDeleted === false)
  
  // // filter out all objects of type Property
  const roleTaskObj = objectsNotDeleted?.filter(node => node && (node.typename === 'Task' || node.typename === 'Role'))
  const noPropertyObj = objectsNotDeleted?.filter(node => node && (node.typename !== 'Property' && node.typename !== 'PropLink'))
  const noAbstractObj = objectsNotDeleted?.filter(node => node && (node.typename !== 'Abstract' && node.typename !== 'Property' && node.typename !== 'PropLink'))
  if (debug) console.log('185 Palette noPropertyObj', noPropertyObj, noAbstractObj);

  const handleSetObjFilter = (filter) => {
    if (debug) console.log('Palette handleSetOfilter', filter);
    setOfilter(filter)
    // gojstypes =  {nodeDataArray: filteredArr, linkDataArray: ldarr}
    toggleRefreshPalette()
  }
  
  {/* <div style={{transform: "scale(0.9)" }}> */}
  const selectedObjDiv = (
    <div >
      { <button className= "btn bg-light btn-sm " onClick={() => { handleSetObjFilter('Tasks') }}>Task</button>}
      { <button className= "btn bg-light btn-sm " onClick={() => { handleSetObjFilter('!Property') }}>!PROP</button>}
      { <button className= "btn bg-light btn-sm " onClick={() => { handleSetObjFilter('!Abstract') }}>!ABS</button>}
      { <button className= "btn bg-light btn-sm " onClick={() => { handleSetObjFilter('All') }}>ALL</button> }
    </div>
  )

  // // filter out all objects of type Property
  let ofilteredArr = objectsNotDeleted
  if (ofilter === 'Tasks') ofilteredArr = roleTaskObj
  if (ofilter === '!Property') ofilteredArr = noPropertyObj
  if (ofilter === '!Abstract') ofilteredArr = noAbstractObj
  if (ofilter === 'All') ofilteredArr = objectsNotDeleted

  // const oNodeDataArray = nodeArray_all
  // const oNodeDataArray = ofilteredArr
  let gojsobjects =  {nodeDataArray: ofilteredArr, linkDataArray: []}



  // /** Toggle divs **/
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
  if (debug) console.log('233 Palette', gojstypes.nodeDataArray );
  // if (debug) console.log('49 Palette', gojstypes.nodeDataArray);
  // if (debug) console.log('50 Palette', gojstypes.linkDataArray);

  const mmnamediv = (mmodel) ? <span className="metamodel-name">{mmodel?.name}</span> : <span>No metamodel</span> 
  const mnamediv = (mmodel) ? <span className="metamodel-name">{model?.name}</span> : <span>No model</span> 

  const gojsappPalette = // this is the palette with tabs for Types and Objects Todo: add posibility to select many types or objects to drag in (and also with links)
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
        {/* TYPES this is the tab for Objecttypes */}
        <TabPane tabId="1">
          <div className="workpad p-1 pt-2 bg-white" >
            {/* <Row >
              <Col xs="auto ml-3 mr-0 pr-0 pl-0"> */}
                {/* <div className="myPalette pl-1 mb-1 pt-2 text-white" style={{ maxWidth: "150px", minHeight: "8vh", height: "100%", marginRight: "2px", backgroundColor: "#999", border: "solid 1px black" }}> */}
                <div className="mmname mx-0 px-1 mb-1" style={{fontSize: "16px", minWidth: "184px", maxWidth: "212px"}}>{mmnamediv}</div>
                <div className="mmtask mx-0 px-1 mb-1 " style={{fontSize: "16px", minWidth: "212px", maxWidth: "212px"}}>{selectTaskDiv}</div>
                {/* {selectedMMDiv} */}
                {GoJSPaletteAppDiv}
                {/* < GoJSPaletteApp
                  nodeDataArray={gojstypes.nodeDataArray}
                  linkDataArray={[]}
                  // linkDataArray={gojstypes.linkDataArray}
                  metis={props.metis}
                  myMetis={props.myMetis}
                  myGoModel={props.myGoModel}
                  phFocus={props.phFocus}
                  dispatch={props.dispatch}
                /> */}
              {/* </Col>
            </Row> */}
            </div>
          {/* </div> */}
        </TabPane>
        {/* OBJECTS  this is the tab for Object instances*/}
        <TabPane tabId="2">
          <div className="workpad p-1 pt-2 bg-white">
            {/* <Row >
              <Col xs="auto m-0 p-0 pl-3"> */}
                {/* <div className="myPalette pl-1 mb-1 pt-2 text-white" style={{ maxWidth: "150px", minHeight: "8vh", height: "100%", marginRight: "2px", backgroundColor: "#999", border: "solid 1px black" }}> */}
                 {/* <div className="mmname mx-0 px-1 mb-1" style={{fontSize: "11px", minWidth: "156px", maxWidth: "160px"}}>{mnamediv}</div> */}
                  {selectedObjDiv}
                  < GoJSPaletteApp
                    nodeDataArray={gojsobjects.nodeDataArray}
                    linkDataArray={[]}
                    // linkDataArray={gojstypes.linkDataArray}
                    metis={props.metis}
                    myMetis={props.myMetis}
                    myGoModel={props.myGoModel}
                    phFocus={props.phFocus}
                    dispatch={props.dispatch}
                  />
                {/* </div> */}
              {/* </Col>
            </Row> */}
          </div>
        </TabPane>
      </TabContent>
    </>
    
   const palette = // this is the left pane with the palette and toggle for refreshing
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
      {/* <style jsx>{``}</style> */}
    </>
  )
}

export default Palette;
