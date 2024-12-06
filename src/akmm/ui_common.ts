// @ts-nocheck
const debug = false;

import * as utils from './utilities';
import * as akm from './metamodeller';
import * as uid from './ui_diagram';
import * as gjs from './ui_gojs';
import * as jsn from './ui_json';
import { LinkReshapingTool } from 'gojs';
import { get } from 'http';
import { core } from './constants';
import context from '../pages/context';
const constants = require('./constants');
const printf = require('printf');
const grabIsAllowed = true;

// functions to handle nodes
export function createObject(gjsData: any, context: any): akm.cxObjectView | null {
    if (gjsData === null) {
        return null;
    } else {
        const guid = utils.createGuid();
        let objview: akm.cxObjectView;
        const myMetis = context.myMetis as akm.cxMetis;
        const myModel = context.myModel;
        const myMetamodel = context.myMetamodel;
        const myModelview = context.myModelview;
        const myGoModel = context.myGoModel;
        const myDiagram = context.myDiagram;
        const modifiedRelships = [];
        const objtype = gjsData.objecttype;
        if (!objtype)
            return null;
        let objId = utils.createGuid();
        let name = gjsData.name;
        let description = gjsData.description;
        let obj = new akm.cxObject(objId, name, objtype, description);
        // let objId = data.objRef;
        // let obj: akm.cxObject = myMetis.findObject(objId);
        // let obj1: akm.cxObject;
        if (obj) {
            // gjsData.object = obj;
            let name = context.pasted ? gjsData.name : "";
            if (!gjsData.parentModel) name = gjsData.name;
            if (myMetis.pasteViewsOnly) {
                const pastedobj = obj;
                if (objtype.name === constants.types.AKM_CONTAINER) {
                    obj = new akm.cxObject(guid, name, objtype, description);
                }
                if (!pastedobj) {
                    // This is not a pasted object, create a new one
                    obj = new akm.cxObject(guid, name, objtype, description);
                    myMetis.pasteViewsOnly = false;
                } else {
                    obj = pastedobj;
                }
            }
        } 
        if (!obj || !(obj instanceof akm.cxObject)) {
            obj = new akm.cxObject(guid, name, objtype, description);
            // Check if obj is dropped on a group that is a Model
            // If so, add the obj to the model
            // const group = getGroupByLocation(myGoModel, gjsData.loc, gjsData.size, gjsData);
            // if (group) {
            //     const groupObj = group.object;
            //     if (groupObj & groupObj.type?.name === constants.types.AKM_MODEL) {
            //         const model = myMetis.findModelByName(groupObj.nameId);
            //         if (model) {
            //             model.addObject(obj);
            //         }
            //     }
            // }
        }
        if (obj) {
            if (!myMetis.pasteViewsOnly) {
                const fromObj = context.sourceObject;
                copyProperties(obj, fromObj);
                obj.objectviews = null;
                obj.inputrels = null;
                obj.outputrels = null;
            }
            gjsData.object = obj;
            gjsData.category = 'Object';
            myDiagram.model.setDataProperty(gjsData, 'category', gjsData.category);
            // Include the new object in the current model
            myModel?.addObject(obj);
            myMetis.addObject(obj);
            // Create the corresponding object view
            const oviews = obj.objectviews;
            const oview0 = oviews?.length > 0 ? oviews[0] : null;
            const key = gjsData.key;
            objview = new akm.cxObjectView(key, obj.name, obj, "");
            if (objview) {
                const goNode = new gjs.goObjectNode(objview.id, myGoModel, objview);
                if (goNode) {
                    goNode.loc = gjsData.loc;
                    goNode.size = gjsData.size;
                    const containerType = myMetis.findObjectTypeByName(constants.types.AKM_CONTAINER);
                    const hasMemberType = myMetis.findRelationshipTypeByName(constants.types.AKM_HAS_MEMBER);
                    const group = getGroupByLocation(myGoModel, goNode.loc, goNode.size, goNode);
                    if (group) {
                        const parentgroup = group;
                        goNode.group = parentgroup.key;
                        goNode.objectview.group = parentgroup.objectview.id;
                        myDiagram.model.setDataProperty(gjsData, "group", goNode.group);
                        goNode.scale = new String(goNode.getMyScale(myGoModel));
                        gjsData.scale = Number(goNode.scale);
                        // Check if the group is a container or not
                        if (group.objecttype?.id !== containerType?.id && hasMemberType) {
                            // Check if the group already has a hasMember relationship to the node
                            const rels = group.object.getOutputRelshipsByType(hasMemberType);
                            if (rels.length === 0) {
                                // No hasMember relationship exists between the group and the node
                                // Create a hasMember relationship between the two
                                const rel = new akm.cxRelationship(utils.createGuid(), hasMemberType, group.object,
                                    goNode.object, hasMemberType.name, "");
                                myModel?.addRelationship(rel);
                                myMetis.addRelationship(rel);
                                const jsnRel = new jsn.jsnRelationship(rel);
                                modifiedRelships.push(jsnRel);
                            } else {
                                let found = false;
                                let rel = null;
                                for (let i = 0; i < rels.length; i++) {
                                    rel = rels[i];
                                    if (rel.toObject.id === goNode.object.id) {
                                        // The relationship already exists
                                        found = true;
                                        break;
                                    }
                                }
                                if (!found) {
                                    // Create a hasMember relationship between the two
                                    const rel = new akm.cxRelationship(utils.createGuid(), hasMemberType, group.object,
                                        goNode.object, hasMemberType.name, hasMemberType.description);
                                    myModel?.addRelationship(rel);
                                    myMetis.addRelationship(rel);
                                    const jsnRel = new jsn.jsnRelationship(rel);
                                    modifiedRelships.push(jsnRel);
                                }
                            }
                        }
                    }
                }
                objview.setIsGroup(gjsData.isGroup);
                objview.setLoc(gjsData.loc);
                objview.setSize(gjsData.size);
                objview.setScale(gjsData.scale);
                if (gjsData.isGroup) objview.setMemberscale(gjsData.memberscale);
                gjsData.objectview = objview;
                // Include the object view in the current model view
                obj.addObjectView(objview);
                myModelview.addObjectView(objview);
                myMetis.addObjectView(objview);
                // Then update the gjsNode with its new properties
                // First set name and reference to the objectview
                let n = myDiagram.findNodeForKey(objview.id);
                myDiagram.model.setDataProperty(gjsData, "key", objview.id);
                // myDiagram.model.setDataProperty(gjsData, "type", gjsData.type);
                myDiagram.model.setDataProperty(gjsData, "name", gjsData.name);
                myDiagram.model.setDataProperty(n, "scale", gjsData.scale);
                myDiagram.model.setDataProperty(gjsData, "objectview", objview);
                myDiagram.model.setDataProperty(gjsData, "group", goNode.group);
                // Then set the view properties
                let objtypeView;
                if (context.pasted) {
                    const id = gjsData.typeview?.id;
                    objtypeView = myMetis.findObjectTypeView(id);
                }
                if (oview0) {
                    const otdata = objtypeView.data;
                    for (let prop in otdata) {
                        if (obj[prop]) {
                            objview[prop] = oview0[prop];
                            myDiagram.model.setDataProperty(gjsData, prop, objview[prop]);
                        }
                        else if (oview0[prop]) {
                            objview[prop] = oview0[prop];
                            myDiagram.model.setDataProperty(gjsData, prop, objview[prop]);
                        } else {
                            myDiagram.model.setDataProperty(gjsData, prop, otdata[prop]);
                        }
                    }
                    const goNode = new gjs.goObjectNode(objview.id, myGoModel, objview);
                    myGoModel.addNode(goNode);
                    updateNode(goNode, objtypeView, myDiagram, myGoModel);
                    return objview;
                }
                if (!objtypeView) {
                    const key = utils.createGuid();
                    objtypeView = new akm.cxObjectTypeView(key, objtype.name, objtype, "");
                }
                if (objtypeView) {
                    objview.setTypeView(objtypeView);
                    const otdata = objtypeView.data;
                    // Create the new node                          
                    const goNode = new gjs.goObjectNode(objview.id, myGoModel, objview);
                    updateNode(goNode, objtypeView, myDiagram, myGoModel);
                    goNode.isGroup = gjsData.isGroup;
                    goNode.loc = gjsData.loc;
                    goNode.size = gjsData.size;
                    goNode.scale = gjsData.scale;
                    goNode.memberscale = gjsData.memberscale;
                    myGoModel.addNode(goNode);
                    // myDiagram.model.addNodeData(gjsData);
                    // const n = myDiagram.findNodeForKey(data.key);
                    const group = getGroupByLocation(myGoModel, objview.loc, objview.size, goNode);
                    if (group) {
                        group.memberscale = group.memberscale ? group.memberscale : group.typeview.memberscale;
                        goNode.group = group.key;
                        let scale = Number(group.scale) * Number(group.memberscale);
                        if (scale === 0) scale = 1;
                        goNode.scale = scale.toString();
                        objview.group = group.objectview.id;
                        objview.scale = goNode.scale;
                        myDiagram.model.setDataProperty(gjsData, "group", goNode.group);
                        myDiagram.model.setDataProperty(gjsData, "memberscale", Number(gjsData.memberscale));
                    }
                    // myDiagram.model.setDataProperty(node, "memberscale", Number(gjsData.memberscale));
                    // myDiagram.model.setDataProperty(n, "scale", Number(data.scale));
                }
                // Dispatch hasMember relationships
                modifiedRelships?.map(mn => {
                    let data = (mn) && mn;
                    data = JSON.parse(JSON.stringify(data));
                    context.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data });
                });
                return objview;
            }
        }
    }
    return null;
}

export function createMetaContainer(data: any, context: any): any {
    const myMetamodel = context.myMetamodel;
    const myMetis = context.myMetis;
    const myGoModel = context.myGoMetamodel;
    const myDiagram = context.myDiagram;
    let cont;
    if (data.category === constants.gojs.C_CONTAINER) {
        if (debug) console.log('157 createMetaContainer', data);
        cont = new akm.cxMetaContainer(utils.createGuid(), data.name, "");
        myMetamodel.addMetaContainer(cont);
    }
    return cont;
}

export function createObjectType(data: any, context: any): any {
    const myMetamodel = context.myMetamodel;
    const myMetis = context.myMetis;
    const myGoModel = context.myGoMetamodel;
    const myDiagram = context.myDiagram;
    if (data.category === constants.gojs.C_OBJECTTYPE) {
        if (debug) console.log('170 createObjectType', data);
        const typeid = data.type;
        let typename = data.name;
        let objtype;
        if (typeid === constants.types.OBJECTTYPE_ID) {
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
                    updateNode(data, objtypeView, myDiagram, myGoModel);
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
                            updateNode(data, objtypeView, myDiagram, myGoModel);
                        }
                    }
                }
            }
            return objtype;
        }
    }
}

export function updateObject(nodeData: gjs.goObjectNode, name: string, value: string, context: any) {
    if ((nodeData === null) || (name !== "name") || (!nodeData.objRef)) {
        return;
    } else {
        const myMetis = context.myMetis;
        let currentObject: akm.cxObject = nodeData.object;
        if (!currentObject) {
            currentObject = myMetis.findObject(nodeData.objRef);
        }
        myMetis.addObject(currentObject);
        let currentObjectView: akm.cxObjectView = nodeData.objectview;
        if (!currentObjectView) {
            currentObjectView = myMetis.findObjectView(nodeData.key);
        }
        myMetis.addObjectView(currentObjectView);
        currentObject.setName(value);
        currentObject.setModified();
        if (currentObjectView) {
            currentObjectView.setName(value);
            currentObjectView.setModified();
            currentObject.addObjectView(currentObjectView);
        }
        return currentObject;
    }
}

export function updateObjectType(data: any, name: string, value: string, context: any) {
    if ((data === null) || (name !== "name")) {
        return;
    } else {
        const myMetis = context.myMetis;
        const myMetamodel = context.myMetamodel;
        // Check if this is a type change
        let objtype = data.objecttype;
        objtype = myMetis.findObjectType(objtype.id);
        const typename = data.name;
        if (objtype) {
            if (
                (objtype.name === "New Type")
                ||
                (objtype.name === "New Container")
            ) {
                // This is a new type that gets a new name 
                // Check if the new name already exists
                let otype = myMetis.findObjectTypeByName(typename);
                if (otype) {
                    // Existing type - the new name already exists
                    let typeid = objtype.getId();
                    objtype = otype;
                    utils.removeElementFromArray(myMetamodel.getObjectTypes(), typeid);
                    myMetamodel.addObjectType(objtype);
                    utils.removeElementFromArray(myMetis.getObjectTypes(), typeid);
                    myMetis.addObjectType(objtype);
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
                myMetis.addObjectTypeView(objtypeView);
            } else {
                objtype.setName(typename);
                objtype.setModified();
                myMetamodel.setModified();
                objtypeView.setName(typename);
                objtypeView.setModified();
            }
            context.myDiagram.model.setDataProperty(data, "name", value);
        }
        context.myDiagram.requestUpdate();
    }
}

export function setObjectType(data: any, objtype: akm.cxObjectType, context: any) {
    const myMetis = context.myMetis;
    const myDiagram = context.myDiagram;
    // data, i.e. node
    if (objtype) {
        const objtypeview = objtype.getDefaultTypeView() as akm.cxObjectTypeView;
        const currentObjectView = myMetis.findObjectView(data.key) as akm.cxObjectView;
        const currentObject = currentObjectView?.object;
        if (currentObject) {
            const nameIsChanged = (currentObject.name !== currentObject.type?.name);
            currentObject.setType(objtype);
            currentObject.setModified();
            if (currentObjectView) {
                currentObjectView.setTypeView(objtypeview);
                currentObjectView.setModified();
                currentObjectView.setObject(currentObject);
                if (!nameIsChanged) {
                    myDiagram.model.setDataProperty(data, "name", objtype.name);
                }
                myDiagram.model.setDataProperty(data, "typename", objtype.name);
                // Apply local overrides
                currentObjectView['template'] = data.template;
                currentObjectView['figure'] = data.figure;
                currentObjectView['fillcolor'] = data.fillcolor;
                currentObjectView['strokecolor'] = data.strokecolor;
                currentObjectView['strokewidth'] = data.strokewidth;
                currentObjectView['icon'] = data.icon;
                // Update data (node)
                data.objtypeRef = objtype.id;
                data.typename = objtype.name;
                data.typeview = objtypeview;
                updateNode(data, objtypeview, myDiagram, myMetis.gojsModel);
                if (debug) console.log('394 node', data);
                // Dispatch
                const jsnObjview = new jsn.jsnObjectView(currentObjectView);
                if (debug) console.log('397 jsnObjview', jsnObjview);
                const modifiedObjectViews = new Array();
                modifiedObjectViews.push(jsnObjview);
                modifiedObjectViews.map(mn => {
                    let data = mn;
                    data = JSON.parse(JSON.stringify(data));
                    myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
                })
            }
            const jsnObject = (currentObject) && new jsn.jsnObject(currentObject);
            if (debug) console.log('407 jsnObject', jsnObject);
            const modifiedObjects = new Array();
            modifiedObjects.push(jsnObject);
            modifiedObjects.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data })
            })
            return currentObjectView;
        }
    }
}

export function copyObject(fromObj: akm.cxObject,): akm.cxObject {
    let toObj: akm.cxObject;
    toObj = new akm.cxObject(utils.createGuid(), fromObj.name, fromObj.type, fromObj.description);
    for (let prop in fromObj) {
        if (prop === 'id') continue;
        if (prop === 'name') continue;
        if (prop === 'description') continue;
        if (prop === 'inputrels') continue;
        if (prop === 'outputrels') continue;
        if (prop === 'objectviews') continue;
        if (prop === 'relshipviews') continue;
        if (prop === 'modified') continue;
        if (prop === 'generatedTypeId') continue;
        toObj[prop] = fromObj[prop];
    }
    toObj.copiedFromId = fromObj.id;
    return toObj;
}

export function copyRelationship(fromRel: akm.cxRelationship, fromObj: akm.cxObject, toObj: akm.cxObject,): akm.cxRelationship {
    if (debug) console.log('457 fromRel, fromObj, toObj', fromRel, fromObj, toObj);
    const rtype = fromRel.type as akm.cxRelationshipType;
    let toRel = new akm.cxRelationship(utils.createGuid(), rtype, fromObj, toObj, fromRel.name, fromRel.description);
    if (debug) console.log('459 toRel', toRel);
    toRel.fromObject = fromObj;
    toRel.toObject = toObj;
    for (let prop in fromRel) {
        if (prop === 'id') continue;
        if (prop === 'name') continue;
        if (prop === 'description') continue;
        if (prop === 'modified') continue;
        if (prop === 'generatedTypeId') continue;
        if (prop === 'fromObject') continue;
        if (prop === 'toObject') continue;
        if (prop === 'relshipviews') continue;
        toRel[prop] = fromRel[prop];
    }
    return toRel;
}

export function copyProperties(toObj: akm.cxObject, fromObj: akm.cxObject) {
    for (let prop in fromObj) {
        if (prop === 'id') continue;
    //     if (prop === 'name') continue;
    //     if (prop === 'description') continue;
        if (prop === 'inputrels') continue;
        if (prop === 'outputrels') continue;
        if (prop === 'objectviews') continue;
        if (prop === 'relshipviews') continue;
        if (prop === 'modified') continue;
        if (prop === 'generatedTypeId') continue;
    //     toObj[prop] = fromObj[prop];
    // }
        if (isPropIncluded(prop, toObj.type))
            toObj[prop] = fromObj[prop];
    }
}
export function copyViewAttributes(toObjview: akm.cxObjectView, fromObjview: akm.cxObjectView) {
    try {
    toObjview["isGroup"]      = fromObjview["isGroup"];
    toObjview["groupLayout"]  = fromObjview["groupLayout"];
    toObjview["size"]         = fromObjview["size"];
    toObjview["scale"]        = fromObjview["scale"];
    toObjview["memberscale"]  = fromObjview["memberscale"];
    toObjview["arrowscale"]   = fromObjview["arrowscale"];
    toObjview["icon"]         = fromObjview["icon"];
    toObjview["routing"]      = fromObjview["routing"];
    toObjview["image"]        = fromObjview["image"];
    toObjview["linkcurve"]    = fromObjview["linkcurve"];
    toObjview["fillcolor"]    = fromObjview["fillcolor"];
    toObjview["fillcolor1"]   = fromObjview["fillcolor1"];
    toObjview["fillcolor2"]   = fromObjview["fillcolor2"];
    toObjview["strokecolor"]  = fromObjview["strokecolor"];
    toObjview["strokecolor1"] = fromObjview["strokecolor1"];
    toObjview["strokecolor2"] = fromObjview["strokecolor2"];
    toObjview["strokewidth"]  = fromObjview["strokewidth"];
    toObjview["textcolor"]    = fromObjview["textcolor"];
    toObjview["textcolor2"]   = fromObjview["textcolor2"];
    toObjview["textscale"]    = fromObjview["textscale"];
    } catch (error) {
    }
}

export function getKey(collection, name) {
    for (let i = 0; i < collection.length; i++) {
        if (collection[i].name === name) {
            return collection[i].key;
        }
    }
    return null;
}

export function deleteObjectType(data: any, context: any) {
}

export function deleteRelationshipType(reltype: akm.cxRelationshipType, deletedFlag: boolean) {
    if (reltype) {
        // Check if relationships of this type exists
        reltype.markedAsDeleted = deletedFlag;
    }
}

