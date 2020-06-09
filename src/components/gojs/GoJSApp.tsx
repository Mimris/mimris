// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as go from 'gojs';
import { produce } from 'immer';
import * as React from 'react';

import { DiagramWrapper } from './components/Diagram';
import { SelectionInspector } from './components/SelectionInspector';

// import './GoJSApp.css';
import glb from '../../akmm/akm_globals';
import * as utils from '../../akmm/utilities';
import * as akm from '../../akmm/metamodeller';
import * as gjs from '../../akmm/ui_gojs';
import * as gql from '../../akmm/ui_graphql';
import * as uic from '../../akmm/ui_common';

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
}

class GoJSApp extends React.Component<{}, AppState> {
  // Maps to store key -> arr index for quick lookups
  private mapNodeKeyIdx: Map<go.Key, number>;
  private mapLinkKeyIdx: Map<go.Key, number>;


  constructor(props: object) {
    super(props);
    // console.log('34',props.nodeDataArray);
    this.state = {
      nodeDataArray: this.props?.nodeDataArray,
      linkDataArray: this.props?.linkDataArray,
      modelData: {
        canRelink: true
      },
      selectedData: null,
      skipsDiagramUpdate: false,
      metis: this.props.metis,
      myMetis: this.props.myMetis,
      myGoModel: this.props.myGoModel,
      phFocus: this.props.phFocus,
      dispatch: this.props.dispatch
    };
    // init maps
    this.mapNodeKeyIdx = new Map<go.Key, number>();
    this.mapLinkKeyIdx = new Map<go.Key, number>();
    this.refreshNodeIndex(this.state.nodeDataArray);
    this.refreshLinkIndex(this.state.linkDataArray);
    // bind handler methods
    this.handleDiagramEvent = this.handleDiagramEvent.bind(this);
    //this.handleModelChange = this.handleModelChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleRelinkChange = this.handleRelinkChange.bind(this);
  }



  /**
   * Update map of node keys to their index in the array.
   */
  private refreshNodeIndex(nodeArr: Array<go.ObjectData>) {
    this.mapNodeKeyIdx.clear();
    nodeArr.forEach((n: go.ObjectData, idx: number) => {
      this.mapNodeKeyIdx.set(n.key, idx);
    });
  }

  /**
   * Update map of link keys to their index in the array.
   */
  private refreshLinkIndex(linkArr: Array<go.ObjectData>) {
    this.mapLinkKeyIdx.clear();
    linkArr.forEach((l: go.ObjectData, idx: number) => {
      this.mapLinkKeyIdx.set(l.key, idx);
    });
  }

