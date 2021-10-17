// @ts-nocheck
import { connect, useDispatch } from 'react-redux';
import { loadData } from '../actions/actions'
import Page from '../components/page';
import Layout from '../components/Layout';
import Header from "../components/Header"
import Footer from "../components/Footer"
import SetContext from '../defs/SetContext';
import HelpBlog from '../components/HelpBlog';


const page = (props: any) => {

  // console.log(props)
  const dispatch = useDispatch()

  // if (!props.phData) {
  //   dispatch(loadData())
  // }

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
      <Layout user={props.phUser?.focusUser} >
        <div id="index" >
          <div className="wrapper">
            {/* <div className="header">
              <Header title='eaderTitle' />
            </div> */}
            <div className="workplace">
              {/* <div className="contextarea">
                {setContextDiv}
              </div>
              <div className="tasksarea">
                <TasksHelp />
              </div> */}
              <div className="workarea">
                <HelpBlog />
              </div>
            </div>
            {/* <div className="footer">
              <Footer />
            </div> */}

          </div>
        </div>
      </Layout>
      <style jsx>{`
      .wrapper {
        display: grid;
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












// export default function Helppage(props) {
// export default function Helppage({ posts }) {

// const page = (props: any) => {
//   console.log('9', props);
//   const { posts } = props;
  
//   return (
//     <div>
//       <Head>
//         <title>Dev Blog</title>
//       </Head>

//       <div className='posts'>aaaaa
//         {posts?.map((post, index) => (
//           <Post key={index} post={post} />
//         ))}
//         bbb
//       </div>
//     </div>
//   )
// }

// export async function getStaticProps() {
//   // Get files from the posts dir
//   const files = fs.readdirSync(path.join('src/posts'))
//   // Get slug and frontmatter from posts
//   const posts = files.map((filename) => {
//     // Create slug
//     const slug = filename.replace('.md', '')
//     console.log('32', files,  slug);  
//     // Get frontmatter
//     const markdownWithMeta = fs.readFileSync(
//       path.join('src/posts', filename),
//       'utf-8'
//     )
//     console.log('38', matter(markdownWithMeta));
//     const { data: frontmatter } = matter(markdownWithMeta)
//     console.log('41', frontmatter, slug);
//     return {
//       slug,
//       frontmatter,
//     }
//   })
//   console.log('49', posts.sort(sortByDate));
  
//   return {
//     props: {
//       posts: posts.sort(sortByDate),
//     },
//   }
// }


// export default Page(connect(state => state)(page));







// import SelectContext from './SelectContext'
// import LoadServer from './LoadServer'
// import Link from 'next/link';

// const Help = () => {
//   return (
//     <div style={{ paddingTop: "4px", backgroundColor: "white" }}>
//       <div style={{ fontSize: "80%", backgroundColor: "#bbb", border: "2px", margin: "1px", padding: "3px" }}> Start Modelling
//         <div className="task-link bg-light" >
//           <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#source"><span >? </span></a>
//           <a className="btn btn-link btn-sm" ><LoadServer className='button ContextModal' buttonLabel='Save/Load Model' /></a>
//           <div className="collapse bg-light p-1 b-1" id="source" style={{ backgroundColor: "#fefefe", }}>
//             <a> Click on "Local or Server" button above to save/load current models from local storage or server repository. </a>
//             <a style={{ maxWidth: "50px", float: "right" }} data-toggle="collapse" href="#insert-more"><span >(more...)</span></a>
//             <div className="collapse bg-transparent p-1" id="insert-more" style={{ backgroundColor: "#fefefe" }}>
//               Temporary copy/backup: RightClick here and select Inspect (Ctrl-Alt-I) Select the Application Tab, and then "Storage", then state.
//               RightClick the state "value" and select "Edit value". Press Ctrl-C to copy the store and paste it in a Notepad document.
//               If you want to reuse the copied store just copy from Notepad and "Edit value" again, and press Ctrl-V to paste the store back to localStorage state.
//             </div>
//           </div>
//         </div>

//         <div className="task-item bg-light" >
//             <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#context"><span >? </span></a>
//             <a className="btn btn-link btn-sm" ><SelectContext className='button ContextModal' buttonLabel='Set Context' /></a>
//             <div className="collapse bg-light p-1 b-1" id="context" style={{ backgroundColor: "#fefefe", }}>  
//               <a> Click on "Set context" above or link in the upper right corner. </a>
//               <a> In Popup "Set Context Form": Select Model and Modelview.</a>
//             </div>
        
//         </div>
//         <div className="task-item bg-light" >
//           <div className="btn btn-link btn-sm" >
//             {/* <Link href="/diagram"><a className="nav-link">Modelling</a></Link> */}
//             <Link href="/modelling"><a className="task-link">OPEN MODEL</a></Link>
//           </div>
//           <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#model"><span >? </span> </a>
//           <div className="collapse bg-light p-1 b-1" id="model" style={{ backgroundColor: "#fefefe", }}>
//             <a>To view the model selected in "Set Context", go to the modelling page by select "Modelling" in the top-menu</a>
//             <a> Click on refresh both in Modelling pane and Palette pane if neccessary.</a>
//           </div>
//         </div>

//         <div className="task-item bg-light" >
//           <a className="btn btn-link btn-sm" >Window size </a> <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#refresh"><span >? </span></a>
//           <div className="collapse bg-light p-1 b-1" id="refresh" style={{ backgroundColor: "#fefefe", }}>
//             <a> The Palette and the Model area will adjust to the browser window size.</a>
//           </div>
//         </div>
//         <div className="task-item bg-light" >
//           <a className="btn btn-link btn-sm" >Zoom in / out </a> <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#zoom"><span >? </span></a>
//           <div className="collapse bg-light p-1 b-1" id="zoom" style={{ backgroundColor: "#fefefe", }}>
//             <a>In the Model area or Palette area: Left-Click and scroll on the mouse-wheel.</a>
//           </div>
//         </div>
//         <div className="task-item bg-light" >
//           <a className="btn btn-link btn-sm" >Scroll </a> <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#scroll"><span >? </span></a>
//           <div className="collapse bg-light p-1 b-1" id="scroll" style={{ backgroundColor: "#fefefe", }}>
//             <a>In the Model area or Palette area: Left-Click and scroll on the mouse-wheel.</a>
//             <br /> <br /><a>Left-Click again to toggle between zoom and scrool up and down.</a>
//             <br /> <br /><a>Press and hold Shift key to scroll right and left.</a>
//           </div>
//         </div>
//       </div>

//       <div style={{ fontSize: "80%", backgroundColor: "#bbb", border: "2px", margin: "1px", padding: "3px" }}> Modelling Menu
//           <div className="task-item bg-light" >
//           <a className="btn btn-link btn-sm" >Insert new object </a> <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#insert"><span >? </span></a>
//           <div className="collapse bg-light p-1 b-1" id="insert" style={{ backgroundColor: "#fefefe", }}>
//             <a>Click on an object in the palette ( left pane ) and drag and drop in the modelling area (right pane)</a>
//             <a style={{ maxWidth: "50px", float: "right" }} data-toggle="collapse" href="#insert-more"><span >(more...)</span></a>
//             <div className="collapse bg-transparent p-1" id="insert-more" style={{ backgroundColor: "#fefefe" }}>
//               Double-click on the text to edit.
//               </div>
//           </div>
//         </div>
//         <div className="task-item bg-light" >
//           <a className="btn btn-link btn-sm" >Connect two objects</a> <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#connect"><span >?</span></a>
//           <div className="collapse bg-light p-1 b-1" id="connect" style={{ backgroundColor: "#fefefe", }}>
//             <a>Click on an object edge and drag and drop in the another object.</a>
//           </div>
//         </div>
//         <div className="task-item bg-light" >
//           <a className="btn btn-link btn-sm" >Delete Object</a> <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#delete"><span >? </span></a>
//           <div className="collapse bg-light p-1 b-1" id="delete" style={{ backgroundColor: "#fefefe", }}>
//             <a>Rigth-Click on an object and select "Delete".</a>
//           </div>
//         </div>
//         <div className="task-item bg-light" >
//           <a className="btn btn-link btn-sm" >Copy Object</a> <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#copy"><span >? </span></a>
//           <div className="collapse bg-light p-1 b-1" id="copy" style={{ backgroundColor: "#fefefe", }}>
//             <a>Rigth-Click on an object and select "Copy", then Right-Click on the background or within a View object and select "Paste"</a>
//           </div>
//         </div>
//       </div>
//       <style jsx>{`
//         .btn {
//           font-size: 80%;
//           font-weight: bold;
//         }
//        `}</style>
//     </div>
//   );
// }

// export default Help;




// //@ts-nocheck
// // import React, { useState } from "react";
// // import { connect } from 'react-redux';
// import { connect, useDispatch } from 'react-redux';
// import { loadData } from '../actions/actions'
// import Page from '../components/page';
// import Layout from '../components/Layout';
// import Header from "../components/Header"
// import Footer from "../components/Footer"
// import HelpPage from '../components/HelpPage';
// import SetContext from '../defs/SetContext'
// import TasksHelp from '../components/TasksHelp'

// const page = (props: any) => {

//   // console.log(props)
//   const dispatch = useDispatch()

 
//   // * Set up the Context items and link to select Context modal,
//   // */
//   const setContextDiv = (props.phFocus) && <SetContext phF={props.phFocus} />

//   return (
//     <div>
//       <Layout user={props.phUser?.focusUser} >
//         <div id="index" >
//           <div className="wrapper">
//             {/* <div className="header">
//               <Header title='eaderTitle' />
//             </div> */}
//             <div className="workplace">
//               {/* <div className="contextarea">
//                 {setContextDiv}
//               </div>
//               <div className="tasksarea">
//                 <TasksHelp />
//               </div> */}
//               <div className="workarea">
//                 <HelpPage />
//               </div>
//             </div>
//             {/* <div className="footer">
//               <Footer />
//             </div> */}

//           </div>
//         </div>
//       </Layout>
//       <style jsx>{`
//             `}</style>
//     </div>
//   )
// }

// // export default Page;
// export default Page(connect(state => state)(page));
// // export default authenticated(Page(connect(state => state)(page)));

