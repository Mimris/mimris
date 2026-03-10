// @ts-nocheck
const debug = false; 

import * as go from 'gojs';
import * as uid from './ui_diagram';
import * as akm from './metamodeller';
import * as jsn from './ui_json';
import context from '../pages/context';
import { BPMNLinkingTool, BPMNRelinkingTool, PoolLink } from './BPMNClasses.js';

const $ = go.GraphObject.make;

// require('gojs/extensions/Figures.js');

let myDiagram: go.Diagram;

const KAPPA = 4 * ((Math.sqrt(2) - 1) / 3);

// custom figures for Shapes

go.Shape.defineFigureGenerator('Empty', function (shape, w, h) {
return new go.Geometry();
});

// Define a File shape Annotation
go.Shape.defineFigureGenerator('Annotation', function (shape, w, h) {
    let len = Math.min(w, 10);
    let maxlen = Math.max(w, 10);
    return new go.Geometry()
      .add(new go.PathFigure(len, 0)
           .add(new go.PathSegment(go.PathSegment.Line, 0, 0))
           .add(new go.PathSegment(go.PathSegment.Line, 0, h))
           .add(new go.PathSegment(go.PathSegment.Line, len, h))
           .add(new go.PathSegment(go.PathSegment.Move, maxlen-len, 0))
        //    .add(new go.PathSegment(go.PathSegment.Line, maxlen, 0))
        //    .add(new go.PathSegment(go.PathSegment.Line, maxlen, h))
        //    .add(new go.PathSegment(go.PathSegment.Line, maxlen-len, h))
        );
});

// Define a File shape File
go.Shape.defineFigureGenerator("File", function(shape, w, h) {
    var geo = new go.Geometry();
    var fig = new go.PathFigure(0, 0, true);
    geo.add(fig);
    
    fig.add(new go.PathSegment(go.PathSegment.Line, 0.75 * w, 0));
    fig.add(new go.PathSegment(go.PathSegment.Line, w, 0.25 * h));
    fig.add(new go.PathSegment(go.PathSegment.Line, w, h));
    fig.add(new go.PathSegment(go.PathSegment.Line, 0, h).close());
    
    // Add a fold line
    fig = new go.PathFigure(0.75 * w, 0, false);
    geo.add(fig);
    fig.add(new go.PathSegment(go.PathSegment.Line, 0.75 * w, 0.25 * h));
    fig.add(new go.PathSegment(go.PathSegment.Line, w, 0.25 * h));
    
    return geo;
});

// Define a File shape Message
go.Shape.defineFigureGenerator("Message", function(shape, w, h) {
    var geo = new go.Geometry();
    var fig = new go.PathFigure(0, 0, true);
    geo.add(fig);
    
    fig.add(new go.PathSegment(go.PathSegment.Line, w, 1));
    fig.add(new go.PathSegment(go.PathSegment.Line, w, 0.8*h));
    fig.add(new go.PathSegment(go.PathSegment.Line, 0, 0.8*h));
    fig.add(new go.PathSegment(go.PathSegment.Line, 0, 0).close());
    fig.add(new go.PathSegment(go.PathSegment.Line, w, 0));
    fig.add(new go.PathSegment(go.PathSegment.Line, 0.5*w, 0.5*h));
    fig.add(new go.PathSegment(go.PathSegment.Line, 0, 0 ));

    // Add a fold line
    // fig = new go.PathFigure(0.5 * w, 0, false);
    // geo.add(fig);
    // fig.add(new go.PathSegment(go.PathSegment.Line, w, h));
    
    return geo;
});

  // BpmnTaskService
  const gearStr =
    'F M 391,5L 419,14L 444.5,30.5L 451,120.5L 485.5,126L 522,141L 595,83L 618.5,92L 644,106.5' +
    'L 660.5,132L 670,158L 616,220L 640.5,265.5L 658.122,317.809L 753.122,322.809L 770.122,348.309L 774.622,374.309' +
    'L 769.5,402L 756.622,420.309L 659.122,428.809L 640.5,475L 616.5,519.5L 670,573.5L 663,600L 646,626.5' +
    'L 622,639L 595,645.5L 531.5,597.5L 493.192,613.462L 450,627.5L 444.5,718.5L 421.5,733L 393,740.5L 361.5,733.5' +
    'L 336.5,719L 330,627.5L 277.5,611.5L 227.5,584.167L 156.5,646L 124.5,641L 102,626.5L 82,602.5L 78.5,572.5' +
    'L 148.167,500.833L 133.5,466.833L 122,432.5L 26.5,421L 11,400.5L 5,373.5L 12,347.5L 26.5,324L 123.5,317.5' +
    'L 136.833,274.167L 154,241L 75.5,152.5L 85.5,128.5L 103,105.5L 128.5,88.5001L 154.872,82.4758L 237,155' +
    'L 280.5,132L 330,121L 336,30L 361,15L 391,5 Z M 398.201,232L 510.201,275L 556.201,385L 505.201,491L 399.201,537' +
    'L 284.201,489L 242.201,385L 282.201,273L 398.201,232 Z';
  const gearGeo = go.Geometry.parse(gearStr);
  gearGeo.normalize();
  go.Shape.defineFigureGenerator('BpmnTaskService', function (shape, w, h) {
    const geo = gearGeo.copy();
    // calculate how much to scale the Geometry so that it fits in w x h
    const bounds = geo.bounds;
    const scale = Math.min(w / bounds.width, h / bounds.height);
    geo.scale(scale, scale);
    // text should go in the hand
    geo.spot1 = new go.Spot(0, 0.6, 10, 0);
    geo.spot2 = new go.Spot(1, 1);
    return geo;
  });
// End BpmnTaskService


export function getMinSize(): go.Size {
    return new go.Size(200, 100);
}

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

export function getGatewayType(t: string): any {
    switch(t) {
    case 'Inclusive':
        return 'Circle';
    case 'Parallel':
        return 'ThickCross';
    case 'Exclusive':
        return 'XLine';
    default:
        return 'XLine';
        }
}

let figureNames = [ 
                    'Circle',
                    'Diamond',
                    'Ellipse',
                    'Gear',
                    'Help',
                    'Hexagon',
                    'File',
                    'Message',
                    'LineH',
                    'LineV',
                    'MinusLine',
                    'PlusLine',
                    'XLine',
                    'Pentagon',
                    'Rectangle',
                    'RoundedRectangle',
                    'Square',
                    'FivePointedStar',
                    'ThinX',
                    'ThickX',
                    'ThinCross',
                    'ThickCross',
                    'Triangle',
                    'TriangleRight',
                    'TriangleLeft',
                    'TriangleUp',
                    'TriangleDown',

                ]; 

export function getFigureNames() {
    return figureNames;
}

let figure2Names = [ 
                    'Timer',
                    'Message',
                    'DarkMessage',
                    'Circle',
                    'DarkCircle',
                    'BpmnTaskManual',
                    "BpmnTaskService",
                    'CatchMessage',
                    'ThrowMessage',
                    'Inclusive',
                    'EventGateway',
                    'SignalStart',
                    'SignalEnd',
                    'Escalation',
                    'ThrowEscalation',
                    'CatchConditional',
                    'CatchTimer',
                    'CatchSignal',
                    'CatchLink',
                    'ThrowLink',
                    'Compensation',
                    'Multiple',
                    'Parallel',
                    'Complex',
                    'ConditionalStart',
                    'ExclusiveStart',
                    'ParallelStart',
                    'Cancel',
                ]; 
          
export function getFigure2Names() {
    return figure2Names;
}
                

let nodeTemplateNames = []; 
let linkTemplateNames = []; 
let groupTemplateNames = []; 

function makeGeoIcon() {
    return $(go.Picture,  // the image -------------------------------------       
    new go.Binding("source", "icon", getIconSource),
    {
            name: "Picture",
            column: 1, 
            margin: new go.Margin(0, 5, 0, 0),
            desiredSize: new go.Size(27, 27),
            alignment: go.Spot.Right,
            // allow icon background color via fillcolor2
            background: "transparent",
        },
        new go.Binding("background", "fillcolor2"),
        new go.Binding("visible", "isSubGraphExpanded").ofObject(),
        new go.Binding("visible", "icon", shouldShowIconPicture),
    )                                
}

// Helper function to force update all icon sources in the diagram
// This is needed because GoJS bindings don't always trigger for emoji after reload
export function forceUpdateAllIconSources(diagram: any): void {
  if (!diagram || !diagram.nodes) return;
  
  console.log("forceUpdateAllIconSources: Starting to update all icon sources in diagram");
  let updated = 0;
  
  for (let it = diagram.nodes; it?.next();) {
    const node = it.value;
    if (!node || !node.data) continue;
    
    const icon = node.data.icon;
    if (!icon) continue;
    
    // Find the Picture element named "Picture"
    const pictureElement = node.findObject("Picture");
    if (pictureElement && pictureElement.source !== undefined) {
      try {
        const newSource = getIconSource(icon);
        if (pictureElement.source !== newSource) {
          pictureElement.source = newSource;
          console.log("forceUpdateAllIconSources: Updated icon for", node.data.name || node.key, "with value", icon);
          updated++;
        }
      } catch (e) {
        console.error("forceUpdateAllIconSources: Failed to update icon for", node.data.name || node.key, e);
      }
    }
  }
  
  console.log("forceUpdateAllIconSources: Complete. Updated", updated, "icons");
}

function makeGeometry() {
    return $(go.Shape, // a figure (a symbol illustrating what this is all about)         
        new go.Binding("geometryString", "geometry"), 
        new go.Binding("fill", "fillcolor2"), 
        {     
            column: 2, 
            margin: new go.Margin(2, 0, 0, 0),
            desiredSize: new go.Size(20, 20),
            alignment: go.Spot.Right,
        },
        new go.Binding("visible", "isSubGraphExpanded").ofObject(),
    )
}

function makeFigure() {
    return $(go.Shape, // a figure (a symbol illustrating what this is all about)         
        new go.Binding("figure", "figure"), 
        new go.Binding("fill", "fillcolor2"), 
        {     
            column: 2, 
            margin: new go.Margin(2, 0, 0, 0),
            desiredSize: new go.Size(20, 20),
            alignment: go.Spot.Right,
        },
        new go.Binding("visible", "isSubGraphExpanded").ofObject(),
    )
}

function makeFigure2() {
    return $(go.Shape, // a figure (a symbol illustrating what this is all about)         
        new go.Binding("figure2", "figure2"), 
        new go.Binding("fill", "fillcolor2"), 
        {     
            column: 2, 
            margin: new go.Margin(2, 0, 0, 0),
            desiredSize: new go.Size(20, 20),
            alignment: go.Spot.Right,
        },
        new go.Binding("visible", "isSubGraphExpanded").ofObject(),
    )
}

function makeNotation(kind: string) {
    switch(kind) {
        case 'Icon':
            return makeGeoIcon();
        case 'Geometry':
            return makeGeometry();
        case 'Figure':
            return makeFigure();
        default:
            return makeGeoIcon();
    }
}

function makeImage(kind: string) {
    switch(kind) {
        case 'Image':
            return makeImageImage();
        case 'Icon':
            return makeIconImage();
        case 'Geometry':
            return makeGeoImage();
        case 'Figure':
            return makeFigureImage();
        default:
            return makeIconImage();
    }
}

function makeImageImage() {
    return $(go.Panel, "Auto",
        {
            name: "GROUP_CLOSED_IMAGE",
            stretch: go.GraphObject.Fill,
            minSize: new go.Size(200, 100),
            margin: new go.Margin(0, 0, 0, 0),
            cursor: "move",
        },
        new go.Binding('visible', 'isSubGraphExpanded', function (expanded) { return !expanded; }).ofObject(),
        $(go.Picture,
            new go.Binding("source", "image", findImage),
            {
                stretch: go.GraphObject.Fill,
                imageStretch: go.GraphObject.Fill,
                alignment: go.Spot.Center,
                opacity: 0.95,
                pickable: true,
                cursor: "move",
            },
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify)
        ),
        $(go.Shape,  // invisible hit area to allow dragging even without an image
            {
                fill: "transparent",
                stroke: null,
                cursor: "move",
                stretch: go.GraphObject.Fill,
                pickable: true,
            }
        )
    );                               
}

function makeIconImage() {
    return $(go.Picture,  // the image -------------------------------------
        new go.Binding("source", "icon", getIconSource),
        {
            column: 2, 
            margin: new go.Margin(2, 0, 0, 0),
            desiredSize: new go.Size(25, 25),
            alignment: go.Spot.Right,
            imageStretch: go.GraphObject.Uniform,
            cursor: "move",
        },
        new go.Binding('visible', 'isSubGraphExpanded', function (e) { return !e; }).ofObject(),
        new go.Binding("visible", "icon", shouldShowIconPicture),
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),                           
    )                                
}

function makeGeoImage() {
    return $(go.Shape, // a figure (a symbol illustrating what this is all about)         
        new go.Binding("geometryString", "geometry"), 
        new go.Binding("fill", "fillcolor2"), 
        {     
            column: 2, 
            margin: new go.Margin(2, 0, 0, 0),
            desiredSize: new go.Size(25, 25),
            alignment: go.Spot.Right,
            imageStretch: go.GraphObject.Uniform,
            cursor: "move",
        },
        new go.Binding('visible', 'isSubGraphExpanded', function (e) { return !e; }).ofObject(),
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),                           
    )
}

function makeFigureImage() {
    return $(go.Shape, // a figure (a symbol illustrating what this is all about)         
        new go.Binding("figure", "figure"), 
        new go.Binding("fill", "fillcolor"), 
        {     
            column: 2, 
            margin: new go.Margin(2, 0, 0, 0),
            desiredSize: new go.Size(20, 20),
            alignment: go.Spot.Right,
            imageStretch: go.GraphObject.Uniform,
            cursor: "move",
        },
        new go.Binding('visible', 'isSubGraphExpanded', function (e) { return !e; }).ofObject(),
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),                           
    )
}

function makeFigure2Image() {
    return $(go.Shape, // a figure (a symbol illustrating what this is all about)         
        new go.Binding("figure2", "figure2"), 
        new go.Binding("fill", "fillcolor2"), 
        {     
            column: 2, 
            margin: new go.Margin(2, 0, 0, 0),
            desiredSize: new go.Size(20, 20),
            alignment: go.Spot.Right,
            imageStretch: go.GraphObject.Uniform,
            cursor: "move",
        },
        new go.Binding('visible', 'isSubGraphExpanded', function (e) { return !e; }).ofObject(),
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),                           
    )
}

export function groupTop1(contextMenu: any, notation: string) {
    // With ports - wrapped in Spot panel for edge overlays
    const edgeWidth = 15; // Width of the linkable edge area
    return $(go.Panel, "Spot",
        {
            row: 1, 
            column: 1, 
            name: "BODY",
            stretch: go.GraphObject.Fill,
            isPanelMain: true,
        },
        $(go.Shape, "RoundedRectangle", // surrounds everything
            {
                name: "SHAPE",
                cursor: "alias",
                fill: "white", 
                shadowVisible: true,
                desiredSize: new go.Size(220, 120),
                minSize: new go.Size(160, 65),
                portId: "", 
                fromLinkable: true, fromLinkableSelfNode: false, fromLinkableDuplicates: true,
                toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: true,
            },
            new go.Binding("fill", "fillcolor"),
            new go.Binding("stroke", "strokecolor"),
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        ),
        // Dedicated symmetric geometry for selection/resize bounds.
        $(go.Shape, "Rectangle",
            {
                name: "SELECTION_BOX",
                isPanelMain: true,
                fill: "transparent",
                stroke: "transparent",
                stretch: go.GraphObject.Fill,
                minSize: getMinSize(),
            },
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        ),
        $(go.Panel, "Vertical",  // position header above the subgraph
        {
            name: "HEADER", 
            defaultAlignment: go.Spot.TopLeft, 
        },
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        // Main content in Auto panel
        $(go.Panel, "Auto",
            { stretch: go.GraphObject.Fill },
            $(go.Shape, "RoundedRectangle", // visible border
                {
                    fill: "white", 
                    shadowVisible: true,
                    minSize: new go.Size(160, 65),
                    strokeWidth: 2,
                    // Small visual padding
                    spot1: new go.Spot(0, 0, 2, 2),
                    spot2: new go.Spot(1, 1, -2, -2),
                },
                new go.Binding("fill", "fillcolor"),
                new go.Binding("stroke", "strokecolor", s => s || "lightgray"),
            ),
            $(go.Panel, "Vertical",  // position header above the subgraph
            {
                name: "HEADER",
                defaultAlignment: go.Spot.TopLeft,
                stretch: go.GraphObject.Fill,
                alignment: go.Spot.TopLeft,
                margin: new go.Margin(2),
                cursor: "move",
            },
            $(go.Panel, "Table",  // the header
                {
                    alignment: go.Spot.TopLeft,
                    contextMenu: contextMenu,
                    cursor: "move",
                    stretch: go.GraphObject.Horizontal,
                },
                $(go.RowColumnDefinition, { column: 0, width: 20 }),
                $(go.RowColumnDefinition, { column: 1, sizing: go.RowColumnDefinition.ProportionalExtra }),
                makeZoomInvariantExpanderButton(1.25, {
                    column: 0,
                    margin: new go.Margin(0, 0, 0, 0),
                    alignment: go.Spot.Left,
                }),
                $(go.TextBlock, // group title located at the left
                    { 
                        row: 0, 
                        column: 1, 
                        isMultiline: false,
                        maxLines: 1,
                        editable: true, 
                        font: "Bold 14pt Sans-Serif",
                        textAlign: "left",
                        alignment: go.Spot.Left,
                        margin: new go.Margin(0, 0, 0, 8), 
                        wrap: go.TextBlock.None,
                        overflow: go.TextBlock.OverflowEllipsis,
                        stretch: go.GraphObject.Horizontal,
                        name: "name",
                    },
                    new go.Binding("fill", "fillcolor"),
                    new go.Binding("text", "name").makeTwoWay(),
                    new go.Binding("stroke", "textcolor").makeTwoWay(),
                    new go.Binding("visible", "isSubGraphExpanded").ofObject(),
                ),
                $(go.TextBlock, textStyle(),  // the name - closed container
                    {
                        row: 0, 
                        column: 1, 
                        isMultiline: false,
                        maxLines: 1,
                        editable: true,
                        font: "Bold 14pt Sans-Serif",
                        textAlign: "left",
                        alignment: go.Spot.Left,
                        alignmentFocus: go.Spot.Left,
                        margin: new go.Margin(0, 0, 0, 8),
                        wrap: go.TextBlock.None,
                        overflow: go.TextBlock.OverflowEllipsis,
                        stretch: go.GraphObject.None,
                        name: "name"
                    },        
                    new go.Binding("fill", "fillcolor"),
                    new go.Binding("text", "name").makeTwoWay(),
                    new go.Binding("stroke", "textcolor").makeTwoWay(),
                    new go.Binding('visible', 'isSubGraphExpanded', function (e) { return !e; }).ofObject(),
                ),
                makeNotation(notation),
                ), // End Table Panel

                $(go.Shape,  // open container background
                    {
                        name: "SHAPE", 
                        fill: "lightyellow", 
                        opacity: 0.95,
                        minSize: new go.Size(200, 100),
                        margin: new go.Margin(0, 10, 10, 10),
                        cursor: "move",
                        stroke: "transparent",
                        stretch: go.GraphObject.Fill,
                    },
                    new go.Binding("fill", "fillcolor2"),
                    new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),                           
                    new go.Binding('visible', 'isSubGraphExpanded').ofObject(),
                ),     
                makeImage("Image"),
            ),
            $(go.TextBlock, textStyle(), // typename always visible, anchored bottom-left
                {
                    alignment: new go.Spot(0, 1, 8, -2),
                    alignmentFocus: new go.Spot(0, 1, 0, -2),
                    isMultiline: false,
                    editable: false,
                    font: "Bold 8pt Sans-Serif",
                    maxLines: 1,
                    overflow: go.TextBlock.OverflowEllipsis,
                    textAlign: "left",
                    cursor: "move",
                    stroke: "black"
                },
                new go.Binding("text", "typename"),
                new go.Binding("stroke", "textcolor"),
            ),
        ), // End inner Auto panel
        // TOP edge overlay - wide linkable area
        $(go.Shape, "Rectangle",
            {
                alignment: go.Spot.Top,
                alignmentFocus: go.Spot.Top,
                height: edgeWidth,
                stretch: go.GraphObject.Horizontal,
                name: "name"
            },        
            new go.Binding("fill", "fillcolor"),
            new go.Binding("text", "name").makeTwoWay(),
            new go.Binding("stroke", "textcolor").makeTwoWay(),
            new go.Binding('visible', 'isSubGraphExpanded', function (e) { return !e; }).ofObject(),
            ),
            // makeNotation(notation),
            ), // End Horizontal Panel

            $(go.Shape,  // using a Shape instead of a Placeholder - this is open container
                {
                    name: "SHAPE", 
                    fill: "lightyellow", 
                    opacity: 0.95,
                    minSize: new go.Size(200, 100),
                    margin: new go.Margin(0, 10, 10, 10),
                    cursor: "move",
                    stroke: "transparent",
                },
                new go.Binding("fill", "fillcolor2"),
                new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),                           
                new go.Binding('visible', 'isSubGraphExpanded').ofObject(),
            ) ,     
            makeImage("Image"),
            $(go.TextBlock, textStyle(), // the typename  --------------------
            {
                alignment: go.Spot.Bottom,
                alignmentFocus: go.Spot.Bottom,
                height: edgeWidth,
                stretch: go.GraphObject.Horizontal,
                fill: "transparent",
                stroke: null,
                cursor: "alias",
                portId: "",
                fromLinkable: true, fromLinkableSelfNode: false, fromLinkableDuplicates: true,
                toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: true,
            },
        ),
    )
}

