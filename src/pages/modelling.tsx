//@ts-check
import React, { useState, useEffect } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { Router, useRouter } from "next/router";
import useLocalStorage from '../hooks/use-local-storage'
import useSessionStorage from '../hooks/use-session-storage'

import Page from '../components/page';
import Layout from '../components/Layout';
import Header from "../components/Header"
import Footer from "../components/Footer"
import Modelling from "../components/Modelling";
import SetContext from '../defs/SetContext'
import Context from "../components/Context"
import SelectContext from '../components/utils/SelectContext'
import Tasks from '../components/Tasks'
import { NavbarToggler } from "reactstrap";
import GenGojsModel from "../components/GenGojsModel";
import Issues from "../components/Project";

import { searchGithub } from '../components/githubServices/githubService' 


const debug = false
const useEfflog = console.log.bind(console, '%c %s', 'background: red; color: white'); // green colored console log
  
const page = (props: any) => {

  if (debug) console.log('38 modelling ', props)
  const dispatch = useDispatch()

  function dispatchLocalStore(locStore) {
    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: locStore.phData })
    dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: locStore.phFocus })
    dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: locStore.phSource })
    dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: locStore.phUser })
  }

  const { query } = useRouter(); // example: http://localhost:3000/modelling?repo=Kavca/kavca-akm-models&path=models&file=AKM-IRTV-Startup.json

  if (debug) console.log('32 modelling', props) //(props.phList) && props.phList);
  const [mount, setMount] = useState(false)
    const [isReloading, setIsReloading] = useState(false);
  // const [visible, setVisible] = useState(false)
  const [refresh, setRefresh] = useState(true);
  const [params, setParams] = useState(null);
  const [data, setData] = useState(null);
  const [refreshContext, setRefreshContext] = useState(true);
  const [render, setRender] = useState(false);
  const [visibleTasks, setVisibleTasks] = useState(true)
  const [memoryLocState, setMemoryLocState] = useSessionStorage('memorystate', []); //props);
  // const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', []); //props);
  const [focus, setFocus] = useState(props.phFocus)
  const [memoryAkmmUser, setMemoryAkmmUser] = useSessionStorage('akmmUser', ''); //props);
  // const [memoryAkmmUser, setMemoryAkmmUser] = useLocalStorage('akmmUser', ''); //props);
  const [visibleContext, setVisibleContext] = useState(false);
  const [akmmUser, setAkmmUser] = useState(props.phUser);

  function getUserSettings(key) {
    if (memoryAkmmUser !== '' && memoryAkmmUser !== null) {
      if (debug) console.log('63 Modelling', memoryAkmmUser)
      return memoryAkmmUser
    }
  }

  function setUserSettings(key, value) {
    if (debug) console.log('69 Modelling', value.appSkin.visibleContext)
    localStorage.setItem(key, JSON.stringify(value));
  }

  useEffect(() => {
    if ((window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).type === 'reload') {
      if (debug) console.log('73 modelling page reloaded', memoryLocState);
      if (memoryLocState?.phData) {
        const locStore = memoryLocState;
        if (debug) console.log('modelling 1 ', locStore);
        if (locStore) {
          const data = locStore;
          // {
          //   ...locStore,
          //   phFocus: {
          //     ...locStore.phFocus,
          //     ...focus,
          //   },
          // };
          if (debug) console.log('143 modelling ', data);
          dispatchLocalStore(data);
          // window.location.reload();
        }
      } else {
        if (window.confirm("No recovery model.  \n\n  Click 'OK' to recover or 'Cancel' to open intial project.")) {
          if (props.phFocus.focusProj.file === 'AKM-INIT-Startup_PR.json') {
            if (!isReloading) {
              setIsReloading(true);
              window.location.reload();
            }
            const timer = setTimeout(() => {
              setRefresh(!refresh);
            }, 100);
          }
        }
      }
    } 
  }, [])

  useEffect(() => {
    if (debug) console.log('89 modelling useEffect 1', query)//memoryLocState[0], props.phFocus.focusModelview.name)
  
    // let data = {}
    const getQuery = async () => {
      let focusProj = null;
      try {
        const queryParam = new URLSearchParams(window.location.search);
        if (debug) console.log('111 modelling queryParam', query, queryParam)
        const queryParams = queryParam.get('focus');
        // const queryParams = (queryParam) ? JSON.parse(JSON.stringify(queryParam?.focus)) : null;
        const params = JSON.parse(queryParams);
        if (debug) console.log('115 modelling params', params)
        const githubFile = params?.githubFile;

        if (githubFile) {
          focusProj = {
            org: githubFile.org,
            repo: githubFile.repo,
            branch: githubFile.branch,
            path: githubFile.path,
            file: githubFile.filename,
          } 
          const orgrepo = githubFile.org+'/'+githubFile.repo 
          console.log('127 modelling orgrepo:', orgrepo)
          const res = await searchGithub(orgrepo, githubFile.path, githubFile.filename, githubFile.branch, 'file')
          const githubData = await res.data
          const sha = await res.data.sha

          const data = {
            phData: githubData.phData,
            phFocus: {
              ...props.phFocus,
              focusProj: focusProj,
              focusModel:  params.focusModel,
              focusModelview: params.focusModelview,
              focusObject: params.focusObject,
              focusObjectview:  params.focusObjectview,
              focusRole: params.focusRole,
              focusTask: params.focusTask,
            },
            phSource: props.phSource,
            phUser: props.phUser,
            lastUpdate: props.lastUpdate,
          };
          // dispatchLocalStore(data); // dispatch to store the latest [0] from local storage
          dispatch({ type: 'LOAD_TOSTORE_DATA', data: data })
          const timer = setTimeout(() => {
            setRefresh(!refresh);
          } , 1000);

          
        } else if (focus && !githubFile) {
          if (debug) console.log('155 modelling', focus);
          if (params) {
            const data = {
              phFocus: {
                ...props.phFocus,
                focusProj: focusProj,
                focusModel:  params.focusModel,
                focusModelview: params.focusModelview,
                focusObject: params.focusObject,
                focusObjectview:  params.focusObjectview,
                focusRole: params.focusRole,
                focusTask: params.focusTask,
              },
            };
          
          dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: data })
          }
        }
      } catch (error) {
        console.log('174 modelling query error ', error);
      }
    }
      if (debug) console.log('177 modelling useEffect 1', query)//memoryLocState[0], props.phFocus.focusModelview.name)
      getQuery() 
      setMount(true)
    // }, [])
  }, []);


  const contextDiv = ( // the top context area (green)
    <div className="context-bar d-flex ps-4 " style={{ backgroundColor: "#cdd", width: "", maxHeight: ""}}>
      <SetContext className='setContext' ph={props} style={{ backgroundColor: "#cdd", minWidth: "80%"}} />
      <div className="context-bar--context d-flex justify-content-between align-items-center me-4" style={{ backgroundColor: "#dcc" }}>
        <SelectContext className='ContextModal mr-1' buttonLabel='Context' phData={props.phData} phFocus={props.phFocus} />
        {/* <Link className="video p-2 m-2 text-primary me-5" href="/videos"> Video </Link> */}
      </div>
    </div>
  )

  const modellingDiv = (mount)
    ? 
      <div>
        <Layout user={props.phUser?.focusUser} >
          <div id="index" >
            <div className="wrapper" > 
              {/* <div className="header" >
                <Header title={props.phUser?.focusUser.name} /> 
              </div> */}
              {/* {videoDiv} */}
                {contextDiv}
              <div className="workplace d-flex" style={{ zIndex: 1 }}>
                <div className="issuesarea " style={{ backgroundColor: "#fee", borderRadius: "5px 5px 5px 5px" }} >
                  <Issues props={props}/>
                </div>
                  <div className="workarea p-1 w-100" style={{ backgroundColor: "#ddd" }}>
                    <Modelling />
                  </div>
              <div className="tasksarea mr-1 " style={{ backgroundColor: "#ffe", borderRadius: "5px 5px 5px 5px" }}>
                <Tasks props={props}/>
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
  //  .wp {
  //    display: grid;
  //    height: 101%;
  //    min-height: 101%;
  //    grid-gap: 0px;
  //    grid-template-areas:
  //    "header "
  //    "issuesarea workplace tasksarea"
  //    "footer";
  //  }
  //  .workplace {
  //    grid-area: workplace;
  //    display: grid ;
  //    grid-template-columns: auto 1fr;
  //    grid-template-areas:
  //    "contextarea"
  //    "workarea ";
  //  }

  //  .contextarea {
  //    background-color: #e8e8e8;
  //  }
  //   .issuesarea {
  //     grid-area: issuesarea;
  //     padding: 0px;
  //     margin-right: 0px;
  //     padding-right: 3px;
  //     border: 2px;
  //     border-radius: 5px 5px 5px 5px;
  //     border-width: 2px;
  //     background-color: #ffe;
  //   }
  //  .tasksarea {
  //    grid-area: tasksarea;
  //    padding: 0px;
  //    margin-right: 0px;
  //    padding-right: 3px;
  //    border: 2px;
  //    border-radius: 5px 5px 5px 5px;
  //    border-width: 2px;
  //    background-color: #ffe;
  //  }
  //  .workarea {
  //    grid-area: workarea;
  //    border-radius: 5px 5px 0px 0px;
  //    grid-template-columns: auto;
  //    grid-template-areas:
  //    "workpad";
  //  }
  //    .workpad {
  //      grid-area: workpad;
  //      display: grid;
  //      border-radius: 5px 5px 0px 0px;      
  //    }
  //  p {
  //    color: white;
  //  }
  `}</style>
    </>)
}
export default Page(connect(state => state)(page));
