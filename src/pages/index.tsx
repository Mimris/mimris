// @ts-nocheck
import React, { useState,  useEffect } from "react";
import { Router, useRouter } from "next/router";
// import { connect } from 'react-redux';
import { connect, useDispatch }  from 'react-redux';
// import imageUrlBuilder from '@sanity/image-url';
import { loadData } from '../actions/actions'
import Page from '../components/page';
import Layout from '../components/Layout';
import Link from 'next/link';
import Header from "../components/Header"
import Footer from "../components/Footer"
import Index from '../components/Index';
import ContextView from '../defs/ContextView';
import TasksHelp from '../components/TasksHelp'
import styles from '../styles/Home.module.css'
import useLocalStorage  from '../hooks/use-local-storage'
import useSessionStorage from "../hooks/use-session-storage";
import SelectContext from '../components/utils/SelectContext';
import { i } from "../components/utils/SvgLetters";
import Project from "../components/Project";
import { ProjectMenuBar } from "../components/loadModelData/ProjectMenuBar";
import Issues from "../components/Issues";
import Tasks from '../components/Tasks';

const debug = false

const page = (props: any) => {
  
  // console.log(props)
  const dispatch = useDispatch()
  const [mappedPosts, setMappedPosts] = useState([props.phBlog?.posts]);
  const [refresh, setRefresh] = useState(false) 
  
  const [memoryLocState, setMemoryLocState] = useSessionStorage('memorystate', []); //props);
  const [memorySessionState, setMemorySessionState] = useSessionStorage('memorystate', []); //props);
  const [mount, setMount] = useState(false)
  
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [focusExpanded, setFocusExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [visibleFocusDetails, setVisibleFocusDetails] = useState(false);
  const [exportTab, setExportTab] = useState(false);




  function dispatchLocalStore(locStore) { 
    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: locStore.phData })
    dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: locStore.phFocus })
    dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: locStore.phSource })
    dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: locStore.phUser })
  }
    const { query } = useRouter(); // example: http://localhost:3000/modelling?repo=Kavca/kavca-akm-models&path=models&file=AKM-IRTV-Startup.json

  useEffect(() => {
    if (debug) useEfflog('71 modelling useEffect 0 [] ');
    const handleReload = () => {
      let locStore = memorySessionState;
      if (debug) console.log('81 modelling page reloaded', memorySessionState);
      if (!memorySessionState) locStore = memoryLocState;
      if (debug) console.log('79modelling 1 ', locStore);
      if (locStore && locStore.phData) {
        const data = locStore;
        if (debug) console.log('87 modelling ', data);
        dispatchLocalStore(data);
        return () => clearTimeout(timer);
      } else {
        if (debug) console.log('92 modelling page not reloaded', memorySessionState[0]);
        if (window.confirm("No recovery model.  \n\n  Click 'OK' to recover or 'Cancel' to open initial project.")) {
          if (props.phFocus.focusProj.file === 'AKM-INIT-Startup_PR.json') {
            if (!isReloading) {
              setIsReloading(true);
              window.location.reload();
            }
            const timer = setTimeout(() => {
              setRefresh(!refresh);
            }, 100);
            return () => clearTimeout(timer);
          }
        }
      }
    };
    const shouldReload = Object.keys(query).length !== 0 && memorySessionState[0] && mount;
    handleReload();
    let org = query.org;
  }, []) 

  const [showExternalPage, setShowExternalPage] = useState(true);

  const externalPageUrl = `https://mimris.github.io/mimris/`;  // Replace with the URL of the external webpage you want to display
  // const externalPageUrl = `https://kavca.github.io/${props.phFocus.focusProj.repo}/`; // Replace with the URL of the external webpage you want to display

  const iframe = showExternalPage ? (
    <iframe src={externalPageUrl} width="100%" height="1500px" />
  ) : null;


  {/* <Link className="video p-2 m-2 text-primary me-5" href="/videos"> Video </Link> */}
  const contextDiv = ( // the top context area (green)
    <div className="context-bar d-flex justify-content-between" style={{ backgroundColor: "#ffffed"}}>
        {/* <SelectContext className='ContextModal' buttonLabel={<i className="fas fa-edit fa-lg text-primary" style={{ backgroundColor: "#dcc" }}></i>} phData={props.phData} phFocus={props.phFocus} /> */}
        <ContextView ph={props} showModal={showModal} setShowModal={setShowModal} />
    </div>
  )

  const indexDiv = (
    <>
      <Index props={props} dispatch={dispatch}/>
    </>
  )
  
  return (
    <div>
      <Layout user={ props.phUser?.focusUser } >
        <div id="index" >
          <div className="wrapper">
            {/* <div className="header">
              <Header title='HeaderTitle' />
              <hr style={{ borderTop: "1px solid #8c8b8", padding: "0px", margin: "0px", marginBottom: "1px" }} />
            </div> */}
            <ProjectMenuBar {...props}
              expanded={expanded} setExpanded={setExpanded}
              focusExpanded={focusExpanded} setFocusExpanded={setFocusExpanded}
              refresh={refresh} setRefresh={setRefresh}
              visibleFocusDetails={visibleFocusDetails}
              setVisibleFocusDetails={setVisibleFocusDetails}
              exportTab={exportTab} setExportTab={setExportTab}
            />
            <div className="context-bar d-flex justify-content-between align-items-center" 
              style={{  backgroundColor: "#ffffed" }}>
              {expanded && 
                <>
                  <div className="issuesarea">
                    {/* <Issues props={props} showModal={showModal} setShowModal={setShowModal} minimized={minimized} setMinimized={setMinimized}/> */}
                  </div>
                  <div className="contextarea">
                    {/* {contextDiv} */}
                  </div>
                  <div className="tasksarea mr-1 bg-trasparent" style={{backgroundColor: "#ffe", borderRadius: "5px 5px 5px 5px" }}>
                    {/* <Tasks taskFocusModel={undefined} asPage={false} visible={false} props={props} /> */}
                  </div>
                </>
              }
            </div>
              <div className="workplace row d-flex justify-content-between ms-2" style={{backgroundColor: "#10859a"}}>
                <div className="tasksarea bg-transparent col-4 m-1">
                  <Project props={props}/>
                </div>
                <div className="col-4 m-2 mx-0 ms-2 p-0 border rounded">
                  <div className="text-center bg-light">
                    GitHub:  README.md
                  {iframe}
                </div>
              </div>
              {/* <div className="tasksarea">
                <TasksHelp />
              </div> */}
              <div className="workarea col-4 ">
                  {(refresh)? <> {indexDiv} </> : <>{indexDiv}</>}
              </div>
            </div>
            <div className="footer">
              <Footer />
            </div>
          </div>
        </div>
      </Layout>
      <style jsx>{` `}</style>
    </div>
  )
}

