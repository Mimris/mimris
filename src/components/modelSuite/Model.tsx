// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import Page from '../page';
import Palette from "../Palette";
import Modeller from "../Modeller";
import { loadMyModeldata } from "./LoadMyModeldata";
import * as akm from '../../akmm/metamodeller';
// import * as uib from '../../akmm/ui_buildmodels';
import GenGojsModel from "../GenGojsModel";
import useLocalStorage from '../../hooks/use-local-storage'


const debug = false;

const Page1 = (props) => {
  if (debug) console.log('11 Model props', props);

  const dispatch = useDispatch();

  if (!props) return <>file not found</>;

  const [refresh, setRefresh] = useState(false);
  const [showRenameModelModal, setShowRenameModelModal] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editingModelName, setEditingModelName] = useState('');
  const [pendingRenameModel, setPendingRenameModel] = useState<any>(null);
  const [renameModelModalName, setRenameModelModalName] = useState('');
  const [renameModelModalDescription, setRenameModelModalDescription] = useState('');
  // const [memoryAkmmUser, setMemoryAkmmUser] = useLocalStorage('akmmUser', ''); //props);

  // const [mmToggle, setMmToggle] = useState(false);
  const [activeTab, setActiveTab] = useState('0');
  // const toggle = (tab) => {
  //   if (activeTab !== tab) setActiveTab(tab);
  // }

  const modelData = props ?? {};
  const phData = modelData.phData || {};
  const phFocus = modelData.phFocus || {};
  const phUser = modelData.phUser || {};
  const phSource = modelData.phSource;

  const [mount, setMount] = useState(false)
  const metis = phData.metis || {};
  const models = Array.isArray(metis?.models) ? metis.models.filter(Boolean) : [];
  const modelList = models || [];
  const curmod = (models && phFocus.focusModel?.id) && models?.find((m: any) => m?.id === phFocus.focusModel?.id) || modelList[0] // find the current model
  const curmodview = (curmod && phFocus.focusModelview?.id && curmod.modelviews?.find((mv: any) => mv.id === phFocus.focusModelview.id))
    ? curmod?.modelviews?.find((mv: any) => mv.id === phFocus.focusModelview.id)
    : curmod?.modelviews?.[0] // if focusmodview does not exist set it to the first


  const focusTargetModel = phFocus.focusTargetModel
  const focusTargetModelview = phFocus.focusTargetModelview
  const curtargetmodel = (models && focusTargetModel?.id) && models.find((m: any) => m.id === curmod?.targetModelRef)
  const focustargetmodelview = (curtargetmodel && focusTargetModelview?.id) && curtargetmodel.modelviews.find((mv: any) => mv.id === focusTargetModelview?.id)
  const curtargetmodelview = focustargetmodelview || curtargetmodel?.modelviews?.[0]


  // const includeDeleted = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  // const includeNoObject = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  // const includeInstancesOnly = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  // const showModified = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showModified : false;

  // let gojsmetamodelpalette, gojsmetamodelmodel, gojsmodel, gojsmetamodel, gojsmodelobjects, gojstargetmodel, gojstargetmetamodel
  let myGoModel, myGoObjectPalette, myGoRelshipPalette, myGoMetamodel, myGoMetamodelModel, myGoMetamodelPalette

  const [gojsmodel, setGojsmodel] = useState(null)
  const [gojsmetamodel, setGojsmetamodel] = useState(null)
  const [gojsmodelobjects, setGojsmodelobjects] = useState(null)
  const [gojstargetmodel, setGojstargetmodel] = useState(null)
  const [gojstargetmetamodel, setGojstargetmetamodel] = useState(null)
  const [gojsmetamodelpalette, setGojsmetamodelpalette] = useState(null)
  const [gojsmetamodelmodel, setGojsmetamodelmodel] = useState(null)
  const dragModelIdRef = useRef<string | null>(null);
  const renameModelInputRef = useRef<HTMLInputElement | null>(null);

  // const modelview = phData?.focusView?.name;

  let activetabindex = modelList.findIndex(sm => sm.id === phFocus.focusModel?.id) // if no model in focus, set the active tab to 0
  if (activetabindex < 0) activetabindex = 0;

  let myMetis = new akm.cxMetis();
  let goParams = {}

  async function loadMyModeldata(myMetis: akm.cxMetis, goParams: any) {
    goParams = await GenGojsModel(props, myMetis);
    if (debug) console.log('84 Model', goParams);
    setGojsmodel({ nodeDataArray: goParams.myGoModel.nodes, linkDataArray: goParams.myGoModel.links });
    setGojsmetamodelpalette({ nodeDataArray: goParams.myGoMetamodelPalette.nodes, linkDataArray: goParams.myGoMetamodelPalette.links });
    setGojsmetamodelmodel({ nodeDataArray: goParams.myGoMetamodelModel.nodes, linkDataArray: goParams.myGoMetamodelModel.links });
    setGojsmetamodel({ nodeDataArray: goParams.myGoMetamodel.nodes, linkDataArray: goParams.myGoMetamodel.links });
    setGojsmodelobjects({ nodeDataArray: goParams.myGoObjectPalette, linkDataArray: goParams.myGoRelshipPalette });
    setGojstargetmodel({ nodeDataArray: goParams.myGoModel.nodes, linkDataArray: goParams.myGoModel.links });
    setGojstargetmetamodel({ nodeDataArray: goParams.myGoTargetMetamodel.nodes, linkDataArray: goParams.myGoTargetMetamodel.links });
  };
  goParams = GenGojsModel(props, myMetis);

  useEffect(() => {
    setActiveTab(activetabindex);
    setRefresh(!refresh)
    setMount(true);
  }, []);

  useEffect(() => {
    if (debug) console.log('207 Modeller useEffect 2 [phFocus.focusModelview?.id] : ', activeTab, phFocus.focusModel?.name);
    setActiveTab(activetabindex);
    loadMyModeldata(myMetis, goParams)
  }, [phFocus?.focusModel?.id]);

  useEffect(() => {
    setActiveTab(activetabindex);
  }, [activetabindex]);

  useEffect(() => {
    if (editingModelId && renameModelInputRef.current) {
      renameModelInputRef.current.focus();
      renameModelInputRef.current.select();
    }
  }, [editingModelId]);

  useEffect(() => { // Genereate GoJs node model when the focusRefresch.id changes
    if (debug) console.log('223 Model useEffect 4 [phFocus?.focusModelview.id]', phFocus.focusModel?.name, phFocus.focusModelview?.name, phFocus?.focusRefresh?.name);
    // GenGojsModel(props, myMetis)
    loadMyModeldata(myMetis, goParams)
    const timer = setTimeout(() => {
      if (debug) console.log('226 ', phFocus.focusModel?.name, phFocus.focusModelview?.name, phFocus?.focusRefresh?.name);
      setRefresh(!refresh)
    }, 50);
    return () => clearTimeout(timer);
  }, [phFocus?.focusModelview?.id])

  const doRefresh = () => {
    console.log('doRefresh')
  }

  const handleShowRenameModelModal = () => setShowRenameModelModal(true);
  const handleCloseRenameModelModal = () => {
    setShowRenameModelModal(false);
    setPendingRenameModel(null);
    setRenameModelModalName('');
    setRenameModelModalDescription('');
  };

  const beginModelRename = (model: any) => {
    if (!model?.id) return;
    setEditingModelId(model.id);
    setEditingModelName(model.name || '');
  };

  const cancelModelRename = () => {
    setEditingModelId(null);
    setEditingModelName('');
  };

  const commitModelRename = (model: any) => {
    if (!model?.id) {
      cancelModelRename();
      return;
    }
    const nextName = (editingModelName || '').trim();
    if (!nextName || nextName === model.name) {
      cancelModelRename();
      return;
    }
    setPendingRenameModel(model);
    setRenameModelModalName(nextName);
    setRenameModelModalDescription(model.description || '');
    handleShowRenameModelModal();
    cancelModelRename();
  };

  const saveModelRename = () => {
    const model = pendingRenameModel;
    const nextName = (renameModelModalName || '').trim();
    if (!model?.id || !nextName) {
      handleCloseRenameModelModal();
      return;
    }
    dispatch({
      type: 'UPDATE_MODEL_PROPERTIES',
      data: {
        id: model.id,
        name: nextName,
        description: renameModelModalDescription,
        modifiedDate: new Date().toISOString(),
      }
    });
    if (phFocus?.focusModel?.id === model.id) {
      dispatch({ type: 'SET_FOCUS_MODEL', data: { id: model.id, name: nextName } });
    }
    handleCloseRenameModelModal();
  };

  const handleModelDragStart = (modelId: string) => {
    dragModelIdRef.current = modelId;
  };

  const handleModelDrop = (targetModelId: string) => {
    const sourceModelId = dragModelIdRef.current;
    dragModelIdRef.current = null;
    if (!sourceModelId || sourceModelId === targetModelId) return;
    dispatch({
      type: 'REORDER_MODELS',
      data: {
        sourceId: sourceModelId,
        targetId: targetModelId,
      }
    });
  };

  const selmods = modelList.filter((m: any) => m && m?.markedAsDeleted !== true)

  const modelindex = models.findIndex((m: any) => m?.id === phFocus.focusModel?.id)

  const navmodelDiv = (!selmods) ? <></> : selmods.map((m, index) => {
    if (m && !m.markedAsDeleted) {
      const strindex = index.toString();
      const data = { id: m.id, name: m.name };
      const modelview0 = m.modelviews ? m.modelviews[0] : null;
      const data2 = { id: modelview0?.id, name: modelview0?.name };
      return (
        <NavItem
          key={`${m.id || 'model'}-${strindex}`}
          className="model-selection"
          data-toggle="tooltip"
          data-placement="top"
          data-bs-html="true"
          title={`Description: ${m?.description}\n\nTo change Model name, right click the background below and select 'Edit Model'.`}
          draggable
          onDragStart={() => handleModelDragStart(m.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleModelDrop(m.id)}
          onDragEnd={() => { dragModelIdRef.current = null; }}
        >
          <NavLink
            style={{
              paddingTop: "0px",
              paddingBottom: "2px",
              paddingLeft: "8px",
              paddingRight: "8px",
              border: "solid 1px",
              borderBottom: "none",
              borderColor: "#eee gray white #eee",
              color: "black",
              cursor: "pointer",
            }}
            className={classnames({ active: activeTab == strindex })}
            onClick={() => {
              if (editingModelId === m.id) return;
              dispatch({ type: "SET_FOCUS_MODEL", data });
              dispatch({ type: "SET_FOCUS_MODELVIEW", data: data2 });
              dispatch({ type: 'SET_FOCUS_REFRESH', data: { id: Math.random().toString(36).substring(7), name: m.name || 'model-tab' } });
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              beginModelRename(m);
            }}
          >
            {editingModelId === m.id ? (
              <input
                ref={renameModelInputRef}
                type="text"
                value={editingModelName}
                className="form-control form-control-sm"
                style={{ minWidth: "120px", paddingTop: "0px", paddingBottom: "0px" }}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setEditingModelName(e.target.value)}
                onBlur={() => commitModelRename(m)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitModelRename(m);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelModelRename();
                  }
                }}
              />
            ) : (
              (m.name.startsWith('_A')) ? <span className="text-secondary" style={{ scale: "0.8", whiteSpace: "nowrap" }} data-toggle="tooltip" data-placement="top" data-bs-html="_ADMIN_MODEL">_AM</span> : m.name
            )}
          </NavLink>
        </NavItem>
      );
    }
  });

  const modellingtabs =
    <>
      <Nav tabs style={{ minWidth: "50px", borderBottom: "white" }} >
        {navmodelDiv}
      </Nav>
      <Modal show={showRenameModelModal} onHide={handleCloseRenameModelModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Model</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              value={renameModelModalName}
              onChange={(e) => setRenameModelModalName(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={4}
              value={renameModelModalDescription}
              onChange={(e) => setRenameModelModalDescription(e.target.value)}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseRenameModelModal}>Cancel</Button>
          <Button variant="primary" onClick={saveModelRename}>Save</Button>
        </Modal.Footer>
      </Modal>
      <TabContent  >
        <TabPane >   {/* Model ---------------------------------------*/}
          <div className="workpad p-1 pt-2 bg-white">
            <Row className="row1">

              <Col className="col2" style={{ paddingLeft: "1px", marginLeft: "1px", paddingRight: "1px", marginRight: "1px" }}>
                <div className="modelling-area myModeller pl-0 mb-0 pr-1" style={{ backgroundColor: "#acc", minHeight: "7vh", width: "100%", height: "100%", border: "solid 1px black" }}>
                  <Modeller
                    gojsModelObjects={null} // do not use/show gojsmodelobjects
                    // gojsModelObjects={gojsmodelobjects}
                    gojsModel={gojsmodel}
                    gojsMetamodel={gojsmetamodel}
                    myMetis={myMetis}
                    myGoModel={myGoModel}
                    myGoMetamodel={myGoMetamodel}
                    phData={phData}
                    phFocus={phFocus}
                    phUser={phUser}
                    phSource={phSource}
                    metis={metis}
                    dispatch={dispatch}
                    modelType='model'
                    userSettings={null}
                  />
                </div>
              </Col>
            </Row>
          </div>
        </TabPane>
      </TabContent>
    </>
  return (mount) && (
    <div className="p-1" style={{ backgroundColor: "#eee" }}>
      {/* {modellingtabs} */}
      {refresh ? <> {modellingtabs} </> : <>{modellingtabs}</>}
    </div>
  )
}

export default Page(Page1);
