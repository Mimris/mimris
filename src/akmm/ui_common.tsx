// @ts-nocheck

import * as utils from './utilities';
import * as akm from './metamodeller';
import * as gjs from './ui_gojs';
import * as gql from './ui_graphql';
//import { ButtonGroupProps } from 'reactstrap';
const constants = require('./constants');
//import { render } from 'react-dom';

//import * as go from 'gojs';

export function createObject(data: any, context: any): akm.cxObjectView | null {
    if (data === null) {
        return null;
    } else {
        let objview: akm.cxObjectView;
        data.key = utils.createGuid();
        data.category = constants.C_OBJECT;
        data.class = "goObjectNode";
        const myMetis = context.myMetis;
        const myModel = context.myModel;
        const myModelview = context.myModelview;
        const myGoModel = context.myGoModel;
        const myDiagram = context.myDiagram;
        console.log('120 createObject', data);
        const otypeId = data.objecttype?.id;
        const objtype = myMetis.findObjectType(otypeId);
        console.log('123 createObject', objtype);
        let guid = utils.createGuid();
        let obj = new akm.cxObject(guid, data.name, objtype, data.description);
        if (obj) {
            data.object = obj;
            // Include the new object in the current model
            myModel?.addObject(obj);
            myMetis.addObject(obj);
            console.log('131 createObject', obj, myModel);
            // Create the corresponding object view
            objview = new akm.cxObjectView(utils.createGuid(), obj.getName(), obj, "");
            if (objview) {
                data.objectview = objview;
                objview.setIsGroup(objtype.isContainer());
                objview.setLoc(data.loc);
                objview.setSize(data.size);
                // Include the object view in the current model view
                myModelview.addObjectView(objview);
                myMetis.addObjectView(objview);
                // Then update the node with its new properties
                // First set category and name
                myDiagram.model.setDataProperty(data, "category", constants.C_OBJECT);
                myDiagram.model.setDataProperty(data, "type", data.name);
                // Then set reference to the object view                        
                myDiagram.model.setDataProperty(data, "objectview", objview);
                // Then set the view properties
                // Get the object typeview
                let objtypeView = objtype.getDefaultTypeView();
                if (!objtypeView) {
                    objtypeView = new akm.cxObjectTypeView(utils.createGuid(), objtype.getName(), objtype, "");
                }
                if (objtypeView) {
                    objtypeView.setIsGroup1(data.isGroup);
                    objview.setTypeView(objtypeView);
                    let node = new gjs.goObjectNode(data.key, objview);
                    myGoModel.addNode(node);
                    updateNode(node, objtypeView, myDiagram);
                    node.loc = data.loc;
                    node.size = data.size;
                    console.log('162 uic', myGoModel);
                    return objview;
                }
            }
            // if (objview) {
            //     const newNode = new gql.gqlObjectView(objview);
            //     modifiedNodes.push(newNode);
            // }
        }
    }
    return null;
}

