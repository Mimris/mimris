//@ts-check
import React, { useState, useEffect } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
// import { loadData, loadDataGithub, loadDataModelList } from '../actions/actions'
import Link from 'next/link';
import { Router, useRouter } from "next/router";
import Page from '../components/page';
import Layout from '../components/Layout';
import Header from "../components/Header"
import Footer from "../components/Footer"
import Modelling from "../components/Modelling";
import SetContext from '../defs/SetContext'
import Context from "../components/Context"
import SelectContext from '../components/utils/SelectContext'
import TasksHelp from '../components/TasksHelp'
import useLocalStorage from '../hooks/use-local-storage'
import { NavbarToggler } from "reactstrap";
import StartInitStateJson from '../startupModel/INIT-Startup_Project.json'
import GenGojsModel from "../components/GenGojsModel";

// import SelectVideo from '../components/SelectVideo'
// import DispatchLocal from '../components/utils/SetStoreFromLocalStorage'
// import useLocalStorage from '../hooks/use-local-storage'
// import DispatchFromLocalStore from '../components/utils/DispatchFromLocalStore'
// import LoadInitial from "../components/loadModelData/LoadInitmodel";
// import { loadState, saveState } from '../components/utils/LocalStorage'

const debug = false

const useEfflog = console.log.bind(console, '%c %s', // green colored cosole log
  'background: red; color: white');

const page = (props: any) => {

  if (debug) console.log('34 modelling ', props)
  const dispatch = useDispatch()

  function dispatchLocalStore(locStore) {
    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: locStore.phData })
    dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: locStore.phFocus })
    dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: locStore.phSource })
    dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: locStore.phUser })
  }

  const { query } = useRouter(); // example: http://localhost:3000/modelling?repo=Kavca/kavca-akm-models&path=models&file=AKM-IRTV-Startup.json
  const router = useRouter();
  if (debug) console.log('32 modelling', props) //(props.phList) && props.phList);
  const [mount, setMount] = useState(false)
  // const [visible, setVisible] = useState(false)
  const [refresh, setRefresh] = useState(true);
  const [params, setParams] = useState(null);
  const [data, setData] = useState(null);
  const [refreshContext, setRefreshContext] = useState(true);
  const [render, setRender] = useState(false);
  const [visibleTasks, setVisibleTasks] = useState(true)

  const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', []); //props);
  const [memoryAkmmUser, setMemoryAkmmUser] = useLocalStorage('akmmUser', ''); //props);
  const [visibleContext, setVisibleContext] = useState(false);
  const [akmmUser, setAkmmUser] = useState(props.phUser);


  function getUserSettings(key) {
    if (memoryAkmmUser !== '' && memoryAkmmUser !== null) {
      console.log('63 Modelling', memoryAkmmUser)
      return memoryAkmmUser
    }
  }

  function setUserSettings(key, value) {
    console.log('69 Modelling', value.appSkin.visibleContext)
    localStorage.setItem(key, JSON.stringify(value));
  }

  useEffect(() => {
    if (debug) console.log('76 modelling useEffect 1', query)//memoryLocState[0], props.phFocus.focusModelview.name)
  
    // let data = {}
    const getQuery = async () => {
      try {
        const queryParam = await query
        if (!queryParam.repo) {
          if (debug) console.log('68 modelling', props.phFocus.focusProj.file)
          if (props.phFocus.focusProj.file === 'AKM-INIT-Startup__PR.json') {
            if ((memoryLocState != null) && (memoryLocState.length > 0) && (memoryLocState[0].phData)) {
              if ((window.confirm("Do you want to recover your last modelling edits? \n\n  Click 'OK' to recover or 'Cancel' to open intial project."))) {
                if (Array.isArray(memoryLocState) && memoryLocState[0]) {
                  const locStore = (memoryLocState[0])
                  if (locStore) {
                    dispatchLocalStore(locStore) // dispatch to store the lates [0] from local storage
                    // data = {id: locStore.phFocus.focusModelview.id, name: locStore.phFocus.focusModelview.name}
                    // console.log('modelling 73 ', data)
                  }
                  const timer = setTimeout(() => {
                    setRefresh(!refresh)
                  }, 100);
                }
              }
            }
          } else {
            const timer = setTimeout(() => {
              setRefresh(!refresh)
            }, 100);
          }
        }
      } catch (error) {
        console.log('modelling 80 ', error)
      }
    }
    if (!debug) console.log('modelling 106a ', router)

    getQuery()
    
    setMount(true)
  }, [])

  const contextDiv = ( // the top context area (green)
    <div className="context-bar d-flex" style={{ backgroundColor: "#cdd", width: "99%", maxHeight: "24px" }}>
      <SetContext className='setContext w-100' ph={props} style={{ backgroundColor: "#cdd", minWidth: "80%", maxWidth: "240px" }} />
      <div className="context-bar--context d-flex justify-content-between align-items-center " style={{ backgroundColor: "#dcc" }}>
        <SelectContext className='ContextModal mr-2' buttonLabel='Context' phData={props.phData} phFocus={props.phFocus} />
        <Link className="video p-2 m-2 text-primary" href="/videos"> Video </Link>
      </div>
    </div>
  )

  const modellingDiv = (mount)
    ? <div>
      <Layout user={props.phUser?.focusUser} >
        <div id="index" >
          <div className="wrapper" >
            {/* <div className="header" >
              <Header title={props.phUser?.focusUser.name} /> 
            </div> */}
            {/* {videoDiv} */}
            {contextDiv}
            <div className="workplace d-flex" >
              {/* {mount ? <>{contextDiv}</> : <>{contextDiv}</>} */}
              {/* <div className="tasksarea mr-1" style={{ backgroundColor: "#eed", borderRadius: "5px 5px 5px 5px" }} >
                <TasksHelp />
              </div> */}
              <div className="workarea p-1 w-100" style={{ backgroundColor: "#ddd" }}>
                {/* {refresh ? <> {modellingDiv} </> : <>{modellingDiv}</>} */}
                <Modelling />
              </div>
              <div className="contextarea">
              </div>
            </div>
            <div className="footer">
              <Footer />
            </div>
          </div>
        </div>
      </Layout>
    </div>
    : <>No model loaded</>

  return (
    <>
      {/* {modellingDiv} */}
      {refresh ? <> {modellingDiv} </> : <>{modellingDiv}</>}
      <style jsx>{`
   .wrapper {
     display: grid;
     height: 101%;
     min-height: 101%;
     grid-gap: 0px;
     grid-template-areas:
     "header"
     "workplace"
     "footer";
   }
   .workplace {
     grid-area: workplace;
     display: grid ;
     grid-template-columns: auto 1fr;
     grid-template-areas:
     "contextarea contextarea"
     "tasksarea workarea";
   }

   .contextarea {
     background-color: #e8e8e8;
   }
   .tasksarea {
     grid-area: tasksarea;
     padding: 0px;
     margin-right: 0px;
     padding-right: 3px;
     border: 2px;
     border-radius: 5px 5px 5px 5px;
     border-width: 2px;
     background-color: #ffe;
   }
   .workarea {
     grid-area: workarea;
     border-radius: 5px 5px 0px 0px;
     grid-template-columns: auto;
     grid-template-areas:
     "workpad";
   }
     .workpad {
       grid-area: workpad;
       display: grid;
       border-radius: 5px 5px 0px 0px;      
     }
   p {
     color: white;
   }
  `}</style>
    </>)
}
export default Page(connect(state => state)(page));
