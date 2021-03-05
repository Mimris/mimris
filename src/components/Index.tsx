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
import Blog from './Blog'
import { toNamespacedPath } from "path";

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
  //   genGojsModel(state, dispatch)
  //   gojsmodel = state.phFocus.gojsModel
  // }, [focusModelview])


  return (
    <>
      <div className="workpad p-1 bg-light" >
        <div className="homepage pt-2 pr-2" >
          <div>
            <CardColumns >
              <Card className="card" 
                style={{
                  background: "rgba(255,255,255,0.4)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  position: "relative",
                  backdropFilter: "blur(5px)",
                  WebkitBackdropFilter: "blur(5px)",
                  // display: "block",
                  // margin: "0 auto",
                  padding: "0px"
                }}
              >
                <CardHeader className="card-header ">Modelling with AKM Modeller:</CardHeader>
                <CardBody className="card-body" style={{backgroundColor: "rgba(255,255,005,0.2)"}}>
                  <CardTitle className="card-title" style={{ fontWeight: "bolder" }}>To get started !</CardTitle>
                  <CardText className="card-text"> 
                    <strong>Select Modelling in the top menu </strong><br />
                    (An initial empty model is loaded)
                    <br /><br /><strong>Start modelling by Select, drag and drop objecttypes from the left palette to the modelling area to the right. </strong><br /> 
                    We recomment to start with a container and then drop objects into the container. You can resize the the container by draging the corners.
                    <br /><br /><strong>You can save your Project to Local Store by clicking the "Local" button above the modelleing area.</strong> 
                    <br /> Then click on the "Save the Project to LocalStorage" button.
                    <br /><br />You can also download the Project to your computer by clicking on the "Download Project to file" button.
                    <br /><br />Projects can be uploaded from files by clicking on the "Upload Model(s) from file and select file. 
                    <br /><br /><strong>Upload to Server</strong><br />Projects can also be uploaded to a Cloud Server by clicking on the "Server" button. 
                  </CardText>
                </CardBody>
              </Card>
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
                <CardBody className="card-body" style={{backgroundColor: "rgba(255,255,225,0.4)"}}>
                  <CardHeader className="card-header">Terminologi!</CardHeader>
                  <CardTitle style={{ fontWeight: "bolder", fontSize: "150%" }}>IRTV</CardTitle>
                  <CardText className="card-text "> 
                    <strong> IRTV stands for: Information, Role, Task, View</strong>
                    <br />We start with an built in IRTV-Metamodel, wich contain the basic building blocks for AKM Models <br />(shown in the left Palette in the modelling page). 
                    <br /><br />We use these building blocks to build an Active Knowledge Model, which in turn can be use to generate Solution models for interactive Role and Task oriented Workplaces for all Roles in enterprise projects . 

                  </CardText>
                  <CardTitle style={{ fontWeight: "bolder", fontSize: "150%" }}>Metamodel & Model</CardTitle>
                  <CardText className="card-text "> 
                     When building a model, we use some predefined objects called "Object Types". <br />   
                     <i>(Its can be compared to building a Lego model. Depending on which Lego blocks you have, we can build different models)</i>
                    <br /><br />In AKM modelling we have predefined a Metamodel with the IRTV building blocks. From these we can build any new Metamodels and Models of any kind. 
                    <br /><strong>(The App that builds the App). </strong>
                 
                    <br /><br /><i>(It is possible to build your own Metamodel from a basic Object and Relationship type)</i><strong> </strong>

                  </CardText>
                </CardBody>
              </Card>

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
                <CardHeader className="card-header">AKM Modeller</CardHeader>
                <CardBody className="card-body" >
                  {/* <CardTitle style={{ fontWeight: "bolder" }}>AKM Modeller</CardTitle> */}
                  <CardText className="card-text">          
                  AKM Modeller is the tool for building Active Knowledge Models, a modeling tool with integrated Use-case Modeling and Meta-modelling capabilities.
                    <br /><br />
                  With IRTV we can easily model new product structures, such as self-configurable components, systems and product families. This is supported by top-down as well as bottom-up workspace designed processes and role-oriented workspaces. 
                  The AKM Modeller can enhance the design and operation of Products, Organizations, Processes and Systems (POPS) by adding new concepts, properties, tasks,and work enhancing views.
                  </CardText>
                </CardBody>
              </Card>
              <Card className="card" body outline color="warning"
                style={{
                  background: "rgba(255,255,255,0.4)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  position: "relative",
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
                    Active Knowledge Modelling (AKM) is an innovative way to capture and use enterprise knowledge from practical work. AKM models have positive effects on cyclic design and operations, productivity, safety, reuse, collaboration and learning.
                    AKM has matured for more than a decade. Modern open-source web technology has now reached a technical level that enables cost efficient large scale usage.
                    <br /><br />
                    The AKM novelty comes from how relationships between roles, tasks and information are captured and presented to the users in the form of interactive and visual workspaces that support collaboration between roles in a distributed work environment.
                    <br /><br />
                    The effects from deploying AKM based solutions are many.
                    Firstly roles and their workspaces can be designed to share critical views securing a shared situational awareness. I.e. supporting design parameter balancing, and that task execution is in line with applicable regulations and policies.
                    Secondly, task execution might create new tasks for other roles, and as such AKM makes collaboration more transparent, effective and precise, with direct impact on safety and security.
                    <br /><br />
                    <br /><br />
                    (more in the About page ....)
                    <br /><br />           
                  </CardText>
                </CardBody>
              </Card>
              <Card className="card" body outline color="primary" 
                style={{
                  background: "rgba(255,255,255,0.8)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.6)",
                  // position: "relative",
                  backdropFilter: "blur(5px)",
                  WebkitBackdropFilter: "blur(5px)",
                  // display: "block",
                  // margin: "0 auto",
                  // padding: "2px"
                }}
                style={{maxHeight: 'calc(110vh - 210px)', maxWidth: "50vh", overflowY: 'auto', scrollableElement:{ scrollbarColor: "red yellow"} }} 

                // style={{'max-height': 'calc(130vh - 210px)', 'overflow-y': 'auto'}}
              >
                  <CardHeader className="card-header " >Blog AKMM releases </CardHeader>
                  <CardBody className="card-body" >
                    <CardTitle className="card-title" >Release 2021.02.24</CardTitle>
                    <CardText >
                        &bull; New popup menues for Edit .....!<br />
                        &bull; Added popup menu for "Change Icon" on Objectviews!<br />
                        &bull; Added Select all views of this object!<br />
                         - (Showing all objectview copies of an object (Instance) )<br />
                
                        &bull; Bugfixes!<br /><br />
                        <strong>ToBe implemented!</strong><br /><br />
                        &bull; Workplace templates for reflective workplace modelling! <br />
                        &bull; Popup select menu for new relships!<br />
                        &bull; Image picker to select icons!<br />
                        &bull; Strokewidth for synbol border and relship line!<br />
                        &bull; GraphQL shema reporting from Solution models!<br />
                        &bull; Instruction videos for modelling Best Practices! <br />
                        &bull; Enhancement of user interface! <br />
                        &bull; Enhancement of PWA (Progressive Web App) Cross plattform (PC, Mobile, Tablett) ! <br />

                    </CardText>
                  </CardBody>
                  <CardBody className="card-body" >
                    <CardTitle className="card-title" >Release 2021.02.16</CardTitle>
                    <CardText >
                        &bull; Added Delete ivisible Objects - mark as deleted on objects with no objectviews!<br />
                        &bull; Added Add Missing Reationship Views - restores relshipview from existing relships !<br />
                        &bull; Added Verify and Repair Model - Repairs some errors in the model!<br />
                        &bull; Added Edit Project - to change Project name and descriptions!<br />
                        &bull; Added colorpicker on object/relationship views!<br />
                        &bull; Added !PURGE DELETED! Cleanup of objects with no views.<br />
                        &bull; Bugfixes in Objects tab in Palette!<br />
                        &bull; Bugfixes!<br />
                    </CardText>
                  </CardBody>
                  <CardBody className="card-body" >
                    <CardTitle className="card-title" >Release 2021.02.11</CardTitle>
                    <CardText >
                        &bull; Bugfixes!<br />
                    </CardText>
                  </CardBody>
                  <CardBody className="card-body" >
                  <CardTitle className="card-title" >Release 2021.02.05</CardTitle>
                  <CardText >
                      New features added:<br />
                        &bull; Projects as collection of Models and Metamodels!<br />
                        &bull; Popup menues for editing Objects attributes!<br />
                        &bull; Layout improvements!<br />
                        &bull; Added Tooltips to many Buttons !<br />
                        &bull; Bugfixes!<br />
                  </CardText>
                </CardBody>

                <CardBody className="card-body" >
                  <CardTitle className="card-title" >Release 2020.12.18</CardTitle>
                  <CardText >
                    akmclient-beta.herokuapp.com
                      <br /> <br /> - Bugfixes
                  </CardText>
                </CardBody>
                <CardBody className="card-body" >
                  <CardTitle >Test Release 2020.11.18</CardTitle>
                  <CardText>
                    akmclient-beta.herokuapp.com
                      <br /> <br /> - Bugfixes in metamodelling
                  </CardText>
                </CardBody>
                <CardBody className="card-body" >
                  <CardTitle style={{ fontWeight: "bolder" }}>Test Release 2020.11.16</CardTitle>
                  <CardText>
                    akmclient-beta.herokuapp.com
                      <br /> <br /> - Bugfixes  
                  </CardText>
                </CardBody>
                <CardBody className="card-body" >
                  <CardTitle style={{ fontWeight: "bolder" }}>Test Release 2020.11.13</CardTitle>
                  <CardText>
                  akmclient-beta.herokuapp.com
                  <br /><br />Bugfix and new features:
                      <br /> - added Tables in top menu. 
                      <br /> - faster response when modelling <br />(not neccessary to refresh so often)
                      
                  </CardText>
                </CardBody>
                <CardBody className="card-body" >
                  <CardTitle style={{ fontWeight: "bolder" }}>Test Release 2020.06 06</CardTitle>
                  <CardText>
                    akmclient-beta.herokuapp.com
                    <br /><br />1st test version of AKMM awailable on Heroku! 
                  </CardText>
                </CardBody>
              </Card>
              <Card className="card" 
                style={{
                  background: "rgba(255,255,255,0.4)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  position: "relative",
                  backdropFilter: "blur(5px)",
                  WebkitBackdropFilter: "blur(5px)",
                  // display: "block",
                  // margin: "0 auto",
                  padding: "0px"
                }}
              >
              <CardHeader className="card-header " >Kavca Blog:</CardHeader>
              <CardBody  className="card-body">
                <CardTitle style={{ fontWeight: "bolder" }} >News: </CardTitle>
                <CardText > 
                  <Blog />
                </CardText>
              </CardBody>
            </Card>
            </CardColumns>
          </div>
        </div>
        <style jsx>{`
        `}</style>
      </div>
    </>
  )

}
export default Page(connect(state => state)(page));


