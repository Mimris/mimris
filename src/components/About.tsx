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

const page = (props) => {
  // console.log('12', props);
  const dispatch = useDispatch()
  const [refresh, setRefresh] = useState(true)
  function toggleRefresh() { setRefresh(!refresh); }

  /**  * Get the state and metie from the store  */
  const state = useSelector((state: any) => state) // Selecting the whole redux store
  const metis = (state.phData) && state.phData.metis
  const models = (metis) && metis.models  // selecting the models array
  const metamodels = (metis) && metis.metamodels
  // console.log('26 dia',  metis);

  const focusModel = useSelector(focusModel => state.phFocus?.focusModel)
  const focusModelview = useSelector(focusModelview => state.phFocus?.focusModelview)

  let gojsmodel = state.phFocus?.gojsModel

  // useEffect(() => {
  //   // console.log('39', gojsmodel);
  //   GenGojsModel(state, dispatch)
  //   gojsmodel = state.phFocus.gojsModel
  // }, [focusModelview])

  return (
    <>
      <div className="workpad p-1 bg-light">
        <div className="homepage1 bg-light ">
          <div>
            {/* <Card className="card bg-secondary p-0 mb-2" >
              <CardBody id="lighten" className="homepage2 bg-secondary p-2" >
                <CardHeader className="header2 bg-light p-2">AKM Modeller</CardHeader>
                <CardText className="bg-light p-4">
                </CardText>
              </CardBody>
            </Card> */}
            {/* <CardGroup> */}
            <CardColumns>
              {/* <Card> */}
              <Card body outline color="warning">
                <CardHeader>Active Knowledge Models</CardHeader>
                <CardBody className="akm-intro" >
                  {/* <CardTitle style={{ fontWeight: "bolder" }}>AKM</CardTitle> */}
                  <CardText>
                  Active Knowledge Modelling (AKM) is an innovative way to capture and use enterprise knowledge from practical work. AKM models have positive effects on cyclic design and operations, productivity, safety, reuse, collaboration and learning.
                    <br /><br />
                      AKM has matured for more than a decade. Modern open-source web technology has now reached a technical level that enables cost efficient large scale usage.
                    <br /><br />
                      The AKM novelty comes from how relationships between roles, tasks and information are captured and presented to the users in the form of interactive and visual workspaces that support collaboration between roles in a distributed work environment.
                    <br /><br />
                      The effects from deploying AKM based solutions are many.
                      Firstly roles and their workspaces can be designed to share critical views securing a shared situational awareness. I.e. supporting design parameter balancing, and that task execution is in line with applicable regulations and policies.
                      Secondly, task execution might create new tasks for other roles, and as such AKM makes collaboration more transparent, effective and precise, with direct impact on safety and security.
                    <br /><br />
                      <strong>Workspaces</strong>
                    <br />
                      Workspaces are composed of roles, tasks, views and information.
                    <br /><br />
                 </CardText>
                </CardBody>
                {/* </Card> */}
                {/* <Link href="/usersessions"><Button color="light">Show User Sessions</Button></Link> */}
                {/* <Card> */}
              </Card>

              <Card body outline color="danger">
                <CardHeader>IRTV Modelling</CardHeader>
                <CardBody style={{ backgroundColor: '#dedede' }} className="homepage3" >
                  <CardTitle style={{ fontWeight: "bolder" }}>Workspaces</CardTitle>
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
                <CardHeader>AKM Modelling</CardHeader>
                <CardBody className="homepage3" >
                  {/* <CardTitle>IRTV modelling</CardTitle> */}
                  <CardText>
                  <CardImg top width="90%" src="images/irtv1.png" alt="irtv figur" />
                  With AKM we can easily model new product structures, such as self-configurable components, systems and product families. 
                  This is supported by top-down as well as bottom-up workspace designed processes and role-oriented workspaces. 
                  <br /><br />
                  <strong>Product design, engineering and life-cycle services</strong> are currently based on modelling and using these disjoint structures:
                    <br />- <strong>Product structures:</strong> - functions, components, systems configurations, production and operations, and repair,
                    <br />- <strong>Organizational hierarchies</strong>, domain teams and discipline groups, and composed project teams,
                    <br />-  <strong>Processes flows:</strong> -activity-decomposed tasks, BPM delivery flows, IDEF0 patterns, work-patterns (eg. swimlanes),
                    <br />- <strong>Systems</strong>; - functions, components, modules, systems configurations
                </CardText>
                </CardBody>
              </Card>
            </CardColumns>
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
                  <br />- Activity decomposition and disjoint flows – business and project
                  <br />- Jobs are defined by tasks needed, no context is captured
                  <br />- Separate progress reporting and communication from processes
                  <br />- No balancing of parameters and values across disciplines and roles
                  <br />- No capture of practical dependencies and settings.
                </CardText>
              </CardBody>
              <Link href="/">
                <Button color="light"></Button>
              </Link>
            </Card>


            {/* </CardGroup> */}

            {/* <Card> */}
            <Card body inverse color="warning" >
              <CardBody className="hompage4">
                <CardText>
                  AKM is used to create Visual Collaboration Arena (VCA) that provide role-holder’s with contextualized workspaces and workplaces.
                  <br />Workspaces captures the dynamic interdependencies between roles, tasks, views and information.
                  <br />Workplaces is the instantiation of a workspace for a specific end user, supporting end user capabilities and data for workspace interaction.
                  <br />Role holders can be humans or software agents (bots) or a combination of the two that are accountable for the execution of tasks in line with the rules that apply for the task.
                  <br />
                  <br />The VCA can be understood as an “intelligent agent” that runs tasks capturing work environments and execute actions to enhance the environments.
                  <br />The environments will be a digital representation of the knowledge architectures including digital twins and alternative solutions.
                </CardText>
                <Link href="/">
                  <Button color="light"></Button>
                </Link>
              </CardBody>
            </Card>

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


