// @ts-nocheck
import React, { useState } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
import { loadData } from '../actions/actions'
import Page from '../components/page';
import Layout from '../components/Layout';
import Header from "../components/Header"
import Footer from "../components/Footer"
import SetContext from '../defs/SetContext'
import Link from 'next/link';
import Help from '../components/Help'

const page = (props: any) => {


  const dispatch = useDispatch()

  if (!props.phData) {
    dispatch(loadData())
  }

  const [showSubject, setShowSubject] = useState(false);
  const [showPlenary, setShowPlenary] = useState(false);

  async function putUsersessionById(
      req: NextApiRequest,
      res: NextApiResponse
    ) {

    const response = await fetch('/api/usersession/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: '2nd Session', focus: '{'+JSON.stringify(props.phFocus)+'}' })
      // body: JSON.stringify({ name: '2nd Session', focus: '{"phData": "snorres test3"}' })
    });
    const response2 = await fetch('/api/people/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: '2nd Session', focus: '{'+JSON.stringify(props.phFocus)+'}' })
      // body: JSON.stringify({ name: '2nd Session', focus: '{"phData": "snorres test3"}' })
    });
  }

  const saveSessDiv =    
    <div style={{ paddingLeft: "5px" }} >
    <h5>Save Session page</h5>
      <button className="btn-sm saveSession" onClick={() => putUsersessionById()}>Save current session</button>
    </div>

  const [visibleTasks, setVisibleTasks] = useState(false)
  function toggleTasks() {
    setVisibleTasks(!visibleTasks);
  }

  const tasks =
    <div>
      <button className="btn-default bg-light btn-sm btn-block" onClick={toggleTasks}>{visibleTasks
        ? <><span style={{ paddingLeft: "5px" }}> Tasks - Help</span> <span style={{ float: "left" }} > &lt;  </span>
        </> : <div className="btn-vertical m-0 p-0" style={{ maxWidth: "6px", paddingLeft: "0px" }}><span> &gt; </span><span> T a s k s - H e l p</span> </div>}
      </button>
      <div className="toggleTasks">
        {visibleTasks
          ? <Help />
          : <span></span>}
      </div>
    </div>

  return (
    <div>
      <Layout user={props.phUser?.focusUser} >
        <Link href="/settings">Back</Link>
        <div id="index">
          <div className="wrapper">
            <div className="header" >
              {/* <Header title={headerTitle} /> */}
              {/* <Header title={'headertitle'} /> */}
            </div>
            <div className="workplace" >
              <div className="contextarea" >
                <SetContext phF={props.phFocus} />
              </div>
              <div className="tasksarea" >
                {tasks}
              </div>
              <div className="workarea bg-light">
                {saveSessDiv}
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
          grid-template-columns:  auto;
          grid-gap: 0px;
          grid-template-areas:
            "header"
            "workplace"
            "footer";
      }
      .header {
        background-color: #fff;
        color: #aaa;
        font-size: 70%;
        /* box-shadow: 4px 2px #888888; */
      }
      .footer {
        background-color: #fff;
        color: #000;
        display: inline-block; 
        margin-bottom: 4px;
      }
      .workplace {
        grid-area: workplace;
        display: grid ;
        background-color: #aaa;
        grid-template-columns: auto 2fr;
        // grid-auto-rows:auto auto 1fr;
        grid-template-areas:
        "contextarea contextarea"
        "tasksarea workarea";
      }
      @media only screen and (max-width: 475px) {
      .workplace {
          grid-area: workplace;
          display: grid ;
          background-color: #aaa;
          grid-template-columns: auto 2fr;
          // grid-auto-rows:auto auto 1fr;
          grid-template-areas:
          "contextarea "
          "tasksarea"
          "workarea";
        }
      }

      .workarea {
        grid-area: workarea;
        display: grid ;
        border-radius: 5px 5px 0px 0px;
        // max-width: 400px;
        // min-height: 60vh;
        grid-template-columns: 1fr auto;
        grid-template-areas:
          "workpad workpad";
      }
     .contextarea {
        grid-area: contextarea;
        display: grid;
        border-radius: 4px;
        outline-offset:-6px;
        padding: 0px;
        font-size: 60%;
        background-color: #e8e8e8;
        color: #000;
        max-height: 60px; 
      }
      .tasksarea {
        grid-area: tasksarea;
        padding: 2px;
        border: 2px;
        max-width: 400px;
        border-radius: 5px 5px 5px 5px;
        border-color: #000;
        background-color: #baa;
        font-size: 100%;
      }
 
      `}</style>
    </div>
  )
}

export default Page(connect(state => state)(page));