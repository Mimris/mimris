//@ts-nocheck
import React, { useState, useEffect } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
import { loadData } from '../actions/actions'
import Page from '../components/page';
import Layout from '../components/Layout';
import Header from "../components/Header"
import Footer from "../components/Footer"
import Modelling from "../components/Modelling";
import SetContext from '../defs/SetContext'
import TasksHelp from '../components/TasksHelp'
// import DispatchLocal from '../components/utils/SetStoreFromLocalStorage'
import useLocalStorage from '../hooks/use-local-storage'
// import { loadState, saveState } from '../components/utils/LocalStorage'

const page = (props:any) => {
  
  // console.log('16 diagram',props)
  const dispatch = useDispatch()
  // const [lstate, setLstate] = useLocalStorage('state');

  // try {
  //   if (!window) {
  //     return
  //   } else {
  //     console.log('26', lstate);
  //     (lstate) &&  DispatchLocal(lstate)
  //   }
  // } catch (error) {
  //   console.log('31 modelling', error);
  // }
  
  // console.log('33 modelling', props.phData);
  
  if (!props.phData) {
    dispatch(loadData())
  }

  // console.log('23 modelling', props.phData);
  
  const state = useSelector(state => state)
  
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
  useEffect(() => {
    return () => {
      <SetContext ph={props} />
    };
  }, [props.phFocus.focusModel.id])
  // console.log('42 modelling', state.phUser);
  

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
                <div className="tasksarea" style={{ paddingLeft: "2px", marginLeft: "2px",backgroundColor: "#eed", borderRadius: "5px 5px 5px 5px" }} >
                <TasksHelp />
              </div>
              <div className="workarea px-1" style={{ backgroundColor: "#eee" }}>
                <Modelling />
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
        height: 100%;
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
        height: 100%;
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
        max-width: 220px;
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