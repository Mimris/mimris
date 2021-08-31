// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;
const linkToLink = false;

import * as go from 'gojs';
import { produce } from 'immer';
import { ReactDiagram } from 'gojs-react';
import * as React from 'react';
import Select, { components } from "react-select"
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Breadcrumb } from 'reactstrap';
// import * as ReactModal from 'react-modal';
// import Popup from 'reactjs-popup';
// import 'reactjs-popup/dist/index.css';
import { SelectionInspector } from '../components/SelectionInspector';
import * as akm from '../../../akmm/metamodeller';
import * as gjs from '../../../akmm/ui_gojs';
import * as gql from '../../../akmm/ui_graphql';
import * as uic from '../../../akmm/ui_common';
import * as uid from '../../../akmm/ui_diagram';
import * as uim from '../../../akmm/ui_modal';
import * as ui_mtd from '../../../akmm/ui_methods';
import * as gen from '../../../akmm/ui_generateTypes';
import * as utils from '../../../akmm/utilities';
import * as constants from '../../../akmm/constants';
// const glb = require('../../../akmm/akm_globals');
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

const AllowTopLevel = true;

interface DiagramProps {
  nodeDataArray:      Array<go.ObjectData>;
  linkDataArray:      Array<go.ObjectData>;
  modelData:          go.ObjectData;
  modelType:          DOMStringList;
  myMetis:            akm.cxMetis;
  dispatch:           any;  
  skipsDiagramUpdate: boolean;
  onDiagramEvent:     (e: go.DiagramEvent) => void;
  onModelChange:      (e: go.IncrementalData) => void;
}

