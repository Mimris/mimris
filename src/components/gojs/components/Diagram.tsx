// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as go from 'gojs';
import { produce } from 'immer';
import { ReactDiagram } from 'gojs-react';
import React, { useEffect } from 'react';
import Select, { components } from "react-select"
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Breadcrumb } from 'reactstrap'
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
import { FaSleigh, FaTemperatureLow, FaTumblrSquare } from 'react-icons/fa';
import { METHODS } from 'http';
import { set } from 'immer/dist/internal';
import { on } from 'process';
import { RegexParser } from 'regex-parser';
import printf from 'printf';
import classnames from 'classnames';
// import * as ReactModal from 'react-modal';
// import Popup from 'reactjs-popup';
// import 'reactjs-popup/dist/index.css';

import { SelectionInspector } from '../components/SelectionInspector';
import * as akm from '../../../akmm/metamodeller';
import * as gjs from '../../../akmm/ui_gojs';
import * as jsn from '../../../akmm/ui_json';
import * as uic from '../../../akmm/ui_common';
import * as uid from '../../../akmm/ui_diagram';
import * as uim from '../../../akmm/ui_modal';
import * as uit from '../../../akmm/ui_templates';
// import * as ui_mnu from '../../../akmm/ui_menus';
import * as ui_mtd from '../../../akmm/ui_methods';
import * as gen from '../../../akmm/ui_generateTypes';
import * as utils from '../../../akmm/utilities';
import * as constants from '../../../akmm/constants';
import { GuidedDraggingTool } from '../GuidedDraggingTool';
import LoadLocal from '../../../components/LoadLocal'
// import * as svgs from '../../utils/SvgLetters'
// import svgs from '../../utils/Svgs'
import { setMyGoModel, setMyMetisParameter } from '../../../actions/actions';
import { iconList } from '../../forms/selectIcons';
// import { stringify } from 'querystring';
// import './Diagram.css';
// import "../../../styles/styles.css"
// import "../BalloonLink.js";
import Toggle from '../../utils/Toggle';

const linkToLink = false;
const AllowTopLevel = true;

interface DiagramProps {
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
  selectedData: any;
  modelType: string;
  myMetis: akm.cxMetis;
  dispatch: any;
  skipsDiagramUpdate: boolean;
  onDiagramEvent: (e: go.DiagramEvent) => void;
  onModelChange: (e: go.IncrementalData) => void;
  diagramStyle: React.CSSProperties;
  onExportSvgReady: any;
}

interface DiagramState {
  myMetis: akm.cxMetis,
  showModal: boolean;
  selectedData: any;
  modalContext: any;
  selectedOption: any;
  currentActiveTab: any;
  // onExportSvgReady: any;
}

export class DiagramWrapper extends React.Component<DiagramProps, DiagramState> {
  // Maps to store key -> arr index for quick lookups
  private mapNodeKeyIdx: Map<go.Key, number>;
  private mapLinkKeyIdx: Map<go.Key, number>;

  /**
   * Ref to keep a reference to the Diagram component, which provides access to the GoJS diagram via getDiagram().
   */
  private diagramRef: React.RefObject<ReactDiagram>;
  private myMetis: akm.cxMetis;
  private myGoModel: gjs.goModel;
  private myGoMetamodel: gjs.goModel;
  private modelChangedListener: ((e: go.ChangedEvent) => void) | null = null;

  /** @internal */
  constructor(props: DiagramProps) {
    super(props);
    this.myMetis = props.myMetis;
    this.myMetis.modelType = props.modelType;
    this.diagramRef = React.createRef();
    this.state = {
      // myMetis: props.myMetis,
      nodeDataArray: this.props.nodeDataArray,
      linkDataArray: this.props.linkDataArray,
      showModal: false,
      selectedData: null,
      modalContext: null,
      selectedOption: null,
      currentActiveTab: null,
      diagramStyle: props.diagramStyle,
      onExportSvgReady: props.onExportSvgReady
    };
    // init maps
    this.mapNodeKeyIdx = new Map<go.Key, number>();
    this.mapLinkKeyIdx = new Map<go.Key, number>();

    this.initDiagram = this.initDiagram.bind(this);
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSelectDropdownChange = this.handleSelectDropdownChange.bind(this);

    const adminModel = this.myMetis.findModelByName(constants.admin.AKM_ADMIN_MODEL);
    this.myMetis.adminModel = adminModel;
    this.myMetis.showAdminModel = false;
    // this.myMetis.adminModel = null;
  }

  private syncSwimlaneCoreFeatureFlag(diagram?: go.Diagram) {
    const currentDiagram = diagram ?? this.diagramRef.current?.getDiagram();
    if (!(currentDiagram instanceof go.Diagram)) return;
    const modelData: any = currentDiagram.model?.modelData || this.props.modelData || {};
    const explicit = modelData?.useGoJSSwimlaneCore;
    const enabled = typeof explicit === 'boolean'
      ? explicit
      : process.env.NEXT_PUBLIC_USE_GOJS_SWIMLANE_CORE === 'true';
    (currentDiagram as any).__useGoJSSwimlaneCore = enabled;
    (currentDiagram as any).__legacySwimlaneOwnerQuarantined = enabled;
  }
  /**
   * Get the diagram reference and add any desired diagram listeners.
   * Typically the same function will be used for each listener, with the function using a switch statement to handle the events.
   */
  public componentDidMount() {
    if (!this.diagramRef.current) return;
    const diagram = this.diagramRef?.current?.getDiagram();
    if (diagram instanceof go.Diagram) {
      this.syncSwimlaneCoreFeatureFlag(diagram);
      uit.installLaneResizingTool(diagram, this.myMetis);
      diagram.addDiagramListener('TextEdited', this.props.onDiagramEvent);
      diagram.addDiagramListener('SelectionMoved', this.props.onDiagramEvent);
      diagram.addDiagramListener('SelectionCopied', this.props.onDiagramEvent);
      diagram.addDiagramListener('SelectionDeleting', this.props.onDiagramEvent);
      diagram.addDiagramListener('ExternalObjectsDropped', this.props.onDiagramEvent);
      diagram.addDiagramListener('InitialLayoutCompleted', this.props.onDiagramEvent);
      diagram.addDiagramListener('LayoutCompleted', this.props.onDiagramEvent);
      diagram.addDiagramListener('LinkDrawn', this.props.onDiagramEvent);
      diagram.addDiagramListener('LinkRelinked', this.props.onDiagramEvent);
      diagram.addDiagramListener('LinkReshaped', this.props.onDiagramEvent);
      diagram.addDiagramListener('SelectionDeleted', this.props.onDiagramEvent);
      diagram.addDiagramListener('ClipboardChanged', this.props.onDiagramEvent);
      diagram.addDiagramListener('ClipboardPasted', this.props.onDiagramEvent);
      diagram.addDiagramListener('ObjectSingleClicked', this.props.onDiagramEvent);
      diagram.addDiagramListener('ObjectDoubleClicked', this.props.onDiagramEvent);
      diagram.addDiagramListener('ObjectContextClicked', this.props.onDiagramEvent);
      diagram.addDiagramListener('PartResized', this.props.onDiagramEvent);
      diagram.addDiagramListener('SubGraphExpanded', this.props.onDiagramEvent);
      diagram.addDiagramListener('SubGraphCollapsed', this.props.onDiagramEvent);
      diagram.addDiagramListener('BackgroundSingleClicked', this.props.onDiagramEvent);
      diagram.addDiagramListener('BackgroundDoubleClicked', this.props.onDiagramEvent);

      diagram.addModelChangedListener(this.props.onModelChange);
      this.modelChangedListener = (e: go.ChangedEvent) => {
        if (!e.isTransactionFinished) return;
        const currentDiagram = diagram;
        const pendingPools = (currentDiagram as any).__pendingSwimlaneResizePoolKeys as Set<string> | undefined;
        if (!pendingPools || pendingPools.size === 0) return;
        const preserveWidths = (currentDiagram as any).__pendingPreserveResizedPoolWidths as Set<string> | undefined;
        delete (currentDiagram as any).__pendingSwimlaneResizePoolKeys;
        delete (currentDiagram as any).__pendingPreserveResizedPoolWidths;
        if (preserveWidths && preserveWidths.size > 0) {
          (currentDiagram as any).__preserveResizedPoolWidths = preserveWidths;
        }
        try {
          pendingPools.forEach((poolKey) => {
            const poolObjview =
              this.myMetis.findObjectView(poolKey) ||
              this.myMetis.currentModelview?.findObjectView(poolKey);
            if (poolObjview?.isGroup) {
              uid.doGroupLayout(poolObjview, currentDiagram, this.myMetis);
            }
          });
          currentDiagram.requestUpdate();
        } finally {
          delete (currentDiagram as any).__preserveResizedPoolWidths;
          delete (currentDiagram as any).__skipNextSwimlanePartResizedRelayout;
        }
      };
      diagram.addModelChangedListener(this.modelChangedListener);

      if (this.props.onExportSvgReady) {
        this.props.onExportSvgReady(this.exportSvg, true); // Pass true to indicate that the diagram is ready
      }

    }
  }

  public componentDidUpdate(prevProps: DiagramProps) {
    if (!this.diagramRef.current) return;
    const diagram = this.diagramRef.current.getDiagram();
    if (!(diagram instanceof go.Diagram)) return;
    if (prevProps.modelData !== this.props.modelData) {
      this.syncSwimlaneCoreFeatureFlag(diagram);
    }
  }

  /**
   * Get the diagram reference and remove listeners that were added during mounting.
   */
  public componentWillUnmount() {
    if (!this.diagramRef.current) return;
    const diagram = this.diagramRef.current.getDiagram();
    if (diagram instanceof go.Diagram) {
      diagram.removeDiagramListener('TextEdited', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionMoved', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionCopied', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionDeleting', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ExternalObjectsDropped', this.props.onDiagramEvent);
      diagram.removeDiagramListener('LinkDrawn', this.props.onDiagramEvent);
      diagram.removeDiagramListener('InitialLayoutCompleted', this.props.onDiagramEvent);
      diagram.removeDiagramListener('LinkRelinked', this.props.onDiagramEvent);
      diagram.removeDiagramListener('LinkReshaped', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionDeleted', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ClipboardChanged', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ClipboardPasted', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ObjectSingleClicked', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ObjectDoubleClicked', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ObjectContextClicked', this.props.onDiagramEvent);
      diagram.removeDiagramListener('PartResized', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SubGraphExpanded', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SubGraphCollapsed', this.props.onDiagramEvent);
      diagram.removeDiagramListener('BackgroundDoubleClicked', this.props.onDiagramEvent);
      diagram.removeDiagramListener('BackgroundSingleClicked', this.props.onDiagramEvent);

      diagram.removeModelChangedListener(this.props.onModelChange);
      if (this.modelChangedListener) {
        diagram.removeModelChangedListener(this.modelChangedListener);
        this.modelChangedListener = null;
      }

      if (this.props.onExportSvgReady) {
        this.props.onExportSvgReady(null, false); // Pass false to indicate that the diagram is not ready
      }
    }
  }

  public handleOpenModal(node, modalContext) {
    // Is implemented in "render" at the bottom of this file
    this.setState({
      selectedData: node,
      modalContext: modalContext,
      selectedOption: null,
      showModal: true,
      currentActiveTab: '0'
    });
  }

  public handleSelectDropdownChange = (selected) => {
    const myMetis = this.myMetis;
    const context = {
      "myMetis": myMetis,
      "myMetamodel": myMetis.currentMetamodel,
      "myModel": myMetis.currentModel,
      "myModelview": myMetis.currentModelview,
      "myGoModel": myMetis.gojsModel,
      "myDiagram": myMetis.myDiagram,
      "modalContext": this.state.modalContext
    }
    // Handle the links
    uim.handleSelectDropdownChange(selected, context);
    // Handle the relationships
  }

  public handleCloseModal(e) {
    const modalContext = this.state.modalContext;
    const myContext = modalContext.myContext;
    let myDiagram = modalContext.myDiagram;
    if (!myDiagram) myDiagram = myContext.myDiagram;
    // const data = modalContext.data;
    if (e === 'x') {
      const links = modalContext.links;
      for (let i = 0; i < links?.length; i++) {
        const link = links[i];
        myDiagram.model.removeLinkData(link);
      }
      this.setState({ showModal: false, selectedData: null, modalContext: null });
      return;
    }
    const props = this.props;
    if (modalContext.case === 'Connect to Selected')
      modalContext.what = "connectToSelected";
    uim.handleCloseModal(this.state.selectedData, props, modalContext);
    this.setState({ showModal: false });
  }

  //public handleInputChange(propname: string, value: string, fieldType: string, obj: any, context: any, isBlur: boolean) {
  public handleInputChange(props: any, value: string, isBlur: boolean) {
    const propname = props.id;
    const fieldType = props.type;
    const obj = props.obj;
    const context = props.context;
    const pattern = props.pattern;

    let run = false;
    this.setState(
      produce((draft: DiagramProps) => {
        if (run === false) {
          run = true;
          draft.selectedData[propname] = value;
        }
      })
    );

    uim.handleInputChange(this.myMetis, props, value);
  }

  /**
   * Diagram initialization method, which is passed to the ReactDiagram component.
   * This method is responsible for making the diagram and initializing the model, any templates,
   * and maybe doing other initialization tasks like customizing tools.
   * The model's data should not be set here, as the ReactDiagram component handles that.
   */

