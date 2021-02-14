// @ts-nocheck
import React, { useState,  useEffect } from "react";
// import { connect } from 'react-redux';
import { connect, useDispatch }  from 'react-redux';
// import imageUrlBuilder from '@sanity/image-url';
import { loadData } from '../actions/actions'
import Page from '../components/page';
import Layout from '../components/Layout';
import Header from "../components/Header"
import Footer from "../components/Footer"
import Index from '../components/Index';
import SetContext from '../defs/SetContext'
import TasksHelp from '../components/TasksHelp'
import styles from '../styles/Home.module.css'

const page = (props: any) => {
  
  // console.log(props)
  const dispatch = useDispatch()
  const [mappedPosts, setMappedPosts] = useState([props.phBlog?.posts]);
  
  if (!props.phData) {
    dispatch(loadData())
  }
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
 // /**
// * Set up the Context items and link to select Context modal,
// */
  const setContextDiv = (props.phFocus) && <SetContext phF={props.phFocus} />
  
  return (
    <div>
      <Layout user={ props.phUser?.focusUser } >
        <div id="index" >
          <div className="wrapper">
            <div className="header">
              {/* <Header title='HeaderTitle' /> */}
              <hr style={{ borderTop: "1px solid #8c8b8", padding: "0px", margin: "0px", marginBottom: "1px" }} />
            </div>
            <div className="workplace">
              <div className="contextarea">
                {setContextDiv}
              </div>
              <div className="tasksarea">
                <TasksHelp />
              </div>
              <div className="workarea">
                
                  {/* {postsDiv} */}
                  <Index />
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
        // height: 100%;
        // grid-template-columns: auto auto;
        grid-gap: 0px;
        grid-template-areas:
        "header"
        "workplace"
        "footer";
      }
      .workplace {
        grid-area: workplace;
        display: grid ;
        height: 100%;
        // background-color: #;
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

      .workarea {
        grid-area: workarea;
        display: grid ;
        border-radius: 5px 5px 0px 0px;
        // max-width: 400px;
        // min-height: 60vh;
        // grid-template-columns: auto;
        grid-template-areas:
          "workpad workpad";
      }
      .contextarea {
        grid-area: contextarea;
        display: grid;
        border-radius: 4px;
        outline-offset:-6px;
        padding: 0px;
        font-size: 70%;
        background-color: #e8e8e8;
        color: #000;
        max-height: 60px; 
      }
        .tasksarea {
        grid-area: tasksarea;
        padding: 0px;
        margin-right: 4px;
        padding-right: 3px;
        border: 2px;
        border-radius: 5px 5px 5px 5px;
        border-width: 2px;
        // border-color: #000;
        // background-color: #e00;
        max-width: 220px;
        // font-size: 100%;
      }
      p {
        color: white;
      }

            `}</style>
    </div>
  )
}

// export default Page;
export default Page(connect(state => state)(page));
// export default authenticated(Page(connect(state => state)(page)));