export function createObjectType(data: any, context: any): any {
    const myMetamodel = context.myMetamodel;
    const myMetis     = context.myMetis;
    const myGoModel   = context.myGoMetamodel;
    const myDiagram   = context.myDiagram;
    if (data.category === constants.gojs.C_OBJECTTYPE) {
        data.class = "goObjectTypeNode";
        const typeid   = data.type;
        let typename = data.name;
        let objtype;
        if (typeid === constants.types.OBJECTTYPE_ID)  {
            if ((typename !== constants.types.OBJECTTYPE_NAME) || (typename !== constants.types.CONTAINERTYPE_NAME)) {
                // Metamodeling and existing type
                objtype = myMetamodel.findObjectTypeByName(typename);
                if (objtype) {
                    console.log('180 createObjectType - type exists', objtype);
                    let objtypeView = objtype.getDefaultTypeView();
                    if (!objtypeView) {
                        objtypeView = new akm.cxObjectTypeView(utils.createGuid(), objtype.getName(), objtype, "");
                        objtypeView.setModified();
                        objtype.setDefaultTypeView(objtypeView);
                        objtype.setModified();
                        myMetamodel.setModified();
                        myMetamodel.addObjectTypeView(objtypeView);
                        myMetis.addObjectTypeView(objtypeView);
                    }
                    // Configure the node
                    myDiagram.model.setDataProperty(data, "category", constants.gojs.C_OBJECTTYPE);
                    myDiagram.model.setDataProperty(data, "objecttype", objtype);
                    updateNode(data, objtypeView, myDiagram);                       
                }
                else {
                    // Create type
                    typename = "New Type";
                    if (data.viewkind === constants.viewkinds.CONT)
                        typename = "New Container";
                    objtype = new akm.cxObjectType(utils.createGuid(), typename, "");
                    if (objtype) {
                        objtype.setModified();
                        objtype.setViewKind(data.viewkind);
                        myMetamodel.addObjectType(objtype);
                        myMetamodel.setModified();
                        myMetis.addObjectType(objtype);
                        // Define the object typeview
                        let objtypeView = new akm.cxObjectTypeView(utils.createGuid(), objtype.getName(), objtype, "");
                        if (objtypeView) {
                            objtypeView.setModified();
                            objtypeView.setViewKind(data.viewkind);
                            let viewdata = objtypeView.getData();
                            for (let prop in viewdata) {
                                if (prop === "icon") continue;
                                if (prop === "isGroup") continue;
                                if (prop === "group") continue;
                                viewdata[prop] = data[prop];                            
                            }
                            if (!myMetamodel.objtypegeos) 
                                myMetamodel.objtypegeos = new Array();
                            let objtypegeo = myMetamodel.findObjtypeGeoByType(objtype);
                            if (!objtypegeo) {
                                objtypegeo = new akm.cxObjtypeGeo(utils.createGuid(), myMetamodel, objtype, data.loc, data.size);
                                myMetamodel.objtypegeos.push(objtypegeo);
                            }
                            objtype.setDefaultTypeView(objtypeView);
                            myMetamodel.addObjectTypeView(objtypeView);
                            myMetamodel.setModified();
                            myMetis.addObjectTypeView(objtypeView);
                            // Update the node accordingly
                            myDiagram.model.setDataProperty(data, "category", constants.gojs.C_OBJECTTYPE);
                            myDiagram.model.setDataProperty(data, "objecttype", objtype);
                            myDiagram.model.setDataProperty(data, "name", typename);
                            let node = new gjs.goObjectTypeNode(data.key, objtype);
                            myGoModel.addNode(node);
                            updateNode(data, objtypeView, myDiagram);  
                            console.log('177 createObjectType ', myGoModel);                                                          
                        }
                    }
                }
            }
            return objtype;
        }
        // if (objtype) {
        //     const modNode = new gql.gqlObjectType(objtype, true);
        //     modifiedTypeNodes.push(modNode);
        // }
    } 
}

export function updateObject(data: any, name: string, value: string, context: any) {
    if ((data === null) || (name !== "name") || (!data.object)) {
        return;
    } else {
        const metis           = context.myMetis;
        const myModel         = context.myModel;
        const myModelView     = context.myModelView;
        const myDiagram       = context.myDiagram;
        let currentObject     = data.object;
        let currentObjectView = data.objectview;
        let otype             = data.objecttype;
        if (currentObject.getName() === otype.getName()) {
            // This is a new object - check if the new name already exists
            let obj = metis.findObjectByTypeAndName(otype, data.name);
            if (obj) {
                // Existing object
                utils.removeElementFromArray(myModel.getObjects(), currentObject.getId());
                currentObject = obj;
                currentObjectView.setObject(currentObject);
                myModelView.addObjectView(currentObjectView);
            } 
        }
        currentObject.setName(value);
        currentObject.setModified();
        currentObjectView.setName(value);
        currentObjectView.setModified();
        myDiagram.model.setDataProperty(data, "name", value);

        // const modNode = new gql.gqlObjectView(myNode.objectview);
        // modifiedNodes.push(modNode);
    }
}

export function updateObjectType(data: any, name: string, value: string, context: any) {
    if ((data === null) || (name !== "name")) {
        return;
    }  else {
        const metis = context.myMetis;
        const myMetamodel = context.myMetamodel;
        // Check if this is a type change
        let objtype = data.objtype;            
        const typename = data.name;
        if (objtype) {
            if  (
                (objtype.getName() === "New Type") 
                ||
                (objtype.getName() === "New Container") 
                ) {
                // This is a new type that gets a new name 
                // Check if the new name already exists
                let otype = metis.findObjectTypeByName(typename);
                if (otype) {
                    // Existing type - the new name already exists
                    let typeid = objtype.getId();
                    objtype = otype;
                    utils.removeElementFromArray(myMetamodel.getObjectTypes(), typeid);
                    myMetamodel.addObjectType(objtype);
                    utils.removeElementFromArray(metis.getObjectTypes(), typeid);
                    metis.addObjectType(objtype);
                } else {
                    objtype.setName(typename);
                    objtype.setModified();
                    myMetamodel.setModified();
                }
            } else {
                // This is an existing type that gets a new name
                objtype.setName(typename);
                objtype.setModified();
                myMetamodel.setModified();
            }
            // Get object typeview
            let objtypeView = objtype.getDefaultTypeView();
            if (!objtypeView) {
                objtypeView = new akm.cxObjectTypeView(utils.createGuid(), typename, objtype, "");
                objtypeView.setModified();
                objtype.setDefaultTypeView(objtypeView);
                objtype.setModified();
                myMetamodel.setModified();
                myMetamodel.addObjectTypeView(objtypeView);
                metis.addObjectTypeView(objtypeView);
            } else {
                objtype.setName(typename);
                objtype.setModified();
                myMetamodel.setModified();
                objtypeView.setName(typename);
                objtypeView.setModified();
            }                
            context.myDiagram.model.setDataProperty(data, "name", value);
            // const modNode = new gql.gqlObjectType(myNode.objtype, true);
            // modifiedTypeNodes.push(modNode);
}
    }
}

