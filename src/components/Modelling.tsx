// @ts-nocheck
// modelling

const debug = false;

// import React from "react";
import { useRouter } from "next/router";
import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { connect, useSelector, useDispatch, useStore } from 'react-redux';
import { Modal, Button } from 'react-bootstrap';
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import { type } from "os";
import classnames from 'classnames';

import Page from './page';
import Palette from "./Palette";
import Modeller from "./Modeller";
import TargetModeller from "./TargetModeller";
import TargetMeta from "./TargetMetaPalette";
import GenGojsModel from './GenGojsModel'
import LoadServer from '../components/loadModelData/LoadServer'
import LoginServer from './loadModelData/LoginServer'
import LoadRecovery from '../components/loadModelData/LoadRecovery'
import LoadFile from './loadModelData/LoadFile'
import LoadGitHub from '../components/loadModelData/LoadGitHub'
import LoadNewModelProjectFromGithub from './loadModelData/LoadNewModelProjectFromGitHub'
import LoadMetamodelFromGithub from './loadModelData/LoadMetamodelFromGitHub'
import LoadJsonFile from '../components/loadModelData/LoadJsonFile'
import { ReadModelFromFile } from './utils/ReadModelFromFile';
import { SaveAllToFile, SaveAllToFileDate } from './utils/SaveModelToFile';
import ProjectDetailsForm from "./forms/ProjectDetailsForm";
import useLocalStorage from '../hooks/use-local-storage'
import useSessionStorage from '../hooks/use-session-storage'
import * as akm from '../akmm/metamodeller';
import genGqlSchema from "../../pagestmp/genGqlSchema";
import { setMymetisModel } from "../actions/actions";
import { bindLegacyUniverseDispatch, selectMimrisCompatibilityProps } from "../sharedUniverse";
import { MEMORY_STATE_STORAGE_KEY } from "./utils/memoryStateStorage";

const clog = console.log.bind(console, '%c %s', // green colored cosole log
  'background: blue; color: white');
const useEfflog = console.log.bind(console, '%c %s', // green colored console log
  'background: red; color: white');
const ctrace = console.trace.bind(console, '%c %s',
  'background: blue; color: white');

const LAST_FOCUS_MODEL_STORAGE_KEY = 'mimris.modelling.focusModelId';
const WORKSPACE_SNAPSHOT_META_KEY = '__workspaceUniverse';

const trimPersistedStateForBrowserStorage = (state: any) => {
  const phUser = state?.phUser || {};
  const workspaceMeta = phUser?.[WORKSPACE_SNAPSHOT_META_KEY];
  if (!workspaceMeta) return state;

  return {
    ...state,
    phUser: {
      ...phUser,
      [WORKSPACE_SNAPSHOT_META_KEY]: {
        ...workspaceMeta,
        snapshot: undefined,
        worldOperation: undefined,
      },
    },
  };
};

const countRenderableModelviewItems = (state: any) => {
  const models = state?.phData?.metis?.models;
  if (!Array.isArray(models)) return 0;
  return models.reduce((count: number, model: any) => {
    const modelviews = Array.isArray(model?.modelviews) ? model.modelviews : [];
    return count + modelviews.reduce((viewCount: number, modelview: any) => {
      const objectviews = Array.isArray(modelview?.objectviews) ? modelview.objectviews.filter(Boolean) : [];
      const relshipviews = Array.isArray(modelview?.relshipviews) ? modelview.relshipviews.filter(Boolean) : [];
      return viewCount + objectviews.length + relshipviews.length;
    }, 0);
  }, 0);
};