// export default Page;
export default Page(connect(state => state)(page));
// export default authenticated(Page(connect(state => state)(page)));





  // if (!props.phData) {
  //   dispatch(loadData())
  // }
  // if (!props.phBlog) {
  //   console.log('16 index', props);
  //   dispatch(loadDataBlog())
  // }

  // let posts =  props?.phBlog?.posts || null


  // useEffect(() => {
  //   posts = props.phBlog?.posts
  // }, [props?.phBlog]); 
  
  // useEffect(() => {
  //   if (posts && posts.length) {
  //     console.log('34 index', posts);
  //     const imgBuilder = imageUrlBuilder({
  //       projectId: 'qx699h4j',
  //       dataset: 'production',
  //     });
  //     console.log('44 index', imgBuilder);
      
  //     setMappedPosts(
  //       posts.map(p => {
  //         console.log('48 p', p);
  //         return {
  //           ...p,
  //           mainImage: imgBuilder.image(p.mainImage).width(500).height(250),
  //         }
  //       })
  //       );
  //       console.log('44 index', mappedPosts[0]);
  //   } 
  //   // else {
  //   //   setMappedPosts([]);
  //   // }
  // }, [posts]);

  // const postsDiv =   
                // <div className={styles.main}>
                //   <h1>Welcome To My Blog</h1>

                //   <h3>Recent Posts: </h3>

                //   <div className={styles.feed}>
                //     {mappedPosts.length ? mappedPosts.map((p, index) => (p) && (
                //       <div onClick={() => router.push(`/post/${p.slug.current}`)} key={index} className={styles.post}>
                //         <h3>{p.title}</h3>
                //         <img className={styles.mainImage} src={p.mainImage} />
                //       </div>
                //     )) : <>No Posts Yet</>}
                //   </div>
                // </div>



  // const state = useSelector(state => state)
  // const metis = (state.phData) && state.phData.metis
  // const [visibleTasks, setVisibleTasks] = useState(true)
  // function toggleTasks() {
  //   setVisibleTasks(!visibleTasks);
  // }