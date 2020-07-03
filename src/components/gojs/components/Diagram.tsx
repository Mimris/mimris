// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import * as React from 'react';
import * as akm from '../../../akmm/metamodeller';
import * as gjs from '../../../akmm/ui_gojs';
import * as gql from '../../../akmm/ui_graphql';
import * as uic from '../../../akmm/ui_common';
import * as utils from '../../../akmm/utilities';
import * as constants from '../../../akmm/constants';
const glb = require('../../../akmm/akm_globals');

//import * as uic from '../../../Server/src/akmm/ui_common';

import { GuidedDraggingTool } from '../GuidedDraggingTool';
//import { stringify } from 'querystring';

// import './Diagram.css';

const AllowTopLevel = true;

interface DiagramProps {
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
  myMetis: akm.cxMetis;
  skipsDiagramUpdate: boolean;
  onDiagramEvent: (e: go.DiagramEvent) => void;
  onModelChange: (e: go.IncrementalData) => void;
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
  //   console.log('onModelChanged called!');
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
    if (true) {
      myDiagram =
        $(go.Diagram,
          {
            initialContentAlignment: go.Spot.Center,       // center the content
            "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
            "scrollMode": go.Diagram.InfiniteScroll,
            initialAutoScale: go.Diagram.UniformToFill,
            'undoManager.isEnabled': false,  // must be set to allow for model change listening
            'undoManager.maxHistoryLength': 0,  // uncomment disable undo/redo functionality
            draggingTool: new GuidedDraggingTool(),  // defined in GuidedDraggingTool.ts
            'draggingTool.horizontalGuidelineColor': 'blue',
            'draggingTool.verticalGuidelineColor': 'blue',
            'draggingTool.centerGuidelineColor': 'green',
            'draggingTool.guidelineWidth': 1,
            "draggingTool.dragsLink": true,
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
              "fillcolor": "pink",
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
    // console.log('190 myDiagram', this.myMetis);
    // console.log('191 myDiagram', this.myGoModel);
    myDiagram.myMetis = this.myMetis;
    myDiagram.myGoModel = this.myGoModel;
    myDiagram.myGoMetamodel = this.myGoMetamodel;
    myDiagram.layout.isInitial = false;
    myDiagram.layout.isOngoing = false;
    // provide a tooltip for the background of the Diagram, when not over any Part
    // console.log('198 myDiagram', myDiagram.myMetis);
    // console.log('199 myDiagram', myDiagram.myGoModel);
    myDiagram.toolTip =
      $("ToolTip",
        $(go.TextBlock, { margin: 4 },
          // use a converter to display information about the diagram model
          new go.Binding("text", "", diagramInfo))
      );

    // Tooltip functions
    function nodeInfo(d) {  // Tooltip info for a node data object
      var str = "Node: " + d.name + "\n";
      if (d.group)
        str += "member of " + d.group;
      else
        str += "Type: " + d.type;
      return str;
    }

    function linkInfo(d: any) {  // Tooltip info for a link data object
      const typename = d.relshiptype?.name;
      const reltype = myDiagram.myMetis.findRelationshipTypeByName(typename);
      const fromNode = d.fromNode;
      const fromObj = fromNode?.object;
      const fromObjtype = reltype.getFromObjType();
      const toNode = d.toNode;
      const toObj = toNode?.object;
      const toObjtype = reltype.getToObjType();
      console.log('229 linkInfo', d);
      let str = "Link: ";
      str += d.name + " (" + typename + ")\n";
      str += "from: " + fromObj?.name + "\n";
      str += "to: " + toObj?.name;
      return str;
    }

    function diagramInfo(model: any) {  // Tooltip info for the diagram's model
      console.log('231 diagramInfo', model);
      let str = "Model:\n";
      str += model.nodeDataArray.length + " nodes, ";
      str += model.linkDataArray.length + " links";
      return str;
    }


    // A Context Menu is an Adornment with a bunch of buttons in them
    // Parts context menu
    if (true) {
      var partContextMenu =
        $(go.Adornment, "Vertical",
          makeButton("Set Object type",
            function (e, obj) {
              const node = e.diagram.selection.first().data;
              console.log('245 partContextMenu', node);
              let objtype = prompt('Enter one of: ' + node.choices);
              const myMetis = e.diagram.myMetis;
              const context = {
                "myMetis": myMetis,
                "myMetamodel": myMetis.currentMetamodel,
                "myModel": myMetis.currentModel,
                "myModelView": myMetis.currentModelview,
                "myDiagram": e.diagram
              }
              uic.setObjectType(node, objtype, context);
              const modNode = new gql.gqlObjectView(node.objectview);
              console.log('308 SetObjtype', node, modNode);
              //modifiedNodes.push(modNode);
            },
            function (o) {
              const node = o.part.data;
              if (node.category === 'Object') {
                return true;
              } else {
                return false;
              }
            }),
          makeButton("Cut",
            function (e: any, obj: any) { e.diagram.commandHandler.cutSelection(); },
            function (o: any) { return o.diagram.commandHandler.canCutSelection(); }),
          makeButton("Copy",
            function (e: any, obj: any) { e.diagram.commandHandler.copySelection(); },
            function (o: any) { return o.diagram.commandHandler.canCopySelection(); }),
          makeButton("Paste",
            function (e: any, obj: any) {
              glb.pasteViewsOnly = false;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
            },
            function (o: any) { return o.diagram.commandHandler.canPasteSelection(); }),
          makeButton("Paste View",
            function (e: any, obj: any) {
              // Ask user if only views
              glb.pasteViewsOnly = true;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
              glb.pasteViewsOnly = false;
            },
            function (o: any) { return o.diagram.commandHandler.canPasteSelection(); }),
          makeButton("Delete",
            function (e: any, obj: any) {
              glb.deleteViewsOnly = false;
              e.diagram.commandHandler.deleteSelection();
            },
            function (o: any) { return o.diagram.commandHandler.canDeleteSelection(); }),
          makeButton("Delete View",
            function (e: any, obj: any) {
              glb.deleteViewsOnly = true;
              e.diagram.commandHandler.deleteSelection();
              glb.deleteViewsOnly = false;
            },
            function (o: any) { return o.diagram.commandHandler.canDeleteSelection(); }),
          // makeButton("Undo",
          //   function (e: any, obj: any) { e.diagram.commandHandler.undo(); },
          //   function (o: any) { return o.diagram.commandHandler.canUndo(); }),
          // makeButton("Redo",
          //   function (e: any, obj: any) { e.diagram.commandHandler.redo(); },
          //   function (o: any) { return o.diagram.commandHandler.canRedo(); }),
          makeButton("Group",
            function (e: any, obj: any) { e.diagram.commandHandler.groupSelection(); },
            function (o: any) { return o.diagram.commandHandler.canGroupSelection(); }),
          makeButton("Ungroup",
            function (e: any, obj: any) { e.diagram.commandHandler.ungroupSelection(); },
            function (o: any) { return o.diagram.commandHandler.canUngroupSelection(); })
        );
    }

    // A Context menu for links    
    if (true) {
      var linkContextMenu =
        $(go.Adornment, "Vertical",
          makeButton("Set Relationship type",
            function (e, obj) {
              const link = e.diagram.selection.first().data;
              let reltype = prompt('Enter one of: ' + link.choices);
              const myMetis = e.diagram.myMetis;
              const context = {
                "myMetis": myMetis,
                "myMetamodel": myMetis.currentMetamodel,
                "myModel": myMetis.currentModel,
                "myModelView": myMetis.currentModelview,
                "myDiagram": e.diagram
              }
              uic.setRelationshipType(link, reltype, context);
              const modLink = new gql.gqlRelshipView(link.relshipview);
              console.log('308 SetReltype', link, modLink);
              //modifiedLinks.push(modLink);
            },
            function (o) {
              const link = o.part.data;
              if (link.category === 'Relationship') {
                return true;
              } else {
                return false;
              }
            }),
          makeButton("Cut",
            function (e, obj) { e.diagram.commandHandler.cutSelection(); },
            function (o) { return o.diagram.commandHandler.canCutSelection(); }),
          makeButton("Copy",
            function (e, obj) { e.diagram.commandHandler.copySelection(); },
            function (o) { return o.diagram.commandHandler.canCopySelection(); }),
          makeButton("Paste",
            function (e, obj) {
              glb.pasteViewsOnly = false;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
            },
            function (o) { return o.diagram.commandHandler.canPasteSelection(); }),
          makeButton("Delete",
            function (e, obj) {
              glb.deleteViewsOnly = false;
              e.diagram.commandHandler.deleteSelection();
            },
            function (o) { return o.diagram.commandHandler.canDeleteSelection(); }),
          makeButton("Delete View",
            function (e, obj) {
              glb.deleteViewsOnly = true;
              e.diagram.commandHandler.deleteSelection();
              glb.deleteViewsOnly = false;
            },
            function (o) { return o.diagram.commandHandler.canDeleteSelection(); }),
          // makeButton("Undo",
          //            function(e, obj) { e.diagram.commandHandler.undo(); },
          //            function(o) { return o.diagram.commandHandler.canUndo(); }),
          // makeButton("Redo",
          //            function(e, obj) { e.diagram.commandHandler.redo(); },
          //            function(o) { return o.diagram.commandHandler.canRedo(); })
        );
    }

    // provide a context menu for the background of the Diagram, when not over any Part
    if (true) {
      myDiagram.contextMenu =
        $(go.Adornment, "Vertical",
          makeButton("Paste",
            function (e: any, obj: any) {
              glb.pasteviewsonly = false;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
            },
            function (o: any) { return o.diagram.commandHandler.canPasteSelection(); }),
          makeButton("Paste View",
            function (e: any, obj: any) {
              // Ask user if only views
              glb.pasteviewsonly = true;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
              glb.pasteviewsonly = false;
            },
            function (o: any) { return o.diagram.commandHandler.canPasteSelection(); }),
          makeButton("Undo",
            function (e: any, obj: any) { e.diagram.commandHandler.undo(); },
            function (o: any) { return o.diagram.commandHandler.canUndo(); }),
          makeButton("Redo",
            function (e: any, obj: any) { e.diagram.commandHandler.redo(); },
            function (o: any) { return o.diagram.commandHandler.canRedo(); })
        );
    }

    // define a Node template
    let nodeTemplate;
    if (true) {
      nodeTemplate =
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
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
              name: 'SHAPE', fill: 'lightyellow', stroke: "black",
              // minSize: new go.Size(150, 50),
              // set the port properties:
              portId: "", 
              // cursor: "crosshair",
              cursor: "pointer",
              fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
              toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true,
            },
            { contextMenu: partContextMenu },
            // Shape.fill is bound to Node.data.color
            new go.Binding('fill', 'fillcolor')),
          $(go.Panel, "Table",
            { defaultAlignment: go.Spot.Left, margin: 4 },
            $(go.RowColumnDefinition, { column: 1, width: 4 }),
            $(go.Panel, "Horizontal",
              $(go.Picture,                   // the image
                {
                  name: "Picture",
                  desiredSize: new go.Size(35, 40),
                  margin: new go.Margin(4, 0, 4, 0),
                },
                new go.Binding("source", "icon", findImage)
              ),

              // define the panel where the text will appear
              $(go.Panel, "Table",
                {
                  defaultRowSeparatorStroke: "black",
                  maxSize: new go.Size(150, 999),
                  margin: new go.Margin(0, 0, 0, 0),
                  defaultAlignment: go.Spot.Left
                },
                $(go.RowColumnDefinition, { column: 2, width: 4 }
                ),
                // content
                $(go.TextBlock, textStyle(),  // the name
                  {
                    isMultiline: false,  // don't allow newlines in text
                    editable: true,  // allow in-place editing by user
                    row: 0, column: 0, columnSpan: 6,
                    font: "12pt Segoe UI,sans-serif",
                    minSize: new go.Size(80, 16), //sf changed x min size to 100
   
                    height: 40,
                    verticalAlignment: go.Spot.Center,
                    margin: new go.Margin(0,0,4,0),
                    name: "name"
                  },
                  new go.Binding("text", "name").makeTwoWay()),
                new go.Binding("choices"),
                $(go.TextBlock, textStyle(), // the typename
                  {
                    row: 1, column: 1, columnSpan: 6,
                    editable: false, isMultiline: false,
                    minSize: new go.Size(10, 4),
                    margin: new go.Margin(2, 0, 0, 0)
                  },
                  new go.Binding("text", "typename")
                  //new go.Binding("text", "choices")
                ),
              ),
            ),
          ),
        );
    }
    // dwfine a link template
    let linkTemplate;
    if (true) {
      linkTemplate =
        $(go.Link,
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
          $(go.Shape, new go.Binding("stroke", "strokecolor")),
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
            }).ofObject(),
          $(go.Shape, "RoundedRectangle", // surrounds everything
            {
              fill: "white",
              minSize: new go.Size(100, 50)
            },
            /*
            { parameter1: 10, 
              fill: "rgba(128,128,128,0.33)",
            },
            */
            {
              portId: "", cursor: "pointer",
              fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
              toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true,
            }),
          $(go.Panel, "Vertical",  // position header above the subgraph
            {
              name: "HEADER",
              defaultAlignment: go.Spot.TopLeft
            },
            $(go.Panel, "Horizontal",  // the header
              { defaultAlignment: go.Spot.Top },
              $("SubGraphExpanderButton"),  // this Panel acts as a Button
              $(go.TextBlock,     // group title near top, next to button
                {
                  font: "Bold 12pt Sans-Serif",
                  editable: true, isMultiline: false,
                },
                new go.Binding("fill", "fillcolor"),
                new go.Binding("text", "name").makeTwoWay()
              ),
            ), // End Horizontal Panel

            $(go.Shape,  // using a Shape instead of a Placeholder
              {
                name: "SHAPE", fill: "lightyellow",
                minSize: new go.Size(300, 200) // sf changed to bigger container
              },
              new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify)
            )
          )
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
              name: "SHAPE", fill: "lightyellow", stroke: "black",
              //desiredSize: new go.Size(100, 20),
              //margin: new go.Margin(100, 0, 0, 0),
            },
            new go.Binding("fill", "fillcolor"),
            new go.Binding("stroke", "strokecolor"),
            new go.Binding("strokeWidth", "strokewidth")
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
        console.log('626 customEditor - No choices');
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
        console.log('597 Diagram.tsx', keynum);
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
      if (image) {
        return "./../images/" + image;
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
    return (
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
    );
  }
}

