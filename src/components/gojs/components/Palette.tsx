/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import * as React from 'react';

import { GuidedDraggingTool } from '../GuidedDraggingTool';
//import { stringify } from 'querystring';

// import './Diagram.css';

interface DiagramProps {
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  layout: string | null;
  modelData: go.ObjectData;
  skipsDiagramUpdate: boolean;
  onDiagramEvent: (e: go.DiagramEvent) => void;
  onModelChange: (e: go.IncrementalData) => void;
}

export class PaletteWrapper extends React.Component<DiagramProps, {}> {
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
      // define myPalette
      let myPalette;
      // console.log('68 myPalette', this);      
      // define myPalette
      if (true) {
          myPalette =
          $(go.Palette,       // must name or refer to the DIV HTML element
            {
              initialContentAlignment: go.Spot.Center,       // center the content
              initialAutoScale: go.Diagram.Uniform,
              maxSelectionCount: 1,
              layout: $(go.GridLayout,
                {
                  sorting: go.GridLayout.Ascending,
                  wrappingColumn: 1
                }),
              draggingTool: new GuidedDraggingTool(),  // defined in GuidedDraggingTool.ts
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
            });

            let paletteNodeTemplate: any;
            paletteNodeTemplate = 
            $(go.Node, "Auto",
              // for sorting, have the Node.text be the data.name
              new go.Binding("text", "name"),
                
              // define the node's outer shape
              $(go.Shape, "Rectangle",
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
                      maxSize: new go.Size(200, 999),
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
            // Define group template map
            let groupTemplateMap = new go.Map<string, go.Group>();
            groupTemplateMap.add("", groupTemplate);
            myPalette.groupTemplateMap = groupTemplateMap;
  
      }
      return myPalette;
  
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
      
    }
  
    public render() {
      return (
        <ReactDiagram
          ref={this.diagramRef}
          divClassName        = 'diagram-component'
          initDiagram         = {this.initPalette}
          nodeDataArray       = {this.props?.nodeDataArray}
          linkDataArray       = {this.props?.linkDataArray}
          modelData           = {this.props.modelData}
          onModelChange       = {this.props.onModelChange}
        //   onSelectionChange   = {this.props.onModelChange}
        //   onTextEdited        = {this.props.onModelChange}
        //   onPartResized       = {this.props.onModelChange}
        //   onMouseDrop         = {this.props.onModelChange}
          skipsDiagramUpdate  = {this.props.skipsDiagramUpdate}
        />
      );
    }
  }
  