export function setObjectType(data: any, typename: string, context: any) {
    const myMetis     = context.myMetis;
    // const myMetamodel = context.myMetamodel;
    // const myModel     = context.myModel;
    // const myModelView = context.myModelView;
    const myDiagram   = context.myDiagram;
    const objtype = myMetis.findObjectTypeByName(typename);
    if (data.objecttype?.name === typename) {
        // No type change - do nothing
        alert('The object type is unchanged');
    } else if (!objtype) {
        // Non-existent type 
        alert('The object type given does not exist');
        // Do nothing
    } else {
        const currentObject = myMetis.findObject(data.object?.id);
        const objtypeview = myMetis.findObjectTypeView(objtype.typeviewRef);
        if (currentObject) {
            currentObject.setType(objtype);
            currentObject.setName(typename);
            currentObject.setModified();
            const currentObjectView = myMetis.findObjectView(data.objectview?.id);
            if (currentObjectView) {
                currentObjectView.setTypeView(objtypeview);
                currentObjectView.setName(typename);
                currentObjectView.setModified();
                myDiagram.model.setDataProperty(data, "typename", typename);
                updateNode(data, objtypeview, myDiagram);
            }
        }
    }
}

export function deleteObjectType(data: any, context: any) {
    
}

export function deleteNode(data: any, deletedFlag: boolean, deletedNodes: any, context: any) {
    const myMetis     = context.myMetis;
    const myMetamodel = context.myMetamodel;
    if (data.category === constants.gojs.C_OBJECTTYPE) {
        const myGoMetamodel = context.myGoMetamodel;
        let node = myGoMetamodel?.findNode(data.key) as gjs.goObjectNode;
        if (node) {
            //let typeid = data.objecttype;
            let typename = data.name;
            let objtype = myMetamodel.findObjectTypeByName(typename);
            if (objtype) {
                objtype.deleted = deletedFlag;
                let objtypeview = objtype.getDefaultTypeView();
                if (objtypeview) {
                    objtypeview.deleted = deletedFlag;
                }
                // Register change in gql
                const delNode = new gql.gqlObjectType(objtype, false);
                deletedNodes.push(delNode); // Correct ????

                // Replace myGoModel.nodes with a new array
                let nodes = new Array();
                if (myGoMetamodel) {
                    for (let i = 0; i < myGoMetamodel.nodes?.length; i++) {
                        let n = myGoMetamodel.nodes[i];
                        if (n.key !== node.key) {
                            nodes.push(n);
                        }
                    }
                    myGoMetamodel.nodes = nodes;
                }
            }
        }
    } else 
    if (data.category === constants.gojs.C_OBJECT) {
        const myGoModel = context.myGoModel;
        let node = myGoModel?.findNode(data.key) as gjs.goObjectNode;
        if (node) {
            let objview = node.objectview;
            if (objview) {
                objview.deleted = deletedFlag;
                if (!context.deleteViewsOnly) {
                    const object = objview.object;
                    if (object) {
                        object.deletedFlag = true;
                        // Find other views of the same object
                        const oviews = myMetis.getObjectViewsByObject(object.id);
                        if (oviews) {
                            for (let i = 0; i < oviews.length; i++) {
                                const oview = oviews[i];
                                oview.deleted = deletedFlag;
                                // Register change in gql
                                const delNode = new gql.gqlObjectView(oview);
                                deletedNodes.push(delNode);
                            }
                        }                                   
                    }
                }
                // Register change in gql
                const delNode = new gql.gqlObjectView(objview);
                deletedNodes.push(delNode);
            }
            // Replace myGoModel.nodes with a new array
            let nodes = new Array();
            if (myGoModel) {
                for (let i = 0; i < myGoModel.nodes?.length; i++) {
                    let n = myGoModel.nodes[i];
                    if (n.key !== node.key) {
                        nodes.push(n);
                    }
                }
                myGoModel.nodes = nodes;
            }
        }
    }
}

