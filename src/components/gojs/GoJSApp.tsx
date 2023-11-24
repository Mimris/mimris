// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;
const linkToLink = false;

import * as go from 'gojs';
import * as React from 'react';
import Select, { components } from "react-select"
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { DiagramWrapper } from './components/Diagram';
import { SelectionInspector } from './components/SelectionInspector';
import * as akm from '../../akmm/metamodeller';
import * as gjs from '../../akmm/ui_gojs';
import * as jsn from '../../akmm/ui_json';
import * as uic from '../../akmm/ui_common';
import * as uid from '../../akmm/ui_diagram';
import * as uim from '../../akmm/ui_modal';

const constants = require('../../akmm/constants');
const utils = require('../../akmm/utilities');

const systemtypes = ['Element', 'Entity', 'Property', 'Datatype', 'Method', 'Unittype',
  'Value', 'FieldType', 'InputPattern', 'ViewFormat',
  'Generic', 'Container'];

/**
 * Use a linkDataArray since we'll be using a GraphLinksModel,
 * and modelData for demonstration purposes. Note, though, that
 * both are optional props in ReactDiagram.
 */
interface AppState {
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
  selectedData: go.ObjectData | null;
  editedData: go.ObjectData | null;
  skipsDiagramUpdate: boolean;
  metis: any;
  myMetis: akm.cxMetis;
  myGoModel: gjs.goModel;
  myGoMetamodel: gjs.goModel;
  phFocus: any;
  dispatch: any;
  modelType: any;
  showModal: boolean;
  modalContext: any;
  selectedOption: any;
  diagramStyle: any;
  onExportSvgReady: any;
}

class GoJSApp extends React.Component<{}, AppState> {
  constructor(props: object) {
    super(props);
    if (debug) console.log('62 GoJSApp', this.props.nodeDataArray);
    this.state = {
      nodeDataArray: this.props?.nodeDataArray,
      linkDataArray: this.props?.linkDataArray,
      modelData: {
        canRelink: true
      },
      selectedData: null,
      editedData: null,
      skipsDiagramUpdate: false,
      metis: this.props.metis,
      myMetis: this.props.myMetis,
      myGoModel: this.props.myGoModel,
      myGoMetamodel: this.props.myGoMetamodel,
      phFocus: this.props.phFocus,
      dispatch: this.props.dispatch,
      modelType: this.props.phFocus.focusTab,
      showModal: false,
      modalContext: null,
      selectedOption: null,
      diagramStyle: this.props.diagramStyle,
      onExportSvgReady: this.props.onExportSvgReady
    };
    if (debug) console.log('76 this.state.linkDataArray: ', this.state.linkDataArray);
    this.handleDiagramEvent = this.handleDiagramEvent.bind(this);
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleSelectDropdownChange = this.handleSelectDropdownChange.bind(this);
  }

  public handleOpenModal(node: any, modalContext: any) {
    this.setState({
      selectedData: node,
      modalContext: modalContext,
      selectedOption: null,
      showModal: true
    });
    if (debug) console.log('90 node', this.state.selectedData);
  }

  public handleSelectDropdownChange = (selected: any) => {
    if (debug) console.log('94 handleSelectDropdownChange');
    const myMetis = this.state.myMetis;
    const modalContext = this.state.modalContext;
    const context = {
      "myMetis": myMetis,
      "myMetamodel": modalContext.myMetamodel,
      "myModel": myMetis.currentModel,
      "myModelview": myMetis.currentModelview,
      "myGoModel": myMetis.gojsModel,
      "myDiagram": myMetis.myDiagram,
      "modalContext": modalContext
    }
    uim.handleSelectDropdownChange(selected, context);
  }

  public handleCloseModal(e) {
    if (debug) console.log('109 handleCloseModal');
    const props = this.props;
    const modalContext = this.state.modalContext;
    let typename = modalContext.selected?.value;
    if (!typename) typename = modalContext.typename;
    if (debug) console.log('113 typename: ', typename);
    const myDiagram = modalContext.context?.myDiagram;
    const data = modalContext.data;
    if (debug) console.log('122 modalContext', modalContext);
    if (e === 'x') {
      if (myDiagram)
        myDiagram.model.removeLinkData(data);
      this.setState({ showModal: false, selectedData: null, modalContext: null });
      return;
    }
    const args = {
      data: modalContext.data,
      metamodel: modalContext.myMetamodel,
      typename: typename,
      fromType: modalContext.fromType,
      toType: modalContext.toType,
      nodeFrom: modalContext.nodeFrom,
      nodeTo: modalContext.nodeTo,
      context: modalContext.context
    }
    if (debug) console.log('128 args', args);
    uic.createRelshipCallback(args);
    this.setState({ showModal: false, selectedData: null, modalContext: null });
  }

  /**
   * Handle GoJS model changes, which output an object of data changes via Model.toIncrementalData.
   * This method should iterate over those changes and update state to keep in sync with the GoJS model.
   * This can be done via setState in React or another preferred state management method.
   * @param obj a JSON-formatted string
   */
  public handleModelChange(obj: go.IncrementalData) {
    const insertedNodeKeys = obj.insertedNodeKeys;
    const modifiedNodeData = obj.modifiedNodeData;
    const removedNodeKeys = obj.removedNodeKeys;
    const insertedLinkKeys = obj.insertedLinkKeys;
    const modifiedLinkData = obj.modifiedLinkData;
    const removedLinkKeys = obj.removedLinkKeys;
    const modifiedModelData = obj.modelData;

    return;
  }

  private getNode(goModel: any, key: string) {
    const nodes = goModel?.nodes;
    if (nodes) {
      for (let i = 0; i < nodes?.length; i++) {
        const node = nodes[i];
        if (node) {
          if (node.key === key)
            return node;
        }
      }
    }
    return null;
  }

