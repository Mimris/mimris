// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;
const linkToLink = false;

import * as go from 'gojs';

<script src="../release/go-debug.js"></script>

import { produce } from 'immer';
import { ReactDiagram } from 'gojs-react';
import * as React from 'react';
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
import { FaTemperatureLow, FaTumblrSquare } from 'react-icons/fa';
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

const AllowTopLevel = true;

interface DiagramProps {
  nodeDataArray:      Array<go.ObjectData>;
  linkDataArray:      Array<go.ObjectData>;
  modelData:          go.ObjectData;
  modelType:          string;
  myMetis:            akm.cxMetis;
  dispatch:           any;  
  skipsDiagramUpdate: boolean;
  onDiagramEvent:     (e: go.DiagramEvent) => void;
  onModelChange:      (e: go.IncrementalData) => void;
}

interface DiagramState {
  myMetis: akm.cxMetis,
  showModal: boolean;
  selectedData: any;
  modalContext: any;
  selectedOption: any;
  currentActiveTab: any;
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
      myMetis: props.myMetis,
      showModal: false,
      selectedData: null, 
      modalContext: null,
      selectedOption: null,
      currentActiveTab: null
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
      diagram.addDiagramListener('BackgroundSingleClicked', this.props.onDiagramEvent);
      diagram.addDiagramListener('BackgroundDoubleClicked', this.props.onDiagramEvent);

      diagram.addModelChangedListener(this.props.onModelChange);
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
      diagram.removeDiagramListener('LinkRelinked', this.props.onDiagramEvent);
      diagram.removeDiagramListener('LinkReshaped', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionDeleted', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ClipboardChanged', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ClipboardPasted', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ObjectSingleClicked', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ObjectDoubleClicked', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ObjectContextClicked', this.props.onDiagramEvent);      
      diagram.removeDiagramListener('PartResized', this.props.onDiagramEvent);
      diagram.removeDiagramListener('BackgroundDoubleClicked', this.props.onDiagramEvent);
      diagram.removeDiagramListener('BackgroundSingleClicked', this.props.onDiagramEvent);

