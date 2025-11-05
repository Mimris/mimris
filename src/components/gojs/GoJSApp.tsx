// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as go from 'gojs';
import * as React from 'react';
import Select, { components } from "react-select"
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { read } from 'fs';

import { DiagramWrapper } from './components/Diagram';
import { SelectionInspector } from './components/SelectionInspector';
import * as akm from '../../akmm/metamodeller';
import * as gjs from '../../akmm/ui_gojs';
import * as jsn from '../../akmm/ui_json';
import * as uic from '../../akmm/ui_common';
import * as uid from '../../akmm/ui_diagram';
import * as uim from '../../akmm/ui_modal';
import * as constants from '../../akmm/constants';
import * as utils from '../../akmm/utilities';
import { applyDropLayout, deriveDropLayoutConfig, applyDropLayoutToGroup } from './layout/DropLayoutManager';

const debug = false;
const linkToLink = false;

const systemtypes = ['Element', 'Entity', 'Property', 'Datatype', 'Method', 'Unittype',
  'Value', 'FieldType', 'InputPattern', 'ViewFormat',
  'Generic', 'Container'];

function buildDropLayoutOverridesFromMetis(myMetis) {
  const objectTypes = getObjectTypesForDropLayout(myMetis);
  if (!objectTypes.length) {
    return undefined;
  }

  const containerIds = [];
  const poolIds = [];
  const laneIds = [];
  const eventIds = [];
  const gatewayIds = [];
  const taskIds = [];

  const containerViewkind = normalizeToKey(constants.viewkinds && constants.viewkinds.CONT);
  const poolViewkind = normalizeToKey(constants.viewkinds && constants.viewkinds.POOL);
  const laneViewkind = normalizeToKey(constants.viewkinds && constants.viewkinds.LANE);

  for (let i = 0; i < objectTypes.length; i++) {
    const type = objectTypes[i];
    if (!type || type.markedAsDeleted) continue;
    const id = type.id;
    if (!id) continue;
    const viewkind = normalizeToKey(type.viewkind);
    const nameKey = normalizeToKey(type.name);
    const isContainerType =
      (containerViewkind && viewkind === containerViewkind) ||
      (typeof type.isContainer === 'function' && type.isContainer());
    if (isContainerType) {
      containerIds.push(id);
      continue;
    }
    if (poolViewkind && viewkind === poolViewkind) {
      poolIds.push(id);
      continue;
    }
    if (laneViewkind && viewkind === laneViewkind) {
      laneIds.push(id);
      continue;
    }
    if (nameKey.indexOf('gateway') !== -1 || nameKey.indexOf('gate') !== -1) {
      gatewayIds.push(id);
      continue;
    }
    const isEventType =
      nameKey.indexOf('event') !== -1 ||
      nameKey.indexOf('start') !== -1 ||
      nameKey === 'end' ||
      nameKey.endsWith(' end') ||
      nameKey.startsWith('end ');
    if (isEventType) {
      eventIds.push(id);
      continue;
    }
    if (
      nameKey.indexOf('task') !== -1 ||
      nameKey.indexOf('activity') !== -1 ||
      nameKey.indexOf('process') !== -1
    ) {
      taskIds.push(id);
      continue;
    }
  }

  const rules = [];

  const pools = uniqueStringValues(poolIds);
  if (pools.length) {
    rules.push({
      id: 'drop-rule-pools',
      order: -40,
      matchProperty: 'objtypeRef',
      matchValues: pools,
      anchor: 'dropPoint',
      layout: {
        pattern: 'grid',
        padding: 3,
        grid: {
          columns: 1,
          spacingX: 220,
          spacingY: 360,
          align: 'topLeft',
        },
      },
    });
  }

  const lanes = uniqueStringValues(laneIds);
  if (lanes.length) {
    rules.push({
      id: 'drop-rule-lanes',
      order: -35,
      matchProperty: 'objtypeRef',
      matchValues: lanes,
      anchor: 'dropPoint',
      layout: {
        pattern: 'grid',
        padding: 2,
        grid: {
          columns: 1,
          spacingX: 140,
          spacingY: 260,
          align: 'topLeft',
        },
      },
    });
  }

  const containers = uniqueStringValues(containerIds);
  if (containers.length) {
    rules.push({
      id: 'drop-rule-containers',
      order: -30,
      matchProperty: 'objtypeRef',
      matchValues: containers,
      anchor: 'dropPoint',
      layout: {
        pattern: 'grid',
        padding: 2,
        grid: {
          columns: 2,
          spacingX: 240,
          spacingY: 200,
          align: 'center',
        },
      },
    });
  }

  const gateways = uniqueStringValues(gatewayIds);
  if (gateways.length) {
    rules.push({
      id: 'drop-rule-gateways',
      order: 5,
      matchProperty: 'objtypeRef',
      matchValues: gateways,
      layout: {
        pattern: 'circle',
        circle: {
          radius: 140,
          radiusStep: 40,
          startAngle: -90,
          clockwise: true,
        },
      },
    });
  }

  const events = uniqueStringValues(eventIds);
  if (events.length) {
    rules.push({
      id: 'drop-rule-events',
      order: 10,
      matchProperty: 'objtypeRef',
      matchValues: events,
      layout: {
        pattern: 'circle',
        circle: {
          radius: 110,
          radiusStep: 30,
          startAngle: -90,
          clockwise: true,
        },
      },
    });
  }

  const tasks = uniqueStringValues(taskIds);
  if (tasks.length) {
    rules.push({
      id: 'drop-rule-tasks',
      order: 20,
      matchProperty: 'objtypeRef',
      matchValues: tasks,
      anchor: 'dropPoint',
      layout: {
        pattern: 'grid',
        grid: {
          columns: 4,
          spacingX: 200,
          spacingY: 160,
          align: 'center',
        },
      },
    });
  }

  if (!rules.length) {
    if (!pools.length && !lanes.length && !containers.length) {
      return undefined;
    }
  }

  return {
    rules,
    metadata: {
      poolTypeIds: pools,
      laneTypeIds: lanes,
      containerTypeIds: containers,
      poolPadding: 80,
    },
  };
}

function getObjectTypesForDropLayout(myMetis) {
  if (!myMetis) {
    return [];
  }
  if (typeof myMetis.getObjectTypes === 'function') {
    const types = myMetis.getObjectTypes();
    if (Array.isArray(types)) {
      return types.slice();
    }
  }
  if (Array.isArray(myMetis.objecttypes)) {
    return myMetis.objecttypes.slice();
  }
  const metamodel = myMetis.currentMetamodel;
  if (metamodel && typeof metamodel.getObjectTypes === 'function') {
    const metaTypes = metamodel.getObjectTypes();
    if (Array.isArray(metaTypes)) {
      return metaTypes.slice();
    }
  }
  return [];
}

function uniqueStringValues(values) {
  const result = [];
  const seen = Object.create(null);
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value === undefined || value === null) continue;
    const key = String(value);
    if (seen[key]) continue;
    seen[key] = true;
    result.push(key);
  }
  result.sort();
  return result;
}

function normalizeToKey(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim().toLowerCase();
}

function getNodeTypeRef(node) {
  if (!node || !node.data) {
    return undefined;
  }
  const data = node.data;
  return (
    data.objtypeRef ||
    data.typeRef ||
    (data.objecttype && (data.objecttype.typeRef || data.objecttype.id)) ||
    (data.object && (data.object.typeRef || (data.object.type && data.object.type.id))) ||
    (data.type && data.type.id) ||
    (data.objtype && data.objtype.id) ||
    data.objTypeRef ||
    undefined
  );
}

