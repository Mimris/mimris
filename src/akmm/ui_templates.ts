// @ts-nocheck
const debug = false; 
import * as go from 'gojs';
import * as uid from './ui_diagram';
import * as akm from './metamodeller';

const $ = go.GraphObject.make;

require('gojs/extensions/Figures.js');

let myDiagram: go.Diagram;

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
                
export function getFigure(f: string): any {
    switch(f) {
    case 'Rectangle':
        return go.Shape.Rectangle;
    case 'Circle':
        return go.Shape.Circle;
    case 'Ellipse':
        return go.Shape.Ellipse;
    case 'Triangle':
        return go.Shape.Triangle;
    case 'Diamond':
        return go.Shape.Diamond;
    case 'Hexagon':
        return go.Shape.Hexagon;
    case 'Star':
        return go.Shape.Star;
    case 'Pentagon':
        return go.Shape.Pentagon;
    case 'LineH':
        return go.Shape.LineH;
    case 'LineV':
        return go.Shape.LineV;
    case 'PlusLine':
        return go.Shape.PlusLine;
    case 'MinusLine':
        return go.Shape.MinusLine;
    case 'XLine':
        return go.Shape.XLine;
    case 'ThickX':
        return go.Shape.ThickX;
    case 'ThinX':
        return go.Shape.ThinX;
    case 'ThickCross':
        return go.Shape.ThickCross;
    case 'ThinCross':
        return go.Shape.ThinCross;
    case 'TriangleRight':
        return go.Shape.TriangleRight;
    case 'TriangleLeft':
        return go.Shape.TriangleLeft;
    case 'TriangleUp':
        return go.Shape.TriangleUp;
    case 'TriangleDown':
        return go.Shape.TriangleDown;
    case 'RoundedRectangle':
        return go.Shape.RoundedRectangle;
    case 'Square':
        return go.Shape.Square;
    default:
        return go.Shape.Rectangle;
   }
}

function selectionIncludesPorts(n, myDiagram) {
    return n.containingGroup !== null && !myDiagram?.selection.has(n.containingGroup);
}

function groupStyle() {  // common settings for both Lane and Pool Groups
    return [
      {
        layerName: 'Background',  // all pools and lanes are always behind all nodes and links
        background: 'transparent',  // can grab anywhere in bounds
        movable: true, // allows users to re-order by dragging
        copyable: false,  // can't copy lanes or pools
        avoidable: false  // don't impede AvoidsNodes routed Links
      },
      new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify)
    ];
  }

// hide links between lanes when either lane is collapsed
function updateCrossLaneLinks(group: go.Group) {
    group.findExternalLinksConnected().each((ll) => {
        ll.visible = (ll.fromNode !== null && ll.fromNode.isVisible() && ll.toNode !== null && ll.toNode.isVisible());
    });
  }

// let dotted = [3, 3];
// let dashed = [5, 5];

let nodeTemplateNames = []; 
let linkTemplateNames = []; 
let groupTemplateNames = []; 

