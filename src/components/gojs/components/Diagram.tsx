// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;
const linkToLink = false;

import * as go from 'gojs';

import { SaveModelviewToSvgFile } from '../../utils/SaveModelToFile';
{/* <script src="../release/go-debug.js"></script> */ }

import { produce } from 'immer';
import { ReactDiagram } from 'gojs-react';
import React, { useEffect } from 'react';
import Select, { components } from "react-select"
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Breadcrumb } from 'reactstrap'
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Tooltip } from 'reactstrap';
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
const printf = require('printf');
const RegexParser = require("regex-parser");

import { GuidedDraggingTool } from '../GuidedDraggingTool';
import LoadLocal from '../../../components/LoadLocal'
import { FaSleigh, FaTemperatureLow, FaTumblrSquare } from 'react-icons/fa';
// import * as svgs from '../../utils/SvgLetters'
// import svgs from '../../utils/Svgs'
import { setMyGoModel, setMyMetisParameter } from '../../../actions/actions';
import { iconList } from '../../forms/selectIcons';
import { METHODS } from 'http';
// import { stringify } from 'querystring';
// import './Diagram.css';
// import "../../../styles/styles.css"
import "../BalloonLink.js";
import Toggle from '../../utils/Toggle';
import { set } from 'immer/dist/internal';
import { on } from 'process';

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

  /** @internal */
  constructor(props: DiagramProps) {
    super(props);
    if (debug) console.log('78 Diagram props:', props);
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
  /**
   * Get the diagram reference and add any desired diagram listeners.
   * Typically the same function will be used for each listener, with the function using a switch statement to handle the events.
   */
  public componentDidMount() {
    if (!this.diagramRef.current) return;
    const diagram = this.diagramRef?.current?.getDiagram();
    if (diagram instanceof go.Diagram) {
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

      if (this.props.onExportSvgReady) {
        this.props.onExportSvgReady(this.exportSvg, true); // Pass true to indicate that the diagram is ready
      }

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

      diagram.removeChangedListener(this.props.onModelChange);

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
    if (debug) console.log('185 this.state', this.state);
  }

  public handleSelectDropdownChange = (selected) => {
    if (debug) console.log('189 this.state', this);
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
    if (debug) console.log('200 selected, context', selected, context);
    // Handle the links
    uim.handleSelectDropdownChange(selected, context);
    // Handle the relationships
    if (debug) console.log('204 selected', selected);
  }

  public handleCloseModal(e) {
    const modalContext = this.state.modalContext;
    const myContext = modalContext.myContext;
    if (debug) console.log('218 modalContext:', modalContext);
    let myDiagram = modalContext.myDiagram;
    if (!myDiagram) myDiagram = myContext.myDiagram;
    // const data = modalContext.data;
    if (e === 'x') {
      if (debug) console.log('223 x:', e);
      const links = modalContext.links;
      for (let i = 0; i < links?.length; i++) {
        const link = links[i];
        myDiagram.model.removeLinkData(link);
      }
      this.setState({ showModal: false, selectedData: null, modalContext: null });
      return;
    }
    const props = this.props;
    if (debug) console.log('233 state', this.state);
    if (modalContext.case === 'Connect to Selected')
      modalContext.what = "connectToSelected";
    uim.handleCloseModal(this.state.selectedData, props, modalContext);
    this.setState({ showModal: false });
  }

  //public handleInputChange(propname: string, value: string, fieldType: string, obj: any, context: any, isBlur: boolean) {
  public handleInputChange(props: any, value: string, isBlur: boolean) {
    if (debug) console.log('258 Diagram: props, value, isBlur: ', props, value, isBlur);
    const propname = props.id;
    const fieldType = props.type;
    const obj = props.obj;
    const context = props.context;
    const pattern = props.pattern;
    if (debug) console.log('221 propname, value, obj, context, isBlur:', propname, value, obj, context, isBlur);
    if (debug) console.log('222 this.state', this.state);
    if (debug) console.log('223 obj', obj);

    let run = false;
    this.setState(
      produce((draft: DiagramProps) => {
        if (run === false) {
          run = true;
          draft.selectedData[propname] = value;
          if (debug) console.log('250 propname, value, isBlur, data[propname], data: ', propname, value, isBlur);
        }
      })
    );

    if (debug) console.log('309 obj, context', obj, context);
    if (debug) console.log('310 Diagram: props, propname, value, isBlur:', props, propname, value, isBlur);

    uim.handleInputChange(this.myMetis, props, value);
  }

  /**
   * Diagram initialization method, which is passed to the ReactDiagram component.
   * This method is responsible for making the diagram and initializing the model, any templates,
   * and maybe doing other initialization tasks like customizing tools.
   * The model's data should not be set here, as the ReactDiagram component handles that.
   */

  private initDiagram(): go.Diagram {
    go.Diagram.licenseKey = "73f944e5b16131b700ca0d2b113f69ef1bb37a619ed11ff55e5141f3ef586c102b9dec7a598099d0d4ac1ef41a7d978c89cc6b2f96440c32e330da8847e282fbb23574b7165a148ca00675919aad2df4f47b63e2c4e027a4da2adcf3f9b8c09d5feaecdd57c90a";
    if (debug) console.log('282 this', this);
    this.diagramRef.current?.clear();
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
                // Uncomment the next line to turn ON linkToLink
                // linkLabelKeysProperty: "labelKeys",
                linkKeyProperty: 'key'
              })
          }
        );
    }
    // when the user clicks on the background of the Diagram, remove all highlighting
    myDiagram.click = function (e) {
      e.diagram.commit(function (d) { d.clearHighlighteds(); }, "no highlighteds");
    };
    if (debug) console.log('myDiagram.model', myDiagram.model);
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
            font: "bold arial 72px sans-serif" // Seems not supported
          }
        ),
        // use a converter to display information about the diagram model
      );
    myDiagram.grid.visible = true;
    myDiagram.toolManager.draggingTool.isGridSnapEnabled = true;
    myDiagram.toolManager.resizingTool.isGridSnapEnabled = true;
    myMetis.myDiagram = myDiagram;
    myDiagram.model.linkFromPortIdProperty = "fromPort";  // necessary to remember portIds
    myDiagram.model.linkToPortIdProperty = "toPort";
    const myModelview: akm.cxModelView = myMetis.currentModelview;
    if (myModelview) myModelview.diagram = myDiagram;

    if (myModelview?.name === constants.admin.AKM_ADMIN_MODELVIEW) {
      setLayout(myDiagram, myModelview?.layout);
    }

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
    // Nodes CONTEXT MENU
    {
      var partContextMenu =
        $(go.Adornment, "Vertical",
          makeButton("Copy",
            function (e: any, obj: any) {
              let node = obj.part;
              node = myDiagram.findNodeForKey(node.key);
              try {
                const myCollection = node.findSubGraphParts();
                myCollection.add(node);
                myDiagram.selectCollection(myCollection);
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
                if (debug) console.log('457 sel.data', sel.data);
                selection.push(sel.data);
              });

              myMetis.currentSelection = selection;
              if (debug) console.log('438 myMetis', myMetis);
              e.diagram.commandHandler.copySelection();
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
              if (debug) console.log('473 myMetis', myMetis);
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
              if (debug) console.log('560 Paste View', myMetis);
            },
            function (o: any) {
              //return false;
              return o.diagram.commandHandler.canPasteSelection();
            }),
          makeButton("----------"),
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
              if (debug) console.log('529 gjsNode', gjsNode);
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
              if (debug) console.log('542 gjsNode', gjsNode);
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
              if (debug) console.log('559 node. nodes', node, nodes);
              if (debug) console.log('560 selection', selection);
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
              if (debug) console.log('607 modalContext', modalContext);
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
              if (debug) console.log('719', iconLabels, ilist);
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
              if (debug) console.log('655 myMetis', myMetis);
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
                  console.log('710 regex:', regex);
                  const value = prompt('Value to check');
                  console.log('710 regex:', regex);
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
          //           if (debug) console.log('749 node', node);
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
                myMetis.deleteViewsOnly = false;
                myMetis.currentNode = obj.part.data;
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
              const node = obj.part.data;
              if (debug) console.log('529 node', node);
              const choices = ['left', 'right', 'top', 'bottom'];
              let defText = "";
              if (choices.length > 0) defText = choices[0];
              const modalContext = {
                what: "selectDropdown",
                title: "Select Side",
                case: "Add Port",
                node: node,
                myDiagram: myDiagram
              }
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(choices, modalContext);
              return;
            },
            function (o: any) {
              if (myMetis.modelType == 'Modelling') {
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
            function (e: any, obj: any) {
              const node = obj.part.data;
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
              if (debug) console.log('369 Diagram', myMetis.currentModel.targetMetamodelRef);

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
                if (debug) console.log('467 jsnDatatype', jsnDatatype);
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
              myDiagram.dispatch = e.diagram.dispatch;
              gen.generateTargetMetamodel(obj, myMetis, myDiagram);
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
                let object = objview.object;
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
              if (debug) console.log('273 node', node);
              const myMetamodel = myMetis.currentMetamodel;
              const objtypes = myMetamodel.getObjectTypes();
              if (debug) console.log('275 Set object type', objtypes);
              let defText = "";
              if (objtypes) {
                node.choices = [];
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
              if (debug) console.log('511 myMetis', node.choices, myMetis);
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                return true;
              }
              return false;
            }),
          makeButton("Edit Typeview",
            function (e: any, obj: any) {
              const node = obj.part.data;
              if (debug) console.log('983 node, myMetis', node, myMetis);
              uid.editObjectTypeview(node, myMetis, myDiagram);
            },
            function (o: any) {
              return false;
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
              else if (node.category === constants.gojs.C_OBJECTTYPE)
                return true;
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
                  if (debug) console.log('1000 myGoModel, inst', myGoModel, inst);
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



              // alert("You need to do a Reload to see the change!");
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
              objview = myMetis.findObjectView(objview.id);
              objview.viewkind = 'Object';
              objview.template = 'textAndIcon'
              objview.isGroup = false;
              // objview.size = "200 100";
              // node.objectview = objview;
              node.viewkind = 'Object';
              // console.log('1243 node', node, this, this.state.nodeDataArray, this.setState);
            //  this.setState(
            //     {
            //       nodeDataArray: [
            //         ...this.state.nodeDataArray,
            //         node
            //       ]
            //     }
            //   );
              const jsnObjview = new jsn.jsnObjectView(objview);
              if (debug) console.log('1052 objview, jsnObjview', objview, jsnObjview);
              const data = JSON.parse(JSON.stringify(jsnObjview));
              myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
              alert("You need to a Reload to see the change!");
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                const objview = node.objectview;
                if (objview.viewkind === 'Container')
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
                if (objview.viewkind === 'Container') {
                  if (objview.isExpanded === false)
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
                if (objview.isGroup) {
                  if (objview.isExpanded === true)
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
                if (!objview.isGroup) {
                  const mySelection = myDiagram.selection;
                  uid.doTreeLayout(mySelection, myModelview, myDiagram, true);
                  myDiagram.selection.each(function (sel) {
                    const link = sel.data;
                    if (link.category === constants.gojs.C_RELATIONSHIP) {
                      const fromLink = link.from;
                      const toLink = link.to;
                      let relview: akm.cxRelationshipView = link.relshipview;
                      relview = myModelview.findRelationshipView(relview?.id);
                      if (relview) {
                        const fromObjview = relview.fromObjview;
                        const toObjview = relview.toObjview;
                        link.points = [];
                        link.from = fromLink;
                        link.to = toLink;
                        myDiagram.model.setDataProperty(link, "points", link.points);
                        relview.points = [];
                        relview.fromObjview = fromObjview;
                        relview.toObjview = toObjview;
                        // const jsnRelView = new jsn.jsnRelshipView(relview);
                        // modifiedRelshipViews.push(jsnRelView);
                      }
                    }
                  })
                } else {
                  if (objview.groupLayout)
                    uid.doGroupLayout(objview, myDiagram);
                }
              }
              myDiagram.requestUpdate();
            },
            function (obj: any) {
              let node = obj.part.data;
              const key = node.key;
              const objview = myMetis.findObjectView(key);
              if (!objview?.isGroup)
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
              if (debug) console.log('441 myMetis', myMetis);
              const contextmenu = obj.part;
              const part = contextmenu.adornedPart;
              const currentObj = part.data.object;
              context.myTargetMetamodel = myMetis.currentTargetMetamodel;
              if (debug) console.log('446 context', context);
              gen.askForTargetMetamodel(context);
              // context.myTargetMetamodel = gen.askForTargetMetamodel(context, false);
              // if (context.myTargetMetamodel == undefined) { // sf
              //     context.myTargetMetamodel = null;
              // }    
              // myMetis.currentTargetMetamodel = context.myTargetMetamodel;
              // if (debug) console.log('456 Generate Object Type', context.myTargetMetamodel, myMetis);
              // if (context.myTargetMetamodel) {  
              //   myMetis.currentModel.targetMetamodelRef = context.myTargetMetamodel?.id;
              //   if (debug) console.log('459 Generate Object Type', context, myMetis.currentModel.targetMetamodelRef);
              //   const jsnModel = new jsn.jsnModel(context.myModel, true);
              //   const modifiedModels = new Array();
              //   modifiedModels.push(jsnModel);
              //   modifiedModels.map(mn => {
              //     let data = (mn) && mn;
              //     data = JSON.parse(JSON.stringify(data));
              //     myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
              //   })
              //   if (debug) console.log('467 jsnModel', jsnModel);
              //   const currentObjview = part.data.objectview;
              //   const objtype = gen.generateObjectType(currentObj, currentObjview, context);
              //   if (debug) console.log('470 Generate Object Type', objtype, myMetis);
              // }
            },
            function (o: any) {
              let obj = o.part.data.object;
              let objtype = obj.type;
              if (objtype.name === constants.types.AKM_INFORMATION)
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
          makeButton("Select connected objects 1",
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
          makeButton("Select Connected Objects",
            function (e: any, obj: any) {
              let node = obj.part.data;
              if (debug) console.log('1453 obj.part: ', obj.part.toString());
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
              if (debug) console.log('1066 node', node);
              if (node.category === constants.gojs.C_OBJECT) {
                const object = node.object;
                let type = object.type;
                type = myMetis.findObjectType(type.id);
                const propname = "osduId";
                if (debug) console.log('1070 type', type);
                if (type.findPropertyByName2(propname, true)) {
                  if (debug) console.log('1074 type, propname', type, propname);
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
                object = myMetis.findObject(object.id);
                let objectview = node.objectview as akm.cxObjectView;
                objectview = myMetis.findObjectView(objectview.id);
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
      var linkContextMenu =
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
              if (debug) console.log('1265 link', link);
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
              const relshiptype = myMetis.findRelationshipType(link?.reltypeRef);
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
              const modifiedRelshipViews = new Array();
              myDiagram.selection.each(function (sel) {
                const link = sel;
                let relview = link.data.relshipview;
                if (relview) {
                  relview = myModelview.findRelationshipView(relview.id);
                  relview.visible = false;
                  const jsnRelView = new jsn.jsnRelshipView(relview);
                  modifiedRelshipViews.push(jsnRelView);
                  link.visible = false;
                  myDiagram.remove(link);
                }
              })
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
                const currentRelship = myMetis.findRelationship(link.relship?.id);
                const currentRelshipView = myMetis.findRelationshipView(link.relshipview?.id);
                if (currentRelship && currentRelshipView) {
                  const myMetamodel = myMetis.currentMetamodel;
                  const reltype = currentRelship.type as akm.cxRelationshipType;
                  let typeview = currentRelshipView.typeview as akm.cxRelationshipTypeView;
                  const defaultTypeview = reltype.typeview as akm.cxRelationshipTypeView;;
                  if (debug) console.log('701 link', reltype, defaultTypeview, typeview);
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
                    if (debug) console.log('796 viewdata', typeview.data);
                    for (let prop in typeview.data) {
                      myDiagram.model.setDataProperty(link, prop, viewdata[prop]);
                    }
                    link.typeview = typeview;
                    myDiagram.requestUpdate();
                    myMetamodel.addRelationshipTypeView(typeview);
                    myMetis.addRelationshipTypeView(typeview);
                    if (debug) console.log('712 myMetis', currentRelshipView, typeview, myMetis);

                    const jsnReltypeView = new jsn.jsnRelshipTypeView(typeview);
                    if (debug) console.log('715 jsnReltypeView', jsnReltypeView);
                    const modifiedTypeViews = new Array();
                    modifiedTypeViews.push(jsnReltypeView);
                    modifiedTypeViews.map(mn => {
                      let data = mn;
                      data = JSON.parse(JSON.stringify(data));
                      e.diagram.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
                    })

                    const jsnRelView = new jsn.jsnRelshipView(currentRelshipView);
                    if (debug) console.log('723 jsnRelView', jsnRelView);
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
              if (debug) console.log('1259 link', link);
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
          makeButton("Edit Typeview",
            function (e: any, obj: any) {
              const link = obj.part.data;
              uid.editRelshipTypeview(link, myMetis, myDiagram);
            },
            function (o: any) {
              return false;
              const link = o.part.data;
              if (link.category === constants.gojs.C_RELATIONSHIP)
                return true;
              if (link.category === constants.gojs.C_RELSHIPTYPE)
                return true;
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
                  if (debug) console.log('1000 myGoModel, inst', myGoModel, inst);
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
              if (debug) console.log('935 myMetis', myMetis);
              const contextmenu = obj.part;
              const part = contextmenu.adornedPart;
              const currentRel = part.data.relship;
              context.myTargetMetamodel = myMetis.currentTargetMetamodel;
              if (debug) console.log('940 context', currentRel, context);
              gen.askForTargetMetamodel(context);
              // if (context.myTargetMetamodel == undefined)  // sf
              //   context.myTargetMetamodel = null;
              // myMetis.currentTargetMetamodel = context.myTargetMetamodel;
              // if (debug) console.log('950 Generate Relationship Type', context.myTargetMetamodel, myMetis);
              // if (context.myTargetMetamodel) {  
              //   myMetis.currentModel.targetMetamodelRef = context.myTargetMetamodel?.id;
              //   if (debug) console.log('953 Generate Relationship Type', context, myMetis.currentModel.targetMetamodelRef);
              //   const jsnModel = new jsn.jsnModel(context.myModel, true);
              //   const modifiedModels = new Array();
              //   modifiedModels.push(jsnModel);
              //   modifiedModels.map(mn => {
              //     let data = (mn) && mn;
              //     data = JSON.parse(JSON.stringify(data));
              //     myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
              //   })
              //   const currentRelview = part.data.relshipview;
              //   if (debug) console.log('962 currentRelview', currentRelview);
              //   const reltype = gen.generateRelshipType(currentRel, currentRelview, context);
              //   if (debug) console.log('964 Generate Relationship Type', reltype, myMetis);
              //   if (reltype) {
              //     const reltypeview = reltype.typeview;
              //     if (debug) console.log('976 reltype', reltype);
              //     const jsnRelshipType = new jsn.jsnRelationshipType(reltype);
              //     if (debug) console.log('979 Generate Relationship Type', reltype,jsnRelshipType);
              //     const modifiedTypeLinks = new Array();
              //     modifiedTypeLinks.push(jsnRelshipType);
              //     modifiedTypeLinks.map(mn => {
              //       let data = (mn) && mn;
              //       data = JSON.parse(JSON.stringify(data));
              //       myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
              //     });
              //     const jsnRelTypeview = new jsn.jsnRelshipTypeView(reltypeview);
              //     if (debug) console.log('987 Generate Relationship Type', jsnRelTypeview);
              //     const modifiedTypeViews = new Array();
              //     modifiedTypeViews.push(jsnRelTypeview);
              //     modifiedTypeViews?.map(mn => {
              //       let data = (mn) && mn;
              //       data = JSON.parse(JSON.stringify(data));
              //       myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES', data })
              //     })
              //     if (debug) console.log('994 myMetis', myMetis);
              //   }
              // }
            },
            function (o: any) {
              const rel = o.part.data.relship;
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
              const relship = myMetis.findRelationship(link.relship.id)
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
              const relship = myMetis.findRelationship(link.relship.id)
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
              if (debug) console.log('984 link', link);
              const currentRelship = myMetis.findRelationship(link.relship.id)
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
              });
              uid.clearPath(selectedLinks, myMetis, myDiagram);
            },
            function (obj: any) {
              const link = obj.part.data;
              if (link.points)
                return true;
              else
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
              const jsnObj = new jsn.jsnObject(object);
              if (debug) console.log('1964 p, jsnObj', p, jsnObj);
              const modifiedObjects = new Array();
              modifiedObjects.push(jsnObj);
              modifiedObjects.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                e.diagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
              });
              if (debug) console.log('1966 myMetis, myDiagram', myMetis, myDiagram);
              uit.changePortName(port, portname, myDiagram);
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
              if (p) p.color = portcolor;
              const jsnObj = new jsn.jsnObject(object);
              if (debug) console.log('1964 p, jsnObj', p, jsnObj);
              const modifiedObjects = new Array();
              modifiedObjects.push(jsnObj);
              modifiedObjects.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                e.diagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
              });
              if (debug) console.log('1966 myMetis, myDiagram', myMetis, myDiagram);
              uit.changePortColor(port, portcolor, myDiagram);
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
              if (debug) console.log('1969 jsnObj', jsnObj);
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
      myDiagram.contextMenu =
        $(go.Adornment, "Vertical",
          makeButton("Paste",
            function (e: any, obj: any) {
              if (debug) console.log('1862 myMetis', myMetis);
              myMetis.pasteViewsOnly = false;
              const mySelection = [];
              e.diagram.selection.each(function (sel) {
                mySelection.push(sel.data);
              });
              myMetis.currentSelection = mySelection;
              if (debug) console.log('1869 mySelection', mySelection);
              const point = e.diagram.toolManager.contextMenuTool.mouseDownPoint;
              e.diagram.commandHandler.pasteSelection(point);
            },
            function (o: any) {
              return o.diagram.commandHandler.canPasteSelection();
            }),
          makeButton("Paste View",
            function (e: any, obj: any) {
              if (debug) console.log('1878 myMetis', myMetis);
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
              if (debug) console.log('935 myMetis', myMetis);
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
              if (debug) console.log('819 Diagram', myMetis);

              const modelName = prompt("Enter Target Model name:", "");
              if (modelName == null || modelName === "") {
                alert("New operation was cancelled");
              } else {
                model = new akm.cxModel(utils.createGuid(), modelName, metamodel, "");
                if (debug) console.log('824 Diagram', metamodel, model);
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
                  if (debug) console.log('593 Diagram', data);
                  data = JSON.parse(JSON.stringify(data));
                  e.diagram.dispatch({ type: 'LOAD_TOSTORE_NEWMODELVIEW', data });
                }
              }
            },
            function (o: any) {
              return false;
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
              if (debug) console.log('2194', mmNameIds, modalContext);
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
                if (debug) console.log('myMetis.allowGenerateCurrentMetamodel', myMetis.allowGenerateCurrentMetamodel);
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
                if (debug) console.log('1906 model', data);
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
                  if (debug) console.log('1942 modelview', data);
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
                      if (debug) console.log('2118 obj', obj);
                      if (!obj || obj.type?.id !== modelviewType.id)
                        continue;
                      if (obj['modelviewId'] === currentModelview.id) {
                        if (debug) console.log('2122 currentModelview, modelviewObj', currentModelview, obj);
                        if (obj) {
                          const objview = obj.objectviews[0];
                          const node = new gjs.goObjectNode(objview.id, myGoModel, objview);
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
              if (debug) console.log('2288 results', value, results);
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
              // const links = 
              uic.unhideHiddenRelationshipViews(modelview, myMetis);
              // for (let i = 0; i < links.length; i++) {
              //   const link = links[i];
              //   myDiagram.model.addLinkData(link);
              // }
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
                    if (debug) console.log('2345 objview', objview);
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
                if (debug) console.log('1455 myMetis', myMetis);
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
            if (debug) console.log('3020 layoutList', llist);
            const layoutLabels = llist.map(ll => (ll) && ll.label);
            if (debug) console.log('3076', layoutLabels, llist);
            const modalContext = {
              what: "selectDropdown",
              title: "Set Layout Scheme",
              case: "Set Layout Scheme",
              layoutList: layoutList(),
              myDiagram: myDiagram
            }
            myMetis.myDiagram = myDiagram;
            myDiagram.handleOpenModal(myDiagram, modalContext);
            if (debug) console.log('3087 myMetis', myMetis);
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
              if (debug) console.log('3143 routingList', rlist);
              const routingLabels = rlist.map(rl => (rl) && rl.label);
              if (debug) console.log('3145', routingLabels, rlist);
              const modalContext = {
                what: "selectDropdown",
                title: "Set Routing Scheme",
                case: "Set Routing Scheme",
                routingList: routingList(),
                myDiagram: myDiagram
              }
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(myDiagram, modalContext);
              if (debug) console.log('3155 myMetis', myMetis);
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
              if (debug) console.log('3171 curveList', clist);
              const curveLabels = clist.map(cl => (cl) && cl.label);
              if (debug) console.log('3173', curveLabels, clist);
              const modalContext = {
                what: "selectDropdown",
                title: "Set Link Curve",
                case: "Set Link Curve",
                curveList: curveList(),
                myDiagram: myDiagram
              }
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(myDiagram, modalContext);
              if (debug) console.log('3183 myMetis', myMetis);
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
                if (debug) console.log('2402 myMetis', myMetis);
                uic.purgeModelDeletions(myMetis, myDiagram);
                if (debug) console.log('2404 myMetis', myMetis);
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
                scale: 1,
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
                const goNode = myMetis.gojsModel.findNodeByViewId(objview.id);
                if (goNode) {
                  for (let it = myDiagram.nodes; it?.next();) {
                    const n = it.value;
                    const data = n.data;
                    if (data.key === objview.id) {
                      // if (debug) 
                      console.log('300 ', objview.name, '\n objview: ', objview, "\n goNode: ", goNode, "\n n, data: ", n, data);
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
                      // if (debug) 
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
              if (debug) console.log('3234 showCardinality', modelview.showCardinality)
              const jsnModelview = new jsn.jsnModelView(modelview);
              if (debug) console.log('3236 jsnModelview', jsnModelview);
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
              if (debug) console.log('2612 showRelshipNames', modelview.showRelshipNames)
              const jsnModelview = new jsn.jsnModelView(modelview);
              if (debug) console.log('2614 jsnModelview', jsnModelview);
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
              if (debug) console.log('3236 jsnModelview', jsnModelview);
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
                scale: 1,
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
          makeButton("Verify and Repair Metamodels",
            function (e: any, obj: any) {
              uic.verifyAndRepairMetamodels(myMetis, myDiagram);
              alert("The metamodels have been repaired");
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
              if (debug) console.log('2767 myMetis', myMetis);
              const myMetamodel = myMetis.currentMetamodel;
              uic.clearRelationshipTypeViews(myMetamodel, myDiagram, myMetis);
              if (debug) console.log('2777 myMetis', myMetis);
              alert("The relshiptypeviews has been cleared");
            },
            function (o: any) {
              if (myMetis.modelType === 'Metamodelling')
                return true;
              return false;
            }),
        )
    }

    // Define invisible layer 'AdminLayer'
    const forelayer = myDiagram.findLayer("Foreground");
    myDiagram.addLayerBefore($(go.Layer, { name: "AdminLayer" }), forelayer);
    const layer = myDiagram.findLayer('AdminLayer');
    layer.visible = false;

    // Define template maps
    {
      // Define link template map
      var linkTemplateMap = new go.Map<string, go.Link>();
      uit.addLinkTemplates(linkTemplateMap, linkContextMenu, myMetis);

      // This template shows links connecting with label nodes as green and arrow-less.
      if (linkToLink) {
        myDiagram.linkTemplateMap.add("linkToLink",
          $("Link",
            { relinkableFrom: false, relinkableTo: false },
            $("Shape", { stroke: "#2D9945", strokeWidth: 2 })
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
        "arrowscale": l.data.arrowscale,
        "arrowscale": l.data.arrowscale,
        "arrowscale": l.data.arrowscale,
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
    if (debug) console.log('2866 selObj: ', selObj);
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
      for (let i = 0; i < namelist.length; i++) {
        let name = namelist[i];

        const proptab = { tabName: name };
        selpropgroup.push(proptab);
      }
    }

    if (debug) console.log('3720 myNewMetis', myMetis);
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
          if (debug) console.log('2923 modalContext', this.state.modalContext);
          const choices = this.state.modalContext.args.typeNames;
          let img;
          options = choices.map(tpname => {
            img = './../images/default.png';
            return { value: tpname, label: tpname }
          })
          comps = { Option: CustomSelectOption, SingleValue: CustomSelectValue }
        }
        // else if (modalContext?.title === 'Select Submodel to Add') {
        //   if (debug) console.log('2923 modalContext', this.state.modalContext);
        //   const choices = modalContext.context.args.modelnames;
        //   options = choices.map(modelname => {
        //     return { value: modelname, label: modelname }
        //   })
        //   comps = { Option: CustomSelectOption, SingleValue: CustomSelectValue }
        // }
        else {
          options = this.state.selectedData.map(o => o && { 'label': o, 'value': o });
          comps = null
        }
        if (debug) console.log('2563 options', options);
        const { selectedOption } = this.state;

        const value = (selectedOption) ? selectedOption.value : options[0]

        if (debug) console.log('2568 Diagram ', selectedOption, this.state.selectedOption, value);
        header = modalContext.title;
        modalContent =
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
        if (debug) console.log('3994 category ', category);
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
      const tabName = pg?.tabName;
      if (debug) console.log('2646', index, tabName, pg)
      if (pg) {
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

    if (debug) console.log('4027', this.props.nodeDataArray, this.state.nodeDataArray, this.state.linkDataArray, this.state.modelData);

    return (
      <div>
        <ReactDiagram
          ref={this.diagramRef}
          divClassName='diagram-component'
          initDiagram={this.initDiagram}
          nodeDataArray={this.state.nodeDataArray}
          linkDataArray={this.state.linkDataArray}
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
