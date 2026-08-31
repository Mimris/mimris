// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as go from 'gojs';
import { produce } from 'immer';
import { ReactDiagram } from 'gojs-react';
import React, { useEffect } from 'react';
import Select, { components } from "react-select"
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Button as UiButton } from '../../ui/button';
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
import { applyDropLayout, deriveDropLayoutConfig } from '../layout/DropLayoutManager';
import { GuidedDraggingTool } from '../GuidedDraggingTool';
import LoadLocal from '../../../components/LoadLocal'
// import * as svgs from '../../utils/SvgLetters'
// import svgs from '../../utils/Svgs'
import { iconList, imageLibrary } from '../../forms/selectIcons';
import ChangeIconModal from '../../modals/ChangeIconModal';
import ChangeImageModal from '../../modals/ChangeImageModal';
// import { stringify } from 'querystring';
// import './Diagram.css';
// import "../../../styles/styles.css"
// import "../BalloonLink.js";
import Toggle from '../../utils/Toggle';
import { i } from '../../utils/SvgLetters';
import { bindLegacyUniverseDispatch, dispatchUniversePhData } from '../../../sharedUniverse';
import {
  buildGenerationProvenance,
  createGeneratedMetamodelProject,
  generatedProjectFileName,
  inspectGeneratedProjectTarget,
  updateGeneratedMetamodelProject,
} from '../../utils/generatedMetamodelProject';

const linkToLink = false;
const AllowTopLevel = true;

function installSafeNodeCategoryGuard() {
  const proto: any = go.GraphLinksModel && (go.GraphLinksModel as any).prototype;
  if (!proto || proto.__safeNodeCategoryGuardInstalled) return;
  const original = proto.setCategoryForNodeData;
  if (typeof original !== 'function') return;
  proto.setCategoryForNodeData = function (data: any, cat: any) {
    const safeCategory =
      typeof cat === 'string' && cat.length > 0
        ? cat
        : (typeof data?.template === 'string' && data.template.length > 0
            ? data.template
            : (typeof data?.category === 'string' && data.category.length > 0
                ? data.category
                : constants.gojs.C_NODETEMPLATE));
    return original.call(this, data, safeCategory);
  };
  proto.__safeNodeCategoryGuardInstalled = true;
}

function installSafeLinkCategoryGuard() {
  const proto: any = go.GraphLinksModel && (go.GraphLinksModel as any).prototype;
  if (!proto || proto.__safeLinkCategoryGuardInstalled) return;
  const original = proto.setCategoryForLinkData;
  if (typeof original !== 'function') return;
  proto.setCategoryForLinkData = function (data: any, cat: any) {
    const safeCategory =
      typeof cat === 'string' && cat.length > 0
        ? cat
        : (typeof data?.template === 'string' && data.template.length > 0
            ? data.template
            : (typeof data?.category === 'string' && data.category.length > 0
                ? data.category
                : constants.gojs.C_LINKEMPLATE));
    return original.call(this, data, safeCategory);
  };
  proto.__safeLinkCategoryGuardInstalled = true;
}

installSafeNodeCategoryGuard();
installSafeLinkCategoryGuard();

function isBooleanLikeKey(key: string): boolean {
  return /^(is[A-Z_]|has[A-Z_]|can[A-Z_]|allow[A-Z_]|show[A-Z_]|include[A-Z_])/.test(key) ||
    key === "visible" ||
    key === "readOnly" ||
    key === "markedAsDeleted" ||
    key === "selectable" ||
    key === "deletable" ||
    key === "reshapable" ||
    key === "resegmentable" ||
    key === "relinkableFrom" ||
    key === "relinkableTo" ||
    key === "avoidable" ||
    key === "shadowVisible";
}

function normalizeEmptyBooleanFieldsInPlace(value: any, seen = new WeakSet<object>()): any {
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item) => normalizeEmptyBooleanFieldsInPlace(item, seen));
    return value;
  }
  Object.keys(value).forEach((key) => {
    const current = value[key];
    if (isBooleanLikeKey(key) && (current === "" || current === null)) {
      value[key] = false;
      return;
    }
    if (current && typeof current === "object") {
      normalizeEmptyBooleanFieldsInPlace(current, seen);
    }
  });
  return value;
}

function normalizeDiagramNodeCategoryData(nodeDataArray: any[] | undefined): any[] {
  if (!Array.isArray(nodeDataArray)) return nodeDataArray as any;
  return nodeDataArray.map((node) => {
    if (!node || typeof node !== 'object') return node;
    normalizeEmptyBooleanFieldsInPlace(node);
    const category = node.category || node.template || constants.gojs.C_NODETEMPLATE;
    if (typeof category === 'string' && category.length > 0 && node.category === category) {
      return node;
    }
    return {
      ...node,
      category,
    };
  });
}

function getDiagramNodeAliases(data: any): string[] {
  if (!data || typeof data !== 'object') return [];
  const aliases = [
    data?.key,
    data?.objviewRef,
    data?.objectview?.id,
    data?.objRef,
    data?.object?.id,
    data?.__dragSessionToken,
  ]
    .filter((v: any) => v !== undefined && v !== null && String(v).length > 0)
    .map((v: any) => String(v));
  return Array.from(new Set(aliases));
}

function mergeIncomingDiagramNodeDataWithLiveState(
  incomingNodes: any[] | undefined,
  diagram: go.Diagram | null | undefined,
): any[] {
  if (!Array.isArray(incomingNodes) || !(diagram instanceof go.Diagram)) return incomingNodes as any;

  const liveNodeByAlias = new Map<string, go.Node>();
  const liveNodes: go.Node[] = [];
  for (let it = diagram.nodes.iterator; it?.next();) {
    const node = it.value as go.Node;
    liveNodes.push(node);
    const aliases = getDiagramNodeAliases(node?.data);
    aliases.forEach((alias) => liveNodeByAlias.set(alias, node));
  }

  const incomingAliases = new Set<string>();
  const mergedNodes = incomingNodes.map((incoming: any) => {
    if (!incoming || typeof incoming !== 'object') return incoming;
    const aliases = getDiagramNodeAliases(incoming);
    aliases.forEach((alias) => incomingAliases.add(alias));
    if (aliases.length === 0) return incoming;

    let liveNode: go.Node | undefined;
    for (let i = 0; i < aliases.length; i++) {
      const candidate = liveNodeByAlias.get(aliases[i]);
      if (candidate instanceof go.Node) {
        liveNode = candidate;
        break;
      }
    }
    if (!(liveNode instanceof go.Node)) return incoming;

    const liveData: any = liveNode.data || {};
    const liveLoc = `${liveNode.location.x} ${liveNode.location.y}`;
    const nextGroup = liveData?.group ?? incoming.group;
    const nextScale = liveData?.scale ?? incoming.scale;
    const nextScale1 = liveData?.scale1 ?? incoming.scale1;
    const nextIcon = liveData?.icon ?? incoming.icon;

    if (
      String(incoming.loc || '') === String(liveLoc || '') &&
      String(incoming.group ?? '') === String(nextGroup ?? '') &&
      Number(incoming.scale ?? 1) === Number(nextScale ?? 1) &&
      Number(incoming.scale1 ?? 1) === Number(nextScale1 ?? 1) &&
      incoming.icon === nextIcon
    ) {
      return incoming;
    }

    return {
      ...incoming,
      loc: liveLoc,
      group: nextGroup,
      scale: nextScale,
      scale1: nextScale1,
      icon: nextIcon,
    };
  });
  liveNodes.forEach((node) => {
    const liveData = node?.data;
    if (!liveData || typeof liveData !== 'object') return;
    const aliases = getDiagramNodeAliases(liveData);
    if (aliases.length === 0) return;
    if (aliases.some((alias) => incomingAliases.has(alias))) return;
    if (liveData.category !== constants.gojs.C_OBJECT && !liveData.objectview && !liveData.objviewRef) return;
    mergedNodes.push(liveData);
  });
  return mergedNodes;
}

function normalizeLiveLinkPoints(points: any): number[] | undefined {
  if (!points) return undefined;
  if (Array.isArray(points)) {
    if (points.length >= 4) return [...points];
    return undefined;
  }
  const arr: number[] = [];
  try {
    const it = points?.iterator;
    while (it?.next()) {
      const p = it.value;
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
        arr.push(Number(p.x), Number(p.y));
      }
    }
  } catch (_) {
  }
  return arr.length >= 4 ? arr : undefined;
}

function mergeIncomingDiagramLinkDataWithLiveState(
  incomingLinks: any[] | undefined,
  diagram: go.Diagram | null | undefined,
): any[] {
  if (!Array.isArray(incomingLinks) || !(diagram instanceof go.Diagram)) return incomingLinks as any;

  const liveByKey = new Map<string, go.Link>();
  for (let it = diagram.links.iterator; it?.next();) {
    const link = it.value as go.Link;
    const ids = [
      link?.data?.key,
      link?.key,
      link?.data?.relviewRef,
      link?.data?.relshipview?.id,
    ]
      .filter((v: any) => v !== undefined && v !== null && String(v).length > 0)
      .map((v: any) => String(v));
    ids.forEach((id) => liveByKey.set(id, link));
  }

  return incomingLinks.map((incoming: any) => {
    if (!incoming || typeof incoming !== 'object') return incoming;
    const ids = [
      incoming?.key,
      incoming?.relviewRef,
      incoming?.relshipview?.id,
    ]
      .filter((v: any) => v !== undefined && v !== null && String(v).length > 0)
      .map((v: any) => String(v));
    if (ids.length === 0) return incoming;

    let liveLink: go.Link | undefined;
    for (let i = 0; i < ids.length; i++) {
      const candidate = liveByKey.get(ids[i]);
      if (candidate instanceof go.Link) {
        liveLink = candidate;
        break;
      }
    }
    if (!(liveLink instanceof go.Link) || !liveLink.data) return incoming;

    const liveData: any = liveLink.data || {};
    const livePoints = normalizeLiveLinkPoints(liveLink.points) || normalizeLiveLinkPoints(liveData?.points);
    const nextFrom = liveData?.from ?? incoming.from;
    const nextTo = liveData?.to ?? incoming.to;
    const nextFromPort = liveData?.fromPort ?? incoming.fromPort;
    const nextToPort = liveData?.toPort ?? incoming.toPort;
    const nextRouting = liveData?.routing ?? incoming.routing;

    return {
      ...incoming,
      from: nextFrom,
      to: nextTo,
      fromPort: nextFromPort,
      toPort: nextToPort,
      routing: nextRouting,
      points: livePoints ?? incoming.points,
    };
  });
}

interface DiagramProps {
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
  selectedData: any;
  modelType: string;
  myMetis: akm.cxMetis;
  dispatch: any;
  phFocus?: any;
  skipsDiagramUpdate: boolean;
  onDiagramEvent: (e: go.DiagramEvent) => void;
  onModelChange: (e: go.IncrementalData) => void;
  diagramStyle: React.CSSProperties;
  onExportSvgReady: any;
  onOpenSelectConnectedObjects?: (payload: { diagram: go.Diagram; part: go.Part; relOptions?: Array<string | { value: string; label: string }>; reltypeOptions?: string[] }) => void;
}

interface DiagramState {
  myMetis: akm.cxMetis,
  showModal: boolean;
  showChangeIconModal: boolean;
  showChangeImageModal: boolean;
  selectedData: any;
  modalContext: any;
  selectedOption: any;
  currentActiveTab: any;
  // onExportSvgReady: any;
  selectConnectedDialogOpen?: boolean;
  selectConnectedLevels?: string;
  selectConnectedReltypes?: string;
  selectConnectedReldir?: string;
  selectConnectedReltypeOptions?: string[];
  selectConnectedIncludeAllRels?: boolean;
  selectConnectedCreateMissingViews?: boolean;
  pendingSelectContext?: { part: go.Part; diagram: go.Diagram } | null;
  selectConnectedRelOptions?: Array<string | { value: string; label: string }>;
  selectConnectedRelChoice?: string | string[];
  addConnectedDialogOpen?: boolean;
  addConnectedLevels?: string;
  addConnectedReltypes?: string;
  addConnectedReldir?: string;
  addConnectedReltypeOptions?: string[];
  addConnectedIncludeAllRels?: boolean;
  pendingAddContext?: { part: go.Part; diagram: go.Diagram } | null;
  addConnectedRelOptions?: string[];
  addConnectedRelChoice?: string | string[];
}



export class DiagramWrapper extends React.Component<DiagramProps, DiagramState> {
  // Maps to store key -> arr index for quick lookups
  private mapNodeKeyIdx: Map<go.Key, number>;
  private mapLinkKeyIdx: Map<go.Key, number>;
  private persistReshapedLinkPoints: (e: go.DiagramEvent) => void;

  /**
   * Ref to keep a reference to the Diagram component, which provides access to the GoJS diagram via getDiagram().
   */
  private diagramRef: React.RefObject<ReactDiagram>;
  private myMetis: akm.cxMetis;
  private myGoModel: gjs.goModel;
  private myGoMetamodel: gjs.goModel;

  /** @internal */
  constructor(props: DiagramProps) {
    super(props);
    this.myMetis = props.myMetis;
    this.myMetis.modelType = props.modelType;
    this.myMetis.dispatch = props.dispatch;
    this.diagramRef = React.createRef();
    this.state = {
      // myMetis: props.myMetis,
      nodeDataArray: this.props.nodeDataArray,
      linkDataArray: this.props.linkDataArray,
      showModal: false,
      showChangeIconModal: false,
      showChangeImageModal: false,
      selectedData: null,
      modalContext: null,
      selectedOption: null,
      currentActiveTab: null,
      diagramStyle: props.diagramStyle,
      onExportSvgReady: props.onExportSvgReady,
      selectConnectedDialogOpen: false,
      selectConnectedLevels: '3',
      selectConnectedReltypes: 'All',
      selectConnectedReldir: 'All',
      selectConnectedReltypeOptions: ['All'],
      selectConnectedIncludeAllRels: false,
      selectConnectedCreateMissingViews: false,
      pendingSelectContext: null,
      selectConnectedRelOptions: ['All'],
      selectConnectedRelChoice: ['All'],
      addConnectedDialogOpen: false,
      addConnectedLevels: '3',
      addConnectedReltypes: 'All',
      addConnectedReldir: 'All',
      addConnectedReltypeOptions: ['All'],
      addConnectedIncludeAllRels: false,
      pendingAddContext: null,
      addConnectedRelOptions: ['All'],
      addConnectedRelChoice: ['All']
    };
    this.persistReshapedLinkPoints = (e: go.DiagramEvent) => {
      const diagram = e.diagram;
      const link = e.subject as go.Link;
      const linkData: any = link?.data;
      if (!(diagram instanceof go.Diagram) || !(link instanceof go.Link) || !linkData) return;
      const relview =
        this.myMetis.findRelationshipView(linkData?.relviewRef || linkData?.key) ||
        linkData?.relshipview ||
        null;
      if (!relview) return;
      const points: number[] = [];
      try {
        for (let it = link.points.iterator; it?.next();) {
          const point = it.value;
          points.push(point.x, point.y);
        }
      } catch (_) {
        return;
      }
      relview.points = points;
      try { if (linkData?.relshipview) linkData.relshipview.points = points; } catch (_) {}
      try { if (linkData?.relshipview && linkData.relshipview.id !== relview.id) linkData.relshipview = relview; } catch (_) {}
      try {
        const goModel: any = (this as any)?.myGoModel || this.myMetis?.gojsModel;
        const goLink: any = goModel?.findLink?.(linkData?.key);
        if (goLink) {
          goLink.points = points;
          goLink.relshipview = relview;
          goLink.relviewRef = relview.id;
          if (goLink.data) {
            goLink.data.points = points;
            goLink.data.relshipview = relview;
            goLink.data.relviewRef = relview.id;
          }
        }
      } catch (_) {}
      const shouldFreezeManualRoute =
        Array.isArray(points) &&
        points.length >= 4 &&
        (String(relview?.routing || linkData?.routing || "").trim() === "Orthogonal" ||
         String(relview?.routing || linkData?.routing || "").trim() === "AvoidsNodes");
      if (shouldFreezeManualRoute) {
        const preservedRouting = String(relview?.routing || linkData?.routing || "").trim() || "Orthogonal";
        relview.routing = preservedRouting;
        try { diagram.model.setDataProperty(linkData, "routing", preservedRouting); } catch (_) {
          try { linkData.routing = preservedRouting; } catch (_err) {}
        }
        try { link.routing = uit.getRouting(preservedRouting); } catch (_) {}
        try { link.adjusting = go.Link.End; } catch (_) {}
      }
      try { diagram.model.setDataProperty(linkData, "points", points); } catch (_) {
        try { linkData.points = points; } catch (_err) {}
      }
      try {
        const data = JSON.parse(JSON.stringify(new jsn.jsnRelshipView(relview)));
        diagram.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data });
      } catch (_) {}
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
  /**
   * Get the diagram reference and add any desired diagram listeners.
   * Typically the same function will be used for each listener, with the function using a switch statement to handle the events.
   */
  public componentDidMount() {
    if (!this.diagramRef.current) return;
    const diagram = this.diagramRef?.current?.getDiagram();
    this.myMetis.dispatch = this.props.dispatch;
    if (diagram instanceof go.Diagram) {
      const diagramAny: any = diagram as any;
      if (typeof diagramAny.layoutDiagram === 'function' && !diagramAny.__layoutGuardInstalled) {
        const originalLayoutDiagram = diagramAny.layoutDiagram.bind(diagramAny);
        diagramAny.__originalLayoutDiagram = originalLayoutDiagram;
        diagramAny.layoutDiagram = (force?: boolean) => {
          try {
            const suppressUntil = Number(diagramAny.__suppressAutoLayoutUntil || 0);
            if (suppressUntil > Date.now()) {
              return;
            }
          } catch (_) {
          }
          return originalLayoutDiagram(force);
        };
        diagramAny.__layoutGuardInstalled = true;
      }
      const modelAny: any = diagram.model as any;
      if (modelAny && typeof modelAny.setDataProperty === 'function' && !modelAny.__locWriteLockGuardInstalled) {
        const originalSetDataProperty = modelAny.setDataProperty.bind(modelAny);
        modelAny.__originalSetDataProperty = originalSetDataProperty;
        modelAny.setDataProperty = (data: any, propname: string, value: any) => {
          if (!data || typeof data !== 'object') {
            return data;
          }
          try {
            if (propname === 'loc' && data) {
              const lockMap: Map<string, { loc: string; until: number }> | undefined =
                (diagram as any).__lockMovedNodeLocByKey;
              if (lockMap instanceof Map && lockMap.size > 0) {
                const now = Date.now();
                const ids = [
                  data?.key,
                  data?.objviewRef,
                  data?.objectview?.id,
                  data?.__dragSessionToken,
                ].filter((v: any) => v !== undefined && v !== null && String(v).length > 0)
                  .map((v: any) => String(v));

                let lock: { loc: string; until: number } | undefined;
                ids.forEach((id) => {
                  const candidate = lockMap.get(id);
                  if (!candidate) return;
                  if (!lock || Number(candidate.until || 0) > Number(lock.until || 0)) lock = candidate;
                });

                if (lock && Number(lock.until || 0) > now) {
                  const incomingLoc = String(value || '');
                  const lockedLoc = String(lock.loc || '');
                  if (incomingLoc && lockedLoc && incomingLoc !== lockedLoc) {
                    return;
                  }
                } else {
                  ids.forEach((id) => {
                    const entry = lockMap.get(id);
                    if (entry && Number(entry.until || 0) <= now) lockMap.delete(id);
                  });
                }
              }
            }
          } catch (_) {
          }
          return originalSetDataProperty(data, propname, value);
        };
        modelAny.__locWriteLockGuardInstalled = true;
      }
      if (diagram.model?.modelData) {
        (diagram.model.modelData as any)._viewportScale = diagram.scale || 1;
      }
      diagram.addDiagramListener('TextEdited', this.props.onDiagramEvent);
      diagram.addDiagramListener('SelectionMoved', this.props.onDiagramEvent);
      diagram.addDiagramListener('SelectionCopied', this.props.onDiagramEvent);
      diagram.addDiagramListener('SelectionDeleting', this.props.onDiagramEvent);
      diagram.addDiagramListener('ExternalObjectsDropped', this.props.onDiagramEvent);
      diagram.addDiagramListener('InitialLayoutCompleted', this.props.onDiagramEvent);
      diagram.addDiagramListener('InitialLayoutCompleted', () => {
        this.updateFocusPeerHighlight(diagram);
      });
      diagram.addDiagramListener('LayoutCompleted', this.props.onDiagramEvent);
      diagram.addDiagramListener('LinkDrawn', this.props.onDiagramEvent);
      diagram.addDiagramListener('LinkRelinked', this.props.onDiagramEvent);
      diagram.addDiagramListener('LinkReshaped', this.props.onDiagramEvent);
      diagram.addDiagramListener('LinkReshaped', this.persistReshapedLinkPoints);
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
      diagram.addDiagramListener('ViewportBoundsChanged', this.refreshResizeAdornments);
      this.updateFocusPeerHighlight(diagram);
      
      // Add listener to force update emoji icons after model is loaded
      diagram.addDiagramListener('InitialLayoutCompleted', () => {
        console.log("Diagram InitialLayoutCompleted - forcing icon source update for emoji support");
        // Import and call the force update function
        try {
          const uit = require('../../../akmm/ui_templates');
          uit.forceUpdateAllIconSources(diagram);
        } catch (e) {
          console.error("Failed to force update icon sources:", e);
        }
      });

      diagram.addModelChangedListener(this.props.onModelChange);

      const diagramDiv = diagram.div;
      const diagramDoc = diagramDiv?.ownerDocument;
      const setPanCursor = () => {
        if (!diagram.div) return;
        diagram.div.style.cursor = (diagram as any).__spacePanDragging
          ? 'grabbing'
          : ((diagram as any).__spacePanActive ? 'grab' : '');
      };
      const isEditableTarget = (target: EventTarget | null) => {
        const element = target as HTMLElement | null;
        if (!element) return false;
        const tagName = element.tagName?.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return true;
        if ((element as any).isContentEditable) return true;
        if (typeof element.closest === 'function' && element.closest('[contenteditable="true"]')) return true;
        return false;
      };
      if (diagramDiv && diagramDoc) {
        const keydownHandler = (event: KeyboardEvent) => {
          if (event.code !== 'Space') return;
          if (isEditableTarget(event.target)) return;
          (diagram as any).__spacePanActive = true;
          setPanCursor();
          event.preventDefault();
          event.stopPropagation();
          try { event.stopImmediatePropagation(); } catch (_) { }
        };
        const keypressHandler = (event: KeyboardEvent) => {
          if (event.code !== 'Space') return;
          if (isEditableTarget(event.target)) return;
          event.preventDefault();
          event.stopPropagation();
          try { event.stopImmediatePropagation(); } catch (_) { }
        };
        const keyupHandler = (event: KeyboardEvent) => {
          if (event.code !== 'Space') return;
          if (isEditableTarget(event.target)) return;
          (diagram as any).__spacePanActive = false;
          (diagram as any).__spacePanDragging = false;
          setPanCursor();
          event.preventDefault();
          event.stopPropagation();
          try { event.stopImmediatePropagation(); } catch (_) { }
        };
        const pointerdownHandler = (event: PointerEvent) => {
          if (!(diagram as any).__spacePanActive) return;
          if (event.button !== 0) return;
          const scale = Number(diagram.scale || 1) || 1;
          (diagram as any).__spacePanDragging = true;
          (diagram as any).__spacePanStartClient = { x: event.clientX, y: event.clientY };
          (diagram as any).__spacePanStartPosition = new go.Point(diagram.position.x, diagram.position.y);
          (diagram as any).__spacePanStartScale = scale;
          setPanCursor();
          event.preventDefault();
          event.stopPropagation();
        };
        const pointermoveHandler = (event: PointerEvent) => {
          if (!(diagram as any).__spacePanDragging) return;
          const startClient = (diagram as any).__spacePanStartClient;
          const startPosition = (diagram as any).__spacePanStartPosition;
          const scale = Number((diagram as any).__spacePanStartScale || diagram.scale || 1) || 1;
          if (!startClient || !(startPosition instanceof go.Point)) return;
          const dx = (event.clientX - startClient.x) / scale;
          const dy = (event.clientY - startClient.y) / scale;
          diagram.position = new go.Point(startPosition.x - dx, startPosition.y - dy);
          event.preventDefault();
          event.stopPropagation();
        };
        const pointerupHandler = (event: PointerEvent) => {
          if (!(diagram as any).__spacePanDragging) return;
          (diagram as any).__spacePanDragging = false;
          (diagram as any).__spacePanSuppressClickUntil = Date.now() + 250;
          setPanCursor();
          event.preventDefault();
          event.stopPropagation();
        };
        const blurHandler = () => {
          (diagram as any).__spacePanActive = false;
          (diagram as any).__spacePanDragging = false;
          (diagram as any).__spacePanSuppressClickUntil = 0;
          setPanCursor();
        };
        (diagram as any).__spacePanKeydownHandler = keydownHandler;
        (diagram as any).__spacePanKeypressHandler = keypressHandler;
        (diagram as any).__spacePanKeyupHandler = keyupHandler;
        (diagram as any).__spacePanPointerdownHandler = pointerdownHandler;
        (diagram as any).__spacePanPointermoveHandler = pointermoveHandler;
        (diagram as any).__spacePanPointerupHandler = pointerupHandler;
        (diagram as any).__spacePanBlurHandler = blurHandler;
        try { diagramDoc.addEventListener('keydown', keydownHandler, true); } catch (_) { }
        try { diagramDoc.addEventListener('keypress', keypressHandler, true); } catch (_) { }
        try { diagramDoc.addEventListener('keyup', keyupHandler, true); } catch (_) { }
        try { diagramDiv.addEventListener('pointerdown', pointerdownHandler, true); } catch (_) { }
        try { diagramDoc.addEventListener('pointermove', pointermoveHandler, true); } catch (_) { }
        try { diagramDoc.addEventListener('pointerup', pointerupHandler, true); } catch (_) { }
        try { diagramDoc.defaultView?.addEventListener('blur', blurHandler); } catch (_) { }
      }

      if (this.props.onExportSvgReady) {
        this.props.onExportSvgReady(this.exportSvg, true); // Pass true to indicate that the diagram is ready
      }

    }
  }

  public componentDidUpdate(prevProps: DiagramProps) {
    if (
      prevProps.phFocus?.focusObject?.id !== this.props.phFocus?.focusObject?.id ||
      prevProps.phFocus?.focusObjectview?.id !== this.props.phFocus?.focusObjectview?.id ||
      prevProps.nodeDataArray !== this.props.nodeDataArray
    ) {
      this.updateFocusPeerHighlight();
    }
  }

  private updateFocusPeerHighlight(diagram?: go.Diagram) {
    const currentDiagram = diagram ?? this.diagramRef.current?.getDiagram();
    if (!(currentDiagram instanceof go.Diagram)) return;
    const focusObjectId = String(this.props?.phFocus?.focusObject?.id || '');
    for (let it = currentDiagram.nodes.iterator; it?.next();) {
      const node = it.value as go.Node;
      const data: any = node?.data || {};
      const objectId =
        data?.object?.id ||
        data?.objectview?.object?.id ||
        data?.objRef ||
        data?.objectRef ||
        '';
      const isPeer = Boolean(focusObjectId) && String(objectId) === focusObjectId;
      try {
        if (typeof currentDiagram.model?.setDataProperty === 'function') {
          currentDiagram.model.setDataProperty(data, 'isFocusPeer', isPeer);
        } else {
          data.isFocusPeer = isPeer;
        }
      } catch (_) { }
      try { node.updateTargetBindings(); } catch (_) { }
    }
    try { currentDiagram.requestUpdate(); } catch (_) { }
  }

  /**
   * Get the diagram reference and remove listeners that were added during mounting.
   */
  public componentWillUnmount() {
    if (!this.diagramRef.current) return;
    const diagram = this.diagramRef.current.getDiagram();
    if (diagram instanceof go.Diagram) {
      const diagramDiv = diagram.div;
      const diagramDoc = diagramDiv?.ownerDocument;
      const keydownHandler = (diagram as any).__spacePanKeydownHandler;
      const keypressHandler = (diagram as any).__spacePanKeypressHandler;
      const keyupHandler = (diagram as any).__spacePanKeyupHandler;
      const pointerdownHandler = (diagram as any).__spacePanPointerdownHandler;
      const pointermoveHandler = (diagram as any).__spacePanPointermoveHandler;
      const pointerupHandler = (diagram as any).__spacePanPointerupHandler;
      const blurHandler = (diagram as any).__spacePanBlurHandler;
      if (diagramDoc && keydownHandler) {
        try { diagramDoc.removeEventListener('keydown', keydownHandler, true); } catch (_) { }
      }
      if (diagramDoc && keypressHandler) {
        try { diagramDoc.removeEventListener('keypress', keypressHandler, true); } catch (_) { }
      }
      if (diagramDoc && keyupHandler) {
        try { diagramDoc.removeEventListener('keyup', keyupHandler, true); } catch (_) { }
      }
      if (diagramDiv && pointerdownHandler) {
        try { diagramDiv.removeEventListener('pointerdown', pointerdownHandler, true); } catch (_) { }
      }
      if (diagramDoc && pointermoveHandler) {
        try { diagramDoc.removeEventListener('pointermove', pointermoveHandler, true); } catch (_) { }
      }
      if (diagramDoc && pointerupHandler) {
        try { diagramDoc.removeEventListener('pointerup', pointerupHandler, true); } catch (_) { }
      }
      if (diagramDoc?.defaultView && blurHandler) {
        try { diagramDoc.defaultView.removeEventListener('blur', blurHandler); } catch (_) { }
      }
      diagram.removeDiagramListener('TextEdited', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionMoved', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionCopied', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionDeleting', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ExternalObjectsDropped', this.props.onDiagramEvent);
      diagram.removeDiagramListener('LinkDrawn', this.props.onDiagramEvent);
      diagram.removeDiagramListener('InitialLayoutCompleted', this.props.onDiagramEvent);
      diagram.removeDiagramListener('LinkRelinked', this.props.onDiagramEvent);
      diagram.removeDiagramListener('LinkReshaped', this.props.onDiagramEvent);
      diagram.removeDiagramListener('LinkReshaped', this.persistReshapedLinkPoints);
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
      diagram.removeDiagramListener('ViewportBoundsChanged', this.refreshResizeAdornments);

      diagram.removeChangedListener(this.props.onModelChange);

      const diagramAny: any = diagram as any;
      if (diagramAny?.__layoutGuardInstalled && typeof diagramAny.__originalLayoutDiagram === 'function') {
        diagramAny.layoutDiagram = diagramAny.__originalLayoutDiagram;
        delete diagramAny.__originalLayoutDiagram;
        delete diagramAny.__layoutGuardInstalled;
      }

      const modelAny: any = diagram.model as any;
      if (modelAny?.__locWriteLockGuardInstalled && typeof modelAny.__originalSetDataProperty === 'function') {
        modelAny.setDataProperty = modelAny.__originalSetDataProperty;
        delete modelAny.__originalSetDataProperty;
        delete modelAny.__locWriteLockGuardInstalled;
      }

      if (this.props.onExportSvgReady) {
        this.props.onExportSvgReady(null, false); // Pass false to indicate that the diagram is not ready
      }
    }
  }

  public handleOpenModal(node, modalContext) {
    // Is implemented in "render" at the bottom of this file
    const isChangeIconModal = modalContext?.case === 'Change Icon';
    const isSetGroupImageModal = modalContext?.case === 'Set Group Image';
    
    // CRITICAL: Store original data so we can revert if user cancels
    let originalData = null;
    if (node && node.category === 'Relationship') {
      const diagram = modalContext?.myDiagram || this.diagramRef.current?.getDiagram();
      if (diagram) {
        const link = diagram.findLinkForKey(node.key);
        if (link) {
          const data = link.data;
          originalData = {
            key: data.key,
            category: data.category,
            strokecolor: data.strokecolor,
            strokewidth: data.strokewidth,
            textcolor: data.textcolor,
            dash: data.dash,
            routing: data.routing,
            curve: data.curve,
          };
          console.log('[DIAGRAM-OPEN] Stored original link data for revert:', originalData);
        }
      }
    }
    
    this.setState({
      selectedData: node,
      modalContext: { ...modalContext, originalData }, // Store original data in modalContext
      selectedOption: null,
      showModal: !isChangeIconModal && !isSetGroupImageModal,
      showChangeIconModal: isChangeIconModal,
      showChangeImageModal: isSetGroupImageModal,
      currentActiveTab: '0'
    });
  }

  private refreshResizeAdornments = (e: go.DiagramEvent) => {
    const diagram = e.diagram;
    if (!(diagram instanceof go.Diagram)) return;
    const diagramScale = diagram.scale || 1;
    const modelData: any = diagram.model.modelData || {};
    if (modelData._viewportScale !== diagramScale) {
      if (typeof diagram.model.setDataProperty === 'function') {
        diagram.model.setDataProperty(modelData, '_viewportScale', diagramScale);
      } else {
        modelData._viewportScale = diagramScale;
      }
      diagram.model.updateTargetBindings(modelData);
      diagram.updateAllTargetBindings("scale");
    }
    diagram.parts.each((part: go.Part) => {
      if (part instanceof go.Node || part instanceof go.Group) {
        part.updateTargetBindings();
      }
    });
    diagram.selection.each((part: go.Part) => {
      part.updateAdornments();
    });
    this.updateZoomInvariantHandles(diagram);
    diagram.requestUpdate();
  }

  private updateZoomInvariantHandles = (diagram: go.Diagram) => {
    if (!(diagram instanceof go.Diagram)) return;
    const diagramScale = diagram.scale || 1;
    const setHandleSize = (obj: any, baseWidth?: number, baseHeight?: number) => {
      if (!obj) return;
      if (typeof baseWidth === 'number' && typeof baseHeight === 'number' && !obj._baseDesiredSize) {
        obj._baseDesiredSize = new go.Size(baseWidth, baseHeight);
      }
      const baseSize = obj._baseDesiredSize || obj.desiredSize;
      if (!baseSize) return;
      const width = Number(baseSize.width) || 0;
      const height = Number(baseSize.height) || 0;
      if (width <= 0 || height <= 0) return;
      obj._baseDesiredSize = new go.Size(width, height);
      obj.desiredSize = new go.Size(width / diagramScale, height / diagramScale);
    };
    const updateAdornmentHandles = (obj: any) => {
      if (!obj) return;
      if (obj instanceof go.Shape && obj.desiredSize) {
        setHandleSize(obj);
      }
      const elements = obj.elements;
      if (!elements) return;
      for (let i = 0; i < elements.count; i++) {
        updateAdornmentHandles(elements.elt(i));
      }
    };

    setHandleSize(diagram.toolManager.relinkingTool.fromHandleArchetype, 8, 8);
    setHandleSize(diagram.toolManager.relinkingTool.toHandleArchetype, 8, 8);
    setHandleSize(diagram.toolManager.linkReshapingTool.handleArchetype, 7, 7);

    diagram.selection.each((part: go.Part) => {
      if (!(part instanceof go.Link)) return;
      ['LinkReshaping', 'RelinkingFrom', 'RelinkingTo', 'Relinking', 'Selection'].forEach((name) => {
        try { part.removeAdornment(name); } catch (_) {}
      });
      try {
        const adornments: any = (part as any).adornments;
        if (adornments && typeof adornments.each === 'function') {
          adornments.each((adornment: go.Adornment) => {
            try { updateAdornmentHandles(adornment); } catch (_) {}
          });
        }
      } catch (_) {}
      ['LinkReshaping', 'RelinkingFrom', 'RelinkingTo', 'Relinking', 'Selection'].forEach((name) => {
        try {
          const adornment = part.findAdornment(name);
          if (adornment) updateAdornmentHandles(adornment);
        } catch (_) {}
      });
      try { part.updateAdornments(); } catch (_) {}
    });
  }

  public handleSelectDropdownChange = (selected) => {
    const myMetis = this.myMetis;
    const modalContext = this.state.modalContext;
    
    // Handle Change Icon directly here for immediate update
    if (modalContext?.case === 'Change Icon') {
      const currentNode = modalContext.currentNode || myMetis?.currentNode;
      const myDiagram = modalContext.myDiagram || myMetis?.myDiagram;
      const myModelview = myMetis?.currentModelview;
      
      if (!currentNode || !myDiagram) {
        console.warn('Change Icon: missing currentNode or myDiagram');
        return;
      }
      
      // Get the new icon value
      let newIcon = selected;
      if (typeof selected === 'object') {
        newIcon = selected?.value || selected?.label || selected?.icon;
      }
      
      if (!newIcon) {
        console.warn('Change Icon: no icon selected');
        return;
      }

      const liveNodePart =
        myDiagram?.findNodeForKey?.(currentNode?.key) ||
        myDiagram?.findPartForKey?.(currentNode?.key) ||
        null;
      const liveNodeData = liveNodePart?.data || currentNode;
      const goModelNode =
        myMetis?.gojsModel?.findNodeByViewId?.(liveNodeData?.objviewRef || liveNodeData?.key) ||
        myMetis?.gojsModel?.findNode?.(liveNodeData?.key) ||
        null;
      
      // Find the objectview
      let objview = null;
      if (liveNodeData?.key) {
        objview = myModelview?.findObjectView(liveNodeData.key);
      }
      if (!objview && liveNodeData?.objectview?.id) {
        objview = myMetis?.findObjectView(liveNodeData.objectview.id);
      }
      if (!objview && liveNodeData?.objviewRef) {
        objview = myMetis?.findObjectView(liveNodeData.objviewRef);
      }
      if (!objview) {
        objview = liveNodeData?.objectview || currentNode?.objectview;
      }
      
      // Start diagram transaction
      myDiagram.startTransaction('change-icon');
      
      // Update the node data in the GoJS model
      myDiagram.model.setDataProperty(liveNodeData, 'icon', newIcon);
      try { currentNode.icon = newIcon; } catch (_) {}
      try { liveNodeData.icon = newIcon; } catch (_) {}
      try { if (goModelNode) goModelNode.icon = newIcon; } catch (_) {}
      try { if (goModelNode?.data) goModelNode.data.icon = newIcon; } catch (_) {}
      
      // Update the embedded objectview if present
      try {
        if (liveNodeData?.objectview) {
          liveNodeData.objectview.icon = newIcon;
          myDiagram.model.setDataProperty(liveNodeData, 'objectview', liveNodeData.objectview);
        }
      } catch (_) {}
      try {
        if (liveNodePart?.objectview) {
          liveNodePart.objectview.icon = newIcon;
        }
      } catch (_) {}
      try {
        if (goModelNode?.objectview) {
          goModelNode.objectview.icon = newIcon;
        }
      } catch (_) {}
      
      // Update the actual objectview object
      if (objview) {
        objview.icon = newIcon;
        if (typeof objview.setModified === 'function') {
          objview.setModified();
        }
      }
      
      myDiagram.commitTransaction('change-icon');
      
      try { liveNodePart?.updateTargetBindings?.(); } catch (_) {}
      try { myDiagram.model.updateTargetBindings?.(liveNodeData); } catch (_) {}
      try {
        const picture = liveNodePart?.findObject?.('Picture');
        if (picture) picture.source = uit.getIconSource(newIcon);
      } catch (_) {}
      try {
        uit.forceUpdateAllIconSources?.(myDiagram);
      } catch (_) {}
      
      // Dispatch to Redux to persist the change
      if (objview) {
        const jsnObjview = new jsn.jsnObjectView(objview);
        let data = JSON.parse(JSON.stringify(jsnObjview));
        const dispatchFn = myDiagram.dispatch || myMetis?.dispatch || this.props.dispatch;
        if (dispatchFn) {
          dispatchFn({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
        }
      }
      
      // Request diagram update
      try { myDiagram.updateAllTargetBindings?.('icon'); } catch (_) {}
      try { myDiagram.updateAllTargetBindings?.(); } catch (_) {}
      myDiagram.requestUpdate();
      return;
    }
    
    // Handle Set Icon Colors directly here
    if (modalContext?.case === 'Set Icon Colors') {
      // This case is handled inline in the menu action, not through modal
      return;
    }
    
    // For all other cases, delegate to uim.handleSelectDropdownChange
    const context = {
      "myMetis": myMetis,
      "myMetamodel": myMetis.currentMetamodel,
      "myModel": myMetis.currentModel,
      "myModelview": myMetis.currentModelview,
      "myGoModel": myMetis.gojsModel,
      "myDiagram": myMetis.myDiagram,
      "modalContext": modalContext
    }
    uim.handleSelectDropdownChange(selected, context);
  }

  public handleAddPortsFieldChange = (field: string, value: any) => {
    this.setState((prevState: any) => {
      const modalContext = prevState.modalContext ? { ...prevState.modalContext } : null;
      if (!modalContext) return null;
      const addPorts = { ...(modalContext.addPorts || {}) };
      addPorts[field] = value;
      modalContext.addPorts = addPorts;
      return { modalContext };
    });
  }

  public handleAddPortsEntryChange = (entryKey: string, field: string, value: any) => {
    this.setState((prevState: any) => {
      const modalContext = prevState.modalContext ? { ...prevState.modalContext } : null;
      if (!modalContext) return null;
      const addPorts = { ...(modalContext.addPorts || {}) };
      const entries = Array.isArray(addPorts.entries) ? [...addPorts.entries] : [];
      const nextEntries = entries.map((entry: any) => {
        if (entry?.key !== entryKey) return entry;
        return { ...entry, [field]: value };
      });
      addPorts.entries = nextEntries;
      modalContext.addPorts = addPorts;
      return { modalContext };
    });
  }

  public handleEditPortNameFieldChange = (value: string) => {
    this.setState((prevState: any) => {
      const modalContext = prevState.modalContext ? { ...prevState.modalContext } : null;
      if (!modalContext) return null;
      const editPortName = { ...(modalContext.editPortName || {}) };
      editPortName.value = value;
      modalContext.editPortName = editPortName;
      return { modalContext };
    });
  }

  public handleEditPortNameSubmit = () => {
    const modalContext: any = this.state.modalContext;
    if (!modalContext) return;
    const myDiagram = modalContext.myDiagram || this.myMetis.myDiagram;
    if (!myDiagram) return;

    const editPortName = modalContext.editPortName || {};
    const rawName = editPortName.value;
    const nextName = (rawName ?? '').toString().trim();
    if (!nextName) {
      this.setState({ showModal: false, selectedData: null, modalContext: null });
      return;
    }

    const nodeKey = modalContext.nodeKey;
    const nodePart = nodeKey ? (myDiagram.findNodeForKey(nodeKey) as go.Node) : null;
    const nodeData: any = nodePart?.data || modalContext.nodeData;
    const objectRef = modalContext.objectRef || nodeData?.objRef || nodeData?.object?.id;
    const object = objectRef ? this.myMetis.findObject(objectRef) : null;
    if (!object) {
      alert("Change Port Name failed: could not resolve target object.");
      this.setState({ showModal: false, selectedData: null, modalContext: null });
      return;
    }

    const side = modalContext.side;
    const currentName = modalContext.portName;
    const port = object.getPort(side, currentName);
    if (!port) {
      alert("Change Port Name failed: could not resolve target port.");
      this.setState({ showModal: false, selectedData: null, modalContext: null });
      return;
    }

    port.name = nextName;

    const portGraphObject = modalContext.portObj;
    if (portGraphObject) {
      uit.changePortName(portGraphObject, nextName, myDiagram);
    }

    const jsnObj = new jsn.jsnObject(object);
    let data: any = jsnObj;
    data = JSON.parse(JSON.stringify(data));
    myDiagram.dispatch?.({ type: 'UPDATE_OBJECT_PROPERTIES', data });
    myDiagram.requestUpdate();

    this.setState({ showModal: false, selectedData: null, modalContext: null });
  }

  public handleAddPortsSubmit = () => {
    const modalContext: any = this.state.modalContext;
    if (!modalContext) return;
    // Close immediately on Add click; process add logic after closing.
    this.setState({ showModal: false, selectedData: null, modalContext: null });
    const myDiagram = modalContext.myDiagram || this.myMetis.myDiagram;
    const node = modalContext.node;
    if (!myDiagram || !node) {
      alert("Add Ports failed: missing diagram or node context.");
      return;
    }

    const addPorts = modalContext.addPorts || {};

    const nodeKey = modalContext.nodeKey || node?.key || modalContext.objviewRef || node?.objviewRef;
    const liveNodeData = nodeKey ? (myDiagram.findNodeForKey(nodeKey) as any)?.data : null;
    const nodeData = liveNodeData || node || {};

    let object = null as any;
    const currentModel: any = this.myMetis.currentModel;
    const currentModelview: any = this.myMetis.currentModelview;
    const isObjectInstance = (candidate: any) =>
      candidate && typeof candidate.addPort === 'function' && typeof candidate.getPort === 'function';
    const findObjectByRef = (ref: any) => {
      if (!ref) return null;
      let found = this.myMetis.findObject(ref);
      if (found) return found;
      found = currentModel?.findObject ? currentModel.findObject(ref) : null;
      if (found) return found;
      const modelObjects = currentModel?.objects || [];
      for (let i = 0; i < modelObjects.length; i++) {
        const obj = modelObjects[i];
        if (obj?.id === ref) return obj;
      }
      return null;
    };
    const findObjectviewByRef = (ref: any) => {
      if (!ref) return null;
      let ov = this.myMetis.findObjectView(ref);
      if (ov) return ov;
      ov = currentModelview?.findObjectView ? currentModelview.findObjectView(ref) : null;
      return ov;
    };

    // Prefer explicit objectRef captured when opening modal.
    if (!object && modalContext.objectRef) {
      object = findObjectByRef(modalContext.objectRef);
    }
    // Prefer a live object instance when available.
    if (isObjectInstance(nodeData?.object)) {
      object = nodeData.object;
    }
    // Try by object id/ref.
    if (!object && nodeData?.object?.id) {
      object = findObjectByRef(nodeData.object.id);
    }
    if (!object && nodeData?.objRef) {
      object = findObjectByRef(nodeData.objRef);
    }
    // Try through objectview links.
    if (!object && isObjectInstance(nodeData?.objectview?.object)) {
      object = nodeData.objectview.object;
    }
    if (!object && nodeData?.objectview?.objectRef) {
      object = findObjectByRef(nodeData.objectview.objectRef);
    }
    if (!object) {
      const objviewRef = modalContext.objviewRef || nodeData?.objviewRef || nodeData?.key || nodeKey;
      const objectview = findObjectviewByRef(objviewRef);
      if (isObjectInstance(objectview?.object)) {
        object = objectview.object;
      } else {
        object = objectview ? findObjectByRef(objectview.objectRef) : null;
      }
    }
    // Fallback through selected node in diagram.
    if (!object) {
      const selectedNode = myDiagram.selection?.first?.() as any;
      const selectedData = selectedNode?.data;
      if (isObjectInstance(selectedData?.object)) {
        object = selectedData.object;
      } else if (selectedData?.objRef) {
        object = findObjectByRef(selectedData.objRef);
      }
    }
    // Fallback through live go-model node (first-add after drag can be ahead of metis lookup paths).
    if (!object) {
      const goModel: any = myDiagram.myGoModel || this.myMetis.gojsModel;
      const byView = goModel?.findNodeByViewId?.(modalContext.objviewRef || nodeData?.objviewRef || nodeKey);
      const byKey = (!byView && goModel?.findNode) ? goModel.findNode(nodeKey) : null;
      const goNode = byView || byKey;
      if (isObjectInstance(goNode?.object)) {
        object = goNode.object;
      } else if (goNode?.objRef) {
        object = findObjectByRef(goNode.objRef);
      } else if (goNode?.objectview?.objectRef) {
        object = findObjectByRef(goNode.objectview.objectRef);
      }
    }
    if (!object) {
      const debugRefs = [
        `nodeKey=${String(nodeKey)}`,
        `objectRef=${String(modalContext.objectRef)}`,
        `objviewRef=${String(modalContext.objviewRef)}`,
        `node.objRef=${String(nodeData?.objRef)}`,
        `node.objviewRef=${String(nodeData?.objviewRef)}`,
      ].join(", ");
      alert(`Add Ports failed: could not resolve target object. (${debugRefs})`);
      return;
    }

    const defaultEntries = [
      { key: 'input', label: 'Input', side: 'left', prefix: 'I', count: 0, startIndex: 1 },
      { key: 'control', label: 'Control', side: 'top', prefix: 'C', count: 0, startIndex: 1 },
      { key: 'output', label: 'Output', side: 'right', prefix: 'O', count: 0, startIndex: 1 },
      { key: 'mechanism', label: 'Mechanism', side: 'bottom', prefix: 'M', count: 0, startIndex: 1 },
    ];
    const entries = Array.isArray(addPorts.entries) && addPorts.entries.length > 0
      ? addPorts.entries
      : defaultEntries;

    let addedCount = 0;
    let skipped = 0;
    let shouldClose = false;
    try {
      const addedPorts: any[] = [];
      entries.forEach((entry: any) => {
        const side = entry?.side;
        const prefix = String(entry?.prefix ?? '').trim();
        const parsedCount = parseInt(String(entry?.count ?? 0), 10);
        const count = Number.isNaN(parsedCount) ? 0 : Math.max(0, parsedCount);
        const parsedStartIndex = parseInt(String(entry?.startIndex ?? 1), 10);
        const startIndex = Number.isNaN(parsedStartIndex) ? 1 : Math.max(0, parsedStartIndex);
        if (!side || count <= 0 || prefix.length === 0) return;

        for (let i = 0; i < count; i++) {
          const index = startIndex + i;
          const name = count === 1 ? prefix : `${prefix}${index}`;
          const existing = object.getPort(side, name);
          if (existing) {
            skipped++;
            continue;
          }
          const port = object.addPort(side, name);
          if (port) {
            addedPorts.push(port);
          } else {
            skipped++;
          }
        }
      });

      if (addedPorts.length > 0) {
        const jsnObj = new jsn.jsnObject(object);
        let data: any = jsnObj;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch?.({ type: 'UPDATE_OBJECT_PROPERTIES', data });
        const targetKey = nodeData?.key || nodeData?.objviewRef || nodeKey;
        const targetNode = targetKey ? myDiagram.findNodeForKey(targetKey) : null;
        if (targetNode?.data) {
          const sideKeys = ['leftPorts', 'topPorts', 'rightPorts', 'bottomPorts'];
          sideKeys.forEach((sideKey) => {
            const sideName = sideKey.replace('Ports', '');
            const sourcePorts = object?.[`get${sideName.charAt(0).toUpperCase()}${sideName.slice(1)}Ports`]?.() || [];
            const normalized = sourcePorts.map((p: any) => ({
              id: p?.id || p?.portId,
              portId: p?.id || p?.portId,
              name: p?.name || '',
              color: p?.color || 'white',
              side: p?.side || sideName,
            }));
            myDiagram.model.setDataProperty(targetNode.data, sideKey, normalized);
          });
        } else {
          // Fallback if node lookup fails: keep legacy insertion behavior.
          addedPorts.forEach((port) => {
            uit.addPort(port, myDiagram);
          });
        }
        myDiagram.requestUpdate();
      }

      addedCount = addedPorts.length;
      shouldClose = true;
    } catch (error) {
      console.error("Add Ports failed", error);
      alert("Add Ports failed due to an unexpected error.");
    }

    if (shouldClose) {
      alert(`Added ${addedCount} port(s), skipped ${skipped}.`);
    }
  }

  public handleCloseModal(e) {
    const modalContext = this.state.modalContext;
    if (!modalContext) {
      this.setState({ showModal: false, selectedData: null, modalContext: null });
      return;
    }
    if (e === 'x') {
      const links = modalContext.links;
      const myContext = modalContext.myContext;
      let myDiagram = modalContext.myDiagram;
      if (!myDiagram) myDiagram = myContext?.myDiagram;
      
      // Revert any immediate visual changes applied during editing
      const originalData = modalContext.originalData;
      if (originalData && originalData.category === 'Relationship') {
        const link = myDiagram.findLinkForKey(originalData.key);
        if (link) {
          myDiagram.model.commit((m: any) => {
            const data = link.data;
            if (originalData.strokecolor !== undefined) m.set(data, 'strokecolor', originalData.strokecolor);
            if (originalData.strokewidth !== undefined) m.set(data, 'strokewidth', originalData.strokewidth);
            if (originalData.textcolor !== undefined) m.set(data, 'textcolor', originalData.textcolor);
            if (originalData.dash !== undefined) m.set(data, 'dash', originalData.dash);
            if (originalData.routing !== undefined) m.set(data, 'routing', originalData.routing);
            if (originalData.curve !== undefined) m.set(data, 'curve', originalData.curve);
          }, 'revert-on-cancel');
        }
      }
      
      for (let i = 0; i < links?.length; i++) {
        myDiagram?.model?.removeLinkData(links[i]);
      }
      this.setState({ showModal: false, selectedData: null, modalContext: null });
      return;
    }
    const myContext = modalContext.myContext;
    const props = this.props;
    if (modalContext.case === 'Connect to Selected')
      modalContext.what = "connectToSelected";
    
    uim.handleCloseModal(this.state.selectedData, props, modalContext);
    this.setState({ showModal: false });
  }
  
  private normalizeReldir = (val?: string): string => {
    const v = (val || '').trim().toLowerCase();
    if (v === 'in' || v === 'out') return v;
    if (v === 'all') return 'All';
    return 'All';
  }

  private buildConnectedRelationshipOptions = (part: go.Part, includeAllRels: boolean = false): Array<{ value: string; label: string }> => {
    try {
      if (!part || !part.data) return [{ value: 'All', label: 'All' }];
      const key = (part.data as any).key;
      const myMetis = this.myMetis;
      let modelview = myMetis?.currentModelview;
      if (!modelview) return [{ value: 'All', label: 'All' }];
      modelview = myMetis.findModelView(modelview.id);
      const objview = myMetis.findObjectView(key);
      if (!objview) return [{ value: 'All', label: 'All' }];

      const options: Array<{ value: string; label: string }> = [];
      const seen = new Set<string>();
      const addOption = (rel: any, label: string) => {
        const value = rel?.id ? `rel:${rel.id}` : '';
        if (!value || seen.has(value)) return;
        seen.add(value);
        options.push({ value, label });
      };

      // Gather relationship types touching this object from the current modelview
      const relviews = modelview.relshipviews || [];
      for (let i = 0; i < relviews.length; i++) {
        const rv = relviews[i];
        if (!rv || rv.markedAsDeleted) continue;
        const rel = rv.relship;
        if (!rel || rel.markedAsDeleted) continue;
        const nm = rel?.type?.name || rel?.name;
        if (!nm) continue;
        const fromId = rv?.fromObjview?.id;
        const toId = rv?.toObjview?.id;
        const otherNameFrom = rv?.toObjview?.name || rv?.toObjview?.object?.name || rv?.relship?.toObject?.name || '';
        const otherNameTo = rv?.fromObjview?.name || rv?.fromObjview?.object?.name || rv?.relship?.fromObject?.name || '';
        if (fromId === objview.id) addOption(rel, `${nm} > ${otherNameFrom}`.trim());
        if (toId === objview.id) addOption(rel, `${nm} < ${otherNameTo}`.trim());
      }

      // Optionally include relationships not currently represented in this modelview
      if (includeAllRels) {
        let object = objview.object || myMetis.findObject(objview.objectRef);
        if (object) object = myMetis.currentModel?.findObject(object.id) || object;
        if (object) {
          const directions: Array<'out' | 'in'> = ['out', 'in'];
          for (let d = 0; d < directions.length; d++) {
            const useinp = directions[d] === 'in';
            const rels: any[] = useinp ? object.inputrels : object.outputrels;
            if (!rels) continue;
            for (let i = 0; i < rels.length; i++) {
              let rel = rels[i];
              if (!rel || rel.markedAsDeleted) continue;
              rel = myMetis.findRelationship(rel.id) || rel;
              const nm = rel?.type?.name || rel?.name;
              if (!nm) continue;
              const otherObj = useinp ? rel.fromObject : rel.toObject;
              const otherName = otherObj?.name || '';
              addOption(rel, `${nm} ${useinp ? '<' : '>'} ${otherName}`.trim());
            }
          }
        }
      }

      const list = options.sort((a, b) => a.label.localeCompare(b.label));
      return [{ value: 'All', label: 'All' }, ...list];
    } catch {
      return [{ value: 'All', label: 'All' }];
    }
  };

  private buildReltypeOptions = (part: go.Part, includeAllRels: boolean = false): string[] => {
    return this.buildConnectedRelationshipOptions(part, includeAllRels).map(opt => opt.label);
  };

  private buildModelReltypeOptions = (): string[] => {
    try {
      const myMetis = this.myMetis;
      // Include relationship types present in the current model, not just visible in the modelview
      const modelReltypes: string[] = [];
      const modelRels = myMetis?.currentModel?.relships || [];
      for (let i = 0; i < modelRels.length; i++) {
        const rel = modelRels[i];
        if (!rel || rel.markedAsDeleted) continue;
        const nm = rel?.type?.name || rel?.name;
        if (nm) modelReltypes.push(nm.trim());
      }
      let modelview = myMetis?.currentModelview;
      if (!modelview) return ['All'];
      modelview = myMetis.findModelView(modelview.id);
      const relviews = modelview?.relshipviews || [];
      const names: string[] = [];
      for (let i = 0; i < relviews.length; i++) {
        const rv = relviews[i];
        if (!rv || rv.markedAsDeleted) continue;
        const rel = rv.relship;
        if (!rel || rel.markedAsDeleted) continue;
        const nm = rel?.type?.name || rel?.name;
        if (!nm) continue;
        names.push(nm.trim());
      }
      const uniq = Array.from(new Set([...names, ...modelReltypes])).sort();
      return ['All', ...uniq];
    } catch {
      return ['All'];
    }
  };

  private openSelectConnectedDialog = (diagram: go.Diagram, part: go.Part) => {
    if (!diagram || !part || !part.data || part.data.category !== constants.gojs.C_OBJECT) return;
    const includeAllRels = this.state.selectConnectedIncludeAllRels || false;
    const options = this.buildConnectedRelationshipOptions(part, includeAllRels);
    const reltypeOptions = this.buildModelReltypeOptions();
    this.setState({
      selectConnectedDialogOpen: true,
      pendingSelectContext: { diagram, part },
      selectConnectedLevels: this.state.selectConnectedLevels || '1',
      selectConnectedReltypes: 'All',
      selectConnectedRelChoice: [options?.[0]?.value || 'All'],
      selectConnectedRelOptions: options || [{ value: 'All', label: 'All' }],
      selectConnectedReltypeOptions: reltypeOptions || ['All'],
      selectConnectedReldir: this.normalizeReldir(this.state.selectConnectedReldir) || 'All',
      selectConnectedIncludeAllRels: includeAllRels,
    });
  };

  private handleSelectConnectedRelChoiceChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const opts = Array.from((event.target as HTMLSelectElement).selectedOptions).map(o => o.value);
    if (opts.includes('All') || opts.length === 0) {
      this.setState({ selectConnectedRelChoice: ['All'] });
    } else {
      this.setState({ selectConnectedRelChoice: opts });
    }
  };

  private handleSelectConnectedLevelsChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    this.setState({ selectConnectedLevels: event.target.value });
  };

  private handleSelectConnectedReltypesChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const opts = Array.from((event.target as HTMLSelectElement).selectedOptions).map(o => o.value);
    if (opts.length === 0 || opts.includes('All')) {
      this.setState({ selectConnectedReltypes: 'All' });
    } else {
      const uniq = Array.from(new Set(opts.filter(o => o !== 'All')));
      this.setState({ selectConnectedReltypes: uniq.join(',') || 'All' });
    }
  };

  private handleSelectConnectedReldirChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    this.setState({ selectConnectedReldir: event.target.value });
  };

  private handleSelectConnectedIncludeAllRelsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const includeAllRels = event.target.checked;
    const part = this.state.pendingSelectContext?.part;
    const options = part ? this.buildConnectedRelationshipOptions(part, includeAllRels) : (this.state.selectConnectedRelOptions || [{ value: 'All', label: 'All' }]);
    this.setState({
      selectConnectedIncludeAllRels: includeAllRels,
      selectConnectedRelOptions: options,
      selectConnectedRelChoice: [options?.[0]?.value || 'All'],
    });
  };

  private handleSelectConnectedCreateMissingViewsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ selectConnectedCreateMissingViews: event.target.checked });
  };

  private handleSelectConnectedCancel = () => {
    this.setState({ selectConnectedDialogOpen: false, pendingSelectContext: null });
  };

  private handleSelectConnectedConfirm = () => {
    const { pendingSelectContext } = this.state;
    const levelsParsed = parseInt(this.state.selectConnectedLevels || '1', 10);
    const levels = Number.isFinite(levelsParsed) && levelsParsed > 0 ? levelsParsed : 1;
    const reldir = (this.state.selectConnectedReldir || 'All').trim();
    const createMissingViews = !!this.state.selectConnectedCreateMissingViews;

    this.setState({ selectConnectedDialogOpen: false, pendingSelectContext: null }, () => {
      if (pendingSelectContext) {
        const normalize = (val: string) => (val || '').trim();
        const selectedFirstHopRelIds = (Array.isArray(this.state.selectConnectedRelChoice)
          ? this.state.selectConnectedRelChoice
          : [this.state.selectConnectedRelChoice || ''])
          .map(normalize)
          .filter(v => v.length > 0 && v !== 'All')
          .map(v => v.startsWith('rel:') ? v.slice(4) : v)
          .filter(v => v.length > 0);
        const rawReltypesInput = this.state.selectConnectedReltypes || 'All';
        const reltypesInput = rawReltypesInput === 'All'
          ? []
          : rawReltypesInput
            .split(',')
            .map(normalize)
            .filter(v => v.length > 0 && v !== 'All');
        this.runSelectConnectedFromContext(pendingSelectContext, {
          levels,
          reltypes: reltypesInput.join(','),
          reldir,
          firstHopRelIds: selectedFirstHopRelIds,
          createMissingViews,
        });
      }
    });
  };

  private runSelectConnectedFromContext = (
    ctx: { diagram: go.Diagram; part: go.Part },
    params: { levels: number; reltypes: string; reldir: string; firstHopRelIds?: string[]; createMissingViews?: boolean }
  ) => {
    const diagram = ctx?.diagram;
    const part = ctx?.part;
    if (!diagram || !part || !part.data || part.data.category !== constants.gojs.C_OBJECT) return;

    const nodeData: any = part.data;
    const myMetis = this.myMetis;
    myMetis.myDiagram = diagram;
    let modelview = myMetis?.currentModelview;
    if (!modelview) return;
    modelview = myMetis.findModelView(modelview.id);
    let goModel = myMetis.gojsModel;
    if (!goModel) {
      goModel = new gjs.goModel(modelview.id, "myModel", modelview);
      myMetis.setGojsModel(goModel);
    }
    const objview = myMetis.findObjectView(nodeData.key);
    if (!objview) return;

    const levels = Math.max(1, Math.floor(Number(params.levels) || 1));
    const reltypes = params.reltypes === 'All' ? '' : (params.reltypes || '').trim();
    const dir = (params.reldir || 'All').toLowerCase();
    const viewCollection = new akm.cxCollectionOfViews(modelview, [], []);

    uid.selectConnectedObjects1(modelview, objview, goModel, myMetis, levels, reltypes, dir, viewCollection, {
      firstHopRelIds: params.firstHopRelIds || [],
      createMissingViews: !!params.createMissingViews,
    });

    const mySelection = new go.Set<go.Part | go.Link>();
    const objviews = viewCollection.objectviews || [];
    const relviews = viewCollection.relshipviews || [];

    for (let i = 0; i < objviews.length; i++) {
      const ov = objviews[i];
      if (!ov || ov.id === nodeData.key) continue;
      const goNode = goModel.findNodeByViewId(ov.id);
      const gjsNode = diagram.findNodeForKey(goNode?.key || ov.id) ||
        (goNode ? diagram.findNodeForData(goNode) : null);
      if (gjsNode) mySelection.add(gjsNode);
    }

    for (let i = 0; i < relviews.length; i++) {
      const rv = relviews[i];
      if (!rv) continue;
      const goLink = goModel.findLinkByViewId(rv.id);
      const gjsLink = diagram.findLinkForKey(goLink?.key || rv.id);
      if (gjsLink) mySelection.add(gjsLink);
    }

    // Keep the current object selected alongside the traversal results
    const rootPart = diagram.findPartForKey(nodeData.key) || diagram.findNodeForKey(nodeData.key);
    if (rootPart) mySelection.add(rootPart as any);

    if (mySelection.count > 0) {
      diagram.selectCollection(mySelection);
    } else {
      diagram.clearSelection();
    }
  };

  private openAddConnectedDialog = (diagram: go.Diagram, part: go.Part) => {
    if (!diagram || !part || !part.data || part.data.category !== constants.gojs.C_OBJECT) return;
    const includeAllRels = this.state.addConnectedIncludeAllRels || false;
    const options = this.buildReltypeOptions(part, includeAllRels);
    const reltypeOptions = this.buildModelReltypeOptions();
    // Determine if all reltype options are not in modelview (i.e., only external relationships)
    const onlyExternalRels = includeAllRels && options.length > 1 && options.every(opt => !reltypeOptions.includes(opt) && opt !== 'All');
    this.setState({
      addConnectedDialogOpen: true,
      pendingAddContext: { diagram, part },
      addConnectedLevels: onlyExternalRels ? '1' : (this.state.addConnectedLevels || '1'),
      addConnectedReltypes: 'All',
      addConnectedRelChoice: [options?.[0] || 'All'],
      addConnectedRelOptions: options || ['All'],
      addConnectedReltypeOptions: reltypeOptions || ['All'],
      addConnectedReldir: this.normalizeReldir(this.state.addConnectedReldir) || 'All',
      addConnectedIncludeAllRels: includeAllRels,
      addConnectedDialogFieldsDisabled: onlyExternalRels,
    });
  };

  private handleAddConnectedRelChoiceChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const opts = Array.from((event.target as HTMLSelectElement).selectedOptions).map(o => o.value);
    if (opts.includes('All') || opts.length === 0) {
      this.setState({ addConnectedRelChoice: ['All'] });
    } else {
      this.setState({ addConnectedRelChoice: opts });
    }
  };

  private handleAddConnectedLevelsChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    this.setState({ addConnectedLevels: event.target.value });
  };

  private handleAddConnectedReltypesChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const opts = Array.from((event.target as HTMLSelectElement).selectedOptions).map(o => o.value);
    if (opts.length === 0 || opts.includes('All')) {
      this.setState({ addConnectedReltypes: 'All' });
    } else {
      const uniq = Array.from(new Set(opts.filter(o => o !== 'All')));
      this.setState({ addConnectedReltypes: uniq.join(',') || 'All' });
    }
  };

  private handleAddConnectedReldirChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    this.setState({ addConnectedReldir: event.target.value });
  };

  private handleAddConnectedIncludeAllRelsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    
    const includeAllRels = event.target.checked;
    const part = this.state.pendingAddContext?.part;
    const options = part ? this.buildReltypeOptions(part, includeAllRels) : (this.state.addConnectedRelOptions || ['All']);
    this.setState({
      addConnectedIncludeAllRels: includeAllRels,
      addConnectedRelOptions: options,
      addConnectedRelChoice: [options?.[0] || 'All'],
    });
  };

  private handleAddConnectedCancel = () => {
    this.setState({ addConnectedDialogOpen: false, pendingAddContext: null });
  };

  private handleAddConnectedConfirm = () => {
    const { pendingAddContext } = this.state;
    // Correction: If 'Include relationships not in this modelview' is selected, and one or more of these relationships are chosen, and levels is 1, skip the rest of the choices and restrict traversal to one level
    const includeAllRels = !!this.state.addConnectedIncludeAllRels;
    let levelsParsed = parseInt(this.state.addConnectedLevels || '1', 10);
    let levels = Number.isFinite(levelsParsed) && levelsParsed > 0 ? levelsParsed : 1;
    const reltypeOptions = this.buildModelReltypeOptions();
    const selectedReltypes = Array.isArray(this.state.addConnectedRelChoice)
      ? this.state.addConnectedRelChoice
      : [this.state.addConnectedRelChoice || 'All'];
    // Check if any selected relationship is not in modelview
    const hasExternalRelSelected = includeAllRels && selectedReltypes.some(opt => !reltypeOptions.includes(opt) && opt !== 'All');
    if (hasExternalRelSelected && levels === 1) {
      // Skip the rest of the choices and restrict traversal to one level
      levels = 1;
    }
    const reldir = this.normalizeReldir(this.state.addConnectedReldir);

    this.setState({ addConnectedDialogOpen: false, pendingAddContext: null }, () => {
      if (pendingAddContext) {
        const normalize = (val: string) => (val || '').trim();
        // Broader relationship type filter for deeper levels (if multi-level)
        const subsequentReltypesInput = (this.state.addConnectedReltypes || '') === 'All'
          ? []
          : (this.state.addConnectedReltypes || '')
            .split(',')
            .map(normalize)
            .filter(v => v.length > 0);
        // Selected relationships for first step only
        const selectedReltypes = (Array.isArray(this.state.addConnectedRelChoice)
          ? this.state.addConnectedRelChoice
          : [this.state.addConnectedRelChoice || 'All'])
          .map(normalize)
          .filter(v => v.length > 0);
        const firstStepReltypes = selectedReltypes.length === 0 ? '' : selectedReltypes.join(',');
        const subsequentReltypes = subsequentReltypesInput.join(',') || '';
        this.runAddConnectedFromContext(pendingAddContext, {
          levels,
          reltypes: firstStepReltypes,
          subsequentReltypes,
          reldir,
          includeAllRels,
        });
      }
    });
  };

  private runAddConnectedFromContext = (
    ctx: { diagram: go.Diagram; part: go.Part },
    params: { levels: number; reltypes: string; subsequentReltypes: string; reldir: string; includeAllRels?: boolean }
  ) => {
    // Correction: If only external relationships are selected and levels is 1, skip the rest
    if (params.levels === 1) return;
    const diagram = ctx?.diagram;
    const part = ctx?.part;
    if (!diagram || !part || !part.data || part.data.category !== constants.gojs.C_OBJECT) return;

    const nodeData: any = part.data;
    const reltypes = params.reltypes === 'All' ? '' : (params.reltypes || '').trim();
    const subsequentReltypes = params.subsequentReltypes || '';
    const reldir = this.normalizeReldir(params.reldir);
    const includeAllRels = !!params.includeAllRels;
    const noLevels = Math.max(1, Math.floor(Number(params.levels) || 1));

    const selection = diagram.selection.count > 0 ? diagram.selection : (() => {
      const nodePart = diagram.findPartForKey(nodeData.key) || part;
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
        uid.addConnectedObjects(selData, { noLevels, reltypes, subsequentReltypes, reldir, includeAllRels }, this.myMetis, diagram);
      }
    }
  };

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
          const nextSelectedData = {
            ...(draft.selectedData || {}),
            [propname]: value,
          };
          draft.selectedData = nextSelectedData;
          if (propname === 'grabIsAllowed') {
            const nextValue = value === true || value === 'true';
            try {
              draft.selectedData = {
                ...(draft.selectedData || {}),
                [propname]: nextValue,
              };
            } catch (_) {}
            try {
              draft.modalContext.myContext.objectview[propname] = nextValue;
            } catch (_) {}
            try {
              const currentNode: any = this.myMetis?.currentNode;
              if (currentNode?.objectview) currentNode.objectview[propname] = nextValue;
              if (currentNode?.data?.objectview) currentNode.data.objectview[propname] = nextValue;
              if (currentNode?.data) currentNode.data[propname] = nextValue;
              if (currentNode) currentNode[propname] = nextValue;
            } catch (_) {}
          }
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
    const baseStandardMouseSelect = go.ClickSelectingTool.prototype.standardMouseSelect;
    const guardedStandardMouseSelect = function () {
      const diagram = this.diagram;
      if (!diagram) return;
      if ((diagram as any).__spacePanActive || (diagram as any).__spacePanDragging) return;
      const suppressUntil = Number((diagram as any).__spacePanSuppressClickUntil || 0);
      if (suppressUntil > Date.now()) return;
      const clickPoint = diagram.lastInput.documentPoint;
      const clickedObject = diagram.findObjectAt(clickPoint);
      const targetPart = clickedObject?.part instanceof go.Part ? clickedObject.part : null;
      let selectablePart = targetPart;
      if (targetPart instanceof go.Group) {
        const data: any = targetPart.data || {};
        const templateName = String(data?.template || data?.category || targetPart.category || "");
        const isPortedGroup =
          templateName === "groupWithPorts" ||
          templateName === "groupWithIconAndPorts" ||
          templateName === "groupWithGeoAndPorts" ||
          templateName === "groupWithFigAndPorts" ||
          templateName === "IDEF0";
        if (isPortedGroup) {
          const shape = targetPart.findObject("SHAPE");
          const localPoint = shape?.getLocalPoint?.(clickPoint);
          const geometryContainsPoint =
            !!shape?.geometry &&
            !!localPoint &&
            typeof shape.geometry.containsPoint === "function" &&
            shape.geometry.containsPoint(localPoint);
          if (!geometryContainsPoint) {
            selectablePart = null;
          }
        }
      }
      if (!(selectablePart instanceof go.Part)) {
        if (!diagram.lastInput.shift) {
          diagram.clearSelection();
        }
        return;
      }
      baseStandardMouseSelect.call(this);
    };
    { // define myDiagram
      myDiagram =
        $(go.Diagram,
          {
            initialContentAlignment: go.Spot.Center,       // center the content
            initialAutoScale: go.Diagram.Uniform,
            "contextMenuTool.standardMouseSelect": guardedStandardMouseSelect,
            // layout: new go.TreeLayout({ isOngoing: false }),
            "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
            "scrollMode": go.Diagram.InfiniteScroll,
            "animationManager.isEnabled": false,
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
            // Continuous dragging is expected in the modeller; grid snapping makes
            // groups/containers feel delayed and stepwise after they have been dropped.
            "draggingTool.isGridSnapEnabled": false,
            "linkingTool.portGravity": 50,  // distance from port edge that still snaps to it (bigger = easier linking)
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
	      override doActivate() {
	        const diagram = this.diagram;
	        const draggedParts = this.draggedParts;
	        let ordinaryNodeDrag = false;
	        if (draggedParts) {
	          for (let it = draggedParts.iterator; it?.next();) {
	            const part: go.Part = it.key;
	            if (part instanceof go.Node && !(part instanceof go.Group)) {
	              ordinaryNodeDrag = true;
	              break;
	            }
	          }
	        }
	        if (diagram && ordinaryNodeDrag) {
	          try {
	            (diagram as any).__suppressObjectSingleClickUntil = Date.now() + 1200;
	          } catch (_) { }
	        }
	        super.doActivate();
	      }

	      override doMouseMove() {
	        const diagram = this.diagram;
	        try {
	          const draggedParts = this.draggedParts;
	          const manualLinkMovePreview = new Map<string, number[]>();
	          for (let it = draggedParts?.iterator; it?.next();) {
	            const part = it.key as go.Part;
	            if (!(part instanceof go.Node) || !part.data?.key) continue;
	            part.linksConnected.each((link: go.Link) => {
	              const linkKey = link?.data?.key;
	              if (!linkKey) return;
	              const points: number[] = [];
	              try {
	                for (let pt = link.points.iterator; pt?.next();) {
	                  const point = pt.value;
	                  if (point && typeof point.x === "number" && typeof point.y === "number") {
	                    points.push(point.x, point.y);
	                  }
	                }
	              } catch (_) {
	              }
	              if (points.length >= 4) {
	                manualLinkMovePreview.set(String(linkKey), points);
	              }
	            });
	          }
	          (diagram as any).__manualLinkMovePreview = manualLinkMovePreview;
	        } catch (_) {
	        }
          // Temporary drag vibration tracing removed.
	        super.doMouseMove();
	      }

	      override doDeactivate() {
	        const diagram = this.diagram;
	        try {
	          try {
	            const draggedParts = this.draggedParts;
	            const manualLinkMovePreview = new Map<string, number[]>();
	            for (let it = draggedParts?.iterator; it?.next();) {
	              const part = it.key as go.Part;
	              if (!(part instanceof go.Node) || !part.data?.key) continue;
	              part.linksConnected.each((link: go.Link) => {
	                const linkKey = link?.data?.key;
	                if (!linkKey) return;
	                const points: number[] = [];
	                try {
	                  for (let pt = link.points.iterator; pt?.next();) {
	                    const point = pt.value;
	                    if (point && typeof point.x === "number" && typeof point.y === "number") {
	                      points.push(point.x, point.y);
	                    }
	                  }
	                } catch (_) {
	                }
	                if (points.length >= 4) {
	                  manualLinkMovePreview.set(String(linkKey), points);
	                }
	              });
	            }
	            if (manualLinkMovePreview.size > 0) {
	              (diagram as any).__manualLinkMovePreview = manualLinkMovePreview;
	            }
	          } catch (_) {
	          }
	          try {
	            if ((diagram as any)?.__manualLinkMovePreview instanceof Map &&
	                (diagram as any).__manualLinkMovePreview.size === 0) {
	              delete (diagram as any).__manualLinkMovePreview;
	            }
	          } catch (_) { }
	          if (diagram) {
	            try {
	              (diagram as any).__suppressObjectSingleClickUntil = Math.max(
	                Number((diagram as any).__suppressObjectSingleClickUntil || 0),
	                Date.now() + 250
	              );
	            } catch (_) { }
	          }
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
	                const findLaneAtPoint = (pt: go.Point): go.Group | null => {
	                  let best: { area: number; lane: go.Group } | null = null;
	                  d.nodes.each((n: go.Node) => {
	                    if (!(n instanceof go.Group)) return;
	                    const cat = String(n.data?.category || n.data?.template || n.category || "");
	                    if (!cat.startsWith("Lane")) return;
	                    const r = laneBodyBounds(n);
	                    if (!r || !r.containsPoint(pt)) return;
	                    const area = Math.max(1, r.width * r.height);
	                    if (!best || area < best.area) best = { area, lane: n };
	                  });
	                  return best ? best.lane : null;
	                };
	                const findLaneByOverlap = (part: go.Node): go.Group | null => {
	                  const nb = part.actualBounds;
	                  let best: { overlap: number; area: number; lane: go.Group } | null = null;
	                  d.nodes.each((n: go.Node) => {
	                    if (!(n instanceof go.Group)) return;
	                    const cat = String(n.data?.category || n.data?.template || n.category || "");
	                    if (!cat.startsWith("Lane")) return;
	                    const gb = laneBodyBounds(n);
	                    if (!gb) return;
	                    const ix1 = Math.max(nb.x, gb.x);
	                    const iy1 = Math.max(nb.y, gb.y);
	                    const ix2 = Math.min(nb.right, gb.right);
	                    const iy2 = Math.min(nb.bottom, gb.bottom);
	                    const overlap = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
	                    if (overlap <= 0) return;
	                    const area = Math.max(1, gb.width * gb.height);
	                    if (!best || overlap > best.overlap || (overlap === best.overlap && area < best.area)) {
	                      best = { overlap, area, lane: n };
	                    }
	                  });
	                  return best ? best.lane : null;
	                };

	                const targetLane = findLaneAtPoint(dropPt) || ((): go.Group | null => {
	                  // If drop point is in header strip, overlap tends to still pick the correct lane.
	                  // Use the first moved node as probe.
	                  for (let it = dragged.iterator; it?.next();) {
	                    const p: go.Part = it.key;
	                    if (p instanceof go.Node && !(p instanceof go.Group)) return findLaneByOverlap(p);
	                  }
	                  return null;
	                })();
	                const targetKey = targetLane ? String(targetLane.data?.key || targetLane.key || "") : "";

	                for (let it = dragged.iterator; it?.next();) {
	                  const part: go.Part = it.key;
	                  if (!(part instanceof go.Node) || part instanceof go.Group) continue;
	                  const k = part.data?.key;
	                  const allowed = allowGlobal || (allowKeys && k != null && allowKeys.has(String(k)));
	                  if (!allowed) continue;

	                  if (!targetLane || !targetKey) continue;

	                  const cur = (typeof part.data?.group === "string") ? String(part.data.group) : "";
	                  if (cur === targetKey) continue;

	                  // Force a real reparent in the Diagram so `containingGroup` updates immediately.
	                  const oldGrp = part.containingGroup;
	                  if (oldGrp && oldGrp !== targetLane) {
	                    const s = new go.Set<go.Part>();
	                    s.add(part);
	                    oldGrp.removeMembers(s, true);
	                  }
	                  if (typeof (d.model as any)?.setGroupKeyForNodeData === "function") {
	                    (d.model as any).setGroupKeyForNodeData(part.data, targetKey);
	                  } else {
	                    d.model.setDataProperty(part.data, "group", targetKey);
	                  }
	                  targetLane.addMembers(new go.Set<go.Part>().add(part), true);
	                }
	              }, "SwimlaneShiftReparent");
	            }
	          }
	        } catch {
	          // Best-effort only; never block drag completion.
	        }
	        
	        // Trigger pool layout if lanes were dragged
	        try {
	          const dragged = this.draggedParts;
	          let lanesWereDragged = false;
	          if (dragged && diagram) {
	            for (let it = dragged.iterator; it?.next();) {
	              const part: go.Part = it.key;
	              if (part instanceof go.Group && part.category === "Lane") {
	                lanesWereDragged = true;
	                break;
	              }
	            }
	            if (lanesWereDragged) {
	              // Re-layout all pools to stack lanes properly
	              diagram.startTransaction("relayout pools");
	              diagram.findTopLevelGroups().each((g: go.Part) => {
	                if (g instanceof go.Group && g.category === "Pool" && g.layout) {
	                  g.layout.invalidateLayout();
	                }
	              });
	              diagram.layoutDiagram();
	              diagram.commitTransaction("relayout pools");
	            }
	          }
	        } catch {
	          // Best-effort only
	        }
	        
		        // Do not clear `__dragAllowReparent*` here: SelectionMoved uses those markers to decide
		        // whether regrouping is allowed. They are cleared after persistence in GoJSApp.
		        super.doDeactivate();
		      }
		    }

	    myDiagram.toolManager.draggingTool = new SwimlaneDraggingTool();
      myDiagram.toolManager.clickSelectingTool.standardMouseSelect = guardedStandardMouseSelect;

	    // when the user clicks on the background of the Diagram, remove all highlighting
	    myDiagram.click = function (e) {
	      e.diagram.commit(function (d) { d.clearHighlighteds(); }, "no highlighteds");
	    };
    myDiagram.myGoModel = this.myGoModel;
    myDiagram.myGoMetamodel = this.myGoMetamodel;
    this.myMetis.dispatch = this.props.dispatch;
    
    // Wrap dispatch to intercept visual property updates and apply them immediately to the GoJS diagram.
    // This is necessary because updating myMetis.gojsModel doesn't change the array reference,
    // so React's componentDidUpdate never fires. The wrapper bypasses this by directly updating
    // the GoJS model via diagram.model.commit() before forwarding to Redux for persistence.
    const originalDispatch = bindLegacyUniverseDispatch(this.props.dispatch || this.myMetis?.dispatch);
    const wrappedDispatch = (action: any) => {
      // Intercept view property updates for immediate visual feedback
      if (action?.type === 'UPDATE_OBJECTVIEW_PROPERTIES' && action?.data?.id) {
        try {
          const data = action.data;
          let nodePart: any = myDiagram.findNodeForKey?.(data.id) || null;
          if (!nodePart) {
            myDiagram.nodes.each((part: any) => {
              const partData = part?.data;
              if (!nodePart && (
                partData?.id === data.id ||
                partData?.key === data.id ||
                partData?.objviewRef === data.id ||
                partData?.objectview?.id === data.id
              )) {
                nodePart = part;
              }
            });
          }
          const nodeData = nodePart?.data || myDiagram.model.findNodeDataForKey(data.id);
          
          if (nodeData) {
            // Skip undo/redo and prevent selection changes
            myDiagram.skipsUndoManager = true;
            const oldAllowSelect = myDiagram.allowSelect;
            myDiagram.allowSelect = false;
            
            myDiagram.model.commit((m: any) => {
              if (data.fillcolor !== undefined) m.set(nodeData, 'fillcolor', data.fillcolor);
              if (data.strokecolor !== undefined) m.set(nodeData, 'strokecolor', data.strokecolor);
              if (data.strokewidth !== undefined) m.set(nodeData, 'strokewidth', data.strokewidth);
              if (data.icon !== undefined) m.set(nodeData, 'icon', data.icon);
            }, null);

            if (data.icon !== undefined) {
              if (nodeData.objectview) nodeData.objectview.icon = data.icon;
              nodePart?.updateTargetBindings?.();
              uit.forceUpdateAllIconSources?.(myDiagram);
              myDiagram.requestUpdate?.();
            }
            
            // Restore settings - but ONLY restore allowSelect if it was true before
            // If it was already false (e.g., from handleCloseModal), keep it false
            myDiagram.skipsUndoManager = false;
            if (oldAllowSelect === true) {
              myDiagram.allowSelect = true;
            }
          }
        } catch (err) {
          console.error('[Dispatch-Wrapper] Error applying objectview updates:', err);
        }
      } else if (action?.type === 'UPDATE_RELSHIPVIEW_PROPERTIES' && action?.data?.id) {
        try {
          const data = action.data;
          
          // CRITICAL: If skipVisualUpdate flag is set, the visual update was already done
          // in handleCloseModal, so we just forward to Redux for persistence
          if (action.skipVisualUpdate) {
            console.log('[Dispatch-Wrapper] skipVisualUpdate=true, forwarding to Redux without visual update');
            // Remove skipVisualUpdate before forwarding to Redux (Redux doesn't expect it)
            const { skipVisualUpdate, ...cleanAction } = action;
            originalDispatch(cleanAction);
            return;
          }
          
          console.log('[Dispatch-Wrapper] Applying relshipview update for:', data.id);
          
          // Check if this id belongs to a node (safety check)
          const nodeData = myDiagram.model.findNodeDataForKey(data.id);
          if (nodeData) {
            console.error('[Dispatch-Wrapper] Error: data.id is a node, not a link');
            originalDispatch(action);
            return;
          }
          
          // Try to find the link by key first, then search by various id fields
          let linkData = myDiagram.model.findLinkDataForKey(data.id);
          let link = null;
          
          if (!linkData) {
            for (let it = myDiagram.links.iterator; it?.next();) {
              const l = it.value;
              const ld = l.data;
              if (!ld) continue;
              
              if (ld.id === data.id || 
                  ld.key === data.id || 
                  ld.relviewRef === data.id ||
                  ld.relshipview?.id === data.id) {
                linkData = ld;
                link = l;
                break;
              }
            }
          }
          
          if (linkData) {
            // Skip undo/redo and prevent selection changes
            myDiagram.skipsUndoManager = true;
            const oldAllowSelect = myDiagram.allowSelect;
            myDiagram.allowSelect = false;
            
            myDiagram.model.commit((m: any) => {
              if (data.strokecolor !== undefined) m.set(linkData, 'strokecolor', data.strokecolor);
              if (data.strokewidth !== undefined) m.set(linkData, 'strokewidth', data.strokewidth);
            }, null);
            
            // Restore settings - only restore allowSelect if it was true
            myDiagram.skipsUndoManager = false;
            if (oldAllowSelect === true) {
              myDiagram.allowSelect = true;
            }
          }
          
          // Forward to Redux for persistence
          originalDispatch(action);
        } catch (err) {
          console.error('[Dispatch-Wrapper] Error applying relshipview updates:', err);
        }
      } else if (action?.type === 'UPDATE_OBJECTTYPEVIEW_PROPERTIES' && action?.data?.id) {
        // Apply typeview changes to all nodes using that typeview
        try {
          const data = action.data;
          
          // Skip undo/redo and prevent selection changes
          myDiagram.skipsUndoManager = true;
          const oldAllowSelect = myDiagram.allowSelect;
          myDiagram.allowSelect = false;
          
          myDiagram.model.commit((m: any) => {
            myDiagram.nodes.each((node: any) => {
              const nodeData = node.data;
              if (nodeData?.typeviewRef === data.id || nodeData?.objectview?.typeviewRef === data.id) {
                if (data.fillcolor !== undefined) m.set(nodeData, 'fillcolor', data.fillcolor);
                if (data.strokecolor !== undefined) m.set(nodeData, 'strokecolor', data.strokecolor);
                if (data.strokewidth !== undefined) m.set(nodeData, 'strokewidth', data.strokewidth);
                if (data.icon !== undefined) m.set(nodeData, 'icon', data.icon);
              }
            });
          }, null);
          
          // Restore settings
          myDiagram.skipsUndoManager = false;
          myDiagram.allowSelect = oldAllowSelect;
        } catch (err) {
          console.error('[Dispatch-Wrapper] Error applying typeview updates:', err);
        }
      } else if (action?.type === 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES' && action?.data?.id) {
        // Apply typeview changes to all links using that typeview
        try {
          const data = action.data;
          
          // Skip undo/redo and prevent selection changes
          myDiagram.skipsUndoManager = true;
          const oldAllowSelect = myDiagram.allowSelect;
          myDiagram.allowSelect = false;
          
          myDiagram.model.commit((m: any) => {
            myDiagram.links.each((link: any) => {
              const linkData = link.data;
              if (linkData?.typeviewRef === data.id || linkData?.relshipview?.typeviewRef === data.id) {
                if (data.strokecolor !== undefined) m.set(linkData, 'strokecolor', data.strokecolor);
                if (data.strokewidth !== undefined) m.set(linkData, 'strokewidth', data.strokewidth);
              }
            });
          }, null);
          
          // Restore settings
          myDiagram.skipsUndoManager = false;
          myDiagram.allowSelect = oldAllowSelect;
        } catch (err) {
          console.error('[Dispatch-Wrapper] Error applying relship typeview updates:', err);
        }
      }
      
      // Always forward to Redux for persistence
      return originalDispatch(action);
    };
    
    myDiagram.dispatch = wrappedDispatch;
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
    myDiagram.toolManager.draggingTool.isGridSnapEnabled = false;
    myDiagram.toolManager.resizingTool.isGridSnapEnabled = true;
    
    // Install custom LaneResizingTool for pool/lane resizing
    uit.installLaneResizingTool(myDiagram);
    
    myMetis.myDiagram = myDiagram;
    
    this.updateZoomInvariantHandles(myDiagram);
    myDiagram.model.linkFromPortIdProperty = "fromPort";  // necessary to remember portIds
    myDiagram.model.linkToPortIdProperty = "toPort";
    const myModelview: akm.cxModelView = myMetis.currentModelview;
    if (myModelview) myModelview.diagram = myDiagram;

    if (myModelview?.name === constants.admin.AKM_ADMIN_MODELVIEW) {
      setLayout(myDiagram, myModelview?.layout);
    }

    if (typeof uic.handleContainedObjectViews === "function") {
      uic.handleContainedObjectViews(myModelview, myDiagram, myMetis);
    }

    // GoJSApp owns link-route persistence on move. Avoid a second SelectionMoved
    // listener here that can overwrite saved manual paths after drop.


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
    let typeviewContextMenu: go.HTMLInfo;

    // Nodes CONTEXT MENU
    {
      advancedPartContextMenu =
        $(go.Adornment, "Vertical",
          // makeButton("Copy",
          //   function (e: any, obj: any) {
          //     let node = obj.part;
          //     node = myDiagram.findNodeForKey(node.key);
          //     try {
          //       const myCollection = node.findSubGraphParts();
          //       if (myCollection) {
          //         myCollection.add(node);
          //         myDiagram.selectCollection(myCollection);
          //       }
          //     } catch {
          //     }
          //     const gjsNode = myDiagram.findNodeForKey(node?.key);
          //     let currentNode = obj.part.data;
          //     let selection = myDiagram.selection;
          //     if (selection.count == 0) {
          //       if (currentNode) myDiagram.select(myDiagram.findPartForKey(currentNode.key));
          //       selection = myDiagram.selection;
          //     }
          //     const gjsSourceNodes = []; // source nodes
          //     const gjsSourceLinks = []; // source links
          //     for (let it = selection.iterator; it?.next();) {
          //       let n = it.value;
          //       if (n instanceof go.Node) {
          //         addSourceNode(gjsSourceNodes, n);
          //       } else if (n instanceof go.Link) {
          //         addSourceLink(gjsSourceLinks, n);
          //       }
          //     }
          //     // Build the structure that is used in copy/paste
          //     selection = [];
          //     e.diagram.selection.each(function (sel) {
          //       const key = sel.data.key;
          //       sel.data.fromModelview = myMetis.currentModelview;
          //       sel.data.fromGoModel   = myMetis.gojsModel;
          //       sel.data.fromNode = getSourceNode(gjsSourceNodes, key);
          //       sel.data.fromLink = getSourceLink(gjsSourceLinks, key);
          //       selection.push(sel.data);
          //     });
          //     if (selection.length > 0) {
          //       myMetis.currentSelection = selection;
          //       e.diagram.commandHandler.copySelection();
          //     }
          //   },
          //   function (o: any) {
          //     const node = o.part.data;
          //     if (node.category === constants.gojs.C_OBJECT) {
          //       // node.diagram.selectCollection(node.findSubGraphParts());
          //       return true;
          //     }
          //     if (node.category === constants.gojs.C_RELATIONSHIP)
          //       return true;
          //   }),
          // makeButton("Paste",
          //   function (e: any, obj: any) {
          //     myMetis.pasteViewsOnly = false;
          //     const point = e.diagram.toolManager.contextMenuTool.mouseDownPoint;
          //     e.diagram.commandHandler.pasteSelection(point);
          //   },
          //   function (o: any) {
          //     return o.diagram.commandHandler.canPasteSelection();
          //   }),
          // makeButton("Paste View",
          //   function (e: any, obj: any) {
          //     myMetis.pasteViewsOnly = true;
          //     const point = e.diagram.toolManager.contextMenuTool.mouseDownPoint;
          //     e.diagram.commandHandler.pasteSelection(point);
          //   },
          //   function (o: any) {
          //     //return false;
          //     return o.diagram.commandHandler.canPasteSelection();
          //   }),
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
          // makeButton("Edit Object",
          //   function (e: any, obj: any) {
          //     const gjsNode = obj.part.data;
          //     uid.editObject(gjsNode, myMetis, myDiagram);
          //   },
          //   function (o: any) {
          //     const node = o.part.data;
          //     if (node.category === constants.gojs.C_OBJECT) {
          //       if (node.isSelected) {
          //         return true;
          //       } else {
          //         myDiagram.clearSelection();
          //         node.isSelected = true;
          //         uid.addToSelection(node, myDiagram);
          //         return true;
          //       }
          //     }
          //   }),
          // makeButton("Edit Objectview",
          //   function (e: any, obj: any) {
          //     const gjsNode = obj.part.data;
          //     uid.editObjectview(gjsNode, myMetis, myDiagram);
          //   },
          //   function (o: any) {
          //     const node = o.part.data;
          //     if (node.category === constants.gojs.C_OBJECT) {
          //       if (node.isSelected) {
          //         return true;
          //       } else {
          //         myDiagram.clearSelection();
          //         node.isSelected = true;
          //         uid.addToSelection(node, myDiagram);
          //         return true;
          //       }
          //     }
          //   }),
          // makeButton("Connect to Selected",
          //   function (e: any, obj: any) {
          //     const node = obj.part.data;
          //     node.isSelected = false;
          //     const fromTypeRef = node.objtypeRef;
          //     const fromType = myMetis.findObjectType(fromTypeRef);
          //     const nodes = [];
          //     const selection = myDiagram.selection;
          //     for (let it = selection.iterator; it?.next();) {
          //       let n = it.value;
          //       if (n.data.key === node.key)
          //         continue;
          //       nodes.push(n.data);
          //     }
          //     const choices = uid.getConnectToSelectedTypes(node, selection, myMetis, myDiagram);
          //     const args = {
          //       fromType: fromType,
          //       nodeFrom: node,
          //       nodesTo: nodes,
          //       typeNames: choices,
          //     }
          //     const modalContext = {
          //       what: "selectDropdown",
          //       title: "Select Relationship Type",
          //       case: "Connect to Selected",
          //       myDiagram: myDiagram,
          //       args: args
          //     }
          //     myMetis.currentNode = node;
          //     myMetis.myDiagram = myDiagram;
          //     myDiagram.handleOpenModal(node, modalContext);
          //   },
          //   function (o: any) {
          //     const node = o.part.data;
          //     if (node.category === constants.gojs.C_OBJECT) {
          //       const selection = myDiagram.selection;
          //       if (selection.count > 0)
          //         return true;
          //       return false;
          //     }
          //     return false;
          //   }),
          // makeButton("Add Connected Objects",
          //   function (e: any, obj: any) {

          //     let noLevels = '9';
          //     let reltypes = 'All';
          //     let reldir   = 'All';
          //     let useDefaults = confirm('Use default parameters?');
          //     if (useDefaults) {
          //         noLevels = 9;
          //         reltypes = 'All';
          //         reldir === 'All'
          //     } else {
          //         noLevels = prompt('Enter no of sublevels to follow', noLevels);
          //         let reltypes = 'All';
          //         reltypes = prompt('Enter relationship type to follow', reltypes);
          //         if (reltypes === 'All') {
          //             reltypes = '';
          //         }
          //         let reldir = 'All';
          //         reldir = prompt('Enter relationship direction to follow (in | out | All)', reldir);
          //     }
          //     const params = {
          //         noLevels: noLevels,
          //         reltypes: reltypes,
          //         reldir: reldir
          //     }

          //     const mySelection = myDiagram.selection;
          //     const nodes = [];
          //     for (let it = mySelection.iterator; it?.next();) {
          //       let n = it.value;
          //       const node = n.data;
          //       uid.addConnectedObjects(node, params, myMetis, myDiagram);                
          //     }
          //   },
          //   function (o: any) {
          //     const node = o.part.data;
          //     if (node.category === constants.gojs.C_OBJECT) {
          //       return true;
          //     }
          //     return false;
          //   }),
          // makeButton("Hide Connected Relationships",
          //   function (e: any, obj: any) {
          //     const node = obj.part.data;
          //     const n = myDiagram.findNodeForKey(node.key);
          //     uid.hideConnectedRelationships(n, myMetis, myDiagram);
          //   },
          //   function (o: any) {
          //     const node = o.part.data;
          //     if (node.category === constants.gojs.C_OBJECT) {
          //       return true;
          //     }
          //     return false;
          //   }),
          // makeButton("Change Icon",
          //   function (e: any, obj: any) {
          //     const node = obj.part.data;
          //     if (node) myDiagram.select(myDiagram.findPartForKey(node.key));
          //     const ilist = iconList()
          //     const iconLabels = ilist.map(il => (il) && il.label)
          //     const modalContext = {
          //       what: "selectDropdown",
          //       title: "Select Icon",
          //       case: "Change Icon",
          //       iconList: iconList(),
          //       currentNode: node,
          //       myDiagram: myDiagram
          //     }
          //     myMetis.currentNode = node;
          //     myMetis.myDiagram = myDiagram;
          //     myDiagram.handleOpenModal(node, modalContext);
          //   },
          //   function (o: any) {
          //     const node = o.part.data;
          //     if (node.category === constants.gojs.C_OBJECT) {
          //       return true;
          //     }
          //     return false;
          //   }),
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
          // makeButton("Sort Selection",
          //   function (e: any, obj: any) {
          //     uid.sortSelection(myDiagram);
          //   },
          //   function (o: any) {
          //     const selection = myDiagram.selection;
          //     if (selection.count > 1)
          //       return true;
          //     else
          //       return false;
          //   }),
          // makeButton("Add to Selection",
          //   function (e: any, obj: any) {
          //     uid.addToSelection(obj, myDiagram);
          //   },
          //   function (o: any) {
          //     return false;
          //   }),
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
          // makeButton("Delete Selection",
          //   function (e: any, obj: any) {
          //     if (confirm('Do you really want to delete the current selection?')) {
          //       const myModel = myMetis.currentModel;
          //       const myGoModel = myMetis.gojsModel;
          //       myMetis.deleteViewsOnly = false;
          //       // myDiagram.selection.each(function (sel) {
          //       //   const data = sel.data;
          //       //   if (data.category === constants.gojs.C_OBJECT) {
          //       //     const objview = myModelview.findObjectView(data.key);
          //       //     const object = objview.object;
          //       //     const objviews = object.objectviews;
          //       //     if (objviews) {
          //       //       objviews.forEach(ov => {
          //       //         let ovnode = myGoModel.findNodeByViewId(ov.id);
          //       //         if (ovnode) {
          //       //           const n = myDiagram.findNodeForKey(ovnode.key);
          //       //           if (n) n.isSelected = true;
          //       //         }
          //       //       })
          //       //     }
          //       //     let node = myGoModel.findNode(data.key);
          //       //     if (node?.isGroup) {
          //       //       const groupMembers = node.getGroupMembers(myGoModel);
          //       //       for (let i = 0; i < groupMembers?.length; i++) {
          //       //         const member = groupMembers[i];
          //       //         const n = myDiagram.findNodeForKey(member?.key);
          //       //       }
          //       //     }
          //       //     const n = myDiagram.findNodeForKey(node?.key);
          //       //     if (n)
          //       //       n.findLinksConnected().each(function (l) {
          //       //         l.isSelected = true;
          //       //       });
          //       //   }
          //       //   if (data.category === constants.gojs.C_OBJECTTYPE) {
          //       //     const node = myDiagram.findNodeForKey(data.key);
          //       //     node.findLinksConnected().each(function (l) {
          //       //       l.isSelected = true;
          //       //     });
          //       //   }
          //       // })
          //       myDiagram.commandHandler.deleteSelection();
          //     }
          //   },
          //   function (o: any) {
          //     let selection = myDiagram.selection;
          //     const node = o.part.data;
          //     if (node.isSelected && selection.count > 1) {
          //       return o.diagram.commandHandler.canDeleteSelection();
          //     } else
          //       return false;
          //   }),
          // makeButton("Delete",
          //   function (e: any, obj: any) {
          //     let node = obj.part;
          //     node = myDiagram.findNodeForKey(node.key);
          //     if (node.data.isGroup) {
          //       if (confirm('Do you want to also delete the content?')) {
          //         try {
          //           const myCollection = node.findSubGraphParts();
          //           myCollection.add(node);
          //           myDiagram.selectCollection(myCollection);
          //         } catch {
          //         }
          //       }
          //     }
          //     if (confirm('Do you really want to delete the current selection?')) {
          //       myMetis.deleteViewsOnly = false;
          //       myMetis.currentNode = obj.part.data;
          //       myDiagram.commandHandler.deleteSelection();
          //     }
          //   },
          //   function (o: any) {
          //     let selection = myDiagram.selection;
          //     const node = o.part.data;
          //     if (node.isSelected && selection.count == 1) {
          //       return o.diagram.commandHandler.canDeleteSelection();
          //     } else
          //       return false;
          //   }),
          // makeButton("Delete View",
          //   function (e: any, obj: any) {
          //     if (confirm('Do you really want to delete the current selection?')) {
          //       const myModel = myMetis.currentModel;
          //       myMetis.deleteViewsOnly = true;
          //       myMetis.currentNode = obj.part.data;
          //     }
          //     myDiagram.commandHandler.deleteSelection();
          //   },
          //   function (o: any) {
          //     let selection = myDiagram.selection;
          //     const node = o.part.data;
          //     if (node.isSelected && selection.count == 1) {
          //       return o.diagram.commandHandler.canDeleteSelection();
          //     } else
          //       return false;
          //   }),
          // makeButton("Delete Selected Views",
          //   function (e: any, obj: any) {
          //     if (confirm('Do you really want to delete the current selection?')) {
          //       const myModel = myMetis.currentModel;
          //       myMetis.deleteViewsOnly = true;
          //       myMetis.currentNode = obj.part.data;
          //     }
          //     myDiagram.commandHandler.deleteSelection();
          //   },
          //   function (o: any) {
          //     let selection = myDiagram.selection;
          //     const node = o.part.data;
          //     if (node.isSelected && selection.count > 1) {
          //       return o.diagram.commandHandler.canDeleteSelection();
          //     } else
          //       return false;
          //   }),
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
          // makeButton("Generate Metamodel",
          //   function (e: any, obj: any) {
          //     const data = obj?.part?.data;
          //     handleGenerateMetamodel(e?.diagram, data);
          //   },
          //   function (o: any) {
          //     const data = o?.part?.data;
          //     return canGenerateMetamodelFromData(data);
          //   }),
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
              const objecttype = myMetis.findObjectType(node.objecttype?.id || node.objtypeRef) || node.objecttype;
              const objecttypeview = objecttype?.typeview;
              const myContext = {
                objecttype:      objecttype,
                objecttypeview:  objecttypeview,
                relship:         null,
                relshipview:     null,
                relshiptype:     null,
                relshiptypeview: null,
                model:           myMetis.currentModel,
                modelview:       myMetis.currentModelview,
                metamodel:       myMetis.currentMetamodel,
              };
              const modalContext = {
                what:      "editObjectType",
                title:     "Edit Object Type",
                icon:      icon,
                myDiagram: myDiagram,
                myContext: myContext,
              };
              myMetis.currentNode = node;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(node, modalContext);
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECTTYPE) {
                return true;
              }
              return false;
            }),
          // makeButton("Change Object Type",
          //   function (e: any, obj: any) {
          //     const node = obj.part.data;
          //     const currentType = node.objecttype;
          //     const myMetamodel = myMetis.currentMetamodel;
          //     const objtypes = myMetamodel.getObjectTypes();
          //     node.choices = [];
          //     if (objtypes) {
          //       for (let i = 0; i < objtypes.length; i++) {
          //         const otype = objtypes[i];
          //         if (!otype.markedAsDeleted) {
          //           if (otype.name === 'Generic' || otype.name === 'Element')
          //             continue;
          //           node.choices.push(otype.name);
          //         }
          //       }
          //     }
          //     const modalContext = {
          //       what: "selectDropdown",
          //       title: "Select Object Type",
          //       case: "Change Object type",
          //       myDiagram: myDiagram
          //     }
          //     myMetis.currentNode = node;
          //     myMetis.myDiagram = myDiagram;
          //     myDiagram.handleOpenModal(node.choices, modalContext);
          //   },
          //   function (o: any) {
          //     const node = o.part.data;
          //     if (node.category === constants.gojs.C_OBJECT) {
          //       return true;
          //     }
          //     return false;
          //   }),
          // makeButton("Show Typeview",
          //   function (e: any, obj: any) {
          //     const node = obj.part.data;
          //     uid.editObjectTypeview(node, myMetis, myDiagram, true);
          //   },
          //   function (o: any) {
          //     // return false;
          //     const node = o.part.data;
          //     if (node.category === constants.gojs.C_OBJECT)
          //       if (node.isSelected) {
          //         return true;
          //       } else {
          //         myDiagram.clearSelection();
          //         node.isSelected = true;
          //         uid.addToSelection(node, myDiagram);
          //         return true;
          //       }
          //     // else if (node.category === constants.gojs.C_OBJECTTYPE)
          //     //   return true;
          //     else
          //       return false;
          //   }),
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
          // makeButton("Convert to Group",
          //   function (e: any, obj: any) {
          //     handleConvertToGroup(e?.diagram, obj?.part);
          //   },
          //   function (o: any) {
          //     return canConvertToGroup(o?.part?.data);
          //   }),
          // makeButton("Convert to Node",
          //   function (e: any, obj: any) {
          //     handleConvertToNode(e?.diagram, obj?.part);
          //   },
          //   function (o: any) {
          //     return canConvertToNode(o?.part?.data);
          //   }),
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
              const layoutList = () => getLayoutOptions();
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
                // show for normal group views that are expanded
                if (objview?.isGroup) {
                  if (objview?.isExpanded === true)
                    return true;
                }
                // also show for Container viewkind
                if (objview?.viewkind === 'Container') return true;
              }
              return false;
            }
          ),
          // makeButton("Do Layout",
          //   function (e: any, obj: any) {
          //     let layout = ""
          //     let node = obj.part.data;
          //     const key = node.key;
          //     const objview = myMetis.findObjectView(key);
          //     if (objview) {
          //       if (!objview?.isGroup) {
          //         const mySelection = myDiagram.selection;
          //         uid.doTreeLayout(mySelection, myModelview, myDiagram, true);

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

            //     } else {
            //       if (objview?.groupLayout !== "ManualLayout")
            //         uid.doGroupLayout(objview, myDiagram, myMetis);
            //     }
            //   }
            //   myDiagram.requestUpdate();
            // },
            // function (obj: any) {
            //   let node = obj.part.data;
            //   const key = node.key;
            //   const objview = myMetis.findObjectView(key);
            //   if (objview?.isGroup)
            //     return true;
            //   else
            //     return false;
            // }),
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
          // makeButton("Edit Relationship",
          //   function (e: any, obj: any) {
          //     const link = obj.part.data;
          //     const relship = myMetis.findRelationship(link?.relshipRef);
          //     const relshipview = myMetis.findRelationshipView(link?.relviewRef);
          //     const relshiptype = myMetis.findRelationshipType(relship?.typeRef);
          //     const relshiptypeview = relshiptype?.typeview;
          //     const myContext = {
          //       object:     null,
          //       objectview: null,
          //       objecttype: null,
          //       objecttypeview: null,
          //       relship:    relship,
          //       relshipview: relshipview,
          //       relshiptype: relshiptype,
          //       relshiptypeview: relshiptypeview,
          //       model:      myMetis.currentModel,
          //       modelview:  myMetis.currentModelview,
          //       metamodel:  myMetis.currentMetamodel,
          //   }
          //     const modalContext = {
          //       what: "editRelationship",
          //       title: "Edit Relationship",
          //       myDiagram: myDiagram,
          //       myContext:  myContext,
          //     }
          //     myMetis.currentLink = link;
          //     myMetis.myDiagram = myDiagram;
          //     myDiagram.handleOpenModal(link, modalContext);
          //     // 
          //   },
          //   function (o: any) {
          //     const link = o.part.data;
          //     if (link.category === constants.gojs.C_RELATIONSHIP) {
          //       return true;
          //     }
          //     return false;
          //   }),
          // makeButton("Edit Relationship View",
          //   function (e: any, obj: any) {
          //     const link = obj.part.data;
          //     const relship = myMetis.findRelationship(link?.relshipRef);
          //     const relshipview = myMetis.findRelationshipView(link?.relviewRef);
          //     const relshiptype = myMetis.findRelationshipType(relship?.reltypeRef);
          //     const relshiptypeview = relshiptype?.typeview;
          //     const myContext = {
          //       object:     null,
          //       objectview: null,
          //       objecttype: null,
          //       objecttypeview: null,
          //       relship:    relship,
          //       relshipview: relshipview,
          //       relshiptype: relshiptype,
          //       relshiptypeview: relshiptypeview,
          //       model:      myMetis.currentModel,
          //       modelview:  myMetis.currentModelview,
          //       metamodel:  myMetis.currentMetamodel,
          //   }
          //     const modalContext = {
          //       what: "editRelshipview",
          //       title: "Edit Relationship View",
          //       myDiagram: myDiagram,
          //       myContext:  myContext,
          //     }
          //     myMetis.currentLink = link;
          //     myMetis.myDiagram = myDiagram;
          //     myDiagram.handleOpenModal(link, modalContext);
          //     // 
          //   },
          //   function (o: any) {
          //     const link = o.part.data;
          //     if (link.category === constants.gojs.C_RELATIONSHIP) {
          //       return true;
          //     }
          //     return false;
          //   }),
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
              uid.editRelationshipType(link, myMetis, myDiagram);
            },
            function (o: any) {
              const link = o.part.data;
              if (link.category === constants.gojs.C_RELSHIPTYPE) {
                return true;
              }
              return false;
            }),
          // makeButton("Change Relationship Type",
          //   function (e, obj) {
          //     const myGoModel = myMetis.gojsModel;
          //     const myModelview = myMetis.currentModelview;
          //     const myMetamodel = myMetis.currentMetamodel;
          //     let includeInheritedReltypes = myModelview.includeInheritedReltypes;
          //     let includeIsType = false;
          //     const link = obj.part.data;
          //     const relshipRef = link.relshipRef;
          //     const relship = myMetis.findRelationship(relshipRef);
          //     let fromTypeId = relship.fromObject.type.id;
          //     let fromType = myMetamodel.findObjectType(fromTypeId);
          //     if (!fromType) fromType = myMetis.findObjectType(fromTypeId);
          //     let toTypeId = relship.toObject.type.id;
          //     let toType = myMetamodel.findObjectType(toTypeId);
          //     if (!toType) toType = myMetis.findObjectType(toTypeId);
          //     if (fromType?.name === constants.types.AKM_ENTITY_TYPE && 
          //       toType?.name === constants.types.AKM_ENTITY_TYPE) {
          //         includeIsType = true;
          //     }              
          //     let reltypes = myMetamodel.findRelationshipTypesBetweenTypes(fromType, toType, includeInheritedReltypes);
          //     const rtypes = myMetis.findRelationshipTypesBetweenTypes(fromType, toType, true);
          //     for (let i = 0; i < rtypes?.length; i++) {
          //       const rtype = rtypes[i];
          //       if (rtype.name === constants.types.AKM_GENERIC_REL) {
          //         reltypes.push(rtype);
          //       }
          //       if (rtype.name === constants.types.AKM_REFERS_TO) {
          //         reltypes.push(rtype);
          //       }
          //     }
          //     link.choices = [];
          //     if (reltypes) {
          //       for (let i = 0; i < reltypes?.length; i++) {
          //         const rtype = reltypes[i];
          //         link.choices.push(rtype.name);
          //       }
          //       if (includeIsType) {
          //         reltypes.push(constants.types.AKM_IS);
          //       }
          //       let uniqueSet = utils.removeArrayDuplicates(link.choices);
          //       link.choices = uniqueSet;
          //     }
          //     const args = {
          //       typeNames: link.choices,
          //     }
          //     const modalContext = {
          //       what: "selectDropdown",
          //       title: "Select Relationship Type",
          //       case: "Change Relationship type",
          //       myDiagram: myDiagram,
          //       args: args,
          //     }
          //     myMetis.currentLink = link;
          //     myMetis.myDiagram = myDiagram;
          //     myDiagram.handleOpenModal(link.choices, modalContext);
          //   },
          //   function (o) {
          //     const link = o.part.data;
          //     if (link.category === constants.gojs.C_RELATIONSHIP) {
          //       return true;
          //     } else {
          //       return false;
          //     }
          //   }),
          // makeButton("Show Typeview",
          //   function (e: any, obj: any) {
          //     const link = obj.part.data;
          //     uid.editRelshipTypeview(link, myMetis, myDiagram, true);
          //   },
          //   function (o: any) {
          //     // return false;
          //     const link = o.part.data;
          //     if (link.category === constants.gojs.C_RELATIONSHIP)
          //       return true;
          //     // if (link.category === constants.gojs.C_RELSHIPTYPE)
          //     //   return true;
          //   }),
          // makeButton("Reset to Typeview",
          //   function (e: any, rel: any) {
          //     let selection = myDiagram.selection;
          //     if (selection.count == 0) {
          //       const currentLink = rel.part.data;
          //       if (currentNode) myDiagram.select(myDiagram.findLinkForKey(currentLink.key));
          //       selection = myDiagram.selection;
          //     }
          //     const myGoModel = myMetis.gojsModel;
          //     myDiagram.selection.each(function (sel) {
          //       const inst = sel.data;
          //       if (inst.category === constants.gojs.C_RELATIONSHIP) {
          //         uid.resetToTypeview(inst, myMetis, myDiagram);
          //       }
          //     })
          //   },
          //   function (o: any) {
          //     const link = o.part.data;
          //     if (link.category === constants.gojs.C_RELATIONSHIP) {
          //       const currentRelship = link.relship;
          //       const currentRelshipView = link.relshipview;
          //       if (currentRelship && currentRelshipView) {
          //         const reltype = currentRelship.type;
          //         const typeView = link.typeview;
          //         const defaultTypeview = reltype.typeview;
          //         if (typeView && (typeView.id !== defaultTypeview.id)) {
          //           return true;
          //         }
          //       }
          //       return true;
          //     }
          //     else if (link.category === constants.gojs.C_RELSHIPTYPE) {
          //       return false;
          //     }
          //     return false;
          //   }),
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
          // makeButton("----------"),
          // makeButton("Select all views of this relationship",
          //   function (e: any, obj: any) {
          //     const link = obj.part.data;
          //     let relship = myMetis.findRelationship(link.relship?.id);
          //     if (!relship) relship = myMetis.findRelationship(link.relshipRef);
          //     const links = myDiagram.links;
          //     for (let it = links.iterator; it?.next();) {
          //       const link = it.value;
          //       if (link.data.relship.id == relship.id) {
          //         link.isSelected = true;
          //       }
          //     }
          //   },
          //   function (o: any) {
          //     const link = o.part.data;
          //     let relship = myMetis.findRelationship(link.relship?.id);
          //     if (!relship) relship = myMetis.findRelationship(link.relshipRef);
          //     const links = myDiagram.links;
          //     let cnt = 0;
          //     for (let it = links.iterator; it?.next();) {
          //       const link = it.value;
          //       if (link.data.relship.id == relship.id) {
          //         cnt++;
          //       }
          //     }
          //     if (cnt > 1)
          //       return true;
          //     else
          //       return false;
          //   }),
          // makeButton("Select all relationships of this type",
          //   function (e: any, obj: any) {
          //     const link = obj.part.data;
          //     let currentRelship = myMetis.findRelationship(link.relship?.id);
          //     if (!currentRelship) currentRelship = myMetis.findRelationship(link.relshipRef);
          //     const currentType = currentRelship?.type as akm.cxRelationshipType;
          //     const links = myDiagram.links;
          //     for (let it = links.iterator; it?.next();) {
          //       const link = it.value;
          //       if (link.data.relshiptype?.id == currentType?.id) {
          //         link.isSelected = true;
          //       }
          //     }
          //   },
          //   function (o: any) {
          //     return true;
          //   }),
          // makeButton("Add to Selection",
          //   function (e: any, obj: any) {
          //     uid.addToSelection(obj, myDiagram);
          //   },
          //   function (o: any) {
          //     return true;
          //   }),
          // makeButton("Clear Path",
          //   function (e: any, obj: any) {
          //     let mySelection = myDiagram.selection;
          //     const selectedLinks = [];
          //     mySelection.each(function(l) {
          //       if (l instanceof go.Node) 
          //         return;
          //       else
          //       selectedLinks.push(l);
          //       uid.clearPath(selectedLinks, myMetis, myDiagram);
          //     });
          //   },
          //   function (obj: any) {
          //     const link = obj.part.data;
          //     if (link.points)
          //       return true;
          //     else
          //       return false;
          //   }),
          // makeButton("Swap Direction",
          //   function (e: any, obj: any) {
          //     let mySelection = myDiagram.selection;
          //     const selectedLinks = [];
          //     if (mySelection.count === 0) {
          //       try {
          //         const key = (linkPart && linkPart.data && linkPart.data.key) || null;
          //         if (key) {
          //           const linkNode = targetDiagram.findLinkForKey(key);
          //           if (linkNode) targetDiagram.select(linkNode);
          //           selection = targetDiagram.selection;
          //         } else if (linkPart) {
          //           // fallback: use the linkPart directly
          //           selectedLinks.push(linkPart);
          //         }
          //       } catch (_) { }
          //     }
          //     mySelection.each(function(l) {
          //       if (l instanceof go.Node) 
          //         return;
          //       else {
          //         selectedLinks.push(l);
          //       }
          //     });
          //     uid.swapDirection(selectedLinks, myMetis, myDiagram);
          //   },
          //   function (obj: any) {
          //     const link = obj.part.data;
          //     const modelview = myMetis.currentModelview;
          //     const metamodel = myMetis.currentMetamodel;
          //     if (uid.swapDirectionIsAllowed(link, modelview, metamodel))
          //       return true;
          //     return false;
          //   }),
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
            }),
          makeButton("Delete Current Modelview",
            function (e: any, obj: any) {
              if (confirm('Do you really want to delete the current modelview?')) {
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
              return cnt > 1;
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
              return myMetis.modelType !== 'Metamodelling' && !!myMetis.currentTargetMetamodel;
            }),
          makeButton("Set Target Model",
            function (e: any, obj: any) {
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
            }),
          makeButton("Update Project from AdminModel",
            function (e: any, obj: any) {
              let adminModel = myMetis.adminModel;
              if (adminModel) {
                uid.updateProjectFromAdminmodel(myMetis, myDiagram);
              }
            },
            function (o: any) {
              const adminModel = myMetis.adminModel;
              const currentModel = myMetis.currentModel;
              return myMetis.modelType !== 'Metamodelling' && currentModel.id === adminModel.id;
            }),
          makeButton("----------",
            function (e: any, obj: any) {
            },
            function (o: any) {
              return myMetis.modelType !== 'Metamodelling';
            }),
          makeButton("Select all objects of type",
            function (e: any, obj: any) {
              const myModel = myMetis.currentModel;
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
              return myMetis.modelType !== 'Metamodelling';
            }),
          makeButton("Select by Object Name",
            function (e: any, obj: any) {
              const value = prompt('Enter name ', "");
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
              return myMetis.modelType !== 'Metamodelling';
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
              return myMetis.modelType !== 'Metamodelling';
            }),
          makeButton("Unhide Hidden Relationship Views",
            function (e: any, obj: any) {
              const modelview = myMetis.currentModelview;
              uic.unhideHiddenRelationshipViews(modelview, myMetis);
              return;
            },
            function (o: any) {
              return myMetis.modelType !== 'Metamodelling';
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
              return myMetis.modelType !== 'Metamodelling';
            }),
          makeButton("Delete Invisible Objects",
            function (e: any, obj: any) {
              uid.deleteInvisibleObjects(myMetis, myDiagram);
            },
            function (o: any) {
              return myMetis.modelType !== 'Metamodelling';
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
              return myDiagram.selection.count > 0;
            }),
          // makeButton("----------",
          //   function (e: any, obj: any) {
          //   },
          //   function (o: any) {
          //     if (myMetis.modelType === 'Metamodelling')
          //       return false;
          //     return true;
          //   }),
          // makeButton("Zoom All",
          //   function (e: any, obj: any) {
          //     e.diagram.commandHandler.zoomToFit();
          //   },
          //   function (o: any) {
          //     return true;
          //   }),
          // makeButton("Zoom Selection",
          //   function (e: any, obj: any) {
          //     let selected = myDiagram.selection;
          //     let x1 = 0;
          //     let y1 = 0;
          //     let x2 = 0;
          //     let y2 = 0;
          //     let w = 0;
          //     let h = 0;
          //     myDiagram.selection.each(function (node) {
          //       if (x1 == 0) x1 = node.actualBounds.x;
          //       if (y1 == 0) y1 = node.actualBounds.y;
          //       if (w == 0) w = node.actualBounds.width;
          //       if (h == 0) h = node.actualBounds.height;
          //       x2 = x1 + w;
          //       y2 = y1 + h;
          //       const X1 = node.actualBounds.x;
          //       if (X1 < x1) x1 = X1;
          //       const Y1 = node.actualBounds.y;
          //       if (Y1 < y1) y1 = Y1;
          //       const W = node.actualBounds.width;
          //       const X2 = X1 + W;
          //       const H = node.actualBounds.height;
          //       const Y2 = Y1 + H;
          //       // Compare
          //       if (X2 > x2) x2 = X2;
          //       if (Y2 > y2) y2 = Y2;
          //       w = x2 - x1;
          //       h = y2 - y1;
          //     });
          //     const rect = new go.Rect(x1, y1, w, h);
          //     myDiagram.zoomToRect(rect);
          //   },
          //   function (o: any) {
          //     if (myDiagram.selection.count > 0)
          //       return true;
          //     return false;
          //   }),
          // makeButton("Set Layout Scheme",
          // function (e: any, obj: any) {
          //   const layoutList = () => getLayoutOptions();
          //   const llist = layoutList();
          //   const layoutLabels = llist.map(ll => (ll) && ll.label);
          //   const modalContext = {
          //     what: "selectDropdown",
          //     title: "Set Layout Scheme",
          //     case: "Set Layout Scheme",
          //     layoutList: layoutList(),
          //     myDiagram: myDiagram
          //   }
          //   myMetis.myDiagram = myDiagram;
          //   myDiagram.handleOpenModal(myDiagram, modalContext);
          // },
          // function (o: any) {
          //   return true;
          //   }),
          // makeButton("Do Layout",
          //   function (e: any, obj: any) {
          //     const myModelview = myMetis.currentModelview;
          //     myDiagram.modelview = myModelview;
          //     let layout = "";
          //     const modifiedRelshipViews = new Array();
          //     if (myMetis.modelType === 'Modelling') {
          //       myDiagram.selection.each(function (sel) {
          //         const link = sel.data;
          //         if (link.category === constants.gojs.C_RELATIONSHIP) {
          //           const fromLink = link.from;
          //           const toLink = link.to;
          //           let relview: akm.cxRelationshipView;
          //           relview = myDiagram.modelview.findRelationshipView(link.key);
          //           if (relview) {
          //             const fromObjview = relview.fromObjview;
          //             const toObjview = relview.toObjview;
          //             link.points = [];
          //             link.from = fromLink;
          //             link.to = toLink;
          //             myDiagram.model.setDataProperty(link, "points", []);
          //             relview.points = [];
          //             relview.fromObjview = fromObjview;
          //             relview.toObjview = toObjview;
          //             const jsnRelView = new jsn.jsnRelshipView(relview);
          //             modifiedRelshipViews.push(jsnRelView);
          //           }
          //         }
          //       });

          //       myModelview.clearRelviewPoints();
          //       const myGoModel = myMetis.gojsModel;
          //       layout = myGoModel.modelView?.layout;
          //     } else if (myMetis.modelType === 'Metamodelling') {
          //       const myMetamodel = myMetis.currentMetamodel;
          //       layout = myMetamodel.layout;
          //     }
          //     setLayout(myDiagram, layout);
          //     // Save layout
          //     const nodes = myDiagram.nodes;
          //     for (let it = nodes.iterator; it?.next();) {
          //       const node = it.value;
          //       const data = node.data;
          //       let objview = data.objectview;
          //       if (!objview)
          //         objview = myModelview.findObjectView(data.objviewRef);
          //       if (objview) {
          //         objview.loc = data.loc;
          //       }
          //     }

          //     modifiedRelshipViews.map(mn => {
          //       let data = mn;
          //       data = JSON.parse(JSON.stringify(data));
          //       e.diagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
          //     })


          //     const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
          //     let data = { metis: jsnMetis }
          //     data = JSON.parse(JSON.stringify(data));
          //     myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data });
          //   },
          //   function (o: any) {
          //     return true;
          //   }),
          // makeButton("Save Layout",
          //   function (e: any, obj: any) {
          //     if (myMetis.modelType === 'Metamodelling') {
          //       const myMetamodel = myMetis.currentMetamodel;
          //       const nodes = myDiagram.nodes;
          //       const objtypegeos = [];
          //       for (let it = nodes.iterator; it?.next();) {
          //         const node = it.value;
          //         const data = node.data;
          //         const objtype = data.objecttype;
          //         if (objtype) {
          //           const objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), myMetamodel, objtype, "", "");
          //           objtypeGeo.setLoc(data.loc);
          //           objtypeGeo.setSize(data.size);
          //           objtypeGeo.setModified();
          //           objtypegeos.push(objtypeGeo);
          //         }
          //       }
          //       myMetamodel.objtypegeos = objtypegeos;
          //     } else if (myMetis.modelType === 'Modelling') {
          //       const myModelview = myMetis.currentModelview;
          //       const nodes = myDiagram.nodes;
          //       for (let it = nodes.iterator; it?.next();) {
          //         const node = it.value;
          //         const data = node.data;
          //         let objview = data.objectview;
          //         if (!objview)
          //           objview = myModelview.findObjectView(data.objviewRef);
          //         if (objview) {
          //           objview.loc = data.loc;
          //         }
          //       }
          //     }
          //     const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
          //     let data = { metis: jsnMetis }
          //     data = JSON.parse(JSON.stringify(data));
          //     myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data });
          //   },
          //   function (o: any) {
          //     if (myMetis.modelType === 'Metamodelling')
          //       return true;
          //     else
          //       return true;
          //   }),
          /* Set Link Routing and Set Link Curve moved into the Layout submenu */
          // makeButton("----------",
            // function (e: any, obj: any) {
            // },
            // function (o: any) {
            //   if (myMetis.modelType === 'Metamodelling')
            //     return false;
            //   return true;
            // }),
          // makeButton("Verify and Repair Model",
          //   function (e: any, obj: any) {
          //     const myModel = myMetis.currentModel;
          //     const modelviews = myModel.modelviews;
          //     const myMetamodel = myMetis.currentMetamodel;
          //     const myGoModel = myMetis.gojsModel;
          //     myDiagram.myGoModel = myGoModel;
          //     uic.verifyAndRepairModel(myModel, myMetamodel, modelviews, myDiagram, myMetis);
          //     alert("The current model has been repaired");
          //   },
          //   function (o: any) {
          //     if (myMetis.modelType === 'Metamodelling')
          //       return false;
          //     return true;
          //   }),
          // makeButton("!!! PURGE DELETED !!!",
          //   function (e: any, obj: any) {
          //     if (confirm('Do you really want to permamently delete all instances marked as deleted?')) {
          //       uic.purgeModelDeletions(myMetis, myDiagram);
          //     }
          //   },
          //   function (o: any) {
          //     // if (myMetis.modelType === 'Metamodelling')
          //     //   return false;
          //     return true;
          //   }),
          // makeButton("----------",
          //   function (e: any, obj: any) {
          //   },
          //   function (o: any) {
          //     if (myMetis.modelType === 'Metamodelling')
          //       return false;
          //     return true;
          //   }),
          // makeButton("New Metamodel",
          //   function (e: any, obj: any) {
          //     uid.newMetamodel(myMetis, myDiagram);
          //   },
          //   function (o: any) {
          //     if (myMetis.modelType === 'Metamodelling')
          //       return false;
          //     else if (uic.isGenericMetamodel(myMetis)) {
          //       return false;
          //     }
          //     return true;
          //   }),
          // makeButton("Generate Metamodel",
          //   function (e: any, obj: any) {
          //     gen.generateTargetMetamodel(obj, myMetis, myDiagram);
          //   },
          //   function (o: any) {
          //     if (myMetis.modelType === 'Metamodelling')
          //       return false;
          //     else if (uic.isGenericMetamodel(myMetis)) {
          //       return false;
          //     }
          //     return false;
          //   }),
          // makeButton("Replace Current Metamodel",
          //   function (e: any, obj: any) {
          //     uid.replaceCurrentMetamodel(myMetis, myDiagram);
          //   },
          //   function (o: any) {
          //     if (myMetis.modelType === 'Metamodelling')
          //       return false;
          //     else if (uic.isGenericMetamodel(myMetis)) {
          //       return false;
          //     }
          //     return true;
          //   }),
          // makeButton("Add Metamodel",
          //   function (e: any, obj: any) {
          //     const isSubMetamodel = false;
          //     uid.addMetamodel(myMetis, myDiagram, isSubMetamodel);
          //   },
          //   function (o: any) {
          //     if (myMetis.modelType === 'Metamodelling') {
          //       return false;
          //     } else if (uic.isGenericMetamodel(myMetis)) {
          //       return false;
          //     } else {
          //       const noMetamodels = myMetis.metamodels.length;
          //       if (noMetamodels >= 2)
          //         return true;
          //       else
          //         return false;
          //     }
          //   }),
          // makeButton("Add Sub-Metamodel",
          //   function (e: any, obj: any) {
          //     const isSubMetamodel = true;
          //     uid.addMetamodel(myMetis, myDiagram, isSubMetamodel);
          //   },
          //   function (o: any) {
          //     if (myMetis.modelType === 'Metamodelling') {
          //       return false;
          //     } else if (uic.isGenericMetamodel(myMetis)) {
          //       return false;
          //     } else {
          //       return true;
          //     }
          //   }),
          // makeButton("Delete Metamodel",
          //   function (e: any, obj: any) {
          //     uid.deleteMetamodel(myMetis, myDiagram);
          //   },
          //   function (o: any) {
          //     if (myMetis.modelType === 'Metamodelling') {
          //       return false;
          //     } else if (uic.isGenericMetamodel(myMetis)) {
          //       return false;
          //     }
          //     let cnt = 0;
          //     const metamodels = myMetis.metamodels;
          //     for (let i = 0; i < metamodels.length; i++) {
          //       const metamodel = metamodels[i];
          //       if (metamodel.markedAsDeleted)
          //         continue;
          //       cnt++;
          //     }
          //     if (cnt > 1)
          //       return true;
          //     else
          //       return false;
          //   }),
          // makeButton("Clear Metamodel Content",
          //   function (e: any, obj: any) {
          //     uid.clearMetamodel(myMetis, myDiagram);
          //   },
          //   function (o: any) {
          //     if (myMetis.modelType === 'Metamodelling') {
          //       return false;
          //     } else if (uic.isGenericMetamodel(myMetis)) {
          //       return false;
          //     }
          //     let cnt = 0;
          //     const metamodels = myMetis.metamodels;
          //     for (let i = 0; i < metamodels.length; i++) {
          //       const metamodel = metamodels[i];
          //       if (metamodel.markedAsDeleted)
          //         continue;
          //       cnt++;
          //     }
          //     if (cnt > 1)
          //       return true;
          //     else
          //       return false;
          //   }),
          // makeButton("Verify and Repair Metamodels",
          //   function (e: any, obj: any) {
          //     uic.verifyAndRepairMetamodels(myMetis, myDiagram);
          //     alert("The metamodels have been repaired");
          //   },
          //   function (o: any) {
          //     // if (myMetis.modelType === 'Metamodelling')
          //     //   return false;
          //     return true;
          //   }),
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
          // makeButton("Toggle Cardinality On/Off",
          //   function (e: any, obj: any) {
          //     const modelview = myMetis.currentModelview;
          //     if (modelview.showCardinality == undefined)
          //       modelview.showCardinality = true;
          //     modelview.showCardinality = !modelview.showCardinality;
          //     if (!modelview.showCardinality) {
          //       alert("Cardinality on relationships will NOT be shown!");
          //     } else {
          //       alert("Cardinality on relationships WILL be shown!");
          //     }
          //     const jsnModelview = new jsn.jsnModelView(modelview);
          //     const modifiedModelviews = new Array();
          //     modifiedModelviews.push(jsnModelview);
          //     modifiedModelviews.map(mn => {
          //       let data = mn;
          //       data = JSON.parse(JSON.stringify(data));
          //       e.diagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
          //     })
          //   },
          //   function (o: any) {
          //     if (myMetis.modelType === 'Metamodelling')
          //       return false;
          //     return true;
          //   }),
          // makeButton("Toggle 'Include Relationship Kind' On/Off",
          //   function (e: any, obj: any) {
          //     const model = myMetis.currentModel;
          //     const relkind = model.includeRelshipkind;
          //     model.includeRelshipkind = !relkind;
          //     if (!model.includeRelshipkind) {
          //       alert("Setting 'Relationship Kind' will NOT be allowed!");
          //     } else {
          //       alert("Setting 'Relationship Kind' WILL be allowed!");
          //     }
          //     const jsnModel = new jsn.jsnModel(model, true);
          //     const modifiedModels = new Array();
          //     modifiedModels.push(jsnModel);
          //     modifiedModels.map(mn => {
          //       let data = mn;
          //       data = JSON.parse(JSON.stringify(data));
          //       e.diagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
          //     })
          //   },
          //   function (o: any) {
          //     return true;
          //   }),
          // makeButton("Toggle Show Relationship Names On/Off",
          //   function (e: any, obj: any) {
          //     const modelview = myMetis.currentModelview;
          //     if (modelview.showRelshipNames == undefined)
          //       modelview.showRelshipNames = true;
          //     modelview.showRelshipNames = !modelview.showRelshipNames;
          //     if (!modelview.showRelshipNames) {
          //       alert("Relationship Names will NOT be shown!");
          //     } else {
          //       alert("Relationship Names will be shown!");
          //     }
          //     const jsnModelview = new jsn.jsnModelView(modelview);
          //     const modifiedModelviews = new Array();
          //     modifiedModelviews.push(jsnModelview);
          //     modifiedModelviews.map(mn => {
          //       let data = mn;
          //       data = JSON.parse(JSON.stringify(data));
          //       e.diagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
          //     })
          //   },
          //   function (o: any) {
          //     if (myMetis.modelType === 'Metamodelling')
          //       return false;
          //     return true;
          //   }),
          // makeButton("Toggle 'Ask for Relationship Name' On/Off",
          //   function (e: any, obj: any) {
          //     const modelview = myMetis.currentModelview;
          //     if (modelview.askForRelshipName == undefined)
          //       modelview.askForRelshipName = false;
          //     modelview.askForRelshipName = !modelview.askForRelshipName;
          //     if (!modelview.askForRelshipName) {
          //       alert("Relationship names will NOT be asked for!");
          //     } else {
          //       alert("Relationship names WILL be asked for!");
          //     }
          //     const jsnModelview = new jsn.jsnModelView(modelview);
          //     const modifiedModelviews = new Array();
          //     modifiedModelviews.push(jsnModelview);
          //     modifiedModelviews.map(mn => {
          //       let data = mn;
          //       data = JSON.parse(JSON.stringify(data));
          //       e.diagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
          //     })
          //   },
          //   function (o: any) {
          //     return false;
          //   }),
          // makeButton("Toggle 'Include Inherited Relshiptypes' On/Off",
          //   function (e: any, obj: any) {
          //     const modelview = myMetis.currentModelview;
          //     if (modelview.includeInheritedReltypes == undefined)
          //       modelview.includeInheritedReltypes = false;
          //     modelview.includeInheritedReltypes = !modelview.includeInheritedReltypes;
          //     if (!modelview.includeInheritedReltypes) {
          //       alert("Inherited Relationship types are NOT included!");
          //     } else {
          //       alert("Inherited Relationship types ARE included!");
          //     }
          //     // Dispatch
          //     const jsnModelview = new jsn.jsnModelView(modelview);
          //     const modifiedModelviews = new Array();
          //     modifiedModelviews.push(jsnModelview);
          //     modifiedModelviews.map(mn => {
          //       let data = mn;
          //       data = JSON.parse(JSON.stringify(data));
          //       e.diagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
          //     })
          //   },
          //   function (o: any) {
          //     return true;
          //   }),
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
  let pendingBackgroundDispose = false;
  let docPointerDownHandler: ((e: PointerEvent) => void) | null = null;
  let suppressMenuDispose = false; // Transient flag to prevent menu disposal while select/input is handling events

      const disposeSubMenu = () => {
        if (activeSubMenuDiv && activeSubMenuDiv.parentElement?.contains(activeSubMenuDiv)) {
          activeSubMenuDiv.parentElement.removeChild(activeSubMenuDiv);
        }
        activeSubMenuDiv = null;
        // If a background dispose was requested while a submenu was open, complete it now.
        if (pendingBackgroundDispose) {
          pendingBackgroundDispose = false;
          try { disposeBackgroundMenu(); } catch (_) { /* ignore */ }
        }
      };

      const closeAllMenus = () => {
        // forcefully remove sub menu and main menu immediately
        try {
          if (activeSubMenuDiv && activeSubMenuDiv.parentElement?.contains(activeSubMenuDiv)) activeSubMenuDiv.parentElement.removeChild(activeSubMenuDiv);
        } catch (_) {}
        try {
          if (activeMenuDiv && activeMenuDiv.parentElement?.contains(activeMenuDiv)) activeMenuDiv.parentElement.removeChild(activeMenuDiv);
        } catch (_) {}
        activeSubMenuDiv = null;
        activeMenuDiv = null;
        lastAnchorElement = null;
        pendingBackgroundDispose = false;
        if (docPointerDownHandler) {
          try { document.removeEventListener('pointerdown', docPointerDownHandler as EventListener); } catch (_) {}
          docPointerDownHandler = null;
        }
      };

      const disposeBackgroundMenu = () => {
        // If a submenu is currently open, defer disposing the background menu until the submenu is closed.
        if (activeSubMenuDiv) {
          pendingBackgroundDispose = true;
          return;
        }
        pendingBackgroundDispose = false;
        disposeSubMenu();
        if (activeMenuDiv && activeMenuDiv.parentElement?.contains(activeMenuDiv)) {
          activeMenuDiv.parentElement.removeChild(activeMenuDiv);
        }
        // remove any document-level pointerdown handler
        if (docPointerDownHandler) {
          try { document.removeEventListener('pointerdown', docPointerDownHandler as EventListener); } catch (_) {}
          docPointerDownHandler = null;
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
        menu.style.padding = "0 0";
        menu.style.zIndex = "9999";
        menu.addEventListener("contextmenu", (ev) => ev.preventDefault());
        menu.addEventListener("mousedown", (ev) => ev.stopPropagation());

        // Optional small heading for the whole menu. Callers can set (items as any).menuHeading = 'My Heading'
        const menuHeading = (items as any)?.menuHeading;
        if (menuHeading) {
          const header = document.createElement('div');
          header.textContent = menuHeading;
          header.style.padding = '6px 16px';
          header.style.fontSize = '12px';
          header.style.fontWeight = '600';
          header.style.color = '#222';
          // make the heading background a little darker than the menu body
          header.style.background = '#f0f0f0';
          header.style.borderBottom = '1px solid #e0e0e0';
          header.style.marginBottom = '4px';
          menu.appendChild(header);
        }

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
          // If the item provides a custom render function, let it populate the button
          if (typeof (item as any).render === 'function') {
            try { (item as any).render(button, diagram, tool, item); } catch (e) { if ((window as any).DEBUG_GOJS_MENUS) console.debug('menu item render failed', e); }
          } else {
            button.textContent = item.label ?? "";
          }
          button.style.display = "block";
          button.style.width = "100%";
          // leave extra right padding so a submenu arrow can be shown without overlapping text
          button.style.padding = "6px 36px 6px 16px";
          button.style.textAlign = "left";
          button.style.background = "transparent";
          button.style.border = "none";
          button.style.cursor = "pointer";
          button.style.fontSize = "13px";
          // allow items to mark themselves as 'danger' (e.g., destructive actions)
          button.style.color = (item as any).danger ? '#c00' : '#333';
          button.style.position = 'relative';

          let hoverTimer: number | null = null;

          // show a right-arrow for items that open a submenu (convention: action present and closeOnClick === false)
          if (item.action && item.closeOnClick === false) {
            const arrow = document.createElement('span');
            arrow.className = 'gojs-html-context-menu__arrow';
            arrow.textContent = '\u25B6'; // black right-pointing triangle ▶
            arrow.style.position = 'absolute';
            arrow.style.right = '12px';
            arrow.style.top = '50%';
            arrow.style.transform = 'translateY(-50%)';
            arrow.style.pointerEvents = 'none';
            arrow.style.color = '#666';
            arrow.style.fontSize = '11px';
            arrow.style.lineHeight = '1';
            button.appendChild(arrow);
          }

          button.onmouseenter = () => {
            if (!button.disabled) {
              button.style.background = "rgba(0,0,0,0.06)";
            }
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
            if (!button.disabled) {
              button.style.background = "transparent";
            }
            if (hoverTimer) {
              clearTimeout(hoverTimer);
              hoverTimer = null;
            }
          };

          const enabled = item.enabled ? item.enabled(diagram) : true;
          console.log('3805 Menu item:', item.label, 'enabled:', enabled);
          if (!enabled) {
            button.disabled = true;
            button.style.cursor = "default";
            button.style.color = "#888";
            button.style.background = "#f5f5f5";
            button.style.fontWeight = "600";
            button.style.padding = "8px 16px";
            button.style.pointerEvents = "none";
          }

          button.onclick = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            // clear any pending hover timer
            if (hoverTimer) {
              clearTimeout(hoverTimer);
              hoverTimer = null;
            }
            // Only dispose the active sub-menu if this item is supposed to close menus.
            // Items that open submenus should set closeOnClick === false so the parent
            // submenu remains visible while the subsubmenu is shown.
            const shouldCloseSubMenu = item.closeOnClick !== false;
            if (shouldCloseSubMenu) {
              disposeSubMenu();
            }

            if (item.action) {
              item.action(diagram, tool, button);
            }

            // If this item requests the menu to close on click (the default), close the whole background menu.
            if (item.closeOnClick !== false) {
              try { tool.stopTool(); } catch (_) { /* ignore */ }
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
        // add document-level handler to close menus when clicking outside
        if (!docPointerDownHandler) {
          docPointerDownHandler = (ev: PointerEvent) => {
            try {
              // Skip disposal if a select/input is being interacted with (transient suppression)
              if (suppressMenuDispose) {
                return;
              }
              const tgt = ev.target as Node | null;
              const insideMain = activeMenuDiv && tgt && activeMenuDiv.contains(tgt as Node);
              const insideSub = activeSubMenuDiv && tgt && activeSubMenuDiv.contains(tgt as Node);
              if (!insideMain && !insideSub) {
                // force close all menus immediately on outside click
                closeAllMenus();
              }
            } catch (_) {}
          };
          try { document.addEventListener('pointerdown', docPointerDownHandler); } catch (_) {}
        }
      };

      const renderSubMenu = (items: HtmlMenuItem[], diagram: go.Diagram, tool: go.ContextMenuTool, anchor?: HTMLElement) => {
        disposeSubMenu();
        const menu = buildBackgroundMenu(items, diagram, tool);
        document.body.appendChild(menu);
        activeSubMenuDiv = menu;
        // ensure outside-click handler exists so clicking outside will close menus
        if (!docPointerDownHandler) {
          docPointerDownHandler = (ev: PointerEvent) => {
            try {
              const tgt = ev.target as Node | null;
              const insideMain = activeMenuDiv && tgt && activeMenuDiv.contains(tgt as Node);
              const insideSub = activeSubMenuDiv && tgt && activeSubMenuDiv.contains(tgt as Node);
              if (!insideMain && !insideSub) {
                closeAllMenus();
              }
            } catch (_) {}
          };
          try { document.addEventListener('pointerdown', docPointerDownHandler); } catch (_) {}
        }
        // Always update anchor when explicitly provided (the source button being clicked)
        if (anchor) {
          lastAnchorElement = anchor;
        }
        const targetAnchor = anchor || lastAnchorElement;
        
        // IMPORTANT: Always use targetAnchor directly for positioning, not fallbacks to parent menu
        // The targetAnchor should be the button that was clicked to open this submenu
        let anchorRect: DOMRect | null = null;
        // Prefer the actual menu-item button (or its closest ancestor button) as the anchor
        const findAnchorButton = (el?: HTMLElement | null) => {
          try {
            if (!el) return null;
            // If the element is a button already, use it
            if (el.tagName && el.tagName.toLowerCase() === 'button') {
              // Make sure this button is a menu item, not the entire menu container
              if (el.classList.contains(HTML_MENU_ITEM_CLASS)) {
                return el;
              }
              // If it's a button but not a menu item button, still return it (better than nothing)
              return el;
            }
            // Walk up to find a button ancestor (the menu item), but limit search
            let parent: HTMLElement | null = el.parentElement;
            let depth = 0;
            while (parent && depth < 3) {  // Reduced depth to avoid finding parent menu
              if (parent.tagName && parent.tagName.toLowerCase() === 'button' && parent.classList.contains(HTML_MENU_ITEM_CLASS)) {
                return parent;
              }
              parent = parent.parentElement;
              depth++;
            }
            return null;
          } catch (_) { return null; }
        };
        // DEBUG: log anchor info to help diagnose placement issues
        try {
          if (typeof window !== 'undefined' && (window as any).location) {
            try {
              const outer = (targetAnchor && (targetAnchor as HTMLElement).outerHTML) ? String((targetAnchor as HTMLElement).outerHTML).slice(0, 240) : String(targetAnchor);
              console.debug('[renderSubMenu] targetAnchor outerHTML (trunc):', outer);
            } catch (_) {
              console.debug('[renderSubMenu] targetAnchor:', targetAnchor);
            }
          }
        } catch (_) {}
        // if targetAnchor is a nested element (e.g., the arrow span), prefer the enclosing button
        const candidateButton = findAnchorButton(targetAnchor as HTMLElement | null) || targetAnchor as HTMLElement | null;
        try {
          if (candidateButton && candidateButton.getBoundingClientRect) {
            anchorRect = candidateButton.getBoundingClientRect() as DOMRect;
          }
        } catch (e) {
          anchorRect = null;
        }
        
        // If we couldn't get anchorRect from candidateButton, try the activeMenuDiv or other fallbacks
        if ((!anchorRect || (anchorRect.width === 0 && anchorRect.height === 0)) && activeMenuDiv) {
          try { anchorRect = activeMenuDiv.getBoundingClientRect() as DOMRect; } catch (_) { anchorRect = null; }
        }

        // perform positioning in the next animation frame so layout measurements are reliable
        window.requestAnimationFrame(() => {
          try {
            console.debug('[renderSubMenu:rAF] anchorRect computed:', anchorRect);
            console.debug('[renderSubMenu:rAF] candidateButton:', candidateButton && (candidateButton as HTMLElement).outerHTML?.slice ? (candidateButton as HTMLElement).outerHTML.slice(0, 240) : candidateButton);
          } catch (_) {}
          
          // If we still don't have an anchorRect, we cannot position the submenu properly
          // This should rarely happen if buttons are being passed correctly as the source parameter
          if (!anchorRect) {
            try {
              if ((window as any).DEBUG_GOJS_MENUS) console.debug('[renderSubMenu:rAF] WARNING: No valid anchorRect available for positioning submenu');
            } catch (_) {}
            // Try last resort: find hovered item in the active menu
            if (activeMenuDiv) {
              try {
                const hovered = activeMenuDiv.querySelector(`.${HTML_MENU_ITEM_CLASS}:hover`) as HTMLElement | null;
                if (hovered && hovered.getBoundingClientRect) {
                  anchorRect = hovered.getBoundingClientRect() as DOMRect;
                }
              } catch (_) { }
            }
          }

          try {
            console.debug('[renderSubMenu:rAF] computed anchorRect:', anchorRect);
            console.debug('[renderSubMenu:rAF] activeMenuDiv rect:', activeMenuDiv && activeMenuDiv.getBoundingClientRect());
            console.debug('[renderSubMenu:rAF] menu rect:', menu && menu.getBoundingClientRect());
            console.debug('[renderSubMenu:rAF] tool.mouseDownPoint:', (tool as any)?.mouseDownPoint);
            // If DEBUG flag set, visually mark the targetAnchor element (so user can see which DOM node we used)
            if ((window as any).DEBUG_GOJS_MENUS === true && targetAnchor && targetAnchor instanceof HTMLElement) {
              try {
                (targetAnchor as HTMLElement).style.outline = '2px solid rgba(255,0,0,0.9)';
                setTimeout(() => { try { (targetAnchor as HTMLElement).style.outline = ''; } catch (_) {} }, 1200);
              } catch (_) {}
            }
          } catch (_) {}

          if (anchorRect) {
            const menuRect = menu.getBoundingClientRect();
            const viewportLeft = window.pageXOffset + 4;
            const viewportRight = window.pageXOffset + window.innerWidth - 4;
            
            // If anchorRect appears to be the entire menu (width >= 190), try to find the hovered item instead
            if (anchorRect.width >= 190 && activeMenuDiv) {
              try {
                const hovered = activeMenuDiv.querySelector(`.${HTML_MENU_ITEM_CLASS}:hover`) as HTMLElement | null;
                if (hovered && hovered.getBoundingClientRect) {
                  const hoveredRect = hovered.getBoundingClientRect();
                  if (hoveredRect.width > 0 && hoveredRect.height > 0) {
                    anchorRect = hoveredRect as DOMRect;
                  }
                }
              } catch (_) { }
            }
            
            // place submenu to the right of the anchor button
            let left = anchorRect.right + window.pageXOffset + 6;
            // align top of submenu with the top of the anchor button
            let top = anchorRect.top + window.pageYOffset;

            // if there's not enough space on the right, open to the left of the anchor
            if (left + menuRect.width > viewportRight) {
              left = anchorRect.left + window.pageXOffset - menuRect.width - 6;
            }
            left = Math.max(viewportLeft, left);
            const maxTop = window.pageYOffset + window.innerHeight - menuRect.height - 8;
            top = Math.max(window.pageYOffset + 4, Math.min(top, maxTop));
            menu.style.left = `${left}px`;
            menu.style.top = `${top}px`;

            // optional DEBUG visual outline if enabled on the page
            try {
              if ((window as any).DEBUG_GOJS_MENUS === true) {
                menu.style.outline = '2px dashed rgba(0,128,0,0.7)';
                const dbg = document.createElement('div');
                dbg.style.position = 'absolute';
                dbg.style.left = `${anchorRect.left + window.pageXOffset}px`;
                dbg.style.top = `${anchorRect.top + window.pageYOffset}px`;
                dbg.style.width = `${anchorRect.width}px`;
                dbg.style.height = `${anchorRect.height}px`;
                dbg.style.border = '2px dashed rgba(255,0,0,0.7)';
                dbg.style.pointerEvents = 'none';
                dbg.className = 'gojs-html-context-menu__debug-outline';
                document.body.appendChild(dbg);
                window.setTimeout(() => { try { dbg.remove(); } catch (_) {} }, 1200);
              }
            } catch (_) {}
          } else {
            positionBackgroundMenu(menu, diagram, tool);
          }
        });
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

      const isMetamodelDiagramContext = (diagram?: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        if (!targetDiagram) return myMetis.modelType === 'Metamodelling';
        try {
          for (let it = targetDiagram.nodes.iterator; it?.next();) {
            const node = it.value;
            const data = node?.data;
            if (data?.objecttype || data?.category === constants.gojs.C_OBJECTTYPE) return true;
          }
        } catch (_) {
        }
        return myMetis.modelType === 'Metamodelling';
      };

      const applyLayoutScheme = (diagram: go.Diagram, layoutName: string) => {
        const targetDiagram = diagram || myDiagram;
        if (!targetDiagram) return;
        const normalized = layoutName;
        const isMetamodelling = isMetamodelDiagramContext(targetDiagram);
        if (isMetamodelling) {
          const myMetamodel = myMetis.currentMetamodel;
          if (myMetamodel) myMetamodel.layout = normalized;
        } else {
          const myModelview = myMetis.currentModelview;
          if (myModelview) myModelview.layout = normalized;
        }

        if (normalized === 'Manual') {
          const layout = targetDiagram.layout;
          if (layout) {
            layout.isInitial = false;
            layout.isOngoing = false;
          }
          return;
        }

        setLayout(targetDiagram, normalized);
        handleDoLayout(targetDiagram);
      };

      const handleSetLayoutScheme = (diagram: go.Diagram, selectedLayout?: string) => {
        const targetDiagram = diagram || myDiagram;
        if (!targetDiagram) return;
        if (selectedLayout) {
          applyLayoutScheme(targetDiagram, selectedLayout);
          return;
        }
        const layoutList = () => getLayoutOptions();
        const modalContext = {
          what: "selectDropdown",
          title: "Set Layout Scheme",
          case: "Set Layout Scheme",
          layoutList: layoutList(),
          myDiagram: targetDiagram
        };
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

      const persistDeletedObjectPart = (diagram: go.Diagram, part: go.Part) => {
        if (!(part instanceof go.Node)) return false;
        const data: any = part.data || {};
        const objview =
          myMetis.findObjectView(data?.objviewRef || data?.key) ||
          myMetis.findObjectView(data?.key) ||
          data?.objectview ||
          null;
        const object =
          objview?.object ||
          myMetis.findObject(data?.objRef || objview?.objectRef) ||
          data?.object ||
          null;

        if (objview) {
          objview.markedAsDeleted = true;
          try {
            const payload = JSON.parse(JSON.stringify(new jsn.jsnObjectView(objview)));
            diagram.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: payload });
          } catch (_) { }
        }
        if (object) {
          object.markedAsDeleted = !myMetis.deleteViewsOnly;
          try {
            const payload = JSON.parse(JSON.stringify(new jsn.jsnObject(object)));
            diagram.dispatch?.({ type: 'UPDATE_OBJECT_PROPERTIES', data: payload });
          } catch (_) { }
        }
        try {
          diagram.dispatch?.({
            type: 'SET_FOCUS_REFRESH',
            data: { id: String(Date.now()), name: 'deleteObjectPartDirect' }
          });
        } catch (_) { }

        const livePart =
          diagram.findNodeForKey(data?.key) ||
          diagram.findPartForKey(data?.key) ||
          part;
        const liveNodeData = livePart?.data || data;
        try {
          diagram.startTransaction('deleteObjectPartDirect');
          if (livePart instanceof go.Group) {
            try {
              const subParts = livePart.findSubGraphParts();
              if (subParts) {
                diagram.removeParts(subParts, false);
              }
            } catch (_) { }
          }
          diagram.model.removeNodeData(liveNodeData);
          try {
            diagram.remove(livePart);
          } catch (_) { }
          diagram.commitTransaction('deleteObjectPartDirect');
        } catch (_) {
          try {
            if (diagram.isInTransaction) diagram.rollbackTransaction();
          } catch (_rollbackErr) { }
          return false;
        }
        return true;
      };

      const persistDeletedRelationshipPart = (diagram: go.Diagram, part: go.Part) => {
        if (!(part instanceof go.Link)) return false;
        const data: any = part.data || {};
        const relview =
          myMetis.findRelationshipView(data?.relviewRef || data?.key) ||
          data?.relshipview ||
          null;
        const relship =
          relview?.relship ||
          myMetis.findRelationship(data?.relshipRef || data?.relRef) ||
          data?.relship ||
          null;

        if (!relview && !relship) return false;

        if (relship && !myMetis.deleteViewsOnly) {
          relship.markedAsDeleted = true;
          try {
            const payload = JSON.parse(JSON.stringify(new jsn.jsnRelationship(relship)));
            diagram.dispatch?.({ type: 'UPDATE_RELSHIP_PROPERTIES', data: payload });
          } catch (_) { }
        }

        const relatedViews =
          myMetis.deleteViewsOnly
            ? (relview ? [relview] : [])
            : (relship ? (myMetis.getRelationshipViewsByRelship(relship.id) || []) : (relview ? [relview] : []));

        for (let i = 0; i < relatedViews.length; i++) {
          const view = relatedViews[i];
          if (!view) continue;
          view.markedAsDeleted = true;
          try {
            const payload = JSON.parse(JSON.stringify(new jsn.jsnRelshipView(view)));
            diagram.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data: payload });
          } catch (_) { }
        }

        try {
          diagram.dispatch?.({
            type: 'SET_FOCUS_REFRESH',
            data: { id: String(Date.now()), name: 'deleteRelationshipPartDirect' }
          });
        } catch (_) { }

        const livePart =
          diagram.findLinkForKey(data?.key) ||
          diagram.findPartForKey(data?.key) ||
          part;
        const liveLinkData = livePart?.data || data;
        try {
          diagram.startTransaction('deleteRelationshipPartDirect');
          diagram.model.removeLinkData(liveLinkData);
          try {
            diagram.remove(livePart);
          } catch (_) { }
          diagram.commitTransaction('deleteRelationshipPartDirect');
        } catch (_) {
          try {
            if (diagram.isInTransaction) diagram.rollbackTransaction();
          } catch (_rollbackErr) { }
          return false;
        }
        return true;
      };

      const handlePartCopy = (diagram: go.Diagram, part: go.Part) => {
        if (!diagram || !part) return;
        if (part instanceof go.Node) {
          const nodePart = diagram.findPartForKey(part.data?.key) as go.Node;
          const shouldCopySubgraph =
            nodePart instanceof go.Group ||
            isGroupNode(nodePart?.data) ||
            isPoolGroup(nodePart) ||
            isLaneGroup(nodePart);
          if (nodePart && shouldCopySubgraph) {
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

      const canGenerateMetamodelFromData = (data: any): boolean => {
        if (!data) return false;
        if (myMetis.modelType === 'Metamodelling') return false;
        if (uic.isGenericMetamodel(myMetis)) return false;
        if (!data.name) return false;
        if (!data.object || !data.objectview) return false;
        const objectTypeName =
          data.object?.type?.name ||
          data.objecttype?.name ||
          data.type?.name;
        if (objectTypeName !== constants.types.AKM_METAMODEL) return false;
        return true;
      };

      const downloadGeneratedProject = (project: any, fileName: string) => {
        const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = generatedProjectFileName(fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
      };

      const chooseGeneratedProjectFile = (): Promise<{ project: any; fileName: string } | null> =>
        new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json,application/json';
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return resolve(null);
            try {
              resolve({ project: JSON.parse(await file.text()), fileName: file.name });
            } catch (_) {
              alert('The selected file is not valid JSON.');
              resolve(null);
            }
          };
          input.oncancel = () => resolve(null);
          input.click();
        });

      const handleGenerateMetamodel = async (
        diagram: go.Diagram | null | undefined,
        data: any,
        destination: 'current' | 'workspace' | 'new-project' | 'existing-project' = 'current'
      ) => {
        if (!diagram || !data) return;
        if (!canGenerateMetamodelFromData(data)) return;

        const metamodelName = data.name;
        if (!metamodelName) return;

        const provenance = buildGenerationProvenance({
          sourceProjectId: myMetis.id,
          sourceModelId: myMetis.currentModel?.id,
          sourceModelviewId: myMetis.currentModelview?.id,
          sourceMetamodelObjectId: data.object?.id,
        });
        let selectedProject: any = null;
        let selectedProjectFileName = '';
        let allowLegacyNameMatch = false;
        let newProjectName = '';
        let newModelName = '';

        if (destination === 'new-project') {
          newProjectName = prompt('Enter generated project name:', metamodelName.replace(/_META$/i, '')) || '';
          if (!newProjectName.trim()) return;
          newModelName = prompt('Enter initial model name:', newProjectName) || '';
          if (!newModelName.trim()) return;
        } else if (destination === 'existing-project') {
          const selected = await chooseGeneratedProjectFile();
          if (!selected) return;
          selectedProject = selected.project;
          selectedProjectFileName = selected.fileName;
          try {
            const inspected = inspectGeneratedProjectTarget(selectedProject, { name: metamodelName }, provenance);
            if (inspected.matchType === 'legacy-name') {
              allowLegacyNameMatch = confirm(
                `The selected project contains “${metamodelName}” but has no generation provenance. Update that metamodel and establish the link?`
              );
              if (!allowLegacyNameMatch) return;
            }
          } catch (error: any) {
            alert(error?.message || 'The selected file is not a compatible generated project.');
            return;
          }
        } else if (destination === 'workspace') {
          if (!confirm('Publish the generated metamodel ' + metamodelName + ' to the workspace without adding it to the current project?')) return;
        } else if (!confirm('Do you want to generate or update the metamodel ' + metamodelName + ' in the current project?')) {
          return;
        }

        const originalMetamodels = Array.isArray(myMetis.metamodels) ? [...myMetis.metamodels] : [];
        const originalTargetMetamodelRef = myMetis.currentModel?.targetMetamodelRef || '';
        let targetMetamodel = destination === 'workspace'
          ? new akm.cxMetaModel(utils.createGuid(), metamodelName)
          : myMetis.findMetamodelByName(metamodelName);
        const dispatchTarget = diagram.dispatch ?? myMetis.myDiagram?.dispatch;

        if (destination === 'workspace') {
          myMetis.addMetamodel(targetMetamodel);
        } else if (!targetMetamodel) {
          targetMetamodel = new akm.cxMetaModel(utils.createGuid(), metamodelName);
          myMetis.addMetamodel(targetMetamodel);
          myMetis.currentModel.targetMetamodelRef = targetMetamodel?.id;
          let mmdata: any = new jsn.jsnModel(myMetis.currentModel, true);
          mmdata = JSON.parse(JSON.stringify(mmdata));
          dispatchTarget?.({ type: 'UPDATE_MODEL_PROPERTIES', data: mmdata });
        }

        const objectId = data.object?.id;
        const objectviewId = data.objectview?.id;
        if (!objectId || !objectviewId) return;

        const myCurrentObject = myMetis.currentModel.findObject(objectId);
        const myCurrentObjectview = myMetis.currentModelview.findObjectView(objectviewId);
        if (!myCurrentObject || !myCurrentObjectview) return;

        const context = {
          "myMetis": myMetis,
          "myMetamodel": myMetis.currentMetamodel,
          "myTargetMetamodel": targetMetamodel,
          "myModel": myMetis.currentModel,
          "myModelview": myMetis.currentModelview,
          "myCurrentObject": myCurrentObject,
          "myCurrentObjectview": myCurrentObjectview,
          "myDiagram": diagram,
          "dispatch": dispatchTarget
        };
        let serializedMetamodel: any = null;
        try {
          const generated = gen.generateTargetMetamodel2(context);
          if (!generated) return;
          serializedMetamodel = JSON.parse(JSON.stringify(new jsn.jsnMetaModel(targetMetamodel, true)));
        } finally {
          if (destination === 'workspace') {
            myMetis.metamodels = originalMetamodels;
            if (myMetis.currentModel) myMetis.currentModel.targetMetamodelRef = originalTargetMetamodelRef;
          }
        }
        if (!serializedMetamodel) return;
        if (destination === 'current') return;
        if (destination === 'workspace') {
          const generatedObjectTypeIds = new Set(
            (serializedMetamodel.objecttypes || []).map((type: any) => type?.id).filter(Boolean)
          );
          const interMetamodelRelationshipTypes = (myMetis.currentModel?.relships || []).flatMap((rel: any) => {
            const fromTypeRef = rel?.fromObject?.generatedTypeId || '';
            const toTypeRef = rel?.toObject?.generatedTypeId || '';
            if (!fromTypeRef || !toTypeRef) return [];
            const fromIsLocal = generatedObjectTypeIds.has(fromTypeRef);
            const toIsLocal = generatedObjectTypeIds.has(toTypeRef);
            if (fromIsLocal === toIsLocal) return [];
            return [{
              id: rel.generatedTypeId || rel.id,
              name: rel.name || rel.type?.name || 'relationship',
              description: rel.description || '',
              sourceRelationshipId: rel.id,
              fromobjtypeRef: fromTypeRef,
              toobjtypeRef: toTypeRef,
              relshipkind: rel.relshipkind || rel.type?.relshipkind || 'Association',
              cardinality: rel.cardinality || '',
            }];
          });
          if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'mimris:metamodel-generated',
              metamodel: serializedMetamodel,
              source: {
                projectId: myMetis.id,
                modelId: myMetis.currentModel?.id || '',
                modelviewId: myMetis.currentModelview?.id || '',
                metamodelObjectId: data.object?.id || '',
              },
              provenance,
              interMetamodelRelationshipTypes,
            }, '*');
          }
          return;
        }
        try {
          const adminMetamodel = myMetis.findMetamodelByName(constants.admin.AKM_ADMIN_META);
          const supportingMetamodels = adminMetamodel
            ? [JSON.parse(JSON.stringify(new jsn.jsnMetaModel(adminMetamodel, true)))]
            : [];
          if (destination === 'new-project') {
            const project = createGeneratedMetamodelProject({
              serializedMetamodel,
              provenance,
              projectId: utils.createGuid(),
              projectName: newProjectName.trim(),
              modelId: utils.createGuid(),
              modelName: newModelName.trim(),
              modelviewId: utils.createGuid(),
              modelviewName: 'Main',
              supportingMetamodels,
            });
            downloadGeneratedProject(project, newProjectName);
          } else {
            const project = updateGeneratedMetamodelProject({
              project: selectedProject,
              serializedMetamodel,
              provenance,
              allowLegacyNameMatch,
              supportingMetamodels,
            });
            downloadGeneratedProject(project, selectedProjectFileName);
          }
        } catch (error: any) {
          alert(error?.message || 'The generated project could not be created.');
        }
      };

      function resolveObjectview(nodeData: any): any {
        if (!nodeData) return null;
        let objview = myMetis.findObjectView(nodeData?.key);
        if (!objview && nodeData?.objectview?.id) {
          objview = myMetis.findObjectView(nodeData.objectview.id);
        }
        if (!objview) {
          objview = nodeData.objectview;
        }
        return objview;
      }

      function isObjectNodeData(data: any): boolean {
        return !!data && (
          data?.category === constants.gojs.C_OBJECT ||
          !!data?.object ||
          !!data?.objectview ||
          data?.isGroup === true ||
          typeof data?.viewkind === 'string'
        );
      }

      function isContainerView(data: any): boolean {
        if (!data) return false;
        const viewkind = data?.viewkind ?? data?.objectview?.viewkind;
        return viewkind === 'Container';
      }

      function getTemplateName(data: any): string {
        if (!data) return "";
        const objview = resolveObjectview(data);
        return String(data?.template || objview?.template || "");
      }

      function isPortedGroup(data: any): boolean {
        if (!isContainerView(data)) return false;
        const template = getTemplateName(data);
        return template === 'groupWithPorts' ||
          template === 'groupWithFigAndPorts' ||
          template === 'groupWithGeoAndPorts';
      }

      function isPlainGroup(data: any): boolean {
        if (!isContainerView(data)) return false;
        const template = getTemplateName(data);
        return template === 'groupNoPorts' ||
          template === 'groupFigNoPorts' ||
          template === 'groupGeoNoPorts';
      }

      function getPlainGroupTemplate(templateFromNode: string): string {
        switch (templateFromNode) {
          case 'textAndGeometry':
          case 'groupWithGeoAndPorts':
          case 'groupGeoNoPorts':
            return 'groupGeoNoPorts';
          case 'textAndFigure':
          case 'groupWithFigAndPorts':
          case 'groupFigNoPorts':
            return 'groupFigNoPorts';
          case 'textAndIcon':
          case 'groupWithPorts':
          case 'groupNoPorts':
          default:
            return 'groupNoPorts';
        }
      }

      function getPortedGroupTemplate(templateFromNode: string): string {
        switch (templateFromNode) {
          case 'textAndGeometry':
          case 'groupWithGeoAndPorts':
          case 'groupGeoNoPorts':
            return 'groupWithGeoAndPorts';
          case 'textAndFigure':
          case 'groupWithFigAndPorts':
          case 'groupFigNoPorts':
            return 'groupWithFigAndPorts';
          case 'textAndIcon':
          case 'groupWithPorts':
          case 'groupNoPorts':
          default:
            return 'groupWithPorts';
        }
      }

      function canConvertToGroup(data: any): boolean {
        return isObjectNodeData(data) && !isContainerView(data);
      }

      function canConvertToNode(data: any): boolean {
        return isObjectNodeData(data) && isPlainGroup(data);
      }

      function canEnablePorts(data: any): boolean {
        return isObjectNodeData(data) && isPlainGroup(data);
      }

      function ensureMinimumGroupSize(nodeData: any, objview: any, part: go.Part | null): string | null {
        const minWidth = 220;
        const minHeight = 120;
        const sizeCandidates: any[] = [
          part && (part as any).resizeObject?.desiredSize,
          part && (part as any).desiredSize,
          part?.actualBounds,
          nodeData?.size,
          objview?.size,
        ];

        let width = 0;
        let height = 0;

        for (const candidate of sizeCandidates) {
          if (!candidate) continue;
          if (typeof candidate === "string") {
            try {
              const parsed = go.Size.parse(candidate);
              width = Math.max(width, parsed.width || 0);
              height = Math.max(height, parsed.height || 0);
            } catch (_err) {
              // ignore invalid size strings
            }
            continue;
          }
          const candidateWidth = Number(candidate.width);
          const candidateHeight = Number(candidate.height);
          if (Number.isFinite(candidateWidth)) width = Math.max(width, candidateWidth);
          if (Number.isFinite(candidateHeight)) height = Math.max(height, candidateHeight);
        }

        const normalizedWidth = Math.max(width, minWidth);
        const normalizedHeight = Math.max(height, minHeight);
        return `${normalizedWidth} ${normalizedHeight}`;
      }

      function refreshConvertedPart(diagram: go.Diagram, part: go.Part | null, data?: any) {
        if (!diagram || !(part instanceof go.Part)) return;
        const targetData = data || part.data;
        if (targetData && typeof diagram.model?.updateTargetBindings === "function") {
          try { diagram.model.updateTargetBindings(targetData); } catch (_err) { }
        }
        try { diagram.updateAllTargetBindings("scale"); } catch (_err) { }
        try { part.updateTargetBindings(); } catch (_err) { }
        try { part.ensureBounds(); } catch (_err) { }
        try { part.updateAdornments(); } catch (_err) { }
        try { diagram.layoutDiagram(true); } catch (_err) {
          try { diagram.requestUpdate(); } catch (_err2) { }
        }
      }

      function rebuildConvertedPart(diagram: go.Diagram, part: go.Part | null, mutateData: (data: any) => void) {
        if (!diagram || !(part instanceof go.Node)) return;
        const data: any = part.data;
        if (!data) return;
        const wasSelected = !!part.isSelected;
        const connectedLinks: any[] = [];
        part.linksConnected.each((link: go.Link) => {
          if (!link?.data) return;
          connectedLinks.push(link.data);
        });

        diagram.startTransaction('rebuild-converted-part');
        try {
          mutateData(data);
          if (typeof diagram.model.removeNodeData === 'function') {
            diagram.model.removeNodeData(data);
          }
          if (typeof diagram.model.addNodeData === 'function') {
            diagram.model.addNodeData(data);
          }
          connectedLinks.forEach((linkData) => {
            if (!linkData || typeof diagram.model.addLinkData !== 'function') return;
            const alreadyPresent = typeof diagram.findLinkForData === 'function'
              ? diagram.findLinkForData(linkData)
              : null;
            if (!alreadyPresent) {
              diagram.model.addLinkData(linkData);
            }
          });
        } finally {
          diagram.commitTransaction('rebuild-converted-part');
        }

        const rebuiltPart = (data?.key !== undefined ? diagram.findNodeForKey(data.key) : null) as go.Part | null;
        if (rebuiltPart && wasSelected) {
          try { diagram.select(rebuiltPart); } catch (_err) { }
        }
        refreshConvertedPart(diagram, rebuiltPart, data);
      }

      function applyConvertedGroupTemplate(diagram: go.Diagram, part: go.Part | null, template: string | null) {
        if (!diagram || !(part instanceof go.Node) || !template) return;
        rebuildConvertedPart(diagram, part, (data: any) => {
          data.isGroup = true;
          data.viewkind = constants.viewkinds.CONT;
          data.template = template;
          data.category = template;
        });
      }

      function clearConvertedGroupTemplate(diagram: go.Diagram, part: go.Part | null) {
        if (!diagram || !(part instanceof go.Node)) return;
        rebuildConvertedPart(diagram, part, (data: any) => {
          data.isGroup = false;
          data.viewkind = constants.viewkinds.OBJ;
          data.template = data.template || constants.gojs.C_NODETEMPLATE;
          data.category = data.template || constants.gojs.C_NODETEMPLATE;
        });
      }

      function handleConvertToGroup(diagram: go.Diagram | null | undefined, part: go.Part | null) {
        const targetDiagram = diagram || myDiagram;
        if (!targetDiagram || !part) return;
        const nodeData: any = part.data;
        if (!canConvertToGroup(nodeData)) return;

        let objview: any = resolveObjectview(nodeData);
        if (!objview) {
          alert("You need to do a Reload to see the change!");
          return;
        }

        const templateFromNode = nodeData?.template || objview?.template;
        const template = getPortedGroupTemplate(templateFromNode);

        objview.viewkind = 'Container';
        objview.template = template;
        objview.isGroup = true;
        objview.portMode = 'generic';
        const normalizedSize = ensureMinimumGroupSize(nodeData, objview, part);
        if (normalizedSize) {
          objview.size = normalizedSize;
        }

        if (nodeData.objectview) {
          nodeData.objectview.viewkind = 'Container';
          nodeData.objectview.template = template;
          nodeData.objectview.isGroup = true;
          nodeData.objectview.portMode = 'generic';
          if (normalizedSize) {
            nodeData.objectview.size = normalizedSize;
          }
        }

        nodeData.viewkind = 'Container';
        nodeData.template = template;
        if (normalizedSize) {
          nodeData.size = normalizedSize;
        }

        const jsnObjview = new jsn.jsnObjectView(objview);
        const data = JSON.parse(JSON.stringify(jsnObjview));
        targetDiagram.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });

        const nodeModelData = nodeData.data ?? nodeData;
        try {
          const newTemplate = template ?? (nodeData.template || "textAndIcon");
          if (typeof newTemplate === "string" && newTemplate.length > 0) {
            nodeModelData.isGroup = true;
            nodeModelData.viewkind = 'Container';
            nodeModelData.template = newTemplate;
            nodeModelData.category = newTemplate;
            nodeData.template = newTemplate;
            if (normalizedSize) {
              targetDiagram.model.setDataProperty(nodeModelData, "size", normalizedSize);
            }
            applyConvertedGroupTemplate(targetDiagram, part, newTemplate);
          }
        } catch (_err) {
          // Ignore if category update fails
        }
      }

      function handleConvertToNode(diagram: go.Diagram | null | undefined, part: go.Part | null) {
        const targetDiagram = diagram || myDiagram;
        if (!targetDiagram || !part) return;
        const nodeData: any = part.data;
        if (!canConvertToNode(nodeData)) return;

        let objview: any = resolveObjectview(nodeData);
        if (!objview) {
          alert("You need to a Reload to see the change!");
          return;
        }

        objview.viewkind = 'Object';
        objview.template = 'textAndIcon';
        objview.isGroup = false;
        objview.portMode = 'none';

        if (nodeData.objectview) {
          nodeData.objectview.viewkind = 'Object';
          nodeData.objectview.template = 'textAndIcon';
          nodeData.objectview.isGroup = false;
          nodeData.objectview.portMode = 'none';
        }

        nodeData.viewkind = 'Object';
        nodeData.template = 'textAndIcon';

        const jsnObjview = new jsn.jsnObjectView(objview);
        const data = JSON.parse(JSON.stringify(jsnObjview));
        targetDiagram.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
        const nodeModelData = nodeData.data ?? nodeData;
        try {
          nodeModelData.isGroup = false;
          nodeModelData.viewkind = 'Object';
          nodeModelData.template = 'textAndIcon';
          nodeModelData.category = 'textAndIcon';
          clearConvertedGroupTemplate(targetDiagram, part);
        } catch (_err) {
          alert("You need to a Reload to see the change!");
        }
      }

      function handleEnablePorts(diagram: go.Diagram | null | undefined, part: go.Part | null) {
        const targetDiagram = diagram || myDiagram;
        if (!targetDiagram || !part) return;
        const nodeData: any = part.data;
        if (!canEnablePorts(nodeData)) return;

        const objview: any = resolveObjectview(nodeData);
        if (!objview) {
          alert("You need to do a Reload to see the change!");
          return;
        }

        const templateFromNode = nodeData?.template || objview?.template;
        const template = getPortedGroupTemplate(templateFromNode);

        objview.viewkind = 'Container';
        objview.template = template;
        objview.isGroup = true;
        objview.portMode = 'generic';

        if (nodeData.objectview) {
          nodeData.objectview.viewkind = 'Container';
          nodeData.objectview.template = template;
          nodeData.objectview.isGroup = true;
          nodeData.objectview.portMode = 'generic';
        }

        nodeData.viewkind = 'Container';
        nodeData.template = template;

        const jsnObjview = new jsn.jsnObjectView(objview);
        const data = JSON.parse(JSON.stringify(jsnObjview));
        targetDiagram.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });

        const nodeModelData = nodeData.data ?? nodeData;
        try {
          if (typeof template === "string" && template.length > 0) {
            nodeModelData.isGroup = true;
            nodeModelData.viewkind = 'Container';
            nodeModelData.template = template;
            nodeModelData.category = template;
            nodeData.template = template;
            applyConvertedGroupTemplate(targetDiagram, part, template);
          }
        } catch (_err) {
          // Ignore if category update fails
        }
      }

      function getLayoutOptions() {
        return [
          { value: "Circular", label: "Circular Layout" },
          { value: "Grid", label: "Grid Layout" },
          { value: "Tree", label: "Tree Layout" },
          { value: "ForceDirected", label: "ForceDirected Layout" },
          { value: "LayeredDigraph", label: "LayeredDigraph Layout" },
          { value: "Manual", label: "Manual Layout" },
        ];
      }

      function isGroupNode(data: any): boolean {
        const objview = resolveObjectview(data);
        if (objview?.isGroup) return true;
        return isContainerView(data);
      }

      function isPoolGroup(part: go.Part | null | undefined): boolean {
        if (!part) return false;
        const data: any = part.data || {};
        const template = (data.template || data.category || '').toString().toLowerCase();
        const viewkind = (data.viewkind || data.viewKind || '').toString().toLowerCase();
        const typeName = (data.objecttype?.name || data.name || '').toString().toLowerCase();
        return template.includes('pool') || viewkind === 'pool' || typeName.includes('pool');
      }

      function isLaneGroup(part: go.Part | null | undefined): boolean {
        if (!part) return false;
        if (isPoolGroup(part)) return false;
        const data: any = part.data || {};
        const template = (data.template || data.category || '').toString().toLowerCase();
        const viewkind = (data.viewkind || data.viewKind || '').toString().toLowerCase();
        const typeName = (data.objecttype?.name || data.name || '').toString().toLowerCase();
        return template.includes('lane') || viewkind === 'lane' || typeName.includes('lane');
      }

      function handleGroupSelectLayout(diagram: go.Diagram | null | undefined, part: go.Part | null) {
        const targetDiagram = diagram || myDiagram;
        if (!targetDiagram || !part) return;
        const nodeData: any = part.data;
        if (!isGroupNode(nodeData)) return;
        const objview = resolveObjectview(nodeData);
        if (!objview) return;
        const modalContext = {
          what: "selectDropdown",
          title: "Set Layout Scheme",
          case: "Set Layout Scheme",
          layoutList: getLayoutOptions(),
          myDiagram: targetDiagram,
          myModelview: myMetis.currentModelview,
          objectview: objview,
        };
        myMetis.myDiagram = targetDiagram;
        targetDiagram.handleOpenModal(targetDiagram, modalContext);
      }

      function handleGroupSaveLayout(diagram: go.Diagram | null | undefined, part: go.Part | null) {
        const targetDiagram = diagram || myDiagram;
        if (!targetDiagram || !part) return;
        const nodeData: any = part.data;
        if (!isGroupNode(nodeData)) return;
        if (!(part instanceof go.Group)) return;
        const groupPart = part as go.Group;
        const members = groupPart.memberParts;
        const myModelview = myMetis.currentModelview;
        if (!myModelview) return;
        const persistPartGeometry = (memberPart: go.Part | null | undefined) => {
          if (!memberPart) return;
          if (!(memberPart instanceof go.Node) && !(memberPart instanceof go.Group)) return;
          const memberData: any = memberPart.data;
          if (!memberData) return;
          const memberObjview = resolveObjectview(memberData);

          const locationPoint = memberPart.location;
          if (locationPoint) {
            const locString = go.Point.stringify(locationPoint);
            try {
              targetDiagram.model.setDataProperty(memberData, "loc", locString);
            } catch (_err) {
              memberData.loc = locString;
            }
            if (memberObjview) {
              memberObjview.loc = locString;
            }
          }

          const candidateSizes: Array<{ width: number; height: number }> = [];
          const addCandidate = (candidate: any) => {
            if (!candidate) return;
            const width = Number(candidate.width);
            const height = Number(candidate.height);
            if (!Number.isFinite(width) || !Number.isFinite(height)) return;
            if (width <= 0 || height <= 0) return;
            candidateSizes.push({ width, height });
          };

          const resizeObject: any = (memberPart as any).resizeObject || null;
          if (resizeObject && resizeObject.desiredSize) {
            addCandidate(resizeObject.desiredSize);
          }
          const desiredSize: any = (memberPart as any).desiredSize || null;
          if (desiredSize) {
            addCandidate(desiredSize);
          }
          const actualBounds = memberPart.actualBounds || null;
          if (actualBounds) {
            addCandidate(actualBounds);
          }
          if (!candidateSizes.length && typeof memberData.size === "string") {
            const parts = memberData.size
              .trim()
              .split(/[,\s]+/)
              .map((token: string) => Number(token))
              .filter((num: number) => Number.isFinite(num));
            if (parts.length >= 2) {
              addCandidate({ width: parts[0], height: parts[1] });
            }
          }

          if (candidateSizes.length) {
            const bestSize = candidateSizes.reduce((largest, current) => {
              const largestArea = largest.width * largest.height;
              const currentArea = current.width * current.height;
              return currentArea > largestArea ? current : largest;
            });
            const sizeString = `${bestSize.width} ${bestSize.height}`;
            try {
              targetDiagram.model.setDataProperty(memberData, "size", sizeString);
            } catch (_err) {
              memberData.size = sizeString;
            }
            if (memberObjview) {
              memberObjview.size = sizeString;
            }
          }

          if (memberObjview && typeof (memberObjview as any).setModified === "function") {
            try {
              (memberObjview as any).setModified();
            } catch (_err) {
              // ignore
            }
          }

          // Dispatch UPDATE_OBJECTVIEW_PROPERTIES so Redux state is properly updated
          if (memberObjview) {
            const jsnObjview = new jsn.jsnObjectView(memberObjview);
            const objviewData = JSON.parse(JSON.stringify(jsnObjview));
            targetDiagram.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: objviewData });
          }
        };

        persistPartGeometry(groupPart);

        if (members) {
          members.each((member) => {
            persistPartGeometry(member);
          });

        }
        const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
        let data = { metis: jsnMetis };
        data = JSON.parse(JSON.stringify(data));
        dispatchUniversePhData(targetDiagram.dispatch, data);
      }

      function handleGroupDoLayout(diagram: go.Diagram | null | undefined, part: go.Part | null) {
        const targetDiagram = diagram || myDiagram;
        if (!targetDiagram || !part) return;
        const nodeData: any = part.data;
        if (!isGroupNode(nodeData)) return;
        if (!(part instanceof go.Group)) return;
        const dragTool = targetDiagram.currentTool;
        if (dragTool instanceof go.DraggingTool && dragTool.isActive) {
          dragTool.doCancel();
        }
        const objview = resolveObjectview(nodeData);
        if (!objview) return;
        uid.doGroupLayout(objview, targetDiagram, myMetis);
        handleGroupSaveLayout(targetDiagram, part);
        targetDiagram.requestUpdate();
      }


      // ...existing code...
      // In the Add Connected dialog, gray out fields if addConnectedDialogFieldsDisabled is true
      // Example (pseudo-code, adapt to your actual dialog rendering):
      // <input disabled={this.state.addConnectedDialogFieldsDisabled} ... />
      // <select disabled={this.state.addConnectedDialogFieldsDisabled} ... />
      // ...existing code...
      function applyGroupDropLayout(
        diagram: go.Diagram | null | undefined,
        part: go.Part | null,
        preset?: string | null
      ) {
        const targetDiagram = diagram || myDiagram;
        if (!targetDiagram || !part) return;
        if (!(part instanceof go.Group)) return;
        const nodeData: any = part.data;
        if (!isGroupNode(nodeData)) return;

        const dragTool = targetDiagram.currentTool;
        if (dragTool instanceof go.DraggingTool && dragTool.isActive) {
          dragTool.doCancel();
        }

        // record group location so we do NOT move the group itself
        const originalGroupLoc = part.location ? (part.location.copy?.() ?? part.location) : null;
        // ...existing code...
        // POOL layout: only arrange immediate child groups (lanes) one level down
        if (isPoolGroup(part)) {
          const childGroups: go.Group[] = [];
          part.memberParts.each((member: go.Part) => {
            if (member instanceof go.Group) childGroups.push(member as go.Group);
          });
          if (childGroups.length === 0) return;

          const gb = part.actualBounds ? part.actualBounds.copy() : null;
          if (!gb) return;

          // try to detect a top header object (common names); reserve its height
          let headerHeight = 0;
          try {
            const headerObj = part.findObject('HEADER') || part.findObject('header') || part.findObject('poolHeader') || part.findObject('Header');
            if (headerObj && headerObj.actualBounds) headerHeight = headerObj.actualBounds.height || 0;
          } catch { headerHeight = 0; }

          // try to detect a left header/label area inside the pool and reserve its width
          let leftHeaderWidth = 0;
          try {
            const leftObj = part.findObject('LEFT_HEADER') || part.findObject('leftHeader') || part.findObject('poolLeftHeader') || part.findObject('leftLabel') || part.findObject('HEADER_LEFT');
            if (leftObj && leftObj.actualBounds) leftHeaderWidth = leftObj.actualBounds.width || 0;
          } catch { leftHeaderWidth = 0; }

          // reserve a small extra margin for the pool-left header so lanes don't overlap it
          const extraLeftReserve = 28; // increase if you need more room
          const leftReserve = Math.max(leftHeaderWidth, extraLeftReserve);

          const padding = 8;
          const innerLeft = gb.x + leftReserve + padding;
          const innerRight = gb.x + gb.width - padding;
          const top = gb.y + headerHeight + padding;
          const bottom = gb.y + gb.height - padding;

          // preserve top->bottom sequence by sorting on current y
          childGroups.sort((a, b) => {
            const ay = (a.location && a.location.y) ?? (a.actualBounds && a.actualBounds.y) ?? 0;
            const by = (b.location && b.location.y) ?? (b.actualBounds && b.actualBounds.y) ?? 0;
            return ay - by;
          });

          const count = childGroups.length;
          const availableHeight = Math.max(bottom - top, 1);
          const cellHeight = availableHeight / count;
          // lane width limited to inner horizontal area (leaving left header reserve)
          const laneWidth = Math.max(innerRight - innerLeft, 1);
          const centerX = innerLeft + laneWidth / 2;

          targetDiagram.startTransaction('pool-drop-layout');
          for (let i = 0; i < count; i++) {
            const g = childGroups[i];

            // determine group height (fallback if actualBounds not ready)
            let gbounds: go.Rect | null = null;
            try {
              gbounds = (g.actualBounds && g.actualBounds.copy()) || null;
            } catch { gbounds = null; }
            if (!gbounds) {
              const ds = (g.desiredSize && g.desiredSize) || new go.Size(1, 1);
              gbounds = new go.Rect(0, 0, ds.width || 1, ds.height || 1);
            }

            // top of the lane cell (align lanes from top to bottom)
            const cellTop = top + cellHeight * i;
            // make lane height fill the cell (leave slight inner padding)
            const desiredHeight = Math.max(cellHeight - 4, gbounds.height);
            const desiredX = innerLeft;
            const desiredY = cellTop;

            // set group desired size to fill horizontal inner area and the computed height
            try {
              g.desiredSize = new go.Size(laneWidth, desiredHeight);
            } catch { /* ignore if not supported */ }

            // decide persisted loc depending on locationSpot
            let locToPersist: go.Point;
            try {
              const spot = g.locationSpot;
              if (spot && typeof spot.equals === 'function' && spot.equals(go.Spot.Center)) {
                // store group's center horizontally at centerX and vertically centered inside the lane cell
                locToPersist = new go.Point(centerX, cellTop + (desiredHeight / 2));
              } else {
                // anchor top-left to innerLeft and top of cell
                locToPersist = new go.Point(desiredX, desiredY);
              }
            } catch {
              locToPersist = new go.Point(desiredX, desiredY);
            }

            // move the lane group (child) and persist its loc
            try {
              g.move(locToPersist);
            } catch {
              try { (g as any).position = locToPersist; } catch { }
            }
            const gdata = g.data;
            if (gdata) {
              const locStr = go.Point.stringify(locToPersist);
              try {
                (targetDiagram.model as any).setDataProperty(gdata, 'loc', locStr);
                const sizeStr = go.Size.stringify(new go.Size(laneWidth, desiredHeight));
                try {
                  (targetDiagram.model as any).setDataProperty(gdata, 'size', sizeStr);
                } catch {
                  gdata.size = sizeStr;
                }
              } catch {
                gdata.loc = locStr;
                gdata.size = go.Size.stringify(new go.Size(laneWidth, desiredHeight));
              }
            }

            // also save layout for the lane's contents
            try {
              handleGroupSaveLayout(targetDiagram, g);
            } catch { }
          }
          targetDiagram.commitTransaction('pool-drop-layout');

          // restore pool location if changed
          try {
            if (originalGroupLoc && part.location && (!part.location.equals(originalGroupLoc))) {
              targetDiagram.startTransaction('restore-pool-location');
              try { part.move(originalGroupLoc); } catch { try { (part as any).position = originalGroupLoc; } catch { } }
              targetDiagram.commitTransaction('restore-pool-location');
            }
          } catch { }

          handleGroupSaveLayout(targetDiagram, part);
          targetDiagram.requestUpdate();
          return;
        }
        // collect initial members (only Node instances) for non-pool groups
        const members: go.Node[] = [];
        const filteredMembers: go.Node[] = [];
        const seenKeys = new Set<any>();

        part.memberParts.each((member: go.Part) => {
          if (member instanceof go.Node) members.push(member);
        });
        if (members.length === 0) return;

        // Deduplicate and ensure we never include the group node itself
        for (let i = 0; i < members.length; i++) {
          const m = members[i];
          if (!m || m === part) continue;
          const k = m.data?.key ?? (m.key ?? null);
          if (k !== null && seenKeys.has(k)) continue;
          if (k !== null) seenKeys.add(k);
          filteredMembers.push(m);
        }
        if (filteredMembers.length === 0) return;

        // Lane special-case: top-aligned & spread left→right inside group's inner bounds
        if (isLaneGroup(part)) {
          const gb = part.actualBounds ? part.actualBounds.copy() : null;
          if (!gb) return;

          // detect left heading area (reserve its width) and use padding
          let headerWidth = 0;
          try {
            const headerObj = part.findObject('HEADER') || part.findObject('header') || part.findObject('laneHeader') || part.findObject('Header') || part.findObject('LEFT_HEADER') || part.findObject('leftHeader');
            if (headerObj && headerObj.actualBounds) headerWidth = headerObj.actualBounds.width || 0;
          } catch { headerWidth = 0; }

          const padding = 8;
          const innerLeft = gb.x + headerWidth + padding;
          const innerRight = gb.x + gb.width - padding;
          // anchor nodes to the very top of the lane (leave minimal padding)
          const top = gb.y + padding;

          const looksLike = (data: any, keyword: string) => {
            if (!data) return false;
            const k = (keyword || '').toString().toLowerCase();
            const checks = [
              data.name,
              data.template,
              data.category,
              data.type,
              data.viewkind,
              data.objecttype && data.objecttype.name,
              data.objtype && data.objtype.name,
            ];
            for (let i = 0; i < checks.length; i++) {
              const v = checks[i];
              if (!v) continue;
              try {
                if (v.toString().toLowerCase().indexOf(k) >= 0) return true;
              } catch { }
            }
            return false;
          };
          const isStartNode = (n: go.Node) => looksLike(n.data, 'start');
          const isEndNode = (n: go.Node) => looksLike(n.data, 'end');

          // deduplication was already performed earlier for this group

          // keep left→right order but stable with start/end markers
          filteredMembers.sort((a, b) => {
            const aStart = isStartNode(a), bStart = isStartNode(b);
            if (aStart !== bStart) return aStart ? -1 : 1;
            const aEnd = isEndNode(a), bEnd = isEndNode(b);
            if (aEnd !== bEnd) return aEnd ? 1 : -1;
            const ax = (a.location && a.location.x) ?? (a.actualBounds && a.actualBounds.x) ?? 0;
            const bx = (b.location && b.location.x) ?? (b.actualBounds && b.actualBounds.x) ?? 0;
            return ax - bx;
          });

          const count = filteredMembers.length;
          const availableWidth = Math.max(innerRight - innerLeft, 1);
          const cellWidth = availableWidth / count;

          targetDiagram.startTransaction('group-drop-layout-lane');
          for (let i = 0; i < count; i++) {
            const m = filteredMembers[i];
            const centerX = innerLeft + cellWidth * (i + 0.5);

            let nb: go.Rect | null = null;
            try {
              nb = (m.actualBounds && m.actualBounds.copy()) || null;
            } catch {
              nb = null;
            }
            if (!nb) {
              const ds = (m.desiredSize && m.desiredSize) || new go.Size(1, 1);
              nb = new go.Rect(0, 0, ds.width || 1, ds.height || 1);
            }

            // top-aligned inside lane; x centered within its cell, y anchored to top + padding
            const topLeft = new go.Point(centerX - (nb.width / 2), top);
            let locToPersist: go.Point;
            try {
              const spot = m.locationSpot;
              if (spot && typeof spot.equals === 'function' && spot.equals(go.Spot.Center)) {
                // if node stores center, persist center at appropriate y (top + half height)
                locToPersist = new go.Point(centerX, top + (nb.height / 2));
              } else {
                locToPersist = topLeft;
              }
            } catch {
              locToPersist = topLeft;
            }

            try { m.move(locToPersist); } catch { try { (m as any).position = locToPersist; } catch { } }

            // persist size to fill cell width but do not exceed cell width
            try {
              m.desiredSize = new go.Size(Math.min(Math.max(cellWidth - 4, nb.width), cellWidth), nb.height);
            } catch { }

            const mdata = m.data;
            if (mdata) {
              const locStr = go.Point.stringify(locToPersist);
              try { (targetDiagram.model as any).setDataProperty(mdata, 'loc', locStr); } catch { mdata.loc = locStr; }
            }
          }
          targetDiagram.commitTransaction('group-drop-layout-lane');

          // ensure group wasn't moved
          try {
            if (originalGroupLoc && part.location && (!part.location.equals(originalGroupLoc))) {
              targetDiagram.startTransaction('restore-group-location');
              try { part.move(originalGroupLoc); } catch { try { (part as any).position = originalGroupLoc; } catch { } }
              targetDiagram.commitTransaction('restore-group-location');
            }
          } catch { }

          handleGroupSaveLayout(targetDiagram, part);
          targetDiagram.requestUpdate();
          return;
        }

        
        // Lane special-case: top-aligned & spread left→right inside group's inner bounds
        if (isLaneGroup(part)) {
          const gb = part.actualBounds ? part.actualBounds.copy() : null;
          if (!gb) return;

          // detect left heading area (reserve its width) and use padding
          let headerWidth = 0;
          try {
            const headerObj = part.findObject('HEADER') || part.findObject('header') || part.findObject('laneHeader') || part.findObject('Header') || part.findObject('LEFT_HEADER') || part.findObject('leftHeader');
            if (headerObj && headerObj.actualBounds) headerWidth = headerObj.actualBounds.width || 0;
          } catch { headerWidth = 0; }

          // small extra reserve so nodes don't touch the header
          const extraLeftReserve = 8;
          const padding = 8;
          const innerLeft = gb.x + Math.max(headerWidth, extraLeftReserve) + padding;
          const innerRight = gb.x + gb.width - padding;
          // anchor nodes to the very top of the lane (leave minimal padding)
          const top = gb.y + padding;

          const looksLike = (data: any, keyword: string) => {
            if (!data) return false;
            const k = (keyword || '').toString().toLowerCase();
            const checks = [
              data.name,
              data.template,
              data.category,
              data.type,
              data.viewkind,
              data.objecttype && data.objecttype.name,
              data.objtype && data.objtype.name,
            ];
            for (let i = 0; i < checks.length; i++) {
              const v = checks[i];
              if (!v) continue;
              try {
                if (v.toString().toLowerCase().indexOf(k) >= 0) return true;
              } catch { }
            }
            return false;
          };
          const isStartNode = (n: go.Node) => looksLike(n.data, 'start');
          const isEndNode = (n: go.Node) => looksLike(n.data, 'end');

          // keep left→right order but stable with start/end markers
          filteredMembers.sort((a, b) => {
            const aStart = isStartNode(a), bStart = isStartNode(b);
            if (aStart !== bStart) return aStart ? -1 : 1;
            const aEnd = isEndNode(a), bEnd = isEndNode(b);
            if (aEnd !== bEnd) return aEnd ? 1 : -1;
            const ax = (a.location && a.location.x) ?? (a.actualBounds && a.actualBounds.x) ?? 0;
            const bx = (b.location && b.location.x) ?? (b.actualBounds && b.actualBounds.x) ?? 0;
            return ax - bx;
          });

          const count = filteredMembers.length;
          const availableWidth = Math.max(innerRight - innerLeft, 1);
          const cellWidth = availableWidth / count;

          targetDiagram.startTransaction('group-drop-layout-lane');
          for (let i = 0; i < count; i++) {
            const m = filteredMembers[i];
            const centerX = innerLeft + cellWidth * (i + 0.5);

            let nb: go.Rect | null = null;
            try {
              nb = (m.actualBounds && m.actualBounds.copy()) || null;
            } catch {
              nb = null;
            }
            if (!nb) {
              const ds = (m.desiredSize && m.desiredSize) || new go.Size(1, 1);
              nb = new go.Rect(0, 0, ds.width || 1, ds.height || 1);
            }

            // top-aligned inside lane; x centered within its cell, y anchored to top + small padding
            const topLeft = new go.Point(centerX - (nb.width / 2), top);
            let locToPersist: go.Point;
            try {
              const spot = m.locationSpot;
              if (spot && typeof spot.equals === 'function' && spot.equals(go.Spot.Center)) {
                // if node stores center, persist center at appropriate y (top + half height)
                locToPersist = new go.Point(centerX, top + (nb.height / 2));
              } else {
                locToPersist = topLeft;
              }
            } catch {
              locToPersist = topLeft;
            }

            try { m.move(locToPersist); } catch { try { (m as any).position = locToPersist; } catch { } }

            // constrain node width to cell but don't force shrink below its actual width
            try {
              m.desiredSize = new go.Size(Math.min(Math.max(cellWidth - 8, nb.width), cellWidth), nb.height);
            } catch { }

            const mdata = m.data;
            if (mdata) {
              const locStr = go.Point.stringify(locToPersist);
              try { (targetDiagram.model as any).setDataProperty(mdata, 'loc', locStr); } catch { mdata.loc = locStr; }
            }
          }
          targetDiagram.commitTransaction('group-drop-layout-lane');

          // ensure group wasn't moved
          try {
            if (originalGroupLoc && part.location && (!part.location.equals(originalGroupLoc))) {
              targetDiagram.startTransaction('restore-group-location');
              try { part.move(originalGroupLoc); } catch { try { (part as any).position = originalGroupLoc; } catch { } }
              targetDiagram.commitTransaction('restore-group-location');
            }
          } catch { }

          handleGroupSaveLayout(targetDiagram, part);
          targetDiagram.requestUpdate();
          return;
        }

        // Non-lane groups: fallback to existing drop-layout flow using augmented one-level members
        const dropOverrides = ((targetDiagram.model as any)?.modelData?.dropLayout) ?? null;
        const dropConfig = deriveDropLayoutConfig(preset ?? null, dropOverrides);

        const bounds = part.actualBounds ? part.actualBounds.copy() : null;
        const dropPoint = bounds ? bounds.center : part.location?.copy?.() || null;

        try {
          targetDiagram.startTransaction('group-drop-layout');
          applyDropLayout({
            diagram: targetDiagram,
            parts: filteredMembers,
            dropPoint,
            config: dropConfig,
            targetGroup: part as go.Group,
          });
          targetDiagram.commitTransaction('group-drop-layout');
        } catch (err) {
          try { targetDiagram.commitTransaction('group-drop-layout'); } catch { }
        }

        // ensure group wasn't moved
        try {
          if (originalGroupLoc && part.location && (!part.location.equals(originalGroupLoc))) {
            targetDiagram.startTransaction('restore-group-location');
            try { part.move(originalGroupLoc); } catch { try { (part as any).position = originalGroupLoc; } catch { } }
            targetDiagram.commitTransaction('restore-group-location');
          }
        } catch { }

        handleGroupSaveLayout(targetDiagram, part);
        targetDiagram.requestUpdate();
      }



      const globalLayoutOptions = [
        { label: "Grid", value: "Grid" },
        { label: "Circular", value: "Circular" },
        { label: "Tree", value: "Tree" },
        { label: "Force Directed", value: "ForceDirected" },
        { label: "Layered Digraph", value: "LayeredDigraph" },
        { label: "Manual", value: "Manual" },
      ];

      const dropLayoutMenuOptions = [
        { label: "Default Drop Layout", value: null },
        ...globalLayoutOptions
          .filter(option => option.value !== "Manual")
          .map(option => ({
            label: `${option.label} Drop Layout`,
            value: option.value,
          })),
      ];

      function applyGroupLayoutScheme(diagram: go.Diagram | null | undefined, part: go.Part | null, layoutKey: string) {
        const targetDiagram = diagram || myDiagram;
        if (!targetDiagram || !part) return;
        if (!(part instanceof go.Group)) return;
        const nodeData: any = part.data;
        if (!isGroupNode(nodeData)) return;

        const dragTool = targetDiagram.currentTool;
        if (dragTool instanceof go.DraggingTool && dragTool.isActive) {
          dragTool.doCancel();
        }

        const objview = resolveObjectview(nodeData);
        if (!objview) return;

        const normalized = layoutKey && layoutKey !== 'Manual' ? (layoutKey.endsWith('Layout') ? layoutKey : `${layoutKey}Layout`) : '';
        objview.groupLayout = normalized;
        targetDiagram.model.setDataProperty(nodeData, 'groupLayout', normalized);

        const jsnObjview = new jsn.jsnObjectView(objview);
        let data: any = jsnObjview;
        data = JSON.parse(JSON.stringify(data));
        const dispatchTarget = targetDiagram.dispatch ?? myMetis.myDiagram?.dispatch;
        dispatchTarget?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });

        if (layoutKey === 'Manual') {
          targetDiagram.requestUpdate();
          return;
        }

        uid.doGroupLayout(objview, targetDiagram, myMetis);
        handleGroupSaveLayout(targetDiagram, part);
        targetDiagram.requestUpdate();
      }

      const handleChangeIcon = (diagram: go.Diagram, part: go.Part) => {
        if (!diagram || !part) return;
        const data: any = part.data;
        if (!data || data.category !== constants.gojs.C_OBJECT) return;
        const nodePart = diagram.findPartForKey(data.key);
        if (nodePart) {
          diagram.select(nodePart);
        }
        const modalContext = {
          what: "selectDropdown",
          title: "Select Icon",
          case: "Change Icon",
          iconList: iconList(),
          currentNode: data,
          myDiagram: diagram,
        };
        myMetis.currentNode = data;
        myMetis.myDiagram = diagram;
        diagram.handleOpenModal(data, modalContext);
      };

      const canAddPortToNode = (part: go.Part) => {
        if (myMetis.modelType !== 'Modelling') return false;
        const data: any = part?.data;
        const template = data?.template;
        switch (template) {
          case 'Container1':
          case 'nodeWithPorts':
          case 'groupWithPorts':
          case 'groupWithIconAndPorts':
          case 'groupWithGeoAndPorts':
          case 'groupWithFigAndPorts':
            return true;
          default:
            return false;
        }
      };

  const handleAddPort = (diagram: go.Diagram, part: go.Part) => {
        if (!diagram || !part || !canAddPortToNode(part)) return;
        const nodeData: any = part.data;
        if (!nodeData) return;
        const nodeKey = nodeData?.key;
        const objviewRef = nodeData?.objviewRef || nodeKey;
        const objview = myMetis.findObjectView(objviewRef);
        const objectRef = nodeData?.objRef || objview?.objectRef || objview?.object?.id || nodeData?.object?.id;
        const modalContext = {
          what: "addPorts",
          title: "Add Ports",
          case: "Add Ports",
          node: {
            key: nodeKey,
            objviewRef: objviewRef,
            objRef: objectRef,
          },
          nodeKey: nodeKey,
          objviewRef: objviewRef,
          objectRef: objectRef,
          myDiagram: diagram,
          addPorts: {
            entries: [
              { key: 'input', label: 'Input', side: 'left', prefix: 'I', count: 1, startIndex: 1 },
              { key: 'control', label: 'Control', side: 'top', prefix: 'C', count: 1, startIndex: 1 },
              { key: 'output', label: 'Output', side: 'right', prefix: 'O', count: 1, startIndex: 1 },
              { key: 'mechanism', label: 'Mechanism', side: 'bottom', prefix: 'M', count: 1, startIndex: 1 },
            ],
          },
        };
        myMetis.myDiagram = diagram;
        diagram.handleOpenModal(nodeData, modalContext);
      };

      const isContainerObjectNode = (part: go.Part) => {
        const data: any = part?.data;
        if (!data || data.category !== constants.gojs.C_OBJECT) return false;
        const objview = data.objectview || myMetis.currentModelview?.findObjectView(data.key);
        return objview?.viewkind === 'Container';
      };

      const canOpenGroup = (part: go.Part) => {
        if (!isContainerObjectNode(part)) return false;
        const data: any = part?.data;
        const objview = data?.objectview || myMetis.currentModelview?.findObjectView(data?.key);
        return objview?.isExpanded === false;
      };

      const handleOpenGroup = (diagram: go.Diagram, part: go.Part) => {
        if (!diagram || !part || !canOpenGroup(part)) return;
        const data: any = part.data;
        const objview = data.objectview || myMetis.currentModelview?.findObjectView(data.key);
        if (!objview || objview?.isExpanded) return;
        const nodePart = diagram.findNodeForKey(data.key) as any;
        if (nodePart) {
          nodePart.isSubGraphExpanded = true;
        }
        data.isExpanded = true;
        objview.isExpanded = true;
        const jsnObjview = new jsn.jsnObjectView(objview, true);
        let payload: any = jsnObjview;
        payload = JSON.parse(JSON.stringify(payload));
        diagram.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: payload });
      };

      const collectNodesForArrangement = (diagram: go.Diagram, part: go.Part) => {
        const selectedNodes: go.Node[] = [];
        const selectedLinks: go.Link[] = [];
        diagram.selection.each((sel) => {
          if (sel instanceof go.Node) {
            selectedNodes.push(sel);
          } else if (sel instanceof go.Link) {
            selectedLinks.push(sel);
          }
        });
        if (part instanceof go.Node && !selectedNodes.includes(part)) {
          selectedNodes.push(part);
        }
        return { selectedNodes, selectedLinks };
      };

      const canArrangeSelectedNodes = (diagram: go.Diagram, part: go.Part) => {
        if (!diagram) return false;
        const { selectedNodes } = collectNodesForArrangement(diagram, part);
        return selectedNodes.length > 1;
      };

      const handleArrangeSelectedNodes = (diagram: go.Diagram, part: go.Part, direction: 'vertical' | 'horizontal') => {
        if (!diagram || !canArrangeSelectedNodes(diagram, part)) return;
        const { selectedNodes, selectedLinks } = collectNodesForArrangement(diagram, part);
        const anchorNode: any = selectedNodes[0];
        uid.alignNodes(anchorNode?.data, selectedNodes, direction, myMetis);
        if (selectedLinks.length > 0) {
          uid.clearPath(selectedLinks, myMetis, diagram);
        }
      };

      const handleSpreadSelectedNodes = (diagram: go.Diagram, part: go.Part, direction: 'vertical' | 'horizontal') => {
        if (!diagram || !canArrangeSelectedNodes(diagram, part)) return;
        const { selectedNodes, selectedLinks } = collectNodesForArrangement(diagram, part);
        const anchorNode: any = selectedNodes[0];
        uid.spreadEven(anchorNode?.data, selectedNodes, direction, myMetis);
        if (selectedLinks.length > 0) {
          uid.clearPath(selectedLinks, myMetis, diagram);
        }
      };

      const resolvePortContext = (diagram: go.Diagram, portObj?: go.GraphObject | null) => {
        if (!diagram || !portObj) return null;
        const nodePart = portObj.part as go.Node;
        const nodeData: any = nodePart?.data;
        if (!nodeData) return null;

        // Context clicks may arrive on a child shape/text; walk up to find the item data.
        let probe: any = portObj as any;
        let portData: any = probe?.data;
        while ((!portData || !portData.id) && probe?.panel) {
          probe = probe.panel;
          portData = probe?.data || portData;
        }
        if (!portData || !portData.id) return null;

        const objectId = nodeData?.objRef || nodeData?.object?.id;
        const object = objectId ? myMetis.findObject(objectId) : null;
        if (!object) return null;
        return { nodePart, nodeData, portData, portObj: probe || portObj, object };
      };

      const handleChangePortName = (diagram: go.Diagram, portObj?: go.GraphObject | null) => {
        const ctx = resolvePortContext(diagram, portObj);
        if (!ctx) return;
        const { nodeData, object, portData } = ctx;
        const nodeKey = nodeData?.key;
        const modalContext = {
          what: "editPortName",
          title: "Change Port Name",
          case: "Change Port Name",
          myDiagram: diagram,
          nodeKey: nodeKey,
          nodeData: nodeData,
          objectRef: nodeData?.objRef || object?.id,
          portObj: ctx.portObj || portObj,
          side: portData.side,
          portName: portData.name,
          editPortName: {
            value: portData.name ?? '',
          },
        };
        diagram.handleOpenModal(nodeData, modalContext);
      };
      myDiagram.handleChangePortName = handleChangePortName;

      const handleChangePortColor = (diagram: go.Diagram, portObj?: go.GraphObject | null) => {
        const ctx = resolvePortContext(diagram, portObj);
        if (!ctx) return;
        const { object, portData } = ctx;
        let portColor = portData.color;
        const side = portData.side;
        const port = object.getPort(side, portData.name);
        portColor = prompt('Enter port color', portColor);
        if (!portColor || !portColor.trim()) portColor = "transparent";
        if (port) port.color = portColor;
        uit.changePortColor(portObj, portColor, diagram);
        const jsnObj = new jsn.jsnObject(object);
        let data: any = jsnObj;
        data = JSON.parse(JSON.stringify(data));
        diagram.dispatch?.({ type: 'UPDATE_OBJECT_PROPERTIES', data });
      };

      const handleRemovePort = (diagram: go.Diagram, portObj?: go.GraphObject | null) => {
        const ctx = resolvePortContext(diagram, portObj);
        if (!ctx) return;
        const { object, portData } = ctx;
        const rels = object.getRelsConnectedToPort(portData.id) || [];
        rels.forEach((rel: any) => {
          if (!rel) return;
          const relview = rel.relshipview;
          if (relview) relview.markedAsDeleted = true;
          rel.markedAsDeleted = true;
          const jsnRel = new jsn.jsnRelationship(rel);
          let relData: any = jsnRel;
          relData = JSON.parse(JSON.stringify(relData));
          diagram.dispatch?.({ type: 'UPDATE_RELSHIP_PROPERTIES', data: relData });
        });
        object.deletePort(portData.side, portData.name);
        const jsnObj = new jsn.jsnObject(object);
        let objData: any = jsnObj;
        objData = JSON.parse(JSON.stringify(objData));
        diagram.dispatch?.({ type: 'UPDATE_OBJECT_PROPERTIES', data: objData });
        uit.removePort(portObj, diagram);
        diagram.requestUpdate();
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
        this.openAddConnectedDialog(diagram, part);
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
        if (this.props.onOpenSelectConnectedObjects) {
          const includeAllRels = this.state.selectConnectedIncludeAllRels || false;
          const relOptions = this.buildConnectedRelationshipOptions(part, includeAllRels);
          const reltypeOptions = this.buildModelReltypeOptions();
          this.props.onOpenSelectConnectedObjects({ diagram, part, relOptions, reltypeOptions });
          return;
        }
        this.openSelectConnectedDialog(diagram, part);
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

      const handleHideRelationshipView = (diagram: go.Diagram, part: go.Link) => {
        if (!diagram || !(part instanceof go.Link)) return;
        const selectedLinks: go.Link[] = [];
        diagram.selection.each((sel) => {
          if (!(sel instanceof go.Link)) return;
          const selData: any = sel.data;
          if (selData?.category === constants.gojs.C_RELATIONSHIP) {
            selectedLinks.push(sel);
          }
        });
        if (selectedLinks.length === 0) {
          selectedLinks.push(part);
        }

        const linksToHide: go.Link[] = [];
        const modifiedRelshipViews: jsn.jsnRelshipView[] = [];
        selectedLinks.forEach((link) => {
          const linkData: any = link.data;
          if (!linkData || linkData.category !== constants.gojs.C_RELATIONSHIP) return;
          let relview = myMetis.findRelationshipView(linkData?.relviewRef) || linkData?.relshipview;
          if (!relview) return;
          relview.visible = false;
          const jsnRelView = new jsn.jsnRelshipView(relview);
          modifiedRelshipViews.push(jsnRelView);
          link.visible = false;
          linksToHide.push(link);
        });

        linksToHide.forEach((link) => {
          diagram.remove(link);
        });
        modifiedRelshipViews.forEach((mn) => {
          let data: any = mn;
          data = JSON.parse(JSON.stringify(data));
          diagram.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data });
        });
      };

      const handleSelectAllViewsOfRelationship = (diagram: go.Diagram, part: go.Link) => {
        if (!diagram || !(part instanceof go.Link)) return;
        const data: any = part.data;
        if (!data || data.category !== constants.gojs.C_RELATIONSHIP) return;
        const relship = data.relship || myMetis.findRelationship(data?.relshipRef);
        const relshipId = relship?.id;
        if (!relshipId) return;

        let first = true;
        diagram.links.each((link) => {
          const linkData: any = link.data;
          if (!linkData || linkData.category !== constants.gojs.C_RELATIONSHIP) return;
          const otherRelship = linkData.relship || myMetis.findRelationship(linkData?.relshipRef);
          if (otherRelship?.id === relshipId) {
            if (first) {
              diagram.select(link);
              first = false;
            } else {
              link.isSelected = true;
            }
          }
        });
      };

      const canSelectAllViewsOfRelationship = (diagram: go.Diagram, part: go.Link) => {
        if (!diagram || !(part instanceof go.Link)) return false;
        const data: any = part.data;
        if (!data || data.category !== constants.gojs.C_RELATIONSHIP) return false;
        const relship = data.relship || myMetis.findRelationship(data?.relshipRef);
        const relshipId = relship?.id;
        if (!relshipId) return false;

        let count = 0;
        diagram.links.each((link) => {
          const linkData: any = link.data;
          if (!linkData || linkData.category !== constants.gojs.C_RELATIONSHIP) return;
          const otherRelship = linkData.relship || myMetis.findRelationship(linkData?.relshipRef);
          if (otherRelship?.id === relshipId) {
            count++;
          }
        });
        return count > 1;
      };

      const handleSwapRelationshipDirection = (diagram: go.Diagram, part: go.Link) => {
        if (!diagram || !(part instanceof go.Link)) return;
        const selectedLinks: go.Link[] = [];
        diagram.selection.each((sel) => {
          if (!(sel instanceof go.Link)) return;
          const selData: any = sel.data;
          if (selData?.category === constants.gojs.C_RELATIONSHIP) {
            selectedLinks.push(sel);
          }
        });
        if (selectedLinks.length === 0) {
          selectedLinks.push(part);
        }
        uid.swapDirection(selectedLinks, myMetis, diagram);
      };

      const canSwapRelationshipDirection = (part: go.Link) => {
        if (!(part instanceof go.Link)) return false;
        const data: any = part.data;
        if (!data || data.category !== constants.gojs.C_RELATIONSHIP) return false;
        const modelview = myMetis.currentModelview;
        const metamodel = myMetis.currentMetamodel;
        if (!modelview || !metamodel) return false;
        return uid.swapDirectionIsAllowed(data, modelview, metamodel);
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
        // Default to true if undefined - inheritance should work by default
        if (includeInheritedReltypes === undefined || includeInheritedReltypes === null) {
          includeInheritedReltypes = true;
          myModelview.includeInheritedReltypes = true;
        }
        console.log('[REL-LOOKUP] Looking up relationship types from', fromType?.name, 'to', toType?.name, 'includeInheritance:', includeInheritedReltypes);
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
        console.log('[REL-LOOKUP] Found', reltypes.length, 'relationship types from metamodel');
        const extraTypes = myMetis.findRelationshipTypesBetweenTypes(fromType, toType, true) || [];
        console.log('[REL-LOOKUP] Found', extraTypes.length, 'extra types from metis');
        for (let i = 0; i < extraTypes.length; i++) {
          const rtype = extraTypes[i];
          if (!rtype) continue;
          if (rtype.name === constants.types.AKM_GENERIC_REL || rtype.name === constants.types.AKM_CONTAINS) {
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
          if (!persistDeletedObjectPart(diagram, part)) {
            diagram.commandHandler.deleteSelection();
          }
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
          if (!persistDeletedRelationshipPart(diagram, part)) {
            diagram.commandHandler.deleteSelection();
          }
        }
      };

      const handleDeleteSelection = (diagram: go.Diagram) => {
        if (!diagram) return;
        if (!diagram.commandHandler.canDeleteSelection()) return;
        if (confirm('Do you really want to delete the current selection?')) {
          myMetis.deleteViewsOnly = false;
          const selectedParts: go.Part[] = [];
          diagram.selection.each((sel) => selectedParts.push(sel));
          let deletedAny = false;
          for (let i = 0; i < selectedParts.length; i++) {
            deletedAny = persistDeletedObjectPart(diagram, selectedParts[i]) || deletedAny;
            deletedAny = persistDeletedRelationshipPart(diagram, selectedParts[i]) || deletedAny;
          }
          if (!deletedAny) {
            diagram.commandHandler.deleteSelection();
          }
        }
      };

      const deleteNodeMenuItems = (part: go.Part): HtmlMenuItem[] => [
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
          label: "Delete Selection",
          action: (diagram) => handleDeleteSelection(diagram),
          enabled: (diagram) => diagram.commandHandler.canDeleteSelection(),
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

      // const deleteLinkMenuItems = (part: go.Link): HtmlMenuItem[] => [
      //   {
      //     label: "Delete Selection",
      //     action: (diagram) => handleDeleteSelection(diagram),
      //     enabled: (diagram) => diagram.commandHandler.canDeleteSelection(),
      //   },
      //   {
      //     label: "Delete",
      //     action: (diagram) => {
      //       if (!diagram || !(part instanceof go.Link)) return;
      //       const restore = exclusiveSelectPart(diagram, part);
      //       if (!diagram.commandHandler.canDeleteSelection()) {
      //         restore();
      //         return;
      //       }
      //       if (!confirm('Do you really want to delete this relationship?')) {
      //         restore();
      //         return;
      //       }
      //       myMetis.deleteViewsOnly = false;
      //       myMetis.currentLink = part.data;
      //       diagram.commandHandler.deleteSelection();
      //       restore();
      //     },
      //     enabled: (diagram) => canDeleteSinglePart(diagram, part),
      //   },
      //   {
      //     label: "Delete View",
      //     action: (diagram) => {
      //       if (!diagram || !(part instanceof go.Link)) return;
      //       const restore = exclusiveSelectPart(diagram, part);
      //       if (!diagram.commandHandler.canDeleteSelection()) {
      //         restore();
      //         return;
      //       }
      //       if (!confirm('Do you really want to delete the current relationship view?')) {
      //         restore();
      //         return;
      //       }
      //       myMetis.deleteViewsOnly = true;
      //       myMetis.currentLink = part.data;
      //       diagram.commandHandler.deleteSelection();
      //       restore();
      //     },
      //     enabled: (diagram) => canDeleteSinglePart(diagram, part),
      //   },
      // ];

      const buildObjectMenuItems = (part: go.Part): HtmlMenuItem[] => {
        const objectMenuItems: HtmlMenuItem[] = [
          {
            label: "Edit Object",
            action: () => handleEditObject(part),
          },
          {
            label: "Convert to Group",
            action: (diagram) => handleConvertToGroup(diagram, part),
            visible: () => canConvertToGroup(part?.data),
          },
          {
            label: "Convert to Object",
            action: (diagram) => handleConvertToNode(diagram, part),
            visible: () => canConvertToNode(part?.data),
          },
          {
            label: "Enable Ports",
            action: (diagram) => handleEnablePorts(diagram, part),
            visible: () => canEnablePorts(part?.data),
          },
          {
            label: "Add Ports",
            action: (diagram) => handleAddPort(diagram, part),
            visible: () => canAddPortToNode(part),
            enabled: () => canAddPortToNode(part),
          },
          {
            label: "Select all of this type",
            action: (diagram) => handleSelectAllObjectsOfSameType(diagram, part),
          },
          { separator: true },
          {
            label: "Delete Object",
            action: (diagram) => handleDeletePart(diagram, part),
            enabled: (diagram) => canDeleteSinglePart(diagram, part),
          },
          {
            label: "Delete Selection",
            action: (diagram) => handleDeleteSelection(diagram),
            enabled: (diagram) => diagram.commandHandler.canDeleteSelection(),
          }
        ];
        return objectMenuItems;
      };

      const buildNodeMenuItems = (part: go.Part): HtmlMenuItem[] => {
        const items: HtmlMenuItem[] = [];
        const data: any = part.data || {};
        const isMetamodelObjectTypeNode =
          myMetis.modelType === 'Metamodelling' &&
          (!!data.objecttype || !!data.objtypeRef);

        // Metamodel window: objecttype nodes only expose "Edit Object Type" and "Edit Object Typeview"
        if (data.category === constants.gojs.C_OBJECTTYPE || isMetamodelObjectTypeNode) {
          return [
            {
              label: "Edit Object Type",
              action: (diagram) => {
                const node = part.data;
                if (!node) return;
                const icon = uit.findImage(node.icon);
                const objecttype = myMetis.findObjectType(node.objecttype?.id || node.objtypeRef) || node.objecttype;
                const objecttypeview = objecttype?.typeview;
                const myContext = {
                  objecttype:      objecttype,
                  objecttypeview:  objecttypeview,
                  relship:         null,
                  relshipview:     null,
                  relshiptype:     null,
                  relshiptypeview: null,
                  model:           myMetis.currentModel,
                  modelview:       myMetis.currentModelview,
                  metamodel:       myMetis.currentMetamodel,
                };
                const modalContext = {
                  what:      "editObjectType",
                  title:     "Edit Object Type",
                  icon:      icon,
                  myDiagram: diagram || myDiagram,
                  myContext: myContext,
                };
                myMetis.currentNode = node;
                myMetis.myDiagram = diagram || myDiagram;
                (diagram || myDiagram).handleOpenModal(node, modalContext);
              },
            },
            {
              label: "Edit Object Typeview",
              action: (diagram) => {
                const node = part.data;
                if (!node) return;
                uid.editObjectTypeview(node, myMetis, diagram || myDiagram, false);
              },
            },
          ];
        }

        const isObject =
          data.category === constants.gojs.C_OBJECT ||
          !!data.object ||
          !!data.objectview ||
          data.isGroup === true ||
          (part instanceof go.Group) ||
          (typeof data.viewkind === 'string' && data.viewkind.toLowerCase() === 'container');
        const buildGroupLayoutMenuItems = (): HtmlMenuItem[] => {
          const groupRelationshipPathItems: HtmlMenuItem[] = [
            {
              label: "Normal",
              action: (diagram) => handleGroupRelshipRouting(diagram, "Normal", part),
            },
            {
              label: "Orthogonal",
              action: (diagram) => handleGroupRelshipRouting(diagram, "Orthogonal", part),
            },
            {
              label: "Avoids Nodes",
              action: (diagram) => handleGroupRelshipRouting(diagram, "AvoidsNodes", part),
            },
            { separator: true },
            {
              label: "Clear path",
              action: (diagram) => handleGroupResetRelshipPath(diagram, part),
            }
          ];
          try { (groupRelationshipPathItems as any).menuHeading = 'Relationship Paths'; } catch (_) {}
          const groupLayoutItems: HtmlMenuItem[] = [
            {
              label: "Lane Flow (Start → End)",
              action: (diagram) => applyGroupLayoutScheme(diagram, part, "LaneFlow"),
              visible: () => isLaneGroup(part),
            },
            {
              separator: true,
              visible: () => isLaneGroup(part),
            },
            {
              label: "Grid",
              action: (diagram) => applyGroupLayoutScheme(diagram, part, "Grid"),
            },
            {
              label: "Circular",
              action: (diagram) => applyGroupLayoutScheme(diagram, part, "Circular"),
            },
            {
              label: "Tree",
              action: (diagram) => applyGroupLayoutScheme(diagram, part, "Tree"),
            },
            {
              label: "Force Directed",
              action: (diagram) => applyGroupLayoutScheme(diagram, part, "ForceDirected"),
            },
            {
              label: "Layered Digraph",
              action: (diagram) => applyGroupLayoutScheme(diagram, part, "LayeredDigraph"),
            },
            {
              label: "Manual",
              action: (diagram) => applyGroupLayoutScheme(diagram, part, "Manual"),
            },
            { separator: true },
            {
              label: "Relationship Paths…",
              action: showSubMenu(groupRelationshipPathItems),
              closeOnClick: false,
            },
            { separator: true },
            {
              label: "Do Layout",
              action: (diagram) => handleGroupDoLayout(diagram, part),
            },
            {
              label: "Save Layout",
              action: (diagram) => handleGroupSaveLayout(diagram, part),
            }
          ];
          try { (groupLayoutItems as any).menuHeading = 'Group Layout'; } catch (_) {}
          return groupLayoutItems;
        };
        items.push({
          label: "Copy",
          action: (diagram) => handlePartCopy(diagram, part),
        });
        if (isObject) {
          items.push({
            label: "Delete",
            action: (diagram) => handleDeletePart(diagram, part),
            enabled: (diagram) => canDeleteSinglePart(diagram, part),
          });
          items.push({
            label: "Select all of this type",
            action: (diagram) => handleSelectAllObjectsOfSameType(diagram, part),
          });
        }
        items.push({
          label: "Paste",
          action: (diagram) => handlePartPaste(diagram, false),
          enabled: (diagram) => diagram.commandHandler.canPasteSelection(),
          visible: (diagram) => diagram.commandHandler.canPasteSelection() && (
            (part instanceof go.Group) ||
            isGroupNode(part?.data) ||
            isPoolGroup(part) ||
            isLaneGroup(part)
          ),
        });
        items.push({
          label: "Paste View",
          action: (diagram) => handlePartPaste(diagram, true),
          enabled: (diagram) => diagram.commandHandler.canPasteSelection(),
          visible: (diagram) => diagram.commandHandler.canPasteSelection() && (
            (part instanceof go.Group) ||
            isGroupNode(part?.data) ||
            isPoolGroup(part) ||
            isLaneGroup(part)
          ),
        });
        if (canEditAttribute(part)) {
          items.push({
            label: "Edit Relationship Type",
            action: (diagram) => handleEditAttribute(diagram, part),
          });
        }
        if (isObject) {
          items.push({ separator: true });
          // Group common object actions into an "Object…" submenu
          items.push({
            label: "Object…",
            action: showSubMenu(buildObjectMenuItems(part)),
            closeOnClick: false,
          });
          // Group object-view related actions into an "Objectview…" submenu
          items.push({
            label: "Objectview…",
            action: showSubMenu([
              {
                label: "Edit Object View",
                action: (diagram) => handleEditObjectview(part),
              },
              {
                label: "Delete Object View",
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
              { separator: true },
              {  
                label: "Change Icon",
                action: (diagram) => {
                  const node = part.data;
                  if (!node) return;
                  if (node) diagram.select && diagram.select(diagram.findPartForKey(node.key));
                  const modalContext = {
                    what: "selectDropdown",
                    title: "Select Icon",
                    case: "Change Icon",
                    iconList: iconList(),
                    currentNode: node,
                    myDiagram: diagram
                  };
                  myMetis.currentNode = node;
                  myMetis.myDiagram = diagram;
                  diagram.handleOpenModal(node, modalContext);
                },
                enabled: (diagram) => {
                  const node = part.data;
                  return !!node && node.category === constants.gojs.C_OBJECT;
                }
              }
              ,
              {
                label: 'Set Objectview Colors',
                action: (() => {
                  const objColorItems: HtmlMenuItem[] = [
                    {
                      label: 'Fill color',
                      closeOnClick: false,
                      render: (container: HTMLElement, diagram: go.Diagram, tool: any, item: any) => {
                        try {
                          const nodeData = part?.data;
                          const current = (nodeData && (nodeData.fillcolor || '')) || '';
                          const wrap = document.createElement('div');
                          wrap.style.display = 'flex';
                          wrap.style.alignItems = 'center';
                          wrap.style.gap = '8px';
                          const lbl = document.createElement('span');
                          lbl.textContent = 'Fill';
                          lbl.style.minWidth = '56px';

                          const inp = document.createElement('input');
                          inp.type = 'color';
                          try {
                            const initial = (current && go.Brush.isValidColor && go.Brush.isValidColor(current)) ? current : '#d3d3d3';
                            inp.value = initial;
                            inp.defaultValue = initial;
                            try { inp.setAttribute('value', initial); } catch (_) {}
                          } catch (_) { inp.value = '#d3d3d3'; inp.defaultValue = '#d3d3d3'; try { inp.setAttribute('value', '#d3d3d3'); } catch (_) {} }
                          inp.style.cursor = 'pointer';
                          inp.onclick = (ev) => { ev.stopPropagation(); };
                          inp.oninput = (ev) => {
                            try {
                              const val = (ev.target as HTMLInputElement).value;
                              if (nodeData) {
                                const targetDiagram = diagram || myDiagram;
                                try {
                                  const objview = myMetis.findObjectView(nodeData.key) || nodeData.objectview;
                                  if (objview) {
                                    objview.fillcolor = val;
                                    const jsnObjview = new jsn.jsnObjectView(objview, true);
                                    const data = JSON.parse(JSON.stringify(jsnObjview));
                                    targetDiagram.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
                                  }
                                } catch (e) { if ((window as any).DEBUG_GOJS_MENUS) console.debug('update objectview fillcolor failed', e); }
                                try { inp.value = val; } catch (_) {}
                                (diagram || myDiagram)?.requestUpdate?.();
                              }
                            } catch (_) {}
                          };

                          const presets = [
                            { label: 'Black', value: '#000000' },
                            { label: 'White', value: '#ffffff' },
                            { label: 'Red', value: '#ff0000' },
                            { label: 'Green', value: '#00ff00' },
                            { label: 'Blue', value: '#0000ff' },
                            { label: 'Yellow', value: '#ffff00' },
                            { label: 'Orange', value: '#ffa500' },
                            { label: 'Purple', value: '#800080' },
                            { label: 'Gray', value: '#808080' },
                            { label: 'Brown', value: '#8b4513' },
                            { label: 'Pink', value: '#ffc0cb' },
                            { label: 'Cyan', value: '#00ffff' },
                            { label: 'Transparent', value: 'rgba(0,0,0,0)' }
                          ];
 
                          const sel = document.createElement('select');
                          sel.style.cursor = 'pointer';
                          sel.style.padding = '2px 6px';
                          sel.style.fontSize = '12px';
                          sel.style.minWidth = '84px';
                          const emptyOpt = document.createElement('option');
                          emptyOpt.value = '';
                          emptyOpt.text = 'Select Color';
                          sel.appendChild(emptyOpt);
                          for (const p of presets) {
                            const o = document.createElement('option');
                            o.value = p.value;
                            o.text = p.label;
                            sel.appendChild(o);
                          }
                          sel.onpointerdown = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                          sel.onclick = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                          sel.onchange = (ev) => { ev.stopPropagation && ev.stopPropagation();
                            console.debug('[OBJVIEW FILL SEL.ONCHANGE] fired', ev);
                            const val = (ev.target as HTMLSelectElement).value;
                            if (val === 'rgba(0,0,0,0)') {
                              // Set GoJS property to transparent
                              diagram.model.setDataProperty(nodeData, 'fillcolor', 'rgba(0,0,0,0)');
                              // Set input to a valid color (e.g., #000000)
                              inp.value = '#000000';
                              inp.style.background = 'repeating-linear-gradient(45deg,#ccc,#ccc 5px,#fff 5px,#fff 10px)';
                            } else {
                              diagram.model.setDataProperty(nodeData, 'fillcolor', val);
                              inp.value = val;
                              inp.style.background = '';
                            }
                            const part = diagram.findPartForKey(nodeData.key);
                            if (part) part.updateTargetBindings();
                            diagram.requestUpdate();
                            try {
                              const val = (ev.target as HTMLSelectElement).value;
                              console.debug('[OBJVIEW FILL SEL.ONCHANGE] val:', val, 'nodeData:', nodeData?.key);
                              if (val && nodeData && diagram) {
                                try { sel.value = val; } catch (_) {}
                                try { sel.selectedIndex = Array.from(sel.options).findIndex(o => o.value === val); } catch (_) {}
                                // Synchronously update the GoJS model (same approach as Icon menu)
                                try { diagram.model.setDataProperty(nodeData, 'fillcolor', val); } catch (_) {}
                                console.debug('[OBJVIEW FILL SEL.ONCHANGE] model updated');
                                if ((window as any).DEBUG_GOJS_MENUS) {
                                  try {
                                    const fd = (diagram && typeof (diagram as any).findNodeForKey === 'function') ? (diagram as any).findNodeForKey(nodeData?.key) : null;
                                    console.debug('[objview fill] sel.onchange', { val, nodeKey: nodeData?.key, foundNodeData: fd && fd.data ? fd.data : nodeData });
                                  } catch (_) {}
                                }
                                // update the color input UI immediately
                                try { inp.value = val; inp.defaultValue = val; try { inp.setAttribute('value', val); } catch (_) {} } catch (_) {}
                                try { inp.dispatchEvent(new InputEvent('input', { bubbles: true })); } catch (_) {}
                                try { inp.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
                                diagram.updateAllBindings(); // <-- Add this line
                                diagram.requestUpdate();
                                // persist asynchronously to avoid racing with menu disposal
                                try {

                                  setTimeout(() => {
                                    try {
                                      const objview = myMetis.findObjectView(nodeData.key) || nodeData.objectview;
                                      if (objview) {
                                        objview.fillcolor = val;
                                        const jsnObjview = new jsn.jsnObjectView(objview, true);
                                        const data = JSON.parse(JSON.stringify(jsnObjview));
                                        try { (diagram || myDiagram).dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data }); } catch (_) {}
                                      }
                                    } catch (_) {}
                                  }, 0);
                                } catch (_) {}
                              }
                            } catch (_) {}
                          };

                          wrap.appendChild(lbl);
                          wrap.appendChild(sel);
                          wrap.appendChild(inp);
                          container.textContent = '';
                          container.appendChild(wrap);
                        } catch (e) { if ((window as any).DEBUG_GOJS_MENUS) console.debug('render objectview fillcolor failed', e); }
                      }
                    },
                    {
                      label: 'Stroke color',
                      closeOnClick: false,
                      render: (container: HTMLElement, diagram: go.Diagram, tool: any, item: any) => {
                        try {
                          const nodeData = part?.data;
                          const current = (nodeData && (nodeData.strokecolor || '')) || '';
                          const wrap = document.createElement('div');
                          wrap.style.display = 'flex';
                          wrap.style.alignItems = 'center';
                          wrap.style.gap = '8px';
                          const lbl = document.createElement('span');
                          lbl.textContent = 'Stroke';
                          lbl.style.minWidth = '56px';
                          const inp = document.createElement('input');
                          inp.type = 'color';
                          try {
                            const initial = (current && go.Brush.isValidColor && go.Brush.isValidColor(current)) ? current : '#d3d3d3';
                            inp.value = initial;
                            inp.defaultValue = initial;
                            try { inp.setAttribute('value', initial); } catch (_) {}
                          } catch (_) { inp.value = '#d3d3d3'; inp.defaultValue = '#d3d3d3'; try { inp.setAttribute('value', '#d3d3d3'); } catch (_) {} }
                          inp.style.cursor = 'pointer';
                          inp.onclick = (ev) => { ev.stopPropagation(); };
                          inp.oninput = (ev) => {
                            try {
                              const val = (ev.target as HTMLInputElement).value;
                              if (nodeData) {
                                const targetDiagram = diagram || myDiagram;
                                try {
                                  const objview = myMetis.findObjectView(nodeData.key) || nodeData.objectview;
                                  if (objview) {
                                    objview.strokecolor = val;
                                    const jsnObjview = new jsn.jsnObjectView(objview, true);
                                    const data = JSON.parse(JSON.stringify(jsnObjview));
                                    targetDiagram.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
                                  }
                                } catch (e) { if ((window as any).DEBUG_GOJS_MENUS) console.debug('update objectview strokecolor failed', e); }
                                try { inp.value = val; } catch (_) {}
                                (diagram || myDiagram)?.requestUpdate?.();
                              }
                            } catch (_) {}
                          };

                          const presets = [
                            { label: 'Black', value: '#000000' },
                            { label: 'White', value: '#ffffff' },
                            { label: 'Red', value: '#ff0000' },
                            { label: 'Green', value: '#00ff00' },
                            { label: 'Blue', value: '#0000ff' },
                            { label: 'Yellow', value: '#ffff00' },
                            { label: 'Orange', value: '#ffa500' },
                            { label: 'Purple', value: '#800080' },
                            { label: 'Gray', value: '#808080' },
                            { label: 'Brown', value: '#8b4513' },
                            { label: 'Pink', value: '#ffc0cb' },
                            { label: 'Cyan', value: '#00ffff' },
                            { label: 'Transparent', value: 'rgba(0,0,0,0)' }
                          ];
                          const sel = document.createElement('select');
                          sel.style.cursor = 'pointer';
                          sel.style.padding = '2px 6px';
                          sel.style.fontSize = '12px';
                          sel.style.minWidth = '84px';
                          const emptyOpt = document.createElement('option');
                          emptyOpt.value = '';
                          emptyOpt.text = 'Select Color';
                          sel.appendChild(emptyOpt);
                          for (const p of presets) {
                            const o = document.createElement('option');
                            o.value = p.value;
                            o.text = p.label;
                            sel.appendChild(o);
                          }
                          sel.onpointerdown = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                          sel.onclick = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                          sel.onchange = (ev) => { ev.stopPropagation && ev.stopPropagation();
                            console.debug('[OBJVIEW STROKE SEL.ONCHANGE] fired', ev);
                            try {
                              const val = (ev.target as HTMLSelectElement).value;
                              console.debug('[OBJVIEW STROKE SEL.ONCHANGE] val:', val, 'nodeData:', nodeData?.key);
                              if (val && nodeData && diagram) {
                                try { sel.value = val; } catch (_) {}
                                try { sel.selectedIndex = Array.from(sel.options).findIndex(o => o.value === val); } catch (_) {}
                                // Synchronously update the GoJS model (same approach as Icon menu)
                                try { diagram.model.setDataProperty(nodeData, 'strokecolor', val); } catch (_) {}
                                console.debug('[OBJVIEW STROKE SEL.ONCHANGE] model updated');
                                if ((window as any).DEBUG_GOJS_MENUS) {
                                  try {
                                    const fd = (diagram && typeof (diagram as any).findNodeForKey === 'function') ? (diagram as any).findNodeForKey(nodeData?.key) : null;
                                    console.debug('[objview stroke] sel.onchange', { val, nodeKey: nodeData?.key, foundNodeData: fd && fd.data ? fd.data : nodeData });
                                  } catch (_) {}
                                }
                                // update the color input UI immediately
                                try { inp.value = val; inp.defaultValue = val; try { inp.setAttribute('value', val); } catch (_) {} } catch (_) {}
                                try { inp.dispatchEvent(new InputEvent('input', { bubbles: true })); } catch (_) {}
                                try { inp.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
                                diagram.requestUpdate();

                                // persist asynchronously to avoid racing with menu disposal
                                try {
                                  setTimeout(() => {
                                    try {
                                      const objview = myMetis.findObjectView(nodeData.key) || nodeData.objectview;
                                      if (objview) {
                                        objview.strokecolor = val;
                                        const jsnObjview = new jsn.jsnObjectView(objview, true);
                                        const data = JSON.parse(JSON.stringify(jsnObjview));
                                        try { (diagram || myDiagram).dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data }); } catch (_) {}
                                      }
                                    } catch (_) {}
                                  }, 0);
                                } catch (_) {}
                              }
                            } catch (_) {}
                          };

                          wrap.appendChild(lbl);
                          wrap.appendChild(sel);
                          wrap.appendChild(inp);
                          container.textContent = '';
                          container.appendChild(wrap);
                        } catch (e) { if ((window as any).DEBUG_GOJS_MENUS) console.debug('render objectview strokecolor failed', e); }
                      }
                    },
                    {
                      label: 'Text color',
                      closeOnClick: false,
                      render: (container: HTMLElement, diagram: go.Diagram, tool: any, item: any) => {
                        try {
                          const nodeData = part?.data;
                          const current = (nodeData && (nodeData.textcolor || '')) || '';
                          const wrap = document.createElement('div');
                          wrap.style.display = 'flex';
                          wrap.style.alignItems = 'center';
                          wrap.style.gap = '8px';
                          const lbl = document.createElement('span');
                          lbl.textContent = 'Text';
                          lbl.style.minWidth = '56px';
                          const inp = document.createElement('input');
                          inp.type = 'color';
                          try {
                            const initial = (current && go.Brush.isValidColor && go.Brush.isValidColor(current)) ? current : '#d3d3d3';
                            inp.value = initial;
                            inp.defaultValue = initial;
                            try { inp.setAttribute('value', initial); } catch (_) {}
                          } catch (_) { inp.value = '#d3d3d3'; inp.defaultValue = '#d3d3d3'; try { inp.setAttribute('value', '#d3d3d3'); } catch (_) {} }
                          inp.style.cursor = 'pointer';
                          inp.onclick = (ev) => { ev.stopPropagation(); };
                          inp.oninput = (ev) => {
                            try {
                              const val = (ev.target as HTMLInputElement).value;
                              if (nodeData) {
                                const targetDiagram = diagram || myDiagram;
                                try {
                                  // Update the GoJS model first
                                  try { targetDiagram.model.setDataProperty(nodeData, 'textcolor', val); } catch (_) {}
                                  // Then update the objview
                                  const objview = myMetis.findObjectView(nodeData.key) || nodeData.objectview;
                                  if (objview) {
                                    objview.textcolor = val;
                                    const jsnObjview = new jsn.jsnObjectView(objview, true);
                                    const data = JSON.parse(JSON.stringify(jsnObjview));
                                    targetDiagram.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
                                  }
                                } catch (e) { if ((window as any).DEBUG_GOJS_MENUS) console.debug('update objectview textcolor failed', e); }
                                try { inp.value = val; } catch (_) {}
                                (diagram || myDiagram)?.requestUpdate?.();
                              }
                            } catch (_) {}
                          };

                          const presets = [
                            { label: 'Black', value: '#000000' },
                            { label: 'White', value: '#ffffff' },
                            { label: 'Red', value: '#ff0000' },
                            { label: 'Green', value: '#00ff00' },
                            { label: 'Blue', value: '#0000ff' },
                            { label: 'Yellow', value: '#ffff00' },
                            { label: 'Orange', value: '#ffa500' },
                            { label: 'Purple', value: '#800080' },
                            { label: 'Gray', value: '#808080' },
                            { label: 'Brown', value: '#8b4513' },
                            { label: 'Pink', value: '#ffc0cb' },
                            { label: 'Cyan', value: '#00ffff' },
                                                       { label: 'Transparent', value: 'rgba(0,0,0,0)' }
                          ];
                          const sel = document.createElement('select');
                          sel.style.cursor = 'pointer';
                          sel.style.padding = '2px 6px';
                          sel.style.fontSize = '12px';
                          sel.style.minWidth = '84px';
                          const emptyOpt = document.createElement('option');
                          emptyOpt.value = '';
                          emptyOpt.text = 'Select Color';
                          sel.appendChild(emptyOpt);
                          for (const p of presets) {
                            const o = document.createElement('option');
                            o.value = p.value;
                            o.text = p.label;
                            sel.appendChild(o);
                          }
                          sel.onpointerdown = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                          sel.onclick = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                          sel.onchange = (ev) => { ev.stopPropagation && ev.stopPropagation();
                            console.debug('[OBJVIEW TEXT SEL.ONCHANGE] fired', ev);
                            try {
                              const val = (ev.target as HTMLSelectElement).value;
                              console.debug('[OBJVIEW TEXT SEL.ONCHANGE] val:', val, 'nodeData:', nodeData?.key);
                              if (val && nodeData && diagram) {
                                try { sel.value = val; } catch (_) {}
                                try { sel.selectedIndex = Array.from(sel.options).findIndex(o => o.value === val); } catch (_) {}
                                // Synchronously update the GoJS model (same approach as Icon menu)
                                try { diagram.model.setDataProperty(nodeData, 'textcolor', val); } catch (_) {}
                                console.debug('[OBJVIEW TEXT SEL.ONCHANGE] model updated');
                                if ((window as any).DEBUG_GOJS_MENUS) {
                                  try {
                                    const fd = (diagram && typeof (diagram as any).findNodeForKey === 'function') ? (diagram as any).findNodeForKey(nodeData?.key) : null;
                                    console.debug('[objview text] sel.onchange', { val, nodeKey: nodeData?.key, foundNodeData: fd && fd.data ? fd.data : nodeData });
                                  } catch (_) {}
                                }
                                // update the color input UI immediately
                                try { inp.value = val; inp.defaultValue = val; try { inp.setAttribute('value', val); } catch (_) {} } catch (_) {}
                                try { inp.dispatchEvent(new InputEvent('input', { bubbles: true })); } catch (_) {}
                                try { inp.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
                                diagram.requestUpdate();

                                // persist asynchronously to avoid racing with menu disposal
                                try {
                                  setTimeout(() => {
                                    try {
                                      const objview = myMetis.findObjectView(nodeData.key) || nodeData.objectview;
                                      if (objview) {
                                        objview.textcolor = val;
                                        const jsnObjview = new jsn.jsnObjectView(objview, true);
                                        const data = JSON.parse(JSON.stringify(jsnObjview));
                                        try { (diagram || myDiagram).dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data }); } catch (_) {}
                                      }
                                    } catch (_) {}
                                  }, 0);
                                } catch (_) {}
                              }
                            } catch (_) {}
                          };

                          wrap.appendChild(lbl);
                          wrap.appendChild(sel);
                          wrap.appendChild(inp);
                          container.textContent = '';
                          container.appendChild(wrap);
                        } catch (e) { if ((window as any).DEBUG_GOJS_MENUS) console.debug('render objectview textcolor failed', e); }
                      }
                    }
                  ];
                  try { (objColorItems as any).menuHeading = 'Set Objectview Colors'; } catch (_) {}
                  return showSubMenu(objColorItems);
                })(),
                closeOnClick: false
              }
            ]),
            closeOnClick: false,
          });
          items.push({ separator: true });
          items.push({
            label: "Generate Metamodel…",
            action: showSubMenu([
              {
                label: "Publish to Workspace",
                action: (diagram) => { void handleGenerateMetamodel(diagram, part?.data, 'workspace'); },
                enabled: (_diagram) => canGenerateMetamodelFromData(part?.data),
              },
              {
                label: "Generate/Update in Current Project",
                action: (diagram) => { void handleGenerateMetamodel(diagram, part?.data, 'current'); },
                enabled: (_diagram) => canGenerateMetamodelFromData(part?.data),
              },
              {
                label: "As New Project File…",
                action: (diagram) => { void handleGenerateMetamodel(diagram, part?.data, 'new-project'); },
                enabled: (_diagram) => canGenerateMetamodelFromData(part?.data),
              },
              {
                label: "Update Existing Project File…",
                action: (diagram) => { void handleGenerateMetamodel(diagram, part?.data, 'existing-project'); },
                enabled: (_diagram) => canGenerateMetamodelFromData(part?.data),
              },
            ]),
            enabled: (_diagram) => canGenerateMetamodelFromData(part?.data),
            visible: (_diagram) => canGenerateMetamodelFromData(part?.data),
            closeOnClick: false,
          });
          items.push({
            label: "Reset to Typeview",
            action: (diagram) => {
              if (!diagram) return;
              let selection: any = diagram.selection;
              if (selection.count == 0) {
                const currentNode = part.data;
                if (currentNode) diagram.select && diagram.select(diagram.findPartForKey(currentNode.key));
                selection = diagram.selection;
              }
              selection.each(function (sel: any) {
                const inst = sel.data;
                if (inst && inst.category === constants.gojs.C_OBJECT) {
                  uid.resetToTypeview(inst, myMetis, diagram);
                }
              });
            },
            enabled: (diagram) => true,
            //   {
            //   const node = part.data;
            //   if (node?.category === constants.gojs.C_OBJECT) {
            //     if (node.isSelected) {
            //       return true;
            //     } else {
            //       const selection = diagram.selection;
            //       if (selection.count == 0) return true;
            //       else return false;
            //     }
            //   }
            //   return false;
            // }
          });
          items.push({
            label: "Change Icon",
            action: (diagram) => handleChangeIcon(diagram, part),
          });
          items.push({
            label: "Open Group",
            action: (diagram) => handleOpenGroup(diagram, part),
            enabled: () => canOpenGroup(part),
          });
          const connectionsMenuItems: HtmlMenuItem[] = [
            {
              label: "Add Connected Objects",
              action: (diagram) => handleAddConnectedObjects(diagram, part),
            },
            {
              label: "Connect to Selected",
              action: (diagram) => handleConnectToSelected(diagram, part),
              enabled: (diagram) => !!diagram && diagram.selection.count > 0,
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
              label: "Add to Selection",
              action: (_diagram) => uid.addToSelection(part, myDiagram),
            },
            {
              label: "Delete Selection",
              action: (diagram) => handleDeleteSelection(diagram),
              enabled: (diagram) => !!diagram && diagram.commandHandler.canDeleteSelection(),
            },
            {
              label: "Sort Selection",
              action: (diagram) => handleSortSelection(diagram),
              enabled: (diagram) => !!diagram && diagram.selection.count > 1,
            },
            {
              label: "Delete Selected Views",
              action: (diagram) => handleDeleteSelectedViews(diagram),
              enabled: (diagram) => !!diagram && diagram.commandHandler.canDeleteSelection(),
            },
            {
              label: "Select all of this type",
              action: (diagram) => handleSelectAllObjectsOfSameType(diagram, part),
            },
          ];
          items.push({
            label: "Selection…",
            action: showSubMenu(selectionMenuItems),
            closeOnClick: false,
          });
          items.push({ separator: true });
          const arrangeMenuItems: HtmlMenuItem[] = [
            {
              label: "Align Vertical",
              action: (diagram) => handleArrangeSelectedNodes(diagram, part, 'vertical'),
              enabled: (diagram) => canArrangeSelectedNodes(diagram, part),
            },
            {
              label: "Align Horizontal",
              action: (diagram) => handleArrangeSelectedNodes(diagram, part, 'horizontal'),
              enabled: (diagram) => canArrangeSelectedNodes(diagram, part),
            },
            {
              label: "Spread Even Vertical",
              action: (diagram) => handleSpreadSelectedNodes(diagram, part, 'vertical'),
              enabled: (diagram) => canArrangeSelectedNodes(diagram, part),
            },
            {
              label: "Spread Even Horizontal",
              action: (diagram) => handleSpreadSelectedNodes(diagram, part, 'horizontal'),
              enabled: (diagram) => canArrangeSelectedNodes(diagram, part),
            },
          ];
          items.push({
            label: "Arrange…",
            action: showSubMenu(arrangeMenuItems),
            closeOnClick: false,
          });
          if (part instanceof go.Group && isGroupNode(part?.data)) {
            items.push({
              label: "Layout…",
              action: showSubMenu(buildGroupLayoutMenuItems()),
              closeOnClick: false,
            });
          }
        }

        // Add Set Image option for closed groups
        if (part instanceof go.Group && !part.isSubGraphExpanded) {
          items.push({ separator: true });
          items.push({
            label: "Set Image",
            action: (diagram) => {
              const group = part.data;
              if (!group) return;
              const imageList = imageLibrary();
              const modalContext = {
                what: "selectDropdown",
                title: "Select Image",
                case: "Set Group Image",
                imageList: imageList,
                currentGroup: group,
                myDiagram: diagram
              };
              myMetis.currentGroup = group;
              myMetis.myDiagram = diagram;
              diagram.handleOpenModal(imageList, modalContext);
            },
            enabled: (_diagram) => {
              return part instanceof go.Group && !part.isSubGraphExpanded;
            }
          });
        }

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
        const isRelshipType = category === constants.gojs.C_RELSHIPTYPE;

        if (isRelshipType) {
          items.push({
            label: "Edit Relationship Type",
            action: (diagram) => {
              uid.editRelationshipType(data, myMetis, myDiagram);
            },
          });
          items.push({
            label: "Edit Relationship Typeview",
            action: (diagram) => {
              uid.editRelshipTypeview(data, myMetis, diagram || myDiagram, false);
            },
          });
          items.push({
            label: "Delete Relationship Type",
            action: (diagram) => {
              if (!confirm('Delete this relationship type?')) return;
              const targetDiagram = diagram || myDiagram;
              if (targetDiagram) {
                targetDiagram.select(part);
                targetDiagram.commandHandler.deleteSelection();
              }
            },
          });
          return items;
        }

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
            label: "Select all of this type",
            action: (diagram) => handleSelectAllRelationshipsOfSameType(diagram, linkPart),
          });
          // Add delete actions directly to the relationship's context menu
          items.push({
            label: "Delete Relationship",
            action: (diagram) => handleLinkDelete(diagram, linkPart),
            enabled: (diagram) => {
              if (!diagram) return false;
              if (!diagram.commandHandler.canDeleteSelection()) return false;
              let found = false;
              diagram.selection.each((p: any) => {
                try {
                  if ((p instanceof Object) && (p.data && p.data.category === constants.gojs.C_RELATIONSHIP)) found = true;
                  if ((p instanceof Object) && (p instanceof (go as any).Link)) found = true;
                } catch (_) {}
              });
              return found;
            },
            visible: (diagram) => !!diagram && diagram.commandHandler.canDeleteSelection(),
          });
          items.push({
            label: "Edit Relationship View",
            action: (diagram) => handleEditRelationshipView(diagram, part),
          });
          items.push({
            label: "Delete Relationship View",
            action: (diagram) => {
              if (!diagram) return;
              if (!confirm('Do you really want to delete the selected relationship view(s)?')) return;
              myMetis.deleteViewsOnly = true;
              diagram.commandHandler.deleteSelection();
            },
            enabled: (diagram) => {
              if (!diagram) return false;
              if (!diagram.commandHandler.canDeleteSelection()) return false;
              let found = false;
              diagram.selection.each((p: any) => {
                try {
                  if ((p instanceof Object) && (p.data && p.data.category === constants.gojs.C_RELATIONSHIP)) found = true;
                  if ((p instanceof Object) && (p instanceof (go as any).Link)) found = true;
                } catch (_) {}
              });
              return found;
            },
            visible: (diagram) => !!diagram && diagram.commandHandler.canDeleteSelection(),
          });
          items.push({ separator: true });
          items.push({
            label: "Relationship Path",
            action: showSubMenu((() => {
              const relationshipPathItems: HtmlMenuItem[] = [
                {
                  label: "Normal",
                  action: (diagram) => handleSetRelshipRouting(diagram, "Normal", linkPart),
                  enabled: (diagram) => {
                    if (!diagram) return false;
                    if (linkPart?.data?.category === constants.gojs.C_RELATIONSHIP) return true;
                    let found = false;
                    diagram.selection.each((p: any) => {
                      try {
                        if ((p instanceof (go as any).Link) && p.data?.category === constants.gojs.C_RELATIONSHIP) found = true;
                      } catch (_) {}
                    });
                    return found;
                  },
                },
                {
                  label: "Orthogonal",
                  action: (diagram) => handleSetRelshipRouting(diagram, "Orthogonal", linkPart),
                  enabled: (diagram) => {
                    if (!diagram) return false;
                    if (linkPart?.data?.category === constants.gojs.C_RELATIONSHIP) return true;
                    let found = false;
                    diagram.selection.each((p: any) => {
                      try {
                        if ((p instanceof (go as any).Link) && p.data?.category === constants.gojs.C_RELATIONSHIP) found = true;
                      } catch (_) {}
                    });
                    return found;
                  },
                },
                {
                  label: "Avoids Nodes",
                  action: (diagram) => handleSetRelshipRouting(diagram, "AvoidsNodes", linkPart),
                  enabled: (diagram) => {
                    if (!diagram) return false;
                    if (linkPart?.data?.category === constants.gojs.C_RELATIONSHIP) return true;
                    let found = false;
                    diagram.selection.each((p: any) => {
                      try {
                        if ((p instanceof (go as any).Link) && p.data?.category === constants.gojs.C_RELATIONSHIP) found = true;
                      } catch (_) {}
                    });
                    return found;
                  },
                },
                { separator: true },
                {
                  label: "Clear path",
                  action: (diagram) => handleResetRelshipPath(diagram, linkPart),
                  enabled: (diagram) => {
                    if (!diagram) return false;
                    if (linkPart?.data?.category === constants.gojs.C_RELATIONSHIP) return true;
                    let found = false;
                    diagram.selection.each((p: any) => {
                      try {
                        if ((p instanceof (go as any).Link) && p.data?.category === constants.gojs.C_RELATIONSHIP) found = true;
                      } catch (_) {}
                    });
                    return found;
                  },
                }
              ];
              try { (relationshipPathItems as any).menuHeading = 'Relationship Path'; } catch (_) {}
              return relationshipPathItems;
            })()),
            closeOnClick: false,
          });
          items.push({ separator: true });
          // items.push({
          //   label: "Edit Relationship Type",
          //   action: (diagram) => {
          //     try {
          //       const link = linkPart.data;
          //       const modalContext = {
          //         what: "editRelationshipType",
          //         title: "Edit Relationship Type",
          //         myDiagram: myDiagram
          //       };
          //       myMetis.currentLink = link;
          //       myMetis.myDiagram = myDiagram;
          //       myDiagram.handleOpenModal(link, modalContext);
          //     } catch (_) { }
          //   },
          //   enabled: (diagram) => {
          //     try {
          //       const link = linkPart && (linkPart.data || linkPart);
          //       if (!link) return false;
          //       // show for both relationship instances and relationship-type nodes
          //       return link.category === constants.gojs.C_RELATIONSHIP || link.category === constants.gojs.C_RELSHIPTYPE;
          //     } catch (_) { return false; }
          //   },
          // });
          items.push({ separator: true });
          items.push({
            label: "Change Relationship Type",
            action: (diagram) => handleChangeRelationshipType(diagram, linkPart),
          });
          items.push({ separator: true });
          items.push({
            label: "Hide View",
            action: (diagram) => {
              const targetDiagram = diagram || myDiagram;
              if (!targetDiagram) return;
              let selection = targetDiagram.selection;
              if (selection.count === 0) {
                // select the clicked link if nothing else is selected
                try {
                  const key = (linkPart && linkPart.data && linkPart.data.key) || null;
                  if (key) {
                    const linkNode = targetDiagram.findLinkForKey(key);
                    if (linkNode) targetDiagram.select(linkNode);
                    selection = targetDiagram.selection;
                  }
                } catch (_) {}
              }
              const linksHided: any[] = [];
              const modifiedRelshipViews: any[] = [];
              selection.each(function (sel) {
                const link = sel as any;
                if (!link || !link.data) return;
                let relview = link.data.relshipview;
                if (relview) {
                  try {
                    relview = myModelview.findRelationshipView(relview.id);
                    if (relview) {
                      relview.visible = false;
                      const jsnRelView = new jsn.jsnRelshipView(relview);
                      modifiedRelshipViews.push(jsnRelView);
                      // mark link hidden and collect for removal
                      try { link.visible = false; } catch (_) {}
                      linksHided.push(link);
                    }
                  } catch (_) {}
                }
              });
              for (let i = 0; i < linksHided.length; i++) {
                try { targetDiagram.remove(linksHided[i]); } catch (_) {}
              }
              modifiedRelshipViews.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                try { targetDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data }); } catch (_) {}
              });
            },
            enabled: (diagram) => {
              if (!diagram) return false;
              let found = false;
              diagram.selection.each((p: any) => {
                try {
                  if ((p instanceof Object) && (p.data && p.data.relshipview)) found = true;
                  if ((p instanceof Object) && (p instanceof (go as any).Link)) found = true;
                } catch (_) {}
              });
              return found;
            },
            closeOnClick: false,
          });
        }
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
        cmTool.currentContextMenu = menuCopy;
        cmTool.showContextMenu(menuCopy, part);
      };

      const buildObjectTypeMenu = (part: go.Part): HtmlMenuItem[] => {
        const items: HtmlMenuItem[] = [];
        items.push({
          label: "Change Object Type",
          action: (diagram) => {
            const node = part.data;
            if (!node) return;
            const currentType = node.objecttype;
            const myMetamodel = myMetis.currentMetamodel;
            const objtypes = myMetamodel && myMetamodel.getObjectTypes ? myMetamodel.getObjectTypes() : [];
            node.choices = [];
            if (objtypes) {
              for (let i = 0; i < objtypes.length; i++) {
                const otype = objtypes[i];
                if (!otype) continue;
                if (!otype.markedAsDeleted) {
                  if (otype.name === 'Generic' || otype.name === 'Element') continue;
                  node.choices.push(otype.name);
                }
              }
            }
            const modalContext = {
              what: "selectDropdown",
              title: "Select Object Type",
              case: "Change Object type",
              myDiagram: diagram
            };
            myMetis.currentNode = node;
            myMetis.myDiagram = diagram;
            diagram.handleOpenModal(node.choices, modalContext);
          },
          enabled: (diagram) => {
            const node = part.data;
            return !!node && node.category === constants.gojs.C_OBJECT;
          }
        });
        items.push({
          label: "Show Typeview",
          action: (diagram) => {
            const node = part.data;
            if (!node) return;
            uid.editObjectTypeview(node, myMetis, diagram, true);
          },
          enabled: (diagram) => {
            const node = part.data;
            return !!node && node.category === constants.gojs.C_OBJECT;
          }
        });
        items.push({
          label: "Reset to Typeview",
          action: (diagram) => {
            if (!diagram) return;
            let selection: any = diagram.selection;
            if (selection.count == 0) {
              const currentNode = part.data;
              if (currentNode) diagram.select && diagram.select(diagram.findPartForKey(currentNode.key));
              selection = diagram.selection;
            }
            selection.each(function (sel: any) {
              const inst = sel.data;
              if (inst && inst.category === constants.gojs.C_OBJECT) {
                uid.resetToTypeview(inst, myMetis, diagram);
              }
            });
          },
          enabled: (diagram) => {
            const node = part.data;
            if (node?.category === constants.gojs.C_OBJECT) {
              if (node.isSelected) {
                return true;
              } else {
                const selection = diagram.selection;
                if (selection.count == 0) return true;
                else return false;
              }
            }
            return false;
          }
        });
        return items;
      };

      const showObjectTypeHtmlMenu = (diagram: go.Diagram, tool: go.ContextMenuTool, part: go.Part | null) => {
        const targetPart = part ?? (diagram?.selection?.first() as go.Part);
        if ((window as any).DEBUG_GOJS_MENUS) console.debug('[showObjectTypeHtmlMenu] targetPart:', targetPart?.data?.key);
        if (!diagram || !(targetPart instanceof go.Part)) return;
        const items = buildObjectTypeMenu(targetPart);
        try { (items as any).menuHeading = 'Object Type'; } catch (_) {}
        if ((window as any).DEBUG_GOJS_MENUS) console.debug('[showObjectTypeHtmlMenu] items count:', items.length);
        disposeBackgroundMenu();
        const menu = buildBackgroundMenu(items, diagram, tool);
        if ((window as any).DEBUG_GOJS_MENUS) console.debug('[showObjectTypeHtmlMenu] menu created:', menu?.tagName);
        document.body.appendChild(menu);
        activeMenuDiv = menu;
        // ensure outside-click handler exists
        if (!docPointerDownHandler) {
          docPointerDownHandler = (ev: PointerEvent) => {
            try {
              const tgt = ev.target as Node | null;
              const insideMain = activeMenuDiv && tgt && activeMenuDiv.contains(tgt as Node);
              const insideSub = activeSubMenuDiv && tgt && activeSubMenuDiv.contains(tgt as Node);
              if (!insideMain && !insideSub) {
                closeAllMenus();
              }
            } catch (_) {}
          };
          try { document.addEventListener('pointerdown', docPointerDownHandler); } catch (_) {}
        }
        // Position the menu using the proper coordinate transformation
        positionBackgroundMenu(menu, diagram, tool);
      };

      const showPartHtmlMenu = (diagram: go.Diagram, tool: go.ContextMenuTool, part: go.Part | null, graphObj?: go.GraphObject | null) => {
        const targetPart = part ?? (diagram?.selection?.first() as go.Part);
        // console.log('6656 showPartHtmlMenu', {tool, part, targetPart, graphObj });
        if (!diagram || !(targetPart instanceof go.Part)) return;
        // If the context menu was invoked on a specific GraphObject (e.g. the object's icon),
        // allow showing a special, minimal menu. In particular, when right-clicking the
        // node's icon (a go.Picture), show a small menu containing only 'Change Icon'.
        let items: HtmlMenuItem[] | null = null;
        // Objecttype nodes always use buildNodeMenuItems (no icon shortcut)
        if (
          (targetPart.data || {}).category === constants.gojs.C_OBJECTTYPE ||
          (myMetis.modelType === 'Metamodelling' && !!((targetPart.data || {}).objecttype || (targetPart.data || {}).objtypeRef))
        ) {
          items = buildNodeMenuItems(targetPart);
        }
        if (!items) try {
          // Skip special icon-only handling for groups; only consider icon-menu for node/object parts
          if (graphObj && !(targetPart instanceof go.Group)) {
            try {
              // heuristic: consider it an icon if it's a Picture, has a name containing 'icon',
              // or exposes a 'source' property (common for pictures). This is intentionally
              // permissive to match different templates.
              let isIcon = false;
              try {
                const anyObj: any = graphObj as any;
                if ((go as any).Picture && graphObj instanceof (go as any).Picture) isIcon = true;
                if (!isIcon && anyObj && typeof anyObj.name === 'string' && anyObj.name.toLowerCase().includes('icon')) isIcon = true;
                if (!isIcon && anyObj && anyObj.source !== undefined) isIcon = true;
                // If the clicked object is a Panel (common), try to detect if it contains a Picture named 'ICON' or similar
                if (!isIcon) {
                    try {
                    // include common picture name variants so targetPart.findObject('Picture') will match
                    const namesToCheck = ['ICON', 'icon', 'Picture', 'picture', 'PICTURE', 'LeftIcon', 'leftIcon', 'ICON_LEFT', 'LEFT_HEADER', 'leftHeader', 'poolLeftHeader', 'leftLabel', 'HEADER_LEFT'];
                    for (let i = 0; i < namesToCheck.length; i++) {
                      try {
                        const cand = (targetPart as any).findObject(namesToCheck[i]);
                        if (cand) {
                          // consider it an icon-area click if the clicked graphObj is the candidate or an ancestor/parent panel of it
                          if (graphObj === cand) { isIcon = true; break; }
                          // walk up from candidate to see if graphObj is one of its parent panels
                          let cur: any = cand;
                          while (cur) {
                            if (cur === graphObj) { isIcon = true; break; }
                            cur = cur.panel;
                          }
                          if (isIcon) break;
                        }
                      } catch (_) {}
                    }
                  } catch (_) {}
                }
                if (window && (window as any).DEBUG_GOJS_MENUS) console.debug('[showPartHtmlMenu] graphObj detection', { name: anyObj?.name, ctor: anyObj?.constructor?.name, hasSource: anyObj?.source !== undefined, isIcon });
              } catch (_) {}
              if (isIcon || (graphObj instanceof (go as any).Picture) || ((graphObj as any).name && (graphObj as any).name.toLowerCase().includes('icon') ) || ((graphObj as any).source !== undefined)) {
                // build a special icon-only menu
                const node = targetPart.data;
                items = [
                  {
                      label: "Copy",
                      action: (diagram) => handlePartCopy(diagram, part),
                  },
                  {
                      label: "Delete",
                      action: (diagram) => handleDeletePart(diagram, part),
                      enabled: (diagram) => canDeleteSinglePart(diagram, part),
                  },
                  {
                      label: "Select all of this type",
                      action: (diagram) => handleSelectAllObjectsOfSameType(diagram, part),
                  },
                  {
                    label: "Object…",
                    action: showSubMenu(buildObjectMenuItems(targetPart)),
                    closeOnClick: false,
                  },
                  {
                    label: "Objectview…",
                    action: showSubMenu([
                      {
                        label: "Edit Object View",
                        action: (diagram) => handleEditObjectview(part),
                      },
                      {
                        label: "Delete Object View",
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
                      { separator: true },
                      {
                        label: "Change Icon",
                        action: (diagram) => {
                          const node = part.data;
                          if (!node) return;
                          if (node) diagram.select && diagram.select(diagram.findPartForKey(node.key));
                          const modalContext = {
                            what: "selectDropdown",
                            title: "Select Icon",
                            case: "Change Icon",
                            iconList: iconList(),
                            currentNode: node,
                            myDiagram: diagram
                          };
                          myMetis.currentNode = node;
                          myMetis.myDiagram = diagram;
                          diagram.handleOpenModal(node, modalContext);
                        },
                        enabled: (diagram) => {
                          const node = part.data;
                          return !!node && node.category === constants.gojs.C_OBJECT;
                        }
                      }
                      ,
                      {
                        label: 'Set Objectview Colors',
                        action: (() => {
                          const objColorItems: HtmlMenuItem[] = [
                            {
                              label: 'Fill color',
                              closeOnClick: false,
                              render: (container: HTMLElement, diagram: go.Diagram, tool: any, item: any) => {
                                try {
                                  const nodeData = part?.data;
                                  const current = (nodeData && (nodeData.fillcolor || '')) || '';
                                  const wrap = document.createElement('div');
                                  wrap.style.display = 'flex';
                                  wrap.style.alignItems = 'center';
                                  wrap.style.gap = '8px';
                                  const lbl = document.createElement('span');
                                  lbl.textContent = 'Fill';
                                  lbl.style.minWidth = '56px';

                                  const inp = document.createElement('input');
                                  inp.type = 'color';
                                  try {
                                    const initial = (current && go.Brush.isValidColor && go.Brush.isValidColor(current)) ? current : '#d3d3d3';
                                    inp.value = initial;
                                    inp.defaultValue = initial;
                                    try { inp.setAttribute('value', initial); } catch (_) { }
                                  } catch (_) { inp.value = '#d3d3d3'; inp.defaultValue = '#d3d3d3'; try { inp.setAttribute('value', '#d3d3d3'); } catch (_) { } }
                                  inp.style.cursor = 'pointer';
                                  inp.onclick = (ev) => { ev.stopPropagation(); };
                                  inp.oninput = (ev) => {
                                    try {
                                      const val = (ev.target as HTMLInputElement).value;
                                      if (nodeData) {
                                        const targetDiagram = diagram || myDiagram;
                                        try {
                                          const objview = myMetis.findObjectView(nodeData.key) || nodeData.objectview;
                                          if (objview) {
                                            objview.fillcolor = val;
                                            const jsnObjview = new jsn.jsnObjectView(objview, true);
                                            const data = JSON.parse(JSON.stringify(jsnObjview));
                                            targetDiagram.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
                                          }
                                        } catch (e) { if ((window as any).DEBUG_GOJS_MENUS) console.debug('update objectview fillcolor failed', e); }
                                        try { inp.value = val; } catch (_) { }
                                        (diagram || myDiagram)?.requestUpdate?.();
                                      }
                                    } catch (_) { }
                                  };

                                  const presets = [
                                    { label: 'Black', value: '#000000' },
                                    { label: 'White', value: '#ffffff' },
                                    { label: 'Red', value: '#ff0000' },
                                    { label: 'Green', value: '#00ff00' },
                                    { label: 'Blue', value: '#0000ff' },
                                    { label: 'Yellow', value: '#ffff00' },
                                    { label: 'Orange', value: '#ffa500' },
                                    { label: 'Purple', value: '#800080' },
                                    { label: 'Gray', value: '#808080' },
                                    { label: 'Brown', value: '#8b4513' },
                                    { label: 'Pink', value: '#ffc0cb' },
                                    { label: 'Cyan', value: '#00ffff' },
                                    { label: 'Transparent', value: 'rgba(0,0,0,0)' }
                                  ];
                                  const sel = document.createElement('select');
                                  sel.style.cursor = 'pointer';
                                  sel.style.padding = '2px 6px';
                                  sel.style.fontSize = '12px';
                                  sel.style.minWidth = '84px';
                                  const emptyOpt = document.createElement('option');
                                  emptyOpt.value = '';
                                  emptyOpt.text = 'Select Color';
                                  sel.appendChild(emptyOpt);
                                  for (const p of presets) {
                                    const o = document.createElement('option');
                                    o.value = p.value;
                                    o.text = p.label;
                                    sel.appendChild(o);
                                  }
                                  sel.onpointerdown = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                                  sel.onclick = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                                  sel.onchange = (ev) => {
                                    ev.stopPropagation && ev.stopPropagation();
                                    console.debug('[OBJVIEW FILL SEL.ONCHANGE] fired', ev);
                                    const val = (ev.target as HTMLSelectElement).value;
                                    if (val === 'rgba(0,0,0,0)') {
                                      // Set GoJS property to transparent
                                      diagram.model.setDataProperty(nodeData, 'fillcolor', 'rgba(0,0,0,0)');
                                      // Set input to a valid color (e.g., #000000)
                                      inp.value = '#000000';
                                      inp.style.background = 'repeating-linear-gradient(45deg,#ccc,#ccc 5px,#fff 5px,#fff 10px)';
                                    } else {
                                      diagram.model.setDataProperty(nodeData, 'fillcolor', val);
                                      inp.value = val;
                                      inp.style.background = '';
                                    }
                                    const part = diagram.findPartForKey(nodeData.key);
                                    if (part) part.updateTargetBindings();
                                    diagram.requestUpdate();
                                    try {
                                      const val = (ev.target as HTMLSelectElement).value;
                                      console.debug('[OBJVIEW FILL SEL.ONCHANGE] val:', val, 'nodeData:', nodeData?.key);
                                      if (val && nodeData && diagram) {
                                        try { sel.value = val; } catch (_) { }
                                        try { sel.selectedIndex = Array.from(sel.options).findIndex(o => o.value === val); } catch (_) { }
                                        // Synchronously update the GoJS model (same approach as Icon menu)
                                        try { diagram.model.setDataProperty(nodeData, 'fillcolor', val); } catch (_) { }
                                        console.debug('[OBJVIEW FILL SEL.ONCHANGE] model updated');
                                        if ((window as any).DEBUG_GOJS_MENUS) {
                                          try {
                                            const fd = (diagram && typeof (diagram as any).findNodeForKey === 'function') ? (diagram as any).findNodeForKey(nodeData?.key) : null;
                                            console.debug('[objview fill] sel.onchange', { val, nodeKey: nodeData?.key, foundNodeData: fd && fd.data ? fd.data : nodeData });
                                          } catch (_) { }
                                        }
                                        // update the color input UI immediately
                                        try { inp.value = val; inp.defaultValue = val; try { inp.setAttribute('value', val); } catch (_) { } } catch (_) { }
                                        try { inp.dispatchEvent(new InputEvent('input', { bubbles: true })); } catch (_) { }
                                        try { inp.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) { }
                                        diagram.updateAllBindings(); // <-- Add this line
                                        diagram.requestUpdate();
                                        // persist asynchronously to avoid racing with menu disposal
                                        try {

                                          setTimeout(() => {
                                            try {
                                              const objview = myMetis.findObjectView(nodeData.key) || nodeData.objectview;
                                              if (objview) {
                                                objview.fillcolor = val;
                                                const jsnObjview = new jsn.jsnObjectView(objview, true);
                                                const data = JSON.parse(JSON.stringify(jsnObjview));
                                                try { (diagram || myDiagram).dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data }); } catch (_) { }
                                              }
                                            } catch (_) { }
                                          }, 0);
                                        } catch (_) { }
                                      }
                                    } catch (_) { }
                                  };

                                  wrap.appendChild(lbl);
                                  wrap.appendChild(sel);
                                  wrap.appendChild(inp);
                                  container.textContent = '';
                                  container.appendChild(wrap);
                                } catch (e) { if ((window as any).DEBUG_GOJS_MENUS) console.debug('render objectview fillcolor failed', e); }
                              }
                            },
                            {
                              label: 'Stroke color',
                              closeOnClick: false,
                              render: (container: HTMLElement, diagram: go.Diagram, tool: any, item: any) => {
                                try {
                                  const nodeData = part?.data;
                                  const current = (nodeData && (nodeData.strokecolor || '')) || '';
                                  const wrap = document.createElement('div');
                                  wrap.style.display = 'flex';
                                  wrap.style.alignItems = 'center';
                                  wrap.style.gap = '8px';
                                  const lbl = document.createElement('span');
                                  lbl.textContent = 'Stroke';
                                  lbl.style.minWidth = '56px';
                                  const inp = document.createElement('input');
                                  inp.type = 'color';
                                  try {
                                    const initial = (current && go.Brush.isValidColor && go.Brush.isValidColor(current)) ? current : '#d3d3d3';
                                    inp.value = initial;
                                    inp.defaultValue = initial;
                                    try { inp.setAttribute('value', initial); } catch (_) { }
                                  } catch (_) { inp.value = '#d3d3d3'; inp.defaultValue = '#d3d3d3'; try { inp.setAttribute('value', '#d3d3d3'); } catch (_) { } }
                                  inp.style.cursor = 'pointer';
                                  inp.onclick = (ev) => { ev.stopPropagation(); };
                                  inp.oninput = (ev) => {
                                    try {
                                      const val = (ev.target as HTMLInputElement).value;
                                      if (nodeData) {
                                        const targetDiagram = diagram || myDiagram;
                                        try {
                                          const objview = myMetis.findObjectView(nodeData.key) || nodeData.objectview;
                                          if (objview) {
                                            objview.strokecolor = val;
                                            const jsnObjview = new jsn.jsnObjectView(objview, true);
                                            const data = JSON.parse(JSON.stringify(jsnObjview));
                                            targetDiagram.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
                                          }
                                        } catch (e) { if ((window as any).DEBUG_GOJS_MENUS) console.debug('update objectview strokecolor failed', e); }
                                        try { inp.value = val; } catch (_) { }
                                        (diagram || myDiagram)?.requestUpdate?.();
                                      }
                                    } catch (_) { }
                                  };

                                  const presets = [
                                    { label: 'Black', value: '#000000' },
                                    { label: 'White', value: '#ffffff' },
                                    { label: 'Red', value: '#ff0000' },
                                    { label: 'Green', value: '#00ff00' },
                                    { label: 'Blue', value: '#0000ff' },
                                    { label: 'Yellow', value: '#ffff00' },
                                    { label: 'Orange', value: '#ffa500' },
                                    { label: 'Purple', value: '#800080' },
                                    { label: 'Gray', value: '#808080' },
                                    { label: 'Brown', value: '#8b4513' },
                                    { label: 'Pink', value: '#ffc0cb' },
                                    { label: 'Cyan', value: '#00ffff' },
                                    { label: 'Transparent', value: 'rgba(0,0,0,0)' }
                                  ];
                                  const sel = document.createElement('select');
                                  sel.style.cursor = 'pointer';
                                  sel.style.padding = '2px 6px';
                                  sel.style.fontSize = '12px';
                                  sel.style.minWidth = '84px';
                                  const emptyOpt = document.createElement('option');
                                  emptyOpt.value = '';
                                  emptyOpt.text = 'Select Color';
                                  sel.appendChild(emptyOpt);
                                  for (const p of presets) {
                                    const o = document.createElement('option');
                                    o.value = p.value;
                                    o.text = p.label;
                                    sel.appendChild(o);
                                  }
                                  sel.onpointerdown = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                                  sel.onclick = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                                  sel.onchange = (ev) => {
                                    ev.stopPropagation && ev.stopPropagation();
                                    console.debug('[OBJVIEW STROKE SEL.ONCHANGE] fired', ev);
                                    try {
                                      const val = (ev.target as HTMLSelectElement).value;
                                      console.debug('[OBJVIEW STROKE SEL.ONCHANGE] val:', val, 'nodeData:', nodeData?.key);
                                      if (val && nodeData && diagram) {
                                        try { sel.value = val; } catch (_) { }
                                        try { sel.selectedIndex = Array.from(sel.options).findIndex(o => o.value === val); } catch (_) { }
                                        // Synchronously update the GoJS model (same approach as Icon menu)
                                        try { diagram.model.setDataProperty(nodeData, 'strokecolor', val); } catch (_) { }
                                        console.debug('[OBJVIEW STROKE SEL.ONCHANGE] model updated');
                                        if ((window as any).DEBUG_GOJS_MENUS) {
                                          try {
                                            const fd = (diagram && typeof (diagram as any).findNodeForKey === 'function') ? (diagram as any).findNodeForKey(nodeData?.key) : null;
                                            console.debug('[objview stroke] sel.onchange', { val, nodeKey: nodeData?.key, foundNodeData: fd && fd.data ? fd.data : nodeData });
                                          } catch (_) { }
                                        }
                                        // update the color input UI immediately
                                        try { inp.value = val; inp.defaultValue = val; try { inp.setAttribute('value', val); } catch (_) { } } catch (_) { }
                                        try { inp.dispatchEvent(new InputEvent('input', { bubbles: true })); } catch (_) { }
                                        try { inp.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) { }
                                        diagram.requestUpdate();

                                        // persist asynchronously to avoid racing with menu disposal
                                        try {
                                          setTimeout(() => {
                                            try {
                                              const objview = myMetis.findObjectView(nodeData.key) || nodeData.objectview;
                                              if (objview) {
                                                objview.strokecolor = val;
                                                const jsnObjview = new jsn.jsnObjectView(objview, true);
                                                const data = JSON.parse(JSON.stringify(jsnObjview));
                                                try { (diagram || myDiagram).dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data }); } catch (_) { }
                                              }
                                            } catch (_) { }
                                          }, 0);
                                        } catch (_) { }
                                      }
                                    } catch (_) { }
                                  };

                                  wrap.appendChild(lbl);
                                  wrap.appendChild(sel);
                                  wrap.appendChild(inp);
                                  container.textContent = '';
                                  container.appendChild(wrap);
                                } catch (e) { if ((window as any).DEBUG_GOJS_MENUS) console.debug('render objectview strokecolor failed', e); }
                              }
                            },
                            {
                              label: 'Text color',
                              closeOnClick: false,
                              render: (container: HTMLElement, diagram: go.Diagram, tool: any, item: any) => {
                                try {
                                  const nodeData = part?.data;
                                  const current = (nodeData && (nodeData.textcolor || '')) || '';
                                  const wrap = document.createElement('div');
                                  wrap.style.display = 'flex';
                                  wrap.style.alignItems = 'center';
                                  wrap.style.gap = '8px';
                                  const lbl = document.createElement('span');
                                  lbl.textContent = 'Text';
                                  lbl.style.minWidth = '56px';
                                  const inp = document.createElement('input');
                                  inp.type = 'color';
                                  try {
                                    const initial = (current && go.Brush.isValidColor && go.Brush.isValidColor(current)) ? current : '#d3d3d3';
                                    inp.value = initial;
                                    inp.defaultValue = initial;
                                    try { inp.setAttribute('value', initial); } catch (_) { }
                                  } catch (_) { inp.value = '#d3d3d3'; inp.defaultValue = '#d3d3d3'; try { inp.setAttribute('value', '#d3d3d3'); } catch (_) { } }
                                  inp.style.cursor = 'pointer';
                                  inp.onclick = (ev) => { ev.stopPropagation(); };
                                  inp.oninput = (ev) => {
                                    try {
                                      const val = (ev.target as HTMLInputElement).value;
                                      if (nodeData) {
                                        const targetDiagram = diagram || myDiagram;
                                        try {
                                          // Update the GoJS model first
                                          try { targetDiagram.model.setDataProperty(nodeData, 'textcolor', val); } catch (_) { }
                                          // Then update the objview
                                          const objview = myMetis.findObjectView(nodeData.key) || nodeData.objectview;
                                          if (objview) {
                                            objview.textcolor = val;
                                            const jsnObjview = new jsn.jsnObjectView(objview, true);
                                            const data = JSON.parse(JSON.stringify(jsnObjview));
                                            targetDiagram.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
                                          }
                                        } catch (e) { if ((window as any).DEBUG_GOJS_MENUS) console.debug('update objectview textcolor failed', e); }
                                        try { inp.value = val; } catch (_) { }
                                        (diagram || myDiagram)?.requestUpdate?.();
                                      }
                                    } catch (_) { }
                                  };

                                  const presets = [
                                    { label: 'Black', value: '#000000' },
                                    { label: 'White', value: '#ffffff' },
                                    { label: 'Red', value: '#ff0000' },
                                    { label: 'Green', value: '#00ff00' },
                                    { label: 'Blue', value: '#0000ff' },
                                    { label: 'Yellow', value: '#ffff00' },
                                    { label: 'Orange', value: '#ffa500' },
                                    { label: 'Purple', value: '#800080' },
                                    { label: 'Gray', value: '#808080' },
                                    { label: 'Brown', value: '#8b4513' },
                                    { label: 'Pink', value: '#ffc0cb' },
                                    { label: 'Cyan', value: '#00ffff' },
                                    { label: 'Transparent', value: 'rgba(0,0,0,0)' }
                                  ];
                                  const sel = document.createElement('select');
                                  sel.style.cursor = 'pointer';
                                  sel.style.padding = '2px 6px';
                                  sel.style.fontSize = '12px';
                                  sel.style.minWidth = '84px';
                                  const emptyOpt = document.createElement('option');
                                  emptyOpt.value = '';
                                  emptyOpt.text = 'Select Color';
                                  sel.appendChild(emptyOpt);
                                  for (const p of presets) {
                                    const o = document.createElement('option');
                                    o.value = p.value;
                                    o.text = p.label;
                                    sel.appendChild(o);
                                  }
                                  sel.onpointerdown = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                                  sel.onclick = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                                  sel.onchange = (ev) => {
                                    ev.stopPropagation && ev.stopPropagation();
                                    console.debug('[OBJVIEW TEXT SEL.ONCHANGE] fired', ev);
                                    try {
                                      const val = (ev.target as HTMLSelectElement).value;
                                      console.debug('[OBJVIEW TEXT SEL.ONCHANGE] val:', val, 'nodeData:', nodeData?.key);
                                      if (val && nodeData && diagram) {
                                        try { sel.value = val; } catch (_) { }
                                        try { sel.selectedIndex = Array.from(sel.options).findIndex(o => o.value === val); } catch (_) { }
                                        // Synchronously update the GoJS model (same approach as Icon menu)
                                        try { diagram.model.setDataProperty(nodeData, 'textcolor', val); } catch (_) { }
                                        console.debug('[OBJVIEW TEXT SEL.ONCHANGE] model updated');
                                        if ((window as any).DEBUG_GOJS_MENUS) {
                                          try {
                                            const fd = (diagram && typeof (diagram as any).findNodeForKey === 'function') ? (diagram as any).findNodeForKey(nodeData?.key) : null;
                                            console.debug('[objview text] sel.onchange', { val, nodeKey: nodeData?.key, foundNodeData: fd && fd.data ? fd.data : nodeData });
                                          } catch (_) { }
                                        }
                                        // update the color input UI immediately
                                        try { inp.value = val; inp.defaultValue = val; try { inp.setAttribute('value', val); } catch (_) { } } catch (_) { }
                                        try { inp.dispatchEvent(new InputEvent('input', { bubbles: true })); } catch (_) { }
                                        try { inp.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) { }
                                        diagram.requestUpdate();

                                        // persist asynchronously to avoid racing with menu disposal
                                        try {
                                          setTimeout(() => {
                                            try {
                                              const objview = myMetis.findObjectView(nodeData.key) || nodeData.objectview;
                                              if (objview) {
                                                objview.textcolor = val;
                                                const jsnObjview = new jsn.jsnObjectView(objview, true);
                                                const data = JSON.parse(JSON.stringify(jsnObjview));
                                                try { (diagram || myDiagram).dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data }); } catch (_) { }
                                              }
                                            } catch (_) { }
                                          }, 0);
                                        } catch (_) { }
                                      }
                                    } catch (_) { }
                                  };

                                  wrap.appendChild(lbl);
                                  wrap.appendChild(sel);
                                  wrap.appendChild(inp);
                                  container.textContent = '';
                                  container.appendChild(wrap);
                                } catch (e) { if ((window as any).DEBUG_GOJS_MENUS) console.debug('render objectview textcolor failed', e); }
                              }
                            }
                          ];
                          try { (objColorItems as any).menuHeading = 'Set Objectview Colors'; } catch (_) { }
                          return showSubMenu(objColorItems);
                        })(),
                        closeOnClick: false
                      }
                    ]),
                    closeOnClick: false,
                  },
                  {
                    label: 'Change Icon',
                    action: (diagram) => {
                      if (!node) return;
                      if (node) diagram.select && diagram.select(diagram.findPartForKey(node.key));
                      const ilist = iconList();
                      const modalContext = {
                        what: 'selectDropdown',
                        title: 'Select Icon',
                        case: 'Change Icon',
                        iconList: iconList(),
                        currentNode: node,
                        myDiagram: diagram
                      };
                      myMetis.currentNode = node;
                      myMetis.myDiagram = diagram;
                      diagram.handleOpenModal(node, modalContext);
                    },
                    enabled: (diagram) => true
                  },
                  {
                    label: 'Set Icon Colors',
                    action: (() => {
                      const colorItems: HtmlMenuItem[] = [
                        {
                          // Fill color (fillcolor2) with preset dropdown
                          label: 'Fill color',
                          closeOnClick: false,
                          render: (container: HTMLElement) => {
                            try {
                              const nodeData = targetPart?.data;
                              const current = (nodeData && (nodeData.fillcolor2)) || '';
                              const wrap = document.createElement('div');
                              wrap.style.display = 'flex';
                              wrap.style.alignItems = 'center';
                              wrap.style.gap = '8px';
                              const lbl = document.createElement('span');
                              lbl.textContent = 'Fill';
                              lbl.style.minWidth = '56px';

                              const inp = document.createElement('input');
                              inp.type = 'color';
                              try {
                                const initial = (current && go.Brush.isValidColor && go.Brush.isValidColor(current)) ? current : '#d3d3d3';
                                inp.value = initial;
                                inp.defaultValue = initial;
                                try { inp.setAttribute('value', initial); } catch (_) { }
                              } catch (_) { inp.value = '#d3d3d3'; inp.defaultValue = '#d3d3d3'; try { inp.setAttribute('value', '#d3d3d3'); } catch (_) { } }
                              inp.style.cursor = 'pointer';
                              inp.onclick = (ev) => { ev.stopPropagation(); };
                              inp.oninput = (ev) => {
                                try {
                                  const val = (ev.target as HTMLInputElement).value;
                                  if (nodeData && diagram) {
                                    diagram.model.setDataProperty(nodeData, 'fillcolor2', val);
                                    diagram.requestUpdate();
                                  }
                                } catch (_) { }
                              };

                              // Preset dropdown
                              const presets = [
                                { label: 'Black', value: '#000000' },
                                { label: 'White', value: '#ffffff' },
                                { label: 'Red', value: '#ff0000' },
                                { label: 'Green', value: '#00ff00' },
                                { label: 'Blue', value: '#0000ff' },
                                { label: 'Yellow', value: '#ffff00' },
                                { label: 'Orange', value: '#ffa500' },
                                { label: 'Purple', value: '#800080' },
                                { label: 'Gray', value: '#808080' },
                                { label: 'Brown', value: '#8b4513' },
                                { label: 'Pink', value: '#ffc0cb' },
                                { label: 'Cyan', value: '#00ffff' },
                                { label: 'Transparent', value: 'rgba(0,0,0,0)' }
                              ];
                              const sel = document.createElement('select');
                              sel.style.cursor = 'pointer';
                              sel.style.padding = '2px 6px';
                              sel.style.fontSize = '12px';
                              sel.style.minWidth = '84px';
                              const emptyOpt = document.createElement('option');
                              emptyOpt.value = '';
                              emptyOpt.text = 'Select Color';
                              sel.appendChild(emptyOpt);
                              for (const p of presets) {
                                const o = document.createElement('option');
                                o.value = p.value;
                                o.text = p.label;
                                sel.appendChild(o);
                              }
                              sel.onpointerdown = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                              sel.onclick = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                              sel.onchange = (ev) => {
                                ev.stopPropagation && ev.stopPropagation();
                                try {
                                  const val = (ev.target as HTMLSelectElement).value;
                                  if (val && nodeData && diagram) {
                                    try { sel.value = val; } catch (_) { }
                                    try { sel.selectedIndex = Array.from(sel.options).findIndex(o => o.value === val); } catch (_) { }
                                    // Synchronously update the GoJS model (same approach as Icon menu)
                                    try { diagram.model.setDataProperty(nodeData, 'fillcolor2', val); } catch (_) { }
                                    if ((window as any).DEBUG_GOJS_MENUS) {
                                      try {
                                        const fd = (diagram && typeof (diagram as any).findNodeForKey === 'function') ? (diagram as any).findNodeForKey(nodeData?.key) : null;
                                        console.debug('[objview fill] sel.onchange', { val, nodeKey: nodeData?.key, foundNodeData: fd && fd.data ? fd.data : nodeData });
                                      } catch (_) { }
                                    }
                                    // update the color input UI immediately
                                    try { inp.value = val; inp.defaultValue = val; try { inp.setAttribute('value', val); } catch (_) { } } catch (_) { }
                                    try { inp.dispatchEvent(new InputEvent('input', { bubbles: true })); } catch (_) { }
                                    try { inp.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) { }
                                    diagram.requestUpdate();
                                    // persist asynchronously to avoid racing with menu disposal
                                    try {
                                      setTimeout(() => {
                                        try {
                                          const objview = myMetis.findObjectView(nodeData.key) || nodeData.objectview;
                                          if (objview) {
                                            objview.fillcolor2 = val;
                                            const jsnObjview = new jsn.jsnObjectView(objview, true);
                                            const data = JSON.parse(JSON.stringify(jsnObjview));
                                            if ((window as any).DEBUG_GOJS_MENUS) console.log('8446 Updating object view properties with data:', data);
                                            try { (diagram || myDiagram).dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data }); } catch (_) { }
                                          }
                                        } catch (_) { }
                                      }, 0);
                                    } catch (_) { }
                                  }
                                } catch (_) { }
                              };

                              wrap.appendChild(lbl);
                              wrap.appendChild(sel);
                              wrap.appendChild(inp);
                              container.textContent = '';
                              container.appendChild(wrap);
                            } catch (e) { if ((window as any).DEBUG_GOJS_MENUS) console.debug('render fillcolor failed', e); }
                          }
                        },
                        {
                          // Stroke color (strokecolor2) with preset dropdown
                          label: 'Stroke color',
                          closeOnClick: false,
                          render: (container: HTMLElement) => {
                            try {
                              const nodeData = targetPart?.data;
                              const current = (nodeData && (nodeData.strokecolor2 || nodeData.strokecolor)) || '';
                              const wrap = document.createElement('div');
                              wrap.style.display = 'flex';
                              wrap.style.alignItems = 'center';
                              wrap.style.gap = '8px';
                              const lbl = document.createElement('span');
                              lbl.textContent = 'Stroke';
                              lbl.style.minWidth = '56px';
                              const inp = document.createElement('input');
                              inp.type = 'color';
                              try {
                                const initial = (current && go.Brush.isValidColor && go.Brush.isValidColor(current)) ? current : '#d3d3d3';
                                inp.value = initial;
                                inp.defaultValue = initial;
                                try { inp.setAttribute('value', initial); } catch (_) { }
                              } catch (_) { inp.value = '#d3d3d3'; inp.defaultValue = '#d3d3d3'; try { inp.setAttribute('value', '#d3d3d3'); } catch (_) { } }
                              inp.style.cursor = 'pointer';
                              inp.onclick = (ev) => { ev.stopPropagation(); };
                              inp.oninput = (ev) => {
                                try {
                                  const val = (ev.target as HTMLInputElement).value;
                                  if (nodeData && diagram) {
                                    diagram.model.setDataProperty(nodeData, 'strokecolor2', val);
                                    diagram.requestUpdate();
                                  }
                                } catch (_) { }
                              };

                              // reuse presets
                              const presets = [
                                { label: 'Black', value: '#000000' },
                                { label: 'White', value: '#ffffff' },
                                { label: 'Red', value: '#ff0000' },
                                { label: 'Green', value: '#00ff00' },
                                { label: 'Blue', value: '#0000ff' },
                                { label: 'Yellow', value: '#ffff00' },
                                { label: 'Orange', value: '#ffa500' },
                                { label: 'Purple', value: '#800080' },
                                { label: 'Gray', value: '#808080' },
                                { label: 'Brown', value: '#8b4513' },
                                { label: 'Pink', value: '#ffc0cb' },
                                { label: 'Cyan', value: '#00ffff' },
                                                           { label: 'Transparent', value: 'rgba(0,0,0,0)' }
                              ];
                              const sel = document.createElement('select');
                              sel.style.cursor = 'pointer';
                              sel.style.padding = '2px 6px';
                              sel.style.fontSize = '12px';
                              sel.style.minWidth = '84px';
                              const emptyOpt = document.createElement('option');
                              emptyOpt.value = '';
                              emptyOpt.text = 'Select Color';
                              sel.appendChild(emptyOpt);
                              for (const p of presets) {
                                const o = document.createElement('option');
                                o.value = p.value;
                                o.text = p.label;
                                sel.appendChild(o);
                              }
                              sel.onpointerdown = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                              sel.onclick = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                              sel.onchange = (ev) => {
                                ev.stopPropagation && ev.stopPropagation();
                                try {
                                  const val = (ev.target as HTMLSelectElement).value;
                                  if (val && nodeData && diagram) {
                                    try { sel.value = val; } catch (_) { }
                                    try { sel.selectedIndex = Array.from(sel.options).findIndex(o => o.value === val); } catch (_) { }
                                    try { diagram.model.setDataProperty(nodeData, 'strokecolor2', val); } catch (_) { }
                                    if ((window as any).DEBUG_GOJS_MENUS) {
                                      try {
                                        const fd2 = (diagram && typeof (diagram as any).findNodeForKey === 'function') ? (diagram as any).findNodeForKey(nodeData?.key) : null;
                                        console.debug('[objview stroke] sel.onchange', { val, nodeKey: nodeData?.key, foundNodeData: fd2 && fd2.data ? fd2.data : nodeData });
                                      } catch (_) { }
                                    }
                                    try { inp.value = val; inp.defaultValue = val; try { inp.setAttribute('value', val); } catch (_) { } } catch (_) { }
                                    try { inp.dispatchEvent(new InputEvent('input', { bubbles: true })); } catch (_) { }
                                    try { inp.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) { }
                                    diagram.requestUpdate();
                                    try {
                                      setTimeout(() => {
                                        try {
                                          const objview = myMetis.findObjectView(nodeData.key) || nodeData.objectview;
                                          if (objview) {
                                            objview.strokecolor2 = val;
                                            const jsnObjview = new jsn.jsnObjectView(objview, true);
                                            const data = JSON.parse(JSON.stringify(jsnObjview));
                                            try { (diagram || myDiagram).dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data }); } catch (_) { }
                                          }
                                        } catch (_) { }
                                      }, 0);
                                    } catch (_) { }
                                  }
                                } catch (_) { }
                              };

                              wrap.appendChild(lbl);
                              wrap.appendChild(sel);
                              wrap.appendChild(inp);
                              container.textContent = '';
                              container.appendChild(wrap);
                            } catch (e) { if ((window as any).DEBUG_GOJS_MENUS) console.debug('render strokecolor failed', e); }
                          }
                        },
                        {
                          // Text color (textcolor2) with preset dropdown
                          label: 'Text color',
                          closeOnClick: false,
                          render: (container: HTMLElement) => {
                            try {
                              const nodeData = targetPart?.data;
                              const current = (nodeData && (nodeData.textcolor2 || nodeData.textcolor)) || '';
                              const wrap = document.createElement('div');
                              wrap.style.display = 'flex';
                              wrap.style.alignItems = 'center';
                              wrap.style.gap = '8px';
                              const lbl = document.createElement('span');
                              lbl.textContent = 'Text';
                              lbl.style.minWidth = '56px';
                              const inp = document.createElement('input');
                              inp.type = 'color';
                              try {
                                const initial = (current && go.Brush.isValidColor && go.Brush.isValidColor(current)) ? current : '#d3d3d3';
                                inp.value = initial;
                                inp.defaultValue = initial;
                                try { inp.setAttribute('value', initial); } catch (_) { }
                              } catch (_) { inp.value = '#d3d3d3'; inp.defaultValue = '#d3d3d3'; try { inp.setAttribute('value', '#d3d3d3'); } catch (_) { } }
                              inp.style.cursor = 'pointer';
                              inp.onclick = (ev) => { ev.stopPropagation(); };
                              inp.oninput = (ev) => {
                                try {
                                  const val = (ev.target as HTMLInputElement).value;
                                  if (nodeData && diagram) {
                                    diagram.model.setDataProperty(nodeData, 'textcolor2', val);
                                    diagram.requestUpdate();
                                  }
                                } catch (_) { }
                              };

                              // reuse presets
                              const presets = [
                                { label: 'Black', value: '#000000' },
                                { label: 'White', value: '#ffffff' },
                                { label: 'Red', value: '#ff0000' },
                                { label: 'Green', value: '#00ff00' },
                                { label: 'Blue', value: '#0000ff' },
                                { label: 'Yellow', value: '#ffff00' },
                                { label: 'Orange', value: '#ffa500' },
                                { label: 'Purple', value: '#800080' },
                                { label: 'Gray', value: '#808080' },
                                { label: 'Brown', value: '#8b4513' },
                                { label: 'Pink', value: '#ffc0cb' },
                                { label: 'Cyan', value: '#00ffff' },
                                                           { label: 'Transparent', value: 'rgba(0,0,0,0)' }
                              ];
                              const sel = document.createElement('select');
                              sel.style.cursor = 'pointer';
                              sel.style.padding = '2px 6px';
                              sel.style.fontSize = '12px';
                              sel.style.minWidth = '84px';
                              const emptyOpt = document.createElement('option');
                              emptyOpt.value = '';
                              emptyOpt.text = 'Select Color';
                              sel.appendChild(emptyOpt);
                              for (const p of presets) {
                                const o = document.createElement('option');
                                o.value = p.value;
                                o.text = p.label;
                                sel.appendChild(o);
                              }
                              sel.onpointerdown = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                              sel.onclick = (ev) => { ev.stopPropagation && ev.stopPropagation(); };
                              sel.onchange = (ev) => {
                                ev.stopPropagation && ev.stopPropagation();
                                try {
                                  const val = (ev.target as HTMLSelectElement).value;
                                  if (val && nodeData && diagram) {
                                    try { sel.value = val; } catch (_) { }
                                    try { sel.selectedIndex = Array.from(sel.options).findIndex(o => o.value === val); } catch (_) { }
                                    try { diagram.model.setDataProperty(nodeData, 'textcolor2', val); } catch (_) { }
                                    if ((window as any).DEBUG_GOJS_MENUS) {
                                      try {
                                        const fd3 = (diagram && typeof (diagram as any).findNodeForKey === 'function') ? (diagram as any).findNodeForKey(nodeData?.key) : null;
                                        console.debug('[objview text] sel.onchange', { val, nodeKey: nodeData?.key, foundNodeData: fd3 && fd3.data ? fd3.data : nodeData });
                                      } catch (_) { }
                                    }
                                    try { inp.value = val; inp.defaultValue = val; try { inp.setAttribute('value', val); } catch (_) { } } catch (_) { }
                                    try { inp.dispatchEvent(new InputEvent('input', { bubbles: true })); } catch (_) { }
                                    try { inp.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) { }
                                    diagram.requestUpdate();
                                    try {
                                      setTimeout(() => {
                                        try {
                                          const objview = myMetis.findObjectView(nodeData.key) || nodeData.objectview;
                                          if (objview) {
                                            objview.textcolor2 = val;
                                            const jsnObjview = new jsn.jsnObjectView(objview, true);
                                            const data = JSON.parse(JSON.stringify(jsnObjview));
                                            try { (diagram || myDiagram).dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data }); } catch (_) { }
                                          }
                                        } catch (_) { }
                                      }, 0);
                                    } catch (_) { }
                                  }
                                } catch (_) { }
                              };

                              wrap.appendChild(lbl);
                              wrap.appendChild(sel);
                              wrap.appendChild(inp);
                              container.textContent = '';
                              container.appendChild(wrap);
                            } catch (e) { if ((window as any).DEBUG_GOJS_MENUS) console.debug('render textcolor failed', e); }
                          }
                        }
                      ];
                      try { (colorItems as any).menuHeading = 'Set Icon Colors'; } catch (_) { }
                      return showSubMenu(colorItems);
                    })(),
                    closeOnClick: false
                  },
                ];
                // Mark this as the icon menu so later heading logic doesn't overwrite it
                try { (items as any).menuHeading = 'Icon Menu'; } catch (_) {}
              }
            } catch (_) {}
          }
        } catch (_) {}
        if (!items) items = buildPartMenuItems(targetPart);
        // Ensure a sensible heading is present for object/relationship menus, but
        // preserve any existing heading (e.g., 'Icon Menu') that may have been set
        // when building a special-case menu earlier.
        try {
          if (!(items as any)?.menuHeading) {
            const data = targetPart?.data;
            const hasObject =
              data &&
              (data.category === constants.gojs.C_OBJECT ||
                data.object ||
                data.objectview ||
                data.isGroup === true ||
                (typeof data.viewkind === 'string' && data.viewkind.toLowerCase() === 'container'));
            if (hasObject) {
              (items as any).menuHeading = 'Object Menu';
            } else if (data && data.category === constants.gojs.C_RELATIONSHIP) {
              (items as any).menuHeading = 'Relationship Menu';
            } else {
              const title = (data && (data.name || data.label)) || null;
              if (title) (items as any).menuHeading = title;
            }
          }
        } catch { /* ignore */ }

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
          showPartHtmlMenu(diagram, tool, part as go.Part, obj);
        },
        hide: disposeBackgroundMenu,
      });

      linkContextMenu = new go.HTMLInfo({
        show: (obj: go.GraphObject | null, diagram: go.Diagram, tool: go.ContextMenuTool) => {
          const part = obj ? obj.part : null;
          showPartHtmlMenu(diagram, tool, part as go.Part, obj);
        },
        hide: disposeBackgroundMenu,
      });

      typeviewContextMenu = new go.HTMLInfo({
        show: (obj: go.GraphObject | null, diagram: go.Diagram, tool: go.ContextMenuTool) => {
          if ((window as any).DEBUG_GOJS_MENUS) console.debug('[typeviewContextMenu.show] obj:', obj?.name, 'part:', obj?.part?.data?.key);
          const part = obj ? obj.part : null;
          if (part) {
            showObjectTypeHtmlMenu(diagram, tool, part as go.Part);
          } else {
            if ((window as any).DEBUG_GOJS_MENUS) console.debug('[typeviewContextMenu.show] no part found');
          }
        },
        hide: disposeBackgroundMenu,
      });

      let activePortGraphObject: go.GraphObject | null = null;

      const buildPortMenuItems = () => {
        const items: HtmlMenuItem[] = [
          {
            label: "Change port name",
            action: (diagram) => handleChangePortName(diagram, activePortGraphObject),
          },
          {
            label: "Change port color",
            action: (diagram) => handleChangePortColor(diagram, activePortGraphObject),
          },
          {
            label: "Remove port",
            action: (diagram) => handleRemovePort(diagram, activePortGraphObject),
          },
        ];
        return items;
      };

      const showPortHtmlMenu = (diagram: go.Diagram, tool: go.ContextMenuTool) => {
        if (!diagram || !activePortGraphObject) return;
        const items = buildPortMenuItems();
        if (!items.length) return;
        renderBackgroundMenu(items, diagram, tool);
      };

      portContextMenu = new go.HTMLInfo({
        show: (obj: go.GraphObject | null, diagram: go.Diagram, tool: go.ContextMenuTool) => {
          activePortGraphObject = obj;
          showPortHtmlMenu(diagram, tool);
        },
        hide: () => {
          activePortGraphObject = null;
          disposeBackgroundMenu();
        },
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
        const isMetamodelling = isMetamodelDiagramContext(targetDiagram);
        // Regression checklist:
        // 1) Set layout A -> Do Layout -> move node -> no snap-back.
        // 2) Set layout B -> Do Layout -> move node -> no snap-back.
        // 3) Reload -> move node -> no snap-back.
        let layout = "";
        const modifiedRelshipViews: jsn.jsnRelshipView[] = [];
        if (!isMetamodelling) {
          if (!myModelview) return;
          targetDiagram.modelview = myModelview;
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
        } else {
          const myMetamodel = myMetis.currentMetamodel;
          if (!myMetamodel) return;
          layout = myMetamodel.layout;
        }
        setLayout(targetDiagram, layout);
        if (isMetamodelling) {
          const myMetamodel = myMetis.currentMetamodel;
          const objtypegeos = [];
          const nodes = targetDiagram.nodes;
          for (let it = nodes.iterator; it?.next();) {
            const node = it.value;
            const data = node.data;
            const objtype = data?.objecttype;
            if (!objtype) continue;
            const loc = data?.loc || `${Math.round(node.location.x)} ${Math.round(node.location.y)}`;
            let objtypegeo = myMetamodel.findObjtypeGeoByType(objtype);
            if (!objtypegeo) {
              objtypegeo = new akm.cxObjtypeGeo(utils.createGuid(), myMetamodel, objtype, loc, data?.size || '');
              myMetamodel.addObjtypeGeo(objtypegeo);
              myMetis.addObjtypeGeo(objtypegeo);
            }
            objtypegeo.loc = loc;
            objtypegeo.size = data?.size || objtypegeo.size;
            const jsnObjtypegeo = new jsn.jsnObjectTypegeo(objtypegeo);
            objtypegeos.push(jsnObjtypegeo);
          }
          objtypegeos.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            targetDiagram.dispatch?.({ type: 'UPDATE_OBJECTTYPEGEOS_PROPERTIES', data })
          });
        } else {
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
        }
        modifiedRelshipViews.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          targetDiagram.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
        });
        const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
        let data = { metis: jsnMetis };
        data = JSON.parse(JSON.stringify(data));
        dispatchUniversePhData(targetDiagram.dispatch, data);
      };

      const handleSaveLayout = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        if (isMetamodelDiagramContext(targetDiagram)) {
          const myMetamodel = myMetis.currentMetamodel;
          if (!myMetamodel) return;
          const nodes = targetDiagram.nodes;
          const objtypegeos = [];
          for (let it = nodes.iterator; it?.next();) {
            const node = it.value;
            const data = node.data;
            const objtype = data.objecttype;
            if (!objtype) continue;
            const loc = data?.loc || `${Math.round(node.location.x)} ${Math.round(node.location.y)}`;
            let objtypegeo = myMetamodel.findObjtypeGeoByType(objtype);
            if (!objtypegeo) {
              objtypegeo = new akm.cxObjtypeGeo(utils.createGuid(), myMetamodel, objtype, loc, data?.size || '');
              myMetamodel.addObjtypeGeo(objtypegeo);
              myMetis.addObjtypeGeo(objtypegeo);
            }
            objtypegeo.loc = loc;
            objtypegeo.size = data?.size || objtypegeo.size;
            const jsnObjtypegeo = new jsn.jsnObjectTypegeo(objtypegeo);
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
          const modifiedRelshipViews = new Array();
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
          const links = targetDiagram.links;
          for (let it = links.iterator; it?.next();) {
            const link = it.value;
            const data = link?.data;
            if (!data || data.category !== constants.gojs.C_RELATIONSHIP) continue;
            let relview = data.relshipview;
            if (!relview) {
              relview = myModelview.findRelationshipView(data.relviewRef || data.key);
            }
            if (!relview) continue;
            const livePoints: number[] = [];
            try {
              for (let pt = link.points.iterator; pt?.next();) {
                const point = pt.value;
                livePoints.push(point.x, point.y);
              }
            } catch (_) {}
            relview.points = livePoints.length > 0 ? livePoints : (data.points || []);
            relview.routing = data.routing;
            relview.curve = data.curve;
            const jsnRelview = new jsn.jsnRelshipView(relview);
            modifiedRelshipViews.push(jsnRelview);
          }
          modifiedRelshipViews.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            targetDiagram.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
          });
        }
        const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
        let data = { metis: jsnMetis };
        data = JSON.parse(JSON.stringify(data));
        dispatchUniversePhData(targetDiagram.dispatch, data);
      };

      const handleSetLinkRouting = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        const routingList = [
          { value: "Normal", label: "Normal" },
          { value: "Orthogonal", label: "Orthogonal" },
          { value: "AvoidsNodes", label: "Avoids Nodes" },
        ];
        const modalContext = {
          what: "selectDropdown",
          title: "Set Routing Scheme",
          case: "Set Routing Scheme",
          routingList,
          myDiagram: targetDiagram,
        };
        myMetis.myDiagram = targetDiagram;
        targetDiagram.handleOpenModal(targetDiagram, modalContext);
      };

      const handleSetLinkCurve = (diagram: go.Diagram) => {
        const targetDiagram = diagram || myDiagram;
        const curveList = [
          { value: "None", label: "None" },
          { value: "Bezier", label: "Bezier" },
          { value: "JumpOver", label: "Jump Over" },
          { value: "JumpGap", label: "Jump Gap" },
        ];
        const modalContext = {
          what: "selectDropdown",
          title: "Set Link Curve",
          case: "Set Link Curve",
          curveList,
          myDiagram: targetDiagram,
        };
        myMetis.myDiagram = targetDiagram;
        targetDiagram.handleOpenModal(targetDiagram, modalContext);
      };

      const handleResetRelshipPath = (diagram: go.Diagram, linkPart?: go.Link) => {
        const targetDiagram = diagram || myDiagram;
        const myModelview = myMetis.currentModelview;
        if (!targetDiagram || !myModelview) return;

        let selection: any = targetDiagram.selection;
        if (selection?.count === 0 && linkPart) {
          try {
            targetDiagram.select(linkPart);
            selection = targetDiagram.selection;
          } catch (_) {}
        }

        const selectedLinks: any[] = [];
        selection?.each((sel: any) => {
          try {
            if ((sel instanceof (go as any).Link) && sel.data?.category === constants.gojs.C_RELATIONSHIP) {
              selectedLinks.push(sel);
            }
          } catch (_) {}
        });
        if (selectedLinks.length > 0) {
          uid.clearPath(selectedLinks, myMetis, targetDiagram);
        }
      };

      const handleSetRelshipRouting = (diagram: go.Diagram, routing: string, linkPart?: go.Link) => {
        const targetDiagram = diagram || myDiagram;
        const myModelview = myMetis.currentModelview;
        if (!targetDiagram || !myModelview) return;

        let selection: any = targetDiagram.selection;
        if (selection?.count === 0 && linkPart) {
          try {
            targetDiagram.select(linkPart);
            selection = targetDiagram.selection;
          } catch (_) {}
        }

        const modifiedRelshipViews: jsn.jsnRelshipView[] = [];
        selection?.each((sel: any) => {
          try {
            if (!(sel instanceof (go as any).Link) || sel.data?.category !== constants.gojs.C_RELATIONSHIP) return;
            const linkData = sel.data;
            const relview = myModelview.findRelationshipView(linkData.relviewRef || linkData.key);
            if (!relview) return;

            try {
              targetDiagram.model.setDataProperty(linkData, "routing", routing);
              targetDiagram.model.setDataProperty(linkData, "points", []);
            } catch (_) {
              linkData.routing = routing;
              linkData.points = [];
            }
            relview.routing = routing;
            relview.points = [];
            modifiedRelshipViews.push(new jsn.jsnRelshipView(relview));
          } catch (_) {}
        });

        modifiedRelshipViews.forEach((mn) => {
          let data: any = mn;
          data = JSON.parse(JSON.stringify(data));
          targetDiagram.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data });
        });
      };

      const handleGroupRelshipRouting = (diagram: go.Diagram, routing: string, groupPart?: go.Part | null) => {
        const targetDiagram = diagram || myDiagram;
        const myModelview = myMetis.currentModelview;
        if (!targetDiagram || !myModelview || !(groupPart instanceof go.Group)) return;

        const modifiedRelshipViews: jsn.jsnRelshipView[] = [];
        groupPart.findSubGraphParts().each((subPart: go.Part) => {
          try {
            if (!(subPart instanceof (go as any).Link) || subPart.data?.category !== constants.gojs.C_RELATIONSHIP) return;
            const linkData = subPart.data;
            const relview = myModelview.findRelationshipView(linkData.relviewRef || linkData.key);
            if (!relview) return;

            try {
              targetDiagram.model.setDataProperty(linkData, "routing", routing);
              targetDiagram.model.setDataProperty(linkData, "points", []);
            } catch (_) {
              linkData.routing = routing;
              linkData.points = [];
            }
            relview.routing = routing;
            relview.points = [];
            modifiedRelshipViews.push(new jsn.jsnRelshipView(relview));
          } catch (_) {}
        });

        modifiedRelshipViews.forEach((mn) => {
          let data: any = mn;
          data = JSON.parse(JSON.stringify(data));
          targetDiagram.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data });
        });
      };

      const handleGroupResetRelshipPath = (diagram: go.Diagram, groupPart?: go.Part | null) => {
        const targetDiagram = diagram || myDiagram;
        const myModelview = myMetis.currentModelview;
        if (!targetDiagram || !myModelview || !(groupPart instanceof go.Group)) return;

        const selectedLinks: any[] = [];
        groupPart.findSubGraphParts().each((subPart: go.Part) => {
          try {
            if ((subPart instanceof (go as any).Link) && subPart.data?.category === constants.gojs.C_RELATIONSHIP) {
              selectedLinks.push(subPart);
            }
          } catch (_) {}
        });
        if (selectedLinks.length > 0) {
          uid.clearPath(selectedLinks, myMetis, targetDiagram);
        }
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
        // Preserve any menuHeading set on the original items array so the submenu can render a heading
        try {
          const heading = (items as any)?.menuHeading;
          if (heading) (submenuItems as any).menuHeading = heading;
        } catch (_) {}
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
        dispatchUniversePhData(targetDiagram?.dispatch, data);
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
          label: "Edit Model",
          action: (diagram) => handleEditModel(diagram),
          visible: () => !isMetamodellingMode() && !isAdminModelActive(),
        },
        {
          label: "Edit Model Suite",
          action: (diagram) => handleEditModelSuite(diagram),
          visible: () => !isMetamodellingMode() && !isAdminModelActive(),
        },
        {
          label: "Delete Model",
          action: () => handleDeleteModel(),
          visible: () => !isMetamodellingMode(),
          enabled: () => hasMultipleActiveModels(),
        },
        {
          label: "Verify & Repair Model",
          action: (diagram) => handleVerifyModel(diagram),
          visible: () => !isMetamodellingMode(),
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
          label: "Select All Objects by Object Name",
          action: (diagram) => handleSelectByObjectName(diagram),
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Select All Objects of Type",
          action: (diagram) => handleSelectAllOfType(diagram),
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
        ...globalLayoutOptions.map(option => ({
          label: option.label,
          action: (diagram: go.Diagram) => handleSetLayoutScheme(diagram, option.value),
          visible: () => true,
        })),
        {
          separator: true,
        },
        {
          label: "Set Link Routing",
          action: showSubMenu([
            {
              label: "Normal",
              action: (diagram) => {
                if (!diagram) return;
                diagram.startTransaction('set-link-routing');
                // set diagram default routing
                try {
                  diagram.routing = go.Link.Normal;
                } catch (_) {}
                // update all existing links' data
                diagram.links.each((l) => {
                  try { diagram.model.setDataProperty(l.data, 'routing', 'Normal'); } catch (_) {}
                });
                diagram.commitTransaction('set-link-routing');
                const myModelview = myMetis.currentModelview;
                if (!myModelview) return;
                diagram.links.each((l) => {
                  const linkData: any = l?.data;
                  if (!linkData || linkData.category !== constants.gojs.C_RELATIONSHIP) return;
                  const relview = myModelview.findRelationshipView(linkData.relviewRef || linkData.key);
                  if (!relview) return;
                  relview.routing = 'Normal';
                  relview.points = [];
                  let data: any = new jsn.jsnRelshipView(relview);
                  data = JSON.parse(JSON.stringify(data));
                  diagram.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data });
                });
              }
            },
            {
              label: "Orthogonal",
              action: (diagram) => {
                if (!diagram) return;
                diagram.startTransaction('set-link-routing');
                try { diagram.routing = go.Link.Orthogonal; } catch (_) {}
                diagram.links.each((l) => { try { diagram.model.setDataProperty(l.data, 'routing', 'Orthogonal'); } catch (_) {} });
                diagram.commitTransaction('set-link-routing');
                const myModelview = myMetis.currentModelview;
                if (!myModelview) return;
                diagram.links.each((l) => {
                  const linkData: any = l?.data;
                  if (!linkData || linkData.category !== constants.gojs.C_RELATIONSHIP) return;
                  const relview = myModelview.findRelationshipView(linkData.relviewRef || linkData.key);
                  if (!relview) return;
                  relview.routing = 'Orthogonal';
                  relview.points = [];
                  let data: any = new jsn.jsnRelshipView(relview);
                  data = JSON.parse(JSON.stringify(data));
                  diagram.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data });
                });
              }
            },
            {
              label: "Avoids Nodes",
              action: (diagram) => {
                if (!diagram) return;
                diagram.startTransaction('set-link-routing');
                try { diagram.routing = go.Link.AvoidsNodes; } catch (_) {}
                diagram.links.each((l) => { try { diagram.model.setDataProperty(l.data, 'routing', 'AvoidsNodes'); } catch (_) {} });
                diagram.commitTransaction('set-link-routing');
                const myModelview = myMetis.currentModelview;
                if (!myModelview) return;
                diagram.links.each((l) => {
                  const linkData: any = l?.data;
                  if (!linkData || linkData.category !== constants.gojs.C_RELATIONSHIP) return;
                  const relview = myModelview.findRelationshipView(linkData.relviewRef || linkData.key);
                  if (!relview) return;
                  relview.routing = 'AvoidsNodes';
                  relview.points = [];
                  let data: any = new jsn.jsnRelshipView(relview);
                  data = JSON.parse(JSON.stringify(data));
                  diagram.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data });
                });
              }
            }
          ]),
          closeOnClick: false,
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Set Link Curve",
          action: showSubMenu([
            {
              label: "None",
              action: (diagram) => {
                if (!diagram) return;
                diagram.startTransaction('set-link-curve');
                diagram.links.each((l) => { try { diagram.model.setDataProperty(l.data, 'curve', 'None'); } catch (_) {} });
                diagram.commitTransaction('set-link-curve');
              }
            },
            {
              label: "Bezier",
              action: (diagram) => {
                if (!diagram) return;
                diagram.startTransaction('set-link-curve');
                diagram.links.each((l) => { try { diagram.model.setDataProperty(l.data, 'curve', 'Bezier'); } catch (_) {} });
                diagram.commitTransaction('set-link-curve');
              }
            },
            {
              label: "Jump Over",
              action: (diagram) => {
                if (!diagram) return;
                diagram.startTransaction('set-link-curve');
                diagram.links.each((l) => { try { diagram.model.setDataProperty(l.data, 'curve', 'JumpOver'); } catch (_) {} });
                diagram.commitTransaction('set-link-curve');
              }
            },
            {
              label: "Jump Gap",
              action: (diagram) => {
                if (!diagram) return;
                diagram.startTransaction('set-link-curve');
                diagram.links.each((l) => { try { diagram.model.setDataProperty(l.data, 'curve', 'JumpGap'); } catch (_) {} });
                diagram.commitTransaction('set-link-curve');
              }
            }
          ]),
          closeOnClick: false,
          visible: () => !isMetamodellingMode(),
        },
        {
          label: "Set Link Routing",
          action: (diagram) => handleSetLinkRouting(diagram),
          visible: () => true,
        },
        {
          label: "Set Link Curve",
          action: (diagram) => handleSetLinkCurve(diagram),
          visible: () => true,
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
      ];

      const toggleMenuItems: HtmlMenuItem[] = [
        {
          label: "Delete Relationship",
          action: (diagram) => handleLinkDelete(diagram, part as go.Link),
          enabled: (diagram) => {
            if (!diagram) return false;
            if (!diagram.commandHandler.canDeleteSelection()) return false;
            let found = false;
            diagram.selection.each((p: any) => {
              try {
                if ((p instanceof Object) && (p.data && p.data.category === constants.gojs.C_RELATIONSHIP)) found = true;
                if ((p instanceof Object) && (p instanceof (go as any).Link)) found = true;
              } catch (_) {}
            });
            return found;
          },
          visible: (diagram) => {
            return !!diagram && diagram.commandHandler.canDeleteSelection();
          }
        },
        {
          label: "Delete Relationship View",
          action: (diagram) => {
            if (!diagram) return;
            if (!confirm('Do you really want to delete the selected relationship view(s)?')) return;
            myMetis.deleteViewsOnly = true;
            diagram.commandHandler.deleteSelection();
          },
          enabled: (diagram) => {
            if (!diagram) return false;
            if (!diagram.commandHandler.canDeleteSelection()) return false;
            let found = false;
            diagram.selection.each((p: any) => {
              try {
                if ((p instanceof Object) && (p.data && p.data.category === constants.gojs.C_RELATIONSHIP)) found = true;
                if ((p instanceof Object) && (p instanceof (go as any).Link)) found = true;
              } catch (_) {}
            });
            return found;
          },
          visible: (diagram) => {
            return !!diagram && diagram.commandHandler.canDeleteSelection();
          }
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
        { separator: true },
        {
          label: "Select All Relationships of This Type",
          action: (diagram) => {
            const myMetamodel = myMetis.currentMetamodel;
            const rtypes = myMetamodel?.relshiptypes || myMetis.relshiptypes || [];
            const choices = (rtypes || []).map((rt: any) => rt && rt.name).filter(Boolean);
            const args = { typeNames: choices };
            const modalContext = {
              what: "selectDropdown",
              title: "Select Relationship Type",
              case: "Select All Relationships of This Type",
              myDiagram: diagram,
              args: args,
            };
            myMetis.myDiagram = diagram;
            try { diagram.handleOpenModal(choices, modalContext); } catch (_) {}
          }
        },
        {
          label: "Hide Views of This Relationship Type",
          action: (diagram) => {
            const myMetamodel = myMetis.currentMetamodel;
            const rtypes = myMetamodel?.relshiptypes || myMetis.relshiptypes || [];
            const choices = (rtypes || []).map((rt: any) => rt && rt.name).filter(Boolean);
            const args = { typeNames: choices };
            const modalContext = {
              what: "selectDropdown",
              title: "Select Relationship Type",
              case: "Hide Views of Relationship Type",
              myDiagram: diagram,
              args: args,
            };
            myMetis.myDiagram = diagram;
            try { diagram.handleOpenModal(choices, modalContext); } catch (_) {}
          }
        },
        {
          label: "Delete Views of This Relationship Type",
          action: (diagram) => {
            const myMetamodel = myMetis.currentMetamodel;
            const rtypes = myMetamodel?.relshiptypes || myMetis.relshiptypes || [];
            const choices = (rtypes || []).map((rt: any) => rt && rt.name).filter(Boolean);
            const args = { typeNames: choices };
            const modalContext = {
              what: "selectDropdown",
              title: "Select Relationship Type",
              case: "Delete Views of Relationship Type",
              myDiagram: diagram,
              args: args,
            };
            myMetis.myDiagram = diagram;
            try { diagram.handleOpenModal(choices, modalContext); } catch (_) {}
          }
        },
        {
          label: "Delete Relationships of This Type",
          action: (diagram) => {
            const myMetamodel = myMetis.currentMetamodel;
            const rtypes = myMetamodel?.relshiptypes || myMetis.relshiptypes || [];
            const choices = (rtypes || []).map((rt: any) => rt && rt.name).filter(Boolean);
            const args = { typeNames: choices };
            const modalContext = {
              what: "selectDropdown",
              title: "Select Relationship Type",
              case: "Delete Relationships of This Type",
              myDiagram: diagram,
              args: args,
            };
            myMetis.myDiagram = diagram;
            try { diagram.handleOpenModal(choices, modalContext); } catch (_) {}
          }
        },
      ];
  // Do not set a fixed heading for the Relationships submenu here;
  // the part-level context menu should set an appropriate heading (e.g., the relationship name)

      const metamodelMenuItems: HtmlMenuItem[] = [
        {
          label: "New Metamodel",
          action: () => handleNewMetamodel(),
          visible: () => !isMetamodellingMode() && !isGenericMetamodelContext(),
        },
        {
          label: "Edit Metamodel",
          action: (diagram) => handleEditMetamodel(diagram),
          visible: () => !isMetamodellingMode(),
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
          label: "Add Metamodel",
          action: () => handleAddMetamodel(false),
          visible: () => !isMetamodellingMode() && !isGenericMetamodelContext(),
          enabled: () => (myMetis.metamodels?.length || 0) >= 2,
        },
        {
          label: "Replace Current Metamodel",
          action: () => handleReplaceMetamodel(),
          visible: () => !isMetamodellingMode() && !isGenericMetamodelContext(),
        },
        {
          label: "Add Sub-Metamodel",
          action: () => handleAddMetamodel(true),
          visible: () => !isMetamodellingMode() && !isGenericMetamodelContext(),
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
          label: "Delete Selection",
          action: (diagram) => handleDeleteSelection(diagram),
          enabled: (diagram) => !!diagram && diagram.commandHandler.canDeleteSelection(),
          visible: (diagram) => !!diagram && diagram.commandHandler.canDeleteSelection(),
        },
        {
          label: "Delete Selected Views",
          action: (diagram) => handleDeleteSelectedViews(diagram),
          enabled: (diagram) => !!diagram && diagram.commandHandler.canDeleteSelection() && diagram.selection.count > 1,
          visible: (diagram) => !!diagram && diagram.commandHandler.canDeleteSelection() && diagram.selection.count > 1,
        },
        
        { separator: true },
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
        { separator: true },
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
          label: "Relationships…",
          action: showSubMenu(toggleMenuItems),
          closeOnClick: false,
        },
        { separator: true },
        {
          label: "Layout…",
          action: showSubMenu(layoutMenuItems),
          closeOnClick: false,
        },
        { separator: true },
        {
          label: "Open / Close All Groups",
          action: (diagram) => handleOpenCloseGroups(diagram),
          visible: () => !isMetamodellingMode(),
        },
        { separator: true },
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
          label: "!! Purge Deleted !!",
          // mark as destructive so it's shown red in the menu
          danger: true,
          action: (diagram) => {
            if (!diagram) return;
            if (!confirm('Do you really want to permanently delete all instances marked as deleted?')) return;
            try {
              myMetis.myDiagram = diagram;
              uic.purgeModelDeletions(myMetis, diagram);
            } catch (err) {
              console.error('Error while purging deletions', err);
            }
          },
          visible: () => !isMetamodellingMode(),
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
          // use a fixed heading for the main background menu as requested
          try {
            (coreBackgroundMenu as any).menuHeading = 'Main Background Menu';
          } catch {
            // ignore
          }
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
          const grpCat = String(grp.data?.category || grp.data?.template || grp.category || "");
          const isSwimlaneGroup = grpCat === "Pool" || grpCat === "Lane" || grpCat.startsWith("Lane");
          // Non-swimlane model groups should not clamp node drag; clamping there can
          // make nodes appear to jump/snap back after drop.
          if (!isSwimlaneGroup) {
            const diagram = part.diagram;
            if (diagram?.lastInput?.shift) {
              (diagram as any).__dragAllowReparent = true;
              const k = part.data?.key;
              if (k != null) {
                const s: Set<string> = ((diagram as any).__dragAllowReparentKeys ||= new Set<string>());
                s.add(String(k));
              }
            }
            return pt;
          }
	        const dataGroupKey =
	          typeof part.data?.group === "string" && part.data.group.length > 0
	            ? String(part.data.group)
	            : "";
	        const containingGroupKey =
	          grp.key !== undefined && grp.key !== null
	            ? String(grp.key)
	            : "";
	        // After some container moves, a top-level node can briefly retain a stale
	        // containingGroup even though its persisted `group` is already empty.
	        // Do not clamp that first drag against the old container.
	        if (!dataGroupKey || dataGroupKey !== containingGroupKey) {
	          return pt;
	        }
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
	        const dragObject =
	          (part instanceof go.Group
	            ? part.findObject("SHAPE") ||
	              part.findObject("BODY") ||
	              part.resizeObject ||
	              part.selectionObject
	            : null) || part;
	        const b = dragObject.getDocumentBounds ? dragObject.getDocumentBounds() : part.actualBounds;
	        const loc = part.location;
	        const offsetX = loc.x - b.x;
	        const offsetY = loc.y - b.y;
	        const minX = r.x + offsetX + 2;
	        const maxX = r.right - (b.width - offsetX) - 2;
	        const minY = r.y + offsetY + 2;
	        const maxY = r.bottom - (b.height - offsetY) - 2;
	        const x = Math.max(minX, Math.min(pt.x, maxX));
	        const y = Math.max(minY, Math.min(pt.y, maxY));
	        return new go.Point(x, y);
	      };

      const getGroupBodyBounds = (grp: go.Group) => {
        const back =
          grp.findObject("SHAPE") ||
          grp.findObject("LANE_BODY_SHAPE") ||
          grp.findObject("BODY") ||
          grp.resizeObject;
        if (!back) return null;
        return back.getDocumentBounds();
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
      uit.addNodeTemplates(nodeTemplateMap, partContextMenu, portContextMenu, myMetis, typeviewContextMenu);
      nodeTemplateMap.add("LinkLabel",
        $("Node",
          {
            selectable: false, avoidable: false,
            layerName: "Foreground",
            background: "transparent"  // Ensure node background is transparent
          },  // always have link label nodes in front of Links
          $("Shape", "Ellipse",
            {
              width: 5, height: 5, stroke: null, fill: "transparent",
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

      for (let it = groupTemplateMap.iterator; it.next();) {
        const key = String(it.key || "");
        const part = it.value;
        if (!(part instanceof go.Group)) continue;
        if (key === "Pool" || key === "Lane" || key.startsWith("Lane")) continue;
        // Generic containers should drag freely. Use a pass-through computation
        // instead of clamping to a containing group.
        part.dragComputation = (_part: go.Part, pt: go.Point) => pt;
      }

      const draggingTool = myDiagram.toolManager.draggingTool;
      const baseDoActivate = draggingTool.doActivate;
	      draggingTool.doActivate = function () {
	        const diagram = this.diagram;
        const isVisuallyInsideGroup = (part: go.Part, grp: go.Group): boolean => {
          const back =
            grp.findObject("LANE_BODY_SHAPE") ||
            grp.findObject("BODY") ||
            grp.resizeObject;
          const groupBounds = back ? back.getDocumentBounds() : grp.actualBounds;
          const partBounds = part.actualBounds;
          if (!groupBounds || !partBounds) return false;
          if (groupBounds.containsRect(partBounds)) return true;
          const center = partBounds.center;
          if (groupBounds.containsPoint(center)) return true;
          const overlapLeft = Math.max(partBounds.x, groupBounds.x);
          const overlapTop = Math.max(partBounds.y, groupBounds.y);
          const overlapRight = Math.min(partBounds.right, groupBounds.right);
          const overlapBottom = Math.min(partBounds.bottom, groupBounds.bottom);
          const overlapWidth = Math.max(0, overlapRight - overlapLeft);
          const overlapHeight = Math.max(0, overlapBottom - overlapTop);
          const overlapArea = overlapWidth * overlapHeight;
          const partArea = Math.max(1, partBounds.width * partBounds.height);
          return (overlapArea / partArea) >= 0.45;
        };
        if (diagram?.lastInput?.shift) {
          const draggedPart =
            this.currentPart ||
            diagram.findPartAt(diagram.lastInput.documentPoint, true);
          if (draggedPart instanceof go.Part && draggedPart.canSelect()) {
            if (!draggedPart.isSelected) {
              draggedPart.isSelected = true;
            }
            this.currentPart = draggedPart;
          }
        }
	        const result = baseDoActivate.call(this);
          try {
	          const draggedParts = this.draggedParts;
            const dragSessionToken = utils.createGuid();
	          let activatedOrdinaryNodeDrag = false;
	          for (let it = draggedParts?.iterator; it?.next();) {
	            const part = it.key as go.Part;
	            if (!(part instanceof go.Node) || part instanceof go.Group || !part.data) continue;
              try {
                (part.data as any).__dragSessionToken = dragSessionToken;
                if (typeof (diagram.model as any)?.setDataProperty === "function") {
                  (diagram.model as any).setDataProperty(part.data, "__dragSessionToken", dragSessionToken);
                }
              } catch (_) {
              }
	            activatedOrdinaryNodeDrag = true;
	            const staleGroup = part.containingGroup;
            if (staleGroup instanceof go.Group && !isVisuallyInsideGroup(part, staleGroup)) {
              try {
                if (typeof (diagram.model as any)?.setGroupKeyForNodeData === "function") {
                  (diagram.model as any).setGroupKeyForNodeData(part.data, undefined);
                } else {
                  diagram.model.setDataProperty(part.data, "group", "");
                }
              } catch (_) {
              }
              try { diagram.model.setDataProperty(part.data, "group", ""); } catch (_) { }
	              try { part.data.group = ""; } catch (_) { }
	              try { part.containingGroup = null; } catch (_) { }
	            }
	            (part.data as any).__dragStartGroup =
	              part.containingGroup instanceof go.Group && part.containingGroup.key !== undefined && part.containingGroup.key !== null
	                ? String(part.containingGroup.key)
	                : String(part.data.group || "");
	          }
	          if (activatedOrdinaryNodeDrag && (diagram as any).__suppressSyncForNextNodeDrag) {
	            (diagram as any).__suppressNodeModelSyncUntil = Date.now() + 2000;
	            (diagram as any).__suppressPropSyncUntil = Date.now() + 2000;
	            try {
	              for (let it = draggedParts?.iterator; it?.next();) {
	                const part = it.key as go.Part;
	                if (!(part instanceof go.Node) || part instanceof go.Group) continue;
	                [
	                  "Selection",
	                  "Tool",
	                  "Resize",
	                  "Resizing",
	                  "Rotate",
	                  "LinkReshaping",
	                  "RelinkingFrom",
	                  "RelinkingTo",
	                  "Relinking",
	                ].forEach((name) => {
	                  try { part.removeAdornment(name); } catch (_) { }
	                });
	                try { part.updateAdornments(); } catch (_) { }
	              }
	              try { diagram.requestUpdate(); } catch (_) { }
	            } catch (_) {
	            }
	            delete (diagram as any).__suppressSyncForNextNodeDrag;
	          }
	        } catch (_) {
	        }
	        return result;
	      };

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
          myDiagram.layout = $(go.CircularLayout, {
            isInitial: false,
            isOngoing: false,
          });
          break;
        case 'Grid':
          myDiagram.layout = $(go.GridLayout, {
            isInitial: false,
            isOngoing: false,
          });
          break;
        case 'Tree':
          myDiagram.layout = $(go.TreeLayout, {
            isInitial: false,
            isOngoing: false,
          });
          break;
        case 'ForceDirected':
          myDiagram.layout = $(go.ForceDirectedLayout, {
            isInitial: false,
            isOngoing: false,
          });
          break;
        case 'LayeredDigraph':
          myDiagram.layout = $(go.LayeredDigraphLayout, {
            isInitial: false,
            isOngoing: false,
          });
          break;
        case 'Manual':
          myDiagram.layout.isInitial = false;
          myDiagram.layout.isOngoing = false;
          break;
      }
      // Always run selected layout once, then keep manual node movement stable.
      // Without forcing here, layouts with isInitial/isOngoing=false may not execute.
      myDiagram.layoutDiagram(true);
    }

    function clearInstance(inst: any) {

    }

    // this DiagramEvent handler is called during the linking or relinking transactions
    function maybeChangeLinkCategory(e: any) {
      let link = e.subject;
      let linktolink = (link.fromNode?.isLinkLabel || link.toNode?.isLinkLabel);
      const newTemplate = template ?? (link.data.template);
      if (typeof newTemplate === "string" && newTemplate.length > 0) {
        diagram.model.setCategoryForLinkData(link.data, newTemplate);
        link.data.template = newTemplate;
      }
      // e.diagram.model.setCategoryForLinkData(link.data, (linktolink ? "linkToLink" : ""));
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
        const fallbackImg = './../images/default.png';
        const CustomSelectOption = (props: any) => (
          <Option {...props}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img
                className="option-img mr-2"
                src={props.data.value}
                style={{ width: 20, height: 20, objectFit: 'contain', marginRight: 8 }}
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.onerror = null;
                  img.src = fallbackImg;
                }}
              />
              <span>{props.data.label}</span>
            </div>
          </Option>
        );

        const CustomSelectValue = (props: any) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img
              className="option-img mr-2"
              src={props.data.value}
              style={{ width: 20, height: 20, objectFit: 'contain', marginRight: 8 }}
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const img = e.currentTarget as HTMLImageElement;
                img.onerror = null;
                img.src = fallbackImg;
              }}
            />
            <span>{props.data.label}</span>
          </div>
        );
        if (modalContext?.title === 'Select Icon') {
          // Use the new tabbed modal for icon selection
          header = modalContext.title;
          modalContent = (
            <ChangeIconModal 
              isOpen={this.state.showChangeIconModal}
              onClose={() => this.setState({ showChangeIconModal: false })}
              onSelect={(icon) => this.handleSelectDropdownChange({ value: icon })}
            />
          );
          // Don't use the old select dropdown for icons
          break;
        } else if (modalContext?.title === 'Set Layout Scheme') {
          let layout, img;
          options = this.state.modalContext.layoutList.map(ll => {
            img = './../images/default.png'
            layout = ll.value
            return { value: layout, label: ll.label }
          })
          comps = { Option: CustomSelectOption, SingleValue: CustomSelectValue }
        } else if (modalContext?.title === 'Set Routing Scheme') {
          let routing, img;
          options = this.state.modalContext.routingList.map(rr => {
            img = './../images/default.png'
            routing = rr.value
            return { value: routing, label: rr.label }
          })
          comps = { Option: CustomSelectOption, SingleValue: CustomSelectValue }
        } else if (modalContext?.title === 'Set Link Curve') {
          let curve, img;
          options = this.state.modalContext.curveList.map(cc => {
            img = './../images/default.png'
            curve = cc.value
            return { value: curve, label: cc.label }
          })
          comps = { Option: CustomSelectOption, SingleValue: CustomSelectValue }
        } else if (modalContext?.title === 'Select Relationship Type') {
          const choices = this.state.modalContext.args.typeNames;
          let img;
          options = choices.map(tpname => {
            img = './../images/default.png';
            return { value: tpname, label: tpname }
          })
          comps = { Option: CustomSelectOption, SingleValue: CustomSelectValue }
        } else {
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
      case 'addPorts': {
        header = modalContext.title;
        const addPorts = modalContext.addPorts || {};
        const entries = Array.isArray(addPorts.entries) ? addPorts.entries : [];
        modalContent =
          <div className="modal-prop" style={{ display: 'block', width: '100%' }}>
            {entries.map((entry: any) => (
              <div key={entry.key} className="mb-2 d-flex align-items-end">
                <div style={{ flex: '0 0 34%' }}>
                  <label className="form-label mb-1">Type</label>
                  <input className="form-control" type="text" value={entry.label} readOnly />
                </div>
                <div className="px-1" style={{ flex: '0 0 22%' }}>
                  <label className="form-label mb-1">Prefix</label>
                  <input
                    className="form-control"
                    type="text"
                    value={entry.prefix ?? ''}
                    onChange={(e) => this.handleAddPortsEntryChange(entry.key, 'prefix', e.target.value)}
                  />
                </div>
                <div className="px-1" style={{ flex: '0 0 22%' }}>
                  <label className="form-label mb-1">Count</label>
                  <input
                    className="form-control"
                    type="number"
                    min={0}
                    value={entry.count ?? 0}
                    onChange={(e) => this.handleAddPortsEntryChange(entry.key, 'count', e.target.value)}
                  />
                </div>
                <div className="px-1" style={{ flex: '0 0 22%' }}>
                  <label className="form-label mb-1">Start Index</label>
                  <input
                    className="form-control"
                    type="number"
                    min={0}
                    value={entry.startIndex ?? 1}
                    onChange={(e) => this.handleAddPortsEntryChange(entry.key, 'startIndex', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>;
        break;
      }
      case 'editPortName': {
        header = modalContext.title;
        const editPortName = modalContext.editPortName || {};
        modalContent =
          <div className="modal-prop" style={{ display: 'block', width: '100%' }}>
            <div>
              <label className="form-label mb-1">Port Name</label>
              <input
                className="form-control"
                type="text"
                value={editPortName.value ?? ''}
                onChange={(e) => this.handleEditPortNameFieldChange(e.target.value)}
                autoFocus
              />
            </div>
          </div>;
        break;
      }
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
        {(() => {
          const normalizedNodeDataArray = normalizeDiagramNodeCategoryData(this.props.nodeDataArray);
          const diagram = this.diagramRef.current?.getDiagram();
          const liveMergedNodeDataArray = mergeIncomingDiagramNodeDataWithLiveState(normalizedNodeDataArray, diagram);
          const liveMergedLinkDataArray = mergeIncomingDiagramLinkDataWithLiveState(this.props.linkDataArray, diagram);
          return (
        <ReactDiagram
          ref={this.diagramRef}
          divClassName='diagram-component'
          initDiagram={this.initDiagram}
          nodeDataArray={liveMergedNodeDataArray}
          linkDataArray={liveMergedLinkDataArray}
          modelData={this.props.modelData}
          // myMetis={this.props.myMetis}
          // modelType={this.props.modelType}
          onModelChange={this.props.onModelChange}
          skipsDiagramUpdate={this.props.skipsDiagramUpdate}
          style={this.props.diagramStyle}
        // exportToSvg={this.props.exportToSvg}
        />
          );
        })()}
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
              {modalContext?.what === 'addPorts' ? (
                <>
                  <Button className="modal-button bg-link m-0 p-0" color="link" onClick={() => { this.setState({ showModal: false, selectedData: null, modalContext: null }) }}>Cancel</Button>
                  <Button className="modal-button bg-link m-0 p-0" color="link" onClick={() => { this.handleAddPortsSubmit() }}>Add</Button>
                </>
              ) : modalContext?.what === 'editPortName' ? (
                <>
                  <Button className="modal-button bg-link m-0 p-0" color="link" onClick={() => { this.setState({ showModal: false, selectedData: null, modalContext: null }) }}>Cancel</Button>
                  <Button className="modal-button bg-link m-0 p-0" color="link" onClick={() => { this.handleEditPortNameSubmit() }}>Save</Button>
                </>
              ) : (
                <Button className="modal-button bg-link m-0 p-0" color="link" onClick={() => { this.handleCloseModal() }}>Done</Button>
              )}
            </ModalFooter>
          </div>
          {/* </div> */}
        </Modal>
        <ChangeIconModal 
          isOpen={this.state.showChangeIconModal}
          onClose={() => this.setState({ showChangeIconModal: false })}
          onSelect={(icon) => this.handleSelectDropdownChange({ value: icon })}
        />
        <ChangeImageModal 
          isOpen={this.state.showChangeImageModal}
          onClose={() => this.setState({ showChangeImageModal: false })}
          onSelect={(image) => this.handleSelectDropdownChange({ value: image })}
          imageList={this.state.modalContext?.imageList || []}
        />
        <Dialog open={this.state.selectConnectedDialogOpen} onOpenChange={(open) => !open && this.handleSelectConnectedCancel()}>
          <DialogContent className="px-3 py-2">
            <DialogHeader>
              <DialogTitle>Select Connected Objects</DialogTitle>
              <DialogDescription className="mb-0">Choose traversal depth, relationship types, and direction.</DialogDescription>
            </DialogHeader>
            <div className="d-flex flex-column gap-2 small">
              <label className="small fw-semibold text-secondary">Relationship to follow</label>
              <select
                multiple
                value={(this.state.selectConnectedRelChoice as any) || ['All']}
                onChange={this.handleSelectConnectedRelChoiceChange as any}
                className="form-select form-select-sm py-1 px-2"
                style={{ minHeight: 48, maxHeight: 220, lineHeight: 1.1, overflowY: 'auto' }}
              >
                {(this.state.selectConnectedRelOptions || [{ value: 'All', label: 'All' }]).map((opt: any) => {
                  const value = typeof opt === 'string' ? opt : opt.value;
                  const label = typeof opt === 'string' ? opt : opt.label;
                  return <option key={value} value={value}>{label}</option>;
                })}
              </select>
              <div className="form-check mt-1">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="select-include-all-rels"
                  checked={!!this.state.selectConnectedIncludeAllRels}
                  onChange={this.handleSelectConnectedIncludeAllRelsChange}
                />
                <label className="form-check-label small" htmlFor="select-include-all-rels">
                  Include relationships not in this modelview
                </label>
              </div>
              <label className="small fw-semibold text-secondary">Steps to traverse</label>
              <select
                value={this.state.selectConnectedLevels || '1'}
                onChange={this.handleSelectConnectedLevelsChange as any}
                className="form-select form-select-sm py-1 px-2"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <label className="small fw-semibold text-secondary">Relationship types to traverse</label>
              <select
                multiple
                value={((this.state.selectConnectedReltypes || 'All') === 'All'
                  ? ['All']
                  : (this.state.selectConnectedReltypes || '')
                    .split(',')
                    .map(v => v.trim())
                    .filter(v => v.length > 0)) as any}
                onChange={this.handleSelectConnectedReltypesChange as any}
                className="form-select form-select-sm py-1 px-2"
                style={{ minHeight: 48, maxHeight: 220, lineHeight: 1.1, overflowY: 'auto' }}
              >
                {(this.state.selectConnectedReltypeOptions || ['All']).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <label className="small fw-semibold text-secondary">Direction</label>
              <select
                value={this.state.selectConnectedReldir || 'All'}
                onChange={this.handleSelectConnectedReldirChange as any}
                className="form-select form-select-sm py-1 px-2"
              >
                {['All', 'out', 'in'].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div className="form-check mt-1">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="select-create-missing-views"
                  checked={!!this.state.selectConnectedCreateMissingViews}
                  onChange={this.handleSelectConnectedCreateMissingViewsChange}
                />
                <label className="form-check-label small" htmlFor="select-create-missing-views">
                  Add missing objects to view
                </label>
              </div>
            </div>
            <DialogFooter className="d-flex justify-content-end mt-3 px-1 pb-1 pt-2 gap-3">
              <UiButton
                variant="outline"
                className="btn btn-sm btn-light px-2 text-muted"
                onClick={this.handleSelectConnectedCancel}
              >
                Cancel
              </UiButton>
              <UiButton
                variant="default"
                className="btn btn-sm btn-dark px-3 text-white"
                onClick={this.handleSelectConnectedConfirm}
              >
                Select
              </UiButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={this.state.addConnectedDialogOpen} onOpenChange={(open) => !open && this.handleAddConnectedCancel()}>
          <DialogContent className="px-3 py-2">
            <DialogHeader>
              <DialogTitle>Add Connected Objects</DialogTitle>
              <DialogDescription className="mb-1">Generate connected nodes with the chosen traversal settings.</DialogDescription>
            </DialogHeader>
            <div className="d-flex flex-column gap-2 small">
              <label className="small fw-semibold text-secondary">Relationship to follow</label>
              <select
                multiple
                value={(this.state.addConnectedRelChoice as any) || ['All']}
                onChange={this.handleAddConnectedRelChoiceChange as any}
                className="form-select form-select-sm py-1 px-2"
                style={{ minHeight: 48, maxHeight: 220, lineHeight: 1.1, overflowY: 'auto' }}
              >
                {(this.state.addConnectedRelOptions || ['All']).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div className="form-check mt-1">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="add-include-all-rels"
                  checked={!!this.state.addConnectedIncludeAllRels}
                  onChange={this.handleAddConnectedIncludeAllRelsChange}
                />
                <label className="form-check-label small" htmlFor="add-include-all-rels">
                  Include relationships not in this modelview
                </label>
              </div>
              <label className="small fw-semibold text-secondary">Levels to add</label>
              <select
                value={this.state.addConnectedLevels || '1'}
                onChange={this.handleAddConnectedLevelsChange as any}
                className="form-select form-select-sm py-1 px-2"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <label className="small fw-semibold text-secondary">Relationship types to traverse</label>
              <select
                multiple
                value={((this.state.addConnectedReltypes || 'All') === 'All'
                  ? ['All']
                  : (this.state.addConnectedReltypes || '')
                    .split(',')
                    .map(v => v.trim())
                    .filter(v => v.length > 0)) as any}
                onChange={this.handleAddConnectedReltypesChange as any}
                className="form-select form-select-sm py-1 px-2"
                style={{ minHeight: 48, maxHeight: 220, lineHeight: 1.1, overflowY: 'auto' }}
              >
                {(this.state.addConnectedReltypeOptions || ['All']).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <label className="small fw-semibold text-secondary">Direction</label>
              <select
                value={this.state.addConnectedReldir || 'All'}
                onChange={this.handleAddConnectedReldirChange as any}
                className="form-select form-select-sm py-1 px-2"
              >
                {['All', 'out', 'in'].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <DialogFooter className="d-flex gap-3 mt-1">
              <div className="flex-grow-1" />
              <UiButton
                variant="outline"
                className="btn btn-sm btn-light px-2 text-muted"
still f             onClick={this.handleAddConnectedCancel}
              >
                Cancel
              </UiButton>
              <UiButton
                variant="small"
                className="btn btn-sm btn-secondary px-3 text-white"
                onClick={this.handleAddConnectedConfirm}
              >
                Add
              </UiButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <style jsx>{`        
      `}
        </style>
      </div>
    );
  }
}
