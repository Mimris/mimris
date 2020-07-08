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
import genGojsModel from './GenGojsModel'
import LoadServer from '../components/LoadServer'
import LoadLocal from '../components/LoadLocal'
import {getLocalStorage} from './GetSetLocalStorage'
// import {loadDiagram} from './akmm/diagram/loadDiagram'

const page = (props:any) => {

  // console.log('17 Modelling', props);
  const dispatch = useDispatch();
  const [refresh, setRefresh] = useState(true);
  function toggleRefresh() { setRefresh(!refresh); }
  
  /**  * Get the state from the store  */
  // const state = useSelector((state: any) => state) // Selecting the whole redux store
  const focusModel = useSelector(focusModel => props.phFocus?.focusModel) 
  const focusModelview = useSelector(focusModelview => props.phFocus?.focusModelview) 
  
  let gojsmetamodelpalette =  props.phGojs?.gojsMetamodelPalette 
  let gojsmetamodelmodel =  props.phGojs?.gojsMetamodelModel 
  let gojsmodel =  props.phGojs?.gojsModel 
  let gojsmetamodel =  props.phGojs?.gojsMetamodel 
  let metis = props.phData?.metis
  let myMetis = props.phMymetis?.myMetis
  let myGoModel = props.phMyGoModel?.myGoModel
  let myGoMetamodel = props.phMyGoMetamodel?.myGoMetamodel
  let phFocus = props.phFocus;
  let phData = props.phData

    
    useEffect(() => {
      // console.log('38 Diagram state', props ); 
      genGojsModel(props, dispatch);
    }, [focusModel.id])
    
    useEffect(() => {
      // console.log('42 Diagram state', props ); 
      genGojsModel(props, dispatch);
    }, [focusModelview.id])

    useEffect(() => {
      console.log('42 Diagram state', props ); 
      genGojsModel(props, dispatch);
    }, [metis])
    
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
                />
                {/* <div className="instances"> area for all instance or result of query 
                {instances}
                 </div> */}
              </div>
              </Col>
              <Col style={{ paddingLeft: "1px", marginLeft: "1px"}}>
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
                  />
                </div>
              </Col>
            </Row>
          </div>         
        </TabPane>
      </TabContent>
    </>
    )      
  const loadserver = <LoadServer buttonLabel='Server' className='ContextModal' phFocus={phFocus}  phData={phData} refresh={refresh} setRefresh={setRefresh}/> 
  const loadlocal =  (process.browser) && <LoadLocal buttonLabel='Local' className='ContextModal' ph={props} refresh={refresh} setRefresh = {setRefresh}/> 

  return (
    <>
      <span id="lighten" className="btn-link btn-sm" style={{ float: "right" }} onClick={toggleRefresh}>{refresh ? 'refresh' : 'refresh'} </span>
      <div className="diagramtabs" >
        <span className="sourceName pr-2 float-right mr-0 mt-1" 
          style={{ backgroundColor: "#fff", color: "#b00", transform: "scale(0.9)",  fontWeight: "bolder"}}>
            Current source: {props.phSource}
        </span> 
          <span className="sourceName float-right" 
            style={{ backgroundColor: "#fff", color: "#b00", transform: "scale(0.7)",  fontWeight: "bolder"}}>
            {loadserver}  {loadlocal}
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
