// @ts- nocheck
const debug = false; 
import * as go from 'gojs';
import * as utils from './utilities';
import * as uic from './ui_common';
import * as uit from './ui_templates';
import * as ui_mtd from './ui_methods';
import * as akm from './metamodeller';
import * as gjs from './ui_gojs';
import * as gql from './ui_graphql';
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
            const gqlMetamodel = new gql.gqlMetaModel(metamodel, true);
            if (debug) console.log('35 New Metamodel', gqlMetamodel);
            const modifiedMetamodels = new Array();
            modifiedMetamodels.push(gqlMetamodel);
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

export function newModelview(myMetis: akm.cxMetis, myDiagram: any) {
    const model = myMetis.currentModel;
    const modelviewName = prompt("Enter Modelview name:", "");
    if (modelviewName == null || modelviewName === "") {
      alert("New operation was cancelled");
    } else {
      const modelView = new akm.cxModelView(utils.createGuid(), modelviewName, model, "");
      model.addModelView(modelView);
      myMetis.addModelView(modelView);
      if (debug) console.log('102 myMetis', myMetis);
      let data = new gql.gqlModel(model, true);
      data = JSON.parse(JSON.stringify(data));
      if (debug) console.log('104 NewModelView', data);
      myDiagram.dispatch({ type: 'LOAD_TOSTORE_NEWMODELVIEW', data });
    }
}

export function deleteModelview(modelView: akm.cxModelView, myMetis: akm.cxMetis, myDiagram: any) {
    modelView.markedAsDeleted = true;
    const gqlModelview = new gql.gqlModelView(modelView);
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
    modifiedModelviews.push(gqlModelview);
    modifiedModelviews.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data });
    });
    uic.purgeDeletions(myMetis, myDiagram);
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
              const gqlObj = new gql.gqlObject(obj);
              modifiedObjects.push(gqlObj);
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
              const gqlObjview = new gql.gqlObjectView(objview);
              modifiedObjviews.push(gqlObjview);
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
    const icon = uit.findImage(node.icon);
    const modalContext = {
      what:       "editObject",
      title:      "Edit Object",
      icon:       icon,
      myDiagram:  myDiagram
    }
    myMetis.currentNode = node;
    myMetis.myDiagram = myDiagram;
    myDiagram.handleOpenModal(node, modalContext);
}

export function editObjectview(node: any, myMetis: akm.cxMetis, myDiagram: any) {
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

function askForMetamodel(context: any) {
    if (debug) console.log('223 context', context);
    const myMetis = context.myMetis;
    let myMetamodel = context.myCurrentMetamodel;
    const myDiagram = context.myDiagram;
    const modalContext = {
        what:           "selectDropdown",
        title:          context.title,
        case:           context.case,
        myDiagram:      myDiagram,
        context:        context,
      } 
      const metaModels = new Array();
      const allMetaModels = myMetis.metamodels;
      for (let i=0; i<allMetaModels.length; i++) {
        const metaModel = allMetaModels[i];
        if (metaModel.markedAsDeleted)
            continue;
        if (context.case === "Delete Metamodel") {
            if (metaModel.id === myMetamodel.id)
                continue;
        }
        metaModels.push(metaModel);
      }
      const mmNameIds = metaModels.map(mm => mm && mm.nameId);
      if (debug) console.log('238', mmNameIds, modalContext, context);
      myDiagram.handleOpenModal(mmNameIds, modalContext);
}

function replaceCurrentMetamodel2(context: any) {
    const metamodel = context.args.metamodel;
    const myMetis = context.myMetis;
    const myModel = context.myCurrentModel;
    const myDiagram = context.myDiagram;
    const otypeDefault = myMetis.findObjectTypeByName('Generic');
    const rtypeDefault = myMetis.findRelationshipTypeByName('isRelatedTo');
    if (!debug) console.log('287 metamodel, myMetis', metamodel, myMetis);
    myModel.metamodel = metamodel;
    const objects = myModel.objects;
    for (let i=0; i<objects?.length; i++) {
        const object = objects[i];
        if (!object) continue;
        const otypeName = object.type?.name;
        const objtype = metamodel.findObjectTypeByName(otypeName);
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
        const toObjName = relship.toObject?.type?.name;
        const fromObjName = relship.fromObject?.type?.name;
        const rtypeName = relship.type?.name;
        let reltype = metamodel.findRelationshipTypeByNames(rtypeName, toObjName, fromObjName);
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
    const modifiedModels = []
    const gqlModel = new gql.gqlModel(myModel, true);
    if (debug) console.log('376 gqlModel', gqlModel);
    modifiedModels.push(gqlModel);
    modifiedModels.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data });
    });
}

