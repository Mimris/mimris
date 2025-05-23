// @ts-nocheck
import { compareSync } from 'bcrypt'
import React from 'react'
import Link from 'next/link'
import { Container, Row, Col } from 'react-bootstrap'

const debug = false

export default function ProjectForm(props) {

  if (debug) console.log(props.phFocus)
  if (!props.phFocus) return <div>no props.phFocus</div>

  const projectFocusNames =  Object.keys(props.phFocus).map(item => {
    if (item === 'focusRepo') { return item 
    } else if (item === 'focusOrg')  { return item
    } else if (item === 'focusProj') { return item
    } else if (item === 'focusRole') { return item
    } else if (item === 'focusTask') { return item
    // } else if (item === 'focusProj') { return item
    // } else if (item === 'focusProj') { return item
    }
  }).filter(item => item !== undefined) 

  const projectFocus = projectFocusNames.map((item, index) => {
    return {[item]: props.phFocus[item]}
  } 
  ).filter(item => item !== undefined) || []

  const modelFocusNames = Object.keys(props.phFocus).map(item => {
    if (item === 'focusRepo') { return item 
    } else if (item === 'focusModel')  { return item
    } else if (item === 'focusModelview') { return item
    } else if (item === 'focusObject') { return item
    } else if (item === 'focusObjectview') { return item
    } else if (item === 'focusRelship') { return item
    } else if (item === 'focusRelshipview') { return item
    }
  }).filter(item => item !== undefined) 

  const modelFocus = modelFocusNames.map((item, index) => {
    return {[item]: props.phFocus[item]}
  }
  ).filter(item => item !== undefined) || []

  

  if (debug) console.log('43 ', Object.keys(projectFocus[0]))
  // list objects in props.phFocus and display divem in a form
  // for each object, display a form field
  
  const focusProjectItems =      
    <> 
      {/* <h6>Project:</h6> */}
      <div className="border fs-6" style={{background: "#eee"}}>
        <Row className="bg-secondary my-1 p-2 text-light" >
          <Col>focusItem</Col>
          <Col>name</Col>
          <Col>id</Col>
        </Row>
        {projectFocus.map((obj, index) => {
          return (
            <Row key={Object.keys(obj)[0]}>
              <Col key={obj.name+1} className='bg-white m-1 font-weight-bold' ><strong> {Object.keys(obj)[0]} </strong></Col>
              <Col key={obj.name}className='bg-white m-1'><strong> {Object.values(obj)[0].name} </strong></Col>
              <Col key={obj.id}className='bg-white m-1 ' >{Object.values(obj)[0].id || ''} </Col>
            </Row>
          )
        })}
      </div>
      </>

  const focusModelItems =    
  <>
      <h5 className="my-2" >Model:</h5>
      <Row className="bg-secondary my-1 p-2 text-light" >
        <Col >focusItem</Col>
        <Col>name</Col>
        <Col >id</Col>
      </Row>
      <div className="border" style={{background: "#eee"}}>
        {modelFocus.map((obj, index) => {
          return (
            <Row key={Object.keys(obj)[0]}>
              <Col key={obj.name+1} className='bg-white m-1' ><strong> {Object.keys(obj)[0]} </strong> </Col>
              <Col key={obj.name}className='bg-white m-1'><strong>{Object.values(obj)[0].name} </strong></Col>
              <Col key={obj.id}className='bg-white m-1 '  >{Object.values(obj)[0].id || ''} </Col>
            </Row>
        )
        })}
      </div>
  </>  

  return (
    <Container className='' style={{backgroundColor: "#cdd"}}>
      <h6>Current Context and Focus :</h6>
      <div className="">{focusProjectItems}</div>
      <div>{focusModelItems}</div>
    </Container>

  )
}
