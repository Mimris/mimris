// @ts-nocheck
import React, { useState } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
import Page from '../components/page';
import Layout from '../components/Layout';
// import Index from '../components/Index';
import { loadData } from '../actions/actions'
import SetContext from '../defs/SetContext'
import GenGqlSchemas from '../components/gql/GenGqlSchemas'
import Help from '../components/Help'

const page = (props: any) => {}
export default Page(connect(state => state)(page));

//   // console.log(props)
//   const dispatch = useDispatch()

//   // console.log('17', props.phData);
//   const [ loaded, setLoaded] = useState(false);
//   // if (!props.phData) {
//   //   if (!loaded) {
//   //     dispatch(loadData())
//   //     setLoaded(true)
//   //   }
//   // }
//   const setContextDiv = (props.phFocus) && <SetContext phF={props.phFocus} />

//   const state = useSelector(state => state)
//   // const metis = (state.phData) && state.phData.metis
//   // // console.log('22', (metis) && metis);
//   // const modelName = (metis) && metis.models[0].name
//   // // const indexRender = (metis) && <Index phData={model} phFocus={props.phFocus} />
//   // console.log('34', state);

//   // // const [isToggled, setToggled] = useState(false);
//   // const [showSubject, setShowSubject] = useState(false);
//   // const [showPlenary, setShowPlenary] = useState(false);


//   const [visibleTasks, setVisibleTasks] = useState(false)
//   function toggleTasks() {
//     setVisibleTasks(!visibleTasks);
//   }
//   const tasks =
//     <div>
//       <button className="btn-default bg-light btn-sm btn-block" onClick={toggleTasks}>{visibleTasks
//         ? <><span style={{ paddingLeft: "5px" }}> Tasks - Help</span> <span style={{ float: "left" }} > &lt;  </span>
//         </> : <div className="btn-vertical m-0 p-0" style={{ maxWidth: "6px", paddingLeft: "0px" }}><span> &gt; </span><span> T a s k s - H e l p</span> </div>}
//       </button>
//       <div className="toggleTasks">
//         {visibleTasks
//           ? <Help />
//           : <span></span>}
//       </div>
//     </div>

//   let result = ''
//   async function handleGenGqlSchema() {
//    result = await GenGqlSchemas(state)
//   }
//   const schemalink = <a href="/gql/schemas/typeDefs.ts" download>typeDefs.ts</a>
//   const resolverlink = <a href="/gql/schemas/resolvers.ts" download>resolvers.ts</a>
//   const buttonDiv = (state) && <button className="btn btn-info" onClick={handleGenGqlSchema} > Generate GraphQl Schema and Resolver</button>

//   return (
//     <div>
//       <Layout  user={state.phUser?.focusUser} >
//         <div id="index" >
//           <div className="wrapper" >
//             <div className="workplace" >
//               <div className="contextarea" >
//                 {setContextDiv}
//               </div>
//               <div className="tasksarea"  >
//                 {tasks}
//               </div>
//                 <div className="workarea bg-light p-4">
//                   <a>Click on the button to genereate graphql schema: (typedefs and resolvers) from current Metamodel</a>
//                   <br />
//                   <div className="genschema" style={{ paddingTop: "4px" }}>
//                     {buttonDiv}
//                     <hr />
//                     <a>Click on link to download the generated files. (Can be renamed to .js files)</a>
//                     <ul> 
//                       <li>
//                         {schemalink}
//                       </li>
//                       <li>
//                         {resolverlink}
//                       </li>
//                     </ul>
//                   </div>
//                 </div>
//             </div>
//           </div>
//         </div>
//       </Layout>
//       <style jsx>{`
//      .wrapper {
//         display: grid;
//         grid-template-columns:  auto;
//         grid-gap: 0px;
//         grid-template-areas:
//         "workplace";
//       }
//       .workplace {
//         grid-area: workplace;
//         display: grid ;
//         background-color: #;
//         grid-template-columns: auto 2fr;
//         grid-template-areas:
//         "contextarea contextarea"
//         "tasksarea workarea";
//       }
//       // @media only screen and (max-width: 475px) {
//       // .workplace {
//       //     grid-area: workplace;
//       //     display: grid ;
//       //     background-color: #aaa;
//       //     grid-template-columns: auto 2fr;
//       //     grid-template-areas:
//       //     "taskarea"
//       //     "workarea";
//       //   }
//       // }

//       .workarea {
//         grid-area: workarea;
//         display: grid ;
//         border-radius: 5px 5px 0px 0px;
//         // max-width: 400px;
//         // min-height: 60vh;
//         // grid-template-columns: auto;
//         grid-template-areas:
//           "workpad workpad";
//       }
//       .contextarea {
//         grid-area: contextarea;
//         display: grid;
//         border-radius: 4px;
//         outline-offset:-6px;
//         padding: 0px;
//         font-size: 70%;
//         background-color: #e8e8e8;
//         color: #000;
//         max-height: 60px; 
//       }
//       .tasksarea {
//         grid-area: tasksarea;
//         padding: 2px;
//         border: 2px;
//         max-width: 200px;
//         width: 100%;
//         border-radius: 5px 5px 5px 5px;
//         border-color: #000;
//         background-color: #fff;
//         font-size: 100%;
//       }


//             `}</style>
//     </div>
//   )
// }

// export default Page(connect(state => state)(page));