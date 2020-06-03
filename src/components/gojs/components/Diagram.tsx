// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import * as React from 'react';
import * as utils from '../../../akmm/utilities';
import * as constants from '../../../akmm/constants';
import * as uic from '../../../akmm/ui_common';

import { GuidedDraggingTool } from '../GuidedDraggingTool';
//import { stringify } from 'querystring';

// import './Diagram.css';

let AllowTopLevel = true;

interface DiagramProps {
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
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
    const diagram = this.diagramRef.current.getDiagram();
    if (diagram instanceof go.Diagram) {
      diagram.addDiagramListener('TextEdited', this.props.onDiagramEvent);
      diagram.addDiagramListener('ChangedSelection', this.props.onDiagramEvent);
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
      diagram.removeDiagramListener('ChangedSelection', this.props.onDiagramEvent);
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
              "type": "Generic relationship",
              "name": "",
              "description": "",
              "relshipkind": constants.relkinds.REL
            },
            "clickCreatingTool.archetypeNodeData": {
              "key": utils.createGuid(),
              "category": "Object",
              "name": "Generic object",
              "description": "",
              "fillcolor": "pink",
              "icon": "default.png"
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
    console.log('94 myDiagram', this);

    myDiagram.layout.isInitial = false;
    myDiagram.layout.isOngoing = false;

    // provide a tooltip for the background of the Diagram, when not over any Part
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
      let reltype = myMetamodel.findRelationshipTypeByName(d.name);

      let fromObjtype = reltype.getFromObjType();
      let toObjtype = reltype.getToObjType();

      let str = "Link: " + d.name + "\n";
      str += "from: " + fromObjtype.name + "\n";
      str += "to: " + toObjtype.name;
      return str;
    }

    function diagramInfo(model: any) {  // Tooltip info for the diagram's model
      var str = "Model:\n";
      str += model.nodeDataArray.length + " nodes, ";
      str += model.linkDataArray.length + " links";
      return str;
    }


    if (false) {
      //     myDiagram.groupTemplate =
      //     $(go.Group, "Vertical",
      //       $(go.Panel, "Auto",
      //         $(go.Shape, "RoundedRectangle",  // surrounds the Placeholder
      //           { parameter1: 14,
      //             fill: "rgba(128,128,128,0.33)" }),
      //         $(go.Placeholder,    // represents the area of all member parts,
      //           { padding: 5})  // with some extra padding around them
      //       ),
      //       $(go.TextBlock,         // group title
      //         { alignment: go.Spot.Right, font: "Bold 12pt Sans-Serif" },
      //         new go.Binding("text", "name"))
      //     );
    }
    // A Context Menu is an Adornment with a bunch of buttons in them
    // Parts context menu
    if (true) {
      var partContextMenu =
        $(go.Adornment, "Vertical",
          makeButton("Cut",
            function (e: any, obj: any) { e.diagram.commandHandler.cutSelection(); },
            function (o: any) { return o.diagram.commandHandler.canCutSelection(); }),
          makeButton("Copy",
            function (e: any, obj: any) { e.diagram.commandHandler.copySelection(); },
            function (o: any) { return o.diagram.commandHandler.canCopySelection(); }),
          makeButton("Paste",
            function (e: any, obj: any) {
              //pasteViewsOnly = false;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
            },
            function (o: any) { return o.diagram.commandHandler.canPasteSelection(); }),
          makeButton("Paste View",
            function (e: any, obj: any) {
              // Ask user if only views
              //pasteViewsOnly = true;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
              //pasteViewsOnly = false;
            },
            function (o: any) { return o.diagram.commandHandler.canPasteSelection(); }),
          makeButton("Delete",
            function (e: any, obj: any) {
              //deleteViewsOnly = false;
              e.diagram.commandHandler.deleteSelection();
            },
            function (o: any) { return o.diagram.commandHandler.canDeleteSelection(); }),
          makeButton("Delete View",
            function (e: any, obj: any) {
              //deleteViewsOnly = true;
              e.diagram.commandHandler.deleteSelection();
              //deleteViewsOnly = false;
            },
            function (o: any) { return o.diagram.commandHandler.canDeleteSelection(); }),
          makeButton("Undo",
            function (e: any, obj: any) { e.diagram.commandHandler.undo(); },
            function (o: any) { return o.diagram.commandHandler.canUndo(); }),
          makeButton("Redo",
            function (e: any, obj: any) { e.diagram.commandHandler.redo(); },
            function (o: any) { return o.diagram.commandHandler.canRedo(); }),
          makeButton("Group",
            function (e: any, obj: any) { e.diagram.commandHandler.groupSelection(); },
            function (o: any) { return o.diagram.commandHandler.canGroupSelection(); }),
          makeButton("Ungroup",
            function (e: any, obj: any) { e.diagram.commandHandler.ungroupSelection(); },
            function (o: any) { return o.diagram.commandHandler.canUngroupSelection(); })
        );
    }

