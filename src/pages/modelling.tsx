//@ts-nocheck
import React, { useState, useEffect } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
import { loadData } from '../actions/actions'
import Page from '../components/page';
import Layout from '../components/Layout';
import Header from "../components/Header"
import Footer from "../components/Footer"
import Modelling from "../components/Modelling";
import SetContext from '../defs/SetContext'
import TasksHelp from '../components/TasksHelp'
// import DispatchLocal from '../components/utils/SetStoreFromLocalStorage'
import useLocalStorage from '../hooks/use-local-storage'
import DispatchFromLocalStore from '../components/utils/DispatchFromLocalStore'
// import { loadState, saveState } from '../components/utils/LocalStorage'

const page = (props:any) => {

  const [refresh, setRefresh] = useState(true);
  // console.log('16 diagram',props)
  const dispatch = useDispatch()
  const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', null);
  // DispatchFromLocalStore(memoryLocState)
  // console.log('23 modelling', memoryLocState);
  
  if (props && props?.phSource === 'initialState' ) { // if initialState load memoryState if exists
    if (typeof window !== "undefined") {
      const loadMemory = confirm("Open saved memory model?");
      if (loadMemory) {
        // if ((typeof window !== "undefined") && props && props?.phSource === 'initialState' ) {
        // if (memoryLocState && props?.phSource === 'initialState' && confirm('Do you want to load model the saved memory?')) 
        if (memoryLocState ) {
          // Save it!
          const memoryState = {
            ...memoryLocState,
            phSource: 'savedMemory'
          }
          // console.log('35 modelling', memoryState);
          DispatchFromLocalStore(memoryState)
        }
      }
    }
  }

  // if (!props.phData) {
  //   dispatch(loadData())
  // }
  
  // console.log('23 modelling', props.phData);
  
  const state = useSelector(state => state)
  
  const [visible,setVisible] = useState(false)
  function toggle() { setVisible(!visible); }
  const [visibleTasks, setVisibleTasks] = useState(true)
  function toggleTasks() {
    setVisibleTasks(!visibleTasks);
  }
  
  // /**
  // * Set up the Context items and link to select Context modal,
  // */
  const setContextDiv =  <SetContext ph={props} />
  // const setContextDiv = (props.phFocus) && <SetContext phF={props.phFocus} />
  useEffect(() => {
    return () => {
      <SetContext ph={props} />
    };
  }, [props.phFocus.focusModel.id])
  // console.log('42 modelling', state.phUser);
  
  const modellingDiv = <Modelling />

  return (
    <div>
  

    </div>
  )
}
export default Page(connect(state => state)(page));