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
  myGoMetamodel: gjs.goModel;
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
      nodeDataArray:      this.props?.nodeDataArray,
      linkDataArray:      this.props?.linkDataArray,
      modelData: {
        canRelink: true
      },
      selectedData:       null,
      skipsDiagramUpdate: false,
      metis:              this.props.metis,
      myMetis:            this.props.myMetis,
      myGoModel:          this.props.myGoModel,
      myGoMetamodel:      this.props.myGoMetamodel,
      phFocus:            this.props.phFocus,
      dispatch:           this.props.dispatch
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
    //this.handleRelinkChange = this.handleRelinkChange.bind(this);
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

  private getLink(goModel: any, key: string) {
    const links = goModel.links;
    if (links) {
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        if (link) {
          if (link.key === key)
            return link;
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
    const myDiagram     = e.diagram;
    const myMetis       = this.state.myMetis;
    const myModel       = myMetis.findModel(this.state.phFocus.focusModel.id);
    const myModelview   = myMetis.findModelView(this.state.phFocus.focusModelview.id);
    const myMetamodel   = myModel?.getMetamodel();
    const myGoModel     = this.state.myGoModel;
    const myGoMetamodel = this.state.myGoMetamodel;
    const gojsModel = {
      nodeDataArray: myGoModel.nodes,
      linkDataArray: myGoModel.links
    }
    const gojsMetamodel = {
      nodeDataArray: myGoMetamodel.nodes,
      linkDataArray: myGoMetamodel.links
    }
    const modifiedNodes     = new Array();
    const modifiedLinks     = new Array();
    const modifiedTypeNodes = new Array();
    const modifiedTypeLinks = new Array();
    const modifiedObjects   = new Array();
    const modifiedRelships  = new Array();
    let done = false;
    const context = {
      "myMetis"         : myMetis,
      "myMetamodel"     : myMetamodel,
      "myModel"         : myModel,
      "myModelview"     : myModelview,
      "myGoModel"       : myGoModel,
      "myGoMetamodel"   : myGoMetamodel,
      "myDiagram"       : myDiagram,
      "pasteviewsonly"  : false,
      "deleteViewsOnly" : false,
      "done"            : done
    }
    console.log('153 handleDiagramEvent - context', name, this.state, context);

    switch (name) {
      case 'TextEdited': {
        let sel = e.subject.part;
        let field = e.subject.name;
        this.setState(
          produce((draft: AppState) => {
            if (sel) {
              if (sel instanceof go.Node) {
                const key = sel.data.key;
                let text = sel.data.name;
                const typename = sel.data.type;
                // console.log('190 GoJSApp', sel.data);
                if (typename === 'Object type') {
                  if (text === 'Edit name') {
                    text = prompt('Enter name');
                  }
                  const myNode = this.getNode(context.myGoMetamodel, key);
                  console.log('196 GoJSApp', myNode);
                  if (myNode) {
                    myNode.name = text;
                    uic.updateObjectType(myNode, field, text, context);
                    console.log('197 GoJSApp', field, text, myNode);
                    const modNode = new gql.gqlObjectType(myNode.objtype, true);
                    modifiedTypeNodes.push(modNode);
                  }
                } else {
                  if (text === 'Edit name') {
                    text = prompt('Enter name');
                    sel.data.name = text;
                  }
                  const myNode = this.getNode(context.myGoModel, key);
                  // console.log('207, text GoJSApp', myNode);
                  if (myNode) {
                    myNode.name = text;
                    uic.updateObject(myNode, field, text, context);
                    // console.log('211 GoJSApp', field, text, myNode);
                    const modNode = new gql.gqlObjectView(myNode.objectview);
                    modifiedNodes.push(modNode);
                  }
                }
              }
              if (sel instanceof go.Link) {
                  // relationship
                  console.log('219 TextEdited', sel.data);
                  const key = sel.data.key;
                  let text = sel.data.name;
                  let typename = sel.data.type;
                  if (typename === 'Relationship type') {
                    const myLink = this.getLink(context.myGoMetamodel, key);
                    console.log('229 TextEdited', context);
                    if (myLink) {
                      if (text === 'Edit name') {
                        text = prompt('Enter name');
                        typename = text;
                      }
                      console.log('235 GoJSApp', typename);
                      uic.updateRelationshipType(myLink, field, text, context);
                    }
                    context.myDiagram.model.setDataProperty(myLink.data, "name", myLink.name);
                  } else {
                    const myLink = this.getLink(context.myGoModel, key);
                    if (myLink) {
                      if (text === 'Edit name') {
                        text = prompt('Enter name');
                        sel.data.name = text;
                      }
                      myLink.name = text;
                      console.log('246 GoJSApp', field, text, myLink);
                      uic.updateRelationship(myLink, field, text, context);
                      if (myLink.relationshipview) {
                        const modLink = new gql.gqlRelshipView(myLink.relationshipview);
                        console.log('250 TextEdited', myLink, modLink);
                        modifiedLinks.push(modLink);
                      }
                      context.myDiagram.model.setDataProperty(myLink.data, "name", myLink.name);
                    }
                  }
              }
            }
          }
        ))
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
        const deletedFlag = true;
        const deleted = e.subject;
        this.setState(
          produce((draft: AppState) => {
            for (let it = deleted.iterator; it.next();) {
              let del: any = it.value.data;  // n is now a Node or a Group
              if (del.class === "goObjectNode") {
                  uic.deleteNode(del, deletedFlag, deletedNodes, context);
              }
              else if (del.class === "goRelshipLink") {
                uic.deleteLink(del, deletedFlag, deletedLinks, context);
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
                  // console.log('98 GoJSApp.tsx: node = ', nd);
                }
              } else if (sel instanceof go.Link) {
                // console.log('174 GoJSApp.tsx: sel = ', sel);
                const idx = this.mapLinkKeyIdx.get(sel.data.key);
                if (idx !== undefined && idx >= 0) {
                  const ld = draft.linkDataArray[idx];
                  draft.selectedData = ld;
                  // console.log('178 GoJSApp.tsx: link = ', ld);
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
        this.setState(
          produce((draft: AppState) => {
            const nn = nodes.first();
            const part = nodes.first().data;
            // console.log('309 GoJSApp', part);
            if (part.type === 'objecttype') {
              const otype = uic.createObjectType(part, context);
              console.log('268 ExternalObjectsDropped - otype', otype);
              const modNode = new gql.gqlObjectType(otype, true);
              modifiedTypeNodes.push(modNode);
              console.log('285 modifiedTypeNodes', modifiedTypeNodes);
            } else {
              const objview = uic.createObject(part, context);
              if (objview) {
                // Check if inside a group
                const group = uic.getGroupByLocation(myGoModel, objview.loc);
                if (group) {
                  objview.group = group.objectview?.id;
                  const myNode = myGoModel?.findNode(part.key);
                  if (myNode) {
                    console.log('322 myNode', myNode, group);
                    myNode.group = group.key;
                  }
                }
                const newNode = new gql.gqlObjectView(objview);
                modifiedNodes.push(newNode);
              }
            }
          })
        )
      }
        break;
      case "ObjectSingleClicked": {
        console.log('334 GoJSApp :',e.subject);
        this.setState(
          produce((draft: AppState) => {
          })
          )
        console.log('366 GoJSApp :', this.state);

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
        const fromNode = link.fromNode.data;
        const toNode   = link.toNode.data;
        console.log('397 LinkDrawn', fromNode, toNode);
        this.setState(
          produce((draft: AppState) => {
            if (fromNode.class === 'goObjectNode') {
              const relview = uic.onLinkDrawn(link, context);
              if (relview) {
                const modifiedLink = new gql.gqlRelshipView(relview);
                console.log('414 LinkDrawn', link, modifiedLink);
                modifiedLinks.push(modifiedLink);
              }
            } else if (fromNode.class === 'goObjectTypeNode') {
              link.category = 'Relationship type';
              link.class = 'goRelshipTypeLink';
              const reltype = uic.onLinkDrawn(link, context);
              if (reltype) {
                const modifiedLink = new gql.gqlRelationshipType(reltype);
                modifiedTypeLinks.push(modifiedLink);
              }
            }
          })
        )
      }
      break;
      case "LinkRelinked": {
        const newLink = e.subject.data;
        // console.log('207 LinkRelinked', newLink);
        this.setState(
          produce((draft: AppState) => {
            uic.onLinkRelinked(newLink, context.myGoModel);
          })
        )
      }
      break;
      case "BackgroundDoubleClicked": {
        console.log('432 BackgroundDoubleClicked', e, e.diagram); 
        break;
      }
      default:
        // console.log('146 GoJSApp event name: ', name);
      break;
    }
    this.props.dispatch({ type: 'SET_GOJS_MODEL', gojsModel })
    this.props.dispatch({ type: 'SET_GOJS_METAMODEL', gojsMetamodel })
    
    console.log('441 modifiedNodes', modifiedNodes);
    modifiedNodes.map(mn => {
      let data = mn
      this.props?.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
    })
    
    console.log('447 modifiedTypeNodes', modifiedTypeNodes);
    modifiedTypeNodes?.map(mn => {
        let data = (mn) && mn
        this.props?.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data })
    })

    console.log('453 modifiedLinks', modifiedLinks);
    modifiedLinks.map(mn => {
      let data = mn
      this.props?.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
    })
    
    console.log('459 modifiedTypeLinks', modifiedTypeLinks);
    modifiedTypeLinks?.map(mn => {
        let data = (mn) && mn
        this.props?.dispatch({ type: 'UPDATE_RELSHIPTYPE_PROPERTIES', data })
    })

    console.log('465 modifiedObjects', modifiedObjects);
    modifiedObjects?.map(mn => {
        let data = (mn) && mn
        this.props?.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
    })

    console.log('471 modifiedRelships', modifiedRelships);
    modifiedRelships?.map(mn => {
        let data = (mn) && mn
        this.props?.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
    })
  }

  // /**
  //  * Handle GoJS model changes, which output an object of data changes via Model.toIncrementalData.
  //  * This method iterates over those changes and updates state to keep in sync with the GoJS model.
  //  * @param obj a JSON-formatted string
  //  */
  // public handleModelChange(obj: go.IncrementalData) {
  //   const insertedNodeKeys = obj.insertedNodeKeys;
  //   const modifiedNodeData = obj.modifiedNodeData;
  //   const removedNodeKeys = obj.removedNodeKeys;
  //   const insertedLinkKeys = obj.insertedLinkKeys;
  //   const modifiedLinkData = obj.modifiedLinkData;
  //   const removedLinkKeys = obj.removedLinkKeys;
  //   const modifiedModelData = obj.modelData;

  //   // console.log('211 handleModelChange', obj);
  //   // maintain maps of modified data so insertions don't need slow lookups
  //   const modifiedNodeMap = new Map<go.Key, go.ObjectData>();
  //   const modifiedLinkMap = new Map<go.Key, go.ObjectData>();
  //   this.setState(
  //     produce((draft: AppState) => {
  //       let narr = draft.nodeDataArray;
  //       if (modifiedNodeData) {
  //         modifiedNodeData.forEach((nd: go.ObjectData) => {
  //           modifiedNodeMap.set(nd.key, nd);
  //           const idx = this.mapNodeKeyIdx.get(nd.key);
  //           if (idx !== undefined && idx >= 0) {
  //             narr[idx] = nd;
  //             if (draft.selectedData && draft.selectedData.key === nd.key) {
  //               draft.selectedData = nd;
  //             }
  //           }
  //         });
  //       }
  //       if (insertedNodeKeys) {
  //         insertedNodeKeys.forEach((key: go.Key) => {
  //           const nd = modifiedNodeMap.get(key);
  //           const idx = this.mapNodeKeyIdx.get(key);
  //           if (nd && idx === undefined) {
  //             this.mapNodeKeyIdx.set(nd.key, narr.length);
  //             narr.push(nd);
  //             console.log(nd);
  //           }
  //         });
  //       }
  //       if (removedNodeKeys) {
  //         narr = narr.filter((nd: go.ObjectData) => {
  //           if (removedNodeKeys.includes(nd.key)) {
  //             return false;
  //           }
  //           return true;
  //         });
  //         draft.nodeDataArray = narr;
  //         this.refreshNodeIndex(narr);
  //       }

  //       let larr = draft.linkDataArray;
  //       if (modifiedLinkData) {
  //         modifiedLinkData.forEach((ld: go.ObjectData) => {
  //           modifiedLinkMap.set(ld.key, ld);
  //           const idx = this.mapLinkKeyIdx.get(ld.key);
  //           if (idx !== undefined && idx >= 0) {
  //             larr[idx] = ld;
  //             if (draft.selectedData && draft.selectedData.key === ld.key) {
  //               draft.selectedData = ld;
  //             }
  //           }
  //         });
  //       }
  //       if (insertedLinkKeys) {
  //         insertedLinkKeys.forEach((key: go.Key) => {
  //           const ld = modifiedLinkMap.get(key);
  //           const idx = this.mapLinkKeyIdx.get(key);
  //           if (ld && idx === undefined) {
  //             this.mapLinkKeyIdx.set(ld.key, larr.length);
  //             larr.push(ld);
  //           }
  //         });
  //       }
  //       if (removedLinkKeys) {
  //         larr = larr.filter((ld: go.ObjectData) => {
  //           if (removedLinkKeys.includes(ld.key)) {
  //             return false;
  //           }
  //           return true;
  //         });
  //         draft.linkDataArray = larr;
  //         this.refreshLinkIndex(larr);
  //       }
  //       // handle model data changes, for now just replacing with the supplied object
  //       if (modifiedModelData) {
  //         draft.modelData = modifiedModelData;
  //         // console.log('256 GoJSApp modelData', draft.modelData);
  //       }
  //       draft.skipsDiagramUpdate = true;  // the GoJS model already knows about these updates
  //     })
  //   );
  // }

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
    console.log('579 input: ', value);
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
    // console.log('558 this.context', this.context);

    return (
      <div className="diagramwrapper">

        <DiagramWrapper
          nodeDataArray     ={this.state.nodeDataArray}
          linkDataArray     ={this.state.linkDataArray}
          modelData         ={this.state.modelData}
          skipsDiagramUpdate={this.state.skipsDiagramUpdate}
          onDiagramEvent    ={this.handleDiagramEvent}
          onModelChange     ={this.handleModelChange}
          myMetis           ={this.state.myMetis}
          myGoModel         = {this.state.myGoModel}
          myGoMetamodel     = {this.state.myGoMetamodel}
              />
        {/* <label>
          Allow Relinking?
          <input
            type='checkbox'
            id='relink'
            checked={this.state.modelData.canRelink}
            onChange={this.handleRelinkChange} />
        </label> */}
        {inspector}
      </div>
    );
  }
}

export default GoJSApp;
