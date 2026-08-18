// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as go from 'gojs';
import { ReactDiagram, ReactPalette } from 'gojs-react';
import * as React from 'react';
import * as akm from '../../../akmm/metamodeller';
import * as gjs from '../../../akmm/ui_gojs';
import * as uid from '../../../akmm/ui_diagram';
import * as uit from '../../../akmm/ui_templates';

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
  noOfCols?: number;
  onNodeContextMenu?: (nodeData: go.ObjectData, diagram: go.Diagram) => void;
  phFocus?: any;
}

const debug = false;
const PALETTE_SCALE = 1.05;

function sanitizeColor(value: any, fallback = "transparent"): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function sanitizeCurve(value: any): any {
  switch (String(value || "").trim()) {
    case "Bezier":
      return go.Link.Bezier;
    case "JumpGap":
      return go.Link.JumpGap;
    case "JumpOver":
      return go.Link.JumpOver;
    case "None":
    case "":
      return go.Link.None;
    default:
      return go.Link.None;
  }
}
function installSafeNodeCategoryGuard() {
  const proto: any = go.GraphLinksModel && (go.GraphLinksModel as any).prototype;
  if (!proto || proto.__safeNodeCategoryGuardInstalled) return;
  const original = proto.setCategoryForNodeData;
  if (typeof original !== 'function') return;
  proto.setCategoryForNodeData = function (data: any, cat: any) {
    const safeCategory =
      typeof cat === 'string' && cat.length > 0
        ? cat
        : (typeof data?.template === 'string' && data.template.length > 0
            ? data.template
            : (typeof data?.category === 'string' && data.category.length > 0
                ? data.category
                : 'textAndIcon'));
    return original.call(this, data, safeCategory);
  };
  proto.__safeNodeCategoryGuardInstalled = true;
}

function installSafeLinkCategoryGuard() {
  const proto: any = go.GraphLinksModel && (go.GraphLinksModel as any).prototype;
  if (!proto || proto.__safeLinkCategoryGuardInstalled) return;
  const original = proto.setCategoryForLinkData;
  if (typeof original !== 'function') return;
  proto.setCategoryForLinkData = function (data: any, cat: any) {
    const safeCategory =
      typeof cat === 'string' && cat.length > 0
        ? cat
        : (typeof data?.template === 'string' && data.template.length > 0
            ? data.template
            : (typeof data?.category === 'string' && data.category.length > 0
                ? data.category
                : 'linkTemplate1'));
    return original.call(this, data, safeCategory);
  };
  proto.__safeLinkCategoryGuardInstalled = true;
}

installSafeNodeCategoryGuard();
installSafeLinkCategoryGuard();

function isBooleanLikeKey(key: string): boolean {
  return /^(is[A-Z_]|has[A-Z_]|can[A-Z_]|allow[A-Z_]|show[A-Z_]|include[A-Z_])/.test(key) ||
    key === "visible" ||
    key === "readOnly" ||
    key === "markedAsDeleted" ||
    key === "selectable" ||
    key === "deletable" ||
    key === "reshapable" ||
    key === "resegmentable" ||
    key === "relinkableFrom" ||
    key === "relinkableTo" ||
    key === "avoidable" ||
    key === "shadowVisible";
}

function normalizeEmptyBooleanFieldsInPlace(value: any, seen = new WeakSet<object>()): any {
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item) => normalizeEmptyBooleanFieldsInPlace(item, seen));
    return value;
  }
  Object.keys(value).forEach((key) => {
    const current = value[key];
    if (isBooleanLikeKey(key) && (current === "" || current === null)) {
      value[key] = false;
      return;
    }
    if (current && typeof current === "object") {
      normalizeEmptyBooleanFieldsInPlace(current, seen);
    }
  });
  return value;
}

function normalizePaletteWrapperNodeCategoryData(nodeDataArray: any[] | undefined): any[] {
  if (!Array.isArray(nodeDataArray)) return nodeDataArray as any;
  return nodeDataArray.map((node) => {
    if (!node || typeof node !== 'object') return node;
    normalizeEmptyBooleanFieldsInPlace(node);
    const category = node.category || node.template || 'textAndIcon';
    if (typeof category === 'string' && category.length > 0 && node.category === category) {
      return node;
    }
    return {
      ...node,
      category,
    };
  });
}