      diagram.removeChangedListener(this.props.onModelChange);
    }
  }

  public handleOpenModal(node, modalContext) {
    this.setState({ 
      selectedData: node,
      modalContext: modalContext,
      selectedOption: null,
      showModal: true,
      currentActiveTab: '0'
    });
    if (debug) console.log('181 this.state', this.state);
  } 

  public handleSelectDropdownChange = (selected) => {
    if (debug) console.log('185 this.state', this);
    const myMetis = this.myMetis;
    const context = {
      "myMetis":      myMetis,
      "myMetamodel":  myMetis.currentMetamodel,
      "myModel":      myMetis.currentModel,
      "myModelview":  myMetis.currentModelview,
      "myGoModel":    myMetis.gojsModel,
      "myDiagram":    myMetis.myDiagram,
      "modalContext": this.state.modalContext
    }
    if (debug) console.log('196 selected, context', selected, context);
    // Handle the links
    uim.handleSelectDropdownChange(selected, context);
    // Handle the relationships
    if (debug) console.log('203 selected', selected);
  }

  public handleCloseModal(e) {
    const modalContext = this.state.modalContext;
    if (debug) console.log('218 modalContext:', modalContext);
    const myDiagram = modalContext.myDiagram;
    const data = modalContext.data;
    if (debug) console.log('221 state', data);
    if (e === 'x') {
      if (debug) console.log('223 x:', e);
      const links = modalContext.links;
      for (let i=0; i<links?.length; i++) {
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
    if (debug) console.log('215 Diagram: props, value, isBlur: ', props, value, isBlur);
    const propname = props.id;
    const fieldType = props.type;
    const obj = props.obj;
    const context = props.context;
    const pattern = props.pattern;
    if (debug) console.log('221 propname, value, obj, context, isBlur:', propname, value, obj, context, isBlur);
    if (debug) console.log('222 this.state', this.state);
    if (debug) console.log('223 obj', obj);
    this.setState(
      produce((draft: AppState) => {
        let data = draft.selectedData as any;  // only reached if selectedData isn't null
        if (debug) console.log('227 data', data, this);
        // if (data[propname] = 'icon' && value.includes("fakepath")) {
        //   data[propname] = context.files[0];
        // } else {
          data[propname] = value;
        // }
        if (debug) console.log('233 data, value, isBlur: ', data[propname], value, isBlur);
        if (isBlur) {
          const key = data.key;
          if (debug) console.log('236 key', key);
          if (obj.category === constants.gojs.C_OBJECT) {
            const idx = this.mapNodeKeyIdx.get(key);
            if (idx !== undefined) {
              draft.nodeDataArray[idx] = data;
              draft.skipsDiagramUpdate = false;
            }
          }
          if (obj.category === constants.gojs.C_RELATIONSHIP) {  
            const idx = this.mapLinkKeyIdx.get(key);
            if (idx !== undefined) {
              draft.linkDataArray[idx] = data;
              draft.skipsDiagramUpdate = false;
            }
          } 
          if (obj.category === constants.gojs.C_OBJECTTYPE) {
            const idx = this.mapNodeKeyIdx.get(key);
            if (idx !== undefined) {
              draft.nodeDataArray[idx] = data;
              draft.skipsDiagramUpdate = false;
            }
          }
          if (obj.category === constants.gojs.C_RELSHIPTYPE) {  
            const idx = this.mapLinkKeyIdx.get(key);
            if (idx !== undefined) {
              draft.linkDataArray[idx] = data;
              draft.skipsDiagramUpdate = false;
            }
          } 
        }
      })
    );
    if (debug) console.log('268 obj, context', obj, context);
    if (debug) console.log('269 Diagram: props, propname, value, isBlur:', props, propname, value, isBlur);

    uim.handleInputChange(this.myMetis, props, value);
  }

  /**
   * Diagram initialization method, which is passed to the ReactDiagram component.
   * This method is responsible for making the diagram and initializing the model, any templates,
   * and maybe doing other initialization tasks like customizing tools.
   * The model's data should not be set here, as the ReactDiagram component handles that.
   */

  private initDiagram(): go.Diagram {
    go.Diagram.licenseKey = "73f944e5b16131b700ca0d2b113f69ee1bb37b609e861ea35e5141a3ef5f68402bc9ec7e03d48f95d4ff4ffd1d74c6db8ec66d7cc34d0639e039da8c16e782aee13773b1150b42ddf40a71c18bea2cf5ac7071f295e023abd87e8dfae2a1c79d55bcf7d44cc80eb92e7d0463057cab4fe4a9da2cfe57c44c797d9ef2aaefaf1baa6d65949de5548bf0516edd";
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
      myMetis.pasteViewsOnly  = false;
    }
    {
      myDiagram =
        $(go.Diagram,
          {
            initialContentAlignment: go.Spot.Center,       // center the content
            initialAutoScale: go.Diagram.Uniform,
            "contextMenuTool.standardMouseSelect": function() {
              this.diagram.lastInput.shift = true;
              go.ContextMenuTool.prototype.standardMouseSelect.call(this);
            },
            "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
            "scrollMode": go.Diagram.InfiniteScroll,
            // "initialAutoScale": go.Diagram.UniformToFill,
            // "undoManager.isEnabled": true,  // must be set to allow for model change listening
            // "undoManager.maxHistoryLength": 100,  // uncomment disable undo/redo functionality

            "LinkDrawn": maybeChangeLinkCategory,     // these two DiagramEvents call a
            "LinkRelinked": maybeChangeLinkCategory,  // function that is defined below

            // draggingTool: new GuidedDraggingTool(),  // defined in GuidedDraggingTool.ts
            // 'draggingTool.horizontalGuidelineColor': 'blue',
            // 'draggingTool.verticalGuidelineColor': 'blue',
            // 'draggingTool.centerGuidelineColor': 'green',
            // 'draggingTool.guidelineWidth': 1,
            // "draggingTool.dragsLink": true,
            "draggingTool.isGridSnapEnabled": true,
            "linkingTool.portGravity": 0,  // no snapping while drawing new links
            "linkingTool.archetypeLinkData": {
              "key": utils.createGuid(),
              "category":    "Relationship",
              "type":        constants.types.AKM_GENERIC_REL,
              "name":        "",
              "description": "",
              "relshipkind": constants.relkinds.REL,
            },                
            // "clickCreatingTool.archetypeNodeData": {
            //   "key": utils.createGuid(),
            //   "category": "Object",
            //   "name": "Generic",
            //   "description": "",
            //   "fillcolor": "grey",
            //   "strokecolor": "black",
            //   "strokewidth": "6",
            //   "icon": "default.png"
            // },
            // // allow Ctrl-G to call groupSelection()
            // "commandHandler.archetypeGroupData": {
            //   text: "Group",
            //   isGroup: true,
            //   color: "blue"
            // },
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
                linkLabelKeysProperty: "labelKeys", 
                linkKeyProperty: 'key'
              })
          }
        );
    }
    // when the user clicks on the background of the Diagram, remove all highlighting
    myDiagram.click = function(e) {
      e.diagram.commit(function(d) { d.clearHighlighteds(); }, "no highlighteds");
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
            font: "bold arial 72px sans-serif" // Seems not supported
          }
        ),
        // use a converter to display information about the diagram model
      );
    myDiagram.grid.visible = true;
    myDiagram.toolManager.draggingTool.isGridSnapEnabled = true;
    myDiagram.toolManager.resizingTool.isGridSnapEnabled = true; 
    myMetis.myDiagram = myDiagram;
    if (myMetis.currentModelview?.name === constants.admin.AKM_ADMIN_MODELVIEW) {
      setLayout(myDiagram, myMetis.currentModelview?.layout);
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
            let selection = e.diagram.selection
            if (debug) console.log('420 selection', selection);
            const myFromNodes  = [];
            for (let it = selection.iterator; it?.next();) {
                let n = it.value;
                if (!(n instanceof go.Node)) continue;
                if (n) {
                  if (debug) console.log('425 n.data', n.data);
                  addFromNode(myFromNodes, n);
                }
            }
            if (debug) console.log('430 myFromNodes', myFromNodes);
            const myModel = myMetis.currentModel;
            myModel.args1 = myFromNodes;
            const jsnModel = new jsn.jsnModel(myModel, true);
            const modifiedModels = new Array();
            modifiedModels.push(jsnModel);
            modifiedModels.map(mn => {
              let data = mn;
              data = JSON.parse(JSON.stringify(data));
              e.diagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
            })

            selection = [];
            e.diagram.selection.each(function(sel) {
              const key = sel.data.key;
              sel.data.fromNode = getFromNode(myFromNodes, key);
              if (debug) console.log('457 sel.data', sel.data);
              selection.push(sel.data);
            });
            myMetis.currentSelection = selection;
            if (debug) console.log('438 myMetis', myMetis);
            e.diagram.commandHandler.copySelection(); 
          },
          function (o: any) { 
            const node = o.part.data;
            if (node.category === constants.gojs.C_OBJECT) 
              return o.diagram.commandHandler.canCopySelection(); 
            }),
          makeButton("Paste",
            function (e: any, obj: any) {
              if (debug) console.log('473 myMetis', myMetis);
              const currentModel = myMetis.currentModel;
              myMetis.pasteViewsOnly = false;
              const point = e.diagram.toolManager.contextMenuTool.mouseDownPoint;
              e.diagram.commandHandler.pasteSelection(point);
            },
            function (o: any) {
              return o.diagram.commandHandler.canPasteSelection(); 
            }),
          makeButton("Paste View",
            function (e: any, obj: any) {
              if (debug) console.log('484 myMetis', myMetis);
              const currentModel = myMetis.currentModel;
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
                  const choices: string[]  = [];
                  choices.push('description');
                  if (objtype.name === 'ViewFormat')
                    choices.push('viewFormat');
                  if (objtype.name === 'InputPattern')
                    choices.push('inputPattern');
                  const props = objtype.properties;
                  for (let i=0; i<props?.length; i++) {
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
                  if (props && props.length>0) {
                    return true;
                  }
                }
              }
              return false; 
            }),
          makeButton("Edit Object",
            function (e: any, obj: any) { 
              const node = obj.part.data;
              if (debug) console.log('529 node', node);
              uid.editObject(node, myMetis, myDiagram); 
            },
            function (o: any) { 
              const node = o.part.data;
              if (debug) console.log('570 node', node);
              if (node.category === constants.gojs.C_OBJECT) {
                return true;
              }
              return false; 
            }),
          makeButton("Edit Objectview",
            function (e: any, obj: any) { 
              const node = obj.part.data;
              if (debug) console.log('542 node', node);
              uid.editObjectview(node, myMetis, myDiagram); 
            }, 
            function (o: any) { 
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                return true;
              }
              return false; 
            }),
          makeButton("Connect to Selected",
            function (e: any, obj: any) { 
              const node = obj.part.data;
              let fromType = node.objecttype;
              fromType = myMetis.findObjectType(fromType.id);
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
                fromType:   fromType,
                nodeFrom:   node,
                nodesTo:    nodes,
                typeNames:  choices,
              }
              const modalContext = {
                  what:       "selectDropdown",
                  title:      "Select Relationship Type",
                  case:       "Connect to Selected",          
                  myDiagram:  myDiagram,
                  args:       args
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
                if (selection.count > 1)
                  return true;
                return false;
              }
              return false; 
            }),
          makeButton("Add Connected Objects",
            function (e: any, obj: any) { 
              const node = obj.part.data;
              uid.addConnectedObjects(node, myMetis, myDiagram);
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
              const node = e.diagram.selection.first().data;
              const ilist = iconList()
              const iconLabels = ilist.map(il => (il) && il.label)
              if (debug) console.log('719', iconLabels, ilist );
              const modalContext = {
                what: "selectDropdown",
                title: "Select Icon",
                case: "Change Icon",
                iconList : iconList(),
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
              // } else if (node.category === constants.gojs.C_OBJECTTYPE) {
              //     return true;
              } else {
                return false;
              }
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
                if (patt.length>0) {
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
                  "myMetis":    myMetis,
                  "reltype":    "hasPart",
                  "reldir":     "out",
                  "objtype":    null,
                  "propname":   "Cost"
                }
                let result = eval('context.reldir === "out"');
                alert(result);
              }
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
              }
              return o.diagram.commandHandler.canCutSelection(); 
            }),
          makeButton("Delete",
            function (e: any, obj: any) {
              if (confirm('Do you really want to delete the current selection?')) {
                const myGoModel = myMetis.gojsModel;
                const currentModel = myMetis.currentModel;
                myMetis.deleteViewsOnly = false;
                myDiagram.selection.each(function(sel) {
                  const inst = sel.data;
                  if (inst.category === constants.gojs.C_OBJECT) {
                    let node = myGoModel.findNode(inst.key);
                    if (debug) console.log('1375 node', node);
                    if (node?.isGroup) {
                      const groupMembers = node.getGroupMembers(myGoModel);
                      for (let i=0; i<groupMembers?.length; i++) {
                        const member = groupMembers[i];
                        const n = myDiagram.findNodeForKey(member?.key);
                      }                    
                    }
                    const n = myDiagram.findNodeForKey(node?.key);
                    if (n)
                      n.findLinksConnected().each(function(l) {
                         l.isSelected = true;
                      });                    
                  }
                  if (inst.category === constants.gojs.C_OBJECTTYPE) {
                    const node = myDiagram.findNodeForKey(inst.key);
                    node.findLinksConnected().each(function(l) { 
                      l.isSelected = true; 
                    });                    
                  }
                })
                e.diagram.commandHandler.deleteSelection();      
              }         
            },
            function (o: any) { 
              return o.diagram.commandHandler.canDeleteSelection(); 
            }),
          makeButton("Delete View",
            function (e: any, obj: any) {
              if (confirm('Do you really want to delete the current selection?')) {
                const myModel = myMetis.currentModel;
                myMetis.deleteViewsOnly = true;
                const jsnModel = new jsn.jsnModel(myModel, true);
                const modifiedModels = new Array();
                modifiedModels.push(jsnModel);
                modifiedModels.map(mn => {
                  let data = mn;
                  data = JSON.parse(JSON.stringify(data));
                  e.diagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
                })
                if (debug) console.log('603 Delete View', jsnModel, myMetis);
                e.diagram.commandHandler.deleteSelection();
              }
            },
            function (o: any) { 
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                return o.diagram.commandHandler.canDeleteSelection();
              } else {
                return false;
              }
            }),  
          makeButton("----------"),
          makeButton("Export Task Model",
          function (e: any, obj: any) {
            const node = e.diagram.selection.first().data;
            uid.exportTaskModel(node, myMetis, myDiagram);

          },
          function (o: any) { 
            if (debug) console.log('1991 myMetis', myMetis);
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
          makeButton("Generate Metamodel",
          function (e: any, obj: any) { 
            if (debug) console.log('1958 obj, myMetis, myDiagram', obj, myMetis, myDiagram);
            const node = e.diagram.selection.first().data;
            myMetis.currentNode = node;
            gen.generateTargetMetamodel(obj, myMetis, myDiagram);
          },
          function (o: any) { 
            if (debug) console.log('1991 myMetis', myMetis);
            if (myMetis.modelType == 'Modelling') {
              const obj = o.part.data.object;
              const objtype = obj?.type;
              if (objtype?.name === constants.types.AKM_CONTAINER)
                  return true;              
            } else 
              return false;
            return true; 
            }),
          makeButton("Generate Datatype",
            function(e: any, obj: any) { 
                const context = {
                  "myMetis":            myMetis,
                  "myMetamodel":        myMetis.currentMetamodel,
                  "myTargetMetamodel":  myMetis.currentTargetMetamodel,
                  "myModel":            myMetis.currentModel,
                  "myModelview":        myMetis.currentModelview,
                  "myDiagram":          e.diagram,
                  "dispatch":           e.diagram.dispatch
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
            function(o: any) { 
              const obj = o.part.data.object;
              const objtype = obj?.type;
              if (objtype?.name === constants.types.AKM_DATATYPE)
                  return true;              
              return false;
            }),
          makeButton("Edit Object Type",
            function (e: any, obj: any) { 
              const node = obj.part.data;
              const icon = uit.findImage(node.icon);
              const modalContext = {
                what:       "editObjectType",
                title:      "Edit Object Type",
                icon:       icon,
                myDiagram:  myDiagram
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
              const node = e.diagram.selection.first().data;
              const currentType = node.objecttype;
              if (debug) console.log('273 node', node);
              const myMetamodel = myMetis.currentMetamodel;
              const objtypes = myMetamodel.getObjectTypes();
              if (debug) console.log('275 Set object type', objtypes);
              let defText  = "";
              if (objtypes) {
                node.choices = [];
                node.choices.push('Generic');
                for (let i=0; i<objtypes.length; i++) {
                  const otype = objtypes[i];
                  if (!otype.markedAsDeleted && !otype.abstract) {
                    if (otype.name === 'Generic')
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
                } else {
                  return false;
                }
            }),
          makeButton("Edit Typeview",
          function (e: any, obj: any) { 
            const node = obj.part.data;
            uid.editTypeview(node, myMetis, myDiagram); 
          }, 
          function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT)
                return true;
              else if (node.category === constants.gojs.C_OBJECTTYPE)
                return true;
              else 
                return false;
            }),
          makeButton("Reset to Typeview",
            function (e: any, obj: any) { 

              const myGoModel = myMetis.gojsModel;
              myDiagram.selection.each(function(sel) {
                const inst = sel.data;
                if (inst.category === constants.gojs.C_OBJECT) {
                  let node = myGoModel.findNode(inst.key);
                  uid.resetToTypeview(node, myMetis, myDiagram); 
                }
              })
            }, 
            function (o: any) {
                const node = o.part.data;
                if (node.category === constants.gojs.C_OBJECT)
                  return true;
            }),
            makeButton("Change Icon",
            function (e: any, obj: any) {
              const node = e.diagram.selection.first().data;
              if (debug) console.log('1503 node', node);
              const ilist = iconList()
              const iconLabels = ilist.map(il => (il) && il.label)
              const modalContext = {
                what: "selectDropdown",
                title: "Select Icon",
                case: "Change Icon",
                iconList : iconList(),
                myDiagram: myDiagram
              } 
              myMetis.currentNode = node;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(node, modalContext);
              if (debug) console.log('511 myMetis', myMetis);
          },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECTTYPE) {
                return true;
              } else {
                return false;
              }
            }),
          makeButton("----------"),
          makeButton("Generate Target Object Type",
          function(e: any, obj: any) { 
              const context = {
                "myMetis":            myMetis,
                "myMetamodel":        myMetis.currentMetamodel,
                "myTargetMetamodel":  myMetis.currentTargetMetamodel,
                "myModel":            myMetis.currentModel,
                "myCurrentModelview": myMetis.currentModelview,
                "myDiagram":          e.diagram,
                "dispatch":           e.diagram.dispatch
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
          function(o: any) { 
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
              const node = obj.part.data;
              if (debug) console.log('1400 node', node);
              const currentObject = myMetis.findObject(node.object?.id)
              const currentType = currentObject?.type;
              const myModel = myMetis.currentModel;
              const myGoModel = myMetis.gojsModel;
              const objects = myModel.getObjectsByType(currentType, false);
              for (let i=0; i<objects.length; i++) {
                const o = objects[i];
                if (o) {
                  const oviews = o.objectviews;
                  if (oviews) {
                    for (let j=0; j<oviews.length; j++) {
                      const ov = oviews[j];
                      if (ov) {
                        const node = myGoModel.findNodeByViewId(ov?.id);
                        const gjsNode = myDiagram.findNodeForKey(node?.key);
                        if (gjsNode) gjsNode.isSelected = true;
                      }
                    }
                  }
                }
              }
            },
            function (o: any) { 
              return true;
            }),
          makeButton("Select connected objects",
            function (e: any, obj: any) {
              const node = obj.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                let object = node.object;
                if (!object) return;
                object = myMetis.findObject(object.id);
                const objects = new Array();
                objects.push(object);
                const relships = new Array();
                const method = new akm.cxMethod(utils.createGuid(), 'selectConnected', "");
                method["reltype"] = '';
                method['reldir']  = '';
                method["typecondition"] = null;
                method["valuecondition"] = null;
                method["preaction"] = "";
                method["postaction"] = "Select";
                method["propname"] = "";
                const args = {
                  "method":     method     
                }
                const context = {
                  "myMetis":    myMetis,
                  "myModel":    myMetis.currentModel,
                  "myDiagram":  myDiagram,
                  "myObject":   object,
                  "args":       args,
                  "objects":    objects,
                  "relships":   relships,
                }
                method["reldir"] = "in";
                ui_mtd.executeMethod(context);
                method["reldir"] = 'out';
                ui_mtd.executeMethod(context);
              }
            },
            function (o: any) { 
              return true;
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
                method["reltype"] = 'hasPart';
                method["typecondition"] = null;
                method["valuecondition"] = null;
                method["preaction"] = "generateosduId";
                method["propname"] = "osduId";
                const args = {
                  "method":     method     
                }
                const context = {
                  "myMetis":    myMetis,
                  "myModel":    myMetis.currentModel,
                  "myDiagram":  myDiagram,
                  "myObject":   object,
                  "args":       args
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
                let object = node.object;
                if (!object) return;
                object = myMetis.findObject(object.id);
                const objects = new Array();
                objects.push(object);
                const args = {
                  "method":             ""
                }
                const context = {
                    "myMetis":            myMetis,
                    "myMetamodel":        myMetis.currentMetamodel,
                    "myObject":           object,
                    "objects":            objects,
                    "myDiagram":          myDiagram,
                    "case":               "Execute Method",
                    "title":              "Select Method",
                    "dispatch":           myDiagram.dispatch,
                    "postOperation":      ui_mtd.executeMethod,
                    "args":               args
                }
                 ui_mtd.askForMethod(context);
              }
            },
            function (obj: any) {               
              const node = obj.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                let object = node.object;
                const methods = object?.type?.methods;
                if (methods?.length>0) {
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
              const node = myGoModel.findNode(data.key);
              const myScale = node.getMyScale(myGoModel);
              const msg = 'My Scale is: ' + myScale;
              alert(msg);
              // myDiagram.model?.setDataProperty(node, "scale", myScale);
            }, 
            function (o: any) {
                const node = o.part.data;
                // if (node.category === constants.gojs.C_OBJECT)
                //   return true;
                return false;
            }),
  
            // makeButton("Group",
          //   function (e: any, obj: any) { e.diagram.commandHandler.groupSelection(); },
          //   function (o: any) { 
          //     return false;
          //     return o.diagram.commandHandler.canGroupSelection(); 
          //   }),
          // makeButton("Ungroup",
          //   function (e: any, obj: any) { e.diagram.commandHandler.ungroupSelection(); },
          //   function (o: any) { 
          //     return false;
          //     return o.diagram.commandHandler.canUngroupSelection(); 
          //   })
        );
    }

    // A CONTEXT MENU for links    
    {
      var linkContextMenu =
        $(go.Adornment, "Vertical",
          makeButton("Edit Relationship",
            function (e: any, obj: any) { 
              const link = obj.part.data;
              const modalContext = {
                what: "editRelationship",
                title: "Edit Relationship",
                myDiagram: myDiagram
              }
              myMetis.currentLink = link;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(link, modalContext);
              // 
            },
            function (o: any) { 
              const node = o.part.data;
              if (debug) console.log('1265 node', node);
              if (node.category === constants.gojs.C_RELATIONSHIP) {
                return true;
              }
              return false; 
            }),
          makeButton("Edit Relationship View",
            function (e: any, obj: any) { 
              const link = obj.part.data;
              const modalContext = {
                what: "editRelshipview",
                title: "Edit Relationship View",
                myDiagram: myDiagram
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
              const link = o.part.data;
              if (link.category === constants.gojs.C_RELATIONSHIP) {
                return o.diagram.commandHandler.canDeleteSelection(); 
              } else {
                return false;
              }
            }),
          makeButton("----------"),
          makeButton("TEST",
            function (e: any, obj: any) { 
              const myDiagram = e.diagram;
              const link = obj.part;
              console.log('1157 link', link);
              let data = link.data;
              console.log('1159 data', data);
            },
            function (o: any) { 
              if (debug)
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
                  const reltype  = currentRelship.type as akm.cxRelationshipType;
                  let typeview = currentRelshipView.typeview as akm.cxRelationshipTypeView;
                  const defaultTypeview = reltype.typeview as akm.cxRelationshipTypeView;;
                  if (debug) console.log('701 link', reltype, defaultTypeview, typeview);
                  if (!typeview || (typeview.id === defaultTypeview.id)) {
                      const id = utils.createGuid();
                      typeview = new akm.cxRelationshipTypeView(id, id, reltype, "");
                      typeview.data = defaultTypeview.data;
                      typeview.data.strokecolor = "red";
                      typeview.nameId = undefined;
                      typeview.modified = true;
                      currentRelshipView.typeview = typeview;
                      const viewdata = typeview.data;
                      console.log('796 viewdata', typeview.data);
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
                    const reltype  = currentRelship.type;
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
                what:       "editRelationshipType",
                title:      "Edit Relationship Type",
                myDiagram:  myDiagram
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
              const includeInheritedReltypes = myModelview.includeInheritedReltypes;
              const link = obj.part.data;
              if (debug) console.log('1440 link', link, myDiagram, myGoModel);
              let fromNode = myGoModel?.findNode(link.from);
              let toNode   = myGoModel?.findNode(link.to);
              if (debug) console.log('1443 from and toNode', fromNode, toNode);
              let fromType = fromNode?.objecttype;
              let toType   = toNode?.objecttype;
              fromType = myMetis.findObjectType(fromType?.id);
              toType   = myMetis.findObjectType(toType?.id);
              const appliesToLabel = fromType.name === 'Label' || toType.name === 'Label';
              if (debug) console.log('1449 link', fromType, toType);
              const myMetamodel = myMetis.currentMetamodel;
              const reltypes = myMetamodel.findRelationshipTypesBetweenTypes(fromType, toType, includeInheritedReltypes);
              let   defText  = "";
              link.choices = [];
              // if (!appliesToLabel)
              //   link.choices.push(constants.types.AKM_GENERIC_REL);
              if (debug) console.log('1456 reltypes, fromType, toType', reltypes, fromType, toType);
              if (reltypes) {
                  for (let i=0; i<reltypes.length; i++) {
                      const rtype = reltypes[i];
                      if (rtype.name === constants.types.AKM_GENERIC_REL)
                          continue;
                      link.choices.push(rtype.name);  
                  }
                  let uniqueSet = utils.removeArrayDuplicates(link.choices);
                  link.choices = uniqueSet;
              }
              const args = {
                typeNames:  link.choices,
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
              if (debug) console.log('1478 myMetis', myMetis);
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
              const modalContext = {
                what: "editTypeview",
                title: "Edit Typeview",
                myDiagram: myDiagram
              }
              myMetis.currentLink = link;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(link, modalContext);
                // 
            }, 
            function (o: any) {
              if (false)
                return false;
              else {
                const link = o.part.data;
                if (link.category === constants.gojs.C_RELATIONSHIP)
                  return true;
                if (link.category === constants.gojs.C_RELSHIPTYPE)
                  return true;
            }
              return false;
            }),
          makeButton("Reset Typeview",
            function (e: any, obj: any) { 
              const link = obj.part.data;
              if (link.category === constants.gojs.C_RELATIONSHIP) {
                const currentRelship = myMetis.findRelationship(link.relship.id);
                const currentRelshipView = myMetis.findRelationshipView(link.relshipview.id);
                if (currentRelship && currentRelshipView) {                   
                  const myMetamodel = myMetis.currentMetamodel;
                  const reltype  = currentRelship.type;
                  let typeview = currentRelshipView.typeview;
                  const defaultTypeview = reltype.typeview as akm.cxRelationshipTypeView;
                  currentRelshipView.typeview = defaultTypeview;
                  if (debug) console.log('856 viewdata', typeview.data);
                  const viewdata = defaultTypeview.data;
                  for (let prop in defaultTypeview.data) {
                    myDiagram.model.setDataProperty(link, prop, defaultTypeview[prop]);
                  }
                  link.typeview = defaultTypeview;
                  myDiagram.requestUpdate();

                  const jsnRelView = new jsn.jsnRelshipView(currentRelshipView);
                  if (debug) console.log('798 jsnRelView', jsnRelView);
                  const modifiedRelshipViews = new Array();
                  modifiedRelshipViews.push(jsnRelView);
                  modifiedRelshipViews.map(mn => {
                    let data = mn;
                    data = JSON.parse(JSON.stringify(data));
                    e.diagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
                  })
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
                    const reltype  = currentRelship.type;
                    const typeView = link.typeview;
                    const defaultTypeview = reltype.typeview;
                    if (typeView && (typeView.id !== defaultTypeview.id)) {
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
          makeButton("Edit Attribute",
            function (e: any, obj: any) { 
              const link = obj.part.data;
              if (link.category === constants.gojs.C_RELATIONSHIP) {
                const relship = link.relship;
                const reltype = relship?.type;
                if (reltype) {
                  const choices: string[]  = [];
                  choices.push('description');
                  const props = reltype.properties;
                  for (let i=0; i<props?.length; i++) {
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
                const choices: string[]  = [];
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
                  if (props && props.length>0) {
                    return true;
                  }
                }
              } else if (link.category === constants.gojs.C_RELSHIPTYPE) {
                return true;
              }
              return false; 
            }),
          makeButton("Reset to Typeview",
            function (e: any, obj: any) { 

              const myGoModel = myMetis.gojsModel;
              myDiagram.selection.each(function(sel) {
                const inst = sel.data;
                if (inst.category === constants.gojs.C_RELATIONSHIP) {
                  let link = myGoModel.findLink(inst.key);
                  uid.resetToTypeview(link, myMetis, myDiagram); 
                }
              })
            }, 
            function (o: any) {
                const link = o.part.data;
                if (link.category === constants.gojs.C_RELATIONSHIP)
                  return true;
            }),
          makeButton("----------"),
          makeButton("Generate Relationship Type",             
          function (e: any, obj: any) { 
            const context = {
              "myMetis":            myMetis,
              "myMetamodel":        myMetis.currentMetamodel,
              "myTargetMetamodel":  myMetis.currentTargetMetamodel,
              "myModel":            myMetis.currentModel,
              "myCurrentModelview": myMetis.currentModelview,
              "myDiagram":          e.diagram,
              "dispatch":           e.diagram.dispatch
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
          function(o: any) { 
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
              const myGoModel = myMetis.gojsModel;
              const relship = myMetis.findRelationship(link.relship.id)
              const rviews = relship.relshipviews;
              if (rviews) {
                for (let j=0; j<rviews.length; j++) {
                  const rv = rviews[j];
                  if (rv) {
                    const link = myGoModel.findLinkByViewId(rv?.id);
                    const gjsLink = myDiagram.findLinkForKey(link?.key);
                    if (gjsLink) gjsLink.isSelected = true;
                  }
                }
              }
            },
            function (o: any) { 
              const link = o.part.data;
              const myGoModel = myMetis.gojsModel;
              const relship = myMetis.findRelationship(link.relship.id)
              const rviews = relship.relshipviews;
              if (rviews?.length>1) {
                let cnt = 0;
                for (let j=0; j<rviews.length; j++) {
                  const rv = rviews[j];
                  if (rv) {
                    const link = myGoModel.findLinkByViewId(rv?.id);
                    if (link) {
                      const gjsLink = myDiagram.findLinkForKey(link?.key);
                      if (gjsLink) 
                        cnt++;
                    }
                  }
                }
                if (cnt > 1)
                  return true;
              }
            return false;
            }),
          makeButton("Select all relationships of this type",
            function (e: any, obj: any) {
              const link = obj.part.data;
              if (debug) console.log('984 link', link);
              const currentRelship = myMetis.findRelationship(link.relship.id)
              const currentType = currentRelship?.type as akm.cxRelationshipType;
              const myModel = myMetis.currentModel;
              const myGoModel = myMetis.gojsModel;
              const relships = myModel.getRelationshipsByType(currentType, false);
              for (let i=0; i<relships.length; i++) {
                const r = relships[i];
                if (r) {
                  const rviews = r.relshipviews;
                  if (rviews) {
                    for (let j=0; j<rviews.length; j++) {
                      const rv = rviews[j];
                      if (rv) {
                        const link = myGoModel.findLinkByViewId(rv?.id);
                        const gjsLink = myDiagram.findLinkForKey(link?.key)
                        if (gjsLink) gjsLink.isSelected = true;
                      }
                    }
                  }
                }
              }
            },
            function (o: any) { 
              return true;
            }),
          makeButton("Clear Breakpoints",
            function(e, obj) { 
              const link = obj.part.data;
              link.points = [];
              const relview = link.relshipview;
              relview.points = [];
              const jsnRelView = new jsn.jsnRelshipView(relview);
              const modifiedRelshipViews = new Array();
              modifiedRelshipViews.push(jsnRelView);
              modifiedRelshipViews.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                e.diagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
              }); 
            },
            function(obj) { 
              const link = obj.part.data;
              if (link.points)
                return true; 
              else 
                return false;
            }),
          makeButton("Undo",
            function(e, obj) { e.diagram.commandHandler.undo(); 
            },
            function(o) { return o.diagram.commandHandler.canUndo(); 
            }),
          makeButton("Redo",
            function(e, obj) { 
              e.diagram.commandHandler.redo(); 
            },
            function(o) { 
              return o.diagram.commandHandler.canRedo(); 
            })
        );
    }

    // A CONTEXT MENU for the background of the Diagram, when not over any Part
    {
      myDiagram.contextMenu =
        $(go.Adornment, "Vertical",
          makeButton("Paste",
            function (e: any, obj: any) {
              if (debug) console.log('1811 myMetis', myMetis);
              myMetis.pasteViewsOnly = false;
              const mySelection = [];
              e.diagram.selection.each(function(sel) {
                mySelection.push(sel.data);
              });
              myMetis.currentSelection = mySelection;
              if (debug) console.log('1685 mySelection', mySelection);
              const point = e.diagram.toolManager.contextMenuTool.mouseDownPoint;
              e.diagram.commandHandler.pasteSelection(point);
            },
            function (o: any) { 
              return o.diagram.commandHandler.canPasteSelection(); 
            }),
          makeButton("Paste View",
            function (e: any, obj: any) {
              if (debug) console.log('1827 myMetis', myMetis);
              myMetis.pasteViewsOnly = true;
              const selection = [];
              e.diagram.selection.each(function(sel) {
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
            },
            function (o: any) { 
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true; 
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
              for (let i=0; i<models.length; i++) {
                const model = models[i];
                if (model.markedAsDeleted)
                  continue;
                cnt++;
              }
              if (cnt>1)
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
              for (let i=0; i<mviews.length; i++) {
                const mview = mviews[i];
                if (mview.markedAsDeleted)
                  continue;
                cnt++;
              }
              if (cnt>1)
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
              "myMetis":            myMetis,
              "myMetamodel":        myMetis.currentMetamodel, 
              "myModel":            myMetis.currentModel,
              "myModelview":        myMetis.currentModelview,
              "myTargetMetamodel":  myMetis.currentTargetMetamodel,
              "myDiagram":          e.diagram
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
          makeButton("Edit Project",
            function (e: any, obj: any) {
              const currentName = myMetis.name; 
              const projectName = prompt("Enter Project name:", currentName);
              if (projectName?.length > 0) {
                myMetis.name = projectName;
              }
              const currentDescr = myMetis.description; 
              const projectDescr = prompt("Enter Project description:", currentDescr);
              if (projectDescr?.length > 0) {
                myMetis.description = projectDescr;
              }
              const project = {
                // "id":           myMetis.id, // ToDo: add id to project
                "name":         myMetis.name,
                "description":  myMetis.description
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
                    for (let i=0; i<adminModel?.objects?.length; i++) {
                      const obj = adminModel.objects[i];
                      if (debug) console.log('2118 obj', obj);
                      if (!obj || obj.type?.id !== modelviewType.id) 
                        continue;
                      if (obj['modelviewId'] === currentModelview.id) {
                        if (debug) console.log('2122 currentModelview, modelviewObj', currentModelview, obj);
                        if (obj) {
                          const objview = obj.objectviews[0];
                          const node = new gjs.goObjectNode(utils.createGuid, objview);
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
          makeButton("New Metamodel",
          function (e: any, obj: any) {
            uid.newMetamodel(myMetis, myDiagram);
          },
          function (o: any) {
            if (myMetis.modelType === 'Metamodelling')
              return false;
            return true; 
            }),
          makeButton("Generate Metamodel",
          function (e: any, obj: any) { 
            if (debug) console.log('1958 obj, myMetis, myDiagram', obj, myMetis, myDiagram);
            gen.generateTargetMetamodel(obj, myMetis, myDiagram);
          },
          function (o: any) { 
            if (debug) console.log('1991 myMetis', myMetis);
            if (myMetis.modelType === 'Metamodelling')
              return false;
            return true; 
            }),
          makeButton("Replace Current Metamodel",
            function (e: any, obj: any) {
              uid.replaceCurrentMetamodel(myMetis, myDiagram);
            },
            function (o: any) { 
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true;
            }),
          makeButton("Add Metamodel",
            function (e: any, obj: any) {
              uid.addMetamodel(myMetis, myDiagram);
            },
            function (o: any) { 
              if (myMetis.modelType === 'Metamodelling') {
                  return false;
              } else {
                const noMetamodels = myMetis.metamodels.length;
                if (noMetamodels >= 2)
                    return true;
                else
                  return false;
              }
            }),
          makeButton("Delete Metamodel",
            function (e: any, obj: any) {
              uid.deleteMetamodel(myMetis, myDiagram);
            },
            function (o: any) { 
              if (myMetis.modelType === 'Metamodelling')
                return false;
              let cnt = 0;
              const metamodels = myMetis.metamodels;
              for (let i=0; i<metamodels.length; i++) {
                const metamodel = metamodels[i];
                if (metamodel.markedAsDeleted)
                  continue;
                cnt++;
              }
              if (cnt>1)
                return true; 
              else 
                return false;
            }),
          makeButton("Clear Metamodel Content",
            function (e: any, obj: any) {
              uid.clearMetamodel(myMetis, myDiagram);
            },
            function (o: any) { 
              if (myMetis.modelType === 'Metamodelling')
                return false;
              let cnt = 0;
              const metamodels = myMetis.metamodels;
              for (let i=0; i<metamodels.length; i++) {
                const metamodel = metamodels[i];
                if (metamodel.markedAsDeleted)
                  continue;
                cnt++;
              }
              if (cnt>1)
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
          makeButton("----------",
            function (e: any, obj: any) {
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
            if(debug) console.log('2092 links', links);
            for (let i=0; i<links.length; i++) {
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
                myDiagram.selection.each(function(sel) {
                  if (debug) console.log('1435 sel', sel.data);
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
          makeButton("Select all objects of type",
            function (e: any, obj: any) {
              const myModel = myMetis.currentModel;
              const myModelview = myMetis.currentModelview;
              const myGoModel = myMetis.gojsModel;
              const typename = prompt("Enter object type name", "");
              const objects = myModel.getObjectsByTypename(typename, false);
              let firstTime = true;
              for (let i=0; i<objects.length; i++) {
                const o = objects[i];
                if (o) {
                  const oviews = o.objectviews;
                  if (oviews) {
                    for (let j=0; j<oviews.length; j++) {
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
          makeButton("----------",
            function (e: any, obj: any) {
            },
            function (o: any) { 
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true; 
            }),
          makeButton("Toggle Admin layer",
            function (e: any, obj: any) {
              utils.toggleAdminModel();

            },
            function (o: any) { 
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
          makeButton("Set Layout Scheme",
            function (e: any, obj: any) {
              const layoutList = () => [
                {value:"Circular", label: "Circular Layout"},
                {value:"Grid", label: "Grid Layout"},
                {value:"Tree", label: "Tree Layout"},
                {value:"ForceDirected", label: "ForceDirected Layout"},
                {value:"LayeredDigraph", label: "LayeredDigraph Layout"},
                {value:"Manual", label: "Manual Layout"},
              ];
              const llist = layoutList();
              if (debug) console.log('3020 layoutList', llist );
              const layoutLabels = llist.map(ll => (ll) && ll.label);
              if (debug) console.log('3076', layoutLabels, llist );
              const modalContext = {
                what:  "selectDropdown",
                title: "Set Layout Scheme",
                case:  "Set Layout Scheme",
                layoutList : layoutList(),
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
              const myGoModel = myMetis.gojsModel;
              let layout = myGoModel.modelView?.layout;
              if (myMetis.modelType === 'Metamodelling') 
                layout = myGoModel.metamodel?.layout;              
              setLayout(myDiagram, layout);
            },
            function (o: any) { 
              return true; 
            }),
          makeButton("Set Link Routing",
            function (e: any, obj: any) {
              const routingList = () => [
                {value:"Normal", label: "Normal"},
                {value:"Orthogonal", label: "Orthogonal"},
                {value:"AvoidsNodes", label: "Avoids Nodes"},
              ];
              const rlist = routingList();
              if (debug) console.log('3143 routingList', rlist );
              const routingLabels = rlist.map(rl => (rl) && rl.label);
              if (debug) console.log('3145', routingLabels, rlist );
              const modalContext = {
                what:  "selectDropdown",
                title: "Set Routing Scheme",
                case:  "Set Routing Scheme",
                routingList : routingList(),
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
                {value:"None", label: "None"},
                {value:"Bezier", label: "Bezier"},
                {value:"JumpOver", label: "Jump Over"},
                {value:"JumpGap", label: "Jump Gap"},
              ];
              const clist = curveList();
              if (debug) console.log('3171 curveList', clist );
              const curveLabels = clist.map(cl => (cl) && cl.label);
              if (debug) console.log('3173', curveLabels, clist );
              const modalContext = {
                what:  "selectDropdown",
                title: "Set Link Curve",
                case:  "Set Link Curve",
                curveList : curveList(),
                myDiagram: myDiagram
              } 
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(myDiagram, modalContext);
              if (debug) console.log('3183 myMetis', myMetis);
            },
            function (o: any) { 
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
                alert("Inherited Relationship types are included!");
              }
              const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
              let data = {metis: jsnMetis}
              data = JSON.parse(JSON.stringify(data));
              if (debug) console.log('2398 jsnMetis', jsnMetis, metis);
              e.diagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
          
              // const jsnModelview = new jsn.jsnModelView(modelview);
              // if (debug) console.log('3236 jsnModelview', jsnModelview);
              // const modifiedModelviews = new Array();
              // modifiedModelviews.push(jsnModelview);
              // modifiedModelviews.map(mn => {
              //   let data = mn;
              //   data = JSON.parse(JSON.stringify(data));
              //   e.diagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
              // })
            },
            function (o: any) { 
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
              myDiagram.selection.each(function(node) {
                  if (x1 == 0) x1 = node.actualBounds.x;
                  if (y1 == 0) y1 = node.actualBounds.y;
                  if (w == 0)  w  = node.actualBounds.width;
                  if (h == 0)  h  = node.actualBounds.height;
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
          makeButton("Verify and Repair Model",
          function (e: any, obj: any) {
            if (debug) console.log('2340 myMetis', myMetis);
            const myModel = myMetis.currentModel;
            const modelviews = myModel.modelviews;
            const myModelview = myMetis.currentModelview;
            const myMetamodel = myMetis.currentMetamodel;
            const myGoModel = myMetis.gojsModel;
            if (debug) console.log('2346 myMetis', myMetis);
            myDiagram.myGoModel = myGoModel;
            if (debug) console.log('2345 model, metamodel', myModelview, myModel, myMetamodel, myDiagram.myGoModel);
            uic.verifyAndRepairModel(myModel, myMetamodel, modelviews, myDiagram, myMetis);
            if (debug) console.log('2348 myMetis', myMetis);
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
                if (debug) console.log('2402 myMetis', myMetis.currentModel.objects);
                uic.purgeDeletions(myMetis, myDiagram); 
                if (debug) console.log('2404 myMetis', myMetis);
              }
            },
            function (o: any) { 
              // if (myMetis.modelType === 'Metamodelling')
              //   return false;
              return true; 
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
      let linkTemplateMap = new go.Map<string, go.Link>();
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
      let groupTemplateMap = new go.Map<string, go.Part>();
      uit.addGroupTemplates(groupTemplateMap, partContextMenu, myMetis);

      // Define node template map
      let nodeTemplateMap = new go.Map<string, go.Part>();
      uit.addNodeTemplates(nodeTemplateMap, partContextMenu, myMetis);
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

    function addFromNode(myFromNodes: any, n: any) {
      const myFromNode = { 
        "key":        n.data.key, 
        "name":       n.data.name,
        "objid":      n.data.object.id,
        "objviewid":  n.data.objectview.id,
        "group":      n.data.objectview.group,
        "isGroup":    n.data.objectview.isGroup,
        "toGroup":    "",
        "loc":        new String(n.data.loc),
        "scale":      new String(n.scale),
        "size":       new String(n.data.size)
      }
      myFromNodes.push(myFromNode);
      if (n.data.isGroup) {
        for (let it2 = n.memberParts.iterator; it2?.next();) {
          let n2 = it2.value;
          if (!(n2 instanceof go.Node)) continue;
          if (n2) {
            addFromNode(myFromNodes, n2);
          }
        }
      }
    }
    function getFromNode(myFromNodes: any, key: string) {
      for (let i = 0; i < myFromNodes.length; i++) {
        if (myFromNodes[i].key === key) {
          return myFromNodes[i];
        }
      }
      return null;
    }

    function setLayout (myDiagram, layout) {
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
    }

    // this DiagramEvent handler is called during the linking or relinking transactions
    function maybeChangeLinkCategory(e: any) {
      var link = e.subject;
      var linktolink = (link.fromNode?.isLinkLabel || link.toNode?.isLinkLabel);
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

  public render() {
    let useTabs = true;
    if (debug) console.log('2863 Diagram: ', this.props.nodeDataArray);
    if (debug) console.log('2864 Diagram: ', this.props.linkDataArray);
    const selObj = this.state.selectedData;
    if (debug) console.log('2866 selObj: ', selObj);
    const myMetis = this.myMetis;
    const myModel = myMetis.currentModel;
    const myMetamodel = myModel.metamodel;
    let modalContent, inspector, selector, header, category, typename;
    const modalContext = this.state.modalContext;
    if (debug) console.log('2872 modalContext ', modalContext);
    let selpropgroup = [  {tabName: 'Default'} ];
    if (modalContext?.what === 'editObject') {
      let includeInherited = false;
      let includeConnected = false;
      let obj = this.state.selectedData?.object;
      const obj1 = this.myMetis.findObject(obj?.id);
      if (debug) console.log('2879 obj, obj1', obj, obj1);
      if (obj?.type?.name === 'Method')
        useTabs = false;
      if (obj1?.hasInheritedProperties(myModel)) {
        includeInherited = true;
        useTabs = true;
      }
      const connectedObjects = obj1?.getConnectedObjects(myMetis);
      if (connectedObjects?.length > 0) {
        includeConnected = true;
        useTabs = true;
      }
      const context = {
        myMetis: myMetis,
        myModel: myModel,
        myMetamodel: myMetamodel,
        includeConnected: includeConnected,
        includeInherited: includeInherited,
      }
      let namelist = useTabs ? uic.getNameList(obj1, context, true) : [];
      const connectedRoles = obj1.getConnectedObjectRoles(myMetis);
      if (debug) console.log('2900 context, obj1, namelist', context, obj1, namelist);
      selpropgroup = [];
      for (let i=0; i<namelist.length; i++) {
        let name = namelist[i];
        if (name === 'Element') 
          continue; // name = 'Default';
        if (i>0) {
          let role = connectedRoles[i-1];
          if (role) name = role;
        }
        const proptab = { tabName: name };
        selpropgroup.push(proptab);
      }
      if (debug) console.log('2913 selpropgroup, namelist', selpropgroup, namelist);
      // selpropgroup = [  {tabName: 'Default'}, {tabName: 'Properties'}, {tabName: 'OSDU'} ];
    }
    switch (modalContext?.what) {      
      case 'selectDropdown': 
        let options =  '';
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
            img = (icon.value.includes('//')) ? icon.value : './../images/'+icon.value 
            return {value: img, label: icon.label}
          })
          comps ={ Option: CustomSelectOption, SingleValue: CustomSelectValue }
        }
        else if (modalContext?.title === 'Set Layout Scheme') {
          let layout, img; 
          options = this.state.modalContext.layoutList.map(ll => {
            img = './../images/default.png'
            layout = ll.value 
            return {value: layout, label: ll.label}
          })
          comps ={ Option: CustomSelectOption, SingleValue: CustomSelectValue }
        }
        else if (modalContext?.title === 'Set Routing Scheme') {
          let routing, img; 
            options = this.state.modalContext.routingList.map(rr => {
              img = './../images/default.png'
              routing = rr.value 
              return {value: routing, label: rr.label}
            })
            comps ={ Option: CustomSelectOption, SingleValue: CustomSelectValue }
        } 
        else if (modalContext?.title === 'Set Link Curve') {
            let curve, img; 
            options = this.state.modalContext.curveList.map(cc => {
              img = './../images/default.png'
              curve = cc.value 
              return {value: curve, label: cc.label}
            })
            comps ={ Option: CustomSelectOption, SingleValue: CustomSelectValue }
        } 
        else if (modalContext?.title === 'Select Relationship Type') {
            if (debug) console.log('2923 modalContext', this.state.modalContext);
            const choices = this.state.modalContext.args.typeNames;
            let img;
            options = choices.map(tpname => {
                img = './../images/default.png';
                return {value: tpname, label: tpname}
            })
            comps ={ Option: CustomSelectOption, SingleValue: CustomSelectValue }
        }
        else {
            options = this.state.selectedData.map(o => o && {'label': o, 'value': o});
            comps = null
        }
        if (debug) console.log('2563 options', options);
        const { selectedOption } = this.state;

        const value = (selectedOption)  ? selectedOption.value : options[0]

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
        let selectedData = this.state.selectedData;
        header = modalContext.title;
        category = this.state.selectedData.category;
        if (this.state.selectedData !== null && this.myMetis != null) {
          // // code for extracting the g element from the svg
          // https://github.com/NorthwoodsSoftware/GoJS/blob/master/samples/tiger.html
          // if (this.state.selectedData.icon?.includes('<svg')) {
          //   const svgString = this.state.selectedData.icon;
          //   console.log('3012 svgString', svgString);
          //   // const xmldoc = new DOMParser().parseFromString(svgString, 'text/xml');
          //   const svg = new DOMParser().parseFromString(svgString, 'image/svg+xml');
          //   // get g element
          //   const g = svg?.getElementsByTagName('g')[0];
          //   // get path elements
          //   const paths = g?.getElementsByTagName('path');

          //   console.log('3018 g', g, 'paths ', paths);
          //   // get all paths path data
          //   const pathData = [];
          //   for (let i = 0; i < paths?.length; i++) {
          //     pathData.push(paths[i].getAttribute('d'));
          //   }
          //   console.log('3025 pathData', pathData);
          //   // concatinating of the paths in array
          //   const pathD =  
          //     pathData.reduce((acc, val) => {
          //       return acc + val;
          //     }, '');
          //   console.log('3028 pathD', pathD);
          //   // selectedData = { ...this.state.selectedData, geometry: pathD };
          //   // this.setState({ selectedData });
          //   // if (this.state.selectedData.geometry === '') {
          //   selectedData = { selectedData:{...this.state.selectedData, objectview: { ...this.state.selectedData.objectview, geometry: pathD} }};
          //   // }
          //   if (debug) console.log('3038 selectedData, modalContext: ', this.state.selectedData, modalContext);
          // }
          modalContent = 
            <div className="modal-prop">
              <SelectionInspector 
                myMetis       ={this.myMetis}
                // selectedData  ={selectedData}
                selectedData  ={this.state.selectedData}
                context       ={this.state.modalContext}
                onInputChange ={this.handleInputChange}
                activeTab     ={this.state.currentActiveTab}
              />
            </div>
          if (debug) console.log('3021 selectedData, modalContent: ', this.state.selectedData, modalContent);  
        }
        break;
      case 'editRelationshipType':
      case 'editRelationship':
      case 'editRelshipview':
      case 'editTypeview': {
        header = modalContext.title + ':';
        category = this.state.selectedData.category;
        if (debug) console.log('2612 category ', category);
        typename = (modalContext.typename) ? '('+modalContext.typename+')' : '('+this.state.selectedData.object?.typeName+')'
      
        if (this.state.selectedData !== null && this.myMetis != null) {
          if (debug) console.log('2615 Diagram ', this.state.selectedData, this.state.modalContext, modalContext);
          modalContent = 
            <div className="modal-prop" >
              <SelectionInspector 
                myMetis       ={this.myMetis}
                selectedData  ={this.state.selectedData}
                context       ={this.state.modalContext}
                onInputChange ={this.handleInputChange}
                activeTab     ={this.state.currentActiveTab}
              />
            </div>
        }
      }
      break;
      default:
        break;
    }

    //----------------------------------------------------------------------------

     
    //toggle active state for Tab
    const toggle = tab => {
        if (this.state.currentActiveTab !== tab) this.setState({currentActiveTab:tab});
    }

    const navitemDiv = (!selpropgroup) ? <></> : selpropgroup.map((pg, index) => {
      const tabName = pg?.tabName || 'All';
      if (debug) console.log('2646', index, tabName, pg)
      if (pg) { 
          const strindex = index.toString()
          const activeTab = (this.state.currentActiveTab === strindex) ? 'active' : ''
          return (
            <NavItem key={strindex}>
              <NavLink 
                className={classnames({ active: this.state.currentActiveTab === strindex })}
                onClick={() => { toggle(strindex)}}
              >
                {tabName}
              </NavLink>
            </NavItem>
          )
      }
    })

    const toolTip = <div className="btn-sm bg-light text-black py-0 mt-2 ml-3"  data-toggle="tooltip" data-placement="top" data-bs-html="true" 
      title="Select tab to see different group of properties.">i
    </div>

    const modaltabsContent = 
      <>
        <Nav tabs >
          {navitemDiv}  
          <NavItem > {toolTip} </NavItem>
        </Nav>
        <TabContent activeTab={this.state.currentActiveTab} > 
          <TabPane tabId={this.state.currentActiveTab} >
            <div className="bg-white mt-0 p-1 pt-2"> 
             {modalContent}
            </div>         
          </TabPane>
        </TabContent>
      </>  

if (debug) console.log('2825 Active tab: ', this.state.currentActiveTab);
if (debug) console.log('3099 nodeDataArray, linkDataArray, modelData: ', 
this.props.nodeDataArray, this.props.linkDataArray, this.props.modelData);

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
        />
        <Modal isOpen={this.state.showModal}  >
          {/* <div className="modal-dialog w-100 mt-5">
            <div className="modal-content"> */}
              <div className="modal-head">
                <Button className="modal-button btn-sm float-right m-1" color="link" 
                  onClick={() => { this.handleCloseModal('x') }} ><span>x</span>
                </Button>
                  <span className="text-secondary float-left">{ header }:</span> 
                <ModalHeader className="modal-header" >
                  <span className="modal-name ml-2" >{this.state.selectedData?.name} </span>
                  <span className="modal-objecttype"> {typename} </span> 
                </ModalHeader>
              </div>
              <ModalBody  className="modal-body">
                {/* <div className="modal-body1"> */}
                  {/* <div className="modal-pict"><img className="modal-image" src={icon}></img></div> */}
                  {/* {modalContent} */}
                  {modaltabsContent}
                {/* </div> */}
              </ModalBody>
              <ModalFooter className="modal-footer">
                <Button className="modal-button bg-link m-0 p-0" color="link" onClick={() => { this.handleCloseModal() }}>Done</Button>
              </ModalFooter>
            {/* </div>
          </div> */}
        </Modal>        
        <style jsx>{`
        
        `}
        </style> 
      </div>
    );
  }
}
