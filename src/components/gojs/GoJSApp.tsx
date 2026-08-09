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

const debug = false;
const debugPorts = true;
const linkToLink = false;

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

    const relayoutPoolByKey = (poolKey: string) => {
      if (!poolKey) return;
      let poolObjview = myMetis.findObjectView(poolKey);
      if (!poolObjview) poolObjview = myModelview.findObjectView(poolKey);
      if (!poolObjview) {
        const poolNode = myDiagram.findNodeForKey(poolKey);
        poolObjview = poolNode?.data?.objectview || null;
      }
      if (poolObjview?.isGroup) uid.doGroupLayout(poolObjview, myDiagram, myMetis);
    };
    const relayoutPoolsByKeys = (keys: Set<string>) => {
      if (keys.size === 0) return;
      if ((myDiagram as any).__isPoolRelayoutInProgress) return;
      (myDiagram as any).__isPoolRelayoutInProgress = true;
      try {
        keys.forEach((poolKey) => relayoutPoolByKey(poolKey));
      } finally {
        (myDiagram as any).__isPoolRelayoutInProgress = false;
      }
    };

	    const normalizeSwimlanePool = (poolKey: string) => {
	      if (!poolKey) return;
	      if ((myDiagram as any).__isSwimlaneNormalizeInProgress) return;
	      const poolNode = myDiagram.findNodeForKey(poolKey);
	      if (!(poolNode instanceof go.Group)) return;
      const pdata = poolNode.data;
      const isPool = pdata?.category === "Pool" || pdata?.template === "Pool" || poolNode.category === "Pool";
      if (!isPool) return;

	      (myDiagram as any).__isSwimlaneNormalizeInProgress = true;
	      try {
	        myDiagram.model.startTransaction("normalizeSwimlanePool");
	        // Precompute lane structural/body bounds so we can fix mis-parented nodes that
	        // visually sit in a Lane but are grouped directly to the Pool.
	        const laneInfos: Array<{
	          key: string;
	          lane: go.Group;
	          mainBounds: go.Rect | null;
	          bodyBounds: go.Rect | null;
	          area: number;
	        }> = [];
	        poolNode.memberParts.each((part: go.Part) => {
	          if (!(part instanceof go.Group)) return;
	          const ldata = part.data;
	          const c = String(ldata?.category || "");
	          const t = String(ldata?.template || "");
	          const isLane =
	            c === "Lane" ||
	            c === "Lane_w_handles" ||
	            c === "Lane9" ||
	            c === "Lane9_legacy" ||
	            t === "Lane" ||
	            t === "Lane_w_handles" ||
	            t === "Lane9" ||
	            t === "Lane9_legacy" ||
	            part.category === "Lane" ||
	            part.category === "Lane_w_handles";
	          if (!isLane) return;

	          const laneKey = String(ldata?.key || part.key || "");
	          if (!laneKey) return;
	          const laneMain = (part.findObject("LANE_MAIN_SHAPE") || part.findObject("LANE_MAIN")) as go.GraphObject | null;
	          const laneBody = part.findObject("LANE_BODY_SHAPE") as go.GraphObject | null;
	          const mainBounds = laneMain ? laneMain.getDocumentBounds() : part.actualBounds;
	          const bodyBounds = laneBody ? laneBody.getDocumentBounds() : null;
	          const area = Math.max(1, mainBounds.width * mainBounds.height);
	          laneInfos.push({ key: laneKey, lane: part, mainBounds, bodyBounds, area });

	          part.memberParts.each((mp: go.Part) => {
	            if (!(mp instanceof go.Node) || mp instanceof go.Group) return;
	            if (!mp.data) return;

	            // Keep membership explicit: nodes belong to their Lane, never directly to the Pool.
	            if (typeof mp.data.group === "string" && mp.data.group !== laneKey) {
	              if (typeof (myDiagram.model as any)?.setGroupKeyForNodeData === "function") {
	                (myDiagram.model as any).setGroupKeyForNodeData(mp.data, laneKey);
	              } else {
	                myDiagram.model.setDataProperty(mp.data, "group", laneKey);
	              }
	            }

            // Ensure the model loc matches what the user sees.
            const locStr = `${mp.location.x} ${mp.location.y}`;
            myDiagram.model.setDataProperty(mp.data, "loc", locStr);

	            // Safety clamp: if a node ended up outside its lane body due to stale loc or relayout timing,
	            // move it back inside so subsequent drags are constrained correctly.
	            if (bodyBounds) {
	              const b = mp.actualBounds;
	              if (!bodyBounds.containsRect(b)) {
	                const x = Math.max(bodyBounds.x + 2, Math.min(b.x, bodyBounds.right - b.width - 2));
	                const y = Math.max(bodyBounds.y + 2, Math.min(b.y, bodyBounds.bottom - b.height - 2));
	                mp.moveTo(x, y);
	                myDiagram.model.setDataProperty(mp.data, "loc", `${mp.location.x} ${mp.location.y}`);
	              }
	            }
	          });
	        });

	        // Fix nodes that are direct Pool members but clearly inside a Lane: assign them to the smallest
	        // containing lane (usually the row they are in), then clamp into the lane body.
	        if (laneInfos.length > 0) {
	          // Sort smallest-first to pick the most specific lane if bounds overlap.
	          laneInfos.sort((a, b) => a.area - b.area);
	          poolNode.memberParts.each((part: go.Part) => {
	            if (!(part instanceof go.Node) || part instanceof go.Group) return;
	            const d: any = part.data;
	            if (!d) return;
	            const currentGroup = typeof d.group === "string" ? d.group : "";
	            if (currentGroup !== poolKey) return; // only repair pool-level members
	            const center = part.actualBounds.center;
	            let chosen: (typeof laneInfos)[number] | null = null;
	            for (let i = 0; i < laneInfos.length; i++) {
	              const li = laneInfos[i];
	              if (li.mainBounds && li.mainBounds.containsPoint(center)) {
	                chosen = li;
	                break;
	              }
	            }
	            if (!chosen) return;
	            if (typeof (myDiagram.model as any)?.setGroupKeyForNodeData === "function") {
	              (myDiagram.model as any).setGroupKeyForNodeData(d, chosen.key);
	            } else {
	              myDiagram.model.setDataProperty(d, "group", chosen.key);
	            }
	            myDiagram.model.setDataProperty(d, "loc", `${part.location.x} ${part.location.y}`);
	            if (chosen.bodyBounds) {
	              const b = part.actualBounds;
	              if (!chosen.bodyBounds.containsRect(b)) {
	                const x = Math.max(chosen.bodyBounds.x + 2, Math.min(b.x, chosen.bodyBounds.right - b.width - 2));
	                const y = Math.max(chosen.bodyBounds.y + 2, Math.min(b.y, chosen.bodyBounds.bottom - b.height - 2));
	                part.moveTo(x, y);
	                myDiagram.model.setDataProperty(d, "loc", `${part.location.x} ${part.location.y}`);
	              }
	            }
	          });
	        }
	        myDiagram.model.commitTransaction("normalizeSwimlanePool");
	      } finally {
	        (myDiagram as any).__isSwimlaneNormalizeInProgress = false;
	      }
	    };
	    const resolveContainingGroup = (nodePart: go.Part): gjs.goObjectNode | null => {
	      if (!(nodePart instanceof go.Node) || nodePart instanceof go.Group) return null;
	      const nodeBounds = nodePart.actualBounds;
	      const nodeCenter = nodeBounds.center;
	      const candidates: Array<{ area: number; key: string }> = [];
	      myDiagram.nodes.each((part: go.Node) => {
	        if (!(part instanceof go.Group)) return;
	        if (part === nodePart) return;
	        const pdata = part.data;
	        const c = String(pdata?.category || "");
	        const t = String(pdata?.template || "");
	        const isLane = c.startsWith("Lane") || t.startsWith("Lane") || part.category.startsWith("Lane");
	        // For containment decisions, consider the whole lane (header strip + body). This prevents
	        // nodes dropped near the left edge from being incorrectly parented to the Pool.
	        const laneMain = isLane ? (part.findObject("LANE_MAIN_SHAPE") || part.findObject("LANE_MAIN")) : null;
	        const probe = (laneMain || part.findObject("SHAPE") || part.findObject("POOL_SHAPE")) as go.GraphObject | null;
	        const groupBounds = probe ? probe.getDocumentBounds() : part.actualBounds;
	        if (!groupBounds.containsPoint(nodeCenter)) return;
	        const area = Math.max(1, groupBounds.width * groupBounds.height);
	        const key = String(pdata?.key || "");
	        if (key) candidates.push({ area, key });
	      });
	      if (candidates.length === 0) return null;
	      candidates.sort((a, b) => a.area - b.area);
	      return myGoModel.findNode(candidates[0].key) || null;
	    };

		    // When the user Shift-drags across lanes, the intended target is the lane under the mouse on drop.
		    // Using nodeCenter can fail when a node straddles a lane border (looks "in" the neighbor lane but
		    // center is still in the source lane). This resolves the lane/pool containing a point.
		    const getStructuralGroupBounds = (part: go.Group, isLane: boolean): go.Rect => {
		      // For lanes, use the lane BODY bounds (not the whole group bounds) so containment is stable and
		      // not influenced by member nodes or selection adornments.
		      // For pools, use POOL_SHAPE (or fallback to SHAPE) for the same reason.
		      if (isLane) {
		        const body =
		          (part.findObject("LANE_BODY_SHAPE") ||
		            part.findObject("BODY")) as go.GraphObject | null;
		        if (body) return body.getDocumentBounds();
		      }
		      const probe = (part.findObject("POOL_SHAPE") || part.findObject("SHAPE")) as go.GraphObject | null;
		      return probe ? probe.getDocumentBounds() : part.actualBounds;
		    };
		    const resolveContainingGroupAtPoint = (pt: go.Point): gjs.goObjectNode | null => {
		      const candidates: Array<{ area: number; key: string; isLane: boolean }> = [];
		      myDiagram.nodes.each((part: go.Node) => {
		        if (!(part instanceof go.Group)) return;
		        const pdata = part.data;
		        const c = String(pdata?.category || "");
		        const t = String(pdata?.template || "");
		        const isLane = c.startsWith("Lane") || t.startsWith("Lane") || part.category.startsWith("Lane");
		        const groupBounds = getStructuralGroupBounds(part, isLane);
		        if (!groupBounds.containsPoint(pt)) return;
		        const area = Math.max(1, groupBounds.width * groupBounds.height);
		        const key = String(pdata?.key || "");
		        if (key) candidates.push({ area, key, isLane });
		      });
		      if (candidates.length === 0) return null;
	      // Prefer lanes over pools when both contain the point.
	      candidates.sort((a, b) => {
	        if (a.isLane !== b.isLane) return a.isLane ? -1 : 1;
	        return a.area - b.area;
	      });
	      return myGoModel.findNode(candidates[0].key) || null;
	    };

	    // More robust than point/center containment: pick the lane/group with the largest overlap
	    // with the moved node's bounds. This avoids "looks in neighbor lane but still grouped to old lane"
	    // when the node straddles the border at drop.
		    const resolveContainingGroupByOverlap = (nodePart: go.Part): gjs.goObjectNode | null => {
		      if (!(nodePart instanceof go.Node) || nodePart instanceof go.Group) return null;
		      const nb = nodePart.actualBounds;
		      const candidates: Array<{ overlap: number; area: number; key: string; isLane: boolean }> = [];
		      myDiagram.nodes.each((part: go.Node) => {
		        if (!(part instanceof go.Group)) return;
		        if (part === nodePart) return;
		        const pdata = part.data;
		        const c = String(pdata?.category || "");
		        const t = String(pdata?.template || "");
		        const isLane = c.startsWith("Lane") || t.startsWith("Lane") || part.category.startsWith("Lane");
		        const gb = getStructuralGroupBounds(part, isLane);
		        // NOTE: avoid using Rect.intersectRect here because `actualBounds` can be a frozen/shared Rect
		        // in some GoJS builds; intersectRect mutates the Rect instance.
		        const ix1 = Math.max(nb.x, gb.x);
		        const iy1 = Math.max(nb.y, gb.y);
		        const ix2 = Math.min(nb.right, gb.right);
	        const iy2 = Math.min(nb.bottom, gb.bottom);
	        const overlap = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
	        if (overlap <= 0) return;
	        const area = Math.max(1, gb.width * gb.height);
	        const key = String(pdata?.key || "");
	        if (key) candidates.push({ overlap, area, key, isLane });
	      });
	      if (candidates.length === 0) return null;
	      candidates.sort((a, b) => {
	        if (a.isLane !== b.isLane) return a.isLane ? -1 : 1;
	        if (b.overlap !== a.overlap) return b.overlap - a.overlap;
	        return a.area - b.area;
	      });
	      return myGoModel.findNode(candidates[0].key) || null;
	    };

	    // Swimlane rule: "contains" membership relationships (Lane -> member) are structural and should
	    // remain hidden when the member is actually grouped into that Lane. Some code paths were
	    // resetting relview.visible=true after moves; this helper re-applies the hide rule deterministically.
	    const applySwimlaneContainsVisibility = () => {
	      if (!myDiagram) return;

	      const isSwimlaneGroupKey = (k: any): boolean => {
	        if (!k) return false;
	        const n = myDiagram.findNodeForKey(k);
	        const c = String(n?.data?.category || n?.data?.template || n?.category || "");
	        return c === "Pool" || c.startsWith("Lane");
	      };
	      const groupKeyOf = (k: any): string => {
	        const n = myDiagram.findNodeForKey(k);
	        const g = n?.data?.group;
	        return typeof g === "string" ? g : "";
	      };

	      myDiagram.links.each((l: go.Link) => {
	        const d: any = l.data;
	        if (!d) return;
	        const typeName =
	          d?.typename ||
	          d?.name ||
	          d?.relship?.type?.name ||
	          d?.relshipview?.relship?.type?.name ||
	          "";
	        // Only touch membership links.
	        if (typeName !== constants.types.AKM_CONTAINS) return;

	        const fromKey = d.from;
	        const toKey = d.to;
	        const fromIsSwim = isSwimlaneGroupKey(fromKey);
	        const toIsSwim = isSwimlaneGroupKey(toKey);
	        // In swimlanes, always keep membership links hidden (Pool->Lane and Lane->Member).
	        let hide = fromIsSwim || toIsSwim;
	        // For non-swimlane containers, also hide when stable group membership matches.
	        if (!hide) {
	          const toGroup = groupKeyOf(toKey);
	          const fromGroup = groupKeyOf(fromKey);
	          if (String(fromKey) && toGroup === String(fromKey)) hide = true;
	          if (String(toKey) && fromGroup === String(toKey)) hide = true;
	        }
	        
	        if (hide) {
	          // Force-hide at the data level so it stays hidden across refreshes.
	          if (d.visible !== false) myDiagram.model.setDataProperty(d, "visible", false);
	        }
	        l.updateTargetBindings();
	      });
	    };

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
        uic.purgeDuplicatedRelshipViews(myModelview);
        const links = myDiagram.model.linkDataArray;
	        if (links.length > 0) {
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
            uic.addItemToList(modifiedObjectViews, jsnObjview);
          }
	          // Fix links 
          const linksToRemove = [];
          const links = myDiagram.model.linkDataArray;
	          for (let it = links.iterator; it?.next();) {
            const link = it.value;
            const data = link.data;
            if (data.category === "Relationship") {
              let relview: akm.cxRelationshipView = data.relshipview;
              relview = myModelview.findRelationshipView(data.key);
              if (!relview)
                relview = myMetis.findRelationshipView(data.key);
	              if (relview) {
	                relview.markedAsDeleted = data.markedAsDeleted;
	                // Do not force visible=true here; visibility can be intentionally false (e.g., swimlane contains).
	                relview.visible = (relview.visible !== false) && !relview.markedAsDeleted;
	                if (relview.visible === false) {
	                  linksToRemove.push(link);
	                } else {
                  const points = relview.points;
                  if (points?.length == 0 || points?.length == 4) {
                    link.points = [];
                    relview.points = [];
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
	        
	        // FIX: Nodes have wrong group property - they have group=CORE_META but should have group=Mimris_META Types
	        // This causes applySwimlaneContainsVisibility to hide their "contains" links incorrectly.
	        // Fix this ONCE on load, then the corrected data should persist.
	        const coreMeta = Array.from(myDiagram.nodes).find((n: go.Node) => n.data.name === 'CORE_META');
	        const mimrisMetaTypes = Array.from(myDiagram.nodes).find((n: go.Node) => n.data.name === 'Mimris_META Types');
	        
	        if (coreMeta && mimrisMetaTypes) {
	          const nodesToFix: go.Node[] = [];
	          myDiagram.nodes.each((node: go.Node) => {
	            if (node.data.group === coreMeta.data.key && node !== coreMeta) {
	              nodesToFix.push(node);
	            }
	          });
	          
	          if (nodesToFix.length > 0) {
	            myDiagram.startTransaction('fix-group-references');
	            nodesToFix.forEach((node: go.Node) => {
	              // 1. Update GoJS model
	              myDiagram.model.setDataProperty(node.data, 'group', mimrisMetaTypes.data.key);
	              
	              // 2. Update myGoModel node (internal data structure)
	              const goNode = myGoModel.findNode(node.data.key);
	              if (goNode) {
	                goNode.group = mimrisMetaTypes.data.key;
	              }
	              
	              // 3. Update objectview and myModelview
	              if (node.data.objectview) {
	                const objectview = node.data.objectview;
	                objectview.group = mimrisMetaTypes.data.key;
	                
	                const objviews = myModelview?.objectviews || [];
	                const matchingObjview = objviews.find((ov: any) => ov.id === objectview.id);
	                if (matchingObjview) {
	                  matchingObjview.group = mimrisMetaTypes.data.key;
	                }
	                
	                // Note: Skip Redux dispatch here to avoid circular reference errors during initialization.
	                // The corrected group values will be persisted through normal diagram events later.
	              }
	              
	              node.part?.updateRelationshipsFromData();
	            });
	            myDiagram.commitTransaction('fix-group-references');
	          }
	        }
	        
	        // Re-apply swimlane contains hiding after fixing group references.
	        // Now it will correctly see nodes belong to Mimris_META Types, not CORE_META.
	        applySwimlaneContainsVisibility();
	        
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
        // Keep lane membership stable unless the user explicitly requests regrouping.
        // This must match `stayInGroup` (Diagram.tsx) which allows crossing lanes only when Shift is held.
        const dragAllowKeys: Set<string> | undefined = (myDiagram as any)?.__dragAllowReparentKeys;
        const allowReparentGlobal = !!myDiagram?.lastInput?.shift || !!(myDiagram as any)?.__dragAllowReparent;
	        const allowReparentForKey = (k: any): boolean => {
	          if (allowReparentGlobal) return true;
	          if (!dragAllowKeys) return false;
	          if (k == null) return false;
	          return dragAllowKeys.has(String(k));
	        };
	        const isSwimlaneGroupKey = (k: any): boolean => {
	          if (!k) return false;
	          const p = myDiagram?.findNodeForKey?.(k);
	          const c = String((p as any)?.data?.category || (p as any)?.data?.template || (p as any)?.category || "");
	          return c === "Pool" || c.startsWith("Lane");
	        };
	        let relshipviews = myModelview.relshipviews;
	        myModelview.relshipviews = utils.removeArrayDuplicates(relshipviews);
        let objectviews = myModelview.objectviews;
        // Identify selected groups
        const selectedGroupNodes = [];
        let nodes = myGoModel.nodes;
        for (let i=0; i<nodes.length; i++) {
          const node = nodes[i];
          if (node.isGroup) {
            const gjsNode = myDiagram.findNodeForKey(node.key);
            if (gjsNode) {
              if (myDiagram.selection.contains(gjsNode)) {
                selectedGroupNodes.push(node);
              }
            }
          }
        }
        // Add nodes contained in selected groups to the selection
        const additionalSelectedNodes = [];
        for (let i=0; i<selectedGroupNodes.length; i++) {
          const groupNode = selectedGroupNodes[i];
          const gjsGroupNode = myDiagram.findNodeForKey(groupNode.key);
          if (gjsGroupNode) {
            for (let it = gjsGroupNode.memberParts.iterator; it?.next();) {
              let n = it.value;
              if (n instanceof go.Node) {
                if (!myDiagram.selection.contains(n)) {
                  additionalSelectedNodes.push(n);
                }
              }
            }
          }
        }
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
          // Group moves are persisted in a dedicated block later; keep this path
          // scoped to regular nodes to avoid accidental group membership rewrites.
          if (n instanceof go.Group) continue;
          
          // Use the Part.location, not `data.loc`. After group drags, `data.loc` can lag behind
          // the rendered position and cause membership/loc persistence to drift.
          const loc = `${n.location.x} ${n.location.y}`;
          const goNode = myGoModel.findNode(n.data.key);
          if (!goNode) continue;
          
          goNode.loc = loc;
	          const size = n.actualBounds.width + " " + n.actualBounds.height;
		          const existingGroupKey = (typeof n.data.group === "string") ? n.data.group : "";
		          // Swimlane rule: if a node is no longer fully inside its current lane body (due to a prior
		          // shift-move or stale grouping), allow us to repair membership based on geometry even if
		          // Shift is not currently held. This prevents the "looks in new lane but jumps back" bug.
		          let outsideCurrentLaneBody = false;
		          if (existingGroupKey) {
		            const curLane = myDiagram.findNodeForKey(existingGroupKey);
		            const curLaneCat = String((curLane as any)?.data?.category || (curLane as any)?.data?.template || (curLane as any)?.category || "");
		            if (curLane instanceof go.Group && curLaneCat.startsWith("Lane")) {
		              const body = curLane.findObject("LANE_BODY_SHAPE") as go.GraphObject | null;
		              const r = body ? body.getDocumentBounds() : null;
		              if (r) {
		                const b = n.actualBounds;
		                // Manual containsRect to avoid any mutations on frozen Rects.
		                const contains =
		                  b.x >= r.x &&
		                  b.y >= r.y &&
		                  b.right <= r.right &&
		                  b.bottom <= r.bottom;
		                outsideCurrentLaneBody = !contains;
		              }
		            }
		          }
		          // Allow regrouping when:
		          // - Shift was used (explicit intent), OR
		          // - node is ungrouped (new/palette), OR
		          // - node is outside its current lane body (repair stale membership).
		          const canReparentThisNode =
		            allowReparentForKey(n.data?.key) || !existingGroupKey || outsideCurrentLaneBody;
		          
		          let groupKey = existingGroupKey || "";
		          let group: any = null;
	          if (canReparentThisNode) {
	            // Prefer the lane under the mouse on drop (Shift-drag intent), fallback to node-center containment.
	            const dropPt = myDiagram?.lastInput?.documentPoint;
	            group = resolveContainingGroupByOverlap(n);
	            if (!group && dropPt) group = resolveContainingGroupAtPoint(dropPt);
	            if (!group) group = resolveContainingGroup(n);
	            if (group) groupKey = group.key;
	            if (!group) {
	              group = uic.isContainedInGroup(myGoModel, goNode); // objectview
	              if (group) groupKey = group.id;
	            }
	          }
          if (!groupKey) {
            goNode.scale = 1.0;
          } else {
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
            "object": goNode.object,
            "objectview": goNode.objectview,
            "objecttype": goNode.objecttype,
            "typeview": goNode.typeview,
          }
          myToNodes.push(myToNode);
	          if (groupKey && (n.data.group !== groupKey) && canReparentThisNode) {
	            try {
	              if (typeof (myDiagram.model as any)?.setGroupKeyForNodeData === "function") {
	                (myDiagram.model as any).setGroupKeyForNodeData(n.data, groupKey);
	              } else {
	                myDiagram.model.setDataProperty(n.data, 'group', groupKey);
	              }
	              // If we reparented into a lane, clamp the node into the lane body so subsequent non-shift drags
	              // don't immediately snap it back due to being outside the lane bounds.
	              const lanePart = myDiagram.findNodeForKey(groupKey);
	              const laneCat = String((lanePart as any)?.data?.category || (lanePart as any)?.data?.template || (lanePart as any)?.category || "");
	              if (lanePart instanceof go.Group && laneCat.startsWith("Lane")) {
	                const body = lanePart.findObject("LANE_BODY_SHAPE") as go.GraphObject | null;
	                const r = body ? body.getDocumentBounds() : null;
	                if (r) {
	                  const b = n.actualBounds;
	                  const loc = n.location;
	                  const x = Math.max(r.x + 2, Math.min(b.x, r.right - b.width - 2)) + (loc.x - b.x);
	                  const y = Math.max(r.y + 2, Math.min(b.y, r.bottom - b.height - 2)) + (loc.y - b.y);
	                  n.move(new go.Point(x, y));
	                  myDiagram.model.setDataProperty(n.data, "loc", `${n.location.x} ${n.location.y}`);
	                }
	              }
	              } catch (error) {
	              }
	          }
          if (n.data.loc !== loc) {
            try {
              myDiagram.model.setDataProperty(n.data, 'loc', loc);
            } catch (error) {
            }
          }
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
                // CRITICAL: Keep myGoModel's group value synchronized with the diagram's group value.
                // Without this, line 1410 copies the stale group value from goToNode back into myToNode,
                // then line 1411 writes it into the diagram, undoing all group fixes from the first loop!
                goToNode.group = myToNode.group;
              }
	              const fromGroupKey = (typeof myFromNode.group === "string") ? myFromNode.group : "";
	              const inSwimlaneContext = isSwimlaneGroupKey(fromGroupKey) || isSwimlaneGroupKey(myToNode.group);
	              
	              if (!inSwimlaneContext) {
	                // Legacy containment/grouping logic for non-swimlane diagrams.
	                // Swimlanes manage membership explicitly (node.data.group -> Lane key) via GoJS Groups.
	                // Running the rectangle-based containment logic here can overwrite lane membership and
	                // cause the node to "snap back" to the old lane on the next drag.

	                // Check if the MOVED node (goToNode) is member of a group
	                const goParentGroup = uic.getGroupByLocation(myGoModel, goToNode.loc, goToNode.size, goToNode);
	                let parentObjview = goParentGroup?.objectview; // The container objectview
	                if (!parentObjview) {
	                  parentObjview = myModelview.findObjectView(goParentGroup?.key);
	                }
	                // Do not "jump" lanes on mouse-up: only regroup when Shift is held,
	                // or if the node had no group yet (e.g., freshly created/pasted).
	                const canReparentOnDrop = allowReparentForKey(myToNode.key) || !fromGroupKey;
	                const targetGroupKey = goParentGroup?.key || "";
	                const shouldReparent =
	                  !!(goParentGroup && parentObjview && targetGroupKey) &&
	                  canReparentOnDrop &&
	                  (targetGroupKey !== fromGroupKey);

		                  if (shouldReparent) { // the container (group)
	                // goToNode IS member of a group
	                // First handle the object (node)
	                const gjsPart = myToNode.gjsData; // The object (node) to be moved
	                goToNode.group = goParentGroup.key; // Make the node a member of the group (container)
	                parentObjview.isExpanded = true;
	                myObjectview.group = goParentGroup.key;
	                if (typeof (myDiagram.model as any)?.setGroupKeyForNodeData === "function") {
	                  (myDiagram.model as any).setGroupKeyForNodeData(gjsPart, goToNode.group);
	                } else {
	                  myDiagram.model.setDataProperty(gjsPart, "group", goToNode.group);
	                }
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
                let inputRelviews = myObjectview?.inputrelviews; // Possibly a member relship
                if (inputRelviews?.length > 0) {
                  myObjectview.purgeInputRelviews();
                  inputRelviews = myObjectview.inputrelviews;
                } else {

                  const parentObj = parentObjview?.object;
                  const childObj = goToNode.object;
                  const myHasPartReltype = myMetamodel.findRelationshipTypeByName(constants.types.AKM_CONTAINS);
                  const existingRel = parentObj ? myModel.findRelationship1(parentObj, childObj, myHasPartReltype, null, null) : null;
                  if (!existingRel) {
                    // Create only if it does not already exist.
                    const relId = utils.createGuid();
                    const relName = constants.types.AKM_CONTAINS;
                    const hasPartRelship = new akm.cxRelationship(relId, myHasPartReltype, parentObj, childObj, relName, "");
                    hasPartRelship.parentModelRef = myModel.id;
                    myModel.addRelationship(hasPartRelship);
                    parentObj?.addOutputrel(hasPartRelship);
                    childObj?.addInputrel(hasPartRelship);
                    myMetis.addRelationship(hasPartRelship);
                    // Prepare dispatch
                    const jsnRel = new jsn.jsnRelationship(hasPartRelship);
                    modifiedRelships.push(jsnRel);
                  }
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
                      const lnk = myDiagram.findLinkForKey(relview.id);
                      if (reltype.name === constants.types.AKM_CONTAINS) {
                        relview.markedAsDeleted = true;
                        relview.visible = false;
                        if (lnk) {
                            myDiagram.remove(lnk);
                        }
                      }                        
                      // }
                      inoutRelviews.push(relview);
                      // Prepare dispatch
                      const jsnRelship = new jsn.jsnRelationship(relview.relship);
                      uic.addItemToList(modifiedRelships, jsnRelship);
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
                }                
              } else {
                // When shouldReparent is false, we're keeping existing membership.
                // CRITICAL: If the node already has a stable group (fromGroupKey is set),
                // preserve it. Don't run geometric containment checks (isContainedInGroup)
                // which can incorrectly detect containment in a different group (e.g., CORE_META)
                // based on bounding box overlap, overwriting the correct group value.
                const hasStableGroup = !!(fromGroupKey && typeof fromGroupKey === 'string' && fromGroupKey !== '');
                
                if (!hasStableGroup) {
                  // Only run geometric containment logic for nodes without existing group membership
                  myMetis.purgeInputRelships(myModel);
                  // goToNode is NOT member of a group
                  let grpView = uic.isContainedInGroup(myGoModel, goToNode);
                  if (grpView) {
                    goToNode.group = grpView.id;
                  } else {
                    const fromObj = uic.isContainedInGroup1(myGoModel, goToNode);
                    if (fromObj) {
                      grpView = myModelview.findObjectViewByName(fromObj.name);
                      goToNode.group = grpView?.id;
                    } else {
                      goToNode.group = "";
                    }
                  }
                } else {
                  // Preserve existing group membership - node is moving with its container
                  goToNode.group = fromGroupKey;
                }
                
                let movedObj = goToNode.object;
                if (!movedObj) {
                  movedObj = myModel.findObject(goToNode.objRef);
                }
                let movedObjview = goToNode.objectview;
                if (!movedObjview) {
                  movedObjview = myModelview.findObjectView(goToNode.objviewRef);
                }
                const gjsPart = myToNode.gjsData;
                myToNode.group = goToNode.group; // ""
                try {
                  myDiagram.model.setDataProperty(gjsPart, "group", myToNode.group);
                  myObjectview.group = myToNode.group;
                } catch (error) {
                }
                let scale = Number(goToNode.scale); // Not part of group
                if (!scale || scale === 0) scale = 1.0;
                gjsPart.scale = scale;
                myObjectview.scale = gjsPart.scale;
                myDiagram.model.setDataProperty(myToNode.n, "scale", gjsPart.scale);
                // Check if the node has a relationship FROM a group
                let inputRelviews = movedObjview?.inputrelviews;
                if (inputRelviews?.length > 0) {
                  movedObjview.purgeInputRelviews();
                }
                const inputRelships = movedObj?.inputrels;
                for (let i = 0; i < inputRelships?.length; i++) {
                  const relship = inputRelships[i];
                  const fromObj = relship.fromObject;
                  if (!fromObj?.objectviews) 
                    continue;
                  const fromObjviews = myModelview.findObjectViewsByObject(fromObj) as akm.cxObjectView;
                  const fromObjview = fromObjviews[0];
                  if (fromObjview?.isGroup) {
                    // YES
                    myModel.purgeInputRelships(myModel);
                    const fromGroup = fromObjview.object;
                    const fromGroupView = fromObjview;
                    // Reuse any existing relview for this relationship+target in the current modelview.
                    let relviews = myModelview.findRelationshipViewsByRel2(relship, fromObjview, movedObjview, true);
                    if (!relviews || relviews.length === 0) {
                      const allRelviews = myModelview.findRelationshipViewsByRel(relship, true) || [];
                      relviews = allRelviews.filter((rv: any) =>
                        rv?.toObjview?.id === movedObjview?.id && rv?.fromObjview?.isGroup
                      );
                    }
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
                      const fromNode = myGoModel.findNodeByViewId(fromObjview.id);
                      const toNode = myGoModel.findNodeByViewId(movedObjview.id);   
                      if (fromNode && toNode) {
                        toNode.group = goToNode.group; 
                        const gjsToNode = myDiagram.findNodeForKey(toNode.key);
                        gjsToNode.group = goToNode.group; 
                        gjsToNode.data.group = goToNode.group; 
                        myDiagram.model.setDataProperty(gjsToNode, "group", gjsToNode.group);
                      }
                    } else if (movedObjview) {
                      // The relview does not exist - create it
                      relview = new akm.cxRelationshipView(utils.createGuid(), relship.name, relship);
                      fromObjview.addOutputRelview(relview);
                      movedObjview.addInputRelview(relview);
                      relview.fromObjview = fromGroupView;
                      relview.toObjview = movedObjview;
                      relview.points = [];
                      relship.addRelationshipView(relview);
                      const jsnRelship = new jsn.jsnRelationship(relship);
                      if (jsnRelship) {
                        uic.addItemToList(modifiedRelships, jsnRelship);
                      }
                      myModelview.addRelationshipView(relview);
                    }
                    const lnk = myDiagram.findLinkForKey(relview?.id);
                    // Regression guard: never create a second diagram link for the same
                    // relationship id while moving members in/out of groups.
                    let existingRelLink: go.Link | null = null;
                    if (relship?.id) {
                      myDiagram.links.each((ll: go.Link) => {
                        if (existingRelLink) return;
                        if (ll?.data?.relshipRef === relship.id) existingRelLink = ll;
                      });
                    }
                    if (!lnk && !existingRelLink && relview) {                    
                      // Create a new gojs link
                      myDiagram.startTransaction('AddLink');
                      const link = new gjs.goRelshipLink(relview.id, myGoModel, relview);
                      link.loadLinkContent(myGoModel);
                      link.fromNode = uid.getNodeByViewId(fromGroupView.id, myDiagram);
                      link.from = link.fromNode?.key;
                      link.toNode = uid.getNodeByViewId(movedObjview.id, myDiagram);
                      link.to = link.toNode?.key;
                      if (!link.to) link.to = movedObjview.id;
                      link.points = []; 
                      myGoModel.addLink(link);
                      myDiagram.model.addLinkData(link);   
                      uid.clearPath(myDiagram.links, myMetis, myDiagram);
                      myDiagram.commitTransaction('AddLink');
                    } else if (lnk || existingRelLink) {
                      uid.clearPath(myDiagram.links, myMetis, myDiagram);
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
                      const link = myDiagram.findLinkForKey(relview?.id);
                      if (link) {
                        link.points = []; 
                        myGoModel.addLink(link);
                        // myDiagram.model.addLinkData(link);   
                        uid.clearPath(myDiagram.links, myMetis, myDiagram);
                      }
                    }
                  }
                }
	              }
	              } // end !inSwimlaneContext
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
        // Persist manual moves for groups (lanes/pools); the object-only block above
        // does not capture group objectviews.
        for (let it = selection.iterator; it?.next();) {
          const sel = it.value;
          if (!(sel instanceof go.Group)) continue;
          const data = sel.data;
          const objview = myModelview.findObjectView(data?.key) || data?.objectview;
          if (!objview) continue;
          const isLaneGroup =
            data?.category === "Lane" ||
            data?.category === "Lane_w_handles" ||
            data?.template === "Lane" ||
            data?.template === "Lane_w_handles";
          const previousGroup = objview.group || "";
          const newLoc = `${sel.location.x} ${sel.location.y}`;
          objview.loc = newLoc;
          if (data) {
            myDiagram.model.setDataProperty(data, "loc", newLoc);
          }
          if (data?.size) objview.size = data.size;
          let persistedGroup = objview.group;
          if (isLaneGroup) {
            // Resolve lane membership from the actual drop position.
            // This avoids stale containingGroup values when dragging in/out of pools.
            const dropPoint = (myDiagram.lastInput?.documentPoint as go.Point | undefined)
              || sel.actualBounds.center;
            let targetPool: go.Group | null = null;
            const topGroups = myDiagram.findTopLevelGroups();
            topGroups.each((g: go.Group) => {
              if (targetPool) return;
              const gdata = g?.data;
              const isPool =
                gdata?.category === "Pool" ||
                gdata?.template === "Pool" ||
                g?.category === "Pool";
              if (!isPool) return;
              const poolShape = g.findObject("POOL_SHAPE") as go.GraphObject | null;
              const poolBounds = poolShape ? poolShape.getDocumentBounds() : g.actualBounds;
              if (poolBounds.containsPoint(dropPoint)) targetPool = g;
            });

            persistedGroup = targetPool ? String(targetPool.key) : "";

            // Force membership to match resolved target.
            if (!targetPool && sel.containingGroup instanceof go.Group) {
              const topLevelSet = new go.Set<go.Part>();
              topLevelSet.add(sel);
              myDiagram.commandHandler.addTopLevelParts(topLevelSet, true);
            } else if (targetPool && sel.containingGroup !== targetPool) {
              const memberSet = new go.Set<go.Part>();
              memberSet.add(sel);
              targetPool.addMembers(memberSet, true);
            }
          } else if (sel.containingGroup instanceof go.Group) {
            persistedGroup = sel.containingGroup.key;
          } else if (data?.group) {
            persistedGroup = data.group;
          }
          if (persistedGroup !== undefined) {
            if (isLaneGroup && persistedGroup === "" && sel.containingGroup instanceof go.Group) {
              // Force detach from pool membership before persisting;
              // otherwise subsequent pool relayout can pull the lane back in.
              const topLevelSet = new go.Set<go.Part>();
              topLevelSet.add(sel);
              myDiagram.commandHandler.addTopLevelParts(topLevelSet, true);
            }
            objview.group = persistedGroup;
            if (data) {
              if (isLaneGroup) {
                myDiagram.model.setGroupKeyForNodeData(data, persistedGroup || undefined);
              } else {
                myDiagram.model.setDataProperty(data, "group", persistedGroup || "");
              }
              (data as any).__previousGroup = previousGroup;
            }
          }
          const gnode = myGoModel.findNodeByViewId(objview.id);
          if (gnode) {
            gnode.loc = objview.loc;
            if (objview.size) gnode.size = objview.size;
            if (isLaneGroup && persistedGroup !== undefined) gnode.group = persistedGroup;
          }
          const jsnObjview = new jsn.jsnObjectView(objview);
          uic.addItemToList(modifiedObjectViews, jsnObjview);
        }
        { // links
          const links = myDiagram.links;
          for (let it = links.iterator; it?.next();) {
            const link = it.value;
            const rview = myModelview.findRelationshipView(link.data.key);
            if (!rview) continue;
            const ldata = link.data;
            if (rview.fromPortid && ldata?.fromPort !== rview.fromPortid) {
              myDiagram.model.setDataProperty(ldata, "fromPort", rview.fromPortid);
            }
            if (rview.toPortid && ldata?.toPort !== rview.toPortid) {
              myDiagram.model.setDataProperty(ldata, "toPort", rview.toPortid);
            }
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
                // myModelview.addRelationshipView(relview);
              }
            }
          }
        }
	        // Dispatch relshipviews
	        myModelview.relshipviews = utils.removeArrayDuplicates(relshipviews);
	        const relviews = myModelview.relshipviews;
	        for (let i = 0; i < relviews?.length; i++) {
	          const relview = relviews[i];
	          // Preserve explicit hidden state; only ensure deleted links are not visible.
	          relview.visible = (relview.visible !== false) && !relview.markedAsDeleted;
	          const jsnRelview = new jsn.jsnRelshipView(relview);
	          modifiedRelshipViews.push(jsnRelview);
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
        const toolManager = myDiagram.toolManager;
        const activeTool = toolManager.currentTool;
        if (activeTool && activeTool.isActive) {
          if (activeTool instanceof go.DraggingTool) {
            activeTool.stopTool();
          } else {
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

	        // Auto-relayout affected pools after lane moves.
	        if (!(myDiagram as any).__isPoolRelayoutFromMove) {
          const poolsToRelayout = new Set<string>();
          const movedSelection = e.subject;
          // When dragging a Pool, its Lane members move too; don't treat that as an intentional lane move
          // that should trigger a pool relayout/resize.
          const movedPoolKeys = new Set<string>();
          for (let it = movedSelection?.iterator; it?.next();) {
            const part = it.value;
            if (!(part instanceof go.Group)) continue;
            const pdata = part.data;
            const isPool = pdata?.category === 'Pool' || pdata?.template === 'Pool' || part.category === 'Pool';
            if (isPool && pdata?.key) movedPoolKeys.add(pdata.key);
          }
          for (let it = movedSelection?.iterator; it?.next();) {
            const part = it.value;
            if (!(part instanceof go.Group)) continue;
            const pdata = part.data;
            const isPool = pdata?.category === 'Pool' || pdata?.template === 'Pool';
            const isLane =
              pdata?.category === 'Lane' ||
              pdata?.category === 'Lane_w_handles' ||
              pdata?.template === 'Lane' ||
              pdata?.template === 'Lane_w_handles';
            // Moving a Pool should be a pure translation; don't relayout pool structure on pool moves.
            // Relayout is triggered for lane moves/drops (pool membership/order changes) and for resizes.
            if (isLane && pdata?.group && !movedPoolKeys.has(String(pdata.group))) poolsToRelayout.add(pdata.group);
            if (isLane && pdata?.__previousGroup && !movedPoolKeys.has(String(pdata.__previousGroup))) poolsToRelayout.add(pdata.__previousGroup);
            if (isLane && pdata) delete (pdata as any).__previousGroup;
          }
		          if (poolsToRelayout.size > 0) {
	            (myDiagram as any).__isPoolRelayoutFromMove = true;
	            relayoutPoolsByKeys(poolsToRelayout);
            // After relayout, normalize membership/loc for all nodes under lanes in those pools.
            poolsToRelayout.forEach((poolKey) => normalizeSwimlanePool(poolKey));
            (myDiagram as any).__isPoolRelayoutFromMove = false;

            // Replace stale pre-relayout objectview updates with current post-relayout values.
            const refreshedKeys = new Set<string>();
            poolsToRelayout.forEach((poolKey) => {
              refreshedKeys.add(poolKey);
              const poolNode = myDiagram.findNodeForKey(poolKey);
              if (poolNode instanceof go.Group) {
                poolNode.memberParts.each((part: go.Part) => {
                  if (part instanceof go.Group && part.data?.key) refreshedKeys.add(part.data.key);
                  // Persist member node locations too: pool relayout moves lanes, which moves their members.
                  // If we don't dispatch these updates, a later reload/refresh can "snap" nodes back to stale
                  // objectview.loc values, making it look like they drift out of lanes after repeated pool moves.
                  if (part instanceof go.Group) {
                    part.memberParts.each((mp: go.Part) => {
                      if (mp instanceof go.Node && !(mp instanceof go.Group) && mp.data?.key) {
                        refreshedKeys.add(mp.data.key);
                      }
                    });
                  }
                });
              }
            });
            modifiedObjectViews = modifiedObjectViews.filter((ov: any) => !refreshedKeys.has(ov?.id));
            refreshedKeys.forEach((key) => {
              const ov = myMetis.findObjectView(key) || myModelview.findObjectView(key);
              if (!ov) return;
              const node = myDiagram.findNodeForKey(key);
              if (node && node.data) {
                // After a pool/lane relayout or group drag, member Nodes can move without their `data.loc`
                // being updated reliably. Persist what the user actually sees: the Part.location.
                ov.loc = `${node.location.x} ${node.location.y}`;
                if (node.data.size) ov.size = node.data.size;
                // Keep persisted group membership in sync for nodes moved indirectly by group relayout.
                if (typeof node.data.group === "string") ov.group = node.data.group;
              }
              const jsnObjview = new jsn.jsnObjectView(ov);
              uic.addItemToList(modifiedObjectViews, jsnObjview);
            });
		          }
		        }

		        // Final swimlane regroup enforcement: during a Shift-drag we allow crossing lanes, but a lot of legacy
		        // "containment" logic below can overwrite `data.group` based on stale modelview membership.
		        // Re-assert the intended lane membership based on current geometry, at the end of the move transaction.
			        try {
			          const lastPt = myDiagram?.lastInput?.documentPoint;
			          const containsType =
			            myMetamodel.findRelationshipTypeByName(constants.types.AKM_CONTAINS) ||
			            myMetis.findRelationshipTypeByName(constants.types.AKM_CONTAINS);
			          for (let it = myParts?.iterator; it?.next();) {
			            const part: go.Part = it.key;
			            if (!(part instanceof go.Node) || part instanceof go.Group) continue;
			            const k = part.data?.key;
			            if (!allowReparentForKey(k)) continue;
			            let target = resolveContainingGroupByOverlap(part);
			            if (!target && lastPt) target = resolveContainingGroupAtPoint(lastPt);
			            if (!target) continue;
			            const targetKey = String((target as any)?.key || (target as any)?.data?.key || "");
			            if (!targetKey) continue;
			            const lanePart = myDiagram.findNodeForKey(targetKey);
			            const laneCat = String((lanePart as any)?.data?.category || (lanePart as any)?.data?.template || (lanePart as any)?.category || "");
			            if (!laneCat.startsWith("Lane")) continue;
			            const cur = (typeof part.data?.group === "string") ? String(part.data.group) : "";
			            if (cur === targetKey) continue;

			            // Force a real GoJS reparent so `containingGroup` matches `data.group` immediately.
			            const newLane = lanePart instanceof go.Group ? lanePart : null;
			            if (newLane) {
			              const oldLane = part.containingGroup;
			              if (oldLane && oldLane !== newLane) {
			                const s = new go.Set<go.Part>();
			                s.add(part);
			                oldLane.removeMembers(s, true);
			              }
			              newLane.addMembers(new go.Set<go.Part>().add(part), true);
			            }

			            if (typeof (myDiagram.model as any)?.setGroupKeyForNodeData === "function") {
			              (myDiagram.model as any).setGroupKeyForNodeData(part.data, targetKey);
			            } else {
			              myDiagram.model.setDataProperty(part.data, "group", targetKey);
			            }
			            const ov = myMetis.findObjectView(k) || myModelview.findObjectView(k);
			            if (ov) {
			              ov.group = targetKey;
			              const jsnObjview = new jsn.jsnObjectView(ov);
			              uic.addItemToList(modifiedObjectViews, jsnObjview);
			            }

			            // Keep the underlying AKM_CONTAINS relationship consistent with the swimlane grouping.
			            // Some legacy code paths consult contains relationships/objectviews and can revert
			            // membership if this isn't updated.
			            if (containsType && ov) {
			              const toLaneOv = myMetis.findObjectView(targetKey) || myModelview.findObjectView(targetKey);
			              const memberOv = ov;
			              const toObj = toLaneOv?.object ? myModel.findObject(toLaneOv.object.id) : null;
			              const memberObj = memberOv?.object ? myModel.findObject(memberOv.object.id) : null;
			              if (toObj && memberObj) {
			                const relships = myModel.relships || [];
			                let existing: any = null;
			                for (let i = 0; i < relships.length; i++) {
			                  const r: any = relships[i];
			                  if (!r) continue;
			                  if (r?.type?.name !== constants.types.AKM_CONTAINS) continue;
			                  if (r?.toObject?.id === memberObj.id) { existing = r; break; }
			                }
			                if (existing && existing.fromObject?.id !== toObj.id) {
			                  existing.relocate(existing.fromObject, toObj, existing.toObject, memberObj);
			                } else if (!existing) {
			                  const relId = utils.createGuid();
			                  const relName = constants.types.AKM_CONTAINS;
			                  const rel = new akm.cxRelationship(relId, containsType as any, toObj, memberObj, relName, "");
			                  rel.parentModelRef = myModel.id;
			                  myModel.addRelationship(rel);
			                  toObj.addOutputrel(rel);
			                  memberObj.addInputrel(rel);
			                  myMetis.addRelationship(rel);
			                }
			                const relviews = myModelview.relshipviews || [];
			                for (let i = 0; i < relviews.length; i++) {
			                  const rv: any = relviews[i];
			                  const r = rv?.relship;
			                  if (!r || r?.type?.name !== constants.types.AKM_CONTAINS) continue;
			                  if (rv?.toObjview?.id !== memberOv.id) continue;
			                  rv.fromObjview = toLaneOv;
			                  rv.visible = false;
			                  rv.markedAsDeleted = false;
			                }
			              }
			            }
			          }
			        } catch (error) {
			        }


        if ((myDiagram as any).__dragAllowReparentKeys) delete (myDiagram as any).__dragAllowReparentKeys;
        if ((myDiagram as any).__dragAllowReparent) delete (myDiagram as any).__dragAllowReparent;
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
          // Handle relationship views marked as deleted in the modelview
          const relshipviews = myModelview.relshipviews;
          for (let i=0; i<relshipviews.length; i++) {
            const relview = relshipviews[i];
            if (relview.markedAsDeleted) {
              let fromView = relview.fromObjview;
              let toView = relview.toObjview;
              if (fromView && fromView.isGroup) {
                toView.group = "";
                const jsnObjview = new jsn.jsnObjectView(toView);
                modifiedObjectViews.push(jsnObjview);
              }
              toView = relview.toObjview;
              const gjsData = myDiagram.findLinkForKey(relview.id);
              if (gjsData) 
                uic.deleteLink(gjsData, true, context);
            }
            const jsnRelview = new jsn.jsnRelshipView(relview);
            modifiedRelshipViews.push(jsnRelview);
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
        e.subject.each(function (n) {
          const partData = n?.data;
          if (!partData) {
            return;
          }
          const node = partData.key !== undefined ? myDiagram.findNodeForKey(partData.key) : null;
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
              objview.viewkind = constants.viewkinds.CONT;
              objview.isGroup = partData.isGroup;
              objview.size = partData.size;
              if (objview.isGroup) {
                objview.viewkind = constants.viewkinds.CONT;
              } else {
                objview.viewkind = constants.viewkinds.OBJ;
              }
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
            objName = node?.data?.object?.name || partData.object?.name;
            objDescr = node?.data?.object?.description || partData.object?.description;
            type = myMetis.findObjectType(type.id);
            typeview = type.typeview;
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
              objview.isGroup = partData.isGroup;
              objview.objectRef = object.id;
              objview.groupLayout = partData.groupLayout;
              object.addObjectView(objview);
              myModelview.addObjectView(objview);
              myMetis.addObjectView(objview);
            }
            myModelview.setFocusObjectview(objview);
          }
          let fillcolor = "";
          let strokecolor = "";
          let textcolor = "";
          let part = partData;
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
            objview.isGroup = part.isGroup;
            objview = uic.setObjviewColors(part, object, objview, typeview, myDiagram);
            objview.loc = part.loc;
            objview.viewkind = type.viewkind;
            objview.scale = Number(part.scale);
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
          const dropPart = node || myDiagram.findNodeForKey(part.key);
          const group = dropPart ? resolveContainingGroup(dropPart) : null;
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
            // Check if the node has a relationship (contains) FROM a group, if not create it
            const myHasPartReltype = myMetamodel.findRelationshipTypeByName(constants.types.AKM_CONTAINS);
            const parenttype = parentgroup.objecttype;
            const parentObj = parentgroup.object;
            const childtype = type;
            const childObj = object;
            const myHasPartRelship = myModel.findRelationship1(parentObj, childObj, myHasPartReltype, null, null);
            if (!myHasPartRelship && parentObj && childObj) {
              // Create the relationship
              const relId = utils.createGuid();
              const relName = constants.types.AKM_CONTAINS;
              const hasPartRelship = new akm.cxRelationship(relId, myHasPartReltype, parentObj, childObj, relName, "");
              hasPartRelship.parentModelRef = myModel.id;
              myModel.addRelationship(hasPartRelship);
              parentObj.addOutputrel(hasPartRelship);
              childObj.addInputrel(hasPartRelship);
              myMetis.addRelationship(hasPartRelship);
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
        const affectedPoolKeys = new Set<string>();
        const resizedPoolKeys = new Set<string>();
        const resizedParts = new go.Set<go.Part>();
        const subjectPart = (e.subject as any)?.part || e.subject;
        if (subjectPart instanceof go.Part) {
          resizedParts.add(subjectPart);
        }
        const selection = e.diagram.selection;
        for (let it = selection.iterator; it?.next();) {
          const p = it.value;
          if (p instanceof go.Part) resizedParts.add(p);
        }
        for (let it = resizedParts.iterator; it?.next();) {
          let n = it.value;
          if (n.data.isGroup) {
            let objview: akm.cxObjectView;
            objview = myModelview.findObjectView(n.data.key);
            if (!objview) 
              continue;
            const category = n.data?.category || n.data?.template;
            if (category === 'Lane' || category === 'Lane_w_handles') {
              const laneMain = n.findObject("LANE_MAIN_SHAPE") as go.GraphObject | null;
              const laneHeader = n.findObject("LANE_HEADER_STRIP") as go.GraphObject | null;
              const laneBody = n.findObject("LANE_BODY_SHAPE") as go.GraphObject | null;
              if (laneBody || laneMain) {
                const headerWidth = laneHeader ? laneHeader.actualBounds.width : 36;
                const sourceWidth = laneBody ? laneBody.actualBounds.width : Math.max(20, (laneMain?.actualBounds.width || 0) - headerWidth);
                const sourceHeight = laneBody ? laneBody.actualBounds.height : (laneMain?.actualBounds.height || 0);
                const nextBodyWidth = Math.max(20, sourceWidth);
                const nextBodyHeight = Math.max(20, sourceHeight);
                if (laneBody) {
                  (laneBody as any).width = nextBodyWidth;
                  (laneBody as any).height = nextBodyHeight;
                }
                const bodySize = `${nextBodyWidth} ${nextBodyHeight}`;
                myDiagram.model.setDataProperty(n.data, "size", bodySize);
              }
            }
            objview.loc = n.data.loc;
            objview.size = n.data.size;
            let myNode = myGoModel.findNodeByViewId(n.data.key);
            myNode.size = objview.size;
            myNode.key = objview.id;
            if (category === 'Lane' || category === 'Lane_w_handles') {
              if (n.data?.group) affectedPoolKeys.add(n.data.group);
            } else if (category === 'Pool') {
              affectedPoolKeys.add(n.data.key);
              resizedPoolKeys.add(n.data.key);
            }
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
        if (resizedPoolKeys.size > 0) {
          (myDiagram as any).__preserveResizedPoolWidths = resizedPoolKeys;
        }
        relayoutPoolsByKeys(affectedPoolKeys);
        if (resizedPoolKeys.size > 0) {
          delete (myDiagram as any).__preserveResizedPoolWidths;
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
	        // Layout can recreate/update Link Parts; re-apply swimlane membership visibility rules.
	        applySwimlaneContainsVisibility();
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
        const gjsLink = e.subject;
        const key = gjsLink.key;
        const gjsLinkData = gjsLink.data;
        const myGoModel = myMetis.gojsModel;
        const goLink = myGoModel.findLink(key);        
        let fromNode = gjsLinkData.from; // gjsLinkData.fromNode;
        let fromPort = gjsLinkData.fromPort;
        let toNode = gjsLinkData.to; // gjsLinkData.toNode;
        let toPort = gjsLinkData.toPort;
        let goFromNode = myGoModel.findNode(fromNode);
        let goToNode = myGoModel.findNode(toNode);
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
        relview.toPortid = toPort;
        relview.fromPortid = fromPort;
        let points = [];
        for (let it = gjsLinkData.points.iterator; it?.next();) {
          const point = it.value;
          if (debug) console.log('1603 point', point.x, point.y);
          points.push(point.x)
          points.push(point.y)
        }
        relview.points = gjsLinkData.points;

        // Update link data
        uid.updateLinkAndView(gjsLinkData, goLink, relview, myDiagram);

        // Prepare for dispatch
        const jsnRelship = new jsn.jsnRelationship(relship);
        modifiedRelships.push(jsnRelship);
        const jsnRelview = new jsn.jsnRelshipView(relview);
        modifiedRelshipViews.push(jsnRelview);
        break;
      }
      case "LinkReshaped": {

        const myGoModel = myMetis.gojsModel;
        const gjsLink = e.subject;
        const key = gjsLink.key;
        const link = myDiagram.findLinkForKey(key);
        const goLink = myGoModel.findLink(key);        
        const data = goLink?.data;
        if (debug) console.log('1596 link, data', link, data);
        let relview = data?.relshipview;
        relview = myModelview.findRelationshipView(data?.key);
        if (relview) {
          const points = [];
          myDiagram.model.setDataProperty(data, "points", []);
          for (let it = data.points.iterator; it?.next();) {
            const point = it.value;
            if (debug) console.log('1603 point', point.x, point.y);
            points.push(point.x)
            points.push(point.y)
          }
          relview.points = points;
          const jsnRelview = new jsn.jsnRelshipView(relview);
          if (debug) console.log('1609 relview, jsnRelview', relview, jsnRelview);
          modifiedRelshipViews.push(jsnRelview);

          uid.updateLinkAndView(data, goLink, relview, myDiagram);
        }
        break;
      }
	      case "SubGraphCollapsed":
	      case "SubGraphExpanded": {
	        const affectedPoolKeys = new Set<string>();
	        e.subject.each(function (n) {
	          const data = n.data;
          const objview = data?.objectview;
          if (objview) {
            objview.isExpanded = data.isExpanded;
            const jsnObjview = new jsn.jsnObjectView(objview);
            modifiedObjectViews.push(jsnObjview);
          }
          const category = data?.category || data?.template;
          if (category === 'Lane' || category === 'Lane_w_handles') {
            if (data?.group) affectedPoolKeys.add(data.group);
          } else if (category === 'Pool') {
            if (data?.key) affectedPoolKeys.add(data.key);
          }
	        });
	        relayoutPoolsByKeys(affectedPoolKeys);
	        // Fix any nodes that were mistakenly parented to the Pool (won't hide on collapse)
	        // and clamp all lane members back into their lane bodies.
	        affectedPoolKeys.forEach((poolKey) => normalizeSwimlanePool(poolKey));
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

    // uic.handleContainedObjectViews(myModelview, myDiagram, myMetis);
    
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