export function deleteLink(data: any, deletedFlag: boolean, deletedLinks: any[], context: any) {
    //const myMetamodel = context.myMetamodel;
    const myMetis     = context.myMetis;
    const myGoModel   = context.myGoMetamodel;
    //const myDiagram   = context.myDiagram;

    const link = myGoModel?.findLink(data.key);
    if (link) {
      const relview = link.relshipview;
      if (relview) {
        const relship = relview.relship;

        if (relship) {
          const rviews = myMetis?.getRelationshipViewsByRelship(relship.id);
          if (rviews) {
            for (let i = 0; i < rviews.length; i++) {
              const rview = rviews[i];
              rview.deleted = deletedFlag;
            }
          }
          relview.deleted = deletedFlag;
          relship.deleted = deletedFlag;
          const delLink = new gql.gqlRelshipView(relview);
          deletedLinks.push(delLink);
        }
        let links = new Array();
        for (let i = 0; i < myGoModel?.links.length; i++) {
          let l = myGoModel.links[i];
          if (l.key !== link.key) {
            links.push(l);
          }
        }
        myGoModel.links = links;
      }
    }

}

export function changeNodeSizeAndPos(sel: gjs.goObjectNode,
    goModel: gjs.goModel,
    nodes: any[]) {
    if (sel.class === "goObjectNode") {
        let node = goModel?.findNode(sel.key);
        if (node) {
            node.loc = sel.loc;
            node.size = sel.size;
            const objview = node.objectview;
            if (objview) {
                objview.loc = sel.loc;
                objview.size = sel.size;
                const modNode = new gql.gqlObjectView(objview);
                nodes.push(modNode);
            }
        }
        // console.log('176 GoJsApp resized nodes :', nodes);
    }
}

// Callback function initiated when a node is pasted
export function onClipboardPasted(selection: any) {
    // Check if there is a group involved
    const groupsToPaste = new Array();
    let i = 0;
    let it = selection.iterator;
    while (it.next()) {
        // Identify groups in the selection
        let selected = it.value;
        if (selected.class === 'goObjectNode') {
            let node = selected;
            if (node.data.isGroup) {
                groupsToPaste[i] = node.data;
                groupsToPaste[i].node = node;
                groupsToPaste[i].key = node.data.key;
                groupsToPaste[i].objectview = node.data.objectview;
                groupsToPaste[i].members = new Array();
            }
        }
        i++;
    }
    let len = groupsToPaste.length;

    let it2 = selection.iterator;
    while (it2.next()) {
        // Identify group members in the selection
        for (i = 0; i < len; i++) {
            let selected = it.value;
            let group = groupsToPaste[i].key;
            if (selected.class === 'goObjectNode') {
                let node = selected;
                if (node.data.group !== undefined) {
                    let grp = node.data.group;  // key
                    if (grp === group) {
                        groupsToPaste[i].members.push(node.data.objectview);
                    }
                    console.log(groupsToPaste);
                }
            }
        }
    }
}

// Function to connect node object to group object
export function getGroupByLocation(model: gjs.goModel, loc: string): gjs.goObjectNode | null {
    const nodes = model.nodes;
    
    const groups = new Array();
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i] as gjs.goObjectNode;
        if (node.isGroup) {
            const nodeLoc = loc.split(" ");
            const grpLoc = node.loc.split(" ");
            const grpSize = node.size.split(" ");
            const nx = parseInt(nodeLoc[0]);
            const ny = parseInt(nodeLoc[1]);
            const gx = parseInt(grpLoc[0]);
            const gy = parseInt(grpLoc[1]);
            const gw = parseInt(grpSize[0]);
            const gh = parseInt(grpSize[1]);
            const size = Math.sqrt(gw * gw + gh * gh);
            if (
                (nx > gx) && (nx < gx + gw) &&
                (ny > gy) && (ny < gy + gh)
            ) {
                let grp = {"node": node, "size": size};
                console.log('285 group', grp);
                groups.push(grp);
            }
        }
    }
    console.log('290 groups', groups);
    if (groups.length > 0) {
        let group = groups[0].node;
        let size  = groups[0].size;
        for (let i=0; i<groups.length; i++) {
            const s = groups[i].size;
            if (s < size) {
                group = groups[i].node; 
            } 
        }
        return group;
    } else
        return null;
}

