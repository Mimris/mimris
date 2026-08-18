// @ts-nocheck
const debug = false; 

import * as go from 'gojs';
import * as uid from './ui_diagram';
import * as akm from './metamodeller';
import context from '../pages/context';
import { BPMNLinkingTool, BPMNRelinkingTool, PoolLink } from './BPMNClasses.js';

// const $ = go.GraphObject.make;

// require('gojs/extensions/Figures.js');

// let myDiagram: go.Diagram;

// const KAPPA = 4 * ((Math.sqrt(2) - 1) / 3);

   // Use some colors for ports
    // portColors = ['black', 'red', 'green', 'gray'];
    // myDiagram.themeManager.set('', {
    //   colors: { ports: portColors }
    // });

    // // when the document is modified, add a "*" to the title and enable the "Save" button
    // myDiagram.addDiagramListener('Modified', e => {
    //   const button = document.getElementById('SaveButton');
    //   if (button) button.disabled = !myDiagram.isModified;
    //   const idx = document.title.indexOf('*');
    //   if (myDiagram.isModified) {
    //     if (idx < 0) document.title += '*';
    //   } else {
    //     if (idx >= 0) document.title = document.title.slice(0, idx);
    //   }
    // });

    // To simplify this code we define a function for creating a context menu button:
    function makeButton(text, action, visiblePredicate) {
      const button =
        go.GraphObject.build('ContextMenuButton', { click: action})
          .add(new go.TextBlock(text));
      if (visiblePredicate) {
        button.bindObject('visible', '', (o, e) => o.diagram ? visiblePredicate(o, e) : false);
      }
      return button;
    }

    const nodeMenu = // context menu for each Node
      go.GraphObject.build('ContextMenu')
        .add(
          makeButton('Copy', (e, obj) => e.diagram.commandHandler.copySelection()),
          makeButton('Delete', (e, obj) => e.diagram.commandHandler.deleteSelection()),
          new go.Shape('LineH', { strokeWidth: 2, height: 1, stretch: go.Stretch.Horizontal }),
          makeButton('Add top port', (e, obj) => addPort('top')),
          makeButton('Add left port', (e, obj) => addPort('left')),
          makeButton('Add right port', (e, obj) => addPort('right')),
          makeButton('Add bottom port', (e, obj) => addPort('bottom'))
        );

    const portSize = new go.Size(8, 8);

    const portMenu = // context menu for each port
      go.GraphObject.build('ContextMenu')
        .add(
          makeButton('Swap order', (e, obj) => swapOrder(obj.part.adornedObject)),
          makeButton('Remove port',
            // in the click event handler, the obj.part is the Adornment;
            // its adornedObject is the port
            (e, obj) => removePort(obj.part.adornedObject)
          ),
          makeButton('Change color', (e, obj) => changeColor(obj.part.adornedObject)),
          makeButton('Remove side ports', (e, obj) => removeAll(obj.part.adornedObject))
        );

