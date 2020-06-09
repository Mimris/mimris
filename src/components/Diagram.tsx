// @ts-nocheck
// Diagram.tsx

// import React from "react";
import React, { useState, useEffect, useLayoutEffect } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import Page from './page';
import Palette from "./Palette";
import Modeller from "./Modeller";
import genGojsModel from './GenGojsModel'
// import {loadDiagram} from './akmm/diagram/loadDiagram'

const page = (props:any) => {

  // console.log('17 Diagram', props);
  const dispatch = useDispatch()
  
  /**  * Get the state from the store  */
  const state = useSelector((state: any) => state) // Selecting the whole redux store
  const focusModel = useSelector(focusModel => state.phFocus?.focusModel) 
  const focusModelview = useSelector(focusModelview => state.phFocus?.focusModelview) 

  
  let gojsmetamodelpalette =  state.phGojs.gojsMetamodelPalette 
  let gojsmetamodelmodel =  state.phGojs.gojsMetamodelModel 
  let gojsmodel =  state.phGojs.gojsModel 
  let gojsmetamodel =  state.phGojs.gojsMetamodel 
  let metis = state.phData?.metis
  let myMetis = state.phMymetis?.myMetis
  let myGoModel = state.phMyGoModel?.myGoModel
  let phFocus = state.phFocus;

  // console.log('25 Diagram props state : ', props.phGojs, state.phGojs);
  // console.log('42 Diagram', gojsmodel ); 
  
  // useEffect(() => {
    //     // genGojsModel(state, dispatch);
    //   gojsmodel = useSelector(gojsmodel => state.phFocus?.gojsModel) 
    // }, [focusModelview.id])
    
    // useEffect(() => {
    //   genGojsModel(state, dispatch);
    // }, [])
    
    useEffect(() => {
      // console.log('38 Diagram state', state ); 
      genGojsModel(state, dispatch);
    }, [focusModel.id])
    
    useEffect(() => {
      // console.log('42 Diagram state', state ); 
      genGojsModel(state, dispatch);
    }, [focusModelview.id])
    
    
    
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
            onClick={() => { toggleTab('1'); }}
          >
            Metamodelling
          </NavLink>
        </NavItem>
        <NavItem >
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" }}
            className={classnames({ active: activeTab === '2' })}
            onClick={() => { toggleTab('2'); }}
          >
            Modelling
          </NavLink>
        </NavItem>
      </Nav>
      {/* Metamodelling */}
      <TabContent  activeTab={activeTab} >  
        <TabPane  tabId="1">
          <div className="workpad p-1 pt-2 bg-white" >
            <Row style={{ paddingTop: "4px", paddingBottom: "0px" }}>
              <Col xs="auto ml-3 mr-0 pr-0 pl-0">
                <div className="myPalette pl-1 text-white bg-secondary" id="lighten" style={{ maxWidth: "150px", height: "100%", marginRight: "2px", backgroundColor: "whitesmoke", border: "solid 1px black" }}>
                  {/* <div className="myPalette pl-1 text-white bg-secondary" id="lighten" style={{ maxWidth: "100px", minHeight: "10vh", height: "100%", marginRight: "2px", backgroundColor: "whitesmoke", border: "solid 1px black" }}> */}
                  <Palette
                    gojsModel={gojsmetamodelmodel}
                    gojsMetamodel={gojsmetamodelpalette}
                    myMetis={myMetis}
                    myGoModel={myGoModel}
                    metis={metis}
                    phFocus={phFocus}
                    dispatch={dispatch}
                    />

                </div>
              </Col>
              <Col style={{ paddingLeft: "1px", marginLeft: "1px" }}>
              <div className="myModeller m-0 pl-1 pr-1" style={{ minWidth: "200px", width: "100%",height: "100%", border: "solid 1px black" }}>
              {/* <div className="myModeller m-0 pl-1 pr-1" style={{ width: "100%", height: "100%", border: "solid 1px black" }}> */}
                  <Modeller
                    gojsModel={gojsmetamodelmodel}
                    gojsMetamodel={gojsmetamodelpalette}z
                    myMetis={myMetis}
                    myGoModel={myGoModel}
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
            <Col xs="auto ml-3 mr-0 pr-0 pl-0">
              {/* <div className="myPalette pl-1 pr-1 text-white bg-secondary" id="lighten" style={{ maxWidth: "100px", height: "100%", marginRight: "2px", backgroundColor: "whitesmoke", border: "solid 1px black" }}> */}
              <div className="myPalette pl-1 text-white bg-secondary" id="lighten" style={{ maxWidth: "150px", minHeight: "10vh", height: "100%", marginRight: "2px", backgroundColor: "whitesmoke", border: "solid 1px black" }}>
              {/* <div className="myPalette pl-1 pr-1 text-white bg-secondary" id="lighten" style={{ maxWidth: "170px", minHeight: "10vh", height: "100%", marginRight: "2px", border: "solid 1px black" }}> */}
                <Palette
                  gojsModel={gojsmodel}
                  gojsMetamodel={gojsmetamodel}
                  myMetis={myMetis}
                  myGoModel={myGoModel}
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
              <div className="myModeller m-0 pl-1 pr-1" style={{ backgroundColor: "#eee", width: "100%", border: "solid 1px black" }}>
                {/* <div className="myModeller m-0 pl-1 pr-1" style={{ width: "100%", height: "100%", border: "solid 1px black" }}> */}
                  <Modeller
                    gojsModel={gojsmodel}
                    gojsMetamodel={gojsmetamodel}
                    myMetis={myMetis}
                    myGoModel={myGoModel}
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
  

  return (

      <div className="diagramtabs" >
        <div className="modellingContent" style={{ minWidth: "200px" }} >
        <div className="sourceName float-right" style={{ fontSize: "80%", fontWeight: "bolder", marginTop: "4px", marginRight: "4px" }}>Current source:  {state.phSource}</div>
          {modellingtabs}
        </div>
      <style jsx>{`
      `}</style>
    </div>
  )
} 
export default Page(connect(state => state)(page));
