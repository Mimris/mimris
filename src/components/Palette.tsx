// @ts-nocheck
import React, { useState , useEffect, useRef } from "react";
import { useDispatch } from 'react-redux';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
// import { setGojsModelObjects } from "../actions/actions";
import Selector from './utils/Selector'
import genRoleTasks from "./utils/SetRoleTaskFilter";

const debug = false;

const clog = console.log.bind(console, '%c %s',
    'background: green; color: white');
const ctrace = console.trace.bind(console, '%c %s',
    'background: green; color: white');

const Palette = (props: any) => {
  const dispatch = useDispatch();
  let isRendered = useRef(false);

  const [visiblePalette, setVisiblePalette] = useState(true)
  const [ofilter, setOfilter] = useState('All')
  const [refreshPalette, setRefreshPalette] = useState(true)
  const [refresh, setRefresh] = useState(true)
  function toggleRefresh() { setRefresh(!refresh); } 
  const [activeTab, setActiveTab] = useState('1');
  
  let focusModel = props.phFocus?.focusModel
  const models = props.metis?.models
  const metamodels = props.metis?.metamodels
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const mmodel = metamodels?.find((m: any) => m?.id === model?.metamodelRef)
  if (debug) console.log('16', props, mmodel?.name, model?.metamodelRef);

  // hardcoded for now
  let focusTask = props.phFocus?.focusTask
  let seltasks = props.phFocus?.focusRole?.tasks || []
  if (debug) console.log('38 seltasks', props.phFocus.focusRole, props.phFocus.focusRole?.tasks, seltasks)

  

// useEffect(() => {
//   seltasks = props.phFocus.focusRole?.tasks?.map((t: any) => t)
// }, [props.phFocus.focusRole?.tasks])

  // if (mmodel?.name === 'IRTV_MM') {
  //   focusTask = props.phFocus?.focusTask
  // } 


  focusTask = props.phFocus?.focusTask
  const focusRole = props.phFocus?.focusRole
    
  // const [isOpen, setIsOpen] = useState(false);
  // const toggle = () => setIsOpen(!isOpen); 
  
  const toggleTab = (tab: React.SetStateAction<string>) => { if (activeTab !== tab) setActiveTab(tab); }
  function togglePalette() { setVisiblePalette(!visiblePalette); } 
  function toggleRefreshPalette() { setRefreshPalette(!refreshPalette); }
  
  //rearrange sequence
  let ndarr = props.gojsMetamodel?.nodeDataArray

  if (debug) console.log('119 propsMetamodel', model?.name, mmodel?.name, ndarr);

  let taskNodeDataArray: any[] = ndarr

  if (focusTask) {
     taskNodeDataArray = props.phFocus.focusTask?.workOnTypes?.map((wot: any) => 
      ndarr?.find((i: { typename: any; }) => {
        return (i?.typename === wot) && i 
      })
    )
  } 

  useEffect(() => {
    isRendered = true;
    if (isRendered) {
    genRoleTasks(mmodel, dispatch)
  }
  return () => { isRendered = false; }
  }, [])

  // if (mmodel?.name !== 'IRTV_MM')  taskNodeDataArray = ndarr
  
  useEffect(() => { // -----------------------------------------------------------------------------
    isRendered = true;
    if (isRendered) {
      if (debug) console.log('86 Palette useEffect 2', props.phFocus.focusTask);
      taskNodeDataArray = props.phFocus.focusTask?.workOnTypes?.map((wot: any) => 
        ndarr?.find((i: { typename: any; }) => {
          return (i?.typename === wot) && i 
        })
      )
      seltasks = props.phFocus.focusRole?.tasks
      if (debug) console.log('151 seltasks', props.phFocus.focusRole, props.phFocus.focusRole?.tasks, seltasks)
      
      function refres() {        
        toggleRefreshPalette() 
      }
      setTimeout(refres, 100);
    }
    return () => { isRendered = false; }
  }, [props.phFocus.focusTask?.id])

  // break if no model
  if (!props.gojsModel) return null;
  if (!props.gojsMetamodel) return null;
  if (debug) clog('103 Palette', props , seltasks, taskNodeDataArray);
  

  let filteredOtNodeDataArray = (!taskNodeDataArray) ? ndarr : (!taskNodeDataArray[0]) ? ndarr : taskNodeDataArray    

  // ================================================================================================
  // ================================================================================================
  // Show all the objects in this model
  const gojsmodelObjects = props.gojsModelObjects

  let unsortedObj = gojsmodelObjects
  if (debug) console.log('114 unsorted gojsModelobjects', props, gojsmodelObjects, unsortedObj);

  //rearrange sequence
  let objArr = unsortedObj?.nodeDataArray

  const nodeArray_all = objArr 
  if (debug) console.log('120 nodeArray_all', nodeArray_all);
  // filter out the objects that are marked as deleted
  const objectsNotDeleted = nodeArray_all?.filter((node: { markedAsDeleted: boolean; }) => node && node.markedAsDeleted === false)
  
  // // filter out all objects of type Property
  const roleTaskObj = objectsNotDeleted?.filter((node: { typename: string; }) => node && (node.typename === 'Task' || node.typename === 'Role'))
  const noPropertyObj = objectsNotDeleted?.filter((node: { typename: string; }) => node && (node.typename !== 'Property' && node.typename !== 'PropLink'))
  const noAbstractObj = objectsNotDeleted?.filter((node: { typename: string; }) => node && (node.typename !== 'Abstract' && node.typename !== 'Property' && node.typename !== 'PropLink'))
  if (debug) console.log('185 Palette noPropertyObj', noPropertyObj, noAbstractObj);

  const handleSetObjFilter = (filter: React.SetStateAction<string>) => {
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

  const mmnamediv = (mmodel) ? <span className="metamodel-name">{mmodel?.name}</span> : <span>No metamodel</span> 
  const mnamediv = (mmodel) ? <span className="metamodel-name">{model?.name}</span> : <span>No model</span> 
  seltasks = (props.phFocus.focusRole?.tasks) && props.phFocus.focusRole?.tasks?.map((t: any) => t)

  if (debug) console.log('163 Palette', props.phFocus?.focusRole,'tasks:', props.phFocus?.focusRole?.tasks, 'task: ', props.phFocus?.focusTask, 'seltasks :', seltasks);
  
  // let selectTaskDiv = (seltasks && mmodel.name === 'IRTV_MM') 
  let selectTaskDiv = 
    <>
      {/* <span onClick={genroletasks} className="btn btn-sm btn-primary">Set Role Task filter</span> */}
      {/* <details><summary markdown="span">Task <code>(Typefilter)</code></summary> */}
      <details><summary markdown="span"  >Modelling Task : </summary>
        <div className="seltask w-100">
          <Selector type='SET_FOCUS_TASK' selArray={seltasks} selName='Task' focusTask={focusTask} focustype='focusTask'  refresh={refresh} setRefresh={setRefresh} />
        </div>
        </details>
      <div>{focusTask?.name}</div>
    </>
 

  const gojsappPalette =  // this is the palette with tabs for Types and Objects Todo: add posibility to select many types or objects to drag in (and also with links)
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
                  < GoJSPaletteApp
                    // nodeDataArray={ndarr}
                    nodeDataArray={filteredOtNodeDataArray}
                    linkDataArray={[]}
                    // linkDataArray={gojstypes.linkDataArray}
                    metis={props.metis}
                    myMetis={props.myMetis}
                    myGoModel={props.myGoModel}
                    phFocus={props.phFocus}
                    dispatch={props.dispatch}
                  />
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
                      nodeDataArray={gojsobjects?.nodeDataArray}
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
  
  if (debug) clog('265 Palette', props);
  // return  isRendered && (
  return (
    <>
      {palette} 
      {/* {refreshPalette ? <> {palette} </> : <> {palette} </>} */}
      {/* <style jsx>{``}</style> */}
    </>
  )
}

export default Palette;
