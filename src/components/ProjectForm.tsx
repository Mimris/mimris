import { compareSync } from 'bcrypt'
import React from 'react'
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
    } else if (item === 'focusProj') { return item
    } else if (item === 'focusProj') { return item
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

  console.log('41 ',projectFocus, modelFocus)

  if (debug) console.log('43 ', Object.keys(projectFocus[0]))
  // list objects in props.phFocus and display divem in a form
  // for each object, display a form field
  
  const focusProjectItems =      
    <> 
      <h4>Project:</h4>
      <div className="border" style={{background: "#eee"}}>
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
              <Col key={obj.id}className='bg-white m-1' >{Object.values(obj)[0].id || ''} </Col>
            </Row>
          )
        })}
      </div>
      </>

  const focusModelItems =    
  <>
      <h4>Model:</h4>
      <Row className="bg-secondary my-1 p-2 text-light" >
      <Col>focusItem</Col>
        <Col>name</Col>
        <Col>id</Col>
      </Row>
      <div className="border" style={{background: "#eee"}}>
        {modelFocus.map((obj, index) => {
          return (
            <Row key={Object.keys(obj)[0]}>
              <Col key={obj.name+1} className='bg-white m-1' ><strong> {Object.keys(obj)[0]} </strong> </Col>
              <Col key={obj.name}className='bg-white m-1'><strong>{Object.values(obj)[0].name} </strong></Col>
              <Col key={obj.id}className='bg-white m-1' >{Object.values(obj)[0].id || ''} </Col>
            </Row>
        )
        })}
      </div>
  </>  

  return (
    <Container className='p-4' style={{backgroundColor: "#cdd"}}>
      <h3>Current Context and Focus :</h3>
      <div className="">{focusProjectItems}</div>
      <div>{focusModelItems}</div>
    </Container>

  )
}
