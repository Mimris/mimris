// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useDispatch } from 'react-redux';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import GoJSApp from "./gojs/GoJSApp";
import Selector from './utils/Selector'
import genGojsModel from './GenGojsModel'

const debug = false;

const Modeller = (props: any) => {
  const debug = false
  if (debug) console.log('13 Modeller: props', props);
  // let prevgojsmodel = null
  // let gojsmodel = {}
  const gojsmodel = props.gojsModel;
  let myMetis = props.myMetis;
  let activetabindex = '0'
  const dispatch = useDispatch();
  const [refresh, setRefresh] = useState(false)
  const [activeTab, setActiveTab] = useState();
  const showDeleted = props.phUser?.focusUser?.diagram?.showDeleted

  function toggleRefresh() { setRefresh(!refresh); console.log('25', refresh);
   }

   if (debug) console.log('27 Modeller: props, refresh', props, refresh);

  let focusModel = props.phFocus?.focusModel
  let focusModelview = props.phFocus?.focusModelview
  const models = props.metis?.models
  const model = models?.find((m: any) => m?.id === focusModel?.id)
  const modelindex = models?.findIndex((m: any) => m?.id === focusModel?.id)
  const modelviews = model?.modelviews
  const modelview = modelviews?.find((m: any) => m?.id === focusModelview?.id)
  const modelviewindex = modelviews?.findIndex((m: any) => m?.id === focusModelview?.id)

  // const selmods = {models, model}//(models) && { models: [ ...models?.slice(0, modelindex), ...models?.slice(modelindex+1) ] }
  // const selmodviews = {modelviews, modelview}//(modelviews) && { modelviews: [ ...modelviews?.slice(0, modelviewindex), ...modelviews?.slice(modelviewindex+1) ] }
  
  // put current modell on top 
  const selmods = [
    models[modelindex],
    ...models.slice(0, modelindex),
    ...models.slice(modelindex+1, models.length)
  ]
  const selmodviews = modelviews
  
  if (debug) console.log('36 Modeller', focusModelview, selmods, selmodviews);
  let selmodels = selmods?.filter((m: any) => m && (!m.markedAsDeleted))
  // let selmodelviews = selmodviews?.map((mv: any) => mv && (!mv.markedAsDeleted))
  // if (debug) console.log('48 Modeller', focusModel.name, focusModelview.name);
  // if (debug) console.log('49 Modeller', selmods, selmodels, modelviews, selmodviews);

  const gojsapp = (gojsmodel) && <GoJSApp
      nodeDataArray={gojsmodel.nodeDataArray}
      linkDataArray={gojsmodel.linkDataArray}
      metis={props.metis}
      myMetis={props.myMetis}
      myGoModel={props.myGoModel}
      myGoMetamodel={props.myGoMetamodel}
      phFocus={props.phFocus}
      dispatch={props.dispatch}
      modelType={props.phFocus.focusTab}
  />

  const handleChange = (e) => {
    if (debug) console.log('69 Modeller: handleChange', e);
    dispatch({ type: 'UPDATE_PROJECT_PROPERTIES', data: { name: e.value } });
  }


    const selector = (props.modelType === 'model' || props.modelType === 'modelview' ) 
      ? <>
          {/* <div className="modeller-selection" > */}
            {/* <Selector type='SET_FOCUS_MODELVIEW' selArray={selmodelviews} selName='Modelveiews' focusModelview={props.phFocus?.focusModelview} focustype='focusModelview' refresh={refresh} setRefresh={setRefresh} /> */}
            <Selector type='SET_FOCUS_MODEL' selArray={selmodels} selName='Model' focusModel={props.phFocus?.focusModel} focustype='focusModel' refresh={refresh} setRefresh={setRefresh} />
          {/* </div>  */}
          <div className="modeller-heading float-right text-dark py-0 m-0 mr-5 px-2 w-50" data-toggle="tooltip" data-placement="top" data-bs-html="true" 
              title="To change Project Name : Edit this field or Right-click the background below and select 'Edit Project Name'" 
              style={{ margin: "0px", padding: "0px", paddingLeft: "0px", paddingRight: "0px" }}>
              <div className="w-100" >
                <label className="m-0 p-0  w-50 float-right" > Project :  
                  <input className="m-0 w-75" type="text" defaultValue={props.metis.name} onBlur={(event) => handleChange({ value: event.target.value })}/>
                </label>
                {/* <label for="projName">Project :</label> 
                <input id="projName" type="text"  onBlur={(event) => handleChange({ value: event.target.value })}/> */}
              </div>
              {/* <span className="projectname ml-2 px-1 bg-secondary"> {props.metis.name || '---- none ----'}</span>  */}
          </div>
        </>
      :
      <div className="modeller-selection float-right" >
        <>
          {/* <div className="modeller-selection" > */}
            {/* <Selector type='SET_FOCUS_MODELVIEW' selArray={selmodelviews} selName='Modelveiews' focusModelview={props.phFocus?.focusModelview} focustype='focusModelview' refresh={refresh} setRefresh={setRefresh} /> */}
            <Selector type='SET_FOCUS_MODEL' selArray={selmodels} selName='Model' focusModel={props.phFocus?.focusModel} focustype='focusModel' refresh={refresh} setRefresh={setRefresh} />
          {/* </div>  */}
          <h5 className="modeller-heading float-left text-dark m-0 mr-5 px-2 clearfix" data-toggle="tooltip" data-placement="top" data-bs-html="true" 
              title="To change Project Name : Right-click the background below and select 'Edit Project Name'" 
              style={{ margin: "0px", paddingLeft: "0 px", paddingRight: "0px" }}>
                   <div style={{display: "flex",}}>
                <label> Project :  
                  <input type="text" defaultValue={props.metis.name} onBlur={(event) => handleChange({ value: event.target.value })}/>
                </label>
                {/* <label for="projName">Project :</label> 
                <input id="projName" type="text"  onBlur={(event) => handleChange({ value: event.target.value })}/> */}
              </div>
              {/* Project 
              <span className="projectname ml-2 px-1 bg-secondary w-25"> {props.metis.name || '---- none ----'} </span>  */}
          </h5>
        </>
      </div> 
  // mx-auto h-25 d-inline-block

  activetabindex = (modelviewindex < 0) ? 0 : (modelviewindex) ? modelviewindex : 0 //selmodelviews?.findIndex(mv => mv.name === modelview?.name)
  if (debug) console.log('78 Modeller', activetabindex);

  // (selmodviews && props.phSource === 'Model server') &&  
  // (selmodviews) &&  
  useEffect(() =>  {
    if (selmodviews?.length>0)
      if (activeTab != undefined || 0) {
        const data = {id: selmodviews[0].id, name: selmodviews[0].name}
        dispatch({ type: 'SET_FOCUS_MODELVIEW', data }) ;
        setActiveTab(0)
        genGojsModel(props, dispatch);
    }
    if (debug) console.log('89 Modeller useEffect 1', activeTab); 
  }, [focusModel])
  
  useEffect(() => {
    setActiveTab(activetabindex)
    if (debug) console.log('94 Modeller useEffect 2', activeTab); 
    // genGojsModel(props, dispatch);
  }, [activeTab])

  useEffect(() => {
    if (debug) console.log('99 Modeller useEffect 3', props); 
    // genGojsModel(props, dispatch);
    const model = models.find(m => m.id === focusModel?.id)
    if (model) {
      const modelviews = model.modelviews;
      if (modelviews) {
        if (debug) console.log('111 model', model);
        if (activeTab === 0) {
          const data = {id: model.modelviews[0].id, name: model.modelviews[0].name}
          dispatch({ type: 'SET_FOCUS_MODELVIEW', data }) ;
          function refres() {
            setRefresh(!refresh)
          }
          setTimeout(refres, 10);
        }
      }
    }
  }, [activeTab])

  useEffect(() => {
    if (debug) console.log('125 Modeller useEffect 5', props); 
    genGojsModel(props, dispatch)
  }, [refresh])

  //   useEffect(() => {
  //     if (debug) console.log('81 Modeller useEffect 2', activeTab); 
  //   // const data = {id: model.modelviews[0].id, name: model.modelviews[0].name}
  //   // dispatch({ type: 'SET_FOCUS_MODELVIEW', data }) 
  //   setActiveTab(activetabindex)
  //   // function refres() {
  //     setRefresh(!refresh)
  //   // }
  //   // setTimeout(refres, 1000);
  // }, [focusModelview?.id])
  
  const navitemDiv = (!selmodviews) ? <></> : selmodviews.map((mv, index) => {
    if (mv && !mv.markedAsDeleted) { 
        const strindex = index.toString()
        const data = {id: mv.id, name: mv.name}
        const data2 = {id: Math.random().toString(36).substring(7), name: strindex+'name'}
        // genGojsModel(props, dispatch);
        // if (debug) console.log('90 Modeller', activeTab, activetabindex , index, strindex, data)
        return (
          <NavItem key={strindex}>
            <NavLink style={{ paddingTop: "0px", paddingBottom: "0px", border: "solid 1px", borderBottom: "none", borderColor: "#eee gray white #eee", color: "black" }}
              className={classnames({ active: activeTab == strindex })}
              onClick={() => { dispatch({ type: 'SET_FOCUS_MODELVIEW', data }); dispatch({ type: 'SET_FOCUS_REFRESH', data: {id: Math.random().toString(36).substring(7), name: strindex+'name'} }) }}
              // onClick={() => { toggleTab(strindex); dispatch({ type: 'SET_FOCUS_MODELVIEW', data }); toggleRefresh() }}
            >
              {mv.name}
            </NavLink>
 
          </NavItem>
        )
    }
  })

  const modelviewTabDiv = 
    <>
      <Nav tabs >
        {navitemDiv}  
        <NavItem >
        <button className="btn-sm bg-warning text-white py-0 ml-3 float-right"  data-toggle="tooltip" data-placement="top" data-bs-html="true" 
          title=" Modelling:&#013;Insert an Object: Click on an Object Type in the Palette (the left) and drag and drop it into the Modelling area below.&#013;&#013;
                  Connect two objects: &#013;Position the cursor on on the edge of one object (An arrow appears) and drag and drop to another object to make a relationshop between them.">?
        </button>
         
        </NavItem>
      </Nav>
      <TabContent > 
        <TabPane  >
          <div className="workpad bg-white mt-0 p-1 pt-2"> 
            {gojsapp}
            {/* {refresh ? <> {gojsapp} </> : <>{gojsapp}</>} */}
          </div>         
        </TabPane>
      </TabContent>
    </>

  const metamodelTabDiv = 
    <>
      <div className="workpad p-1 pt-2"> 
        {gojsapp}
        {/* {refresh ? <> {gojsapp} </> : <>{gojsapp}</>} */}
      </div>         
    </>

  // console.log('129', activetabindex, modelviewTabDiv);
  // setDispatchdone(true)
  // console.log('130 Modeller', focusModelview, props)

  return (
    (props.modelType === 'model') ?
    <div className="mt-2 ml-1 mb-1" style={{backgroundColor: "#acc", minWidth: "390px"}}>
      <h5 className="modeller-heading float-left text-dark m-0 mr-0 clearfix" 
        style={{ margin: "2px", paddingLeft: "2px", paddingRight: "0px", zIndex: "99", position: "relative", overflow: "hidden" }}>Modeller
      </h5>
      <div>
        {selector}
      </div><br />
      <div className="mt-2">
        {modelviewTabDiv} 
      </div>
      <div className="diagram-buttons">
        <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Zoom all diagram&#013;">Zoom All</button>
        <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle relationhip layout routing&#013;">Toggle relationship layout</button>
        <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle relationhip show relship name&#013;">Toggle relationships name</button>
        <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Zoom to objectview in focus&#013;">Zoom to Focus</button>
        <button className="btn-sm  py-0" 
          data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle show/ hide deleted objectviews&#013;" 
          onClick={() =>     { dispatch({ type: 'SET_USER_SHOWDELETED', data: !showDeleted }) ; toggleRefresh() } } > {(showDeleted) ? ' Hide deleted' : 'Show deleted' }
          {/* onClick={() => { toggleShowDeleted(showDeleted); dispatch({ type: 'SET_USER_SHOWDELETED', data: showDeleted }) ; toggleRefresh() }}>{(showDeleted) ? 'Hide deleted' : 'Show deleted' } */}
        </button>
        {/* <button className="btn-sm text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="&#013;"></button> */}
      </div>
      <style jsx>{`
      // .diagram-component {
      //   height: 80%;
      // }
      `}</style>
    </div>
    :
    <div className="mt-2 mb-5" style={{backgroundColor: "#7ac"}}>
      <h5 className="modeller-heading float-left text-dark mr-4 mb-4" style={{ margin: "2px", paddingLeft: "2px", paddingRight: "8px", zIndex: "99", position: "relative", overflow: "hidden" }}>Metamodeller</h5>
      {/* <button className="btn-sm bg-info text-white py-0 mr-2 mb-0"  data-toggle="tooltip" data-placement="top" data-bs-html="true" 
        title="Start metamodelling:&#013;Insert an Type Object: Click on an Object Types in the Palette on the left side and drag and drop it into the Metamodelling area below.&#013; 
        Connect two objects: Position the cursor on on the edge of one object (An arrow appears) and drag and drop to another object make a relationshop between them."
        >?
      </button> */}

        {selector}
      <div className="pt-5 mt-3">
        {metamodelTabDiv} 
      </div>
      <style jsx>{`
      // .diagram-component {
      //   height: 80%;
      // }
      `}</style>
    </div>
  )
}

export default Modeller;