export function nodeTemplates(nodeTemplateMap: any, contextMenu: any, portContextMenu: any, myMetis: akm.cxMetis) {
      new go.Node('Table', {
          locationObjectName: 'BODY',
          locationSpot: go.Spot.Center,
          selectionObjectName: 'BODY',
          contextMenu: nodeMenu
        })
        .bindTwoWay('location', 'loc', go.Point.parse, go.Point.stringify)
        .add(
          // the body
          new go.Panel('Auto', {
              row: 1,
              column: 1,
              name: 'BODY',
              stretch: go.Stretch.Fill
            })
            .add(
              new go.Shape('Rectangle', {
                fill: 'lightgray',
                stroke: 'gray',
                strokeWidth: 0.5,
                minSize: new go.Size(60, 60)
              }),
              new go.TextBlock({
                  margin: 10,
                  textAlign: 'center',
                  font: 'bold 14px Segoe UI,sans-serif',
                  stroke: '#484848',
                  editable: true
                })
                .bindTwoWay('text', 'name')
            ), // end Auto Panel body

          // the Panel holding the left port elements, which are themselves Panels,
          // created for each item in the itemArray, bound to data.leftArray
          new go.Panel('Vertical', {
              row: 1,
              column: 0,
              itemTemplate:
                new go.Panel({
                    fromSpot: go.Spot.Left,
                    toSpot: go.Spot.Left,
                    fromLinkable: true,
                    toLinkable: true,
                    cursor: 'pointer',
                    contextMenu: portMenu
                  })
                  .attach({ _side: 'left' }) // internal property to make it easier to tell which side it's on
                  .bind('portId', 'portId')
                  .add(
                    new go.Shape('Rectangle', {
                        stroke: null,
                        strokeWidth: 0,
                        desiredSize: portSize,
                        margin: new go.Margin(1, 0)
                      })
                      .themeData('fill', 'portColor', 'ports')
                  )
            }) // end Vertical Panel
            .bind('itemArray', 'leftArray'),

          // the Panel holding the top port elements, which are themselves Panels,
          // created for each item in the itemArray, bound to data.topArray
          new go.Panel('Horizontal', {
              row: 0,
              column: 1,
              itemTemplate:
                new go.Panel({
                    fromSpot: go.Spot.Top,
                    toSpot: go.Spot.Top,
                    fromLinkable: true,
                    toLinkable: true,
                    cursor: 'pointer',
                    contextMenu: portMenu
                  })
                  .attach({ _side: 'top' }) // internal property to make it easier to tell which side it's on
                  .bind('portId', 'portId')
                  .add(
                    new go.Shape('Rectangle', {
                        stroke: null,
                        strokeWidth: 0,
                        desiredSize: portSize,
                        margin: new go.Margin(0, 1)
                      })
                      .themeData('fill', 'portColor', 'ports')
                  )
            }) // end Horizontal Panel
            .bind('itemArray', 'topArray'),

          // the Panel holding the right port elements, which are themselves Panels,
          // created for each item in the itemArray, bound to data.rightArray
          new go.Panel('Vertical', {
              row: 1,
              column: 2,
              itemTemplate:
                new go.Panel({
                    fromSpot: go.Spot.Right,
                    toSpot: go.Spot.Right,
                    fromLinkable: true,
                    toLinkable: true,
                    cursor: 'pointer',
                    contextMenu: portMenu
                  })
                  .attach({ _side: 'right' }) // internal property to make it easier to tell which side it's on
                  .bind('portId', 'portId')
                  .add(
                    new go.Shape('Rectangle', {
                        stroke: null,
                        strokeWidth: 0,
                        desiredSize: portSize,
                        margin: new go.Margin(1, 0)
                      })
                      .themeData('fill', 'portColor', 'ports')
                  )
            }) // end Vertical Panel
            .bind('itemArray', 'rightArray'),

          // the Panel holding the bottom port elements, which are themselves Panels,
          // created for each item in the itemArray, bound to data.bottomArray
          new go.Panel('Horizontal', {
              row: 2,
              column: 1,
              itemTemplate:
                new go.Panel({
                    fromSpot: go.Spot.Bottom,
                    toSpot: go.Spot.Bottom,
                    fromLinkable: true,
                    toLinkable: true,
                    cursor: 'pointer',
                    contextMenu: portMenu
                  })
                  .attach({ _side: 'bottom' }) // internal property to make it easier to tell which side it's on
                  .bind('portId', 'portId')
                  .add(
                    new go.Shape('Rectangle', {
                        stroke: null,
                        strokeWidth: 0,
                        desiredSize: portSize,
                        margin: new go.Margin(0, 1)
                      })
                      .themeData('fill', 'portColor', 'ports')
                  ) // end itemTemplate
            }) // end Horizontal Panel
            .bind('itemArray', 'bottomArray')
        ); // end Node
    };