  private getNode(goModel: any, key: string) {
    const nodes = goModel.nodes;
    if (nodes) {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node) {
          if (node.key === key)
            return node;
        }
      }
    }
    return null;
  }

  /**
   * Handle any relevant DiagramEvents, in this case just selection changes.
   * On ChangedSelection, find the corresponding data and set the selectedData state.
   * @param e a GoJS DiagramEvent
   */
  public handleDiagramEvent(e: go.DiagramEvent) {
    const name = e.name;
    const myDiagram = e.diagram;
    const myMetis = this.state.myMetis;
    const myModel = myMetis.findModel(this.state.phFocus.focusModel.id);
    const myModelview = myMetis.findModelView(this.state.phFocus.focusModelview.id);
    const myMetamodel = myModel?.getMetamodel();
    const myGoModel = myMetis?.getGojsModel();
    const gojsModel = {
      nodeDataArray: myGoModel.nodes,
      linkDataArray: myGoModel.links
    }
    const addedNodes = new Array();
    const modifiedNodes = new Array();
    const deletedNodes = new Array();
    const addedLinks = new Array();
    const modifiedLinks = new Array();
    const deletedLinks = new Array();
    //const myGoModel = this.state.myGoModel;
    // const myGojsModel = new gjs.goModel(utils.createGuid(), myModelview?.name, myModelview);
    // myGojsModel.nodes = this.state.phFocus.gojsModel.nodeDataArray;
    // myGojsModel.links = this.state.phFocus.gojsModel.linkDataArray;
    let done = false;
    const context = {
      "myMetis": myMetis,
      "myMetamodel": myMetamodel,
      "myModel": myModel,
      "myModelview": myModelview,
      "myGoModel": myGoModel,
      "myDiagram": myDiagram,
      "pasteviewsonly": false,
      "deleteViewsOnly": false,
      "done": done
    }
    switch (name) {
      case 'TextEdited': {
        let sel = e.subject.part;
        let field = e.subject.name;
        this.setState(
          produce((draft: AppState) => {
            if (sel) {
              if (sel instanceof go.Node) {
                const key = sel.data.key;
                const text = sel.data.name;
                const myNode = this.getNode(context.myGoModel, key);
                if (myNode) {
                  myNode.name = text;
                  uic.updateObject(myNode, field, text, context);
                  console.log('153 GoJSApp event, myNode:', myNode);
                  const modNode = new gql.gqlObjectView(myNode.objectview);
                  modifiedNodes.push(modNode);
                }
              }
            }
          })
        )
      }
        break;
      case "SelectionMoved": {
        let selection = e.subject;
        this.setState(
          produce((draft: AppState) => {
            for (let it = selection.iterator; it.next();) {
              const sel = it.value.data;
              uic.changeNodeSizeAndPos(sel, myGoModel, modifiedNodes);
              const objview = sel.objectview;
              if (objview) {
                // Check if inside a group
                const group = uic.getGroupByLocation(myGoModel, objview.loc);
                if (group) {
                  objview.group = group.objectview.id;
                  const myNode = myGoModel?.findNode(sel.key);
                  myNode.group = group.key;
                } else {
                  objview.group = "";
                  const myNode = myGoModel?.findNode(sel.key);
                  myNode.group = "";
                }
              }
            }
          })
        )
      }
        break;
      case "SelectionDeleted": {
        let deleted = e.subject;
        this.setState(
          produce((draft: AppState) => {
            for (let it = deleted.iterator; it.next();) {
              let del: any = it.value.data;  // n is now a Node or a Group
              if (del.class === "goObjectNode") {
                let nd = myGoModel?.findNode(del.key) as gjs.goObjectNode;
                if (nd) {
                  let d_objview = nd.objectview;
                  if (d_objview) {
                    const d_object = d_objview?.object;
                    if (d_object) {
                      const oviews = context?.myMetis?.getObjectViewsByObject(d_object.id);
                      if (oviews) {
                        for (let i = 0; i < oviews.length; i++) {
                          const oview = oviews[i];
                          oview.deleted = true;
                        }
                      }
                    }
                    d_objview.deleted = true;
                    d_object.deleted = true;
                    const delNode = new gql.gqlObjectView(d_objview);
                    deletedNodes.push(delNode);
                  }
                  let nodes = new Array();
                  if (myGoModel) {
                    for (let i = 0; i < myGoModel?.nodes.length; i++) {
                      let n = myGoModel.nodes[i];
                      if (n.key !== nd.key) {
                        nodes.push(n);
                      }
                    }
                    myGoModel.nodes = nodes;
                  }
                }
              }
              else if (del.class === "goRelshipLink") {
                const ld = myGoModel?.findLink(del.key);
                if (ld) {
                  const d_relview = ld.relshipview;
                  if (d_relview) {
                    const d_relship = d_relview.relship;

                    if (d_relship) {
                      const rviews = context?.myMetis?.getRelationshipViewsByRelship(d_relship.id);
                      if (rviews) {
                        for (let i = 0; i < rviews.length; i++) {
                          const rview = oviews[i];
                          rview.deleted = true;
                        }
                      }
                      d_relview.deleted = true;
                      d_relship.deleted = true;
                      const delLink = new gql.gqlRelshipView(d_relview);
                      deletedNodes.push(delLink);
                    }
                    let links = new Array();
                    for (let i = 0; i < myGoModel?.links.length; i++) {
                      let l = myGoModel.links[i];
                      if (l.key !== ld.key) {
                        links.push(l);
                      }
                    }
                    myGoModel.links = links;
                  }
                }
              }
            }
          })
        )
      }
        break;
      case 'ChangedSelection': {
        const sel = e.subject.first();
        this.setState(
          produce((draft: AppState) => {
            if (sel) {
              if (sel instanceof go.Node) {
                const idx = this.mapNodeKeyIdx.get(sel.key);
                if (idx !== undefined && idx >= 0) {
                  const nd = draft.nodeDataArray[idx];
                  draft.selectedData = nd;
                  console.log('98 GoJSApp.tsx: node = ', nd);
                }
              } else if (sel instanceof go.Link) {
                console.log('174 GoJSApp.tsx: sel = ', sel);
                const idx = this.mapLinkKeyIdx.get(sel.data.key);
                if (idx !== undefined && idx >= 0) {
                  const ld = draft.linkDataArray[idx];
                  draft.selectedData = ld;
                  console.log('178 GoJSApp.tsx: link = ', ld);
                }
              }
            } else {
              draft.selectedData = null;
            }
          })
        );
        break;
      }
        break;
      case 'ExternalObjectsDropped': {
        const nodes = e.subject;
        console.log('192 ExternalObjectsDropped', nodes.first());
        this.setState(
          produce((draft: AppState) => {
            const nn = nodes.first();
            const part = nodes.first().data;
            console.log('309 gojsapp', part);
            
            const objview = uic.createObject(part, context);
            if (objview) {
              // Check if inside a group
              const group = uic.getGroupByLocation(myGoModel, objview.loc);
              if (group) {
                objview.group = group.objectview.id;
                const myNode = myGoModel?.findNode(part.key);
                myNode.group = group.key;
              }
              const addNode = new gql.gqlObjectView(objview);
              addedNodes.push(addNode);
            }
          })
        )
      }
        break;
      case "ObjectSingleClicked": {
        console.log(e.subject);
        this.setState(
          produce((draft: AppState) => {
          })
        )
      }
        break;
      case "PartResized": {
        const sel = e.subject.part.data;
        this.setState(
          produce((draft: AppState) => {
            uic.changeNodeSizeAndPos(sel, myGoModel, modifiedNodes);
          })
        )
      }
        break;
      case 'ClipboardChanged': {
        const nodes = e.subject;
        console.log('nodes', nodes);
        this.setState(
          produce((draft: AppState) => {
          })
        )
      }
        break;
      case 'ClipboardPasted': {
        const selected = e.subject;
        this.setState(
          produce((draft: AppState) => {
            uic.onClipboardPasted(selected);
          })
        )
      }
        break;
      case 'LinkDrawn': {
        const link = e.subject;
        console.log('199 LinkDrawn', link);
        this.setState(
          produce((draft: AppState) => {
            const relview = uic.onLinkDrawn(link, context);
            if (relview) {
              const addLink = new gql.gqlRelshipView(relview);
              addedLinks.push(addLink);
            }
          })
        )
      }
        break;
      case "LinkRelinked": {
        const newLink = e.subject.data;
        console.log('207 LinkRelinked', newLink);
        this.setState(
          produce((draft: AppState) => {
            uic.onLinkRelinked(newLink, context.myGoModel);
          })
        )
      }
        break;
      default:
        console.log('146 GoJSApp event name: ', name);
        break;
    }
    this.props.dispatch({ type: 'SET_GOJS_MODEL', gojsModel })
    // console.log('319 addedNodes', addedNodes);
    // console.log('321 deletedNodes', deletedNodes);
    // console.log('322 addedLinks', addedLinks);
    // console.log('323 modifiedLinks', modifiedLinks);
    // console.log('324 deletedLinks', deletedLinks);
    // console.log('394 modifiedNodes', modifiedNodes);
    modifiedNodes.map(mn => {
        let data = mn
        this.props.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
      }
    )
  }

  /**
   * Handle GoJS model changes, which output an object of data changes via Model.toIncrementalData.
   * This method iterates over those changes and updates state to keep in sync with the GoJS model.
   * @param obj a JSON-formatted string
   */
  public handleModelChange(obj: go.IncrementalData) {
    const insertedNodeKeys = obj.insertedNodeKeys;
    const modifiedNodeData = obj.modifiedNodeData;
    const removedNodeKeys = obj.removedNodeKeys;
    const insertedLinkKeys = obj.insertedLinkKeys;
    const modifiedLinkData = obj.modifiedLinkData;
    const removedLinkKeys = obj.removedLinkKeys;
    const modifiedModelData = obj.modelData;

    // console.log('211 handleModelChange', obj);
    // maintain maps of modified data so insertions don't need slow lookups
    const modifiedNodeMap = new Map<go.Key, go.ObjectData>();
    const modifiedLinkMap = new Map<go.Key, go.ObjectData>();
    this.setState(
      produce((draft: AppState) => {
        let narr = draft.nodeDataArray;
        if (modifiedNodeData) {
          modifiedNodeData.forEach((nd: go.ObjectData) => {
            modifiedNodeMap.set(nd.key, nd);
            const idx = this.mapNodeKeyIdx.get(nd.key);
            if (idx !== undefined && idx >= 0) {
              narr[idx] = nd;
              if (draft.selectedData && draft.selectedData.key === nd.key) {
                draft.selectedData = nd;
              }
            }
          });
        }
        if (insertedNodeKeys) {
          insertedNodeKeys.forEach((key: go.Key) => {
            const nd = modifiedNodeMap.get(key);
            const idx = this.mapNodeKeyIdx.get(key);
            if (nd && idx === undefined) {
              this.mapNodeKeyIdx.set(nd.key, narr.length);
              narr.push(nd);
              console.log(nd);
            }
          });
        }
        if (removedNodeKeys) {
          narr = narr.filter((nd: go.ObjectData) => {
            if (removedNodeKeys.includes(nd.key)) {
              return false;
            }
            return true;
          });
          draft.nodeDataArray = narr;
          this.refreshNodeIndex(narr);
        }

        let larr = draft.linkDataArray;
        if (modifiedLinkData) {
          modifiedLinkData.forEach((ld: go.ObjectData) => {
            modifiedLinkMap.set(ld.key, ld);
            const idx = this.mapLinkKeyIdx.get(ld.key);
            if (idx !== undefined && idx >= 0) {
              larr[idx] = ld;
              if (draft.selectedData && draft.selectedData.key === ld.key) {
                draft.selectedData = ld;
              }
            }
          });
        }
        if (insertedLinkKeys) {
          insertedLinkKeys.forEach((key: go.Key) => {
            const ld = modifiedLinkMap.get(key);
            const idx = this.mapLinkKeyIdx.get(key);
            if (ld && idx === undefined) {
              this.mapLinkKeyIdx.set(ld.key, larr.length);
              larr.push(ld);
            }
          });
        }
        if (removedLinkKeys) {
          larr = larr.filter((ld: go.ObjectData) => {
            if (removedLinkKeys.includes(ld.key)) {
              return false;
            }
            return true;
          });
          draft.linkDataArray = larr;
          this.refreshLinkIndex(larr);
        }
        // handle model data changes, for now just replacing with the supplied object
        if (modifiedModelData) {
          draft.modelData = modifiedModelData;
          // console.log('256 GoJSApp modelData', draft.modelData);
        }
        draft.skipsDiagramUpdate = true;  // the GoJS model already knows about these updates
      })
    );
  }

  /**
   * Handle inspector changes, and on input field blurs, update node/link data state.
   * @param path the path to the property being modified
   * @param value the new value of that property
   * @param isBlur whether the input event was a blur, indicating the edit is complete
   */
  public handleInputChange(path: string, value: string, isBlur: boolean) {
    this.setState(
      produce((draft: AppState) => {
        const data = draft.selectedData as go.ObjectData;  // only reached if selectedData isn't null
        data[path] = value;
        if (isBlur) {
          const key = data.key;
          if (key < 0) {  // negative keys are links
            const idx = this.mapLinkKeyIdx.get(key);
            if (idx !== undefined && idx >= 0) {
              draft.linkDataArray[idx] = data;
              draft.skipsDiagramUpdate = false;
            }
          } else {
            const idx = this.mapNodeKeyIdx.get(key);
            if (idx !== undefined && idx >= 0) {
              draft.nodeDataArray[idx] = data;
              draft.skipsDiagramUpdate = false;
            }
          }
        }
      })
    );
    // console.log('247 input: ', value);
  }

  /**
   * Handle changes to the checkbox on whether to allow relinking.
   * @param e a change event from the checkbox
   */
  public handleRelinkChange(e: any) {
    const target = e.target;
    const value = target.checked;
    this.setState({ modelData: { canRelink: value }, skipsDiagramUpdate: false });
    // console.log('257 relink: ', value);
  }

  public render() {
    // console.log('360 props', this.state.nodeDataArray);

    const selectedData = this.state.selectedData;
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
    
    // console.log('360 this.state.nodeDataArray', this.state.nodeDataArray);
    // console.log('361 this.state.linkDataArray', this.state.linkDataArray);
    // console.log('362 this.state.myMetis', this.state.myMetis);
    // console.log('362 this.state.myGoModel', this.state.myGoModel);

    return (
      <div>

        <DiagramWrapper
          nodeDataArray={this.state.nodeDataArray}
          linkDataArray={this.state.linkDataArray}
          modelData={this.state.modelData}
          skipsDiagramUpdate={this.state.skipsDiagramUpdate}
          onDiagramEvent={this.handleDiagramEvent}
          onModelChange={this.handleModelChange}
        />
        <label>
          Allow Relinking?
          <input
            type='checkbox'
            id='relink'
            checked={this.state.modelData.canRelink}
            onChange={this.handleRelinkChange} />
        </label>
        {inspector}
      </div>
    );
  }
}

export default GoJSApp;