export function groupTop2(contextMenu: any, notation: string) {
    // Without ports
    return $(go.Panel, "Auto",
        {
            row: 1,
            column: 1,
            name: "BODY",
            stretch: go.GraphObject.Fill,
            isPanelMain: true,
        },
        $(go.Shape, "RoundedRectangle", // surrounds everything
            {
                name: "SHAPE",
                cursor: "alias",
                fill: "white",
                shadowVisible: true,
                minSize: new go.Size(180, 90),
                portId: "",
                fromLinkable: true,
                fromLinkableSelfNode: false,
                fromLinkableDuplicates: true,
                toLinkable: true,
                toLinkableSelfNode: false,
                toLinkableDuplicates: true,
            },
            new go.Binding("fill", "fillcolor"),
            new go.Binding("stroke", "strokecolor"),
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        ),
        $(go.Shape, "RoundedRectangle", // Inner shape for moving
            {
                cursor: "move",
                fill: "transparent",
                stroke: "transparent",
                margin: new go.Margin(26, 10, 10, 10),
                minSize: new go.Size(136, 50),
                stretch: go.GraphObject.Fill,
            },
        ),
        $(go.Panel, "Table",  // position header above the subgraph
            {
                stretch: go.GraphObject.Fill,
                defaultAlignment: go.Spot.TopLeft
            },
            $(go.RowColumnDefinition, { row: 0, height: 26, sizing: go.RowColumnDefinition.None }),
            $(go.Panel, "Table",  // the header
                {
                    row: 0,
                    background: "transparent",
                    contextMenu: contextMenu,
                    cursor: "move",
                    margin: new go.Margin(2, 0, 0, 0),
                    stretch: go.GraphObject.Horizontal,
                },
                $(go.RowColumnDefinition, { column: 0, sizing: go.RowColumnDefinition.None }),
                makeZoomInvariantExpanderButton(0.9, {
                    column: 0,
                    margin: new go.Margin(7, 1, 0, 0),
                    alignment: go.Spot.Left,
                }),
                $(go.TextBlock, textStyle(),  // the name - open container
                    {
                        row: 0,
                        column: 1,
                        isMultiline: false,
                        maxLines: 1,
                        editable: true,
                        font: "10pt Segoe UI,sans-serif",
                        textAlign: "left",
                        alignment: go.Spot.Left,
                        margin: new go.Margin(7, 0, 0, 4),
                        wrap: go.TextBlock.None,
                        overflow: go.TextBlock.OverflowEllipsis,
                        name: "name"
                    },
                    new go.Binding("fill", "fillcolor"),
                    new go.Binding("text", "name").makeTwoWay(),
                    new go.Binding("stroke", "textcolor").makeTwoWay(),
                    new go.Binding("visible", "isSubGraphExpanded").ofObject(),
                ),
                $(go.TextBlock, textStyle(),  // the name - closed container
                    {
                        row: 0,
                        column: 1,
                        isMultiline: false,
                        maxLines: 1,
                        editable: true,
                        font: "10pt Segoe UI,sans-serif",
                        textAlign: "left",
                        alignment: go.Spot.Left,
                        margin: new go.Margin(5, 0, 0, 2),
                        wrap: go.TextBlock.None,
                        overflow: go.TextBlock.OverflowEllipsis,
                        name: "name",
                    },
                    new go.Binding("fill", "fillcolor"),
                    new go.Binding("text", "name").makeTwoWay(),
                    new go.Binding("stroke", "textcolor").makeTwoWay(),
                    new go.Binding('visible', 'isSubGraphExpanded', function (e) { return !e; }).ofObject(),
                ),
            ), // End Panel
            $(go.RowColumnDefinition, { row: 1, sizing: go.RowColumnDefinition.None }),
            $(go.Shape, // the shape inside the shape
                {
                    row: 1,
                    fill: "rgba(128,128,128,0.33)",
                    stroke: "rgba(120,120,120,0.55)",
                    strokeWidth: 1.2,
                    opacity: 0.75,
                    minSize: new go.Size(146, 62),
                    margin: new go.Margin(2, 2, 2, 3),
                    cursor: "move",
                },
                new go.Binding("fill", "fillcolor2"),
                new go.Binding("desiredSize", "size", function (s) {
                    const parsed = s instanceof go.Size ? s : go.Size.parse(s || "220 120");
                    return new go.Size(
                        Math.max(72, parsed.width - 14),
                        Math.max(36, parsed.height - 24)
                    );
                }),
                // Keep open/closed visuals consistent; only the expander symbol changes.
                new go.Binding("visible", "", function () { return true; }).ofObject(),
            ), // End Shape

            $(go.Picture,  // the image -------------------------------------
                // This is closed container - showing an image
                new go.Binding("source", "image", findImage),
                {
                    row: 1,
                    stretch: go.GraphObject.Fill,
                    margin: new go.Margin(2, 10, 5, 10),
                    alignment: go.Spot.Center,
                    imageStretch: go.GraphObject.Uniform,
                },
                new go.Binding('visible', 'isSubGraphExpanded', function (e) { return !e; }).ofObject(),
            ), // End Picture

            $(go.RowColumnDefinition, { row: 2, height: 6, sizing: go.RowColumnDefinition.None }),
        ),
    );
}

function groupPortResizeAdornment() {
    const makeHandle = (alignment: go.Spot, cursor: string, name: string) =>
        $(go.Shape, "Rectangle",
            {
                alignment,
                alignmentFocus: alignment.opposite(),
                desiredSize: new go.Size(7, 7),
                fill: "lightblue",
                stroke: "dodgerblue",
                cursor,
                name,
            }
        );
    // Padding moves only the resize handles outward to include port overhang.
    return $(go.Adornment, "Spot",
        $(go.Placeholder),
        makeHandle(go.Spot.TopLeft, "nw-resize", "NW"),
        makeHandle(go.Spot.Top, "n-resize", "N"),
        makeHandle(go.Spot.TopRight, "ne-resize", "NE"),
        makeHandle(go.Spot.Left, "w-resize", "W"),
        makeHandle(go.Spot.Right, "e-resize", "E"),
        makeHandle(go.Spot.BottomLeft, "sw-resize", "SW"),
        makeHandle(go.Spot.Bottom, "s-resize", "S"),
        makeHandle(go.Spot.BottomRight, "se-resize", "SE"),
    );
}

function groupWithPortsSelectionPadding(offsetX: number, offsetY: number) {
    const pad = (alignment: go.Spot, x: number, y: number) =>
        $(go.Shape, "Rectangle",
            {
                fill: "transparent",
                stroke: "transparent",
                width: 1,
                height: 1,
                alignment: new go.Spot(alignment.x, alignment.y, x, y),
                pickable: false,
            },
        );
    return $(go.Panel, "Spot",
        { pickable: false },
        // Reserve ICOM space on all sides so selection bounds remain stable
        // even before ports are added.
        pad(go.Spot.Left, 0, 0),
        pad(go.Spot.Top, 0, -offsetY),
        pad(go.Spot.Right, 0, 0),
        pad(go.Spot.Bottom, 0, offsetY),
    );
}

export function groupTop3(contextMenu: any, notation: string, textscale: number) {
    // Without ports - wrapped in Spot panel for edge overlays
    const edgeWidth = 15; // Width of the linkable edge area
    return $(go.Panel, "Spot",
        {
            row: 1, 
            column: 1, 
            name: "BODY",
            stretch: go.GraphObject.Fill,
        },
        // Main content in Auto panel
        $(go.Panel, "Auto",
            { stretch: go.GraphObject.Fill },
            $(go.Shape, "RoundedRectangle", // visible border
                {
                    fill: "white", 
                    shadowVisible: true,
                    minSize: new go.Size(160, 65),
                    strokeWidth: 2,
                    // Small visual padding
                    spot1: new go.Spot(0, 0, 2, 2),
                    spot2: new go.Spot(1, 1, -2, -2),
                },
                new go.Binding("fill", "fillcolor"),
                new go.Binding("stroke", "strokecolor", s => s || "lightgray"),
                new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
            ),
            $(go.Panel, "Table",  // position header above the subgraph
                {
                    stretch: go.GraphObject.Fill,
                    defaultAlignment: go.Spot.TopLeft,
                    cursor: "move",
                },            
                $(go.RowColumnDefinition, { row: 0, sizing: go.RowColumnDefinition.None }),
                $(go.Panel, "Table",  // the header
                        {
                            row: 0,
                            contextMenu: contextMenu, 
                            cursor: "move",
                            stretch: go.GraphObject.Horizontal,
                        },
                    $(go.RowColumnDefinition, { column: 0, sizing: go.RowColumnDefinition.None }),
                    makeZoomInvariantExpanderButton(1.45, {
                        column: 0,
                        angle: 270,
                        margin: new go.Margin(10, 2, 2, 2),
                        alignment: go.Spot.Center,
                    }),
                    $(go.TextBlock, textStyle(),  // the name - open container
                    {
                        row: 1, 
                        column: 0, 
                        angle: 270,
                        scale: textscale,
                        isMultiline: false,
                        maxLines: 1,
                        editable: true,
                        font: "Bold 14pt Sans-Serif",
                        textAlign: "left",
                        alignment: go.Spot.Left,
                        margin: new go.Margin(5, 0, 0, 10),
                        wrap: go.TextBlock.None,
                        overflow: go.TextBlock.OverflowEllipsis,
                        name: "name"
                    },        
                    new go.Binding("fill", "fillcolor"),
                    new go.Binding("text", "name").makeTwoWay(),
                    new go.Binding("stroke", "strokecolor", s => s || "lightgray").makeTwoWay(),
                    new go.Binding("visible", "isSubGraphExpanded").ofObject(),
                    ),
                    $(go.TextBlock, textStyle(),  // the name - closed container
                    {
                        row: 0, 
                        column: 1, 
                        scale: textscale * 1.5,
                        isMultiline: false,
                        maxLines: 1,
                        editable: true,
                        font: "Bold 14pt Sans-Serif",
                        textAlign: "left",
                        alignment: go.Spot.Left,
                        margin: new go.Margin(0, 100, 0, 0),
                        wrap: go.TextBlock.None,
                        overflow: go.TextBlock.OverflowEllipsis,
                        name: "name",
                    },        
                    new go.Binding("fill", "fillcolor"),
                    new go.Binding("text", "name").makeTwoWay(),
                    new go.Binding("stroke", "strokecolor", s => s || "lightgray").makeTwoWay(),
                    new go.Binding('visible', 'isSubGraphExpanded', 
                        function (e) { return !e; }).ofObject(),
                    ),
                    makeNotation(notation),
                ), // End header Table Panel
                $(go.RowColumnDefinition, { row: 2, sizing: go.RowColumnDefinition.None }),
            ), // End outer Table panel
        ), // End inner Auto panel
        // TOP edge overlay - wide linkable area
        $(go.Shape, "Rectangle",
            {
                alignment: go.Spot.Top,
                alignmentFocus: go.Spot.Top,
                height: edgeWidth,
                stretch: go.GraphObject.Horizontal,
                fill: "transparent",
                stroke: null,
                cursor: "alias",
                portId: "",
                fromLinkable: true, fromLinkableSelfNode: false, fromLinkableDuplicates: true,
                toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: true,
            },
        ),
        // BOTTOM edge overlay
        $(go.Shape, "Rectangle",
            {
                alignment: go.Spot.Bottom,
                alignmentFocus: go.Spot.Bottom,
                height: edgeWidth,
                stretch: go.GraphObject.Horizontal,
                fill: "transparent",
                stroke: null,
                cursor: "alias",
                portId: "",
                fromLinkable: true, fromLinkableSelfNode: false, fromLinkableDuplicates: true,
                toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: true,
            },
        ),
        // LEFT edge overlay
        $(go.Shape, "Rectangle",
            {
                alignment: go.Spot.Left,
                alignmentFocus: go.Spot.Left,
                width: edgeWidth,
                stretch: go.GraphObject.Vertical,
                fill: "transparent",
                stroke: null,
                cursor: "alias",
                portId: "",
                fromLinkable: true, fromLinkableSelfNode: false, fromLinkableDuplicates: true,
                toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: true,
            },
        ),
        // RIGHT edge overlay
        $(go.Shape, "Rectangle",
            {
                alignment: go.Spot.Right,
                alignmentFocus: go.Spot.Right,
                width: edgeWidth,
                stretch: go.GraphObject.Vertical,
                fill: "transparent",
                stroke: null,
                cursor: "alias",
                portId: "",
                fromLinkable: true, fromLinkableSelfNode: false, fromLinkableDuplicates: true,
                toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: true,
            },
        ),
    );
}

const SWIM_HEADER_WIDTH = 34;
const LANE_HEADER_STRIP_WIDTH = 36;
// Dark enough to be clearly visible even when the diagram background is white.
const SWIM_BORDER_FALLBACK = "#000000";
const SWIM_LANE_EDGE_WIDTH = 2;

function parseRgbLike(s: string): { r: number; g: number; b: number } | null {
    // Supports #rgb, #rrggbb, rgb(...), rgba(...).
    const t = s.trim().toLowerCase();
    if (t.startsWith("#")) {
        const hex = t.slice(1);
        if (hex.length === 3) {
            const r = parseInt(hex[0] + hex[0], 16);
            const g = parseInt(hex[1] + hex[1], 16);
            const b = parseInt(hex[2] + hex[2], 16);
            if ([r, g, b].some((n) => Number.isNaN(n))) return null;
            return { r, g, b };
        }
        if (hex.length === 6) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            if ([r, g, b].some((n) => Number.isNaN(n))) return null;
            return { r, g, b };
        }
        return null;
    }
    const m = t.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/);
    if (m) {
        const r = Math.max(0, Math.min(255, Number(m[1])));
        const g = Math.max(0, Math.min(255, Number(m[2])));
        const b = Math.max(0, Math.min(255, Number(m[3])));
        if ([r, g, b].some((n) => Number.isNaN(n))) return null;
        return { r, g, b };
    }
    return null;
}

