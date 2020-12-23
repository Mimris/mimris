// @ts-nocheck
// Diagram.tsx
const debug = false;

// import React from "react";
import { useState, useEffect, useLayoutEffect } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import Page from './page';

import ObjectTable from './table/ObjectTable'
import RelshipTable from './table/RelshipTable'
import LoadServer from '../components/LoadServer'
import LoadLocal from '../components/LoadLocal'
import EditFocusModal from '../components/EditFocusModal'
import EditFocusMetamodel from '../components/EditFocusMetamodel'
// import {loadDiagram} from './akmm/diagram/loadDiagram'

const page = (props:any) => {
 
  // if (debug) console.log('17 Modelling', props);
  const dispatch = useDispatch();
  const [refresh, setRefresh] = useState(false);
  function toggleRefresh() { setRefresh(!refresh); }
  
  /**  * Get the state from the store  */
  // const state = useSelector((state: any) => state) // Selecting the whole redux store
  let focusModel = useSelector(focusModel => props.phFocus?.focusModel) 
  let focusModelview = useSelector(focusModelview => props.phFocus?.focusModelview) 
  const focusObjectview = useSelector(focusObjectview => props.phFocus?.focusObjectview) 
  const focusRelshipview = useSelector(focusRelshipview => props.phFocus?.focusRelshipview) 
  const focusObjecttype = useSelector(focusObjecttype => props.phFocus?.focusObjecttype) 
  const focusRelshiptype = useSelector(focusRelshiptype => props.phFocus?.focusRelshiptype) 
  // if (debug) console.log('37 Modelling', props.phFocus, focusRelshiptype?.name);

  let gojsmetamodelpalette =  props.phGojs?.gojsMetamodelPalette 
  let gojsmetamodelmodel =  props.phGojs?.gojsMetamodelModel 
  let gojsmodelobjects = props.phGojs?.gojsModelObjects || []
  let gojstargetmetamodel = props.phGojs?.gojsTargetMetamodel || [] // this is the generated target metamodel
  let gojsmodel =  props.phGojs?.gojsModel 
  let gojstargetmodel =  props.phGojs?.gojsTargetModel 
  let gojsmetamodel =  props.phGojs?.gojsMetamodel 

  if (debug) console.log('49 Modelling', gojsmodel, gojsmodelobjects, props);
  
  let metis = props.phData?.metis
  let myMetis = props.phMymetis?.myMetis
  let myGoModel = props.phMyGoModel?.myGoModel
  let myGoMetamodel = props.phMyGoMetamodel?.myGoMetamodel
  //let myGoMetamodel = props.phGojs?.gojsMetamodel
  let phFocus = props.phFocus;
  let phData = props.phData

  // if (debug) console.log('54 Modelling', props.phGojs, gojsmodelobjects);


    // useEffect(() => {
    //   console.log('80 Modelling useEffect 3', props); 
    //   genGojsModel(props, dispatch)
    //   setRefresh(!refresh)
    // }, [props.phSource])


    
    const [activeTab, setActiveTab] = useState('1');
    const toggleTab = tab => { if (activeTab !== tab) setActiveTab(tab); }
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const toggleTip = () => setTooltipOpen(!tooltipOpen);
    
    const [visibleTasks, setVisibleTasks] = useState(true)
    function toggleTasks() {
      setVisibleTasks(!visibleTasks);
    }

  const tabletabs = (
    <>
      <Nav tabs >
        <NavItem>
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" }}
            className={classnames({ active: activeTab === '1' })}
            onClick={() => { toggleTab('1') }}
          >
            {(activeTab === "1") ? 'Objects' : 'Objects'}
          </NavLink>
        </NavItem>
        <NavItem >
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" }}
            className={classnames({ active: activeTab === '2' })}
            onClick={() => { toggleTab('2')}}
          >
            {(activeTab === "2") ? 'Relationships' : 'Relationships'}
          </NavLink>
        </NavItem>
      </Nav>
      <TabContent  activeTab={activeTab} >  
        {/* Objects */}
        <TabPane  tabId="1">
          <div className="workpad p-1 pt-2 bg-white" >
            <Row >
              <Col style={{ paddingLeft: "1px", marginLeft: "1px" }}>
                <div className="myModeller mb-1 pl-1 pr-1" style={{ backgroundColor: "#ddd", width: "100%", height: "101%", border: "solid 1px black" }}>
                   <ObjectTable ph={props} />  
                </div>
              </Col>
            </Row>
          </div>         
        </TabPane>
        {/* Relships */}
        <TabPane tabId="2">
          <div className="workpad p-1 pt-2 bg-white">
           <Row >
              <Col style={{ paddingLeft: "1px", marginLeft: "1px" }}>
                <div className="myModeller mb-1 pl-1 pr-1" style={{ backgroundColor: "#ddd", width: "100%", height: "101%", border: "solid 1px black" }}>
                   <RelshipTable ph={props} />  
                </div>
              </Col>
            </Row>
          </div>         
        </TabPane>
      </TabContent>
    </>
  )      

  // const loadserver = <LoadServer buttonLabel='Server' className='ContextModal' ph={props} phFocus={phFocus}  phData={phData} refresh={refresh} setRefresh={setRefresh}/> 
  // const loadlocal =  (process.browser) && <LoadLocal buttonLabel='Local' className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh}/> 

  const modelType = (activeTab === '1') ? 'objects' : 'relationships'
  // const EditFocusModalMDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModal buttonLabel='Mod' className='ContextModal' modelType={'modelview'} ph={props} refresh={refresh} setRefresh={setRefresh} />
  // const EditFocusModalDiv = <EditFocusModal buttonLabel='Edit' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
  const EditFocusModalODiv = (focusObjectview?.name || focusObjecttype?.name ) && <EditFocusModal buttonLabel='Obj' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
  // const EditFocusModalRDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModal buttonLabel='Rel' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
    // : (focusObjectview.name) && <EditFocusMetamodel buttonLabel='Edit' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
  // if (debug) console.log('177 Modelling', EditFocusModalDiv);
  
  return (
    <>
      <div className="diagramtabs" style={{  backgroundColor: "#ddd", minWidth: "200px" }}>
        <span id="lighten" className="btn-link btn-sm" style={{ float: "right" }} onClick={toggleRefresh}>{refresh ? 'refresh' : 'refresh'} </span>
        <div style={{ transform: "scale(0.9)"}}>
          <span className="sourceName pr-1 float-right mr-0 mt-1" 
            style={{ backgroundColor: "#fff", color: "#b00", transform: "scale(0.9)",  fontWeight: "bolder"}}>
              Current source: {props.phSource}
          </span> 
          {/* <span className="loadmodel float-right" style={{ padding: "1px", backgroundColor: "#ccc", transform: "scale(0.7)",  fontWeight: "bolder"}}>
            {loadserver} {loadlocal}  
          </span>  */}
          <span className="editfocus float-right" style={{ padding: "1px", backgroundColor: "#ccc", transform: "scale(0.7)",  fontWeight: "bolder"}}>
            {/* {EditFocusModalRDiv}  */}
            {EditFocusModalODiv}
            {/* {EditFocusModalMDiv} */}
          </span>
        </div> 
        {/* <div className="modellingContent pt-1" > */}
        <div className="modellingContent pt-1 pr-2"  >
          {/* {modellingtabs} */}
          {refresh ? <> {tabletabs} </> : <>{tabletabs}</>}
        </div>
        <style jsx>{`

        `}</style>
      </div>
    </>
  )
} 
export default Page(connect(state => state)(page));
