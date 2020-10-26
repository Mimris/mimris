// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = true;

import * as go from 'gojs';
import { produce } from 'immer';
import * as React from 'react';

import { DiagramWrapper } from './components/Diagram';
import { SelectionInspector } from './components/SelectionInspector';

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
  skipsDiagramUpdate: boolean;
  metis: any;
  myMetis: akm.cxMetis;
  myGoModel: gjs.goModel;
  myGoMetamodel: gjs.goModel;
  phFocus: any;
  dispatch: any;
}

class GoJSApp extends React.Component<{}, AppState> {
  // Maps to store key -> arr index for quick lookups
  private mapNodeKeyIdx: Map<go.Key, number>;
  private mapLinkKeyIdx: Map<go.Key, number>;


  constructor(props: object) {
    super(props);
    // if (debug) console.log('48 GoJSApp',props.nodeDataArray);
    this.state = {
      nodeDataArray: this.props?.nodeDataArray,
      linkDataArray: this.props?.linkDataArray,
      modelData: {
        canRelink: true
      },
      selectedData: null,
      skipsDiagramUpdate: false,
      metis: this.props.metis,
      myMetis: this.props.myMetis,
      myGoModel: this.props.myGoModel,
      myGoMetamodel: this.props.myGoMetamodel,
      phFocus: this.props.phFocus,
      dispatch: this.props.dispatch
    };
    // init maps
    this.mapNodeKeyIdx = new Map<go.Key, number>();
    this.mapLinkKeyIdx = new Map<go.Key, number>();
    this.refreshNodeIndex(this.state.nodeDataArray); //|| []); // sf added ™|| []" to avoid crash if !nodeDataArray
    this.refreshLinkIndex(this.state.linkDataArray); // sf added ™|| []" to avoid crash if !linkDataArray
    // bind handler methods
    this.handleDiagramEvent = this.handleDiagramEvent.bind(this);
    //this.handleModelChange = this.handleModelChange.bind(this);
    //this.handleInputChange = this.handleInputChange.bind(this);
    //this.handleRelinkChange = this.handleRelinkChange.bind(this);
  }



  /**
   * Update map of node keys to their index in the array.
   */
  private refreshNodeIndex(nodeArr: Array<go.ObjectData>) {
    this.mapNodeKeyIdx.clear();
    nodeArr.forEach((n: go.ObjectData, idx: number) => {
      this.mapNodeKeyIdx.set(n.key, idx);
    });
  }

  /**
   * Update map of link keys to their index in the array.
   */
  private refreshLinkIndex(linkArr: Array<go.ObjectData>) {
    this.mapLinkKeyIdx.clear();
    linkArr.forEach((l: go.ObjectData, idx: number) => {
      this.mapLinkKeyIdx.set(l.key, idx);
    });
  }

