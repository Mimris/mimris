// @ts-nocheck
const debug = false; 
import { clear } from 'console';
import { is } from 'immer/dist/internal';
import { use } from 'react';
import { get } from 'http';
import printf from 'printf';

import * as go from 'gojs';
import * as utils from './utilities';
import * as uic from './ui_common';
import * as uit from './ui_templates';
import * as ui_mtd from './ui_methods';
import * as uib from './ui_buildmodels';
import * as akm from './metamodeller';
import * as jsn from './ui_json';
import * as gjs from './ui_gojs';
import * as constants from './constants';

const $ = go.GraphObject.make;
// Option 1: lanes touch; separators are the lane borders themselves.
const POOL_LANE_GAP = 0;
const LANE_BORDER_HEIGHT = 3; // Height of border between lanes (must match SWIM_SEPARATOR_WIDTH)
const POOL_HEADER_WIDTH = 34;
const LANE_HEADER_WIDTH = 36;
// Additional padding on top of the Placeholder padding in the Pool template.
// Set to 0 so lanes align tightly with the pool header separator.
const POOL_LANE_SIDE_PADDING = 0;
// Must match the Pool template's internal Table margin in `poolTop(...)`.
const POOL_TEMPLATE_MARGIN = 0;
const LANE_LAYOUT_LEFT_INSET = 48;
const LANE_LAYOUT_TOP_INSET = 18;

function asMargin(padding: any): go.Margin {
    if (padding instanceof go.Margin) return padding;
    if (typeof padding === "number") return new go.Margin(padding, padding, padding, padding);
    // Fallback (unknown/undefined) -> no padding.
    return new go.Margin(0, 0, 0, 0);
}

function snapCoord(n: number): number {
    // Reduce stroke anti-aliasing artifacts by keeping borders on whole pixels.
    return Math.round(n);
}

function snapSize(n: number): number {
    // Sizes benefit from ceilling so content never pokes outside the outer stroke.
    return Math.ceil(n);
}

function snapSizeEven(n: number): number {
    // Pool uses locationSpot Center by default; keeping sizes even avoids half-pixel borders.
    return Math.ceil(n / 2) * 2;
}
const GROUP_LAYOUT_PADDING = 15;

function shouldPersistLinkPoints(routing: string | undefined | null, points?: any): boolean {
    if (Array.isArray(points) && points.length >= 4) return true;
    return routing !== 'Orthogonal' && routing !== 'AvoidsNodes';
}

function getLaneBodyBounds(lane: go.Group): go.Rect | null {
    const body =
        lane.findObject("LANE_BODY_SHAPE") ||
        lane.findObject("BODY") ||
        lane.resizeObject;
    const bounds = body?.getDocumentBounds?.();
    return bounds ? bounds.copy() : null;
}

function rectContainsPart(rect: go.Rect, bounds: go.Rect): boolean {
    if (rect.containsRect(bounds)) return true;
    return rect.containsPoint(bounds.center);
}

function clampLocationToRect(part: go.Part, loc: go.Point, rect: go.Rect, margin = 4): go.Point {
    const bounds = part.actualBounds;
    const offsetX = part.location.x - bounds.x;
    const offsetY = part.location.y - bounds.y;
    const minX = rect.x + offsetX + margin;
    const maxX = rect.right - (bounds.width - offsetX) - margin;
    const minY = rect.y + offsetY + margin;
    const maxY = rect.bottom - (bounds.height - offsetY) - margin;
    const clampAxis = (value: number, min: number, max: number) => {
        if (min > max) return (min + max) / 2;
        return Math.max(min, Math.min(value, max));
    };
    return new go.Point(
        clampAxis(loc.x, minX, maxX),
        clampAxis(loc.y, minY, maxY)
    );
}

function realignLaneMembersAfterLaneMove(
    myDiagram: any,
    myModelview: any,
    lane: go.Group,
    oldBodyBounds: go.Rect | null,
    memberSnapshots: Map<string, { loc: go.Point; bounds: go.Rect; wasInBody: boolean }>
) {
    const newBodyBounds = getLaneBodyBounds(lane);
    if (!newBodyBounds) return;
    const dx = oldBodyBounds ? newBodyBounds.x - oldBodyBounds.x : 0;
    const dy = oldBodyBounds ? newBodyBounds.y - oldBodyBounds.y : 0;
    const laneKey = String(lane.data?.key || lane.key || "");

    lane.memberParts.each((part: go.Part) => {
        if (!(part instanceof go.Node) || part instanceof go.Group) return;
        const key = String(part.data?.key || part.key || "");
        const snapshot = memberSnapshots.get(key);
        const groupedToLane = laneKey && String(part.data?.group || "") === laneKey;
        if (!snapshot && !groupedToLane) return;

        let targetLoc = part.location.copy();
        const currentBounds = part.actualBounds;
        if (!rectContainsPart(newBodyBounds, currentBounds)) {
            const shouldTranslateWithLane = !oldBodyBounds || snapshot?.wasInBody || groupedToLane;
            if (shouldTranslateWithLane && snapshot) {
                targetLoc = new go.Point(snapshot.loc.x + dx, snapshot.loc.y + dy);
            }
        }

        const clampedLoc = clampLocationToRect(part, targetLoc, newBodyBounds);
        if (!part.location.equals(clampedLoc)) {
            part.location = clampedLoc;
        }

        if (part.data) {
            const loc = go.Point.stringify(part.location);
            myDiagram.model.setDataProperty(part.data, "loc", loc);
            const objview = myModelview?.findObjectView?.(part.data.key);
            if (objview) objview.loc = loc;
        }
    });
}

export function setFocus(modelview: akm.cxModelView, objview: akm.cxObjectView) {
    if (modelview) {
        modelview.focusObjectview = objview;
    }
}

export function clearFocus(modelview: akm.cxModelView) {
    if (modelview) {
        modelview.focusObjectview = null;
    }
}

export function openCloseAllGroups(myDiagram: any, open: boolean) {
    const nodes = myDiagram.nodes;
    const modifiedObjectViews = [];
    for (let it = nodes.iterator; it?.next();) {
        const node = it.value;
        if (node.data.isGroup) {
            node.isSubGraphExpanded = open;
            const objview = node.data.objectview;
            objview.isExpanded = open;
            const jsnObjview = new jsn.jsnObjectView(objview, true);
            modifiedObjectViews.push(jsnObjview);
        }
    }
    modifiedObjectViews.map(ov => {
        let data = ov;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
    });
}

export function newMetamodel(myMetis: akm.cxMetis, myDiagram: any) {
    const mmname = prompt("Enter Metamodel name");
    if (mmname == null || mmname == "") {
        alert("Operation was cancelled!");
        return;
    } else {
        let metamodel = myMetis.findMetamodelByName(mmname); 
        if (metamodel) {
            alert("Metamodel already exists");
            return;
        } else {
            if (confirm("Create new metamodel '" + mmname + "' ?")) {
                metamodel = new akm.cxMetaModel(utils.createGuid(), mmname, "");
                myMetis.addMetamodel(metamodel);
            } else {
                alert("Operation was cancelled!");
                return;
            }
        }
        if (metamodel) {
            const jsnMetamodel = new jsn.jsnMetaModel(metamodel, true);
            const modifiedMetamodels = new Array();
            modifiedMetamodels.push(jsnMetamodel);
            modifiedMetamodels.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data });
            });
        }
    }
}

export function replaceCurrentMetamodel(myMetis: akm.cxMetis, myDiagram: any) {
    // Select metamodel among all metamodels (except the current)
    const args = {
        "metamodel":          "", 
        "metamodels":         "",
    }
    const context = {
        "myMetis":            myMetis,
        "myCurrentMetamodel": myMetis.currentMetamodel,
        "myCurrentModel":     myMetis.currentModel,
        "myDiagram":          myDiagram,
        "case":               "Replace Metamodel",
        "title":              "Select Metamodel to Use",
        "dispatch":           myDiagram.dispatch,
        "postOperation":      replaceCurrentMetamodel2,
        "args":               args
    }
    askForMetamodel(context);
}

export function addMetamodel(myMetis: akm.cxMetis, myDiagram: any, isSubMetamodel: boolean) {
    // Select metamodel among all metamodels (except the current)
    const args = {
        "metamodel":          "", 
        "metamodels":         "",
    }
    const context = {
        "myMetis":            myMetis,
        "myCurrentMetamodel": myMetis.currentMetamodel,
        "myCurrentModel":     myMetis.currentModel,
        "myDiagram":          myDiagram,
        "isSubMetamodel":     isSubMetamodel,
        "case":               "Add Metamodel",
        "title":              "Select Metamodel to Add",
        "dispatch":           myDiagram.dispatch,
        "postOperation":      addMetamodel2,
        "args":               args
    }
    if (debug) console.log('88 context', context);
    askForMetamodel(context);
}

export function deleteMetamodel(myMetis: akm.cxMetis, myDiagram: any) {
    // Select metamodel among all metamodels (except the current)
    const args = {
        "metamodel":          "", 
    }
    const context = {
        "myMetis":            myMetis,
        "myCurrentMetamodel": myMetis.currentMetamodel,
        "myDiagram":          myDiagram,
        "case":               "Delete Metamodel",
        "title":              "Select Metamodel to Delete",
        "dispatch":           myDiagram.dispatch,
        "postOperation":      deleteMetamodel2,
        "args":               args
    }
    askForMetamodel(context);
}

export function clearMetamodel(myMetis: akm.cxMetis, myDiagram: any) {
    // Select metamodel among all metamodels (except the current)
    const args = {
        "metamodel":          "", 
    }
    const context = {
        "myMetis":            myMetis,
        "myCurrentMetamodel": myMetis.currentMetamodel,
        "myDiagram":          myDiagram,
        "case":               "Clear Metamodel",
        "title":              "Select Metamodel to Clear",
        "dispatch":           myDiagram.dispatch,
        "postOperation":      clearMetamodel2,
        "args":               args
    }
    askForMetamodel(context);
}

export function newModel(myMetis: akm.cxMetis, myDiagram: any) {
    const args = {
        "metamodel":    myMetis.currentTargetMetamodel, 
    }
    const context = {
        "myMetis":            myMetis,
        "myCurrentMetamodel": myMetis.currentMetamodel,
        "myModel":            myMetis.currentModel,
        "myCurrentModelview": myMetis.currentModelview,
        "myDiagram":          myDiagram,
        "case":               "New Model",
        "title":              "Select Metamodel",
        "dispatch":           myDiagram.dispatch,
        "postOperation":      createModel,
        "args":               args
    }
    askForMetamodel(context);

}

export function deleteModel(myMetis: akm.cxMetis, myDiagram: any) {
    // Select model among all models (except the current)
    const args = {
        "model":              "", 
    }
    const context = {
        "myMetis":            myMetis,
        "myCurrentModel":     myMetis.currentModel,
        "myDiagram":          myDiagram,
        "case":               "Delete Model",
        "title":              "Select Model to Delete",
        "dispatch":           myDiagram.dispatch,
        "postOperation":      deleteModel1,
        "args":               args
    }
    askForModel(context);
}

export function clearModel(myMetis: akm.cxMetis, myDiagram: any) {
    // Select model among all models (except the current)
    const args = {
        "model":              "", 
    }
    const context = {
        "myMetis":            myMetis,
        "myCurrentModel":     myMetis.currentModel,
        "myDiagram":          myDiagram,
        "case":               "Clear Model",
        "title":              "Select Model to Clear",
        "dispatch":           myDiagram.dispatch,
        "postOperation":      clearModel1,
        "args":               args
    }
    askForModel(context);
}

export function generateSubModel(node: any, myMetis: akm.cxMetis, myDiagram: any) {
    const objview = myMetis.findObjectView(node.objectview?.id);
    // Ask for model name
    const modelname = prompt("Enter Model name");
    // Check if it already exists
    const model = myMetis.findModelByName(modelname);
    if (model) {
        alert("Model already exists");
        return;
    }
    // Find what metampdel is used
    const metamodel = objview.model?.metamodel;
    // Create a new model
    const newModel = new akm.cxModel(utils.createGuid(), modelname, myMetis.currentTargetMetamodel, "");
}

export function exportTaskModel(node: any, myMetis: akm.cxMetis, myDiagram: any) {
    const objview = myMetis.findObjectView(node.objectview?.id);
    // Select model among all models (except the current)
    const args = {
        "objectview":         objview,
        "model":              "", 
    }
    const context = {
        "myMetis":            myMetis,
        "myCurrentModel":     myMetis.currentModel,
        "myDiagram":          myDiagram,
        "case":               "Export Task Model",
        "title":              "Select Model to Export to",
        "dispatch":           myDiagram.dispatch,
        "postOperation":      exportTaskModelCallback,
        "args":               args
    }
    askForModel(context);
}

function exportTaskObject(object: akm.cxObject, context: any) {
    const myMetis = context.myMetis;
    let toModel   = context.args.model;
    toModel = myMetis.findModel(toModel.id);
    const obj = toModel.findObjectByTypeAndName(object.type, object.name);
    if (!obj) {
        const copiedObj = uic.copyObject(object)
        toModel.addObject(copiedObj);
        myMetis.addObject(copiedObj);
        if (debug) console.log('189 copiedObj', copiedObj);
    }
    const outrels = object.outputrels;
    for (let j=0; j<outrels?.length; j++) {
        const rel = outrels[j];
        const fromObj = toModel.getCopiedFromObject(rel.fromObject.id);
        const toObj = toModel.getCopiedFromObject(rel.toObject.id);
        if (debug) console.log('196 rel, fromObj, toObj', rel, fromObj, toObj);
        if (fromObj && toObj) {
            const rels = toModel.findRelationships(fromObj, toObj,rel.type);
            if (!rels) {
                const copiedRel = uic.copyRelationship(rel, fromObj, toObj);
                fromObj.addOutputrel(copiedRel);
                toObj.addInputrel(copiedRel);
                toModel.addRelationship(copiedRel);
                myMetis.addRelationship(copiedRel);
            }
        }
    }
}

function exportTaskContainer(contView: akm.cxObjectView, context: any) {
    const myMetis = context.myMetis;
    let fromModel = context.myCurrentModel;
    fromModel = myMetis.findModel(fromModel.id);
    let toModel   = context.args.model;
    toModel = myMetis.findModel(toModel.id);
    const modelView = contView.getParentModelView(fromModel);
    const members = contView.getGroupMembers(modelView);
    for (let i=0; i<members.length; i++) {
        const oview = members[i];
        const obj = oview.object;
        const typename = obj.type.name;
        if (typename === 'Container') {
            exportTaskContainer(oview, context);
        }
        else if (typename === 'Task' || typename === 'Role') {
            exportTaskObject(obj, context);
        }
    }
}

function exportTaskModelCallback(context: any) {
    const myMetis = context.myMetis;
    const myDiagram = context.myDiagram;
    if (debug) console.log('183 context', context);
    let fromModel = context.myCurrentModel;
    fromModel = myMetis.findModel(fromModel.id);
    let toModel   = context.args.model;
    toModel = myMetis.findModel(toModel.id);
    myMetis.setCurrentTaskModel(toModel);
    const containerView = context.args.objectview;
    const modelView = containerView.getParentModelView(fromModel);
    const members = containerView.getGroupMembers(modelView);
    const fromRelships = [];
    for (let i=0; i<members.length; i++) {
        const oview = members[i];
        const obj = oview.object;
        const typename = obj.type.name;
        if (typename === 'Container') {
            exportTaskContainer(oview, context);
        }
        else if (typename === 'Task' || typename === 'Role') {
            exportTaskObject(obj, context);
        }
    }
    if (debug) console.log('205 toModel', toModel);
    for (let i=0; i<members.length; i++) {
        const oview = members[i];
        const obj = oview.object;
        const typename = obj.type.name;
        if (typename === 'Task' || typename === 'Role') {
            const outrels = obj.outputrels;
            for (let j=0; j<outrels?.length; j++) {
                const rel = outrels[j];
                const fromObj = toModel.getCopiedFromObject(rel.fromObject.id);
                const toObj = toModel.getCopiedFromObject(rel.toObject.id);
                if (debug) console.log('215 rel, fromObj, toObj', rel, fromObj, toObj);
                if (fromObj && toObj) {
                    const copiedRel = uic.copyRelationship(rel, fromObj, toObj);
                    fromObj.addOutputrel(copiedRel);
                    toObj.addInputrel(copiedRel);
                    toModel.addRelationship(copiedRel);
                    myMetis.addRelationship(copiedRel);
                }
            }
        }
    }
    if (debug) console.log('220 toModel', toModel);
    // let mdata = new jsn.jsnModel(toModel, true);
    // mdata = JSON.parse(JSON.stringify(mdata));
    // mdata.targetModelRef = toModel.id;
    // mdata.taskModelRef = fromModel.id;
    // if (debug) console.log('224 Diagram', mdata);        
    // myDiagram.dispatch({ type: 'UPDATE_TARGETMODEL_PROPERTIES', data: mdata })

    const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
    if (debug) console.log('1402 jsnMetis: ', jsnMetis);
    let data = {metis: jsnMetis}
    data = JSON.parse(JSON.stringify(data));
    myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })


    alert("The task model has been successfully exported!");
}

export function newModelview(myMetis: akm.cxMetis, myDiagram: any) {
    const metamodel = myMetis.currentMetamodel;
    const model = myMetis.currentModel;
    const modelviewName = prompt("Enter Modelview name:", "");
    if (modelviewName == null || modelviewName === "") {
      alert("New operation was cancelled");
    } else  if (modelviewName === '_INSTANCES') {
        uib.buildInstancesModelview(myMetis, myDiagram.dispatch, model);
    } else {
      const modelView = new akm.cxModelView(utils.createGuid(), modelviewName, model, "");
      modelView.diagram = myDiagram;
      model.addModelView(modelView);
      myMetis.addModelView(modelView);
      if (debug) console.log('102 myMetis', myMetis);
      let data = new jsn.jsnModel(model, true);
      data = JSON.parse(JSON.stringify(data));
      if (debug) console.log('104 NewModelView', data);
      myDiagram.dispatch({ type: 'LOAD_TOSTORE_NEWMODELVIEW', data });
    }
}

export function deleteModelview(modelView: akm.cxModelView, myMetis: akm.cxMetis, myDiagram: any) {
    modelView.markedAsDeleted = true;
    const jsnModelview = new jsn.jsnModelView(modelView);
    // Delete the content
    const objviews = modelView.objectviews;
    for (let i=0; i<objviews?.length; i++) {
        const objview = objviews[i];
        objview.markedAsDeleted = true;
        let obj = objview.object; // The object
        if (!obj) obj = myMetis.findObject(objview.objectRef);
        const oviews = obj?.objectviews;
        if (oviews?.length == 1) {
            obj.markedAsDeleted = true;
        }
    }
    const relviews = modelView.relshipviews;
    for (let i=0; i<relviews?.length; i++) {
        const relview = relviews[i];
        relview.markedAsDeleted = true;
    }
    if (debug) console.log('1808 myMetis', myMetis);
    const modifiedModelviews = new Array();
    modifiedModelviews.push(jsnModelview);
    modifiedModelviews.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data });
    });
    uic.purgeModelDeletions(myMetis, myDiagram);
}

export function deleteInvisibleObjects(myMetis: akm.cxMetis, myDiagram: any) {
    if (confirm('Do you really want to delete all invisible objects?')) {
        const modifiedObjects = new Array();
        const objects = myMetis.objects;
        for (let i=0; i<objects.length; i++) {
          const obj = objects[i];
          const objtype = obj?.type;
          if (obj.name === objtype?.name) {
            if (obj.objectviews == null) {
              obj.markedAsDeleted = true;
              const obj1 = myMetis.findObject(obj.id);
              if (obj1) obj1.markedAsDeleted = true;
              const jsnObj = new jsn.jsnObject(obj);
              modifiedObjects.push(jsnObj);
            }
          }
        } 
        if (debug) console.log('156 modifiedObjects', modifiedObjects);
        modifiedObjects.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          myDiagram.dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data });
        })              

        const modifiedObjviews = new Array();
        const objviews = myMetis.objectviews;
        for (let i=0; i<objviews.length; i++) {
          const objview = objviews[i];
          const obj = objview?.object;
          if (obj == null) {
              objview.markedAsDeleted = true;
              const objview1 = myMetis.findObjectView(objview.id);
              if (objview1) objview1.markedAsDeleted = true;
              const jsnObjview = new jsn.jsnObjectView(objview);
              modifiedObjviews.push(jsnObjview);
          }
        } 
        if (debug) console.log('175 modifiedObjviews', objviews, modifiedObjviews);
        modifiedObjviews.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
        })              
        if (debug) console.log('180 myMetis', myMetis);
    }

}

