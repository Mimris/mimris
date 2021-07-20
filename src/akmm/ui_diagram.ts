// @ts- nocheck
const debug = false; 
// import * as go from 'gojs';
import * as utils from './utilities';
import * as uic from './ui_common';
import * as ui_mtd from './ui_methods';
import * as akm from './metamodeller';
import * as gjs from './ui_gojs';
import * as gql from './ui_graphql';
//import { ButtonGroupProps } from 'reactstrap';
const constants = require('./constants');
const printf = require('printf');

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
                myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data });
            });
        }
    }
}

export function deleteMetamodel(myMetis: akm.cxMetis, myDiagram: any) {
    const modifiedMetamodels = new Array();
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

export function deleteModel(model: akm.cxModel, myDiagram: any) {
    const modifiedModels = new Array();
    model.markedAsDeleted = true;
    const gqlModel = new gql.gqlModel(model, true);
    if (debug) console.log('97 gqlModel', gqlModel);
    modifiedModels.push(gqlModel);
    modifiedModels.map(mn => {
        let data = mn;
        myDiagram.dispatch({ type: 'UPDATE_MODEL_PROPERTIES', data });
    })
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
      const data = new gql.gqlModel(model, true);
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
        myDiagram.dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data });
    });
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
          myDiagram.dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
        })              
        if (debug) console.log('180 myMetis', myMetis);
    }

}

export function editObject(node: any, myMetis: akm.cxMetis, myDiagram: any) {
    const icon = findImage(node.icon);
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
    const icon = findImage(node.icon);
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

function deleteMetamodel2(context: any) {
    const metamodel = context.args.metamodel;
    const myMetis = context.myMetis;
    const myDiagram = context.myDiagram;
    if (debug) console.log('70 metamodel, myMetis', metamodel, myMetis);
    const modifiedMetamodels = new Array();
    const models = myMetis.getModelsByMetamodel(metamodel, false);
    if (debug) console.log('73 models', models);
    let doDelete = false;
    if (models.length > 0) {
        let msg = "There are models based on the chosen metamodel.\n";
        msg += "The models will also be deleted!\n";
        msg += "Do you still want to continue?";
        doDelete = confirm(msg);
    } else {
        doDelete = confirm('Do you really want to delete the chosen metamodel?');
    }
    if (!doDelete) {
            return;
    } else {
        for (let i=0; i<models.length; i++) {
            const model = models[i];
            deleteModel(model, myDiagram);
        }
        metamodel.markedAsDeleted = true;
        const gqlMetamodel = new gql.gqlMetaModel(metamodel, true);
        if (debug) console.log('91 gqlMetamodel', gqlMetamodel);
        modifiedMetamodels.push(gqlMetamodel);
        modifiedMetamodels.map(mn => {
          let data = mn;
          myDiagram.dispatch({ type: 'UPDATE_METAMODEL_PROPERTIES', data });
        });
    } 
    if (debug) console.log('99 myMetis', myMetis);
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
            model.addModelView(modelView);
            myMetis.addModelView(modelView);
            const data = new gql.gqlModel(model, true);
            if (debug) console.log('35 gqlModel', data);
            myDiagram.dispatch({ type: 'LOAD_TOSTORE_NEWMODELVIEW', data }); // dispatches model with modelview
        }
    }
}

// Function to identify images related to an image id
function findImage(image: string) {
    if (!image)
        return "";
    // if (image.substring(0,4) === 'http') { // its an URL
    if (image.includes('//')) { // its an URL   
        // if (debug) console.log('1269 Diagram', image);
        return image
    } else if (image.includes('/')) { // its a local image
        if (debug) console.log('1270 Diagram', image);   
        return image
    } else if (image.includes('.') === false) { // its a 2character icon 1st with 2nd as subscript
        const firstcharacter = image.substring(0, 1)
        const secondcharacter = image.substring(1, 2)
        if (debug) console.log('1099 Diagram', firstcharacter, secondcharacter)    
        // } else if (image.substring(image.length - 4) === '.svg') { //sf tried to use svg data but did not work
        //   const letter = image.substring(0, image.length - 4)
        //   // const lettersvg = letter
        //   if (debug) console.log('1058 Diagram', letter, svgs[letter])
        //   return svgs[letter].svg //svgs[`'${letter}'`]
        // } else if (image.includes('fakepath')) { // its a local image
        //   console.log('3025', image);
        //   console.log("3027 ./../images/" + image.replace(/C:\\fakepath\\/,'')) //its an image in public/images
        //   return "./../images/" + image.replace(/C:\\fakepath\\/,'') //its an image in public/images
    } else if (image.includes('<svg')) { // its an icon font
        const img = {image:'data:image/svg+xml;charset=UTF-8,image'}
        console.log('3585', img);
        return img

    } else { 
        if (debug) console.log('1283 Diagram', image);
        return "./../images/" + image //its an image in public/images
    }
    return "";
    }

// Function to specify default text style
function textStyle() {
return { font: "9pt  Segoe UI,sans-serif", stroke: "black" };
}

// Function to highlight group
function highlightGroup(e: any, grp: any, show: boolean) {
if (!grp) return;
e.handled = true;
if (show) {
    // cannot depend on the grp.diagram.selection in the case of external drag-and-drops;
    // instead depend on the DraggingTool.draggedParts or .copiedParts
    var tool = grp.diagram.toolManager.draggingTool;
    var map = tool.draggedParts || tool.copiedParts;  // this is a Map
    // now we can check to see if the Group will accept membership of the dragged Parts
    if (grp.canAddMembers(map.toKeySet())) {
    grp.isHighlighted = true;
    return;
    }
}
grp.isHighlighted = false;
}
  