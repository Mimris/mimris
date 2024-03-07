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
import ContextView from "../defs/ContextView"
import Context from "../components/FocusDetails"
import Tasks from '../components/Tasks'
import { NavbarToggler } from "reactstrap";
import GenGojsModel from "../components/GenGojsModel";
import Project from "../components/Project";
import Issues from "../components/Issues";

import { searchGithub } from '../components/githubServices/githubService'
import { ProjectMenuBar } from "../components/loadModelData/ProjectMenuBar";


const debug = false
const useEfflog = console.log.bind(console, '%c %s', 'background: red; color: white'); // green colored console log

const page = (props: any) => {

  if (debug) console.log('38 modelling ', props)
  const dispatch = useDispatch()

  const [toggleRefresh, setToggleRefresh] = useState(false)

  const [showModal, setShowModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [focusExpanded, setFocusExpanded] = useState(false);
  const [minimized, setMinimized] = useState(true);
  // const [org, setOrg] = useState("");
  // const [repo, setRepo] = useState("");
  // const [branch, setBranch] = useState("");
  // const [path, setPath] = useState("");
  // const [file, setFile] = useState("");
  // const [model, setModel] = useState("");
  // const [modelview, setModelview] = useState("");



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


  useEffect(() => {

    if ((window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).type === 'reload') {
      if (debug) console.log('81 modelling page reloaded', memoryLocState);
      if (memoryLocState?.phData) {
        const locStore = memoryLocState;
        if (debug) console.log('modelling 1 ', locStore);
        if (locStore) {
          const data = locStore;
          if (debug) console.log('87 modelling ', data);
          dispatchLocalStore(data);
          // window.location.reload();
            const timer = setTimeout(() => {
              setRefresh(!refresh);
            }, 100);
            return () => clearTimeout(timer);
        }
      } else {
        if (debug) console.log('92 modelling page not reloaded', memoryLocState);
        if (window.confirm("No recovery model.  \n\n  Click 'OK' to recover or 'Cancel' to open intial project.")) {
          if (props.phFocus.focusProj.file === 'AKM-INIT-Startup_PR.json') {
            if (!isReloading) {
              setIsReloading(true);
              window.location.reload();
            }
            const timer = setTimeout(() => {
              setRefresh(!refresh);
            }, 100);
            return () => clearTimeout(timer);
          }
        }
      }
    } else {
      if (debug) console.log('104 modelling page not reloaded', memoryLocState);
    }
  }, [!query])

  let org = query.org;
  let repo = query.repo;
  let path = query.path;
  let branch = query.branch;
  let file = query.file;
  let model = query.model;
  let modelview = query.modelview;
    
  useEffect(() => {
    if (debug) console.log('89 modelling useEffect 1', query)//memoryLocState[0], props.phFocus.focusModelview.name)
    // let data = {}
    const getQuery = async () => {
      let focusProj = null;
      try {
        if (query) {
          if (debug) console.log('120 modelling query', query, query)
          org = query.org;
          repo = query.repo;
          path = query.path;
          branch = query.branch;
          file = query.file;
          model = query.model;
          modelview = query.modelview;
        
          if (debug) console.log('132 modelling query', org, repo, path, branch, file, model, modelview)
          const res = await searchGithub(org+'/'+repo, path, file, branch, 'file')
          const githubData = await res.data
          const sha = await res.data.sha

          console.log('138 modelling githubData:', githubData, sha)
          dispatch({ type: 'LOAD_TOSTORE_DATA', data: githubData })
          const timer = setTimeout(() => {
            setRefresh(!refresh);
          } , 200);


          let curmodel = githubData.phData.metis.models.find(m => m.id === model)
          if (!curmodel) curmodel = githubData.phData.metis.models.find(m => m.name === model)
          console.log('83 model curmodel', curmodel.modelviews, modelview)
          let curmodelview = curmodel.modelviews.find(v => v.id === modelview)
          if (!curmodelview) curmodelview = curmodel.modelviews.find(v => v.name === modelview)

          const data = {
            phFocus: {
              ...props.phFocus,
              focusProj: focusProj,
              focusModel: params.focusModel,
              focusModelview: params.focusModelview,
              focusObject: params.focusObject,
              focusObjectview: params.focusObjectview,
              focusRole: params.focusRole,
              focusTask: params.focusTask,
            },
          };
          dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: data })
        }    
      } catch (error) {
        console.log('117 modelling query error ', error);
      }

    }
    if (debug) console.log('168 modelling useEffect 1', query, org)//memoryLocState[0], props.phFocus.focusModelview.name)
    const timer = setTimeout(() => {
      getQuery()
    }
      , 1000);
    setMount(true)
  }, []);

  {/* <Link className="video p-2 m-2 text-primary me-5" href="/videos"> Video </Link> */ }
  const contextDiv = (focusExpanded  &&  // the top context area (green)
    <div className="" style={{ backgroundColor: "#bdd" }}>
      {/* <SelectContext className='ContextModal' buttonLabel={<i className="fas fa-edit fa-lg text-primary" style={{ backgroundColor: "#dcc" }}></i>} phData={props.phData} phFocus={props.phFocus} /> */}
      <ContextView ph={props} 
        showModal={showModal} 
        setShowModal={setShowModal}  
        showIssueModal={showIssueModal} setShowIssueModal={setShowIssueModal} 
      />
    </div>
  )

  const modellingDiv = (mount)
    ?
    <div>
      <Layout user={props.phUser?.focusUser}>
        <div id="index">
          <div className="wrapper">
            {/* <div className="header" >
              <Header title={props.phUser?.focusUser.name} /> 
            </div> */}
            <ProjectMenuBar props={props} 
               expanded={expanded} setExpanded={setExpanded}  
                focusExpanded={focusExpanded} setFocusExpanded={setFocusExpanded} 
                toggleRefresh={toggleRefresh} setToggleRefresh={setToggleRefresh}         
               />
            <div className="context-bar d-flex justify-content-between align-items-center"
              style={{ backgroundColor: "#ffffea"}}>
              {focusExpanded && <>
              <div className="issuesarea">
                <Issues props={props} 
                  showModal={showModal} setShowModal={setShowModal} 
                  showIssueModal={showIssueModal} setShowIssueModal={setShowIssueModal} 
                  minimized={minimized} setMinimized={setMinimized} 
                  expanded={expanded}
                />
              </div>
              <div className="contextarea">
                {contextDiv}
              </div>
              <div className="tasksarea mr-1 bg-transparent" style={{backgroundColor: "#ffe", borderRadius: "5px 5px 5px 5px" }}>
                <Tasks taskFocusModel={undefined} asPage={false} visible={false} props={props} />
              </div>
              </>
               }
            </div>
            <div className="workplace d-flex" style={{backgroundColor: "#b0cfcf", zIndex: 1 }}>
              <Link className="link " href={`/model?org=${org}&repo=${repo}&path=${path}&branch=${branch}&file=${file}&model=${model}&modelview=${modelview}`}
                target="_blank"
                style={{position: "absolute", marginRight: "9px", marginTop: "8px", right: "0", top: "", color: "gray"}}
                >
                <i className="fas fa-external-link-alt" aria-hidden="true"></i>
              </Link>
              <div className="workarea p-1 w-100" style={{ backgroundColor: "#bcc" }}>
                <Modelling toggleRefresh={toggleRefresh} />
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
