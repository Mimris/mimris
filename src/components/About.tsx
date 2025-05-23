// @ts-nocheck
// Index.tsx

// import React from "react";
import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { connect, useSelector, useDispatch } from 'react-redux';
import {
  CardGroup, Card, CardImg, CardText, CardBody, CardHeader,
  CardTitle, CardSubtitle, Button, CardLink, CardDeck, CardColumns
} from 'reactstrap';
import Page from './page';
import Index from "./Index";

const page = (props) => {
  // console.log('12', props);
  const dispatch = useDispatch()
  const [refresh, setRefresh] = useState(true)
  function toggleRefresh() { setRefresh(!refresh); }

  /**  * Get the state and metie from the store  */
  const data = useSelector((state: any) => state) // Selecting the whole redux store
  const metis = (data.phData) && data.phData.metis
  const models = (metis) && metis.models  // selecting the models array
  const metamodels = (metis) && metis.metamodels
  // console.log('26 dia',  metis);

  const focusModel = useSelector(focusModel => data.phFocus?.focusModel)
  const focusModelview = useSelector(focusModelview => data.phFocus?.focusModelview)

  let gojsmodel = data.phFocus?.gojsModel

  // useEffect(() => {
  //   // console.log('39', gojsmodel);
  //   GenGojsModel(state, dispatch)
  //   gojsmodel = data.phFocus.gojsModel
  // }, [focusModelview])

  return (
    <>
      <div className="workpad p-1 bg-light">
        <div className="homepage1 bg-light">
          <div className="row">
            <CardGroup className="col-12 border border-dark"  style={{ backgroundColor: "#b0cfcf" }}>
              <CardColumns className="col-3">
                {/* <Card> */}
                <Card className="card" body outline color="warning"
                  style={{
                    background: "rgba(255,255,255,0.4)",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    // position: "relative",
                    backdropFilter: "blur(5px)",
                    WebkitBackdropFilter: "blur(5px)",
                    // display: "block",
                    margin: "0 auto",
                    padding: "2px"
                  }}
                >
                  <CardHeader className="card-header">Active Knowledge Modelling</CardHeader>
                  <CardBody className="card-body" >
                    {/* <CardTitle style={{ fontWeight: "bolder" }}>AKM</CardTitle> */}
                    <CardText className="card-text">
                      Active Knowledge Modelling (AKM) is an innovative way to capture and use enterprise knowledge from practical work. AKM models have positive effects on cyclic design and operations, productivity, safety, reuse, collaboration and innovation and learning. AKM has matured for more than a decade. Modern open-source web technology has now reached a technical level that enables cost efficient large scale usage.
                      <br /><br />
                      The AKM novelty comes from how relationships between roles, tasks, properties and knowledge and data are captured and presented in the form of interactive and visual workspaces that support collaboration between roles in a distributed work environment.
                    </CardText>
                    <CardText>
                      An enterprise development and innovation team can model new Concepts and Capabilities. These Concept models may be used to enhance the meta-models of innovation projects, which again design new POPS components and solutions.
                      <br /><br />
                      The effects from deploying AKM based solutions are many. Firstly roles and their workspaces can be designed to share critical views securing a shared situational awareness. Shared views supporting design parameter balancing are modelled, and task execution can be in line with applicable regulations and policies. Role-specific task execution may create new tasks and services for other roles, and as such AKM makes collaboration and alignment more transparent, effective and precise, with direct impact on design quality, safety and security.
                      <br />
                    </CardText>
                  </CardBody>
                </Card>
                <Card body inverse color="warning" >
                  <CardBody className="hompage4">
                    <CardText>
                      AKM is used to create Visual Collaboration Arena (VCA) that provide role-holder’s with contextualized workspaces and workplaces.
                      <br />Workspaces captures the dynamic interdependencies between roles, tasks, views and information.
                      <br />Workplaces is the instantiation of a workspace for a specific end user, supporting end user capabilities and data for workspace interaction.
                      <br />Role holders can be humans or software agents (bots) or a combination of the two that are accountable for the execution of tasks in line with the rules that apply for the task.
                    </CardText>
                    <CardText>
                      <br />The VCA can be understood as an “intelligent agent” that runs tasks capturing work environments and execute actions to enhance the environments.
                      <br />The environments will be a digital representation of the knowledge architectures including digital twins and alternative solutions.
                    </CardText>
                    <Link href="/">
                      <Button color="light"></Button>
                    </Link>
                  </CardBody>
                </Card>
              </CardColumns>
              <CardColumns className="col-3">
                <Card body outline color="danger">
                  <CardHeader>Metamodels</CardHeader>
                  <CardBody style={{ backgroundColor: '#dedede' }} className="homepage3" >
                    <CardTitle style={{ fontWeight: "bolder" }}>Workspace modelling (IRTV)</CardTitle>
                    <CardText>
                      IRTV modelling includes the design of symbols and constructs needed to easily communicate proposed solutions and job tasks and services across roles and resources
                      of project life-cycles.
                    </CardText>
                    <CardImg top width="90%" src="images/irtv2.png" alt="irtv figur" />
                    <CardText><br />
                      <strong>Roles</strong> define workspaces and describes resources required to execute tasks.
                    </CardText>
                    <CardText>
                      <strong> Tasks </strong> defines work, rules (task patterns) and complex product and process dependencies.
                    </CardText>
                    <CardText>
                      <strong>Information </strong> represents enterprise data and knowledge sources and content used.
                    </CardText>
                    <CardText>
                      <strong>View’s </strong> defines how information is presented to roles and managed to ease task (work) execution.
                    </CardText>
                    <CardText>
                      Modelling and executing tasks extend the values and principles of product, process and organization design. 
                      Work execution and management is improved by capturing context as well as contents in workspace models. 
                      Collaboration is enhanced by sharing views of situations and solutions. 
                      Creating fine-grained executable models and views of products, organizations, processes and systems and ICT platforms.
                    </CardText>
                  </CardBody>
                </Card>
                <Card body outline color="info">
                  {/* <Card style={{ width: '18rem', fontWeight: "bolder" }}> */}
                  <CardHeader>POPS Modelling</CardHeader>
                  <CardBody className="homepage3" >
                    {/* <CardTitle>IRTV modelling</CardTitle> */}
                    <CardImg top width="90%" src="images/irtv1.png" alt="irtv figur" />
                    <CardText>
                    With AKM we can easily model new product structures, such as self-configurable components, systems and product families. 
                    </CardText>
                    <CardText>
                    This is supported by top-down as well as bottom-up workspace designed processes and role-oriented workspaces. 
                  </CardText>
                  <CardText>
                    <strong>Product design, engineering and life-cycle services</strong> are currently based on modelling and using these disjoint structures:
                      <br />- <strong>Product structures:</strong> - functions, components, systems configurations, production and operations, and repair,
                    </CardText>
                    <CardText>
                      <br />- <strong>Organizational hierarchies</strong>, domain teams and discipline groups, and composed project teams,
                    </CardText>
                    <CardText>
                      <br />-  <strong>Processes flows:</strong> -activity-decomposed tasks, BPM delivery flows, IDEF0 patterns, work-patterns (eg. swimlanes),
                    </CardText>
                    <CardText>
                      <br />- <strong>Systems</strong>; - functions, components, modules, systems configurations
                  </CardText>
                  </CardBody>
                </Card>
              </CardColumns>
              <CardColumns className="col-3">
              <Card body outline color="primary" >
                <CardBody className="homepage1" >
                  <CardTitle style={{ fontWeight: "bolder" }}>Knowledge Management</CardTitle>
                  <CardText>
                    Knowledge management as a science and industrial discipline go decades back in time. 
                    The challenge is manifold; - the capture and modelling of knowledge, the validity of modelled knowledge, and the sharing and use of knowledge in future work and projects. 
                    Enterprises that implement effective knowledge management will have huge advantages over competitors. 
                    Benefits include enhanced safety in operations, design of more effective and less vulnerable work processes and more effective collaboration between resources assigned to roles.
                  </CardText>
                </CardBody>
                <CardBody className="hompage3">
                  <CardTitle style={{ fontWeight: "bolder" }}>Product design, engineering and life-cycle services </CardTitle>
                  <CardText>
                    These capabilities provide functions for control of outcomes and properties. 
                    Components for controlling shape and features. 
                    Part structures for engineering parameter control. 
                    Manufacturing structures for adaptation to the machining. 
                    Assembly structures for controlling the composition of parts.
                  </CardText>
                </CardBody>
                <CardBody className="hompage3">
                  <CardTitle style={{ fontWeight: "bolder" }}>Organizational composition and control</CardTitle>
                  <CardText>
                    are currently dominated by hierarchies, but hierrchies are for resource and time calculations and reporting, and do not support knowledge sharing and learning. 
                    We need to design and manage practical resources ain role-specific teams, composed of humans, intelligent agents and smart machines.
                  </CardText>
                </CardBody>

                <CardBody className="hompage4">
                  <CardTitle style={{ fontWeight: "bolder" }}>System design, building and operation</CardTitle>
                  <CardText>
                    System design, building and operation are currently performed in isolated expert silos,
                    that are not able to support early design, nor role-oriented emergent teams and their practical workspaces
                  </CardText>
                </CardBody>
                <CardBody>
                  <CardTitle style={{ fontWeight: "bolder" }}>Process design, engineering and execution</CardTitle>
                  <CardText>
                    are currently based on:
                    - Activity decomposition and disjoint flows – business and project
                    </CardText>
                    <CardText>
                    - Jobs are defined by tasks needed, no context is captured
                    </CardText>
                    <CardText>
                    - Separate progress reporting and communication from processes
                    </CardText>
                    <CardText>
                    - No balancing of parameters and values across disciplines and roles
                    </CardText>
                    <CardText>
                    - No capture of practical dependencies and settings.
                  </CardText>
                </CardBody>
                <Link href="/">
                  <Button color="light"></Button>
                </Link>
              </Card>
              </CardColumns>
              <CardColumns className="col-3 h-100">
                <Index />
              </CardColumns>
                {/* <div className="col-3">
                  <Card className="card "
                    style={{
                      background: "rgba(255,255,255,0.4)",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.2)",
                      position: "relative",
                      backdropFilter: "blur(5px)",
                      WebkitBackdropFilter: "blur(5px)",
                      // display: "block",
                      // margin: "0 auto",
                      padding: "2px"
                    }}
                  >
                    <CardHeader className="card-header">Mimris versions:</CardHeader>
                    <CardBody className="card-body" >
                      <CardText className="card-text">
                      </CardText>
                    </CardBody>
                  </Card>
                </div> */}
                
            </CardGroup>
          </div>


        </div>
        <style jsx>{`
          .workpad {
            grid-area: workpad;
            display: grid ;
            border-radius: 5px 5px 0px 0px;
            height: 100%;
            width: 100%;
            // max-width: 400px;
            grid-template-columns: auto 3fr;
            grid-template-areas:
            "myPalette myModeller";
          }
          @media only screen and (max-width: 475px) {
            .workpad {
              grid-area: workpad;
              display: grid ;
              border-radius: 5px 5px 0px 0px;
              width: 100%;
              // max-width: 400px;
              grid-template-columns: auto 3fr;
              grid-template-areas:
              "myPalette"
              "myModeller";
            }
          }
          .card-text {
            color: white;
          }
          `}</style>
      </div>
    </>
  )

}
export default Page(connect(state => state)(page));