export function editObject(gjsNode: any, myMetis: akm.cxMetis, myDiagram: any) {
    if (debug) console.log('417 myMetis', myMetis);
    const objviewRef = gjsNode.key;
    let objectview: akm.cxObjectView = myMetis.findObjectView(objviewRef);
    if (!objectview) {
        objectview = gjsNode?.objectview || myMetis.findObjectView(gjsNode?.objviewRef);
    }
    let object: akm.cxObject = null;
    if (objectview?.objectRef) {
        object = myMetis.findObject(objectview.objectRef);
    }
    if (!object) {
        object = gjsNode?.object || myMetis.findObject(gjsNode?.objRef);
    }
    const objtypeRef =
        gjsNode?.objtypeRef ||
        object?.type?.id ||
        object?.typeRef ||
        objectview?.object?.type?.id ||
        objectview?.object?.typeRef;
    let objecttype: akm.cxObjectType = myMetis.findObjectType(objtypeRef);
    if (!objecttype) {
        objecttype =
            gjsNode?.objecttype ||
            object?.type ||
            objectview?.object?.type ||
            myMetis.findObjectTypeByName(object?.typeName) ||
            myMetis.findObjectTypeByName(objectview?.object?.typeName);
    }
    const objecttypeview = objecttype?.typeview || objectview?.typeview || object?.type?.typeview;
    let supertypes = objecttype?.supertypes;
    const icon = uit.findImage(gjsNode.icon);

    myMetis.myDiagram = myDiagram;
    if (objectview && object) {
        myMetis.addObject(object);
        myMetis.addObjectView(objectview);
        const myContext = {
            object:     object,
            objectview: objectview,
            objecttype: objecttype,
            objecttypeview: objecttypeview,
            supertypes: supertypes,
            allowPorts:  objecttype?.allowPorts ?? false,
            includeInherited: false,
            includeConnected: false,
            relship:     null,
            relshipview: null,
            relshiptype: null,
            relshiptypeview: null,
            model:      myMetis.currentModel,
            modelview:  myMetis.currentModelview,
            metamodel:  myMetis.currentMetamodel,
        }
        if (debug) console.log('490 myMetis', myMetis);
        const modalContext = {
            what:       "editObject",
            title:      "Edit Object",
            icon:       icon,
            myDiagram:  myDiagram,
            myContext:  myContext
        }
        if (debug) console.log('498 ui_diagram: gjsNode, modalContext', gjsNode, modalContext);
        myDiagram.handleOpenModal(gjsNode, modalContext);        
    } else {
        alert("Object not found");
    }
}

export function editRelationship(link: any, myMetis: akm.cxMetis, myDiagram: any) {
    if (debug) console.log('417 myMetis', myMetis);
    myMetis.currentLink = link;
    myMetis.myDiagram = myDiagram;
    const relship = myMetis.findRelationship(link?.relship?.id);
    const relshipview = myMetis.findRelationshipView(link?.relshipview?.id);
    const relshiptype = myMetis.findRelationshipType(relship?.type?.id);
    const relshiptypeview = relshiptype?.typeview;
    const myContext = {
        object:     null,
        objectview: null,
        objecttype: null,
        objecttypeview: null,
        relship:     relship,
        relshipview: relshipview,
        relshiptype: relshiptype,
        relshiptypeview: relshiptypeview,
        model:      myMetis.currentModel,
        modelview:  myMetis.currentModelview,
        metamodel:  myMetis.currentMetamodel,
    }
    const modalContext = {
        what:       "editRelationship",
        title:      "Edit Relationship",
        icon:       null,
        myDiagram:  myDiagram,
        myContext:  myContext
      }
      if (debug) console.log('530 ui_diagram: link, modalContext', link, modalContext);
      myDiagram.handleOpenModal(link, modalContext);
}

export function editPort(port: any, myMetis: akm.cxMetis, myDiagram: any) {
    if (debug) console.log('417 myMetis', myMetis);
    const icon = "";
    const modalContext = {
      what:       "editPort",
      title:      "Edit Port",
      icon:       icon,
      myMetis:    myMetis,
      myDiagram:  myDiagram
    }
    myMetis.currentNode = port;
    myMetis.myDiagram = myDiagram;
    if (debug) console.log('427 port, modalContext', port, modalContext);
    if (debug) console.log('428 myMetis', myMetis);
    myDiagram.handleOpenModal(port, modalContext);
}

// export function editPort(node: any, side: string, portname: string, myMetis: akm.cxMetis, myDiagram: any) {
//     const modalContext = {
//         what:       "editPort",
//         title:      "Edit Port",
//         icon:       null,
//         side:       side,
//         portname:   portname,
//         myDiagram:  myDiagram
//       }
//       myMetis.currentNode = node;
//       myMetis.myDiagram = myDiagram;
//       if (debug) console.log('230 editObjectType');
//       myDiagram.handleOpenModal(node, modalContext);
//   }

export function editObjectType(node: any, myMetis: akm.cxMetis, myDiagram: any) {
    const icon = uit.findImage(node?.icon);
    const objecttype = myMetis.findObjectType(node?.objecttype?.id || node?.objtypeRef) || node?.objecttype;
    const objecttypeview = objecttype?.typeview;
    const myContext = {
        objecttype:      objecttype,
        objecttypeview:  objecttypeview,
        relship:         null,
        relshipview:     null,
        relshiptype:     null,
        relshiptypeview: null,
        model:           myMetis.currentModel,
        modelview:       myMetis.currentModelview,
        metamodel:       myMetis.currentMetamodel,
    };
    const modalContext = {
      what:       "editObjectType",
      title:      "Edit Object Type",
      icon:       icon,
      myMetis:    myMetis,
      myDiagram:  myDiagram,
      myContext:  myContext,
    }
    myMetis.currentNode = node;
    myMetis.myDiagram = myDiagram;
    if (debug) console.log('230 editObjectType');
    myDiagram.handleOpenModal(node, modalContext);
}

export function editRelationshipType(link: any, myMetis: akm.cxMetis, myDiagram: any) {
    const relshiptype =
        myMetis.findRelationshipType(link?.relshiptype?.id || link?.reltype?.id || link?.reltypeRef) ||
        link?.relshiptype ||
        link?.reltype ||
        null;
    const relshiptypeview =
        myMetis.findRelationshipTypeView(link?.typeview?.id || relshiptype?.typeview?.id || link?.typeviewRef) ||
        relshiptype?.typeview ||
        link?.typeview ||
        null;
    const myContext = {
        object:          null,
        objectview:      null,
        objecttype:      null,
        objecttypeview:  null,
        relship:         null,
        relshipview:     null,
        relshiptype:     relshiptype,
        relshiptypeview: relshiptypeview,
        model:           myMetis.currentModel,
        modelview:       myMetis.currentModelview,
        metamodel:       myMetis.currentMetamodel,
    };
    const modalContext = {
      what:       "editRelationshipType",
      title:      "Edit Relationship Type",
      icon:       null,
      myDiagram:  myDiagram,
      myContext:  myContext,
    }
    myMetis.currentLink = link;
    myMetis.myDiagram = myDiagram;
    myDiagram.handleOpenModal(link, modalContext);
}

export function askForTemplate(context: any) {
    const myDiagram = context.myDiagram;
    const modalContext = {
        what:       "askForTemplate",
        title:      context.title,
        icon:       null,
        case:       context.case,
        myContext:  context,
        myDiagram:  myDiagram
    }
    if (debug) console.log('606 ui_diagram: modalContext', modalContext);
    myDiagram.handleOpenModal(null, modalContext);
}

export function editObjectview(gjsNode: any, myMetis: akm.cxMetis, myDiagram: any) {
    if (debug) console.log('597 gjsNode, myMetis', gjsNode, myMetis);
    const myModelview = myMetis.currentModelview;
    const myMetamodel = myMetis.currentMetamodel;
    const myModel = myModelview.model;
    const myGoModel = myMetis.gojsModel; 
    let key = gjsNode.key;
    let objectview = myModelview.findObjectView(key);
    if (!objectview) {
        objectview = gjsNode?.objectview || myMetis.findObjectView(gjsNode?.objviewRef);
    }
    if (objectview) objectview.viewkind = gjsNode.viewkind || objectview.viewkind;
    let object = objectview?.object;
    if (!object) object = gjsNode?.object || myModel.findObject(gjsNode?.objRef);
    let objecttype = object?.type;
    objecttype =
        myMetis.findObjectType(objecttype?.id || object?.typeRef || objectview?.object?.typeRef) ||
        gjsNode?.objecttype ||
        objecttype ||
        myMetis.findObjectTypeByName(object?.typeName) ||
        myMetis.findObjectTypeByName(objectview?.object?.typeName);
    let goNode = myGoModel.findNode(key);
    if (!goNode) {
        goNode = gjsNode;
    }
    myMetis.currentNode = goNode;
    myMetis.myDiagram = myDiagram;
    const icon = uit.findImage(goNode?.icon);
    const iconpath = uit.findImage(goNode?.iconpath);
    const icon1 = uit.findImage(goNode?.icon1);
    const icon2 = uit.findImage(goNode?.icon2);
    const icon3 = uit.findImage(goNode?.icon3);
    if (!object)
        object = myModel.findObject(goNode?.objRef);
    if (!objectview)
        objectview = myModelview.findObjectView(goNode?.objviewRef);
    if (!objecttype)
        objecttype =
            myMetamodel.findObjectType(goNode?.objtypeRef || goNode?.object?.typeRef) ||
            goNode?.objecttype ||
            object?.type ||
            myMetis.findObjectTypeByName(goNode?.object?.typeName) ||
            myMetis.findObjectTypeByName(object?.typeName);
    const objecttypeview = objecttype?.typeview;
    // if (objectview)
    // updateNodeAndView(gjsNode, goNode, objectview, myDiagram);
    const myContext = {
        object:     object,
        objectview: objectview,
        objecttype: objecttype,
        objecttypeview: objecttypeview,
        relship:    null,
        relshipview: null,
        relshiptype: null,
        relshiptypeview: null,
        model:      myMetis.currentModel,
        modelview:  myMetis.currentModelview,
        metamodel:  myMetis.currentMetamodel,
    }
    const modalContext = {
      what:       "editObjectview",
      title:      "Edit Object View",
      icon:       icon,
      myDiagram:  myDiagram,
      myContext:  myContext,
    }
    if (debug) console.log('566 ui_diagram: gjsNode, modalContext', gjsNode, modalContext);
    myDiagram.handleOpenModal(objectview || gjsNode, modalContext);
}    

export function editRelationshipView(link: any, myMetis: akm.cxMetis, myDiagram: any) {
    if (debug) console.log('615 link, myMetis', link, myMetis);
    myMetis.currentLink = link;
    myMetis.myDiagram = myDiagram;
    const rel = link.relship;
    const relview = link.relshipview;
    const relship = myMetis.findRelationship(rel?.id) as akm.cxRelationship;
    const relshipview = myMetis.findRelationshipView(relview?.id);
    const relshiptype = myMetis.findRelationshipType(relship?.type?.id);
    const relshiptypeview = relshiptype?.typeview;
    const myContext = {
        object:     null,
        objectview: null,
        objecttype: null,
        objecttypeview: null,
        relship:     relship,
        relshipview: relshipview,
        relshiptype: relshiptype,
        relshiptypeview: relshiptypeview,
        model:      myMetis.currentModel,
        modelview:  myMetis.currentModelview,
        metamodel:  myMetis.currentMetamodel,
        goModel:    myMetis.gojsModel
    }
    const modalContext = {
        what:       "editRelshipview",
        title:      "Edit Relationship View",
        icon:       null,
        myDiagram:  myDiagram,
        myContext:  myContext
    }
    if (debug) console.log('642 ui_diagram: link, modalContext', link, modalContext);
    myDiagram.handleOpenModal(link, modalContext);
}

export function editObjectTypeview(gjsNode: any, myMetis: akm.cxMetis, myDiagram: any, readOnly: boolean) {
    if (debug) console.log('680 gjsNode, myMetis', gjsNode, myMetis);
    const myModelview = myMetis.currentModelview;
    const myGoModel = myMetis.gojsModel; 
    let key = gjsNode.key;
    let objectview = myModelview?.findObjectView(key);
    let object = objectview?.object;
    let objecttype = null;
    let objecttypeview = null;
    const isMetamodelObjectTypeNode =
        myMetis?.modelType === 'Metamodelling' &&
        (!!gjsNode?.objecttype || !!gjsNode?.objtypeRef);

    if (gjsNode?.category === constants.gojs.C_OBJECTTYPE || isMetamodelObjectTypeNode) {
        objecttype = myMetis.findObjectType(gjsNode?.objecttype?.id || gjsNode?.objtypeRef) || gjsNode?.objecttype;
        objecttypeview =
            myMetis.findObjectTypeView(objecttype?.typeview?.id || gjsNode?.typeview?.id || gjsNode?.typeviewRef) ||
            objecttype?.typeview ||
            gjsNode?.typeview ||
            gjsNode?.objecttypeview ||
            null;
    } else {
        if (objectview) objectview.viewkind = gjsNode.viewkind;
        if (!object) object = myMetis.findObject(gjsNode?.objRef);
        objecttype = myMetis.findObjectType(object?.type?.id);
        objecttypeview =
            myMetis.findObjectTypeView(objecttype?.typeview?.id || objectview?.typeviewRef) ||
            objecttype?.typeview ||
            null;
    }

    if (objecttypeview) objecttypeview.viewkind = gjsNode.viewkind;
    let goNode = myGoModel.findNode(key) || gjsNode;
    myMetis.currentNode = goNode;
    myMetis.myDiagram = myDiagram;
    const icon = uit.findImage(goNode?.icon || gjsNode?.icon);
    const myContext = {
        object:     object,
        objectview: objectview,
        objecttype: objecttype,
        objecttypeview: objecttypeview,
        relship:    null,
        relshipview: null,
        relshiptype: null,
        relshiptypeview: null,
        model:      myMetis.currentModel,
        modelview:  myMetis.currentModelview,
        metamodel:  myMetis.currentMetamodel,
    }
    const modalContext = {
      what:       "editTypeview",
      title:      "Edit Object Typeview",
      icon:       icon,
      myDiagram:  myDiagram,
      myContext:  myContext,
      readOnly:   readOnly,
    }
    if (debug) console.log('566 ui_diagram: gjsNode, modalContext', gjsNode, modalContext);
    myDiagram.handleOpenModal(gjsNode, modalContext);
}    

export function editRelshipTypeview(link: any, myMetis: akm.cxMetis, myDiagram: any, readOnly: boolean) {
    if (debug) console.log('682 link, myMetis', link, myMetis);
    myMetis.myDiagram = myDiagram;
    myMetis.currentLink = link;
    
    // Handle both relationship instances and relationship types
    let relshiptype = null;
    let relshiptypeview = null;
    let relship = null;
    let relshipview = null;
    
    // Check if this is a relationship type in Metamodelling mode
    if (link?.relshiptype || link?.reltypeRef) {
        relshiptype = myMetis.findRelationshipType(link.relshiptype?.id || link.reltypeRef);
        relshiptypeview = relshiptype?.typeview;
    } else {
        // It's a relationship instance in Modelling mode
        relship = myMetis.findRelationship(link?.relship?.id);
        relshipview = myMetis.findRelationshipView(link?.relshipview?.id);
        relshiptype = myMetis.findRelationshipType(relship?.type?.id);
        relshiptypeview = relshiptype?.typeview;
    }
    
    const myContext = {
        object:     null,
        objectview: null,
        objecttype: null,
        objecttypeview: null,
        relship:     relship,
        relshipview: relshipview,
        relshiptype: relshiptype,
        relshiptypeview: relshiptypeview,
        model:      myMetis.currentModel,
        modelview:  myMetis.currentModelview,
        metamodel:  myMetis.currentMetamodel,
    }
    const modalContext = {
      what:       "editTypeview",
      title:      "Edit Relationship Typeview",
      icon:       null,
      myDiagram:  myDiagram,
      myContext:  myContext,
      readOnly:   readOnly,
    }
    if (debug) console.log('710 ui_diagram: link, modalContext', link, modalContext);
    myDiagram.handleOpenModal(link, modalContext);

}    

export function editModelview(node: any, myMetis: akm.cxMetis, myDiagram: any) {
    const icon = "";
    const modalContext = {
      what:       "editModelview",
      title:      "Edit Modelview",
      icon:       icon,
      myMetis:    myMetis,
      myDiagram:  myDiagram
    }
    myMetis.currentNode = node;
    myMetis.myDiagram = myDiagram;
    myDiagram.handleOpenModal(node, modalContext);
}    

export function resetToTypeview(goInst: any, myMetis: akm.cxMetis, myDiagram: any) {
    const n = myDiagram.findNodeForKey(goInst?.key);
    if (n) {
        const oview = myMetis.findObjectView(goInst.key);
        oview.applyTypeview();
        const otview = oview.typeview;
        const otdata = otview?.data;
        if (!otdata) return;
        for (let prop in otdata) {
            oview[prop] = otdata[prop];
            myDiagram.model.setDataProperty(n.data, prop, oview[prop]);
        }
        // Dispatch
        const jsnObjview = new jsn.jsnObjectView(oview);
        const modifiedObjectViews = new Array();
        modifiedObjectViews.push(jsnObjview);
        modifiedObjectViews.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
        })
    }
    const ll = myDiagram.findLinkForKey(goInst?.key);
    if (ll) {
        if (debug) console.log('463 goInst', goInst);
        const rview = myMetis.findRelationshipView(goInst.key);
        if (rview) {
            const rtview = rview.typeview;
            if (rtview && rtview.data) {
                const rtdata = rtview.data;
                if (debug) console.log('467 rview, rtview, rtdata', rview, rtview, rtdata);
                for (let prop in rtdata) {
                    switch(prop) {
                        case 'name':
                        case 'nameId':
                        case 'description':
                        case 'category':
                        case 'fs_collection':
                        case 'markedAsDeleted':
                        case 'modified':
                        case 'sourceUri':
                        case 'typeRef':
                        case 'class':
                        case 'relshipkind':      
                            continue;              
                    }
                    rview[prop] = rtview[prop];
                    if (debug) console.log('471 prop, rview[prop]', prop, rview[prop]);
                    myDiagram.model.setDataProperty(ll.data, prop, rtview[prop]);
                }
                // Dispatch
                const jsnRelview = new jsn.jsnRelshipView(rview);
                const modifiedRelViews = new Array();
                modifiedRelViews.push(jsnRelview);
                modifiedRelViews.map(mn => {
                    let data = mn;
                    data = JSON.parse(JSON.stringify(data));
                    if (debug) console.log('494 data', data);
                    myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
                });
            }
        }
    }
}

export function setGridLayoutParameters( param: string): go.GridLayout {
    const layout = new go.GridLayout({ 
        isOngoing: false,
        wrappingColumn: 1,
        wrappingWidth: NaN,
        spacing: new go.Size(35, 35),
    });
    return layout;
}

export function doGridLayout(mySelection: any, myModelview: akm.cxModelView, myDiagram: any) {
    const myObjectViews = [];
    const myRelshipViews = [];
    const lay = setGridLayoutParameters(); 
    lay.doLayout(mySelection);
    // First handle the objects
    let it = mySelection.iterator;
    while (it?.next()) {
        let selected = it.value.data;
        if (selected.category === 'Object') {
            let node = selected;
            const loc = node.loc;
            const objviewRef = node.key;
            const objview = myModelview.findObjectView(objviewRef);
            objview.loc = loc;
            const jsnObjview = new jsn.jsnObjectView(objview);
            myObjectViews.push(jsnObjview);
        }
    }

    myObjectViews.map(mn => {
        let data = (mn) && mn
        if (mn.id) {
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
        }
    })   
    myRelshipViews.map(mn => {
        let data = (mn) && mn
        if (mn.id) {
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
        }
    })                 
}

function setTreeLayoutParameters(): go.TreeLayout {
    const layout = new go.TreeLayout({ 
        isOngoing: false,
        treeStyle: go.TreeLayout.StyleRootOnly, 
        angle: 0,
        layerSpacing: 100,
        nodeSpacing: 50,
        setsPortSpot: false,
        setsChildPortSpot: false,
        alternateSetsChildPortSpot: false,
        alternateSetsPortSpot: false,
        sorting: go.TreeLayout.SortingDescending,
        alternateSorting: go.TreeLayout.SortingDescending,
        arrangement: go.TreeLayout.ArrangementFixedRoots,        
        alignment: go.TreeLayout.AlignmentStart, // AlignmentStart, CenterChildren;
    });
    return layout;
}

