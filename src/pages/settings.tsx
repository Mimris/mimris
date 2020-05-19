// @ts-nocheck
import React, { useState } from "react";
import Link from 'next/link';
import { connect, useSelector, useDispatch } from 'react-redux';
import {
  CardGroup, Card, CardImg, CardText, CardBody,
  CardTitle, CardSubtitle, Button, CardLink, CardDeck, CardColumns
} from 'reactstrap';
import Page from '../components/page';
import Layout from '../components/Layout';
// import Index from '../components/Index';
import { loadData } from '../actions/actions'
import SetContext from '../defs/SetContext'
import Help from '../components/Help'

const page = (props: any) => {
  // console.log(props)
  const dispatch = useDispatch()

  // console.log('17', props.phData);
  const [loaded, setLoaded] = useState(false);

  if (!props.phData) {
    if (!loaded) {
      dispatch(loadData())
      setLoaded(true)
    }
  }

  const [visibleTasks, setVisibleTasks] = useState(true)
  function toggleTasks() {
    setVisibleTasks(!visibleTasks);
  }

  const tasks =
    <div>
      <btn className="btn-default bg-light btn-sm btn-block" onClick={toggleTasks}>{visibleTasks
        ? <><span style={{ paddingLeft: "5px" }}> Tasks - Help</span> <span style={{ float: "left" }} > &lt;  </span>
        </> : <div className="btn-vertical m-0 p-0" style={{ maxWidth: "6px", height: "100%", paddingLeft: "0px" }}><span> &gt; </span><span> T a s k s - H e l p</span> </div>}</btn>
      <div className="toggleTasks">
        {visibleTasks
          ? <Help />
          : <span></span>}
      </div>
    </div>

  const state = useSelector(state => state)
  const metis = (state.phData) && state.phData.metis
  // console.log('22', (metis) && metis);
  const modelName = (state.phFocus) && state.phFocus.focusModel.name
  const modelviewName = (state.phFocus) && state.phFocus.focusModelview.name

  const [showSubject, setShowSubject] = useState(false);
  const [showPlenary, setShowPlenary] = useState(false);

  const setContextDiv = (props.phFocus) && <SetContext phF={props.phFocus} />

  return (
    <>
      <Layout user={state.phUser.focusUser} >
        <div className="wrapper">
          <div className="workplace" >
            <div className="contextarea" >
              {setContextDiv}
            </div>
            <div className="tasksarea"  >
              {tasks}
            </div>
            <div className="settings-title bg-light m-1 pt-2 px-2">
              <h5>User profile and settings</h5>
            </div>
            <div className="settings">        
                  <CardColumns>
                  <Card body className="save-session" >
                    <CardTitle>Sessions</CardTitle>
                    <CardText>The session contain the current context and current focus as shown in the line just under the bop menu.
                    Context is current Org., Proj., Role, and Task.
                    Current focus the active models, modelview, objectview and object.
                    The current session can be saved for later use.
                    Several sessions can be stored.
                    A session can be sent as a link on email.
                    </CardText>
                    <Link href="/usersessions">
                      <Button color="light">Show User Sessions</Button>
                    </Link>
                    <br />
                    <Link href="/savesession">
                      <Button color="dark">Save current Session</Button>
                    </Link>
                  </Card> 

                  <Card body className="login" >
                    <CardTitle>Login:</CardTitle>  
                    <CardText>
                      You have to be logged inn to get access to the model store.
                      If you are not registered user, please sign up.
                      The login cookie expires after 4 hours.
                    </CardText>
                    <Link href="/login">
                      <Button  color="dark" >Login</Button>
                    </Link>
                  </Card> 
                  <Card body className="signup">
                    <CardTitle>Sign up</CardTitle>
                    <CardText>To start using AKMM service please sign up to get access the Model store.
                    </CardText>
                    <Link href="/signup">
                      <Button color="dark">Sign up</Button>
                    </Link>
                  </Card> 
                  <Card body className="users" >
                    <CardTitle>Users</CardTitle>
                    <CardText>List of users signed up for this service.
                    </CardText>
                    <Link href="/people">
                      <Button color="dark">Show Users</Button>
                    </Link> 
                  </Card> 
                  <Card body className="current-context" >
                    <CardTitle>Current Model Context: </CardTitle>
                    <CardText>Sign up to get a user to acces the Model store.
                    </CardText>
                      <Link href="/context">
                        <Button color="dark">Show Context</Button>
                      </Link>
                  </Card> 
                <Card body className="sql-db" >
                  <CardTitle>Test sql db:</CardTitle>
                  <CardText>Sign up to get a user to acces the Model store.
                      </CardText>
                  <Link href="/vehicles">
                    <Button color="dark">Show Vehicles</Button>
                  </Link>
                </Card> 
                  <Card body className="db-list" >
                  <CardTitle>List (test):</CardTitle>
                  <CardText>Sign up to get a user to acces the Model store.
                      </CardText>     
                  <Link href="/list">
                    <Button color="dark">List</Button>
                  </Link>
                </Card> 
                </CardColumns>
            </div>
          </div>
        </div>       
        <style jsx>{`
          .wrapper {
            display: grid;
            grid-template-columns: auto;
            grid-gap: 4px;
            grid-template-areas:
            "workplace";
          }
          .workplace {      
            grid-area: workplace;
            display: grid ;
            padding: 4px;
            background-color: #aaa;
            grid-template-columns: auto 2fr;
            // grid-auto-rows:auto auto 1fr;
            grid-template-areas:
            "contextarea contextarea"
            "tasksarea settings-title"
            "tasksarea settings";
          }
          .contextarea {
            grid-area: contextarea;
            display: grid;
            border-radius: 4px;
            outline-offset:-6px;
            padding: 0px;
            font-size: 60%;
            background-color: #e8e8e8;
            color: #000;
            max-height: 60px; 
          }
          .tasksarea {
            grid-area: tasksarea;
            padding: 2px;
            border: 2px;
            max-width: 200px;
            border-radius: 5px 5px 5px 5px;
            border-color: #000;
            background-color: #baa;
            font-size: 100%;
          }
          .settings {
            grid-area: settings;
            display: grid;
            padding: 12px;
            grid-gap: 6px;
            column-width: 8rem;
            column-count: 2;
            // columns: auto;
            // grid-template-columns: auto ;
            // grid-template-areas:
            // "login signup" 
            // "users sql-db"
            // "current-context user-session"
            // "db-list .";
          }
          // .title {
          //   grid-area: title;
          //   display: grid;
          // }
          // .login {
          //   background-color: red;
          //   // grid-area: settings;
          //   // display: grid;
          // }
          // .signup {
          //   grid-area: signup;
          //   display: grid;
          // }
          // .users {
          //   grid-area: users;
          //   display: grid;
          // }
          // .sql-db {
          //   grid-area: sql-db;
          //   display: grid;
          // }
          // .current-context {
          //   grid-area: current-context;
          //   display: grid;
          // }
          // .acard {
          //   background-color: red;
          //   padding: 5px;
          // }
          `}</style>
      </Layout>
    </>
  )
}
export default Page(connect(state => state)(page));

