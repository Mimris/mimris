// @ts-nocheck
// modeller

import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from 'react-redux';
import useLocalStorage from '../hooks/use-local-storage'

import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import classnames from 'classnames';

import GoJSApp from "./gojs/GoJSApp";
import GoJSPaletteApp from "./gojs/GoJSPaletteApp";
import Selector from './utils/Selector'

import { SaveModelviewToSvgFile, SaveModelviewToSvgFileAuto } from "./utils/SaveModelToFile";
import { SaveAkmmUser } from "./utils/SaveAkmmUser";
import ReportModule from "./export/ReportModule";

import * as uib from '../akmm/ui_buildmodels';

import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

import { setColorsTopOSDUTypes } from "./utils/SetColorsTopOSDUTypes";
import { gojs } from "../akmm/constants";

const debug = false;

const clog = console.log.bind(console, '%c %s', // green colored cosole log
    'background: blue; color: white');
const useEfflog = console.log.bind(console, '%c %s', // green colored cosole log
    'background: red; color: white');
const ctrace = console.trace.bind(console, '%c %s',
    'background: green; color: white');

const Modeller = (props: any) => {
    if (!props.metis) return <> metis not found</>
    if (!props.myMetis?.currentModel) return <> current model not found</>

    if (!debug) console.log('39 Modeller: props', props);
    const dispatch = useDispatch();
    const [mounted, setMounted] = useState(false);
    const [showModal, setShowModal] = useState(false);


    const [refresh, setRefresh] = useState(false)
    const [activeTab, setActiveTab] = useState();
    const [ofilter, setOfilter] = useState('All')
    const [visibleObjects, setVisiblePalette] = useState(false)
    // const [visibleFocusDetails, setVisibleFocusDetails] = useState(true)
    const [isExpanded, setIsExpanded] = useState(false)
    const [inputValue, setInputValue] = useState(props.metis.name); // initial value is an empty string
    const [displayValue, setDisplayValue] = useState(props.metis.name); // the value to be displayed
    const [projectName, setProjectName] = useState(props.metis.name); // the value to be displayed
    const [mvName, setMvName] = useState(); // the value to be displayed
    const [memoryAkmmUser, setMemoryAkmmUser] = useLocalStorage('akmmUser', ''); //props);
    const [exportSvg, setExportSvg] = useState(null);
    const [diagramReady, setDiagramReady] = useState(false);
    const [selectedOption, setSelectedOption] = useState('Sorted by type');
    const [ofilteredArr, setOfilteredArr] = useState([]);

    const [gojsobjects, setGojsobjects] = useState({ nodeDataArray: [], linkDataArray: [] });
    // const [gojsmodel, setGojsmodel] = useState(props.myMetis.gojsModel);

    const diagramRef = useRef(null);

    let focusModel = props.phFocus?.focusModel
    let focusModelview = props.phFocus?.focusModelview
    let activetabindex = 0
    const models = props.metis?.models
    const model = models?.find((m: any) => m?.id === focusModel?.id)
    const modelindex = models?.findIndex((m: any) => m?.id === focusModel?.id)
    const modelviews = model?.modelviews
    const modelview = modelviews?.find((m: any) => m?.id === focusModelview?.id)
    const modelviewindex = modelviews?.findIndex((m: any, index) => index && (m?.id === focusModelview?.id))
    const metamodels = props.metis?.metamodels
    const mmodel = metamodels?.find((m: any) => m?.id === model?.metamodelRef)

    const handleShowModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);

    // const handleVisibleFocusDetails = () => { props.setVisibleFocusDetails(!props.visibleFocusDetails) }

    const handleExportSvgReady = (exportSvgFunction, isReady) => {
        setExportSvg(() => exportSvgFunction);
        setDiagramReady(isReady);
    };

    useEffect(() => { // set activTab when focusModelview.id changes
        if (debug) useEfflog('55 Modeller useEffect 1 [props.phFocus.focusModelview?.id] : ', activeTab, activetabindex, props.phFocus.focusModel?.name);
        setActiveTab(activetabindex)
    }, [props.phFocus?.focusModelview?.id])

    if (debug) console.log('102 Modeller: gojsmodel', props, gojsmodel, gojsmodel?.nodeDataArray);


    const showDeleted = props.phUser?.focusUser?.diagram?.showDeleted
    const showModified = props.phUser?.focusUser?.diagram?.showModified
    const includeDeleted = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;

    function dispatchLocalStore(locStore) {
        dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: locStore.phData })
        dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: locStore.phFocus })
        dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: locStore.phSource })
        dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: locStore.phUser })
    }

    function toggleObjects() { setVisiblePalette(!visibleObjects); }



    function toggleRefreshObjects() {
        if (debug) console.log('75 Modeller: toggleRefreshObjects', memoryLocState.phFocus);
        saveModelsToLocState(props, memoryLocState, setMemoryLocState)
        if (debug) console.log('78 Modeller: toggleRefreshObjects', props);
        if (debug) console.log('79 Modeller: toggleRefreshObjects', memoryLocState.phFocus);
        setRefresh(!refresh)
    }



    useEffect(() => {
        setRefresh(!refresh)
        if (model?.objects?.length < 500) {
            setSelectedOption('Sorted by type')
        } else {
            setSelectedOption('OSDUType')
        }
        if (mmodel?.name === 'AKM-OSDU_MM') setVisiblePalette(false)
        setMounted(true)
    }, [])

    useEffect(() => {
        const propps = {
            phData: props.phData,
            phFocus: props.phFocus,
            phUser: props.phUser,
            phSource: props.phSource,
        }
        if (debug) console.log('163 Modeller useEffect 2, props.phFocus.focusModelview?.id] : ', props.phFocus.focusModelview?.id, propps);
        if (props.userSetting) (setMemoryLocState(propps))
        // setMemoryLocState(SaveModelToLocState(propps, memoryLocState))
        const timer = setTimeout(() => {
            SaveAkmmUser(props, 'akmmUser')
        }, 250);
        return () => clearTimeout(timer);
    }, [props.phFocus?.focusObjectview?.id])

    // put current modell on top 
    const selmods = (models) ? [
        models[modelindex],
        ...models.slice(0, modelindex),
        ...models.slice(modelindex + 1, models.length)
    ]
        : []
    const selmodviews = modelviews

    if (debug) console.log('180 Modeller', mmodel, focusModelview, selmods, selmodviews);
    let selmodels = selmods?.filter((m: any) => m && (!m.markedAsDeleted))
    // let selmodelviews = selmodviews?.map((mv: any) => mv && (!mv.markedAsDeleted))
    // if (debug) console.log('48 Modeller', focusModel?.name, focusModelview?.name);

    const handleProjectChange = (event) => { // Editing project name
        if (debug) console.log('186 Modeller: handleProjectChange', event);
        setProjectName(event.target.value);
    }
    const handleProjectBlur = () => { // finish editing project name
        if (debug) console.log('190 Modeller: handleProjectChange', projectName);
        dispatch({ type: 'UPDATE_PROJECT_PROPERTIES', data: { name: projectName } }); // update project name
        // dispatch({ type: 'UPDATE_PROJECT_PROPERTIES', data: { name: displayValue } }); // update project name
        dispatch({ type: 'SET_FOCUS_PROJ', data: { id: displayValue, name: displayValue } }); // set focus project
    }

    const handleModelviewChange = (event) => { // Editing project name
        if (debug) console.log('186 Modeller: handleProjectChange', event);
        setMvName(event.target.value);
    }



    const handleModelviewBlur = () => { // finish editing project name
        if (debug) console.log('190 Modeller: handleProjectChange', displayValue);
        dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data: { name: displayValue } }); // update project name
        dispatch({ type: 'SET_FOCUS_MODELVIEW', data: { id: displayValue, name: displayValue } }); // set focus project
    }

    const handleSelectModelChange = (event: any) => { // Setting focus model
        if (debug) console.log('196 Selector', JSON.parse(event.value).name);
        const id = JSON.parse(event.value).id
        const name = JSON.parse(event.value).name
        const selObj = models.find((obj: any) => obj.id === id)
        if (debug) console.log('200 Selector', selObj);
        let data
        if (selObj && selObj.name !== 'Select ' + props.selName + '...') {
            if (debug) console.log('203 Selector', selObj.name);
            data = { id: id, name: name }
            dispatch({ type: 'SET_FOCUS_MODEL', data: data })
            const mv = selObj.modelviews[0]
            const data2 = { id: mv.id, name: mv.name }
            dispatch({ type: 'SET_FOCUS_MODELVIEW', data: data2 })
            if (debug) console.log('209 Selector', data, data2);
        }
    }

    const options = selmodels && ( //sf TODO:  modelview is mapped 2 times 
        selmodels.map((m: any, index) => (m) && (m.name !== 'Select ' + props.selName + '...') &&
            <option key={m.id + index} value={JSON.stringify({ id: m.id, name: m.name })}>{m.name}</option>)
    )

    activetabindex = (modelviewindex < 0) ? 0 : modelviewindex  // if no focus modelview, then set to 0
    // ToDo: remember last current modelview for each model, so that we can set focus to it when we come back to the that model 
    // activetabindex = (modelviewindex < 0) ? 0 : (modelviewindex) ? modelviewindex : focusModelviewIndex //selmodelviews?.findIndex(mv => mv.name === modelview?.name)
    if (debug) console.log('78 Modeller', focusModel?.name, focusModelview?.name, activetabindex);



    const handleExportClick = async () => {
        if (debug) console.log('294 handleExportClick', exportSvg);
        if (exportSvg) {
            const svg = await exportSvg();
            if (svg) {
                const svgString = new XMLSerializer().serializeToString(svg).replace(/'/g, "\\'");;
                // console.log('SVG string:', svgString);
                // Create a Blob from the SVG string
                // const blob = new Blob([svgString], { type: 'image/svg+xml' });
                const proj = props.phFocus.focusProj.name
                const model = focusModel.name
                const modelview = focusModelview?.name
                const filename = `${proj}_${model}_${modelview}`.replace(/ /g, "-")
                alert('A SVG-file of this modelview will be downloaded to your computer make sure you save it with the name: \n ' + filename + '.svg')
                SaveModelviewToSvgFile(svgString, filename)
            } else {
                console.log('SVG is not ready yet');
            }
        }
    };

    // Objects palette
    const myModel = props.myMetis?.findModel(model.id);
    let ndArr = uib.buildObjectPalette(myModel?.objects, props.myMetis)
    let ldArr = []

    const ndTypes = ndArr?.map((nd: any) => nd.typename)
    const uniqueTypes = [...new Set(ndTypes)].sort();
    const nodeArray_all = ndArr

    // if OSDU import then set fillcolor according to osduType
    nodeArray_all?.forEach((node: any) => {
        const enttypeColor = setColorsTopOSDUTypes(node.object?.osduType)
        if (enttypeColor) node.fillcolor = enttypeColor
    })
    // filter out the objects that are marked as deleted
    const objectsNotDeleted = nodeArray_all?.filter((node: { markedAsDeleted: boolean; }) => node && node.markedAsDeleted === false)
    if (debug) console.log('365 nodeArray_all', nodeArray_all, objectsNotDeleted);

    useEffect(() => {
        const initialArr = objectsNotDeleted;
        if (debug) console.log('409 Modeller ofilteredOnTypes', initialArr, uniqueTypes, selectedOption)
        if (selectedOption === 'In this modelview') {
            const objectviewsInThisModelview = modelview?.objectviews
            const objectsInThisModelview = model?.objects.filter((obj: any) => objectviewsInThisModelview?.find((ov: any) => ov?.objectRef === obj?.id))
            const mvfilteredArr = objectsInThisModelview?.map(o => initialArr?.find((node: { id: any; }) => node && (node?.typename === o?.typeName && node?.name === o?.name))).filter((node: any) => node)
            if (debug) console.log('422 Modeller ofilteredOnTypes', mvfilteredArr);
            setGojsobjects({ nodeDataArray: mvfilteredArr, linkDataArray: ldArr });
        } else if (selectedOption === 'Sorted alfabetical') {
            const sortedArr = initialArr?.sort((a: { name: string; }, b: { name: string; }) => (a.name > b.name) ? 1 : -1);
            setGojsobjects({ nodeDataArray: sortedArr, linkDataArray: ldArr });
            if (debug) console.log('417 Modeller ofilteredOnTypes', sortedArr,);
        } else if (selectedOption === 'Sorted by type') {
            const byType = uniqueTypes.map((t: any) => initialArr?.filter((node: { typename: string; }) => node && (node.typename === t)));
            const sortedByType = byType?.map(bt => bt.sort((a: { name: string; }, b: { name: string; }) => (a.name > b.name) ? 1 : -1)).flat();
            // Sort the sortedByType within each type using the node.object.osduType
            // check if the osduType is a topEntity attribute, if so then sort by the order of the topEntity attributes
            const osduTypeFound = initialArr?.find((node: { object: { osduType: string; }; }) => node && (node?.object?.osduType));
            const sortedArr = (osduTypeFound)
                ? sortedByType?.sort((a: { object: { osduType: string; }; }, b: { object: { osduType: string; }; }) => (a.object.osduType > b.object.osduType) ? 1 : -1)
                    ?.sort((a: { object: { osduType: string; }; }, b: { object: { osduType: string; }; }) => {
                        const typeOrder = {
                            'MasterData': 0,
                            'WorkProductComponent': 1,
                            'ReferenceData': 2,
                            'Abstract': 3,
                            'OSDUType': 4,
                            'Proxy': 5,
                            'Property': 6,
                            'Array': 7,
                            'Item': 8,
                        };
                        return (typeOrder[a.object.osduType] > typeOrder[b.object.osduType]) ? 1 : -1;
                    })
                : sortedByType;
            if (debug) console.log('455 Palette ofilteredOnTypes', sortedArr);
            setGojsobjects({ nodeDataArray: sortedArr, linkDataArray: ldArr });
        } else {
            const selOfilteredArr = initialArr?.filter((node: { typename: string; }) => node && (node.typename === uniqueTypes.find(ut => ut === selectedOption)));
            if (debug) console.log('417 Modeller ofilteredOnTypes', selOfilteredArr, uniqueTypes, uniqueTypes[selectedOption], selectedOption);
            // setOfilteredArr(selOfilteredArr);
            setGojsobjects({ nodeDataArray: selOfilteredArr, linkDataArray: ldArr });
            // if (debug) console.log('421 Modeller ofilteredOnTypes', selOfilteredArr,);
        }
        setRefresh(!refresh)
        // if (gojsobjects?.nodeDataArray?.length > 0) setVisiblePalette(true)
        // if (debug) console.log('433 Modeller');
    }, [selectedOption])


    const navitemDiv = (!selmodviews) ? <></> : selmodviews.map((mv, index) => {  // map over the modelviews and create a tab for each
        if (mv && !mv.markedAsDeleted) {
            const strindex = index.toString()
            const data = { id: mv.id, name: mv.name }
            const data2 = { id: Math.random().toString(36).substring(7), name: strindex + 'name' }
            // GenGojsModel(props, dispatch);
            // if (debug) console.log('90 Modeller', activeTab, activetabindex , index, strindex, data)
            return (
                <NavItem key={strindex} className="model-selection" data-toggle="tooltip" data-placement="top" data-bs-html="true"
                    title={
                        `Description: ${modelview?.description}

To change Modelview name, rigth click the background below and select 'Edit Modelview'.`
                    }>
                    <NavLink style={{ paddingTop: "0px", paddingBottom: "6px", paddingLeft: "8px", paddingRight: "8px", border: "solid px", borderBottom: "none", borderColor: "#eee gray white #eee", color: "black" }}
                        className={classnames({ active: activeTab == strindex })}
                        onClick={() => { dispatch({ type: 'SET_FOCUS_MODELVIEW', data }) }}
                    >
                        {mv.name}
                    </NavLink>
                </NavItem>
            )
        }
    })



    const handleSelectOTypes = (event: any) => {
        if (debug) console.log('495 Palette handleSelectOTypes', event.target?.value);
        setSelectedOption(event)
    }

    const SelectOTypes = (
        <>
            <select
                className="select-field mx-1 text-secondary"
                style={{ width: "98%" }}
                // value={uniqueTypes[selectedOption]}
                onChange={(e) => handleSelectOTypes(e.target.value)}
            >
                <option value="In this modelview" key="01">
                    Filter/Sort
                </option>
                <option value="In this modelview" key="02">
                    Objects in this Modelview *
                </option>
                <option value="Sorted alfabetical" key="03">
                    All Sorted Alphabetical *
                </option>
                <option value="Sorted by type" key="04">
                    All Sorted by Type *
                </option>
                {uniqueTypes.map((t: any, index) => (
                    <option key={index} value={t}>{t}</option>
                ))}
            </select>
        </>
    );

    const myMetamodel = myModel.metamodel;
    const gojsMetamodel = uib.buildGoMetaModel(myMetamodel, includeDeleted, showModified)

    const objectsTabDiv =
        <>
            <div className="workpad p-1 m-1 border" style={{ backgroundColor: "#a0caca", outline: "0", borderStyle: "none", }}>
                {/* <div className="d-flex justify-content-between"> */}
                {/* <button 
            className="btn-sm px-1 m-0 text-left " style={{ backgroundColor: "#a0caca", outline: "0", borderStyle: "none" }}
            onClick={toggleObjects} 
            data-toggle="tooltip" 
            data-placement="top" 
            title="List of all the Objects in this Model (This also include object with no Objectviews)&#013;&#013;Drag objects from here to the modelling area to include it in current Objectview"> 
            {visibleObjects ? <span> &lt;- Objects </span> : <span> -&gt;</span>}
          </button> */}
                {/* <button 
            className="btn-sm px-1 m-0 text-left " style={{ backgroundColor: "#a0caca", outline: "0", borderStyle: "none" }}
            onClick={toggleIsExpanded} 
            data-toggle="tooltip" data-placement="top" title=" &#013;&#013;"> 
            {visibleObjects ? (isExpanded) ? <span> &lt; - &gt; </span> : <span>&lt; -- &gt;</span> : <span></span>}
          </button> */}
                {/* </div> */}
                <div className="modellingtask bg-light" >
                    {SelectOTypes}
                    <div className="mmname mx-0 px-2 mb-1 bg-white text-secondary" style={{ fontSize: "16px", mimWidth: "120px" }}>{selectedOption}
                    </div>
                </div>
                <GoJSPaletteApp // this is the Objects list
                    divClassName="diagram-component-objects"
                    nodeDataArray={gojsobjects.nodeDataArray}
                    linkDataArray={gojsobjects.linkDataArray}
                    metis={props.metis}
                    myMetis={props.myMetis}
                    phFocus={props.phFocus}
                    dispatch={props.dispatch}
                    diagramStyle={{ height: "74vh" }}
                />
            </div>
        </>

    const footerButtonsDiv =
        <div className="modeller--footer-buttons d-flex justify-content-end" data-placement="top" title="Modelview footer area" >
            {/* <button className="btn btn-sm mt-0 py-0" onClick={handleExportClick} data-toggle="tooltip" data-placement="top" title="Export to Svg file"
        style={{ fontSize: "12px", maxHeight: "20px" }}>
          Export Modelview to Svg 
        </button>
      {/* <span className="btn mx-2 py-0 mt-1 pt-1 bg-light text-secondary" onClick={toggleRefreshObjects} data-toggle="tooltip" data-placement="top" title="Save current state to LocalStorage" style={{ fontSize: "12px" }}> {refresh ? 'save2memory' : 'save2memory'} </span>
      <span className="btn mx-2 py-0 mt-1 pt-1 bg-light text-secondary" onClick={loadLocalStorageModel} data-toggle="tooltip" data-placement="top" title="Get last saved from LocalStorage" style={{ fontSize: "12px" }}> {refresh ? 'getMemory' : 'getmemory'} </span> */}
            {/* <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Zoom all diagram">Zoom All</button>
      <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle relationhip layout routing">Toggle relationship layout</button>
      <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle relationhip show relship name">Toggle relationships name</button>
      <button className="btn-sm bg-transparent text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Zoom to objectview in focus">Zoom to Focus</button> */}
            {/* <button className="btn btn-sm bg-secondary mt-1 py-0 mx-2 px-2 "
        data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle show/ hide modified object/relship-views" style={{ fontSize: "12px" }}
        onClick={() => {
          dispatch({ type: 'SET_USER_SHOWMODIFIED', data: !showModified });
          dispatch({ type: 'SET_FOCUS_REFRESH', data: { id: Math.random().toString(36).substring(7), name: 'name' } })
        }} > {(showModified) ? ' Hide modified' : 'Show modified'}
      </button> */}
            {/* <button className="btn btm-sm bg-secondary mt-0 py-0"
        data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Toggle show/ hide deleted object/relship-views" style={{ fontSize: "12px" }}
        style={{ fontSize: "12px", maxHeight: "20px" }}
        onClick={() => {
          dispatch({ type: 'SET_USER_SHOWDELETED', data: !showDeleted }); setRefresh(!refresh)
          // dispatch({ type: 'SET_FOCUS_REFRESH', data: { id: Math.random().toString(36).substring(7), name: 'name' } })
        }} > {(showDeleted) ? ' Show deleted' : 'Hide deleted'}
      </button> */}
            {/* <button className="btn-sm text-muted py-0" data-toggle="tooltip" data-placement="top" data-bs-html="true" title="&#013;"></button> */}
        </div>

    const modelviewTabDiv = // this is the modelview tabs
        <>
            <Nav tabs > {/* objects  */}
                <button className="btn btn-sm bg-transparent text-light"
                    data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Open Modeller left sidepanel with the Object-list!"
                    onClick={toggleObjects}
                >
                    {(visibleObjects)
                        ? <span className="fs-8"><i className="fa fa-lg fa-angle-left  pull-right-container me-1"></i>Objects </span>
                        : <span className="fs-8"><i className="fa fa-lg fa-angle-right pull-right-container me-1"></i>Objects </span>
                    }
                </button>
                {navitemDiv} {/* modelviewtabs  */}
                <NavItem > {/* ?  */}
                    <button className="btn p-2 border-white text-white float-right" data-toggle="tooltip" data-placement="top" data-bs-html="true"
                        title=" Modelling:&#013;Insert an Object: Click on an Object Type in the Palette (the left) and drag and drop it into the Modelling area below.&#013;&#013;
                    Connect two objects: &#013;Position the cursor on on the edge of one object (An arrow appears) and drag and drop to another object to make a relationshop between them."
                        style={{ background: "#aaccdd" }}> ?
                    </button>
                </NavItem>
                <button className="btn  btn-sm bg-transparent text-light ms-auto me-0"
                    data-toggle="tooltip" data-placement="top" data-bs-html="true" title="Open Modeller right sidepanel with Object details!"
                    onClick={() => typeof props.setVisibleFocusDetails === 'function' && props.setVisibleFocusDetails(!props.visibleFocusDetails)}
                >
                    {(props.visibleFocusDetails)
                        ? <span className="fs-8">Object Details<i className="fa fa-lg fa-angle-left  pull-right-container ms-1"></i> </span>
                        : <span className="fs-8">Object Details<i className="fa fa-lg fa-angle-right pull-right-container ms-1"></i></span>
                    }
                </button>
            </Nav>
            <TabContent className="bg-white p-0 m-0 border border-white">
                <TabPane className="">
                    <Row className="m-1 rounded" style={{ backgroundColor: "#a0caca", outline: "0", borderStyle: "none" }}>
                        {(visibleObjects)
                            ? <><Col className="p-0 m-0 my-0" xs="auto"><div className="btn-horizontal bg-light" style={{ fontSize: "10px" }}></div>{objectsTabDiv}</Col> </>
                            : <></>
                        }
                        <Col className="me-2 my-1 p-1 border" xe="auto" >
                            <div className="workpad bg-white border-light mt-0 pe-0">
                                {/* {props.myMetis.gojsModel.nodes[0].name} */}
                                <GoJSApp
                                    nodeDataArray={props.myMetis.gojsModel.nodes}
                                    linkDataArray={props.myMetis.gojsModel.links}
                                    metis={props.metis}
                                    myMetis={props.myMetis}
                                    phFocus={props.phFocus}
                                    dispatch={props.dispatch}
                                    modelType={props.phFocus.focusTab}
                                    onExportSvgReady={handleExportSvgReady}
                                    diagramStyle={{ height: "77vh" }}
                                />
                            </div>
                            <div className="smaller-div m-0 p-0">{footerButtonsDiv}</div>
                        </Col>
                        <Col className="me-1 my-1 p-1 border " xs="auto" >
                            <div className="" style={{ backgroundColor: "#cdd" }}>
                                {(!props.visibleFocusDetails) ?
                                    <ReportModule props={props} reportType="object" edit={true} modelInFocusId={props.phFocus.focusModel?.id} edit={true} setVisibleFocusDetails={props.setVisibleFocusDetails} />
                                    : <></>
                                }
                            </div>
                        </Col>
                    </Row>
                </TabPane>
            </TabContent>
        </>

    const metamodelTabDiv =
        <>
            <div className="workpad">
                <GoJSApp
                    nodeDataArray={gojsMetamodel?.nodes}
                    linkDataArray={gojsMetamodel.links}
                    metis={props.metis}
                    myMetis={props.myMetis}
                    phFocus={props.phFocus}
                    dispatch={props.dispatch}
                    modelType={props.phFocus.focusTab}
                    onExportSvgReady={handleExportSvgReady}
                    diagramStyle={{ height: "77vh" }}
                />
            </div>
        </>
    if (debug) console.log('372 Modeller ', props.modelType)

    const modellerDiv =
        (props.modelType === 'model')
            ? // modelling
            <div className="modeller-workarea w-100" >
                <div className="modeller--workarea-objects m-1" >
                    {modelviewTabDiv}
                </div>
                <Modal show={showModal} onHide={handleCloseModal} style={{ marginLeft: "200px", marginTop: "50px", backgroundColor: "#acc" }} >
                    <Modal.Header closeButton>
                        <Modal.Title>Report Module</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="bg-transparent">
                        <ReportModule props={props} reportType="object" modelInFocusId={props.phFocus.focusModel?.id} edit={true} />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div >
            : // metamodelling
            <div className="modeller-workarea w-100" > {/*data-placement="top" title="Modelling workarea" > */}
                <div className="modeller--topbar mt-1 p-0">
                    <span className="modeller--heading float-left text-dark m-0 p-0 ms-2 mr-2 fs-6 fw-bold lh-2" style={{ minWidth: "8%" }}>Meta Model</span>
                    <div className="">
                    </div>
                    <div>
                        {metamodelTabDiv}
                    </div>
                </div>
                <div className="">
                    {footerButtonsDiv}
                </div>
            </div>

    return (
        <div className="" style={{ display: 'flex', flexDirection: 'row' }} >
            {refresh ? <> {modellerDiv} </> : <>{modellerDiv}</>}
        </div>
    )
}

export default Modeller;



