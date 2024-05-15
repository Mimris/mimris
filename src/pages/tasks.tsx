//@ts- nocheck
import { use, useEffect } from "react";
import { connect, useDispatch } from 'react-redux';
import { useRouter } from "next/router";
import useLocalStorage from '../hooks/use-local-storage'
import useSessionStorage from "../hooks/use-session-storage";

import Page from '../components/page';

import Layout from '../components/Layout';
import Header from "../components/Header"
import Footer from "../components/Footer"
import Tasks from '../components/Tasks';

const debug = false;

const Page1 = (props: any) => {

    const { query } = useRouter();
    const dispatch = useDispatch();
 
    const [memoryLocState, setMemoryLocState] = useLocalStorage('locState', {}); //props);

    function dispatchLocalStore(locStore: { phData: any; phFocus: any; phSource: any; phUser: any; }) {
        dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: locStore.phData })
        dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: locStore.phFocus })
        dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: locStore.phSource })
        dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: locStore.phUser })
      }

    useEffect(() => {
        if (debug) console.log('16 page tasks props', props);
        if ((setMemoryLocState && memoryLocState.phData)) {
            // if (Array.isArray(memoryLocState) && memoryLocState[0]) { // check if memoryLocState is an array and has at least one element
              const locStore = memoryLocState
              if (locStore) {
                dispatchLocalStore(locStore) // dispatch to store the lates [0] from local storage
              }
            // }
          }
    });
    

    const taskDiv =   <Tasks taskFocusModel={undefined} asPage={false} visible={false} props={props} />

    if (debug) console.log('32 page tasks props', query, props);

    return (
        <>
            {/* <Layout user={props.phUser?.focusUser} > */}
                <div id="index" >
                    {/* <div className="wrapper bg-secondary" */}
                    {/* // style={{ minHeight: '100vh', paddingBottom: '100px' }} */}
                    {/* > */}
                        <div className="wrapper"
                            style={{  backgroundColor: 'lightyellow', minHeight: '80vh', paddingBottom: '100px' }}
                        >
                            {/* <div className="header ">
                                <Header title='Modelling Tasks' />
                            </div> */}
                                <div className="tasksarea mr-1" style={{ backgroundColor: "#ffe", borderRadius: "5px 5px 5px 5px", maxHeight: "92vh" }}>                                {/* <Tasks props={props}/> */}
                                     <Tasks taskFocusModel={undefined} asPage={false} visible={false} props={props} />
                                </div>
                            {/* <div className="footer">
                                <Footer />
                            </div>     */}
                        </div>
                    {/* </div> */}
                </div>
            {/* </Layout> */}
        </>
    );
}

export default Page(connect((state: any) => state)(Page1));

