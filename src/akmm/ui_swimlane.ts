// @ts-nocheck
const debug = false; 

import * as go from 'gojs';
import * as uid from './ui_diagram';
import * as akm from './metamodeller';

const $ = go.GraphObject.make;
let myDiagram: go.Diagram;

const UnselectedBrush = "lightgray";  // item appearance, if not "selected"
const SelectedBrush   = "dodgerblue";   // item appearance, if "selected"
const GradientYellow = $(go.Brush, 'Linear', { 0: 'LightGoldenRodYellow', 1: '#FFFF66' });
const GradientLightGreen = $(go.Brush, 'Linear', { 0: '#E0FEE0', 1: 'PaleGreen' });
const GradientLightGray = $(go.Brush, 'Linear', { 0: 'White', 1: '#DADADA' });

const EventNodeSize = 42;
const DataFill = GradientLightGray;

// In this design each swimlane is implemented by a Group, and all lanes are inside a "Pool" Group. Each lane Group has its own Group.layout, which in this case is a LayeredDigraphLayout. Each pool Group has its own custom GridLayout that arranges all of its lanes in a vertical stack. That custom layout makes sure all of the pool's lanes have the same length. If you don't want each lane/group to have its own layout, you could use set the lane group's Group.layout to null and set the pool group's Group.layout to an instance of SwimLaneLayout, shown at Swim Lane Layout.

// When dragging nodes note that the nodes are limited to stay within the lanes. This is implemented by a custom Part.dragComputation function, here named stayInGroup. Hold down the Shift key while dragging simple nodes to move the selection to another lane. Lane groups cannot be moved between pool groups.

// A Group (i.e. swimlane) is movable but not copyable. When the user moves a lane up or down the lanes automatically re-order. You can prevent lanes from being moved and thus re-ordered by setting Group.movable to false.

// Each Group is collapsible. The previous breadth of that lane is saved in the savedBreadth property, to be restored when expanded.

// When a Group/lane is selected, its custom Part.resizeAdornmentTemplate gives it a broad resize handle at the bottom of the Group and a broad resize handle at the right side of the Group. This allows the user to resize the "breadth" of the selected lane as well as the "length" of all of the lanes. However, the custom ResizingTool prevents the lane from being too narrow to hold the Group.placeholder that represents the subgraph, and it prevents the lane from being too short to hold any of the contents of the lanes. Each Group/lane is also has a GraphObject.minSize to keep it from being too narrow even if there are no member Parts at all.

// A different sample has its swim lanes vertically oriented: Swim Lanes (vertical).

// Layout Save Load Diagram Model saved in JSON format:
// GoJS version 2.3.5. Copyright 1998-2023 by Northwoods Software.

// View this sample page's source on GitHub