  private getLink(goModel: any, key: string) {
    const links = goModel.links;
    if (links) {
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        if (link) {
          if (link.key === key)
            return link;
        }
      }
    }
    return null;
  }

  private isSystemType(type) {
    for (let i = 0; i < systemtypes.length; i++) {
      const systype = systemtypes[i];
      if (type.name === systype)
        return true;
    }
    return false;
  }

  private isMetamodelType(category) {
    let retval = false;
    if (
      (category === constants.types.OBJECTTYPE)
      ||
      (category === constants.types.RELATIONSHIPTYPE)
    )
      retval = true;
    return retval;
  }

  /**
   * Handle any relevant DiagramEvents, in this case just selection changes.
   * On ChangedSelection, find the corresponding data and set the selectedData state.
   * @param e a GoJS DiagramEvent
   */
  public handleDiagramEvent(e: go.DiagramEvent) {
    const dispatch = this.state.dispatch;
    const name = e.name;
    const myDiagram = e.diagram;
    const myMetis = this.state.myMetis;
    myMetis.relinked = false;
    if (debug) console.log('208 handleDiagramEvent', myMetis);
    const myModel = myMetis?.findModel(this.state.phFocus?.focusModel?.id);
    let myModelview = myMetis?.findModelView(this.state.phFocus?.focusModelview?.id);
    if (!myModelview) myModelview = myMetis?.currentModelview;
    const myMetamodel = myModel?.getMetamodel();
    const myGoModel = this.state.myGoModel;
    const myGoMetamodel = this.state.myGoMetamodel;
    if (debug) console.log('214 handleDiagramEvent', myGoMetamodel);
    const gojsModel = {
      nodeDataArray: myGoModel?.nodes,
      linkDataArray: myGoModel?.links
    }
    if (debug) console.log('219 gojsModel', gojsModel);
    const nodes = new Array();
    const nods = myGoMetamodel?.nodes;
    for (let i = 0; i < nods?.length; i++) {
      const node = nods[i] as gjs.goObjectTypeNode;
      const objtype = node.objecttype;
      if (objtype?.abstract) continue;
      if (objtype?.markedAsDeleted) continue;
      nodes.push(node);
    }
    if (nodes?.length > 0) myGoMetamodel.nodes = nodes;
    if (debug) console.log('230 gojsMetamodel', myGoMetamodel);

    const gojsMetamodel = {
      nodeDataArray: myGoMetamodel?.nodes,
      linkDataArray: myGoMetamodel?.links
    }
    if (debug) console.log('236 gojsMetamodel', gojsMetamodel);
    let modifiedObjectTypes = new Array();
    let modifiedObjectTypeViews = new Array();
    let modifiedObjectTypeGeos = new Array();
    let modifiedRelshipTypes = new Array();
    let modifiedRelshipTypeViews = new Array();
    let modifiedObjects = new Array();
    let modifiedRelships = new Array();
    let modifiedObjectViews = new Array();
    let modifiedRelshipViews = new Array();
    let modifiedMetamodels   = new Array();
    let done = false;
    let pasted = false;

    const context = {
      "myMetis": myMetis,
      "myMetamodel": myMetamodel,
      "myModel": myModel,
      "myModelview": myModelview,
      "myGoModel": myGoModel,
      "myGoMetamodel": myGoMetamodel,
      "myDiagram": myDiagram,
      "dispatch": dispatch,
      "pasted": pasted,
      "done": done,
      "askForRelshipName": myModelview?.askForRelshipName,
      "includeInheritedReltypes": myModelview?.includeInheritedReltypes,
      "handleOpenModal": this.handleOpenModal,
      "modifiedObjects": [],
      "modifiedRelships": [],
      "modifiedObjectViews": [],
      "modifiedRelshipViews": [],
      "modifiedObjectTypes": [],
      "modifiedRelshipTypes": [],
      "modifiedObjectTypeViews": [],
      "modifiedRelshipTypeViews": [],
      "modifiedObjectTypeGeos": [],
    }
    if (debug) console.log('265 handleDiagramEvent - context', name, this.state, context);
    if (debug) console.log('266 handleEvent', myMetis);
    if (debug) console.log('267 this', this);
    if (debug) console.log('268 event name', name);

    switch (name) {
      case "InitialLayoutCompleted": {
        const modelview = myMetis.currentModelview;
        const objviews = modelview.objectviews;
        const nodes = myDiagram.nodes;
        // Fix nodes (scale, loc and size, ++)
        for (let it = nodes.iterator; it?.next();) {
          const node = it.value;     
          node.scale = node.data.scale;     
          node.loc = node.data.loc;
          node.size = node.data.size;
          const objview = node.data.objectview;
          if (objview) {
            node.fillcolor = objview.fillcolor;
          }
        }
        // Fix links 
        const links = myDiagram.links;
        for (let it = links.iterator; it?.next();) {
          const link = it.value;
        }
        break;
      }
      case 'TextEdited': {
        const sel = e.subject.part;
        const data = sel.data;
        const textvalue = data.text;
        let field = e.subject.name;
        if (debug) console.log('275 data', data, field, sel);
        // Object type or Object
        if (sel instanceof go.Node) {
          const key = data.key;
          let text = data.name;
          const category = data.category;
          if (debug) console.log('319 data', data);
          // Object type
          if (category === constants.gojs.C_OBJECTTYPE) {
            if (text === 'Edit name') {
              text = prompt('Enter name');
            }
            const myNode = sel;
            if (debug) console.log('326 myNode, text', myNode, text);
            if (myNode) {
              data.name = text;
              if (debug) console.log('329 data, field, text', data, field, text);
              uic.updateObjectType(data, field, text, context);
              if (debug) console.log('331 TextEdited', data);
              const objtype = myMetis.findObjectType(data.objecttype?.id);
              if (objtype) {
                let data = {id: objtype.id, name: text};
                myDiagram.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data });
              }
            }
          } else { // Object           
            if (text === 'Edit name') {
              text = prompt('Enter name');
              data.name = text;
            }
            const myNode = this.getNode(myGoModel, key);
            if (debug) console.log('310 textvalue, node', textvalue, myNode);
            if (myNode) {
                myNode.text = textvalue;
                myNode.name = text;
              
              if (debug) console.log('314 field, text, node', field, text, myNode);
              let obj = uic.updateObject(myNode, field, text, context);
              if (debug) console.log('316 data, node', data, myNode);
              if (!obj)
                obj = myNode.object;
              if (obj) {
                obj.name = text;
                obj.text = textvalue;
                myNode.object = obj;
                const objviews = obj.objectviews;
                for (let i = 0; i < objviews.length; i++) {
                  const objview = objviews[i];
                  objview.name = text;
                  objview.text = textvalue;
                  if (debug) console.log('328 objview', objview);
                  let node = myGoModel.findNodeByViewId(objview?.id);
                  if (node) {
                    if (debug) console.log('330 node', node);
                    const n = myDiagram.findNodeForKey(node.key) as any;
                    if (n) node = n;
                    myDiagram.model?.setDataProperty(node.data, "name", myNode.name);
                    const jsnObjview = new jsn.jsnObjectView(objview);
                    jsnObjview.name = text;
                    jsnObjview.text = textvalue;
                    modifiedObjectViews.push(jsnObjview);
                    if (debug) console.log('337 jsnObjview', jsnObjview);
                    let data = JSON.parse(JSON.stringify(jsnObjview));
                    context.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
                  }
                }
              }
              const jsnObj = new jsn.jsnObject(obj);
              jsnObj.text = textvalue;
              modifiedObjects.push(jsnObj);
              let data = JSON.parse(JSON.stringify(jsnObj));
              context.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
            }
          }
          const nodes = myGoModel?.nodes;
          for (let i = 0; i < nodes?.length; i++) {
            const node = nodes[i];
            if (node.key === data.key) {
              node.name = data.name;
              break;
            }
          }
        }
        // Relationship or Relationship type
        if (sel instanceof go.Link) {
          const key = data.key;
          let text = data.nameFrom ? data.nameFrom : data.name;
          let typename = data.type;
          // Relationship type
          if (typename === constants.gojs.C_RELSHIPTYPE) {
            const myLink = this.getLink(context.myGoMetamodel, key);
            if (debug) console.log('364 TextEdited', myLink);
            if (myLink) {
              if (text === 'Edit name') {
                text = prompt('Enter name');
                typename = text;
                data.name = text;
              }
              uic.updateRelationshipType(myLink, "name", text, context);
              data.name = myLink.name;
              if (myLink.reltype) {
                const jsnReltype = new jsn.jsnRelationshipType(myLink.reltype, true);
                modifiedRelshipTypes.push(jsnReltype);
                if (debug) console.log('376 TextEdited', modifiedRelshipTypes);
              }
              myDiagram.model?.setDataProperty(myLink.data, "name", myLink.name);
            }
          }
          else { // Relationship
            let relview = data.relshipview;
            if (relview) {
              if (text === 'Edit name') {
                text = prompt('Enter name');
                data.name = text;
              }
              let rel = relview.relship as akm.cxRelationship;
              if (rel) {
                rel = myModel.findRelationship(rel.id);
                if (rel) rel.name = text;
                // rel.name = rel.type.name;
                const draftProp = constants.props.DRAFT;
                rel.setStringValue2(draftProp, text);
                const relviews = rel.relshipviews;
                for (let i = 0; i < relviews.length; i++) {
                  const relview = relviews[i];
                  relview.name = text;
                  if (text === 'Is') {
                    rel.relshipkind = 'Generalization';
                    relview.toArrow = 'Triangle';
                    data.toArrow = 'Triangle';
                    // This doesn't work:
                    let link = myDiagram.findLinkForKey(data.key);
                    myDiagram.model.setDataProperty(link.data, 'toArrow', data.toArrow);
                  }
                  const jsnRelview = new jsn.jsnRelshipView(relview);
                  modifiedRelshipViews.push(jsnRelview);
                  const jsnRel = new jsn.jsnRelationship(rel);
                  modifiedRelships.push(jsnRel);
                  // Dispatches
                  modifiedRelships.map(mn => {
                    let data = mn;
                    data = JSON.parse(JSON.stringify(data));
                    (mn) && myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
                  })      
                  modifiedRelshipViews.map(mn => {
                    let data = mn;
                    data = JSON.parse(JSON.stringify(data));
                    (mn) && myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
                  })              
                }
              }
            }
          }
        }
        return;
      }
      case "SelectionMoved": {
        if (debug) console.log('412 context', context);
        const goModel = context.myGoModel;
        // First remember the original locs
        const dragTool = myDiagram.toolManager.draggingTool;
        const myParts = dragTool.draggedParts;
        const myFromNodes = [];
        for (let it = myParts.iterator; it?.next();) {
          let n = it.value;
          let loc = it.value.point.x + " " + it.value.point.y;
          if (debug) console.log('422 n, it.key.data, loc', n, it.key.data, loc);
          if (!(it.key.data.category === 'Object'))
            continue;
          let scale = it.key.data.scale1;
          if (!scale) scale = "1";
          const myFromNode = {
            "key": it.key.data.key,
            "name": it.key.data.name,
            "group": it.key.data.group,
            "loc": new String(loc),
            "scale": new String(scale),
          }
          myFromNodes.push(myFromNode);
          if (debug) console.log('434 myFromNode', myFromNode);
        }
        // Then remember the new locs
        const selection = e.subject;
        const myToNodes = [];
        for (let it = selection.iterator; it?.next();) {
          let n = it.value;
          const key = n.key;
          const myLoc = new String(n.data.loc);
          if (!(n instanceof go.Node)) continue;
          const nod = myGoModel.findNode(key);
          if (nod) {
            let newScale = new String(n.data.scale1);
            if (debug) console.log('447 n.data, nod, myScale', n.data, nod, newScale);
            const myToNode = {
              "key": n.data.key,
              "name": n.data.name,
              "group": n.data.group,
              "loc": new String(n.data.loc),
              "scale": new String(n.data.scale1)
            }
            myToNodes.push(myToNode);
          }
        }

        // First do the move and scale the nodes. 
        let selcnt = 0;
        let refloc;
        let count = -1;
        let rloc;
        for (let it = selection.iterator; it?.next();) {
          const sel = it.value;
          const data = sel.data;
          if (data.category === 'Relationship' || data.category === 'Relationship type')
            continue;
          // Object type
          if (data.category === 'Object type') 
          {
            const objtypegeos = context.myMetamodel.purgeObjtypeGeos();
            context.myMetamodel.objtypegeos = objtypegeos;
            const objtype = myMetis.findObjectType(data.objecttype.id);
            if (objtype) {
              let objtypeGeo = context.myMetamodel.findObjtypeGeoByType(objtype);
              if (!objtypeGeo) {
                objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), context.myMetamodel, objtype, "", "");
              }
              objtypeGeo.setLoc(data.loc);
              objtypeGeo.setSize(data.size);
              objtypeGeo.setModified();
              const jsnObjtypeGeo = new jsn.jsnObjectTypegeo(objtypeGeo);
              const geo = JSON.parse(JSON.stringify(jsnObjtypeGeo));
              context.dispatch({ type: 'UPDATE_OBJECTTYPEGEOS_PROPERTIES', geo });
            }
            if (debug) console.log('520 myMetamodel', context.myMetamodel);
            const jsnMetamodel = new jsn.jsnMetaModel(context.myMetamodel);
            const dt = JSON.parse(JSON.stringify(jsnMetamodel));
            context.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', dt });
        }
          else if (data.category === 'Object') // Object
          {
            // First do the move and scale the nodes. Do not worry about the correct location of the nodes.
            const hasMemberType = myMetis.findRelationshipTypeByName(constants.types.AKM_HAS_MEMBER);
            const myModelview = context.myModelview;
            const myObjectviews = myModelview?.objectviews;
            // The object to move
            let fromObject = data.object;
            fromObject = myModel.findObject(fromObject.id);
            let fromloc, fromNode, fromGroup;
            for (let j = 0; j < myFromNodes.length; j++) {
              const fnode = myFromNodes[j];
              if (fnode.key === data.key) {
                fromNode = fnode;
                fromloc = fnode.loc.valueOf();
                break;
              }
            }
            let toloc, toNode;
            for (let j = 0; j < myToNodes.length; j++) {
              const tnode = myToNodes[j];
              if (tnode.key === data.key) {
                toNode = tnode;
                toloc = tnode.loc.valueOf();
                break;
              }
            }
            // Move the object
            let node = uic.changeNodeSizeAndPos(data, fromloc, toloc, myGoModel, myDiagram, modifiedObjectViews) as gjs.goObjectNode;
            node = goModel?.findNode(data.key);
            if (node) {
              node.scale1 = node.getMyScale(myGoModel).toString();
              const group = uic.getGroupByLocation(myGoModel, node.loc, node.size, node);
              const containerType = myMetis.findObjectTypeByName(constants.types.AKM_CONTAINER);
              // The node IS moved INTO a group or moved INSIDE a group:
              if (group) {
                const parentgroup = group;
                node.group = parentgroup.key;
                node.objectview.group = parentgroup.objectview.id;
                myDiagram.model.setDataProperty(data, "group", node.group);
                // Handle hasMember relationships:
                if (group?.objecttype?.id !== containerType?.id && hasMemberType) {
                  const parentObj = parentgroup.object;
                  let rel = null;
                  let fromObj = null;
                  let toObj = null;
                  // Check if a relationship of type 'hasMember' exists between the parent (group) 
                  // and the (current) node
                  let done = false;
                  const inputRels = node.object.getInputRelshipsByType(hasMemberType);
                  // There ARE existing hasMember relationships: 
                  for (let i = 0; i < inputRels?.length; i++) {
                    // The result of the move should be one hasMember relationship 
                    // between the parent group (parentObj) and the node 
                    const r = inputRels[i]; // The hasMember relationship
                    fromObj = r.fromObject;
                    toObj = r.toObject;
                    if (fromObj.id !== parentObj.id) { // The wrong fromObject, delete the hasMember relationship
                      // This is not the right hasMember relationship - delete it, the view and the link
                      const rviews = r.relshipviews;
                      for (let j = 0; j < rviews?.length; j++) {
                        const rview = rviews[j];
                        rview.markedAsDeleted = true;
                        uic.deleteLinkByViewId(rview.id, myDiagram);
                        uic.deleteRelationshipView(rview, myModelview, myMetis);
                        uic.deleteRelationship(r, myModelview, myMetis);
                      }
                    } else { // The hasMember relationship already exists
                      // Delete the view but keep the relationship
                      rel = r;
                      const rviews = rel.relshipviews;
                      for (let j = 0; j < rviews?.length; j++) {
                        const rview = rviews[j];
                        rview.markedAsDeleted = true;
                        uic.deleteLinkByViewId(rview.id, myDiagram);
                        uic.deleteRelationshipView(rview, myModelview, myMetis);
                      }
                      done = true;
                    }
                  }
                  // Check if a relationship of type 'hasMember' exists 
                  // between the parent group and the node
                  // If not, create it
                  const outputRels = !done ? parentObj.getOutputRelshipsByType(hasMemberType) : [];
                  // Handle EXISTING relationships of type hasMember 
                  for (let i = 0; i < outputRels?.length; i++) {
                    const r = outputRels[i];
                    if (r.toObject.id !== node.object.id) {
                      // Not the correct relationship
                      continue;
                    }
                    // Found the correct relationship
                    rel = r;
                    // Find the corresponding relationship view if it exists and delete it
                    const relviews = myModelview.getRelviewsByFromAndToObjviews(parentgroup.objectview, node.objectview);
                    for (let j = 0; j < relviews?.length; j++) {
                      const relview = relviews[j];
                      relview.markedAsDeleted = true;
                      uic.deleteLinkByViewId(relview.id, myDiagram);
                      uic.deleteRelationshipView(relview, myModelview, myMetis);
                    }
                    break;
                  }

                  // There is no existing hasMember relationship between the parent group and the node
                  if (!rel) {  // Create a new hasMember relationship
                    rel = new akm.cxRelationship(utils.createGuid(), hasMemberType, fromObj, toObj, constants.types.AKM_HAS_MEMBER, hasMemberType.description);
                    rel.setModified();
                    myMetis.addRelationship(rel);
                    myModel?.addRelationship(rel);
                    const jsnRel = new jsn.jsnRelationship(rel);
                    modifiedRelships.push(jsnRel);
                    // Inside a group - a relationship view is not created
                  }
                }
                // Do the scaling and location of the node
                toNode.scale = node.getMyScale(myGoModel).toString();
                const scale0 = fromNode.scale.valueOf();
                const scale1 = node.getMyScale(myGoModel).toString();
                let scaleFactor = scale0 < scale1 ? scale0 / scale1 : scale1 / scale0;
                node.scale1 = scale1;
                let key = data.key;
                key = key.substr(0, 36);  // Hack - should not be neccessary
                if (selcnt == 0) {
                  refloc = node.loc;
                  if (debug) console.log('545 node, refloc', node, refloc);
                }
                if (selcnt > 0) {
                  let toloc;
                  for (let j = 0; j < myToNodes.length; j++) {
                    const toNode = myToNodes[j];
                    if (toNode.key === key) {
                      toloc = toNode.loc;
                      break;
                    }
                  }
                  let fromloc;
                  for (let j = 0; j < myFromNodes.length; j++) {
                    const fromNode = myFromNodes[j];
                    if (fromNode.key === key) {
                      fromloc = fromNode.loc;
                      break;
                    }
                  }
                  const nodeloc = uic.scaleNodeLocation2(node, refloc, toloc, scaleFactor);
                  if (nodeloc) {
                    const loc = nodeloc.x + " " + nodeloc.y;
                    node.loc = loc;
                    toNode.loc = new String(loc);
                  }
                }
                let subNodes;
                if (node.isGroup) { // The node moved IS a group
                  node.memberscale = node.objectview.memberscale ? node.objectview.memberscale : node.typeview.memberscale;
                  node.group = parentgroup.key;
                  // Scale the group members
                  subNodes = uic.scaleNodesInGroup(node, myGoModel, myObjectviews, myFromNodes, myToNodes, myDiagram);
                }
                if (debug) console.log('680 subNodes', subNodes);
              } else { // The node is NOT moved into a group, possibly OUT OF a group
                const toObject = node.object;        
                node.group = "";
                let fromScale = fromNode.scale;
                let toScale = node.getMyScale(myGoModel); // 1;
                let scaleFactor = fromScale > toScale ? fromScale / toScale : toScale / fromScale;
                myDiagram.model.setDataProperty(node.data, "group", node.group);
                let hasMemberRel;
                if (node.isGroup) { // The node moved is a group 
                  // Scale the group members          
                  node.group = "";
                  node.scale1 = node.getMyScale(myGoModel);
                  const nodes = uic.getNodesInGroup(node, myGoModel, myObjectviews);
                  let refloc = node.loc;
                  for (let i = 0; i < nodes.length; i++) {
                    const n = nodes[i];
                    if (n) {
                      n.scale1 = n.getMyScale(myGoModel);
                      let fromLoc;
                      for (let j = 0; j < myFromNodes?.length; j++) {
                        const fromNode = myFromNodes[j];
                        if (fromNode.key === n.key) {
                          fromLoc = fromNode.loc;
                          fromScale = fromNode.scale;
                          if (debug) console.log('699 fromNode, fromLoc, fromScale', fromNode, fromLoc, fromScale);
                          break;
                        }
                      }
                      let toNode, toLoc;
                      for (let j = 0; j < myToNodes?.length; j++) {
                        toNode = myToNodes[j];
                        if (toNode.key === n.key) {
                          toLoc = toNode.loc;
                          if (debug) console.log('708 toNode, toLoc, toScale', toNode, toLoc, toScale);
                          break;
                        }
                      }
                      if (debug) console.log('712 n, refloc, toloc, scaleFactor', n, refloc, toLoc, scaleFactor);
                      let nodeloc = uic.scaleNodeLocation2(n, refloc, toLoc, scaleFactor);
                      if (debug) console.log('714 n, nodeloc', n, nodeloc);
                      if (nodeloc) {
                        let loc = nodeloc.x + " " + nodeloc.y;
                        n.loc = loc;
                        toNode.loc = new String(loc);
                        n.scale1 = node.getMyScale(myGoModel).toString();
                        let nod = myGoModel.findNodeByViewId(n.objectview.id) as any;
                        if (nod) {
                          nod = myDiagram.findNodeForKey(nod.key);
                          nod.loc = loc;
                          nod.scale1 = node.getMyScale(myGoModel).toString();
                          myDiagram.model.setDataProperty(nod.data, "loc", loc);
                        }
                        if (debug) console.log('727 nod, loc', nod, loc);
                      } else {
                        let nod = myGoModel.findNodeByViewId(n.objectview.id) as any;
                        if (nod) {
                          nod = myDiagram.findNodeForKey(nod.key);
                          myDiagram.model.setDataProperty(nod, "scale", n.scale1);
                        }
                      }
                    }
                  }
                  // Handle hasMember relationships    
                  hasMemberRel = uic.hasMemberRelship(node, myMetis);
                  if (!hasMemberRel) {   
                    hasMemberRel = uic.addHasMemberRelship(fromObject, toObject, myMetis);
                    if (hasMemberRel)
                      myModel.addRelationship(hasMemberRel);
                  }
                } else { // The node moved is NOT a group                
                  let n = myDiagram.findNodeForKey(node.key);
                  if (count < 0) { // The reference node
                    count++;
                    rloc = node.loc;
                    node.objectview.loc = node.loc;
                  } else {
                    const nodeloc = uic.scaleNodeLocation2(node, rloc, toloc, scaleFactor);
                    if (nodeloc) {
                      const loc = nodeloc.x + " " + nodeloc.y;
                      toloc = new String(loc);
                      node.loc = loc;
                      node.objectview.loc = toloc.valueOf();
                      myDiagram.model.setDataProperty(n.data, "loc", loc);
                    }
                  }

                  // This is a node that is NOT inside a group
                  // I.e. the hasMember relationship should be visible
                  node.objectview.group = "";
                  node.scale1 = Number(toScale.valueOf());
                  myDiagram.model.setDataProperty(n, "scale", node.scale1);
                  // Handle hasMember relationships     
                  let hasMemberRel = uic.hasMemberRelship(node, myMetis);  
                  if (hasMemberRel) {
                      hasMemberRel = myModel.findRelationship(hasMemberRel.id);
                      if (hasMemberRel) {
                        myModel.addRelationship(hasMemberRel);
                        // Check if the hasMember relationship has views
                        let relviews = hasMemberRel.relshipviews;
                        if (!relviews || relviews?.length == 0) {
                          // No views, create a new view
                          let relview = uic.addHasMemberRelshipView(hasMemberRel, myModelview);
                          if (relview) {
                              hasMemberRel.addRelationshipView(relview);
                              uic.setLinkProperties(relview, myMetis, myDiagram);
                              myModelview.addRelationshipView(relview);
                              // Prepare dispatch
                              const jsnRelview = new jsn.jsnRelshipView(relview);
                              modifiedRelshipViews.push(jsnRelview);
                              const jsnRel = new jsn.jsnRelationship(hasMemberRel);
                              modifiedRelships.push(jsnRel);
                          }
                        } else if (relviews?.length == 1) { // There is one view
                          let relview = relviews[0];
                          uic.setLinkProperties(relview, myMetis, myDiagram);
                          myModelview.addRelationshipView(relview);
                          const jsnRelview = new jsn.jsnRelshipView(relview);
                          modifiedRelshipViews.push(jsnRelview);
                        }
                      }
                  }
                }
              }
              node.size = data.size;
              // Handle relview scaling
              let n = myDiagram.findNodeForKey(node.key);
              if (n) {
                n.findLinksConnected().each(function (link) {
                  if (link) {
                    let relview = link.data.relshipview;
                    relview = myModelview.findRelationshipView(relview?.id);
                    if (relview) {
                      relview.loc = link.data.loc;
                      // Handle relview scaling
                      if (group) {
                        const grpScale = group.scale1;
                        const grpMemberscale = group.memberscale;
                        const textscale = (group && grpScale) ? grpScale * grpMemberscale : "1";
                        relview.textscale = textscale;
                      } else {
                        relview.textscale = "1";
                      }
                      // Handle relview points
                      relview.points = link.points;
                      myModelview.addRelationshipView(relview);
                    }
                  }
                });
              }
              if (n && n.data && n.data.group !== node.group) {
                try {
                  myDiagram.model.setDataProperty(n.data, "group", node.group);
                } catch (error) {
                  if (debug) console.log('694 error', error);
                }
              }
              if (n?.data)
                myDiagram.model.setDataProperty(n.data, "loc", node.loc);
              myDiagram.model.setDataProperty(n, "scale", Number(node.scale1));
            }
            // Update objectview scaling and location
            for (let i = 0; i < myGoModel.nodes.length; i++) {
              let tnode;
              const node = myGoModel.nodes[i] as gjs.goObjectNode;
              for (let j = 0; j < myToNodes.length; j++) {
                tnode = myToNodes[j];
                if (node.key === tnode.key) {
                  node.loc = tnode.loc.valueOf();
                  node.scale1 = node.getMyScale(myGoModel);
                  break;
                }
              }
              const objview = node.objectview;
              objview.loc = node.loc;
              objview.scale1 = node.scale1;
              objview.size = node.size;
              if (debug) console.log('706 node, objview', node, objview);
              if (node.group) {
                let grp = myGoModel.findNode(node.group);
                objview.group = grp?.objectview.id;
              } else {
                objview.group = "";
              }
              myDiagram.model.setDataProperty(node, "scale", node.scale1);
              const jsnObjview = new jsn.jsnObjectView(objview);
              if (jsnObjview) {
                // jsnObjview.loc = node.loc;
                uic.addItemToList(modifiedObjectViews, jsnObjview);
                if (debug) console.log('753 jsnObjview', jsnObjview);
              }
            }
            selcnt++;
          }
          myDiagram.requestUpdate();
        }
        const nodes = myDiagram.nodes;
        for (let it = nodes.iterator; it?.next();) {
            const node = it.value;
            const objview = node.data.objectview;
            const objviews = myModelview.objectviews;
            for (let i = 0; i < objviews?.length; i++) {
                const objectview = objviews[i];
                if (objectview?.id == objview?.id) {
                    objectview.loc = node.data.loc;
                    objectview.scale1 = node.data.scale1;
                    myModelview.addObjectView(objectview);
                }
            }
        }
        const links = myDiagram.links;
        for (let it = links.iterator; it?.next();) {
            const link = it.value;
            const rview = link.data.relshipview;
            if (!rview) continue;
            const relviews = myModelview.relshipviews;
            for (let i = 0; i < relviews?.length; i++) {
              const relview = relviews[i];
              if (relview.id === rview.id) {
                  const points = [];
                  for (let it = link.points.iterator; it?.next();) {
                    const point = it.value;
                    if (debug) console.log('1603 point', point.x, point.y);
                    points.push(point.x)
                    points.push(point.y)
                  }
                  relview.points = points;
                  const jsnRelview = new jsn.jsnRelshipView(relview);
                  if (debug) console.log('1609 relview, jsnRelview', relview, jsnRelview);
                  modifiedRelshipViews.push(jsnRelview);
                  myModelview.addRelationshipView(relview);
                }
            }
        }        
        uic.purgeDuplicatedRelshipViews(myModelview, myMetis, myDiagram);
        const jsnModelview = new jsn.jsnModelView(myModelview);
        let data = JSON.parse(JSON.stringify(jsnModelview));
        context.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        return;
      }
      case "SelectionDeleting": {
        // const newNode = myMetis.currentNode;
        if (debug) console.log('727 myMetis', myMetis);
        const deletedFlag = true;
        let renameTypes = false;
        const selection = e.subject;
        if (debug) console.log('738 selection', selection);
        const data = selection.first().data;
        const isMetamodel = this.isMetamodelType(data.category);
        if (debug) console.log('732 data, selection', data, selection);
        if (isMetamodel) {
          if (confirm("If instances exists, do you want to change their types instead of deleting?")) {
            renameTypes = true;
          }
          // If an object type, identify connected relationship types
          const reltypes = [];
          for (let it = selection?.iterator; it?.next();) {
            const sel = it.value;
            const data = sel.data;
            if (data.markedAsDeleted) continue;
            if (data.category === constants.gojs.C_OBJECTTYPE) {
              const objtype = myMetis.findObjectType(data.objecttype?.id);
              if (objtype) {
                const inputReltypes = objtype.inputreltypes;
                for (let i = 0; i < inputReltypes?.length; i++) {
                  const reltype = inputReltypes[i];
                  if (reltypes.indexOf(reltype) === -1) reltypes.push(reltype);
                }
                const outputReltypes = objtype.outputreltypes;
                for (let i = 0; i < outputReltypes?.length; i++) {
                  const reltype = outputReltypes[i];
                  if (reltypes.indexOf(reltype) === -1) reltypes.push(reltype);
                }
              }
            }
            else if (data.category === constants.gojs.C_RELSHIPTYPE) {
              const reltype = myMetis.findRelationshipType(data.reltype?.id);
              if (reltype) {
                if (reltypes.indexOf(reltype) === -1) reltypes.push(reltype);
              }
            }
            // Handle relationship types
            for (let it = selection?.iterator; it?.next();) {
              const sel = it.value;
              const data = sel.data;
              if (debug) console.log('743 sel, data', sel, data);
              const key = data.key;
              const typename = data.type;
              if (data.category === constants.gojs.C_RELSHIPTYPE) {
                const defRelType = myMetis.findRelationshipTypeByName(constants.types.AKM_GENERIC_REL);
                const reltype = myMetis.findRelationshipType(data.reltype?.id);
                if (debug) console.log('749 reltype', reltype);
                if (reltype) {
                  // Check if reltype instances exist
                  const rels = myMetis.getRelationshipsByType(reltype, false);
                  if (debug) console.log('753 reltype, rels, myMetis', reltype, rels, myMetis);
                  if (rels.length > 0) {
                    if (renameTypes) {
                      for (let i = 0; i < rels.length; i++) {
                        const rel = rels[i];
                        rel.type = defRelType;
                        rel.typeview = defRelType.typeview;
                        const jsnRel = new jsn.jsnRelationship(rel);
                        modifiedRelships.push(jsnRel);
                      }
                    } else { // delete the corresponding relationships
                      for (let i = 0; i < rels.length; i++) {
                        const rel = rels[i];
                        rel.markedAsDeleted = deletedFlag;
                        const jsnRel = new jsn.jsnRelationship(rel);
                        modifiedRelships.push(jsnRel);
                      }
                    }
                  }
                  // Check if reltype comes from or goes to a systemtype
                  // If so, ask if you really want to delete
                  // const fromObjtype = reltype.fromObjtype;
                  // const toObjtype   = reltype.toObjtype;
                  // if (debug) console.log('777 fromObjtype, toObjtype', fromObjtype, toObjtype);
                  // if (!this.isSystemType(fromObjtype)) {
                  //   if (!this.isSystemType(toObjtype)) {
                  //     if (!confirm("This is a relationship type between system types. Do you really want to delete?")) {
                  //       continue;
                  //     }
                  //   }
                  // }
                  if (debug) console.log('785 reltype', reltype);
                  reltype.markedAsDeleted = deletedFlag;
                  uic.deleteRelationshipType(reltype, deletedFlag);
                  let reltypeview = reltype.typeview as akm.cxRelationshipTypeView;
                  if (reltypeview) {
                    reltypeview.markedAsDeleted = deletedFlag;
                    const jsnReltypeView = new jsn.jsnRelshipTypeView(reltypeview);
                    modifiedRelshipTypeViews.push(jsnReltypeView);
                  }
                  const jsnReltype = new jsn.jsnRelationshipType(reltype, true);
                  modifiedRelshipTypes.push(jsnReltype);
                }
              }
            }
            // Handle objecttypes
            let count = 0;
            for (let it = selection?.iterator; it?.next();) {
              count++;
              const sel = it.value;
              const data = sel.data;
              if (debug) console.log('805 sel, data', sel, data);
              const key = data.key;
              const typename = data.type;
              if (data.category === constants.gojs.C_OBJECTTYPE) {
                const defObjType = myMetis.findObjectTypeByName('Generic');
                const objtype = myMetis.findObjectType(data.objecttype?.id);
                if (objtype) {
                  if (debug) console.log('835 objtype to be removed ??', objtype);
                  // Check if objtype instances exist
                  const objects = myMetis.getObjectsByType(objtype, true);
                  if (debug) console.log('814 objtype, objects, myMetis', objtype, objects, myMetis);
                  if (objects.length > 0) {
                    if (renameTypes) {
                      for (let i = 0; i < objects.length; i++) {
                        const obj = objects[i];
                        obj.type = defObjType;
                        obj.typeview = defObjType.typeview;
                        const jsnObj = new jsn.jsnObject(obj);
                        modifiedObjects.push(jsnObj);
                      }
                    } else { // delete the corresponding objects
                      for (let i = 0; i < objects.length; i++) {
                        const obj = objects[i];
                        obj.markedAsDeleted = deletedFlag;
                        const jsnObj = new jsn.jsnObject(obj);
                        modifiedObjects.push(jsnObj);
                      }
                    }
                  }
                  let objtypeview = objtype.typeview as akm.cxObjectTypeView;
                  if (objtypeview) {
                    objtypeview.markedAsDeleted = deletedFlag;
                    const jsnObjtypeview = new jsn.jsnObjectTypeView(objtypeview);
                    modifiedObjectTypeViews.push(jsnObjtypeview);
                  }
                  const geo = context.myMetamodel.findObjtypeGeoByType(objtype);
                  if (geo) {
                    geo.markedAsDeleted = deletedFlag;
                    const jsnObjtypegeo = new jsn.jsnObjectTypegeo(geo);
                    modifiedObjectTypeGeos.push(jsnObjtypegeo);
                  }
                  objtype.markedAsDeleted = deletedFlag;
                  const jsnObjtype = new jsn.jsnObjectType(objtype);
                  modifiedObjectTypes.push(jsnObjtype);
                  if (debug) console.log('1079 objtype', objtype);
                }
              }
            }
          }
          if (isMetamodel) {
            uic.purgeModelDeletions(myMetis, myDiagram);
            return;
          }
        } else {
          // Handle objects
          for (let it = selection?.iterator; it?.next();) {
            const sel = it.value;
            const data = sel.data;
            const key = data.key;
            if (data.category === constants.gojs.C_OBJECT) {
              if (debug) console.log('866 sel, data', sel, data);
              const key = data.key;
              const myNode = this.getNode(context.myGoModel, key);  // Get nodes !!!
              if (myNode) {
                if (debug) console.log('870 delete node', data, myNode);
                uic.deleteNode(myNode, deletedFlag, context);
                const object = myNode.object;
                const jsnObject = new jsn.jsnObject(object);
                modifiedObjects.push(jsnObject);
                const objview = myNode.objectview;
                const jsnObjview = new jsn.jsnObjectView(objview);
                modifiedObjectViews.push(jsnObjview);                
                if (debug) console.log('872 delete node', data, myNode);
              }
            }
          }
          // Handle relationships
          for (let it = selection?.iterator; it?.next();) {
            const sel = it.value;
            const data = sel.data;
            const key = data.key;
            if (data.category === constants.gojs.C_RELATIONSHIP) {
              const myLink = this.getLink(context.myGoModel, key);
              if (debug) console.log('888 myLink, data', myLink, data);
              uic.deleteLink(data, deletedFlag, context);
              const relview = data.relshipview;
              if (relview && relview.category === constants.gojs.C_RELSHIPVIEW) {
                relview.markedAsDeleted = deletedFlag;
                relview.relship = myMetis.findRelationship(relview.relship.id);
                if (!myMetis.deleteViewsOnly) {
                  const relship = relview.relship;
                  relship.markedAsDeleted = deletedFlag;
                  const jsnRelship = new jsn.jsnRelationship(relship);
                  modifiedRelships.push(jsnRelship);
                }
                const jsnRelview = new jsn.jsnRelshipView(relview);
                modifiedRelshipViews.push(jsnRelview);
              }
            }
          }
        }
        if (debug) console.log('933 myMetis', myMetis);
        if (debug) console.log('935 Deletion completed', myMetis);
        break;
      }
      case 'ExternalObjectsDropped': {
        e.subject.each(function (n) {
          if (debug) console.log('1149 n.data', n.data, n);
          const node = myDiagram.findNodeForKey(n.data.key);
          let typeview = n.data.typeview;
          let part = node.data;
          part.scale = node.scale;
          if (part.size === "") {
            if (part.isGroup) {
              part.size = "200 100";
            } else {
              part.size = "160 70";
            }
          }
          const isLabel = (part.typename === 'Label');
          if (debug) console.log('916 node', node);
          if (debug) console.log('917 myMetis', myMetis);
          if (debug) console.log('918 myGoModel', myGoModel, myGoMetamodel);
          if (debug) console.log('919 part, node', part, node);
          if (part.type === 'objecttype') {
            const otype = uic.createObjectType(part, context);
            if (debug) console.log('922 myMetis', myMetis);
            if (otype) {
              otype.typename = constants.types.OBJECTTYPE_NAME;
              if (debug) console.log('925 otype, part', otype, part);
              const jsnObjtype = new jsn.jsnObjectType(otype, true);
              if (debug) console.log('927 modifiedObjectTypes', jsnObjtype);
              modifiedObjectTypes.push(jsnObjtype);

              const jsnObjtypeView = new jsn.jsnObjectTypeView(otype.typeview);
              if (debug) console.log('931 modifiedObjectTypeViews', jsnObjtypeView);
              modifiedObjectTypeViews.push(jsnObjtypeView);

              const loc = part.loc;
              const size = part.size;
              const objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), context.myMetamodel, otype, loc, size);
              const jsnObjtypeGeo = new jsn.jsnObjectTypegeo(objtypeGeo);
              if (debug) console.log('938 modifiedObjectTypeGeos', jsnObjtypeGeo);
              modifiedObjectTypeGeos.push(jsnObjtypeGeo);
            }
          } else // object
          {
            part.category = 'Object';
            if (debug) console.log('944 part', part);
            if (isLabel) part.text = 'label';
            if (debug) console.log('949 part', part);
            if (!part.parentModelRef)
              myMetis.pasteViewsOnly = true;
            if (debug) console.log('952 myMetis', myMetis);
            const objview = uic.createObject(part, context);
            if (debug) console.log('954 myMetis', myMetis);
            if (debug) console.log('955 part, objview', part, objview);
            if (objview) {
              const object = objview.object;
              object.name = part.name;
              let otype = object.type;
              if (!otype) {
                otype = myMetis.findObjectType(objview.object.typeRef);
                object.type = otype;
              }
              objview.viewkind = part.viewkind;
              objview.scale1 = node.data.scale1;
              if (!objview.size) {
                // Hack
                if (debug) console.log('1009 objview', objview);
                if (objview.isGroup) {
                  if (node.data,size = "")
                    node.data.size = "200 100";
                  myDiagram.model?.setDataProperty(n.data, "size", node.data.size);
                  objview.size = node.data.size;
                } else {
                  if (node.data.size = "")
                    node.data.size = "160 70";
                  objview.size = node.size;
                  myDiagram.model?.setDataProperty(n.data, "size", node.data.size);
                }
                node.data.loc = node.location;
                // End hack
              }
              const jsnObjview = new jsn.jsnObjectView(objview);
              modifiedObjectViews.push(jsnObjview);

              // const modifiedObjViews = new Array();
              // modifiedObjViews.push(jsnObjview);
              // modifiedObjViews.map(mn => {
              //   let data = mn;
              //   data = JSON.parse(JSON.stringify(data));
              //   myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
              // })

              uic.addItemToList(modifiedObjectViews, jsnObjview);
              // if (debug) console.log('966 objview, jsnObjview', objview, jsnObjview, modifiedObjectViews);

              const jsnObj = new jsn.jsnObject(objview.object);
              modifiedObjects.push(jsnObj);
              if (debug) console.log('969 New object', jsnObj);
            }
          }
          if (debug) console.log('972 myGoModel', myGoModel, myMetis);
          node.updateTargetBindings();
        })
        break;
      }
      case "ObjectDoubleClicked": {
        let sel = e.subject.part;
        const node = sel.data;
        if (debug) console.log('981 node', node);
        const category = node.category;
        switch (category) {
          case constants.gojs.C_OBJECTTYPE:
            uid.editObjectType(node, myMetis, myDiagram);
            break;
          case constants.gojs.C_OBJECT:
            if (debug) console.log('988 myMetis', myMetis);
            uid.editObject(node, myMetis, myDiagram);
            if (debug) console.log('990 myMetis', myMetis);
            break;
        }
        break;
      }
      case "ObjectSingleClicked": {
        const sel = e.subject.part;
        let data = sel.data;
        console.log('1255 selected', data, sel);
        if (false) {
          let focusObjview = myModelview.focusObjectview;
          if (focusObjview) {
            focusObjview.isSelected = sel.isSelected;
            const fov = { 
                id: focusObjview.id, 
                isSelected: sel.isSelected,
            };
          }
        }
        if (data.objectview?.id) {
          const payload = data // JSON.parse(JSON.stringify(data));
          const objvIdName = { id: payload.objectview.id, name: payload.objectview.name };
          const objIdName = { id: payload.objectview.object.id, name: payload.objectview.object.name };

          if (debug) console.log('1072 SET_FOCUS_OBJECTVIEW', payload, objvIdName, objIdName)
          context.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: objvIdName });
          context.dispatch({ type: 'SET_FOCUS_OBJECT', data: objIdName });
        }
        for (let it = sel.memberParts; it?.next();) {
          let n = it.value;
          if (!(n instanceof go.Node)) continue;
          if (debug) console.log('1079 n', n.data);
        }
        break;
      }
      case "ObjectContextClicked": { // right clicked
        const sel = e.subject.part;
        const data = sel.data;
        // dispatch to focusCollection here ???
        // console.log('1086 selected', data, sel);
        break;
      }
      case "PartResized": {
        let selection = e.diagram.selection
        for (let it = selection.iterator; it?.next();) {
          let n = it.value;
          if (n.data.isGroup) {
            let objview = n.data.objectview;
            objview.loc = n.data.loc;
            objview.size = n.data.size;
            const jsnObjview = new jsn.jsnObjectView(objview);
            uic.addItemToList(modifiedObjectViews, jsnObjview);
            let children = n.memberParts;
            for (let it = children.iterator; it?.next();) {
              let c = it.value;
              if (c instanceof go.Node) {
                let data = c.data;
                const objview = data.objectview;
                if (objview) {
                  objview.loc = data.loc;
                  objview.size = data.size;
                  const jsnObjview = new jsn.jsnObjectView(objview);
                  uic.addItemToList(modifiedObjectViews, jsnObjview);
                }
              }
            }
          }
        }
        break;
      }
      case 'ClipboardChanged': {
        const nodes = e.subject;
        if (debug) console.log('nodes', nodes);
        break;
      }
      case 'ClipboardPasted': {
        // First remember the FROM locs
        const myFromNodes = myMetis.currentModel.args1;
        if (debug) console.log('1306 myMetis, myGoModel, myFromNodes', myMetis, myGoModel, myFromNodes);
        // Then do the paste
        const selection = e.subject;
        context.pasted = true;
        const pastedNodes = new Array();
        const myToNodes = [];
        if (debug) console.log('1312 myFromNodes', myFromNodes);
        let refloc, cnt = 0;
        let deltaX = 0, deltaY = 0;
        let objviews = [], nodes = [];
        const it = selection.iterator;
        while (it.next()) {
          const data = it.value.data;
          if (data.category === constants.gojs.C_OBJECT) {
            context.pasted = true;
            if (cnt == 0) {
              refloc = data.loc;
              cnt++;
            }
            if (debug) console.log('1324 data, myGoModel', data, myGoModel);
            let objview = uic.createObject(data, context);
            objview.group = "";
            const key = data.key; // utils.createGuid();
            const node = new gjs.goObjectNode(key, objview);
            node.group = "";
            nodes.push(node);
            // Now remember the TO locs
            const scale = node.getMyScale(myGoModel);
            const myToNode = {
              "key": key,
              "name": data.name,
              "loc": new String(data.loc),
              "scale": new String(scale),
              "size": new String(data.size),
              "template": data.template,
              "figure": data.figure,
              "geometry": data.geometry,
              "fillcolor": data.fillcolor,
              "fillcolor2": data.fillcolor2,
              "strokecolor": data.strokecolor,
              "strokecolor2": data.strokecolor2,
              "strokewidth": data.strokewidth,
              "textscale": data.textscale,
              "textcolor": data.textcolor,
              "icon": data.icon,
            }
            myToNodes.push(myToNode);
            objview.loc = myToNode.loc.valueOf();
            if (deltaX == 0) deltaX = myToNode.loc.valueOf().x - refloc.x;  
            objview.size = myToNode.size.valueOf();
            objviews.push(objview);
            node.loc = objview.loc;
            node.size = objview.size;
            const n = myGoModel.findNode(key);
            n.loc = objview.loc;
            n.size = objview.size;
            if (debug) console.log('1360 data, objview, node, n', data, objview, node, n);
          }
        }
        // Nodes and objectviews are now filled with values
        if (debug) console.log('1363 myFromNodes, myToNodes, objviews, nodes', myFromNodes, myToNodes, objviews, nodes);
        for (let i = 0; i < objviews?.length; i++) {
          const objview = objviews[i];
          const node = nodes[i];
          const myToNode = myToNodes[i];
          let fromNode;
          // Find fromNode
          for (let i = 0; i < myFromNodes?.length; i++) {
            const myNode = myFromNodes[i];
            if (myNode.key.substr(0, 36) === node.key.substr(0, 36)) {
              fromNode = myNode;
              break;
            }
          }
          if (objview) {
            const containerType = myMetis.findObjectTypeByName(constants.types.AKM_CONTAINER);
            const hasMemberType = myMetis.findRelationshipTypeByName(constants.types.AKM_HAS_MEMBER);
            const group = uic.getGroupByLocation(myGoModel, objview.loc, objview.size, node);
            const gjsNode = myDiagram.findNodeForKey(node.key);
            if (group && node) {
              const groupType = myMetis.findObjectTypeByName(group.objecttype?.name);
              if (groupType?.name !== containerType?.name) {
                // Create a hasMember relationship from group to node
                const rel = new akm.cxRelationship(utils.createGuid(), hasMemberType, 
                                                   group.object, node.object,
                                                   hasMemberType.name, hasMemberType.description);
                const jsnRelship = new jsn.jsnRelationship(rel);
                modifiedRelships.push(jsnRelship);
              }
              objview.group = group.objectview?.id;
              node.group = group.key;
              myDiagram.model?.setDataProperty(gjsNode, "group", group.key);
            }
            node.loc = myToNode.loc.valueOf();
            const scale0 = fromNode ? fromNode.scale.valueOf() : 1;
            const scale1 = node.getMyScale(myGoModel).toString(); // myToNode.scale.valueOf(); 
            let scaleFactor = scale1 / scale0;
            const nodeloc = uic.scaleNodeLocation2(node, refloc, myToNode.loc, scaleFactor);
            if (nodeloc) {
              const loc = nodeloc.x + " " + nodeloc.y;
              myToNode.loc = new String(loc);
              deltaX = nodeloc.x - refloc[0];
              deltaY = nodeloc.y - refloc[1];
            }
            {
              node.loc = myToNode.loc.valueOf();
              objview.loc = myToNode.loc.valueOf();
              node.scale1 = node.getMyScale(myGoModel);
              objview.scale1 = node.scale1;
              objview.template = myToNode.template;
              objview.figure = myToNode.figure;
              objview.geometry = myToNode.geometry;
              objview.fillcolor = myToNode.fillcolor;
              objview.fillcolor2 = myToNode.fillcolor2;
              objview.strokecolor = myToNode.strokecolor;
              objview.strokecolor2 = myToNode.strokecolor2;
              objview.strokewidth = myToNode.strokewidth;
              objview.textscale = myToNode.textscale;
              objview.textcolor = myToNode.textcolor;
              objview.icon = myToNode.icon;
              const n = myDiagram.findNodeForKey(node.key);
              myDiagram.model.setDataProperty(n.data, "loc", node.loc);
              myDiagram.model.setDataProperty(n, "scale", node.scale1);
              myDiagram.model.setDataProperty(n.data, "group", node.group);
              pastedNodes.push(node);
              const objid = objview.object?.id;
              objview.object = myMetis.findObject(objid);
              const jsnObjview = new jsn.jsnObjectView(objview);
              modifiedObjectViews.push(jsnObjview);
              if (debug) console.log('1438 jsnObjview', jsnObjview);
              const jsnObj = new jsn.jsnObject(objview.object);
              modifiedObjects.push(jsnObj);
            }
          }
        }
        // Then handle the relationships
        const myFromLinks = myMetis.currentModel.args2;        
        const it1 = selection.iterator;
        while (it1.next()) {
          const link = it1.value.data;
          if (link.category === constants.gojs.C_RELATIONSHIP) {
            context.pasted = true;
            let relview = uic.pasteRelationship(link, pastedNodes, context);
            if (relview) {
              const relid = relview.relship?.id;
              relview.relship = myMetis.findRelationship(relid);
              // Handle relview scaling
              const fromObjview = relview.fromObjview;
              const toObjview = relview.toObjview;
              if (fromObjview && toObjview) {
                const scaleFrom = fromObjview.scale1;
                const scaleTo = toObjview.scale1;
                const textscale = scaleFrom > scaleTo ? scaleFrom : scaleTo;
                relview.textscale = textscale;
              }
              // Handle points
              const points = [];
              for (let it = link.points.iterator; it?.next();) {
                const point = it.value;
                if (debug) console.log('1603 point', point.x, point.y);
                points.push(point.x)
                points.push(point.y)
              }
              // Handle view attributes
              relview.points = points;
              relview.template = link.template;
              relview.arrowscale = link.arrowscale;
              relview.strokecolor = link.strokecolor;
              relview.strokewidth = link.strokewidth;
              relview.textcolor = link.textcolor;
              relview.textscale = link.textscale;
              relview.dash = link.dash;
              relview.fromArrow = link.fromArrow;
              relview.toArrow = link.toArrow;
              relview.fromArrowColor = link.fromArrowColor;
              relview.toArrowColor = link.toArrowColor;
              // Prepare dispatch
              const jsnRelview = new jsn.jsnRelshipView(relview);
              modifiedRelshipViews.push(jsnRelview);
              const jsnRelship = new jsn.jsnRelationship(relview.relship);
              modifiedRelships.push(jsnRelship);
            }
          }
        }
        if (debug) console.log('1491 ClipboardPasted', modifiedRelshipViews, modifiedRelships, myMetis);
        myDiagram.requestUpdate();
        break;
      }
      case 'LayoutCompleted': {
        if (false) {
        const nodes = myDiagram.nodes;
        for (let it = nodes.iterator; it?.next();) {
            const node = it.value;
            const objectview = node.data.objectview;
            if (objectview) {
              objectview.loc = node.data.loc;
              const jsnObjview = new jsn.jsnObjectView(objectview);
              modifiedObjectViews.push(jsnObjview);              
              myModelview.addObjectView(objectview);
            } else {
              const typeview = node.data.typeview;
            }
        }
        const links = myDiagram.links;
        for (let it = links.iterator; it?.next();) {
          const link = it.value;
          const relview = link.data.relshipview;
          if (!relview) continue;
          const points = [];
          for (let it = link.points.iterator; it?.next();) {
            const point = it.value;
            if (debug) console.log('1603 point', point.x, point.y);
            points.push(point.x)
            points.push(point.y)
          }
          relview.points = points;
          const jsnRelview = new jsn.jsnRelshipView(relview);
          modifiedRelshipViews.push(jsnRelview);
          myModelview.addRelationshipView(relview);
        }
        }
        break;
      }        
      case 'LinkDrawn': {
        const link = e.subject;
        const data = link.data;
        if (debug) console.log('1498 link', link.data, link.fromNode, link.toNode);

        if (false) { // Prepare for linkToLink
          if (linkToLink) {
            let labels = link.labelNodes;
            for (let it = labels.iterator; it?.next();) {
              if (debug) console.log('1177 it.value', it.value);
              const linkLabel = it.value;
              // Connect linkLabel to relview
            }
            if (data.category === 'linkToLink') {
              // This is a link from a relationship between fromNode and toNode to an object
              // The link from rel to object is link.data
              // Todo: Handle this situation
            }
          }
        }
        if (debug) console.log('1289 data', data);
        const fromNode = myDiagram.findNodeForKey(data.from);
        const toNode = myDiagram.findNodeForKey(data.to);

        if (debug) console.log('1519 LinkDrawn', fromNode, toNode, data);
        // Handle relationship types
        if (fromNode?.data?.category === constants.gojs.C_OBJECTTYPE) {
          data.category = constants.gojs.C_RELSHIPTYPE;
          if (debug) console.log('1523 link', fromNode, toNode);
          // link.category = constants.gojs.C_RELSHIPTYPE;
          const reltype = uic.createRelationshipType(fromNode.data, toNode.data, data, context);
          if (reltype) {
            if (debug) console.log('1527 reltype', reltype);
            const jsnType = new jsn.jsnRelationshipType(reltype, true);
            modifiedRelshipTypes.push(jsnType);
            if (debug) console.log('1530 jsnType', jsnType);
            const reltypeview = reltype.typeview;
            if (reltypeview) {
              const jsnTypeView = new jsn.jsnRelshipTypeView(reltypeview);
              modifiedRelshipTypeViews.push(jsnTypeView);
              if (debug) console.log('1535 jsnTypeView', jsnTypeView);
              const myGoModel = myMetis.gojsModel;
              let gjsLink = new gjs.goRelshipTypeLink(utils.createGuid(), myGoModel, reltype);
              gjsLink.fromNode = fromNode.data;
              gjsLink.toNode = toNode.data
              gjsLink.loadLinkContent(myGoModel);
              myGoModel.addLink(gjsLink);
              gjsLink.name = reltype.name;
              if (debug) console.log('1543 link, myGoModel, reltype', gjsLink, myGoModel, reltype);
              myDiagram.model.addLinkData(gjsLink);
              const lnk = myDiagram.findLinkForKey(gjsLink.key);
              if (debug) console.log('1546 lnk, reltype', lnk, reltype);
              myDiagram.model.setDataProperty(lnk.data, 'name', reltype.name);
            }
          }
          myDiagram.requestUpdate();
        }
        // Handle relationships
        if (fromNode?.data?.category === constants.gojs.C_OBJECT) {
          data.category = constants.gojs.C_RELATIONSHIP;
          context.handleOpenModal = this.handleOpenModal;
          if (debug) console.log('1564 data, context', data, context);
          uic.createRelationship(data, context);
        }
        myDiagram.requestUpdate();
        break;
      }
      case "LinkRelinked": {
          let link = e.subject;
          const key = link.key;
          let fromNode = link.fromNode?.data;
          let toNode = link.toNode?.data;
          let relview = link.data?.relshipview;
  
          if (false) {
            let points = [];
            for (let it = link.points.iterator; it?.next();) {
              const point = it.value;
              points.push(point.x)
              points.push(point.y)
            }
            relview.points = points;
            myMetis.relinkedRelview = relview;
          }
          const newLink = e.subject.data;
          newLink.category = constants.gojs.C_RELATIONSHIP;
          if (fromNode.category === constants.gojs.C_OBJECTTYPE)
            newLink.category = constants.gojs.C_RELSHIPTYPE;
          myDiagram.model.setDataProperty(newLink, "name", newLink.name);
          if (debug) console.log('1580 newLink', newLink);
          context.modifiedRelshipViews = modifiedRelshipViews;
          context.modifiedRelships = modifiedRelships;
          context.modifiedRelshipTypes = modifiedRelshipTypes;
          context.modifiedRelshipTypeViews = modifiedRelshipTypeViews;
          uic.onLinkRelinked(newLink, fromNode, toNode, context);
          myDiagram.requestUpdate();          
          break;
      }
      case "LinkReshaped": {
        let link = e.subject;
        link = myDiagram.findLinkForKey(link.key);
        const data = link?.data;
        if (debug) console.log('1596 link, data', link, data);
        let relview = data?.relshipview;
        relview = myModelview.findRelationshipView(relview?.id);
        if (relview) {
          const points = [];
          for (let it = link.data.points.iterator; it?.next();) {
            const point = it.value;
            if (debug) console.log('1603 point', point.x, point.y);
            points.push(point.x)
            points.push(point.y)
          }
          relview.points = points;
          const jsnRelview = new jsn.jsnRelshipView(relview);
          if (debug) console.log('1609 relview, jsnRelview', relview, jsnRelview);
          modifiedRelshipViews.push(jsnRelview);
        }
        break;
      }
      case "SubGraphCollapsed":
      case "SubGraphExpanded": {
          e.subject.each(function (n) {
              const data = n.data;
              const objview = data?.objectview;
              if (objview) {
                objview.isExpanded = data.isExpanded;
                const jsnObjview = new jsn.jsnObjectView(objview);
                modifiedObjectViews.push(jsnObjview);
            }
          });
          break;
      }
      case "BackgroundSingleClicked": {
        if (debug) console.log('1615 BackgroundSingleClicked', e, e.diagram);
        uid.clearFocus(myModelview); 
        break;
      }
      case "BackgroundDoubleClicked": {
        if (debug) console.log('1619 BackgroundDoubleClicked', e, e.diagram);
        break;
      }
      case "ModelChanged": {
        // if (e.isTransactionFinished) {
          console.log("Transaction Finished");
        // }
      }
      default: {
        if (debug) console.log('1399 GoJSApp event name: ', name);
        break;
      }
    }
    // Dispatches
    if (true) {
      if (debug) console.log('1444 modifiedObjectViews', modifiedObjectViews);
      modifiedObjectViews.map(mn => {
        let data = (mn) && mn
        if (mn.id) {
          data = JSON.parse(JSON.stringify(data));
          if (debug) console.log('1449 UPDATE_OBJECTVIEW_PROPERTIES', mn, data)
          context.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
        }
      })

      if (debug) console.log('1412 modifiedObjectTypes', modifiedObjectTypes);
      modifiedObjectTypes?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        if (debug) console.log('1416 UPDATE_OBJECTTYPE_PROPERTIES', data)
        context.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data })
      })

      if (debug) console.log('1420 modifiedObjectTypeViews', modifiedObjectTypeViews);
      modifiedObjectTypeViews?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
        if (debug) console.log('1425 data', data);
      })

      if (debug) console.log('1428 modifiedObjectTypeGeos', modifiedObjectTypeGeos);
      modifiedObjectTypeGeos?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_OBJECTTYPEGEOS_PROPERTIES', data })
      })

      if (debug) console.log('1435 modifiedRelshipViews', modifiedRelshipViews);
      modifiedRelshipViews.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
      })

      if (debug) console.log('1442 modifiedRelshipTypes', modifiedRelshipTypes);
      modifiedRelshipTypes?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        if (debug) console.log('1446 data', data);
        context.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
      })

      // if (debug) console.log('1450 modifiedRelshipTypeViews', modifiedRelshipTypeViews);
      modifiedRelshipTypeViews?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
      })

      if (debug) console.log('1457 modifiedObjects', modifiedObjects);
      modifiedObjects?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        if (debug) console.log('1461 UPDATE_OBJECT_PROPERTIES', data)
        context.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
      })

      if (debug) console.log('1465 modifiedRelships', modifiedRelships);
      modifiedRelships?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        if (debug) console.log('1458 data', data);
        context.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
      })
    } else {
      const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
      let data = { metis: jsnMetis }
      data = JSON.parse(JSON.stringify(data));
      myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
    }
    if (debug) console.log('1704 myMetis', myMetis);
  }
 
  public render() {
    const selectedData = this.state.selectedData;
    if (debug) console.log('1483 selectedData', selectedData, this.props);
    let modalContent, inspector, selector, header, category, typename;
    const modalContext = this.state.modalContext;
    if (debug) console.log('1486 modalContext ', modalContext);
    if (modalContext?.what === 'selectDropdown') {
      let options = ''
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
      options = this.state.selectedData.map(o => o && { 'label': o, 'value': o });
      comps = null
      if (debug) console.log('1507 options', options, this.state);
      const { selectedOption } = this.state;
      if (debug) console.log('1509 selectedOption', selectedOption, this.state);

      const value = (selectedOption) ? selectedOption.value : options[0];
      const label = (selectedOption) ? selectedOption.label : options[0];
      if (debug) console.log('1513 selectedOption, value, label ', selectedOption, value, label);
      header = modalContext.title;
      modalContent =
        <div className="modal-selection d-flex justify-content-center">
          <Select className="modal-select"
            options={options}
            components={comps}
            onChange={value => this.handleSelectDropdownChange(value)}
          />
        </div>
      {/* <option value={option.value}>{label: option.label, option.value}</option>
        */}
    } else {
      if (selectedData !== null) {
        if (debug) console.log('1527 selectedData', selectedData);
        inspector =
          <div className="p-2" style={{ backgroundColor: "#ddd" }}>
            <p>Selected Object Properties:</p>
            <SelectionInspector
              myMetis={this.state.myMetis}
              selectedData={this.state.selectedData}
              context={this.state.context}
              onInputChange={this.handleInputChange}
            />
          </div>
      }
    }

    if (this.state.myMetis) { this.state.myMetis.dispatch = this.state.dispatch };
    if (debug) console.log('1542 dispatch', this.state.myMetis.dispatch);
    if (debug) console.log('1543 linkdataarray:', this.state.linkDataArray);
    return ((this.state) &&
      <div className="diagramwrapper">
        <DiagramWrapper
          nodeDataArray={this.state.nodeDataArray}
          linkDataArray={this.state.linkDataArray}
          modelData={this.state.modelData}
          modelType={this.state.modelType}
          skipsDiagramUpdate={this.state.skipsDiagramUpdate}
          onDiagramEvent={this.handleDiagramEvent}
          onModelChange={this.handleModelChange}
          onInputChange={this.handleInputChange}
          myMetis={this.state.myMetis}
          myGoModel={this.state.myGoModel}
          myGoMetamodel={this.state.myGoMetamodel}
          dispatch={this.state.dispatch}
          diagramStyle={this.state.diagramStyle}
          onExportSvgReady={this.state.onExportSvgReady}
        />

        <Modal className="" isOpen={this.state.showModal}  >
          {/* <div className="modal-dialog w-100 mt-5">
            <div className="modal-content"> */}
          <div className="modal-head">
            <Button className="modal-button btn-sm float-right m-1" color="link"
              onClick={() => { this.handleCloseModal('x') }} ><span>x</span>
            </Button>
            <ModalHeader className="modal-header" >
              <span className="text-secondary">{header} </span>
              <span className="modal-name " >{this.state.selectedData?.name} </span>
              <span className="modal-objecttype float-right"> {typename} </span>
            </ModalHeader>
          </div>
          <ModalBody >
            <div className="modal-body1">
              {/* <div className="modal-pict"><img className="modal-image" src={icon}></img></div> */}
              {modalContent}
            </div>
          </ModalBody>
          <ModalFooter className="modal-footer">
            <Button className="modal-button bg-link m-0 p-0" color="link" onClick={() => { this.handleCloseModal() }}>Done</Button>
          </ModalFooter>
          {/* </div>
          </div> */}
        </Modal>
      </div>

    );
  }
}

export default GoJSApp;
