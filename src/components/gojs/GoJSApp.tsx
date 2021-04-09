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
// import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { DiagramWrapper } from './components/Diagram';
import { SelectionInspector } from './components/SelectionInspector';
// import EditProperties  from '../forms/EditProperties'

// import './GoJSApp.css';
// import glb from '../../akmm/akm_globals';
// import * as utils from '../../akmm/utilities';
import * as akm from '../../akmm/metamodeller';
import * as gjs from '../../akmm/ui_gojs';
import * as gql from '../../akmm/ui_graphql';
import * as uic from '../../akmm/ui_common';

const constants = require('../../akmm/constants');
const utils     = require('../../akmm/utilities');

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
  // showModal: boolean;
}

class GoJSApp extends React.Component<{}, AppState> {
  constructor(props: object) {
    super(props);
    if (debug) console.log('48 GoJSApp',props.nodeDataArray);
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
    if (debug) console.log('69 modelType',this.state.modelType, this.props);
    this.state.myMetis.modelType = this.state.modelType;
    this.handleDiagramEvent = this.handleDiagramEvent.bind(this);
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
    // myMetis.modelType = this.state.modelType;
    if (debug) console.log('139 handleDiagramEvent', myMetis);
    const myModel = myMetis?.findModel(this.state.phFocus?.focusModel.id);
    const myModelview = myMetis?.findModelView(this.state.phFocus?.focusModelview.id);
    const myMetamodel = myModel?.getMetamodel();
    const myGoModel = this.state.myGoModel;
    const myGoMetamodel = this.state.myGoMetamodel;
    if (debug) console.log('145 handleDiagramEvent', myGoMetamodel);
    const gojsModel = {
      nodeDataArray: myGoModel?.nodes,
      linkDataArray: myGoModel?.links
    }
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
    if (debug) console.log('159 gojsMetamodel', myGoMetamodel);

    const gojsMetamodel = {
      nodeDataArray: myGoMetamodel?.nodes,
      linkDataArray: myGoMetamodel?.links
    }
    if (debug) console.log('165 gojsMetamodel', gojsMetamodel);
    const modifiedNodes         = new Array();
    const modifiedLinks         = new Array();
    const modifiedTypeNodes     = new Array();
    const modifiedTypeViews     = new Array();
    const modifiedTypeGeos      = new Array();
    const modifiedTypeLinks     = new Array();
    const modifiedLinkTypeViews = new Array();
    const modifiedObjects       = new Array();
    const modifiedRelships      = new Array();
    const modifiedDatatypes     = new Array();
    const modifiedUnits         = new Array();
    const modifiedProperties    = new Array();
    const selectedObjectViews   = new Array();
    const selectedRelshipViews  = new Array();
    const selectedObjectTypes   = new Array();
    const selectedRelationshipTypes   = new Array();
    let done = false;
    const context = {
      "myMetis":          myMetis,
      "myMetamodel":      myMetamodel,
      "myModel":          myModel,
      "myModelview":      myModelview,
      "myGoModel":        myGoModel,
      "myGoMetamodel":    myGoMetamodel,
      "myDiagram":        myDiagram,
      "dispatch":         dispatch,
      "done":             done
    }
    if (debug) console.log('156 handleDiagramEvent - context', name, this.state, context);
    if (debug) console.log('157 handleEvent', myMetis);
    if (debug) console.log('158 this', this);
    if (debug) console.log('189 event name', name);

    switch (name) {
      case 'TextEdited': {
        const sel = e.subject.part;
        const data = sel.data;
        let field = e.subject.name;
        if (debug) console.log('200 data', data, field, sel);
        // Object type or Object
          if (sel instanceof go.Node) {
            const key = data.key;
            let text  = data.name;
            const category = data.category;
            if (debug) console.log('206 data', data);
            // Object type
            if (category === 'Object type') {
              if (text === 'Edit name') {
                text = prompt('Enter name');
              }
              const myNode = sel;
              if (debug) console.log('207 myNode', myNode);
              if (myNode) {
                data.name = text;
                uic.updateObjectType(data, field, text, context);
                if (debug) console.log('213 TextEdited', data);
                const objtype = myMetis.findObjectType(data.objecttype?.id);
                if (objtype) {
                  const gqlObjType = new gql.gqlObjectType(objtype, true);
                  modifiedTypeNodes.push(gqlObjType);
                  if (debug) console.log('218 TextEdited', gqlObjType);
                }
              }
            } else { // Object           
              if (text === 'Edit name') {
                text = prompt('Enter name');
                data.name = text;
              }
              const myNode = this.getNode(context.myGoModel, key);
              if (debug) console.log('232 node', myNode);
              if (myNode) {
                myNode.name = text;
                const obj = uic.updateObject(myNode, field, text, context);
                if (obj) {
                  const objviews = obj.objectviews;
                  for (let i=0; i<objviews.length; i++) {
                    const objview = objviews[i];
                    objview.name = myNode.name;
                    let node = myGoModel.findNodeByViewId(objview?.id);
                    if (node) {
                      if (debug) console.log('243 node', node);
                      node = myDiagram.findNodeForKey(node.key)
                      myDiagram.model.setDataProperty(node.data, "name", myNode.name);
                      const gqlObjview = new gql.gqlObjectView(objview);
                      modifiedNodes.push(gqlObjview);
                    } 
                  }
                }
                data.name = myNode.name;
                const gqlObj = new gql.gqlObject(myNode.objectview.object);
                modifiedObjects.push(gqlObj);
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
          // Relationship or Relationship tpe
          if (sel instanceof go.Link) {
            const key = data.key;
            let text = data.name;
            let typename = data.type;
            // Relationship type
            if (typename === 'Relationship type') {
              const myLink = this.getLink(context.myGoMetamodel, key);
              // if (debug) console.log('232 TextEdited', myLink);
              if (myLink) {
                if (text === 'Edit name') {
                  text = prompt('Enter name');
                  typename = text;
                  data.name = text;
                }
                uic.updateRelationshipType(myLink, "name", text, context);
                data.name = myLink.name;
                if (myLink.reltype) {
                  const gqlReltype = new gql.gqlRelationshipType(myLink.reltype, true);
                  modifiedTypeLinks.push(gqlReltype);
                  if (debug) console.log('242 TextEdited', modifiedTypeLinks);
                }
              }
              context.myDiagram.model.setDataProperty(myLink.data, "name", myLink.name);
            }             
            else { // Relationship
              if (debug) console.log('290 data', data);
              field = 'name';
              const myLink = this.getLink(context.myGoModel, key);
              if (myLink) {
                if (text === 'Edit name') {
                  text = prompt('Enter name');
                  data.name = text;
                }
                myLink.name = text;
                if (debug) console.log('299 myLink', myLink);
                const rel = uic.updateRelationship(myLink, field, text, context);
                if (rel) {
                  const relviews = rel.relshipviews;
                  if (debug) console.log('303 relviews', relviews);
                  for (let i=0; i<relviews.length; i++) {
                    const relview = relviews[i];
                    relview.name = myLink.name;
                    let link = myGoModel.findLinkByViewId(relview?.id);
                    if (!link) link = myLink;
                    if (link) {
                      link = myDiagram.findLinkForKey(link.key)
                      if (debug) console.log('311 link', link, relview);
                      myDiagram.model.setDataProperty(link.data, "name", myLink.name);
                      const gqlRelview = new gql.gqlRelshipView(relview);
                      modifiedLinks.push(gqlRelview);
                    } 
                  }
                  if (debug) console.log('317 rel', rel);
                  if (myLink.relshipview) {
                    const gqlRel = new gql.gqlRelationship(rel);
                    modifiedRelships.push(gqlRel);
                  }
                  context.myDiagram.model.setDataProperty(myLink.data, "name", myLink.name);
                }
              }
              const links = myGoModel.links;
              for (let i=0; i<links.length; i++) {
                const link = links[i];
                if (link.key === key) {
                    link.name = data.name;
                    break;
                }
              }
            }
          }
      }
      break;
      case "SelectionMoved": {
        let selection = e.subject;
        for (let it = selection.iterator; it.next();) {
          const sel = it.value;
          const data = sel.data;
          const typename = data.type;
          if (debug) console.log('333 typename', typename, data.objecttype);
          if (typename === "Object type") {
              const objtype = myMetis.findObjectType(data.objecttype.id);
              if (debug) console.log('321 objtype', objtype);
              if (objtype) {
                  let objtypeGeo = context.myMetamodel.findObjtypeGeoByType(objtype);
                  if (debug) console.log('324 objtypegeo', objtypeGeo);
                  if (!objtypeGeo) {
                      objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), context.myMetamodel, objtype, "", "");
                  }
                  objtypeGeo.setLoc(data.loc);
                  objtypeGeo.setSize(data.size);
                  objtypeGeo.setModified();
                  const gqlObjtypeGeo = new gql.gqlObjectTypegeo(objtypeGeo);
                  if (debug) console.log('332 gqlObjtypeGeo', gqlObjtypeGeo);
                  modifiedTypeGeos.push(gqlObjtypeGeo);
              }
          }
          else // Object
          {
            // Object moved
            const key = data.key;
            if (debug) console.log('355 data', data);
            const node = uic.changeNodeSizeAndPos(data, myGoModel, myDiagram, modifiedNodes);
            if (debug) console.log('361 node, modifiedNodes: ', node, modifiedNodes);
            if (node) e.diagram.model.setDataProperty(data, "group", node.group);
            //const myNode = this.getNode(myGoModel, key);
            if (debug) console.log('364 myGoModel', myGoModel);
            if (debug) console.log('301 SelectionMoved', modifiedNodes);
          }
          const nodes = myGoModel?.nodes;
          for (let i=0; i<nodes?.length; i++) {
              const node = nodes[i];
              if (node.key === data.key) {
                  node.loc = data.loc;
                  node.size = data.size;
                  break;
              }
          }
        }
      }
      break;
      case "SelectionDeleting": {
        if (debug) console.log('370 myMetis', myMetis); 
        const deletedFlag = true;
        const selection = e.subject;
         if (debug) console.log('373 selection', selection);
        for (let it = selection.iterator; it.next();) {
          const sel  = it.value;
          const data = sel.data;
          if (debug) console.log('377 sel, data', sel, data);
          const key  = data.key;
          const typename = data.type;
          if (data.category === 'Object type') {
            const defObjType = myMetis.findObjectTypeByName('Generic');
            const objtype = myMetis.findObjectType(data.objecttype?.id);
            if (objtype) {
              // Check if objtype instances exist
              const objects = myMetis.getObjectsByType(objtype, true);
              if (debug) console.log('403 objtype, objects, myMetis', objtype, objects, myMetis);
              if (objects.length > 0) {
                if (confirm("Objects of type '" + objtype.name + "' exist! Do you still want to delete?")) {
                  if (confirm("Do you want to change the type of those objects to '" + defObjType.name + "'?")) {
                    for (let i=0; i<objects.length; i++) {
                      const obj = objects[i];
                      obj.type = defObjType;
                      obj.name = defObjType.name;
                      const gqlObj = new gql.gqlObject(obj);
                      modifiedObjects.push(gqlObj);
                    }
                  } else { // delete the corresponding objects
                    for (let i=0; i<objects.length; i++) {
                      const obj = objects[i];
                      obj.markedAsDeleted = deletedFlag;
                      const gqlObj = new gql.gqlRelationship(obj);
                      modifiedObjects.push(gqlObj);
                    }
                  }
                } else { // Do not delete
                  myDiagram.model.addNodeData(data);
                  myDiagram.requestUpdate();
                  break;
                }
              } 
              objtype.markedAsDeleted = deletedFlag;
              const gqlObjtype = new gql.gqlObjectType(objtype, true);
              modifiedTypeNodes.push(gqlObjtype);
              if (debug) console.log('345 modifiedTypeNodes', modifiedTypeNodes);
              let objtypeview = objtype.typeview;
              if (objtypeview) {
                  objtypeview.markedAsDeleted = deletedFlag;
                  const gqlObjtypeView = new gql.gqlObjectTypeView(objtypeview);
                  modifiedTypeViews.push(gqlObjtypeView);
                  if (debug) console.log('351 modifiedTypeViews', modifiedTypeViews);
              }
              const geo = context.myMetamodel.findObjtypeGeoByType(objtype);
              if (geo) {
                  geo.markedAsDeleted = deletedFlag;
                  const gqlObjtypegeo = new gql.gqlObjectTypegeo(geo);
                  modifiedTypeGeos.push(gqlObjtypegeo);
                  if (debug) console.log('358 modifiedTypeGeos', modifiedTypeGeos);
              }
            }
          }
          if (data.category === 'Relationship type') {
            // if (debug) console.log('350 myMetamodel', context.myMetamodel);  
            const defRelType = myMetis.findRelationshipTypeByName('isRelatedTo');
            const reltype = myMetis.findRelationshipType(data.reltype?.id);
            if (reltype) {
              // Check if reltype instances exist
              const rels = myMetis.getRelationshipsByType(reltype);
              if (debug) console.log('430 reltype, rels, myMetis', reltype, rels, myMetis);
              if (rels.length > 0) {
                if (confirm("Relationships of type '" + reltype.name + "' exist! Do you still want to delete?")) {
                  if (confirm("Do you want to change the type of those relationships to '" + defRelType.name + "'?")) {
                    for (let i=0; i<rels.length; i++) {
                      const rel = rels[i];
                      rel.type = defRelType;
                      rel.name = defRelType.name;
                      const gqlRel = new gql.gqlRelationship(rel);
                      modifiedRelships.push(gqlRel);
                    }
                  } else { // delete the corresponding relationships
                    for (let i=0; i<rels.length; i++) {
                      const rel = rels[i];
                      rel.markedAsDeleted = deletedFlag;
                      const gqlRel = new gql.gqlRelationship(rel);
                      modifiedRelships.push(gqlRel);
                    }
                  }
                } else { // Do not delete
                  myDiagram.model.addLinkData(data);
                  myDiagram.requestUpdate();
                  break;
                }
              }
              reltype.markedAsDeleted = deletedFlag;
              //uic.deleteRelationshipType(reltype, deletedFlag);
              const gqlReltype = new gql.gqlRelationshipType(reltype, true);
              modifiedTypeLinks.push(gqlReltype);
              if (debug) console.log('375 modifiedTypeLinks', modifiedTypeLinks);
              let reltypeview = reltype.typeview;
              if (reltypeview) {
                  reltypeview.markedAsDeleted = deletedFlag;
                  const gqlReltypeView = new gql.gqlRelshipTypeView(reltypeview);
                  modifiedTypeViews.push(gqlReltypeView);
                  if (debug) console.log('381 modifiedTypeViews', modifiedTypeViews);
              }
            }
          }
          if (data.category === 'Object') {
            const myNode = this.getNode(context.myGoModel, key);
            if (myNode) {
               if (debug) console.log('434 delete node', data, myNode);
              uic.deleteNode(myNode, deletedFlag, modifiedNodes, modifiedObjects, modifiedLinks, modifiedRelships, modifiedTypeViews, context);
              if (debug) console.log('436 modifiedNodes', modifiedNodes);
              if (debug) console.log('437 modifiedObjects', modifiedObjects);
              if (debug) console.log('438 modifiedTypeViews', modifiedTypeViews);
              if (debug) console.log('439 modifiedLinks', modifiedLinks);
              if (debug) console.log('440 modifiedRelships', modifiedRelships);
              if (debug) console.log('441 myGoModel', context.myGoModel);
            }
          }
          if (data.category === 'Relationship') {
            const myLink = this.getLink(context.myGoModel, key);
            if (debug) console.log('427 SelectionDeleted', myLink);
            uic.deleteLink(data, deletedFlag, modifiedLinks, modifiedLinkTypeViews, context);
            const relview = data.relshipview;
            if (relview) {
              relview.markedAsDeleted = deletedFlag;
              relview.relship = myMetis.findRelationship(relview.relship.id);
              const gqlRelview = new gql.gqlRelshipView(relview);
              modifiedLinks.push(gqlRelview);
              if (debug) console.log('435 SelectionDeleted', modifiedLinks);
              if (!myMetis.deleteViewsOnly) {
                const relship = relview.relship;
                relship.markedAsDeleted = deletedFlag;
                const gqlRel = new gql.gqlRelationship(relship);
                modifiedRelships.push(gqlRel);
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
          if (debug) console.log('455 found node', node);
          if (debug) console.log('456 myMetis', myMetis);
          if (debug) console.log('457 myGoModel', myGoModel, myGoMetamodel);

          if (debug) console.log('459 part', part, node, n);
          if (part.type === 'objecttype') {
            const otype = uic.createObjectType(part, context);
            if (debug) console.log('462 myMetis', myMetis);
            if (otype) {

              otype.typename = constants.types.OBJECTTYPE_NAME;
              if (debug) console.log('465 otype, part', otype, part);
              const gqlObjtype = new gql.gqlObjectType(otype, true);
              if (debug) console.log('467 modifiedTypeNodes', gqlObjtype);
              modifiedTypeNodes.push(gqlObjtype);

              const gqlObjtypeView = new gql.gqlObjectTypeView(otype.typeview);
              if (debug) console.log('471 modifiedTypeViews', gqlObjtypeView);
              modifiedTypeViews.push(gqlObjtypeView);

              const loc  = part.loc;
              const size = part.size;
              const objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), context.myMetamodel, otype, loc, size);
              const gqlObjtypeGeo = new gql.gqlObjectTypegeo(objtypeGeo);
              if (debug) console.log('478 modifiedTypeGeos', gqlObjtypeGeo);
              modifiedTypeGeos.push(gqlObjtypeGeo);
            }
          } else // object
          {
            part.category = 'Object';
            if (debug) console.log('484 part', part);
            if (!part.objecttype) {
              const obj = myMetis.findObject(part.id);
              console.log('487 obj', obj);
            }
            if (part.objecttype?.viewkind === 'Container') {
              part.isGroup = true;
              part.viewkind = 'Container';
              part.size = "300 200";    // Hack
            }
            if (debug) console.log('487 part', part);
            if (part.parentModel == null)
              myMetis.pasteViewsOnly = true;
            const objview = uic.createObject(part, context);
            if (debug) console.log('496 New object', part, objview);
            if (objview) {
              const gqlObjview = new gql.gqlObjectView(objview);
              modifiedNodes.push(gqlObjview);
              if (debug) console.log('680 New object', gqlObjview, modifiedNodes);
              const gqlObj = new gql.gqlObject(objview.object);
              modifiedObjects.push(gqlObj);
              if (debug) console.log('683 New object', gqlObj);
            }
          }
          if (debug) console.log('506 myGoModel', myGoModel);
          // myDiagram.model.setDataProperty(node, "isGroup", part.isGroup);
        })
        myDiagram.requestUpdate();
      }
      break;
      case "ObjectDoubleClicked": {
        let sel = e.subject.part;
        let data = sel.data;
        this.state.selectedData = sel.data;
        if (debug) console.log('699 data', data, sel);
        const modalContext = {
          what: "editObjectview",
          title: "Edit Object View",
          icon: findImage(data.icon),
          myDiagram: myDiagram
        }
        myDiagram.handleOpenModal(data, modalContext, null);
      }
      break;
      case "ObjectSingleClicked": {
        const sel = e.subject.part;
        const data = sel.data;
        if (debug) console.log('523 selected', sel);
        this.state.selectedData = data
        if (debug) console.log('551 GoJSApp :', data, data.name, data.object);
        if (sel) {
          if (sel instanceof go.Node) {
            const key = data.key;
            const text = data.name;
            const typename = data.type;
            if (debug) console.log('560 typename, text', typename, text);
            if (typename === 'Object type') {
              const myNode = this.getNode(context.myGoMetamodel, key);
              if (debug) console.log('560 GoJSApp', myNode.objtype);  
              if (myNode && myNode.objtype) {
                const gqlNode = new gql.gqlObjectType(myNode.objtype, true);
                selectedObjectTypes.push(gqlNode);
                if (debug) console.log('564 GoJSApp', selectedObjectTypes);
                } 
            } else { // object
              myDiagram.clearHighlighteds();
              const object = data.object;
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
              const gqlObjView = new gql.gqlObjectView(objview);
              selectedObjectViews.push(gqlObjView);
              if (debug) console.log('572 GoJSApp :', context.myGoModel);                
            }
          } else if (sel instanceof go.Link) {
            const key = data.key;
            let text = data.name;
            const typename = data.type;

            if (typename === 'Relationship type') {
              const myLink = this.getLink(context.myGoMetamodel, key);
              // if (debug) console.log('514 GoJSApp', myLink.reltype);
              if (myLink.reltype) {
                const gqlLink= new gql.gqlRelationshipType(myLink.reltype, true);
                selectedRelationshipTypes.push(gqlLink);
                // if (debug) console.log('518 GoJSApp', selectedRelationshipTypes);
              }
            } else // relation
            {
              let relshipview = sel.data.relshipview;
              relshipview = myMetis.findRelationshipView(relshipview?.id);
              // Do whatever you like
              // ..
              const gqlRelshipView = new gql.gqlRelshipView(relshipview);
              selectedRelshipViews.push(gqlRelshipView);
              // if (debug) console.log('527 GoJSApp :', gqlRelshipView);                
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
        context.pasted  = true;
        if (debug) console.log('650 myGoModel', myGoModel);
        const it = selection.iterator;
        const pastedNodes = new Array();
          // First handle the objects
        while (it.next()) {
          const data = it.value.data;
          if (data.category === 'Object') {
              if (debug) console.log('654 ClipboardPasted', data, myGoModel);
              const objview = uic.createObject(data, context);
              if (debug) console.log('655 ClipboardPasted', data, objview);
              if (objview) {
                const node = new gjs.goObjectNode(data.key, objview);
                if (debug) console.log('614 node', node);
                const group = uic.getGroupByLocation(myGoModel, objview.loc);
                if (debug) console.log('662 group', group)
                if (group && node) {
                  objview.group = group.objectview?.id;
                  node.group = group.key;
                }
                pastedNodes.push(node);
                const objid = objview.object?.id;
                objview.object = myMetis.findObject(objid);
                const gqlObjview = new gql.gqlObjectView(objview);
                modifiedNodes.push(gqlObjview);
                if (debug) console.log('672 ClipboardPasted', modifiedNodes);
                const gqlObj = new gql.gqlObject(objview.object);
                modifiedObjects.push(gqlObj);
                if (debug) console.log('675 ClipboardPasted', modifiedObjects);
              }
          }
        }
        if (debug) console.log('681 pastedNodes', pastedNodes);
        if (debug) console.log('679 ClipboardPasted', context.myGoModel);
        const it1 = selection.iterator;
        // Then handle the relationships
        while (it1.next()) {
          const data = it1.value.data;
          if (data.category === 'Relationship') {
            if (debug) console.log('641 ClipboardPasted', data);
            if (debug) console.log('644 ClipboardPasted', data, pastedNodes);
            let relview = uic.pasteRelationship(data, pastedNodes, context);
            if (debug) console.log('646 relview', data, relview);
            if (relview) {
              const relid = relview.relship?.id;
              relview.relship = myMetis.findRelationship(relid);
              const gqlRelview = new gql.gqlRelshipView(relview);
              if (debug) console.log('702 ClipboardPasted', gqlRelview, relview);
              modifiedLinks.push(gqlRelview);
              const gqlRelship = new gql.gqlRelationship(relview.relship);
              if (debug) console.log('705 ClipboardPasted', gqlRelship, relview.relship);
              modifiedRelships.push(gqlRelship);
            }
          }
        }
        if (debug) console.log('710 ClipboardPasted', modifiedLinks, modifiedRelships);       
        myDiagram.requestUpdate();
      }
      break;
      case 'LinkDrawn': {
        const link = e.subject;
        const data = link.data;
        if (debug) console.log('668 link', link, link.fromNode, link.toNode);

        // Prepare for linkToLink
        if (linkToLink) {
          let labels = link.labelNodes;
          for (let it = labels.iterator; it.next();) {     
            if (debug) console.log('672 it.value', it.value);
            const linkLabel = it.value;
            // Connect linkLabel to relview
          }
          if (data.category === 'linkToLink') {
            // This is a link from a relationship between fromNode and toNode to an object
            // The link from rel to object is link.data
            // Todo: Handle this situation
          }
        }

        if (debug) console.log('670 data', data);
        const fromNode = myDiagram.findNodeForKey(data.from);
        const toNode = myDiagram.findNodeForKey(data.to);

        if (debug) console.log('676 LinkDrawn', fromNode, toNode, data);
        // Handle relationship types
        if (fromNode?.data?.category === 'Object type') {
          data.category = 'Relationship type';
          if (debug) console.log('932 link', fromNode, toNode);
          link.category = 'Relationship type';
          link.class = 'goRelshipTypeLink';
          const reltype = uic.createRelationshipType(fromNode.data, toNode.data, data, context);
          if (reltype) {
            if (debug) console.log('937 reltype', reltype);
            const gqlType = new gql.gqlRelationshipType(reltype, true);
            modifiedTypeLinks.push(gqlType);
            if (debug) console.log('940 gqlType', gqlType);
            const reltypeview = reltype.typeview;
            if (reltypeview) {
              const gqlTypeView = new gql.gqlRelshipTypeView(reltypeview);
              modifiedLinkTypeViews.push(gqlTypeView);
              if (debug) console.log('945 gqlTypeView', gqlTypeView);
            }
          }
        }
        // Handle relationships
        if (fromNode?.data?.category === 'Object') {
          data.category = 'Relationship';
          let relview;
          relview = uic.createRelationship(data, context);
          if (debug) console.log('700 relview', relview);
          if (relview) {
            let rel = relview.relship;
            rel = myMetis.findRelationship(rel.id);
            const myLink = new gjs.goRelshipLink(data.key, myGoModel, relview);
            myLink.fromNode = fromNode;
            myLink.toNode   = toNode;
            if (debug) console.log('675 relview', relview, myLink);
            const gqlRelview = new gql.gqlRelshipView(relview);
            if (debug) console.log('678 LinkDrawn', link, gqlRelview);
            modifiedLinks.push(gqlRelview);
            const gqlRelship = new gql.gqlRelationship(rel);
            if (debug) console.log('681 LinkDrawn', gqlRelship);
            modifiedRelships.push(gqlRelship);
          }
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
      case "BackgroundSingleClicked": {
        if (debug) console.log('790 myMetis', myMetis);
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

    this.state.phFocus.focusModelview = myMetis.currentModelview;
    // if (debug) console.log('577 modifiedNodes', modifiedNodes);
    modifiedNodes.map(mn => {
      let data = mn
      if (!debug) console.log('806 UPDATE_OBJECTVIEW_PROPERTIES', data)
      this.props?.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
    })

    // if (debug) console.log('583 modifiedTypeNodes', modifiedTypeNodes);
    modifiedTypeNodes?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data })
    })

    // if (debug) console.log('589 modifiedTypeViews', modifiedTypeViews);
    modifiedTypeViews?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
      if (debug) console.log('760 data', data);
    })

    // if (debug) console.log('705 modifiedTypeGeos', modifiedTypeGeos);
    modifiedTypeGeos?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_OBJECTTYPEGEOS_PROPERTIES', data })
    })

    // if (debug) console.log('694 modifiedLinks', modifiedLinks);
    modifiedLinks.map(mn => {
      let data = mn
      this.props?.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
    })

    // if (debug) console.log('607 modifiedLinkTypes', modifiedLinkTypes);
    modifiedTypeLinks?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
    })

    // if (debug) console.log('613 modifiedLinkTypeViews', modifiedLinkTypeViews);
    modifiedLinkTypeViews?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
    })

    // if (debug) console.log('619 modifiedObjects', modifiedObjects);
    modifiedObjects?.map(mn => {
      let data = (mn) && mn
      if (!debug) console.log('849 UPDATE_OBJECT_PROPERTIES', data)
      this.props?.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
    })

    // if (debug) console.log('544 modifiedRelships', modifiedRelships);
    modifiedRelships?.map(mn => {
      let data = (mn) && mn
      if (debug) console.log('831 data', data);
      this.props?.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
    })

    // if (debug) console.log('643 selectedObjectViews', selectedObjectViews);
    selectedObjectViews?.map(mn => {
      let data = (mn) && { id: mn.id, name: mn.name }
      this.props?.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data })
    })

    // if (debug) console.log('677 selectedRelshipViews', selectedRelshipViews);
    selectedRelshipViews?.map(mn => {
      let data = (mn) && { id: mn.id, name: mn.name }
      this.props?.dispatch({ type: 'SET_FOCUS_RELSHIPVIEW', data })
    })

    // if (debug) console.log('643 selectedObjectTypes', selectedObjectTypes);
    selectedObjectTypes?.map(mn => {
      let data = (mn) && { id: mn.id, name: mn.name }
      this.props?.dispatch({ type: 'SET_FOCUS_OBJECTTYPE', data })
    })
    // if (debug) console.log('689 selectedRelationshipTypes', selectedRelationshipTypes);
    selectedRelationshipTypes?.map(mn => {
      let data = (mn) && { id: mn.id, name: mn.name }
      this.props?.dispatch({ type: 'SET_FOCUS_RELSHIPTYPE', data })
    })

    // Function to identify images related to an image id
    function findImage(image: string) {
      if (!image) return "";
      // if (image.substring(0,4) === 'http') { // its an URL
      if (image.includes('//')) { // its an URL   
        // if (debug) console.log('1269 Diagram', image);
        return image
      } else if (image.includes('/')) { // its a local image
        if (debug) console.log('1270 Diagram', image);   
        return image
      } else if (image.includes('<svg ')) { // its a local image
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
      } else { 
        if (debug) console.log('1283 Diagram', image);
        return "./../images/" + image //its an image in public/images
      }
      return "";
    }
  }

  public render() {   
    const selectedData = this.state.selectedData;
    if (debug) console.log('1075 selectedData', selectedData, this.props);
    let inspector;
    if (selectedData !== null) {
      inspector = 
        <div className="p-2" style={{backgroundColor: "#ddd"}}>
          <p>Selected Object Properties:</p>
          <SelectionInspector 
            myMetis={this.state.myMetis}
            selectedData={this.state.selectedData}
            context={this.state.context}
            onInputChange={this.handleInputChange}
          />;
        </div>
    }

    if (this.state.myMetis) { this.state.myMetis.dispatch = this.state.dispatch };
    if (debug) console.log('1120 dispatch', this.state.myMetis.dispatch);
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
        {/* {inspector} */}
      </div>
      
    );
  }
}

export default GoJSApp;
