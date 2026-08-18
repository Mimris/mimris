// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
import * as go from 'gojs';
import * as React from 'react';

import { update_objectview_properties } from '../../actions/actions';
import { PaletteWrapper } from './components/Palette';
import { SelectionInspector } from './components/SelectionInspector';
import * as akm from '../../akmm/metamodeller';
import * as gjs from '../../akmm/ui_gojs';
import * as jsn from '../../akmm/ui_json';

// import './GoJSApp.css';

const debug = false;

/**
 * Use a linkDataArray since we'll be using a GraphLinksModel,
 * and modelData for demonstration purposes. Note, though, that
 * both are optional props in ReactDiagram.
 */
interface AppState {
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
  selectedData: go.ObjectData | null;
  skipsDiagramUpdate: boolean;
  metis: any;
  myMetis: akm.cxMetis;
  myGoModel: gjs.goModel;
  phFocus: any;
  dispatch: any;
  diagramStyle: any;
  noOfCols?: number;
}

class GoJSPaletteApp extends React.Component<{}, AppState> {
  // Maps to store key -> arr index for quick lookups
  private mapNodeKeyIdx: Map<go.Key, number>;
  private mapLinkKeyIdx: Map<go.Key, number>;
  private suppressSelectionChange = false;

  constructor(props: object) {
    super(props);
    if (debug) console.log('47 GoJSPaletteApp', this.props.nodeDataArray, this.props);
    this.state = {
      nodeDataArray: this.props?.nodeDataArray,
      linkDataArray: this.props?.linkDataArray,
      modelData: {
        canRelink: false
      },
      selectedData: null,
      skipsDiagramUpdate: false,
      metis: this.props.metis,
      myMetis: this.props.myMetis,
      // myGoModel: this.props.myGoModel,
      phFocus: this.props.phFocus,
      dispatch: this.props.dispatch,
      diagramStyle: this.props.diagramStyle,
      noOfCols: this.props.noOfCols ? this.props.noOfCols : 1,

    };
    if (debug) console.log('55 myMetis', this.state.myMetis);
    // init maps
    this.mapNodeKeyIdx = new Map<go.Key, number>();
    this.mapLinkKeyIdx = new Map<go.Key, number>();
    this.refreshNodeIndex(this.state.nodeDataArray);
    this.refreshLinkIndex(this.state.linkDataArray);
    // bind handler methods

  }

  public componentDidUpdate(prevProps: any) {
    const nextCols = this.props?.noOfCols ? this.props.noOfCols : 1;
    const nodeDataChanged = prevProps?.nodeDataArray !== this.props?.nodeDataArray;
    const linkDataChanged = prevProps?.linkDataArray !== this.props?.linkDataArray;
    const stateUpdate: Partial<AppState> = {};

    if (prevProps?.noOfCols !== this.props?.noOfCols && nextCols !== this.state.noOfCols) {
      stateUpdate.noOfCols = nextCols;
    }
    if (nodeDataChanged) {
      stateUpdate.nodeDataArray = this.props?.nodeDataArray || [];
    }
    if (linkDataChanged) {
      stateUpdate.linkDataArray = this.props?.linkDataArray || [];
    }

    if (Object.keys(stateUpdate).length > 0) {
      stateUpdate.skipsDiagramUpdate = false;
      this.setState(stateUpdate as AppState, () => {
        if (nodeDataChanged) {
          this.refreshNodeIndex(this.state.nodeDataArray);
        }
        if (linkDataChanged) {
          this.refreshLinkIndex(this.state.linkDataArray);
        }
      });
    }
  }

  /**
   * Update map of node keys to their index in the array.
   */
  private refreshNodeIndex(nodeArr: Array<go.ObjectData>) {
    this.mapNodeKeyIdx.clear();
    nodeArr?.forEach((n: go.ObjectData, idx: number) => {
      this.mapNodeKeyIdx.set(n?.key, idx);
    });
  }

  /**
   * Update map of link keys to their index in the array.
   */
  private refreshLinkIndex(linkArr: Array<go.ObjectData>) {
    this.mapLinkKeyIdx.clear();
    linkArr?.forEach((l: go.ObjectData, idx: number) => {
      this.mapLinkKeyIdx.set(l.key, idx);
    });
  }