export function doTreeLayout(mySelection: any, myModelview: akm.cxModelView, myDiagram: any, clearBreakpoints: boolean = false) { 
    const myObjectViews = [];
    const myRelshipViews = [];
    const lay = setTreeLayoutParameters(); 
    lay.doLayout(mySelection);
    // First handle the objects
    let it = mySelection.iterator;
    while (it?.next()) {
        let selected = it.value.data;
        if (selected.category === 'Object') {
            let node = selected;
            const loc = node.loc;
            const objviewRef = node.key;
            const objview = myModelview.findObjectView(objviewRef);
            objview.loc = loc;
            const jsnObjview = new jsn.jsnObjectView(objview);
            myObjectViews.push(jsnObjview);
        }
    }
    // Then handle the relationships
    it = mySelection.iterator;
    while (it?.next()) {
        let selected = it.value.data;
        if (selected.category === 'Relationship') {
            let link = selected;
            let points = clearBreakpoints ? [] : link.points;
            myDiagram.model.setDataProperty(link, "points", points);
            const relshipview = myModelview.findRelationshipView(link.key);
            relshipview.points = link.points;
            const reltype = relshipview.relship.type;
            if (reltype?.name === constants.types.AKM_RELATIONSHIP_TYPE) {
                const lnk = getLinkByViewId(relshipview.id, myDiagram)
                // lnk.isLayoutPositioned = false;
            }
            const jsnRelshipview = new jsn.jsnRelshipView(relshipview);
            myRelshipViews.push(jsnRelshipview);
        }
    }
    myObjectViews.map(mn => {
    let data = (mn) && mn
    if (mn.id) {
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
    }
    })   
    myRelshipViews.map(mn => {
    let data = (mn) && mn
    if (mn.id) {
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
    }
    })                 
}

export function addConnectedObjects(node: any, params: any, myMetis: akm.cxMetis, myDiagram: any) {
    const myNode = myDiagram.findNodeForKey(node.key);
    let objectviews: akm.cxObjectView[] = new Array();
    let relshipviews: akm.cxRelationshipView[] = new Array();
    myMetis.myDiagram = myDiagram;
    let modelview = myMetis.currentModelview;
    if (!modelview)
        return;
    modelview = myMetis.findModelView(modelview.id);
    const goModel = myMetis.gojsModel;
    let objview: akm.cxObjectView;
    objview = myMetis.findObjectView(node.key);
    objectviews.push(objview);
    let noLevels = params.noLevels;
    let reltypes = params.reltypes;
    let reldir   = params.reldir;
    myDiagram.startTransaction('addConnectedObjects');
       
    if (reldir === 'All') {
        addConnectedObjects1(modelview, objview, goModel, myMetis, noLevels, reltypes, 'out', objectviews, relshipviews);
        addConnectedObjects1(modelview, objview, goModel, myMetis, noLevels, reltypes, 'in', objectviews, relshipviews);
    }

    myDiagram.commitTransaction('addConnectedObjects');

    myDiagram.startTransaction('generateNodesAndLinks');

    // Now generate the nodes and links, and select them
    const myObjectViews = [];
    const myRelshipViews = [];
    if (myNode) myNode.isSelected = true;
    for (let i=1; i<objectviews.length; i++) {
        let objview = objectviews[i];
        const goNode = new gjs.goObjectNode(objview.id, goModel, objview);
        objview = uic.setObjviewAttributes(goNode, myDiagram);
        const jsnObjview = new jsn.jsnObjectView(objview);
        myObjectViews.push(jsnObjview);
        myDiagram.model.addNodeData(goNode);
        const node = myDiagram.findNodeForData(goNode)
        node.isSelected = true;
    }
    for (let i=0; i<relshipviews.length; i++) {
        let relview = relshipviews[i];
        const fromObjview = relview.fromObjview;
        const toObjview = relview.toObjview;
        // Add link
        let goLink = new gjs.goRelshipLink(relview.id, goModel, relview);
        goLink.loadLinkContent(goModel);
        goLink.fromNode = getNodeByViewId(fromObjview.id, myDiagram);
        goLink.from = goLink.fromNode?.key;
        goLink.toNode = getNodeByViewId(toObjview.id, myDiagram);
        goLink.to = goLink.toNode?.key;
        relview = uic.setRelviewAttributes(goLink, myDiagram);
        resetToTypeview(goLink, myMetis, myDiagram);

        const jsnRelview = new jsn.jsnRelshipView(relview);
        myRelshipViews.push(jsnRelview);
        const link = myDiagram.findLinkForKey(goLink.key)
        link.isSelected = true;
    }
    myDiagram.commitTransaction('generateNodesAndLinks');

    myDiagram.startTransaction('selectNodesAndLinks');

    myDiagram.commitTransaction('selectNodesAndLinks');

    myDiagram.startTransaction('layoutNodesAndLinks');

    const mySelection = myDiagram.selection;
    const lay = doTreeLayout(mySelection, modelview, myDiagram, true);

    myDiagram.commitTransaction('layoutNodesAndLinks');

    const modifiedModelviews = new Array();
    const jsnModelview = new jsn.jsnModelView(modelview);
    modifiedModelviews.push(jsnModelview);
    modifiedModelviews.map(mn => {
      let data = mn;
      data = JSON.parse(JSON.stringify(data));
      myMetis.myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data })
    })
}

export function selectConnectedObjects(node: any, myMetis: akm.cxMetis, myDiagram: any) {
    myMetis.myDiagram = myDiagram;
    let modelview = myMetis.currentModelview;
    modelview = myMetis.findModelView(modelview.id);
    const goModel = myMetis.gojsModel;
    const myKey = node?.key;
    let objview: akm.cxObjectView = myMetis.findObjectView(myKey);
    let objviews = new Array();
    let relviews = new Array();
    const viewCollection = new akm.cxCollectionOfViews(modelview, objviews, relviews);
    let noLevels = '1';
    let reltypes = 'All';
    let reldir   = 'All';
    let useDefaults = confirm('Use default parameters?');
    if (useDefaults) {
        noLevels = 9;
        reltypes = 'All';
        reldir === 'All'
    } else {
        noLevels = prompt('Enter no of sublevels to follow', noLevels);
        reltypes = prompt('Enter relationship type to follow', reltypes);
        if (reltypes === 'All') {
            reltypes = '';
        }
        reldir = prompt('Enter relationship direction to follow (in | out | All)', reldir);
    }
    if (reldir === 'All') {
        selectConnectedObjects1(modelview, objview, goModel, myMetis, noLevels, reltypes, 'out', viewCollection);
        selectConnectedObjects1(modelview, objview, goModel, myMetis, noLevels, reltypes, 'in', viewCollection);
    } else {
        selectConnectedObjects1(modelview, objview, goModel, myMetis, noLevels, reltypes, reldir, viewCollection);
    }

    const mySelection = new go.Set<go.Part | go.Link>();
    objviews = viewCollection.objectviews;
    relviews = viewCollection.relshipviews;
    for (let i=0; i<objviews.length; i++) {
        const objview = objviews[i];
        const gjsNode = goModel.findNodeByViewId(objview.id);
        if (objview.id !== myKey) { // For all nodes except the selected one
            const node = myDiagram.findNodeForKey(gjsNode?.key);
            mySelection.add(node);
        }
    }
    for (let i=0; i<relviews.length; i++) {
        const relview = relviews[i];
        const goLink = goModel.findLinkByViewId(relview.id);
        const link = myDiagram.findLinkForKey(goLink?.key);
        mySelection.add(link);
    } 
    myDiagram.selectCollection(mySelection);
}

export function hideConnectedRelationships(node, myMetis: akm.cxMetis, myDiagram) {
    const goModel = myMetis.gojsModel;
    const objview = node.data.objectview;
    const modelview = myMetis.currentModelview;
    const relviews = modelview.relshipviews;
    const modifiedRelshipViews = new Array();
    const rviews = new Array();
    for (let i=0; i<relviews?.length; i++) {
        const relview = relviews[i];
        if (relview) {
            const fromObjview = relview.fromObjview;
            const toObjview = relview.toObjview;
            if (fromObjview?.id === objview.id || toObjview?.id === objview.id) {
                rviews.push(relview);
            }
        }
    }
    for (let i=0; i<rviews?.length; i++) {
        const relview = rviews[i];
        relview.visible = false;
        const jsnRelView = new jsn.jsnRelshipView(relview);
        modifiedRelshipViews.push(jsnRelView);
    }
    const links = node.findLinksOutOf();
    myDiagram.removeParts(links);

    modifiedRelshipViews.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
    })
}

export function sortSelection(myDiagram) {
    const selection = myDiagram.selection;
    const mySelection = [];
    let myLocs = [];
    for (let it = selection.iterator; it?.next();) {
      let n = it.value;
      mySelection.push(n.data);
      const nodeLoc = n.data.loc?.split(" ");
      const nx = parseInt(nodeLoc[0]);            
      const ny = parseInt(nodeLoc[1]);            
      const myLoc = {name: ny, loc: n.data.loc, nx: nx, ny: ny};
      myLocs.push(myLoc);
    }
    const myObjectViews = [];
    mySelection.sort(utils.compare);
    myLocs.sort(utils.compare);
    for (let i = 1; i < myLocs.length; i++) {
      const myLoc = myLocs[i];
      if (myLocs[i].ny === myLocs[i-1].ny) {
        if (myLoc.name < myLocs[i-1].name) {
          myLocs[i] = myLocs[i-1];
          myLocs[i-1] = myLoc;
    //   if (myLocs[i].ny === myLocs[i-1].ny) {
    //     if (myLocs[i].nx > myLocs[i-1].nx) {
    //         if (myLoc.name < myLocs[i-1].name) {
    //             myLocs[i] = myLocs[i-1];
    //             myLocs[i-1] = myLoc;
    //         }
        // } else if (myLocs[i].nx < myLocs[i-1].nx) {
        //     if (myLoc.name < myLocs[i-1].name) {
        //         myLocs[i] = myLocs[i-1];
        //         myLocs[i-1] = myLoc;
        //     }    
        }
      }
    }
    for (let i = 0; i < mySelection.length; i++) {
      const node = mySelection[i];
      node.loc = myLocs[i].loc;
      const objview = node.objectview;
      objview.loc = node.loc;
      const jsnObjview = new jsn.jsnObjectView(objview);
      myObjectViews.push(jsnObjview);
    }
    myObjectViews.map(mn => {
      let data = (mn) && mn
      if (mn.id) {
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
      }
    })
}

export function addToSelection(obj: any, myDiagram: any) {
    let myCollection = new go.Set<go.Part | go.Link>();
    const node = obj.part ? obj.part : obj;
    let currentNode = myDiagram.findPartForKey(node.key);
    if (currentNode) {
        myCollection.add(currentNode.part);
    } else {
        const currentLink = myDiagram.findLinkForKey(node.key);
        myCollection.add(currentLink.part);
    }
    // myCollection.add(currentNode.part);
    let selection = myDiagram.selection;
    for (let it = selection.iterator; it?.next();) {
      let n = it.value;
      myCollection.add(n.part);
    }
    myDiagram.selectCollection(myCollection);
}

export function updateProjectFromAdminmodel(myMetis: akm.cxMetis, myDiagram: any) {
    const adminMetamodel = myMetis.findMetamodelByName(constants.admin.AKM_ADMIN_META);
    const adminModel    = myMetis.findModelByName(constants.admin.AKM_ADMIN_MODEL);
    const projectType   = myMetis.findObjectTypeByName(constants.admin.AKM_PROJECT);
    const metamodelType = myMetis.findObjectTypeByName(constants.admin.AKM_METAMODEL);
    const modelType     = myMetis.findObjectTypeByName(constants.admin.AKM_MODEL);
    const modelviewType = myMetis.findObjectTypeByName(constants.admin.AKM_MODELVIEW);

    // First handle project properties
    const projects = adminModel.getObjectsByType(projectType);
    const project = projects[0];
    myMetis.name = project.name;
    myMetis.description = project.description;
    const properties = projectType.getProperties(true);
    for (let i=0; i<properties.length; i++) {
      const prop = properties[i];
      myMetis[prop.name] = project[prop.name];
    }
    // Then handle metamodels, but only existing ones
    const mmObjects = adminModel.getObjectsByType(metamodelType);
    for (let i=0; i<mmObjects.length; i++) {
        let metamodel;
        const mmObj = mmObjects[i];
        if (mmObj.metamodelId) {
            // Existing metamodel
            metamodel = myMetis.findMetamodel(mmObj.metamodelId) as akm.cxMetaModel;
            metamodel.name = mmObj.name;
            metamodel.description = mmObj.description;
        }
        if (metamodel) {
            const properties = metamodelType.getProperties(true);
            for (let i=0; i<properties.length; i++) {
                const prop = properties[i];
                metamodel[prop.name] = mmObj[prop.name];
            }  
        } else {
            // New metamodel
            metamodel = new akm.cxMetaModel(utils.createGuid(), mmObj.name, mmObj.description);
            myMetis.addMetamodel(metamodel);
            const properties = metamodelType.getProperties(true);
            for (let i=0; i<properties.length; i++) {
                const prop = properties[i];
                metamodel[prop.name] = mmObj[prop.name];
            }  
       }
    }
    // And then handle models
    const mObjects = adminModel.getObjectsByType(modelType);
    for (let i=0; i<mObjects.length; i++) {
        let model;
        const mObj = mObjects[i];
        if (mObj.modelId) {
            // Existing model
            model = myMetis.findModel(mObj.modelId) as akm.cxModel;
            model.name = mObj.name;
            model.description = mObj.description;
        } else {
            // New model
            model = new akm.cxModel(utils.createGuid(), mObj.name, mObj.description);
            myMetis.addModel(model);
            // Locate metamodel
            const rels = mObj.outputrels;
            for (let i=0; i<rels.length; i++) {
                const rel = rels[i];
                if (rel.name === constants.admin.AKM_REFERSTO_METAMODEL) {
                    const mmObj = rel.toObject;
                    const metamodel = myMetis.findMetamodel(mmObj.metamodelId) as akm.cxMetaModel;
                    model.metamodel = metamodel;
                    break;
                }
            }
        }
        if (model) {
            const properties = modelType.getProperties(true);
            for (let i=0; i<properties.length; i++) {
                const prop = properties[i];
                model[prop.name] = mObj[prop.name];
            }        
            // Find modelviews
            const rels = mObj.outputrels;
            for (let i=0; i<rels.length; i++) {
                const rel = rels[i];
                if (rel.name === constants.admin.AKM_HAS_MODELVIEW) {
                    const mvObj = rel.toObject;
                    if (mvObj.type.name === constants.admin.AKM_MODELVIEW) {
                        let modelview;
                        if (mvObj.modelviewId) {
                            // Existing modelview
                            modelview = myMetis.findModelView(mvObj.modelviewId);
                            modelview.name = mvObj.name;
                            modelview.description = mvObj.description;                
                        } else {
                            // New modelview
                            modelview = new akm.cxModelView(utils.createGuid(), mvObj.name, mObj, mvObj.description);
                            model.addModelView(modelview);
                            myMetis.addModelView(modelview);
                        }
                        if (modelview) {
                            const properties = modelviewType.getProperties(true);
                            for (let i=0; i<properties.length; i++) {
                                const prop = properties[i];
                                modelview[prop.name] = mvObj[prop.name];
                            }        
                        }
                    }
                }
            }
        }
    }
    // Dispatch metis
    const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
    let data = {metis: jsnMetis}
    data = JSON.parse(JSON.stringify(data));
    myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data }) // Todo: dispatch only name
    if (debug) console.log('362 myMetis, data', myMetis, data);
} 

export function getConnectToSelectedTypes(node: any, selection: any, myMetis: akm.cxMetis, myDiagram: any): string[] {
    let reltypeNames = [constants.types.AKM_CONTAINS];
    const myMetamodel = myMetis.currentMetamodel;
    const myModelview = myMetis.currentModelview;
    const myGoModel = myMetis.gojsModel;
    const goNode = myGoModel.findNodeByViewId(node.key);
    let fromType = goNode.objecttype;
    if (!fromType)
        fromType = myMetamodel.findObjectType(goNode.objtypeRef);   

    let objtypenames = [];
    let objtypes = [];

    // Get a list of selected object types to connect to
    for (let it = selection.iterator; it?.next();) {
        let n = it.value;
        if (n.data.key === node.key) 
            continue;
        const gNode = myGoModel.findNode(n.data.key);
        if (gNode) {
            let objtype = gNode.objecttype;
            if (!objtype)
                objtype = myMetamodel.findObjectType(gNode.objtypeRef);
            if (objtype) {
                objtypes.push(objtype);
                objtypenames.push(objtype.name);
            }
        }
    }
    let uniqueSet = utils.removeArrayDuplicates(objtypenames);
    objtypenames = uniqueSet;
    uniqueSet = utils.removeArrayDuplicatesById(objtypes, "id");
    objtypes = uniqueSet;
    // Force inheritance to true - ignore stored false values for now
    const includeInheritedReltypes = true; // myModelview.includeInheritedReltypes;
    let reltypes = [];
    // Walk through selected object's types (objtypes)
    if (!myModelview.isMetamodel) {
        for (let i=0; i<objtypes.length; i++) {
            let toType = objtypes[i];
            toType = myMetamodel.findObjectType(toType.id);
            const rtypes = myMetamodel.findRelationshipTypesBetweenTypes(fromType, toType, includeInheritedReltypes);
            if (i == 0) {
                // First time
                reltypes = rtypes;
            } else {
                // The other times
                const types = utils.getIntersection(reltypes, rtypes);
                reltypes = types;
            }
            for (let i=0; i<reltypes?.length; i++) {
                const rtname = reltypes[i].name;
                if (rtname === constants.types.AKM_GENERIC_REL)
                    continue;
                reltypeNames.push(rtname);
            }
        }
    } else if (fromType.name !== constants.types.AKM_METAMODEL) {
        let rtype = myMetis.findRelationshipTypeByName(constants.types.AKM_IS);
        reltypeNames.push(rtype.name);
        rtype = myMetis.findRelationshipTypeByName(constants.types.AKM_RELATIONSHIP_TYPE);
        reltypeNames.push(rtype.name);
    } else {
        let rtype = myMetis.findRelationshipTypeByName(constants.types.AKM_CONTAINS);
        reltypeNames.push(rtype.name);
    }
    if (reltypeNames.length > 0) {
        uniqueSet = utils.removeArrayDuplicates(reltypeNames);
        reltypeNames = uniqueSet;
        reltypeNames.sort();
    }
    return reltypeNames;
}

export function getNodeByViewId(viewId: string, myDiagram: any): any {
    let node = null;
    for (let it = myDiagram.nodes; it?.next();) {
        const n = it.value;
        if (n.data.objviewRef === viewId) {
            node = n.data;
            break;
        }
    }
    return node;
}

export function getLinkByViewId(viewId: string, myDiagram: any): any {
    let link = null;
    for (let it = myDiagram.links; it?.next();) {
        const l = it.value;
        if (l.data.relviewRef === viewId) {
            link = l.data;
            break;
        }
    }
    return link;
}

function askForMetamodel(context: any) {
    if (debug) console.log('750 context', context);
    const myMetis = context.myMetis;
    let myMetamodel = context.myCurrentMetamodel;
    const myDiagram = context.myDiagram;
    const metaModels = [];
    const allMetaModels = myMetis.metamodels;
    if (debug) console.log('756 allMetaModels', allMetaModels, myMetamodel);
    for (let i=0; i<allMetaModels.length; i++) {
        const metaModel = allMetaModels[i];
        if (!metaModel || !metaModel.id)
            continue;
        if (metaModel.markedAsDeleted)
            continue;
        if (metaModel.name === constants.admin.AKM_ADMIN_META)
            continue;
        if (myMetamodel && (metaModel.id === myMetamodel?.id)) {
            if (context.case !== 'New Model')
                continue;
        }

        switch (context.case) {
            case "New model":
            case "Add Metamodel":
            case "Delete Metamodel":
            case "Clear Metamodel":
            case "Replace Metamodel":
            case "Generate Target Metamodel":
                if (metaModel.id === myMetamodel?.id)
                    continue;
                break;
        }
        metaModels.push(metaModel);
      }
      context.args.metamodels = metaModels;
      const modalContext = {
        what:           "selectDropdown",
        title:          context.title,
        case:           context.case,
        myMetis:        myMetis,
        myDiagram:      myDiagram,
        context:        context,
      }
      if (debug) console.log('790 modalContext', modalContext);
      const mmNameIds = metaModels.map(mm => mm && mm.nameId);
      myDiagram.handleOpenModal(mmNameIds, modalContext);
}

