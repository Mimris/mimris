// @ts- nocheck
const debug = false; 

import * as utils from './utilities';
import * as akm from './metamodeller';
import * as uid from './ui_diagram';
import * as gjs from './ui_gojs';
import * as jsn from './ui_json';
import * as gen from './ui_generateTypes';
import { FaBullseye, FaLessThan, FaNode } from 'react-icons/fa';
import { setMyMetisParameter } from '../actions/actions';
import { NodeStringDecoder } from 'string_decoder';
//import { ButtonGroupProps } from 'reactstrap';
const constants = require('./constants');
const printf = require('printf');

//import { render } from 'react-dom';

//import * as go from 'gojs';

// functions to handle nodes
export function createObject(data: any, context: any): akm.cxObjectView | null {
    if (debug) console.log('22 context, data', context, data);
    if (data === null) {
        return null;
    } else {
        let objview: akm.cxObjectView;
        const myMetis = context.myMetis;
        const myModel = context.myModel;
        const myMetamodel = context.myMetamodel;
        const myModelview = context.myModelview;
        const myGoModel = context.myGoModel;
        const myDiagram = context.myDiagram;
        if (debug) console.log('31 createObject', context, data);
        const otypeId = data.objecttype?.id;
        const objtype = myMetis.findObjectType(otypeId);
        if (!objtype)
            return null;

        if (debug) console.log('36 createObject', myMetis, data);
        let obj = data.object;
        if (obj.id === "")
            obj.id = utils.createGuid();
        const obj1 = myMetis.findObject(obj.id);
        if (obj1) obj = obj1;
        let name = context.pasted ? data.name : "";
        if (!data.parentModel) name = data.name;
        if (debug) console.log('44 context, name', context, name);
        if (myMetis.pasteViewsOnly) {
            const pastedobj = myMetis.findObject(obj.id);
            if (!pastedobj) {
                // This is not a pasted object, create a new one
                let guid = obj.id;
                obj = new akm.cxObject(guid, data.name, objtype, data.description);
                myMetis.pasteViewsOnly = false;
            } else {
                obj = pastedobj;
            }
        } else {
            obj = new akm.cxObject(utils.createGuid(), name, objtype, data.description);
        }
        if (debug) console.log('58 obj, myMetis', obj, myMetis);
        if (obj) {
            if (!myMetis.pasteViewsOnly) {
                obj.objectviews = null;
                obj.inputrels   = null;
                obj.outputrels  = null;
            }
            data.object = obj;
            data.category = 'Object';
            myDiagram.model.setDataProperty(data, 'category', data.category);
            // Include the new object in the current model
            myModel?.addObject(obj);
            if (debug) console.log('70 obj, myModel, myMetis', obj, myModel, myMetis);
            myMetis.addObject(obj);
            // Create the corresponding object view
            if (debug) console.log('73 obj', obj);
            const oviews = obj.objectviews;
            const oview0 = oviews?.length>0 ? oviews[0] : null;  
            objview = new akm.cxObjectView(utils.createGuid(), name, obj, "");
            if (debug) console.log('79 objview', objview);
            if (objview) {
                objview.setIsGroup(data.isGroup);
                objview.setLoc(data.loc);
                objview.setSize(data.size);
                objview.setScale(data.scale1);
                objview.setMemberscale(data.memberscale);
                // objview.setTemplate(data.template);
                // objview.setFigure(data.figure);
                let key = data.key.substr(0,36);
                let node = myGoModel?.findNode(key);
                if (!node) {
                    node = new gjs.goObjectNode(key, objview);   
                    if (node) {
                        node.loc = data.loc;
                        if (debug) console.log('97 node, data', node, data);
                        const group = getGroupByLocation(myGoModel, node.loc);
                        if (debug) console.log('99 group', group);
                        if (group) { 
                            const parentgroup = group;
                            node.group = parentgroup.key;
                            node.scale1 = new String(node.getMyScale(myGoModel));
                            data.scale1 = Number(node.scale1);
                        }
                    }
                }
                if (debug) console.log('106 data, node, myGoModel', data, node, myGoModel);    
                data.objectview = objview;
                // Include the object view in the current model view
                obj.addObjectView(objview);
                myModelview.addObjectView(objview);
                myMetis.addObjectView(objview);
                if (debug) console.log('112 data, objview', data, objview);
                // Then update the node with its new properties
                // First set name and reference to the objectview
                myDiagram.model.setDataProperty(data, "type", data.name);
                myDiagram.model.setDataProperty(data, "name", name);
                myDiagram.model.setDataProperty(data, "scale", data.scale1);
                myDiagram.model.setDataProperty(data, "objectview", objview);
                // Then set the view properties
                let objtypeView = objtype?.getDefaultTypeView();
                if (context.pasted) {
                    const id = data.typeview?.id;
                    objtypeView = myMetis.findObjectTypeView(id);
                    if (debug) console.log('124 objtypeView', objtypeView);
                }
                if (oview0) {
                    if (debug) console.log('127 oview0', oview0);
                    const otdata = objtypeView.data;
                    for (let prop in otdata) {
                        if (oview0[prop]) {
                            objview[prop] = oview0[prop];
                            myDiagram.model.setDataProperty(data, prop, objview[prop]);
                        } else {
                            myDiagram.model.setDataProperty(data, prop, otdata[prop]);
                        }
                    }
                    if (debug) console.log('137 objview', objview);
                    const node = new gjs.goObjectNode(data.key, objview);
                    myGoModel.addNode(node);
                    updateNode(node, objtypeView, myDiagram, myGoModel);
                    return objview;
                }
                if (!objtypeView) {
                    const key = utils.createGuid();
                    objtypeView = new akm.cxObjectTypeView(key, objtype.name, objtype, "");
                }
                if (objtypeView) {
                    objview.setTypeView(objtypeView);
                    const otdata = objtypeView.data;
                    // if (data['template'] !== otdata['template']) objview['template'] = data['template'];
                    // if (data['figure'] !== otdata['figure']) objview['figure'] = data['figure'];
                    // if (data['fillcolor'] !== otdata['fillcolor']) objview['fillcolor'] = data['fillcolor'];
                    // if (data['strokecolor'] !== otdata['strokecolor']) objview['strokecolor'] = data['strokecolor'];
                    // if (data['strokewidth'] !== otdata['strokewidth']) objview['strokewidth'] = data['strokewidth'];
                    // if (data['icon'] !== otdata['icon']) objview['icon'] = data['icon'];  
                    // Create the new node                          
                    const node = new gjs.goObjectNode(data.key, objview);
                    if (debug) console.log('137 createObject', node, data);
                    updateNode(node, objtypeView, myDiagram, myGoModel);
                    
                    node.isGroup  = data.isGroup;
                    node.loc      = data.loc;
                    node.size     = data.size;
                    node.scale1   = data.scale1;
                    node.memberscale = data.memberscale;
                    const group = getGroupByLocation(myGoModel, objview.loc);
                    if (debug) console.log('143 group', group, node);
                    if (group) {
                        group.memberscale = group.typeview.memberscale;
                        node.group = group.key;
                        let scale1 = Number(group.scale1) * Number(group.memberscale);
                        if (scale1 === 0) scale1 = 1;
                        node.scale1 = scale1.toString();
                        objview.group = group.objectview.id;
                        objview.scale1 = node.scale1;
                        const n = myDiagram.findNodeForKey(data.key);
                        myDiagram.model.setDataProperty(n.data, "group", node.group);
                        myDiagram.model.setDataProperty(n.data, "memberscale", Number(data.memberscale));
                        if (debug) console.log('150 group, node, data', group, node, data)
                        if (debug) console.log('162 n.data', n.data);
                    }
                    const n = myDiagram.findNodeForKey(node.key);
                    myDiagram.model.setDataProperty(n.data, "memberscale", Number(data.memberscale));
                    myDiagram.model.setDataProperty(n, "scale", Number(data.scale1));
                    if (debug) console.log('167 n.data', n.data);
                    myGoModel.addNode(node);

                }
                return objview;
            }
            if (debug) console.log('191 myMetis', myMetis);
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
        if (debug) console.log('157 createMetaContainer', data);
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
        if (debug) console.log('170 createObjectType', data);
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

export function updateObject(data: any, name: string, value: string, context: any) {
    if ((data === null) || (name !== "name") || (!data.object)) {
        return;
    } else {
        const myMetis         = context.myMetis;
        let currentObject     = data.object;
        let currentObjectView = data.objectview;
        const obj = myMetis.findObject(currentObject.id);
        if (obj) {
            currentObject = obj;
            currentObjectView = myMetis.findObjectView(currentObjectView.id);
        }
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
    }  else {
        const myMetis = context.myMetis;
        const myMetamodel = context.myMetamodel;
        // Check if this is a type change
        let objtype = data.objecttype;    
        objtype = myMetis.findObjectType(objtype.id);        
        const typename = data.name;
        if (objtype) {
            if  (
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
    const myMetis     = context.myMetis;
    const myDiagram   = context.myDiagram;
    // data, i.e. node
    if (objtype) {
        const objtypeview = objtype.getDefaultTypeView() as akm.cxObjectTypeView;
        const currentObject = myMetis.findObject(data.object?.id);
        if (currentObject) {
            const nameIsChanged = (currentObject.name !== currentObject.type?.name);
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
                // Apply local overrides
                currentObjectView['template'] = data.template;
                currentObjectView['figure'] = data.figure;
                currentObjectView['fillcolor'] = data.fillcolor;
                currentObjectView['strokecolor'] = data.strokecolor;
                currentObjectView['strokewidth'] = data.strokewidth;
                currentObjectView['icon'] = data.icon;
                // Update data (node)
                data.object.type = objtype;
                data.objecttype = objtype;
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

export function deleteObjectType(data: any, context: any) {   
}

export function deleteRelationshipType(reltype: akm.cxRelationshipType, deletedFlag: boolean) {
    if (reltype) {
        // Check if relationships of this type exists
        reltype.markedAsDeleted = deletedFlag;
    }

}

export function deleteNode(data: any, deletedFlag: boolean, context: any) {
    const myMetis     = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const myDiagram   = context.myDiagram;
    const selection   = myDiagram.selection;
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
    } else 
    if (data.category === constants.gojs.C_OBJECT) {
        const myGoModel = context.myGoModel;
        const node = myGoModel?.findNode(data.key) as gjs.goObjectNode;
        if (debug) console.log('469 delete node', node);
        if (node) {
            node.markedAsDeleted = deletedFlag;
            node.group = "";
            const objview = node.objectview;
            objview.markedAsDeleted = deletedFlag;
            const object = objview.object;
            if (debug) console.log('477 delete objview', objview);
            // If group, delete members of group
            if (node.isGroup) {
                if (debug) console.log('479 delete container', objview);
                const groupMembers = node.getGroupMembers(myGoModel);
                for (let i=0; i<groupMembers?.length; i++) {
                    const member = groupMembers[i];
                    deleteNode(member, deletedFlag, context);
                    myDiagram.requestUpdate();
                }
            }
            // Handle deleteViewsOnly
            if (myMetis.deleteViewsOnly) {
                object.removeObjectView(objview);
                if (debug) console.log('490 object, objview', object, objview);
                if (debug) console.log('491 myMetis', myMetis);
                return;
            }
            // Else handle delete object AND object views
            // First delete object
            if (object) {
                object.markedAsDeleted = deletedFlag;          
                if (debug) console.log('499 delete object', object);
            }         
            if (debug) console.log('518 nodes to delete', myDiagram.selection);
            myDiagram.requestUpdate();
            let connectedRels = object?.inputrels;
            if (debug) console.log('521 inputrels', connectedRels);
            for (let i=0; i<connectedRels?.length; i++) {
                const rel = connectedRels[i];
                if (rel.markedAsDeleted !== deletedFlag) {
                    rel.markedAsDeleted = deletedFlag;
                    if (debug) console.log('526 delete relship', rel);
                    const relviews = rel.relshipviews;
                    if (debug) console.log('528 input relviews', relviews);
                    for (let i=0; i<relviews?.length; i++) {
                        const relview = relviews[0];
                        if (relview) {
                            const link = myGoModel.findLinkByViewId(relview.id);
                            if (link) {
                                link.markedAsDeleted = deletedFlag;
                                myDiagram.model.removeLinkData(link); 
                            }
                            relview.markedAsDeleted = deletedFlag;
                            if (debug) console.log('540 delete relview', relview);
                        }
                    }
                    if (debug) console.log('545 delete rel', rel);
                }
            }
            connectedRels = object?.outputrels;
            if (debug) console.log('549 outputrels', connectedRels);
            for (let i=0; i<connectedRels?.length; i++) {
                const rel = connectedRels[i];
                if (rel.markedAsDeleted !== deletedFlag) {
                    rel.markedAsDeleted = deletedFlag;
                    const relviews = rel.relshipviews;
                    if (debug) console.log('555 outputrelviews', relviews);
                    for (let i=0; i<relviews?.length; i++) {
                        const relview = relviews[0];
                        if (relview) {
                            const link = myGoModel.findLinkByViewId(relview.id);
                            if (link) link.markedAsDeleted = deletedFlag;
                            relview.markedAsDeleted = deletedFlag;
                            if (debug) console.log('564 delete relview', relview);
                        }
                    }
                    if (debug) console.log('569 delete rel', rel);
                }
            }
        }
    }
}

export function deleteLink(data: any, deletedFlag: boolean, context: any) {
    const myMetamodel = context.myMetamodel;
    const myMetis     = context.myMetis;
    const myGoModel   = context.myGoModel;

    // Replace myGoModel.nodes with a new array
    const links = new Array();
    for (let i = 0; i < myGoModel?.links.length; i++) {
        let l = myGoModel.links[i];
        links.push(l);
    }
    myGoModel.links = links;
    const link = myGoModel?.findLink(data.key) as gjs.goRelshipLink;
    if (debug) console.log('697 link', link);
    if (link) {
        const relview = link.relshipview;
        const relship = relview.relship;
        // Handle deleteViewsOnly
        if (myMetis.deleteViewsOnly) {
            relview.markedAsDeleted = deletedFlag;
            relship?.removeRelationshipView(relview);
            if (debug) console.log('707 deleteLink', relship, relview);
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
                        // Handle relshiptypeview
                        deleteRelshipTypeView(rview, deletedFlag);
                    }
                }
           }
        }      
    }
}

export function deleteRelshipTypeView(relview: akm.cxRelationshipView, deletedFlag: boolean) {

    const relship = relview?.relship;
    const reltype  = relship?.type;
    const typeview = relview?.typeview;
    const defaultTypeview = reltype?.typeview;
    if (typeview && defaultTypeview) {
        if (typeview.id !== defaultTypeview.id) {
            if (typeview.markedAsDeleted !== deletedFlag) {
                typeview.markedAsDeleted = deletedFlag;
                if (debug) console.log('683 delete typeview', typeview);
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
            const relview = createRelationship(link, context);
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

// Function to connect node object to group object
export function getGroupByLocation(model: gjs.goModel, loc: string): gjs.goObjectNode | null {
    if (!loc) return;
    let nodes = model.nodes;
    let uniqueSet = utils.removeArrayDuplicates(nodes);
    nodes = uniqueSet;
    if (debug) console.log('nodes, loc ', nodes, loc);
    let groups = new Array();
    for (let i = 0; i < nodes?.length; i++) {
        const node = nodes[i] as gjs.goObjectNode;
        if (debug) console.log('863 node', node);
        if (node.isGroup) {
            if (debug) console.log('865 node', node);
            const nodeLoc = loc.split(" ");
            const grpLoc = node.loc?.split(" ");
            const grpSize = node.size?.split(" ");
            if (!grpLoc) return;
            const nx = parseInt(nodeLoc[0]);
            const ny = parseInt(nodeLoc[1]);
            const gx = parseInt(grpLoc[0]);
            const gy = parseInt(grpLoc[1]);
            const gw = parseInt(grpSize[0]);
            const gh = parseInt(grpSize[1]);
            const size = Math.sqrt(gw * gw + gh * gh);
            if (debug) console.log('877 loc, node.loc', loc, node.loc);
            if (debug) console.log('878 nx, gx, gw, ny, gy, gh', nx, gx, gw, ny, gy, gh);
            if (
                (nx > gx) && (nx < gx + gw) &&
                (ny > gy) && (ny < gy + gh)
            ) {
                let grp = {"node": node, "size": size};
                if (debug) console.log('884 group', grp);
                groups.push(grp);
            }
        }
    }
    uniqueSet = utils.removeArrayDuplicates(groups);
    groups = uniqueSet;
    if (debug) console.log('889 nodes, groups', nodes, groups);
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

export function scaleNodeLocation(group: any, node: any): any  {
    const grpLoc = group.loc?.split(" ");
    if (!grpLoc) return;
    const gx = parseInt(grpLoc[0]);
    const gy = parseInt(grpLoc[1]);
    const nodeLoc = node.loc.split(" ");
    let nx = parseInt(nodeLoc[0]);
    let ny = parseInt(nodeLoc[1]);
    let deltaNx = nx - gx;
    let deltaNy = ny - gy;
    const scale = node.scale1;
    deltaNx *= scale;
    deltaNy *= scale;
    nx = gx + deltaNx;
    ny = gy + deltaNy;
    const loc = { "x": nx, "y": ny };
    if (debug) console.log('921 node, node.loc, loc', node, node.loc, loc);
    return loc;
}

// export function handleMembersInGroup(refloc: string, group: any, context: any): any {
//     const myGoModel = context.myGoModel;
//     const myModelview = context.myModelview;
//     const myDiagram = context.myDiagram;
//     const groupNode = myDiagram.findNodeForKey(group.key);
//     // Handle members in group
//     const nodes = getNodesInGroup(groupNode, myGoModel, myModelview.objectviews);
//     for (let i=0; i<nodes.length; i++) {
//         const n = nodes[i];
//         if (n) {
//             n.group = group.key;
//             const fromScale = group.scale1;
//             let scale = group.scale1 * group.memberscale;
//             n.scale1 = scale.toString();
//             const toScale = scale;
//             const scaleFactor = toScale / fromScale;
//             const nodeloc = scaleNodeLocation2(refloc, n, scaleFactor);
//             const loc = nodeloc.x + " " + nodeloc.y;
//             n.loc = loc;
//             const oview = n.objectview;
//             oview.loc = loc;
//             if (debug) console.log('474 oview', oview);
//             myDiagram.model?.setDataProperty(n.data, "loc", loc);
//         }
//     }
// }

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
                                rel.setMarkedAsDeleted(true);
                            }
                        }
                    }
                }
            }
        }
    }
}

export function changeNodeSizeAndPos(data: gjs.goObjectNode, fromloc: any, toloc:any, goModel: gjs.goModel, myDiagram: any, modifiedNodes: any[]): gjs.goObjectNode {
    if (data.category === 'Object') {
        let objview;
        let node = goModel?.findNode(data.key);
        if (!node) node = data;
        if (node) {
            if (debug) console.log('1018 data, node, tonode', data, node, toloc);
            node.loc = toloc;
            node.size = data.size;
            const scale = data.scale1;
            node.scale1 = scale;
            if (node.isGroup) {   // node is a group
                const group = node;
                // Get potential members of the group
                const nods = goModel?.nodes;
                for (let i=0; i<nods.length; i++) {
                    let nod = nods[i] as gjs.goObjectNode;
                    // if nod is the group, do nothing
                    if (nod.key === group.key)
                        continue;
                    const grp = getGroupByLocation(goModel, nod.loc);
                    if (grp) {
                        if (debug) console.log('1034 grp, nod', grp, nod);
                        // This (grp) is the container
                        nod.group = grp.key;
                        const loc = scaleNodeLocation(grp, nod);
                        const n = myDiagram.findNodeForKey(nod.key);
                        if (n?.data) {
                            myDiagram.model.setDataProperty(n.data, "group", nod.group);
                            if (debug) console.log('1041 n.data', n.data);
                        }
                    } else {
                        nod.group = "";
                    }
                    objview = nod.objectview;
                    if (objview) {
                        objview.loc = nod.loc;
                        objview.size = nod.size;
                        objview.modified = true;
                        if (nod.group)
                            objview.group = grp.objectview.id;
                        else    
                            objview.group = "";
                    }
                }
            }
            const modNode = new jsn.jsnObjectView(objview);
            modifiedNodes.push(modNode);

        }
        return node;
    }
}

export function getNodesInGroup(groupNode: gjs.goObjectNode, myGoModel: any, myObjectviews: akm.cxObjectView[]) : gjs.goObjectNode[] {
    const nodes = new Array();
    if (debug) console.log('950 groupNode', groupNode);
    const groupObjview = groupNode.objectview;
    const groupId = groupObjview.id;
    if (debug) console.log('1035 groupNode, groupId, myObjectviews', groupNode, groupId, myObjectviews);
    for (let i=0; i<myObjectviews?.length; i++) {
        const oview = myObjectviews[i];
        if (debug) console.log('1038 oview', oview);
        const loc = oview?.loc;
        if (oview?.group === groupId) {
            if (debug) console.log('1039 oview', oview);
            const node = myGoModel.findNodeByViewId(oview.id);
            if (node) {
                node.objectview = oview;
                node.loc = loc;
                nodes.push(node);
            }
        }
    }
    if (debug) console.log('1063 nodes', nodes);
    return nodes;
}

export function scaleNodesInGroup(groupNode: gjs.goObjectNode, myGoModel: any, myObjectviews: akm.cxObjectView[], 
                                  fromLocs: any, toLocs: any, myDiagram: any, modifiedNodes: any): any[] {
    let fromScale = Number(groupNode.scale1);
    let toScale = Number(groupNode.scale1) * Number(groupNode.typeview.memberscale);
    let scaleFactor = toScale / fromScale;
    if (debug) console.log('1082 myObjectviews, fromLocs, toLocs', myObjectviews, fromLocs, toLocs);
    // First handle the group itself
    const size = groupNode.size.split(" ");
    const sx = parseInt(size[0]);
    const sy = parseInt(size[1]);
    const sizeX = sx * scaleFactor;
    const sizeY = sy * scaleFactor;
    const newSize = sizeX + " " + sizeY;
    groupNode.size = newSize;
    if (debug) console.log('1091 groupNode, newSize', groupNode, newSize);
    const nodes = getNodesInGroup(groupNode, myGoModel, myObjectviews);
    let refloc = groupNode.loc;
    if (debug) console.log('1094 groupNode, nodes, scaleFactor, refloc', groupNode, nodes, scaleFactor, refloc);
    // let fromScale, toScale;
    for (let i=0; i<nodes.length; i++) {
        const n = nodes[i];
        if (n) {
            // const oview = n.objectview;
            let fromnode;
            for (let j=0; j<fromLocs?.length; j++) {
                const fromNode = fromLocs[j];
                if (fromNode.key === n.key) {
                    fromnode = fromNode.loc;
                    fromScale = fromNode.scale;
                    if (debug) console.log('1106 fromNode, fromnode, fromScale', fromNode, fromnode, fromScale);
                    break;
                }
            }
            let tonode, toNode;
            for (let j=0; j<toLocs?.length; j++) {
                toNode = toLocs[j];
                if (toNode.key === n.key) {
                    tonode = toNode.loc;
                    // toScale = toNode.scale;
                    if (debug) console.log('1116 toNode, tonode, toScale', toNode, tonode, toScale);
                    break;
                }
            }
            scaleFactor = toScale / fromScale;
            if (debug) console.log('1121 n, refloc, tonode, scaleFactor', n, refloc, fromnode, tonode, scaleFactor);
            // n.group = groupNode.key;
            const nodeloc = scaleNodeLocation2(n, refloc, tonode, scaleFactor);
            if (debug) console.log('1124 n, nodeloc', n, nodeloc);
            if (nodeloc) {
                let loc = nodeloc.x + " " + nodeloc.y;
                n.loc = loc;
                n.scale1 = toScale.toString();

                const nod = myGoModel.findNodeByViewId(n.objectview.id);
                if (nod) {
                    nod.loc = loc;
                    nod.scale1 = toScale.toString();
                    toNode.loc = loc;
                }
                if (debug) console.log('1136 n, loc', n, loc);
            }

        }
    }
    if (debug) console.log('1141 myGoModel, toLocs', myGoModel, toLocs);
    return nodes;
}

export function scaleNodeLocation2(node: any, refloc: string, toloc:any, scaleFactor: any): any  {
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
        for (let i=0; i<nodes?.length; i++) {
          const n = nodes[i];
          if (n.group === node.id) {
            n.scale = node.scale * node.typeview.memberscale;
            subnodes.push(n);
            // const nods = scaleSubnodes(n, nodes);
          }
        }
        return subnodes;
    }
    return null;
}

// functions to handle links
export function createRelationship(data: any, context: any) {
    if (debug) console.log('974 createRelationship', data, context);
    const myDiagram = context.myDiagram;
    const myGoModel = context.myGoModel;
    const myMetis = context.myMetis; 
    const myMetamodel = myMetis.currentMetamodel;
    const myModel = context.myModel;
    const myModelview = context.myModelview;
    const fromNode = myGoModel.findNode(data.from);
    if (debug) console.log('980 myMetis', myMetis);
    if (debug) console.log('981 fromNode, data.from', fromNode, data.from);
    let nodeFrom = myDiagram.findNodeForKey(fromNode?.key)
    const toNode = myGoModel.findNode(data.to);
    let nodeTo   = myDiagram.findNodeForKey(toNode?.key)
    if (debug) console.log('985 createRelationship', myGoModel, fromNode, toNode);
    const fromObj = fromNode?.object;
    const toObj = toNode?.object;
    let typename = constants.types.AKM_GENERIC_REL;
    let reltype;
    if (!reltype) {
        let fromType = fromNode?.objecttype;
        let toType   = toNode?.objecttype;
        fromType = myMetamodel.findObjectType(fromType?.id);
        if (debug) console.log('994 fromType', fromType);
        if (!fromType) fromType = myMetamodel.findObjectType(fromNode?.object?.typeRef);
        if (fromType) {
            fromType.allObjecttypes = myMetamodel.objecttypes;
            fromType.allRelationshiptypes = myMetamodel.relshiptypes;
        }
        toType   = myMetamodel.findObjectType(toType?.id);
        if (debug) console.log('1001 toType', toType);
        if (!toType) toType = myMetamodel.findObjectType(toNode?.object?.typeRef);
        if (toType) {
            toType.allObjecttypes = myMetamodel.objecttypes;
            toType.allRelationshiptypes = myMetamodel.relshiptypes;
        }
        if (debug) console.log('1007 includeInherited', myModelview.includeInheritedReltypes);
        if (fromType && toType) {
            const appliesToLabel = fromType.name === constants.types.AKM_LABEL;            
            let defText = appliesToLabel ? constants.types.AKM_ANNOTATES : constants.types.AKM_GENERIC_REL;
            let includeInherited = false;
            if (myModelview.includeInheritedReltypes) {
                includeInherited = true;
            }
            const reltypes = myMetamodel.findRelationshipTypesBetweenTypes(fromType, toType, includeInherited);
            if (debug) console.log('1017 reltypes, includeInherited', reltypes, includeInherited);
            if (reltypes) {
                const choices1: string[] = [];
                if (defText.length > 0) choices1.push(defText);
                let choices2: string[]  = [];
                for (let i=0; i<reltypes.length; i++) {
                    const rtype = reltypes[i];
                    if (rtype.name === defText) {
                        continue;
                    }
                    choices2.push(rtype.name);  
                }  
                choices2 = [...new Set(choices2)];
                choices2.sort();
                const choices = choices1.concat(choices2);
                // Calling routine to select reltype from list
                const args = {
                    data: data,
                    typename: defText,
                    fromType: fromType,
                    toType: toType,
                    nodeFrom: nodeFrom,
                    nodeTo: nodeTo,
                    diagramModel: myDiagram.diagramModel,
                    context: context
                }
                const modalContext = {
                    what: "selectDropdown",
                    title: "Select Relationship Type",
                    case: "Create Relationship",
                    myDiagram: myDiagram,
                    context: context,
                    data: data,
                    typename: defText,
                    fromType: fromType,
                    toType: toType,
                    nodeFrom: nodeFrom,
                    nodeTo: nodeTo,
                } 
                if (debug) console.log('1050 myDiagram, args', myDiagram, args);
                // myDiagram.model.setDataProperty(data, "name", typename);
                context.handleOpenModal(choices, modalContext);
                if (debug) console.log('1053 modalContext', modalContext);                
            }
        }
    }
}

export function createRelshipCallback(args:any): akm.cxRelationshipView {
    if (debug) console.log('1216 createRelshipCallback', args);
    const myDiagram = args.context.myDiagram;
    const myGoModel = args.context.myGoModel;
    const myMetis   = args.context.myMetis; 
    const myMetamodel = myMetis.currentMetamodel;
    const myModel  = args.context.myModel;
    const myModelview = myGoModel.modelView;
    const data     = args.data;
    const typename = args.typename;
    const fromType = args.fromType;
    const toType   = args.toType;
    const nodeFrom = args.nodeFrom;
    const objFrom  = nodeFrom.data.object;
    const nodeTo   = args.nodeTo;
    const objTo    = nodeTo.data.object;
    const context  = args.context;
    const reltype = myMetamodel.findRelationshipTypeByName2(typename, fromType, toType);
    if (debug) console.log('1075 reltype', reltype);
    if (!reltype) {
        alert("Relationship type given does not exist!")
        myDiagram.model.removeLinkData(data);
        return;
    }
    if (debug) console.log('1081 typename, data, reltype', typename, data, reltype);
    const rel = myModel.findRelationship2(objFrom, objTo, reltype, typename);
    if (rel) {
        alert("Relationship already exists!\nOperation is cancelled.")
        myDiagram.model.removeLinkData(data);
        return;
    }
    let relshipview: akm.cxRelationshipView;
    data.relshiptype = reltype;
    const reltypeview = reltype.typeview;
    if (debug) console.log('1198 args, data, reltypeview', args, data, reltypeview);
    relshipview = createLink(data, context); 
    if (debug) console.log('1200 data, relshipview', data, relshipview);
    if (relshipview) {
        relshipview.setTypeView(reltypeview);
        const relship = relshipview.relship; 
        relship.relshipkind = reltype.relshipkind;
        relshipview.setFromArrow2(rel?.relshipkind);
        relshipview.setToArrow2(rel?.relshipkind);
        // relshipview = updateRelationshipView(relshipview);
        relship.addRelationshipView(relshipview);
        if (debug) console.log('1337 data', data);
        myDiagram.model.setDataProperty(data, "name", new String(typename).valueOf());
        if (debug) console.log('1340 relshipview', relshipview);
        const id = relshipview.id;
        let name = data.name;  
        if (context.myModelview.askForRelshipName){
            name = prompt('Enter relationship name', name);
            if (!name) name = data.name;
            if (name.length == 0) name = " ";
        }   
        // relshipview = updateRelationshipView(relshipview);
        relshipview.id = id;
        relshipview.name = name;
        relship.name = name;
        data.name = name;
        if (debug) console.log('1351 data, relshipview', data, relshipview);
        if (debug) console.log('1352 myModelview, relshipview', myModelview, relshipview);
        // updateLink(data, relshipview.typeview, myDiagram, myGoModel);

        let link = myGoModel.findLink(data.key);
        uid.resetToTypeview(link, myMetis, myDiagram); 

        myModelview.addRelationshipView(relshipview);
        myMetis.addRelationshipView(relshipview);
        myModel.addRelationship(relship);
        myMetis.addRelationship(relship);
        // Dispatch
        const modifiedRelships = new Array();
        const jsnRelship = new jsn.jsnRelationship(relship);
        if (debug) console.log('1360 jsnRelship', jsnRelship);
        modifiedRelships.push(jsnRelship);
        modifiedRelships.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            (mn) && myDiagram.dispatch({ type: 'UPDATE_RELSHIP_PROPERTIES', data })
        })      
        const modifiedRelviews = new Array();
        const jsnRelview = new jsn.jsnRelshipView(relshipview);
        if (debug) console.log('1369 jsnRelview', jsnRelview);
        modifiedRelviews.push(jsnRelview);
        modifiedRelviews.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            if (debug) console.log('1374 data', data, myModelview);
            (mn) && myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
        })              
        const modifiedModelviews = new Array();
        const jsnModelview = new jsn.jsnModelView(myModelview);
        modifiedModelviews.push(jsnModelview);
        modifiedModelviews.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
        })
        link = myDiagram.findLinkForKey(data.key);
        if (debug) console.log('1388 link, relshipview', link, relshipview);
        myDiagram.model.setDataProperty(link, "name", name);
        myDiagram.model.setDataProperty(link.data, "name", name);
        myDiagram.model.setDataProperty(link.data, "category", "Relationship");
        if (debug) console.log('1389 jsnRelship, jsnRelview, jsnModelview', jsnRelship, jsnRelview, jsnModelview);
    }        
    if (debug) console.log('1393 data, relshipview, modelview', data, relshipview, myModelview);
    myDiagram.requestUpdate();
    return relshipview;
}