export function connectNodeToGroup(node: gjs.goObjectNode, groupNode: gjs.goObjectNode, context: any) {
    const myMetis = context.myMetis;
    const myModel = context.myModel;
    if (node && groupNode) {
        node.group = groupNode.key;
        let nodeObj = node.object;
        let groupObj = groupNode.object;
        let nodeObjview = node.objectview;
        let groupObjview = groupNode.objectview;
        if (nodeObjview && groupObjview) {
            nodeObjview.setGroup(groupObjview?.getId());
            // Find relationship type
            let groupType = groupObj?.getType();
            let childType = nodeObj?.getType();
            if (groupType) {
                let reltype = groupType.findRelshipTypeByKind(constants.RELKINDS.COMP, childType);
                if (reltype) {
                    // Check if relship already exists
                    let rel = myModel.findRelationship1(groupObj, nodeObj, reltype);
                    if (!rel) {
                        rel = new akm.cxRelationship(utils.createGuid(), reltype, groupObj, nodeObj, reltype.getName(), "");
                        if (rel) {
                            rel.setModified();
                            myModel.addRelationship(rel);
                            myMetis.addRelationship(rel);
                        }
                    }
                } else if (childType) {
                    let reltype = groupType.findRelshipTypeByKind(constants.RELKINDS.AGGR, childType);
                    if (reltype) {
                        let rel = new akm.cxRelationship(utils.createGuid(), reltype, groupObj, nodeObj, reltype.getName(), "");
                        if (rel) {
                            rel.setModified();
                            myModel.addRelationship(rel);
                            myMetis.addRelationship(rel);
                        }
                    }
                }
            }
        }
    }
}

export function disconnectNodeFromGroup(node: gjs.goObjectNode, groupNode: gjs.goObjectNode, context: any) {
    const myModel = context.myModel;
    if (!groupNode) {
        let nodeObj = node.object;
        if (nodeObj) {
            let nodeObjview = node.objectview;
            if (nodeObjview) {
                nodeObjview.setGroup("");
                let rels = nodeObj.findInputRelships(myModel, constants.RELKINDS.COMP);
                if (rels) {
                    for (let i = 0; i < rels.length; i++) {
                        let rel = rels[i];
                        if (rel) {
                            let fromObj = rel.getFromObject();
                            if (fromObj.getType().getViewKind() === constants.VIEWKINDS.CONT) {
                                rel.setModified();
                                rel.setDeleted(true);
                            }
                        }
                    }
                }
            }
        }
    }
}

// functions to handle links
export function updateRelationship(data: any, name: string, value: string, context: any) {
    console.log('542 updateRelationship', name, data);
    if ((data === null) || (!data.relship)) {
        return;
    } else {
        // const metis            = context.myMetis;
        // const myModel          = context.myModel;
        // const myModelView      = context.myModelView;
        const myDiagram        = context.myDiagram;
        let currentRelship     = data.relship;
        let currentRelshipView = data.relshipview;
        // let rtype              = data.relshiptype;
        // if (currentRelship.getName() === rtype.getName()) {
        //     // This is a new relship - check if the new name already exists
        //     let reltype = metis.findRelationshipTypeByName(data.name);
        //     if (reltype) {
        //         // Existing relship
        //         utils.removeElementFromArray(myModel.getRelationships(), currentRelship.getId());
        //         currentRelship = rel;
        //         currentRelshipView.setRelationship(currentRelship);
        //         myModelView.addTelationshView(currentRelshipView);
        //     } 
        // }
        currentRelship.setName(value);
        currentRelship.setModified();
        currentRelshipView.setName(value);
        currentRelshipView.setModified();
        myDiagram.model.setDataProperty(data, "name", value);
    }
}

export function updateRelationshipType(data: any, name: string, value: string, context: any) {
    if ((data === null) || (name !== "name")) {
        return;
    }  else {
        const metis = context.myMetis;
        const myMetamodel = context.myMetamodel;
        const myDiagram   = context.myDiagram;
        const typename = data.name;
        // Check if this is a type change
        let reltype = metis.findRelationshipType(data.relshiptype.id);            
        if (reltype) {
            if  (
                (reltype.name === "New Type") 
                ) {
                // This is a new type that gets a new name 
                // Check if the new name already exists
                let rtype = metis.findRelationshipTypeByName(typename);
                if (rtype) {
                    // Existing type - the new name already exists
                    let typeid = reltype.getId();
                    reltype = rtype;
                    utils.removeElementFromArray(myMetamodel.getRelationshipTypes(), typeid);
                    myMetamodel.addRelationshipType(reltype);
                    utils.removeElementFromArray(metis.getRelationshipTypes(), typeid);
                    metis.addRelationshipType(reltype);
                } else {
                    reltype.setName(typename);
                    reltype.setModified();
                    myMetamodel.setModified();
                }
            } else {
                // This is an existing type that gets a new name
                reltype.setName(typename);
                reltype.setModified();
                myMetamodel.setModified();
            }
            // Get relationship typeview
            let reltypeView = reltype.getDefaultTypeView();
            if (!reltypeView) {
                reltypeView = new akm.cxRelationshipTypeView(utils.createGuid(), typename, reltype, "");
                reltypeView.setModified();
                reltype.setDefaultTypeView(reltypeView);
                reltype.setModified();
                myMetamodel.setModified();
                myMetamodel.addObjectTypeView(reltypeView);
                metis.addObjectTypeView(reltypeView);
            } else {
                reltype.setName(typename);
                reltype.setModified();
                myMetamodel.setModified();
                reltypeView.setName(typename);
                reltypeView.setModified();
            }                
            myDiagram.model.setDataProperty(data, "name", value);
        }
    }
}