function replaceCurrentMetamodel2(context: any) {
    const oldMetamodel = context.myCurrentMetamodel;
    const newMetamodel = context.args.metamodel;
    const myMetis = context.myMetis;
    const myModel = context.myCurrentModel;
    const myDiagram = context.myDiagram;
    const otypeDefault = myMetis.findObjectTypeByName(constants.types.AKM_GENERIC);
    const rtypeDefault = myMetis.findRelationshipTypeByName(constants.types.AKM_GENERIC_REL);
    if (debug) console.log('634 context', context);
    myModel.metamodel = newMetamodel;
    const objects = myModel.objects;
    for (let i=0; i<objects?.length; i++) {
        const object = objects[i];
        if (!object) continue;
        const otypeName = object.type?.name;
        const objtype = newMetamodel.findObjectTypeByName(otypeName);
        if (objtype) {
            object.type = objtype;
            object.typeRef = objtype.id;
        } else {
            object.type = otypeDefault;
            object.typeRef = otypeDefault.id;
        }
        let typeview;
        if (objtype) {
            typeview = objtype.typeview;
        } else {
            typeview = object.type.typeview;
        }
        const objviews = object.objectviews;
        for (let j=0; j<objviews?.length; j++) {
            const oview = objviews[j];
            oview.typeview = typeview;
            oview.typeviewRef = typeview.id;
        }    
    }
    const relships = myModel.relships;
    for (let i=0; i<relships?.length; i++) {
        const relship = relships[i];
        if (!relship) continue;
        const toObjtypeName = relship.toObject?.type?.name;
        const fromObjtypeName = relship.fromObject?.type?.name;
        const rtypeName = relship.type?.name;
        let reltype = newMetamodel.findRelationshipTypeByNames(rtypeName, toObjtypeName, fromObjtypeName);
        if (reltype) {
            relship.type = reltype;
            relship.typeRef = reltype.id;
        } else {
            reltype = rtypeDefault;
            relship.type = reltype;
            relship.typeRef = reltype.id;
        }
        let typeview = reltype.typeview;
        const relviews = relship.relshipviews;
        for (let j=0; j<relviews?.length; j++) {
            const rview = relviews[j];
            rview.typeview = typeview;
        }    
    }
    if (debug) console.log('685 newMetamodel', newMetamodel);
    const modifiedMetamodels = []
    const jsnMetamodel = new jsn.jsnMetaModel(newMetamodel, true);
    if (debug) console.log('688 jsnMetaModel', jsnMetamodel);
    modifiedMetamodels.push(jsnMetamodel);
    modifiedMetamodels.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data });
    });
    const modifiedModels = []
    const jsnModel = new jsn.jsnModel(myModel, true);
    if (debug) console.log('697 jsnModel', jsnModel);
    modifiedModels.push(jsnModel);
    modifiedModels.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data });
    });
    if (debug) console.log('703 myMetis', myMetis);
}

function addMetamodel2(context: any) {
    const currentMetamodel = context.myCurrentMetamodel;
    const metamodel = context.args.metamodel;
    const myMetis = context.myMetis;
    const myDiagram = context.myDiagram;
    const isSubMetamodel = context.isSubMetamodel;
    if (debug) console.log('271 currentMetamodel, metamodel', currentMetamodel, metamodel);
    if (isSubMetamodel) {
        currentMetamodel.addSubMetamodel(metamodel);
    } else {
        const objecttypes = metamodel.objecttypes;
        for (let i=0; i<objecttypes?.length; i++) {
            const objecttype = objecttypes[i];
            if (!objecttype) continue;
            if (currentMetamodel.findObjectType(objecttype.id)) 
                continue;
            else 
                currentMetamodel.addObjectType(objecttype);
        }
        const relshiptypes = metamodel.relshiptypes;
        for (let i=0; i<relshiptypes?.length; i++) {
            const relshiptype = relshiptypes[i];
            if (!relshiptype) continue;
            if (currentMetamodel.findRelationshipType(relshiptype.id)) 
                continue;
            else 
                currentMetamodel.addRelationshipType(relshiptype);
        }
        const objecttypes0 = metamodel.objecttypes0;
        for (let i=0; i<objecttypes0?.length; i++) {
            const objecttype = objecttypes0[i];
            if (!objecttype) continue;
            if (currentMetamodel.findObjectType0(objecttype.id)) 
                continue;
            else 
                currentMetamodel.addObjectType0(objecttype);
        }
        const relshiptypes0 = metamodel.relshiptypes0;
        for (let i=0; i<relshiptypes0?.length; i++) {
            const relshiptype = relshiptypes0[i];
            if (!relshiptype) continue;
            if (currentMetamodel.findRelationshipType0(relshiptype.id)) 
                continue;
            else 
                currentMetamodel.addRelationshipType0(relshiptype);
        }
    }
    const jsnMetamodel = new jsn.jsnMetaModel(currentMetamodel, true);
    if (debug) console.log('293 jsnMetamodel', jsnMetamodel);
    const modifiedMetamodels = new Array();
    modifiedMetamodels.push(jsnMetamodel);
    modifiedMetamodels.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data });
    });
    if (debug) console.log('302 myMetis', myMetis);
    alert("The metamodel has been successfully added!");
}

function deleteMetamodel2(context: any) {
    const metamodel = context.args.metamodel;
    if (!metamodel)
        return;
    const myMetis = context.myMetis;
    const myDiagram = context.myDiagram;
    if (debug) console.log('271 metamodel, myMetis', metamodel, myMetis);
    const models = myMetis.getModelsByMetamodel(metamodel, false);
    if (debug) console.log('274 models', models);
    let doDelete = false;
    if (models.length > 0) {
        let msg = "There are models based on the metamodel '" + metamodel.name + "'.\n";
        msg += "The models will also be deleted!\n";
        msg += "Do you still want to continue?";
        doDelete = confirm(msg);
    } else {
        doDelete = confirm("Do you really want to delete the metamodel '" + metamodel.name + "'?");
    }
    if (!doDelete) {
            return;
    } else {
        // First delete the models based on the metamodel
        for (let i=0; i<models.length; i++) {
            const model = models[i];
            deleteModel2(model, myMetis, myDiagram);
        }
        // Then delete the metamodel
        metamodel.markedAsDeleted = true;
        const metamodels = myMetis.getMetamodels();
        // First check relationship types
        const reltypes = metamodel.relshiptypes;
        for (let i=0; i<reltypes?.length; i++) {
            const reltype = reltypes[i];
            let found = false;
            for (let j=0; j<metamodels.length; j++) {
                const mm = metamodels[j];
                if (mm.markedAsDeleted) continue;
                if (mm.findRelationshipType(reltype.id)) {
                    found = true;
                    break;
                }
            }
            if (!found)
                reltype.markedAsDeleted = true;
        }
        // Then check relationship type views
        const reltypeviews = metamodel.relshiptypeviews;
        for (let i=0; i<reltypeviews?.length; i++) {
            const reltypeview = reltypeviews[i];
            let found = false;
            for (let j=0; j<metamodels.length; j++) {
                const mm = metamodels[j];
                if (mm.markedAsDeleted) continue;
                if (mm.findRelationshipTypeView(reltypeview.id)) {
                    found = true;
                    break;
                }
            }
            if (!found)
                reltypeview.markedAsDeleted = true;
        }
        // Then check object types
        const objtypes = metamodel.objecttypes;
        for (let i=0; i<objtypes?.length; i++) {
            const objtype = objtypes[i];
            let found = false;
            for (let j=0; j<metamodels.length; j++) {
                const mm = metamodels[j];
                if (mm.markedAsDeleted) continue;
                if (mm.findObjectType(objtype.id)) {
                    found = true;
                    break;
                }
            }
            if (!found)
                objtype.markedAsDeleted = true;
        }
        // Then check object type views
        const objtypeviews = metamodel.objecttypeviews;
        for (let i=0; i<objtypeviews?.length; i++) {
            const objtypeview = objtypeviews[i];
            let found = false;
            for (let j=0; j<metamodels.length; j++) {
                const mm = metamodels[j];
                if (mm.markedAsDeleted) continue;
                if (mm.findObjectTypeView(objtypeview.id)) {
                    found = true;
                    break;
                }
            }
            if (!found)
                objtypeview.markedAsDeleted = true;
        }
        // If the metamodel was generated from a model, remove references in the model
        const generatedFromModel = myMetis.findModel(metamodel.generatedFromModelRef);
        if (generatedFromModel) {
            const objects = generatedFromModel.objects;
            for (let i=0; i<objects?.length; i++) {
                const obj = objects[i];
                obj.generatedTypeId = "";
            }
            const relships = generatedFromModel.relationships;
            for (let i=0; i<relships?.length; i++) {
                const rel = relships[i];
                rel.generatedTypeId = "";
            }
            const jsnModel = new jsn.jsnModel(generatedFromModel, true);
            let data = JSON.parse(JSON.stringify(jsnModel));
            myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data });
        }       
    }
    if (myMetis.currentTargetMetamodel?.id === metamodel.id) {
        myMetis.currentTargetMetamodel = null;
        myMetis.currentTargetMetamodelRef = "";
    }
    uic.purgeMetaDeletions(myMetis, myDiagram);     
    if (debug) console.log('302 myMetis', myMetis);
    const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
    let data = { metis: jsnMetis }
    data = JSON.parse(JSON.stringify(data));
    myDiagram.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
}

function clearMetamodel2(context: any) {
    const myMetis = context.myMetis as akm.cxMetis;
    let metamodel = context.args.metamodel;
    metamodel = myMetis.findMetamodel(metamodel.id)
    const myDiagram = context.myDiagram;
    if (debug) console.log('271 metamodel, myMetis', metamodel, myMetis);
    const modifiedMetamodels = new Array();
    const modifiedModels = new Array();
    const models = myMetis.getModelsByMetamodel(metamodel, false);
    if (debug) console.log('274 models', models);
    let doClear = false;
    if (models.length > 0) {
        let msg = "There are models based on the metamodel '" + metamodel.name + "'.\n";
        doClear = confirm("Do you really want to clear the metamodel '" + metamodel.name + "'?");
        if (doClear) {
            let keepModels = false;
            msg += "Do you want to clear the models as well?"
            doClear = confirm(msg);
            if (!doClear) {
                msg = "The models will be kept, but their metamodel will be cleared.\n"
                keepModels = true;
            } else {
                msg = "The models will be cleared!\n";
            }
            msg += "Do you still want to continue?";
            doClear = confirm(msg);
        }
    } 
    else {
        doClear = confirm("Do you really want to clear the metamodel '" + metamodel.name + "'?");
    }
    if (!doClear) {
            return;
    } else {
        let keepModels = true;
        if (keepModels) {
            // const model = models[i];
            // for (let j=0; j<modelviews.length; j++) {
            //     const modelview = model.modelviews[j];
            //     const objviews = modelview.objectviews;
            //     for (k=0; k<objviews.length; k++) {
            //         const objview = objviews[k];
            //         const typeview = objview.typeview;
            //         if (typeview) {
            //             let viewdata: any = typeview.data;
            //             let prop: string;
            //             for (prop in viewdata) {
            //                 if (prop === 'class') continue;
            //                 if (prop === 'group') continue;
            //                 if (prop === 'isGroup') continue;
            //                 if (prop === 'viewkind') continue;
            //                 if (viewdata[prop] != null) {
            //                     objview[prop] = viewdata[prop];
            //                 }
            //             }
            //         }
            //     }
            // }
        } else {
            for (let i=0; i<models.length; i++) {
                const model = models[i];
                const modelviews = model.modelviews;
                for (let j=0; j<modelviews.length; j++) {
                    const modelview = model.modelviews[j];
                    modelview.clearContent();
                    model.clearContent();
                    model.addModelView(modelview);
                    const jsnModel = new jsn.jsnModel(model, true);
                    if (debug) console.log('644 jsnModel', jsnModel);
                    modifiedModels.push(jsnModel);
                    modifiedModels.map(mn => {
                    let data = mn;
                    data = JSON.parse(JSON.stringify(data));
                    myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data });
                    });
                }   
                uic.verifyAndRepairModel(modelview, model, metamodel, myDiagram, myMetis);
            }   
        }     
        metamodel.clearContent();
        const jsnMetamodel = new jsn.jsnMetaModel(metamodel, true);
        if (debug) console.log('654 jsnMetamodel', jsnMetamodel);
        let data = JSON.parse(JSON.stringify(jsnMetamodel));
        myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data });
        uic.purgeMetaDeletions(myMetis, myDiagram);
    } 
    if (debug) console.log('302 myMetis', myMetis);
}

function createModel(context: any) {
    const metamodel = context.args.metamodel;
    if (debug) console.log('51 Metamodel chosen: ', metamodel);
    if (!metamodel) return;
    const myMetis = context.myMetis;
    const myDiagram = context.myDiagram;
    let model, modelName, modelview, modelviewName;
    if (metamodel.name === constants.admin.AKM_ADMIN_META) {
        modelName = constants.admin.AKM_ADMIN_MODEL;
        modelviewName = constants.admin.AKM_ADMIN_MODELVIEW;
        model = myMetis.findModelByName(modelName);
        if (!model) {
            model = new akm.cxModel(utils.createGuid(), modelName, metamodel, "");
            myMetis.addModel(model);    
        }
        if (model) {
            modelview = model.findModelViewByName(modelviewName);
            if (!modelview) {
                modelview = new akm.cxModelView(utils.createGuid(), modelviewName, model, "");
                model.addModelView(modelView);
                myMetis.addModelView(modelView);    
            }
            let data = new jsn.jsnModel(model, true);
            if (debug) console.log('35 jsnModel', data);
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'LOAD_TOSTORE_NEWMODELVIEW', data }); // dispatches model with modelview
            return;
        } 
    }       
    else {
        modelName = prompt("Enter Model name:", "");
    
        if (modelName == null || modelName === "") {
            alert("New operation was cancelled");
        } else {
            const model = new akm.cxModel(utils.createGuid(), modelName, metamodel, "");
            myMetis.addModel(model);
            const modelviewName = prompt("Enter Modelview name:", "Main");
            if (modelviewName == null || modelviewName === "") {
                alert("New operation was cancelled");
            } else {
                // const curmodel = myMetis.currentModel;
                const modelView = new akm.cxModelView(utils.createGuid(), modelviewName, model, "");
                if (metamodel?.viewstyle) 
                modelView.viewstyle = metamodel.viewstyle;
                model.addModelView(modelView);
                myMetis.addModelView(modelView);
                let data = new jsn.jsnModel(model, true);
                if (debug) console.log('35 jsnModel', data);
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'LOAD_TOSTORE_NEWMODELVIEW', data }); // dispatches model with modelview
            }
        }
    }
}

function askForModel(context: any) {
    if (debug) console.log('348 context', context);
    const myMetis = context.myMetis;
    let myModel = context.myCurrentModel;
    const myDiagram = context.myDiagram;
    const modalContext = {
        what:           "selectDropdown",
        title:          context.title,
        case:           context.case,
        myMetis:        myMetis,
        myDiagram:      myDiagram,
        context:        context,
    } 
    const models = new Array();
    const allModels = myMetis.models;
    for (let i=0; i<allModels?.length; i++) {
        const model = allModels[i];
        if (model.name === constants.admin.AKM_ADMIN_MODEL)
            continue;
        if (model.markedAsDeleted)
            continue;
        if (context.case === "Delete Model") {
            if (model.id === myModel.id)
                continue;
        }
        models.push(model);
    }
    const mmNameIds = models.map(mm => mm && mm.nameId);
    if (debug) console.log('372', mmNameIds, modalContext, context);
    myDiagram.handleOpenModal(mmNameIds, modalContext);
}

function deleteModel1(context: any) {
    const model = context.args.model;
    if (model) {
        if (!confirm("Do you really want to delete '" + model.name + "'?"))
            return;
        const myMetis = context.myMetis;
        const myDiagram = context.myDiagram;
        if (debug) console.log('367 model, myMetis', model, myMetis);
        deleteModel2(model, myMetis, myDiagram);
    }
}

function deleteModel2(model: akm.cxModel, myMetis: akm.cxMetis, myDiagram: any) {
    if (debug) console.log('372 model, myMetis', model, myMetis);
    const modifiedModels = new Array();
    model.markedAsDeleted = true;
    modifiedModels.map(mn => {
        let data = {id: model.id, markedAsDeleted: true};
        myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data });
    });
    alert("The model '" + model.name + "' has been deleted!");
    uic.purgeModelDeletions(myMetis, myDiagram);
}

function clearModel1(context: any) {
    const model = context.args.model;
    if (model) {
        if (!confirm("Do you really want to clear '" + model.name + "'?"))
            return;
        model.clearContent();
        const myMetis = context.myMetis;
        if (debug) console.log('367 model, myMetis', model, myMetis);
    }
}

const breakString = (str, limit) => {
    let brokenString = '';
    for(let i = 0, count = 0; i < str.length; i++){
       if(count >= limit && str[i] === ' '){
          count = 0;
          brokenString += '\n';
       }else{
          count++;
          brokenString += str[i];
       }
    }
    return brokenString;
}

export function nodeInfo(d: any, myMetis: akm.cxMetis) {  // Tooltip info for a node data object
    if (debug) console.log('1035 nodeInfo', d, d.object);
    if (debug) console.log('1136 nodeInfo', myMetis.gojsModel.findNode(d.group));

    const format1 = "%s\n";
    const format2 = "%-10s: %s\n";
    const format3 = "%-10s: (%s)\n";

    let msg = "";
    let propval
    msg += "- - - - - - - Object - - - - - - - -\n";
    // msg += printf(format2, "-Type", d.object.type.name);
    // msg += printf(format2, "-Title", d.object.type.title);
    // msg += printf(format2, "-Descr", breakString(d.object.type.description, 64));
    // // msg += printf(format2, "-Descr", d.object.type.description);
    // msg += "\n";
    msg += printf(format2, "name", d.name);
    // msg += printf(format2, "-Title", d.object.title);
    msg += printf(format2, "descr.", breakString(d.object.description, 64));
    // msg += "-------------------\n";
    // msg = "Object \Type props:\n";
    d.object.type.properties?.map(prop => {  
        propval = prop?.name;
        if (debug) console.log('1338 propval', propval);
        msg += printf(format2, prop.name, d.object[propval]);
    });
    msg += "- - - - - - - ObjectType - - - - - - - -\n";
    msg += printf(format3, "ObjectType", d.object.type.name);
    // msg += printf(format2, " -Title", d.object.type.title);
    msg += printf(format2," -Descr", breakString(d.object.type.description, 64));

    
    
    // msg += printf(format2, "-ViewFormat", d.object.viewFormat);
    // msg += printf(format2, "-FieldType", d.object.fieldType);
    // msg += printf(format2, "-Inputpattern", d.object.inputPattern);
    // msg += printf(format2, "-InputExample", d.object.inputExample);
    // msg += printf(format2, "-Value", d.object.value);
    // if (debug) console.log('1115 msg', msg);
    if (d.group) {
        const group = myMetis.gojsModel.findNode(d.group);
        msg += "\n";
        msg += "- - - - - - - Parent Object - - - - - - -\n";
        msg += printf(format2, "name", group.name);
        msg += printf(format3, "ObjectType", group.typename);
        msg += "\n";
    }
    // if (debug) console.log('1119 msg', msg);
    // let str = "Attributes:"; 
    // msg += printf(format1, str);      
    // const obj = d.object;
    // const props = obj.type.properties;
    // if (debug) console.log('996 obj, props', obj, props, msg);   
    // for (let i=0; i<props.length; i++) {
    //   const prop = props[i];
    //   if (debug) console.log('999 prop', prop);
    //   const value = obj[prop.name]; 
    //   console.log('1001 prop, value', prop, value);
    //   msg += printf(format2, prop.name, value);
    // }
    if (debug) console.log('1133 nodeInfo', msg);
    return msg;
}

