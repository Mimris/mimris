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

  console.log('12', props);
  const dispatch = useDispatch()
  
  /**  * Get the state from the store  */
  const state = useSelector((state: any) => state) // Selecting the whole redux store
  const focusModelview = useSelector(focusModelview => state.phFocus.focusModelview) 
  let gojsmodel =  state.phFocus.gojsModel 
  let gojsmetamodel =  state.phFocus.gojsMetamodel 
  let metis = state.phData?.metis
  let myMetis = props.phMymetis?.myMetis


  console.log('24 Diagram', gojsmetamodel ); 

  useEffect(() => {
    genGojsModel(state, dispatch);
  }, [focusModelview])

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
      <TabContent  activeTab={activeTab}>
        <TabPane  tabId="1">
          <div className="workpad p-1 bg-light">
            <Row >
              <Col xs="auto ml-3 mr-0 pr-0 pl-0">
                <div className="myPalette pl-1 text-white bg-secondary" id="lighten" style={{ maxWidth: "200px", height: "80vh", marginRight: "2px", backgroundColor: "whitesmoke", border: "solid 1px black" }}>
                  <Palette
                    gojsModel={gojsmodel}
                    gojsMetamodel={gojsmetamodel}
                    myMetis={myMetis}
                    metis={metis}
                    dispatch={dispatch}
                  />

                </div>
              </Col>
              <Col style={{ paddingLeft: "1px", marginLeft: "1px" }}>
              <div className="myModeller m-0 pl-1 pr-1" style={{ width: "100%", height: "100%", border: "solid 1px black" }}>
                  <Modeller
                    gojsModel={gojsmodel} // Her skal det være metamodell modelview
                    gojsMetamodel={gojsmetamodel}  // metametamodel
                    myMetis={myMetis}
                    metis={metis}
                    dispatch={dispatch}
                  />
                </div>
              </Col>
            </Row>
          </div>         
        </TabPane>
        <TabPane tabId="2">
          <div className="workpad p-1 bg-light">
            <Row >
            <Col xs="auto ml-3 mr-0 pr-0 pl-0">
              <div className="myPalette pl-1 pr-1 text-white bg-secondary" id="lighten" style={{ maxWidth: "170px", height: "100%", marginRight: "2px", border: "solid 1px black" }}>
                <Palette
                  gojsModel={gojsmodel}
                  gojsMetamodel={gojsmetamodel}
                  myMetis={myMetis}
                  metis={metis}
                  dispatch={dispatch}
                  />
                {/* <div className="instances"> area for all instance or result of query */}
                {/* {instances} */}
                {/* </div> */}
              </div>
              </Col>
              <Col style={{ paddingLeft: "1px", marginLeft: "1px"}}>
                <div className="myModeller m-0 pl-1 pr-1" style={{ width: "100%", height: "100%", border: "solid 1px black" }}>
                  <Modeller
                    gojsModel={gojsmodel}
                    gojsMetamodel={gojsmetamodel}
                    myMetis={myMetis}
                    metis={metis}
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
          {modellingtabs}
        </div>
      <style jsx>{`
        // .diagramtabs { 
        //   margin: 4px;
        //   // background-color: red;
        //   // grid-template-columns: auto;
        //   // grid-template-areas:
        //   // "modellingContent";         
        // }
        // .modellingContent {
        //   grid-area: modellingContent;
        //   display: grid;
        //   margin: 4px;
        //   padding: 4px;
        //   background-color: white;
        //   grid-template-columns: auto;
        //   grid-template-areas:
        //   "nav-tabs"
        //   "tab-content";         
        // }
        // .nav-tabs {
        //   grid-area: nav-tabs;   
        // }
        // .tab-content {
        //   grid-area: tab-content;
        //   display: grid;
        //   margin: 4px;
        //   padding: 4px;
        //   background-color: white;
        //   grid-template-columns: auto;
        //   grid-template-areas:
        //   "tab-pane active";         
        // }
        // .tab-pane active {
        //   grid-area: tab-pane;
        //   display: grid;
        //   background-color: yellow;
        //   grid-template-columns: auto;
        //   grid-template-areas:      
        //   "workpad";
        // }
        
        // .workpad {
        //   grid-area: workpad;
        //   display: grid;
        //   border-radius: 5px 5px 0px 0px;
        //   // height: 100%;
        //   // width: 100vh;
        //   // min-width: 400px;
        //   grid-template-columns: auto 1fr;
        //   grid-template-areas: 
        //   "myPalette myModeller";         
        // }
        // .myPalette {
        //   grid-area: myPalette;
        //   // margin: 2px;
        //   // padding-right: 3px;
        //   // height: 100%;
        //   // // min-height: 50vh;
        //   // border-radius: 5px 5px 0px 0px;
        //   // background-color: #ddd; 
        //   // // max-width: 200px;    
        //   // // min-width: 400px;
        // }
        // .myModeller {
        //   grid-area: myModeller;
        //   // // height: 100%;
        //   // margin: 2px;
        //   // padding-right: 3px;
        //   // border-radius: 5px 5px 0px 0px;
        //   // background-color: #e0e;
        //   // // width: 100%;
        //   // max-width: 10hv;
        // }
      `}</style>
    </div>
  )
} 
export default Page(connect(state => state)(page));
