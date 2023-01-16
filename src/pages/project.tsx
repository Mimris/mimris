// make a page for project
import { connect, useDispatch } from 'react-redux';
import React, { useState, useEffect } from "react";
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

// if query object is not empty object
// useEffect(() => {
//   LoadGithubParams(props)
// }, [query])


  const projectDiv =  (Object.keys(query).length !== 0) 
    ? 
      <>
        <div className='container'>
          {/* <div className="m-5"> */}
            {/* {(query.repo) && <h5>Url-Paremeters: {query.repo} / {query.path} / {query.file}</h5> } */}
           <GithubParams ph={props} query={query} />
          {/* </div> */}
        </div>
        <div className="container bg-light">
          <div className="m-2">
            <ProjectForm phFocus={props.phFocus} />
          </div>
        </div>        
      </>
    :
      <>
        <div className="m-2">
          {/* <h5 className='m-3 p-2 bg-white'>Current Project: {props.phData.metis.name} | File: {props.phSource}</h5>  */}
          <ProjectForm phFocus={props.phFocus} />
        </div>
      </>
  
  return (
    <>
      <Layout user={props.phUser?.focusUser} >
        <div id="index" >
          <div className="wrapper">
              {/* <div className="header">
                <Header title='eaderTitle' />
              </div> */}
              <div className="workplace" >
                <div className="contextarea d-flex " style={{backgroundColor: "#cdd", width: "99%", maxHeight: "24px"}}> 
                  <SetContext className='setContext' ph={props} />
                </div> 
                <div className="tasksarea m-1 p-3 " style={{ minHeight: "70vh", backgroundColor: "#cdd", borderRadius: "5px 5px 5px 5px" }} >
                  <h2 className='text-muted'>GitHub links :</h2>
                  <div className='bg-light px-2 m-1 w-100'>
                  {(org) ?
                     <Link className='text-primary ' href={`https:/github.com/${org}/${repo}/tree/${branch}/${path}`} target="_blank"> {org}</Link>
                      :
                      <Link className='text-primary ' href={`https:/github.com/kavca`} target="_blank">Kavca</Link>}
                  </div>
                  <div className='bg-light px-2 m-1 w-100'>
                  {(repo) && <Link className='text-primary ' href={`https:/github.com/${org}/${repo}`} target="_blank"> {org}/{repo}</Link>}
                  </div>
                  <div className='bg-light px-2 m-1 w-100'>
                  {(repo) && <Link className='text-primary ' href={`https:/github.com/${org}/${repo}/issues`} target="_blank"> {org}/{repo} issues</Link>}
                  </div>
                  <div className='bg-light px-2 m-1 w-100'>
                  {(org) && <Link className='text-primary ' href={`https:/github.com/orgs/${org}/projects/1`} target="_blank"> {org}/{repo} project</Link>}
                  </div>
                </div>
                <div className="container m-1" style={{ minHeight: "70vh", backgroundColor: "#cdd", borderRadius: "5px 5px 5px 5px" }}>
                  <div className="d-flex justify-content-end ">
                    <button className='rounded mt-2 px-2 m-2  '>
                        <Link className='text-primary' href="/modelling">Start Modelling</Link>
                    </button>
                  </div>
                  {projectDiv}
                </div>
              </div>
              <div className="footer">
                <Footer />
              </div>
          </div>
        </div>
      </Layout>
    </>
  )
}

export default connect((state: any) => state)(page)