const readStoredMemoryState = (storage: Storage | undefined) => {
  if (!storage) return null;
  try {
    const raw = storage.getItem(MEMORY_STATE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

const shouldSkipSparseStartupPersist = (nextState: any) => {
  if (typeof window === 'undefined') return false;
  if (nextState?.phFocus?.focusRefresh?.id) return false;
  const nextScore = countRenderableModelviewItems(nextState);
  const storedStates = [
    readStoredMemoryState(window.sessionStorage),
    readStoredMemoryState(window.localStorage),
  ];
  const storedScore = Math.max(0, ...storedStates.map(countRenderableModelviewItems));
  return storedScore > nextScore;
};

const Modelling = (props: any) => {

  if (typeof window === 'undefined') return <></>
  // if (!props) return <></>
  if (debug) console.log('55 Modelling:', props)//, props);        
  const rawDispatch = useDispatch();
  const dispatch = useMemo(() => bindLegacyUniverseDispatch(rawDispatch), [rawDispatch]);
  const store = useStore();

  const projectModalRef = useRef(null);
  const modellerRef = useRef<any>(null);
  const paletteRef = useRef<any>(null); // metamodel palette
  const paletteObjRef = useRef<any>(null); // objects palette (left column)
  const didRestoreStoredFocusModelRef = useRef(false);
  const dragModelIdRef = useRef<string | null>(null);
  const renameModelInputRef = useRef<HTMLInputElement | null>(null);

  const [refresh, setRefresh] = useState(true);
  const [showRenameModelModal, setShowRenameModelModal] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editingModelName, setEditingModelName] = useState('');
  const [pendingRenameModel, setPendingRenameModel] = useState<any>(null);
  const [renameModelModalName, setRenameModelModalName] = useState('');
  const [renameModelModalDescription, setRenameModelModalDescription] = useState('');
  const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', null);
  const [memorySessionState, setMemorySessionState] = useSessionStorage('memorystate', {});
  const [memoryAkmmUser, setMemoryAkmmUser] = useLocalStorage('akmmUser', '');

  const [activeTab, setActiveTab] = useState();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [visibleTasks, setVisibleTasks] = useState(true)
  const [mmToggle, setMmToggle] = useState(true)
  const [mount, setMount] = useState(false)
  const [gojsSnapshot, setGojsSnapshot] = useState<any>({
    nodes: [],
    links: [],
    modelId: null,
    modelviewId: null,
    version: 0,
  })
  const [palettesOpen, setPalettesOpen] = useState(true) // parent-level toggle state for both palettes
  const [loaded, setLoaded] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  // const [visibleContext, setVisibleContext] = useState(true)
  // const [visibleFocusDetails, setVisibleFocusDetails] = useState(true) // show/hide the focus details (right side)

  const sharedCompatibilityProps = useSelector(selectMimrisCompatibilityProps) as any;
  const metis = sharedCompatibilityProps.phData?.metis as any;
  const phFocus = sharedCompatibilityProps.phFocus as any;
  const phUser = sharedCompatibilityProps.phUser as any;
  const phSource = sharedCompatibilityProps.phSource as any;
  const phData = sharedCompatibilityProps.phData as any;
  const compatibilityProps = useMemo(() => ({
    ...props,
    ...sharedCompatibilityProps,
  }), [props, sharedCompatibilityProps]);

  let focusModel = phFocus?.focusModel
  let focusModelview = phFocus?.focusModelview
  const runtimeRefreshKey = phFocus?.focusRefresh?.id || 'initial'
  const focusObjectview = phFocus?.focusObjectview
  const focusRelshipview = phFocus?.focusRelshipview
  const focusObjecttype = phFocus?.focusObjecttype
  const focusRelshiptype = phFocus?.focusRelshiptype
  if (debug) console.log('69 Modelling', focusModel, focusModelview);

  const getPersistedState = () => {
    return trimPersistedStateForBrowserStorage(selectMimrisCompatibilityProps(store.getState() as any));
  }

  const persistCurrentStateToBrowserStorage = () => {
    const persistedProps = getPersistedState();
    if (shouldSkipSparseStartupPersist(persistedProps)) return false;
    setMemorySessionState(persistedProps)
    setMemoryLocState(persistedProps)
    return true;
  }

  const models = metis?.models?.filter((m: any) => m); // Filter out empty models
  const modelList = models || [];
  const hasNoModels = Array.isArray(metis?.models) && modelList.length === 0
  let curmod = (models && focusModel?.id) && models?.find((m: any) => m?.id === focusModel?.id)
  if (!curmod) curmod = modelList[0] || null

  const modelviews = Array.isArray(curmod?.modelviews) ? curmod.modelviews.filter((mv: any) => mv) : []
  let curmodview = (curmod && modelviews && focusModelview?.id) && modelviews.find((mv: any) => mv.id === focusModelview.id)
  if (!curmodview) curmodview = modelviews[0] || null

  const focusedMetamodel = metis?.metamodels?.find((mm: any) => mm?.id === curmod?.metamodelRef) || null;
  const generationContentKey = useMemo(() => {
    try {
      return JSON.stringify({
        model: curmod || null,
        metamodel: focusedMetamodel,
        focusModelId: focusModel?.id || '',
        focusModelviewId: focusModelview?.id || '',
      });
    } catch (_) {
      return [
        metis?.id || '',
        curmod?.id || '',
        curmodview?.id || '',
        curmod?.objects?.length || 0,
        curmod?.relships?.length || 0,
        focusedMetamodel?.objecttypes?.length || 0,
        focusedMetamodel?.relshiptypes?.length || 0,
      ].join(':');
    }
  }, [metis, curmod, curmodview?.id, focusedMetamodel, focusModel?.id, focusModelview?.id]);


  if (debug) console.log('130 Modelling curmodview', curmod, curmodview, models, focusModel?.name, focusModelview?.name);

  const focusTargetModel = phFocus?.focusTargetModel
  const focusTargetModelview = phFocus?.focusTargetModelview
  const curtargetmodel = (models && focusTargetModel?.id) && models.find((m: any) => m.id === curmod?.targetModelRef)
  const targetModelviews = Array.isArray(curtargetmodel?.modelviews) ? curtargetmodel.modelviews.filter((mv: any) => mv) : []
  const focustargetmodelview = (curtargetmodel && focusTargetModelview?.id) && targetModelviews.find((mv: any) => mv.id === focusTargetModelview?.id)
  const curtargetmodelview = focustargetmodelview || targetModelviews[0] || null

  let activetabindex = modelList.findIndex(sm => sm.id === focusModel?.id)
  if (activetabindex < 0) activetabindex = 0;

  const myMetisRef = useRef<any>(null);
  const importedGenerationContentKeyRef = useRef<string>('');
  if (!myMetisRef.current) {
    myMetisRef.current = new akm.cxMetis();
  }
  const myMetis = myMetisRef.current;
  if (metis && myMetis?.importData && importedGenerationContentKeyRef.current !== generationContentKey) {
    myMetis.importData(metis, true);
    importedGenerationContentKeyRef.current = generationContentKey;
    const hydratedModel =
      (focusModel?.id && myMetis.findModel?.(focusModel.id)) ||
      myMetis.currentModel ||
      null;
    const hydratedModelview =
      (focusModelview?.id && hydratedModel?.findModelView?.(focusModelview.id)) ||
      hydratedModel?.modelviews?.find((mv: any) => mv) ||
      null;
    const hydratedMetamodel =
      (hydratedModel?.metamodelRef && myMetis.findMetamodel?.(hydratedModel.metamodelRef)) ||
      hydratedModel?.metamodel ||
      null;
    if (hydratedMetamodel && myMetis.setCurrentMetamodel) myMetis.setCurrentMetamodel(hydratedMetamodel);
    if (hydratedModel && myMetis.setCurrentModel) myMetis.setCurrentModel(hydratedModel);
    if (hydratedModelview && myMetis.setCurrentModelview) myMetis.setCurrentModelview(hydratedModelview);
  }

  useEffect(() => {
    if (!debug) console.log('136 Modelling', mmToggle )
    dispatch({ type: 'TAB', data: (!mmToggle) ? 'metamodel' : 'model' });
    myMetis.modelType = (!mmToggle) ? 'Metamodelling' : 'Modelling';
    if (!debug) console.log('139 Modelling', myMetis.modelType, myMetis)
  }, [mmToggle])






  useEffect(() => { // Generate GoJS node model when focus changes
    if (debug) useEfflog('223 Modelling useEffect 1', myMetis)
    let cancelled = false;
    myMetis.modelType = 'Modelling';
    if (debug) console.log('147 Modelling useEffect 2 ', myMetis, activeTab, activetabindex);
    const generateGojsModel = async () => {
      await GenGojsModel(compatibilityProps, myMetis, { skipImport: true })
      if (cancelled) return;
      const goModel = myMetis?.gojsModel;
      setGojsSnapshot((snapshot: any) => ({
        nodes: Array.isArray(goModel?.nodes) ? [...goModel.nodes] : [],
        links: Array.isArray(goModel?.links) ? [...goModel.links] : [],
        modelId: phFocus?.focusModel?.id || null,
        modelviewId: phFocus?.focusModelview?.id || null,
        version: (snapshot?.version || 0) + 1,
      }))
      setActiveTab(activetabindex)
      setMount(true);
    }
    generateGojsModel();
    return () => {
      cancelled = true;
    }
  }, [phFocus?.focusModel?.id, phFocus?.focusModelview?.id, runtimeRefreshKey, refresh, generationContentKey])

  useEffect(() => {
    setActiveTab(activetabindex);
  }, [activetabindex]);

  useEffect(() => {
    if (editingModelId && renameModelInputRef.current) {
      renameModelInputRef.current.focus();
      renameModelInputRef.current.select();
    }
  }, [editingModelId]);

  useEffect(() => {
    if (didRestoreStoredFocusModelRef.current) return;
    if (typeof window === 'undefined') return;

    // Embedded/workspace sessions can request an exact model. That explicit
    // focus must win over the model remembered from an earlier Mimris tab.
    const requestedModelRef = new URLSearchParams(window.location.search).get('currentModelRef');
    if (requestedModelRef) {
      didRestoreStoredFocusModelRef.current = true;
      return;
    }
    if (!models?.length) return;
    didRestoreStoredFocusModelRef.current = true;

    const storedFocusModelId = window.sessionStorage.getItem(LAST_FOCUS_MODEL_STORAGE_KEY);
    if (!storedFocusModelId) return;
    if (focusModel?.id === storedFocusModelId) return;

    const storedModel = models.find((m: any) => m?.id === storedFocusModelId);
    if (!storedModel) return;

    const storedModelview = storedModel?.modelviews?.find((mv: any) => mv) || storedModel?.modelviews?.[0];
    dispatch({ type: 'SET_FOCUS_MODEL', data: { id: storedModel.id, name: storedModel.name } });
    if (storedModelview) {
      dispatch({ type: 'SET_FOCUS_MODELVIEW', data: { id: storedModelview.id, name: storedModelview.name } });
    }
  }, [dispatch, models, focusModel?.id])

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!focusModel?.id) return;
    window.sessionStorage.setItem(LAST_FOCUS_MODEL_STORAGE_KEY, focusModel.id);
  }, [focusModel?.id])


  const handleShowProjectModal = () => {
    // if (minimized) {
    //   setMinimized(true);
    // }
    setShowProjectModal(true);
  };

  const handleCloseProjectModal = () => setShowProjectModal(false);

  const handleSubmit = (details: any) => {
    props.onSubmit(details);
  };

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

  const projectModalDiv = (
    <Modal show={showProjectModal} onHide={handleCloseProjectModal}
      className={`projectModalOpen ${!projectModalOpen ? "d-block" : "d-none"}`} style={{ marginLeft: "200px", marginTop: "100px", backgroundColor: "#fee", zIndex: "9999" }} ref={projectModalRef}>
      <Modal.Header closeButton>GitHub Settings: </Modal.Header>
      <Modal.Body >
        <ProjectDetailsForm props={compatibilityProps} onSubmit={handleSubmit} />
      </Modal.Body>
      <Modal.Footer>
        <Button color="link" onClick={handleCloseProjectModal} >Exit</Button>
      </Modal.Footer>
    </Modal>
  );

  // Keep GitHub Settings modal closed by default; open explicitly via UI actions only.

  useEffect(() => {
    if (debug) useEfflog('163 Modelling useEffect 3 [phSource]', phSource)
    if (!phFocus?.focusRefresh?.id) return;
    doRefresh();
    if (debug) console.log('226 ', phFocus.focusModel?.name, phFocus.focusModelview?.name, phFocus?.focusRefresh?.name);
  }, [phFocus?.focusRefresh?.id])

  useEffect(() => {
    persistCurrentStateToBrowserStorage()
  }, [phData, phFocus, phSource, phUser])

  function doRefresh() { // 
    if (!debug) console.log('207 Modelling doRefresh', compatibilityProps);
    persistCurrentStateToBrowserStorage()
    setRefresh(prev => !prev)
  }

  // Function to export curmod.objects to clipboard
  const exportToClipboard = () => {
    if (curmod && curmod.objects) {
      const objectsText = curmod.objects.map(obj => ` - "${obj.id}" | "${obj.name}" | "${obj.description ? obj.description : '(empty)'}" | "(${obj.typeName})"`).join('\n').replace(/\|/g, ',') + '\n'
      const relshipsText = curmod.relships.map(rel => ` - "${rel.id}" | "${rel.name}" | "${rel.description ? rel.description : '(empty)'}" | "(${rel.typeName})"`).join('\n').replace(/\|/g, ',') + '\n';
      navigator.clipboard.writeText(`Objects: ${objectsText} \n Relships: ${relshipsText}\n`).then(() => {
        alert('Objects and relships copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy objects to clipboard: ', err);
      });
    }
  };

  if (mount) {
    if (debug) console.log('255 Modelling', metis.metamodels, metis.models, curmod, curmodview, focusModel);
    if (debug) console.log('256 Modelling', curmod, curmodview);

    const selmods = modelList.filter((m: any) => m && m?.markedAsDeleted !== true)
    
    const modelTabsDiv = (!selmods) ? <></> : selmods.map((m, index) => {
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
                paddingBottom: "5px",
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
                if (typeof window !== 'undefined') window.localStorage.setItem(LAST_FOCUS_MODEL_STORAGE_KEY, m.id);
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

    // ===================================================================
    // Divs

    const paletteDiv = // this is the div for the palette with the types tab and the objects tab
      <Palette
        key={`metamodel-palette-${runtimeRefreshKey}-${phFocus?.focusModel?.id || 'none'}`}
        myMetis={myMetis}
        metis={metis}
        phFocus={phFocus}
        dispatch={dispatch}
        modelType='metamodel'
        ref={paletteRef}
      />

    const metamodelDiv =  // this is the metamodel modelling area
      <Modeller
        key={`metamodel-${runtimeRefreshKey}-${phFocus?.focusModel?.id || 'none'}-${phFocus?.focusModelview?.id || 'none'}`}
        myMetis={myMetis}
        metis={metis}
        phData={phData}
        phFocus={phFocus}
        dispatch={dispatch}
        phUser={phUser}
        modelType='metamodel'
        phSource={phSource}
        userSettings={memoryAkmmUser}
        visibleFocusDetails={props.visibleFocusDetails}
        setVisibleFocusDetails={props.setVisibleFocusDetails}
      />

    const targetmetamodelDiv = (curmod?.targetMetamodelRef !== "")
      ?
        <TargetMeta // maybe replaced by Palette?
          // gojsModel={gojsmodel}
          // gojsMetamodel={gojsmetamodel}
          // gojsTargetMetamodel={gojstargetmetamodel}
          myMetis={myMetis}
          phFocus={phFocus}
          metis={metis}
          dispatch={dispatch}
          modelType='model'
        />
      : <></>;

    const metamodellingtabs = (
      <>
        <Nav tabs style={{ minWidth: "350px" }} >
          <span className="ms-1 me-5">
            <button
              className={`btn btn-model-toggle ms-0 me-2 d-flex align-items-center justify-content-center ${!mmToggle ? 'active' : ''}`}
              data-toggle="tooltip"
              data-placement="top"
              title="Toggle between Metamodel and Model"
              onClick={() => setMmToggle(!mmToggle)}
              aria-pressed={!mmToggle ? 'true' : 'false'}
            >
              <i className={`fa ${!mmToggle ? 'fa-layer-group' : 'fa-cubes'} me-2`} aria-hidden="true" />
              <span>{'Metamodel'}</span>
            </button>
          </span>
        </Nav>
        <TabPane tabId="1">   {/* Metamodel --------------------------------*/}
          <div className="workpad p-1 pt-2 bg-white" >
            <Row className="row" style={{ height: "100%", marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
              {palettesOpen ? (
                <Col className="col1 m-0 p-0 pl-3" xs="auto">
                  <div className="myPalette px-1 mt-0 mb-0 pt-0 pb-1" style={{ marginRight: "2px", backgroundColor: "#7ac", border: "solid 1px black" }}>
                    {paletteDiv}
                  </div>
                </Col>
              ) : (
                <Col xs="auto" className="p-0 m-0" style={{ width: '8px' }} />
              )}
              <Col className="col2" style={{ paddingLeft: "1px", marginLeft: "1px", paddingRight: "1px", marginRight: "1px" }}>
                <div className="myModeller pl-0 mb-0 pr-1" style={{ backgroundColor: "#7ac", width: "100%", border: "solid 1px black" }}>
                  {metamodelDiv}
                </div>
              </Col>
            </Row>
          </div>
        </TabPane>
      </>
    )

    const templatemodellingDiv = (
      <>
        {/* Template ------------------------------------------*/}
        {/* <TabPane tabId="0">
              <Tab /> */}
        {/* <div className="workpad p-1 pt-2 bg-white">
                  <Row >
                  <Col xs="auto m-0 p-0 pl-3">
                    <div className="myPalette pl-1 mb-1 pt-0 text-white" style={{ maxWidth: "150px", minHeight: "8vh", height: "100%", marginRight: "2px", backgroundColor: "#999", border: "solid 1px black" }}>
                      <Palette
                        // gojsModel={gojsmodel}
                        // gojsMetamodel={gojsmetamodel}
                        // gojsModelObjects={gojsmodelobjects}
                        myMetis={myMetis}
                        metis={metis}
                        phFocus={phFocus}
                        dispatch={dispatch}
                        modelType='model'
                      />
                    </div>
                    </Col>
                  <Col style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}>
                      <div className="myModeller mb-1 pl-1 pr-1" style={{ backgroundColor: "#ddd", width: "100%", height: "100%", border: "solid 1px black" }}>
                        <Modeller
                          // gojsModel={gojsmodel}
                          // gojsMetamodel={gojsmetamodel}
                          myMetis={myMetis}
                          metis={metis}
                          phData={phData}
                          phFocus={phFocus}
                          dispatch={dispatch}
                          modelType='model'
                          />
                      </div>
                    </Col>
                  </Row>
                </div>          */}
        {/* </TabPane>  */}
      </>
    )

    const modellingtabs = (
      <>
        {/* compact toggle will be placed inline inside the Nav below */}
        <Nav tabs style={{ minWidth: "50px", borderBottom: "white" }} >
          <span className="ms-1 me-2 ">
            <button
              className={`btn btn-model-toggle ms-0 me-2 d-flex align-items-center justify-content-center ${mmToggle ? 'active' : ''}`}
              data-toggle="tooltip"
              data-placement="top"
              title="Toggle between Metamodel and Model"
              onClick={() => setMmToggle(!mmToggle)}
              aria-pressed={mmToggle ? 'true' : 'false'}
            >
              <i className={`fa ${mmToggle ? 'fa-cubes' : 'fa-layer-group'} me-2`} aria-hidden="true" />
              <span>{mmToggle ? 'Model' : 'etamodel'}</span>
            </button>
          </span>
          {/* Small icon-only toggle placed between the Model button and the model tabs */}
          <button
            className="btn btn-outline-secondary btn-sm px-1 me-2 my-0 py-1 d-flex align-items-center justify-content-center"
            onClick={() => {
              const next = !palettesOpen;
              setPalettesOpen(next);
              if (modellerRef.current && typeof modellerRef.current.setVisibleAll === 'function') modellerRef.current.setVisibleAll(next);
              if (paletteRef.current && typeof paletteRef.current.setVisibleAll === 'function') paletteRef.current.setVisibleAll(next);
              if (paletteObjRef.current && typeof paletteObjRef.current.setVisibleAll === 'function') paletteObjRef.current.setVisibleAll(next);
            }}
            title="Toggle Palettes"
            aria-label="Toggle Palettes"
          >
            <i className="fa fa-columns" aria-hidden="true" />
          </button>
          {modelTabsDiv}
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
            <div className="workpad px-1 pt-1 bg-white">
              <Row className="row1 align-items-start">
                {/* Palette area */}
                <Col className="col1 m-0 p-0 pl-0" xs="auto"> {/* Objects Palette */}
                  <div className="myPalette mt-0 mb-0 pt-0 pb-1" style={{ marginRight: "0px", minHeight: "7vh", backgroundColor: "#7ac", border: "solid 1px black" }}>
                    <Palette // this is the Objects Palette area
                      key={`objects-palette-${phFocus?.focusModel?.id || 'none'}`}
                      myMetis={myMetis}
                      metis={metis}
                      phFocus={phFocus}
                      dispatch={dispatch}
                      modelType='model'
                      phUser={phUser}
                      setVisiblePalette={props.setVisiblePalette}
                      ref={paletteObjRef}
                    />
                  </div>
                </Col>
                {/* Modelling area */}
                <Col className="col2" style={{ paddingLeft: "1px", marginLeft: "1px", paddingRight: "1px", marginRight: "1px", alignSelf: "flex-start" }}>
                  <div className="myModeller pl-0 mb-0 pr-1" style={{ backgroundColor: "#acc", minHeight: "7vh", width: "100%", height: "auto", border: "solid 1px black" }}>
                    <Modeller // this is the Modeller ara
                      key={`model-${runtimeRefreshKey}-${phFocus?.focusModel?.id || 'none'}-${phFocus?.focusModelview?.id || 'none'}`}
                      myMetis={myMetis}
                      gojsSnapshot={gojsSnapshot}
                      metis={metis}
                      phData={phData}
                      phFocus={phFocus}
                      dispatch={dispatch}
                      phUser={phUser}
                      modelType='model'
                      phSource={phSource}
                      userSettings={memoryAkmmUser}
                      visibleFocusDetails={props.visibleFocusDetails}
                      setVisibleFocusDetails={props.setVisibleFocusDetails}
                      exportTab={props.exportTab}
                      ref={modellerRef}
                    />
                  </div>
                </Col>
                {/* <Col className="col3 mr-0 p-0 " xs="auto"> 
                 {(visibleContext) ? <ReportModule  props={props}/> : <></>}
                </Col> */}
                <Col className="col3 mr-0 p-0 " xs="auto"> {/* Targetmodel area */}
                  <div className="myTargetMeta px-0 mb-1 mr-3 pt-0 float-right"
                    style={{ minHeight: "89vh", height: "100%", marginRight: "0px", backgroundColor: "#8ce", border: "solid 1px black" }}>
                    {targetmetamodelDiv}
                  </div>
                </Col>
              </Row>
            </div>
          </TabPane>
        </TabContent>
      </>
    )

    const solutionModellingDiv = (
      <>
        {/* <TabContent> */}
        {/* Solution Modelling ------------------------------------*/}
        {/* <TabPane tabId="3">
              <div className="workpad p-1 pt-2 bg-white">
                <Row >
                  <Col xs="auto m-0 p-0 pr-0">
                    <div className="myTargetMeta pl-0 mb-1 pt-0 text-white float-right" style={{ minHeight: "8vh", height: "100%", marginRight: "4px", backgroundColor: "#9a9", border: "solid 1px black" }}>
                      <TargetMeta
                        gojsModel={gojsmodel}
                        gojsMetamodel={gojsmetamodel}
                        gojsTargetMetamodel={gojstargetmetamodel}
                        myMetis={myMetis}
                        metis={metis}
                        phFocus={phFocus}
                        dispatch={dispatch}
                        modelType='model'
                      />
                    </div>
                  </Col>
                  <Col style={{ paddingLeft: "1px", marginLeft: "1px",paddingRight: "1px", marginRight: "1px"}}>
                    <div className="myModeller mb-1 pt-3 pl-1 pr-1" style={{ backgroundColor: "#ddd", width: "100%", height: "100%", border: "solid 1px black" }}>

                      <TargetModeller
                        gojsModel={gojsmodel}
                        gojsTargetModel={gojstargetmodel}
                        gojsMetamodel={gojsmetamodel}
                        myMetis={myMetis}
                        metis={metis}
                        phFocus={phFocus}
                        dispatch={dispatch}
                        modelType='model'
                      />
                    </div>
                  </Col>
                </Row>
              </div>         
            </TabPane> */}
        {/* </TabContent> */}
      </>
    )

    if (debug) console.log('583 Modelling', activeTab);
    const loadjsonfile = (typeof window !== 'undefined') && <LoadJsonFile buttonLabel='OSDU Import' className='ContextModal' ph={compatibilityProps} refresh={refresh} setRefresh={setRefresh} />
    const loadgithub = (typeof window !== 'undefined') && <LoadGitHub buttonLabel='GitHub' className='ContextModal' ph={compatibilityProps} refresh={refresh} setRefresh={setRefresh} />
    const loadnewModelproject = (typeof window !== 'undefined') && <LoadNewModelProjectFromGithub buttonLabel='New Modelproject' className='ContextModal' ph={compatibilityProps} refresh={refresh} setRefresh={setRefresh} />
    const loadMetamodel = (typeof window !== 'undefined') && <LoadMetamodelFromGithub buttonLabel='Load Metamodel' className='ContextModal' ph={compatibilityProps} refresh={refresh} setRefresh={setRefresh} />
    const loadfile = (typeof window !== 'undefined') && <LoadFile buttonLabel='' className='ContextModal' ph={compatibilityProps} refresh={refresh} setRefresh={setRefresh} />
    const loadrecovery = (typeof window !== 'undefined') && <LoadRecovery buttonLabel='Recovery' className='ContextModal' ph={compatibilityProps} refresh={refresh} setRefresh={setRefresh} />

    const modellingDiv = // this is the button row and the modelling area with OSDU import and load options and Reload button
      <>
        <div className="buttonrow d-flex justify-content-between align-items-center" style={{ maxHeight: "22px", minHeight: "18px", whiteSpace: "nowrap" }}>
          <div className="d-flex justify-content-between align-items-center">
            {/* Toggle control moved below before the tabs as requested */}
            {/* <button className="btn bg-secondary py-1 pe-2 ps-1" data-bs-toggle="tooltip" data-bs-placement="top" title="Use the 'New' button in the Project-bar at top-left" 
              onClick={handleGetNewProject}
              ><i className="fab fa-github fa-lg me-2 ms-0 "></i> New Modelproject </button> */}
            <span className="btn bg-success me-1 d-flex justify-content-center align-items-center"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Load downloaded Schema from OSDU (Jsonfiles)"
              // style={{ backgroundColor: "#b0b", color: "#cdc"}} 
            >
              {/* <i className="fa fa-house-tsunami fa-lg"></i> */}
              {loadjsonfile}
            </span>
            <span
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Save and Load models (import/export) from/to files"
              style={{ whiteSpace: "nowrap", marginRight: "6px" }}
            >
              {loadfile}
            </span>
          </div>
          <span className="btn ps-auto mt-0 pt-1 text-light" onClick={doRefresh} data-toggle="tooltip" data-placement="top" title="Reload the model" > {refresh ? 'reload' : 'reload'} </span>
          {/* <span className="btn me-1 d-flex justify-content-center align-items-center bg-secondary" onClick={exportToClipboard}>
          <i className="fas fa-copy me-2"></i> Objects
          </span> */}
          {/* <span className=" m-0 px-0 bg-secondary " style={{ minWidth: "125px", maxHeight: "28px", backgroundColor: "#fff"}} > Edit selected :  </span> */}
          {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Select an Relationship and click to edit properties" > {EditFocusModalRDiv} </span>
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="Select an Object and click to edit properties" > {EditFocusModalODiv} </span>
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="Click to edit Model and Modelview properties" > {EditFocusModalMDiv} </span> */}
          {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from localStore or download/upload file" > {loadlocal} </span> */}
          {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Login to the model repository server (Firebase)" > {loginserver} </span>
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models from the model repository server (Firebase)" > {loadserver} </span> */}
          {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (download/upload) from Local Repo" > {loadgitlocal} </span> */}
          {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Recover project from last refresh" > {loadrecovery} </span> */}
          {/* <button className="btn bg-light text-primary btn-sm" onClick={toggleShowContext}>✵</button>  */}
          {/* <ProjectDetailsModal props={props} /> */}
        </div>
      </>

    const metamodellingDiv = (myMetis) &&
      <>
        <div className="buttonrow d-flex justify-content-end align-items-center me-4" style={{ maxHeight: "29px", minHeight: "30px", whiteSpace: "nowrap" }}>
          <div className="me-4">
            {/* <span className="" data-bs-toggle="tooltip" data-bs-placement="top" title="Load models from GitHub" > {loadgithub} </span> */}
            {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Load a Metamodel from GitHub" > {loadMetamodel} </span> */}
            {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Load downloaded Schema from OSDU (Jsonfiles)"  > {loadjsonfile} </span> */}
            {/* <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (import/export) from/to files" style={{ whiteSpace: "nowrap" }}> {loadfile} </span> */}
          </div>
          {/* <div className="d-flex justify-content-end align-items-center bg-light border border-2 p-1 border-solid border-primary py-1 mt-0 mx-2" style={{ minHeight: "34px" }}>
              <div className=" d-flex align-items-center me-0 pe-0">
                <i className="fa fa-folder text-secondary px-1"></i>
                <div className=""  style={{ whiteSpace: "nowrap" }}></div>
              </div>
              <div className="">
                <div className="input text-primary" style={{ maxHeight: "32px", backgroundColor: "transparent" }} data-bs-toggle="tooltip" data-bs-placement="top" title="Choose a local Project file to load">
                  <input className="select-input" type="file" accept=".json" onChange={(e) => ReadModelFromFile(props, dispatch, e)} style={{width: "380px"}}/>
                </div>
              </div>
              <button className="border border-solid border-radius-4 px-2 mx-0 py-0"
                data-toggle="tooltip" data-placement="top" data-bs-html="true"
                title="Click here to Save the Project file &#013;(all models and metamodels) to file &#013;(in Downloads folder)"
                onClick={handleSaveAllToFile}>Save
              </button>
            </div> */}
          <span className="btn px-4 me-4 py-0 ps-auto mt-0 pt-1 bg-light text-secondary"
            onClick={doRefresh} data-toggle="tooltip" data-placement="top" title="Reload the model" > {refresh ? 'reload' : 'reload'} 
          </span>
        </div>
      </>

    if (hasNoModels) {
      return <div>No models in this file.</div>;
    }

    if (!curmod) {
      return <div>Loading model data...</div>;
    }

    return ((mmToggle)
      ? (myMetis) &&
        <>
          <div className="diagramtabs pb-0" >
            {mount && (
              <>
                <div className="position-relative float-end" style={{ transform: "scale(0.8)", marginRight: "64px" }}>
                  {modellingDiv}
                </div>
                <div className="modellingContent mt-1">
                  {/* {modellingtabs} */}
                  {refresh ? <> {modellingtabs} </> : <>{modellingtabs}</>}
                </div>
              </>
            )}
          </div>
          {projectModalDiv}
        </>
      : <>
          <div className="diagramtabs pb-0 " >
            <div className="position-relative float-end" style={{ transform: "scale(0.8)", marginRight: "64px" }}>
              {metamodellingDiv}
            </div>
            <div className="modellingContent mt-1">
              {refresh ? <> {metamodellingtabs} </> : <>{metamodellingtabs}</>}
            </div>
          </div>
        </>
    )
  }
}

export default Modelling;
// export default Page(connect(state => state)(page));