export function deleteObjectTypeView(objview: akm.cxObjectView, deletedFlag: boolean) {

    const object = objview?.object;
    const objtype = object?.type;
    const typeview = objview?.typeview;
    const defaultTypeview = objtype?.typeview as akm.cxObjectTypeView;
    if (typeview && defaultTypeview) {
        if (typeview.id !== defaultTypeview.id) {
            if (typeview.markedAsDeleted !== deletedFlag) {
                typeview.markedAsDeleted = deletedFlag;
            }
        }
    }
}

export function deleteRelshipTypeView(relview: akm.cxRelationshipView, deletedFlag: boolean) {

    const relship = relview?.relship;
    const reltype = relship?.type;
    const typeview = relview?.typeview;
    const defaultTypeview = reltype?.typeview;
    if (typeview && defaultTypeview) {
        if (typeview.id !== defaultTypeview.id) {
            if (typeview.markedAsDeleted !== deletedFlag) {
                typeview.markedAsDeleted = deletedFlag;
            }
        }
    }
}

export function deleteNode(data: any, deletedFlag: boolean, context: any) {
    const myMetis = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const myModelview = context.myModelview;
    const myDiagram = context.myDiagram;
    const selection = myDiagram.selection;
    if (data.category === constants.gojs.C_OBJECTTYPE) {
        const myGoMetamodel = context.myGoMetamodel;
        let node = myGoMetamodel?.findNode(data.key) as gjs.goObjectNode;
        if (node) {
            let typename = data.name;
            let objtype = myMetamodel.findObjectTypeByName(typename);
            if (objtype) {
                objtype.markedAsDeleted = deletedFlag;
                let objtypeview = objtype.getDefaultTypeView();
                if (objtypeview) {
                    objtypeview.markedAsDeleted = deletedFlag;
                }
                // Replace myGoModel.nodes with a new array
                // let nodes = new Array();
                // if (myGoMetamodel) {
                //     for (let i = 0; i < myGoMetamodel.nodes?.length; i++) {
                //         let n = myGoMetamodel.nodes[i];
                //         if (n.key !== node.key) {
                //             nodes.push(n);
                //         }
                //     }
                //     myGoMetamodel.nodes = nodes;
                // }
            }
        }
    } else if (data.category === constants.gojs.C_OBJECT) {
        const myGoModel = context.myGoModel;
        const node: gjs.goObjectNode = myGoModel?.findNode(data.key);
        if (node) {
            node.markedAsDeleted = deletedFlag;
            node.group = "";
            let objview = node.objectview;
            if (!objview) objview = myMetis.findObjectView(data.key) as akm.cxObjectView;
            if (!objview) return;
            objview.markedAsDeleted = deletedFlag;
            const object = objview.object;
            // If group, delete members of group
            if (node.isGroup) {
                if (debug) console.log('479 delete container', objview);
                const groupMembers = node.getGroupMembers(myGoModel);
                for (let i = 0; i < groupMembers?.length; i++) {
                    const member = groupMembers[i];
                    deleteNode(member, deletedFlag, context);
                    myDiagram.requestUpdate();
                }
            }
            // If deleteViewsOnly we're done
            if (myMetis.deleteViewsOnly) {
                return;
            }
            // Else handle delete object
            if (object) {
                // Remove the object view from the object
                object.removeObjectView(objview);
                objview.markedAsDeleted = deletedFlag;
                // Remove the object view from the object
                const n = myDiagram.findNodeForKey(objview.id);
                myDiagram.startTransaction("remove node");
                myDiagram.remove(n);
                myDiagram.commitTransaction("remove node");
            }
            myDiagram.requestUpdate();
            // Handle connected relationships
            let connectedRels = object?.inputrels;
            for (let i = 0; i < connectedRels?.length; i++) {
                const rel = connectedRels[i];
                if (rel.markedAsDeleted !== deletedFlag) {
                    rel.markedAsDeleted = deletedFlag;
                    const relviews = rel.relshipviews;
                    for (let i = 0; i < relviews?.length; i++) {
                        const relview = relviews[0];
                        if (relview) {
                            const link = myGoModel.findLinkByViewId(relview.id);
                            if (link) {
                                link.markedAsDeleted = deletedFlag;
                                const l = myDiagram.findLinkForKey(relview.id);
                                // myDiagram.startTransaction("remove link");
                                // myDiagram.remove(l);
                                // myDiagram.commitTransaction("remove link");                                myDiagram.remove(l);
                                myDiagram.model.removeLinkData(link);
                            }
                            relview.markedAsDeleted = deletedFlag;
                        }
                    }
                }
            }
            connectedRels = object?.outputrels;
            for (let i = 0; i < connectedRels?.length; i++) {
                const rel = connectedRels[i];
                if (rel.markedAsDeleted !== deletedFlag) {
                    rel.markedAsDeleted = deletedFlag;
                    const relviews = rel.relshipviews;
                    for (let i = 0; i < relviews?.length; i++) {
                        const relview = relviews[0];
                        if (relview) {
                            const link = myGoModel.findLinkByViewId(relview.id);
                            if (link) link.markedAsDeleted = deletedFlag;
                            relview.markedAsDeleted = deletedFlag;
                        }
                    }
                }
            }
        }
    }
}

export function deleteLink(data: any, deletedFlag: boolean, context: any) {
    const myMetis = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const myModel = context.myModel;
    const myModelview = context.myModelview;
    const myGoModel = context.myGoModel;
    const myDiagram = context.myDiagram;
    
    // Replace myGoModel.links with a new array
    const links = new Array();
    for (let i = 0; i < myGoModel?.links.length; i++) {
        let lnk = myGoModel.links[i];
        links.push(lnk);
    }
    myGoModel.links = links;
    const link = myGoModel?.findLink(data.key) as gjs.goRelshipLink;
    if (link) {
        const relview = myModelview.findRelationshipView(data.key) as akm.cxRelationshipView;
        if (relview) {
            const relship = relview.relship;
            // Handle deleteViewsOnly
            if (myMetis.deleteViewsOnly) {
                relview.markedAsDeleted = deletedFlag;
                // relship?.removeRelationshipView(relview);
                if (debug) console.log('707 deleteLink', relship, relview);
                link.markedAsDeleted = deletedFlag;
                const l = myDiagram.findLinkForKey(relview.id);
                myDiagram.startTransaction("remove link");
                myDiagram.remove(l);
                myDiagram.commitTransaction("remove link");                                myDiagram.remove(l);
                return;
            }
            // Else handle delete relships AND relship views
            // First delete relship
            if (relship) {
                relship.markedAsDeleted = deletedFlag;
                relview.markedAsDeleted = deletedFlag;
                const rviews = myMetis?.getRelationshipViewsByRelship(relship.id);
                if (rviews) {
                    for (let i = 0; i < rviews.length; i++) {
                        const rview = rviews[i];
                        if (debug) console.log('721 rview', rview);
                        if (!rview.markedAsDeleted) {
                            rview.markedAsDeleted = deletedFlag;
                            if (debug) console.log('725 rview', rview);
                        }
                    }
                }
            }
        }
    }
}

export function addNodeToDataArray(parent: any, node: any, myGoModel: gjs.goModel, objview: akm.cxObjectView) {
    const nodeArray = parent.nodeDataArray;
    const newArray = new Array();
    for (let i = 0; i < nodeArray.length; i++) {
        const n = nodeArray[i];
        if (n) newArray.push(n);
    }
    //newArray.push(node);
    const myNode = new gjs.goObjectNode(objview.id, myGoModel, objview);
    myNode.loc = node.loc;
    myNode.size = node.size;
    myNode.parentModelRef = node.parentModelRef;
    myNode.type = node.type;
    const objtype = objview.object?.type;
    const typeview = objtype?.typeview;
    myNode.typeview = typeview as akm.cxObjectTypeView;
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

// functions to handle relationships
export function createRelationship(gjsFromNode: any, gjsToNode: any, context: any) {
    // gjsFromNode and gjsToNode are the nodes connected by the relationship
    const myDiagram = context.myDiagram;
    const myGoModel: gjs.goModel = context.myGoModel;
    const myMetis: akm.cxMetis = context.myMetis;
    const entityType = myMetis.findObjectTypeByName(constants.types.AKM_ENTITY_TYPE);
    let myMetamodel: akm.cxMetaModel = myMetis.currentMetamodel;
    const myModelview: akm.cxModelView = context.myModelview;

    const fromObjview = context.fromObjView;
    let fromObject = fromObjview.object;
    if (!fromObject)
        fromObject = myMetis.findObject(fromObjview.objectRef);
    const toObjview = context.toObjView;;
    let toObject = toObjview.object;
    if (!toObject)
        toObject = myMetis.findObject(toObjview.objectRef);
    const fromPort = "";
    const toPort = "";
    let reltype, fromType, toType;
    let fromTypeRef = fromObject?.typeRef;
    if (fromTypeRef) {
        fromType = myMetamodel.findObjectType(fromObject?.typeRef);
        if (!fromType) 
            fromType = myMetis.findObjectType(fromObject?.typeRef);
    }
    let toTypeRef = toObject?.typeRef;
    if (toTypeRef) {
        toType = myMetamodel.findObjectType(toObject?.typeRef);
        if (!toType) 
            toType = myMetis.findObjectType(toObject?.typeRef);
    }
    let metamodel = myMetamodel;
    let metamodel2 = myMetamodel;
    const submetamodelRefs = myMetamodel.submetamodelRefs;
    if (!fromType) {
        for (let i = 0; i < submetamodelRefs?.length; i++) {
            let mmodelRef = submetamodelRefs[i];
            let mmodel = myMetis.findMetamodel(mmodelRef);
            fromType = mmodel.findObjectType(fromObject?.typeRef);
            if (fromType) {
                metamodel = mmodel;
                break;
            }
        }
    }
    if (!toType) {
        for (let i = 0; i < submetamodelRefs?.length; i++) {
            let mmodelRef = submetamodelRefs[i];
            let mmodel = myMetis.findMetamodel(mmodelRef);
            toType = mmodel.findObjectType(toObject?.typeRef);
            if (toType) {
                metamodel2 = mmodel;
                break;
            }
        }
    }
    myMetamodel = metamodel;
    const relshiptypes = metamodel.relshiptypes;
    for (let i = 0; i < relshiptypes.length; i++) {
        const rtype = relshiptypes[i];
        myMetis.fixObjectTypeRefs(rtype);
    }
    if (fromType && toType) {
        const appliesToLabel = fromType.name === constants.types.AKM_LABEL;
        let defText = appliesToLabel ? constants.types.AKM_ANNOTATES : "";
        let includeInherited = false;
        if (myModelview.includeInheritedReltypes) {
            includeInherited = true;
        }
        let reltypes: akm.cxRelationshipType[] = [];
        if (!myModelview.isMetamodel) { // IS NOT Metamodel
            if (metamodel.id === metamodel2.id) {
                // Handle OSDU relationships
                reltypes = metamodel.findRelationshipTypesBetweenTypes(fromType, toType, includeInherited);
                if (fromType.name === constants.types.AKM_OSDUTYPE) {
                    if (toType.name === constants.types.AKM_PROPERTY) {
                        const rtype = metamodel.findRelationshipTypeByName(constants.types.AKM_HAS_PROPERTY);
                        reltypes.push(rtype);
                    }
                }            
            } else {
                const rtypes = myMetis.findRelationshipTypesBetweenTypes(fromType, toType, includeInherited);
                for (let i = 0; i < rtypes.length; i++) {
                    const rtype = rtypes[i];
                    reltypes.push(rtype);
                }
            }
            if (!myModelview.isMetamodel) {
                if (metamodel.id === metamodel2.id) {
                    reltypes = metamodel.findRelationshipTypesBetweenTypes(fromType, toType, includeInherited);
                    if (fromType.name === constants.types.AKM_OSDUTYPE) {
                        if (toType.name === constants.types.AKM_PROPERTY) {
                            const rtype = metamodel.findRelationshipTypeByName(constants.types.AKM_HAS_PROPERTY);
                            reltypes.push(rtype);
                        }
                    }            
                    if (fromType.name === constants.types.AKM_ENTITY_TYPE && toType.name === constants.types.AKM_ENTITY_TYPE) {
                        // reltypes = [];
                        let rtype = myMetis.findRelationshipTypeByName(constants.types.AKM_IS);
                        reltypes.push(rtype);
                        rtype = myMetis.findRelationshipTypeByName(constants.types.AKM_RELATIONSHIP_TYPE);
                        reltypes.push(rtype);
                    }
                } else {
                    const rtypes = myMetis.findRelationshipTypesBetweenTypes(fromType, toType, includeInherited);
                    for (let i = 0; i < rtypes.length; i++) {
                        const rtype = rtypes[i];
                        reltypes.push(rtype);
                    }
                }
            }
        } else {
            // IS Metamodel
            reltypes = myMetamodel.findRelationshipTypesBetweenTypes(fromType, toType, false);
            if (fromType.name === constants.types.AKM_OSDUTYPE) {
                if (toType.name === constants.types.AKM_PROPERTY) {
                    const rtype = myMetamodel.findRelationshipTypeByName(constants.types.AKM_HAS_PROPERTY);
                    reltypes.push(rtype);
                }
            }
            else if (fromType.name === constants.types.AKM_ENTITY_TYPE && toType.name === constants.types.AKM_ENTITY_TYPE) {
                reltypes = [];
                let rtype = myMetamodel.findRelationshipTypeByName(constants.types.AKM_IS);
                reltypes.push(rtype);
                rtype = myMetamodel.findRelationshipTypeByName(constants.types.AKM_RELATIONSHIP_TYPE);
                reltypes.push(rtype);
            }
        }
        if (reltypes) {
            const rtype = myMetis.findRelationshipTypeByName(constants.types.AKM_REFERS_TO);
            reltypes.push(rtype);
            if (reltypes) {
                const choices1: string[] = [];
                if (defText.length > 0) choices1.push(defText);
                let choices2: string[] = [];
                for (let i = 0; i < reltypes.length; i++) {
                    const rtype = reltypes[i];
                    if (rtype.name === constants.types.AKM_GENERIC_REL)
                        continue
                    choices2.push(rtype.name);
                }
                choices2 = [...new Set(choices2)];
                choices2.sort();
                let choices = choices1.concat(choices2);
                choices = utils.removeArrayDuplicates(choices);
                const modalContext = {
                    what: "selectDropdown",
                    title: "Select Relationship Type",
                    case: "Create Relationship",
                    myDiagram: myDiagram,
                    myGoModel: myGoModel,
                    myMetamodel: metamodel,
                    context: context,
                    data: context.data,
                    typename: defText,
                    fromType: fromType,
                    toType: toType,
                    gjsFromNode: gjsFromNode,
                    portFrom: fromPort,
                    gjsToNode: gjsToNode,
                    portTo: toPort,
                }
                context.handleOpenModal(choices, modalContext);
            }
        }
    }
}

export function createRelshipCallback(args: any): akm.cxRelationshipView {
    let relshipview: akm.cxRelationshipView;
    const myDiagram = args.context.myDiagram;
    const myGoModel: gjs.goModel = args.context.myGoModel;
    const myMetis: akm.cxMetis = args.context.myMetis;
    const myMetamodel: akm.cxMetaModel = args.metamodel;
    const myModel: akm.cxModel = args.context.myModel;
    const myModelview: akm.cxModelView = myMetis.currentModelview;
    let data = args.context.gjsData;
    const typename = args.typename;
    const gjsFromKey = data.from;
    const portFrom = args.fromPort;
    const gjsToKey = data.to;
    const portTo = args.toPort;
    const context  = args.context;
    let fromObjview: akm.cxObjectView ;
    fromObjview = myModelview.findObjectView(gjsFromKey);
    let objFrom: akm.cxObject = fromObjview.object;
    if (!objFrom) {
        objFrom = myMetis.findObject(fromObjview.objectRef);
    }
    let toObjview: akm.cxObjectView ;
    toObjview = myModelview.findObjectView(gjsToKey);
    let objTo: akm.cxObject = toObjview.object;
    if (!objTo) {
        objTo = myMetis.findObject(toObjview.objectRef);
    }
    let fromType: akm.cxObjectType = args.fromType;
    let toType: akm.cxObjectType = args.toType;
    let reltypes = myMetamodel.findRelationshipTypesBetweenTypes(fromType, toType, true);
    if (!reltypes) reltypes = myMetis.findRelationshipTypesBetweenTypes(fromType, toType, true);
    let reltype: akm.cxRelationshipType;
    if (reltypes) {
        for (let i = 0; i < reltypes.length; i++) {
            reltype = reltypes[i];
            if (reltype.name === constants.types.AKM_GENERIC_REL) {
                continue;
            } else {
                if (reltype.name === typename) // reltype found
                    break;
            }
        }
    }
    if (!reltype || reltype.name !== typename) // reltype not found, try another way
        reltype = myMetis.findRelationshipTypeByName2(typename, fromType, toType);
    if (!reltype) {
        alert("Relationship type given does not exist!")
        myDiagram.model.removeLinkData(data);
        return;
    }
    // reltype is found - look for the relationship
    let relship = myModel.findRelationship2(objFrom, objTo, typename, reltype, portFrom, portTo);
    if (relship && !relship.markedAsDeleted) {
        // The relationship already exists
        // Check if relationship view also exists
        const relviews = myModelview.findRelationshipViewsByRel(relship, true);
        for (let i = 0; i < relviews.length; i++) {
            const relview = relviews[i];
            if (!relview.markedAsDeleted) {
                // Relationship view already exists
                // Do nothing
                alert("Relationship already exists!\nOperation is cancelled.")
                return relviews[i];
            }
        }
    } else {
        relship = new akm.cxRelationship(utils.createGuid(), reltype, objFrom, objTo, typename, "");
        objFrom.addOutputrel(relship);
        objTo.addInputrel(relship);
        myModel.addRelationship(relship);
        myMetis.addRelationship(relship);
    }
    if (relship) {
        const context = {
            myDiagram: myDiagram,
            myMetis: myMetis,
            myModelview: myModelview,
            myGoModel: myGoModel,
            fromObjview: fromObjview,
            toObjview: toObjview,
            gjsFromKey: gjsFromKey,
            gjsToKey: gjsToKey,
            reltype: reltype,
            data: data,
            
        }
        relshipview = createRelationshipView(relship, context);
    }
    return relshipview;
}

export function createRelationshipView(rel: akm.cxRelationship, context: any): akm.cxRelationshipView {
    let modifiedRelships = new Array();
    let modifiedRelshipViews = new Array();
    const myDiagram = context.myDiagram;
    const myMetis = context.myMetis;
    const myModelview = context.myModelview;
    const myGoModel = myMetis.gojsModel;
    let gjsFromKey = context.gjsFromKey;
    let gjsToKey = context.gjsToKey;
    if (!gjsFromKey) gjsFromKey = context.nodeFrom.key;
    if (!gjsToKey)  gjsToKey = context.nodeTo.key;
    const goFromNode = context.goFromNode;
    const fromObjview = context.fromObjview;
    const fromObj = fromObjview.object;
    const goToNode = context.goToNode;
    const toObjview = context.toObjview;
    const reltype = context.reltype;
    let data = context.data;
    const relTypename = reltype.name; // context.relTypename;
    const relview = new akm.cxRelationshipView(utils.createGuid(), rel.name, rel, "");
    relview.fromObjview = fromObjview;
    relview.toObjview = toObjview;
    rel.addRelationshipView(relview);
    if (context.reltype?.name === constants.types.AKM_HAS_MEMBER) {
        if (fromObj?.type.name === constants.types.AKM_CONTAINER) {
            relview.strokecolor = '#dddddd50';
            relview.textcolor = '#dddddd50';
        }
    }
    fromObjview.addOutputRelview(relview);
    toObjview.addInputRelview(relview);
    const goRelshipLink = new gjs.goRelshipLink(relview.id, myGoModel, relview);
    myModelview.addRelationshipView(relview);
    myMetis.addRelationshipView(relview);
    myGoModel.addLink(goRelshipLink);
    myDiagram.startTransaction('CreateLink');
    // create a link data between the actual nodes
    let linkdata = {
        key:    relview?.id,
        name:   relTypename,
        category: constants.gojs.C_RELATIONSHIP,
        from:   gjsFromKey, 
        to:     gjsToKey,
        relshipRef: rel?.id,
        relviewRef: relview?.id,
        reltypeRef: reltype?.id,
        reltypeview: reltype?.typeview?.id,
    };
    // set the link attributes
    const rtviewdata = reltype?.typeview?.data;
    for (let prop in rtviewdata) {
        if (prop === 'id') continue;
        if (prop === 'name') continue;
        if (prop === 'nameId') continue;
        if (prop === 'category') continue;
        if (prop === 'abstract') continue;
        if (prop === 'class') continue;
        if (prop === 'sourceUri') continue;
        if (prop === 'markedAsDeleted') continue;
        if (prop === 'modified') continue;
        if (prop === 'typeRef') continue;
        if (prop === 'data') continue;
        linkdata[prop] = rtviewdata[prop];
    }
    // and add the link data to the model
    if (data) myDiagram.model.removeLinkData(data);
    myDiagram.model.addLinkData(linkdata);
    uid.updateLinkAndView(linkdata, goRelshipLink, relview, myDiagram);
    myDiagram.commitTransaction('CreateLink');

    // Prepare for dispatch
    const jsnRelship = new jsn.jsnRelationship(rel);
    modifiedRelships.push(jsnRelship);
    const jsnRelview = new jsn.jsnRelshipView(relview);
    modifiedRelshipViews.push(jsnRelview);
    // Dispatch
    modifiedRelships.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
    })
    modifiedRelshipViews.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
    })
    return relview;
}

