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
import * as gql from '../../akmm/ui_graphql';
import * as uic from '../../akmm/ui_common';
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
  showModal: boolean;
  modalContext: any;
  selectedOption: any;
}

class GoJSApp extends React.Component<{}, AppState> {
  constructor(props: object) {
    super(props);
    if (debug) console.log('58 GoJSApp',props.nodeDataArray);
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

  public handleSelectDropdownChange = (selected) => {
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
    if (debug) console.log('145 handleDiagramEvent', myGoMetamodel);
    const gojsModel = {
      nodeDataArray: myGoModel?.nodes,
      linkDataArray: myGoModel?.links
    }
    if (debug) console.log('156 gojsModel', gojsModel);
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
            if (category === constants.gojs.C_OBJECTTYPE) {
              if (text === 'Edit name') {
                text = prompt('Enter name');
              }
              const myNode = sel;
              if (debug) console.log('207 myNode', myNode);
              if (myNode) {
                data.name = text;
                if (debug) console.log('216 data, field, text', data, field, text);
                uic.updateObjectType(data, field, text, context);
                if (debug) console.log('218 TextEdited', data);
                const objtype = myMetis.findObjectType(data.objecttype?.id);
                if (objtype) {
                  const gqlObjType = new gql.gqlObjectType(objtype, true);
                  modifiedTypeNodes.push(gqlObjType);
                  if (debug) console.log('223 TextEdited', gqlObjType);
                }
              }
            } else { // Object           
              if (text === 'Edit name') {
                text = prompt('Enter name');
                data.name = text;
              }
              const myNode = this.getNode(myGoModel, key);
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
                      myDiagram.model?.setDataProperty(node.data, "name", myNode.name);
                      const gqlObjview = new gql.gqlObjectView(objview);
                      modifiedNodes.push(gqlObjview);
                    } 
                  }
                }
                data.name = myNode.name;
                if (debug) console.log('265 node', data, myNode, objview);
                const gqlObj = new gql.gqlObject(myNode.objectview.object);
                modifiedObjects.push(gqlObj);
                if (debug) console.log('268 node', gqlObj);
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
              if (debug) console.log('232 TextEdited', myLink);
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
              myDiagram.model?.setDataProperty(myLink.data, "name", myLink.name);
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
                      if (link) myDiagram.model?.setDataProperty(link.data, "name", myLink.name);
                      const gqlRelview = new gql.gqlRelshipView(relview);
                      modifiedLinks.push(gqlRelview);
                    } 
                  }
                  if (debug) console.log('317 rel, myLink', rel, myLink);
                  if (myLink.relshipview) {
                    const gqlRel = new gql.gqlRelationship(rel);
                    modifiedRelships.push(gqlRel);
                  }
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
                    const gqlRel = new gql.gqlRelationship(rel);
                    modifiedRelships.push(gqlRel);
                  }
                } else { // delete the corresponding relationships
                  for (let i=0; i<rels.length; i++) {
                    const rel = rels[i];
                    rel.markedAsDeleted = deletedFlag;
                    const gqlRel = new gql.gqlRelationship(rel);
                    modifiedRelships.push(gqlRel);
                    if (debug) console.log('501 gqlRel', gqlRel);
                  }
                }
              }
              // Check if reltype comes from or goes to a systemtype
              // If so, do not delete
              const fromObjtype = reltype.fromObjtype;
              const toObjtype   = reltype.toObjtype;
              if (debug) console.log('509 fromObjtype, toObjtype', fromObjtype, toObjtype);
              if (!this.isSystemType(fromObjtype)) {
                if (!this.isSystemType(toObjtype)) {
                  continue;
                }
              }
              if (debug) console.log('514 reltype', reltype);
              reltype.markedAsDeleted = deletedFlag;
              uic.deleteRelationshipType(reltype, deletedFlag);
              const gqlReltype = new gql.gqlRelationshipType(reltype, true);
              modifiedTypeLinks.push(gqlReltype);
              if (debug) console.log('519 modifiedTypeLinks', modifiedTypeLinks);
              let reltypeview = reltype.typeview;
              if (reltypeview) {
                  // reltypeview.markedAsDeleted = deletedFlag;
                  const gqlReltypeView = new gql.gqlRelshipTypeView(reltypeview);
                  modifiedTypeViews.push(gqlReltypeView);
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
                    const gqlObj = new gql.gqlObject(obj);
                    modifiedObjects.push(gqlObj);
                  }
                } else { // delete the corresponding objects
                  for (let i=0; i<objects.length; i++) {
                    const obj = objects[i];
                    obj.markedAsDeleted = deletedFlag;
                    const gqlObj = new gql.gqlObject(obj);
                    modifiedObjects.push(gqlObj);
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
            uic.deleteLink(data, deletedFlag, modifiedLinks, modifiedLinkTypeViews, context);
            const relview = data.relshipview;
            if (relview && relview.category === constants.gojs.C_RELATIONSHIP) {
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

          if (debug) console.log('459 part, node, n', part, node, n);
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
            if (debug) console.log('674 part', part);
            if (!part.objecttype) {
              const obj = myMetis.findObject(part.id);
              console.log('581 obj', obj);
            }
            if (part.objecttype?.viewkind === 'Container') {
              part.isGroup = true;
              part.viewkind = 'Container';
            }
            if (debug) console.log('683 part', part);
            if (part.parentModel == null)
              myMetis.pasteViewsOnly = true;
            if (debug) console.log('686 myMetis', myMetis);
            const objview = uic.createObject(part, context);
            if (debug) console.log('688 myMetis', myMetis);
            if (debug) console.log('689 New object', part, objview);
            if (objview) {
              let otype = objview.object.type;
              if (!otype) {
                otype = myMetis.findObjectType(objview.object.typeRef);
                objview.object.type = otype;
              }
              const gqlObjview = new gql.gqlObjectView(objview);
              modifiedNodes.push(gqlObjview);
              if (debug) console.log('698 New object', gqlObjview, modifiedNodes);
              const gqlObj = new gql.gqlObject(objview.object);
              modifiedObjects.push(gqlObj);
              if (debug) console.log('700 New object', gqlObj);
            }
          }
          if (debug) console.log('704 myGoModel', myGoModel, myMetis);
          // myDiagram.model?.setDataProperty(node, "isGroup", part.isGroup);
        })
        myDiagram.requestUpdate();
      }
      break;
      case "ObjectDoubleClicked": {
        let sel = e.subject.part;
        let data = sel.data;
        this.state.selectedData = sel.data;
        if (debug) console.log('699 data', data.objecttype.viewkind, sel);
        if (true) {
          // Test open modal
          const icon = findImage(data.icon);
          const modalContext = {
            what:       "Test",
          }
          this.handleOpenModal(data, modalContext);
          // End test
        }
      }
      break;
      case "ObjectSingleClicked": {
        const sel = e.subject.part;
        const data = sel.data;
        if (debug) console.log('644 selected', sel.key);
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
                const gqlNode = new gql.gqlObjectType(myNode.objtype, true);
                selectedObjectTypes.push(gqlNode);
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
              if (relshipview) {
                // Do whatever you like
                // ..
                const gqlRelshipView = new gql.gqlRelshipView(relshipview);
                selectedRelshipViews.push(gqlRelshipView);
                if (debug) console.log('709 GoJSApp :', gqlRelshipView); 
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
        context.pasted  = true;
        const it = selection.iterator;
        const pastedNodes = new Array();
        // First handle the objects
        while (it.next()) {
          if (debug) console.log('776 it.value', it.value);
          const data = it.value.data;
          if (data.category === constants.gojs.C_OBJECT) {
              context.pasted = true;
              if (debug) console.log('780 ClipboardPasted', data, myGoModel);
              const objview = uic.createObject(data, context);
              if (debug) console.log('782 ClipboardPasted', data, objview);
              if (objview) {
                const node = new gjs.goObjectNode(data.key, objview);
                if (debug) console.log('785 node', node);
                const group = uic.getGroupByLocation(myGoModel, objview.loc);
                if (debug) console.log('787 group', group)
                if (group && node) {
                  objview.group = group.objectview?.id;
                  node.group = group.key;
                  const gjsNode = myDiagram.findNodeForKey(node.key);
                  myDiagram.model?.setDataProperty(gjsNode, "group", group.key);
                }
                if (debug) console.log('792 node', node);
                pastedNodes.push(node);
                const objid = objview.object?.id;
                objview.object = myMetis.findObject(objid);
                const gqlObjview = new gql.gqlObjectView(objview);
                modifiedNodes.push(gqlObjview);
                if (debug) console.log('798 ClipboardPasted', modifiedNodes);
                const gqlObj = new gql.gqlObject(objview.object);
                modifiedObjects.push(gqlObj);
                if (debug) console.log('801 ClipboardPasted', modifiedObjects);
              }
          }
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
              const gqlRelview = new gql.gqlRelshipView(relview);
              if (debug) console.log('820 ClipboardPasted', gqlRelview, relview);
              modifiedLinks.push(gqlRelview);
              const gqlRelship = new gql.gqlRelationship(relview.relship);
              if (debug) console.log('823 ClipboardPasted', gqlRelship, relview.relship);
              modifiedRelships.push(gqlRelship);
            }
          }
        }
        if (debug) console.log('828 ClipboardPasted', modifiedLinks, modifiedRelships);       
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
            const gqlType = new gql.gqlRelationshipType(reltype, true);
            modifiedTypeLinks.push(gqlType);
            if (debug) console.log('915 gqlType', gqlType);
            const reltypeview = reltype.typeview;
            if (reltypeview) {
              const gqlTypeView = new gql.gqlRelshipTypeView(reltypeview);
              modifiedLinkTypeViews.push(gqlTypeView);
              if (debug) console.log('920 gqlTypeView', gqlTypeView);
            }
          }
        }
        // Handle relationships
        if (fromNode?.data?.category === constants.gojs.C_OBJECT) {
          data.category = 'Relationship';
          context.handleOpenModal = this.handleOpenModal;
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
        if (debug) console.log('895 data', data);
        let relview = data.relshipview;
        relview = myModelview.findRelationshipView(relview?.id);
        if (relview) {
          relview.points = link.data.points;;
          const gqlRelview = new gql.gqlRelshipView(relview);
          if (debug) console.log('912 relview, gqlRelview', relview, gqlRelview);
          modifiedLinks.push(gqlRelview);
        }
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
    // Dispatches
    if (true) {
      this.state.phFocus.focusModelview = myMetis.currentModelview;
      if (debug) console.log('923 modifiedNodes', modifiedNodes);
      modifiedNodes.map(mn => {
        let data = mn
        if (debug) console.log('877 UPDATE_OBJECTVIEW_PROPERTIES', data)
        this.props?.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
      })

      if (debug) console.log('930 modifiedTypeNodes', modifiedTypeNodes);
      modifiedTypeNodes?.map(mn => {
        let data = (mn) && mn
        if (debug) console.log('900 UPDATE_OBJECTTYPE_PROPERTIES', data)
        this.props?.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data })
      })

      if (debug) console.log('937 modifiedTypeViews', modifiedTypeViews);
      modifiedTypeViews?.map(mn => {
        let data = (mn) && mn
        this.props?.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
        if (debug) console.log('892 data', data);
      })

      if (debug) console.log('944 modifiedTypeGeos', modifiedTypeGeos);
      modifiedTypeGeos?.map(mn => {
        let data = (mn) && mn
        this.props?.dispatch({ type: 'UPDATE_OBJECTTYPEGEOS_PROPERTIES', data })
      })

      if (debug) console.log('950 modifiedLinks', modifiedLinks);
      modifiedLinks.map(mn => {
        let data = mn
        this.props?.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
      })

      if (debug) console.log('956 modifiedLinkTypes', modifiedLinkTypes);
      modifiedTypeLinks?.map(mn => {
        let data = (mn) && mn
        this.props?.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
      })

      // if (debug) console.log('929 modifiedLinkTypeViews', modifiedLinkTypeViews);
      modifiedLinkTypeViews?.map(mn => {
        let data = (mn) && mn
        this.props?.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
      })

      if (debug) console.log('968 modifiedObjects', modifiedObjects);
      modifiedObjects?.map(mn => {
        let data = (mn) && mn
        if (debug) console.log('938 UPDATE_OBJECT_PROPERTIES', data)
        this.props?.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
      })

      if (debug) console.log('975 modifiedRelships', modifiedRelships);
      modifiedRelships?.map(mn => {
        let data = (mn) && mn
        if (debug) console.log('945 data', data);
        this.props?.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
      })

      if (debug) console.log('982 selectedObjectViews', selectedObjectViews);
      selectedObjectViews?.map(mn => {
        let data = (mn) && { id: mn.id, name: mn.name }
        this.props?.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data })
      })

      if (debug) console.log('988 selectedRelshipViews', selectedRelshipViews);
      selectedRelshipViews?.map(mn => {
        let data = (mn) && { id: mn.id, name: mn.name }
        this.props?.dispatch({ type: 'SET_FOCUS_RELSHIPVIEW', data })
      })

      if (debug) console.log('994 selectedObjectTypes', selectedObjectTypes);
      selectedObjectTypes?.map(mn => {
        let data = (mn) && { id: mn.id, name: mn.name }
        this.props?.dispatch({ type: 'SET_FOCUS_OBJECTTYPE', data })
      })
      if (debug) console.log('999 selectedRelationshipTypes', selectedRelationshipTypes);
      selectedRelationshipTypes?.map(mn => {
        let data = (mn) && { id: mn.id, name: mn.name }
        this.props?.dispatch({ type: 'SET_FOCUS_RELSHIPTYPE', data })
      })
    }
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

        const value = (selectedOption)  ? selectedOption.value : options[0];
        if (debug) console.log('1142 context', context);
        if (debug) console.log('1143 selectedOption, value ', selectedOption, value);
        header = modalContext.title;
        modalContent = 
          <div className="modal-selection d-flex justify-content-center">
            <Select className="modal-select"
              options={options}
              components={comps}
              onChange={value => this.handleSelectDropdownChange(value, context)}
              value={value}
            />
          </div>
          {/* <option value={option.value}>{label: option.label, option.value}</option>
          */}      
          
    } else {
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
