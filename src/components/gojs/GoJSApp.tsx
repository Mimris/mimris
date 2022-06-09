// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;
const linkToLink= false;

import * as go from 'gojs';
import { produce } from 'immer';
import * as React from 'react';
// import * as ReactModal from 'react-modal';
import Select, { components } from "react-select"
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { DiagramWrapper } from './components/Diagram';
import { SelectionInspector } from './components/SelectionInspector';
// import EditProperties  from '../forms/EditProperties'

// import './GoJSApp.css';
// import glb from '../../akmm/akm_globals';
// import * as utils from '../../akmm/utilities';
import * as akm from '../../akmm/metamodeller';
import * as gjs from '../../akmm/ui_gojs';
import * as jsn from '../../akmm/ui_json';
import * as uic from '../../akmm/ui_common';
import * as uid from '../../akmm/ui_diagram';
import * as uim from '../../akmm/ui_modal';
import * as uit from '../../akmm/ui_templates';

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
    if (debug) console.log('92 node', this.state.selectedData);
  } 

  public handleSelectDropdownChange = (selected: any) => {
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
    const props = this.props;
    const modalContext = this.state.modalContext;
    let typename = modalContext.selected?.value;
    if (!typename) typename = modalContext.typename;
    if (debug) console.log('113 typename: ', typename);
    const myDiagram = modalContext.context?.myDiagram;
    const data = modalContext.data;
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
     * This method should iterates over those changes and update state to keep in sync with the GoJS model.
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

  /**
   * Handle any relevant DiagramEvents, in this case just selection changes.
   * On ChangedSelection, find the corresponding data and set the selectedData state.
   * @param e a GoJS DiagramEvent
   */
  public handleDiagramEvent(e: go.DiagramEvent) {
    if (debug) console.log('124 this.state', this.state);
    this.state.selectedData = e.subject?.part?.data;
    const dispatch = this.state.dispatch;
    const name = e.name;
    const myDiagram = e.diagram;
    const myMetis = this.state.myMetis;
    if (debug) console.log('139 handleDiagramEvent', myMetis);
    const myModel = myMetis?.findModel(this.state.phFocus?.focusModel.id);
    const myModelview = myMetis?.findModelView(this.state.phFocus?.focusModelview.id);
    const myMetamodel = myModel?.getMetamodel();
    const myGoModel = this.state.myGoModel;
    const myGoMetamodel = this.state.myGoMetamodel;
    if (debug) console.log('212 handleDiagramEvent', myGoMetamodel);
    const gojsModel = {
      nodeDataArray: myGoModel?.nodes,
      linkDataArray: myGoModel?.links
    }
    if (debug) console.log('217 gojsModel', gojsModel);
    const nodes = new Array();
    const nods = myGoMetamodel?.nodes;
    for (let i=0; i<nods?.length; i++) {
      const node = nods[i];
      const objtype = node.objecttype;
      if (objtype.abstract) continue;
      if (objtype.markedAsDeleted)  continue;
      nodes.push(node);
    }
    if (nodes?.length > 0) myGoMetamodel.nodes = nodes;
    if (debug) console.log('228 gojsMetamodel', myGoMetamodel);

    const gojsMetamodel = {
      nodeDataArray: myGoMetamodel?.nodes,
      linkDataArray: myGoMetamodel?.links
    }
    if (debug) console.log('234 gojsMetamodel', gojsMetamodel);
    let modifiedNodes         = new Array();
    let modifiedLinks         = new Array();
    let modifiedTypeNodes     = new Array();
    let modifiedTypeViews     = new Array();
    let modifiedTypeGeos      = new Array();
    let modifiedTypeLinks     = new Array();
    let modifiedLinkTypeViews = new Array();
    let modifiedObjects       = new Array();
    let modifiedRelships      = new Array();
    let modifiedDatatypes     = new Array();
    let modifiedUnits         = new Array();
    let modifiedProperties    = new Array();
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
      "done":             done
    }
    if (debug) console.log('265 handleDiagramEvent - context', name, this.state, context);
    if (debug) console.log('266 handleEvent', myMetis);
    if (debug) console.log('267 this', this);
    console.log('268 event name', name);

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
              if (debug) console.log('290 myNode', myNode);
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
              if (debug) console.log('310 text, node', textvalue, myNode);
              if (myNode) {
                  myNode.name = text;
                // }
                if (debug) console.log('314 node, field, text', field, text, myNode);
                let obj = uic.updateObject(myNode, field, text, context);
                if (debug) console.log('316 node', data, myNode);
                if (!obj) 
                  obj = myNode.object;
                if (obj) {
                  obj.text = textvalue;
                  myNode.object = obj;
                  const objviews = obj.objectviews;
                  for (let i=0; i<objviews.length; i++) {
                    const objview = objviews[i];
                    objview.name = myNode.name;
                    objview.text = textvalue;
                    // objview.text = myNode.text;
                    let node = myGoModel.findNodeByViewId(objview?.id);
                    if (node) {
                      if (debug) console.log('330 node', node);
                      const n = myDiagram.findNodeForKey(node.key)
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
            let text = data.name;
            let typename = data.type;
            // Relationship type
            if (typename === 'Relationship type') {
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
                  const relviews = rel.relshipviews;
                  if (debug) console.log('394 rel, relviews', rel, relviews);
                  for (let i=0; i<relviews.length; i++) {
                    const relview = relviews[i];
                    relview.name = text;
                    rel.name = text;
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
        if (debug) console.log('421 context', context);
        let selection = e.subject;
        let selcnt = 0;
        let refloc;
        for (let it = selection.iterator; it.next();) {
          const sel = it.value;
          const data = sel.data;
          if (data.category === 'Relationship' || data.category === 'Relationship type') 
            continue;
          const typename = data.type;
          if (debug) console.log('420 typename', typename, data.objecttype);
          if (typename === "Object type") {
              const objtype = myMetis.findObjectType(data.objecttype.id);
              if (debug) console.log('423 objtype', objtype);
              if (objtype) {
                  let objtypeGeo = context.myMetamodel.findObjtypeGeoByType(objtype);
                  if (debug) console.log('426 objtypegeo', objtypeGeo);
                  if (!objtypeGeo) {
                      objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), context.myMetamodel, objtype, "", "");
                  }
                  objtypeGeo.setLoc(data.loc);
                  objtypeGeo.setSize(data.size);
                  objtypeGeo.setModified();
                  const jsnObjtypeGeo = new jsn.jsnObjectTypegeo(objtypeGeo);
                  if (debug) console.log('434 jsnObjtypeGeo', jsnObjtypeGeo);
                  modifiedTypeGeos.push(jsnObjtypeGeo);
              }
          }
          else // Object
          {
            // Object moved
            const key = data.key;
            if (debug) console.log('442 selcnt, data', selcnt, data);
            // let node = myGoModel.findNodeByViewId(data.objectview.id);
            let node = uic.changeNodeSizeAndPos(data, myGoModel, myDiagram, modifiedNodes) as gjs.goObjectNode;
            if (debug) console.log('444 data, node, modifiedNodes', data, node, modifiedNodes);

            if (node) {
              const objview = node.objectview;
              const group = uic.getGroupByLocation(myGoModel, node.loc);
              if (debug) console.log('458 selcnt, group, node', selcnt, group, node);
              if (group) {
                  const fromScale = node.scale1;
                  node.group = group.key;
                  group.memberscale = constants.params.MEMBERSCALE;
                  let scale1 = group.scale1 * group.memberscale;
                  node.scale1 = scale1;
                  const toScale = node.scale1;
                  const scaleFactor = toScale / fromScale;
                  // if (selcnt == 0) {
                  //   refloc = node.loc;
                  //   if (debug) console.log('466 node, refloc', node, refloc);
                  // }
                  // if (selcnt > 0) {
                  //   const nodeloc = uic.scaleNodeLocation2(refloc, node, scaleFactor);
                  //   const loc = nodeloc.x + " " + nodeloc.y;
                  //   objview.group = group.objectview.id;
                  //   objview.scale1 = node.scale1;
                  //   objview.loc = loc;
                  //   node.loc = objview.loc;
                  // }
                  if (node.isGroup) {
                      node.scale1 = scale1;
                      if (debug) console.log('462 group, node', group, node);
                      if (debug) console.log('485 context', context);
                      // uic.handleMembersInGroup(refloc, node, context);
                      // Handle members in group
                      const nodes = uic.getNodesInGroup(node, myGoModel, myModelview);
                      for (let i=0; i<nodes.length; i++) {
                          const n = nodes[i];
                          if (n) {
                            n.group = node.key;
                            // const fromScale = node.scale1;
                            // n.scale1 = node.scale1 * node.memberscale;
                            // const toScale = n.scale1;
                            // const scaleFactor = toScale / fromScale;
                            // const nodeloc = uic.scaleNodeLocation2(refloc, n, scaleFactor);
                            // loc = nodeloc.x + " " + nodeloc.y;
                            // n.loc = loc;
                            // const oview = n.objectview;
                            // oview.loc = loc;
                            if (debug) console.log('474 oview', oview);
                            myDiagram.model?.setDataProperty(n.data, "loc", loc);
                        }
                      }
                  
                      node.group = group.key;
                      let loc = data.loc;
                      // if (node.scale1 !== scale1) {
                          // const nodeloc = uic.scaleNodeLocation2(refloc, node, scaleFactor);
                          // loc = nodeloc.x + " " + nodeloc.y;
                          // if (debug) console.log('460 loc, group, node', loc, group, node);
                          // myDiagram.model?.setDataProperty(node.data, "loc", loc);
                      // }
                      objview.group = group.objectview.id;
                      objview.scale1 = node.scale1;
                      objview.loc = loc;
                      node.loc = objview.loc;
                    
                      // const n = myDiagram.findNodeForKey(node.key);
                      // myDiagram.model.setDataProperty(data, "group", node.group);
                      // myDiagram.model.setDataProperty(data, "loc", node.loc);
                      if (debug) console.log('463 loc, group, node, objview', loc, group, node, objview);
                  }
              } else {
                  objview.group = "";
                  node.group = "";
                  const fromScale = node.scale1;
                  node.memberscale = constants.params.MEMBERSCALE;
                  node.scale = "1";
                  node.scale1 = node.scale;
                  const toScale = node.scale1;
                  objview.scale1 = node.scale1;
                  objview.memberscale = node.memberscale;
                  myDiagram.model.setDataProperty(data, "group", node.group);
                  if (debug) console.log('524 node, objview', node, objview);

                  // if (selcnt == 0) {
                  //   refloc = node.loc;
                  //   if (debug) console.log('529 node, refloc', node, refloc);
                  // }
                  // if (selcnt > 0) {
                  //   const scaleFactor = toScale / fromScale;
                  //   const nodeloc = uic.scaleNodeLocation2(refloc, node, scaleFactor);
                  //   const loc = nodeloc.x + " " + nodeloc.y;
                  //   objview.scale1 = node.scale1;
                  //   objview.loc = loc;
                  //   node.loc = objview.loc;
                  //   if (debug) console.log('538 node, refloc', node, nodeloc);
                  // }
                  // const nodeLoc = node.loc.split(" ");
                  // let nx = parseInt(nodeLoc[0]);
                  // let ny = parseInt(nodeLoc[1]);
                  // if (debug) console.log('529 scale0, scale1, nx, ny: ', scale0, node.scale1, nx, ny);
              }
              const jsnObjview = new jsn.jsnObjectView(objview);
              modifiedNodes.push(jsnObjview);

              if (debug) console.log('534 node, group, objview', node, group, objview);
              myGoModel.addNode(node);
              const n = myDiagram.findNodeForKey(node.key);

              // Handle relviews
              if (n) {
                for (let lit = n?.findLinksConnected(); lit?.next(); ) {
                  let link = lit?.value;  
                  if (debug) console.log('447 link', link);
                  if (link) {
                    if(debug) console.log('449 link', link);
                    let relview = link.data.relshipview;
                    if (relview) {
                      // Handle relview scaling
                      const textscale = (group && group.scale1) ? group.scale1 * group.memberscale : "1";
                      relview.textscale = textscale;
                      uic.setLinkProperties(link, relview, myDiagram);
                      // Handle relview points
                      relview.points = link.points;
                      const jsnRelview = new jsn.jsnRelshipView(relview);
                      modifiedLinks.push(jsnRelview);
                    }
                  }
                }     
              }   
              if (debug) console.log('559 group, node, objview, n', group, node, objview, n);
              myDiagram.model.setDataProperty(n.data, "group", node.group);
              myDiagram.model.setDataProperty(n.data, "loc", node.loc);
              myDiagram.model.setDataProperty(n, "scale", node.scale1);
              if (debug) console.log('563 myGoModel', myGoModel);
              if (debug) console.log('564 SelectionMoved', modifiedNodes);
            }
            selcnt++;
          }
        }
        myDiagram.requestUpdate();
      }

      break;
      case "SelectionDeleting": {
        if (debug) console.log('459 myMetis', myMetis); 
        const deletedFlag = true;
        let renameTypes = false;
        const selection = e.subject;
        const data = selection.first().data;
        if (debug) console.log('464 data, selection', data, selection);
        if (data.category === constants.gojs.C_OBJECTTYPE || data.category === constants.gojs.C_RELSHIPTYPE) {
          if (confirm("If instances exists, do you want to change their types instead of deleting?")) {
            renameTypes = true;
          }
        }
        if (debug) console.log('470 selection', selection);
        // Handle relationship types
        for (let it = selection?.iterator; it.next();) {
          const sel  = it.value;
          const data = sel.data;
          if (debug) console.log('475 sel, data', sel, data);
          const key  = data.key;
          const typename = data.type;
          if (data.category === constants.gojs.C_RELSHIPTYPE) {
            const defRelType = myMetis.findRelationshipTypeByName('isRelatedTo');
            const reltype = myMetis.findRelationshipType(data.reltype?.id);
            if (debug) console.log('481 reltype', reltype);
            if (reltype) {
              // Check if reltype instances exist
              const rels = myMetis.getRelationshipsByType(reltype);
              if (debug) console.log('485 reltype, rels, myMetis', reltype, rels, myMetis);
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
                    const jsnRel = new jsn.jsnRelationship(rel);
                    modifiedRelships.push(jsnRel);
                    if (debug) console.log('501 jsnRel', jsnRel);
                  }
                }
              }
              // Check if reltype comes from or goes to a systemtype
              // If so, ask if you really wants to delete
              const fromObjtype = reltype.fromObjtype;
              const toObjtype   = reltype.toObjtype;
              if (debug) console.log('509 fromObjtype, toObjtype', fromObjtype, toObjtype);
              if (!this.isSystemType(fromObjtype)) {
                if (!this.isSystemType(toObjtype)) {
                  if (!confirm("This is a relationship type between system types. Do you really want to delete?")) {
                    continue;
                  }
                }
              }
              if (debug) console.log('514 reltype', reltype);
              reltype.markedAsDeleted = deletedFlag;
              uic.deleteRelationshipType(reltype, deletedFlag);
              const jsnReltype = new jsn.jsnRelationshipType(reltype, true);
              modifiedTypeLinks.push(jsnReltype);
              if (debug) console.log('519 modifiedTypeLinks', modifiedTypeLinks);
              let reltypeview = reltype.typeview;
              if (reltypeview) {
                  // reltypeview.markedAsDeleted = deletedFlag;
                  const jsnReltypeView = new jsn.jsnRelshipTypeView(reltypeview);
                  modifiedTypeViews.push(jsnReltypeView);
                  if (debug) console.log('444 modifiedTypeViews', modifiedTypeViews);
              }
            }
          }
        }
        // Handle objecttypes
        for (let it = selection?.iterator; it.next();) {
          const sel  = it.value;
          const data = sel.data;
          if (debug) console.log('448 sel, data', sel, data);
          const key  = data.key;
          const typename = data.type;
          if (data.category === constants.gojs.C_OBJECTTYPE) {
            const defObjType = myMetis.findObjectTypeByName('Generic');
            const objtype = myMetis.findObjectType(data.objecttype?.id);
            if (objtype) {
              // Check if objtype instances exist
              const objects = myMetis.getObjectsByType(objtype, true);
              if (debug) console.log('403 objtype, objects, myMetis', objtype, objects, myMetis);
              if (objects.length > 0) {
                if (renameTypes) {
                  for (let i=0; i<objects.length; i++) {
                    const obj = objects[i];
                    obj.type = defObjType;
                    obj.typeview = defObjType.typeview;
                    const jsnObj = new jsn.jsnObject(obj);
                    modifiedObjects.push(jsnObj);
                  }
                } else { // delete the corresponding objects
                  for (let i=0; i<objects.length; i++) {
                    const obj = objects[i];
                    obj.markedAsDeleted = deletedFlag;
                    const jsnObj = new jsn.jsnObject(obj);
                    modifiedObjects.push(jsnObj);
                  }
                }
              }
              // If systemtypes, just remove them from metamodel
              if (this.isSystemType(objtype)) {
                context.myMetamodel.removeObjectType(objtype);
                continue;
              }
              // If other types, delete them
              objtype.markedAsDeleted = deletedFlag;
              const jsnObjtype = new jsn.jsnObjectType(objtype, true);
              modifiedTypeNodes.push(jsnObjtype);
              if (debug) console.log('345 modifiedTypeNodes', modifiedTypeNodes);
              let objtypeview = objtype.typeview;
              if (objtypeview) {
                  objtypeview.markedAsDeleted = deletedFlag;
                  const jsnObjtypeView = new jsn.jsnObjectTypeView(objtypeview);
                  modifiedTypeViews.push(jsnObjtypeView);
                  if (debug) console.log('351 modifiedTypeViews', modifiedTypeViews);
              }
              const geo = context.myMetamodel.findObjtypeGeoByType(objtype);
              if (geo) {
                  geo.markedAsDeleted = deletedFlag;
                  const jsnObjtypegeo = new jsn.jsnObjectTypegeo(geo);
                  modifiedTypeGeos.push(jsnObjtypegeo);
                  if (debug) console.log('358 modifiedTypeGeos', modifiedTypeGeos);
              }  
            }          
          }
        }
        // Handle objects
        for (let it = selection?.iterator; it.next();) {
          const sel  = it.value;
          const data = sel.data;
          const key  = data.key;
          if (data.category === constants.gojs.C_OBJECT) {
            if (debug) console.log('448 sel, data', sel, data);
            const key  = data.key;
            const myNode = this.getNode(context.myGoModel, key);
            if (myNode) {
              if (debug) console.log('504 delete node', data, myNode);
              uic.deleteNode(myNode, deletedFlag, modifiedNodes, modifiedObjects, modifiedLinks, modifiedRelships, modifiedTypeViews, context);
              if (debug) console.log('506 modifiedNodes', modifiedNodes);
              if (debug) console.log('507 modifiedObjects', modifiedObjects);
              if (debug) console.log('508 modifiedTypeViews', modifiedTypeViews);
              if (debug) console.log('509 modifiedLinks', modifiedLinks);
              if (debug) console.log('510 modifiedRelships', modifiedRelships);
              if (debug) console.log('511 myGoModel', context.myGoModel);
            }
          }
        }
        // Handle relationships
        for (let it = selection?.iterator; it.next();) {
          const sel  = it.value;
          const data = sel.data;
          const key  = data.key;
          if (data.category === constants.gojs.C_RELATIONSHIP) {
            const myLink = this.getLink(context.myGoModel, key);
            if (debug) console.log('427 SelectionDeleted', myLink);
            uic.deleteLink(data, deletedFlag, modifiedLinks, modifiedRelships, modifiedLinkTypeViews, context);
            const relview = data.relshipview;
            if (relview && relview.category === constants.gojs.C_RELATIONSHIP) {
              relview.markedAsDeleted = deletedFlag;
              relview.relship = myMetis.findRelationship(relview.relship.id);
              const jsnRelview = new jsn.jsnRelshipView(relview);
              modifiedLinks.push(jsnRelview);
              if (debug) console.log('435 SelectionDeleted', modifiedLinks);
              if (!myMetis.deleteViewsOnly) {
                const relship = relview.relship;
                relship.markedAsDeleted = deletedFlag;
                const jsnRel = new jsn.jsnRelationship(relship);
                modifiedRelships.push(jsnRel);
                if (debug) console.log('440 SelectionDeleted', modifiedRelships);
              }
            }
          }
          if (debug) console.log('464 myMetis', myMetis); 
        }
      }
      break;
      case 'ExternalObjectsDropped': {
        e.subject.each(function(n) {
          const node = myDiagram.findNodeForKey(n.data.key);
          let part = node.data;
          part.scale = node.scale;
          const isLabel = (part.typename === 'Label');
          if (debug) console.log('683 found node', node);
          if (debug) console.log('684 myMetis', myMetis);
          if (debug) console.log('685 myGoModel', myGoModel, myGoMetamodel);
          if (debug) console.log('686 part, node, n', part, node, n);
          if (part.type === 'objecttype') {
            const otype = uic.createObjectType(part, context);
            if (debug) console.log('462 myMetis', myMetis);
            if (otype) {

              otype.typename = constants.types.OBJECTTYPE_NAME;
              if (debug) console.log('465 otype, part', otype, part);
              const jsnObjtype = new jsn.jsnObjectType(otype, true);
              if (debug) console.log('467 modifiedTypeNodes', jsnObjtype);
              modifiedTypeNodes.push(jsnObjtype);

              const jsnObjtypeView = new jsn.jsnObjectTypeView(otype.typeview);
              if (debug) console.log('471 modifiedTypeViews', jsnObjtypeView);
              modifiedTypeViews.push(jsnObjtypeView);

              const loc  = part.loc;
              const size = part.size;
              const objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), context.myMetamodel, otype, loc, size);
              const jsnObjtypeGeo = new jsn.jsnObjectTypegeo(objtypeGeo);
              if (debug) console.log('478 modifiedTypeGeos', jsnObjtypeGeo);
              modifiedTypeGeos.push(jsnObjtypeGeo);
            }
          } else // object
          {
            part.category = 'Object';
            if (debug) console.log('712 part', part);
            if (!part.objecttype) {
              const obj = myMetis.findObject(part.id);
            }
            if (isLabel) part.text = 'label';
            if (debug) console.log('722 part', part);
            if (!part.parentModelRef)
              myMetis.pasteViewsOnly = true;
            if (debug) console.log('725 myMetis', myMetis);
            const objview = uic.createObject(part, context);
            if (debug) console.log('727 myMetis', myMetis);
            if (debug) console.log('728 part, objview', part, objview);
            if (objview) {
              const object = objview.object;
              let otype = object.type;
              if (!otype) {
                otype = myMetis.findObjectType(objview.object.typeRef);
                object.type = otype;
              }
              objview.viewkind = part.viewkind;
              const jsnObjview = new jsn.jsnObjectView(objview);
              modifiedNodes.push(jsnObjview);
              if (debug) console.log('739 New object', jsnObjview, modifiedNodes);
              const jsnObj = new jsn.jsnObject(objview.object);
              modifiedObjects.push(jsnObj);
              if (debug) console.log('742 New object', jsnObj);
            }
          }
          if (debug) console.log('745 myGoModel', myGoModel, myMetis);
          node.updateTargetBindings();
        })
      }
      break;
      case "ObjectDoubleClicked": {
        let sel = e.subject.part;
        this.state.selectedData = sel.data;
        const node = sel.data;
        if (debug) console.log('566 node', node);
        const category = node.category;
        switch (category) {
          case constants.gojs.C_OBJECTTYPE:
            uid.editObjectType(node, myMetis, myDiagram); 
            break;
          case constants.gojs.C_OBJECT:
            if (debug) console.log('749 myMetis', myMetis);
            uid.editObject(node, myMetis, myDiagram); 
            if (debug) console.log('751 myMetis', myMetis);
            break;
          }
      }
      break;
      case "ObjectSingleClicked": {
        const sel = e.subject.part;
        const data = sel.data;
        console.log('644 selected', data);
        this.state.selectedData = data;
        if (debug) console.log('646 GoJSApp :', data, data.name, data.object);
        if (sel) {
          if (sel instanceof go.Node) {
            const key = data.key;
            const text = data.name;
            const typename = data.type;
            if (debug) console.log('652 typename, text', typename, text);
            if (typename === 'Object type') {
              const myNode = this.getNode(context.myGoMetamodel, key);
              if (debug) console.log('655 GoJSApp', myNode.objtype);  
              if (myNode && myNode.objtype) {
                const jsnNode = new jsn.jsnObjectType(myNode.objtype, true);
                selectedObjectTypes.push(jsnNode);
                if (debug) console.log('659 GoJSApp', selectedObjectTypes);
                } 
            } else { // object
              myDiagram.clearHighlighteds();
              const object = data.object;
              if (debug) console.log('741 object', object);
              const oviews = object?.objectviews;
              if (oviews) {
                for (let j=0; j<oviews.length; j++) {
                  const ov = oviews[j];
                  if (ov) {
                    const node = myGoModel.findNodeByViewId(ov?.id);
                    const gjsNode = myDiagram.findNodeForKey(node?.key);
                    if (gjsNode) {
                      myDiagram.startTransaction("highlight");
                      gjsNode.isHighlighted = true;
                      myDiagram.commitTransaction("highlight");
                    }
                  }
                }
              }
              let objview = data.objectview;
              objview = myMetis.findObjectView(objview?.id);
              // Do whatever you like
              // ..
              if (data.isCollapsed)
                objview.isCollapsed = true;
              else
                objview.isCollapsed = false;
              // objview.isCollapsed = data.isCollapsed;
              if (debug) console.log('800 data, objview :', data, objview);
              const jsnObjView = new jsn.jsnObjectView(objview);
              selectedObjectViews.push(jsnObjView);
              if (debug) console.log('803 GoJSApp :', context.myGoModel);                
            }
          } else if (sel instanceof go.Link) {
            const key = data.key;
            let text = data.name;
            const typename = data.type;

            if (typename === 'Relationship type') {
              const myLink = this.getLink(context.myGoMetamodel, key);
              // if (debug) console.log('514 GoJSApp', myLink.reltype);
              if (myLink.reltype) {
                const jsnLink= new jsn.jsnRelationshipType(myLink.reltype, true);
                selectedRelationshipTypes.push(jsnLink);
                // if (debug) console.log('518 GoJSApp', selectedRelationshipTypes);
              }
            } else // relation
            {
              let relshipview = sel.data.relshipview;
              relshipview = myMetis.findRelationshipView(relshipview?.id);
              if (relshipview) {
                // Do whatever you like
                // ..
                const jsnRelshipView = new jsn.jsnRelshipView(relshipview);
                selectedRelshipViews.push(jsnRelshipView);
                if (debug) console.log('709 GoJSApp :', jsnRelshipView); 
              }               
            }
          }
        }
      }
      break;
      case "PartResized": {
        const part = e.subject.part;
        const data = e.subject.part.data;
         if (debug) console.log('579 PartResized', part, data);
        uic.changeNodeSizeAndPos(data, myGoModel, myDiagram, modifiedNodes);
         if (debug) console.log('581 modifiedNodes', myGoModel, modifiedNodes);
        const nodes = this.state.nodeDataArray;
        for (let i=0; i<nodes?.length; i++) {
            const node = nodes[i];
            if (node.key === data.key) {
                node.loc = data.loc;
                node.size = data.size;
                break;
            }
        }
      }
      break;
      case 'ClipboardChanged': {
        const nodes = e.subject;
        if (debug) console.log('nodes', nodes);
      }
        break;
      case 'ClipboardPasted': {
        const selection = e.subject;
        const fromSelection = myMetis.currentSelection;
        context.pasted  = true;
        const it = selection.iterator;
        const pastedNodes = new Array();
        if (debug) console.log('974 fromSelection: ', fromSelection);
        // First handle the objects
        let selcnt = 0;    // Count the number of selected objects
        let refloc = null; // The location of the first selected object 
        let indx = 0;
        while (it.next()) {
          const data = it.value.data;
          if (debug) console.log('980 it.value.data', it.value.data);
          if (data.category === constants.gojs.C_OBJECT) {
              const fromData  = fromSelection[indx];
              const fromScale = fromData?.scale1 ? fromData.scale1 : 1;
              let toScale   = data.scale1 ? data.scale1 : 1;
              if (debug) console.log('987 indx, data, fromData, fromScale, toScale', indx, data, fromData, fromScale, toScale);
              context.pasted = true;
              if (debug) console.log('989 ClipboardPasted', data, myGoModel);
              const objview = uic.createObject(data, context);
              if (debug) console.log('991 ClipboardPasted', data, objview);
              if (objview) {
                const node = new gjs.goObjectNode(data.key, objview);
                node.loc = data.loc;
                if (debug) console.log('995 node', node);
                const group = uic.getGroupByLocation(myGoModel, objview.loc);
                if (debug) console.log('997 group, node', group, node)
                if (group && node) {
                  node.group = group.key;
                  group.memberscale = constants.params.MEMBERSCALE;
                  let scale1 = fromScale * group.memberscale;
                  let loc = node.loc;
                  node.scale1 = scale1;
                  toScale = scale1;
                  const scaleFactor = toScale / fromScale;
                  if (debug) console.log('1002 selcnt', selcnt);
                  if (selcnt == 0) {
                    refloc = group.loc;
                    if (debug) console.log('1004 fromData, node, scaleFactor', fromData, node, scaleFactor);
                  }
                  if (selcnt > 0) {
                    if (debug) console.log('1007 refloc, scaleFactor, fromData, node', refloc, scaleFactor, fromData, node);
                    const nodeloc = uic.scaleNodeLocation2(refloc, node, scaleFactor);
                    if (debug) console.log('1009 nodeloc', nodeloc);
                    if (nodeloc) loc = nodeloc.x + " " + nodeloc.y;
                    objview.group = group.objectview.id;
                    objview.scale1 = node.scale1;
                    objview.loc = loc;
                    node.loc = objview.loc;
                  }
                  objview.group = group.objectview?.id;
                  node.group = group.key;
                  const n = myDiagram.findNodeForKey(node.key);
                  myDiagram.model?.setDataProperty(n.data, "group", group.key);
                  myDiagram.model?.setDataProperty(n.data, "loc", loc);
                  myDiagram.model?.setDataProperty(n, "scale", data.scale1);
                }
                if (debug) console.log('792 node', node);
                pastedNodes.push(node);
                const objid = objview.object?.id;
                objview.object = myMetis.findObject(objid);
                const jsnObjview = new jsn.jsnObjectView(objview);
                modifiedNodes.push(jsnObjview);
                if (debug) console.log('798 ClipboardPasted', modifiedNodes);
                const jsnObj = new jsn.jsnObject(objview.object);
                modifiedObjects.push(jsnObj);
                if (debug) console.log('801 ClipboardPasted', modifiedObjects);
              }
              selcnt++;
            }
          indx++;
        }
        if (debug) console.log('805 pastedNodes', pastedNodes);
        if (debug) console.log('806 ClipboardPasted', context.myGoModel);
        const it1 = selection.iterator;
        // Then handle the relationships
        while (it1.next()) {
          const data = it1.value.data;
          if (data.category === constants.gojs.C_RELATIONSHIP) {
            if (debug) console.log('812 ClipboardPasted', data);
            if (debug) console.log('813 ClipboardPasted', data, pastedNodes);
            let relview = uic.pasteRelationship(data, pastedNodes, context);
            if (debug) console.log('815 relview', data, relview);
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
              const jsnRelview = new jsn.jsnRelshipView(relview);
              if (debug) console.log('820 ClipboardPasted', jsnRelview, relview);
              modifiedLinks.push(jsnRelview);
              const jsnRelship = new jsn.jsnRelationship(relview.relship);
              if (debug) console.log('823 ClipboardPasted', jsnRelship, relview.relship);
              modifiedRelships.push(jsnRelship);
            }
          }
        }
        if (debug) console.log('828 ClipboardPasted', modifiedLinks, modifiedRelships, myMetis);       
        myDiagram.requestUpdate();
      }
      break;
      case 'LinkDrawn': {
        const link = e.subject;
        const data = link.data;
        if (debug) console.log('883 link', link, link.fromNode, link.toNode);

        // Prepare for linkToLink
        if (linkToLink) {
          let labels = link.labelNodes;
          for (let it = labels.iterator; it.next();) {     
            if (debug) console.log('889 it.value', it.value);
            const linkLabel = it.value;
            // Connect linkLabel to relview
          }
          if (data.category === 'linkToLink') {
            // This is a link from a relationship between fromNode and toNode to an object
            // The link from rel to object is link.data
            // Todo: Handle this situation
          }
        }

        if (debug) console.log('900 data', data);
        const fromNode = myDiagram.findNodeForKey(data.from);
        const toNode = myDiagram.findNodeForKey(data.to);

        if (debug) console.log('904 LinkDrawn', fromNode, toNode, data);
        // Handle relationship types
        if (fromNode?.data?.category === constants.gojs.C_OBJECTTYPE) {
          data.category = constants.gojs.C_RELSHIPTYPE;
          if (debug) console.log('908 link', fromNode, toNode);
          link.category = constants.gojs.C_RELSHIPTYPE;
          const reltype = uic.createRelationshipType(fromNode.data, toNode.data, data, context);
          if (reltype) {
            if (debug) console.log('912 reltype', reltype);
            const jsnType = new jsn.jsnRelationshipType(reltype, true);
            modifiedTypeLinks.push(jsnType);
            if (debug) console.log('915 jsnType', jsnType);
            const reltypeview = reltype.typeview;
            if (reltypeview) {
              const jsnTypeView = new jsn.jsnRelshipTypeView(reltypeview);
              modifiedLinkTypeViews.push(jsnTypeView);
              if (debug) console.log('920 jsnTypeView', jsnTypeView);
            }
          }
        }
        // Handle relationships
        if (fromNode?.data?.category === constants.gojs.C_OBJECT) {
          data.category = 'Relationship';
          context.handleOpenModal = this.handleOpenModal;
          // Creation is done in a callback function (uic.createRelshipCallback)
          uic.createRelationship(data, context);
       }
       myDiagram.requestUpdate();
      }
      break;
      case "LinkRelinked": {
        const link = e.subject;
        const fromNode = link.fromNode?.data;
        const toNode = link.toNode?.data;
        if (debug) console.log('727 link, fromNode, toNode', link, fromNode, toNode);
        const newLink = e.subject.data;
        newLink.category = 'Relationship';
        if (fromNode.category === 'Object type')
          newLink.category = 'Relationship type';
        if (debug) console.log('729 newLink', newLink);
        context.modifiedLinks         = modifiedLinks;
        context.modifiedRelships      = modifiedRelships;
        context.modifiedTypeLinks     = modifiedTypeLinks;
        context.modifiedLinkTypeViews = modifiedLinkTypeViews;
        uic.onLinkRelinked(newLink, fromNode, toNode, context);
        if (debug) console.log('722 LinkRelinked', modifiedLinks);
        if (debug) console.log('723 LinkRelinked', modifiedRelships);
        if (debug) console.log('724 LinkRelinked', modifiedTypeLinks);
        myDiagram.requestUpdate();
      }
      break;
      case "LinkReshaped": {
        const link = e.subject; 
        const data = myDiagram.model?.findLinkDataForKey(link.key);
        if (debug) console.log('996 data', data);
        let relview = data.relshipview;
        relview = myModelview.findRelationshipView(relview?.id);
        if (relview) {
          if (link.data.points?.j) {
            const points = [];
            const array = link.points.j;
            for (let i=0; i<array.length; i++) {
              points.push(array[i].x)
              points.push(array[i].y)
            }
            link.data.points = points;
          }
          relview.points = link.data.points;;
          const jsnRelview = new jsn.jsnRelshipView(relview);
          if (debug) console.log('1011 relview, jsnRelview', relview, jsnRelview);
          modifiedLinks.push(jsnRelview);
        }
      }
      break;
      case "BackgroundSingleClicked": {
        if (debug) console.log('1178 BackgroundSingleClicked', e, e.diagram);
      }
      break;
      case "BackgroundDoubleClicked": {
         if (debug) console.log('728 BackgroundDoubleClicked', e, e.diagram);
      }
      break;
      default:
        if (debug) console.log('802 GoJSApp event name: ', name);
        break;
    }
    // Dispatches
    if (true) {
      if (debug) console.log('923 modifiedNodes', modifiedNodes);
      modifiedNodes.map(mn => {
        let data = mn
        data = JSON.parse(JSON.stringify(data));
        if (debug) console.log('877 UPDATE_OBJECTVIEW_PROPERTIES', data)
        this.props?.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
      })

      if (debug) console.log('930 modifiedTypeNodes', modifiedTypeNodes);
      modifiedTypeNodes?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        if (debug) console.log('900 UPDATE_OBJECTTYPE_PROPERTIES', data)
        this.props?.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data })
      })

      if (debug) console.log('937 modifiedTypeViews', modifiedTypeViews);
      modifiedTypeViews?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        this.props?.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
        if (debug) console.log('892 data', data);
      })

      if (debug) console.log('944 modifiedTypeGeos', modifiedTypeGeos);
      modifiedTypeGeos?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        this.props?.dispatch({ type: 'UPDATE_OBJECTTYPEGEOS_PROPERTIES', data })
      })

      if (debug) console.log('950 modifiedLinks', modifiedLinks);
      modifiedLinks.map(mn => {
        let data = mn
        data = JSON.parse(JSON.stringify(data));
        this.props?.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
      })

      if (debug) console.log('956 modifiedLinkTypes', modifiedLinkTypes);
      modifiedTypeLinks?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        this.props?.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
      })

      // if (debug) console.log('929 modifiedLinkTypeViews', modifiedLinkTypeViews);
      modifiedLinkTypeViews?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        this.props?.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
      })

      if (debug) console.log('968 modifiedObjects', modifiedObjects);
      modifiedObjects?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        if (debug) console.log('938 UPDATE_OBJECT_PROPERTIES', data)
        this.props?.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
      })

      if (debug) console.log('975 modifiedRelships', modifiedRelships);
      modifiedRelships?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        if (debug) console.log('945 data', data);
        this.props?.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
      })
      // This should be used to set several views  in focus
      // if (debug) console.log('982 selectedObjectViews', selectedObjectViews);
      // selectedObjectViews?.map(mn => {
      //   let data = (mn) && { id: mn.id, name: mn.name }
      //   data = JSON.parse(JSON.stringify(data));
      //   this.props?.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data })
      // })

      // if (debug) console.log('988 selectedRelshipViews', selectedRelshipViews);
      // selectedRelshipViews?.map(mn => {
      //   let data = (mn) && { id: mn.id, name: mn.name }
      //   data = JSON.parse(JSON.stringify(data));
      //   this.props?.dispatch({ type: 'SET_FOCUS_RELSHIPVIEW', data })
      // })

      // if (debug) console.log('994 selectedObjectTypes', selectedObjectTypes);
      // selectedObjectTypes?.map(mn => {
      //   let data = (mn) && { id: mn.id, name: mn.name }
      //   data = JSON.parse(JSON.stringify(data));
      //   this.props?.dispatch({ type: 'SET_FOCUS_OBJECTTYPE', data })
      // })
      // if (debug) console.log('999 selectedRelationshipTypes', selectedRelationshipTypes);
      // selectedRelationshipTypes?.map(mn => {
      //   let data = (mn) && { id: mn.id, name: mn.name }
      //   data = JSON.parse(JSON.stringify(data));
      //   this.props?.dispatch({ type: 'SET_FOCUS_RELSHIPTYPE', data })
      // })
    }
    if (debug) console.log('1126 myMetis', myMetis);
  }

  public render() {   
    const selectedData = this.state.selectedData;
    if (debug) console.log('1111 selectedData', selectedData, this.props);
    let modalContent, inspector, selector, header, category, typename;
    const modalContext = this.state.modalContext;
    if (debug) console.log('1115 modalContext ', modalContext);
    const context = modalContext?.context;
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
      if (debug) console.log('1138 options', options, this.state);
      const { selectedOption } = this.state;
      if (debug) console.log('1139 selectedOption', selectedOption, this.state);

      const value = (selectedOption)  ? selectedOption.value : options[0];
      const label = (selectedOption)  ? selectedOption.label : options[0];
      if (debug) console.log('1142 context', context);
      if (debug) console.log('1143 selectedOption, value ', selectedOption, value);
      header = modalContext.title;
      modalContent = 
        <div className="modal-selection d-flex justify-content-center">
          <Select className="modal-select"              
            options={options}
            components={comps}
            onChange={value => this.handleSelectDropdownChange(value, context)}
          /> 
        </div>
        {/* <option value={option.value}>{label: option.label, option.value}</option>
        */}            
    } else {
        if (selectedData !== null) {
          if (debug) console.log('1151 selectedData', selectedData);
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
    if (debug) console.log('1089 dispatch', this.state.myMetis.dispatch);
    if (debug) console.log('1090 linkdataarray:', this.state.linkDataArray);
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