// gjsFromNode, gjsToNode, goFromLink, pastedNodes, context
export function pasteRelationship(gjsTargetLink, context) {
    const myDiagram = context.myDiagram;
    const myGoModel: gjs.goGoModel = context.myGoModel;
    const myMetis = context.myMetis;
    const myModelview = myMetis.currentModelview;

    // Find source objects
    let gjsTargetFromKey = gjsTargetLink.from;
    let gjsTargetToKey = gjsTargetLink.to;
    let gjsTargetKey = gjsTargetLink.key;

    // Find pasted objects
    let targetFromObjview = myModelview.findObjectView(gjsTargetFromKey);
    let targetToObjview = myModelview.findObjectView(gjsTargetToKey);
    let targetFromObj = targetFromObjview?.object;
    let targetToObj = targetToObjview?.object;

    // Create new relship
    let reltype: akm.cxRelationshipType = context.reltype;
    let pastedRelview: akm.cxRelationshipView;
    if (targetFromObj && targetToObj) {
        const relname = context.relname;
        const description = context.description;
        let pastedRelship = new akm.cxRelationship(utils.createGuid(), reltype, 
                                                    targetFromObj, targetToObj, 
                                                    relname, description);
        const key = gjsTargetKey;
        pastedRelview = new akm.cxRelationshipView(key, relname, pastedRelship, description);
        pastedRelview.fromObjview = targetFromObjview;
        pastedRelview.toObjview = targetToObjview;
        // Handle points
        const points = [];
        for (let it = gjsTargetLink.points.iterator; it?.next();) {
            const point = it.value;
            points.push(point.x)
            points.push(point.y)
        }
        pastedRelview.points = points;
        myModelview.addRelationshipView(pastedRelview);
        myMetis.addRelationshipView(pastedRelview);
    }
    return pastedRelview;
}

export function updateRelationship(data: any, name: string, value: string, context: any) {
    if (debug) console.log('1193 updateRelationship', name, value, data);
    if ((data === null) || (!data.relship)) {
        return;
    } else {
        const myDiagram = context.myDiagram;
        let currentRelship = data.relship;
        let currentRelshipView = data.relshipview;
        currentRelship.setName(value);
        currentRelship.setModified();
        currentRelshipView.setName(value);
        currentRelshipView.setModified();
        myDiagram.model.setDataProperty(data, "name", value);
        return currentRelship;
    }
}

export function createRelationshipType(fromTypeNode: any, toTypeNode: any, data: any, context: any) {
    const myMetis = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const myGoMetamodel = context.myGoMetamodel;
    const myDiagram = context.myDiagram;
    let typename = prompt("Enter type name:", "typename");
    if (debug) console.log('1215 typename', typename, myMetamodel);
    data.key = utils.createGuid();
    myDiagram.model.setDataProperty(data, "name", typename);
    if (data.name == null) {
        myDiagram.model.removeLinkData(data);
        if (debug) console.log('1220 data', data);
        return;
    }
    myDiagram.model.setDataProperty(data, "category", constants.gojs.C_RELSHIPTYPE);
    typename = data.name;
    if (debug) console.log('1225 data', data, myGoMetamodel);
    if (typename) {
        if (debug) console.log('1227 from and to type nodes', fromTypeNode, toTypeNode);
        if (fromTypeNode && toTypeNode) {
            const fromObjType = fromTypeNode.objecttype;
            const toObjType = toTypeNode.objecttype;
            let reltype = myMetis.findRelationshipTypeByName1(typename, fromObjType, toObjType);
            if (debug) console.log('1230 reltype', reltype);
            if (reltype) {  // Existing type - create a copy                  
                const relkind = reltype.getRelshipKind();
                const reltype2 = new akm.cxRelationshipType(utils.createGuid(), reltype.name, fromObjType, toObjType, "");
                reltype2.setModified();
                reltype2.setRelshipKind(relkind);
                myDiagram.model.setDataProperty(data, "reltype", reltype2);
                myDiagram.model.setDataProperty(data, "category", constants.gojs.C_RELSHIPTYPE);
                myMetamodel.addRelationshipType(reltype2);
                myMetis.addRelationshipType(reltype2);
                if (debug) console.log('1242 reltype2', reltype2);
                const reltypeView = reltype.getDefaultTypeView();
                //reltype2.setDefaultTypeView(reltypeView);
                if (reltypeView) {
                    // Copy reltypeview
                    const id = utils.createGuid();
                    const name = reltype2.name + '_' + relkind;
                    const reltypeView2 = new akm.cxRelationshipTypeView(id, name, reltype2, "");
                    if (debug) console.log('1249 reltypeView2', reltypeView2);
                    reltypeView2.setModified();
                    reltypeView2.setRelshipKind(relkind);
                    const viewdata = reltypeView.getData();
                    if (debug) console.log('1253 viewdata', viewdata);
                    const viewdata2 = reltypeView2.getData();
                    for (let prop in viewdata) {
                        viewdata2[prop] = viewdata[prop];
                    }
                    if (debug) console.log('1258 reltypeView2', viewdata2, reltypeView2);
                    reltype2.setDefaultTypeView(reltypeView2);
                    myMetamodel.addRelationshipTypeView(reltypeView2);
                    myMetis.addRelationshipTypeView(reltypeView2);
                    updateLink(data, reltypeView2, myDiagram);
                    myDiagram.model.setDataProperty(data, "typeview", reltypeView2);
                    myDiagram.requestUpdate();
                }
                if (debug) console.log('1266 reltype2', reltype2, myMetis);
                return reltype2;
            } else {   // New relationship type - create it                
                if (debug) console.log('1269 reltype', reltype);
                let typeid = utils.createGuid();
                reltype = new akm.cxRelationshipType(typeid, data.name, null, null, "");
                if (reltype) {
                    if (debug) console.log('1273 reltype', reltype);
                    myDiagram.model.setDataProperty(data, "reltype", reltype);
                    myDiagram.model.setDataProperty(data, "category", constants.gojs.C_RELSHIPTYPE);
                    reltype.setModified();
                    reltype.setFromObjtype(fromObjType);
                    reltype.setToObjtype(toObjType);
                    if (debug) console.log('1279 reltype', reltype);
                    myMetamodel.addRelationshipType(reltype);
                    myMetis.addRelationshipType(reltype);
                    // Then create the default relationship typeview
                    const name = reltype.name + '_' + reltype.getRelshipKind();
                    const reltypeView = new akm.cxRelationshipTypeView(utils.createGuid(), name, reltype, "");
                    if (reltypeView) {
                        if (debug) console.log('1285 reltypeView', reltypeView);
                        reltypeView.setModified();
                        myDiagram.model.setDataProperty(data, "typeview", reltypeView);
                        reltype.setDefaultTypeView(reltypeView);
                        myMetamodel.addRelationshipTypeView(reltypeView);
                        myMetis.addRelationshipTypeView(reltypeView);
                        updateLink(data, reltypeView, myDiagram);
                        myDiagram.requestUpdate();
                        if (debug) console.log('1293 myMetamodel', myMetamodel);
                    }
                    if (debug) console.log('1295 reltype', reltype);
                    return reltype;
                }
            }
        }
    }
    return null;
}

export function updateRelationshipType(data: any, name: string, value: string, context: any) {
    if (debug) console.log('1305 updateRelationshipType', name, value);
    if ((data === null) || (name !== "name")) {
        return;
    } else {
        const metis = context.myMetis;
        const myMetamodel = context.myMetamodel;
        const myGoMetamodel = context.myGoMetamodel;
        const myDiagram = context.myDiagram;
        const typename = value;
        // Check if this is a type change
        let reltype = metis.findRelationshipType(data.reltype.id);
        if (debug) console.log('1316 updateRelationshipType', reltype);
        if (reltype) {
            if (
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
                if (debug) console.log('1341 updateRelationshipType', reltype);
                myMetamodel.setModified();
            }
            // Get relationship typeview
            let reltypeView = reltype.getDefaultTypeView();
            if (!reltypeView) {
                const name = typename + '_' + reltype.getRelshipKind();
                reltypeView = new akm.cxRelationshipTypeView(utils.createGuid(), name, reltype, "");
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
                for (prop in viewdata) {
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
    const myMetis = context.myMetis;
    const myGoMetamodel = context.myGoMetamodel;
    const myDiagram = context.myDiagram;

    if (reltype) {
        const reltypeview = reltype.getDefaultTypeView();
        const currentRelship = myMetis.findRelationship(data.relship.id);
        if (currentRelship) {
            let name = data.name;
            const nameIsChanged = (name !== currentRelship.type.name);
            if (debug) console.log('1665 data, nameIsChanged, name, currentRelship', data, nameIsChanged, name, currentRelship);
            currentRelship.setType(reltype);
            if (!nameIsChanged) {
                name = reltype.name;
                currentRelship.setName(name);
            }
            currentRelship.setModified();
            const currentRelshipView = myMetis.findRelationshipView(data.relshipview.id);
            if (currentRelshipView) {
                currentRelshipView.setTypeView(reltypeview);
                currentRelshipView.setName(name);
                currentRelshipView.setModified();
                currentRelshipView.setRelationship(currentRelship);
                data.relshiptype = reltype;
                // Clear local overrides
                currentRelshipView['strokecolor'] = reltypeview['strokecolor'];
                currentRelshipView['strokewidth'] = reltypeview['strokewidth'];
                currentRelshipView['dash'] = reltypeview['dash'];
                currentRelshipView['fromArrow'] = reltypeview['fromArrow'];
                currentRelshipView['toArrow'] = reltypeview['toArrow'];
                currentRelshipView['fromArrowColor'] = reltypeview['fromArrowColor'];
                currentRelshipView['toArrowColor'] = reltypeview['toArrowColor'];
                updateLink(data, reltypeview, myDiagram);
                myDiagram.model.setDataProperty(data, 'name', name);
                const jsnRelView = new jsn.jsnRelshipView(currentRelshipView);
                if (debug) console.log('1687 SetReltype', jsnRelView);
                const modifiedRelshipViews = new Array();
                modifiedRelshipViews.map(mn => {
                    let data = mn;
                    data = JSON.parse(JSON.stringify(data));
                    myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
                })
            }
            const jsnRelship = (currentRelship) && new jsn.jsnRelationship(currentRelship);
            const modifiedRelships = new Array();
            modifiedRelships.push(jsnRelship);
            modifiedRelships.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                (mn) && myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
            })
            return currentRelshipView;
        }
    }
}

export function updateRelationshipView(relview: akm.cxRelationshipView): akm.cxRelationshipView {
    if (relview) {
        if (!relview.textscale)
            relview.textscale = "1";
        if (!relview.arrowscale)
            relview.arrowscale = "1.3";
        const typeview = relview.typeview;
        if (typeview) {
            const viewdata = typeview.data;
            for (let prop in viewdata) {
                if (relview[prop] === viewdata[prop]) {
                    relview[prop] = "";
                }
            }
        }
        if (relview.strokewidth === "") {
            relview.strokewidth = "1";
        }
    }
    return relview;
}

export function clearRelationshipPoints(modelview: akm.cxModelView, myMetis: akm.cxMetis) {
    const modifiedRelshipViews = new Array();
    if (modelview) {
        const relviews = modelview.relshipviews;
        if (relviews) {
            relviews.map(relview => {
                relview.points = [];
                const jsnRelview = new jsn.jsnRelshipView(relview);
                modifiedRelshipViews.push(jsnRelview);
                const myGoModel = myMetis.gojsModel;
                const myLink = myGoModel.findLinkByViewId(relview.id);
                const link = myMetis.myDiagram.findLinkForKey(myLink.key);
                myMetis.myDiagram.model.setDataProperty(link.data, 'points', []);
            })
        }
        modifiedRelshipViews.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
        })
    }
}

export function deleteRelationship(relship: akm.cxRelationship, modelview: akm.cxModelView, myMetis: akm.cxMetis) {
    let relships = modelview.relships;
    for (let i = 0; i < relships?.length; i++) {
        const rel = relships[i];
        if (rel.id === relship.id) {
            relships.splice(i, 1);
            break;
        }
    }
    relships = myMetis.relships;
    for (let i = 0; i < relships?.length; i++) {
        const rel = relships[i];
        if (rel.id === relship.id) {
            relships.splice(i, 1);
            break;
        }
    }
}

export function deleteRelationshipView(relshipView: akm.cxRelationshipView, modelview: akm.cxModelView, myMetis: akm.cxMetis) {
    let relshipviews = modelview.relshipviews;
    for (let i = 0; i < relshipviews?.length; i++) {
        const rview = relshipviews[i];
        if (rview.id === relshipView.id) {
            relshipviews.splice(i, 1);
            break;
        }
    }
    relshipviews = myMetis.relshipviews;
    for (let i = 0; i < relshipviews?.length; i++) {
        const rview = relshipviews[i];
        if (rview.id === relshipView.id) {
            relshipviews.splice(i, 1);
            break;
        }
    }
}

export function unhideHiddenRelationshipViews(modelview: akm.cxModelView, myMetis: akm.cxMetis) {
    const myDiagram = myMetis.myDiagram;
    const myGoModel = myMetis.gojsModel;
    const relviews = modelview.relshipviews;
    const links = new Array();
    const modifiedRelshipViews = new Array();
    for (let i = 0; i < relviews?.length; i++) {
        const relview = relviews[i];
        if (relview.visible)
            continue;
        relview.visible = true;
        // Find link
        let link = myGoModel.findLinkByViewId(relview.id);
        myDiagram.model.addLinkData(link);
        // Prepare dispatch 
        const jsnRelview = new jsn.jsnRelshipView(relview);
        modifiedRelshipViews.push(jsnRelview);
    }
    // Dispatch
    modifiedRelshipViews.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
    });
    return links;
}

export function addMissingRelationshipViews(modelview: akm.cxModelView, myMetis: akm.cxMetis) {
    const myDiagram = myMetis.myDiagram;
    const myGoModel = myMetis.gojsModel;
    const myModel = myMetis.currentModel;
    const objviews = modelview.objectviews;
    let relshipviews = modelview.relshipviews;
    modelview.relshipviews = utils.removeArrayDuplicates(relshipviews);
    const links = new Array();
    const modifiedObjectViews = new Array();
    const modifiedRelshipViews = new Array();
    for (let i = 0; i < objviews?.length; i++) {    // All objectviews in modelview
        const objview = objviews[i];
        if (objview.markedAsDeleted)
            continue;
        let found = false;
        let rel;
        const obj = objview?.object;              // One object in modelview
        const outrels = obj?.outputrels;          // All outputrels from object
        for (let j = 0; j < outrels?.length; j++) {
            rel = outrels[j];                   // One outputrel from object
            if (rel.markedAsDeleted)
                continue;
            rel = myModel.findRelationship(rel.id); // Find relationship in model
            if (!rel)
                continue;                   // Relationship does not exist in model
            const reltype = rel?.type;              // Relationship exists - get type
            // Check if from- and to-objects have views in this modelview
            const fromObj = rel?.fromObject as akm.cxObject;
            const fromObjviews = modelview.findObjectViewsByObject(fromObj);
            const toObj = rel?.toObject as akm.cxObject;
            const toObjviews = modelview.findObjectViewsByObject(toObj);
            if (fromObjviews.length == 0 || toObjviews.length == 0)
                continue; // One or both objects are not in the modelview
            // Check if relview exists in modelview
            const rviews = modelview.findRelationshipViewsByRel(rel, true);
            if (rviews?.length > 0) {
                // Relview(s) exist 
                const rv = rviews[0];
                const fromObjview = rv.fromObjview;
                const toObjview = rv.toObjview;
                // Check if link exists
                let link;
                const myLink = uid.getLinkByViewId(rv.id, myDiagram);
                if (myLink) {
                    link = myDiagram.findLinkForKey(rv.id);
                    if (link) {
                        if (!link.fromNode) {
                            link.fromNode = uid.getNodeByViewId(fromObjview.id, myDiagram);
                            link.from = link.fromNode?.key;
                        }
                        if (!link.toNode) {
                            link.toNode = uid.getNodeByViewId(toObjview.id, myDiagram);
                            link.to = link.toNode?.key;
                        }
                        if (link.from && link.to) 
                            myDiagram.model.addLinkData(link);

                        continue;  // Link exists - do nothing
                    }
                } else {
                    // Link does not exist - create it
                    link = new gjs.goRelshipLink(rv.id, myGoModel, rv);
                    link.loadLinkContent(myGoModel);
                    link.fromNode = uid.getNodeByViewId(fromObjview.id, myDiagram);
                    link.from = link.fromNode?.key;
                    link.toNode = uid.getNodeByViewId(toObjview.id, myDiagram);
                    link.to = link.toNode?.key;
                    myGoModel.addLink(link);
                    links.push(link);
                    myDiagram.model.addLinkData(link);
                }
                // Prepare dispatch
                const jsnRelview = new jsn.jsnRelshipView(rv);
                modifiedRelshipViews.push(jsnRelview);
                continue;
            } else {
                // Relview is missing - create it
                // Relview(s) does not exist, but from and to objviews exist, create relview(s)
                const relview = new akm.cxRelationshipView(utils.createGuid(), rel.name, rel, rel.description);
                let fromObjview = null;
                for (let i = 0; i < fromObjviews?.length; i++) {
                    const oview = fromObjviews[i];
                    modelview.repairObjectView(oview);
                    const moviews = modelview.objectviews;
                    for (let j = 0; j < moviews?.length; j++) {
                        if (moviews[j].id === oview.id) {
                            fromObjview = oview;
                            break;
                        }
                    }
                }
                let toObjview = null;
                for (let i = 0; i < toObjviews?.length; i++) {
                    const oview = toObjviews[i];
                    modelview.repairObjectView(oview);
                    const moviews = modelview.objectviews;
                    for (let j = 0; j < moviews.length; j++) {
                        if (moviews[j].id === oview.id) {
                            toObjview = oview;;
                            break;
                        }
                    }
                }
                if (fromObjview && toObjview) {
                    relview.setFromObjectView(fromObjview);
                    relview.setToObjectView(toObjview);
                    rel.addRelationshipView(relview);
                    if (debug) console.log('1682 relview', relview);
                    modelview.addRelationshipView(relview);
                    // Add link
                    let link = new gjs.goRelshipLink(relview.id, myGoModel, relview);
                    link.loadLinkContent(myGoModel);
                    link.fromNode = uid.getNodeByViewId(fromObjview.id, myDiagram);
                    link.from = link.fromNode?.key;
                    link.toNode = uid.getNodeByViewId(toObjview.id, myDiagram);
                    link.to = link.toNode?.key;
                    myGoModel.addLink(link);
                    links.push(link);
                    myDiagram.model.addLinkData(link);
                    // Prepare dispatch
                    let jsnObjview = new jsn.jsnObjectView(fromObjview);
                    modifiedObjectViews.push(jsnObjview);
                    jsnObjview = new jsn.jsnObjectView(toObjview);
                    modifiedObjectViews.push(jsnObjview);                    
                    const jsnRelview = new jsn.jsnRelshipView(relview);
                    modifiedRelshipViews.push(jsnRelview);
                }
            }
        }
        continue;
    }
    // Dispatch
    modifiedObjectViews.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
    });
    modifiedRelshipViews.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
    });
    return links;
}