function getNodeKey(node) {
  if (!node) {
    return undefined;
  }
  if (node.data && node.data.key !== undefined && node.data.key !== null) {
    return node.data.key;
  }
  if (node.key !== undefined && node.key !== null) {
    return node.key;
  }
  return undefined;
}

function getGroupKeyFromData(data) {
  if (!data) {
    return null;
  }
  const groupKey = data.group;
  if (groupKey === undefined || groupKey === null) {
    return null;
  }
  return groupKey;
}

function getSizeOptionsForType(typeName: string | undefined | null) {
  if (!typeName) {
    return undefined;
  }
  const normalized = typeName.toString().toLowerCase();
  switch (normalized) {
    case 'pool':
      return { minWidth: 1600, minHeight: 900 };
    case 'lane':
      return { minWidth: 1400, minHeight: 260 };
    default:
      return undefined;
  }
}

interface CenterNodeOptions {
  offset?: { x?: number; y?: number };
  padding?: number;
  fillParent?: boolean;
}

function centerNodeInGroup(
  diagram: go.Diagram | null,
  node: go.Node | null,
  groupKey: string | number | null,
  options?: CenterNodeOptions
): void {
  if (!diagram || !node || groupKey === null || groupKey === undefined) {
    return;
  }
  const group = diagram.findNodeForKey(groupKey);
  if (!(group instanceof go.Group)) {
    return;
  }
  const bounds = group.actualBounds;
  if (!bounds) {
    return;
  }
  if (node?.data) {
    const existingFill = node.data.fillcolor || node.data.fill || node.data.color;
    const validFill = existingFill && go.Brush.isValidColor(existingFill)
      ? existingFill
      : '#ffffff';
    if (typeof diagram.model.setDataProperty === 'function') {
      diagram.model.setDataProperty(node.data, 'fillcolor', validFill);
    } else {
      node.data.fillcolor = validFill;
    }
  }
  const padding = options?.padding ?? 20;
  const offsetX = options?.offset?.x ?? 0;
  const offsetY = options?.offset?.y ?? 0;
  const nodeSizeData = parseSizeString(node?.data?.size);

  let desiredWidth: number;
  let desiredHeight: number;

  if (options?.fillParent) {
    desiredWidth = Math.max(0, bounds.width - padding * 2);
    desiredHeight = Math.max(0, bounds.height - padding * 2);
  } else {
    desiredWidth =
      nodeSizeData?.width ??
      Math.max(0, bounds.width - padding * 2);
    desiredHeight = nodeSizeData?.height ?? 200;
  }

  const centerX = bounds.centerX + offsetX;
  const centerY = bounds.centerY + offsetY;
  const locPoint = new go.Point(centerX, centerY);
  if (typeof diagram.model.setDataProperty === 'function' && node.data) {
    diagram.model.setDataProperty(node.data, 'loc', go.Point.stringify(locPoint));
  } else if (node.data) {
    node.data.loc = go.Point.stringify(locPoint);
  }
  node.location = locPoint;
  const resizeObj = node.resizeObject || node.reshapeObject || node;
  if (resizeObj) {
    resizeObj.desiredSize = new go.Size(desiredWidth, desiredHeight);
  }
  if (node.data) {
    const sizeString = `${desiredWidth} ${desiredHeight}`;
    if (typeof diagram.model.setDataProperty === 'function') {
      diagram.model.setDataProperty(node.data, 'size', sizeString);
    } else {
      node.data.size = sizeString;
    }
  }
  node.ensureBounds();
}

function parseSizeString(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const parts = value
    .split(/[\s,]+/)
    .map(token => parseFloat(token))
    .filter(num => !isNaN(num));
  if (parts.length >= 2) {
    return { width: parts[0], height: parts[1] };
  }
  return null;
}

function ensureInitialGroupSize(diagram, node, data, options) {
  if (!data) {
    return;
  }
  const defaults = { minWidth: 1000, minHeight: 600 };
  const merged = { ...defaults, ...(options || {}) };
  let minWidth = merged.minWidth;
  let minHeight = merged.minHeight;
  const parsed = parseSizeString(data.size);
  let width = parsed?.width ?? 0;
  let height = parsed?.height ?? 0;

  if (width >= minWidth && height >= minHeight) {
    return;
  }

  if (width < minWidth) {
    width = minWidth;
  }
  if (height < minHeight) {
    height = minHeight;
  }

  const sizeString = `${width} ${height}`;
  if (typeof diagram?.model?.setDataProperty === 'function') {
    if (data.size !== sizeString) {
      diagram.model.setDataProperty(data, 'size', sizeString);
    }
    diagram.model.setDataProperty(data, 'desiredSize', sizeString);
  } else {
    data.size = sizeString;
    data.desiredSize = sizeString;
  }

  if (node instanceof go.Part) {
    const desired = new go.Size(width, height);
    const resizeObj = node.resizeObject || node.reshapeObject || node;
    if (resizeObj) {
      resizeObj.desiredSize = desired;
    } else {
      node.desiredSize = desired;
    }
    node.ensureBounds();
  }
}

function ensureNodeIsGroup(diagram, node) {
  if (!diagram || !node || !node.data) {
    return;
  }
  if (node.data.isGroup) {
    return;
  }
  node.data.isGroup = true;
  node.isSubGraphExpanded = true;
}

