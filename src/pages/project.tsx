// make a page for project
import { connect, useDispatch } from 'react-redux';
import React, { useState, useEffect } from "react";
// import client from '@sanity/client'
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
import SelectContext from '../components/SelectContext';
import Q from 'q';

const debug = false

const page = (props: any) => {
    
  const dispatch = useDispatch()  
  
  const {query} = useRouter(); // example: http://localhost:3000/modelling?repo=Kavca/kavca-akm-models&path=models&file=AKM-IRTV-Startup.json
  
  // console.log('19 project',props, query)

  // list query params
  const org = props.phFocus.focusProj.org
  const repo = props.phFocus.focusProj.repo
  const path = props.phFocus.focusProj.path
  const file = props.phFocus.focusProj.file
  const branch = props.phFocus.focusProj.branch
  const focus = props.phFocus
  const ghtype = 'file'

  // const issueUrl = `https://api.github.com/repos/${org}/${repo}/˝`
  const issueUrl = `https://api.github.com/repos/${org}/${repo}/issues`
  const collabUrl = `https://api.github.com/repos/${org}/${repo}/collaborators`

  // if query object is not empty object
  // useEffect(() => {
  //   LoadGithubParams(props)
  // }, [query])

  const [issues, setIssues] = useState([]);
  const [collabs, setCollabs] = useState([]);
  const [error, setError] = useState(null);

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

    async function fetchCollab() {
      try {
        const { data } = await axios.get(collabUrl);
        setCollabs(data);
        console.log('68 issues', data)
      } catch (err) {
        setError(err);
      }
    }
    fetchCollab(); 

    // show error message popup
    if (error) {
      // console.log('78 error', error.response.data.message)
      alert(error.response.data.message)
    }
  }, [props.phFocus.focusProj.org]);

  const generatedUrl = `https://akmmclient-main.vercel.app/project?org=${org}&repo=${repo}&path=${path}&file=${file}&branch=${branch}`
  // https://akmmclient-main.vercel.app/project?org=kavca&repo=osdu-akm-models&path=production&file=AKM-Production-Measurements-Conceptmodel_PR.json

  const projectParamsDiv = 
      <>
        <div className='container' style={{  fontSize: '0.9rem'}}>
          {/* <div className="m-5"> */}
            {/* {(query.repo) && <h5>Url-Paremeters: {query.repo} / {query.path} / {query.file}</h5> } */}
           {(query.repo) ? <GithubParams ph={props} query={query} /> : <h5>Initial Startup model loaded !</h5> }
          {/* </div> */}
        </div>
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
          <div className="wrapper m-1 pr-2 ">
              {/* <div className="header">
                <Header title='eaderTitle' />
              </div> */}
                <div className="focusarea d-flex " style={{backgroundColor: "#cdd", maxHeight: "24px"}}> 
                  <SetContext className='setContext' ph={props} />
                </div> 
              <div className="workplace-focus gap " >
                <div className="aside-left fs-6 m-1 p-2 " style={{ backgroundColor: "#cdd", borderRadius: "5px 5px 5px 5px" }} >
                  <h5 className='text-muted'>GitHub links :</h5>
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
                  <div className='bg-light px-2 m-1 w-100'> {/*link to Issues */}
                    <div className='text-muted'>Issues for this repo:</div>
                    {(repo) && <Link className='text-primary ' href={`https:/github.com/${org}/${repo}/issues`} target="_blank">{org}/{repo}</Link>}
                  </div>
                  <div className='bg-light px-2 m-1 w-100'> {/*link to canban */}
                    <div className='text-muted'>Project Canban for this repo:</div>
                    {(org) && <Link className='text-primary ' href={`https:/github.com/orgs/${org}/projects`} target="_blank"> {org}/{repo} project</Link>}
                  </div>
                  <div className="aside-right fs-4 mt-3" style={{minWidth: "20rem"}}>
                    <h2 className='text-muted fs-6 p-2'>GitHub Collaborators :</h2>
                    {(issues.length > 0) && issues.map((issue) => (
                      <div className='bg-light fs-6  m-2 p-2' key={issue.id}>
                        <div className='d-flex justify-content-between'>
                          <Link className='text-primary' href={issue.html_url} target="_blank"># {issue.number} - {issue.state} - {issue.created_at.slice(0, 10)}</Link>
                          <div className='text-muted'>{issue.user.name}</div>
                        </div>
                        <h6>{issue.title}</h6>
                        <div className='text-muted'>Created by: {issue.user.login} - Assignee: {issue.assignees[0]?.login} </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className=" main m-1 fs-6 " style={{ maxWidth: "40rem", backgroundColor: "#cdd", borderRadius: "5px 5px 5px 5px" }}>
                    {projectParamsDiv }
                      {/* <div className=" d-flex justify-content-around "> */}
                        {/* <div className="rounded bg-light m-2 p-2">
                          <button className='rounded mt-2 px-2 m-2 '>
                              <Link className='text-primary ' href={generatedUrl}>Reload from GitHub </Link>
                          </button>
                        <span className='text-muted pr-2'>NB! This will overwrite any changes made in current model </span>  
                        </div>    */}
                        {/* <div className="rounded bg-light m-2 p-2">
                          <button className='rounded mt-2 px-2 m-2  '>
                            <SelectContext className='ContextModal mr-2' buttonLabel='Set Context' phData={props.phData} phFocus={props.phFocus} />  
                          </button>
                        </div>    */}
                      {/* </div>    */}
                    <div className="rounded bg-light m-2 p-2 ">
                      <button className='rounded mt-2 px-2 '>
                          <Link className='text-primary ' href="/modelling">Start Modelling</Link>
                      </button>
                    </div>   
                    <div className="rounded bg-light m-2 p-2">
                      <div className='ronded p-1 text-secondary '>Copy the text below, to send the project-link to others:</div>  
                      <span className='rounded  p-2' style={{fontSize: '0.4rem', backgroundColor: '#dde'}}>{generatedUrl} </span>  
                    </div>
                    {projectFormDiv}     
                </div>
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
            grid-template-columns: 1fr auto 1fr;
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
