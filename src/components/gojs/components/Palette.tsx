/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import * as React from 'react';
import * as akm from '../../../akmm/metamodeller';
import * as gjs from '../../../akmm/ui_gojs';
import * as uid from '../../../akmm/ui_diagram';

import { GuidedDraggingTool } from '../GuidedDraggingTool';
//import { stringify } from 'querystring';

// import './Diagram.css';

interface DiagramProps {
  divClassName: string;
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  layout: string | null;
  modelData: go.ObjectData;
  myMetis: akm.cxMetis;
  myGoModel: gjs.goModel;
  skipsDiagramUpdate: boolean;
  onDiagramEvent: (e: go.DiagramEvent) => void;
  onModelChange: (e: go.IncrementalData) => void;
  diagramStyle: React.CSSProperties;
}

const debug = false;
export class PaletteWrapper extends React.Component<DiagramProps, {}> {
  /**
   * Ref to keep a reference to the Diagram component, which provides access to the GoJS diagram via getDiagram().
   */
  private diagramRef: React.RefObject<ReactDiagram>;
  public myMetis: akm.cxMetis;
  /** @internal */
  constructor(props: DiagramProps) {
    super(props);
    this.myMetis = props.myMetis;
    this.diagramRef = React.createRef();
    this.initPalette = this.initPalette.bind(this);
    // this.state = {
    //   diagramStyle:  props.diagramStyle,
    // }
  }

  /**
   * Get the diagram reference and add any desired diagram listeners.
   * Typically the same function will be used for each listener, with the function using a switch statement to handle the events.
   */
  public componentDidMount() {
    if (!this.diagramRef.current) return;
    const diagram = this.diagramRef.current.getDiagram();
    if (diagram instanceof go.Diagram) {
      diagram.addDiagramListener('ChangedSelection', this.props.onDiagramEvent);
    }
  }

  /**
   * Get the diagram reference and remove listeners that were added during mounting.
   */
  public componentWillUnmount() {
    if (!this.diagramRef.current) return;
    const diagram = this.diagramRef.current.getDiagram();
    if (diagram instanceof go.Diagram) {
      diagram.removeDiagramListener('ChangedSelection', this.props.onDiagramEvent);
    }
  }

