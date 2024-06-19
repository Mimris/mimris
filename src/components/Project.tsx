// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router'
import Link from 'next/link';
import { Modal, Button } from 'react-bootstrap';
import {
  CardGroup, Card, CardImg, CardText, CardBody, CardHeader,
  CardTitle, CardSubtitle, CardLink, CardDeck, CardColumns
} from 'reactstrap';
import ProjectDetailsForm from "./forms/ProjectDetailsForm";
import ModellingHeaderButtons from "./utils/ModellingHeaderButtons";
import { get } from 'http';

const debug = false;

const Project = (props) => {
  if (debug) console.log('25 Tasks props', props.props.phData, props);
  
  const dispatch = useDispatch();
  const projectModalRef = useRef(null);
  const router = useRouter();
  const state = useSelector((state: { phData: { metis: { models: any[], name: string, description: string } } }) => state);
  const models = state.phData.metis.models;
  const curmodel = models.find((model: any) => model.id === props.props.phFocus.focusModelview.id);
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


  const [org, setOrg] = useState(props.props.phFocus.focusProj?.org)
  const [repo, setRepo] = useState(props.props.phFocus.focusProj?.repo)
  const [path, setPath] = useState(props.props.phFocus.focusProj?.path)
  const [file, setFile] = useState(props.props.phFocus.focusProj?.file)
  const [branch, setBranch] = useState(props.props.phFocus.focusProj?.branch)
  const [focus, setFocus] = useState(props.props.phFocus.focusProj?.focus)
  const [ghtype, setGhtype] = useState(props.props.phFocus.focusProj?.ghtype)
  const [projectNumber, setProjectNumber] = useState(props.props.phFocus.focusProj?.projectNumber) // this is the project number in the list of github project
  if (debug) console.log('39 project', org, repo, path, file, branch, focus, ghtype, projectNumber)

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
      setMounted(true)
  }, [])

  const handleSubmit = (details) => {
    props.onSubmit(details);
    handleCloseProjectModal();
  };

  const handleCloseProjectModal = () => setShowProjectModal(false);

  const projectModalDiv = (
    <Modal show={showProjectModal} onHide={handleCloseProjectModal} 
      className={`projectModalOpen ${!projectModalOpen ? "d-block" : "d-none"}`} style={{ marginLeft: "200px", marginTop: "100px", backgroundColor: "#fee", zIndex:"9999" }} ref={projectModalRef}>
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
      <ModellingHeaderButtons props= {props}  />
    </>

  return  mounted && (
    <>
      <div className="project-modelsuite">
        <Card className="project p-1 m-1 me-0">
          <CardHeader className="card-header">Project Details</CardHeader>
          <CardBody className="card-body bg-light">
            <CardTitle className="card-title-bold nobreak">Project: {props.props.phData.metis.name}</CardTitle>
            <CardSubtitle className="card-subtitle-bold"> {props.props.phData.metis.description}</CardSubtitle>
            <CardText className="card-text">
              <span>GitHub:</span>
              <div className="d-flex justify-content-between align-items-baseline border">
                <div className="border fs-6 p-1">Proj.no.: {props.props.phFocus.focusProj.projectNumber} </div>
                <div className="border fs-6 p-1 w-75">Repository: {props.props.phFocus.focusProj.repo} </div>
                <div className="border fs-6 p-1 ">Path: {(props.props.phFocus.focusProj.path) ? props.props.phFocus.focusProj.path : 'models'}</div>
                <div className="border fs-6 p-1">Branch: {props.props.phFocus.focusProj.branch}</div>
              </div>
            <span>File:</span>
              <div className="borde fs-6">{props.props.phFocus.focusProj.file}</div>
              {/* <hr /> */}
            <span>Current User:</span>
              <div className="border fs-6 p-1">Name: {props.props.phUser.focusUser?.name} </div>
              <div className="border fs-6 p-1">E-mail: {props.props.phUser.focusUser?.email} </div>
              <div className="border fs-6 p-1">Role: {props.props.phFocus.focusRole?.name} </div>
              <div className="border fs-6 p-1">Task: {props.props.phFocus.focusTask?.name} </div>
              <div className="justify-content-between align-items-baseline borde mt-2">In Focus:
                <div className="border fs-6 p-1">Model: {props.props.phFocus.focusModel?.name} </div>
                <div className="border fs-6 p-1">Modelview: {props.props.phFocus.focusModelview?.name} </div>
                <div className="border fs-6 p-1">Object: {props.props.phFocus.focusObject?.name} </div>
                <div className="border fs-6 p-1">Objecttype: {props.props.phFocus.focusObjecttype?.name} </div>
                <div className="border fs-6 p-1">Target metamodel: {props.props.phFocus.focusTargetMetamodel?.name} </div>
                {/* <div className="border fs-6 p-1">Proj.no.: {props.props.phFocus.focusTargetModel} </div> */}
                { /* <div className="border fs-6 p-1">Proj.no.: {props.props.phFocus.focusTargetModelview} </div> */}
                <div className="border fs-6 p-1">Source: {props.props.phFocus.focusSource.name} </div>
              </div>
            </CardText>
          </CardBody>
        </Card>
        <Card className="project p-1 m-1 me-0">
          {/* <CardHeader className="card-header">Content:</CardHeader> */}
          <CardBody className="card-body">
            <CardTitle className="card-title-bold nobreak">Model Suite: {state.phData.metis.name}</CardTitle>
            <CardSubtitle className="card-subtitle-bold text-secondary">{state.phData.metis.description}</CardSubtitle>
            {/* <CardGroup className="project "> */}
            <CardText className="card-text fs-6 border-top">
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
            </CardText>
            {/* </CardGroup> */}
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default Project;