function relLuminance(rgb: { r: number; g: number; b: number }): number {
    // Relative luminance per WCAG (sRGB).
    const toLin = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const r = toLin(rgb.r);
    const g = toLin(rgb.g);
    const b = toLin(rgb.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function swimStroke(c: any): string {
    const s = (c == null) ? "" : String(c).trim();
    if (s === "") return SWIM_BORDER_FALLBACK;
    // If the provided stroke is very light, clamp to a visible default.
    // This avoids "missing" borders on white backgrounds when data has light stroke colors.
    const rgb = parseRgbLike(s);
    if (rgb && relLuminance(rgb) > 0.72) return SWIM_BORDER_FALLBACK;
    return s;
}

export function laneTop(contextMenu: any, notation: string, textscale: number) {
    return $(go.Panel, "Auto",
        { name: "LANE_MAIN", stretch: go.GraphObject.Fill },
        $(go.Shape, "Rectangle",
            {
                name: "LANE_MAIN_SHAPE",
                fill: "transparent",
                strokeWidth: SWIM_LANE_EDGE_WIDTH,
                strokeCap: "square",
                strokeJoin: "miter",
                stretch: go.GraphObject.Fill,
            },
            new go.Binding("stroke", "strokecolor", swimStroke),
        ),
        $(go.Panel, "Table",
            {
                stretch: go.GraphObject.Fill,
                defaultAlignment: go.Spot.TopLeft,
                // Keep lane header/body split identical to pool: explicit separator line.
                defaultColumnSeparatorStroke: "transparent",
                margin: new go.Margin(0),
            },
            $(go.RowColumnDefinition, { column: 0, width: LANE_HEADER_STRIP_WIDTH, sizing: go.RowColumnDefinition.None }),
            $(go.Panel, "Spot",
                {
                    name: "LANE_HEADER_STRIP",
                    row: 0,
                    column: 0,
                    width: LANE_HEADER_STRIP_WIDTH,
                    stretch: go.GraphObject.Vertical,
                    contextMenu: contextMenu,
                    cursor: "move",
                },
                $(go.Shape, "Rectangle", {
                    fill: "#f3f3f3",
                    stroke: "transparent",
                    stretch: go.GraphObject.Fill,
                }),
                // Separator between lane header strip and lane body.
                $(go.Shape, "LineV",
                    {
                        alignment: go.Spot.Right,
                        stretch: go.GraphObject.Vertical,
                        strokeWidth: 2,
                        strokeCap: "square",
                        pickable: false,
                    },
                    new go.Binding("stroke", "strokecolor", swimStroke),
                ),
                $(go.Panel, "Horizontal",
                    { angle: 270, alignment: go.Spot.Center },
                    $(go.TextBlock, textStyle(),
                        {
                            scale: textscale,
                            isMultiline: false,
                            maxLines: 1,
                            editable: true,
                            font: "Bold 14pt Sans-Serif",
                            margin: new go.Margin(0, 0, 0, 0),
                            wrap: go.TextBlock.None,
                            overflow: go.TextBlock.OverflowEllipsis,
                            name: "name",
                        },
                        new go.Binding("fill", "fillcolor"),
                        new go.Binding("text", "name").makeTwoWay(),
                        new go.Binding("stroke", "strokecolor").makeTwoWay(),
                    ),
                    makeZoomInvariantExpanderButton(1.2, { margin: new go.Margin(0, 0, 0, 4) }),
                ),
                makeNotation(notation),
            ),
            // Body is a Spot so we can draw a stable border overlay that matches selection/handles.
            $(go.Panel, "Spot",
                {
                    name: "BODY",
                    row: 0,
                    column: 1,
                    stretch: go.GraphObject.Fill,
                },
                $(go.Shape, "Rectangle",
                    {
                        name: "LANE_BODY_SHAPE",
                        cursor: "move",
                        fill: "white",
                        stroke: "transparent",
                        minSize: new go.Size(160, 65),
                        stretch: go.GraphObject.Fill,
                    },
                    new go.Binding("fill", "fillcolor"),
                    new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
                ),
                $(go.Placeholder, { padding: new go.Margin(12, 12, 12, 12), alignment: go.Spot.TopLeft }),
            ),
        ),
    );
}

export function poolTop(contextMenu: any, notation: string, textscale: number) {
    return $(go.Panel, "Auto",
        $(go.Shape, "Rectangle",
            {
                name: "POOL_SHAPE",
                cursor: "alias",
                fill: "white",
                strokeWidth: 2,
                strokeCap: "square",
                strokeJoin: "miter",
                minSize: new go.Size(200, 100),
            },
            new go.Binding("fill", "fillcolor"),
            // Ensure pool borders are always visible even when `strokecolor` is unset/empty.
            new go.Binding("stroke", "strokecolor", swimStroke),
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        ),
        $(go.Panel, "Table",
            {
                stretch: go.GraphObject.Fill,
                // Keep pool header + lanes flush to the pool border (no gap).
                margin: new go.Margin(0),
                // Draw our own separator line so it doesn't affect column sizing/bounds (removes visible gap).
                defaultColumnSeparatorStroke: "transparent",
            },
            $(go.RowColumnDefinition, { column: 0, width: SWIM_HEADER_WIDTH, sizing: go.RowColumnDefinition.None }),
            $(go.Panel, "Spot",
                {
                    name: "POOL_HEADER_STRIP",
                    row: 0,
                    column: 0,
                    width: SWIM_HEADER_WIDTH,
                    stretch: go.GraphObject.Vertical,
                    contextMenu: contextMenu,
                    cursor: "move",
                },
                $(go.Shape, "Rectangle", {
                    fill: "#f3f3f3",
                    strokeWidth: 2,
                    stretch: go.GraphObject.Fill,
                },
                new go.Binding("stroke", "strokecolor", swimStroke),
                ),
                $(go.TextBlock, textStyle(),
                    {
                        angle: 270,
                        scale: textscale,
                        isMultiline: false,
                        maxLines: 1,
                        editable: true,
                        font: "Bold 14pt Sans-Serif",
                        alignment: go.Spot.Center,
                        margin: new go.Margin(0, 0, 0, 0),
                        wrap: go.TextBlock.None,
                        overflow: go.TextBlock.OverflowEllipsis,
                        name: "name",
                    },
                    new go.Binding("fill", "fillcolor"),
                    new go.Binding("text", "name").makeTwoWay(),
                    new go.Binding("stroke", "strokecolor").makeTwoWay(),
                    new go.Binding("visible", "isSubGraphExpanded").ofObject(),
                ),
                $(go.TextBlock, textStyle(),
                    {
                        angle: 270,
                        scale: textscale,
                        isMultiline: false,
                        maxLines: 1,
                        editable: true,
                        font: "Bold 14pt Sans-Serif",
                        alignment: go.Spot.Center,
                        margin: new go.Margin(0, 0, 0, 0),
                        wrap: go.TextBlock.None,
                        overflow: go.TextBlock.OverflowEllipsis,
                        name: "name",
                    },
                    new go.Binding("fill", "fillcolor"),
                    new go.Binding("text", "name").makeTwoWay(),
                    new go.Binding("stroke", "strokecolor").makeTwoWay(),
                    new go.Binding("visible", "isSubGraphExpanded", function (e) { return !e; }).ofObject(),
                ),
                makeNotation(notation),
            ),
            $(go.Panel, "Spot",
                {
                    name: "POOL_CONTENT_PANEL",
                    row: 0,
                    column: 1,
                    stretch: go.GraphObject.Fill,
                },
                $(go.Placeholder,
                    {
                        name: "POOL_CONTENT_ANCHOR",
                        stretch: go.GraphObject.Fill,
                        // No extra inset; lane headers should align directly with the pool header separator.
                        padding: new go.Margin(0, 0, 0, 0),
                        alignment: go.Spot.TopLeft,
                    },
                ),
            ),
        ),
    );
}

function makeZoomInvariantExpanderButton(baseScale: number, props: Record<string, any> = {}) {
    const {
        width,
        height,
        minSize,
        desiredSize,
        alignment,
        alignmentFocus,
        margin,
        row,
        column,
        columnSpan,
        rowSpan,
        ...buttonProps
    } = props || {};
    const slotWidth =
        typeof width === "number" ? width
        : desiredSize instanceof go.Size ? desiredSize.width
        : minSize instanceof go.Size ? minSize.width
        : 18;
    const slotHeight =
        typeof height === "number" ? height
        : desiredSize instanceof go.Size ? desiredSize.height
        : minSize instanceof go.Size ? minSize.height
        : 18;
    const button = $("SubGraphExpanderButton",
        {
            name: "EXPANDER_BUTTON",
            alignment: go.Spot.Center,
            scale: baseScale,
            ...buttonProps,
        },
    );
    const slotProps: Record<string, any> = {
        width: slotWidth,
        height: slotHeight,
        minSize: new go.Size(slotWidth, slotHeight),
        stretch: go.GraphObject.None,
        alignment: alignment || go.Spot.Center,
        margin: margin || new go.Margin(0),
    };
    if (alignmentFocus instanceof go.Spot) {
        slotProps.alignmentFocus = alignmentFocus;
    }
    if (Number.isFinite(row)) {
        slotProps.row = row;
    }
    if (Number.isFinite(column)) {
        slotProps.column = column;
    }
    if (Number.isFinite(columnSpan)) {
        slotProps.columnSpan = columnSpan;
    }
    if (Number.isFinite(rowSpan)) {
        slotProps.rowSpan = rowSpan;
    }
    return $(go.Panel, "Spot",
        slotProps,
        button,
    );
}

function addResizeAdornment(groupName: string) {
    const scaledAdornmentSize = (width: number, height: number) =>
        new go.Binding("desiredSize", "", (_data, shape) => {
            const scale = shape?.part?.diagram?.scale || 1;
            return new go.Size(width / scale, height / scale);
        }).ofObject();
    if (
        groupName === "Pool" ||
        groupName === "Lane" ||
        groupName === "Container1" ||
        groupName === "IDEF0" ||
        groupName === "groupWithPorts" ||
        groupName === "groupWithIconAndPorts" ||
        groupName === "groupWithGeoAndPorts" ||
        groupName === "groupWithFigAndPorts" ||
        groupName === "groupNoPorts" ||
        groupName === "groupIconNoPorts" ||
        groupName === "groupGeoNoPorts" ||
        groupName === "groupFigNoPorts"
    ) {
        return $(go.Adornment, "Spot",
            $(go.Placeholder),
            $(go.Shape, { alignment: go.Spot.TopLeft, fill: "lightblue", stroke: "dodgerblue", cursor: "nw-resize" }, scaledAdornmentSize(8, 8)),
            $(go.Shape, { alignment: go.Spot.Top, fill: "lightblue", stroke: "dodgerblue", cursor: "s-resize" }, scaledAdornmentSize(16, 6)),
            $(go.Shape, { alignment: go.Spot.TopRight, fill: "lightblue", stroke: "dodgerblue", cursor: "ne-resize" }, scaledAdornmentSize(8, 8)),
            $(go.Shape, { alignment: go.Spot.Right, fill: "lightblue", stroke: "dodgerblue", cursor: "w-resize" }, scaledAdornmentSize(6, 16)),
            $(go.Shape, { alignment: go.Spot.BottomRight, fill: "lightblue", stroke: "dodgerblue", cursor: "se-resize" }, scaledAdornmentSize(8, 8)),
            $(go.Shape, { alignment: go.Spot.Bottom, fill: "lightblue", stroke: "dodgerblue", cursor: "n-resize" }, scaledAdornmentSize(16, 6)),
            $(go.Shape, { alignment: go.Spot.BottomLeft, fill: "lightblue", stroke: "dodgerblue", cursor: "sw-resize" }, scaledAdornmentSize(8, 8)),
            $(go.Shape, { alignment: go.Spot.Left, fill: "lightblue", stroke: "dodgerblue", cursor: "e-resize" }, scaledAdornmentSize(6, 16))
        );
    }
    return $(go.Adornment, "Spot",
        $(go.Placeholder),
            $(go.Shape,
        {
            alignment: go.Spot.Right,
            fill: "lightblue", stroke: "dodgerblue",
            cursor: "col-resize"
        },
        scaledAdornmentSize(6, 24),
        new go.Binding("visible", "", ad => {
            if (ad.adornedPart === null) return false;
            return ad.adornedPart.isSubGraphExpanded;
        }).ofObject()),
        $(go.Shape,
        {
            alignment: go.Spot.Bottom,
            fill: "lightblue", stroke: "dodgerblue",
            cursor: "row-resize"
        },
        scaledAdornmentSize(24, 6),
        new go.Binding("visible", "", ad => {
            if (ad.adornedPart === null) return false;
            return ad.adornedPart.isSubGraphExpanded;
        }).ofObject())
    );
}

function addNodeText0(contextMenu: any) {
    return $(go.Panel, "Table", // separator  name typename ---------------------------------
        {   
            contextMenu: contextMenu, 
            cursor: "move" 
        },
        {
            defaultRowSeparatorStroke: "black",
            desiredSize: new go.Size(136, 60),
            maxSize: new go.Size(136, 60), 
            margin: new go.Margin(2),
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
                textAlign: "center",
                height: 46,
                width : 120,
                // overflow: go.TextBlock.OverflowEllipsis,  // this result in only 2 lines with ... where cut
                verticalAlignment: go.Spot.Center,
                // stretch: go.GraphObject.Fill, // added to not resize object
                // overflow: go.TextBlock.OverflowEllipsis, // added to not resize object
                margin: new go.Margin(0,3,0,0),
                name: "name",
                stroke: "black"
            },        
            new go.Binding("text", "name").makeTwoWay(),
            new go.Binding("stroke", "textcolor", s => s || "black")
        ),
        // $(go.TextBlock, textStyle(), // the typename  --------------------
        //     {
        //         row: 1, column: 1, columnSpan: 6,
        //         editable: false, isMultiline: false,
        //         minSize: new go.Size(10, 4),
        //         margin: new go.Margin(0, 0, 0, 2),  
        //         textAlign: "center",
        //     },
        //     new go.Binding("text", "typename"),
        //     new go.Binding("stroke", "textcolor2").makeTwoWay()
        // ),
    )
}

function addNodeText(contextMenu: any, typeviewContextMenu: any) {
    return $(go.Panel, "Table", // separator  name typename ---------------------------------
        {   
            contextMenu: contextMenu, 
            cursor: "move" 
        },
        {
            defaultRowSeparatorStroke: "black",
            desiredSize: new go.Size(136, 60),
            maxSize: new go.Size(136, 60), 
            margin: new go.Margin(2),
            defaultAlignment: go.Spot.Center,
        },
        // $(go.RowColumnDefinition, { column: 2, width: 4 }),
        // content
        $(go.TextBlock, textStyle(),  // the name -----------------------
            {
                isMultiline: false,  // don't allow newlines in text
                editable: true,  // allow in-place editing by user
                row: 0, column: 0, columnSpan: 6,
                font: "10pt Segoe UI,sans-serif",
                // background: "lightgray",
                minSize: new go.Size(120, 36), 
                textAlign: "center",
                height: 46,
                width : 120,
                // overflow: go.TextBlock.OverflowEllipsis,  // this result in only 2 lines with ... where cut
                verticalAlignment: go.Spot.Center,
                // stretch: go.GraphObject.Fill, // added to not resize object
                // overflow: go.TextBlock.OverflowEllipsis, // added to not resize object
                margin: new go.Margin(0,3,0,0),
                name: "name",
                stroke: "black"
            },        
            new go.Binding("text", "name").makeTwoWay(),
            new go.Binding("stroke", "textcolor", s => s || "black")
        ),
        $(go.TextBlock, textStyle(), // the typename  --------------------
            {
                row: 1, column: 1, columnSpan: 6,
                editable: false, isMultiline: false,
                minSize: new go.Size(10, 4),
                margin: new go.Margin(0, 0, 0, 2),  
                textAlign: "center",
                // cursor: "context-menu",
                name: "typename",
                contextMenu: typeviewContextMenu
            },
            new go.Binding("text", "typename")
        ),
    )
}

function addLeftPorts(portContextMenu: any, offsetX: number = 0, offsetY: number = 0) {
    return $(go.Panel, "Vertical", 
            new go.Binding("itemArray", "leftPorts"),
            {
                row: 1, 
                column: 0,
                itemTemplate: makeItemTemplate('left', true, portContextMenu),
                alignment: new go.Spot(0, 0.5, offsetX, offsetY), 
                alignmentFocus: go.Spot.Right,
                fromLinkable: true, 
                toLinkable: true, 
                cursor: "pointer",
            },
    );  // end leftPorts Panel
}

function addTopPorts(portContextMenu: any, offsetX: number = 0, offsetY: number = 0) {
    return $(go.Panel, "Horizontal",
            new go.Binding("itemArray", "topPorts"),
            {
                row: 0, 
                column: 0,
                itemTemplate: makeItemTemplate('top', true, portContextMenu),
                alignment: new go.Spot(0.5, 0, offsetX, offsetY), 
                fromLinkable: true, 
                toLinkable: true,
                cursor: "pointer",
            }
    );  // end topPorts Panel
}
    
function addRightPorts(portContextMenu: any, offsetX: number = 0, offsetY: number = 0) {
    return $(go.Panel, "Vertical", 
            new go.Binding("itemArray", "rightPorts"),
                {
                    row: 1, 
                    column: 2,
                    itemTemplate: makeItemTemplate('right', true, portContextMenu),
                    alignment: new go.Spot(1, 0.5, offsetX, offsetY), 
                    alignmentFocus: go.Spot.Left,
                    fromLinkable: true,
                    toLinkable: true,
                    cursor: "pointer",
                }
            );  // end rightPorts Panel
}

function addBottomPorts(portContextMenu: any, offsetX: number = 0, offsetY: number = 0) {
    return $(go.Panel, "Horizontal",
            new go.Binding("itemArray", "bottomPorts"),
            {
                row: 0, 
                column: 0,
                itemTemplate: makeItemTemplate('bottom', true, portContextMenu),
                alignment: new go.Spot(0.5, 1, offsetX, offsetY), 
                fromLinkable: true, 
                toLinkable: true,
                cursor: "pointer",
            }
        );  // end bottomPorts Panel
}

function normalizeIcomStyle(value: any): "hybrid" | "idef" {
    return String(value || "").toLowerCase() === "hybrid" ? "hybrid" : "idef";
}

function resolveIcomStyle(targetObj: go.GraphObject | null | undefined): "hybrid" | "idef" {
    const partData: any = targetObj?.part?.data || {};
    const modelData: any = targetObj?.part?.diagram?.model?.modelData || {};
    const explicitStyle =
        partData?.icomStyle ??
        partData?.objectview?.icomStyle ??
        partData?.objectview?.typeview?.data?.icomStyle ??
        partData?.typeview?.icomStyle ??
        partData?.typeview?.data?.icomStyle ??
        modelData?.icomStyle;
    if (explicitStyle) {
        return normalizeIcomStyle(explicitStyle);
    }
    const templateName = String(
        partData?.template ??
        partData?.category ??
        partData?.typeview?.template ??
        partData?.objectview?.template ??
        ""
    ).toLowerCase();
    const typeName = String(
        partData?.typename ??
        partData?.objecttype?.name ??
        partData?.object?.type?.name ??
        partData?.typeview?.name ??
        ""
    ).toLowerCase();
    if (templateName === "idef0" || typeName === "process") {
        return "idef";
    }
    return "idef";
}

function getIcomGeometry(side: string, style: "hybrid" | "idef"): string {
    if (style === "idef") {
        switch (side) {
            case "left":
                return "M1 4 L15 4";
            case "right":
                return "M1 4 L15 4";
            case "top":
                return "M8 1 L8 15";
            case "bottom":
                return "M8 1 L8 15";
            default:
                return "M1 4 L15 4";
        }
    }
    switch (side) {
        case "top":
            return "F1 m 0,0 l 6,0 0,8  2,0  -5,4  -5,-4 2,0 0,-8 z";
        case "bottom":
            return "F1 m 0,0 l 6,0 0,-8  2,0  -5,-4  -5,4 2,0 0,8 z";
        default:
            return "F1 m 0,0 l 5,0 1,8 -1,8 -5,0 1,-8 -1,-8 z";
    }
}

function getIcomPortSize(isGroup: boolean, style: "hybrid" | "idef"): go.Size {
    if (style === "idef") {
        return isGroup ? new go.Size(18, 16) : new go.Size(16, 14);
    }
    return isGroup ? new go.Size(34, 18) : new go.Size(30, 15);
}

function getSideMarkerVisualSize(isGroup: boolean, style: "hybrid" | "idef"): go.Size {
    if (style === "idef") {
        return isGroup ? new go.Size(18, 8) : new go.Size(16, 8);
    }
    return getIcomPortSize(isGroup, style);
}

function getIcomFill(data: any, style: "hybrid" | "idef"): string {
    if (style === "idef") return "transparent";
    return data?.color || "white";
}

function getIcomStroke(data: any, style: "hybrid" | "idef"): string {
    if (style === "idef") return data?.color || "gray";
    return "gray";
}

function getIcomStrokeWidth(style: "hybrid" | "idef"): number {
    return style === "idef" ? 1.5 : 1;
}

const DEBUG_ICOM_LAYOUT = false;

function makeItemTemplate(side: string, isGroup: boolean, portContextMenu: any) {
    let rightside = side === 'right';
    let leftside = side === 'left';
    let topside = side === 'top';
    let bottomside = side === 'bottom';
    let fromlinkable = rightside || isGroup;
    let tolinkable = leftside || topside || bottomside || isGroup;
    let geostring1 = "F1 m 0,0 l 5,0 1,8 -1,8 -5,0 1,-8 -1,-8 z";
    geostring1.normalize();
    let geostring2 =   "F1 m 0,0 l 6,0 0,8  2,0  -5,4  -5,-4 2,0 0,-8 z";
    geostring2.normalize();
    let geostring3 = "F1 m 0,0 l 6,0 0,-8  2,0  -5,-4  -5,4 2,0 0,8 z";
    geostring3.normalize();
    let geostring4 = "F1 m 0,0 l 5,0 0,3 5,-7 -5,-7 0,3 -5,0 0,5 z";
    geostring4.normalize();
    let font1 = "10pt serif";
    let font2 = "9pt Segoe UI,sans-serif";
    let font = isGroup ? font2 : font1;
    let size1 = new go.Size(30, 15);
    let size2 = new go.Size(34, 18);
    let portSize = isGroup ? size2 : size1;
    let fromSpot, toSpot, textangle = 0;
    let textAlignment = go.Spot.Center;
    let textBlockAlign: "left" | "center" | "right" = "center";
    let textMargin = new go.Margin(0);
    if (topside) {
        toSpot = go.Spot.Top;
        fromSpot = go.Spot.Bottom;
        // textangle = 0; //90;
        // textalign = go.Spot.Right;
    } else if (bottomside) {
        toSpot = go.Spot.Bottom;
        fromSpot = go.Spot.Top;
        // textangle = 0; //270;
        // textalign = go.Spot.Left;
    } else if (leftside) {
        toSpot = go.Spot.Left;
        fromSpot = go.Spot.Right;
        // Anchor at process-side edge so text grows outward from the border.
        textAlignment = new go.Spot(1, 0.5, -3, 0);
        textBlockAlign = "right";
        textMargin = new go.Margin(0, 2, 0, 0);
    } else if (rightside) {
        toSpot = go.Spot.Left;
        fromSpot = go.Spot.Right;
        // Anchor at process-side edge so text grows outward from the border.
        textAlignment = new go.Spot(0, 0.5, 3, 0);
        textBlockAlign = "left";
        textMargin = new go.Margin(0, 0, 0, 2);
    }
    if (leftside || rightside) {
        const isLeft = leftside;
        const markerLaneWidth = 10;
         const portShape =
            $(go.Shape,
                {
                    name: "SHAPE",
                    fill: DEBUG_ICOM_LAYOUT ? "rgba(255, 165, 0, 0.35)" : "transparent",
                    stroke: DEBUG_ICOM_LAYOUT ? "orange" : "gray",
                    strokeWidth: DEBUG_ICOM_LAYOUT ? 2 : getIcomStrokeWidth("idef"),
                    geometryString: getIcomGeometry(side, "idef"),
                    desiredSize: getSideMarkerVisualSize(isGroup, "idef"),
                    alignment: go.Spot.Center,
                },
                new go.Binding("geometryString", "", function(d, obj) {
                    const style = resolveIcomStyle(obj);
                    obj.geometryString = getIcomGeometry(side, style);
                    obj.desiredSize = getSideMarkerVisualSize(isGroup, style);
                    if (DEBUG_ICOM_LAYOUT) {
                    } else {
                        obj.fill = getIcomFill(d, style);
                    }
                    obj.stroke = getIcomStroke(d, style);
                    obj.strokeWidth = getIcomStrokeWidth(style);
                    return obj.geometryString;
                }),
            );
        const markerLane = $(go.Panel, "Spot",
            {
                width: markerLaneWidth,
                height: 2,
                // margin: new go.Margin(16, 0, 0, 0),
                defaultAlignment: go.Spot.Center,
                background: DEBUG_ICOM_LAYOUT ? "gray" : "transparent",
            },
            portShape,
        );
        const leftText =
            $(go.TextBlock,
                {
                    font: font,
                    angle: textangle,
                    textAlign: "right",
                    wrap: go.TextBlock.None,
                    overflow: go.TextBlock.OverflowEllipsis,
                    background: "transparent",
                    margin: new go.Margin(0, 0, 0, 2),
                    toLinkable: true,
                    fromLinkable: true,
                    toSpot: go.Spot.Left,
                    fromSpot: go.Spot.Left,
                    cursor: "alias",
                    contextMenu: portContextMenu,
                },
                new go.Binding("portId", "", function(d) {
                    return d?.id || d?.portId || "";
                }),
                new go.Binding("text", "name"),
                new go.Binding('scale', 'textscale').makeTwoWay(),
            );
        const rightText =
            $(go.TextBlock,
                {
                    font: font,
                    angle: textangle,
                    textAlign: "left",
                    wrap: go.TextBlock.None,
                    overflow: go.TextBlock.OverflowEllipsis,
                    background: "transparent",
                    margin: new go.Margin(0, 2, 0, 0),
                    toLinkable: true,
                    fromLinkable: true,
                    toSpot: go.Spot.Right,
                    fromSpot: go.Spot.Right,
                    cursor: "alias",
                    contextMenu: portContextMenu,
                },
                new go.Binding("portId", "", function(d) {
                    return d?.id || d?.portId || "";
                }),
                new go.Binding("text", "name"),
                new go.Binding('scale', 'textscale').makeTwoWay(),
            );
        return $(go.Panel, "Horizontal",
            {
                margin: new go.Margin(0, 0),
                alignment: isLeft ? new go.Spot(0, 0.5, 0, 0) : new go.Spot(1, 0.5, 0, 0),
                alignmentFocus: isLeft ? go.Spot.Right : go.Spot.Left,
                defaultAlignment: go.Spot.Center,
            },
            ...(isLeft ? [leftText, markerLane] : [markerLane, rightText]),
        );
    }
    if (topside || bottomside) {
        const isTop = topside;
        const markerThickness = 2;
        const markerLength = getIcomPortSize(isGroup, "idef").height;
        const topBottomShape =
            $(go.Shape,
                {
                    name: "SHAPE",
                    fill: DEBUG_ICOM_LAYOUT ? "rgba(255, 165, 0, 0.35)" : "transparent",
                    stroke: DEBUG_ICOM_LAYOUT ? "orange" : "gray",
                    strokeWidth: DEBUG_ICOM_LAYOUT ? 2 : getIcomStrokeWidth("idef"),
                    geometryString: getIcomGeometry(side, "idef"),
                    desiredSize: new go.Size(markerThickness, markerLength),
                    alignment: go.Spot.Center,
                },
                new go.Binding("desiredSize", "", function(_d, obj) {
                    const style = resolveIcomStyle(obj);
                    if (!DEBUG_ICOM_LAYOUT) {
                        obj.fill = getIcomFill(_d, style);
                    } else {
                        obj.fill = style === "idef" ? "transparent" : getIcomFill(_d, style);
                    }
                    obj.stroke = getIcomStroke(_d, style);
                    obj.strokeWidth = getIcomStrokeWidth(style);
                    return style === "idef"
                        ? new go.Size(markerThickness, markerLength)
                        : getIcomPortSize(isGroup, style);
                }),
                new go.Binding("geometryString", "", function(d, obj) {
                    const style = resolveIcomStyle(obj);
                    return getIcomGeometry(side, style);
                }),
            );
        const markerPanel = $(go.Panel, "Spot",
            {
                width: markerThickness,
                height: markerLength,
                defaultAlignment: go.Spot.Center,
                background: DEBUG_ICOM_LAYOUT ? "gray" : "transparent",
            },
            topBottomShape,
        );
        const topBottomText =
            $(go.TextBlock,
                {
                    font: font,
                    angle: textangle,
                    textAlign: "center",
                    wrap: go.TextBlock.None,
                    overflow: go.TextBlock.OverflowEllipsis,
                    background: "transparent",
                    margin: new go.Margin(0),
                    toLinkable: true,
                    fromLinkable: true,
                    toSpot: isTop ? go.Spot.Top : go.Spot.Bottom,
                    fromSpot: isTop ? go.Spot.Top : go.Spot.Bottom,
                    cursor: "alias",
                    contextMenu: portContextMenu,
                },
                new go.Binding("portId", "", function(d) {
                    return d?.id || d?.portId || "";
                }),
                new go.Binding("text", "name"),
                new go.Binding('scale', 'textscale').makeTwoWay(),
            );
        return $(go.Panel, "Vertical",
            {
                margin: new go.Margin(0, 0),
                alignment: isTop ? new go.Spot(0.5, 0, 0, 0) : new go.Spot(0.5, 1, 0, 0),
                alignmentFocus: isTop ? go.Spot.Bottom : go.Spot.Top,
                defaultAlignment: go.Spot.Center,
            },
            ...(isTop ? [topBottomText, markerPanel] : [markerPanel, topBottomText]),
        );
    }
    return $(go.Panel, "Spot",
        { 
            margin: new go.Margin(1, 1),
            cursor: "pointer",
            contextMenu: portContextMenu, 
        },  // some space between ports
        $(go.Shape,
            {
                name: "SHAPE",
                fill: DEBUG_ICOM_LAYOUT ? "rgba(255, 165, 0, 0.35)" : "white", 
                stroke: DEBUG_ICOM_LAYOUT ? "orange" : "gray",
                strokeWidth: DEBUG_ICOM_LAYOUT ? 2 : 1,
                geometryString: getIcomGeometry(side, "hybrid"), 
                desiredSize: getIcomPortSize(isGroup, "hybrid"),
                toLinkable: true,
                fromLinkable: true,
                toSpot: toSpot,
                fromSpot: fromSpot,
                cursor: "pointer",
                contextMenu: portContextMenu,
            },
            new go.Binding("portId", "", function(d) { 
                return d?.id || d?.portId || ""; 
            }),
            new go.Binding("geometryString", "", function(d, obj) {
                const style = resolveIcomStyle(obj);
                obj.geometryString = getIcomGeometry(side, style);
                obj.desiredSize = getIcomPortSize(isGroup, style);
                if (!DEBUG_ICOM_LAYOUT) {
                    obj.fill = getIcomFill(d, style);
                    obj.stroke = getIcomStroke(d, style);
                    obj.strokeWidth = getIcomStrokeWidth(style);
                }
                return obj.geometryString;
            }),
        ),
        $(go.TextBlock,
            {
                font: font,
                angle: textangle,
                alignment: textAlignment,
                textAlign: textBlockAlign,
                margin: textMargin,
            },
            new go.Binding("text", "name"),
            new go.Binding('scale', 'textscale').makeTwoWay(),
        ),
            );
}

export function getNodeTemplateNames() {
    return nodeTemplateNames;
}
export function getLinkTemplateNames() {
    return linkTemplateNames;
}
export function getGroupTemplateNames() {
    return groupTemplateNames;
}

const UnselectedBrush = "lightgray";  // item appearance, if not "selected"
const SelectedBrush   = "dodgerblue";   // item appearance, if "selected"
const GradientYellow = $(go.Brush, 'Linear', { 0: 'LightGoldenRodYellow', 1: '#FFFF66' });
const GradientLightGreen = $(go.Brush, 'Linear', { 0: '#E0FEE0', 1: 'PaleGreen' });
const GradientLightGray = $(go.Brush, 'Linear', { 0: 'White', 1: '#DADADA' });

const EventNodeSize = 42;
const DataFill = GradientLightGray;

function resolvePortItemData(port: any) {
    return port?.data || port?.panel?.data || port?.part?.data || null;
}

// Change name
export function changePortName(port, name, myDiagram) {
    myDiagram.startTransaction("changePortName");
    const data = resolvePortItemData(port);
    if (debug) console.log('394 port, data', port, data);
    if (data) {
        myDiagram.model.setDataProperty(data, "name", name);
    }
    myDiagram.commitTransaction("changePortName");
}
  
// Change the color of the clicked port.
export function changePortColor(port, color, myDiagram) {
    myDiagram.startTransaction("colorPort");
    const data = resolvePortItemData(port);
    if (debug) console.log('403 port, data', port, data);
    if (data) {
        myDiagram.model.setDataProperty(data, "color", color);
    }
    myDiagram.commitTransaction("colorPort");
}
  
// Add a port to the specified side of the selected nodes.
export function addPort(port, myDiagram) {
    myDiagram.startTransaction("addPort");
    const portId = port.id;
    const side = port.side;
    const name = port.name;
    const color = port.color;
    if (debug) console.log('301 side, name', side, name);
    const sel = myDiagram.selection;
    if (debug) console.log('304 sel', sel);
    sel.each(node => {
        if (debug) console.log('306 node, portId: ', node, portId);
        let arr = node.data[side + "Ports"];
        if (debug) console.log('315 arr: ', arr);
        // Ensure the side array exists so new ports render immediately without reload.
        if (!arr) {
            myDiagram.model.setDataProperty(node.data, side + "Ports", []);
            arr = node.data[side + "Ports"];
        }
        if (arr) {
            const newportdata = {
                id: portId,
                portId: portId,
                name: name,
                color: color
            };
            if (debug) console.log('323 newportdata: ', newportdata);
            myDiagram.model.insertArrayItem(arr, -1, newportdata);
        }
    });
    myDiagram.commitTransaction("addPort");
}
   
// Remove the clicked port from the node.
// Links to the port will be redrawn to the node's shape.
export function removePort(port, myDiagram) {
    if (debug) console.log('436 port, myDiagram', port, myDiagram);
    myDiagram.startTransaction("removePort");
    const pid = port.data.id;
    const arr = port.panel.itemArray;
    if (debug) console.log('440 port, pid, arr', port, pid, arr);
    for (let i = 0; i < arr?.length; i++) {
        if (arr[i].id === pid) {
            myDiagram.model.removeArrayItem(arr, i);
        break;
        }
    }
    myDiagram.commitTransaction("removePort");
}

// Remove all ports from the same side of the node as the clicked port.
export function removeAllPorts(port, myDiagram) {
    myDiagram.startTransaction("removePorts");
    const nodedata = port.part.data;
    const arr = port.panel.itemArray;
    let len = arr?.length;
    if (len > 0) {
        for (let i = len-1; i >=0; i--) {
                myDiagram.model.removeArrayItem(arr, i);
        }
    }
    myDiagram.commitTransaction("removePorts");
}
  
// Exchange the position/order of the given port with the next one.
// If it's the last one, swap with the previous one.
export function swapPortOrder(port, myDiagram) {
    const arr = port.panel.itemArray;
    if (debug) console.log('461 port, port.panel, arr: ', port, port.panel, arr);
    if (arr?.length >= 2) {  // only if there are at least two ports!
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].portId === port.data.id) {
                myDiagram.startTransaction("swap ports");
                if (i >= arr.length - 1) i--;  // now can swap I and I+1, even if it's the last port
                const newarr = arr.slice(0);  // copy Array
                newarr[i] = arr[i + 1];  // swap items
                newarr[i + 1] = arr[i];
                // remember the new Array in the model
                myDiagram.model.setDataProperty(port.part.data, port._side + "Array", newarr);
                port.part.findLinksConnected(newarr[i].portId).each(l => l.invalidateRoute());
                port.part.findLinksConnected(newarr[i+1].portId).each(l => l.invalidateRoute());
                myDiagram.commitTransaction("swap ports");
                break;
            }
        }
    }
}

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

