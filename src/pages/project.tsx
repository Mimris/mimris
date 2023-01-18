// make a page for project
import { connect, useDispatch } from 'react-redux';
import React, { useState, useEffect } from "react";
// import client from '@sanity/client'
import axios from 'axios';
import Link from 'next/link';
import { loadData } from '../actions/actions'
import Page from '../components/page';
import Layout from '../components/Layout';
import Header from "../components/Header"
import Footer from "../components/Footer"
import SetContext from '../defs/SetContext'
import ProjectForm from '../components/ProjectForm';
import LoadGithubParams from '../components/loadModelData/LoadGithubParams';
import GithubParams from '../components/GithubParams';
import { useRouter } from "next/router";
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

  const issueUrl = `https://api.github.com/repos/${org}/${repo}/issues`

  // if query object is not empty object
  // useEffect(() => {
  //   LoadGithubParams(props)
  // }, [query])

  const [issues, setIssues] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get(issueUrl);
        setIssues(data);
        console.log('issues', data)
      } catch (err) {
        setError(err);
      }
    }
    fetchData(); 
  }, []);

  const generatedUrl = `https://akmmclient-main.vercel.app/project?org=${org}&repo=${repo}&path=${path}&file=${file}?branch=${branch}`
  // https://akmmclient-main.vercel.app/project?org=kavca&repo=osdu-akm-models&path=production&file=AKM-Production-Measurements-Conceptmodel_PR.json

  const projectDiv =  (Object.keys(query).length !== 0) 
    ? 
      <>
        <div className='container'>
          {/* <div className="m-5"> */}
            {/* {(query.repo) && <h5>Url-Paremeters: {query.repo} / {query.path} / {query.file}</h5> } */}
           <GithubParams ph={props} query={query} />
          {/* </div> */}
        </div>
        <hr  className='mx-5 p-2 bg-success' />
        <div className="container ">
          <div className="">
            <ProjectForm phFocus={props.phFocus} />
          </div>
        </div>        
      </>
    :
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
          <div className="wrapper m-1 pr-2">
              {/* <div className="header">
                <Header title='eaderTitle' />
              </div> */}
                <div className="focusarea d-flex " style={{backgroundColor: "#cdd", maxHeight: "24px"}}> 
                  <SetContext className='setContext' ph={props} />
                </div> 
              <div className="workplace-focus gap" >
                <div className="left-aside m-1 p-3 " style={{ backgroundColor: "#cdd", borderRadius: "5px 5px 5px 5px" }} >
                  <h2 className='text-muted'>GitHub links :</h2>
                  <div className='bg-light px-2 m-1 w-100'>
                    <div className='text-muted'>Top GitHub org:</div>
                    {(org && repo && path) 
                      ? <Link className='text-primary ' href={`https:/github.com/${org}/${repo}/tree/${branch}/${path}`} target="_blank"> {org}</Link>
                      : <Link className='text-primary ' href={`https:/github.com/kavca/.github/`} target="_blank">Kavca</Link>}
                  </div>
                  <div className='bg-light px-2 m-1 w-100'>
                  <div className='text-muted'>Repository :</div>
                  {(repo) && <Link className='text-primary ' href={`https:/github.com/${org}/${repo}`} target="_blank"> {org}/{repo}</Link>}
                  </div>
                  <div className='bg-light px-2 m-1 w-100'>
                  <div className='text-muted'>Issues for this repo:</div>
                  {(repo) && <Link className='text-primary ' href={`https:/github.com/${org}/${repo}/issues`} target="_blank">{org}/{repo}</Link>}
                  </div>
                  <div className='bg-light px-2 m-1 w-100'>
                  <div className='text-muted'>Project Canban for this repo:</div>
                  {(org) && <Link className='text-primary ' href={`https:/github.com/orgs/${org}/projects/1`} target="_blank"> {org}/{repo} project</Link>}
                  </div>
                </div>
                <div className="main container m-1" style={{  backgroundColor: "#cdd", borderRadius: "5px 5px 5px 5px" }}>
                    <div className=" d-flex justify-content-around ">
                      <div className="bg-white m-2 p-2">
                        <button className='rounded mt-2 px-2 m-2 '>
                            <Link className='text-primary ' href={generatedUrl}>Reload from GitHub </Link>
                        </button>
                      <span className='text-muted pr-2'>NB! This will overwrite any changes made in current model </span>  
                      </div>   
                      <div className="bg-white m-2 p-2">
                        <button className='rounded mt-2 px-2 m-2  '>
                            <Link className='text-primary ' href="/modelling">Start Modelling</Link>
                        </button>
                      </div>   
                    </div>   
                    <div className="bg-light m-2 p-2">
                      <div className='px-2'>Copy the text below to send the project-link to others: </div>  
                      <span className='fs-6 m-2 p-2' style={{backgroundColor: '#dde'}}>{generatedUrl} </span>  
                    </div>
                    {projectDiv}
                    
                </div>

                <div className="right-aside container fs-4  m-3 ">
                  <h2 className='text-muted fs-4 p-2'>GitHub Issues :</h2>
                  {issues.map((issue) => (
                    <div className='bg-light fs-6  m-2 p-2' key={issue.id}>
                      <div className='d-flex justify-content-between'>
                        <Link className='text-primary ' href={issue.html_url} target="_blank"># {issue.number}</Link>
                        <div className='text-muted'>{issue.user.name}</div>
                      </div>
                      <h6>{issue.title}</h6>
                      <p className='text-secondary '>{issue.body}</p>
                      <div className='text-muted'>Assignee: {issue.assignees[0].login}</div>
                      <div className='text-muted'>Created by: {issue.user.login} </div>
                      <div className='text-muted'>Date: {issue.created_at}</div>
                      <div className='text-muted'>{issue.state}</div>
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
          .left-aside { grid-area: left-aside;}
          .workplace-focus { grid-area: workplace-focus;}
          .left-aside { grid-area: left-aside;}
          .right-aside { grid-area: right-aside;}
          .workplace-focus {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            grid-template-areas:
              "focusarea focusarea focusarea"
              "left-aside main right-aside"
              "left-aside main right-aside"
          }
          .workplace-focus > div {
            padding: 10px;
            font-size: 20px;
          }
          .right-aside {
            background-color: #abb;
            margin: 10px;
            border-radius: 5px 5px 5px 5px;
          }
        ` }
        </style>




      </Layout>
    </>
  )
}

export default connect((state: any) => state)(page)
