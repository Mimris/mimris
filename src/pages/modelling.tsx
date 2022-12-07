//@ts-check
import React, { useState, useEffect } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
// import { loadData, loadDataGithub, loadDataModelList } from '../actions/actions'
import Link from 'next/link';
import { useRouter } from "next/router";
import Page from '../components/page';
import Layout from '../components/Layout';
import Header from "../components/Header"
import Footer from "../components/Footer"
import Modelling from "../components/Modelling";
import SetContext from '../defs/SetContext'
import SelectContext from '../components/SelectContext'
import TasksHelp from '../components/TasksHelp'
import useLocalStorage  from '../hooks/use-local-storage'
import { NavbarToggler } from "reactstrap";

// import SelectVideo from '../components/SelectVideo'
// import DispatchLocal from '../components/utils/SetStoreFromLocalStorage'
// import useLocalStorage from '../hooks/use-local-storage'
// import DispatchFromLocalStore from '../components/utils/DispatchFromLocalStore'
// import LoadInitial from "../components/loadModelData/LoadInitmodel";
// import { loadState, saveState } from '../components/utils/LocalStorage'

const debug = false

const page = (props:any) => {
  
  const dispatch = useDispatch()
  if (debug) console.log('57 modelling', (props.phList) && props.phList);

  // const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', null); //props);

  const [visible, setVisible] = useState(false)
  function toggle() { setVisible(!visible); }
  const [visibleTasks, setVisibleTasks] = useState(true)
  function toggleTasks() {
    setVisibleTasks(!visibleTasks);
  }
  // const state = useSelector(state => state)
  if (debug) console.log('23 modelling',props)
  const [refresh, setRefresh] = useState(true);
  // const [urlParams, setUrlParams] = useState(null);

  // ............ First check if there is
  const {query} = useRouter(); // example: http://localhost:3000/modelling?repo=Kavca/kavca-akm-models&path=models&file=AKM-IRTV-Startup.json
  // setUrlParams(query);

  // useEffect(() => { // load the github model defined in the query
  //   if (!debug) console.log('modelling 38', query.repo, query.path, query.file)
  //   dispatch({type: 'LOAD_DATAGITHUB', query}) // load list of models in repository
  // }, [(query.repo)])

  // if (!query.repo) {
  //   if ((memoryLocState != null) && memoryLocState.length > 0) {
  //     if ((window.confirm("Do you want to recover your last model project?"))) {
  //       if (Array.isArray(memoryLocState) && memoryLocState[0]) {
  //         store = (memoryLocState[0]) 
  //       } 
  //     }
  //   }

  // }

  useEffect(() => { // load the github model defined in the query
    if (!debug) console.log('modelling 38', query.repo, query.path, query.file)

    dispatch({type: 'LOAD_DATAGITHUB', query}) // load list of models in repository
    
    const timer = setTimeout(() => {
      // genGojsModel(props, dispatch);
      setRefresh(!refresh)
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [(query.repo)])
  
  if (false) {
  // const curStore = async (state) => {
  //   await LoadInitial(state) 
  //   .then((data) => 
  //     {
  //       dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: curStore.phData })
  //       dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: curStore.phFocus })
  //       dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: curStore.phUser })
  //       let source = (curStore.phSource === "") ? curStore.phData.metis.name : curStore.phSource
  //       dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: curStore.source })
  //     }
  //   )
  //   .catch((err) => console.log('error:', err));
  // }

  // console.log('32 curStore',curStore)

  

  // const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', null);
  // DispatchFromLocalStore(memoryLocState)
  // console.log('23 modelling', memoryLocState);
  // if (props && props?.phSource === 'initialState' ) { // if initialState load memoryState if exists
  //   if (typeof window !== "undefined") {
    //   const loadMemory = confirm("Open saved memory model?");
      // if (loadMemory) {
        // if ((typeof window !== "undefined") && props && props?.phSource === 'initialState' ) {
        // if (memoryLocState && props?.phSource === 'initialState' && confirm('Do you want to load model the saved memory?')) 
        // if (memoryLocState ) {
        //   // Save it!
        //   const memoryState = {
        //     ...memoryLocState,
        //     phSource: 'savedMemory'
        //   }
        //   // console.log('35 modelling', memoryState);
        //   DispatchFromLocalStore(memoryState)
        // }
      // }
  //   }
  // }
  }
 
  const modellingDiv = <Modelling /> 

  // const [videoURL, setVideoURL] = useState(null)
  // const videoDiv = <StartVideo  videoURI='/videos/snorres.mp4' />

  return (
    <div>
       <Layout user={props.phUser?.focusUser} >
        <div id="index" >
          <div className="wrapper" >
            {/* <div className="header" >
              <Header title={props.phUser?.focusUser.name} /> 
            </div> */}
            {/* {videoDiv}           */}
            <div className="workplace" >
              <div className="contextarea" >
                <div className="help d-flex">
                  <SetContext className='setContext flex' ph={props} />
                  <SelectContext className='ContextModal m-0 p-0' buttonLabel='Context' phData={props.phData} phFocus={props.phFocus} /> 
                  <Link href="/videos">
                    {/* <a className="nav-link bg-warning py-0 text-white border" style={{height: "22px"}} > */}
                      Video
                      {/* </a> */}
                      </Link>
                  {/* <SelectVideo className='VideoModal' buttonLabel='!' phFocus={props.phFocus} />  */}
                  {/* <button className="helpbutton float-right m-0 py-0 bg-warning color-white" onClick={onplayVideo}>i</button> */}
                </div>
              </div>
              <div className="tasksarea mr-1" style={{ backgroundColor: "#eed", borderRadius: "5px 5px 5px 5px" }} >
                {/* <div className="tasksarea" style={{ paddingLeft: "2px", marginLeft: "0px",backgroundColor: "#eed", borderRadius: "5px 5px 5px 5px" }} > */}
                <TasksHelp />
              </div>
              <div className="workarea p-1 w-100" style={{ backgroundColor: "#ddd" }}>
                {refresh ? <> {modellingDiv} </> : <>{modellingDiv}</>}
                {/* <Modelling /> */}
              </div>
            </div>
            <div className="footer">
              <Footer />
            </div>
          </div>
        </div>
      </Layout>
      <style jsx>{`
      .wrapper {
        display: grid;
        height: 101%;
        min-height: 101%;
        // grid-template-columns: 1fr auto;
        // grid-template-rows:  auto;
        grid-gap: 0px;
        grid-template-areas:
        "header"
        "workplace"
        "footer";
      }
      .workplace {
        grid-area: workplace;
        display: grid ;
        height: 101%;
        // min-height: 101%;
        // background-color: #ddd;
        grid-template-columns: auto 1fr;
        grid-template-areas:
        "contextarea contextarea"
        "tasksarea workarea";
      }

      // @media only screen and (max-width: 475px) {
      // .workplace {
      //     grid-area: workplace;
      //     display: grid ;
      //     background-color: #aaa;
      //     grid-template-columns: auto 2fr;
      //     grid-template-areas:
      //     "taskarea"
      //     "workarea";
      //   }
      // }

      .contextarea {
        grid-area: contextarea;
        display: grid;
        border-radius: 4px;
        // outline-offset:-6px;
        padding: 0px;
        margin: 0px;
        font-size: 80%;
        background-color: #e8e8e8;
        color: #700;
        max-height: 20px; 
      }
      .tasksarea {
        grid-area: tasksarea;
        padding: 0px;
        margin-right: 0px;
        padding-right: 3px;
        border: 2px;
        border-radius: 5px 5px 5px 5px;
        border-width: 2px;
        // border-color: #000;
        background-color: #ffe;
        // max-width: 220px;
        // font-size: 100%;
      }
      .workarea {
        grid-area: workarea;
        // display: grid ;
        border-radius: 5px 5px 0px 0px;
        // padding-right: 4px;
        // max-width: 400px;
        // min-height: 60vh;
        grid-template-columns: auto;
        grid-template-areas:
        "workpad";
      }
        .workpad {
          grid-area: workpad;
          display: grid;
          border-radius: 5px 5px 0px 0px;
          // height: 100%;
          // width: 100vh;
          // min-width: 400px;
          // grid-template-columns: auto 1fr;
          // grid-template-areas: 
          // "myPalette myModeller";         
        }
        // .myPalette {
        //   grid-area: myPalette;
        //   // margin: 2px;
        //   // padding-right: 3px;
        //   // height: 100%;
        //   // // min-height: 50vh;
        //   // border-radius: 5px 5px 0px 0px;
        //   // background-color: #ddd; 
        //   // // max-width: 200px;    
        //   // // min-width: 400px;
        // }
        // .myModeller {
        //   grid-area: myModeller;
        //   // // height: 100%;
        //   // margin: 2px;
        //   // padding-right: 3px;
        //   // border-radius: 5px 5px 0px 0px;
        //   // background-color: #e0e;
        //   // // width: 100%;
        //   // max-width: 10hv;
        // }
      p {
        color: white;
      }
     `}</style>

    </div>
  )
}
export default Page(connect(state => state)(page));