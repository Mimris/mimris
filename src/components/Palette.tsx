// @ts-nocheck
import React, { useState , useEffect, useRef } from "react";
import { useDispatch } from 'react-redux';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
// import { setGojsModelObjects } from "../actions/actions";
import Selector from './utils/Selector'
import genRoleTasks from "./utils/SetRoleTaskFilter";
import { KnownTypeNamesRule } from "graphql";
// import { setMyMetisParameter } from "../actions/actions";

const debug = false;

const clog = console.log.bind(console, '%c %s',
    'background: blue; color: white');
const ctrace = console.trace.bind(console, '%c %s',
    'background: blue; color: white');

const Palette = (props: any) => {

  if (debug) clog('22 Palette', props);

  const dispatch = useDispatch();
  let isRendered = useRef(false);

  const [visiblePalette, setVisiblePalette] = useState(true)

  const [refreshPalette, setRefreshPalette] = useState(true)
  const [refresh, setRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState('1');
  const [filteredOtNodeDataArray, setFilteredOtNodeDataArray] = useState([])
  const [modellingtasks, setModellingtasks] = useState([{id: 'Modelling', name: 'Modelling'}])
  const [types, setTypes] = useState(['Container','Generic'])
  const [role, setRole] = useState('Modeller1')
  const [task, setTask] = useState(modellingtasks[0])
  const [tasks, setTasks] = useState(modellingtasks)

  if (debug) console.log('43 Palette', role, task, types, tasks, modellingtasks)

  let focusModel = props.phFocus?.focusModel
  const models = props.metis?.models
  const metamodels = props.metis?.metamodels
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const mmodel = metamodels?.find((m: any) => m?.id === model?.metamodelRef)
  if (debug) console.log('47', props, mmodel?.name, model?.metamodelRef);
  
  // hardcoded for now
  let focusTask = props.phFocus?.focusTask
  let seltasks = props.phFocus?.focusRole?.tasks || []
  if (debug) console.log('52 seltasks', props.phFocus.focusRole, props.phFocus.focusRole?.tasks, seltasks)
  
  function toggleRefresh() { setRefresh(!refresh); } 
  
  const toggleTab = (tab: React.SetStateAction<string>) => { 
    if (activeTab !== tab)  setActiveTab(tab); 
    // setOfilter('All')
    const timer = setTimeout(() => {
      toggleRefreshPalette() 
    }, 100);
    return () => clearTimeout(timer);
  }

  function togglePalette() { setVisiblePalette(!visiblePalette); } 
  function toggleRefreshPalette() { setRefreshPalette(!refreshPalette);}
  
  let ndarr = props.gojsMetamodel?.nodeDataArray // error first render???
  if (debug) console.log('65 Palette', model?.name, mmodel?.name, ndarr);
  let taskNodeDataArray: any[] = ndarr

  if (focusTask) {
    const taskNodeDataArray0 = props.phFocus.focusTask?.workOnTypes?.map((wot: any) => 
      ndarr?.find((i: { typename: any; }) => {
        return (i?.typename === wot) && i 
      })
    ).filter(Boolean)
    taskNodeDataArray = taskNodeDataArray0 || []
    if (debug) console.log('73 taskNodeDataArray',  taskNodeDataArray0)
  } 

  useEffect(() => {
    isRendered = true;
    const foundRTTs = findCurRoleTaskTypes(role, task, tasks, types, mmodel, dispatch)
    if (debug) clog('83 Palette useEffect', role, task, tasks, types, mmodel);
    if (debug) clog('84 Palette useEffect', foundRTTs, foundRTTs.role, foundRTTs.task, foundRTTs.tasks, foundRTTs.types);
    setRole(foundRTTs?.role)
    setTask(foundRTTs?.task)
    setModellingtasks(foundRTTs?.tasks)
    setTypes(foundRTTs?.types)
    if (debug) console.log('88 Palette useEffect', modellingtasks);
    return () => { isRendered = false; }
  }, [])

  useEffect(() => {
    let otsArr: any = []
    if (types?.length > 0 && ndarr?.length > 1) {
      otsArr = types?.map((wot: any) => // list of types for this focusTask (string)
      ndarr?.find((i: { typename: any; }) => {
        return (i?.typename === wot) && i 
      })
      ).filter(Boolean) // remove undefined

      if (!debug) console.log('106 taskNodeDataArray', types, ndarr, otsArr)
      setFilteredOtNodeDataArray(otsArr)
    } else {
      setFilteredOtNodeDataArray(ndarr)
    }
  }, [types])

  useEffect(() => {
    if (debug) console.log('111 palette ', filteredOtNodeDataArray, filteredOtNodeDataArray.length)
    //  setRefreshPalette(!refreshPalette) // set current palette accrording to selected modellingtask
      const timer = setTimeout(() => {
      if (debug) console.log('115 palette ', filteredOtNodeDataArray)
      setRefreshPalette(!refreshPalette)   // set current palette accrording to selected modellingtask
    }, 10);
    return () => clearTimeout(timer);
  }, [filteredOtNodeDataArray])

  const findCurRoleTaskTypes = (role, task, tasks, types, mmodel, dispatch) => {
    if (!debug) clog('121 Palette useEffect',role, task, types, mmodel, modellingtasks);
    const foundRTTs = genRoleTasks(role, task, types, mmodel, dispatch)
    if (!debug) clog('123 Palette useEffect', foundRTTs, foundRTTs.filterRole, foundRTTs.filterTask, foundRTTs.filterTasks, foundRTTs.filterTypes);
    setRefreshPalette(!refreshPalette) // set current palette accrording to selected modellingtask
    console.log('131  Palette findCurRoleTaskTypes ', types)  
    return {
      role: foundRTTs?.filterRole,
      task:  foundRTTs?.filterTask,
      tasks: foundRTTs?.filterTasks,
      types: foundRTTs?.filterTypes,
    }
  }

  if (debug) console.log('139 Palette useEffect 2', props.phFocus.focusTask.workOnTypes);

  // break if no model or metamodel
  if (!props.gojsModel) return null;
  if (!props.gojsMetamodel) return null;
  // let filteredOtNodeDataArray = ndarr
  if (debug) clog('144 Palette', props , seltasks);
  
  // add a div with a dropdown to select modellingtask (all, IRTV, Property) --------------------------------
  const otDiv = 
    <>
      <label className='label-field px-1'>Modelling tasks:</label>
      <select className='select-field mx-1 text-secondary w-100' onChange={(e) => setModellingTask(modellingtasks[e.target.value])}>
        {modellingtasks?.map((t, i) => <option key={i} value={i}>{t.name}</option>)}
      </select>
    </>

  function setModellingTask(task) {
    if (!debug) clog('156 Palette setModellingTask',task, types);
    const foundRTTs = findCurRoleTaskTypes(role, task, tasks, types, mmodel, dispatch)
    if (!debug) clog('158 Palette setModellingTask',   foundRTTs.task, foundRTTs.types);
    setRole(foundRTTs?.role)
    setTask(foundRTTs?.task)
    setModellingtasks(foundRTTs?.tasks)
    setTypes(foundRTTs?.types)
    if (!debug) clog('163 Palette setModellingTask',  task, types);
  }

  if (debug) console.log('165 filteredOtNodeDataArray', filteredOtNodeDataArray, ndarr)
  
  // ------------------   ------------------
  const mmnamediv = (mmodel) ? <span className="metamodel-name">{mmodel?.name}</span> : <span>No metamodel</span> 
  const mnamediv = (mmodel) ? <span className="metamodel-name">{model?.name}</span> : <span>No model</span> 
  seltasks = (props.phFocus.focusRole?.tasks) && props.phFocus.focusRole?.tasks?.map((t: any) => t)

  if (debug) console.log('172 Palette', props.phFocus?.focusRole,'tasks:', props.phFocus?.focusRole?.tasks, 'task: ', props.phFocus?.focusTask, 'seltasks :', seltasks);
 
  const gojsappPalette =   // this is the palette with tabs for Types and Objects Todo: add possibility to select many types or objects to drag in (and also with links)
    <div className="workpad p-1 pt-0 bg-white" >
      {/* <div className="mmtask mx-0 px-1 mb-1 " style={{fontSize: "16px", minWidth: "212px", maxWidth: "212px"}}>{selectTaskDiv}</div> */}
      < GoJSPaletteApp
        nodeDataArray={filteredOtNodeDataArray}
        linkDataArray={[]}
        metis={props.metis}
        myMetis={props.myMetis}
        myGoModel={props.myGoModel}
        phFocus={props.phFocus}
        dispatch={props.dispatch}
      />
    </div>

   const palette = // this is the left pane with the palette and toggle for refreshing
      <> 
        <button className="btn-sm pt-0 pr-1 b-0 mt-0 mb-0 mr-2" style={{ backgroundColor: "#7ab", outline: "0", borderStyle: "none"}}
          onClick={togglePalette}> {visiblePalette ? <span> &lt;- Palette Source Metam.</span> : <span> -&gt;</span>} 
        </button>
        <div className="mmname mx-0 px-1 my-0" style={{fontSize: "16px", backgroundColor: "#8bc", minWidth: "184px", maxWidth: "212px"}}>{mmnamediv}</div>
        <div className="modellingtask bg-light w-100" >
          {otDiv}
        </div>
        {/* <span>{props.focusMetamodel?.name}</span> */}
        <div>
        {/* <div style={{ minWidth: "140px" }}> */}
          {visiblePalette 
            ? (refreshPalette) 
              ? <>{ gojsappPalette }</> 
              : <><div className="btn-horizontal bg-light mx-0 px-1 mb-0" style={{fontSize: "11px", minWidth: "166px", maxWidth: "160px"}}></div>{ gojsappPalette }</>
            : <div className="btn-vertical px-1 " style={{ height: "92vh", maxWidth: "4px", padding: "2px", fontSize: "12px" }}><span> P a l e t t e - S o u r c e - M e t a m o d e l</span> </div>
          } 
        </div>
      </>  
  
  if (debug) clog('265 Palette', props);
  // return  isRendered && (
  return (
    <>
      {palette} 
    </>
  )
}

export default Palette;



    // useEffect(() => {
    //   // if (props.phFocus.focusTask.workOnTypes) {  // todo: this is when focusTask is implemented
    //   //   taskNodeDataArray = props.phFocus.focusTask?.workOnTypes?.map((wot: any) => // list of types for this focusTask (string)
    //   //     ndarr?.find((i: { typename: any; }) => {
    //   //       return (i?.typename === wot) && i 
    //   //     })
    //   //   ).filter(Boolean) // remove undefined
    //   // }
    //   isRendered = true;
    //   let types =[]
    //   if (isRendered) {
    //     if (debug) clog('106 Palette useEffect') //, mmodel, genRoleTasks(mmodel, dispatch));
    //     types = genRoleTasks(mmodel, dispatch)
    //     if (types?.length > 0) {
    //       taskNodeDataArray = types?.map((wot: any) => // list of types for this focusTask (string)
    //       ndarr?.find((i: { typename: any; }) => {
    //         return (i?.typename === wot) && i 
    //       })
    //       ).filter(Boolean) // remove undefined
    //     }
    //   }
    //   // const timer = setTimeout(() => {
    //   //   setRefresh(!refresh)
    //   // }, 5000);
    //   // return () => clearTimeout(timer);
    //   return () => { isRendered = false; }
    // }, [props.phFocus?.focusModel?.id])

    // console.log('183 setModellingTask', role, task, types)
  //   const foundRTTs = findCurRoleTaskTypes(role, task, tasks, types, mmodel, dispatch)
  //   if (debug) clog('187 Palette useEffect', foundRTTs, foundRTTs.role, foundRTTs.task, foundRTTs.tasks, foundRTTs.types);

  //   let otsArr: any = []
  //   if (foundRTTs?.types?.length > 0) {
  //     otsArr = foundRTTs?.types?.map((wot: any) => // list of types for this focusTask (string)
  //       ndarr?.find((i: { typename: any; }) => {
  //       // console.log('200 findCurRoleTaskTypes', i, wot)
  //       return (i?.typename === wot) && i 
  //     })
  //     ).filter(Boolean) // remove undefined
  //   }

  //   if (debug) console.log('199 taskNodeDataArray', foundRTTs?.types, otsArr)
  //   if (task?.id === 'Alltypes') {
  //     setFilteredOtNodeDataArray(ndarr) //sett current palette to all types
  //   } else {
  //     setFilteredOtNodeDataArray(otsArr)
  //   }
  //   setRefreshPalette(!refreshPalette) // set current palette accrording to selected modellingtask
  //   console.log('206 taskNodeDataArray', filteredOtNodeDataArray, otsArr)

  // let selectTaskDiv = (seltasks && mmodel.name === 'IRTV_MM') 
  // let selectTaskDiv = 
  //   <>
  //     <details><summary markdown="span"  >{focusTask?.name}</summary>
  //       <div className="seltask w-100">
  //         <Selector type='SET_FOCUS_TASK' selArray={seltasks} selName='Task' focusTask={focusTask} focustype='focusTask'  refresh={refresh} setRefresh={setRefresh} />
  //       </div>
  //       </details>
  //     {/* <div>{focusTask?.name}</div> */}
  //   </>


  // const modellingtasks = [
  //   {
  //     id: "IRTV-POPS-Modelling",
  //     name: "IRTV+POPS Modelling",
  //     workOnTypes: [
  //       "Container",
  //       "Information",
  //       "Role",
  //       "Task",
  //       "View",
  //       "Product",
  //       "Organisation",
  //       "Process",
  //       "System"
  //     ],
  //   },
  //   {
  //     id: "Process-Modelling",
  //     name: "Process Modelling",
  //     workOnTypes: [
  //       "Container",
  //       "Process",
  //       "Start",
  //       "End",
  //       "ExclusiveGate",
  //       "InclusiveGate",
  //       "ParallelGate",
  //     ],
  //   },
  //   {
  //     id: "PropertyModelling",
  //     name: "PropertyModelling",
  //     workOnTypes: [
  //       "Container",
  //       "EntityType",
  //       "Property",
  //       "Datatype",
  //       "InputPattern",
  //       "FieldType",
  //       "Unittype",
  //       "Value",
  //       "ViewFormat",
  //       "Method",
  //       "MethodType",
  //       "RelshipType"
  //     ],
  //   },
  //   // {
  //   //   id: "Alltypes",
  //   //   name: "Alltypes",
  //   //   workOnTypes:[
  //   //     "Container",
  //   //     "EntityType",
  //   //     "Information",
  //   //     "Role",
  //   //     "Task",
  //   //     "View",
  //   //     "CreateRepo\n",
  //   //     "Datatype",
  //   //     "Element",
  //   //     "FieldType",
  //   //     "Generic",
  //   //     "InputPattern",
  //   //     "Label",
  //   //     "Method",
  //   //     "MethodType",
  //   //     "Port",
  //   //     "Process",
  //   //     "Property",
  //   //     "RelshipType",
  //   //     "Value",
  //   //     "ViewFormat"
  //   //   ],
  //   // },
  //   {
  //     id: "Alltypes",
  //     name: "Alltypes",
  //     workOnTypes: [],
  //   },
  // ]  
  // console.log('229 modellingtypes', modellingtasks[0])

{/* 
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
          {/* <NavItem >
            <NavLink style={{ paddingTop: "0px", paddingBottom: "0px", paddingLeft: "1px", borderColor: "#eee gray white #eee", color: "black"}}
              className={classnames({ active: activeTab === '2' })}
              onClick={() => { toggleTab('2'); toggleRefresh() }}
            >
              Objects
            </NavLink>
          </NavItem> 
        </Nav>
        <TabContent activeTab={activeTab} >
          {/* TYPES this is the tab for Objecttypes 
          <TabPane tabId="1">
            <div className="workpad p-1 pt-2 bg-white" >
                <div className="mmname mx-0 px-1 mb-1" style={{fontSize: "16px", minWidth: "184px", maxWidth: "212px"}}>{mmnamediv}</div>
                <div className="mmtask mx-0 px-1 mb-1 " style={{fontSize: "16px", minWidth: "212px", maxWidth: "212px"}}>{selectTaskDiv}</div>
                {/* {selectedMMDiv} 
                < GoJSPaletteApp
                  nodeDataArray={filteredOtNodeDataArray}
                  linkDataArray={[]}
                  metis={props.metis}
                  myMetis={props.myMetis}
                  myGoModel={props.myGoModel}
                  phFocus={props.phFocus}
                  dispatch={props.dispatch}
                />
              </div>
          </TabPane>
          {/* OBJECTS  this is the tab for Object instances */}
          {/*}
          <TabPane tabId="2">
            <div className="workpad p-1 pt-2 bg-white">
              {selectedObjDiv}
              < GoJSPaletteApp
                nodeDataArray={gojsobjects?.nodeDataArray}
                linkDataArray={[]}
                metis={props.metis}
                myMetis={props.myMetis}
                myGoModel={props.myGoModel}
                phFocus={props.phFocus}
                dispatch={props.dispatch}
              />
            </div>
          </TabPane> 

        </TabContent>
      </>

      */}




  // ================================================================================================
  // // ================================================================================================
  // // Show all the objects in this model
  // // const gojsmodelObjects = props.gojsModelObjects

  // // Hack: if viewkind === 'Container' then set isGroup to true
  // let objArr = props.gojsModelObjects?.nodeDataArray
  // for (let i = 0; i < objArr?.length; i++) {
  //   if (objArr[i]?.viewkind === 'Container') {
  //     objArr[i].isGroup = true;
  //   }
  // }

  // // let objArr = props.myMetis.gojsModel?.model.objects

  // const nodeArray_all = objArr 
  // if (debug) console.log('120 nodeArray_all', nodeArray_all, objArr);
  // // filter out the objects that are marked as deleted
  // const objectsNotDeleted = nodeArray_all?.filter((node: { markedAsDeleted: boolean; }) => node && node.markedAsDeleted === false)
  
  // // // filter out all objects of type Property
  // const roleTaskObj = objectsNotDeleted?.filter((node: { typename: string; }) => node && (node.typename === 'Task' || node.typename === 'Role'))
  // const noPropertyObj = objectsNotDeleted?.filter((node: { typename: string; }) => node && (node.typename !== 'Property' && node.typename !== 'PropLink'))
  // const noAbstractObj = objectsNotDeleted?.filter((node: { typename: string; }) => node && (node.typename !== 'Abstract' && node.typename !== 'Property' && node.typename !== 'PropLink'))
  // if (debug) console.log('185 Palette noPropertyObj', noPropertyObj, noAbstractObj);

  // const handleSetObjFilter = (filter: React.SetStateAction<string>) => {
  //   if (debug) console.log('Palette handleSetOfilter', filter);
  //   setOfilter(filter)
  //   // gojstypes =  {nodeDataArray: filteredArr, linkDataArray: ldarr}
  //   toggleRefreshPalette()
  // }
  
  // {/* <div style={{transform: "scale(0.9)" }}> */}
  // const selectedObjDiv = (
  //   <div >
  //     { <button className= "btn bg-light btn-sm " onClick={() => { handleSetObjFilter('Tasks') }}>Task</button>}
  //     { <button className= "btn bg-light btn-sm " onClick={() => { handleSetObjFilter('!Property') }}>!PROP</button>}
  //     { <button className= "btn bg-light btn-sm " onClick={() => { handleSetObjFilter('!Abstract') }}>!ABS</button>}
  //     { <button className= "btn bg-light btn-sm " onClick={() => { handleSetObjFilter('All') }}>ALL</button> }
  //   </div>
  // )

  // // // filter out all objects of type Property
  // let ofilteredArr = objectsNotDeleted
  // if (ofilter === 'Tasks') ofilteredArr = roleTaskObj
  // if (ofilter === '!Property') ofilteredArr = noPropertyObj
  // if (ofilter === '!Abstract') ofilteredArr = noAbstractObj
  // if (ofilter === 'All') ofilteredArr = objectsNotDeleted

  // // const oNodeDataArray = nodeArray_all
  // // const oNodeDataArray = ofilteredArr
  // let gojsobjects =  {nodeDataArray: ofilteredArr, linkDataArray: []}
  
  // if (debug) console.log('165 Palette gojsobjects', filteredOtNodeDataArray, gojsobjects.nodeDataArray);
