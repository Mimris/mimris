import React, { useState } from 'react';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import Palette from "../Palette";
import Modeller from "../Modeller";
import { loadMyModeldata } from "./loadMyModeldata";
import classnames from 'classnames';
import { useSelector, useDispatch } from 'react-redux';


const Model = (props) => {

    console.log('9 Model props', props)
    const { phData, phFocus, phUser, phSource, phMyGoModel, phMyGoMetamodel, phMyGoMetamodelModel, 
        phMyGoMetamodelPalette, phMyGoObjectPalette, phMyGoRelshipPalette, phGojs, metis, memoryAkmmUser, dispatch } = props;
    const { myMetis, myModel, myModelview, myMetamodel, myTargetModel, myTargetModelview, myTargetMetamodel, 
        myTargetMetamodelPalette, myGoModel, myGoMetamodel, myGoMetamodelModel, myGoMetamodelPalette, myGoObjectPalette, 
        myGoRelshipPalette, gojsmetamodelpalette, gojsmetamodelmodel, 
        gojsmodel, gojsmetamodel, gojsmodelobjects, gojstargetmodel, gojstargetmetamodel } = loadMyModeldata(props) || {};

    const [activeTab, setActiveTab] = useState('0');
    const toggle = (tab) => {
      if (activeTab !== tab) setActiveTab(tab);
    }
    
    const doRefresh = () => {
      console.log('doRefresh')
    }

    const [mmToggle, setMmToggle] = useState(false);


    const models = metis.models;

    const sortedmodels = (models) && models
    .sort((a, b) => {
      if (a.name.startsWith('_') && !b.name.startsWith('_')) {
        return 1;
      } else if (!a.name.startsWith('_') && b.name.startsWith('_')) {
        return -1;
      } else if (a.name.endsWith('_SM') && !b.name.endsWith('_SM')) {
        return 1;
      } else if (!a.name.endsWith('_SM') && b.name.endsWith('_SM')) {
        return -1;
      } else {
        return a.name.localeCompare(b.name);
      }
    })

    const selmods = (sortedmodels) ? sortedmodels.filter((m: any) => m?.markedAsDeleted === false): []


      const navmodelDiv = (!selmods) ? <></> : selmods.map((m, index) => {
      if (m && !m.markedAsDeleted) {
        const strindex = index.toString();
        const data = { id: m.id, name: m.name };
        const modelview0 = m.modelviews ? m.modelviews[0] : null;
        const data2 = { id: modelview0?.id, name: modelview0?.name };
        return (
          <NavItem
            key={strindex}
            className="model-selection"
            data-toggle="tooltip"
            data-placement="top"
            data-bs-html="true"
            title={`Description: ${m?.description}\n\nTo change Modelview name, right click the background below and select 'Edit Modelview'.`}
          >
            <NavLink
              style={{
                paddingTop: "0px",
                paddingBottom: "2px",
                paddingLeft: "8px",
                paddingRight: "8px",
                border: "solid 1px",
                borderBottom: "none",
                borderColor: "#eee gray white #eee",
                color: "black",
              }}
              className={classnames({ active: activeTab == strindex })}
              onClick={() => {
                dispatch({ type: "SET_FOCUS_MODEL", data });
                dispatch({ type: "SET_FOCUS_MODELVIEW", data: data2 });
                doRefresh();
              }}
            >
              {(m.name.startsWith('_'))? <span className="text-secondary" style={{scale: "0.8", whiteSpace: "nowrap"}}>{m.name}</span> : m.name}
            </NavLink>
          </NavItem>
        );
      }
    });

    return (
        <>
            <Nav tabs style={{ minWidth: "50px", borderBottom: "white"}} >
            <span className="ms-1 me-5">
                <button className="p-0 ms-0 me-5"
                data-toggle="tooltip" data-placement="top" title="Click to toggle between Metamodel and Model" 
                onClick={() => setMmToggle(!mmToggle)}
                style={{ borderColor: "transparent", width: "116px", height: "24px", fontSize: "16px", backgroundColor: "#a0caca" }}
                >{(mmToggle) ? 'Models >' : 'Metamodel <>'}</button>
            </span>
            {navmodelDiv}
            </Nav>
            <TabContent  >
            <TabPane >   {/* Model ---------------------------------------*/}
                <div className="workpad p-1 pt-2 bg-white">
                <Row className="row1">
                    {/* Objects Palette area */}
                    <Col className="col1 m-0 p-0 pl-0" xs="auto"> {/* Objects Palette */}
                    <div className="myPalette px-1 mt-0 mb-0 pt-0 pb-1" style={{ marginRight: "2px", minHeight: "7vh", backgroundColor: "#7ac", border: "solid 1px black" }}>
                        <Palette // this is the Objects Palette area
                        gojsModelObjects={gojsmodelobjects}
                        gojsModel={gojsmodel}
                        gojsMetamodel={gojsmetamodel}
                        myMetis={myMetis}
                        myGoModel={myGoModel}
                        myGoMetamodel={myGoMetamodel}
                        metis={metis}
                        phFocus={phFocus}
                        dispatch={dispatch}
                        modelType='model'
                        phUser={phUser}
                        />
                    </div>
                    </Col>
                    {/* Modelling area */}
                    <Col className="col2" style={{ paddingLeft: "1px", marginLeft: "1px", paddingRight: "1px", marginRight: "1px" }}>
                    <div className="myModeller pl-0 mb-0 pr-1" style={{ backgroundColor: "#acc", minHeight: "7vh", width: "100%", height: "100%", border: "solid 1px black" }}>
                        <Modeller // this is the Modeller ara
                        gojsModelObjects={gojsmodelobjects}
                        gojsModel={gojsmodel}
                        gojsMetamodel={gojsmetamodel}
                        myMetis={myMetis}
                        myGoModel={myGoModel}
                        myGoMetamodel={myGoMetamodel}
                        phData={phData}
                        phFocus={phFocus}
                        phUser={phUser}
                        phSource={phSource}
                        metis={metis}
                        dispatch={dispatch}
                        modelType='model'
                        userSettings={memoryAkmmUser}
                        />
                    </div>
                    </Col>
                </Row>
                </div>
            </TabPane>
            </TabContent>
        </>
    )
}

export default Model;