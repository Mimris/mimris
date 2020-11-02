// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useDispatch } from 'react-redux';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import GoJSApp from "./gojs/GoJSApp";
import Selector from './utils/Selector'
import genGojsModel from './GenGojsModel'


const Modeller = (props: any) => {
  const debug = false
  // if (debug) console.log('8 Modeller', props);
  // let prevgojsmodel = null
  // let gojsmodel = {}
  const gojsmodel = props.gojsModel;
  let myMetis = props.myMetis;
  
  const dispatch = useDispatch();
  const [refresh, setRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState();

  function toggleRefresh() { setRefresh(!refresh); }

  // if (debug) console.log('21 Modeller', props.gojsModel, gojsmodel);

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
  
  // console.log('36 Modeller', focusModelview, selmods, modelviews);
  let selmodels = selmods //selmods?.models?.map((m: any) => m)
  let selmodelviews = selmodviews //selmodviews?.modelviews?.map((mv: any) => mv)

  // if (debug) console.log('48 Modeller', focusModel.name, focusModelview.name);
  // if (debug) console.log('49 Modeller', selmods, selmodels, modelviews, selmodviews);

  const gojsapp = (gojsmodel) &&
    < GoJSApp
      nodeDataArray={gojsmodel.nodeDataArray}
      linkDataArray={gojsmodel.linkDataArray}
      metis={props.metis}
      myMetis={props.myMetis}
      myGoModel={props.myGoModel}
      myGoMetamodel={props.myGoMetamodel}
      phFocus={props.phFocus}
      dispatch={props.dispatch}
    />

    const selector = (props.modelType === 'model' || props.modelType === 'modelview') 
    ? <>
        {/* <div className="modeller-selection float-right" > */}
          {/* <Selector type='SET_FOCUS_MODELVIEW' selArray={selmodelviews} selName='Modelveiews' focusModelview={props.phFocus?.focusModelview} focustype='focusModelview' refresh={refresh} setRefresh={setRefresh} /> */}
          <Selector type='SET_FOCUS_MODEL' selArray={selmodels} selName='Model' focusModel={props.phFocus?.focusModel} focustype='focusModel' refresh={refresh} setRefresh={setRefresh} />
        {/* </div>  */}
      </>
    :
    <div className="modeller-selection float-right" >
    </div> 

  const activetabindex = (modelviewindex < 0) ? '0' : modelviewindex //selmodelviews?.findIndex(mv => mv.name === modelview?.name)
  if (debug) console.log('79 Modeller', activetabindex);
  // if (gojsmodel) {console.log('89 Modeller', activetabindex, modelview, props.gojsModel)}
  useEffect(() => {
    setActiveTab('0')
    if (debug) console.log('82 Modeller useEffect 1', activeTab); 
    //   const data = {id: model.modelviews[0].id, name: model.modelviews[0].name}
    //   dispatch({ type: 'SET_FOCUS_MODELVIEW', data }) 
      // genGojsModel(props, dispatch);
    // function refres() {
    //   setRefresh(!refresh)
    //   }
    //   setTimeout(refres, 5000);
  }, [focusModel.id])
  
  useEffect(() => {
      setActiveTab(activetabindex)
      if (debug) console.log('94 Modeller useEffect 2', activeTab); 
      genGojsModel(props, dispatch);
      // setRefresh(!refresh)
    }, [activeTab])
    
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
    if (mv) { 
        const strindex = index.toString()
        const data = {id: mv.id, name: mv.name}
        genGojsModel(props, dispatch);
        // if (debug) console.log('90 Modeller', activeTab, activetabindex , index, strindex, data)
        return (
          <NavItem key={strindex}>
            <NavLink style={{ paddingTop: "0px", paddingBottom: "0px", border: "solid 1px", borderBottom: "none" }}
              className={classnames({ active: activeTab == strindex })}
              onClick={() => {  dispatch({ type: 'SET_FOCUS_MODELVIEW', data }) }}
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
      </Nav>
      <TabContent   > 
        <TabPane  >
          <div className="workpad bg-white p-1 pt-2"> 
            {refresh ? <> {gojsapp} </> : <>{gojsapp}</>}
          </div>         
        </TabPane>
      </TabContent>
    </>
  const metamodelTabDiv = 
    <>
      <div className="workpad bg-white  p-1 pt-2"> 
        {refresh ? <> {gojsapp} </> : <>{gojsapp}</>}
      </div>         
    </>

  // console.log('129', activetabindex, modelviewTabDiv);
  // setDispatchdone(true)
  // console.log('130 Modeller', focusModelview, props)

  return (
    (props.modelType === 'model') ?
    <div className="mt-1" style={{backgroundColor: "#acc"}}>
      <h5 className="modeller-heading float-left text-dark m-6 mr-4" style={{ margin: "2px", paddingLeft: "2px", paddingRight: "8px", zIndex: "99", position: "relative", overflow: "hidden" }}>Modeller</h5>
      <div>
        {selector}
        {modelviewTabDiv} 
      </div>
      <style jsx>{`
      // .diagram-component {
      //   height: 80%;
      // }
      `}</style>
    </div>
    :
    <div className="mt-1" style={{backgroundColor: "#acc"}}>
      <h5 className="modeller-heading text-dark m-6 mr-4" style={{ margin: "2px", paddingLeft: "2px", paddingRight: "8px", zIndex: "99", position: "relative", overflow: "hidden" }}>Metamodeller</h5>
      <div>
        {selector}
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