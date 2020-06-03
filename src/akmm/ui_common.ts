// @ts- nocheck

import * as utils from './utilities';
import * as akm from './metamodeller';
import * as gjs from './ui_gojs';
const constants = require('./constants');

//import * as go from 'gojs';

export function updateObject(data: any, name: string, value: string, context: any) {
    if ((data === null) || (name !== "name") || (!data.object)) {
        return;
    } else {
        // const myMetis     = context.metis;
        // const myMetamodel = context.metamodel;
        // const myModel     = context.model;
        // const myModelView = context.modelview;
        // const myDiagram   = context.diagram; 

        let currentObject = data.object as akm.cxObject;
        let currentObjectView = data.objectview as akm.cxObjectView;
        let otype = data.objecttype as akm.cxObjectType;
        if (otype.getName() === constants.AKM_DATATYPE) {
            // Special handling of datatypes
            value = value.toLowerCase();
            let dtype = context.myMetis.findDatatypeByName(value);
            if (!dtype) {
                // Create new datatype
                dtype = new akm.cxDatatype(utils.createGuid(), value, constants.AKM_DATATYPE + ": " + value);
                context.myMetis.addDatatype(dtype);
            }
        }
        currentObject.setName(value);
        currentObject.setModified();
        currentObjectView.setName(value);
        currentObjectView.setModified();
        const diagram = context.myDiagram;
        diagram.model.setDataProperty(data, "name", value);
    }
}
export function createObject(data: any, context: any) {
    if (data === null) {
        return;
    } else {
        data.key = utils.createGuid();
        data.category = constants.C_OBJECT;
        data.class = "goObjectNode";
        const myMetis = context.myMetis;
        const myModel = context.myModel;
        const myModelview = context.myModelview;
        const myGoModel = context.myGoModel;
        const myDiagram = context.myDiagram;
        console.log('53 createObject', data);
        const otypeId = data.objecttype.id;
        const objtype = myMetis.findObjectType(otypeId);
        console.log('48 createObject', objtype);
        let guid = utils.createGuid();
        let obj = new akm.cxObject(guid, data.name, objtype, data.description);
        if (obj) {
            data.object = obj;
            // Include the new object in the current model
            myModel?.addObject(obj);
            myMetis.addObject(obj);
            console.log('59 createObject', obj, myModel);
            // Create the corresponding object view
            let objview = new akm.cxObjectView(utils.createGuid(), obj.getName(), obj, "");
            if (objview) {
                data.objectview = objview;
                objview.setIsGroup(objtype.isContainer());
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
                    objtypeView.setIsGroup(data.viewkind);
                    objview.setTypeView(objtypeView);
                    let node = new gjs.goObjectNode(data.key, objview);
                    myGoModel.addNode(node);
                    updateNode(node, objtypeView, myDiagram);
                    node.loc = data.loc;
                    node.size = data.size;
                    console.log('91 uic', myGoModel);
                }
            }
        }
    }
}
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

// Callback function initiated when a node is pasted
export function onClipboardPasted(selection: any) {
    // Check if there is a group involved
    const groupsToPaste = new Array();
    let i = 0;
    let it = selection.iterator;
    while (it.next()) {
        // Identify groups in the selection
        let selected = it.value;
        if (selected instanceof go.Node) {
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
            if (selected instanceof go.Node) {
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
export function connectNodeToGroup(node: gjs.goObjectNode, groupNode: gjs.goObjectNode, context: any) {
    const myMetis = context.myMetis;
    const myModel = context.myModel;
    if (node && groupNode) {
        node.group = groupNode.key;
        let nodeObj = node.object;
        let groupObj = groupNode.object;
        let nodeObjview = node.objectview;
        let groupObjview = groupNode.objectview;
        nodeObjview.setGroup(groupObjview.getId());
        // Find relationship type
        let groupType = groupObj.getType();
        let childType = nodeObj.getType();
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
            } else {
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

export function disconnectNodeFromGroup(node: gjs.goObjectNode, groupNode: gjs.goObjectNode, context: any) {
    const myModel = context.myModel;
    if (!groupNode) {
        let nodeObj = node.object;
        if (nodeObj) {
            let nodeObjview = node.objectview;
            nodeObjview?.setGroup("");
            let rels = nodeObj.findInputRelships(myModel, constants.RELKINDS.COMP);
            if (rels) { // sf
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


export function onLinkDrawn(e: go.DiagramEvent, context: any) {
    const myGoModel = context.myGoModel;
    const diagram = context.myDiagram;
    const myMetis = context.myMetis;
    const myMetamodel = context.myMetamodel;
    const link = e.self;
    const data = link.data;

    if (data.category === 'Relationship') {
        //link.data.key = utils.createGuid();
        let fromNode = myGoModel.findNode(link.data.from);
        let fromType = fromNode.object?.getType();
        let toNode = myGoModel.findNode(link.data.to);
        let toType = toNode.object?.getType();
        var typename = prompt("Enter type name");
        // let types = myMetis.findRelationshipTypesBetweenTypes(fromType, toType);
        // if (types !== null && types.length>0) {
        //     addElementsToSelectList("selectType", types);
        //     openSelectList("myModal", "selectType", link.data, diagram);
        //     return;
        // } else {
        //     alert("Relationship is not allowed!");
        //     diagram.model.removeLinkData(data); 
        //     return;
        // }

        let reltype = myMetamodel.findRelationshipTypeByName(typename);
        if (!reltype) {
            alert("Relationship type given does not exist!")
            diagram.model.removeLinkData(data);
            return;
        }
        if (!isLinkAllowed(reltype, fromNode.object, toNode.object)) {
            alert("Relationship given is not allowed!")
            diagram.model.removeLinkData(data);
            return;
        }
        diagram.model.setDataProperty(link.data, "name", typename);
        createLink(link.data, context);
    }
}
function isLinkAllowed(reltype: akm.cxRelationshipType, fromObj: akm.cxObject, toObj: akm.cxObject) {
    if (reltype && fromObj && toObj) {
        let fromType = reltype.getFromObjType();
        let toType = reltype.getToObjType();
        if (fromObj.getType()?.inherits(fromType)) {
            if (toObj.getType()?.inherits(toType)) {
                return true;
            }
        }
    }
    return false;
}
export function createLink(data: any, context: any) {
    if (!data.key)
        data.key = utils.createGuid();
    const myMetis = context.myMetis;
    // Identify  type   
    let reltype = null;
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
                let relshipview = new akm.cxRelationshipView(utils.createGuid(), relship.getName(), relship, "");
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
                    console.log(linkData);
                }
            }
        }
    }
}
export function onLinkRelinked(lnk: gjs.goRelshipLink, myGoModel: gjs.goModel) {
    if (lnk.class === 'goRelshipLink') {

        const link = myGoModel.findLink(lnk.key) as gjs.goRelshipLink;
        let relview = link.relshipview;    // cxRelationshipView
        let rel = relview?.relship;    // cxRelationship                
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

// Function to call when a link has been drawn
function buildLinkFromRelview(model: gsj.goModel, relview: akm.cxRelationshipView, relship: akm.cxRelationship, data: any, diagram: any) {
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
