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
// import glb from '../../akmm/akm_globals';
// import * as utils from '../../akmm/utilities';
import * as akm from '../../akmm/metamodeller';
import * as gjs from '../../akmm/ui_gojs';
import * as gql from '../../akmm/ui_graphql';
import * as uic from '../../akmm/ui_common';

const constants = require('../../akmm/constants');

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
    // console.log('48 GoJSApp',props.nodeDataArray);
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
      myGoMetamodel: this.props.myGoMetamodel,
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
    const dispatch = this.state.dispatch;
    const name = e.name;
    const myDiagram = e.diagram;
    const myMetis = this.state.myMetis;
    const myModel = myMetis?.findModel(this.state.phFocus.focusModel.id);
    const myModelview = myMetis?.findModelView(this.state.phFocus.focusModelview.id);
    const myMetamodel = myModel?.getMetamodel();
    const myGoModel = this.state.myGoModel;
    const myGoMetamodel = this.state.myGoMetamodel;
    const gojsModel = {
      nodeDataArray: myGoModel.nodes,
      linkDataArray: myGoModel.links
    }
    const gojsMetamodel = {
      nodeDataArray: myGoMetamodel.nodes,
      linkDataArray: myGoMetamodel.links
    }
    const modifiedNodes = new Array();
    const modifiedLinks = new Array();
    const modifiedTypeNodes = new Array();
    const modifiedTypeViews = new Array();
    const modifiedTypeGeos = new Array();
    const modifiedLinkTypes = new Array();
    const modifiedLinkTypeViews = new Array();
    const modifiedObjects = new Array();
    const modifiedRelships = new Array();
    let done = false;
    const context = {
      "myMetis": myMetis,
      "myMetamodel": myMetamodel,
      "myModel": myModel,
      "myModelview": myModelview,
      "myGoModel": myGoModel,
      "myGoMetamodel": myGoMetamodel,
      "myDiagram": myDiagram,
      "pasteViewsOnly": false,
      "deleteViewsOnly": false,
      "dispatch": dispatch,
      "done": done
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
                if (typename === 'Object type') {
                  if (text === 'Edit name') {
                    text = prompt('Enter name');
                  }
                  const myNode = this.getNode(context.myGoMetamodel, key);
                  if (myNode) {
                    myNode.name = text;
                    uic.updateObjectType(myNode, field, text, context);
                    if (myNode.objecttype) {
                      const gqlNode = new gql.gqlObjectType(myNode.objecttype, true);
                      modifiedTypeNodes.push(gqlNode);
                    }
                  }
                } else {
                  if (text === 'Edit name') {
                    text = prompt('Enter name');
                    sel.data.name = text;
                  }
                  const myNode = this.getNode(context.myGoModel, key);
                  if (myNode) {
                    myNode.name = text;
                    uic.updateObject(myNode, field, text, context);
                    const gqlNode = new gql.gqlObjectView(myNode.objectview);
                    modifiedNodes.push(gqlNode);
                    const gqlObj = new gql.gqlObject(myNode.objectview.object);
                    modifiedObjects.push(gqlObj);
                  }
                }
              }
              if (sel instanceof go.Link) {
                // relationship
                const key = sel.data.key;
                let text = sel.data.name;
                let typename = sel.data.type;
                if (typename === 'Relationship type') {
                  const myLink = this.getLink(context.myGoMetamodel, key);
                  if (myLink) {
                    if (text === 'Edit name') {
                      text = prompt('Enter name');
                      typename = text;
                    }
                    uic.updateRelationshipType(myLink, field, text, context);
                    if (myLink.typeview) {
                      const gqlLink = new gql.gqlRelshipTypeView(myLink.typeview);
                      modifiedLinks.push(gqlLink);
                    }
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
                    uic.updateRelationship(myLink, field, text, context);
                    if (myLink.relhipview) {
                      const gqlLink = new gql.gqlRelshipView(myLink.relshipview);
                      modifiedLinks.push(gqlLink);
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
              const sel = it.value;
              const typename = sel.data.type;
              console.log('266 SelectionMoved', sel.data);
              if (typename === 'Object type') {
                // Object type moved
                // to be done
              }
              else {
                // Object moved
                const key = sel.data.key;
                uic.changeNodeSizeAndPos(sel.data, myGoModel, modifiedNodes);
                const myNode = this.getNode(context.myGoModel, key);
                console.log('271 SelectionMoved', myNode);
                console.log('272 SelectionMoved', modifiedNodes);
              }
            }
          })
        )
      }
        break;
      case "SelectionDeleted": {
        const deletedFlag = true;
        const deleted = e.subject;
        context.deleteViewsOnly = myDiagram.deleteViewsOnly;
        this.setState(
          produce((draft: AppState) => {
            for (let it = deleted.iterator; it.next();) {
              const sel: any = it.value.data;  // n is now a Node or a Group
              const key = sel.key;
              if (sel.class === "goObjectNode") {
                const myNode = this.getNode(context.myGoModel, key);
                // console.log('207, text GoJSApp', myNode);
                if (myNode) {
                  uic.deleteNode(myNode, deletedFlag, modifiedNodes, context);
                  const objview = myNode.objectview;
                  objview.deleted = deletedFlag;
                  if (objview) {
                    const gqlNode = new gql.gqlObjectView(objview);
                    console.log('314 SelectionDeleted', gqlNode);
                    modifiedNodes.push(gqlNode);
                    const gqlObj = new gql.gqlObject(objview.object);
                    //modifiedObjects.push(gqlObj);
                  }
                }
              }
              else if (sel.class === "goRelshipLink") {
                const myLink = this.getLink(context.myGoModel, key);
                uic.deleteLink(sel, deletedFlag, modifiedLinks, context);
                const relview = sel.relshipview;
                if (relview) {
                  relview.deleted = deletedFlag;
                  const gqlLink = new gql.gqlRelshipView(relview);
                  modifiedLinks.push(gqlLink);
                  console.log('314 SelectionDeleted', gqlLink);
                  const gqlRel = new gql.gqlRelationship(relview.relship);
                  modifiedLinks.push(gqlRel);
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
                  console.log('357 ChangedSelection: node = ', nd);
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
            console.log('382 GoJSApp', part);
            if (part.type === 'objecttype') {
              // if (part.viewkind === 'Object') {
              //     part.typename = constants.types.OBJECTTYPE_NAME;
              // } else {
              //     part.typename = constants.types.CONTAINERTYPE_NAME;
              // }
              const otype = uic.createObjectType(part, context);
              console.log('385 ExternalObjectsDropped - otype', otype);
              if (otype) {
                otype.typename = constants.types.OBJECTTYPE_NAME;
                console.log('388 ExternalObjectsDropped', otype);
                const gqlNode = new gql.gqlObjectType(otype, true);
                console.log('390 modifiedTypeNodes', gqlNode);
                modifiedTypeNodes.push(gqlNode);
              }
            } else // object
            {
              if (part.isGroup)
                part.size = "300 200";    // Hack
              const objview = uic.createObject(part, context);
              console.log('391 New object', objview);
              if (objview) {
                const myNode = myGoModel?.findNode(part.key);
                // Check if inside a group
                const group = uic.getGroupByLocation(myGoModel, objview.loc);
                console.log('405 group', group)
                if (group) {
                  objview.group = group.objectview?.id;
                  if (myNode) {
                    console.log('399 myNode', myNode, group);
                    myNode.group = group.key;
                  }
                }
                console.log('403 New object', myNode);
                const gqlNode = new gql.gqlObjectView(objview);
                modifiedNodes.push(gqlNode);
                console.log('406 New object', gqlNode, modifiedNodes);
                const gqlObj = new gql.gqlObject(objview.object);
                modifiedObjects.push(gqlObj);
                console.log('409 New object', gqlObj);
              }
            }
          })
        )
      }
        break;
      case "ObjectSingleClicked": {
        console.log('334 GoJSApp :', e.subject.part.data);
        this.setState(
          produce((draft: AppState) => {
          })
        )
        console.log('366 GoJSApp :', this.state);

      }
        break;
      case "PartResized": {
        const sel = e.subject.part.data;
        console.log('439 PartResized', sel);
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
        const selection = e.subject;
        this.setState(
          produce((draft: AppState) => {
            const it = selection.iterator;
            while (it.next()) {
              const selected = it.value.data;
              console.log('465 ClipboardPasted', selected);
              // First handle the objects
              if (selected.class === 'goObjectNode') {
                const node = selected;
                const objview = uic.createObject(node, context);
                if (objview) {
                  const gqlNode = new gql.gqlObjectView(objview);
                  modifiedNodes.push(gqlNode);
                  const gqlObj = new gql.gqlObject(objview.object);
                  modifiedObjects.push(gqlObj);
                }
              }
            }
            const it1 = selection.iterator;
            while (it1.next()) {
              // Then handle the relationships
              const selected = it1.value.data;
              if (selected.class === 'goRelshipLink') {
                const link = selected;
                const relview = uic.createRelationship(link, context);
                if (relview) {
                  const gqlLink = new gql.gqlRelshipView(relview);
                  modifiedLinks.push(gqlLink);
                  const gqlRelship = new gql.gqlRelationship(relview.relship);
                  modifiedRelships.push(gqlRelship);
                }
              }
            }
            // // If groups are involved, handle the group content
            // const groupsToPaste = new Array();
            // let i = 0;
            // let it1 = selection.iterator;
            // while (it1.next()) {
            //     // Identify groups in the selection
            //     let selected = it1.value.data;
            //     console.log('471 onClipboardPasted', selected);
            //     if (selected.class === 'goObjectNode') {
            //         let node = selected;
            //         if (node.isGroup) {
            //             groupsToPaste[i] = node;
            //             // groupsToPaste[i] = node.data;
            //             // groupsToPaste[i].node = node;
            //             // groupsToPaste[i].key = node.data.key;
            //             // groupsToPaste[i].objectview = node.data.objectview;
            //             groupsToPaste[i].members = new Array();
            //         }
            //     }
            //     i++;
            // }



          })
        )
      }
        break;
      case 'LinkDrawn': {
        const link = e.subject;
        const fromNode = link.fromNode?.data;
        const toNode = link.toNode?.data;
        this.setState(
          produce((draft: AppState) => {
            if (fromNode?.class === 'goObjectNode') {
              const relview = uic.createRelationship(link.data, context);
              if (relview) {
                const gqlLink = new gql.gqlRelshipView(relview);
                console.log('414 LinkDrawn', link, gqlLink);
                modifiedLinks.push(gqlLink);
                const gqlRelship = new gql.gqlRelationship(relview.relship);
                console.log('476 LinkDrawn', gqlRelship);
                modifiedRelships.push(gqlRelship);
              }
            } else if (fromNode?.class === 'goObjectTypeNode') {
              link.category = 'Relationship type';
              link.class = 'goRelshipTypeLink';
              const reltype = uic.createRelationshipType(link.data, context);
              if (reltype) {
                const gqlLink = new gql.gqlRelationshipType(reltype);
                modifiedTypeLinks.push(gqlLink);
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

    console.log('502 modifiedNodes', modifiedNodes);
    modifiedNodes.map(mn => {
      let data = mn
      this.props?.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
    })

    console.log('520 modifiedTypeNodes', modifiedTypeNodes);
    modifiedTypeNodes?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data })
    })

    console.log('520 modifiedTypeViews', modifiedTypeViews);
    modifiedTypeViews?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data })
    })

    console.log('520 modifiedTypeGeos', modifiedTypeGeos);
    modifiedTypeGeos?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_OBJECTTYPEGEO_PROPERTIES', data })
    })

    console.log('526 modifiedLinks', modifiedLinks);
    modifiedLinks.map(mn => {
      let data = mn
      this.props?.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
    })

    console.log('532 modifiedLinkTypes', modifiedLinkTypes);
    modifiedLinkTypes?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
    })

    console.log('532 modifiedLinkTypeViews', modifiedLinkTypeViews);
    modifiedLinkTypeViews?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
    })

    console.log('538 modifiedObjects', modifiedObjects);
    modifiedObjects?.map(mn => {
      let data = (mn) && mn
      this.props?.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
    })

    console.log('544 modifiedRelships', modifiedRelships);
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

    console.log('638 GOJSApp this.state.nodeDataArray', this.state.nodeDataArray);
    // console.log('361 this.state.linkDataArray', this.state.linkDataArray);
    // console.log('362 this.state.myMetis', this.state.myMetis);
    // console.log('362 this.state.myGoModel', this.state.myGoModel);
    // console.log('558 this.context', this.context);

    return (
      <div className="diagramwrapper">

        <DiagramWrapper
          nodeDataArray={this.state.nodeDataArray}
          linkDataArray={this.state.linkDataArray}
          modelData={this.state.modelData}
          skipsDiagramUpdate={this.state.skipsDiagramUpdate}
          onDiagramEvent={this.handleDiagramEvent}
          onModelChange={this.handleModelChange}
          myMetis={this.state.myMetis}
          myGoModel={this.state.myGoModel}
          myGoMetamodel={this.state.myGoMetamodel}
          dispatch={this.state.dispatch}
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
