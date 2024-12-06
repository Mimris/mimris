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
import { read } from 'fs';

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
    if (debug) console.log('62 GoJSApp', this.props.nodeDataArray, this.props);
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
      phFocus: this.props.phFocus,
      dispatch: this.props.dispatch,
      modelType: this.props.phFocus.focusTab,
      showModal: false,
      modalContext: null,
      selectedOption: null,
      diagramStyle: this.props.diagramStyle,
      onExportSvgReady: this.props.onExportSvgReady
    };
    if (debug) console.log('76 this.state: ', this.state.myMetis, this.state.nodeDataArray);
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
    if (debug) console.log('94 handleSelectDropdownChange', this.state.myMetis);
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
    const modalContext = this.state.modalContext;
    if (!modalContext) return;
    const myDiagram = modalContext.context?.myDiagram;
    const gjsLink = modalContext.context?.link;
    const data = modalContext.data;
    if (e === 'x') {
      myDiagram.remove(gjsLink);
      this.setState({ showModal: false, selectedData: null, modalContext: null });
      return;
    }
    const props = this.props;
    let typename = modalContext.selected?.value;
    if (!typename) typename = modalContext.typename;
    if (debug) console.log('113 typename: ', typename);
    if (debug) console.log('122 modalContext', modalContext);
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

  public addToNode(myToNodes: any, n: any) {
    const myToNode = {
      "key": n.data.key,
      "name": n.data.name,
      "loc": new String(n.data.loc),
      "scale": new String(n.scale),
      "size": new String(n.data.size),
      "template": n.data.template,
      "figure": n.data.figure,
      "geometry": n.data.geometry,
      "fillcolor": n.data.fillcolor,
      "fillcolor2": n.data.fillcolor2,
      "strokecolor": n.data.strokecolor,
      "strokecolor2": n.data.strokecolor2,
      "textcolor": n.data.textcolor,
      "strokewidth": n.data.strokewidth,
      "textscale": n.data.textscale,
      "icon": n.data.icon,
    }
    myToNodes.push(myToNode);
    if (n.data.isGroup) {
      for (let it2 = n.memberParts.iterator; it2?.next();) {
        let n2 = it2.value;
        if (!(n2 instanceof go.Node)) continue;
        if (n2) {
          this.addToNode(myToNodes, n2);
        }
      }
    }
  }

  private getNode(goModel: gjs.goModel, key: string): gjs.goObjectNode {
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

  private isSourceNode(mySourceNodes: any, key: string,) {
    let retval = false;
    for (let j = 0; j < mySourceNodes.length; j++) {
      const node = mySourceNodes[j];
      let myKey = key;
      if (node.key === myKey) {
        retval = true;
        break;
      }
    }
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
    const myModel = myMetis?.findModel(this.state.phFocus?.focusModel?.id);
    let myModelview = myMetis?.findModelView(this.state.phFocus?.focusModelview?.id);
    if (!myModelview) myModelview = myMetis?.currentModelview;
    const myMetamodel = myModel?.getMetamodel();
    let myGoModel: gjs.goModel = this.state.myMetis.gojsModel;
    const nodes = new Array();
    let modifiedObjectTypes = new Array();
    let modifiedObjectTypeViews = new Array();
    let modifiedObjectTypeGeos = new Array();
    let modifiedRelshipTypes = new Array();
    let modifiedRelshipTypeViews = new Array();
    let modifiedObjects = new Array();
    let modifiedRelships = new Array();
    let modifiedObjectViews = new Array();
    let modifiedRelshipViews = new Array();
    let modifiedMetamodels = new Array();
    let done = false;
    let pasted = false;

    const context = {
      "myMetis": myMetis,
      "myMetamodel": myMetamodel,
      "myModel": myModel,
      "myModelview": myModelview,
      "myGoModel": myMetis.gojsModel,
      // "myGoMetamodel": myGoMetamodel,
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
      "modifiedModelviews": [],
    }
    if (debug) console.log('265 handleDiagramEvent - context', name, this.state, context);
    if (debug) console.log('266 handleEvent', myMetis);
    if (debug) console.log('267 this', this);
    if (debug) console.log('268 event name', name);

    switch (name) {
      case "InitialLayoutCompleted": {
          if (debug) console.log("Begin: After Reload:");
        let objviews = myModelview.objectviews;
        myModelview.objectviews = utils.removeArrayDuplicates(objviews);
        objviews = myModelview.objectviews;
        const focusObjectView  = myMetis.currentModelview.focusObjectview;
        if (true) {
        for (let i = 0; i < objviews?.length; i++) {
          let resetToTypeview = true;
          const objview = objviews[i];
          const obj = objview.object;
          if (!obj) continue;
          let type = obj.type;
          if (!type) {
            type = myMetamodel.findObjectTypeByName(obj.typeName);
            obj.type = type;
            resetToTypeview = true;
          }
          const goNode = myGoModel?.findNodeByViewId(objview.id);
          if (goNode) {
            for (let it = myDiagram.nodes; it?.next();) {
              const n = it.value;
              const data = n.data;
              if (data.key === goNode.key) {
                data.scale = goNode.scale;
                if (debug) console.log('300 objview, goNode, node: ', objview, goNode, n, data);
                data.textcolor = 'black';
              }
            }
            const gjsNode = myDiagram.findNodeForKey(goNode?.key)
            if (gjsNode) gjsNode.scale = goNode.scale;
          }
          if (objview.id === focusObjectView?.id) {
            const node = myGoModel.findNodeByViewId(objview.id);
            if (node) {
              const gjsNode = myDiagram.findNodeForKey(node?.key)
              myDiagram.select(gjsNode);
            }
          }
        }
        }

        const links = myDiagram.links;
        if (debug) console.log("End: After Reload:");
        if (true) {
          const modelview = myMetis.currentModelview;
          const objviews = modelview.objectviews;
          const nodes = myDiagram.nodes;
          // Fix nodes (scale, loc and size, ++)
          const modifiedObjViews = new Array();
          for (let it = nodes.iterator; it?.next();) {
            const node = it.value;
            const data = node.data;
            if (data.category === "Object type")
              continue;
            node.scale = data.scale;
            node.loc = data.loc;
            node.size = data.size;
            node.fillcolor = data.fillcolor;
            node.strokecolor = data.strokecolor;
            const object = data.object;
            let objview = data.objectview;
            // objview = uic.setObjviewColors(data, myDiagram);          
            const image = object?.image ? object.image : objview?.image;
            if (image) {
              myDiagram.model.setDataProperty(data, "image", image);
            }
            const jsnObjview = new jsn.jsnObjectView(objview);
            modifiedObjViews.push(jsnObjview);
          }
          // Fix links 
          const links = myDiagram.links;
          for (let it = links.iterator; it?.next();) {
            const link = it.value;
            const data = link.data;
            if (data.category === "Relationship") {
              let relview: akm.cxRelationshipView = data.relshipview;
              relview = myModelview.findRelationshipView(data.key);
              relview.markedAsDeleted = data.markedAsDeleted;
              if (relview.visible === false) {
                myDiagram.remove(link);
              } else {
                const points = relview.points;
                if (points?.length == 0 || points?.length == 4) {
                  link.points = [];
                  relview.points = [];
                  const jsnRelview = new jsn.jsnRelshipView(relview);
                  modifiedRelshipViews.push(jsnRelview);
                }
              }
            }
          }
        }
        break;
      }
      case 'TextEdited': {
        const sel = e.subject.part;
        const gjsData = sel.data;
        const textvalue = gjsData.name;
        let field = e.subject.name;
        if (field === "") field = "name";
        // Object type or Object
        if (sel instanceof go.Node) {
          const key: string = gjsData.key;
          const goNode = myGoModel.findNode(key);
          let text: string = gjsData.name;
          const category: string = gjsData.category;
          // Object type
          if (category === constants.gojs.C_OBJECTTYPE) {
            if (text === 'Edit name') {
              text = prompt('Enter name');
            }
            if (gjsData) {
              gjsData.name = text;
              uic.updateObjectType(gjsData, field, text, context);
              const objtype = myMetis.findObjectType(gjsData.objecttype?.id);
              if (objtype) {
                let data = { id: objtype.id, name: text };
                myDiagram.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data });
              }
            }
          } else { // Object           
            if (text === 'Edit name') {
              text = prompt('Enter name');
              gjsData.name = text;
            }
            const objview = myModelview.findObjectView(key);
            if (objview) {
              let obj = objview.object;
              if (obj) {
                goNode.objRef = obj.id;
                goNode.text = textvalue;
                goNode.name = text;
                obj = uic.updateObject(goNode, field, text, context);
                if (obj) {
                  obj.name = text;
                  obj.text = textvalue;
                  const objviews = obj.objectviews;
                  for (let i = 0; i < objviews.length; i++) {
                    const objview = objviews[i];
                    objview.name = text;
                    objview.text = textvalue;
                    let node = myGoModel.findNodeByViewId(objview?.id);
                    if (node) {
                      const gjsNodeData = myDiagram.findNodeForKey(node.key);
                      gjsNodeData.name = text;
                      const jsnObjview = new jsn.jsnObjectView(objview);
                      jsnObjview.name = text;
                      jsnObjview.text = text;
                      modifiedObjectViews.push(jsnObjview);
                      let data = JSON.parse(JSON.stringify(jsnObjview));
                      context.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
                    }
                  }
                }
                if (obj) {
                  const jsnObj = new jsn.jsnObject(obj);
                  jsnObj.text = textvalue;
                  modifiedObjects.push(jsnObj);
                  let data = JSON.parse(JSON.stringify(jsnObj));
                  context.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
                }
              }
            }
          }
          const goNodes = myGoModel?.nodes;
          for (let i = 0; i < goNodes?.length; i++) {
            const goNode = goNodes[i];
            if (goNode.key === gjsData.key) {
              goNode.name = gjsData.name;
              break;
            }
          }
        }
        // Relationship or Relationship type
        if (sel instanceof go.Link) {
          let key = gjsData.key;
          let text = gjsData.nameFrom ? gjsData.nameFrom : gjsData.name;
          let typename = gjsData.typename;
          // Relationship type
          if (typename === constants.gojs.C_RELSHIPTYPE) {
            const myLink = this.getLink(context.myGoMetamodel, key);
            if (myLink) {
              if (text === 'Edit name') {
                text = prompt('Enter name');
                typename = text;
                gjsData.name = text;
              }
              uic.updateRelationshipType(myLink, "name", text, context);
              gjsData.name = myLink.name;
              if (myLink.reltype) {
                const jsnReltype = new jsn.jsnRelationshipType(myLink.reltype, true);
                modifiedRelshipTypes.push(jsnReltype);
              }
              myDiagram.model?.setDataProperty(myLink.data, "name", myLink.name);
            }
          }
          else { // Relationship
            let relview = gjsData.relshipview;
            if (!relview) {
              relview = myModelview.findRelationshipView(key);
            }
            if (relview) {
              if (text === 'Edit name') {
                text = prompt('Enter name');
                gjsData.name = text;
              }
              let rel = relview.relship as akm.cxRelationship;
              if (rel) {
                rel = myModel.findRelationship(rel.id);
                if (rel) rel.name = text;
                // rel.name = rel.type.name;
                const draftProp = constants.props.DRAFT;
                rel.setStringValue2(draftProp, text);
                const relviews = rel.relshipviews;
                for (let i = 0; i < relviews?.length; i++) {
                  const relview = relviews[i];
                  relview.name = text;
                  if (text === 'Is') {
                    rel.relshipkind = 'Generalization';
                    relview.toArrow = 'Triangle';
                    gjsData.toArrow = 'Triangle';
                    // This doesn't work:
                    let link = myDiagram.findLinkForKey(gjsData.key);
                    myDiagram.model.setDataProperty(link.data, 'toArrow', gjsData.toArrow);
                  }
                  const jsnRelview = new jsn.jsnRelshipView(relview);
                  modifiedRelshipViews.push(jsnRelview);
                  const jsnRel = new jsn.jsnRelationship(rel);
                  modifiedRelships.push(jsnRel);
                  // Dispatches

      // const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
      // let data = { metis: jsnMetis }
      // data = JSON.parse(JSON.stringify(data));
      // myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data });

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
        let myGoModel = context.myGoModel;
        const myModelview = context.myModelview;
        let relshipviews = myModelview.relshipviews;
        myModelview.relshipviews = utils.removeArrayDuplicates(relshipviews);
        // First remember the original locs and scales
        const dragTool = myDiagram.toolManager.draggingTool;
        const myParts = dragTool.draggedParts;
        const myFromNodes = [];
        for (let it = myParts.iterator; it?.next();) {
          let n = it.value;
          let loc = it.value.point.x + " " + it.value.point.y;
          if (!(it.key.data.category === 'Object'))
            continue;
          let objectview = myModelview.findObjectView(it.key.data.key);
          if (!objectview)
            continue;
          myModelview.repairObjectView(objectview);
          let object = objectview.object;
          object = myModel.findObject(object?.id);
          let scale = objectview.scale;
          if (!scale) scale = "1";
          let groupKey = "";
          if (it.key.data.group)
            groupKey = it.key.data.group;
          const myFromNode = {
            "key": it.key.data.key,
            "name": it.key.data.name,
            "group": groupKey,
            "isGroup": it.key.data.isGroup,
            "loc": objectview.loc,
            "size": objectview.size,
            "scale": objectview.scale,
            "object": object,
            "objectview": objectview,
          }
          myFromNodes.push(myFromNode);
        }
        // Then remember the new locs
        const myToNodes = [];
        const selection = e.subject;
        for (let it = selection.iterator; it?.next();) {
          let n = it.value;
          if (n instanceof go.Link) continue;
          const loc = n.data.loc;
          const goNode = myGoModel.findNode(n.data.key);
          if (!goNode) continue;
          goNode.loc = loc;
          const size = n.actualBounds.width + " " + n.actualBounds.height;
          const group = uic.getGroupByLocation(myGoModel, loc, size, goNode);
          let groupKey = "";
          if (!group) {
            goNode.scale = "1"; // goNode.getMyScale(myGoModel);
          } else {
            groupKey = n.data.group;
            goNode.scale = goNode.getMyScale(myGoModel);
          }
          const myToNode = {
            "n": n,
            "gjsData": n.data,
            "key": n.data.key,
            "name": n.data.name,
            "group": groupKey,
            "isGroup": n.data.isGroup,
            "loc": goNode.loc,
            "size": size,
            "scale": goNode.scale,
            "object": n.data.object,
            "objectview": n.data.objectview,
            "objecttype": n.data.objecttype,
            "typeview": n.data.typeview,
          }
          myToNodes.push(myToNode);
          myDiagram.model.setDataProperty(n.data, 'group', groupKey);
        }
        // Walk through the from nodes and find the corresponding to nodes
        for (let i = 0; i < myFromNodes.length; i++) {
          const myFromNode = myFromNodes[i];
          for (let j = 0; j < myToNodes.length; j++) {
            const myToNode = myToNodes[j];
            if (myFromNode.key === myToNode.key) {
              const myGoNode = myGoModel.findNode(myToNode.key);
              const myObject: akm.cxObject = myFromNode.object;
              const myObjectview: akm.cxObjectView = myFromNode.objectview;
              myObjectview.loc = myToNode.loc;
              myObjectview.group = myToNode.group;
              myObjectview.scale = myToNode.scale;
              // Move the object
              let goToNode = uic.changeNodeSizeAndPos(myToNode.gjsData, myFromNode.loc, myToNode.loc, 
                                                      myGoModel, myDiagram, myMetis, modifiedObjectViews) as gjs.goObjectNode;
              if (goToNode) {
                goToNode = myGoModel.findNode(goToNode.key);
                if (!goToNode instanceof gjs.goObjectNode) {
                  myGoModel = myGoModel.fixGoModel();
                }
                goToNode.loc = myToNode.loc.valueOf();
                goToNode.size = myToNode.size;
                goToNode.scale = myToNode.scale;
              }
              // Check if the MOVED node (goToNode) is member of a group
              const goParentGroup = uic.getGroupByLocation(myGoModel, goToNode.loc, goToNode.size, goToNode);
              let parentObjview = goParentGroup?.objectview; // The container objectview
              if (!parentObjview) {
                parentObjview = myModelview.findObjectView(goParentGroup?.objviewRef);
              }
              if (goParentGroup && parentObjview) { // the container (group)
                // goToNode IS member of a group
                // First handle the object (node)
                const gjsPart = myToNode.gjsData; // The object (node) to be moved
                goToNode.group = goParentGroup.key; // Make the node a member of the group (container)
                myObjectview.group = goParentGroup.key;
                myDiagram.model.setDataProperty(gjsPart, "group", goToNode.group);
                goToNode.scale = new String(goToNode.getMyScale(myGoModel));
                gjsPart.scale = Number(goToNode.scale);
                myObjectview.scale = gjsPart.scale;
                myDiagram.model.setDataProperty(myToNode.n, "scale", gjsPart.scale);
                myObjectview.loc = myToNode.loc;
                myDiagram.model.setDataProperty(myToNode.n, "loc", myToNode.loc);
                //
                // const objvIdName = { id: goToNode.key, name: goToNode.name };
                // const objIdName = { id: goToNode.object.id, name: goToNode.object.name };
                // myDiagram.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: objvIdName });
                // myDiagram.dispatch({ type: 'SET_FOCUS_OBJECT', data: objIdName });
    
                // Check if the moved node (goToNode) has a relationship from a group
                // If so, relocate the node to its new parent group (from myObjectview to parentObjview)
                let inoutRelviews = new Array();
                let inputRelviews = myObjectview?.inputrelviews;
                if (inputRelviews?.length > 0) {
                  myObjectview.purgeInputRelviews();
                  inputRelviews = myObjectview.inputrelviews;
                }
                for (let i = 0; i < inputRelviews?.length; i++) {
                  const relview = inputRelviews[i];
                  if (relview) {
                    let fromObjview = relview.fromObjview; 
                    // Handle the relationship from group to its member
                    if (fromObjview?.isGroup) {
                      // Relocate
                      const relship = relview.relship;
                      const oldFromObj = relship.fromObject;
                      const newFromObj = parentObjview?.object;
                      const oldToObj = relship.toObject;
                      const newToObj = goToNode.object;
                      if (parentObjview && oldFromObj?.id !== newFromObj?.id) {
                          relship.relocate(oldFromObj, newFromObj, oldToObj, newToObj);
                          relview.relocate(fromObjview, parentObjview);
                      }
                      const reltype = relship.type;
                      if (reltype.name === constants.types.AKM_HAS_MEMBER 
                          || reltype.name === constants.types.AKM_HAS_PART) {
                        relview.markedAsDeleted = true;
                        const lnk = myDiagram.findLinkForKey(relview.id);
                        if (lnk) {
                            myDiagram.remove(lnk);
                        }                        
                      }
                      inoutRelviews.push(relview);
                      // Prepare dispatch
                      const jsnRelship = new jsn.jsnRelationship(relview.relship);
                      uic.addItemToList(modifiedRelships, jsnRelship);
                      const jsnRelshipview = new jsn.jsnRelshipView(relview);
                      if (jsnRelshipview) {
                        uic.addItemToList(modifiedRelshipViews, jsnRelshipview);
                      }
                    }
                  }
                }
                let outputRelviews = myObjectview?.outputrelviews;
                if (outputRelviews?.length > 0) {
                  myObjectview.purgeOutputRelviews();
                  outputRelviews = myObjectview.outputrelviews;
                }                
                for (let i = 0; i < outputRelviews?.length; i++) {
                  const relview = outputRelviews[i];
                  if (relview) {
                    let toObjview = relview.toObjview; 
                    // Handle the relationship from group to its member
                    if (toObjview?.isGroup) {
                      // Relocate
                      const relship = relview.relship;
                      const oldFromObj = relship.fromObject;
                      const newFromObj = parentObjview?.object;
                      const oldToObj = relship.toObject;
                      const newToObj = goToNode.object;
                      if (parentObjview && oldFromObj?.id !== newFromObj?.id) {
                        relship.relocate(oldFromObj, newFromObj, oldToObj, newToObj);
                        relview.relocate(toObjview, parentObjview);
                        relview.markedAsDeleted = true;
                      }
                    }
                    inoutRelviews.push(relview);
                    const lnk = myDiagram.findLinkForKey(relview.id);
                    if (lnk) {
                      if (relview.markedAsDeleted)
                        myDiagram.remove(lnk);
                    }
                  }

                  const linkDataArray = myDiagram.model.linkDataArray;
                  for (let i = 0; i < linkDataArray.length; i++) {
                    const linkData = linkDataArray[i];
                    if (linkData.key === relview.id) {
                      break;
                    }
                  }
                  
                  const jsnRelship = new jsn.jsnRelationship(relview.relship);
                  uic.addItemToList(modifiedRelships, jsnRelship);
                  const jsnRelview = new jsn.jsnRelshipView(relview);
                  uic.addItemToList(modifiedRelshipViews, jsnRelview);
                  
                }                
              } else {
                // goToNode is NOT member of a group
                goToNode.group = "";
                const gjsPart = myToNode.gjsData;
                myDiagram.model.setDataProperty(gjsPart, "group", goToNode.group);
                let movedObj = goToNode.object;
                if (!movedObj) {
                  movedObj = myModel.findObject(goToNode.objRef);
                }
                let movedObjview = goToNode.objectview;
                if (!movedObjview) {
                  movedObjview = myModelview.findObjectView(goToNode.objviewRef);
                }
                myToNode.group = goToNode.group; // ""
                myDiagram.model.setDataProperty(gjsPart, "group", myToNode.group);
                let scale = goToNode.scale; // Not part of group
                gjsPart.scale = scale;
                myObjectview.scale = gjsPart.scale;
                myDiagram.model.setDataProperty(myToNode.n, "scale", gjsPart.scale);
                myObjectview.group = goToNode.group;
                // Check if the node has a relationship FROM a group
                let inputRelviews = movedObjview?.inputrelviews;
                if (inputRelviews?.length > 0) {
                  movedObjview.purgeInputRelviews();
                }
                const inputRelships = movedObj?.inputrels;
                for (let i = 0; i < inputRelships?.length; i++) {
                  const relship = inputRelships[i];
                  const fromObj = relship.fromObject;
                  if (!fromObj.objectviews) 
                    continue;
                  const fromObjviews = myModelview.findObjectViewsByObject(fromObj) as akm.cxObjectView;
                  const fromObjview = fromObjviews[0];
                  if (fromObjview?.isGroup) {
                    // YES
                    const fromGroup = fromObjview.object;
                    const fromGroupView = fromObjview;
                    const relviews = myModelview.findRelationshipViewsByRel2(relship, fromObjview, movedObjview, true);
                    let relview: akm.cxRelationshipView;
                    if (relviews?.length > 0) {
                      relview = relviews[0];
                      relview.markedAsDeleted = false;
                      // const fromObjview = relview.fromObjview; // Container
                      movedObjview.group = goToNode.group;
                      const jsnObjview = new jsn.jsnObjectView(movedObjview);
                      modifiedObjectViews.push(jsnObjview);                          
                      relview.toObjview = movedObjview;
                      relview.points = [];
                      const jsnRelview = new jsn.jsnRelshipView(relview);
                      modifiedRelshipViews.push(jsnRelview);  
                      const fromNode = myGoModel.findNodeByViewId(fromObjview.id);
                      const toNode = myGoModel.findNodeByViewId(movedObjview.id);   
                      if (fromNode && toNode) {
                        toNode.group = goToNode.group; 
                        const gjsToNode = myDiagram.findNodeForKey(toNode.key);
                        gjsToNode.group = goToNode.group; 
                        gjsToNode.data.group = goToNode.group; 
                        myDiagram.model.setDataProperty(gjsToNode, "group", gjsToNode.group);
                      }
                    } else {
                      // The relview does not exist - create it
                      relview = new akm.cxRelationshipView(utils.createGuid(), relship.name, relship);
                      fromObjview.addOutputRelview(relview);
                      movedObjview.addInputRelview(relview);
                      relview.fromObjview = fromGroupView;
                      relview.toObjview = movedObjview;
                      relview.points = [];
                      relship.addRelationshipView(relview);
                      const jsnRelview = new jsn.jsnRelshipView(relview);
                      if (jsnRelview) {
                        uic.addItemToList(modifiedRelshipViews, jsnRelview);
                      }
                      const jsnRelship = new jsn.jsnRelationship(relship);
                      if (jsnRelship) {
                        uic.addItemToList(modifiedRelships, jsnRelship);
                      }
                      myModelview.addRelationshipView(relview);
                    }
                    const lnk = myDiagram.findLinkForKey(relview?.id);
                    if (!lnk && relview) {                    
                      // Create a new gojs link
                      myDiagram.startTransaction('AddLink');
                      const link = new gjs.goRelshipLink(relview.id, myGoModel, relview);
                      link.loadLinkContent(myGoModel);
                      link.fromNode = uid.getNodeByViewId(fromGroupView.id, myDiagram);
                      link.from = link.fromNode?.key;
                      link.toNode = uid.getNodeByViewId(movedObjview.id, myDiagram);
                      link.to = link.toNode?.key;
                      link.points = []; 
                      myGoModel.addLink(link);
                      myDiagram.model.addLinkData(link);   
                      uid.clearPath(myDiagram.links, myMetis, myDiagram);
                      myDiagram.commitTransaction('AddLink');
                    } else if (lnk) {
                      uid.clearPath(myDiagram.links, myMetis, myDiagram);
                      // lnk.points = [];
                    }
                  } else {
                    // NO
                    const relviews = myModelview.findRelationshipViewsByRel(relship, true);
                    let relview: akm.cxRelationshipView;
                    if (relviews?.length > 0) {
                      const relview = relviews[0];
                      relview.markedAsDeleted = false;
                      relview.toObjview = movedObjview;
                      relview.points = [];
                      const jsnRelview = new jsn.jsnRelshipView(relview);
                      modifiedRelshipViews.push(jsnRelview);
                    }
                  }
                }
              }
              if (myGoNode.key !== myToNode.group) {
                myGoNode.scale = myToNode.scale;
                myGoNode.loc = myToNode.loc;
                myGoNode.group = myToNode.group;
              }
              if (myGoNode.object) {
                const objvIdName = { id: myGoNode.key, name: myGoNode.name };
                const objIdName = { id: myGoNode.object.id, name: myGoNode.object.name };
                myDiagram.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: objvIdName });
                myDiagram.dispatch({ type: 'SET_FOCUS_OBJECT', data: objIdName });
              }
              // Prepare dispatch
              const jsnObjview = new jsn.jsnObjectView(myObjectview);
              if (jsnObjview) {
                uic.addItemToList(modifiedObjectViews, jsnObjview);
              }
            }
          }
        }
        { /////////
        const links = myDiagram.links;
        for (let it = links.iterator; it?.next();) {
          const link = it.value;
          const rview = myModelview.findRelationshipView(link.data.key);
          if (!rview) continue;
          const relviews = myModelview.relshipviews;
          for (let i = 0; i < relviews?.length; i++) {
            const relview = relviews[i];
            if (relview.id === rview.id) {
              const points = [];
              for (let it = link.points.iterator; it?.next();) {
                const point = it.value;
                points.push(point.x)
                points.push(point.y)
              }
              relview.points = points;
              const jsnRelview = new jsn.jsnRelshipView(relview);
              if (jsnRelview) {
                uic.addItemToList(modifiedRelshipViews, jsnRelview);
              }
              myModelview.addRelationshipView(relview);
            }
          }
        }
        uid.clearPath(links, myMetis, myDiagram);
        }
        // Dispatch modelview
        const modifiedModelviews = new Array();
        const jsnModelview = new jsn.jsnModelView(myModelview);
        modifiedModelviews.push(jsnModelview);
        modifiedModelviews.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data });
        });
        break;
      }
      case "SelectionDeleting": {
        // const newNode = myMetis.currentNode;
        const deletedFlag = true;
        let renameTypes = false;
        const selection = e.subject;
        const data = selection.first().data;
        const isMetamodel = this.isMetamodelType(data.category);
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
              const key = data.key;
              const typename = data.type;
              if (data.category === constants.gojs.C_RELSHIPTYPE) {
                const defRelType = myMetis.findRelationshipTypeByName(constants.types.AKM_GENERIC_REL);
                const reltype = myMetis.findRelationshipType(data.reltype?.id);
                if (reltype) {
                  // Check if reltype instances exist
                  const rels = myMetis.getRelationshipsByType(reltype, false);
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
              const key = data.key;
              const typename = data.type;
              if (data.category === constants.gojs.C_OBJECTTYPE) {
                const defObjType = myMetis.findObjectTypeByName('Generic');
                const objtype = myMetis.findObjectType(data.objecttype?.id);
                if (objtype) {
                  // Check if objtype instances exist
                  const objects = myMetis.getObjectsByType(objtype, true);
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
                }
              }
            }
          }
          if (isMetamodel) {
            uic.purgeModelDeletions(myMetis, myDiagram);
            return;
          }
        } else {
          // Handle relationships
          for (let it = selection?.iterator; it?.next();) {
            const sel = it.value;
            const data = sel.data;
            const key = data.key;
            if (data.category === constants.gojs.C_RELATIONSHIP) {
              const relview = myModelview.findRelationshipView(key);
              uic.deleteLink(data, deletedFlag, context);
              if (relview && relview.category === constants.gojs.C_RELSHIPVIEW) {
                relview.markedAsDeleted = deletedFlag;
                const relship = relview.relship;
                if (myMetis.deleteViewsOnly)
                  relship.markedAsDeleted = false;
                const jsnRelship = new jsn.jsnRelationship(relship);
                modifiedRelships.push(jsnRelship);
                const jsnRelview = new jsn.jsnRelshipView(relview);
                modifiedRelshipViews.push(jsnRelview);
              }
            }
          }
          // Handle objects
          for (let it = selection?.iterator; it?.next();) {
            const sel = it.value;
            const data = sel.data;
            if (data.category === constants.gojs.C_OBJECT) {
              const key = data.key;
              const myNode = this.getNode(context.myGoModel, key);  // Get nodes !!!
              if (myNode) {
                const objview = myModelview.findObjectView(myNode.key);
                const object = objview?.object;
                uic.deleteNode(myNode, deletedFlag, context);
                if (object) {
                  object.markedAsDeleted = !myMetis.deleteViewsOnly;
                  const jsnObject = new jsn.jsnObject(object);
                  modifiedObjects.push(jsnObject);
                  // objview.markedAsDeleted = myMetis.deleteViewsOnly;
                  const jsnObjview = new jsn.jsnObjectView(objview);
                  modifiedObjectViews.push(jsnObjview);
                }
              }
            }
          }
        }
        break;
      }
      case 'ExternalObjectsDropped': {
        e.subject.each(function (n) {
          const node = myDiagram.findNodeForKey(n.data.key);
          const gjsNode = node.data;
          let type: akm.cxObjectType = n.data.objecttype;
          let typeview: akm.cxObjectTypeView = n.data.typeview;
          let objview: akm.cxObjectView;
          let objId: string;
          let object: akm.cxObject;
          if (!type || !typeview) {
            // An object has been dropped (dragged from object palette)
            type = myMetis.findObjectType(n.data.objtypeRef);
            typeview = type.typeview;
            objId = n.data.objRef;
            object = myMetis.findObject(objId);
            myModel.addObject(object);
            myMetis.addObject(object);
            const key = n.data.key;
            objview = new akm.cxObjectView(key, n.data.name, object, object.description, myModelview);
            objview.viewkind = constants.viewkinds.CONT;
            objview.isGroup = n.data.isGroup;
            objview.size = n.data.size;
            if (objview.isGroup) {
              objview.viewkind = constants.viewkinds.CONT;
            } else {
              objview.viewkind = constants.viewkinds.OBJ;
            }
            objview = uic.setObjviewColors(n.data, object, objview, typeview, myDiagram);
            object.addObjectView(objview);
            myModelview.addObjectView(objview);
            myModelview.setFocusObjectview(objview);
            myMetis.addObjectView(objview);
            let goNode = myGoModel.findNode(key);
            if (!goNode) {
              goNode = new gjs.goObjectNode(key, myGoModel, objview);
              goNode.loadNodeContent(myGoModel);
              myGoModel.addNode(goNode);
            }
            // Dispatch modelview
            const modifiedModelviews = new Array();
            const jsnModelview = new jsn.jsnModelView(myModelview);
            modifiedModelviews.push(jsnModelview);
            modifiedModelviews.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data });
            });
            if (objview && object) {
              const objvIdName = { id: objview.id, name: objview.name };
              const objIdName = { id: object.id, name: object.name };
              myDiagram.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: objvIdName });
              myDiagram.dispatch({ type: 'SET_FOCUS_OBJECT', data: objIdName });
            }
          } else {
            // An object type has been dropped - create an object
            // i.e. new object, new objectview, 
            const objName = node.data.object.name;
            const objDescr = node.data.object.description;
            type = myMetis.findObjectType(type.id);
            typeview = type.typeview;
            // Create a new object
            objId = utils.createGuid();
            object = new akm.cxObject(objId, objName, type, objDescr);
            object.parentModelRef = myModel.id;
            myModel.addObject(object);
            myMetis.addObject(object);
            console.log('1241 node, data', node, n.data);
            // Find the objectview
            objview = myModelview.findObjectView(node.data.key);
            if (!objview) {
              objview = new akm.cxObjectView(node.data.key, node.data.name, object, node.data.description, myModelview);
              objview.isGroup = node.data.isGroup;
              objview.objectRef = object.id;
              object.addObjectView(objview);
              myModelview.addObjectView(objview);
              myMetis.addObjectView(objview);
            }
            myModelview.setFocusObjectview(objview);
            // Dispatch modelview
            const modifiedModelviews = new Array();
            const jsnModelview = new jsn.jsnModelView(myModelview);
            modifiedModelviews.push(jsnModelview);
            modifiedModelviews.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data });
            });
          }
          let fillcolor = "";
          let strokecolor = "";
          let textcolor = "";
          let part = n.data;
          part.scale = n.scale;
          if (part.size === "") {
            if (part.isGroup) {
              part.size = "200 100";
            } else {
              part.size = "160 70";
            }
          }

          if (object) {
            fillcolor = object.fillcolor ? object.fillcolor : part.fillcolor;
            strokecolor = object.strokecolor ? object.strokecolor : part.strokecolor;
            textcolor = object.textcolor ? object.textcolor : part.textcolor;
          }
          if (!object) {
            object = new akm.cxObject(objId, objName, type, objDescr);
            uic.copyProperties(object, part);
            object.setModified();
            myModel.addObject(object);
            myMetis.addObject(object);
          }
          if (!objview || !(objview instanceof akm.cxObjectView)) {
            objview = new akm.cxObjectView(part.key, part.name, object, part.description, myModelview);
            objview.isGroup = part.isGroup;
            objview = uic.setObjviewColors(part, object, objview, typeview, myDiagram);
            objview.loc = part.loc;
            objview.viewkind = type.viewkind;
            objview.scale = part.scale;
            objview.size = part.size;
            if (objview.viewkind === 'Container') {
              objview.isGroup = true;
            }
            objview.setModified();
            myModelview.addObjectView(objview);
            myMetis.addObjectView(objview);
          } else {
            objview.loc = part.loc;
            objview.size = part.size;
          }
          let goNode = myGoModel.findNodeByViewId(objview.id);
          if (!goNode) {
            goNode = new gjs.goObjectNode(objview.id, myGoModel, objview);
            goNode.loadNodeContent(myGoModel);
            // uic.updateNode(goNode, typeview, myDiagram, myGoModel);
            myGoModel.addNode(goNode);
            // myDiagram.model.addNodeData(goNode);
          }
          // Check if goNode is member of a group
          const group = uic.getGroupByLocation(myGoModel, part.loc, part.size, goNode);
          if (group) {
            const parentgroup = group;
            goNode.group = parentgroup.key;
            goNode.objectview.group = parentgroup.objviewRef;
            myDiagram.model.setDataProperty(part, "group", goNode.group);
            goNode.scale = new String(goNode.getMyScale(myGoModel));
            part.scale = Number(goNode.scale);
          }
          if (goNode) {
            goNode.object = null;
            goNode.objecttype = null;
            goNode.objectview = null;
          }
          const isLabel = (part.typename === 'Label');

          // Prepare dispatch
          if (part.type === 'objecttype') {
            const otype = uic.createObjectType(part, context);
            if (otype) {
              otype.typename = constants.types.OBJECTTYPE_NAME;
              const jsnObjtype = new jsn.jsnObjectType(otype, true);
              modifiedObjectTypes.push(jsnObjtype);

              const jsnObjtypeView = new jsn.jsnObjectTypeView(otype.typeview);
              modifiedObjectTypeViews.push(jsnObjtypeView);

              const loc = part.loc;
              const size = part.size;
              const objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), context.myMetamodel, otype, loc, size);
              const jsnObjtypeGeo = new jsn.jsnObjectTypegeo(objtypeGeo);
              modifiedObjectTypeGeos.push(jsnObjtypeGeo);
            }
          } else // object
          {
            const jsnObjview = new jsn.jsnObjectView(objview);
            modifiedObjectViews.push(jsnObjview);
            uic.addItemToList(modifiedObjectViews, jsnObjview);
            const jsnObj = new jsn.jsnObject(object);
            modifiedObjects.push(jsnObj);
            const objvIdName = { id: objview.id, name: objview.name };
            const objIdName = { id: objview.object.id, name: objview.object.name };
            myDiagram.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: objvIdName });
            myDiagram.dispatch({ type: 'SET_FOCUS_OBJECT', data: objIdName });
        }
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
        if (debug) console.log('1313 selected', data, sel);
        const objectview = myModelview.findObjectView(data?.key);
        const object = objectview?.object;
        console.log('1316 object, objectview', object, objectview);
        for (let it = myDiagram.nodes; it?.next();) {
          const n = it.value;
          const data = n.data;
          if (data.isSelected) {
            if (debug) console.log('1319 goNode', data);
          }
        }
        {
          const goNode: gjs.goObjectNode = myGoModel.findNode(data.key);
          if (debug) console.log('1319 myGoModel, goNode', myGoModel, goNode);
        }
        if (objectview && object) {
          const objvIdName = { id: objectview.id, name: objectview.name };
          const objIdName = { id: object.id, name: object.name };

          if (debug) console.log('1072 SET_FOCUS_OBJECTVIEW', objvIdName, objIdName)
          context.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: objvIdName });
          context.dispatch({ type: 'SET_FOCUS_OBJECT', data: objIdName });
        }
        for (let it = sel.memberParts; it?.next();) {
          let n = it.value;
          if (n instanceof go.Link) continue;
          if (debug) console.log('1079 n', n.data);
        }
        break;
      }
      case "ObjectContextClicked": { // right clicked
        const sel = e.subject.part;
        const data = sel.data;
        // dispatch to focusCollection here ???
        if (debug) console.log('1316 selected', data, sel);
        break;
      }
      case "PartResized": {
        let selection = e.diagram.selection
        for (let it = selection.iterator; it?.next();) {
          let n = it.value;
          if (n.data.isGroup) {
            let objview: akm.cxObjectView;
            objview = myModelview.findObjectView(n.data.key);
            if (!objview) 
              continue;
            objview.loc = n.data.loc;
            objview.size = n.data.size;
            let myNode = myGoModel.findNodeByViewId(n.data.key);
            myNode.size = objview.size;
            myNode.key = objview.id;
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
        const selection = e.subject;
        let pasteAnotherModelview = false;
        let pasteViewsOnly = myMetis.pasteViewsOnly;
        let readOnly = false
        let fromModel = myModel;
        let toModel = myModel;
        let fromModelview = myModelview;
        let toModelview = myModelview;
        // Build nodemaps
        const nodeAndLinkMaps = new akm.cxNodeAndLinkMaps(fromModel, toModel, fromModelview, toModelview);
        let it = selection.iterator;
        while (it.next()) { 
          if (it.value instanceof go.Node) {
            // Filter out source nodes
            let gjsNode = it.value.data;  
            let gjsSourceObject = gjsNode.object;
            let gjsSourceNode   = gjsNode.fromNode;
            let sourceNodeKey   = gjsSourceNode.key;
            let sourceLoc       = gjsSourceNode.loc;
            let sourceGroupKey  = gjsSourceNode.group;
            let targetGroupKey  = gjsNode.group;
            let targetNodeKey   = gjsNode.key;
            let targetLoc       = gjsNode.loc;
            if (sourceNodeKey?.length == gjsNode.key.length) {
              pasteAnotherModelview = true;
              targetNodeKey = utils.createGuid();
              fromModelview = gjsNode.fromModelview;
              fromModel = fromModelview.model;
              nodeAndLinkMaps.setFromModel(fromModel);
              nodeAndLinkMaps.setFromModelView(fromModelview);
              toModelview = myModelview;
              toModel = myModel;
              nodeAndLinkMaps.setToModel(toModel);
              nodeAndLinkMaps.setToModelView(myModelview);
            }
            const nodMap = new akm.cxNodeMap(gjsSourceObject, sourceNodeKey, targetNodeKey, gjsNode.isGroup, 
                                             sourceGroupKey, targetGroupKey, sourceLoc, targetLoc);
            nodeAndLinkMaps.addNodeMap(nodMap);            
          }
        }

        if (pasteAnotherModelview) { // Handle groups
          // This covers both the case of pasting into another modelview and 
          // the case of pasting into another model
          // 
          // Identify the nodes that are member of groups
          // and finalize the nodemaps
          const nodemaps = nodeAndLinkMaps.nodeMaps;
          for (let i=0; i<nodemaps.length; i++) {
            const nodMap = nodemaps[i];
            const fromGroupKey = nodMap.fromGroupKey;
            for (let j=0; j<nodemaps.length; j++) {
              const grpMap = nodemaps[j];
              if (grpMap.isGroup) {
                if (grpMap.fromSourceKey === fromGroupKey) {
                  nodMap.toGroupKey = grpMap.toTargetKey;
                  break;
                }
              }
            }
          }
        }

       // Now identify objects and objectviews
        const goSourceNodes = [];
        const goTargetNodes = [];
        const sourceObjectviews = [];
        const targetObjectviews = [];
        const gjsSourceNodes = [];
        const gjsTargetNodes = [];
        const gjsSourceLinks = [];
        const gjsTargetLinks = [];
        const sourceObjects = [];
        const targetObjects = [];
        const sourceRelships = [];
        const targetRelships = [];
        let objtype: akm.cxObjectType;
        const nodemaps = nodeAndLinkMaps.nodeMaps;
        for (let i=0; i<nodemaps.length; i++) {
          const nodMap = nodemaps[i];
          const sourceNodeKey = nodMap.fromSourceKey;
          const sourceObjectView: akm.cxObjectView = myMetis.findObjectView(sourceNodeKey);
          let sourceObject: akm.cxObject = sourceObjectView.object;
          let goSourceNode: gjs.goObjectNode = myGoModel.findNode(sourceNodeKey);
          if (!goSourceNode) {
            goSourceNode = new gjs.goObjectNode(sourceNodeKey, myGoModel, sourceObjectView);
            myGoModel.addNode(goSourceNode);
          }
          objtype = sourceObject?.type;
          if (!objtype)
            objtype = myMetis.findObjectType(goSourceNode.objtypeRef);

          goSourceNodes.push(goSourceNode);
          sourceObjectviews.push(sourceObjectView);
          sourceObjects.push(sourceObject);

          // Paste the target nodes and objectviews
          let targetObject: akm.cxObject = sourceObject;

          if (!pasteViewsOnly) {
            targetObject = new akm.cxObject(utils.createGuid(), sourceObject.name, objtype, sourceObject.description);
            myModel.addObject(targetObject);
            myMetis.addObject(targetObject);
          }
          targetObjects.push(targetObject);
          let targetObjectView: akm.cxObjectView; 
          let targetNodeKey = nodMap.toTargetKey;

          if (pasteAnotherModelview) {
            targetObjectView = new akm.cxObjectView(targetNodeKey, sourceObjectView.name, 
                                                    targetObject, sourceObjectView.description, myModelview);
            myModelview.addObjectView(targetObjectView);
            myMetis.addObjectView(targetObjectView);
            nodeAndLinkMaps.replaceNodeKeys(sourceNodeKey, targetObject.id);
            if (fromModel.id !== toModel.id) {
              readOnly = true;
            }
            targetObjectView.readOnly = readOnly;
          } else {
            targetObjectView = new akm.cxObjectView(targetNodeKey, sourceObjectView.name, 
                                                    targetObject, sourceObjectView.description, myModelview);
            myModelview.addObjectView(targetObjectView);
            myMetis.addObjectView(targetObjectView);
          }

          let goTargetNode: gjs.goObjectNode = myGoModel.findNode(targetNodeKey);
          if (!goTargetNode) {
            goTargetNode = new gjs.goObjectNode(targetNodeKey, myGoModel, targetObjectView);
            myGoModel.addNode(goTargetNode);
          }
          if (targetObjectView.isGroup) {
            targetObjectView.viewkind = constants.viewkinds.CONT;
          }
          targetObjectView.setGroup(nodMap.toGroupKey);
          targetObjectView.setLoc(nodMap.toLoc);
          targetObjectView.setIsGroup(sourceObjectView.isGroup);
          targetObjectView.setSize(sourceObjectView.size);
          targetObjectView.setScale(sourceObjectView.scale);
          targetObjectView.setMemberscale(sourceObjectView.memberscale);
          targetObjectView.setTemplate(sourceObjectView.template);
          targetObjectView.readonly = readOnly;
          myModelview.addObjectView(targetObjectView);
          myMetis.addObjectView(targetObjectView);
          goTargetNode = new gjs.goObjectNode(nodMap.toTargetKey, myGoModel, targetObjectView);
          goTargetNode.group = nodMap.toGroupKey;
          myGoModel.addNode(goTargetNode);
          goTargetNodes.push(goTargetNode);
          targetObjectviews.push(targetObjectView);                        
          const jsnObj = new jsn.jsnObject(targetObject);
          uic.addItemToList(modifiedObjects, jsnObj);
          const jsnObjview = new jsn.jsnObjectView(targetObjectView);
          uic.addItemToList(modifiedObjectViews, jsnObjview);
        }
      
        // Now handle the relationships
        let it2 = selection.iterator;
        while (it2.next()) { 
          let n = it2.value;
          if (n instanceof go.Node) 
            continue;
          const nodemaps = nodeAndLinkMaps.nodeMaps;
          if (it2.value instanceof go.Link) {
            let gjsLink = it2.value.data; // The copied (source) link (i.e. the relationship)
            if (!gjsLink.linkNode) 
              continue;
            // The copied relviews / links
            let relviewId = gjsLink.linkNode.key;
            let relview = myMetis.findRelationshipView(relviewId);
            let relid = gjsLink.linkNode.relid;
            let relship = myMetis.findRelationship(relid);
            const copiedRelship = relship;
            const gjsCopiedLink = gjsLink.linkNode;
            const gjsCopiedLinkKey = gjsCopiedLink.key;
            const gjsCopiedLinkFromNodeKey = gjsCopiedLink.from;
            const gjsCopiedLinkToNodeKey = gjsCopiedLink.to;

            const copyPasteLinkMap = 
                new akm.cxLinkMap(copiedRelship, 
                                  gjsCopiedLinkFromNodeKey,
                                  gjsCopiedLinkToNodeKey,
                                  gjsCopiedLinkKey);
            nodeAndLinkMaps.addLinkMap(copyPasteLinkMap);    

            let pastedRelshipRef = gjsLink.relshipRef;
            if (pastedRelshipRef === copiedRelship.id) {
              pastedRelshipRef = utils.createGuid();
            }
            let pastedRelship: akm.cxRelationship = myMetis.findRelationship(pastedRelshipRef);
            if (!pasteViewsOnly) {
              pastedRelship = new akm.cxRelationship(pastedRelshipRef, copiedRelship.type, null, null, copiedRelship.name, copiedRelship.description);
              myModel.addRelationship(pastedRelship);
              myMetis.addRelationship(pastedRelship);
            }
            let gjsPastedLink = gjsLink;
            let gjsPastedLinkKey = gjsPastedLink.key;
            let gjsPastedLinkFromNodeKey = gjsPastedLink.from;
            let gjsPastedLinkToNodeKey = gjsPastedLink.to;
            if (pasteAnotherModelview) { // 
              const fromNodeMap = nodeAndLinkMaps.getNodeMap(relship.fromObject, gjsLink.from);
              gjsPastedLinkFromNodeKey = fromNodeMap.toTargetKey;
              const toNodeMap = nodeAndLinkMaps.getNodeMap(relship.toObject, gjsLink.to);
              gjsPastedLinkToNodeKey = toNodeMap.toTargetKey;
            }
            let pastedRelviewKey = gjsPastedLinkKey;
            if (pasteAnotherModelview) { // 
              pastedRelviewKey = utils.createGuid();
              myDiagram.model.removeLinkData(gjsLink);
              gjsLink.key = pastedRelviewKey;
              myDiagram.model.addLinkData(gjsLink);
            }
            copyPasteLinkMap.sourceLinkKey     = gjsCopiedLinkKey;
            copyPasteLinkMap.targetLinkKey     = gjsPastedLinkKey;
            copyPasteLinkMap.targetFromNodeKey = gjsPastedLinkFromNodeKey;
            copyPasteLinkMap.targetToNodeKey   = gjsPastedLinkToNodeKey;
            // // The pasted FROM and TO links
            const pastedToLinkMap = 
                new akm.cxLinkMap(pastedRelship, // Obs: without from and to objects 
                                  gjsPastedLinkFromNodeKey,
                                  gjsPastedLinkToNodeKey,
                                  gjsPastedLinkKey,
                                  pastedRelviewKey);
            nodeAndLinkMaps.addLinkMap(pastedToLinkMap);    

            // // The target FROM objectview
            let fromObjview: akm.cxObjectView = myMetis.findObjectView(gjsPastedLinkFromNodeKey);
            let fromObject: akm.cxObject = fromObjview?.object;
            // The target TO objectview
            let toObjview: akm.cxObjectView = myMetis.findObjectView(gjsPastedLinkToNodeKey);
            let toObject: akm.cxObject = toObjview?.object;
        
          // The target Relationship
            let sourceRelship: akm.cxRelationship = copiedRelship;
            let reltype: akm.cxRelationshipType = myMetis.findRelationshipType(gjsPastedLink.reltypeRef);
            let targetRelship: akm.cxRelationship = sourceRelship;
            if (!pasteViewsOnly) {
              const relid = utils.createGuid();
              targetRelship = new akm.cxRelationship(relid, reltype, fromObject, toObject, sourceRelship.name, sourceRelship.description);
            }
            targetRelships.push(targetRelship);
            fromObject.addOutputrel(targetRelship);
            toObject.addInputrel(targetRelship);
            myModel.addRelationship(targetRelship);
            myMetis.addRelationship(targetRelship);
  
            // The target relationship view
            let targetRelview = new akm.cxRelationshipView(pastedRelviewKey, gjsPastedLink.name, targetRelship, "");
            targetRelview.fromObjview = fromObjview;
            targetRelview.toObjview = toObjview;
            targetRelship.addRelationshipView(targetRelview);
            targetRelview.readOnly = readOnly;
            const goRelshipLink = new gjs.goRelshipLink(pastedRelviewKey, myGoModel, targetRelview);
            myGoModel.addLink(goRelshipLink);
            myModelview.addRelationshipView(targetRelview);
            myMetis.addRelationshipView(targetRelview);
            const jsnRelship = new jsn.jsnRelationship(targetRelship);
            modifiedRelships.push(jsnRelship);
            const jsnRelview = new jsn.jsnRelshipView(targetRelview);
            modifiedRelshipViews.push(jsnRelview);
          }
        }
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
        const gjsData = link.data;
        context.link = link;
        context.gjsData = gjsData;
        context.goModel = myGoModel;
        if (debug) console.log('1498 link', link.data, link.data.from, link.data.to);
        let gjsFromNode, gjsToNode;
        for (let it = myDiagram.nodes; it?.next();) {
          const n = it.value;
          if (n.data?.key === gjsData.from) {
            gjsFromNode = n.data;
          }
          if (n.data?.key === gjsData.to) {
            gjsToNode = n.data;
          }
        }
        let goFromNode: gjs.goObjectNode;
        let goToNode: gjs.goObjectNode;
        let fromObjView: akm.cxObjectView;
        let toObjView: akm.cxObjectView;
        if (gjsFromNode) {
          fromObjView = myModelview.findObjectView(gjsFromNode.key);
          goFromNode = myGoModel.findNode(gjsFromNode.key);
          context.goFromNode = goFromNode;
          context.fromObjView = fromObjView;
          uic.updateNode(goFromNode, fromObjView?.typeview, myDiagram, myGoModel);
        }
        if (gjsToNode) {
          toObjView = myModelview.findObjectView(gjsToNode.key);
          goToNode = myGoModel.findNode(gjsToNode.key);
          context.goToNode = goToNode;
          context.toObjView = toObjView;
          uic.updateNode(goToNode, toObjView?.typeview, myDiagram, myGoModel);
        }
        // Handle relationship types
        if (gjsFromNode?.category === constants.gojs.C_OBJECTTYPE) {
          gjsData.category = constants.gojs.C_RELSHIPTYPE;
          if (debug) console.log('1523 link', fromNode, toNode);
          // link.category = constants.gojs.C_RELSHIPTYPE;
          const reltype = uic.createRelationshipType(gjsFromNode.data, gjsToNode.data, gjsData, context);
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
              let goLink = new gjs.goRelshipTypeLink(utils.createGuid(), myGoModel, reltype);
              goLink.fromNode = gjsFromNode.data;
              goLink.toNode = gjsToNode.data
              goLink.loadLinkContent(myGoModel);
              myGoModel.addLink(goLink);
              goLink.name = reltype.name;
              if (debug) console.log('1543 goLink, myGoModel, reltype', goLink, myGoModel, reltype);
              const gjsLink = myDiagram.findLinkForKey(goLink.key);
              myDiagram.model.addLinkData(gjsLink);
              if (debug) console.log('1546 lnk, reltype', gjsLink, reltype);
              myDiagram.model.setDataProperty(gjsLink.data, 'name', reltype.name);
            }
          }
          myDiagram.requestUpdate();
        }
        // Handle relationships
        if (gjsFromNode?.category === constants.gojs.C_OBJECT) {
          // gjsData.category = constants.gojs.C_RELATIONSHIP;
          context.handleOpenModal = this.handleOpenModal;
          if (gjsFromNode && gjsToNode)
            uic.createRelationship(gjsFromNode, gjsToNode, context);
        }
        myDiagram.requestUpdate();
        break;
      }
      case "LinkRelinked": {
        const modifiedRelships = [];
        const modifiedRelshipViews = [];
        const gjsLink = e.subject;
        const key = gjsLink.key;
        const gjsLinkData = gjsLink.data;
        const goLink = myGoModel.findLink(key);        
        let goFromNode = myGoModel.findNode(gjsLinkData.from);
        let goToNode = myGoModel.findNode(gjsLinkData.to);
        const relshipRef = goLink.relshipRef;
        const relship = myModel.findRelationship(relshipRef);
        let fromObject = goFromNode.object;
        if (!fromObject) fromObject = myModel.findObject(goFromNode.objRef);
        relship.fromObject = fromObject;
        let toObject = goToNode.object;
        if (!toObject) toObject = myModel.findObject(goToNode.objRef);
        relship.toObject = toObject;
        const relviewRef = goLink.relviewRef;
        let relview = myModelview.findRelationshipView(relviewRef);
        if (!relview) relview = myModelview.findRelationshipView(relviewRef);
        if (!relview) 
          break;
        let fromObjview = goFromNode.fromObjview;
        if (!fromObjview) fromObjview = myModelview.findObjectView(goFromNode.objviewRef);
        relview.fromObjview = fromObjview;
        let toObjview = goToNode.toObjview;
        if (!toObjview) toObjview = myModelview.findObjectView(goToNode.objviewRef);
        relview.toObjview = toObjview;
        // Prepare for dispatch
        const jsnRelship = new jsn.jsnRelationship(relship);
        modifiedRelships.push(jsnRelship);
        const jsnRelview = new jsn.jsnRelshipView(relview);
        modifiedRelshipViews.push(jsnRelview);
        // Dispatch
        modifiedRelships.map(mn => {
            let data = (mn) && mn
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
        })
        modifiedRelshipViews.map(mn => {
            let data = (mn) && mn
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
        })
        break;
      }
      case "LinkReshaped": {
        let link = e.subject;
        link = myDiagram.findLinkForKey(link.key);
        const data = link?.data;
        if (debug) console.log('1596 link, data', link, data);
        let relview = data?.relshipview;
        relview = myModelview.findRelationshipView(data?.key);
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
        if (debug) console.log('1615 myMetis', myMetis);
        uid.clearFocus(myModelview);
        let data = { id: myModelview.id, name: myModelview.name }
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data })
        let data2 = { id: myModel.id, name: myModel.name }
        data2 = JSON.parse(JSON.stringify(data2));
        context.dispatch({ type: 'SET_FOCUS_OBJECT', data2 })

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
    if (true) { // Dispatches to store individual objects/types
      if (debug) console.log('1928 modifiedObjectViews', modifiedObjectViews);
      modifiedObjectViews.map(mn => {
        let data = (mn) && mn
        if (mn.id) {
          data = JSON.parse(JSON.stringify(data));
          context.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
        }
      })

      modifiedObjectTypes?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data })
      })

      modifiedObjectTypeViews?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
      })

      modifiedObjectTypeGeos?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_OBJECTTYPEGEOS_PROPERTIES', data })
      })

      if (!debug) console.log('1955 modifiedRelshipViews', modifiedRelshipViews);
      modifiedRelshipViews.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
      })

      modifiedRelshipTypes?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
      })

      // if (debug) console.log('1450 modifiedRelshipTypeViews', modifiedRelshipTypeViews);
      modifiedRelshipTypeViews?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
      })

      modifiedObjects?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
      })

      modifiedRelships?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        context.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
      })
    } else {
      const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
      let data = { metis: jsnMetis }
      data = JSON.parse(JSON.stringify(data));
      myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
    }
    if (!debug) console.log('1704 myMetis', myMetis);
  }

  public render() {
    const selectedData = this.state.selectedData;
    if (debug) console.log('1777 selectedData', selectedData, this.props);
    let modalContent, inspector, selector, header, category, typename;
    const modalContext = this.state.modalContext;
    if (debug) console.log('1780 modalContext ', modalContext);
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
    if (debug) console.log('1837 dataarray:', this.state);
    if (debug) console.log('1838 dataarray:', this.state.nodeDataArray, this.state.linkDataArray);
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
