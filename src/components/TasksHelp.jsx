import React, { useState } from "react";
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col } from 'reactstrap';
// import { TabContent, TabPane, Nav, NavItem, NavLink, Card, Button, CardTitle, CardText, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import Help from '../components/Help'
import Tasks from '../components/Tasks'

const TasksHelp = () => {

  const [activeTab, setActiveTab] = useState('2');
  const toggleTab = tab => { if (activeTab !== tab) setActiveTab(tab); }
  // const [tooltipOpen, setTooltipOpen] = useState(false);
  // const toggleTip = () => setTooltipOpen(!tooltipOpen);

  const [visibleTasks, setVisibleTasks] = useState(false)
  function toggleTasks() {
    setVisibleTasks(!visibleTasks);
  }

  const tabs = (
    <div style={{ minWidth: "200px" }} >
      <Nav tabs >
        <NavItem >
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" }}
            className={classnames({ active: activeTab === '0' })}
            onClick={toggleTasks}
          >
            &lt;
          </NavLink>
        </NavItem>
        <NavItem >
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" }}
            className={classnames({ active: activeTab === '1' })}
            onClick={() => { toggleTab('1'); }}
          >
            Tasks
          </NavLink>
        </NavItem>
        <NavItem >
          <NavLink style={{ paddingTop: "0px", paddingBottom: "0px" }}
            className={classnames({ active: activeTab === '2' })}
            onClick={() => { toggleTab('2'); }}
          >
            Help
            </NavLink>
        </NavItem>
      </Nav>
      <TabContent activeTab={activeTab}>
        <TabPane tabId="1">
          {/* <Row>
            <Col sm="1">
            </Col>
            <Col sm="10"> */}
              <br /> 
              <div>Tasks from the model:</div>
              <br />
              <Tasks />
            {/* </Col>
            <Col sm="1">
            </Col>
          </Row> */}
        </TabPane>
        <TabPane tabId="2">
          <Help />
        </TabPane>
      </TabContent>
      {/* <div className="tooltip">
        <p>Somewhere in here is a <span style={{ textDecoration: "underline", color: "blue" }} href="#" id="TooltipExample">!</span>.</p>
        <Tooltip placement="right" isOpen={tooltipOpen} target="TooltipExample" toggle={toggleTip}>
          Tooltip test!
        </Tooltip>
      </div> */}
    </div>
  )

  const taskstabs =
    <>
      <span onClick={toggleTasks}>{visibleTasks
        ? <div></div>
        // ? <><span style={{ paddingLeft: "5px" }}> Tasks</span> <span style={{ float: "left" }} > &lt;  </span></>
        : <div className="btn-vertical m-0 pr-1" style={{ backgroundColor: "#aaa", paddingLeft: "2px", minWidth: "10px", maxWidth: "10px", maxHeight: "100%", fontSize: "90%" }}><span> &gt; </span><span> T a s k s - H e l p</span> </div>}
      </span>
      <div className="toggleTasks">
        {visibleTasks
          ? tabs
          : <> </>}
        {/* : <div style= {{maxWidth: "6px", paddingLeft: "0px" }}> </div>} */}
      </div>
    </>

  return (
    <div className="taskhelp" style={{ backgroundColor: "#eee" }}>
      {taskstabs}
      <style jsx>{`
      .nav-item {
        margin-bottom: -4px; 
        margin-top: -4px; 
        padding-top: -4px;
        padding-bottom: -4px;
      }
      .nav-link{
        margin-bottom: 0px; 
        margin-top: 0px; 
        padding-top: 0px;
        padding-bottom: 0px;
      }
      .nav-item > li.active {
        margin-bottom: -3px;    
        padding-top: -4px;
      }
    `}</style>
    </div >
  )
}

export default TasksHelp;