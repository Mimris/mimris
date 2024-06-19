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
import GettingStarted from "./content/GettingStarted";
import Project from "../components/Project";


const page = (props) => {
  // console.log('12', props);
  const dispatch = props.dispatch
  const [refresh, setRefresh] = useState(true)
  // function toggleRefresh() { setRefresh(!refresh); }
  const toggleRefresh = props.toggleRefresh

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
    <div className="workpad me-2" >
      <div className="homepage pt-2 pr-0">
        <div className="p-0 pt-0">
          <GettingStarted />
          {/* </div>
        <div className="col" style={{maxHeight: "42px"}}> releasenotes */}
          <Card className="card mt-2 me-3"
            style={{
              maxHeight: "60vh", overflow: "scroll",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.2)",
              position: "relative",
              backdropFilter: "blur(5px)",
              WebkitBackdropFilter: "blur(5px)",
              display: "block",
              margin: "0 auto",
              padding: "0px"
            }}
          >
            <CardHeader className="card-header " >AKMM release log ... </CardHeader>
            {/* <CardBody className="card-body" >  
              <CardTitle className="card-title-bold" >Backlog ...</CardTitle>
              <CardText >
                  &bull; Workplace templates for reflective workplace modelling! <br />
                  &bull; Strokewidth for synbol border and relship line!<br />
                  &bull; GraphQL shema reporting from Solution models!<br />
              </CardText>
            </CardBody> */}
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release Alpha: 2024.06.19</CardTitle>
              <CardText >
                &bull;Bug fixes <br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release Alpha: 2024.06.18</CardTitle>
              <CardText >
                &bull;Bug fixes and update Help <br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release Alpha: 2024.06.13</CardTitle>
              <CardText >
                &bull;Bug fixes and update Help <br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release Alpha: 2024.05.28</CardTitle>
              <CardText >
                &bull;Bug fixes and fewer RELOAD necessary <br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release Alpha: 2024.02.22</CardTitle>
              <CardText >
                &bull;Added more learning material in Videos tab<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release Alpha: 2024.02.21</CardTitle>
              <CardText >
                &bull;Bugfixed and minor layout changes<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release Alfa: 2024.02.19</CardTitle>
              <CardText >
                &bull; New top Project menubar<br />
                All project related functions are now in the Project menubar. <br />
                &bull; New videos in the Video top menu<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release Beta: 2024.02.19</CardTitle>
              <CardTitle className="card-title-bold" >Release Final: 2024.02.19</CardTitle>
              <CardText >
                &bull; Updated!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2024.02.18</CardTitle>
              <CardText >
                &bull; New features: Layout on Object tree<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2024.02.03</CardTitle>
              <CardText >
                &bull; New features:<br />
                - New Video page with instruction  and demo videos.<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2024.01.29</CardTitle>
              <CardText >
                &bull; New features:<br />
                - Import OSDU Schema files as AKMM Metamodels.<br />
                - Integrating GitHUb Issues and GitHub Project in AKMM.<br />
                - Added Project overview on Home page with info about Organisation, GitHub Repository and Model Project files.<br />
                - Included GitHub repository README.md file in AKMM home Page.<br />
                - Added info about Issues and Project in current "Context and Focus" .<br />
                - Added Task right side-panel showing witch Tasks can be performed with current Metamodel.<br />
                - New function: Right-click on Object and make layout of the Object's children.<br />
                - Updated Metamodels for Core, IRTV and OSDU.<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2023.11.09</CardTitle>
              <CardText >
                &bull; New features:<br />
                - Select Sort/filter in Objects.<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2023.11.09</CardTitle>
              <CardText >
                &bull; New features:<br />
                - Select Sort/filter in Objects.<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2023.11.03</CardTitle>
              <CardText >
                &bull; New features:<br />
                - New Button - "NEW MODELPROJECT" - in Modeling Bar. This opens a dialog to choose a new modelproject from a list of templates from GitHub.<br />
                - Tree new startup models from GitHub - "AKM-CORE-Startup_PR" - "AKM-IRTV-Startup_PR" - "AKM-OSDU-Startup_PR". These startup-models are used for "Type definition modeling", "Concept modeling" and "Import av OSDU Schema JSON-files".<br />
                - New Guide/Help button "Tasks" - to the right in the Modeling Bar. Here you will find a list of tasks with descriptions, to be performed in the modelling process.<br />
                - New Copy button in the Modeling Bar. This button copy the current model and focus that can be pasted as a link i.e. in a e-email. <br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2023.07.19</CardTitle>
              <CardText >
                &bull; New features:<br />
                - ExportSVG button for saving current modelview as SVG-file<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2023.02.10</CardTitle>
              <CardText >
                &bull; New features:<br />
                - Dropdown list in Palette to choose Modelling tasks, i.e. IRTV-POPS modelling, Property modelling!<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2023.03.01</CardTitle>
              <CardText >
                &bull; New features:<br />
                - Updated "Modelfile" dialog with save models and modleview incl. metamodels and objects!<br />
                - New functionality for ports on Process and Activity objects (IDEF0)!<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2023.01.16</CardTitle>
              <CardText >
                &bull; New features:<br />
                - New Project page "/project" with info about Organisation, GitHub Repository and Model Project files.<br />
                - The Page also includes info about current "Context and Focus".<br />
                - Links back to GitHub repositories are also provided".<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2022.10.06</CardTitle>
              <CardText >
                &bull; New features:<br />
                - Type descriptions in Object diaglog<br />
                - On background menu: Toggle show relationship names.<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2022.09.24</CardTitle>
              <CardText >
                &bull; Objects moved from Palette area to Modeller Area<br />
                &bull; More models added to https://github.com/Kavca/<br />
                &bull; Added dialogbox at startup asking if you want to load the saved - refreshed model project.<br />
                &bull; This can be nice if the Browser crash or stop responding.<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2022.08.22</CardTitle>
              <CardText >
                &bull; New functionality for metamodelling of activity/task modelling.<br />
                &bull; More startup models on GitHub Kavca.<br />
                &bull; Procedure for uploading Models to GitHub is published in the README file on <a href="https://github.com/Kavca/akm-models/" target="_blank">https://github.com/Kavca/akm-models/</a><br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2022.08.06</CardTitle>
              <CardText >
                &bull; New button in the model top-bar for loading StartupModels from GitHub".<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2022.07.11</CardTitle>
              <CardText >
                &bull; New Recovery button in the model top-bar.<br />
                &bull; Enhancements! <br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2022.06.13</CardTitle>
              <CardText >
                &bull; New "Choose File" and "Save" button in the model top-bar".<br />
                &bull; Enhancements! <br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2022.03.10</CardTitle>
              <CardText >
                &bull; Save Project with current date in the end of the filename.<br />
                &bull; <br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2022.02.28</CardTitle>
              <CardText >
                &bull; Generate metamodel is now working.<br />
                &bull; OSDU JSON-file import to AKM Objects<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2021.11.22</CardTitle>
              <CardText >
                &bull; Update Getting started on the Homepage.<br />
                &bull; Tabs in property-dialog<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2021.11.11</CardTitle>
              <CardText >
                &bull; Added more Help items in help.<br />
                &bull; Edit Project name direct!<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2021.11.02</CardTitle>
              <CardText >
                &bull; Added more Help items in help.<br />
                - Getting started File open /save <br />
                - GitHub sync<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2021.10.21</CardTitle>
              <CardText >
                &bull; Added Help in top-menu. Here you will find help and user-guides.<br />
                &bull; Adde filter buttons in ObjectType Palette.<br />
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2021.10.08</CardTitle>
              <CardText >
                &bull; New Method objects that can be connected to Property objects in the metamodel.<br />
                &bull; Improvements on the pop-up menues.<br />
                &bull; Replace metamodel on background menu<br />
                &bull; Import OSDU Jsonfiles to AKM-Etity types with properties<br />
                &bull; Bugfixes!<br /><br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2021.04.12</CardTitle>
              <CardText >
                &bull; Added "Delete Objecttypes and Relationshiptypes" in Metamodelling.<br />
                &bull; Copies of Objectviews are shown with lightblue bordercolor.<br />
                &bull; Bugfixes!<br /><br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2021.03.28</CardTitle>
              <CardText >
                &bull; New rightclick menuitem "Change icon" on objectviews.<br />
                &bull; New button "Show deleted" under diagram for showing deleted objects.<br />
                &bull; Background menu "Undelete Selection" to undelete objects/objectviews.<br />
                &bull; Bugfixes!<br /><br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2021.03.18</CardTitle>
              <CardText >
                &bull; Added automatic layout!<br />
                &bull; Fix typeview chances in metamodel works in model!<br />
                &bull; New button "File" to Export/Import to/from file<br />
                &bull; "Local &gt; Recovery" button recovers the whole project<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2021.03.12</CardTitle>
              <CardText >
                &bull; Kavca logo with link to kavca.no!<br />
                &bull; Added button for save/upload local file!<br />
                &bull; Input pattern and Field type related to Datatype<br />
                &bull; Attributes with inputpattern and value dropdownlist generated to TargetMetamodel<br />
              </CardText>
            </CardBody>

            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2021.02.24</CardTitle>
              <CardText >
                &bull; New popup menues for Edit ......!<br />
                &bull; Added popup menu for "Change Icon" on Objectviews!<br />
                &bull; Added Select all views of this object!<br />
                -  (Showing all objectview copies of an object (Instance) )<br />
                &bull; Bugfixes!<br /><br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title-bold" >Release 2021.02.16</CardTitle>
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
              <CardTitle className="card-title-bold" >Release 2021.02.11</CardTitle>
              <CardText >
                &bull; Bugfixes!<br />
              </CardText>
            </CardBody>
            <CardBody className="card-body" >
              <CardTitle className="card-title.bold" >Release 2021.02.05</CardTitle>
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
        </div>
        {/* <div className="col">
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
                <Blog />
            </CardBody>
          </Card>
        </div> */}
      </div>
    </div>
  )

}
export default Page(connect(state => state)(page));