  private applyFocusForNode = (diagram: go.Diagram, node: go.Node | null) => {
    if (!node) {
      return;
    }
    const nodeData = node.data as go.ObjectData;
    if (!nodeData) {
      return;
    }
    const myMetis = this.state.myMetis;
    if (!myMetis) {
      return;
    }

    let object = nodeData.object;
    if (!object) {
      return;
    }
    const foundObject = myMetis.findObject(object?.id);
    object = foundObject ? foundObject : object;

    if (object) {
      const jsnObj = new jsn.jsnObject(object);
      const focusData = { id: jsnObj.id, name: jsnObj.name };
      this.props?.dispatch?.({ type: 'SET_FOCUS_OBJECT', data: focusData });
    }

    const myModelview = myMetis.currentModelview;
    let dataov = { id: '', name: '' };
    const objview = myModelview?.objectviews?.filter(ov => ov.object?.id === object?.id);
    if (objview && objview[0]?.id) {
      dataov = { id: objview[0]?.id, name: objview[0]?.name };
    }
    this.props?.dispatch?.({ type: 'SET_FOCUS_OBJECTVIEW', data: dataov });

    const nodes = diagram?.nodes;
    this.suppressSelectionChange = true;
    try {
      for (let it = nodes?.iterator; it?.next();) {
        const candidateNode = it.value as go.Node;
        const nodeObject = candidateNode?.data?.object;
        if (nodeObject?.id === object?.id) {
          candidateNode.isSelected = true;
        }
      }
    } finally {
      this.suppressSelectionChange = false;
    }
  };