export function linkInfo(d: any, myMetis: akm.cxMetis) {  // Tooltip info for a link data object
    if (debug) console.log('551 linkInfo', d, d.relshiptype);
    const typename = d.relshiptype?.name;
    const reltype = myMetis.findRelationshipTypeByName(typename);
    const fromNode = d.fromNode;
    const fromObj = fromNode?.object;
    const fromObjtype = reltype.getFromObjType();
    const toNode = d.toNode;
    const toObj = toNode?.object;
    const toObjtype = reltype.getToObjType();
    if (debug) console.log('560 linkInfo', d);
    const format1 = "%s\n";
    const format2 = " %-10s: %s\n";
    const format3 = "%-8s: %s\n";

    let msg = "Relationship:\n";
    // msg += "Type props:\n"; 
    // msg += "-------------------\n";
    // msg += printf(format2, "-Type", d.relship.type.name);
    // msg += printf(format2, "-Title", d.relship.type.title);
    // msg += printf(format2, "-Descr", breakString(d.relship.type.description, 64))
    // msg += "\n";
    msg += "Attributes:\n";
    msg += "---------------------\n";
    msg += printf(format2, "-Name", d.name);
    msg += printf(format2, "-Title", d.relship.title);
    msg += printf(format2, "-Description", breakString(d.relship.description, 64));
    msg += printf(format3, "-from", fromObj?.name);
    msg += printf(format2, "-to   ", toObj?.name);
    // str += "from: " + fromObj?.name + "\n";
    // str += "to: " + toObj?.name;
    // return str;
    return msg;
}

export function diagramInfo(model: any) {  // Tooltip info for the diagram's model
    if (debug) console.log('451 diagramInfo', model);
    let str = "Model:\n";
    str += model.nodeDataArray.length + " nodes, ";
    str += model.linkDataArray.length + " links";
    return str;
}

function relshipsSortedByNameTypeAndToNames(relships: akm.cxRelationship[], reldir: string) {
    if (relships.length < 2)
        return relships;
    relships?.sort((a, b) => {
        const typeA = a.type.name;
        const typeB = b.type.name;
        const nameA = a.name;
        const nameB = b.name;
        let toObjA, toObjB, toTypeA, toTypeB;
        if (reldir === 'in' && a.fromObject.type && b.fromObject.type) {
            toTypeA = a.fromObject.type.name;
            toObjA = a.fromObject.name;
            toTypeB = b.fromObject.type.name;
            toObjB = b.fromObject.name;
        } else if (a.toObject.type && b.toObject.type) {
            toTypeA = a.toObject.type.name;
            toObjA = a.toObject.name;
            toTypeB = b.toObject.type.name;
            toObjB = b.toObject.name;
        }
        if (toTypeA < toTypeB) return 1;
        if (toTypeA > toTypeB) return -1;
            
        if (toObjA < toObjB) return 1;
        if (toObjA > toObjB) return -1;

        if (nameA < nameB) return 1;
        if (nameA > nameB) return -1;
        
        return 0;
    });
    return relships;
}

function addConnectedObjects1(modelview: akm.cxModelView, objview: akm.cxObjectView, 
    goModel: gjs.goModel, myMetis: akm.cxMetis, noLevels: number, reltypes: string, reldir: string,
    allObjectviews: akm.cxObjectView[], allRelshipviews: akm.cxRelationshipView[]) {
    if (noLevels < 1)
        return;
    if (!objview)
        return;
    const objectviews: akm.cxObjectView[] = [];
    const modifiedObjectViews: akm.cxObjectView[] = new Array();
    const modifiedRelshipViews: akm.cxRelationshipView[] = new Array();
    const myDiagram = myMetis.myDiagram;
    let object: akm.cxObject = objview.object;
    if (!object) object = myMetis.findObject(objview.objectRef);
    if (object)
        object = myMetis.currentModel.findObject(object.id);
    if (objview)
        objview = myMetis.currentModelview.findObjectView(objview.id);
    let ny = 0;
    if (objview && object && objview.loc) {
        const nodeLoc = objview.loc.split(" ");
        const nx = parseInt(nodeLoc[0]);
        ny += parseInt(nodeLoc[1]);
        let objtype: akm.cxObjectType = object.type;
        objtype = myMetis.findObjectType(objtype.id);
        if (objtype && objtype?.isContainer()) {
            objview.viewkind = constants.viewkinds.CONT;
        }
        let reltype: akm.cxRelationshipType;
        if (reltypes) { // Check if reltype is specified
            // get reltype from comma separated list (to be done)
            const reltypename = reltypes.split(',')[0];        
            try {
                reltype = myMetamodel.findRelationshipTypeByName(reltypename);
            } catch {
                reltype = myMetis.findRelationshipTypeByName(reltypename);
            }
        }
        // Find all relationships of object sorted by name, typename and toObj name
        let useinp = (reldir === 'in');
        let rels: akm.cxRelationship[];
        if (useinp) {
            rels = object.inputrels;
            if (rels)
                rels = relshipsSortedByNameTypeAndToNames(rels, reldir)
        } else {
            rels = object.outputrels;
            if (rels)
                rels = relshipsSortedByNameTypeAndToNames(rels, reldir)
        }
        if (rels) {
            let cnt = 0;
            for (let i=0; i<rels.length; i++) {
                let rel = rels[i];
                if (!rel)
                    continue;
                if (rel.markedAsDeleted)
                    continue;
                rel = myMetis.findRelationship(rel.id) as akm.cxRelationship;
                if (reltype) {
                    if (rel?.type.id !== reltype?.id)
                        continue;
                }
                let toObj: akm.cxObject;
                if (useinp) 
                    toObj = rel.fromObject as akm.cxObject;
                else
                    toObj = rel.toObject as akm.cxObject;
                toObj = myMetis.currentModel.findObject(toObj.id);
                if (!toObj || toObj.markedAsDeleted)
                    continue;
                const toObjtype = toObj.type;
                const toObjtypeview = toObjtype.typeview;
                let toObjviews: akm.cxObjectView[] = [];
                // Find toObj in modelview
                const objviews = modelview.findObjectViewsByObject(toObj);
                let toObjview: akm.cxObjectView;
                if (objviews && objviews.length >0) {
                    for (let j=0; j<objviews.length; j++) {   
                        const oview = objviews[j];
                        if (oview.markedAsDeleted) {
                            oview.markedAsDeleted = false;
                        }
                        if (toObjtype.isContainer())
                            oview.viewkind = constants.viewkinds.CONT;
                        toObjview = oview;
                        const toNode = new gjs.goObjectNode(toObjview.id, goModel, toObjview);
                        toObjview = uic.setObjviewAttributes(toNode, myDiagram);
                        const jsnObjview = new jsn.jsnObjectView(toObjview);
                        modifiedObjectViews.push(jsnObjview);
                        toObjviews.push(toObjview);
                        objectviews.push(toObjview);
                    }
                    // Create relship views and links to the found objviews if they do not exist
                    let relviews: akm.cxRelationshipView[] = [];
                    if (useinp) {
                        relviews = modelview.findRelationshipViewsByRel2(rel, toObjview, objview);
                        if (relviews.length == 0) i++;
                    } else { // output rels
                        relviews = modelview.findRelationshipViewsByRel2(rel, objview, toObjview);
                        if (relviews?.length == 0) i++;
                    }
                    if (debug) console.log('1637 rel, relview', rel, relviews);    
                    for (let j=0; j<relviews.length; j++) {
                        const relview = relviews[j];
                        const jsnRelView = new jsn.jsnRelshipView(relview);
                        modifiedRelshipViews.push(jsnRelView);
                    }
                } else {
                    cnt++;
                    // Create an objectview of toObj and then a node
                    const id1 = utils.createGuid();
                    toObjview = new akm.cxObjectView(id1, toObj.name, toObj, "");
                    toObj.addObjectView(toObjview);
                    modelview.addObjectView(toObjview);
                    myMetis.addObjectView(toObjview);   
                    { // Do the layout       
                        const ydiff = 100; // noLevels>0 ? 50 : 100;
                        const locx = useinp ? nx - 300 : nx + 300;
                        const locy = ny + (cnt-1) * ydiff;
                        const loc = locx + " " + locy;
                        toObjview.loc = loc;
                        objviews.push(toObjview);
                        objectviews.push(toObjview);
                        allObjectviews.push(toObjview);
                    }
                    // The objectview has been created
                    const jsnObjview = new jsn.jsnObjectView(toObjview);
                    modifiedObjectViews.push(jsnObjview);
                    // Create the node
                    const goNode = new gjs.goObjectNode(toObjview.id, goModel, toObjview);
                    goModel.addNode(goNode);
                    // Now create a relship view from object to toObj
                    const oviewFrom = useinp ? toObjview : objview;
                    const oviewTo = useinp ? objview : toObjview;
                    // First check if the relship view already exists
                    const relviews2 = modelview.findRelationshipViewsByRel2(rel, oviewFrom, oviewTo);
                    if (!relviews2 || relviews2?.length == 0) {
                        myDiagram.startTransaction('AddLink');
                        const id2 = utils.createGuid();
                        const relview = new akm.cxRelationshipView(id2, rel.name, rel, "");
                        relview.fromObjview = oviewFrom;
                        relview.toObjview = oviewTo;
                        rel.addRelationshipView(relview);
                        modelview.addRelationshipView(relview);
                        myMetis.addRelationshipView(relview);
                        allRelshipviews.push(relview);
                        const jsnRelView = new jsn.jsnRelshipView(relview);
                        modifiedRelshipViews.push(jsnRelView);
                        // Then add links
                        const goLink = new gjs.goRelshipLink(relview.id, goModel, relview);
                        goModel.addLink(goLink);
                        myDiagram.model.addLinkData(goLink);
                        myDiagram.commitTransaction('AddLink');
                        myDiagram.requestUpdate();
                    }                   
                }
            }
        }
    }
    modifiedObjectViews.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
    });
    modifiedRelshipViews.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data });
    });
    if (noLevels > 1) {
        for (let i=0; i<objectviews?.length; i++) {
            const oview = objectviews[i];
            if (debug) console.log('1945 objview, oview', objview, oview);
            noLevels--;
            addConnectedObjects1(modelview, oview, goModel, myMetis, noLevels, 
                                 reltypes, reldir, allObjectviews, allRelshipviews);
            noLevels++;
        }
    }
}
function connectObjects(objview: akm.cxObject, rel: akm.cxRelationship, context: any) { 
    const useinp    = context.useinp;
    const myMetis   = context.myMetis;
    const myDiagram = context.myDiagram;
    const modelview = context.modelview;
    const goModel   = context.goModel;
    const positions = context.positions;
    const modifiedObjectViews  = context.modifiedObjectViews;
    const modifiedRelshipViews = context.modifiedRelshipViews;
    // Identify the toObj and its type++
    let toObj: akm.cxObject;
    if (useinp) toObj = rel.fromObject as akm.cxObject;
    else toObj = rel.toObject as akm.cxObject;
    toObj = myMetis.findObject(toObj.id);
    if (!toObj || toObj.markedAsDeleted) 
        return context;
    const toObjtype = toObj.type;
    const toObjtypeview = toObjtype.typeview;
    const toTypeviewData = toObjtypeview.data;
    let toObjviews: akm.cxObjectView[] = [];
    // Find toObj in the modelview if it exists
    const objviews = modelview.findObjectViewsByObject(toObj);
    let toObjview: akm.cxObjectView;
    if (objviews.length == 0) {
        // toObjview is not in the modelview - create it
        // Create an objectview of toObj and then a node
        const id1 = utils.createGuid();
        toObjview = new akm.cxObjectView(id1, toObj.name, toObj, "");
        toObj.addObjectView(toObjview);
        modelview.addObjectView(toObjview);
        myMetis.addObjectView(toObjview);
        const goNode = new gjs.goObjectNode(toObjview.id, goModel, toObjview);
        for (let prop in toTypeviewData) {
            myDiagram.model.setDataProperty(goNode, prop, toTypeviewData[prop]);
        }
        goModel.addNode(goNode);
        myDiagram.model.addNodeData(goNode);
        const gjsNode = myDiagram.findNodeForKey(goNode?.key);
        gjsNode.isSelected = true;
        toObjview = uic.setObjviewAttributes(goNode, myDiagram);

        // The objectview has been created, remember it
        const jsnObjview = new jsn.jsnObjectView(toObjview);
        modifiedObjectViews.push(jsnObjview);

        // Now create a relship view and a link from object to toObj
        const oviewFrom = useinp ? toObjview : objview;
        const oviewTo = useinp ? objview : toObjview;
        const relviews2 = modelview.findRelationshipViewsByRel2(rel, oviewFrom, oviewTo);
        if (!relviews2 || relviews2?.length == 0) {
            const id2 = utils.createGuid();
            const relview = new akm.cxRelationshipView(id2, rel.name, rel, "");
            relview.fromObjview = oviewFrom;
            relview.toObjview = oviewTo;
            rel.addRelationshipView(relview);
            modelview.addRelationshipView(relview);
            myMetis.addRelationshipView(relview);
            const jsnRelView = new jsn.jsnRelshipView(relview);
            modifiedRelshipViews.push(jsnRelView);
            const goLink = new gjs.goRelshipLink(relview.id, goModel, relview);
            goLink.loadLinkContent(goModel);
            goLink.fromNode = getNodeByViewId(oviewFrom.id, myDiagram);
            goLink.from = goLink.fromNode?.key;
            goModel.addLink(goLink);
            myDiagram.model.addLinkData(goLink);
            let pos = { objview: toObjview, x: context.xLevel, y: context.yLevel };
            positions.push(pos);
            context.positions = positions;
        }
    }

    // Then check if there are more relationships from toObj
    let rels: akm.cxRelationship[];
    if (useinp) {
        rels = toObj.inputrels;
        rels = relshipsSortedByTypeNameAndToNames(rels, 'in')
    } else {
        rels = toObj.outputrels;
        rels = relshipsSortedByTypeNameAndToNames(rels, 'out')
    }
    for (let i=0; i<rels?.length; i++) {
        const rel = rels[i];
        context = connectObjects(toObjview, rel, context);
    }
    context.yLevel++;
    return context;
}

export function selectConnectedObjects1(modelview: akm.cxModelView, objview: akm.cxObjectView, 
                                goModel: gjs.goModel, myMetis: akm.cxMetis, noLevels: number, 
                                reltypes: string, reldir: string, viewCollection: akm.cxCollectionOfViews,
                                options: any = {}) {
    if (noLevels < 1)
        return;
    const resolveObject = (obj: akm.cxObject | null | undefined): akm.cxObject | null => {
        const id = obj?.id;
        if (!id)
            return null;
        return myMetis.currentModel?.findObject(id) || myMetis.findObject(id) || obj;
    };
    const resolveRelationship = (rel: akm.cxRelationship | null | undefined): akm.cxRelationship | null => {
        const id = rel?.id;
        if (!id)
            return null;
        return myMetis.currentModel?.findRelationship(id) || myMetis.findRelationship(id) || rel;
    };
    let object: akm.cxObject = objview.object;
    if (!object) object = myMetis.findObject(objview.objectRef);
    if (object)
        object = resolveObject(object);
    if (!objview || !object)
        return;
    const objtype = object.type;
    if (objtype && objtype.isContainer()) {
        objview.viewkind = constants.viewkinds.CONT;
    }
    const allowedRelTypes = (reltypes && reltypes.trim() !== '' && reltypes !== 'All')
        ? reltypes.split(',').map(s => s.trim()).filter(Boolean)
        : [];
    const allowAll = allowedRelTypes.length === 0;
    const normalizedDirection = (reldir || '').toLowerCase();
    const followInput = normalizedDirection !== 'out';
    const followOutput = normalizedDirection !== 'in';
    const firstHopRelIds = new Set<string>(options?.firstHopRelIds || []);
    const createMissingViews = !!options?.createMissingViews;
    const myDiagram = myMetis.myDiagram;
    const rootLoc = (objview.loc || '0 0').split(' ');
    const rootX = parseInt(rootLoc[0]) || 0;
    const rootY = parseInt(rootLoc[1]) || 0;
    const visitedObjectIds = new Set<string>([object.id]);
    let createdCount = 0;
    let frontier: akm.cxObject[] = [object];

    const findVisibleObjview = (obj: akm.cxObject): akm.cxObjectView | null => {
        const objviews = modelview.findObjectViewsByObject(obj);
        return objviews?.length > 0 ? objviews[0] : null;
    };

    const ensureObjectView = (obj: akm.cxObject, level: number, incoming: boolean): akm.cxObjectView | null => {
        let visibleObjview = findVisibleObjview(obj);
        if (visibleObjview || !createMissingViews)
            return visibleObjview;
        const id = utils.createGuid();
        visibleObjview = new akm.cxObjectView(id, obj.name, obj, "");
        obj.addObjectView(visibleObjview);
        modelview.addObjectView(visibleObjview);
        myMetis.addObjectView(visibleObjview);
        const xdir = incoming ? -1 : 1;
        visibleObjview.loc = `${rootX + xdir * 300 * Math.max(1, level + 1)} ${rootY + createdCount * 100}`;
        createdCount++;
        const goNode = new gjs.goObjectNode(visibleObjview.id, goModel, visibleObjview);
        if (myDiagram) {
            myDiagram.startTransaction('SelectConnectedAddNode');
            uic.setObjviewAttributes(goNode, myDiagram);
            goModel.addNode(goNode);
            myDiagram.model.addNodeData(goNode);
            myDiagram.commitTransaction('SelectConnectedAddNode');
        } else {
            goModel.addNode(goNode);
        }
        const jsnObjview = new jsn.jsnObjectView(visibleObjview);
        const data = JSON.parse(JSON.stringify(jsnObjview));
        myDiagram?.dispatch?.({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
        return visibleObjview;
    };

    const ensureRelview = (
        rel: akm.cxRelationship,
        fromObjview: akm.cxObjectView | null,
        toObjview: akm.cxObjectView | null
    ): akm.cxRelationshipView | null => {
        if (!fromObjview || !toObjview)
            return null;
        let relviews = modelview.findRelationshipViewsByRel2(rel, fromObjview, toObjview);
        if (relviews?.length > 0)
            return relviews[0];
        if (!createMissingViews)
            return null;
        const id = utils.createGuid();
        const relview = new akm.cxRelationshipView(id, rel.name, rel, "");
        relview.fromObjview = fromObjview;
        relview.toObjview = toObjview;
        rel.addRelationshipView(relview);
        modelview.addRelationshipView(relview);
        myMetis.addRelationshipView(relview);
        const goLink = new gjs.goRelshipLink(relview.id, goModel, relview);
        goLink.loadLinkContent(goModel);
        if (myDiagram) {
            myDiagram.startTransaction('SelectConnectedAddLink');
            goLink.fromNode = getNodeByViewId(fromObjview.id, myDiagram);
            goLink.from = goLink.fromNode?.key;
            goLink.toNode = getNodeByViewId(toObjview.id, myDiagram);
            goLink.to = goLink.toNode?.key;
            uic.setRelviewAttributes(goLink, myDiagram);
            goModel.addLink(goLink);
            myDiagram.model.addLinkData(goLink);
            myDiagram.commitTransaction('SelectConnectedAddLink');
        } else {
            goModel.addLink(goLink);
        }
        const jsnRelview = new jsn.jsnRelshipView(relview);
        const data = JSON.parse(JSON.stringify(jsnRelview));
        myDiagram?.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data });
        return relview;
    };

    const getRelationshipsForObject = (obj: akm.cxObject) => {
        const modelRelationships = myMetis.currentModel?.relships || myMetis.currentModel?.relationships || [];
        const rels = modelRelationships.length > 0
            ? modelRelationships
            : ([] as akm.cxRelationship[])
                .concat(obj.inputrels || [])
                .concat(obj.outputrels || []);
        const matches: Array<{ rel: akm.cxRelationship; incoming: boolean }> = [];
        const seen = new Set<string>();
        for (let i = 0; i < rels.length; i++) {
            const resolvedRel = resolveRelationship(rels[i]);
            if (!resolvedRel || resolvedRel.markedAsDeleted || seen.has(resolvedRel.id))
                continue;
            seen.add(resolvedRel.id);
            const fromId = resolvedRel.fromObject?.id || resolvedRel.fromobjectRef || resolvedRel.fromObjectRef;
            const toId = resolvedRel.toObject?.id || resolvedRel.toobjectRef || resolvedRel.toObjectRef;
            if (toId === obj.id && followInput)
                matches.push({ rel: resolvedRel, incoming: true });
            if (fromId === obj.id && followOutput)
                matches.push({ rel: resolvedRel, incoming: false });
        }
        return matches;
    };

    for (let level = 0; level < noLevels && frontier.length > 0; level++) {
        const nextFrontier: akm.cxObject[] = [];
        for (let i = 0; i < frontier.length; i++) {
            let currentObject: akm.cxObject = frontier[i];
            if (currentObject) currentObject = resolveObject(currentObject);
            if (!currentObject || currentObject.markedAsDeleted)
                continue;
            const currentObjview = createMissingViews
                ? ensureObjectView(currentObject, Math.max(0, level - 1), false)
                : findVisibleObjview(currentObject);
            const connectedRelationships = getRelationshipsForObject(currentObject);
            for (let j = 0; j < connectedRelationships.length; j++) {
                    const direction = connectedRelationships[j];
                    let rel = direction.rel;
                    if (!rel || rel.markedAsDeleted)
                        continue;
                    if (level === 0 && firstHopRelIds.size > 0) {
                        if (!firstHopRelIds.has(rel.id))
                            continue;
                    } else if (!allowAll) {
                        const relTypeName = rel?.type?.name || rel?.name || rel?.typeName;
                        const relTypeId = rel?.type?.id || rel?.typeRef;
                        if (!allowedRelTypes.includes(relTypeName) && !allowedRelTypes.includes(relTypeId))
                            continue;
                    }
                    const connectedObjRef = direction.incoming
                        ? rel.fromObject as akm.cxObject
                        : rel.toObject as akm.cxObject;
                    const connectedObj = connectedObjRef ? resolveObject(connectedObjRef) : null;
                    if (!connectedObj || connectedObj.markedAsDeleted)
                        continue;
                    const connectedObjview = ensureObjectView(connectedObj, level, direction.incoming);
                    if (connectedObjview)
                        viewCollection.addObjectView(connectedObjview);
                    const fromObjview = direction.incoming ? connectedObjview : currentObjview;
                    const toObjview = direction.incoming ? currentObjview : connectedObjview;
                    const relview = ensureRelview(rel, fromObjview, toObjview);
                    if (relview)
                        viewCollection.addRelshipView(relview);
                    if (!visitedObjectIds.has(connectedObj.id)) {
                        visitedObjectIds.add(connectedObj.id);
                        nextFrontier.push(connectedObj);
                    }
            }
        }
        frontier = nextFrontier;
    }
}

