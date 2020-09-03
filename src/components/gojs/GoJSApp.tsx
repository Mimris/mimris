// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

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
    // console.log('48 GoJSApp',props.nodeDataArray);
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
    this.refreshNodeIndex(this.state.nodeDataArray);
    this.refreshLinkIndex(this.state.linkDataArray);
    // bind handler methods
    this.handleDiagramEvent = this.handleDiagramEvent.bind(this);
    //this.handleModelChange = this.handleModelChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
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
    const nodes = goModel.nodes;
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
    console.log('139 handleDiagramEvent', myMetis);
    const myModel = myMetis?.findModel(this.state.phFocus.focusModel.id);
    const myModelview = myMetis?.findModelView(this.state.phFocus.focusModelview.id);
    const myMetamodel = myModel?.getMetamodel();
    const myGoModel = this.state.myGoModel;
    const myGoMetamodel = this.state.myGoMetamodel;
    const gojsModel = {
      nodeDataArray: myGoModel?.nodes,
      linkDataArray: myGoModel?.links
    }
    const gojsMetamodel = {
      nodeDataArray: myGoMetamodel?.nodes,
      linkDataArray: myGoMetamodel?.links
    }
    const modifiedNodes         = new Array();
    const modifiedLinks         = new Array();
    const modifiedTypeNodes     = new Array();
    const modifiedTypeViews     = new Array();
    const modifiedTypeGeos      = new Array();
    const modifiedTypeLinks     = new Array();
    const modifiedLinkTypeViews = new Array();
    const modifiedObjects       = new Array();
    const modifiedRelships      = new Array();
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
    // console.log('177 handleDiagramEvent - context', name, this.state, context);
    console.log('178 handleEvent', myMetis);

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

                if (typename === 'Object type') {
                  if (text === 'Edit name') {
                    text = prompt('Enter name');
                  }
                  const myNode = this.getNode(context.myGoMetamodel, key);
                  if (myNode) {
                    myNode.name = text;
                    uic.updateObjectType(myNode, field, text, context);
                    console.log('201 TextEdited', myNode);
                    if (myNode.objtype) {
                      const gqlObjType = new gql.gqlObjectType(myNode.objtype, true);
                      modifiedTypeNodes.push(gqlObjType);
                      console.log('205 TextEdited', gqlObjType);
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
                    const gqlNode = new gql.gqlObjectView(myNode.objectview);
                    modifiedNodes.push(gqlNode);
                    const gqlObj = new gql.gqlObject(myNode.objectview.object);
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
                  console.log('232 TextEdited', myLink);
                  if (myLink) {
                    if (text === 'Edit name') {
                      text = prompt('Enter name');
                      typename = text;
                    }
                    uic.updateRelationshipType(myLink, "name", text, context);
                    if (myLink.reltype) {
                      const gqlReltype = new gql.gqlRelationshipType(myLink.reltype, true);
                      modifiedTypeLinks.push(gqlReltype);
                      console.log('242 TextEdited', modifiedTypeLinks);
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
              // console.log('274 SelectionMoved', data);
              if (typename === 'Object type') {
                  // console.log('268 myMetamodel', context.myMetamodel);  // Object type moved
                  const objtype = context.myMetis.findObjectType(data.objtype.id);
                  if (objtype) {
                      let objtypeGeo = context.myMetamodel.findObjtypeGeoByType(objtype);
                      if (!objtypeGeo) {
                          objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), context.myMetamodel, objtype, "", "");
                      }
                      objtypeGeo.setLoc(data.loc);
                      objtypeGeo.setSize(data.size);
                      objtypeGeo.setModified();
                      // console.log('272 objtypeGeo', objtypeGeo);
                      const gqlObjtypeGeo = new gql.gqlObjectTypegeo(objtypeGeo);
                      // console.log('279 modifiedTypeGeos', gqlObjtypeGeo);
                      modifiedTypeGeos.push(gqlObjtypeGeo);
                      // const gqlObjtype = new gql.gqlObjectType(objtype, true);
                      // modifiedTypeNodes.push(gqlObjtype);
                      // console.log('281 modifiedTypeNodes', gqlObjtype);
                  }
              }
              else // Object
              {
                // Object moved
                const key = sel.data.key;
                uic.changeNodeSizeAndPos(sel.data, myGoModel, modifiedNodes);
                const myNode = this.getNode(context.myGoModel, key);
                console.log('300 SelectionMoved', myNode);
                // console.log('301 SelectionMoved', modifiedNodes);
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
                // console.log('321 myMetamodel', context.myMetamodel);  
                const objtype = context.myMetis.findObjectType(data.objtype.id);
                if (objtype) {
                  // Check if objtype instances exist
                  // if (context.myModel.getObjectsByType(objtype, false)) {
                  //     alert('Objects of type ' + objtype.name + ' exist - Deletion is not allowed!');
                  //     break;
                  // } 
                  objtype.deleted = deletedFlag;
                  const gqlObjtype = new gql.gqlObjectType(objtype, true);
                  modifiedTypeNodes.push(gqlObjtype);
                  console.log('332 modifiedTypeNodes', modifiedTypeNodes);
                  let objtypeview = objtype.typeview;
                  if (objtypeview) {
                      objtypeview.deleted = deletedFlag;
                      const gqlObjtypeView = new gql.gqlObjectTypeView(objtypeview);
                      modifiedTypeViews.push(gqlObjtypeView);
                      console.log('338 modifiedTypeViews', modifiedTypeViews);
                  }
                  const geo = context.myMetamodel.findObjtypeGeoByType(objtype);
                  if (geo) {
                      geo.deleted = deletedFlag;
                      const gqlObjtypegeo = new gql.gqlObjectTypegeo(geo);
                      modifiedTypeGeos.push(gqlObjtypegeo);
                      console.log('345 modifiedTypeGeos', modifiedTypeGeos);
                  }
                }
              }
              if (typename === 'Relationship type') {
                // console.log('350 myMetamodel', context.myMetamodel);  
                const reltype = context.myMetis.findRelationshipType(data.reltype.id);
                if (reltype) {
                  // Check if objtype instances exist
                  // if (context.myModel.getRelationshipsByType(reltype)) {
                  //   alert('Relationships of type ' + reltype.name + ' exist - Deletion is not allowed!');
                  //   break;
                  // }
                  reltype.deleted = deletedFlag;
                  //uic.deleteRelationshipType(reltype, deletedFlag);
                  const gqlReltype = new gql.gqlRelationshipType(reltype, true);
                  modifiedTypeLinks.push(gqlReltype);
                  console.log('362 modifiedTypeLinks', modifiedTypeLinks);
                  let reltypeview = reltype.typeview;
                  if (reltypeview) {
                      reltypeview.deleted = deletedFlag;
                      const gqlReltypeView = new gql.gqlRelshipTypeView(reltypeview);
                      modifiedTypeViews.push(gqlReltypeView);
                      console.log('368 modifiedTypeViews', modifiedTypeViews);
                  }
                }
              }
              if (data.class === "goObjectNode") {
                const myNode = this.getNode(context.myGoModel, key);
                if (myNode) {
                  uic.deleteNode(myNode, deletedFlag, modifiedNodes, modifiedObjects, context);
                  console.log('357 modifiedNodes', modifiedNodes);
                  console.log('358 modifiedNodes', modifiedObjects);
                }
              }
              if (data.class === "goRelshipLink") {
                const myLink = this.getLink(context.myGoModel, key);
                console.log('365 SelectionDeleted', myLink);
                uic.deleteLink(data, deletedFlag, modifiedLinks, modifiedRelships, context);
                const relview = data.relshipview;
                if (relview) {
                  relview.deleted = deletedFlag;
                  const gqlRelview = new gql.gqlRelshipView(relview);
                  modifiedLinks.push(gqlRelview);
                  console.log('369 SelectionDeleted', modifiedLinks);
                  const relship = relview.relship;
                  relship.deleted = deletedFlag;
                  const gqlRel = new gql.gqlRelationship(relship);
                  modifiedRelships.push(gqlRel);
                  console.log('374 SelectionDeleted', modifiedRelships);
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
                  console.log('357 ChangedSelection: node = ', nd);
                }
              } else if (sel instanceof go.Link) {
                // console.log('174 GoJSApp.tsx: sel = ', sel);
                const idx = this.mapLinkKeyIdx.get(sel.data.key);
                if (idx !== undefined && idx >= 0) {
                  const ld = draft.linkDataArray[idx];
                  draft.selectedData = ld;
                  // console.log('178 GoJSApp.tsx: link = ', ld);
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
            // console.log('382 GoJSApp', part);
            if (part.type === 'objecttype') {
              // if (part.viewkind === 'Object') {
              //     part.typename = constants.types.OBJECTTYPE_NAME;
              // } else {
              //     part.typename = constants.types.CONTAINERTYPE_NAME;
              // }

              const otype = uic.createObjectType(part, context);
              // console.log('429 ExternalObjectsDropped - myMetis', myMetis);
              if (otype) {
                otype.typename = constants.types.OBJECTTYPE_NAME;
                // console.log('431 ExternalObjectsDropped', otype);
                const gqlObjtype = new gql.gqlObjectType(otype, true);
                // console.log('434 modifiedTypeNodes', gqlObjtype);
                modifiedTypeNodes.push(gqlObjtype);

                const gqlObjtypeView = new gql.gqlObjectTypeView(otype.typeview);
                // console.log('438 modifiedTypeViews', gqlObjtypeView);
                modifiedTypeViews.push(gqlObjtypeView);

                const loc  = part.loc;
                const size = part.size;
                const objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), context.myMetamodel, otype, loc, size);
                const gqlObjtypeGeo = new gql.gqlObjectTypegeo(objtypeGeo);
                console.log('445 modifiedTypeGeos', gqlObjtypeGeo);
                modifiedTypeGeos.push(gqlObjtypeGeo);
              }
            } else // object
            {
              if (part.isGroup)
                part.size = "300 200";    // Hack
              const objview = uic.createObject(part, context);
              console.log('391 New object', objview);
              if (objview) {
                const myNode = myGoModel?.findNode(part.key);
                // Check if inside a group
                const group = uic.getGroupByLocation(myGoModel, objview.loc);
                console.log('405 group', group)
                if (group) {
                  objview.group = group.objectview?.id;
                  if (myNode) {
                    console.log('399 myNode', myNode, group);
                    myNode.group = group.key;
                  }
                }
                console.log('403 New object', myNode);
                const gqlNode = new gql.gqlObjectView(objview);
                modifiedNodes.push(gqlNode);
                console.log('406 New object', gqlNode, modifiedNodes);
                const gqlObj = new gql.gqlObject(objview.object);
                modifiedObjects.push(gqlObj);
                console.log('409 New object', gqlObj);
              }
            }
          })
          )
        }
        break;
      case "ObjectSingleClicked": {
        let sel = e.subject.part;
        console.log('437 GoJSApp :', sel);
        this.setState(
          produce((draft: AppState) => {
            if (sel) {
              if (sel instanceof go.Node) {
                const key = sel.data.key;
                let text = sel.data.name;
                const typename = sel.data.type;

                if (typename === 'Object type') {
                  const myNode = this.getNode(context.myGoMetamodel, key);
                  // console.log('449 GoJSApp', myNode.objtype);  
                  if (myNode.objtype) {
                    const gqlNode = new gql.gqlObjectType(myNode.objtype, true);
                    selectedObjectTypes.push(gqlNode);
                    // console.log('453 GoJSApp', selectedObjectTypes);
                    } 
                } else // object
                {
                  const objview = sel.data.objectview;
                  // Do whatever you like
                  // ..
                  const gqlObjView = new gql.gqlObjectView(objview);
                  selectedObjectViews.push(gqlObjView);
                  // console.log('444 GoJSApp :', node);                
                }
              } else if (sel instanceof go.Link) {
                const key = sel.data.key;
                let text = sel.data.name;
                const typename = sel.data.type;

                if (typename === 'Relationship type') {
                  const myLink = this.getLink(context.myGoMetamodel, key);
                  // console.log('514 GoJSApp', myLink.reltype);
                  if (myLink.reltype) {
                    const gqlLink= new gql.gqlRelationshipType(myLink.reltype, true);
                    selectedRelationshipTypes.push(gqlLink);
                    console.log('518 GoJSApp', selectedRelationshipTypes);
                  }
                } else // relation
                {
                  const relshipview = sel.data.relshipview;
                  // Do whatever you like
                  // ..
                  const gqlRelshipView = new gql.gqlRelshipView(relshipview);
                  selectedRelshipViews.push(gqlRelshipView);
                  console.log('527 GoJSApp :', gqlRelshipView);                
                }
              }
            }
          })
        )
      }
        break;
      case "PartResized": {
        const sel = e.subject.part.data;
        // console.log('439 PartResized', sel);
        this.setState(
          produce((draft: AppState) => {
            uic.changeNodeSizeAndPos(sel, myGoModel, modifiedNodes);
          })
        )
      }
      break;
      case 'ClipboardChanged': {
        const nodes = e.subject;
        console.log('nodes', nodes);
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
                console.log('526 ClipboardPasted', selected);
                const node = selected;
                const objview = uic.createObject(node, context);
                console.log('531 ClipboardPasted', node);
                if (objview) {
                  pastedNodes.push(node);
                  const gqlNode = new gql.gqlObjectView(objview);
                  modifiedNodes.push(gqlNode);
                  console.log('532 ClipboardPasted', modifiedNodes);
                  const gqlObj = new gql.gqlObject(objview.object);
                  modifiedObjects.push(gqlObj);
                  console.log('535 ClipboardPasted', modifiedObjects);
                }
              }
            }
            console.log('537 ClipboardPasted', context.myGoModel);
            const it1 = selection.iterator;
            while (it1.next()) {
              // Then handle the relationships
              const selected = it1.value.data;
              if (selected.class === 'goRelshipLink') {
                console.log('543 ClipboardPasted', selected);
                const link = selected;
                const relview = uic.pasteRelationship(link, pastedNodes, context);
                console.log('546 relview', link, relview);
                if (relview) {
                  const gqlRelview = new gql.gqlRelshipView(relview);
                  console.log('549 ClipboardPasted', gqlRelview);
                  modifiedLinks.push(gqlRelview);
                  const gqlRelship = new gql.gqlRelationship(relview.relship);
                  console.log('552 ClipboardPasted', gqlRelship);
                  modifiedRelships.push(gqlRelship);
                }
              }
            }
            console.log('511 ClipboardPasted', modifiedLinks, modifiedRelships);       
          })
        )
      }
      break;
      case 'LinkDrawn': {
        const link = e.subject;
        const fromNode = link.fromNode?.data;
        const toNode = link.toNode?.data;
        console.log('569 LinkDrawn', link.data);
        this.setState(
          produce((draft: AppState) => {
            if (fromNode?.class === 'goObjectNode') {
              const relview = uic.createRelationship(link.data, context);
              if (relview) {
                const gqlRelview = new gql.gqlRelshipView(relview);
                console.log('576 LinkDrawn', link, gqlRelview);
                modifiedLinks.push(gqlRelview);
                const gqlRelship = new gql.gqlRelationship(relview.relship);
                console.log('579 LinkDrawn', gqlRelship);
                modifiedRelships.push(gqlRelship);
              }
            } else if (fromNode?.class === 'goObjectTypeNode') {
              console.log('583 link', fromNode, link.data);
              link.category = 'Relationship type';
              link.class = 'goRelshipTypeLink';
              const reltype = uic.createRelationshipType(link.data, context);
              if (reltype) {
                console.log('588 reltype', reltype);
                const gqlType = new gql.gqlRelationshipType(reltype, true);
                modifiedTypeLinks.push(gqlType);
                console.log('591 gqlType', gqlType);
                const gqlTypeView = new gql.gqlRelshipTypeView(reltype.typeview);
                modifiedLinkTypeViews.push(gqlTypeView);
                console.log('594 gqlTypeView', gqlTypeView);
              }
            }
          })
        )
      }
      break;
      case "LinkRelinked": {
        const newLink = e.subject.data;
        console.log('644 LinkRelinked', context);
        this.setState(
          produce((draft: AppState) => {
            context.modifiedLinks         = modifiedLinks;
            context.modifiedRelships      = modifiedRelships;
            context.modifiedTypeLinks     = modifiedTypeLinks;
            context.modifiedLinkTypeViews = modifiedLinkTypeViews;
            uic.onLinkRelinked(newLink, context);
            console.log('652 LinkRelinked', modifiedLinks);
            console.log('653 LinkRelinked', modifiedRelships);
            console.log('654 LinkRelinked', modifiedTypeLinks);
          })
        )
      }
        break;
      case "BackgroundDoubleClicked": {
        console.log('432 BackgroundDoubleClicked', e, e.diagram);
        break;
      }
      default:
        // console.log('146 GoJSApp event name: ', name);
        break;
    }
    this.props.dispatch({ type: 'SET_GOJS_MODEL', gojsModel })
    this.props.dispatch({ type: 'SET_GOJS_METAMODEL', gojsMetamodel })

    // console.log('577 modifiedNodes', modifiedNodes);
    modifiedNodes.map(mn => {
      let data = mn
      this.props?.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
    })

    console.log('583 modifiedTypeNodes', modifiedTypeNodes);
    modifiedTypeNodes?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data })
    })

    // console.log('589 modifiedTypeViews', modifiedTypeViews);
    modifiedTypeViews?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
    })

    // console.log('595 modifiedTypeGeos', modifiedTypeGeos);
    modifiedTypeGeos?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_OBJECTTYPEGEOS_PROPERTIES', data })
    })

    console.log('694 modifiedLinks', modifiedLinks);
    modifiedLinks.map(mn => {
      let data = mn
      this.props?.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
    })

    // console.log('607 modifiedLinkTypes', modifiedLinkTypes);
    modifiedTypeLinks?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
    })

    // console.log('613 modifiedLinkTypeViews', modifiedLinkTypeViews);
    modifiedLinkTypeViews?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
    })

    // console.log('619 modifiedObjects', modifiedObjects);
    modifiedObjects?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
    })

    console.log('544 modifiedRelships', modifiedRelships);
    modifiedRelships?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
    })

    // console.log('643 selectedObjectViews', selectedObjectViews);
    selectedObjectViews?.map(mn => {
      let data = (mn) && { id: mn.id, name: mn.name }
      this.props?.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data })
    })
    // console.log('677 selectedRelshipViews', selectedRelshipViews);
    selectedRelshipViews?.map(mn => {
      let data = (mn) && { id: mn.id, name: mn.name }
      this.props?.dispatch({ type: 'SET_FOCUS_RELSHIPVIEW', data })
    })

    // console.log('643 selectedObjectTypes', selectedObjectTypes);
    selectedObjectTypes?.map(mn => {
      let data = (mn) && { id: mn.id, name: mn.name }
      this.props?.dispatch({ type: 'SET_FOCUS_OBJECTTYPE', data })
    })
    // console.log('689 selectedRelationshipTypes', selectedRelationshipTypes);
    selectedRelationshipTypes?.map(mn => {
      let data = (mn) && { id: mn.id, name: mn.name }
      this.props?.dispatch({ type: 'SET_FOCUS_RELSHIPTYPE', data })
    })
  }

  // /**
  //  * Handle GoJS model changes, which output an object of data changes via Model.toIncrementalData.
  //  * This method iterates over those changes and updates state to keep in sync with the GoJS model.
  //  * @param obj a JSON-formatted string
  //  */
  // public handleModelChange(obj: go.IncrementalData) {
  //   const insertedNodeKeys = obj.insertedNodeKeys;
  //   const modifiedNodeData = obj.modifiedNodeData;
  //   const removedNodeKeys = obj.removedNodeKeys;
  //   const insertedLinkKeys = obj.insertedLinkKeys;
  //   const modifiedLinkData = obj.modifiedLinkData;
  //   const removedLinkKeys = obj.removedLinkKeys;
  //   const modifiedModelData = obj.modelData;

  //   // console.log('211 handleModelChange', obj);
  //   // maintain maps of modified data so insertions don't need slow lookups
  //   const modifiedNodeMap = new Map<go.Key, go.ObjectData>();
  //   const modifiedLinkMap = new Map<go.Key, go.ObjectData>();
  //   this.setState(
  //     produce((draft: AppState) => {
  //       let narr = draft.nodeDataArray;
  //       if (modifiedNodeData) {
  //         modifiedNodeData.forEach((nd: go.ObjectData) => {
  //           modifiedNodeMap.set(nd.key, nd);
  //           const idx = this.mapNodeKeyIdx.get(nd.key);
  //           if (idx !== undefined && idx >= 0) {
  //             narr[idx] = nd;
  //             if (draft.selectedData && draft.selectedData.key === nd.key) {
  //               draft.selectedData = nd;
  //             }
  //           }
  //         });
  //       }
  //       if (insertedNodeKeys) {
  //         insertedNodeKeys.forEach((key: go.Key) => {
  //           const nd = modifiedNodeMap.get(key);
  //           const idx = this.mapNodeKeyIdx.get(key);
  //           if (nd && idx === undefined) {
  //             this.mapNodeKeyIdx.set(nd.key, narr.length);
  //             narr.push(nd);
  //             console.log(nd);
  //           }
  //         });
  //       }
  //       if (removedNodeKeys) {
  //         narr = narr.filter((nd: go.ObjectData) => {
  //           if (removedNodeKeys.includes(nd.key)) {
  //             return false;
  //           }
  //           return true;
  //         });
  //         draft.nodeDataArray = narr;
  //         this.refreshNodeIndex(narr);
  //       }

  //       let larr = draft.linkDataArray;
  //       if (modifiedLinkData) {
  //         modifiedLinkData.forEach((ld: go.ObjectData) => {
  //           modifiedLinkMap.set(ld.key, ld);
  //           const idx = this.mapLinkKeyIdx.get(ld.key);
  //           if (idx !== undefined && idx >= 0) {
  //             larr[idx] = ld;
  //             if (draft.selectedData && draft.selectedData.key === ld.key) {
  //               draft.selectedData = ld;
  //             }
  //           }
  //         });
  //       }
  //       if (insertedLinkKeys) {
  //         insertedLinkKeys.forEach((key: go.Key) => {
  //           const ld = modifiedLinkMap.get(key);
  //           const idx = this.mapLinkKeyIdx.get(key);
  //           if (ld && idx === undefined) {
  //             this.mapLinkKeyIdx.set(ld.key, larr.length);
  //             larr.push(ld);
  //           }
  //         });
  //       }
  //       if (removedLinkKeys) {
  //         larr = larr.filter((ld: go.ObjectData) => {
  //           if (removedLinkKeys.includes(ld.key)) {
  //             return false;
  //           }
  //           return true;
  //         });
  //         draft.linkDataArray = larr;
  //         this.refreshLinkIndex(larr);
  //       }
  //       // handle model data changes, for now just replacing with the supplied object
  //       if (modifiedModelData) {
  //         draft.modelData = modifiedModelData;
  //         // console.log('256 GoJSApp modelData', draft.modelData);
  //       }
  //       draft.skipsDiagramUpdate = true;  // the GoJS model already knows about these updates
  //     })
  //   );
  // }

  /**
   * Handle inspector changes, and on input field blurs, update node/link data state.
   * @param path the path to the property being modified
   * @param value the new value of that property
   * @param isBlur whether the input event was a blur, indicating the edit is complete
   */
  public handleInputChange(path: string, value: string, isBlur: boolean) {
    this.setState(
      produce((draft: AppState) => {
        const data = draft.selectedData as go.ObjectData;  // only reached if selectedData isn't null
        data[path] = value;
        if (isBlur) {
          const key = data.key;
          if (key < 0) {  // negative keys are links
            const idx = this.mapLinkKeyIdx.get(key);
            if (idx !== undefined && idx >= 0) {
              draft.linkDataArray[idx] = data;
              draft.skipsDiagramUpdate = false;
            }
          } else {
            const idx = this.mapNodeKeyIdx.get(key);
            if (idx !== undefined && idx >= 0) {
              draft.nodeDataArray[idx] = data;
              draft.skipsDiagramUpdate = false;
            }
          }
        }
      })
    );
    // console.log('579 input: ', value);
  }

  /**
   * Handle changes to the checkbox on whether to allow relinking.
   * @param e a change event from the checkbox
   */
  public handleRelinkChange(e: any) {
    const target = e.target;
    const value = target.checked;
    this.setState({ modelData: { canRelink: value }, skipsDiagramUpdate: false });
    // console.log('257 relink: ', value);
  }

  public render() {
    // console.log('360 props', this.state.nodeDataArray);

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
    // console.log('638 GOJSApp this.state.nodeDataArray', this.state.nodeDataArray);
    // console.log('361 this.state.linkDataArray', this.state.linkDataArray);
    // console.log('362 this.state.myMetis', this.state.myMetis);
    // console.log('362 this.state.myGoModel', this.state.myGoModel);
    // console.log('558 this.context', this.context);
    // console.log('824 dispatch', this.props.dispatch);
    //console.log('825 dispatch', this.state.dispatch);
    this.state.myMetis.dispatch = this.state.dispatch;
    // console.log('827 dispatch', this.state.myMetis.dispatch);
    return (
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
        {inspector}
      </div>
    );
  }
}

export default GoJSApp;