export function setRelationshipType(data: any, typename: string, context: any) {
    const myMetis     = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const myModel     = context.myModel;
    const myModelView = context.myModelView;
    const myDiagram   = context.myDiagram;

    let rtype = myMetis.findRelationshipTypeByName(typename);
    if (!rtype) {
        // Non-existent type 
        alert('The relationship given does not exist');
        // Do nothing
    } else {
        const reltype = myMetis.findRelationshipTypeByName(typename);
        if (reltype) {
            const reltypeview = reltype.getDefaultTypeView();
            const currentRelship = myMetis.findRelationship(data.relship.id);
            if (currentRelship) {
                const nameIsChanged = (currentRelship.name !== currentRelship.type.name);
                currentRelship.setType(reltype);
                currentRelship.setName(typename);
                currentRelship.setModified();
                const currentRelshipView = myMetis.findRelationshipView(data.relshipview.id);
                if (currentRelshipView) {
                    currentRelshipView.setTypeView(reltypeview);
                    currentRelshipView.setName(typename);
                    currentRelshipView.setModified();
                    currentRelshipView.setRelationship(currentRelship);
                    if (!nameIsChanged)
                        myDiagram.model.setDataProperty(data, "name", typename);
                    data.relshiptype = reltype;
                    updateLink(data, reltypeview, myDiagram);
                }
            }
        }
    }

}