  /**
   * Diagram initialization method, which is passed to the ReactDiagram component.
   * This method is responsible for making the diagram and initializing the model, any templates,
   * and maybe doing other initialization tasks like customizing tools.
   * The model's data should not be set here, as the ReactDiagram component handles that.
   */
  private initPalette(): go.Diagram {
    const $ = go.GraphObject.make;
    // const myMetis = this.myMetis;
    // console.log('74 myMetis', myMetis);
    // define myPalette
    let myPalette;
    // console.log('68 myPalette', this);      
    // define myPalette
    if (true) {
      myPalette =
        $(go.Palette,       // must name or refer to the DIV HTML element
          {
            initialContentAlignment: go.Spot.Top,       // center the content
            // initialAutoScale: go.Diagram.Uniform,
            maxSelectionCount: 6,
            layout: $(go.GridLayout,
              {
                // sorting: go.GridLayout.Ascending,
                sorting: go.GridLayout.Forward,
                // sorting: go.GridLayout.Descending,   
                wrappingColumn: 1
              }),

            draggingTool: new GuidedDraggingTool(),  // defined in GuidedDraggingTool.ts
            grid: $(go.Panel, "Grid",
              $(go.Shape, "LineH", { stroke: "lightblue", strokeWidth: 0.5 }),
              $(go.Shape, "LineH", { stroke: "blue", strokeWidth: 0.5, interval: 10 }),
              $(go.Shape, "LineV", { stroke: "lightblue", strokeWidth: 0.5 }),
              $(go.Shape, "LineV", { stroke: "blue", strokeWidth: 0.5, interval: 10 })
            ),
            model: $(go.GraphLinksModel,
              {
                linkKeyProperty: 'key'
              })

          });

      let paletteNodeTemplate: any;
      paletteNodeTemplate =
        $(go.Node, "Auto",
          // new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
          new go.Binding("visible"),
          new go.Binding("stroke", "strokecolor"),
          new go.Binding("layerName", "layer"),
          new go.Binding("deletable"),
          // new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
          new go.Binding("scale", "scale1").makeTwoWay(),
          {
            name: "GROUP",
            resizable: true,
            resizeObjectName: "SHAPE",  // the custom resizeAdornmentTemplate only permits two kinds of resizing
            selectionObjectName: "GROUP",  // selecting a custom part also selects the shape
            selectionAdorned: true,

            click: function (e, node) {
              // const myMetis = this.myMetis;
              // console.log('103 node, myMetis', node, myMetis);
              // const diagram = myMetis.myDiagram;
              // const n = diagram.findNodeForKey(node?.key);
              // console.log('105 n, node', n, node);
              // diagram.startTransaction("highlight");
              // // remove any previous highlighting
              // diagram.clearHighlighteds();           
              // n.isHighlighted = true; 
              // for each Link coming out of the Node, set Link.isHighlighted
              // diagram.commitTransaction("highlight");                        
            }
          },
          // for sorting, have the Node.text be the data.name
          new go.Binding("text", "name"),

          new go.Binding("scale", "scale1").makeTwoWay(),
          new go.Binding("background", "isHighlighted",
            function (h) {
              return h ? "rgba(255,0,0,0.2)" : "transparent"; // this is the background of all
            }).ofObject(),
          { // Tooltip
            toolTip:
              $(go.Adornment, "Auto",
                $(go.Shape, { fill: "lightyellow" }),
                $(go.TextBlock, { margin: 8 },  // the tooltip shows the result of calling nodeInfo(data)
                  new go.Binding("text", "",
                    function (d) {
                      return uid.nodeInfo(d, this.myMetis);
                    }
                  )
                )
              )
          },

          // define the node's outer shape
          $(go.Shape, "RoundedRectangle",
            {
              name: "SHAPE",
              fill: "lightyellow",
              stroke: "black",
            },
            new go.Binding("fill", "fillcolor"),
            new go.Binding("stroke", "strokecolor"),
            new go.Binding("strokeWidth", "strokewidth")
          ),

          $(go.Panel, "Horizontal",
            $(go.Picture,
              {
                name: "Picture",
                desiredSize: new go.Size(20, 20),
                margin: new go.Margin(0, 0, 0, 3),
              },
              new go.Binding("source", "icon", findImage)
            ),
            // define the panel where the text will appear
            $(go.Panel, "Table",
              {
                defaultRowSeparatorStroke: "black",
                //minSize: new go.Size(200, 50),
                maxSize: new go.Size(100, 999),
                minSize: new go.Size(90, 15),
                margin: new go.Margin(6, 10, 0, 0),
                defaultAlignment: go.Spot.Left
              },
              $(go.RowColumnDefinition, { column: 2, width: 4 }
              ),
              // content - the name
              $(go.TextBlock, textStyle(),
                {
                  row: 0, column: 0, columnSpan: 6,
                  font: "12pt Segoe UI,sans-serif",
                  editable: false, isMultiline: true,
                  minSize: new go.Size(10, 16),
                  name: "name"
                },
                new go.Binding("text", "name").makeTwoWay()),
            ),
          )
        );

      // Define node template map
      const paletteNodeTemplateMap = new go.Map<string, go.Part>();
      paletteNodeTemplateMap.add("", paletteNodeTemplate);
      myPalette.nodeTemplateMap = paletteNodeTemplateMap;

      const groupTemplate =
        $(go.Group, "Auto",
          // for sorting, have the Node.text be the data.name
          new go.Binding("text", "name"),

          // define the node's outer shape
          $(go.Shape, "RoundedRectangle",
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
                maxSize: new go.Size(100, 999),
                minSize: new go.Size(90, 40),
                margin: new go.Margin(6, 10, 0, 3),
                defaultAlignment: go.Spot.TopLeft
              },
              $(go.RowColumnDefinition, { column: 2, width: 4 }
              ),
              // content
              $(go.TextBlock, textStyle(),  // the name
                {
                  row: 0, column: 0, columnSpan: 6,
                  font: "12pt Segoe UI,sans-serif",
                  editable: true, isMultiline: false,
                  minSize: new go.Size(80, 40),
                  name: "name"
                },
                new go.Binding("text", "name").makeTwoWay()),
            ),
          )
        );
      // Define group template map
      let groupTemplateMap = new go.Map<string, go.Group>();
      groupTemplateMap.add("", groupTemplate);
      myPalette.groupTemplateMap = groupTemplateMap;

    }
    return myPalette;

    // Function to identify images related to an image id
    function findImage(image: string) {
      if (image && !image.includes('//')) {
        return "./../images/" + image;
      }
      return "";
    }

    // Function to specify default text style
    function textStyle() {
      return { font: "9pt  Segoe UI,sans-serif", stroke: "black" };
    }
  }


  public render() {
    const divclassname = (this.props.divClassName === 'diagram-component-objects')
      ? 'diagram-component-objects'
      : (this.props.divClassName === 'diagram-component-target')
        ? 'diagram-component-target'
        : 'diagram-component-palette'


    // const diagramStyle = {
    //   height: '36vh', // Set the desired height here
    //   width: '100%', // Set the desired width here
    // };
    // console.log('261 Palette diagramStyle', this.props.diagramStyle);
    if (!debug) console.log('297 Palette linkDataArray', this.props.linkDataArray);

    return (
      <ReactDiagram
        ref={this.diagramRef}
        divClassName={divclassname}
        initDiagram={this.initPalette}
        nodeDataArray={this.props?.nodeDataArray}
        linkDataArray={this.props?.linkDataArray}
        modelData={this.props.modelData}
        onModelChange={this.props.onModelChange}
        //   onSelectionChange   = {this.props.onModelChange}
        //   onTextEdited        = {this.props.onModelChange}
        //   onPartResized       = {this.props.onModelChange}
        //   onMouseDrop         = {this.props.onModelChange}
        skipsDiagramUpdate={this.props.skipsDiagramUpdate}
        style={this.props.diagramStyle}
      />
    );
  }
}