  private initDiagram(): go.Diagram {
    go.Diagram.licenseKey = "73f944e5b16131b700ca0d2a113f69ec5ef62e33c9820ce00b5645f4ed5b381476c9eb7c55d783c3d7ff46f41e2fc6deddcc6a2f951e556be238c1cc45b6d6f1b23724e740014588a50b2fca9dfb23f5f87875f0c2b770a7d82adff0efad90ce5fbff48140c91cab2f2d5637562cff4ba5ebda7afa06d34a7464";

    const $ = go.GraphObject.make;
    // go.GraphObject.fromLinkableDuplicates = true;
    // go.GraphObject.toLinkableDuplicates   = true;
    let defPattern = "";
    // define myDiagram
    let myDiagram;
    const myMetis = this.myMetis;
    if (myMetis) {
      myMetis.deleteViewsOnly = false;
      myMetis.pasteViewsOnly = false;
    }
    { // define myDiagram
      myDiagram =
        $(go.Diagram,
          {
            initialContentAlignment: go.Spot.Center,       // center the content
            initialAutoScale: go.Diagram.Uniform,
            "contextMenuTool.standardMouseSelect": function () {
              this.diagram.lastInput.shift = true;
              go.ContextMenuTool.prototype.standardMouseSelect.call(this);
            },
            // layout: new go.TreeLayout({ isOngoing: false }),
            "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
            "scrollMode": go.Diagram.InfiniteScroll,
            // "initialAutoScale": go.Diagram.UniformToFill,

            // "undoManager.isEnabled": true,  // must be set to allow for model change listening
            // "undoManager.maxHistoryLength": 1,  // uncomment disable undo/redo functionality

            // "LinkDrawn": maybeChangeLinkCategory,     // these two DiagramEvents call a
            // "LinkRelinked": maybeChangeLinkCategory,  // function that is defined below

            // draggingTool: new GuidedDraggingTool(),  // defined in GuidedDraggingTool.ts
            // 'draggingTool.horizontalGuidelineColor': 'blue',
            // 'draggingTool.verticalGuidelineColor': 'blue',
            // 'draggingTool.centerGuidelineColor': 'green',
            // 'draggingTool.guidelineWidth': 1,
            // "draggingTool.dragsLink": true,
            "draggingTool.dragsTree": false,
            "draggingTool.isGridSnapEnabled": true,
            "linkingTool.portGravity": 0,  // no snapping while drawing new links
            "linkingTool.archetypeLinkData": {
              "key": utils.createGuid(),
              "category": "Relationship",
              "type": constants.types.AKM_GENERIC_REL,
              "name": "",
              "description": "",
              "relshipkind": constants.relkinds.REL,
            },
            "linkingTool.isUnconnectedLinkValid": false,
            "relinkingTool.isUnconnectedLinkValid": false,
            "relinkingTool.portGravity": 20,
            "relinkingTool.fromHandleArchetype":
              $(go.Shape, "Diamond", { segmentIndex: 0, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "tomato", stroke: "darkred" }),
            "relinkingTool.toHandleArchetype":
              $(go.Shape, "Diamond", { segmentIndex: -1, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "darkred", stroke: "tomato" }),
            "linkReshapingTool.handleArchetype":
              $(go.Shape, "Diamond", { desiredSize: new go.Size(7, 7), fill: "lightblue", stroke: "deepskyblue" }),
            allowDrop: true,  // must be true to accept drops from the Palette
            grid: $(go.Panel, "Grid",
              $(go.Shape, "LineH", { stroke: "lightgray", strokeWidth: 0.5 }),
              $(go.Shape, "LineH", { stroke: "gray", strokeWidth: 0.5, interval: 10 }),
              $(go.Shape, "LineV", { stroke: "lightgray", strokeWidth: 0.5 }),
              $(go.Shape, "LineV", { stroke: "gray", strokeWidth: 0.5, interval: 10 })
            ),
            model: $(go.GraphLinksModel,
              {
                nodeCategoryProperty: "template",
                linkCategoryProperty: "template",
                nodeKeyProperty: 'key',
                linkKeyProperty: 'key',                  
                makeUniqueKeyFunction: (m: go.Model, data: any) => {
                  let k = utils.createGuid();
                  return k;
                },  
                makeUniqueLinkKeyFunction: (m: go.GraphLinksModel, data: any) => {
                  let k = utils.createGuid();
                  return k;
                },
              })
          }
	        );
	    }

	    // Enforce lane membership on Shift-drag completion. Without this, nodes can be dragged across
	    // lanes visually (Shift) but still keep their old `containingGroup`, causing the next drag to
	    // clamp/snap back into the source lane.
	    class SwimlaneDraggingTool extends go.DraggingTool {
	      private constraintLaneCache: Map<go.Part, go.Group> = new Map();

	      override doActivate() {
	        super.doActivate();
	        // Clear the cache at the start of each drag
	        this.constraintLaneCache.clear();
	      }

	      override doDeactivate() {
	        const diagram = this.diagram;
	        try {
	          const allowKeys: Set<string> | undefined = (diagram as any)?.__dragAllowReparentKeys;
	          const allowGlobal: boolean = !!(diagram as any)?.__dragAllowReparent;
	          if (diagram && (allowGlobal || (allowKeys && allowKeys.size > 0))) {
	            const dropPt = diagram.lastInput?.documentPoint;
	            const dragged = this.draggedParts;
	            if (dropPt && dragged) {
	              diagram.commit((d: go.Diagram) => {
	                const laneBodyBounds = (g: go.Group): go.Rect | null => {
	                  const body =
	                    (g.findObject("LANE_BODY_SHAPE") ||
	                      g.findObject("BODY")) as go.GraphObject | null;
	                  return body ? body.getDocumentBounds() : null;
	                };
	                
	                // Find any group at the drop point (lanes, containers, or other groups)
	                const findGroupAtPoint = (pt: go.Point): go.Group | null => {
	                  let best: { area: number; group: go.Group } | null = null;
	                  d.nodes.each((n: go.Node) => {
	                    if (!(n instanceof go.Group)) return;
	                    const cat = String(n.data?.category || n.data?.template || n.category || "");
	                    const isLane = cat.startsWith("Lane");
	                    
	                    // For lanes, use lane body bounds; for other groups, use actual bounds
	                    const bounds = isLane ? laneBodyBounds(n) : n.actualBounds;
	                    if (!bounds || !bounds.containsPoint(pt)) return;
	                    
	                    const area = Math.max(1, bounds.width * bounds.height);
	                    if (!best || area < best.area) best = { area, group: n };
	                  });
	                  return best ? best.group : null;
	                };
	                
	                const findGroupByOverlap = (part: go.Node): go.Group | null => {
	                  const nb = part.actualBounds;
	                  let best: { overlap: number; area: number; group: go.Group } | null = null;
	                  d.nodes.each((n: go.Node) => {
	                    if (!(n instanceof go.Group)) return;
	                    const cat = String(n.data?.category || n.data?.template || n.category || "");
	                    const isLane = cat.startsWith("Lane");
	                    
	                    const gb = isLane ? laneBodyBounds(n) : n.actualBounds;
	                    if (!gb) return;
	                    const ix1 = Math.max(nb.x, gb.x);
	                    const iy1 = Math.max(nb.y, gb.y);
	                    const ix2 = Math.min(nb.right, gb.right);
	                    const iy2 = Math.min(nb.bottom, gb.bottom);
	                    const overlap = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
	                    if (overlap <= 0) return;
	                    const area = Math.max(1, gb.width * gb.height);
	                    if (!best || overlap > best.overlap || (overlap === best.overlap && area < best.area)) {
	                      best = { overlap, area, group: n };
	                    }
	                  });
	                  return best ? best.group : null;
	                };

	                const targetGroup = findGroupAtPoint(dropPt) || ((): go.Group | null => {
	                  // If drop point is in header strip, overlap tends to still pick the correct group.
	                  // Use the first moved node as probe.
	                  for (let it = dragged.iterator; it?.next();) {
	                    const p: go.Part = it.key;
	                    if (p instanceof go.Node && !(p instanceof go.Group)) return findGroupByOverlap(p);
	                  }
	                  return null;
	                })();
	                
	                const targetKey = targetGroup ? String(targetGroup.data?.key || targetGroup.key || "") : "";

	                for (let it = dragged.iterator; it?.next();) {
	                  const part: go.Part = it.key;
	                  if (!(part instanceof go.Node) || part instanceof go.Group) continue;
	                  const k = part.data?.key;
	                  const allowed = allowGlobal || (allowKeys && k != null && allowKeys.has(String(k)));
	                  if (!allowed) continue;

	                  const cur = (typeof part.data?.group === "string") ? String(part.data.group) : "";
	                  
	                  // If dropped on background (no target group), remove from current group
	                  if (!targetGroup) {
	                    if (cur !== "") {
	                      // Remove from old group
	                      const oldGrp = part.containingGroup;
	                      if (oldGrp) {
	                        const s = new go.Set<go.Part>();
	                        s.add(part);
	                        oldGrp.removeMembers(s, true);
	                      }
	                      // Set group to undefined/empty
	                      if (typeof (d.model as any)?.setGroupKeyForNodeData === "function") {
	                        (d.model as any).setGroupKeyForNodeData(part.data, undefined);
	                      } else {
	                        d.model.setDataProperty(part.data, "group", "");
	                      }
	                    }
	                    continue;
	                  }
	                  
	                  // If already in target group, skip
	                  if (cur === targetKey) continue;

	                  // Reparent to target group
	                  const oldGrp = part.containingGroup;
	                  if (oldGrp && oldGrp !== targetGroup) {
	                    const s = new go.Set<go.Part>();
	                    s.add(part);
	                    oldGrp.removeMembers(s, true);
	                  }
	                  if (typeof (d.model as any)?.setGroupKeyForNodeData === "function") {
	                    (d.model as any).setGroupKeyForNodeData(part.data, targetKey);
	                  } else {
	                    d.model.setDataProperty(part.data, "group", targetKey);
	                  }
	                  targetGroup.addMembers(new go.Set<go.Part>().add(part), true);
	                }
	              }, "SwimlaneShiftReparent");
	            }
	          }
	        } catch {
	          // Best-effort only; never block drag completion.
	        }
		        // Do not clear `__dragAllowReparent*` here: SelectionMoved uses those markers to decide
		        // whether regrouping is allowed. They are cleared after persistence in GoJSApp.
		        super.doDeactivate();
		      }

		      override moveParts(parts: go.Map<go.Part, go.DraggingInfo>, offset: go.Point, check: boolean) {
		        const diagram = this.diagram;
		        
		        // Constrain nodes to stay within their lanes unless Shift is held (BEFORE moving, only during check)
		        let constrainedOffset = offset;
		        if (diagram && check) {
		          // Check both shift and control (ctrl acts as shift on some systems)
		          const shiftHeld = diagram.lastInput?.shift === true || diagram.lastInput?.control === true;
		          
		          if (!shiftHeld) {
		            // Find the most restrictive constraint
		            let mostRestrictiveOffsetY = offset.y;
		            let mostRestrictiveOffsetX = offset.x;
		            
		            for (let it = parts.iterator; it.next();) {
		              const part = it.key;
		              if (!(part instanceof go.Node) || part instanceof go.Group) continue;
		              
		              // Get the cached lane or find it geometrically
		              let lane = this.constraintLaneCache.get(part);
		              
		              if (!lane) {
		                // Find lane geometrically using actualBounds
		                const nodeBounds = part.actualBounds;
		                const nodeCenter = nodeBounds.center;
		                
		                let bestLane: go.Group | null = null;
		                let bestOverlapArea = 0;
		                let centerContained = false;
		                
		                const nodeIterator = diagram.nodes;
		                while (nodeIterator.next()) {
		                  const group = nodeIterator.value;
		                  if (!(group instanceof go.Group)) continue;
		                  
		                  const groupData: any = group.data || {};
		                  const category = String(groupData.template || groupData.category || group.category || "");
		                  const isLane = category === "Lane" || category === "Lane_w_handles" || category.startsWith("Lane");
		                  
		                  if (isLane) {
		                    const laneBounds = group.actualBounds;
		                    const containsCenter = laneBounds.containsPoint(nodeCenter);
		                    
		                    if (containsCenter && !centerContained) {
		                      bestLane = group;
		                      centerContained = true;
		                    } else if (!centerContained && nodeBounds.isReal() && laneBounds.isReal() && nodeBounds.intersectsRect(laneBounds)) {
		                      const intersection = nodeBounds.intersect(laneBounds);
		                      const overlapArea = intersection.width * intersection.height;
		                      
		                      if (overlapArea > bestOverlapArea && isFinite(overlapArea)) {
		                        bestLane = group;
		                        bestOverlapArea = overlapArea;
		                      }
		                    }
		                  }
		                }
		                
		                lane = bestLane;
		                
		                // Cache the lane for this part for the duration of this drag
		                if (lane) {
		                  this.constraintLaneCache.set(part, lane);
		                }
		              }
		              
		              if (!lane) continue;
		              
		              // Get lane content bounds
		              const bodyPanel = lane.findObject('BODY') as go.Panel | null;
		              let contentBounds: go.Rect;
		              
		              if (bodyPanel) {
		                contentBounds = bodyPanel.getDocumentBounds();
		              } else {
		                const laneBounds = lane.actualBounds;
		                const SWIMLANE_LANE_HEADER_WIDTH = 54;
		                contentBounds = new go.Rect(
		                  laneBounds.x + SWIMLANE_LANE_HEADER_WIDTH,
		                  laneBounds.y,
		                  laneBounds.width - SWIMLANE_LANE_HEADER_WIDTH,
		                  laneBounds.height
		                );
		              }
		              
		              // Get the original drag start position from GoJS's draggedParts
		              const dragInfo = this.draggedParts?.get(part);
		              if (!dragInfo) continue;
		              
		              const originalLoc = dragInfo.point;
		              const b = part.actualBounds;
		              const margin = 5;
		              
		              // Calculate the stable offset from location to bounds based on locationSpot
		              const locSpot = part.locationSpot;
		              const locToBoundsOffset = new go.Point(
		                -b.width * locSpot.x,
		                -b.height * locSpot.y
		              );
		              
		              // Calculate where bounds would be at the original location
		              const originalBoundsX = originalLoc.x + locToBoundsOffset.x;
		              const originalBoundsY = originalLoc.y + locToBoundsOffset.y;
		              
		              // Constrain Y axis
		              const proposedBoundsTop = originalBoundsY + offset.y;
		              const minBoundsY = contentBounds.y + margin;
		              const maxBoundsY = contentBounds.bottom - b.height - margin;
		              const constrainedBoundsY = Math.max(minBoundsY, Math.min(proposedBoundsTop, maxBoundsY));
		              const constrainedLocY = constrainedBoundsY - locToBoundsOffset.y;
		              const thisPartOffsetY = constrainedLocY - originalLoc.y;
		              
		              // Constrain X axis
		              const proposedBoundsLeft = originalBoundsX + offset.x;
		              const minBoundsX = contentBounds.x + margin;
		              const maxBoundsX = contentBounds.right - b.width - margin;
		              const constrainedBoundsX = Math.max(minBoundsX, Math.min(proposedBoundsLeft, maxBoundsX));
		              const constrainedLocX = constrainedBoundsX - locToBoundsOffset.x;
		              const thisPartOffsetX = constrainedLocX - originalLoc.x;
		              
		              // Take most restrictive (Y axis)
		              if (offset.y > 0) {
		                mostRestrictiveOffsetY = Math.min(mostRestrictiveOffsetY, thisPartOffsetY);
		              } else if (offset.y < 0) {
		                mostRestrictiveOffsetY = Math.max(mostRestrictiveOffsetY, thisPartOffsetY);
		              }
		              
		              // Take most restrictive (X axis)
		              if (offset.x > 0) {
		                mostRestrictiveOffsetX = Math.min(mostRestrictiveOffsetX, thisPartOffsetX);
		              } else if (offset.x < 0) {
		                mostRestrictiveOffsetX = Math.max(mostRestrictiveOffsetX, thisPartOffsetX);
		              }
		            }
		            
		            if (Math.abs(mostRestrictiveOffsetY - offset.y) > 0.01 || Math.abs(mostRestrictiveOffsetX - offset.x) > 0.01) {
		              constrainedOffset = new go.Point(mostRestrictiveOffsetX, mostRestrictiveOffsetY);
		            }
		          }
		        }
		        
		        super.moveParts(parts, constrainedOffset, check);
		      }
		    }

	    myDiagram.toolManager.draggingTool = new SwimlaneDraggingTool();

	    // when the user clicks on the background of the Diagram, remove all highlighting
	    myDiagram.click = function (e) {
	      e.diagram.commit(function (d) { d.clearHighlighteds(); }, "no highlighteds");
	    };
    myDiagram.myGoModel = this.myGoModel;
    myDiagram.myGoMetamodel = this.myGoMetamodel;
    myDiagram.dispatch = this.myMetis?.dispatch;
    myDiagram.handleOpenModal = this.handleOpenModal;
    myDiagram.handleCloseModal = this.handleCloseModal;
    myDiagram.selectedOption = this.state.selectedOption;
    myDiagram.routing = go.Link.Normal;
    myDiagram.state = this.state;
    myDiagram.toolTip =
      $("ToolTip", { margin: 4 },
        $(go.TextBlock, new go.Binding("text", "", diagramInfo),
          {
            font: "bold 16px Arial, sans-serif"
          }
        ),
        // use a converter to display information about the diagram model
      );
    myDiagram.grid.visible = true;
    myDiagram.toolManager.draggingTool.isGridSnapEnabled = true;
    uit.installLaneResizingTool(myDiagram, myMetis);
    myMetis.myDiagram = myDiagram;
    myDiagram.model.linkFromPortIdProperty = "fromPort";  // necessary to remember portIds
    myDiagram.model.linkToPortIdProperty = "toPort";
    const myModelview: akm.cxModelView = myMetis.currentModelview;
    if (myModelview) myModelview.diagram = myDiagram;

    if (myModelview?.name === constants.admin.AKM_ADMIN_MODELVIEW) {
      setLayout(myDiagram, myModelview?.layout);
    }

    uic.handleContainedObjectViews(myModelview, myDiagram, myMetis);


    // Tooltip functions
    function nodeInfo(d: any) {  // Tooltip info for a node data object
      return uid.nodeInfo(d, myMetis);
    }

    function linkInfo(d: any) {  // Tooltip info for a link data object
      return uid.linkInfo(d, myMetis);
    }

    function diagramInfo(model: any) {  // Tooltip info for the diagram's model
      return uid.diagramInfo(model);
    }

    // A CONTEXT is an Adornment with a bunch of buttons in them
    let advancedPartContextMenu: go.Adornment | null = null;
    let advancedLinkContextMenu: go.Adornment | null = null;
    let partContextMenu: go.HTMLInfo;
    let linkContextMenu: go.HTMLInfo;

    // Nodes CONTEXT MENU
    {
      advancedPartContextMenu =
        $(go.Adornment, "Vertical",
          makeButton("Copy",
            function (e: any, obj: any) {
              let node = obj.part;
              node = myDiagram.findNodeForKey(node.key);
              try {
                const myCollection = node.findSubGraphParts();
                if (myCollection) {
                  myCollection.add(node);
                  myDiagram.selectCollection(myCollection);
                }
              } catch {
              }
              const gjsNode = myDiagram.findNodeForKey(node?.key);
              let currentNode = obj.part.data;
              let selection = myDiagram.selection;
              if (selection.count == 0) {
                if (currentNode) myDiagram.select(myDiagram.findPartForKey(currentNode.key));
                selection = myDiagram.selection;
              }
              const gjsSourceNodes = []; // source nodes
              const gjsSourceLinks = []; // source links
              for (let it = selection.iterator; it?.next();) {
                let n = it.value;
                if (n instanceof go.Node) {
                  addSourceNode(gjsSourceNodes, n);
                } else if (n instanceof go.Link) {
                  addSourceLink(gjsSourceLinks, n);
                }
              }
              // Build the structure that is used in copy/paste
              selection = [];
              e.diagram.selection.each(function (sel) {
                const key = sel.data.key;
                sel.data.fromModelview = myMetis.currentModelview;
                sel.data.fromGoModel   = myMetis.gojsModel;
                sel.data.fromNode = getSourceNode(gjsSourceNodes, key);
                sel.data.fromLink = getSourceLink(gjsSourceLinks, key);
                selection.push(sel.data);
              });
              if (selection.length > 0) {
                myMetis.currentSelection = selection;
                e.diagram.commandHandler.copySelection();
              }
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                // node.diagram.selectCollection(node.findSubGraphParts());
                return true;
              }
              if (node.category === constants.gojs.C_RELATIONSHIP)
                return true;
            }),
          makeButton("Paste",
            function (e: any, obj: any) {
              myMetis.pasteViewsOnly = false;
              const point = e.diagram.toolManager.contextMenuTool.mouseDownPoint;
              e.diagram.commandHandler.pasteSelection(point);
            },
            function (o: any) {
              return o.diagram.commandHandler.canPasteSelection();
            }),
          makeButton("Paste View",
            function (e: any, obj: any) {
              myMetis.pasteViewsOnly = true;
              const point = e.diagram.toolManager.contextMenuTool.mouseDownPoint;
              e.diagram.commandHandler.pasteSelection(point);
            },
            function (o: any) {
              //return false;
              return o.diagram.commandHandler.canPasteSelection();
            }),
          makeButton("Add Lane(s)",
            function (e: any, obj: any) {
              const modifiedObjectViews = new Array();
              const gjsNode = obj.part.data;
              const selection = myDiagram.selection;
              for (let it = selection.iterator; it?.next();) {
                let n = it.value.data;
                if (n?.objecttype?.name === 'Swimlane') {
                  const lane: cxObjectView = n.objectview;
                  lane.group = gjsNode.key;
                  const jsnObjview = new jsn.jsnObjectView(lane);
                  uic.addItemToList(modifiedObjectViews, jsnObjview);
                }
              }
              modifiedObjectViews.map(mn => {
                let data = (mn) && mn
                if (mn.id) {
                  data = JSON.parse(JSON.stringify(data));
                  e.diagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
                }
              })
            },
            function (o: any) {
              // If objtype === 'Pool' or 'SwimPool' then true else false
              const node = o.part.data;
              const typeName = node.objecttype.name;
              if (typeName === 'Pool')
                return false;
              return false;
            }),
          makeButton("Edit Attribute",
            function (e: any, obj: any) {
              const node = obj.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                let object = node.object;
                if (!object) return;
                object = myMetis.findObject(object.id);
                const objtype = object?.type;
                if (objtype) {
                  const choices: string[] = [];
                  choices.push('description');
                  if (objtype.name === 'ViewFormat')
                    choices.push('viewFormat');
                  if (objtype.name === 'InputPattern')
                    choices.push('inputPattern');
                  const props = objtype.properties;
                  for (let i = 0; i < props?.length; i++) {
                    const prop = props[i];
                    choices.push(prop.name);
                  }
                  let defText = "";
                  if (choices.length > 0) defText = choices[0];
                  // const propname = prompt('Enter attribute name, one of ' + choices, defText);
                  // ---------------------------------
                  const modalContext = {
                    what: "selectDropdown",
                    title: "Select Property",
                    case: "Edit Attribute",
                    myDiagram: myDiagram
                  }
                  myMetis.currentNode = node;
                  myMetis.myDiagram = myDiagram;
                  myDiagram.handleOpenModal(choices, modalContext);
                }
              }
            },
            function (o: any) {
              return false;
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                const object = node.object;
                const objtype = object?.type;
                if (objtype) {
                  const props = objtype.properties;
                  if (props && props.length > 0) {
                    return true;
                  }
                }
              }
              return false;
            }),
          makeButton("Edit Object",
            function (e: any, obj: any) {
              const gjsNode = obj.part.data;
              uid.editObject(gjsNode, myMetis, myDiagram);
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                if (node.isSelected) {
                  return true;
                } else {
                  myDiagram.clearSelection();
                  node.isSelected = true;
                  uid.addToSelection(node, myDiagram);
                  return true;
                }
              }
            }),
          makeButton("Edit Objectview",
            function (e: any, obj: any) {
              const gjsNode = obj.part.data;
              uid.editObjectview(gjsNode, myMetis, myDiagram);
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                if (node.isSelected) {
                  return true;
                } else {
                  myDiagram.clearSelection();
                  node.isSelected = true;
                  uid.addToSelection(node, myDiagram);
                  return true;
                }
              }
            }),
          makeButton("Connect to Selected",
            function (e: any, obj: any) {
              const node = obj.part.data;
              node.isSelected = false;
              const fromTypeRef = node.objtypeRef;
              const fromType = myMetis.findObjectType(fromTypeRef);
              const nodes = [];
              const selection = myDiagram.selection;
              for (let it = selection.iterator; it?.next();) {
                let n = it.value;
                if (n.data.key === node.key)
                  continue;
                nodes.push(n.data);
              }
              const choices = uid.getConnectToSelectedTypes(node, selection, myMetis, myDiagram);
              const args = {
                fromType: fromType,
                nodeFrom: node,
                nodesTo: nodes,
                typeNames: choices,
              }
              const modalContext = {
                what: "selectDropdown",
                title: "Select Relationship Type",
                case: "Connect to Selected",
                myDiagram: myDiagram,
                args: args
              }
              myMetis.currentNode = node;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(node, modalContext);
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                const selection = myDiagram.selection;
                if (selection.count > 0)
                  return true;
                return false;
              }
              return false;
            }),
          makeButton("Add Connected Objects",
            function (e: any, obj: any) {

              let noLevels = '9';
              let reltypes = 'All';
              let reldir   = 'All';
              let useDefaults = confirm('Use default parameters?');
              if (useDefaults) {
                  noLevels = 9;
                  reltypes = 'All';
                  reldir === 'All'
              } else {
                  noLevels = prompt('Enter no of sublevels to follow', noLevels);
                  let reltypes = 'All';
                  reltypes = prompt('Enter relationship type to follow', reltypes);
                  if (reltypes === 'All') {
                      reltypes = '';
                  }
                  let reldir = 'All';
                  reldir = prompt('Enter relationship direction to follow (in | out | All)', reldir);
              }
              const params = {
                  noLevels: noLevels,
                  reltypes: reltypes,
                  reldir: reldir
              }

              const mySelection = myDiagram.selection;
              const nodes = [];
              for (let it = mySelection.iterator; it?.next();) {
                let n = it.value;
                const node = n.data;
                uid.addConnectedObjects(node, params, myMetis, myDiagram);                
              }
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                return true;
              }
              return false;
            }),
          makeButton("Hide Connected Relationships",
            function (e: any, obj: any) {
              const node = obj.part.data;
              const n = myDiagram.findNodeForKey(node.key);
              uid.hideConnectedRelationships(n, myMetis, myDiagram);
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                return true;
              }
              return false;
            }),
          makeButton("Change Icon",
            function (e: any, obj: any) {
              const node = obj.part.data;
              if (node) myDiagram.select(myDiagram.findPartForKey(node.key));
              const ilist = iconList()
              const iconLabels = ilist.map(il => (il) && il.label)
              const modalContext = {
                what: "selectDropdown",
                title: "Select Icon",
                case: "Change Icon",
                iconList: iconList(),
                currentNode: node,
                myDiagram: myDiagram
              }
              myMetis.currentNode = node;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(node, modalContext);
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                return true;
              }
              return false;
            }),
          makeButton("Test InputPattern",
            function (e: any, obj: any) {
              const node = obj.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                let object = node.object;
                object = myMetis.findObject(object.id);
                const objtype = object?.type;
                let patt = defPattern;
                patt = prompt('Enter input pattern', defPattern);
                if (patt.length > 0) {
                  defPattern = patt;
                  const regex = new RegexParser(patt);
                  const value = prompt('Value to check');
                  if (regex.test(value)) {
                    alert('Value: ' + value + ' IS valid');
                  } else {
                    alert('Value: ' + value + ' IS NOT valid');
                  }
                }
              }
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                let object = node.object;
                if (!object) return;
                object = myMetis.findObject(object.id);
                const objtype = object?.type;
                if (objtype?.name === 'InputPattern' || objtype?.name === 'Datatype') {
                  return true;
                }
              }
              return false;
            }),
          makeButton("Test Eval",
            function (e: any, obj: any) {
              const node = obj.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                let object = node.object;
                object = myMetis.findObject(object.id);
                const context = {
                  "myMetis": myMetis,
                  "reltype": "hasPart",
                  "reldir": "out",
                  "objtype": null,
                  "propname": "Cost"
                }
                let result = eval('context.reldir === "out"');
                alert(result);
              }
            },
            function (o: any) {
              return false;
            }),
          makeButton("Sort Selection",
            function (e: any, obj: any) {
              uid.sortSelection(myDiagram);
            },
            function (o: any) {
              const selection = myDiagram.selection;
              if (selection.count > 1)
                return true;
              else
                return false;
            }),
          makeButton("Add to Selection",
            function (e: any, obj: any) {
              uid.addToSelection(obj, myDiagram);
            },
            function (o: any) {
              return false;
            }),
          makeButton("Cut",
            function (e: any, obj: any) {
              e.diagram.commandHandler.cutSelection();
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                return false;
              } else
                return false;
              return o.diagram.commandHandler.canCutSelection();
            }),
          // makeButton("Delete Selection",
          //   function (e: any, obj: any) {
          //     let selection = myDiagram.selection;
          //     if (selection.count == 0) {
          //       const currentNode = obj.part.data;
          //       if (currentNode) myDiagram.select(myDiagram.findPartForKey(currentNode.key));
          //       selection = myDiagram.selection
          //     }
          //     if (confirm('Do you really want to delete the current selection?')) {
          //       const myGoModel = myMetis.gojsModel;
          //       myMetis.deleteViewsOnly = false;
          //       myDiagram.selection.each(function (sel) {
          //         const data = sel.data;
          //         if (data.category === constants.gojs.C_OBJECT) {
          //           const objview = myModelview.findObjectView(data.key);
          //           const object = objview.object;
          //           const objviews = object.objectviews;
          //           if (objviews) {
          //             objviews.forEach(ov => {
          //               let ovnode = myGoModel.findNodeByViewId(ov.id);
          //               if (ovnode) {
          //                 const n = myDiagram.findNodeForKey(ovnode.key);
          //                 if (n) n.isSelected = true;
          //               }
          //             })
          //           }
          //           let node = myGoModel.findNode(data.key);
          //           if (node?.isGroup) {
          //             const groupMembers = node.getGroupMembers(myGoModel);
          //             for (let i = 0; i < groupMembers?.length; i++) {
          //               const member = groupMembers[i];
          //               const n = myDiagram.findNodeForKey(member?.key);
          //             }
          //           }
          //           const n = myDiagram.findNodeForKey(node?.key);
          //           if (n)
          //             n.findLinksConnected().each(function (l) {
          //               l.isSelected = true;
          //             });
          //         }
          //         if (data.category === constants.gojs.C_OBJECTTYPE) {
          //           const node = myDiagram.findNodeForKey(data.key);
          //           node.findLinksConnected().each(function (l) {
          //             l.isSelected = true;
          //           });
          //         }
          //       })
          //       e.diagram.commandHandler.deleteSelection();
          //     }
          //   },
          //   function (o: any) {
          //     return false;
          //     const node = o.part.data;
          //     if (node.isSelected) {
          //       return o.diagram.commandHandler.canDeleteSelection();
          //     } else
          //       return true;
          //   }),
          makeButton("Delete Selection",
            function (e: any, obj: any) {
              if (confirm('Do you really want to delete the current selection?')) {
                const myModel = myMetis.currentModel;
                const myGoModel = myMetis.gojsModel;
                myMetis.deleteViewsOnly = false;
                // myDiagram.selection.each(function (sel) {
                //   const data = sel.data;
                //   if (data.category === constants.gojs.C_OBJECT) {
                //     const objview = myModelview.findObjectView(data.key);
                //     const object = objview.object;
                //     const objviews = object.objectviews;
                //     if (objviews) {
                //       objviews.forEach(ov => {
                //         let ovnode = myGoModel.findNodeByViewId(ov.id);
                //         if (ovnode) {
                //           const n = myDiagram.findNodeForKey(ovnode.key);
                //           if (n) n.isSelected = true;
                //         }
                //       })
                //     }
                //     let node = myGoModel.findNode(data.key);
                //     if (node?.isGroup) {
                //       const groupMembers = node.getGroupMembers(myGoModel);
                //       for (let i = 0; i < groupMembers?.length; i++) {
                //         const member = groupMembers[i];
                //         const n = myDiagram.findNodeForKey(member?.key);
                //       }
                //     }
                //     const n = myDiagram.findNodeForKey(node?.key);
                //     if (n)
                //       n.findLinksConnected().each(function (l) {
                //         l.isSelected = true;
                //       });
                //   }
                //   if (data.category === constants.gojs.C_OBJECTTYPE) {
                //     const node = myDiagram.findNodeForKey(data.key);
                //     node.findLinksConnected().each(function (l) {
                //       l.isSelected = true;
                //     });
                //   }
                // })
                myDiagram.commandHandler.deleteSelection();
              }
            },
            function (o: any) {
              let selection = myDiagram.selection;
              const node = o.part.data;
              if (node.isSelected && selection.count > 1) {
                return o.diagram.commandHandler.canDeleteSelection();
              } else
                return false;
            }),
          makeButton("Delete",
            function (e: any, obj: any) {
              let node = obj.part;
              node = myDiagram.findNodeForKey(node.key);
              if (node.data.isGroup) {
                if (confirm('Do you want to also delete the content?')) {
                  try {
                    const myCollection = node.findSubGraphParts();
                    myCollection.add(node);
                    myDiagram.selectCollection(myCollection);
                  } catch {
                  }
                }
              }
              if (confirm('Do you really want to delete the current selection?')) {
                myMetis.deleteViewsOnly = false;
                myMetis.currentNode = obj.part.data;
                myDiagram.commandHandler.deleteSelection();
              }
            },
            function (o: any) {
              let selection = myDiagram.selection;
              const node = o.part.data;
              if (node.isSelected && selection.count == 1) {
                return o.diagram.commandHandler.canDeleteSelection();
              } else
                return false;
            }),
          makeButton("Delete View",
            function (e: any, obj: any) {
              if (confirm('Do you really want to delete the current selection?')) {
                const myModel = myMetis.currentModel;
                myMetis.deleteViewsOnly = true;
                myMetis.currentNode = obj.part.data;
              }
              myDiagram.commandHandler.deleteSelection();
            },
            function (o: any) {
              let selection = myDiagram.selection;
              const node = o.part.data;
              if (node.isSelected && selection.count == 1) {
                return o.diagram.commandHandler.canDeleteSelection();
              } else
                return false;
            }),
          makeButton("Delete Selected Views",
            function (e: any, obj: any) {
              if (confirm('Do you really want to delete the current selection?')) {
                const myModel = myMetis.currentModel;
                myMetis.deleteViewsOnly = true;
                myMetis.currentNode = obj.part.data;
              }
              myDiagram.commandHandler.deleteSelection();
            },
            function (o: any) {
              let selection = myDiagram.selection;
              const node = o.part.data;
              if (node.isSelected && selection.count > 1) {
                return o.diagram.commandHandler.canDeleteSelection();
              } else
                return false;
            }),
          makeButton("----------"),
          makeButton("Add Port",
            function (e: any, obj: any) {
              const gjsNode = obj.part.data;
              const choices = ['left', 'right', 'top', 'bottom'];
              // const choices = ['Input', 'Output', 'Control', 'Mechanism'];
              let defText = "";
              if (choices.length > 0) defText = choices[0];
              const modalContext = {
                what: "selectDropdown",
                title: "Select Side",
                case: "Add Port",
                node: gjsNode,
                myDiagram: myDiagram
              }
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(choices, modalContext);
              return;
            },
            function (o: any) {
              if (myMetis.modelType == 'Modelling') {

                const gjsNode = obj.part.data;
                let objectview: akm.cxObjectView = myMetis.findObjectView(objviewRef);
                let object: akm.cxObject = myMetis.findObject(objectview.objectRef);
                const objtypeRef = gjsNode.objtypeRef;
                let objecttype: akm.cxObjectType = myMetis.findObjectType(objtypeRef);

                const node = o.part.data;

                switch (node.template) {
                  case 'Container1':
                  case 'nodeWithPorts':
                  case 'groupWithPorts':
                  case 'groupWithIconAndPorts':
                  case 'groupWithGeoAndPorts':
                  case 'groupWithFigAndPorts':
                    return true;
                }
              }
              return false;
            }),
          makeButton("Export Task Model",
            function (e: any, o: any) {
              const node = o.part.data;
              uid.exportTaskModel(node, myMetis, myDiagram);
            },
            function (o: any) {
              if (myMetis.modelType == 'Modelling') {
                const node = o.part.data;
                const obj = node.object;
                const objtype = obj?.type;
                if (objtype?.name === constants.types.AKM_CONTAINER) {
                  return true;
                }
                else
                  return false;
              }
            }),
          makeButton("Generate Datatype",
            function (e: any, obj: any) {
              const context = {
                "myMetis": myMetis,
                "myMetamodel": myMetis.currentMetamodel,
                "myTargetMetamodel": myMetis.currentTargetMetamodel,
                "myModel": myMetis.currentModel,
                "myModelview": myMetis.currentModelview,
                "myDiagram": e.diagram,
                "dispatch": e.diagram.dispatch
              }
              if (!myMetis.currentTargetMetamodel)
                myMetis.currentTargetMetamodel = myMetis.currentMetamodel;
              const contextmenu = obj.part;
              const part = contextmenu.adornedPart;
              const currentObj = part.data.object;
              context.myTargetMetamodel = gen.askForMetamodel(context, true);
              myMetis.currentModel.targetMetamodelRef = context.myTargetMetamodel.id;

              const jsnModel = new jsn.jsnModel(context.myModel, true);
              const modifiedModels = new Array();
              modifiedModels.push(jsnModel);
              modifiedModels.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                e.diagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
              })

              const dtype = gen.generateDatatype(currentObj, context);
              if (dtype) {
                const jsnDatatype = new jsn.jsnDatatype(dtype);
                const modifiedDatatypes = new Array();
                modifiedDatatypes.push(jsnDatatype);
                modifiedDatatypes.map(mn => {
                  let data = mn;
                  data = JSON.parse(JSON.stringify(data));
                  e.diagram.dispatch({ type: 'UPDATE_DATATYPE_PROPERTIES', data })
                })
              }
            },
            function (o: any) {
              const obj = o.part.data.object;
              const objtype = obj?.type;
              if (objtype?.name === constants.types.AKM_DATATYPE)
                return true;
              return false;
            }),
          makeButton("Generate Metamodel",
            function (e: any, obj: any) {
              const metamodelName = obj.part.data.name;
              if (confirm('Do you want to generate the metamodel ' + metamodelName + ' ?')) {
                let targetMetamodel = myMetis.findMetamodelByName(metamodelName);
                if (!targetMetamodel) {
                  targetMetamodel = new akm.cxMetaModel(utils.createGuid(), metamodelName);
                  myMetis.addMetamodel(targetMetamodel);
                  myMetis.currentModel.targetMetamodelRef = targetMetamodel?.id
                  let mmdata = new jsn.jsnModel(myMetis.currentModel, true);
                  mmdata = JSON.parse(JSON.stringify(mmdata));
                  myMetis.myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data: mmdata });
                }
                let myCurrentObject;
                let myCurrentObjectview;
                myCurrentObject = myMetis.currentModel.findObject(obj.part.data.object.id);
                myCurrentObjectview = myMetis.currentModelview.findObjectView(obj.part.data.objectview.id);
                if (myCurrentObject && myCurrentObjectview) {
                  const context = {
                    "myMetis": myMetis,
                    "myMetamodel": myMetis.currentMetamodel,
                    "myTargetMetamodel": targetMetamodel,
                    "myModel": myMetis.currentModel,
                    "myModelview": myMetis.currentModelview,
                    "myCurrentObject": myCurrentObject,
                    "myCurrentObjectview": myCurrentObjectview,
                    "myDiagram": e.diagram,
                    "dispatch": e.diagram.dispatch
                  }
                  gen.generateTargetMetamodel2(context);
                }
              }
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              else if (uic.isGenericMetamodel(myMetis)) {
                return false;
              }
              return true;
            }),
          makeButton("Generate Submodel(s)",
            function (e: any, obj: any) {
              const node = obj.part.data;
              const objectview = myMetis.findObjectView(node.key);
              let object = objectview.object;
              uid.addSubModels(object, myMetis, myDiagram);
              myDiagram.requestUpdate();
            },
            function (o: any) {
              if (myMetis.modelType == 'Modelling') {
                const node = o.part.data;
                const myGoModel = myMetis.gojsModel;
                const myNode = myGoModel.findNode(node.key);
                const objview = myMetis.findObjectView(node.key);
                let object = objview?.object;
                const objtype = object.type;
                if (objtype?.name === constants.types.AKM_METAMODEL) {
                  const myModel: akm.cxModel = myMetis.currentModel;
                  let metamodelObject: akm.cxObject = myModel.findObject(object.id);
                  metamodelObject = myModel.findObject(metamodelObject.id);
                  if (metamodelObject) {
                    const submodelObjects = uid.getSubModelObjects(metamodelObject, myMetis);
                    if (submodelObjects.length > 0)
                      return true;
                    return false;
                  }
                }
                else
                  return false;
              }
            }),
          makeButton("Edit Object Type",
            function (e: any, obj: any) {
              const node = obj.part.data;
              const icon = uit.findImage(node.icon);
              const modalContext = {
                what: "editObjectType",
                title: "Edit Object Type",
                icon: icon,
                myDiagram: myDiagram
              }
              myMetis.currentNode = node;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(node, modalContext);
              // 
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECTTYPE) {
                return true;
              }
              return false;
            }),
          makeButton("Change Object Type",
            function (e: any, obj: any) {
              const node = obj.part.data;
              const currentType = node.objecttype;
              const myMetamodel = myMetis.currentMetamodel;
              const objtypes = myMetamodel.getObjectTypes();
              node.choices = [];
              if (objtypes) {
                for (let i = 0; i < objtypes.length; i++) {
                  const otype = objtypes[i];
                  if (!otype.markedAsDeleted) {
                    if (otype.name === 'Generic' || otype.name === 'Element')
                      continue;
                    node.choices.push(otype.name);
                  }
                }
              }
              const modalContext = {
                what: "selectDropdown",
                title: "Select Object Type",
                case: "Change Object type",
                myDiagram: myDiagram
              }
              myMetis.currentNode = node;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(node.choices, modalContext);
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                return true;
              }
              return false;
            }),
          makeButton("Show Typeview",
            function (e: any, obj: any) {
              const node = obj.part.data;
              uid.editObjectTypeview(node, myMetis, myDiagram, true);
            },
            function (o: any) {
              // return false;
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT)
                if (node.isSelected) {
                  return true;
                } else {
                  myDiagram.clearSelection();
                  node.isSelected = true;
                  uid.addToSelection(node, myDiagram);
                  return true;
                }
              // else if (node.category === constants.gojs.C_OBJECTTYPE)
              //   return true;
              else
                return false;
            }),
          makeButton("Reset to Typeview",
            function (e: any, obj: any) {
              let selection = myDiagram.selection;
              if (selection.count == 0) {
                const currentNode = obj.part.data;
                if (currentNode) myDiagram.select(myDiagram.findPartForKey(currentNode.key));
                selection = myDiagram.selection;
              }
              const myGoModel = myMetis.gojsModel;
              myDiagram.selection.each(function (sel) {
                const inst = sel.data;
                if (inst.category === constants.gojs.C_OBJECT) {
                  uid.resetToTypeview(inst, myMetis, myDiagram);
                }
              })
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                if (node.isSelected) {
                  return true;
                } else {
                  const selection = myDiagram.selection;
                  if (selection.count == 0)
                    return true;
                  else
                    return false;
                }
              }
              return false;
            }),
          makeButton("Convert to Group",
            function (e: any, obj: any) {
              const noPorts = confirm("No Ports (OK) or Allow Ports?");
              const allowPorts = !noPorts;
              const node = obj.part.data; 
              let objview = myMetis.findObjectView(node?.key);
              if (objview) {
                objview.viewkind = 'Container';
                let template = node.template;
                switch (template) {
                  case 'textAndGeometry':
                    template = allowPorts ? 'groupWithGeoAndPorts' : 'groupGeoNoPorts';
                    break;
                  case 'textAndFigure':
                    template = allowPorts ? 'groupWithFigAndPorts' : 'groupFigNoPorts';
                    break;
                  case 'textAndIcon':
                  default:
                    template = allowPorts ? 'groupWithPorts' : 'groupNoPorts';
                    break;
                }
                objview.template = template;
                objview.isGroup = true;
                // objview.size = "200 100";
                objview.viewkind = 'Container';
                // node.objectview = objview;
                node.template = template;
                node.viewkind = 'Container';
                const jsnObjview = new jsn.jsnObjectView(objview);
                jsnObjview.template = template;
                const data = JSON.parse(JSON.stringify(jsnObjview));
                myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });

                myDiagram.model.setCategoryForNodeData(node.data, template);
              } else 
                alert("You need to do a Reload to see the change!");
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                if (node.viewkind !== 'Container')
                  return true;
              }
              return false;
            }),
          makeButton("Convert to Node",
            function (e: any, obj: any) {
              const node = obj.part.data;
              let objview = myMetis.findObjectView(node?.key);
              objview = myMetis.findObjectView(objview?.id);
              if (objview) {
                objview.viewkind = 'Object';
                objview.template = 'textAndIcon'
                objview.isGroup = false;
                // objview?.size = "200 100";
                // node.objectview = objview;
              }
              node.viewkind = 'Object';
            //  this.setState(
            //     {
            //       nodeDataArray: [
            //         ...this.state.nodeDataArray,
            //         node
            //       ]
            //     }
            //   );
              const jsnObjview = new jsn.jsnObjectView(objview);
              const data = JSON.parse(JSON.stringify(jsnObjview));
              myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
              alert("You need to a Reload to see the change!");
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                const objview = node.objectview;
                if (objview?.viewkind === 'Container')
                  return true;
              }
              return false;
            }),
          makeButton("Open Group",
            function (e: any, obj: any) {
              const n = obj.part.data;
              n.isSubGraphExpanded = true;
              const node = n.data;
              node.isExpanded = true;
              const objview = node.objectview;
              objview.isExpanded = true;
              const jsnObjview = new jsn.jsnObjectView(objview, true);
              const data = JSON.parse(JSON.stringify(jsnObjview));
              myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                const objview = node.objectview;
                if (objview?.viewkind === 'Container') {
                  if (objview?.isExpanded === false)
                    return true;
                }
              }
              return false;
            }),
          makeButton("Align Vertical",
            function (e: any, obj: any) {
              let node = obj.part.data;
              const mySelection = myDiagram.selection;
              const selectedNodes = [];
              mySelection.each(function(n) {
                if (n instanceof go.Link) 
                  return;
                else
                  selectedNodes.push(n);
              });
              uid.alignNodes(node, selectedNodes, 'vertical', myMetis);
              const selectedLinks = [];
              mySelection.each(function(l) {
                if (l instanceof go.Node) 
                  return;
                else
                selectedLinks.push(l);
              });
              uid.clearPath(selectedLinks, myMetis, myDiagram);
            },
            function (o: any) {
              // return false;
              const mySelection = myDiagram.selection;
              let cnt = 0;
              if (mySelection.count > 1) {
                mySelection.each(function(n) {
                  if (n instanceof go.Link) return;
                  cnt++;
                });
                if (cnt > 1)
                  return true;
              } else
                return false;
              }),
          makeButton("Align Horizontal",
            function (e: any, obj: any) {
              let node = obj.part.data;
              const mySelection = myDiagram.selection;
              const selectedNodes = [];
              mySelection.each(function(n) {
                if (n instanceof go.Link) 
                  return;
                else
                  selectedNodes.push(n);
              });
              uid.alignNodes(node, selectedNodes, 'horizontal', myMetis);
              const selectedLinks = [];
              mySelection.each(function(l) {
                if (l instanceof go.Node) 
                  return;
                else
                selectedLinks.push(l);
              });
              uid.clearPath(selectedLinks, myMetis, myDiagram);
            },
            function (o: any) {
              // return false;
              const mySelection = myDiagram.selection;
              let cnt = 0;
              if (mySelection.count > 1) {
                mySelection.each(function(n) {
                  if (n instanceof go.Link) return;
                  cnt++;
                });
                if (cnt > 1)
                  return true;
              } else
                return false;
              }),
          makeButton("Spread Even Vertical",
            function (e: any, obj: any) {
              let node = obj.part.data;
              const mySelection = myDiagram.selection;
              const selectedNodes = [];
              mySelection.each(function(n) {
                if (n instanceof go.Link) 
                  return;
                else
                  selectedNodes.push(n);
              });
              uid.spreadEven(node, selectedNodes, 'vertical', myMetis);
              const selectedLinks = [];
              mySelection.each(function(l) {
                if (l instanceof go.Node) 
                  return;
                else
                selectedLinks.push(l);
              });
              uid.clearPath(selectedLinks, myMetis, myDiagram);
            },
            function (o: any) {
              // return false;
              const mySelection = myDiagram.selection;
              let cnt = 0;
              if (mySelection.count > 1) {
                mySelection.each(function(n) {
                  if (n instanceof go.Link) return;
                  cnt++;
                });
                if (cnt > 1)
                  return true;
              } else
                return false;
              }),
          makeButton("Spread Even Horizontal",
            function (e: any, obj: any) {
              let node = obj.part.data;
              const mySelection = myDiagram.selection;
              const selectedNodes = [];
              mySelection.each(function(n) {
                if (n instanceof go.Link) 
                  return;
                else
                  selectedNodes.push(n);
              });
              uid.spreadEven(node, selectedNodes, 'horizontal', myMetis);
              const selectedLinks = [];
              mySelection.each(function(l) {
                if (l instanceof go.Node) 
                  return;
                else
                selectedLinks.push(l);
              });
              uid.clearPath(selectedLinks, myMetis, myDiagram);
            },
            function (o: any) {
              // return false;
              const mySelection = myDiagram.selection;
              let cnt = 0;
              if (mySelection.count > 1) {
                mySelection.each(function(n) {
                  if (n instanceof go.Link) return;
                  cnt++;
                });
                if (cnt > 1)
                  return true;
              } else
                return false;
              }),
          makeButton("----------"),
          makeButton("Set Layout Scheme",
            function (e: any, obj: any) {
              const n = obj.part.data;
              let objview = n.objectview;
              objview = myModelview.findObjectView(n.key);
              const layoutList = () => [
                { value: "Circular", label: "Circular Layout" },
                { value: "Grid", label: "Grid Layout" },
                { value: "Tree", label: "Tree Layout" },
                { value: "ForceDirected", label: "ForceDirected Layout" },
                { value: "LayeredDigraph", label: "LayeredDigraph Layout" },
                { value: "Manual", label: "Manual Layout" },
              ];
              const modalContext = {
                what: "selectDropdown",
                title: "Set Layout Scheme",
                case: "Set Layout Scheme",
                layoutList: layoutList(),
                myDiagram: myDiagram,
                myModelview: myModelview,
                objectview: objview,
              }
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(myDiagram, modalContext);
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                const objview = node.objectview;
                if (objview?.isGroup) {
                  if (objview?.isExpanded === true)
                    return true;
                }
              }
              return false;
            }),
          makeButton("Do Layout",
            function (e: any, obj: any) {
              let layout = ""
              let node = obj.part.data;
              const key = node.key;
              const objview = myMetis.findObjectView(key);
              if (objview) {
                if (!objview?.isGroup) {
                  const mySelection = myDiagram.selection;
                  uid.doTreeLayout(mySelection, myModelview, myDiagram, true);

                //   myDiagram.selection.each(function (sel) {
                //     const link = sel.data;
                //     if (link.category === constants.gojs.C_RELATIONSHIP) {
                //       const fromLink = link.from;
                //       const toLink = link.to;
                //       let relview: akm.cxRelationshipView = link.relshipview;
                //       relview = myModelview.findRelationshipView(relview?.id);
                //       if (relview) {
                //         const fromObjview = relview.fromObjview;
                //         const toObjview = relview.toObjview;
                //         link.points = [];
                //         link.from = fromLink;
                //         link.to = toLink;
                //         myDiagram.model.setDataProperty(link, "points", link.points);
                //         relview.points = [];
                //         relview.fromObjview = fromObjview;
                //         relview.toObjview = toObjview;
                //         // const jsnRelView = new jsn.jsnRelshipView(relview);
                //         // modifiedRelshipViews.push(jsnRelView);
                //       }
                //     }
                //   }
                // )

                } else {
                  if (objview?.groupLayout !== "ManualLayout")
                    uid.doGroupLayout(objview, myDiagram, myMetis);
                }
              }
              myDiagram.requestUpdate();
            },
            function (obj: any) {
              let node = obj.part.data;
              const key = node.key;
              const objview = myMetis.findObjectView(key);
              if (objview?.isGroup)
                return true;
              else
                return false;
            }),
          makeButton("Generate Target Object Type",
            function (e: any, obj: any) {
              const context = {
                "myMetis": myMetis,
                "myMetamodel": myMetis.currentMetamodel,
                "myTargetMetamodel": myMetis.currentTargetMetamodel,
                "myModel": myMetis.currentModel,
                "myCurrentModelview": myMetis.currentModelview,
                "myDiagram": e.diagram,
                "dispatch": e.diagram.dispatch
              }
              const contextmenu = obj.part;
              const part = contextmenu.adornedPart;
              const currentObj = part.data.object;
              context.myTargetMetamodel = myMetis.currentTargetMetamodel;
              gen.askForTargetMetamodel(context);
            },
            function (o: any) {
              let obj = o.part.data.object;
              let objtype = obj?.type;
              if (objtype?.name === constants.types.AKM_INFORMATION)
                return false;
              else
                return false;
            }),
          makeButton("----------"),
          makeButton("Select all objects of this type",
            function (e: any, obj: any) {
              const currentNode = obj.part.data;
              const currentObject = currentNode.object;
              const currentType = currentObject.type;
              const nodes = myDiagram.nodes;
              for (let it = nodes.iterator; it?.next();) {
                const node = it.value;
                if (node.data.object.type.id == currentType.id) {
                  node.isSelected = true;
                }
              }
            },
            function (o: any) {
              return true;
            }),
          makeButton("Select Content",
            function (e: any, obj: any) {
              let node = obj.part;
              node = myDiagram.findNodeForKey(node.key);
              const myCollection = node.findSubGraphParts();
              myCollection.add(node);
              try {
                myDiagram.selectCollection(myCollection);
              } catch {}
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                if (node.isGroup)
                  return true;
              }
              return false;
            }),
          makeButton("Select connected objects",
            function (e: any, obj: any) {
              const node = obj.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                let noLevels = 1;
                noLevels = prompt('Enter no of sublevels to follow', noLevels);
                let reldir = '';
                reldir = prompt('Enter relationship direction to follow (in | out)', reldir);
                let reltypes = '';
                reltypes = prompt('Enter relationship type to follow', reltypes);
                const myModelview = myMetis.currentModelview;
                let objectview = node.objectview as akm.cxObjectView;
                objectview = myModelview.findObjectView(node.key);
                const objectviews = new Array();
                objectviews.push(objectview);
                const relshipviews = new Array();
                const method = new akm.cxMethod(utils.createGuid(), 'selectConnected', "");
                method["reldir"] = '';
                method["objtypes"] = '';
                method["reltypes"] = reltypes;
                method["valuecondition"] = null;
                method["nolevels"] = noLevels;
                method["preaction"] = "Select";
                method["postaction"] = "";
                method["propname"] = "";
                method["noObjects"] = 0;
                const args = {
                  "method": method
                }
                const context = {
                  "myMetis": myMetis,
                  "myModel": myMetis.currentModel,
                  "myModelview": myMetis.currentModelview,
                  "myDiagram": myDiagram,
                  "args": args,
                  "objectviews": objectviews,
                  "relshipviews": relshipviews,
                  "currentObjectview": objectview,
                  "traverseViews": true,
                  "level": 0,
                }
                ui_mtd.executeMethod(context);
              }
            },
            function (o: any) {
              return false;
            }),
          makeButton("Select Connected Objects 1",
            function (e: any, obj: any) {
              let node = obj.part.data;
              uid.selectConnectedObjects(node, myMetis, myDiagram);
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                return true;
              }
              return false;
            }),
          makeButton("Generate osduIds",
            function (e: any, obj: any) {
              const node = obj.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                let object = node.object;
                if (!object) return;
                object = myMetis.findObject(object.id);
                const method = new akm.cxMethod(utils.createGuid(), 'generateosduId', "");
                method["reldir"] = 'out';
                method["objtypes"] = 'all';
                method["reltypes"] = 'hasPart';
                method["objtypecondition"] = null;
                method["reltypecondition"] = null;
                method["valuecondition"] = null;
                method["preaction"] = "generateosduId";
                method["propname"] = "osduId";
                const args = {
                  "method": method
                }
                const context = {
                  "myMetis": myMetis,
                  "myModel": myMetis.currentModel,
                  "myDiagram": myDiagram,
                  "myObject": object,
                  "args": args
                }
                ui_mtd.executeMethod(context);
              }
            },
            function (obj: any) {
              const node = obj.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                const object = node.object;
                let type = object?.type;
                type = myMetis.findObjectType(type?.id);
                const propname = "osduId";
                if (type && type.findPropertyByName2(propname, true)) {
                  return true;
                }
              }
              return false;
            }),
          makeButton("Execute Method",
            function (e: any, obj: any) {
              const node = obj.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                let object = node.object as akm.cxObject;
                object = myMetis.findObject(object?.id);
                let objectview = node.objectview as akm.cxObjectView;
                objectview = myMetis.findObjectView(objectview?.id);
                const objectviews = new Array();
                objectviews.push(objectview);
                const relshipviews = new Array();
                const args = {
                  "method": ""
                }
                const context = {
                  "myMetis": myMetis,
                  "myMetamodel": myMetis.currentMetamodel,
                  "myCurrentModelview": myMetis.currentModelview,
                  "currentObject": object,
                  "currentObjectview": objectview,
                  "objectviews": objectviews,
                  "relshipviews": relshipviews,
                  "myDiagram": myDiagram,
                  "case": "Execute Method",
                  "title": "Select Method",
                  "dispatch": myDiagram.dispatch,
                  "postOperation": ui_mtd.executeMethod,
                  "traverseViews": true,
                  "nolevels": "9",
                  "level": 0,
                  "args": args
                }
                ui_mtd.askForMethod(context);
              }
            },
            function (obj: any) {
              const node = obj.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                let object = node.object;
                const methods = object?.type?.methods;
                if (methods?.length > 0) {
                  return true;
                }
              }
              return false;
            }),
          makeButton("Undo",
            function (e: any, obj: any) { e.diagram.commandHandler.undo(); },
            function (o: any) {
              return o.diagram.commandHandler.canUndo();
            }),
          makeButton("Redo",
            function (e: any, obj: any) { e.diagram.commandHandler.redo(); },
            function (o: any) {
              return o.diagram.commandHandler.canRedo();
            }),
          makeButton("Get My Scale",
            function (e: any, obj: any) {
              const myGoModel = myMetis.gojsModel;
              const data = obj.part.data;
              const node = myGoModel.findNodeByViewId(data.objviewRef);
              let msg = "";
              if (node) {
                const myScale = node?.getMyScale(myGoModel);
                msg = 'My Scale is: ' + myScale;
              }
              else {
                msg = data.scale;
              }
              alert(msg);
            },
            function (o: any) {
              const node = o.part.data;
              // if (node.category === constants.gojs.C_OBJECT)
              //   return true;
              return true;
            }),
        );
    }

    // A CONTEXT MENU for links    
    {
      advancedLinkContextMenu =
        $(go.Adornment, "Vertical",
          makeButton("Edit Relationship",
            function (e: any, obj: any) {
              const link = obj.part.data;
              const relship = myMetis.findRelationship(link?.relshipRef);
              const relshipview = myMetis.findRelationshipView(link?.relviewRef);
              const relshiptype = myMetis.findRelationshipType(relship?.typeRef);
              const relshiptypeview = relshiptype?.typeview;
              const myContext = {
                object:     null,
                objectview: null,
                objecttype: null,
                objecttypeview: null,
                relship:    relship,
                relshipview: relshipview,
                relshiptype: relshiptype,
                relshiptypeview: relshiptypeview,
                model:      myMetis.currentModel,
                modelview:  myMetis.currentModelview,
                metamodel:  myMetis.currentMetamodel,
            }
              const modalContext = {
                what: "editRelationship",
                title: "Edit Relationship",
                myDiagram: myDiagram,
                myContext:  myContext,
              }
              myMetis.currentLink = link;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(link, modalContext);
              // 
            },
            function (o: any) {
              const link = o.part.data;
              if (link.category === constants.gojs.C_RELATIONSHIP) {
                return true;
              }
              return false;
            }),
          makeButton("Edit Relationship View",
            function (e: any, obj: any) {
              const link = obj.part.data;
              const relship = myMetis.findRelationship(link?.relshipRef);
              const relshipview = myMetis.findRelationshipView(link?.relviewRef);
              const relshiptype = myMetis.findRelationshipType(relship?.reltypeRef);
              const relshiptypeview = relshiptype?.typeview;
              const myContext = {
                object:     null,
                objectview: null,
                objecttype: null,
                objecttypeview: null,
                relship:    relship,
                relshipview: relshipview,
                relshiptype: relshiptype,
                relshiptypeview: relshiptypeview,
                model:      myMetis.currentModel,
                modelview:  myMetis.currentModelview,
                metamodel:  myMetis.currentMetamodel,
            }
              const modalContext = {
                what: "editRelshipview",
                title: "Edit Relationship View",
                myDiagram: myDiagram,
                myContext:  myContext,
              }
              myMetis.currentLink = link;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(link, modalContext);
              // 
            },
            function (o: any) {
              const link = o.part.data;
              if (link.category === constants.gojs.C_RELATIONSHIP) {
                return true;
              }
              return false;
            }),
          makeButton("Cut",
            function (e, obj) {
              e.diagram.commandHandler.cutSelection();
            },
            function (o) {
              return false;
              //return o.diagram.commandHandler.canCutSelection(); 
            }),
          makeButton("Delete",
            function (e, obj) {
              if (confirm('Do you really want to delete the current selection?')) {
                myMetis.deleteViewsOnly = false;
                e.diagram.commandHandler.deleteSelection();
              }
            },
            function (o) {
              return o.diagram.commandHandler.canDeleteSelection();
            }),
          makeButton("Delete View",
            function (e, obj) {
              if (confirm('Do you really want to delete the current selection?')) {
                myMetis.deleteViewsOnly = true;
                e.diagram.commandHandler.deleteSelection();
              }
            },
            function (o) {
              return o.diagram.commandHandler.canDeleteSelection();
            }),
          makeButton("Hide View",
            function (e, obj) {
              let selection = myDiagram.selection;
              if (selection.count == 0) {
                const currentLink = obj.part.data;
                if (currentLink) myDiagram.select(myDiagram.findLinkForKey(currentLink.key));
                selection = myDiagram.selection
              }
              const linksHided = new Array();
              const modifiedRelshipViews = new Array();
              myDiagram.selection.each(function (sel) {
                const link = sel;
                let relview = link.data.relshipview;
                if (relview) {
                  relview = myModelview.findRelationshipView(relview.id);
                  if (relview) {
                    relview.visible = false;
                    const jsnRelView = new jsn.jsnRelshipView(relview);
                    modifiedRelshipViews.push(jsnRelView);
                    link.visible = false;
                    linksHided.push(link);
                }
              }
              });
              for (let i=0; i<linksHided.length; i++) {
                const link = linksHided[i];
                myDiagram.remove(link);
              }
              modifiedRelshipViews.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
              })
            },
            function (o) {
              const link = o.part.data;
              if (link.category === constants.gojs.C_RELATIONSHIP) {
                return true;
              } else {
                return false;
              }
            }),
          makeButton("Add to Selection",
            function (e: any, obj: any) {
              const link = obj.part.data ? obj.part.data : obj.part;
              link.isSelected = true;
              const relship = link.relship;
              const relshipview = link.relshipview;
            },
            function (o: any) {
              return false;
            }),
          makeButton("----------"),
          makeButton("TEST",
            function (e: any, obj: any) {
              const myDiagram = e.diagram;
              const link = obj.part;
              const links = myDiagram.links;
              for (let it = links.iterator; it?.next();) {
                const lnk = it.value;
                for (let it = links.iterator; it?.next();) {
                  const lnk = it.value;
                  if (lnk.key === link.key) {
                    it.value = link;
                  }
                }
              }
            },
            function (o: any) {
              // if (debug)
              return true;
              return false;
            }),
          makeButton("New Typeview",
            function (e: any, obj: any) {
              //const link = e.diagram.selection.first().data;
              const link = obj.part.data;
              if (link.category === constants.gojs.C_RELATIONSHIP) {
                let currentRelship = myMetis.findRelationship(link.relship?.id);
                if (!currentRelship) currentRelship = myMetis.findRelationship(link.relshipRef);
                const currentRelshipView = myMetis.findRelationshipView(link.relshipview?.id);
                if (currentRelship && currentRelshipView) {
                  const myMetamodel = myMetis.currentMetamodel;
                  const reltype = currentRelship.type as akm.cxRelationshipType;
                  let typeview = currentRelshipView.typeview as akm.cxRelationshipTypeView;
                  const defaultTypeview = reltype.typeview as akm.cxRelationshipTypeView;;
                  if (!typeview || (typeview.id === defaultTypeview.id)) {
                    const id = utils.createGuid();
                    const name = reltype.name + '_' + reltype.getRelshipKind();
                    typeview = new akm.cxRelationshipTypeView(id, name, reltype, "");
                    typeview.data = defaultTypeview.data;
                    typeview.data.strokecolor = "red";
                    typeview.nameId = undefined;
                    typeview.modified = true;
                    currentRelshipView.typeview = typeview;
                    const viewdata = typeview.data;
                    for (let prop in typeview.data) {
                      myDiagram.model.setDataProperty(link, prop, viewdata[prop]);
                    }
                    link.typeview = typeview;
                    myDiagram.requestUpdate();
                    myMetamodel.addRelationshipTypeView(typeview);
                    myMetis.addRelationshipTypeView(typeview);

                    const jsnReltypeView = new jsn.jsnRelshipTypeView(typeview);
                    const modifiedTypeViews = new Array();
                    modifiedTypeViews.push(jsnReltypeView);
                    modifiedTypeViews.map(mn => {
                      let data = mn;
                      data = JSON.parse(JSON.stringify(data));
                      e.diagram.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
                    })

                    const jsnRelView = new jsn.jsnRelshipView(currentRelshipView);
                    const modifiedRelshipViews = new Array();
                    modifiedRelshipViews.push(jsnRelView);
                    modifiedRelshipViews.map(mn => {
                      let data = mn;
                      data = JSON.parse(JSON.stringify(data));
                      e.diagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
                    })
                  }
                }
              }
            },
            function (o: any) {
              if (true)
                return false;
              else {
                const link = o.part.data;
                if (link.category === constants.gojs.C_RELATIONSHIP) {
                  const currentRelship = link.relship;
                  const currentRelshipView = link.relshipview;
                  if (currentRelship && currentRelshipView) {
                    const reltype = currentRelship.type;
                    const typeView = link.typeview;
                    const defaultTypeview = reltype.typeview;
                    if (typeView && (typeView.id === defaultTypeview.id)) {
                      return true;
                    }
                  }
                }
                else if (link.category === constants.gojs.C_RELSHIPTYPE) {
                  return false;
                }
                return false;
              }
            }),
          makeButton("Edit Relationship Type",
            function (e: any, obj: any) {
              const link = obj.part.data;
              const modalContext = {
                what: "editRelationshipType",
                title: "Edit Relationship Type",
                myDiagram: myDiagram
              }
              myMetis.currentLink = link;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(link, modalContext);
              // 
            },
            function (o: any) {
              const link = o.part.data;
              if (link.category === constants.gojs.C_RELSHIPTYPE) {
                return true;
              }
              return false;
            }),
          makeButton("Change Relationship Type",
            function (e, obj) {
              const myGoModel = myMetis.gojsModel;
              const myModelview = myMetis.currentModelview;
              const myMetamodel = myMetis.currentMetamodel;
              let includeInheritedReltypes = myModelview.includeInheritedReltypes;
              let includeIsType = false;
              const link = obj.part.data;
              const relshipRef = link.relshipRef;
              const relship = myMetis.findRelationship(relshipRef);
              let fromTypeId = relship.fromObject.type.id;
              let fromType = myMetamodel.findObjectType(fromTypeId);
              if (!fromType) fromType = myMetis.findObjectType(fromTypeId);
              let toTypeId = relship.toObject.type.id;
              let toType = myMetamodel.findObjectType(toTypeId);
              if (!toType) toType = myMetis.findObjectType(toTypeId);
              if (fromType?.name === constants.types.AKM_ENTITY_TYPE && 
                toType?.name === constants.types.AKM_ENTITY_TYPE) {
                  includeIsType = true;
              }              
              let reltypes = myMetamodel.findRelationshipTypesBetweenTypes(fromType, toType, includeInheritedReltypes);
              const rtypes = myMetis.findRelationshipTypesBetweenTypes(fromType, toType, true);
              for (let i = 0; i < rtypes?.length; i++) {
                const rtype = rtypes[i];
                if (rtype.name === constants.types.AKM_GENERIC_REL) {
                  reltypes.push(rtype);
                }
                if (rtype.name === constants.types.AKM_REFERS_TO) {
                  reltypes.push(rtype);
                }
              }
              link.choices = [];
              if (reltypes) {
                for (let i = 0; i < reltypes?.length; i++) {
                  const rtype = reltypes[i];
                  link.choices.push(rtype.name);
                }
                if (includeIsType) {
                  reltypes.push(constants.types.AKM_IS);
                }
                let uniqueSet = utils.removeArrayDuplicates(link.choices);
                link.choices = uniqueSet;
              }
              const args = {
                typeNames: link.choices,
              }
              const modalContext = {
                what: "selectDropdown",
                title: "Select Relationship Type",
                case: "Change Relationship type",
                myDiagram: myDiagram,
                args: args,
              }
              myMetis.currentLink = link;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(link.choices, modalContext);
            },
            function (o) {
              const link = o.part.data;
              if (link.category === constants.gojs.C_RELATIONSHIP) {
                return true;
              } else {
                return false;
              }
            }),
          makeButton("Show Typeview",
            function (e: any, obj: any) {
              const link = obj.part.data;
              uid.editRelshipTypeview(link, myMetis, myDiagram, true);
            },
            function (o: any) {
              // return false;
              const link = o.part.data;
              if (link.category === constants.gojs.C_RELATIONSHIP)
                return true;
              // if (link.category === constants.gojs.C_RELSHIPTYPE)
              //   return true;
            }),
          makeButton("Reset to Typeview",
            function (e: any, rel: any) {
              let selection = myDiagram.selection;
              if (selection.count == 0) {
                const currentLink = rel.part.data;
                if (currentNode) myDiagram.select(myDiagram.findLinkForKey(currentLink.key));
                selection = myDiagram.selection;
              }
              const myGoModel = myMetis.gojsModel;
              myDiagram.selection.each(function (sel) {
                const inst = sel.data;
                if (inst.category === constants.gojs.C_RELATIONSHIP) {
                  uid.resetToTypeview(inst, myMetis, myDiagram);
                }
              })
            },
            function (o: any) {
              const link = o.part.data;
              if (link.category === constants.gojs.C_RELATIONSHIP) {
                const currentRelship = link.relship;
                const currentRelshipView = link.relshipview;
                if (currentRelship && currentRelshipView) {
                  const reltype = currentRelship.type;
                  const typeView = link.typeview;
                  const defaultTypeview = reltype.typeview;
                  if (typeView && (typeView.id !== defaultTypeview.id)) {
                    return true;
                  }
                }
                return true;
              }
              else if (link.category === constants.gojs.C_RELSHIPTYPE) {
                return false;
              }
              return false;
            }),
          makeButton("Edit Attribute",
            function (e: any, obj: any) {
              const link = obj.part.data;
              if (link.category === constants.gojs.C_RELATIONSHIP) {
                const relship = link.relship;
                const reltype = relship?.type;
                if (reltype) {
                  const choices: string[] = [];
                  choices.push('description');
                  const props = reltype.properties;
                  for (let i = 0; i < props?.length; i++) {
                    const prop = props[i];
                    choices.push(prop.name);
                  }
                  let defText = "";
                  if (choices.length > 0) defText = choices[0];
                  // const propname = prompt('Enter attribute name, one of ' + choices, defText);
                  // ---------------------------------
                  const modalContext = {
                    what: "selectDropdown",
                    title: "Select Attribute",
                    case: "Edit Attribute",
                    myDiagram: myDiagram
                  }
                  myMetis.myDiagram = myDiagram;
                  myDiagram.handleOpenModal(choices, modalContext);
                }
              } else if (link.category === constants.gojs.C_RELSHIPTYPE) {
                const choices: string[] = [];
                choices.push('description');
                choices.push('cardinality');
                let defText = "";
                if (choices.length > 0) defText = choices[0];
                // const propname = prompt('Enter attribute name, one of ' + choices, defText);
                // ---------------------------------
                const modalContext = {
                  what: "selectDropdown",
                  title: "Select Attribute",
                  case: "Edit Attribute",
                  myDiagram: myDiagram
                }
                myMetis.currentLink = link;
                myMetis.myDiagram = myDiagram;
                myDiagram.handleOpenModal(choices, modalContext);

              }
            },
            function (o: any) {
              return false;
              const link = o.part.data;
              if (link.category === constants.gojs.C_RELATIONSHIP) {
                const relship = link.relship;
                const reltype = relship?.type;
                if (reltype) {
                  const props = reltype.properties;
                  if (props && props.length > 0) {
                    return true;
                  }
                }
              } else if (link.category === constants.gojs.C_RELSHIPTYPE) {
                return true;
              }
              return false;
            }),
          makeButton("----------"),
          makeButton("Generate Relationship Type",
            function (e: any, obj: any) {
              const context = {
                "myMetis": myMetis,
                "myMetamodel": myMetis.currentMetamodel,
                "myTargetMetamodel": myMetis.currentTargetMetamodel,
                "myModel": myMetis.currentModel,
                "myCurrentModelview": myMetis.currentModelview,
                "myDiagram": e.diagram,
                "dispatch": e.diagram.dispatch
              }
              const contextmenu = obj.part;
              const part = contextmenu.adornedPart;
              const currentRel = part.data.relship;
              context.myTargetMetamodel = myMetis.currentTargetMetamodel;
              gen.askForTargetMetamodel(context);
            },
            function (o: any) {
              const rel = o.part.data.relship;
              if (!rel) return false;
              const fromObj = rel.fromObject;
              const toObj = rel.toObject;
              let reltype = rel.type;
              if (fromObj.type.name === constants.types.AKM_INFORMATION) {
                if (toObj.type.name === constants.types.AKM_INFORMATION)
                  return true;
              } else
                return false;
            }),
          makeButton("----------"),
          makeButton("Select all views of this relationship",
            function (e: any, obj: any) {
              const link = obj.part.data;
              let relship = myMetis.findRelationship(link.relship?.id);
              if (!relship) relship = myMetis.findRelationship(link.relshipRef);
              const links = myDiagram.links;
              for (let it = links.iterator; it?.next();) {
                const link = it.value;
                if (link.data.relship.id == relship.id) {
                  link.isSelected = true;
                }
              }
            },
            function (o: any) {
              const link = o.part.data;
              let relship = myMetis.findRelationship(link.relship?.id);
              if (!relship) relship = myMetis.findRelationship(link.relshipRef);
              const links = myDiagram.links;
              let cnt = 0;
              for (let it = links.iterator; it?.next();) {
                const link = it.value;
                if (link.data.relship.id == relship.id) {
                  cnt++;
                }
              }
              if (cnt > 1)
                return true;
              else
                return false;
            }),
          makeButton("Select all relationships of this type",
            function (e: any, obj: any) {
              const link = obj.part.data;
              let currentRelship = myMetis.findRelationship(link.relship?.id);
              if (!currentRelship) currentRelship = myMetis.findRelationship(link.relshipRef);
              const currentType = currentRelship?.type as akm.cxRelationshipType;
              const links = myDiagram.links;
              for (let it = links.iterator; it?.next();) {
                const link = it.value;
                if (link.data.relshiptype?.id == currentType?.id) {
                  link.isSelected = true;
                }
              }
            },
            function (o: any) {
              return true;
            }),
          makeButton("Add to Selection",
            function (e: any, obj: any) {
              uid.addToSelection(obj, myDiagram);
            },
            function (o: any) {
              return true;
            }),
          makeButton("Clear Path",
            function (e: any, obj: any) {
              let mySelection = myDiagram.selection;
              const selectedLinks = [];
              mySelection.each(function(l) {
                if (l instanceof go.Node) 
                  return;
                else
                selectedLinks.push(l);
                uid.clearPath(selectedLinks, myMetis, myDiagram);
              });
            },
            function (obj: any) {
              const link = obj.part.data;
              if (link.points)
                return true;
              else
                return false;
            }),
          makeButton("Swap Direction",
            function (e: any, obj: any) {
              let mySelection = myDiagram.selection;
              const selectedLinks = [];
              mySelection.each(function(l) {
                if (l instanceof go.Node) 
                  return;
                else {
                  selectedLinks.push(l);
                }
              });
              uid.swapDirection(selectedLinks, myMetis, myDiagram);
            },
            function (obj: any) {
              const link = obj.part.data;
              const modelview = myMetis.currentModelview;
              const metamodel = myMetis.currentMetamodel;
              if (uid.swapDirectionIsAllowed(link, modelview, metamodel))
                return true;
              return false;
            }),
          makeButton("Undo",
            function (e, obj) {
              e.diagram.commandHandler.undo();
            },
            function (o) {
              return o.diagram.commandHandler.canUndo();
            }),
          makeButton("Redo",
            function (e, obj) {
              e.diagram.commandHandler.redo();
            },
            function (o) {
              return o.diagram.commandHandler.canRedo();
            })
          );
    }

    // A CONTEXT MENU for ports
    {
      var portContextMenu =  // context menu for each port
        $("ContextMenu",
          makeButton("Change port name",
            function (e: any, obj: any) {
              const node = e.diagram.selection.first().data;
              let object = node.object;
              object = myMetis.findObject(object.id);
              const port = obj.part.adornedObject;
              let portname = port.data.name;
              const side = port.data.side;
              const p = object.getPort(side, portname);
              portname = prompt('Enter port name', portname);
              if (p) p.name = portname;
              uit.changePortName(port, portname, myDiagram);
              const jsnObj = new jsn.jsnObject(object);
              const modifiedObjects = new Array();
              modifiedObjects.push(jsnObj);
              modifiedObjects.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                e.diagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
              });
            }),
          makeButton("Change port color",
            function (e: any, obj: any) {
              const node = e.diagram.selection.first().data;
              let object = node.object;
              object = myMetis.findObject(object.id);
              const port = obj.part.adornedObject;
              let portcolor = port.data.color;
              const side = port.data.side;
              const p = object.getPort(side, port.data.name);
              portcolor = prompt('Enter port color', portcolor);
              if (!portcolor || !portcolor.trim()) portcolor = "transparent";
              if (p) p.color = portcolor;
              uit.changePortColor(port, portcolor, myDiagram);
              const jsnObj = new jsn.jsnObject(object);
              const modifiedObjects = new Array();
              modifiedObjects.push(jsnObj);
              modifiedObjects.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                e.diagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
              });
            }),
          makeButton("Remove port",
            // in the click event handler, the obj.part is the Adornment;
            // its adornedObject is the port
            function (e: any, obj: any) {
              const node = e.diagram.selection.first().data;
              const port = obj.part.adornedObject;
              let object = node.object;
              object = myMetis.findObject(object.id);
              let rels = object.getRelsConnectedToPort(port.data.id);
              const modifiedRelships = new Array();
              for (let i = 0; i < rels.length; i++) {
                const rel = rels[i];
                if (rel) {
                  const relview = rel.relshipview;
                  if (relview) {
                    relview.markedAsDeleted = true;
                  }
                  rel.markedAsDeleted = true;
                  const jsnRel = new jsn.jsnRelationship(rel);
                  modifiedRelships.push(jsnRel);
                }
              }
              modifiedRelships.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                e.diagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
              });
              object.deletePort(port.data.side, port.data.name);
              const jsnObj = new jsn.jsnObject(object);
              const modifiedObjects = new Array();
              modifiedObjects.push(jsnObj);
              modifiedObjects.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                e.diagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
              });
              uit.removePort(port, myDiagram);
              myDiagram.requestUpdate();
            }),
        );
    }

    // A CONTEXT MENU for the background of the Diagram, when not over any Part
    {
      const advancedContextMenu =
        $(go.Adornment, "Vertical",
          makeButton("Paste",
            function (e: any, obj: any) {
              myMetis.pasteViewsOnly = false;
              const mySelection = [];
              e.diagram.selection.each(function (sel) {
                mySelection.push(sel.data);
              });
              myMetis.currentSelection = mySelection;
              const point = e.diagram.toolManager.contextMenuTool.mouseDownPoint;
              e.diagram.commandHandler.pasteSelection(point);
            },
            function (o: any) {
              return o.diagram.commandHandler.canPasteSelection();
            }),
          makeButton("Paste View",
            function (e: any, obj: any) {
              myMetis.pasteViewsOnly = true;
              const selection = [];
              e.diagram.selection.each(function (sel) {
                selection.push(sel.data);
              });
              myMetis.currentSelection = selection;
              const point = e.diagram.toolManager.contextMenuTool.mouseDownPoint;
              e.diagram.commandHandler.pasteSelection(point);
            },
            function (o: any) {
              return o.diagram.commandHandler.canPasteSelection();
            }),
          makeButton("----------",
            function (e: any, obj: any) {
              console.log('TEST');
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return o.diagram.commandHandler.canPasteSelection();
            }),
          makeButton("New Model",
            function (e: any, obj: any) {
              uid.newModel(myMetis, myDiagram);
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("New Modelview",
            function (e: any, obj: any) {
              uid.newModelview(myMetis, myDiagram);
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              const adminModel = myMetis.adminModel;
              const currentModel = myMetis.currentModel;
              if (currentModel.id === adminModel.id)
                return false;
              else
                return true;
            }),
          makeButton("Set Modelview as Template",
            function (e: any, obj: any) {
              const modelview = myMetis.currentModelview;
              const model = myMetis.currentModel;
              model.addTemplate(modelview);
              modelview.setIsTemplate(true);
              model.setIsTemplate(true);
              alert("Current modelview has been set as template");
            },
            function (o: any) {
              return false;
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Delete Model",
            function (e: any, obj: any) {
              uid.deleteModel(myMetis, myDiagram);
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              let cnt = 0;
              const models = myMetis.models;
              for (let i = 0; i < models.length; i++) {
                const model = models[i];
                if (model.markedAsDeleted)
                  continue;
                cnt++;
              }
              if (cnt > 1)
                return true;
              else
                return false;
            }),
          makeButton("Delete Current Modelview",
            function (e: any, obj: any) {
              if (confirm('Do you really want to delete the current modelview?')) {
                const model = myMetis.currentModel as akm.cxModel;
                const modelView = myMetis.currentModelview as akm.cxModelView;
                uid.deleteModelview(modelView, myMetis, myDiagram);
              }
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              const model = myMetis.currentModel as akm.cxModel;
              let cnt = 0;
              const mviews = model.modelviews;
              for (let i = 0; i < mviews.length; i++) {
                const mview = mviews[i];
                if (mview.markedAsDeleted)
                  continue;
                cnt++;
              }
              if (cnt > 1)
                return true;
              else
                return false;
            }),
          makeButton("New Target Model",
            function (e: any, obj: any) {
              let model;
              const metamodel = myMetis.currentTargetMetamodel;

              const modelName = prompt("Enter Target Model name:", "");
              if (modelName == null || modelName === "") {
                alert("New operation was cancelled");
              } else {
                model = new akm.cxModel(utils.createGuid(), modelName, metamodel, "");
                myMetis.addModel(model);
                const modelviewName = prompt("Enter Modelview name:", model.name);
                if (modelviewName == null || modelviewName === "") {
                  alert("New operation was cancelled");
                } else {
                  const curmodel = myMetis.currentModel;
                  const modelView = new akm.cxModelView(utils.createGuid(), modelviewName, curmodel, "");
                  model.addModelView(modelView);
                  myMetis.addModelView(modelView);
                  let data = new jsn.jsnModel(model, true);
                  data = JSON.parse(JSON.stringify(data));
                  e.diagram.dispatch({ type: 'LOAD_TOSTORE_NEWMODELVIEW', data });
                }
              }
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              const metamodel = myMetis.currentTargetMetamodel;
              if (metamodel)
                return true;
              else
                return false;
            }),
          makeButton("Set Target Model",
            function (e: any, obj: any) {
              const context = {
                "myMetis": myMetis,
                "myMetamodel": myMetis.currentMetamodel,
                "myModel": myMetis.currentModel,
                "myModelview": myMetis.currentModelview,
                "myTargetMetamodel": myMetis.currentTargetMetamodel,
                "myDiagram": e.diagram
              }
              const modalContext = {
                what: "selectDropdown",
                title: "Select Target Model",
                case: "Set Target Model",
                myDiagram: myDiagram
              }
              const mmNameIds = myMetis.models.map(mm => mm && mm.nameId)
              myDiagram.handleOpenModal(mmNameIds, modalContext);

            },
            function (o: any) {
              return false;
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("----------",
            function (e: any, obj: any) {
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Edit Model Suite",
            function (e: any, obj: any) {
              const currentName = myMetis.name;
              const modelSuiteName = prompt("Enter the name of the Model Suite:", currentName);
              if (modelSuiteName?.length > 0) {
                myMetis.name = modelSuiteName;
              }
              const currentDescr = myMetis.description;
              const modelSuiteDescr = prompt("Enter Model Suite description:", currentDescr);
              if (modelSuiteDescr?.length > 0) {
                myMetis.description = modelSuiteDescr;
              }

              const myMetamodel = myMetis.currentMetamodel;
              const objtype = myMetamodel.findObjectTypeByName("Datatype");
              if (objtype) {
                if (confirm("Allow generate current metamodel: (OK = Yes))"))
                  myMetis.allowGenerateCurrentMetamodel = true;
                else
                  myMetis.allowGenerateCurrentMetamodel = false;
              }
              const project = {
                // "id":           myMetis.id, // ToDo: add id to project
                "name": myMetis.name,
                "description": myMetis.description,
                "allowGenerateCurrentMetamodel": myMetis.allowGenerateCurrentMetamodel
              }
              const modifiedProjects = new Array();  // metis-objektet i phData
              modifiedProjects.push(project);
              modifiedProjects?.map(mn => {
                let data = (mn) && mn
                data = JSON.parse(JSON.stringify(data));
                e.diagram?.dispatch({ type: 'UPDATE_PROJECT_PROPERTIES', data })
              });
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling') {
                return false;
              }
              const adminModel = myMetis.adminModel;
              const currentModel = myMetis.currentModel;
              if (currentModel.id === adminModel.id)
                return false;
              else
                return true;
            }),
          makeButton("Edit Metamodel",
            function (e: any, obj: any) {
              const currentMetamodel = myMetis.currentMetamodel;
              const currentName = currentMetamodel.name;
              const modelName = prompt("Enter Metamodel name:", currentName);
              if (modelName?.length > 0) {
                currentMetamodel.name = modelName;
              }
              const currentDescr = currentMetamodel.description;
              const modelDescr = prompt("Enter Metamodel description:", currentDescr);
              if (modelDescr?.length > 0) {
                currentMetamodel.description = modelDescr;
              }
              if (currentName !== modelName)
                currentMetamodel.id = utils.createGuid();
              const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
              let data = { metis: jsnMetis }
              data = JSON.parse(JSON.stringify(data));
              myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data }) // Todo: dispatch only name
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling') {
                return true;
              }
            }),
          makeButton("Edit Model",
            function (e: any, obj: any) {
              const currentModel = myMetis.currentModel;
              const currentName = currentModel.name;
              const modelName = prompt("Enter Model name:", currentName);
              if (modelName?.length > 0) {
                currentModel.name = modelName;
              }
              const currentDescr = currentModel.description;
              const modelDescr = prompt("Enter Model description:", currentDescr);
              if (modelDescr?.length > 0) {
                currentModel.description = modelDescr;
              }
              const jsnModel = new jsn.jsnModel(currentModel, true);
              const modifiedModels = new Array();
              modifiedModels.push(jsnModel);
              modifiedModels?.map(mn => {
                let data = (mn) && mn
                data = JSON.parse(JSON.stringify(data));
                e.diagram?.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
              })
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling') {
                return false;
              }
              const adminModel = myMetis.adminModel;
              const currentModel = myMetis.currentModel;
              if (currentModel.id === adminModel.id)
                return false;
              else
                return true;
            }),
          makeButton("Edit Modelview",
            function (e: any, obj: any) {
              if (true) {
                const currentModelview = myMetis.currentModelview;
                let currentName = currentModelview.name;
                const modelviewName = prompt("Enter Modelview name:", currentName);
                if (modelviewName?.length > 0) {
                  currentModelview.name = modelviewName;
                }
                const currentDescr = currentModelview.description;
                const modelviewDescr = prompt("Enter Modelview description:", currentDescr);
                if (modelviewDescr?.length > 0) {
                  currentModelview.description = modelviewDescr;
                }
                const jsnModelview = new jsn.jsnModelView(currentModelview);
                const modifiedModelviews = new Array();
                modifiedModelviews.push(jsnModelview);
                modifiedModelviews?.map(mn => {
                  let data = (mn) && mn
                  data = JSON.parse(JSON.stringify(data));
                  e.diagram?.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
                })
              } else {
                // ToDo: implement a correct edit of modelview
                // Need a working "uid.editModelview"
                const currentModelview = myMetis.currentModelview;
                const adminModel = myMetis.findModelByName(constants.admin.AKM_ADMIN_MODEL);
                if (adminModel) {
                  let adminModelview = adminModel.modelviews[0];
                  if (adminModelview)
                    adminModelview = myMetis.findModelView(adminModelview.id);
                  const modelviewType = myMetis.findObjectTypeByName(constants.admin.AKM_MODELVIEW);
                  if (modelviewType) {
                    for (let i = 0; i < adminModel?.objects?.length; i++) {
                      const obj = adminModel.objects[i];
                      if (!obj || obj.type?.id !== modelviewType.id)
                        continue;
                      if (obj['modelviewId'] === currentModelview.id) {
                        if (obj) {
                          const objview = obj.objectviews[0];
                          const node = new gjs.goObjectNode(objview?.id, myGoModel, objview);
                          uid.editObject(node, myMetis, myDiagram);
                        }
                      }
                    }
                  }
                }
              }
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling') {
                return false;
              }
              const adminModel = myMetis.adminModel;
              const currentModel = myMetis.currentModel;
              if (currentModel.id === adminModel.id)
                return false;
              else
                return true;
            }),
          makeButton("Open/Close All Groups",
            function (e: any, obj: any) {
              const open = confirm("Open (OK) or Close all Groups?", "true");
              uid.openCloseAllGroups(myDiagram, open);
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Update Project from AdminModel",
            function (e: any, obj: any) {
              let adminModel = myMetis.adminModel;
              if (adminModel) {
                uid.updateProjectFromAdminmodel(myMetis, myDiagram);
              }
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling') {
                return false;
              }
              const adminModel = myMetis.adminModel;
              const currentModel = myMetis.currentModel;
              if (currentModel.id === adminModel.id)
                return true;
              else
                return false;
            }),
          makeButton("----------",
            function (e: any, obj: any) {
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Select all objects of type",
            function (e: any, obj: any) {
              const myModel = myMetis.currentModel;
              const myModelview = myMetis.currentModelview;
              const myGoModel = myMetis.gojsModel;
              const typename = prompt("Enter object type name", "");
              const objects = myModel.getObjectsByTypename(typename, false);
              let firstTime = true;
              for (let i = 0; i < objects.length; i++) {
                const o = objects[i];
                if (o) {
                  const oviews = o.objectviews;
                  if (oviews) {
                    for (let j = 0; j < oviews.length; j++) {
                      const ov = oviews[j];
                      if (ov) {
                        const node = myGoModel.findNodeByViewId(ov?.id);
                        const gjsNode = myDiagram.findNodeForKey(node?.key)
                        if (gjsNode) {
                          if (firstTime) {
                            myDiagram.select(gjsNode);
                            firstTime = false;
                          } else {
                            gjsNode.isSelected = true;
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Select by Object Name",
            function (e: any, obj: any) {
              const value = prompt('Enter name ', "");
              const name = new RegExp(value, "i");
              const results = myDiagram.findNodesByExample(
                { name: value });
              const it = results.iterator;
              while (it.next()) {
                const node = it.value;
                const gjsNode = myDiagram.findNodeForKey(node?.key);
                if (gjsNode) gjsNode.isSelected = true;
              }
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Add Missing Relationship Views",
            function (e: any, obj: any) {
              const modelview = myMetis.currentModelview;
              const links = uic.addMissingRelationshipViews(modelview, myMetis);
              for (let i = 0; i < links.length; i++) {
                const link = links[i];
                myDiagram.model.addLinkData(link);
              }
              return;
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Unhide Hidden Relationship Views",
            function (e: any, obj: any) {
              const modelview = myMetis.currentModelview;
              uic.unhideHiddenRelationshipViews(modelview, myMetis);
              return;
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Toggle Show Relationship Names",
            function (e: any, obj: any) {
              const modelview = myMetis.currentModelview;
              let show = modelview.showRelshipNames;
              if (show === true)
                show = false;
              else
                show = true;
              if (show)
                modelview.showRelshipNames = true;
              else
                modelview.showRelshipNames = false;

              const jsnModelview = new jsn.jsnModelView(modelview, true);
              const modifiedModelviews = new Array();
              modifiedModelviews.push(jsnModelview);
              modifiedModelviews.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                e.diagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
              })
              return;
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Delete Invisible Objects",
            function (e: any, obj: any) {
              uid.deleteInvisibleObjects(myMetis, myDiagram);
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Undelete Selection",
            function (e: any, obj: any) {
              if (confirm('Do you really want to undelete the current selection?')) {
                myDiagram.selection.each(function (sel) {
                  const inst = sel.data;
                  if (inst.category === constants.gojs.C_OBJECT) {
                    let objview = inst.objectview;
                    if (objview) {
                      objview = myMetis.findObjectView(objview.id);
                      objview.markedAsDeleted = false;
                      if (objview.typeview)
                        objview.strokecolor = objview.typeview.strokecolor;
                      else
                        objview.strokecolor = "black";
                      const obj = objview.object;
                      if (obj)
                        obj.markedAsDeleted = false;
                    }
                  }
                  if (inst.category === constants.gojs.C_RELATIONSHIP) {
                    let relview = sel.data.relshipview;
                    if (relview) {
                      relview = myMetis.findRelationshipView(relview.id);
                      relview.markedAsDeleted = false;
                      if (relview.typeview)
                        relview.strokecolor = relview.typeview.strokecolor;
                      else
                        relview.strokecolor = "black";
                      const rel = relview.relship;
                      if (rel)
                        rel.markedAsDeleted = false;
                    }
                  }
                });
                const myModel = myMetis.currentModel;
                const jsnModel = new jsn.jsnModel(myModel, true);
                const modifiedModels = new Array();
                modifiedModels.push(jsnModel);
                modifiedModels.map(mn => {
                  let data = mn;
                  data = JSON.parse(JSON.stringify(data));
                  e.diagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
                })
              }
            },
            function (o: any) {
              const node = o.part.data;
              if (myDiagram.selection.count > 0)
                return true;
              return false;
            }),
          makeButton("----------",
            function (e: any, obj: any) {
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Zoom All",
            function (e: any, obj: any) {
              e.diagram.commandHandler.zoomToFit();
            },
            function (o: any) {
              return true;
            }),
          makeButton("Zoom Selection",
            function (e: any, obj: any) {
              let selected = myDiagram.selection;
              let x1 = 0;
              let y1 = 0;
              let x2 = 0;
              let y2 = 0;
              let w = 0;
              let h = 0;
              myDiagram.selection.each(function (node) {
                if (x1 == 0) x1 = node.actualBounds.x;
                if (y1 == 0) y1 = node.actualBounds.y;
                if (w == 0) w = node.actualBounds.width;
                if (h == 0) h = node.actualBounds.height;
                x2 = x1 + w;
                y2 = y1 + h;
                const X1 = node.actualBounds.x;
                if (X1 < x1) x1 = X1;
                const Y1 = node.actualBounds.y;
                if (Y1 < y1) y1 = Y1;
                const W = node.actualBounds.width;
                const X2 = X1 + W;
                const H = node.actualBounds.height;
                const Y2 = Y1 + H;
                // Compare
                if (X2 > x2) x2 = X2;
                if (Y2 > y2) y2 = Y2;
                w = x2 - x1;
                h = y2 - y1;
              });
              const rect = new go.Rect(x1, y1, w, h);
              myDiagram.zoomToRect(rect);
            },
            function (o: any) {
              if (myDiagram.selection.count > 0)
                return true;
              return false;
            }),
          makeButton("Set Layout Scheme",
          function (e: any, obj: any) {
            const layoutList = () => [
              { value: "Circular", label: "Circular Layout" },
              { value: "Grid", label: "Grid Layout" },
              { value: "Tree", label: "Tree Layout" },
              { value: "ForceDirected", label: "ForceDirected Layout" },
              { value: "LayeredDigraph", label: "LayeredDigraph Layout" },
              { value: "Manual", label: "Manual Layout" },
            ];
            const llist = layoutList();
            const layoutLabels = llist.map(ll => (ll) && ll.label);
            const modalContext = {
              what: "selectDropdown",
              title: "Set Layout Scheme",
              case: "Set Layout Scheme",
              layoutList: layoutList(),
              myDiagram: myDiagram
            }
            myMetis.myDiagram = myDiagram;
            myDiagram.handleOpenModal(myDiagram, modalContext);
          },
          function (o: any) {
            return true;
            }),
          makeButton("Do Layout",
            function (e: any, obj: any) {
              const myModelview = myMetis.currentModelview;
              myDiagram.modelview = myModelview;
              let layout = "";
              const modifiedRelshipViews = new Array();
              if (myMetis.modelType === 'Modelling') {
                myDiagram.selection.each(function (sel) {
                  const link = sel.data;
                  if (link.category === constants.gojs.C_RELATIONSHIP) {
                    const fromLink = link.from;
                    const toLink = link.to;
                    let relview: akm.cxRelationshipView;
                    relview = myDiagram.modelview.findRelationshipView(link.key);
                    if (relview) {
                      const fromObjview = relview.fromObjview;
                      const toObjview = relview.toObjview;
                      link.points = [];
                      link.from = fromLink;
                      link.to = toLink;
                      myDiagram.model.setDataProperty(link, "points", []);
                      relview.points = [];
                      relview.fromObjview = fromObjview;
                      relview.toObjview = toObjview;
                      const jsnRelView = new jsn.jsnRelshipView(relview);
                      modifiedRelshipViews.push(jsnRelView);
                    }
                  }
                });

                myModelview.clearRelviewPoints();
                const myGoModel = myMetis.gojsModel;
                layout = myGoModel.modelView?.layout;
              } else if (myMetis.modelType === 'Metamodelling') {
                const myMetamodel = myMetis.currentMetamodel;
                layout = myMetamodel.layout;
              }
              setLayout(myDiagram, layout);
              // Save layout
              const nodes = myDiagram.nodes;
              for (let it = nodes.iterator; it?.next();) {
                const node = it.value;
                const data = node.data;
                let objview = data.objectview;
                if (!objview)
                  objview = myModelview.findObjectView(data.objviewRef);
                if (objview) {
                  objview.loc = data.loc;
                }
              }

              modifiedRelshipViews.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                e.diagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
              })


              const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
              let data = { metis: jsnMetis }
              data = JSON.parse(JSON.stringify(data));
              myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data });
            },
            function (o: any) {
              return true;
            }),
          makeButton("Save Layout",
            function (e: any, obj: any) {
              if (myMetis.modelType === 'Metamodelling') {
                const myMetamodel = myMetis.currentMetamodel;
                const nodes = myDiagram.nodes;
                const objtypegeos = [];
                for (let it = nodes.iterator; it?.next();) {
                  const node = it.value;
                  const data = node.data;
                  const objtype = data.objecttype;
                  if (objtype) {
                    const objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), myMetamodel, objtype, "", "");
                    objtypeGeo.setLoc(data.loc);
                    objtypeGeo.setSize(data.size);
                    objtypeGeo.setModified();
                    objtypegeos.push(objtypeGeo);
                  }
                }
                myMetamodel.objtypegeos = objtypegeos;
              } else if (myMetis.modelType === 'Modelling') {
                const myModelview = myMetis.currentModelview;
                const nodes = myDiagram.nodes;
                for (let it = nodes.iterator; it?.next();) {
                  const node = it.value;
                  const data = node.data;
                  let objview = data.objectview;
                  if (!objview)
                    objview = myModelview.findObjectView(data.objviewRef);
                  if (objview) {
                    objview.loc = data.loc;
                  }
                }
              }
              const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
              let data = { metis: jsnMetis }
              data = JSON.parse(JSON.stringify(data));
              myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data });
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return true;
              else
                return true;
            }),
          makeButton("Set Link Routing",
            function (e: any, obj: any) {
              const routingList = () => [
                { value: "Normal", label: "Normal" },
                { value: "Orthogonal", label: "Orthogonal" },
                { value: "AvoidsNodes", label: "Avoids Nodes" },
              ];
              const rlist = routingList();
              const routingLabels = rlist.map(rl => (rl) && rl.label);
              const modalContext = {
                what: "selectDropdown",
                title: "Set Routing Scheme",
                case: "Set Routing Scheme",
                routingList: routingList(),
                myDiagram: myDiagram
              }
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(myDiagram, modalContext);
            },
            function (o: any) {
              return true;
            }),
          makeButton("Set Link Curve",
            function (e: any, obj: any) {
              const curveList = () => [
                { value: "None", label: "None" },
                { value: "Bezier", label: "Bezier" },
                { value: "JumpOver", label: "Jump Over" },
                { value: "JumpGap", label: "Jump Gap" },
              ];
              const clist = curveList();
              const curveLabels = clist.map(cl => (cl) && cl.label);
              const modalContext = {
                what: "selectDropdown",
                title: "Set Link Curve",
                case: "Set Link Curve",
                curveList: curveList(),
                myDiagram: myDiagram
              }
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(myDiagram, modalContext);
            },
            function (o: any) {
              return true;
            }),
          makeButton("----------",
            function (e: any, obj: any) {
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Verify and Repair Model",
            function (e: any, obj: any) {
              const myModel = myMetis.currentModel;
              const modelviews = myModel.modelviews;
              const myMetamodel = myMetis.currentMetamodel;
              const myGoModel = myMetis.gojsModel;
              myDiagram.myGoModel = myGoModel;
              uic.verifyAndRepairModel(myModel, myMetamodel, modelviews, myDiagram, myMetis);
              alert("The current model has been repaired");
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("!!! PURGE DELETED !!!",
            function (e: any, obj: any) {
              if (confirm('Do you really want to permamently delete all instances marked as deleted?')) {
                uic.purgeModelDeletions(myMetis, myDiagram);
              }
            },
            function (o: any) {
              // if (myMetis.modelType === 'Metamodelling')
              //   return false;
              return true;
            }),
          makeButton("----------",
            function (e: any, obj: any) {
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("New Metamodel",
            function (e: any, obj: any) {
              uid.newMetamodel(myMetis, myDiagram);
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              else if (uic.isGenericMetamodel(myMetis)) {
                return false;
              }
              return true;
            }),
          makeButton("Generate Metamodel",
            function (e: any, obj: any) {
              gen.generateTargetMetamodel(obj, myMetis, myDiagram);
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              else if (uic.isGenericMetamodel(myMetis)) {
                return false;
              }
              return false;
            }),
          makeButton("Replace Current Metamodel",
            function (e: any, obj: any) {
              uid.replaceCurrentMetamodel(myMetis, myDiagram);
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              else if (uic.isGenericMetamodel(myMetis)) {
                return false;
              }
              return true;
            }),
          makeButton("Add Metamodel",
            function (e: any, obj: any) {
              const isSubMetamodel = false;
              uid.addMetamodel(myMetis, myDiagram, isSubMetamodel);
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling') {
                return false;
              } else if (uic.isGenericMetamodel(myMetis)) {
                return false;
              } else {
                const noMetamodels = myMetis.metamodels.length;
                if (noMetamodels >= 2)
                  return true;
                else
                  return false;
              }
            }),
          makeButton("Add Sub-Metamodel",
            function (e: any, obj: any) {
              const isSubMetamodel = true;
              uid.addMetamodel(myMetis, myDiagram, isSubMetamodel);
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling') {
                return false;
              } else if (uic.isGenericMetamodel(myMetis)) {
                return false;
              } else {
                return true;
              }
            }),
          makeButton("Delete Metamodel",
            function (e: any, obj: any) {
              uid.deleteMetamodel(myMetis, myDiagram);
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling') {
                return false;
              } else if (uic.isGenericMetamodel(myMetis)) {
                return false;
              }
              let cnt = 0;
              const metamodels = myMetis.metamodels;
              for (let i = 0; i < metamodels.length; i++) {
                const metamodel = metamodels[i];
                if (metamodel.markedAsDeleted)
                  continue;
                cnt++;
              }
              if (cnt > 1)
                return true;
              else
                return false;
            }),
          makeButton("Clear Metamodel Content",
            function (e: any, obj: any) {
              uid.clearMetamodel(myMetis, myDiagram);
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling') {
                return false;
              } else if (uic.isGenericMetamodel(myMetis)) {
                return false;
              }
              let cnt = 0;
              const metamodels = myMetis.metamodels;
              for (let i = 0; i < metamodels.length; i++) {
                const metamodel = metamodels[i];
                if (metamodel.markedAsDeleted)
                  continue;
                cnt++;
              }
              if (cnt > 1)
                return true;
              else
                return false;
            }),
          makeButton("Verify and Repair Metamodels",
            function (e: any, obj: any) {
              uic.verifyAndRepairMetamodels(myMetis, myDiagram);
              alert("The metamodels have been repaired");
            },
            function (o: any) {
              // if (myMetis.modelType === 'Metamodelling')
              //   return false;
              return true;
            }),
          makeButton("Undo",
            function (e: any, obj: any) {
              e.diagram.commandHandler.undo();
            },
            function (o: any) {
              return o.diagram.commandHandler.canUndo();
            }),
          makeButton("Redo",
            function (e: any, obj: any) {
              e.diagram.commandHandler.redo();
            },
            function (o: any) {
              return o.diagram.commandHandler.canRedo();
            }),
          makeButton("Generate SVG",
            function (e: any, obj: any) {
              var svgData = myDiagram.makeSvg({
                scale: 1.0,
                maxSize: new go.Size(NaN, NaN)
              });
              console.log(svgData); // or send to server to save as file
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return false;
            }),
          makeButton("Toggle Admin layer",
            function (e: any, obj: any) {
              utils.toggleAdminModel();

            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return false;
              // return true;
            }),
          makeButton("Modelview nodes",
            function (e: any, obj: any) {
              const objviews = myModelview.objectviews;
              for (let i = 0; i < objviews?.length; i++) {
                const objview = objviews[i];
                const goNode = myMetis.gojsModel.findNodeByViewId(objview?.id);
                if (goNode) {
                  for (let it = myMetis.myDiagram.nodes; it?.next();) {
                    const n = it.value;
                    const data = n.data;
                    if (data.key === objview?.id) {
                      console.log('300 ', objview?.name, '\n objview: ', objview, "\n goNode: ", goNode, "\n n, data: ", n, data);
                    }
                  }
                }
              }
              console.log('333 goModel', myMetis.gojsModel);
            },
            function (o: any) {
              return true;
            }),
          makeButton("Modelview links",
            function (e: any, obj: any) {
              const relviews = myModelview.relshipviews;
              for (let i = 0; i < relviews?.length; i++) {
                const relview = relviews[i];
                const goLink = myMetis.gojsModel.findLinkByViewId(relview.id);
                if (goLink) {
                  for (let it = myDiagram.links; it?.next();) {
                    const l = it.value;
                    const data = l.data;
                    if (data.key === relview.id) {
                      const text = relview.name + " " + relview.toObjview.name;
                      console.log('310 ', text, '\n relview: ', relview,
                        "\n goLink: ", goLink, "\n link: ", l, data);
                    }
                  }
                }
              }
            },
            function (o: any) {
              return true;
            }),
          makeButton("----------",
            function (e: any, obj: any) {
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Toggle Cardinality On/Off",
            function (e: any, obj: any) {
              const modelview = myMetis.currentModelview;
              if (modelview.showCardinality == undefined)
                modelview.showCardinality = true;
              modelview.showCardinality = !modelview.showCardinality;
              if (!modelview.showCardinality) {
                alert("Cardinality on relationships will NOT be shown!");
              } else {
                alert("Cardinality on relationships WILL be shown!");
              }
              const jsnModelview = new jsn.jsnModelView(modelview);
              const modifiedModelviews = new Array();
              modifiedModelviews.push(jsnModelview);
              modifiedModelviews.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                e.diagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
              })
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Toggle 'Include Relationship Kind' On/Off",
            function (e: any, obj: any) {
              const model = myMetis.currentModel;
              const relkind = model.includeRelshipkind;
              model.includeRelshipkind = !relkind;
              if (!model.includeRelshipkind) {
                alert("Setting 'Relationship Kind' will NOT be allowed!");
              } else {
                alert("Setting 'Relationship Kind' WILL be allowed!");
              }
              const jsnModel = new jsn.jsnModel(model, true);
              const modifiedModels = new Array();
              modifiedModels.push(jsnModel);
              modifiedModels.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                e.diagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
              })
            },
            function (o: any) {
              return true;
            }),
          makeButton("Toggle Show Relationship Names On/Off",
            function (e: any, obj: any) {
              const modelview = myMetis.currentModelview;
              if (modelview.showRelshipNames == undefined)
                modelview.showRelshipNames = true;
              modelview.showRelshipNames = !modelview.showRelshipNames;
              if (!modelview.showRelshipNames) {
                alert("Relationship Names will NOT be shown!");
              } else {
                alert("Relationship Names will be shown!");
              }
              const jsnModelview = new jsn.jsnModelView(modelview);
              const modifiedModelviews = new Array();
              modifiedModelviews.push(jsnModelview);
              modifiedModelviews.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                e.diagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
              })
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Toggle 'Ask for Relationship Name' On/Off",
            function (e: any, obj: any) {
              const modelview = myMetis.currentModelview;
              if (modelview.askForRelshipName == undefined)
                modelview.askForRelshipName = false;
              modelview.askForRelshipName = !modelview.askForRelshipName;
              if (!modelview.askForRelshipName) {
                alert("Relationship names will NOT be asked for!");
              } else {
                alert("Relationship names WILL be asked for!");
              }
              const jsnModelview = new jsn.jsnModelView(modelview);
              const modifiedModelviews = new Array();
              modifiedModelviews.push(jsnModelview);
              modifiedModelviews.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                e.diagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
              })
            },
            function (o: any) {
              return false;
            }),
          makeButton("Toggle 'Include Inherited Relshiptypes' On/Off",
            function (e: any, obj: any) {
              const modelview = myMetis.currentModelview;
              if (modelview.includeInheritedReltypes == undefined)
                modelview.includeInheritedReltypes = false;
              modelview.includeInheritedReltypes = !modelview.includeInheritedReltypes;
              if (!modelview.includeInheritedReltypes) {
                alert("Inherited Relationship types are NOT included!");
              } else {
                alert("Inherited Relationship types ARE included!");
              }
              // Dispatch
              const jsnModelview = new jsn.jsnModelView(modelview);
              const modifiedModelviews = new Array();
              modifiedModelviews.push(jsnModelview);
              modifiedModelviews.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                e.diagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
              })
            },
            function (o: any) {
              return true;
            }),
          makeButton("Make Diagram",
            function (e: any, obj: any) {
              myDiagram.makeImage({
                scale: 1.0,
                background: "AntiqueWhite",
                type: "image/jpeg"
              });
            },
            function (o: any) {
              return false;
            }),
          makeButton("----------",
            function (e: any, obj: any) {
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Verify and Repair myMetis",
            function (e: any, obj: any) {
              uic.repairMetisProperties(myMetis, myDiagram);
              alert("myMetis has been repaired");
            },
            function (o: any) {
              return false;
            }),
          makeButton("Clear RelationshipTypeViews",
            function (e: any, obj: any) {
              const myMetamodel = myMetis.currentMetamodel;
              uic.clearRelationshipTypeViews(myMetamodel, myDiagram, myMetis);
              alert("The relshiptypeviews has been cleared");
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return true;
              return false;
            }),
      );

      type HtmlMenuItem = {
        label?: string;
        separator?: boolean;
        action?: (diagram: go.Diagram, tool: go.ContextMenuTool, source?: HTMLElement) => void;
        visible?: (diagram: go.Diagram) => boolean;
        enabled?: (diagram: go.Diagram) => boolean;
        closeOnClick?: boolean;
      };

      const HTML_MENU_CLASS = "gojs-html-context-menu";
      const HTML_MENU_ITEM_CLASS = "gojs-html-context-menu__item";

      let activeMenuDiv: HTMLDivElement | null = null;
      let activeSubMenuDiv: HTMLDivElement | null = null;
      let lastAnchorElement: HTMLElement | null = null;

      const disposeSubMenu = () => {
        if (activeSubMenuDiv && activeSubMenuDiv.parentElement) {
          activeSubMenuDiv.parentElement.removeChild(activeSubMenuDiv);
        }
        activeSubMenuDiv = null;
      };

      const disposeBackgroundMenu = () => {
        disposeSubMenu();
        if (activeMenuDiv && activeMenuDiv.parentElement) {
          activeMenuDiv.parentElement.removeChild(activeMenuDiv);
        }
        activeMenuDiv = null;
        lastAnchorElement = null;
      };

      const positionBackgroundMenu = (menu: HTMLDivElement, diagram: go.Diagram, tool?: go.ContextMenuTool) => {
        const diagramDiv = diagram.div;
        if (!diagramDiv) return;
        const cmTool = tool || diagram.toolManager.contextMenuTool;
        const isPointReal = (pt?: go.Point | null) => !!(pt && pt.isReal && pt.isReal());
        const mouseDownPoint = cmTool && isPointReal(cmTool.mouseDownPoint) ? cmTool.mouseDownPoint : null;
        let viewPoint: go.Point | null = null;
        if (mouseDownPoint) {
          viewPoint = diagram.transformDocToView(mouseDownPoint);
        } else {
          const lastInput = diagram.lastInput;
          if (lastInput) {
            const docPoint = isPointReal(lastInput.documentPoint) ? lastInput.documentPoint : null;
            if (docPoint) {
              viewPoint = diagram.transformDocToView(docPoint);
            } else if (isPointReal(lastInput.viewPoint)) {
              const vp = lastInput.viewPoint;
              viewPoint = new go.Point(vp.x, vp.y);
            }
          }
        }
        if (!viewPoint) {
          viewPoint = new go.Point(0, 0);
        }
        const rect = diagramDiv.getBoundingClientRect();
        let left = rect.left + window.pageXOffset + viewPoint.x;
        let top = rect.top + window.pageYOffset + viewPoint.y;

        const menuRect = menu.getBoundingClientRect();
        const maxLeft = window.pageXOffset + window.innerWidth - menuRect.width - 8;
        const maxTop = window.pageYOffset + window.innerHeight - menuRect.height - 8;

        left = Math.max(window.pageXOffset + 4, Math.min(left, maxLeft));
        top = Math.max(window.pageYOffset + 4, Math.min(top, maxTop));

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
      };

      const buildBackgroundMenu = (items: HtmlMenuItem[], diagram: go.Diagram, tool: go.ContextMenuTool) => {
        const menu = document.createElement("div");
        menu.className = HTML_MENU_CLASS;
        menu.style.position = "absolute";
        menu.style.minWidth = "200px";
        menu.style.background = "#ffffff";
        menu.style.border = "1px solid rgba(0,0,0,0.15)";
        menu.style.boxShadow = "0 6px 12px rgba(0,0,0,0.18)";
        menu.style.borderRadius = "6px";
        menu.style.padding = "4px 0";
        menu.style.zIndex = "9999";
        menu.addEventListener("contextmenu", (ev) => ev.preventDefault());
        menu.addEventListener("mousedown", (ev) => ev.stopPropagation());

        items.forEach((item) => {
          if (item.visible && !item.visible(diagram)) {
            return;
          }

          if (item.separator) {
            const separator = document.createElement("div");
            separator.style.margin = "4px 0";
            separator.style.borderTop = "1px solid #e6e6e6";
            menu.appendChild(separator);
            return;
          }

          const button = document.createElement("button");
          button.type = "button";
          button.className = HTML_MENU_ITEM_CLASS;
          button.textContent = item.label ?? "";
          button.style.display = "block";
          button.style.width = "100%";
          button.style.padding = "6px 16px";
          button.style.textAlign = "left";
          button.style.background = "transparent";
          button.style.border = "none";
          button.style.cursor = "pointer";
          button.style.fontSize = "13px";
          button.style.color = "#333";

          let hoverTimer: number | null = null;

          button.onmouseenter = () => {
            button.style.background = "rgba(0,0,0,0.06)";
            if (!button.disabled && item.closeOnClick === false && item.action) {
              hoverTimer = window.setTimeout(() => {
                if (activeSubMenuDiv) {
                  disposeSubMenu();
                }
                item.action && item.action(diagram, tool, button);
                hoverTimer = null;
              }, 500);
            }
          };
          button.onmouseleave = () => {
            button.style.background = "transparent";
            if (hoverTimer) {
              clearTimeout(hoverTimer);
              hoverTimer = null;
            }
          };

          const enabled = item.enabled ? item.enabled(diagram) : true;
          if (!enabled) {
            button.disabled = true;
            button.style.cursor = "default";
            button.style.color = "#bbb";
          }

          button.onclick = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            disposeSubMenu();
            if (hoverTimer) {
              clearTimeout(hoverTimer);
              hoverTimer = null;
            }
            if (item.action) {
              item.action(diagram, tool, button);
            }
            if (item.closeOnClick !== false) {
              tool.stopTool();
              disposeBackgroundMenu();
            }
          };

          menu.appendChild(button);
        });

        return menu;
      };

      const renderBackgroundMenu = (items: HtmlMenuItem[], diagram: go.Diagram, tool: go.ContextMenuTool) => {
        disposeBackgroundMenu();
        const menu = buildBackgroundMenu(items, diagram, tool);
        document.body.appendChild(menu);
        activeMenuDiv = menu;
        positionBackgroundMenu(menu, diagram, tool);
      };

      const renderSubMenu = (items: HtmlMenuItem[], diagram: go.Diagram, tool: go.ContextMenuTool, anchor?: HTMLElement) => {
        disposeSubMenu();
        const menu = buildBackgroundMenu(items, diagram, tool);
        document.body.appendChild(menu);
        activeSubMenuDiv = menu;
        if (anchor) {
          lastAnchorElement = anchor;
        }
        const targetAnchor = anchor || lastAnchorElement;
        const anchorRect = targetAnchor ? targetAnchor.getBoundingClientRect() : (activeMenuDiv ? activeMenuDiv.getBoundingClientRect() : null);
        if (anchorRect) {
          const menuRect = menu.getBoundingClientRect();
          const viewportLeft = window.pageXOffset + 4;
          const viewportRight = window.pageXOffset + window.innerWidth - 4;
          let left = anchorRect.right + window.pageXOffset + 4;
          let top = anchorRect.top + window.pageYOffset;
          if (left + menuRect.width > viewportRight) {
            left = anchorRect.left + window.pageXOffset - menuRect.width - 4;
          }
          left = Math.max(viewportLeft, left);
          const maxTop = window.pageYOffset + window.innerHeight - menuRect.height - 8;
          top = Math.max(window.pageYOffset + 4, Math.min(top, maxTop));
          menu.style.left = `${left}px`;
          menu.style.top = `${top}px`;
        } else {
          positionBackgroundMenu(menu, diagram, tool);
        }
      };

      const showAdvancedGoMenu = (diagram: go.Diagram, tool: go.ContextMenuTool) => {
        disposeBackgroundMenu();
        const cmTool = tool || diagram.toolManager.contextMenuTool;
        cmTool.currentContextMenu = advancedContextMenu;
        cmTool.showContextMenu(advancedContextMenu, null);
      };

      const zoomSelection = (diagram: go.Diagram) => {
        if (diagram.selection.count === 0) return;
        let x1 = Number.POSITIVE_INFINITY;
        let y1 = Number.POSITIVE_INFINITY;
        let x2 = Number.NEGATIVE_INFINITY;
        let y2 = Number.NEGATIVE_INFINITY;

        diagram.selection.each((part) => {
          const bounds = part.actualBounds;
          x1 = Math.min(x1, bounds.x);
          y1 = Math.min(y1, bounds.y);
          x2 = Math.max(x2, bounds.x + bounds.width);
          y2 = Math.max(y2, bounds.y + bounds.height);
        });

        if (x1 === Number.POSITIVE_INFINITY || y1 === Number.POSITIVE_INFINITY) return;

        const rect = new go.Rect(x1, y1, x2 - x1, y2 - y1);
        diagram.zoomToRect(rect);
      };

      const isMetamodellingMode = () => myMetis.modelType === 'Metamodelling';
      const isAdminModelActive = () => {
        const adminModel = myMetis.adminModel;
        const currentModel = myMetis.currentModel;
        return !!adminModel && !!currentModel && adminModel.id === currentModel.id;
      };
      const hasMultipleActiveModels = () => {
        let count = 0;
        const models = myMetis.models || [];
        for (let i = 0; i < models.length; i++) {
          const model = models[i];
          if (!model || model.markedAsDeleted)
            continue;
          count++;
          if (count > 1) return true;
        }
        return false;
      };
      const hasMultipleActiveModelviews = () => {
        const model = myMetis.currentModel as akm.cxModel;
        if (!model) return false;
        let count = 0;
        const views = model.modelviews || [];
        for (let i = 0; i < views.length; i++) {
          const view = views[i];
          if (!view || view.markedAsDeleted)
            continue;
          count++;
          if (count > 1) return true;
        }
        return false;
      };

      const isGenericMetamodelContext = () => uic.isGenericMetamodel(myMetis);
      const hasMultipleActiveMetamodels = () => {
        let count = 0;
        const metamodels = myMetis.metamodels || [];
        for (let i = 0; i < metamodels.length; i++) {
          const mm = metamodels[i];
          if (!mm || mm.markedAsDeleted)
            continue;
          count++;
          if (count > 1) return true;
        }
        return false;
      };

      const handleNewModel = () => {
        uid.newModel(myMetis, myDiagram);
      };

      const handleDeleteModel = () => {
        uid.deleteModel(myMetis, myDiagram);
      };

      const handleEditModelSuite = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        const currentName = myMetis.name;
        const modelSuiteName = prompt("Enter the name of the Model Suite:", currentName);
        if (modelSuiteName?.length > 0) {
          myMetis.name = modelSuiteName;
        }
        const currentDescr = myMetis.description;
        const modelSuiteDescr = prompt("Enter Model Suite description:", currentDescr);
        if (modelSuiteDescr?.length > 0) {
          myMetis.description = modelSuiteDescr;
        }

        const myMetamodel = myMetis.currentMetamodel;
        const objtype = myMetamodel?.findObjectTypeByName("Datatype");
        if (objtype) {
          if (confirm("Allow generate current metamodel: (OK = Yes))"))
            myMetis.allowGenerateCurrentMetamodel = true;
          else
            myMetis.allowGenerateCurrentMetamodel = false;
        }
        const project = {
          "name": myMetis.name,
          "description": myMetis.description,
          "allowGenerateCurrentMetamodel": myMetis.allowGenerateCurrentMetamodel
        }
        const modifiedProjects = new Array();
        modifiedProjects.push(project);
        modifiedProjects?.map(mn => {
          let data = (mn) && mn;
          data = JSON.parse(JSON.stringify(data));
          targetDiagram?.dispatch?.({ type: 'UPDATE_PROJECT_PROPERTIES', data })
        });
      };

      const handleEditModel = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        const currentModel = myMetis.currentModel;
        if (!currentModel) return;
        const currentName = currentModel.name;
        const modelName = prompt("Enter Model name:", currentName);
        if (modelName?.length > 0) {
          currentModel.name = modelName;
        }
        const currentDescr = currentModel.description;
        const modelDescr = prompt("Enter Model description:", currentDescr);
        if (modelDescr?.length > 0) {
          currentModel.description = modelDescr;
        }
        const jsnModel = new jsn.jsnModel(currentModel, true);
        const modifiedModels = new Array();
        modifiedModels.push(jsnModel);
        modifiedModels?.map(mn => {
          let data = (mn) && mn;
          data = JSON.parse(JSON.stringify(data));
          targetDiagram?.dispatch?.({ type: 'UPDATE_MODEL_PROPERTIES', data })
        });
      };

      const handleNewModelview = () => {
        uid.newModelview(myMetis, myDiagram);
      };

      const handleDeleteModelview = () => {
        if (!confirm('Do you really want to delete the current modelview?')) return;
        const modelView = myMetis.currentModelview as akm.cxModelView;
        if (!modelView) return;
        uid.deleteModelview(modelView, myMetis, myDiagram);
      };

      const handleEditModelview = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        const currentModelview = myMetis.currentModelview;
        if (!currentModelview) return;
        const currentName = currentModelview.name;
        const modelviewName = prompt("Enter Modelview name:", currentName);
        if (modelviewName?.length > 0) {
          currentModelview.name = modelviewName;
        }
        const currentDescr = currentModelview.description;
        const modelviewDescr = prompt("Enter Modelview description:", currentDescr);
        if (modelviewDescr?.length > 0) {
          currentModelview.description = modelviewDescr;
        }
        if (currentName !== modelviewName) {
          currentModelview.id = utils.createGuid();
        }
        const jsnModelview = new jsn.jsnModelView(currentModelview);
        const modifiedModelviews = new Array();
        modifiedModelviews.push(jsnModelview);
        modifiedModelviews.map(mn => {
          let data = (mn) && mn;
          data = JSON.parse(JSON.stringify(data));
          targetDiagram.dispatch?.({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        });
      };

      const handleOpenCloseGroups = (diagram?: go.Diagram) => {
        const open = confirm("Open (OK) or Close all Groups?", "true");
        const targetDiagram = diagram || myDiagram;
        uid.openCloseAllGroups(targetDiagram, open);
      };

      const handleSetLayoutScheme = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        const layoutList = () => [
          { value: "Circular", label: "Circular Layout" },
          { value: "Grid", label: "Grid Layout" },
          { value: "Tree", label: "Tree Layout" },
          { value: "ForceDirected", label: "ForceDirected Layout" },
          { value: "LayeredDigraph", label: "LayeredDigraph Layout" },
          { value: "Manual", label: "Manual Layout" },
        ];
        const modalContext = {
          what: "selectDropdown",
          title: "Set Layout Scheme",
          case: "Set Layout Scheme",
          layoutList: layoutList(),
          myDiagram: targetDiagram
        }
        myMetis.myDiagram = targetDiagram;
        targetDiagram.handleOpenModal(targetDiagram, modalContext);
      };

      const handleSelectAllOfType = (diagram: go.Diagram) => {
        if (!diagram) return;
        const myModel = myMetis.currentModel;
        const myGoModel = myMetis.gojsModel;
        const typename = prompt("Enter object type name", "");
        if (!typename) return;
        const objects = myModel.getObjectsByTypename(typename, false);
        let firstTime = true;
        for (let i = 0; i < objects.length; i++) {
          const o = objects[i];
          if (!o) continue;
          const oviews = o.objectviews;
          if (!oviews) continue;
          for (let j = 0; j < oviews.length; j++) {
            const ov = oviews[j];
            if (!ov) continue;
            const node = myGoModel.findNodeByViewId(ov?.id);
            const gjsNode = diagram.findNodeForKey(node?.key);
            if (gjsNode) {
              if (firstTime) {
                diagram.select(gjsNode);
                firstTime = false;
              } else {
                gjsNode.isSelected = true;
              }
            }
          }
        }
      };

      const handleSelectByObjectName = (diagram: go.Diagram) => {
        if (!diagram) return;
        const value = prompt('Enter name ', "");
        if (!value) return;
        const results = diagram.findNodesByExample({ name: value });
        const it = results.iterator;
        let first = true;
        while (it.next()) {
          const node = it.value;
          const gjsNode = diagram.findNodeForKey(node?.key);
          if (gjsNode) {
            if (first) {
              diagram.select(gjsNode);
              first = false;
            } else {
              gjsNode.isSelected = true;
            }
          }
        }
      };

      const handleAddMissingRelationshipViews = (diagram: go.Diagram) => {
        const modelview = myMetis.currentModelview;
        const links = uic.addMissingRelationshipViews(modelview, myMetis);
        for (let i = 0; i < links.length; i++) {
          const link = links[i];
          diagram.model.addLinkData(link);
        }
      };

      const handleUnhideHiddenRelationshipViews = () => {
        const modelview = myMetis.currentModelview;
        uic.unhideHiddenRelationshipViews(modelview, myMetis);
      };

      const handleDeleteInvisibleObjects = () => {
        uid.deleteInvisibleObjects(myMetis, myDiagram);
      };

      const handleUndeleteSelection = (diagram: go.Diagram) => {
        if (!diagram) return;
        if (!confirm('Do you really want to undelete the current selection?')) return;
        diagram.selection.each(function (sel) {
          const inst = sel.data;
          if (inst.category === constants.gojs.C_OBJECT) {
            let objview = inst.objectview;
            if (objview) {
              objview = myMetis.findObjectView(objview.id);
              objview.markedAsDeleted = false;
              if (objview.typeview)
                objview.strokecolor = objview.typeview.strokecolor;
              else
                objview.strokecolor = "black";
              const obj = objview.object;
              if (obj)
                obj.markedAsDeleted = false;
            }
          }
          if (inst.category === constants.gojs.C_RELATIONSHIP) {
            let relview = sel.data.relshipview;
            if (relview) {
              relview = myMetis.findRelationshipView(relview.id);
              relview.markedAsDeleted = false;
              if (relview.typeview)
                relview.strokecolor = relview.typeview.strokecolor;
              else
                relview.strokecolor = "black";
              const rel = relview.relship;
              if (rel)
                rel.markedAsDeleted = false;
            }
          }
        });
        const myModel = myMetis.currentModel;
        const jsnModel = new jsn.jsnModel(myModel, true);
        const modifiedModels = new Array();
        modifiedModels.push(jsnModel);
        modifiedModels.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          diagram.dispatch?.({ type: 'UPDATE_MODEL_PROPERTIES', data })
        });
      };

      const ensurePartInSelection = (diagram: go.Diagram, part: go.Part) => {
        if (!diagram || !part) return;
        if (!part.isSelected) {
          diagram.select(part);
        }
      };

      const exclusiveSelectPart = (diagram: go.Diagram | null, part: go.Part | null) => {
        if (!diagram || !part) {
          return () => {};
        }
        const wasSelected = part.isSelected;
        const partKey = part.key;
        const wasLink = part instanceof go.Link;
        const previous: Array<{ key: any; isLink: boolean }> = [];
        diagram.selection.each((sel) => {
          if (sel === part) return;
          const key = sel.data?.key;
          if (key === undefined || key === null) return;
          previous.push({ key, isLink: sel instanceof go.Link });
        });
        diagram.clearSelection();
        diagram.select(part);
        return () => {
          diagram.clearSelection();
          for (let i = 0; i < previous.length; i++) {
            const entry = previous[i];
            const found = entry.isLink ? diagram.findLinkForKey(entry.key) : diagram.findPartForKey(entry.key);
            if (found) found.isSelected = true;
          }
          if (wasSelected) {
            const current = wasLink ? diagram.findLinkForKey(partKey) : diagram.findPartForKey(partKey);
            if (current) current.isSelected = true;
          }
        };
      };

      const canDeleteSinglePart = (diagram: go.Diagram | null, part: go.Part | null) => {
        if (!diagram || !part) return false;
        const restore = exclusiveSelectPart(diagram, part);
        const canDelete = diagram.commandHandler.canDeleteSelection();
        restore();
        return canDelete;
      };

      const handlePartCopy = (diagram: go.Diagram, part: go.Part) => {
        if (!diagram || !part) return;
        if (part instanceof go.Node) {
          const nodePart = diagram.findPartForKey(part.data?.key) as go.Node;
          if (nodePart) {
            try {
              const subParts = nodePart.findSubGraphParts();
              if (subParts) {
                subParts.add(nodePart);
                diagram.selectCollection(subParts);
              }
            } catch {
              // ignore issues when node is not a subgraph
            }
          }
          const currentNodeData = part.data;
          if (diagram.selection.count === 0 && currentNodeData) {
            const selectedPart = diagram.findPartForKey(currentNodeData.key);
            if (selectedPart) diagram.select(selectedPart);
          }
        } else {
          ensurePartInSelection(diagram, part);
        }

        const sourceNodes: any[] = [];
        const sourceLinks: any[] = [];
        const sel = diagram.selection;
        for (let it = sel.iterator; it?.next();) {
          const selected = it.value;
          if (selected instanceof go.Node) {
            addSourceNode(sourceNodes, selected);
          } else if (selected instanceof go.Link) {
            addSourceLink(sourceLinks, selected);
          }
        }

        const copied: any[] = [];
        sel.each((selectedPart) => {
          const data = selectedPart.data;
          if (!data) return;
          const key = data.key;
          data.fromModelview = myMetis.currentModelview;
          data.fromGoModel = myMetis.gojsModel;
          data.fromNode = getSourceNode(sourceNodes, key);
          data.fromLink = getSourceLink(sourceLinks, key);
          copied.push(data);
        });

        if (copied.length > 0) {
          myMetis.currentSelection = copied;
          diagram.commandHandler.copySelection();
        }
      };

      const handlePartPaste = (diagram: go.Diagram, viewsOnly: boolean) => {
        if (!diagram) return;
        myMetis.pasteViewsOnly = viewsOnly;
        const point = diagram.toolManager.contextMenuTool.mouseDownPoint;
        diagram.commandHandler.pasteSelection(point);
      };

      const canEditAttribute = (part: go.Part) => {
        const data = part?.data;
        if (!data) return false;
        if (data.category === constants.gojs.C_OBJECT) {
          const object = data.object;
          const objtype = object?.type;
          if (objtype) {
            const props = objtype.properties;
            if (props && props.length > 0) return true;
            if (objtype.name === 'ViewFormat' || objtype.name === 'InputPattern') return true;
          }
        }
        if (data.category === constants.gojs.C_RELATIONSHIP) {
          const relship = data.relship;
          const reltype = relship?.type;
          if (reltype?.properties?.length) return true;
        }
        if (data.category === constants.gojs.C_RELSHIPTYPE) {
          return true;
        }
        return false;
      };

      const handleEditAttribute = (diagram: go.Diagram, part: go.Part) => {
        if (!diagram || !part) return;
        const data = part?.data;
        if (!data) return;

        if (data.category === constants.gojs.C_OBJECT) {
          let object = data.object;
          if (!object) return;
          object = myMetis.findObject(object.id);
          const objtype = object?.type;
          if (!objtype) return;
          const choices: string[] = ['description'];
          if (objtype.name === 'ViewFormat') choices.push('viewFormat');
          if (objtype.name === 'InputPattern') choices.push('inputPattern');
          const props = objtype.properties;
          for (let i = 0; i < props?.length; i++) {
            const prop = props[i];
            choices.push(prop.name);
          }
          if (choices.length === 0) return;
          const modalContext = {
            what: "selectDropdown",
            title: "Select Property",
            case: "Edit Attribute",
            myDiagram: diagram
          };
          myMetis.currentNode = data;
          myMetis.myDiagram = diagram;
          diagram.handleOpenModal(choices, modalContext);
          return;
        }

        if (data.category === constants.gojs.C_RELATIONSHIP) {
          const relship = data.relship;
          const reltype = relship?.type;
          if (!reltype) return;
          const choices: string[] = ['description'];
          const props = reltype.properties;
          for (let i = 0; i < props?.length; i++) {
            const prop = props[i];
            choices.push(prop.name);
          }
          if (choices.length === 0) return;
          const modalContext = {
            what: "selectDropdown",
            title: "Select Attribute",
            case: "Edit Attribute",
            myDiagram: diagram
          };
          myMetis.currentLink = data;
          myMetis.myDiagram = diagram;
          diagram.handleOpenModal(choices, modalContext);
          return;
        }

        if (data.category === constants.gojs.C_RELSHIPTYPE) {
          const choices: string[] = ['description', 'cardinality'];
          const modalContext = {
            what: "selectDropdown",
            title: "Select Attribute",
            case: "Edit Attribute",
            myDiagram: diagram
          };
          myMetis.currentLink = data;
          myMetis.myDiagram = diagram;
          diagram.handleOpenModal(choices, modalContext);
        }
      };

      const handleEditObject = (part: go.Part) => {
        const data = part?.data;
        if (!data) return;
        uid.editObject(data, myMetis, myDiagram);
      };

      const handleEditObjectview = (part: go.Part) => {
        const data = part?.data;
        if (!data) return;
        uid.editObjectview(data, myMetis, myDiagram);
      };

      const handleSortSelection = (diagram: go.Diagram) => {
        if (!diagram) return;
        uid.sortSelection(diagram);
      };

      const handleConnectToSelected = (diagram: go.Diagram, part: go.Part) => {
        if (!diagram || !part) return;
        const node: any = part.data;
        if (!node || node.category !== constants.gojs.C_OBJECT) return;

        const nodePart = diagram.findPartForKey(node.key) as go.Node;
        if (!nodePart) return;

        const selection = diagram.selection;
        const hadSelection = selection.count > 0;
        if (!nodePart.isSelected) {
          if (hadSelection) {
            nodePart.isSelected = true;
          } else {
            diagram.select(nodePart);
          }
        }

        const nodes: any[] = [];
        for (let it = selection.iterator; it?.next();) {
          const selPart = it.value as go.Part;
          if (!selPart || !selPart.data) continue;
          if (selPart.data.key === node.key) continue;
          nodes.push(selPart.data);
        }

        const choices = uid.getConnectToSelectedTypes(node, selection, myMetis, diagram);

        const fromTypeRef = node.objtypeRef;
        const fromType = myMetis.findObjectType(fromTypeRef);
        const args = {
          fromType: fromType,
          nodeFrom: node,
          nodesTo: nodes,
          typeNames: choices,
        };

        const modalContext = {
          what: "selectDropdown",
          title: "Select Relationship Type",
          case: "Connect to Selected",
          myDiagram: diagram,
          args: args
        };

        myMetis.currentNode = node;
        myMetis.myDiagram = diagram;
        diagram.handleOpenModal(node, modalContext);
      };

      const handleDeleteSelectedViews = (diagram: go.Diagram) => {
        if (!diagram) return;
        if (diagram.selection.count === 0) return;
        if (!diagram.commandHandler.canDeleteSelection()) return;
        if (!confirm('Do you really want to delete the current selection?')) return;
        myMetis.deleteViewsOnly = true;
        const first = diagram.selection.first();
        if (first && first.data) {
          myMetis.currentNode = first.data;
        }
        diagram.commandHandler.deleteSelection();
      };

      const handleAddConnectedObjects = (diagram: go.Diagram, part: go.Part) => {
        if (!diagram || !part) return;
        const nodeData: any = part.data;
        if (!nodeData || nodeData.category !== constants.gojs.C_OBJECT) return;

        let noLevels: string | number = '9';
        let reltypes = 'All';
        let reldir = 'All';
        const useDefaults = confirm('Use default parameters?');
        if (!useDefaults) {
          const levelInput = prompt('Enter number of sublevels to follow', String(noLevels));
          if (levelInput !== null && levelInput.trim().length > 0) {
            noLevels = levelInput;
          }
          const reltypeInput = prompt('Enter relationship type to follow', reltypes);
          if (reltypeInput !== null && reltypeInput.trim().length > 0) {
            reltypes = reltypeInput;
          }
          const reldirInput = prompt('Enter relationship direction to follow (in | out | All)', reldir);
          if (reldirInput !== null && reldirInput.trim().length > 0) {
            reldir = reldirInput;
          }
        }

        const params = {
          noLevels,
          reltypes: reltypes === 'All' ? '' : reltypes,
          reldir
        };

        const selection = diagram.selection.count > 0 ? diagram.selection : (() => {
          const nodePart = diagram.findPartForKey(nodeData.key);
          if (nodePart) {
            diagram.select(nodePart);
            return diagram.selection;
          }
          return diagram.selection;
        })();

        for (let it = selection.iterator; it?.next();) {
          const sel = it.value;
          const selData = sel?.data;
          if (selData && selData.category === constants.gojs.C_OBJECT) {
            uid.addConnectedObjects(selData, params, myMetis, diagram);
          }
        }
      };

      const handleHideConnectedRelationships = (diagram: go.Diagram, part: go.Part) => {
        if (!diagram || !part) return;
        const nodeData: any = part.data;
        if (!nodeData || nodeData.category !== constants.gojs.C_OBJECT) return;
        const nodePart = diagram.findNodeForKey(nodeData.key);
        if (!nodePart) return;
        uid.hideConnectedRelationships(nodePart, myMetis, diagram);
      };

      const handleSelectConnectedObjects = (diagram: go.Diagram, part: go.Part) => {
        if (!diagram || !part) return;
        const nodeData: any = part.data;
        if (!nodeData || nodeData.category !== constants.gojs.C_OBJECT) return;
        uid.selectConnectedObjects(nodeData, myMetis, diagram);
      };

      const handleSelectAllObjectsOfSameType = (diagram: go.Diagram, part: go.Part) => {
        if (!diagram || !part) return;
        const nodeData: any = part.data;
        if (!nodeData || nodeData.category !== constants.gojs.C_OBJECT) return;
        const myModel = myMetis.currentModel;
        const myGoModel = myMetis.gojsModel;
        if (!myModel || !myGoModel) return;
        const typeName =
          nodeData?.object?.type?.name ||
          nodeData?.objecttype?.name ||
          nodeData?.objtype?.name ||
          nodeData?.objtypeName;
        if (!typeName) return;

        const objects = myModel.getObjectsByTypename(typeName, false) || [];
        let firstTime = true;
        for (let i = 0; i < objects.length; i++) {
          const obj = objects[i];
          if (!obj) continue;
          const oviews = obj.objectviews;
          if (!oviews) continue;
          for (let j = 0; j < oviews.length; j++) {
            const ov = oviews[j];
            if (!ov) continue;
            const node = myGoModel.findNodeByViewId(ov?.id);
            const gjsNode = diagram.findNodeForKey(node?.key);
            if (gjsNode) {
              if (firstTime) {
                diagram.select(gjsNode);
                firstTime = false;
              } else {
                gjsNode.isSelected = true;
              }
            }
          }
        }
      };

      const handleSelectAllRelationshipsOfSameType = (diagram: go.Diagram, part: go.Link) => {
        if (!diagram || !(part instanceof go.Link)) return;
        const data: any = part.data;
        if (!data || data.category !== constants.gojs.C_RELATIONSHIP) return;
        const relship = data.relship || myMetis.findRelationship(data?.relshipRef);
        const typeName = relship?.type?.name || data?.relshiptype?.name;
        if (!typeName) return;
        let first = true;
        diagram.links.each((link) => {
          const linkData: any = link.data;
          if (!linkData || linkData.category !== constants.gojs.C_RELATIONSHIP) return;
          const otherRel = linkData.relship || myMetis.findRelationship(linkData?.relshipRef);
          const otherTypeName = otherRel?.type?.name || linkData?.relshiptype?.name;
          if (otherTypeName === typeName) {
            if (first) {
              diagram.select(link);
              first = false;
            } else {
              link.isSelected = true;
            }
          }
        });
      };

      const handleSelectAllRelationshipsBetweenObjects = (diagram: go.Diagram, part: go.Link) => {
        if (!diagram || !(part instanceof go.Link)) return;
        const data: any = part.data;
        if (!data || data.category !== constants.gojs.C_RELATIONSHIP) return;
        const relship = data.relship || myMetis.findRelationship(data?.relshipRef);
        const fromId = relship?.fromObject?.id;
        const toId = relship?.toObject?.id;
        if (!fromId || !toId) return;
        let first = true;
        diagram.links.each((link) => {
          const linkData: any = link.data;
          if (!linkData || linkData.category !== constants.gojs.C_RELATIONSHIP) return;
          const rel = linkData.relship || myMetis.findRelationship(linkData?.relshipRef);
          const otherFrom = rel?.fromObject?.id;
          const otherTo = rel?.toObject?.id;
          if (!otherFrom || !otherTo) return;
          const sameDirection = otherFrom === fromId && otherTo === toId;
          const reverseDirection = otherFrom === toId && otherTo === fromId;
          if (sameDirection || reverseDirection) {
            if (first) {
              diagram.select(link);
              first = false;
            } else {
              link.isSelected = true;
            }
          }
        });
      };

      const handleShowRelationshipTypeview = (diagram: go.Diagram, part: go.Link) => {
        if (!diagram || !(part instanceof go.Link)) return;
        const data: any = part.data;
        if (!data || data.category !== constants.gojs.C_RELATIONSHIP) return;
        uid.editRelshipTypeview(data, myMetis, diagram, true);
      };

      const canResetRelationshipToTypeview = (part: go.Link) => {
        const data: any = part?.data;
        if (!data || data.category !== constants.gojs.C_RELATIONSHIP) return false;
        const relship = myMetis.findRelationship(data?.relshipRef) || data.relship;
        const relshipview = myMetis.findRelationshipView(data?.relviewRef) || data.relshipview;
        const reltype = relship?.type;
        const typeView = data.typeview || relshipview?.typeview;
        const defaultTypeview = reltype?.typeview;
        if (!relship || !relshipview || !reltype || !defaultTypeview) return false;
        if (!typeView) return true;
        return typeView.id !== defaultTypeview.id;
      };

      const handleResetRelationshipToTypeview = (diagram: go.Diagram, part: go.Link) => {
        if (!diagram || !(part instanceof go.Link)) return;
        const data: any = part.data;
        if (!data || data.category !== constants.gojs.C_RELATIONSHIP) return;
        uid.resetToTypeview(data, myMetis, diagram);
      };

      const handleClearRelationshipPath = (diagram: go.Diagram, part: go.Link) => {
        if (!diagram || !(part instanceof go.Link)) return;
        const selectedLinks: go.Link[] = [];
        diagram.selection.each((sel) => {
          if (sel instanceof go.Link) {
            selectedLinks.push(sel);
          }
        });
        if (selectedLinks.length === 0) {
          selectedLinks.push(part);
        }
        uid.clearPath(selectedLinks, myMetis, diagram);
      };

      const handleChangeRelationshipType = (diagram: go.Diagram, part: go.Link) => {
        if (!diagram || !(part instanceof go.Link)) return;
        const data: any = part.data;
        if (!data || data.category !== constants.gojs.C_RELATIONSHIP) return;

        const myModelview = myMetis.currentModelview;
        const myMetamodel = myMetis.currentMetamodel;
        const relship = myMetis.findRelationship(data.relshipRef) || data.relship;
        if (!relship || !myModelview || !myMetamodel) return;

        let includeInheritedReltypes = myModelview.includeInheritedReltypes;
        let includeIsType = false;

        const fromObj = relship.fromObject;
        const toObj = relship.toObject;
        if (!fromObj || !toObj) return;

        let fromType = myMetamodel.findObjectType(fromObj.type.id) || myMetis.findObjectType(fromObj.type.id);
        let toType = myMetamodel.findObjectType(toObj.type.id) || myMetis.findObjectType(toObj.type.id);

        if (fromType?.name === constants.types.AKM_ENTITY_TYPE && toType?.name === constants.types.AKM_ENTITY_TYPE) {
          includeIsType = true;
        }

        let reltypes = myMetamodel.findRelationshipTypesBetweenTypes(fromType, toType, includeInheritedReltypes) || [];
        const extraTypes = myMetis.findRelationshipTypesBetweenTypes(fromType, toType, true) || [];
        for (let i = 0; i < extraTypes.length; i++) {
          const rtype = extraTypes[i];
          if (!rtype) continue;
          if (rtype.name === constants.types.AKM_GENERIC_REL || rtype.name === constants.types.AKM_REFERS_TO) {
            reltypes.push(rtype);
          }
        }

        const choices: string[] = [];
        reltypes?.forEach((rtype: any) => {
          if (rtype?.name) choices.push(rtype.name);
        });
        if (includeIsType) {
          choices.push(constants.types.AKM_IS);
        }

        const uniqueChoices = utils.removeArrayDuplicates(choices);
        if (uniqueChoices.length === 0) return;

        const args = {
          typeNames: uniqueChoices,
        };

        const modalContext = {
          what: "selectDropdown",
          title: "Select Relationship Type",
          case: "Change Relationship type",
          myDiagram: diagram,
          args,
        };

        myMetis.currentLink = data;
        myMetis.myDiagram = diagram;
        diagram.handleOpenModal(uniqueChoices, modalContext);
      };

      const handleDeletePart = (diagram: go.Diagram, part: go.Part) => {
        if (!diagram || !part) return;
        const restore = exclusiveSelectPart(diagram, part);
        if (!diagram.commandHandler.canDeleteSelection()) {
          restore();
          return;
        }
        if (confirm('Do you really want to delete this object?')) {
          myMetis.deleteViewsOnly = false;
          myMetis.currentNode = part.data;
          diagram.commandHandler.deleteSelection();
        }
        restore();
      };

      const handleEditRelationship = (diagram: go.Diagram, part: go.Link) => {
        if (!diagram || !part) return;
        const linkData: any = part.data;
        if (!linkData) return;
        const relship = myMetis.findRelationship(linkData?.relshipRef);
        const relshipview = myMetis.findRelationshipView(linkData?.relviewRef);
        const relshiptype = myMetis.findRelationshipType(relship?.typeRef);
        const relshiptypeview = relshiptype?.typeview;
        const context = {
          object: null,
          objectview: null,
          objecttype: null,
          objecttypeview: null,
          relship: relship,
          relshipview: relshipview,
          relshiptype: relshiptype,
          relshiptypeview: relshiptypeview,
          model: myMetis.currentModel,
          modelview: myMetis.currentModelview,
          metamodel: myMetis.currentMetamodel,
        };
        const modalContext = {
          what: "editRelationship",
          title: "Edit Relationship",
          myDiagram: diagram,
          myContext: context,
        };
        myMetis.currentLink = linkData;
        myMetis.myDiagram = diagram;
        diagram.handleOpenModal(linkData, modalContext);
      };

      const handleEditRelationshipView = (diagram: go.Diagram, part: go.Link) => {
        if (!diagram || !part) return;
        const linkData: any = part.data;
        if (!linkData) return;
        const relship = myMetis.findRelationship(linkData?.relshipRef);
        const relshipview = myMetis.findRelationshipView(linkData?.relviewRef);
        const relshiptype = myMetis.findRelationshipType(relship?.reltypeRef || relship?.typeRef);
        const relshiptypeview = relshiptype?.typeview;
        const context = {
          object: null,
          objectview: null,
          objecttype: null,
          objecttypeview: null,
          relship: relship,
          relshipview: relshipview,
          relshiptype: relshiptype,
          relshiptypeview: relshiptypeview,
          model: myMetis.currentModel,
          modelview: myMetis.currentModelview,
          metamodel: myMetis.currentMetamodel,
        };
        const modalContext = {
          what: "editRelshipview",
          title: "Edit Relationship View",
          myDiagram: diagram,
          myContext: context,
        };
        myMetis.currentLink = linkData;
        myMetis.myDiagram = diagram;
        diagram.handleOpenModal(linkData, modalContext);
      };

      const handleLinkDelete = (diagram: go.Diagram, part: go.Link) => {
        if (!diagram || !part) return;
        ensurePartInSelection(diagram, part);
        if (!diagram.commandHandler.canDeleteSelection()) return;
        if (confirm('Do you really want to delete the current selection?')) {
          myMetis.deleteViewsOnly = false;
          myMetis.currentLink = part.data;
          diagram.commandHandler.deleteSelection();
        }
      };

      const handleDeleteSelection = (diagram: go.Diagram) => {
        if (!diagram) return;
        if (!diagram.commandHandler.canDeleteSelection()) return;
        if (confirm('Do you really want to delete the current selection?')) {
          myMetis.deleteViewsOnly = false;
          diagram.commandHandler.deleteSelection();
        }
      };

      const deleteNodeMenuItems = (part: go.Part): HtmlMenuItem[] => [
        {
          label: "Delete Selection",
          action: (diagram) => handleDeleteSelection(diagram),
          enabled: (diagram) => diagram.commandHandler.canDeleteSelection(),
        },
        {
          label: "Delete",
          action: (diagram) => handleDeletePart(diagram, part),
          enabled: (diagram) => canDeleteSinglePart(diagram, part),
        },
        {
          label: "Delete View",
          action: (diagram) => {
            if (!diagram) return;
            const restore = exclusiveSelectPart(diagram, part);
            if (!diagram.commandHandler.canDeleteSelection()) {
              restore();
              return;
            }
            if (!confirm('Do you really want to delete this object view?')) {
              restore();
              return;
            }
            myMetis.deleteViewsOnly = true;
            myMetis.currentNode = part.data;
            diagram.commandHandler.deleteSelection();
            restore();
          },
          enabled: (diagram) => canDeleteSinglePart(diagram, part),
        },
        {
          label: "Delete Selected Views",
          action: (diagram) => {
            if (!diagram || !diagram.commandHandler.canDeleteSelection()) return;
            if (!confirm('Do you really want to delete the current selection?')) return;
            myMetis.deleteViewsOnly = true;
            diagram.commandHandler.deleteSelection();
          },
          enabled: (diagram) => diagram.commandHandler.canDeleteSelection() && diagram.selection.count > 1,
        },
      ];

      const deleteLinkMenuItems = (part: go.Link): HtmlMenuItem[] => [
        {
          label: "Delete Selection",
          action: (diagram) => handleDeleteSelection(diagram),
          enabled: (diagram) => diagram.commandHandler.canDeleteSelection(),
        },
        {
          label: "Delete",
          action: (diagram) => {
            if (!diagram || !(part instanceof go.Link)) return;
            const restore = exclusiveSelectPart(diagram, part);
            if (!diagram.commandHandler.canDeleteSelection()) {
              restore();
              return;
            }
            if (!confirm('Do you really want to delete this relationship?')) {
              restore();
              return;
            }
            myMetis.deleteViewsOnly = false;
            myMetis.currentLink = part.data;
            diagram.commandHandler.deleteSelection();
            restore();
          },
          enabled: (diagram) => canDeleteSinglePart(diagram, part),
        },
        {
          label: "Delete View",
          action: (diagram) => {
            if (!diagram || !(part instanceof go.Link)) return;
            const restore = exclusiveSelectPart(diagram, part);
            if (!diagram.commandHandler.canDeleteSelection()) {
              restore();
              return;
            }
            if (!confirm('Do you really want to delete the current relationship view?')) {
              restore();
              return;
            }
            myMetis.deleteViewsOnly = true;
            myMetis.currentLink = part.data;
            diagram.commandHandler.deleteSelection();
            restore();
          },
          enabled: (diagram) => canDeleteSinglePart(diagram, part),
        },
      ];

      const buildNodeMenuItems = (part: go.Part): HtmlMenuItem[] => {
        const items: HtmlMenuItem[] = [];
        items.push({
          label: "Copy",
          action: (diagram) => handlePartCopy(diagram, part),
        });
        items.push({
          label: "Paste",
          action: (diagram) => handlePartPaste(diagram, false),
          enabled: (diagram) => diagram.commandHandler.canPasteSelection(),
        });
        items.push({
          label: "Paste View",
          action: (diagram) => handlePartPaste(diagram, true),
          enabled: (diagram) => diagram.commandHandler.canPasteSelection(),
        });
        if (canEditAttribute(part)) {
          items.push({
            label: "Edit Relationship Type",
            action: (diagram) => handleEditAttribute(diagram, part),
          });
        }
        const data: any = part.data || {};
        const isObject = data.category === constants.gojs.C_OBJECT;
        if (isObject) {
          items.push({
            label: "Edit Object",
            action: () => handleEditObject(part),
          });
          items.push({
            label: "Edit Object View",
            action: () => handleEditObjectview(part),
          });
          const connectionsMenuItems: HtmlMenuItem[] = [
            {
              label: "Connect to Selected",
              action: (diagram) => handleConnectToSelected(diagram, part),
              enabled: (diagram) => !!diagram && diagram.selection.count > 0,
            },
            {
              label: "Add Connected Objects",
              action: (diagram) => handleAddConnectedObjects(diagram, part),
            },
            {
              label: "Hide Connected Relationships",
              action: (diagram) => handleHideConnectedRelationships(diagram, part),
            },
            {
              label: "Select Connected Objects",
              action: (diagram) => handleSelectConnectedObjects(diagram, part),
            },
          ];
          items.push({
            label: "Connections…",
            action: showSubMenu(connectionsMenuItems),
            closeOnClick: false,
          });
          const selectionMenuItems: HtmlMenuItem[] = [
            {
              label: "Sort Selection",
              action: (diagram) => handleSortSelection(diagram),
              enabled: (diagram) => !!diagram && diagram.selection.count > 1,
            },
            {
              label: "Delete Selection",
              action: (diagram) => handleDeleteSelection(diagram),
              enabled: (diagram) => !!diagram && diagram.commandHandler.canDeleteSelection(),
            },
            {
              label: "Delete Selected Views",
              action: (diagram) => handleDeleteSelectedViews(diagram),
              enabled: (diagram) => !!diagram && diagram.commandHandler.canDeleteSelection(),
            },
            {
              label: "Add to Selection",
              action: (_diagram) => uid.addToSelection(part, myDiagram),
            },
            {
              label: "Select All Objects of This Type",
              action: (diagram) => handleSelectAllObjectsOfSameType(diagram, part),
            },
          ];
          items.push({
            label: "Selection…",
            action: showSubMenu(selectionMenuItems),
            closeOnClick: false,
          });
        }
        items.push({ separator: true });
        items.push({
          label: "Delete…",
          action: showSubMenu(deleteNodeMenuItems(part)),
          closeOnClick: false,
        });
        items.push({ separator: true });
        items.push({
          label: "More… (old menu)",
          action: (diagram, tool) => showAdvancedPartMenu(diagram, tool, part),
          closeOnClick: false,
        });
        return items;
      };

      const buildLinkMenuItems = (part: go.Link): HtmlMenuItem[] => {
        const items: HtmlMenuItem[] = [];
        const data: any = part.data || {};
        const category = data.category;
        const isRelationship = category === constants.gojs.C_RELATIONSHIP;

        // if (canEditAttribute(part)) {
        //   items.push({
        //     label: "Edit Attribute",
        //     action: (diagram) => handleEditAttribute(diagram, part),
        //   });
        // }
        if (isRelationship) {
          const linkPart = part as go.Link;
          items.push({
            label: "Edit Relationship",
            action: (diagram) => handleEditRelationship(diagram, part),
          });
          items.push({
            label: "Edit Relationship View",
            action: (diagram) => handleEditRelationshipView(diagram, part),
          });
          items.push({
            label: "Change Relationship Type",
            action: (diagram) => handleChangeRelationshipType(diagram, linkPart),
          });
          items.push({
            label: "Clear Path",
            action: (diagram) => handleClearRelationshipPath(diagram, linkPart),
          });
          const typeviewMenuItems: HtmlMenuItem[] = [
            {
              label: "Show Typeview",
              action: (diagram) => handleShowRelationshipTypeview(diagram, linkPart),
            },
            {
              label: "Reset to Typeview",
              action: (diagram) => handleResetRelationshipToTypeview(diagram, linkPart),
              enabled: (_diagram) => canResetRelationshipToTypeview(linkPart),
            },
          ];
          items.push({
            label: "Typeview…",
            action: showSubMenu(typeviewMenuItems),
            closeOnClick: false,
          });
          const selectionMenuItems: HtmlMenuItem[] = [
            {
              label: "Sort Selection",
              action: (diagram) => handleSortSelection(diagram),
              enabled: (diagram) => !!diagram && diagram.selection.count > 1,
            },
            {
              label: "Delete Selection",
              action: (diagram) => handleDeleteSelection(diagram),
              enabled: (diagram) => !!diagram && diagram.commandHandler.canDeleteSelection(),
            },
            {
              label: "Delete Selected Views",
              action: (diagram) => handleDeleteSelectedViews(diagram),
              enabled: (diagram) => !!diagram && diagram.commandHandler.canDeleteSelection(),
            },
            {
              label: "Add to Selection",
              action: (_diagram) => uid.addToSelection(part, myDiagram),
            },
            {
              label: "Select All Relationships of This Type",
              action: (diagram) => handleSelectAllRelationshipsOfSameType(diagram, linkPart),
            },
            {
              label: "Select All Between These Objects",
              action: (diagram) => handleSelectAllRelationshipsBetweenObjects(diagram, linkPart),
            },
          ];
          items.push({
            label: "Selection…",
            action: showSubMenu(selectionMenuItems),
            closeOnClick: false,
          });
        }

        items.push({ separator: true });
        items.push({
          label: "Delete…",
          action: showSubMenu(deleteLinkMenuItems(part)),
          closeOnClick: false,
        });
        items.push({ separator: true });
        items.push({
          label: "More… (old menu)",
          action: (diagram, tool) => showAdvancedLinkMenu(diagram, tool, part),
          closeOnClick: false,
        });
        return items;
      };

      const buildPartMenuItems = (part: go.Part): HtmlMenuItem[] => {
        if (part instanceof go.Link) {
          return buildLinkMenuItems(part);
        }
        return buildNodeMenuItems(part);
      };

      const showAdvancedPartMenu = (diagram: go.Diagram, tool: go.ContextMenuTool, part: go.Part) => {
        if (!advancedPartContextMenu || !part) return;
        disposeBackgroundMenu();
        const cmTool = tool || diagram.toolManager.contextMenuTool;
        const menuCopy = advancedPartContextMenu.copy() as go.Adornment;
        menuCopy.adornedObject = part;
        cmTool.currentContextMenu = menuCopy;
        cmTool.showContextMenu(menuCopy, part);
      };

      const showAdvancedLinkMenu = (diagram: go.Diagram, tool: go.ContextMenuTool, part: go.Part) => {
        if (!advancedLinkContextMenu || !part) return;
        disposeBackgroundMenu();
        const cmTool = tool || diagram.toolManager.contextMenuTool;
        const menuCopy = advancedLinkContextMenu.copy() as go.Adornment;
        menuCopy.adornedObject = part;
        cmTool.currentContextMenu = menuCopy;
        cmTool.showContextMenu(menuCopy, part);
      };

      const showPartHtmlMenu = (diagram: go.Diagram, tool: go.ContextMenuTool, part: go.Part | null) => {
        const targetPart = part ?? (diagram?.selection?.first() as go.Part);
        if (!diagram || !(targetPart instanceof go.Part)) return;
        const items = buildPartMenuItems(targetPart);
        if (!items || items.length === 0) return;
        disposeBackgroundMenu();
        const menu = buildBackgroundMenu(items, diagram, tool);
        document.body.appendChild(menu);
        activeMenuDiv = menu;
        activeSubMenuDiv = null;
        const diagramDiv = diagram.div;
        if (diagramDiv) {
          const rect = diagramDiv.getBoundingClientRect();
          const viewPoint = diagram.lastInput.viewPoint;
          let left = rect.left + window.pageXOffset + viewPoint.x;
          let top = rect.top + window.pageYOffset + viewPoint.y;
          const menuRect = menu.getBoundingClientRect();
          const maxLeft = window.pageXOffset + window.innerWidth - menuRect.width - 8;
          const maxTop = window.pageYOffset + window.innerHeight - menuRect.height - 8;
          left = Math.max(window.pageXOffset + 4, Math.min(left, maxLeft));
          top = Math.max(window.pageYOffset + 4, Math.min(top, maxTop));
          menu.style.left = `${left}px`;
          menu.style.top = `${top}px`;
        } else {
          positionBackgroundMenu(menu, diagram, tool);
        }
      };

      partContextMenu = new go.HTMLInfo({
        show: (obj: go.GraphObject | null, diagram: go.Diagram, tool: go.ContextMenuTool) => {
          const part = obj ? obj.part : null;
          showPartHtmlMenu(diagram, tool, part as go.Part);
        },
        hide: disposeBackgroundMenu,
      });

      linkContextMenu = new go.HTMLInfo({
        show: (obj: go.GraphObject | null, diagram: go.Diagram, tool: go.ContextMenuTool) => {
          const part = obj ? obj.part : null;
          showPartHtmlMenu(diagram, tool, part as go.Part);
        },
        hide: disposeBackgroundMenu,
      });

      const handleCopySelected = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        if (!targetDiagram) return;
        const selection = targetDiagram.selection;
        if (!selection || selection.count <= 1) return;

        const sourceNodes: any[] = [];
        const sourceLinks: any[] = [];

        for (let it = selection.iterator; it?.next();) {
          const part = it.value;
          if (part instanceof go.Node) {
            addSourceNode(sourceNodes, part);
          } else if (part instanceof go.Link) {
            addSourceLink(sourceLinks, part);
          }
        }

        const copied: any[] = [];
        selection.each(function (sel) {
          const data = sel.data;
          if (!data) return;
          const key = data.key;
          data.fromModelview = myMetis.currentModelview;
          data.fromGoModel = myMetis.gojsModel;
          data.fromNode = getSourceNode(sourceNodes, key);
          data.fromLink = getSourceLink(sourceLinks, key);
          copied.push(data);
        });

        if (copied.length > 1) {
          myMetis.currentSelection = copied;
          targetDiagram.commandHandler.copySelection();
        }
      };

      const handleVerifyModel = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        const myModel = myMetis.currentModel;
        if (!myModel) return;
        const modelviews = myModel.modelviews;
        const myMetamodel = myMetis.currentMetamodel;
        const myGoModel = myMetis.gojsModel;
        targetDiagram.myGoModel = myGoModel;
        uic.verifyAndRepairModel(myModel, myMetamodel, modelviews, targetDiagram, myMetis);
        alert("The current model has been repaired");
      };

      const handleToggleCardinality = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        const modelview = myMetis.currentModelview;
        if (!modelview) return;
        if (modelview.showCardinality == undefined)
          modelview.showCardinality = true;
        modelview.showCardinality = !modelview.showCardinality;
        if (!modelview.showCardinality) {
          alert("Cardinality on relationships will NOT be shown!");
        } else {
          alert("Cardinality on relationships WILL be shown!");
        }
        const jsnModelview = new jsn.jsnModelView(modelview);
        const modifiedModelviews = new Array();
        modifiedModelviews.push(jsnModelview);
        modifiedModelviews.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          targetDiagram.dispatch?.({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        });
      };

      const handleToggleIncludeRelshipKind = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        const model = myMetis.currentModel;
        if (!model) return;
        const relkind = model.includeRelshipkind;
        model.includeRelshipkind = !relkind;
        if (!model.includeRelshipkind) {
          alert("Setting 'Relationship Kind' will NOT be allowed!");
        } else {
          alert("Setting 'Relationship Kind' WILL be allowed!");
        }
        const jsnModel = new jsn.jsnModel(model, true);
        const modifiedModels = new Array();
        modifiedModels.push(jsnModel);
        modifiedModels.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          targetDiagram.dispatch?.({ type: 'UPDATE_MODEL_PROPERTIES', data })
        });
      };

      const handleToggleShowRelshipNames = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        const modelview = myMetis.currentModelview;
        if (!modelview) return;
        if (modelview.showRelshipNames == undefined)
          modelview.showRelshipNames = true;
        modelview.showRelshipNames = !modelview.showRelshipNames;
        if (!modelview.showRelshipNames) {
          alert("Relationship Names will NOT be shown!");
        } else {
          alert("Relationship Names will be shown!");
        }
        const jsnModelview = new jsn.jsnModelView(modelview);
        const modifiedModelviews = new Array();
        modifiedModelviews.push(jsnModelview);
        modifiedModelviews.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          targetDiagram.dispatch?.({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        });
      };

      const handleToggleAskForRelshipName = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        const modelview = myMetis.currentModelview;
        if (!modelview) return;
        if (modelview.askForRelshipName == undefined)
          modelview.askForRelshipName = false;
        modelview.askForRelshipName = !modelview.askForRelshipName;
        if (!modelview.askForRelshipName) {
          alert("Relationship names will NOT be asked for!");
        } else {
          alert("Relationship names WILL be asked for!");
        }
        const jsnModelview = new jsn.jsnModelView(modelview);
        const modifiedModelviews = new Array();
        modifiedModelviews.push(jsnModelview);
        modifiedModelviews.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          targetDiagram.dispatch?.({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        });
      };

      const handleToggleIncludeInheritedReltypes = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        const modelview = myMetis.currentModelview;
        if (!modelview) return;
        if (modelview.includeInheritedReltypes == undefined)
          modelview.includeInheritedReltypes = false;
        modelview.includeInheritedReltypes = !modelview.includeInheritedReltypes;
        if (!modelview.includeInheritedReltypes) {
          alert("Inherited Relationship types are NOT included!");
        } else {
          alert("Inherited Relationship types ARE included!");
        }
        const jsnModelview = new jsn.jsnModelView(modelview);
        const modifiedModelviews = new Array();
        modifiedModelviews.push(jsnModelview);
        modifiedModelviews.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          targetDiagram.dispatch?.({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        });
      };

      const handleDoLayout = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        const myModelview = myMetis.currentModelview;
        if (!myModelview) return;
        targetDiagram.modelview = myModelview;
        let layout = "";
        const modifiedRelshipViews: jsn.jsnRelshipView[] = [];
        if (myMetis.modelType === 'Modelling') {
          targetDiagram.selection.each(function (sel) {
            const link = sel.data;
            if (link.category === constants.gojs.C_RELATIONSHIP) {
              const fromLink = link.from;
              const toLink = link.to;
              let relview: akm.cxRelationshipView;
              relview = myModelview.findRelationshipView(link.key);
              if (relview) {
                const fromObjview = relview.fromObjview;
                const toObjview = relview.toObjview;
                link.points = [];
                link.from = fromLink;
                link.to = toLink;
                targetDiagram.model.setDataProperty(link, "points", []);
                relview.points = [];
                relview.fromObjview = fromObjview;
                relview.toObjview = toObjview;
                const jsnRelView = new jsn.jsnRelshipView(relview);
                modifiedRelshipViews.push(jsnRelView);
              }
            }
          });
          myModelview.clearRelviewPoints();
          const myGoModel = myMetis.gojsModel;
          layout = myGoModel.modelView?.layout;
        } else if (myMetis.modelType === 'Metamodelling') {
          const myMetamodel = myMetis.currentMetamodel;
          layout = myMetamodel.layout;
        }
        setLayout(targetDiagram, layout);
        const nodes = targetDiagram.nodes;
        for (let it = nodes.iterator; it?.next();) {
          const node = it.value;
          const data = node.data;
          let objview = data.objectview;
          if (!objview)
            objview = myModelview.findObjectView(data.objviewRef);
          if (objview) {
            objview.loc = data.loc;
          }
        }
        modifiedRelshipViews.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          targetDiagram.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
        });
        const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
        let data = { metis: jsnMetis };
        data = JSON.parse(JSON.stringify(data));
        targetDiagram.dispatch?.({ type: 'LOAD_TOSTORE_PHDATA', data });
      };

      const handleSaveLayout = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        if (myMetis.modelType === 'Metamodelling') {
          const myMetamodel = myMetis.currentMetamodel;
          if (!myMetamodel) return;
          const nodes = targetDiagram.nodes;
          const objtypegeos = [];
          for (let it = nodes.iterator; it?.next();) {
            const node = it.value;
            const data = node.data;
            const objtype = data.objecttype;
            if (!objtype) continue;
            const objtypegeo = objtype.typegeo;
            if (!objtypegeo) continue;
            objtypegeo.loc = data.loc;
            objtypegeo.size = data.size;
            objtypegeo.scale = data.scale;
            const jsnObjtypegeo = new jsn.jsnObjectTypeGeo(objtypegeo);
            objtypegeos.push(jsnObjtypegeo);
          }
          objtypegeos.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            targetDiagram.dispatch?.({ type: 'UPDATE_OBJECTTYPEGEOS_PROPERTIES', data })
          });
        } else {
          const myModelview = myMetis.currentModelview;
          if (!myModelview) return;
          const nodes = targetDiagram.nodes;
          const modifiedObjViews = new Array();
          for (let it = nodes.iterator; it?.next();) {
            const node = it.value;
            const data = node.data;
            if (data.category === constants.gojs.C_OBJECTTYPE)
              continue;
            const object = data.object;
            let objview = data.objectview;
            if (!objview) {
              objview = myModelview.findObjectView(data.key);
            }
            if (!objview) continue;
            objview.loc = data.loc;
            objview.size = data.size;
            objview.scale = data.scale;
            objview.group = data.group;
            objview.viewkind = data.viewkind;
            const jsnObjview = new jsn.jsnObjectView(objview);
            modifiedObjViews.push(jsnObjview);
          }
          modifiedObjViews.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            targetDiagram.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
          });
        }
        const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
        let data = { metis: jsnMetis };
        data = JSON.parse(JSON.stringify(data));
        targetDiagram.dispatch?.({ type: 'LOAD_TOSTORE_PHDATA', data });
      };

      const showSubMenu = (items: HtmlMenuItem[]) => (diagram: go.Diagram, tool: go.ContextMenuTool, source?: HTMLElement) => {
        const submenuItems: HtmlMenuItem[] = [
          ...items,
          { separator: true },
          {
            label: "Back",
            action: () => disposeSubMenu(),
            closeOnClick: false
          }
        ];
        renderSubMenu(submenuItems, diagram, tool, source);
      };

      const handleEditMetamodel = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        const currentMetamodel = myMetis.currentMetamodel;
        if (!currentMetamodel) return;
        const currentName = currentMetamodel.name;
        const modelName = prompt("Enter Metamodel name:", currentName);
        if (modelName?.length > 0) {
          currentMetamodel.name = modelName;
        }
        const currentDescr = currentMetamodel.description;
        const modelDescr = prompt("Enter Metamodel description:", currentDescr);
        if (modelDescr?.length > 0) {
          currentMetamodel.description = modelDescr;
        }
        if (currentName !== modelName) {
          currentMetamodel.id = utils.createGuid();
        }
        const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
        let data = { metis: jsnMetis };
        data = JSON.parse(JSON.stringify(data));
        targetDiagram?.dispatch?.({ type: 'LOAD_TOSTORE_PHDATA', data });
      };

      const handleNewMetamodel = () => {
        uid.newMetamodel(myMetis, myDiagram);
      };

      const handleReplaceMetamodel = () => {
        uid.replaceCurrentMetamodel(myMetis, myDiagram);
      };

      const handleAddMetamodel = (isSub: boolean) => {
        uid.addMetamodel(myMetis, myDiagram, isSub);
      };

      const handleDeleteMetamodel = () => {
        uid.deleteMetamodel(myMetis, myDiagram);
      };

      const handleClearMetamodel = () => {
        uid.clearMetamodel(myMetis, myDiagram);
      };

      const handleVerifyMetamodels = () => {
        uic.verifyAndRepairMetamodels(myMetis, myDiagram);
        alert("The metamodels have been repaired");
      };

      const modelMenuItems: HtmlMenuItem[] = [
        {
          label: "New Model",
          action: () => handleNewModel(),
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Edit Model Suite",
          action: (diagram) => handleEditModelSuite(diagram),
          visible: () => !isMetamodellingMode() && !isAdminModelActive(),
        },
        {
          label: "Edit Model",
          action: (diagram) => handleEditModel(diagram),
          visible: () => !isMetamodellingMode() && !isAdminModelActive(),
        },
        {
          label: "Verify & Repair Model",
          action: (diagram) => handleVerifyModel(diagram),
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Delete Model",
          action: () => handleDeleteModel(),
          visible: () => !isMetamodellingMode(),
          enabled: () => hasMultipleActiveModels(),
        },
      ];

      const modelviewMenuItems: HtmlMenuItem[] = [
        {
          label: "New Modelview",
          action: () => handleNewModelview(),
          visible: () => !isMetamodellingMode() && !isAdminModelActive(),
        },
        {
          label: "Edit Modelview",
          action: (diagram) => handleEditModelview(diagram),
          visible: () => !isMetamodellingMode() && !isAdminModelActive(),
        },
        {
          label: "Delete Modelview",
          action: () => handleDeleteModelview(),
          visible: () => !isMetamodellingMode() && !isAdminModelActive(),
          enabled: () => hasMultipleActiveModelviews(),
        },
      ];

      const selectMenuItems: HtmlMenuItem[] = [
        {
          label: "Select All Objects of Type",
          action: (diagram) => handleSelectAllOfType(diagram),
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Select by Object Name",
          action: (diagram) => handleSelectByObjectName(diagram),
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Add Missing Relationship Views",
          action: (diagram) => handleAddMissingRelationshipViews(diagram),
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Unhide Hidden Relationship Views",
          action: () => handleUnhideHiddenRelationshipViews(),
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Delete Invisible Objects",
          action: () => handleDeleteInvisibleObjects(),
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Undelete Selection",
          action: (diagram) => handleUndeleteSelection(diagram),
          enabled: (diagram) => diagram.selection.count > 0,
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Zoom Selection",
          action: (diagram) => zoomSelection(diagram),
          enabled: (diagram) => diagram.selection.count > 0,
        },
      ];

      const layoutMenuItems: HtmlMenuItem[] = [
        {
          label: "Set Layout Scheme",
          action: (diagram) => handleSetLayoutScheme(diagram),
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Do Layout",
          action: (diagram) => handleDoLayout(diagram),
          visible: () => true,
        },
        {
          label: "Save Layout",
          action: (diagram) => handleSaveLayout(diagram),
          visible: () => true,
        },
        {
          label: "Open / Close All Groups",
          action: (diagram) => handleOpenCloseGroups(diagram),
          visible: () => !isMetamodellingMode(),
        },
      ];

      const toggleMenuItems: HtmlMenuItem[] = [
        {
          label: "Toggle Cardinality",
          action: (diagram) => handleToggleCardinality(diagram),
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Toggle Relationship Kind",
          action: (diagram) => handleToggleIncludeRelshipKind(diagram),
        },
        {
          label: "Toggle Relationship Names",
          action: (diagram) => handleToggleShowRelshipNames(diagram),
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Toggle Ask for Relationship Name",
          action: (diagram) => handleToggleAskForRelshipName(diagram),
        },
        {
          label: "Toggle Include Inherited Reltypes",
          action: (diagram) => handleToggleIncludeInheritedReltypes(diagram),
        },
      ];

      const metamodelMenuItems: HtmlMenuItem[] = [
        {
          label: "Edit Metamodel",
          action: (diagram) => handleEditMetamodel(diagram),
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "New Metamodel",
          action: () => handleNewMetamodel(),
          visible: () => !isMetamodellingMode() && !isGenericMetamodelContext(),
        },
        {
          label: "Replace Current Metamodel",
          action: () => handleReplaceMetamodel(),
          visible: () => !isMetamodellingMode() && !isGenericMetamodelContext(),
        },
        {
          label: "Add Metamodel",
          action: () => handleAddMetamodel(false),
          visible: () => !isMetamodellingMode() && !isGenericMetamodelContext(),
          enabled: () => (myMetis.metamodels?.length || 0) >= 2,
        },
        {
          label: "Add Sub-Metamodel",
          action: () => handleAddMetamodel(true),
          visible: () => !isMetamodellingMode() && !isGenericMetamodelContext(),
        },
        {
          label: "Delete Metamodel",
          action: () => handleDeleteMetamodel(),
          visible: () => !isMetamodellingMode() && !isGenericMetamodelContext(),
          enabled: () => hasMultipleActiveMetamodels(),
        },
        {
          label: "Clear Metamodel Content",
          action: () => handleClearMetamodel(),
          visible: () => !isMetamodellingMode() && !isGenericMetamodelContext(),
          enabled: () => hasMultipleActiveMetamodels(),
        },
        {
          label: "Verify & Repair Metamodels",
          action: () => handleVerifyMetamodels(),
        },
      ];

      const coreBackgroundMenu: HtmlMenuItem[] = [
        {
          label: "Paste",
          action: (diagram) => {
            myMetis.pasteViewsOnly = false;
            const currentSelection: any[] = [];
            diagram.selection.each((sel) => currentSelection.push(sel.data));
            myMetis.currentSelection = currentSelection;
            const point = diagram.toolManager.contextMenuTool.mouseDownPoint;
            diagram.commandHandler.pasteSelection(point);
          },
          enabled: (diagram) => diagram.commandHandler.canPasteSelection(),
        },
        {
          label: "Paste View",
          action: (diagram) => {
            myMetis.pasteViewsOnly = true;
            const currentSelection: any[] = [];
            diagram.selection.each((sel) => currentSelection.push(sel.data));
            myMetis.currentSelection = currentSelection;
            const point = diagram.toolManager.contextMenuTool.mouseDownPoint;
            diagram.commandHandler.pasteSelection(point);
          },
          enabled: (diagram) => diagram.commandHandler.canPasteSelection(),
        },
        {
          label: "Select…",
          action: showSubMenu(selectMenuItems),
          closeOnClick: false,
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Copy Selected",
          action: (diagram) => handleCopySelected(diagram),
          enabled: (diagram) => diagram.selection.count > 1,
          visible: (diagram) => diagram.selection.count > 1,
        },
        {
          separator: true,
          visible: (diagram) => myMetis.modelType !== 'Metamodelling' && diagram.commandHandler.canPasteSelection(),
        },
        {
          label: "Model…",
          action: showSubMenu(modelMenuItems),
          closeOnClick: false,
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Modelview…",
          action: showSubMenu(modelviewMenuItems),
          closeOnClick: false,
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Metamodel…",
          action: showSubMenu(metamodelMenuItems),
          closeOnClick: false,
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Relationship…",
          action: showSubMenu(toggleMenuItems),
          closeOnClick: false,
        },
        {
          label: "Layout…",
          action: showSubMenu(layoutMenuItems),
          closeOnClick: false,
        },
        {
          label: "Zoom All",
          action: (diagram) => {
            diagram.commandHandler.zoomToFit();
          },
        },
        {
          label: "Zoom Selection",
          action: (diagram) => {
            zoomSelection(diagram);
          },
          enabled: (diagram) => diagram.selection.count > 0,
        },
        { separator: true },
        {
          label: "More… (old menu)",
          action: (diagram, tool) => {
            showAdvancedGoMenu(diagram, tool);
          },
          closeOnClick: false,
        },
      ];

      myDiagram.contextMenu = new go.HTMLInfo({
        show: (_obj: go.GraphObject | null, diagram: go.Diagram, tool: go.ContextMenuTool) => {
          renderBackgroundMenu(coreBackgroundMenu, diagram, tool);
        },
        hide: disposeBackgroundMenu,
      });
    }

    // Define invisible layer 'AdminLayer'
    // const forelayer = myDiagram.findLayer("Foreground");
    // myDiagram.addLayerBefore($(go.Layer, { name: "AdminLayer" }), forelayer);
    // const layer = myDiagram.findLayer('AdminLayer');
    // layer.visible = false;

    // Define template maps
    {
	      // Keep nodes inside their lane/group unless Shift is held while dragging.
	      const stayInGroup = (part: go.Part, pt: go.Point, _gridpt: go.Point) => {
	        const grp = part.containingGroup;
	        if (!grp) return pt;
	        // If Shift is held at any point during this drag, remember that so mouse-up handlers
	        // can allow regrouping even if Shift is released just before drop.
	        const diagram = part.diagram;
	        if (diagram?.lastInput?.shift) {
	          (diagram as any).__dragAllowReparent = true;
	          const k = part.data?.key;
	          if (k != null) {
	            const s: Set<string> = ((diagram as any).__dragAllowReparentKeys ||= new Set<string>());
	            s.add(String(k));
	          }
	          return pt;
	        }
	        // When dragging a Pool or Lane, GoJS drags member nodes too. If we clamp member nodes while
	        // their container group is also moving, bounds can be temporarily stale and members will
	        // "drift" out of lanes after repeated group moves. Skip clamping when any ancestor Group
	        // is in the current selection (i.e., is being dragged).
	        if (diagram) {
	          let g: go.Group | null = grp;
	          while (g) {
	            if (diagram.selection.contains(g)) return pt;
            g = g.containingGroup;
          }
        }
        const back =
          grp.findObject("LANE_BODY_SHAPE") ||
          grp.findObject("BODY") ||
          grp.resizeObject;
        if (!back) return pt;
        const r = back.getDocumentBounds();
        const b = part.actualBounds;
        const loc = part.location;
        const x = Math.max(r.x + 2, Math.min(pt.x, r.right - b.width - 2)) + (loc.x - b.x);
        const y = Math.max(r.y + 2, Math.min(pt.y, r.bottom - b.height - 2)) + (loc.y - b.y);
        return new go.Point(x, y);
      };

      // Define link template map
      var linkTemplateMap = new go.Map<string, go.Link>();
      uit.addLinkTemplates(linkTemplateMap, linkContextMenu, myMetis);

      // This template shows links connecting with label nodes as green and arrow-less.
      if (linkToLink) {
        myDiagram.linkTemplateMap.add("linkToLink",
          $("Link",
            { relinkableFrom: false, relinkableTo: false },
            $("Shape", { stroke: "#2D9945", strokeWidth: 2.0 })
          ));
      }

      // Define group template map
      var groupTemplateMap = new go.Map<string, go.Part>();
      uit.addGroupTemplates(groupTemplateMap, partContextMenu, portContextMenu, myMetis);

      // Define node template map
      var nodeTemplateMap = new go.Map<string, go.Part>();
      uit.addNodeTemplates(nodeTemplateMap, partContextMenu, portContextMenu, myMetis);
      nodeTemplateMap.add("LinkLabel",
        $("Node",
          {
            selectable: false, avoidable: false,
            layerName: "Foreground"
          },  // always have link label nodes in front of Links
          $("Shape", "Ellipse",
            {
              width: 5, height: 5, stroke: null,
              portId: "", fromLinkable: true, toLinkable: false, cursor: "pointer"
            })
        ));

      for (let it = nodeTemplateMap.iterator; it.next();) {
        const key = String(it.key || "");
        const part = it.value;
        if (!(part instanceof go.Node)) continue;
        if (key === "LinkLabel") continue;
        part.dragComputation = stayInGroup;
      }

      // Set the diagram template maps
      myDiagram.nodeTemplateMap = nodeTemplateMap;
      myDiagram.linkTemplateMap = linkTemplateMap;
      myDiagram.groupTemplateMap = groupTemplateMap;
    }

    // Whenever a new Link is drawn by the LinkingTool, it also adds a node data object
    // that acts as the label node for the link, to allow links to be drawn to/from the link.
    if (linkToLink) { // Set to true if LinkToLink
      myDiagram.toolManager.linkingTool.archetypeLabelNodeData =
        { category: "LinkLabel" };
    }

    // Palette group template 1
    {
      var paletteGroupTemplate1 =
        $(go.Group, "Auto",
          // for sorting, have the Node.text be the data.name
          new go.Binding("text", "name"),

          // define the node's outer shape
          $(go.Shape, "Rectangle",
            {
              name: "SHAPE", fill: "lightyellow",
              // opacity: 0.7,
              //desiredSize: new go.Size(100, 20),
              //margin: new go.Margin(100, 0, 0, 0),
            },
          ),

          $(go.Panel, "Vertical",
            // define the panel where the text will appear
            $(go.Panel, "Table",
              {
                defaultRowSeparatorStroke: "black",
                maxSize: new go.Size(150, 999),
                margin: new go.Margin(6, 10, 0, 3),
                defaultAlignment: go.Spot.Left
              },
              $(go.RowColumnDefinition, { column: 2, width: 4 }
              ),
              // content
              $(go.TextBlock, uit.textStyle(),  // the name
                {
                  row: 0, column: 0, columnSpan: 6,
                  font: "12pt Segoe UI,sans-serif",
                  editable: true, isMultiline: false,
                  minSize: new go.Size(10, 16),
                  name: "name"
                },
                new go.Binding("text", "name").makeTwoWay()),
            ),
          )
        );
    }

    function addSourceNode(mySourceNodes: any, n: any) {
      for (let i = 0; i < mySourceNodes.length; i++) {
        if (mySourceNodes[i].key === n.data.key) {
          return;
        }
      }
      const mySourceNode = {
        "key": n.data.key,
        "name": n.data.name,
        "objid": n.data.objRef,
        "objviewid": n.data.key,
        "group": n.data.group,  // ????
        "isGroup": n.data.isGroup, // ????
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
      mySourceNodes.push(mySourceNode);
      if (n.data.isGroup) {
        for (let it2 = n.memberParts.iterator; it2?.next();) {
          let n2 = it2.value;
          if (!(n2 instanceof go.Node)) continue;
          if (n2) {
            addSourceNode(mySourceNodes, n2);
          }
        }
      }
    }
    function getSourceNode(mySourceNodes: any, key: string) {
      for (let i = 0; i < mySourceNodes.length; i++) {
        if (mySourceNodes[i].key === key) {
          return mySourceNodes[i];
        }
      }
      return null;
    }

    function addSourceLink(mySourceLinks: any, l: any) {
      const mySourceLink = {
        "key": l.data.key,
        "from": l.data.from,
        "to": l.data.to,
        "type": l.data.type,
        "name": l.data.name,
        "relid": l.data.relshipRef,
        "relviewid": l.data.relviewRef,
        "scale": new String(l.scale),
        "template": l.data.template,
        "strokecolor": l.data.strokecolor,
        "strokewidth": l.data.strokewidth,
        "textcolor": l.data.textcolor,
        "strokewidth": l.data.strokewidth,
        "textscale": l.data.textscale,
        "arrowscale": l.data.arrowscale,
        "fromArrow": l.data.fromArrow,
        "toArrow": l.data.toArrow,
        "fromArrowColor": l.data.fromArrowColor,
        "toArrowColor": l.data.toArrowColor,
        "dash": l.data.dash,
        "routing": l.data.routing,
        "corner": l.data.corner,
        "curve": l.data.curve,
        "points": l.data.points,
      }
      mySourceLinks.push(mySourceLink);
    }
    function getSourceLink(mySourceLinks: any, key: string) {
      for (let i = 0; i < mySourceLinks.length; i++) {
        if (mySourceLinks[i].key === key) {
          return mySourceLinks[i];
        }
      }
      return null;
    }

    function setLayout(myDiagram, layout) {
      switch (layout) {
        case 'Circular':
          myDiagram.layout = $(go.CircularLayout);
          break;
        case 'Grid':
          myDiagram.layout = $(go.GridLayout);
          break;
        case 'Tree':
          myDiagram.layout = $(go.TreeLayout);
          break;
        case 'ForceDirected':
          myDiagram.layout = $(go.ForceDirectedLayout);
          break;
        case 'LayeredDigraph':
          myDiagram.layout = $(go.LayeredDigraphLayout);
          break;
        case 'Manual':
          myDiagram.layout.isInitial = false;
          myDiagram.layout.isOngoing = false;
          break;
      }
      myDiagram.layoutDiagram();
    }

    function clearInstance(inst: any) {

    }

    // this DiagramEvent handler is called during the linking or relinking transactions
    function maybeChangeLinkCategory(e: any) {
      let link = e.subject;
      let linktolink = (link.fromNode?.isLinkLabel || link.toNode?.isLinkLabel);
      e.diagram.model.setCategoryForLinkData(link.data, (linktolink ? "linkToLink" : ""));
    }

    function makeButton(text: string, action: any, visiblePredicate: any) {
      if (typeof action !== "function") action = () => {};
      return $("ContextMenuButton",
        $(go.TextBlock, text),
        { click: action },
        // don't bother with binding GraphObject.visible if there's no predicate
        visiblePredicate ? new go.Binding("visible", "",
          function (o, e) {
            return o.diagram ? visiblePredicate(o, e) : false;
          }).ofObject() : {}
      );
    }
    return myDiagram;

  }

  exportSvg = () => {
    return new Promise((resolve) => {
      const diagram = this.diagramRef.current.getDiagram();
      // console.log('3259 exportSvg: ', diagram);
      if (diagram) {
        const svg = diagram.makeSvg({ scale: 0.7 });
        // console.log('3266 svg: ', svg);
        resolve(svg);
      } else {
        resolve(null);
      }
    });
  };

  public render() {
    // Implements handleOpenModal (property dialogs)
    let useTabs = true;
    let selObj = this.state.selectedData;
    const myMetis = this.myMetis;
    const myModel = myMetis.currentModel;
    const myMetamodel = myModel.metamodel;
    let modalContent, header, category, typename;
    const modalContext = this.state.modalContext;
    if (selObj)
      selObj = myMetis.removeClassInstances(selObj);
    let selpropgroup = [{ tabName: 'Default' }];

    if (modalContext?.what === 'editObject') {
      let includeInherited = false;
      let includeConnected = false;
      let objRef = this.state.selectedData?.objRef;
      let obj1 = this.myMetis.findObject(objRef);
      let objtypeRef = this.state.selectedData?.objtypeRef;
      let objtype = myMetamodel.findObjectType(objtypeRef);
      let supertypes = modalContext.myContext.supertypes;
      // if (!obj1) obj1 = obj;
      if (objtype?.name === 'Method')
        useTabs = true;
      if (obj1?.hasInheritedProperties(myModel)) {
        includeInherited = true;
        useTabs = true;
      }
      const connectedObjects = obj1?.getConnectedObjects2(myMetis);
      if (connectedObjects?.length > 0) {
        includeConnected = true;
        useTabs = true;
      }
      const context = {
        myMetis: myMetis,
        myModel: myModel,
        myMetamodel: myMetamodel,
        objtype: objtype,
        supertypes: supertypes,
        includeConnected: includeConnected,
        includeInherited: includeInherited,
      }
      let namelist = useTabs ? uic.getNameList(obj1, context, true) : [];
      const connectedRoles = obj1?.getConnectedObjectRoles(myMetis);
      // Define the tabs
      selpropgroup = [];
      for (let i = 0; i < namelist?.length; i++) {
        let name = namelist[i];
        if (name === constants.types.AKM_ELEMENT)
          continue; // name = 'Default';
        if (connectedRoles && connectedRoles.length > 0) {
          if (i > 0) {
            let role = connectedRoles[i - 1];
            if (role) name = role;
          }
        }
        const proptab = { tabName: name };
        selpropgroup.push(proptab);
      }
    }
    if (modalContext?.what === 'editRelationship') {
      let includeInherited = false;
      let includeConnected = false;
      let key = this.state.selectedData?.relshipRef;
      if (!key) key = this.state.selectedData?.key;
      let rel = this.myMetis.findRelationship(key);
      if (rel?.hasInheritedProperties(myModel)) {
        includeInherited = true;
        useTabs = true;
      }
      const context = {
        myMetis: myMetis,
        myModel: myModel,
        myMetamodel: myMetamodel,
        includeConnected: includeConnected,
        includeInherited: includeInherited,
      }
      let namelist = useTabs ? uic.getNameList(rel, context, true) : [];
      // Define the tabs
      selpropgroup = [];
      for (let i = 0; i < namelist?.length; i++) {
        let name = namelist[i];

        const proptab = { tabName: name };
        selpropgroup.push(proptab);
      }
    }

    switch (modalContext?.what) {
      case 'selectDropdown':
        let options = '';
        let comps;
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
        if (modalContext?.title === 'Select Icon') {
          let img
          options = this.state.modalContext.iconList.map(icon => {
            img = (icon.value.includes('//')) ? icon.value : './../images/' + icon.value
            return { value: img, label: icon.label }
          })
          comps = { Option: CustomSelectOption, SingleValue: CustomSelectValue }
        }
        else if (modalContext?.title === 'Set Layout Scheme') {
          let layout, img;
          options = this.state.modalContext.layoutList.map(ll => {
            img = './../images/default.png'
            layout = ll.value
            return { value: layout, label: ll.label }
          })
          comps = { Option: CustomSelectOption, SingleValue: CustomSelectValue }
        }
        else if (modalContext?.title === 'Set Routing Scheme') {
          let routing, img;
          options = this.state.modalContext.routingList.map(rr => {
            img = './../images/default.png'
            routing = rr.value
            return { value: routing, label: rr.label }
          })
          comps = { Option: CustomSelectOption, SingleValue: CustomSelectValue }
        }
        else if (modalContext?.title === 'Set Link Curve') {
          let curve, img;
          options = this.state.modalContext.curveList.map(cc => {
            img = './../images/default.png'
            curve = cc.value
            return { value: curve, label: cc.label }
          })
          comps = { Option: CustomSelectOption, SingleValue: CustomSelectValue }
        }
        else if (modalContext?.title === 'Select Relationship Type') {
          const choices = this.state.modalContext.args.typeNames;
          let img;
          options = choices.map(tpname => {
            img = './../images/default.png';
            return { value: tpname, label: tpname }
          })
          comps = { Option: CustomSelectOption, SingleValue: CustomSelectValue }
        }
        else {
          options = this.state.selectedData.map(o => o && { 'label': o, 'value': o });
          comps = null
        }
        const { selectedOption } = this.state;
        const value = (selectedOption) ? selectedOption.value : options[0]
        header = modalContext.title;
        modalContent = //(
        //   <Select
        //     value={selectedOption}
        //     onChange={this.handleChange}
        //     options={options}
        //     components={{ Option: CustomSelectOption, SingleValue: CustomSelectValue }}
        //   />
        // );
          <div className="modal-selection d-flex justify-content-center">
            <Select className="modal-select"
              options={options}
              components={comps}
              onChange={value => this.handleSelectDropdownChange(value)}
            // value={value}
            />
          </div>
        {/* <option value={option.value}>{label: option.label, option.value}</option>
          */}

        break;
      case 'editObjectType':
      case 'editObject':
      case 'editObjectview':
        header = modalContext.title;
        category = selObj.category;
        if (selObj !== null && this.myMetis != null) {
          modalContent =
            <div className="modal-prop">
              <SelectionInspector
                myMetis={myMetis}
                selectedData={this.state.selectedData}
                context={this.state.modalContext}
                onInputChange={this.handleInputChange}
                activeTab={this.state.currentActiveTab}
              />
            </div>
        }
        break;
      case 'editRelationshipType':
      case 'editRelationship':
      case 'editRelshipview':
      case 'editTypeview': {
        header = modalContext.title + ':';
        category = this.state.selectedData.category;
        typename = (modalContext.typename) ? '(' + modalContext.typename + ')' : '(' + this.state.selectedData.name + ')'
        if (this.state.selectedData !== null && this.myMetis != null) {
          modalContent =
            <div className="modal-prop" >
              <SelectionInspector
                myMetis={myMetis}
                selectedData={this.state.selectedData}
                context={this.state.modalContext}
                onInputChange={this.handleInputChange}
                activeTab={this.state.currentActiveTab}
              />
            </div>
        }
        break;
      }
      default:
        break;
    }

    //----------------------------------------------------------------------------


    //toggle active state for Tab
    const toggle = tab => {
      if (this.state.currentActiveTab !== tab) this.setState({ currentActiveTab: tab });
    }

    const navitemDiv = (!selpropgroup) ? <></> : selpropgroup.map((pg, index) => {
      if (pg) {
        const tabName = pg?.tabName;
        const strindex = index.toString()
        const activeTab = (this.state.currentActiveTab === strindex) ? 'active' : ''
        return (
          <NavItem key={strindex}>
            <NavLink
              className={classnames({ active: this.state.currentActiveTab === strindex })}
              onClick={() => { toggle(strindex) }}
            >
              {tabName}
            </NavLink>
          </NavItem>
        )
      }
    })

    const toolTip = (!selpropgroup) && <div className="btn-sm bg-light text-black py-0 mt-2 ml-3" data-toggle="tooltip" data-placement="top" data-bs-html="true"
      title="Select tab to see different group of properties.">i
    </div>

    const modaltabsContent =
      <>
        <Nav tabs >
          {navitemDiv}
          {/* <NavItem > {toolTip} </NavItem> */}
        </Nav>
        <TabContent activeTab={this.state.currentActiveTab} >
          <TabPane tabId={this.state.currentActiveTab} >
            <div className="bg-white mt-0 p-1 pt-2">
              {modalContent}
            </div>
          </TabPane>
        </TabContent>
      </>
    // console.log('4157 Diagram render: ', this.props.nodeDataArray, this.props.linkDataArray, this.props.modelData);
    return (
      <div>
        <ReactDiagram
          ref={this.diagramRef}
          divClassName='diagram-component'
          initDiagram={this.initDiagram}
          nodeDataArray={this.props.nodeDataArray}
          linkDataArray={this.props.linkDataArray}
          modelData={this.props.modelData}
          // myMetis={this.props.myMetis}
          // modelType={this.props.modelType}
          onModelChange={this.props.onModelChange}
          skipsDiagramUpdate={this.props.skipsDiagramUpdate}
          style={this.props.diagramStyle}
        // exportToSvg={this.props.exportToSvg}
        />
        {/* <button onClick={exportToSvg}>Export to SVG</button> */}

        <Modal isOpen={this.state.showModal}  >
          {/* <div className="modal-dialog w-100 mt-5"> */}
          <div className="modal-content">
            <div className="modal-head px-2 ">
              <div className="d-flex p-1 ">
                <span className="text-secondary w-100 pt-1">{header}:</span>
                <span className="ml-auto ">
                  <Button className="modal-button btn-sm" onClick={() => { this.handleCloseModal('x') }}>x</Button>
                </span>
              </div>
              <ModalHeader className="modal-header" >
                <span className="modal-name ml-2" >{this.state.selectedData?.name} </span>
                <span className="modal-objecttype"> {(this.state.selectedData?.objecttype?.name)
                  ? `(${this.state.selectedData?.objecttype?.name})`
                  : (this.state.selectedData?.relshiptype?.name)
                    ? `(${this.state.selectedData?.relshiptype?.name})`
                    : ''
                }
                </span>
              </ModalHeader>
            </div>
            <ModalBody className="modal-body w-100">
              {/* <div className="modal-body1"> */}
              {/* <div className="modal-pict"><img className="modal-image" src={icon}></img></div> */}
              {/* {modalContent} */}
              {modaltabsContent}
              {/* </div> */}
            </ModalBody>
            <ModalFooter className="modal-footer">
              <Button className="modal-button bg-link m-0 p-0" color="link" onClick={() => { this.handleCloseModal() }}>Done</Button>
            </ModalFooter>
          </div>
          {/* </div> */}
        </Modal>
        <style jsx>{`        
      `}
        </style>
      </div>
    );
  }
}