export function addSubModels(object: any, myMetis: akm.cxMetis, myDiagram: any)  {
    // Select model among all models (except the current)
    const args = {
        "object":             object,
        "modelnames":         "", 
    }
    const context = {
        "myDiagram":          myDiagram,
        "myMetis":            myMetis,
        "myCurrentModel":     myMetis.currentModel,
        "myCurrentModelview": myMetis.currentModelview,
        "case":               "Select Submodel to Add",
        "title":              "Select Submodel to Add",
        "dispatch":           myDiagram.dispatch,
        "postOperation":      addSubModel1,
        "args":               args
    }
    addSubModel1(context);
}

function addSubModel1(context: any) {
    // object is a Metamodel object
    const myDiagram = context.myDiagram;
    const myMetis = context.myMetis as akm.cxMetis;
    const myModelView = myMetis.currentModelview;
    const object = context.args.object;
    const myModel: akm.cxModel = context.myCurrentModel;
    let metamodelObject: akm.cxObject = context.args.object;
    metamodelObject = myModel.findObject(metamodelObject.id);  
    const metamodelName = metamodelObject.name;
    const metamodel = myMetis.findMetamodelByName(metamodelName);
    const submodelObjects = getSubModelObjects(object, myMetis);

    if (submodelObjects.length > 0) {
        let modelnames = submodelObjects[0].name;
        for (let i=1; i<submodelObjects.length; i++) {
            const submodelObj = submodelObjects[i];
            modelnames += ", " + submodelObj.name;
        }
        const test = prompt('Accept Generating the Submodel(s)', modelnames);
        if (test) {
            const modifiedModels = new Array();
            const modifiedMetamodels = new Array();
            const submodelObjects = getSubModelObjects(object, myMetis);
            metamodel.submodels = new Array();
            for (let i=0; i<submodelObjects?.length; i++) {
                const submodelObj = submodelObjects[i];
                let submodel = new akm.cxModel(utils.createGuid(), submodelObj.name, metamodel, "");
                metamodel.addSubModel(submodel);
                myMetis.addSubModel(submodel);                
                // Add submodel contents
                let submodelView: akm.cxObjectView = null;
                const objectviews = myModelView.objectviews;
                for (let j=0; j<objectviews.length; j++) {
                    const objview = objectviews[j];
                    let object: akm.cxObject = objview.object;
                    if (!object) object = myMetis.findObject(objview.objectRef);
                    if (object?.name === submodelObj?.name) {
                        submodelView = objview;
                        break;
                    }
                }
                if (submodelView) {
                    for (let j=0; j<objectviews.length; j++) {
                        const objview = objectviews[j];
                        let object: akm.cxObject = objview.object;
                        if (!object) object = myMetis.findObject(objview.objectRef);
                        if (object?.name === submodelObj?.name) {
                            if (object?.name === submodelObj?.name) 
                            continue;
                        }
                        if (object && objview.group === submodelView?.id) {
                            submodel.addObject(object);
                        }
                    }
                    const jsnModel = new jsn.jsnModel(submodel, true);
                    modifiedModels.push(jsnModel);
                    const jsnMetamodel = new jsn.jsnMetaModel(metamodel, true);
                    modifiedMetamodels.push(jsnMetamodel);
                }               
            }
            modifiedMetamodels.map(mn => {
                let data = mn;
                data = JSON.parse(JSON.stringify(data));
                myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data });
            });
        }
    }
}

export function getSubModelObjects(object: akm.cxObject, myMetis: akm.cxMetis): akm.cxModel[] {
    const submodelObjects: akm.cxModel[] = new Array();
    // Follow relships to find the model object
    const fromType = myMetis.findObjectTypeByName(constants.types.AKM_METAMODEL);
    const toType = myMetis.findObjectTypeByName(constants.types.AKM_MODEL);
    const hasSubtype = myMetis.findRelationshipTypeByName1(constants.types.AKM_HAS_SUBMODEL, fromType, toType);
    const relships = object.getOutputRelshipsByType(hasSubtype);
    for (let i=0; i<relships?.length; i++) {
        const rel = relships[i];
        const toObject = rel.toObject;
        submodelObjects.push(toObject);
    }
    return submodelObjects;
}
function addConnectedSubModelObjects(object: akm.cxObject, myMetis: akm.cxMetis): akm.cxModel[] {
    const models: akm.cxModel[] = new Array();
    const metamodel = myMetis.findMetamodelByName('AKM-IRTV_META');
    const modifiedModels = new Array();
    const modifiedMetamodels = new Array();
    for (let i=0; i<submodelObjects.length; i++) {
        const submodelObj = submodelObjects[i];
        let submodel = myMetis.findModelByName(submodelObj?.name);
        if (!submodel) {
            submodel = new akm.cxModel(utils.createGuid(), submodelObj.name, metamodel, "");
            const jsnModel = new jsn.jsnModel(submodel, true);
            modifiedModels.push(jsnModel);
            metamodel.addSubModel(submodel);
            const jsnMetamodel = new jsn.jsnMetaModel(metamodel, true);
            modifiedMetamodels.push(jsnMetamodel);
        }
        models.push(submodel);
    }
    const myDiagram = myMetis.myDiagram;
    modifiedMetamodels.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data });
    });
    modifiedModels.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data });
    });
    return models;
}

export function setGroupLayoutParameters(groupLayout: string): go.Layout {
    let layout: go.Layout = null;
    
    switch (groupLayout) {
        case 'Tree':
        case 'TreeLayout':
            layout = new go.TreeLayout({ 
                isOngoing: false,
                treeStyle: go.TreeLayout.StyleRootOnly,
                angle: 0,
                layerSpacing: 100,
                nodeSpacing: 50,
                setsPortSpot: false,
                setsChildPortSpot: false,
                alternateSetsPortSpot: false,
                alternateSetsChildPortSpot: false,
                sorting: go.TreeLayout.SortingAscending,
                alternateSorting: go.TreeLayout.SortingDescending,
                arrangement: go.TreeLayout.ArrangementFixedRoots,        
                alignment: go.TreeLayout.AlignmentStart,
            });
            break;
            
        case 'ForceDirected':
        case 'ForceDirectedLayout':
            layout = new go.ForceDirectedLayout({
                isOngoing: false,
                defaultSpringLength: 30,
                defaultSpringStiffness: 0.05,
                defaultElectricalCharge: 100,
                defaultGravitationalMass: 100,
            });
            break;
            
        case 'Circular':
        case 'CircularLayout':
            layout = new go.CircularLayout({
                isOngoing: false,
                radius: NaN,
                spacing: 10,
                startAngle: 1.0,
                sweepAngle: 360,
                arrangement: go.CircularLayout.ConstantSpacing,
                // sorting: go.CircularLayout.Ascending,
                direction: go.CircularLayout.Clockwise,
            });
            break;
            
        case 'LaneLayout':
        case 'LaneFlow':
        case 'LaneFlowLayout':
        case 'LayeredDigraph':
        case 'LayeredDigraphLayout':
            layout = new go.LayeredDigraphLayout({
                isOngoing: false,
                isInitial: false,
                direction: 0,  // 0 = left-to-right (horizontal), 90 = top-to-bottom (vertical)
                layerSpacing: 80,
                columnSpacing: 40,
                setsPortSpots: true,
                cycleRemoveOption: go.LayeredDigraphLayout.CycleDepthFirst,
                initializeOption: go.LayeredDigraphLayout.InitDepthFirstOut,
                aggressiveOption: go.LayeredDigraphLayout.AggressiveLess,
                packOption: go.LayeredDigraphLayout.PackStraighten,
                layeringOption: go.LayeredDigraphLayout.LayerOptimalLinkLength,
            });
            break;
            
        // case 'ParallelLayout':
        //     layout = new go.ParallelLayout({
        //         isOngoing: false,
        //         angle: 0,
        //         layerSpacing: 100,
        //         nodeSpacing: 50,
        //     });
        //     break;
            
        case 'Grid':
        case 'GridLayout':
            layout = new go.GridLayout({ 
                isOngoing: false,
                wrappingColumn: 1,
                spacing: new go.Size(35, 35),
                alignment: go.GridLayout.Position,
                comparer: function(a, b) {
                    const ax = a.location.x;
                    const bx = b.location.x;
                    const ay = a.location.y;
                    const by = b.location.y;
                    if (ax < bx) return -1;
                    if (ax > bx) return 1;
                    if (ay < by) return -1;
                    if (ay > by) return 1;
                    return 0;
                }
            });
            break;
            
        default:
            // Default to GridLayout if unknown layout type
            layout = new go.GridLayout({ 
                isOngoing: false,
                wrappingColumn: 1,
                spacing: new go.Size(35, 35),
            });
            break;
    }
    
    return layout;
}  