export function addRelationshipViewsToObjectView(modelview: akm.cxModelView, objview: akm.cxObjectView, myMetis: akm.cxMetis) {
    const relviews = new Array();
    const modifiedRelshipViews = new Array();
    const obj = objview.object;
    const outrels = obj?.outputrels;
    const inrels = obj?.inputrels;
    let rels = outrels;
    if (outrels && inrels)
        rels = outrels.concat(inrels);
    else if (inrels)
        rels = inrels;
    else
        rels = outrels;
    if (debug) console.log('1719 rels', rels);
    for (let j = 0; j < rels?.length; j++) {
        const rel = rels[j] as akm.cxRelationship;
        if (!rel)
            continue;
        if (rel.markedAsDeleted)
            continue;
        const rviews = rel.relshipviews;
        const mrelviews = modelview.relshipviews;
        if (debug) console.log('1728 rviews, mrelviews', rviews, mrelviews)
        let found = false;
        if (rviews?.length > 0) {
            for (let i = 0; i < rviews?.length; i++) {
                const rv = rviews[i];
                for (let j = 0; j < mrelviews?.length; j++) {
                    const mrv = mrelviews[j];
                    if (mrv.id === rv.id) {
                        found = true;
                        break;
                    }
                }
            }
            // Relview is NOT missing - do nothing
            if (found)
                continue;
        }
        // Check if from- and to-objects have views in this modelview
        const fromObj = rel.fromObject as akm.cxObject;
        const fromObjviews = fromObj.objectviews;
        if (fromObjviews?.length == 0) {
            // From objview is NOT in modelview - do nothing
            continue;
        }
        if (debug) console.log('1752 fromObjviews', fromObjviews);
        const toObj = rel.toObject as akm.cxObject;
        const toObjviews = toObj.objectviews;
        if (toObjviews?.length == 0) {
            // From objview is NOT in modelview - do nothing
            continue;
        }
        if (debug) console.log('1759 rel', rel);
        // Relview(s) does not exist, but from and to objviews exist, create relview(s)
        const relview = new akm.cxRelationshipView(utils.createGuid(), rel.name, rel, rel.description);
        if (relview.markedAsDeleted) continue;
        let fromObjview = null;
        for (let i = 0; i < fromObjviews?.length; i++) {
            const oview = fromObjviews[i];
            const moviews = modelview.objectviews;
            for (let j = 0; j < moviews.length; j++) {
                if (moviews[j].id === oview.id) {
                    fromObjview = oview;;
                    break;
                }
            }
        }
        let toObjview = null;
        for (let i = 0; i < toObjviews?.length; i++) {
            const oview = toObjviews[i];
            const moviews = modelview.objectviews;
            for (let j = 0; j < moviews?.length; j++) {
                if (moviews[j].id === oview.id) {
                    toObjview = oview;;
                    break;
                }
            }
        }
        if (fromObjview && toObjview) {
            relview.setFromObjectView(fromObjview);
            relview.setToObjectView(toObjview);

            if (debug) console.log('1789 relview', relview);
            modelview.addRelationshipView(relview);
            // Add link
            const myGoModel = myMetis.gojsModel;
            let link = new gjs.goRelshipLink(relview.id, myGoModel, relview);
            link.loadLinkContent(myGoModel);
            myGoModel.addLink(link);
            if (debug) console.log('1796 relview, link', relview, link);
            // Prepare and do the dispatch
            const jsnRelview = new jsn.jsnRelshipView(relview);
            modifiedRelshipViews.push(jsnRelview);
            myMetis.myDiagram.model.addLinkData(link);
        }
    }
    modifiedRelshipViews.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
    })
    if (debug) console.log('1808 myMetis', myMetis);
}

export function createLink(data: any, context: any): any {
    // Creates both relship and relship view
    if (!data.key)
        data.key = utils.createGuid();
    const myMetis = context.myMetis;
    if (data.category === constants.gojs.C_RELSHIPTYPE) {
        let reltype = null;
    } else if (data.category === constants.gojs.C_RELATIONSHIP) {
        const myGoModel = context.myGoModel;
        // Identify  type   
        let reltype = null;
        let relshipview;
        let fromNode = data.fromNode;
        let scale = 1;
        if (!fromNode) {
            fromNode = myGoModel.findNode(data.from);
            scale = fromNode.scale;
        }
        let toNode = data.toNode;
        if (!toNode) {
            toNode = myGoModel.findNode(data.to);
            if (scale > toNode.scale)
                scale = toNode.scale;
        }
        const fromPort = data.fromPort;
        const toPort = data.toPort;
        const fromType = fromNode?.objecttype;
        const toType = toNode?.objecttype;
        reltype = data.relshiptype;
        if (reltype && reltype.isInstantiable()) {
            // Create the relationship
            const myGoModel = context.myGoModel;
            let fromObjView = fromNode?.objectview;
            let toObjView = toNode?.objectview;
            let fromObj = null;
            if (fromObjView) {
                fromObj = fromObjView.object;
                fromObj = myMetis.findObject(fromObj?.id);
            }
            let toObj = null;
            if (toObjView) {
                toObj = toObjView.object;
                toObj = myMetis.findObject(toObj?.id);
            }
            if (debug) console.log('1765 createLink', fromObj, toObj);
            if (fromObj && toObj) {
                // Find relationship if it already exists
                const myModel = context.myModel;
                let relship = myModel.findRelationship2(fromObj, toObj, reltype.nameFrom, reltype, fromPort, toPort);
                if (!relship) {
                    relship = new akm.cxRelationship(utils.createGuid(), reltype, fromObj, toObj, "", "");
                    if (relship) {
                        relship.setModified();
                        data.relship = relship;
                        relship.setName(reltype.nameFrom);
                        relship.fromPort = fromPort;
                        relship.toPort = toPort;
                        myModel.addRelationship(relship);
                        myMetis.addRelationship(relship);
                    }
                }
                if (relship) {
                    let typeview = data.relshiptype.typeview;
                    if (!typeview) typeview = reltype.getDefaultTypeView();
                    let relviewName = relship.name;
                    if (relviewName === "") relviewName = data.relshiptype.name;
                    relshipview = new akm.cxRelationshipView(utils.createGuid(), relviewName, relship, "");
                    if (relshipview) {
                        const myModelview = context.myModelview;
                        const diagram = context.myDiagram;
                        relshipview.setModified();
                        relshipview.setTypeView(typeview);
                        relshipview.setFromObjectView(fromObjView);
                        relshipview.setToObjectView(toObjView);
                        relshipview.setTextScale(scale);
                        relshipview.strokewidth = "";
                        relshipview.textscale = "";
                        relshipview.fromport = fromPort;
                        relshipview.toport = toPort;
                        relshipview.markedAsDeleted = false;
                        myModelview.addRelationshipView(relshipview);
                        myMetis.addRelationshipView(relshipview);
                        data.relshipview = relshipview;
                        let linkData = buildLinkFromRelview(myGoModel, relshipview, relship, data, diagram);
                    }
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
            const myDiagram = context.myDiagram;
            const myMetis = context.myMetis;
            const myGoModel = context.myGoModel;
            let link;
            const links = myDiagram.links;
            for (let it = links.iterator; it?.next();) {
                const l = it.value;
                if (l.key === lnk.key) {
                    link = l.data;
                    break;
                }
            }
            if (debug) console.log('1801 lnk, link', lnk, link);
            if (link) {
                let relview = link.relshipview;    // cxRelationshipView
                relview = myMetis.findRelationshipView(relview?.id);
                const rel = relview?.relship;    // cxRelationship   
                if (debug) console.log('1806 rel, relview', rel, relview);
                if (rel && relview) {
                    // Before relink
                    const name = rel.name;
                    let fromObj1 = rel.fromObject;
                    fromObj1 = myMetis.findObject(fromObj1.id);
                    fromObj1.removeOutputrel(rel);
                    let toObj1 = rel.toObject;
                    toObj1 = myMetis.findObject(toObj1.id);
                    toObj1.removeInputrel(rel);
                    if (debug) console.log('1816 fromobj1, toObj1', fromObj1, toObj1);
                    // After relink   
                    link.category = lnk.category;
                    link.name = name;
                    rel.fromPortid = lnk.fromPort;
                    rel.toPortid = lnk.toPort;
                    relview.fromPortid = lnk.fromPort;
                    relview.toPortid = lnk.toPort;
                    link.from = lnk.from;
                    link.to = lnk.to;
                    link.fromNode = fromNode
                    link.toNode = toNode;
                    link.fromPort = lnk.fromPort;
                    link.toPort = lnk.toPort;
                    const fromObjView = fromNode.objectview;
                    relview.fromObjview = fromObjView;
                    relview.fromPortid = lnk.fromPort;
                    relview.toPortid = lnk.toPort;
                    rel.fromObject = myMetis.findObject(fromObjView.object.id);
                    const toObjView = toNode.objectview;
                    relview.toObjview = toObjView;
                    rel.toObject = myMetis.findObject(toObjView.object.id);
                    const fromObj2 = rel.fromObject;
                    fromObj2.addOutputrel(rel);
                    const toObj2 = rel.toObject;
                    toObj2.addInputrel(rel);
                    if (debug) console.log('1840 fromobj2, toObj2', fromObj2, toObj2);
                    const myLink = myDiagram.findLinkForKey(link.key);
                    myLink.category = link.template;
                    setLinkProperties(relview, myMetis, myDiagram);
                    // Do the dispatches          
                    const jsnRelview = new jsn.jsnRelshipView(relview);
                    context.modifiedRelshipViews.push(jsnRelview);
                    const jsnRel = new jsn.jsnRelationship(rel);
                    context.modifiedRelships.push(jsnRel);
                    const jsnFromObj1 = new jsn.jsnObject(fromObj1);
                    context.modifiedObjects.push(jsnFromObj1);
                    const jsnToObj1 = new jsn.jsnObject(toObj1);
                    context.modifiedObjects.push(jsnToObj1);
                    const jsnFromObj2 = new jsn.jsnObject(fromObj2);
                    context.modifiedObjects.push(jsnFromObj2);
                    const jsnToObj2 = new jsn.jsnObject(toObj2);
                    context.modifiedObjects.push(jsnToObj2);
                }
            }
        }
    }
    if (lnk.category === 'Relationship type') {
        const myGoMetamodel = context.myGoMetamodel;
        const link = myGoMetamodel.findLink(lnk.key) as gjs.goRelshipTypeLink;
        if (debug) console.log('1559 lnk, link', lnk, link);
        if (link) {
            const reltype = link.reltype;  // cxRelationshipType   
            if (reltype) {
                if (debug) console.log('1563 fromNode', fromNode);
                if (reltype && fromNode) {
                    link.fromNode = fromNode;
                    reltype.fromObjtype = fromNode.objecttype;
                    reltype.fromobjtypeRef = reltype.fromObjtype.id;
                }
                if (debug) console.log('1569 toNode', toNode);
                if (reltype && toNode) {
                    link.toNode = toNode;
                    reltype.toObjtype = toNode.objecttype;
                    reltype.toobjtypeRef = reltype.toObjtype.id;
                }
                const jsnReltype = new jsn.jsnRelationshipType(reltype, true);
                context.modifiedTypeLinks.push(jsnReltype);
                if (debug) console.log('1577 jsnReltype', reltype, jsnReltype);
            }
        }
    }
}

export function addLinkToDataArray(parent: any, myLink: gjs.goRelshipLink, relview: akm.cxRelationshipView) {
    const linkArray = parent.linkDataArray;
    const newArray = new Array();
    for (let i = 0; i < linkArray.length; i++) {
        const ll = linkArray[i];
        if (ll) newArray.push(ll);
    }
    const reltype = relview.relship?.type;
    const typeview = reltype?.typeview as akm.cxRelationshipTypeView;
    myLink.typeview = typeview;
    const viewdata = typeview?.data;
    for (let prop in viewdata) {
        if (prop === "abstract") continue;
        if (prop === "class") continue;
        myLink[prop] = viewdata[prop];
    }
    if (debug) console.log('1599 myLink', myLink);
    newArray.push(myLink);
    parent.linkDataArray = newArray;
    return myLink;
}

export function hasMemberRelship(node: any, myMetis: akm.cxMetis): akm.cxRelationship {
    // Currently disabled
    return null;
    const hasMemberType = myMetis.findRelationshipTypeByName(constants.types.AKM_HAS_MEMBER);
    const toObj = myMetis.findObject(node.objRef);
    const hasMemberRels = toObj.getInputRelshipsByType(hasMemberType);
    if (hasMemberRels?.length > 0)
        return hasMemberRels[0];
    return null;
}

export function addHasMemberRelship(fromObj: akm.cxObject, toObj: akm.cxObject, myMetis: akm.cxMetis): akm.cxRelationship {
    const hasMemberType = myMetis.findRelationshipTypeByName(constants.types.AKM_HAS_MEMBER);
    if (!hasMemberType) {
        return null;
    }
    let hasMemberRel = new akm.cxRelationship(utils.createGuid(), hasMemberType, fromObj, toObj, constants.types.AKM_HAS_MEMBER, hasMemberType.description);
    return hasMemberRel;
}

export function addHasMemberRelship2(node: any, includeView: boolean, myMetis: akm.cxMetis, myModelview: akm.cxModelView, myDiagram: any): akm.cxRelationship {
    const myGoModel = myMetis.gojsModel;
    const toObj = node.object;
    const toObjview = node.objectview;
    const hasMemberType = myMetis.findRelationshipTypeByName(constants.types.AKM_HAS_MEMBER);
    const hasMemberRels = toObj.getInputRelshipsByType(hasMemberType);
    let hasMemberRel;
    if (debug) console.log('726 toObj, hasMemberRels', toObj, hasMemberRels);
    for (let i = 0; i < hasMemberRels?.length; i++) {
        hasMemberRel = hasMemberRels[i];
        let relview = null;
        let relviews = hasMemberRel.relshipviews;
        if (relviews) {
            for (let j = 0; j < relviews?.length; j++) {
                const rview = relviews[j];
                if (rview && rview.markedAsDeleted)
                    continue;
                if (rview.toObjview.id === toObjview.id) {
                    relview = rview;
                    break;
                }
            }
            if (includeView && relview) {
                // Add link
                myDiagram.startTransaction('AddLink');
                let link = new gjs.goRelshipLink(relview.id, myGoModel, relview);
                link.loadLinkContent(myGoModel);
                link.fromNode = uid.getNodeByViewId(fromObjview.id, myDiagram);
                link.from = link.fromNode?.key;
                link.toNode = uid.getNodeByViewId(toObjview.id, myDiagram);
                link.to = link.toNode?.key;
                myGoModel.addLink(link);
                myDiagram.model.addLinkData(link);
                myDiagram.commitTransaction('AddLink');
            }
            return hasMemberRel;
        }
        if (includeView && !relviews) {
            const relview = new akm.cxRelationshipView(utils.createGuid(), hasMemberRel.name, hasMemberRel, "");
            if (debug) console.log('756 relview', relview);
            relview.toObjview = toObjview;
            const fromGroup = hasMemberRel.fromObject;  // group
            const objviews = myModelview.findObjectViewsByObject(fromGroup);
            if (objviews) {
                for (let j = 0; j < objviews.length; j++) {
                    const fromObjview = objviews[j];   // group
                    if (fromObjview) {
                        relview.fromObjview = fromObjview;
                        if (debug) console.log('765 relview', relview);
                        hasMemberRel.addRelationshipView(relview);
                        myModelview.addRelationshipView(relview);
                        myMetis.addRelationshipView(relview);
                        // Add link
                        myDiagram.startTransaction('AddLink');
                        let link = new gjs.goRelshipLink(relview.id, myGoModel, relview);
                        link.loadLinkContent(myGoModel);

                        link.fromNode = uid.getNodeByViewId(fromObjview.id, myDiagram);
                        link.from = link.fromNode?.key;
                        link.toNode = uid.getNodeByViewId(toObjview.id, myDiagram);
                        link.to = link.toNode?.key;

                        myGoModel.addLink(link);
                        myDiagram.model.addLinkData(link);
                        myDiagram.commitTransaction('AddLink');
                    }
                }
            }
        }
    }
}

export function addHasMemberRelshipView(rel: any, myModelview: akm.cxModelView): akm.cxRelationshipView {
    const fromObj = rel.fromObject;
    const toObj = rel.toObject;
    const fromObjview = fromObj.objectviews[0];
    const toObjview = toObj.objectviews[0];
    let relview = new akm.cxRelationshipView(utils.createGuid(), rel.name, rel, rel.description);
    relview.setFromObjectView(fromObjview);
    relview.setToObjectView(toObjview);
    myModelview.addRelationshipView(relview);
    return relview;
}

export function setLinkProperties(relview: akm.cxRelationshipView, myMetis: akm.cxMetis, myDiagram: any) {
    const myGoModel = myMetis.gojsModel;
    const fromObjview = relview.fromObjview;
    const toObjview = relview.toObjview;
    if (fromObjview && toObjview) {
        const links = myDiagram.links;
        let found = false;
        let link = null as gjs.goRelshipLink;
        for (let it = links.iterator; it?.next();) {
            const lnk = it.value;
            if (lnk.data.relshipview.id === relview.id) {
                link = myGoModel.findLinkByViewId(relview.id);
                found = true;
                break;
            }
        }
        let newlink = null;
        if (!found) {
            newlink = new gjs.goRelshipLink(relview.id, myGoModel, relview);
            link = newlink;
            link.loadLinkContent(myGoModel);
            link.fromNode = uid.getNodeByViewId(fromObjview.id, myDiagram);
            link.from = link.fromNode?.key;
            link.toNode = uid.getNodeByViewId(toObjview.id, myDiagram);
            link.to = link.toNode?.key;
            myGoModel.addLink(link);
            myDiagram.model.addLinkData(link);
        }
    }
}

// Callback function initiated when a node is pasted
export function onClipboardPasted(selection: any, context: any) {
    // First handle the objects
    let it = selection.iterator;
    while (it?.next()) {
        let selected = it.value.data;
        if (debug) console.log('795 onClipboardPasted', selected);
        if (selected.category === 'Object') {
            let node = selected;
            const objview = createObject(node, context);
        }
    }

    // Then handle the relationships
    while (it?.next()) {
        let selected = it.value.data;
        if (debug) console.log('805 onClipboardPasted', selected);
        if (selected.category === 'Relationship') {
            let link = selected;
            /*
            createRelationship1(link, context);
            */
        }
    }

    // Finally handle groups if they are involved
    const groupsToPaste = new Array();
    let i = 0;
    let it1 = selection.iterator;
    while (it1.next()) {
        // Identify groups in the selection
        let selected = it1.value.data;
        if (debug) console.log('819 onClipboardPasted', selected);
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
                    if (debug) console.log('848 groupsToPaste', groupsToPaste);
                }
            }
        }
    }
}

