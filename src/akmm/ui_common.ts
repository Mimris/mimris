// @ts-nocheck
const debug = false; 

import * as utils from './utilities';
import * as akm from './metamodeller';
import * as gjs from './ui_gojs';
import * as gql from './ui_graphql';
import { FaLessThan, FaNode } from 'react-icons/fa';
//import { ButtonGroupProps } from 'reactstrap';
const constants = require('./constants');
const printf = require('printf');

//import { render } from 'react-dom';

//import * as go from 'gojs';

export function createObject(data: any, context: any): akm.cxObjectView | null {
    if (data === null) {
        return null;
    } else {
        let objview: akm.cxObjectView;
        const myMetis = context.myMetis;
        const myModel = context.myModel;
        const myModelview = context.myModelview;
        const myGoModel = context.myGoModel;
        const myDiagram = context.myDiagram;
        if (debug) console.log('24 createObject', myModel.pasteViewsOnly, data);
        const otypeId = data.objecttype?.id;
        const objtype = myMetis.findObjectType(otypeId);
        if (!objtype)
            return null;
        if (debug) console.log('30 createObject', myMetis, data);
        let obj = data.object;
        if (debug) console.log('35 createObject', obj);
        if (myModel.pasteViewsOnly) {
            const pastedobj = myMetis.findObject(obj.id);
            if (!pastedobj) {
                // This is not a pasted object, create a new one
                let guid = obj.id;
                obj = new akm.cxObject(guid, data.name, objtype, data.description);
                myModel.pasteViewsOnly = false;
            } else 
                obj = pastedobj;
        } else {
            let guid = obj.id;
            obj = new akm.cxObject(utils.createGuid(), data.name, objtype, data.description);
        }
        if (debug) console.log('49 createObject', obj, myMetis);
        if (obj) {
            if (!myModel.pasteViewsOnly) {
                obj.objectviews = null;
                obj.inputrels   = null;
                obj.outputrels  = null;
            }
            data.object = obj;
            data.category = 'Object';
            myDiagram.model.setDataProperty(data, 'category', data.category);
            // Include the new object in the current model
            myModel?.addObject(obj);
            if (debug) console.log('55 createObject', obj, myModel, myMetis);
            myMetis.addObject(obj);
            // Create the corresponding object view
            objview = new akm.cxObjectView(utils.createGuid(), obj.name, obj, "");
            if (objview) {
                objview.setIsGroup(data.isGroup);
                objview.setLoc(data.loc);
                objview.setSize(data.size);
                data.objectview = objview;
                if (debug) console.log('47 createObject', data);
                // Include the object view in the current model view
                obj.addObjectView(objview);
                myModelview.addObjectView(objview);
                myMetis.addObjectView(objview);
                // Then update the node with its new properties
                // First set name and reference to the objectview
                myDiagram.model.setDataProperty(data, "type", data.name);
                myDiagram.model.setDataProperty(data, "objectview", objview);
                // Then set the view properties
                let objtypeView = objtype?.getDefaultTypeView();
                if (context.pasted) {
                    const id = data.typeview?.id;
                    objtypeView = myMetis.findObjectTypeView(id);
                }
                if (!objtypeView) {
                    const key = utils.createGuid();
                    objtypeView = new akm.cxObjectTypeView(key, key, objtype, "");
                }
                if (objtypeView) {
                    objview.setTypeView(objtypeView);
                    const node = new gjs.goObjectNode(data.key, objview);
                    if (debug) console.log('87 createObject', node, data);
                    updateNode(node, objtypeView, myDiagram);
                    node.loc      = data.loc;
                    node.size     = data.size;
                    node.isGroup  = data.isGroup;
                    myDiagram.model.setDataProperty(data, 'category', node.category);
                    const group = getGroupByLocation(myGoModel, objview.loc);
                    if (group) {
                        node.group = group.key;
                        objview.group = group.objectview.id;
                        myDiagram.model.setDataProperty(data, "group", node.group);
                        if (debug) console.log('97 group', group, node)
                    }
                    if (debug) console.log('99 group', group, objview);
                    myGoModel.addNode(node);
                    if (debug) console.log('101 createObject', myGoModel, myModel);
                    return objview;
                }
            }
        }
    }
    return null;
}

export function createMetaContainer(data: any, context: any): any {
    const myMetamodel = context.myMetamodel;
    const myMetis     = context.myMetis;
    const myGoModel   = context.myGoMetamodel;
    const myDiagram   = context.myDiagram;
    let cont;
    if (data.category === constants.gojs.C_CONTAINER) {
        if (debug) console.log('119 createMetaContainer', data);
        cont = new akm.cxMetaContainer(utils.createGuid(), data.name, "");
        myMetamodel.addMetaContainer(cont);
    }
    return cont;
}

