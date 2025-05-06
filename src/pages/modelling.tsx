// @ts-nocheck
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

const Page1 = (props: any) => {

  const dispatch = useDispatch();

  // const [toggleRefresh, setToggleRefresh] = useState(false)
  const [showModal, setShowModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [focusExpanded, setFocusExpanded] = useState(false);
  const [minimized, setMinimized] = useState(true);
  const [visibleFocusDetails, setVisibleFocusDetails] = useState(false) // show/hide the focus details (right side)
  const [exportTab, setExportTab] = useState(0);


  function dispatchLocalStore(locStore: any) {
    // filter out null models and metamodels
    let metis = locStore.phData.metis
    const metamodels = locStore.phData.metis.metamodels.filter((mm: any) => mm)
    const models = locStore.phData.metis.models.filter((m: any) => m)
    metis = { ...metis, models, metamodels }
    const phData = { ...locStore.phData, metis }
    const focusModel = models.find(m => m.id === focus.focusModel?.id) || models[0]
    const focusModelview = focusModel.modelviews.find(mv => mv.id === focus.focusModelview?.id) || focusModel.modelviews[0]
    const phFocus = {
      ...locStore.phFocus,
      focusModel: focusModel,
      focusModelview: focusModelview,
    }
    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: phData })
    dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: phFocus })
    dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: locStore.phSource })
    dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: locStore.phUser })
  }

  const { query } = useRouter(); // example: http://localhost:3000/modelling?repo=Kavca/kavca-akm-models&path=models&file=AKM-IRTV-Startup.json

  if (debug) console.log('51 modelling', props) //(props.phList) && props.phList);
  const [mount, setMount] = useState(false)
  const [isReloading, setIsReloading] = useState(false);
  // const [visible, setVisible] = useState(false)
  const [refresh, setRefresh] = useState(true);
  const [params, setParams] = useState(null);
  // const [data, setData] = useState(null);
  const [refreshContext, setRefreshContext] = useState(true);
  // const [render, setRender] = useState(false);
  const [visibleTasks, setVisibleTasks] = useState(true)
  const [memorySessionState, setMemorySessionState] = useSessionStorage('memorystate', []); //props);
  const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', []); //props);
  // const [focus, setFocus] = useState(props.phFocus)
  const [memoryAkmmUser, setMemoryAkmmUser] = useSessionStorage('akmmUser', ''); //props);
  // const [memoryAkmmUser, setMemoryAkmmUser] = useLocalStorage('akmmUser', ''); //props);
  const [visibleContext, setVisibleContext] = useState(false);
  const focus = useSelector((state: any) => state.phFocus)

  useEffect(() => {
    if (debug) useEfflog('71 modelling useEffect 0 [] ');
    const handleReload = () => {
      let locStore = memorySessionState;
      if (debug) console.log('81 modelling page reloaded', memorySessionState);
      if (!memorySessionState) locStore = memoryLocState;
      if (debug) console.log('79modelling 1 ', locStore);
      if (locStore && locStore.phData) {
        const data = locStore;
        if (debug) console.log('87 modelling ', data);
        dispatchLocalStore(data);
        return () => clearTimeout(timer);
      } else {
        if (debug) console.log('92 modelling page not reloaded', memorySessionState[0]);
        if (window.confirm("No recovery model.  \n\n  Click 'OK' to recover or 'Cancel' to open initial project.")) {
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
    };
    const shouldReload = Object.keys(query).length !== 0 && memorySessionState[0] && mount;
    handleReload();
    let org = query.org;
  }, [])


  let org = query.org;
  let repo = query.repo;
  let path = query.path;
  let branch = query.branch;
  let file = query.file;
  let model = query.model;
  let modelview = query.modelview;

  useEffect(() => {
    if (debug) console.log('118 modelling useEffect 1', query)
    // let data = {}
    const getQuery = async () => {
      let focusProj = null;
      try {
        if (Object.keys(query).length !== 0) {
          if (debug) console.log('120 modelling query', query, query)
          org = props.phFocus.focusProj.org;
          repo = props.phFocus.focusProj.repo;
          path = props.phFocus.focusProj.path;
          branch = props.phFocus.focusProj.branch;
          file = props.phFocus.focusProj.file;
          model = props.phFocus.focusProj.model;
          modelview = props.phFocus.focusProj.modelview;

          if (debug) console.log('132 modelling query', org, repo, path, branch, file, model, modelview)
          const res = await searchGithub(org + '/' + repo, path, file, branch, 'file')
          const githubData = await res?.data
          const sha = await res?.data.sha
          if (debug) console.log('145 modelling githubData:', githubData, sha)
          dispatch({ type: 'LOAD_TOSTORE_DATA', data: githubData })
          const timer = setTimeout(() => {
            setRefresh(!refresh);
          }, 200);
          let curmodel = githubData.phData.metis.models.find(m => m.id === model)
          if (!curmodel) curmodel = githubData.phData.metis.models.find(m => m.name === model)
          if (debug) console.log('83 model curmodel', curmodel.modelviews, modelview)
          let curmodelview = curmodel.modelviews.find(v => v.id === modelview)
          if (!curmodelview) curmodelview = curmodel.modelviews.find(v => v.name === modelview)
          const data = (params) && {
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
        } else {
          org = props.phFocus.focusProj.org;
          repo = props.phFocus.focusProj.repo;
          path = props.phFocus.focusProj.path;
          branch = props.phFocus.focusProj.branch;
          file = props.phFocus.focusProj.file;
          model = props.phFocus.focusProj.model;
          modelview = props.phFocus.focusProj.modelview;
        }
      } catch (error) {
        if (debug) console.log('174 modelling query error ', error);
      }
    }
    // setVisibleFocusDetails(true)
    if (debug) console.log('178 modelling useEffect 1', query, org, props)
    const timer = setTimeout(() => {
      getQuery()
    }, 1000);
    if (debug) console.log('172 modelling useEffect 1', query, org, props)
    setMount(true)
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const locProps = { ...props, phMymetis: null }
    setMemorySessionState(locProps)
  }, [props.phSource])

  {/* <Link className="video p-2 m-2 text-primary me-5" href="/videos"> Video </Link> */ }
  const contextDiv = ( //focusExpanded  &&  // the top context area (green)
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
            <ProjectMenuBar {...props}
              expanded={expanded} setExpanded={setExpanded}
              focusExpanded={focusExpanded} setFocusExpanded={setFocusExpanded}
              refresh={refresh} setRefresh={setRefresh}
              visibleFocusDetails={visibleFocusDetails}
              setVisibleFocusDetails={setVisibleFocusDetails}
              exportTab={exportTab} setExportTab={setExportTab}
            />
            <div className="context-bar  pt-0"
              style={{ backgroundColor: "#b0cfcf" }}>
              {focusExpanded &&
                <div className="d-flex justify-content-start align-items-center" style={{ backgroundColor: "#fffffd" }}>
                  <div className="issuesarea" >
                    <Issues {...props}
                      showModal={showModal} setShowModal={setShowModal}
                      showIssueModal={showIssueModal} setShowIssueModal={setShowIssueModal}
                      minimized={minimized} setMinimized={setMinimized}
                      expanded={expanded}
                    />
                  </div>
                  <div className="contextarea">
                    {contextDiv}
                  </div>
                  {/* <div className="tasksarea mr-1 bg-transparent" style={{ backgroundColor: "#ffe", borderRadius: "5px 5px 5px 5px" }}>
                    <Tasks taskFocusModel={undefined} asPage={false} visible={false} props={props} />
                  </div> */}
                </div>
              }
            </div>
            <div className="workplace d-flex" style={{ backgroundColor: "#b0cfcf", zIndex: 1 }}>
              <Link className="link " href={`/model?org=${focus.focusProj.org}&repo=${focus.focusProj.repo}&path=${focus.focusProj.path
                }&branch=${focus.focusProj.branch}&file=${focus.focusProj.file}&model=${focus.focusModel.name}&modelview=${focus.focusModelview.name}`}
                target="_blank"
                style={{ position: "absolute", marginRight: "9px", marginTop: "8px", right: "0", top: "", color: "lightgray" }}
              >
                <i className="fas fa-external-link-alt" aria-hidden="true"></i>
              </Link>
              <div className="workarea p-1 w-100" style={{ backgroundColor: "#bcc" }}>
                <Modelling {...props}
                  visibleFocusDetails={visibleFocusDetails}
                  setVisibleFocusDetails={setVisibleFocusDetails}
                  exportTab={exportTab}
                />
                {/* <Modelling toggleRefresh={toggleRefresh} /> */}
              </div>
            </div>
            <div className="footer me-4 w-100">
              <Footer {...props} />
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
export default Page(connect(state => state)(Page1));