function addLinkTemplateName(name: string) {
    if (linkTemplateNames.length == 0) {
        linkTemplateNames.push(name);
        return;        
    }
    let names = [...new Set(linkTemplateNames)];
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
    linkTemplateNames = names1;
    if (debug) console.log('216 linkTemplateNames: ', linkTemplateNames);
}

// some shared functions
// if (true) {  // Swimpool and swimlane code
    // this is called after nodes have been moved or lanes resized, to layout all of the Pool Groups again

    const MINLENGTH = 200; // this controls the minimum length of any swimlane
    const MINBREADTH = 20; // this controls the minimum breadth of any non-collapsed swimlane
  
    function relayoutLanes() {
        myDiagram.nodes.each((lane) => {
        if (!(lane instanceof go.Group)) return;
        if (lane.category === 'Pool') return;
        lane.layout.isValidLayout = false; // force it to be invalid
        });
        myDiagram.layoutDiagram();
    }

    function relayoutDiagram() {
        myDiagram.layout.invalidateLayout();
        myDiagram.findTopLevelGroups().each(function (g) { if (g.category === 'Pool' && g.layout !== null) g.layout.invalidateLayout(); });
        myDiagram.layoutDiagram();
    }
    
    // compute the minimum size of a Pool Group needed to hold all of the Lane Groups
    function computeMinPoolSize(pool: go.Group) {
        // assert(pool instanceof go.Group && pool.category === "Pool");
        let len = MINLENGTH;
        pool.memberParts.each(function (lane) {
            // pools ought to only contain lanes, not plain Nodes
            if (!(lane instanceof go.Group)) return;
            const holder = lane.placeholder;
            if (holder !== null) {
                const sz = holder.actualBounds;
                len = Math.max(len, sz.width);
            }
        });
        return new go.Size(len, NaN);
    }
    
    // compute the minimum size for a particular Lane Group
    function computeLaneSize(lane: go.Group) {
        // assert(lane instanceof go.Group && lane.category !== "Pool");
        const sz = computeMinLaneSize(lane);
        if (lane.isSubGraphExpanded) {
        const holder = lane.placeholder;
        if (holder !== null) {
            const hsz = holder.actualBounds;
            sz.height = Math.max(sz.height, hsz.height);
        }
        }
        // minimum breadth needs to be big enough to hold the header
        const hdr = lane.findObject('HEADER');
        if (hdr !== null) sz.height = Math.max(sz.height, hdr.actualBounds.height);
        return sz;
    }
    
    // determine the minimum size of a Lane Group, even if collapsed
    function computeMinLaneSize(lane: go.Group) {
        if (!lane.isSubGraphExpanded) return new go.Size(MINLENGTH, 1);
        return new go.Size(MINLENGTH, MINBREADTH);
    }
    
  // define a custom ResizingTool to limit how far one can shrink a lane Group
  class LaneResizingTool extends go.ResizingTool {
    constructor(init) {
      super();
      if (init) Object.assign(this, init);
    }

    isLengthening() {
      return this.handle.alignment === go.Spot.Right;
    }

    public computeMinSize(): go.Size {
        if (this.adornedObject === null) return new go.Size(MINLENGTH, MINBREADTH);
        const lane = this.adornedObject.part;
        if (!(lane instanceof go.Group)) return go.ResizingTool.prototype.computeMinSize.call(this);
        // assert(lane instanceof go.Group && lane.category !== "Pool");
        const msz = computeMinLaneSize(lane); // get the absolute minimum size
        if (lane.containingGroup !== null && this.isLengthening()) {
          // compute the minimum length of all lanes
          const sz = computeMinPoolSize(lane.containingGroup);
          msz.width = Math.max(msz.width, sz.width);
        } else {
          // find the minimum size of this single lane
          const sz = computeLaneSize(lane);
          msz.width = Math.max(msz.width, sz.width);
          msz.height = Math.max(msz.height, sz.height);
        }
        return msz;
      }
    
    public resize(newr: go.Rect): void {
        if (this.adornedObject === null) return;
        const lane = this.adornedObject.part;
        if (!(lane instanceof go.Group)) return go.ResizingTool.prototype.resize.call(this, newr);
        if (lane instanceof go.Group && lane.containingGroup !== null && this.isLengthening()) {
          // changing the length of all of the lanes
          lane.containingGroup.memberParts.each((l) => {
            if (!(l instanceof go.Group)) return;
            const shape = l.resizeObject;
            if (shape !== null) {
              // set its desiredSize length, but leave each breadth alone
              shape.width = newr.width;
            }
          });
        } else {
          // changing the breadth of a single lane
          super.resize.call(this, newr);
        }
        relayoutDiagram(); // now that the lane has changed size, layout the pool again
      }
  }
  // end LaneResizingTool class

    // hide links between lanes when either lane is collapsed
    function updateCrossLaneLinks(group: go.Group) {
        group.findExternalLinksConnected().each((ll) => {
            ll.visible = (ll.fromNode !== null && ll.fromNode.isVisible() && ll.toNode !== null && ll.toNode.isVisible());
        });
    }

    const laneEventMenu =  // context menu for each lane
        $<go.Adornment>('ContextMenu',
            $('ContextMenuButton',
                $(go.TextBlock, 'Add Lane'),
                // in the click event handler, the obj.part is the Adornment; 
                // its adornedObject is the port
                { click: function (e: go.InputEvent, obj: go.GraphObject) { 
                    addLaneEvent((obj.part as go.Adornment).adornedObject as go.Node); } 
                }
            )
        );

    class PoolLayout extends go.GridLayout {
        public cellSize = new go.Size(1, 1);
        public wrappingColumn = 1;
        public wrappingWidth = Infinity;
        public isRealtime = false;  // don't continuously layout while dragging
        public alignment = go.GridLayout.Position;
        // This sorts based on the location of each Group.
        // This is useful when Groups can be moved up and down in order to change their order.
        public comparer = function (a: go.Part, b: go.Part) {
            const ay = a.location.y;
            const by = b.location.y;
            if (isNaN(ay) || isNaN(by)) return 0;
            if (ay < by) return -1;
            if (ay > by) return 1;
            return 0;
        };
        public doLayout(coll: go.Diagram | go.Group | go.Iterable<go.Part>) {
            const diagram = this.diagram;
            if (diagram === null) return;
            diagram.startTransaction('PoolLayout');
            const pool = this.group;
            if (pool !== null && pool.category === 'Pool') {
                // make sure all of the Group Shapes are big enough
                const minsize = computeMinPoolSize(pool);
                pool.memberParts.each(function (lane) {
                    if (!(lane instanceof go.Group)) return;
                    if (lane.category !== 'Pool') {
                        const shape = lane.resizeObject;
                        if (shape !== null) {  // change the desiredSize to be big enough in both directions
                            const sz = computeLaneSize(lane);
                            shape.width = (isNaN(shape.width) ? minsize.width : Math.max(shape.width, minsize.width));
                            shape.height = (!isNaN(shape.height)) ? Math.max(shape.height, sz.height) : sz.height;
                            const cell = lane.resizeCellSize;
                            if (!isNaN(shape.width) && !isNaN(cell.width) && cell.width > 0) shape.width = Math.ceil(shape.width / cell.width) * cell.width;
                            if (!isNaN(shape.height) && !isNaN(cell.height) && cell.height > 0) shape.height = Math.ceil(shape.height / cell.height) * cell.height;
                        }
                    }
                });
            }
            // now do all of the usual stuff, according to whatever properties have been set on this GridLayout
            super.doLayout.call(this, coll);
            diagram.commitTransaction('PoolLayout');
        }
    }
    // end PoolLayout class
        
    // Add a lane to pool (lane parameter is lane above new lane)
    function addLaneEvent(lane: go.Node) {
        myDiagram.startTransaction('addLane');
        if (lane != null && lane.data.category === 'Lane') {
            // create a new lane data object
            const shape = lane.findObject('SHAPE');
            const size = new go.Size(shape ? shape.width : MINLENGTH, MINBREADTH);
            const newlanedata = {
                category: 'Lane',
                text: 'New Lane',
                color: 'white',
                isGroup: true,
                loc: go.Point.stringify(new go.Point(lane.location.x, lane.location.y + 1)), // place below selection
                size: go.Size.stringify(size),
                group: lane.data.group
            };
            // and add it to the model
            myDiagram.model.addNodeData(newlanedata);
        }
        myDiagram.commitTransaction('addLane');
    }
