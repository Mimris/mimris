import React, { useState, useEffect } from "react";
import Link from "next/link";
import { connect, useSelector, useDispatch } from 'react-redux';
import { Container, Row, Col } from 'react-bootstrap'

import GenGojsModel from "../components/GenGojsModel";

const debug = false

export default function GithubParams(props: { phFocus: any }) {  // props = props.phFocus

  if (debug) console.log('5 GithubParams',  props)

  if (!props.phFocus) return <div>no props.phFocus</div>


  return (
    <Container className=' p-1 ' style={{backgroundColor: "#cdd"}}>
        <h4 className='text-primary fs-6'>You have loaded a model from the following repo on GitHub :</h4>
      <Container className='project my-1 py-2 px-1' style={{background: "#dee"}}>
        <Row className="bg-secondary my-1 p-1 text-light" >
          <Col>Org</Col>
          <Col>Repository</Col>
          <Col style={{maxWidth: "100px"}}>Path </Col>
          <Col>Modelfile</Col>
          <Col style={{maxWidth: "100px"}}>Branch</Col>
          <Col style={{maxWidth: "60px"}}>ProjNo</Col>
        </Row>
        <div className="border " style={{background: "#ef"}}><strong>
          <Row key={1} className=''>
            <Col key={1} className='bg-white m-1' >{props.phFocus.focusProj?.org} </Col>
            <Col key={2} className='bg-white m-1' >{props.phFocus.focusProj?.repo} </Col>
            <Col key={3} className='bg-white m-1' style={{maxWidth: "100px"}}>{props.phFocus.focusProj?.path} </Col>
            <Col key={4} className='bg-white m-1' >{props.phFocus.focusProj?.file} </Col>
            <Col key={5} className='bg-white m-1' style={{maxWidth: "100px"}}>{props.phFocus.focusProj?.branch} </Col>
            <Col key={6} className='bg-white m-1' style={{maxWidth: "50px"}}>{props.phFocus.focusProj?.projectNumber} </Col>
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
