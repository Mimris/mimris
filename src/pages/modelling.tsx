//@ts-nocheck
import React, { useState, useEffect } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
import { loadData, loadDataModelList } from '../actions/actions'
import Page from '../components/page';
import Layout from '../components/Layout';
import Header from "../components/Header"
import Footer from "../components/Footer"
import Modelling from "../components/Modelling";
import SetContext from '../defs/SetContext'
import TasksHelp from '../components/TasksHelp'
// import DispatchLocal from '../components/utils/SetStoreFromLocalStorage'
import useLocalStorage from '../hooks/use-local-storage'
import DispatchFromLocalStore from '../components/utils/DispatchFromLocalStore'
// import { loadState, saveState } from '../components/utils/LocalStorage'

const page = (props:any) => {
  // console.log('16 diagram',props)

  const [refresh, setRefresh] = useState(true);
  const dispatch = useDispatch()
  const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', null);
  // DispatchFromLocalStore(memoryLocState)
  // console.log('23 modelling', memoryLocState);
  
  // if (props && props?.phSource === 'initialState' ) { // if initialState load memoryState if exists
  //   if (typeof window !== "undefined") {
    //   const loadMemory = confirm("Open saved memory model?");
      // if (loadMemory) {
        // if ((typeof window !== "undefined") && props && props?.phSource === 'initialState' ) {
        // if (memoryLocState && props?.phSource === 'initialState' && confirm('Do you want to load model the saved memory?')) 
        // if (memoryLocState ) {
        //   // Save it!
        //   const memoryState = {
        //     ...memoryLocState,
        //     phSource: 'savedMemory'
        //   }
        //   // console.log('35 modelling', memoryState);
        //   DispatchFromLocalStore(memoryState)
        // }
      // }
  //   }
  // }

  // if (!props.phData) {
  //   dispatch(loadData())
  // }
  useEffect(() => {
    if (!props.phList) {
      console.log('47 modelling - modellist loaded', props);
      dispatch(loadDataModelList()) // load list of models in repository
    }
  }, [])
  
  const state = useSelector(state => state)
  // console.log('51 modelling', state, props.phData);
  
  const [visible,setVisible] = useState(false)
  function toggle() { setVisible(!visible); }
  const [visibleTasks, setVisibleTasks] = useState(true)
  function toggleTasks() {
    setVisibleTasks(!visibleTasks);
  }
  
  // /**
  // * Set up the Context items and link to select Context modal,
  // */
  const setContextDiv =  <SetContext ph={props} />
  // const setContextDiv = (props.phFocus) && <SetContext phF={props.phFocus} />
  // useEffect(() => {
  //   return () => {
  //     <SetContext ph={props} />
  //   };
  // }, [props.phFocus.focusModel.id])
  // console.log('42 modelling', state.phUser);
  
  const modellingDiv = <Modelling />

  return (
    <div>
       <Layout user={state.phUser?.focusUser} >
        <div id="index" >
          <div className="wrapper" >
            {/* <div className="header" >
              <Header title={props.phUser?.focusUser.name} /> 
            </div> */}
            <div className="workplace bg-white" >
              <div className="contextarea" >
                {setContextDiv}
              </div>
                <div className="tasksarea mr-1" style={{ backgroundColor: "#eed", borderRadius: "5px 5px 5px 5px" }} >
                {/* <div className="tasksarea" style={{ paddingLeft: "2px", marginLeft: "0px",backgroundColor: "#eed", borderRadius: "5px 5px 5px 5px" }} > */}
                <TasksHelp />
              </div>
              <div className="workarea mr-1 pl-1 pt-2 pb-3" style={{ backgroundColor: "#ddd" }}>
                {refresh ? <> {modellingDiv} </> : <>{modellingDiv}</>}
                {/* <Modelling /> */}
              </div>
            </div>
            <div className="footer">
              <Footer />
            </div>
          </div>
        </div>
      </Layout>
      <style jsx>{`
      .wrapper {
        display: grid;
        height: 101%;
        min-height: 101%;
        // grid-template-columns: 1fr auto;
        // grid-template-rows:  auto;
        grid-gap: 0px;
        grid-template-areas:
        "workplace"
        "footer";
      }
      .workplace {
        grid-area: workplace;
        display: grid ;
        height: 101%;
        // min-height: 101%;
        // background-color: #ddd;
        grid-template-columns: auto 1fr;
        grid-template-areas:
        "contextarea contextarea"
        "tasksarea workarea";
      }

      // @media only screen and (max-width: 475px) {
      // .workplace {
      //     grid-area: workplace;
      //     display: grid ;
      //     background-color: #aaa;
      //     grid-template-columns: auto 2fr;
      //     grid-template-areas:
      //     "taskarea"
      //     "workarea";
      //   }
      // }

      .contextarea {
        grid-area: contextarea;
        display: grid;
        border-radius: 4px;
        outline-offset:-6px;
        padding: 0px;
        font-size: 70%;
        background-color: #e8e8e8;
        color: #000;
        max-height: 60px; 
      }
      .tasksarea {
        grid-area: tasksarea;
        padding: 0px;
        margin-right: 0px;
        padding-right: 3px;
        border: 2px;
        border-radius: 5px 5px 5px 5px;
        border-width: 2px;
        // border-color: #000;
        background-color: #ffe;
        // max-width: 220px;
        // font-size: 100%;
      }
      .workarea {
        grid-area: workarea;
        // display: grid ;
        border-radius: 5px 5px 0px 0px;
        // padding-right: 4px;
        // max-width: 400px;
        // min-height: 60vh;
        grid-template-columns: auto;
        grid-template-areas:
        "workpad";
      }
        .workpad {
          grid-area: workpad;
          display: grid;
          border-radius: 5px 5px 0px 0px;
          // height: 100%;
          // width: 100vh;
          // min-width: 400px;
          // grid-template-columns: auto 1fr;
          // grid-template-areas: 
          // "myPalette myModeller";         
        }
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
      p {
        color: white;
      }
     `}</style>

    </div>
  )
}
export default Page(connect(state => state)(page));