// }
export function addNodeTemplates(nodeTemplateMap: any, contextMenu: any, portContextMenu: any, myMetis: akm.cxMetis, typeviewContextMenu: any) {
    const myDiagram = myMetis.myDiagram;
    if (debug) console.log('981 addNodeTemplates', myMetis, contextMenu, portContextMenu);
    let nodeTemplate0 =      
    $(go.Node, 'Auto',  // the Shape will go around the TextBlock
        {
            mouseEnter: (e, node) => node.isHighlighted = true,
            mouseLeave: (e, node) => node.isHighlighted = false,
        },
        new go.Binding("isSelected", "isSelected").makeTwoWay(),
        new go.Binding("stroke", "strokecolor", s => s || "lightgray"),
        new go.Binding("layerName", "layer"),
        new go.Binding("deletable"),
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding("scale", "scale1").makeTwoWay(),
        { // Tooltips
            toolTip:
            $(go.Adornment, "Auto",
                $(go.Shape, { fill: "lightyellow" }),
                $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                    new go.Binding("text", "", 
                        function (d) { 
                            const tt = uid.nodeInfo(d, myMetis); 
                            if (debug) console.log('234 tooltip', tt);
                            return tt;               
                        }
                    )
                )
            )
        },
        $(go.Shape, 'RoundedRectangle', 
            {
            cursor: "alias",
            fill: 'yellow', 
            // fill: 'hsla(0, 50%, 100%, 0.5)',
            stroke: "#fff",  
            strokeWidth: 2, 
            margin: new go.Margin(1, 1, 1, 1),
            shadowVisible: true,
            desiredSize: new go.Size(160, 70), 
            // set the port properties
            portId: "", 
            fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
            toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true
            },
            // Shape bindings
            new go.Binding('fill', 'fillcolor'),
            new go.Binding('stroke', 'strokecolor', s => s || "lightgray"), 
            new go.Binding("stroke", "isHighlighted", 
                function(h, shape) { 
                    return h ? "lightblue" : shape.part.data.strokecolor || "black"; 
                }).ofObject(),
            // new go.Binding('strokeWidth', 'strokewidth'), //sf:  the linking of relationships does not work if this is uncommented
            ),
        $(go.Shape, 'RoundedRectangle',  //smaller transparent rectangle to set cursor to move
            {
                cursor: "move",    
                fill: "transparent",
                stroke: "transparent",
                strokeWidth: 10,
                margin: new go.Margin(1, 1, 1, 1),
                shadowVisible: false,
                desiredSize: new go.Size(136, 60),              
            }    
        ), 
        addNodeText(contextMenu, typeviewContextMenu),       
    );
    nodeTemplateMap.add("", nodeTemplate0);
    nodeTemplateMap.add("textOnly", nodeTemplate0);
    addNodeTemplateName('textOnly');

    let nodeTemplate1 =      
    $(go.Node, 'Auto',  // the Shape will go around the TextBlock
        new go.Binding("isSelected", "isSelected").makeTwoWay(),
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
            resizable: true, 
            resizeObjectName: "SHAPE"
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
            new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                return typeof val === 'number' ? val : parseInt(val) || 1; 
            }),
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
                    font: "bold 10pt Segoe UI,sans-serif",
                    minSize: new go.Size(120, 36), 
                    desiredSize: new go.Size(200, 60),
                    textAlign: "center",
                    height: 46,
                    // width: 200,
                    verticalAlignment: go.Spot.Center,
                    margin: new go.Margin(2,2,2,2),
                    stretch: go.GraphObject.Fill,
                    // wrap: go.TextBlock.WrapFit,
                    name: "name"
                },        
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("stroke", "textcolor").makeTwoWay()
                ),
                $(go.TextBlock, textStyle(), // the typename  --------------------
                {
                    row: 1, column: 1, columnSpan: 6,
                    stretch: go.GraphObject.Horizontal,
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
        new go.Binding("isSelected", "isSelected").makeTwoWay(),
        new go.Binding("stroke", "strokecolor"),
        new go.Binding("layerName", "layer"),
        new go.Binding("deletable"),
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding("scale", "scale1").makeTwoWay(),
        { // Tooltip
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
            resizable: true, 
            resizeObjectName: "SHAPE"
        },
        $(go.Shape, 'RoundedRectangle', 
            {
            cursor: "alias",        // cursor: "pointer",
            name: 'SHAPE', 
            fill: 'red', 
            stroke: "#fff",  
            strokeWidth: 2, 
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
            new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                return typeof val === 'number' ? val : parseInt(val) || 1; 
            }),
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
                    font: "bold 10pt Segoe UI,sans-serif",
                    font: "bold 10pt Segoe UI,sans-serif",
                    minSize: new go.Size(120, 36), 
                    desiredSize: new go.Size(400, 100),
                    textAlign: "center",
                    width: 400,
                    height: 100,
                    verticalAlignment: go.Spot.Center,
                    margin: new go.Margin(2,2,2,2),
                    name: "name"
                },        
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("stroke", "textcolor").makeTwoWay(),
                ),
            ),
            ),
        ),
    );
    nodeTemplateMap.add("textOnly2", nodeTemplate2);
    addNodeTemplateName('textOnly2');

    let nodeTemplate3 =      
    $(go.Node, 'Auto',  // the Shape will go around the TextBlock
        new go.Binding("isSelected", "isSelected").makeTwoWay(),
        new go.Binding("stroke", "strokecolor"),
        new go.Binding("layerName", "layer"),
        new go.Binding("deletable"),
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding("scale", "scale1").makeTwoWay(),
        { // Tooltips
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
        $(go.Shape, 'RoundedRectangle',  // surrounds everything
            {
            cursor: "alias",        // cursor: "pointer",
            name: 'SHAPE', 
            fill: 'red', 
            stroke: "#fff",  
            strokeWidth: 2, 
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
            new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                return typeof val === 'number' ? val : parseInt(val) || 1; 
            }),
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
            },    
        ),        
        $(go.Panel, "Table", // Panel for text 
            { defaultAlignment: go.Spot.Left, margin: 2, cursor: "move" },
            $(go.RowColumnDefinition, { column: 0, width: 9 }),
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
                    font: "bold 10pt Segoe UI,sans-serif",
                    minSize: new go.Size(120, 36), 
                    desiredSize: new go.Size(200, 60),
                    textAlign: "center",
                    height: 46,
                    // width: 200,
                    verticalAlignment: go.Spot.Center,
                    margin: new go.Margin(2,2,2,2),
                    // stretch: go.GraphObject.Fill,
                    // wrap: go.TextBlock.WrapFit,
                    name: "name"
                },        
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("stroke", "textcolor")
                ),
            ),
            ),
        ),
        // $(go.Panel, "Vertical", // Panel for Icon  ------------------------
        // { 
        //     contextMenu: contextMenu , 
        //     cursor: "move",
        // },
        $(go.Panel, "Table", // icon area
            { 
                contextMenu: contextMenu , 
                cursor: "move",
            },    
            // $(go.Shape, 
            //     {  // this is the square around the image ---------
            //         row: 1, column: 0, columnSpan: 6,
            //         fill: "white", 
            //         stroke: "#ddd", 
            //         strokeWidth: 2, 
            //         // opacity: 0.4,
            //         desiredSize: new go.Size(56, 56), 
            //         margin: new go.Margin(0, 2, 0, 16),
            //         // shadowVisible: true,
            //     },
            //     new go.Binding("fill", "fillcolor2"),
            //     new go.Binding("stroke", "strokecolor2"),
            //     new go.Binding("template", "template"),
            // ),                                                                
            $(go.Picture,  // the image -------------------------------------
                {
                    name: "Picture",
                    desiredSize: new go.Size(48, 48),
                    row: 2, column: 0, columnSpan: 6,
                },
                new go.Binding("source", "icon", getIconSource),
                new go.Binding("visible", "icon", shouldShowIconPicture),
            ),      
            $(go.TextBlock, textStyle(), // the typename  --------------------
                {
                    row: 3, column: 0, columnSpan: 6,
                    stretch: go.GraphObject.Horizontal,
                    editable: false, isMultiline: false,
                    minSize: new go.Size(10, 4),
                    margin: new go.Margin(0, 0, 0, 2),
                    textAlign: "center",
                },
                new go.Binding("text", "findImage") //????? sf: is this is a hack to get the icon name to show up in the textblock
            ),                          
        ),
        $(go.TextBlock, textStyle(), // the typename  --------------------
        {
            row: 3, column: 0, columnSpan: 6,
            stretch: go.GraphObject.Horizontal,
            editable: false, isMultiline: false,
            minSize: new go.Size(10, 4),
            margin: new go.Margin(0, 0, 0, 2),  
            textAlign: "center",
        },
        new go.Binding("text", "typename")
        ),
    );

    nodeTemplateMap.add("textOnly3", nodeTemplate3);
    addNodeTemplateName('textOnly3');

    nodeTemplateMap.add("textAndIcon", 
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
            new go.Binding("isSelected", "isSelected").makeTwoWay(),
            new go.Binding("stroke", "strokecolor"),
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("scale", "scale1").makeTwoWay(),
            {
                mouseEnter: (e, node) => node.isHighlighted = true,
                mouseLeave: (e, node) => node.isHighlighted = false,
            },
            { // Tooltips
                toolTip:
                $(go.Adornment, "Auto",
                    $(go.Shape, { fill: "lightyellow" }),
                    $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                        new go.Binding("text", "", 
                            function (d) { 
                                const tt = uid.nodeInfo(d, myMetis); 
                                if (debug) console.log('234 tooltip', tt);
                                return tt;               
                            }
                        )
                    )
                )
            },
            $(go.Shape, 'RoundedRectangle', // Rectangle for cursor alias
                {
                    cursor: "alias", 
                    name: 'SHAPE', 
                    fill: 'transparent', 
                    stroke: "#aaa",  
                    strokeWidth: 2, 
                    margin: new go.Margin(0, 0, 0, 0),
                    shadowVisible: true,
                    desiredSize: new go.Size(199, 69), // outer Shape size with icon
                    // set the port properties
                    portId: "", 
                    fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
                    toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true
                },
                // Shape bindings
                new go.Binding('fill', 'fillcolor'),
                new go.Binding('stroke', 'strokecolor'), 
                new go.Binding("stroke", "isHighlighted", 
                    function(h, shape) { 
                        return h ? "lightblue" : shape.part.data.strokecolor || "black"; 
                    }).ofObject(),
                // new go.Binding('strokeWidth', 'strokewidth'), //sf:  the linking of relationships does not work if this is uncommented
                new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                    return typeof val === 'number' ? val : parseInt(val) || 1; 
                }),
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
                }    
            ),

            $(go.Panel, "Table", // Panel for text and icon ------------------------
                { 
                    defaultAlignment: go.Spot.Left, 
                    margin: 1, 
                    cursor: "move" 
                },
                $(go.RowColumnDefinition, 
                    { 
                        column: 1, 
                        width: 4 
                    }
                ),
                $(go.Panel, "Horizontal",
                    // { margin: new go.Margin(10, 10, 10, 10) },
                    {
                        defaultAlignment: go.Spot.Center,
                    },
                    // comment out icon start
                    $(go.Panel, "Vertical", // Panel for Icon  ------------------------
                        { 
                            contextMenu: contextMenu , 
                            cursor: "move",
                        },
                        $(go.Panel, "Spot", // icon area
                            { 
                                contextMenu: contextMenu , 
                                cursor: "move",
                            },    
                            $(go.Shape, 
                                {  // this is the square around the image with fillcolor ---------
                                    fill: "white", 
                                    stroke: "black", 
                                    opacity: 0.9,
                                    desiredSize: new go.Size(52, 52), 
                                    margin: new go.Margin(0, 2, 0, 16),
                                    // shadowVisible: true,
                                },
                                new go.Binding("fill", "fillcolor2"),
                                new go.Binding("stroke", "strokecolor2"),
                                new go.Binding("template", "template"),
                            ),                                                                
                            $(go.Shape, 
                                {  // this is the square outer border around the image with tranparent content---------
                                    fill: "transparent",
                                    stroke: "transparent", 
                                    // opacity: 1,
                                    strokeWidth: 4, // Update the strokeWidth to make the border thicker
                                    desiredSize: new go.Size(56, 56), 
                                    margin: new go.Margin(0, 2, 0, 16),
                                    shadowVisible: true,
                                },
                                // new go.Binding("fill", "fillcolor2"),
                                new go.Binding("stroke", "strokecolor2"),
                                new go.Binding("template", "template"),
                            ),             
                            makeIconGlyph({
                                desiredSize: new go.Size(52, 52),
                            }),                                               
                            // $(go.Picture,  // the image -------------------------------------
                            //     {
                            //         name: "Picture",
                            //         desiredSize: new go.Size(52, 52),
                            //         stretch: go.GraphObject.Fill,
                            //         imageStretch: go.GraphObject.Fill,
                            //         alignment: go.Spot.Center,
                            //     },
                            //     new go.Binding("source", "icon", getIconSource),
                            //     new go.Binding("visible", "icon", shouldShowIconPicture),
                            // ),    
                            // $(go.TextBlock, textStyle(), // the unicode symbol \uf015 is the plus sign
                            //     {
                            //         background: "transparent",
                            //         textAlign: "center",    
                            //         stroke:    "black",
                            //         // stroke: {(strokecolor2 !== '') ? strokecolor2 : "black"},
                            //         // margin: new go.Margin(20, 12, 12, 12), 
                            //         desiredSize: new go.Size(48, 36),
                            //         font: "bold 38px 'Font Awesome 6 Free','Font Awesome 6 Pro','Font Awesome 6 Brands','Font Awesome 5 Free','Font Awesome 5 Pro','Font Awesome 5 Brands','FontAwesome','Font Awesome','FontAwesome5Free','FontAwesome6Free','Segoe UI Emoji','Apple Color Emoji','Segoe UI Symbol','Noto Color Emoji','Helvetica','Arial',sans-serif",
                            //         editable: false,
                            //         isMultiline: false,
                            //         // alignment: go.Spot.Center, // Add this line to align the text center
                            //     },
                            //     // new go.Binding("fill", "fillcolor2"),
                            //     new go.Binding("stroke", "textcolor2", defaultStrokeColor), // Apply converter here - icon text color
                            //     new go.Binding("text", "icon", findUnicodeImage),
                            //     new go.Binding("visible", "icon", shouldShowUnicodeFallback)
                            // )
                        ),
                    ),
                    // comment out icon stop
                    // define the panel where the text will appear

                    addNodeText(contextMenu, typeviewContextMenu),
                ),
            ),
        )
    );
    addNodeTemplateName('textAndIcon');
         
    nodeTemplateMap.add("textAndGeometry", 
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
            new go.Binding("isSelected", "isSelected").makeTwoWay(),
            new go.Binding("stroke", "strokecolor"),
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("scale", "scale1").makeTwoWay(),
            { // Tooltips
                toolTip:
                $(go.Adornment, "Auto",
                    $(go.Shape, { fill: "lightyellow" }),
                    $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                        new go.Binding("text", "", 
                            function (d) { 
                                const tt = uid.nodeInfo(d, myMetis); 
                                if (debug) console.log('234 tooltip', tt);
                                return tt;               
                            }
                        )
                    )
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
                    toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true
                },
                // Shape bindings
                new go.Binding('fill', 'fillcolor'),
                new go.Binding('stroke', 'strokecolor'), 
                new go.Binding("stroke", "isHighlighted", function(h, shape) { return h ? "lightblue" : shape.part.data.strokecolor || "black"; })
                .ofObject(),
                // new go.Binding('strokeWidth', 'strokewidth'), //sf:  the linking of relationships does not work if this is uncommented
                new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                    return typeof val === 'number' ? val : parseInt(val) || 1; 
                }),
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
                            // new go.Binding("fill", "fillcolor"),
                            new go.Binding('stroke', 'strokecolor2'), 
                            new go.Binding("template", "template"),
                            new go.Binding("geometryString", "geometry"),
                            new go.Binding("fill", "fillcolor2"),
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
                            new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                                return typeof val === 'number' ? val : parseInt(val) || 1; 
                            }),
                        ),
                    ),
                    // define the panel where the text will appear
                    addNodeText(contextMenu, typeviewContextMenu),
                ),
            ),
        )
    );
    addNodeTemplateName('textAndGeometry');    

    nodeTemplateMap.add("textAndFigure", 
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
            new go.Binding("isSelected", "isSelected").makeTwoWay(),
            new go.Binding("stroke", "strokecolor"),
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("scale", "scale1").makeTwoWay(),
            { // Tooltips
                toolTip:
                $(go.Adornment, "Auto",
                    $(go.Shape, { fill: "lightyellow" }),
                    $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                        new go.Binding("text", "", 
                            function (d) { 
                                const tt = uid.nodeInfo(d, myMetis); 
                                if (debug) console.log('234 tooltip', tt);
                                return tt;               
                            }
                        )
                    )
                )
            },
            $(go.Shape, 'RoundedRectangle', // Rectangle for cursor alias
                {
                    cursor: "alias",        // cursor: "alias",
                    name: 'SHAPE', 
                    fill: 'red', 
                    stroke: "#000",  
                    strokeWidth: 2, 
                    margin: new go.Margin(1, 1, 1, 1),
                    shadowVisible: true,
                    desiredSize: new go.Size(198, 68), // outer Shape size with icon
                    // set the port properties
                    portId: "", 
                    fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
                    toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true
                },
                // Shape bindings
                new go.Binding('fill', 'fillcolor'),
                // new go.Binding('stroke', 'strokecolor'), 
                new go.Binding("stroke", "isHighlighted", 
                    function(h, shape) { return h ? "lightblue" : shape.part.data.strokecolor || "black"; }
                ).ofObject(),
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
            $(go.Panel, "Table", // Panel for text and figure ------------------------
                { defaultAlignment: go.Spot.Left, margin: 2, cursor: "move" },
                $(go.RowColumnDefinition, { column: 1, width: 4 }),
                $(go.Panel, "Horizontal",
                    // { margin: new go.Margin(10, 10, 10, 10) },
                    {
                        defaultAlignment: go.Spot.Center
                    },
                    $(go.Panel, "Vertical", // Panel for Figure  ------------------------
                        { 
                            contextMenu: contextMenu , 
                            cursor: "move" 
                        },
                        $(go.Shape, 
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
                            new go.Binding('stroke', 'strokecolor2'), 
                            new go.Binding("fill", "fillcolor2"),
                            new go.Binding("figure", "figure"), 
                        ),
                    ),
                    // define the panel where the text will appear
                    addNodeText(contextMenu, typeviewContextMenu),
                ),
            ),
        )
    );
    addNodeTemplateName('textAndFigure');    

    nodeTemplateMap.add('nodeWithPorts',
        $(go.Node, "Table",
            {
                contextMenu: contextMenu,
                selectionObjectName: "BODY",
                resizeObjectName: "BODY",  
                resizable: true, 
                selectionAdorned: false,
            },
            new go.Binding("isSelected", "isSelected").makeTwoWay(),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("scale", "scale1").makeTwoWay(),
            { // Tooltips
                toolTip:
                $(go.Adornment, "Auto",
                    $(go.Shape, { fill: "lightyellow" }),
                    $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                        new go.Binding("text", "", 
                            function (d) { 
                                const tt = uid.nodeInfo(d, myMetis); 
                                if (debug) console.log('234 tooltip', tt);
                                return tt;               
                            }
                        )
                    )
                )
            },
            // the body
            $(go.Panel, "Auto",
                {
                    name: "BODY",
                    row: 1, 
                    column: 1, 
                    minSize: new go.Size(150, 60),
                    stretch: go.GraphObject.Fill
                },
                $(go.Shape, "RoundedRectangle",
                    {
                        cursor: "alias",
                        fill: "white", 
                        stroke: "black", 
                        strokeWidth: 2,
                        parameter1: 5, 
                        portId: "",
                        fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
                        toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true
                    },
                    new go.Binding('fill', 'fillcolor'),
                    new go.Binding("stroke", "strokecolor"),
                ),
                $(go.Shape, "RoundedRectangle",
                    {
                        cursor: "move",
                        fill: "transparent", 
                        stroke: "transparent", 
                        desiredSize: new go.Size(110, 40),
                    },
                ),
                $(go.TextBlock,
                    { 
                        cursor: "move",
                        margin: 10, 
                        textAlign: "center", 
                        font: "14px Segoe UI,sans-serif", 
                        stroke: "#484848", 
                        editable: true, 
                        isMultiline: true,  // don't allow newlines in text
                    },
                new go.Binding("text", "name").makeTwoWay(),
                )
            ),  // end Auto Panel body

            // the Panel holding the left port elements, which are themselves Panels,
            // created for each item in the itemArray, bound to data.leftArray
            $(go.Panel, "Vertical", 
                new go.Binding("itemArray", "leftPorts"),
                {
                    row: 1, 
                    column: 0,
                    // alignment: new go.Spot(0, 0.5, 0, 7),
                    itemTemplate: makeItemTemplate('left',false, portContextMenu),
                    alignment: go.Spot.Left, 
                }
            ),  // end leftPorts Panel

            // the Panel holding the top port elements, which are themselves Panels,
            // created for each item in the itemArray, bound to data.topArray
            $(go.Panel, "Horizontal",
                new go.Binding("itemArray", "topPorts"),
                {
                    row: 0, 
                    column: 1,
                    itemTemplate: makeItemTemplate('top',false, portContextMenu),
                    alignment: go.Spot.Top, 
                }
            ),  // end topPorts Panel

            // the Panel holding the right port elements, which are themselves Panels,
            // created for each item in the itemArray, bound to data.rightArray
            $(go.Panel, "Vertical",
                new go.Binding("itemArray", "rightPorts"),
                {
                    row: 1, 
                    column: 2,
                    itemTemplate: makeItemTemplate('right', false, portContextMenu),
                    alignment: go.Spot.Right, 
                }
            ),  // end rightPorts Panel

            // the Panel holding the bottom port elements, which are themselves Panels,
            // created for each item in the itemArray, bound to data.bottomArray
            $(go.Panel, "Horizontal",
                new go.Binding("itemArray", "bottomPorts"),
                {
                    row: 2, 
                    column: 1,
                    itemTemplate: makeItemTemplate('bottom', false, portContextMenu),
                    alignment: go.Spot.Bottom, 
                }
            ),   // end bottomPorts Panel
        )    
    );  // end Node
    addNodeTemplateName('nodeWithPorts');

    nodeTemplateMap.add('nodeWithNoPorts',
        $(go.Node, "Table",
            {
                contextMenu: contextMenu,
                selectionObjectName: "BODY",
                resizeObjectName: "BODY",  
                resizable: true, 
                selectionAdorned: false,
            },
            new go.Binding("isSelected", "isSelected").makeTwoWay(),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("scale", "scale1").makeTwoWay(),
            { // Tooltips
                toolTip:
                $(go.Adornment, "Auto",
                    $(go.Shape, { fill: "lightyellow" }),
                    $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                        new go.Binding("text", "", 
                            function (d) { 
                                const tt = uid.nodeInfo(d, myMetis); 
                                if (debug) console.log('234 tooltip', tt);
                                return tt;               
                            }
                        )
                    )
                )
            },
            $(go.Panel, "Auto",
                {
                    name: "BODY",
                    row: 1, 
                    column: 1, 
                    minSize: new go.Size(150, 60),
                    stretch: go.GraphObject.Fill
                },
                $(go.Shape, "RoundedRectangle",
                    {
                        cursor: "alias",
                        fill: "white", 
                        stroke: "black", 
                        strokeWidth: 2,
                        parameter1: 5, 
                        portId: "",
                        fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
                        toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true
                    },
                    new go.Binding('fill', 'fillcolor'),
                    new go.Binding("stroke", "strokecolor"),
                    new go.Binding("strokeWidth", "strokewidth"),
                ),
                $(go.Shape, "RoundedRectangle",
                    {
                        cursor: "move",
                        fill: "transparent", 
                        stroke: "transparent", 
                        desiredSize: new go.Size(110, 40),
                    },
                ),
                $(go.TextBlock,
                    { 
                        cursor: "move",
                        margin: 10, 
                        textAlign: "center", 
                        font: "bold 14px Segoe UI,sans-serif", 
                        stroke: "#484848", 
                        editable: true, 
                        isMultiline: true,  // don't allow newlines in text
                    },
                    new go.Binding("text", "name").makeTwoWay(),
                )
            ),  // end Auto Panel body
        )    
    );  // end Node
    addNodeTemplateName('nodeWithNoPorts');

    nodeTemplateMap.add("label", 
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
            new go.Binding("isSelected", "isSelected").makeTwoWay(),
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            { contextMenu: contextMenu },    
            {
                selectionObjectName: "GROUP",
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
                    desiredSize: new go.Size(150, 60), // outer Shape size 
                    // set the port properties
                    portId: "", 
                    toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: false
                },
                new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),    
                // Shape bindings
                new go.Binding('fill', 'fillcolor'),
                new go.Binding('stroke', 'strokecolor2'), 
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

    nodeTemplateMap.add("Annotation",
        $(go.Node, 'Auto',
            new go.Binding("isSelected", "isSelected").makeTwoWay(),
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            { contextMenu: contextMenu },  
            { 
                background: "transparent", 
                // background: GradientLightGray, 
                locationSpot: go.Spot.Center, 
            },            
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            $(go.Shape, 'Annotation', // A left bracket shape
                {
                    portId: '', 
                    fromLinkable: true, toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: false,
                    cursor: 'alias', 
                    fromSpot: go.Spot.AllSides,
                    // fromSpot: go.Spot.Left,
                    strokeWidth: 2, 
                    stroke: 'gray', 
                },
                new go.Binding('fill', 'fillcolor'),
                new go.Binding('background', 'fillcolor'),   
            ),  
            $(go.TextBlock,
                { 
                    margin: 5, 
                    cursor: 'move',
                    editable: true, 
                    text: 'Annotation',
                    alignment: go.Spot.Left,
                    scale: 1,                    
                },
                new go.Binding('text', 'text').makeTwoWay(),
                new go.Binding('scale', 'textscale').makeTwoWay(),
                new go.Binding('stroke', 'strokecolor'),   
                ),
        )
    );
    addNodeTemplateName('Annotation');

    nodeTemplateMap.add("ActivityNode", 
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
            new go.Binding("isSelected", "isSelected").makeTwoWay(),
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            // new go.Binding("scale", "scale1").makeTwoWay(),
            {
                selectionObjectName: "SHAPE",
                // resizable: true, 
                resizeObjectName: "SHAPE",
                contextMenu: contextMenu ,    
            },
            { // Tooltip
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
                locationObjectName: 'SHAPE', 
                locationSpot: go.Spot.Center,
                resizable: true, 
                resizeObjectName: 'PANEL',
                selectionAdorned: false,  // use a Binding on the Shape.stroke to show selection
                //itemTemplate: boundaryEventItemTemplate
            },
            $(go.Panel, 'Spot',
                {
                name: 'PANEL',
                minSize: new go.Size(160, 80),
                desiredSize: new go.Size(160, 80)
                },
                $(go.Panel, 'Spot',
                    $(go.Shape, 'RoundedRectangle',  // the outside rounded rectangle
                        {
                            cursor: 'alias',
                            name: 'SHAPE',
                            fill: $(go.Brush, 'Linear', { 0: 'OldLace', 1: 'PapayaWhip' }), 
                            stroke: '#CDAA7D',
                            strokeWidth: 3,
                            parameter1: 10, // corner size
                            portId: '', 
                            fromLinkable: true,
                            fromSpot: go.Spot.RightSide, 
                            toSpot: go.Spot.LeftSide,
                            fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
                            toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true,
                        },
                        new go.Binding('fill', 'fillcolor'),
                        new go.Binding("stroke", "strokecolor"),
                        new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                            return typeof val === 'number' ? val : parseInt(val) || 1; 
                        }),
                    ),
                ), 
            ),  // end main body rectangles spot panel
        
            $(go.Panel, 'Auto',  // make an area around text for move cursor
                $(go.Shape, 'Rectangle',  // area around the text
                    {
                        fill: 'transparent', stroke: null, strokeWidth: 1,
                        cursor: 'move',
                        desiredSize: new go.Size(140, 60),
                    },
                ),
            ),
            $(go.TextBlock,  // the center text
            {
                alignment: go.Spot.Center, 
                // background: 'gray',
                cursor: 'move',
                textAlign: 'center', 
                margin: 4,
                editable: true,
                scale: 1,
                isMultiline: true,
                wrap: go.TextBlock.WrapFit,
                overflow: go.TextBlock.OverflowEllipsis,
                maxSize: new go.Size(150, NaN),  // limit width, allow height to grow
            },
            new go.Binding("text", "name").makeTwoWay(),
            new go.Binding("scale", "textscale").makeTwoWay(),
            new go.Binding("stroke", "textcolor").makeTwoWay(),
            ),
            $(go.Picture,
                { 
                    name: "nodeImage", 
                    desiredSize: new go.Size(30, 30),
                    alignmentFocus: go.Spot.TopLeft,
                    alignment: new go.Spot(0, 0, 5, 5),
                    margin: 50, //new go.Margin(5, 5, 5, 5),
                    cursor: "move",
                    stretch: go.GraphObject.Fill,
                    imageStretch: go.GraphObject.Fill,
                },
                new go.Binding("source", "icon", getIconSource),
                new go.Binding("visible", "icon", shouldShowIconPicture),
            ),

            $(go.Picture,
                { 
                    name: "nodeImage", 
                    desiredSize: new go.Size(30, 30),
                    alignmentFocus: go.Spot.TopLeft,
                    alignment: new go.Spot(0, 0, 30, 65),
                    margin: 50, //new go.Margin(5, 5, 5, 5),
                    cursor: "move",
                    stretch: go.GraphObject.Fill,
                    imageStretch: go.GraphObject.Fill,
                },
                new go.Binding("source", "icon1", findImage),
            ),

            $(go.Picture,
                { 
                    name: "nodeImage", 
                    desiredSize: new go.Size(30, 30),
                    alignmentFocus: go.Spot.TopLeft,
                    alignment: new go.Spot(0, 0, 65, 65),
                    margin: 50, //new go.Margin(5, 5, 5, 5),
                    cursor: "move",
                    stretch: go.GraphObject.Fill,
                    imageStretch: go.GraphObject.Fill,
                },
                new go.Binding("source", "icon2", findImage),
            ),

            $(go.Picture,
                { 
                    name: "nodeImage", 
                    desiredSize: new go.Size(30, 30),
                    alignmentFocus: go.Spot.TopLeft,
                    alignment: new go.Spot(0, 0, 100, 65),
                    margin: 50, //new go.Margin(5, 5, 5, 5),
                    cursor: "move",
                    stretch: go.GraphObject.Fill,
                    imageStretch: go.GraphObject.Fill,
                },
                new go.Binding("source", "icon3", findImage),
            ),
        ));  
        
    addNodeTemplateName('ActivityNode');

    nodeTemplateMap.add("EventNode",
        $(go.Node, 'Vertical',  // the Shape will go around the TextBlock
            new go.Binding("isSelected", "isSelected").makeTwoWay(),
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            {
                selectionObjectName: "GROUP",
                // resizable: true, resizeObjectName: "SHAPE",
                resizeObjectName: "SHAPE",
                contextMenu: contextMenu
            },
            { // Tooltips
                toolTip:
                $(go.Adornment, "Auto",
                    $(go.Shape, { fill: "lightyellow" }),
                    $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                        new go.Binding("text", "", 
                            function (d) { 
                                const tt = uid.nodeInfo(d, myMetis); 
                                if (debug) console.log('234 tooltip', tt);
                                return tt;               
                            }
                        )
                    )
                )
            },
            $(go.Panel, 'Spot',
                $(go.Shape,  // Outer circle
                    { 
                        cursor: "alias",                    // cursor: "pointer",
                        alignment: go.Spot.Center,
                        figure: "Circle", 
                        fill: "white",
                        stroke: "transparent",
                        strokeWidth: 4,
                        minSize: new go.Size(60, 60), 
                        desiredSize: new go.Size(80, 80),   // outer Shape size 
                        // set the port properties
                        portId: "", 
                        fromLinkable: true,
                        fromSpot: go.Spot.RightSide,
                        toLinkable: true,
                        toSpot: go.Spot.LeftSide,
                        toLinkableSelfNode: false,
                        toLinkableDuplicates: false,
                    },
                    // Shape bindings
                    new go.Binding('fill', 'fillcolor'),
                    new go.Binding('stroke', 'strokecolor'),
                    // new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                    //     return typeof val === 'number' ? val : parseInt(val) || 1; 
                    // }),
                ),
                $(go.Picture,  // the image -------------------------------------
                    {
                        name: "Picture",
                        desiredSize: new go.Size(70, 70),
                        stretch: go.GraphObject.Fill,
                        imageStretch: go.GraphObject.Fill,
                        alignment: go.Spot.Center,
                    },
                    new go.Binding("source", "icon", getIconSource),
                    new go.Binding("visible", "icon", shouldShowIconPicture),
                ),    
                $(go.Shape,  // Figure
                    { 
                        cursor: "move",    
                        figure: "Circle", 
                        fill: "transparent",
                        // stroke: "transparent",
                        strokeWidth: 4,
                        // margin: new go.Margin(0, 0, 6, 0), // Set top margin to 10
                        minSize: new go.Size(58, 58), 
                        desiredSize: new go.Size(59, 59), // outer Shape size 
                    },
                    new go.Binding('stroke', 'strokecolor2'), 
                    new go.Binding("figure", "figure"), 
                ),

                $(go.Shape,  // move area
                    { 
                        figure: "Circle", 
                        fill: "transparent",
                        stroke: "transparent",
                        strokeWidth: 1,
                        cursor: "move",                    // To move a node,
                        // margin: new go.Margin(0, 0, 6, 0), // Set top margin to 10
                        minSize: new go.Size(40, 40), 
                        desiredSize: new go.Size(50, 50),  // outer Shape size 
                    },
                ),
            ),
            // end Spot Panel
            $(go.TextBlock, textStyle(),  // the text -----------------------
                { 
                    margin: 0, 
                    // font: "bold 12px Georgia, sans-serif",
                    isMultiline: true,  // allow newlines in text
                    editable: true,  // allow in-place editing by user   
                },
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("stroke", "textcolor").makeTwoWay(),
            ),   
        ),     
    );
    addNodeTemplateName('EventNode');

    nodeTemplateMap.add("GatewayNode",
        $(go.Node, 'Vertical',  // the Shape will go around the TextBlock
            new go.Binding("isSelected", "isSelected").makeTwoWay(),
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            {
                selectionObjectName: "GROUP",
                // resizable: true, 
                resizeObjectName: "SHAPE",
                contextMenu: contextMenu ,    
            },
            { // Tooltips
                toolTip:
                $(go.Adornment, "Auto",
                    $(go.Shape, { fill: "lightyellow" }),
                    $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                        new go.Binding("text", "", 
                            function (d) { 
                                const tt = uid.nodeInfo(d, myMetis); 
                                if (debug) console.log('234 tooltip', tt);
                                return tt;               
                            }
                        )
                    )
                )
            },            
            $(go.Panel, 'Spot',
                $(go.Shape, // figure
                    { 
                        cursor: "alias",                    // To draw a link,
                        figure: "Diamond", 
                        fill: "lightyellow",
                        stroke: "black",
                        strokeWidth: 3,
                        minSize: new go.Size(60, 60), 
                        desiredSize: new go.Size(80, 80),  // outer Shape size 
                        // set the port properties
                        portId: '', 
                        fromLinkable: true, 
                        toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: false,
                        fromSpot: go.Spot.NotLeftSide, 
                        toSpot: go.Spot.NotRightSide,
                    },
                    new go.Binding('fill', 'fillcolor'),
                    new go.Binding('stroke', 'strokecolor'), 
                    new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                        return typeof val === 'number' ? val : parseInt(val) || 1; 
                    }),
                ),                      
                $(go.Picture,  // the image -------------------------------------
                    {
                        name: "Picture",
                        desiredSize: new go.Size(70, 70),
                        stretch: go.GraphObject.Fill,
                        imageStretch: go.GraphObject.Fill,
                        alignment: go.Spot.Center,
                    },
                    new go.Binding("source", "icon", getIconSource),
                    new go.Binding("visible", "icon", shouldShowIconPicture),
                ),    
                $(go.Shape,  // Plus line
                    { 
                        cursor: "move",    
                        figure: "PlusLine", 
                        fill: "transparent",
                        stroke: "transparent",
                        strokeWidth: 3,
                        // margin: new go.Margin(0, 0, 6, 0), // Set top margin to 10
                        minSize: new go.Size(20, 20), 
                        desiredSize: new go.Size(30, 30), // outer Shape size 
                    },
                    new go.Binding('stroke', 'strokecolor2'), 
                    new go.Binding("figure", "figure"), 
                ),
                $(go.Shape,  // move
                    { 
                        figure: "Diamond", 
                        fill: "transparent",
                        stroke: "transparent",
                        strokeWidth: 1,
                        cursor: "move",                    // To move a node,
                        // margin: new go.Margin(0, 0, 6, 0), // Set top margin to 10
                        minSize: new go.Size(40, 40), 
                        desiredSize: new go.Size(50, 50),  // outer Shape size 
                    },
                ),
            ),    // end Spot Panel
            $(go.TextBlock, textStyle(),  // the text -----------------------
                { 
                    margin: 0, 
                    // font: "bold 12px Georgia, sans-serif",
                    isMultiline: true,  // allow newlines in text
                    editable: true,  // allow in-place editing by user   
                },
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("stroke", "textcolor").makeTwoWay(),
            ),
        ),
    );    
    addNodeTemplateName('GatewayNode');

    nodeTemplateMap.add("DataObjectNode",
        $(go.Node, 'Vertical',
            new go.Binding("isSelected", "isSelected").makeTwoWay(),
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            // new go.Binding("scale", "scale1").makeTwoWay(),
            {
                selectionObjectName: "SHAPE",
                contextMenu: contextMenu,    
            },
            { // Tooltips
                toolTip:
                $(go.Adornment, "Auto",
                    $(go.Shape, { fill: "lightyellow" }),
                    $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                        new go.Binding("text", "", 
                            function (d) { 
                                const tt = uid.nodeInfo(d, myMetis); 
                                if (debug) console.log('234 tooltip', tt);
                                return tt;               
                            }
                        )
                    )
                )
            },
            $(go.Panel, 'Spot',
                $(go.Shape, "File",
                    { 
                        name: 'SHAPE', 
                        portId: '', 
                        fromLinkable: true, 
                        toLinkable: true, 
                        cursor: 'alias',
                        fill: "white", 
                        desiredSize: new go.Size(50, 70)
                    },
                    new go.Binding('fill', 'fillcolor'),
                    new go.Binding('stroke', 'strokecolor'),
                    new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                        return typeof val === 'number' ? val : parseInt(val) || 1; 
                    }),
                ),
                $(go.Shape, "File",  // Inner shape for moving
                    { 
                        fill: "transparent",
                        stroke: "transparent",
                        strokeWidth: 1,
                        cursor: "move",      
                        desiredSize: new go.Size(40, 60),  
                    },
                ),
            ),
            $(go.TextBlock, textStyle(),  // the text -----------------------
                { 
                    margin: 5, 
                    isMultiline: true,  // allow newlines in text
                    editable: true,  // allow in-place editing by user   
                    textAlign: "center",
                    alignment: go.Spot.Center,
                },
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("stroke", "textcolor").makeTwoWay(),
                new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                    return typeof val === 'number' ? val : parseInt(val) || 1; 
                }),
            ),   
        ),
    );    
    addNodeTemplateName('DataObjectNode');
    
    nodeTemplateMap.add("MessageNode",
        $(go.Node, 'Vertical',  // the Shape will go around the TextBlock
            new go.Binding("isSelected", "isSelected").makeTwoWay(),
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            {
                selectionObjectName: "SHAPE",
                contextMenu: contextMenu,    
            },
            { // Tooltips
                toolTip:
                $(go.Adornment, "Auto",
                    $(go.Shape, { fill: "lightyellow" }),
                    $(go.TextBlock, { margin: 8 },
                        new go.Binding("text", "", 
                            function (d) { 
                                const tt = uid.nodeInfo(d, myMetis); 
                                if (debug) console.log('234 tooltip', tt);
                                return tt;               
                            }
                        )
                    )
                )
            },
            $(go.Panel, 'Spot',
                $(go.Shape, "Rectangle",  // envelope body
                    { 
                        name: 'SHAPE', 
                        portId: '', 
                        fromLinkable: true, 
                        toLinkable: true, 
                        cursor: 'alias',
                        fill: "white", 
                        desiredSize: new go.Size(80, 50),
                        strokeWidth: 1,
                    },
                    new go.Binding('fill', 'fillcolor'),
                    new go.Binding('stroke', 'strokecolor'),
                    new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                        return typeof val === 'number' ? val : parseInt(val) || 1; 
                    }),
                ),
                // Add a triangle at the top to form envelope shape - FIXED POSITION
                $(go.Shape, 
                    { 
                        figure: "Triangle",
                        alignment: new go.Spot(0.5, 0, 0, 10.5),  // positioned at top center with no offset
                        angle: 180,  // point down
                        desiredSize: new go.Size(80, 20),
                        fill: null,
                        stroke: "black",
                        strokeWidth: 1,
                    },
                    new go.Binding('stroke', 'strokecolor'),
                    new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                        return typeof val === 'number' ? val : parseInt(val) || 1; 
                    }),
                ),
                // Middle line of envelope
                // $(go.Shape, 
                //     { 
                //         figure: "LineH",
                //         alignment: new go.Spot(0.5, 0.3),
                //         desiredSize: new go.Size(80, 1),
                //         stroke: "black",
                //         strokeWidth: 1,
                //     },
                //     new go.Binding('stroke', 'strokecolor'),
                // new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                //     return typeof val === 'number' ? val : parseInt(val) || 1; 
                // }),
                // ),
                $(go.Shape, "Rectangle",  // Inner shape for moving
                    { 
                        fill: "transparent",
                        stroke: "transparent",
                        cursor: "move",      
                        desiredSize: new go.Size(70, 40),  
                    },
                ),
            ),
            $(go.TextBlock, textStyle(),
                { 
                    margin: 5, 
                    isMultiline: true,
                    editable: true,
                    textAlign: "center",
                    alignment: go.Spot.Center,
                },
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("stroke", "textcolor").makeTwoWay(),
            ),   
        ),
    );
    addNodeTemplateName('MessageNode');

    const portSize = new go.Size(8, 8);

    nodeTemplateMap.add("TestNode",
    new go.Node("Auto")
        .add(
        new go.Shape("Rectangle", { fill: "lightgray", desiredSize: new go.Size(300, 200) }),
        new go.Panel("Table")
            .addColumnDefinition(0, { alignment: go.Spot.Left })
            .addColumnDefinition(2, { alignment: go.Spot.Right })
            .add(
            new go.TextBlock(  // the node title
                { column: 0, row: 0, columnSpan: 3, alignment: go.Spot.Center,
                font: "bold 10pt sans-serif", margin: new go.Margin(4, 2) })
                .bind("text", "name"),
            new go.Panel("Horizontal",
                { column: 0, row: 1 })
                .add(
                new go.Shape( // the "A" port
                    { width: 10, height: 10, portId: "A", toSpot: go.Spot.Left,
                    toLinkable: true, toMaxLinks: 1 }),  // allow user-drawn links to here
                new go.TextBlock( "A")  // "A" port label
                ),
            new go.Panel("Horizontal",
                { column: 0, row: 2 })
                .add(
                new go.Shape( // the "B" port
                    { width: 10, height: 10, portId: "B", toSpot: go.Spot.Left,
                    toLinkable: true, toMaxLinks: 1 }),  // allow user-drawn links to here
                new go.TextBlock( "B")  // "B" port label
                ),
            new go.Panel("Horizontal",
                { column: 2, row: 3, rowSpan: 2 })
                .add(
                new go.TextBlock( "Out"),  // "Out" port label
                new go.Shape( // the "Out" port
                    { width: 10, height: 10, portId: "Out", fromSpot: go.Spot.Right,
                    fromLinkable: true, cursor: "pointer" })  // allow user-drawn links from here
                )
            )
        )
    );
    addNodeTemplateName('TestNode');

}

