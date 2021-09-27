
// @ts- nocheck
const debug = false; 
import * as go from 'gojs';
// import * as figures from 'gojs/extensions/Figures';
import * as utils from './utilities';
import * as uic from './ui_common';
import * as uid from './ui_diagram';
import * as ui_mtd from './ui_methods';
import * as akm from './metamodeller';
import * as gjs from './ui_gojs';
import * as gql from './ui_graphql';
const constants = require('./constants');
const printf = require('printf');

const $ = go.GraphObject.make;

require('gojs/extensions/Figures.js');

export function getRouting(r: string): any {
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

export function getCurve(c: string): any {
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

function nodeStyle() {
    return [
      // The Node.location comes from the "loc" property of the node data,
      // converted by the Point.parse static method.
      // If the Node.location is changed, it updates the "loc" property of the node data,
      // converting back using the Point.stringify static method.
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      {
        // the Node.location is at the center of each node
        locationSpot: go.Spot.Center
      }
    ];
  }

  function selectionIncludesPorts(n, myDiagram) {
    return n.containingGroup !== null && !myDiagram.selection.has(n.containingGroup);
  }


let nodeTemplateNames = []; 

export function getNodeTemplateNames() {
    return nodeTemplateNames;
}

const UnselectedBrush = "lightgray";  // item appearance, if not "selected"
const SelectedBrush   = "dodgerblue";   // item appearance, if "selected"

function addNodeTemplateName(name: string) {
    if (nodeTemplateNames.length == 0) {
        nodeTemplateNames.push(name);
        return;        
    }
    let names = [...new Set(nodeTemplateNames)];
    for (let i=0; i<names?.length; i++) {
        const n = names[i];
        if (n == name)
            continue;
        else {
            names.push(name);
            break;
        }
    }
    const names1 = [...new Set(names)];
    nodeTemplateNames = names1;
}

// export function getNodeTemplate(templateName: string, contextMenu: any, myMetis: akm.cxMetis): any {
//     const nodeTemplate1 =  // Text and Icon
export function addNodeTemplates(nodeTemplateMap: any, contextMenu: any, myMetis: akm.cxMetis) {
    const myDiagram = myMetis.myDiagram;
    let nodeTemplate1 =      
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            {
                toolTip:
                $(go.Adornment, "Auto",
                    $(go.Shape, { fill: "lightyellow" }),
                    $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                        new go.Binding("text", "", 
                            function (d) { 
                                return uid.nodeInfo(d, myMetis);                
                            }
                        )
                    )
                )
            },
            $(go.Shape, 'RoundedRectangle', // Rectangle for cursor alias
                {
                cursor: "alias",        // cursor: "pointer",
                name: 'SHAPE', fill: 'red', stroke: "#fff",  strokeWidth: 2, 
                margin: new go.Margin(1, 1, 1, 1),
                shadowVisible: true,
                desiredSize: new go.Size(158, 68), // outer Shape without icon  // comment out the Icon part
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
                { contextMenu: contextMenu },    
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
            $(go.Panel, "Table", // Panel for text 
                { defaultAlignment: go.Spot.Left, margin: 2, cursor: "move" },
                $(go.RowColumnDefinition, { column: 1, width: 4 }),
                $(go.Panel, "Horizontal",
                // { margin: new go.Margin(10, 10, 10, 10) },
                {
                    defaultAlignment: go.Spot.Center
                },
                // define the panel where the text will appear
                $(go.Panel, "Table", // separator ---------------------------------
                    { contextMenu: contextMenu , cursor: "move" },
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
                    $(go.TextBlock, textStyle(), // the typename  --------------------
                    {
                        row: 1, column: 1, columnSpan: 6,
                        editable: false, isMultiline: false,
                        // minSize: new go.Size(10, 4),
                        margin: new go.Margin(2, 0, 1, 0),  
                        alignment: go.Spot.Center,                  
                    },
                    new go.Binding("text", "typename")
                    ),
                ),
                ),
            ),
        );
    nodeTemplateMap.add("", nodeTemplate1);
    nodeTemplateMap.add("textOnly", nodeTemplate1);
    addNodeTemplateName('textOnly');
    nodeTemplateMap.add("textAndIcon", 
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            {
                toolTip:
                $(go.Adornment, "Auto",
                    $(go.Shape, { fill: "lightyellow" }),
                    $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                    new go.Binding("text", "", uid.nodeInfo))
                )
            },

            $(go.Shape, 'RoundedRectangle', // Rectangle for cursor alias
                {
                cursor: "alias",        // cursor: "pointer",
                name: 'SHAPE', fill: 'red', stroke: "#fff",  strokeWidth: 2, 
                margin: new go.Margin(1, 1, 1, 1),
                shadowVisible: true,
                desiredSize: new go.Size(198, 68), // outer Shape size with icon
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
                { contextMenu: contextMenu },    
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
                $(go.Panel, "Vertical", // Panel for Icon  ------------------------
                    { contextMenu: contextMenu , cursor: "move" },
                    $(go.Panel, "Spot", // icon area
                    { contextMenu: contextMenu , cursor: "move" },

                    $(go.Shape, {  // this is the square around the image ---------
                        fill: "white", stroke: "#ddd", opacity: 0.4,
                        desiredSize: new go.Size(56, 56), 
                        margin: new go.Margin(0, 2, 0, 8),
                        // shadowVisible: true,
                    },
                    new go.Binding("fill", "isHighlighted", function(h) { return h ? "lightblue" : "white"; }).ofObject(),
                    new go.Binding("stroke", "isHighlighted", function(h) { return h ? "black" : "white"; }).ofObject(),
                    // new go.Binding("fill", "color"),
                    new go.Binding("template")),

                    $(go.Picture,  // the image -------------------------------------
                        // { contextMenu: partContextMenu },
                        {
                        name: "Picture",
                        desiredSize: new go.Size(48, 48),
                        // imageStretch: go.GraphObject.Fill,
                        // margin: new go.Margin(2, 2, 2, 4),
                        // margin: new go.Margin(4, 4, 4, 4),
                        },
                        new go.Binding("source", "icon", findImage)
                    ),
                    ),
                ),
                // comment out icon stop
                // define the panel where the text will appear
                $(go.Panel, "Table", // separator ---------------------------------
                    { contextMenu: contextMenu , cursor: "move" },
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
                    $(go.TextBlock, textStyle(), // the typename  --------------------
                    {
                        row: 1, column: 1, columnSpan: 6,
                        editable: false, isMultiline: false,
                        // minSize: new go.Size(10, 4),
                        margin: new go.Margin(2, 0, 1, 0),  
                        alignment: go.Spot.Center,                  
                    },
                    new go.Binding("text", "typename")
                    ),
                ),
                ),
            ),
        )
    );
    addNodeTemplateName('textAndIcon');

    nodeTemplateMap.add("label", 
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            {
                selectionObjectName: "SHAPE",
                resizable: true, resizeObjectName: "SHAPE"
            },
    
            $(go.Shape,  
                { 
                    name: "SHAPE", strokeWidth: 2,
                    geometryString: "F M0 0 L80 0 B-90 90 80 20 20 20 L100 100 20 100 B90 90 20 80 20 20z",
                    cursor: "alias",        // cursor: "pointer",
                    margin: new go.Margin(1, 1, 1, 1),
                    shadowVisible: true,
                    desiredSize: new go.Size(168, 68), // outer Shape size 
                    // set the port properties
                    portId: "", 
                    fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
                    toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true
                },
                // Shape bindings
                new go.Binding('fill', 'fillcolor'),
                new go.Binding('stroke', 'strokecolor'), 
                new go.Binding("stroke", "isHighlighted", function(h, shape) { return h ? "lightblue" : shape.part.data.strokecolor || "black"; })
                .ofObject(),
                { contextMenu: contextMenu },    
            ),
            $(go.Panel, "Table", // Panel for text  -----------------------
                { defaultAlignment: go.Spot.Left, margin: 2, cursor: "move" },
                $(go.RowColumnDefinition, { column: 1, width: 10 }),
                $(go.Panel, "Horizontal",
                    // { margin: new go.Margin(10, 10, 10, 10) },
                    {
                        defaultAlignment: go.Spot.Left
                    },
                    // define the panel where the text will appear
                    $(go.Panel, "Table", // separator ---------------------------------
                        { contextMenu: contextMenu , cursor: "move" },
                        {
                            defaultRowSeparatorStroke: "black",
                            defaultAlignment: go.Spot.Left,
                        },
                        // content
                        $(go.TextBlock, textStyle(),  // the text -----------------------
                            {
                                isMultiline: true,  // allow newlines in text
                                editable: true,     // allow in-place editing by user
                                row: 0, column: 0, columnSpan: 6,
                                font: "bold 10pt Segoe UI,sans-serif",
                                desiredSize: new go.Size(120, 36), 
                                textAlign: "left",
                                wrap: go.TextBlock.WrapFit, 
                                verticalAlignment: go.Spot.Left,
                                overflow: go.TextBlock.OverflowClip,
                                margin: 2,
                                width: 400,
                                text: "label"
                            },        
                            new go.Binding("text", "text").makeTwoWay()
                        ),
                    ),
                ),
            ),
        )
    );
    addNodeTemplateName('label');

    nodeTemplateMap.add('TEST',
        $(go.Node, "Spot",  // Vertical
        {
            selectionObjectName: "SHAPE",
            resizable: true, resizeObjectName: "SHAPE"
        },
        new go.Binding("layerName", "layer"),
        new go.Binding("deletable"),
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),       
        {
            toolTip:
            $(go.Adornment, "Auto",
                $(go.Shape, { fill: "lightyellow" }),
                $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                new go.Binding("text", "", uid.nodeInfo))
            )
        },
        $(go.Shape,
            { 
                name: "SHAPE",
                geometryString: "F M0 0 L80 0 B-90 90 80 20 20 20 L100 100 20 100 B90 90 20 80 20 20z"
            },
            { 
                minSize: new go.Size(160, 60),
                desiredSize: new go.Size(200, 100) 
            },
            new go.Binding('fill', 'fillcolor'),
            new go.Binding('stroke', 'strokecolor'), 
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        ),
        $(go.TextBlock, textStyle(),  // the text -----------------------
            new go.Binding("text", "text").makeTwoWay(),
            {
                isMultiline: true,  // allow newlines in text
                editable: true,  // allow in-place editing by user
                row: 0, column: 0, columnSpan: 6,
                font: "bold 12pt Segoe UI,sans-serif",
                // background: "lightgray",
                // minSize: new go.Size(120, 36), 
                // desiredSize: new go.Size(150, 200), 
                overflow: go.TextBlock.OverflowClip /* the default value */,
                // text: "textAlign: 'center'",
                textAlign: "center",
                // alignment: go.Spot.Center,
                // height: 46,
                // overflow: go.TextBlock.OverflowEllipsis,  // this result in only 2 lines with ... where cut
                verticalAlignment: go.Spot.Center,
                // stretch: go.GraphObject.Fill, // added to not resize object
                // overflow: go.TextBlock.OverflowEllipsis, // added to not resize object
                margin: new go.Margin(0,2,0,0)
                // name: "name"
            }
        ),        
            // $("Button",
            //     { alignment: go.Spot.TopRight },
            //     $(go.Shape, "XLine", { width: 8, height: 8 }),
            //     { click: changeTemplate }
            // ),
            new go.Binding("stroke", "isHighlighted", function(h, shape) { return h ? "lightblue" : shape.part.data.strokecolor || "black"; })
            .ofObject(),
            // new go.Binding('strokeWidth', 'strokewidth'), //sf:  the linking of relationships does not work if this is uncommented
            { contextMenu: contextMenu },    
        )
    )
    addNodeTemplateName('TEST');

    let nodeInput =          
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
        new go.Binding("layerName", "layer"),
        new go.Binding("deletable"),
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        {
            toolTip:
            $(go.Adornment, "Auto",
                $(go.Shape, { fill: "lightyellow" }),
                $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                    new go.Binding("text", "", 
                        function (d) { 
                            return uid.nodeInfo(d, myMetis);                
                        }
                    )
                )
            )
        },
        $(go.Panel, "Auto",
            $(go.Shape,  
                { 
                    name: "SHAPE", strokeWidth: 1, stroke: "gray",
                    // geometryString: "F M0 0 L80 0 B-90 90 80 20 20 20 L100 100 20 100 B90 90 20 80 20 20z",
                    // geometryString: "F1 m 0,0 l 5,0 1,4 -1,4 -5,0 1,-4 -1,-4 z",
                    geometryString: "M145 260L360 260L400 200L360 148L145 148L145 260Z",
                    // geometryString: "M143.59 259.39L355.48 259.39L403.77 203.22L355.48 147.04L143.59 147.04L143.59 259.39Z",
                    // geometryString: "F M0 0 L80 0 B-90 90 80 20 20 20 L100 100 20 100 B90 90 20 80 20 20z"
                    // geometryString: "M210 210L190 240L280 240L310 210L280 180L190 180L210 210Z",
                    fill: "white",
                    spot1: new go.Spot(0, 0, 5, 1),  // keep the text inside the shape
                    spot2: new go.Spot(1, 1, -5, 0),
                    cursor: "alias",        // cursor: "pointer",
                    scale: 3,
                    portId: "",
                    toSpot: go.Spot.Left,
                    toLinkable: true,
                    fromSpot: go.Spot.Right,
                    fromLinkable: true,
                      },
                new go.Binding("fill", "fillcolor")
            ),
            $(go.TextBlock,
                new go.Binding("text", "name").makeTwoWay()
            ),
            { contextMenu: contextMenu },    
        )
    );
    nodeTemplateMap.add("Input", nodeInput);
    addNodeTemplateName('Input');
    nodeTemplateMap.add("Output", nodeInput);
    addNodeTemplateName('Output');

    nodeTemplateMap.add('Control',
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            {
                toolTip:
                $(go.Adornment, "Auto",
                    $(go.Shape, { fill: "lightyellow" }),
                    $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                        new go.Binding("text", "", 
                            function (d) { 
                                return uid.nodeInfo(d, myMetis);                
                            }
                        )
                    )
                )
            },
            $(go.Panel, "Auto",
                $(go.Shape,  
                { 
                    name: "SHAPE", strokeWidth: 1, stroke: "gray",
                    // geometryString: "M400 166.67L440 150L440 225L400 250L360 225L360 150L400 166.67Z",
                    geometryString: "M150 250L200 300L250 250L250 100L150 100L150 250Z",
                    fill: "white",
                    cursor: "alias",        // cursor: "pointer",
                    scale: 3,
                    portId: "",
                    toSpot: go.Spot.Top,
                    toLinkable: true,
                    fromSpot: go.Spot.Bottom,
                    fromLinkable: true,
                },
                new go.Binding("fill", "fillcolor")),
                $(go.TextBlock,
                    new go.Binding("text", "name").makeTwoWay()),
            ),
            { contextMenu: contextMenu },    
        )
    );
    addNodeTemplateName('Control');

    nodeTemplateMap.add('Mechanism',
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            {
                toolTip:
                $(go.Adornment, "Auto",
                    $(go.Shape, { fill: "lightyellow" }),
                    $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                        new go.Binding("text", "", 
                            function (d) { 
                                return uid.nodeInfo(d, myMetis);                
                            }
                        )
                    )
                )
            },
            $(go.Panel, "Auto",
                $(go.Shape,  
                { 
                    name: "SHAPE", strokeWidth: 1, stroke: "gray",
                    // geometryString: "M400 166.67L440 150L440 225L400 250L360 225L360 150L400 166.67Z",
                    geometryString: "M150 150L200 100L250 150L250 300L150 300L150 150Z",
                    fill: "white",
                    cursor: "alias",        // cursor: "pointer",
                    scale: 3,
                    portId: "",
                    toSpot: go.Spot.Bottom,
                    toLinkable: true,
                    fromSpot: go.Spot.Top,
                    fromLinkable: true,
                },
                new go.Binding("fill", "fillcolor")),
                $(go.TextBlock,
                    new go.Binding("text", "name").makeTwoWay()),
            ),
            { contextMenu: contextMenu },    
        )
    );
    addNodeTemplateName('Mechanism');

    // geometryString: "M150 150L200 100L250 150L250 300L150 300L150 150Z",

    // nodeTemplateMap.add('ICOM'),
    // $(go.Node, "Auto",
    //   { selectionAdorned: false },
    //   {
    //     mouseDrop: function(e, n: any) {
    //       // when the selection is entirely ports and is dropped onto a Group, transfer membership
    //       if (n.containingGroup !== null && myDiagram.selection.all(selectionIncludesPorts)) {
    //         myDiagram.selection.each(function(p) { p.containingGroup = n.containingGroup; });
    //       } else {
    //         myDiagram.currentTool.doCancel();
    //       }
    //     }
    //   },
    //   $(go.Shape,
    //     {
    //       name: "SHAPE",
        //   fill: UnselectedBrush, stroke: "gray",
        //   geometryString: "F1 m 0,0 l 5,0 1,4 -1,4 -5,0 1,-4 -1,-4 z",
        //   spot1: new go.Spot(0, 0, 5, 1),  // keep the text inside the shape
        //   spot2: new go.Spot(1, 1, -5, 0),
        //   // some port-related properties
        //   portId: "",
        //   toSpot: go.Spot.Left,
        //   toLinkable: false,
        //   fromSpot: go.Spot.Right,
        //   fromLinkable: false,
        //   cursor: "pointer"
        // },
        // new go.Binding("fill", "isSelected", function(s) { return s ? SelectedBrush : UnselectedBrush; }).ofObject(),
        // new go.Binding("toLinkable", "_in"),
        // new go.Binding("fromLinkable", "_in", function(b) { return !b; }
    //     )),
    //   $(go.TextBlock,
    //     new go.Binding("text", "name")
    // );
    // addNodeTemplateName('ICOM');

}

