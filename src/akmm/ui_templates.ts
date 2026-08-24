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

function asBoolean(value: any, fallback = false): boolean {
    if (typeof value === "boolean") return value;
    if (value === "" || value === null || value === undefined) return fallback;
    return Boolean(value);
}

function sanitizeFigureName(value: any, fallback = ""): string {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === "transparent") return fallback;
    return trimmed;
}

function sanitizeColor(value: any, fallback = "transparent"): string {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
}

function sanitizeGroupLayout(value: any, obj?: any): go.Layout {
    if (value instanceof go.Layout) return value;
    if (typeof value === "string" && value.trim() !== "") {
        try {
            return uid.setGroupLayoutParameters(value.trim());
        } catch (_) {
        }
    }
    const current = obj?.part?.layout;
    if (current instanceof go.Layout) return current;
    return new go.GridLayout();
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
        return go.Link.None;
    }   
}

function shouldPersistLinkPoints(data: any): boolean {
    const points = data?.points;
    if (Array.isArray(points) && points.length >= 4) return true;
    const routing = data?.routing;
    return routing !== 'Orthogonal' && routing !== 'AvoidsNodes';
}

function getLinkAdjusting(data: any, fallback: number): number {
    const points = data?.points;
    const isSelfLoop =
        (data?.from && data?.to && String(data.from) === String(data.to)) ||
        (data?.fromNode?.key && data?.toNode?.key && String(data.fromNode.key) === String(data.toNode.key));
    if (Array.isArray(points) && points.length >= 4) {
        return isSelfLoop ? go.Link.None : go.Link.End;
    }
    // Allow self-loops to be adjusted/reshaped even without pre-existing points
    // so users can manually edit their routing path
    if (isSelfLoop) return go.Link.End;
    return fallback;
}

function getEffectiveLinkRouting(data: any, fallback: any): any {
    const points = data?.points;
    const isSelfLoop =
        (data?.from && data?.to && String(data.from) === String(data.to)) ||
        (data?.fromNode?.key && data?.toNode?.key && String(data.fromNode.key) === String(data.toNode.key));
    if (Array.isArray(points) && points.length >= 4) {
        if (typeof data?.routing === "string" && data.routing.trim() !== "") return getRouting(data.routing);
        if (typeof data?.routing === "number") return data.routing;
        return go.Link.Normal;
    }
    // Self-loops use Orthogonal routing so they can be resegmented (show editing handles)
    if (isSelfLoop) return go.Link.Orthogonal;
    if (typeof data?.routing === "string" && data.routing.trim() !== "") return getRouting(data.routing);
    if (typeof data?.routing === "number") return data.routing;
    return fallback;
}

function normalizeArrowColor(color: any): string {
    if (typeof color !== 'string') return '';
    return color.trim();
}

function getArrowStrokeColor(data: any, arrowSide: 'from' | 'to'): string {
    const arrowColor = normalizeArrowColor(arrowSide === 'from' ? data?.fromArrowColor : data?.toArrowColor);
    const lineColor = normalizeArrowColor(data?.strokecolor);
    if (!arrowColor) return lineColor || 'black';
    if (arrowColor.toLowerCase() === 'white') return lineColor || 'black';
    return arrowColor;
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
const NESTED_GROUP_SIZE_RATIO = 0.35;

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
        new go.Binding("visible", "isSubGraphExpanded", (v) => asBoolean(v, false)).ofObject(),
        new go.Binding("visible", "icon", shouldShowIconPicture),
    )                                
}

function makeSwimlaneHeaderIcon() {
    return $(go.Picture,
        {
            name: "SWIMLANE_HEADER_ICON",
            desiredSize: new go.Size(24, 24),
            alignment: new go.Spot(0.5, 1, 0, -4),
            alignmentFocus: go.Spot.Bottom,
            margin: new go.Margin(0),
            background: "transparent",
            pickable: false,
            opacity: 0,
        },
        new go.Binding("source", "icon", getIconSource),
        new go.Binding("background", "fillcolor2"),
        new go.Binding("opacity", "icon", (icon: any) => shouldShowIconPicture(icon) ? 1 : 0),
        new go.Binding("visible", "isSubGraphExpanded", (v) => asBoolean(v, false)).ofObject(),
        new go.Binding("visible", "icon", shouldShowIconPicture),
    );
}

// Helper function to force update all icon sources in the diagram
// This is needed because GoJS bindings don't always trigger for emoji after reload
export function forceUpdateAllIconSources(diagram: any): void {
  if (!diagram || !diagram.nodes) return;

  for (let it = diagram.nodes; it?.next();) {
    const node = it.value;
    if (!node || !node.data) continue;
    
    const icon = node.data.icon;
    if (!icon) {
      try { node.updateTargetBindings?.(); } catch (_) {}
      continue;
    }

    try {
      const newSource = getIconSource(icon);
      const pictureVisible = shouldShowIconPicture(icon);
      const iconObjectNames = ["Picture", "nodeImage", "SWIMLANE_HEADER_ICON"];
      for (let i = 0; i < iconObjectNames.length; i++) {
        const pictureElement = node.findObject(iconObjectNames[i]);
        if (!pictureElement) continue;
        if (pictureElement.source !== undefined) {
          pictureElement.source = newSource;
        }
        if (pictureElement.visible !== undefined) {
          pictureElement.visible = pictureVisible;
        }
        if (pictureElement.opacity !== undefined && iconObjectNames[i] === "SWIMLANE_HEADER_ICON") {
          pictureElement.opacity = pictureVisible ? 1 : 0;
        }
      }

      try { node.updateTargetBindings?.(); } catch (_) {}
    } catch (_) {
      try { node.updateTargetBindings?.(); } catch (_inner) {}
    }
  }

  try { diagram.updateAllTargetBindings?.('icon'); } catch (_) {}
  try { diagram.requestUpdate?.(); } catch (_) {}
}

function makeGeometry() {
    return $(go.Shape, // a figure (a symbol illustrating what this is all about)         
        new go.Binding("geometryString", "geometry"), 
        new go.Binding("fill", "fillcolor2", (c) => sanitizeColor(c)), 
        {     
            column: 2, 
            margin: new go.Margin(2, 0, 0, 0),
            desiredSize: new go.Size(20, 20),
            alignment: go.Spot.Right,
        },
        new go.Binding("visible", "isSubGraphExpanded", (v) => asBoolean(v, false)).ofObject(),
    )
}

function makeFigure() {
    return $(go.Shape, // a figure (a symbol illustrating what this is all about)         
        new go.Binding("figure", "figure", (v) => sanitizeFigureName(v, "Rectangle")), 
        new go.Binding("fill", "fillcolor2", (c) => sanitizeColor(c)), 
        {     
            column: 2, 
            margin: new go.Margin(2, 0, 0, 0),
            desiredSize: new go.Size(20, 20),
            alignment: go.Spot.Right,
        },
        new go.Binding("visible", "isSubGraphExpanded", (v) => asBoolean(v, false)).ofObject(),
    )
}

function makeFigure2() {
    return $(go.Shape, // a figure (a symbol illustrating what this is all about)         
        new go.Binding("figure2", "figure2"), 
        new go.Binding("fill", "fillcolor2", (c) => sanitizeColor(c)), 
        {     
            column: 2, 
            margin: new go.Margin(2, 0, 0, 0),
            desiredSize: new go.Size(20, 20),
            alignment: go.Spot.Right,
        },
        new go.Binding("visible", "isSubGraphExpanded", (v) => asBoolean(v, false)).ofObject(),
    )
}

function makeNotation(kind: string, props: Record<string, any> = {}) {
    let notation;
    switch(kind) {
        case 'Icon':
            notation = makeGeoIcon();
            break;
        case 'Geometry':
            notation = makeGeometry();
            break;
        case 'Figure':
            notation = makeFigure();
            break;
        default:
            notation = makeGeoIcon();
            break;
    }
    if (notation && props) {
        for (const [key, value] of Object.entries(props)) {
            if (value !== undefined) {
                (notation as any)[key] = value;
            }
        }
    }
    return notation;
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
        new go.Binding("fill", "fillcolor2", (c) => sanitizeColor(c)), 
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
        new go.Binding("figure", "figure", (v) => sanitizeFigureName(v, "Rectangle")), 
        new go.Binding("fill", "fillcolor", (c) => sanitizeColor(c)), 
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
        new go.Binding("fill", "fillcolor2", (c) => sanitizeColor(c)), 
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
            new go.Binding("fill", "fillcolor", (c) => sanitizeColor(c)),
            new go.Binding("stroke", "strokecolor", (c) => sanitizeColor(c, "black")),
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
                new go.Binding("fill", "fillcolor", (c) => sanitizeColor(c)),
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
                    new go.Binding("text", "name").makeTwoWay(),
                    new go.Binding("stroke", "textcolor").makeTwoWay(),
                    new go.Binding("visible", "isSubGraphExpanded", (v) => asBoolean(v, false)).ofObject(),
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
                    new go.Binding("text", "name").makeTwoWay(),
                    new go.Binding("stroke", "textcolor").makeTwoWay(),
                    new go.Binding('visible', 'isSubGraphExpanded', function (e) { return !e; }).ofObject(),
                ),
                makeSwimlaneHeaderIcon(),
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
                    new go.Binding("fill", "fillcolor2", (c) => sanitizeColor(c)),
                    new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),                           
                    new go.Binding('visible', 'isSubGraphExpanded', (v) => asBoolean(v, false)).ofObject(),
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
            new go.Binding("fill", "fillcolor", (c) => sanitizeColor(c)),
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
                new go.Binding("fill", "fillcolor2", (c) => sanitizeColor(c)),
                new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),                           
                new go.Binding('visible', 'isSubGraphExpanded', (v) => asBoolean(v, false)).ofObject(),
            ) ,     
            makeImage("Image"),
            $(go.TextBlock, textStyle(), // the typename  --------------------
            {
                alignment: go.Spot.Bottom,
                alignmentFocus: go.Spot.Bottom,
                height: edgeWidth,
                stretch: go.GraphObject.Horizontal,
                background: "transparent",
                stroke: null,
                cursor: "alias",
                portId: "",
                fromLinkable: true, fromLinkableSelfNode: false, fromLinkableDuplicates: true,
                toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: true,
            },
        ),
    )
}

