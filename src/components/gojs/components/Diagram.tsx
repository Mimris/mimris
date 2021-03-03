// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;

import * as go from 'gojs';
import { produce } from 'immer';
import { ReactDiagram } from 'gojs-react';
import * as React from 'react';
import Select, { components } from "react-select"
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Breadcrumb } from 'reactstrap';
// import * as ReactModal from 'react-modal';
// import Popup from 'reactjs-popup';
//import 'reactjs-popup/dist/index.css';
import { SelectionInspector } from '../components/SelectionInspector';
import * as akm from '../../../akmm/metamodeller';
import * as gjs from '../../../akmm/ui_gojs';
import * as gql from '../../../akmm/ui_graphql';
import * as uic from '../../../akmm/ui_common';
import * as gen from '../../../akmm/ui_generateTypes';
import * as utils from '../../../akmm/utilities';
import * as constants from '../../../akmm/constants';
const glb = require('../../../akmm/akm_globals');
const printf = require('printf');
const RegexParser = require("regex-parser");
//import * as uic from '../../../Server/src/akmm/ui_common'; 

import { GuidedDraggingTool } from '../GuidedDraggingTool';
import LoadLocal from '../../../components/LoadLocal'
import { FaTumblrSquare } from 'react-icons/fa';
// import * as svgs from '../../utils/SvgLetters'
import svgs from '../../utils/Svgs'
import { isNullOrUndefined } from 'util';
import { setMyMetisParameter } from '../../../actions/actions';
import { iconList } from '../../forms/selectIcons';
// import { stringify } from 'querystring';
// import './Diagram.css';
// import "../../../styles/styles.css"

const AllowTopLevel = true;

// const PopupExample = () => (
//   <Popup trigger={<button> Trigger</button>} position="right center">
//     <div>Popup content here !!</div>
//   </Popup>
// );

interface DiagramProps {
  nodeDataArray:      Array<go.ObjectData>;
  linkDataArray:      Array<go.ObjectData>;
  modelData:          go.ObjectData;
  myMetis:            akm.cxMetis;
  dispatch:           any;  
  skipsDiagramUpdate: boolean;
  onDiagramEvent:     (e: go.DiagramEvent) => void;
  onModelChange:      (e: go.IncrementalData) => void;
}

interface DiagramState {
  showModal: boolean;
  selectedData: any;
  modalContext: any;
  selectedOption: any;
}


export class DiagramWrapper extends React.Component<DiagramProps, DiagramState> {
  // Maps to store key -> arr index for quick lookups
  private mapNodeKeyIdx: Map<go.Key, number>;
  private mapLinkKeyIdx: Map<go.Key, number>;

  /**
   * Ref to keep a reference to the Diagram component, which provides access to the GoJS diagram via getDiagram().
   */
  private diagramRef: React.RefObject<ReactDiagram>;

  /** @internal */
  constructor(props: DiagramProps) {
    super(props);

    this.myMetis = props.myMetis;
    this.diagramRef = React.createRef(); 
    this.state = { 
      showModal: false,
      selectedData: null, 
      modalContext: null,
      selectedOption: null
    };
    // init maps
    this.mapNodeKeyIdx = new Map<go.Key, number>();
    this.mapLinkKeyIdx = new Map<go.Key, number>();

    this.initDiagram = this.initDiagram.bind(this);
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSelectDropdownChange = this.handleSelectDropdownChange.bind(this);
}
  /**
   * Get the diagram reference and add any desired diagram listeners.
   * Typically the same function will be used for each listener, with the function using a switch statement to handle the events.
   */
  public componentDidMount() { 
    if (!this.diagramRef.current) return;
    const diagram = this.diagramRef?.current?.getDiagram();
    if (diagram instanceof go.Diagram) {
      diagram.addDiagramListener('TextEdited', this.props.onDiagramEvent);
      diagram.addDiagramListener('SelectionMoved', this.props.onDiagramEvent);
      diagram.addDiagramListener('SelectionCopied', this.props.onDiagramEvent);
      //diagram.addDiagramListener('SelectionDeleted', this.props.onDiagramEvent);
      diagram.addDiagramListener('SelectionDeleting', this.props.onDiagramEvent);
      diagram.addDiagramListener('ExternalObjectsDropped', this.props.onDiagramEvent);
      diagram.addDiagramListener('LinkDrawn', this.props.onDiagramEvent);
      diagram.addDiagramListener('LinkRelinked', this.props.onDiagramEvent);
      diagram.addDiagramListener('SelectionDeleted', this.props.onDiagramEvent);
      diagram.addDiagramListener('ClipboardChanged', this.props.onDiagramEvent);
      diagram.addDiagramListener('ClipboardPasted', this.props.onDiagramEvent);
      diagram.addDiagramListener('ObjectSingleClicked', this.props.onDiagramEvent);
      diagram.addDiagramListener('ObjectDoubleClicked', this.props.onDiagramEvent);
      diagram.addDiagramListener('PartResized', this.props.onDiagramEvent);
      diagram.addDiagramListener('BackgroundDoubleClicked', this.props.onDiagramEvent);

      diagram.addModelChangedListener(this.props.onModelChange);
    }
  }

