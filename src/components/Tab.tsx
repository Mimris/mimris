// @ts- nocheck
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import Palette from "./Palette";
import TabsPane from "./TabsPane";
// import Palette from "./Palette";

function Tab() {

  const TabColLeftDiv   = <Palette colname= "Source" />
  const TabColMainDiv   = <TabsPane />
  const TabColRightDiv  = <Palette colname= "Target" />


  return (
    <div>
          <div className="workpad p-1 pt-2 bg-white">
            <Row >
              <Col xs="auto m-0 p-0 pr-0">
               <div className="tab-left-col mb-1 pt-3 pl-1 pr-1" style={{ backgroundColor: "#ddd", width: "100%", height: "100%", border: "solid 1px black" }}>
                  {TabColLeftDiv}
                </div>
              </Col>
              <Col style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}>
                <div className="tab-main-col mb-1 pt-3 pl-1 pr-1" style={{ backgroundColor: "#ddd", width: "100%", height: "100%", border: "solid 1px black" }}>
                  {TabColMainDiv}
                </div>
              </Col>
              <Col style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}>
                <div className="tab-right-col mb-1 pt-3 pl-1 pr-1" style={{ backgroundColor: "#ddd", width: "100%", height: "100%", border: "solid 1px black" }}>
                  {TabColRightDiv}
                </div>
              </Col>
            </Row>
          </div>   
    </div>
  )
}

export default Tab