export function doGroupLayout(myGroup: akm.cxObjectView, myDiagram: any, myMetis: akm.cxMetis) {
    const lay = setGroupLayoutParameters(myGroup.groupLayout);
    const myModelview = myMetis.currentModelview || myDiagram.myModelView;
    if (!myModelview) {
        return;
    }

    // Find the GoJS group node
    const groupNode = myDiagram.findNodeForKey(myGroup.id);
    if (!groupNode) {
        console.error('Group node not found');
        return;
    }

    const isLaneGroup =
        groupNode?.category === 'Lane' ||
        groupNode?.category === 'Lane_w_handles' ||
        groupNode?.data?.category === 'Lane' ||
        groupNode?.data?.template === 'Lane' ||
        groupNode?.data?.template === 'Lane_w_handles' ||
        ((groupNode?.containingGroup instanceof go.Group) &&
            (myGroup?.groupLayout === 'LaneLayout' || myGroup?.groupLayout === 'LayeredDigraph' || myGroup?.groupLayout === 'LayeredDigraphLayout'));
    let hasLaneMembers = false;
    groupNode.memberParts.each((part: go.Part) => {
        if (hasLaneMembers) return;
        if (!(part instanceof go.Group)) return;
        const isLanePart =
            part?.category === 'Lane' ||
            part?.category === 'Lane_w_handles' ||
            part?.data?.category === 'Lane' ||
            part?.data?.template === 'Lane' ||
            part?.data?.template === 'Lane_w_handles';
        if (isLanePart) hasLaneMembers = true;
    });
    const isPoolGroup =
        groupNode?.category === 'Pool' ||
        groupNode?.data?.category === 'Pool' ||
        groupNode?.data?.template === 'Pool' ||
        myGroup?.groupLayout === 'PoolLayout' ||
        hasLaneMembers;
    const layoutMode = isPoolGroup ? "pool_structure" : (isLaneGroup ? "lane_content" : "group_content");
    
    myDiagram.startTransaction('doGroupLayout');
    // Keep pool and lane layout responsibilities separate:
    // pool_structure = stack/size lanes only, lane_content = layout only selected lane members.
    if (layoutMode === "pool_structure") {
        try {
        const detectPoolLeftHeaderReserve = (group: go.Group | null | undefined): number => {
            if (!(group instanceof go.Group)) return 34;
            try {
                const poolHeader = group.findObject("POOL_HEADER_STRIP");
                const poolHeaderWidth = poolHeader?.actualBounds?.width;
                if (typeof poolHeaderWidth === "number" && Number.isFinite(poolHeaderWidth) && poolHeaderWidth > 0) {
                    return poolHeaderWidth;
                }
            } catch (_) {
            }
            let maxWidth = 0;
            const candidateNames = [
                'POOL_HEADER_STRIP',
                'LEFT_HEADER',
                'leftHeader',
                'poolLeftHeader',
                'leftLabel',
                'HEADER_LEFT',
                'poolHeaderLeft',
                'POOL_LEFT_HEADER',
                'poolLeftLabel',
                'leftHeaderPanel',
            ];
            candidateNames.forEach((name) => {
                try {
                    const obj = group.findObject(name);
                    const bounds = obj?.actualBounds;
                    if (bounds?.width) maxWidth = Math.max(maxWidth, bounds.width);
                } catch (_) {
                }
            });
            const d: any = group.data;
            const dataWidth = [d?.leftHeaderWidth, d?.headerWidth, d?.poolHeaderWidth]
                .find((value) => typeof value === 'number' && !Number.isNaN(value)) || 0;
            return Math.max(maxWidth, dataWidth, 34);
        };

        const structuralGroups: Array<{ group: go.Group; kind: 'lane' | 'pool' }> = [];
        groupNode.memberParts.each((part: go.Part) => {
            if (!(part instanceof go.Group)) return;
            const isLanePart =
                part?.category === 'Lane' ||
                part?.category === 'Lane_w_handles' ||
                part?.data?.category === 'Lane' ||
                part?.data?.template === 'Lane' ||
                part?.data?.template === 'Lane_w_handles';
            if (isLanePart) {
                structuralGroups.push({ group: part, kind: 'lane' });
                return;
            }
            const isPoolPart =
                part?.category === 'Pool' ||
                part?.data?.category === 'Pool' ||
                part?.data?.template === 'Pool';
            if (isPoolPart) structuralGroups.push({ group: part, kind: 'pool' });
        });
        if (!structuralGroups.length) {
            myDiagram.commitTransaction('doGroupLayout');
            return;
        }

        structuralGroups.sort((a, b) => {
            const ay = typeof a.group.location?.y === 'number' ? a.group.location.y : a.group.actualBounds.y;
            const by = typeof b.group.location?.y === 'number' ? b.group.location.y : b.group.actualBounds.y;
            if (ay !== by) return ay - by;
            const ai = (a.group?.data && typeof a.group.data.laneIndex === 'number') ? a.group.data.laneIndex : NaN;
            const bi = (b.group?.data && typeof b.group.data.laneIndex === 'number') ? b.group.data.laneIndex : NaN;
            if (!isNaN(ai) && !isNaN(bi) && ai !== bi) return ai - bi;
            return 0;
        });

        const poolLocation = groupNode.location?.copy() || new go.Point(0, 0);
        const forcedPoolSizes = (myDiagram as any).__forcedPoolLayoutSizes || {};
        const forcedPoolSize = forcedPoolSizes[String(groupNode.data?.key || myGroup?.id || "")] || null;
        const isNestedInPool =
            groupNode.containingGroup instanceof go.Group &&
            (groupNode.containingGroup.category === 'Pool' ||
                groupNode.containingGroup.data?.category === 'Pool' ||
                groupNode.containingGroup.data?.template === 'Pool');
        const effectiveForcedPoolSize = isNestedInPool ? null : forcedPoolSize;
        const poolSize = groupNode.data?.size ? go.Size.parse(String(groupNode.data.size)) : null;
        const poolResizeObject = groupNode.resizeObject || groupNode.placeholder || null;
        const poolLeftReserve = detectPoolLeftHeaderReserve(groupNode);
        const poolContentPanel = groupNode.findObject("POOL_CONTENT_PANEL") as go.GraphObject | null;
        const poolContentAnchor = groupNode.findObject("POOL_CONTENT_ANCHOR") as go.GraphObject | null;
        const lanePaddingLeft = 0;
        const lanePaddingRight = 0;
        const laneBodyPanelRightMargin = 0;
        const laneBodyPanelBottomMargin = 0;
        const poolContentRightPadding = 0;
        const poolContentBottomPadding = 0;
        const laneRightVisualInset = laneBodyPanelRightMargin + poolContentRightPadding;
        const laneTopMargin = 0;
        const laneBottomMargin = laneBodyPanelBottomMargin + poolContentBottomPadding;
        const laneSpacing = POOL_LANE_GAP;
        const minLaneWidth = 120;
        const minPoolWidth = poolLeftReserve + lanePaddingLeft + minLaneWidth + lanePaddingRight + laneRightVisualInset;
        
        // First pass: measure actual lane widths to determine required pool width
        let maxRequiredLaneBodyWidth = minLaneWidth;
        const laneSizes: number[] = [];
        structuralGroups.forEach(({ group, kind }) => {
            if (kind === 'lane') {
                // Get lane's actual required width from its data.size ONLY
                // Don't measure from actualBounds to avoid feedback loops
                const laneSize = group.data?.size ? go.Size.parse(String(group.data.size)) : null;
                let laneBodyWidth = minLaneWidth;
                
                if (laneSize && laneSize.width > 0 && Number.isFinite(laneSize.width)) {
                    laneBodyWidth = laneSize.width;
                    laneSizes.push(laneBodyWidth);
                }
                
                maxRequiredLaneBodyWidth = Math.max(maxRequiredLaneBodyWidth, laneBodyWidth);
                console.log(`Pool layout: lane ${group.data?.key}, body width from data=${laneBodyWidth}`);
            }
        });
        
        // Check if all lanes already have the same width
        const allLanesSameWidth = laneSizes.length > 0 && laneSizes.every(w => Math.abs(w - laneSizes[0]) < 0.1);
        
        // Calculate pool width from lane requirements
        // Pool width = max lane body width + lane header + pool header + margins
        const standardLaneHeaderWidth = 36;
        const requiredPoolWidth = maxRequiredLaneBodyWidth + standardLaneHeaderWidth + poolLeftReserve + lanePaddingLeft + lanePaddingRight + laneRightVisualInset;
        
        console.log(`Pool layout: max lane body=${maxRequiredLaneBodyWidth}, all same width=${allLanesSameWidth}`);
        console.log(`Pool layout: required pool width=${requiredPoolWidth}, current pool=${poolSize?.width || 0}`);
        
        // Use the measured requirement, or preserve current pool width if lanes are already uniform
        let poolWidth = requiredPoolWidth;
        if (allLanesSameWidth && poolSize && poolSize.width > 0 && Math.abs(poolSize.width - requiredPoolWidth) < 1) {
            // Preserve current pool width if it matches lane sizes (within 1px tolerance)
            poolWidth = poolSize.width;
            console.log(`Pool layout: preserving current pool width=${poolWidth}`);
        } else {
            poolWidth = Math.max(requiredPoolWidth, minPoolWidth);
            console.log(`Pool layout: setting new pool width=${poolWidth}`);
        }
        
        // Calculate lane width from pool width
        const laneWidth = Math.max(
            poolWidth - poolLeftReserve - lanePaddingLeft - lanePaddingRight - laneRightVisualInset,
            minLaneWidth
        );

        let currentY = poolLocation.y + laneTopMargin;
        const laneLayouts: Array<{ group: go.Group; kind: 'lane' | 'pool'; height: number; resizeObject: any }> = [];
        const nestedPoolsToRelayout: go.Group[] = [];
        structuralGroups.forEach(({ group, kind }) => {
            const laneSize = group.data?.size ? go.Size.parse(String(group.data.size)) : null;
            const resizeObject = group.resizeObject || group.placeholder || group;
            const laneBounds = group.actualBounds?.copy();
            const laneHeight =
                (typeof laneSize?.height === 'number' && Number.isFinite(laneSize.height) && laneSize.height > 0)
                    ? laneSize.height
                    : Math.max(
                        resizeObject?.desiredSize?.height || 0,
                        laneBounds?.height || 0,
                        260
                    );
            laneLayouts.push({ group, kind, height: laneHeight, resizeObject });
        });

        const finalPoolWidth = poolWidth;
        const finalLaneWidth = Math.max(finalPoolWidth - poolLeftReserve - lanePaddingLeft - lanePaddingRight - laneRightVisualInset, minLaneWidth);
        const finalStructuralRowWidth = Math.max(finalLaneWidth, minLaneWidth);

        laneLayouts.forEach((layout, idx) => {
            const lane = layout.group;
            const laneHeight = layout.height || 260;
            const resizeObject = layout.resizeObject || null;
            const isLaneGroup = layout.kind === 'lane';
            const oldBodyBounds = isLaneGroup ? getLaneBodyBounds(lane) : null;
            const memberSnapshots = new Map<string, { loc: go.Point; bounds: go.Rect; wasInBody: boolean }>();
            if (isLaneGroup) {
                lane.memberParts.each((part: go.Part) => {
                    if (!(part instanceof go.Node) || part instanceof go.Group) return;
                    const key = String(part.data?.key || part.key || "");
                    if (!key) return;
                    const bounds = part.actualBounds.copy();
                    memberSnapshots.set(key, {
                        loc: part.location.copy(),
                        bounds,
                        wasInBody: oldBodyBounds ? rectContainsPart(oldBodyBounds, bounds) : true,
                    });
                });
            }
            const laneHeader = isLaneGroup ? lane.findObject("LANE_HEADER_STRIP") as go.GraphObject | null : null;
            const laneHeaderWidth =
                (isLaneGroup && typeof laneHeader?.actualBounds?.width === 'number' && Number.isFinite(laneHeader.actualBounds.width) && laneHeader.actualBounds.width > 0)
                    ? laneHeader.actualBounds.width
                    : 36;
            const rowWidth = finalStructuralRowWidth;
            const laneBodyWidth = isLaneGroup ? Math.max(20, rowWidth - laneHeaderWidth) : rowWidth;
            const laneMain = lane.findObject("LANE_MAIN") as go.GraphObject | null;
            const laneBodyPanel = lane.findObject("BODY") as go.GraphObject | null;
            const laneBody = lane.findObject("LANE_BODY_SHAPE") as go.GraphObject | null;
            const laneMainShape = lane.findObject("LANE_MAIN_SHAPE") as go.GraphObject | null;
            const childPoolShape = !isLaneGroup ? lane.findObject("POOL_SHAPE") as go.GraphObject | null : null;
            const lanePoint = new go.Point(poolLocation.x + poolLeftReserve + lanePaddingLeft, currentY);
            lane.location = lanePoint;
            if (lane.data) {
                myDiagram.model.setDataProperty(lane.data, "loc", go.Point.stringify(lanePoint));
                // Store dimensions for reference (height binding reads from this)
                myDiagram.model.setDataProperty(lane.data, "size", `${laneBodyWidth} ${laneHeight}`);
                if (groupNode.data?.key && lane.data?.group !== groupNode.data.key) {
                    myDiagram.model.setGroupKeyForNodeData(lane.data, groupNode.data.key);
                }
                if (lane.data.laneIndex !== idx) {
                    myDiagram.model.setDataProperty(lane.data, "laneIndex", idx);
                }
            }
            // Let GROUP desiredSize binding handle sizing from data.size
            // Manual sizing here conflicts with the binding and causes lanes to extend beyond pool
            // Don't manually size laneBodyPanel or laneBody - let stretch properties handle it
            // The GROUP desiredSize binding and Table column stretch will size them correctly
            if (!isLaneGroup && childPoolShape) {
                (childPoolShape as any).desiredSize = new go.Size(rowWidth, laneHeight);
                (childPoolShape as any).width = rowWidth;
                (childPoolShape as any).height = laneHeight;
                nestedPoolsToRelayout.push(lane);
            }
            // Don't manually set lane.desiredSize - let the GROUP binding handle it from data.size
            const laneView = myModelview.findObjectView(lane.data?.key);
            if (laneView) {
                laneView.loc = go.Point.stringify(lanePoint);
                laneView.group = groupNode.data?.key || laneView.group;
                // Store dimensions for reference
                laneView.size = `${laneBodyWidth} ${laneHeight}`;
                const data = JSON.parse(JSON.stringify(new jsn.jsnObjectView(laneView)));
                myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
            }
            currentY += laneHeight;
            // Add spacing between lanes (includes room for the bottom border separator)
            if (idx < laneLayouts.length - 1) currentY += laneSpacing + LANE_BORDER_HEIGHT;
        });

        const totalHeight = (currentY - poolLocation.y) + laneBottomMargin;
        const finalPoolSize = new go.Size(finalPoolWidth, Math.max(totalHeight, 80));
        
        console.log(`Pool layout complete: pool width=${finalPoolWidth}, pool height=${totalHeight}, lane count=${laneLayouts.length}`);
        
        if (poolResizeObject) {
            poolResizeObject.desiredSize = finalPoolSize;
        }
        try {
            groupNode.desiredSize = finalPoolSize;
        } catch (_) {
        }
        if (groupNode.data) {
            myDiagram.model.setDataProperty(groupNode.data, "size", go.Size.stringify(finalPoolSize));
        }
        myGroup.size = go.Size.stringify(finalPoolSize);
        const persistedPoolData = JSON.parse(JSON.stringify(new jsn.jsnObjectView(myGroup)));
        myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: persistedPoolData });
        nestedPoolsToRelayout.forEach((nestedPool) => {
            const nestedOv = myModelview.findObjectView(nestedPool.data?.key);
            if (nestedOv?.isGroup) {
                doGroupLayout(nestedOv, myDiagram, myMetis);
            }
        });
        myDiagram.commitTransaction('doGroupLayout');
        return;
        } catch (err) {
            try {
                myDiagram.rollbackTransaction();
            } catch (_) {
            }
            throw err;
        }
    }

    if (layoutMode === "lane_content") {
        const body = groupNode.findObject("BODY");
        const bounds = body ? body.actualBounds : groupNode.actualBounds;
        (lay as any).arrangementOrigin = new go.Point(
            bounds.x + LANE_LAYOUT_LEFT_INSET,
            bounds.y + LANE_LAYOUT_TOP_INSET
        );
    }
    // For LayeredDigraphLayout, find and anchor the first/root node
    let firstNode: go.Node = null;
    let originalPos: go.Point = null;
    
    if (lay instanceof go.LayeredDigraphLayout) {
        let minY = Infinity;
        
        // Find the topmost node
        groupNode.memberParts.each((part: go.Part) => {
            if (part instanceof go.Node) {
                const node = part as go.Node;
                if (node.location.y < minY) {
                    minY = node.location.y;
                    firstNode = node;
                }
            }
        });
        
        // Store the original position of the first node
        originalPos = (firstNode !== null) ? firstNode.location.copy() : null;
    }

    const laneMemberNodes = new go.Set<go.Node>();
    const laneMemberKeys = new Set<string>();
    const layoutMemberKeys = new Set<string>();
    if (layoutMode === "lane_content") {
        groupNode.memberParts.each((part: go.Part) => {
            if (part instanceof go.Node && !(part instanceof go.Group)) {
                laneMemberNodes.add(part);
                if (part.data?.key) laneMemberKeys.add(part.data.key);
            }
        });
    }
    groupNode.memberParts.each((part: go.Part) => {
        if (part instanceof go.Node && part.data?.key) {
            layoutMemberKeys.add(String(part.data.key));
        }
    });

    const modifiedRelshipViews: jsn.jsnRelshipView[] = [];
    const shouldResetLinkForLayout = (link: go.Link): boolean => {
        if (!(link instanceof go.Link)) return false;
        const data = link.data;
        if (!data || data.category !== constants.gojs.C_RELATIONSHIP) return false;
        const fromKey = String(link.fromNode?.data?.key || data.from || "");
        const toKey = String(link.toNode?.data?.key || data.to || "");
        if (layoutMode === "lane_content") {
            return laneMemberKeys.has(fromKey) && laneMemberKeys.has(toKey);
        }
        return layoutMemberKeys.has(fromKey) || layoutMemberKeys.has(toKey);
    };

    myDiagram.links.each((link: go.Link) => {
        if (!shouldResetLinkForLayout(link)) return;
        const data = link.data;
        const relview =
            myModelview.findRelationshipView(data?.relviewRef || data?.key) ||
            data?.relshipview;
        if (!relview) return;
        const fromObjview = relview.fromObjview;
        const toObjview = relview.toObjview;
        try { link.points = new go.List<go.Point>(); } catch (_) { }
        try { myDiagram.model.setDataProperty(data, "points", []); } catch (_) { data.points = []; }
        relview.points = [];
        relview.fromObjview = fromObjview;
        relview.toObjview = toObjview;
        try {
            const goLink = myMetis.gojsModel?.findLink?.(data?.key);
            if (goLink) {
                goLink.points = [];
                if (goLink.data) goLink.data.points = [];
            }
        } catch (_) {
        }
        modifiedRelshipViews.push(new jsn.jsnRelshipView(relview));
    });
    
    // Assign the layout to the group
    groupNode.layout = lay;
    if (layoutMode === "lane_content" && groupNode.layout instanceof go.LayeredDigraphLayout) {
        groupNode.layout.isOngoing = false;
        groupNode.layout.isInitial = false;
    }
    groupNode.invalidateLayout();
    if (layoutMode === "lane_content" && groupNode.layout !== null) {
        // Keep lane "Do Layout" scoped to the selected lane only.
        groupNode.layout.isValidLayout = false;
        groupNode.layout.doLayout(groupNode.memberParts);
    } else {
        myDiagram.layoutDiagram(true);
    }

    const isLaneFlowLayout =
        layoutMode === "lane_content" &&
        (myGroup?.groupLayout === "LaneFlow" || myGroup?.groupLayout === "LaneFlowLayout");
    if (isLaneFlowLayout && laneMemberNodes.count > 0) {
        const laneBody =
            groupNode.findObject("LANE_SHAPE") ||
            groupNode.findObject("LANE_BODY_SHAPE") ||
            groupNode.findObject("BODY");
        const bodyBounds = (laneBody?.actualBounds || groupNode.actualBounds).copy();
        const horizontalInset = 24;
        const verticalInset = 20;
        const innerLeft = bodyBounds.left + horizontalInset;
        const innerRight = Math.max(innerLeft, bodyBounds.right - horizontalInset);
        const innerTop = bodyBounds.top + verticalInset;
        const innerBottom = Math.max(innerTop, bodyBounds.bottom - verticalInset);
        const inDegree = new Map<string, number>();
        const outDegree = new Map<string, number>();
        const nodes: go.Node[] = [];

        laneMemberNodes.each((node: go.Node) => {
            const key = String(node.data?.key || node.key || "");
            if (!key) return;
            nodes.push(node);
            inDegree.set(key, 0);
            outDegree.set(key, 0);
        });
        myDiagram.links.each((link: go.Link) => {
            const fromKey = String(link.fromNode?.data?.key || link.data?.from || "");
            const toKey = String(link.toNode?.data?.key || link.data?.to || "");
            if (!laneMemberKeys.has(fromKey) || !laneMemberKeys.has(toKey)) return;
            outDegree.set(fromKey, (outDegree.get(fromKey) || 0) + 1);
            inDegree.set(toKey, (inDegree.get(toKey) || 0) + 1);
        });

        const looksLikeMarker = (node: go.Node, marker: "start" | "end") => {
            const data: any = node.data || {};
            const candidates = [
                data.name,
                data.template,
                data.category,
                data.typeName,
                data.viewkind,
                data.object?.name,
                data.object?.type?.name,
                data.objecttype?.name,
                data.objtype?.name,
            ];
            return candidates.some((value) =>
                typeof value === "string" && value.toLowerCase().includes(marker)
            );
        };
        const explicitStarts = nodes.filter((node) => looksLikeMarker(node, "start"));
        const explicitEnds = nodes.filter((node) => looksLikeMarker(node, "end"));
        const startKeys = new Set(
            (explicitStarts.length > 0
                ? explicitStarts
                : nodes.filter((node) => (inDegree.get(String(node.data?.key || node.key || "")) || 0) === 0)
            ).map((node) => String(node.data?.key || node.key || ""))
        );
        const endKeys = new Set(
            (explicitEnds.length > 0
                ? explicitEnds
                : nodes.filter((node) => (outDegree.get(String(node.data?.key || node.key || "")) || 0) === 0)
            ).map((node) => String(node.data?.key || node.key || ""))
        );
        const naturalCenters = nodes.map((node) => node.actualBounds.centerX);
        const naturalLeft = Math.min(...naturalCenters);
        const naturalRight = Math.max(...naturalCenters);
        const naturalSpan = Math.max(1, naturalRight - naturalLeft);

        nodes.forEach((node) => {
            const key = String(node.data?.key || node.key || "");
            const bounds = node.actualBounds.copy();
            let targetLeft: number;
            if (startKeys.has(key) && !endKeys.has(key)) {
                targetLeft = innerLeft;
            } else if (endKeys.has(key) && !startKeys.has(key)) {
                targetLeft = innerRight - bounds.width;
            } else {
                const ratio = (bounds.centerX - naturalLeft) / naturalSpan;
                targetLeft = innerLeft + ratio * Math.max(0, innerRight - innerLeft - bounds.width);
            }
            node.move(new go.Point(targetLeft, bounds.top));
        });

        let contentBounds: go.Rect | null = null;
        nodes.forEach((node) => {
            const bounds = node.actualBounds;
            contentBounds = contentBounds ? contentBounds.unionRect(bounds) : bounds.copy();
        });
        if (contentBounds) {
            // Lane Flow is a left-to-right process layout. Anchor its content at the
            // top of the lane body rather than vertically centering it in the lane.
            const targetTop = innerTop;
            const offsetY = targetTop - contentBounds.top;
            if (Math.abs(offsetY) > 0.01) {
                nodes.forEach((node) => {
                    node.move(new go.Point(node.actualBounds.left, node.actualBounds.top + offsetY));
                });
            }
        }
    }
    // Calculate offset for LayeredDigraphLayout
    if (lay instanceof go.LayeredDigraphLayout && firstNode && originalPos !== null) {
        const newPos = firstNode.location;
        const offsetX = originalPos.x - newPos.x;
        const offsetY = originalPos.y - newPos.y;
        
        // Move all nodes by the offset
        // groupNode.memberParts.each((part: go.Part) => {
        //     if (part instanceof go.Node) {
        //         const node = part as go.Node;
        //         node.location = new go.Point(
        //             node.location.x + offsetX,
        //             node.location.y + offsetY
        //         );
        //     }
        // });
    }
    
    // **FIX: Update diagram again to get accurate bounds**
    myDiagram.updateAllTargetBindings();

    modifiedRelshipViews.forEach((mn) => {
        let data: any = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch?.({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data });
    });

    // Ensure nodes are within group bounds
    const padding = GROUP_LAYOUT_PADDING;
    const placeholder = groupNode.findObject("PLACEHOLDER");
    const groupBounds = placeholder ? placeholder.actualBounds : groupNode.actualBounds;
    const targetLeft = layoutMode === "lane_content"
        ? groupNode.actualBounds.left + LANE_LAYOUT_LEFT_INSET
        : groupBounds.left + padding;
    const targetTop = layoutMode === "lane_content"
        ? groupNode.actualBounds.top + LANE_LAYOUT_TOP_INSET
        : groupBounds.top + padding;
    
	    // Calculate the bounds of all member nodes
	    // Avoid Rect.unionRect on potentially frozen/shared Rects; compute bounds manually.
	    let memberBounds: go.Rect | null = null;
	    groupNode.memberParts.each((part: go.Part) => {
	        if (part instanceof go.Node) {
	            const node = part as go.Node;
	            const b = node.actualBounds;
	            if (!memberBounds) {
	                memberBounds = new go.Rect(b.x, b.y, b.width, b.height);
	            } else {
	                const x1 = Math.min(memberBounds.x, b.x);
	                const y1 = Math.min(memberBounds.y, b.y);
	                const x2 = Math.max(memberBounds.right, b.right);
	                const y2 = Math.max(memberBounds.bottom, b.bottom);
	                memberBounds = new go.Rect(x1, y1, x2 - x1, y2 - y1);
	            }
	        }
	    });
	    if (!memberBounds) memberBounds = new go.Rect();
    
    // Calculate adjustments needed to fit within group
    let adjustX = 0;
    let adjustY = 0;
    
    const availableWidth = groupBounds.width - (2 * padding);
    const availableHeight = groupBounds.height - (2 * padding);
    
    if (memberBounds.width > availableWidth) {
        console.warn('Member nodes are wider than group - consider resizing group');
    }
    
    // Adjust X position
    if (memberBounds.left < targetLeft) {
        adjustX = targetLeft - memberBounds.left;
    } else if (memberBounds.right > groupBounds.right - padding) {
        adjustX = (groupBounds.right - padding) - memberBounds.right;
    }
    
    if (memberBounds.top < targetTop) {
        adjustY = targetTop - memberBounds.top;
    } else if (memberBounds.bottom > groupBounds.bottom - padding) {
        adjustY = (groupBounds.bottom - padding) - memberBounds.bottom;
    }
    
    // Apply adjustments if needed
    if (adjustX !== 0 || adjustY !== 0) {
        groupNode.memberParts.each((part: go.Part) => {
            if (part instanceof go.Node) {
                const node = part as go.Node;
                const newLoc = new go.Point(
                    node.location.x + adjustX,
                    node.location.y + adjustY
                );
                node.location = newLoc;
                myDiagram.model.setDataProperty(node.data, "loc", 
                    newLoc.x + " " + newLoc.y);
            }
        });
    }
    
    // **FIX: Collect member node keys for filtering links**
    const memberNodeKeys = new Set<string>();
    groupNode.memberParts.each((part: go.Part) => {
        if (part instanceof go.Node) {
            memberNodeKeys.add(part.data.key);
        }
    });
    if (layoutMode === "lane_content") {
        memberNodeKeys.clear();
        laneMemberKeys.forEach((k) => memberNodeKeys.add(k));
    }
    
    // Update all member objectviews
    const modifiedObjectViews = [];
    const nodeParts = layoutMode === "lane_content" ? laneMemberNodes : groupNode.memberParts;
    nodeParts.each((part: go.Part) => {
        if (part instanceof go.Node) {
            const node = part as go.Node;
            const objview = myModelview.findObjectView(node.data.key);
            if (objview) {
                const loc = node.location.x + " " + node.location.y;
                objview.loc = loc;
                const jsnObjview = new jsn.jsnObjectView(objview);
                modifiedObjectViews.push(jsnObjview);
            }
        }
    });
    
    // Dispatch objectview updates
    modifiedObjectViews.forEach(ov => {
        let data = JSON.parse(JSON.stringify(ov));
        myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
    });
    
    // **FIX: Update only links that connect to group members - use relviewRef**
    const modifiedRelationshipViews = [];
    myDiagram.links.each((link: go.Link) => {
        const fromKey = link.data.from;
        const toKey = link.data.to;
        
        // Only update links where at least one end connects to a group member
        if (memberNodeKeys.has(fromKey) || memberNodeKeys.has(toKey)) {
            // **KEY FIX: Use relviewRef instead of key**
            const relviewRef = link.data.relviewRef;
            if (!relviewRef) {
                console.warn('Link has no relviewRef:', link.data);
                return;
            }
            
            const relview = myModelview.findRelationshipView(relviewRef);
            if (relview) {
                try { link.fromNode?.invalidateConnectedLinks(); } catch (_) {}
                try { link.toNode?.invalidateConnectedLinks(); } catch (_) {}
                try { link.invalidateRoute(); } catch (_) {}
                try { link.updateRoute(); } catch (_) {}
                try { link.updateTargetBindings(); } catch (_) {}

                const liveRouting = link.data?.routing || relview?.routing || "";
                const livePoints: number[] = [];
                try {
                    link.points.each((pt: go.Point) => {
                        livePoints.push(pt.x, pt.y);
                    });
                } catch (_) {
                }

                // For default-routed Orthogonal/AvoidsNodes links we should not persist
                // the auto-generated route as an explicit manual path.
                const persistPoints = shouldPersistLinkPoints(liveRouting, link.data?.points);
                if (persistPoints) {
                    relview.points = livePoints;
                    try { myDiagram.model.setDataProperty(link.data, "points", livePoints); } catch (_) {
                        link.data.points = livePoints;
                    }
                } else {
                    relview.points = [];
                    try { myDiagram.model.setDataProperty(link.data, "points", []); } catch (_) {
                        link.data.points = [];
                    }
                }

                const jsnRelView = new jsn.jsnRelshipView(relview);
                modifiedRelationshipViews.push(jsnRelView);
            } else {
                console.warn('RelationshipView not found for relviewRef:', relviewRef);
            }
        }
    });
    
    // **FIX: Dispatch relationshipview updates**
    modifiedRelationshipViews.forEach(rv => {
        let data = JSON.parse(JSON.stringify(rv));
        myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data });
    });
    
    // Store pool/lane updates to dispatch after transaction commits
    const deferredDispatches: Array<{ type: string; data: any }> = [];
    
    // When lane layout completes, check if pool needs to expand to accommodate the lane
    if (layoutMode === "lane_content") {
        const containingPool = groupNode.containingGroup;
        
        if (containingPool instanceof go.Group) {
            const poolHeader = containingPool.findObject("POOL_HEADER_STRIP");
            const poolHeaderWidth = poolHeader?.actualBounds?.width || 36;
            const laneHeader = groupNode.findObject("LANE_HEADER_STRIP");
            const laneHeaderWidth = laneHeader?.actualBounds?.width || 36;
            
            // Calculate required lane body width from actual content bounds after layout
            const laneBody = groupNode.findObject("LANE_BODY_SHAPE");
            const bodyBounds = laneBody?.actualBounds || groupNode.actualBounds;
            const requiredLaneBodyWidth = Math.max(160, bodyBounds.width);
            
            const poolSize = containingPool.data?.size ? go.Size.parse(String(containingPool.data.size)) : null;
            const currentPoolWidth = poolSize?.width || 0;
            const currentAvailableBodyWidth = currentPoolWidth - poolHeaderWidth - laneHeaderWidth;
            
            console.log(`Lane layout complete: required=${requiredLaneBodyWidth}, available=${currentAvailableBodyWidth}`);
            
            // If lane needs more width than available, expand pool and resize all lanes
            if (requiredLaneBodyWidth > currentAvailableBodyWidth) {
                const newPoolWidth = requiredLaneBodyWidth + poolHeaderWidth + laneHeaderWidth;
                const newPoolHeight = poolSize?.height || 600;
                const newPoolSize = `${newPoolWidth} ${newPoolHeight}`;
                
                console.log(`Expanding pool from ${currentPoolWidth} to ${newPoolWidth} to accommodate lane`);
                
                // Update pool size
                myDiagram.model.setDataProperty(containingPool.data, "size", newPoolSize);
                const poolView = myModelview.findObjectView(containingPool.data?.key);
                if (poolView) {
                    poolView.size = newPoolSize;
                    
                    // Prepare pool dispatch for after commit
                    try {
                        const poolData = JSON.parse(JSON.stringify(new jsn.jsnObjectView(poolView)));
                        deferredDispatches.push({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: poolData });
                    } catch (err) {
                        console.error('Failed to serialize pool view for dispatch:', err);
                    }
                }
                
                // Resize ALL lanes in the pool to match new pool width
                containingPool.memberParts.each((siblingPart: go.Part) => {
                    if (siblingPart instanceof go.Group && siblingPart.data?.category === 'Lane') {
                        const siblingLaneBodyWidth = requiredLaneBodyWidth;
                        const siblingHeight = siblingPart.data?.size ? go.Size.parse(String(siblingPart.data.size)).height : 260;
                        const newSiblingSize = `${siblingLaneBodyWidth} ${siblingHeight}`;
                        
                        myDiagram.model.setDataProperty(siblingPart.data, "size", newSiblingSize);
                        const siblingView = myModelview.findObjectView(siblingPart.data?.key);
                        if (siblingView) {
                            siblingView.size = newSiblingSize;
                            
                            // Prepare sibling dispatch for after commit
                            try {
                                const siblingData = JSON.parse(JSON.stringify(new jsn.jsnObjectView(siblingView)));
                                deferredDispatches.push({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: siblingData });
                            } catch (err) {
                                console.error('Failed to serialize sibling lane view for dispatch:', err);
                            }
                        }
                    }
                });
            }
        }
    }
      
    const jsnGroup = new jsn.jsnObjectView(myGroup);
    let data = JSON.parse(JSON.stringify(jsnGroup));
    myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
    
    myDiagram.commitTransaction('doGroupLayout');
    
    // Dispatch deferred updates after transaction commits
    deferredDispatches.forEach(dispatch => {
        myDiagram.dispatch(dispatch);
    });
}

