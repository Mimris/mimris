import React, { useState, useEffect } from "react";
import Link from "next/link";
import { connect, useSelector, useDispatch } from 'react-redux';
import { Container, Row, Col } from 'react-bootstrap'

import GenGojsModel from "../components/GenGojsModel";

const debug = false

export default function GithubParams(props) {

  const dispatch = useDispatch()

  const [refresh, setRefresh] = useState(true);

  if (debug) console.log('5 GithubParams', props)
      // list query params
      const query = props.query
      const org = query.org
      const repo = query.repo
      const path = query.path
      const file = query.file
      const branch = query.branch
      const focus = query.focus
      const ghtype = query.ghtype

  // function setFocusProject(props) {
  //     if (debug) console.log('27 modelling genGojsArrays', props.ph)
  //     dispatch({ type: 'SET_FOCUS_PROJ', data: {id: org+repo+path+file, name: repo, org: org, repo: repo, path: path, file: file, branch: branch} })
  //   }
    
    useEffect(() => {
      if (!debug) console.log('33 modelling dispatchGithub', query, props)  
      dispatch({type: 'LOAD_DATAGITHUB', data: query })
      const timer = setTimeout(() => {
        const data = {id: org+repo+path+file, name: repo, org: org, repo: repo, path: path, file: file, branch: branch} 
        dispatch({ type: 'SET_FOCUS_PROJ', data: data })
        const org1 = {id: org, name: org}
        dispatch({ type: 'SET_FOCUS_ORG', data: org1 })
        const repo1 = {id: 'role', name: ''}
        dispatch({ type: 'SET_FOCUS_REPO', data: repo1 })
      }, 2000);
      return () => clearTimeout(timer);
  }, [])

  return (
    <Container className=' p-1' style={{backgroundColor: "#cdd"}}>
        <h4 className='text-primary fs-6'>You have loaded a model from the following repo on GitHub :</h4>
      <Container className='project my-1 py-2 ' style={{background: "#dee"}}>
        <Row className="bg-secondary my-1 p-1 text-light flex justify-content-between" >
          <Col>Org</Col>
          <Col>Repository</Col>
          <Col>Path</Col>
          <Col>Modelfile</Col>
          <Col>Branch</Col>
        </Row>
        <div className="border " style={{background: "#ef"}}><strong>
          <Row key={1} className='flex justify-content-between'>
            <Col key={1} className='bg-white m-1' >{org} </Col>
            <Col key={2} className='bg-white m-1' >{repo} </Col>
            <Col key={3} className='bg-white m-1' >{path} </Col>
            <Col key={4} className='bg-white m-1' >{file} </Col>
            <Col key={5} className='bg-white m-1' >{branch} </Col>
          </Row></strong>
        </div>
        {/* <div className="d-flex justify-content-center ">
          <button className='bg-primary rounded mt-2 w-50 b-2 '>
              <Link className='text-white' href="/modelling">Click here to open the model in AKM Modeller</Link>
          </button>
        </div> */}
      </Container>
    </Container>
  );
}
