// @ts-nocheck
import React, { useState,  useEffect } from "react";
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

const debug = false

const page = (props: any) => {
  
  // console.log(props)
  const dispatch = useDispatch()
  const [mappedPosts, setMappedPosts] = useState([props.phBlog?.posts]);
  const [refresh, setRefresh] = useState(false) 
  
  const [memoryLocState, setMemoryLocState] = useSessionStorage('memorystate', []); //props);
  const [mount, setMount] = useState(false)

  function dispatchLocalStore(locStore) { 
    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: locStore.phData })
    dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: locStore.phFocus })
    dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: locStore.phSource })
    dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: locStore.phUser })
  }
 // /**
  // * Set up the Context items and link to select Context modal,
  // */

  useEffect(() => { 
    if (debug) console.log('73 modelling useEffect 1', memoryLocState, props.phFocus.focusModelview.name)
    // let data = {}
    if (props.phFocus.focusProj.file === 'AKM-INIT-Startup.json') {
      // if ((memoryLocState != null) && (memoryLocState.length > 0) && (memoryLocState[0].phData)) {
      if ((window.confirm("Do you want to recover your last project? (last refresh) \n\n  Click 'OK' to recover or 'Cancel' to open intial project."))) {
        // if (Array.isArray(memoryLocState) && memoryLocState[0]) {
        if (memoryLocState) {
            const locStore = (memoryLocState) 
            if (locStore) {
              dispatchLocalStore(locStore)
              // data = {id: locStore.phFocus.focusModelview.id, name: locStore.phFocus.focusModelview.name}
              // console.log('modelling 73 ', data)
            }
          } 
        // }   
      }
    }
    setMount(true)
  }, [])  

  const [showExternalPage, setShowExternalPage] = useState(true);

  const externalPageUrl = `https://kavca.github.io/${props.phFocus.focusProj.repo}/`; // Replace with the URL of the external webpage you want to display

  const iframe = showExternalPage ? (
    <iframe src={externalPageUrl} width="100%" height="1500px" />
  ) : null;


  {/* <Link className="video p-2 m-2 text-primary me-5" href="/videos"> Video </Link> */}
  const contextDiv = ( // the top context area (green)
    <div className="context-bar d-flex justify-content-between" style={{ backgroundColor: "#cdd"}}>
      <div className="context-bar--context bg-transparent d-flex justify-content-between align-items-center me-auto border border-light" style={{ backgroundColor: "#dcc" }}>
        {/* <SelectContext className='ContextModal' buttonLabel={<i className="fas fa-edit fa-lg text-primary" style={{ backgroundColor: "#dcc" }}></i>} phData={props.phData} phFocus={props.phFocus} /> */}
        <ContextView className='setContext' ph={props} style={{ backgroundColor: "#cdd"}} />
      </div>
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
              {contextDiv}
            <div className="workplace row d-flex">
              <div className="col-3">
                <Project props={props} />
              </div>
              <div className="col-4">from README.md file on GitHub:
               {iframe}
              </div>
              {/* <div className="tasksarea">
                <TasksHelp />
              </div> */}
              <div className="workarea col-5">
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