function traverseDFS(node: akm.cxObjectView, visited = new Set()) {
    if (visited.has(node)) {
        return;
    }
    visited.add(node);

    for (const neighbor of node.relations) {
        traverseDFS(neighbor, visited);
    }
}

export function updateNodeAndView(gjsNode: any, goNode: gjs.goObjectNode | null, objview: akm.cxObjectView, myDiagram: any) {
    const nodeKey = goNode?.key || objview?.id || gjsNode?.key;
    if (!nodeKey || !objview || !myDiagram?.model) return;

    myDiagram.startTransaction('updateNode');
    const typeview = objview.typeview;
    for (let it = myDiagram.nodes; it?.next();) {
        const n = it.value;
        const ndata = n.data;
        if (ndata?.key === nodeKey) {
            const sourceNode = goNode || ndata || gjsNode;
            for (let prop in sourceNode) {
                if (prop !== 'key') {
                    if (!(typeof prop === 'object')) {
                        try {
                            if (!typeview || gjsNode[prop] !== typeview[prop] || typeview[prop] === "") {
                                objview[prop] = gjsNode[prop];
                                if (goNode) goNode[prop] = gjsNode[prop];
                                myDiagram.model.setDataProperty(ndata, prop, gjsNode[prop]);
                            }
                        } catch {
                        }
                    }
                    if (prop === 'viewkind') {
                        if (objview[prop] === 'Object') {
                          objview['group'] = "";
                          objview['isGroup'] = false;
                        } else if (objview[prop] === 'Container') {
                          objview['isGroup'] = true;
                        }
                    }
                    if (prop === 'isGroup') {
                        if (objview['size'] == "0 0")
                            objview['size'] = "200 100";
                    }
                }
            }
            goNode?.removeClassInstances?.();
        }
    }
    myDiagram.commitTransaction('updateNode');
}

export function updateLinkAndView(gjsLink: any, goLink: gjs.goRelshipLink, relview: akm.cxRelationshipView, myDiagram: any) {
    myDiagram.startTransaction('updateLink');
    if (!relview) {
        relview = new akm.cxRelationshipView(gjsLink.key, gjsLink.name, gjsLink, "");
    }
    const hideDefaultName = gjsLink?.name === 'flowsTo' || gjsLink?.name === 'isFollowedBy';
    for (let it = myDiagram.links; it?.next();) {
        const link = it.value;
        const ldata = link.data;
        if (ldata?.key !== goLink.key) continue;

        for (const prop in goLink) {
            if (prop === 'key' || prop === 'category') continue;
            if (typeof goLink[prop] === 'function') continue;
            if (gjsLink[prop] === undefined || gjsLink[prop] === null || gjsLink[prop] === "") continue;

            relview[prop] = gjsLink[prop];
            ldata[prop] = gjsLink[prop];
            goLink[prop] = gjsLink[prop];

            if (hideDefaultName && prop === 'name') {
                // Hide default sequence names without corrupting link routing/state.
                gjsLink[prop] = " ";
                goLink[prop] = " ";
                relview[prop] = " ";
                ldata[prop] = " ";
            }

            myDiagram.model.setDataProperty(ldata, prop, gjsLink[prop]);
        }

        const routing = gjsLink?.routing || ldata?.routing || relview?.routing;
        if (shouldPersistLinkPoints(routing, link?.data?.points)) {
            const points = [];
            for (let pit = link.points.iterator; pit?.next();) {
                const point = pit.value;
                points.push(point.x);
                points.push(point.y);
            }
            relview.points = points;
        } else {
            relview.points = [];
            try {
                myDiagram.model.setDataProperty(ldata, 'points', []);
            } catch (_) {
                ldata.points = [];
            }
        }
        break;
    }
    myDiagram.commitTransaction('updateLink');
    return relview;
}

export function alignNodes(node: any, selectedNodes, direction, myMetis: akm.cxMetis) {
    const modifiedObjectViews = new Array();
    const myDiagram = myMetis.myDiagram;
    const myGoModel = myMetis.gojsModel;
    const firstNode = node;
    const firstNodeLoc = firstNode.loc?.split(" ");
    const firstNodeX = parseInt(firstNodeLoc[0]);
    const firstNodeY = parseInt(firstNodeLoc[1]);
    for (let i=0; i<selectedNodes.length; i++) {
        const n = selectedNodes[i];
        let node = n.data;
        const nodeLoc = node.loc?.split(" ");
        if (!nodeLoc) return;
        let nodeLocX = parseInt(nodeLoc[0]);
        let nodeLocY = parseInt(nodeLoc[1]);
        if (direction === 'vertical') {
            nodeLocX = firstNodeX;
            nodeLocY = parseInt(nodeLoc[1]);
        } else if (direction === 'horizontal') {
            nodeLocX = parseInt(nodeLoc[0]);
            nodeLocY = firstNodeY;
        }
        const location = nodeLocX + " " + nodeLocY;
        node.loc = location;

        let myGoNode = myGoModel.findNode(node.key);
        if (!myGoNode) {
            myGoNode = myGoModel.findNodeForKey(node.key);
        }
        if (!myGoNode) {
            continue;
        } else {
            myDiagram.startTransaction('moveNode');
            myGoNode.loc = location;
            const n = myDiagram.findNodeForKey(node.key);
            n.moveTo(nodeLocX, nodeLocY);
            myDiagram.commitTransaction('moveNode');
        }
        let myObjectview = myGoNode.objectview;
        if (!myObjectview) {
            myObjectview = myMetis.currentModelview.findObjectView(node.key);
        }
        myObjectview.loc = location;
        // Prepare dispatch
        const jsnObjview = new jsn.jsnObjectView(myObjectview);
        if (jsnObjview) {
            uic.addItemToList(modifiedObjectViews, jsnObjview);
        }

    }
    modifiedObjectViews.map(ov => {
        let data = ov;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
    });
}

export function spreadEven(node: any, selectedNodes, direction, myMetis: akm.cxMetis) {
    const modifiedObjectViews = new Array();
    const myDiagram = myMetis.myDiagram;
    const myGoModel = myMetis.gojsModel;
    let noNodes = selectedNodes.length;
    let firstNode = getFirstNode(selectedNodes, direction);
    let lastNode = getLastNode(selectedNodes, direction);
    let firstNodeLoc = firstNode.loc?.split(" ");
    let firstNodeX = parseInt(firstNodeLoc[0]);
    let firstNodeY = parseInt(firstNodeLoc[1]);
    let lastNodeLoc = lastNode.loc?.split(" ");
    let lastNodeX = parseInt(lastNodeLoc[0]);
    let lastNodeY = parseInt(lastNodeLoc[1]);
    let diffX = lastNodeX - firstNodeX;
    let diffY = lastNodeY - firstNodeY;
    let diff = 0;
    const sortedNodes = sortNodes(selectedNodes, direction);
    if (direction === 'vertical') {
        diff = diffY;
    } else if (direction === 'horizontal') {
        diff = diffX;
    }
    let spacing = diff / (noNodes - 1);
    for (let i=0; i<sortedNodes.length; i++) {
        let n = sortedNodes[i];
        let node = n.data;
        let nodeLoc = node.loc?.split(" ");
        let nodeLocX = parseInt(nodeLoc[0]);
        let nodeLocY = parseInt(nodeLoc[1]);
        if (direction === 'vertical') {
            nodeLocY = firstNodeY + i * spacing;
        } else if (direction === 'horizontal') {
            nodeLocX = firstNodeX + i * spacing;
        }
        let location = nodeLocX + " " + nodeLocY;
        node.loc = location;
        let myGoNode = myGoModel.findNode(node.key);
        if (!myGoNode) {
            myGoNode = myGoModel.findNodeForKey(node.key);
        }
        if (!myGoNode) {
            continue;
        } else {
            myDiagram.startTransaction('moveNode');
            myGoNode.loc = location;
            let n = myDiagram.findNodeForKey(node.key);
            n.moveTo(nodeLocX, nodeLocY);
            myDiagram.commitTransaction('moveNode');
        }
        let myObjectview = myGoNode.objectview;
        if (!myObjectview) {
            myObjectview = myMetis.currentModelview.findObjectView(node.key);
        }
        myObjectview.loc = location;
        // Prepare dispatch
        let jsnObjview = new jsn.jsnObjectView(myObjectview);
        if (jsnObjview) {
            uic.addItemToList(modifiedObjectViews, jsnObjview);
        }
    }
    modifiedObjectViews.map(ov => {
        let data = ov;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
    });
}

function sortNodes(selectedNodes, direction) {
    let sortedNodes = new Array();
    if (direction === 'vertical') {
        sortedNodes = selectedNodes.sort((a, b) => {
            let aLoc = a.data.loc?.split(" ");
            let bLoc = b.data.loc?.split(" ");
            let aY = parseInt(aLoc[1]);
            let bY = parseInt(bLoc[1]);
            return aY - bY;
        });
    } else if (direction === 'horizontal') {
        sortedNodes = selectedNodes.sort((a, b) => {
            let aLoc = a.data.loc?.split(" ");
            let bLoc = b.data.loc?.split(" ");
            let aX = parseInt(aLoc[0]);
            let bX = parseInt(bLoc[0]);
            return aX - bX;
        });
    }
    return sortedNodes;
}

function getFirstNode(selectedNodes, direction):any  {
    let firstNode = selectedNodes[0].data;
    let firstNodeLoc = firstNode.loc?.split(" ");
    let firstNodeX = parseInt(firstNodeLoc[0]);
    let firstNodeY = parseInt(firstNodeLoc[1]);
    for (let i=1; i<selectedNodes.length; i++) {
        let n = selectedNodes[i];
        let node = n.data;
        let nodeLoc = node.loc?.split(" ");
        let nodeX = parseInt(nodeLoc[0]);
        let nodeY = parseInt(nodeLoc[1]);
        if (direction === 'vertical') {
            if (nodeY < firstNodeY) {
                firstNode = node;
                firstNodeLoc = nodeLoc;
                firstNodeX = nodeX;
                firstNodeY = nodeY;
            }
        } else if (direction === 'horizontal') {
            if (nodeX < firstNodeX) {
                firstNode = node;
                firstNodeLoc = nodeLoc;
                firstNodeX = nodeX;
                firstNodeY = nodeY;
            }
        }
    }
    return firstNode;
}

function getLastNode(selectedNodes, direction):any  {
    let lastNode = selectedNodes[0].data;
    let lastNodeLoc = lastNode.loc?.split(" ");
    let lastNodeX = parseInt(lastNodeLoc[0]);
    let lastNodeY = parseInt(lastNodeLoc[1]);
    for (let i=1; i<selectedNodes.length; i++) {
        let n = selectedNodes[i];
        let node = n.data;
        let nodeLoc = node.loc?.split(" ");
        let nodeX = parseInt(nodeLoc[0]);
        let nodeY = parseInt(nodeLoc[1]);
        if (direction === 'vertical') {
            if (nodeY > lastNodeY) {
                lastNode = node;
                lastNodeLoc = nodeLoc;
                lastNodeX = nodeX;
                lastNodeY = nodeY;
            }
        } else if (direction === 'horizontal') {
            if (nodeX > lastNodeX) {
                lastNode = node;
                lastNodeLoc = nodeLoc;
                lastNodeX = nodeX;
                lastNodeY = nodeY;
            }
        }
    }
    return lastNode;
}

export function clearPath(selectedLinks, myMetis, myDiagram) {
    const myModelview = myMetis.currentModelview;
    const myGoModel = myMetis.gojsModel;
    const modifiedRelshipViews = new Array();
    for (let i=0; i<selectedLinks.length; i++) {
        const sel = selectedLinks[i];
        const link = sel.data;
        const fromLink = link.from;
        const toLink = link.to;
        const isSelfLoop = String(fromLink || "") !== "" && String(fromLink || "") === String(toLink || "");
        let relview: akm.cxRelationshipView;
        relview = myModelview.findRelationshipView(link.relviewRef || link.key) || link.relshipview;
        if (relview) {
            const fromObjview = relview.fromObjview;
            const toObjview = relview.toObjview;
            const reltypeName = relview?.relship?.type?.name || link?.relshipview?.relship?.type?.name || "";
            link.points = [];
            link.from = fromLink;
            link.to = toLink;
            myDiagram.model.setDataProperty(link, "points", []);
            const resetRouting = uib.getDefaultRoutingForRelshipType(reltypeName, relview.routing || "Normal");
            try { myDiagram.model.setDataProperty(link, "routing", resetRouting); } catch (_) {}
            relview.points = [];
            relview.routing = resetRouting;
            relview.fromObjview = fromObjview;
            relview.toObjview = toObjview;
            try {
                if (link.relshipview) {
                    link.relshipview.points = [];
                    link.relshipview.routing = resetRouting;
                }
            } catch (_) {}
            try {
                const liveLink = myDiagram.findLinkForKey(link.key);
                if (liveLink) {
                    liveLink.points = new go.List<go.Point>();
                    liveLink.invalidateRoute();
                    liveLink.updateRoute();
                    liveLink.updateTargetBindings();
                }
            } catch (_) {}
            try {
                const goLink = myGoModel?.findLink?.(link.key);
                if (goLink) {
                    goLink.points = [];
                    goLink.routing = resetRouting;
                    if (goLink.data) {
                        goLink.data.points = [];
                        goLink.data.routing = resetRouting;
                        goLink.data.relshipview = relview;
                    }
                    goLink.relshipview = relview;
                }
            } catch (_) {}
            const jsnRelView = new jsn.jsnRelshipView(relview);
            modifiedRelshipViews.push(jsnRelView);
        }
    };
    try {
        delete (myDiagram as any).__manualLinkMovePreview;
    } catch (_) {}
    modifiedRelshipViews.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
    });
    try { myDiagram.requestUpdate(); } catch (_) {}
}

export function editTraverseDialog() {
    
}

export function swapDirectionIsAllowed(link, modelview: akm.cxModelView, metamodel: akm.cxMetaModel) {
    let retval = false;
    let fromTypeId;
    let toTypeId;
    let relshpType = link.relship?.type;
    fromTypeId = link.relship?.fromObject.type.id;
    if (!fromTypeId) {
        let relview = modelview.findRelationshipView(link.relviewRef);
        if (relview)
            fromTypeId = relview.fromObjview?.objecttype.id;
    }
    toTypeId = link.relship?.toObject.type.id;
    if (!toTypeId) {
        let relview = modelview.findRelationshipView(link.relviewRef);
        if (relview)
            toTypeId = relview.toObjview?.objecttype.id;
    }

    // Check if the swap direction is allowed based on your criteria
    if (fromTypeId && toTypeId) {
        // Example criteria: both links must be of the same type
        if (fromTypeId === toTypeId)
            retval = true;
    }
    if (relshpType?.name === 'refersTo')
            retval = true;
    return retval;
}

export function swapDirection(selectedLinks, myMetis: akm.cxMetis, myDiagram) {
    const myModelview = myMetis.currentModelview;
    const modifiedRelshipViews = new Array();
    for (let i=0; i<selectedLinks.length; i++) {
        const sel = selectedLinks[i];
        const link = sel.data;
        const reltype: akm.cxRelationshipType = myMetis.findRelationshipType(link.reltypeRef);
        const fromTypeId = link.fromNode.objecttype.id;
        const toTypeId = link.toNode.objecttype.id;
        let relview: akm.cxRelationshipView;
        relview = myModelview.findRelationshipView(link.key);
        if (relview ) {
            const fromObjview = relview.fromObjview;
            const toObjview = relview.toObjview;
            relview.fromObjview = toObjview;
            relview.toObjview = fromObjview;
            const jsnRelView = new jsn.jsnRelshipView(relview);
            modifiedRelshipViews.push(jsnRelView);
        }
        let linkfromNode = link.fromNode;
        let linktoNode = link.toNode;
        link.fromNode = linktoNode;
        link.toNode = linkfromNode;
        myDiagram.model.setDataProperty(link, "from", link.fromNode.key);
        myDiagram.model.setDataProperty(link, "to", link.toNode.key);
    }
    modifiedRelshipViews.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data });
    });
}
