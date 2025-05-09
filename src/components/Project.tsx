// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Modal, Button, Tabs, Tab } from 'react-bootstrap';
import {
  CardGroup, Card, CardImg, CardText, CardBody, CardHeader,
  CardTitle, CardSubtitle, CardLink, CardDeck, CardColumns
} from 'reactstrap';
import ProjectDetailsForm from "./forms/ProjectDetailsForm";
import ModellingHeaderButtons from "./utils/ModellingHeaderButtons";
import { get } from 'http';

const debug = false;

const Project = (props) => {


  const dispatch = useDispatch();
  const projectModalRef = useRef(null);
  const router = useRouter();
  // const modeldata = useSelector((state: { phData: { metis: { models: any[], name: string, description: string } } }) => state);
  const modeldata = props.props;

  if (debug) console.log('25 Tasks props', modeldata?.phData, props);

  const models = modeldata?.phData?.metis?.models || [];
  const curmodel = models.find((model: any) => model?.id === modeldata?.phFocus?.focusModelview?.id);
  const modelviews = curmodel?.modelviews;



  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [issues, setIssues] = useState([]);
  const [projectFile, setProjectFile] = useState([]);
  const [comments, setComments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [refresh, setRefresh] = useState(false);
  // const [toggleRefresh, setToggleRefresh] = useState(false);

  const [org, setOrg] = useState(modeldata.phFocus.focusProj?.org);
  const [repo, setRepo] = useState(modeldata.phFocus.focusProj?.repo);
  const [path, setPath] = useState(modeldata.phFocus.focusProj?.path);
  const [file, setFile] = useState(modeldata.phFocus.focusProj?.file);
  const [branch, setBranch] = useState(modeldata.phFocus.focusProj?.branch);
  const [focus, setFocus] = useState(modeldata.phFocus.focusProj?.focus);
  const [ghtype, setGhtype] = useState(modeldata.phFocus.focusProj?.ghtype);
  const [projectNumber, setProjectNumber] = useState(modeldata.phFocus.focusProj?.projectNumber); // this is the project number in the list of github project
  if (debug) console.log('39 project', org, repo, path, file, branch, focus, ghtype, projectNumber);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (details) => {
    props.onSubmit(details);
    handleCloseProjectModal();
  };


  const handleCloseProjectModal = () => setShowProjectModal(false);

  const projectModalDiv = (
    <Modal show={showProjectModal} onHide={handleCloseProjectModal}
      className={`projectModalOpen ${!projectModalOpen ? "d-block" : "d-none"}`} style={{ marginLeft: "200px", marginTop: "100px", backgroundColor: "#fee", zIndex: "9999" }} ref={projectModalRef}>
      <Modal.Header closeButton>Set Context: </Modal.Header>
      <Modal.Body >
        <ProjectDetailsForm props={props.props} onSubmit={handleSubmit} />
      </Modal.Body>
      <Modal.Footer>
        <Button color="link" onClick={handleCloseProjectModal} >Exit</Button>
      </Modal.Footer>
    </Modal>
  );

  const modellingButtonsDiv =
    <>
      <ModellingHeaderButtons props={props} />
    </>;

  if (debug) console.log('79 Project ', modeldata, props);

  return mounted && (
    <div className="project bg-light h-100">
      <Tabs defaultActiveKey="domain" id="custom-tabs" className="custom-tabs nav-link mb-0 pb-0">
        <Tab eventKey="domain" title="ModelSuite Domain">
          {/* <div className="domain bg-warning"> */}
          <Card className="metis px-1 mx-1 me-0 mt-0">
            {/* <CardHeader className="card-header">AKM Domain :</CardHeader> */}
            <div className="card-body">
              <CardTitle className="card-title-bold nobreak">Domain : {modeldata.phData.domain?.name}</CardTitle>
              <CardSubtitle className="card-subtitle-bold text-secondary">{modeldata.phData.domain?.description}</CardSubtitle>
              <CardText className="card-text"> </CardText>
                <div className="border fs-6 p-1">Summary: {modeldata.phData.domain?.presentation}</div>
             
            </div>
          </Card>
          {/* </div> */}
        </Tab>
        <Tab eventKey="modelSuiteDetails" title="ModelSuite Details">
          <div className="metis-modelsuite">
            <Card className="metis p-1 m-1 me-0">
              <CardHeader className="card-header">Model Suite Details</CardHeader>
              <CardBody className="card-body bg-light">
                <CardTitle className="card-title-bold nobreak">Model Suite : {modeldata.phData.metis.name}</CardTitle>
                <CardSubtitle className="card-subtitle-bold"> {modeldata.phData.metis.description}</CardSubtitle>
               <CardText className="card-text"></CardText>
                  <span>GitHub:</span>
                  <div className="d-flex justify-content-between align-items-baseline border">
                    <div className="border fs-6 p-1">Proj.no.: {modeldata.phFocus.focusProj.projectNumber} </div>
                    <div className="border fs-6 p-1 w-75">Repository: {modeldata.phFocus.focusProj.repo} </div>
                    <div className="border fs-6 p-1 ">Path: {(modeldata.phFocus.focusProj.path) ? modeldata.phFocus.focusProj.path : 'models'}</div>
                    <div className="border fs-6 p-1">Branch: {modeldata.phFocus.focusProj.branch}</div>
                  </div>
                  <span>File:</span>
                  <div className="border fs-6">{modeldata.phFocus.focusProj.file}</div>
                  <span>Current User:</span>
                  <div className="border fs-6 p-1">Name: {modeldata.phUser.focusUser?.name} </div>
                  <div className="border fs-6 p-1">E-mail: {modeldata.phUser.focusUser?.email} </div>
                  <div className="border fs-6 p-1">Role: {modeldata.phFocus.focusRole?.name} </div>
                  <div className="border fs-6 p-1">Task: {modeldata.phFocus.focusTask?.name} </div>
                  <div className="justify-content-between align-items-baseline borde mt-2">In Focus:
                    <div className="border fs-6 p-1">Model: {modeldata.phFocus.focusModel?.name} </div>
                    <div className="border fs-6 p-1">Modelview: {modeldata.phFocus.focusModelview?.name} </div>
                    <div className="border fs-6 p-1">Object: {modeldata.phFocus.focusObject?.name} </div>
                    <div className="border fs-6 p-1">Objecttype: {modeldata.phFocus.focusObjecttype?.name} </div>
                    <div className="border fs-6 p-1">Target metamodel: {modeldata.phFocus.focusTargetMetamodel?.name} </div>
                    <div className="border fs-6 p-1">Source: {modeldata.phFocus.focusSource.name} </div>
                  </div>

              </CardBody>
            </Card>
          </div>
        </Tab>
        <Tab eventKey="models" title="Models">
          <div className="metis-modelsuite">
            <Card className="project p-1 m-1 me-0">
              <CardBody className="card-body">
                <CardTitle className="card-title-bold nobreak">Model Suite: {modeldata.phData.metis.name}</CardTitle>
                <CardSubtitle className="card-subtitle-bold text-secondary">{modeldata.phData.metis.description}</CardSubtitle>
                <CardText className="card-text fs-6 border-top"></CardText>
                  <div className="border-top"> Models:</div>
                  {models.map((model: any, index: any) => {
                    return (
                      <Card className="project p-2 m-0 me-0" key={index}>
                        <CardSubtitle className="card-subtitle-bold"><span className=" fs-5">{model.name}</span></CardSubtitle>
                        <div className="text-secondary">{model.description}</div>
                        <CardSubtitle className="card-subtitle-bold">Modelviews:</CardSubtitle>
                        <div>
                          <ul style={{ listStyleType: 'disc', listStylePosition: 'inside' }}>
                            {model.modelviews.map((modelview: any, index: any) => {
                              return (
                                <li className="align-items-center" key={index} style={{ listStyleType: 'circle', listStylePosition: 'inside' }}>
                                  <span className="text-bold fs-5">{modelview.name}</span>
                                  <span className="text-secondary">{modelview.description}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </Card>
                    );
                  })}

              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
      <style jsx>{`
        .custom-tabs .nav-link {
          background-color: #f8f9fa; /* Default background color for tabs */
          color: #000; /* Default text color */
        }

        .custom-tabs .nav-link.active {
          background-color: #28a745; /* Green background for active tab */
          color: #fff; /* White text color for active tab */
        }
      `}</style>
    </div>
  );
};

export default Project;
