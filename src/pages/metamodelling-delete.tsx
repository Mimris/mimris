//@ts-nocheck
import React, { useState } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
import { loadData } from '../actions/actions'
import Page from '../components/page';
import Layout from '../components/Layout';
import Header from "../components/Header"
import Footer from "../components/Footer"
import Akmm from "../components/Akmm";
import SetContext from '../defs/SetContext'
import TasksHelp from '../components/TasksHelp'

const page = (props: any) => {

  // console.log('16 diagram',props)
  const dispatch = useDispatch()

  if (!props.phData) {
    dispatch(loadData())
  }

  const state = useSelector(state => state)

  const [visible, setVisible] = useState(false)
  function toggle() { setVisible(!visible); }
  const [visibleTasks, setVisibleTasks] = useState(true)
  function toggleTasks() {
    setVisibleTasks(!visibleTasks);
  }

  // /**
  // * Set up the Context items and link to select Context modal,
  // */
  const setContextDiv = (props.phFocus) && <SetContext phF={props.phFocus} />

  return (
    <div>
      <Layout user={state.phUser?.focusUser} >
        <div id="index" >
          <div className="wrapper" >
            <div className="header" >
              <Header title='headerTitle' />
            </div>
            <div className="workplace" >
              <div className="contextarea" >
                {setContextDiv}
              </div>
              <div className="tasksarea"  >
                <TasksHelp />
              </div>
              <div className="workarea">
                <Akmm />
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
        // grid-template-columns: 1fr auto;
        // grid-template-rows:  auto;
        grid-gap: 0px;
        grid-template-areas:
        "header"
        "workplace"
        "footer";
      }
      .workplace {
        grid-area: workplace;
        display: grid ;
        // background-color: #;
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

      .workarea {
        grid-area: workarea;
        display: grid ;
        border-radius: 5px 5px 0px 0px;
        // max-width: 400px;
        // min-height: 60vh;
        // grid-template-columns: auto;
        grid-template-areas:
          "workpad workpad";
      }
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
        // grid-area: tasksarea;
        // padding: 2px;
        // border: 2px;
        max-width: 200px;
        // // min-width: 200px;
        // width: 100%;
        border-radius: 5px 5px 5px 5px;
        border-color: #000;
        background-color: #fff;
        font-size: 100%;
      }
      p {
        color: white;
      }
     `}</style>

    </div>
  )
}
export default Page(connect(state => state)(page));