// Functions handling nodes and groups
export function getGroupByLocation(model: gjs.goModel, loc: string, siz: string, nod: gjs.goObjectNode): gjs.goObjectNode | null {
    if (!loc) return;
    const nodeLoc = loc?.split(" ");
    const nx = parseInt(nodeLoc[0]);
    const ny = parseInt(nodeLoc[1]);
    const nodeSize = siz?.split(" ");
    const nw = parseInt(nodeSize[0]);
    const nh = parseInt(nodeSize[1]);
    const myNode = nod;
    let nodes = model.nodes;
    let uniqueSet = utils.removeArrayDuplicatesById(nodes, "key");
    nodes = uniqueSet;
    if (debug) console.log('794 nodes, loc, siz, nod', nodes, loc, siz, nod);
    // Go through all the groups
    let groups = new Array();
    for (let i = 0; i < nodes?.length; i++) {
        const node = nodes[i] as gjs.goObjectNode;
        if (debug) console.log('798 node', node);
        if (node.key === nod?.key) continue;
        if (node.isGroup) {
            let nodeScale = 1;
            let grpScale = 1;
            const myGroup = node;
            const grpLoc = myGroup.loc?.split(" ");
            const grpSize = myGroup.size?.split(" ");
            if (!grpLoc) return;
            const gx = parseInt(grpLoc[0]);
            const gy = parseInt(grpLoc[1]);
            const gw = parseInt(grpSize[0]);
            const gh = parseInt(grpSize[1]);
            if (
                (nx > gx) // Check upper left corner of node
                &&
                (nx + nw * nodeScale <= gx + gw * grpScale) // Check upper right corner of node
                &&
                (ny > gy) // Check lower left corner of node
                &&
                (ny + nh * nodeScale <= gy + gh * grpScale) // Check lower right corner of node
            ) {
                let grp = {
                    "name": node.name,
                    "groupId": node.key,
                    "group": node,
                    "size": gw * grpScale * gh * grpScale,
                };
                groups.push(grp);
            }
        }
    }
    uniqueSet = utils.removeArrayDuplicatesById(groups, "groupId");
    groups = uniqueSet;

    groups.sort(function (a, b) {
        return a.size - b.size;
    });

    if (groups.length > 0) {
        const grp = groups[0];
        const group = model.findNode(grp.groupId);
        if (group) {
            return group;
        }
    } else {
        return null;
    }
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
                let rels = nodeObj.getInputRelships(myModel, constants.RELKINDS.COMP);
                if (rels) {
                    for (let i = 0; i < rels.length; i++) {
                        let rel = rels[i];
                        if (rel) {
                            let fromObj = rel.getFromObject();
                            if (fromObj.getType().getViewKind() === constants.VIEWKINDS.CONT) {
                                rel.setModified();
                                rel.setMarkedAsDeleted(true);
                            }
                        }
                    }
                }
            }
        }
    }
}

export function getNodesInGroup(groupNode: gjs.goObjectNode, myGoModel: any, myObjectviews: akm.cxObjectView[]): gjs.goObjectNode[] {
    const nodes = new Array();
    const groupId = groupNode.objviewRef;
    for (let i = 0; i < myObjectviews?.length; i++) {
        const oview = myObjectviews[i];
        const loc = oview?.loc;
        if (oview?.group === groupId) {
            const node = myGoModel.findNodeByViewId(oview.id);
            if (node) {
                node.objectview = oview;
                node.loc = loc;
                nodes.push(node);
            }
        }
    }
    return nodes;
}

export function scaleNodesInGroup(groupNode: gjs.goObjectNode, myGoModel: any, myObjectviews: akm.cxObjectView[],
    fromLocs: any, toLocs: any): any[] {
    let fromScale = Number(groupNode.scale);
    let toScale = Number(groupNode.scale) * Number(groupNode.memberscale);
    let scaleFactor = toScale / fromScale;
    // First handle the group itself
    const size = groupNode.size.split(" ");
    const sx = parseInt(size[0]);
    const sy = parseInt(size[1]);
    const sizeX = sx * scaleFactor;
    const sizeY = sy * scaleFactor;
    const newSize = sizeX + " " + sizeY;
    groupNode.size = newSize;
    const nodes = getNodesInGroup(groupNode, myGoModel, myObjectviews);
    let refloc = groupNode.loc;
    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n) {
            let fromnode;
            for (let j = 0; j < fromLocs?.length; j++) {
                const fromNode = fromLocs[j];
                if (fromNode.key === n.key) {
                    fromnode = fromNode.loc;
                    fromScale = fromNode.scale;
                    if (debug) console.log('1106 fromNode, fromnode, fromScale', fromNode, fromnode, fromScale);
                    break;
                }
            }
            let tonode, toNode;
            for (let j = 0; j < toLocs?.length; j++) {
                toNode = toLocs[j];
                if (toNode.key === n.key) {
                    tonode = toNode.loc;
                    // toScale = toNode.scale;
                    if (debug) console.log('1116 toNode, tonode, toScale', toNode, tonode, toScale);
                    break;
                }
            }
            scaleFactor = toScale / fromScale;
            const nodeloc = scaleNodeLocation2(n, refloc, tonode, scaleFactor);
            if (nodeloc) {
                let loc = nodeloc.x + " " + nodeloc.y;
                n.loc = loc;
                n.scale = toScale.toString();

                const nod = myGoModel.findNodeByViewId(n.objectview.id);
                if (nod) {
                    nod.loc = loc;
                    nod.scale = toScale.toString();
                    toNode.loc = loc;
                }
            }
        }
    }
    return nodes;
}

export function changeNodeSizeAndPos(data: gjs.goObjectNode, fromloc: any, toloc: any, 
                                     goModel: gjs.goModel, myDiagram: any, myMetis: akm.cxMetis, modifiedObjectViews: any[]): gjs.goObjectNode {
    if (data.category === 'Object') {
        let objview;
        let node = goModel?.findNode(data.key);
        if (!node) node = data;
        if (node) {
            node.loc = toloc;
            node.size = data.size;
            try {
                node.scale = node.getMyScale(goModel).toString();
            } catch (e) {
                if (debug) console.log('1181 e', e);
            }
            if (node.isGroup) {   // node is a group
                const group = node;
                // Get potential members of the group
                const nods = goModel?.nodes;
                for (let i = 0; i < nods.length; i++) {
                    let nod = nods[i] as gjs.goObjectNode;
                    // if nod is the group, do nothing
                    if (nod.key === group.key)
                        continue;
                    const grp = getGroupByLocation(goModel, nod.loc, nod.size, nod);
                    if (nod && grp /*?.grabIsAllowed*/) {
                        if (debug) console.log('960 grp, nod', grp, nod);
                        // This (grp) is the container
                        nod.group = grp.key;
                        const loc = scaleNodeLocation(grp, nod);
                        const n = myDiagram.findNodeForKey(nod.key);
                        if (n?.data) {
                            try {
                                myDiagram.model.setDataProperty(n.data, "group", nod.group);
                                if (debug) console.log('968 n.data', n.data);
                            } catch (e) {
                                if (debug) console.log('970 e', e);
                            }
                        }
                        // uid.selectContent(nod, myMetis, myDiagram);
                    } else {
                        nod.group = "";
                    }
                    objview = nod.objectview;
                    if (objview) {
                        objview.loc = nod.loc;
                        objview.size = nod.size;
                        objview.modified = true;
                        if (nod.group)
                            objview.group = grp.objviewRef;
                        else
                            objview.group = "";
                    }
                }
            }
            if (objview) {
                const modObjview = new jsn.jsnObjectView(objview);
                modifiedObjectViews.push(modObjview);
            }
        }
        return node;
    }
}

export function scaleNodeLocation(group: any, node: any): any {
    const grpLoc = group.loc?.split(" ");
    if (!grpLoc) return;
    const gx = parseInt(grpLoc[0]);
    const gy = parseInt(grpLoc[1]);
    const nodeLoc = node.loc.split(" ");
    let nx = parseInt(nodeLoc[0]);
    let ny = parseInt(nodeLoc[1]);
    let deltaNx = nx - gx;
    let deltaNy = ny - gy;
    const scale = node.scale;
    deltaNx *= scale;
    deltaNy *= scale;
    nx = gx + deltaNx;
    ny = gy + deltaNy;
    const loc = { "x": nx, "y": ny };
    if (debug) console.log('921 node, node.loc, loc', node, node.loc, loc);
    return loc;
}

export function scaleNodeLocation2(node: any, refloc: string, toloc: any, scaleFactor: any): any {
    if (debug) console.log('1146 node, refloc, toloc, scaleFactor ', node, refloc, toloc, scaleFactor);
    const refLoc = refloc?.split(" ");
    if (!refLoc) return;
    const rx = parseInt(refLoc[0]);
    const ry = parseInt(refLoc[1]);
    const nodloc = toloc?.valueOf();
    const nodeLoc = nodloc?.split(" ");
    if (!nodeLoc) return;
    if (debug) console.log('1154 nodloc, nodeLoc, refloc', nodloc, nodeLoc, refloc);
    let nx = parseInt(nodeLoc[0]);
    let ny = parseInt(nodeLoc[1]);
    let deltaNx = (nx - rx) * scaleFactor;
    let deltaNy = (ny - ry) * scaleFactor;
    if (debug) console.log('1159 rx, ry, nx, ny, deltaNx, deltaNy', rx, ry, nx, ny, deltaNx, deltaNy);
    nx = rx + deltaNx;
    ny = ry + deltaNy;
    const loc = { "x": nx, "y": ny };
    if (debug) console.log('1163 node, node.loc, loc', node, node.loc, loc);
    return loc;
}

export function scaleSubnodes(node: any, nodes: any[]): any[] {
    let subnodes = [];
    if (node.isGroup) {
        for (let i = 0; i < nodes?.length; i++) {
            const n = nodes[i];
            if (n.group === node.id) {
                n.scale = node.scale * node.objectview.memberscale;
                subnodes.push(n);
                // const nods = scaleSubnodes(n, nodes);
            }
        }
        return subnodes;
    }
    return null;
}

// Other functions
export function addItemToList(list: any, item: any) {
    for (let i = 0; i < list?.length; i++) {
        const ll = list[i];
        if (ll.id === item.id) {
            list[i] = item;
            return;
        }
    }
    list?.push(item);
}

export function isPropIncluded(k: string, type: akm.cxType): boolean {
    let retVal = true;
    if (k === '__gohashid') retVal = false;
    // if (k === 'abstract') retVal = false;
    // if (k === 'properties') retVal = false;
    if (k === 'defaultValueset') retVal = false;
    if (k === 'queries') retVal = false;
    if (k === 'properties') retVal = false;
    if (k === 'ports') retVal = false;
    if (k === 'fromObjtype') retVal = false;
    if (k === 'toObjtype') retVal = false;
    if (k === 'objtypegeos') retVal = false;
    if (k === 'inputreltypes') retVal = false;
    if (k === 'outputreltypes') retVal = false;
    if (k === 'allObjecttypes') retVal = false;
    if (k === 'allRelationshiptypes') retVal = false;
    if (k === 'methods') retVal = false;
    if (k === 'methodRefs') retVal = false;
    if (k === 'propertyRefs') retVal = false;
    if (k === 'attributes') retVal = false;
    if (k === 'allowedValues') retVal = false;
    if (k === 'allProperties') retVal = false;
    if (k === 'cardinality') retVal = false;
    if (k === 'currentTargetModelview') retVal = false;
    if (k === 'category') retVal = false;
    if (k === 'class') retVal = false;
    if (k === 'data') retVal = false;
    if (k === 'defaultValue') retVal = false;
    if (k === 'deleted') retVal = false;
    if (k === 'deleteViewsOnly') retVal = false;
    if (k === 'from') retVal = false;
    if (k === 'fromNode') retVal = false;
    if (k === 'fromObject') retVal = false;
    if (k === 'fromobjectRef') retVal = false;
    if (k === 'fromObjview') retVal = false;
    if (k === 'fromObjviewRef') retVal = false;
    if (k === 'fromPort') retVal = false;
    if (k === 'fs_collection') retVal = false;
    if (k === 'generatedTypeId') retVal = false;
    if (k === 'group') retVal = false;
    if (k === 'groupLayout') retVal = false;
    // if (k === 'id') retVal = false;
    if (k === 'inputrels') retVal = false;
    if (k === 'isExpanded') retVal = false;
    if (k === 'isGroup') retVal = false;
    if (k === 'isMetamodel') retVal = false;
    if (k === 'isTemplate') retVal = false;
    if (k === 'key') retVal = false;
    if (k === 'layer') retVal = false;
    // if (k === 'loc') retVal = false;
    if (k === 'metamodelRef') retVal = false;
    if (k === 'modeltype') retVal = false;
    if (k === 'modified') retVal = false;
    if (k === 'nameId') retVal = false;
    if (k === 'object') retVal = false;
    if (k === 'objectview') retVal = false;
    if (k === 'objectviews') retVal = false;
    if (k === 'objectRef') retVal = false;
    if (k === 'outputrels') retVal = false;
    if (k === 'objecttype') retVal = false;
    if (k === 'parent') retVal = false;
    if (k === 'parentModel') retVal = false;
    if (k === 'parentModelRef') retVal = false;
    if (k === 'pasteViewsOnly') retVal = false;
    if (k === 'points') retVal = false;
    if (k === 'propertyValues') retVal = false;
    if (k === 'relship') retVal = false;
    if (k === 'relshipRef') retVal = false;
    if (k === 'relshiptype') retVal = false;
    if (k === 'relview') retVal = false;
    if (k === 'relviewRef') retVal = false;
    if (k === 'relshipview') retVal = false;
    if (k === 'reltype') retVal = false;
    if (k === 'reltypeRef') retVal = false;
    if (k === 'relshipviews') retVal = false;
    if (k === 'size') retVal = false;
    if (k === 'sourceModelRef') retVal = false;
    if (k === 'sourceUri') retVal = false;
    if (k === 'targetMetamodelRef') retVal = false;
    if (k === 'targetModelRef') retVal = false;
    if (k === 'supertypes') retVal = false;
    if (k === 'supertypeRefs') retVal = false;
    if (k === 'to') retVal = false;
    if (k === 'toNode') retVal = false;
    if (k === 'toObject') retVal = false;
    if (k === 'toobjectRef') retVal = false;
    if (k === 'toObjview') retVal = false;
    if (k === 'toObjviewRef') retVal = false;
    if (k === 'fromPortid') retVal = false;
    if (k === 'toPortid') retVal = false;
    if (k === 'toPort') retVal = false;
    if (k === 'type') retVal = false;
    // if (k === 'typeid') retVal = false;
    if (k === 'typeRef') retVal = false;
    if (k === 'toobjtypeRef') retVal = false;
    if (k === 'fromobjtypeRef') retVal = false;
    if (k === 'typeview') retVal = false;
    if (k === 'typeviewRef') retVal = false;
    if (k === 'valueset') retVal = false;
    // if (k === 'viewkind') retVal = false;
    if (k === 'visible') retVal = false;
    // if (k === 'viewkind') retVal = false;
    if (k === 'relshipkind') retVal = false;
    if (type?.name !== 'ViewFormat' &&
        type?.name !== 'Datatype' &&
        type?.name !== 'Property') {
        if (k === 'viewFormat') retVal = false;
    }
    if (type?.name !== 'InputPattern' &&
        type?.name !== 'Datatype' &&
        type?.name !== 'Property') {
        if (k === 'inputPattern') retVal = false;
        if (k === 'inputExample') retVal = false;
    }
    if (type?.name !== 'FieldType' && type?.name !== 'Datatype') {
        if (k === 'fieldType') retVal = false;
    }
    return retVal;
}
export function isPropIncluded2(k: string, type: akm.cxType): boolean {
    let retVal = true;
    switch (k) {
        // case 'id':
        case 'name':
        case 'description':
        // case 'typename':
        // case 'typedescription':
            break;
        default:
            try {
                const properties = type?.getProperties(true);
                if (properties?.length > 0) {
                    const prop = properties.find(p => p.name === k);
                    if (!prop) {
                        retVal = false;
                    }
                }
            } catch (e) {
                retVal = false;
            }
            break;
        }
    return retVal;
}

export function isOsduAttribute(k: string): boolean {
    let retVal = false;
    switch (k) {
        case '$id':
        case '$schema':
        case 'osduId':
        case 'osduType':
        case 'x-osdu-license':
        case 'x-osdu-review-status':
        case 'x-osdu-schema-source':
        case 'externalId':
        case 'title':
        case 'groupType':
        case 'linkID':
        case 'pattern':
            retVal = true;
            break;
        default:
            break;
    }
    return retVal;
}

function propIsUsedInTypes(metis: akm.cxMetis, prop): boolean {
    const metamodels = metis.metamodels;
    for (let i = 0; i < metamodels?.length; i++) {
        const mmodel = metamodels[i] as akm.cxMetaModel;
        const otypes = mmodel.objecttypes;
        for (let j = 0; j < otypes?.length; j++) {
            const otype = otypes[j];
            const props = otype.properties;
            for (let k = 0; k < props?.length; k++) {
                const p = props[k];
                if (p.id === prop.id)
                    return true;
            }
        }
    }
    return false;
}

export function purgeUnusedProperties(metis: akm.cxMetis) {
    const properties = new Array();
    const props = metis.properties;
    for (let k = 0; k < props?.length; k++) {
        const prop = props[k];
        if (!propIsUsedInTypes(metis, prop))
            continue;
        properties.push(prop);
    }
    metis.properties = properties;
    // Handle properties in metamodels
    const metamodels = metis.metamodels;
    for (let k = 0; k < metamodels?.length; k++) {
        const mmodel = metamodels[k];
        const properties = new Array();
        const props = mmodel.properties;
        for (let k = 0; k < props?.length; k++) {
            const prop = props[k];
            if (!propIsUsedInTypes(metis, prop))
                continue;
            properties.push(prop);
        }
        mmodel.properties = properties;
    }
}