export function pasteRelationship(data: any, nodes: any[], context: any) {
    const myDiagram = context.myDiagram;
    const myGoModel = context.myGoModel;
    const myMetis   = context.myMetis;
    const myModel   = context.myModel;
    const myModelview = myMetis.currentModelview;
    const pasteViewsOnly = myMetis.pasteViewsOnly;
    if (debug) console.log('1134 pasteViewsOnly', pasteViewsOnly);
    if (debug) console.log('1135 myMetis', myMetis, myGoModel);
    if (debug) console.log('1136 pasteRelationship', data);
    // Relationship type must exist
    let reltype = data.relshiptype;
    reltype = myMetis.findRelationshipType(reltype?.id);
    // if (reltype) 
    //     reltype = myMetis.findRelationshipType(reltype.id);
    if (debug) console.log('1142 pasteRelationship', reltype);
    if (!reltype)
        return;
    //const reltypeview = reltype.getDefaultTypeView();
    // Find source objects
    const fromNodeRef = data.from;
    const toNodeRef   = data.to;
    const fromNode = myDiagram.findNodeForKey(fromNodeRef);
    const toNode = myDiagram.findNodeForKey(toNodeRef);
    if (debug) console.log('1151 fromNode, toNode, pasteViewsOnly', fromNode, toNode, pasteViewsOnly);
    const fromObjview = fromNode?.data.objectview;
    const toObjview   = toNode?.data.objectview;
    let   relship     = data.relshipview.relship;
    const typeview    = data.relshipview.typeview;
    if (debug) console.log('1156 pasteRelationship', fromObjview, toObjview);
    if (!pasteViewsOnly) {
        let fromObj = fromObjview?.object;
        fromObj = myMetis.findObject(fromObj?.id);
        let toObj = toObjview?.object;
        toObj = myMetis.findObject(toObj?.id);
        if (fromObj && toObj) {
            relship = new akm.cxRelationship(utils.createGuid(), reltype, fromObj, toObj, "", "");
            relship.setModified();
            data.relship = relship;
            relship.setName(data.name);
            myMetis.currentModel.addRelationship(relship);
            myMetis.addRelationship(relship);
        }
    } else {
        relship = myMetis.findRelationship(relship?.id);
    }
    if (debug) console.log('1175 relationship', relship);
    const relshipview = new akm.cxRelationshipView(utils.createGuid(), relship.name, relship, "");
    if (relshipview) {
        relshipview.setTypeView(typeview);              // Uses same typeview as from relview
        relshipview.setFromObjectView(fromObjview);
        relshipview.setToObjectView(toObjview);
        relshipview.setModified();
        relship.addRelationshipView(relshipview);
        myModelview.addRelationshipView(relshipview);
        myMetis.addRelationshipView(relshipview);
    }
    if (debug) console.log('1186 relshipview', relshipview, myMetis);
    if (debug) console.log('1187 myModel', myModel);
    myDiagram.requestUpdate();
    return relshipview; 
}