export function groupTop2(
    contextMenu: any,
    notation: string,
    bodyLinkable: boolean = true,
    restrictBodyHitArea: boolean = false
) {
    const DEBUG_HIT_AREAS = false;
    const edgePortWidth = 12;
    const edgePort = (
        alignment: go.Spot,
        alignmentFocus: go.Spot,
        stretch: go.Stretch,
        size: { width?: number; height?: number },
        spot: go.Spot,
    ) => $(go.Shape, "Rectangle",
        {
            alignment,
            alignmentFocus,
            stretch,
            ...size,
            fill: DEBUG_HIT_AREAS ? "rgba(255, 0, 180, 0.18)" : "transparent",
            stroke: DEBUG_HIT_AREAS ? "rgba(255, 0, 180, 0.5)" : null,
            cursor: "alias",
            portId: "",
            fromLinkable: true,
            fromLinkableSelfNode: false,
            fromLinkableDuplicates: true,
            toLinkable: true,
            toLinkableSelfNode: false,
            toLinkableDuplicates: true,
            fromSpot: spot,
            toSpot: spot,
        },
    );
    const groupFocusStroke = (data: any) => {
        const baseStroke = data?.strokecolor || "lightgray";
        return data?.isFocusPeer ? "lightblue" : baseStroke;
    };
    const groupFocusStrokeWidth = (data: any) => {
        const baseWidth = 2;
        return data?.isFocusPeer ? 3 : baseWidth;
    };
    // Without ports
    return $(go.Panel, "Spot",
        {
            row: 1,
            column: 1,
            name: "BODY",
            stretch: go.GraphObject.Fill,
            isPanelMain: true,
        },
        $(go.Panel, "Auto",
            {
                stretch: go.GraphObject.Fill,
                isPanelMain: true,
                pickable: true,
                background: DEBUG_HIT_AREAS ? "rgba(255, 0, 0, 0.08)" : "transparent",
            },
            $(go.Shape, "RoundedRectangle", // surrounds everything
                {
                    name: "SHAPE",
                    cursor: bodyLinkable ? "alias" : "",
                    fill: DEBUG_HIT_AREAS ? "rgba(255, 255, 0, 0.12)" : "white",
                    shadowVisible: false,
                    minSize: new go.Size(180, 90),
                    strokeWidth: 2,
                    spot1: new go.Spot(0, 0, 3, 3),
                    spot2: new go.Spot(1, 1, -4, -4),
                    portId: bodyLinkable ? "" : null,
                    fromLinkable: bodyLinkable,
                    fromLinkableSelfNode: false,
                    fromLinkableDuplicates: true,
                    toLinkable: bodyLinkable,
                    toLinkableSelfNode: false,
                    toLinkableDuplicates: true,
                },
                new go.Binding("fill", "fillcolor", (c) => sanitizeColor(c)),
                new go.Binding("stroke", "", groupFocusStroke),
                new go.Binding("strokeWidth", "", groupFocusStrokeWidth),
                new go.Binding("desiredSize", "size", function (s) {
                    const parsed = s instanceof go.Size ? s : go.Size.parse(s || "220 120");
                    return new go.Size(
                        Math.max(176, parsed.width - 2),
                        Math.max(86, parsed.height - 2)
                    );
                }).makeTwoWay(function (size) {
                    const parsed = size instanceof go.Size ? size : go.Size.parse(size || "218 118");
                    return go.Size.stringify(new go.Size(
                        Math.max(180, parsed.width + 2),
                        Math.max(90, parsed.height + 2)
                    ));
                }),
            ),
            $(go.Shape, "RoundedRectangle", // Inner shape for moving
                {
                    name: "INNER_MOVE_AREA",
                    cursor: "move",
                    fill: DEBUG_HIT_AREAS ? "rgba(0, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.001)",
                    stroke: DEBUG_HIT_AREAS ? "rgba(0, 160, 160, 0.25)" : "transparent",
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
                        background: DEBUG_HIT_AREAS ? "rgba(128, 0, 255, 0.12)" : "transparent",
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
                        new go.Binding("background", "fillcolor", (c) => sanitizeColor(c)),
                        new go.Binding("text", "name").makeTwoWay(),
                        new go.Binding("stroke", "textcolor").makeTwoWay(),
                        new go.Binding("visible", "isSubGraphExpanded", (v) => asBoolean(v, false)).ofObject(),
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
                        new go.Binding("background", "fillcolor", (c) => sanitizeColor(c)),
                        new go.Binding("text", "name").makeTwoWay(),
                        new go.Binding("stroke", "textcolor").makeTwoWay(),
                        new go.Binding('visible', 'isSubGraphExpanded', function (e) { return !e; }).ofObject(),
                    ),
                ), // End Panel
                $(go.RowColumnDefinition, { row: 1, sizing: go.RowColumnDefinition.None }),
                $(go.Shape, // the shape inside the shape
                    {
                        row: 1,
                        fill: DEBUG_HIT_AREAS ? "rgba(0, 200, 80, 0.16)" : "rgba(128,128,128,0.33)",
                        stroke: DEBUG_HIT_AREAS ? "rgba(0, 120, 40, 0.35)" : "rgba(120,120,120,0.55)",
                        strokeWidth: 1.2,
                        opacity: 0.75,
                        minSize: new go.Size(146, 62),
                        margin: new go.Margin(3, 3, 3, 3),
                        cursor: "move",
                    },
                    new go.Binding("fill", "fillcolor2", (c) => sanitizeColor(c)),
                    new go.Binding("desiredSize", "size", function (s) {
                        const parsed = s instanceof go.Size ? s : go.Size.parse(s || "220 120");
                        return new go.Size(
                            Math.max(72, parsed.width - 16),
                            Math.max(36, parsed.height - 33)
                        );
                    }),
                    new go.Binding("visible", "", function () { return true; }).ofObject(),
                ),
                $(go.Picture,
                    new go.Binding("source", "image", findImage),
                    {
                        row: 1,
                        stretch: go.GraphObject.Fill,
                        margin: new go.Margin(2, 10, 5, 10),
                        alignment: go.Spot.Center,
                        imageStretch: go.GraphObject.Uniform,
                    },
                    new go.Binding('visible', 'isSubGraphExpanded', function (e) { return !e; }).ofObject(),
                ),
                $(go.RowColumnDefinition, { row: 2, height: 6, sizing: go.RowColumnDefinition.None }),
            ),
        ),
        ...(restrictBodyHitArea
            ? [
                edgePort(go.Spot.Top, go.Spot.Top, go.GraphObject.Horizontal, { height: edgePortWidth }, go.Spot.Top),
                edgePort(go.Spot.Bottom, go.Spot.Bottom, go.GraphObject.Horizontal, { height: edgePortWidth }, go.Spot.Bottom),
                edgePort(go.Spot.Left, go.Spot.Left, go.GraphObject.Vertical, { width: edgePortWidth }, go.Spot.Left),
                edgePort(go.Spot.Right, go.Spot.Right, go.GraphObject.Vertical, { width: edgePortWidth }, go.Spot.Right),
            ]
            : []),
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
                    new go.Binding("background", "fillcolor", (c) => sanitizeColor(c)),
                    new go.Binding("text", "name").makeTwoWay(),
                    new go.Binding("stroke", "strokecolor", s => s || "lightgray").makeTwoWay(),
                    new go.Binding("visible", "isSubGraphExpanded", (v) => asBoolean(v, false)).ofObject(),
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
                    new go.Binding("background", "fillcolor", (c) => sanitizeColor(c)),
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

const SWIM_HEADER_WIDTH = 36;
const LANE_HEADER_STRIP_WIDTH = 36;
// Dark enough to be clearly visible even when the diagram background is white.
const SWIM_BORDER_FALLBACK = "#1f1f1f";
const SWIM_SEPARATOR_STROKE = "#000000";
const SWIM_LANE_EDGE_WIDTH = 4;
const SWIM_SEPARATOR_WIDTH = 3;
const POOL_OUTER_BORDER_WIDTH = SWIM_SEPARATOR_WIDTH;
const LANE_SEPARATOR_WIDTH = SWIM_SEPARATOR_WIDTH;
// Visual debugging aid: tint swimlane/pool panels so it is obvious which bounds are structural vs content.
// Keep this off in normal use; it intentionally overrides data-driven fills.
const DEBUG_SWIMLANE_BG = false;

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
    if (rgb && relLuminance(rgb) > 0.55) return SWIM_BORDER_FALLBACK;
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
            new go.Binding("stroke", "", () => "transparent"),
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
            $(go.RowColumnDefinition, { column: 1, stretch: go.Stretch.Fill }),
            // Lane header strip with bottom border overlay
            $(go.Panel, "Spot",
                {
                    name: "LANE_HEADER_STRIP",
                    row: 0,
                    column: 0,
                    width: LANE_HEADER_STRIP_WIDTH,
                    stretch: go.GraphObject.Vertical, // Stretch to match body height
                    alignment: go.Spot.TopLeft,
                    contextMenu: contextMenu,
                    cursor: "move",
                },
                $(go.Shape, "Rectangle", {
                    isPanelMain: true,
                    fill: "white",
                    stroke: "transparent",
                    stretch: go.GraphObject.Fill,
                }),
                // Separator between lane header strip and lane body.
                $(go.Shape, "LineV",
                    {
                        alignment: go.Spot.Right,
                        stretch: go.GraphObject.Vertical,
                        strokeWidth: SWIM_SEPARATOR_WIDTH,
                        strokeCap: "square",
                        pickable: false,
                    },
                    new go.Binding("stroke", "strokecolor", swimStroke),
                ),
                $(go.Panel, "Horizontal",
                    { 
                        angle: 270, 
                        alignment: go.Spot.Center,
                        alignmentFocus: go.Spot.Center,
                    },
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
                            textAlign: "center",
                            verticalAlignment: go.Spot.Center,
                            doubleClick: (e, obj) => e.diagram.commandHandler.editTextBlock(obj as go.TextBlock),
                            name: "name",
                        },
                        new go.Binding("background", "fillcolor", (c) => sanitizeColor(c)),
                        new go.Binding("text", "name").makeTwoWay(),
                        new go.Binding("stroke", "strokecolor").makeTwoWay(),
                    ),
                ),
                makeZoomInvariantExpanderButton(1.0, {
                    width: 22,
                    height: 22,
                    alignment: new go.Spot(1, 0, -6, 4),
                    alignmentFocus: go.Spot.TopRight,
                }),
                makeSwimlaneHeaderIcon(),
                // Bottom border overlay within lane header
                $(go.Shape, "Rectangle",
                    {
                        isPanelMain: false,
                        alignment: go.Spot.Bottom,
                        alignmentFocus: go.Spot.Bottom,
                        stretch: go.GraphObject.Horizontal,
                        height: SWIM_SEPARATOR_WIDTH,
                        pickable: false,
                        fill: SWIM_SEPARATOR_STROKE,
                        stroke: "transparent",
                    },
                ),
            ),
            // Body panel fills the Table column, and LANE_BODY_SHAPE fills the panel.
            // Sizing is controlled by GROUP desiredSize binding and Table column layout.
            $(go.Panel, "Spot",
                {
                    name: "BODY",
                    row: 0,
                    column: 1,
                    margin: new go.Margin(0),
                    alignment: go.Spot.TopLeft,
                },
                $(go.Shape, "Rectangle",
                    {
                        name: "LANE_BODY_SHAPE",
                        isPanelMain: true, // This controls the panel size, preventing Placeholder from expanding it
                        cursor: "move",
                        fill: "white",
                        // The body is only visual; clicks must reach members in the lane.
                        pickable: false,
                        stroke: "transparent",
                        strokeWidth: 0,
                    },
                    // Explicit size from data.size to prevent auto-sizing from members
                    new go.Binding("desiredSize", "size", (sz: string) => {
                        const size = go.Size.parse(sz);
                        return new go.Size(Math.max(160, size.width), Math.max(65, size.height));
                    }),
                ),
                $(go.Picture,
                    {
                        name: "LANE_BODY_IMAGE",
                        stretch: go.GraphObject.Fill,
                        imageStretch: go.GraphObject.Fill,
                        alignment: go.Spot.Center,
                        opacity: 0.95,
                        pickable: false,
                    },
                    new go.Binding("source", "image", findImage),
                    new go.Binding("visible", "isSubGraphExpanded", (expanded: boolean, pict: any) => {
                        const img = findImage(pict?.part?.data?.image);
                        return Boolean(img) && !expanded;
                    }).ofObject(),
                ),
                // Placeholder for member nodes - no stretch so it doesn't affect lane body size
                $(go.Placeholder, { 
                    padding: new go.Margin(0, 0, 0, 0), 
                    alignment: go.Spot.TopLeft 
                }),
                // Bottom border overlay on lane body
                $(go.Shape, "Rectangle",
                    {
                        isPanelMain: false,
                        alignment: go.Spot.Bottom,
                        alignmentFocus: go.Spot.Bottom,
                        stretch: go.GraphObject.Horizontal,
                        height: SWIM_SEPARATOR_WIDTH,
                        pickable: false,
                        fill: SWIM_SEPARATOR_STROKE,
                        stroke: "transparent",
                    },
                ),
            ),
            // Right lane border
            $(go.Shape, "Rectangle",
                {
                    isPanelMain: false,
                    row: 0,
                    column: 1,
                    alignment: go.Spot.Right,
                    alignmentFocus: go.Spot.Right,
                    stretch: go.GraphObject.Vertical,
                    width: SWIM_SEPARATOR_WIDTH,
                    pickable: false,
                    fill: SWIM_SEPARATOR_STROKE,
                    stroke: "transparent",
                },
            ),
        ),
    );
}