export function purgeMetaDeletions(metis: akm.cxMetis, diagram: any, includeMeta: boolean) {
    const allMetamodels = metis.metamodels;
    // Handle object types
    const objtypes = new Array();
    const otypes = metis.objecttypes;
    for (let k = 0; k < otypes?.length; k++) {
        const objtyp = otypes[k];
        if (objtyp.markedAsDeleted)
            continue;
        objtypes.push(objtyp);
    }
    metis.objecttypes = objtypes;
    // Handle object type views
    const otypeviews = new Array();
    const otviews = metis.objecttypeviews;
    for (let k = 0; k < otviews?.length; k++) {
        const tview = otviews[k];
        if (tview.markedAsDeleted)
            continue;
        otypeviews.push(tview);
    }
    metis.objecttypeviews = otypeviews;

    // Handle object type geos
    const otypegeos = new Array();
    const geos = metis.objtypegeos;
    for (let k = 0; k < geos?.length; k++) {
        const geo = geos[k];
        if (geo.markedAsDeleted)
            continue;
        otypegeos.push(geo);
    }
    metis.objtypegeos = otypegeos;

    // Handle Relationship types
    const reltypes = new Array();
    const rtypes = metis.relshiptypes;
    for (let k = 0; k < rtypes?.length; k++) {
        const reltyp = rtypes[k];
        if (reltyp.markedAsDeleted)
            continue;
        reltypes.push(reltyp);
    }
    metis.relshiptypes = reltypes;

    // Handle Relationship type views
    const reltypeviews = new Array();
    const rtviews = metis.relshiptypeviews;
    for (let k = 0; k < rtviews?.length; k++) {
        const rtview = rtviews[k];
        if (rtview.markedAsDeleted)
            continue;
        reltypeviews.push(rtview);
    }
    metis.relshiptypeviews = reltypeviews;

    // Handle metamodels
    metis.metamodels = new Array();
    for (let i = 0; i < allMetamodels?.length; i++) {
        const mm = allMetamodels[i];
        if (mm.markedAsDeleted)
            continue;
        metis.metamodels.push(mm);
    }

    // Dispatch the metamodels
    for (let i = 0; i < allMetamodels?.length; i++) {
        const mm = allMetamodels[i];
        if (mm.markedAsDeleted)
            continue;
        const jsnMetamodel = new jsn.jsnMetaModel(mm, true);
        let data = JSON.parse(JSON.stringify(jsnMetamodel));
        if (debug) console.log('2291 data', data);
        diagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data });
    }
    // // Do the dispatch
    // const jsnMetis = new jsn.jsnExportMetis(metis, true);
    // let data = {metis: jsnMetis}
    // data = JSON.parse(JSON.stringify(data));
    // if (debug) console.log('2288 jsnMetis', jsnMetis, metis);
    // diagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
}

export function purgeModelDeletions(metis: akm.cxMetis, diagram: any) {
    // Handle properties
    purgeUnusedProperties(metis);
    // handle modelview contents
    const models = metis.models;
    const objectviews = new Array();
    const relshipviews = new Array();
    for (let k = 0; k < models?.length; k++) {
        const model = models[k];
        const modelviews = model?.modelviews;
        for (let i = 0; i < modelviews?.length; i++) {
            const mview = modelviews[i];
            // Handle objectviews
            const oviews = mview.objectviews;
            if (debug) console.log('2324', oviews);
            const objviews = new Array();
            for (let j = 0; j < oviews?.length; j++) {
                const oview = oviews[j];
                if (oview.markedAsDeleted)
                    continue;
                objviews.push(oview);
                objectviews.push(oview);
            }
            if (debug) console.log('2332', objviews);

            mview.objectviews = objviews;
            // Handle relshipviews
            const rviews = mview.relshipviews;
            const relviews = new Array();
            for (let j = 0; j < rviews?.length; j++) {
                const rview = rviews[j];
                if (rview.markedAsDeleted)
                    continue;
                relviews.push(rview);
                relshipviews.push(rview);
            }
            mview.relshipviews = relviews;
            if (debug) console.log('2345 mview', mview);
        }
        // Handle objects
        const objs = model.objects;
        if (debug) console.log('2339', objs);
        const objects = new Array();
        for (let j = 0; j < objs?.length; j++) {
            const obj = objs[j];
            if (obj.markedAsDeleted)
                continue;
            objects.push(obj);
        }
        if (debug) console.log('2361', objects);
        model.objects = objects;
        // Handle relships
        const rels = model.relships;
        const relships = new Array();
        for (let j = 0; j < rels?.length; j++) {
            const rel = rels[j];
            if (rel.markedAsDeleted)
                continue;
            relships.push(rel);
        }
        model.relships = relships;
        if (debug) console.log('2373', model);
    }

    const objviews = metis.objectviews;
    for (let k = 0; k < objviews?.length; k++) {
        const oview = objviews[k];
        if (oview.markedAsDeleted)
            continue;
        objectviews.push(oview);
    }
    metis.objectviews = objectviews;

    const objects = new Array();
    const objs = metis.objects;
    for (let k = 0; k < objs?.length; k++) {
        const obj = objs[k];
        if (obj.markedAsDeleted)
            continue;
        objects.push(obj);
    }
    metis.objects = objects;

    const relviews = metis.relshipviews;
    for (let k = 0; k < relviews?.length; k++) {
        const rview = relviews[k];
        if (rview.markedAsDeleted)
            continue;
        relshipviews.push(rview);
    }
    metis.relshipviews = relshipviews;

    const relships = new Array();
    const rels = metis.relships;
    for (let k = 0; k < rels?.length; k++) {
        const rel = rels[k];
        if (rel.markedAsDeleted)
            continue;
        relships.push(rel);
    }
    metis.relships = relships;

    // Do the dispatch
    const jsnMetis = new jsn.jsnExportMetis(metis, true);
    let data = { metis: jsnMetis }
    data = JSON.parse(JSON.stringify(data));
    diagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
}

function purgeUnusedRelshiptypes(myMetis: akm.cxMetis) {
    // Go through all reltypes and check if they are used
    // If not, mark them as deleted
    const metamodels = myMetis.metamodels;
    const reltypes = myMetis.relshiptypes;
    for (let i = 0; i < reltypes?.length; i++) {
        const reltype = reltypes[i];
        let found = false;
        for (let j = 0; j < metamodels?.length; j++) {
            const metamodel = metamodels[j];
            const rtype = metamodel.findRelationshipType(reltype.id);
            if (rtype) {
                found = true;
                break;
            }
        }
        if (!found) {
            reltype.markedAsDeleted = true;
        }
    }
    { // Purge deleted reltypes
        const len = myMetis.relshiptypes?.length;
        for (let i = len - 1; i >= 0; i--) {
            const reltype = reltypes[i];
            if (reltype.markedAsDeleted) {
                reltypes.splice(i, 1);
            }
        }
    }
    // Go through all objtypes and check if they are used
    // If not, mark them as deleted
    const objtypes = myMetis.objecttypes;
    for (let i = 0; i < objtypes?.length; i++) {
        const objtype = objtypes[i];
        let found = false;
        for (let j = 0; j < metamodels?.length; j++) {
            const metamodel = metamodels[j];
            const otype = metamodel.findObjectType(objtype.id);
            if (otype) {
                found = true;
                break;
            }
        }
        if (!found) {
            objtype.markedAsDeleted = true;
        }
    }
    { // Purge deleted objtypes
        const len = myMetis.objecttypes?.length;
        for (let i = len - 1; i >= 0; i--) {
            const objtype = objtypes[i];
            if (objtype.markedAsDeleted) {
                objtypes.splice(i, 1);
            }
        }
    }
}

export function repairObjectAndRelshipViews(modelview: akm.cxModelView) {
    const objectviews = modelview.objectviews;
    for (let i = 0; i < objectviews?.length; i++) {
        const objview = objectviews[i];
        modelview.repairObjectView(objview);
    }
    purgeDuplicatedRelshipViews(modelview);
}

export function purgeDuplicatedRelshipViews(modelview: akm.cxModelView) {
    const relshipviews = modelview.relshipviews;
    const relshipviews2 = modelview.relshipviews;
    const newRelshipviews = new Array();
    for (let i = 0; i < relshipviews?.length; i++) {
        const relshipview = relshipviews[i];
        if (relshipview.markedAsDeleted)
            continue;
        const relship = relshipview.relship;
        let found = false;
        for (let j = 0; j < relshipviews2?.length; j++) {
            const relshipview2 = relshipviews2[j];
            if (relshipview2.markedAsDeleted)
                continue;
            const relship2 = relshipview2.relship;
            if (relship2?.id === relship?.id) {
                if (!found) {
                    found = true;
                    newRelshipviews.push(relshipview);
                } else {
                    relshipview2.markedAsDeleted = true;
                    newRelshipviews.push(relshipview);
                }
            }
        }
    }
    modelview.relshipviews = newRelshipviews;


    modelview.relshipviews = newRelshipviews;
    let objectviews = modelview.objectviews;
    for (let i = 0; i < objectviews?.length; i++) {
        const objview = objectviews[i];
        purgeDuplicatedRelshipViews2(objview);
    }
}

function purgeDuplicatedRelshipViews2(objview: akm.cxObjectView) {
    const relshipviews = objview.outputrelviews;
    const relshipviews2 = objview.outputrelviews;
    const newRelshipviews = new Array();
    for (let i = 0; i < relshipviews?.length; i++) {
        const relshipview = relshipviews[i];
        if (relshipview.markedAsDeleted)
            continue;
        const relship = relshipview.relship;
        let found = false;
        for (let j = 0; j < relshipviews2?.length; j++) {
            const relshipview2 = relshipviews2[j];
            if (relshipview2.markedAsDeleted)
                continue;
            const relship2 = relshipview2.relship;
            if (relship2?.id === relship?.id) {
                if (!found) {
                    found = true;
                    newRelshipviews.push(relshipview);
                } else {
                    relshipview2.markedAsDeleted = true;
                    newRelshipviews.push(relshipview);
                }
            }
        }
    }
    objview.outputrelviews = newRelshipviews;
}

export function purgeDuplicatedLinks(links: any[]): any[] {
    for (let it1 = links.iterator; it1?.next();) {
        const link1 = it1.value;
        const rview1 = link1.data.relshipview;
        for (let it2 = links.iterator; it2?.next();) {
            const link2 = it2.value;
            if (link1 === link2) continue;
            const rview2 = link2.data.relshipview;
            if (rview1.id === rview2.id) {
                // links.remove(link2);
                continue;
            }
        }
    }
    return links;
}