function deleteMetamodel2(context: any) {
    const metamodel = context.args.metamodel;
    const myMetis = context.myMetis;
    const myDiagram = context.myDiagram;
    if (debug) console.log('271 metamodel, myMetis', metamodel, myMetis);
    const modifiedMetamodels = new Array();
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
        const gqlMetamodel = new gql.gqlMetaModel(metamodel, true);
        if (debug) console.log('293 gqlMetamodel', gqlMetamodel);
        modifiedMetamodels.push(gqlMetamodel);
        modifiedMetamodels.map(mn => {
          let data = mn;
          data = JSON.parse(JSON.stringify(data));
          myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data });
        });

        uic.purgeDeletions(myMetis, myDiagram);
    } 
    if (debug) console.log('302 myMetis', myMetis);
}

function createModel(context: any) {
    const metamodel = context.args.metamodel;
    if (debug) console.log('51 Metamodel chosen: ', metamodel);
    if (!metamodel) return;
    const myMetis = context.myMetis;
    const myDiagram = context.myDiagram;
    const modelName = prompt("Enter Model name:", "");
    if (modelName == null || modelName === "") {
        alert("New operation was cancelled");
    } else {
        const model = new akm.cxModel(utils.createGuid(), modelName, metamodel, "");
        myMetis.addModel(model);
        const modelviewName = prompt("Enter Modelview name:", model.name);
        if (modelviewName == null || modelviewName === "") {
            alert("New operation was cancelled");
        } else {
            // const curmodel = myMetis.currentModel;
            const modelView = new akm.cxModelView(utils.createGuid(), modelviewName, model, "");
            if (metamodel?.viewstyle) 
            modelView.viewstyle = metamodel.viewstyle;
            model.addModelView(modelView);
            myMetis.addModelView(modelView);
            let data = new gql.gqlModel(model, true);
            if (debug) console.log('35 gqlModel', data);
            data = JSON.parse(JSON.stringify(data));
            myDiagram.dispatch({ type: 'LOAD_TOSTORE_NEWMODELVIEW', data }); // dispatches model with modelview
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
    const gqlModel = new gql.gqlModel(model, true);
    if (debug) console.log('376 gqlModel', gqlModel);
    modifiedModels.push(gqlModel);
    modifiedModels.map(mn => {
        let data = mn;
        data = JSON.parse(JSON.stringify(data));
        myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data });
    });
    alert("The model '" + model.name + "' has been deleted!");
    uic.purgeDeletions(myMetis, myDiagram);
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
    if (debug) console.log('506 nodeInfo', d, d.object);

    const format1 = "%s\n";
    const format2 = "%-10s: %s\n";

    let msg = "";
    // let msg = "Object Type props:\n";
    // msg += "-------------------\n";
    // msg += printf(format2, "-Type", d.object.type.name);
    // msg += printf(format2, "-Title", d.object.type.title);
    // msg += printf(format2, "-Descr", breakString(d.object.type.description, 64));
    // // msg += printf(format2, "-Descr", d.object.type.description);
    // msg += "\n";
    msg += "Attributes :\n";
    msg += "---------------------\n";
    msg += printf(format2, "-Name", d.name);
    msg += printf(format2, "-Title", d.object.title);
    msg += printf(format2, "-Description", breakString(d.object.description, 64));
    msg += printf(format2, "-ViewFormat", d.object.viewFormat);
    msg += printf(format2, "-FieldType", d.object.fieldType);
    msg += printf(format2, "-Inputpattern", d.object.inputPattern);
    msg += printf(format2, "-InputExample", d.object.inputExample);
    msg += printf(format2, "-Value", d.object.value);
    if (d.group) {
      const group = myMetis.gojsModel.findNode(d.group);
      msg += printf(format2, "member of", group.name);
    }
    if (debug) console.log('991 msg', msg);
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
    if (debug) console.log('605 nodeInfo', msg);
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