function normalizePaletteWrapperLinkData(linkDataArray: any[] | undefined): any[] {
  if (!Array.isArray(linkDataArray)) return linkDataArray as any;
  return linkDataArray.map((link) => {
    if (!link || typeof link !== "object") return link;
    normalizeEmptyBooleanFieldsInPlace(link);
    return {
      ...link,
      // The type palette registers one default link template. Imported model
      // link categories (for example `linkTemplate1`) are diagram categories
      // and have no palette template-map entry, which makes the link invisible.
      category: '',
    };
  });
}
export class PaletteWrapper extends React.Component<DiagramProps, {}> {
  /**
   * Ref to keep a reference to the Diagram component, which provides access to the GoJS diagram via getDiagram().
   */
  private diagramRef: React.RefObject<ReactDiagram>;
  public myMetis: akm.cxMetis;
  private handleInitialLayout = (e: go.DiagramEvent) => {
    const diagram = e.diagram;
    if (!(diagram instanceof go.Diagram)) {
      return;
    }
    diagram.removeDiagramListener('InitialLayoutCompleted', this.handleInitialLayout);
    this.updatePalettePresentation(diagram);
    this.ensurePaletteRelationshipLinks(diagram);
    this.updateFocusHighlight(diagram);
  };
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
      diagram.addDiagramListener('InitialLayoutCompleted', this.handleInitialLayout);
      this.updatePalettePresentation(diagram);
      this.ensurePaletteRelationshipLinks(diagram);
      this.updateFocusHighlight(diagram);
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
      diagram.removeDiagramListener('InitialLayoutCompleted', this.handleInitialLayout);
    }
  }

  public componentDidUpdate(prevProps: DiagramProps) {
    if (
      prevProps.noOfCols !== this.props.noOfCols ||
      prevProps.divClassName !== this.props.divClassName ||
      prevProps.nodeDataArray !== this.props.nodeDataArray ||
      prevProps.linkDataArray !== this.props.linkDataArray
    ) {
      this.updatePalettePresentation();
      this.ensurePaletteRelationshipLinks();
    }
    if (
      prevProps.phFocus?.focusObject?.id !== this.props.phFocus?.focusObject?.id ||
      prevProps.nodeDataArray !== this.props.nodeDataArray
    ) {
      this.updateFocusHighlight();
    }
  }

  private updateFocusHighlight(diagram?: go.Diagram) {
    const palette = diagram ?? this.diagramRef.current?.getDiagram();
    if (!(palette instanceof go.Diagram)) return;
    const isObjectsPalette = this.props.divClassName === 'diagram-component-objects';
    const focusObjectId = String(this.props?.phFocus?.focusObject?.id || '');
    const focusTypeId = String(
      this.props?.phFocus?.focusObject?.type?.id ||
      this.props?.phFocus?.focusObject?.typeRef ||
      this.props?.phFocus?.focusObjecttype?.id ||
      ''
    );
    for (let it = palette.nodes.iterator; it?.next();) {
      const node = it.value as go.Node;
      const nodeFocusId = isObjectsPalette
        ? String(
            node?.data?.object?.id ||
            node?.data?.objRef ||
            node?.data?.objectRef ||
            node?.data?.objectview?.object?.id ||
            node?.data?.objectview?.objectRef ||
            ''
          )
        : String(
            node?.data?.objecttype?.id ||
            node?.data?.objtypeRef ||
            node?.data?.typeRef ||
            node?.data?.key ||
            ''
          );
      const targetFocusId = isObjectsPalette ? focusObjectId : focusTypeId;
      const matches = Boolean(targetFocusId) && nodeFocusId === targetFocusId;
      try {
        if (typeof palette.model?.setDataProperty === 'function') {
          palette.model.setDataProperty(node.data, 'isFocusPeer', matches);
        } else {
          node.data.isFocusPeer = matches;
        }
      } catch (_) { }
      try { node.updateTargetBindings(); } catch (_) { }
    }
    try { palette.requestUpdate(); } catch (_) { }
  }

  private updatePalettePresentation(diagram?: go.Diagram) {
    const palette = diagram ?? this.diagramRef.current?.getDiagram();
    if (!(palette instanceof go.Diagram)) {
      return;
    }

    const cols = (this.props.noOfCols && this.props.noOfCols > 0) ? this.props.noOfCols : 1;
    const layout = palette.layout;
    let layoutChanged = false;
    if (layout instanceof go.GridLayout) {
      if (layout.wrappingColumn !== cols) {
        layout.wrappingColumn = cols;
        layout.invalidateLayout();
        layoutChanged = true;
      }
    }

    if (Math.abs(palette.scale - PALETTE_SCALE) > 0.01) {
      palette.scale = PALETTE_SCALE;
    }

    if (layoutChanged) {
      palette.layoutDiagram(true);
    }
  }

  private ensurePaletteRelationshipLinks(diagram?: go.Diagram) {
    const palette = diagram ?? this.diagramRef.current?.getDiagram();
    if (!(palette instanceof go.Diagram)) return;
    const model = palette.model;
    if (!(model instanceof go.GraphLinksModel)) return;

    const nodes = normalizePaletteWrapperNodeCategoryData(this.props?.nodeDataArray) || [];
    const nodeKeyByTypeId = new Map<string, any>();
    nodes.forEach((node: any) => {
      const typeId = String(node?.objtypeRef || node?.objecttype?.id || node?.typeRef || '');
      if (typeId) nodeKeyByTypeId.set(typeId, node?.key);
    });

    const links = (normalizePaletteWrapperLinkData(this.props?.linkDataArray) || []).map((link: any) => {
      const fromTypeId = String(link?.reltype?.fromobjtypeRef || link?.fromobjtypeRef || '');
      const toTypeId = String(link?.reltype?.toobjtypeRef || link?.toobjtypeRef || '');
      return {
        ...link,
        from: link?.from || nodeKeyByTypeId.get(fromTypeId),
        to: link?.to || nodeKeyByTypeId.get(toTypeId),
        visible: true,
      };
    }).filter((link: any) => link?.from && link?.to);

    palette.startTransaction('sync palette relationship links');
    try {
      const desiredKeys = new Set(links.map((link: any) => link.key));
      const existing = Array.isArray(model.linkDataArray) ? [...model.linkDataArray] : [];
      existing.forEach((link: any) => {
        if (!desiredKeys.has(link?.key)) model.removeLinkData(link);
      });
      links.forEach((link: any) => {
        const current = model.findLinkDataForKey(link.key);
        if (!current) {
          model.addLinkData(link);
          return;
        }
        model.setFromKeyForLinkData(current, link.from);
        model.setToKeyForLinkData(current, link.to);
        model.setDataProperty(current, 'category', '');
        model.setDataProperty(current, 'visible', true);
      });
    } finally {
      palette.commitTransaction('sync palette relationship links');
    }
    try {
      palette.links.each((link: go.Link) => {
        link.visible = true;
        link.invalidateRoute();
      });
      palette.requestUpdate();
    } catch (_) { }
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
      let contextMenu: go.HTMLInfo | null = null;
      if (this.props.onNodeContextMenu) {
        const HTML_MENU_CLASS = 'gojs-html-context-menu';
        const HTML_MENU_ITEM_CLASS = 'gojs-html-context-menu__item';
        let activeMenu: HTMLDivElement | null = null;
        let docListener: ((ev: PointerEvent) => void) | null = null;

        const disposeMenu = () => {
          if (docListener) {
            try { document.removeEventListener('pointerdown', docListener); } catch (_) { }
          }
          docListener = null;
          if (activeMenu?.parentElement?.contains(activeMenu)) {
            try { activeMenu.parentElement.removeChild(activeMenu); } catch (_) { }
          }
          activeMenu = null;
        };

        const positionMenu = (menu: HTMLDivElement, diagram: go.Diagram, tool: go.ContextMenuTool) => {
          const diagramDiv = diagram?.div;
          const viewPoint = diagram?.lastInput?.viewPoint;
          if (!diagramDiv || !viewPoint) return;
          const rect = diagramDiv.getBoundingClientRect();
          let left = rect.left + window.pageXOffset + viewPoint.x;
          let top = rect.top + window.pageYOffset + viewPoint.y;
          const menuRect = menu.getBoundingClientRect();
          const maxLeft = window.pageXOffset + window.innerWidth - menuRect.width - 8;
          const maxTop = window.pageYOffset + window.innerHeight - menuRect.height - 8;
          left = Math.max(window.pageXOffset + 4, Math.min(left, maxLeft));
          top = Math.max(window.pageYOffset + 4, Math.min(top, maxTop));
          menu.style.left = `${left}px`;
          menu.style.top = `${top}px`;
        };

        const buildMenu = (label: string, handler: () => void) => {
          const menu = document.createElement('div');
          menu.className = HTML_MENU_CLASS;
          menu.style.position = 'absolute';
          menu.style.minWidth = '200px';
          menu.style.background = '#ffffff';
          menu.style.border = '1px solid rgba(0,0,0,0.15)';
          menu.style.boxShadow = '0 6px 12px rgba(0,0,0,0.18)';
          menu.style.borderRadius = '6px';
          menu.style.padding = '0 0';
          menu.style.zIndex = '9999';
          menu.addEventListener('contextmenu', (ev) => ev.preventDefault());
          menu.addEventListener('mousedown', (ev) => ev.stopPropagation());

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = HTML_MENU_ITEM_CLASS;
          btn.textContent = label;
          btn.style.display = 'block';
          btn.style.width = '100%';
          btn.style.padding = '6px 16px';
          btn.style.textAlign = 'left';
          btn.style.background = 'transparent';
          btn.style.border = 'none';
          btn.style.cursor = 'pointer';
          btn.style.fontSize = '13px';
          btn.style.color = '#333';
          btn.onmouseenter = () => { btn.style.background = '#f5f5f5'; };
          btn.onmouseleave = () => { btn.style.background = 'transparent'; };
          btn.onclick = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            handler();
            disposeMenu();
          };
          menu.appendChild(btn);
          return menu;
        };

        contextMenu = new go.HTMLInfo({
          show: (obj: go.GraphObject | null, diagram: go.Diagram, tool: go.ContextMenuTool) => {
            disposeMenu();
            const part = obj?.part as go.Part;
            const node = part?.data;
            if (!diagram || !node) return;
            const menu = buildMenu('Select Connected Objects', () => {
              this.props.onNodeContextMenu?.(node, diagram);
            });
            activeMenu = menu;
            document.body.appendChild(menu);
            positionMenu(menu, diagram, tool);
            docListener = (ev: PointerEvent) => {
              const tgt = ev.target as Node | null;
              if (menu && tgt && !menu.contains(tgt)) {
                disposeMenu();
              }
            };
            try { document.addEventListener('pointerdown', docListener); } catch (_) { }
          },
          hide: disposeMenu,
        });
      }
      const arrowConverter = (value: string) => {
        if (!value || value === 'None' || value === ' ') return '';
        return value;
      };
      const paletteFocusStroke = (data: any, shape: any) => {
        const baseStroke = data?.strokecolor || "black";
        if (data?.isFocusPeer) return "lightblue";
        if (shape?.part?.isHighlighted) return baseStroke;
        return baseStroke;
      };
      const paletteFocusStrokeWidth = (h: any, shape: any) => {
        const data = shape?.part?.data || {};
        const raw = data?.strokewidth;
        const baseWidth = typeof raw === 'number' ? raw : parseInt(raw) || 1;
        if (data?.isFocusPeer && h) return Math.max(baseWidth, 4);
        if (data?.isFocusPeer) return Math.max(baseWidth, 3);
        if (h) return Math.max(baseWidth, 2);
        return baseWidth;
      };
      myPalette =
        $(go.Palette,       // must name or refer to the DIV HTML element
          {
            initialContentAlignment: go.Spot.Top,
            contentAlignment: go.Spot.Top,
            initialAutoScale: go.Diagram.None,
            // "animationManager.isEnabled": false, // disable animations
            // "undoManager.isEnabled": true,  // enable undo & redo
            // "toolManager.hoverDelay": 10,  // how quickly tooltips are shown

            maxSelectionCount: 160,
            layout: $(go.GridLayout,
              {
                // sorting: go.GridLayout.Ascending,
                sorting: go.GridLayout.Forward,
                // sorting: go.GridLayout.Descending,
                wrappingColumn: this.props.noOfCols ?? 1, // Use prop, default to 1
                cellSize: new go.Size(1, 1),
                spacing: (this.props.noOfCols <= 1) ? new go.Size(30, 6) : new go.Size(50, 20),
                alignment: go.GridLayout.Position,
                isViewportSized: true,
                // comparer: uid.alphabeticalComparer
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
              }),
            scale: 1, // baseline scale; we nudge it after the initial layout
          });

      let paletteNodeTemplate: any;
      paletteNodeTemplate =
        $(go.Node, "Auto",
          new go.Binding("visible", "", (v) => Boolean(v === undefined ? true : v)),
          new go.Binding("layerName", "layer"),
          new go.Binding("deletable"),
          new go.Binding("scale", "scale").makeTwoWay(),
          {
            name: "GROUP",
            resizable: true,
            resizeObjectName: "SHAPE",
            selectionObjectName: "GROUP",
            selectionAdorned: true,
            click: function (e, node) {
              // Your click handler logic (optional)
            }
          },
          new go.Binding("text", "name"),
          new go.Binding("scale", "scale").makeTwoWay(),
          new go.Binding("background", "isHighlighted",
            function (h) {
              return h ? "rgba(255,0,0,0.2)" : "transparent";
            }).ofObject(),
          { // Tooltip
            toolTip:
              $(go.Adornment, "Auto",
                $(go.Shape, { fill: "lightyellow" }),
                $(go.TextBlock, { margin: 8 },
                  new go.Binding("text", "",
                    function (d) {
                      return uid.nodeInfo(d, this.myMetis);
                    }
                  )
                )
              )
          },

          // Define the node's outer shape
          $(go.Shape, "RoundedRectangle",
            {
              name: "SHAPE",
              fill: "transparent",
              stroke: "black",
              cursor: "grabbing",
            },
            new go.Binding("fill", "fillcolor", (c) => sanitizeColor(c)),
            new go.Binding("stroke", "", paletteFocusStroke),
            new go.Binding("strokeWidth", "isHighlighted", paletteFocusStrokeWidth).ofObject()
          ),

          // Horizontal Panel containing Icon and Text
          $(go.Panel, "Horizontal",
            {
              name: "PANEL",
              margin: new go.Margin(4, 0, 0, 2),
            },

            // Spot Panel for Icon Area
            $(go.Panel, "Spot",
              {
                alignment: go.Spot.Center,
                cursor: "grabbing",
              },
              $(go.Shape,
                {
                  desiredSize: new go.Size(30, 30),
                  margin: new go.Margin(0, 0, 0, 0),
                  fill: "transparent",
                  stroke: "black",
                  strokeWidth: 2,
                },
                new go.Binding("figure", "", (data) => {
                  const figures = uit.getFigureNames();
                  if (data.icon && figures.includes(data.icon)) return data.icon;
                  if ((!data.icon || data.icon === "") && data.figure && figures.includes(data.figure)) return data.figure;
                  return "Rectangle";
                }),
                new go.Binding("visible", "", (data) => {
                  const figures = uit.getFigureNames();
                  // Only show if icon is empty or a valid figure name, or figure is present
                  return Boolean(!data.icon || figures.includes(data.icon) || (data.figure && figures.includes(data.figure)));
                }),
              ),
              // Show image only if icon is a valid image URL
              $(go.Picture,
                {
                  name: "Picture",
                  desiredSize: new go.Size(30, 30),
                  margin: new go.Margin(0, 0, 0, 0),
                },
                // Allow both remote and local image paths (not just full URLs)
                new go.Binding("source", "icon", (icon) => {
                  const figures = uit.getFigureNames();
                  if (!icon || figures.includes(icon)) return "";
                  return findImage(icon);
                }),
                new go.Binding("visible", "icon", (icon) => {
                  const figures = uit.getFigureNames();
                  return Boolean(icon && !figures.includes(icon) && uit.shouldShowIconPicture(icon));
                }),
              ),
              // Show unicode only if icon is a valid unicode
              $(go.TextBlock, textStyle(),
                {
                  background: "transparent",
                  desiredSize: new go.Size(30, 30),
                  textAlign: "center",
                  stroke: "#466",
                  margin: new go.Margin(0, 0, 0, 0),
                  font: "24px 'FontAwesome'",
                  editable: false,
                  isMultiline: false,
                  alignment: go.Spot.Center,
                },
                new go.Binding("text", "icon", findUnicodeImage),
                new go.Binding("visible", "icon", (icon) => {
                  const figures = uit.getFigureNames();
                  return Boolean(icon && !figures.includes(icon) && uit.detectIconFormat(icon) === 'unicode');
                }),
              ),
            ),

            // Table Panel for Text Content
            $(go.Panel, "Table",
              {
                defaultRowSeparatorStroke: "black",
                maxSize: new go.Size(120, 999),
                minSize: new go.Size(128, 25),
                margin: new go.Margin(0, 0, 0, 2),
                defaultAlignment: go.Spot.Left,
              },
              // TextBlock for Name
              $(go.TextBlock, textStyle(),
                {
                  name: "name",
                  font: "11pt Segoe UI,sans-serif",
                  editable: false,
                  isMultiline: true,
                  minSize: new go.Size(14, 16),
                  isMultiline: true,
                },
                new go.Binding("text", "name").makeTwoWay()
              ),
            ),
          ),
        );

      // Define node template map
      const paletteNodeTemplateMap = new go.Map<string, go.Part>();
      paletteNodeTemplateMap.add("", paletteNodeTemplate);
      myPalette.nodeTemplateMap = paletteNodeTemplateMap;

      myPalette.linkTemplate =
        $(go.Link,
          {
            routing: go.Link.Normal,
            curve: go.Link.None,
            corner: 0,
            selectable: false
          },
          new go.Binding("curve", "curve", sanitizeCurve),
          new go.Binding("points", "points"),
          $(go.Shape,
            { strokeWidth: 1.4, stroke: "#555" },
            new go.Binding("stroke", "strokecolor", (c) => sanitizeColor(c, "#555")),
            new go.Binding("strokeWidth", "strokewidth", (w: any) => {
              const width = typeof w === 'string' ? parseFloat(w) : w;
              return width && !isNaN(width) ? width : 1.4;
            })),
          $(go.Shape,
            { fromArrow: "", stroke: null },
            new go.Binding("fromArrow", "fromArrow", arrowConverter),
            new go.Binding("fill", "strokecolor", (c) => sanitizeColor(c, "#555"))),
          $(go.Shape,
            { toArrow: "Standard", stroke: null },
            new go.Binding("toArrow", "toArrow", arrowConverter),
            new go.Binding("fill", "strokecolor", (c) => sanitizeColor(c, "#555"))),
          $(go.TextBlock,
            {
              segmentOffset: new go.Point(0, -10),
              font: "9pt Segoe UI,sans-serif",
              stroke: "#444"
            },
            new go.Binding("text", "name"))
        );

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
            new go.Binding("fill", "fillcolor", (c) => sanitizeColor(c)),
            new go.Binding("stroke", "strokecolor", (c) => sanitizeColor(c, "black")),
            new go.Binding("strokeWidth", "strokewidth")
          ),

          $(go.Panel, "Vertical",
            // define the panel where the text will appear
            $(go.Panel, "Horizontal",
              {
                defaultRowSeparatorStroke: "black",
                maxSize: new go.Size(100, 999),
                minSize: new go.Size(150, 20),
                margin: new go.Margin(6, 10, 0, 3),
                defaultAlignment: go.Spot.TopLeft
              },
              $(go.RowColumnDefinition, { column: 2, width: 4 }
              ),
              // content
              // Spot Panel for Icon Area
              $(go.Panel, "Spot",
                {
                  alignment: go.Spot.Center,
                  cursor: "grabbing",
                },
                // Picture Element
                $(go.Picture,
                  {
                    name: "Picture",
                    desiredSize: new go.Size(30, 30),
                    margin: new go.Margin(0, 0, 10, 0), // Reduced left margin
                  },
                  new go.Binding("source", "icon", uit.getIconSource),
                  new go.Binding("visible", "icon", uit.shouldShowIconPicture)
                ),
                // TextBlock for Unicode Icon
                $(go.TextBlock, textStyle(),
                  {
                    background: "transparent",
                    desiredSize: new go.Size(30, 30),
                    textAlign: "center",
                    stroke: "#666",
                    margin: new go.Margin(0, 0, 0, 0), // Adjusted margins
                    font: "bold 18px 'Font Awesome 6 Free','Font Awesome 6 Pro','Font Awesome 6 Brands','Font Awesome 5 Free','Font Awesome 5 Pro','Font Awesome 5 Brands','FontAwesome','Font Awesome','FontAwesome5Free','FontAwesome6Free','Segoe UI Emoji','Apple Color Emoji','Segoe UI Symbol','Noto Color Emoji','Helvetica','Arial',sans-serif",
                    editable: false,
                    isMultiline: false,
                    alignment: go.Spot.Center, // Center alignment
                  },
                  new go.Binding("text", "icon", findGroupUnicodeImage),
                  new go.Binding("visible", "icon", (icon) => !icon || uit.shouldShowUnicodeFallback(icon))
                ),
              ),
              $(go.TextBlock, textStyle(),  // the name
                {
                  row: 0, column: 0, columnSpan: 6,
                  font: "11pt Segoe UI,sans-serif",
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
      if (debug) console.log("3238 findImage: ", image);
      if (image == "")
        return "";
      if (uit.detectIconFormat(image) === 'unicode')
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
        const img = { image: 'data:image/svg+xml;charset=UTF-8,image' }
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

    function findUnicodeImage(image: string) {
      return uit.findUnicodeImage(image);
    }
    function findGroupUnicodeImage(image: string) {
      if (!image) return uit.findUnicodeImage('\\uf07c');
      const glyph = uit.findUnicodeImage(image);
      return glyph || "";
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
    const normalizedNodeDataArray = normalizePaletteWrapperNodeCategoryData(this.props?.nodeDataArray);
    const normalizedLinkDataArray = normalizePaletteWrapperLinkData(this.props?.linkDataArray);

    if (debug) console.log('Figure names:', uit.getFigureNames());
    // const diagramStyle = {
    //   height: '36vh', // Set the desired height here
    //   width: '100%', // Set the desired width here
    // };
    // console.log('261 Palette diagramStyle', this.props.diagramStyle);
    if (debug) console.log('296 Palette nodeDataArray', this.props.nodeDataArray);
    // if (debug) console.log('297 Palette linkDataArray', this.props.linkDataArray);

    // https://github.com/NorthwoodsSoftware/gojs-react-basic/blob/master/src/components/DiagramWrapper.tsx

    return (
      // <ReactPalette
      //   ref={this.diagramRef}
      //   divClassName={divclassname}
      //   initDiagram={this.initPalette}
      //   nodeDataArray={this.props?.nodeDataArray}
      //   linkDataArray={this.props?.linkDataArray}
      //   modelData={this.props.modelData}
      //   onModelChange={this.props.onModelChange}
      //   skipsDiagramUpdate={this.props.skipsDiagramUpdate}
      //   style={this.props.diagramStyle}
      // />
      <ReactDiagram
        key={`${this.props.phFocus?.focusModel?.id || 'no-model'}-${normalizedNodeDataArray?.length || 0}-${normalizedLinkDataArray?.length || 0}-${this.props.divClassName || 'palette'}`}
        ref={this.diagramRef}
        divClassName={divclassname}
        initDiagram={this.initPalette}
        nodeDataArray={normalizedNodeDataArray}
        linkDataArray={normalizedLinkDataArray}
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