export function poolTop(contextMenu: any, notation: string, textscale: number) {
    return $(go.Panel, "Spot",
        $(go.Shape, "Rectangle",
            {
                name: "POOL_SHAPE",
                isPanelMain: true,
                cursor: "move",
                pickable: false,
                fill: "transparent",
                strokeWidth: 0,
                strokeCap: "square",
                strokeJoin: "miter",
                minSize: new go.Size(200, 100),
            },
            new go.Binding("stroke", "", () => "transparent"),
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        ),
        $(go.Panel, "Table",
            {
                stretch: go.GraphObject.Fill,
                // Ensure the whole table is anchored to the pool shape, not centered within it.
                alignment: go.Spot.TopLeft,
                alignmentFocus: go.Spot.TopLeft,
                defaultAlignment: go.Spot.TopLeft,
                // Only left margin for pool header border; top/bottom would make pool too short.
                margin: new go.Margin(0, 0, 0, SWIM_SEPARATOR_WIDTH),
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
                    desiredSize: new go.Size(SWIM_HEADER_WIDTH, 100),
                    stretch: go.GraphObject.Fill,
                    // No margin - Table handles inset for borders.
                    margin: new go.Margin(0),
                    contextMenu: contextMenu,
                    cursor: "move",
                },
                new go.Binding("desiredSize", "size", (s: any) => {
                    const parsed = go.Size.parse(typeof s === "string" ? s : "");
                    const height = Number(parsed?.height);
                    return new go.Size(
                        SWIM_HEADER_WIDTH,
                        Number.isFinite(height) && height > 0 ? height : 100,
                    );
                }),
                $(go.Shape, "Rectangle", {
                    fill: dbgFill("#f3f3f3", "rgba(160, 90, 255, 0.10)"),
                    strokeWidth: 0,
                    stretch: go.GraphObject.Fill,
                },
                new go.Binding("stroke", "", () => "transparent"),
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
                            doubleClick: (e, obj) => e.diagram.commandHandler.editTextBlock(obj as go.TextBlock),
                            name: "name",
                        },
                        new go.Binding("background", "fillcolor", (c) => sanitizeColor(c)),
                        new go.Binding("text", "name").makeTwoWay(),
                        new go.Binding("stroke", "strokecolor").makeTwoWay(),
                        new go.Binding("visible", "isSubGraphExpanded", (v) => asBoolean(v, false)).ofObject(),
                    ),
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
                            doubleClick: (e, obj) => e.diagram.commandHandler.editTextBlock(obj as go.TextBlock),
                            name: "name",
                        },
                        new go.Binding("background", "fillcolor", (c) => sanitizeColor(c)),
                        new go.Binding("text", "name").makeTwoWay(),
                        new go.Binding("stroke", "strokecolor").makeTwoWay(),
                        new go.Binding("visible", "isSubGraphExpanded", function (e) { return !e; }).ofObject(),
                    ),
                ),
                makeZoomInvariantExpanderButton(1.0, {
                    width: 22,
                    height: 22,
                    alignment: new go.Spot(1, 0, -6, 4),
                    alignmentFocus: go.Spot.TopRight,
                }),
                makeSwimlaneHeaderIcon(),
                // Vertical separator between pool header and lanes.
                $(go.Shape, "LineV",
                    {
                        alignment: go.Spot.Right,
                        stretch: go.GraphObject.Vertical,
                        strokeWidth: SWIM_SEPARATOR_WIDTH,
                        strokeCap: "square",
                        stroke: SWIM_SEPARATOR_STROKE,
                        pickable: false,
                    },
                ),
            ),
            $(go.Panel, "Spot",
                {
                    name: "POOL_CONTENT_PANEL",
                    row: 0,
                    column: 1,
                    stretch: go.GraphObject.Fill,
                    pickable: false,
                    // No margin - Table handles inset for borders.
                    margin: new go.Margin(0),
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
                    $(go.Picture,
                        {
                            name: "POOL_CONTENT_IMAGE",
                            stretch: go.GraphObject.Fill,
                            imageStretch: go.GraphObject.Fill,
                            alignment: go.Spot.Center,
                            opacity: 0.95,
                            pickable: false,
                        },
                        new go.Binding("source", "image", findImage),
                        new go.Binding("visible", "isSubGraphExpanded", (expanded: boolean, pict: any) => {
                            const img = findImage(pict?.part?.data?.image);
                            return Boolean(img) && !expanded;
                        }).ofObject(),
                    ),
                    $(go.Placeholder,
                        {
                            name: "POOL_CONTENT_ANCHOR",
                            stretch: go.GraphObject.Fill,
                            pickable: false,
                            // No padding - lanes fill the full pool height.
                            padding: new go.Margin(0),
                            alignment: go.Spot.TopLeft,
                        },
                    ),
                ),
            ),
        ),
        // Border overlays - render on top of lanes
        $(go.Shape, "Rectangle",
            {
                name: "POOL_BORDER_TOP",
                isPanelMain: false,
                alignment: go.Spot.Top,
                alignmentFocus: go.Spot.Top,
                stretch: go.GraphObject.Horizontal,
                height: SWIM_SEPARATOR_WIDTH,
                pickable: false,
                fill: SWIM_SEPARATOR_STROKE,
                stroke: "transparent",
            },
        ),
        $(go.Shape, "Rectangle",
            {
                name: "POOL_BORDER_LEFT",
                isPanelMain: false,
                alignment: go.Spot.Left,
                alignmentFocus: go.Spot.Left,
                stretch: go.GraphObject.Vertical,
                width: SWIM_SEPARATOR_WIDTH,
                pickable: false,
                fill: SWIM_SEPARATOR_STROKE,
                stroke: "transparent",
            },
        ),
        $(go.Shape, "Rectangle",
            {
                name: "POOL_BORDER_RIGHT",
                isPanelMain: false,
                alignment: go.Spot.Right,
                alignmentFocus: go.Spot.Right,
                stretch: go.GraphObject.Vertical,
                width: SWIM_SEPARATOR_WIDTH,
                pickable: false,
                fill: SWIM_SEPARATOR_STROKE,
                stroke: "transparent",
            },
        ),
        $(go.Shape, "Rectangle",
            {
                name: "POOL_BORDER_BOTTOM",
                isPanelMain: false,
                alignment: go.Spot.Bottom,
                alignmentFocus: go.Spot.Bottom,
                stretch: go.GraphObject.Horizontal,
                height: SWIM_SEPARATOR_WIDTH,
                pickable: false,
                fill: SWIM_SEPARATOR_STROKE,
                stroke: "transparent",
            },
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
    if (groupName === "Pool" || groupName === "Lane") {
        return $(go.Adornment, "Spot",
            $(go.Placeholder),
            $(go.Shape, { alignment: go.Spot.TopLeft, fill: "lightblue", stroke: "dodgerblue", cursor: "nw-resize" }, scaledAdornmentSize(8, 8)),
            $(go.Shape, { alignment: go.Spot.Top, fill: "lightblue", stroke: "dodgerblue", cursor: "n-resize" }, scaledAdornmentSize(8, 8)),
            $(go.Shape, { alignment: go.Spot.TopRight, fill: "lightblue", stroke: "dodgerblue", cursor: "ne-resize" }, scaledAdornmentSize(8, 8)),
            $(go.Shape, { alignment: go.Spot.Right, fill: "lightblue", stroke: "dodgerblue", cursor: "e-resize" }, scaledAdornmentSize(8, 8)),
            $(go.Shape, { alignment: go.Spot.BottomRight, fill: "lightblue", stroke: "dodgerblue", cursor: "se-resize" }, scaledAdornmentSize(8, 8)),
            $(go.Shape, { alignment: go.Spot.Bottom, fill: "lightblue", stroke: "dodgerblue", cursor: "s-resize" }, scaledAdornmentSize(8, 8)),
            $(go.Shape, { alignment: go.Spot.BottomLeft, fill: "lightblue", stroke: "dodgerblue", cursor: "sw-resize" }, scaledAdornmentSize(8, 8)),
            $(go.Shape, { alignment: go.Spot.Left, fill: "lightblue", stroke: "dodgerblue", cursor: "w-resize" }, scaledAdornmentSize(8, 8))
        );
    }
    if (
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
    const DEBUG_HIT_AREAS = false;
    return $(go.Panel, "Vertical", 
            new go.Binding("itemArray", "leftPorts"),
            {
                row: 1, 
                column: 0,
                itemTemplate: makeItemTemplate('left', true, portContextMenu),
                alignment: new go.Spot(0, 0.5, offsetX, offsetY), 
                alignmentFocus: go.Spot.Right,
                defaultAlignment: go.Spot.Right,
                background: DEBUG_HIT_AREAS ? "rgba(0, 128, 255, 0.12)" : "transparent",
                pickable: true,
            },
    );  // end leftPorts Panel
}

function addTopPorts(portContextMenu: any, offsetX: number = 0, offsetY: number = 0) {
    const DEBUG_HIT_AREAS = false;
    return $(go.Panel, "Horizontal",
            new go.Binding("itemArray", "topPorts"),
            {
                row: 0, 
                column: 0,
                itemTemplate: makeItemTemplate('top', true, portContextMenu),
                minSize: new go.Size(NaN, 72),
                margin: new go.Margin(44, 0, 0, 0),
                alignment: new go.Spot(0.5, 0, offsetX, offsetY - 12),
                background: DEBUG_HIT_AREAS ? "rgba(0, 255, 128, 0.12)" : "transparent",
                pickable: true,
            }
    );  // end topPorts Panel
}
    
function addRightPorts(portContextMenu: any, offsetX: number = 0, offsetY: number = 0) {
    const DEBUG_HIT_AREAS = false;
    return $(go.Panel, "Vertical", 
            new go.Binding("itemArray", "rightPorts"),
                {
                    row: 1, 
                    column: 2,
                    itemTemplate: makeItemTemplate('right', true, portContextMenu),
                    alignment: new go.Spot(1, 0.5, offsetX, offsetY), 
                    alignmentFocus: go.Spot.Left,
                    defaultAlignment: go.Spot.Left,
                    background: DEBUG_HIT_AREAS ? "rgba(255, 128, 0, 0.12)" : "transparent",
                    pickable: true,
                }
            );  // end rightPorts Panel
}

function addBottomPorts(portContextMenu: any, offsetX: number = 0, offsetY: number = 0) {
    const DEBUG_HIT_AREAS = false;
    return $(go.Panel, "Horizontal",
            new go.Binding("itemArray", "bottomPorts"),
            {
                row: 0, 
                column: 0,
                itemTemplate: makeItemTemplate('bottom', true, portContextMenu),
                minSize: new go.Size(NaN, 72),
                margin: new go.Margin(0, 0, 44, 0),
                alignment: new go.Spot(0.5, 1, offsetX, offsetY + 12),
                background: DEBUG_HIT_AREAS ? "rgba(255, 0, 128, 0.12)" : "transparent",
                pickable: true,
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
                return "M0 4 L16 4";
            case "right":
                return "M0 4 L16 4";
            case "top":
                return "M8 0 L8 16";
            case "bottom":
                return "M8 0 L8 16";
            default:
                return "M0 4 L16 4";
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
    return "black";
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
    const openPortNameEditor = (e: go.InputEvent, obj: go.GraphObject) => {
        const diagram: any = obj?.diagram;
        if (diagram?.handleChangePortName) {
            diagram.handleChangePortName(diagram, obj);
            e.handled = true;
        }
    };
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
        const labelWidth = 88;
        const lineWidth = 10;
        const routingGap = 10;
        const labelOffset = 12;
        const rowHeight = 28;
        const lineShape =
            $(go.Shape, "LineH",
                {
                    name: "SHAPE",
                    fill: "transparent",
                    stroke: DEBUG_ICOM_LAYOUT ? "orange" : "gray",
                    strokeWidth: DEBUG_ICOM_LAYOUT ? 2 : getIcomStrokeWidth("idef"),
                    desiredSize: new go.Size(lineWidth, 1),
                    alignment: go.Spot.Center,
                    alignmentFocus: go.Spot.Center,
                    cursor: "pointer",
                    contextMenu: portContextMenu,
                    portId: "",
                    fromLinkable: !isLeft,
                    toLinkable: isLeft,
                    fromLinkableSelfNode: false,
                    fromLinkableDuplicates: true,
                    toLinkableSelfNode: false,
                    toLinkableDuplicates: true,
                    fromSpot: go.Spot.Right,
                    toSpot: go.Spot.Left,
                },
                new go.Binding("portId", "", function(d) {
                    return d?.id || d?.portId || "";
                }),
                new go.Binding("desiredSize", "", function(_d, obj) {
                    const style = resolveIcomStyle(obj);
                    obj.desiredSize = style === "idef"
                        ? new go.Size(lineWidth, 1)
                        : getSideMarkerVisualSize(isGroup, style);
                    obj.fill = "transparent";
                    obj.stroke = getIcomStroke(_d, style);
                    obj.strokeWidth = getIcomStrokeWidth(style);
                    return obj.desiredSize;
                }),
            );
        const gapPanel = $(go.Panel, "Auto",
            {
                width: routingGap,
                minSize: new go.Size(routingGap, rowHeight),
                pickable: false,
                background: DEBUG_ICOM_LAYOUT ? "rgba(128, 0, 255, 0.12)" : "transparent",
            },
        );
        const sidePortHitArea = $(go.Shape, "Rectangle",
            {
                name: "PORT_HIT_AREA",
                alignment: isLeft ? go.Spot.Right : go.Spot.Left,
                alignmentFocus: isLeft ? go.Spot.Right : go.Spot.Left,
                width: lineWidth + 8,
                height: Math.max(12, rowHeight - 6),
                fill: DEBUG_ICOM_LAYOUT ? "rgba(0, 120, 255, 0.25)" : "rgba(0, 0, 0, 0.001)",
                stroke: DEBUG_ICOM_LAYOUT ? "rgba(0, 120, 255, 0.9)" : "transparent",
                strokeWidth: DEBUG_ICOM_LAYOUT ? 1 : 0,
                cursor: "pointer",
                contextMenu: portContextMenu,
                portId: "",
                fromLinkable: !isLeft,
                toLinkable: isLeft,
                fromLinkableSelfNode: false,
                fromLinkableDuplicates: true,
                toLinkableSelfNode: false,
                toLinkableDuplicates: true,
                fromSpot: go.Spot.Right,
                toSpot: go.Spot.Left,
            },
            new go.Binding("portId", "", function(d) {
                return d?.id || d?.portId || "";
            }),
        );
        const labelBlock = $(go.TextBlock,
            {
                name: "PORT_LABEL_TEXT",
                width: labelWidth,
                minSize: new go.Size(labelWidth, rowHeight),
                maxSize: new go.Size(labelWidth, NaN),
                alignment: go.Spot.Center,
                alignmentFocus: go.Spot.Center,
                font: font,
                angle: textangle,
                textAlign: isLeft ? "right" : "left",
                wrap: go.TextBlock.WrapFit,
                overflow: go.TextBlock.OverflowEllipsis,
                background: DEBUG_ICOM_LAYOUT ? "rgba(255, 255, 0, 0.18)" : "transparent",
                opacity: DEBUG_ICOM_LAYOUT ? 1 : 0.9,
                margin: isLeft ? new go.Margin(3, 2, 3, 0) : new go.Margin(3, 0, 3, 2),
                editable: true,
                isMultiline: true,
                maxLines: 2,
                verticalAlignment: go.Spot.Top,
                cursor: "text",
                contextMenu: portContextMenu,
                isActionable: false,
                pickable: true,
            },
            new go.Binding("text", "name"),
            new go.Binding('scale', 'textscale').makeTwoWay(),
        );
        return $(go.Panel, "Spot",
            {
                margin: new go.Margin(0, 0),
                alignment: isLeft ? new go.Spot(0, 0.5, 0, 0) : new go.Spot(1, 0.5, 0, 0),
                alignmentFocus: isLeft ? go.Spot.Left : go.Spot.Right,
                background: DEBUG_ICOM_LAYOUT ? "rgba(0, 180, 255, 0.18)" : "transparent",
                isPanelMain: false,
                pickable: true,
                cursor: "pointer",
                contextMenu: portContextMenu,
                doubleClick: openPortNameEditor,
                portId: "",
                fromLinkable: !isLeft,
                toLinkable: isLeft,
                fromLinkableSelfNode: false,
                fromLinkableDuplicates: true,
                toLinkableSelfNode: false,
                toLinkableDuplicates: true,
                fromSpot: go.Spot.Right,
                toSpot: go.Spot.Left,
            },
            new go.Binding("portId", "", function(d) {
                return d?.id || d?.portId || "";
            }),
            ...(isLeft
                ? [
                    $(go.Panel, "Auto",
                        {
                            alignment: go.Spot.Right,
                            alignmentFocus: go.Spot.Right,
                            width: lineWidth,
                            minSize: new go.Size(lineWidth, rowHeight),
                            background: DEBUG_ICOM_LAYOUT ? "rgba(255, 0, 0, 0.18)" : "transparent",
                            pickable: false,
                        },
                        lineShape,
                    ),
                    sidePortHitArea,
                    $(go.Shape, "Rectangle",
                        {
                            alignment: new go.Spot(1, 0.5, 0, 0),
                            alignmentFocus: go.Spot.Right,
                            width: lineWidth,
                            height: 10,
                            fill: DEBUG_ICOM_LAYOUT ? "rgba(0, 120, 255, 0.45)" : "transparent",
                            stroke: DEBUG_ICOM_LAYOUT ? "rgba(0, 120, 255, 0.9)" : "transparent",
                            strokeWidth: DEBUG_ICOM_LAYOUT ? 1 : 0,
                            pickable: false,
                        },
                    ),
                    $(go.Panel, "Auto",
                        {
                            alignment: new go.Spot(1, 0.5, -(lineWidth + 1), 0),
                            alignmentFocus: go.Spot.Right,
                            pickable: false,
                        },
                        gapPanel,
                    ),
                    $(go.Panel, "Auto",
                        {
                            alignment: new go.Spot(1, 0.5, -(lineWidth + routingGap + 1), 0),
                            alignmentFocus: go.Spot.Right,
                            pickable: false,
                        },
                        labelBlock,
                    )
                ]
                : [
                    $(go.Panel, "Auto",
                        {
                            alignment: new go.Spot(0, 0.5, -2, 0),
                            alignmentFocus: go.Spot.Left,
                            width: lineWidth,
                            minSize: new go.Size(lineWidth, rowHeight),
                            background: DEBUG_ICOM_LAYOUT ? "rgba(255, 99, 71, 0.28)" : "transparent",
                            pickable: false,
                        },
                        lineShape,
                    ),
                    sidePortHitArea,
                    $(go.Shape, "Rectangle",
                        {
                            alignment: new go.Spot(0, 0.5, 0, 0),
                            alignmentFocus: go.Spot.Left,
                            width: lineWidth,
                            height: 10,
                            fill: DEBUG_ICOM_LAYOUT ? "rgba(30, 144, 255, 0.45)" : "transparent",
                            stroke: DEBUG_ICOM_LAYOUT ? "rgba(0, 90, 200, 0.9)" : "transparent",
                            strokeWidth: DEBUG_ICOM_LAYOUT ? 1 : 0,
                            pickable: false,
                        },
                    ),
                    $(go.Panel, "Auto",
                        {
                            alignment: new go.Spot(0, 0.5, 20, 0),
                            alignmentFocus: go.Spot.Left,
                            background: DEBUG_ICOM_LAYOUT ? "rgba(255, 215, 0, 0.24)" : "transparent",
                            pickable: false,
                        },
                        labelBlock,
                    ),
                    $(go.Panel, "Auto",
                        {
                            alignment: new go.Spot(1, 0.5, routingGap, 0),
                            alignmentFocus: go.Spot.Right,
                            background: DEBUG_ICOM_LAYOUT ? "rgba(186, 85, 211, 0.24)" : "transparent",
                            pickable: false,
                        },
                        gapPanel,
                    ),
                ]),
        );
    }
    if (topside || bottomside) {
        const isTop = topside;
        const topBottomWidth = 24;
        const topBottomLabelWidth = 80;
        const markerThickness = 2;
        const markerLength = Math.max(10, getIcomPortSize(isGroup, "idef").height - 4);
        const topBottomStripHeight = 12;
        const topBottomShape =
            $(go.Shape,
                {
                    name: "SHAPE",
                    fill: DEBUG_ICOM_LAYOUT ? "rgba(255, 165, 0, 0.35)" : "transparent",
                    stroke: DEBUG_ICOM_LAYOUT ? "orange" : "gray",
                    strokeWidth: DEBUG_ICOM_LAYOUT ? 2 : getIcomStrokeWidth("idef"),
                    geometryString: getIcomGeometry(side, "idef"),
                    desiredSize: new go.Size(markerThickness, markerLength),
                    alignment: isTop ? go.Spot.Center : go.Spot.Top,
                    alignmentFocus: isTop ? go.Spot.Center : go.Spot.Top,
                    cursor: "pointer",
                    contextMenu: portContextMenu,
                    portId: "",
                    fromLinkable: true,
                    toLinkable: true,
                    fromLinkableSelfNode: false,
                    fromLinkableDuplicates: true,
                    toLinkableSelfNode: false,
                    toLinkableDuplicates: true,
                    toSpot: isTop ? go.Spot.Top : go.Spot.Bottom,
                    fromSpot: isTop ? go.Spot.Top : go.Spot.Bottom,
                },
                new go.Binding("portId", "", function(d) {
                    return d?.id || d?.portId || "";
                }),
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
        const topBottomPort =
            $(go.Shape, "Rectangle",
                {
                    width: 16,
                    height: 16,
                    fill: DEBUG_ICOM_LAYOUT ? "rgba(0, 120, 255, 0.45)" : "transparent",
                    stroke: DEBUG_ICOM_LAYOUT ? "rgba(0, 120, 255, 0.9)" : "transparent",
                    strokeWidth: DEBUG_ICOM_LAYOUT ? 1 : 0,
                    alignment: isTop ? new go.Spot(0.5, 0.5, 0, 4) : new go.Spot(0.5, 0, -1, 1),
                    alignmentFocus: isTop ? go.Spot.Center : go.Spot.Top,
                    portId: "",
                    toLinkable: true,
                    fromLinkable: true,
                    toSpot: isTop ? go.Spot.Top : go.Spot.Bottom,
                    fromSpot: isTop ? go.Spot.Top : go.Spot.Bottom,
                    cursor: "pointer",
                    contextMenu: portContextMenu,
                },
                new go.Binding("portId", "", function(d) {
                    return d?.id || d?.portId || "";
                }),
            );
        const markerPanel = $(go.Panel, "Spot",
            {
                width: topBottomWidth,
                height: topBottomStripHeight + 1,
                defaultAlignment: go.Spot.Center,
                alignment: go.Spot.Center,
                alignmentFocus: go.Spot.Center,
                background: DEBUG_ICOM_LAYOUT ? "rgba(255, 0, 0, 0.18)" : "transparent",
            },
            DEBUG_ICOM_LAYOUT
                ? $(go.Shape, "Rectangle", {
                    fill: "transparent",
                    stroke: "red",
                    strokeWidth: 1,
                    width: topBottomWidth - 2,
                    height: topBottomStripHeight - 3,
                    alignment: new go.Spot(0.5, 0.5, 0, -1),
                    pickable: false,
                  })
                : $(go.Shape, "Rectangle", {
                    fill: "transparent",
                    stroke: "transparent",
                    strokeWidth: 0,
                    width: topBottomWidth,
                    height: topBottomStripHeight,
                    pickable: false,
                  }),
            topBottomShape,
            topBottomPort,
        );
        const topBottomText =
            $(go.TextBlock,
                {
                    name: "PORT_LABEL_TEXT",
                    width: topBottomLabelWidth,
                    minSize: new go.Size(topBottomLabelWidth, 34),
                    maxSize: new go.Size(topBottomLabelWidth, NaN),
                    font: font,
                    angle: textangle,
                    alignment: go.Spot.Center,
                    textAlign: "center",
                    wrap: go.TextBlock.WrapFit,
                    overflow: go.TextBlock.OverflowEllipsis,
                    verticalAlignment: isTop ? go.Spot.Bottom : go.Spot.Top,
                    background: DEBUG_ICOM_LAYOUT ? "rgba(255, 255, 0, 0.18)" : "transparent",
                    opacity: DEBUG_ICOM_LAYOUT ? 1 : 0.9,
                    margin: new go.Margin(2, 2, 2, 2),
                    editable: true,
                    isMultiline: true,
                    maxLines: 2,
                    cursor: "text",
                    contextMenu: portContextMenu,
                },
                new go.Binding("text", "name"),
                new go.Binding('scale', 'textscale').makeTwoWay(),
            );
        const stripPanel = $(go.Panel, "Spot",
            {
                width: topBottomWidth,
                height: topBottomStripHeight,
                alignment: isTop ? new go.Spot(0.5, 1, 0, -7) : new go.Spot(0.5, 0, 0, 4),
                alignmentFocus: isTop ? go.Spot.Bottom : go.Spot.Top,
                background: DEBUG_ICOM_LAYOUT ? "rgba(0, 180, 255, 0.18)" : "transparent",
            },
            DEBUG_ICOM_LAYOUT
                ? $(go.Shape, "Rectangle", {
                    fill: "transparent",
                    stroke: "cyan",
                    strokeWidth: 1,
                    width: topBottomWidth - 1,
                    height: topBottomStripHeight - 1,
                    pickable: false,
                  })
                : $(go.Shape, "Rectangle", {
                    fill: "transparent",
                    stroke: "transparent",
                    strokeWidth: 0,
                    width: topBottomWidth,
                    height: topBottomStripHeight,
                    pickable: false,
                  }),
            markerPanel,
        );
        const textPanel = $(go.Panel, "Auto",
            {
                alignment: isTop ? new go.Spot(0.5, 0, 0, -12) : new go.Spot(0.5, 1, 0, 14),
                alignmentFocus: isTop ? go.Spot.Bottom : go.Spot.Top,
                margin: new go.Margin(0, 2, 0, 2),
                pickable: false,
            },
            topBottomText,
        );
        return $(go.Panel, "Spot",
            {
                margin: new go.Margin(4, 2, 4, 2),
                alignment: isTop ? new go.Spot(0.5, 1, 0, -7) : new go.Spot(0.5, 0, 0, 6),
                alignmentFocus: isTop ? go.Spot.Bottom : go.Spot.Top,
                cursor: "pointer",
                portId: "",
                toLinkable: true,
                fromLinkable: true,
                fromLinkableSelfNode: false,
                fromLinkableDuplicates: true,
                toLinkableSelfNode: false,
                toLinkableDuplicates: true,
                toSpot: isTop ? go.Spot.Top : go.Spot.Bottom,
                fromSpot: isTop ? go.Spot.Top : go.Spot.Bottom,
            },
            new go.Binding("portId", "", function(d) {
                return d?.id || d?.portId || "";
            }),
            stripPanel,
            textPanel,
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
                name: "PORT_LABEL_TEXT",
                font: font,
                angle: textangle,
                alignment: textAlignment,
                textAlign: textBlockAlign,
                margin: textMargin,
                editable: true,
                isMultiline: false,
                cursor: "text",
                contextMenu: portContextMenu,
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
    
    const computeLaneContentSize = (lane: go.Group) => {
        const frame = (lane.findObject("LANE_TABLE") || lane) as go.GraphObject;
        const body = lane.resizeObject || lane.findObject("LANE_BODY_SHAPE") || lane;
        const frameBounds = frame.getDocumentBounds();
        const bodyBounds = body.getDocumentBounds();
        let width = MINLENGTH;
        let height = lane.isSubGraphExpanded ? MINBREADTH : 1;
        lane.memberParts.each((member: go.Part) => {
            if (!(member instanceof go.Node) || member instanceof go.Group) return;
            width = Math.max(width, Math.ceil(member.actualBounds.right - bodyBounds.left + 16));
            height = Math.max(height, Math.ceil(member.actualBounds.bottom - frameBounds.top + 16));
        });
        return new go.Size(width, height);
    };

    // compute the minimum size of a Pool Group needed to hold all of the Lane Groups
    function computeMinPoolSize(pool: go.Group) {
        let len = MINLENGTH;
        pool.memberParts.each(function (lane) {
            if (!(lane instanceof go.Group)) return;
            const data = lane.data || {};
            const template = String(data.template || data.category || lane.category || "");
            const isLane = template === "Lane" || template === "Lane_w_handles" || template.startsWith("Lane");
            if (!isLane) return;
            len = Math.max(len, computeLaneContentSize(lane).width);
        });
        return new go.Size(len, NaN);
    }
    
    // compute the minimum size for a particular Lane Group
    function computeLaneSize(lane: go.Group) {
        const sz = computeMinLaneSize(lane);
        const contentSize = computeLaneContentSize(lane);
        sz.width = Math.max(sz.width, contentSize.width);
        sz.height = Math.max(sz.height, contentSize.height);
        // minimum breadth needs to be big enough to hold the header
        const hdr = lane.findObject('HEADER');
        if (hdr !== null) sz.height = Math.max(sz.height, hdr.actualBounds.height);
        return sz;
    }

    const syncPoolFrameToLanes = (pool: go.Group) => {
        const lanes: go.Group[] = [];
        pool.memberParts.each((part: go.Part) => {
            if (!(part instanceof go.Group)) return;
            const data = part.data || {};
            if (!(part.category === "Lane" || data.category === "Lane" || data.template === "Lane")) return;
            lanes.push(part);
        });
        if (lanes.length === 0) return;
        let bodyWidth = MINLENGTH;
        let totalHeight = 0;
        lanes.forEach((lane) => {
            const shape = lane.resizeObject;
            const dataSize = go.Size.parse(String(lane.data?.size || ""));
            const width = Number.isFinite(shape?.desiredSize.width) && shape!.desiredSize.width > 0
                ? shape!.desiredSize.width
                : dataSize.width;
            const height = Number.isFinite(shape?.desiredSize.height) && shape!.desiredSize.height > 0
                ? shape!.desiredSize.height
                : dataSize.height;
            if (Number.isFinite(width) && width > 0) bodyWidth = Math.max(bodyWidth, width);
            if (Number.isFinite(height) && height > 0) totalHeight += height;
        });
        const poolBodyWidth = SWIM_HEADER_WIDTH + bodyWidth;
        const poolBody = pool.findObject("POOL_BODY_SHAPE") as go.Shape | null;
        if (poolBody) {
            poolBody.desiredSize = new go.Size(poolBodyWidth, Math.max(MINBREADTH, totalHeight));
        }
        if (pool.data && pool.diagram) {
            const poolSize = new go.Size(
                SWIM_HEADER_WIDTH + poolBodyWidth,
                Math.max(MINBREADTH, totalHeight)
            );
            pool.diagram.model.setDataProperty(pool.data, "size", go.Size.stringify(poolSize));
            if (pool.data.objectview) pool.data.objectview.size = go.Size.stringify(poolSize);
        }
    };

    // A Pool and all of its Lanes share one right edge.  Keep the lane body size
    // as the canonical value; the Pool body has one additional lane-header column.
    const resizePoolAndLanes = (pool: go.Group, requestedLaneBodyWidth: number) => {
        const laneBodyWidth = Math.max(requestedLaneBodyWidth, computeMinPoolSize(pool).width);
        pool.memberParts.each((part: go.Part) => {
            if (!(part instanceof go.Group)) return;
            const template = String(part.data?.template || part.data?.category || part.category || "");
            if (!(template === "Lane" || template === "Lane_w_handles" || template.startsWith("Lane"))) return;
            const shape = part.resizeObject as go.Shape | null;
            if (!shape) return;
            const height = Math.max(MINBREADTH, shape.desiredSize.height || shape.actualBounds.height || MINBREADTH);
            const size = new go.Size(laneBodyWidth, height);
            shape.desiredSize = size;
            if (part.data) {
                pool.diagram?.model.setDataProperty(part.data, "size", go.Size.stringify(size));
                if (part.data.objectview) part.data.objectview.size = go.Size.stringify(size);
            }
        });

        const poolBody = pool.findObject("POOL_BODY_SHAPE") as go.Shape | null;
        if (poolBody && pool.data) {
            const height = Math.max(MINBREADTH, poolBody.desiredSize.height || poolBody.actualBounds.height || MINBREADTH);
            const bodySize = new go.Size(SWIM_HEADER_WIDTH + laneBodyWidth, height);
            poolBody.desiredSize = bodySize;
            const poolSize = new go.Size(SWIM_HEADER_WIDTH + bodySize.width, height);
            pool.diagram?.model.setDataProperty(pool.data, "size", go.Size.stringify(poolSize));
            if (pool.data.objectview) pool.data.objectview.size = go.Size.stringify(poolSize);
        }
        pool.ensureBounds();
        pool.diagram?.requestUpdate();
        return laneBodyWidth;
    };
    
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
        if (lane.category === "Pool" || lane.data?.category === "Pool" || lane.data?.template === "Pool") {
          const min = go.ResizingTool.prototype.computeMinSize.call(this);
          const contentMin = computeMinPoolSize(lane).width;
          // The Pool resize object includes the lane header column.
          min.width = Math.max(min.width, SWIM_HEADER_WIDTH + contentMin);
          return min;
        }
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
        const category = String(lane.data?.template || lane.data?.category || lane.category || "");
        const isPool = category === "Pool";
        const isLane = category === "Lane" || category === "Lane_w_handles" || category.startsWith("Lane");
        if (isPool) {
          // The Pool body is one lane-header wider than the shared Lane body.
          // Apply the same clamped width to every Lane for both extending and shortening.
          if (this.handle.alignment.x === 1) {
            resizePoolAndLanes(lane, newr.width - SWIM_HEADER_WIDTH);
            return;
          }
          super.resize.call(this, newr);
          return;
        }
        if (isLane && lane.containingGroup !== null && this.isLengthening()) {
          const pool = lane.containingGroup;
          resizePoolAndLanes(pool, newr.width);
          return;
        }
        super.resize.call(this, newr);
      }

      public doDeactivate(): void {
        const adornedPart = this.adornedObject?.part;
        const category = String(adornedPart?.data?.template || adornedPart?.data?.category || adornedPart?.category || "");
        const isPool = category === "Pool";
        const isLane = category === "Lane" || category === "Lane_w_handles" || category.startsWith("Lane");
        const diagram = this.diagram;
        const containingPool = isLane && adornedPart instanceof go.Group
          ? adornedPart.containingGroup
          : null;
        const resizedShape = adornedPart?.resizeObject as go.Shape | null;
        const resizedSize = resizedShape?.desiredSize || resizedShape?.actualBounds?.size || null;
        super.doDeactivate();
        if (!diagram || !resizedSize || !(adornedPart instanceof go.Group)) return;
        if (!Number.isFinite(resizedSize.width) || !Number.isFinite(resizedSize.height)) return;
        if (isPool) {
          const poolSize = new go.Size(SWIM_HEADER_WIDTH + resizedSize.width, resizedSize.height);
          diagram.model.setDataProperty(adornedPart.data, "size", go.Size.stringify(poolSize));
        } else {
          diagram.model.setDataProperty(adornedPart.data, "size", go.Size.stringify(resizedSize));
        }
        // Do the structural layout once at the end of the drag. It reconciles the
        // persisted lane width with the pool body without fighting the live resize.
        if (containingPool?.layout) {
          containingPool.layout.invalidateLayout();
          diagram.layoutDiagram(true);
        }
      }
  }
  // end LaneResizingTool class

  // Function to install the custom LaneResizingTool on a diagram
  export function installLaneResizingTool(diagram: go.Diagram, myMetis?: akm.cxMetis) {
      myDiagram = diagram;
      const tool = new LaneResizingTool({});
      (tool as any).__myMetis = myMetis;
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
export function addNodeTemplates(nodeTemplateMap: any, contextMenu: any, portContextMenu: any, myMetis: akm.cxMetis, typeviewContextMenu: any) {
    const myDiagram = myMetis.myDiagram;
    if (debug) console.log('981 addNodeTemplates', myMetis, contextMenu, portContextMenu);
    const focusAwareStroke = (data: any, shape: any) => {
        const baseStroke = data?.strokecolor || "black";
        if (data?.isFocusPeer) return "lightblue";
        if (shape?.part?.isHighlighted) return baseStroke;
        return baseStroke;
    };
    const focusAwareStrokeWidth = (h: any, shape: any) => {
        const data = shape?.part?.data || {};
        const raw = data?.strokewidth;
        const baseWidth = typeof raw === 'number' ? raw : parseInt(raw) || 1;
        // Keep hover purely visual. Changing stroke width on mouse enter changes
        // node bounds and makes orthogonal relationship routes jump.
        if (data?.isFocusPeer && h) return Math.max(baseWidth, 3);
        if (data?.isFocusPeer) return Math.max(baseWidth, 3);
        return baseWidth;
    };
    let nodeTemplate0 =      
    $(go.Node, 'Auto',  // the Shape will go around the TextBlock
        {
            mouseEnter: (e, node) => node.isHighlighted = true,
            mouseLeave: (e, node) => node.isHighlighted = false,
        },
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
            new go.Binding("stroke", "", focusAwareStroke),
            new go.Binding('strokeWidth', 'isHighlighted', focusAwareStrokeWidth).ofObject(),
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
            new go.Binding("stroke", "", focusAwareStroke),
            new go.Binding('strokeWidth', 'isHighlighted', focusAwareStrokeWidth).ofObject(),
            { contextMenu: contextMenu },  
            ),
        $(go.Shape, 'RoundedRectangle',  //smaller transparent rectangle to set cursor to move
            {
                name: "DRAG_SHAPE",
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
            new go.Binding("stroke", "", focusAwareStroke),
            new go.Binding('strokeWidth', 'isHighlighted', focusAwareStrokeWidth).ofObject(),
            { contextMenu: contextMenu },  
            ),
        $(go.Shape, 'RoundedRectangle',  //smaller transparent rectangle to set cursor to move
            {
                name: "DRAG_SHAPE",
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
            new go.Binding("stroke", "", focusAwareStroke),
            new go.Binding('strokeWidth', 'isHighlighted', focusAwareStrokeWidth).ofObject(),
            { contextMenu: contextMenu },  
            ),
        $(go.Shape, 'RoundedRectangle',  //smaller transparent rectangle to set cursor to move
            {
                name: "DRAG_SHAPE",
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
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("scale", "scale1").makeTwoWay(),
            {
                selectionObjectName: "SHAPE",
                resizeObjectName: "SHAPE",
            },
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
                new go.Binding("stroke", "", focusAwareStroke),
                new go.Binding('strokeWidth', 'isHighlighted', focusAwareStrokeWidth).ofObject(),
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
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("scale", "scale1").makeTwoWay(),
            {
                selectionObjectName: "SHAPE",
                resizeObjectName: "SHAPE",
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
                new go.Binding("stroke", "", focusAwareStroke),
                new go.Binding('strokeWidth', 'isHighlighted', focusAwareStrokeWidth).ofObject(),
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
                            new go.Binding("geometryString", "geometry"),
                            new go.Binding("fill", "fillcolor2"),
                            { 
                                name: "GEOMETRY_SHAPE", 
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
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("scale", "scale1").makeTwoWay(),
            {
                selectionObjectName: "SHAPE",
                resizeObjectName: "SHAPE",
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
                new go.Binding("stroke", "", focusAwareStroke),
                new go.Binding('strokeWidth', 'isHighlighted', focusAwareStrokeWidth).ofObject(),
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
                                name: "FIGURE_SHAPE", 
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
                            new go.Binding("figure", "figure", (v) => sanitizeFigureName(v, "Rectangle")), 
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
                    new go.Binding('fill', 'fillcolor', (c) => sanitizeColor(c)),
                    new go.Binding("stroke", "strokecolor", (c) => sanitizeColor(c, "black")),
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
                    defaultAlignment: go.Spot.Right,
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
                    minSize: new go.Size(NaN, 72),
                    margin: new go.Margin(44, 0, 0, 0),
                    alignment: new go.Spot(0.5, 0, 0, -12),
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
                    defaultAlignment: go.Spot.Left,
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
                    minSize: new go.Size(NaN, 72),
                    margin: new go.Margin(0, 0, 44, 0),
                    alignment: new go.Spot(0.5, 1, 0, 12),
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
                    portId: "",
                    fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
                    toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true
                },
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
            $(go.Shape, 'RoundedRectangle',  // smaller transparent rectangle to set cursor to move
                {
                    cursor: "move",
                    fill: "transparent",
                    stroke: "transparent",
                    strokeWidth: 10,
                    margin: new go.Margin(1, 1, 1, 1),
                    shadowVisible: false,
                }
            ),
            $(go.Panel, "Table", // Panel for text ------------------------
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
                    {
                        defaultAlignment: go.Spot.Center,
                    },
                    addNodeText0(contextMenu),
                ),
            ),
        )
    );
    addNodeTemplateName('ActivityNode');

    nodeTemplateMap.add("EventNode",
        $(go.Node, 'Vertical',  // the Shape will go around the TextBlock
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
                    new go.Binding("figure", "figure", (v) => sanitizeFigureName(v, "Rectangle")), 
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
                    new go.Binding("figure", "figure", (v) => sanitizeFigureName(v, "Rectangle")), 
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
    // Swimlane rule: "contains" (membership) relationships should not be drawn when the child is
    // actually contained in (grouped to) its Lane. Otherwise these structural links pop in when
    // moving nodes, which is visually confusing.
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
        const fromKey = String(from?.data?.key ?? d?.from ?? "");
        const toKey = String(to?.data?.key ?? d?.to ?? "");
        const fromGroup = String(from?.data?.group ?? "");
        const toGroup = String(to?.data?.group ?? "");

        // Swimlane invariant: membership ("contains") relationships should never be rendered for Pools/Lanes.
        // We hide them unconditionally when either endpoint is a Pool or Lane group. This is robust even
        // when membership data is briefly inconsistent during drag/layout.
        if (typeName === constants.types.AKM_CONTAINS && (fromIsLane || toIsLane || fromIsPool || toIsPool)) {
            return false;
        }

        // Also hide membership links when the member is grouped to the parent (for non-swimlane containers),
        // using stable model membership (data.group) rather than transient `containingGroup`.
        if (typeName === constants.types.AKM_CONTAINS || fromIsLane || toIsLane) {
            if (fromIsLane && to && toGroup === fromKey) return false;
            if (toIsLane && from && fromGroup === toKey) return false;
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
            // In Metamodelling views, render "contains" as straight lines (non-orthogonal).
            // This keeps metamodel containment visually distinct from runtime relationships.
            new go.Binding("routing", "", function (d: any, link: go.Link) {
                const typeName =
                    d?.typename ||
                    d?.name ||
                    d?.relship?.type?.name ||
                    d?.relshipview?.relship?.type?.name ||
                    d?.relshipkind ||
                    "";
                const isContains = typeName === constants.types.AKM_CONTAINS;
                const isMetamodelling = String((myMetis as any)?.modelType || "") === "Metamodelling";
                const explicitRouting = getEffectiveLinkRouting(d, null);
                if (explicitRouting !== null) return explicitRouting;
                if (isMetamodelling && isContains) return go.Link.Normal;
                return go.Link.Orthogonal;
            }).makeTwoWay(),
            new go.Binding("curve", "", function (d: any, link: go.Link) {
                const typeName =
                    d?.typename ||
                    d?.name ||
                    d?.relship?.type?.name ||
                    d?.relshipview?.relship?.type?.name ||
                    d?.relshipkind ||
                    "";
                const isContains = typeName === constants.types.AKM_CONTAINS;
                const isMetamodelling = String((myMetis as any)?.modelType || "") === "Metamodelling";
                // If explicitly configured, honor it.
                if (typeof d?.curve === "string" && d.curve.trim() !== "") return getCurve(d.curve);
                if (typeof d?.curve === "number") return d.curve;
                if (isMetamodelling && isContains) return go.Link.None;
                return getCurve(d?.curve);
            }).makeTwoWay(),
            { 
                toShortLength: 3, 
                relinkableFrom: true, 
                relinkableTo: true, 
                adjusting: go.Link.End,
                reshapable: true,
                resegmentable: true,
            },
            new go.Binding("adjusting", "", d => getLinkAdjusting(d, go.Link.End)),
            // link route (defaults are overridden by the bindings above when relevant)
            { routing: go.Link.Orthogonal, corner: 10 },  // default relationship routing
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
            new go.Binding("fill", "fromArrowColor", (c) => sanitizeColor(c, "transparent")),
            new go.Binding("stroke", "", d => getArrowStrokeColor(d, 'from')),
            new go.Binding('strokeWidth', 'strokewidth', function(val) { 
                return typeof val === 'number' ? val : parseInt(val) || 1; 
            }),
            new go.Binding("scale", "arrowscale").makeTwoWay(),
            ),
            // the "to" arrowhead
            $(go.Shape, { toArrow: "None"},  
            { scale: 1.3, fill: "white" },
            new go.Binding("toArrow", "toArrow"),
            new go.Binding("fill", "toArrowColor", (c) => sanitizeColor(c, "white")),
            new go.Binding("stroke", "", d => getArrowStrokeColor(d, 'to')),
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
                isMultiline: false,
                editable: true,
                background: null,  // null = no background rendering at all
                isPanelMain: false,
                pickable: false,
                segmentIndex: NaN,
                segmentFraction: 0.5,
                segmentOffset: new go.Point(0, 0),
            },
            new go.Binding("text", "name").makeTwoWay(),
            new go.Binding("stroke", "textcolor").makeTwoWay(),
            new go.Binding("scale", "textscale").makeTwoWay()
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
        const fromKey = String(from?.data?.key ?? d?.from ?? "");
        const toKey = String(to?.data?.key ?? d?.to ?? "");
        const fromGroup = String(from?.data?.group ?? "");
        const toGroup = String(to?.data?.group ?? "");
        if (typeName === constants.types.AKM_CONTAINS && (fromIsLane || toIsLane || fromIsPool || toIsPool)) {
            return false;
        }
        if (typeName === constants.types.AKM_CONTAINS || fromIsLane || toIsLane) {
            if (fromIsLane && to && toGroup === fromKey) return false;
            if (toIsLane && from && fromGroup === toKey) return false;
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
            new go.Binding("routing", "", d => getEffectiveLinkRouting(d, go.Link.AvoidsNodes)).makeTwoWay(),
            new go.Binding("adjusting", "", d => getLinkAdjusting(d, go.Link.Stretch)),
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
            new go.Binding("fill", "fromArrowColor", (c) => sanitizeColor(c, "transparent")),
            new go.Binding("stroke", "", d => getArrowStrokeColor(d, 'from')),
            new go.Binding("scale", "arrowscale").makeTwoWay(),
            ),
            // the "to" arrowhead
            $(go.Shape, { toArrow: "None"},  
            { scale: 1.3, fill: "white" },
            new go.Binding("toArrow", "toArrow"),
            new go.Binding("fill", "toArrowColor", (c) => sanitizeColor(c, "white")),
            new go.Binding("stroke", "", d => getArrowStrokeColor(d, 'to')),
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
                    background: null,  // null = no background rendering at all
                    isPanelMain: false,
                    pickable: false,
                },
                { segmentOffset: new go.Point(-10, -10) },
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("stroke", "textcolor").makeTwoWay(),
                new go.Binding("scale", "textscale").makeTwoWay()
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
        new go.Binding("adjusting", "", d => getLinkAdjusting(d, go.Link.None)),
        new go.Binding("visible", "", linkShouldBeVisible),
        new go.Binding('points').makeTwoWay(),
        $(go.Shape, { stroke: 'black', strokeWidth: 1, strokeDashArray: [1, 3] },
            new go.Binding("stroke", "strokecolor", s => s || "black"),
            new go.Binding("strokeWidth", "strokewidth", function(val) {
                return typeof val === 'number' ? val : parseInt(val) || 1;
            }),
            new go.Binding("strokeDashArray", "dash",
                function(d) { return setDashed(d) || [1, 3]; }),
        ),
        $(go.Shape, { fromArrow: "None", scale: 1, fill: "transparent" },
            new go.Binding("fromArrow", "fromArrow"),
            new go.Binding("fill", "fromArrowColor", (c) => sanitizeColor(c, "transparent")),
            new go.Binding("stroke", "", d => getArrowStrokeColor(d, 'from')),
        ),
        $(go.Shape, { toArrow: 'OpenTriangle', scale: 1, stroke: 'black', fill: 'white' },
            new go.Binding("toArrow", "toArrow"),
            new go.Binding("fill", "toArrowColor", (c) => sanitizeColor(c, "white")),
            new go.Binding("stroke", "", d => getArrowStrokeColor(d, 'to')),
        ),
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
	          routing: go.Link.Orthogonal,
	          corner: 10,
          // fromSpot: go.Spot.RightSide, 
          // toSpot: go.Spot.LeftSide,
          // toSpot: go.Spot.BottomSide,
	          reshapable: true,
          resegmentable: true,
	          relinkableFrom: true,
	          relinkableTo: true,
          adjusting: go.Link.Stretch,
	          toEndSegmentLength: 0,
	        },
          new go.Binding("routing", "", d => getEffectiveLinkRouting(d, go.Link.Orthogonal)).makeTwoWay(),
          new go.Binding("adjusting", "", d => getLinkAdjusting(d, go.Link.Stretch)),
	        new go.Binding("visible", "", linkShouldBeVisible),
	        new go.Binding('points').makeTwoWay(),
	        $(go.Shape, { stroke: 'black', strokeWidth: 1 },
            new go.Binding("stroke", "strokecolor", s => s || "black"),
            new go.Binding("strokeWidth", "strokewidth", function(val) {
              return typeof val === 'number' ? val : parseInt(val) || 1;
            }),
          ),
	        $(go.Shape, { toArrow: 'Triangle', scale: 1.2, fill: 'black', stroke: null },
            new go.Binding("toArrow", "toArrow"),
            new go.Binding("fill", "toArrowColor", (c) => sanitizeColor(c, "black")),
            new go.Binding("stroke", "", d => getArrowStrokeColor(d, 'to')),
          ),
        $(go.Shape,
          { fromArrow: '', scale: 1.5, stroke: 'black', fill: 'white' },
          new go.Binding('fromArrow', '', function (d) {
            const explicit = d?.fromArrow;
            if (explicit !== undefined && explicit !== null && explicit !== '') return explicit;
            const fallback = d?.isDefault;
            if (fallback === null || fallback === undefined) return '';
            return fallback ? 'BackSlash' : 'StretchedDiamond';
          }),
          new go.Binding('fill', 'fromArrowColor'),
          new go.Binding('stroke', '', d => getArrowStrokeColor(d, 'from')),
          new go.Binding('segmentOffset', 'isDefault', function (s) {
            return s ? new go.Point(5, 0) : new go.Point(0, 0);
          })
        ),
        $(go.TextBlock, "",
          {
            // this is a Link label
            isMultiline: true,  // allow newlines in text
            editable: true,
            background: null,  // null = no background rendering at all
            isPanelMain: false,
            pickable: false,
            segmentIndex: NaN,
            segmentFraction: 0.5,
            segmentOffset: new go.Point(0, 0),
          },
          new go.Binding('text', 'name').makeTwoWay(),
          new go.Binding("stroke", "textcolor").makeTwoWay(),
          new go.Binding("scale", "textscale").makeTwoWay()
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

      const previewRelationshipTemplate =
        $(go.Link,
          {
            selectable: false,
            pickable: true,
            reshapable: false,
            resegmentable: false,
            relinkableFrom: false,
            relinkableTo: false,
            routing: go.Link.Normal,
            curve: go.Link.None,
            corner: 0,
            toShortLength: 0,
            contextMenu: null,
          },
          new go.Binding("points").makeTwoWay(),
          $(go.Shape,
            { stroke: "#2d9cdb", strokeWidth: 2 },
            new go.Binding("stroke", "strokecolor", (c) => c || "#2d9cdb")
          ),
          $(go.TextBlock,
            {
              isMultiline: false,
              editable: false,
              background: null,  // null = no background rendering at all
              isPanelMain: false,
              pickable: false,
              stroke: "black",
              segmentIndex: NaN,
              segmentFraction: 0.5,
              segmentOffset: new go.Point(0, 0),
            },
            new go.Binding("text", "name"),
            new go.Binding("scale", "textscale").makeTwoWay(),
            new go.Binding("stroke", "textcolor").makeTwoWay()
          )
        );
      linkTemplateMap.add("previewRelationship", previewRelationshipTemplate);
      addLinkTemplateName('previewRelationship');
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
                cursor: "",
                avoidable: false,
                resizable: true, 
                minSize: getMinSize(),
                resizeObjectName: "SHAPE",
                selectionObjectName: "SHAPE",
                selectionAdorned: true,
                handlesDragDropForMembers: true,
                contextMenu: contextMenu,
                locationObjectName: 'SHAPE',
                locationSpot: go.Spot.Center,
                mouseDrop: function (e: go.InputEvent, grp: go.Group) {
                    finishDropOnShiftOnly(e, grp);
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
            groupTop2(contextMenu, 'Icon', true, true),
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
                cursor: "",
                avoidable: false,
                resizable: true, 
                minSize: getMinSize(),
                resizeObjectName: "SHAPE",
                selectionObjectName: "SHAPE",
                selectionAdorned: true,
                handlesDragDropForMembers: true,
                contextMenu: contextMenu,
                locationObjectName: 'SHAPE',
                locationSpot: go.Spot.Center,
                mouseDrop: function (e: go.InputEvent, grp: go.Group) {
                    finishDropOnShiftOnly(e, grp);
                },
            },
            new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),
            // new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify()),
            new go.Binding("scale", "scale1").makeTwoWay(),
            new go.Binding("layout", "groupLayout", (v, obj) => sanitizeGroupLayout(v, obj)).makeTwoWay(),
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
            groupTop2(contextMenu, 'Geometry', true, true),
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
                cursor: "",
                avoidable: false,
                resizable: true, 
                minSize: getMinSize(),
                resizeObjectName: "SHAPE",
                selectionObjectName: "SHAPE",
                selectionAdorned: true,
                handlesDragDropForMembers: true,
                contextMenu: contextMenu,
                locationObjectName: 'SHAPE',
                locationSpot: go.Spot.Center,
                mouseDrop: function (e: go.InputEvent, grp: go.Group) {
                    finishDropOnShiftOnly(e, grp);
                },
            },
            new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("scale", "scale1").makeTwoWay(),
            new go.Binding("layout", "groupLayout", (v, obj) => sanitizeGroupLayout(v, obj)).makeTwoWay(),
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
            groupTop2(contextMenu, 'Figure', true, true),
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
                cursor: "",
                avoidable: false,
                resizable: true, 
                minSize: getMinSize(),
                resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
                selectionObjectName: "SHAPE",
                selectionAdorned: true,
                handlesDragDropForMembers: true,
                contextMenu: contextMenu,
                mouseDrop: function (e: go.InputEvent, grp: go.Group) {
                    finishDropOnShiftOnly(e, grp);
                },
            },
            new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
            new go.Binding("layout", "groupLayout", (v, obj) => sanitizeGroupLayout(v, obj)).makeTwoWay(),

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
            groupTop2(contextMenu, 'Icon', false, true),
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
                cursor: "",
                avoidable: false,
                resizable: true, 
                minSize: getMinSize(),
                resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
                selectionObjectName: "SHAPE",
                selectionAdorned: true,
                handlesDragDropForMembers: true,
                contextMenu: contextMenu,
                mouseDrop: function (e: go.InputEvent, grp: go.Group) {
                    finishDropOnShiftOnly(e, grp);
                },
            },
            new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
            new go.Binding("layout", "groupLayout", (v, obj) => sanitizeGroupLayout(v, obj)).makeTwoWay(),

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
                cursor: "",
                avoidable: false,
                resizable: true, 
                minSize: getMinSize(),
                resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
                selectionObjectName: "SHAPE",
                selectionAdorned: true,
                handlesDragDropForMembers: true,
                contextMenu: contextMenu,
                mouseDrop: function (e: go.InputEvent, grp: go.Group) {
                    finishDropOnShiftOnly(e, grp);
                },
            },
            new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
            new go.Binding("layout", "groupLayout", (v, obj) => sanitizeGroupLayout(v, obj)).makeTwoWay(),

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

    // Shared helpers for Pool/Lane drag-drop behavior.
    // These must live in the addGroupTemplates scope so both templates can call them.
    const isLaneGroupPart = (part: go.Part): part is go.Group => {
        if (!(part instanceof go.Group)) return false;
        const t = part.data?.template;
        const c = part.data?.category;
        return c === "Lane" || c === "Lane_OLD" || c === "Lane_w_handles" || t === "Lane" || t === "Lane_OLD" || t === "Lane_w_handles";
    };
    const isPoolGroupPart = (part: go.Part): part is go.Group => {
        if (!(part instanceof go.Group)) return false;
        const t = part.data?.template;
        const c = part.data?.category;
        return c === "Pool" || t === "Pool";
    };

    const markActiveSwimlaneDrag = (diagram: go.Diagram, lane: go.Group) => {
        const laneKey = String(lane.data?.key || lane.key || "");
        if (!laneKey) return;
        const activeLaneDragKeys: Set<string> =
            (diagram as any).__activeSwimlaneDragKeys || new Set<string>();
        activeLaneDragKeys.add(laneKey);
        (diagram as any).__activeSwimlaneDragKeys = activeLaneDragKeys;

        const pool = lane.containingGroup;
        if (pool instanceof go.Group && isPoolGroupPart(pool)) {
            const poolKey = String(pool.data?.key || pool.key || "");
            if (poolKey) {
                const anchors: Map<string, { location: go.Point; bodyBounds: go.Rect }> =
                    (diagram as any).__activeSwimlanePoolAnchors || new Map();
                if (!anchors.has(poolKey)) {
                    const body = pool.findObject("POOL_BODY_SHAPE");
                    anchors.set(poolKey, {
                        location: pool.location.copy(),
                        bodyBounds: (body ? body.getDocumentBounds() : pool.actualBounds).copy()
                    });
                }
                (diagram as any).__activeSwimlanePoolAnchors = anchors;
            }
        }

        const previousTimer = (diagram as any).__activeSwimlaneDragClearTimer;
        if (previousTimer) clearTimeout(previousTimer);
        (diagram as any).__activeSwimlaneDragClearTimer = setTimeout(() => {
            delete (diagram as any).__activeSwimlaneDragKeys;
            delete (diagram as any).__activeSwimlanePoolAnchors;
            delete (diagram as any).__activeSwimlaneDragClearTimer;
        }, 1000);
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
        let hasPool = false;
        let valid = true;
        dragged.each((part: go.Part) => {
            if (part === pool) return;
            if (isLaneGroupPart(part)) {
                hasLane = true;
                return;
            }
            if (isPoolGroupPart(part)) {
                hasPool = true;
                return;
            }
            if (part instanceof go.Group) {
                valid = false;
                return;
            }
            valid = false;
        });
        if (!valid || (!hasLane && !hasPool) || (hasLane && hasPool)) {
            diagram.currentTool.doCancel();
            return;
        }

        const ok = pool.addMembers(dragged, true);
        if (!ok) {
            diagram.currentTool.doCancel();
            return;
        }

        // PoolLayout must distinguish an intentional Lane drag from import/reload
        // normalization. During a drag, keep every member at the same offset from
        // its Lane when the Lane frame is snapped into the Pool stack.
        if (hasLane) {
            dragged.each((part: go.Part) => {
                if (!isLaneGroupPart(part)) return;
                markActiveSwimlaneDrag(diagram, part);
            });

            // A palette lane can arrive with an uninitialized body size. Normalize it before
            // PoolLayout runs so the new lane immediately has the same usable body/header height.
            dragged.each((part: go.Part) => {
                if (!isLaneGroupPart(part)) return;
                const laneBody = part.findObject("LANE_BODY_SHAPE") as go.GraphObject | null;
                const laneHeader = part.findObject("LANE_HEADER_STRIP") as go.GraphObject | null;
                const fromData = part.data?.size ? go.Size.parse(String(part.data.size)) : null;
                const width = Math.max(160, fromData?.width || laneBody?.actualBounds.width || 160);
                const height = Math.max(
                    65,
                    fromData?.height || 0,
                    laneBody?.actualBounds.height || 0,
                    laneHeader?.actualBounds.height || 0,
                );
                const size = new go.Size(width, height);
                if (laneBody) laneBody.desiredSize = size;
                diagram.model.setDataProperty(part.data, "size", go.Size.stringify(size));
                if (part.data?.objectview) part.data.objectview.size = go.Size.stringify(size);
            });
        }

        // Optional insertion behavior: when a Lane is dropped "on a lane", insert above/below that
        // target lane based on the drop Y coordinate. We do this by nudging the dropped lanes' Y
        // locations just above/below the target lane before triggering PoolLayout.
        if (hasLane && opts?.relativeToLane && typeof opts.dropY === "number" && !Number.isNaN(opts.dropY)) {
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
            if (!(isLaneGroupPart(part) || isPoolGroupPart(part))) return;
            const objview = modelview?.findObjectView(part.data?.key);
            if (!objview) return;
            objview.group = pool.data?.key;
            objview.loc = part.data?.loc ? String(part.data.loc) : `${part.location.x} ${part.location.y}`;
            if (part.data?.size) objview.size = part.data.size;
            const payload = JSON.parse(JSON.stringify(new jsn.jsnObjectView(objview)));
            diagram.dispatch({ type: "UPDATE_OBJECTVIEW_PROPERTIES", data: payload });
        });

        const poolOv = modelview?.findObjectView(pool.data?.key);
        if (hasLane && poolOv?.isGroup) {
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

	            // Capture the current viewport position and scale to prevent unwanted scrolling
	            const prevViewportBounds = diagram.viewportBounds.copy();
	            const prevScale = diagram.scale;
	            const prevAutoScale = diagram.autoScale;
	            
	            // Prevent automatic scrolling during the drop
	            diagram.autoScale = go.Diagram.None;
	            
	            // Prevent any layout invalidation during the drop operation
	            const prevLayout = grp.layout;
	            grp.layout = $(go.Layout, { isViewportSized: false, isOngoing: false, isInitial: false, isRouting: false });
	            
	            // Prevent pool from being invalidated during node drop
	            const parentPool = grp.containingGroup;
	            let poolWasSkipping = false;
	            if (parentPool) {
	                poolWasSkipping = (parentPool as any).isLayoutInvalid === false;
	                (parentPool as any).isLayoutInvalid = false;
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
                }
                
                // Force the GROUP desiredSize to match the lane dimensions
                const totalWidth = LANE_HEADER_STRIP_WIDTH + previousLaneSize.width;
                const totalHeight = previousLaneSize.height;
                grp.desiredSize = new go.Size(totalWidth, totalHeight);
                
                if (grp.data) {
                    diagram.model.setDataProperty(grp.data, "size", go.Size.stringify(previousLaneSize));
                }
            }
            
            // First, position the dropped node where the user dropped it (constrained to lane bounds)
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
            
            // AFTER positioning the node, restore the original layout
            // This prevents the layout from running and moving the node to (0,0)
            grp.layout = prevLayout;
            
            // Restore pool layout state
            if (parentPool && !poolWasSkipping) {
                delete (parentPool as any).isLayoutInvalid;
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

            // Do NOT update the lane's properties here - the lane should not move during a node drop.
            // Only the dropped node's properties need to be updated.

            // Do NOT trigger pool layout when dropping regular nodes into a lane.
            // Pool layout should only run for structural changes (add/remove lanes),
            // not for content changes within a lane.
            // Calling doGroupLayout here causes unwanted lane resizing and visual jumps.
            
            // Restore the viewport position and scale settings
            diagram.autoScale = prevAutoScale;
            diagram.scale = prevScale;
            diagram.position = new go.Point(prevViewportBounds.x, prevViewportBounds.y);
        };

        // each Group is a "swimlane" with a header on the left and a resizable lane on the right
        const laneTemplate = 
        $(go.Group, "Horizontal", groupStyle(),
        {
            name: "GROUP",
            // Select/resize the lane body instead of the whole lane wrapper so lane selection
            // does not draw over shared separator lines or the pool border.
            selectionObjectName: "BODY",
            resizeObjectName: "BODY",
            resizable: true,
            movable: false,  // Lanes should not be individually draggable - only the pool moves
            minSize: getMinSize(),
            selectionAdorned: true,
            padding: new go.Margin(0, 0, 0, 0),
            // Make "loc" represent the top-left of the whole lane (header + body),
            // so pool layout can align lane headers flush to the pool header separator.
            locationObjectName: "LANE_MAIN",
            locationSpot: go.Spot.TopLeft,
            // Don't recompute bounds based on members - use explicit sizing from doGroupLayout
            computesBoundsAfterDrag: false,
            computesBoundsIncludingLinks: false,
            computesBoundsIncludingLocation: false, // Prevent any automatic bounds computation
            // Use a layout that doesn't resize the group
            layout: $(go.Layout,
                {
                    isViewportSized: false,
                    isOngoing: false,
                    isInitial: false,
                    isRouting: false
                }
            ),
            handlesDragDropForMembers: true,
            mouseDrop: handleLaneDrop,
            contextMenu: contextMenu,
            subGraphExpandedChanged: (grp: go.Group) => {
                updateCrossLaneLinks(grp);
                const diagram = grp.diagram;
                if (!diagram) return;
                grp.invalidateLayout();
                if (grp.containingGroup instanceof go.Group) {
                    grp.containingGroup.invalidateLayout();
                }
                diagram.requestUpdate();
            },
        },
        new go.Binding("isSubGraphExpanded", "expanded").makeTwoWay(),
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        // Set GROUP desiredSize to total lane dimensions so Table has correct bounds
        new go.Binding("desiredSize", "size", (sz: string) => {
            const size = go.Size.parse(sz);
            const bodyWidth = Math.max(160, size.width);
            const bodyHeight = Math.max(65, size.height);
            return new go.Size(LANE_HEADER_STRIP_WIDTH + bodyWidth, bodyHeight);
        }),
        // Layout binding disabled - lanes use explicit sizing, not layout-based sizing
        // new go.Binding("layout", "groupLayout", (v, obj) => sanitizeGroupLayout(v, obj)).makeTwoWay(),
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
        groupTemplateMap.add("Lane_OLD", laneTemplate);
        addGroupTemplateName('Lane_OLD');
        // define a custom resize adornment bigger
        groupTemplateMap.get("Lane_OLD").resizeAdornmentTemplate = addResizeAdornment("Lane");
  
        const laneTemplate2 = 
        $(go.Group, "Horizontal", groupStyle(),
        {
            name: "GROUP",
            // Select/resize the lane body instead of the whole lane wrapper so lane selection
            // does not draw over shared separator lines or the pool border.
            selectionObjectName: "BODY",
            resizeObjectName: "BODY",
            resizable: true,
            movable: false,  // Lanes should not be individually draggable - only the pool moves
            minSize: getMinSize(),
            selectionAdorned: true,
            padding: new go.Margin(0, 0, 0, 0),
            locationObjectName: "LANE_MAIN",
            locationSpot: go.Spot.TopLeft,
            computesBoundsAfterDrag: false,
            computesBoundsIncludingLinks: false,
            computesBoundsIncludingLocation: false,
            handlesDragDropForMembers: true,
            mouseDrop: handleLaneDrop,
            contextMenu: contextMenu,
            subGraphExpandedChanged: (grp: go.Group) => {
                updateCrossLaneLinks(grp);
                const diagram = grp.diagram;
                if (!diagram) return;
                grp.invalidateLayout();
                if (grp.containingGroup instanceof go.Group) {
                    grp.containingGroup.invalidateLayout();
                }
                diagram.requestUpdate();
            },
        },
        new go.Binding("isSubGraphExpanded", "expanded").makeTwoWay(),
        // new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding("location", "loc", go.Point.parse)
            .makeTwoWay(pt => `${pt.x} ${pt.y}`),
        // NOTE: `data.size` is the lane BODY size and is bound on `LANE_BODY_SHAPE`.
        // Binding it to the whole Group causes the Group's bounds/selection/drag math to disagree with visuals.
        // the lane header consisting of a Shape and a TextBlock
        new go.Binding("layout", "groupLayout", (v, obj) => sanitizeGroupLayout(v, obj)).makeTwoWay(),
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
    
    // =============================================================================
    // NEW POOL/LANE TEMPLATES - Phase 1: Minimal Core
    // Based on GoJS SwimLanes sample pattern
    // =============================================================================
    
    const MINLENGTH = 200;  // minimum length of any lane (reduced from 400)
    const MINBREADTH = 80;  // minimum breadth (height) of any non-collapsed lane (reduced from 100)
    
    // Compute the minimum size of a Pool Group needed to hold all lanes
    function computeMinPoolSize(pool: go.Group) {
        let len = MINLENGTH;
        pool.memberParts.each((lane: go.Part) => {
            if (!(lane instanceof go.Group)) return;
            const holder = lane.placeholder;
            if (holder !== null) {
                len = Math.max(len, holder.actualBounds.width);
            }
        });
        return new go.Size(len, NaN);
    }
    
    // Compute the minimum size for a particular Lane Group
    function computeLaneSize(lane: go.Group) {
        const sz = computeMinLaneSize(lane);
        if (lane.isSubGraphExpanded) {
            const holder = lane.placeholder;
            if (holder !== null) {
                sz.height = Math.ceil(Math.max(sz.height, holder.actualBounds.height));
            }
        }
        // Minimum breadth needs to be big enough to hold the header
        const hdr = lane.findObject("LANE_HEADER");
        if (hdr !== null) sz.height = Math.ceil(Math.max(sz.height, hdr.actualBounds.height));
        return sz;
    }
    
    // Determine the minimum size of a Lane Group, even if collapsed
    function computeMinLaneSize(lane: go.Group) {
        if (!lane.isSubGraphExpanded) return new go.Size(MINLENGTH, 1);
        return new go.Size(MINLENGTH, MINBREADTH);
    }
    
    // Custom LaneResizingTool - handles lane width affecting all lanes
    class LaneResizingTool extends go.ResizingTool {
        isLengthening() {
            return (this.handle.alignment === go.Spot.Right);
        }

        computeMinSize() {
            const lane = this.adornedObject.part as go.Group;
            const msz = computeMinLaneSize(lane);
            if (this.isLengthening()) {
                // Compute the minimum length of all lanes
                const sz = computeMinPoolSize(lane.containingGroup as go.Group);
                msz.width = Math.max(msz.width, sz.width);
            } else {
                // Find the minimum size of this single lane
                const sz = computeLaneSize(lane);
                msz.width = Math.max(msz.width, sz.width);
                msz.height = Math.max(msz.height, sz.height);
            }
            return msz;
        }

        resize(newr: go.Rect) {
            const lane = this.adornedObject.part as go.Group;
            if (this.isLengthening()) {
                // Changing the length of all lanes
                const pool = lane.containingGroup;
                if (pool) {
                    pool.memberParts.each((l: go.Part) => {
                        if (!(l instanceof go.Group)) return;
                        const shape = l.resizeObject as go.Shape;
                        if (shape !== null) {
                            // Set desiredSize instead of width
                            shape.desiredSize = new go.Size(newr.width, shape.desiredSize.height);
                        }
                    });
                }
            } else {
                // Changing the breadth of a single lane
                const shape = lane.resizeObject as go.Shape;
                if (shape !== null) {
                    shape.desiredSize = new go.Size(shape.desiredSize.width, newr.height);
                }
            }
            // Don't relayout during drag - wait until mouse up
        }

        doMouseUp() {
            super.doMouseUp();
            this.relayoutDiagram();
        }

        relayoutDiagram() {
            const diagram = this.diagram;
            if (diagram) {
                diagram.layout.invalidateLayout();
                diagram.findTopLevelGroups().each((g: go.Part) => {
                    if (g instanceof go.Group && g.category === "Pool") {
                        g.layout.invalidateLayout();
                    }
                });
                diagram.layoutDiagram();
            }
        }
    }
    
    // Custom PoolLayout - stacks lanes vertically and keeps them same length
    class PoolLayout extends go.GridLayout {
        constructor() {
            super();
            this.cellSize = new go.Size(1, 1);
            this.wrappingColumn = 1;
            this.wrappingWidth = Infinity;
            this.isRealtime = false;  // don't continuously layout while dragging
            this.isOngoing = false;   // defer pool reflow until the resize transaction completes
            this.alignment = go.GridLayout.Position;
            this.spacing = new go.Size(0, 0);  // No gaps between lanes
            // Sort based on Y location for lane reordering
            this.comparer = (a: go.Part, b: go.Part) => {
                const ay = a.location.y;
                const by = b.location.y;
                if (isNaN(ay) || isNaN(by)) return 0;
                if (ay < by) return -1;
                if (ay > by) return 1;
                return 0;
            };
        }

        doLayout(coll: go.Set<go.Part> | go.List<go.Part>) {
            const diagram = this.diagram;
            if (diagram === null) return;
            const pool = this.group;
            const poolKey = String(pool?.data?.key || pool?.key || "");
            const activeLaneDragKeys: Set<string> | undefined =
                (diagram as any).__activeSwimlaneDragKeys;
            const activePoolAnchors: Map<string, { location: go.Point; bodyBounds: go.Rect }> | undefined =
                (diagram as any).__activeSwimlanePoolAnchors;
            const activePoolAnchor = poolKey ? activePoolAnchors?.get(poolKey) : undefined;
            const revision = String(pool?.data?.layoutRevision || "").trim();
            const hasValidGeometry = (part: go.Part) => {
                const loc = String(part.data?.loc || "").trim();
                const size = String(part.data?.size || "").trim();
                if (!loc || !size) return false;
                try {
                    const point = go.Point.parse(loc);
                    const dimensions = go.Size.parse(size);
                    return Number.isFinite(point.x) && Number.isFinite(point.y) &&
                        Number.isFinite(dimensions.width) && dimensions.width > 0 &&
                        Number.isFinite(dimensions.height) && dimensions.height > 0;
                } catch (_) {
                    return false;
                }
            };
            const getLaneFrameBounds = (lane: go.Group) => {
                const frame = lane.findObject("LANE_TABLE") || lane.resizeObject || lane;
                return frame.getDocumentBounds();
            };
            const formsAlignedLaneStack = (lanes: go.Group[]) => {
                const geometry = lanes.map((lane) => getLaneFrameBounds(lane).copy())
                    .sort((a, b) => a.y - b.y);
                if (geometry.length === 0) return false;
                const left = geometry[0].x;
                const width = geometry[0].width;
                let expectedTop = geometry[0].y;
                for (let index = 0; index < geometry.length; index++) {
                    const lane = geometry[index];
                    if (
                        Math.abs(lane.x - left) > 2 ||
                        Math.abs(lane.y - expectedTop) > 2 ||
                        Math.abs(lane.width - width) > 2
                    ) {
                        return false;
                    }
                    expectedTop += lane.height;
                }
                return true;
            };
            const poolFitsLaneStack = (lanes: go.Group[]) => {
                if (!pool || lanes.length === 0) return false;
                const body = pool.findObject("POOL_BODY_SHAPE");
                if (!body) return false;
                const bodyBounds = body.getDocumentBounds();
                const headerBounds = pool.findObject("POOL_HEADER_STRIP")?.getDocumentBounds();
                const poolBounds = new go.Rect(
                    bodyBounds.x,
                    headerBounds?.y ?? bodyBounds.y,
                    bodyBounds.width,
                    headerBounds?.height ?? bodyBounds.height
                );
                const laneBounds = lanes.map((lane) => getLaneFrameBounds(lane));
                const left = Math.min(...laneBounds.map((bounds) => bounds.left));
                const top = Math.min(...laneBounds.map((bounds) => bounds.top));
                const right = Math.max(...laneBounds.map((bounds) => bounds.right));
                const bottom = Math.max(...laneBounds.map((bounds) => bounds.bottom));
                return (
                    Math.abs(poolBounds.left - left) <= 2 &&
                    Math.abs(poolBounds.top - top) <= 2 &&
                    Math.abs(poolBounds.width - (right - left)) <= 2 &&
                    Math.abs(poolBounds.height - (bottom - top)) <= 2
                );
            };
            const containsPersistedMembers = (lane: go.Group) => {
                const frame = getLaneFrameBounds(lane);
                let containsAll = true;
                lane.memberParts.each((member: go.Part) => {
                    if (!containsAll || !(member instanceof go.Node) || member instanceof go.Group) return;
                    const predicted = member.actualBounds.copy();
                    const persistedLoc = String(member.data?.loc || "").trim();
                    if (persistedLoc) {
                        try {
                            const point = go.Point.parse(persistedLoc);
                            predicted.offset(point.x - member.location.x, point.y - member.location.y);
                        } catch (_) { }
                    }
                    const minimumLeft = frame.left + SWIM_HEADER_WIDTH + 16;
                    if (!frame.containsRect(predicted) || predicted.left < minimumLeft) {
                        containsAll = false;
                    }
                });
                return containsAll;
            };
            if (pool && revision && hasValidGeometry(pool) && !activePoolAnchor) {
                const lanes: go.Group[] = [];
                const laneKeys = new Set<string>();
                const registerLane = (part: go.Part) => {
                    if (!(part instanceof go.Group) || part.category !== "Lane") return;
                    const key = String(part.data?.key || part.key || "");
                    if (!key || laneKeys.has(key)) return;
                    laneKeys.add(key);
                    lanes.push(part);
                };
                pool.memberParts.each((part: go.Part) => {
                    registerLane(part);
                });
                const poolKey = String(pool.data?.key || pool.key || "");
                diagram.nodes.each((part: go.Part) => {
                    if (String(part.data?.group || "") === poolKey) registerLane(part);
                });
                if (lanes.length > 0 && lanes.every((lane) =>
                    String(lane.data?.layoutRevision || "").trim() === revision && hasValidGeometry(lane)
                ) && formsAlignedLaneStack(lanes) && poolFitsLaneStack(lanes) && lanes.every(containsPersistedMembers)) return;
            }
            diagram.startTransaction("PoolLayout");
            const structuralParts = new go.Set<go.Part>();
            const structuralLanes: go.Group[] = [];
            const structuralLaneKeys = new Set<string>();
            const memberLocations: Array<{
                part: go.Node;
                lane: go.Group;
                location: go.Point;
                laneStartLocation: go.Point;
                preserveLaneOffset: boolean;
            }> = [];
            if (pool && activePoolAnchor) {
                pool.location = activePoolAnchor.location.copy();
                if (pool.data) {
                    diagram.model.setDataProperty(
                        pool.data,
                        "loc",
                        go.Point.stringify(activePoolAnchor.location)
                    );
                }
            }
            const poolBodyBounds = activePoolAnchor?.bodyBounds.copy()
                || pool?.findObject("POOL_BODY_SHAPE")?.getDocumentBounds().copy()
                || null;
            if (pool !== null && pool.category === "Pool") {
                const registerStructuralLane = (lane: go.Part) => {
                    if (!(lane instanceof go.Group) || lane.category === "Pool") return;
                    const laneKey = String(lane.data?.key || lane.key || "");
                    if (!laneKey || structuralLaneKeys.has(laneKey)) return;
                    structuralLaneKeys.add(laneKey);
                    structuralParts.add(lane);
                    structuralLanes.push(lane);
                    const laneStartLocation = lane.location.copy();
                    const preserveLaneOffset = !!activeLaneDragKeys?.has(laneKey);
                    // Pool layout owns only the Lane frames. GoJS normally moves a Group's
                    // members when the Group is arranged, so preserve the modeller's manual
                    // positions. Imports use persisted document coordinates; intentional Lane
                    // drags preserve each member's live offset from that Lane.
                    lane.memberParts.each((member: go.Part) => {
                        if (member instanceof go.Node && !(member instanceof go.Group)) {
                            let savedLocation = member.location.copy();
                            const persistedLoc = preserveLaneOffset
                                ? ""
                                : String(member.data?.loc || "").trim();
                            if (persistedLoc) {
                                try {
                                    const point = go.Point.parse(persistedLoc);
                                    if (Number.isFinite(point.x) && Number.isFinite(point.y)) savedLocation = point;
                                } catch (_) { }
                            }
                            memberLocations.push({
                                part: member,
                                lane,
                                location: savedLocation,
                                laneStartLocation,
                                preserveLaneOffset
                            });
                        }
                    });
                    const shape = lane.resizeObject as go.Shape;
                    if (shape !== null) {
                        const sz = computeLaneSize(lane);
                        // Only enforce absolute minimum, don't force all lanes to match
                        if (isNaN(shape.width)) shape.width = MINLENGTH;
                        shape.height = (!isNaN(shape.height)) ? Math.max(shape.height, sz.height) : sz.height;
                    }
                };
                // GoJS membership and persisted membership can settle on different ticks during
                // import. Use both so no Lane is omitted from the structural pass.
                pool.memberParts.each(registerStructuralLane);
                const poolKey = String(pool.data?.key || pool.key || "");
                diagram.nodes.each((part: go.Part) => {
                    if (String(part.data?.group || "") === poolKey) registerStructuralLane(part);
                });
            }
            // Let GridLayout arrange the lanes within the Pool's document-space
            // bounds. Assigning (0, currentY) here treats those values as absolute
            // document coordinates and detaches an imported Pool/Lane structure
            // from the BPMN nodes it was positioned around.
            super.doLayout(structuralParts.count > 0 ? structuralParts : coll);
            // GridLayout can offset lanes with different live member bounds. Normalize the
            // rendered Lane frames explicitly against the Pool body, without touching content.
            structuralLanes.sort((a, b) => {
                const aLoc = go.Point.parse(String(a.data?.loc || go.Point.stringify(a.location)));
                const bLoc = go.Point.parse(String(b.data?.loc || go.Point.stringify(b.location)));
                return aLoc.y - bLoc.y;
            });
            // A Pool has one structural width. Use the widest persisted Lane body
            // and apply it to every Lane so their right edges always align.
            let sharedLaneBodyWidth = MINLENGTH;
            structuralLanes.forEach((lane) => {
                const size = go.Size.parse(String(lane.data?.size || ""));
                const laneShape = lane.resizeObject as go.Shape | null;
                const width = Number.isFinite(size.width) && size.width > 0
                    ? size.width
                    : laneShape?.actualBounds.width;
                if (Number.isFinite(width) && Number(width) > 0) {
                    sharedLaneBodyWidth = Math.max(sharedLaneBodyWidth, Number(width));
                }
            });
            const firstFrame = structuralLanes.length > 0 ? getLaneFrameBounds(structuralLanes[0]) : null;
            const laneLeft = poolBodyBounds?.x ?? firstFrame?.x ?? 0;
            // Align the Lane's outer 1px stroke with the Pool header's rendered
            // outer edge. POOL_BODY_SHAPE has a 2px stroke and is half a pixel
            // higher in document bounds on some zoom levels.
            const poolHeaderBounds = pool?.findObject("POOL_HEADER_STRIP")?.getDocumentBounds();
            let laneTop = poolHeaderBounds?.y ?? poolBodyBounds?.y ?? firstFrame?.y ?? 0;
            const poolLaneTop = laneTop;
            structuralLanes.forEach((lane) => {
                const frame = getLaneFrameBounds(lane);
                const dataSize = go.Size.parse(String(lane.data?.size || ""));
                const savedHeight = Number.isFinite(dataSize.height) && dataSize.height > 0
                    ? dataSize.height
                    : frame.height;
                let contentBottom = laneTop;
                memberLocations.forEach(({
                    part,
                    lane: owner,
                    location,
                    laneStartLocation,
                    preserveLaneOffset
                }) => {
                    if (owner !== lane) return;
                    // Predict the member bounds without moving it yet. During an intentional
                    // Lane drag, the member follows the Lane's final stacked position.
                    const targetY = preserveLaneOffset
                        ? location.y + laneTop - laneStartLocation.y
                        : location.y;
                    const offsetY = targetY - part.location.y;
                    contentBottom = Math.max(contentBottom, part.actualBounds.bottom + offsetY);
                });
                const laneHeight = Math.max(savedHeight, Math.ceil(contentBottom - laneTop + 10));
                const nextLocation = new go.Point(laneLeft, laneTop);
                lane.location = nextLocation;
                diagram.model.setDataProperty(lane.data, "loc", go.Point.stringify(nextLocation));
                const laneShape = lane.resizeObject as go.Shape | null;
                if (laneShape) {
                    laneShape.desiredSize = new go.Size(sharedLaneBodyWidth, laneHeight);
                    diagram.model.setDataProperty(
                        lane.data,
                        "size",
                        go.Size.stringify(new go.Size(sharedLaneBodyWidth, laneHeight))
                    );
                }
                laneTop += laneHeight;
            });
            memberLocations.forEach(({
                part,
                lane,
                location,
                laneStartLocation,
                preserveLaneOffset
            }) => {
                let finalLocation = preserveLaneOffset
                    ? new go.Point(
                        location.x + lane.location.x - laneStartLocation.x,
                        location.y + lane.location.y - laneStartLocation.y
                    )
                    : location.copy();
                // Keep manually arranged content intact, but correct items that overlap
                // the Lane header/left border. This gives every member a small body inset.
                const predictedLeft = part.actualBounds.left + finalLocation.x - part.location.x;
                const minimumLeft = lane.location.x + SWIM_HEADER_WIDTH + 16;
                if (predictedLeft < minimumLeft) {
                    finalLocation = new go.Point(
                        finalLocation.x + minimumLeft - predictedLeft,
                        finalLocation.y
                    );
                }
                part.location = finalLocation;
                if (part.data) {
                    diagram.model.setDataProperty(part.data, "loc", go.Point.stringify(finalLocation));
                }
            });
            if (pool && structuralLanes.length > 0) {
                const laneStackWidth = SWIM_HEADER_WIDTH + sharedLaneBodyWidth;
                const laneStackHeight = Math.max(MINBREADTH, laneTop - poolLaneTop);
                const poolBody = pool.findObject("POOL_BODY_SHAPE") as go.Shape | null;
                if (poolBody) {
                    poolBody.desiredSize = new go.Size(laneStackWidth, laneStackHeight);
                }
                // Pool data.size includes its own left header; POOL_BODY_SHAPE excludes it.
                const poolSize = new go.Size(
                    SWIM_HEADER_WIDTH + laneStackWidth,
                    laneStackHeight
                );
                diagram.model.setDataProperty(pool.data, "size", go.Size.stringify(poolSize));
                if (pool.data?.objectview) {
                    pool.data.objectview.size = go.Size.stringify(poolSize);
                }
            }
            diagram.commitTransaction("PoolLayout");
        }
    }
    
    // Create resize adornment for pool with standard handles
    function makePoolResizeAdornmentTemplate() {
        return $(go.Adornment, "Spot",
            $(go.Placeholder),
            // Standard resize handles
            $(go.Shape, { alignment: go.Spot.TopLeft, cursor: "nw-resize", desiredSize: new go.Size(8, 8), fill: "lightblue", stroke: "dodgerblue" }),
            $(go.Shape, { alignment: go.Spot.Top, cursor: "n-resize", desiredSize: new go.Size(8, 8), fill: "lightblue", stroke: "dodgerblue" }),
            $(go.Shape, { alignment: go.Spot.TopRight, cursor: "ne-resize", desiredSize: new go.Size(8, 8), fill: "lightblue", stroke: "dodgerblue" }),
            $(go.Shape, { alignment: go.Spot.Left, cursor: "w-resize", desiredSize: new go.Size(8, 8), fill: "lightblue", stroke: "dodgerblue" }),
            $(go.Shape, { alignment: go.Spot.Right, cursor: "e-resize", desiredSize: new go.Size(8, 8), fill: "lightblue", stroke: "dodgerblue" }),
            $(go.Shape, { alignment: go.Spot.BottomLeft, cursor: "sw-resize", desiredSize: new go.Size(8, 8), fill: "lightblue", stroke: "dodgerblue" }),
            $(go.Shape, { alignment: go.Spot.Bottom, cursor: "s-resize", desiredSize: new go.Size(8, 8), fill: "lightblue", stroke: "dodgerblue" }),
            $(go.Shape, { alignment: go.Spot.BottomRight, cursor: "se-resize", desiredSize: new go.Size(8, 8), fill: "lightblue", stroke: "dodgerblue" })
        );
    }
    
    // Create resize adornment for lanes with two handles
    function makeLaneResizeAdornmentTemplate() {
        return $(go.Adornment, "Spot",
            $(go.Placeholder),
            // Right handle for resizing lane width (affects all lanes in pool)
            $(go.Shape,
                {
                    alignment: go.Spot.Right,
                    cursor: "ew-resize",
                    desiredSize: new go.Size(8, 50),
                    fill: "lightblue",
                    stroke: "dodgerblue"
                }
            ),
            // Bottom handle for resizing lane height (only this lane)
            $(go.Shape,
                {
                    alignment: go.Spot.Bottom,
                    cursor: "ns-resize",
                    desiredSize: new go.Size(50, 8),
                    fill: "lightblue",
                    stroke: "dodgerblue"
                }
            )
        );
    }
    
    // Function to install the custom LaneResizingTool on a diagram (will be enabled later)
    function installLaneResizingTool(diagram: go.Diagram) {
        diagram.toolManager.resizingTool = new LaneResizingTool();
    }
    
    // Helper function for group style
    function swimlaneGroupStyle() {
        return [
            {
                layerName: "Background",
                background: "transparent",
                movable: true,
                copyable: false,
                avoidable: false,
                minLocation: new go.Point(NaN, -Infinity),  // only allow vertical movement
                maxLocation: new go.Point(NaN, Infinity)
            },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify)
        ];
    }
    
    if (true) { // New Pool Template
        const newPoolTemplate = 
        $(go.Group, "Horizontal",
            {
                layerName: "Background",
                movable: true,
                copyable: false,
                resizable: true,
                contextMenu: contextMenu,
                resizeObjectName: "POOL_BODY_SHAPE",
                // Select the complete Pool Group (header, body, and member-lane extent).
                // Resizing remains scoped to POOL_BODY_SHAPE.
                layout: $(PoolLayout),
                computesBoundsAfterDrag: false,
                computesBoundsIncludingLinks: false,
                computesBoundsIncludingLocation: false,
                handlesDragDropForMembers: true,
                mouseDrop: function(e: go.InputEvent, pool: go.Group) {
                    // Accept lanes dropped on the pool
                    const diagram = pool.diagram;
                    if (!diagram) return;
                    
                    const dragged = e.diagram.selection;
                    
                    // Check if we're dragging lanes
                    let hasLanes = false;
                    dragged.each((part: go.Part) => {
                        if (part instanceof go.Group && part.category === "Lane") {
                            hasLanes = true;
                        }
                    });
                    
                    if (!hasLanes) return; // Not dragging lanes, ignore
                    
                    const ok = pool.addMembers(dragged, true);
                    if (!ok) {
                        diagram.currentTool.doCancel();
                        return;
                    }
                    
                    // Update each lane's group property in the model
                    dragged.each((part: go.Part) => {
                        if (!(part instanceof go.Group)) return;
                        if (part.category !== "Lane") return;
                        if (part.data) {
                            diagram.model.setDataProperty(part.data, "group", pool.data?.key);
                        }
                    });
                    
                    // Trigger pool layout to arrange lanes
                    diagram.startTransaction("pool accept lanes");
                    pool.layout.invalidateLayout();
                    diagram.layoutDiagram();
                    diagram.commitTransaction("pool accept lanes");
                }
            },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),
            
            // Pool header strip on the left
            $(go.Panel, "Auto",
                { 
                    name: "POOL_HEADER_STRIP",
                    width: 36,
                    stretch: go.GraphObject.Vertical  // Extend to cover all lanes
                },
                $(go.Shape, "Rectangle",
                    {
                        fill: "lightgray",
                        stroke: "black",
                        strokeWidth: 2
                    }
                ),
                $(go.TextBlock,
                    {
                        angle: 270,
                        font: "bold 14pt sans-serif",
                        margin: 5,
                        name: "name",
                        editable: true,
                        doubleClick: (e, obj) => e.diagram.commandHandler.editTextBlock(obj as go.TextBlock),
                    },
                    new go.Binding("text", "name").makeTwoWay()
                )
            ),
            
            // Pool body - contains lanes. The main shape owns the bounds; the
            // Placeholder must not resize an explicitly sized imported Pool.
            $(go.Panel, "Spot",
                $(go.Shape, "Rectangle",
                    {
                        name: "POOL_BODY_SHAPE",
                        isPanelMain: true,
                        fill: "white",
                        stroke: "black",
                        strokeWidth: 2,
                        minSize: new go.Size(220, 100)
                    },
                    new go.Binding("desiredSize", "size", (value: string) => {
                        const size = go.Size.parse(value || "");
                        const width = Number.isFinite(size.width) && size.width > 0
                            ? Math.max(220, size.width - SWIM_HEADER_WIDTH)
                            : 220;
                        const height = Number.isFinite(size.height) && size.height > 0
                            ? Math.max(100, size.height)
                            : 100;
                        return new go.Size(width, height);
                    })
                ),
                
                // Placeholder for lanes
                $(go.Placeholder,
                    { 
                        padding: 0,
                        alignment: go.Spot.TopLeft,
                        alignmentFocus: go.Spot.TopLeft,
                        // The Pool border is owned only by POOL_BODY_SHAPE. If the
                        // Placeholder participates during a Lane drag, GoJS moves the
                        // Pool edge with that Lane until mouse-up.
                        visible: false
                    }
                )
            )
        );
        
        groupTemplateMap.add("Pool", newPoolTemplate);
        addGroupTemplateName('Pool');
        
        // Add resize adornment for pool
        groupTemplateMap.get("Pool").resizeAdornmentTemplate = makePoolResizeAdornmentTemplate();
    }
    
    if (true) { // New Lane Template
        const newLaneTemplate =
        $(go.Group, "Auto",  // Changed to Auto - simpler bounds calculation
            {
                layerName: "Background",
                background: "transparent",
                movable: true,
                copyable: false,
                resizable: true,
                contextMenu: contextMenu,
                // The lane frame owns selection bounds.  The Table can be wider while
                // GoJS is arranging members, which made its selection outline extend
                // beyond the visible white lane body.
                selectionObjectName: "LANE_MAIN_SHAPE",
                resizeObjectName: "LANE_SHAPE",  // Point to the shape for resizing
                locationObjectName: "LANE_MAIN_SHAPE",
                locationSpot: go.Spot.TopLeft,
                // No explicit desiredSize - let Auto panel compute from children
                layout: null,
                computesBoundsAfterDrag: false,
                computesBoundsIncludingLinks: false,
                computesBoundsIncludingLocation: false,
                handlesDragDropForMembers: true,
                // When lane is moved inside a pool, restrict to vertical only
                dragComputation: function(part: go.Part, pt: go.Point, gridpt: go.Point) {
                    // Only restrict to vertical movement when lane is inside a pool
                    if (part instanceof go.Group && part.containingGroup) {
                        const diagram = part.diagram;
                        if (diagram) markActiveSwimlaneDrag(diagram, part);
                        return new go.Point(part.location.x, gridpt.y);
                    }
                    // Allow free movement for standalone lanes and during palette drag
                    return gridpt;
                }
            },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),

            // Match alpha44: use a fixed, transparent full-lane frame for selection
            // and location.  `size` remains the body size, so add the header width.
            $(go.Shape, "Rectangle",
                {
                    name: "LANE_MAIN_SHAPE",
                    isPanelMain: true,
                    fill: "transparent",
                    stroke: "transparent",
                    pickable: false,
                },
                new go.Binding("desiredSize", "size", (s) => {
                    const size = go.Size.parse(typeof s === "string" ? s : "");
                    const width = Number.isFinite(size.width) && size.width > 0 ? size.width : MINLENGTH;
                    const height = Number.isFinite(size.height) && size.height > 0 ? size.height : MINBREADTH;
                    return new go.Size(SWIM_HEADER_WIDTH + width, height);
                })
            ),
            
            // Table panel with header and body
            $(go.Panel, "Table",
                {
                    name: "LANE_TABLE",
                    defaultAlignment: go.Spot.Left
                },
                
                // Lane header - column 0
                $(go.Panel, "Auto",
                    {
                        column: 0,
                        width: 36,
                        stretch: go.GraphObject.Vertical
                    },
                    $(go.Shape, "Rectangle",
                        {
                            fill: "white",
                            stroke: "blue",
                            strokeWidth: 1
                        }
                    ),
                    $(go.TextBlock,
                        {
                            angle: 270,
                            font: "bold 11pt sans-serif",
                            margin: 5,
                            name: "name",
                            editable: true,
                            doubleClick: (e, obj) => e.diagram.commandHandler.editTextBlock(obj as go.TextBlock),
                        },
                        new go.Binding("text", "name").makeTwoWay()
                    )
                ),
                
                // Lane body - column 1. The main shape owns the bounds; member
                // coordinates may overflow visually but cannot resize the Lane.
                $(go.Panel, "Spot",
                    {
                        column: 1,
                        minSize: new go.Size(MINLENGTH, MINBREADTH)
                        // Let the shape inside define the size
                    },
                    // Lane shape - background
                    $(go.Shape, "Rectangle",
                        {
                            name: "LANE_SHAPE",
                            isPanelMain: true,
                            fill: "white",
                            stroke: "black",
                            strokeWidth: 1,
                            minSize: new go.Size(MINLENGTH, MINBREADTH),
                            desiredSize: new go.Size(MINLENGTH, MINBREADTH)
                        },
                        // Bind to size data
                        new go.Binding("desiredSize", "size", (s) => {
                            if (!s || typeof s !== 'string' || s === '') {
                                return new go.Size(MINLENGTH, MINBREADTH);
                            }
                            const sz = go.Size.parse(s);
                            const w = (sz && !isNaN(sz.width) && sz.width > 0) ? sz.width : MINLENGTH;
                            const h = (sz && !isNaN(sz.height) && sz.height > 0) ? sz.height : MINBREADTH;
                            return new go.Size(w, h);
                        }).makeTwoWay(go.Size.stringify)
                    ),
                    // Placeholder for lane contents
                    $(go.Placeholder,
                        {
                            padding: 0,
                            alignment: go.Spot.TopLeft,
                            alignmentFocus: go.Spot.TopLeft,
                            // Lane members keep explicit document coordinates. The fixed Lane
                            // shape owns the frame; member bounds must never remeasure or shift it.
                            visible: false
                        }
                    )
                )
            )
        );
        
        groupTemplateMap.add("Lane", newLaneTemplate);
        addGroupTemplateName('Lane');
        
        // Add custom resize adornment with two handles
        groupTemplateMap.get("Lane").resizeAdornmentTemplate = makeLaneResizeAdornmentTemplate();
    }
    
    // =============================================================================
    // END NEW TEMPLATES
    // =============================================================================
    
    if (true) { // poolTemplate
        const poolTemplate =
        $(go.Group, "Auto",
            {
                resizable: true,
                minSize: getMinSize(),
                contextMenu: contextMenu,
                selectionAdorned: true,
                padding: new go.Margin(0),
                // Keep selection/resize aligned with the pool border shape, not with placeholder/member bounds.
                selectionObjectName: "POOL_SHAPE",
                resizeObjectName: "POOL_SHAPE",
                locationSpot: go.Spot.TopLeft,
                computesBoundsAfterDrag: false,
                computesBoundsIncludingLinks: false,
                computesBoundsIncludingLocation: false, // Prevent automatic bounds computation
                mouseDrop: function (e: go.InputEvent, grp: go.Group) {
                    handlePoolLaneDrop(e, grp);
                },
            },
            new go.Binding("isSubGraphExpanded", "isExpanded").makeTwoWay(),
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            // NOTE: pool size is bound on POOL_SHAPE (in poolTop). Binding size on the Group itself causes
            // resize/selection bounds to include transient member-bounds during drag/drop.
            new go.Binding("layout", "groupLayout", (v, obj) => sanitizeGroupLayout(v, obj)).makeTwoWay(),
            
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
        groupTemplateMap.add("Pool_OLD", poolTemplate);
        addGroupTemplateName('Pool_OLD');

        // define a custom resize adornment that has two resize handles if the group is expanded
        groupTemplateMap.get("Pool_OLD").resizeAdornmentTemplate = addResizeAdornment("Lane");
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
          computesBoundsAfterDrag: false,
          computesBoundsIncludingLinks: false, // to reduce occurrences of links going briefly outside the lane
          computesBoundsIncludingLocation: false, // Prevent automatic bounds computation
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


// Helper functions to provide default color if none specified and icons ----------------------------------------------------------------------------

function defaultStrokeColor(strokecolor2) {
    if (debug) console.log("3567 defaultStrokeColor: ", strokecolor2);
    return  (strokecolor2 === "") ? "#466" : strokecolor2; // Dark bluegreen default, or custom color
}

function decodeUnicodeGlyph(value: string): string {
    if (!value) return "";

    const normalized = value.trim();
    const lowerMatch = normalized.match(/^(?:\\)?u(?:\{([0-9a-fA-F]{1,6})\}|([0-9a-fA-F]{4,6}))$/i);
    const upperMatch = normalized.match(/^(?:\\)?U(?:\{([0-9a-fA-F]{1,8})\}|([0-9a-fA-F]{6,8}))$/);

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

    const unicodeEscapeMatch = value.match(/^(?:\\)?u(?:\{[0-9a-fA-F]{1,6}\}|[0-9a-fA-F]{4,6})$/i);
    const unicodeEmojiMatch = value.match(/^(?:\\)?U(?:\{[0-9a-fA-F]{1,8}\}|[0-9a-fA-F]{6,8})$/);
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
        return 'figure';
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
    if (detectIconFormat(image) === "unicode")
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
            const hasExplicitSize = typeof data?.size === "string" && data.size.trim() !== "";
            if (!hasExplicitSize) {
                const parentSize =
                    grp.data?.size instanceof go.Size
                        ? grp.data.size
                        : go.Size.parse(grp.data?.size || `${grp.actualBounds.width} ${grp.actualBounds.height}`);
                const childWidth = Math.max(1, parentSize.width * NESTED_GROUP_SIZE_RATIO);
                const childHeight = Math.max(1, parentSize.height * NESTED_GROUP_SIZE_RATIO);
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

function finishDropOnShiftOnly(e, grp) {
    finishDrop(e, grp);
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