export function onLinkDrawn(e: go.DiagramEvent, context: any): any {
    const myGoModel = context.myGoModel;
    //const myGoMetamodel = context.myGoMetamodel;
    const diagram = context.myDiagram;
    const myMetis = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const link = e.self;
    const data = link.data;
console.log('645 LinkDrawn', e.subject);
    if (data.category === 'Relationship') {
        //link.data.key = utils.createGuid();
        let fromNode = myGoModel.findNode(link.data.from);
        if (!fromNode)
            return;
        let toNode = myGoModel.findNode(link.data.to);
        if (!toNode)
            return;
        let typename = 'isRelatedTo' as string | null;
        let reltype;
        reltype = myMetamodel.findRelationshipTypeByName(typename);
        if (!reltype) {
            const fromType = fromNode.objecttype;
            const toType   = toNode.objecttype;
            const choices  = [];
            if (fromType && toType) {
                const reltypes = myMetis.findRelationshipTypesBetweenTypes(fromType, toType);
                if (reltypes) {
                    for (let i=0; i<reltypes.length; i++) {
                        const reltype = reltypes[i];
                        choices.push(reltype.name);  
                    }
                }
            }
            console.log('658 onLinkDrawn', choices);
            typename = prompt('Enter type name, one of ' + choices);
            reltype = myMetamodel.findRelationshipTypeByName(typename);
        }
        if (!reltype) {
            alert("Relationship type given does not exist!")
            diagram.model.removeLinkData(data);
            return;
        }
        console.log('714 onLinkDrawn', reltype);
        if (!isLinkAllowed(reltype, fromNode.object, toNode.object)) {
            alert("Relationship given is not allowed!");
            diagram.model.removeLinkData(data);
            return;
        }
        //alert("Relationship given IS allowed!");
        const reltypeview = reltype.getDefaultTypeView();
        diagram.model.setDataProperty(data, "name", typename);
        const relshipview = createLink(link.data, context);
        relshipview.setTypeView(reltypeview);
        console.log('725 myGoModel', myGoModel);
        diagram.requestUpdate();
        // const modLink = new gql.gqlRelshipView(relshipview);
        // modifiedLinks.push(modLink);
        return relshipview;
    }
    else if (data.category === constants.gojs.C_RELSHIPTYPE) {
        data.key = utils.createGuid();
        diagram.model.setDataProperty(data, "name", prompt("Enter type name:", "typename"));
        console.log('732 onLinkDrawn', data);
        if (data.name == null) {
            diagram.model.removeLinkData(data); 
            return;
        }
        diagram.model.setDataProperty(data, "category", constants.gojs.C_RELSHIPTYPE);
        let typename = data.name;
        if (typename) {
            let fromNode = link.data.from;
            let toNode   = link.data.to;
            let fromObjType = myMetamodel.findObjectTypeByName(fromNode.name);
            let toObjType   = myMetamodel.findObjectTypeByName(toNode.name);
            console.log('744 onLinkDrawn', fromNode, toNode);
            if (fromObjType && toObjType) {
                let reltype   = myMetis.findRelationshipTypeByName(typename);
                if (reltype) {                    
                    console.log('748 onLinkDrawn', reltype);
                    // Existing type - create a copy
                    let relkind = reltype.getRelshipKind();
                    let reltype2 = new akm.cxRelationshipType(utils.createGuid(), reltype.getName(), fromObjType, toObjType, "");
                    reltype2.setModified();
                    reltype2.setRelshipKind(relkind);
                    diagram.model.setDataProperty(data, "reltype", reltype2);
                    diagram.model.setDataProperty(data, "category", constants.gojs.C_RELSHIPTYPE);
                    myMetamodel.addRelationshipType(reltype2);
                    myMetis.addRelationshipType(reltype2);
                    let reltypeView = reltype.getDefaultTypeView();
                    if (reltypeView) {
                        // Copy reltypeview
                        let reltypeView2 = new akm.cxRelationshipTypeView(utils.createGuid(), reltype2.getName(), reltype2, "");
                        reltypeView2.setModified();
                        reltypeView2.setRelshipKind(relkind);
                        diagram.model.setDataProperty(data, "typeview", reltypeView2);
                        let viewdata = reltypeView.getData();
                        let viewdata2 = reltypeView2.getData();
                        for (let prop in viewdata) {
                            viewdata2[prop] = viewdata[prop];                            
                        }
                        reltype2.setDefaultTypeView(reltypeView2);
                        myMetamodel.addRelationshipTypeView(reltypeView2);
                        myMetis.addRelationshipTypeView(reltypeView2);
                        updateLink(data, reltypeView2, diagram);
                        diagram.requestUpdate();
                    }
                } else {
                    // New relationship type - create it
                    console.log('778 onLinkDrawn', reltype);
                    let typeid = utils.createGuid();
                    reltype = new akm.cxRelationshipType(typeid, data.name, null, null, "");
                    if (reltype) {
                        console.log('782 onLinkDrawn', reltype);
                        diagram.model.setDataProperty(data, "reltype", reltype);
                        diagram.model.setDataProperty(data, "category", constants.gojs.C_RELSHIPTYPE);
                        reltype.setModified();
                        reltype.setFromObjtype(fromObjType);
                        reltype.setToObjtype(toObjType);
                        myMetamodel.addRelationshipType(reltype);
                        myMetis.addRelationshipType(reltype);
                        // Then create the default relationship typeview
                        const reltypeView = new akm.cxRelationshipTypeView(utils.createGuid(),reltype.getName(), reltype, "");   
                        if (reltypeView) {
                            reltypeView.setModified();
                            diagram.model.setDataProperty(data, "typeview", reltypeView);
                            reltype.setDefaultTypeView(reltypeView);
                            myMetamodel.addRelationshipTypeView(reltypeView);
                            myMetis.addRelationshipTypeView(reltypeView);
                            updateLink(data, reltypeView, diagram);
                            diagram.requestUpdate();
                            console.log('800 onLinkDrawn', myMetamodel);
                        }
                    }
                }
            }
        }
    }



    // } else if (data.category === 'Relationship type') {

    //     let fromNode = myGoMetamodel.findNode(link.data.from);
    //     if (!fromNode)
    //         return;
    //     let toNode = myGoMetamodel.findNode(link.data.to);
    //     if (!toNode)
    //         return;
    //     console.log('684 onLinkDrawn', fromNode, toNode);
    //     let typename = prompt('Enter type name');
    //     let reltype = myMetamodel.findRelationshipTypeByName(typename);
    //     if (!reltype) {
    //         reltype = new akm.cxRelationshipType(utils.createGuid(), typename, fromNode.objtype, toNode.objtype, "");
    //         if (reltype) {
    //             const newLink = new gjs.goRelshipTypeLink(utils.createGuid(), reltype);
    //             myMetis.addRelationshipType(reltype);
    //             myMetamodel.addRelationshipType(reltype);
    //             myGoMetamodel.addLink(newLink);
    //             diagram.model.setDataProperty(data, "name", typename);
    //             console.log('693 myGoMetamodel', reltype, newLink, myGoMetamodel);
    //             return reltype;
    //         }
    //     }
    // }

}