export function updateRelationship(data: any, name: string, value: string, context: any) {
    if (debug) console.log('1193 updateRelationship', name, value, data);
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
        return currentRelship;
    }
}

export function createRelationshipType(fromTypeNode: any, toTypeNode: any, data: any, context: any) {
    const myMetis       = context.myMetis;
    const myMetamodel   = context.myMetamodel;
    const myGoMetamodel = context.myGoMetamodel;
    const myDiagram     = context.myDiagram;  
    let typename        = prompt("Enter type name:", "typename");
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
            let reltype   = myMetis.findRelationshipTypeByName1(typename, fromObjType, toObjType);
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
                    updateLink(data, reltypeView2, myDiagram, myGoMetamodel);
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
                        updateLink(data, reltypeView, myDiagram, myGoMetamodel);
                        myDiagram.requestUpdate();
                        if (debug) console.log('1293 myMetamodel', myMetamodel);
                    }
                    console.log('1295 reltype', reltype);
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
    }  else {
        const metis = context.myMetis;
        const myMetamodel = context.myMetamodel;
        const myGoMetamodel = context.myGoMetamodel;
        const myDiagram   = context.myDiagram;
        const typename    = value;
        // Check if this is a type change
        let reltype = metis.findRelationshipType(data.reltype.id);            
        if (debug) console.log('1316 updateRelationshipType', reltype);
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
				updateLink(data, reltypeView, myDiagram, myGoMetamodel); 
				myDiagram.requestUpdate();
            }                
        }
    }
}

