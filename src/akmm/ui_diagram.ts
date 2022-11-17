// @ts-nocheck
const debug = false; 
import * as go from 'gojs';
import * as utils from './utilities';
import * as uic from './ui_common';
import * as uit from './ui_templates';
import * as ui_mtd from './ui_methods';
import * as akm from './metamodeller';
import * as gjs from './ui_gojs';
import * as jsn from './ui_json';
import { setMyGoModel } from '../actions/actions';
const constants = require('./constants');
const printf = require('printf');

const $ = go.GraphObject.make;

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
            if (debug) console.log('35 New Metamodel', jsnMetamodel);
            const modifiedMetamodels = new Array();
            modifiedMetamodels.push(jsnMetamodel);
            modifiedMetamodels.map(mn => {
                let data = mn;
                if (debug) console.log('40 data', data);
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

export function addMetamodel(myMetis: akm.cxMetis, myDiagram: any) {
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

export function exportTaskModel(node: any, myMetis: akm.cxMetis, myDiagram: any) {
    if (debug) console.log('163 node', node);
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
    } else {
      const modelView = new akm.cxModelView(utils.createGuid(), modelviewName, model, "");
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
        const obj = objview.object;
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

export function editObject(node: any, myMetis: akm.cxMetis, myDiagram: any) {
    if (debug) console.log('417 myMetis', myMetis);
    const icon = uit.findImage(node?.icon);
    const modalContext = {
      what:       "editObject",
      title:      "Edit Object",
      icon:       icon,
      myDiagram:  myDiagram
    }
    myMetis.currentNode = node;
    myMetis.myDiagram = myDiagram;
    if (debug) console.log('427 node, modalContext', node, modalContext);
    if (debug) console.log('428 myMetis', myMetis);
    myDiagram.handleOpenModal(node, modalContext);
}

export function editObjectType(node: any, myMetis: akm.cxMetis, myDiagram: any) {
    const icon = uit.findImage(node?.icon);
    const modalContext = {
      what:       "editObjectType",
      title:      "Edit Object Type",
      icon:       icon,
      myDiagram:  myDiagram
    }
    myMetis.currentNode = node;
    myMetis.myDiagram = myDiagram;
    if (debug) console.log('230 editObjectType');
    myDiagram.handleOpenModal(node, modalContext);
}

export function editObjectview(node: any, myMetis: akm.cxMetis, myDiagram: any) {
    if (debug) console.log('415 selection', myDiagram.selection);
    const icon = uit.findImage(node.icon);
    const modalContext = {
      what:       "editObjectview",
      title:      "Edit Object View",
      icon:       icon,
      myDiagram:  myDiagram
    }
    myMetis.currentNode = node;
    myMetis.myDiagram = myDiagram;
    myDiagram.handleOpenModal(node, modalContext);
}    

export function editTypeview(node: any, myMetis: akm.cxMetis, myDiagram: any) {
    const icon = uit.findImage(node.icon);
    const modalContext = {
      what:       "editTypeview",
      title:      "Edit Typeview",
      icon:       icon,
      myDiagram:  myDiagram
    }
    myMetis.currentNode = node;
    myMetis.myDiagram = myDiagram;
    myDiagram.handleOpenModal(node, modalContext);
}    

export function editModelview(node: any, myMetis: akm.cxMetis, myDiagram: any) {
    const icon = "";
    const modalContext = {
      what:       "editModelview",
      title:      "Edit Modelview",
      icon:       icon,
      myDiagram:  myDiagram
    }
    myMetis.currentNode = node;
    myMetis.myDiagram = myDiagram;
    myDiagram.handleOpenModal(node, modalContext);
}    

export function resetToTypeview(inst: any, myMetis: akm.cxMetis, myDiagram: any) {
    const n = myDiagram.findNodeForKey(inst.key);
    if (n) {
        const oview = myMetis.findObjectView(inst.objectview.id);
        const otview = oview.typeview;
        const otdata = otview.data;
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
    const l = myDiagram.findLinkForKey(inst.key);
    if (l) {
        if (debug) console.log('463 inst', inst);
        const rview = myMetis.findRelationshipView(inst.relshipview.id);
        const rtview = rview.typeview;
        const rtdata = rtview.data;
        if (debug) console.log('467 rview, rtview, rtdata', rview, rtview, rtdata);
        for (let prop in rtdata) {
            switch(prop) {
                case 'name':
                case 'nameId':
                case 'description':
                case 'fs_collection':
                case 'markedAsDeleted':
                case 'modified':
                case 'sourceUri':
                case 'typeRef':
                case 'abstract':
                case 'class':
                case 'relshipkind':      
                    continue;              
            }
            rview[prop] = "";
            if (debug) console.log('471 prop, rview[prop]', prop, rview[prop]);
            myDiagram.model.setDataProperty(l.data, prop, rtview[prop]);
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
        })
    }
}

export function addConnectedObjects(node: any, myMetis: akm.cxMetis, myDiagram: any) {
    myMetis.myDiagram = myDiagram;
    let modelview = myMetis.currentModelview;
    modelview = myMetis.findModelView(modelview.id);
    const goModel = myMetis.gojsModel;
    const objview = node?.objectview;
    let noLevels = '1';
    noLevels = prompt('Enter no of sublevels to follow', noLevels);
    if (debug) console.log('222 objview', objview);
    ui_mtd.addConnectedObjects(modelview, objview, null, goModel, myMetis, noLevels);
    const gjsNode = myDiagram.findNodeForKey(node?.key);
    if (debug) console.log('225 gjsNode', gjsNode);
    gjsNode.isSelected = false;
    gjsNode.isHighlighted = true;
}

export function updateProjectFromAdminmodel(myMetis: akm.cxMetis, myDiagram: any) {
    const adminMetamodel = myMetis.findMetamodelByName(constants.admin.AKM_ADMIN_MM);
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
    let linktypeNames = [];
    let n = myDiagram.findNodeForKey(node.key);
    let links = n.findLinksOutOf();
    if (debug) console.log('596 links', links);
    for (let it = links?.iterator; it?.next();) {
        let l = it.value;
        const ltypename = l.data.name;
        linktypeNames.push(ltypename);
    }
    if (debug) console.log('603 linktypeNames', linktypeNames);
    let uniqueSet = utils.removeArrayDuplicates(linktypeNames);
    linktypeNames = uniqueSet;
    let reltypeNames = [];
    const myMetamodel = myMetis.currentMetamodel;
    if (debug) console.log('608 myMetamodel', myMetamodel);
    let objtypenames = [];
    let objtypes = [];
    let fromType = node.objecttype;
    fromType = myMetis.findObjectType(fromType.id);
    for (let it = selection.iterator; it?.next();) {
        let n = it.value;
        if (n.data.key === node.key) 
            continue;
        // Check if a link of this type already exists
        // If so, continue
        if (n.data.objecttype) {
            objtypes.push(n.data.objecttype);
            objtypenames.push(n.data.objecttype.name);
        }
    }
    uniqueSet = utils.removeArrayDuplicates(objtypenames);
    objtypenames = uniqueSet;
    uniqueSet = utils.removeArrayDuplicates(objtypes);
    objtypes = uniqueSet;
    if (debug) console.log('626 objtypenames, objtypes', objtypenames, objtypes);
    if (debug) console.log('627 myMetis', myMetis);
    const myModelview = myMetis.currentModelview;
    const includeInheritedReltypes = myModelview.includeInheritedReltypes;
    let reltypes = [];
    // Walk through selected object's types (objtypes)
    for (let i=0; i<objtypes.length; i++) {
        let toType = objtypes[i];
        toType = myMetis.findObjectType(toType.id);
        if (debug) console.log('632 fromType, toType', fromType, toType);
        const rtypes = myMetamodel.findRelationshipTypesBetweenTypes(fromType, toType, includeInheritedReltypes);
        if (i == 0) {
            // First time
            reltypes = rtypes;
            if (debug) console.log('637 reltypes', reltypes);
        } else {
            // The other times
            const types = utils.getIntersection(reltypes, rtypes);
            if (debug) console.log('641 reltypes, rtypes, types', reltypes, rtypes, types);
            reltypes = types;
        }
        for (let i=0; i<reltypes.length; i++) {
            const rtname = reltypes[i].name;
            reltypeNames.push(rtname);
        }
    }
    if (debug) console.log('648 reltypeNames', reltypeNames);
    if (reltypeNames.length > 0) {
        uniqueSet = utils.removeArrayDuplicates(reltypeNames);
        reltypeNames = uniqueSet;
        let difference = reltypeNames.filter(x => !linktypeNames.includes(x));
        reltypeNames = difference;
        reltypeNames.sort();
    }
    if (debug) console.log('655 reltypeNames', reltypeNames);
    return reltypeNames;
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
        if (!metaModel)
            continue;
        if (metaModel.markedAsDeleted)
            continue;
        if (metaModel.name === constants.admin.AKM_ADMIN_MM)
            continue;
        if (myMetamodel && (metaModel.id === myMetamodel?.id)) {
            if (context.case !== 'New Model')
                continue;
        }

        switch (context.case) {
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
    if (debug) console.log('271 currentMetamodel, metamodel', currentMetamodel, metamodel);

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
    if (debug) console.log('894 relshiptypes', relshiptypes);
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
    currentMetamodel.addSubMetamodel(metamodel);
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
        for (let i=0; i<models.length; i++) {
            const model = models[i];
            deleteModel2(model, myMetis, myDiagram);
        }
        metamodel.markedAsDeleted = true;
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
            const jsnModel = new jsn.jsnModel(generatedFromModel, false);
            let data = JSON.parse(JSON.stringify(jsnModel));
            myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data });
        }       
    }
    const jsnMetamodel = new jsn.jsnMetaModel(metamodel, true);
    let data = JSON.parse(JSON.stringify(jsnMetamodel));
    myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data });
    uic.purgeMetaDeletions(myMetis, myDiagram);     
    if (debug) console.log('302 myMetis', myMetis);
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
            //                 if (prop === 'abstract') continue;
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
    if (metamodel.name === constants.admin.AKM_ADMIN_MM) {
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
    const jsnModel = new jsn.jsnModel(model, true);
    if (debug) console.log('376 jsnModel', jsnModel);
    modifiedModels.push(jsnModel);
    modifiedModels.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
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
    // msg += printf(format2, "-Type", d.object.type.name);
    // msg += printf(format2, "-Title", d.object.type.title);
    // msg += printf(format2, "-Descr", breakString(d.object.type.description, 64));
    // // msg += printf(format2, "-Descr", d.object.type.description);
    // msg += "\n";
    msg += printf(format2, "Name", d.name);
    // msg += printf(format2, "-Title", d.object.title);
    msg += printf(format2, "Descr.", breakString(d.object.description, 64));
    // msg += "-------------------\n";
    // msg = "Object \Type props:\n";
    msg += printf(format2, "Type", d.object.type.name);
    // msg += ")";
    // msg += printf(format2, "-Title", d.object.type.title);
    //   msg += printf(format2, "-Descr", breakString(d.object.type.description, 64));
    
    
    // msg += printf(format2, "-ViewFormat", d.object.viewFormat);
    // msg += printf(format2, "-FieldType", d.object.fieldType);
    // msg += printf(format2, "-Inputpattern", d.object.inputPattern);
    // msg += printf(format2, "-InputExample", d.object.inputExample);
    // msg += printf(format2, "-Value", d.object.value);
    // if (debug) console.log('1115 msg', msg);
    if (d.group) {
        const group = myMetis.gojsModel.findNode(d.group);
        msg += "------parent-------\n";
        msg += printf(format2, "Name", group.name);
        msg += printf(format2, "Type", group.typename);
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
