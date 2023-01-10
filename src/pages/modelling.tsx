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
import StartInitStateJson from '../startupModel/INIT-Startup_Project.json'
import GenGojsModel from "../components/GenGojsModel";

// import SelectVideo from '../components/SelectVideo'
// import DispatchLocal from '../components/utils/SetStoreFromLocalStorage'
// import useLocalStorage from '../hooks/use-local-storage'
// import DispatchFromLocalStore from '../components/utils/DispatchFromLocalStore'
// import LoadInitial from "../components/loadModelData/LoadInitmodel";
// import { loadState, saveState } from '../components/utils/LocalStorage'

const debug = false

const useEfflog = console.log.bind(console, '%c %s', // green colored cosole log
    'background: red; color: white');

const page = (props:any) => {
  
  const dispatch = useDispatch()

  function dispatchLocalStore(locStore) { 
    const { phData, phFocus, phSource, phUser } = locStore
    // dispatch({type: 'LOAD_DATALOCAL', locStore })

    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: locStore.phData })
    dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: locStore.phFocus })
    dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: locStore.phSource })
    dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: locStore.phUser })
}



  const { query } = useRouter(); // example: http://localhost:3000/modelling?repo=Kavca/kavca-akm-models&path=models&file=AKM-IRTV-Startup.json

  if (debug) console.log('32 modelling', props) //(props.phList) && props.phList);
  const [mount, setMount] = useState(false)
  const [refresh, setRefresh] = useState(true);
  const [params, setParams] = useState(null);
  const [data, setData] = useState(null);

  const [refreshContext, setRefreshContext] = useState(true);

  const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', []); //props);
  const [render, setRender] = useState(false);


  const [visible, setVisible] = useState(false)
  function toggle() { setVisible(!visible); }
  const [visibleTasks, setVisibleTasks] = useState(true)
  // function toggleTasks() {
  //   setVisibleTasks(!visibleTasks);
  // }
  // const state = useSelector(state => state)
  if (debug) console.log('49 modelling',props)

  useEffect(() => { 
    if (!debug) console.log('73 modelling useEffect 2', memoryLocState[0], props.phData, props.phSource)
    if ((memoryLocState != null) && (memoryLocState.length > 0) && (memoryLocState[0].phData)) {
    if ((window.confirm("Do you want to recover your last model project?"))) {
      if (Array.isArray(memoryLocState) && memoryLocState[0]) {
          const locStore = (memoryLocState[0]) 
          if (locStore) {
            dispatchLocalStore(locStore)
          }
        } 
      }
    }   
    setMount(true)
  }, []) 



  // useEffect(() => {
  //   async function fetchGithub() {
  //     const data = await query;
  //     // const data = await response.json();
  //     setData(data);
  //   }
  //   fetchGithub();
  // }, [(Object.keys(query).length !== 0)]);





  // useEffect(() => {
  //   console.log('118 modelling useEffect 2', (Object.keys(query).length !== 0), props.phData?.metis?.name)
  //   dispatch({ type: 'SET_FOCUS_REFRESH', data: {id: Math.random().toString(36).substring(7), name: 'refresh'} })
  // }, [Object.keys(query).length !== 0])

  // }, [dispatchGithub, dispatch, props.phData?.metis?.name])
  // }, [Object.keys(query).length !== 0])

  // useEffect(() => { // ask to load the model from memoryLocState
  //   setMount(true)
  //   if (!debug) useEfflog('69 modelling useEffect 2', query, query?.repo )
  //   // setRefresh(!refresh)
  //   if (!debug) useEfflog('71 modelling useEffect 2', query, query?.repo )
  //   // const { repo, path, file } = params.repo ? params : query
  //   if (params) {
  //   // if (Object.keys(query).length !== 0) {
  //     if (!debug) useEfflog('88 modelling useEffect 2', params )
  //     if ((window.confirm("Do you want to load the GitHub model?"))) {
  //       dispatchGithub(query)       
  //     } 
  // }

  // }, [params])



  useEffect(() => { // refresh the model when localstorage is loaded
    if (debug) useEfflog('modelling 87', props, props.phFocus.focusModelview.name)
    const timer = setTimeout(() => {
      // dispatch({ type: 'SET_FOCUS_MODELVIEW', data })
      GenGojsModel(props, dispatch)
      dispatch({type: 'SET_FOCUS_REFRESH', data: {id: 'initial', name: 'initial'}})
      if (debug) useEfflog('modelling 90', props.phData, props.phFocus.focusModelview.name)
    }, 5000)
    clearTimeout(timer)
  }, [props.phFocus.focusModelview.id])


  
  
  // if (query.repo !== undefined) dispatch({type: 'LOAD_DATAGITHUB', query})
 

  // create anb useEffect to load the model from the query parameters
  // useEffect(() => { // load the github model defined in the query
  //   if (!debug) useEfflog('64 modelling useEffect 2', query)
  //   setMount(true)
  //   if (query.repo !== undefined) {
  //     if (!debug) useEfflog('66 modelling useEffect 2', query)
  //   }
  // }, [])




  const contextDiv = (
    <div className="contextarea d-flex bg-light" style={{width: "99%", maxHeight: "24px"}}> 
      <SetContext className='setContext' ph={props} />
      <div className="contextarea--context d-flex justify-content-between align-items-center " style={{ backgroundColor: "#dcc"}}>
        <SelectContext className='ContextModal mr-2' buttonLabel='Context' phData={props.phData} phFocus={props.phFocus} /> 
        <Link className="video p-2 m-2 text-primary" href="/videos"> Video </Link>
      </div>
    </div>
  ) 


  const modellingDiv = (mount)
    ?  <div>
       <Layout user={props.phUser?.focusUser} >
        <div id="index" >
          <div className="wrapper" >
            {/* <div className="header" >
              <Header title={props.phUser?.focusUser.name} /> 
            </div> */}
            {/* {videoDiv}           */}
            <div className="workplace" >     
              {contextDiv}            
              {/* {mount ? <>{contextDiv}</> : <>{contextDiv}</>}              */}
              {/* <div className="tasksarea mr-1" style={{ backgroundColor: "#eed", borderRadius: "5px 5px 5px 5px" }} >
                <TasksHelp />
              </div> */}
              <div className="workarea p-1 w-100" style={{ backgroundColor: "#ddd" }}>
                {/* {refresh ? <> {modellingDiv} </> : <>{modellingDiv}</>} */}
                <Modelling />
              </div>
            </div>
            <div className="footer">
              <Footer />
            </div>
          </div>
        </div>
      </Layout>
    </div>
    : <>No model loaded</>

return (
   <>
   {modellingDiv}
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
    //  height: 101%;
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
     // grid-area: contextarea;
     // display: grid;
     // border-radius: 4px;
     // // outline-offset:-6px;
     // padding: 0px;
     // margin: 0px;
     // font-size: 80%;
     background-color: #e8e8e8;
     // color: #700;
     // max-height: 20px; 
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
  </>)
}
export default Page(connect(state => state)(page));





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