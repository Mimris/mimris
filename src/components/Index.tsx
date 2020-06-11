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
      <div className="workpad p-1 bg-light">
        <div className="homepage1 bg-light ">
          <div>
            <CardColumns>

                <Card className="card bg-secondary p-0 mb-2" >
                  <CardBody id="lighten" className="homepage2 bg-secondary p-2" >
                    <CardHeader className="header2 bg-light p-2">AKM Modeller</CardHeader>
                                {/* <CardTitle style={{ fontWeight: "bolder" }}>AKM Modeller</CardTitle> */}
                    <CardText className="bg-light p-4">
                      
                      AKM Modeller is the tool for building Aktive Knowledge Models, a modelling tool with integrated Modelling and Metamodelling capabilities.
                    <br/> Log in by clicking on the arrow to the right in the top-menu.<br /> ( if you are not registered, you will be asked to Sign up first)
                    <br/>Start modelling by select "Metamodelling" or "Modelling" in the main menu above. <br />You can also access it from the help menu to the left.
                    (The task menu can be minimized by clickin on the &lt;-sign)
                    </CardText>
                  </CardBody>
                </Card>
              <Card body outline color="warning">
                <CardHeader>Aktive Knowledge Modelling</CardHeader>
                <CardBody className="akm-intro" >
                  {/* <CardTitle style={{ fontWeight: "bolder" }}>AKM</CardTitle> */}
                  <CardText>
                    Active Knowledge Modelling (AKM) is a innovative and disruptive way to capture and use enterprise knowledge from practical work with  positive effects on productivity, safety,
                    collaboration and learning.
                   
                  </CardText>
                </CardBody>
                {/* </Card> */}
                {/* <Link href="/usersessions"><Button color="light">Show User Sessions</Button></Link> */}
                {/* <Card> */}
              </Card>
     
                <Card className="bg-warning" body outline color="primary" >
                <CardHeader>Blog </CardHeader>
                <CardBody className="homepage1 bg-light" >
                  <CardTitle style={{ fontWeight: "bolder" }}>Release 2020.06 06</CardTitle>
                  <CardText>
                  1st version of AKMM awailable on Heroku! sf  
                  </CardText>
                </CardBody>
                <CardBody className="homepage1 bg-light" >
                  <CardTitle style={{ fontWeight: "bolder" }}>Release 2020.06.11</CardTitle>
                  <CardText>
                    1st version of AKMM with Metamodellin on Heroku! sf  
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