export function getLinkTemplate(templateName: string, contextMenu: any, myMetis: akm.cxMetis): any {
    const linkTemplate =
        $(go.Link,
            new go.Binding("deletable"),
            // new go.Binding("isLayoutPositioned", "isLayoutPositioned").makeTwoWay(), 
            { selectable: true },
            { 
                toShortLength: 3, 
                relinkableFrom: true, 
                relinkableTo: true, 
                adjusting: go.Link.Stretch,
                reshapable: true,
                resegmentable: true,
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
            new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                return typeof val === 'number' ? val : parseInt(val) || 1; 
            }),
            new go.Binding("strokeDashArray", "dash", 
                function(d) { return setDashed(d); }),
            ),
            // the "from" arrowhead
            $(go.Shape, { fromArrow: "None"},
            { scale: 1.3, fill: "transparent" },
            new go.Binding("fromArrow", "fromArrow"),
            new go.Binding("fill", "fromArrowColor"),
            new go.Binding("stroke", "strokecolor"),
            new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                return typeof val === 'number' ? val : parseInt(val) || 1; 
            }),
            new go.Binding("scale", "arrowscale").makeTwoWay(),
            ),
            // the "to" arrowhead
            $(go.Shape, { toArrow: "None"},  
            { scale: 1.3, fill: "white" },
            new go.Binding("toArrow", "toArrow"),
            new go.Binding("fill", "toArrowColor"),
            new go.Binding("stroke", "strokecolor"),
            new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                return typeof val === 'number' ? val : parseInt(val) || 1; 
            }),
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
            { // Tooltip
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

export function addLinkTemplates(linkTemplateMap: string, contextMenu: any, myMetis: akm.cxMetis) {
    const linkTemplate1 = getLinkTemplate("", contextMenu, myMetis);  
    linkTemplateMap.add("linkTemplate1", linkTemplate1);
    addLinkTemplateName('linkTemplate1');

    const linkTemplate2 =      
        $(go.Link,
            new go.Binding("deletable"),
            { contextMenu: contextMenu },
            { selectable: true },
            { 
                toShortLength: 3, 
                relinkableFrom: true, 
                relinkableTo: true, 
                reshapable: true,
                resegmentable: true,  
            },
            // link route 
            { 
                routing: go.Link.AvoidsNodes,
                curve: go.Link.JumpGap,
                corner: 10,
                adjusting: go.Link.Stretch,
                reshapable: true, 
                resegmentable: true,
                relinkableFrom: true, 
                relinkableTo: true, 
                // isLayoutPositioned: false,  
                toEndSegmentLength: 20
            },  
            new go.Binding("points").makeTwoWay(),
            // link shape
            $(go.Shape, { stroke: "black", strokeWidth: 1, strokeDashArray: null, shadowVisible: true, },
            new go.Binding("stroke", "strokecolor"),
            new go.Binding("strokeWidth", "strokewidth"),
            new go.Binding("strokeDashArray", "dash", 
                function(d) { return setDashed(d); }),
            ),
            // the "from" arrowhead
            $(go.Shape, { fromArrow: "None"},
            { scale: 1.3, fill: "transparent" },
            new go.Binding("fromArrow", "fromArrow"),
            new go.Binding("fill", "fromArrowColor"),
            new go.Binding("stroke", "strokecolor"),
            new go.Binding("scale", "arrowscale").makeTwoWay(),
            ),
            // the "to" arrowhead
            $(go.Shape, { toArrow: "None"},  
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
              new go.Binding('segmentOffset', 'isDefault', function (s) {
                return s ? new go.Point(5, 0) : new go.Point(0, 0);
              }),
            // link label
            $(go.TextBlock,  "",
                {
                    isMultiline: true,  // allow newlines in text
                    editable: true,  // allow in-place editing by user
                },
                { segmentOffset: new go.Point(-10, -10) },
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
            
    linkTemplateMap.add("linkTemplate2", linkTemplate2);
    addLinkTemplateName('linkTemplate2');

    const annotationLinkTemplate =
        $(go.Link,
        {
            contextMenu: contextMenu,
            reshapable: true, 
            relinkableFrom: true, 
            relinkableTo: true,
            fromSpot: go.Spot.AllSides,
            toSpot: go.Spot.BottomSide,
            toEndSegmentLength: 20, // fromEndSegmentLength: 40
        },
        new go.Binding('points').makeTwoWay(),
        $(go.Shape, { stroke: 'black', strokeWidth: 1, strokeDashArray: [1, 3] }),
        $(go.Shape, { toArrow: 'OpenTriangle', scale: 1, stroke: 'black' }),
        // { segmentOffset: new go.Point(-10, -10) },
        new go.Binding("stroke", "textcolor").makeTwoWay(),
        new go.Binding("scale", "textscale").makeTwoWay(),
    );

    linkTemplateMap.add("AnnotationLink", annotationLinkTemplate);
    addLinkTemplateName('AnnotationLink');
    
    if (debug) console.log('1514 linkTemplateMap, linkTemplateNames', linkTemplateMap, linkTemplateNames);

    const sequenceLinkTemplate = 
        $(go.Link,
        {
          contextMenu: contextMenu,
          routing: go.Link.AvoidsNodes,
          corner: 10,
          // fromSpot: go.Spot.RightSide, 
          // toSpot: go.Spot.LeftSide,
          // toSpot: go.Spot.BottomSide,
          reshapable: true,
          relinkableFrom: true,
          relinkableTo: true,
          toEndSegmentLength: 0,
        },
        new go.Binding('points').makeTwoWay(),
        $(go.Shape, { stroke: 'black', strokeWidth: 1 }),
        $(go.Shape, { toArrow: 'Triangle', scale: 1.2, fill: 'black', stroke: null }),
        $(go.Shape,
          { fromArrow: '', scale: 1.5, stroke: 'black', fill: 'white' },
          new go.Binding('fromArrow', 'isDefault', function (s) {
            if (s === null) return '';
            return s ? 'BackSlash' : 'StretchedDiamond';
          }),
          new go.Binding('segmentOffset', 'isDefault', function (s) {
            return s ? new go.Point(5, 0) : new go.Point(0, 0);
          })
        ),
        $(go.TextBlock, "",
          {
            // this is a Link label
            isMultiline: true,  // allow newlines in text
            editable: true,
            segmentOffset: new go.Point(-10, -10),
          },
          new go.Binding('text', 'name').makeTwoWay(),
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
      linkTemplateMap.add("sequenceLinkTemplate", sequenceLinkTemplate);
      addLinkTemplateName('sequenceLinkTemplate');
  }

export function addGroupTemplates(groupTemplateMap: any, contextMenu: any, portContextMenu: any, myMetis: akm.cxMetis): any {
    const portSize = new go.Size(8, 8);
    const groupTemplate1 =
    $(go.Group, "Spot",
        {
            name: "GROUP",
            resizable: true, 
            minSize: getMinSize(),
            selectionAdorned: true,
            contextMenu: contextMenu,
            // Add padding to make room for shadow on right/bottom
            padding: new go.Margin(0, 6, 6, 0),
            // Make the entire group background linkable
            portId: "",
            fromLinkable: true, fromLinkableSelfNode: false, fromLinkableDuplicates: true,
            toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: true,
            cursor: "alias",
        },
        new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        //new go.Binding("layout", "groupLayout").makeTwoWay(),
        { // Tooltip
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
        groupTop2(contextMenu, 'Icon'),
    );   
    groupTemplateMap.add("", groupTemplate1);
    groupTemplateMap.add("Container1", groupTemplate1);
    addGroupTemplateName('Container1');

    // define a custom resize adornment that has two resize handles if the group is expanded
    groupTemplateMap.get("Container1").resizeAdornmentTemplate = addResizeAdornment("Container1");

    if (true) { // groupWithPorts
        const PORT_OUT_X = 4;
        const PORT_OUT_Y = 12;
        const PORT_ALIGN_X = 0;
        const groupWithPorts1 =
        $(go.Group, "Spot",
            {
                name: "GROUP",
                resizable: true, 
                minSize: getMinSize(),
                resizeObjectName: "SHAPE",
                selectionObjectName: "BODY",
                selectionAdorned: true,
                handlesDragDropForMembers: true,
                contextMenu: contextMenu,
                locationObjectName: 'SHAPE',
                locationSpot: go.Spot.Center,
                mouseDrop: function (e: go.InputEvent, grp: go.Group) {
                    finishDrop(e, grp);
                },
            },
            new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),
            // new go.Binding("isSelected", "isSelected").makeTwoWay(),
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("scale", "scale1").makeTwoWay(),
            // new go.Binding("layout", "groupLayout").makeTwoWay(),
            new go.Binding("background", "isHighlighted", function(h) { 
                    return h ? "rgba(255,0,0,0.2)" : "transparent"; 
                }).ofObject(),
            { // Tooltips
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
            groupTop2(contextMenu, 'Icon'),
            groupWithPortsSelectionPadding(PORT_OUT_X, PORT_OUT_Y),
            // And now the ports
            addLeftPorts(portContextMenu, PORT_ALIGN_X, 0),
            addTopPorts(portContextMenu, 0, -PORT_OUT_Y),
            addRightPorts(portContextMenu, -PORT_ALIGN_X, 0),
            addBottomPorts(portContextMenu, 0, PORT_OUT_Y),
        )
        groupTemplateMap.add("groupWithPorts", groupWithPorts1);
        addGroupTemplateName('groupWithPorts');      
        groupTemplateMap.add("groupWithIconAndPorts", groupWithPorts1);
        addGroupTemplateName('groupWithIconAndPorts');      
        groupTemplateMap.add("IDEF0", groupWithPorts1);
        addGroupTemplateName('IDEF0');      
        groupTemplateMap.get("groupWithPorts").resizeAdornmentTemplate = addResizeAdornment("groupWithPorts");
        groupTemplateMap.get("groupWithIconAndPorts").resizeAdornmentTemplate = addResizeAdornment("groupWithIconAndPorts");
        groupTemplateMap.get("IDEF0").resizeAdornmentTemplate = addResizeAdornment("IDEF0");
        
        const groupWithPorts2 =
        $(go.Group, "Spot",
            {
                name: "GROUP",
                resizable: true, 
                minSize: getMinSize(),
                resizeObjectName: "SHAPE",
                selectionObjectName: "BODY",
                selectionAdorned: true,
                handlesDragDropForMembers: true,
                contextMenu: contextMenu,
                locationObjectName: 'SHAPE',
                locationSpot: go.Spot.Center,
                mouseDrop: function (e: go.InputEvent, grp: go.Group) {
                    finishDrop(e, grp);
                },
            },
            new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),
            new go.Binding("isSelected", "isSelected").makeTwoWay(),
            // new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify()),
            new go.Binding("scale", "scale1").makeTwoWay(),
            new go.Binding("layout", "groupLayout").makeTwoWay(),
            new go.Binding("background", "isHighlighted", function(h) { 
                    return h ? "rgba(255,0,0,0.2)" : "transparent"; 
                }).ofObject(),
            { // Tooltips
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
            groupTop2(contextMenu, 'Geometry'),
            groupWithPortsSelectionPadding(PORT_OUT_X, PORT_OUT_Y),
            // And now the ports
            addLeftPorts(portContextMenu, PORT_ALIGN_X, 0),
            addTopPorts(portContextMenu, 0, -PORT_OUT_Y),
            addRightPorts(portContextMenu, -PORT_ALIGN_X, 0),
            addBottomPorts(portContextMenu, 0, PORT_OUT_Y),
        )
        groupTemplateMap.add("groupWithGeoAndPorts", groupWithPorts2);
        addGroupTemplateName('groupWithGeoAndPorts');    
        groupTemplateMap.get("groupWithGeoAndPorts").resizeAdornmentTemplate = addResizeAdornment("groupWithGeoAndPorts");  
        
        const groupWithPorts3 =
        $(go.Group, "Spot",
            {
                name: "GROUP",
                resizable: true, 
                minSize: getMinSize(),
                resizeObjectName: "SHAPE",
                selectionObjectName: "BODY",
                selectionAdorned: true,
                handlesDragDropForMembers: true,
                contextMenu: contextMenu,
                locationObjectName: 'SHAPE',
                locationSpot: go.Spot.Center,
                mouseDrop: function (e: go.InputEvent, grp: go.Group) {
                    finishDrop(e, grp);
                },
            },
            new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),
            new go.Binding("isSelected", "isSelected").makeTwoWay(),
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("scale", "scale1").makeTwoWay(),
            new go.Binding("layout", "groupLayout").makeTwoWay(),
            new go.Binding("background", "isHighlighted", function(h) { 
                    return h ? "rgba(255,0,0,0.2)" : "transparent"; 
                }).ofObject(),
            { // Tooltips
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
            groupTop2(contextMenu, 'Figure'),
            groupWithPortsSelectionPadding(PORT_OUT_X, PORT_OUT_Y),
            // And now the ports
            addLeftPorts(portContextMenu, PORT_ALIGN_X, 0),
            addTopPorts(portContextMenu, 0, -PORT_OUT_Y),
            addRightPorts(portContextMenu, -PORT_ALIGN_X, 0),
            addBottomPorts(portContextMenu, 0, PORT_OUT_Y),
        )
        groupTemplateMap.add("groupWithFigAndPorts", groupWithPorts3);
        addGroupTemplateName('groupWithFigAndPorts');    
        groupTemplateMap.get("groupWithFigAndPorts").resizeAdornmentTemplate = addResizeAdornment("groupWithFigAndPorts");  
    }

    if (true) { // groupWithoutPorts
        const groupWithoutPorts1 =
        $(go.Group, "Spot", 
            {
                name: "GROUP",
                resizable: true, 
                minSize: getMinSize(),
                resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
                selectionObjectName: "GROUP",  // selecting a custom part also selects the shape
                selectionAdorned: true,
                handlesDragDropForMembers: true,
                contextMenu: contextMenu,
                mouseDrop: function (e: go.InputEvent, grp: go.Group) {
                    finishDrop(e, grp);
                },
            },
            new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
            new go.Binding("layout", "groupLayout").makeTwoWay(),

            { // Tooltips
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
            groupTop2(contextMenu, 'Icon'),
        );
        groupTemplateMap.add("groupNoPorts", groupWithoutPorts1);
        addGroupTemplateName('groupNoPorts');        
        groupTemplateMap.get("groupNoPorts").resizeAdornmentTemplate = addResizeAdornment("groupNoPorts");

        groupTemplateMap.add("groupIconNoPorts", groupWithoutPorts1);
        addGroupTemplateName('groupIconNoPorts');        
    
        const groupWithoutPorts2 =
        $(go.Group, "Spot",
            {
                name: "GROUP",
                resizable: true, 
                minSize: getMinSize(),
                resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
                selectionObjectName: "GROUP",  // selecting a custom part also selects the shape
                selectionAdorned: true,
                handlesDragDropForMembers: true,
                contextMenu: contextMenu,
                mouseDrop: function (e: go.InputEvent, grp: go.Group) {
                    finishDrop(e, grp);
                },
            },
            new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
            new go.Binding("layout", "groupLayout").makeTwoWay(),

            { // Tooltips
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
            groupTop2(contextMenu, 'Geometry'),
        );
        groupTemplateMap.add("groupGeoNoPorts", groupWithoutPorts2);
        addGroupTemplateName('groupGeoNoPorts');        
        groupTemplateMap.get("groupGeoNoPorts").resizeAdornmentTemplate = addResizeAdornment("groupGeoNoPorts");

        const groupWithoutPorts3 =
        $(go.Group, "Spot",
            {
                name: "GROUP",
                resizable: true, 
                minSize: getMinSize(),
                resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
                selectionObjectName: "GROUP",  // selecting a custom part also selects the shape
                selectionAdorned: true,
                handlesDragDropForMembers: true,
                contextMenu: contextMenu,
                mouseDrop: function (e: go.InputEvent, grp: go.Group) {
                    finishDrop(e, grp);
                },
            },
            new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
            new go.Binding("layout", "groupLayout").makeTwoWay(),

            { // Tooltips
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
            groupTop2(contextMenu, 'Figure'),
        );

        groupTemplateMap.add("groupFigNoPorts", groupWithoutPorts3);
        addGroupTemplateName('groupFigNoPorts');        
        groupTemplateMap.get("groupFigNoPorts").resizeAdornmentTemplate = addResizeAdornment("groupFigNoPorts");
    }

    function groupStyle() {  // common settings for both Lane and Pool Groups
        return [
        {
            // layerName: 'Background',  // all pools and lanes are always behind all nodes and links
            background: 'transparent',  // can grab anywhere in bounds
            movable: true, // allows users to re-order by dragging
            copyable: false,  // can't copy lanes or pools
            avoidable: false  // don't impede AvoidsNodes routed Links
        },
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify)
        ];
    }

    if (true) { // laneTemplate
        // each Group is a "swimlane" with a header on the left and a resizable lane on the right
        const laneTemplate = 
        $(go.Group, "Horizontal", groupStyle(),
        {
            name: "GROUP",
            // Keep selection outline + resize handles aligned with the full lane (header + body).
            selectionObjectName: "LANE_MAIN_SHAPE",
            resizeObjectName: "LANE_MAIN_SHAPE",
            resizable: true, 
            minSize: getMinSize(),
            selectionAdorned: true,
            // Make "loc" represent the top-left of the whole lane (header + body),
            // so pool layout can align lane headers flush to the pool header separator.
            locationObjectName: "LANE_MAIN",
            locationSpot: go.Spot.TopLeft,
            computesBoundsAfterDrag: true,
            computesBoundsIncludingLinks: false,
            computesBoundsIncludingLocation: true,
            handlesDragDropForMembers: true,
            contextMenu: contextMenu,
        },
        new go.Binding("isSubGraphExpanded", "expanded").makeTwoWay(),
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        // NOTE: `data.size` is the lane BODY size and is bound on `LANE_BODY_SHAPE`.
        // Binding it to the whole Group causes the Group's bounds/selection/drag math to disagree with visuals.
        // the lane header consisting of a Shape and a TextBlock
        new go.Binding("layout", "groupLayout").makeTwoWay(),
        { // Tooltip
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
        laneTop(contextMenu, 'Icon', 1),
        );   
        groupTemplateMap.add("Lane", laneTemplate);
        addGroupTemplateName('Lane');
        // define a custom resize adornment bigger
        groupTemplateMap.get("Lane").resizeAdornmentTemplate = addResizeAdornment("Lane");
  
        const laneTemplate2 = 
        $(go.Group, "Horizontal", groupStyle(),
        {
            name: "GROUP",
            // Keep selection outline + resize handles aligned with the full lane (header + body).
            selectionObjectName: "LANE_MAIN_SHAPE",
            resizeObjectName: "LANE_MAIN_SHAPE",
            resizable: true, 
            minSize: getMinSize(),
            selectionAdorned: true,
            padding: new go.Margin(0, 0, 0, 0),
            locationObjectName: "LANE_MAIN",
            locationSpot: go.Spot.TopLeft,
            computesBoundsAfterDrag: true,
            computesBoundsIncludingLinks: false,
            computesBoundsIncludingLocation: true,
            handlesDragDropForMembers: true,
            contextMenu: contextMenu,
        },
        new go.Binding("isSubGraphExpanded", "expanded").makeTwoWay(),
        // new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding("location", "loc", go.Point.parse)
            .makeTwoWay(pt => `${pt.x} ${pt.y}`),
        // NOTE: `data.size` is the lane BODY size and is bound on `LANE_BODY_SHAPE`.
        // Binding it to the whole Group causes the Group's bounds/selection/drag math to disagree with visuals.
        // the lane header consisting of a Shape and a TextBlock
        new go.Binding("layout", "groupLayout").makeTwoWay(),
        { // Tooltip
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
        laneTop(contextMenu, 'Icon', 1),
        );   
    }
    
    if (true) { // poolTemplate
        const poolTemplate =
        $(go.Group, "Auto",
            {
                resizable: true,
                minSize: getMinSize(),
                contextMenu: contextMenu,
                selectionAdorned: true,
                locationSpot: go.Spot.TopLeft,
                mouseDrop: function (e: go.InputEvent, grp: go.Group) {
                    const diagram = e.diagram;
                    const dragged = diagram.selection;
                    let hasLane = false;
                    let valid = true;
                    dragged.each((part: go.Part) => {
                        if (!(part instanceof go.Group)) {
                            valid = false;
                            return;
                        }
                        const isLane =
                            part.data?.category === "Lane" ||
                            part.data?.category === "Lane_w_handles" ||
                            part.data?.template === "Lane" ||
                            part.data?.template === "Lane_w_handles";
                        if (!isLane) {
                            valid = false;
                            return;
                        }
                        hasLane = true;
                    });
                    if (!valid || !hasLane) {
                        diagram.currentTool.doCancel();
                        return;
                    }
                    const ok = grp.addMembers(dragged, true);
                    if (!ok) {
                        diagram.currentTool.doCancel();
                        return;
                    }
                    const modelview = myMetis.currentModelview;
                    dragged.each((part: go.Part) => {
                        if (!(part instanceof go.Group)) return;
                        const laneOv = modelview?.findObjectView(part.data?.key);
                        if (!laneOv) return;
                        laneOv.group = grp.data?.key;
                        laneOv.loc = part.data?.loc ? String(part.data.loc) : `${part.location.x} ${part.location.y}`;
                        if (part.data?.size) laneOv.size = part.data.size;
                        const jsnLaneOv = new jsn.jsnObjectView(laneOv);
                        const data = JSON.parse(JSON.stringify(jsnLaneOv));
                        diagram.dispatch({ type: "UPDATE_OBJECTVIEW_PROPERTIES", data });
                    });
                    const poolOv = modelview?.findObjectView(grp.data?.key);
                    if (poolOv?.isGroup) {
                        uid.doGroupLayout(poolOv, diagram, myMetis);
                    }
                },
            },
            new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
            new go.Binding("layout", "groupLayout").makeTwoWay(),
            
            { // Tooltip
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
            poolTop(contextMenu, 'Icon', 1.2),
        );
        groupTemplateMap.add("Pool", poolTemplate);
        addGroupTemplateName('Pool');

        // define a custom resize adornment that has two resize handles if the group is expanded
        groupTemplateMap.get("Pool").resizeAdornmentTemplate = addResizeAdornment("Lane");
    } 
}

export function addPortTemplates() {
    // define the Node template for each attribute in the nodeDataArray
}


// Helper functions to provide default color if none specified and icons ----------------------------------------------------------------------------

function defaultStrokeColor(strokecolor2) {
    if (debug) console.log("3567 defaultStrokeColor: ", strokecolor2);
    return  (strokecolor2 === "") ? "#466" : strokecolor2; // Dark bluegreen default, or custom color
}

function decodeUnicodeGlyph(value: string): string {
    if (!value) return "";

    const normalized = value.trim();
    const lowerMatch = normalized.match(/^\\u(?:\{([0-9a-fA-F]{1,6})\}|([0-9a-fA-F]{4,6}))$/);
    const upperMatch = normalized.match(/^\\U(?:\{([0-9a-fA-F]{1,8})\}|([0-9a-fA-F]{6,8}))$/);

    if (lowerMatch || upperMatch) {
        let hex = (lowerMatch && (lowerMatch[1] || lowerMatch[2])) || (upperMatch && (upperMatch[1] || upperMatch[2])) || "";
        if (!hex) return "";

        if (hex.length === 5 && /^ff/i.test(hex)) {
            const adjusted = hex.slice(1);
            if (debug) console.log("decodeUnicodeGlyph - normalizing legacy FontAwesome code from", hex, "to", adjusted);
            hex = adjusted;
        }

        const codePoint = parseInt(hex, 16);
        if (Number.isNaN(codePoint)) return "";

        try {
            return String.fromCodePoint(codePoint);
        } catch (err) {
            console.warn("decodeUnicodeGlyph failed", value, err);
            return "";
        }
    }

    const glyphs = Array.from(normalized);
    return glyphs.length > 0 ? glyphs[0] : "";
}

// Helper function to detect icon format from string content
// Returns: 'unicode' | 'url' | 'shape' | 'library' | 'unknown'
export function detectIconFormat(value: string): string {
  if (!value) return 'unknown';

    const unicodeEscapeMatch = value.match(/^\\u(?:\{[0-9a-fA-F]{1,6}\}|[0-9a-fA-F]{4,6})$/);
    const unicodeEmojiMatch = value.match(/^\\U(?:\{[0-9a-fA-F]{1,8}\}|[0-9a-fA-F]{6,8})$/);
    const figureMatch = value.match(/^[a-zA-Z]+(\/[a-zA-Z0-9_\-]+)+$/);

    if (unicodeEscapeMatch || unicodeEmojiMatch) {
        if (debug) console.log("detectIconFormat - detected as unicode escape sequence", value);
        return 'unicode';
    }

    if (Array.from(value).length === 1 && value.charCodeAt(0) > 127) {
        if (debug) console.log("detectIconFormat - detected as single unicode char", value);
        return 'unicode';
    }

    if (Array.from(value).length > 1 && value.charCodeAt(0) > 127) {
        if (debug) console.log("detectIconFormat - detected as multi-byte unicode", value);
        return 'unicode';
    }
    if (figureMatch) {
        if (debug) console.log("detectIconFormat - detected as figure/shape", value);
        return 'unicode';
    }

  // Check if it's an SVG data URL
  if (value.startsWith('data:image/svg+xml')) {
        if (debug) console.log("detectIconFormat - detected as svg data url");
    return 'svg';
  }
  
  // Check if it's a URL (http:// or https://)
  if (value.startsWith('http://') || value.startsWith('https://')) {
        if (debug) console.log("detectIconFormat - detected as url");
    return 'url';
  }
  
  // Check if it's a GoJS figure/shape (contains / or \ suggesting a path or figure name)
  // But NOT if it's a Unicode escape sequence (already checked above)
  if (value.includes('/') || (value.includes('\\') && !value.match(/^\\[uU]/))) {
        if (debug) console.log("detectIconFormat - detected as shape");
    return 'shape';
  }
  
  // Otherwise it's likely a library icon name or file name
    if (debug) console.log("detectIconFormat - detected as library", value);
  return 'library';
}

// Function to render icon from unified icon field with format detection
export function getIconSource(iconValue: any): string {
  // Handle both cases: if called from binding with string value, or with object
  let value = iconValue;
  
  // If it's an object with an icon property, extract the icon value
  if (iconValue && typeof iconValue === 'object' && iconValue.icon) {
    value = iconValue.icon;
  }
  
  if (!value) {
    return "";
  }
  
    const format = detectIconFormat(value);
    if (debug) console.log("getIconSource called with value:", value, "format:", format);
  
  if (format === 'unicode') {
        const glyph = decodeUnicodeGlyph(typeof value === 'string' ? value : String(value));
        if (!glyph) {
            if (debug) console.warn("getIconSource - unable to decode unicode glyph for", value);
            return "";
        }

        const escapeForXml = (input: string) =>
            input
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

        const escapedGlyph = escapeForXml(glyph);

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                        <defs>
                                <style type="text/css">
                                        text {
                                                font-size: 24px;
                                                font-family: 'Font Awesome 6 Free','Font Awesome 6 Pro','Font Awesome 6 Brands','Font Awesome 5 Free','Font Awesome 5 Pro','Font Awesome 5 Brands','FontAwesome','Font Awesome','FontAwesome5Free','FontAwesome6Free','Segoe MDL2 Assets','Material Icons','Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji','EmojiOne Color','Noto Emoji','Segoe UI Symbol','Helvetica','Arial',sans-serif;
                                                font-weight: 900;
                                                font-style: normal;
                                                text-anchor: middle;
                                                dominant-baseline: central;
                                                fill: currentColor;
                                        }
                                </style>
                        </defs>
                        <text x="50%" y="50%" dominant-baseline="central" alignment-baseline="central">${escapedGlyph}</text>
                </svg>`;
    
    // Use base64 encoding for better Unicode support
    // This helper function properly encodes UTF-8 to base64
    const utf8_btoa = (str: string) => {
      try {
    // Use TextEncoder to properly handle UTF-8 encoding including emoji
        const encoder = new TextEncoder();
        const uint8array = encoder.encode(str);
        let binaryString = '';
        for (let i = 0; i < uint8array.byteLength; i++) {
          binaryString += String.fromCharCode(uint8array[i]);
        }
        return btoa(binaryString);
      } catch (e) {
        console.warn("TextEncoder failed, trying fallback for value:", value);
                try {
                    return btoa(unescape(encodeURIComponent(str)));
                } catch (e2) {
                    console.warn("All encoding methods failed for:", value, e2);
                    return "";
                }
      }
    };
    
    const btoa_svg = utf8_btoa(svg);
    if (!btoa_svg) {
      console.error("Failed to encode SVG for icon:", value);
      return "";
    }
    const result = `data:image/svg+xml;base64,${btoa_svg}`;
        if (debug) console.log("getIconSource - generated SVG data URL for:", value, "glyph:", glyph, "codePoint:", glyph.codePointAt(0), "result length:", result.length);
    return result;
  } else if (format === 'svg') {
    // SVG data URL - wrap in a viewBox container to ensure proper scaling and centering
    // This ensures the SVG fits within the icon frame
    if (value.startsWith('data:image/svg+xml;base64,')) {
            if (debug) console.log("getIconSource - SVG data URL detected, wrapping for proper scaling");
      return value; // SVG data URLs already contain the full image data
    }
    return value;
  } else if (format === 'url') {
    // URL format - return as-is
    return value;
  } else if (format === 'shape') {
    // Shape/path format - return as-is
    return value;
  } else if (format === 'figure') {
    // Figure format - return as-is
    return makeFigureImage(value);
  } else {
    // Library icon name - use existing findImage logic
    return findImage(value);
  }
}

// Function to create icon glyph panel with picture and unicode fallback
export function makeIconGlyph(
    pictureOverrides: Partial<go.Picture> = {},
    unicodeOverrides: Partial<go.TextBlock> = {}
) {
    return $(go.Panel, "Spot",
        $(go.Picture,
            {
                name: "Picture",
                desiredSize: new go.Size(48, 48),
                stretch: go.GraphObject.Fill,
                imageStretch: go.GraphObject.Fill,
                alignment: go.Spot.Center,
                ...pictureOverrides,
            },
            new go.Binding("source", "icon", getIconSource),
            // allow icon background color via fillcolor2
            new go.Binding("background", "fillcolor2"),
            new go.Binding("visible", "icon", shouldShowIconPicture),
        ),
        $(go.TextBlock, textStyle(),
            {
                alignment: go.Spot.Center,
                desiredSize: new go.Size(48, 36),
                textAlign: "center",
                background: "transparent",
                font: "bold 38px 'Font Awesome 6 Free','Font Awesome 6 Pro','Font Awesome 6 Brands','Font Awesome 5 Free','Font Awesome 5 Pro','Font Awesome 5 Brands','FontAwesome','Font Awesome','FontAwesome5Free','FontAwesome6Free','Segoe UI Emoji','Apple Color Emoji','Segoe UI Symbol','Noto Color Emoji','Helvetica','Arial',sans-serif",
                editable: false,
                isMultiline: false,
                ...unicodeOverrides,
            },
            new go.Binding("stroke", "textcolor2", defaultStrokeColor),
            new go.Binding("text", "icon", findUnicodeImage),
            new go.Binding("visible", "icon", shouldShowUnicodeFallback),
        ),
    );
}
// Function to identify images related to an image id
export function findImage(image: string) {
    if (debug) console.log("458 findImage: ", image);
    if (image == "")
         return "";
    if (image?.includes('//')) { // this is an http:// or https:// image
        if (debug) console.log('3249 Diagram', image);
        return image;
    } else if (image?.includes('/')) { // its a local image with path i.e. /images/...
        if (debug) console.log('3250 Diagram', image);   
        return image;
    } else if (image?.startsWith('<i ')) { // its an awesome font image
        const img = image //{image:'data:image/svg+xml;charset=UTF-8,image'}
        if (debug) console.log('3244', img);
        return img;
    } else if (image?.includes('<svg')) { // its an svg code image
        const img = {image:'data:image/svg+xml;charset=UTF-8,image'}
        if (debug) console.log('3269', img);
        return img
    } else if (!image?.includes('images/') && image?.includes('.png')) { // its an image in public/images 
        const img = "./../images/types/" + image;
        if (debug) console.log('3273 Diagram', image, img)
        return img;
    } else {
        return "" // default no image
    }
}

export function shouldShowIconPicture(icon: string) {
    if (!icon) return false; 
    return detectIconFormat(icon) !== "unicode";
}

export function shouldShowUnicodeFallback(icon: string) {
    if (!icon) return false;
    return detectIconFormat(icon) === "unicode";
}

export function findUnicodeImage(image: string) {
    if (!image) return "";

    if (detectIconFormat(image) !== "unicode") return "";

    let char = "";

    try {
        char = decodeUnicodeGlyph(image);
    } catch (err) {
        console.warn("findUnicodeImage failed to parse", image, err);
        return "";
    }

    if (!char) return "";

    return char;
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
        let tool = grp.diagram.toolManager.draggingTool;
        let map = tool.draggedParts || tool.copiedParts;  // this is a Map
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

function defaultColor(horiz) {  // a Binding conversion function
return horiz ? "rgba(255, 221, 51, 0.55)" : "rgba(51,211,229, 0.5)";
}

function defaultFont(horiz) {  // a Binding conversion function
return horiz ? "bold 20px sans-serif" : "bold 16px sans-serif";
}

function getParentMemberScale(grp: go.Group | null): number {
    if (!grp) return 1;
    const data: any = grp.data || {};
    const raw =
        data?.memberscale ??
        data?.objectview?.memberscale ??
        data?.typeview?.memberscale ??
        1;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getAncestorMemberScaleProduct(grp: go.Group | null): number {
    let current = grp;
    let product = 1;
    while (current instanceof go.Group) {
        product *= getParentMemberScale(current);
        current = current.containingGroup;
    }
    return product;
}

function isGroupLikePart(part: go.Part | null | undefined): boolean {
    const data: any = part?.data || {};
    const templateName = String(data?.template || data?.category || "");
    return Boolean(
        part instanceof go.Group ||
        data?.isGroup === true ||
        data?.objectview?.isGroup === true ||
        templateName.startsWith("group")
    );
}

function applyDroppedGroupScale(diagram: go.Diagram, grp: go.Group | null) {
    if (!diagram) return;
    const inheritedScale = getAncestorMemberScaleProduct(grp);
    diagram.selection.each((part: go.Part) => {
        if (!(part instanceof go.Node)) return;
        const data: any = part.data || {};
        let nextScale = inheritedScale;
        if (grp && isGroupLikePart(part)) {
            const parentSize =
                grp.data?.size instanceof go.Size
                    ? grp.data.size
                    : go.Size.parse(grp.data?.size || `${grp.actualBounds.width} ${grp.actualBounds.height}`);
            const childWidth = Math.max(1, parentSize.width / 2);
            const childHeight = Math.max(1, parentSize.height / 2);
            const childSize = `${childWidth} ${childHeight}`;
            const resizeObj = part.resizeObject || part.reshapeObject || part;
            try {
                resizeObj.desiredSize = new go.Size(childWidth, childHeight);
            } catch (_) {}
            data.size = childSize;
            data.desiredSize = childSize;
            try { diagram.model.setDataProperty(data, "size", childSize); } catch (_) {}
            try { diagram.model.setDataProperty(data, "desiredSize", childSize); } catch (_) {}
        }
        part.scale = nextScale;
        data.scale = nextScale;
        data.scale1 = nextScale;
        const currentObjectview = data.objectview;
        const nextObjectview = currentObjectview ? new jsn.jsnObjectView(currentObjectview) : null;
        if (nextObjectview) {
            nextObjectview.scale = nextScale;
            data.objectview = nextObjectview;
        }
        try { diagram.model.setDataProperty(data, "scale", nextScale); } catch (_) {}
        try { diagram.model.setDataProperty(data, "scale1", nextScale); } catch (_) {}
        if (nextObjectview) {
            try { diagram.model.setDataProperty(data, "objectview", nextObjectview); } catch (_) {}
        }
    });
    try { diagram.updateAllTargetBindings(); } catch (_) {}
    try { diagram.requestUpdate(); } catch (_) {}
}

// Upon a drop onto a Group, we try to add the selection as members of the Group.
// Upon a drop onto the background, or onto a top-level Node, make selection top-level.
// If this is OK, we're done; otherwise we cancel the operation to rollback everything.
function finishDrop(e, grp) {
    let ok = (grp !== null
        ? grp.addMembers(grp.diagram.selection, true)
        : e.diagram.commandHandler.addTopLevelParts(e.diagram.selection, true));
    if (!ok) {
        e.diagram.currentTool.doCancel();
        return;
    }
    applyDroppedGroupScale(e.diagram, grp);
}

// TESTING TESTING TESTING
// if (false) {
//     function findPortNode(g, name, input) {
//         for (let it = g.memberParts; it.next();) {
//             let n = it.value;
//             if (n instanceof go.Link) continue;
//             if (n.data.name === name && n.data._in === input) return n;
//         }
//         return null;
//         }
        
        
//     // Generate a random number of nodes, including groups.
//     // If a group's key is given as a parameter, put these nodes inside it
//     function randomGroup(group, myDiagram) {
//         // all modification to the diagram is within this transaction
//         myDiagram.startTransaction("addGroupContents");
//         let addedKeys = [];  // this will contain the keys of all nodes created
//         let groupCount = 0;  // the number of groups in the diagram, to determine the numbers in the keys of new groups
//         myDiagram.nodes.each(function(node) {
//             if (node instanceof go.Group) groupCount++;
//         });
//         // create a random number of groups
//         // ensure there are at least 10 groups in the diagram
//         let groups = Math.floor(Math.random() * 2);
//         if (groupCount < 10) groups += 1;
//         for (let i = 0; i < groups; i++) {
//             let name = "group" + (i + groupCount);
//             myDiagram.model.addNodeData({ key: name, isGroup: true, group: group });
//             addedKeys.push(name);
//         }
//         let nodes = Math.floor(Math.random() * 3) + 2;
//         // create a random number of non-group nodes
//         for (let i = 0; i < nodes; i++) {
//             let color = go.Brush.randomColor();
//             // make sure the color, which will be the node's key, is unique in the diagram before adding the new node
//             if (myDiagram.findPartForKey(color) === null) {
//             myDiagram.model.addNodeData({ key: color, group: group });
//             addedKeys.push(color);
//             }
//         }
//         // add at least one link from each node to another
//         // this could result in clusters of nodes unreachable from each other, but no lone nodes
//         let arr = [];
//         for (let x in addedKeys) arr.push(addedKeys[x]);
//         arr.sort(function(x, y) { return Math.random() - 1; });
//         for (let i = 0; i < arr.length; i++) {
//             let from = Math.floor(Math.random() * (arr.length - i)) + i;
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

//         let portSpacing = 2;
//         let iconAreaWidth = 60;

//         // compute the counts and areas of the inputs and the outputs
//         let left = 0;
//         let leftwidth = 0;  // max
//         let leftheight = 0; // total
//         let right = 0;
//         let rightwidth = 0;  // max
//         let rightheight = 0; // total
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

//         let loc = new go.Point(0, 0);
//         if (this.group !== null && this.group.location.isReal()) loc = this.group.location;

//         // first lay out the left side, the inputs
//         let y = loc.y - leftheight / 2;
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
//             let icon = this.group.findObject("ICON");
//             if (icon !== null) icon.desiredSize = new go.Size(iconAreaWidth + leftwidth / 2 + rightwidth / 2, Math.max(leftheight, rightheight) + 10);
//         }
//     };
// }
function InputOutputGroupLayout() {
    go.Layout.call(this);
}

InputOutputGroupLayout.prototype = Object.create(go.Layout.prototype);
InputOutputGroupLayout.prototype.constructor = InputOutputGroupLayout;

InputOutputGroupLayout.prototype.doLayout = function(coll) {
    coll = this.collectParts(coll);

    let portSpacing = 2;
    let iconAreaWidth = 60;

    // compute the counts and areas of the inputs and the outputs
    let left = 0;
    let leftwidth = 0;  // max
    let leftheight = 0; // total
    let right = 0;
    let rightwidth = 0;  // max
    let rightheight = 0; // total
    coll.each(function(n) {
        if (n instanceof go.Link) return;  // ignore Links
        if (n.data._in) {
        left++;
        leftwidth = Math.max(leftwidth, n.actualBounds.width);
        leftheight += n.actualBounds.height;
        } else {
        right++;
        rightwidth = Math.max(rightwidth, n.actualBounds.width);
        rightheight += n.actualBounds.height;
        }
    });
    if (left > 0) leftheight += portSpacing * (left - 1);
    if (right > 0) rightheight += portSpacing * (right - 1);

    let loc = new go.Point(0, 0);
    if (this.group !== null && this.group.location.isReal()) loc = this.group.location;

    // first lay out the left side, the inputs
    let y = loc.y - leftheight / 2;
    coll.each(function(n) {
        if (n instanceof go.Link) return;  // ignore Links
        if (!n.data._in) return;  // ignore outputs
        n.position = new go.Point(loc.x - iconAreaWidth / 2 - leftwidth, y);
        y += n.actualBounds.height + portSpacing;
    });

    // now the right side, the outputs
    y = loc.y - rightheight / 2;
    coll.each(function(n) {
        if (n instanceof go.Link) return;  // ignore Links
        if (n.data._in) return;  // ignore inputs
        n.position = new go.Point(loc.x + iconAreaWidth / 2 + rightwidth - n.actualBounds.width, y);
        y += n.actualBounds.height + portSpacing;
    });

    // then position the group and size its icon area
    if (this.group !== null) {
        // position the group so that its ICON is in the middle, between the "ports"
        this.group.location = loc;
        // size the ICON so that it's wide enough to overlap the "ports" and tall enough to hold all of the "ports"
        let icon = this.group.findObject("ICON");
        if (icon !== null) icon.desiredSize = new go.Size(iconAreaWidth + leftwidth / 2 + rightwidth / 2, Math.max(leftheight, rightheight) + 10);
    }
};
