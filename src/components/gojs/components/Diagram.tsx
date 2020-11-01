// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;

import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import * as React from 'react';
import * as akm from '../../../akmm/metamodeller';
import * as gjs from '../../../akmm/ui_gojs';
import * as gql from '../../../akmm/ui_graphql';
import * as uic from '../../../akmm/ui_common';
import * as gen from '../../../akmm/ui_generateTypes';
import * as utils from '../../../akmm/utilities';
import * as constants from '../../../akmm/constants';
const glb = require('../../../akmm/akm_globals');

//import * as uic from '../../../Server/src/akmm/ui_common'; 

import { GuidedDraggingTool } from '../GuidedDraggingTool';
import LoadLocal from '../../../components/LoadLocal'
import { FaTumblrSquare } from 'react-icons/fa';
// import * as svgs from '../../utils/SvgLetters'
import svgs from '../../utils/Svgs'
//import { stringify } from 'querystring';
// import './Diagram.css';

const AllowTopLevel = true;

interface DiagramProps {
  nodeDataArray:      Array<go.ObjectData>;
  linkDataArray:      Array<go.ObjectData>;
  modelData:          go.ObjectData;
  myMetis:            akm.cxMetis;
  dispatch:           any;  
  skipsDiagramUpdate: boolean;
  onDiagramEvent:     (e: go.DiagramEvent) => void;
  onModelChange:      (e: go.IncrementalData) => void;
}

export class DiagramWrapper extends React.Component<DiagramProps, {}> {

  
  /**
   * Ref to keep a reference to the Diagram component, which provides access to the GoJS diagram via getDiagram().
   */
  private diagramRef: React.RefObject<ReactDiagram>;
  /** @internal */
  constructor(props: DiagramProps) {
    super(props);
    this.diagramRef = React.createRef();
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
      //diagram.addDiagramListener('ChangedSelection', this.props.onDiagramEvent);
      diagram.addDiagramListener('SelectionMoved', this.props.onDiagramEvent);
      diagram.addDiagramListener('SelectionCopied', this.props.onDiagramEvent);
      diagram.addDiagramListener('SelectionDeleted', this.props.onDiagramEvent);
      diagram.addDiagramListener('ExternalObjectsDropped', this.props.onDiagramEvent);
      diagram.addDiagramListener('LinkDrawn', this.props.onDiagramEvent);
      diagram.addDiagramListener('LinkRelinked', this.props.onDiagramEvent);
      diagram.addDiagramListener('SelectionMoved', this.props.onDiagramEvent);
      diagram.addDiagramListener('SelectionDeleted', this.props.onDiagramEvent);
      diagram.addDiagramListener('ClipboardChanged', this.props.onDiagramEvent);
      diagram.addDiagramListener('ClipboardPasted', this.props.onDiagramEvent);
      diagram.addDiagramListener('ObjectSingleClicked', this.props.onDiagramEvent);
      diagram.addDiagramListener('PartResized', this.props.onDiagramEvent);
      diagram.addDiagramListener('BackgroundDoubleClicked', this.props.onDiagramEvent);

      // diagram.addModelChangedListener(function(evt) {
      //   // ignore unimportant Transaction events
      //   if (!evt.isTransactionFinished) return;
      //   var txn = evt.object;  // a Transaction
      //   if (txn === null) return;
      //   // iterate over all of the actual ChangedEvents of the Transaction
      //   txn.changes?.each(function(e) {
      //       return onModelChanged(e, evt, myDiagram);  
      //   });
      // });  
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
      //diagram.removeDiagramListener('ChangedSelection', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionMoved', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionCopied', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionDeleted', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ExternalObjectsDropped', this.props.onDiagramEvent);
      diagram.removeDiagramListener('LinkDrawn', this.props.onDiagramEvent);
      diagram.removeDiagramListener('LinkRelinked', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionMoved', this.props.onDiagramEvent);
      diagram.removeDiagramListener('SelectionDeleted', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ClipboardChanged', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ClipboardPasted', this.props.onDiagramEvent);
      diagram.removeDiagramListener('ObjectSingleClicked', this.props.onDiagramEvent);
      diagram.removeDiagramListener('PartResized', this.props.onDiagramEvent);
      diagram.removeDiagramListener('BackgroundDoubleClicked', this.props.onDiagramEvent);
    }
  }

  // public onModelChanged(e, evt, diagram) {
  //   if (debug) console.log('onModelChanged called!');
  // } 



  /**
   * Diagram initialization method, which is passed to the ReactDiagram component.
   * This method is responsible for making the diagram and initializing the model, any templates,
   * and maybe doing other initialization tasks like customizing tools.
   * The model's data should not be set here, as the ReactDiagram component handles that.
   */


