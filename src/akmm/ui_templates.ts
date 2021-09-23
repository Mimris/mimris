// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;
const linkToLink = false;

import * as go from 'gojs';

function getRouting(r: string): any {
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

function getCurve(c: string): any {
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

export function getNodeTemplate(templateName: string, contextMenu: any): any {
    let nodeTemplate;
    switch (templateName) {
        default:
        case 'textOnly': {
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
                    desiredSize: new go.Size(158, 68), 
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
                        ),
                    ),
                    ),
                ),
                );
            break;
        }
        case 'textAndIcon': {
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
                    $(go.Panel, "Vertical", // Panel for Icon  ------------------------
                        { contextMenu: partContextMenu , cursor: "move" },
                        $(go.Panel, "Spot", // icon area
                        { contextMenu: partContextMenu , cursor: "move" },

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
                        ),
                    ),
                    ),
                ),
                );
            break;
        }
    }
    return nodeTemplate;
}

export function getLinkTemplate(templateName: string, contextMenu: any) : any {
    let linkTemplate;
    const dotted = [3, 3];
    const dashed = [5, 5];
    switch(templateName) {
        default: {
            linkTemplate =
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
                // { relinkableFrom: true, relinkableTo: true, toShortLength: 4 },
                // new go.Binding('relinkableFrom', 'canRelink').ofModel(),
                // new go.Binding('relinkableTo', 'canRelink').ofModel(),
                // { selectable: true, selectionAdornmentTemplate: linkSelectionAdornmentTemplate },

                // link route 
                { routing: go.Link.Normal,  corner: 10},  // link route should avoid nodes
                new go.Binding("routing", "routing", function(r) { getRouting(r); }
                ),
                new go.Binding("curve", "curve", function(c) { return getCurve(c); }
                ),
                new go.Binding("points").makeTwoWay(),
                // context menu
                { contextMenu: contextMenu },
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
    }
    return linkTemplate;
}

export function getGroupTemplate(templateName: string): any {
    let groupTemplate;
    switch (templateName) {
    default:
        groupTemplate =
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
                    return h ? "rgba(255,0,0,0.2)" : "transparent"; // this is the background of all
                }).ofObject(),
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
    return groupTemplate;
}