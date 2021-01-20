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
  //   genGojsModel(state, dispatch)
  //   gojsmodel = state.phFocus.gojsModel
  // }, [focusModelview])

  return (
    <>
      <div className="workpad p-1 bg-light" >
        <div className="homepage pt-2" >
          <div>
            <CardColumns>
              <Card className="card" 
                                            style={{
                                              background: "rgba(255,255,255,0.4)",
                                              borderRadius: "10px",
                                              border: "1px solid rgba(255,255,255,0.2)",
                                              position: "relative",
                                              backdropFilter: "blur(5px)",
                                              webkitBackdropFilter: "blur(5px)",
                                              // display: "block",
                                              // margin: "0 auto",
                                              padding: "2px"
                                            }}
              >
                  <CardHeader className="card-header ">Modelleing with AKM Modeller:</CardHeader>
                <CardBody className="card-body" style={{backgroundColor: "rgba(255,255,005,0.2)"}}>
                  <CardTitle className="card-title" style={{ fontWeight: "bolder" }}>To get started !</CardTitle>
                  <CardText className="card-text"> 
                    <strong>Select Modelling in the top menu </strong><br />
                    (An initial example template model is loaded)
                    <br /><br /><strong>Click the "Local" button (above the modelling area) </strong><br />to open the diaglog for Saving and Loading models to/from the LocalStore.
                    <br /><br /><strong>Click the "Server" button (above the modelling area) </strong><br />to open the diaglog for Saving and Loading models to/from the Server Repository.
                    <br /><br /><strong>For help: Click "Task / Help" bar to the left!</strong> <span className="text-secondary" >(Not fully implemented yet !!!)</span>
                    {/* <br /><br />
                    <br /> Log in by clicking on the arrow to the right in the top-menu.<br /> ( if you are not registered, you will be asked to Sign up first)
                    <br /><br />Start modelling by select "Modelling" in the main menu above.  */}
                  </CardText>
                </CardBody>
              {/* </Card>
              <Card className="card p-0 mb-2" > */}
                <CardBody className="card-body" style={{backgroundColor: "rgba(255,255,225,0.4)"}}>
                  {/* <CardHeader className="header2 bg-light p-2">To get started:</CardHeader> */}
                  <CardTitle style={{ fontWeight: "bolder" }}>Tips !</CardTitle>
                  <CardText className="card-text "> 
                    <strong><strong>Save current model to a file: <br />
                    <br />Click on the "Local" button </strong>
                    <br />Select "Download Current Model to File". </strong>
                    <br />... the model is downloaded to the "downloads" folder. 
                    <br /><br />
                    <strong><strong>In case of hang or crash </strong></strong><br />
                    <strong> 
                      - Reload the webpage! ...then before anything else:<br />
                      - Select "Recover Unseaved Models from MemoryStorage". </strong>
  
                    <br /><br /><strong> </strong>
                    {/* <strong>Save current models to a file: <br />(Requirement:</strong> Chrome browser with RemoteDev DevTools Extensions installed) 
                    
                    <br /><br /><strong>Right click the meny bar at the top </strong>
                    <br />Select "Inpect" (a ).
                    <br /><br /><strong>Click "Export" at the bottom meny) </strong>
                    <br />... the Redux store (incl. all actions) will be exported and downloaded to "downloads" folder. 
                    <br /> (Tip: Rename the file to include date and move/copy it to a folder to keep history of your model).
                    <br />(The file can be loaded later or sent by email to someone for review) */}

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
                                webkitBackdropFilter: "blur(5px)",
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
                                webkitBackdropFilter: "blur(5px)",
                                // display: "block",
                                margin: "0 auto",
                                padding: "2px"
                              }}              
              >
                <CardHeader className="card-header">Aktive Knowledge Modelling</CardHeader>
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
                    {/* <a href='On AKM modelling (7).html'>Paper: On AKM Modelling</a> */}                
                  </CardText>
                </CardBody>
                {/* </Card> */}
                {/* <Link href="/usersessions"><Button color="light">Show User Sessions</Button></Link> */}
                {/* <Card> */}
              </Card>

    
              <Card className="card" body outline color="primary" 
                    style={{
                      background: "rgba(255,255,255,0.4)",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.2)",
                      // position: "relative",
                      backdropFilter: "blur(5px)",
                      webkitBackdropFilter: "blur(5px)",
                      // display: "block",
                      margin: "0 auto",
                      padding: "2px"
                    }}
              >
                <CardHeader className="card-header" >Blog AKMM releases </CardHeader>
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


