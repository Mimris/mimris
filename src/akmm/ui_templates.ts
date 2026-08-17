// @ts-nocheck
const debug = false; 

import * as go from 'gojs';
import * as uid from './ui_diagram';
import * as akm from './metamodeller';
import * as jsn from './ui_json';
import * as constants from './constants';
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
        return go.Link.Normal;ƒ
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
    new go.Binding("source", "icon", findImage),
    {
            name: "Picture",
            column: 2, 
            margin: new go.Margin(2, 0, 0, 0),
            desiredSize: new go.Size(25, 25),
            alignment: go.Spot.Right,
        },
        new go.Binding("visible", "isSubGraphExpanded").ofObject(),
    )                                
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
    return $(go.Picture,  // the image -------------------------------------
        new go.Binding("source", "image", findImage),
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

function makeIconImage() {
    return $(go.Picture,  // the image -------------------------------------
        new go.Binding("source", "icon", findImage),
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
    // With ports
    return $(go.Panel, "Auto",
        {
            row: 1, 
            column: 1, 
            name: "BODY",
            stretch: go.GraphObject.Fill
        },
        $(go.Shape, "RoundedRectangle", // surrounds everything
            {
                cursor: "alias",
                fill: "white", 
                shadowVisible: true,
                minSize: new go.Size(160, 65),
                portId: "", 
                fromLinkable: true, fromLinkableSelfNode: false, fromLinkableDuplicates: true,
                toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: true,
            },
            new go.Binding("fill", "fillcolor"),
            new go.Binding("stroke", "strokecolor"),
        ),
        $(go.Panel, "Vertical",  // position header above the subgraph
        {
            name: "HEADER", 
            defaultAlignment: go.Spot.TopLeft, 
        },
        $(go.Panel, "Table",  // the header
            {
                contextMenu: contextMenu , 
                cursor: "move",
                stretch: go.GraphObject.Horizontal,
            },
            $("SubGraphExpanderButton",
                {
                    column: 0, 
                    margin: new go.Margin(-2, 2, 2, 0),
                    alignment: go.Spot.Left,
                    scale: 1.2,
                },
            ),  
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
                    margin: new go.Margin(0, 0, 0, 10), 
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
            $(go.TextBlock, textStyle(),  // the name - closed container  -----------------------
            {
                row: 0, 
                column: 1, 
                isMultiline: false,  // don't allow newlines in text
                maxLines: 1,
                editable: true,  // allow in-place editing by user
                font: "Bold 28pt Sans-Serif",
                textAlign: "left",
                alignment: go.Spot.Left,
                margin: new go.Margin(0, 0, 0, 10),
                wrap: go.TextBlock.None,
                overflow: go.TextBlock.OverflowEllipsis,
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
                row: 2,
                stretch: go.GraphObject.Fill,
                isMultiline: false,
                editable: false,
                minSize: new go.Size(10, 4),
                margin: new go.Margin(0, 0, 0, 2), 
                textAlign: "left",
                cursor: "move", 
            },
            new go.Binding("text", "typename")
            ),  
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
        },
        $(go.Shape, "RoundedRectangle", // surrounds everything
            {
                cursor: "alias",
                fill: "white", 
                shadowVisible: true,
                minSize: new go.Size(160, 65),
                portId: "", 
                fromLinkable: true, fromLinkableSelfNode: false, fromLinkableDuplicates: true,
                toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: true,
            },
            new go.Binding("fill", "fillcolor"),
            new go.Binding("stroke", "strokecolor"),
        ),
        $(go.Shape, "RoundedRectangle", // Inner shape for moving
            {
                cursor: "move",
                // fill: "transparent", 
                stroke: "transparent",
                margin: new go.Margin(30, 12, 12, 12),
                minSize: new go.Size(150, 55),
                stretch: go.GraphObject.Fill,
            },
            new go.Binding("fill", "fillcolor"),
            new go.Binding("stroke", "strokecolor"),
        ),

        $(go.Panel, "Table",  // position header above the subgraph
            {
                stretch: go.GraphObject.Fill,
                defaultAlignment: go.Spot.TopLeft
            },            
            $(go.RowColumnDefinition, { row: 0, sizing: go.RowColumnDefinition.None }),
            $(go.Panel, "Table",  // the header
                    {
                        row: 0,
                        contextMenu: contextMenu , 
                        cursor: "move",
                        stretch: go.GraphObject.Horizontal,
                    },
                $(go.RowColumnDefinition, { column: 0, sizing: go.RowColumnDefinition.None }),
                $("SubGraphExpanderButton",
                    {
                        column: 0, 
                        margin: new go.Margin(-2, 2, 2, 0), 
                        alignment: go.Spot.Left,
                        scale: 1.5,
                    },
                ),  
                $(go.TextBlock, textStyle(),  // the name - open container  -----------------------
                {
                    row: 0, 
                    column: 1, 
                    isMultiline: false,  // don't allow newlines in text
                    maxLines: 1,
                    editable: true,  // allow in-place editing by user
                    font: "Bold 14pt Sans-Serif",
                    textAlign: "left",
                    alignment: go.Spot.Left,
                    margin: new go.Margin(0, 0, 0, 10),
                    wrap: go.TextBlock.None,
                    overflow: go.TextBlock.OverflowEllipsis,
                    name: "name"
                },        
                new go.Binding("fill", "fillcolor"),
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("stroke", "textcolor").makeTwoWay(),
                new go.Binding("visible", "isSubGraphExpanded").ofObject(),
                ),
                $(go.TextBlock, textStyle(),  // the name - closed container  -----------------------
                {
                    row: 0, 
                    column: 1, 
                    isMultiline: false,  // don't allow newlines in text
                    maxLines: 1,
                    editable: true,  // allow in-place editing by user
                    font: "Bold 28pt Sans-Serif",
                    textAlign: "left",
                    alignment: go.Spot.Left,
                    margin: new go.Margin(0, 0, 0, 10),
                    wrap: go.TextBlock.None,
                    overflow: go.TextBlock.OverflowEllipsis,
                    name: "name",
                },        
                new go.Binding("fill", "fillcolor"),
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("stroke", "textcolor").makeTwoWay(),
                new go.Binding('visible', 'isSubGraphExpanded', 
                    function (e) { return !e; }).ofObject(),
                ),
                makeNotation(notation),
            ), // End Panel
            $(go.Shape,  // using a Shape instead of a Placeholder 
                //This is open container - showing the content
                {
                    row: 1,
                    stretch: go.GraphObject.Fill,
                    fill: "rgba(128,128,128,0.33)",
                    stroke: "black",
                    opacity: 0.75,
                    margin: new go.Margin(1, 4, 1, 4),
                    cursor: "move",
                },
                new go.Binding("fill", "fillcolor2"),
                new go.Binding("visible", "isSubGraphExpanded").ofObject(),
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

            $(go.RowColumnDefinition, { row: 2, sizing: go.RowColumnDefinition.None }),
            $(go.TextBlock, textStyle(), // the typename  --------------------
                {
                    row: 2, 
                    stretch: go.GraphObject.Horizontal,
                    isMultiline: false,
                    editable: false,
                    minSize: new go.Size(10, 2),
                    margin: new go.Margin(0, 0, 0, 0), 
                    cursor: "move", 
                },
                new go.Binding("text", "typename"),
            ), // End TextBlock
        ),
    );
}

export function groupTop3(contextMenu: any, notation: string, textscale: number) {
    // Without ports
    return $(go.Panel, "Auto",
        {
            row: 1, 
            column: 1, 
            name: "BODY",
            stretch: go.GraphObject.Fill,
        },
        $(go.Shape, "RoundedRectangle", // surrounds everything
            {
                cursor: "alias",
                fill: "white", 
                shadowVisible: true,
                minSize: new go.Size(160, 65),
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
                margin: new go.Margin(30, 12, 12, 12),
                minSize: new go.Size(150, 55),
                stretch: go.GraphObject.Fill,
            },
        ),
        $(go.Panel, "Table",  // position header above the subgraph
            {
                stretch: go.GraphObject.Fill,
                defaultAlignment: go.Spot.TopLeft
            },            
            $(go.RowColumnDefinition, { row: 0, sizing: go.RowColumnDefinition.None }),
            $(go.Panel, "Table",  // the header
                    {
                        row: 0,
                        contextMenu: contextMenu , 
                        cursor: "move",
                        stretch: go.GraphObject.Horizontal,
                    },
                $(go.RowColumnDefinition, { column: 0, sizing: go.RowColumnDefinition.None }),
                $("SubGraphExpanderButton",
                    {
                        column: 0, 
                        angle: 270,
                        margin: new go.Margin(10, 2, 2, 2), 
                        alignment: go.Spot.Center,
                        scale: 1.5,
                    },
                ),  
                $(go.TextBlock, textStyle(),  // the name - open container  -----------------------
                {
                    row: 1, 
                    column: 0, 
                    angle: 270,
                    scale: textscale,
                    isMultiline: false,  // don't allow newlines in text
                    maxLines: 1,
                    editable: true,  // allow in-place editing by user
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
                new go.Binding("stroke", "strokecolor").makeTwoWay(),
                new go.Binding("visible", "isSubGraphExpanded").ofObject(),
                ),
                $(go.TextBlock, textStyle(),  // the name - closed container  -----------------------
                {
                    row: 0, 
                    column: 1, 
                    scale: textscale * 1.5,
                    isMultiline: false,  // don't allow newlines in text
                    maxLines: 1,
                    editable: true,  // allow in-place editing by user
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
                new go.Binding("stroke", "strokecolor").makeTwoWay(),
                new go.Binding('visible', 'isSubGraphExpanded', 
                    function (e) { return !e; }).ofObject(),
                ),
                makeNotation(notation),
            ), // End Panel
            $(go.RowColumnDefinition, { row: 2, sizing: go.RowColumnDefinition.None }),
        ),
    );
}

const SWIM_HEADER_WIDTH = 34;
const LANE_HEADER_STRIP_WIDTH = 36;
// Dark enough to be clearly visible even when the diagram background is white.
const SWIM_BORDER_FALLBACK = "#000000";
const SWIM_LANE_EDGE_WIDTH = 2;
// Visual debugging aid: tint swimlane/pool panels so it is obvious which bounds are structural vs content.
// Keep this off in normal use; it intentionally overrides data-driven fills.
const DEBUG_SWIMLANE_BG = true;

function dbgFill(normal: string, debugFill: string): string {
    return DEBUG_SWIMLANE_BG ? debugFill : normal;
}

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
                // Keep structural bounds transparent; body/header debug tints are sufficient and avoid a
                // confusing "second region" appearing during drag.
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
            $(go.Panel, "Spot", // Header strip is a Spot so we can draw a stable border overlay that matches selection/handles.
                {
                    name: "LANE_HEADER_STRIP",
                    row: 0,
                    column: 0,
                    width: LANE_HEADER_STRIP_WIDTH,
                    stretch: go.GraphObject.Fill,
                    alignment: go.Spot.TopLeft,
                    contextMenu: contextMenu,
                    cursor: "move",
                },
                $(go.Shape, "Rectangle", {
                    isPanelMain: true,
                    fill: dbgFill("#f3f3f3", "rgba(0, 120, 255, 0.10)"),
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
                    $("SubGraphExpanderButton", { margin: new go.Margin(0, 0, 0, 4), scale: 1.1 }),
                ),
                makeNotation(notation),
            ),
            // Body panel must not grow/shrink based on member bounds; the lane BODY size is controlled by
            // `LANE_BODY_SHAPE` (bound to `data.size`) and members are clipped to it.
            $(go.Panel, "Auto",
                {
                    name: "BODY",
                    row: 0,
                    column: 1,
                    // Do not vertically stretch lane body to the pool height. The lane BODY height must be
                    // driven by `LANE_BODY_SHAPE.desiredSize.height` (data.size) so lanes don't overlap.
                    stretch: go.GraphObject.Horizontal,
                    isClipping: true,
                },
                $(go.Shape, "Rectangle",
                    {
                        name: "LANE_BODY_SHAPE",
                        isPanelMain: true,
                        cursor: "move",
                        fill: "white",
                        pickable: false, // Allow clicks to pass through to nodes inside the lane
                        // Visible stroke while debugging so we can see the true lane body bounds.
                        stroke: DEBUG_SWIMLANE_BG ? "rgba(0,0,0,0.35)" : "transparent",
                        strokeWidth: DEBUG_SWIMLANE_BG ? 1 : 0,
                        minSize: new go.Size(160, 65),
                        // Horizontal stretch only; height comes from desiredSize binding.
                        stretch: go.GraphObject.Horizontal,
                    },
                    new go.Binding("fill", "fillcolor", (c: any) => {
                        if (DEBUG_SWIMLANE_BG) return "rgba(0, 200, 60, 0.18)";
                        const s = (c == null) ? "" : String(c).trim();
                        return s === "" ? "white" : s;
                    }),
                    new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
                ),
                $(go.Placeholder, { padding: new go.Margin(0, 0, 0, 0), alignment: go.Spot.TopLeft }),
            ),
        ),
    );
}

export function poolTop(contextMenu: any, notation: string, textscale: number) {
    return $(go.Panel, "Auto",
        $(go.Shape, "Rectangle",
            {
                name: "POOL_SHAPE",
                isPanelMain: true,
                cursor: "alias",
                fill: "white",
                strokeWidth: 2,
                strokeCap: "square",
                strokeJoin: "miter",
                minSize: new go.Size(200, 100),
            },
            new go.Binding("fill", "fillcolor", (c: any) => {
                if (DEBUG_SWIMLANE_BG) return "rgba(255, 180, 0, 0.06)";
                const s = (c == null) ? "" : String(c).trim();
                return s === "" ? "white" : s;
            }),
            // Ensure pool borders are always visible even when `strokecolor` is unset/empty.
            new go.Binding("stroke", "strokecolor", swimStroke),
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        ),
        $(go.Panel, "Table",
            {
                stretch: go.GraphObject.Fill,
                // Ensure the whole table is anchored to the pool shape, not centered within it.
                alignment: go.Spot.TopLeft,
                defaultAlignment: go.Spot.TopLeft,
                // Keep pool header + lanes flush to the pool border (no gap).
                margin: new go.Margin(0),
                // Draw our own separator line so it doesn't affect column sizing/bounds (removes visible gap).
                defaultColumnSeparatorStroke: "transparent",
            },
            $(go.RowColumnDefinition, { column: 0, width: SWIM_HEADER_WIDTH, sizing: go.RowColumnDefinition.None }),
            // Make row 0 fill the pool height so the header strip spans the full pool vertically.
            // GoJS uses RowColumnDefinition.stretch (go.Stretch), not a "Stretch" sizing enum.
            $(go.RowColumnDefinition, { row: 0, stretch: go.Stretch.Fill }),
            $(go.Panel, "Spot",
                {
                    name: "POOL_HEADER_STRIP",
                    row: 0,
                    column: 0,
                    width: SWIM_HEADER_WIDTH,
                    stretch: go.GraphObject.Fill,
                    contextMenu: contextMenu,
                    cursor: "move",
                },
                $(go.Shape, "Rectangle", {
                    fill: dbgFill("#f3f3f3", "rgba(160, 90, 255, 0.10)"),
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
                // NOTE: this panel must not size itself based on lane member bounds; otherwise the pool border
                // will "jump" as lane contents are dragged/dropped. The main shape determines content size and
                // the Placeholder is clipped to it.
                $(go.Panel, "Auto",
                    {
                        stretch: go.GraphObject.Fill,
                        isClipping: true,
                    },
                    $(go.Shape, "Rectangle",
                        {
                            name: "POOL_CONTENT_SHAPE",
                            isPanelMain: true,
                            fill: dbgFill("transparent", "rgba(0, 0, 0, 0.03)"),
                            stroke: "transparent",
                            stretch: go.GraphObject.Fill,
                            pickable: false,
                        },
                    ),
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
        ),
    );
}

function addResizeAdornment(groupName: string) {
    return $(go.Adornment, "Spot",
        $(go.Placeholder),
        $(go.Shape,  // for changing the length of a lane
        {
            alignment: go.Spot.Right,
            desiredSize: new go.Size(7, 50),
            fill: "lightblue", stroke: "dodgerblue",
            cursor: "col-resize"
        },
        new go.Binding("visible", "", ad => {
            if (ad.adornedPart === null) return false;
            return ad.adornedPart.isSubGraphExpanded;
        }).ofObject()),
        $(go.Shape,  // for changing the breadth of a lane
        {
            alignment: go.Spot.Bottom,
            desiredSize: new go.Size(50, 7),
            fill: "lightblue", stroke: "dodgerblue",
            cursor: "row-resize"
        },
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
                name: "name"
            },        
            new go.Binding("text", "name").makeTwoWay(),
            new go.Binding("stroke", "textcolor").makeTwoWay()
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

function addNodeText(contextMenu: any) {
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
                name: "name"
            },        
            new go.Binding("text", "name").makeTwoWay(),
            new go.Binding("stroke", "textcolor").makeTwoWay()
        ),
        $(go.TextBlock, textStyle(), // the typename  --------------------
            {
                row: 1, column: 1, columnSpan: 6,
                editable: false, isMultiline: false,
                minSize: new go.Size(10, 4),
                margin: new go.Margin(0, 0, 0, 2),  
                textAlign: "center",
            },
            new go.Binding("text", "typename"),
            new go.Binding("stroke", "textcolor2").makeTwoWay()
        ),
    )
}

function addLeftPorts(portContextMenu: any) {
    return $(go.Panel, "Vertical", 
            new go.Binding("itemArray", "leftPorts"),
            {
                row: 1, 
                column: 0,
                itemTemplate: makeItemTemplate('left', true, portContextMenu),
                alignment: go.Spot.Left, 
                fromLinkable: true, 
                toLinkable: true, 
                cursor: "pointer",
            },
    );  // end leftPorts Panel
}

function addTopPorts(portContextMenu: any) {
    return $(go.Panel, "Horizontal",
            new go.Binding("itemArray", "topPorts"),
            {
                row: 0, 
                column: 0,
                itemTemplate: makeItemTemplate('top', true, portContextMenu),
                alignment: go.Spot.Top, 
                fromLinkable: true, 
                toLinkable: true,
                cursor: "pointer",
            }
    );  // end topPorts Panel
}
    
function addRightPorts(portContextMenu: any) {
    return $(go.Panel, "Vertical", 
            new go.Binding("itemArray", "rightPorts"),
                {
                    row: 1, 
                    column: 2,
                    itemTemplate: makeItemTemplate('right', true, portContextMenu),
                    alignment: go.Spot.Right, 
                    fromLinkable: true,
                    toLinkable: true,
                    cursor: "pointer",
                }
            );  // end rightPorts Panel
}

function addBottomPorts(portContextMenu: any) {
    return $(go.Panel, "Horizontal",
            new go.Binding("itemArray", "bottomPorts"),
            {
                row: 0, 
                column: 0,
                itemTemplate: makeItemTemplate('bottom', true, portContextMenu),
                alignment: go.Spot.Bottom, 
                fromLinkable: true,
                toLinkable: true,
                cursor: "pointer",
            }
        );  // end bottomPorts Panel
}

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
    let font2 = "12pt FontAwesome";
    let font = isGroup ? font2 : font1;
    let size1 = new go.Size(30, 15);
    let size2 = new go.Size(40, 20);
    let portSize = isGroup ? size2 : size1;
    let fromSpot, toSpot, textangle = 0, textalign;
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
    } else if (rightside) {
        toSpot = go.Spot.Left;
        fromSpot = go.Spot.Right;
    }
    let geostring = geostring1;
    if (topside) geostring = geostring2;
    else if (bottomside) geostring = geostring3;
    return $(go.Panel, "Spot",
        { 
            margin: new go.Margin(1, 1),
            toLinkable: true, // tolinkable,
            fromLinkable: true, // fromlinkable,
            toSpot: toSpot,
            fromSpot: fromSpot,
            portId: "",
            cursor: "pointer",
            contextMenu: portContextMenu, 
        },  // some space between ports
        new go.Binding("portId", "", function(d) { 
            return d?.id || d?.portId || ""; 
        }),
        $(go.Shape,
            {
                name: "SHAPE",
                fill: "white", 
                stroke: "gray",
                strokeWidth: 1,
                geometryString: geostring, 
                desiredSize: portSize,
            },
            new go.Binding("fill", "color"),
        ),
        $(go.TextBlock,
            {
                font: font,
                angle: textangle,
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

// Change name
export function changePortName(port, name, myDiagram) {
    myDiagram.startTransaction("changePortName");
    const data = port.data;
    if (debug) console.log('394 port, data', port, data);
    myDiagram.model.setDataProperty(data, "name", name);
    myDiagram.commitTransaction("changePortName");
}
  
// Change the color of the clicked port.
export function changePortColor(port, color, myDiagram) {
    myDiagram.startTransaction("colorPort");
    const data = port.data;
    if (debug) console.log('403 port, data', port, data);
    myDiagram.model.setDataProperty(data, "color", color);
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
        const arr = node.data[side + "Ports"];
        if (debug) console.log('315 arr: ', arr);
        if (arr) {
            // create a new port data object
            const newportdata = {
                portId: portId,
                name: name,
                color: color
            };
            if (debug) console.log('323 newportdata: ', newportdata);
            // and add it to the Array of port data
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
        const diagram = this.diagram;
        const myMetis = (this as any).__myMetis as akm.cxMetis | undefined;
        const category = String(lane.data?.template || lane.data?.category || lane.category || "");
        const isPool = category === "Pool";
        const isLane =
          category === "Lane" ||
          category === "Lane_w_handles" ||
          category.startsWith("Lane");

        if (isPool) {
          super.resize.call(this, newr);
          return;
        }

        if (isLane && lane.containingGroup !== null && this.isLengthening()) {
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

        return;
      }

      public doDeactivate(): void {
        const adornedPart = this.adornedObject?.part;
        const category = String(adornedPart?.data?.template || adornedPart?.data?.category || adornedPart?.category || "");
        const isPool = category === "Pool";
        const isLane =
          category === "Lane" ||
          category === "Lane_w_handles" ||
          category.startsWith("Lane");
        const diagram = this.diagram;
        const myMetis = (this as any).__myMetis as akm.cxMetis | undefined;

        let resizedShapeSize: go.Size | null = null;
        if (isPool) {
          const poolShape = adornedPart?.findObject("POOL_SHAPE") as go.GraphObject | null;
          resizedShapeSize = poolShape?.desiredSize || poolShape?.actualBounds?.size || null;
        } else if (isLane) {
          const laneBody = adornedPart?.findObject("LANE_BODY_SHAPE") as go.GraphObject | null;
          resizedShapeSize = laneBody?.desiredSize || laneBody?.actualBounds?.size || null;
        }

        super.doDeactivate();

        if (!diagram || (!isPool && !isLane) || !(adornedPart instanceof go.Group)) {
          return;
        }

        if (resizedShapeSize && !isNaN(resizedShapeSize.width) && !isNaN(resizedShapeSize.height)) {
          diagram.model.setDataProperty(adornedPart.data, "size", go.Size.stringify(resizedShapeSize));
        }
      }
  }
  // end LaneResizingTool class

  export function installLaneResizingTool(diagram: go.Diagram, myMetis?: akm.cxMetis) {
    myDiagram = diagram;
    const tool = new LaneResizingTool();
    (tool as any).__myMetis = myMetis;
    (tool as any).__mimrisToolName = "LaneResizingTool";
    tool.isGridSnapEnabled = true;
    diagram.toolManager.resizingTool = tool;
  }

    // hide links between lanes when either lane is collapsed
    function updateCrossLaneLinks(group: go.Group) {
        group.findExternalLinksConnected().each((ll) => {
            const d: any = (ll as any).data;
            const typeName =
              d?.typename ||
              d?.name ||
              d?.relship?.type?.name ||
              d?.relshipview?.relship?.type?.name ||
              "";
            // Never force-visibility for lane membership links; those are handled by bindings.
            if (typeName === constants.types.AKM_CONTAINS) {
              ll.updateTargetBindings();
              return;
            }
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
export function addNodeTemplates(nodeTemplateMap: any, contextMenu: any, portContextMenu: any, myMetis: akm.cxMetis) {
    const myDiagram = myMetis.myDiagram;
    if (debug) console.log('981 addNodeTemplates', myMetis, contextMenu, portContextMenu);
    let nodeTemplate0 =      
    $(go.Node, 'Auto',  // the Shape will go around the TextBlock
        {
            mouseEnter: (e, node) => node.isHighlighted = true,
            mouseLeave: (e, node) => node.isHighlighted = false,
        },
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
            new go.Binding('stroke', 'strokecolor'), 
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
        addNodeText(contextMenu),       
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
                    isMultiline: true,  // don't allow newlines in text
                    editable: true,  // allow in-place editing by user
                    row: 0, column: 0, columnSpan: 6,
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
                new go.Binding("stroke", "textcolor").makeTwoWay()
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
                new go.Binding("source", "icon", findImage),
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
                            $(go.Picture,  // the image -------------------------------------
                                {
                                    name: "Picture",
                                    desiredSize: new go.Size(48, 48),
                                },
                                new go.Binding("source", "icon", findImage),
                            ),    
                            $(go.TextBlock, textStyle(), // the unicode symbol \uf015 is the plus sign
                                {
                                    background: "transparent",
                                    textAlign: "center",    
                                    stroke:    "black",
                                    // stroke: {(strokecolor2 !== '') ? strokecolor2 : "black"},
                                    // margin: new go.Margin(20, 12, 12, 12), 
                                    desiredSize: new go.Size(48, 36),
                                    font: "38px 'FontAwesome'",
                                    editable: false,
                                    isMultiline: false,
                                    // alignment: go.Spot.Center, // Add this line to align the text center
                                },
                                // new go.Binding("fill", "fillcolor2"),
                                new go.Binding("stroke", "strokecolor2", defaultStrokeColor), // Apply converter here
                                new go.Binding("text", "icon", findUnicodeImage)
                            )
                        ),
                    ),
                    // comment out icon stop
                    // define the panel where the text will appear

                    addNodeText(contextMenu),
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
                    addNodeText(contextMenu),
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
                    addNodeText(contextMenu),
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
                    desiredSize: new go.Size(169, 69), // outer Shape size with icon
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
                    // define the panel where the text will appear

                    addNodeText0(contextMenu),
                ),
            ),
        )
    );
     addNodeTemplateName('ActivityNode');

    nodeTemplateMap.add("EventNode",
        $(go.Node, 'Vertical',  // the Shape will go around the TextBlock
            new go.Binding("isSelected", "isSelected").makeTwoWay(),
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            {
                selectionObjectName: "SHAPE",
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
                        alignment: go.Spot.Center,
                        figure: "Circle", 
                        fill: "white",
                        stroke: "black",
                        strokeWidth: 4,
                        cursor: "alias",                    // cursor: "pointer",
                        minSize: new go.Size(60, 60), 
                        desiredSize: new go.Size(76, 76),   // outer Shape size 
                        // set the port properties
                        portId: "", 
                        fromLinkable: true,
                        fromSpot: go.Spot.RightSide,
                        toLinkable: true,
                        toSpot: go.Spot.AllSides,
                        toLinkableSelfNode: false,
                        toLinkableDuplicates: false,
                    },
                    // Shape bindings
                    new go.Binding('fill', 'fillcolor'),
                    new go.Binding('stroke', 'strokecolor'),
                    new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                        return typeof val === 'number' ? val : parseInt(val) || 1; 
                    }),
                ),
                $(go.Picture,  // the image -------------------------------------
                    {
                        name: "Picture",
                        desiredSize: new go.Size(48, 48),
                    },
                    new go.Binding("source", "icon", findImage),
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
                selectionObjectName: "SHAPE",
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
                        desiredSize: new go.Size(79, 79),  // outer Shape size 
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
                        desiredSize: new go.Size(48, 48),
                    },
                    new go.Binding("source", "icon", findImage),
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
                        desiredSize: new go.Size(77, 20),
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
    // Swimlane rule: structural "contains" relationships for Pools/Lanes should not be drawn.
    // Do not hide ordinary metamodel/container "contains" links such as BPMN_META -> EntityType.
    const linkShouldBeVisible = (d: any, linkObj: go.GraphObject): boolean => {
        // Respect explicit hide flag from persisted relationship views.
        if (d?.visible === false) return false;

        const link = linkObj as any as go.Link;
        const typeName =
            d?.typename ||
            d?.name || // relship name is often set to "contains"
            d?.relship?.type?.name ||
            d?.relshipview?.relship?.type?.name ||
            d?.relshipkind ||
            "";

        const from = link?.fromNode as any;
        const to = link?.toNode as any;
        const fromCat = String(from?.data?.category || from?.data?.template || from?.category || "");
        const toCat = String(to?.data?.category || to?.data?.template || to?.category || "");
        const fromIsLane = fromCat.startsWith("Lane");
        const toIsLane = toCat.startsWith("Lane");
        const fromIsPool = fromCat === "Pool";
        const toIsPool = toCat === "Pool";
        // Swimlane invariant: membership ("contains") relationships should never be rendered for Pools/Lanes.
        // We hide them unconditionally when either endpoint is a Pool or Lane group. This is robust even
        // when membership data is briefly inconsistent during drag/layout.
        if (typeName === constants.types.AKM_CONTAINS && (fromIsLane || toIsLane || fromIsPool || toIsPool)) {
            return false;
        }
        return true;
    };
    const linkTemplate =
        $(go.Link,
            new go.Binding("deletable"),
            // new go.Binding("isLayoutPositioned", "isLayoutPositioned").makeTwoWay(), 
            { selectable: true },
            // Hide structural "contains" links inside lanes.
            new go.Binding("visible", "", linkShouldBeVisible),
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
    // Most relationship links in this app use `data.category === "Relationship"`.
    // Provide a template for that category so visibility rules (e.g. hide lane-membership "contains") apply.
    linkTemplateMap.add(constants.gojs.C_RELATIONSHIP, linkTemplate1);
    // Fallback for any links without a category set.
    if (!linkTemplateMap.has("")) linkTemplateMap.add("", linkTemplate1);

    // Keep consistent with `getLinkTemplate`'s contains-visibility rule.
    const linkShouldBeVisible = (d: any, linkObj: go.GraphObject): boolean => {
        if (d?.visible === false) return false;
        const link = linkObj as any as go.Link;
        const typeName =
            d?.typename ||
            d?.name ||
            d?.relship?.type?.name ||
            d?.relshipview?.relship?.type?.name ||
            d?.relshipkind ||
            "";
        const from = link?.fromNode as any;
        const to = link?.toNode as any;
        const fromCat = String(from?.data?.category || from?.data?.template || from?.category || "");
        const toCat = String(to?.data?.category || to?.data?.template || to?.category || "");
        const fromIsLane = fromCat.startsWith("Lane");
        const toIsLane = toCat.startsWith("Lane");
        const fromIsPool = fromCat === "Pool";
        const toIsPool = toCat === "Pool";
        if (typeName === constants.types.AKM_CONTAINS && (fromIsLane || toIsLane || fromIsPool || toIsPool)) {
            return false;
        }
        return true;
    };

    const linkTemplate2 =      
        $(go.Link,
            new go.Binding("deletable"),
            { contextMenu: contextMenu },
            { selectable: true },
            new go.Binding("visible", "", linkShouldBeVisible),
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
        new go.Binding("visible", "", linkShouldBeVisible),
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
	        new go.Binding("visible", "", linkShouldBeVisible),
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
        const groupWithPorts1 =
        $(go.Group, "Spot",
            {
                name: "GROUP",
                resizable: true, 
                minSize: getMinSize(),
                resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
                selectionObjectName: "GROUP",  // selecting a custom part also selects the shape
                selectionAdorned: true,
                contextMenu: contextMenu,
                locationObjectName: 'BODY',
                locationSpot: go.Spot.Center,
                selectionObjectName: 'BODY',
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
            groupTop1(contextMenu, 'Icon'),
            // And now the ports
            addLeftPorts(portContextMenu),
            addTopPorts(portContextMenu),
            addRightPorts(portContextMenu),
            addBottomPorts(portContextMenu),
        )
        groupTemplateMap.add("groupWithPorts", groupWithPorts1);
        addGroupTemplateName('groupWithPorts');      
        groupTemplateMap.add("groupWithIconAndPorts", groupWithPorts1);
        addGroupTemplateName('groupWithIconAndPorts');      
        groupTemplateMap.add("IDEF0", groupWithPorts1);
        addGroupTemplateName('IDEF0');      
        
        const groupWithPorts2 =
        $(go.Group, "Spot",
            {
                name: "GROUP",
                resizable: true, 
                minSize: getMinSize(),
                resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
                selectionObjectName: "GROUP",  // selecting a custom part also selects the shape
                selectionAdorned: true,
                contextMenu: contextMenu,
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
            groupTop1(contextMenu, 'Geometry'),
            // And now the ports
            addLeftPorts(portContextMenu),
            addTopPorts(portContextMenu),
            addRightPorts(portContextMenu),
            addBottomPorts(portContextMenu),
        )
        groupTemplateMap.add("groupWithGeoAndPorts", groupWithPorts2);
        addGroupTemplateName('groupWithGeoAndPorts');      
        
        const groupWithPorts3 =
        $(go.Group, "Spot",
            {
                name: "GROUP",
                resizable: true, 
                minSize: getMinSize(),
                resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
                selectionObjectName: "GROUP",  // selecting a custom part also selects the shape
                selectionAdorned: true,
                contextMenu: contextMenu,
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
            groupTop1(contextMenu, 'Figure'),
            // And now the ports
            addLeftPorts(portContextMenu),
            addTopPorts(portContextMenu),
            addRightPorts(portContextMenu),
            addBottomPorts(portContextMenu),
        )
        groupTemplateMap.add("groupWithFigAndPorts", groupWithPorts3);
        addGroupTemplateName('groupWithFigAndPorts');      
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
                contextMenu: contextMenu,
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
        // groupTemplateMap.get("groupNoPorts").resizeAdornmentTemplate = addResizeAdornment("groupNoPorts");

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
                contextMenu: contextMenu,
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

        const groupWithoutPorts3 =
        $(go.Group, "Spot",
            {
                name: "GROUP",
                resizable: true, 
                minSize: getMinSize(),
                resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
                selectionObjectName: "GROUP",  // selecting a custom part also selects the shape
                selectionAdorned: true,
                contextMenu: contextMenu,
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

    // Shared helpers for Pool/Lane drag-drop behavior.
    // These must live in the addGroupTemplates scope so both templates can call them.
    const isLaneGroupPart = (part: go.Part): part is go.Group => {
        if (!(part instanceof go.Group)) return false;
        const t = part.data?.template;
        const c = part.data?.category;
        return c === "Lane" || c === "Lane_w_handles" || t === "Lane" || t === "Lane_w_handles";
    };

    const laneStructureBounds = (lane: go.Group): go.Rect => {
        const main = lane.findObject("LANE_MAIN_SHAPE") as go.GraphObject | null;
        if (main) return main.getDocumentBounds();
        return lane.actualBounds;
    };

    const handlePoolLaneDrop = (
        e: go.InputEvent,
        pool: go.Group,
        opts?: { relativeToLane?: go.Group; dropY?: number }
    ) => {
        const diagram = e.diagram;
        const dragged = diagram.selection;
        let hasLane = false;
        let valid = true;
        dragged.each((part: go.Part) => {
            if (part === pool) return;
            if (!isLaneGroupPart(part)) {
                valid = false;
                return;
            }
            hasLane = true;
        });
        if (!valid || !hasLane) {
            diagram.currentTool.doCancel();
            return;
        }

        const ok = pool.addMembers(dragged, true);
        if (!ok) {
            diagram.currentTool.doCancel();
            return;
        }

        const normalizeDroppedLaneBodySize = (lane: go.Group) => {
            const laneBody = lane.findObject("LANE_BODY_SHAPE") as go.GraphObject | null;
            const laneMain = lane.findObject("LANE_MAIN_SHAPE") as go.GraphObject | null;
            const laneHeader = lane.findObject("LANE_HEADER_STRIP") as go.GraphObject | null;
            const currentSize = lane.data?.size
                ? go.Size.parse(String(lane.data.size))
                : new go.Size(
                    laneBody?.actualBounds.width || laneBody?.desiredSize?.width || 160,
                    laneBody?.actualBounds.height || laneBody?.desiredSize?.height || 65
                );
            const minBodyHeight = Math.max(
                65,
                Number((laneBody as any)?.minSize?.height) || 0,
                laneHeader?.actualBounds.height || 0,
                laneMain?.actualBounds.height || 0
            );
            const nextSize = new go.Size(
                Math.max(160, !isNaN(currentSize.width) ? currentSize.width : 160),
                Math.max(minBodyHeight, !isNaN(currentSize.height) ? currentSize.height : minBodyHeight)
            );
            if (laneBody) {
                (laneBody as any).desiredSize = nextSize.copy();
                (laneBody as any).width = nextSize.width;
                (laneBody as any).height = nextSize.height;
            }
            if (!lane.data?.size || String(lane.data.size) !== go.Size.stringify(nextSize)) {
                diagram.model.setDataProperty(lane.data, "size", go.Size.stringify(nextSize));
            }
        };

        dragged.each((part: go.Part) => {
            if (!(part instanceof go.Group) || !isLaneGroupPart(part)) return;
            normalizeDroppedLaneBodySize(part);
        });

        // Optional insertion behavior: when a Lane is dropped "on a lane", insert above/below that
        // target lane based on the drop Y coordinate. We do this by nudging the dropped lanes' Y
        // locations just above/below the target lane before triggering PoolLayout.
        if (opts?.relativeToLane && typeof opts.dropY === "number" && !Number.isNaN(opts.dropY)) {
            const targetBounds = laneStructureBounds(opts.relativeToLane);
            const midY = targetBounds.y + (targetBounds.height / 2);
            const insertBefore = opts.dropY < midY;

            const droppedLanes: go.Group[] = [];
            dragged.each((part: go.Part) => {
                if (!isLaneGroupPart(part)) return;
                droppedLanes.push(part);
            });
            droppedLanes.sort((a, b) => laneStructureBounds(a).y - laneStructureBounds(b).y);

            const targetY = targetBounds.y;
            const n = droppedLanes.length;
            droppedLanes.forEach((lane, idx) => {
                const x = lane.location.x;
                const yOffset = insertBefore
                    ? (-1 - (n - 1 - idx) * 0.1)
                    : (1 + idx * 0.1);
                const y = targetY + yOffset;
                lane.moveTo(x, y);
                if (lane.data) {
                    diagram.model.setDataProperty(lane.data, "loc", `${lane.location.x} ${lane.location.y}`);
                }
            });
        }

        const modelview = myMetis.currentModelview;
        dragged.each((part: go.Part) => {
            if (!isLaneGroupPart(part)) return;
            const laneOv = modelview?.findObjectView(part.data?.key);
            if (!laneOv) return;
            laneOv.group = pool.data?.key;
            laneOv.loc = part.data?.loc ? String(part.data.loc) : `${part.location.x} ${part.location.y}`;
            if (part.data?.size) laneOv.size = part.data.size;
            const jsnLaneOv = new jsn.jsnObjectView(laneOv);
            const data = JSON.parse(JSON.stringify(jsnLaneOv));
            diagram.dispatch({ type: "UPDATE_OBJECTVIEW_PROPERTIES", data });
        });

        const poolOv = modelview?.findObjectView(pool.data?.key);
        if (poolOv?.isGroup) {
            uid.doGroupLayout(poolOv, diagram, myMetis);
        }
    };

	    if (true) { // laneTemplate
	        const handleLaneDrop = (e: go.InputEvent, grp: go.Group) => {
	            const diagram = e.diagram;
	            const dragged = diagram.selection;
	            const dragAllowKeys: Set<string> | undefined = (diagram as any)?.__dragAllowReparentKeys;
	            const dragAllowGlobal: boolean = !!(diagram as any)?.__dragAllowReparent;
	            const allowReparentDrop =
	                !!e.shift ||
	                dragAllowGlobal ||
	                (dragAllowKeys
	                    ? dragged.any((p: go.Part) => p instanceof go.Node && !(p instanceof go.Group) && p.data?.key != null && dragAllowKeys.has(String(p.data.key)))
	                    : false);
	            const targetLaneKey = String(grp?.data?.key || grp.key || "");
	            // If the user drops Lane groups onto a Lane, treat it as dropping lanes into the parent Pool.
	            // This makes lane management feel natural (drop "on a lane" to insert into that pool).
	            let hasLaneGroup = false;
	            let onlyLaneGroups = true;
            dragged.each((part: go.Part) => {
                if (part === grp) return;
                if (isLaneGroupPart(part)) {
                    hasLaneGroup = true;
                    return;
                }
                if (part instanceof go.Group) {
                    onlyLaneGroups = false;
                    return;
                }
                // selection contains non-groups
                onlyLaneGroups = false;
            });
	            if (hasLaneGroup && onlyLaneGroups) {
	                const parentPool = grp.containingGroup;
	                if (parentPool && (parentPool.data?.template === "Pool" || parentPool.data?.category === "Pool")) {
	                    handlePoolLaneDrop(e, parentPool, { relativeToLane: grp, dropY: e.documentPoint?.y });
	                    return;
	                }
	                diagram.currentTool.doCancel();
	                return;
	            }

	            // Prevent "jump on mouse-up":
	            // When dragging a node across a lane border without Shift, dragComputation clamps the node,
	            // but the mouse-up can occur over a neighboring lane and trigger this mouseDrop.
	            // Do not regroup or reposition nodes into a different lane unless Shift is held,
	            // except for ungrouped nodes (allow initial assignment to a lane).
	            if (!allowReparentDrop) {
	                let hasConflictingGroupedNode = false;
	                dragged.each((part: go.Part) => {
	                    if (!(part instanceof go.Node) || part instanceof go.Group) return;
	                    const g = (part.data && typeof (part.data as any).group === "string") ? String((part.data as any).group) : "";
	                    if (g && targetLaneKey && g !== targetLaneKey) hasConflictingGroupedNode = true;
	                });
	                if (hasConflictingGroupedNode) {
	                    // Leave the drag result as-is (clamped by dragComputation); don't move/reparent.
	                    return;
	                }
	            }

	            const previousLaneSize = grp.data?.size ? go.Size.parse(String(grp.data.size)) : null;
	            let hasNode = false;
	            let valid = true;
	            dragged.each((part: go.Part) => {
                if (part === grp) return;
                if (part instanceof go.Group) {
                    valid = false;
                    return;
                }
                if (part instanceof go.Node) hasNode = true;
                // Non-node/link parts are not valid lane content.
                if (!(part instanceof go.Node) && !(part instanceof go.Link)) valid = false;
            });
	            if (!valid || !hasNode) {
	                diagram.currentTool.doCancel();
	                return;
	            }

	            // Cross-lane regrouping requires Shift. Without Shift, only allow adding nodes that are
	            // currently ungrouped (e.g., dropped from palette) or already in this lane.
	            if (!allowReparentDrop) {
	                let anyCrossLane = false;
	                dragged.each((part: go.Part) => {
	                    if (!(part instanceof go.Node) || part instanceof go.Group) return;
	                    const g = (part.data && typeof (part.data as any).group === "string") ? String((part.data as any).group) : "";
	                    if (g && targetLaneKey && g !== targetLaneKey) anyCrossLane = true;
	                });
	                if (anyCrossLane) return;
	            }

	            const ok = grp.addMembers(dragged, true);
	            if (!ok) {
	                diagram.currentTool.doCancel();
	                return;
	            }

		            // Ensure model membership is explicit when regrouping is allowed.
		            if (allowReparentDrop && targetLaneKey) {
		                // Force a real reparent: if the node still belongs to another lane, remove it there first,
		                // then set the model group key, and finally ensure the Part is a member of this lane.
		                // This prevents the "looks in new lane, but jumps back to old lane when moved" behavior.
		                diagram.commit((d: go.Diagram) => {
		                    dragged.each((part: go.Part) => {
		                        if (!(part instanceof go.Node) || part instanceof go.Group) return;
		                        if (!part.data) return;
		                        const oldGrp = part.containingGroup;
		                        if (oldGrp && oldGrp !== grp) {
		                            const s = new go.Set<go.Part>();
		                            s.add(part);
		                            oldGrp.removeMembers(s, true);
		                        }
		                        if (typeof (d.model as any)?.setGroupKeyForNodeData === "function") {
		                            (d.model as any).setGroupKeyForNodeData(part.data, targetLaneKey);
		                        } else {
		                            d.model.setDataProperty(part.data, "group", targetLaneKey);
		                        }
		                        grp.addMembers(new go.Set<go.Part>().add(part), true);
		                    });
		                }, "ReparentToLane");
		            }

	            // Keep lane body geometry stable when members are dropped.
	            if (previousLaneSize && !isNaN(previousLaneSize.width) && !isNaN(previousLaneSize.height)) {
	                const laneBody = grp.findObject("LANE_BODY_SHAPE") as any;
                if (laneBody) {
                    laneBody.desiredSize = previousLaneSize.copy();
                    laneBody.width = previousLaneSize.width;
                    laneBody.height = previousLaneSize.height;
                }
                if (grp.data) {
                    diagram.model.setDataProperty(grp.data, "size", go.Size.stringify(previousLaneSize));
                }
            }

            const laneBodyBounds = (grp.findObject("LANE_BODY_SHAPE") as go.GraphObject | null)?.getDocumentBounds();
            if (laneBodyBounds) {
                dragged.each((part: go.Part) => {
                    if (!(part instanceof go.Node) || part instanceof go.Group) return;
                    const b = part.actualBounds;
                    const x = Math.max(laneBodyBounds.x, Math.min(b.x, laneBodyBounds.right - b.width - 1));
                    const y = Math.max(laneBodyBounds.y, Math.min(b.y, laneBodyBounds.bottom - b.height - 1));
                    part.moveTo(x, y);
                    if (part.data) {
                        diagram.model.setDataProperty(part.data, "loc", `${part.location.x} ${part.location.y}`);
                    }
                });
            }

            const modelview = myMetis.currentModelview;
            dragged.each((part: go.Part) => {
                if (!(part instanceof go.Node) || part instanceof go.Group) return;
                const ov = modelview?.findObjectView(part.data?.key);
                if (!ov) return;
                ov.group = grp.data?.key;
                ov.loc = part.data?.loc ? String(part.data.loc) : `${part.location.x} ${part.location.y}`;
                const jsnOv = new jsn.jsnObjectView(ov);
                const data = JSON.parse(JSON.stringify(jsnOv));
                diagram.dispatch({ type: "UPDATE_OBJECTVIEW_PROPERTIES", data });
            });

            const laneOv = modelview?.findObjectView(grp.data?.key);
            if (laneOv) {
                laneOv.loc = grp.data?.loc ? String(grp.data.loc) : `${grp.location.x} ${grp.location.y}`;
                if (grp.data?.size) laneOv.size = grp.data.size;
                const jsnLaneOv = new jsn.jsnObjectView(laneOv);
                const laneData = JSON.parse(JSON.stringify(jsnLaneOv));
                diagram.dispatch({ type: "UPDATE_OBJECTVIEW_PROPERTIES", data: laneData });
            }

            const parentPool = grp.containingGroup;
            if (parentPool?.data?.key) {
                const poolOv = modelview?.findObjectView(parentPool.data.key);
                if (poolOv?.isGroup) {
                    uid.doGroupLayout(poolOv, diagram, myMetis);
                }
            }
        };

        // each Group is a "swimlane" with a header on the left and a resizable lane on the right
        const laneTemplate = 
        $(go.Group, "Horizontal", groupStyle(),
        {
            name: "GROUP",
            // Keep selection outline + resize handles aligned with the full lane (header + body).
            selectionObjectName: "LANE_MAIN_SHAPE",
            resizeObjectName: "LANE_BODY_SHAPE",
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
            mouseDrop: handleLaneDrop,
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
        // Primary swimlane template key used by the model is "Lane" (nodeCategoryProperty: "template").
        // Keep "Lane9" as a backward-compatible alias for older data.
        groupTemplateMap.add("Lane", laneTemplate);
        addGroupTemplateName('Lane');
        groupTemplateMap.add("Lane9", laneTemplate);
        addGroupTemplateName('Lane9');
        // Some older models may still reference "Lane9_legacy" as the template key.
        // Alias it to the modern swimlane template so selection/resize bounds are consistent.
        groupTemplateMap.add("Lane9_legacy", laneTemplate);
        addGroupTemplateName('Lane9_legacy');
        // define a custom resize adornment that has two resize handles if the group is expanded
  
        const laneTemplate2 = 
        $(go.Group, "Horizontal", groupStyle(),
        {
            name: "GROUP",
            // Keep selection outline + resize handles aligned with the full lane (header + body).
            selectionObjectName: "LANE_MAIN_SHAPE",
            resizeObjectName: "LANE_BODY_SHAPE",
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
            mouseDrop: handleLaneDrop,
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
        groupTemplateMap.add("Lane_w_handles", laneTemplate2);
        addGroupTemplateName('Lane_w_handles');
        groupTemplateMap.get("Lane_w_handles").resizeAdornmentTemplate = addResizeAdornment("Lane_w_handles");
    }
    if (true) { // poolTemplate
        const poolTemplate =
        $(go.Group, "Auto",
            {
                resizable: true,
                minSize: getMinSize(),
                contextMenu: contextMenu,
                selectionAdorned: true,
                // Keep selection/resize aligned with the pool border shape, not with placeholder/member bounds.
                selectionObjectName: "POOL_SHAPE",
                resizeObjectName: "POOL_SHAPE",
                locationSpot: go.Spot.TopLeft,
                computesBoundsAfterDrag: true,
                computesBoundsIncludingLinks: false,
                computesBoundsIncludingLocation: true,
                mouseDrop: function (e: go.InputEvent, grp: go.Group) {
                    handlePoolLaneDrop(e, grp);
                },
            },
            new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            // NOTE: pool size is bound on POOL_SHAPE (in poolTop). Binding size on the Group itself causes
            // resize/selection bounds to include transient member-bounds during drag/drop.
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

    if (true) {
    // each Group is a "swimlane" with a header on the left and a resizable lane on the right
    // Legacy lane template: keep it available for reference under a non-conflicting key.
    groupTemplateMap.add('Lane9_reference',
      new go.Group('Horizontal')
        .apply(groupStyle)
        .set({
          selectionObjectName: 'SHAPE', // selecting a lane causes the body of the lane to be highlit, not the label
          resizable: true,
          resizeObjectName: 'SHAPE', // the custom resizeAdornmentTemplate only permits two kinds of resizing
          layout: new go.LayeredDigraphLayout({
            // automatically lay out the lane's subgraph
            isInitial: false, // don't even do initial layout
            isOngoing: false, // don't invalidate layout when nodes or links are added or removed
            direction: 0,
            columnSpacing: 10,
            layeringOption: go.LayeredDigraphLayering.LongestPathSource
          }),
          computesBoundsAfterDrag: true, // needed to prevent recomputing Group.placeholder bounds too soon
          computesBoundsIncludingLinks: false, // to reduce occurrences of links going briefly outside the lane
          computesBoundsIncludingLocation: true, // to support empty space at top-left corner of lane
          handlesDragDropForMembers: true, // don't need to define handlers on member Nodes and Links
          mouseDrop: (e, grp) => {
            // dropping a copy of some Nodes and Links onto this Group adds them to this Group
            if (!e.shift) return; // cannot change groups with an unmodified drag-and-drop
            // don't allow drag-and-dropping a mix of regular Nodes and Groups
            if (!e.diagram.selection.any(n => n instanceof go.Group)) {
              const ok = grp.addMembers(grp.diagram.selection, true);
              if (ok) {
                updateCrossLaneLinks(grp);
              } else {
                grp.diagram.currentTool.doCancel();
              }
            } else {
              e.diagram.currentTool.doCancel();
            }
          },
          subGraphExpandedChanged: grp => {
            const shp = grp.resizeObject;
            if (grp.diagram.undoManager.isUndoingRedoing) return;
            if (grp.isSubGraphExpanded) {
              shp.height = grp.data.savedBreadth;
            } else {
              if (!isNaN(shp.height)) grp.diagram.model.set(grp.data, 'savedBreadth', shp.height);
              shp.height = NaN;
            }
            updateCrossLaneLinks(grp);
          }
        })
        .bindTwoWay('location', 'loc', go.Point.parse, go.Point.stringify)
        .bindTwoWay('isSubGraphExpanded', 'expanded')
        .add(
          // the lane header consisting of a Shape and a TextBlock
          new go.Panel('Horizontal', {
              name: 'HEADER',
              angle: 270, // maybe rotate the header to read sideways going up
              alignment: go.Spot.Center
            })
            .add(
              new go.Panel('Horizontal') // this is hidden when the swimlane is collapsed
                .bindObject('visible', 'isSubGraphExpanded')
                .add(
                  new go.Shape('Diamond', { width: 8, height: 8, fill: 'white' })
                    .bind('fill', 'color'),
                  new go.TextBlock({
                      font: 'bold 13pt sans-serif',
                      editable: true,
                      margin: new go.Margin(2, 0, 0, 0)
                    })
                    .bindTwoWay('text')
                ),
              go.GraphObject.build('SubGraphExpanderButton', { margin: 5 }) // but this remains always visible!
            ), // end Horizontal Panel
          new go.Panel('Auto') // the lane consisting of a background Shape and a Placeholder representing the subgraph
            .add(
              new go.Shape('Rectangle', { // this is the resized object
                  name: 'SHAPE',
                  fill: 'white'
                })
                .bind('fill', 'color')
                .bindTwoWay('desiredSize', 'size', go.Size.parse, go.Size.stringify),
              new go.Placeholder({ padding: 12, alignment: go.Spot.TopLeft }),
              new go.TextBlock({
                  // this TextBlock is only seen when the swimlane is collapsed
                  name: 'LABEL',
                  font: 'bold 13pt sans-serif',
                  editable: true,
                  angle: 0,
                  alignment: go.Spot.TopLeft,
                  margin: new go.Margin(2, 0, 0, 4)
                })
                .bindObject('visible', 'isSubGraphExpanded', e => !e)
                .bindTwoWay('text')
            ) // end Auto Panel
        )
    ); // end Group
    addGroupTemplateName('Lane9');
    }
}

export function addPortTemplates() {
    // define the Node template for each attribute in the nodeDataArray
}

function defaultStrokeColor(strokecolor2) {
  if (debug) console.log("3567 defaultStrokeColor: ", strokecolor2);
  return  (strokecolor2 === "") ? strokecolor2 : "#466"; // Dark bluegreen
}

// Function to identify images related to an image id
export function findImage(image: string) {
    if (debug) console.log("3238 findImage: ", image);
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
        const img = "./../images/types/" + image
        if (debug) console.log('3273 Diagram', image, img)
        return img
    } else {
        return "";
    }
}

export function findUnicodeImage(image: string) {
    if (image.includes('\\u')) { // its an awesome font image
        return String.fromCharCode(parseInt(image.slice(2), 16)).toLowerCase();
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

// Upon a drop onto a Group, we try to add the selection as members of the Group.
// Upon a drop onto the background, or onto a top-level Node, make selection top-level.
// If this is OK, we're done; otherwise we cancel the operation to rollback everything.
function finishDrop(e, grp) {
    let ok = (grp !== null
        ? grp.addMembers(grp.diagram.selection, true)
        : e.diagram.commandHandler.addTopLevelParts(e.diagram.selection, true));
    if (!ok) e.diagram.currentTool.doCancel();
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
