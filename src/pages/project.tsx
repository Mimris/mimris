// make a page for project
import { connect, useDispatch } from 'react-redux';
import React, { useState, useEffect } from "react";
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from "next/router";
import { loadData, setfocusRefresh } from '../actions/actions'
import useLocalStorage from '../hooks/use-local-storage'
import Page from '../components/page';
import Layout from '../components/Layout';
import Header from "../components/Header"
import Footer from "../components/Footer"
import GenGojsModel from '../components/GenGojsModel'
import SetContext from '../defs/SetContext'
import ProjectForm from '../components/ProjectForm';
import LoadGithubParams from '../components/loadModelData/LoadGithubParams';
import GithubParams from '../components/GithubParams';
import SelectContext from '../components/utils/SelectContext';
import ProjectDetailsModal from '../components/modals/ProjectDetailsModal';

import HeaderButtons from '../components/utils/HeaderButtons';

const debug = false

const clog = console.log.bind(console, '%c %s', // green colored cosole log
  'background: blue; color: white');
const useEfflog = console.log.bind(console, '%c %s', // green colored cosole log
  'background: red; color: white');
const ctrace = console.trace.bind(console, '%c %s',
  'background: blue; color: white');

const page = (props: any) => {
  // if (typeof window === 'undefined') return <></>  
  const dispatch = useDispatch()
  const [refresh, setRefresh] = useState(false)
  const { query } = useRouter(); // example: http://localhost:3000/modelling?repo=Kavca/kavca-akm-models&path=models&file=AKM-IRTV-Startup.json 
  if (debug) console.log('28 project', props, query)

  const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', []); //props);
  const [memoryAkmmUser, setMemoryAkmmUser] = useLocalStorage('akmmUser', ''); //props);
  const [mount, setMount] = useState(false)
  function dispatchLocalStore(locStore) {
    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: locStore.phData })
    dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: locStore.phFocus })
    dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: locStore.phSource })
    dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: locStore.phUser })
  }

  // list query params
  const [org, setOrg] = useState(props.phFocus.focusProj.org)
  const [repo, setRepo] = useState(props.phFocus.focusProj.repo)
  const [path, setPath] = useState(props.phFocus.focusProj.path)
  const [file, setFile] = useState(props.phFocus.focusProj.file)
  const [branch, setBranch] = useState(props.phFocus.focusProj.branch)
  const [focus, setFocus] = useState(props.phFocus.focusProj.focus)
  const [ghtype, setGhtype] = useState(props.phFocus.focusProj.ghtype)
  const [projectNumber, setProjectNumber] = useState(props.phFocus.focusProj.projectNumber) // this is the project number in the list of github projects


  console.log('39 project', org, repo, path, file, branch, focus, ghtype, projectNumber)
  // const issueUrl = `https://api.github.com/repos/${org}/${repo}/˝`
  const issueUrl = `https://api.github.com/repos/${org}/${repo}/issues`
  const collabUrl = `https://api.github.com/repos/${org}/${repo}/collaborators`
  const projectUrl = `https://api.github.com/repos/${org}/${repo}/projects/${projectNumber}`

  const [issues, setIssues] = useState([]);
  const [collabs, setCollabs] = useState([]);
  const [error, setError] = useState(null);

  function toggleRefresh() { // when refresh is toggled, first change focusModel if not exist then  save the current state to memoryLocState, then refresh
    if (debug) console.log('50 project', props) //, memoryLocState, (Array.isArray(memoryLocState)));
    // GenGojsModel(props, dispatch)
    // SaveModelToLocState(props, memoryLocState, setMemoryLocState)  // this does not work
    const timer = setTimeout(() => {
      setRefresh(!refresh)
    }, 100);
    return () => clearTimeout(timer);
  }

  useEffect(() => {

    if (!debug) console.log('82 project useEffect 1', query.repo)//memoryLocState[0], props.phFocus.focusModelview.name)
    const getQueryParams = async () => {
      try {

        // let data = {}
        if (debug) console.log('68 project', props.phFocus.focusProj.file)
        if (props.phFocus.focusProj.file === 'AKM-INIT-Startup__PR.json') {
          if ((memoryLocState != null) && (memoryLocState.length > 0) && (memoryLocState[0].phData)) {
            if ((window.confirm("Do you want to recover your last modelling edits? (last refresh) \n\n  Click 'OK' to recover or 'Cancel' to open intial project."))) {
              if (Array.isArray(memoryLocState) && memoryLocState[0]) {
                const locStore = (memoryLocState[0])
                if (locStore) {
                  dispatchLocalStore(locStore)
                  // data = {id: locStore.phFocus.focusModelview.id, name: locStore.phFocus.focusModelview.name}
                  // console.log('modelling 73 ', data)
                }
              }
            }
          }
        } else {
          setOrg(props.phFocus.focusProj.org)
          setRepo(props.phFocus.focusProj.repo)
          setPath(props.phFocus.focusProj.path)
          setFile(props.phFocus.focusProj.file)
          setBranch(props.phFocus.focusProj.branch)
          setFocus(props.phFocus.focusProj.focus)
          setProjectNumber(props.phFocus.focusProj.projectNumber)
          setGhtype(props.phFocus.focusProj.ghtype)
          setProjectNumber(props.phFocus.focusProj.projectNumber)
          const timer = setTimeout(() => {
            setRefresh(!refresh)
          }
            , 100);
          return () => clearTimeout(timer);
        }

      } catch (err) {
        setError(err);
      }
    }
    // if (!query.repo) {
    getQueryParams();
    // }
  }, [query.repo === ''])


  useEffect(() => { // when the page loads, set the focus
    console.log('61 project', query, query?.repo)
    const data = { id: query.org + query.repo + query.path + query.file + query.branch, name: query.repo, org: query.org, repo: query.repo, path: query.path, file: query.file, branch: query.branch, focus: query.focus, projectNumber: query.projectNumber, ghtype: query.ghtype  }
    console.log('65 project', data);
    (query.repo) && dispatch({ type: 'SET_FOCUS_PROJ', data });

    const { org, repo, path, file, branch, focus, ghtype, projectNumber } = query;
    console.log('69 project', org, repo, path, file, branch)
    dispatch({ type: 'LOAD_DATAGITHUB', data: query });
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_FOCUS_REFRESH', data: { id: Math.random().toString(36).substring(7), name: 'name' } })
    }, 100);
    return () => clearTimeout(timer);
  }, [query.repo !== undefined]);

  useEffect(() => {
    if (debug) useEfflog('126 project GenGojsModel run,  useEffect 6 [props.phFocus?.focusRefresh?.id]');
    GenGojsModel(props, dispatch);
    // const timer = setTimeout(() => {
    //   toggleRefresh()
    // }, 200);
    // return () => clearTimeout(timer);
  }, [props.phFocus?.focusRefresh?.id])

  // useEffect(() => {
  //   toggleRefresh(); // refresh the page
  // }, []);

  useEffect(() => {
    async function fetchData() { // fetch issues
      if (query.repo?.length > 0) {
        try {
        const { data } = await axios.get(issueUrl);
        setIssues(data);
        console.log('55 issues', data)
        } catch (err) {
          setError(err);
        }
      }
    }
    fetchData(); // call the function 
    if (error) {
      alert(error.response.data.message) // alert the error message
    }
  // }, [query.repo]);
  }, [query.repo !== '' && query.repo !== undefined]);


  // useEffect(() => {
  //   if (debug) console.log('54 modelling dispatchGithub', query, props.phFocus)
  //   if (!props.phFocus.focusProj.org) {
  //    prompt('Click OK to set focus project')
  //   }

  //   // if (!focus) focus =phFocus?.focusProj.focus || prompt("focus?");
  //   // if (!ghtype) ghtype = prompt("ghtype?");
  //   if (debug) console.log('62 GithubParams', org, repo, path, file, branch, focus, ghtype)
  //   // dispatch({type: 'SET_FOCUS_PROJ', data: {org: org, repo: repo, path: path, file: file, branch: branch, focus: focus, ghtype: ghtype} })
  //   const data = {id: org+repo+path+file, name: repo, org: org, repo: repo, path: path, file: file, branch: branch, focus: focus} 
  //   if (debug) console.log('65 GithubParams', data)
  //   dispatch({ type: 'SET_FOCUS_PROJ', data: data })
  //   const org1 = {id: org, name: org}
  //   dispatch({ type: 'SET_FOCUS_ORG', data: org1 })
  //   const repo1 = {id: 'role', name: ''}
  //   dispatch({ type: 'SET_FOCUS_REPO', data: repo1 })

  // }, [props.phFocus.focusProj.org]);

  const generatedUrl = `https://akmmclient-main.vercel.app/project?org=${org}&repo=${repo}&path=${path}&file=${file}&branch=${branch}&projectNumber=${projectNumber}&focus=${focus}&ghtype=${ghtype}`
  // https://akmmclient-main.vercel.app/project?org=kavca&repo=osdu-akm-models&path=production&file=AKM-Production-Measurements-Conceptmodel_PR.json
  const akmIrtvPopsMetamodelUrl = `http://localhost:3000/modelling?org=kavca&repo=kavca-akm-models&path=akm-metamodels&file=AKM-IRTV-POPS-Startup__PR.json&branch=main`
  // const akmIrtvPopsMetamodelUrl = `https://akmmclient-main.vercel.app/project?org=kavca&repo=kavca-akm-models&path=akm-metamodels&file=AKM-IRTV-POPS-Startup__PR.json&branch=main`

  const contextDiv = (
    <div className="contextarea d-flex" style={{ backgroundColor: "#cdd", width: "99%", maxHeight: "24px" }}>
      <SetContext className='setContext' ph={props} />
      <div className="contextarea--context d-flex justify-content-between align-items-center " style={{ backgroundColor: "#dcc" }}>
        {/* <Link className="home p-2 m-2 text-primary" href="/project"> Context </Link> */}
        <SelectContext className='ContextModal mr-2' buttonLabel='Context' phData={props.phData} phFocus={props.phFocus} />
        <Link className="video p-2 m-2 text-primary" href="/videos"> Video </Link>
      </div>
    </div>
  )

  const projectParamsDiv = // (props.phFocus?.focusProj?.org) &&  // top of page
    <>
      <div className='container' style={{ fontSize: '0.9rem' }}>
        {/* <div className="m-5"> */}
        {/* {(query.repo) && <h5>Url-Paremeters: {query.repo} / {query.path} / {query.file}</h5> } */}
        {props.phFocus?.focusProj?.name}
        <GithubParams phFocus={props.phFocus} />
        {/* {(refresh) ? <GithubParams phFocus={props.phFocus} />  : <><GithubParams phFocus={props.phFocus} />aaaa</>  } */}
        <h5>Initial Startup model loaded !</h5>
        {/* </div> */}
      </div>
      {/* <hr  className='mx-5 p-2 bg-success' /> */}
    </>

  const projectFormDiv =
    <>
      <div className="cur-context-focus">
        {/* <h5 className='m-3 p-2 bg-white'>Current Project: {props.phData.metis.name} | File: {props.phSource}</h5>  */}
        <ProjectForm phFocus={props.phFocus} />
      </div>
    </>

  const renderDiv =
    <>
      <Layout user={props.phUser?.focusUser} >
        <div id="index" >
          <div className="wrapper m-1 pr-2 d-flex flex-column" style={{ backgroundColor: "#cdd", borderRadius: "5px 5px 5px 5px" }} >
            {/* <div className="header">
                <Header title='eaderTitle' />
              </div> */}
            {contextDiv}
            {/* <HeaderButtons phData={props.phData} phFocus={props.phFocus} refresh={refresh} setRefresh={setRefresh} toggleRefresh={toggleRefresh} dispatch={dispatch} />   */}
            <div className="workplace-focus gap " >
              <div className="aside-left fs-6 m-1 p-2 " style={{ backgroundColor: "#cdd", borderRadius: "5px 5px 5px 5px" }} >
                <h6 className='text-muted pt-2'>Links to Github :</h6>
                <div className='bg-light px-2 m-1 w-100'> {/*link to repo */}
                  <div className='text-muted'>Repository :</div>
                  {(repo) && <Link className='text-primary ' href={`https:/github.com/${org}/${repo}`} target="_blank"> {org}/{repo}</Link>}
                </div>
                <div className='bg-light px-2 m-1 w-100'> {/*link to repo */}
                  <div className='text-muted'>GitHub Docs :</div>
                  {(repo) && <Link className='text-primary ' href={`https:/${org}.github.io/${repo}`} target="_blank"> {repo}</Link>}
                </div>
                <div className='bg-light px-2 m-1 w-100'> {/*link to Issues */}
                  <div className='text-muted'>Issues for this repo:</div>
                  {(repo) && <Link className='text-primary ' href={`https:/github.com/${org}/${repo}/issues`} target="_blank">{org}/{repo}</Link>}
                </div>
                <div className='bg-light px-2 m-1 w-100'> {/*link to canban */}
                  <div className='text-muted'>Project Canban for this repo:</div>
                  {(org) && <Link className='text-primary ' href={`https:/github.com/orgs/${org}/projects/${projectNumber}`} target="_blank"> {org}/{repo}/project/{projectNumber}</Link>}
                </div>
                <h6 className='text-muted pt-2'>Other GitHub links :</h6>
                {/* <div className='bg-light px-2 m-1 w-100'> 
                  <div className='text-muted'>GitHub :</div>
                  {(org) && <Link className='text-primary ' href={`https:/github.com/${org}`} target="_blank"> {org}</Link>}
                </div> */}

                {/* <div className='bg-light px-2 m-1 w-100'> 
                  <div className='text-muted'>Path :</div>
                  {(repo)
                    ? (path)
                      ? <Link className='text-primary ' href={`https:/github.com/${org}/${repo}/tree/${branch}/${path}/`} target="_blank"> {org}/{repo}/tree/{branch}/{path}/</Link>
                      : <Link className='text-primary ' href={`https:/github.com/${org}/${repo}/tree/${branch}/`} target="_blank"> {org}/{repo}/{branch}/</Link>
                    : <></>
                  }
                </div> */}
               {/* Listing GitHub Issues */}
              <div >
                <h2 className='text-muted fs-6 p-2'>GitHub Issues :</h2>
                {(issues.length > 0) && issues.map((issue) => (
                  <div className='bg-light fs-6  m-2 p-2' key={issue.id}>
                    <div className='d-flex justify-content-between'>
                      <Link className='text-primary' href={issue.html_url} target="_blank"># {issue.number} - {issue.state} - {issue.created_at.slice(0, 10)}</Link>
                      <div className='text-muted'>{issue.user.name}</div>
                    </div>
                    <h6>{issue.title}</h6>
                    {/* <p className='text-secondary m-2'>{issue.body}</p> */}
                    <div className='text-muted'>Created by: {issue.user.login} - Assignee: {issue.assignees[0]?.login} </div>
                  </div>
                ))}
              </div>
              </div>
              {/* List the modelling params and link to modelling page */}
              <div className=" main m-1 fs-6 " style={{ backgroundColor: "#cdd", borderRadius: "5px 5px 5px 5px" }}>
                {projectParamsDiv}
                {/* {(refresh) ? <>{projectParamsDiv}</> : <> {projectParamsDiv} </>} */}
                <div className="d-flex justify-content-between rounded bg-light m-2 p-2 ">
                  <button className='rounded mt-2 px-2 '>
                    <Link className='text-primary ' href="/modelling">Start Modelling</Link>
                  </button>
                  <ProjectDetailsModal props={props} />
                  {/* <ProjectDetailsModal props={props} onSubmit={(details) => console.log(details)} /> */}
                </div>
                <div className="rounded bg-light m-2 p-2">
                  <div className='ronded p-1 text-secondary '>Copy the text below, to send the project-link to others:</div>
                  <span className='rounded  p-2' style={{ fontSize: '0.6rem', backgroundColor: '#dde' }}>{generatedUrl} </span>
                </div>
                {/* <div className="rounded bg-light m-2 p-2">
                  <div className='ronded p-1 text-secondary '>Click the link below to open the IRTV-POPS-Startup project. </div>
                  <span className='rounded  p-2' style={{ fontSize: '0.6rem', backgroundColor: '#dde' }}>{akmIrtvPopsMetamodelUrl} </span>
                  <a href={akmIrtvPopsMetamodelUrl} target="_blank">Open IRTV-POPS-Startup</a>
                </div> */}
                {projectFormDiv}
              </div>
            </div>
            {/* <div className="aside-right  " style={{ minWidth: "2rem" }} >
            </div> */}
            <div className="footer">
              <Footer />
            </div>
          </div>
        </div>
        <style jsx>{`
          .main { grid-area: main;}
          .focusarea { grid-area: focusarea;}
          .workplace-focus { grid-area: workplace-focus;}
          .aside-left { grid-area: aside-left;}
          .aside-right { grid-area: aside-right;}
          .workplace-focus {
            display: grid;
            grid-template-columns: 1fr 2fr auto;
            grid-template-areas:
              "focusarea focusarea focusarea"
              "aside-left main aside-right"
              "aside-left main aside-right"
          }
          .workplace-focus > div {
            padding: 1px;
            font-size: 20px;
          }
          .aside-right {
            background-color: #abb;
            margin: 4px;
            border-radius: 5px 5px 5px 5px;
          }
        ` }
        </style>
      </Layout>
    </>

  return (
    (refresh) ? <>{renderDiv}</> : <> {renderDiv} </>
  )
}

export default connect((state: any) => state)(page)







