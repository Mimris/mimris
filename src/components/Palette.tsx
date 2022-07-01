// @ts-nocheck
import React, { useState , useEffect } from "react";
import { useDispatch } from 'react-redux';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
// import { setGojsModelObjects } from "../actions/actions";
import Selector from './utils/Selector'

const debug = false;

const Palette = (props: any) => {
  const dispatch = useDispatch();
  // break if no model
  if (!props.gojsModel) return null;
  if (!props.gojsMetamodel) return null;
  if (debug) console.log('13 Palette ',  props );


  let focusModel = props.phFocus?.focusModel
  const models = props.metis?.models
  const metamodels = props.metis?.metamodels
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const mmodel = metamodels?.find((m: any) => m?.id === model?.metamodelRef)
  if (debug) console.log('16', props, mmodel?.name, model?.metamodelRef);
  let focusTask = props.phFocus?.focusTask
  const focusRole = props.phFocus?.focusRole
  


  // const unsorted = props.gojsMetamodel?.nodeDataArray
  
  //rearrange sequence
  let ndarr = props.gojsMetamodel?.nodeDataArray
  let filteredArr = ndarr.filter((n: any) => n)
  let ldarr = props.gojsMetamodel?.linkDataArray
  let seltasks = focusRole?.tasks?.map((t: any) => t)
  if (debug) console.log('25 propsMetamodel', model?.name, mmodel?.name, ndarr);
  
  const hasIrtv = ndarr?.find((i: { typename: string; }) => i?.typename === 'Role')
  const hasOsdu = ndarr?.find((i: { typename: string; }) => i?.typename === 'JsonObject')

  // const [otfilter, setOtfilter] = useState('All')
  const [ofilter, setOfilter] = useState('All')
  const [refreshPalette, setRefreshPalette] = useState(true)
  // const [gojstypes, setGojstypes] = useState(ndarr)
  // let gojstypes = ndarr

  
  
  function toggleRefreshPalette() { setRefreshPalette(!refreshPalette); }
  
  // let taskNodeDataArray: any[] = ndarr 
  let taskNodeDataArray: any[] = (props.phFocus.focusTask?.workOnTypes) 
    ? props.phFocus.focusTask?.workOnTypes?.map((wot: any) => 
        ndarr?.find((i: { typename: any; }) => {
          return (i?.typename === wot) && i 
        })
      )
    : ndarr

 console.log('49 ', taskNodeDataArray);    

  // useEffect(() => {
  //   (taskNodeDataArray) ? setGojstypes(taskNodeDataArray) : setGojstypes(ndarr)

  //   function refres() {      
  //     // console.log('57 useEffect', gojstypes, ndarr);    
  //     toggleRefreshPalette()
  //     // console.log('59 useEffect', gojstypes);
  //   }
  //   setTimeout(refres, 1000);

  // }, [!gojstypes])

  // const handleSetFilter = (filter: React.SetStateAction<string>) => {
  //   // if (debug) console.log('148 Palette handleSetFilter', filter, focusTask.workOnTypes[1]);
  //   setOtfilter(filter)
  //   gojstypes =  {nodeDataArray: filteredArr, linkDataArray: ldarr}
  //   toggleRefreshPalette()
  // }


  // -----------------------------------------------------
  useEffect(() => {
    console.log('89 useEffect', focusTask);
    taskNodeDataArray = focusTask?.workOnTypes?.map((wot: any) => 
      ndarr?.find((i: { typename: any; }) => {
        return (i?.typename === wot) && i 
      })
    )
    // console.log('100 useEffect', taskNodeDataArray);
    // function refres() {        
    //   toggleRefreshPalette() 
    // }
    // setTimeout(refres, 1000);
    // filteredOtNodeDataArray = taskNodeDataArray?.filter(i => i)
    // seltasks = focusRole?.tasks?.map((t: any) => t)
    // focusTask = focusRole?.tasks?.find((t: { id: any; }) => t?.id === focusTask?.id)

    console.log('100 useEffect', taskNodeDataArray);
    function refres() {        
      toggleRefreshPalette() 
    }
    setTimeout(refres, 1000);
  }, [props.phFocus.focusTask])

  console.log('111 ', taskNodeDataArray);


 
  let filteredOtNodeDataArray = (!taskNodeDataArray) ? ndarr : (!taskNodeDataArray[0]) ? ndarr :taskNodeDataArray    


  // const filteredOtNodeDataArray = (gojstypes === null) ? ndarr : (!taskNodeDataArray) ? ndarr : gojstypes    

  // if (gojstypes) console.log('99 Palette filteredArr', ndarr,  gojstypes, taskNodeDataArray, filteredOtNodeDataArray);

  // set nodeDataArray = fileredArr and linkDataArray = ldarr
  // ================================================================================================


  

  
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
  const toggleTab = (tab: React.SetStateAction<string>) => { if (activeTab !== tab) setActiveTab(tab); }
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const toggleTip = () => setTooltipOpen(!tooltipOpen);

  const mmnamediv = (mmodel) ? <span className="metamodel-name">{mmodel?.name}</span> : <span>No metamodel</span> 
  const mnamediv = (mmodel) ? <span className="metamodel-name">{model?.name}</span> : <span>No model</span> 

  if (debug) console.log('54 Palette', props.phFocus?.focusRole, 'task: ', props.phFocus?.focusTask, 'seltasks :', seltasks);

  let selectTaskDiv = (seltasks)
    ?
      <div className="seltask w-100">
        <Selector type='SET_FOCUS_TASK' selArray={seltasks} selName='Select Task' focusTask={focusTask} focustype='focusTask'  refresh={refresh} setRefresh={setRefresh} />
        <div>{focusTask.name}</div>
      </div>

    :
      <div className="seltask w-100"></div>

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
  

  return (
    <>
      {palette} 
      {/* {refreshPalette ? <> {palette} </> : <> {palette} </>} */}
      {/* <style jsx>{``}</style> */}
    </>
  )
}

export default Palette;
