// This is a React component that displays details of a selected object in a tabbed interface.
// It allows the user to edit the object's properties and view related objects.
import React, { useRef,useContext, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import { FaPlaneArrival, FaCompass } from 'react-icons/fa';
import 'react-tabs/style/react-tabs.css';

import Context from './Context'
import MarkdownEditor  from './forms/MarkdownEditor';

const debug = false

const ReportModule = (props) => {
    
    const dispatch = useDispatch()
    const [visibleTabsDiv, setVisibleTabsDiv] = useState(true)
    function toggleTabsDiv() { setVisibleTabsDiv(!visibleTabsDiv); }
    // let props.= useSelector((props.any) => props. // Selecting the whole redux store
    const ph = props.props
    if (debug) console.log('20 ReportModule', props)

    if (!ph?.phData?.metis?.models) return <></>

    const [activeTab, setActiveTab] = useState(0);

    const tabsDiv = (
      <>
      <button className="btn-sm pt-1 px-1 b-0 mt-0 mb-2 mr-2 w-100 " style={{ textAlign: "left",  backgroundColor: "#cdd", outline: "0", borderStyle: "none" }}
        onClick={toggleTabsDiv}> {visibleTabsDiv ? <span>-&gt; Context & Focus </span> : <span>&lt;-</span>}
      </button>
      {visibleTabsDiv ?
        <Tabs onSelect={index => setActiveTab(index)} >
          <TabList style={{  margin: '0px' }}>
            <Tab>Current Object</Tab>
            <Tab >MarkDown</Tab>
            <Tab></Tab>
            {/* <Tab><FaPlaneArrival />Main</Tab>
                <Tab ><FaCompass /></Tab> */}
          </TabList>
          <TabPanel className='p-1 border border-dark' >
              <Context props={ph} />
          </TabPanel>
          <TabPanel className='p-1 border border-dark' >
              <MarkdownEditor props={ph}/>
          </TabPanel>
          <TabPanel>
          </TabPanel>
        </Tabs>   
       :  <div className="btn-verticalm-0  pl-2 " 
            style={{ textAlign: "center", verticalAlign: "baseline", maxWidth: "4px", paddingLeft: "6px", fontSize: "12px", backgroundColor: "#cdd" }}>
            <span style={{backgroundColor: "#cdd"}}> C o n t e x t & F o c u s </span>
          </div>
      } 
      </>
    )

    return (
      <>
            {visibleTabsDiv ? 
              <div className="report-module pe-1" style={{ minWidth: '700px', maxWidth: '800px', width: 'auto', overflowX: 'hidden', backgroundColor: "#cdd" }} >
                  <div className="report-module--tabs p-1 border border-dark rounded bg-light" 
                    style={{ height: '84vh', maxHeight: '88vh', overflow: 'hidden', borderTop: 'none', backgroundColor: "#cdd" }}>
                    {tabsDiv} 
                    {/* {ph.refresh ? <> {tabsDiv} </> : <>{tabsDiv} {ph.refresh}</>} */}
                  </div>
              </div>
            : <div className="border border-dark" style={{ height: '100%', width: 'auto', overflowX: 'hidden' }}>{tabsDiv}</div>
          }
      </>
    )
}
export default ReportModule  
