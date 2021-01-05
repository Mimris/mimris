// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;

import * as go from 'gojs';
import { produce } from 'immer';
import * as React from 'react';
import * as ReactModal from 'react-modal';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { DiagramWrapper } from './components/Diagram';
import { SelectionInspector } from './components/SelectionInspector';
import EditProperties  from '../forms/EditProperties'

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
  showModal: boolean;
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
      editedData: null,
      skipsDiagramUpdate: false,
      metis: this.props.metis,
      myMetis: this.props.myMetis,
      myGoModel: this.props.myGoModel,
      myGoMetamodel: this.props.myGoMetamodel,
      phFocus: this.props.phFocus,
      dispatch: this.props.dispatch,
      showModal: false
    };
    // init maps
    this.mapNodeKeyIdx = new Map<go.Key, number>();
    this.mapLinkKeyIdx = new Map<go.Key, number>();
    this.refreshNodeIndex(this.state.nodeDataArray); 
    this.refreshLinkIndex(this.state.linkDataArray); 
    // bind handler methods
    this.handleDiagramEvent = this.handleDiagramEvent.bind(this);
    this.handleModelChange = this.handleModelChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    //this.handleRelinkChange = this.handleRelinkChange.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleOpenModal = this.handleOpenModal.bind(this);
  }

  public handleInputChange (e) {
    // this.handleOpenModal()
    // if (e) {
      this.setState({editedData: e })
    // }
    console.log('88 GoJSApp', e, this.state.editedData);
    
  }

  public handleOpenModal () {
    this.setState({ showModal: true });
  }
  
  public handleCloseModal () {
    this.setState({ showModal: false });
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

  public handleInputChange(propname: string, value: string, obj: any, isBlur: boolean) {
    if (!debug) console.log('149 GoJSApp handleInputChange:', propname, value, isBlur, obj);
    if (debug) console.log('150 this.state', this.state);
    this.setState(
      produce((draft: AppState) => {
        const data = draft.selectedData as go.ObjectData;  // only reached if selectedData isn't null
        if (!debug) console.log('150 data', data);
          data[propname] = value;
        if (isBlur) {
          const key = data.key;
          if (obj.category === 'Relationship') {  // negative keys are links
            const idx = this.mapLinkKeyIdx.get(key);
            if (idx !== undefined) {
              draft.linkDataArray[idx] = data;
              draft.skipsDiagramUpdate = false;
            }
          } else if (obj.category === 'Object') {
            const idx = this.mapNodeKeyIdx.get(key);
            if (idx !== undefined) {
              draft.nodeDataArray[idx] = data;
              draft.skipsDiagramUpdate = false;
            }
          }
        }
      })
    );
    if (debug) console.log('173 this.state', this.state);
    const myMetis = this.state.myMetis;
    let inst, instview, myInst, myInstview;
    // Handle objects
    if (obj.category === 'Object') {
      inst = obj.object;
      myInst = myMetis.findObject(inst.id);
      instview = obj.objectview;
      myInstview = myMetis.findObjectView(instview.id);
      
      switch(propname) {
        case 'name':
          myInst.name = value;
          myInstview.name = value;
          break;
        case 'description':
          myInst.description = value;
          myInstview.description = value;
          break;
        default:
          // Handle properties
          if (!debug) console.log('218 myInst', myInst);
          const type = inst.type;
          const props = type.properties;
          for (let i=0; i<props?.length; i++) {
            const prop = props[i];
            myInst.getStringValue2(prop.name)
          }
          break;
      }
      if (!debug) console.log('227 myMetis', myMetis);
      // Prepare and to dispatch of objectview
      const modifiedObjectViews = new Array();
      const gqlObjview = new gql.gqlObjectView(myInstview);
      modifiedObjectViews.push(gqlObjview);
      modifiedObjectViews.map(mn => {
        let data = mn;
        this.props.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
      })
      // Prepare and to dispatch of object
      const modifiedObjects = new Array();
      const gqlObj = new gql.gqlObject(myInst);
      modifiedObjects.push(gqlObj);
      modifiedObjects.map(mn => {
        let data = mn;
        this.props.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
      });
      if (debug) console.log('236 modifiedObjects', modifiedObjectViews, modifiedObjects);
    }

    if (obj.category === 'Relationship') {
        inst = obj.relship;
        myInst = myMetis.findRelationship(inst.id);
        instview = obj.relshipview;
        myInstview = myMetis.findRelationshipView(instview.id);    
      switch(propname) {
        case 'name':
          myInst.name = value;
          myInstview.name = value;
          break;
        case 'description':
          myInst.description = value;
          break;
        default:
          // Handle properties
          break;
      }
      // Prepare and to dispatch of objectview
      const modifiedRelshipViews = new Array();
      const gqlRelview = new gql.gqlRelshipView(myInstview);
      modifiedRelshipViews.push(gqlRelview);
      modifiedRelshipViews.map(mn => {
        let data = mn;
        this.props.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
      })
      // Prepare and to dispatch of object
      const modifiedRelships = new Array();
      const gqlRel = new gql.gqlRelationship(myInst);
      modifiedRelships.push(gqlRel);
      modifiedRelships.map(mn => {
        let data = mn;
        this.props.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
      })
    }
  }

    // see gojs-react-basic for an example model change handler
    // when setting state, be sure to set skipsDiagramUpdate: true since GoJS already has this update

  /**
   * Handle any relevant DiagramEvents, in this case just selection changes.
   * On ChangedSelection, find the corresponding data and set the selectedData state.
   * @param e a GoJS DiagramEvent
   */
  public handleDiagramEvent(e: go.DiagramEvent) {
    this.state.selectedData = e.subject?.part?.data;
    const dispatch = this.state.dispatch;
    const name = e.name;
    const myDiagram = e.diagram;
    const myMetis = this.state.myMetis;
    if (debug) console.log('139 handleDiagramEvent', myMetis);
    const myModel = myMetis?.findModel(this.state.phFocus.focusModel.id);
    const myModelview = myMetis?.findModelView(this.state.phFocus.focusModelview.id);
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
      const objtype = node.objtype;
      if (objtype.abstract) continue;
      if (objtype.deleted)  continue;
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
    if (debug) console.log('195 handleDiagramEvent - context', name, this.state, context);
    if (debug) console.log('196 handleEvent', myMetis);

    switch (name) {

      case 'TextEdited': {
        const sel = e.subject.part;
        const data = sel.data;
        const field = e.subject.name;
        if (debug) console.log('204 data', data);
        if (sel) {
          if (sel instanceof go.Node) {
            const key = data.key;
            let text  = data.name;
            const typename = data.type;
            // if (debug) console.log('209 typename', typename);
            if (typename === 'Object type') {
              if (text === 'Edit name') {
                text = prompt('Enter name');
              }
              const myNode = this.getNode(context.myGoMetamodel, key);
              if (myNode) {
                data.name = text;
                myNode.name = text;
                uic.updateObjectType(myNode, field, text, context);
                data.name = myNode.name;
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
                data.name = text;
              }
              const myNode = this.getNode(context.myGoModel, key);
              if (myNode) {
                myNode.name = text;
                uic.updateObject(myNode, field, text, context);
                data.name = myNode.name;
                const gqlObjview = new gql.gqlObjectView(myNode.objectview);
                modifiedNodes.push(gqlObjview);
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
          if (sel instanceof go.Link) {
            // relationship
            const key = data.key;
            let text = data.name;
            let typename = data.type;
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
            } else {
              const myLink = this.getLink(context.myGoModel, key);
              if (myLink) {
                if (text === 'Edit name') {
                  text = prompt('Enter name');
                  data.name = text;
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
          if (debug) console.log('333 typename', typename, data);
          if (typename === "Object type") {
              const objtype = context.myMetis.findObjectType(data.objtype.id);
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
            const node = uic.changeNodeSizeAndPos(data, myGoModel, modifiedNodes);
            if (debug) console.log('361 node', node);
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
      //case "SelectionDeleted": {
        const deletedFlag = true;
        const selection = e.subject;
         if (debug) console.log('378 selection', selection);
        for (let it = selection.iterator; it.next();) {
          const sel  = it.value;
          const data = sel.data;
          if (debug) console.log('382 sel, data', sel, data);
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
          if (typename === 'Relationship type' || 'i' ) {
            // if (debug) console.log('350 myMetamodel', context.myMetamodel);  
            const reltype = context.myMetis.findRelationshipType(data.reltype?.id);
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
          if (data.category === 'Object') {
            const myNode = this.getNode(context.myGoModel, key);
            if (myNode) {
               if (debug) console.log('440 delete node', data, myNode);
              uic.deleteNode(myNode, deletedFlag, modifiedNodes, modifiedObjects, modifiedLinks, modifiedRelships, modifiedTypeViews, context);
              if (debug) console.log('390 modifiedNodes', modifiedNodes);
              if (debug) console.log('391 modifiedObjects', modifiedObjects);
              if (debug) console.log('392 modifiedTypeViews', modifiedTypeViews);
              if (debug) console.log('393 modifiedLinks', modifiedLinks);
              if (debug) console.log('394 modifiedRelships', modifiedRelships);
              if (debug) console.log('447 myGoModel', context.myGoModel);
            }
          }
          if (data.category === 'Relationship') {
            const myLink = this.getLink(context.myGoModel, key);
            if (debug) console.log('396 SelectionDeleted', myLink);
            uic.deleteLink(data, deletedFlag, modifiedLinks, modifiedRelships, context);
            const relview = data.relshipview;
            if (relview) {
              relview.deleted = deletedFlag;
              relview.relship = myMetis.findRelationship(relview.relship.id);
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
      }
        break;
      case 'ExternalObjectsDropped': {
        e.subject.each(function(node) {
          const part = node.data;
          if (debug) console.log('511 part', part);
            if (debug) console.log('512 myMetis', myMetis);
            if (debug) console.log('513 myGoModel', myGoModel, myGoMetamodel);
            if (part.type === 'objecttype') {
              const otype = uic.createObjectType(part, context);
              // if (debug) console.log('429 ExternalObjectsDropped - myMetis', myMetis);
              if (otype) {
                otype.typename = constants.types.OBJECTTYPE_NAME;
                // if (debug) console.log('431 ExternalObjectsDropped', otype);
                const gqlObjtype = new gql.gqlObjectType(otype, true);
                if (debug) console.log('434 modifiedTypeNodes', gqlObjtype);
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
              part.category = 'Object';
              if (debug) console.log('537 myModel', myModel);
              if (part.parentModel == null)
                myMetis.pasteViewsOnly = true;
              if (part.isGroup) {
                part.size = "300 200";    // Hack
                if (debug) console.log('542 part', part);
              }
              const objview = uic.createObject(part, context);
              if (debug) console.log('545 New object', part, objview);
              if (objview) {
                const gqlObjview = new gql.gqlObjectView(objview);
                modifiedNodes.push(gqlObjview);
                if (debug) console.log('557 New object', gqlObjview, modifiedNodes);
                const gqlObj = new gql.gqlObject(objview.object);
                modifiedObjects.push(gqlObj);
                if (debug) console.log('560 New object', gqlObj);
              }
            }
            if (debug) console.log('563 myGoModel', myGoModel);
        })
        myDiagram.requestUpdate();
      }
      break;
      case "ObjectDoubleClicked": {
        let sel = e.subject.part;
        let data = sel.data;
        this.state.selectedData = sel.data
        this.handleOpenModal()

        if (!debug) console.log('554 ObjectDoubleClicked', sel.data, data, this.state.editedData);
        if (this.state.editedData) {
          data = this.state.editedData
        }
        if (!debug) console.log('558 ObjectDoubleClicked', sel.data, data, this.state.editedData);

        if (sel) {
          if (sel instanceof go.Node) {
            const key = data.key;
            let text  = data.name;
            const field = e.subject.name;
            const typename = data.type;
            if (!debug) console.log('559 GoJSApp', data, text);
            if (typename === 'Object type') {
              // if (text === 'Edit name') {
              //   text = prompt('Enter name');
              // }
              // const myNode = this.getNode(context.myGoMetamodel, key);
              // if (myNode) {
              //   data.name = text;
              //   myNode.name = text;
              //   uic.updateObjectType(myNode, field, text, context);
              //   data.name = myNode.name;
              //   // if (debug) console.log('218 TextEdited', myNode);
              //   if (myNode.objtype) {
              //     const gqlObjType = new gql.gqlObjectType(myNode.objtype, true);
              //     modifiedTypeNodes.push(gqlObjType);
              //     // if (debug) console.log('222 TextEdited', gqlObjType);
              //   }
              // }
            } else // Object
            {
              // if (text === 'Edit name') {
                //   text = prompt('Enter name');
                //   data.name = text;
                // }
                // data = this.selectedData
                const myNode = this.getNode(context.myGoModel, key);
                if (myNode) {
                  myNode.name = text;
                  uic.updateObject(myNode, field, text, context);
                  data.name = myNode.name;
                  if (!debug) console.log('588 GoJSApp text', text, data.name);
                const gqlObjview = new gql.gqlObjectView(myNode.objectview);
                modifiedNodes.push(gqlObjview);
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
          if (sel instanceof go.Link) {
            // relationship
            const key = data.key;
            let text = data.name;
            let typename = data.type;
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
            } else {
              const myLink = this.getLink(context.myGoModel, key);
              if (myLink) {
                if (text === 'Edit name') {
                  text = prompt('Enter name');
                  data.name = text;
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
      case "ObjectSingleClicked": {
        let sel = e.subject.part;
        this.state.selectedData = sel.data
        if (!debug) console.log('498 GoJSApp :', sel, sel.data.name, sel.data.description);
        if (sel) {
          if (sel instanceof go.Node) {
            const key = sel.data.key;
            let text = sel.data.name;
            const typename = sel.data.type;
            if (debug) console.log('560 typename, text', typename, text);
            if (typename === 'Object type') {
              const myNode = this.getNode(context.myGoMetamodel, key);
              // if (debug) console.log('449 GoJSApp', myNode.objtype);  
              if (myNode && myNode.objtype) {
                const gqlNode = new gql.gqlObjectType(myNode.objtype, true);
                selectedObjectTypes.push(gqlNode);
                // if (debug) console.log('453 GoJSApp', selectedObjectTypes);
                } 
            } else { // object
              let objview = sel.data.objectview;
              objview = myMetis.findObjectView(objview?.id);
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
      }
      break;
      case "PartResized": {
        const part = e.subject.part;
        const data = e.subject.part.data;
         if (debug) console.log('579 PartResized', part, data);
        uic.changeNodeSizeAndPos(data, myGoModel, modifiedNodes);
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
        if (debug) console.log('657 link', link.fromNode.key, link.toNode.key);
        const data = link.data;
         if (debug) console.log('659 link, data', link, data);
        const fromNode = link.fromNode;
        const toNode = link.toNode;
        if (debug) console.log('668 LinkDrawn', fromNode, toNode, data);
        // Handle relationship types
        if (fromNode?.data?.category === 'Object type') {
          if (debug) console.log('685 link', fromNode, data);
          link.category = 'Relationship type';
          link.class = 'goRelshipTypeLink';
          const reltype = uic.createRelationshipType(fromNode.data, toNode.data, data, context);
          if (reltype) {
            if (debug) console.log('678 reltype', reltype);
            const gqlType = new gql.gqlRelationshipType(reltype, true);
            modifiedTypeLinks.push(gqlType);
            if (debug) console.log('681 gqlType', gqlType);
            const reltypeview = reltype.typeview;
            if (reltypeview) {
              const gqlTypeView = new gql.gqlRelshipTypeView(reltypeview);
              modifiedLinkTypeViews.push(gqlTypeView);
              if (debug) console.log('686 gqlTypeView', gqlTypeView);
            }
          }
        }
        // Handle relationships
        if (fromNode?.category === 'Object') {
           if (debug) console.log('670 LinkDrawn', fromNode.data.category);
          const relview = uic.createRelationship(data, context);
          if (relview) {
            const myLink = new gjs.goRelshipLink(data.key, myGoModel, relview);
            myLink.fromNode = fromNode;
            myLink.toNode = toNode;
            if (debug) console.log('675 relview', relview, myLink);
            relview.relship = myMetis.findRelationship(relview.relship.id);
            const gqlRelview = new gql.gqlRelshipView(relview);
            if (debug) console.log('678 LinkDrawn', link, gqlRelview);
            modifiedLinks.push(gqlRelview);
            const gqlRelship = new gql.gqlRelationship(relview.relship);
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
        if (debug) console.log('713 LinkRelinked', link, fromNode, toNode);
        const newLink = e.subject.data;
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
      case "BackgroundDoubleClicked": {
         if (debug) console.log('728 BackgroundDoubleClicked', e, e.diagram);
      }
      break;
      default:
        // if (debug) console.log('732 GoJSApp event name: ', name);
        break;
      }
        
        // this.props.dispatch({ type: 'SET_GOJS_MODEL', gojsModel })
        // if (debug) console.log('684 gojsMetamodel', gojsMetamodel);
        // this.props.dispatch({ type: 'SET_GOJS_METAMODEL', gojsMetamodel })
        
        // if (debug) console.log('577 modifiedNodes', modifiedNodes);
    modifiedNodes.map(mn => {
      let data = mn
      if (!debug) console.log('988 BackgroundDoubleClicked', data);
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
    
    // const [modal, setModal] = useState(false);
    // this.state.modal = (modal) ? !modal : modal
    // const toggle = () => this.handleCloseModal();

    const selectedData = this.state.selectedData;
    if (!debug) console.log('1072 selectedData', this.state.selectedData, this.props);
    let inspector;
    if (selectedData !== null) {
      inspector = 
        <div className="p-2" style={{backgroundColor: "#ddd"}}>
          <p>Selected Object Properties:</p>
          <SelectionInspector 
            myMetis={this.state.myMetis}
            selectedData={this.state.selectedData}
            onInputChange={this.handleInputChange}
          />;
        </div>
    }

    let editProperties; 
    if (selectedData !== null) {
      editProperties =
        <>
          <EditProperties 
            item={selectedData} 
            curobj={selectedData} 
            type={'UPDATE_OBJECTVIEW_PROPERTIES'} 
            selectedData={this.state.selectedData}
            onInputChange={this.handleInputChange}
          />
        </>
    }

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
          // onInputChange     ={this.handleInputChange}
          myMetis           ={this.state.myMetis}
          myGoModel         ={this.state.myGoModel}
          myGoMetamodel     ={this.state.myGoMetamodel}
          dispatch          ={this.state.dispatch}
          // handleOpenModal   ={this.handleOpenModal}
        />
        {inspector}
        <>
          <Modal className="modal__edit p-1 bg-light" isOpen={this.state.showModal} style={{ marginTop: "96px", fontSize: "90%"}} >
            {/* <Modal isOpen={modal} toggle={toggle} className={className} style={{ marginTop: "96px", fontSize: "90%"}} > */}
            <div className="bg-light">
              <Button className="btn-sm bg-light float-right ml-5" color="link" size="sm"
                onClick={() => { this.handleCloseModal() }} ><span>x</span>
              </Button>
              <ModalHeader className="bg-light" style={{width: "70%"}}>
                <span className="text-secondary">Edit attributes :</span> 
                <span className="name pl-2" style={{minWidth: "50%"}} >{this.state.selectedData?.name} </span>
              </ModalHeader>
            </div>
            <ModalBody >
              {/* {editProperties} */}
              {inspector}
            </ModalBody>
            <ModalFooter>
              <Button className="modal-footer m-0 p-0" color="link" onClick={() => { this.handleCloseModal() }}>Done</Button>
            </ModalFooter>
          </Modal>
 
        </>
      </div>
      
    );
  }
}

export default GoJSApp;

        {/* <label>
          Allow Relinking?
          <input
            type='checkbox'
            id='relink'
            checked={this.state.modelData.canRelink}
            onChange={this.handleRelinkChange} />
        </label> */}
        {/* {inspector} */}
        {/* <ReactModal className="bg-dark m-5 p-1 w-50 flex"
          isOpen={this.state.showModal}
          // areaHideApp={false}
          contentLabel="onRequestClose Example"
          onRequestClose={this.handleCloseModal}
          style={{ overlay: { zIndex: 100 } }}
          >
            <div className="bg-light p-2">
              <button className="btn-sm float-right" onClick={this.handleCloseModal}>Close Modal</button>
              <p className="">Edit Object View</p>

              {inspector}
            </div>
        </ReactModal> */}
