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
    // let props.= useSelector((props.any) => props. // Selecting the whole redux store
    const ph = props.props
    console.log('20 ReportModule', ph.phUser?.appSkin.visibleContext , props)

    if (!ph?.phData?.metis?.models) return <></>

    const [activeTab, setActiveTab] = useState(0);

    const tabsDiv = (
      <Tabs onSelect={index => setActiveTab(index)} >
        <TabList style={{ borderRight: '1px solid gray', borderLeft: '1px solid gray', margin: '0px' }}>
          <Tab>Current Object</Tab>
          <Tab >MarkDown</Tab>
          <Tab></Tab>
          {/* <Tab><FaPlaneArrival />Main</Tab>
              <Tab ><FaCompass /></Tab> */}
        </TabList>
        <TabPanel>
            <Context props={ph} />
        </TabPanel>
        <TabPanel>
            <MarkdownEditor value='' props={ph}/>
        </TabPanel>
        <TabPanel>
        </TabPanel>
      </Tabs>
    )

    return (
      <>
        <div className="bg-light border " style={{ minWidth: '700px', maxWidth: '800px', width: 'auto', overflowX: 'hidden' }} >
            <h5 className='ms-2 mb-0'>Context and Focus :</h5>
          <div style={{ marginBottom: "-36px", display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-sm px-1 me-4 mt-2 " onClick={() => { dispatch({ type: 'SET_VISIBLE_CONTEXT', data: !ph.phUser?.appSkin.visibleContext }) }}>X</button>
          </div>
          {/* <h1>{curobject.name}</h1> */}
          {/* {tabsDiv} */}
          {/* <div className=" border border-rounded m-1 " style={{ maxHeight: '88vh', overflowY: 'auto', overflowX: 'hidden' }} > */}
          <div className="border border-dark rounded bg-white" style={{ height: '88vh', maxHeight: '88vh', overflow: 'auto', borderTop: 'none' }}>
  {ph.refresh ? <> {tabsDiv} </> : <>{tabsDiv} {ph.refresh}</>}
</div>
        </div>
        {/* <hr style={{ backgroundColor: "#ccc", padding: "2px", marginTop: "2px", marginBottom: "0px" }} /> */}
      </>
    )
}
export default ReportModule  
