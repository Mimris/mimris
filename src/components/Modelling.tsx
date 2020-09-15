// @ts-nocheck
// Diagram.tsx

// import React from "react";
import { useState, useEffect, useLayoutEffect } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import Page from './page';
import Palette from "./Palette";
import Modeller from "./Modeller";
import TargetMeta from "./TargetMeta";
import genGojsModel from './GenGojsModel'
import LoadServer from '../components/LoadServer'
import LoadLocal from '../components/LoadLocal'
import useLocalStorage  from '../hooks/use-local-storage'
import EditFocusModel from '../components/EditFocusModel'
import EditFocusMetamodel from '../components/EditFocusMetamodel'
// import {loadDiagram} from './akmm/diagram/loadDiagram'

const page = (props:any) => {

  console.log('17 Modelling', props);
  const dispatch = useDispatch();
  const [refresh, setRefresh] = useState(true);
  // const refresh = props.refresh
  // const setRefresh = props.setRefresh
  const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', null); //props);
  if (!memoryLocState) {setMemoryLocState(props)}
  
  /**  * Get the state from the store  */
  // const state = useSelector((state: any) => state) // Selecting the whole redux store
  let focusModel = useSelector(focusModel => props.phFocus?.focusModel) 
  let focusModelview = useSelector(focusModelview => props.phFocus?.focusModelview) 
  const focusObjectview = useSelector(focusObjectview => props.phFocus?.focusObjectview) 
  const focusRelshipview = useSelector(focusRelshipview => props.phFocus?.focusRelshipview) 
  const focusObjecttype = useSelector(focusObjecttype => props.phFocus?.focusObjecttype) 
  const focusRelshiptype = useSelector(focusRelshiptype => props.phFocus?.focusRelshiptype) 
  // console.log('37 Modelling', props.phFocus, focusRelshiptype?.name);

  let gojsmetamodelpalette =  props.phGojs?.gojsMetamodelPalette 
  let gojsmetamodelmodel =  props.phGojs?.gojsMetamodelModel 
  // let gojstargetmetamodelpalette = props.phGojs?.gojsTargetMetamodelPalette // this is the generated target metamodel
  let gojstargetmetamodel = props.phGojs?.gojsTargetMetamodel 
  let gojsmodel =  props.phGojs?.gojsModel 
  let gojsmetamodel =  props.phGojs?.gojsMetamodel 
  let metis = props.phData?.metis
  let myMetis = props.phMymetis?.myMetis
  let myGoModel = props.phMyGoModel?.myGoModel
  let myGoMetamodel = props.phMyGoMetamodel?.myGoMetamodel
  let phFocus = props.phFocus;
  let phData = props.phData

  console.log('54 Modelling', props.phGojs, gojstargetmetamodel);
  
    useEffect(() => {
      // console.log('38 Diagram state', props ); 
      setRefresh(!refresh)
      genGojsModel(props, dispatch);
      focusModel = props.phFocus?.focusModel
    }, [focusModel?.id])

    useEffect(() => {
      // console.log('38 Diagram state', props ); 
      //setRefresh(!refresh)
      genGojsModel(props, dispatch);
      //focusModel = props.phFocus?.focusModel
    }, [])

    useEffect(() => {
      // console.log('38 Diagram state', props ); 
      // setRefresh(!refresh)
      genGojsModel(props, dispatch);
      gojsmodel = props.phFocus?.focusModel
    }, [props.phFocus?.focusModel, props.phFocus?.focusMetamodel])
    
    useEffect(() => {
      // console.log('42 Diagram state', props ); 
      setRefresh(!refresh)
      genGojsModel(props, dispatch);
      focusModel = props.phFocus?.focusModel
    }, [focusModelview?.id])

    useEffect(() => {
      console.log('76 Modelling', props ); 
      genGojsModel(props, dispatch)
      setRefresh(!refresh)
    }, [props.phSource])

  function toggleRefresh() {
    // first find current model which is in reduxStore
    let reduxmod = props.phData?.metis?.models?.find(m => m.id === focusModel?.id) // current model index
    let curmindex = memoryLocState?.phData?.metis?.models?.findIndex(m => m?.id === reduxmod?.id) // current model index
    // find lenght of modellarray in lodalStore
    const curmlength = memoryLocState?.phData?.metis.models?.length
    if (curmindex < 0) { curmindex = curmlength } // rvindex = -1, i.e.  not fond, which means adding a new model
    // then find metamodel which is in reduxStore
    let reduxmmod = props.phData?.metis?.metamodels?.find(mm => mm.id === reduxmod?.metamodelRef) // current model index
    let curmmindex = memoryLocState?.phData?.metis?.models?.findIndex(mm => mm?.id === reduxmod?.id) // current model index
    // then find lenght of modellarray in lodalStore
    const curmmlength = memoryLocState?.phData?.metis.metamodels?.length
    if (curmmindex < 0) { curmmindex = curmmlength } // rvindex = -1, i.e.  not fond, which means adding a new model
    console.log('73 Modelling', curmindex, reduxmod);
    const data = {
      phData: {
        ...memoryLocState?.phData,
        metis: {
          ...memoryLocState?.phData?.metis,
          models: [
            ...memoryLocState?.phData?.metis.models.slice(0, curmindex),
            reduxmod,
            ...memoryLocState?.phData?.metis.models.slice(curmindex + 1),
          ],
          metamodels: [
            ...memoryLocState?.phData?.metis.models.slice(0, curmmindex),
            reduxmmod,
            ...memoryLocState?.phData?.metis.models.slice(curmmindex + 1),
          ]
        },
      },
      phFocus: props.phFocus,
      phUser: props.phUser,
      phSource: 'localStore'
    };
    console.log('59 Modelling', reduxmod, data);
    (reduxmod) && setMemoryLocState(data) 
    setRefresh(!refresh);
  }
    
    const [activeTab, setActiveTab] = useState('2');
    const toggleTab = tab => { if (activeTab !== tab) setActiveTab(tab); }
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const toggleTip = () => setTooltipOpen(!tooltipOpen);
    
    const [visibleTasks, setVisibleTasks] = useState(true)
    function toggleTasks() {
      setVisibleTasks(!visibleTasks);
    }

  const modellingtabs = (<>
      <Nav tabs >
        <NavItem >
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" }}
            className={classnames({ active: activeTab === '1' })}
            onClick={() => { toggleTab('1'); toggleRefresh() }}
          >
            Metamodelling
          </NavLink>
        </NavItem>
        <NavItem >
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" }}
            className={classnames({ active: activeTab === '2' })}
            onClick={() => { toggleTab('2'); toggleRefresh() }}
          >
            Modelling
          </NavLink>
        </NavItem>
      </Nav>
      {/* Metamodelling */}
      <TabContent  activeTab={activeTab} >  
        <TabPane  tabId="1">
          <div className="workpad p-1 pt-2 bg-white" >
            <Row >
              <Col xs="auto ml-3 mr-0 pr-0 pl-0">
                <div className="myPalette pl-1 mb-1 pt-2 text-white" style={{ maxWidth: "150px", minHeight: "8vh", height: "100%", marginRight: "2px", backgroundColor: "#999", border: "solid 1px black" }}>
                  {/* <div className="myPalette pl-1 text-white bg-secondary" id="lighten" style={{ maxWidth: "100px", minHeight: "10vh", height: "100%", marginRight: "2px", backgroundColor: "whitesmoke", border: "solid 1px black" }}> */}
                  <Palette
                    gojsModel={gojsmetamodelmodel}
                    gojsMetamodel={gojsmetamodelpalette}
                    myMetis={myMetis}
                    myGoModel={myGoModel}
                    myGoMetamodel={myGoMetamodel}
                    metis={metis}
                    phFocus={phFocus}
                    dispatch={dispatch}
                    modelType='metamodel'
                    />
                </div>
              </Col>
              <Col style={{ paddingLeft: "1px", marginLeft: "1px" }}>
              <div className="myModeller mb-1 pl-1 pr-1" style={{ backgroundColor: "#ddd", width: "100%", height: "100%", border: "solid 1px black" }}>
              {/* <div className="myModeller m-0 pl-1 pr-1" style={{ width: "100%", height: "100%", border: "solid 1px black" }}> */}
                  <Modeller
                    gojsModel={gojsmetamodelmodel}
                    gojsMetamodel={gojsmetamodelpalette}z
                    myMetis={myMetis}
                    myGoModel={myGoModel}
                    myGoMetamodel={myGoMetamodel}
                    metis={metis}
                    phFocus={phFocus}
                    dispatch={dispatch}
                    modelType='metamodel'
                  />
                </div>
              </Col>
            </Row>
          </div>         
        </TabPane>
        {/* Modelling */}
        <TabPane tabId="2">
          <div className="workpad p-1 pt-2 bg-white">
            <Row >
            <Col xs="auto m-0 p-0 pl-3">
              {/* <div className="myPalette pl-1 pr-1 text-white bg-secondary" id="lighten" style={{ maxWidth: "100px", height: "100%", marginRight: "2px", backgroundColor: "whitesmoke", border: "solid 1px black" }}> */}
              <div className="myPalette pl-1 mb-1 pt-2 text-white" style={{ maxWidth: "150px", minHeight: "8vh", height: "100%", marginRight: "2px", backgroundColor: "#999", border: "solid 1px black" }}>
              {/* <div className="myPalette pl-1 pr-1 text-white bg-secondary" id="lighten" style={{ maxWidth: "170px", minHeight: "10vh", height: "100%", marginRight: "2px", border: "solid 1px black" }}> */}
                <Palette
                  gojsModel={gojsmodel}
                  gojsMetamodel={gojsmetamodel}
                  myMetis={myMetis}
                  myGoModel={myGoModel}
                  myGoMetamodel={myGoMetamodel}
                  metis={metis}
                  phFocus={phFocus}
                  dispatch={dispatch}
                  modelType='model'
                />
                {/* <div className="instances"> area for all instance or result of query 
                {instances}
                 </div> */}
              </div>
              </Col>
            <Col style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}>
                <div className="myModeller mb-1 pl-1 pr-1" style={{ backgroundColor: "#ddd", width: "100%", height: "100%", border: "solid 1px black" }}>
                {/* <div className="myModeller m-0 pl-1 pr-1" style={{ width: "100%", height: "100%", border: "solid 1px black" }}> */}
                  <Modeller
                    gojsModel={gojsmodel}
                    gojsMetamodel={gojsmetamodel}
                    myMetis={myMetis}
                    myGoModel={myGoModel}
                    myGoMetamodel={myGoMetamodel}
                    metis={metis}
                    phFocus={phFocus}
                    dispatch={dispatch}
                    modelType='model'
                  />
                </div>
              </Col>
              <Col xs="auto m-0 p-0 pr-0">
                <div className="myTargetMeta pl-0 mb-1 pt-2 text-white float-right" style={{ maxWidth: "150px", minHeight: "8vh", height: "100%", marginRight: "4px", backgroundColor: "#9a9", border: "solid 1px black" }}>
                  <TargetMeta
                    gojsModel={gojsmodel}
                    gojsMetamodel={gojsmetamodel}
                    gojsTargetMetamodel={gojstargetmetamodel}
                    myMetis={myMetis}
                    myGoModel={myGoModel}
                    myGoMetamodel={myGoMetamodel}
                    metis={metis}
                    phFocus={phFocus}
                    dispatch={dispatch}
                    modelType='model'
                  />
                </div>
              </Col>
            </Row>
          </div>         
        </TabPane>
      </TabContent>
    </>
    )      

  // console.log('173 Modelling', activeTab);
  const loadserver = <LoadServer buttonLabel='Server' className='ContextModal' ph={props} phFocus={phFocus}  phData={phData} refresh={refresh} setRefresh={setRefresh}/> 
  const loadlocal =  (process.browser) && <LoadLocal buttonLabel='Local' className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh}/> 

  
  const modelType = (activeTab === '1') ? 'metamodel' : 'model'
  const EditFocusModelMDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModel buttonLabel='M' className='ContextModal' modelType={'modelview'} ph={props} refresh={refresh} setRefresh={setRefresh} />
  // const EditFocusModelDiv = <EditFocusModel buttonLabel='Edit' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
  const EditFocusModelODiv = (focusObjectview?.name || focusObjecttype?.name ) && <EditFocusModel buttonLabel='O' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
  const EditFocusModelRDiv = (focusRelshipview?.name || focusRelshiptype?.name) && <EditFocusModel buttonLabel='R' className='ContextModal' modelType={modelType} ph={props} refresh={refresh} setRefresh={setRefresh} />
    // : (focusObjectview.name) && <EditFocusMetamodel buttonLabel='Edit' className='ContextModal' ph={props} refresh={refresh} setRefresh={setRefresh} />
  // console.log('177 Modelling', EditFocusModelDiv);
  
  return (
    <>
      <span id="lighten" className="btn-link btn-sm" style={{ float: "right" }} onClick={toggleRefresh}>{refresh ? 'refresh' : 'refresh'} </span>
      <div className="diagramtabs" >
        <span className="sourceName pr-2 float-right mr-0 mt-1" 
          style={{ backgroundColor: "#fff", color: "#b00", transform: "scale(0.9)",  fontWeight: "bolder"}}>
            Current source: {props.phSource}
        </span> 
          <span className="sourceName float-right" style={{ padding: "2px", backgroundColor: "#000", transform: "scale(0.7)",  fontWeight: "bolder"}}>
            {loadserver} {loadlocal}  
          </span> 
          <span className="sourceName float-right" style={{ padding: "2px", backgroundColor: "#fcc", transform: "scale(0.7)",  fontWeight: "bolder"}}>
          {EditFocusModelRDiv} {EditFocusModelODiv}{EditFocusModelMDiv}
          </span> 
        <div className="modellingContent pt-1" style={{  minWidth: "200px" }} >
          {/* {modellingtabs} */}
          {refresh ? <> {modellingtabs} </> : <>{modellingtabs}</>}
        </div>
        <style jsx>{`

        `}</style>
      </div>
    </>
  )
} 
export default Page(connect(state => state)(page));
