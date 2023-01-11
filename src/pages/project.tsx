// make a page for project
import { connect, useDispatch } from 'react-redux';
import React, { useState, useEffect } from "react";
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

const page = (props: any) => {
    
  const dispatch = useDispatch()  
  
  const {query} = useRouter(); // example: http://localhost:3000/modelling?repo=Kavca/kavca-akm-models&path=models&file=AKM-IRTV-Startup.json
  
  console.log('19 project',props, query)

// if query object is not empty object
// useEffect(() => {
//   LoadGithubParams(props)
// }, [query])


  const projectDiv =  (Object.keys(query).length !== 0) 
    ? 
      <>
        <div>
          <div className="m-5">
            {(query.repo) && <h4>Paremeters: {query.repo} / {query.path} / {query.file}</h4>}
           <GithubParams ph={props} query={query} />
          </div>
        </div>
        <div className="context">
          <div className="context-area bg-secondary">
              <div className="m-5">
                  <ProjectForm phFocus={props.phFocus} />
            </div>
          </div>
        </div>
      </>
    :
      <>
        <div className="m-5">
          <h1>No Project parameters found yet</h1>
        </div>
        <div className="m-5">
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
              <div className="">
              <div className="contextarea d-flex bg-light" style={{width: "99%", maxHeight: "24px"}}> 
                <SetContext className='setContext' ph={props} />
              </div> 
                <div className="workarea bg-secondary">
                  {projectDiv}
                </div>
              </div>
              {/* <div className="footer">
                <Footer />
              </div> */}
          </div>
        </div>
      </Layout>
    </>
  )
}

export default connect((state: any) => state)(page)
