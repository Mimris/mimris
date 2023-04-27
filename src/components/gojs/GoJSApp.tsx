// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;
const linkToLink= false;

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
const utils     = require('../../akmm/utilities');

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
  modelData:    go.ObjectData;
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
      selectedOption: null
    };
    if (debug) console.log('76 this.state.linkDataArray: ',this.state.linkDataArray);
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
    const context = {
      "myMetis":      myMetis,
      "myMetamodel":  myMetis.currentMetamodel,
      "myModel":      myMetis.currentModel,
      "myModelview":  myMetis.currentModelview,
      "myGoModel":    myMetis.gojsModel,
      "myDiagram":    myMetis.myDiagram,
      "modalContext": this.state.modalContext
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
    for (let i=0; i<systemtypes.length; i++) {
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
    if (debug) console.log('208 handleDiagramEvent', myMetis);
    const myModel = myMetis?.findModel(this.state.phFocus?.focusModel.id);
    const myModelview = myMetis?.findModelView(this.state.phFocus?.focusModelview.id);
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
    for (let i=0; i<nods?.length; i++) {
      const node = nods[i] as gjs.goObjectTypeNode;
      const objtype = node.objecttype;
      if (objtype.abstract) continue;
      if (objtype.markedAsDeleted)  continue;
      nodes.push(node);
    }
    if (nodes?.length > 0) myGoMetamodel.nodes = nodes;
    if (debug) console.log('230 gojsMetamodel', myGoMetamodel);

    const gojsMetamodel = {
      nodeDataArray: myGoMetamodel?.nodes,
      linkDataArray: myGoMetamodel?.links
    }
    if (debug) console.log('236 gojsMetamodel', gojsMetamodel);
    let modifiedNodes         = new Array();
    let modifiedLinks         = new Array();
    let modifiedTypeNodes     = new Array();
    let modifiedTypeViews     = new Array();
    let modifiedTypeGeos      = new Array();
    let modifiedTypeLinks     = new Array();
    let modifiedLinkTypeViews = new Array();
    let modifiedObjects       = new Array();
    let modifiedRelships      = new Array();
    let selectedObjectViews   = new Array();
    let selectedRelshipViews  = new Array();
    let selectedObjectTypes   = new Array();
    let selectedRelationshipTypes   = new Array();
    let done = false;
    let pasted = false;

    const context = {
      "myMetis":          myMetis,
      "myMetamodel":      myMetamodel,
      "myModel":          myModel,
      "myModelview":      myModelview,
      "myGoModel":        myGoModel,
      "myGoMetamodel":    myGoMetamodel,
      "myDiagram":        myDiagram,
      "dispatch":         dispatch,
      "pasted":           pasted,
      "done":             done,
      "askForRelshipName":    myModelview?.askForRelshipName,
      "includeInheritedReltypes": myModelview?.includeInheritedReltypes,
      "handleOpenModal":  this.handleOpenModal,
      "modifiedLinks":    null,
      "modifiedRelships": null,
      "modifiedTypeLinks": null,
      "modifiedLinkTypeViews": null,
    }
    if (debug) console.log('265 handleDiagramEvent - context', name, this.state, context);
    if (debug) console.log('266 handleEvent', myMetis);
    if (debug) console.log('267 this', this);
    if (debug) console.log('268 event name', name);

    switch (name) {
      case 'TextEdited': {
        const sel = e.subject.part;
        const data = sel.data;
        const textvalue = data.text;
        let field = e.subject.name;
        if (debug) console.log('275 data', data, field, sel);
        // Object type or Object
          if (sel instanceof go.Node) {
            const key = data.key;
            let text  = data.name;
            const category = data.category;
            if (debug) console.log('281 data', data);
            // Object type
            if (category === constants.gojs.C_OBJECTTYPE) {
              if (text === 'Edit name') {
                text = prompt('Enter name');
              }
              const myNode = sel;
              if (debug) console.log('290 myNode, text', myNode, text);
              if (myNode) {
                data.name = text;
                if (debug) console.log('293 data, field, text', data, field, text);
                uic.updateObjectType(data, field, text, context);
                if (debug) console.log('295 TextEdited', data);
                const objtype = myMetis.findObjectType(data.objecttype?.id);
                if (objtype) {
                  const jsnObjType = new jsn.jsnObjectType(objtype, true);
                  modifiedTypeNodes.push(jsnObjType);
                  if (debug) console.log('300 TextEdited', jsnObjType);
                }
              }
            } else { // Object           
              if (text === 'Edit name') {
                text = prompt('Enter name');
                data.name = text;
              }
              const myNode = this.getNode(myGoModel, key);
              myNode.text = textvalue;
              if (debug) console.log('310 textvalue, node', textvalue, myNode);
              if (myNode) {
                  myNode.name = text;
                // }
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
                  for (let i=0; i<objviews.length; i++) {
                    const objview = objviews[i];
                    objview.name = text;
                    objview.text = textvalue;
                    if (debug) console.log('328 objview', objview);
                    // objview.text = myNode.text;
                    let node = myGoModel.findNodeByViewId(objview?.id);
                    if (node) {
                      if (debug) console.log('330 node', node);
                      const n = myDiagram.findNodeForKey(node.key) as any;
                      if (n) node = n;
                      myDiagram.model?.setDataProperty(node.data, "name", myNode.name);
                      const jsnObjview = new jsn.jsnObjectView(objview);
                      jsnObjview.name = text;
                      jsnObjview.text = textvalue;
                      modifiedNodes.push(jsnObjview);
                      if (debug) console.log('337 jsnObjview', jsnObjview);
                    } 
                  }
                }
                const jsnObj = new jsn.jsnObject(obj);
                jsnObj.text = textvalue;
                modifiedObjects.push(jsnObj);
                if (debug) console.log('343 obj, jsnObj', obj, jsnObj);
              }
            }
            const nodes = myGoModel?.nodes;
            for (let i=0; i<nodes?.length; i++) {
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
            let text = data.nameFrom ? data.nameFrom : " ";
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
                  modifiedTypeLinks.push(jsnReltype);
                  if (debug) console.log('376 TextEdited', modifiedTypeLinks);
                }
              }
              myDiagram.model?.setDataProperty(myLink.data, "name", myLink.name);
            }             
            else { // Relationship
              if (debug) console.log('382 data', data);
              let relview = data.relshipview;
              if (relview) {
                if (text === 'Edit name') {
                  text = prompt('Enter name');
                  data.name = text;
                }
                const rel = relview.relship;
                if (rel) {
                  rel.name = text;
                  const relviews = rel.relshipviews;
                  if (debug) console.log('394 rel, relviews', rel, relviews);
                  for (let i=0; i<relviews.length; i++) {
                    const relview = relviews[i];
                    relview.name = text;
                    const jsnRelview = new jsn.jsnRelshipView(relview);
                    if (debug) console.log('407 jsnRelview', jsnRelview);
                    modifiedLinks.push(jsnRelview);
                    const jsnRel = new jsn.jsnRelationship(rel);
                    if (debug) console.log('418 jsnRel', jsnRel);
                    modifiedRelships.push(jsnRel);
                  }
                }
              }
            }
          }
      }
      break;
      case "SelectionMoved": {        
        if (debug) console.log('412 context', context);
        const goModel = context.myGoModel;
        if (debug) console.log('414 goModel', goModel);
        // First remember the original locs
        const dragTool = myDiagram.toolManager.draggingTool;
        const myParts = dragTool.draggedParts;
        if (debug) console.log('417 parts', myParts);
        const myFromNodes  = [];
        for (let it = myParts.iterator; it?.next();) {
            let n = it.value;
            let loc = it.value.point.x + " " + it.value.point.y;
            if (debug) console.log('422 n, it.key.data, loc', n, it.key.data, loc);
            if (!(it.key.data.category === 'Object')) 
              continue;
            let scale = it.key.data.scale1;
            if (!scale) scale = "1";
            const myFromNode = { 
              "key":     it.key.data.key, 
              "name":    it.key.data.name,
              "loc":     new String(loc),
              "scale":   new String(scale),
            }
            myFromNodes.push(myFromNode);
            if (debug) console.log('434 myFromNode', myFromNode);
        }
        // Then remember the new locs
        const selection = e.subject;
        if (debug) console.log('437 selected', selection);
        const myToNodes  = [];
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
                "key":     n.data.key, 
                "name":    n.data.name,
                "loc":     new String(n.data.loc),
                "scale":   new String(n.data.scale1)
              }
              myToNodes.push(myToNode);
            }
        }
        if (debug) console.log('459 myFromNodes, myToNodes', myFromNodes, myToNodes);

        // First do the move and scale the nodes. Do not worry about the correct location of the nodes.
        let selcnt = 0;
        let refloc;
        let count = -1;
        let rloc;
        for (let it = selection.iterator; it?.next();) {
          const sel = it.value;
          const data = sel.data;
          if (data.category === 'Relationship' || data.category === 'Relationship type') 
            continue;
          const typename = data.type;
          if (debug) console.log('470 typename', typename, data.objecttype);
          if (typename === "Object type") // Object type
          {
              const objtype = myMetis.findObjectType(data.objecttype.id);
              if (debug) console.log('474 objtype', objtype);
              if (objtype) {
                  let objtypeGeo = context.myMetamodel.findObjtypeGeoByType(objtype);
                  if (debug) console.log('477 objtypegeo', objtypeGeo);
                  if (!objtypeGeo) {
                      objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), context.myMetamodel, objtype, "", "");
                  }
                  objtypeGeo.setLoc(data.loc);
                  objtypeGeo.setSize(data.size);
                  objtypeGeo.setModified();
                  const jsnObjtypeGeo = new jsn.jsnObjectTypegeo(objtypeGeo);
                  if (debug) console.log('485 jsnObjtypeGeo', jsnObjtypeGeo);
                  modifiedTypeGeos.push(jsnObjtypeGeo);
              }
          }
          else // Object
          {
            // First do the move and scale the nodes. Do not worry about the correct location of the nodes.
            if (debug) console.log('501 data', data);
            const hasMemberType = myMetis.findRelationshipTypeByName(constants.types.AKM_HAS_MEMBER);
            const myModelview = context.myModelview;
            const myObjectviews = myModelview.objectviews;
            if (debug) console.log('501 myObjectviews', myObjectviews);    
            // The object to move
            let fromloc, fromNode;
            for (let j=0; j<myFromNodes.length; j++) {
                const fnode = myFromNodes[j];
                if (fnode.key === data.key) {
                  fromNode = fnode;
                  fromloc = fnode.loc.valueOf();
                  break;
                }
            }
            let toloc, toNode;
            for (let j=0; j<myToNodes.length; j++) {
                const tnode = myToNodes[j];
                if (tnode.key === data.key) {
                  toNode = tnode;
                  toloc = tnode.loc.valueOf();
                  break;
                }
            }
            if (debug) console.log('523 data, fromloc, toloc, fromNode, toNode', data, fromloc, toloc, fromNode, toNode);
            // Move the object
            if (debug) console.log('527 selcnt, data', selcnt, data);
            let node = uic.changeNodeSizeAndPos(data, fromloc, toloc, myGoModel, myDiagram, modifiedNodes) as gjs.goObjectNode;
            node = goModel?.findNode(data.key);
            if (node) {
              node.scale1 = node.getMyScale(myGoModel).toString();
              if (debug) console.log('532 node, node.scale1', node, node.scale1);
              if (debug) console.log('532 myGoModel, node.loc', myGoModel, node.loc);
              const group = uic.getGroupByLocation(myGoModel, node.loc);
              if (debug) console.log('533 group', group);
              if (debug) console.log('534 selcnt, group, node', selcnt, group, node);

              const containerType = myMetis.findObjectTypeByName(constants.types.AKM_CONTAINER);
              if (group) { // The node IS moved into a group or moved INSIDE a group
                const parentgroup = group;
                node.group = parentgroup.key;
                myDiagram.model.setDataProperty(data, "group", node.group);
                if (debug) console.log('557 parentgroup, node', parentgroup, node);
                if (group?.objecttype?.id !== containerType?.id && hasMemberType) {
                  const parentObj = parentgroup.object;
                  let rel = null;
                  let fromObj = null;
                  // Check if a relationship of type 'hasMember' exists between the new parent (group) 
                  // and the (current) node
                  const inputRels = node.object.getInputRelshipsByType(hasMemberType);
                  if (debug) console.log('567 node, inputRels', node, inputRels);
                  for (let i=0; i<inputRels?.length; i++) {
                    const r = inputRels[i];
                    fromObj = r.fromObject;
                    if (debug) console.log('570 i, r, fromObj, id', i, r, fromObj, fromObj.id);
                    if (fromObj.id !== parentObj.id) {
                      r.markedAsDeleted = true;
                      const jsnRelship = new jsn.jsnRelationship(r);
                      jsnRelship.markedAsDeleted = true;
                      modifiedRelships.push(jsnRelship);
                      if (debug) console.log('576 jsnRelship', jsnRelship);
                    }
                  }
                  // Find the corresponding relationship view if it exists and mark it as deleted
                  const relviews = myModelview.getRelviewsByFromAndToObjviews(parentObj.objectview, node.objectview);
                  if (debug) console.log('582 relviews', relviews);
                  for (let j=0; j<relviews?.length; j++) {
                    const relview = relviews[j];
                    relview.markedAsDeleted = true;
                    const jsnRelview = new jsn.jsnRelshipView(relview);
                    modifiedLinks.push(jsnRelview);
                    // Then delete the gojs link
                    const link = myGoModel.findLinkByViewId(relview.id);
                    if (link) {
                        link.markedAsDeleted = true;
                        myDiagram.model.removeLinkData(link); 
                    }
                    if (debug) console.log('588 jsnRelview', jsnRelview);
                  }
                  if (debug) console.log('590 group', group);
                  {
                    const outputRels = parentObj.getOutputRelshipsByType(hasMemberType);
                    if (debug) console.log('593 parentObj, outputRels', parentObj, outputRels);
                    for (let i=0; i<outputRels?.length; i++) {
                      const r = outputRels[i];
                      if (r.toObject.id === node.object.id) {
                        r.fromObject = fromObj;
                        r.markedAsDeleted = false;
                        const jsnRelship = new jsn.jsnRelationship(r);
                        modifiedRelships.push(jsnRelship);
                        if (debug) console.log('601 jsnRelship', jsnRelship);
                      }
                    }
                  }
                  // Check if a relationship of type 'hasMember' exists between the parent group and the node
                  // If not, create it
                  const outputRels = parentObj.getOutputRelshipsByType(hasMemberType);
                  if (debug) console.log('564 outputRels', outputRels);
                  // Handle relationships of type hasMember if they exist
                  for (let i=0; i<outputRels?.length; i++) {
                    const r = outputRels[i];
                    if (r.toObject.id !== node.object.id) {
                      // Not the correct relationship
                      continue;
                    }
                    // Found the correct relationship
                    rel = r;
                    // Find the corresponding relationship view if it exists and mark it as deleted
                    const relviews = myModelview.getRelviewsByFromAndToObjviews(parentgroup.objectview, node.objectview);
                    for (let j=0; j<relviews?.length; j++) {
                      const relview = relviews[j];
                      relview.markedAsDeleted = true;
                      const jsnRelview = new jsn.jsnRelshipView(relview);
                      modifiedLinks.push(jsnRelview);
                      if (debug) console.log('582 jsnRelview', jsnRelview);
                      // Then delete the gojs link
                      const link = myGoModel.findLinkByViewId(relview.id);
                      if (link) {
                          link.markedAsDeleted = true;
                          myDiagram.model.removeLinkData(link); 
                      }
                      if (debug) console.log('540 delete relview', relview);
                    }
                    break;
                  }
                  
                  if (debug) console.log('587 rel', rel);
                  if (!rel) {
                    // Create a new relationship
                    rel = new akm.cxRelationship(utils.createGuid(), hasMemberType, parentObj, node.object, hasMemberType.name, "");
                    rel.setModified();
                    myMetis.addRelationship(rel);
                    myModel?.addRelationship(rel);
                    const jsnRel = new jsn.jsnRelationship(rel);
                    modifiedRelships.push(jsnRel);
                    if (debug) console.log('596 rel', rel);
                  }
                  if (false) {
                    // The relationship now exists. Check if the relationship view also exists
                    // If not, create it
                    let relview = null;
                    const relviews = myModelview.getRelviewsByFromAndToObjviews(parentgroup.objectview, node.objectview);
                    if (relviews.length > 0) {
                      relview = relviews[0];
                      if (debug) console.log('591 relview', relview);
                    } else {
                      // Create a new relationship view
                      relview = new akm.cxRelationshipView(utils.createGuid(), rel.name, rel, "");
                      relview.setFromObjectView(parentgroup.objectview);
                      relview.setToObjectView(node.objectview);
                      myModelview.addRelationshipView(relview);
                      myMetis.addRelationshipView(relview);
                      const jsnRelview = new jsn.jsnRelshipView(relview);
                      modifiedLinks.push(jsnRelview);
                      if (debug) console.log('601 relview', relview);
                    }                        
                    if (debug) console.log('603 relview', relview);
                  }
                  if (debug) console.log('609 myModelview', myModelview);
                }
                // Do the scaling and location of the node
                toNode.scale = new String(node.getMyScale(myGoModel));
                if (debug) console.log('625 fromNode, toNode', fromNode, toNode);
                const scale0 = fromNode.scale.valueOf();
                const scale1 = toNode.scale.valueOf();
                let scaleFactor = scale0 < scale1 ? scale0 / scale1 : scale1 / scale0;
                if (debug) console.log('539 scale0, scale1, scaleFactor', scale0, scale1, scaleFactor);
                node.scale1 = scale1;
                let key = data.key;
                key = key.substr(0, 36);  // Hack - should not be neccessary
                if (selcnt == 0) {
                  refloc = node.loc;
                  if (debug) console.log('545 node, refloc', node, refloc);
                }
                if (selcnt > 0) {
                  let toloc;
                  for (let j=0; j<myToNodes.length; j++) {
                      const toNode = myToNodes[j];
                      if (toNode.key === key) {
                          toloc = toNode.loc;
                          break;
                      }
                  }
                  let fromloc;
                  for (let j=0; j<myFromNodes.length; j++) {
                      const fromNode = myFromNodes[j];
                      if (fromNode.key === key) {
                          fromloc = fromNode.loc;
                          break;
                      }
                  }
                  if (debug) console.log('564 node, refloc, fromloc, toloc, scaleFactor', node, refloc, fromloc, toloc, scaleFactor);
                  const nodeloc = uic.scaleNodeLocation2(node, refloc, toloc, scaleFactor);
                  if (nodeloc) {
                    const loc = nodeloc.x + " " + nodeloc.y;
                    node.loc = loc;
                    toNode.loc = new String(loc);
                  }
                  if (debug) console.log('571 node, toNode', node, toNode);
                }
                if (node.isGroup) {
                    node.memberscale = node.typeview.memberscale;
                    if (debug) console.log('575 group, node', parentgroup, node);
                    if (debug) console.log('576 context', context);
                    node.group = parentgroup.key;
                    // const subNodes = uic.scaleNodesInGroup(node, myGoModel, myObjectviews, myFromNodes, myToNodes, myDiagram);
                    // if (debug) console.log('463 parentgroup, node, subNodes', parentgroup, node, subNodes);
                }                  
              } else { // node is NOT moved into a group, possibly out of a group
                node.group = "";
                let fromScale = fromNode.scale; 
                let toScale  =  1;
                let scaleFactor = fromScale > toScale ? fromScale / toScale : toScale / fromScale;
                myDiagram.model.setDataProperty(node.data, "group", node.group);
                if (node.isGroup) {
                    // The node itself is a group, do not scale the group members
                    node.scale1 = 1;
                    node.group = "";
                    node.memberscale = node.typeview.memberscale;
                    myDiagram.model.setDataProperty(node, "scale", Number(node.scale1));
                    const nodes = uic.getNodesInGroup(node, myGoModel, myObjectviews);
                    let refloc = node.loc;
                    if (debug) console.log('688 node, nodes, scaleFactor, refloc', node, nodes, scaleFactor, refloc);
                    for (let i=0; i<nodes.length; i++) {
                        const n = nodes[i];
                        if (n) {
                            n.scale1 = n.getMyScale(myGoModel);
                            let fromLoc;
                            for (let j=0; j<myFromNodes?.length; j++) {
                                const fromNode = myFromNodes[j];
                                if (fromNode.key === n.key) {
                                    fromLoc = fromNode.loc;
                                    fromScale = fromNode.scale;
                                    if (debug) console.log('699 fromNode, fromLoc, fromScale', fromNode, fromLoc, fromScale);
                                    break;
                                }
                            }
                            let toNode, toLoc;
                            for (let j=0; j<myToNodes?.length; j++) {
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
                                n.scale1 = Number(toScale.valueOf());                  
                                let nod = myGoModel.findNodeByViewId(n.objectview.id) as any;
                                if (nod) {
                                    nod = myDiagram.findNodeForKey(nod.key);
                                    nod.loc = loc;
                                    nod.scale1 = Number(toScale.valueOf());
                                    myDiagram.model.setDataProperty(nod.data, "loc", loc);
                                  }
                                if (debug) console.log('727 nod, loc', nod, loc);
                            }                  
                        }
                    }
                } else {
                  // The node moved is NOT a group
                  let n = myDiagram.findNodeForKey(node.key);
                  if (debug) console.log('734 node, group', node, group);
                  if (count<0) { // The reference node
                      count++;
                      rloc = node.loc;
                      node.objectview.loc = node.loc;
                  } else {
                    if (debug) console.log('647 fromScale, toScale', fromScale, toScale);
                    if (debug) console.log('649 node, rloc, toloc, scaleFactor', node, rloc, toloc, scaleFactor);
                    const nodeloc = uic.scaleNodeLocation2(node, rloc, toloc, scaleFactor);
                    if (nodeloc) {
                      const loc = nodeloc.x + " " + nodeloc.y;
                      toloc = new String(loc);
                      node.loc = loc;
                      node.objectview.loc = toloc.valueOf();
                      if (debug) console.log('656 loc, scaleFactor, node', loc, scaleFactor, node);
                      myDiagram.model.setDataProperty(n.data, "loc", loc);
                    }
                  }
                  node.objectview.group = "";
                  if (debug) console.log('704 objectview, loc', node.objectview, node.loc);
                  node.scale1 = Number(toScale.valueOf());
                  myDiagram.model.setDataProperty(n, "scale", node.scale1);
                  // Handle hasMember relationships
                  const myGoModel = myMetis.gojsModel;
                  const toObjview = node.objectview;
                  const toObj = node.object;
                  const hasMemberRels = toObj.getInputRelshipsByType(hasMemberType);
                  if (debug) console.log('762 toObj, hasMemberRels', toObj, hasMemberRels);
                  for (let i=0; i<hasMemberRels?.length; i++) {
                    let relview = null;
                    const hasMemberRel = hasMemberRels[i];
                    if (hasMemberRel) {
                      let relviews = hasMemberRel.relshipviews;
                      for (let j=0; j<relviews?.length; j++) {
                        const rview = relviews[j];
                        if (rview && !rview.markedAsDeleted) { 
                          if (rview.toObjview.id === toObjview.id) {
                            if (!relview) 
                              relview = rview;  
                            else {
                              rview.markedAsDeleted = true;
                              if (debug) console.log('779 rview', rview);
                              const link = myGoModel.findLinkByViewId(rview.id);
                              if (link) {
                                  link.markedAsDeleted = true;
                                  myDiagram.model.removeLinkData(link); 
                              }                                      }
                            if (debug) console.log('781 relview', relview);
                          }
                        }
                      }
                    }
                    if (!relview) {
                      relview = new akm.cxRelationshipView(utils.createGuid(), hasMemberRel.name, hasMemberRel, "");
                      if (debug) console.log('788 relview', relview);
                      relview.toObjview = toObjview;
                      const fromGroup = hasMemberRel.fromObject;  // group
                      const objviews = myModelview.findObjectViewsByObject(fromGroup);
                      if (objviews) {
                        for (let j=0; j<objviews.length; j++) {
                          const fromObjview = objviews[j];   // group
                          if (fromObjview) {
                            relview.fromObjview = fromObjview;
                            if (debug) console.log('798 relview', relview);
                            hasMemberRel.addRelationshipView(relview);
                            myModelview.addRelationshipView(relview);
                            myMetis.addRelationshipView(relview);     
                            const jsnRelview = new jsn.jsnRelshipView(relview);
                            if (debug) console.log('802 jsnRelview', jsnRelview);
                            modifiedLinks.push(jsnRelview);
                            // Add link
                            let link = new gjs.goRelshipLink(utils.createGuid(), myGoModel, relview);
                            if (!myDiagram.findLinkForKey(link.key)) {
                              link.loadLinkContent(myGoModel);
                              myGoModel.addLink(link);
                              myDiagram.model.addLinkData(link);
                              if (debug) console.log('810 link', link);
                            }
                            if (debug) console.log('812 relview, link', relview, link);
                          }
                        }
                      }
                    }                    
                  }
                  if (debug) console.log('818 myGoModel', myGoModel);
                }
                          
                if (debug) console.log('821 node, data,', node, data);
                // Handle relview scaling
                let n = myDiagram.findNodeForKey(node.key);
                if (n) {
                  for (let lnks = n?.findLinksConnected(); lnks?.next(); ) {
                    let link = lnks?.value;  
                    if (debug) console.log('671 link', link);
                    if (link) {
                      if(debug) console.log('673 link', link);
                      let relview = link.data.relshipview;
                      if (relview) {
                        // Handle relview scaling
                        if (group) {
                          const grpScale = group.scale1;
                          const grpMemberscale = group.memberscale;
                          const textscale = (group && grpScale) ? grpScale * grpMemberscale : "1";
                          relview.textscale = textscale;
                          uic.setLinkProperties(link, relview, myDiagram);
                        }
                        // Handle relview points
                        relview.points = link.points;
                        const jsnRelview = new jsn.jsnRelshipView(relview);
                        modifiedLinks.push(jsnRelview);
                      }
                    }
                  }  
                }   
                if (debug) console.log('848 group, node, n', group, node, n);
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
                if (debug) console.log('693 myGoModel', myGoModel);
              }
            }
            // Update objectview scaling and location
            if (debug) console.log('863 myFromNodes, myToNodes', myFromNodes, myToNodes);
            for (let i=0; i<myGoModel.nodes.length; i++) {
              let tnode;
              const node = myGoModel.nodes[i] as gjs.goObjectNode;
              for (let j=0; j<myToNodes.length; j++) {
                tnode = myToNodes[j];
                if (node.key === tnode.key) {
                  node.loc = tnode.loc.valueOf();
                  break;
                }
              }
              const objview = node.objectview;
              objview.scale1 = node.scale1;
              objview.loc = node.loc;
              if (debug) console.log('706 node, objview', node, objview);
              if (node.group) {
                const grp = myGoModel.findNode(node.group);
                objview.group = grp?.objectview.id;
              } else {
                objview.group = "";
              }
              const jsnObjview = new jsn.jsnObjectView(objview);
              if (jsnObjview) {
                jsnObjview.loc = node.loc;
                uic.addItemToList(modifiedNodes, jsnObjview);
                if (debug) console.log('753 jsnObjview', jsnObjview);
              }
            }
            selcnt++;
          }
        
          if (debug) console.log('893 modifiedNodes', modifiedNodes);
        
          // Update objectviews in the modelview
          for (let j=0; j<modifiedNodes.length; j++) {
            const modnode = modifiedNodes[j];
            for (let i=0; i<myModelview.objectviews.length; i++) {
              const objview = myModelview.objectviews[i];
              if (objview.id === modnode.id) {
                objview.loc = modnode.loc;
                objview.scale1 = modnode.scale1;
                objview.group = modnode.group;
                break;
              }
            }
          }
          if (debug) console.log('908 modelview', myModelview);
          myDiagram.requestUpdate();
          if (debug) console.log('910 myGoModel', myDiagram.model.linkDataArray);
          if (debug) console.log('911 myMetis', myMetis);
        }
        uic.deleteDuplicateRelshipViews(myModelview);
      }
      break;
      case "SelectionDeleting": {
        if (debug) console.log('727 myMetis', myMetis); 
        const deletedFlag = true;
        let renameTypes = false;
        const selection = e.subject;
        if (debug) console.log('738 selection', selection);
        const data = selection.first().data;
        if (debug) console.log('732 data, selection', data, selection);
        if (this.isMetamodelType(data.category)) {
          if (confirm("If instances exists, do you want to change their types instead of deleting?")) {
              renameTypes = true;
          }   
          // If an object type, identify connected relationship types
          const reltypes = [];
          for (let it = selection?.iterator; it?.next();) {
            const sel  = it.value;
            const data = sel.data;
            if (data.category === constants.gojs.C_OBJECTTYPE) {
              const objtype = myMetis.findObjectType(data.objecttype?.id);
              if (objtype) {
                const inputReltypes = objtype.inputreltypes;
                for (let i=0; i<inputReltypes?.length; i++) {
                  const reltype = inputReltypes[i];
                  if (reltypes.indexOf(reltype) === -1) reltypes.push(reltype);
                }
                const outputReltypes = objtype.outputreltypes;
                for (let i=0; i<outputReltypes?.length; i++) {
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
              const sel  = it.value;
              const data = sel.data;
              if (debug) console.log('743 sel, data', sel, data);
              const key  = data.key;
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
                      for (let i=0; i<rels.length; i++) {
                        const rel = rels[i];
                        rel.type = defRelType;
                        rel.typeview = defRelType.typeview;
                        const jsnRel = new jsn.jsnRelationship(rel);
                        modifiedRelships.push(jsnRel);
                      }
                    } else { // delete the corresponding relationships
                      for (let i=0; i<rels.length; i++) {
                        const rel = rels[i];
                        rel.markedAsDeleted = deletedFlag;
                      }
                    }
                  }
                  // Check if reltype comes from or goes to a systemtype
                  // If so, ask if you really wants to delete
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
                  }
                }
              }
            }
            // Handle objecttypes
            for (let it = selection?.iterator; it?.next();) {
              const sel  = it.value;
              const data = sel.data;
              if (debug) console.log('805 sel, data', sel, data);
              const key  = data.key;
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
                      for (let i=0; i<objects.length; i++) {
                        const obj = objects[i];
                        obj.type = defObjType;
                        obj.typeview = defObjType.typeview;
                        // const jsnObj = new jsn.jsnObject(obj);
                        // modifiedObjects.push(jsnObj);
                      }
                    } else { // delete the corresponding objects
                      for (let i=0; i<objects.length; i++) {
                        const obj = objects[i];
                        obj.markedAsDeleted = deletedFlag;
                      }
                    }
                  }
                  objtype.markedAsDeleted = deletedFlag;
                  let objtypeview = objtype.typeview as akm.cxObjectTypeView;
                  if (objtypeview) {
                      objtypeview.markedAsDeleted = deletedFlag;
                  }
                  const geo = context.myMetamodel.findObjtypeGeoByType(objtype);
                  if (geo) {
                      geo.markedAsDeleted = deletedFlag;
                  }  
                }          
              }
            }
          }
        } else {
          // Handle objects
          for (let it = selection?.iterator; it?.next();) {
            const sel  = it.value;
            const data = sel.data;
            const key  = data.key;
            if (data.category === constants.gojs.C_OBJECT) {
              if (debug) console.log('866 sel, data', sel, data);
              const key  = data.key;
              const myNode = this.getNode(context.myGoModel, key);  // Get nodes !!!
              if (myNode) {
                if (debug) console.log('870 delete node', data, myNode);
                uic.deleteNode(myNode, deletedFlag, context);
                if (debug) console.log('872 delete node', data, myNode);
              }
            }
          }
          // Handle relationships
          for (let it = selection?.iterator; it?.next();) {
            const sel  = it.value;
            const data = sel.data;
            const key  = data.key;
            if (data.category === constants.gojs.C_RELATIONSHIP) {
              const myLink = this.getLink(context.myGoModel, key);
              if (debug) console.log('888 myLink, data', myLink, data);
              uic.deleteLink(data, deletedFlag, context);
              const relview = data.relshipview;
              if (relview && relview.category === constants.gojs.C_RELATIONSHIP) {
                relview.markedAsDeleted = deletedFlag;
                relview.relship = myMetis.findRelationship(relview.relship.id);
                if (!myMetis.deleteViewsOnly) {
                  const relship = relview.relship;
                  relship.markedAsDeleted = deletedFlag;
                }
              }
            }
          }
        }
        if (debug) console.log('933 myMetis', myMetis); 
      }
      if (debug) console.log('935 Deletion completed', myMetis);

      const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
      if (debug) console.log('938 jsnMetis', jsnMetis);
      let data = {metis: jsnMetis}
      data = JSON.parse(JSON.stringify(data));
      if (debug) console.log('941 PhData', data);
      myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })       

      return;

      break;
      case 'ExternalObjectsDropped': {
        e.subject.each(function(n) {
          const node = myDiagram.findNodeForKey(n.data.key);
          let part = node.data;
          part.scale = node.scale;
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
              if (debug) console.log('927 modifiedTypeNodes', jsnObjtype);
              modifiedTypeNodes.push(jsnObjtype);

              const jsnObjtypeView = new jsn.jsnObjectTypeView(otype.typeview);
              if (debug) console.log('931 modifiedTypeViews', jsnObjtypeView);
              modifiedTypeViews.push(jsnObjtypeView);

              const loc  = part.loc;
              const size = part.size;
              const objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), context.myMetamodel, otype, loc, size);
              const jsnObjtypeGeo = new jsn.jsnObjectTypegeo(objtypeGeo);
              if (debug) console.log('938 modifiedTypeGeos', jsnObjtypeGeo);
              modifiedTypeGeos.push(jsnObjtypeGeo);
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
              if (!objview.size) {
                // Hack
                if (debug) console.log('1009 objview', objview);
                if (objview.isGroup) {
                  node.size = "200 100";
                  myDiagram.model?.setDataProperty(n.data, "size", node.size);
                  objview.size = node.size;
                } else {
                  node.size = "160 70";
                  objview.size = node.size;
                  myDiagram.model?.setDataProperty(n.data, "size", node.size);
                }
                // End hack
              }
              const jsnObjview = new jsn.jsnObjectView(objview);
              uic.addItemToList(modifiedNodes, jsnObjview);
              if (debug) console.log('966 New object', jsnObjview, modifiedNodes);
              const jsnObj = new jsn.jsnObject(objview.object);
              modifiedObjects.push(jsnObj);
              if (debug) console.log('969 New object', jsnObj);
            }
          }
          if (debug) console.log('972 myGoModel', myGoModel, myMetis);
          node.updateTargetBindings();
        })
      }
      break;
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
      }
      break;
      case "ObjectSingleClicked": {
          const sel = e.subject.part;
          let data = sel.data;
          console.log('1090 selected', data, sel);
          if (data.objectview?.id) {
            const payload = data // JSON.parse(JSON.stringify(data));
            const objvIdName = { id: payload.objectview.id, name: payload.objectview.name };
            const objIdName = {id: payload.objectview.object.id, name: payload.objectview.object.name };

            if (debug) console.log('1072 SET_FOCUS_OBJECTVIEW', payload, objvIdName, objIdName)
            context.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: objvIdName });
            context.dispatch({ type: 'SET_FOCUS_OBJECT', data: objIdName });
          }
          for (let it = sel.memberParts; it?.next();) {
              let n = it.value;
              if (!(n instanceof go.Node)) continue;
              if (debug) console.log('1079 n', n.data);
          }
        }
        break;
      case "ObjectContextClicked": { // right clicked
          const sel = e.subject.part;
          const data = sel.data;
          // dispatch to focusCollection here ???
          // console.log('1086 selected', data, sel);
        }
        break;
      case "PartResized": {
        const part = e.subject.part;
        const data = e.subject.part.data;
         if (debug) console.log('1009 PartResized', part, data);
         const myNode = myGoModel.findNode(data.key);
         const myFromNodes  = [];
         const myLoc = { 
            "key":     data.key, 
            "name":    data.name,
            "loc":     data.loc,
        }
        myFromNodes.push(myLoc);
        const myToNodes  = [];
        myToNodes.push(myLoc);
        const fromloc = myLoc.loc;
        const toloc = myLoc.loc;
        if (debug) console.log('1022 data, myNode, fromNode, toNode', data, myNode, myLoc, myLoc);
         let node = uic.changeNodeSizeAndPos(data, fromloc, toloc, myGoModel, myDiagram, modifiedNodes) as gjs.goObjectNode;
         if (debug) console.log('1024 node, modifiedNodes', node, modifiedNodes);
         const objview = node.objectview;
         if (objview) {
           objview.loc = data.loc;
           objview.size = data.size;
           const jsnObjview = new jsn.jsnObjectView(objview);
           uic.addItemToList(modifiedNodes, jsnObjview);
         }
         if (debug) console.log('1032 node, objview', node, objview);
      }
      break;
      case 'ClipboardChanged': {
        const nodes = e.subject;
        if (debug) console.log('nodes', nodes);
      }
      break;
      case 'ClipboardPasted': {
        // First remember the from locs
        const myFromNodes = myMetis.currentModel.args1;
        if (debug) console.log('1306 myMetis, myGoModel, myFromNodes', myMetis, myGoModel, myFromNodes);
        // Then do the paste
        const selection = e.subject;
        context.pasted  = true;
        const pastedNodes = new Array();
        const myToNodes  = [];
        if (debug) console.log('1312 myFromNodes', myFromNodes);
        let refloc, cnt = 0; 
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
              // Now remember the to locs
              const scale = node.getMyScale(myGoModel);
              const myToNode = { 
                "key":     key, 
                "name":    data.name,
                "loc":     new String(data.loc),
                "scale":   new String(scale),
                "size":    new String(data.size),
                "template": data.template,
                "figure":  data.figure,
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
        if (debug) console.log('1363 myFromNodes, myToNodes, objviews, nodes', myFromNodes, myToNodes, objviews, nodes);
        for (let i=0; i<objviews?.length; i++) {
          const objview = objviews[i];
          const node = nodes[i];
          const myToNode = myToNodes[i];
          let fromNode;
          // Find fromNode
          for (let i=0; i<myFromNodes?.length; i++) {
            const myNode = myFromNodes[i];
            if (myNode.key.substr(0,36) === node.key.substr(0,36)) {
              fromNode = myNode;
              break;
            }
          }
          if (objview) {
            const containerType = myMetis.findObjectTypeByName(constants.types.AKM_CONTAINER);
            const hasMemberType = myMetis.findRelationshipTypeByName(constants.types.AKM_HAS_MEMBER);
            if (debug) console.log('1380 myGoModel, nodes, objview', myGoModel, nodes, objview);
            if (debug) console.log('1381 myGoModel, loc', myGoModel, objview.loc);
            const group = uic.getGroupByLocation(myGoModel, objview.loc);
            if (debug) console.log('1383 group', group)
            const gjsNode = myDiagram.findNodeForKey(node.key);
            if (group && node) {
              const groupType = myMetis.findObjectTypeByName(group.objecttype?.name);
              if (groupType?.name !== containerType?.name) {
                // Create a relationship from group to node
                const rel = new akm.cxRelationship(utils.createGuid(), hasMemberType, group.object, node.object,
                                                  hasMemberType.name, hasMemberType.description);
                const jsnRelship = new jsn.jsnRelationship(rel);
                if (debug) console.log('1392 jsnRelship, rel', jsnRelship, rel);
                modifiedRelships.push(jsnRelship);
              }
              objview.group = group.objectview?.id;
              node.group = group.key;
              myDiagram.model?.setDataProperty(gjsNode, "group", group.key);
            }
            if (debug) console.log('1399 myFromNodes, myToNodes', myFromNodes, myToNodes);
            node.loc = myToNode.loc.valueOf();
            const scale0 = fromNode ? fromNode.scale.valueOf() : 1;
            const scale1 = myToNode.scale.valueOf();
            let scaleFactor = scale1 / scale0;
            if (debug) console.log('1404 scale0, scale1, scaleFactor', scale0, scale1, scaleFactor);
            if (debug) console.log('1405 myToNode, node, refloc', myToNode, node, refloc);
            const nodeloc = uic.scaleNodeLocation2(node, refloc, myToNode.loc, scaleFactor);
            if (nodeloc) {
              const loc = nodeloc.x + " " + nodeloc.y;
              myToNode.loc = new String(loc);
            }
            node.loc = myToNode.loc.valueOf();
            objview.loc = myToNode.loc.valueOf();
            if (debug) console.log('1413 myToNode, node, refloc', myToNode, node, refloc);
            const scale = node.getMyScale(myGoModel);
            node.scale1 = scale;
            objview.scale1 = scale;
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
            if (debug) console.log('1428 node, objview', node, objview);
            const n = myDiagram.findNodeForKey(node.key);
            myDiagram.model.setDataProperty(n.data, "loc", node.loc);
            myDiagram.model.setDataProperty(n, "scale", node.scale1);
            myDiagram.model.setDataProperty(n.data, "group", node.group);
            pastedNodes.push(node);
            const objid = objview.object?.id;
            objview.object = myMetis.findObject(objid);
            const jsnObjview = new jsn.jsnObjectView(objview);
            modifiedNodes.push(jsnObjview);
            if (debug) console.log('1438 jsnObjview', jsnObjview);
            const jsnObj = new jsn.jsnObject(objview.object);
            modifiedObjects.push(jsnObj);
          }
        }
        if (debug) console.log('1443 modifiedNodes', modifiedNodes);
        
        if (debug) console.log('1445 myFromNodes, myToNodes', myFromNodes, myToNodes);
        if (debug) console.log('1446 pastedNodes', pastedNodes);
        if (debug) console.log('1447 myGoModel', context.myGoModel);
        const it1 = selection.iterator;
        // Then handle the relationships
        while (it1.next()) {
          const data = it1.value.data;
          if (data.category === constants.gojs.C_RELATIONSHIP) {
            if (debug) console.log('1453 ClipboardPasted', data);
            if (debug) console.log('1454 ClipboardPasted', data, pastedNodes);
            let relview = uic.pasteRelationship(data, pastedNodes, context);
            if (debug) console.log('1456 relview', data, relview);
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
              const link = myDiagram.findLinkForKey(data.key);
              uic.setLinkProperties(link, relview, myDiagram);
              relview.template = data.template;
              relview.arrowscale = data.arrowscale;
              relview.strokecolor = data.strokecolor;
              relview.strokewidth = data.strokewidth;
              relview.textcolor = data.textcolor;
              relview.textscale = data.textscale;
              relview.dash = data.dash;
              relview.fromArrow = data.fromArrow;
              relview.toArrow = data.toArrow;
              relview.fromArrowColor = data.fromArrowColor;
              relview.toArrowColor = data.toArrowColor;
              const jsnRelview = new jsn.jsnRelshipView(relview);
              if (debug) console.log('1483 ClipboardPasted', jsnRelview, relview);
              modifiedLinks.push(jsnRelview);
              const jsnRelship = new jsn.jsnRelationship(relview.relship);
              if (debug) console.log('1486 ClipboardPasted', jsnRelship, relview.relship);
              modifiedRelships.push(jsnRelship);
            }
          }
        }
        if (debug) console.log('1491 ClipboardPasted', modifiedLinks, modifiedRelships, myMetis);       
        myDiagram.requestUpdate();      
      }
      break;
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
            modifiedTypeLinks.push(jsnType);
            if (debug) console.log('1530 jsnType', jsnType);
            const reltypeview = reltype.typeview;
            if (reltypeview) {
              const jsnTypeView = new jsn.jsnRelshipTypeView(reltypeview);
              modifiedLinkTypeViews.push(jsnTypeView);
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
          // Handle relationships
          if (fromNode?.data?.category === constants.gojs.C_OBJECT) {
            data.category = 'Relationship';
            context.handleOpenModal = this.handleOpenModal;
            // Creation is done in a callback function (uic.createRelshipCallback)
            if (debug) console.log('1555 data, context', data, context);
            uic.createRelationship(data, context);
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
      }
      break;
      case "LinkRelinked": {
        const link = e.subject;
        const fromNode = link.fromNode?.data;
        const toNode = link.toNode?.data;
        if (debug) console.log('1574 link, fromNode, toNode', link, fromNode, toNode);
        const newLink = e.subject.data;
        newLink.category = constants.gojs.C_RELATIONSHIP;
        if (fromNode.category === constants.gojs.C_OBJECTTYPE)
          newLink.category = constants.gojs.C_RELSHIPTYPE;
        myDiagram.model.setDataProperty(newLink, "name", newLink.name);
        if (debug) console.log('1580 newLink', newLink);
        context.modifiedLinks         = modifiedLinks;
        context.modifiedRelships      = modifiedRelships;
        context.modifiedTypeLinks     = modifiedTypeLinks;
        context.modifiedLinkTypeViews = modifiedLinkTypeViews;
        uic.onLinkRelinked(newLink, fromNode, toNode, context);
        if (debug) console.log('1586 LinkRelinked', modifiedLinks);
        if (debug) console.log('1587 LinkRelinked', modifiedRelships);
        if (debug) console.log('1588 LinkRelinked', modifiedTypeLinks);
        myDiagram.requestUpdate();
      }
      break;
      case "LinkReshaped": {
        let link = e.subject; 
        link = myDiagram.findLinkForKey(link.key);
        const data = link.data;
        if (debug) console.log('1596 link, data', link, data);
        let relview = data.relshipview;
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
          modifiedLinks.push(jsnRelview);
        }
      }
      break;
      case "BackgroundSingleClicked": {
        if (debug) console.log('1615 BackgroundSingleClicked', e, e.diagram);
      }
      break;
      case "BackgroundDoubleClicked": {
         if (debug) console.log('1619 BackgroundDoubleClicked', e, e.diagram);
      }
      break;
      default:
        if (debug) console.log('1399 GoJSApp event name: ', name);
        break;
    }
    // Dispatches
    if (true) {
      if (debug) console.log('1444 modifiedNodes', modifiedNodes);
      modifiedNodes.map(mn => {
        let data = (mn) && mn
        if (mn.id) {
          data = JSON.parse(JSON.stringify(data));
          if (debug) console.log('1449 UPDATE_OBJECTVIEW_PROPERTIES', mn, data)
          context.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
        }
      })

      if (debug) console.log('1412 modifiedTypeNodes', modifiedTypeNodes);
      modifiedTypeNodes?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        if (debug) console.log('1416 UPDATE_OBJECTTYPE_PROPERTIES', data)
        context.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data })
      })

      if (debug) console.log('1420 modifiedTypeViews', modifiedTypeViews);
      modifiedTypeViews?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
        if (debug) console.log('1425 data', data);
      })

      if (debug) console.log('1428 modifiedTypeGeos', modifiedTypeGeos);
      modifiedTypeGeos?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_OBJECTTYPEGEOS_PROPERTIES', data })
      })

      if (debug) console.log('1435 modifiedLinks', modifiedLinks);
      modifiedLinks.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
      })

      if (debug) console.log('1442 modifiedTypeLinks', modifiedTypeLinks);
      modifiedTypeLinks?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        if (debug) console.log('1446 data', data);
        context.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
      })

      // if (debug) console.log('1450 modifiedLinkTypeViews', modifiedLinkTypeViews);
      modifiedLinkTypeViews?.map(mn => {
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
      let data = {metis: jsnMetis}
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
      options = this.state.selectedData.map(o => o && {'label': o, 'value': o});
      comps = null
      if (debug) console.log('1507 options', options, this.state);
      const { selectedOption } = this.state;
      if (debug) console.log('1509 selectedOption', selectedOption, this.state);

      const value = (selectedOption)  ? selectedOption.value : options[0];
      const label = (selectedOption)  ? selectedOption.label : options[0];
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
            <div className="p-2" style={{backgroundColor: "#ddd"}}>
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
    return ( (this.state) &&
      <div className="diagramwrapper">
        <DiagramWrapper
          nodeDataArray     ={this.state.nodeDataArray}
          linkDataArray     ={this.state.linkDataArray}
          modelData         ={this.state.modelData}
          modelType         ={this.state.modelType}
          skipsDiagramUpdate={this.state.skipsDiagramUpdate}
          onDiagramEvent    ={this.handleDiagramEvent}
          onModelChange     ={this.handleModelChange}
          onInputChange     ={this.handleInputChange}
          myMetis           ={this.state.myMetis}
          myGoModel         ={this.state.myGoModel}
          myGoMetamodel     ={this.state.myGoMetamodel}
          dispatch          ={this.state.dispatch}
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