  /**
   * Handle any relevant DiagramEvents, in this case just selection changes.
   * On ChangedSelection, find the corresponding data and set the selectedData state.
   * @param e a GoJS DiagramEvent
   */
  public handleDiagramEvent = (e: go.DiagramEvent) => {
    const name = e.name;
    switch (name) {
      case "InitialLayoutCompleted": {
        const nodes = this.state.nodeDataArray;
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (!node.fillcolor || node.fillcolor === "white" || node.fillcolor === "transparent") {
            const obj = node.object;
            const typeview = node.typeview;
            if (obj?.fillcolor) {
              node.fillcolor = obj.fillcolor;
            } else if (typeview?.fillcolor) {
              node.fillcolor = typeview.fillcolor;
            }
          }
        }
        break;
      }
      case 'ChangedSelection': {
        if (this.suppressSelectionChange) {
          break;
        }
        const sel = e.subject.first();
        if (!sel) break;
        const myDiagram = e.diagram;
        const node = myDiagram.findNodeForKey(sel.data?.key);
        if (debug) console.log('122 data', sel.data, sel, sel.data, e);
        this.applyFocusForNode(myDiagram, node);
        break;
      }
      default:
        break;
    }
  };

  public handleSelectConnected = (nodeData: go.ObjectData, diagram: go.Diagram) => {
    if (!diagram || !nodeData) {
      return;
    }
    const targetKey = nodeData.key as go.Key;
    if (targetKey === undefined || targetKey === null) {
      return;
    }
    const links = this.state.linkDataArray || [];
    const visited = new Set<go.Key>();
    const queue: go.Key[] = [];

    visited.add(targetKey);
    queue.push(targetKey);

    while (queue.length > 0) {
      const currentKey = queue.shift();
      if (currentKey === undefined || currentKey === null) {
        continue;
      }
      links.forEach((link: go.ObjectData) => {
        const from = link.from as go.Key;
        const to = link.to as go.Key;
        if (from === undefined || from === null || to === undefined || to === null) {
          return;
        }
        if (from === currentKey && !visited.has(to)) {
          visited.add(to);
          queue.push(to);
        } else if (to === currentKey && !visited.has(from)) {
          visited.add(from);
          queue.push(from);
        }
      });
    }

    this.suppressSelectionChange = true;
    try {
      diagram.clearSelection();
      visited.forEach((key: go.Key) => {
        const part = diagram.findNodeForKey(key);
        if (part) {
          part.isSelected = true;
        }
      });
    } finally {
      this.suppressSelectionChange = false;
    }

    const focusNode = diagram.findNodeForKey(targetKey);
    this.applyFocusForNode(diagram, focusNode);
  };

  /**
   * Handle GoJS model changes, which output an object of data changes via Model.toIncrementalData.
   * This method iterates over those changes and updates state to keep in sync with the GoJS model.
   * @param obj a JSON-formatted string
   */
  public handleModelChange = (obj: go.IncrementalData) => {
    const insertedNodeKeys = obj.insertedNodeKeys;
    const modifiedNodeData = obj.modifiedNodeData;
    const removedNodeKeys = obj.removedNodeKeys;
    const insertedLinkKeys = obj.insertedLinkKeys;
    const modifiedLinkData = obj.modifiedLinkData;
    const removedLinkKeys = obj.removedLinkKeys;
    const modifiedModelData = obj.modelData;

    // maintain maps of modified data so insertions don't need slow lookups
    const modifiedNodeMap = new Map<go.Key, go.ObjectData>();
    const modifiedLinkMap = new Map<go.Key, go.ObjectData>();

    let nodeDataArray = this.state.nodeDataArray ? [...this.state.nodeDataArray] : [];
    let linkDataArray = this.state.linkDataArray ? [...this.state.linkDataArray] : [];
    let selectedData = this.state.selectedData;
    let modelData = this.state.modelData;
    let nodesChanged = false;
    let linksChanged = false;

    if (modifiedNodeData) {
      modifiedNodeData.forEach((nd: go.ObjectData) => {
        modifiedNodeMap.set(nd.key, nd);
        const idx = this.mapNodeKeyIdx.get(nd.key);
        if (idx !== undefined && idx >= 0) {
          nodeDataArray[idx] = nd;
          nodesChanged = true;
          if (selectedData && selectedData.key === nd.key) {
            selectedData = nd;
          }
        }
      });
    }
    if (insertedNodeKeys) {
      insertedNodeKeys.forEach((key: go.Key) => {
        const nd = modifiedNodeMap.get(key);
        const idx = this.mapNodeKeyIdx.get(key);
        if (nd && idx === undefined) {
          nodeDataArray.push(nd);
          nodesChanged = true;
        }
      });
    }
    if (removedNodeKeys && removedNodeKeys.length > 0) {
      const removedSet = new Set(removedNodeKeys);
      nodeDataArray = nodeDataArray.filter((nd: go.ObjectData) => !removedSet.has(nd.key));
      nodesChanged = true;
      if (selectedData && removedSet.has(selectedData.key)) {
        selectedData = null;
      }
    }

    if (modifiedLinkData) {
      modifiedLinkData.forEach((ld: go.ObjectData) => {
        modifiedLinkMap.set(ld.key, ld);
        const idx = this.mapLinkKeyIdx.get(ld.key);
        if (idx !== undefined && idx >= 0) {
          linkDataArray[idx] = ld;
          linksChanged = true;
          if (selectedData && selectedData.key === ld.key) {
            selectedData = ld;
          }
        }
      });
    }
    if (insertedLinkKeys) {
      insertedLinkKeys.forEach((key: go.Key) => {
        const ld = modifiedLinkMap.get(key);
        const idx = this.mapLinkKeyIdx.get(key);
        if (ld && idx === undefined) {
          linkDataArray.push(ld);
          linksChanged = true;
        }
      });
    }
    if (removedLinkKeys && removedLinkKeys.length > 0) {
      const removedSet = new Set(removedLinkKeys);
      linkDataArray = linkDataArray.filter((ld: go.ObjectData) => !removedSet.has(ld.key));
      linksChanged = true;
      if (selectedData && removedSet.has(selectedData.key)) {
        selectedData = null;
      }
    }

    if (modifiedModelData) {
      modelData = modifiedModelData;
    }

    this.setState({
      nodeDataArray,
      linkDataArray,
      modelData,
      selectedData,
      skipsDiagramUpdate: true
    }, () => {
      if (nodesChanged) {
        this.refreshNodeIndex(this.state.nodeDataArray);
      }
      if (linksChanged) {
        this.refreshLinkIndex(this.state.linkDataArray);
      }
    });
  };

  /**
   * Handle inspector changes, and on input field blurs, update node/link data state.
   * @param path the path to the property being modified
   * @param value the new value of that property
   * @param isBlur whether the input event was a blur, indicating the edit is complete
   */
  public handleInputChange = (path: string, value: string, isBlur: boolean) => {
    let refreshNodes = false;
    let refreshLinks = false;
    this.setState(prevState => {
      const currentSelection = prevState.selectedData;
      if (!currentSelection) {
        return null;
      }
      const updatedSelection = { ...currentSelection, [path]: value };
      let nodeDataArray = prevState.nodeDataArray;
      let linkDataArray = prevState.linkDataArray;
      let skipsDiagramUpdate = prevState.skipsDiagramUpdate;

      if (isBlur) {
        const key = updatedSelection.key;
        if (key < 0) {  // negative keys are links
          const idx = this.mapLinkKeyIdx.get(key);
          if (idx !== undefined && idx >= 0) {
            linkDataArray = [...prevState.linkDataArray];
            linkDataArray[idx] = updatedSelection;
            skipsDiagramUpdate = false;
            refreshLinks = true;
          }
        } else {
          const idx = this.mapNodeKeyIdx.get(key);
          if (idx !== undefined && idx >= 0) {
            nodeDataArray = [...prevState.nodeDataArray];
            nodeDataArray[idx] = updatedSelection;
            skipsDiagramUpdate = false;
            refreshNodes = true;
          }
        }
      }

      return {
        selectedData: updatedSelection,
        nodeDataArray,
        linkDataArray,
        skipsDiagramUpdate
      };
    }, () => {
      if (refreshNodes) {
        this.refreshNodeIndex(this.state.nodeDataArray);
      }
      if (refreshLinks) {
        this.refreshLinkIndex(this.state.linkDataArray);
      }
    });
  };

  /**
   * Handle changes to the checkbox on whether to allow relinking.
   * @param e a change event from the checkbox
   */
  public handleRelinkChange = (e: any) => {
    const target = e.target;
    const value = target.checked;
    this.setState({ modelData: { canRelink: value }, skipsDiagramUpdate: false });
  };

  public render() {
    const selectedData = this.state.selectedData;
    if (debug) console.log('269 selectedData', selectedData);
    let inspector;
    if (selectedData !== null) {
      inspector = <>
        <p>Selected Object Properties:</p>
        <SelectionInspector
          selectedData={this.state.selectedData}
          onInputChange={this.handleInputChange}
        />;
      </>
    }
    if (debug) console.log('294 this.diagramStyle', this.state.diagramStyle);
    if (debug) console.log('295 this.state', this.state.nodeDataArray, this.state.linkDataArray);
    return (
      <div>
        <PaletteWrapper
          divClassName={this.props?.divClassName || 'diagram-component-palette'}
          nodeDataArray={this.state.nodeDataArray}
          linkDataArray={this.state.linkDataArray}
          modelData={this.state.modelData}
          skipsDiagramUpdate={this.state.skipsDiagramUpdate}
          onDiagramEvent={this.handleDiagramEvent}
          onModelChange={this.handleModelChange}
          diagramStyle={this.state.diagramStyle}
          noOfCols={this.state.noOfCols}
          onNodeContextMenu={this.handleSelectConnected}

        />
        {/* <label>
          Allow Relinking?
          <input
            type='checkbox'
            id='relink'
            checked={this.state.modelData.canRelink}
            onChange={this.handleRelinkChange} />
        </label> */}
        {/* {inspector} */}
      </div>
    );
  }
}

export default GoJSPaletteApp;




{/* <p>
 gio.
  <input type="text" value={this.state.modelData.title} onChange={this.handleInputChange} />  



  
          Try moving around nodes, editing text, relinking, undoing (Ctrl-Z), etc. within the diagram
          and you'll notice the changes are reflected in the inspector area. You'll also notice that changes
          made in the inspector are reflected in the diagram. If you use the React dev tools,
          you can inspect the React state and see it updated as changes happen.
        </p>
        <p>
          Check out the <a href='https://gojs.net/latest/intro/react.html' target='_blank' rel='noopener noreferrer'>Intro page on using GoJS with React</a> for more information.
        </p> */}