function isMemberOfSubmodel(myMetis: akm.cxMetis, objview: akm.cxObjectView): boolean {
    if (objview?.group) { // then objview is a member of a group
        let mview = objview.modelview; // Current modelview
        if (!mview) {
            const obj = objview.object; // The object
            const models = myMetis.models;
            for (let i = 0; i < models?.length; i++) {
                const model = models[i];
                if (model) {
                    const modelviews = myMetis.modelviews;
                    for (let j = 0; j < modelviews?.length; j++) {
                        const mview2 = modelviews[j];
                        const objviews = mview2.objectviews;
                        for (let k = 0; k < objviews?.length; k++) {
                            const objview2 = objviews[k];
                            if (objview2?.object?.id === obj.id) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        const grpView = mview?.findObjectView(objview.group); // The group (view)
        const grpObj = grpView?.object; // The group (object)
        if (grpObj) {  // If the group (object) exists
            if (grpObj.type.name === constants.types.AKM_MODEL) // If the group is a model
                return true;
        }
    }
    return false;
}

function isMemberOfSubMetamodel(myMetis: akm.cxMetis, metamodel: akm.cxMetaModel, objtype: akm.cxObjectType): boolean {
    const subMetamodelRefs = metamodel.submetamodelRefs;
    for (let i = 0; i < subMetamodelRefs?.length; i++) {
        const subMetamodelRef = subMetamodelRefs[i];
        const subMetamodel = myMetis.findMetamodel(subMetamodelRef);
        const otype = subMetamodel.findObjectType(objtype.id);
        if (otype) {
            return true;
        }
    }
    return false;
}

export function verifyAndRepairModel(model: akm.cxModel, metamodel: akm.cxMetaModel, modelviews: akm.cxModelView[], myDiagram: any, myMetis: akm.cxMetis) {
    if (debug) console.log('2412 verifyAndRepairModel STARTED');
    const format = "%s\n";
    let msg = "Verification report\n";
    let report = printf(format, msg);
    msg = "First do some initial checks\n";
    const metamodels = myMetis.metamodels;

    { // Check for duplicate relship types in the metamodels
        for (let i = 0; i < metamodels?.length; i++) {
            const mm = metamodels[i];
            const rels = mm.relshiptypes;
            for (let j = 0; j < rels?.length; j++) {
                const rel = rels[j];
                for (let k = j + 1; k < rels?.length; k++) {
                    const rel2 = rels[k];
                    if (rel.fromObjtype?.id === rel2.fromObjtype?.id
                        && rel.toObjtype?.id === rel2.toObjtype?.id
                        && rel.name === rel2.name) {
                        if (debug) console.log('Removing duplicate relship type', rel, rel2);
                        msg += "A duplicate relship type, '" + rel2.name + "', has been removed from the metamodel, '" + mm.name + "'\n";
                        rels.splice(k, 1);
                        k--;
                    }
                }
            }
        }
        if (debug) console.log('2437 metamodels', metamodels);
    }
    if (debug) console.log('2439 model, modelviews', model, modelviews, myMetis);
    // ????  Check if the referenced type exists - otherwise find a type that corresponds ?????
    {   // Handle container views        
        for (let i = 0; i < modelviews?.length; i++) {
            const modelview = modelviews[i];
            const oviews = modelview.objectviews;
            for (let i = 0; i < oviews?.length; i++) {
                const oview = oviews[i];
                if (oview.viewkind === 'Container') {
                    if (!oview.isGroup) {
                        oview.isGroup = true;
                        msg += "The container view '" + oview.name + "' is now a group (isGroup = true)\n";
                    }
                }
                const obj = oview.object;
                if (obj) {
                    if (obj.type?.name === constants.types.AKM_MODEL) {
                        const modelObj = obj;
                        oview.viewkind = 'Container';
                        oview.isGroup = true;
                    }
                }
            }
        }
    }
    msg += "The initial checks are completed\n";
    report += printf(format, msg);
    const myGoModel = myDiagram?.myGoModel;
    const defObjTypename = 'Generic';
    const objects = model.objects;
    const modifiedObjects = new Array();
    { // Handle the objects
        msg = "Verifying objects\n";
        for (let i = 0; i < objects?.length; i++) {
            const obj = objects[i];
            if (!obj.type) {
                if (debug) console.log('2434 obj, myMetis', obj, myMetis);
                // Handle objects without type
                const type = myMetis.findObjectTypeByName(defObjTypename);
                if (type) {
                    obj.type = type;
                    obj.typeRef = type.id;
                    obj.typeName = type.name;
                    msg += "\tVerifying object '" + obj.name + "' ( without type )\n";
                    msg += "\tObject type has been set to '" + defObjTypename + "'\n";
                    if (debug) console.log('2443 msg', msg);
                }
            }
            if (obj.type.name === constants.types.AKM_MODEL) {
                continue;
            }
            // If obj is member of a submodel, then do not verify it
            let isPartOfSubmodel = false;
            const objviews = obj.objectviews;
            for (let i = 0; i < objviews?.length; i++) {
                const oview = objviews[i];
                if (isMemberOfSubmodel(myMetis, oview)) {
                    isPartOfSubmodel = true;
                    // Do nothing
                    continue;
                }
            }
            // If obj.type is part of a submetamodel, then do not verify it
            const otype = obj.type;
            if (otype) {
                if (isMemberOfSubMetamodel(myMetis, metamodel, otype)) {
                    // Do nothing
                    continue;
                }
            }
            obj.inputrels = new Array();
            obj.outputrels = new Array();
            const typeRef = obj.typeRef;
            const typeName = obj.typeName;
            if (debug) console.log('2450 obj', obj, model);
            let objtype = metamodel.findObjectType(typeRef);
            msg += "\tVerifying object (" + obj.name + ") of type (" + typeName + ")\n";
            let objChanged = false;
            if (!objtype) {
                msg += "\tObject type '" + typeRef + "' ('" + typeName + "') was not found\n";
                if (debug) console.log('2458 Type of object not found:', obj);
                objtype = metamodel.findObjectTypeByName(typeName);
                if (!objtype) {
                    // Check submodels
                    if (!isPartOfSubmodel) {
                        objtype = myMetis.findObjectTypeByName(defObjTypename);
                    }
                }
                if (objtype) {
                    obj.type = objtype;
                    obj.typeRef = objtype.id;
                    obj.typeName = objtype.name;
                    objChanged = true;
                    msg += "\tObject type changed to: '" + objtype.name + "'\n";
                    report += printf(format, msg);
                    msg = "";
                }
            }
            if (objtype) {
                const objviews = obj.objectviews;
                for (let i = 0; i < objviews?.length; i++) {
                    const oview = objviews[i];
                    oview.name = obj.name;
                    if (obj.markedAsDeleted && !oview.markedAsDeleted) {
                        oview.markedAsDeleted = true;
                        msg += "\tVerifying object '" + obj.name + "(" + obj.id + ") that is deleted, but objectview is not.\n";
                        msg += "\tIs repaired by deleting object view\n";
                    }
                    let typeview = oview.typeview;
                    if (!typeview) {
                        oview.typeview = objtype.typeview as akm.cxObjectTypeView;
                        msg += "Object typeview of : '" + objtype.name + "' set to default\n";
                    } else if (objChanged) {
                        oview['fillcolor'] = 'red';
                    }
                    const myNode = myGoModel.findNodeByViewId(oview.id);
                    if (myNode) {
                        myNode.name = oview.name;
                        const node = myDiagram.findNodeForKey(myNode?.key);
                        if (node) node.data = myNode; // sf added if (node)
                    }
                }
                myDiagram.requestUpdate();
            }
        }
        msg += "Verifying objects and object types are completed\n";
        report += printf(format, msg);
    }
    { // Handle object views
        msg = "Verifying object views\n";
        let objectviews = [];
        for (let i = 0; i < modelviews?.length; i++) {
            const modelview = modelviews[i];
            const objviews = modelview.objectviews;
            const oviews = [];
            for (let j = 0; j < objviews?.length; j++) {
                const oview = objviews[j];
                const obj = oview.object;
                if (!obj) 
                    oview.markedAsDeleted = true;
                oview.modelview = modelview;
                if (debug) console.log('2970 oview', oview.name);
                // if (isMemberOfSubmodel(myMetis, oview))
                //     continue;
                oviews.push(oview);
            }
            if (i == 0)
                objectviews = oviews;
            else {
                objectviews = objectviews?.concat(oviews);
            }
        }
        const objviews = [];
        if (debug) console.log('2515 objectviews', objectviews);
        for (let i = 0; i < objectviews?.length; i++) {
            const oview = objectviews[i];
            if (oview) {
                const obj = oview.object;
                if (obj && obj.type.name === constants.types.AKM_MODEL)
                    continue;
                if (!oview.id) {
                    msg += "\tObject view '" + oview.name + "' has no id\n";
                    continue;
                }
                if (!oview.name) {
                    msg += "\tObject view '" + oview.id + "' has no name\n";
                    continue;
                }
                if (!oview.typeview) {
                    msg += "\tObject view '" + oview.name + "' has no typeview\n";
                    continue;
                }
                if (!oview.object) {
                    msg += "\tObject view '" + oview.name + "' has no object\n";
                    continue;
                }
                objviews.push(oview);
            }
        }
        objectviews = objviews;
        if (debug) console.log('2515 objectviews', objectviews);
        for (let i = 0; i < objectviews?.length; i++) {
            const oview = objectviews[i];
            if (oview) {
                if (!oview.markedAsDeleted) { // Object view is not deleted
                    if (debug) console.log('2520 oview, object:', oview, oview.object);
                    if (oview.object?.markedAsDeleted) {
                        oview.object.markedAsDeleted = false;
                        msg += "\tVerifying object view '" + oview.name + "' ( with object deleted)\n";
                        msg += "\tObject has been undeleted";
                    } else if (!oview.object) {
                        oview.markedAsDeleted = true;
                        msg += "\tVerifying objectview '" + oview.name + + "' (" + oview.id + " ( without object )\n";
                        msg += "\tObjectview has been deleted";
                    }
                }
                else if (!oview.object) { // Object view is deleted and has no object
                    if (!oview.name) {
                        oview.markedAsDeleted = true;
                    } else {
                        msg += "\tVerifying object view without object'" + oview.name + "' (" + oview.id + ")\n";
                        msg += "\tDoing nothing\n";
                    }
                }
            }
        }
        myMetis.objectviews = objectviews;
        msg += "Verifying object views is completed\n";
        report += printf(format, msg);
    }
    { // Handle the relationships
        msg = "Verifying relationships\n";
        // First check for duplicate relships
        msg += "\tChecking for duplicate relationships. \n";
        msg += "\tIf found, they are deleted, including their relationship views.\n";
        const relships = model.relships;
        if (relships) {
            for (let i = 0; i < relships?.length; i++) {
                const rel = relships[i];
                const fromObj = rel.fromObject as akm.cxObject;
                const toObj = rel.toObject as akm.cxObject;
                const rtype = rel.type as akm.cxRelationshipType;
                const rels2 = [];
                if (rtype) {
                    const rels = model.findRelationships(fromObj, toObj, rtype);
                    for (let j = 0; j < rels?.length; j++) {
                        const r = rels[j];
                        if (r?.type?.id === rtype.id) {
                            if (r.name === rel.name) {
                                rels2.push(r);
                            }
                        }
                    }
                    for (let j = 0; j < rels2.length; j++) {
                        if (j == 0) continue;
                        const r = rels2[j];
                        r.markedAsDeleted = true;
                        const rviews = r.relshipviews;
                        for (let k = 0; k < rviews?.length; k++) {
                            const rv = rviews[k];
                            rv.markedAsDeleted = true;
                        }
                        if (j == 1)
                            msg += "\tDuplicated relationship '" + r.name + "' with views are deleted\n";
                    }
                }
            }
        }
        // Check if the referenced type exists - otherwse find a type that corresponds
        const defRelTypename = constants.types.AKM_GENERIC_REL;
        if (relships) { // sf added
            for (let i = 0; i < relships?.length; i++) {
                const rel = relships[i];
                if (debug) console.log('2283 rel', rel);
                const fromObj = rel.fromObject;
                const toObj = rel.toObject
                let fromType = fromObj?.type;
                let toType = toObj?.type;
                let typeRef = rel.typeRef;
                let typeName = rel.typeName;
                let relname = rel.typeName;
                if (!typeName) typeName = rel.name;
                if (!rel.type) {
                    const type = myMetis.findRelationshipTypeByName(defRelTypename);
                    if (type) {
                        rel.type = type;
                        rel.typeRef = type.id;
                        rel.typeName = type.name;
                        msg += "\tVerifying relationship '" + rel.name + "' ( without type )\n";
                        msg += "\tRelationship type has been set to '" + defRelTypename + "'\n";
                    }
                }
                if (!typeRef) {
                    typeRef = rel.type.id;
                }
                let reltype = metamodel.findRelationshipType(typeRef);
                if (debug) console.log('2304 fromType and toType', typeRef, typeName, fromType, toType, reltype);
                msg += "\t\tVerifying relationship type '" + typeName + "' ('" + typeRef + "')\n";
                if (!reltype) {
                    msg += "\tRelationship type '" + typeName + "' ('" + typeRef + "') was NOT found\n";
                    if (debug) console.log('2309 Relationship with unknown type:', typeName);
                    if (typeName === 'hasProperty') {
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
                    if (debug) console.log('2331 Relationship type with name:', typeName, reltypes);
                    if (reltypes) {
                        for (let i = 0; i < reltypes?.length; i++) {
                            const rtype = reltypes[i] as akm.cxRelationshipType;
                            let fromObjType = fromType;
                            if (!fromObjType) fromObjType = rtype.fromObjtype;
                            let toObjType = toType;
                            if (!toObjType) toObjType = rtype.toObjtype;
                            if (debug) console.log('2339 fromType and toType', typeName, fromObjType, toObjType);
                            if (fromObjType && toObjType) {
                                if (debug) console.log('2341 findreltypebyname', typeName, fromObjType.name, toObjType.name);
                                const rtyp = metamodel.findRelationshipTypeByName2(typeName, fromObjType, toObjType);
                                if (rtyp) {
                                    reltype = rtyp;
                                    rel.type = reltype;
                                    rel.name = typeName;
                                    msg += "\tRelationship type changed to: '" + typeName + "' ( '" + reltype.id + "' )\n";
                                    if (debug) console.log('2349 Found relationship type:', reltype);
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
                            msg += "\tVerifying relationship '" + rel?.name + "' ( without type )\n";
                            msg += "\tRelationship type has been set to " + defRelTypename + "\n";
                        }
                    }
                }
                const relviews = rel.relshipviews;
                for (let i = 0; i < relviews?.length; i++) {
                    const rv = relviews[i];
                    rv.name = rel.name;
                }
            }
        }
        report += printf(format, msg);
    }
    { // Handle the relationship views
        msg = "Verifying Relationship views\n";
        // Handle the relationship views in all modelviews
        for (let i = 0; i < modelviews?.length; i++) {
            let mview = modelviews[i];
            if (mview /*&& mview.id === modelview.id*/) {
                mview = repairRelationshipViews(mview, myDiagram);
                const rviews = mview.relshipviews;
                if (debug) console.log('2690 modelview', mview);
                for (let j = 0; j < rviews?.length; j++) {
                    const rview = rviews[j];
                    const rel = rview.relship;
                    const fromObjview = rview.fromObjview;
                    const toObjview = rview.toObjview;
                    const relviews = mview.findRelationshipViewsByRel2(rel, fromObjview, toObjview, true);
                    if (debug) console.log('2697 rel, relviews', rel, relviews);
                    if (relviews.length > 1) {
                        // Duplicate relationship views between two object views
                        msg += "\tVerifying relationship '" + rel.name + "' with multiple relationshipviews.\n";
                        let n = 0;
                        const rvs = [];
                        for (let k = 0; k < relviews?.length; k++) {
                            const rv = relviews[k];
                            if (!rv.markedAsDeleted) {
                                rvs.push(rv);
                                n++;
                            }
                        }
                        if (debug) console.log('2708 n, rel, rvs', n, rel, rvs);
                        if (n > 1) {
                            // Delete all but the first relationship view
                            for (let k = 0; k < rvs?.length; k++) {
                                if (k == 0)
                                    continue;
                                const rv = rvs[k];
                                rv.markedAsDeleted = true;
                            }
                        }
                        msg += "\tIs repaired by deleting all relationship views but the first one\n";
                        // report += printf(format, msg);
                        // msg = '';
                    }

                    if (debug) console.log('2719 relshipview', rview);
                    if (rview && !rview.markedAsDeleted) {
                        const rel = rview.relship;
                        if (rel && rel.type) {
                            if (debug) console.log('2723 relshipview', rel);
                            if (rel.markedAsDeleted && !rview.markedAsDeleted) {
                                rview.markedAsDeleted = true;
                                msg += "\tVerifying relationship '" + rel.name + "' that is deleted, but relationship view is not.\n";
                                msg += "\tIs repaired by deleting the relationship view\n";
                            }
                            if (!rview.typeview) {
                                rview.typeview = rel.type.typeview as akm.cxRelationshipTypeView;
                                msg += "\tRelationship typeview of " + rel.type?.name + " set to default\n";
                            } else {
                                msg += "\tRelationship typeview of '" + rel.type?.name + "' found\n";
                            }
                            const myLink = myGoModel.findLinkByViewId(rview.id);
                            if (myLink) {
                                myLink.name = rview.name;
                                const link = myDiagram.findLinkForKey(myLink?.key);
                                if (link) {
                                    link.data = myLink;
                                }
                            }
                        }
                        // report += printf(format, msg);
                    }
                }
            }
        }
        msg += "\nVerifying relationship views is completed\n";
        report += printf(format, msg);
        msg = "Verifying relationships is completed\n";
        report += printf(format, msg);
    }
    // Handle missing relships of type hasSubModel and hasSubMetamodel
    const mType = myMetis.findObjectTypeByName(constants.types.AKM_MODEL);
    const mmType = myMetis.findObjectTypeByName(constants.types.AKM_METAMODEL);
    const hasSubMetamodelType = myMetis.findRelationshipTypeByName1(constants.types.AKM_HAS_SUBMETAMODEL, mmType, mmType);
    const hasSubModelType = myMetis.findRelationshipTypeByName1(constants.types.AKM_HAS_SUBMODEL, mmType, mType);
    const hasSubMmRels = model.getRelationshipsByType(hasSubMetamodelType);
    const hasSubMdlRels = model.getRelationshipsByType(hasSubModelType);

    for (let i = 0; i < modelviews?.length; i++) {
        const mview = modelviews[i];
        for (let j = 0; j < hasSubMdlRels.length; j++) {
            const rel = hasSubMdlRels[j];
            const relviews = mview.findRelationshipViewsByRel(rel, true);
            if (!relviews || relviews.length === 0) {
                const rview = new akm.cxRelationshipView(utils.createGuid(), rel.name, rel, rel.description);
                mview.relshipviews.push(rview);
                myMetis.relshipviews.push(rview);
            }
        }
    }
    if (debug) console.log('2825 myMetis', myMetis);

    // Dispatch metis
    const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
    let data = { metis: jsnMetis }
    data = JSON.parse(JSON.stringify(data));
    if (debug) console.log('2831 jsnMetis', jsnMetis, myMetis);
    myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
    if (debug) console.log('2833 data', data, myMetis);
    if (debug) console.log('2834 myGoModel', myGoModel);
    msg = "End Verification\n";

    report += printf(format, msg);
    if (debug) console.log(report);
    myDiagram.requestUpdate();

    if (debug) console.log('2841 verifyAndRepairModel ENDED, myMetis', myMetis);
}

export function deleteDuplicateRelshipViews(modelview: akm.cxmModelView, myDiagram: any) {
    if (modelview) {
        const rviews = modelview.relshipviews;
        if (debug) console.log('2918 modelview', modelview);
        for (let j = 0; j < rviews?.length; j++) {
            const rview = rviews[j];
            const rel = rview.relship;
            const fromObjview = rview.fromObjview;
            const toObjview = rview.toObjview;
            const relviews = modelview.findRelationshipViewsByRel2(rel, fromObjview, toObjview, true);
            if (debug) console.log('2925 rel, relviews', rel, relviews);
            if (relviews.length > 1) {
                // Duplicate relationship views between two object views
                let n = 0;
                const rvs = [];
                for (let k = 0; k < relviews?.length; k++) {
                    const rv = relviews[k];
                    if (!rv.markedAsDeleted) {
                        rvs.push(rv);
                        n++;
                    }
                }
                if (debug) console.log('2937 n, rel, rvs', n, rel, rvs);
                if (n > 1) {
                    // Delete all but the first relationship view
                    for (let k = 0; k < rvs?.length; k++) {
                        if (k == 0)
                            continue;
                        const rv = rvs[k];
                        rv.markedAsDeleted = true;
                        const jsnRelview = new jsn.jsnRelshipView(rv);
                        const data = JSON.parse(JSON.stringify(jsnRelview));
                        myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
                    }
                }
            }
        }
    }
}

export function verifyAndRepairMetamodels(myMetis: akm.cxMetis, myDiagram: any) {
    if (debug) console.log('2829 verifyAndRepairMetamodels STARTED');
    const format = "%s\n";
    let msg = "Verification report\n";
    let report = printf(format, msg);

    { // First go through the metamodels and remove corrupt ones
        // before doing the actual check of the model
        const metamodels = myMetis.metamodels;
        if (debug) console.log('2837 metamodels', metamodels);
        for (let i = 0; i < metamodels?.length; i++) {
            const mm = metamodels[i];
            if (!mm.id) {
                if (debug) console.log('Removing corrupt metamodel', mm);
                metamodels.splice(i, 1);
                msg += "A corrupt metamodel has been removed\n";
                i--;
            } else {
                // Purge objtypegeos
                mm.objtypegeos = mm.purgeObjtypeGeos();
                // Repair container views
                const objtypeviews = mm.objecttypeviews;
                for (let i = 0; i < objtypeviews?.length; i++) {
                    const objtypeview = objtypeviews[i];
                    if (objtypeview) {
                        const objtype = mm.findObjectType(objtypeview.typeRef);
                        if (objtype && objtype.name === constants.types.AKM_CONTAINER) {
                            objtypeview.image = './../images/blank.png';
                        }
                    }
                }
            }
        }
    }

    // repair RelationshipTypeViews
    purgeUnusedRelshiptypes(myMetis);
    repairRelationshipTypeViews(myMetis, myDiagram);
    if (debug) console.log('2852 myMetis', myMetis);

    // repair ObjectTypeViews
    const modifiedMetamodels = new Array();
    const metamodels: akm.cxMetaModel[] = [];
    const coreMetamodel = myMetis.findMetamodelByName("AKM-Core_MM");
    const objtypeviews = getObjectTypeviews(coreMetamodel);
    coreMetamodel.objecttypeviews = objtypeviews;
    metamodels.push(coreMetamodel);
    const jsnMetamodel = new jsn.jsnMetaModel(coreMetamodel, true);
    modifiedMetamodels.push(jsnMetamodel);

    for (let i = 0; i < myMetis.metamodels?.length; i++) {
        const mmodel = myMetis.metamodels[i];
        if (mmodel.name === 'AKM-Core_MM') continue;
        const objtypeviews = getObjectTypeviews(mmodel);
        mmodel.objecttypeviews = objtypeviews;
        metamodels.push(mmodel);
        const jsnMetamodel = new jsn.jsnMetaModel(mmodel, true);
        modifiedMetamodels.push(jsnMetamodel);
    }
    myMetis.metamodels = metamodels;

    for (let i = 0; i < myMetis.metamodels?.length; i++) {
        const mmodel = myMetis.metamodels[i];
        const objtypeviews = mmodel.objecttypeviews;
        for (let j = 0; j < objtypeviews?.length; j++) {
            const objtypeview = objtypeviews[j];
            myMetis.addObjectTypeView(objtypeview);
        }
    }

    // Dispatch metamodels
    modifiedMetamodels.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data });
    });

    report += printf(format, msg);
    if (debug) console.log(report);
    myDiagram.requestUpdate();

    if (debug) console.log('2866 verifyAndRepairMetamodel ENDED, myMetis', myMetis);
}

export function repairRelationshipTypes(myMetis: akm.cxMetis) {
    // Create an empty list of relationship types
    // For each object type, find all relationships: 

    let myArray = [];
    const relshiptypes = myMetis.relshiptypes;
    const metamodels = myMetis.metamodels;
    if (debug) console.log('2860 metamodels, relshiptypes', metamodels, relshiptypes);
    for (let i = 0; i < relshiptypes?.length; i++) {
        const reltype = relshiptypes[i];
        if (reltype) {
            const fromObjtypeRef = reltype.fromobjtypeRef;
            const fromObjtype = myMetis.findObjectType(fromObjtypeRef);
            const toObjtypeRef = reltype.toobjtypeRef;
            const toObjtype = myMetis.findObjectType(toObjtypeRef);
            for (let j = 0; j < metamodels?.length; j++) {
                let metamodel = metamodels[j];
                if (metamodel) {
                    const mReltype = metamodel.findRelationshipType(reltype.id);
                    if (!mReltype) {
                        metamodel = null;
                    } else {
                        const relid = "(" + reltype.id.substring(1, 8) + ")";
                        myArray.push({
                            name: fromObjtype.name + "_" + reltype.name + "_" + toObjtype.name + "_" + metamodel?.name + "_" + relid,
                            fromtype: fromObjtype,
                            reltype: reltype,
                            totype: toObjtype,
                            metamodel: metamodel
                        });
                    }
                }
            }
        }
    }
    myArray.sort(utils.compare);
    if (debug) console.log('2891 myArray', myArray);
    for (let i = 0; i < myArray?.length; i++) {
        const item = myArray[i];
        const item1 = myArray[i + 1];
        if (item && item1) {
            const fromtype = item.fromtype;
            const reltype = item.reltype;
            const totype = item.totype;
            const metamodel = item.metamodel as akm.cxMetaModel;
            const metamodel1 = item1.metamodel as akm.cxMetaModel;
            const fromtype1 = item1.fromtype;
            const reltype1 = item1.reltype;
            const totype1 = item1.totype;
            if (fromtype == fromtype1 && totype == totype1 && reltype.name == reltype1.name) {
                if (metamodel != metamodel1) {
                    const models = myMetis.models;
                    for (let j = 0; j < models?.length; j++) {
                        const model = models[j];
                        const relships = model.getRelationshipsByType(reltype1, false);
                        for (let k = 0; k < relships?.length; k++) {
                            const relship = relships[k];
                            if (relship) {
                                relship.type = reltype;
                            }
                        }
                    }
                    reltype1.markedAsDeleted = true;
                    metamodel1.addRelationshipType(reltype);
                    myMetis.addRelationshipType(reltype);
                }
            }
            if (debug && reltype.name === 'annotates') console.log('2936 metamodel, metamodel1', metamodel, metamodel1);
        }
    }
}

export function repairRelationshipTypeViews(myMetis: akm.cxMetis, myDiagram: any) {
    // Create an empty list of relationship type views
    // For each metamodel: go through each reltype and get the reltypeview
    // Store the combination of metamodel, reltype and reltypeview in a list
    // Go through all reltypeviews and check if they are in the list
    // If not, mark them as deleted
    let myArray = [];
    for (let i = 0; i < myMetis.metamodels?.length; i++) {
        const metamodel = myMetis.metamodels[i];
        const reltypes = metamodel.relshiptypes;
        for (let j = 0; j < reltypes?.length; j++) {
            const reltype = reltypes[j];
            const reltypeview = reltype.typeview;
            if (reltypeview) {
                reltypeview.name = reltype.name + "_" + reltype.relshipkind;
                myArray.push({ metamodel: metamodel, reltype: reltype, reltypeview: reltypeview });
            }
        }
    }
    if (debug) console.log('2868 myArray', myArray);
    // Go through all reltypeviews and check if they are in the list
    // If not, mark them as deleted
    const reltypeviews = myMetis.relshiptypeviews;
    for (let i = 0; i < reltypeviews?.length; i++) {
        const reltypeview = reltypeviews[i];
        let found = false;
        for (let j = 0; j < myArray?.length; j++) {
            const item = myArray[j];
            if (item.reltypeview.id === reltypeview.id) {
                found = true;
                break;
            }
        }
        if (!found) {
            reltypeview.markedAsDeleted = true;
        }
    }
    { // Purge deleted reltypeviews
        const reltypeviews = myMetis.relshiptypeviews;
        const len = myMetis.relshiptypeviews?.length;
        for (let i = len - 1; i >= 0; i--) {
            const reltypeview = reltypeviews[i];
            if (reltypeview.markedAsDeleted) {
                reltypeviews.splice(i, 1);
            }
        }
    }
    // Go through reltypeviews and fix some bugs
    let modifiedRelshipTypeViews = new Array();
    for (let i = 0; i < reltypeviews?.length; i++) {
        const reltypeview = reltypeviews[i];
        if (reltypeview.fromArrow === " ") reltypeview.fromArrow = "";
        if (reltypeview.toArrow === " ") reltypeview.toArrow = "";
        if (reltypeview.fromArrowColor === " ") reltypeview.fromArrowColor = "";
        if (reltypeview.toArrowColor === " ") reltypeview.toArrowColor = "";
        modifiedRelshipTypeViews.push(reltypeview);
    }
    // Dispatch reltypeviews
    modifiedRelshipTypeViews?.map(mn => {
        let data = (mn) && mn
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_RELSHIPTYPEVIEW_PROPERTIES', data })
    })

    if (debug) console.log('2896 myMetis', myMetis);
    // Create a list of all reltypes
    // Go through all metamodels and check each reltype
    // Reltypes not in use is marked as deleted
    {
        myArray = [];
        const metamodels = myMetis.metamodels;
        for (let i = 0; i < myMetis.relshiptypes?.length; i++) {
            const reltype = myMetis.relshiptypes[i];
            const fromobjtypeRef = reltype.fromobjtypeRef;
            const toobjtypeRef = reltype.toobjtypeRef;
            const fromObjtype = myMetis.findObjectType(fromobjtypeRef);
            const toObjtype = myMetis.findObjectType(toobjtypeRef);
            let metamodel = null;
            for (let j = 0; j < metamodels?.length; j++) {
                const mmodel = metamodels[j];
                const rtype = mmodel.findRelationshipType(reltype.id);
                if (rtype) {
                    metamodel = mmodel;
                    break;
                }
            }
            if (!metamodel) {
                reltype.markedAsDeleted = true;
                continue;
            }
            myArray.push({
                name: fromObjtype?.name, relName: reltype?.name, toName: toObjtype?.name,
                metamodel: metamodel ? metamodel.name : null,
                fromObjtype: fromObjtype, reltype: reltype, toObjtype: toObjtype
            });
        }
        myArray.sort(utils.compare);
        if (debug) console.log('2904 myArray', myArray);
    }
    { // Purge deleted reltypes
        const reltypes = myMetis.relshiptypes;
        const len = myMetis.relshiptypes?.length;
        for (let i = len - 1; i >= 0; i--) {
            const reltype = reltypes[i];
            if (reltype.markedAsDeleted) {
                reltypes.splice(i, 1);
            }
        }
    }
}

export function repairRelationshipViews(myModelView: akm.cxModelView, myDiagram: any): akm.cxModelView {
    const relviews = myModelView.relshipviews;
    for (let i = 0; i < relviews?.length; i++) {
        let relview = relviews[i];
        let fromObjview = relview.fromObjview;
        let toObjview = relview.toObjview;
        if (!fromObjview)
            continue;
        if (!fromObjview.object)
            continue;
        const rel = relview.relship;
        const fromObj = rel.fromObject;
        const toObj = rel.toObject;
        if (fromObjview.object?.id === fromObj?.id && toObjview.object?.id === toObj?.id) {
            continue;
        } else {
            const fromObjviews = myModelView.findObjectViewsByObject(fromObj);
            const toObjviews = myModelView.findObjectViewsByObject(toObj);
            if (fromObjviews?.length > 0) {
                fromObjview = fromObjviews[0];
            }
            if (toObjviews?.length > 0) {
                toObjview = toObjviews[0];
            }
            // fromObjview.object = fromObj;
            relview.fromObjview = fromObjview;
            // toObjview.object = toObj;
            relview.toObjview = toObjview;
            myModelView.addRelationshipView(relview);
        }
    }
    return myModelView;
}

export function repairMetisProperties(myMetis: akm.cxMetis, myDiagram: any) {
    const properties: akm.cxProperty[] = [];
    const metamodels = myMetis.metamodels;
    for (let i = 0; i < metamodels?.length; i++) {
        const metamodel = metamodels[i];
        const props = metamodel.properties;
        for (let j = 0; j < props?.length; j++) {
            const prop = props[j];
            properties.push(prop);
        }
    }
    myMetis.properties = properties;
    const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
    let data = { metis: jsnMetis }
    data = JSON.parse(JSON.stringify(data));
    myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
}

export function clearRelationshipTypeViews(metamodel: akm.cxMetaModel, myDiagram: any, myMetis: akm.cxMetis) {
    const reltypes = metamodel.relshiptypes;
    for (let i = 0; i < reltypes?.length; i++) {
        const reltype = reltypes[i];
        const reltypeview = reltype.typeview;
        if (reltypeview) {
            reltypeview.markedAsDeleted = true;
        }
        reltype.typeview = null;
    }
    { // Purge deleted reltypeviews
        const reltypeviews = myMetis.relshiptypeviews;
        const len = myMetis.relshiptypeviews?.length;
        for (let i = len - 1; i >= 0; i--) {
            const reltypeview = reltypeviews[i];
            if (reltypeview.markedAsDeleted) {
                reltypeviews.splice(i, 1);
            }
        }
    }
    // Dispatch metis
    const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
    let data = { metis: jsnMetis }
    data = JSON.parse(JSON.stringify(data));
    if (debug) console.log('2858 jsnMetis', jsnMetis, myMetis);
    myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
    if (debug) console.log('2860 data', data, myMetis);
}

export function updateNode(node: any, objtypeView: akm.cxObjectTypeView, diagram: any, goModel: gjs.goModel) {
    if (debug) console.log('2471 updateNode', node, diagram);
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
            if (debug) console.log('2483 prop, node[prop]', prop, node[prop]);
        }
        const objview = node.objectview;
        if (objview) {
            if (debug) console.log('2487 viewdata, objview', viewdata, objview);
            for (prop in viewdata) {
                if (objview[prop] && objview[prop] !== "") {
                    diagram.model.setDataProperty(node, prop, objview[prop]);
                }
            }
        }
        diagram.model.setDataProperty(node, 'typename', node.typename);
        if (goModel) {
            goModel.updateNode(node);
            if (debug) console.log('2500 updateNode', node, goModel);
        }
        if (debug) console.log('2502 updateNode', node, diagram);
    }
}

export function updateLink(data: any, reltypeView: akm.cxRelationshipTypeView, diagram: any) {
    let relview;
    if (reltypeView) {
        let viewdata: any = reltypeView.getData();
        if (debug) console.log('3096 data, viewdata', data, viewdata);
        relview = data.relshipview;
        if (relview) {
            for (let prop in viewdata) {
                if (prop === 'abstract') continue;
                if (prop === 'relshipkind') continue;
                if (prop === 'class') continue;
                if (prop === 'name') continue;
                if (relview[prop] && relview[prop] !== "") {
                    // if (propIsColor(prop)) {
                    //     if (viewdata[prop] != null)
                    //         diagram.model.setDataProperty(data, prop, viewdata[prop]);
                    // }
                    diagram.model.setDataProperty(data, prop, relview[prop]);
                    if (debug) console.log('2904 updateLink', prop, viewdata[prop], relview[prop]);
                }
                if (prop === 'strokewidth') {
                    if (relview[prop] === "" || !relview[prop])
                        relview[prop] === "1";
                } else if (prop === 'fromArrowColor') {
                    if (relview[prop] === "" || !relview[prop])
                        relview[prop] === "white";
                } else if (prop === 'toArrowColor') {
                    if (relview[prop] === "" || !relview[prop])
                        relview[prop] === "white";
                }
                diagram.model.setDataProperty(data, prop, viewdata[prop]);
                if (debug) console.log('2916 updateLink', prop, viewdata[prop], relview[prop]);
            }
        }
    }
    if (relview) {
        const link = diagram.findLinkForKey(data.key);
        if (link) {
            if (debug) console.log('3329 data, link, relview', data, link, relview);
            relview.arrowscale = relview.textscale * 1.3;
            diagram.model.setDataProperty(link.data, 'relship', relview.relship);
            diagram.model.setDataProperty(link.data, 'name', relview.name);
            diagram.model.setDataProperty(link.data, 'textscale', relview.textscale);
            diagram.model.setDataProperty(link.data, "textcolor", relview.textcolor);
            diagram.model.setDataProperty(link.data, "strokecolor", relview.strokecolor);
            diagram.model.setDataProperty(link.data, "strokewidth", relview.strokewidth);
            diagram.model.setDataProperty(link.data, 'arrowscale', relview.arrowscale);
            diagram.model.setDataProperty(link.data, "fromArrow", relview.fromArrow);
            diagram.model.setDataProperty(link.data, "toArrow", relview.toArrow);
            diagram.model.setDataProperty(link.data, "fromArrowColor", relview.fromArrowColor);
            diagram.model.setDataProperty(link.data, "toArrowColor", relview.toArrowColor);
        }
    }
}

export function deleteLinkByViewId(viewId: string, diagram: any) {
    const links = diagram.links;
    for (let it = links.iterator; it?.next();) {
        const link = it.value;
        if (link.data.relshipview.id == viewId) {
            diagram.startTransaction('DeleteLink');
            diagram.model.removeLinkData(link.data);
            diagram.commitTransaction('DeleteLink');
            break;
        }
    }
}

function propIsColor(prop: string): boolean {
    switch (prop) {
        case 'strokecolor':
        case 'fromArrowColor':
        case 'toArrowColor':
            return true;
        default:
            return false;
    }
}

// function isLinkAllowed(reltype: akm.cxRelationshipType, fromObj: akm.cxObject, toObj: akm.cxObject) {
//     if (reltype && fromObj && toObj) {
//         let fromType = reltype.getFromObjType();
//         let toType = reltype.getToObjType();
//         if (debug) console.log('2562 from and to type', reltype, fromType, toType);
//         if (debug) console.log('2563 fromObj and toObj', fromObj, toObj);
//         if (fromObj.getType().inherits(fromType)) {
//             if (debug) console.log('2565 inherits fromType: true');
//             if (toObj.getType().inherits(toType)) {
//                 if (debug) console.log('2567 inherits toType: true');
//                 return true;
//             }
//         }
//     }
//     return false;
// }

export function buildLinkFromRelview(model: gjs.goModel, relview: akm.cxRelationshipView, relship: akm.cxRelationship, data: any, diagram: any) {
    let reltype = relship.getType();
    let reltypeView = relview.getTypeView() as akm.cxRelationshipTypeView;
    if (!reltypeView) {
        reltypeView = reltype?.getDefaultTypeView() as akm.cxRelationshipTypeView;
    }
    if (reltypeView) {
        let link = new gjs.goRelshipLink(relview.id, model, relview);
        model.addLink(link);
        updateLink(data, reltypeView, diagram);
        diagram.requestUpdate();
    }
    return data;
}

function selectNameFromNameList(question, namelist, defText): string {
    if (true) {
        const name = prompt(question + namelist, defText);
        return name;
    } else {

    }
}

export function getNameList(inst: akm.cxObject | akm.cxRelationship, context: any, onlyWithProperties: boolean): string[] {
    let namelist = ['Details'];
    if (inst) {
        if (context.includeConnected) {
            namelist.push(inst.name);
            const connectedObjects = inst.getConnectedObjects2(context.myMetis);
            if (debug) console.log('3006 connectedObjects', connectedObjects);
            for (let i = 0; i < connectedObjects?.length; i++) {
                const connectedObj = connectedObjects[i];
                namelist.push(connectedObj?.name);
            }
        }
        let nlist = new Array();
        if (context.includeInherited) {
            try {
                const inheritedTypes = inst?.getInheritedTypes();
                if (debug) console.log('3015 inheritedTypes', inheritedTypes);
                for (let i = 0; i < inheritedTypes?.length; i++) {
                    const type = inheritedTypes[i];
                    if (type.name === constants.types.AKM_ENTITY_TYPE) 
                        continue;
                    if (type.name === 'Details') 
                        continue;
                    if (type.name === 'Type') 
                        continue;
                    if (onlyWithProperties) {
                        if (type.properties?.length > 0) {
                            nlist.push(type.name);
                        }
                    } else 
                        nlist.push(type.name);
                }
                let uniquelist = [...new Set(nlist)];
                nlist = uniquelist;
            } catch (error) {
                if (debug) console.log('3029 error', error);
            }
        }
        // namelist.push(inst.type.name);
        if (nlist.length > 0)  
            namelist = namelist.concat(nlist);
        namelist.push('Type');
        if (debug) console.log('3031 namelist', namelist);
        return namelist;
    }
}

export function repairGoModel(goModel: gjs.goModel, modelview: akm.cxModelView) {
    // Repair links
    const relviews = modelview.relshipviews;
    for (let i = 0; i < relviews?.length; i++) {
        const rview = relviews[i];
        let link = null;
        if (rview.markedAsDeleted)
            continue;
        const relship = rview.relship;
        const reltype = relship?.type;
        const links = goModel.links as gjs.goRelshipLink[];
        let found = false;
        for (let j = 0; j < links.length; j++) {
            link = links[j];
            const relviewRef = link.key;
            if (relviewRef === rview.id) {
                found = true;
                break;
            }
        }
        if (!found) {
            link = new gjs.goRelshipLink(rview.id, goModel, rview);
            goModel.addLink(link);
        }
        link.relshipRef  = relship?.id;
        link.relviewRef  = rview.id;
        link.reltypeRef  = relship.type?.id;
        link.relship     = null;
        link.relshipview = null;
        link.relshiptype = null;
    }
    const objviews = modelview.objectviews;
    for (let i = 0; i < objviews?.length; i++) {
        const oview = objviews[i];
        if (oview.markedAsDeleted)
            continue;
        const nodes = goModel.nodes as gjs.goObjectNode[];
        let found = false;
        for (let j = 0; j < nodes.length; j++) {
            const node = nodes[j];
            node.objRef = node.object?.id;
            node.object = null;
            node.objviewRef = node.objectview?.id;
            node.objectview = null;
            node.objtypeRef = node.objecttype?.id;
            node.objecttype = null;
            node.scale = node.getMyScale(goModel);
            node.scale = node.scale;
            if (debug) console.log('3073 node', node);
            goModel.addNode(node);
        }
    }
}

export function isGenericMetamodel(myMetis: akm.cxMetis) {
    const metamodel = myMetis.currentMetamodel;
    if (metamodel.name === 'GENERIC_MM')
        return true;
    return false;
}

export function setObjviewAttributes(data: any, myDiagram: any): akm.cxObjectView {
    const object = data.object;
    const objview = data.objectview;
    const typeview = data.typeview;
    for (let prop in typeview?.data) {
        if (objview[prop] && objview[prop] !== "") {
            myDiagram.model.setDataProperty(data, prop, objview[prop]);
        } else if (typeview?.data[prop] && typeview?.data[prop] !== "") {
            myDiagram.model.setDataProperty(data, prop, typeview[prop]);
        }
    }
    return objview;
}

export function setRelviewAttributes(data: any, myDiagram: any): akm.cxRelationshipView {
    const relview = data.relshipview;
    const typeview = data.typeview;
    for (let prop in typeview?.data) {
        if (relview[prop] && relview[prop] !== "") {
            myDiagram.model.setDataProperty(data, prop, relview[prop]);
        } else if (typeview?.data[prop] && typeview?.data[prop] !== "") {
            myDiagram.model.setDataProperty(data, prop, typeview[prop]);
        }
    }
    return relview;
}

export function setObjviewColors(data: any, object: any, objview: any, typeview: any, myDiagram: any): akm.cxObjectView {
    if (object) {
        let fillcolor = "";
        let strokecolor = "";
        let textcolor = "";
        if (object.fillcolor) {
            fillcolor = object.fillcolor;
        } else if (objview.fillcolor1) {
            fillcolor = objview.fillcolor1;
        } else if (typeview?.fillcolor) {
            fillcolor = typeview.fillcolor;
        }
        if (object.strokecolor) {
            strokecolor = object.strokecolor;
        } else if (objview.strokecolor2) {
            strokecolor = objview.strokecolor2;
        } else if (typeview?.strokecolor) {
            strokecolor = typeview.strokecolor;
        }
        if (object.textcolor) {
            textcolor = object.textcolor;
        } else if (objview.textcolor2) {
            textcolor = objview.textcolor2;
        } else if (typeview?.textcolor) {
            textcolor = typeview.textcolor;
        }
        objview.fillcolor = fillcolor;
        objview.strokecolor = strokecolor;
        objview.textcolor = textcolor;
        data.fillcolor = fillcolor;
        myDiagram.model.setDataProperty(data, "fillcolor", fillcolor);
        data.strokecolor = strokecolor;
        myDiagram.model.setDataProperty(data, "strokecolor", strokecolor);
        data.textcolor = textcolor;
        myDiagram.model.setDataProperty(data, "textcolor", textcolor);
    }
    return objview;
}

function getObjectTypeviews(metamodel: akm.cxMetaModel): akm.cxObjectTypeView[] {
    const objtypeviews = [];
    const objtypes = metamodel.objecttypes;
    for (let i = 0; i < objtypes?.length; i++) {
        const objtype = objtypes[i];
        const objtypeview = objtype.typeview;
        if (objtypeview) {
            objtypeviews.push(objtypeview);
        }
    }
    return objtypeviews;
}

export function purgeObjectTypeViews(metamodel: akm.cxMetaModel): akm.cxObjectTypeView[] {
    const objtypeviews = metamodel.objecttypeviews;
    const len = objtypeviews?.length;
    for (let i = len - 1; i >= 0; i--) {
        const objtypeview = objtypeviews[i];
        // if objtypeview is not member of objecttypeviews
        // then mark it as deleted
        let found = false;
        for (let j = 0; j < objtypeviews?.length; j++) {
            const typeview = objtypeviews[j];
            if (objtypeview.id === typeview.id) {
                objtypeview.markedAsDeleted = false;
                found = true;
                break;
            }
        }
        if (!found) {
            objtypeview.markedAsDeleted = true;
            objtypeviews.splice(i, 1);
        }
    }
    return objtypeviews;
}

export function getActiveRelationshipTypeViews(myMetis: akm.cxMetis): akm.cxRelationshipTypeView[] {
    const activeRelationshipTypeViews = [];
    const metamodels = myMetis.metamodels;
    for (let i = 0; i < metamodels?.length; i++) {
        const metamodel = metamodels[i];
        const reltypes = metamodel.relshiptypes;
        for (let j = 0; j < reltypes?.length; j++) {
            const reltype = reltypes[j];
            const reltypeview = reltype.typeview;
            if (reltypeview) {
                activeRelationshipTypeViews.push(reltypeview);
            }
        }
    }
    return activeRelationshipTypeViews;
}

export function purgeUnusedRelshiptypeViews(myMetis: akm.cxMetis, activeRelationshipTypeViews: akm.cxRelationshipTypeView[]) {
    const reltypeviews = myMetis.relshiptypeviews;
    const len = reltypeviews?.length;
    for (let i = len - 1; i >= 0; i--) {
        const reltypeview = reltypeviews[i];
        if (reltypeview.markedAsDeleted) {
            reltypeviews.splice(i, 1);
        } else {
            let found = false;
            for (let j = 0; j < activeRelationshipTypeViews?.length; j++) {
                const activeReltypeview = activeRelationshipTypeViews[j];
                if (reltypeview.id === activeReltypeview.id) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                reltypeview.markedAsDeleted = true;
            }
        }
    }
}

export function fullFillGoModel(myGoModel: gjs.goModel, myModelView: akm.cxModelView): gjs.goModel {
    // Fill the goModel with nodes and links
    const objviews = myModelView.objectviews;
    for (let i = 0; i < objviews?.length; i++) {
        const objview = objviews[i];
        const obj = objview.object;
        if (obj) {
            const node = new gjs.goObjectNode(objview.id, myGoModel, objview);
            myGoModel.addNode(node);
        }
    }
    const relviews = myModelView.relshipviews;
    for (let i = 0; i < relviews?.length; i++) {
        const relview = relviews[i];
        const relship = relview.relship;
        const link = new gjs.goRelshipLink(relview.id, myGoModel, relview);
        myGoModel.addLink(link);
    }
    return myGoModel;
}

