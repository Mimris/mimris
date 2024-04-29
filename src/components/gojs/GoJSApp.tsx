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
    const myGoModel = this.state.myMetis.gojsModel;
    // const myGoMetamodel = this.state.myGoMetamodel;
    if (debug) console.log('223 handleDiagramEvent - myGoModel', myGoModel, myMetis);
    // const myGoMetamodel = this.state.myGoMetamodel;
    // const gojsModel = {
    //   nodeDataArray: myGoModel?.nodes,
    //   linkDataArray: myGoModel?.links
    // }
    const nodes = new Array();
    // const nods = myGoMetamodel?.nodes;
    // for (let i = 0; i < nods?.length; i++) {
    //   const node = nods[i] as gjs.goObjectTypeNode;
    //   const objtype = node.objecttype;
    //   if (objtype?.abstract) continue;
    //   if (objtype?.markedAsDeleted) continue;
    //   nodes.push(node);
    // }
    // if (nodes?.length > 0) myGoMetamodel.nodes = nodes

    // const gojsMetamodel = {
    //   nodeDataArray: myGoMetamodel?.nodes,
    //   linkDataArray: myGoMetamodel?.links
    // }
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
        console.log("Begin: After Reload:");
        const objviews = myModelview.objectviews;
        for (let i = 0; i < objviews?.length; i++) {
          const objview = objviews[i];
          const goNode = myGoModel.findNodeByViewId(objview.id);
          if (goNode) {
            for (let it = myDiagram.nodes; it?.next();) {
              const n = it.value;
              const data = n.data;
              if (data.key === goNode.key) {
                if (debug) console.log('300 objview, goNode, node: ', objview, goNode, n, data);
              }
            }
          }
        }
        const links = myDiagram.links;
        console.log("End: After Reload:");
        if (false) {
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
              const relview = data.relshipview;
              relview.markedAsDeleted = data.markedAsDeleted;
              if (relview.visible === false) {
                myDiagram.remove(link);;
              } else {
                const reltypename = data.typename;
                if (reltypename === constants.types.AKM_RELATIONSHIP_TYPE) {
                  const lnk = uid.getLinkByViewId(relview.id, myDiagram);
                  if (debug) console.log('333 link, lnk', link, lnk);
                }
              }
            }
          }
        }
        break;
      }
      case 'TextEdited': {
        const sel = e.subject.part;
        const data = sel.data;
        const textvalue = data.text;
        let field = e.subject.name;
        if (field === "") field = "name";
        // Object type or Object
        if (sel instanceof go.Node) {
          const key:string = data.key;
          const myNode = myGoModel.findNode(key);
          let text: string = data.name;
          const category: string = data.category;
          // Object type
          if (category === constants.gojs.C_OBJECTTYPE) {
            if (text === 'Edit name') {
              text = prompt('Enter name');
            }
            if (myNode) {
              data.name = text;
              uic.updateObjectType(data, field, text, context);
              const objtype = myMetis.findObjectType(data.objecttype?.id);
              if (objtype) {
                let data = { id: objtype.id, name: text };
                myDiagram.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data });
              }
            }
          } else { // Object           
            if (text === 'Edit name') {
              text = prompt('Enter name');
              data.name = text;
            }
            const myNode: gjs.goObjectNode = this.getNode(myGoModel, key);
            if (myNode) {
              myNode.text = textvalue;
              myNode.name = text;
              let obj: akm.cxObject = uic.updateObject(myNode, field, text, context);
              if (obj) {
                obj.name = text;
                obj.text = textvalue;
                myNode.objRef = obj.id;
                const objviews = obj.objectviews;
                for (let i = 0; i < objviews.length; i++) {
                  const objview = objviews[i];
                  objview.name = text;
                  objview.text = textvalue;
                  let node = myGoModel.findNodeByViewId(objview?.id);
                  if (node) {
                    const nodedata = sel.data;
                    nodedata.key = node.key;
                    nodedata.name = text;
                    {
                      let nodes = myDiagram.nodes; 
                      for (let it = nodes.iterator; it?.next();) {
                        let n = it.value;
                        console.log('439 node: data, key, name', n.data, n.data.key, n.data.name);
                      }
                    }
                    const jsnObjview = new jsn.jsnObjectView(objview);
                    jsnObjview.name = text;
                    jsnObjview.text = text;
                    modifiedObjectViews.push(jsnObjview);
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
                for (let i = 0; i < relviews?.length; i++) {
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
        let myGoModel = context.myGoModel;
        const myModelview = context.myModelview;
        // First remember the original locs
        const dragTool = myDiagram.toolManager.draggingTool;
        const myParts = dragTool.draggedParts;
        const myFromNodes = [];
        for (let it = myParts.iterator; it?.next();) {
          let n = it.value;
          let loc = it.value.point.x + " " + it.value.point.y;
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
        }
        // Then remember the new locs
        const selection = e.subject;
        const myToNodes = [];
        for (let it = selection.iterator; it?.next();) {
          let n = it.value;
          if (!(n instanceof go.Node)) continue;
          const myToNode = {
            "key": n.data.key,
            "name": n.data.name,
            "group": n.data.group,
            "loc": new String(n.data.loc),
            "scale": new String(n.data.scale1)
          }
          myToNodes.push(myToNode);
        }
        // First do the move and scale the nodes. 
        let selcnt = 0;
        let refloc;
        let count = -1;
        let rloc;
        for (let it = selection.iterator; it?.next();) {
          const sel = it.value;
          const data = sel.data;
          let objview: akm.cxObjectView = myModelview.findObjectView(data.key);
          if (debug) console.log('546 objview', objview, data, selection, it, sel);

          // Object type
          if (data?.category === 'Object type' || data?.category === 'Object type view') {
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
            const jsnMetamodel = new jsn.jsnMetaModel(context.myMetamodel);
            const dt = JSON.parse(JSON.stringify(jsnMetamodel));
            context.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', dt });
          }
          else if (data?.category === 'Object' || data?.category === 'Object view') // Object
          {
            // First do the move and scale the nodes. Do not worry about the correct location of the nodes.
            const hasMemberType = myMetis.findRelationshipTypeByName(constants.types.AKM_HAS_MEMBER);
            const myObjectviews = myModelview?.objectviews;
            // The object to move
            let fromObject = objview.object;
            let fromloc, fromNode, fromGroup;
            for (let j = 0; j < myFromNodes.length; j++) {
              const fnode = myFromNodes[j];
              if (fnode.key === objview.id) {
                fromNode = fnode;
                fromloc = fnode.loc.valueOf();
                break;
              }
            }
            let toloc, toNode;
            for (let j = 0; j < myToNodes.length; j++) {
              const tnode = myToNodes[j];
              if (tnode.key === objview.id) {
                toNode = tnode;
                toloc = tnode.loc.valueOf();
                break;
              }
            }
            // Move the object
            let node: gjs.goObjectNode = uic.changeNodeSizeAndPos(data, fromloc, toloc, myGoModel, myDiagram, modifiedObjectViews) as gjs.goObjectNode;
            if (node) {
              node = myGoModel.findNode(node.key);
              if (!node instanceof gjs.goObjectNode) {
                myGoModel = myGoModel.fixGoModel();
              }
            }
            if (node && node instanceof gjs.goObjectNode) {
              node.scale1 = node.getMyScale(myGoModel).toString();
              const group = uic.getGroupByLocation(myGoModel, node.loc, node.size, node);
              const containerType = myMetis.findObjectTypeByName(constants.types.AKM_CONTAINER);
              // The node IS moved INTO a group or moved INSIDE a group:
              if (group) {
                const parentgroup = group;
                node.group = parentgroup.key;
                const objectview = myMetis.findObjectView(node.objviewRef);
                const objtypeview = myMetis.findObjectTypeView(node.objtypeRef);
                const object = myMetis.findObject(node.objRef);
                objectview.group = parentgroup.objviewRef;
                myDiagram.model.setDataProperty(data, "group", node.group);
                // Handle hasMember relationships:
                if (group?.objecttype?.id !== containerType?.id && hasMemberType) {
                  const parentObj = myMetis.findObject(parentgroup.objRef);
                  let rel = null;
                  let fromObj = null;
                  let toObj = null;
                  // Check if a relationship of type 'hasMember' exists between the parent (group) 
                  // and the (current) node
                  let done = false;
                  const inputRels = object.getInputRelshipsByType(hasMemberType);
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
                    if (r.toObject.id !== node.objRef) {
                      // Not the correct relationship
                      continue;
                    }
                    // Found the correct relationship
                    rel = r;
                    // Find the corresponding relationship view if it exists and delete it
                    const parentObjview = myMetis.findObject(parentgroup.objviewRef);
                    const relviews = myModelview.getRelviewsByFromAndToObjviews(parentObjview, objectview);
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
                  node.memberscale = objectview.memberscale ? objectview.memberscale : objtypeview.memberscale;
                  node.group = parentgroup.key;
                  // Scale the group members
                  subNodes = uic.scaleNodesInGroup(node, myGoModel, myObjectviews, myFromNodes, myToNodes, myDiagram);
                }
                if (debug) console.log('680 subNodes', subNodes);
              } else { // The node is NOT moved into a group, possibly OUT OF a group
                const toObject = myModel.findObject(node.objRef);
                const toObjview = myModelview.findObjectView(node.objviewRef);
                node.group = "";
                let fromScale = fromNode.scale;
                let toScale = node.getMyScale(myGoModel); // 1;
                let scaleFactor = fromScale > toScale ? fromScale / toScale : toScale / fromScale;
                myDiagram.model.setDataProperty(node, "group", node.group);
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
                      let nodeloc = uic.scaleNodeLocation2(n, refloc, toLoc, scaleFactor);
                      if (nodeloc) {
                        let loc = nodeloc.x + " " + nodeloc.y;
                        n.loc = loc;
                        toNode.loc = new String(loc);
                        n.scale1 = node.getMyScale(myGoModel).toString();
                        let nod = myGoModel.findNodeByViewId(n.objectview.id) as any;
                        if (nod) {
                          nod = myDiagram.findNodeForKey(nod.key);
                          if (nod) {
                            nod.loc = loc;
                            nod.scale1 = node.getMyScale(myGoModel).toString();
                            myDiagram.model.setDataProperty(nod.data, "loc", loc);
                          }
                        }
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
                  let objview = myModelview.findObjectView(node.objviewRef);
                  if (count < 0) { // The reference node
                    count++;
                    rloc = node.loc;
                    objview.loc = node.loc;
                  } else {
                    const nodeloc = uic.scaleNodeLocation2(node, rloc, toloc, scaleFactor);
                    if (nodeloc) {
                      const loc = nodeloc.x + " " + nodeloc.y;
                      toloc = new String(loc);
                      node.loc = loc;
                      objview.loc = toloc.valueOf();
                      myDiagram.model.setDataProperty(n.data, "loc", loc);
                    }
                  }

                  // This is a node that is NOT inside a group
                  // I.e. the hasMember relationship should be visible
                  objview.group = "";
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
                    let relviewRef = link.data.key;
                    let relview = myModelview.findRelationshipView(relviewRef);
                    if (relview) {
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
                  if (node instanceof go.Node) {
                    node.scale1 = node.getMyScale(myGoModel);
                  break;
                }
              }
              const objview = myMetis.findObjectView(node.objviewRef);
              objview.loc = node.loc;
              objview.scale1 = node.scale1;
              objview.size = node.size;
              if (node.group) {
                let grp = myGoModel.findNode(node.group);
                objview.group = grp.objviewRef;
              } else {
                objview.group = "";
              }
              myModelview.addObjectView(objview);
              myDiagram.model.setDataProperty(node, "loc", node.loc);
              myDiagram.model.setDataProperty(node, "scale", node.scale1);
              const jsnObjview = new jsn.jsnObjectView(objview);
              if (jsnObjview) {
                uic.addItemToList(modifiedObjectViews, jsnObjview);
                if (debug) console.log('753 jsnObjview', jsnObjview);
              }
            }
            selcnt++;
          }
          myDiagram.requestUpdate();
        }
        if (false) {
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
        }
        // Handle relview points
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
        let jsnData = JSON.parse(JSON.stringify(jsnModelview));
        context.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', jsnData })
        }
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
          // Handle objects
          for (let it = selection?.iterator; it?.next();) {
            const sel = it.value;
            const data = sel.data;
            if (data.category === constants.gojs.C_OBJECT) {
              const key = data.key;
              const myNode = this.getNode(context.myGoModel, key);  // Get nodes !!!
              if (myNode) {
                uic.deleteNode(myNode, deletedFlag, context);
                const objRef = myNode.objRef;
                const object = myMetis.findObject(objRef);
                const jsnObject = new jsn.jsnObject(object);
                modifiedObjects.push(jsnObject);
                const objview = myMetis.findObjectView(myNode.objviewRef);
                const jsnObjview = new jsn.jsnObjectView(objview);
                modifiedObjectViews.push(jsnObjview);
              }
            }
          }
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
        }
        break;
      }
      case 'ExternalObjectsDropped': {
        e.subject.each(function (n) {
          const node = myDiagram.findNodeForKey(n.data.key);
          let type: akm.cxObjectType = n.data.objecttype;
          let typeview: akm.cxObjectTypeView = n.data.typeview;
          let objview: akm.cxObjectView;
          let objId: string;
          let object: akm.cxObject;
          if (!type || !typeview) {
            // An object has been dropped (but there is no objectview)
            type = myMetis.findObjectType(n.data.objtypeRef);
            typeview = myMetis.findObjectTypeView(n.data.objtypeviewRef);
            objId = n.data.objRef;
            object = myMetis.findObject(objId);
            myModel.addObject(object);
            myMetis.addObject(object);
            const key = utils.createGuid();
            objview = new akm.cxObjectView(key, n.data.name, object, object.description, myModelview);
            myModelview.addObjectView(objview);
            myMetis.addObjectView(objview);
            n.data.key = key;
          } else { 
            // An object type has been dropped - create an object
            // i.e. new objId, new objviewId, 
            const objName = n.data.object.name;
            const objDescr = n.data.object.description;
            type = myMetis.findObjectType(type.id);
            typeview = type.typeview;
            // Create a new object
            objId = utils.createGuid();
            object = new akm.cxObject(objId, objName, type, objDescr);
            myModel.addObject(object);
            myMetis.addObject(object);
            console.log('1241 node, data', node, n.data);
            // Find the objectview
            objview = myModelview.findObjectView(n.data.key);
            if (objview) {
              objview.object = object;
              objview.objectRef = object.id;
            }
          }
          let fillcolor = "";
          let strokecolor = "";
          let textcolor = "";
          let part = node.data;
          part.scale = node.scale;
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
            objview = uic.setObjviewColors(part, object, objview, typeview, myDiagram);
            objview.loc = part.loc;
            objview.viewkind = type.viewkind;
            objview.scale1 = part.scale;
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
            // Check if goNode is member of a group
            const group = uic.getGroupByLocation(myGoModel, goNode.loc, goNode.size, goNode);
            if (group) {
              const parentgroup = group;
              goNode.group = parentgroup.key;
              goNode.objectview.group = parentgroup.objviewRef;
              myDiagram.model.setDataProperty(part, "group", goNode.group);
              goNode.scale1 = new String(goNode.getMyScale(myGoModel));
              part.scale1 = Number(goNode.scale1);
            }
          }
          if (goNode) {
            goNode.object = null;
            goNode.objecttype = null;
            goNode.objectview = null;
          }
          const isLabel = (part.typename === 'Label');

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
          }
          node.updateTargetBindings();
        })
        for (let it = myDiagram.nodes; it?.next();) {
          const n = it.value;
          const data = n.data;
          if (data) {
            data.object = null;
            data.objectview = null;
            data.objecttype = null;
          }
        }
        if (debug) console.log('1242 myGoModel', myGoModel);
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
        console.log('1313 selected', data, sel);
        const object = myModel.findObject(data?.objRef);
        const objectview = myModelview.findObjectView(data?.key);
        console.log('1316 object, objectview', object, objectview);
        for (let it = myDiagram.nodes; it?.next();) {
          const n = it.value;
          const data = n.data;
          if (data.isSelected) {
            
            console.log('1319 goNode', data);
          }
        }

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
        console.log('1316 selected', data, sel);
        break;
      }
      case "PartResized": {
        let selection = e.diagram.selection
        for (let it = selection.iterator; it?.next();) {
          let n = it.value;
          if (n.data.isGroup) {
            let objview: akm.cxObjectView;
            objview = myModelview.findObjectView(n.data.key);
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
        // First remember the FROM locs
        const myFromNodes = myMetis.currentModel.args1;
        if (debug) console.log('1306 myMetis, myGoModel, myFromNodes', myMetis, myGoModel, myFromNodes);
        // Then do the paste
        const selection = e.subject;


        context.pasted = true;
        const pastedNodes = new Array();
        const myToNodes = [];
        let refloc, cnt = 0;
        let deltaX = 0, deltaY = 0;
        let objviews = [], nodes = [];
        const it = selection.iterator;
        while (it.next()) {
          let n = it.value;
          if (n instanceof go.Node) {
            const data = n.data;
            let obj = myMetis.findObject(data.objRef);
            if (obj) obj.id = utils.createGuid();
            let objview = myMetis.findObjectView(data.objviewRef);
            data.key = utils.createGuid();
            if (objview) objview.key = data.key;
            this.addToNode(myToNodes, n);
          } else {
            if (data.category === constants.gojs.C_OBJECT) {
              context.pasted = true;
              if (cnt == 0) {
                refloc = data.loc;
                cnt++;
              }
              let objview = myModelview.findObjectView(data.key);
              // let objview = uic.createObject(data, context);
              const node = myGoModel.findNode(data.key) as gjs.goObjectNode;
              let key = utils.createGuid();
              key = key.substr(0, 36);
              node.key = key;
              objview.id = key;
              // const node = new gjs.goObjectNode(key, objview);
              node.group = "";
              nodes.push(node);
              // Now remember the TO node
              const scale = node.getMyScale(myGoModel);
              // const myToNode = {
              //   "key": key,
              //   "name": data.name,
              //   "loc": new String(data.loc),
              //   "scale": new String(scale),
              //   "size": new String(data.size),
              //   "template": data.template,
              //   "figure": data.figure,
              //   "geometry": data.geometry,
              //   "fillcolor": data.fillcolor,
              //   "fillcolor2": data.fillcolor2,
              //   "strokecolor": data.strokecolor,
              //   "strokecolor2": data.strokecolor2,
              //   "strokewidth": data.strokewidth,
              //   "textscale": data.textscale,
              //   "textcolor": data.textcolor,
              //   "icon": data.icon,
              // }
              // myToNodes.push(myToNode);
              // objview.loc = myToNode.loc.valueOf();
              // if (deltaX == 0) deltaX = myToNode.loc.valueOf().x - refloc.x;
              // objview.size = myToNode.size.valueOf();
              if (objview) {
                objview.key = key;
                objview.group = "";              
                objviews.push(objview);
                node.loc = objview.loc;
                node.size = objview.size;
                const n = myGoModel.findNode(key);
                if (n) {
                  n.loc = objview.loc;
                  n.size = objview.size;
                }
              }
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
        context.link = link;
        context.data = data;
        context.goModel = myGoModel;
        if (debug) console.log('1498 link', link.data, link.data.from, link.data.to);

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
        let fromNode = myGoModel.findNodeByViewId(link.data.from);
        let toNode   = myGoModel.findNodeByViewId(link.data.to);
        // if (toNode && toNode instanceof gjs.goObjectNode) {
        //   toNode.loadNodeContent(myGoModel);
        //   myGoModel.addNode(toNode);
        // }

        // Handle relationship types
        if (fromNode?.category === constants.gojs.C_OBJECTTYPE) {
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
        if (fromNode?.category === constants.gojs.C_OBJECT) {
          data.category = constants.gojs.C_RELATIONSHIP;
          context.handleOpenModal = this.handleOpenModal;
          uic.createRelationship(fromNode, toNode, context);
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

      if (debug) console.log('1435 modifiedRelshipViews', modifiedRelshipViews);
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
    if (debug) console.log('1704 myMetis', myMetis);
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