export function setRelationshipType(data: any, reltype: akm.cxRelationshipType, context: any) {
    const myMetis       = context.myMetis;
    const myGoMetamodel = context.myGoMetamodel;
    const myDiagram     = context.myDiagram;

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
                currentRelshipView['dash']        = reltypeview['dash'];
                currentRelshipView['fromArrow']   = reltypeview['fromArrow'];
                currentRelshipView['toArrow']     = reltypeview['toArrow'];
                updateLink(data, reltypeview, myDiagram, myGoMetamodel);
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

export function updateRelationshipView(relview: akm.cxRelationshipView):  akm.cxRelationshipView {
    if (relview) {
        if (!relview.textscale) 
            relview.textscale = "1";
        if (!relview.arrowscale)
            relview.arrowscale = "1.3";
        const typeview = relview.typeview;
        // if (typeview) {
        //     const viewdata = typeview.data;
        //     for (let prop in viewdata) {
        //         if (relview[prop] === viewdata[prop]) {
        //             relview[prop] = "";
        //         }
        //     }
        // }
        if (relview.strokewidth === "") {
            relview.strokewidth = "1";
        }
    }
    return relview;
}

export function createLink(data: any, context: any): any {
    // Creates both relship and relship view
    if (debug) console.log('1431 createLink', data, context);
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
            scale = fromNode.scale1;
        }
        let toNode = data.toNode;
        if (!toNode) {
            toNode = myGoModel.findNode(data.to);
            if (scale > toNode.scale1)
                scale = toNode.scale1;
        }
        const fromType = fromNode?.objecttype;
        const toType   = toNode?.objecttype;
        if (debug) console.log('1450 createLink', data.relshiptype.name, fromType, toType);
        reltype = myMetis.findRelationshipTypeByName2(data.relshiptype.name, fromType, toType);
        if (debug) console.log('1452 reltype', reltype);
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
            if (debug) console.log('1466 createLink', fromObj, toObj);
            if (fromObj && toObj) {
                // Find relationship if it already exists
                const myModel = context.myModel;
                let relship = myModel.findRelationship2(fromObj, toObj, reltype.name, reltype);
                if (debug) console.log('1471 relship', relship);
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
                if (debug) console.log('1484 relship', relship);
                if (relship) {
                    let typeview = data.relshiptype.typeview;
                    if (!typeview) typeview = reltype.getDefaultTypeView();
                    if (debug) console.log('1487 typeview', typeview);
                    relshipview = new akm.cxRelationshipView(utils.createGuid(), relship.name, relship, "");
                    if (debug) console.log('1609 relshipview', relshipview);
                    if (relshipview) {
                        const myModelview = context.myModelview;
                        const diagram = context.myDiagram;
                        relshipview.setModified();
                        data.relshipview = relshipview;
                        relshipview.setName(relship.name);
                        relshipview.setTypeView(typeview);
                        relshipview.setFromObjectView(fromObjView);
                        relshipview.setToObjectView(toObjView);
                        relshipview.setTextScale(scale);
                        relshipview.strokewidth = "";
                        relshipview.textscale = "";
                        myModelview.addRelationshipView(relshipview);
                        myMetis.addRelationshipView(relshipview);
                        let linkData = buildLinkFromRelview(myGoModel, relshipview, relship, data, diagram);
                    }
                    if (debug) console.log('1503 typeview, relshipview', typeview, relshipview);
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
            const link = myGoModel.findLink(lnk.key) as gjs.goRelshipLink;
            if (debug) console.log('1746 link', link);
            if (link) {
                let relview = link.relshipview;    // cxRelationshipView
                relview = myMetis.findRelationshipView(relview.id);
                const rel = relview?.relship;    // cxRelationship   
                if (debug) console.log('1751 rel, relview', rel, relview);
                if (rel && relview) {
                    // Before relink
                    const name = rel.name;
                    let fromObj1 = rel.fromObject;
                    fromObj1 = myMetis.findObject(fromObj1.id);
                    fromObj1.removeOutputrel(rel);
                    let toObj1 = rel.toObject;
                    toObj1 = myMetis.findObject(toObj1.id);
                    toObj1.removeInputrel(rel);
                    if (debug) console.log('1762 fromobj1, toObj1', fromObj1, toObj1);  
                    // After relink   
                    link.category = lnk.category;
                    link.name = name;        
                    link.setFromNode(lnk.from);
                    const fromObjView = fromNode.objectview;
                    relview.fromObjview = fromObjView;
                    rel.fromObject = myMetis.findObject(fromObjView.object.id);  
                    link.setToNode(lnk.to);
                    const toObjView = toNode.objectview;
                    relview.toObjview = toObjView;
                    rel.toObject = myMetis.findObject(toObjView.object.id); 
                    const fromObj2 = rel.fromObject;
                    fromObj2.addOutputrel(rel);
                    const toObj2 = rel.toObject;
                    toObj2.addInputrel(rel);
                    if (debug) console.log('1777 fromobj2, toObj2', fromObj2, toObj2);  
                    const myLink = myDiagram.findLinkForKey(link.key);
                    myLink.category = link.template;
                    // Do the dispatches          
                    const jsnRelview = new jsn.jsnRelshipView(relview);
                    context.modifiedLinks.push(jsnRelview);
                    const jsnRel = new jsn.jsnRelationship(rel);
                    context.modifiedRelships.push(jsnRel);
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
    const newArray  = new Array();
    for (let i=0; i<linkArray.length; i++) {
        const l = linkArray[i]; 
        if (l) newArray.push(l);
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

export function addMissingRelationshipViews(modelview: akm.cxModelView, myMetis: akm.cxMetis) {
    const objviews = modelview.objectviews;
    const links = new Array();
    const modifiedRelshipViews = new Array();
    for (let i=0; i<objviews?.length; i++) {
    //   const objview = objviews[i];
    //   addRelationshipViewsToObjectView(modelview, objview, myMetis);  
    // }   
      const objview = objviews[i];
      const obj = objview.object;
      const outrels = obj?.outputrels;
      if (debug) console.log('1753 obj, outrels', obj, outrels);
      for (let j=0; j<outrels?.length; j++) {
        let rel = outrels[j];
        if (rel.markedAsDeleted) continue;
        rel = myMetis.findRelationship(rel.id);
        const rviews = rel.relshipviews;
        const mrelviews = modelview.relshipviews;
        if (debug) console.log('1759 modelview, mrelviews', modelview, mrelviews);
        let found = false;
        if (rviews?.length > 0) {
          for (let i=0; i<rviews?.length; i++) {
            const rv = rviews[i];
            for (let j=0; j<mrelviews?.length; j++) {
              const mrv = mrelviews[j];
              if (mrv.id === rv.id) {
                  if (!mrv.markedAsDeleted)
                    found = true;
                break;
              }
            }                      
          }
          // Relview is NOT missing - do nothing
          if (found)
            continue;
        }
        if (debug) console.log('1776 rviews', rel, rviews);
        // Check if from- and to-objects have views in this modelview
        const fromObj = rel.fromObject as akm.cxObject;
        const fromObjviews = fromObj.objectviews;
        if (fromObjviews?.length == 0) {
          // From objview is NOT in modelview - do nothing
          continue;
        }
        if (debug) console.log('1784 fromObjviews', fromObjviews);
        const toObj = rel.toObject as akm.cxObject;
        const toObjviews = toObj.objectviews;
        if (toObjviews?.length == 0) {
          // To objview is NOT in modelview - do nothing
          continue;
        }
        if (debug) console.log('1791 toObjviews', toObjviews);
        // Relview(s) does not exist, but from and to objviews exist, create relview(s)
        const relview = new akm.cxRelationshipView(utils.createGuid(), rel.name, rel, rel.description);
        if (relview.markedAsDeleted) continue;
        let fromObjview = null;
        for (let i=0; i<fromObjviews?.length; i++) {
          const oview = fromObjviews[i];
          const moviews = modelview.objectviews;
          for (let j=0; j<moviews.length; j++) {
            if (moviews[j].id === oview.id) {
              fromObjview = oview;;
              break;
            }
          }
        }
        let toObjview = null;
        for (let i=0; i<toObjviews?.length; i++) {
          const oview = toObjviews[i];
          const moviews = modelview.objectviews;
          for (let j=0; j<moviews.length; j++) {
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
            const myGoModel = myMetis.gojsModel;
            let link = new gjs.goRelshipLink(utils.createGuid(), myGoModel, relview);
            link.loadLinkContent(myGoModel);
              myGoModel.addLink(link);
            links.push(link);
            if (debug) console.log('1690 relview, link', relview, link);
            // Prepare and do the dispatch
            const jsnRelview = new jsn.jsnRelshipView(relview);
            modifiedRelshipViews.push(jsnRelview);
        }
      }
    }
    modifiedRelshipViews.map(mn => {
      let data = mn;
      data = JSON.parse(JSON.stringify(data));
      myMetis.myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
    })
    if (debug) console.log('1702 myMetis', myMetis);
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
    for (let j=0; j<rels?.length; j++) {
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
            for (let i=0; i<rviews?.length; i++) {
            const rv = rviews[i];
            for (let j=0; j<mrelviews?.length; j++) {
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
        for (let i=0; i<fromObjviews?.length; i++) {
          const oview = fromObjviews[i];
          const moviews = modelview.objectviews;
          for (let j=0; j<moviews.length; j++) {
            if (moviews[j].id === oview.id) {
              fromObjview = oview;;
              break;
            }
          }
        }
        let toObjview = null;
        for (let i=0; i<toObjviews?.length; i++) {
          const oview = toObjviews[i];
          const moviews = modelview.objectviews;
          for (let j=0; j<moviews?.length; j++) {
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
            let link = new gjs.goRelshipLink(utils.createGuid(), myGoModel, relview);
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

// Other functions
export function addItemToList(list: any, item: any) {
    for (let i=0; i<list?.length; i++) {
        const l = list[i];
        if (l.id === item.id) {
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
    if (k === 'fromObject') retVal = false;
    if (k === 'fromobjectRef') retVal = false;
    if (k === 'fromObjview') retVal = false;
    if (k === 'fromObjviewRef') retVal = false;
    if (k === 'fs_collection') retVal = false;
    if (k === 'generatedTypeId') retVal = false;
    if (k === 'group') retVal = false;
    if (k === 'groupLayout') retVal = false;
    // if (k === 'id') retVal = false;
    if (k === 'inputrels') retVal = false;
    if (k === 'isCollapsed') retVal = false;
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
    if (k === 'pasteViewsOnly') retVal = false;
    if (k === 'points') retVal = false;
    if (k === 'propertyValues') retVal = false;
    if (k === 'relship') retVal = false;
    if (k === 'relshipRef') retVal = false;
    // if (k === 'relshipkind') retVal = false;
    if (k === 'relshipviews') retVal = false;
    if (k === 'size') retVal = false;
    if (k === 'sourceModelRef') retVal = false;
    if (k === 'sourceUri') retVal = false;
    if (k === 'targetMetamodelRef') retVal = false;
    if (k === 'targetModelRef') retVal = false;
    if (k === 'to') retVal = false;
    if (k === 'toObject') retVal = false;
    if (k === 'toobjectRef') retVal = false;
    if (k === 'toObjview') retVal = false;
    if (k === 'toObjviewRef') retVal = false;
    if (k === 'type') retVal = false;
    if (k === 'typeid') retVal = false;
    if (k === 'typeRef') retVal = false;
    if (k === 'toobjtypeRef') retVal = false;
    if (k === 'fromobjtypeRef') retVal = false;
    if (k === 'typeview') retVal = false;
    if (k === 'typeviewRef') retVal = false;
    if (k === 'valueset') retVal = false;
    // if (k === 'viewkind') retVal = false;
    if (k === 'visible') retVal = false;
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
    switch (k) {
        case 'id':
        case 'name':
        case 'description':
        case 'typeName':
        case 'typeDescription':
            break;
        default:
            // const metamodel = model?.metamodel;
            const properties = type?.getProperties(true);
            if (properties?.length > 0) {
            const prop = properties.find(p => p.name === k);
            if (!prop) {
                retVal = false;
            }
            break;
        }
    }
    return retVal;
}

function propIsUsedInTypes(metis: akm.cxMetis, prop): boolean {
    const metamodels = metis.metamodels;
    for (let i=0; i<metamodels?.length; i++) {
        const mmodel = metamodels[i] as akm.cxMetaModel;
        const otypes = mmodel.objecttypes;
        for (let j=0; j<otypes?.length; j++) {
            const otype = otypes[j];
            const props = otype.properties;
            for (let k=0; k<props?.length; k++) {
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
    for (let k=0; k<props?.length; k++) {
        const prop = props[k];
        if (!propIsUsedInTypes(metis, prop))
            continue;
        properties.push(prop);
    }
    metis.properties = properties;
    // Handle properties in metamodels
    const metamodels =metis.metamodels;
    for (let k=0; k<metamodels?.length; k++) {
        const mmodel = metamodels[k];
        const properties = new Array();
        const props = mmodel.properties;
        for (let k=0; k<props?.length; k++) {
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
    for (let k=0; k<otypes?.length; k++) {
        const objtyp = otypes[k];
        if (objtyp.markedAsDeleted) 
            continue;
        objtypes.push(objtyp);
    }        
    metis.objecttypes = objtypes;
    // Handle object type views
    const otypeviews = new Array();
    const otviews = metis.objecttypeviews;
    for (let k=0; k<otviews?.length; k++) {
        const tview = otviews[k];
        if (tview.markedAsDeleted) 
            continue;
        otypeviews.push(tview);
    }        
    metis.objecttypeviews = otypeviews;

    // Handle object type geos
    const otypegeos = new Array();
    const geos = metis.objtypegeos;
    for (let k=0; k<geos?.length; k++) {
        const geo = geos[k];
        if (geo.markedAsDeleted) 
            continue;
        otypegeos.push(geo);
    }        
    metis.objtypegeos = otypegeos;

    // Handle Relationship types
    const reltypes = new Array();
    const rtypes = metis.relshiptypes;
    for (let k=0; k<rtypes?.length; k++) {
        const reltyp = rtypes[k];
        if (reltyp.markedAsDeleted) 
            continue;
        reltypes.push(reltyp);
    }        
    metis.relshiptypes = reltypes;

    // Handle Relationship type views
    const reltypeviews = new Array();
    const rtviews = metis.relshiptypeviews;
    for (let k=0; k<rtviews?.length; k++) {
        const rtview = rtviews[k];
        if (rtview.markedAsDeleted) 
            continue;
        reltypeviews.push(rtview);
    }        
    metis.relshiptypeviews = reltypeviews;

    // Handle metamodels
    metis.metamodels = new Array();
    for (let i=0; i<allMetamodels?.length; i++) {
        const mm = allMetamodels[i];
        if (mm.markedAsDeleted)
            continue;
        metis.metamodels.push(mm);
    }

    // Dispatch the metamodels
    for (let i=0; i<allMetamodels?.length; i++) {
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
    for (let k=0; k<models?.length; k++) {
        const model = models[k];
        const modelviews = model?.modelviews;
        for (let i=0; i<modelviews?.length; i++) {
            const mview = modelviews[i];
            // Handle objectviews
            const oviews = mview.objectviews;
            if (debug) console.log('1953', oviews);
            const objviews = new Array();
            for (let j=0; j<oviews?.length; j++) {
                const oview = oviews[j];
                if (oview.markedAsDeleted) 
                    continue;
                objviews.push(oview);
            }
            if (debug) console.log('1961', objviews);
            
            mview.objectviews = objviews;
            // Handle relshipviews
            const rviews = mview.relshipviews;
            const relviews = new Array();
            for (let j=0; j<rviews?.length; j++) {
                const rview = rviews[j];
                if (rview.markedAsDeleted) 
                    continue;
                relviews.push(rview);
            }
            mview.relshipviews = relviews;
        }

        // Handle object
        const objs = model.objects;
        if (debug) console.log('1978', objs);
        const objects = new Array();
        for (let j=0; j<objs?.length; j++) {
            const obj = objs[j];
            if (obj.markedAsDeleted) 
                continue;
            objects.push(obj);
        }
        if (debug) console.log('1986', objects);
        
        model.objects = objects;

        // Handle relships
        const rels = model.relships;
        const relships = new Array();
        for (let j=0; j<rels?.length; j++) {
            const rel = rels[j];
            if (rel.markedAsDeleted) 
                continue;
                relships.push(rel);
        }
        model.relships = relships;
        if (debug) console.log('2000', model);
    }

    const objectviews = new Array();
    const objviews = metis.objectviews;
    for (let k=0; k<objviews?.length; k++) {
        const oview = objviews[k];
        if (oview.markedAsDeleted) 
            continue;
        objectviews.push(oview);
    }        
    metis.objectviews = objectviews;

    const objects = new Array();
    const objs = metis.objects;
    for (let k=0; k<objs?.length; k++) {
        const obj = objs[k];
        if (obj.markedAsDeleted) 
            continue;
        objects.push(obj);
    }        
    metis.objects = objects;

    const relshipviews = new Array();
    const relviews = metis.relshipviews;
    for (let k=0; k<relviews?.length; k++) {
        const rview = relviews[k];
        if (rview.markedAsDeleted) 
            continue;
        relshipviews.push(rview);
    }        
    metis.relshipviews = relshipviews;

    const relships = new Array();
    const rels = metis.relships;
    for (let k=0; k<rels?.length; k++) {
        const rel = rels[k];
        if (rel.markedAsDeleted) 
            continue;
        relships.push(rel);
    }        
    metis.relships = relships;

    const allModels = metis.models;
    const allModelviews = metis.modelviews;

    repairRelationshipTypeViews(metis);

    // Do the dispatch
    const jsnMetis = new jsn.jsnExportMetis(metis, true);
    let data = {metis: jsnMetis}
    data = JSON.parse(JSON.stringify(data));
    if (debug) console.log('2402 jsnMetis', jsnMetis, metis);
    diagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
}

export function verifyAndRepairModel(model: akm.cxModel, metamodel: akm.cxMetaModel, modelviews: akm.cxModelView[], myDiagram: any, myMetis: akm.cxMetis) {
    if (debug) console.log('2412 verifyAndRepairModel STARTED');
    const format = "%s\n";
    let msg = "Verification report\n";
    let report = printf(format, msg);
    msg = "First do some initial checks\n";
    const metamodels = myMetis.metamodels;
    
    { // First go through the metamodels and remove corrupt ones
      // before doing the actual check of the model
        if (debug) console.log('2423 metamodels', metamodels);
        for (let i=0; i<metamodels?.length; i++) {
            const mm = metamodels[i];
            if (!mm.id) {
                if (debug) console.log('Removing corrupt metamodel', mm);
                metamodels.splice(i, 1);
                msg += "A corrupt metamodel has been removed\n";
                i--;
            }
        }
    }    
    { // Check for duplicate relship types in the metamodels
        for (let i=0; i<metamodels?.length; i++) {
            const mm = metamodels[i];
            const rels = mm.relshiptypes;
            for (let j=0; j<rels?.length; j++) {
                const rel = rels[j];
                for (let k=j+1; k<rels?.length; k++) {
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
        for (let i=0; i<modelviews?.length; i++) {
            const modelview = modelviews[i];
            const oviews = modelview.objectviews;
            for (let i=0; i<oviews?.length; i++) {
                const oview = oviews[i];
                if (oview.viewkind === 'Container') {
                    if (!oview.isGroup) {
                        oview.isGroup = true;
                        msg += "The container view '" + oview.name + "' is now a group (isGroup = true)\n";
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
        for (let i=0; i<objects?.length; i++) {
            const obj = objects[i];
            if (!obj.type) {
                if (debug) console.log('2434 obj, myMetis', obj, myMetis);
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
                    objtype = myMetis.findObjectTypeByName(defObjTypename);
                }        
                obj.type = objtype;
                obj.typeRef = objtype.id;
                obj.typeName = objtype.name;
                objChanged = true;
                msg += "\tObject type changed to: '" + objtype.name + "'\n";
                report += printf(format, msg);
                msg = "";
            }
            if (objtype) {
                const objviews = obj.objectviews;
                for (let i=0; i<objviews?.length; i++) {
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
        for (let i=0; i<modelviews?.length; i++) {
            const modelview = modelviews[i];
            const oviews = modelview.objectviews;
            if (i==0)
                objectviews = oviews;
            else {
                objectviews = objectviews?.concat(oviews);
            }
        }
        const objviews = [];
        if (debug) console.log('2515 objectviews', objectviews);
        for (let i=0; i<objectviews?.length; i++) {
            const oview = objectviews[i];
            if (oview) {
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
        for (let i=0; i<objectviews?.length; i++) {
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
            for (let i=0; i<relships?.length; i++) {
                const rel = relships[i];
                const fromObj  = rel.fromObject as akm.cxObject;
                const toObj    = rel.toObject as akm.cxObject;
                const rtype = rel.type as akm.cxRelationshipType;
                const rels2 = [];
                if (rtype) {
                    const rels = model.findRelationships(fromObj, toObj, rtype);
                    for (let j=0; j<rels?.length; j++) {
                        const r = rels[j];
                        if (r?.type?.id === rtype.id) {
                            if (r.name === rel.name) {
                                rels2.push(r);
                            }
                        }
                    }
                    for (let j=0; j<rels2.length; j++) {
                        if (j == 0) continue;
                        const r = rels2[j];
                        r.markedAsDeleted = true;    
                        const rviews = r.relshipviews;          
                        for (let k=0; k<rviews?.length; k++) {
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
            for (let i=0; i<relships?.length; i++) {
                const rel = relships[i];
                if (debug) console.log('2283 rel', rel);
                const fromObj  = rel.fromObject;
                const toObj    = rel.toObject
                let   fromType = fromObj?.type;
                let   toType   = toObj?.type;
                let typeRef    = rel.typeRef;
                let typeName   = rel.typeName;
                let relname    = rel.typeName;
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
                    if (debug) console.log('2331 Relationship type with name:', typeName, reltypes);
                    if (reltypes) {
                        for (let i=0; i<reltypes?.length; i++) {
                            const rtype = reltypes[i] as akm.cxRelationshipType;
                            let fromObjType = fromType;
                            if (!fromObjType) fromObjType = rtype.fromObjtype;
                            let toObjType = toType;
                            if (!toObjType) toObjType   = rtype.toObjtype;
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
                for (let i=0; i<relviews?.length; i++) {
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
        const mviews = model.modelviews;
        for (let i=0; i<mviews?.length; i++) {
            const mview = mviews[i];
            if (mview /*&& mview.id === modelview.id*/) {
                const rviews = mview.relshipviews;
                if (debug) console.log('2690 modelview', mview);
                for (let j=0; j<rviews?.length; j++) {
                    const rview = rviews[j];
                    const rel = rview.relship;
                    const fromObjview = rview.fromObjview;
                    const toObjview = rview.toObjview;
                    const relviews = mview.findRelationshipViewsByRel2(rel, fromObjview, toObjview);
                    if (debug) console.log('2697 rel, relviews', rel, relviews);
                    if (relviews.length > 1) {
                        // Duplicate relationship views between two object views
                        msg += "\tVerifying relationship '" + rel.name + "' with multiple relationshipviews.\n";
                        let n = 0;
                        const rvs = [];
                        for (let k=0; k<relviews?.length; k++) {
                            const rv = relviews[k];
                            if (!rv.markedAsDeleted) {
                                rvs.push(rv);
                                n++;
                            }
                        }
                        if (debug) console.log('2708 n, rel, rvs', n, rel, rvs);
                        if (n>1) {
                            // Delete all but the first relationship view
                            for (let k=0; k<rvs?.length; k++) {
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
    repairRelationshipTypeViews(myMetis);

    // Dispatch metis
    const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
    let data = {metis: jsnMetis}
    data = JSON.parse(JSON.stringify(data));
    if (debug) console.log('2755 jsnMetis', jsnMetis, myMetis);
    myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
    if (debug) console.log('2757 data', data, myMetis);
    if (debug) console.log('2761 myGoModel', myGoModel);
    msg = "End Verification\n";

    report += printf(format, msg);
    console.log(report);
    myDiagram.requestUpdate();    

    if (debug) console.log('2412 verifyAndRepairModel ENDED');
} 

function repairRelationshipTypeViews(myMetis: akm.cxMetis) {
    // Create an empty list of relationship type views
    // For each metamodel: go through each reltype and get the reltypeview
    // Store the combination of metamodel, reltype and reltypeview in a list
    // Go through all reltypeviews and check if they are in the list
    // If not, mark them as deleted
    const myArray = [];
    for (let i=0; i<myMetis.metamodels?.length; i++) {
        const metamodel = myMetis.metamodels[i];
        const reltypes = metamodel.relshiptypes;
        for (let j=0; j<reltypes?.length; j++) {
            const reltype = reltypes[j];
            const reltypeview = reltype.typeview;
            if (reltypeview) {
                reltypeview.name = reltype.name + "_" + reltype.relshipkind;
                myArray.push({metamodel: metamodel, reltype: reltype, reltypeview: reltypeview});
            }
        }
    }
    if (debug) console.log('3025 myArray', myArray);
    // Go through all reltypeviews and check if they are in the list
    // If not, mark them as deleted
    const reltypeviews = myMetis.relshiptypeviews;
    for (let i=0; i<reltypeviews?.length; i++) {
        const reltypeview = reltypeviews[i];
        let found = false;
        for (let j=0; j<myArray?.length; j++) {
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
        for (let i=len-1; i>=0; i--) {
            const reltypeview = reltypeviews[i];
            if (reltypeview.markedAsDeleted) {
                reltypeviews.splice(i, 1);
            }
        }
    }
    if (debug) console.log('3055 myMetis', myMetis);
}

function updateNode(node: any, objtypeView: akm.cxObjectTypeView, diagram: any, goModel: gjs.goModel) {
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
        diagram.requestUpdate();
    }
}

export function updateLink(data: any, reltypeView: akm.cxRelationshipTypeView, diagram: any, goModel: gjs.goModel) {
    let relview;
    if (reltypeView) {
        let viewdata: any = reltypeView.getData();
        if (debug) console.log('2891 data, viewdata', data, viewdata);
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
                if (prop === 'toArrow') {
                    if (relview[prop] === "")
                        viewdata[prop] = "OpenTriangle";
                    else if (relview[prop] === "None")
                        viewdata[prop] = "";
                } else if (prop === 'fromArrow') {
                    if (viewdata[prop] === 'None')
                        viewdata[prop] = "";
                }
                diagram.model.setDataProperty(data, prop, viewdata[prop]);
                if (debug) console.log('2916 updateLink', prop, viewdata[prop], relview[prop]);
            }
        }
    }
    if (relview) {
        const link = diagram.findLinkForKey(data.key);
        if (link) {
            if (debug) console.log('2854 data, link, relview', data, link, relview);
            relview.arrowscale = relview.textscale * 1.3;
            diagram.model.setDataProperty(link.data, 'name', relview.name);
            diagram.model.setDataProperty(link.data, 'textscale', relview.textscale);
            diagram.model.setDataProperty(link.data, 'arrowscale', relview.arrowscale);
            diagram.model.setDataProperty(link.data, "strokewidth", relview.strokewidth);
        }
    }
} 

function propIsColor(prop: string): boolean {
    switch(prop) {
        case 'strokecolor':
        case 'fromArrowColor':
        case 'toArrowColor':
            return true;
        default:
            return false;
    }
}

export function setLinkProperties(link: any, relview: akm.cxRelationshipView, diagram: any) {
    const reltypeview = relview.typeview;
    const textscale = relview.textscale;
    if (debug) console.log('2563 link, relview, reltypeview', link, relview, reltypeview);
    if (reltypeview) {
        let strokewidth = Number(reltypeview.strokewidth) * Number(textscale);
        strokewidth = strokewidth < 1 ? 1 : strokewidth;
        relview.strokewidth = strokewidth.toString();
        diagram.model.setDataProperty(link.data, "strokewidth", relview.strokewidth);
    }
    const arrowscale = Number(textscale) * 1.3;
    relview.arrowscale = arrowscale.toString();
    diagram.model.setDataProperty(link.data, 'textscale', relview.textscale);
    diagram.model.setDataProperty(link.data, 'arrowscale', relview.arrowscale);
    return relview;
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

function buildLinkFromRelview(model: gjs.goModel, relview: akm.cxRelationshipView, relship: akm.cxRelationship, data: any, diagram: any) {
    let reltype = relship.getType();
    let reltypeView = relview.getTypeView() as akm.cxRelationshipTypeView;
    if (!reltypeView) {
        reltypeView = reltype?.getDefaultTypeView() as akm.cxRelationshipTypeView;
    }
    if (reltypeView) {
        let link = new gjs.goRelshipLink(data.key, model, relview);
        model.addLink(link);
        updateLink(data, reltypeView, diagram, model);
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

export function getNameList(obj: akm.cxObject, context: any, onlyWithProperties: boolean): string[] {
    let namelist =[];
    if (obj) {
        if (context.includeConnected) {
            namelist.push(obj.name);
            const connectedObjects = obj.getConnectedObjects2(context.myMetis);
            if (debug) console.log('3006 connectedObjects', connectedObjects);
            for (let i=0; i<connectedObjects?.length; i++) {
                const connectedObj = connectedObjects[i];
                namelist.push(connectedObj?.name);
            }
        }
        if (context.includeInherited) {
            namelist.push('All');
            try {
                const inheritedTypes = obj?.getInheritedTypes();
                if (debug) console.log('3015 inheritedTypes', inheritedTypes);
                for (let i=0; i<inheritedTypes?.length; i++) {
                    const type = inheritedTypes[i];
                    if (onlyWithProperties) {
                        if (type.properties?.length>0)
                        namelist.push(type.name);
                    } else 
                        namelist.push(type.name);
                } 
                namelist.push(obj.type?.name);
            } catch {
            }
            let uniquelist = [...new Set(namelist)];
            uniquelist.reverse();
            namelist = uniquelist;
        }
    }
    if (debug) console.log('3031 namelist', namelist);
    return namelist;
}

export function repairGoModel(goModel: gjs.goModel, modelview: akm.cxModelView) {
    // Repair links
    const relviews = modelview.relshipviews;
    for (let i=0; i<relviews?.length; i++) {
        const rview = relviews[i];
        if (rview.markedAsDeleted)
            continue;
        const links = goModel.links as gjs.goRelshipLink[];
        let found = false;
        for (let j=0; j<links.length; j++) {
            const link = links[j];
            const rv =link.relshipview;
            if (rv.id === rview.id) {
                found = true;
                break;
            }            
        }
        if (!found) {
            const link = new gjs.goRelshipLink(utils.createGuid(), goModel, rview);
            goModel.addLink(link);
        }
    }
    const objviews = modelview.objviews;
    for (let i=0; i<objviews?.length; i++) {
        const oview = objviews[i];
        if (oview.markedAsDeleted)
            continue;
        const nodes = goModel.nodes as gjs.goObjectNode[];
        let found = false;
        for (let j=0; j<nodes.length; j++) {
            const node = nodes[j];
            if (debug) console.log('3073 node', node);
        }
    }
}

export function isGenericMetamodel(myMetis: akm.cxMetis) {
    const metamodel = myMetis.currentMetamodel;
    if (metamodel.name === 'GENERIC_MM')
        return true;
    return false;
}