  /**
   * Get the diagram reference and remove listeners that were added during mounting.
   */
  public componentWillUnmount() {
    if (!this.diagramRef.current) return;
    const diagram = this.diagramRef.current.getDiagram();
    if (diagram instanceof go.Diagram) {
      diagram.removeDiagramListener('TextEdited', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionMoved', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionCopied', this.props.onDiagramEvent);
      //diagram.removeDiagramListener('SelectionDeleted', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionDeleting', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ExternalObjectsDropped', this.props.onDiagramEvent);
      diagram.removeDiagramListener('LinkDrawn', this.props.onDiagramEvent);
      diagram.removeDiagramListener('LinkRelinked', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionDeleted', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ClipboardChanged', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ClipboardPasted', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ObjectSingleClicked', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ObjectDoubleClicked', this.props.onDiagramEvent);
      diagram.removeDiagramListener('PartResized', this.props.onDiagramEvent);
      diagram.removeDiagramListener('BackgroundDoubleClicked', this.props.onDiagramEvent);

      diagram.removeChangedListener(this.props.onModelChange);

    }
  }

  public handleOpenModal(node, modalContext) {
    this.setState({ 
      selectedData: node,
      modalContext: modalContext,
      selectedOption: null,
      showModal: true
    });
    if (debug) console.log('161 Diagram', node, this.state);
  } 

  isPropIncluded(k: string, type: akm.cxType): boolean {
    let retVal = true;
    if (k === 'id') retVal = false;
    if (k === 'class') retVal = false;
    if (k === 'category') retVal = false;
    if (k === 'abstract') retVal = false;
    if (k === 'nameId') retVal = false;
    if (k === 'fs_collection') retVal = false;
    if (k === 'parent') retVal = false;
    if (k === 'parentModel') retVal = false;
    if (k === 'object') retVal = false;
    if (k === 'relship') retVal = false;
    if (k === 'type') retVal = false;
    if (k === 'typeRef') retVal = false;
    if (k === 'typeview') retVal = false;
    if (k === 'typeviewRef') retVal = false;
    if (k === 'group') retVal = false;
    if (k === 'isGroup') retVal = false;
    if (k === 'groupLayout') retVal = false;
    if (k === 'objectRef') retVal = false;
    if (k === 'fromObject') retVal = false;
    if (k === 'toObject') retVal = false;
    if (k === 'fromobjectRef') retVal = false;
    if (k === 'toobjectRef') retVal = false;
    if (k === 'toobjectRef') retVal = false;
    if (k === 'relshipRef') retVal = false;
    if (k === 'toObjviewRef') retVal = false;
    if (k === 'fromObjviewRef') retVal = false;
    if (k === 'viewkind') retVal = false;
    if (k === 'relshipkind') retVal = false;
    if (k === 'valueset') retVal = false;
    if (k === 'inputrels') retVal = false;
    if (k === 'outputrels') retVal = false;
    if (k === 'allProperties') retVal = false;
    if (k === 'propertyValues') retVal = false;
    if (k === 'objectviews') retVal = false;
    if (k === 'relshipviews') retVal = false;
    if (k === 'isCollapsed') retVal = false;
    if (k === 'visible') retVal = false;
    if (k === 'deleted') retVal = false;
    if (k === 'modified') retVal = false;
    if (k === 'defaultValue') retVal = false;
    if (k === 'allowedValues') retVal = false;
    if (k === 'currentTargetModelview') retVal = false;
    if (k === 'pasteViewsOnly') retVal = false;
    if (k === 'deleteViewsOnly') retVal = false;
    if (k === 'layer') retVal = false;
    if (k === 'loc') retVal = false;
    if (k === 'size') retVal = false;
    if (k === 'modeltype') retVal = false;
    if (k === 'metamodelRef') retVal = false;
    if (k === 'targetMetamodelRef') retVal = false;
    if (k === 'sourceModelRef') retVal = false;
    if (k === 'targetModelRef') retVal = false;
    if (k === 'isTemplate') retVal = false;
    if (k === 'isMetamodel') retVal = false;
    if (type?.name !== 'ViewFormat') {
      if (k === 'viewFormat') retVal = false;
    }
    if (type?.name !== 'InputPattern') {
      if (k === 'inputPattern') retVal = false;
    }
    return retVal;
  }
  
  public handleCloseModal() {
    if (debug) console.log('232 state', this.state.selectedData);
    const what = this.state.modalContext.what;
    const myDiagram = this.state.modalContext.myDiagram;
    const myMetis = this.props.myMetis;
    if (debug) console.log('236 state', myMetis);
    // Prepare for dispatches
    const modifiedObjTypeviews = new Array();    
    const modifiedRelTypeviews = new Array();    
    const modifiedObjviews     = new Array();    
    const modifiedRelviews     = new Array();    
    const modifiedObjects      = new Array();    
    const modifiedRelships     = new Array();    
    switch(what) {
      case "editObject": {
        const node = this.state.selectedData;
        if (debug) console.log('247 node', node);
        const data = node.data;
        for (let k in data) {
          if (!this.isPropIncluded(k)) 
            continue;
          let obj = data.object;
          obj = myMetis.findObject(obj.id);
          myDiagram.model.setDataProperty(data, k, obj[k]);
          const gqlObject = new gql.gqlObject(obj);
          if (debug) console.log('253 gqlObject', gqlObject);
          modifiedObjects.push(gqlObject);
          const gqlObjview = new gql.gqlObjectView(node.data.objectview);
          gqlObjview.name = gqlObject.name;
          if (debug) console.log('261 gqlObjview', gqlObjview);
          modifiedObjviews.push(gqlObjview);
        }
        modifiedObjects.map(mn => {
          let data = mn;
          this.props.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
        })
        modifiedObjviews.map(mn => {
          let data = mn;
          if (debug) console.log('265 gqlObjview', data);
          this.props.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
        })
        if (debug) console.log('277 selObj', this.state.selectedData, node);
      break;
      }
      case "editRelationship": {
        const rel = this.state.selectedData;
        const type = rel.type;
        const link = myDiagram.findLinkForKey(rel.key);
        if (!link)
          break;
        if (debug) console.log('277 link', link);
        const data = link.data;
        for (let k in data) {
          if (!this.isPropIncluded(k, type)) 
            continue;

          myDiagram.model.setDataProperty(data, k, rel[k]);
          const gqlRelship = new gql.gqlRelationship(link.data.relship);
          if (debug) console.log('285 gqlRelship', gqlRelship);
          modifiedRelships.push(gqlRelship);
          modifiedRelships.map(mn => {
            let data = mn;
            this.props.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
          })
          const gqlRelview = new gql.gqlRelshipView(link.data.relshipview);
          gqlRelview.name = gqlRelship.name;
          if (debug) console.log('293 gqlRelview', gqlRelview);
          modifiedRelviews.push(gqlRelview);
          modifiedRelviews.map(mn => {
            let data = mn;
            if (debug) console.log('297 gqlRelview', data);
            this.props.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
          })
        }
        break;
      }
      case "editObjectview": {
        let selObjview = this.state.selectedData;
        if (debug) console.log('312 selObjview', selObjview);
        const objview = selObjview.objectview;
        if (!objview)
          break;
        const objtypeview = objview.typeview;
        let data;
        if (debug) console.log('318 objview, objtypeview', selObjview, objview, objtypeview);
        const node = myDiagram.findNodeForKey(selObjview.key);
        data = node.data;
        const gqlObjview = new gql.gqlObjectView(objview);
        if (debug) console.log('322 gqlObjview', data, gqlObjview);
        modifiedObjviews.push(gqlObjview);
        modifiedObjviews.map(mn => {
          let data = mn;
          if (!debug) console.log('326 data', data);
          this.props.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
        })
      for (let prop in objtypeview?.data) {
          if (prop === 'figure' && objview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, objview[prop]);
          if (prop === 'fillcolor' && objview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, objview[prop]);
          if (prop === 'strokecolor' && objview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, objview[prop]);
          if (prop === 'strokewidth' && objview[prop] !== "")
            myDiagram.model.setDataProperty(data, prop, objview[prop]);
          if (prop === 'icon' && objview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, objview[prop]);
        }
        break;
      }
      case "selectDropdown": {
        const objview = this.state.selectedData;
        if (debug) console.log('241 data, objview', objview, this.state.selectedData, this.state.modalContext);
        if (this.state.modalContext.title === 'Select Icon') {
          
          const node = myDiagram.findNodeForKey(objview.key);
          if (debug) console.log('238 node', node);
          const data = node.data;
          const gqlObjview = new gql.gqlObjectView(objview);
          if (!debug) console.log('243 gqlObjview', data, gqlObjview);
          modifiedObjviews.push(gqlObjview);
          modifiedObjviews.map(mn => {
            let data = mn;
            this.props.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
          })
          for (let prop in objview?.data) {
            if (prop === 'icon' && objview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, objview[prop]);
          }
        }
        break;
      }
      case "editRelshipview": {
        let data = this.state.selectedData;
        const relview = data.relshipview;
        if (!relview)
          break;
        const reltypeview = relview.typeview;
        if (debug) console.log('362 relview, reltypeview', data, relview, reltypeview);
        const link = myDiagram.findLinkForKey(data.key);
        data = link.data;
        const gqlRelview = new gql.gqlRelshipView(relview);
        if (debug) console.log('365 data, gqlRelview', link, data, gqlRelview);
        modifiedRelviews.push(gqlRelview);
        modifiedRelviews.map(mn => {
          let data = mn;
          this.props.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
        })
        for (let prop in reltypeview?.data) {
          if (prop === 'strokecolor' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'strokewidth' && relview[prop] !== "")
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'dash' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'fromArrow' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'fromArrowColor' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'toArrow' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
          if (prop === 'toArrowColor' && relview[prop] !== "") 
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
        }
        break;
      }
      case "editTypeview": {   
        let selObj = this.state.selectedData; 
        let data, typeview;
        if (selObj.category === 'Object') {
          const node = myDiagram.findNodeForKey(selObj.key);
          data = node.data;
          if (debug) console.log('284 objtypeview, data', data);
          typeview = data.objectview.typeview;
          typeview = myMetis.findObjectTypeView(typeview.id);
          const gqlObjtypeview = new gql.gqlObjectTypeView(typeview);
          if (debug) console.log('287 gqlObjtypeview', gqlObjtypeview);
          modifiedObjTypeviews.push(gqlObjtypeview);
          modifiedObjTypeviews.map(mn => {
            let data = mn;
            this.props.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
          })
        }
        if (selObj.category === 'Relationship') {
          const link = myDiagram.findLinkForKey(selObj.key);
          data = link.data;
          typeview = data.relshipview.typeview;
          typeview = myMetis.findRelationshipTypeView(typeview.id);
          if (debug) console.log('294 reltypeview, link', typeview, link);
          const gqlReltypeview = new gql.gqlRelshipTypeView(typeview);
          if (debug) console.log('296 gqlReltypeview', gqlReltypeview);
          modifiedRelTypeviews.push(gqlReltypeview);
          modifiedRelTypeviews.map(mn => {
            let data = mn;
            this.props.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
          })
        }
        if (data) {
          for (let prop in typeview) {
            if (prop === 'figure' && typeview[prop] !== "") 
              myDiagram.model.setDataProperty(data, prop, typeview[prop]);
            if (prop === 'fillcolor' && typeview[prop] !== "") 
              myDiagram.model.setDataProperty(data, prop, typeview[prop]);
            if (prop === 'strokecolor' && typeview[prop] !== "") 
              myDiagram.model.setDataProperty(data, prop, typeview[prop]);
            if (prop === 'strokewidth' && typeview[prop] !== "")
              myDiagram.model.setDataProperty(data, prop, typeview[prop]);
            if (prop === 'icon' && typeview[prop] !== "") 
              myDiagram.model.setDataProperty(data, prop, typeview[prop]);
            if (prop === 'dash' && typeview[prop] !== "") 
              myDiagram.model.setDataProperty(data, prop, typeview[prop]);
            if (prop === 'fromArrow' && typeview[prop] !== "") 
              myDiagram.model.setDataProperty(data, prop, typeview[prop]);
            if (prop === 'toArrow' && typeview[prop] !== "") 
              myDiagram.model.setDataProperty(data, prop, typeview[prop]);
            if (prop === 'fromArrowColor' && typeview[prop] !== "") 
              myDiagram.model.setDataProperty(data, prop, typeview[prop]);
            if (prop === 'toArrowColor' && typeview[prop] !== "") 
              myDiagram.model.setDataProperty(data, prop, typeview[prop]);
          }
        }
        break;
      }
      // case "editProject": {
      //   const project = this.state.selectedData;
      //   if (debug) console.log('323 myMetis', myMetis);
      //   break;
      // }
      // case "editModel": {
      //   const model = this.state.selectedData;
      //   if (debug) console.log('327 obj', model);
      //   break;
      // }
      // case "editModelview": {
      //   const mview = this.state.selectedData;
      //   if (debug) console.log('331 modelview', mview);
      //   break;
      // }
      // Handle all the dispatches
      modifiedObjTypeviews.map(mn => {
        let data = mn;
        this.props.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
      })

    }
    this.setState({ showModal: false });
    if (debug) console.log('476 state', this.state);
  }
  
  public handleSelectDropdownChange = (selected) => {
    const myMetis = this.myMetis;
    const myGoModel = myMetis.gojsModel;
    const context = {
      "myMetis":      myMetis,
      "myMetamodel":  myMetis.currentMetamodel,
      "myModel":      myMetis.currentModel,
      "myModelView":  myMetis.currentModelview,
      "myDiagram":    myMetis.myDiagram
    }
    const modalContext = this.state.modalContext;
    const selectedOption = selected.value;
    if (debug) console.log('331 this.state', selectedOption, this.state, modalContext);
    // let typeview, typename, metamodelName;
    switch(modalContext.case) {

      case "Change Object type":    
        typename = (selectedOption) && selectedOption;
        const node = myMetis.currentNode;
        typeview = node.typeview;
        const objtype = myMetis.findObjectTypeByName(typename);
        if (debug) console.log('189 objtype', objtype);
        const objview = (objtype) && uic.setObjectType(node, objtype, context);
        if (debug) console.log('193 objview', objview, node, myMetis);
        const n = myMetis.myDiagram.findNodeForKey(node.key);
        const data = n.data;
        myMetis.myDiagram.model.setDataProperty(data, "typename", typename);
        myMetis.myDiagram.requestUpdate();
        break;


      case "Change Icon":    
        const icon = (selectedOption) && selectedOption;
        const inode = myMetis.currentNode;
        const icn = myMetis.myDiagram.findNodeForKey(inode.key);
        const idata = icn.data;
        myMetis.myDiagram.model.setDataProperty(idata, "icon", icon);
        myMetis.myDiagram.requestUpdate();
        break;


      case "New Model":    
        console.log('351', selected);
        const refMetamodelName = (selectedOption) && selectedOption;
        const refMetamodel = myMetis.findMetamodelByName(refMetamodelName);
        
        // myMetis.currentTargetMetamodel = targetMetamodel
        // myMetis.currentModel.targetMetamodelRef = targetMetamodel.id
        if (debug) console.log('352 Diagram', refMetamodel, myMetis);
        // let mmdata = myMetis.currentModel;
        // if (debug) console.log('357 Diagram', mmdata);        
        // myMetis.myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: {mmdata} })
        break;

      case "Set Target Model":    
        const modelName = (selectedOption) && selectedOption;
        const targetModel = myMetis.findModelByName(modelName);
        myMetis.currentTargetModel = targetModel
        myMetis.currentModel.targetModelRef = targetModel.id
        if (debug) console.log('352 Diagram', targetModel, myMetis);
        const mdata = new gql.gqlModel(myMetis.currentModel, true);
        if (debug) console.log('357 Diagram', mdata);        
        myMetis.myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: mdata })
        break;

      case "Set Target Metamodel":    
        const metamodelName = (selectedOption) && selectedOption;
        const targetMetamodel = myMetis.findMetamodelByName(metamodelName);
        myMetis.currentTargetMetamodel = targetMetamodel
        myMetis.currentModel.targetMetamodelRef = targetMetamodel.id
        if (debug) console.log('542 Diagram', targetMetamodel, myMetis);
        const mmdata = new gql.gqlModel(myMetis.currentModel, true);
        if (debug) console.log('544 Diagram', mmdata);        
        myMetis.myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: mmdata })
        break;
      case "Change Relationship type":    
        const typename = (selectedOption) && selectedOption;
        const link = myMetis.currentLink;
        typeview = link.typeview;
        let fromNode = myGoModel?.findNode(link.from);
        let toNode   = myGoModel?.findNode(link.to);
        if (debug) console.log('202 from and toNode', fromNode, toNode);
        let fromType = fromNode?.objecttype;
        let toType   = toNode?.objecttype;
        fromType = myMetis.findObjectType(fromType?.id);
        toType   = myMetis.findObjectType(toType?.id);
        if (debug) console.log('207 link', fromType, toType);
        const reltype = myMetis.findRelationshipTypeByName2(typename, fromType, toType);
        if (debug) console.log('209 reltype', reltype, fromType, toType);
        const relview = (reltype) && uic.setRelationshipType(link, reltype, context);
        if (debug) console.log('212 relview', relview);
        myMetis.myDiagram.requestUpdate();
        break;
      case "Edit Attribute":
        const propname = selected.value;
        if (debug) console.log('197 propname', propname);
        if (propname && propname.length > 0) {
          const node = myMetis.currentNode;
          const link = myMetis.currentLink;
          let inst = null;
          let defValue = "";
          if (node) {
            inst = node?.object;
          } else {
            inst = link?.relship;
            if (!inst) {
                inst = link?.reltype;
            }
          }
          if (!inst) 
              break;
          defValue = inst[propname];
          const value = prompt('Enter value of ' + propname, defValue);
          if (value) {
            if (debug) console.log('236', propname, value);
            if (propname === 'description') {
              inst.description = value;
            } else {
              console.log('240 prop, value', propname, value);
              inst[propname] = value;
            }
            switch(inst.category) {
            case 'Relationship':
              inst = myMetis.findRelationship(inst.id);
              inst[propname] = value;
              if (debug) console.log('245 inst', inst);
              const modifiedRelships = new Array();
              const gqlRel = new gql.gqlRelationship(inst);
              if (debug) console.log('248 inst, gqlRel', inst, gqlRel);
              modifiedRelships.push(gqlRel);
              modifiedRelships?.map(mn => {
                let data = (mn) && mn
                myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
              });
              break;
            case 'Relationship type':
              inst = myMetis.findRelationshipType(inst.id);
              if (propname === 'cardinality') {
                const patt = '\\b(n|[0-9])\\b[-]\\b(n|[1-9])\\b';
                const regex = new RegexParser(patt);
                console.log('710 regex:', regex, value);
                if (!regex.test(value)) {
                  alert('Value: ' + value + ' IS NOT valid');
                  break;
                }
              }
              inst[propname] = value;
              if (debug) console.log('256 inst', inst);
              const modifiedReltypes = new Array();
              const gqlRelType = new gql.gqlRelationshipType(inst);
              if (debug) console.log('259 inst, gqlRel', inst, gqlRelType);
              modifiedReltypes.push(gqlRelType);
              modifiedReltypes?.map(mn => {
                let data = (mn) && mn
                myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
              });
              break;
            }
          }
        }
        break;
      default:
        break;
    }
  }

  public handleInputChange(propname: string, value: string, fieldtype: string, obj: any, context: any, isBlur: boolean) {
    if (debug) console.log('538 GoJSApp handleInputChange:', propname, value, obj, context, isBlur);
    if (debug) console.log('539 this.state', this.state);
    this.setState(
      produce((draft: AppState) => {
        let data = draft.selectedData as any;  // only reached if selectedData isn't null
        if (debug) console.log('543 data', data, this);
        // if (data[propname] = 'icon' && value.includes("fakepath")) {
        //   data[propname] = context.files[0];
        // } else {
          data[propname] = value;
        // }
        if (debug) console.log('545 data', data[propname], value);
        if (isBlur) {
          const key = data.key;
          if (debug) console.log('548 key', key);
          if (obj.category === 'Object') {
            const idx = this.mapNodeKeyIdx.get(key);
            if (idx !== undefined) {
              draft.nodeDataArray[idx] = data;
              draft.skipsDiagramUpdate = false;
            }
          }
          if (obj.category === 'Relationship') {  
            const idx = this.mapLinkKeyIdx.get(key);
            if (idx !== undefined) {
              draft.linkDataArray[idx] = data;
              draft.skipsDiagramUpdate = false;
            }
          } 
        }
      })
    );
    if (debug) console.log('566 state', this.state);
    if (debug) console.log('567 GoJSApp handleInputChange:', propname, value, obj, context, isBlur);
    const myMetis = this.myMetis;
    // const myDiagram = context.myDiagram;
    let inst, instview, myInst, myInstview, myItem;
    // Handle objects
    if (obj.category === 'Object') {
      const node = obj;
      inst = node.object;
      myInst = myMetis.findObject(inst.id);
      instview = node.objectview;
      myInstview = myMetis.findObjectView(instview?.id);
      if (debug) console.log('573 myInst', myInst, myInstview);
      if (context?.what === "editObjectview") {
          myItem = myInstview;
      } else if (context?.what === "editTypeview") {
          myItem = myInst.type?.typeview.data;
          if (debug) console.log('580 editTypeview', myItem);
      } else {
          myItem = myInst;
      }
      myItem[propname] = value;
    }
    // Handle relationships
    if (obj.category === 'Relationship') {
        const link = obj;
        inst = link.relship;
        myInst = myMetis.findRelationship(inst.id);
        instview = link.relshipview;
        myInstview = myMetis.findRelationshipView(instview.id);    
        if (debug) console.log('596 myInst', myInst, myInstview);
        if (context?.what === "editRelshipview") 
            myItem = myInstview;
        else if (context?.what === "editTypeview") 
            myItem = myInst.type?.typeview.data;
        else
            myItem = myInst;
        myItem[propname] = value;
        if (debug) console.log('604 myItem', myItem);
      
      if (debug) console.log('606 myMetis', myMetis);
    }
  }

  /**
   * Diagram initialization method, which is passed to the ReactDiagram component.
   * This method is responsible for making the diagram and initializing the model, any templates,
   * and maybe doing other initialization tasks like customizing tools.
   * The model's data should not be set here, as the ReactDiagram component handles that.
   */

  private initDiagram(): go.Diagram {
    // console.log('141 this', this);
    const $ = go.GraphObject.make;
    // go.GraphObject.fromLinkableDuplicates = true;
    // go.GraphObject.toLinkableDuplicates   = true;
    let defPattern = "";
    // define myDiagram
    let myDiagram;
    const myMetis = this.myMetis;
    if (myMetis) {
      myMetis.deleteViewsOnly = false;
      myMetis.pasteViewsOnly  = false;
    }
    if (true) {
      myDiagram =
        $(go.Diagram,
          {
            initialContentAlignment: go.Spot.Center,       // center the content
            initialAutoScale: go.Diagram.Uniform,
            "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
            "scrollMode": go.Diagram.InfiniteScroll,
            "initialAutoScale": go.Diagram.UniformToFill,
            'undoManager.isEnabled': false,  // must be set to allow for model change listening
            //'undoManager.maxHistoryLength': 100,  // uncomment disable undo/redo functionality

            "LinkDrawn": maybeChangeLinkCategory,     // these two DiagramEvents call a
            "LinkRelinked": maybeChangeLinkCategory,  // function that is defined below

            // draggingTool: new GuidedDraggingTool(),  // defined in GuidedDraggingTool.ts
            // 'draggingTool.horizontalGuidelineColor': 'blue',
            // 'draggingTool.verticalGuidelineColor': 'blue',
            // 'draggingTool.centerGuidelineColor': 'green',
            // 'draggingTool.guidelineWidth': 1,
            // "draggingTool.dragsLink": true,

            "draggingTool.isGridSnapEnabled": true,
            "linkingTool.portGravity": 0,  // no snapping while drawing new links
            "linkingTool.archetypeLinkData": {
              "key": utils.createGuid(),
              "category": "Relationship",
              "type": "isRelatedTo",
              "name": "",
              "description": "",
              "relshipkind": constants.relkinds.REL,
            },
              
                
            // "clickCreatingTool.archetypeNodeData": {
            //   "key": utils.createGuid(),
            //   "category": "Object",
            //   "name": "Generic",
            //   "description": "",
            //   "fillcolor": "grey",
            //   "strokecolor": "black",
            //   "strokewidth": "6",
            //   "icon": "default.png"
            // },
            // // allow Ctrl-G to call groupSelection()
            // "commandHandler.archetypeGroupData": {
            //   text: "Group",
            //   isGroup: true,
            //   color: "blue"
            // },
            "linkingTool.isUnconnectedLinkValid": false,
            "relinkingTool.isUnconnectedLinkValid": false,
            "relinkingTool.portGravity": 20,
            "relinkingTool.fromHandleArchetype":
              $(go.Shape, "Diamond", { segmentIndex: 0, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "tomato", stroke: "darkred" }),
            "relinkingTool.toHandleArchetype":
              $(go.Shape, "Diamond", { segmentIndex: -1, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "darkred", stroke: "tomato" }),
            "linkReshapingTool.handleArchetype":
              $(go.Shape, "Diamond", { desiredSize: new go.Size(7, 7), fill: "lightblue", stroke: "deepskyblue" }),
            allowDrop: true,  // must be true to accept drops from the Palette
            grid: $(go.Panel, "Grid",
              $(go.Shape, "LineH", { stroke: "lightgray", strokeWidth: 0.5 }),
              $(go.Shape, "LineH", { stroke: "gray", strokeWidth: 0.5, interval: 10 }),
              $(go.Shape, "LineV", { stroke: "lightgray", strokeWidth: 0.5 }),
              $(go.Shape, "LineV", { stroke: "gray", strokeWidth: 0.5, interval: 10 })
            ),

            model: $(go.GraphLinksModel,
              {
                // Uncomment the next line to turn ON linkToLink
                // linkLabelKeysProperty: "labelKeys", 
                linkKeyProperty: 'key'
              })
          }
        );
    }
      // when the user clicks on the background of the Diagram, remove all highlighting
    myDiagram.click = function(e) {
      e.diagram.commit(function(d) { d.clearHighlighteds(); }, "no highlighteds");
    };

    myDiagram.myGoModel = this.myGoModel;
    myDiagram.myGoMetamodel = this.myGoMetamodel;
    myDiagram.layout.isInitial = false;
    myDiagram.layout.isOngoing = false;
    myDiagram.dispatch = this.myMetis?.dispatch;
    myDiagram.handleOpenModal = this.handleOpenModal;
    myDiagram.handleCloseModal = this.handleCloseModal;
    myDiagram.selectedOption = this.state.selectedOption;
    myDiagram.state = this.state;
    myDiagram.toolTip =
      $("ToolTip", { margin: 4 },
        $(go.TextBlock, new go.Binding("text", "", diagramInfo),
          {
            font: "bold arial 72px sans-serif" // Seems not supported
          }
        ),
        // use a converter to display information about the diagram model
      );
    //myDiagram.dispatch ({ type: 'SET_MYMETIS_MODEL', myMetis });
    myMetis.myDiagram = myDiagram;

    // Tooltip functions
    function nodeInfo(d) {  // Tooltip info for a node data object
      if (debug) console.log('250 nodeInfo', d, d.object);
      const format1 = "%s\n";
      const format2 = "%-10s: %s\n";
      let msg = "";
      msg += printf(format2, "Type", d.object.type.name);
      msg += printf(format2, "Name", d.name);
      msg += printf(format2, "Description", d.object.description);
      if (d.group) {
        const group = myMetis.gojsModel.findNode(d.group);
        msg += printf(format2, "member of", group.name);
      }
      if (debug) console.log('262 nodeInfo', msg);
      let str = "Attributes:"; 
      msg += printf(format1, str);      
      const obj = d.object;
      const props = obj.type.properties;
      if (debug) console.log('269 nodeInfo', obj, props, msg);
      
      for (let i=0; i<props.length; i++) {
        const prop = props[i];
        if (debug) console.log('273 nodeInfo', prop);
        const value = obj.getStringValue2(prop.name);
        const p = prop.name + ': ' + value;
        msg += printf(format2, prop.name, value);
      }
      if (debug) console.log('275 nodeInfo', obj, msg);
      return msg;
    }

    function linkInfo(d: any) {  // Tooltip info for a link data object
      const typename = d.relshiptype?.name;
      const reltype = myMetis.findRelationshipTypeByName(typename);
      const fromNode = d.fromNode;
      const fromObj = fromNode?.object;
      const fromObjtype = reltype.getFromObjType();
      const toNode = d.toNode;
      const toObj = toNode?.object;
      const toObjtype = reltype.getToObjType();
      if (debug) console.log('229 linkInfo', d);
      let str = "Link: ";
      str += d.name + " (" + typename + ")\n";
      str += "from: " + fromObj?.name + "\n";
      str += "to: " + toObj?.name;
      return str;
    }

    function diagramInfo(model: any) {  // Tooltip info for the diagram's model
      if (debug) console.log('231 diagramInfo', model);
      let str = "Model:\n";
      str += model.nodeDataArray.length + " nodes, ";
      str += model.linkDataArray.length + " links";
      return str;
    }

    // A CONTEXT is an Adornment with a bunch of buttons in them
    // Nodes CONTEXT MENU
    if (true) {
      var partContextMenu =
        $(go.Adornment, "Vertical",
          makeButton("New Typeview",
            function (e: any, obj: any) { 
              const node = obj.part.data;
              console.log('313 node', node);
              const currentObject = myMetis.findObject(node.object.id)
              const currentObjectView =  myMetis.findObjectView(node.objectview.id);
              if (debug) console.log('316 obj and objview', currentObject, currentObjectView);
              if (currentObject && currentObjectView) {                   
                const myMetamodel = myMetis.currentMetamodel;
                const objtype  = currentObject.type;
                let typeview = currentObjectView.typeview;
                const defaultTypeview = objtype.typeview;
                if (debug) console.log('322 node', objtype, defaultTypeview, typeview);
                if (!typeview || (typeview.id === defaultTypeview.id)) {
                    const id = utils.createGuid();
                    typeview = new akm.cxObjectTypeView(id, id, objtype, "");
                    typeview.data = defaultTypeview.data;
                    typeview.data.fillcolor = "lightgray";
                    typeview.modified = true;
                    currentObjectView.typeview = typeview;
                    const viewdata = typeview.data;
                    console.log('339 viewdata', typeview.data);
                    for (let prop in typeview.data) {
                        myDiagram.model.setDataProperty(node, prop, viewdata[prop]);
                    }
                    node.typeview = typeview;
                    myDiagram.requestUpdate();
                    myMetamodel.addObjectTypeView(typeview);
                    myMetis.addObjectTypeView(typeview);
                }    
                if (typeview) {          
                  const gqlObjtypeView = new gql.gqlObjectTypeView(typeview);
                  if (debug) console.log('332 gqlObjtypeView', gqlObjtypeView);
                  const modifiedTypeViews = new Array();
                  modifiedTypeViews.push(gqlObjtypeView);
                  modifiedTypeViews.map(mn => {
                    let data = mn;
                    e.diagram.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
                  })
                  const gqlObjView = new gql.gqlObjectView(currentObjectView);
                  if (debug) console.log('340 gqlObjView', gqlObjView);
                  const modifiedObjectViews = new Array();
                  modifiedObjectViews.push(gqlObjView);
                  modifiedObjectViews.map(mn => {
                    let data = mn;
                    e.diagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
                  })              
                }
              }
            },
            function (o: any) {
              if (true) {
                return false;
              } else {
                const node = o.part.data;
                if (debug) console.log('367 node', node);
                const currentObject = node.object; 
                const currentObjectView = node.objectview;
                if (currentObject && currentObjectView) {                   
                  let objtype  = currentObject.type;
                  let typeview = node.typeview;
                  let defaultTypeview = objtype.typeview;
                  if (debug) console.log('358 typeview, defaultTypeview', typeview, defaultTypeview);
                  if (typeview && (typeview.id === defaultTypeview.id)) {
                    return true;
                  }
                }
              }
              return false;
            }),
          makeButton("Reset Typeview", 
            function (e: any, obj: any) {
              const node = obj.part.data;
              console.log('383 node', node);
              const currentObject = myMetis.findObject(node.object.id)
              const currentObjectView =  myMetis.findObjectView(node.objectview.id);
              if (debug) console.log('386 obj and objview', currentObject, currentObjectView);
              if (currentObject && currentObjectView) {                   
                const myMetamodel = myMetis.currentMetamodel;
                const objtype  = currentObject.type;
                let typeview = currentObjectView.typeview;
                const defaultTypeview = objtype.typeview;
                if (debug) console.log('392 node', objtype, defaultTypeview, typeview);
                if (!typeview || (typeview.id !== defaultTypeview.id)) {
                  currentObjectView.typeview = defaultTypeview;
                  for (let prop in defaultTypeview.data) {
                    myDiagram.model.setDataProperty(node, prop, defaultTypeview[prop]);
                  }
                  node.typeview = defaultTypeview;
                  myDiagram.requestUpdate();
                  const gqlObjView = new gql.gqlObjectView(currentObjectView);
                  if (debug) console.log('397 gqlObjView', gqlObjView);
                  const modifiedObjectViews = new Array();
                  modifiedObjectViews.push(gqlObjView);
                  modifiedObjectViews.map(mn => {
                    let data = mn;
                    e.diagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
                  })              
                }
              }
            },
            function (o: any) {
              return false;
              if (false) 
                return false;
              else {
                const node = o.part.data;
                if (debug) console.log('413 node', node);
                const currentObject = node.object; 
                const currentObjectView = node.objectview;
                if (currentObject && currentObjectView) {                   
                  const objtype  = currentObject.type;
                  const typeView = node.typeview;
                  const defaultTypeview = objtype.typeview;
                  if (typeView && (typeView.id !== defaultTypeview.id)) {
                    return true;
                  }
                }
                return false;
              }
            }),
          makeButton("Edit Attribute",
            function (e: any, obj: any) { 
              const node = obj.part.data;
              if (node.category === 'Object') {
                let object = node.object;
                if (!object) return;
                object = myMetis.findObject(object.id);
                const objtype = object?.type;
                if (objtype) {
                  const choices: string[]  = [];
                  choices.push('description');
                  if (objtype.name === 'ViewFormat')
                    choices.push('viewFormat');
                  if (objtype.name === 'InputPattern')
                    choices.push('inputPattern');
                  const props = objtype.properties;
                  for (let i=0; i<props?.length; i++) {
                    const prop = props[i];
                    choices.push(prop.name);                      
                  }
                  let defText = "";
                  if (choices.length > 0) defText = choices[0];
                  // const propname = prompt('Enter attribute name, one of ' + choices, defText);
                  // ---------------------------------
                  const modalContext = {
                    what: "selectDropdown",
                    title: "Select Property",
                    case: "Edit Attribute",
                    myDiagram: myDiagram
                  } 
                  myMetis.currentNode = node;
                  myMetis.myDiagram = myDiagram;
                  myDiagram.handleOpenModal(choices, modalContext);
                }
              }
            },
            function (o: any) { 
              const node = o.part.data;
              if (node.category === 'Object') {
                const object = node.object;
                const objtype = object?.type;
                if (objtype) {
                  const props = objtype.properties;
                  if (props && props.length>0) {
                    return true;
                  }
                }
              }
              return false; 
            }),
          makeButton("Edit Object",
            function (e: any, obj: any) { 
              const node = obj.part.data;
              if (!debug) console.log('1083 node', node);
              const icon = findImage(node.icon);
              const modalContext = {
                what:       "editObject",
                title:      "Edit Object",
                icon:       icon,
                myDiagram:  myDiagram
              }
              myMetis.currentNode = node;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(node, modalContext);
              // 
            },
            function (o: any) { 
              const node = o.part.data;
              if (node.category === 'Object') {
                return true;
              }
              return false; 
            }),
          makeButton("Edit Objectview",
            function (e: any, obj: any) { 
              const node = obj.part.data;
              if (!debug) console.log('1107 node', node);
              const icon = findImage(node.icon);
              const modalContext = {
                what:       "editObjectview",
                title:      "Edit Object View",
                icon:       icon,
                myDiagram:  myDiagram
              }
              myMetis.currentNode = node;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(node, modalContext);
                // 
            }, 
            function (o: any) { 
              const node = o.part.data;
              if (node.category === 'Object') {
                return true;
              }
              return false; 
            }),
          makeButton("Change Icon",
            function (e: any, obj: any) {
              const node = e.diagram.selection.first().data;
              const ilist = iconList()
              const iconLabels = ilist.map(il => (il) && il.label)
              console.log('1351', iconLabels, ilist );
              // const node = obj.part.data;
              const modalContext = {
                what: "selectDropdown",
                title: "Select Icon",
                case: "Change Icon",
                iconList : iconList(),
                myDiagram: myDiagram
              } 
              myMetis.currentNode = node;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(node, modalContext);
              if (debug) console.log('511 myMetis', myMetis);
          },
            function (o: any) {
              const node = o.part.data;
              if (node.category === 'Object') {
                return true;
              } else {
                return false;
              }
          }),
          makeButton("Test InputPattern",
            function (e: any, obj: any) {
              const node = obj.part.data;
              if (node.category === 'Object') {
                let object = node.object;
                object = myMetis.findObject(object.id);
                const objtype = object?.type;
                let patt = defPattern;
                patt = prompt('Enter input pattern', defPattern);
                if (patt.length>0) {
                  defPattern = patt;
                  const regex = new RegexParser(patt);
                  console.log('710 regex:', regex);
                  const value = prompt('Value to check');
                  console.log('710 regex:', regex);
                  if (regex.test(value)) {
                    alert('Value: ' + value + ' IS valid');
                  } else {
                    alert('Value: ' + value + ' IS NOT valid');
                  }
                }                                
              }
            },
            function (o: any) { 
              const node = o.part.data;
              if (node.category === 'Object') {
                let object = node.object;
                if (!object) return;
                object = myMetis.findObject(object.id);
                const objtype = object?.type;
                if (objtype?.name === 'InputPattern' || objtype?.name === 'Datatype') {
                  return true;
                }
              }
              return false;               
            }),
          makeButton("Cut",
            function (e: any, obj: any) { 
              e.diagram.commandHandler.cutSelection(); 
            },
            function (o: any) { 
              const node = o.part.data;
              if (node.category === 'Object') {
                return false;
              }
              return o.diagram.commandHandler.canCutSelection(); 
            }),
          makeButton("Copy",
            function (e: any, obj: any) { 
              e.diagram.commandHandler.copySelection(); 
            },
            function (o: any) { 
              const node = o.part.data;
              if (node.category === 'Object') 
                return o.diagram.commandHandler.canCopySelection(); 
            }),
          makeButton("Paste",
            function (e: any, obj: any) {
              const currentModel = myMetis.currentModel;
              myMetis.pasteViewsOnly = false;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
            },
            function (o: any) {
              return o.diagram.commandHandler.canPasteSelection(); 
            }),
          makeButton("Paste View",
            function (e: any, obj: any) {
              const currentModel = myMetis.currentModel;
              myMetis.pasteViewsOnly = true;
              e.diagram.dispatch ({ type: 'SET_MYMETIS_MODEL', myMetis });
              const myGoModel = myDiagram.myGoModel;
              e.diagram.dispatch({ type: 'SET_MY_GOMODEL', myGoModel });
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
              if (debug) console.log('560 Paste View', myMetis);
            },
            function (o: any) { 
              //return false;
              return o.diagram.commandHandler.canPasteSelection(); 
            }),
          makeButton("Delete",
            function (e: any, obj: any) {
              if (confirm('Do you really want to delete the current selection?')) {
                const myGoModel = myMetis.gojsModel;
                const currentModel = myMetis.currentModel;
                myMetis.deleteViewsOnly = false;
                myDiagram.selection.each(function(sel) {
                  const inst = sel.data;
                  if (inst.category === 'Object') {
                    const node = myGoModel.findNode(inst.key);
                    console.log('657 node', node);
                    if (node?.isGroup) {
                      const groupMembers = node.getGroupMembers(myGoModel);
                      for (let i=0; i<groupMembers?.length; i++) {
                        const member = groupMembers[i];
                        const gjsNode = myDiagram.findNodeForKey(member?.key);
                      }                    
                    }
                    const object = node?.object;
                    console.log('667 object', object);
                    const objviews = object?.objectviews;
                    for (let i=0; i<objviews?.length; i++) {
                      const objview = objviews[i];
                      console.log('671 objview', objview);
                      if (objview) {
                          const myNode = myGoModel.findNodeByViewId(objview.id);
                          console.log('674 myNode', myNode);
                          const n = myDiagram.findNodeForKey(myNode?.key);
                          console.log('676 n', n);
                          if (n) n.isSelected = true;                        
                      }    
                    }
                  }
                })
                e.diagram.commandHandler.deleteSelection();      
              }         
            },
            function (o: any) { 
              return o.diagram.commandHandler.canDeleteSelection(); 
            }),
          makeButton("Delete View",
            function (e: any, obj: any) {
              if (confirm('Do you really want to delete the current selection?')) {
                const myModel = myMetis.currentModel;
                myMetis.deleteViewsOnly = true;
                const gqlModel = new gql.gqlModel(myModel, true);
                const modifiedModels = new Array();
                modifiedModels.push(gqlModel);
                modifiedModels.map(mn => {
                  let data = mn;
                  e.diagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
                })
                if (debug) console.log('603 Delete View', gqlModel, myMetis);
                e.diagram.commandHandler.deleteSelection();
              }
            },
            function (o: any) { 
              const node = o.part.data;
              if (node.category === 'Object') {
                return o.diagram.commandHandler.canDeleteSelection();
              } else {
                return false;
              }
            }),
          makeButton("----------"),
          makeButton("Generate Datatype",
            function(e: any, obj: any) { 
                const context = {
                  "myMetis":            myMetis,
                  "myMetamodel":        myMetis.currentMetamodel,
                  "myTargetMetamodel":  myMetis.currentTargetMetamodel,
                  "myModel":            myMetis.currentModel,
                  "myModelView":        myMetis.currentModelview,
                  "myDiagram":          e.diagram,
                  "dispatch":           e.diagram.dispatch
                }
                if (!myMetis.currentTargetMetamodel)
                    myMetis.currentTargetMetamodel = myMetis.currentMetamodel;
                const contextmenu = obj.part;  
                const part = contextmenu.adornedPart; 
                const currentObj = part.data.object;
                context.myTargetMetamodel = gen.askForTargetMetamodel(context);
                myMetis.currentModel.targetMetamodelRef = context.myTargetMetamodel.id;
                if (debug) console.log('369 Diagram', myMetis.currentModel.targetMetamodelRef);
                
                const gqlModel = new gql.gqlModel(context.myModel, true);
                const modifiedModels = new Array();
                modifiedModels.push(gqlModel);
                modifiedModels.map(mn => {
                  let data = mn;
                  e.diagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
                })
                
                const dtype = gen.generateDatatype(currentObj, context);
                const gqlDatatype = new gql.gqlDatatype(dtype);
                const modifiedDatatypes = new Array();
                modifiedDatatypes.push(gqlDatatype);
                modifiedDatatypes.map(mn => {
                  let data = mn;
                  e.diagram.dispatch({ type: 'UPDATE_DATATYPE_PROPERTIES', data })
                })
                if (debug) console.log('467 gqlDatatype', gqlDatatype);
            },
            function(o: any) { 
              const obj = o.part.data.object;
              const objtype = obj?.type;
              if (objtype?.name === constants.types.AKM_DATATYPE)
                  return true;              
              return false;
            }),
          makeButton("Generate Unit",
            function(e: any, obj: any) { 
              const context = {
                "myMetis":            myMetis,
                "myMetamodel":        myMetis.currentMetamodel,
                "myTargetMetamodel":  myMetis.currentTargetMetamodel,
                "myModel":            myMetis.currentModel,
                "myModelView":        myMetis.currentModelview,
                "myDiagram":          e.diagram,
                "dispatch":           e.diagram.dispatch
              }
              const contextmenu = obj.part;  
              const part       = contextmenu.adornedPart; 
              const currentObj = part.data.object;
              context.myTargetMetamodel = gen.askForTargetMetamodel(context);
              const unit = gen.generateUnit(currentObj, context);
              const gqlUnit = new gql.gqlUnit(unit);
              const modifiedUnits = new Array();
              modifiedUnits.push(gqlUnit);
              modifiedUnits.map(mn => {
                let data = mn;
                e.diagram.dispatch({ type: 'UPDATE_UNIT_PROPERTIES', data })
              })
            },
            function(o: any) { 
              let obj = o.part.data.object;
              let objtype = obj.type;
              if (objtype.name === constants.types.AKM_UNIT)
                  return true;
              else
                  return false;
            }),
          makeButton("Change Object Type",
            function (e: any, obj: any) {
              const node = e.diagram.selection.first().data;
              const currentType = node.objecttype;
              if (debug) console.log('273 node', node);
              const myMetamodel = myMetis.currentMetamodel;
              const objtypes = myMetamodel.getObjectTypes();
              if (debug) console.log('275 Set object type', objtypes);
              let defText  = "";
              if (objtypes) {
                node.choices = [];
                node.choices.push('Generic');
                for (let i=0; i<objtypes.length; i++) {
                  const otype = objtypes[i];
                  if (!otype.deleted && !otype.abstract) {
                    node.choices.push(otype.name); 
                    if (otype.name === 'Generic')
                      continue;
                  }  
                }
              }
              const modalContext = {
                what: "selectDropdown",
                title: "Select Object Type",
                case: "Change Object type",
                myDiagram: myDiagram
              } 
              myMetis.currentNode = node;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(node.choices, modalContext);
              if (debug) console.log('511 myMetis', node.choices, myMetis);
          },
            function (o: any) {
              const node = o.part.data;
              if (node.category === 'Object') {
                return true;
              } else {
                return false;
              }
          }),

          makeButton("Edit Typeview",
          function (e: any, obj: any) { 
            const node = obj.part.data;
            const modalContext = {
              what: "editTypeview",
              title: "Edit Typeview",
              icon: findImage(node.icon),
              myDiagram: myDiagram
            }
            myMetis.currentNode = node;
            myMetis.myDiagram = myDiagram;
            myDiagram.handleOpenModal(node, modalContext);
          }, 
          function (o: any) {
            if (false)
              return false;
            else {
              const node = o.part.data;
              if (node.category === 'Object')
                return true;
            }
            return false;
          }),
          makeButton("----------"),
          makeButton("Generate Metamodel",
            function (e: any, obj: any) { 
              // node is a container (group)
              const node = obj.part.data;
              const context = {
                "myMetis":            myMetis,
                "myMetamodel":        myMetis.currentMetamodel,
                "myTargetMetamodel":  myMetis.currentTargetMetamodel,
                "myModel":            myMetis.currentModel,
                "myCurrentModelview": myMetis.currentModelview,
                "myGoModel":          myMetis.gojsModel,
                "myCurrentNode":      node,    
                "myDiagram":          e.diagram,
                "dispatch":           e.diagram.dispatch
              }
              context.myTargetMetamodel = gen.askForTargetMetamodel(context, false);
              if (context.myTargetMetamodel?.name === "IRTV Metamodel") {  
                    alert("IRTV Metamodel is not valid as Target metamodel!"); // sf dont generate on EKA Metamodel
                    context.myTargetMetamodel = null;
              } else if (context.myTargetMetamodel == undefined) { // sf
                  context.myTargetMetamodel = null;
              }
              myMetis.currentTargetMetamodel = context.myTargetMetamodel;
              const targetMetamodel = myMetis.currentTargetMetamodel;
              const sourceModelview = myMetis.currentModelview;
              gen.generateTargetMetamodel(targetMetamodel, sourceModelview, context);
            },
            function (o: any) { 
              const node = o.part.data;
              if (node.isGroup)
                return true;
              else
                return false;
            }),
          makeButton("Select all views of this object",
            function (e: any, obj: any) {
              const node = obj.part.data;
              const myGoModel = myMetis.gojsModel;
              const object = myMetis.findObject(node.object.id)
              const oviews = object.objectviews;
              if (oviews) {
                for (let j=0; j<oviews.length; j++) {
                  const ov = oviews[j];
                  if (ov) {
                    const node = myGoModel.findNodeByViewId(ov?.id);
                    const gjsNode = myDiagram.findNodeForKey(node?.key);
                    if (gjsNode) gjsNode.isSelected = true;
                  }
                }
              }
            },
            function (o: any) { 
              const node = o.part.data;
              if (debug) console.log('1405 node', node);
              const myGoModel = myMetis.gojsModel;
              const object = myMetis.findObject(node.object.id)
              const oviews = object.objectviews;
              if (oviews?.length>1) {
                let cnt = 0;
                for (let j=0; j<oviews.length; j++) {
                  const ov = oviews[j];
                  if (ov) {
                    const node = myGoModel.findNodeByViewId(ov?.id);
                    const gjsNode = myDiagram.findNodeForKey(node?.key);
                    if (gjsNode) 
                      cnt++;
                  }
                }
                if (cnt > 1)
                  return true;
              }
            return false;
          }),
              
          makeButton("Select all objects of this type",
            function (e: any, obj: any) {
              const node = obj.part.data;
              if (debug) console.log('1400 node', node);
              const currentObject = myMetis.findObject(node.object.id)
              const currentType = currentObject?.type;
              const myModel = myMetis.currentModel;
              const myGoModel = myMetis.gojsModel;
              const objects = myModel.getObjectsByType(currentType, false);
              for (let i=0; i<objects.length; i++) {
                const o = objects[i];
                if (o) {
                  const oviews = o.objectviews;
                  if (oviews) {
                    for (let j=0; j<oviews.length; j++) {
                      const ov = oviews[j];
                      if (ov) {
                        const node = myGoModel.findNodeByViewId(ov?.id);
                        const gjsNode = myDiagram.findNodeForKey(node?.key);
                        if (gjsNode) gjsNode.isSelected = true;
                      }
                    }
                  }
                }
              }
            },
            function (o: any) { 
            return true;
            }),
          makeButton("Generate Target Object Type",
            function(e: any, obj: any) { 
                const context = {
                  "myMetis":            myMetis,
                  "myMetamodel":        myMetis.currentMetamodel,
                  "myTargetMetamodel":  myMetis.currentTargetMetamodel,
                  "myModel":            myMetis.currentModel,
                  "myCurrentModelview": myMetis.currentModelview,
                  "myDiagram":          e.diagram,
                  "dispatch":           e.diagram.dispatch
                }
                if (debug) console.log('441 myMetis', myMetis);
                const contextmenu = obj.part;  
                const part = contextmenu.adornedPart; 
                const currentObj = part.data.object;
                context.myTargetMetamodel = myMetis.currentTargetMetamodel;
                if (debug) console.log('446 context', context);
                  context.myTargetMetamodel = gen.askForTargetMetamodel(context, false);
                if (context.myTargetMetamodel?.name === "IRTV Metamodel") {  
                      alert("IRTV Metamodel is not valid as Target metamodel!"); // sf dont generate on EKA Metamodel
                      context.myTargetMetamodel = null;
                } else if (context.myTargetMetamodel == undefined) { // sf
                    context.myTargetMetamodel = null;
                }    
                myMetis.currentTargetMetamodel = context.myTargetMetamodel;
                if (debug) console.log('456 Generate Object Type', context.myTargetMetamodel, myMetis);
                if (context.myTargetMetamodel) {  
                  myMetis.currentModel.targetMetamodelRef = context.myTargetMetamodel?.id;
                  if (debug) console.log('459 Generate Object Type', context, myMetis.currentModel.targetMetamodelRef);
                  const gqlModel = new gql.gqlModel(context.myModel, true);
                  const modifiedModels = new Array();
                  modifiedModels.push(gqlModel);
                  modifiedModels.map(mn => {
                    let data = (mn) && mn;
                    data = JSON.parse(JSON.stringify(data));
                    myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
                  })
                  if (debug) console.log('467 gqlModel', gqlModel);
                  const currentObjview = part.data.objectview;
                  const objtype = gen.generateObjectType(currentObj, currentObjview, context);
                  if (debug) console.log('470 Generate Object Type', objtype, myMetis);
                }
            },  
            function(o: any) { 
                 let obj = o.part.data.object;
                 let objtype = obj.type;
                 if (objtype.name === constants.types.AKM_INFORMATION)
                     return true;
                 else
                     return false;
            }),
          makeButton("TEST",
            function (e: any, obj: any) { 
              const myDiagram = e.diagram;
              const node1 = obj.part;
              console.log('1226 node1', node1);
              let data = node1.data;
              console.log('1228 data', data);
              const node2 = myDiagram.findNodeForKey(data.key);
              console.log('1230 nodeForKey (node2)', node2);
              data = node2.data;
              console.log('1232 data', data);
              myDiagram.model.setDataProperty(data, "fillcolor", "pink");
            },
            function (o: any) { 
              if (debug)
                return true; 
              return false;
            }),
          makeButton("Undo",
            function (e: any, obj: any) { e.diagram.commandHandler.undo(); },
            function (o: any) { 
              return o.diagram.commandHandler.canUndo(); 
            }),
          makeButton("Redo",
            function (e: any, obj: any) { e.diagram.commandHandler.redo(); },
            function (o: any) { 
              return o.diagram.commandHandler.canRedo(); 
            }),
          // makeButton("Group",
          //   function (e: any, obj: any) { e.diagram.commandHandler.groupSelection(); },
          //   function (o: any) { 
          //     return false;
          //     return o.diagram.commandHandler.canGroupSelection(); 
          //   }),
          // makeButton("Ungroup",
          //   function (e: any, obj: any) { e.diagram.commandHandler.ungroupSelection(); },
          //   function (o: any) { 
          //     return false;
          //     return o.diagram.commandHandler.canUngroupSelection(); 
          //   })
        );
    }

    // A CONTEXT MENU for links    
    if (true) {
      var linkContextMenu =
        $(go.Adornment, "Vertical",
        makeButton("Edit Relationship",
            function (e: any, obj: any) { 
              const link = obj.part.data;
              const modalContext = {
                what: "editRelationship",
                title: "Edit Relationship",
                myDiagram: myDiagram
              }
              myMetis.currentLink = link;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(link, modalContext);
              // 
            },
            function (o: any) { 
              const node = o.part.data;
              if (node.category === 'Relationship') {
                return true;
              }
              return false; 
            }),
          makeButton("Edit Relationship View",
            function (e: any, obj: any) { 
              const link = obj.part.data;
              const modalContext = {
                what: "editRelshipview",
                title: "Edit Relationship View",
                myDiagram: myDiagram
              }
              myMetis.currentLink = link;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(link, modalContext);
                // 
            }, 
            function (o: any) { 
              const link = o.part.data;
              if (link.category === 'Relationship') {
                return true;
              }
              return false; 
            }),
          makeButton("Cut",
            function (e, obj) { 
              e.diagram.commandHandler.cutSelection(); 
            },
            function (o) { 
              return false;
              //return o.diagram.commandHandler.canCutSelection(); 
            }),
          makeButton("Delete",
            function (e, obj) {
              if (confirm('Do you really want to delete the current selection?')) {
                myMetis.deleteViewsOnly = false;
                e.diagram.commandHandler.deleteSelection();
              }
            },
            function (o) { 
            return o.diagram.commandHandler.canDeleteSelection(); 
            }),
          makeButton("Delete View",
            function (e, obj) {
              if (confirm('Do you really want to delete the current selection?')) {
                myMetis.deleteViewsOnly = true;
                e.diagram.commandHandler.deleteSelection();
              }
            },
            function (o) { 
              const link = o.part.data;
              if (link.category === 'Relationship') {
                return o.diagram.commandHandler.canDeleteSelection(); 
              } else {
                return false;
              }
            }),
          makeButton("----------"),
          makeButton("New Typeview",
            function (e: any, obj: any) { 
              //const link = e.diagram.selection.first().data;
              const link = obj.part.data;
              if (link.category === 'Relationship') {
                const currentRelship = myMetis.findRelationship(link.relship.id);
                const currentRelshipView = myMetis.findRelationshipView(link.relshipview.id);
                if (currentRelship && currentRelshipView) {                   
                  const myMetamodel = myMetis.currentMetamodel;
                  const reltype  = currentRelship.type;
                  let typeview = currentRelshipView.typeview;
                  const defaultTypeview = reltype.typeview;
                  if (debug) console.log('701 link', reltype, defaultTypeview, typeview);
                  if (!typeview || (typeview.id === defaultTypeview.id)) {
                      const id = utils.createGuid();
                      typeview = new akm.cxRelationshipTypeView(id, id, reltype, "");
                      typeview.data = defaultTypeview.data;
                      typeview.data.strokecolor = "red";
                      typeview.nameId = undefined;
                      typeview.modified = true;
                      currentRelshipView.typeview = typeview;
                      const viewdata = typeview.data;
                      console.log('796 viewdata', typeview.data);
                      for (let prop in typeview.data) {
                        myDiagram.model.setDataProperty(link, prop, viewdata[prop]);
                      }
                      link.typeview = typeview;
                      myDiagram.requestUpdate();
                      myMetamodel.addRelationshipTypeView(typeview);
                      myMetis.addRelationshipTypeView(typeview);
                      if (debug) console.log('712 myMetis', currentRelshipView, typeview, myMetis);

                      const gqlReltypeView = new gql.gqlRelshipTypeView(typeview);
                      if (debug) console.log('715 gqlReltypeView', gqlReltypeView);
                      const modifiedTypeViews = new Array();
                      modifiedTypeViews.push(gqlReltypeView);
                      modifiedTypeViews.map(mn => {
                        let data = mn;
                        e.diagram.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
                      })

                      const gqlRelView = new gql.gqlRelshipView(currentRelshipView);
                      if (debug) console.log('723 gqlRelView', gqlRelView);
                      const modifiedRelshipViews = new Array();
                      modifiedRelshipViews.push(gqlRelView);
                      modifiedRelshipViews.map(mn => {
                        let data = mn;
                        e.diagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
                      })  
                  }              
                }
              }
            },
            function (o: any) {
              if (true)
                return false;
              else {
              const link = o.part.data;
                if (link.category === 'Relationship') {
                  const currentRelship = link.relship;
                  const currentRelshipView = link.relshipview;
                  if (currentRelship && currentRelshipView) {                   
                    const reltype  = currentRelship.type;
                    const typeView = link.typeview;
                    const defaultTypeview = reltype.typeview;
                    if (typeView && (typeView.id === defaultTypeview.id)) {
                      return true;
                    }
                  }
                }
                else if (link.category === 'Relationship type') {
                    return false;
                }
                return false;
              }
            }),
          makeButton("Change Relationship Type",
            function (e, obj) {
              const myGoModel = myMetis.gojsModel;
              const link = obj.part.data;
              if (debug) console.log('666 link', link, myDiagram, myGoModel);
              let fromNode = myGoModel?.findNode(link.from);
              let toNode   = myGoModel?.findNode(link.to);
              if (debug) console.log('669 from and toNode', fromNode, toNode);
              let fromType = fromNode?.objecttype;
              let toType   = toNode?.objecttype;
              fromType = myMetis.findObjectType(fromType?.id);
              toType   = myMetis.findObjectType(toType?.id);
              if (debug) console.log('672 link', fromType, toType);
              const myMetamodel = myMetis.currentMetamodel;
              const reltypes = myMetamodel.findRelationshipTypesBetweenTypes(fromType, toType);
              let   defText  = "";
              link.choices = [];
              link.choices.push('isRelatedTo');
              if (debug) console.log('675 createRelationship', reltypes, myMetis);
              if (reltypes) {
                  for (let i=0; i<reltypes.length; i++) {
                      const rtype = reltypes[i];
                      link.choices.push(rtype.name);  
                      if (rtype.name === 'isRelatedTo')
                          continue;
                  }
              }
              const context = {
                "myMetis":      myMetis,
                "myDiagram":    e.diagram,
              }
              const modalContext = {
                what: "selectDropdown",
                title: "Select Relationship Type",
                case: "Change Relationship type",
                myDiagram: myDiagram
              } 
              myMetis.currentLink = link;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(link.choices, modalContext);
              if (debug) console.log('511 myMetis', myMetis);

            },
            function (o) {
              const link = o.part.data;
              if (link.category === 'Relationship') {
                return true;
              } else {
                return false;
              }
            }),
          makeButton("Edit Typeview",
            function (e: any, obj: any) { 
              const link = obj.part.data;
              const modalContext = {
                what: "editTypeview",
                title: "Edit Typeview",
                myDiagram: myDiagram
              }
              myMetis.currentLink = link;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(link, modalContext);
                // 
            }, 
            function (o: any) {
              if (false)
                return false;
              else {
                const link = o.part.data;
                if (link.category === 'Relationship')
                  return true;
              }
              return false;
            }),
          makeButton("Reset Typeview",
            function (e: any, obj: any) { 
              const link = obj.part.data;
              if (link.category === 'Relationship') {
                const currentRelship = myMetis.findRelationship(link.relship.id);
                const currentRelshipView = myMetis.findRelationshipView(link.relshipview.id);
                if (currentRelship && currentRelshipView) {                   
                  const myMetamodel = myMetis.currentMetamodel;
                  const reltype  = currentRelship.type;
                  let typeview = currentRelshipView.typeview;
                  const defaultTypeview = reltype.typeview;
                  currentRelshipView.typeview = defaultTypeview;
                  if (debug) console.log('856 viewdata', typeview.data);
                  const viewdata = defaultTypeview.data;
                  for (let prop in defaultTypeview.data) {
                    myDiagram.model.setDataProperty(link, prop, defaultTypeview[prop]);
                  }
                  link.typeview = defaultTypeview;
                  myDiagram.requestUpdate();

                  const gqlRelView = new gql.gqlRelshipView(currentRelshipView);
                  if (debug) console.log('798 gqlRelView', gqlRelView);
                  const modifiedRelshipViews = new Array();
                  modifiedRelshipViews.push(gqlRelView);
                  modifiedRelshipViews.map(mn => {
                    let data = mn;
                    e.diagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
                  })
                }
              }
            },
            function (o: any) {
              if (true) 
                return false;
              else {
                const link = o.part.data;
                if (link.category === 'Relationship') {
                  const currentRelship = link.relship;
                  const currentRelshipView = link.relshipview;
                  if (currentRelship && currentRelshipView) {                   
                    const reltype  = currentRelship.type;
                    const typeView = link.typeview;
                    const defaultTypeview = reltype.typeview;
                    if (typeView && (typeView.id !== defaultTypeview.id)) {
                      return true;
                    }
                  }
                }
                else if (link.category === 'Relationship type') {
                    return false;
                }
                return false;
              }
            }),

          makeButton("Edit Attribute",
            function (e: any, obj: any) { 
              const link = obj.part.data;
              if (link.category === 'Relationship') {
                const relship = link.relship;
                const reltype = relship?.type;
                if (reltype) {
                  const choices: string[]  = [];
                  choices.push('description');
                  const props = reltype.properties;
                  for (let i=0; i<props?.length; i++) {
                    const prop = props[i];
                    choices.push(prop.name);                      
                  }
                  let defText = "";
                  if (choices.length > 0) defText = choices[0];
                  // const propname = prompt('Enter attribute name, one of ' + choices, defText);
                  // ---------------------------------
                  const modalContext = {
                    what: "selectDropdown",
                    title: "Select Attribute",
                    case: "Edit Attribute",
                    myDiagram: myDiagram
                  } 
                  myMetis.myDiagram = myDiagram;
                  myDiagram.handleOpenModal(choices, modalContext);
                  }
              } else if (link.category === 'Relationship type') {
                const choices: string[]  = [];
                choices.push('description');
                choices.push('cardinality');
                let defText = "";
                if (choices.length > 0) defText = choices[0];
                // const propname = prompt('Enter attribute name, one of ' + choices, defText);
                // ---------------------------------
                const modalContext = {
                  what: "selectDropdown",
                  title: "Select Attribute",
                  case: "Edit Attribute",
                  myDiagram: myDiagram
                } 
                myMetis.currentLink = link;
                myMetis.myDiagram = myDiagram;
                myDiagram.handleOpenModal(choices, modalContext);
              
              } 
            },
            function (o: any) { 
              const link = o.part.data;
              if (link.category === 'Relationship') {
                const relship = link.relship;
                const reltype = relship?.type;
                if (reltype) {
                  const props = reltype.properties;
                  if (props && props.length>0) {
                    return true;
                  }
                }
              } else if (link.category === 'Relationship type') {
                return true;
              }
              return false; 
            }),
          makeButton("----------"),

          makeButton("Select all views of this relationship",
            function (e: any, obj: any) {
              const link = obj.part.data;
              const myGoModel = myMetis.gojsModel;
              const relship = myMetis.findRelationship(link.relship.id)
              const rviews = relship.relshipviews;
              if (rviews) {
                for (let j=0; j<rviews.length; j++) {
                  const rv = rviews[j];
                  if (rv) {
                    const link = myGoModel.findLinkByViewId(rv?.id);
                    const gjsLink = myDiagram.findLinkForKey(link?.key);
                    if (gjsLink) gjsLink.isSelected = true;
                  }
                }
              }
            },
            function (o: any) { 
              const link = o.part.data;
              const myGoModel = myMetis.gojsModel;
              const relship = myMetis.findRelationship(link.relship.id)
              const rviews = relship.relshipviews;
              if (rviews?.length>1) {
                let cnt = 0;
                for (let j=0; j<rviews.length; j++) {
                  const rv = rviews[j];
                  if (rv) {
                    const link = myGoModel.findLinkByViewId(rv?.id);
                    if (link) {
                      const gjsLink = myDiagram.findLinkForKey(link?.key);
                      if (gjsLink) 
                        cnt++;
                    }
                  }
                }
                if (cnt > 1)
                  return true;
              }
            return false;
            }),
          makeButton("Select all relationships of this type",
            function (e: any, obj: any) {
              const link = obj.part.data;
              if (debug) console.log('984 link', link);
              const currentRelship = myMetis.findRelationship(link.relship.id)
              const currentType = currentRelship?.type;
              const myModel = myMetis.currentModel;
              const myGoModel = myMetis.gojsModel;
              const relships = myModel.getRelationshipsByType(currentType, false);
              for (let i=0; i<relships.length; i++) {
                const r = relships[i];
                if (r) {
                  const rviews = r.relshipviews;
                  if (rviews) {
                    for (let j=0; j<rviews.length; j++) {
                      const rv = rviews[j];
                      if (rv) {
                        const link = myGoModel.findLinkByViewId(rv?.id);
                        const gjsLink = myDiagram.findLinkForKey(link?.key)
                        if (gjsLink) gjsLink.isSelected = true;
                      }
                    }
                  }
                }
              }
            },
            function (o: any) { 
              return true;
            }),
          makeButton("Generate Relationship Type",             
            function (e: any, obj: any) { 
              const context = {
                "myMetis":            myMetis,
                "myMetamodel":        myMetis.currentMetamodel,
                "myTargetMetamodel":  myMetis.currentTargetMetamodel,
                "myModel":            myMetis.currentModel,
                "myCurrentModelview": myMetis.currentModelview,
                "myDiagram":          e.diagram,
                "dispatch":           e.diagram.dispatch
                }
                if (debug) console.log('935 myMetis', myMetis);
              const contextmenu = obj.part;  
              const part = contextmenu.adornedPart; 
              const currentRel = part.data.relship;
              context.myTargetMetamodel = myMetis.currentTargetMetamodel;
              if (debug) console.log('940 context', currentRel, context);
              context.myTargetMetamodel = gen.askForTargetMetamodel(context, false);
              if (context.myTargetMetamodel?.name === "IRTV Metamodel") {  
                  alert("IRTV Metamodel is not valid as Target metamodel!"); // sf dont generate on EKA Metamodel
                  context.myTargetMetamodel = null;
              } else if (context.myTargetMetamodel == undefined)  // sf
                context.myTargetMetamodel = null;
              myMetis.currentTargetMetamodel = context.myTargetMetamodel;
              if (debug) console.log('950 Generate Relationship Type', context.myTargetMetamodel, myMetis);
              if (context.myTargetMetamodel) {  
                myMetis.currentModel.targetMetamodelRef = context.myTargetMetamodel?.id;
                if (debug) console.log('953 Generate Relationship Type', context, myMetis.currentModel.targetMetamodelRef);
                const gqlModel = new gql.gqlModel(context.myModel, true);
                const modifiedModels = new Array();
                modifiedModels.push(gqlModel);
                modifiedModels.map(mn => {
                  let data = (mn) && mn;
                  data = JSON.parse(JSON.stringify(data));
                  myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
                })
                const currentRelview = part.data.relshipview;
                if (debug) console.log('962 currentRelview', currentRelview);
                const reltype = gen.generateRelshipType(currentRel, currentRelview, context);
                if (debug) console.log('964 Generate Relationship Type', reltype, myMetis);
                if (reltype) {
                  const reltypeview = reltype.typeview;
                  if (debug) console.log('976 reltype', reltype);
                  const gqlRelshipType = new gql.gqlRelationshipType(reltype);
                  if (debug) console.log('979 Generate Relationship Type', reltype,gqlRelshipType);
                  const modifiedTypeLinks = new Array();
                  modifiedTypeLinks.push(gqlRelshipType);
                  modifiedTypeLinks.map(mn => {
                    let data = (mn) && mn;
                    data = JSON.parse(JSON.stringify(data));
                    myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
                  });
                  const gqlRelTypeview = new gql.gqlRelshipTypeView(reltypeview);
                  if (debug) console.log('987 Generate Relationship Type', gqlRelTypeview);
                  const modifiedTypeViews = new Array();
                  modifiedTypeViews.push(gqlRelTypeview);
                  modifiedTypeViews?.map(mn => {
                    let data = (mn) && mn;
                    data = JSON.parse(JSON.stringify(data));
                    myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES', data })
                  })
                  if (debug) console.log('994 myMetis', myMetis);
                }
              }
            },
            function(o: any) { 
              const rel = o.part.data.relship;
              const fromObj = rel.fromObject;
              const toObj = rel.toObject;
              let reltype = rel.type;
              if (fromObj.type.name === constants.types.AKM_INFORMATION) {
                if (toObj.type.name === constants.types.AKM_INFORMATION)
                  return true;
              } else
                  return false;
            }),
          makeButton("Undo",
            function(e, obj) { e.diagram.commandHandler.undo(); 
            },
            function(o) { return o.diagram.commandHandler.canUndo(); 
            }),
          makeButton("Redo",
            function(e, obj) { 
              e.diagram.commandHandler.redo(); 
            },
            function(o) { 
              return o.diagram.commandHandler.canRedo(); 
            })
        );
    }

    // A CONTEXT MENU for the background of the Diagram, when not over any Part
    if (true) {
      myDiagram.contextMenu =
        $(go.Adornment, "Vertical",
          makeButton("New Model",
            function (e: any, obj: any) {
              const context = {
                "myMetis":            myMetis,
                "myMetamodel":        myMetis.currentMetamodel,
                "myModel":            myMetis.currentModel,
                "myTargetMetamodel":  myMetis.currentTargetMetamodel
              }

              // const modalContext = {
              //   what: "newModel",
              //   title: "New Model:",
              //   myDiagram: myDiagram
              // }
     
              // let model;
              // const metamodel = myMetis.currentMetamodel;
              // if (!metamodel) return;
              // const modelName = '<new model>'
              // model = new akm.cxModel(utils.createGuid(), modelName, metamodel, "");
              // myMetis.addModel(model);
              // const modelviewName = '<new-modelview>'
              // const curmodel = myMetis.currentModel;
              // const modelView = new akm.cxModelView(utils.createGuid(), modelviewName, curmodel);
              // model.addModelView(modelView);
              // myMetis.addModelView(modelView);
              // const data = new gql.gqlModel(model, true);
              // if (debug) console.log('593 Diagram', data);
              // e.diagram.dispatch({ type: 'LOAD_TOSTORE_NEWMODELVIEW', data }); // dispatches model with modelview
              // 
              
              let model;
              
              const metamodel = gen.askForMetamodel(context, false, true);
              // const metamodel = myMetis.currentMetamodel;

              if (!metamodel) return;
              const modelName = prompt("Enter Model name:", "");
              if (modelName == null || modelName === "") {
                alert("New operation was cancelled");
              } else {
                model = new akm.cxModel(utils.createGuid(), modelName, metamodel, "");
                myMetis.addModel(model);
                const modelviewName = prompt("Enter Modelview name:", model.name);
                if (modelviewName == null || modelviewName === "") {
                  alert("New operation was cancelled");
                } else {
                  const curmodel = myMetis.currentModel;
                  const modelView = new akm.cxModelView(utils.createGuid(), modelviewName, curmodel);
                  model.addModelView(modelView);
                  myMetis.addModelView(modelView);
                  const data = new gql.gqlModel(model, true);
                  if (debug) console.log('593 Diagram', data);
                  e.diagram.dispatch({ type: 'LOAD_TOSTORE_NEWMODELVIEW', data }); // dispatches model with modelview
                }
              }

              // myMetis.currentNode = node;
              // const node  = {model, category: 'Model' } 
              // myMetis.myDiagram = myDiagram;
              // myDiagram.handleOpenModal(node, modalContext);

            },
            function (o: any) {
              return true; 
            }),
          makeButton("New Modelview",
          function (e: any, obj: any) {
            const model = myMetis.currentModel;
            const modelviewName = prompt("Enter Modelview name:", "");
            if (modelviewName == null || modelviewName === "") {
              alert("New operation was cancelled");
            } else {
              const modelView = new akm.cxModelView(utils.createGuid(), modelviewName, model);
              model.addModelView(modelView);
              myMetis.addModelView(modelView);
              if (debug) console.log('585 myMetis', myMetis);
              const data = new gql.gqlModel(model, true);
              if (debug) console.log('595 NewModelView', data);
              e.diagram.dispatch({ type: 'LOAD_TOSTORE_NEWMODELVIEW', data });
            }
          },
          function (o: any) { 
            return true; 
            }),
          makeButton("Set Modelview as Template",
            function (e: any, obj: any) {
              const modelview = myMetis.currentModelview;
              const model = myMetis.currentModel;
              model.addTemplate(modelview);
              modelview.setIsTemplate(true);
              model.setIsTemplate(true);
              if (debug) console.log('935 myMetis', myMetis);
              alert("Current modelview has been set as template");
            },
            function (o: any) { 
              return false; 
            }),
          makeButton("Delete Current Model",
          function (e: any, obj: any) {
            const modifiedModels = new Array();
            const model = myMetis.currentModel as akm.cxModel;
            if (confirm('Do you really want to delete the current model?')) {
                model.deleted = true;
                const gqlModel = new gql.gqlModel(model, true);
                if (debug) console.log('2082 gqlModel', gqlModel);
                modifiedModels.push(gqlModel);
                modifiedModels.map(mn => {
                  let data = mn;
                  e.diagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
                })
            } else
              return;
          },
          function (o: any) { 
            let cnt = 0;
            const models = myMetis.models;
            for (let i=0; i<models.length; i++) {
              const model = models[i];
              if (model.deleted)
                continue;
              cnt++;
            }
            if (cnt>1)
              return true; 
            else 
              return false;
            }),
          makeButton("Delete Current Modelview",
            function (e: any, obj: any) {
              const model = myMetis.currentModel as akm.cxModel;
              const modelView = myMetis.currentModelview as akm.cxModelView;
              if (confirm('Do you really want to delete the current modelview?')) {
                  modelView.deleted = true;
                  const gqlModelview = new gql.gqlModelView(modelView);
                  // Delete the content
                  const objviews = modelView.objectviews;
                  for (let i=0; i<objviews?.length; i++) {
                      const objview = objviews[i];
                      objview.deleted = true;
                      const obj = objview.object;
                      const oviews = obj?.objectviews;
                      if (oviews.length == 1) {
                        obj.deleted = true;
                      }
                  }
                  const relviews = modelView.relshipviews;
                  for (let i=0; i<relviews?.length; i++) {
                      const relview = relviews[i];
                      relview.deleted = true;
                  }
                  if (debug) console.log('1808 myMetis', myMetis);
                  const modifiedModelviews = new Array();
                  modifiedModelviews.push(gqlModelview);
                  modifiedModelviews.map(mn => {
                    let data = mn;
                    e.diagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
                  })
              } else
                return;
            },
            function (o: any) { 
              const model = myMetis.currentModel as akm.cxModel;
              let cnt = 0;
              const mviews = model.modelviews;
              for (let i=0; i<mviews.length; i++) {
                const mview = mviews[i];
                if (mview.deleted)
                  continue;
                cnt++;
              }
              if (cnt>1)
                return true; 
              else 
                return false;
              }),
          makeButton("New Target Model",
            function (e: any, obj: any) {
              let model;
              const metamodel = myMetis.currentTargetMetamodel;
              if (debug) console.log('819 Diagram', myMetis);
              
              const modelName = prompt("Enter Target Model name:", "");
              if (modelName == null || modelName === "") {
                alert("New operation was cancelled");
              } else {
                model = new akm.cxModel(utils.createGuid(), modelName, metamodel, "");
                if (debug) console.log('824 Diagram', metamodel, model);    
                myMetis.addModel(model);
                const modelviewName = prompt("Enter Modelview name:", model.name);
                if (modelviewName == null || modelviewName === "") {
                  alert("New operation was cancelled");
                } else {
                  const curmodel = myMetis.currentModel;
                  const modelView = new akm.cxModelView(utils.createGuid(), modelviewName, curmodel);
                  model.addModelView(modelView);
                  myMetis.addModelView(modelView);
                  const data = new gql.gqlModel(model, true);
                  if (debug) console.log('593 Diagram', data);
                  e.diagram.dispatch({ type: 'LOAD_TOSTORE_NEWMODELVIEW', data });
                }
              }
            },
            function (o: any) {
              const metamodel = myMetis.currentTargetMetamodel;
              if (metamodel)
                return true; 
              else
                return false;
            }),
          makeButton("Set Target Model",
          function (e: any, obj: any) {
            const context = {
              "myMetis":            myMetis,
              "myMetamodel":        myMetis.currentMetamodel, 
              "myModel":            myMetis.currentModel,
              "myModelview":        myMetis.currentModelview,
              "myTargetMetamodel":  myMetis.currentTargetMetamodel,
              "myDiagram":          e.diagram
            }
            const modalContext = {
              what: "selectDropdown",
              title: "Select Target Model",
              case: "Set Target Model",
              myDiagram: myDiagram
            } 
            const mmNameIds = myMetis.models.map(mm => mm && mm.nameId)
            if (debug) console.log('2194', mmNameIds, modalContext);
            myDiagram.handleOpenModal(mmNameIds, modalContext);
          
          },
          function (o: any) {
            return true; 
            }),
          makeButton("----------"),
          makeButton("Edit Project",
            function (e: any, obj: any) {
              const currentName = myMetis.name; 
              const projectName = prompt("Enter Project name:", currentName);
              if (projectName?.length > 0) {
                myMetis.name = projectName;
              }
              const currentDescr = myMetis.description; 
              const projectDescr = prompt("Enter Project description:", currentDescr);
              if (projectDescr?.length > 0) {
                myMetis.description = projectDescr;
              }
              const project = {
                // "id":           myMetis.id, // ToDo: add id to project
                "name":         myMetis.name,
                "description":  myMetis.description
              }
              const modifiedProjects = new Array();  // metis-objektet i phData
              modifiedProjects.push(project);
              modifiedProjects?.map(mn => {
                let data = (mn) && mn
                e.diagram?.dispatch({ type: 'UPDATE_PROJECT_PROPERTIES', data })
              })
            },
            function (o: any) { 
              return true; 
            }),
            makeButton("Edit Model",
            function (e: any, obj: any) {
              const currentModel = myMetis.currentModel; 
              const currentName = currentModel.name;
              const modelName = prompt("Enter Model name:", currentName);
              if (modelName?.length > 0) {
                currentModel.name = modelName;
              }
              const currentDescr = currentModel.description; 
              const modelDescr = prompt("Enter Model description:", currentDescr);
              if (modelDescr?.length > 0) {
                currentModel.description = modelDescr;
              }
              const gqlModel = new gql.gqlModel(currentModel, true);
              const modifiedModels = new Array();  
              modifiedModels.push(gqlModel);
              modifiedModels?.map(mn => {
                let data = (mn) && mn
                e.diagram?.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
              })
            },
            function (o: any) { 
              return true; 
            }),
            makeButton("Edit Modelview",
            function (e: any, obj: any) {
              const currentModelview = myMetis.currentModelview; 
              let currentName = currentModelview.name;
              const modelviewName = prompt("Enter Modelview name:", currentName);
              if (modelviewName?.length > 0) {
                currentModelview.name = modelviewName;
              }
              const currentDescr = currentModelview.description; 
              const modelviewDescr = prompt("Enter Modelview description:", currentDescr);
              if (modelviewDescr?.length > 0) {
                currentModelview.description = modelviewDescr;
              }
              const gqlModelview = new gql.gqlModelView(currentModelview);
              const modifiedModelviews = new Array();  
              modifiedModelviews.push(gqlModelview);
              modifiedModelviews?.map(mn => {
                let data = (mn) && mn
                e.diagram?.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
              })
            },
            function (o: any) { 
              return true; 
            }),
          makeButton("----------"),
          makeButton("New Metamodel",
          function (e: any, obj: any) {
            const context = {
              "myMetis":            myMetis,
              "myMetamodel":        myMetis.currentMetamodel,
              "myDiagram":          e.diagram
            }
            const metamodel = gen.askForMetamodel(context, true);
            if (debug) console.log('760 New Metamodel', metamodel);
            if (metamodel) {
              const gqlMetamodel = new gql.gqlMetaModel(metamodel, true);
              if (debug) console.log('763 New Metamodel', gqlMetamodel);
              const modifiedMetamodels = new Array();
              modifiedMetamodels.push(gqlMetamodel);
              modifiedMetamodels.map(mn => {
                  let data = mn;
                  if (debug) console.log('768 data', data);
                  e.diagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data })
              });
            }
          },
          function (o: any) {
            return true; 
          }),
          makeButton("Generate Metamodel",
          function (e: any, obj: any) { 
            const context = {
              "myMetis":            myMetis,
              "myMetamodel":        myMetis.currentMetamodel,
              "myTargetMetamodel":  myMetis.currentTargetMetamodel,
              "myModel":            myMetis.currentModel,
              "myCurrentModelview": myMetis.currentModelview,
              "myDiagram":          e.diagram,
              "dispatch":           e.diagram.dispatch
            }
            context.myTargetMetamodel = gen.askForTargetMetamodel(context, false);
            if (context.myTargetMetamodel?.name === "IRTV Metamodel") {  
                  alert("IRTV Metamodel is not valid as Target metamodel!"); // sf dont generate on EKA Metamodel
                  context.myTargetMetamodel = null;
            } else if (context.myTargetMetamodel == undefined)  // sf
                context.myTargetMetamodel = null;
            myMetis.currentTargetMetamodel = context.myTargetMetamodel;
            const targetMetamodel = myMetis.currentTargetMetamodel;
            const sourceModelview = myMetis.currentModelview;
            gen.generateTargetMetamodel(targetMetamodel, sourceModelview, context);
            if (debug) console.log('2489 Target metamodel', targetMetamodel);
          },
          function (o: any) { 
            return true; 
          }),
          makeButton("Set Target Metamodel",
            function (e: any, obj: any) {
              const context = {
                "myMetis":            myMetis,
                "myMetamodel":        myMetis.currentMetamodel, 
                "myModel":            myMetis.currentModel,
                "myModelview":        myMetis.currentModelview,
                "myTargetMetamodel":  myMetis.currentTargetMetamodel,
                "myDiagram":          e.diagram
              }
              const modalContext = {
                what: "selectDropdown",
                title: "Select Target Metamodel",
                case: "Set Target Metamodel",
                myDiagram: myDiagram
              } 
              const mmNameIds = myMetis.metamodels.map(mm => mm && mm.nameId)
              if (debug) console.log('2511', mmNameIds, modalContext, context);
              myDiagram.handleOpenModal(mmNameIds, modalContext);
            },
            function (o: any) { 
              return true; 
            }),
          makeButton("Paste",
            function (e: any, obj: any) {
              myMetis.pasteViewsOnly = false;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
            },
            function (o: any) { 
              return o.diagram.commandHandler.canPasteSelection(); 
            }),
          makeButton("Paste View",
            function (e: any, obj: any) {
              myMetis.pasteViewsOnly = true;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
            },
            function (o: any) { 
              //return false;
              return o.diagram.commandHandler.canPasteSelection(); 
            }),
          makeButton("Undo",
            function (e: any, obj: any) { 
              e.diagram.commandHandler.undo(); 
            },
            function (o: any) { 
              return o.diagram.commandHandler.canUndo(); 
            }),
          makeButton("Redo",
            function (e: any, obj: any) { 
              e.diagram.commandHandler.redo(); 
            },
            function (o: any) { 
              return o.diagram.commandHandler.canRedo(); 
            }),
          makeButton("----------"),
          makeButton("Add Missing Relationship Views",
          function (e: any, obj: any) { 
            const modelview = myMetis.currentModelview;
            const objviews = modelview.objectviews;
            const relviews = new Array();
            const modifiedRelshipViews = new Array();
            for (let i=0; i<objviews.length; i++) {
              const objview = objviews[i];
              const obj = objview.object;
              const outrels = obj?.outputrels;
              for (let j=0; j<outrels?.length; j++) {
                const rel = outrels[j];
                if (rel.deleted) continue;
                const rviews = rel.relviews;
                if (rviews?.length > 0) {
                  // Relview is NOT missing - do nothing
                  continue;
                }
                if (debug) console.log('2183 rviews', rel, rviews);
                // Check if from- and to-objects have views in this modelview
                const fromObj = rel.fromObject;
                const fromObjviews = fromObj.objectviews;
                if (fromObjviews?.length == 0) {
                  // From objview is NOT in modelview - do nothing
                  continue;
                }
                if (debug) console.log('2191 fromObjviews', fromObjviews);
                const toObj = rel.toObject;
                const toObjviews = toObj.objectviews;
                if (toObjviews?.length == 0) {
                  // From objview is NOT in modelview - do nothing
                  continue;
                }
                if (debug) console.log('2198 toObjviews', toObjviews);
                // Relview(s) does not exist, but from and to objviews exist, create relview(s)
                const relview = new akm.cxRelationshipView(utils.createGuid(), rel.name, rel, rel.description);
                if (relview.deleted) continue;
                relview.setFromObjectView(fromObjviews[0]);
                relview.setToObjectView(toObjviews[0]);
                if (debug) console.log('2203 relview', relview);
                // Add link
                const myGoModel = myMetis.gojsModel;
                let link = new gjs.goRelshipLink(utils.createGuid(), myGoModel, relview);
                link.loadLinkContent(myGoModel);
                myGoModel.addLink(link);
                // Prepare and do the dispatch
                const gqlRelview = new gql.gqlRelshipView(relview);
                modifiedRelshipViews.push(gqlRelview);
              }
            }
            modifiedRelshipViews.map(mn => {
              let data = mn;
              myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
            })
            if (debug) console.log('2213 myMetis', myMetis);
          },
          function (o: any) { 
            return true; 
          }),
          makeButton("Delete Invisible Objects",
            function (e: any, obj: any) { 
              if (confirm('Do you really want to delete all invisible objects?')) {
                const modifiedObjects = new Array();
                const objects = myMetis.objects;
                for (let i=0; i<objects.length; i++) {
                  const obj = objects[i];
                  const objtype = obj?.type;
                  if (obj.name === objtype?.name) {
                    if (obj.objectviews == null) {
                      obj.deleted = true;
                      const obj1 = myMetis.findObject(obj.id);
                      if (obj1) obj1.deleted = true;
                      const gqlObj = new gql.gqlObject(obj);
                      modifiedObjects.push(gqlObj);
                    }
                  }
                } 
                if (debug) console.log('2311 modifiedObjects', modifiedObjects);
                modifiedObjects.map(mn => {
                  let data = mn;
                  e.diagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
                })              

                const modifiedObjviews = new Array();
                const objviews = myMetis.objectviews;
                for (let i=0; i<objviews.length; i++) {
                  const objview = objviews[i];
                  const obj = objview?.object;
                  if (obj == null) {
                      objview.deleted = true;
                      const objview1 = myMetis.findObjectView(objview.id);
                      if (objview1) objview1.deleted = true;
                      const gqlObjview = new gql.gqlObjectView(objview);
                      modifiedObjviews.push(gqlObjview);
                  }
                } 
                if (debug) console.log('2328 modifiedObjviews', modifiedObjviews);
                modifiedObjviews.map(mn => {
                  let data = mn;
                  e.diagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
                })              
                if (debug) console.log('2333 myMetis', myMetis);
              }
            },
            function (o: any) { 
              return true; 
            }),
          makeButton("Select all objects of type",
            function (e: any, obj: any) {
              const myModel = myMetis.currentModel;
              const myModelview = myMetis.currentModelview;
              const myGoModel = myMetis.gojsModel;
              const typename = prompt("Enter object type name", "");
              const objects = myModel.getObjectsByTypename(typename, false);
              let firstTime = true;
              for (let i=0; i<objects.length; i++) {
                const o = objects[i];
                if (o) {
                  const oviews = o.objectviews;
                  if (oviews) {
                    for (let j=0; j<oviews.length; j++) {
                      const ov = oviews[j];
                      if (ov) {
                        const node = myGoModel.findNodeByViewId(ov?.id);
                        const gjsNode = myDiagram.findNodeForKey(node?.key)
                        if (gjsNode) {
                          if (firstTime) {
                            myDiagram.select(gjsNode);   
                            firstTime = false;                                  
                          } else {
                            gjsNode.isSelected = true;
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            function (o: any) { 
              return true;
            }),
          makeButton("Select by Object Name",
            function (e: any, obj: any) { 
              const value = prompt('Enter name ', "");
              const name = new RegExp(value, "i");
              const results = myDiagram.findNodesByExample(
                { name: value });
              if (debug) console.log('2288 results', value, results);
              const it = results.iterator;
              while (it.next()) {
                const node = it.value;
                const gjsNode = myDiagram.findNodeForKey(node?.key);
                if (gjsNode) gjsNode.isSelected = true;
              }    
            },
            function (o: any) { 
              return true; 
            }),
          makeButton("Verify and Repair Model",
            function (e: any, obj: any) {
              if (debug) console.log('2340 myMetis', myMetis);
              const myModel = myMetis.currentModel;
              const myModelview = myMetis.currentModelview;
              const myMetamodel = myMetis.currentMetamodel;
              const myGoModel = myMetis.gojsModel;
              if (debug) console.log('2346 myMetis', myMetis);
              myDiagram.myGoModel = myGoModel;
              if (debug) console.log('2345 model, metamodel', myModelview, myModel, myMetamodel, myDiagram.myGoModel);
              uic.verifyAndRepairModel(myModelview, myModel, myMetamodel, myDiagram, myMetis);
              if (debug) console.log('2348 myMetis', myMetis);
              alert("The current model has been repaired");
            },
            function (o: any) { 
              return true; 
            }),
          makeButton("----------"),
          makeButton("Zoom All",
            function (e: any, obj: any) {
              e.diagram.commandHandler.zoomToFit();
            },
            function (o: any) { 
              return true; 
            }),
          makeButton("Zoom Selection",
            function (e: any, obj: any) {
              let selected = myDiagram.selection;
              let x1 = 0;
              let y1 = 0;
              let x2 = 0;
              let y2 = 0;
              let w = 0;
              let h = 0;
              myDiagram.selection.each(function(node) {
                  if (x1 == 0) x1 = node.actualBounds.x;
                  if (y1 == 0) y1 = node.actualBounds.y;
                  if (w == 0)  w  = node.actualBounds.width;
                  if (h == 0)  h  = node.actualBounds.height;
                  x2 = x1 + w;
                  y2 = y1 + h;
                  const X1 = node.actualBounds.x;
                  if (X1 < x1) x1 = X1;
                  const Y1 = node.actualBounds.y;
                  if (Y1 < y1) y1 = Y1;
                  const W = node.actualBounds.width;
                  const X2 = X1 + W;
                  const H = node.actualBounds.height;
                  const Y2 = Y1 + H;
                  // Compare
                  if (X2 > x2) x2 = X2;
                  if (Y2 > y2) y2 = Y2;
                  w = x2 - x1;
                  h = y2 - y1;
              });
              const rect = new go.Rect(x1, y1, w, h);
              myDiagram.zoomToRect(rect);
            },
            function (o: any) { 
              if (myDiagram.selection.count > 0)
                return true; 
              return false;
            }),
          makeButton("----------"),
          makeButton("!!! PURGE DELETED !!!",
            function (e: any, obj: any) { 
              if (confirm('Do you really want to permamently delete all instances marked as deleted?')) {
                if (debug) console.log('2402 myMetis', myMetis.currentModel.objects);
                uic.purgeDeletions(myMetis, myDiagram); 
                if (debug) console.log('2404 myMetis', myMetis);
              }
            },
            function (o: any) { 
              return true; 
            }),
        )
      }        

    // Define invisible layer 'AdminLayer'
    const forelayer = myDiagram.findLayer("Foreground");
    myDiagram.addLayerBefore($(go.Layer, { name: "AdminLayer" }), forelayer);
    const layer = myDiagram.findLayer('AdminLayer');
    layer.visible = false;
  
      // Define a Node template
    let nodeTemplate;
    if (true) {
      nodeTemplate =
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
          new go.Binding("layerName", "layer"),
          // { locationSpot: go.Spot.Center},
          new go.Binding("deletable"),
          new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
          {
            toolTip:
              $(go.Adornment, "Auto",
                $(go.Shape, { fill: "lightyellow" }),
                $(go.TextBlock, { margin: 4 },  // the tooltip shows the result of calling nodeInfo(data)
                  new go.Binding("text", "", nodeInfo))
              )
          },
          $(go.Shape, 'RoundedRectangle',
            {
              cursor: "alias",        // cursor: "pointer",
              name: 'SHAPE', fill: 'red', stroke: "black",  strokeWidth: 1, 
              shadowVisible: true,
              // set the port properties:
              portId: "",
              fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
              toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true},
              // Shape bindings
              new go.Binding('fill', 'fillcolor'),
              new go.Binding('stroke', 'strokecolor'), 
              // new go.Binding('strokeWidth', 'strokewidth'), //sf:  the linking of relationships does not work if this is uncommented
            { contextMenu: partContextMenu },    
            ),
      
          $(go.Panel, "Table", 
            { defaultAlignment: go.Spot.Left, margin: 0, cursor: "move" },
            $(go.RowColumnDefinition, { column: 1, width: 4 }),
            $(go.Panel, "Horizontal",
              { margin: new go.Margin(0, 0, 0, 0) },
              $(go.Panel, "Vertical",
                $(go.Panel, "Spot",
                  { contextMenu: partContextMenu },
                  $(go.Shape, {  // this is the square around the image
                    fill: "white", stroke: "#ddd", opacity: "0.4",
                    desiredSize: new go.Size(50, 50), 
                    margin: new go.Margin(0, 6, 0, 2),
                    // shadowVisible: true,
                  },
                  // new go.Binding("fill", "color"),
                  new go.Binding("figure")),
                  $(go.Picture,  // the image
                    // { contextMenu: partContextMenu },
                    {
                      name: "Picture",
                      desiredSize: new go.Size(46, 46),
                      // margin: new go.Margin(2, 2, 2, 4),
                      // margin: new go.Margin(4, 4, 4, 4),
                    },
                    new go.Binding("source", "icon", findImage)
                  ),
                ),
              ),
              // define the panel where the text will appear
              $(go.Panel, "Table",
                { contextMenu: partContextMenu },
                {
                  defaultRowSeparatorStroke: "black",
                  maxSize: new go.Size(166, 999),
                  // margin: new go.Margin(2),
                  defaultAlignment: go.Spot.Left,
                },
                $(go.RowColumnDefinition, { column: 2, width: 4 }),
                // content
                $(go.TextBlock, textStyle(),  // the name
                  {
                    isMultiline: false,  // don't allow newlines in text
                    editable: true,  // allow in-place editing by user
                    row: 0, column: 0, columnSpan: 6,
                    font: "10pt Segoe UI,sans-serif",
                    minSize: new go.Size(80, 16), 
                    height: 42,
                    verticalAlignment: go.Spot.Center,
                    // stretch: go.GraphObject.Fill, // added to not resize object
                    // overflow: go.TextBlock.OverflowEllipsis, // added to not resize object
                    margin: new go.Margin(0,0,0,0),
                    name: "name"
                  },        
                  new go.Binding("text", "name").makeTwoWay()
                ),
                new go.Binding("choices"),
                $(go.TextBlock, textStyle(), // the typename
                  {
                    row: 1, column: 1, columnSpan: 6,
                    editable: false, isMultiline: false,
                    minSize: new go.Size(10, 4),
                    margin: new go.Margin(2, 0, 0, 2)
                  },
                  new go.Binding("text", "typename")
                  //new go.Binding("text", "choices")
                ),
              ),
            ),
          ),
        );
    }
    // Define a link template
    let linkTemplate;
    if (true) {
      const dotted = [3, 3];
      const dashed = [5, 5];

        linkTemplate =
        $(go.Link,
          new go.Binding("deletable"),
          { relinkableFrom: true, relinkableTo: true, toShortLength: 2 },
          // new go.Binding('relinkableFrom', 'canRelink').ofModel(),
          // new go.Binding('relinkableTo', 'canRelink').ofModel(),
          {
            toolTip:
              $(go.Adornment, "Auto",
                { background: "transparent" },  // avoid hiding tooltip when mouse moves
                $(go.Shape, { fill: "#FFFFCC" }),
                $(go.TextBlock, { margin: 4,  },  // the tooltip shows the result of calling linkInfo(data)
                  new go.Binding("text", "", linkInfo))
              )
          },
          {
            routing: go.Link.AvoidsNodes,
            // routing: go.Link.Orthogonal,
            routing: go.Link.Normal,
            // curve: go.Link.JumpOver,
            curve: go.Link.JumpGap,
            corner: 10
          },  // link route should avoid nodes
          { contextMenu: linkContextMenu },
          new go.Binding("points").makeTwoWay(),
          $(go.Shape, { stroke: "black", strokeWidth: "1", strokeDashArray: null, shadowVisible: true, },
            new go.Binding("stroke", "strokecolor"),
            new go.Binding("strokeWidth", "strokewidth"),
            new go.Binding("strokeDashArray", "dash",
            function(d) { return d === "Dotted Line" ? dotted :
                                (d === "Dashed Line" ? dashed : null); }),
          ),
          $(go.TextBlock,     // this is a Link label
            {
              isMultiline: false,  // don't allow newlines in text
              editable: true,  // allow in-place editing by user
            }),
          $(go.Shape, { fromArrow: "", stroke: null },
            new go.Binding("fromArrow", "fromArrow"),
          ),
          $(go.Shape, { toArrow: "Standard", stroke: null },
            new go.Binding("toArrow", "toArrow"),
          ),
          $(go.TextBlock,     // this is a Link label
            {
              isMultiline: false,  // don't allow newlines in text
              editable: true,  // allow in-place editing by user
              //textEditor: customEditor,
            },

            new go.Binding("text", "name").makeTwoWay(),
            new go.Binding("text", "choices"),
          ),
          $(go.TextBlock, "", { segmentOffset: new go.Point(0, -10) }),
          $(go.TextBlock, "", { segmentOffset: new go.Point(0, 10) }),
        );
    }
    // Define the group template with fixed size containers
    if (true) {
      var groupTemplate =
      $(go.Group, "Auto",
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding("visible"),
        { contextMenu: partContextMenu },
        {
          selectionObjectName: "SHAPE",  // selecting a lane causes the body of the lane to be highlit, not the label
          locationObjectName: "SHAPE",
          resizable: true, resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
          subGraphExpandedChanged: function (grp) {
            var shp = grp.resizeObject;
            if (grp.diagram.undoManager.isUndoingRedoing) return;
            if (grp.isSubGraphExpanded) {
              // shp.height = grp._savedBreadth;
              shp.fill = "white"
            } else {
              // grp._savedBreadth = shp.height;
              // shp.height = NaN;
              shp.fill = "transparent"
            }
          },
        },

        {
          background: "transparent",
          ungroupable: true,
          // highlight when dragging into the Group
          mouseDragEnter: function (e, grp, prev) { highlightGroup(e, grp, true); },
          mouseDragLeave: function (e, grp, next) { highlightGroup(e, grp, false); },
          computesBoundsAfterDrag: true,
          // when the selection is dropped into a Group, add the selected Parts into that Group;
          // if it fails, cancel the tool, rolling back any changes
          // mouseDrop: finishDrop,
          handlesDragDropForMembers: true,  // don't need to define handlers on member Nodes and Links
          // Groups containing Nodes lay out their members vertically
          //layout: $(go.TreeLayout)
        },
        //new go.Binding("layout", "groupLayout"),
        new go.Binding("background", "isHighlighted",
          function (h) {
            return h ? "rgba(255,0,0,0.2)" : "transparent"; // this is te background of all
            }
        ).ofObject(),
        {
          toolTip:
            $(go.Adornment, "Auto",
              $(go.Shape, { fill: "lightyellow" }),
              $(go.TextBlock, { margin: 4 },  // the tooltip shows the result of calling nodeInfo(data)
                new go.Binding("text", "", nodeInfo))
            )
        },
        $(go.Shape, "RoundedRectangle", // surrounds everything
          // {
          //   stroke: "gray", strokeWidth: "1",
          // },
          // new go.Binding("stroke", "strokecolor"),
          // new go.Binding("strokeWidth", "strokewidth"),
          {
            cursor: "alias",
            fill: "transparent", 
            // stroke: "black", 
            shadowVisible: true,
            // strokeWidth: 1,
            minSize: new go.Size(20, 30),
            portId: "", 
            fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
            toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true,
          },
          new go.Binding("fill", "fillcolor"),
          // new go.Binding("stroke", "strokecolor"),
          // new go.Binding("strokeWidth", "strokewidth"),
        ),
        $(go.Panel,  // the header
          $(go.Picture, //"actualBounds",                  // the image
            {
              name: "Picture",
              minSize: new go.Size(30, 20),
              // desiredSize: new go.Size(300, 200),
              // minSize: new go.Binding("minSize", "size"),
              margin: new go.Margin(16, 0, 0, 0),
            },
            // new go.Binding("desiredSize", "size"),
            new go.Binding("source", "icon", findImage)
          ),
        ), 
        $(go.Panel, "Vertical",  // position header above the subgraph
          {
            name: "HEADER",
            defaultAlignment: go.Spot.TopLeft
          },
          $(go.Panel, "Horizontal",  // the header
            { defaultAlignment: go.Spot.Top },
            $("SubGraphExpanderButton",
            {margin: new go.Margin(4, 0, 0, 4)},
            ),  // this Panel acts as a Button
            
            $(go.TextBlock,     // group title near top, next to button
              {
                font: "Bold 12pt Sans-Serif",
                margin: new go.Margin(4, 0, 0, 2),
                editable: true, isMultiline: false,
                name: "name"
              },
              new go.Binding("text", "name").makeTwoWay()
            ),
            $(go.TextBlock, textStyle(), // the typename
            {
              row: 1, column: 1, columnSpan: 6, textAlign: "end",
              editable: false, isMultiline: false,
              minSize: new go.Size(10, 4),
              margin: new go.Margin(2, 0, 0, 2)
            },
            // new go.Binding("text", "typename")
            //new go.Binding("text", "choices")
          ),
          ), // End Horizontal Panel
          $(go.Shape,  // using a Shape instead of a Placeholder - this is open container
            {
              // name: "SHAPE", //fill: "rgba(228,228,228,0.53)",
              // name: "SHAPE", fill: "transparent",
              name: "SHAPE", fill: "white",
              opacity: "0.9",
              minSize: new go.Size(180, 120), 
              desiredSize: new go.Size(300, 200),
              margin: new go.Margin(0, 1, 1, 4),
              cursor: "move",
            },
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
            new go.Binding("isSubGraphExpanded").makeTwoWay(),
            
          ),
        ),

      )      
    }

    // define template maps
    if (true) {
      // Define node template map
      let nodeTemplateMap = new go.Map<string, go.Part>();
      nodeTemplateMap.add("", nodeTemplate);
      nodeTemplateMap.add("LinkLabel",
      $("Node",
        {
          selectable: false, avoidable: false,
          layerName: "Foreground"
        },  // always have link label nodes in front of Links
        $("Shape", "Ellipse",
          {
            width: 5, height: 5, stroke: null,
            portId: "", fromLinkable: true, toLinkable: false, cursor: "pointer"
          })
      ));

      // Define link template map
      let linkTemplateMap = new go.Map<string, go.Link>();
      linkTemplateMap.add("", linkTemplate);

      // This template shows links connecting with label nodes as green and arrow-less.
      myDiagram.linkTemplateMap.add("linkToLink",
        $("Link",
          { relinkableFrom: false, relinkableTo: false },
          $("Shape", { stroke: "#2D9945", strokeWidth: 2 })
        ));

      // Define group template map
      let groupTemplateMap = new go.Map<string, go.Group>();
      groupTemplateMap.add("", groupTemplate);

      // Set the diagram template maps
      myDiagram.nodeTemplateMap = nodeTemplateMap;
      myDiagram.linkTemplateMap = linkTemplateMap;
      myDiagram.groupTemplateMap = groupTemplateMap;
    }

    // Whenever a new Link is drawng by the LinkingTool, it also adds a node data object
    // that acts as the label node for the link, to allow links to be drawn to/from the link.
    myDiagram.toolManager.linkingTool.archetypeLabelNodeData =
      { category: "LinkLabel" };

    // Palette group template 1
    if (true) {
      var paletteGroupTemplate1 =
        $(go.Group, "Auto",
          // for sorting, have the Node.text be the data.name
          new go.Binding("text", "name"),

          // define the node's outer shape
          $(go.Shape, "Rectangle",
            {
              name: "SHAPE", fill: "lightyellow",
              // opacity: "0.7",
              //desiredSize: new go.Size(100, 20),
              //margin: new go.Margin(100, 0, 0, 0),
            },
          ),

          $(go.Panel, "Vertical",
            // define the panel where the text will appear
            $(go.Panel, "Table",
              {
                defaultRowSeparatorStroke: "black",
                maxSize: new go.Size(150, 999),
                margin: new go.Margin(6, 10, 0, 3),
                defaultAlignment: go.Spot.Left
              },
              $(go.RowColumnDefinition, { column: 2, width: 4 }
              ),
              // content
              $(go.TextBlock, textStyle(),  // the name
                {
                  row: 0, column: 0, columnSpan: 6,
                  font: "12pt Segoe UI,sans-serif",
                  editable: true, isMultiline: false,
                  minSize: new go.Size(10, 16),
                  name: "name"
                },
                new go.Binding("text", "name").makeTwoWay()),
            ),
          )
        );
    }

    // this DiagramEvent handler is called during the linking or relinking transactions
    function maybeChangeLinkCategory(e: any) {
      var link = e.subject;
      var linktolink = (link.fromNode?.isLinkLabel || link.toNode?.isLinkLabel);
      e.diagram.model.setCategoryForLinkData(link.data, (linktolink ? "linkToLink" : ""));
    }
    
    function makeButton(text: string, action: any, visiblePredicate: any) {
      return $("ContextMenuButton",
        $(go.TextBlock, text),
        { click: action },
        // don't bother with binding GraphObject.visible if there's no predicate
        visiblePredicate ? new go.Binding("visible", "",
          function (o, e) {
            return o.diagram ? visiblePredicate(o, e) : false;
          }).ofObject() : {}
      );
    }

    return myDiagram;

    // Function to identify images related to an image id
    function findImage(image: string) {
      if (!image)
        return "";
      // if (image.substring(0,4) === 'http') { // its an URL
      if (image.includes('//')) { // its an URL   
        // if (debug) console.log('1269 Diagram', image);
        return image
      } else if (image.includes('/')) { // its a local image
        if (debug) console.log('1270 Diagram', image);   
        return image
      } else if (image.includes('.') === false) { // its a 2character icon 1st with 2nd as subscript
        const firstcharacter = image.substring(0, 1)
        const secondcharacter = image.substring(1, 2)
        if (debug) console.log('1099 Diagram', firstcharacter, secondcharacter)    
        // } else if (image.substring(image.length - 4) === '.svg') { //sf tried to use svg data but did not work
        //   const letter = image.substring(0, image.length - 4)
        //   // const lettersvg = letter
        //   if (debug) console.log('1058 Diagram', letter, svgs[letter])
        //   return svgs[letter].svg //svgs[`'${letter}'`]
        // } else if (image.includes('fakepath')) { // its a local image
        //   console.log('3025', image);
        //   console.log("3027 ./../images/" + image.replace(/C:\\fakepath\\/,'')) //its an image in public/images
        //   return "./../images/" + image.replace(/C:\\fakepath\\/,'') //its an image in public/images
        
      } else { 
        if (debug) console.log('1283 Diagram', image);
        return "./../images/" + image //its an image in public/images
      }
      return "";
    }

    // Function to specify default text style
    function textStyle() {
      return { font: "9pt  Segoe UI,sans-serif", stroke: "black" };
    }

    // Function to highlight group
    function highlightGroup(e: any, grp: any, show: boolean) {
      if (!grp) return;
      e.handled = true;
      if (show) {
        // cannot depend on the grp.diagram.selection in the case of external drag-and-drops;
        // instead depend on the DraggingTool.draggedParts or .copiedParts
        var tool = grp.diagram.toolManager.draggingTool;
        var map = tool.draggedParts || tool.copiedParts;  // this is a Map
        // now we can check to see if the Group will accept membership of the dragged Parts
        if (grp.canAddMembers(map.toKeySet())) {
          grp.isHighlighted = true;
          return;
        }
      }
      grp.isHighlighted = false;
    }
  }

  public render() {
    if (debug) console.log('2804 Diagram', this.props.nodeDataArray);
    if (debug) console.log('2805 Diagram', this.props.linkDataArray);

    if (debug) console.log('2807 Diagram ', this.state.selectedData, this.state.myMetis);
    
    let modalContent, inspector, selector, header, category, typename;
    const modalContext = this.state.modalContext;
    if (debug) console.log('2811 modalContext ', modalContext);
    const icon = modalContext?.icon;

    switch (modalContext?.what) {      
      case 'selectDropdown': 

        let options =  '' 
        let comps = ''
        const { Option } = components
        const CustomSelectOption = props => 
        (
          <Option {...props}>
            <img className="option-img mr-2" src={props.data.value} />
            {props.data.label}
          </Option>
        )
        const CustomSelectValue = props => (
          <div>
            {/* <i className={`icon icon-${props.data.icon}`} /> */}
            <img className="option-img mr-2" src={props.data.value} />
             {props.data.label}
          </div>
        )
        if (modalContext?.title === 'Select Icon') {
          let img 
          options = this.state.modalContext.iconList.map(icon => {
            img = (icon.value.includes('//')) ? icon.value : './../images/'+icon.value 
            return {value: img, label: icon.label}
          })
          comps ={ Option: CustomSelectOption, SingleValue: CustomSelectValue }
        } else {
          options = this.state.selectedData.map(o => o && {'label': o, 'value': o});
          comps = null
        }
        if (debug) console.log('2296 options', options);
        const { selectedOption } = this.state;

        const value = (selectedOption)  ? selectedOption.value : options[0]

        if (debug) console.log('2173 Diagram ', selectedOption, this.state.selectedOption, value);
        header = modalContext.title;
        modalContent = 
          <div className="modal-selection d-flex justify-content-center">
            <Select className="modal-select"
              options={options}
              components={comps}
              onChange={value => this.handleSelectDropdownChange(value)}
              value={value}
            />
          </div>
          {/* <option value={option.value}>{label: option.label, option.value}</option>
          */}
      
      break;
      // case 'editProject':
      // case 'editModel':
      // case 'editModelview':
      case 'editObject':
      case 'editObjectview':
        header = modalContext.title;
        category = this.state.selectedData.category;
        typename = (modalContext.typename) ? '('+modalContext.typename+')' : '('+this.state.selectedData.object?.typeName+')'
        // typename = '('+this.state.selectedData.object?.typeName+')'
        if (!debug) console.log('3343 Diagram ', icon, typename, modalContext, this.state.selectedData);
        
        if (this.state.selectedData !== null && this.myMetis != null) {
          if (debug) console.log('3346 Diagram ', this.state.selectedData, this.myMetis);
          modalContent = 
            <div className="modal-prop">
              <SelectionInspector 
                myMetis       ={this.myMetis}
                selectedData  ={this.state.selectedData}
                context       ={this.state.modalContext}
                onInputChange ={this.handleInputChange}
              />
            </div>
        }
        break;
      case 'editRelationship':
      case 'editRelshipview':
      case 'editTypeview': {
        header = modalContext.title + ':';
        category = this.state.selectedData.category;
        if (debug) console.log('2860 category ', category);
      
        if (this.state.selectedData !== null && this.myMetis != null) {
          if (debug) console.log('2863 Diagram ', this.state.selectedData, this.myMetis);
          modalContent = 
            <div className="modal-prop" >
              <SelectionInspector 
                myMetis       ={this.myMetis}
                selectedData  ={this.state.selectedData}
                context       ={this.state.modalContext}
                onInputChange ={this.handleInputChange}
              />
            </div>
          }
        }
      break;
      default:
        break;
    }
    if (debug) console.log('2962 last in Diagram ', this.props.myMetis);
    
    return (
      <div>
        <ReactDiagram 
          ref={this.diagramRef}
          divClassName='diagram-component'
          initDiagram={this.initDiagram}
          nodeDataArray={this.props.nodeDataArray}
          linkDataArray={this.props?.linkDataArray}
          myMetis={this.props.myMetis}
          modelData={this.props.modelData}
          onModelChange={this.props.onModelChange}
          skipsDiagramUpdate={this.props.skipsDiagramUpdate}
        />
        <Modal className="" isOpen={this.state.showModal}  >
          {/* <div className="modal-dialog w-100 mt-5"> */}
            {/* <div className="modal-content"> */}
              <div className="modal-head">
                <Button className="modal-button btn-sm float-right m-1" color="link" 
                  onClick={() => { this.handleCloseModal() }} ><span>x</span>
                </Button>
                <ModalHeader className="modal-header" >
                <span className="text-secondary">{header} </span> 
                <span className="modal-name " >{this.state.selectedData?.name} </span>
                <span className="modal-objecttype float-right"> {typename} </span> 
              </ModalHeader>
              </div>
              <ModalBody >
                <div className="modal-body1">
                  <div className="modal-pict"><img className="modal-image" src={icon}></img></div>
                  {modalContent}
                </div>
              </ModalBody>
              <ModalFooter className="modal-footer">
                <Button className="modal-button bg-link m-0 p-0" color="link" onClick={() => { this.handleCloseModal() }}>Done</Button>
              </ModalFooter>
            {/* </div> */}
          {/* </div> */}
        </Modal>        
        <style jsx>{`
        `}
        </style> 
      </div>
    );
  }
}




{/* <ReactDiagram
ref={this.diagramRef}
divClassName='diagram-component'
initDiagram={this.initDiagram}
nodeDataArray={this.props.nodeDataArray}
linkDataArray={this.props?.linkDataArray}
myMetis={this.props.myMetis}
modelData={this.props.modelData}
onModelChange={this.props.onModelChange}
skipsDiagramUpdate={this.props.skipsDiagramUpdate}
/> */}