// View the code for this sample in-pageDownload the HTML and JS to use as a starting point

    // These parameters need to be set before defining the templates.
    const MINLENGTH = 200;  // this controls the minimum length of any swimlane
    const MINBREADTH = 20;  // this controls the minimum breadth of any non-collapsed swimlane

    // some shared functions

    // this may be called to force the lanes to be laid out again
    function relayoutLanes() {
      myDiagram.nodes.each(lane => {
        if (!(lane instanceof go.Group)) return;
        if (lane.category === "Pool") return;
        lane.layout.isValidLayout = false;  // force it to be invalid
      });
      myDiagram.layoutDiagram();
    }

    // this is called after nodes have been moved or lanes resized, to layout all of the Pool Groups again
    function relayoutDiagram(diagram) {
      diagram.layout.invalidateLayout();
      diagram.findTopLevelGroups().each(g => {
        if (g.category === "Pool") g.layout.invalidateLayout();
      });
      diagram.layoutDiagram();
    }

    // compute the minimum size of a Pool Group needed to hold all of the Lane Groups
    function computeMinPoolSize(pool) {
      // assert(pool instanceof go.Group && pool.category === "Pool");
      let len = MINLENGTH;
      pool.memberParts.each(lane => {
        // pools ought to only contain lanes, not plain Nodes
        if (!(lane instanceof go.Group)) return;
        const holder = lane.placeholder;
        if (holder !== null) {
          len = Math.max(len, holder.actualBounds.width);
        }
      });
      return new go.Size(len, NaN);
    }

    // compute the minimum size for a particular Lane Group
    function computeLaneSize(lane) {
      // assert(lane instanceof go.Group && lane.category !== "Pool");
      const sz = computeMinLaneSize(lane);
      if (lane.isSubGraphExpanded) {
        const holder = lane.placeholder;
        if (holder !== null) {
          sz.height = Math.ceil(Math.max(sz.height, holder.actualBounds.height));
        }
      }
      // minimum breadth needs to be big enough to hold the header
      const hdr = lane.findObject("HEADER");
      if (hdr !== null) sz.height = Math.ceil(Math.max(sz.height, hdr.actualBounds.height));
      return sz;
    }

    // determine the minimum size of a Lane Group, even if collapsed
    function computeMinLaneSize(lane) {
      if (!lane.isSubGraphExpanded) return new go.Size(MINLENGTH, 1);
      return new go.Size(MINLENGTH, MINBREADTH);
    }

  // define a custom ResizingTool to limit how far one can shrink a lane Group
  class LaneResizingTool extends go.ResizingTool {
    isLengthening() {
      return (this.handle.alignment === go.Spot.Right);
    }

    computeMinSize() {
      const lane = this.adornedObject.part;
      // assert(lane instanceof go.Group && lane.category !== "Pool");
      const msz = computeMinLaneSize(lane);  // get the absolute minimum size
      if (this.isLengthening()) {  // compute the minimum length of all lanes
        const sz = computeMinPoolSize(lane.containingGroup);
        msz.width = Math.max(msz.width, sz.width);
      } else {  // find the minimum size of this single lane
        const sz = computeLaneSize(lane);
        msz.width = Math.max(msz.width, sz.width);
        msz.height = Math.max(msz.height, sz.height);
      }
      return msz;
    }

    resize(newr) {
      const lane = this.adornedObject.part;
      if (this.isLengthening()) {  // changing the length of all of the lanes
        lane.containingGroup.memberParts.each(lane => {
          if (!(lane instanceof go.Group)) return;
          const shape = lane.resizeObject;
          if (shape !== null) {  // set its desiredSize length, but leave each breadth alone
            shape.width = newr.width;
          }
        });
      } else {  // changing the breadth of a single lane
        super.resize(newr);
      }
      relayoutDiagram(this.diagram);  // now that the lane has changed size, layout the pool again
    }
  }
  // end LaneResizingTool class


  // define a custom grid layout that makes sure the length of each lane is the same
  // and that each lane is broad enough to hold its subgraph
  class PoolLayout extends go.GridLayout {
    constructor() {
      super();
      this.cellSize = new go.Size(1, 1);
      this.wrappingColumn = 1;
      this.wrappingWidth = Infinity;
      this.isRealtime = false;  // don't continuously layout while dragging
      this.alignment = go.GridLayout.Position;
      // This sorts based on the location of each Group.
      // This is useful when Groups can be moved up and down in order to change their order.
      this.comparer = (a, b) => {
        const ay = a.location.y;
        const by = b.location.y;
        if (isNaN(ay) || isNaN(by)) return 0;
        if (ay < by) return -1;
        if (ay > by) return 1;
        return 0;
      };
      this.boundsComputation = (part, layout, rect) => {
        part.getDocumentBounds(rect);
        rect.inflate(-1, -1);  // negative strokeWidth of the border Shape
        return rect;
      }
    }

    doLayout(coll) {
      const diagram = this.diagram;
      if (diagram === null) return;
      diagram.startTransaction("PoolLayout");
      const pool = this.group;
      if (pool !== null && pool.category === "Pool") {
        // make sure all of the Group Shapes are big enough
        const minsize = computeMinPoolSize(pool);
        pool.memberParts.each(lane => {
          if (!(lane instanceof go.Group)) return;
          if (lane.category !== "Pool") {
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
      super.doLayout(coll);
      diagram.commitTransaction("PoolLayout");
    }
  }
  // end PoolLayout class


    // function init() {

    //   // Since 2.2 you can also author concise templates with method chaining instead of GraphObject.make
    //   // For details, see https://gojs.net/latest/intro/buildingObjects.html
    //   const $ = go.GraphObject.make;


    //   myDiagram.nodeTemplate =
    //     $(go.Node, "Auto",
    //       new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
    //       $(go.Shape, "Rectangle",
    //         { fill: "white", portId: "", cursor: "pointer", fromLinkable: true, toLinkable: true }),
    //       $(go.TextBlock, { margin: 5 },
    //         new go.Binding("text", "key")),
    //       // { dragComputation: stayInGroup } // limit dragging of Nodes to stay within the containing Group, defined above
    //     );

    function groupStyle() {  // common settings for both Lane and Pool Groups
        return [
          {
            layerName: "Background",  // all pools and lanes are always behind all nodes and links
            background: "transparent",  // can grab anywhere in bounds
            movable: true, // allows users to re-order by dragging
            copyable: false,  // can't copy lanes or pools
            avoidable: false,  // don't impede AvoidsNodes routed Links
            minLocation: new go.Point(NaN, -Infinity),  // only allow vertical movement
            maxLocation: new go.Point(NaN, Infinity)
          },
          new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify)
        ];
    }

    // hide links between lanes when either lane is collapsed
    function updateCrossLaneLinks(group) {
    group.findExternalLinksConnected().each(l => {
        l.visible = (l.fromNode.isVisible() && l.toNode.isVisible());
    });
    }