    // provide a context menu for the background of the Diagram, when not over any Part
    if (true) {
      myDiagram.contextMenu =
        $(go.Adornment, "Vertical",
          makeButton("Paste",
            function (e: any, obj: any) {
              //pasteViewsOnly = false;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
            },
            function (o: any) { return o.diagram.commandHandler.canPasteSelection(); }),
          makeButton("Paste View",
            function (e: any, obj: any) {
              // Ask user if only views
              //pasteViewsOnly = true;
              e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
              //pasteViewsOnly = false;
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
          $(go.Shape, 'RoundedRectangle',
            {
              name: 'SHAPE', fill: 'lightyellow', stroke: "black",
              // set the port properties:
              portId: "", cursor: "pointer",
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
                  margin: new go.Margin(4, 5, 4, 5),
                },
                new go.Binding("source", "icon", findImage)
              ),
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
                    row: 0, column: 0, columnSpan: 5,
                    font: "12pt Segoe UI,sans-serif",
                    editable: true, isMultiline: false,
                    minSize: new go.Size(10, 16),
                    name: "name"
                  },
                  new go.Binding("text", "name").makeTwoWay()),

                $(go.TextBlock, textStyle(), // the typename
                  {
                    row: 1, column: 1, columnSpan: 6,
                    editable: false, isMultiline: false,
                    minSize: new go.Size(10, 14),
                    margin: new go.Margin(0, 0, 0, 3)
                  },
                  new go.Binding("text", "typename")
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
            routing: go.Link.AvoidsNodes,
            corner: 10
          },  // link route should avoid nodes
          new go.Binding("points").makeTwoWay(),
          $(go.Shape, new go.Binding("stroke", "strokecolor")),
          $(go.TextBlock,     // this is a Link label
            {
              isMultiline: false,  // don't allow newlines in text
              editable: true  // allow in-place editing by user
            }),
          //$(go.Shape, new go.Binding("strokewidth", "strokewidth")),
          //$(go.Shape, new go.Binding("toArrow", "toArrow")),
          $(go.Shape, { toArrow: "Standard", stroke: null }),
          $(go.TextBlock,     // this is a Link label
            {
              isMultiline: false,  // don't allow newlines in text
              editable: true  // allow in-place editing by user
            },
            new go.Binding("text", "name").makeTwoWay(),
          ),
          $(go.TextBlock, "", { segmentOffset: new go.Point(0, -10) }),
          $(go.TextBlock, "", { segmentOffset: new go.Point(0, 10) }),
          { // this tooltip Adornment is shared by all links
            toolTip:
              $(go.Adornment, "Auto",
                $(go.Shape, { fill: "#FFFFCC" }),
                $(go.TextBlock, { margin: 4 },  // the tooltip shows the result of calling linkInfo(data)
                  new go.Binding("text", "", linkInfo))
              )
          }
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
                minSize: new go.Size(100, 50)
              },
              new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify)
            )
          )
        )
    }

    //     // Define group template map
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

    // Define node template map
    // let paletteNodeTemplateMap = new go.Map();
    // paletteNodeTemplateMap.add("", paletteNodeTemplate);

    // myPalette.nodeTemplateMap = paletteNodeTemplateMap;

    // // Define group template map
    // let paletteGroupTemplateMap = new go.Map();
    // paletteGroupTemplateMap.add("typeitem", paletteGroupTemplate1);

    // myPalette.groupTemplateMap = paletteGroupTemplateMap;

    //  // what to do when a drag-drop occurs in the Diagram's background
    //  myDiagram.mouseDragOver = function(e) {
    //   if (!AllowTopLevel) {
    //     // OK to drop a group anywhere or any Node that is a member of a dragged Group
    //     var tool = e.diagram.toolManager.draggingTool;
    //     if (!tool.draggingParts.all(function(p) {
    //       return p instanceof go.Group || (!p.isTopLevel && tool.draggingParts.contains(p.containingGroup));
    //     })) {
    //       e.diagram.currentCursor = "not-allowed";
    //     } else {
    //       e.diagram.currentCursor = "";
    //     }
    //   }
    // };

    // myDiagram.mouseDrop = function(e) {
    //   if (AllowTopLevel) {
    //     // when the selection is dropped in the diagram's background,
    //     // make sure the selected Parts no longer belong to any Group
    //     if (!e.diagram.commandHandler.addTopLevelParts(e.diagram.selection, true)) {
    //       e.diagram.currentTool.doCancel();
    //     }
    //   } else {
    //     // disallow dropping any regular nodes onto the background, but allow dropping "racks",
    //     // including any selected member nodes
    //     if (!e.diagram.selection.all(function(p) {
    //       return p instanceof go.Group || (!p.isTopLevel && p.containingGroup.isSelected);
    //     })) {
    //       e.diagram.currentTool.doCancel();
    //     }
    //   }
    // };


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
        linkDataArray={this.props.linkDataArray}
        modelData={this.props.modelData}
        onModelChange={this.props.onModelChange}
        skipsDiagramUpdate={this.props.skipsDiagramUpdate}
      />
    );
  }
}