function makeItemTemplate(side: string, isGroup: boolean, portContextMenu: any) {
    let rightside = side === 'right';
    let leftside = side === 'left';
    let topside = side === 'top';
    let bottomside = side === 'bottom';
     let fromlinkable = rightside || isGroup;
    let tolinkable = leftside || topside || bottomside || isGroup;
    let geostring1 = "F1 m 0,0 l 5,0 1,4 -1,4 -5,0 1,-4 -1,-4 z";
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
    let size = isGroup ? size2 : size1;
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
            contextMenu: portContextMenu, 
        },  // some space between ports
        $(go.Shape,
            {
                name: "SHAPE",
                fill: "white", 
                stroke: "gray",
                strokeWidth: 1,
                geometryString: geostring, 
                toSpot: toSpot,
                portId: "",
                toLinkable: tolinkable,
                fromSpot: fromSpot,
                fromLinkable: fromlinkable,
                cursor: "alias",
                desiredSize: size,
            },
            new go.Binding("portId", "id"),
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
if (false) {
    // Swimpool and swimlane code
    // this is called after nodes have been moved or lanes resized, to layout all of the Pool Groups again
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
    
    
    function groupStyle() {  // common settings for both Lane and Pool Groups
        return [
        {
            layerName: 'Background',  // all pools and lanes are always behind all nodes and links
            background: 'transparent',  // can grab anywhere in bounds
            movable: true, // allows users to re-order by dragging
            copyable: false,  // can't copy lanes or pools
            avoidable: false  // don't impede AvoidsNodes routed Links
        },
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify)
        ];
    }

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
            // in the click event handler, the obj.part is the Adornment; its adornedObject is the port
            { click: function (e: go.InputEvent, obj: go.GraphObject) { addLaneEvent((obj.part as go.Adornment).adornedObject as go.Node); } })
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
        
        // ------------------------------------------  Commands for this application  ----------------------------------------------
        
        // Add a port to the specified side of the selected nodes.   name is beN  (be0, be1)
        // evDim is 5 for Interrupting, 6 for non-Interrupting
        

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
}
export function addNodeTemplates(nodeTemplateMap: any, contextMenu: any, portContextMenu: any, myMetis: akm.cxMetis) {
    const myDiagram = myMetis.myDiagram;
    let nodeTemplate0 =      
    $(go.Node, 'Auto',  // the Shape will go around the TextBlock
        new go.Binding("stroke", "strokecolor"),
        new go.Binding("layerName", "layer"),
        new go.Binding("deletable"),
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding("scale", "scale1").makeTwoWay(),
        $(go.Shape, 'RoundedRectangle', 
        {
            cursor: "alias",
            fill: 'yellow', 
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
        $(go.Panel, "Table", // Panel for text 
            // { defaultAlignment: go.Spot.Left, margin: 2, cursor: "move" },
            $(go.RowColumnDefinition, { column: 1, width: 4 }),
            $(go.Panel, "Horizontal",
            {
                defaultAlignment: go.Spot.Center
            },
            // define the panel where the text will appear
            $(go.Panel, "Table", // separator ---------------------------------
                { 
                    contextMenu: contextMenu , 
                    cursor: "move" 
                },
                {
                defaultRowSeparatorStroke: "black",
                desiredSize: new go.Size(136, 60),
                maxSize: new go.Size(136, 66), 
                // margin: new go.Margin(2),
                defaultAlignment: go.Spot.Center,
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
                desiredSize: new go.Size(120, 60),
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

    nodeTemplateMap.add("textAndIcon", 
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
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
                    cursor: "alias", 
                    name: 'SHAPE', 
                    fill: 'red', 
                    stroke: "#fff",  
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
                        {   
                            contextMenu: contextMenu , 
                            cursor: "move" 
                        },
                        {
                        defaultRowSeparatorStroke: "black",
                        desiredSize: new go.Size(136, 60),
                        maxSize: new go.Size(136, 66), 
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
                            new go.Binding("template"),
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

    nodeTemplateMap.add("textAndFigure", 
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
                        { contextMenu: contextMenu , cursor: "move" },
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
    addNodeTemplateName('textAndFigure');    

    nodeTemplateMap.add('nodeWithPorts',
        $(go.Node, "Table",
            {
                locationObjectName: "BODY",
                locationSpot: go.Spot.Center,
                selectionObjectName: "BODY",
                contextMenu: contextMenu
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
            {
                selectionObjectName: "BODY",
                resizable: true, 
                resizeObjectName: "BODY"
            },
            $(go.Panel, "Auto",
                {
                    row: 1, 
                    column: 1, 
                    name: "BODY",
                    stretch: go.GraphObject.Fill
                },
                $(go.Shape, "RoundedRectangle",
                    {
                        cursor: "alias",
                        fill: "white", 
                        stroke: "black", 
                        strokeWidth: 2,
                        parameter1: 5, 
                        minSize: new go.Size(158, 68),
                        portId: "",
                        fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
                        toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true
                    },
                    new go.Binding('fill', 'fillcolor'),
                    new go.Binding("stroke", "strokecolor"),
                ),
                $(go.TextBlock,
                    { 
                        cursor: "move",
                        margin: 10, 
                        textAlign: "center", 
                        font: "bold 14px Segoe UI,sans-serif", 
                        stroke: "#484848", 
                        editable: true 
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

    nodeTemplateMap.add("label", 
        $(go.Node, 'Auto',  // the Shape will go around the TextBlock
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
                    // fromSpot: go.Spot.AllSides,
                    fromSpot: go.Spot.Left,
                    strokeWidth: 2, 
                    // stroke: 'gray', 
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
                // new go.Binding('background', 'fillcolor'),      
                ),
        )
    );
    addNodeTemplateName('Annotation');

    nodeTemplateMap.add("ActivityNode",
    $(go.Node, 'Spot',
        new go.Binding("layerName", "layer"),
        new go.Binding("deletable"),
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding("scale", "scale1").makeTwoWay(),
        { contextMenu: contextMenu },
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
        // new go.Binding('itemArray', 'boundaryEventArray'),
        $(go.Panel, 'Auto',
            {
            name: 'PANEL',
            minSize: new go.Size(160, 80),
            desiredSize: new go.Size(160, 80)
            },
            new go.Binding('desiredSize', 'size', go.Size.parse).makeTwoWay(go.Size.stringify),
            $(go.Panel, 'Spot',
                $(go.Shape, 'RoundedRectangle',  // the outside rounded rectangle
                    {
                        cursor: 'alias',
                        name: 'SHAPE',
                        fill: $(go.Brush, 'Linear', { 0: 'OldLace', 1: 'PapayaWhip' }), 
                        stroke: '#CDAA7D',
                        parameter1: 10, // corner size
                        portId: '', 
                        fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
                        toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true,
                    },
                    new go.Binding('fill', 'fillcolor'),
                    new go.Binding("stroke", "strokecolor"),
                ),
            ), 
        ),  // end main body rectangles spot panel
        
        $(go.Panel, 'Auto',  // make an area around text for move cursor
            $(go.Shape, 'Rectangle',  // area around the text
                {
                    fill: 'transparent', stroke: null, strokeWidth: 0,
                    cursor: 'move',
                    desiredSize: new go.Size(80, 50),
                },
            ),
        ),
        $(go.TextBlock,  // the center text
          {
            alignment: go.Spot.Center, 
            // background: 'gray',
            cursor: 'move',
            textAlign: 'center', 
            margin: 2,
            editable: true,
          },
          new go.Binding("text", "name").makeTwoWay(),
        )
      )  // end Auto Panel
    );
    addNodeTemplateName('ActivityNode');

    nodeTemplateMap.add("EventNode",
        $(go.Node, 'Vertical',  // the Shape will go around the TextBlock
            new go.Binding("layerName", "layer"),
            new go.Binding("deletable"),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            { contextMenu: contextMenu },    
            {
                selectionObjectName: "SHAPE",
                resizable: true, resizeObjectName: "SHAPE"
            },
            {
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
                        figure: "Circle", 
                        fill: "white",
                        stroke: "blue",
                        strokeWidth: 4,
                        cursor: "alias",                    // cursor: "pointer",
                        minSize: new go.Size(60, 60), 
                        desiredSize: new go.Size(60, 60),   // outer Shape size 
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
                ),
                $(go.Shape,  // Inner circle
                    { 
                        figure: "Circle", 
                        fill: "transparent",
                        stroke: "transparent",
                        strokeWidth: 1,
                        cursor: "move",        // cursor: "pointer",
                        minSize: new go.Size(40, 40), 
                        desiredSize: new go.Size(40, 40), // outer Shape size 
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
            { contextMenu: contextMenu },    
            {
                selectionObjectName: "SHAPE",
                resizable: true, 
                resizeObjectName: "SHAPE"
            },
            {
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
                        figure: "Diamond", 
                        // fill: "lightyellow",
                        stroke: "black",
                        strokeWidth: 1,
                        cursor: "alias",                    // To draw a link,
                        minSize: new go.Size(70, 70), 
                        desiredSize: new go.Size(70, 70),  // outer Shape size 
                        // set the port properties
                        portId: '', 
                        fromLinkable: true, 
                        toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: false,
                        fromSpot: go.Spot.NotLeftSide, 
                        toSpot: go.Spot.NotRightSide,
                    },
                    new go.Binding('fill', 'fillcolor'),
                    new go.Binding('stroke', 'strokecolor'), 
                ),                      
                $(go.Shape,  // Plus line
                    { 
                        cursor: "move",    
                        figure: "XLine", 
                        fill: "transparent",
                        stroke: "black",
                        strokeWidth: 3,
                        minSize: new go.Size(25, 25), 
                        desiredSize: new go.Size(25, 25), // outer Shape size 
                    },
                    new go.Binding('stroke', 'strokecolor'), 
                    new go.Binding("figure", "figure"), 
                ),
                $(go.Shape,  // move
                    { 
                        figure: "Diamond", 
                        fill: "transparent",
                        stroke: "transparent",
                        strokeWidth: 1,
                        cursor: "move",                    // To move a node,
                        minSize: new go.Size(50, 50), 
                        desiredSize: new go.Size(50, 50),  // outer Shape size 
                    },
                ),
            ),    // end Spot Panel
            $(go.TextBlock, textStyle(),  // the text -----------------------
                { 
                    margin: -16, 
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
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            $(go.Shape, 'File',
                {
                name: 'SHAPE', 
                portId: '', 
                fromLinkable: true, 
                toLinkable: true, 
                cursor: 'alias',
                fill: DataFill, 
                desiredSize: new go.Size(EventNodeSize * 0.8, EventNodeSize)
                }
            ),
            { contextMenu: contextMenu },    
            { locationObjectName: 'SHAPE', locationSpot: go.Spot.Center },
            {
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
            {
                locationObjectName: 'SHAPE', 
                locationSpot: go.Spot.Center,
                resizable: true, 
                resizeObjectName: 'PANEL',
                selectionAdorned: false,  // use a Binding on the Shape.stroke to show selection
                //itemTemplate: boundaryEventItemTemplate
            },
            $(go.Panel, 'Spot',  // make an area around text for move cursor
                $(go.Shape, 'Rectangle',  // move
                    {
                        fill: 'transparent', 
                        stroke: null, 
                        strokeWidth: 0,
                        cursor: 'move',
                        desiredSize: new go.Size(75, 5),
                    },
                ),
            ),
            $(go.TextBlock,  // the center text
            {
              alignment: go.Spot.Center, 
              // background: 'gray',
              cursor: 'move',
              textAlign: 'center', 
              margin: 2,
              editable: true,
            },
            new go.Binding("text", "name").makeTwoWay(),
          )
        ),
    );
    addNodeTemplateName('DataObjectNode');

    nodeTemplateMap.add("DataStoreNode",
        $(go.Node, 'Vertical',
            { locationObjectName: 'SHAPE', locationSpot: go.Spot.Center },
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            $(go.Shape, 'Database',
                {
                    name: 'SHAPE', 
                    portId: '', 
                    fromLinkable: true, 
                    toLinkable: true, 
                    cursor: 'alias',
                    fill: DataFill, 
                    desiredSize: new go.Size(EventNodeSize, EventNodeSize)
                }
            ),
            { contextMenu: contextMenu },    
            {
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
            $(go.TextBlock,  // the center text
                {
                    alignment: go.Spot.Center, 
                    // background: 'gray',
                    cursor: 'move',
                    textAlign: 'center', 
                    margin: 2,
                    editable: true,
                },
                new go.Binding("text", "name").makeTwoWay(),
            ),
            $(go.Panel, 'Auto',  // make an area around text for move cursor
            $(go.Shape, 'Rectangle',  // area around the text
                {
                    fill: 'transparent', 
                    stroke: null, 
                    strokeWidth: 0,
                    cursor: 'move',
                    desiredSize: new go.Size(75, 5),
                },
            ),
          ),
        ),
    );
    addNodeTemplateName('DataStoreNode');
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
                resegmentable: true  
            },
            // link route 
            { 
                routing: go.Link.AvoidsNodes,
                curve: go.Link.JumpGap,
                corner: 10,
                reshapable: true, 
                relinkableFrom: true, 
                relinkableTo: true, 
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
            reshapable: true, 
            relinkableFrom: true, relinkableTo: true,
            fromSpot: go.Spot.AllSides,
            toSpot: go.Spot.AllSides,
            toEndSegmentLength: 20, fromEndSegmentLength: 40
        },
        { contextMenu: contextMenu },    
        new go.Binding('points').makeTwoWay(),
        $(go.Shape, { stroke: 'black', strokeWidth: 1, strokeDashArray: [1, 3] }),
        $(go.Shape, { toArrow: 'OpenTriangle', scale: 1, stroke: 'black' }),
        { segmentOffset: new go.Point(-10, -10) },
        new go.Binding("stroke", "textcolor").makeTwoWay(),
        new go.Binding("scale", "textscale").makeTwoWay(),
    );

    linkTemplateMap.add("AnnotationLink", annotationLinkTemplate);
    addLinkTemplateName('AnnotationLink');
    
    if (debug) console.log('1514 linkTemplateMap, linkTemplateNames', linkTemplateMap, linkTemplateNames);
}

export function addGroupTemplates(groupTemplateMap: any, contextMenu: any, portContextMenu: any, myMetis: akm.cxMetis): any {
    // const myDiagram = myMetis.myDiagram;

    const groupTemplate1 =
        $(go.Group, "Auto",
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("visible"),
            { 
                contextMenu: contextMenu,
                locationObjectName: "SHAPE",
                resizable: true, resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
                subGraphExpandedChanged: function (grp) {
                    let shp = grp.resizeObject;
                    if (grp.diagram.undoManager.isUndoingRedoing) return;
                    if (grp.isSubGraphExpanded) {
                        grp.category = "EXPANDED";
                        shp.fill = "white";
                    } else {
                        shp.fill = "white";
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
                        new go.Binding("fill", "fillcolor"),
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
                        name: "SHAPE", 
                        fill: "white",
                        opacity: 0.95,
                        minSize: new go.Size(200, 100), 
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
            locationObjectName:  "SHAPE",
            resizable: true, resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
            subGraphExpandedChanged: function (grp) {
                let shp = grp.resizeObject;
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
                cursor: "alias",
                fill: "transparent", 
                shadowVisible: true,
                minSize: new go.Size(150, 75),
                portId: "", 
                fromLinkable: true, fromLinkableSelfNode: false, fromLinkableDuplicates: true,
                toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: true,
            },
            new go.Binding("fill", "fillcolor"),
            new go.Binding("stroke", "strokecolor"),
            // new go.Binding("strokeWidth", "strokewidth"),
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
                new go.Binding("fill", "fillcolor"),
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("stroke", "textcolor").makeTwoWay()
                ),
            ), // End Horizontal Panel
            
            $(go.Shape,  // using a Shape instead of a Placeholder
              { name: "SHAPE", 
                fill: "lightyellow", 
                opacity: 0.95,
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
    if (true) {
        const groupWithPorts =
        $(go.Group, "Spot",
            {
                locationObjectName:  "SHAPE",
                selectionObjectName: "SHAPE",
                resizable: true, 
                resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
                contextMenu: contextMenu,
            },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("scale", "scale1").makeTwoWay(),
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
            $(go.Panel, "Auto",
                {
                    row: 1, 
                    column: 1, 
                    name: "BODY",
                    stretch: go.GraphObject.Fill
                },
                $(go.Shape, "RoundedRectangle", // surrounds everything
                    {
                        cursor: "alias",
                        fill: "transparent", 
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
                                row: 0, 
                                column: 0, 
                                margin: 5, 
                                alignment: go.Spot.Left,
                                scale: 1.5,
                            },
                        ),  
                        $(go.TextBlock, // group title located at the center
                            { 
                                row: 0, 
                                column: 1, 
                                margin: 5, 
                                alignment: go.Spot.Center,
                                font: "Bold 16pt Sans-Serif",
                                editable: true, 
                                isMultiline: false,
                                name: "name",
                            },
                            new go.Binding("fill", "fillcolor"),
                            new go.Binding("text", "name").makeTwoWay(),
                            new go.Binding("stroke", "textcolor").makeTwoWay()
                        ),
                        $(go.Shape, // a figure (a symbol illustrating what this is all about)
                            new go.Binding("geometryString", "geometry"),
                            new go.Binding("fill", "fillcolor2"),
                            { 
                                row: 0, 
                                column: 2, 
                                margin: 5, 
                                desiredSize: new go.Size(25, 25),
                                alignment: go.Spot.Right,
                            }
                        ),
                    ), // End Horizontal Panel
                    
                    $(go.Shape,  // using a Shape instead of a Placeholder
                        { 
                            name: "SHAPE", 
                            fill: "lightyellow", 
                            opacity: 0.95,
                            minSize: new go.Size(200, 100),
                            margin: new go.Margin(0, 1, 1, 4),
                            cursor: "move",
                            stroke: "transparent",
                        },
                        new go.Binding("fill", "fillcolor"),
                        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),                           
                        new go.Binding("isSubGraphExpanded").makeTwoWay(),    
                    )
                ),
            ),
            // the Panel holding the left port elements, which are themselves Panels,
            // created for each item in the itemArray, bound to data.leftArray
            $(go.Panel, "Vertical", 
                { 
                    // name: "LEFTPORTS", 
                    // alignment: new go.Spot(0, 0.5, 0, 7)
                },
                new go.Binding("itemArray", "leftPorts"),
                {
                    row: 1, 
                    column: 0,
                    itemTemplate: makeItemTemplate('left', true, portContextMenu),
                    alignment: go.Spot.Left, 
                },
            ),  // end leftPorts Panel

            $(go.Panel, "Horizontal",
                { 
                    // name: "TOPPORTS", 
                    // alignment: new go.Spot(1, 0.5, 0, 7)
                },
                new go.Binding("itemArray", "topPorts"),
                {
                    row: 0, 
                    column: 1,
                    itemTemplate: makeItemTemplate('top', true, portContextMenu),
                    alignment: go.Spot.Top, 
                }
            ),  // end topPorts Panel

            // the Panel holding the right port elements, which are themselves Panels,
            // created for each item in the itemArray, bound to data.leftArray
            $(go.Panel, "Vertical", 
            { 
                // name: "RIGHTPORTS", 
                // alignment: new go.Spot(1, 0.5, 0, 7) 
            },
            new go.Binding("itemArray", "rightPorts"),
                {
                    row: 1, 
                    column: 2,
                    itemTemplate: makeItemTemplate('right', true, portContextMenu),
                    alignment: go.Spot.Right, 
                }
            ),  // end rightPorts Panel

            $(go.Panel, "Horizontal",
                { 
                    // name: "BOTTOMPORTS", 
                    // alignment: new go.Spot(1, 0.5, 0, 7)
                },
                new go.Binding("itemArray", "bottomPorts"),
                {
                    row: 0, 
                    column: 1,
                    itemTemplate: makeItemTemplate('bottom', true, portContextMenu),
                    alignment: go.Spot.Bottom, 
                }
            ),  // end bottomPorts Panel
        )
        groupTemplateMap.add("groupWithPorts", groupWithPorts);
        addGroupTemplateName('groupWithPorts');        
    }
    if (true) {
        const groupTemplate4 =
        $(go.Group, "Auto",
          { selectionAdorned: false },
          { locationSpot: go.Spot.Center, locationObjectName: "BODY" },
          new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
          $(go.Panel, "Auto",
            { name: "BODY" },
            $(go.Shape, "RoundedRectangle",
              { stroke: "gray", strokeWidth: 2, fill: "transparent" },
              new go.Binding("stroke", "isSelected", b => b ? SelectedBrush : UnselectedBrush).ofObject()),
            $(go.Panel, "Vertical",
              { margin: 6 },
              $(go.TextBlock,
                new go.Binding("text", "name"),
                { alignment: go.Spot.Left }),
              $(go.Picture, "images/parallel.png",
            //   $(go.Picture, "images/60x90.png",
                { width: 30, height: 45, margin: new go.Margin(10, 10) })
            )
          ),
        //   $(go.Panel, "Vertical",
        //     { name: "LEFTPORTS", alignment: new go.Spot(0, 0.5, 0, 7) },
        //     new go.Binding("itemArray", "inservices"),
        //     { itemTemplate: makeItemTemplate(true) }
        //   ),
        //   $(go.Panel, "Vertical",
        //     { name: "RIGHTPORTS", alignment: new go.Spot(1, 0.5, 0, 7) },
        //     new go.Binding("itemArray", "outservices"),
        //     { itemTemplate: makeItemTemplate(false) }
        //   )
        );
        groupTemplateMap.add("groupTemplate4", groupTemplate4);
        addGroupTemplateName('groupTemplate4');
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
          { contextMenu: contextMenu },
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
    if (false) {
        const swimLanesGroupTemplate =
        $(go.Group, 'Spot', groupStyle(),
          {
            name: 'Lane',
            contextMenu: contextMenu,
            minLocation: new go.Point(NaN, -Infinity),  // only allow vertical movement
            maxLocation: new go.Point(NaN, Infinity),
            selectionObjectName: 'SHAPE',  // selecting a lane causes the body of the lane to be highlit, not the label
            resizable: true, resizeObjectName: 'SHAPE',  // the custom resizeAdornmentTemplate only permits two kinds of resizing
            // layout: $(go.LayeredDigraphLayout,  // automatically lay out the lane's subgraph
            //   {
            //     isInitial: false,  // don't even do initial layout
            //     isOngoing: false,  // don't invalidate layout when nodes or links are added or removed
            //     direction: 0,
            //     columnSpacing: 10,
            //     layeringOption: go.LayeredDigraphLayout.LayerLongestPathSource
            //   }),
            // computesBoundsAfterDrag: true,  // needed to prevent recomputing Group.placeholder bounds too soon
            // computesBoundsIncludingLinks: false,  // to reduce occurrences of links going briefly outside the lane
            // computesBoundsIncludingLocation: true,  // to support empty space at top-left corner of lane
            // handlesDragDropForMembers: true,  // don't need to define handlers on member Nodes and Links
            mouseDrop: function (e: go.InputEvent, grp: go.GraphObject) {  // dropping a copy of some Nodes and Links onto this Group adds them to this Group
              // don't allow drag-and-dropping a mix of regular Nodes and Groups
              if (!e.diagram.selection.any((n) => (n instanceof go.Group && n.category !== 'subprocess') || n.category === 'privateProcess')) {
                if (!(grp instanceof go.Group) || grp.diagram === null) return;
                const ok = grp.addMembers(grp.diagram.selection, true);
                if (ok) {
                  updateCrossLaneLinks(grp);
                  // relayoutDiagram();
                } else {
                  grp.diagram.currentTool.doCancel();
                }
              }
            },
            subGraphExpandedChanged: function (grp: go.Group) {
              if (grp.diagram === null) return;
              if (grp.diagram.undoManager.isUndoingRedoing) return;
              const shp = grp.resizeObject;
              if (grp.isSubGraphExpanded) {
                shp.height = grp.data.savedBreadth;
              } else {
                if (!isNaN(shp.height)) grp.diagram.model.set(grp.data, "savedBreadth", shp.height);
                shp.height = NaN;
              }
              updateCrossLaneLinks(grp);
            }
          },
          // new go.Binding("isSubGraphExpanded", "expanded").makeTwoWay(),
    
          $(go.Shape, 'Rectangle',  // this is the resized object
            { name: 'SHAPE', fill: 'white', stroke: null },  // need stroke null here or you gray out some of pool border.
            new go.Binding('fill', 'color'),
            new go.Binding('desiredSize', 'size', go.Size.parse).makeTwoWay(go.Size.stringify)),
    
          // the lane header consisting of a Shape and a TextBlock
          $(go.Panel, 'Horizontal',
            {
              name: 'HEADER',
              angle: 270,  // maybe rotate the header to read sideways going up
              alignment: go.Spot.LeftCenter, alignmentFocus: go.Spot.LeftCenter
            },
            $(go.TextBlock,  // the lane label
              { editable: true, margin: new go.Margin(2, 0, 0, 8) },
              new go.Binding('visible', 'isSubGraphExpanded').ofObject(),
              new go.Binding('text', 'name').makeTwoWay()),
            $('SubGraphExpanderButton', { margin: 4, angle: -270 })  // but this remains always visible!
          ),  // end Horizontal Panel
          $(go.Placeholder,
            { padding: 12, alignment: go.Spot.TopLeft, alignmentFocus: go.Spot.TopLeft }),
          $(go.Panel, 'Horizontal', { alignment: go.Spot.TopLeft, alignmentFocus: go.Spot.TopLeft },
            $(go.TextBlock,  // this TextBlock is only seen when the swimlane is collapsed
              {
                name: 'LABEL',
                editable: true, visible: false,
                angle: 0, margin: new go.Margin(6, 0, 0, 20)
              },
              new go.Binding('visible', 'isSubGraphExpanded', function (e) { return !e; }).ofObject(),
              new go.Binding('text', 'name').makeTwoWay())
          )
        );  // end swimLanesGroupTemplate
    
      // define a custom resize adornment that has two resize handles if the group is expanded
      // myDiagram.groupTemplate.resizeAdornmentTemplate =
        swimLanesGroupTemplate.resizeAdornmentTemplate =
        $(go.Adornment, 'Spot',
        $(go.Placeholder),
        $(go.Shape,  // for changing the length of a lane
            {
            alignment: go.Spot.Right,
            desiredSize: new go.Size(7, 50),
            fill: 'lightblue', stroke: 'dodgerblue',
            cursor: 'col-resize'
            },
            new go.Binding('visible', '', function (ad) {
            if (ad.adornedPart === null) return false;
            return ad.adornedPart.isSubGraphExpanded;
            }).ofObject()),
        $(go.Shape,  // for changing the breadth of a lane
            {
            alignment: go.Spot.Bottom,
            desiredSize: new go.Size(50, 7),
            fill: 'lightblue', stroke: 'dodgerblue',
            cursor: 'row-resize'
            },
            new go.Binding('visible', '', function (ad) {
            if (ad.adornedPart === null) return false;
            return ad.adornedPart.isSubGraphExpanded;
            }).ofObject())
        );
        groupTemplateMap.add("SwimLane", swimLanesGroupTemplate);
        addGroupTemplateName('SwimLane'); 
    }    
    if (false) {
        const poolGroupTemplate =
        $(go.Group, 'Auto', groupStyle(),
        {
            computesBoundsIncludingLinks: false,
            // use a simple layout that ignores links to stack the "lane" Groups on top of each other
            layout: $(PoolLayout, { spacing: new go.Size(0, 0) })  // no space between lanes
        },
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        $(go.Shape,
            { fill: 'white' },
            new go.Binding('fill', 'color')),
        $(go.Panel, 'Table',
            { defaultColumnSeparatorStroke: 'black' },
            $(go.Panel, 'Horizontal',
            { column: 0, angle: 270 },
            $(go.TextBlock,
                { editable: true, margin: new go.Margin(5, 0, 5, 0) },  // margin matches private process (black box pool)
                new go.Binding('text').makeTwoWay())
            ),
            $(go.Placeholder,
            { background: 'darkgray', column: 1 })
        )
        ); // end poolGroupTemplate
        groupTemplateMap.add("SwimPool", poolGroupTemplate);
        addGroupTemplateName('SwimPool');    
    }
}

export function addPortTemplates() {
    // define the Node template for each attribute in the nodeDataArray
}

// Function to identify images related to an image id
export function findImage(image: string) {
    if (debug) console.log("2561 findImage: " + image);
    if (!image)
        return "";
    // if (image.substring(0,4) === 'http') { // its an URL
    if (image.includes('//')) { // its an URL   
        if (debug) console.log('2563 Diagram', image);
        return image
    } else if (image.includes('/')) { // its a local image
        if (debug) console.log('2566 Diagram', image);   
        return image
    } else if (image.includes('.') === false) { // its a 2character icon 1st with 2nd as subscript
        const firstcharacter = image.substring(0, 1)
        const secondcharacter = image.substring(1, 2)
        if (debug) console.log('2571 Diagram', firstcharacter, secondcharacter)    
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
        if (debug) console.log('2585', img);
        return img

    } else { 
        if (debug) console.log('2586 Diagram', image);
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

