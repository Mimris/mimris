// @ts-nocheck
const debug = false; 
import * as go from 'gojs';
// import * as figures from 'gojs/extensions/Figures';
import * as utils from './utilities';
import * as uic from './ui_common';
import * as uid from './ui_diagram';
import * as ui_mtd from './ui_methods';
import * as akm from './metamodeller';
import * as gjs from './ui_gojs';
import * as jsn from './ui_json';
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

function selectionIncludesPorts(n, myDiagram) {
    return n.containingGroup !== null && !myDiagram?.selection.has(n.containingGroup);
}

let nodeTemplateNames = []; 
let groupTemplateNames = []; 

export function getNodeTemplateNames() {
    return nodeTemplateNames;
}
export function getGroupTemplateNames() {
    return groupTemplateNames;
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

function addGroupTemplateName(name: string) {
    if (groupTemplateNames.length == 0) {
        groupTemplateNames.push(name);
        return;        
    }
    let names = [...new Set(groupTemplateNames)];
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
    groupTemplateNames = names1;
} 

export function addNodeTemplates(nodeTemplateMap: any, contextMenu: any, myMetis: akm.cxMetis) {
    const myDiagram = myMetis.myDiagram;
    let nodeTemplate0 =      
    $(go.Node, 'Auto',  // the Shape will go around the TextBlock
    new go.Binding("stroke", "strokecolor"),
    new go.Binding("layerName", "layer"),
    new go.Binding("deletable"),
    new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
    new go.Binding("scale", "scale1").makeTwoWay(),
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
    {
        selectionObjectName: "SHAPE",
        resizable: false, resizeObjectName: "SHAPE"
    },
    $(go.Shape, 'RoundedRectangle', 
        {
        cursor: "alias",        // cursor: "pointer",
        name: 'SHAPE', fill: 'red', stroke: "#fff",  strokeWidth: 2, 
        margin: new go.Margin(1, 1, 1, 1),
        shadowVisible: true,
        minSize: new go.Size(158, 68),
        // desiredSize: new go.Size(158, 68), 
        // set the port properties
        portId: "", 
        fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
        toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true
        },
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),    
        // Shape bindings
        new go.Binding('fill', 'fillcolor'),
        new go.Binding('stroke', 'strokecolor'), 
        new go.Binding("stroke", "isHighlighted", 
            function(h, shape) { 
                return h ? "lightblue" : shape.part.data.strokecolor || "black"; 
            }).ofObject(),
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
        // { defaultAlignment: go.Spot.Left, margin: 2, cursor: "move" },
        $(go.RowColumnDefinition, { column: 1, width: 4 }),
        $(go.Panel, "Horizontal",
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
            // content
            $(go.TextBlock, textStyle(),  // the name -----------------------
            {
                isMultiline: false,  // don't allow newlines in text
                editable: true,  // allow in-place editing by user
                row: 0, column: 0, columnSpan: 6,
                font: "bold 10pt Segoe UI,sans-serif",
                minSize: new go.Size(120, 36), 
                textAlign: "center",
                height: 46,
                // overflow: go.TextBlock.OverflowEllipsis,  // this result in only 2 lines with ... where cut
                verticalAlignment: go.Spot.Center,
                // stretch: go.GraphObject.Fill, // added to not resize object
                // overflow: go.TextBlock.OverflowEllipsis, // added to not resize object
                margin: new go.Margin(0,2,0,0),
                name: "name"
            },        
            new go.Binding("text", "name").makeTwoWay(),
            new go.Binding("stroke", "textcolor").makeTwoWay()
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
    nodeTemplateMap.add("", nodeTemplate0);
    nodeTemplateMap.add("textOnly", nodeTemplate0);
    addNodeTemplateName('textOnly');

    let nodeTemplate1 =      
    $(go.Node, 'Auto',  // the Shape will go around the TextBlock
    new go.Binding("stroke", "strokecolor"),
    new go.Binding("layerName", "layer"),
    new go.Binding("deletable"),
    new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
    new go.Binding("scale", "scale1").makeTwoWay(),
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
    {
        selectionObjectName: "SHAPE",
        resizable: true, resizeObjectName: "SHAPE"
    },
    $(go.Shape, 'RoundedRectangle', 
        {
        cursor: "alias",        // cursor: "pointer",
        name: 'SHAPE', fill: 'red', stroke: "#fff",  strokeWidth: 2, 
        margin: new go.Margin(1, 1, 1, 1),
        shadowVisible: true,
        minSize: new go.Size(158, 68),
        desiredSize: new go.Size(158, 68), 
        // set the port properties
        portId: "", 
        fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
        toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true
        },
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),    
        // Shape bindings
        new go.Binding('fill', 'fillcolor'),
        new go.Binding('stroke', 'strokecolor'), 
        new go.Binding("stroke", "isHighlighted", 
            function(h, shape) { 
                return h ? "lightblue" : shape.part.data.strokecolor || "black"; 
            }).ofObject(),
        // new go.Binding('strokeWidth', 'strokewidth'), //sf:  the linking of relationships does not work if this is uncommented
        { contextMenu: contextMenu },  
        ),
    $(go.Shape, 'RoundedRectangle',  //smaller transparent rectangle to set cursor to move
        {
            name: "SHAPE",
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
        {
            defaultAlignment: go.Spot.Center
        },
        // define the panel where the text will appear
        $(go.Panel, "Table", // separator ---------------------------------
            { contextMenu: contextMenu , cursor: "move" },
            {
            defaultRowSeparatorStroke: "black",
            defaultAlignment: go.Spot.Center,
            },
            // content
            $(go.TextBlock, textStyle(),  // the name -----------------------
            {
                isMultiline: false,  // don't allow newlines in text
                editable: true,  // allow in-place editing by user
                row: 0, column: 0, columnSpan: 6,
                // stretch: go.GraphObject.Fill,
                font: "bold 10pt Segoe UI,sans-serif",
                minSize: new go.Size(120, 36), 
                desiredSize: new go.Size(800, 60),
                textAlign: "center",
                height: 46,
                verticalAlignment: go.Spot.Center,
                margin: new go.Margin(2,2,2,2),
                name: "name"
            },        
            new go.Binding("text", "name").makeTwoWay(),
            new go.Binding("stroke", "textcolor").makeTwoWay()
            ),
            $(go.TextBlock, textStyle(), // the typename  --------------------
            {
                row: 1, column: 1, columnSpan: 6,
                stretch: go.GraphObject.Fill,
                editable: false, isMultiline: false,
                minSize: new go.Size(10, 4),
                margin: new go.Margin(0, 0, 0, 2),  
                textAlign: "center",
            },
            new go.Binding("text", "typename")
            ),
        ),
        ),
    ),
    );
    nodeTemplateMap.add("textOnly1", nodeTemplate1);
    addNodeTemplateName('textOnly1');

    let nodeTemplate2 =      
    $(go.Node, 'Auto',  // the Shape will go around the TextBlock
    new go.Binding("stroke", "strokecolor"),
    new go.Binding("layerName", "layer"),
    new go.Binding("deletable"),
    new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
    new go.Binding("scale", "scale1").makeTwoWay(),
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
    {
        selectionObjectName: "SHAPE",
        resizable: true, resizeObjectName: "SHAPE"
    },
    $(go.Shape, 'RoundedRectangle', 
        {
        cursor: "alias",        // cursor: "pointer",
        name: 'SHAPE', fill: 'red', stroke: "#fff",  strokeWidth: 2, 
        margin: new go.Margin(1, 1, 1, 1),
        shadowVisible: true,
        minSize: new go.Size(158, 68),
        desiredSize: new go.Size(158, 68), 
        // set the port properties
        portId: "", 
        fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
        toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true
        },
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),    
        // Shape bindings
        new go.Binding('fill', 'fillcolor'),
        new go.Binding('stroke', 'strokecolor'), 
        new go.Binding("stroke", "isHighlighted", 
            function(h, shape) { 
                return h ? "lightblue" : shape.part.data.strokecolor || "black"; 
            }).ofObject(),
        // new go.Binding('strokeWidth', 'strokewidth'), //sf:  the linking of relationships does not work if this is uncommented
        { contextMenu: contextMenu },  
        ),
    $(go.Shape, 'RoundedRectangle',  //smaller transparent rectangle to set cursor to move
        {
            name: "SHAPE",
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
        {
            defaultAlignment: go.Spot.Center
        },
        // define the panel where the text will appear
        $(go.Panel, "Table", // separator ---------------------------------
            { contextMenu: contextMenu , cursor: "move" },
            {
            defaultRowSeparatorStroke: "black",
            defaultAlignment: go.Spot.Center,
            },
            // content
            $(go.TextBlock, textStyle(),  // the name -----------------------
            {
                isMultiline: false,  // don't allow newlines in text
                editable: true,  // allow in-place editing by user
                row: 0, column: 0, columnSpan: 6,
                // stretch: go.GraphObject.Fill,
                font: "bold 10pt Segoe UI,sans-serif",
                minSize: new go.Size(120, 36), 
                desiredSize: new go.Size(800, 60),
                textAlign: "center",
                height: 46,
                verticalAlignment: go.Spot.Center,
                margin: new go.Margin(2,2,2,2),
                name: "name"
            },        
            new go.Binding("text", "name").makeTwoWay(),
            new go.Binding("stroke", "textcolor").makeTwoWay()
            ),
        ),
        ),
    ),
    );
    nodeTemplateMap.add("textOnly2", nodeTemplate2);
    addNodeTemplateName('textOnly2');

    nodeTemplateMap.add("textAndIcon", 
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
            new go.Binding("stroke", "strokecolor"),
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("scale", "scale1").makeTwoWay(),
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
                new go.Binding("stroke", "isHighlighted", 
                    function(h, shape) { 
                        return h ? "lightblue" : shape.part.data.strokecolor || "black"; 
                    }).ofObject(),
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
                                    minSize: new go.Size(10, 4),
                                    margin: new go.Margin(0, 0, 0, 2),  
                                    textAlign: "center",
                                                    },
                                new go.Binding("text", "typename")
                            ),
                        ),
                    ),
                ),
            )
        );
    addNodeTemplateName('textAndIcon');
                        
    nodeTemplateMap.add("textAndGeometry", 
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
            new go.Binding("stroke", "strokecolor"),
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("scale", "scale1").makeTwoWay(),
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
                name: 'SHAPE', fill: 'red', stroke: "#000",  strokeWidth: 2, 
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
            $(go.Panel, "Table", // Panel for text and geometry ------------------------
                { defaultAlignment: go.Spot.Left, margin: 2, cursor: "move" },
                $(go.RowColumnDefinition, { column: 1, width: 4 }),
                $(go.Panel, "Horizontal",
                    // { margin: new go.Margin(10, 10, 10, 10) },
                    {
                        defaultAlignment: go.Spot.Center
                    },
                    $(go.Panel, "Vertical", // Panel for Geometry  ------------------------
                        { contextMenu: contextMenu , cursor: "move" },
                        $(go.Shape, 
                            // new go.Binding("stroke", "strokecolor"),
                            // new go.Binding("fill", "fillcolor"),
                            new go.Binding("template"),
                            new go.Binding("geometryString", "geometry"),
                            // "M30 100 C 50 50, 70 20, 100 100, 110, 130, 45, 150, 65, 100"
                            // "F M0 0 L80 0 B-90 90 80 20 20 20 L100 100 20 100 B90 90 20 80 20 20z"
                            // "F M312.37 186.08L371.69 193.48L328.77 229.35L338.9 280L285.84 256.08L232.79 280L242.92 229.35L200 193.48L259.32 186.08L285.84 140L312.37 186.08Z"
                            { 
                                name: "SHAPE", 
                                strokeWidth: 2,
                                stroke: "blue",
                                fill: "lightyellow",
                                cursor: "alias",        // cursor: "pointer",
                                margin: new go.Margin(1, 1, 1, 1),
                                shadowVisible: true,
                                desiredSize: new go.Size(48, 48), // outer Shape size 
                            },
                            // new go.Binding('strokeWidth', 'strokewidth'),
                        ),
                    ),
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
                            new go.Binding("text", "name").makeTwoWay(),
                            new go.Binding("stroke", "textcolor").makeTwoWay()
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
    addNodeTemplateName('textAndGeometry');    
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
                    minSize: new go.Size(150, 60), 
                    desiredSize: new go.Size(168, 68), // outer Shape size 
                    // set the port properties
                    portId: "", 
                    toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: false
                },
                new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),    
                // Shape bindings
                new go.Binding('fill', 'fillcolor'),
                new go.Binding('stroke', 'strokecolor'), 
                new go.Binding("stroke", "isHighlighted", function(h, shape) { return h ? "lightblue" : shape.part.data.strokecolor || "black"; })
                .ofObject(),
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
            $(go.Panel, "Table", // Panel for text  -----------------------
                { defaultAlignment: go.Spot.Left, margin: 4, cursor: "pointer" },
                $(go.RowColumnDefinition, { column: 1, width: 4 }),
                $(go.Panel, "Horizontal",
                    {
                        defaultAlignment: go.Spot.Center
                    },
                    // define the panel where the text will appear
                    $(go.Panel, "Table", 
                        // { contextMenu: contextMenu , cursor: "move" },
                        {
                            defaultRowSeparatorStroke: "black",
                            defaultAlignment: go.Spot.Center,
                        },
                        // content
                        $(go.TextBlock, textStyle(),  // the text -----------------------
                            {
                                stretch: go.GraphObject.Fill,
                                alignment: go.Spot.Center,
                                isMultiline: true,  // allow newlines in text
                                editable: true,     // allow in-place editing by user
                                font: "bold 10pt Segoe UI,sans-serif",
                                textAlign: "left",
                                wrap: go.TextBlock.WrapBreakAll, 
                                overflow: go.TextBlock.OverflowClip,
                                margin: 10,
                                text: "label",
                            },        
                            new go.Binding("text", "text").makeTwoWay()
                        ),
                    ),
                ),
            ),
        )
    );
    // addNodeTemplateName('label');

    nodeTemplateMap.add("Split",
      $(go.Node, "Auto",
        { locationSpot: go.Spot.Center },
        $(go.Shape, "Diamond",
          {
            fill: "deepskyblue", stroke: null, strokeWidth: 0,
            desiredSize: new go.Size(28, 28)
          }),
        $(go.TextBlock,
          new go.Binding("name"))
      ));
    // addNodeTemplateName('Split');




    if (false) {                    
        let nodeInput =               
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
                        geometryString: "M145 260L360 260L400 200L360 148L145 148L145 260Z",
                        cursor: "alias",        // cursor: "pointer",
                        margin: new go.Margin(1, 1, 1, 1),
                        shadowVisible: true,
                        desiredSize: new go.Size(168, 68), // outer Shape size 
                        // set the port properties
                        portId: "",
                        toSpot: go.Spot.Left,
                        toLinkable: true,
                        fromSpot: go.Spot.Right,
                        fromLinkable: true,
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
                                    // text: "name"
                                },        
                                new go.Binding("text", "name").makeTwoWay()
                            ),
                        ),
                    ),
                ),
            
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
                        new go.Binding("stroke", "textcolor").makeTwoWay()
                ),
                { contextMenu: contextMenu },    
            )
        );
        //addNodeTemplateName('Control');

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
                        new go.Binding("stroke", "textcolor").makeTwoWay()
                ),
                { contextMenu: contextMenu },    
            )
        );
        //addNodeTemplateName('Mechanism');

        nodeTemplateMap.add('InOut',
            $(go.Node, "Auto",
                { selectionAdorned: false },
                {
                    mouseDrop: function(e, n: any) {
                        // when the selection is entirely ports and is dropped onto a Group, transfer membership
                        if (n.containingGroup !== null && myDiagram.selection.all(selectionIncludesPorts)) {
                            myDiagram.selection.each(function(p) { p.containingGroup = n.containingGroup; });
                        } else {
                            myDiagram.currentTool.doCancel();
                        }
                    }
                },
                $(go.Shape,
                    {
                    name: "SHAPE",
                    fill: UnselectedBrush, stroke: "gray",
                    geometryString: "F1 m 0,0 l 5,0 1,4 -1,4 -5,0 1,-4 -1,-4 z",
                    spot1: new go.Spot(0, 0, 5, 1),  // keep the text inside the shape
                    spot2: new go.Spot(1, 1, -5, 0),
                    // some port-related properties
                    portId: "",
                    toSpot: go.Spot.Left,
                    toLinkable: false,
                    fromSpot: go.Spot.Right,
                    fromLinkable: false,
                    cursor: "pointer"
                    },
                    new go.Binding("fill", "isSelected", function(s) { return s ? SelectedBrush : UnselectedBrush; }).ofObject(),
                    new go.Binding("toLinkable", "_in"),
                    new go.Binding("fromLinkable", "_in", function(b) { return !b; })
                ),
                $(go.TextBlock,
                    new go.Binding("text", "name"),
                    new go.Binding("stroke", "textcolor").makeTwoWay()
                    )
            )
        );
        //addNodeTemplateName('InOut');

        nodeTemplateMap.add('Test',
            $(go.Node, "Auto",
            {
                locationSpot: go.Spot.Center, locationObjectName: "SHAPE",
                desiredSize: new go.Size(120, 60), minSize: new go.Size(40, 40),
                resizable: true, resizeCellSize: new go.Size(20, 20)
            },
            // these Bindings are TwoWay because the DraggingTool and ResizingTool modify the target properties
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
            $(go.Shape,
                { // the border
                name: "SHAPE", fill: "white",
                portId: "", cursor: "alias",
                fromLinkable: true, toLinkable: true,
                fromLinkableDuplicates: true, toLinkableDuplicates: true,
                fromSpot: go.Spot.AllSides, toSpot: go.Spot.AllSides
                },
                new go.Binding("figure"),
                new go.Binding("fill"),
                new go.Binding("stroke", "color"),
                new go.Binding("strokeWidth", "thickness"),
                new go.Binding("strokeDashArray", "dash")),
            // this Shape prevents mouse events from reaching the middle of the port
            $(go.Shape, { width: 100, height: 40, strokeWidth: 0, fill: "transparent" }),
            $(go.TextBlock,
                { margin: 1, textAlign: "center", overflow: go.TextBlock.OverflowEllipsis, editable: true },
                // this Binding is TwoWay due to the user editing the text with the TextEditingTool
                new go.Binding("text").makeTwoWay(),
                new go.Binding("stroke", "color"))
            )
        );
        addNodeTemplateName('Test');

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
            $(go.Shape, { fromArrow: ""},
            { scale: 1.3, fill: "" },
            new go.Binding("fromArrow", "fromArrow"),
            new go.Binding("fill", "fromArrowColor"),
            new go.Binding("stroke", "strokecolor"),
            new go.Binding("scale", "arrowscale").makeTwoWay(),
            ),
            // the "to" arrowhead
            $(go.Shape, { toArrow: ""},  
            { scale: 1.3, fill: "white" },
            new go.Binding("toArrow", "toArrow"),
            new go.Binding("fill", "toArrowColor"),
            new go.Binding("stroke", "strokecolor"),
            new go.Binding("scale", "arrowscale").makeTwoWay(),
            ),
            // cardinality from
            $(go.TextBlock, "",
                { segmentIndex: NaN, segmentFraction: 0.15},
                { segmentOffset: new go.Point(0, 10) },
                new go.Binding("text", "cardinalityFrom"),
                new go.Binding("scale", "textscale").makeTwoWay(),
                ),
            // cardinality to
            $(go.TextBlock, "",
            { segmentIndex: NaN, segmentFraction: 0.85},
                { segmentOffset: new go.Point(0, -10) },
                new go.Binding("text", "cardinalityTo"),
                new go.Binding("scale", "textscale").makeTwoWay(),
                ),
            // link label
            $(go.TextBlock,  "",
            {
                isMultiline: false,  // don't allow newlines in text
                editable: true,  // allow in-place editing by user
            },
            { segmentOffset: new go.Point(0, 10) },
            new go.Binding("text", "name").makeTwoWay(),
            new go.Binding("stroke", "textcolor").makeTwoWay(),
            new go.Binding("scale", "textscale").makeTwoWay(),
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

export function addGroupTemplates(groupTemplateMap: any, contextMenu: any, myMetis: akm.cxMetis): any {
    const myDiagram = myMetis.myDiagram;

    const groupTemplate1 =
        $(go.Group, "Auto",
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("visible"),
            { contextMenu: contextMenu },
            {
                locationObjectName: "SHAPE",
                resizable: true, resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
                subGraphExpandedChanged: function (grp) {
                    var shp = grp.resizeObject;
                    if (grp.diagram.undoManager.isUndoingRedoing) return;
                    if (grp.isSubGraphExpanded) {
                        shp.fill = "white";
                    } else {
                        shp.fill = "transparent";
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
            new go.Binding("scale", "scale1").makeTwoWay(),
            new go.Binding("background", "isHighlighted",
            function (h) {
                return h ? "rgba(255,0,0,0.2)" : "transparent"; // this is the background of all
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
            {
                cursor: "alias",
                fill: "transparent", 
                shadowVisible: true,
                minSize: new go.Size(150,75),
                portId: "", 
                fromLinkable: true, fromLinkableSelfNode: false, fromLinkableDuplicates: true,
                toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: true,
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
                        new go.Binding("text", "name").makeTwoWay(),
                        new go.Binding("stroke", "textcolor").makeTwoWay()
                    ),
                    $(go.TextBlock,     // the typename
                        {
                            row: 1, column: 1, columnSpan: 6, textAlign: "end",
                            editable: false, isMultiline: false,
                            minSize: new go.Size(10, 4),
                            margin: new go.Margin(2, 0, 0, 2)
                        },
                        // new go.Binding("text", "typename")
                    ),
                ), // End Horizontal Panel
                $(go.Shape,  // using a Shape instead of a Placeholder - this is open container
                    {
                        name: "SHAPE", fill: "white",
                        opacity: 0.95,
                        minSize: new go.Size(150, 75), 
                        // desiredSize: new go.Size(300, 200),
                        margin: new go.Margin(0, 1, 1, 4),
                        cursor: "move",
                    },
                    new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
                    new go.Binding("isSubGraphExpanded").makeTwoWay(),    
                )        
            ),
    )    
    groupTemplateMap.add("", groupTemplate1);
    groupTemplateMap.add("Container1", groupTemplate1);
    addGroupTemplateName('Container1');

    if (true) {
        const groupTemplate2 =
        $(go.Group, "Auto",
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding("visible"),
        { contextMenu: contextMenu },
        {
            // selectionObjectName: "SHAPE",  // selecting a lane causes the body of the lane to be highlit, not the label
            locationObjectName:  "SHAPE",
            resizable: true, resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
            subGraphExpandedChanged: function (grp) {
                var shp = grp.resizeObject;
                if (grp.diagram.undoManager.isUndoingRedoing) return;
                if (grp.isSubGraphExpanded) {
                    shp.fill = "lightyellow";
                } else {
                    shp.fill = "transparent";
                }
            },
        },
        {
        background: "transparent",
        ungroupable: true,
        // highlight when dragging into the Group
        mouseDragEnter: function(e, grp, prev) { highlightGroup(e, grp, true); },
        mouseDragLeave: function(e, grp, next) { highlightGroup(e, grp, false); },
        computesBoundsAfterDrag: true,
        // when the selection is dropped into a Group, add the selected Parts into that Group;
        // if it fails, cancel the tool, rolling back any changes
        // mouseDrop: finishDrop,
        handlesDragDropForMembers: true,  // don't need to define handlers on member Nodes and Links
        // Groups containing Nodes lay out their members vertically
        //layout: $(go.TreeLayout)
        },
        new go.Binding("scale", "scale1").makeTwoWay(),
        new go.Binding("background", "isHighlighted", 
            function(h) { 
                return h ? "rgba(255,0,0,0.2)" : "transparent"; 
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
        {
            cursor: "pointer",
            fill: "white", 
            minSize: new go.Size(150, 75),
            portId: "", 
            fromLinkable: true, fromLinkableSelfNode: false, fromLinkableDuplicates: true,
            toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: true,
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
                { font: "Bold 12pt Sans-Serif", 
                  editable: true, isMultiline: false,
                },
                new go.Binding("fill", "fillcolor"),
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("stroke", "textcolor").makeTwoWay()
                ),
            ), // End Horizontal Panel
            
            $(go.Shape,  // using a Shape instead of a Placeholder
              { name: "SHAPE", 
                fill: "lightyellow", 
                minSize: new go.Size(150, 75),
                margin: new go.Margin(0, 1, 1, 4),
                cursor: "move",
            },
              new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),                           
              new go.Binding("isSubGraphExpanded").makeTwoWay(),    
              )
          )
        )
        groupTemplateMap.add("Container2", groupTemplate2);
        addGroupTemplateName('Container2');
    }
    if (false) {
        const groupTemplate3 =
            $(go.Group, "Auto",
            {
                selectionAdorned: false,
                locationSpot: go.Spot.Center, locationObjectName: "ICON"
            },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            { contextMenu: contextMenu },
            {
                selectionObjectName: "SHAPE",  // selecting a lane causes the body of the lane to be highlit, not the label
                locationObjectName:  "SHAPE",
                resizable: true, resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
            },
            {
                mouseDrop: function(e, g) {
                // when the selection is entirely ports and is dropped onto a Group, transfer membership
                // if (myDiagram.selection.all(selectionIncludesPorts)) {
                //     myDiagram.selection.each(function(p) { p.containingGroup = g; });
                // } else {
                //     myDiagram.currentTool.doCancel();
                // }
                },
                // layout: new InputOutputGroupLayout()
            },
            $(go.Shape, "RoundedRectangle",
                { stroke: "gray", strokeWidth: 2, fill: "white" },
                {minSize: new go.Size(100, 50)},
                new go.Binding("stroke", "isSelected", function(b) { return b ? SelectedBrush : UnselectedBrush; }).ofObject()),
            $(go.Panel, "Vertical",
                { margin: 6 },
                $(go.TextBlock,
                new go.Binding("text", "name"),
                { alignment: go.Spot.Left }),
                // $(go.Panel, "Spot",
                //   { name: "ICON", height: 60 },  // an initial height; size will be set by InputOutputGroupLayout
                //   $(go.Shape,
                //     { fill: null, stroke: null, stretch: go.GraphObject.Fill }),
                //   $(go.Picture, "images/60x90.png",
                //     { width: 30, height: 45 })
                // )
            )
            );
        groupTemplateMap.add("Process", groupTemplate3);
        addGroupTemplateName('Process');
    }
    if (false) {
        const groupTemplate4 = 
            $(go.Group, "Vertical",
            { layout: $(go.TreeLayout, { setsPortSpot: false, setsChildPortSpot: false }) },
            { defaultStretch: go.GraphObject.Horizontal },
            { fromSpot: go.Spot.RightSide, toSpot: go.Spot.LeftSide },
            $(go.Panel, "Auto",
            // $(go.Shape, "RoundedTopRectangle",
            $(go.Shape, "RoundedRectangle",
            { fill: "white" },
                new go.Binding("fill", "role", function(r) { return r[0] === 't' ? "lightgray" : "white"; })),
                $(go.TextBlock,
                { margin: new go.Margin(2, 2, 0, 2), textAlign: "center" },
                new go.Binding("text", "header"))
            ),
            $(go.Panel, "Auto",
                $(go.Shape, { fill: "white" }),
                $(go.Placeholder, { padding: 20 }),
                $(go.Shape, "Rectangle",
                {
                    visible: false, width: 10, height: 10,
                    alignment: new go.Spot(0.5, 1, 0, -3), alignmentFocus: go.Spot.Bottom
                },
                new go.Binding("visible", "loop"))
            ),
            $(go.Panel, "Auto",
                // $(go.Shape, "RoundedBottomRectangle",
                $(go.Shape, "RoundedRectangle",
                { fill: "white" },
                new go.Binding("fill", "role", function(r) { return r[0] === 'b' ? "lightgray" : "white"; })),
                $(go.TextBlock,
                { margin: new go.Margin(2, 2, 0, 2), textAlign: "center" },
                new go.Binding("text", "footer"))
            )
            );
            groupTemplateMap.add("Test", groupTemplate4);
            addGroupTemplateName('Test');
    }
    if (false) {
        const groupTemplate5 =
        $(go.Group, go.Panel.Auto,
          {
            background: "transparent",
            // highlight when dragging into the Group
            mouseDragEnter: (e, grp, prev) => highlightGroup(e, grp, true),
            mouseDragLeave: (e, grp, next) => highlightGroup(e, grp, false),
            // computesBoundsAfterDrag: true,
            // when the selection is dropped into a Group, add the selected Parts into that Group;
            // if it fails, cancel the tool, rolling back any changes
            // mouseDrop: finishDrop,
            // handlesDragDropForMembers: true,  // don't need to define handlers on member Nodes and Links
            // Groups containing Groups lay out their members horizontally
            // layout:
            //   $(go.GridLayout,
            //     {
            //       wrappingWidth: Infinity, alignment: go.GridLayout.Position,
            //       cellSize: new go.Size(1, 1), spacing: new go.Size(4, 4)
            //     })
          },
          new go.Binding("background", "isHighlighted", h => h ? "lightyellow" : "transparent").ofObject(),
          $(go.Shape, "Rectangle",
            { 
                fill: null, 
                stroke: "#E69900", 
                strokeWidth: 2,
            }),
          $(go.Panel, go.Panel.Vertical,  // title above Placeholder
            $(go.Panel, go.Panel.Horizontal,  // button next to TextBlock
              { stretch: go.GraphObject.Horizontal, background: "#FFDD33", margin: 1 },
              $("SubGraphExpanderButton",
                { alignment: go.Spot.Right, margin: 5 }),
            $(go.TextBlock,
                {
                  alignment: go.Spot.Left,
                  editable: true,
                  margin: 5,
                  font: "bold 18px sans-serif",
                  stroke: "#9A6600"
                },
                new go.Binding("text", "name").makeTwoWay())
            ),  // end Horizontal Panel
            $(go.Placeholder,
                new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),                           
                { padding: 5, alignment: go.Spot.TopLeft })
          )  // end Vertical Panel
        );  // end Group and call to add to template Map
        groupTemplateMap.add("Container5", groupTemplate5);
        addGroupTemplateName('Container5'); 
    }
    if (false) {
        const groupTemplate6 =
        $(go.Group, "Auto",
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding("visible"),
        { contextMenu: contextMenu },
        {
          background: "transparent",
          // ungroupable: true,
          // highlight when dragging into the Group
          mouseDragEnter: function(e, grp, prev) { highlightGroup(e, grp, true); },
          mouseDragLeave: function(e, grp, next) { highlightGroup(e, grp, false); },
          computesBoundsAfterDrag: true,
          // when the selection is dropped into a Group, add the selected Parts into that Group;
          // if it fails, cancel the tool, rolling back any changes
          // mouseDrop: finishDrop,
          handlesDragDropForMembers: true,  // don't need to define handlers on member Nodes and Links
          // Groups containing Groups lay out their members horizontally
          // layout: makeLayout(false)
        },
        // new go.Binding("layout", "horiz", makeLayout),
        new go.Binding("background", "isHighlighted", function(h) {
          return h ? "rgba(255,0,0,0.2)" : "transparent";
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
            $(go.Shape, "Rectangle",
          { fill: null, stroke: defaultColor(false), strokeWidth: 2 },
          new go.Binding("stroke", "horiz", defaultColor),
          new go.Binding("stroke", "color")),
        $(go.Panel, "Vertical",  // title above Placeholder
          $(go.Panel, "Horizontal",  // button next to TextBlock
            { stretch: go.GraphObject.Horizontal, background: defaultColor(false) },
            new go.Binding("background", "horiz", defaultColor),
            new go.Binding("background", "color"),
            $("SubGraphExpanderButton",
              { alignment: go.Spot.Right, margin: 5 }),
            $(go.TextBlock,
              {
                alignment: go.Spot.Left,
                editable: true,
                margin: 5,
                font: defaultFont(false),
                opacity: 0.75,  // allow some color to show through
                stroke: "#404040"
              },
              new go.Binding("font", "horiz", defaultFont),
              new go.Binding("text", "text").makeTwoWay())
          ),  // end Horizontal Panel
          $(go.Placeholder,
            { padding: 5, alignment: go.Spot.TopLeft })
        )  // end Vertical Panel
    )
    groupTemplateMap.add("Container6", groupTemplate6);
    addGroupTemplateName('Container6'); 
    }
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

// function makeLayout(horiz) {  // a Binding conversion function
//     if (horiz) {
//       return new go.GridLayout(
//         {
//           wrappingWidth: Infinity, alignment: go.GridLayout.Position,
//           cellSize: new go.Size(1, 1), spacing: new go.Size(4, 4)
//         });
//     } else {
//       return new go.GridLayout(
//         {
//           wrappingColumn: 1, alignment: go.GridLayout.Position,
//           cellSize: new go.Size(1, 1), spacing: new go.Size(4, 4)
//         });
//     }
// }

function defaultColor(horiz) {  // a Binding conversion function
return horiz ? "rgba(255, 221, 51, 0.55)" : "rgba(51,211,229, 0.5)";
}

function defaultFont(horiz) {  // a Binding conversion function
return horiz ? "bold 20px sans-serif" : "bold 16px sans-serif";
}

// Upon a drop onto a Group, we try to add the selection as members of the Group.
// Upon a drop onto the background, or onto a top-level Node, make selection top-level.
// If this is OK, we're done; otherwise we cancel the operation to rollback everything.
function finishDrop(e, grp) {
    var ok = (grp !== null
        ? grp.addMembers(grp.diagram.selection, true)
        : e.diagram.commandHandler.addTopLevelParts(e.diagram.selection, true));
    if (!ok) e.diagram.currentTool.doCancel();
}

// TESTING TESTING TESTING
// if (false) {
//     function findPortNode(g, name, input) {
//         for (let it = g.memberParts; it.next();) {
//             var n = it.value;
//             if (!(n instanceof go.Node)) continue;
//             if (n.data.name === name && n.data._in === input) return n;
//         }
//         return null;
//         }
        
        
//     // Generate a random number of nodes, including groups.
//     // If a group's key is given as a parameter, put these nodes inside it
//     function randomGroup(group, myDiagram) {
//         // all modification to the diagram is within this transaction
//         myDiagram.startTransaction("addGroupContents");
//         var addedKeys = [];  // this will contain the keys of all nodes created
//         var groupCount = 0;  // the number of groups in the diagram, to determine the numbers in the keys of new groups
//         myDiagram.nodes.each(function(node) {
//             if (node instanceof go.Group) groupCount++;
//         });
//         // create a random number of groups
//         // ensure there are at least 10 groups in the diagram
//         var groups = Math.floor(Math.random() * 2);
//         if (groupCount < 10) groups += 1;
//         for (var i = 0; i < groups; i++) {
//             var name = "group" + (i + groupCount);
//             myDiagram.model.addNodeData({ key: name, isGroup: true, group: group });
//             addedKeys.push(name);
//         }
//         var nodes = Math.floor(Math.random() * 3) + 2;
//         // create a random number of non-group nodes
//         for (var i = 0; i < nodes; i++) {
//             var color = go.Brush.randomColor();
//             // make sure the color, which will be the node's key, is unique in the diagram before adding the new node
//             if (myDiagram.findPartForKey(color) === null) {
//             myDiagram.model.addNodeData({ key: color, group: group });
//             addedKeys.push(color);
//             }
//         }
//         // add at least one link from each node to another
//         // this could result in clusters of nodes unreachable from each other, but no lone nodes
//         var arr = [];
//         for (var x in addedKeys) arr.push(addedKeys[x]);
//         arr.sort(function(x, y) { return Math.random() - 1; });
//         for (var i = 0; i < arr.length; i++) {
//             var from = Math.floor(Math.random() * (arr.length - i)) + i;
//             if (from !== i) {
//             myDiagram.model.addLinkData({ from: arr[from], to: arr[i] });
//             }
//         }
//         myDiagram.commitTransaction("addGroupContents");
//         }
    

//     // The Group.layout, for arranging the "port" Nodes within the Group
//     function InputOutputGroupLayout() {
//         go.Layout.call(this);
//     }

//     go.Diagram.inherit(InputOutputGroupLayout, go.Layout);

//     InputOutputGroupLayout.prototype.doLayout = function(coll) {
//         coll = this.collectParts(coll);

//         var portSpacing = 2;
//         var iconAreaWidth = 60;

//         // compute the counts and areas of the inputs and the outputs
//         var left = 0;
//         var leftwidth = 0;  // max
//         var leftheight = 0; // total
//         var right = 0;
//         var rightwidth = 0;  // max
//         var rightheight = 0; // total
//         coll.each(function(n) {
//             if (n instanceof go.Link) return;  // ignore Links
//             if (n.data._in) {
//             left++;
//             leftwidth = Math.max(leftwidth, n.actualBounds.width);
//             leftheight += n.actualBounds.height;
//             } else {
//             right++;
//             rightwidth = Math.max(rightwidth, n.actualBounds.width);
//             rightheight += n.actualBounds.height;
//             }
//         });
//         if (left > 0) leftheight += portSpacing * (left - 1);
//         if (right > 0) rightheight += portSpacing * (right - 1);

//         var loc = new go.Point(0, 0);
//         if (this.group !== null && this.group.location.isReal()) loc = this.group.location;

//         // first lay out the left side, the inputs
//         var y = loc.y - leftheight / 2;
//         coll.each(function(n) {
//             if (n instanceof go.Link) return;  // ignore Links
//             if (!n.data._in) return;  // ignore outputs
//             n.position = new go.Point(loc.x - iconAreaWidth / 2 - leftwidth, y);
//             y += n.actualBounds.height + portSpacing;
//         });

//         // now the right side, the outputs
//         y = loc.y - rightheight / 2;
//         coll.each(function(n) {
//             if (n instanceof go.Link) return;  // ignore Links
//             if (n.data._in) return;  // ignore inputs
//             n.position = new go.Point(loc.x + iconAreaWidth / 2 + rightwidth - n.actualBounds.width, y);
//             y += n.actualBounds.height + portSpacing;
//         });

//         // then position the group and size its icon area
//         if (this.group !== null) {
//             // position the group so that its ICON is in the middle, between the "ports"
//             this.group.location = loc;
//             // size the ICON so that it's wide enough to overlap the "ports" and tall enough to hold all of the "ports"
//             var icon = this.group.findObject("ICON");
//             if (icon !== null) icon.desiredSize = new go.Size(iconAreaWidth + leftwidth / 2 + rightwidth / 2, Math.max(leftheight, rightheight) + 10);
//         }
//     };
// }