  private initDiagram(): go.Diagram {
    const $ = go.GraphObject.make;
    // go.GraphObject.fromLinkableDuplicates = true;
    // go.GraphObject.toLinkableDuplicates   = true;

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
            'undoManager.maxHistoryLength': 0,  // uncomment disable undo/redo functionality
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
              "relshipkind": constants.relkinds.REL
            },
            "clickCreatingTool.archetypeNodeData": {
              "key": utils.createGuid(),
              "category": "Object",
              "name": "Generic Object",
              "description": "",
              "strokecolor": "black",
              "strokewidth": "6",
              "icon": "default.png"
            },
            // allow Ctrl-G to call groupSelection()
            "commandHandler.archetypeGroupData": {
              text: "Group",
              isGroup: true,
              color: "blue"
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
                linkKeyProperty: 'key'
              })
          }
        );
    }
    myDiagram.myMetis = this.myMetis;
    myDiagram.myGoModel = this.myGoModel;
    myDiagram.myGoMetamodel = this.myGoMetamodel;
    myDiagram.layout.isInitial = false;
    myDiagram.layout.isOngoing = false;
    myDiagram.dispatch = this.myMetis?.dispatch;
    myDiagram.toolTip =
      $("ToolTip",
        $(go.TextBlock, { margin: 4 },
          // use a converter to display information about the diagram model
          new go.Binding("text", "", diagramInfo))
      );
    //myDiagram.dispatch ({ type: 'SET_MYMETIS_MODEL', myMetis });

    // Tooltip functions
    function nodeInfo(d) {  // Tooltip info for a node data object
      if (debug) console.log('223 nodeInfo', d);
      const properties = 
      (d.object.type.properties.length > 0) && 
      d.object.type.properties.map(p => {
          return "\n - " +  p.name +": _______" 
      })
      var str = "Name: " + d.name;
      if (d.group)
        str += str + "member of " + d.group;
      else
        str += "\n " + "Attributes: " + properties + "\n" 
        str += "\n" + "Type: " + d.type;
      return str;
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
      if (debug) console.log('229 linkInfo', d);
      let str = "Link: ";
      str += d.name + " (" + typename + ")\n";
      str += "from: " + fromObj?.name + "\n";
      str += "to: " + toObj?.name;
      return str;
    }

    function diagramInfo(model: any) {  // Tooltip info for the diagram's model
      if (debug) console.log('231 diagramInfo', model);
      let str = "Model:\n";
      str += model.nodeDataArray.length + " nodes, ";
      str += model.linkDataArray.length + " links";
      return str;
    }


    // A Context Menu is an Adornment with a bunch of buttons in them
    // Nodes context menu
    if (true) {
      var partContextMenu =
        $(go.Adornment, "Vertical",
          makeButton("Set Object type",
            function (e: any, obj: any) {
              const node = e.diagram.selection.first().data;
              if (debug) console.log('273 node', node);
              const objtypes = myMetis.getObjectTypes();
              if (debug) console.log('275 Set object type', objtypes);
              let defText  = "";
              if (objtypes) {
                  node.choices = [];
                  for (let i=0; i<objtypes.length; i++) {
                      const otype = objtypes[i];
                      if (!otype.deleted && !otype.abstract) {
                          node.choices.push(otype.name); 
                          if (otype.name === 'Generic')
                            defText = otype.name;
                      }  
                  }
              }
              let objtype = prompt('Enter one of: ' + node.choices, defText);
              const context = {
                "myMetis":      myMetis,
                "myMetamodel":  myMetis.currentMetamodel,
                "myModel":      myMetis.currentModel,
                "myModelView":  myMetis.currentModelview,
                "myDiagram":    e.diagram,
                "dispatch":     e.diagram.dispatch
              }
              const objview = uic.setObjectType(node, objtype, context);
              const gqlObjview = new gql.gqlObjectView(objview);
              const modifiedObjectViews = new Array();
              modifiedObjectViews.push(gqlObjview);
              modifiedObjectViews.map(mn => {
                let data = mn;
                e.diagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
              })
              const object = myMetis.findObject(objview?.object?.id);
                if (object) {
                  const gqlObject = new gql.gqlObject(object);
                  const modifiedObjects = new Array();
                  modifiedObjects.push(gqlObject);
                  modifiedObjects.map(mn => {
                    let data = mn;
                    e.diagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
                  })
                }
          },
            function (o: any) {
              const node = o.part.data;
              if (node.category === 'Object') {
                return true;
              } else {
                return false;
              }
          }),
          makeButton("New Typeview",
            function (e: any, obj: any) { 
              const node = obj.part.data;
              if (debug) console.log('313 node', node);
              const currentObject = myMetis.findObject(node.object.id)
              const currentObjectView =  myMetis.findObjectView(node.objectview.id);
              if (debug) console.log('316 obj and objview', currentObject, currentObjectView);
              if (currentObject && currentObjectView) {                   
                const myMetamodel = myMetis.currentMetamodel;
                const objtype  = currentObject.type;
                let typeview = currentObjectView.typeview;
                const defaultTypeview = objtype.typeview;
                if (debug) console.log('322 node', objtype, defaultTypeview, typeview);
                if (!typeview || (typeview.id === defaultTypeview.id)) {
                    const id = utils.createGuid();
                    typeview = new akm.cxObjectTypeView(id, id, objtype, "");
                    typeview.data = defaultTypeview.data;
                    typeview.data.fillcolor = "lightgray";
                    typeview.modified = true;
                    currentObjectView.typeview = typeview;
                    myMetamodel.addObjectTypeView(typeview);
                    myMetis.addObjectTypeView(typeview);
                    if (debug) console.log('329 myMetis', currentObjectView, typeview, myMetis);
                  }              
                const gqlObjtypeView = new gql.gqlObjectTypeView(typeview);
                if (debug) console.log('332 gqlObjtypeView', gqlObjtypeView);
                const modifiedTypeViews = new Array();
                modifiedTypeViews.push(gqlObjtypeView);
                modifiedTypeViews.map(mn => {
                  let data = mn;
                  e.diagram.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
                })
                const gqlObjView = new gql.gqlObjectView(currentObjectView);
                if (debug) console.log('340 gqlObjView', gqlObjView);
                const modifiedObjectViews = new Array();
                modifiedObjectViews.push(gqlObjView);
                modifiedObjectViews.map(mn => {
                  let data = mn;
                  e.diagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
                })              
              }
            },
            function (o: any) {
              const currentObject = o.part.data.object; 
              const currentObjectView = o.part.data.objectview;
              if (currentObject && currentObjectView) {                   
                let objtype  = currentObject.type;
                let typeView = currentObjectView.typeview;
                let defaultTypeview = objtype.typeview;
                if (debug) console.log('358 typeview, defaultTypeview', typeview, defaultTypeview);
                if (typeView && (typeView.id === defaultTypeview.id)) {
                  return true;
                }
              }
              return false;
            }),
          makeButton("Generate Datatype",
            function(e: any, obj: any) { 
                const context = {
                  "myMetis":            myMetis,
                  "myMetamodel":        myMetis.currentMetamodel,
                  "myTargetMetamodel":  myMetis.currentTargetMetamodel,
                  "myModel":            myMetis.currentModel,
                  "myModelView":        myMetis.currentModelview,
                  "myDiagram":          e.diagram,
                  "dispatch":           e.diagram.dispatch
                }
                if (!myMetis.currentTargetMetamodel)
                    myMetis.currentTargetMetamodel = myMetis.currentMetamodel;
                const contextmenu = obj.part;  
                const part = contextmenu.adornedPart; 
                const currentObj = part.data.object;
                context.myTargetMetamodel = gen.askForTargetMetamodel(context);
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
                const gqlDatatype = new gql.gqlDatatype(dtype);
                const modifiedDatatypes = new Array();
                modifiedDatatypes.push(gqlDatatype);
                modifiedDatatypes.map(mn => {
                  let data = mn;
                  e.diagram.dispatch({ type: 'UPDATE_DATATYPE_PROPERTIES', data })
                })

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
                "myModelView":        myMetis.currentModelview,
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
              let obj = o.part.data.object;
              let objtype = obj.type;
              if (objtype.name === constants.types.AKM_UNIT)
                  return true;
              else
                  return false;
         }),
          makeButton("Generate Object Type",
            function(e: any, obj: any) { 
                const context = {
                  "myMetis":            myMetis,
                  "myMetamodel":        myMetis.currentMetamodel,
                  "myTargetMetamodel":  myMetis.currentTargetMetamodel,
                  "myModel":            myMetis.currentModel,
                  "myCurrentModelview": myMetis.currentModelview,
                  "myDiagram":          e.diagram,
                  "myProperties":       new Array(),
                  "dispatch":           e.diagram.dispatch
                  }
                if (debug) console.log('441 myMetis', myMetis);
                const contextmenu = obj.part;  
                const part = contextmenu.adornedPart; 
                const currentObj = part.data.object;
                context.myTargetMetamodel = myMetis.currentTargetMetamodel;
                if (debug) console.log('446 context', context);
                //if (!context.myTargetMetamodel) {
                  context.myTargetMetamodel = gen.askForTargetMetamodel(context, false);
                  if (context.myTargetMetamodel?.name === "EKA Metamodel") {  
                      alert("EKA Metamodel is not valid as Target metamodel!"); // sf dont generate on EKA Metamodel
                      context.myTargetMetamodel = null;
                  } else if (context.myTargetMetamodel == undefined)  // sf
                    context.myTargetMetamodel = null;
                //}
                myMetis.currentTargetMetamodel = context.myTargetMetamodel;
                if (debug) console.log('456 Generate Object Type', context.myTargetMetamodel, myMetis);
                if (context.myTargetMetamodel) {  
                  myMetis.currentModel.targetMetamodelRef = context.myTargetMetamodel?.id;
                  if (debug) console.log('459 Generate Object Type', context, myMetis.currentModel.targetMetamodelRef);
                  const gqlModel = new gql.gqlModel(context.myModel, true);
                  const modifiedModels = new Array();
                  modifiedModels.push(gqlModel);
                  modifiedModels.map(mn => {
                    let data = mn;
                    e.diagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
                  })
                  if (debug) console.log('467 gqlModel', gqlModel);
                  const currentObjview = part.data.objectview;
                  const objtype = gen.generateObjectType(currentObj, currentObjview, context);
                  if (debug) console.log('470 Generate Object Type', objtype, myMetis);
                  // First handle properties
                  const modifiedProperties = new Array();
                  const props = objtype.properties;
                  for (let i=0; i<props?.length; i++) {
                      const gqlProp = new gql.gqlProperty(props[i]);
                      modifiedProperties.push(gqlProp);
                      modifiedProperties.map(mn => {
                        let data = mn;
                        e.diagram.dispatch({ type: 'UPDATE_TARGETPROPERTY_PROPERTIES', data })
                      });
                  }
                  if (debug) console.log('489 modifiedProperties', currentObjview, objtype.properties, modifiedProperties);

                  const gqlObjectType = new gql.gqlObjectType(objtype);
                  if (debug) console.log('491 Generate Object Type', gqlObjectType);
                  const modifiedTypeNodes = new Array();
                  modifiedTypeNodes.push(gqlObjectType);
                  modifiedTypeNodes.map(mn => {
                    let data = mn;
                    e.diagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPE_PROPERTIES', data })
                  });
                  if (debug) console.log('498 myMetis', modifiedTypeNodes, myMetis);

                  const gqlObjTypeview = new gql.gqlObjectTypeView(objtype.typeview);
                  if (debug) console.log('501 Generate Object Type', gqlObjTypeview);
                  const modifiedTypeViews = new Array();
                  modifiedTypeViews.push(gqlObjTypeview);
                  modifiedTypeViews?.map(mn => {
                    let data = (mn) && mn
                    e.diagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES', data })
                  })
                  const geo = context.myTargetMetamodel.findObjtypeGeoByType(objtype);
                  const gqlObjTypegeo = new gql.gqlObjectTypegeo(geo);
                  if (debug) console.log('510 Generate Object Type', gqlObjTypegeo, myMetis);
                  const modifiedGeos = new Array();
                  modifiedGeos.push(gqlObjTypegeo);
                  modifiedGeos?.map(mn => {
                    let data = (mn) && mn
                    e.diagram.dispatch({ type: 'UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES', data })
                  })
                  if (debug) console.log('517 myMetis', modifiedGeos, myMetis);                                    // Then handle the object type
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
          makeButton("Cut",
            function (e: any, obj: any) { e.diagram.commandHandler.cutSelection(); },
            function (o: any) { 
              const node = o.part.data;
              if (node.class === 'goObjectTypeNode') {
                return false;
              }
              return o.diagram.commandHandler.canCutSelection(); 
            }),
          makeButton("Copy",
            function (e: any, obj: any) { e.diagram.commandHandler.copySelection(); },
            function (o: any) { 
              const node = o.part.data;
              if (node.class === 'goObjectTypeNode') 
                return false;
              return o.diagram.commandHandler.canCopySelection(); 
            }),
          makeButton("Paste",
            function (e: any, obj: any) {
              const currentModel = myMetis.currentModel;
              currentModel.pasteViewsOnly = false;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
            },
            function (o: any) { return o.diagram.commandHandler.canPasteSelection(); }),
          makeButton("Paste View",
            function (e: any, obj: any) {
              const currentModel = myMetis.currentModel;
              currentModel.pasteViewsOnly = true;
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
          makeButton("Delete",
            function (e: any, obj: any) {
              const currentModel = myMetis.currentModel;
              currentModel.deleteViewsOnly = false;
              e.diagram.commandHandler.deleteSelection();
            },
            function (o: any) { 
              // const node = o.part.data;
              // //if (debug) console.log('585 Delete', node);
              // if (node.class === 'goObjectTypeNode') {
              //     //return o.diagram.commandHandler.canDeleteSelection();                
              //     const objtype = node.objtype;
              //     if (debug) console.log('588 Delete', objtype);
              //     const objects = myMetis.getObjectsByType(objtype, true);
              //     if (debug) console.log('591 Delete', objects);
              //     if (objects) {
              //       if (debug) console.log('593 Delete', 'Objects found');
              //       return false;
              //     } else {
              //         if (debug) console.log('596 Delete', 'No objects found');
              //         return o.diagram.commandHandler.canDeleteSelection(); 
              //      }
              // } else {
              //     return o.diagram.commandHandler.canDeleteSelection(); 
              // }
              return o.diagram.commandHandler.canDeleteSelection(); 
            }),
          makeButton("Delete View",
            function (e: any, obj: any) {
              const myModel = myMetis.currentModel;
              myModel.deleteViewsOnly = true;
              const gqlModel = new gql.gqlModel(myModel, true);
              const modifiedModels = new Array();
              modifiedModels.push(gqlModel);
              modifiedModels.map(mn => {
                let data = mn;
                e.diagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
              })
              if (debug) console.log('603 Delete View', gqlModel, myMetis);
              e.diagram.commandHandler.deleteSelection();
            },
            function (o: any) { 
              const node = o.part.data;
              if (node.class === 'goObjectNode') {
                return o.diagram.commandHandler.canDeleteSelection();
              } else {
                return false;
              }
            }),
          // makeButton("Undo",
          //   function (e: any, obj: any) { e.diagram.commandHandler.undo(); },
          //   function (o: any) { return o.diagram.commandHandler.canUndo(); }),
          // makeButton("Redo",
          //   function (e: any, obj: any) { e.diagram.commandHandler.redo(); },
          //   function (o: any) { return o.diagram.commandHandler.canRedo(); }),
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

    // A Context menu for links    
    if (true) {
      var linkContextMenu =
        $(go.Adornment, "Vertical",
          makeButton("Set Relationship type",
            function (e, obj) {
              const myGoModel = myMetis.gojsModel;
              const link = obj.part.data;
              if (debug) console.log('666 link', link, myDiagram, myGoModel);
              let fromNode = myGoModel?.findNode(link.from);
              let toNode   = myGoModel?.findNode(link.to);
              if (debug) console.log('669 from and toNode', fromNode, toNode);
              const fromType = fromNode?.objecttype;
              const toType   = toNode?.objecttype;
              if (debug) console.log('672 link', fromType, toType);
              const reltypes = myMetis.findRelationshipTypesBetweenTypes(fromType, toType);
              let   defText  = "";
              link.choices = [];
              if (debug) console.log('675 createRelationship', reltypes, myMetis);
              if (reltypes) {
                  for (let i=0; i<reltypes.length; i++) {
                      const rtype = reltypes[i];
                      link.choices.push(rtype.name);  
                      if (rtype.name === 'isRelatedTo')
                          defText = rtype.name;
                  }
              }
              let reltype = prompt('Enter one of: ' + link.choices, defText);
              const context = {
                "myMetis":      myMetis,
                "myMetamodel":  myMetis.currentMetamodel,
                "myModel":      myMetis.currentModel,
                "myModelView":  myMetis.currentModelview,
                "myDiagram":    e.diagram,
                "dispatch":     e.diagram.dispatch
              }
              const relview = uic.setRelationshipType(link, reltype, context);
              if (!relview) return;
              const gqlRelView = new gql.gqlRelshipView(relview);
              if (debug) console.log('308 SetReltype', link, gqlRelView);
              const modifiedRelshipViews = new Array();
              modifiedRelshipViews.push(gqlRelView);
              modifiedRelshipViews.map(mn => {
                let data = mn;
                e.diagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
              })
              const relship = myMetis.findRelationship(relview?.relship.id);
              const gqlRelship = (relship) && new gql.gqlRelationship(relship);
              const modifiedRelships = new Array();
              modifiedRelships.push(gqlRelship);
              modifiedRelships.map(mn => {
                let data = mn;
                (mn) && e.diagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
              })              
            },
            function (o) {
              const link = o.part.data;
              if (link.category === 'Relationship') {
                return true;
              } else {
                return false;
              }
          }),
          makeButton("New Typeview",
            function (e: any, obj: any) { 
              //const link = e.diagram.selection.first().data;
              const link = obj.part.data;
              if (link.class === 'goRelshipLink') {
                const currentRelship = myMetis.findRelationship(link.relship.id);
                const currentRelshipView = myMetis.findRelationshipView(link.relshipview.id);
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
                      myMetamodel.addRelationshipTypeView(typeview);
                      myMetis.addRelationshipTypeView(typeview);
                      if (debug) console.log('712 myMetis', currentRelshipView, typeview, myMetis);
                    }    
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
            },
            function (o: any) {
              const link = o.part.data;
              if (link.class === 'goRelshipLink') {
                const currentRelship = link.relship;
                const currentRelshipView = link.relshipview;
                if (currentRelship && currentRelshipView) {                   
                  const reltype  = currentRelship.type;
                  const typeView = currentRelshipView.typeview;
                  const defaultTypeview = reltype.typeview;
                  if (typeView && (typeView.id === defaultTypeview.id)) {
                    return true;
                  }
                }
              }
              else if (link.class === 'goRelshipTypeLink') {
                  return false;
              }
              return false;
            }),
          makeButton("Generate Relationship Type",             
            function (e: any, obj: any) { 
            },
            function(o: any) { 
              const test = false;
              if (test)
                return true;
              else
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
              e.diagram.commandHandler.deleteSelection();
            },
            function (o) { 
            //   const link = o.part.data;
            //   //if (debug) console.log('383 Delete', link);
            //   if (link.class === 'goRelshipTypeLink') {
            //     //return o.diagram.commandHandler.canDeleteSelection();                
            //     const reltype = link.reltype;
            //     if (debug) console.log('387 Delete', reltype);
            //     const relships = myMetis.getRelationshipsByType(reltype, true);
            //     if (debug) console.log('390 Delete', relships);
            //     if (relships) {
            //       if (debug) console.log('390 Delete', 'Relstionships found');
            //       return false;
            //     } else {
            //         if (debug) console.log('393 Delete', 'No relstionships found');
            //         return o.diagram.commandHandler.canDeleteSelection(); 
            //      }
            // } else {
            //     return o.diagram.commandHandler.canDeleteSelection(); 
            // }
            return o.diagram.commandHandler.canDeleteSelection(); 
            }),
          makeButton("Delete View",
            function (e, obj) {
              myMetis.currentModel.deleteViewsOnly = true;
              e.diagram.dispatch ({ type: 'SET_MYMETIS_MODEL', myMetis });
              const myGoModel = myDiagram.myGoModel;
              e.diagram.dispatch({ type: 'SET_MY_GOMODEL', myGoModel });
              e.diagram.commandHandler.deleteSelection();
            },
            function (o) { 
              const link = o.part.data;
              if (link.category === 'Relationship') {
                return o.diagram.commandHandler.canDeleteSelection(); 
              } else {
                return false;
              }
            }),
          // makeButton("Undo",
          //            function(e, obj) { e.diagram.commandHandler.undo(); },
          //            function(o) { return o.diagram.commandHandler.canUndo(); }),
          // makeButton("Redo",
          //            function(e, obj) { e.diagram.commandHandler.redo(); },
          //            function(o) { return o.diagram.commandHandler.canRedo(); })
        );
    }

    // A context menu for the background of the Diagram, when not over any Part
    if (true) {
      myDiagram.contextMenu =
        $(go.Adornment, "Vertical",
          makeButton("New Metamodel",
          function (e: any, obj: any) {
            const context = {
              "myMetis":            myMetis,
              "myMetamodel":        myMetis.currentMetamodel
            }
            const metamodel = gen.askForMetamodel(context, true);
            if (debug) console.log('760 New Metamodel', metamodel);
            if (metamodel) {
              const gqlMetamodel = new gql.gqlMetaModel(metamodel, true);
              if (debug) console.log('763 New Metamodel', gqlMetamodel);
              const modifiedMetamodels = new Array();
              modifiedMetamodels.push(gqlMetamodel);
              modifiedMetamodels.map(mn => {
                  let data = mn;
                  if (debug) console.log('768 data', data);
                  e.diagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data })
              });
            }
          },
          function (o: any) {
            return true; 
          }),
          makeButton("Set Target Metamodel",
            function (e: any, obj: any) {
              const context = {
                "myMetis":            myMetis,
                "myMetamodel":        myMetis.currentMetamodel, 
                "myModel":            myMetis.currentModel,
                "myModelview":        myMetis.currentModelview,
                "myTargetMetamodel":  myMetis.currentTargetMetamodel
              }
              const currentTargetMetamodel = gen.askForMetamodel(context, false);
              if (debug) console.log('815 Target Metamodel', myMetis);
              if (currentTargetMetamodel) {
                myMetis.currentTargetMetamodel = currentTargetMetamodel;
                // Update current Model with targetMetamodelRef
                myMetis.currentModel.targetMetamodelRef = currentTargetMetamodel?.id;
                // e.diagram.dispatch ({ type: 'SET_MYMETIS_MODEL', myMetis });

                const gqlModel = new gql.gqlModel(myMetis.currentModel, true);
                // gqlModel.addModelView(myMetis.currentModelview);
                if (debug) console.log('822 current model', gqlModel, myMetis.currentModelview);
                const modifiedModels = new Array();
                modifiedModels.push(gqlModel);
                modifiedModels.map(mn => {
                  let data = mn;
                  e.diagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
                })
                if (debug) console.log('829 current model', gqlModel);

                // const gqlMetamodel = (context.myMetamodel) && new gql.gqlMetaModel(currentTargetMetamodel);
                if (debug) console.log('799 set target Metamodel', gqlMetamodel);
                // const modifiedgqlMetamodels = new Array();
                // modifiedgqlMetamodels.push(gqlMetamodel);
                // modifiedgqlMetamodels.map(mn => {
                //   let data = mn;
                //   if (debug) console.log('804 set target Metamodel', data);
                //   e.diagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data })
                // })
              }
              if (debug) console.log('810 myMetis', myMetis);
            },
            function (o: any) {
              return true; 
            }
          ),
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
            return true; 
          }
        ),
          makeButton("Set Target Model",
          function (e: any, obj: any) {
            const context = {
              "myMetis":            myMetis,
              "myMetamodel":        myMetis.currentMetamodel,
              "myModel":            myMetis.currentModel,
              "myTargetMetamodel":  myMetis.currentTargetMetamodel
            }
            const currentTargetModel = gen.askForTargetModel(context, false);
            if (debug) console.log('894 Target Model', currentTargetModel);
            if (currentTargetModel) {
              const data = {id: currentTargetModel.id, name: currentTargetModel.name}
              e.diagram.dispatch({ type: 'SET_FOCUS_TARGETMODEL', data })
              const data2 = {id: currentTargetModel.modelviews[0].id, name: currentTargetModel.modelviews[0].name}
              e.diagram.dispatch({ type: 'SET_FOCUS_TARGETMODELVIEW', data: data2 })
              // myMetis.currentModel = currentTargetModel;
              // Update current Model with targetModelRef
              myMetis.currentModel.targetModelRef = currentTargetModel?.id;
              const gqlModel = new gql.gqlModel(myMetis.currentModel, true);
              const modifiedModels = new Array();
              modifiedModels.push(gqlModel);
              modifiedModels.map(mn => {
                let data = mn;
                if (debug) console.log('904 Diagram', data);
                
                e.diagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
              })
              if (debug) console.log('796 current model', gqlModel);
            }
            if (debug) console.log('810 myMetis', myMetis);
          },
          function (o: any) {
            return true; 
          }),
          makeButton("New Model",
            function (e: any, obj: any) {
              const context = {
                "myMetis":            myMetis,
                "myMetamodel":        myMetis.currentMetamodel,
                "myModel":            myMetis.currentModel,
                "myTargetMetamodel":  myMetis.currentTargetMetamodel
              }
                let model;
              //const metamodel = myMetis.currentMetamodel;
              const metamodel = gen.askForMetamodel(context, false, true);
              if (!metamodel) return;
              const modelName = prompt("Enter Model name:", "");
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
              return true; 
            }
          ),
          makeButton("New Modelview",
          function (e: any, obj: any) {
            const model = myMetis.currentModel;
            const modelviewName = prompt("Enter Modelview name:", "");
            if (modelviewName == null || modelviewName === "") {
              alert("New operation was cancelled");
            } else {
              const modelView = new akm.cxModelView(utils.createGuid(), modelviewName, model);
              model.addModelView(modelView);
              myMetis.addModelView(modelView);
              if (debug) console.log('585 myMetis', myMetis);
              const data = new gql.gqlModel(model, true);
              if (debug) console.log('595 NewModelView', data);
              e.diagram.dispatch({ type: 'LOAD_TOSTORE_NEWMODELVIEW', data });
            }
          },
          function (o: any) { 
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
            return true; 
          }),

          // makeButton("Set Target Model",
          // function (e: any, obj: any) {
          //   // Set target model
          // },
          // function (o: any) { 
          //   return false; 
          // }),
          makeButton("Zoom All",
          function (e: any, obj: any) {
            e.diagram.commandHandler.zoomToFit();
          },
          function (o: any) { return true; }),
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
          makeButton("Paste",
            function (e: any, obj: any) {
              const myModel = myMetis.currentModel;
              myModel.pasteViewsOnly = false;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
            },
            function (o: any) { return o.diagram.commandHandler.canPasteSelection(); }),
          makeButton("Paste View",
          function (e: any, obj: any) {
            const myModel = myMetis.currentModel;
            myModel.pasteViewsOnly = true;
            const gqlModel = new gql.gqlModel(myModel, true);
            const modifiedModels = new Array();
            modifiedModels.push(gqlModel);
            modifiedModels.map(mn => {
              let data = mn;
              e.diagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data })
            })
            if (debug) console.log('1047 Paste View', gqlModel, myMetis);
            e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
          },
          function (o: any) { 
            //return false;
            return o.diagram.commandHandler.canPasteSelection(); 
          }),
          makeButton("Undo",
            function (e: any, obj: any) { e.diagram.commandHandler.undo(); },
            function (o: any) { return o.diagram.commandHandler.canUndo(); }),
          makeButton("Redo",
            function (e: any, obj: any) { e.diagram.commandHandler.redo(); },
            function (o: any) { return o.diagram.commandHandler.canRedo(); })
        )
    }

    // Define a Node template
    let nodeTemplate;

    if (true) {
      nodeTemplate =
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
          new go.Binding("deletable"),
          new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
          {
            toolTip:
              $(go.Adornment, "Auto",
                $(go.Shape, { fill: "#FFFFCC" }),
                $(go.TextBlock, { margin: 4 },  // the tooltip shows the result of calling nodeInfo(data)
                  new go.Binding("text", "", nodeInfo))
              )
          },
          $(go.Shape, 'RoundedRectangle',
            {
              cursor: "alias",
              name: 'SHAPE', fill: 'lightyellow', stroke: "black",  strokeWidth: 1, 
              shadowVisible: true,
              // set the port properties:
              portId: "",
              fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
              toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true,
            },
            { contextMenu: partContextMenu },
            // Shape.fill is bound to Node.data.color
            new go.Binding('fill', 'fillcolor'),
            new go.Binding('stroke', 'strokecolor'), 
            //new go.Binding('strokeWidth', 'strokewidth'), //sf:  the linking of relationships does not work if this is uncommented
          ),
      
          $(go.Panel, "Table",
            { defaultAlignment: go.Spot.Left, margin: 0, cursor: "move" },
            $(go.RowColumnDefinition, { column: 1, width: 4 }),
            $(go.Panel, "Horizontal",
              { margin: new go.Margin(0, 0, 0, 0) },
              $(go.Panel, "Vertical",
                $(go.Panel, "Spot",
                  { contextMenu: partContextMenu },
                  $(go.Shape, {  // this is the square around the image
                    fill: "white", stroke: "#ddd", opacity: "0.4",
                    desiredSize: new go.Size(50, 50), 
                    margin: new go.Margin(0, 6, 0, 2),
                    // shadowVisible: true,
                  },
                  // new go.Binding("fill", "color"),
                  new go.Binding("figure")),
                  $(go.Picture,  // the image
                    // { contextMenu: partContextMenu },
                    {
                      name: "Picture",
                      desiredSize: new go.Size(46, 46),
                      // margin: new go.Margin(2, 2, 2, 4),
                      // margin: new go.Margin(4, 4, 4, 4),
                    },
                    new go.Binding("source", "icon", findImage)
                  ),
                ),
              ),
              // define the panel where the text will appear
              $(go.Panel, "Table",
                { contextMenu: partContextMenu },
                {
                  defaultRowSeparatorStroke: "black",
                  maxSize: new go.Size(166, 999),
                  // margin: new go.Margin(2),
                  defaultAlignment: go.Spot.Left,
                },
                $(go.RowColumnDefinition, { column: 2, width: 4 }),
                // content
                $(go.TextBlock, textStyle(),  // the name
                  {
                    isMultiline: false,  // don't allow newlines in text
                    editable: true,  // allow in-place editing by user
                    row: 0, column: 0, columnSpan: 6,
                    font: "10pt Segoe UI,sans-serif",
                    minSize: new go.Size(80, 16), 
                    height: 42,
                    verticalAlignment: go.Spot.Center,
                    // stretch: go.GraphObject.Fill, // added to not resize object
                    // overflow: go.TextBlock.OverflowEllipsis, // added to not resize object
                    margin: new go.Margin(0,0,0,0),
                    name: "name"
                  },        
                  new go.Binding("text", "name").makeTwoWay()
                ),
                new go.Binding("choices"),
                $(go.TextBlock, textStyle(), // the typename
                  {
                    row: 1, column: 1, columnSpan: 6,
                    editable: false, isMultiline: false,
                    minSize: new go.Size(10, 4),
                    margin: new go.Margin(2, 0, 0, 2)
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
      linkTemplate =
        $(go.Link,
          new go.Binding("deletable"),
          new go.Binding('relinkableFrom', 'canRelink').ofModel(),
          new go.Binding('relinkableTo', 'canRelink').ofModel(),
          {
            toolTip:
              $(go.Adornment, "Auto",
                { background: "transparent" },  // avoid hiding tooltip when mouse moves
                $(go.Shape, { fill: "#FFFFCC" }),
                $(go.TextBlock, { margin: 4,  },  // the tooltip shows the result of calling linkInfo(data)
                  new go.Binding("text", "", linkInfo))
              )
          },
          {
            routing: go.Link.AvoidsNodes,
            // routing: go.Link.Orthogonal,
            routing: go.Link.Normal,
            // curve: go.Link.JumpOver,
            curve: go.Link.JumpGap,
            corner: 10
          },  // link route should avoid nodes
          { contextMenu: linkContextMenu },
          new go.Binding("points").makeTwoWay(),
          // $(go.Shape, { stroke: "black", strokeWidth: 1},
          $(go.Shape, { stroke: "black", shadowVisible: true, },
            new go.Binding("stroke", "strokecolor"),
            // new go.Binding("strokeWidth", "strokewidth"),
          ),
          $(go.TextBlock,     // this is a Link label
            {
              isMultiline: false,  // don't allow newlines in text
              editable: true,  // allow in-place editing by user
            }),
          //$(go.Shape, new go.Binding("strokewidth", "strokewidth")),
          //$(go.Shape, new go.Binding("toArrow", "toArrow")),
          $(go.Shape, { toArrow: "Standard", stroke: null }),
          $(go.TextBlock,     // this is a Link label
            {
              isMultiline: false,  // don't allow newlines in text
              editable: true,  // allow in-place editing by user
              //textEditor: customEditor,
            },

            new go.Binding("text", "name").makeTwoWay(),
            //new go.Binding("text", "choices"),
          ),
          $(go.TextBlock, "", { segmentOffset: new go.Point(0, -10) }),
          $(go.TextBlock, "", { segmentOffset: new go.Point(0, 10) }),
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
              shp.fill = "#ffffef"
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
            return h ? "rgba(255,0,0,0.2)" : "transparent";
            }
        ).ofObject(),
        $(go.Shape, "RoundedRectangle", // surrounds everything
          // {
          //   stroke: "gray", strokeWidth: "1",
          // },
          // new go.Binding("stroke", "strokecolor"),
          // new go.Binding("strokeWidth", "strokewidth"),
          {
            cursor: "alias",
            fill: "white", 
            // stroke: "black", 
            shadowVisible: true,
            // strokeWidth: 1,
            minSize: new go.Size(100, 50),
            portId: "", 
            fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
            toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true,
          },
          new go.Binding("fill", "fillcolor"),
          // new go.Binding("stroke", "strokecolor"),
          // new go.Binding("strokeWidth", "strokewidth"),
        ),
        $(go.Panel,  // the header
          $(go.Picture, //"actualBounds",                  // the image
            {
              name: "Picture",
              desiredSize: new go.Size(300, 200),
              // minSize: new go.Binding("minSize", "size"),
              margin: new go.Margin(16, 0, 0, 0),
            },
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
            {margin: new go.Margin(4, 0, 0, 4)},
            ),  // this Panel acts as a Button
            
            $(go.TextBlock,     // group title near top, next to button
              {
                font: "Bold 12pt Sans-Serif",
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
            new go.Binding("text", "typename")
            //new go.Binding("text", "choices")
          ),
          ), // End Horizontal Panel
          $(go.Shape,  // using a Shape instead of a Placeholder
            {
              // name: "SHAPE", //fill: "rgba(228,228,228,0.53)",
              // name: "SHAPE", fill: "transparent",
              name: "SHAPE", fill: "lightyellow",
              opacity: "0.9",
              minSize: new go.Size(300, 200), 
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

    // Define group template map
    let groupTemplateMap = new go.Map<string, go.Group>();
    groupTemplateMap.add("", groupTemplate);

    // define template maps
    if (true) {
      // Define node template map
      let nodeTemplateMap = new go.Map<string, go.Part>();
      nodeTemplateMap.add("", nodeTemplate);
      //nodeTemplateMap.add("", defaultNodeTemplate);

      // Define link template map
      let linkTemplateMap = new go.Map<string, go.Link>();
      linkTemplateMap.add("", linkTemplate);

      // Set the diagram template maps
      myDiagram.nodeTemplateMap = nodeTemplateMap;
      myDiagram.linkTemplateMap = linkTemplateMap;
      myDiagram.groupTemplateMap = groupTemplateMap;
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

    //  sf added #####################################################
    // Create an HTMLInfo and dynamically create some HTML to show/hide
    var customEditor = new go.HTMLInfo();
    var customSelectBox = document.createElement("select");

    customEditor.show = function (textBlock, myDiagram, tool) {
      if (!(textBlock instanceof go.TextBlock)) return;

      // Populate the select box:
      customSelectBox.innerHTML = "";

      // this sample assumes textBlock.choices is not null
      if (!textBlock.choices) {
        if (debug) console.log('626 customEditor - No choices');
        textBlock.choices = ['Edit name'];
      }
      var list = textBlock.choices;
      for (var i = 0; i < list?.length; i++) {
        var op = document.createElement("option");
        op.text = list[i];
        op.value = list[i];
        customSelectBox.add(op, null);
      }

      // After the list is populated, set the value:
      customSelectBox.value = textBlock.text;

      // Do a few different things when a user presses a key
      customSelectBox.addEventListener("keydown", function (e) {
        var keynum = e.which;
        if (debug) console.log('597 Diagram.tsx', keynum);
        if (keynum == 13) { // Accept on Enter
          //tool.acceptText(go.TextEditingTool.Tab);  // Hack
          return;
        } else if (keynum == 9) { // Accept on Tab
          //tool.acceptText(go.TextEditingTool.Tab);
          e.preventDefault();
          return false;
        } else if (keynum === 27) { // Cancel on Esc
          tool.doCancel();
          if (tool.diagram) tool.diagram.focus();
        }
      }, false);

      var loc = textBlock.getDocumentPoint(go.Spot.TopLeft);
      var pos = myDiagram.transformDocToView(loc);
      customSelectBox.style.left = pos.x + "px";
      customSelectBox.style.top = pos.y + "px";
      customSelectBox.style.position = 'absolute';
      customSelectBox.style.zIndex = '100'; // place it in front of the Diagram

      myDiagram.div?.appendChild(customSelectBox);
    }

    customEditor.hide = function (diagram, tool) {
      myDiagram.div?.removeChild(customSelectBox);
    }


    // This is necessary for HTMLInfo instances that are used as text editors
    customEditor.valueFunction = function () { return customSelectBox.value; }

    // // Set the HTMLInfo:
    // myDiagram.toolManager.textEditingTool.defaultTextEditor = customEditor;

    myDiagram.toolManager.hoverDelay = 400 //sf  setting the time the cursor need to be still before showing toolTip

    //  sf added #####################################################


    // ---  Define the CONTEXT Menu -----------------
    // To simplify this code we define a function for creating a context menu button:       
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
      // if (image.substring(0,4) === 'http') { // its an URL
      if (image.includes('//')) { // its an URL   
        if (debug) console.log('1269 Diagram', image);
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
    if (debug) console.log('1296 Diagram', this.props.nodeDataArray);
    if (debug) console.log('1082 Diagram', this.props.linkDataArray);
    
    return (
      <>
        <ReactDiagram
          ref={this.diagramRef}
          divClassName='diagram-component'
          initDiagram={this.initDiagram}
          nodeDataArray={this.props.nodeDataArray}
          linkDataArray={this.props?.linkDataArray}
          myMetis={this.props.myMetis}
          modelData={this.props.modelData}
          onModelChange={this.props.onModelChange}
          skipsDiagramUpdate={this.props.skipsDiagramUpdate}
        />
      </>
    );
  }
}