  private getNode(goModel: any, key: string) {
    const nodes = goModel?.nodes;
    if (nodes) {
      for (let i = 0; i < nodes.length; i++) {
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
    const dispatch = this.state.dispatch;
    const name = e.name;
    const myDiagram = e.diagram;
    const myMetis = this.state.myMetis;
    // if (debug) console.log('139 handleDiagramEvent', myMetis);
    const myModel = myMetis?.findModel(this.state.phFocus.focusModel.id);
    const myModelview = myMetis?.findModelView(this.state.phFocus.focusModelview.id);
    const myMetamodel = myModel?.getMetamodel();
    const myGoModel = this.state.myGoModel;
    const myGoMetamodel = this.state.myGoMetamodel;
    // if (debug) console.log('145 handleDiagramEvent', myGoMetamodel);
    const gojsModel = {
      nodeDataArray: myGoModel?.nodes,
      linkDataArray: myGoModel?.links
    }
    const nodes = new Array();
    const nods = myGoMetamodel?.nodes;
    for (let i=0; i<nods?.length; i++) {
      const node = nods[i];
      const objtype = node.objtype;
      if (objtype.abstract) continue;
      if (objtype.deleted)  continue;
      nodes.push(node);
    }
    if (nodes.length > 0) myGoMetamodel.nodes = nodes;
    // if (debug) console.log('159 gojsMetamodel', myGoMetamodel);

    const gojsMetamodel = {
      nodeDataArray: myGoMetamodel?.nodes,
      linkDataArray: myGoMetamodel?.links
    }
    // if (debug) console.log('165 gojsMetamodel', gojsMetamodel);
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
    // if (debug) console.log('195 handleDiagramEvent - context', name, this.state, context);
    // if (debug) console.log('196 handleEvent', myMetis);

    switch (name) {
      case 'TextEdited': {
        let sel = e.subject.part;
        let field = e.subject.name;
        this.setState(
          produce((draft: AppState) => {
            if (sel) {
              if (sel instanceof go.Node) {
                const key = sel.data.key;
                let text = sel.data.name;
                const typename = sel.data.type;
                // if (debug) console.log('209 typename', typename);
                if (typename === 'Object type') {
                  if (text === 'Edit name') {
                    text = prompt('Enter name');
                  }
                  const myNode = this.getNode(context.myGoMetamodel, key);
                  if (myNode) {
                    myNode.name = text;
                    uic.updateObjectType(myNode, field, text, context);
                    // if (debug) console.log('218 TextEdited', myNode);
                    if (myNode.objtype) {
                      const gqlObjType = new gql.gqlObjectType(myNode.objtype, true);
                      modifiedTypeNodes.push(gqlObjType);
                      // if (debug) console.log('222 TextEdited', gqlObjType);
                    }
                  }
                } else // Object
                {
                  if (text === 'Edit name') {
                    text = prompt('Enter name');
                    sel.data.name = text;
                  }
                  const myNode = this.getNode(context.myGoModel, key);
                  if (myNode) {
                    myNode.name = text;
                    uic.updateObject(myNode, field, text, context);
                    const gqlObjview = new gql.gqlObjectView(myNode.objectview);
                    modifiedNodes.push(gqlObjview);
                    const gqlObj = new gql.gqlObject(myNode.objectview.object);
                    gqlObj.addObjectView(gqlObjview);
                    modifiedObjects.push(gqlObj);
                  }
                }
              }
              if (sel instanceof go.Link) {
                // relationship
                const key = sel.data.key;
                let text = sel.data.name;
                let typename = sel.data.type;
                if (typename === 'Relationship type') {
                  const myLink = this.getLink(context.myGoMetamodel, key);
                  // if (debug) console.log('232 TextEdited', myLink);
                  if (myLink) {
                    if (text === 'Edit name') {
                      text = prompt('Enter name');
                      typename = text;
                    }
                    uic.updateRelationshipType(myLink, "name", text, context);
                    if (myLink.reltype) {
                      const gqlReltype = new gql.gqlRelationshipType(myLink.reltype, true);
                      modifiedTypeLinks.push(gqlReltype);
                      if (debug) console.log('242 TextEdited', modifiedTypeLinks);
                    }
                  }
                  context.myDiagram.model.setDataProperty(myLink.data, "name", myLink.name);
                } else {
                  const myLink = this.getLink(context.myGoModel, key);
                  if (myLink) {
                    if (text === 'Edit name') {
                      text = prompt('Enter name');
                      sel.data.name = text;
                    }
                    myLink.name = text;
                    uic.updateRelationship(myLink, field, text, context);
                    if (myLink.relhipview) {
                      const gqlLink = new gql.gqlRelshipView(myLink.relshipview);
                      modifiedLinks.push(gqlLink);
                    }
                    context.myDiagram.model.setDataProperty(myLink.data, "name", myLink.name);
                  }
                }
              }
            }
          }
          ))
      }
        break;
      case "SelectionMoved": {
        let selection = e.subject;
        this.setState(
          produce((draft: AppState) => {
            for (let it = selection.iterator; it.next();) {
              const sel = it.value;
              const data = sel.data;
              const typename = data.type;
              // if (debug) console.log('274 SelectionMoved', data);
              if (typename === 'Object type') {
                  // if (debug) console.log('268 myMetamodel', context.myMetamodel);  // Object type moved
                  const objtype = context.myMetis.findObjectType(data.objtype.id);
                  if (objtype) {
                      let objtypeGeo = context.myMetamodel.findObjtypeGeoByType(objtype);
                      if (!objtypeGeo) {
                          objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), context.myMetamodel, objtype, "", "");
                      }
                      objtypeGeo.setLoc(data.loc);
                      objtypeGeo.setSize(data.size);
                      objtypeGeo.setModified();
                      const gqlObjtypeGeo = new gql.gqlObjectTypegeo(objtypeGeo);
                      modifiedTypeGeos.push(gqlObjtypeGeo);
                  }
              }
              else // Object
              {
                // Object moved
                const key = sel.data.key;
                uic.changeNodeSizeAndPos(sel.data, myGoModel, modifiedNodes);
                const myNode = this.getNode(context.myGoModel, key);
                // if (debug) console.log('300 SelectionMoved', myNode);
                // if (debug) console.log('301 SelectionMoved', modifiedNodes);
              }
            }
          })
        )
      }
        break;
      case "SelectionDeleted": {
        const deletedFlag = true;
        const selection = e.subject;
        this.setState(
          produce((draft: AppState) => {
            for (let it = selection.iterator; it.next();) {
              const sel  = it.value;
              const data = sel.data;
              const key  = data.key;
              const typename = data.type;
              if (typename === 'Object type') {
                // if (debug) console.log('334 myMetamodel', context.myMetamodel);  
                const objtype = context.myMetis.findObjectType(data.objtype.id);
                if (objtype) {
                  // Check if objtype instances exist
                  if (context.myMetis.getObjectsByType(objtype, true)) {
                      alert('Objects of type ' + objtype.name + ' exist - Deletion is not allowed!');
                      break;
                  } 
                  objtype.deleted = deletedFlag;
                  const gqlObjtype = new gql.gqlObjectType(objtype, true);
                  modifiedTypeNodes.push(gqlObjtype);
                  if (debug) console.log('345 modifiedTypeNodes', modifiedTypeNodes);
                  let objtypeview = objtype.typeview;
                  if (objtypeview) {
                      objtypeview.deleted = deletedFlag;
                      const gqlObjtypeView = new gql.gqlObjectTypeView(objtypeview);
                      modifiedTypeViews.push(gqlObjtypeView);
                      if (debug) console.log('351 modifiedTypeViews', modifiedTypeViews);
                  }
                  const geo = context.myMetamodel.findObjtypeGeoByType(objtype);
                  if (geo) {
                      geo.deleted = deletedFlag;
                      const gqlObjtypegeo = new gql.gqlObjectTypegeo(geo);
                      modifiedTypeGeos.push(gqlObjtypegeo);
                      if (debug) console.log('358 modifiedTypeGeos', modifiedTypeGeos);
                  }
                }
              }
              if (typename === 'Relationship type') {
                // if (debug) console.log('350 myMetamodel', context.myMetamodel);  
                const reltype = context.myMetis.findRelationshipType(data.reltype.id);
                if (reltype) {
                  // Check if reltype instances exist
                  if (context.myMetis.getRelationshipsByType(reltype)) {
                    alert('Relationships of type ' + reltype.name + ' exist - Deletion is not allowed!');
                    break;
                  }
                  reltype.deleted = deletedFlag;
                  //uic.deleteRelationshipType(reltype, deletedFlag);
                  const gqlReltype = new gql.gqlRelationshipType(reltype, true);
                  modifiedTypeLinks.push(gqlReltype);
                  if (debug) console.log('375 modifiedTypeLinks', modifiedTypeLinks);
                  let reltypeview = reltype.typeview;
                  if (reltypeview) {
                      reltypeview.deleted = deletedFlag;
                      const gqlReltypeView = new gql.gqlRelshipTypeView(reltypeview);
                      modifiedTypeViews.push(gqlReltypeView);
                      if (debug) console.log('381 modifiedTypeViews', modifiedTypeViews);
                  }
                }
              }
              if (data.class === "goObjectNode") {
                const myNode = this.getNode(context.myGoModel, key);
                if (myNode) {
                  uic.deleteNode(myNode, deletedFlag, modifiedNodes, modifiedObjects, modifiedRelships, modifiedTypeViews, context);
                  if (debug) console.log('389 modifiedNodes', modifiedNodes);
                  if (debug) console.log('390 modifiedNodes', modifiedObjects);
                  if (debug) console.log('391 modifiedTypeViews', modifiedTypeViews);
                }
              }
              if (data.class === "goRelshipLink") {
                const myLink = this.getLink(context.myGoModel, key);
                if (debug) console.log('396 SelectionDeleted', myLink);
                uic.deleteLink(data, deletedFlag, modifiedLinks, modifiedRelships, context);
                const relview = data.relshipview;
                if (relview) {
                  relview.deleted = deletedFlag;
                  const gqlRelview = new gql.gqlRelshipView(relview);
                  modifiedLinks.push(gqlRelview);
                  if (debug) console.log('403 SelectionDeleted', modifiedLinks);
                  const relship = relview.relship;
                  relship.deleted = deletedFlag;
                  const gqlRel = new gql.gqlRelationship(relship);
                  modifiedRelships.push(gqlRel);
                  if (debug) console.log('408 SelectionDeleted', modifiedRelships);
                }
              }
            }
          })
        )
      }
        break;
      case 'ChangedSelection': {
        const sel = e.subject.first();
        this.setState(
          produce((draft: AppState) => {
            if (sel) {
              if (sel instanceof go.Node) {
                const idx = this.mapNodeKeyIdx.get(sel.key);
                if (idx !== undefined && idx >= 0) {
                  const nd = draft.nodeDataArray[idx];
                  draft.selectedData = nd;
                  if (debug) console.log('357 ChangedSelection: node = ', nd);
                }
              } else if (sel instanceof go.Link) {
                // if (debug) console.log('174 GoJSApp.tsx: sel = ', sel);
                const idx = this.mapLinkKeyIdx.get(sel.data.key);
                if (idx !== undefined && idx >= 0) {
                  const ld = draft.linkDataArray[idx];
                  draft.selectedData = ld;
                  // if (debug) console.log('178 GoJSApp.tsx: link = ', ld);
                }
              }
            } else {
              draft.selectedData = null;
            }
          })
        );
        break;
      }
        break;
      case 'ExternalObjectsDropped': {
        const nodes = e.subject;
        this.setState(
          produce((draft: AppState) => {
            const nn = nodes.first();
            const part = nodes.first().data;
            if (debug) console.log('382 GoJSApp', part);
            if (part.type === 'objecttype') {
              // if (part.viewkind === 'Object') {
              //     part.typename = constants.types.OBJECTTYPE_NAME;
              // } else {
              //     part.typename = constants.types.CONTAINERTYPE_NAME;
              // }
              if (debug) console.log('458 myMetis', myMetis);
              const otype = uic.createObjectType(part, context);
              // if (debug) console.log('429 ExternalObjectsDropped - myMetis', myMetis);
              if (otype) {
                otype.typename = constants.types.OBJECTTYPE_NAME;
                // if (debug) console.log('431 ExternalObjectsDropped', otype);
                const gqlObjtype = new gql.gqlObjectType(otype, true);
                // if (debug) console.log('434 modifiedTypeNodes', gqlObjtype);
                modifiedTypeNodes.push(gqlObjtype);

                const gqlObjtypeView = new gql.gqlObjectTypeView(otype.typeview);
                // if (debug) console.log('438 modifiedTypeViews', gqlObjtypeView);
                modifiedTypeViews.push(gqlObjtypeView);

                const loc  = part.loc;
                const size = part.size;
                const objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), context.myMetamodel, otype, loc, size);
                const gqlObjtypeGeo = new gql.gqlObjectTypegeo(objtypeGeo);
                if (debug) console.log('445 modifiedTypeGeos', gqlObjtypeGeo);
                modifiedTypeGeos.push(gqlObjtypeGeo);
              }
            } else // object
            {
              if (part.parentModel == null)
                myMetis.pasteViewsOnly = true;
              if (part.isGroup)
                part.size = "300 200";    // Hack
              const objview = uic.createObject(part, context);
              if (debug) console.log('391 New object', objview);
              if (objview) {
                const myNode = myGoModel?.findNode(part.key);
                // Check if inside a group
                const group = uic.getGroupByLocation(myGoModel, objview.loc);
                // if (debug) console.log('405 group', group)
                if (group) {
                  objview.group = group.objectview?.id;
                  if (myNode) {
                    // if (debug) console.log('399 myNode', myNode, group);
                    myNode.group = group.key;
                  }
                }
                // if (debug) console.log('403 New object', myNode);
                const gqlObjview = new gql.gqlObjectView(objview);
                modifiedNodes.push(gqlObjview);
                // if (debug) console.log('406 New object', gqlNode, modifiedNodes);
                const gqlObj = new gql.gqlObject(objview.object);
                gqlObj.addObjectView(gqlObjview);
                modifiedObjects.push(gqlObj);
                // if (debug) console.log('409 New object', gqlObj);
              }
            }
          })
          )
        }
        break;
      case "ObjectSingleClicked": {
        let sel = e.subject.part;
        // if (debug) console.log('498 GoJSApp :', sel);
        this.setState(
          produce((draft: AppState) => {
            if (sel) {
              if (sel instanceof go.Node) {
                const key = sel.data.key;
                let text = sel.data.name;
                const typename = sel.data.type;

                if (typename === 'Object type') {
                  const myNode = this.getNode(context.myGoMetamodel, key);
                  // if (debug) console.log('449 GoJSApp', myNode.objtype);  
                  if (myNode && myNode.objtype) {
                    const gqlNode = new gql.gqlObjectType(myNode.objtype, true);
                    selectedObjectTypes.push(gqlNode);
                    // if (debug) console.log('453 GoJSApp', selectedObjectTypes);
                    } 
                } else // object
                {
                  let objview = sel.data.objectview;
                  objview = myMetis.findObjectView(objview.id);
                  // Do whatever you like
                  // ..
                  const gqlObjView = new gql.gqlObjectView(objview);
                  selectedObjectViews.push(gqlObjView);
                  // if (debug) console.log('522 GoJSApp :', context.myGoModel);                
                }
              } else if (sel instanceof go.Link) {
                const key = sel.data.key;
                let text = sel.data.name;
                const typename = sel.data.type;

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
                  relshipview = myMetis.findRelationshipView(relshipview.id);
                  // Do whatever you like
                  // ..
                  const gqlRelshipView = new gql.gqlRelshipView(relshipview);
                  selectedRelshipViews.push(gqlRelshipView);
                  // if (debug) console.log('527 GoJSApp :', gqlRelshipView);                
                }
              }
            }
          })
        )
      }
        break;
      case "PartResized": {
        const sel = e.subject.part.data;
        // if (debug) console.log('439 PartResized', sel);
        this.setState(
          produce((draft: AppState) => {
            uic.changeNodeSizeAndPos(sel, myGoModel, modifiedNodes);
          })
        )
      }
      break;
      case 'ClipboardChanged': {
        const nodes = e.subject;
        if (debug) console.log('nodes', nodes);
        this.setState(
          produce((draft: AppState) => {
          })
        )
      }
        break;
      case 'ClipboardPasted': {
        const selection = e.subject;
        context.pasted  = true;
        this.setState(
          produce((draft: AppState) => {
            const it = selection.iterator;
            const pastedNodes = new Array();
            while (it.next()) {
              const selected = it.value.data;
              // First handle the objects
              if (selected.class === 'goObjectNode') {
                if (debug) console.log('526 ClipboardPasted', selected);
                const node = selected;
                const objview = uic.createObject(node, context);
                if (debug) console.log('531 ClipboardPasted', node);
                if (objview) {
                  pastedNodes.push(node);
                  const gqlObjview = new gql.gqlObjectView(objview);
                  modifiedNodes.push(gqlObjview);
                  if (debug) console.log('532 ClipboardPasted', modifiedNodes);
                  const gqlObj = new gql.gqlObject(objview.object);
                  gqlObj.addObjectView(gqlObjview);
                  modifiedObjects.push(gqlObj);
                  if (debug) console.log('535 ClipboardPasted', modifiedObjects);
                }
              }
            }
            if (debug) console.log('537 ClipboardPasted', context.myGoModel);
            const it1 = selection.iterator;
            while (it1.next()) {
              // Then handle the relationships
              const selected = it1.value.data;
              if (selected.class === 'goRelshipLink') {
                if (debug) console.log('543 ClipboardPasted', selected);
                const link = selected;
                const relview = uic.pasteRelationship(link, pastedNodes, context);
                if (debug) console.log('546 relview', link, relview);
                if (relview) {
                  const gqlRelview = new gql.gqlRelshipView(relview);
                  if (debug) console.log('549 ClipboardPasted', gqlRelview);
                  modifiedLinks.push(gqlRelview);
                  const gqlRelship = new gql.gqlRelationship(relview.relship);
                  if (debug) console.log('552 ClipboardPasted', gqlRelship);
                  modifiedRelships.push(gqlRelship);
                }
              }
            }
            if (debug) console.log('511 ClipboardPasted', modifiedLinks, modifiedRelships);       
          })
        )
      }
      break;
      case 'LinkDrawn': {
        const link = e.subject;
        const fromNode = link.fromNode?.data;
        const toNode = link.toNode?.data;
        if (debug) console.log('646 LinkDrawn', fromNode, toNode, link.data, myMetis);
        this.setState(
          produce((draft: AppState) => {
            if (fromNode?.class === 'goObjectNode') {
              const relview = uic.createRelationship(link.data, context);
              if (relview) {
                const gqlRelview = new gql.gqlRelshipView(relview);
                if (debug) console.log('576 LinkDrawn', link, gqlRelview);
                modifiedLinks.push(gqlRelview);
                const gqlRelship = new gql.gqlRelationship(relview.relship);
                if (debug) console.log('579 LinkDrawn', gqlRelship);
                modifiedRelships.push(gqlRelship);
              }
            } else if (fromNode?.class === 'goObjectTypeNode') {
              if (debug) console.log('660 link', fromNode, link.data);
              link.category = 'Relationship type';
              link.class = 'goRelshipTypeLink';
              const reltype = uic.createRelationshipType(fromNode, toNode, link.data, context);
              if (reltype) {
                if (debug) console.log('665 reltype', reltype);
                const gqlType = new gql.gqlRelationshipType(reltype, true);
                modifiedTypeLinks.push(gqlType);
                if (debug) console.log('668 gqlType', gqlType);
                const gqlTypeView = new gql.gqlRelshipTypeView(reltype.typeview);
                modifiedLinkTypeViews.push(gqlTypeView);
                if (debug) console.log('671 gqlTypeView', gqlTypeView);
              }
            }
          })
        )
      }
      break;
      case "LinkRelinked": {
        const link = e.subject;
        const fromNode = link.fromNode?.data;
        const toNode = link.toNode?.data;
        if (debug) console.log('684 LinkRelinked', fromNode, toNode);
        const newLink = e.subject.data;
        this.setState(
          produce((draft: AppState) => {
            context.modifiedLinks         = modifiedLinks;
            context.modifiedRelships      = modifiedRelships;
            context.modifiedTypeLinks     = modifiedTypeLinks;
            context.modifiedLinkTypeViews = modifiedLinkTypeViews;
            uic.onLinkRelinked(newLink, fromNode, toNode, context);
            if (debug) console.log('652 LinkRelinked', modifiedLinks);
            if (debug) console.log('653 LinkRelinked', modifiedRelships);
            if (debug) console.log('654 LinkRelinked', modifiedTypeLinks);
          })
        )
      }
        break;
      case "BackgroundDoubleClicked": {
        if (debug) console.log('432 BackgroundDoubleClicked', e, e.diagram);
        break;
      }
      default:
        // if (debug) console.log('146 GoJSApp event name: ', name);
        break;
    }
    
    // this.props.dispatch({ type: 'SET_GOJS_MODEL', gojsModel })
    // if (debug) console.log('684 gojsMetamodel', gojsMetamodel);
    // this.props.dispatch({ type: 'SET_GOJS_METAMODEL', gojsMetamodel })

    // if (debug) console.log('577 modifiedNodes', modifiedNodes);
    modifiedNodes.map(mn => {
      let data = mn
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
      this.props?.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
    })

    // if (debug) console.log('544 modifiedRelships', modifiedRelships);
    modifiedRelships?.map(mn => {
      let data = (mn) && mn
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
  }


  public render() {
    // if (debug) console.log('360 props', this.state.nodeDataArray);

    const selectedData = this.state.selectedData;
    let inspector;
    if (selectedData !== null) {
      inspector = <>
        <p>Selected Object Properties:</p>
        <SelectionInspector
          selectedData={this.state.selectedData}
          onInputChange={this.handleInputChange}
        />;
      </>
    }
    // if (debug) console.log('638 GOJSApp this.state.nodeDataArray', this.state.nodeDataArray);
    // if (debug) console.log('361 this.state.linkDataArray', this.state.linkDataArray);
    // if (debug) console.log('362 this.state.myMetis', this.state.myMetis);
    // if (debug) console.log('362 this.state.myGoModel', this.state.myGoModel);
    // if (debug) console.log('558 this.context', this.context);
    // if (debug) console.log('824 dispatch', this.props.dispatch);
    //if (debug) console.log('825 dispatch', this.state.dispatch);
    if (this.state.myMetis) { this.state.myMetis.dispatch = this.state.dispatch };
    // if (debug) console.log('827 dispatch', this.state.myMetis.dispatch);
    return ( (this.state) &&
      <div className="diagramwrapper">

        <DiagramWrapper
          nodeDataArray     ={this.state.nodeDataArray}
          linkDataArray     ={this.state.linkDataArray}
          modelData         ={this.state.modelData}
          skipsDiagramUpdate={this.state.skipsDiagramUpdate}
          onDiagramEvent    ={this.handleDiagramEvent}
          onModelChange     ={this.handleModelChange}
          myMetis           ={this.state.myMetis}
          myGoModel         ={this.state.myGoModel}
          myGoMetamodel     ={this.state.myGoMetamodel}
          dispatch          ={this.state.dispatch}
        />
        {/* <label>
          Allow Relinking?
          <input
            type='checkbox'
            id='relink'
            checked={this.state.modelData.canRelink}
            onChange={this.handleRelinkChange} />
        </label> */}
        {/* {inspector} */}
      </div>
    );
  }
}

export default GoJSApp;