function setNodeGroup(diagram, node, groupKey) {
  if (!diagram || !node || !node.data) {
    return;
  }
  const normalizedKey = groupKey === undefined ? null : groupKey;
  const currentKey = getGroupKeyFromData(node.data);
  if (currentKey === normalizedKey) {
    return;
  }
  const model = diagram.model;
  if (model && typeof model.setGroupKeyForNodeData === 'function') {
    model.setGroupKeyForNodeData(node.data, normalizedKey);
  } else if (model && typeof model.setDataProperty === 'function') {
    model.setDataProperty(node.data, 'group', normalizedKey);
  } else {
    node.data.group = normalizedKey;
  }
}

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
    const initialDropLayout = buildDropLayoutOverridesFromMetis(this.props?.myMetis);
    this.state = {
      nodeDataArray: this.props?.nodeDataArray,
      linkDataArray: this.props?.linkDataArray,
      modelData: {
        canRelink: true,
        ...(initialDropLayout ? { dropLayout: initialDropLayout } : {})
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

  public componentDidUpdate() {
    const nextDropLayout = buildDropLayoutOverridesFromMetis(this.props?.myMetis);
    const currentDropLayout = this.state?.modelData?.dropLayout;
    const currentSerialized = currentDropLayout ? JSON.stringify(currentDropLayout) : '';
    const nextSerialized = nextDropLayout ? JSON.stringify(nextDropLayout) : '';
    if (nextSerialized !== currentSerialized) {
      this.setState(state => {
        const updatedModelData = { ...(state.modelData || {}) };
        if (nextDropLayout) {
          updatedModelData.dropLayout = nextDropLayout;
        } else if (updatedModelData.dropLayout) {
          delete updatedModelData.dropLayout;
        }
        return { modelData: updatedModelData };
      });
    }
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
    const data = gjsLink.data;
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
      data: data,
      metamodel: modalContext.myMetamodel,
      typename: typename,
      fromType: modalContext.fromType,
      toType: modalContext.toType,
      nodeFrom: modalContext.nodeFrom,
      nodeTo: modalContext.nodeTo,
      fromPort: data.fromPort,
      toPort: data.toPort,
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
      "scale": Number(n.data.scale),
      "size": new String(n.data.size),
      "template": n.data.template,
      "figure": n.data.figure,
      "geometry": n.data.geometry,
      "fillcolor": n.data.fillcolor,
      "fillcolor2": n.data.fillcolor2,
      "strokecolor": n.data.strokecolor,
      "strokecolor2": n.data.strokecolor2,
      "textcolor": n.data.textcolor,
      "strokewidth": Number(n.data.strokewidth),
      "textscale": Number(n.data.textscale),
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
      // "askForRelshipName": myModelview?.askForRelshipName,
      "askForRelshipName": false,
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
        for (let i = 0; i < objviews?.length; i++) {
          const objview = objviews[i];
          if (!objview.typeview) {
            const obj = myModel.findObject(objview.objectRef);
            if (obj) {
              const objtype = myMetamodel.findObjectType(obj.typeRef);
              if (objtype) {
                const typeview = myMetamodel.findObjectTypeView(objtype.typeviewRef);
                objview.typeview = typeview;
                objview.typeviewRef = typeview?.id;
              }
            }
          }
        }
        const focusObjectView  = myMetis.currentModelview?.focusObjectview;
        if (true) {
        for (let i = 0; i < objviews?.length; i++) {
          let resetToTypeview = true;
          let isGroup = false;
          const objview = objviews[i];
          if (objview.isGroup) {
            isGroup = true;
          }
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
                data.scale = Number(goNode.scale);
                if (debug) console.log('300 objview, goNode, node: ', objview, goNode, n, data);
                data.textcolor = 'black';
              }
            }
            const gjsNode = myDiagram.findNodeForKey(goNode?.key)
            if (gjsNode) {
              if (goNode.scale) gjsNode.scale = Number(goNode.scale);
              if (isGroup) gjsNode.expandTree();
            }
          }
          // Set focus object view
          if (objview.id === focusObjectView?.id) {
            const node = myGoModel.findNodeByViewId(objview.id);
            if (node) {
              const gjsNode = myDiagram.findNodeForKey(node?.key)
              myDiagram.select(gjsNode);
            }
          }
        }
        }

        if (debug) console.log("End: After Reload:");
        const links = myDiagram.links;
        if (links.count > 0) {
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
            //node.scale = Number(data.scale);
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
          const linksToRemove = [];
          const links = myDiagram.links;
          for (let it = links.iterator; it?.next();) 
            {
            const link = it.value;
            const data = link.data;
            if (data.category === "Relationship") {
              let relview: akm.cxRelationshipView = data.relshipview;
              relview = myModelview.findRelationshipView(data.key);
              if (!relview)
                relview = myMetis.findRelationshipView(data.key);
              if (relview) {
                relview.markedAsDeleted = data.markedAsDeleted;
                if (relview.visible === false) {
                  linksToRemove.push(link);
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
          for (let i=0; i<linksToRemove.length; i++) {
            const link = linksToRemove[i];
            myDiagram.remove(link);
          }
        }
        break;
      }
      case 'TextEdited': {
        const sel = e.subject.part;
        const gjsData = sel.data;
        let textvalue = gjsData.name;
        if (gjsData.typename === 'Label'){
          textvalue = gjsData.text;
        }
        let field = e.subject.name;
        if (field === "") field = "name";
        // Object type or Object
        if (sel instanceof go.Node) {
          const key: string = gjsData.key;
          const goNode = myGoModel.findNode(key);
          let text: string = textvalue;
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
                      if (gjsNodeData) {
                        gjsNodeData.text = textvalue;
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
        let objectviews = myModelview.objectviews;
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
          let scale = Number(objectview.scale);
          if (!scale) scale = 1.0;
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
            "scale": scale,
            "object": object,
            "objectview": objectview,
          }
          myFromNodes.push(myFromNode);
        }
        // Then remember the new locs
        let myToNodes = [];
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
            goNode.scale = 1.0; 
          } else {
            groupKey = group.key;
            goNode.group = groupKey;
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
            "scale": Number(goNode.scale),
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
                goToNode.loc = myToNode.loc;
                goToNode.size = myToNode.size;
                goToNode.scale = myToNode.scale;
              }
              // Check if the MOVED node (goToNode) is member of a group
              const goParentGroup = uic.getGroupByLocation(myGoModel, goToNode.loc, goToNode.size, goToNode);
              let parentObjview = goParentGroup?.objectview; // The container objectview
              if (!parentObjview) {
                parentObjview = myModelview.findObjectView(goParentGroup?.key);
              }
              if (goParentGroup && parentObjview) { // the container (group)
                // goToNode IS member of a group
                // First handle the object (node)
                const gjsPart = myToNode.gjsData; // The object (node) to be moved
                goToNode.group = goParentGroup.key; // Make the node a member of the group (container)
                parentObjview.isExpanded = true;
                myObjectview.group = goParentGroup.key;
                myDiagram.model.setDataProperty(gjsPart, "group", goToNode.group);
                goToNode.scale = goToNode.getMyScale(myGoModel);
                gjsPart.scale = Number(goToNode.scale);
                myObjectview.scale = gjsPart.scale;
                let loc = uic.scaleNodeLocation1(goParentGroup, goToNode);
                if (loc) {
                  myToNode.loc = loc;
                  myToNode.gjsData.loc = loc;
                  goToNode.loc = myToNode.loc;
                  myObjectview.loc = myToNode.loc;
                  myDiagram.model.setDataProperty(myToNode.n, "loc", myToNode.loc);
                }
                myDiagram.model.setDataProperty(myToNode.n, "scale", gjsPart.scale);
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
                    if (true && fromObjview?.isGroup) {
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
                          || reltype.name === constants.types.AKM_HAS_PART
                          || reltype.name === constants.types.AKM_CONTAINS) {
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
                let scale = Number(goToNode.scale); // Not part of group
                if (!scale || scale === 0) scale = 1.0;
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
        { // links
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
        if (myDiagram) {
          const toolManager = myDiagram.toolManager;
          const activeTool = toolManager.currentTool;
          if (activeTool && activeTool.isActive) {
            if (activeTool instanceof go.DraggingTool) {
              activeTool.stopTool();
            } else if (typeof activeTool.doCancel === 'function') {
              activeTool.doCancel();
            }
          }
          const dropDragTool = toolManager.draggingTool;
          if (dropDragTool && dropDragTool.isActive) {
            dropDragTool.stopTool();
          }
          const dropDraggedParts = dropDragTool?.draggedParts;
          if (dropDraggedParts?.count > 0) {
            dropDraggedParts.clear();
          }
          const dropCopiedParts = dropDragTool?.copiedParts;
          if (dropCopiedParts?.count > 0) {
            dropCopiedParts.clear();
          }
          // myDiagram.toolManager.draggingTool.reset();
          myDiagram.toolManager.currentTool = myDiagram.defaultTool;
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
          // Handle relationships
          for (let it = selection?.iterator; it?.next();) {
            const sel = it.value;
            const data = sel.data;
            const key = data.key;
            if (data.category === constants.gojs.C_RELATIONSHIP) {
              const relview = myModelview.findRelationshipView(key);
              if (relview && relview.category === constants.gojs.C_RELSHIPVIEW) {
                relview.markedAsDeleted = deletedFlag;
                const relship = relview.relship;
                if (myMetis.deleteViewsOnly)
                  relship.markedAsDeleted = false;
                else
                  relship.markedAsDeleted = deletedFlag;
                const jsnRelship = new jsn.jsnRelationship(relship);
                modifiedRelships.push(jsnRelship);
                const jsnRelview = new jsn.jsnRelshipView(relview);
                modifiedRelshipViews.push(jsnRelview);
              }
            }
          }
          const relshipviews = myModelview.relshipviews;
          for (let i=0; i<relshipviews.length; i++) {
            const relview = relshipviews[i];
            if (relview.markedAsDeleted) {
              const gjsData = myDiagram.findNodeForKey(relview.id);
              if (gjsData) 
                uic.deleteLink(gjsData, true, context);
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
                if (object) {
                  object.markedAsDeleted = !myMetis.deleteViewsOnly;
                  objview.markedAsDeleted = true;
                  const jsnObject = new jsn.jsnObject(object);
                  modifiedObjects.push(jsnObject);
                  const jsnObjview = new jsn.jsnObjectView(objview);
                  modifiedObjectViews.push(jsnObjview);
                }
              }
            }
          }
        }
        for (let i=0; i<modifiedObjectViews.length; i++) {
          const objview = modifiedObjectViews[i];
          if (objview.markedAsDeleted) {
            const myNode = this.getNode(context.myGoModel, objview.id);  
            if (myNode) {
                uic.deleteNode(myNode, deletedFlag, context);
              }
            }
        }
        break;
      }
      case 'ExternalObjectsDropped': {
        const droppedRelLinks: go.ObjectData[] = [];
        const droppedNodesForLayout: go.Node[] = [];
        const poolNodes: go.Node[] = [];
        const poolKeys: Array<string | number> = [];
        const nodeIterator = e.subject.iterator;
        while (nodeIterator?.next()) {
          const part = nodeIterator.value;
          if (part instanceof go.Node) {
            droppedNodesForLayout.push(part);
          }
        }

        if (droppedNodesForLayout.length > 1) {
          const primaryDiagram = e.diagram || myDiagram;
          const dropPoint =
            primaryDiagram?.lastInput?.documentPoint?.copy() ||
            myDiagram?.lastInput?.documentPoint?.copy() ||
            null;

          const modelData = (myDiagram?.model as any)?.modelData ?? {};
          const dropOverrides = modelData?.dropLayout && typeof modelData.dropLayout === 'object'
            ? modelData.dropLayout
            : undefined;
          const presetName = dropOverrides?.preset ?? myModelview?.layout;
          const layoutConfig = deriveDropLayoutConfig(presetName, dropOverrides);

          const metadata = layoutConfig?.metadata || {};
          const poolTypeIds = Array.isArray(metadata.poolTypeIds) ? metadata.poolTypeIds : [];
          const laneTypeIds = Array.isArray(metadata.laneTypeIds) ? metadata.laneTypeIds : [];
          const containerTypeIds = Array.isArray(metadata.containerTypeIds) ? metadata.containerTypeIds : [];
          if (myDiagram) {
            const shouldCommitGrouping = !myDiagram.isInTransaction;
            if (shouldCommitGrouping) {
              myDiagram.startTransaction('assign-drop-groups');
            }
            try {
              const laneNodes: go.Node[] = [];
              const containerNodes: go.Node[] = [];
              const otherNodes: go.Node[] = [];

              for (let i = 0; i < droppedNodesForLayout.length; i++) {
                const node = droppedNodesForLayout[i];
                const typeRef = getNodeTypeRef(node);
                const data: any = node?.data || {};
                const viewkind = (data.viewkind || data.viewKind || '').toString().toLowerCase();
                const templateName = (data.template || data.category || '').toString().toLowerCase();
                const name = (data.name || '').toString().toLowerCase();
                const isPool =
                  (typeRef && poolTypeIds.includes(typeRef)) ||
                  viewkind === 'pool' ||
                  templateName.includes('pool') ||
                  name.includes('pool');
                if (isPool) {
                  poolNodes.push(node);
                  continue;
                }
                const isLane =
                  (typeRef && laneTypeIds.includes(typeRef)) ||
                  viewkind === 'lane' ||
                  templateName.includes('lane') ||
                  name.includes('lane');
                if (isLane) {
                  laneNodes.push(node);
                  continue;
                }
                const isContainer =
                  (typeRef && containerTypeIds.includes(typeRef)) ||
                  viewkind === 'container' ||
                  templateName.includes('container');
                if (isContainer) {
                  containerNodes.push(node);
                  continue;
                }
                otherNodes.push(node);
              }

              if (poolNodes.length) {
                const uniquePoolKeys = new Set<string | number>();
                for (let i = 0; i < poolNodes.length; i++) {
                  const poolNode = poolNodes[i];
                  ensureNodeIsGroup(myDiagram, poolNode);
                  const poolKey = getNodeKey(poolNode);
                  if (poolKey !== undefined && poolKey !== null && !uniquePoolKeys.has(poolKey)) {
                    uniquePoolKeys.add(poolKey);
                    poolKeys.push(poolKey);
                  }
                }

              if (poolKeys.length) {
                  for (let i = 0; i < laneNodes.length; i++) {
                    const laneNode = laneNodes[i];
                    ensureNodeIsGroup(myDiagram, laneNode);
                    const existing = getGroupKeyFromData(laneNode?.data);
                    const poolKey = poolKeys[i % poolKeys.length];
                    if (existing === null || existing === undefined) {
                      setNodeGroup(myDiagram, laneNode, poolKey);
                    }
                    centerNodeInGroup(myDiagram, laneNode, poolKey, {
                      fillParent: true,
                      padding: 20,
                    });
                  }

                  const laneKeys: Array<string | number> = [];
                  const laneKeySet = new Set<string | number>();
                  for (let i = 0; i < laneNodes.length; i++) {
                    const laneKey = getNodeKey(laneNodes[i]);
                    if (laneKey !== undefined && laneKey !== null && !laneKeySet.has(laneKey)) {
                      laneKeySet.add(laneKey);
                      laneKeys.push(laneKey);
                    }
                  }

                  for (let i = 0; i < containerNodes.length; i++) {
                    const containerNode = containerNodes[i];
                    ensureNodeIsGroup(myDiagram, containerNode);
                    const existing = getGroupKeyFromData(containerNode?.data);
                    if (existing !== null && existing !== undefined) {
                      continue;
                    }
                    const poolKey = poolKeys[i % poolKeys.length];
                    setNodeGroup(myDiagram, containerNode, poolKey);
                  }

                  for (let i = 0; i < otherNodes.length; i++) {
                    const node = otherNodes[i];
                    const existing = getGroupKeyFromData(node?.data);
                    if (existing !== null && existing !== undefined) {
                      continue;
                    }
                    let assignedKey = null;
                    if (laneKeys.length) {
                      assignedKey = laneKeys[i % laneKeys.length];
                    } else if (poolKeys.length) {
                      assignedKey = poolKeys[i % poolKeys.length];
                    }
                    if (assignedKey !== null && assignedKey !== undefined) {
                      setNodeGroup(myDiagram, node, assignedKey);
                    }
                  }
                }
              }
            } finally {
              if (shouldCommitGrouping && myDiagram.isInTransaction) {
                myDiagram.commitTransaction('assign-drop-groups');
              }
            }
          }

        const buckets = new Map<
          string,
          { nodes: go.Node[]; targetGroup: go.Group | null; groupKey: string | number | null }
        >();

          for (let i = 0; i < droppedNodesForLayout.length; i++) {
            const node = droppedNodesForLayout[i];
            const groupKey = getGroupKeyFromData(node?.data);
            const bucketKey = groupKey === null ? '__drop-root__' : String(groupKey);
            if (!buckets.has(bucketKey)) {
              const groupPart =
                groupKey !== null && myDiagram
                  ? myDiagram.findNodeForKey(groupKey)
                  : null;
              buckets.set(bucketKey, {
                nodes: [],
                targetGroup: groupPart instanceof go.Group ? groupPart : null,
                groupKey: groupKey,
              });
            }
            const bucket = buckets.get(bucketKey);
            if (bucket) {
              bucket.nodes.push(node);
            }
          }

          const bucketList = Array.from(buckets.values());
          const groupsForFollowUp = new Set<go.Group>();
          bucketList.sort((a, b) => {
            const aRoot = a.groupKey === null || a.groupKey === undefined;
            const bRoot = b.groupKey === null || b.groupKey === undefined;
            if (aRoot && !bRoot) return -1;
            if (!aRoot && bRoot) return 1;
            return 0;
          });

          for (let i = 0; i < bucketList.length; i++) {
            const bucket = bucketList[i];
            if (!bucket.nodes.length) continue;
            let bucketDropPoint: go.Point | null = null;
            if (bucket.targetGroup && bucket.targetGroup.actualBounds) {
              const bounds = bucket.targetGroup.actualBounds;
              if (bounds && bounds.center) {
                bucketDropPoint = bounds.center.copy();
              }
            }
            if (!bucketDropPoint && dropPoint) {
              bucketDropPoint = dropPoint.copy ? dropPoint.copy() : dropPoint;
            }
            applyDropLayout({
              diagram: myDiagram,
              parts: bucket.nodes,
              dropPoint: bucketDropPoint,
              config: layoutConfig,
              targetGroup: bucket.targetGroup,
            });
            if (bucket.targetGroup instanceof go.Group) {
              groupsForFollowUp.add(bucket.targetGroup);
              const container = bucket.targetGroup.containingGroup;
              if (container instanceof go.Group) {
                groupsForFollowUp.add(container);
              }
            }
          }

          groupsForFollowUp.forEach(group => {
            applyDropLayoutToGroup(myDiagram, group);
            if (group.containingGroup instanceof go.Group) {
              applyDropLayoutToGroup(myDiagram, group.containingGroup);
            }
          });

        }

        const applyGroupTemplateToDiagram = (part: go.Node | null, template: string | null) => {
          if (!myDiagram || !part || !template) return;
          myDiagram.startTransaction('apply-drop-group-template');
          try {
            const data = part.data;
            if (!data) return;
            data.isGroup = true;
            data.viewkind = constants.viewkinds.CONT;
            data.template = template;
            if (typeof myDiagram.model.setCategoryForNodeData === 'function') {
              myDiagram.model.setCategoryForNodeData(data, template);
            } else {
              myDiagram.model.setDataProperty(data, 'category', template);
            }
            myDiagram.model.updateTargetBindings(data);
            part.updateTargetBindings();
            part.ensureBounds();
          } finally {
            myDiagram.commitTransaction('apply-drop-group-template');
          }
          myDiagram.layoutDiagram(true);
        };
        const clearGroupTemplateFromDiagram = (part: go.Node | null) => {
          if (!myDiagram || !part) return;
          myDiagram.startTransaction('revert-drop-to-node');
          try {
            const data = part.data;
            if (!data) return;
            data.isGroup = false;
            data.viewkind = constants.viewkinds.OBJ;
            data.template = data.template || constants.gojs.C_NODETEMPLATE;
            myDiagram.model.setCategoryForNodeData(data, data.template || constants.gojs.C_NODETEMPLATE);
            myDiagram.model.updateTargetBindings(data);
            part.updateTargetBindings();
            part.ensureBounds();
          } finally {
            myDiagram.commitTransaction('revert-drop-to-node');
          }
          myDiagram.layoutDiagram(true);
        };
        e.subject.each(function (n) {
          const partData = n?.data;
          if (!partData) {
            return;
          }
          if (n instanceof go.Link) {
            droppedRelLinks.push(partData);
            return;
          }
          const node = partData.key !== undefined ? myDiagram.findNodeForKey(partData.key) : null;
          const diagramNode = n instanceof go.Node ? n : node instanceof go.Node ? node : null;
          const gjsNode = node?.data || partData;
          let type: akm.cxObjectType = partData.objecttype;
          let typeview: akm.cxObjectTypeView = partData.typeview;
          let objview: akm.cxObjectView;
          let objId: string;
          let object: akm.cxObject;
          let objName: string;
          let objDescr: string;
          if (!type || !typeview) { // An object has been dropped (dragged from object palette)
            const resolvedType = partData.objtypeRef ? myMetis.findObjectType(partData.objtypeRef) : null;
            if (resolvedType) {
              type = resolvedType;
            }
            if (!type) {
              return;
            }
            typeview = type.typeview || typeview || partData.typeview;
            if (!typeview && typeof (type as any)?.getDefaultTypeView === 'function') {
              typeview = (type as any).getDefaultTypeView();
            }
            if (!typeview) {
              return;
            }
            objId = partData.objRef;
            object = myMetis.findObject(objId);
            if (object) {
              myModel.addObject(object);
              const key = partData.key;
              objview = new akm.cxObjectView(key, partData.name, object, object.description, myModelview);
              const isContainer = Boolean(
                partData.viewkind === constants.viewkinds.CONT ||
                type?.viewkind === constants.viewkinds.CONT ||
                (typeof (type as any)?.isContainer === 'function' && (type as any).isContainer())
              );
              objview.isGroup = isContainer;
              objview.viewkind = isContainer ? constants.viewkinds.CONT : constants.viewkinds.OBJ;
              const templateName =
                partData.template ||
                partData.category ||
                (isContainer ? constants.gojs.C_CONTAINER : constants.gojs.C_NODETEMPLATE);
              const typeName = type?.name || objview?.object?.type?.name;
              partData.isGroup = isContainer;
              if (isContainer) {
                partData.viewkind = constants.viewkinds.CONT;
              } else if (!partData.viewkind || partData.viewkind === constants.viewkinds.CONT) {
                partData.viewkind = constants.viewkinds.OBJ;
              }
              if (diagramNode) {
                diagramNode.isGroup = isContainer;
                if (diagramNode.data) {
                  diagramNode.data.isGroup = isContainer;
                }
              }
              if (isContainer) {
                if (typeof myDiagram?.model?.setCategoryForNodeData === 'function') {
                  myDiagram.model.setCategoryForNodeData(partData, templateName);
                } else {
                  partData.category = templateName;
                }
                if (diagramNode?.data) {
                  diagramNode.data.category = templateName;
                }
                ensureInitialGroupSize(
                  myDiagram,
                  diagramNode,
                  partData,
                  getSizeOptionsForType(typeName)
                );
              } else {
                if (typeof myDiagram?.model?.setCategoryForNodeData === 'function') {
                  myDiagram.model.setCategoryForNodeData(
                    partData,
                    templateName || constants.gojs.C_NODETEMPLATE
                  );
                } else if (templateName) {
                  partData.category = templateName;
                }
                if (diagramNode?.data && (templateName || constants.gojs.C_NODETEMPLATE)) {
                  diagramNode.data.category = templateName || constants.gojs.C_NODETEMPLATE;
                }
              }
              objview.size = partData.size;
              objview = uic.setObjviewColors(partData, object, objview, typeview, myDiagram);
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
              if (isContainer) {
                applyGroupTemplateToDiagram(diagramNode, templateName);
              } else {
                clearGroupTemplateFromDiagram(diagramNode);
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
            }
            if (objview && object) {
              const objvIdName = { id: objview.id, name: objview.name };
              const objIdName = { id: object.id, name: object.name };
              myDiagram.dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: objvIdName });
              myDiagram.dispatch({ type: 'SET_FOCUS_OBJECT', data: objIdName });
            }
          } else { // An object type has been dropped - create an object
            // i.e. new object, new objectview, 
            objName = node?.data?.object?.name
              || partData.object?.name
              || partData.name
              || type?.name;
            if (!objName || objName?.trim().length === 0) {
              objName = type?.name || 'Object';
            }
            objDescr = node?.data?.object?.description
              || partData.object?.description
              || partData.description
              || type?.description
              || '';
            type = myMetis.findObjectType(type?.id);
            typeview = type?.typeview || typeview || partData.typeview;
            if (type.name === 'Datatype' && objName === 'Datatype') {
              let found = true;
              while (found) {
                objName = 'datatype' + Math.floor(Math.random() * 100);
                found = myMetis.findDatatype(objName);
              }
              if (!found)
                objName = prompt("Enter Datatype name;", objName);
              partData.name = objName;
            }
            // Create a new object
            objId = utils.createGuid();
            object = new akm.cxObject(objId, objName, type, objDescr);
            object.parentModelRef = myModel.id;
            myModel.addObject(object);
            myMetis.addObject(object);
            console.log('1241 node, data', node, partData);
            // Find the objectview
            objview = myModelview.findObjectView(partData.key);
            if (!objview) {
              objview = new akm.cxObjectView(partData.key, partData.name, object, partData.description, myModelview);
              const isContainer = Boolean(
                partData.viewkind === constants.viewkinds.CONT ||
                type?.viewkind === constants.viewkinds.CONT ||
                (typeof (type as any)?.isContainer === 'function' && (type as any).isContainer())
              );
              objview.isGroup = isContainer;
              const typeName = type?.name || objview?.object?.type?.name;
              const templateName =
                partData.template ||
                partData.category ||
                (isContainer ? constants.gojs.C_CONTAINER : constants.gojs.C_NODETEMPLATE);
              partData.isGroup = isContainer;
              if (isContainer) {
                partData.viewkind = constants.viewkinds.CONT;
              } else if (!partData.viewkind || partData.viewkind === constants.viewkinds.CONT) {
                partData.viewkind = constants.viewkinds.OBJ;
              }
              if (diagramNode) {
                diagramNode.isGroup = isContainer;
                if (diagramNode.data) {
                  diagramNode.data.isGroup = isContainer;
                }
              }
              if (isContainer) {
                if (typeof myDiagram?.model?.setCategoryForNodeData === 'function') {
                  myDiagram.model.setCategoryForNodeData(partData, templateName);
                } else {
                  partData.category = templateName;
                }
                if (diagramNode?.data) {
                  diagramNode.data.category = templateName;
                }
                ensureInitialGroupSize(
                  myDiagram,
                  diagramNode,
                  partData,
                  getSizeOptionsForType(typeName)
                );
              } else {
                if (typeof myDiagram?.model?.setCategoryForNodeData === 'function') {
                  myDiagram.model.setCategoryForNodeData(
                    partData,
                    templateName || constants.gojs.C_NODETEMPLATE
                  );
                } else if (templateName) {
                  partData.category = templateName;
                }
                if (diagramNode?.data && (templateName || constants.gojs.C_NODETEMPLATE)) {
                  diagramNode.data.category = templateName || constants.gojs.C_NODETEMPLATE;
                }
              }
              objview.objectRef = object.id;
              object.addObjectView(objview);
              myModelview.addObjectView(objview);
              myMetis.addObjectView(objview);
              if (isContainer) {
                applyGroupTemplateToDiagram(diagramNode, templateName);
              } else {
                clearGroupTemplateFromDiagram(diagramNode);
              }
            }
            myModelview.setFocusObjectview(objview);
          }
          let fillcolor = "";
          let strokecolor = "";
          let textcolor = "";
          let part = partData;
          if (!part.name || (typeof part.name === 'string' && part.name.trim().length === 0)) {
            part.name = objName;
          }
          part.scale = Number(n.scale);
          if (part.size === "" || !part.size) {
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
            const isContainer = Boolean(
              part.viewkind === constants.viewkinds.CONT ||
              type?.viewkind === constants.viewkinds.CONT ||
              (typeof (type as any)?.isContainer === 'function' && (type as any).isContainer())
            );
            objview.isGroup = isContainer;
            objview = uic.setObjviewColors(part, object, objview, typeview, myDiagram);
            objview.loc = part.loc;
            objview.viewkind = isContainer ? constants.viewkinds.CONT : type.viewkind;
            objview.scale = Number(part.scale);
            objview.size = part.size;
            objview.setModified();
            myModelview.addObjectView(objview);
            myMetis.addObjectView(objview);
          } else {
            objview.loc = part.loc;
            objview.size = part.size;
          }
          if (objview.isGroup) {
            part.isGroup = true;
            const templateName = part.template || part.category || constants.gojs.C_CONTAINER;
            part.viewkind = constants.viewkinds.CONT;
            if (diagramNode) {
              diagramNode.isGroup = true;
              if (diagramNode.data) {
                diagramNode.data.isGroup = true;
              }
            }
            if (typeof myDiagram?.model?.setCategoryForNodeData === 'function') {
              myDiagram.model.setCategoryForNodeData(part, templateName);
            } else if (templateName) {
              part.category = templateName;
            }
            if (diagramNode?.data) {
              diagramNode.data.category = templateName;
            }
            applyGroupTemplateToDiagram(diagramNode, templateName);
          } else {
            part.isGroup = false;
            part.viewkind = constants.viewkinds.OBJ;
            if (diagramNode) {
              diagramNode.isGroup = false;
              if (diagramNode.data) {
                diagramNode.data.isGroup = false;
              }
            }
            if (typeof myDiagram?.model?.setCategoryForNodeData === 'function') {
              myDiagram.model.setCategoryForNodeData(
                part,
                part.template || part.category || constants.gojs.C_NODETEMPLATE
              );
            }
            if (diagramNode?.data) {
              diagramNode.data.category =
                part.template || part.category || constants.gojs.C_NODETEMPLATE;
            }
            clearGroupTemplateFromDiagram(diagramNode);
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
            goNode.scale = goNode.getMyScale(myGoModel);
            part.scale = Number(goNode.scale);
            gjsNode.scale = part.scale
            if (node?.data) {
              myDiagram.model.setDataProperty(node.data, "scale", part.scale);
            }
            // Check if the node has a relationship (hasPart) FROM a group
            const myHasPartReltype = myMetamodel.findRelationshipTypeByName(constants.types.AKM_CONTAINS);
            const parenttype = parentgroup.objecttype;
            const parentObj = parentgroup.object;
            const childtype = type;
            const childObj = object;
            const myHasPartRelship = myModel.findRelationship1(parentObj, childObj, myHasPartReltype, null, null);
            if (!myHasPartRelship) {
              // Create the relationship
              const relId = utils.createGuid();
              const relName = constants.types.AKM_CONTAINS;
              const hasPartRelship = new akm.cxRelationship(relId, myHasPartReltype, parentObj, childObj, relName, "");
              hasPartRelship.parentModelRef = myModel.id;
              myModel.addRelationship(hasPartRelship);
              parentObj.addOutputrel(hasPartRelship);
              childObj.addInputrel(hasPartRelship);
              myMetis.addRelationship(hasPartRelship);
              const hasPartRelview = new akm.cxRelationshipView(utils.createGuid(), relName, hasPartRelship, "");
              const typeview = hasPartRelship?.type?.typeview
              hasPartRelview.typeview = typeview;
              myModelview.addRelationshipView(hasPartRelview);
              myMetis.addRelationshipView(hasPartRelview);
              // Prepare dispatch
              const jsnRel = new jsn.jsnRelationship(hasPartRelship);
              modifiedRelships.push(jsnRel);
             }
          }
          // if (goNode) {
          //   goNode.object = null;
          //   goNode.objecttype = null;
          //   goNode.objectview = null;
          // }
          const isLabel = (part.typename === 'Label');
          if (isLabel) {
            part.text = "Label";
          }
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
          node?.updateTargetBindings();
        })

        droppedRelLinks.forEach((linkData: any) => {
          const fromKey = linkData?.from || linkData?.fromNode?.key;
          const toKey = linkData?.to || linkData?.toNode?.key;
          if (!fromKey || !toKey) {
            return;
          }

          const fromObjview = myModelview?.findObjectView(fromKey);
          const toObjview = myModelview?.findObjectView(toKey);
          const fromObject = fromObjview?.object;
          const toObject = toObjview?.object;
          if (!fromObjview || !toObjview || !fromObject || !toObject) {
            return;
          }

          const fromType = fromObject.type || (fromObject.typeRef ? myMetamodel?.findObjectType(fromObject.typeRef) : null);
          const toType = toObject.type || (toObject.typeRef ? myMetamodel?.findObjectType(toObject.typeRef) : null);
          if (!fromType || !toType) {
            return;
          }

          let reltype = linkData?.reltype || linkData?.relshiptype;
          if (!reltype && linkData?.reltypeRef) {
            reltype = myMetamodel?.findRelationshipType(linkData.reltypeRef) || myMetis.findRelationshipType(linkData.reltypeRef);
          }
          const relName = (reltype && reltype.name) || linkData?.name;
          if (!reltype && relName) {
            reltype = myMetamodel?.findRelationshipTypeByName2(relName, fromType, toType)
              || myMetis.findRelationshipTypeByName2(relName, fromType, toType);
          }
          if (!reltype) {
            return;
          }

          const relContext = {
            ...context,
            gjsData: linkData,
          };

          const args = {
            data: linkData,
            metamodel: myMetamodel,
            typename: reltype.name,
            fromType,
            toType,
            nodeFrom: null,
            nodeTo: null,
            fromPort: linkData?.fromPort || linkData?.portFrom,
            toPort: linkData?.toPort || linkData?.portTo,
            context: relContext,
          };

          uic.createRelshipCallback(args);
        });

        // Dispatch modelview
        const modifiedModelviews = new Array();
        const jsnModelview = new jsn.jsnModelView(myModelview);
        modifiedModelviews.push(jsnModelview);
        modifiedModelviews.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data });
        });
        if (myDiagram) {
          const toolManager = myDiagram.toolManager;
          const activeTool = toolManager.currentTool;
          if (activeTool && activeTool.isActive) {
            if (activeTool instanceof go.DraggingTool) {
              activeTool.stopTool();
            } else if (typeof activeTool.doCancel === 'function') {
              activeTool.doCancel();
            }
          }
          const dropDragTool = toolManager.draggingTool;
          if (dropDragTool && dropDragTool.isActive) {
            dropDragTool.stopTool();
          }
          const dropDraggedParts = dropDragTool?.draggedParts;
          if (dropDraggedParts?.count > 0) {
            dropDraggedParts.clear();
          }
          const dropCopiedParts = dropDragTool?.copiedParts;
          if (dropCopiedParts?.count > 0) {
            dropCopiedParts.clear();
          }
        }
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
        // sel.location = data.loc;
        if (debug) console.log('1313 selected', data, sel);
        let objectview = myModelview.findObjectView(data?.key);
        if (!objectview) objectview = myModelview.findObjectView(data?.fromNode?.key);
        const object = objectview?.object;
        console.log('1360 object, objectview', object, objectview);
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
        let toModel   = myModel;
        let fromGoModel = myMetis.gojsModel;
        let toGoModel   = myMetis.gojsModel;
        let fromModelview = myModelview;
        let toModelview = myModelview;
        let copiedNodes = new Array();
        let pastedNodes = new Array();
        // Remember copied nodes
        let it = selection.iterator;
        while (it.next()) { 
          if (it.value instanceof go.Node) {
            let objtype: akm.cxObjectType;
            // Filter out copied (source) nodes
            let gjsNode = it.value.data;  
            fromModelview = gjsNode.fromModelview;
            fromGoModel = gjsNode.fromGoModel;
            let gjsCopiedNode = gjsNode.fromNode;
            if (!gjsCopiedNode)
              continue;
            let copiedNodeKey = gjsCopiedNode.key;
            let pastedNodeKey = copiedNodeKey;
            if (copiedNodeKey?.length == gjsNode.key.length) {
              pasteAnotherModelview = true;
              pastedNodeKey = utils.createGuid();
              gjsNode.key = pastedNodeKey;
              toModelview = myModelview;
              toGoModel = myGoModel;
              // toGoModel = new gjs.goModel(utils.createGuid(), toModelview.name, toModelview);
            }
            const myCopiedNode = new akm.cxNode();
            myCopiedNode.name = gjsNode.name;
            myCopiedNode.objId = gjsCopiedNode.objid;
            myCopiedNode.object = myMetis.findObject(myCopiedNode.objId);
            myCopiedNode.descr = myCopiedNode.object?.description;
            myCopiedNode.objecttype = myCopiedNode.object?.type;
            myCopiedNode.objviewId = gjsCopiedNode.objviewid;;
            myCopiedNode.objectview = fromModelview.findObjectView(myCopiedNode.objviewId);
            myCopiedNode.gjsKey = copiedNodeKey;
            myCopiedNode.gjsNode = gjsCopiedNode;
            myCopiedNode.memberscale = Number(gjsCopiedNode.memberscale);
            myCopiedNode.loc = gjsCopiedNode.loc;
            myCopiedNode.size = gjsCopiedNode.size;
            myCopiedNode.group = gjsCopiedNode.group; // Group key
            myCopiedNode.isGroup = gjsCopiedNode.isGroup;
            myCopiedNode.goNodeId = copiedNodeKey;
            let myCopiedGoNode: gjs.goObjectNode = fromGoModel.findNode(myCopiedNode.goNodeId);
            myCopiedNode.goNode = myCopiedGoNode;
            copiedNodes.push(myCopiedNode);

            const myPastedNode = new akm.cxNode();
            myPastedNode.name = myCopiedNode.name;
            myPastedNode.objecttype = myCopiedNode.objecttype;
            if (pasteViewsOnly)
              myPastedNode.object = myCopiedNode.object;
            else {
              myPastedNode.objId = utils.createGuid();
              myPastedNode.object = new akm.cxObject(myPastedNode.objId, myPastedNode.name, myPastedNode.objecttype, myCopiedNode.descr);
              // Paste all object attributes
              uic.copyProperties(myPastedNode.object, myCopiedNode.object);
              myPastedNode.object.setModified();
              myModel.addObject(myPastedNode.object);
              myMetis.addObject(myPastedNode.object);
            }
            myPastedNode.objviewId = utils.createGuid();
            myPastedNode.goNodeId = myPastedNode.objviewId;
            myPastedNode.objectview = new akm.cxObjectView(myPastedNode.objviewId, myPastedNode.name,
                                                           myPastedNode.object, myCopiedNode.descr, toModelview);
            gjsNode.key = myPastedNode.objviewId;
            uic.copyObjviewAttributes(myPastedNode.objectview, myCopiedNode.objectview);                                        
            myPastedNode.loc = gjsNode.loc;
            myPastedNode.size = gjsNode.size;
            myPastedNode.gjsKey = gjsNode.key;
            myPastedNode.group = gjsNode.group;
            myPastedNode.isGroup = gjsNode.isGroup;
            myPastedNode.objectview.loc = myPastedNode.loc;
            myPastedNode.objectview.size = myPastedNode.size;
            myPastedNode.objectview.readOnly = readOnly;
            myPastedNode.objecttype = myCopiedNode.objecttype;
            myPastedNode.goNode = new gjs.goObjectNode(myPastedNode.goNodeId, toGoModel, myPastedNode.objectview);
            toGoModel.addNode(myPastedNode.goNode);
            toModelview.addObjectView(myPastedNode.objectview);
            myMetis.addObjectView(myPastedNode.objectview);
            myMetis.setGojsModel(toGoModel);
            pastedNodes.push(myPastedNode);
            if (debug) console.log('Checkpoint');
          }
        }
        for (let i=0; i < copiedNodes.length; i++) {
          const cNode1 = copiedNodes[i];
          const cGroup = myMetis.getNodeGroup(cNode1);
          if (cGroup?.length > 0) { // group key
            const pNode = myMetis.getNodeByGroup(pastedNodes, cGroup);
            if (pNode) {
              pNode.group = "";
              // Find pnode
              let childNodeView = toModelview.findObjectViewByName(pNode.name);
              childNodeView.group = pNode.objviewId;    
            } 
          }
        }

        // Now handle the relationships
        let it2 = selection.iterator;
        while (it2.next()) { 
          let n = it2.value;
          if (n instanceof go.Node) 
            continue;
          
          if (it2.value instanceof go.Link) {
            let gjsLink = it2.value.data; // The copied (source) link (i.e. the relationship)
            if (!gjsLink.fromLink) 
              continue;

            const copiedRelviewid = gjsLink.fromLink.key;
            const copiedRelview = myMetis.findRelationshipView(copiedRelviewid);

            let copiedRelship = copiedRelview?.relship;
            const copiedFromObject = copiedRelship.fromObject;
            const copiedToObject = copiedRelship.toObject;
            
            let pastedFromObject = null;
            let pastedFromObjview = null;
            for (let i=0; i < pastedNodes.length; i++) {
              const node = pastedNodes[i];
              const objtype = node.objecttype;
              const objname = node.name;
              if (objtype && copiedFromObject.name === objname) {
                if (copiedFromObject.type.id === objtype.id) {
                  pastedFromObject = node.object;
                  pastedFromObjview = node.objectview;
                }
              }
            }
            let pastedToObject = null;
            let pastedToObjview = null;
            for (let i=0; i < pastedNodes.length; i++) {
              const node = pastedNodes[i];
              const objtype = node.objecttype;
              const objname = node.name;
              if (objtype && copiedToObject.name === objname) {
                if (copiedToObject.type.id === objtype.id) {
                  pastedToObject = node.object;
                  pastedToObjview = node.objectview;
                }
              }
            }

            let pastedRelship = new akm.cxRelationship(utils.createGuid(), copiedRelship.type, pastedFromObject, pastedToObject, copiedRelship.name, copiedRelship.description);

            const relviewId = utils.createGuid();
            gjsLink.key = relviewId;
            let pastedRelview = new akm.cxRelationshipView(relviewId, copiedRelview.name, pastedRelship, copiedRelview.description);
            pastedRelview.fromObjview = pastedFromObjview;
            pastedRelview.toObjview   = pastedToObjview;
            const pastedLink = new gjs.goRelshipLink(relviewId, toGoModel, pastedRelview);
            uic.copyRelviewAttributes(pastedRelview, copiedRelview); 

            // Handle points
            const points = [];
            for (let it = gjsLink.points.iterator; it?.next();) {
                const point = it.value;
                points.push(point.x)
                points.push(point.y)
            }
            pastedRelview.points = points;

            toGoModel.addLink(pastedLink);
            toModelview.addRelationshipView(pastedRelview);
            myMetis.addRelationshipView(pastedRelview);
            const jsnRelship = new jsn.jsnRelationship(pastedRelship);
            uic.addItemToList(modifiedRelships, jsnRelship);
            const jsnRelview = new jsn.jsnRelshipView(pastedRelview);
            uic.addItemToList(modifiedRelshipViews, jsnRelview);
          
          }
        }
        
        // Finally handle groups
        const nodes = toGoModel.nodes;
        for (let i=0; i<nodes.length; i++) {
          const myGoNode = nodes[i];
          const myObjectview: akm.cxObjectView = myGoNode.objectview;
          // Check if the node (myGoNode) is member of a group
          const goParentGroup = uic.getGroupByLocation(myGoModel, myGoNode.loc, myGoNode.size, myGoNode);
          let parentObjview = goParentGroup?.objectview; // The container objectview
          if (!parentObjview) {
            parentObjview = myModelview.findObjectView(goParentGroup?.objviewRef);
          }
          if (goParentGroup && parentObjview) { // the container (group)
            myGoNode.group = goParentGroup.key; // Make the node a member of the group (container)
            parentObjview.isExpanded = true;
            myObjectview.group = goParentGroup.key;
            let scale = Number(myGoNode.getMyScale(myGoModel));
            myObjectview.scale = scale;
            myObjectview.loc = myGoNode.loc;
          }
        }
        // Dispatch metis
        const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
        let data = { metis: jsnMetis }
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data }) // Todo: shoud not dispatch the whole phData????
        if (false) {
            // Dispatch modelview
            const modifiedModelviews = new Array();
            const jsnModelview = new jsn.jsnModelView(myModelview);
            modifiedModelviews.push(jsnModelview);
            modifiedModelviews.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data });
            });
            // Dispatch model
            const modifiedModels = new Array();
            const jsnModel = new jsn.jsnModel(myModel);
            modifiedModels.push(jsnModel);
            modifiedModels.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data });
            });
        }
        
        if (debug) console.log('1770 pastedNodes', pastedNodes);
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

      if (debug) console.log('1955 modifiedRelshipViews', modifiedRelshipViews);
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
