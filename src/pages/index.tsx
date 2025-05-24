// @ts-nocheck
import React, { useState,  useEffect } from "react";
import { Router, useRouter } from "next/router";
// import { connect } from 'react-redux';
import { connect, useDispatch }  from 'react-redux';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
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
import GettingStarted from "../components/content/GettingStarted";

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

  const [activeTab, setActiveTab] = useState('tab1');
  const [activeSubTab, setActiveSubTab] = useState('subtab1');



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
  // if (!debug) console.log('95 modelling page', props.phFocus.focusProj);

  const iframe = showExternalPage ? (
    <iframe src={externalPageUrl} width="100%" height="1500px" />
  ) : null;


  {/* <Link className="video p-2 m-2 text-primary me-5" href="/videos"> Video </Link> */}
  const contextDiv = ( // the top context area (green)
    <div className="context-bar" style={{ backgroundColor: "#ffffed"}}>
        {/* <SelectContext className='ContextModal' buttonLabel={<i className="fas fa-edit fa-lg text-primary" style={{ backgroundColor: "#dcc" }}></i>} phData={props.phData} phFocus={props.phFocus} /> */}
        <ContextView ph={props} showModal={showModal} setShowModal={setShowModal} />
    </div>
  )

  const indexDiv = (
    <div className="index-bar bg-light">
      {/* <Index props={props} dispatch={dispatch}/> */}
      <GettingStarted />
    </div>
  )
  
  return (
    <div>
      <Layout user={ props.phUser?.focusUser } >
        <div id="index" >
          <div className="wrapper d-flex flex-column min-vh-100">
              {/* <div className="header">
                <Header title='HeaderTitle' />
                <hr style={{ borderTop: "1px solid #8c8b8", padding: "0px", margin: "0px", marginBottom: "1px" }} />
              </div> */}
              <div className="menu-bar mb-1"> 
              <ProjectMenuBar {...props}
                expanded={expanded} setExpanded={setExpanded}
                focusExpanded={focusExpanded} setFocusExpanded={setFocusExpanded}
                refresh={refresh} setRefresh={setRefresh}
                visibleFocusDetails={visibleFocusDetails}
                setVisibleFocusDetails={setVisibleFocusDetails}
                exportTab={exportTab} setExportTab={setExportTab}
              />
              </div>
              {/* <div className="context-bar d-flex justify-content-between align-items-center" 
                style={{  backgroundColor: "#ffffed" }}>
                {expanded && 
                  <>
                    <div className="issuesarea">
                      <Issues props={props} showModal={showModal} setShowModal={setShowModal} minimized={minimized} setMinimized={setMinimized}/>
                    </div>
                    <div className="contextarea">
                      {contextDiv}
                    </div>
                    <div className="tasksarea mr-1 bg-trasparent" style={{backgroundColor: "#ffe", borderRadius: "5px 5px 5px 5px" }}>
                      <Tasks taskFocusModel={undefined} asPage={false} visible={false} props={props} />
                    </div>
                  </>
                }
              </div> */}
            {/* Links to GitHub pages */}
            <div className="workplace d-flex justify-content-between">
              <div className="workarea col-4">
                {(refresh) ? <> {indexDiv} </> : <>{indexDiv}</>}
              </div>
              <div className="bg-white col-4">
                <div className="nav-tabs-container bg-light">
                  <div className="nav nav-tabs">
                    <button
                      className={`nav-link ${activeTab === 'tab1' ? 'active' : ''}`}
                      onClick={() => setActiveTab('tab1')}
                      type="button"
                    >
                      Mimris Summary
                    </button>
                    <button
                      className={`nav-link ${activeTab === 'tab2' ? 'active' : ''}`}
                      onClick={() => setActiveTab('tab2')}
                      type="button"
                    >
                      GitHub documentation
                    </button>
                  </div>
                </div>
                <div className="tab-content bg-white">
                  {activeTab === 'tab1' && (
                    <div className="mt-2 p-3 text-start overflow-auto" style={{ maxHeight: '1500px' }}>
                      <img
                        src="./images/mimris-modeling-app_white.jpeg"
                        alt="Mimris Modeller"
                        width="500"
                      />
                      <div className="markdownContent">
                        <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                          {`### Modelling, and Metamodelling with Mimris
***Executive Summary***

This is an overview of modelling with metamodelling languages within Mimris, focusing specifically on the principles of cyclic metamodelling and modelling. It explains the distinction between models and metamodels, 
the importance of supporting cycles and recursion with models and metamodels, and describes how the ***CORE_META*** language in Mimris enables the creation of custom, domain-specific modelling languages. 
The practical use of graphical modelling and the support for cyclic and self-referential structures are highlighted, with a concrete example using the BPMN metamodel. 
This foundation empowers users to build expressive, adaptive, and effective modelling environments tailored to complex systems.

---

***Introduction to Modelling Languages***

A modelling language is an artificial, formal language designed to express data, information, or knowledge in a structured and consistent manner. Each modelling language adheres to a clearly defined set of rules that govern its syntax and semantics.

In **Mimris**, the modelling language is graphical in nature, providing a visual means of representing complex information and relationships.

---

***Metamodelling: Defining Modelling Languages***

A **metamodel** is a model that defines the structure, semantics, and constraints of a modelling language. 
In essence, a metamodel specifies the permissible constructs (such as objects, relationships, and properties) and the rules for their assembly. 
In practice, the term *metamodel* is often used interchangeably with *modelling language*, although, strictly speaking, the metamodel describes the language, while the modelling language is used to describe domain-specific models. 

***Metamodelling Process***

- **Specification:** Using the CORE_META metamodel, users can define new object types and relationships, specifying their properties and methods.
- **Generation:** From this model, users can generate a metamodel that serves as a new modelling language.
- **Instantiation:** Using this Metamodel, users can model individual models as instantiations of their respective metamodels.
- **Reflection:** Need for changes discovered when modelling, can be addressed by modifying the Specification model. This is a key aspect of metamodelling, as it allows for the evolution of the modelling language itself. 
Then the user regenerate the metamodel that is modified to adapt to new requirements, and these changes can be propagated to all models instantiated from it.


---

***Cyclic Modelling: Recursion and Self-Reference in Models***

**Cyclic modelling** refers to the capability of a modelling language or metamodel to describe structures where elements can reference themselves directly or indirectly, forming cycles. This is particularly relevant for accurately representing real-world systems that contain recursive or repeating relationships (e.g., organizational hierarchies, network topologies, recursive processes).

***Key Aspects of Cyclic Modelling***

- **Recursive Definitions:** Cyclic modelling enables objects or relationships to reference instances of their own type or related types, allowing for the representation of loops and feedback structures.
- **Self-Referencing Models:** Metamodels that support cyclic modelling can define constructs such as “parent-child” hierarchies or linked workflows, where cycles naturally occur.
- **Metamodelling Cycles:** In advanced usage, metamodels themselves can be defined using their own constructs—a process sometimes referred to as *reflective metamodelling* or *meta-circularity*. This allows the modelling environment to evolve, extend, or redefine its own structure.

Mimris fully supports cyclic modelling at both the model and metamodel levels, allowing for rich and expressive representations of complex, interconnected systems.

---

***Textual vs. Graphical Modelling Languages***

In textual modelling languages, constructs are typically described in terms of **nouns** (entities) and **verbs** (actions or relationships). In a graphical modelling language such as Mimris, the corresponding terms are **objects** and **relationships**. This shift from textual to graphical representation enables a more intuitive and visual approach to modelling complex systems, particularly when visualizing cyclic or recursive structures.

---

***CORE_META: The Foundation for Metamodelling***

The modelling language used within Mimris to define new, custom modelling languages is called \`CORE_META\`. \`CORE_META\` provides a comprehensive set of modelling primitives that enable users to define custom object types (analogous to nouns) and relationship types (analogous to verbs), along with associated properties and methods.

***Capabilities of CORE_META***

- **Object and Relationship Definition:** Users can create new modelling constructs tailored to specific domains.
- **Property and Method Specification:** Customization of behaviour and attributes for each type.
- **Support for Cyclic Structures:** Both the language and its metamodel can express cyclic dependencies, recursive relationships, and feedback loops.

---

***Creating and Evolving Custom Modelling Languages***

Once these custom types are specified (modelled), users can invoke the “Generate Metamodel” function to automatically produce their own metamodel. These metamodels—effectively new, domain-specific modelling languages—can then serve as the foundation for creating custom models tailored to particular needs or contexts.

Through iterative refinement and cyclic application of the modelling and metamodelling process, users can evolve their modelling languages, ensuring adaptability and continuous improvement. This cyclical process is fundamental for advanced modelling environments where requirements and concepts change over time.

By leveraging \`CORE_META\`, users can develop highly specialized modelling languages that address the unique requirements of their projects, ensuring a more precise, expressive, and effective modelling process.

---

***BPMN example model***

The Mimris version of the BPMN Metamodel as shown below is rather advanced.
It utilizes inheritance from an abstract object type (Gateway), relationships to and from the abstract type, in addition to relationships between non-abstract object types (Start, Task, End).

![BPMN-Meta](https://github.com/user-attachments/assets/d1cda36a-71e6-475e-8223-1b0a8a09b777)

In addition it utilizes the "template2" field in the object and relationship views. This to achieve a completely different visualization of objects and relationships in the models built using the generated template than in the metamodel itself.

Below is shown an example model built using a template generated from the metamodel above.

![BPMN-example](https://github.com/user-attachments/assets/322c2cec-c1bc-4ea4-813b-04675bbe86fe)`}
                      </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tab2' && (
                    <div className="p-1 text-start overflow-auto bg-light" >
                      <div className="sub-nav-tabs mt-1">
                        <ul className="nav nav-pills nav-fill small">
                          <li className="nav-item">
                            <button
                              className={`nav-link ${activeSubTab === 'subtab1' ? 'active bg-white text-info' : 'text-info'}`}
                              style={{ borderRadius: '0.25rem 0.25rem 0 0' }}
                              onClick={() => setActiveSubTab('subtab1')}
                            >
                              Mimris Developer Documentation
                            </button>
                          </li>
                          <li className="nav-item">
                            <button
                              className={`nav-link ${activeSubTab === 'subtab2' ? 'active bg-white text-info' : 'text-info'}`}
                              style={{ borderRadius: '0.25rem 0.25rem 0 0' }}
                              onClick={() => setActiveSubTab('subtab2')}
                            >

                              Model Documentation
                            </button>
                          </li>
                        </ul>
                      </div>
                      <div className="tab-content">
                        {activeSubTab === 'subtab1' && (
                          <div className="tab-pane show active">
                            <iframe
                              src="https://mimris.github.io/mimris/"
                              width="100%"
                              height="1500px"
                            />
                          </div>
                        )}
                        {activeSubTab === 'subtab2' && (
                          <div className="tab-pane show active">
                            <iframe
                              src={props.phFocus?.focusProj?.repo && `https://kavca.github.io/${props.phFocus.focusProj.repo}/`}
                              width="100%"
                              height="1500px"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* <div className="tasksarea">
                <TasksHelp />
              </div> */}

              <div className="tasksarea bg-transparent col-4">
                <Project props={props} />
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