function changeTemplate(e: any, obj: any) {
    const node = obj.part;
    if (node) {
      const diagram = node.diagram;
      diagram.startTransaction("changeTemplate");
      var cat = diagram.model.getCategoryForNodeData(node.data);
      if (cat === "simple")
        cat = "TEST";
      else
        cat = "simple";
      diagram.model.setCategoryForNodeData(node.data, cat);
      diagram.commitTransaction("changeTemplate");
    }
}

export function getLinkTemplate(templateName: string, contextMenu: any, myMetis: akm.cxMetis): any {
    const dotted = [3, 3];
    const dashed = [5, 5];

    const linkTemplate =
        $(go.Link,
            new go.Binding("deletable"),
            { selectable: true },
            { 
            toShortLength: 3, 
            relinkableFrom: true, 
            relinkableTo: true, 
            reshapable: true,
            resegmentable: true  
            },
            // link route 
            { routing: go.Link.Normal,  corner: 10},  // link route should avoid nodes
            new go.Binding("routing", "routing",
                function(r) {
                    return getRouting(r);
                }
            ),
            new go.Binding("curve", "curve",
                function (c) {
                    return getCurve(c);
                }
            ),
            new go.Binding("points").makeTwoWay(),
            { contextMenu: contextMenu },
            // link shape
            $(go.Shape, { stroke: "black", strokeWidth: 1, strokeDashArray: null, shadowVisible: true, },
            new go.Binding("stroke", "strokecolor"),
            new go.Binding("strokeWidth", "strokewidth"),
            new go.Binding("strokeDashArray", "dash", 
                function(d) { return setDashed(d); }),
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
                        new go.Binding("text", "", 
                            function (d) { 
                                return uid.linkInfo(d, myMetis);
                            }
                        )
                    ),
                )
            },
        );
    return linkTemplate;
}

export function getGroupTemplate(templateName: string, contextMenu: any, myMetis: akm.cxMetis): any {
    const groupTemplate =
        $(go.Group, "Auto",
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("visible"),
            { contextMenu: contextMenu },
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
                }).ofObject(),
                {
                    toolTip:
                    $(go.Adornment, "Auto",
                        $(go.Shape, { fill: "lightyellow" }),
                        $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                            new go.Binding("text", "", 
                                function (d) { 
                                    return uid.nodeInfo(d, myMetis);                
                                }
                            )
                        )
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
                    $(go.TextBlock,     // the typename
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
        );    
    return groupTemplate;
}
// Function to identify images related to an image id
export function findImage(image: string) {
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
export function textStyle() {
    return { font: "9pt  Segoe UI,sans-serif", stroke: "black" };
}

// Function to highlight group
export function highlightGroup(e: any, grp: any, show: boolean) {
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

export function setDashed(d: string) { 
    const dotted = [3, 3];
    const dashed = [5, 5];
    switch (d) {
        case "dotted":
        case "Dotted":
        case "Dotted Line":
            return dotted;
        case "dashed":
        case "Dashed":
        case "Dashed Line":
            return dashed;
        default:
            return null;
    }
}



