// This is a React component that displays details of a selected object in a tabbed interface.
// It allows the user to edit the object's properties and view related objects.
import React, { useRef, useContext, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import { FaPlaneArrival, FaCompass } from 'react-icons/fa';
import 'react-tabs/style/react-tabs.css';

import FocusDetails from './FocusDetails';
import MarkdownEditor from './forms/MarkdownEditor';

const debug = false

const ReportModule = (props) => {

  if (debug) console.log('17 ReportModule', props, props.reportType, props.modelInFocusId)
  
  const ph = props.props.props || props.props 
  if (debug) console.log('20 ReportModule', props, props.reportType, ph, ph?.phData?.metis?.models)

  if (!ph?.phData?.metis?.models) return <>No models</>
  if (!props.modelInFocusId) return <>No objects</> 


  const dispatch = useDispatch()
  const [visibleTabsDiv, setVisibleTabsDiv] = useState(true)
  function toggleTabsDiv() { setVisibleTabsDiv(!visibleTabsDiv); }
  // let props.= useSelector((props.any) => props. // Selecting the whole redux store

  const [activeTab, setActiveTab] = useState(0);

  const tabsDiv = (
    <>

      {visibleTabsDiv ?
        <>
          {/* <button className="btn-sm bg-transparent float-end me-2" style={{ textAlign: "left", outline: "0", borderStyle: "none" }} 
            onClick={props.handleVisibleContext}><span>-&gt; </span> 
          </button> */}
          <>
          <Tabs onSelect={index => setActiveTab(index)} 
            style={{  maxHeight: '78vh', overflow: 'hidden', borderTop: 'none'}}
          >
            <TabList style={{ margin: '0px' }}>
              <Tab>Focus Object</Tab>
              <Tab >MarkDown</Tab>
              <Tab></Tab>
              {/* <Tab><FaPlaneArrival />Main</Tab>
                  <Tab ><FaCompass /></Tab> */}
            </TabList>
            <TabPanel className='p-1 border border-dark' >
              <FocusDetails props={props} reportType={props.reportType} edit={true}/>
            </TabPanel>
            <TabPanel className='p-1 border border-dark' >
              <MarkdownEditor props={props} />
            </TabPanel>
            <TabPanel>
            </TabPanel>
          </Tabs>
          </>
        </>
        : <div className="btn-vertical m-0  pl-2 bg-transparent "
          style={{ textAlign: "center", verticalAlign: "baseline", maxWidth: "4px", paddingLeft: "6px", fontSize: "12px" }}>
          <span style={{ backgroundColor: "#cdd" }}> C o n t e x t & F o c u s </span>
        </div>
      }
      
    </>
  )

  let bgr: String = '#ddd'
  // if (props.reportType === 'task') {
  //   bgr = '#cdd'
  // } 

  const reportDiv = 
    <>
      {visibleTabsDiv 
      ?
          <div className="report-module--tabs p-1 border border-dark rounded bg-transparent"
            style={{  height: '78vh', overflow: 'hidden', borderTop: 'none' }}>
            {tabsDiv}
            {/* {ph.refresh ? <> {tabsDiv} </> : <>{tabsDiv} {ph.refresh}</>} */}
          </div>
        : <div className="border border-dark bg-transparent" style={{ height: '100%', width: 'auto', overflowX: 'hidden' }}>{tabsDiv}</div>
      }
    </>

  return (
      <div className="report-module pe-1 bg-transparent" style={{ maxHeight: "78vh", minWidth: '800px', maxWidth: '800px', width: 'auto', overflowX: 'hidden' }} >
        {reportDiv}
      </div>
  )
}
export default ReportModule  