export function createObjectType(data: any, context: any): any {
    const myMetamodel = context.myMetamodel;
    const myMetis     = context.myMetis;
    const myGoModel   = context.myGoMetamodel;
    const myDiagram   = context.myDiagram;
    if (data.category === constants.gojs.C_OBJECTTYPE) {
        if (debug) console.log('87 createObjectType', data);
        data.class = "goObjectTypeNode";
        const typeid   = data.type;
        let typename = data.name;
        let objtype;
        if (typeid === constants.types.OBJECTTYPE_ID)  {
            if ((typename !== constants.types.OBJECTTYPE_NAME) || (typename !== constants.types.CONTAINERTYPE_NAME)) {
                // Metamodeling and existing type
                objtype = myMetamodel.findObjectTypeByName(typename);
                if (objtype) {
                    // Existing type
                     let objtypeView = objtype.getDefaultTypeView();
                    if (!objtypeView) {
                        objtypeView = new akm.cxObjectTypeView(utils.createGuid(), objtype.name, objtype, "");
                        objtypeView.setModified();
                        objtype.setDefaultTypeView(objtypeView);
                        objtype.setModified();
                        myMetamodel.setModified();
                        myMetamodel.addObjectTypeView(objtypeView);
                        myMetis.addObjectTypeView(objtypeView);
                    }
                    const objtypeGeo = new akm.cxObjtypeGeo(utils.createGuid(), myMetamodel, objtype, data.loc, data.size);
                    if (objtypeGeo) {
                        myMetamodel.addObjtypeGeo(objtypeGeo);
                        myMetis.addObjtypeGeo(objtypeGeo);
                    }
                    // Configure the node
                    myDiagram.model.setDataProperty(data, "category", constants.gojs.C_OBJECTTYPE);
                    myDiagram.model.setDataProperty(data, "objecttype", objtype);
                    updateNode(data, objtypeView, myDiagram);                       
                }
                else {
                    // New type
                    let objtypename = constants.gojs.C_OBJECTTYPE;
                    typename = "New Type";;
                    if (data.viewkind === constants.viewkinds.CONT) {
                        typename = "New Container";
                    }
                    objtype = new akm.cxObjectType(utils.createGuid(), typename, "");
                    if (objtype) {
                        objtype.setModified();
                        objtype.setViewKind(data.viewkind);
                        myMetamodel.addObjectType(objtype);
                        myMetamodel.setModified();
                        myMetis.addObjectType(objtype);
                        // Define the object typeview
                        let objtypeView = new akm.cxObjectTypeView(utils.createGuid(), objtype.name, objtype, "");
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
                            myDiagram.model.setDataProperty(data, "typename", objtypename);
                            const key = utils.createGuid();
                            data.id = key;
                            let node = new gjs.goObjectTypeNode(key, objtype);
                            myGoModel.addNode(node);
                            updateNode(data, objtypeView, myDiagram);  
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
        const myMetis         = context.myMetis;
        const myModel         = context.myModel;
        const myModelView     = context.myModelView;
        const myDiagram       = context.myDiagram;
        let currentObject     = data.object;
        currentObject         = myMetis.findObject(currentObject.id);
        let currentObjectView = data.objectview;
        let otype             = data.objecttype;
        if (currentObject.name === otype?.name) {
            // This is a new object - check if the new name already exists
            const obj = myMetis.findObjectByTypeAndName(otype, data.name);
            if (obj) {
                // Existing object
                utils.removeElementFromArray(myModel.getObjects(), currentObject.getId());
                currentObject = obj;
                currentObjectView?.setObject(currentObject);
                myModelView?.addObjectView(currentObjectView);
            } 
        } else {
            const obj = myMetis.findObject(currentObject.id);
            if (obj) {
                currentObject = obj;
                currentObjectView = myMetis.findObjectView(currentObjectView.id);
            }
        }
        currentObject.setName(value);
        currentObject.setModified();
        currentObjectView.setName(value);
        currentObjectView.setModified();
        currentObject.addObjectView(currentObjectView);
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
                (objtype.name === "New Type") 
                ||
                (objtype.name === "New Container") 
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
            data.typeview = objtypeView;
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
        context.myDiagram.requestUpdate();
    }
}

export function setObjectType(data: any, objtype: akm.cxObjectType, context: any) {
    const myMetis     = context.myMetis;
    const myDiagram   = context.myDiagram;
    // data, i.e. node
    if (objtype) {
        const objtypeview = objtype.getDefaultTypeView();
        const currentObject = myMetis.findObject(data.object?.id);
        if (currentObject) {
            const nameIsChanged = (currentObject.name !== currentObject.type.name);
            currentObject.setType(objtype);
            currentObject.setModified();
            const currentObjectView = myMetis.findObjectView(data.objectview.id);
            if (currentObjectView) {
                currentObjectView.setTypeView(objtypeview);
                currentObjectView.setModified();
                currentObjectView.setObject(currentObject);
                if (!nameIsChanged) {
                    myDiagram.model.setDataProperty(data, "name", objtype.name);
                }
                data.object.type = objtype;
                data.objecttype = objtype;
                data.typename = objtype.name;
                data.typeview = objtypeview;
                // Clear local overrides
                currentObjectView['figure'] = "";
                currentObjectView['fillcolor'] = "";
                currentObjectView['strokecolor'] = "";
                currentObjectView['strokewidth'] = "";
                currentObjectView['icon'] = "";
                updateNode(data, objtypeview, myDiagram);
                if (!debug) console.log('372 node', data);
                // Dispatch
                const gqlObjview = new gql.gqlObjectView(currentObjectView);
                if (debug) console.log('378 gqlObjview', gqlObjview);
                const modifiedObjectViews = new Array();
                modifiedObjectViews.push(gqlObjview);
                modifiedObjectViews.map(mn => {
                  let data = mn;
                  myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
                })
            }
            const gqlObject = (currentObject) && new gql.gqlObject(currentObject);
            if (debug) console.log('359 gqlObject', gqlObject);
            const modifiedObjects = new Array();
            modifiedObjects.push(gqlObject);
            modifiedObjects.map(mn => {
              let data = mn;
              myDiagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
            })    
            return currentObjectView;
        }
    }
}

export function deleteObjectType(data: any, context: any) {
    
}

export function deleteRelationshipType(reltype: akm.cxRelationshipType, deletedFlag: boolean) {
    if (reltype) {
        // Check if relationships of this type exists
        reltype.deleted = deletedFlag;
    }

}

export function deleteNode(data: any, deletedFlag: boolean, deletedObjviews: any, deletedObjects: any, deletedLinks: any, deletedRelships: any, deletedTypeviews: any, context: any) {
    const myMetis     = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const myDiagram   = context.myDiagram;
    const selection   = myDiagram.selection;
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
        const node = myGoModel?.findNode(data.key) as gjs.goObjectNode;
        if (debug) console.log('398 delete node', node);
        if (node) {
            node.deleted = deletedFlag;
            const objview = node.objectview;
            objview.deleted = deletedFlag;
            const gqlObjview = new gql.gqlObjectView(objview);
            deletedObjviews.push(gqlObjview);
            if (debug) console.log('405 delete objview', objview);
            // If group, delete members of group
            if (node.isGroup) {
            const groupMembers = node.getGroupMembers(myGoModel);
                for (let i=0; i<groupMembers?.length; i++) {
                    const member = groupMembers[i];
                    deleteNode(member, deletedFlag, deletedObjviews, deletedObjects, deletedLinks, deletedRelships, deletedTypeviews, context);
                }
            }
            // Handle deleteViewsOnly
            if (myMetis.currentModel.deleteViewsOnly) {
                return;
            }
            // Else handle delete object AND object views
            // First delete object
            const object = node.object;
            if (object) {
                object.deleted = deletedFlag;          
                const gqlObj = new gql.gqlObject(object);
                deletedObjects.push(gqlObj);   
                if (debug) console.log('419 delete object', object);
            }         
            // Then handle all other object views of the deleted object
            const objviews = object?.objectviews;
            if (debug) console.log('429 selection', myDiagram.selection);
            if (debug) console.log('430 delete objviews', objviews);
            for (let i=0; i<objviews?.length; i++) {
                const objview = objviews[i];
                if (objview) {
                    objview.deleted = deletedFlag;
                    deleteObjectView(objview, deletedFlag, deletedObjviews, deletedObjects, deletedTypeviews, context);
                }
            }
            if (debug) console.log('438 nodes to delete', myDiagram.selection);
            myDiagram.requestUpdate();
            let connectedRels = object?.inputrels;
            if (debug) console.log('441 inputrels', connectedRels);
            for (let i=0; i<connectedRels?.length; i++) {
                const rel = connectedRels[i];
                if (rel.deleted !== deletedFlag) {
                    rel.deleted = deletedFlag;
                    if (debug) console.log('439 delete relship', rel);
                    const relviews = rel.relshipviews;
                    if (debug) console.log('441 input relviews', relviews);
                        for (let i=0; i<relviews?.length; i++) {
                        const relview = relviews[0];
                        if (relview) {
                            const link = myGoModel.findLinkByViewId(relview.id);
                            if (link) {
                                link.deleted = deletedFlag;
                                myDiagram.model.removeLinkData(link); 
                            }
                            relview.deleted = deletedFlag;
                            const gqlRelview = new gql.gqlRelshipView(relview);
                            deletedLinks.push(gqlRelview);
                            if (debug) console.log('450 delete relview', relview);
                        }
                    }
                    const gqlRel = new gql.gqlRelationship(rel);
                    deletedRelships.push(gqlRel);
                    if (debug) console.log('455 delete rel', rel);
                }
            }
            connectedRels = object?.outputrels;
            if (debug) console.log('469 outputrels', connectedRels);
            for (let i=0; i<connectedRels?.length; i++) {
                const rel = connectedRels[i];
                if (rel.deleted !== deletedFlag) {
                    rel.deleted = deletedFlag;
                    const relviews = rel.relshipviews;
                    if (debug) console.log('465 outputrelviews', relviews);
                    for (let i=0; i<relviews?.length; i++) {
                        const relview = relviews[0];
                        if (relview) {
                            const link = myGoModel.findLinkByViewId(relview.id);
                            if (link) link.deleted = deletedFlag;
                            relview.deleted = deletedFlag;
                            const gqlRelview = new gql.gqlRelshipView(relview);
                            deletedLinks.push(gqlRelview);
                            if (debug) console.log('474 delete relview', relview);
                        }
                    }
                    const gqlRel = new gql.gqlRelationship(rel);
                    deletedRelships.push(gqlRel);
                    if (debug) console.log('479 delete rel', rel);
                }
            }
        }
    }
}

export function deleteObjectView(objview: akm.cxObjectView, deletedFlag: boolean, deletedNodes: any, deletedObjects: any, deletedTypeviews: any, context: any) {
    const myMetis   = context.myMetis;
    objview.deleted = deletedFlag;
    const object = objview.object;
    if (object && !myMetis.currentModel.deleteViewsOnly) {
        const oviews = myMetis.getObjectViewsByObject(object.id);
        if (debug) console.log('482 oviews', oviews);
        // Handle object views
        if (oviews) {
            const noViews = oviews.length;
            for (let i = 0; i < noViews; i++) {
                // handle each objectview
                const oview = oviews[i];
                oview.deleted = deletedFlag;
                if (debug) console.log('489 delete oview', oview);
                // Register change in gql
                const gqlObjview = new gql.gqlObjectView(oview);
                deletedNodes.push(gqlObjview);
                // Handle objecttypeview
                //deleteObjectTypeView(oview, deletedFlag, deletedTypeviews);
            }
        }               
    }
}

export function deleteObjectTypeView(objview: akm.cxObjectView, deletedFlag: boolean, deletedTypeviews: any) {
    const object = objview?.object;
    const objtype  = object?.type;
    const typeview = objview?.typeview;
    const defaultTypeview = objtype?.typeview;
    if (typeview && defaultTypeview) {
        if (typeview.id !== defaultTypeview.id) {
            if (typeview.deleted !== deletedFlag) {
                typeview.deleted = deletedFlag;
                if (debug) console.log('509 delete typeview', typeview);
                // Register change in gql
                const gqlTypeview = new gql.gqlObjectTypeView(typeview);
                deletedTypeviews.push(gqlTypeview);
            }
        }
    }
}

export function deleteLink(data: any, deletedFlag: boolean, deletedLinks: any[], deletedRelships: any[], context: any) {
    const myMetamodel = context.myMetamodel;
    const myMetis     = context.myMetis;
    const myGoModel   = context.myGoMetamodel;

    // Replace myGoModel.nodes with a new array
    const links = new Array();
    for (let i = 0; i < myGoModel?.links.length; i++) {
        let l = myGoModel.links[i];
        links.push(l);
    }
    myGoModel.links = links;
    const link = myGoModel?.findLink(data.key) as gjs.goRelshipLink;
    if (debug) console.log('531 deleteLink', link);
    if (link) {
        // Handle deleteViewsOnly
        if (myMetis.currentModel.deleteViewsOnly) {
            const relview = link.relshipview;
            relview.deleted = deletedFlag;
            const delLink = new gql.gqlRelshipView(relview);
            deletedLinks.push(delLink);
            if (debug) console.log('539 deleteLink', relview);
            return;
        }
        // Else handle delete relships AND relship views
        // First delete object
        const relship = relview.relship;
        if (relship) {
            relview.deleted = deletedFlag;
            const gqlRelview = new gql.gqlRelshipView(relview);
            deletedLinks.push(gqlRelview);
            const rviews = myMetis?.getRelationshipViewsByRelship(relship.id);
            if (rviews) {
                for (let i = 0; i < rviews.length; i++) {
                    const rview = rviews[i];
                    if (!rview.deleted) {
                        rview.deleted = deletedFlag;
                        const gqlRelview = new gql.gqlRelshipView(rview);
                        deletedLinks.push(gqlRelview);
                        if (debug) console.log('557 deleteLink', rview);
                        // Handle relshiptypeview
                        deleteRelshipTypeView(rview, deletedFlag, deletedTypeviews);
                    }
                }
            }
        }      
    }
}

export function deleteRelshipTypeView(relview: akm.cxRelationshipView, deletedFlag: boolean, deletedTypeviews: any) {

    const relship = relview?.object;
    const reltype  = relship?.type;
    const typeview = relview?.typeview;
    const defaultTypeview = reltype?.typeview;
    if (typeview && defaultTypeview) {
        if (typeview.id !== defaultTypeview.id) {
            if (typeview.deleted !== deletedFlag) {
                typeview.deleted = deletedFlag;
                if (debug) console.log('577 delete typeview', typeview);
                // Register change in gql
                const gqlTypeview = new gql.gqlRelshipTypeView(typeview);
                deletedTypeviews.push(gqlTypeview);
            }
        }
    }
}

export function changeNodeSizeAndPos(sel: gjs.goObjectNode, goModel: gjs.goModel, nodes: any[]) {
    if (debug) console.log('613 sel', sel);
    if (sel.category === 'Object') {
        let node = goModel?.findNode(sel.key);
        if (node) {
            node.loc = sel.loc;
            node.size = sel.size;
            const objview = node.objectview;
            if (objview) {
                objview.loc = sel.loc;
                objview.size = sel.size;
                objview.modified = true;
                const group = getGroupByLocation(goModel, objview.loc);
                if (debug) console.log('609 Moved node', group, objview);
                if (group) {
                    objview.group = group.objectview.id;
                    node.group = group.key;
                } else {
                    objview.group = "";
                    node.group = "";
                }
                if (debug) console.log('614 Moved node', node, objview)
                const modNode = new gql.gqlObjectView(objview);
                nodes.push(modNode);
            }
        }
        if (debug) console.log('622 goModel :', goModel);
        return node;
    }
}

// Callback function initiated when a node is pasted
export function onClipboardPasted(selection: any, context: any) {
    // First handle the objects
    let it = selection.iterator;
    while (it.next()) {
        let selected = it.value.data;
        if (debug) console.log('446 onClipboardPasted', selected);
        if (selected.category === 'Object') {
            let node = selected;
            const objview = createObject(node, context);
        }
    }

    // Then handle the relationships
    while (it.next()) {
        let selected = it.value.data;
        if (debug) console.log('457 onClipboardPasted', selected);
        if (selected.category === 'Relationship') {
            let link = selected;
            const relview = createObject(node, context);
        }
    }

    // Finally handle groups if they are involved
    const groupsToPaste = new Array();
    let i = 0;
    let it1 = selection.iterator;
    while (it1.next()) {
        // Identify groups in the selection
        let selected = it1.value.data;
        if (debug) console.log('471 onClipboardPasted', selected);
        if (selected.category === 'Object') {
            let node = selected;
            if (node.isGroup) {
                groupsToPaste[i] = node;
                // groupsToPaste[i] = node.data;
                // groupsToPaste[i].node = node;
                // groupsToPaste[i].key = node.data.key;
                // groupsToPaste[i].objectview = node.data.objectview;
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
            let selected = it.value.data;
            let group = groupsToPaste[i].key;
            if (selected.category === 'Object') {
                let node = selected;
                if (node.group !== undefined) {
                    let grp = node.group;  // key
                    if (grp === group) {
                        groupsToPaste[i].members.push(node.objectview);
                    }
                    if (debug) console.log('500 groupsToPaste', groupsToPaste);
                }
            }
        }
    }
}

// Function to connect node object to group object
export function getGroupByLocation(model: gjs.goModel, loc: string): gjs.goObjectNode | null {
    const nodes = model.nodes;
    if (debug) console.log('687 ', nodes, loc);
    const groups = new Array();
    for (let i = 0; i < nodes?.length; i++) {
        const node = nodes[i] as gjs.goObjectNode;
        if (debug) console.log('690 getGroup', node);
        if (node.isGroup) {
            if (debug) console.log('692 getGroup', node);
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
            if (debug) console.log('703 getGroup', loc, node.loc);
            if (debug) console.log('704 getGroup', nx, gx, gw, ny, gy, gh);
            if (
                (nx > gx) && (nx < gx + gw) &&
                (ny > gy) && (ny < gy + gh)
            ) {
                let grp = {"node": node, "size": size};
                if (debug) console.log('710 group', grp);
                groups.push(grp);
            }
        }
    }
    if (debug) console.log('715 groups', groups);
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
                        rel = new akm.cxRelationship(utils.createGuid(), reltype, groupObj, nodeObj, reltype.name, "");
                        if (rel) {
                            rel.setModified();
                            myModel.addRelationship(rel);
                            myMetis.addRelationship(rel);
                        }
                    }
                } else if (childType) {
                    let reltype = groupType.findRelshipTypeByKind(constants.RELKINDS.AGGR, childType);
                    if (reltype) {
                        let rel = new akm.cxRelationship(utils.createGuid(), reltype, groupObj, nodeObj, reltype.name, "");
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

export function addNodeToDataArray(parent: any, node: any, objview: akm.cxObjectView) {
    const nodeArray = parent.nodeDataArray;
    const newArray  = new Array();
    for (let i=0; i<nodeArray.length; i++) {
        const n = nodeArray[i]; 
        if (n) newArray.push(n);
    }
    //newArray.push(node);
    const myNode = new gjs.goObjectNode(node.key, objview);
    myNode.loc = node.loc;
    myNode.size = node.size;
    myNode.objectview_0 = node.objectview_0;
    myNode.parentModel = node.parentModel;
    myNode.type = node.type;
    const objtype = objview.object?.type;
    const typeview = objtype?.typeview;
    myNode.typeview = typeview;
    const viewdata = typeview?.data;
    for (let prop in viewdata) {
        if (prop === "class") continue;
        if (prop === "isGroup") continue;
        if (prop === "group") continue;
        myNode[prop] = viewdata[prop];                            
    }
    newArray.push(myNode);
    parent.nodeDataArray = newArray;
    return myNode;
}

// functions to handle links
export function createRelationship(data: any, context: any) {
    /* if (debug) */console.log('824 createRelationship', data);
    const myDiagram = context.myDiagram;
    const myGoModel = context.myGoModel;
    //const myMetamodel = context.myMetamodel;
    const myMetis = context.myMetis; // added sf
    //data.key = utils.createGuid();
    const fromNode = myGoModel.findNode(data.from);
    const toNode = myGoModel.findNode(data.to);
    if (debug) console.log('859 createRelationship', myGoModel, fromNode, toNode);
    const fromObj = fromNode.object;
    const toObj = toNode.object;
    let typename = 'isRelatedTo' as string | null;
    let reltype;
    if (!reltype) {
        let fromType = fromNode?.objecttype;
        let toType   = toNode?.objecttype;
        fromType = myMetis.findObjectType(fromType?.id);
        fromType.allObjecttypes = myMetis.objecttypes;
        fromType.allRelationshiptypes = myMetis.relshiptypes;
        toType   = myMetis.findObjectType(toType?.id);
        toType.allObjecttypes = myMetis.objecttypes;
        toType.allRelationshiptypes = myMetis.relshiptypes;
        const choices: string[]  = [];
        if (fromType && toType) {
            let defText = "";
            const reltypes = myMetis.findRelationshipTypesBetweenTypes(fromType, toType);
            if (debug) console.log('873 createRelationship', reltypes, fromType, toType);
            if (reltypes) {
                for (let i=0; i<reltypes.length; i++) {
                    const rtype = reltypes[i];
                    choices.push(rtype.name);  
                    if (rtype.name === 'isRelatedTo')
                        defText = rtype.name;
                }
                if (choices.length == 1) defText = choices[0];
                typename = prompt('Enter type name, one of ' + choices, defText);
                reltype = myMetis.findRelationshipTypeByName2(typename, fromType, toType);
                if (debug) console.log('888 reltype', reltype);
            }
        }
    }
    if (!reltype) {
        alert("Relationship type given does not exist!")
        myDiagram.model.removeLinkData(data);
        return;
    }
    if (debug) console.log('896 createRelationship', reltype);
    data.relshiptype = reltype;
    const reltypeview = reltype.typeview;
    myDiagram.model.setDataProperty(data, "name", typename);
    const relshipview = createLink(data, context);
    if (relshipview) relshipview.setTypeView(reltypeview);
    if (debug) console.log('908 myGoModel', myGoModel);
    myDiagram.requestUpdate();
    return relshipview;
}

// functions to handle links
export function pasteRelationship(data: any, nodes: any[], context: any) {
    const myDiagram = context.myDiagram;
    const myGoModel = context.myGoModel;
    const myMetis   = context.myMetis;
    const myModel   = context.myModel;
    const myModelView = myMetis.currentModelview;
    const pasteViewsOnly = myMetis.currentModel.pasteViewsOnly;
    if (debug) console.log('937 pasteViewsOnly', pasteViewsOnly);
    if (debug) console.log('938 myMetis', myMetis, myGoModel);
    if (debug) console.log('939 pasteRelationship', data);
    // Relationship type must exist
    let reltype = data.relshiptype;
    reltype = myMetis.findRelationshipType(reltype?.id);
    // if (reltype) 
    //     reltype = myMetis.findRelationshipType(reltype.id);
    if (debug) console.log('945 pasteRelationship', reltype);
    if (!reltype)
        return;
    //const reltypeview = reltype.getDefaultTypeView();
    // Find source objects
    const fromNodeRef = data.from;
    const toNodeRef   = data.to;
    const fromNode = myDiagram.findNodeForKey(fromNodeRef);
    const toNode = myDiagram.findNodeForKey(toNodeRef);
    if (debug) console.log('954 fromNode, toNode', fromNode, toNode);
    const fromObjview = fromNode?.data.objectview;
    const toObjview   = toNode?.data.objectview;
    let   relship     = data.relshipview.relship;
    const typeview    = data.relshipview.typeview;
    if (debug) console.log('959 pasteRelationship', fromObjview, toObjview);
    if (!pasteViewsOnly) {
        let fromObj = fromObjview?.object;
        fromObj = myMetis.findObject(fromObj?.id);
        let toObj = toObjview?.object;
        toObj = myMetis.findObject(toObj?.id);
        if (fromObj && toObj) {
            relship = new akm.cxRelationship(utils.createGuid(), reltype, fromObj, toObj, "", "");
            relship.setModified();
            data.relship = relship;
            relship.setName(reltype.name);
            fromObj.addOutputrel(relship);
            toObj.addInputrel(relship);
            myMetis.currentModel.addRelationship(relship);
            myMetis.addRelationship(relship);
        }
    } else {
        relship = myMetis.findRelationship(relship?.id);
    }
    if (debug) console.log('979 relationship', relship);
    const relshipview = new akm.cxRelationshipView(utils.createGuid(), relship.name, relship, "");
    if (relshipview) {
        relshipview.setTypeView(typeview);              // Uses same typeview as from relview
        relshipview.setFromObjectView(fromObjview);
        relshipview.setToObjectView(toObjview);
        relshipview.setModified();
        myModelView.addRelationshipView(relshipview);
        myMetis.addRelationshipView(relshipview);
    }
    if (debug) console.log('989 relshipview', relshipview);
    if (debug) console.log('990 myModel', myModel);
    myDiagram.requestUpdate();
    return relshipview; 
}

export function updateRelationship(data: any, name: string, value: string, context: any) {
    if (!debug) console.log('1011 updateRelationship', name, data);
    if ((data === null) || (!data.relship)) {
        return;
    } else {
        const myDiagram        = context.myDiagram;
        let currentRelship     = data.relship;
        let currentRelshipView = data.relshipview;
        currentRelship.setName(value);
        currentRelship.setModified();
        currentRelshipView.setName(value);
        currentRelshipView.setModified();
        myDiagram.model.setDataProperty(data, "name", value);

    }
}

export function createRelationshipType(fromTypeNode: any, toTypeNode: any, data: any, context: any) {
    console.log('1011 Entering createRelationshipType');
    const myMetis       = context.myMetis;
    const myMetamodel   = context.myMetamodel;
    const myGoMetamodel = context.myGoMetamodel;
    const myDiagram     = context.myDiagram;  
    let typename        = prompt("Enter type name:", "typename");
    if (debug) console.log('1017 typename', typename, myMetamodel);
    data.key = utils.createGuid();
    myDiagram.model.setDataProperty(data, "name", typename);
    if (data.name == null) {
        myDiagram.model.removeLinkData(data); 
        if (debug) console.log('1022 data', data);
        return;
    }
    myDiagram.model.setDataProperty(data, "category", constants.gojs.C_RELSHIPTYPE);
    typename = data.name;
    if (debug) console.log('1027 data', data, myGoMetamodel);
    if (typename) {
        if (debug) console.log('1031 from and to type nodes', fromTypeNode, toTypeNode);
        if (fromTypeNode && toTypeNode) {
            let reltype   = myMetis.findRelationshipTypeByName(typename);
            if (debug) console.log('1035 reltype', reltype);
            if (reltype) {  // Existing type - create a copy                  
                const relkind = reltype.getRelshipKind();
                const fromObjType = fromTypeNode.objecttype;
                const toObjType = toTypeNode.objecttype;
                const reltype2 = new akm.cxRelationshipType(utils.createGuid(), reltype.name, fromObjType, toObjType, "");
                reltype2.setModified();
                reltype2.setRelshipKind(relkind);
                myDiagram.model.setDataProperty(data, "reltype", reltype2);
                myDiagram.model.setDataProperty(data, "category", constants.gojs.C_RELSHIPTYPE);
                myMetamodel.addRelationshipType(reltype2);
                myMetis.addRelationshipType(reltype2);
                /* if (debug) */console.log('903 reltype2', reltype2);
                const reltypeView = reltype.getDefaultTypeView();
                //reltype2.setDefaultTypeView(reltypeView);
                if (reltypeView) {
                    // Copy reltypeview
                    const id = utils.createGuid();
                    const reltypeView2 = new akm.cxRelationshipTypeView(id, id, reltype2, "");
                    if (debug) console.log('797 reltypeView2', reltypeView2);
                    reltypeView2.setModified();
                    reltypeView2.setRelshipKind(relkind);
                    const viewdata = reltypeView.getData();
                    if (debug) console.log('802 viewdata', viewdata);
                    const viewdata2 = reltypeView2.getData();
                    for (let prop in viewdata) {
                        viewdata2[prop] = viewdata[prop];                            
                    }
                    if (debug) console.log('919 reltypeView2', viewdata2, reltypeView2);
                    reltype2.setDefaultTypeView(reltypeView2);
                    myMetamodel.addRelationshipTypeView(reltypeView2);
                    myMetis.addRelationshipTypeView(reltypeView2);
                    updateLink(data, reltypeView2, myDiagram);
                    myDiagram.model.setDataProperty(data, "typeview", reltypeView2);
                    myDiagram.requestUpdate();
                }
                /* if (debug) */console.log('927 reltype2', reltype2, myMetis);
                return reltype2;
            } else {   // New relationship type - create it                
                if (debug) console.log('1074 reltype', reltype);
                let typeid = utils.createGuid();
                reltype = new akm.cxRelationshipType(typeid, data.name, null, null, "");
                if (reltype) {
                    if (debug) console.log('1078 reltype', reltype);
                    myDiagram.model.setDataProperty(data, "reltype", reltype);
                    myDiagram.model.setDataProperty(data, "category", constants.gojs.C_RELSHIPTYPE);
                    reltype.setModified();
                    reltype.setFromObjtype(fromTypeNode.objtype);
                    reltype.setToObjtype(toTypeNode.objtype);
                    if (debug) console.log('1084 reltype', reltype);
                    myMetamodel.addRelationshipType(reltype);
                    myMetis.addRelationshipType(reltype);
                    // Then create the default relationship typeview
                    const reltypeView = new akm.cxRelationshipTypeView(utils.createGuid(),reltype.name, reltype, "");   
                    if (reltypeView) {
                        if (debug) console.log('1090 reltypeView', reltypeView);
                        reltypeView.setModified();
                        myDiagram.model.setDataProperty(data, "typeview", reltypeView);
                        reltype.setDefaultTypeView(reltypeView);
                        myMetamodel.addRelationshipTypeView(reltypeView);
                        myMetis.addRelationshipTypeView(reltypeView);
                        updateLink(data, reltypeView, myDiagram);
                        myDiagram.requestUpdate();
                        if (debug) console.log('1098 myMetamodel', myMetamodel);
                    }
                    console.log('1096 reltype', reltype);
                    return reltype;
                }
            }
        }
    }
    return null;
}

export function updateRelationshipType(data: any, name: string, value: string, context: any) {
    if (debug) console.log('835 updateRelationshipType', name, value);
    if ((data === null) || (name !== "name")) {
        return;
    }  else {
        const metis = context.myMetis;
        const myMetamodel = context.myMetamodel;
        const myDiagram   = context.myDiagram;
        const typename    = value;
        // Check if this is a type change
        let reltype = metis.findRelationshipType(data.reltype.id);            
        if (debug) console.log('844 updateRelationshipType', reltype);
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
                if (debug) console.log('870 updateRelationshipType', reltype);
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
                myMetamodel.addRelationshipTypeView(reltypeView);
                metis.addRelationshipTypeView(reltypeView);
            } 
            if (reltypeView) {
                let viewdata = reltypeView.getData();
                let prop: any;
				for(prop in viewdata){
					if (prop === name) {
						viewdata[prop] = value;
						if (prop === "abstract") {
							reltypeView.setAbstract(value);
						}
						if (prop === "relshipkind") {
							reltypeView.setRelshipKind(value);
						}
						break;
					}
				}                            
				updateLink(data, reltypeView, myDiagram); 
				myDiagram.requestUpdate();
            }                
        }
    }
}

export function setRelationshipType(data: any, reltype: akm.cxRelationshipType, context: any) {
    const myMetis     = context.myMetis;
    const myDiagram   = context.myDiagram;

    if (reltype) {
        const reltypeview = reltype.getDefaultTypeView();
        const currentRelship = myMetis.findRelationship(data.relship.id);
        if (currentRelship) {
            const nameIsChanged = (currentRelship.name !== currentRelship.type.name);
            currentRelship.setType(reltype);
            currentRelship.setName(reltype.name);
            currentRelship.setModified();
            const currentRelshipView = myMetis.findRelationshipView(data.relshipview.id);
            if (currentRelshipView) {
                currentRelshipView.setTypeView(reltypeview);
                currentRelshipView.setName(reltype.name);
                currentRelshipView.setModified();
                currentRelshipView.setRelationship(currentRelship);
                if (!nameIsChanged)
                    myDiagram.model.setDataProperty(data, "name", reltype.name);
                data.relshiptype = reltype;
                // Clear local overrides
                currentRelshipView['strokecolor'] = "";
                currentRelshipView['strokewidth'] = "";
                currentRelshipView['dash']        = "";
                currentRelshipView['fromArrow']   = "";
                currentRelshipView['toArrow']     = "";
                updateLink(data, reltypeview, myDiagram);

                const gqlRelView = new gql.gqlRelshipView(currentRelshipView);
                if (debug) console.log('1217 SetReltype', link, gqlRelView);
                const modifiedRelshipViews = new Array();
                modifiedRelshipViews.push(gqlRelView);
                modifiedRelshipViews.map(mn => {
                    let data = mn;
                    myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
                })
            }
            const gqlRelship = (currentRelship) && new gql.gqlRelationship(currentRelship);
            const modifiedRelships = new Array();
            modifiedRelships.push(gqlRelship);
            modifiedRelships.map(mn => {
              let data = mn;
              (mn) && myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
            })              
            return currentRelshipView;
        }
    }
}

export function createLink(data: any, context: any): any {
    // Creates both relship and relship view
    if (!data.key)
        data.key = utils.createGuid();
    const myMetis = context.myMetis;
    if (data.category === constants.gojs.C_RELSHIPTYPE) {
        let reltype = null;
        data.class  = "goRelshipTypeLink";
    } else if (data.category === constants.gojs.C_RELATIONSHIP) {    
        const myGoModel = context.myGoModel;
        // Identify  type   
        let reltype = null;
        let relshipview;
        data.class = "goRelshipLink";
        let fromNode = data.fromNode;
        if (!fromNode)
            fromNode = myGoModel.findNode(data.from);
        let toNode = data.toNode;
        if (!toNode)
            toNode = myGoModel.findNode(data.to);
        const fromType = fromNode?.objecttype;
        const toType   = toNode?.objecttype;
        reltype = myMetis.findRelationshipTypeByName2(data.name, fromType, toType);
        if (reltype && reltype.isInstantiable()) {
            // Create the relationship
            const myGoModel = context.myGoModel;
            let fromObjView = fromNode?.objectview;
            let toObjView = toNode?.objectview;
            let fromObj = null;
            if (fromObjView) {
                fromObj = fromObjView.object;
            }
            let toObj = null;
            if (toObjView) {
                toObj = toObjView.object;
            }
            if (debug) console.log('946 createLink', fromObj, toObj);
            if (fromObj && toObj) {
                // Find relationship if it already exists
                const myModel = context.myModel;
                let relship = myModel.findRelationship1(fromObj, toObj, reltype);
                if (!relship) {
                    relship = new akm.cxRelationship(utils.createGuid(), reltype, fromObj, toObj, "", "");
                    if (relship) {
                        relship.setModified();
                        data.relship = relship;
                        relship.setName(reltype.name);
                        myModel.addRelationship(relship);
                        myMetis.addRelationship(relship);
                    }
                }
                if (debug) console.log('1271 relship', relship);
                if (relship) {
                    let typeview = reltype.getDefaultTypeView();
                    relshipview = new akm.cxRelationshipView(utils.createGuid(), relship.name, relship, "");
                    if (relshipview) {
                        const myModelview = context.myModelview;
                        const diagram = context.myDiagram;
                        relshipview.setModified();
                        data.relshipview = relshipview;
                        relshipview.setName(relship.name);
                        relshipview.setTypeView(typeview);
                        relshipview.setFromObjectView(fromObjView);
                        relshipview.setToObjectView(toObjView);
                        myModelview.addRelationshipView(relshipview);
                        myMetis.addRelationshipView(relshipview);
                        let linkData = buildLinkFromRelview(myGoModel, relshipview, relship, data, diagram);
                    }
                    if (debug) console.log('1288 relship', relshipview);
                }
            }
        }
        return relshipview;
    }
    return;
}

export function onLinkRelinked(lnk: gjs.goRelshipLink, fromNode: any, toNode: any, context: any) {
    if (lnk.category === 'Relationship') {
        if (fromNode && toNode) {
            const myMetis = context.myMetis;
            const myGoModel = context.myGoModel;
            const link = myGoModel.findLink(lnk.key) as gjs.goRelshipLink;
            if (link) {
                let relview = link.relshipview;    // cxRelationshipView
                relview = myMetis.findRelationshipView(relview.id);
                const rel = relview?.relship;    // cxRelationship     
                if (rel && relview) {
                    link.setFromNode(lnk.from);
                    const fromObjView = fromNode.objectview;
                    relview.fromObjview = fromObjView;
                    rel.fromObject = myMetis.findObject(fromObjView.object.id);               
                    link.setToNode(lnk.to);
                    const toObjView = toNode.objectview;
                    relview.toObjview = toObjView;
                    rel.toObject = myMetis.findObject(toObjView.object.id); 
                    const gqlRelview = new gql.gqlRelshipView(relview);
                    context.modifiedLinks.push(gqlRelview);
                    const gqlRel = new gql.gqlRelationship(rel);
                    context.modifiedLinks.push(gqlRel);
                }
            }
        }
    }
    if (lnk.category === 'Relationship type') {
        const myGoMetamodel = context.myGoMetamodel;
        const link = myGoMetamodel.findLink(lnk.key) as gjs.goRelshipTypeLink;
        if (debug) console.log('1185 lnk, link', lnk, link);
        if (link) {
            const reltype = link.reltype;  // cxRelationshipType   
            if (reltype) {             
                if (debug) console.log('1190 fromNode', fromNode);
                if (reltype && fromNode) {
                    link.fromNode = fromNode;
                    reltype.fromObjtype = fromNode.objtype;
                }
                if (debug) console.log('1196 toNode', toNode);
                if (reltype && toNode) {
                    link.toNode = toNode;
                    reltype.toObjtype = toNode.objtype;
                }
                const gqlReltype = new gql.gqlRelationshipType(reltype, true);
                context.modifiedTypeLinks.push(gqlReltype);
            }
        }
    }
}

export function addLinkToDataArray(parent: any, myLink: gjs.goRelshipLink, relview: akm.cxRelationshipView) {
    const linkArray = parent.linkDataArray;
    const newArray  = new Array();
    for (let i=0; i<linkArray.length; i++) {
        const l = linkArray[i]; 
        if (l) newArray.push(l);
    }
    const reltype = relview.relship?.type;
    const typeview = reltype?.typeview;
    myLink.typeview = typeview;
    const viewdata = typeview?.data;
    for (let prop in viewdata) {
        if (prop === "abstract") continue;
        if (prop === "class") continue;
        myLink[prop] = viewdata[prop];                            
    }
    console.log('1322 myLink', myLink);
    newArray.push(myLink);
    parent.linkDataArray = newArray;
    return myLink;
}


export function setRelshipType() {

}

// Local functions
export function updateNode(node: any, objtypeView: akm.cxObjectTypeView, diagram: any, goModel: gjs.goModel) {
    if (!debug) console.log('1406 updateNode', node, diagram);
    if (objtypeView) {
        let viewdata: any = objtypeView.data;
        let prop: string;
        for (prop in viewdata) {
            if (prop === 'abstract') continue;
            if (prop === 'class') continue;
            if (prop === 'group') continue;
            if (prop === 'isGroup') continue;
            if (prop === 'viewkind') continue;
            if (viewdata[prop] != null)
                diagram?.model.setDataProperty(node, prop, viewdata[prop]);
            if (debug) console.log('1187 updateNode', prop, node[prop], diagram);
        }
        const objview = node.objectview;
        for (prop in viewdata) {
            if (objview[prop] && objview[prop] !== "") {
                diagram.model.setDataProperty(node, prop, objview[prop]);
            }
        }
        diagram.model.setDataProperty(node, 'typename', node.typename);
        // const n = diagram.findNodeForKey(node.key);
        // console.log('1423 n, node', n, node);
        // diagram.model.setDataProperty(n, 'typename', node.typename);
        if (goModel) {
            goModel.updateNode(node);
            if (!debug) console.log('1428 updateNode', node, goModel);
        }
        if (!debug) console.log('1431 updateNode', node, diagram);
    }
}

function updateLink(data: any, reltypeView: akm.cxRelationshipTypeView, diagram: any, goModel: gjs.goModel) {
    if (reltypeView) {
        let viewdata: any = reltypeView.getData();
        let prop: string;
        for (prop in viewdata) {
            if (prop === 'abstract') continue;
            if (prop === 'relshipkind') continue;
            if (prop === 'class') continue;
            if (viewdata[prop] != null)
                diagram.model.setDataProperty(data, prop, viewdata[prop]);
            const relview = data.relshipview;
            if (relview) {
                if (relview[prop] && relview[prop] !== "") {
                    diagram.model.setDataProperty(data, prop, relview[prop]);
                }
                if (debug) console.log('1459 updateLink', data, prop, viewdata[prop]);
                if (goModel) {
                    goModel.updateLink(data);
                }
            }
        }
    }
} 

function isLinkAllowed(reltype: akm.cxRelationshipType, fromObj: akm.cxObject, toObj: akm.cxObject) {
    if (reltype && fromObj && toObj) {
        let fromType = reltype.getFromObjType();
        let toType = reltype.getToObjType();
        if (debug) console.log('1132 from and to type', reltype, fromType, toType);
        if (debug) console.log('1133 fromObj and toObj', fromObj, toObj);
        if (fromObj.getType().inherits(fromType)) {
            if (debug) console.log('1135 inherits fromType: true');
            if (toObj.getType().inherits(toType)) {
                if (debug) console.log('1137 inherits toType: true');
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

export function verifyAndRepairModel(modelview: akm.cxModelView, model: akm.cxModel, metamodel: akm.cxMetaModel, myDiagram: any) {
    // Handle the objects
    // Check if the referenced type exists - otherwse find a type that corresponds
    const myGoModel = myDiagram?.myGoModel;
    const defObjTypename = 'Generic';
    const objects = model.objects;
    const modifiedObjects = new Array();
    const modifiedObjectviews = new Array();
    const format = "%s\n";
    let msg = "Verification report";
    let report = printf(format, msg);
    for (let i=0; i<objects?.length; i++) {
        const obj = objects[i];
        obj.inputrels = new Array();
        obj.outputrels = new Array();
        const typeRef = obj.typeRef;
        const typeName = obj.typeName;
        if (debug) console.log('1441 obj', obj, model);
        let objtype = metamodel.findObjectType(typeRef);
        msg = "Verifying object type " + typeRef + " (" + typeName + ")";
        report += printf(format, msg);
        if (!objtype) {
            msg = "Object type " + typeRef + " (" + typeName + ") was not found";
            report += printf(format, msg);
            if (debug) console.log('1464 Type of object not found:', obj);
            objtype = metamodel.findObjectTypeByName(typeName);
            if (!objtype) {
                objtype = metamodel.findObjectTypeByName(defObjTypename);
            }        
            obj.type = objtype;
            obj.typeRef = objtype.id;
            obj.typeName = objtype.name;
            msg = "Object type changed to: " + objtype.name;
            report += printf(format, msg);
            const gqlObj = new gql.gqlObject(obj);
            modifiedObjects.push(gqlObj);
        }
        if (objtype) {
            const objviews = obj.objectviews;
            for (let i=0; i<objviews?.length; i++) {
                const oview = objviews[i];
                oview.name = obj.name;
                if (obj.deleted && !oview.deleted) {
                    oview.deleted = true;
                    msg = "Verifying object " + obj.name + " that is deleted, but objectview is not.\n";
                    msg += "\tIs repaired by deleting object view";
                    report += printf(format, msg);
                }
                let typeview = oview.typeview;
                if (!typeview) {
                    oview.typeview = objtype.typeview;
                    msg = "Object typeview of : " + objtype.name + " set to default";
                    report += printf(format, msg);
                    const gqlObjview = new gql.gqlObjectView(oview);
                    modifiedObjectviews.push(gqlObjview);
                }
                const myNode = myGoModel.findNodeByViewId(oview.id);
                if (myNode) {
                    myNode.name = oview.name;
                    const node = myDiagram.findNodeForKey(myNode?.key);
                    if (node) node.data = myNode; // sf added if (node)
                }
            }
            myDiagram.requestUpdate();
            modifiedObjectviews?.map(mn => {
                let data = (mn) && mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
            })
        }
    }
    modifiedObjects?.map(mn => {
        let data = (mn) && mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
    })
    msg = "Verifying objects completed";
    report += printf(format, msg);


    // Handle the relationships
    // Check if the referenced type exists - otherwse find a type that corresponds
    const defRelTypename = 'isRelatedTo';
    const modifiedRelships = new Array();
    const relships = model.relships;
    if (relships) // sf added
        for (let i=0; i<relships.length; i++) {
            const rel = relships[i];
            if (debug) console.log('1510 rel', rel);
            const fromObj  = rel.fromObject;
            const toObj    = rel.toObject
            let   fromType = fromObj?.type;
            let   toType   = toObj?.type;
            let typeRef    = rel.typeRef;
            let typeName   = rel.typeName;
            if (!typeName) typeName = rel.name;
            let reltype = metamodel.findRelationshipType(typeRef);
            if (debug) console.log('1518 fromType and toType', typeRef, typeName, fromType, toType, reltype);
            msg = "Verifying relationship type " + typeRef + " (" + typeName + ")";
            report += printf(format, msg);
            if (!reltype) {
                msg = "Relationship type " + typeRef + " (" + typeName + ") was not found";
                if (debug) console.log('1524 Relationship with unknown type:', typeName);
                if (typeName === 'hasProperty')  {
                    typeName = 'has';
                    toType = metamodel.findObjectTypeByName('Property');
                }
                else if (typeName === 'hasValue') {
                    typeName = 'has';
                    toType = metamodel.findObjectTypeByName('Value');
                }
                else if (typeName === 'hasAllowedValue') {
                    typeName = 'hasAllowed';
                    toType = metamodel.findObjectTypeByName('Value');
                }
                else if (typeName === 'isOfDatatype') {
                    typeName = 'isOf';
                    toType = metamodel.findObjectTypeByName('Datatype');
                }
                else if (typeName === 'hasUnittype') { 
                    typeName = 'has';
                    toType = metamodel.findObjectTypeByName('Unittype');
                }
                const reltypes = metamodel.findRelationshipTypesByName(typeName);
                if (debug) console.log('1530 Relationship with name:', typeName, reltypes);
                if (reltypes) {
                    for (let i=0; i<reltypes.length; i++) {
                        const rtype = reltypes[i] as akm.cxRelationshipType;
                        let fromObjType = fromType;
                        if (!fromObjType) fromObjType = rtype.fromObjtype;
                        let toObjType = toType;
                        if (!toObjType) toObjType   = rtype.toObjtype;
                        if (debug) console.log('1548 fromType and toType', typeName, fromObjType, toObjType);
                        if (fromObjType && toObjType) {
                            if (debug) console.log('1550 findreltypebyname', typeName, fromObjType.name, toObjType.name);
                            const rtyp = metamodel.findRelationshipTypeByName2(typeName, fromObjType, toObjType);
                            if (rtyp) {
                                reltype = rtyp;
                                rel.type = reltype;
                                rel.name = typeName;
                                const relviews = rel.relshipviews;
                                for (let i=0; i<relviews.length; i++) {
                                    const rv = relviews[i];
                                    rv.name = typename;
                                }
                                msg = "Relationship type changed to: " + typeName;
                                report += printf(format, msg);
                                if (debug) console.log('1560 Found relationship type:', reltype);
                                break;
                            }
                        }
                    }
                }
                if (!reltype) {
                    reltype = metamodel.findRelationshipTypeByName(defRelTypename);
                    if (reltype) {
                        rel.type = reltype;
                        rel.name = typeName;
                    }
                }
            }
            const gqlRel = new gql.gqlRelationship(rel);
            modifiedRelships.push(gqlRel);
        }


    // Handle the relationship views in all modelviews
    const modifiedRelviews = new Array();
    const mviews = model.modelviews;
    for (let i=0; i<mviews.length; i++) {
        const mview = mviews[i];
        if (mview && mview.id === modelview.id) {
            if (debug) console.log('1595 modelview', mview);
            const rviews = mview.relshipviews;
            for (let j=0; j<rviews?.length; j++) {
                const rview = rviews[j];
                if (debug) console.log('1597 relshipview', rview);
                if (rview && !rview.deleted) {
                    const rel = rview.relship;
                    if (rel && rel.type) {
                        if (debug) console.log('1601 relshipview', rel);
                        rel.name = rel.type.name;
                        rview.name = rel.type.name;

                        if (rel.deleted && !rview.deleted) {
                            rview.deleted = true;
                            msg = "Verifying relationship " + rel.name + " that is deleted, but relationshipview is not.\n";
                            msg += "\tIs repaired by deleting relationship view";
                            report += printf(format, msg);
                        }                               
                        if (!rview.typeview) {
                            rview.typeview = rel.type.typeview;
                            msg = "Relationship typeview of " + rel.type.name + " set to default";
                            report += printf(format, msg);
                        } else {
                            msg = "Relationship typeview of " + rel.type.name + " found"; 
                            report += printf(format, msg);
                        }
                        const gqlRelview = new gql.gqlRelshipView(rview);
                        if (debug) console.log('1613 gqlRelview', gqlRelview);
                        modifiedRelviews.push(gqlRelview);
                        const myLink = myGoModel.findLinkByViewId(rview.id);
                        if (myLink) {
                            myLink.name = rview.name;
                            const link = myDiagram.findLinkForKey(myLink?.key);
                            if (link) {
                                link.data = myLink;
                            }
                        }
                    }
                }
            }
        }
    }
    modifiedRelviews?.map(mn => {
        let data = (mn) && mn;
        data = JSON.parse(JSON.stringify(data));
        if (debug) console.log('1629 data (relshipview)', data);
        myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
    })
    modifiedRelships?.map(mn => {
        let data = (mn) && mn;
        data = JSON.parse(JSON.stringify(data));
        if (debug) console.log('1611 data (relship)', data);
        myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
    })

    msg = "Verifying relationships completed";
    if (debug) console.log('1617 myGoModel', myGoModel);
    report += printf(format, msg);
    if (debug) console.log(report);
    myDiagram.requestUpdate();    
    alert(report);                    
} 