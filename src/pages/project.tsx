// make a page for project
import { connect, useDispatch } from 'react-redux';
import React, { useState, useEffect } from "react";
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from "next/router";
import { loadData, setfocusRefresh } from '../actions/actions'
import Page from '../components/page';
import Layout from '../components/Layout';
import Header from "../components/Header"
import Footer from "../components/Footer"
import SetContext from '../defs/SetContext'
import ProjectForm from '../components/ProjectForm';
import LoadGithubParams from '../components/loadModelData/LoadGithubParams';
import GithubParams from '../components/GithubParams';
import SelectContext from '../components/utils/SelectContext';
import ProjectDetailsModal from '../components/modals/ProjectDetailsModal';

import HeaderButtons from '../components/utils/HeaderButtons';

const debug = false

const page = (props: any) => {
  // if (typeof window === 'undefined') return <></>  
  const dispatch = useDispatch()  
  const [refresh, setRefresh] = useState(false)
  const {query} = useRouter(); // example: http://localhost:3000/modelling?repo=Kavca/kavca-akm-models&path=models&file=AKM-IRTV-Startup.json 
  if (debug) console.log('28 project',props, query)
  // list query params

  const [org, setOrg] = useState(query.org ? query.org : props.phFocus.focusProj.org)
  const [repo, setRepo] = useState(query.repo ? query.repo : props.phFocus.focusProj.repo)
  const [path, setPath] = useState(query.path ? query.path : props.phFocus.focusProj.path)
  const [file, setFile] = useState(query.file ? query.file : props.phFocus.focusProj.file)
  const [branch, setBranch] = useState(query.branch ? query.branch : props.phFocus.focusProj.branch)
  const [focus, setFocus] = useState(props.phFocus)
  const [ghtype, setGhtype] = useState('file')


  console.log('39 project', query, org, repo, path, file, branch, focus, ghtype, props ) 
  // const issueUrl = `https://api.github.com/repos/${org}/${repo}/˝`
  const issueUrl = `https://api.github.com/repos/${org}/${repo}/issues`
  const collabUrl = `https://api.github.com/repos/${org}/${repo}/collaborators`

  const [issues, setIssues] = useState([]);
  const [collabs, setCollabs] = useState([]);
  const [error, setError] = useState(null);

  function toggleRefresh() { // when refresh is toggled, first change focusModel if not exist then  save the current state to memoryLocState, then refresh
    // if (debug) console.log('71 Modelling', focusModel, props) //, memoryLocState, (Array.isArray(memoryLocState)));
    // GenGojsModel(props, dispatch)
    // SaveModelToLocState(props, memoryLocState, setMemoryLocState)  // this does not work
    const timer = setTimeout(() => {
      setRefresh(!refresh)
    }, 100);
    return () => clearTimeout(timer);
  } 

  const handleGithubParams = (query) => {
    if (query.repo) {
    const { org, repo, path, file, branch, focus, ghtype } = query;
    dispatch({ type: 'LOAD_DATAGITHUB', data: query });
    const data = { id: org + repo + path + file, name: repo, org, repo, path, file, branch, focus };
    dispatch({ type: 'SET_FOCUS_PROJ', data });
    const org1 = { id: org, name: org };
    dispatch({ type: 'SET_FOCUS_ORG', data: org1 });
    const repo1 = { id: 'role', name: '' };
    dispatch({ type: 'SET_FOCUS_REPO', data: repo1 });
    }
    const timer = setTimeout(() => {
    // dispatch({type: 'SET_REFRESH', data: {refresh: true} })
    // setRefresh(!refresh)
    }, 1000);
    return () => clearTimeout(timer);
  };
    
  useEffect(() => {
    if (query.repo) handleGithubParams(query);
    toggleRefresh();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get(issueUrl);
        setIssues(data);
        console.log('55 issues', data)
      } catch (err) {
        setError(err);
      }
    }
    fetchData(); 

    // show error message popup
    if (error) {
      // console.log('78 error', error.response.data.message)
      alert(error.response.data.message)
    }
  }, [props.phFocus.focusProj.org !== '']);


  // useEffect(() => {
  //   if (!debug) console.log('54 modelling dispatchGithub', query, props.phFocus)
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

  const generatedUrl = `https://akmmclient-main.vercel.app/project?org=${org}&repo=${repo}&path=${path}&file=${file}&branch=${branch}`
  // https://akmmclient-main.vercel.app/project?org=kavca&repo=osdu-akm-models&path=production&file=AKM-Production-Measurements-Conceptmodel_PR.json

  const contextDiv = (
    <div className="contextarea d-flex" style={{backgroundColor: "#cdd" ,width: "99%", maxHeight: "24px"}}> 
      <SetContext className='setContext' ph={props} />
      <div className="contextarea--context d-flex justify-content-between align-items-center " style={{ backgroundColor: "#dcc"}}>
        {/* <Link className="home p-2 m-2 text-primary" href="/project"> Context </Link> */}
        <SelectContext className='ContextModal mr-2' buttonLabel='Context' phData={props.phData} phFocus={props.phFocus} /> 
        <Link className="video p-2 m-2 text-primary" href="/videos"> Video </Link>
      </div>
    </div>
  )

  const projectParamsDiv =// (props.phFocus?.focusProj?.org) &&  // top of page
    <>
      <div className='container' style={{  fontSize: '0.9rem'}}>
        {/* <div className="m-5"> */}
          {/* {(query.repo) && <h5>Url-Paremeters: {query.repo} / {query.path} / {query.file}</h5> } */}
          {props.phFocus?.focusProj?.name}
          <GithubParams phFocus={props.phFocus} />  
          <h5>Initial Startup model loaded !</h5> 
        {/* </div> */}
      </div>
      <ProjectDetailsModal props={props} onSubmit={(details) => console.log(details)} />
      {/* <hr  className='mx-5 p-2 bg-success' /> */}
    </>
  
  const projectFormDiv =
    <>
      <div className="">
        {/* <h5 className='m-3 p-2 bg-white'>Current Project: {props.phData.metis.name} | File: {props.phSource}</h5>  */}
        <ProjectForm phFocus={props.phFocus} />
      </div>
    </>
 
  return (
    <>
      <Layout user={props.phUser?.focusUser} >
        <div id="index" >
          <div className="wrapper m-1 pr-2 d-flex flex-column" style={{  backgroundColor: "#cdd", borderRadius: "5px 5px 5px 5px" }} >
              {/* <div className="header">
                <Header title='eaderTitle' />
              </div> */}
                {contextDiv}  
                <HeaderButtons phData={props.phData} phFocus={props.phFocus} refresh={refresh} setRefresh={setRefresh} toggleRefresh={toggleRefresh} dispatch={dispatch} />  
              <div className="workplace-focus gap " >               
                <div className="aside-left fs-6 m-1 p-2 " style={{  backgroundColor: "#cdd", borderRadius: "5px 5px 5px 5px" }} >
                  <h6 className='text-muted pt-2'>Links to Github :</h6>
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
                    {(org) && <Link className='text-primary ' href={`https:/github.com/orgs/${org}/projects`} target="_blank"> {org}/{repo} project</Link>}
                  </div>
                  <h6 className='text-muted pt-2'>Other GitHub links :</h6>
                  <div className='bg-light px-2 m-1 w-100'> {/*link to the top of github (org) */}
                    <div className='text-muted'>GitHub :</div>
                    {(org) && <Link className='text-primary ' href={`https:/github.com/${org}`} target="_blank"> {org}</Link>}
                    {/* {(org && repo && path) 
                      ? <Link className='text-primary ' href={`https:/github.com/${org}/${repo}/tree/${branch}/${path}`} target="_blank"> {org}</Link>
                      : <Link className='text-primary ' href={`https:/github.com/kavca/.github/`} target="_blank">Kavca</Link>} */}
                  </div>
                  <div className='bg-light px-2 m-1 w-100'> {/*link to repo */}
                    <div className='text-muted'>Repository :</div>
                    {(repo) && <Link className='text-primary ' href={`https:/github.com/${org}/${repo}`} target="_blank"> {org}/{repo}</Link>}
                  </div>
                  <div className='bg-light px-2 m-1 w-100'> {/*link to repo */}
                    <div className='text-muted'>Path :</div>
                      {(repo) 
                        ? (path) 
                          ? <Link className='text-primary ' href={`https:/github.com/${org}/${repo}/tree/${branch}/`} target="_blank"> {org}/{repo}/{branch}/</Link>
                          : <Link className='text-primary ' href={`https:/github.com/${org}/${repo}/tree/${branch}/${path}/`} target="_blank"> {org}/{repo}/tree/{branch}/{path}/</Link>
                        : <></>
                      }
                    </div>
                </div>
                {/* List the modelling params and link to modelling page */}
                <div className=" main m-1 fs-6 " style={{ backgroundColor: "#cdd", borderRadius: "5px 5px 5px 5px" }}>
                    {projectParamsDiv}

                    <div className="rounded bg-light m-2 p-2 ">
                      <button className='rounded mt-2 px-2 '>
                          <Link className='text-primary ' href="/modelling">Start Modelling</Link>
                      </button>
                    </div>   
                    <div className="rounded bg-light m-2 p-2">
                      <div className='ronded p-1 text-secondary '>Copy the text below, to send the project-link to others:</div>  
                      <span className='rounded  p-2' style={{fontSize: '0.6rem', backgroundColor: '#dde'}}>{generatedUrl} </span>  
                    </div>
                    {projectFormDiv}     
                </div>
                {/* Listing GitHub Issues */}
                <div className="aside-right fs-4 " style={{minWidth: "20rem"}}>
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

              <div className="footer">
                <Footer />
              </div>
          </div>
        </div>
        <style jsx>{ `
          .main { grid-area: main;}
          .focusarea { grid-area: focusarea;}
          .workplace-focus { grid-area: workplace-focus;}
          .aside-left { grid-area: aside-left;}
          .aside-right { grid-area: aside-right;}
          .workplace-focus {
            display: grid;
            grid-template-columns: auto 2fr 1fr;
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
  )
}

export default connect((state: any) => state)(page)