interface DiagramState {
  showModal: boolean;
  selectedData: any;
  modalContext: any;
  selectedOption: any;
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
      showModal: false,
      selectedData: null, 
      modalContext: null,
      selectedOption: null
    };
    // init maps
    this.mapNodeKeyIdx = new Map<go.Key, number>();
    this.mapLinkKeyIdx = new Map<go.Key, number>();

    this.initDiagram = this.initDiagram.bind(this);
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSelectDropdownChange = this.handleSelectDropdownChange.bind(this);
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
      //diagram.addDiagramListener('SelectionDeleted', this.props.onDiagramEvent);
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
      //diagram.removeDiagramListener('SelectionDeleted', this.props.onDiagramEvent);
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
      showModal: true
    });
    if (debug) console.log('164 this.state', this.state);
  } 

  public handleSelectDropdownChange = (selected) => {
    if (debug) console.log('168 this.state', this);
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
    if (debug) console.log('178 selected, context', selected, context);
    uim.handleSelectDropdownChange(selected, context);
  }

  public handleCloseModal(e) {
    if (e === 'x') {
      if (debug) console.log('188 x:', e);
      this.setState({ showModal: false, selectedData: null, modalContext: null });
      return;
    }
    const props = this.props;
    const modalContext = this.state.modalContext;
    if (debug) console.log('382 state', this.state);
    uim.handleCloseModal(this.state.selectedData, props, modalContext);
    this.setState({ showModal: false });
  }
  
  //public handleInputChange(propname: string, value: string, fieldType: string, obj: any, context: any, isBlur: boolean) {
  public handleInputChange(props: any, value: string, isBlur: boolean) {
    if (debug) console.log('663 props', props);
    const propname = props.id;
    const fieldType = props.type;
    const obj = props.obj;
    const context = props.context;
    const pattern = props.pattern;
    if (debug) console.log('391 propname, value, obj, context, isBlur:', propname, value, obj, context, isBlur);
    if (debug) console.log('392 this.state', this.state);
    if (debug) console.log('393 obj', obj);
    this.setState(
      produce((draft: AppState) => {
        let data = draft.selectedData as any;  // only reached if selectedData isn't null
        if (debug) console.log('660 data', data, this);
        // if (data[propname] = 'icon' && value.includes("fakepath")) {
        //   data[propname] = context.files[0];
        // } else {
          data[propname] = value;
        // }
        if (debug) console.log('666 data', data[propname], value);
        if (isBlur) {
          const key = data.key;
          if (debug) console.log('669 key', key);
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
    if (debug) console.log('424 obj, context', obj, context);
    if (debug) console.log('425 propname, value, isBlur:', propname, value, isBlur);

    uim.handleInputChange(this.myMetis, props, value);
  }

  /**
   * Diagram initialization method, which is passed to the ReactDiagram component.
   * This method is responsible for making the diagram and initializing the model, any templates,
   * and maybe doing other initialization tasks like customizing tools.
   * The model's data should not be set here, as the ReactDiagram component handles that.
   */

  private initDiagram(): go.Diagram {
    if (debug) console.log('245 this', this);
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
    if (true) {
      myDiagram =
        $(go.Diagram,
          {
            initialContentAlignment: go.Spot.Center,       // center the content
            initialAutoScale: go.Diagram.Uniform,
            "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
            "scrollMode": go.Diagram.InfiniteScroll,
            "initialAutoScale": go.Diagram.UniformToFill,
            'undoManager.isEnabled': false,  // must be set to allow for model change listening
            //'undoManager.maxHistoryLength': 100,  // uncomment disable undo/redo functionality

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
              "category": "Relationship",
              "type": "isRelatedTo",
              "name": "",
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
    //myDiagram.dispatch ({ type: 'SET_MYMETIS_MODEL', myMetis });
    myMetis.myDiagram = myDiagram;
    // break long string in lines
    const breakString = (str, limit) => {
      let brokenString = '';
      for(let i = 0, count = 0; i < str.length; i++){
         if(count >= limit && str[i] === ' '){
            count = 0;
            brokenString += '\n';
         }else{
            count++;
            brokenString += str[i];
         }
      }
      return brokenString;
   }
    // Tooltip functions
    function nodeInfo(d) {  // Tooltip info for a node data object
      if (debug) console.log('987 nodeInfo', d, d.object);
  
      const format1 = "%s\n";
      const format2 = "%-10s: %s\n";

      let msg = "Object Type props:\n";
      msg += "-------------------\n";
      msg += printf(format2, "-Type", d.object.type.name);
      msg += printf(format2, "-Title", d.object.type.title);
      msg += printf(format2, "-Descr", breakString(d.object.type.description, 64));
      // msg += printf(format2, "-Descr", d.object.type.description);
      msg += "\n";
      msg += "Instance props:\n";
      msg += "---------------------\n";
      msg += printf(format2, "-Name", d.name);
      msg += printf(format2, "-Title", d.object.title);
      msg += printf(format2, "-Description", breakString(d.object.description, 64));
      msg += printf(format2, "-ViewFormat", d.object.viewFormat);
      msg += printf(format2, "-FieldType", d.object.fieldType);
      msg += printf(format2, "-Inputpattern", d.object.inputPattern);
      msg += printf(format2, "-InputExample", d.object.inputExample);
      msg += printf(format2, "-Value", d.object.value);
      if (d.group) {
        const group = myMetis.gojsModel.findNode(d.group);
        msg += printf(format2, "member of", group.name);
      }
      if (debug) console.log('991 msg', msg);
      // let str = "Attributes:"; 
      // msg += printf(format1, str);      
      // const obj = d.object;
      // const props = obj.type.properties;
      // if (debug) console.log('996 obj, props', obj, props, msg);   
      // for (let i=0; i<props.length; i++) {
      //   const prop = props[i];
      //   if (debug) console.log('999 prop', prop);
      //   const value = obj[prop.name]; 
      //   console.log('1001 prop, value', prop, value);
      //   msg += printf(format2, prop.name, value);
      // }
      if (debug) console.log('1005 nodeInfo', obj, msg);
      return msg;
    }

    function linkInfo(d: any) {  // Tooltip info for a link data object
      const typename = d.relshiptype?.name;
      const reltype = myMetis.findRelationshipTypeByName(typename);
      const fromNode = d.fromNode;
      const fromObj = fromNode?.object;
      const fromObjtype = reltype.getFromObjType();
      const toNode = d.toNode;
      const toObj = toNode?.object;
      const toObjtype = reltype.getToObjType();
      if (debug) console.log('425 linkInfo', d);
      const format1 = "%s\n";
      const format2 = " %-10s: %s\n";
      const format3 = "%-8s: %s\n";
  
      let msg = "Relationship:\n";
      msg += "Type props:\n"; 
      msg += "-------------------\n";
      msg += printf(format2, "-Type", d.relship.type.name);
      msg += printf(format2, "-Title", d.relship.type.title);
      msg += printf(format2, "-Descr", breakString(d.relship.type.description, 64))
      msg += "\n";
      msg += "Instance props:\n";
      msg += "---------------------\n";
      msg += printf(format2, "-Name", d.name);
      msg += printf(format2, "-Title", d.relship.title);
      msg += printf(format2, "-Description", breakString(d.relship.description, 64));
      msg += printf(format3, "-from", fromObj?.name);
      msg += printf(format2, "-to   ", toObj?.name);
      // str += "from: " + fromObj?.name + "\n";
      // str += "to: " + toObj?.name;
      // return str;
      return msg;
    }

    function diagramInfo(model: any) {  // Tooltip info for the diagram's model
      if (debug) console.log('451 diagramInfo', model);
      let str = "Model:\n";
      str += model.nodeDataArray.length + " nodes, ";
      str += model.linkDataArray.length + " links";
      return str;
    }

    // A CONTEXT is an Adornment with a bunch of buttons in them
    // Nodes CONTEXT MENU
    if (true) {
      var partContextMenu =
        $(go.Adornment, "Vertical",
          makeButton("Copy",
          function (e: any, obj: any) { 
            e.diagram.commandHandler.copySelection(); 
          },
          function (o: any) { 
            const node = o.part.data;
            if (node.category === constants.gojs.C_OBJECT) 
              return o.diagram.commandHandler.canCopySelection(); 
            }),
          makeButton("Paste",
            function (e: any, obj: any) {
              const currentModel = myMetis.currentModel;
              myMetis.pasteViewsOnly = false;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
            },
            function (o: any) {
              return o.diagram.commandHandler.canPasteSelection(); 
            }),
            makeButton("Paste View",
            function (e: any, obj: any) {
              const currentModel = myMetis.currentModel;
              myMetis.pasteViewsOnly = true;
              e.diagram.dispatch ({ type: 'SET_MYMETIS_MODEL', myMetis });
              const myGoModel = myDiagram.myGoModel;
              e.diagram.dispatch({ type: 'SET_MY_GOMODEL', myGoModel });
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
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
              if (debug) console.log('566 node', node);
              uid.editObject(node, myMetis, myDiagram); 
            },
            function (o: any) { 
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                return true;
              }
              return false; 
            }),
          makeButton("Edit Objectview",
            function (e: any, obj: any) { 
              const node = obj.part.data;
              uid.editObjectview(node, myMetis, myDiagram); 
            }, 
            function (o: any) { 
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                return true;
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
              myDiagram.handleOpenModal(node, modalContext);
              if (debug) console.log('730 myMetis', myMetis);
            },
            function (o: any) {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                return true;
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
                        const gjsNode = myDiagram.findNodeForKey(member?.key);
                      }                    
                    }
                    node = myDiagram.findNodeForKey(node?.key);
                    if (node)
                      node.findLinksConnected().each(function(l) {
                         l.isSelected = true;
                      });                    
                  }
                  if (inst.category === constants.gojs.C_OBJECTTYPE) {
                    const node = myDiagram.findNodeForKey(inst.key);
                    node.findLinksConnected().each(function(l) { l.isSelected = true; });                    
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
                const gqlModel = new gql.gqlModel(myModel, true);
                const modifiedModels = new Array();
                modifiedModels.push(gqlModel);
                modifiedModels.map(mn => {
                  let data = mn;
                  e.diagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
                })
                if (debug) console.log('603 Delete View', gqlModel, myMetis);
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
                context.myTargetMetamodel = gen.askForMetamodel(context);
                myMetis.currentModel.targetMetamodelRef = context.myTargetMetamodel.id;
                if (debug) console.log('369 Diagram', myMetis.currentModel.targetMetamodelRef);
                
                const gqlModel = new gql.gqlModel(context.myModel, true);
                const modifiedModels = new Array();
                modifiedModels.push(gqlModel);
                modifiedModels.map(mn => {
                  let data = mn;
                  e.diagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
                })
                
                const dtype = gen.generateDatatype(currentObj, context);
                if (dtype) {
                  const gqlDatatype = new gql.gqlDatatype(dtype);
                  const modifiedDatatypes = new Array();
                  modifiedDatatypes.push(gqlDatatype);
                  modifiedDatatypes.map(mn => {
                    let data = mn;
                    e.diagram.dispatch({ type: 'UPDATE_DATATYPE_PROPERTIES', data })
                  })
                  if (debug) console.log('467 gqlDatatype', gqlDatatype);
                }
            },
            function(o: any) { 
              const obj = o.part.data.object;
              const objtype = obj?.type;
              if (objtype?.name === constants.types.AKM_DATATYPE)
                  return true;              
              return false;
            }),
          makeButton("Generate Unit",
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
              const contextmenu = obj.part;  
              const part       = contextmenu.adornedPart; 
              const currentObj = part.data.object;
              context.myTargetMetamodel = gen.askForTargetMetamodel(context);
              const unit = gen.generateUnit(currentObj, context);
              const gqlUnit = new gql.gqlUnit(unit);
              const modifiedUnits = new Array();
              modifiedUnits.push(gqlUnit);
              modifiedUnits.map(mn => {
                let data = mn;
                e.diagram.dispatch({ type: 'UPDATE_UNIT_PROPERTIES', data })
              })
            },
            function(o: any) { 
              return false;
              let obj = o.part.data.object;
              let objtype = obj.type;
              if (objtype.name === constants.types.AKM_UNIT)
                  return true;
              else
                  return false;
            }),
          makeButton("Edit Object Type",
            function (e: any, obj: any) { 
              const node = obj.part.data;
              const icon = findImage(node.icon);
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
                    node.choices.push(otype.name); 
                    if (otype.name === 'Generic')
                      continue;
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
            if (debug) console.log('1477 node', node);
            const modalContext = {
              what: "editTypeview",
              title: "Edit Typeview",
              icon: findImage(node.icon),
              myDiagram: myDiagram
            }
            myMetis.currentNode = node;
            myMetis.myDiagram = myDiagram;
            myDiagram.handleOpenModal(node, modalContext);
          }, 
          function (o: any) {
            if (false)
              return false;
            else {
              const node = o.part.data;
              if (node.category === constants.gojs.C_OBJECT)
                return true;
              if (node.category === constants.gojs.C_OBJECTTYPE)
                return true;
            }
            return false;
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
          makeButton("Generate Metamodel",
          function (e: any, obj: any) { 
            // node is a container (group)
            const node = obj.part.data;
            const context = {
              "myMetis":            myMetis,
              "myMetamodel":        myMetis.currentMetamodel,
              "myTargetMetamodel":  myMetis.currentTargetMetamodel,
              "myModel":            myMetis.currentModel,
              "myCurrentModelview": myMetis.currentModelview,
              "myGoModel":          myMetis.gojsModel,
              "myCurrentNode":      node,    
              "myDiagram":          e.diagram,
              "dispatch":           e.diagram.dispatch
            }
            context.myTargetMetamodel = gen.askForTargetMetamodel(context, false);
            if (context.myTargetMetamodel == undefined) { // sf
                context.myTargetMetamodel = null;
            }
            myMetis.currentTargetMetamodel = context.myTargetMetamodel;
            const targetMetamodel = myMetis.currentTargetMetamodel;
            const sourceModelview = myMetis.currentModelview;
            gen.generateTargetMetamodel(targetMetamodel, sourceModelview, context);
          },
          function (o: any) { 
            const node = o.part.data;
            if (node.isGroup)
              return true;
            else
              return false;
          }),
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
                context.myTargetMetamodel = gen.askForTargetMetamodel(context, false);
              if (context.myTargetMetamodel == undefined) { // sf
                  context.myTargetMetamodel = null;
              }    
              myMetis.currentTargetMetamodel = context.myTargetMetamodel;
              if (debug) console.log('456 Generate Object Type', context.myTargetMetamodel, myMetis);
              if (context.myTargetMetamodel) {  
                myMetis.currentModel.targetMetamodelRef = context.myTargetMetamodel?.id;
                if (debug) console.log('459 Generate Object Type', context, myMetis.currentModel.targetMetamodelRef);
                const gqlModel = new gql.gqlModel(context.myModel, true);
                const modifiedModels = new Array();
                modifiedModels.push(gqlModel);
                modifiedModels.map(mn => {
                  let data = (mn) && mn;
                  data = JSON.parse(JSON.stringify(data));
                  myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
                })
                if (debug) console.log('467 gqlModel', gqlModel);
                const currentObjview = part.data.objectview;
                const objtype = gen.generateObjectType(currentObj, currentObjview, context);
                if (debug) console.log('470 Generate Object Type', objtype, myMetis);
              }
          },  
          function(o: any) { 
               let obj = o.part.data.object;
               let objtype = obj.type;
               if (objtype.name === constants.types.AKM_INFORMATION)
                   return true;
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
          makeButton("Generate osduIds",
            function (e: any, obj: any) { 
              const node = obj.part.data;
              if (node.category === constants.gojs.C_OBJECT) {
                let object = node.object;
                if (!object) return;
                object = myMetis.findObject(object.id);
                let reltype = myMetis.findRelationshipTypeByName('hasPart');
                let objtype = myMetis.findObjectTypeByName('Information');
                const context = {
                  "myMetis":    myMetis,
                  "myModel":    myMetis.currentModel,
                  "myDiagram":  myDiagram,
                  "reltype":    reltype,
                  "objtype":    null,
                  "propname":   "osduId",
                  "preaction":  ui_mtd.generateosduId,
                  "postaction": null
                }
                const args = {
                  "parent":     null
                }
                context.preaction(object, context);
                ui_mtd.traverse(object, context/*, args*/);
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
                const args = {
                  "method":             ""
                }
                const context = {
                    "myMetis":            myMetis,
                    "myMetamodel":        myMetis.currentMetamodel,
                    "myObject":           object,
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
    if (true) {
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
              myDiagram.model.setDataProperty(data, "points", "[-469,-214,-459,-214,-325,-214,-325,-104,-289,-104,-279,-104]");            },
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
                  const reltype  = currentRelship.type;
                  let typeview = currentRelshipView.typeview;
                  const defaultTypeview = reltype.typeview;
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

                      const gqlReltypeView = new gql.gqlRelshipTypeView(typeview);
                      if (debug) console.log('715 gqlReltypeView', gqlReltypeView);
                      const modifiedTypeViews = new Array();
                      modifiedTypeViews.push(gqlReltypeView);
                      modifiedTypeViews.map(mn => {
                        let data = mn;
                        e.diagram.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
                      })

                      const gqlRelView = new gql.gqlRelshipView(currentRelshipView);
                      if (debug) console.log('723 gqlRelView', gqlRelView);
                      const modifiedRelshipViews = new Array();
                      modifiedRelshipViews.push(gqlRelView);
                      modifiedRelshipViews.map(mn => {
                        let data = mn;
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
              if (debug) console.log('1083 node', node);
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
              const link = obj.part.data;
              if (debug) console.log('666 link', link, myDiagram, myGoModel);
              let fromNode = myGoModel?.findNode(link.from);
              let toNode   = myGoModel?.findNode(link.to);
              if (debug) console.log('669 from and toNode', fromNode, toNode);
              let fromType = fromNode?.objecttype;
              let toType   = toNode?.objecttype;
              fromType = myMetis.findObjectType(fromType?.id);
              toType   = myMetis.findObjectType(toType?.id);
              if (debug) console.log('672 link', fromType, toType);
              const myMetamodel = myMetis.currentMetamodel;
              const reltypes = myMetamodel.findRelationshipTypesBetweenTypes(fromType, toType);
              let   defText  = "";
              link.choices = [];
              link.choices.push('isRelatedTo');
              if (debug) console.log('675 createRelationship', reltypes, fromType, toType);
              if (reltypes) {
                  for (let i=0; i<reltypes.length; i++) {
                      const rtype = reltypes[i];
                      link.choices.push(rtype.name);  
                      if (rtype.name === 'isRelatedTo')
                          continue;
                  }
              }
              const context = {
                "myMetis":      myMetis,
                "myDiagram":    e.diagram,
              }
              const modalContext = {
                what: "selectDropdown",
                title: "Select Relationship Type",
                case: "Change Relationship type",
                myDiagram: myDiagram
              } 
              myMetis.currentLink = link;
              myMetis.myDiagram = myDiagram;
              myDiagram.handleOpenModal(link.choices, modalContext);
              if (debug) console.log('511 myMetis', myMetis);

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
                  const defaultTypeview = reltype.typeview;
                  currentRelshipView.typeview = defaultTypeview;
                  if (debug) console.log('856 viewdata', typeview.data);
                  const viewdata = defaultTypeview.data;
                  for (let prop in defaultTypeview.data) {
                    myDiagram.model.setDataProperty(link, prop, defaultTypeview[prop]);
                  }
                  link.typeview = defaultTypeview;
                  myDiagram.requestUpdate();

                  const gqlRelView = new gql.gqlRelshipView(currentRelshipView);
                  if (debug) console.log('798 gqlRelView', gqlRelView);
                  const modifiedRelshipViews = new Array();
                  modifiedRelshipViews.push(gqlRelView);
                  modifiedRelshipViews.map(mn => {
                    let data = mn;
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
            context.myTargetMetamodel = gen.askForTargetMetamodel(context, false);
            if (context.myTargetMetamodel == undefined)  // sf
              context.myTargetMetamodel = null;
            myMetis.currentTargetMetamodel = context.myTargetMetamodel;
            if (debug) console.log('950 Generate Relationship Type', context.myTargetMetamodel, myMetis);
            if (context.myTargetMetamodel) {  
              myMetis.currentModel.targetMetamodelRef = context.myTargetMetamodel?.id;
              if (debug) console.log('953 Generate Relationship Type', context, myMetis.currentModel.targetMetamodelRef);
              const gqlModel = new gql.gqlModel(context.myModel, true);
              const modifiedModels = new Array();
              modifiedModels.push(gqlModel);
              modifiedModels.map(mn => {
                let data = (mn) && mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
              })
              const currentRelview = part.data.relshipview;
              if (debug) console.log('962 currentRelview', currentRelview);
              const reltype = gen.generateRelshipType(currentRel, currentRelview, context);
              if (debug) console.log('964 Generate Relationship Type', reltype, myMetis);
              if (reltype) {
                const reltypeview = reltype.typeview;
                if (debug) console.log('976 reltype', reltype);
                const gqlRelshipType = new gql.gqlRelationshipType(reltype);
                if (debug) console.log('979 Generate Relationship Type', reltype,gqlRelshipType);
                const modifiedTypeLinks = new Array();
                modifiedTypeLinks.push(gqlRelshipType);
                modifiedTypeLinks.map(mn => {
                  let data = (mn) && mn;
                  data = JSON.parse(JSON.stringify(data));
                  myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPE_PROPERTIES', data })
                });
                const gqlRelTypeview = new gql.gqlRelshipTypeView(reltypeview);
                if (debug) console.log('987 Generate Relationship Type', gqlRelTypeview);
                const modifiedTypeViews = new Array();
                modifiedTypeViews.push(gqlRelTypeview);
                modifiedTypeViews?.map(mn => {
                  let data = (mn) && mn;
                  data = JSON.parse(JSON.stringify(data));
                  myDiagram.dispatch({ type: 'UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES', data })
                })
                if (debug) console.log('994 myMetis', myMetis);
              }
            }
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
              const currentType = currentRelship?.type;
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
    if (true) {
      myDiagram.contextMenu =
        $(go.Adornment, "Vertical",
          makeButton("Paste",
            function (e: any, obj: any) {
              myMetis.pasteViewsOnly = false;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
            },
            function (o: any) { 
              return o.diagram.commandHandler.canPasteSelection(); 
            }),
          makeButton("Paste View",
            function (e: any, obj: any) {
              myMetis.pasteViewsOnly = true;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
            },
            function (o: any) { 
              //return false;
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
                  const modelView = new akm.cxModelView(utils.createGuid(), modelviewName, curmodel);
                  model.addModelView(modelView);
                  myMetis.addModelView(modelView);
                  const data = new gql.gqlModel(model, true);
                  if (debug) console.log('593 Diagram', data);
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
                e.diagram?.dispatch({ type: 'UPDATE_PROJECT_PROPERTIES', data })
              })
            },
            function (o: any) { 
              if (myMetis.modelType === 'Metamodelling')
                return false;
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
              const gqlModel = new gql.gqlModel(currentModel, true);
              const modifiedModels = new Array();  
              modifiedModels.push(gqlModel);
              modifiedModels?.map(mn => {
                let data = (mn) && mn
                e.diagram?.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
              })
            },
            function (o: any) { 
              if (myMetis.modelType === 'Metamodelling')
                return false;
              return true; 
            }),
          makeButton("Edit Modelview",
            function (e: any, obj: any) {
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
              const gqlModelview = new gql.gqlModelView(currentModelview);
              const modifiedModelviews = new Array();  
              modifiedModelviews.push(gqlModelview);
              modifiedModelviews?.map(mn => {
                let data = (mn) && mn
                e.diagram?.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
              })
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
                    let objview = sel.data.objectview;
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
                if (debug) console.log('1455 myMetis', myMetis);
                const myModel = myMetis.currentModel;
                const gqlModel = new gql.gqlModel(myModel, true);
                const modifiedModels = new Array();
                modifiedModels.push(gqlModel);
                modifiedModels.map(mn => {
                  let data = mn;
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
                modelview.showCardinality = false;
              modelview.showCardinality = !modelview.showCardinality;
              if (!modelview.showCardinality) {
                alert("Cardinality on relationships will NOT be shown!");
              } else {
                alert("Cardinality on relationships WILL be shown!");
              }
              if (debug) console.log('3234 showCardinality', modelview.showCardinality)
              const gqlModelview = new gql.gqlModelView(modelview);
              if (debug) console.log('3236 gqlModelview', gqlModelview);
              const modifiedModelviews = new Array();
              modifiedModelviews.push(gqlModelview);
              modifiedModelviews.map(mn => {
                let data = mn;
                e.diagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
              })
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
              const myModelview = myMetis.currentModelview;
              const myMetamodel = myMetis.currentMetamodel;
              const myGoModel = myMetis.gojsModel;
              if (debug) console.log('2346 myMetis', myMetis);
              myDiagram.myGoModel = myGoModel;
              if (debug) console.log('2345 model, metamodel', myModelview, myModel, myMetamodel, myDiagram.myGoModel);
              uic.verifyAndRepairModel(myModelview, myModel, myMetamodel, myDiagram, myMetis);
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
  
    // Define a Node template
    let nodeTemplate;
    if (true) {
      nodeTemplate =
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
          new go.Binding("layerName", "layer"),
          // { locationSpot: go.Spot.Center},
          new go.Binding("deletable"),
          new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
          {
            toolTip:
              $(go.Adornment, "Auto",
                $(go.Shape, { fill: "lightyellow" }),
                $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                  new go.Binding("text", "", nodeInfo))
              )
          },

          $(go.Shape, 'RoundedRectangle', // Rectangle for cursor alias
            {
              cursor: "alias",        // cursor: "pointer",
              name: 'SHAPE', fill: 'red', stroke: "#fff",  strokeWidth: 2, 
              margin: new go.Margin(1, 1, 1, 1),
              shadowVisible: true,

              desiredSize: new go.Size(158, 68), // outer Shape without icon  // comment out the Icon part
              // desiredSize: new go.Size(198, 68), // outer Shape size with icon

              // set the port properties
              portId: "",
              fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
              toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true},
              // Shape bindings
              new go.Binding('fill', 'fillcolor'),
              new go.Binding('stroke', 'strokecolor'), 
              new go.Binding("stroke", "isHighlighted", function(h, shape) { return h ? "lightblue" : shape.part.data.strokecolor || "black"; })
              .ofObject(),
              // new go.Binding('strokeWidth', 'strokewidth'), //sf:  the linking of relationships does not work if this is uncommented
            { contextMenu: partContextMenu },    
          ),
          $(go.Shape, 'RoundedRectangle',  //smaller transparent rectangle to set cursor to move
            {
              cursor: "move",    
              fill: "transparent",
              stroke: "transparent",
              strokeWidth: 10,
              margin: new go.Margin(1, 1, 1, 1),
              shadowVisible: false,
              desiredSize: new go.Size(136, 48),  
              
            }
     
          ),
      
          $(go.Panel, "Table", // Panel for text and icon ------------------------
            { defaultAlignment: go.Spot.Left, margin: 2, cursor: "move" },
            $(go.RowColumnDefinition, { column: 1, width: 4 }),
            $(go.Panel, "Horizontal",
              // { margin: new go.Margin(10, 10, 10, 10) },
              {
                defaultAlignment: go.Spot.Center
              },



              // comment out icon start
              // $(go.Panel, "Vertical", // Panel for Icon  ------------------------
              //   { contextMenu: partContextMenu , cursor: "move" },
              //   $(go.Panel, "Spot", // icon area
              //     { contextMenu: partContextMenu , cursor: "move" },

              //     $(go.Shape, {  // this is the square around the image ---------
              //       fill: "white", stroke: "#ddd", opacity: 0.4,
              //       desiredSize: new go.Size(56, 56), 
              //       margin: new go.Margin(0, 2, 0, 8),
              //       // shadowVisible: true,
              //     },
              //     new go.Binding("fill", "isHighlighted", function(h) { return h ? "lightblue" : "white"; }).ofObject(),
              //     new go.Binding("stroke", "isHighlighted", function(h) { return h ? "black" : "white"; }).ofObject(),
              //     // new go.Binding("fill", "color"),
              //     new go.Binding("figure")),

              //     $(go.Picture,  // the image -------------------------------------
              //       // { contextMenu: partContextMenu },
              //       {
              //         name: "Picture",
              //         desiredSize: new go.Size(48, 48),
              //         // imageStretch: go.GraphObject.Fill,
              //         // margin: new go.Margin(2, 2, 2, 4),
              //         // margin: new go.Margin(4, 4, 4, 4),
              //       },
              //       new go.Binding("source", "icon", findImage)
              //     ),
              //   ),
              // ),
              // comment out icon stop




              // define the panel where the text will appear
              $(go.Panel, "Table", // separator ---------------------------------
                { contextMenu: partContextMenu , cursor: "move" },
                {
                  defaultRowSeparatorStroke: "black",
                  desiredSize: new go.Size(136, 60),
                  maxSize: new go.Size(140, 66), 
                  // margin: new go.Margin(2),
                  defaultAlignment: go.Spot.Center,
                },
                // $(go.RowColumnDefinition, { column: 2, width: 4 }),
                // content
                $(go.TextBlock, textStyle(),  // the name -----------------------
                  {
                    isMultiline: false,  // don't allow newlines in text
                    editable: true,  // allow in-place editing by user
                    row: 0, column: 0, columnSpan: 6,
                    font: "bold 10pt Segoe UI,sans-serif",
                    // background: "lightgray",
                    minSize: new go.Size(120, 36), 
                    // text: "textAlign: 'center'",
                    textAlign: "center",
                    // alignment: go.Spot.Center,
                    height: 46,
                    // overflow: go.TextBlock.OverflowEllipsis,  // this result in only 2 lines with ... where cut
                    verticalAlignment: go.Spot.Center,
                    // stretch: go.GraphObject.Fill, // added to not resize object
                    // overflow: go.TextBlock.OverflowEllipsis, // added to not resize object
                    margin: new go.Margin(0,2,0,0),
                    name: "name"
                  },        
                  new go.Binding("text", "name").makeTwoWay()
                ),
                new go.Binding("choices"),
                $(go.TextBlock, textStyle(), // the typename  --------------------
                  {
                    row: 1, column: 1, columnSpan: 6,
                    editable: false, isMultiline: false,
                    // minSize: new go.Size(10, 4),
                    margin: new go.Margin(2, 0, 1, 0),  
                    alignment: go.Spot.Center,                  
                  },
                  new go.Binding("text", "typename")
                  //new go.Binding("text", "choices")
                ),
              ),
            ),
          ),
        );
    }
    // Define a link template
    let linkTemplate;
    if (true) {
        const dotted = [3, 3];
        const dashed = [5, 5];

        linkTemplate =
        $(go.Link,
          new go.Binding("deletable"),
          { selectable: true },
          { toShortLength: 3, relinkableFrom: true, relinkableTo: true, reshapable: true },
          // { relinkableFrom: true, relinkableTo: true, toShortLength: 4 },
          // new go.Binding('relinkableFrom', 'canRelink').ofModel(),
          // new go.Binding('relinkableTo', 'canRelink').ofModel(),
          // { selectable: true, selectionAdornmentTemplate: linkSelectionAdornmentTemplate },

          // link route 
          { routing: go.Link.Normal,  corner: 10},  // link route should avoid nodes
          new go.Binding("routing", "routing",
            function(r) {
              switch(r) {
                case 'Normal':
                  return go.Link.Normal;
                case 'Orthogonal':
                  return go.Link.Orthogonal;
                case 'AvoidsNodes':
                  return go.Link.AvoidsNodes;
               default:
                  return go.Link.Normal;
              }
            }
          ),
          new go.Binding("curve", "curve",
            function (c) {
              switch(c) {
                case 'Bezier':
                  return go.Link.Bezier;
                case 'JumpOver':
                  return go.Link.JumpOver;
                case 'JumpGap': 
                  return go.Link.JumpGap;
                default:
                  return "";
              }
            }
          ),
          new go.Binding("points", "points").makeTwoWay(),
          // context menu
          { contextMenu: linkContextMenu },
          // link shape
          $(go.Shape, { stroke: "black", strokeWidth: 1, strokeDashArray: null, shadowVisible: true, },
            new go.Binding("stroke", "strokecolor"),
            new go.Binding("strokeWidth", "strokewidth"),
            new go.Binding("strokeDashArray", "dash", 
              function(d) { return uid.setDashed(d); }),
            ),
          // the "from" arrowhead
          $(go.Shape, { fromArrow: "", stroke: "black" },
            new go.Binding("fromArrow", "fromArrow"),
            new go.Binding("fill", "fromArrowColor"),
            { scale: 1.3, fill: "" }
          ),
          // the "to" arrowhead
          $(go.Shape, { toArrow: "OpenTriangle", stroke: "black" },  
            new go.Binding("toArrow", "toArrow"),
            new go.Binding("fill", "toArrowColor"),
            { scale: 1.3, fill: "white" }
          ),
          // cardinality from
          $(go.TextBlock, "",
              { segmentIndex: NaN, segmentFraction: 0.15},
              { segmentOffset: new go.Point(0, 10) },
              new go.Binding("text", "cardinalityFrom"),
          ),
          // cardinality to
          $(go.TextBlock, "",
            { segmentIndex: NaN, segmentFraction: 0.85},
            { segmentOffset: new go.Point(0, -10) },
            new go.Binding("text", "cardinalityTo"),
          ),
          // link label
          $(go.TextBlock,  "",
            {
              isMultiline: false,  // don't allow newlines in text
              editable: true,  // allow in-place editing by user
            },
            { segmentOffset: new go.Point(0, 10) },
            new go.Binding("text", "name").makeTwoWay(),
          ),
          {
            toolTip:
              $(go.Adornment, "Auto",
                { background: "transparent" },  // avoid hiding tooltip when mouse moves
                $(go.Shape, { fill: "#FFFFCC" }),
                $(go.TextBlock, { margin: 4,  },  // the tooltip shows the result of calling linkInfo(data)
                  new go.Binding("text", "", linkInfo))
              )
          },
        );
    }
    // Define the group template with fixed size containers
    if (true) {
      var groupTemplate =
      $(go.Group, "Auto",
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding("visible"),
        { contextMenu: partContextMenu },
        {
          selectionObjectName: "SHAPE",  // selecting a lane causes the body of the lane to be highlit, not the label
          locationObjectName: "SHAPE",
          resizable: true, resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
          subGraphExpandedChanged: function (grp) {
            var shp = grp.resizeObject;
            if (grp.diagram.undoManager.isUndoingRedoing) return;
            if (grp.isSubGraphExpanded) {
              // shp.height = grp._savedBreadth;
              shp.fill = "white"
            } else {
              // grp._savedBreadth = shp.height;
              // shp.height = NaN;
              shp.fill = "transparent"
            }
          },
        },

        {
          background: "transparent",
          ungroupable: true,
          // highlight when dragging into the Group
          mouseDragEnter: function (e, grp, prev) { highlightGroup(e, grp, true); },
          mouseDragLeave: function (e, grp, next) { highlightGroup(e, grp, false); },
          computesBoundsAfterDrag: true,
          // when the selection is dropped into a Group, add the selected Parts into that Group;
          // if it fails, cancel the tool, rolling back any changes
          // mouseDrop: finishDrop,
          handlesDragDropForMembers: true,  // don't need to define handlers on member Nodes and Links
          // Groups containing Nodes lay out their members vertically
          //layout: $(go.TreeLayout)
        },
        //new go.Binding("layout", "groupLayout"),
        new go.Binding("background", "isHighlighted",
          function (h) {
            return h ? "rgba(255,0,0,0.2)" : "transparent"; // this is te background of all
            }
        ).ofObject(),
        {
          toolTip:
            $(go.Adornment, "Auto",
              $(go.Shape, { fill: "lightyellow" }),
              $(go.TextBlock, { margin: 4 },  // the tooltip shows the result of calling nodeInfo(data)
                new go.Binding("text", "", nodeInfo))
            )
        },
        $(go.Shape, "RoundedRectangle", // surrounds everything
          // {
          //   stroke: "gray", strokeWidth: "1",
          // },
          // new go.Binding("stroke", "strokecolor"),
          // new go.Binding("strokeWidth", "strokewidth"),
          {
            cursor: "alias",
            fill: "transparent", 
            // stroke: "black", 
            shadowVisible: true,
            // strokeWidth: 1,
            minSize: new go.Size(20, 30),
            portId: "", 
            fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
            toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true,
          },
          new go.Binding("fill", "fillcolor"),
          new go.Binding("stroke", "strokecolor"),
          // new go.Binding("strokeWidth", "strokewidth"),
        ),
        $(go.Panel,  // the header
          // $(go.TextBlock,     // group title in the background
          //   {
          //     alignment: new go.Spot(0,0),
          //     // defaultAlignment: go.Spot.Top,
          //     font: "Bold 24pt Sans-Serif",
          //     // margin: new go.Margin(0, 0, 0, 0),
          //     editable: true, isMultiline: true,
          //     name: "name"
          //   },
          //   new go.Binding("text", "name").makeTwoWay()
          // ),
          $(go.Picture, //"actualBounds",                  // the image
            {
              name: "Picture",
              stretch:  go.GraphObject.Fill,
              imageStretch:  go.GraphObject.Fill,
              // minSize: new go.Size(120, 80),
              // desiredSize: new go.Size(600, 400),
              // minSize: new go.Binding("minSize", "size"),
              // margin: new go.Margin(0, 0, 0, 0),
            },
            // new go.Binding("minSize", "size"),
            // new go.Binding("desiredSize", "size"),
            new go.Binding("source", "icon", findImage)
          ),
        ), 
        $(go.Panel, "Vertical",  // position header above the subgraph
          {
            name: "HEADER",
            defaultAlignment: go.Spot.TopLeft
          },
          $(go.Panel, "Horizontal",  // the header
            { defaultAlignment: go.Spot.Top },
            $("SubGraphExpanderButton",
            {margin: new go.Margin(1, 2, 1, 4),
            scale: 1.5},
            // {margin: new go.Margin(4, 0, 0, 4)},
            ),  // this Panel acts as a Button
            
            $(go.TextBlock,     // group title near top, next to button
              {
                font: "Bold 16pt Sans-Serif",
                margin: new go.Margin(4, 0, 0, 2),
                editable: true, isMultiline: false,
                name: "name"
              },
              new go.Binding("text", "name").makeTwoWay()
            ),
            $(go.TextBlock, textStyle(), // the typename
            {
              row: 1, column: 1, columnSpan: 6, textAlign: "end",
              editable: false, isMultiline: false,
              minSize: new go.Size(10, 4),
              margin: new go.Margin(2, 0, 0, 2)
            },
            // new go.Binding("text", "typename")
            //new go.Binding("text", "choices")
          ),
          ), // End Horizontal Panel
          $(go.Shape,  // using a Shape instead of a Placeholder - this is open container
            {
              // name: "SHAPE", //fill: "rgba(228,228,228,0.53)",
              // name: "SHAPE", fill: "transparent",
              name: "SHAPE", fill: "white",
              opacity: 0.95,
              minSize: new go.Size(180, 120), 
              desiredSize: new go.Size(300, 200),
              margin: new go.Margin(0, 1, 1, 4),
              cursor: "move",
            },
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
            new go.Binding("isSubGraphExpanded").makeTwoWay(),
            
          ),
        ),

      )      
    }

    // define template maps
    if (true) {
      // Define node template map
      let nodeTemplateMap = new go.Map<string, go.Part>();
      nodeTemplateMap.add("", nodeTemplate);
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

      // Define link template map
      let linkTemplateMap = new go.Map<string, go.Link>();
      linkTemplateMap.add("", linkTemplate);

      // This template shows links connecting with label nodes as green and arrow-less.
      if (linkToLink) {
        myDiagram.linkTemplateMap.add("linkToLink",
          $("Link",
            { relinkableFrom: false, relinkableTo: false },
            $("Shape", { stroke: "#2D9945", strokeWidth: 2 })
          ));
      }

      // Define group template map
      let groupTemplateMap = new go.Map<string, go.Group>();
      groupTemplateMap.add("", groupTemplate);

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
    if (true) {
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
              $(go.TextBlock, textStyle(),  // the name
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

    // Function to identify images related to an image id
    function findImage(image: string) {
      if (!image)
        return "";
      // if (image.substring(0,4) === 'http') { // its an URL
      if (image.includes('//')) { // its an URL   
        // if (debug) console.log('1269 Diagram', image);
        return image
      } else if (image.includes('/')) { // its a local image
        if (debug) console.log('1270 Diagram', image);   
        return image
      } else if (image.includes('.') === false) { // its a 2character icon 1st with 2nd as subscript
        const firstcharacter = image.substring(0, 1)
        const secondcharacter = image.substring(1, 2)
        if (debug) console.log('1099 Diagram', firstcharacter, secondcharacter)    
        // } else if (image.substring(image.length - 4) === '.svg') { //sf tried to use svg data but did not work
        //   const letter = image.substring(0, image.length - 4)
        //   // const lettersvg = letter
        //   if (debug) console.log('1058 Diagram', letter, svgs[letter])
        //   return svgs[letter].svg //svgs[`'${letter}'`]
        // } else if (image.includes('fakepath')) { // its a local image
        //   console.log('3025', image);
        //   console.log("3027 ./../images/" + image.replace(/C:\\fakepath\\/,'')) //its an image in public/images
        //   return "./../images/" + image.replace(/C:\\fakepath\\/,'') //its an image in public/images
      } else if (image.includes('<svg')) { // its an icon font
        const img = {image:'data:image/svg+xml;charset=UTF-8,image'}
        console.log('3585', img);
        return img

      } else { 
        if (debug) console.log('1283 Diagram', image);
        return "./../images/" + image //its an image in public/images
      }
      return "";
    }

    // Function to specify default text style
    function textStyle() {
      return { font: "9pt  Segoe UI,sans-serif", stroke: "black" };
    }

    // Function to highlight group
    function highlightGroup(e: any, grp: any, show: boolean) {
      if (!grp) return;
      e.handled = true;
      if (show) {
        // cannot depend on the grp.diagram.selection in the case of external drag-and-drops;
        // instead depend on the DraggingTool.draggedParts or .copiedParts
        var tool = grp.diagram.toolManager.draggingTool;
        var map = tool.draggedParts || tool.copiedParts;  // this is a Map
        // now we can check to see if the Group will accept membership of the dragged Parts
        if (grp.canAddMembers(map.toKeySet())) {
          grp.isHighlighted = true;
          return;
        }
      }
      grp.isHighlighted = false;
    }
  }

  public render() {
    if (debug) console.log('2804 Diagram', this.props.nodeDataArray);
    if (debug) console.log('2805 Diagram', this.props.linkDataArray);

    if (debug) console.log('2807 Diagram ', this.state.selectedData, this.state.myMetis);
    
    let modalContent, inspector, selector, header, category, typename;
    const modalContext = this.state.modalContext;
    if (debug) console.log('2811 modalContext ', modalContext);
    const icon = modalContext?.icon;

    switch (modalContext?.what) {      
      case 'selectDropdown': 
        let options =  '' 
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
        else {
            options = this.state.selectedData.map(o => o && {'label': o, 'value': o});
            comps = null
        }
        if (debug) console.log('2296 options', options);
        const { selectedOption } = this.state;

        const value = (selectedOption)  ? selectedOption.value : options[0]

        if (debug) console.log('2173 Diagram ', selectedOption, this.state.selectedOption, value);
        header = modalContext.title;
        modalContent = 
          <div className="modal-selection d-flex justify-content-center">
            <Select className="modal-select"
              options={options}
              components={comps}
              onChange={value => this.handleSelectDropdownChange(value)}
              value={value}
            />
          </div>
          {/* <option value={option.value}>{label: option.label, option.value}</option>
          */}
      
      break;
      // case 'editProject':
      // case 'editModel':
      // case 'editModelview':
      case 'editObjectType':
      case 'editObject':
      case 'editObjectview':
        header = modalContext.title;
        category = this.state.selectedData.category;
        typename = (modalContext.typename) ? '('+modalContext.typename+')' : '('+this.state.selectedData.object?.typeName+')'
        // typename = '('+this.state.selectedData.object?.typeName+')'
        if (debug) console.log('3343 Diagram ', icon, typename, modalContext, this.state.selectedData);
        
        if (this.state.selectedData !== null && this.myMetis != null) {
          if (debug) console.log('3346 Diagram ', this.state.selectedData, this.myMetis);
          modalContent = 
            <div className="modal-prop">
              <SelectionInspector 
                myMetis       ={this.myMetis}
                selectedData  ={this.state.selectedData}
                context       ={this.state.modalContext}
                onInputChange ={this.handleInputChange}
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
        if (debug) console.log('3108 category ', category);
      
        if (this.state.selectedData !== null && this.myMetis != null) {
          if (debug) console.log('3111 Diagram ', this.state, this.myMetis);
          modalContent = 
            <div className="modal-prop" >
              <SelectionInspector 
                myMetis       ={this.myMetis}
                selectedData  ={this.state.selectedData}
                context       ={this.state.modalContext}
                onInputChange ={this.handleInputChange}
              />
            </div>
          }
        }
      break;
      default:
        break;
    }
    if (debug) console.log('3127 last in Diagram ', this.props);
    
    return (
      <div>
        <ReactDiagram 
          ref={this.diagramRef}
          divClassName='diagram-component'
          initDiagram={this.initDiagram}
          nodeDataArray={this.props.nodeDataArray}
          linkDataArray={this.props.linkDataArray}
          myMetis={this.props.myMetis}
          modelData={this.props.modelData}
          modelType={this.props.modelType}
          onModelChange={this.props.onModelChange}
          skipsDiagramUpdate={this.props.skipsDiagramUpdate}
        />
        <Modal className="" isOpen={this.state.showModal}  >
          {/* <div className="modal-dialog w-100 mt-5">
            <div className="modal-content"> */}
              <div className="modal-head">
                <Button className="modal-button btn-sm float-right m-1" color="link" 
                  // onClick={() => { this.setState({showModal: false}) }} ><span>x</span>
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
        <style jsx>{`
        
        `}
        </style> 
      </div>
    );
  }
}
