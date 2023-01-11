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
        const repo = query.repo
        const path = query.path
        const file = query.file

    function genGojsArrays(props) {
        if (debug) console.log('27 modelling genGojsArrays', props.ph)
        dispatch({ type: 'SET_FOCUS_REFRESH', data: {id: Math.random().toString(36).substring(7), name: 'refresh'} })

    }

    useEffect(() => {
        if (!debug) console.log('16 modelling dispatchGithub', query)  
        dispatch({type: 'LOAD_DATAGITHUB', data: query })
    }, [])

  return (
    <>
    <Container className='project bg-light my-2'>
      <h4>Click here to open the model from GitHub :</h4>
      <Row className="bg-secondary my-1 p-2 text-light" >
        <Col>Repository</Col>
        <Col>path</Col>
        <Col>model</Col>s
      </Row>
      <div className="border" style={{background: "#ef"}}>
          return (
            <Row key={1}>
              <Col key={1} className='bg-white m-1' >{repo} </Col>
              <Col key={2}className='bg-white m-1'>{path} </Col>
              <Col key={3}className='bg-white m-1' >{file} </Col>
              <Col key={4}className='bg-white m-1' > 
          	    <button>
                <Link href="/modelling">Start Modelling</Link>
                </button>
            </Col>
            </Row>
          )
      </div>
      </Container>
    </>
  );
}