export function createLink(data: any, context: any): any {
    if (!data.key)
        data.key = utils.createGuid();
    const myMetis = context.myMetis;
    if (data.category === constants.gojs.C_RELSHIPTYPE) {
        let reltype = null;
        data.class  = "goRelshipTypeLink";
    } else if (data.category === constants.gojs.C_RELATIONSHIP) {    
        // Identify  type   
        let reltype = null;
        let relshipview;
        data.class = "goRelshipLink";
        reltype = myMetis.findRelationshipTypeByName(data.name);
        if (reltype && reltype.isInstantiable()) {
            // Create the relationship
            const myGoModel = context.myGoModel;
            let fromNode = myGoModel.findNode(data.from);
            let toNode = myGoModel.findNode(data.to);
            let fromObjView = fromNode?.objectview;
            let toObjView = toNode?.objectview;
            let fromObj = null;
            if (fromObjView) {
                fromObj = fromObjView.getObject();
            }
            let toObj = null;
            if (toObjView) {
                toObj = toObjView.getObject();
            }
            if (fromObj && toObj) {
                // Find relationship if it already exists
                const myModel = context.myModel;
                let relship = myModel.findRelationship1(fromObj, toObj, reltype);
                if (!relship) {
                    relship = new akm.cxRelationship(utils.createGuid(), reltype, fromObj, toObj, "", "");
                    if (relship) {
                        relship.setModified();
                        data.relship = relship;
                        relship.setName(reltype.getName());
                        myModel.addRelationship(relship);
                        myMetis.addRelationship(relship);
                    }
                }
                if (relship) {
                    let typeview = reltype.getDefaultTypeView();
                    relshipview = new akm.cxRelationshipView(utils.createGuid(), relship.getName(), relship, "");
                    if (relshipview) {
                        const myModelview = context.myModelview;
                        const diagram = context.myDiagram;
                        relshipview.setModified();
                        data.relshipview = relshipview;
                        relshipview.setName(relship.getName());
                        relshipview.setTypeView(typeview);
                        relshipview.setFromObjectView(fromObjView);
                        relshipview.setToObjectView(toObjView);
                        myModelview.addRelationshipView(relshipview);
                        myMetis.addRelationshipView(relshipview);
                        let linkData = buildLinkFromRelview(myGoModel, relshipview, relship, data, diagram);
                    }
                }
            }
        }
        return relshipview;
    }
    return;
}

export function onLinkRelinked(lnk: gjs.goRelshipLink, myGoModel: gjs.goModel) {
    if (lnk.class === 'goRelshipLink') {

        const link = myGoModel.findLink(lnk.key) as gjs.goRelshipLink;
        let relview = link.relshipview;    // cxRelationshipView
        let rel = relview.relship;    // cxRelationship                
        let fromNode = myGoModel.findNode(lnk.from);
        if (fromNode) {
            link.setFromNode = lnk.from;
            let fromObjView = fromNode.objectview;
            relview.fromObjview = fromObjView;
            rel.fromObject = fromObjView.object;
        }
        let toNode = myGoModel.findNode(lnk.to);
        if (toNode) {
            link.setToNode(lnk.to);
            let toObjView = toNode.objectview;
            relview.toObjview = toObjView;
            rel.toObject = toObjView.object;
        }
        relview.modified = true;;
        rel.modified = true;
    }
}

export function setRelshipType() {

}

// Local functions
function updateNode(data: any, objtypeView: akm.cxObjectTypeView, diagram: any) {
    if (objtypeView) {
        let viewdata: any = objtypeView.getData();
        let prop: string;
        for (prop in viewdata) {
            if (viewdata[prop] != null)
                diagram.model.setDataProperty(data, prop, viewdata[prop])
        }
        console.log('updateNode', data);
    }
}

function updateLink(data: any, reltypeView: akm.cxRelationshipTypeView, diagram: any) {
    if (reltypeView) {
        let viewdata: any = reltypeView.getData();
        let prop: string;
        for (prop in viewdata) {
            if (viewdata[prop] != null)
                diagram.model.setDataProperty(data, prop, viewdata[prop])
        }
        console.log(data);
    }
} 

function isLinkAllowed(reltype: akm.cxRelationshipType, fromObj: akm.cxObject, toObj: akm.cxObject) {
    if (reltype && fromObj && toObj) {
        let fromType = reltype.getFromObjType();
        let toType = reltype.getToObjType();
        if (fromObj.getType().inherits(fromType)) {
            if (toObj.getType().inherits(toType)) {
                return true;
            }
        }
    }
    return false;
}

function buildLinkFromRelview(model: gjs.goModel, relview: akm.cxRelationshipView, relship: akm.cxRelationship, data: any, diagram: any) {
    let reltype = relship.getType();
    let reltypeView = relview.getTypeView() as akm.cxRelationshipTypeView;
    if (!reltypeView) {
        reltypeView = reltype?.getDefaultTypeView() as akm.cxRelationshipTypeView;
    }
    if (reltypeView) {
        let link = new gjs.goRelshipLink(data.key, model, relview);
        model.addLink(link);
        updateLink(data, reltypeView, diagram);
        diagram.requestUpdate();
    }
    return data;
}
