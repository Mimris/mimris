// This is a React component that displays details of a selected object in a tabbed interface.
// It allows the user to edit the object's properties and view related objects.
import React, { useRef, useContext, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import { FaPlaneArrival, FaCompass } from 'react-icons/fa';
import 'react-tabs/style/react-tabs.css';

import FocusDetails from '../FocusDetails';
import MarkdownEditor from '../forms/MarkdownEditor';
import ExportObjects from './ExportObjects';

const debug = false

const ReportModule = (props: any) => {

  if (debug) console.log('17 ReportModule', props, props.reportType, props.modelInFocusId)

  const ph = props.props.props || props.props
  if (debug) console.log('20 ReportModule', props, props.reportType, ph, ph?.phData?.metis?.models)




  // const dispatch = useDispatch()
  const [visibleTabsDiv, setVisibleTabsDiv] = useState(props.visibleFocusDetails)
  // function toggleTabsDiv() { setVisibleTabsDiv(!visibleTabsDiv); }
  // let props.= useSelector((props.any) => props. // Selecting the whole redux store

  const [activeTab, setActiveTab] = useState(props.exportTab || 0);

  // console.log('33 ReportModule', activeTab, props.exportTab)  

  useEffect(() => {
    if (debug) console.log('36 ReportModule useEffect 1 [] ');
    if (props.exportTab) setActiveTab(2)
  }, [])

  if (!ph?.phData?.metis?.models) return <>No models</>
  if (!props.modelInFocusId) return <>No objects</>

  const tabsDiv = (
    <>
      {!visibleTabsDiv ?
        <>
          <button className="btn-sm bg-transparent float-end me-2" style={{ textAlign: "left", outline: "0", borderStyle: "none" }}
            onClick={() => setVisibleTabsDiv(!visibleTabsDiv)}><span><i className="fa fa-arrow-right fa-lg"></i></span>
          </button>
          <>
            <Tabs onSelect={index => setActiveTab(index)}
              style={{ maxHeight: '78vh', overflow: 'hidden', borderTop: 'none' }}
            >
              <TabList style={{ margin: '0px' }}>
                <Tab>Focus Object</Tab>
                <Tab >MarkDown</Tab>
                <Tab>Export</Tab>
                {/* <Tab><FaPlaneArrival />Main</Tab>
                  <Tab ><FaCompass /></Tab> */}
              </TabList>
              <TabPanel className='p-1 border border-dark' >
                <FocusDetails ph={ph} reportType={props.reportType} modelInFocusId={props.modelInFocusId} edit={props.edit} />
              </TabPanel>
              <TabPanel className='p-1 border border-dark' >
                <MarkdownEditor ph={ph} reportType={props.reportType} modelInFocusId={props.modelInFocusId} edit={props.edit} />
              </TabPanel>
              <TabPanel>
                <ExportObjects ph={ph} reportType={props.reportType} modelInFocusId={props.modelInFocusId} edit={props.edit} />
              </TabPanel>
            </Tabs>
          </>
        </>
        : <div className="btn-vertical m-0  p-0 bg-transparent"
          onClick={() => setVisibleTabsDiv(!visibleTabsDiv)}
          style={{ textAlign: "center", verticalAlign: "baseline", maxWidth: "12px", paddingLeft: "0px", fontSize: "14px" }}>
          <i className="fa fa-arrow-left fa-lg"></i>
          <span className="fs-5" style={{ backgroundColor: "#cdd" }}> O b j e c t - D e t a i l s </span>
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
          style={{ height: '78vh', overflow: 'hidden', borderTop: 'none' }}>
          {tabsDiv}
          {/* {ph.refresh ? <> {tabsDiv} </> : <>{tabsDiv} {ph.refresh}</>} */}
        </div>
        : <div className="border border-dark bg-transparent" style={{ height: '100%', width: 'auto', overflowX: 'hidden' }}>{tabsDiv}</div>
      }
    </>

  return (
    <div className="report-module pe-1 bg-transparent" style={{ maxHeight: "78vh", overflowX: 'hidden', maxWidth: '49vw', minWidth: (visibleTabsDiv) ? '10px' : '10vw'.toString() }}>
      {reportDiv}
    </div>
  )
}
export default ReportModule  
